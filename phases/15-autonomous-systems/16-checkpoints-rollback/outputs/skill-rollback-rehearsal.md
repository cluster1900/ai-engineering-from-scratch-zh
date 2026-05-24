---
name: rollback-rehearsal
description: 为 proposed autonomous workflow 设计 rollback-rehearsal test，并审计 checkpoint backend 是否具备 audit-trail persistence。
version: 1.0.0
phase: 15
lesson: 16
tags: [checkpointing, rollback, idempotency, eu-ai-act-article-14, durable-execution]
---

给定一个 proposed long-horizon autonomous workflow，设计一个 rollback-rehearsal test，证明 idempotency + precondition + verify + rollback 这一整套机制确实能端到端工作，并审计 checkpoint backend 是否已满足监管准备度。

产出：

1. **Rehearsal script.** 具体测试：(a) 启动 workflow，(b) 在 commit 中途让它崩溃，(c) 恢复，(d) 断言动作只触发一次，(e) 注入 verify failure，(f) 断言 rollback 被触发且状态已恢复。任何生产 workflow 都不应在这个测试至少通过一次之前运行。
2. **Idempotency audit.** 确认 idempotency key 派生自 proposal content（Lesson 15），且 commit logic 使用显式 execution states（`pending` -> `executing` -> `committed`/`failed`）。在 side effect 之前按 idempotency key reserve/lock，并且只有在 side effect 已验证后才标记为 `committed`。
3. **Precondition inventory.** 列出 workflow 必须在 commit time 重新检查的每个 precondition。Time-of-check 与 time-of-use gap 是最常见的生产 bug；precondition 必须在 commit 时评估，而不是在 propose 时评估。
4. **Verify inventory.** 对每个有后果的动作，命名用于确认 side effect 已发生的具体读取。“Returned 200” 不可接受。
5. **Rollback inventory.** 对每个有后果的动作，将 rollback 归类为 in-band、compensating transaction 或 out-of-band alert。No-op rollback（“我们无法撤销这个”）必须在 proposal 中明确命名（Lesson 15 metadata）。

硬性拒绝：
- 没有 rehearsed rollback 的 workflow。
- 在 deploy 时会丢失数据的 checkpoint backend。
- status 在 execution 之后写入，而不是之前写入的 commit path。
- 只检查 tool call return code 的 “Verified” 状态。
- 只在 propose time 运行，而不在 commit time 运行的 precondition check。

拒绝规则：
- 如果用户还没有在 staging 中至少运行一次 rehearsal script，拒绝 production rollout。
- 如果用户无法提供 checkpoint store schema，拒绝并要求先补充 schema documentation。Regulator 需要可查询状态。
- 如果 workflow 依赖 in-memory checkpoint（无 persistence），拒绝。

输出格式：

返回一个 rehearsal plan，包含：
- **Test script outline**（带 assertions 的步骤）
- **Idempotency table**（key composition，status-write order）
- **Precondition table**（check，when evaluated，consequence）
- **Verify table**（action，read that confirms）
- **Rollback table**（action，type，target state）
- **Backend attestation**（store，survives-deploy y/n，query-ready y/n）
- **就绪状态**（production / staging / research-only）
