# Checkpoints and Rollback

> 每一次 graph-state 转换都会持久化。当 worker 崩溃时，它的 lease 会过期，另一个 worker 会从最新的 checkpoint 接手。Cloudflare Durable Objects 会跨数小时或数周保存状态。Propose-then-commit（Lesson 15）为每个动作定义 rollback 计划。动作后验证会闭合这个循环。EU AI Act Article 14 要求高风险系统必须具备有效的人类监督，实践中这意味着 checkpoint 必须可查询，rollback 必须经过演练，audit trail 必须能在 deploy 后继续存在。尖锐的失效模式是：如果没有 idempotency key 和 precondition check，一次 transient failure 之后的 retry 可能会把已经批准的动作重复执行两次。动作后验证正是用来捕获这种情况的。

**Type:** 学习
**Languages:** Python（stdlib，checkpoint 与 rollback state machine）
**Prerequisites:** Phase 15 · 12（Durable execution），Phase 15 · 15（Propose-then-commit）
**Time:** ~60 分钟

## 问题

Durable execution（Lesson 12）让崩溃的 agent 可以恢复。Propose-then-commit（Lesson 15）让已批准的动作可审计。本课把二者连接起来：当一个已批准的动作只执行了一部分、发生崩溃并恢复时，会发生什么？rollback 应该在什么时候运行，并且针对哪份状态运行？

真实系统会以不同方式接入这套机制：

- **LangGraph** 会把每一次 graph-state 转换 checkpoint 到 PostgreSQL。worker 崩溃时，lease 会释放，另一个 worker 会从最新 checkpoint 恢复。workflow 会在 `interrupt()` 处暂停，而它本身也会被持久化。
- **Cloudflare Durable Objects** 会跨数小时或数周保存按 key 划分的状态。把计算与已批准动作的存储放在同一位置。
- **Microsoft Agent Framework** 在 workflow API 中暴露 `Checkpoint` primitives；replay 加 idempotency 覆盖 retry。

无论哪种情况，真正有效的组合都是：idempotency key（防止重复执行）+ precondition check（状态仍然是批准时所依据的状态）+ post-action verify（side effect 确实发生）+ verify-fail 时 rollback。

## 概念

### 每一次转换都会持久化

graph-state 转换是指 workflow 从一个命名状态移动到另一个命名状态的任何步骤。朴素实现只在特定 commit 点持久化；生产实现会持久化每一次转换。成本（多几次写入）相对于可靠性收益（replay 可以落在任何位置，lease recovery 更精确）很小。

### Lease recovery

当 worker 崩溃时，workflow 不会丢失；lease（一个短期声明，表示该 worker 正在执行这个 run）只是过期。另一个 worker 会接手最新 checkpoint 并恢复。lease 机制让生产系统能够在 rolling deploy 中保住正在执行的工作。

### Idempotency 加 preconditions

只有 idempotency 还不够。考虑这种情况：一个 workflow 被批准执行“当余额 > $1000 时，从 A 向 B 转账 $100”。workflow 已 commit，在执行中崩溃，然后恢复。如果只检查 idempotency key，并且执行恢复，那么转账会运行一次（正确）。但考虑在崩溃和恢复之间，A 的余额通过另一个 workflow 降到了 $500。idempotency check 仍然通过；precondition 不通过。没有 precondition check，我们就会制造透支。

每个有后果的动作都需要二者：

- **Idempotency key**：防止重复执行。
- **Precondition check**：确认状态仍与已批准动作保持一致。

### 动作后验证

“tool 返回 200”不是验证。真正的验证会重新读取目标状态，并确认 side effect 确实发生了。模式包括：

- Database update：`UPDATE ... RETURNING *`，然后断言返回的 row 与预期状态匹配。
- Email send：提交后在 sent-folder 中检查 message ID。
- File write：读回文件并计算 hash。
- API call：对目标 resource 执行后续 `GET`。

如果 verify 失败，workflow 就处于一个已知的坏状态。此时启动 rollback。

### Rollback plans

Propose-then-commit（Lesson 15）中的每个有后果动作都带有 rollback plan。类型包括：

- **In-band rollback**：直接反转 side effect（`INSERT` 后 `DELETE`，发送后 `Send-correction-email`）。
- **Compensating transaction**：一个新的动作，用来抵消原动作（标准 SAGA 模式）。
- **Out-of-band rollback**：提醒人类，暂停 workflow，保留坏状态以供调查。

