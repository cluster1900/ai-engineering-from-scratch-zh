# Attention 变体 — Sliding Window, Sparse, Differential

> Full Attention 是一个圆。每个 Token 都能看到每个 Token，而内存为此付出代价。四种变体改变这个圆的形状，并收回一半成本。

**Type:** Build
**Languages:** Python
**先修要求:** Phase 7 · 02 (Self-Attention), Phase 7 · 03 (Multi-Head), Phase 7 · 12 (KV Cache / Flash Attention)
**Time:** ~60 minutes

## 问题

Full Attention 在序列长度上的内存成本是 `O(N²)`，计算成本也是 `O(N²)`。对于一个 128K-context 的 Llama 3 70B，这意味着每层有 160 亿个 Attention 条目，再乘以 80 层。Flash Attention（Lesson 12）隐藏了 `O(N²)` activation 内存，但不会改变算术计算成本——每个 Token 仍然会 attend 到每个其他 Token。

三类变体会改变 Attention Matrix 本身的拓扑：

1. **Sliding window attention (SWA).** 每个 Token 只 attend 到固定窗口内的邻近 Token，而不是完整 prefix。内存和计算降到 `O(N · W)`，其中 `W` 是窗口大小。Gemma 2/3、Mistral 7B 的前几层、Phi-3-Long。
2. **Sparse / block attention.** 只有选定的 `(i, j)` 对会被打分；其余位置被强制为零权重。Longformer、BigBird、OpenAI sparse transformer。
3. **Differential attention.** 用独立的 Q/K projection 计算两张 Attention map，再相减。消除会把权重泄漏到前几个 Token 的 “attention sink”。Microsoft 的 DIFF Transformer（2024）。

这些可以共存。一个 2026 年的 frontier model 往往会混合使用它们：大多数层是 SWA-1024，每五层有一层 global full Attention，还有少量 differential heads 用来清理检索。Gemma 3 的 5:1 SWA-to-global 比例是当前教科书式默认配置。

## 概念

### Sliding Window Attention (SWA)

位置 `i` 的每个 query 只 attend 到 `[i - W, i]`（causal SWA）或 `[i - W/2, i + W/2]`（bidirectional）中的位置。窗口外的 Token 会在 score Matrix 中得到 `-inf`。

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

对于 `N = 8192` 和 `W = 1024`，score Matrix 期望上有 1024 × 8192 个非零行——减少了 8×。

**KV cache 会随 SWA 缩小。** 每层只需要保留最近 `W` 个 Token 的 K 和 V。对于一个类似 Gemma-3 的配置（1024 window，128K context），KV cache 会降低 128×。

**质量成本。** 纯 SWA Transformer 难以处理长距离检索。修复方法：在 SWA 层之间交错 full-attention 层。Gemma 3 使用 5:1 SWA:global。Mistral 7B 使用 causal-SWA stack，信息通过重叠窗口“向前流动”——每一层都会把有效感受野扩展 `W`，经过 `L` 层后，模型可以向后 attend `L × W` 个 Token。

### Sparse / Block Attention

预先选择一个 `N × N` sparsity pattern。三种经典形状：

- **Local + strided (OpenAI sparse transformer).** Attend 到最近 `W` 个 Token，再加上此前每隔 `stride` 个 Token 的位置。以 `O(N · sqrt(N))` 计算同时捕捉局部和长距离信息。
- **Longformer / BigBird.** Local window + 少量 global tokens（例如 `[CLS]`），这些 Token attend 到所有 Token，也被所有 Token attend + random-sparse links。在匹配质量下经验上获得 2× context。
- **Native Sparse Attention (DeepSeek, 2025).** 学习哪些 `(Q, K)` block 重要；在 kernel 层面跳过零 block。兼容 FlashAttention。

Sparse Attention 是一个 kernel engineering 故事。数学很简单（mask score Matrix）；收益来自从不把零条目加载进 SRAM。FlashAttention-3 和 2026 年的 FlexAttention API 让自定义 sparse pattern 成为 PyTorch 中的一等能力。

### Differential Attention (DIFF Transformer, 2024)

常规 Attention 有一个 “attention sink” 问题：softmax 强制每一行求和为 1，因此那些并不想特别 attend 到任何内容的 Token 会把权重倾倒到第一个 Token（或前几个 Token）上。这会偷走本应分配给真实内容的容量。

Differential Attention 通过计算**两张** Attention map 并相减来解决这个问题：

```
A1 = softmax(Q1 K1^T / √d)
A2 = softmax(Q2 K2^T / √d)
DiffAttn = (A1 - λ · A2) V
```

其中 `λ` 是一个学习得到的 scalar（通常为 0.5–0.8）。A1 捕捉真实内容权重；A2 捕捉 sink。相减会抵消 sink，把权重重新分配给相关 Token。

报告结果（Microsoft 2024）：perplexity 降低 5–10%，在相同训练长度下有效 context 延长 1.5–2×，needle-in-haystack 检索更敏锐。

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

见 `code/main.py`。我们实现一个 causal mask comparator，在玩具序列上并排展示 full、SWA、local+strided 和 Differential Attention。

### 步骤 1： full causal mask（baseline）

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

来自 Lesson 07 的 baseline。下三角；对角线上方的权重为零。

