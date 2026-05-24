---
name: permission-mode-picker
description: 在开始一次运行前，将 Claude Code 任务匹配到正确的权限模式、预算上限和所需隔离。
version: 1.0.0
phase: 15
lesson: 10
tags: [claude-code, permission-modes, auto-mode, budgets, isolation]
---

给定一个拟议的 Claude Code 任务，选择权限模式，设置预算，并指定 agent 被允许启动前所需的最小隔离。

产出：

1. **任务画像。** 用一句话说明任务做什么，再用一句话说明如果出错的 blast radius。
2. **模式建议。** 以下之一：`plan`、`default`、`acceptEdits`、`acceptExec`、`autoMode`、`yolo`、`bypassPermissions`。用一个引用 blast radius 的句子说明理由。
3. **预算数字。** 为 `max_turns`、`max_budget_usd` 和任何 per-tool caps 给出具体值。对于超过一小时的 unattended runs，指定一个美元上限，该上限应等于或低于你愿意为一次无法回滚的人为错误支付的成本。
4. **隔离要求。** File-system scope（仅 project directory、scratch directory、ephemeral container）。Network policy（no egress、allowlist only、full）。Credential surface（none、scoped token、broad token）。对于 `bypassPermissions` 或 `yolo`，运行必须位于没有挂载 production credentials 的 ephemeral container 内。
5. **Trajectory audit plan。** 人类将如何在运行后审查 trajectory？对于 `autoMode`、`yolo` 和任何超过 30 分钟 horizon 的运行都是必需的。

硬性拒绝：
- 对有未提交更改的 repository 使用 `bypassPermissions`。
- 没有 budget cap 的 `autoMode`。
- 环境中存在 broad credentials（AWS、GCP、具有 repo scope 的 GitHub PAT）时，使用任何高于 `acceptEdits` 的模式。
- 超过一小时的 unattended runs，但没有安排 trajectory audit。
- 声称 Auto Mode classifier 单独就足以处理 novel task distribution。

拒绝规则：
- 如果用户无法说明一次失败的 blast radius，则拒绝，并要求在开始前给出明确的 worst-case sentence。
- 如果用户请求在可触达 production database credentials 的 workspace 中使用 `autoMode`，则拒绝，并要求先使用 scoped credentials 或 ephemeral container。
- 如果拟议的 budget cap 超过用户愿意为糟糕运行损失的金额，则拒绝，并要求降低 cap。

输出格式：

返回一页 run card，包含：
- **Task summary**（一句话）
- **Blast radius**（一句话，worst case）
- **Mode**（明确写出）
- **Budgets**（`max_turns`、`max_budget_usd`、per-tool caps）
- **Isolation**（fs scope、network policy、credential surface）
- **Audit plan**（谁审查 trajectory、何时审查、依据什么 rubric）