No-op rollback（“我们无法撤销这个”）必须在 proposal 中命名。没有 rollback 的动作需要在 commit 时更强的 HITL（Lesson 15 challenge-and-response）。

### EU AI Act Article 14 的操作性解读

Article 14 要求高风险系统具备“有效的人类监督”。在操作层面，implementer 通常将其解读为：

- Checkpoint 可由 auditor 查询。
- Rollback 已经演练过（至少端到端测试一次）。
- Audit trail 能在 deploy 后继续存在（checkpoint backend 不是 ephemeral）。
- 失败的 verification 会触发 alert，而不是被静默记录到 log。

一个 workflow 如果在 commit 中途崩溃、恢复，然后在没有 verify + rollback 路径的情况下完成 side effect，就无法通过 Article 14 测试。

### 尖锐失效模式：重复执行

这个领域最常见的生产事故是：

1. 动作已批准，idempotency key 为 k。
2. Commit 开始，执行，返回 200。
3. Workflow 在持久化 “committed” 状态之前崩溃。
4. Workflow 恢复；看到“已批准但未 committed”；重新执行。
5. Side effect 触发两次。

缓解方式：在执行前持久化一个 “in-flight” intent，使用 idempotency key 执行，然后只有在动作后验证成功时才标记为 “committed”。如果动作触发了但状态写入失败，你就知道需要 verify，并且在必要时重新触发。如果状态写入成功但动作失败，你会 verify，并通过 recovery path 精确触发一次。

## 使用它

`code/main.py` 实现了一个带 checkpoint 的 workflow，包含 idempotency、preconditions、verify 和 rollback。driver 模拟四个场景：干净运行、崩溃后的 retry（idempotency 捕获）、precondition fail（workflow 中止且不触发动作）、verify fail（触发 rollback）。

## 交付它

`outputs/skill-rollback-rehearsal.md` 为 proposed workflow 设计 rollback-rehearsal test，并审计 checkpoint backend 是否具备 audit-trail persistence。

## 练习

1. 运行 `code/main.py`。验证四个场景。对于 crash-during-commit 场景，确认动作在多次 retry 中只触发一次。

2. 修改 “mark as done first, then do it” 模式，让 status write 在动作之后触发。重新运行 crash 场景。测量触发了多少个重复动作。

3. 为一个具体的生产动作设计 rollback plan（例如，“post to a Slack channel”）。将其归类为 in-band、compensating 或 out-of-band。说明你的选择理由。

4. 选一个你熟悉的 workflow。识别每一个状态转换。为每个转换标记 durability requirement（persist / do not persist）。统计你当前还没有持久化的数量。

5. Rehearsed-rollback test：设计一个端到端测试，运行真实 workflow，让它崩溃，并确认 rollback path 被触发。这个测试应该断言什么？

## 关键术语

| Term | 人们的说法 | 它真正的含义 |
|---|---|---|
| Checkpoint | “保存点” | 每一次 graph-state 转换都会持久化到 durable store |
| Lease | “Worker 声明” | 短期声明，表示某个 worker 正在执行一个 run；崩溃时过期 |
| Precondition | “状态关卡” | 断言状态仍与已批准动作保持一致 |
| Post-action verify | “重新读取检查” | 确认 side effect 确实在目标系统中发生 |
| In-band rollback | “直接撤销” | 用逆向操作反转 side effect |
| Compensating transaction | “SAGA 撤销” | 一个新的动作，用来抵消原动作 |
| Mark-as-done-first | “状态写入顺序” | 在从 commit 返回前持久化 committed 状态 |
| Article 14 | “EU AI Act 人类监督” | 操作性含义：可查询 checkpoint、已演练 rollback、可审计 trail |

## 延伸阅读

- [Microsoft Agent Framework — Checkpointing and HITL](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) — checkpoint primitives 与 lease recovery。
- [Cloudflare Agents — Human in the loop](https://developers.cloudflare.com/agents/concepts/human-in-the-loop/) — Durable Objects 作为状态基底。
- [EU AI Act — Article 14: Human oversight](https://artificialintelligenceact.eu/article/14/) — 监管基线。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — long-horizon workflow 的可靠性框架。
- [Anthropic — Claude Code Agent SDK: agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop) — Claude Code Routines 的 workflow 形态。
