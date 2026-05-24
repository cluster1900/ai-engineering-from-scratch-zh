---
name: horizon-reality-check
description: 给定一个你想交给 agent 的任务，判断当前 frontier 的 horizon 是否以足够余量覆盖它。
version: 1.0.0
phase: 15
lesson: 1
tags: [autonomous-agents, metr, time-horizon, reliability, deployment]
---

给定一个拟议的 autonomous task（agent 应该做什么、人类专家需要多久、failure cost 是什么），产出一份 reality check，判断当前 frontier model 的 horizon 是否真的覆盖它。

产出：

1. **Expert-time estimate.** 询问用户 median expert completion time，以分钟或小时为单位。如果他们无法估计，拒绝并引导他们先测量一个小样本。
2. **Headroom ratio.** 用所选模型的 50% METR horizon 除以 expert-time estimate。标记任何低于 4x 的 ratio——在 50% success probability 下，你需要充足余量。ratio 为 2x 或更低时，拒绝部署，除非每个重要 action 都有 HITL 介入。
3. **Reliability budget.** 用 tool calls 估计 trajectory length，然后在 per-step reliability 为 0.95、0.99、0.995 时计算 end-to-end success。如果任务长度超过你假设的 per-step reliability 下的 50%-success threshold，则要求 checkpoints 或拆分任务。
4. **Eval-vs-deploy adjustment.** 在 benchmark horizon 与 deploy-context horizon 之间应用 20-40% 的 gap。在向 stakeholders 解释时，引用 Anthropic 2024 alignment-faking study 或 2026 International AI Safety Report。
5. **Required controls.** 基于 headroom，列出最小控制集合：budget cap、iteration cap、kill switch、HITL checkpoint points、canary Token，以及 trajectory audit schedule。

硬性拒绝：
- 任何 horizon ratio 低于 2x 且没有对每个 consequential action 进行 HITL 的部署。
- 任何仅基于 METR horizon 声称模型“能做”某任务的说法。horizon 是 logistic curve 上的 50% 标记；tail failures 必然存在。
- 将 METR horizons 视为下限而非上限。

拒绝规则：
- 如果用户无法估计任务的 expert-time，拒绝并要求他们先测量一个小样本。除此之外都是猜测。
- 如果拟议任务在完整模型定价下会超过用户的 worst-case budget，拒绝并建议先使用 Lesson 13 中的 budget controls。
- 如果用户描述的任务涉及不可逆 actions（financial transactions、production database writes、emails to customers），却没有任何 HITL layer，则拒绝。horizon 论证不能通过不可逆部署。

输出格式：

返回一份简短 memo，包含：
- **Task summary**（一句话）
- **Expert-time estimate**（带单位）
- **Headroom ratio**（带明确数字）
- **End-to-end reliability estimate**（三种 per-step rates 的表格）
- **Minimum controls**（项目符号）
- **Go / hold / no-go**（明确结论加一句理由）
