# Mission - Reviewer Agent：把 Builder 与 Marker 分开

## 目标
构建一个 reviewer 循环：以只读方式读取 builder 的 artifact，产出一份在五个维度上打分、合计满分 10、verdict 为 pass / soft_fail / hard_fail 的 `review_report.json`。

## 输入
- `ReviewerInputs`，打包来自前几节课的 diff、state、feedback 和 verification verdict
- Rubric 维度：problem fit、scope discipline、assumptions、verification quality、handoff readiness

## 交付物
- 每个维度一个打分函数（本课程级别的 stub，保持确定性）
- `review_report.json` 写入器，包含五个分数、合计与 verdict
- 两个 demo 用例：一次干净的变更，一次 "right tests, wrong problem" 的变更

## 验收
- `python3 code/main.py` 退出码为 0
- 干净的变更至少拿到 7 分，verdict 为 `pass`
- 错问题的变更在至少一个维度上跌破 5 分，verdict 翻转为 `hard_fail`

## 范围之外
- 真实 LLM 调用。本课程把每个维度做成 stub；后面 skill 再换上真模型。
- 编辑 diff。Reviewer 只读、打分、报告。Patch 是 builder 下一次 turn 的活。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-reviewer-agent.md` - 抽取出的 skill
