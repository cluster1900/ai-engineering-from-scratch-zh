# 操作预算、迭代上限与成本治理器

> 一个中型电商 Agent 团队启用“订单追踪”Skill 后，其每月 LLM 成本从 $1,200 跃升至 $4,800。这不是定价 bug，而是 Agent 找到了一个新的循环，并持续在其中产生支出。Microsoft Agent Governance Toolkit（2026 年 4 月 2 日）将针对这类问题的防御措施规范化：单请求 `max_tokens`、单任务 Token 和美元预算、每日/每月上限、迭代上限、分层 Model 路由、Prompt caching、Context windowing、昂贵操作上的 HITL 检查点，以及预算超限时的 kill switch。Anthropic Claude Code Agent SDK 也提供了名称不同但作用相同的机制。资金流速限制，例如在 10 分钟内支出超过 $50 时切断访问，能够比每月上限更快捕获循环。

**Type:** Learn
**Languages:** Python（stdlib，分层成本治理器模拟器）
**Prerequisites:** Phase 15 · 10（权限模式），Phase 15 · 12（持久执行）
**Time:** ~60 分钟

## 问题

自主 Agent 的每一轮操作都会花费真实资金。聊天机器人的错误输出只是一条糟糕的回复；Agent 的错误循环则会产生账单。业界文档将这种故障模式称为“Denial of Wallet”：Agent 不断推理、不断调用 Tool、不断产生费用，却没有任何机制将其停止，因为从一开始就没有设计这样的机制。

解决方案并不是设置一个数值，而是在不同时间尺度和粒度上构建一套限制：单请求、单任务、每小时、每日、每月。设计良好的限制体系能在几分钟内捕获失控循环，在几小时内发现缓慢泄漏，并在一天内发现有问题的发布。当 Agent 具备长时间运行和自主执行能力时，同一套体系还能确保始终存在预算约束。

这是一节工程课程：数学很简单，团队真正容易失败的是执行纪律。下列限制均在 Microsoft Agent Governance Toolkit 或 Anthropic Claude Code Agent SDK 文档中明确提及。

## 概念

### 成本治理器体系

1. **每个请求的 `max_tokens`。** 很简单。防止任何一次调用生成无上限的 completion。
2. **单任务 Token 预算。** 整个运行过程不得超过 N 个 Token。达到上限时强制停止。
3. **单任务美元预算。** 与 Token 预算相同，但以货币计量。在 Claude Code 中对应 `max_budget_usd`。
4. **单 Tool 调用上限。** `WebFetch` 调用不得超过 N 次，`shell_exec` 调用不得超过 N 次，依此类推。
5. **迭代上限（`max_turns`）。** Agent loop 的总迭代次数；防止无限推理循环。
6. **每分钟/每小时/每日/每月上限。** 使用滚动窗口，在不同时间尺度捕获泄漏。
7. **资金流速限制。** 例如：“如果 10 分钟内支出超过 $50，则切断访问。”它能在每月上限触发前捕获循环导致的快速消耗。
8. **分层 Model 路由。** 默认使用较小的 Model；只有当 classifier 判断任务确有需要时，才升级到更大的 Model。
9. **Prompt caching。** 将 system prompt 和稳定 Context 存储在 provider cache 中；重复发送所产生的 Token 成本接近于零。
10. **Context windowing。** 通过压缩/摘要使活跃 Context 保持在阈值以下；直接降低 Token 成本。
11. **昂贵操作上的 HITL 检查点。** 在执行已知成本高昂的操作前，例如长时间 Tool 调用、大文件下载或升级到昂贵 Model，要求人员确认。
12. **预算超限时的 kill switch。** 任一上限触发后立即中止 session。记录触发的上限，并要求通过独立流程重新启用。

### 为什么需要一套限制，而不是单个上限

单一的每月上限只有在资金已经耗尽后才能捕获失控 Agent。单一的单请求上限无法发现 session 级别的问题。不同的故障模式需要不同的时间尺度：

- **失控循环**（Agent 陷入每 5 秒一次的重试）：由资金流速限制捕获。
- **缓慢泄漏**（Agent 每个任务执行的工作量约为预期的 2 倍）：由每日上限捕获。
- **有问题的发布**（新版本使用的 Token 是原来的 5 倍）：由每周/每月上限捕获。
- **合理的流量激增**（真实需求，而非 bug）：由每小时/每日上限捕获，并生成清晰日志。

### Harness 的预算控制面

Claude Code Agent SDK 对外提供以下能力（公开文档）：

