# 注意 变体 滑窗,,差异

> 完全注意是圆.每个代币都能看到每个代币,而内存为此付出代价.

**Type:** Build
**Languages:** Python
**先修要求:**阶段7 · 02 (自主注意),阶段7 · 03 (多头),阶段7 · 12 (KV缓存/闪存注意)
**Time:** ~60 minutes

## 问题

完全注意序列长度上的内存成本是`O(N²)`计算成本也是如此`O(N²)`对于一个128K背景的Llama370B,这意味着每个层有160亿个注意条目,再乘以80层.`O(N²)`激活内存,但不会改变算术计算成本每个代币 仍然会参加到每个其他代币.

三类变体会改变注意力矩阵本身拓:

1. **Sliding window attention (SWA).**每个代币只会到固定窗口内邻近代币,而不是完整的前.`O(N · W)`在其中`W`是窗户大小──Gemma 2/3──Mistral 7B的前几层──Phi-3-Long──
2. **Sparse / block attention.**只有选择`(i, j)`对于会被打分;其余位置被强制为零权重.
3. **Differential attention.**用独立的Q/K投影 计算两张注意力地图,再相减――消除将把权重泄漏到前几个代币的注意力沉──微软的DIFF变压器(2024)。

这些可以共存――一个2026年边界模型往往会混合使用它们:大多数层是SWA-1024,每五层有一个全球的全重注意,还有少量的分区头用于清理检索――Gemma 3的 5:1 SWA-to-global比如是当前教科书式默认配置――

## 概念

### 滑动窗口注意 (SWA)

位置`i`只有在每一个问题上`[i - W, i]`(因果性SWA) 或`[i - W/2, i + W/2]`在中位置──窗口外的标志 会在分数矩阵中得到 `-inf`,我知道.

```
full causal:           sliding window (W=4):
positions 0-7          positions 0-7, W=4
    0 1 2 3 4 5 6 7        0 1 2 3 4 5 6 7
0 | x                0 |  x
1 | x x              1 |  x x
2 | x x x            2 |  x x x
3 | x x x x          3 |  x x x x
4 | x x x x x        4 |    x x x x
5 | x x x x x x      5 |      x x x x
6 | x x x x x x x    6 |        x x x x
7 | x x x x x x x x  7 |          x x x x
```

对于`N = 8192`和 `W = 1024`马特里克斯预期的成绩减少了1024 × 8192个非零行

**KV cache 会随 SWA 缩小。**每层只需要保留最近.`W`个标志的K 和 V──对于类似Gemma-3的配置(1024窗口,128K文本),KV缓存会降低128×──

**质量成本。**纯SWA变压器 难以处理长距离检索――修复方法:在SWA层间交错全重注意层――Gemma 3 使用 5:1 SWA:全球――Mistral 7B 使用因果性-SWA堆,信息通过重叠窗向前流动每层都将使有效感受野扩展`W`经过`L`层后,模型可以向后参加`L × W`个标志.

### 缩/阻注意力

预先选择一个`N × N`性模式:

- **Local + strided (OpenAI sparse transformer).**接下来就来看看`W`个标志,再加上此前每隔`stride`个标志的位置.`O(N · sqrt(N))`计算同时捕捉局部和长距离信息.
- **Longformer / BigBird.**地方窗口 + 少量全球代币`[CLS]`),这些代币参加到所有代币,也被所有代币参加 + 随机散链接――在匹配质量下经验上获得2×背景――
- **Native Sparse Attention (DeepSeek, 2025).**学习哪些 `(Q, K)`区块重要;在内核层面跳过零区块――兼容 FlashAttention――

缩注意力是一个核心工程故事――数学很简单――面具分数矩阵;收益来自从不把零条目加载到SRAM――FlashAttention-3 和 2026年的FlexAttention API 让自己定义缩模式成为PyTorch中的等能力――

### 变化注意 (DIFF变压器, 2024)

