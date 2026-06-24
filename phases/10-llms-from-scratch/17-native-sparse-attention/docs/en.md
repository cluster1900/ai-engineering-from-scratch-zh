# Native Sparse Attention (DeepSeek NSA)

> 在 64k Token 下，Attention 会吞掉 70-80% 的 decode 延迟。每个 open-model 实验室都有修复它的方案。DeepSeek 的 NSA（ACL 2025 best paper）是真正站稳脚跟的方案：三个并行 Attention 分支，即压缩后的粗粒度 Token、选择性保留的细粒度 Token，以及用于 local context 的 sliding window，通过 learned gate 组合在一起。它是 hardware-aligned（kernel-friendly）、natively trainable（可用于 pre-training，而不是在 inference 时外挂），并且在 64k decode 上，它比 FlashAttention 更快，同时达到或超过 full attention 的质量。本课将端到端构建这三个分支，并展示为什么这种稀疏性是端到端可微的。

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 7 · 12 (KV cache, flash-attention), Phase 7 · 15 (attention variants), Phase 10 · 16 (differential attention)
**Time:** ~60 minutes

## 学习目标

- 说出 NSA 的三个 Attention 分支，以及每个分支捕获什么信息。
- 解释为什么 NSA 是“natively trainable”，而此前的 sparse-attention 方法只能用于 inference。
- 在 64k context 下，根据 compression block size 和 selection top-k，计算 NSA 相比 full attention 的 Attention 计算节省量。
- 在一个短的合成序列上，用 stdlib Python 实现三分支组合，并验证 gating weights 的行为。

## 问题

序列长度为 N 时，Full attention 的时间成本是 `O(N^2)`，每层 KV cache 是 `O(N)`。在 64k Token 下，计算和 memory bandwidth 数字都非常灾难。NSA 论文中的理论估计测量值显示：在 64k 下，Attention 占总 decode 延迟的 70-80%。后续所有指标，包括 TTFT、tokens/sec、每百万 Token 成本，都被 Attention 成本主导。

Sparse attention 是显而易见的答案。此前尝试大致分为两类。Fixed-pattern sparsity（sliding-window、strided、block-local）会丢弃信息，并在 long-range recall 任务上失败。Inference-time sparsity（KV cache pruning、H2O、StreamingLLM）应用于在 dense attention 上 pre-trained 的模型，只能恢复潜在 speedup 的一小部分，因为模型从未被要求通过 sparse pattern 路由信息。

Native Sparse Attention（Yuan et al., DeepSeek + PKU + UW, ACL 2025 best paper, arXiv:2502.11089）两者兼具：模型在 pre-training 期间学习的 sparsity pattern，以及一个 kernel-aligned 算法实现，使它在 inference 时真正交付计算节省。两年后，NSA 或其直接后继方案会成为每个 frontier long-context 模型的默认 Attention。

## 概念

### 三个并行分支

对每个 query，NSA 会针对 KV cache 的三种不同视图运行三次 Attention：

1. **Compressed branch.** Token 被分组为大小为 `l` 的 block（通常为 32 或 64）。每个 block 通过一个小型 learned MLP 压缩成单个 summary token。query 会 attend 到这些 compressed tokens，从而获得整个序列的粗粒度视图。

2. **Selected branch.** 使用 compressed branch 的 Attention scores，识别出与当前 query 最相关的 top-k blocks。读取这些 block 中的细粒度（未压缩）Token，然后 query 会 attend 到所有这些 Token。可以把 compressed-branch Attention 看作 selection 的 routing signal。

3. **Sliding-window branch.** query 会 attend 到最近的 `W` 个 Token（通常为 512），用于 local context。这个分支捕获其他两个分支可能遗漏的、结构密集的短程模式（syntax、local coreference）。

三个分支的输出通过 learned per-position gate 组合：

```
out = g_cmp * out_cmp + g_sel * out_sel + g_win * out_win
```

`g_cmp, g_sel, g_win` 是 query 上的小型 MLP 产生的 gate weights。它们不必加和为 1，可以独立地对各分支加权。

### 为什么这是“natively trainable”

selection 步骤（top-k blocks）是离散的。离散操作会破坏 Gradient flow。此前的 sparse-attention 工作要么跳过 selection 的 Backpropagation（限制训练），要么使用 continuous relaxations，而这些方法在 inference 时无法给出真正的稀疏性。

NSA 绕开了这一点：compressed-branch Attention 本身就是作用于整个序列的可微粗粒度 Attention。top-k 操作只是复用 compressed branch 中最高的 Attention scores，来选择需要加载哪些细粒度 block。Gradient 会流经 compressed-branch scores（它既影响 compressed output，也影响 selection logic），而 selected blocks 对最终输出的贡献同样可微。不可微的 `top_k` 操作在前向 computational graph 上是 no-op，它只控制哪些 block 会从内存中加载。

