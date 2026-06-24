# Differential Attention (V2)

> Softmax Attention 会在每个不匹配的 Token 上分散少量概率。在 100k 个 Token 上，这些噪声会累积起来并淹没信号。Differential Transformer（Ye et al., ICLR 2025）通过将 Attention 计算为两个 softmax 的差来解决这个问题，从而减去共享的噪声下限。DIFF V2（Microsoft, 2026 年 1 月）是面向生产栈的重写版本：decode latency 与 baseline Transformer 持平，无需 custom kernels，并兼容 FlashAttention。本课将端到端讲解 V1 到 V2，并提供一个可运行的差分操作 toy implementation，使用 stdlib Python 即可运行。

**类型:** 构建
**语言:** Python (stdlib)
**前置要求:** Phase 7 · 02 (self-attention), Phase 7 · 15 (attention variants), Phase 10 · 14 (architecture walkthrough)
**时间:** ~60 分钟

## 学习目标

- 准确说明为什么 softmax Attention 存在噪声下限，以及它为什么会随 context length 增长。
- 推导 differential attention 公式，并解释为什么相减会抵消共享噪声成分，同时保留信号。
- 讲清 V1 到 V2 的差异：哪些部分更快、更简单、更稳定，以及为什么每项变化对生产级 pre-training 都是必要的。
- 用纯 Python 从零实现 differential attention，并在一个合成的 signal-plus-noise query 上实证验证噪声抵消特性。

## 问题

标准 softmax Attention 有一个数学性质，在规模变大时会变成工程上的麻烦。对于 query `q`，Attention 权重是 `softmax(qK^T / sqrt(d))`。Softmax 永远无法产生精确的零值——每个不匹配的 Token 都会得到一些正的质量。这个残余质量就是噪声，并且会随 context length 扩大。在 128k 个 Token 下，即使每个不匹配 Token 只获得 0.001% 的概率，127,999 个 Token 合在一起也会贡献约 12% 的总量。模型必须学会绕开一个随 context 增长的噪声下限。

在实证上，这表现为 Attention head 干扰：long-context RAG 中的幻觉引用、100k-Token 检索任务中的 lost-in-the-middle 失败，以及 needle-in-haystack benchmark 在超过 32k 后出现的细微 accuracy 下降。Differential Transformer 论文（arXiv:2410.05258, ICLR 2025）测量了这种差距：DIFF Transformers 相比同尺寸 baselines 取得了更低 perplexity、更高 long-context accuracy，以及更少 hallucinations。

DIFF V1 有三个问题，使它无法进入前沿 pre-training pipeline。它的 value cache 在每个 decode step 都必须加载两次，它需要 custom CUDA kernels，破坏了 FlashAttention 兼容性，而且它的 per-head RMSNorm 在 70B 以上规模的长期训练中会导致不稳定。DIFF V2（Microsoft unilm blog, 2026 年 1 月 20 日）修复了这三个问题。本课将讲解两个版本，构建差分算子，并在 toy query 上 benchmark 噪声抵消效果。

## 核心概念

### Softmax 的噪声下限

对于 query `q` 和 keys `K = [k_1, ..., k_N]`，Attention 权重是：

```
w_i = exp(q . k_i / sqrt(d)) / sum_j exp(q . k_j / sqrt(d))
```

没有任何 `w_i` 会是零。如果 `k_i` 与 `q` 完全无关，score `q . k_i` 也不是 0——它会围绕零波动，方差为 `||q||^2 / d`。经过 softmax normalization 后，每个无关 Token 仍会向加权和贡献 `O(1/N)`。无关 Token 的总贡献是 `O((N-1)/N) = O(1)`——这不是一个小量。

模型想要的更像是 hard top-k：在匹配 Token 上给高权重，在其他位置接近零。Softmax 过于平滑，无法直接做到这一点。

### Differential 思路

