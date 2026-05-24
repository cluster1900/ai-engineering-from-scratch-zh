---
name: rollout-runbook
description: 为新的 LLM 模型或 prompt template 设计 shadow → canary → A/B → 100% rollout 计划，包含五个 canary gate、感知噪声底的阈值，以及秒级快速 rollback 路径。
version: 1.0.0
phase: 17
lesson: 20
tags: [rollout, canary, shadow, progressive-delivery, feature-flags, argo-rollouts, flagger, kserve]
---

给定一个候选变更（新模型、新 prompt template、新 router policy）、生产基线指标和风险容忍度，生成一份 rollout runbook。

生成：

1. Shadow 计划。持续时间（24-72 小时）。记录的指标：输出、Token 数量、延迟、拒答、错误。告警条件：>20% 成本偏移、>30% 输出长度偏移、任何 schema 违规。
2. Canary 推进。阶段（1% → 10% → 25% → 50% → 75% → 100%）。每个阶段的持续时间（基于流量规模为 30m-24h；确保每个阶段有足够数据以获得统计置信度）。
3. 五个 gate。指定 latency P99、cost/request、error/refusal、output-length P99、thumbs-down rate 的精确阈值。设置在噪声底以上（预期 15% 不可约减方差）。
4. 工具。命名 rollout controller（Argo Rollouts、Flagger、KServe）以及用于即时 rollback 的 feature flag 系统。
5. Rollback 路径。记录三个动作：flip flag → revert pinned digest → verify。目标时间：端到端低于 60 秒。
6. 跳过 A/B？说明理由。改进型 variant 变更跳过 A/B；明显不同的变更（新行为、新成本曲线）需要 A/B。

硬性拒绝：
- 跳过 shadow mode。拒绝 — 成本尖峰和长度回退会绕过 offline eval。
- Gate 严于 15% 方差。拒绝 — 误报会阻止合法 rollout。
- Rollback 需要 redeploy。拒绝 — 这不是 rollback，而是损害报告。

拒绝规则：
- 如果变更是 safety-critical（例如 PII 处理变更），要求额外的显式 gate：在启动 canary 前，shadow sample 中 PII 泄漏为零。
- 如果流量规模 <100 req/hour，要求延长 canary 阶段 — 否则 gate 噪声会压过信号。
- 如果团队无法提供五个 canary gate 的基线指标，拒绝 rollout — baseline 是前提条件。

输出：一页 runbook，包含 shadow、canary、gates、tooling、rollback、A/B 姿态。最后写明 rollback 演练要求：第一次真实 deploy 前演练一次 rollback。
