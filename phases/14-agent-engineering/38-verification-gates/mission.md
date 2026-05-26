# 任务 - Verification Gates

## 目标
将 `verify(task_id, artifacts)` 实现为一个纯确定性函数，基于 scope report、rule report、feedback log 和 diff 生成结果，并在每次任务收尾时输出一个 `verification_report.json`。

## 输入
- `scope_report.json`、`rule_report.json`、`feedback_record.jsonl` 和 diff 的 stub loader
- 检查表：acceptance 已运行、acceptance 以零退出、scope 干净、没有 `null` 退出、所有 block-severity 规则通过

## 交付物
- 一个纯函数 `verify(task_id, artifacts) -> VerdictReport`
- 一个显示逐项检查结果和最终通过/失败的 printer
- 写入磁盘的三个 demo 场景：干净通过、scope creep、缺少 acceptance

## 验收
- `python3 code/main.py` 以零退出
- clean-pass 场景报告 `passed: true`；另外两个报告 `passed: false`
- 每个场景都在 `outputs/verification/` 下写入单独的 `verification_report.json`

## 范围外
- LLM-as-judge 逻辑。门禁保持确定性；定性判断属于第 39 课中的 reviewer。
- 签名 override 审计日志。练习提示会以这种方式扩展门禁。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-verification-gate.md` - 提取出的 skill