将每个 head 的 Q 和 K projections 拆成两份：Q = (Q_1, Q_2)，K = (K_1, K_2)。计算两个 Attention maps：

```
A_1 = softmax(Q_1 K_1^T / sqrt(d))
A_2 = softmax(Q_2 K_2^T / sqrt(d))
```

输出：

```
DiffAttn = (A_1 - lambda * A_2) V
```

相减会抵消两个 maps 共享的任何噪声分布。如果两个 maps 在 127k 个无关 Token 上都有近似均匀的权重（在随机初始化时确实如此），这些部分会相互抵消。信号——少数真正相关 Token 上的尖峰权重——只有在两个 maps 中以相同幅度出现时才会被抵消，而模型训练后不会保持这种状态。

`lambda` 是每个 head 一个可学习标量，参数化为 `lambda = exp(lambda_q1 dot lambda_k1) - exp(lambda_q2 dot lambda_k2) + lambda_init`。它可以为负。`lambda_init` 默认是类似 0.8 的小正数。

### 为什么这类似带 head 的噪声抵消

可以把它想象成两个有噪声的麦克风在录同一个声音。两者都会录到说话者以及相关的背景噪声。从一个信号中减去另一个，共享噪声就会下降。声音能保留下来，是因为两个信号在相位或幅度上有足够差异，不会被完全抵消。每个 head 的 `lambda` 学到的正是这种平衡。

### V1 vs V2：差异

V1 保持了与 baseline Transformer 相同的参数量。为了让每个 head 有两个 queries，它将 head dimension 减半。这牺牲了 head 的表达能力，更痛的是，还让每个 head 的 value cache 减半。Decode 每一步都必须加载 value cache 两次（每个 softmax branch 一次）。结果：尽管参数量相同，decode 仍比 baseline 慢。

V2 将 query heads 数量加倍，并保持 KV heads 不变（从 up-projection 借用参数）。Head dimension 保持与 baseline 相同。相减之后，额外维度会被投影回去，以匹配 baseline Transformer 的 O_W projection。三件事同时发生：

1. Decode speed 与 baseline 持平（KV cache 只加载一次）。
2. FlashAttention 可原样运行（无需 custom kernel）。
3. Decode 时的 arithmetic intensity 提高（每次从 HBM 加载 byte 时对应更多 compute）。

V2 还移除了 V1 用来稳定相减操作的 per-head RMSNorm。在 70B 级 pre-training 规模下，该 RMSNorm 会让后期训练不稳定。V2 用更简单的 initialization scheme 替代它，在不增加额外模块的情况下保持训练稳定。

### 何时使用它

| Workload | Benefit |
|----------|---------|
| Long-context RAG (64k+) | 更干净的 Attention maps，更少幻觉引用 |
| Needle-in-haystack benchmarks | 32k 之后 accuracy 显著提升 |
| Multi-document QA | 更少跨文档干扰 |
| Code completion at 8k | 收益有限，不值得改变 architecture |
| Short chat (< 4k) | 基本与 baseline 不可区分 |

收益会随 context length 增长而增加。在 4k Token 下，噪声下限足够小，标准 Attention 已经可用。在 128k 下，它会开始明显伤害效果。

### 它如何与其他 2026 knobs 搭配

| Feature | Compatible with DIFF V2? |
|---------|------------------------|
| GQA | 是（V2 增加 Q heads，而不是 KV heads） |
| MLA (DeepSeek) | 原则上是，但尚无公开论文将二者结合 |
| MoE | 是（Attention 独立于 MLP block） |
| RoPE | 是（不变） |
| YaRN / long-context scaling | 是（正是 DIFF 最有帮助的场景） |
| FlashAttention | 是，V2 支持（V1 不支持） |
| Speculative decoding | 是（Attention 改动对 spec-decode loop 不可见） |


```figure
differential-attention
```

## 构建它

`code/main.py` 用纯 Python 实现了 differential attention。一个具有已知 signal-plus-noise 结构的 toy query，可以让你直接测量噪声抵消比率。

