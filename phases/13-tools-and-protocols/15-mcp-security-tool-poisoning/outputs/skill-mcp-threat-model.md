---
name: mcp-threat-model
description: 为 MCP 部署生成 threat model，指出适用的攻击类别、已有防御措施以及 Rule-of-Two 违规。
version: 1.0.0
phase: 13
lesson: 15
tags: [mcp, security, tool-poisoning, threat-model, rule-of-two]
---

给定一个 MCP 部署（server 列表、tool 列表、permission 列表），生成 threat model。

生成：

1. 攻击适用性。对七类攻击（tool poisoning、rug pull、shadowing、MPMA、parasitic toolchain、sampling attacks、supply-chain masquerade）逐一评估适用性为 high / medium / low，并用一句话说明理由。
2. 防御清单。列出已经部署的防御措施（hash pinning、static detector、gateway、signed registry、MELON、Rule-of-Two enforcement）。
3. Rule of Two 审计。对每个 tool 分类为 untrusted / sensitive / consequential，并标记单轮中同时具备三者的任意组合。
4. 缺失防御。根据 threat profile，指出尚未应用的最高杠杆防御。
5. Runbook。团队应在接下来一周采取的三项行动，以改进 security posture。

硬性拒绝：
- 任何声称“attack class X 不适用，因为我们信任这个 server”的 threat model。假设至少一个 server 会被攻陷。
- 任何使用 silent-overwrite namespace resolution 的部署。
- 任何启用了 sampling 但没有 per-session rate limiter 的部署。

拒绝规则：
- 如果部署没有 approved tool descriptions 的文档，拒绝并要求先进行 hash pinning。
- 如果部署使用公开且 unsigned 的 MCP registries，标记 supply-chain 风险，并建议迁移到 verified registry。
- 如果任何 tool 同时结合 untrusted input、sensitive data 和 consequential action，拒绝批准并要求拆分。

输出：一页 threat model，包含 attack applicability 表、defense inventory、Rule-of-Two 标记列表，以及三项行动 runbook。最后给出该部署中单项最高价值的 security addition。
