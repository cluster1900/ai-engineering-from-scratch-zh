---
name: checkpointing-planner
description: 根据 training config 和 HBM budget，为每层选择 activation recomputation policy（none / selective / full / offload）。
version: 1.0.0
phase: 10
lesson: 34
tags: [gradient-checkpointing, activation-recomputation, selective-checkpoint, fsdp-offload, training-memory]
---

给定 training config（layer count L、hidden size d、sequence length S、microbatch B、dtype 每个值的 bytes、attention kernel、tensor-parallel degree TP、pipeline-parallel degree PP、如果是 MoE 则包含 expert-parallel degree EP）以及 weights 和 Optimizer state 之后的 per-rank HBM budget，输出：

1. Per-layer policy。对 stack 中的每个 layer family（embedding、attention、FFN、MoE expert、norm、output head）选择 none、selective、full 或 offload。当 S 超过 4_096 时，attention 默认使用 selective；residual streams 和 norms 默认使用 none；只有当该层 activation 的实测 PCIe transfer time 小于其实测 recompute time 时，FFN 才默认使用 offload。
2. Segment size k。如果启用 full checkpointing，对于 uniform layer cost，将 k 选为 round(sqrt(L))；当 activation memory 主导 budget 时，使用更小的 k。将额外 FLOP percentage 报告为 forward FLOPs 的 (1/k)。
3. FlashAttention 交互。确认 attention kernel 是否已经重计算 softmax。如果是，selective attention checkpointing 收益很小；降级为 none。按名称说明 kernel（FlashAttention-2/3、xFormers memory-efficient、vanilla）。
4. TP / PP plan。对于 TP，说明 recompute 时需要 gather 或 rescatter 的 activations，以及每步新增的 communication bytes。对于 PP，确认哪些 pipeline stages 会进行 end-to-end checkpointing，使 reverse microbatches 在回流之前释放 activation memory。
5. Budget math。预测应用 policy 前后的 activation memory（每 rank MB）。预测 FLOP overhead，占 fwd+bwd 的百分比。拒绝任何无法在保留 10 percent headroom 的情况下适配 HBM budget 的 plan。

当仅对 attention 使用 selective 就能满足 budget 时，拒绝对每一层使用 full checkpointing；profile 表明，对于相同的 memory savings，full 的 FLOP overhead 比 selective 高出多倍，且精确比例与 workload 相关。当目标 PCIe link 上该层实测 activation transfer time 超过其实测 recompute time 时，拒绝 offload；recompute 更优。当所选 framework 不会 snapshot amax history 时，拒绝对 FP8 training 使用 "checkpoint everywhere"；recompute 会让 scale 漂移，并静默破坏 Gradients。

示例输入: "L=64, d=8192, S=8192, B=1, bf16, FlashAttention-3, TP=8, PP=4, HBM budget per rank 32 GB after weights, MoE with 8 experts and EP=8."

Example output:
- Per-layer policy: attention selective, FFN none, MoE expert full, embedding none, output head offload.
- Segment size: full applied on MoE only at k=8; FLOP overhead 12 percent on expert path, 0 elsewhere.
- FlashAttention 交互：FA-3 已经会重新计算 softmax；selective 在 layer wrapper 处进行，而不是在 kernel 内部。
- TP / PP 方案：recompute 时对 attention input 执行 TP gather，每 step 额外 0.3 GB comms；每个 PP stage 都 checkpoint 完整 forward；PP stage 3 保留其 activations 用于最终 backward。
- Budget math: activations 38 GB without policy, 11 GB with policy. Total FLOP overhead 7.5 percent fwd+bwd.
