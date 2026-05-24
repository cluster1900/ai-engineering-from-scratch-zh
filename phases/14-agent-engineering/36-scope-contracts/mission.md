# Mission - Scope Contract 与任务边界

## 目标
为每个任务编写一份 `scope_contract.json`，并构建一个支持 glob 的 checker，把 agent 的 diff 与 contract 比对，把任何 forbidden 或越界写入标出来。

## 输入
- 一份任务描述，包含 allowed globs、forbidden globs、acceptance 命令、rollback 段落、所需 approval
- 两次 demo 运行：一次守在 scope 内，一次越界

## 交付物
- `scope_contract.json` 的 schema validator（JSON Schema 的子集 + glob 数组）
- 一个 diff parser，从触碰的文件加上执行的命令产出 `RunSummary`
- `scope_check(contract, run) -> (violations, in_scope, off_scope)`
- 紧邻脚本保存的 `scope_report.json`

## 验收
- `python3 code/main.py` 退出码为 0
- 在 scope 内的那次运行报告零违规
- 越界那次运行精确列出 off-scope 文件以及每一处的原因

## 范围之外
- 时间预算、网络出网 allowlist。课程交付的是文件 glob；练习题再扩展。
- 接入 runtime interrupt。课程在产出报告处收尾。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-scope-contract.md` - 抽取出的 skill
