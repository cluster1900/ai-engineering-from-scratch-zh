---
name: dualpipe-planner
description: 为 training cluster 规划 pipeline parallelism 策略（1F1B、Zero Bubble、DualPipe、DualPipeV）。
version: 1.0.0
phase: 10
lesson: 19
tags: [pipeline-parallelism, dualpipe, dualpipev, zero-bubble, expert-parallelism, distributed-training]
---

给定一个 training cluster 规格（总 GPU 数、interconnect topology、accelerator model、每个 GPU 的 memory）、一个 model shape（total params、active params、MoE 或 dense、expected layer count），以及目标 training-data volume，推荐一种 pipeline parallelism 策略，并确认预期 bubble fraction。

生成：

1. Pipeline depth P。根据 GPU memory budget（必须能让每个 rank 容纳一个 pipeline stage）、MoE vs dense，以及 interconnect bandwidth 选择。范围：小 cluster 使用 4，frontier MoE training 使用 16-32。
2. Micro-batch count M。对于 DualPipe 和 DualPipeV，必须能被 2 整除。典型 M/P 比例在 8 到 16 之间。结合 gradient-accumulation 目标和目标 sequence length 下的 activation memory 进行论证。
3. Schedule choice。从 1F1B、Zero Bubble、DualPipe、DualPipeV 中选择。决策表：500 GPUs 以下的 dense training -> Zero Bubble。带 expert parallelism 的 MoE -> DualPipe。500 GPUs 以上且没有 heavy all-to-all 的 dense training -> DualPipeV。100 GPUs 以下的小规模运行 -> 1F1B 即可。
4. Expected bubble fraction。针对所选 schedule，在目标 P 和 M 下计算。以百分比报告，并以相对于 1F1B、在总 training budget 下节省的绝对 GPU-hours 报告。
5. Parameter replication plan（仅 DualPipe）。确认 2x parameter replication 能放入可用 VRAM。报告所选 P 下每个 GPU 的 effective parameter density。

硬性拒绝：
- 没有 Expert Parallelism 的 DualPipe。没有 EP-heavy comms 可隐藏时，2x replication 不值得。
- 任何 training run 上 P > 64。无论 schedule 如何，bubble fraction 都会随 P 线性增长。
- 对 DualPipe/DualPipeV，micro-batch count 不能被 2 整除。该 schedule 无法闭合。
- 当模型能放入单个 GPU memory 时使用 pipeline parallelism。只使用 data parallelism。

拒绝规则：
- 如果 interconnect 为每个 GPU 200Gbps 或更慢，拒绝 DualPipe 并推荐 DualPipeV。all-to-all overlap window 太窄，不足以证明 replication 的合理性。
- 如果用户无法提供适合其 cluster topology 的 custom all-to-all kernel，推荐 Zero Bubble 而不是 DualPipe。
- 如果 training run 低于 1B tokens，完全拒绝 pipeline parallelism planning，并推荐 data parallelism 加 tensor parallelism。

输出：一页计划，列出 P、M、schedule、expected bubble fraction、parameter replication cost（如果使用 DualPipe），以及 all-to-all kernel recommendation。最后用一个 "rollback trigger" 段落结尾，说明具体 utilization metric（aggregate GPU utilization percentage，在前 1000 steps 上测量）：如果未达到目标数值，就应切换到更简单的 schedule。