### 步骤 1: standard softmax attention

Stdlib Matrix ops：list of lists、手写 matmul、带最大值相减以保证数值稳定性的 softmax。

```python
def softmax(row):
    m = max(row)
    exps = [math.exp(x - m) for x in row]
    s = sum(exps)
    return [e / s for e in exps]
```

### 步骤 2： 将 Q、K 拆成两半

V1 风格：将 head dimension 减半。V2 风格：保持 head dimension，并将 heads 数量加倍。toy implementation 为了教学清晰使用 V1——数学完全相同，只有 bookkeeping 不同。

### 步骤 3： 两个 softmax branches + 相减

```python
A1 = [softmax([dot(q1, k) / scale for k in K1]) for q1 in Q1]
A2 = [softmax([dot(q2, k) / scale for k in K2]) for q2 in Q2]
diff_weights = [[a1 - lam * a2 for a1, a2 in zip(r1, r2)] for r1, r2 in zip(A1, A2)]
out = [[sum(w * v[j] for w, v in zip(row, V)) for j in range(d_v)] for row in diff_weights]
```

注意：输出权重可以为负。这没有问题——value cache 仍然可以处理带符号的贡献。后续 V projection 会吸收符号。

### 步骤 4： 噪声抵消测量

构造一个长度为 1024 的合成序列。将 signal Token 放在已知位置，其余位置填充噪声。计算 (a) 标准 softmax Attention 在 signal 位置上的权重，以及 (b) differential attention 权重。测量两者的 signal-to-noise ratio。根据两个 branches 被训练到多大程度产生差异，DIFF attention 通常能稳定地产生高出 3x-10x 的 signal-to-noise ratio。

### 步骤 5： V1 vs V2 参数核算

给定一个 config（hidden=4096, heads=32, d_head=128），打印：

- Baseline Transformer：Q、K、V 各自大小为 `hidden * hidden`，MLP 为 4 * hidden。
- DIFF V1：Q、K 各自大小为 `hidden * hidden`，V 大小为 `hidden * hidden`（不变），head dim 在内部减半。增加 per-head `lambda` 参数（O(heads * d_head)）。
- DIFF V2：Q 大小为 `2 * hidden * hidden`，K 大小为 `hidden * hidden`，V 大小为 `hidden * hidden`。额外维度会在 O_W 前投影回去。增加相同的 `lambda` 参数。

toy 会测量 V2 的额外参数成本（大约每个 Attention block 额外 `hidden * hidden`），并打印出来。

## 使用它

截至 2026 年 4 月，DIFF V2 尚未在每个生产 inference server 中发布，但 vLLM 和 SGLang 正在推进集成。同时，这种模式已经出现在：

- Microsoft 内部 long-context 生产模型。
- 多个面向 256k+ context 的开放模型训练运行中的研究复现。
- 将 DIFF attention 与 sliding-window attention 在交替 layers 上组合的 hybrid architectures。

你会在 2026 年选择它的场景：

- 从零训练一个目标为 64k+ effective context 的新模型。从一开始加入 differential attention；之后重新训练代价很高。
- Fine-tuning 一个 long-context 模型，且 lost-in-the-middle 失败主导你的 eval。在 Q projections 上做 LoRA 可以近似 DIFF 结构。

你不会选择它的场景：

- 你正在服务一个 long-context 性能稳定的 pre-trained dense model。对现有 weights 来说，重新训练成本通常很难回本。
- 你的 context 始终低于 16k。噪声下限可以忽略。

## 交付它

本课会生成 `outputs/skill-diff-attention-integrator.md`。给定一个 model architecture、target context length、hallucination profile 和 training budget，它会生成一份 integration plan，用于把 differential attention 加入新的 pre-training run 或 LoRA fine-tune。

## 练习

1. 运行 `code/main.py`。验证在合成 query 上，differential attention 报告的 signal-to-noise ratio 高于标准 softmax Attention。改变噪声幅度，并展示标准 Attention 变得不可用的 crossover point。

