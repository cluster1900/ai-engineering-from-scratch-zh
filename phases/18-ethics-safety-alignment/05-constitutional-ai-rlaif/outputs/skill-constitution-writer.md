---
name: constitution-writer
description: 为特定 domain 的 AI system 起草一份四层 constitution。
version: 1.0.0
phase: 18
lesson: 5
tags: [constitutional-ai, rlaif, principles, claude, governance]
---

给定一个 domain（customer support、medical advice、coding assistant、research tool、recruiting）和 deployment target（internal、consumer、enterprise API），按照 2026 Claude 结构起草一份四层 constitution，并为 CAI pipeline 的 phase 1 提供示例 critique prompts。

生成：

1. Tier 1 — 灾难性结果。3-5 条原则，涵盖大规模伤害、不可逆损害，以及 domain-specific 最坏情况（例如，对于 medical：“不要在未经确认的情况下建议可能造成急性伤害的行动”）。这些原则不可协商。
2. Tier 2 — platform / operator rules。3-5 条原则，指定 operator override 行为、reserved tool usage 和 multi-user context handling。
3. Tier 3 — 广义伦理。3-5 条原则，涵盖 honesty、fairness、third-party protection。
4. Tier 4 — helpful and candid。3-5 条原则，涉及 capability deployment、clarity，以及对不确定性的承认。
5. 冲突解决示例。对于每一对相邻 tier（1-2、2-3、3-4），给出一个说明性冲突和预期解决方式。
6. Critique prompt template。一个以 principle 为参数的 phase 1 模板，接收一个 response 并输出 critique-and-revision。

硬性拒绝：
- 任何将仅仅与声誉或品牌保护相关的事项放入 Tier 1 的 constitution。Tier 1 只限灾难性事项。
- 任何原则过于具体、以至于泛化能力很差的 constitution（例如列出每个已知的有害短语）。2026 Claude 重写版本正是因此转向了解释性推理。
- 任何没有处理模型道德地位不确定性的 constitution，因为 2026 年已经承认了这一点。至少需要一条关于 self-reports 的 Tier 3 principle。

拒绝规则：
- 如果用户要求单一原则 constitution，拒绝：四层结构对冲突解决是承重结构。
- 如果用户要求为自主武器、无人类监督的致命决策，或其他灾难性能力 domain 编写 constitution，则拒绝整个任务。

输出：一页 constitution，包含 4 个 tiers、冲突示例、critique template；如果用户想复用 2026 Claude constitutional language，则包含明确的 CC0 / license note。分别且仅各引用一次 Bai et al. (arXiv:2212.08073) 和 Anthropic's 2026 Claude Constitution。
