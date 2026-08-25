---
name: permission-mode-picker
description: 在运行开始前，为 Claude Code 任务匹配正确的权限模式、预算上限和必要的隔离措施。
version: 1.0.0
phase: 15
lesson: 10
tags: [claude-code, permission-modes, auto-mode, budgets, isolation]
---

给定一个拟执行的 Claude Code 任务，选择权限模式、设置预算，并明确在允许 Agent 启动前所需的最低隔离要求。

生成：

1. **任务概况。** 用一句话说明任务执行什么操作，再用一句话说明任务出错时的影响范围。
2. **模式建议。** 从以下模式中选择一个：`plan`、`default`、`acceptEdits`、`auto`、`dontAsk`、`bypassPermissions`。用一句话结合影响范围说明理由。
3. **预算数值。** 为 `max_turns`、`max_budget_usd` 和所有单 Tool 上限提供具体数值。对于超过一小时的无人值守运行，指定一个美元上限，其金额不得高于你愿意为一次无法回滚的人为失误付出的代价。
4. **隔离要求。** 文件系统范围（仅项目目录、临时工作目录、临时容器）。网络策略（禁止出站、仅允许 allowlist、完全开放）。凭据暴露面（无凭据、限定范围的 Token、广泛权限的 Token）。对于 `bypassPermissions` 或 `dontAsk`，运行必须位于未挂载任何生产凭据的临时容器中。
5. **轨迹审计计划。** 运行结束后，人员将如何审查执行轨迹？对于 `auto`、`dontAsk` 以及任何预计超过 30 分钟的运行，这是必需项。

硬性拒绝条件：
- 对存在未提交更改的 repository 使用 `bypassPermissions`。
- 使用 `auto` 但未设置预算上限。
- 环境中存在广泛权限凭据（AWS、GCP、拥有 repo scope 的 GitHub PAT）时，使用高于 `acceptEdits` 的任何模式。
- 无人值守运行超过一小时，却未安排轨迹审计。
- 声称仅凭 Auto Mode classifier 就足以应对新的任务分布。

拒绝规则：
- 如果用户无法说明失败的影响范围，则拒绝启动，并要求其先明确写出一句最坏情况描述。
- 如果用户请求在可访问生产数据库凭据的 workspace 中使用 `auto`，则拒绝启动，并要求其先提供限定范围的凭据或临时容器。
- 如果拟议的预算上限超过用户愿意为失败运行承担的损失，则拒绝启动，并要求降低上限。

输出格式：

返回一页式运行卡，其中包含：
- **任务摘要**（一句话）
- **影响范围**（一句话，描述最坏情况）
- **模式**（明确指定）
- **预算**（`max_turns`、`max_budget_usd`、单 Tool 上限）
- **隔离**（文件系统范围、网络策略、凭据暴露面）
- **审计计划**（由谁、何时、依据什么 rubric 审查执行轨迹）
