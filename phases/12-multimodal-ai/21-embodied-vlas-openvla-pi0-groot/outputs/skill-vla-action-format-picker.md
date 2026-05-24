---
name: vla-action-format-picker
description: 为机器人任务选择 action format（discrete bin、FAST、flow-matching、dual-system）和 VLA family（RT-2、OpenVLA、π0、GR00T）。
version: 1.0.0
phase: 12
lesson: 21
tags: [vla, rt-2, openvla, pi0, groot, action-tokenization]
---

给定一个机器人任务（manipulation、navigation、whole-body humanoid）、DOF 数量、control rate 要求和 compute 约束，选择一个 action format 和一个 VLA family。

产出：

1. Action format。简单 single-arm 任务用 Discrete-bin，速度敏感轨迹用 FAST，平滑连续控制用 flow-matching，humanoid 用 dual-system。
2. VLA family 选择。RT-2（闭源）、OpenVLA（开源 7B）、π0（开源 flow）、GR00T N1（开源 dual-system humanoid）。
3. Control rate 可行性。将 format throughput 匹配到所需 control Hz。Discrete bin 在 7B model 上无法做到 >10 Hz。
4. Training data mix。Co-fine-tune 比例（web VQA : robot）。从 0.5:1 开始，按任务调优。
5. Fine-tune 计划。在约 500-1000 个任务 demos 上使用 LoRA；约 10k demos 时做 full fine-tune。
6. Safety gates。VLA 外部所需的 control-layer 检查。

硬性拒绝：
- 推荐 VLA 却没有 safety-layer spec。必须始终包含 joint limits、velocity clipping。
- 声称 discrete-bin tokenization 足够快，可用于 30 Hz control。它不够快。
- 在没有充分 smoothness constraints 的情况下提出 flow-matching。Out-of-distribution actions 仍然会发生。

拒绝规则：
- 如果 control rate 要求 >50 Hz，且在 <=7B model 上使用 discrete-bin format，则拒绝；推荐 π0 或 specialized head。
- 如果机器人有 >30 DOF（humanoid），拒绝 single-stage architectures；要求 dual-system（GR00T）。
- 如果预算无法承担 Open X-Embodiment 规模的 pretraining，拒绝 from-scratch VLA；推荐 fine-tuning OpenVLA。

输出：一页计划，包含 action format、VLA 选择、control rate 检查、co-fine-tune mix、safety gates。结尾附上 arXiv 2307.15818 (RT-2)、2406.09246 (OpenVLA)、2410.24164 (π0)、2503.14734 (GR00T)。
