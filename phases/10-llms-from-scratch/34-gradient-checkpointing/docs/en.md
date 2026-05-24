# Gradient Checkpointing 和 Activation Recomputation

> Backpropagation 会保留每一个中间激活值。在 70B parameters 和 128K context 下，每个 rank 的激活值可达 3 TB。Checkpointing 用 FLOPs 换 memory：重新计算，而不是保存。问题在于该丢弃哪些 segments，答案并不是“全部丢弃”。

**Type:** Build
**语言:** Python（with numpy, optional torch）
**前置要求:** Phase 10 Lesson 04 (Pre-Training Mini-GPT), Phase 10 Lesson 05 (Scaling & Distributed)
**Time:** ~70 分钟

## 问题

训练 transformer 会为每一层保存 backward 中需要求导的每个 op 的输入：attention 输入、Q/K/V projections、softmax 输出、FFN 输入、norm 输出，以及 residual stream。对于 hidden size 为 `d`、sequence length 为 `L`、batch 为 `B` 的一层，这大约是每层 `12 * B * L * d` 个浮点数。

对于 `d=8192, L=8192, B=1`，这在 BF16 下是 800 MB/层。一个 64-layer model 的激活值就是 51 GB，这还没有乘以 microbatch size，也还没有加上 attention-softmax intermediates（每个 head 为 `L^2`），更没有计入 tensor-parallel partial copies。

这是双边账单：BF16 weights 加上 optimizer state 可能能放进 80GB，但激活值会让你超出限制。Gradient checkpointing（也叫 activation recomputation）是标准修复方案。丢弃大多数激活值；在 backward 期间重新执行 forward 来取回它们。代价：额外 FLOPs。收益：memory 按 checkpoint segments 与总 layers 的比例下降。

朴素实现时，checkpointing 每一步大约会多花 33% 的 forward-pass FLOPs。实现得好时，即按照 Korthikanti et al. 的“smart selection”做 selective checkpointing，你可以在低于 5% 的 FLOP 开销下节省 5x memory。并且在 FP8 matmuls、FSDP offload、expert-parallel MoE 中，这一点确实很重要：memory 和浪费的 compute 你都承受不起。

## 概念

### Backward 实际需要什么

`output = layer(input)`。Backward 想要 `grad_input` 和 `grad_params`。为了计算它们，它需要：

- `input`（用于在线性层中计算 `grad_params = input.T @ grad_output`）
- 一些激活导数中间量（ReLU/GELU/softmax 的导数依赖激活值）

forward pass 会在 autograd graph 中自动保存这些内容。每个 `tensor.retain_grad()` 以及每个需要其输入的 op 都会保留一个引用。

### 朴素 Full Checkpointing

把网络拆成 `N` 个 segments。forward 期间，只保存每个 segment 的 *input*。当 backward 需要中间量时，重新运行该 segment 的 forward pass 来物化它们，然后再求导。

示例：32-layer transformer 拆成 32 个 segments，每个 segment 1 层。

- Memory：32 个 layer-inputs（小）对比 32 *（每层 activation volume）（巨大）。
- 额外 compute：每个 segment 额外 1 次 forward，也就是总 forward FLOPs 约增加 33%（因为 backward 是 forward 的 2x，完整 step 从 1 + 2 = 3 个单位变为 1 + 1 + 2 = 4 个单位）。

这是最初 Chen et al. 2016 的方案：每 `sqrt(L)` 层放一个 checkpoint，以平衡 memory 和 compute。对于 L=64，就是 8 个 checkpoints。

### Selective Checkpointing (Korthikanti 2022)

并非所有激活值的成本都一样。attention softmax 输出是 `B*L*L*heads`，并随 sequence length *二次* 增长。FFN hidden activation 是 `B*L*4d`，线性增长。对于长序列，softmax 占主导。

Selective checkpointing 会保留存储成本低的激活值（linear projections、residuals），只重新计算昂贵的部分（attention）。你用很少的 FLOPs 重新计算，却节省了 O(L^2) memory。

Megatron-Core 将其实现为 “selective” activation recomputation。大多数 2024+ frontier training runs 都在使用它。

### Offload

重新计算的替代方案：在 forward 和 backward 之间把激活值传到 CPU RAM。它需要 PCIe bandwidth；当空闲 bandwidth 的收益高于 rematerialization 成本时很有用。混合策略很常见：一些 layers checkpoint，另一些 offload。

FSDP2 将 offload 作为一等选项提供。当 GPU 受 memory 限制，但 CPU-GPU transfer 还有余量时，offload 表现很好。

### Recompute Cost Model

每 `k` 层 checkpoint 一次、总共 `L` 层时，朴素 checkpointing 的 per-step FLOPs：

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

使用 selective checkpointing 时，你只重新计算 attention kernel，而不是整层：

```
flops_recompute_selective = L * f_attention ~= L * f_layer * 0.15
overhead_selective = (3 + 0.15) / 3 - 1 = 0.05 = 5%
```

### Memory Savings Model

每层 activation volume：`A`。对于 `L` 层，总 activation memory：`L * A`。

Full checkpoint（segment size 1）：只保存 `L * input_volume`（对于标准 transformer 约为 `L * 1/10 A`）。节省约 `9 * L * A * 1/10`。

每 `k` 层 checkpoint 一次：保存 `L/k * A`，再加上 active segment 内 `k-1` 层的量。

当 `k = sqrt(L)` 时，memory 和 recompute cost 都按 `sqrt(L)` 缩放，这是 uniform-cost layers 的最优权衡。

