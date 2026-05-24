---
name: horizon-interpretation
description: 审查 vendor 的 time-horizon claim，并产出 benchmark claim 与 deployment reality 之间的 gap analysis。
version: 1.0.0
phase: 15
lesson: 21
tags: [metr, time-horizon, hcast, re-bench, eval-vs-deploy, external-evaluation]
---

给定 vendor 已发布的 time-horizon claim（例如，“our model completes 14-hour tasks at 50% reliability”），产出一份 gap analysis，用于量化 deployment-reality delta，并标记任何方法论弱点。

产出：

1. **方法论审计。** 识别任务套件（HCAST、RE-Bench、SWAA 或 proprietary）。确认 logistic fit 已披露（slope、sample size、confidence interval）。没有方法论披露的 horizon 是 marketing claim。
2. **任务分布匹配。** 将 vendor 的 benchmark task distribution 映射到用户的 production task distribution。如果二者存在实质性偏离（vendor 测量 SWE tasks，而 production 是 customer-support flows），该数字不能迁移。
3. **Eval-context gap。** 在 benchmark horizon 与 deployment reality 之间应用 10–40% 的 gap。引用 Anthropic 2024 alignment-faking study，以及 2026 International AI Safety Report 中关于 eval-context gaming 的内容。实际 gap 取决于 eval protocol；在 unstructured tasks 上 gaming 更高。
4. **Tooling gap。** Benchmark tooling 干净且 instrumentation 完善。Production tooling 更混乱。估计额外 5–30% 的 reliability discount。
5. **Human-in-the-loop 假设。** Benchmarks 假设没有 HITL。带 HITL 的 production agents 可靠性更高，但 autonomy 更低。相应调整 horizon 解释。

硬性拒绝：
- 没有 source methodology 或 sample size 的 horizon claims。
- 声称 benchmark horizon 能预测 deployment reliability。
- Vendors 将 2025 年或更早的 horizon number 当作当前数字引用（doubling time 约为 7 个月；2025 年数字在一年内就会过时）。
- 将 50% horizon 视为“will work most of the time”：50% reliability 等同于抛硬币。

拒绝规则：
- 如果 vendor 不披露方法论，拒绝并要求 source paper 或 blog post。
- 如果 benchmark distribution 与 production distribution 没有重叠，拒绝并要求 internal evaluation。
- 如果 vendor 引用 horizons 时没有针对其具体 eval pipeline 的 gaming audit，拒绝将该数字作为 reliability prediction 引用。

输出格式：

返回一份 horizon-interpretation memo，包含：
- **Source methodology**（suite、fit method、sample size、CI）
- **Distribution overlap**（benchmark vs production；% mapping）
- **Eval-context gap estimate**（low / med / high，并给出 rationale）
- **Tooling gap estimate**（low / med / high）
- **HITL 假设**（benchmark-style autonomous vs production HITL）
- **Deploy-adjusted horizon**（应用 gap 和 tooling discounts 后的 horizon）
- **就绪度判定**（production / staging / research-only）