### 步骤 2： sliding window causal mask

```python
def swa_mask(n, window):
    M = [[float("-inf")] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)
        for j in range(lo, i + 1):
            M[i][j] = 0.0
    return M
```

一个参数——`window`。当 `window >= n` 时，会恢复 full causal Attention。当 `window = 1` 时，每个 Token 只 attend 到自己。

### 步骤 3： local + strided sparse mask

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

密集 local window 加上从序列开头开始每隔 `stride` 个 Token 的位置。随着额外层数增加，感受野以 log step 增长。

### 步骤 4： differential attention

```python
def diff_attention(Q1, K1, Q2, K2, V, lam):
    A1 = softmax_causal(Q1 @ K1.T / sqrt_d)
    A2 = softmax_causal(Q2 @ K2.T / sqrt_d)
    return (A1 - lam * A2) @ V
```

两次 Attention pass，用学习得到的 mixing coefficient 相减。在代码中，我们比较单一 Attention 与 Differential Attention 的 attention-sink heatmap，并观察 sink 坍缩。

### 步骤 5： KV cache sizes

在 `N = 131072` 下打印每个变体的每层 cache size。SWA 和 sparse 变体会降低 10–100×。Differential 会翻倍。要有意识地支付你的内存账单。

## 使用它

2026 年的生产模式：

```python
from transformers import AutoModelForCausalLM
# Gemma 3 mixes SWA (window=1024) and global layers at 5:1.
model = AutoModelForCausalLM.from_pretrained("google/gemma-3-27b-it")
# print(model.config.sliding_window, model.config.layer_types)
```

PyTorch 2.5+ 中的 FlexAttention 接受一个 mask function：

```python
from torch.nn.attention.flex_attention import flex_attention, create_block_mask

def swa_pattern(b, h, q_idx, kv_idx):
    return (q_idx - kv_idx < 1024) & (q_idx >= kv_idx)

mask = create_block_mask(swa_pattern, B=batch, H=heads, Q_LEN=n, KV_LEN=n)
out = flex_attention(q, k, v, block_mask=mask)
```

这会编译成自定义 Triton kernel。对于常见 pattern，速度在 FlashAttention-3 的 10% 以内，并且 mask function 是一个 Python callable。

**何时选择哪一种：**

- **Pure full attention** — 每层都适用于最高约 16K context，或检索质量至关重要时。
- **SWA + global mix** — 长 context（>32K），训练和 inference 受内存限制。2026 年 32K 以上的默认选择。
- **Sparse block attention** — 自定义 kernel、自定义 pattern。保留给专门工作负载（检索、音频）。
- **Differential attention** — 任何 attention-sink contamination 会造成伤害的工作负载（long-context RAG、needle-in-haystack）。

## 交付它

见 `outputs/skill-attention-variant-picker.md`。该 skill 会根据目标 context length、检索需求以及训练/inference compute profile，为新模型选择一种 Attention topology。

## 练习

1. **Easy.** 运行 `code/main.py`。验证 `window=4` 的 SWA 会把每一行中最近 4 个 Token 之外的所有内容置零。验证 `window=n` 会 bit-identically 复现 full causal Attention。
2. **Medium.** 在 Lesson 07 capstone 之上实现 `window=1024` 的 causal SWA。在 tinyshakespeare 上训练 1,000 steps。相比 full Attention，val loss 回退多少？peak memory 降低多少？
3. **Hard.** 在 capstone 模型中实现 Gemma-3-style 5:1 layer mix（5 层 SWA，1 层 global）。在参数匹配的情况下，对比 pure-SWA 和 pure-global baseline 的 loss、memory 和 generation quality。
4. **Hard.** 实现每个 head 都有学习得到的 `λ` 的 Differential Attention。在一个 synthetic retrieval task（一个 needle，2,000 个 distractors）上训练。在参数匹配的情况下，测量相对 single-attention baseline 的 retrieval accuracy。

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

- [Beltagy, Peters, Cohan (2020). Longformer: The Long-Document Transformer](https://arxiv.org/abs/2004.05150) — 经典的 sliding-window + global-token 论文。
- [Zaheer et al. (2020). Big Bird: Transformers for Longer Sequences](https://arxiv.org/abs/2007.14062) — local + global + random。
- [Child et al. (2019). Generating Long Sequences with Sparse Transformers](https://arxiv.org/abs/1904.10509) — OpenAI 的 local+strided pattern。
- [Gemma Team (2024). Gemma 2: Improving Open Language Models at a Practical Size](https://arxiv.org/abs/2408.00118) — 1:1 SWA:global mix。
- [Gemma Team (2025). Gemma 3 technical report](https://arxiv.org/abs/2503.19786) — window=1024 的 5:1 mix，如今是教科书式默认配置。
- [Ye et al. (2024). Differential Transformer](https://arxiv.org/abs/2410.05258) — DIFF Transformer 论文。
- [Yuan et al. (2025). Native Sparse Attention](https://arxiv.org/abs/2502.11089) — DeepSeek-V3.2 的 learned-sparsity Attention。
- [PyTorch — FlexAttention blog and docs](https://pytorch.org/blog/flexattention/) — Use It 中 mask-as-callable pattern 的 API reference。
