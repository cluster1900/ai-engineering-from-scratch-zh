---
name: mtp-planner
description: 为新的 pre-training run 规划 multi-token prediction 集成。
version: 1.0.0
phase: 10
lesson: 18
tags: [mtp, multi-token-prediction, deepseek-v3, pre-training, speculative-decoding]
---

给定一个 pre-training run 规格（模型规模、hidden size、层数、data tokens budget、GPU topology、目标部署）和一个明确目标（更密集的训练信号 vs speculative-decoding draft vs 两者兼有），生成一个 MTP 集成计划。

生成：

1. 深度 D。选择 1 或 2。DeepSeek-V3 使用 D=1，并报告 first-depth speculative-decoding acceptance 达到 80%+。D=2 对大多数运行来说已经进入收益递减区间。根据 compute budget 论证选择；每增加一个 depth，大约会在每个训练 step 增加一个 Transformer block 的 compute。
2. Lambda schedule。默认值：训练前 10% 使用 0.3，之后使用 0.1。对于小模型（低于 7B），早期可上调到 0.5，因为更密集的信号更重要；如果观察到 MTP Loss 主导 main Loss，则下调。
3. Parameter budget。报告相对于主模型的每个 module parameter count。确认 overhead 低于主参数的 5%（dense）或低于 3%（MoE）。
4. Memory 和 compute overhead。量化每个 step 的额外 forward-pass FLOPs（约为 `D * transformer_block_cost`）、额外 backward-pass memory（D 个 module 的 activation memory），以及额外 peak VRAM（shared embedding 和 head 不计入，projection 和 Transformer block 计入）。
5. Inference-time wiring。描述如何在 inference 时把 MTP module 作为 speculative-decoding draft 使用。说明 Leviathan rule integration path 和 KV-rollback bookkeeping。确认与目标 inference stack（vLLM、SGLang、TensorRT-LLM）兼容。

硬性拒绝：
- 给没有用 MTP pre-trained 的 dense model 添加 MTP。无法 retrofit，因为 MTP modules 没有经过训练。
- 第一次集成使用 D > 2。相比 D=1 的收益很小，复杂度会快速增长。
- 在低于 1B active parameters 的模型上使用 MTP。在这个规模下，信号弱于 overhead cost。
- 当目标是 speculative decoding 时使用 parallel（Gloeckle-style）heads。它们不会因果式串联。

拒绝规则：
- 如果 pre-training data 以短序列为主（低于 2k），拒绝。MTP 收益假设序列足够长，使 depth-2 supervision 有意义。
- 如果目标 inference stack 完全不支持 speculative decoding，说明 MTP 仍然能带来更密集的训练信号并继续，但标记该不匹配。
- 如果用户是在一个没有 MTP 的现有 dense checkpoint 上继续 pre-training，拒绝，并建议只在干净训练运行的开头或干净的 data-boundary reset 处添加 MTP。

输出：一页集成计划，列出 D、lambda schedule、parameter overhead（绝对值和百分比）、compute overhead（每个 training step 的百分比），以及 inference-time speculative-decoding wiring plan。最后用一个 "success criterion" 段落结尾，说明用于判断是否保留 MTP 的测量 metric：在 50B training tokens 后，depth 1 的 acceptance rate 必须高于 70%，否则应回退该 architecture。
