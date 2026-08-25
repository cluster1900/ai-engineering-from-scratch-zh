# 团队配置审查：Support Router

状态：已准备好供团队审查

## 范围

所有者：developer-platform。受审查的任务根据 pull request 的
diff 提出补丁。它不能合并、部署、发布评论或读取不相关的 repository。

## 能力清单

读取范围仅限隔离的 checkout。编辑范围仅限补丁 workspace。
该任务可以运行 `python3 -m unittest`；不存在网络和生产环境凭据。
合并和任何外部通信均由人类负责。

## 权限模式

交互式工作从 `default` 开始。`acceptEdits` 可以预先批准文件编辑，
但不授权 push、部署、网络调用或外部消息。
无头审查使用带有严格 allow 规则的 `dontAsk`，同时 deny 规则会在
每种常规模式下阻止凭据访问和发布。此任务不允许使用
`bypassPermissions`。

## Context 恢复

操作员使用 `/context` 检查消耗情况，并使用带有明确
关注重点的 `/compact` 继续同一任务。`/clear` 会以空的
对话 Context 开始不相关的工作。`/rewind` 可以恢复受跟踪的编辑或对话，但
Git 和权威外部状态仍是恢复依据。

## 自主边界

只有在具备可衡量的验收条件、评估器可见的轮次预算
以及由外部强制执行的轮次上限时，才允许使用 `/goal`。`/loop` 可以在
session 保持打开时轮询 CI，但不能自行创建新工作或扩大
发布权限。两者都保留当前的权限边界。

## Worktree 所有权

每项并行变更都从 `claude --worktree <owner-task>` 开始。每个 branch
和文件范围都由一名具名所有者控制。Worktree 隔离可以防止编辑
冲突，但不能阻止凭据或网络访问；其共享的 Git metadata
仍受 repository policy 保护。

## Hook 决策

`permission-request-decision.json` 是针对
`PermissionRequest` event、退出码为 0 的结构化响应。它会拒绝外部发布并返回一条消息。
使用退出码 2 的 command hook 会通过 stderr 进行阻止；它绝不会
同时输出 JSON 并以退出码 2 退出。

## 定时执行

session 内的 `/loop` 负责短期轮询。cloud routine 会作为
自主身份接受审查，且仅能访问所需的 repository 和 connector。GitHub
Actions 以最低 workflow 权限负责由 repository 管理的 cron 任务。

## 审查自动化

截至 2026-08-09，经核实，托管式 Code Review 是面向 Team 和
Enterprise plan 的 research preview。它可以报告 inline finding，但不会批准或阻止
pull request。Repository 自动化使用
`anthropics/claude-code-action@v1`，并配备固定的 Prompt、明确的 Tool、轮次
限制和受保护的合并路径。

## 允许的 Fixture

allow fixture 会读取 `src/router.py`、编辑与其配对的测试、运行聚焦
测试套件，并生成包含精确测试证据的补丁 artifact。`acceptEdits` 可以
加快这些本地编辑，但不会授予任何公开操作权限。

## 拒绝的 Fixture

deny fixture 会尝试读取 `.env`、push 受保护的 branch，并调用
未经批准的 server。操作前 policy 会在执行之前阻止这三项操作。

## 版本证据

Claude Code 配置版本 `team-review-1.2` 和审查流程均
固定在 repository 中。每次运行都会在 artifact metadata 中
记录 Model alias、plugin 版本和测试命令。

## 回滚

回滚操作会禁用该任务、丢弃其隔离补丁、恢复配置
`team-review-1.1`，并在重新启用前再次运行 allow 和 deny fixture。
