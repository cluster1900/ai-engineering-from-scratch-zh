# Mission - Agent Workbench：为什么有能力的模型仍会失败

## 目标
将同一个小型 repo 任务运行两次，一次只使用 prompt，一次接入七个 workbench surfaces，并输出一份 failure-mode report，将每个遗漏的 surface 映射到它造成的 symptom。

## 输入
- 一个 stub agent 和一个用于验证的微型 FastAPI 风格 handler
- 七个 surface 列表（instructions、state、scope、feedback、verification、review、handoff）

## 交付物
- `code/main.py`，连续运行两个 pipelines
- `failure_modes.json`，总结 prompt-only run
- workbench run 的单行 verdict

## 验收标准
- `python3 code/main.py` 以零状态退出
- 输出展示两次运行的并排 log
- `failure_modes.json` 列出每个遗漏 surface 及其匹配 symptom

## 范围外
- 调用真实模型。stub 特意采用 rule-based。
- 深入构建任何单个 surface。那是接下来十一课要做的事。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-workbench-audit.md` - 提取出的 skill