常规注意 有一个注意力沉 问题:软max 强制每行求和为 1,因此那些不想特别出席任何内容的标记将权重倾倒到第一个标记 (或前几个标记) 上面.

通过计算**两张**关注地图并没有减轻来解决这个问题:

```
A1 = softmax(Q1 K1^T / √d)
A2 = softmax(Q2 K2^T / √d)
DiffAttn = (A1 - λ · A2) V
```

其中`λ`是一个学习得到的尺度 (通常为0.50.8) △A1 捕捉真实内容权重;A2 捕捉沉;相减会抵消沉,把权重重新分配给相关代币.

报告结果(微软2024):尬程度降低510%,在同样的训练长度下有效的背景延长1.52×,针在草中检索更敏。

### 变体对比

| Variant | Compute | KV cache | Quality vs full | Production use |
|---------|---------|----------|-----------------|----------------|
| Full attention | O(N²) | O(N) per layer | baseline | 每个模型的默认层 |
| SWA (window 1024) | O(N·W) | O(W) per layer | -0.1 ppl，搭配 global layers 效果好 | Gemma 2/3, Phi-3-Long |
| Local + strided sparse | O(N·√N) | mixed | 类似 SWA | OpenAI sparse transformer, Longformer |
| BigBird (local + global + random) | O(N) approx | mixed | 在 2× context 下匹配 full | early long-context BERT |
| Native Sparse (DeepSeek-V3.2) | O(N · active fraction) | O(N) | within 0.05 ppl | DeepSeek-V3.2, 2025 |
| Differential | O(2·N²) | O(2N) | -5 to -10% ppl | DIFF Transformer, early 2026 models |


```figure
gqa-kv-sharing
```

## 构建它

见`code/main.py`我们实现了因果化面具比较器,在玩具序列上并排展示全、SWA、本地+步和差异性注意力──

### 步骤1:完整的因果性面具 (基本线)

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

从第07课的基线下三角;对角线上权重为零.

### 步骤 2:滑窗原因面具

```python
def swa_mask(n, window):
    M = [[float("-inf")] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)
        for j in range(lo, i + 1):
            M[i][j] = 0.0
    return M
```

一个参数`window`,当`window >= n`时,会恢复完全因果性注意力.`window = 1`时,每个代币只能到自己那里.

### 步骤3:局部+步骤稀疏面具

```python
def strided_mask(n, window, stride):
    M = [[float("-inf")] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)
        for j in range(lo, i + 1):
            M[i][j] = 0.0
        for j in range(0, i + 1, stride):
            M[i][j] = 0.0
    return M
```

密集的本地窗口加上从序列开头开始每隔`stride`个标志的位置──随着额外层数量增加,感受野以日志步骤增长──

### 步骤4: 差异性关注

```python
def diff_attention(Q1, K1, Q2, K2, V, lam):
    A1 = softmax_causal(Q1 @ K1.T / sqrt_d)
    A2 = softmax_causal(Q2 @ K2.T / sqrt_d)
    return (A1 - lam * A2) @ V
```

在代码中,我们比较单一注意力与差异性注意力的注意力-沉热地图,并观察沉缩──

### 步骤 5: KV缓存尺寸

在`N = 131072`下印每变体的每层缓存尺寸――SWA 和稀少变体会降低10100×――差异会翻倍――要意识地支付你的内存账单――

## 使用它

2026年生产模式:

```python
from transformers import AutoModelForCausalLM
# Gemma 3 mixes SWA (window=1024) and global layers at 5:1.
model = AutoModelForCausalLM.from_pretrained("google/gemma-3-27b-it")
# print(model.config.sliding_window, model.config.layer_types)
```

接受一个面具功能:

```python
from torch.nn.attention.flex_attention import flex_attention, create_block_mask

def swa_pattern(b, h, q_idx, kv_idx):
    return (q_idx - kv_idx < 1024) & (q_idx >= kv_idx)

mask = create_block_mask(swa_pattern, B=batch, H=heads, Q_LEN=n, KV_LEN=n)
out = flex_attention(q, k, v, block_mask=mask)
```

