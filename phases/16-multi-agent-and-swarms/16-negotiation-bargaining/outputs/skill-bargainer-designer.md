---
name: bargainer-designer
description: 设计 negotiation protocol：哪个 agent 负责 narrates，哪个 component 生成 offers，private scratchpads 如何与 public messages 分离，round bound 是多少，以及如何监控 deal rate。
version: 1.0.0
phase: 16
lesson: 16
tags: [multi-agent, negotiation, bargaining, contract-net, OG-Narrator]
---

给定一个 negotiation 或 task-market 场景（two-party bargain、N-party auction、contract-net task allocation），设计 protocol。

生成：

1. **Mechanism。** Two-party bargain、N-bidder auction、contract-net broadcast 或 multi-party coalition。命名这个 game。
2. **Offer generator。** Deterministic（Zeuthen-style concession、Rubinstein equilibrium、simple linear schedule）或 LLM-prompted。默认：deterministic，除非 offer 必须是 qualitative structure（proposal、role assignment）。
3. **Narration layer。** LLM 贡献什么：面向 human 的 framing、persuasion tactics、persona。明确说明 LLM 不决定什么。
4. **Private vs public channels。** 如何让 reasoning traces 不进入 counterpart 的 context。使用 “Private scratchpad” + “public message” 两个字段。根据 arXiv:2503.06416，这是不可协商的。
5. **Round bound。** Two-party 最多 3-5 轮。无上限不是选项；它会奖励 conformity，并鼓励情绪化 offers。
6. **Reservation and BATNA discipline。** 双方都必须知道自己的 reservation price。如果对方试探，LLM narrator 不得透露。针对这条规则验证每一条 outgoing message。
7. **Deal-rate monitoring。** 此 protocol 的预期 baseline deal rate（引用 negotiation benchmarks 中的数字：根据 LLM role，范围为 27%-89%）。设置 regression 的 alert threshold。
8. **Escalation。** 低于阈值的 rounds、ZOPA violations 或 counterpart-side rule-breaking，路由到 mediator agent 或 human。

硬性拒绝：

- 任何让 LLM 在没有 deterministic fallback 的情况下计算 numerical offer 的设计。arXiv:2402.15813 表明这会产生约 27% 的 deal rates。
- 任何没有分离 private 和 public channels 的设计。Counterparts 会读到你的 reasoning。
- 任何使用无上限轮次的设计。它会保证产生 conformity-driven outcomes。
- 让单个 agent 同时持有 buyer 和 seller state 的设计（roleplay bargaining）。Private-information property 是这个 mechanism 的核心；合并角色会移除它。

拒绝规则：

- 如果任务没有 numerical payoff（qualitative negotiation、contract terms），OG-Narrator decomposition 可能不适用。改为推荐 structured proposal + schema validation。
- 如果用户无法实现独立 scratchpad（single-LLM-call architecture），明确标出泄漏风险，并推荐 two-call architecture。
- 如果 negotiation 是 adversarial，且某一方可能说谎，推荐 mediator agent 加 logged offers 以便 audit。

输出：一页 brief。以单句摘要开头（“Two-party bargain：Zeuthen offer generator + LLM narrator，5-round bound，separate scratchpad，deal-rate alert below 85%。”），然后给出以上八个部分。最后给出一条 sample message：counterpart 看到什么，private scratchpad 保存什么。
