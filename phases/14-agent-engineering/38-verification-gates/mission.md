# Mission - Verification Gate

## 目标
把 `verify(task_id, artifacts)` 实现为一个对 scope report、rule report、feedback log 和 diff 进行运算的纯确定性函数，每次任务收尾产出一份 `verification_report.json`。

## 输入
- 针对 `scope_report.json`、`rule_report.json`、`feedback_record.jsonl` 和 diff 的 stub loader
- 检查表：acceptance 是否运行、acceptance 是否退出码为 0、scope 是否干净、是否没有 `null` 退出、所有 block 级规则是否通过

## 交付物
- 纯函数 `verify(task_id, artifacts) -> VerdictReport`
- 打印器，展示每一项 check 的结果与最终 pass/fail
- 三个 demo 场景落盘：clean pass、scope creep、missing acceptance

## 验收
- `python3 code/main.py` 退出码为 0
- clean-pass 场景报告 `passed: true`；其余两个报告 `passed: false`
- 每个场景在 `outputs/verification/` 下分别写出独立的 `verification_report.json`

## 范围之外
- LLM-as-judge 逻辑。Gate 保持确定性；定性判断归 lesson 39 的 reviewer。
- 签名 override 的 audit log。该方向放在练习题里扩展。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-verification-gate.md` - 抽取出的 skill
