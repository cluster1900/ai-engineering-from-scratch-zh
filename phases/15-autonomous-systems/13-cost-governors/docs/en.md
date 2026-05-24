# Action Budgets、Iteration Caps 与 Cost Governors

> 某个中型 e-commerce agent 的月度 LLM 成本，在团队启用 "order-tracking" skill 后，从 $1,200 跳到了 $4,800。这不是定价 bug。这是一个 agent 发现了新的循环，并持续在循环里花钱。Microsoft 的 Agent Governance Toolkit（2026 年 4 月 2 日）把针对这类问题的防线标准化了：每次请求的 `max_tokens`、每个任务的 Token 和美元预算、每日/月度上限、iteration caps、分层 model routing、prompt caching、context windowing、昂贵操作上的 HITL checkpoints、预算违约时的 kill switches。Anthropic 的 Claude Code Agent SDK 用不同名称提供了同样的基础能力。财务速度限制，例如 10 分钟内超过 $50 就切断访问，比月度上限更快抓住循环。

**Type:** Learn
**Languages:** Python (stdlib, layered cost-governor simulator)
**先修要求：** Phase 15 · 10 (Permission modes), Phase 15 · 12 (Durable execution)
**Time:** ~60 minutes

## 问题

Autonomous agents 的每一轮都会花真钱。chatbot 的坏输出是一条坏回复；agent 的坏循环是一张账单。行业文档中对这种失败模式的术语是 "Denial of Wallet"：agent 持续推理、持续调用工具、持续计费，而没有任何东西阻止它，因为一开始就没有设计这种阻止机制。

修复办法不是一个数字，而是一组不同时间尺度和粒度的限制：每次请求、每个任务、每小时、每天、每月。设计良好的栈能在几分钟内抓住失控循环，在几小时内抓住缓慢泄漏，在一天内抓住糟糕发布。同一套栈也能让 long-horizon 且 autonomous 的 agent 真正受预算约束。

这是一节工程课：数学很简单，团队失败的地方在纪律。下面的限制列表，要么来自 Microsoft Agent Governance Toolkit，要么来自 Anthropic Claude Code Agent SDK 文档中的命名。

## 概念

### cost-governor 栈

1. **每次请求的 `max_tokens`。** 简单。防止任何一次调用生成无边界的 completion。
2. **每个任务的 Token 预算。** 整个运行过程中，不得超过 N 个 Token。到达上限时硬停止。
3. **每个任务的美元预算。** 与 Token 类似，但单位是货币。Claude Code 中是 `max_budget_usd`。
4. **每个工具调用上限。** 不超过 N 次 `WebFetch` 调用、N 次 `shell_exec` 调用，等等。
5. **Iteration cap (`max_turns`)。** agent loop 的总迭代次数；防止无限推理循环。
6. **每分钟 / 每小时 / 每天 / 每月上限。** 滚动窗口。用于在不同时间尺度抓住泄漏。
7. **财务速度限制。** 例如，“如果 10 分钟内花费超过 $50，则切断访问。”在月度上限触发前抓住基于循环的消耗。
8. **分层 model routing。** 默认使用更小的 model；只有当 classifier 判断任务值得时才升级到更大的 model。
9. **Prompt caching。** System prompt 和稳定 context 存在 provider cache 中；重新发送的 Token 成本接近零。
10. **Context windowing。** 通过 compaction / summarization 把 active context 保持在阈值以下；直接降低 Token 成本。
11. **昂贵操作上的 HITL checkpoints。** 在已知昂贵的操作之前（长时间工具调用、大下载、昂贵的 model 升级），要求人工确认。
12. **预算违约时的 kill switch。** 任一上限触发时 session 中止。记录触发的上限；需要单独的重新启用路径。

### 为什么需要栈，而不是单个上限

单个月度上限只会在钱包已经空了之后才抓住失控 agent。单个每请求上限无法在 session 层面抓住任何问题。不同失败模式需要不同时间尺度：

- **失控循环**（agent 卡在 5 秒重试中）：由速度限制抓住。
- **缓慢泄漏**（agent 每个任务做了约 2x 预期工作）：由每日上限抓住。
- **糟糕发布**（新版本使用 5x Token）：由每周 / 每月上限抓住。
- **合法激增**（真实需求，不是 bug）：由小时 / 天上限抓住，并产生清晰日志。

