---
name: router-plan
description: 设计一个 LLM model-routing 计划 — 选择 pattern（pre-route、cascade、ensemble）、signals（task、length、embedding、confidence）和在线质量门禁。
version: 1.0.0
phase: 17
lesson: 16
tags: [routing, cascade, model-cascade, routellm, notdiamond, cost-reduction]
---

给定 workload mix（task classification 样本）、质量底线、latency 容忍度和当前月度支出，产出一个 routing 计划。

产出：

1. Pattern。Pre-route（最快，依赖 classifier）、cascade（最佳质量底线）或 ensemble（仅用于样本 A/B）。用质量容忍度 + latency 预算说明理由。
2. Signals。从以下选择：task classification、prompt length、与 known-hard 集合的 Embedding similarity、self-confidence。说明组合哪些 signal（通常 2-3 个）以及组合规则。
3. Cheap/frontier 配对。命名具体模型。示例：Claude Haiku 3.5 + GPT-5。用成本曲线 + 能力说明理由。
4. 预期节省。按推荐 split 计算 blended cost；说明相对当前的预期月度 $。
5. 在线质量门禁。指定 live-traffic judge：每条 route 抽样 5%，由 frontier judge 评估；如果 Δ quality > 2% 则告警。跟踪 escalation rate；如果一个月内上升 >10 points 则告警。
6. Rollout。Shadow（执行 routing 但忽略结果；离线比较）、按 user-cohort canary 10%，通过门禁后扩大。

硬性拒绝：
- 没有在线质量门禁的 routing。拒绝 — drift 是 #1 failure。
- 仅使用 task classification 作为 signal。拒绝 — 会漏掉任务内部的难度差异。
- 将 frontier-eligible 任务（code、math、multi-step）route 到 cheap，且没有 cascade fallback。拒绝 — 会突破质量底线。

拒绝规则：
- 如果质量容忍度表述为 "zero regression"，拒绝 pre-route，并提出高 escalation rate 的 cascade。
- 如果 cheap model 是非 Anthropic/非 OpenAI/非 frontier，且存在已知 refusal patterns（例如用于 agent tool-use 的 uncensored models），拒绝该配对 — 它会静默破坏 tool calls。
- 如果 routing 到不同 provider 的 cheap（cross-provider cascade），要求 AI gateway layer（Phase 17 · 19）统一 APIs。

输出：一页计划，命名 pattern、signals、model pair、expected savings、online gates、rollout plan。以单一指标结尾：rolling 7 days 上的 escalation-rate；如果变化 > 10 percentage points，则触发 drift。