2. 对一个 7B 级模型（hidden=4096, heads=32, d_head=128, 32 layers），计算从 baseline 到 DIFF V1 以及从 baseline 到 DIFF V2 的参数量变化。展示哪些组件增加了参数，哪些保持不变。

3. 阅读 DIFF V1 论文（arXiv:2410.05258）的 Section 3，以及 DIFF V2 Hugging Face blog 的 Section 2。用两句话解释为什么 V1 的 per-head RMSNorm 是必要的，以及为什么 V2 可以移除它而不会导致 training divergence。

4. 实现一个 ablation：分别用 `lambda = 0`（纯 first softmax）和 `lambda = 1`（完整相减）计算 differential attention。在合成 query 上，测量 signal-to-noise 如何随 sweep 变化。找出能最大化 signal-to-noise 的 `lambda`。

5. 将 toy 扩展到 GQA + DIFF V2。选择 8 个 KV heads 和 32 个 Q heads。展示 KV cache size 与相同 (8, 32) 配置的 baseline GQA model 匹配。

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Differential attention | “两个 softmax 相减” | 将 Q、K 拆成两半，计算两个 softmax maps，从第一个中减去第二个（由 lambda 缩放），然后乘以 V |
| Noise floor | “softmax 的非零尾部” | Softmax 放在每个无关 Token 上的 O(1/N) 权重，在 long contexts 中会累加到 O(1) |
| lambda | “相减的缩放系数” | 每个 head 的可学习标量，参数化为 `exp(lq1.lk1) - exp(lq2.lk2) + lambda_init`；可以为负 |
| DIFF V1 | “ICLR 2025 版本” | 原始 Differential Transformer；将 head dim 减半以保持参数量，需要 custom kernel，decode 更慢 |
| DIFF V2 | “2026 年 1 月修复版” | 在保持 KV heads 的同时将 Q heads 加倍；decode speed 与 baseline 持平，并兼容 FlashAttention |
| Per-head RMSNorm | “V1 稳定器” | V1 在差分之后应用的额外 norm；V2 移除了它，以避免后期训练不稳定 |
| Signal-to-noise ratio | “有多少 Attention 被浪费了” | 真实 signal 位置上的权重与无关位置平均权重之间的比率 |
| Lost in the middle | “Long-context failure mode” | 一个实证现象：长 context 中间位置文档的检索 accuracy 会下降——DIFF attention 可以缓解这一点 |
| Arithmetic intensity | “每加载一个 byte 对应多少 FLOPs” | V2 在 decode 时通过每次 KV 加载对应双倍 queries 来提高的比率；对 memory-bound decode 很重要 |

## 延伸阅读

- [Ye et al. — Differential Transformer (arXiv:2410.05258, ICLR 2025)](https://arxiv.org/abs/2410.05258) — 原始论文，包含噪声抵消理论和 long-context ablations
- [Microsoft unilm — Differential Transformer V2 (Hugging Face blog, January 2026)](https://huggingface.co/blog/microsoft/diff-attn-v2) — 面向生产栈的重写版本，匹配 baseline decode，并兼容 FlashAttention
- [Understanding Differential Transformer Unchains Pretrained Self-Attentions (arXiv:2505.16333)](https://arxiv.org/abs/2505.16333) — 关于为什么相减能恢复 pretrained Attention 结构的理论分析
- [Shared DIFF Transformer (arXiv:2501.17900)](https://arxiv.org/html/2501.17900) — 参数共享变体
- [Vaswani et al. — Attention Is All You Need (arXiv:1706.03762)](https://arxiv.org/abs/1706.03762) — DIFF 所相减的 baseline Transformer
- [Liu et al. — Lost in the Middle (arXiv:2307.03172)](https://arxiv.org/abs/2307.03172) — DIFF attention 面向的 long-context benchmark