### Claude Code 的预算表面

Claude Code Agent SDK 暴露了（公开文档）：

- `max_turns` — iteration cap。
- `max_budget_usd` — 美元上限；违约时 session 中止。
- `allowed_tools` / `disallowed_tools` — 工具 allowlist 和 denylist。
- 工具使用前的 hook points，用于自定义成本核算。

与 permission-mode ladder（Lesson 10）结合使用。没有 `max_budget_usd` 的 `autoMode` session 是不受治理的 autonomy。Anthropic 明确把 Auto Mode 描述为需要预算控制；classifier 与成本正交。

### EU AI Act、OWASP Agentic Top 10

Microsoft 的 Agent Governance Toolkit 覆盖 OWASP Agentic Top 10 和 EU AI Act Article 14（human oversight）要求。对于 EU 的生产环境，日志记录和上限执行不是可选项。

### 观察到的 $1,200 → $4,800 案例

Microsoft 文档中的真实案例：一个 e-commerce agent 在添加新工具后，月度成本翻了三倍。该工具允许 agent 在每个 session 中轮询订单状态。没有循环检测。没有每工具上限。没有 week-over-week 增长告警。修复方案是每工具上限加每日增长告警。这是一个模板：每个新的工具表面都是一个新的潜在循环；每个新工具都需要自己的上限和自己的告警。

## 使用它

`code/main.py` 模拟一个有 layered cost-governor stack 和没有该栈的 agent 运行。模拟中的 agent 在若干轮后漂移进轮询循环；layered stack 会在速度窗口内抓住它，而单个月度上限要到几天后才会触发。

## 交付它

`outputs/skill-agent-budget-audit.md` 审计一个拟议 agent 部署的 cost-governor stack，并标记缺失层。

## 练习

1. 运行 `code/main.py`。确认在轮询循环轨迹上，速度限制先于 iteration cap 触发。现在禁用速度限制，测量 agent 在 iteration cap 抓住它之前“花费”了多少。

2. 为 browser agent（Lesson 11）设计一组每工具上限。哪个工具需要最严格的上限？哪个工具可以无边界运行而没有风险？

3. 阅读 Microsoft Agent Governance Toolkit 文档。列出 toolkit 命名的每一种上限类型。把每一种映射到某个失败模式（失控循环、缓慢泄漏、糟糕发布、激增）。

4. 为一个真实任务的 overnight unattended run 定价（例如，“triage 50 issues in a repo”）。把 `max_budget_usd` 设为点估计的 2x。说明为什么是 2x。

5. Claude Code 的 `max_budget_usd` 基于 session 聚合成本触发。设计一个你会在外部执行的互补速度限制。什么会触发切断，重新启用是什么样子？

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| Denial of Wallet | "Runaway bill" | agent 循环产生花费，并且没有上限阻止它 |
| max_tokens | "Per-request cap" | 单个 completion 大小的上限 |
| max_turns | "Iteration cap" | 一个 session 中 agent loop 迭代次数的上限 |
| max_budget_usd | "Dollar kill switch" | session 成本上限；违约时中止 |
| Velocity limit | "Rate cap" | 短窗口内花费的限制（例如，$50 / 10 min） |
| Tiered routing | "Small model first" | 默认使用便宜 model；只有 classifier 判断值得时才升级 |
| Prompt caching | "Cached system prompt" | provider 侧 cache 将重发 Token 成本降到接近零 |
| HITL checkpoint | "Human approval gate" | 昂贵操作前需要人工确认 |

## 延伸阅读

- [Anthropic Claude Code Agent SDK — agent loop and budgets](https://code.claude.com/docs/en/agent-sdk/agent-loop) — `max_turns`、`max_budget_usd`、工具 allowlists。
- [Microsoft Agent Framework — human-in-the-loop 与治理](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) — cost-governor 检查点。
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) — provider 侧成本控制。
- [Anthropic — Prompt caching (Claude API docs)](https://platform.claude.com/docs/en/prompt-caching) — caching 机制。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — long-horizon agents 的成本画像。
