# 任务 - Reviewer Agent：将 Builder 与 Marker 分离

## 目标
构建一个 reviewer loop，它以只读方式读取 builder 的 artifacts，并输出一个 `review_report.json`，从五个维度评分，总分 10 分，verdict 为 pass、soft_fail 或 hard_fail。

## 输入
- `ReviewerInputs`，将前面课程中的 diff、state、feedback 和 verification verdict 打包在一起
- Rubric 维度：问题契合度、scope 纪律、assumptions、verification 质量、handoff 就绪度

## 交付物
- 每个维度一个评分函数（课程中使用 stub-grade，确定性）
- `review_report.json` writer，包含五项分数、总分和 verdict
- 两个 demo case：一个干净变更，以及一个“测试正确，问题错误”的变更

## 验收
- `python3 code/main.py` 以零退出
- 干净变更得分至少为 7，verdict 为 `pass`
- wrong-problem 变更在至少一个维度上低于 5，且 verdict 翻转为 `hard_fail`

## 范围外
- 真实 LLM 调用。课程会为每个维度提供 stub；skill 稍后会替换为模型。
- 编辑 diff。reviewer 读取、评分并报告。Patch 是 builder 下一轮的工作。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-reviewer-agent.md` - 提取出的 skill
