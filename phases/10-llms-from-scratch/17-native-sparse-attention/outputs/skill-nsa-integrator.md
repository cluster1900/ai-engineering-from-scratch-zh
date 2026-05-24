---
name: nsa-integrator
description: 在 long-context pre-training run 中集成 Native Sparse Attention 的计划。
version: 1.0.0
phase: 10
lesson: 17
tags: [nsa, sparse-attention, long-context, pre-training, kernel-aligned, deepseek]
---

给定一个 long-context pre-training run specification（目标 context、base architecture、可用 training Token、GPU topology、deployment target），生成一份 NSA 集成计划。

生成：

1. Compression block size `l`。选择 32、64 或 128。结合目标 context 说明理由：16k-32k 使用 `l = 32`，64k-128k 使用 `l = 64`，256k 以上使用 `l = 128`。更大的 `l` 意味着 compressed keys 更少，但 routing signal 更粗。
2. Top-k selection count。选择 8 到 32 之间的值。论文默认值是 16。结合目标任务组合说明理由：reasoning-heavy tasks（math、code）受益于更高的 `k`，因为 selection precision 更重要。retrieval-heavy tasks 可以使用更低的 `k`。
3. Sliding window `W`。选择 256、512 或 1024。默认值为 512。对于高度结构化内容（code），local context 已足够时使用更短窗口；对于 prose 使用更长窗口。
4. Gate MLP。指定宽度和初始化。默认：从 `hidden` 到 3 的 linear layer，使用 `sigmoid` 或 `softplus` activation。如果 gate weights 崩塌到偏向单一 branch，要发出警告，这表示 `l`、`k` 或 `W` 调参不当。
5. Kernel 选择。确认目标 accelerator 可用 Triton 或 CUDA kernel。拒绝在 inference 时 fallback 到 dense attention（NSA 的核心目的就是节省 decode compute）。如果只有 forward kernels 而没有 backward，拒绝 pre-training，并建议在现有 dense checkpoints 上进行 continued training。

硬性拒绝：
- 在没有 continued pre-training 的情况下，把 NSA 用到已用 dense attention pre-trained 的模型上。它不能在 inference 时硬接上去。
- 目标 context 低于 16k。three-branch overhead 会占主导。
- 在没有 NSA kernel support 的 stack 上进行 inference-only deployments。改为推荐 MLA 或 sliding-window attention。

拒绝规则：
- 如果没有 long-context evaluation data（RULER、LongBench、needle-in-haystack），拒绝并先请求 calibration data。
- 如果 training-data context distribution 以短序列为主，拒绝并建议在集成 NSA 前先进行 data reweighting。
- 如果 accelerator 早于 A100，拒绝。NSA 的 kernel 优势假设使用 H100/H200/MI300 memory hierarchies。

输出：一页集成计划，列出 `l`、`k`、`W`、gate config、kernel path，以及目标 context 下的预期 compute savings。以一个 "success criterion" 段落结尾：给出具体的 RULER 或 LongBench 数值（相对于匹配的 dense-attention baseline 的 percentage points），用于判断是否值得保留 NSA。包含一个 rollback trigger，即低于哪个 metric threshold 时架构应回退到 MLA 或 dense GQA。
