---
name: scaling-policy-review
description: 根据 RSP v3.0 参考结构审查 frontier-lab scaling policy（Anthropic RSP、OpenAI Preparedness、DeepMind FSF、内部政策）。
version: 1.0.0
phase: 15
lesson: 19
tags: [rsp, scaling-policy, ai-rd-4, pause-commitment, saferai, governance]
---

给定一份已发布或拟议的 scaling policy，生成一份结构化审查，将其与 RSP v3.0 参考结构（AI R&D-4、affirmative case、双层缓解措施、Frontier Safety Roadmap、Risk Report、独立评审）进行比较。

生成：

1. **双层清单。** 将承诺分为“实验室单方面”和“行业范围建议”。建议层级中的承诺是倡议，不是承诺。计算比例；如果一项政策中的大多数承诺都位于建议层级，那就是一项弱政策。
2. **阈值。** 列出每一个能力阈值及其触发的缓解措施。标记 v2 中为定量、现在变为定性的阈值。标记政策声称覆盖的能力中缺失的阈值。
3. **暂停承诺。** 确认该政策是否在特定阈值处列出暂停条款（停止训练、暂停部署或类似措施）。v3.0 删除了这一点；效仿它的政策会继承这种倒退。
4. **常设 artifact。** 确认该政策是否强制要求带有声明节奏的常设 Frontier Safety Roadmap 和 Risk Report 文档。事后发布的一次性 artifact 不符合条件。
5. **独立评审。** 说明外部评审机制。仅限内部的评审（由实验室员工组成的“Safety Advisory Group”）不符合独立监督条件。

硬性拒绝：
- 没有命名能力阈值的政策。
- 所有缓解措施都位于行业建议层级的政策。
- 没有常设 Roadmap / Risk Report artifact 的政策。
- 没有独立评审机制的政策。
- 声称“从真实世界经验中学习”但未说明政策文本如何更新以及按什么节奏更新的政策。

拒绝规则：
- 如果政策文档是营销材料而非治理文档（没有具体承诺、没有阈值、没有节奏），拒绝将其评为 scaling policy。
- 如果用户把政策存在等同于合规，拒绝。政策是一种承诺机制；合规需要证据。
- 如果用户引用旧版政策（例如 2023 Anthropic RSP）作为当前版本，拒绝并要求使用当前版本。

输出格式：

返回一份政策审查，包含：
- **双层比例**（单方面 / 建议 / 总数）
- **阈值表**（名称，类型：定量 / 定性，触发条件，缓解措施）
- **暂停承诺**（存在 y/n，具体条款）
- **常设 artifact**（Roadmap 节奏，Risk Report 节奏）
- **独立评审**（机制，评审者身份，频率）
- **总结评级**（强 / 中等 / 弱，并给出理由）
