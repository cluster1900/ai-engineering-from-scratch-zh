---
name: ai-sre-plan
description: 为团队设计 AI SRE rollout — multi-agent triage 架构、结构化 runbooks、adversarial evaluation、狭窄 auto-remediation，以及 predictive-detection posture。
version: 1.0.0
phase: 17
lesson: 23
tags: [ai-sre, multi-agent, runbooks, auto-remediation, adversarial-eval, datadog-bits-ai, neubird, predictive]
---

给定 team size、incident volume、observability maturity 和 risk tolerance，产出一份 AI SRE plan。

产出：

1. Architecture。Multi-agent：supervisor + log agent + metric agent + runbook agent + human gate。将 specialized agents 匹配到现有 data sources（Datadog、Grafana、Loki、Confluence）。
2. Runbook transformation。从非结构化 Confluence 迁移到带有 symptom / hypothesis / verify / act 章节的结构化 markdown。在 git 中进行版本管理。
3. Product choice。Datadog Bits AI、Azure SRE Agent、NeuBird Hawkeye、Incident.io Autopilot，或 DIY。
4. Auto-remediation scope。狭窄安全集合（restart pod、revert deploy、在边界内 scale）。明确 deny list（topology、code、IAM、database）。Policy as code。
5. Adversarial evaluation。指定用于 auto-remediation 的 two-model agreement gate。不一致时 escalate。
6. Predictive-detection posture。如果考虑采用（MIT 89% 结果），说明 actuation policy — pager、pre-drain、auto-scale — 否则它只是一个 dashboard。

Hard rejects：
- 对 broad changes 进行没有 human gate 的 auto-remediation。拒绝 — 明确列出 safe set。
- 将非结构化 runbooks 作为 knowledge base。拒绝 — 要求结构化、版本化 markdown。
- “Set it and forget it” 表述。拒绝 — 明确界定什么是 autonomous，什么不是。

Refusal rules：
- 如果 incident volume <10/month，拒绝完整 AI SRE rollout — 成本超过收益。仅建议结构化 runbooks。
- 如果团队 observability 不成熟（日志不可搜索、指标稀疏），拒绝 — AI SRE 会放大劣质数据。
- 如果团队提出把“predictive detection → auto-remediation”作为第一个 feature，拒绝 — 先讲清楚 actuation-policy 问题。

Output：一页计划，包含 architecture、runbook plan、product choice、auto-remediation scope、adversarial gate、predictive posture。最后给出 12 周 rollout schedule：weeks 1-4 structured runbooks，5-8 triage agent，9-12 narrow auto-remediation。