- `max_turns`——迭代上限。
- `max_budget_usd`——美元上限；超限时中止 session。
- `allowed_tools` / `disallowed_tools`——Tool allowlist 和 denylist。
- Tool 使用前的 Hook 点，用于自定义成本核算。

将这些能力与权限模式阶梯（Lesson 10）结合使用。未设置 `max_budget_usd` 的 `autoMode` session 属于不受治理的自主运行。Anthropic 明确指出 Auto Mode 需要预算控制；classifier 与成本控制彼此独立。

### EU AI Act、OWASP Agentic Top 10

Microsoft Agent Governance Toolkit 覆盖 OWASP Agentic Top 10 以及 EU AI Act Article 14（人工监督）的要求。在 EU 的生产环境中，日志记录和上限强制执行并非可选项。

### 已观察到的 $1,200 → $4,800 案例

Microsoft 文档中的真实案例是：某电商 Agent 在添加新 Tool 后，每月成本增至原来的三倍。该 Tool 允许 Agent 在每个 session 中轮询订单状态。当时没有循环检测、没有单 Tool 上限，也没有针对周环比增长的告警。最终解决方案是增加单 Tool 上限和每日增长告警。这个案例可以作为模板：每增加一个 Tool 接口，就会增加一种潜在循环；每个新 Tool 都需要自己的上限和告警。

```figure
cost-governor-stack
```

## 使用它

`code/main.py` 模拟在使用和不使用分层成本治理器体系时的 Agent 运行。模拟 Agent 会在若干轮后逐渐进入轮询循环；分层体系能够在资金流速窗口内捕获该问题，而单一的每月上限要到数天后才会触发。

## 交付它

`outputs/skill-agent-budget-audit.md` 用于审计拟部署 Agent 的成本治理器体系，并标记缺失的层级。

## 练习

1. 运行 `code/main.py`。确认在轮询循环轨迹中，资金流速限制先于迭代上限触发。然后禁用资金流速限制，测量 Agent 在迭代上限捕获问题前“花费”了多少资金。

2. 为浏览器 Agent（Lesson 11）设计一套单 Tool 上限。哪个 Tool 需要最严格的上限？哪个 Tool 可以在没有风险的情况下无限制运行？

3. 阅读 Microsoft Agent Governance Toolkit 文档。列出该 Toolkit 提及的所有上限类型，并将每种类型映射到一种故障模式（失控循环、缓慢泄漏、有问题的发布、流量激增）。

4. 为一项真实任务的通宵无人值守运行估算费用，例如“对一个 repo 中的 50 个 issue 进行分类处置”。将 `max_budget_usd` 设置为点估计的 2 倍，并说明选择 2 倍的理由。

5. Claude Code 的 `max_budget_usd` 根据 session 的总成本触发。设计一个在外部实施的补充资金流速限制。什么条件会触发切断？重新启用流程是什么？

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|---|---|---|
| Denial of Wallet | “失控账单” | Agent loop 持续产生支出，却没有任何上限将其停止 |
| max_tokens | “单请求上限” | 单次 completion 大小的上限 |
| max_turns | “迭代上限” | 一个 session 中 Agent loop 迭代次数的上限 |
| max_budget_usd | “美元 kill switch” | session 成本上限；超限时中止 |
| Velocity limit | “速率上限” | 限制短时间窗口内的支出，例如 $50 / 10 分钟 |
| Tiered routing | “优先使用小 Model” | 默认使用低成本 Model；只有 classifier 判断确有必要时才升级 |
| Prompt caching | “缓存的 system prompt” | provider 侧 cache 将重复发送的 Token 成本降至接近于零 |
| HITL checkpoint | “人工审批关卡” | 执行昂贵操作前需要人员确认 |

## 延伸阅读

- [Anthropic Claude Code Agent SDK——Agent loop 与预算](https://code.claude.com/docs/en/agent-sdk/agent-loop)——`max_turns`、`max_budget_usd`、Tool allowlist。
- [Microsoft Agent Framework——Human-in-the-loop 与治理](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop)——成本治理器检查点。
- [Anthropic——Claude Managed Agents 概览](https://platform.claude.com/docs/en/managed-agents/overview)——provider 侧成本控制。
- [Anthropic——Prompt caching（Claude API 文档）](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)——缓存机制。
- [Anthropic——在实践中衡量 Agent 自主性](https://www.anthropic.com/research/measuring-agent-autonomy)——长时间运行 Agent 的成本概况。
