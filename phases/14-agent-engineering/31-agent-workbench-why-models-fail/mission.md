# Mission - Agent Workbench：为什么能干的 model 仍然会失败

## 目标
对同一个小型 repo 任务跑两次：一次只用 prompt，一次接入七个 workbench surface，并产出一份 failure-mode 报告，把每个缺失的 surface 映射到它引发的症状上。

## 输入
- 一个 stub agent 和一个待校验的 FastAPI 风格 handler
- 七个 surface 的清单（instructions、state、scope、feedback、verification、review、handoff）

## 交付物
- `code/main.py`，连续运行两条 pipeline
- `failure_modes.json`，汇总 prompt-only 的那次运行
- 给 workbench 那次运行一句话定论

## 验收
- `python3 code/main.py` 退出码为 0
- 输出展示两次运行的并列日志
- `failure_modes.json` 列出每个缺失的 surface 及其对应症状

## 范围之外
- 调用真实 model。stub 故意是规则驱动的。
- 深入构建任何一个 surface。那是接下来 11 节课要做的事。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-workbench-audit.md` - 抽取出的 skill