### 什么时候不该 Checkpoint

- pipeline stage 中已经 in-flight 的最内层 layers。它们无论如何都必须完成。
- 如果 first 和 last layers 主导了该 stage 的 compute（在 transformers 中很少见），则不要 checkpoint 它们。
- 已经使用 FlashAttention 的 attention kernels：Flash 已经会快速重新计算 softmax，因此额外的 layer-level checkpointing 叠加收益很小。

### Implementation Patterns

1. **Function wrapper：** 用 `torch.utils.checkpoint.checkpoint(fn, input)` 包裹一个 segment。PyTorch 只保存 `input`，在 backward 时重新计算其他所有内容。

2. **Decorator-based：** 将 layers 标记为 checkpointable；trainer 在 config time 决定哪些 segments 被包裹。

3. **Manual explicit recompute：** 自己编写 backward pass，调用自定义的 `recompute_forward`，用保存的 input 复制 forward。

三者给出的 functional result 相同。Wrappers 是标准习惯用法。

### 与 TP / PP / FP8 的交互

- **Tensor parallel：** checkpoint inputs 在 recompute 时必须被 gather 或 rescatter；需要处理 communication cost。
- **Pipeline parallel：** 典型模式是 checkpoint 每个 pipeline-stage 的 forward，使 reverse-order microbatches 可以复用 activation memory。
- **FP8 recompute：** recompute 期间更新的 amax histories 必须与原始 forward 匹配，否则 FP8 scale 会漂移。大多数 frameworks 会 snapshot scale。

## 构建它

### 步骤 1：带 Segments 的 Toy Model

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

### 步骤 2：需要全部 Activations 的朴素 Backward

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

### 步骤 3：Checkpoint-Every-k Memory

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

### 步骤 4：Cost Model

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

### 步骤 5：Memory Estimator

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

### 步骤 6：Optimal Segment Size

```python
def optimal_segment(n_layers):
    return int(round(np.sqrt(n_layers)))
```

### 步骤 7：Selective Checkpoint Decision

```python
def should_recompute(layer_type, activation_bytes, recompute_flops_ratio):
    if layer_type == "attention" and activation_bytes > 100 * 1e6:
        return True
    if layer_type == "ffn" and activation_bytes > 500 * 1e6:
        return recompute_flops_ratio < 0.1
    return False
```

## 使用它

- **torch.utils.checkpoint**：`from torch.utils.checkpoint import checkpoint`，PyTorch 中的规范 wrapper。它包裹一个函数；只保存输入，并在 backward 时重新计算。
- **Megatron-Core activation recomputation**：支持 `selective`、`full` 和 `block` modes。是 2024+ frontier training 的标准做法。
- **FSDP2 offload**：FSDP2 中的 `module.to_empty(device="cpu")` 配合 `offload_policy`，会把 activations shard 到 CPU，而不是重新计算。
- **DeepSpeed ZeRO-Offload**：用于 optimizer states 和 activations 的 CPU offload，与 checkpointing 互补。

## 交付它

本课会产出 `outputs/prompt-activation-recompute-policy.md`，这是一个 prompt：它接收你的 model config（layers、hidden、seq、batch）和可用 GPU memory，并输出逐层 recompute policy（none / selective / full / offload）。

## 练习

1. 验证正确性。运行 `model_forward` + `model_backward`（完整 activations）对比 `model_forward_checkpointed` + `model_backward_checkpointed`（segments）。Parameter gradients 必须在 machine precision 下完全一致。

2. 扫描 segment size `k`，从 1 到 `L`。绘制 FLOP overhead 和 memory。找到曲线的拐点。

3. 实现 selective checkpointing：保存 attention-module input，但不保存其中间量。对于 seq=8192 的 32-layer model，测量相对于 full-layer checkpointing 的 FLOP overhead。

4. 添加 offload。把 segment inputs 保存到一个模拟的 “CPU buffer”（一个单独的 list）。将 “PCIe bandwidth” 作为 bytes/time 测量，并找出 offload 与 recompute 之间的 breakeven point。

5. Benchmark 一个真实的 PyTorch transformer，分别使用和不使用 `torch.utils.checkpoint`。测量 memory（通过 `torch.cuda.max_memory_allocated`）和 step time。

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
- [Chen et al., 2016 -- "Training Deep Nets with Sublinear Memory Cost"](https://arxiv.org/abs/1604.06174) -- 最初形式化 gradient checkpointing 的论文
- [Korthikanti et al., 2022 -- "Reducing Activation Recomputation in Large Transformer Models"](https://arxiv.org/abs/2205.05198) -- selective activation recomputation 和形式化 cost analysis
- [Pudipeddi et al., 2020 -- "Training Large Neural Networks with Constant Memory using a New Execution Algorithm"](https://arxiv.org/abs/2002.05645) -- 通过 reverse-mode rematerialization 实现的另一种 constant-memory approach
- [Ren et al., 2021 -- "ZeRO-Offload: Democratizing Billion-Scale Model Training"](https://arxiv.org/abs/2101.06840) -- scale 下的 activation offload
- [PyTorch torch.utils.checkpoint docs](https://pytorch.org/docs/stable/checkpoint.html) -- 标准 API
- [Megatron-Core activation recomputation documentation](https://docs.nvidia.com/nemo-framework/user-guide/latest/nemotoolkit/features/memory_optimizations.html) -- selective、full 和 block modes
