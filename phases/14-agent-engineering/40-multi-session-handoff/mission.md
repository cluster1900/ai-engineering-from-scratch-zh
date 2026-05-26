# 任务 - 多会话 Handoff

## 目标
在 session 结束时，从 workbench 产物生成 `handoff.md` 和 `handoff.json`，让下一个 session 在第一分钟就能高效推进。两种形式都携带相同的七个字段；如有不一致，以 JSON 为准。

## 输入
- 来自前面课程的 `agent_state.json`、`verification_report.json`、`review_report.json`、`feedback_record.jsonl`
- 七个字段：summary, changed_files, commands_run, failed_attempts, open_risks, next_action, verdict_pointer

## 交付物
- 一个打包四个产物的 `WorkbenchSnapshot` loader
- `generate_handoff(snapshot) -> (markdown, payload)`
- 一个 feedback filter，用于选取最后 K 条记录以及所有非零 exit
- 写在脚本旁边的 `handoff.md` 和 `handoff.json`

## 验收标准
- `python3 code/main.py` 以零退出
- 两个文件都包含全部七个字段，并且 `next_action` 非空
- 使用相同输入重新运行脚本会生成完全相同的 packet

## 范围外
- Compaction 策略（Codex compact endpoint、Claude Code 五阶段）。Handoff 关闭一个 session；compaction 延长一个 session。
- PR 模板化。该 Markdown 可复用为 PR body，但本课止步于文件。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-handoff-generator.md` - 提取出的 skill
