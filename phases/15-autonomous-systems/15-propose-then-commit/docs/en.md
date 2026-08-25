# Human-in-the-Loop：Propose-Then-Commit

> 2026 年关于 HITL 的共识是具体的。它不是“agent 发问，用户点击 Approve”。它是 propose-then-commit：拟议 action 会连同 idempotency key 持久化到 durable store；以 intent、data lineage、permissions touched、blast radius 和 rollback plan 呈现给 reviewer；只有在明确肯定确认后才 commit；执行后再 verify，确认 side effect 确实发生。LangGraph 的 `interrupt()` 加 PostgreSQL checkpointing、Microsoft Agent Framework 的 `RequestInfoEvent`，以及 Cloudflare 的 `waitForApproval()` 都实现了同一种形态。典型 failure mode 是 rubber-stamp approval：“Approve?” 没有经过 review 就被点击。文档化的 mitigation 是带明确 checklist 的 challenge-and-response。

**Type:** 学习
**Languages:** Python (stdlib，带 idempotency 的 propose-then-commit state machine)
**前置要求：** Phase 15 · 12 (Durable execution), Phase 15 · 14 (Tripwires)
**Time:** ~60 分钟

## 问题

agent 执行一个 action。用户必须决定：批准还是不批准。如果决策是瞬时的，它很可能不是 review。如果决策是结构化的，它会更慢，但可信。工程问题是如何让结构化 review 成为阻力最小的路径。

2023 年代的 HITL pattern 是同步 prompt：“Agent wants to send email to X with body Y — approve?” 用户点击 Approve。每个人都觉得系统是安全的。实践中，这个界面非常容易被 rubber-stamp：用户批准得很快，approval 几乎不能预测什么；当 agent 出错时，audit trail 会显示一长串用户已经记不起来的 approval 历史。

2026 年的 pattern，也就是 propose-then-commit，把 HITL 移到 durable substrate 上，附加结构化 metadata，并要求 positive commit。每个 managed agent SDK 都提供了某个版本：LangGraph `interrupt()`、Microsoft Agent Framework `RequestInfoEvent`、Cloudflare `waitForApproval()`。API 名称不同；形态相同。

## 概念

### propose-then-commit state machine

1. **Propose.** Agent 生成一个 proposed action。它被持久化到 durable store（PostgreSQL、Redis、Durable Object）。包括：
   - intent（agent 为什么要这样做）
   - data lineage（哪个 source 导致了这个 proposal）
   - permissions touched（哪些 scopes / files / endpoints）
   - blast radius（最坏情况是什么）
   - rollback plan（如果 commit 了，我们如何撤销）
   - idempotency key（每个 proposal 唯一；重复提交返回同一条记录）
2. **Surface.** Reviewer 看到包含全部 metadata 的 proposal。Reviewer 是人（不是 agent 自己 review 自己）。
3. **Commit.** 明确肯定确认。action 执行。
4. **Verify.** 执行之后，读取并确认 side effect。如果 verify step 失败，系统处于已知坏状态，并触发 alerting。

### idempotency key

没有 idempotency key 时，transient failure 后的 retry 可能会重复执行一个已批准 action。具体示例：用户批准“transfer $100 from A to B”。网络短暂抖动。Workflow retry。用户只批准了一次，但 transfer 执行了两次。idempotency key 将 approval 绑定到单个唯一 side effect；第二次执行是 no-op。

这与 Stripe 和 AWS APIs 使用的 idempotency pattern 相同。Microsoft Agent Framework docs 明确要求把它复用于 agent approvals。

### Durability：为什么 approvals 能长于进程存活

approval waiting room 是一段不归 agent 所有的 state。workflow 被暂停（Lesson 12）。当 approval 到达时，workflow 会从那个精确位置恢复。这就是为什么 LangGraph 把 `interrupt()` 与 PostgreSQL checkpointing 配对，而不是只用 in-memory state：两天后的 approval 仍然能找到完整的 workflow。

### Rubber-stamp approvals 与 challenge-and-response mitigation

HITL 的默认 UI（“Approve” / “Reject” buttons）会产生快速 approval，但没有真正 review。文档化 mitigation：challenge-and-response checklist，要求在 Approve button 启用之前，对具体问题给出明确肯定回答。具体形态：

- “你理解这次操作会触及哪个 resource 吗？[ ]”
- “你确认 blast radius 可以接受吗？[ ]”
- “如果失败，你有 rollback plan 吗？[ ]”

