# 任务 - Scope Contracts 和任务边界

## 目标
编写一个按任务划分的 `scope_contract.json`，以及一个支持 glob 的 checker，用于将 agent 的 diff 与 contract 比较，并标记任何 forbidden 或 off-scope 写入。

## 输入
- 一份任务描述，包含 allowed globs、forbidden globs、acceptance commands、rollback paragraph、approvals required
- 两次 demo 运行：一次保持在 scope 内，另一次出现 creeping

## 交付物
- `scope_contract.json` schema validator（JSON Schema 的子集，glob arrays）
- 一个 diff parser，根据 touched files 和 commands run 生成 `RunSummary`
- `scope_check(contract, run) -> (violations, in_scope, off_scope)`
- 保存在脚本旁边的 `scope_report.json`

## 验收标准
- `python3 code/main.py` 以零退出码退出
- in-scope run 报告零 violations
- creeping run 报告准确的 off-scope files 以及每个文件对应的 reason

## 范围外
- Time budgets、network egress allowlists。本课交付 file globs；exercise prompts 会扩展它。
- 接入 runtime interrupt。本课在 report 处退出。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-scope-contract.md` - 提取出的 skill
