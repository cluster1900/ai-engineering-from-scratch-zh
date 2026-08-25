# 配置范围审计：Python 服务

## 指令层级

根指引包含目的、布局、规范命令、安全边界和链接。API、迁移和文档指引
保留在路径范围内。

## 路径规则 Fixtures

API allow fixture `src/api/orders.py` 会载入契约和授权指引。
deny fixture `docs/orders.md` 不会载入。迁移 fixtures 证明只能追加的指引
仅在 `migrations/**` 下生效。

## Skill 与 Command

migration-review Skill 打包了可复用的证据收集流程。旧版显式 ADR Command
仍保持兼容，但新的多步骤流程使用 Skill，使辅助文件可以按需载入。
两者都不会授予权限。

## Skill 包

`migration-review-skill/SKILL.md` 定义触发 description 和严格限定的
`allowed-tools` 授权。它将详细证据引导至
`references/review-checklist.md`，并使用
`scripts/check_scope.py` 验证每个参数。该授权会为调用轮次预先批准这个
包内检查器；它不会限制所有其他 Tools，也不会覆盖 deny 规则。

## Subagent 契约

`/agents` 注册一个拥有只读 Tools、`maxTurns: 10`，并在请求编辑时使用
`isolation: worktree` 的迁移审计 Agent。其响应包含
`status`、`evidence`、`blockers` 和 `next_step`。它会在达到轮次限制时停止，
并报告障碍，而不是声称成功或扩大范围。

## Plugin 分发

项目 Skills 和 Agents 提交在 `.claude/` 下。共享 Plugin 来源和默认值
通过 `extraKnownMarketplaces` 和 `enabledPlugins` 保存在
`.claude/settings.json` 中，并配合文件夹信任和审查。
组织 managed Settings 限制允许使用的 marketplaces 和不可协商的权限。
在 rollout 前记录版本和回滚方式。

## Hooks

确定性的写入前 Hook 会阻止声明范围之外的路径。编辑后 Hook 仅格式化已变更文件。
命令前 Hook 会阻止输出 secret 和破坏性操作。`PreToolUse` 结构化决策以退出码 0
配合 JSON；退出码为 2 的 Hook 会将阻塞原因写入 stderr，且不打印 JSON。
`PermissionRequest` Hook 使用其自身的嵌套决策结构。

## Headless CI

CI 从全新 checkout 开始，使用受版本控制的项目配置、只读审查 Tools、
有边界的运行时间、结构化 findings 和独立的确定性测试。
它绝不会继承交互式 Session。截至 2026-08-09 的核验结果，
managed Code Review 是面向 Team 和 Enterprise 的 research preview；
它会报告 findings，但不会替代关卡。Repository 自动化使用
`anthropics/claude-code-action@v1`，并显式指定工作流权限和 Tools。

## 修复

修复审查会接收稳定 finding ID、原始证据、当前 diff、测试和验收规则。
本地偏好不包含在内。
