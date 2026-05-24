---
name: hitl-design
description: Review 一个 proposed Human-in-the-Loop workflow 是否具备 propose-then-commit 形态，并标记缺失的 metadata、idempotency、verification 或 challenge-and-response layers。
version: 1.0.0
phase: 15
lesson: 15
tags: [hitl, propose-then-commit, idempotency, langgraph, cloudflare, agent-framework, eu-ai-act]
---

给定一个 proposed HITL workflow，对照 propose-then-commit reference 审计它，并标记缺失、定义不足或与监管不兼容的部分。

产出：

1. **Proposal metadata.** 确认每个 proposal 都呈现：intent（为什么）、data lineage（source content）、permissions touched、blast radius（最坏情况）、rollback plan。缺失字段是 blocker；“the agent wants to X” 不是 proposal。
2. **Idempotency.** 说明 idempotency key composition。它必须能从 proposal content 推导出来，这样 retry 才会返回同一条记录。包含 wall-clock time 的 key 不是 idempotency key；它们是 logging timestamps。
3. **Durability.** 说明 store（PostgreSQL、Redis、Durable Object、带 integrity check 的 object storage）。确认 approvals 能在 agent restart、host restart 和 deploy 后继续存在。In-memory queues 不合格。
4. **Approval surface.** Rubber-stamp approval（单个 Approve button）无法通过此审计。必需：challenge-and-response checklist，对 intent understanding、blast-radius verification 和 rollback readiness 给出明确肯定确认。确认 checklist 是针对具体 action class 定制的，而不是泛泛而谈。
5. **Post-commit verify.** 确认 workflow 会在 execution 后重新读取 target resource，并在 verify failure 时 alert。“The tool returned 200” 不是 verify。

Hard rejects:
- 不以 durable 方式 persist proposals 的 HITL surfaces。
- reviewer 是 agent 自身的 approval flows。
- 任何没有 challenge-and-response 的 irreversible production action。
- 带 wall-clock components 的 idempotency keys。
- consequential actions 缺少 post-commit verify 的 workflows。

Refusal rules:
- 如果用户能说出 approval UI，但说不出它背后的 durable store，拒绝并要求先提供 store。
- 如果用户把 “max_budget_usd and a confirmation dialog” 当作足够的 HITL，拒绝。Budgets 限制 cost，不保证 correctness。
- 如果 deployment 触及高风险 EU scope，且仍保留 rubber-stamp patterns，基于 Article 14 拒绝。

Output format:

返回一份 propose-then-commit audit，包含：
- **Proposal field table**（intent / lineage / blast / rollback / permissions — 五项全部必需）
- **Idempotency note**（key composition、retry test result）
- **Durability line**（store、survives-restart y/n）
- **Approval surface**（rubber-stamp / checklist；如果是 checklist，列出 questions）
- **Post-commit verify**（present y/n、它重新读取什么）
- **就绪状态**（production / staging / research-only）
