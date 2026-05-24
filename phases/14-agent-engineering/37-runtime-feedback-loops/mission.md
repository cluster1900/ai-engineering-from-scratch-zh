# Mission - Runtime Feedback Loop

## 目标
构建 `run_with_feedback`，包装 `subprocess.run`，捕获 stdout、stderr、exit code 与 duration，做确定性截断，并追加一条 JSONL 记录，供下一次 turn 与 verification gate 两边读取。

## 输入
- 三条 demo 命令用来检验 runner：一条成功、一条失败、一条耗时较长
- Token 预算：确定性的 head + tail，并附 `...truncated N lines...` 标记

## 交付物
- `run_with_feedback(command, agent_note)`，写入 `feedback_record.jsonl`
- 一个 loader，把 JSONL 流式读入 Python list
- 一个打印器，按命令展示最后一条记录

## 验收
- `python3 code/main.py` 退出码为 0
- 多次重跑后，`feedback_record.jsonl` 每条命令累计一条记录
- 一条 `exit_code: null` 的命令不允许被循环标记为成功

## 范围之外
- Telemetry 管线（OTel、Langfuse）。Feedback 服务于下一次 turn；telemetry 服务于 operator。
- 脱敏处理与轮转策略。课程练习题会覆盖这些。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-feedback-runner.md` - 抽取出的 skill
