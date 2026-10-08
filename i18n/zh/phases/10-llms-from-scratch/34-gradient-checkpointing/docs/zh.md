# 渐进检查和激活再计算

> 后传会保留每一个中间激活值. 在70B参数和128K背景下,每个级别的激活值可达3TB.

**Type:** Build
**语言:**鱼 (鱼)
**前置要求:**阶段10课04 (预训练迷你GPT),阶段10课05 (规模化和分布式)
**Time:** ~70 分钟

## 问题

训练变压器 会为每层保存后面 中需要求导的每一个操作的输入:注意输入,Q/K/V投影,软max输出,FFN输入,规范输出以及残余流量.`d`序列长度为`L` 批量为`B`现在,我们在一个层,`12 * B * L * d`个浮点数.

对于`d=8192, L=8192, B=1`这在BF16 下是800MB/层. 一个64层模型的激活值是51GB,这还没有乘以微型块大小,也没有加上注意力软max中间体.`L^2`),更没有计入子平行部分副本.

这是双边账单:BF16重量加上优化状态可能放进80GB,但激活值会让你超出限制――渐进检查点 (Gradient checkpointing) 也称为激活重计算) 是标准修复方案――丢弃大多数激活值;在倒退期重新执行前进来取回它们――代价:额外的FLOPs――收益:内存 按检查点段与总层比例下降――

简单实现时,检查点 每一步大约会花费33%的前进通过FLOPs. 实现好时,即根据Korthikanti等的智能选择做选择性检查点,你可以在5%以下的FLOP 开销下节省5x内存.

## 概念

### 倒退的实际需要什么

`output = layer(input)`回去 想要`grad_input`和 `grad_params`为了计算它们,它需要:

- `input`(用于线性层中计算`grad_params = input.T @ grad_output`)
- 部分激活导数中量(ReLU/GELU/softmax 的导数依赖激活值)

通过前进 会在自动保存这些内容.`tensor.retain_grad()`并且每个需要输入的操作都会保留一个引用.

### 朴素 完全检查

把网络拆除`N`个段子――前进 期间,只保存每个段子的 *输入*――当后退 需要中间量时,重新运行该段子的前进通行 来物化它们,然后再求导――

示例:32层变压器 拆分成32个段,每个段 1层.