这将编译为自定义的Triton内核.对于常见模式,速度在FlashAttention-3的10%内,并且面具函数是一个Python可调用的.

**何时选择哪一种：**

- **Pure full attention** 每层都适用于最高约16K的环境,或检索质量至关重要时.
- **SWA + global mix**长文本 ((>32K),训练和推断 受内存限制──2026年 32K以上的默认选择──
- **Sparse block attention**自定义内核、自定义模式──保留给专门工作负载(检索、音频)。
- **Differential attention** 任何注意力水污染会造成伤害工作负载

## 交付它

见`outputs/skill-attention-variant-picker.md`△该技能会根据目标背景长度,检查需求以及训练/推理计算配置,为新模型选择一种注意力拓......

## 练习

1. **Easy.**运行`code/main.py`验证`window=4`现在,我们已经在SWA会把每一行中最近的4个代币的所有内容置零.`window=n`会比特-同样复现全因果注意力――
2. **Medium.**在07课的结石上实现`window=1024`由于这些,我们可以看到一个人在一个小时内,
3. **Hard.**在结石模型中实现了Gemma-3式 5:1层混合,5层SWA,1层全球) ・在参数匹配的情况下,对比纯SWA和纯全球基线的损失、记忆和生成质量──
4. **Hard.**实现每个头脑都能学习`λ`在参数匹配的情况下,测量与单重视基线相对的检索精度.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Sliding window attention (SWA) | "Local attention" | 每个 query attend 到最近 `W` 个 Token；KV cache 缩小到 `O(W)`。 |
| Effective receptive field | "模型能向后看多远" | 在一个窗口为 `W` 的 `L` 层 SWA stack 中，最多 `L × W` 个 Token。 |
| Longformer / BigBird | "Local + global + random" | Sparse pattern，包含少量始终 attend 的 global tokens；早期 long-context 方法。 |
| Native Sparse Attention | "DeepSeek's kernel trick" | 学习 block-level sparsity；在保持质量的同时，在 kernel 层面跳过零 block。 |
| Differential attention | "Two maps, one subtracts" | DIFF Transformer：从第一张 Attention map 中减去学习得到的 `λ` 倍第二张 Attention map，以抵消 attention sinks。 |
| Attention sink | "权重泄漏到 token 0" | Softmax normalization 强制行求和为 1；信息量不足的 query 会把权重倾倒到位置 0。 |
| FlexAttention | "Mask-as-Python" | PyTorch 2.5+ API，可将任意 mask function 编译成 FlashAttention 形状的 kernel。 |
| Layer type mix | "5:1 SWA-to-global" | 在 stack 中交错 sparse 和 full Attention 层，以更低内存保持质量。 |

## 延伸阅读

- [Beltagy, Peters, Cohan (2020). Longformer: The Long-Document Transformer](https://arxiv.org/abs/2004.05150) 经典的滑动窗口+全球标志论文──
- [Zaheer et al. (2020). Big Bird: Transformers for Longer Sequences](https://arxiv.org/abs/2007.14062)本地+全球+随机――
- [Child et al. (2019). Generating Long Sequences with Sparse Transformers](https://arxiv.org/abs/1904.10509)OpenAI的本地+步骤模式──
- [Gemma Team (2024). Gemma 2: Improving Open Language Models at a Practical Size](https://arxiv.org/abs/2408.00118) 1:1 SWA:全球混合物
- [Gemma Team (2025). Gemma 3 technical report](https://arxiv.org/abs/2503.19786)窗口=1024 的 5:1 混合,如今是教科书式默认配置.
- [Ye et al. (2024). Differential Transformer](https://arxiv.org/abs/2410.05258)              
- [Yuan et al. (2025). Native Sparse Attention](https://arxiv.org/abs/2502.11089) DeepSeek-V3.2 的学习-度注意力
- [PyTorch — FlexAttention blog and docs](https://pytorch.org/blog/flexattention/)使用它 中面具作为可调用模式的API参考──
