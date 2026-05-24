---
name: sequence-architecture-picker
description: 根据长度、吞吐量和训练预算选择序列架构（RNN、Transformer、SSM、hybrid）。
version: 1.0.0
phase: 7
lesson: 1
tags: [transformers, architecture, rnn, ssm]
---

给定一个序列问题（max length、batch shape、已预算的训练 Token、推理延迟目标、device class），输出：

1. 主要架构。可选项之一：transformer、state-space model (Mamba/RWKV)、hybrid SSM+attention、RNN。用一句话说明理由，并关联到主导约束。
2. Context length 策略。如果是 transformer：full attention cutoff、sliding window size、RoPE scaling factor。如果是 SSM：scan chunk size。如果是 RNN：hidden width。
3. 训练 FLOP profile。根据架构 + context 估算每个 Token 的 FLOPs；说明该规格是否符合计算预算。
4. 推理 memory profile。Transformer 使用 KV cache，SSM 使用 state size，RNN 使用 per-token memory。如果目标设备能容纳 batch size 为 1 的单个 batch，则标记出来。
5. 风险说明。指出一个该选择在此规格规模下已知的具体 failure mode（例如，在没有 Flash Attention 的 24GB GPU 上，Transformer 在 64K context 时 OOM）。

对于任何超过 1B Token 的训练运行，如果不明确说明 gradient-flow 和并行性惩罚，则拒绝推荐纯 RNN。对于 >64K context，如果不说明 `O(N^2)` memory cost，则拒绝推荐 full-attention Transformer。对于生产环境，如果没有指定 fallback，则拒绝推荐全新架构（发表时间 <12 个月）。