这就是 NSA 能够端到端用于 pre-training 的原因。模型会联合学习如何通过三个分支路由信息，生成一种 sparse pattern，并在 inference 时真正交付承诺的 speedup。

### Hardware-aligned kernel

NSA 的 kernel 是为现代 GPU memory hierarchy 设计的。kernel 按 GQA group 加载 queries（outer loop），为每个 group 获取对应的 sparse KV blocks（inner loop），并在 SRAM 上运行 Attention。由于每个 query group 看到相同的 selected blocks（selection 是 per-query-group，而不是 per-query-head），KV 加载会在 group 内摊销。Arithmetic intensity 维持在较高水平。

论文报告称，Triton kernels 在 64k decode 上比 FlashAttention 快 9x，并且 speedup ratio 会随序列长度增长。Forward 和 backward kernels 均已提供。

### 计算预算

令 `N` 为序列长度，`l` 为 compression block size，`k` 为 top-k selection count，`w` 为 sliding window，`b` 为 selected block size（通常等于 `l`）。

- Compressed branch：每个 query 有 `O(N/l)` 个 keys，因此总计 `O(N * N / l)`。
- Selected branch：每个 query 有 `O(k * b)` 个 keys，因此总计 `O(N * k * b)`。
- Sliding branch：每个 query 有 `O(w)` 个 keys，因此总计 `O(N * w)`。

总计：`O(N * (N/l + k*b + w))`。

当 `N = 64k, l = 64, k = 16, b = 64, w = 512`：每个 query 的成本为 `1000 + 1024 + 512 = 2536 keys`。Full attention 是 `64000 keys`。计算减少 25x。

当 `N = 128k, l = 64, k = 16, b = 64, w = 512`：每个 query 的成本为 `2000 + 1024 + 512 = 3536 keys`。Full attention 是 `128000 keys`。减少 36x。收益会随序列长度增长，这正是它的核心意义。

### 如何比较

| Method | Differentiable | Real inference speedup | Long-range recall |
|--------|---------------|----------------------|-------------------|
| Sliding window only | yes | yes | fails |
| Strided / block-sparse | yes | yes | partial |
| KV pruning (H2O, StreamingLLM) | N/A (inference-time) | yes | partial |
| MoBA (Moonshot) | partial | yes | good |
| NSA | yes (natively) | yes (9x at 64k) | matches full attention |

MoBA（Moonshot, arXiv:2502.13189）同期发布，也采用了类似“三个胜过一个”的思路，将 MoE 原则应用到 Attention blocks。NSA 和 MoBA 是理解 2026 long-context pre-training 必须掌握的两个架构。


```figure
sliding-window-attention
```

## 构建它

`code/main.py` 在一个短的合成序列上实现三个分支，并展示：

- compression MLP（为了教学清晰，使用一个简单的 mean-pool baseline；真实 NSA 使用 learned MLP）。
- 由 compressed-branch scores 驱动的 top-k block selection。
- 最近 `w` 个 Token 上的 sliding-window Attention。
- gated combination。
- 与 full attention 对比的 compute-count printout。

### 步骤 1： 将 Token 压缩成 blocks

```python
def compress(K, l):
    n = len(K)
    n_blocks = (n + l - 1) // l
    out = []
    for b in range(n_blocks):
        start, end = b * l, min((b + 1) * l, n)
        block = K[start:end]
        summary = [sum(row[d] for row in block) / len(block) for d in range(len(K[0]))]
        out.append(summary)
    return out
```

### 步骤 2： compressed-branch Attention

运行 query 针对 compressed keys 的 softmax Attention。compressed-branch scores 同时作为 top-k selection 的信号。

### 步骤 3： top-k block selection

选择得分最高的 `k` 个 compressed blocks 的索引。加载这些 block 中的原始未压缩 Token，并在其上运行 Attention。

### 步骤 4： sliding-window Attention

取最后 `w` 个 Token，并针对它们运行标准 Attention。

### 步骤 5： gate + combine

query 上的小型 MLP 产生三个 gate weights。最终输出是三个分支输出的 weighted sum。

### 步骤 6： compute counting

打印每个分支、每个 query attend 的 keys 数量以及总数。与 `N`（full attention）进行比较。在一个 1024-Token 合成序列上，使用 `l = 32, k = 4, w = 128`，NSA 每个 query 看到 `32 + 128 + 128 = 288` 个 keys，而 full attention 是 1024，减少 3.5x。

## 使用它

NSA 正在 DeepSeek 自己的 long-context pre-training pipeline 中使用。截至 2026 年 4 月，public inference stacks 中的集成状态：

