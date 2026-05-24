# Mission - 跨 Session 的 Handoff

## 目标
在 session 结束时，从 workbench artifact 生成 `handoff.md` 与 `handoff.json`，让下一个 session 在第一分钟就能进入状态。两份文件承载相同的七个字段；出现分歧时以 JSON 为准。

## 输入
- 来自前几节课的 `agent_state.json`、`verification_report.json`、`review_report.json`、`feedback_record.jsonl`
- 七个字段：summary、changed_files、commands_run、failed_attempts、open_risks、next_action、verdict_pointer

## 交付物
- `WorkbenchSnapshot` loader，打包这四份 artifact
- `generate_handoff(snapshot) -> (markdown, payload)`
- Feedback 过滤器，挑出最后 K 条记录加上所有非零退出
- 紧邻脚本写出的 `handoff.md` 与 `handoff.json`

## 验收
- `python3 code/main.py` 退出码为 0
- 两份文件都承载全部七个字段，且 `next_action` 非空
- 用同样输入重跑脚本，产出完全相同的包

## 范围之外
- Compaction 策略（Codex 的 compact 端点、Claude Code 的五阶段）。Handoff 关闭一个 session；compaction 延长一个 session。
- PR 模板化。markdown 可以当 PR body 复用，但本课程在文件这一层收尾。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-handoff-generator.md` - 抽取出的 skill