- 记忆:32 个层输入(小) 对比32 *(每层激活量)
- 额外计算:每段额外 1 次前进,也就是总前进FLOP 增加了约33% ((因为后退是前进的2x,完整步骤从1 + 2 = 3 个单位变为1 + 1 + 2 = 4 个单位) 

这是最初的陈等人2016年的方案:每`sqrt(L)`层放一个检查点,以平衡记忆和计算.

### 选择性检查 (科尔蒂坎蒂 2022)

不是所有激活值的成本都一样.`B*L*L*heads`,并随序列长度 *二次* 增长──FFN隐藏激活 是 `B*L*4d`对于长序列,软max 占主导地位.

选择性检查会保留存储成本低的激活值,只重新计算昂贵的部分,注意力.

特龙核心将实现其作为选择性激活重新计算.

### 放电

重新计算的替代方案:在前进和后退之间将激活值传输到CPU RAM――它需要PCIe带宽;当空带宽的收益高于再材料化 成本时很有用――混合策略很常见:一些层检查点,另一些放弃――

作为一等选项提供了. 当GPU受记忆限制,但CPU-GPU转移还有余量时,

### 计算成本模型

每个`k`检查站 一次,总共`L`层时,朴素检查点的每步FLOP:

```
flops_fwd_normal = L * f_layer
flops_bwd_normal = 2 * L * f_layer
flops_total_normal = 3 * L * f_layer

flops_fwd_ckpt = L * f_layer
flops_recompute = L * f_layer  # one extra forward per layer in the segment
flops_bwd_ckpt = 2 * L * f_layer
flops_total_ckpt = 4 * L * f_layer
overhead = 4 / 3 - 1 = 0.33 = 33%
```

通过选择性检查点,你只重新计算注意力内核,而不是整个层次:

```
flops_recompute_selective = L * f_attention ~= L * f_layer * 0.15
overhead_selective = (3 + 0.15) / 3 - 1 = 0.05 = 5%
```

### 存储记忆模型

每层激活量:`A`为了`L`层,总激活内存:`L * A`,我知道.

完整检查点 (段子大小1):只保存`L * input_volume`(对于标准变压器约为`L * 1/10 A`节省约`9 * L * A * 1/10`,我知道.

每个`k`层检查站 一次:保存 `L/k * A`再加上活跃部分内`k-1`层的量.

当 当`k = sqrt(L)`时,记忆和重新计算成本按`sqrt(L)`缩放,这是统一成本层的最佳权衡.

### 什么时候不该检查点

- 管道阶段中已经在飞行中最内层层――它们无论如何都必须完成――
- 如果第一层和最后层主导了这个阶段的计算,
- 已经使用 FlashAttention 的注意力核:Flash 已经会快速重新计算软max,因此额外的层级检查点 叠加收益很小.

### 实施模式

1. **Function wrapper：**用`torch.utils.checkpoint.checkpoint(fn, input)`包裹一个部分.`input`在回归时重新计算其他所有内容.

2. **Decorator-based：**列表将标记为可检查的; 训练师在配置时间决定哪些段被包装.

3. **Manual explicit recompute：**编写自行传递,调用自定义的`recompute_forward`保存的输入 复制前进.

三者给出的功能结果 相同──包装器是标准习惯用法──

### 与TP/PP/FP8 的交互

- **Tensor parallel：**检查点输入在重新计算时必须被收集或恢复;需要处理通信成本.
- **Pipeline parallel：**典型模式是检查点,每个管道阶段的前进,使反顺序微洗手可以重复使用激活内存.
- **FP8 recompute：**计算 期间更新的 amax历史 必须与原始的前进匹配,否则FP8尺度 会漂移――大多数框架会快照尺度――


```figure
activation-recompute
```

## 构建它

### 步骤1:带段的玩具模型

```python
import numpy as np


def linear_forward(x, w, b):
    return x @ w + b


def relu(x):
    return np.maximum(x, 0)


def layer_forward(x, w1, b1, w2, b2):
    h = relu(linear_forward(x, w1, b1))
    return linear_forward(h, w2, b2)


def model_forward(x, params):
    activations = [x]
    h = x
    for w1, b1, w2, b2 in params:
        h = layer_forward(h, w1, b1, w2, b2)
        activations.append(h)
    return h, activations
```

### 步骤2:需要全部激活的简单 倒退

```python
def model_backward(grad_output, activations, params):
    grads = [None] * len(params)
    g = grad_output
    for i in range(len(params) - 1, -1, -1):
        w1, b1, w2, b2 = params[i]
        x_in = activations[i]
        h_pre = linear_forward(x_in, w1, b1)
        h = relu(h_pre)
        gh = g @ w2.T
        gw2 = h.T @ g
        gb2 = g.sum(axis=0)
        g_pre = gh * (h_pre > 0)
        gx = g_pre @ w1.T
        gw1 = x_in.T @ g_pre
        gb1 = g_pre.sum(axis=0)
        grads[i] = (gw1, gb1, gw2, gb2)
        g = gx
    return g, grads
```

### 步骤3:检查点-每一个k 记忆

```python
def model_forward_checkpointed(x, params, k=4):
    saved_inputs = [x]
    h = x
    for i, (w1, b1, w2, b2) in enumerate(params):
        h = layer_forward(h, w1, b1, w2, b2)
        if (i + 1) % k == 0:
            saved_inputs.append(h)
    return h, saved_inputs


def model_backward_checkpointed(grad_output, saved_inputs, params, k=4):
    grads = [None] * len(params)
    g = grad_output
    segments = [(j * k, min((j + 1) * k, len(params))) for j in range(len(saved_inputs))]
    for seg_idx in range(len(saved_inputs) - 1, -1, -1):
        start, end = segments[seg_idx]
        if start >= end:
            continue
        x_in = saved_inputs[seg_idx]
        _, seg_acts = model_forward(x_in, params[start:end])
        g, seg_grads = model_backward(g, seg_acts, params[start:end])
        for j, gr in enumerate(seg_grads):
            grads[start + j] = gr
    return g, grads
```

### 步骤4:成本模型

```python
def checkpoint_cost(n_layers, segment_size, flops_per_layer=1.0):
    fwd = n_layers * flops_per_layer
    recompute = n_layers * flops_per_layer
    bwd = 2 * n_layers * flops_per_layer
    return {
        "fwd": fwd,
        "recompute": recompute,
        "bwd": bwd,
        "total": fwd + recompute + bwd,
        "overhead_vs_no_ckpt": (fwd + recompute + bwd) / (fwd + bwd) - 1.0,
    }


def selective_checkpoint_cost(n_layers, attention_fraction=0.15,
                              flops_per_layer=1.0):
    fwd = n_layers * flops_per_layer
    recompute = n_layers * attention_fraction * flops_per_layer
    bwd = 2 * n_layers * flops_per_layer
    return {
        "fwd": fwd,
        "recompute": recompute,
        "bwd": bwd,
        "total": fwd + recompute + bwd,
        "overhead_vs_no_ckpt": (fwd + recompute + bwd) / (fwd + bwd) - 1.0,
    }
```

### 步骤5:记忆估计器

```python
def activation_memory_mb(n_layers, hidden=8192, seq=8192,
                        batch=1, bytes_per_value=2):
    per_layer = 12 * batch * seq * hidden * bytes_per_value
    return n_layers * per_layer / 1e6


def memory_after_checkpoint(n_layers, segment_size, hidden=8192,
                           seq=8192, batch=1, bytes_per_value=2):
    n_seg = max(1, n_layers // segment_size)
    saved = (n_seg + segment_size) * 1 * batch * seq * hidden * bytes_per_value
    return saved / 1e6
```

### 步骤 6:最佳细分尺寸

```python
def optimal_segment(n_layers):
    return int(round(np.sqrt(n_layers)))
```

### 步骤7:选择性检查站决定

```python
def should_recompute(layer_type, activation_bytes, recompute_flops_ratio):
    if layer_type == "attention" and activation_bytes > 100 * 1e6:
        return True
    if layer_type == "ffn" and activation_bytes > 500 * 1e6:
        return recompute_flops_ratio < 0.1
    return False
```

## 使用它

- **torch.utils.checkpoint**其他:`from torch.utils.checkpoint import checkpoint`包装一个函数;只保存输入,然后倒退时重新计算.
- **Megatron-Core activation recomputation**支持`selective`,我知道.`full`和 `block`提供2024+边境培训的标准做法.
- **FSDP2 offload**其他:`module.to_empty(device="cpu")`配合`offload_policy`现在,我们将激活到CPU,而不是重新计算.
- **DeepSpeed ZeRO-Offload**为了优化状态和激活的CPU脱载,与检查点 互补.

## 交付它

本课会产出 `outputs/prompt-activation-recompute-policy.md`接收了您的模型配置 (含有: 层,隐藏,后续) 和可用的GPU内存,并输出了逐层重计算政策 (没有/选择性/完全/卸载)

## 练习

1. 验证正确性――运行`model_forward`其他`model_backward`对于比较`model_forward_checkpointed`其他`model_backward_checkpointed`参数梯度必须在机器精度下完全一致.

2. 扫描段子尺寸`k`从1到1`L`绘制FLOP的头部和记忆.

3. 实现选择性检查点:保存注意力模块输入,但不保存其中间量――对 seq=8192 的32层模型,测量对全层检查点的 FLOP 过head――

4. 添加脱载――把段输入 保存到一个模拟的 CPU 缓冲(一个单独的列表) ――将 PCIe 带宽作为字节/时间测量,并找到脱载与重计算之间的破解点──

5. 标志 一个真实的 PyTorch变压器,分别使用和不使用 `torch.utils.checkpoint`△测量记忆`torch.cuda.max_memory_allocated`) 和步骤时间.

## 关键术语
| Term | 人们通常怎么说 | 它实际意味着什么 |
|------|----------------|----------------------|
| Gradient checkpointing | “通过重做 forward 节省 memory” | 只存储 segment inputs；在 backward 期间重新计算中间量，以获得支持 Gradient 的 tensors |
| Activation recomputation | “和 checkpointing 一样” | 同一技术在 HPC 语境下的名称 |
| Segment size (k) | “每个 checkpoint 包含多少层” | 其中间量被丢弃并一起 rematerialized 的层数 |
| Selective checkpointing | “Korthikanti 的技巧” | 只重新计算存储成本高的激活值（attention softmax）；保留低成本的部分 |
| Full checkpointing | “朴素版本” | 在每个 segment 中重新计算每层的中间量 |
| Block checkpointing | “Coarse-grained” | Checkpoint 整个 transformer blocks；粒度最大 |
| FLOP overhead | “compute 税” | 每 step 额外 FLOPs = (recompute FLOPs) / (fwd + bwd FLOPs)；朴素方案 33%，selective 方案 5% |
| Activation offload | “传到 CPU” | 在 forward->backward 之间把 activations 移到 CPU RAM；是 recompute 的替代方案 |
| sqrt-L rule | “经典最优解” | 对于 uniform-cost layers，最优 checkpoint spacing 是 sqrt(L) 层 |
| Attention-softmax volume | “O(L^2) 问题” | L^2 * heads * batch 个浮点数；在长 context 下主导 activation memory |

## 延伸阅读
- [Chen et al., 2016 -- "Training Deep Nets with Sublinear Memory Cost"](https://arxiv.org/abs/1604.06174)--最初的形式化梯度检查论文
- [Korthikanti et al., 2022 -- "Reducing Activation Recomputation in Large Transformer Models"](https://arxiv.org/abs/2205.05198)-- 选择性激活再计算和形式化成本分析
- [Pudipeddi et al., 2020 -- "Training Large Neural Networks with Constant Memory using a New Execution Algorithm"](https://arxiv.org/abs/2002.05645)通过反向模式重现实现的另一种常态记忆方法
- [Ren et al., 2021 -- "ZeRO-Offload: Democratizing Billion-Scale Model Training"](https://arxiv.org/abs/2101.06840)-- 规模下部激活放电
- [PyTorch torch.utils.checkpoint docs](https://pytorch.org/docs/stable/checkpoint.html)-- 标准API
- [Megatron-Core activation recomputation documentation](https://docs.nvidia.com/nemo-framework/user-guide/latest/nemotoolkit/features/memory_optimizations.html)--选择式,全和区块模式
