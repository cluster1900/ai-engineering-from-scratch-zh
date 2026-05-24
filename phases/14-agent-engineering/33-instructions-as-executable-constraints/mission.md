# Mission - 把 Agent Instructions 变成可执行约束

## 目标
将散文式的 instructions 转化为五个类别下可机器校验的规则，并产出一份 reviewer 能打分的 rule report。

## 输入
- `docs/agent-rules.md`，每个标题对应一条规则，包含 slug、category、description 和一个 `check` 字段
- 一次故意违反两条规则的 demo agent 运行

## 交付物
- Parser，把 `agent-rules.md` 加载成一个 dataclass
- `rule_checker.py`，每个被引用的 `check` 对应一个函数
- `rule_report.json`，对每条规则给出 pass/fail，并附一个聚合的 severity

## 验收
- `python3 code/main.py` 退出码为 0
- 输出打印解析后的 rule set、运行 trace，以及每条规则的 pass/fail
- `rule_report.json` 抓出那两处刻意制造的违规

## 范围之外
- 把 checker 接入 CI。本课程在产出书面报告处收尾。
- 框架级 guardrail（OpenAI SDK、LangGraph interrupt）。rule set 是它们背后那份人类可读的契约。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-rule-set-builder.md` - 抽取出的 skill
