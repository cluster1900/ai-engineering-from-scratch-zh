---
name: migration-review
description: 当变更在 migrations/ 下添加或修改路径时审查数据库迁移文件。在合并前使用它收集前向迁移、回滚、锁定和数据安全证据。
allowed-tools: Read Grep Glob Bash(python3 ${CLAUDE_SKILL_DIR}/scripts/check_scope.py *)
---

# 迁移审查

仅审查 `$ARGUMENTS` 中指定的迁移文件，以及验证其兼容性所需的代码。
此 Skill 不会授权应用迁移。

1. 运行 `python3 ${CLAUDE_SKILL_DIR}/scripts/check_scope.py $ARGUMENTS`。
2. 如果检查器拒绝任何位于 `migrations/` 之外的路径，请停止。
3. 阅读 [references/review-checklist.md](references/review-checklist.md)。
4. 检查每个已接受的文件及其 schema 假设。
5. 报告前向行为、回滚限制、锁风险、数据量风险、验证证据和未解决的阻塞项。

返回以下标题：`Scope`、`Evidence`、`Risks`、`Rollback`、`Blockers` 和
`Decision`。只要缺少必要证据，就使用 `Decision: blocked`。

包内检查器位于 [scripts/check_scope.py](scripts/check_scope.py)。
`allowed-tools` 条目仅为调用轮次预先批准该命令；它不会移除其他 Tools，
也不会替代项目权限规则。
