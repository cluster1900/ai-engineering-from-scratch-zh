# 任务 - Runtime Feedback Loops

## 目标
构建 `run_with_feedback`，它包装 `subprocess.run`，捕获 stdout、stderr、退出码和耗时，以确定性方式截断输出，并追加一条 JSONL 记录，供下一轮和验证门禁共同读取。

## 输入
- 三个用于演练 runner 的 demo 命令：一个成功、一个失败、一个慢速
- Token 预算：确定性的头部加尾部，并带有 `...truncated N lines...` 标记

## 交付物
- `run_with_feedback(command, agent_note)`，写入 `feedback_record.jsonl`
- 一个将 JSONL 流式加载到 Python list 的 loader
- 一个显示每个命令最后一条记录的 printer

## 验收
- `python3 code/main.py` 以零退出
- `feedback_record.jsonl` 在重复运行时为每个命令累积一条记录
- 带有 `exit_code: null` 的命令不能被 loop 标记为成功

## 范围外
- 遥测管道（OTel、Langfuse）。Feedback 用于下一轮；遥测用于 operator。
- 脱敏流程和轮转策略。课程练习提示会覆盖这些内容。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-feedback-runner.md` - 提取出的 skill
