# 任务 - 将 Agent Instructions 作为可执行约束

## 目标
将 prose instructions 转换为横跨五个类别的机器可检查规则，并输出一份 reviewer 可以评分的规则报告。

## 输入
- `docs/agent-rules.md`，每个 heading 一条规则，每条规则都带有 slug、category、description 和一个 `check` 字段
- 一个故意违反两条规则的 demo agent run

## 交付物
- 将 `agent-rules.md` 加载为 dataclass 的 parser
- `rule_checker.py` 风格的函数，每个被引用的 `check` 对应一个
- `rule_report.json`，包含每条规则的 pass/fail 和 aggregate severity

## 验收
- `python3 code/main.py` 以退出码 0 结束
- 输出会打印解析后的 rule set、run trace，以及每条规则的 pass/fail
- `rule_report.json` 会捕获两个故意违反项

## 范围外
- 将 checker 接入 CI。本课到写出报告为止。
- Framework guardrails（OpenAI SDK、LangGraph interrupts）。rule set 是这些实现背后的人类可读 contract。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-rule-set-builder.md` - 提取出的 skill