- **DeepSeek internal**：native，已发布权重使用 NSA 或其后继 DSA (Deepseek Sparse Attention)。
- **vLLM**：正在为 DeepSeek-V3.x weights 开发 experimental NSA support。
- **SGLang**：已发布 NSA benchmarks；production path 跟随 vLLM。
- **llama.cpp / CPU**：不支持；在 CPU throughput 下，kernel decomposition 的开销不值得。

什么时候使用 NSA：

- 面向 64k-plus context，并且有严肃 compute budget 的 pre-training 或 continued-training run。
- 对 DeepSeek 自己的 long-context checkpoints 进行 inference。这些 weights 是 NSA-native。

什么时候不要使用：

- Serving 现有 dense-attention pre-trained model。没有 continued training，无法 retrofit NSA。
- Context 低于 16k。三分支开销会超过节省收益。
- Batch-1 interactive chat。latency-sensitive decode 会受益，但只在 long contexts 下成立。

## 交付它

本课会产出 `outputs/skill-nsa-integrator.md`。给定一个 long-context pre-training run specification，它会生成一份 NSA integration plan：compression block size、top-k、sliding window、gate MLP width、kernel choice，以及用于证明架构变更合理性的具体 long-context evals。

## 练习

1. 在 1024-Token 合成序列上运行 `code/main.py`。在三个 presets 上 sweep `(l, k, w)` 并打印 compute counts。找出在 needle-in-haystack test 上保持相对 full attention 95% recall 的同时，每个 query key-count 最低的 preset。

2. 将 mean-pool compressor 替换为一个 tiny learned MLP（2-layer，hidden 32）。在一个信号是 block 平均值的合成任务上训练它。测量它在 held-out data 上相对 mean-pool baseline 的 perplexity gap。

3. 实现 gate MLP。它以 query 作为输入，输出三个 scalars。展示 gate 的行为是合理的：在 random queries 上接近 uniform weighting；当 query 命中很远之前的 block 时，对 selected branch 给出较高权重。

4. 计算 NSA-enabled 70B 模型在 128k context 下的 KV cache memory budget。KV heads 为 8，head dim 为 128，BF16。与 full attention 以及 MLA（Phase 10 · 14 展示了 MLA 的数字）进行比较。找出 NSA 的 fine-grained branch KV cache 等于 full attention 的序列长度。

5. 阅读 NSA 论文（arXiv:2502.11089）第 4 节，并用三句话解释为什么 compressed branch 的 Attention scores 会被复用于 top-k selection，而不是计算一个单独的 routing score。将答案关联到 Gradient flow。

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Compressed branch | “粗粒度视图” | 在 block-averaged keys 上做 Attention，以每个 query `O(N/l)` 个 keys 提供 global context |
| Selected branch | “Top-k blocks” | 在 compressed-branch scores 最高的 `k` 个 blocks 上做细粒度 Attention |
| Sliding window | “Local context” | 在最后 `W` 个 Token 上做 Attention，以捕获短程模式 |
| Native trainability | “打开 sparsity 进行 pre-train” | sparsity pattern 在 pre-training 期间学习，而不是在 inference 时外挂 |
| Compression block size l | “粗粒度视图的 group size” | 多少个 Token 被合并成一个 summary；通常为 32-64 |
| Top-k | “要保留的 blocks” | 读取其未压缩 Token 的 compressed blocks 数量；通常为 16 |
| Sliding window W | “Local attention radius” | 通常为 512；更短会损害 local coherence，更长会浪费计算 |
| Branch gate | “如何混合三个分支” | per-position MLP 输出，对三个分支的贡献加权 |
| Hardware alignment | “Kernel-friendly sparsity” | 选择 sparse pattern，使实际 GPU kernel 能达到理论 speedup |
| DSA | “NSA 的后继者” | Deepseek Sparse Attention，DeepSeek 系谱中继 NSA 之后的架构 |

## 延伸阅读

- [Yuan et al. — Native Sparse Attention: Hardware-Aligned and Natively Trainable Sparse Attention (arXiv:2502.11089, ACL 2025 Best Paper)](https://arxiv.org/abs/2502.11089) — 论文
- [DeepSeek-V3 Technical Report (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437) — NSA 面向的架构家族
- [Moonshot AI — MoBA: Mixture of Block Attention for Long-Context LLMs (arXiv:2502.13189)](https://arxiv.org/abs/2502.13189) — 同期工作，针对 blocks 的 MoE-style Attention
- [Beltagy et al. — Longformer: The Long-Document Transformer (arXiv:2004.05150)](https://arxiv.org/abs/2004.05150) — sliding-window 起源
- [Xiao et al. — StreamingLLM: Efficient Streaming Language Models with Attention Sinks (arXiv:2309.17453)](https://arxiv.org/abs/2309.17453) — NSA 改进的 inference-time sparsity baseline
- [Dao et al. — FlashAttention-2 (arXiv:2307.08691)](https://arxiv.org/abs/2307.08691) — NSA kernels 在 64k 下击败的 full-attention baseline
