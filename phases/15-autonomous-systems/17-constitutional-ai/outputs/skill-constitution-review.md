---
name: constitution-review
description: 审计某个部署的 constitutional 层，包括 hardcoded prohibition、soft-coded default、操作方可调整边界，以及四级层级解析。
version: 1.0.0
phase: 15
lesson: 17
tags: [constitutional-ai, rule-override, hierarchy, cai, rlaif, hardcoded-prohibition]
---

给定某个部署的 constitutional 层（system prompt、operator config、声明原则），参照 Claude Constitution 对其进行审计，并标记缺失的 hardcoded prohibition、模糊原则或层级顺序错误。

产出：

1. **Hardcoded prohibition 清单。** 列出所有无论操作方或用户如何指令都绝不能弯曲的禁止项。最低基线：生物武器 / CBRN 能力提升、CSAM、关键基础设施攻击规划、被询问时使用虚假身份。新增项取决于具体部署（例如，金融服务会加入具体的欺诈禁止项）。
2. **Soft-coded default。** 列出操作方可以调整的所有行为。对每一项说明声明边界。没有边界的“可调整”设置就是后门覆盖。
3. **层级顺序。** 确认解析顺序是：safety > ethics > guidelines > helpfulness。如果在已实现的 resolver 中 helpfulness 曾经胜过 ethics，将其标记为部署破损。
4. **原则歧义标记。** 识别任何文本会留下实质性不同解释空间的原则。歧义会在训练周期中复合放大（principle drift）。
5. **层完整性。** 确认除 constitutional 层之外，还存在运行时层控制（Lessons 10, 13, 14）。仅有 Constitution 不足够；仅有运行时也不足够。

硬性拒绝：
- 没有任何 hardcoded prohibition 层的部署。
- 声称可以覆盖 hardcoded prohibition 的 operator config（即使通过重命名）。
- 将 helpfulness 置于 ethics 之上的层级顺序。
- 原则文本宽泛到无法评估（“be good”）。
- 将 Constitutional AI 视为运行时控制的替代品。

拒绝规则：
- 如果用户指出一个 hardcoded prohibition，但无法指出它在运行时层的兜底措施，则将该部署标记为单层，并拒绝生产。
- 如果 operator config 包含没有声明边界的可调整 “safety” 设置，则拒绝。
- 如果用户把 2023 participatory-constitution 发现当作当前部署中的可执行依据，请检查：2026 Constitution 没有纳入这些发现，因此“民主继承”是该部署无法支撑的声明。

输出格式：

返回一份 constitutional 审计，包含：
- **Hardcoded floor**（禁止项，执行层：weights / inference / both）
- **Soft-coded defaults**（setting、operator bound、user-visible y/n）
- **Tier order**（列出；确认 safety > ethics > guidelines > helpfulness）
- **Ambiguity flags**（principle、specific ambiguity、proposed tightening）
- **Layer completeness**（constitutional y/n、runtime controls y/n、both required）
- **就绪状态**（production / staging / research-only）