这不是为了流程而流程，而是一种 forcing function。无法勾选这些框的 reviewer 要么请求澄清（escalation），要么拒绝（safe default）。Anthropic agent-safety research 明确将 checklist-driven HITL 作为缓解 rubber-stamp approval patterns 的 mitigation。

### 什么算 consequential

不是每个 action 都需要 propose-then-commit。2026 年 guidance：

- **Consequential actions**（始终 HITL）：不可逆写入、financial transactions、outbound communication、production database changes、destructive file-system operations。
- **Reversible actions**（有时 HITL）：对 local files 的 edits、staging-env changes、带清晰 rollback 的 reversible writes。
- **Reads and inspections**（从不 HITL）：读取文件、列出 resources、调用 read-only API。

### Post-action verification

“The commit ran” 不等于 “the side effect happened”。Network-partition 和 race conditions 可能让 workflow 以为自己成功了，而 backend 实际并没有 persist。verify step 会在 commit 后重新读取 target resource 以确认。这与使用 `RETURNING` clauses 的 database transactions，或 `PutObject` 后执行 AWS `GetObject` 是同一种 pattern。

### EU AI Act Article 14

Article 14 要求欧盟高风险 AI systems 具备有效 human oversight。“Effective” 不是装饰性要求。监管语言明确排除 rubber-stamp patterns。Microsoft Agent Governance Toolkit compliance docs 中，带 challenge-and-response 的 propose-then-commit 是能经受 Article 14 审查的形态。

```figure
mx-propose-then-commit
```

## 使用它

`code/main.py` 用 stdlib Python 实现了一个 propose-then-commit state machine。Durable store 是 JSON file。Idempotency key 是 (thread_id, action_signature) 的 hash。driver 模拟三种情况：干净的 approval flow、transient failure 后 retry（必须不能 double-execute），以及 rubber-stamp default 与 challenge-and-response flow 的对比。

## 交付它

`outputs/skill-hitl-design.md` 会 review 一个 proposed HITL workflow 是否具备 propose-then-commit 形态，并标记缺失的 metadata、idempotency、verification 或 challenge-and-response layers。

## 练习

1. 运行 `code/main.py`。确认 approved proposal 的 retry 会使用 durable record，并且不会 re-execute。然后把 idempotency key 改成包含 timestamp，展示 retry 会 double-execute。

2. 使用 `rollback` field 扩展 proposal record。模拟一次 verify step 失败的 execution。展示 rollback 会自动触发。

3. 阅读 Microsoft Agent Framework 的 `RequestInfoEvent` docs。找出 API 包含但 toy engine 缺失的一个 metadata field。添加它，并解释它防护的风险。

4. 为一个具体 action（例如“post to a public Twitter account”）设计 challenge-and-response checklist。reviewer 必须回答哪三个问题？为什么是这三个？

5. 选择一个同步 “Approve?” prompt 足够的场景（不需要 durable store）。解释原因，并说明你接受的 risk class。

## 关键术语
| Term | What people say | What it actually means |
|---|---|---|
| Propose-then-commit | “Two-phase approval” | 持久化 proposal + positive commit + verify |
| Idempotency key | “Retry-safe token” | 每个 proposal 唯一；第二次 execution 为 no-op |
| Data lineage | “Where it came from” | 导致 proposal 的具体 source content |
| Blast radius | “Worst case” | action 出错时的影响范围 |
| Rubber-stamp | “Fast approval” | 没有真正 review 就点击 “Approve” |
| Challenge-and-response | “Forcing checklist” | Reviewer 必须明确确认具体问题 |
| RequestInfoEvent | “MS Agent Framework primitive” | 带结构化 metadata 的 durable HITL request |
| `interrupt()` / `waitForApproval()` | “Framework primitives” | 同一形态的 LangGraph / Cloudflare 等价物 |

## 延伸阅读
- [Microsoft Agent Framework — Human in the loop](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) — `RequestInfoEvent`，durable approvals。
- [Cloudflare Agents — Human in the loop](https://developers.cloudflare.com/agents/concepts/human-in-the-loop/) — `waitForApproval()` 和 Durable Objects。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — HITL 作为 long-horizon risk 的 mitigation。
- [EU AI Act — Article 14: Human oversight](https://artificialintelligenceact.eu/article/14/) — 高风险 systems 的监管基线。
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) — 围绕 oversight 的 constitutional framing。
