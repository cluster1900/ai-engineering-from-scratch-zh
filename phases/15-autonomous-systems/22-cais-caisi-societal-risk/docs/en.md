# CAIS、CAISI 与社会规模风险

> Center for AI Safety（CAIS，San Francisco，由 Hendrycks 和 Zhang 于 2022 年创立）发布了四类风险框架：恶意使用、AI races、组织风险、Rogue AIs，以及 2023 年 5 月关于灭绝风险的声明，该声明由数百名教授和公司领导者签署。CAIS 在 2026 年发布的内容包括：用于 frontier-model 评估的 AI Dashboard、Remote Labor Index（与 Scale AI 合作）、Superintelligence Strategy Paper、AI Frontiers newsletter。另一个不同实体：NIST Center for AI Standards and Innovation（CAISI）—— 面向 US government 的自愿协议与非涉密能力评估，重点关注 cyber、bio 和 chemical-weapons 风险。CAIS 将组织风险列为四类顶层风险之一：安全文化、严格审计、多层防御和信息安全是基础，但经常会为了部署速度而被权衡牺牲。California SB-53 如果签署，将成为 US 第一个州级灾难性风险监管法规。

**类型：** 学习
**语言：** Python（stdlib，四类风险清单与缓解措施匹配器）
**先修要求：** Phase 15 · 19（RSP），Phase 15 · 20（PF + FSF）
**时间：** 约 45 分钟

## 问题

第 19 和 20 课介绍了实验室内部的 scaling policies。第 21 课介绍了独立能力评估。本课介绍第三种视角：塑造灾难性 AI 风险公共讨论和监管基线的民间社会与政府组织。

有两个不同实体很重要。CAIS 是一个非营利研究组织，发布用于思考 AI 风险的框架，并协调公共声明。CAISI 是 NIST 内部的 US government 中心，负责与实验室运行自愿协议和非涉密能力评估。这两个名称相似，但使命并不重叠。实践者应该同时了解两者。

实践内容是：CAIS 的四类风险框架是文献中引用最广泛的社会规模风险分类法。安全文化和组织风险是这四类之一，也是实践者最能直接控制的一类。SB-53（California）如果签署，将成为 US 第一个州级灾难性风险监管法规；该法案的表述很重要，因为在 US tech policy 中，州级监管历来常常先于联邦行动。

## 概念

### CAIS — Center for AI Safety

- 创立时间：2022 年，位于 San Francisco，由 Dan Hendrycks 及同事创立（“Zhang”这个名字指的是早期合作者，而不是当前共同创始人；当前领导层请参见 CAIS 网站）。
- 状态：501(c)(3) 非营利组织。
- 2023 年的重要成果：关于灭绝风险的声明，由数百名研究人员和 CEO 共同签署。声明写道：“降低 AI 导致灭绝的风险，应当与 pandemics 和 nuclear war 等其他社会规模风险一起成为全球优先事项。”
- 2026 年成果：用于 frontier-model 评估的 AI Dashboard、Remote Labor Index（与 Scale AI 联合发布）、Superintelligence Strategy Paper、AI Frontiers newsletter。

### 四类风险框架

CAIS 的框架将灾难性 AI 风险分为四个顶层类别：

1. **恶意使用**：恶意行为者使用 AI 造成伤害（bioweapons synthesis、disinformation、cyberattacks）。
2. **AI races**：实验室、公司或国家之间的竞争压力推动部署越过安全边界。
3. **组织风险**：实验室内部动态（安全文化失效、审计不足、安全资源不足）导致糟糕部署。
4. **Rogue AIs**：能力足够强的 AI 追求与人类福祉冲突的目标。

这不是唯一的分类法；但它是被引用最多的。各类别并非相互排斥 —— 一个在竞赛中用审计换速度的组织所产生的 Rogue AI，会同时属于全部四类。

### 组织风险存在于哪里

在四个类别中，组织风险是实践者最可操作的一类。一个实验室的安全文化、审计严格程度、防御分层和信息安全，决定了它的模型上线时，是否真正部署了第 10–18 课中的控制措施，还是这些控制措施只是没人验证过的 checklist 项。

具体的组织风险杠杆包括：

- **安全文化**：团队成员是否觉得自己可以在不付出职业代价的情况下升级反馈担忧？CAIS 的调查发现，这是其他杠杆的强预测因素。
- **严格审计**：外部和内部审计都需要。仅靠内部审计会产生过于乐观的报告。
- **多层防御**：没有单一层足够充分（这是 Phase 15 的贯穿主题）。
- **信息安全**：model weights 泄露、eval data 泄露、monitor-bypass 技术泄露。第 19 课中的 RAND SL-4 是一个具体标准。

### CAISI — Center for AI Standards and Innovation

- 在 NIST 内部运行。
- 与 frontier labs 运行自愿协议。
- 发布面向 cyber、bio 和 chemical-weapons 风险的非涉密能力评估。
- 不同于 CAIS；缩写会混淆；检查 URL（nist.gov）来确认你正在阅读的是哪一个。

CAISI 的角色是 METR 私有实验室合作（第 21 课）的公共、面向政府的对应方。CAISI 报告是非涉密的；METR 报告通常受 NDA 限制。实践者同时阅读两者可以获得更完整的图景。

### California SB-53

California Senate bill（2025–2026 会期）处理 frontier models 带来的灾难性风险。草案中的关键条款包括：

- 触发州级义务的特定能力阈值。
- 对 AI lab 员工的 whistleblower 保护。
- 针对灾难性失败的事故报告要求。

如果签署，它将成为 US 第一个州级灾难性风险监管法规。无论签署状态如何，该法案的表述都会影响其他州议会如何处理这个问题。California 的实践者应跟踪该法案状态；其他地区的实践者也应阅读它，以理解 US 州级监管很可能会是什么样子。

### 社会规模风险不是单层问题

Phase 15 的贯穿主题 —— defense in depth —— 同样适用于社会层。没有任何单个组织、监管或框架能关闭灾难性风险。只有在以下条件同时成立时，生态系统才会发挥作用：

- 实验室发布 scaling policies（第 19、20 课）。
- 外部评估者产出测量结果（第 21 课）。
- 民间社会进行跟踪与公开传播（CAIS）。
- 政府运行自愿项目和基线监管（CAISI、SB-53）。
- 实践者构建多层控制（第 10–18 课）。

这是本 Phase 的最终综合：此前每一课都是一个栈中的一层，整个栈的完整性比任何单层的强度都更重要。

```figure
a5-four-risks
```

## 使用它

`code/main.py` 实现了一个小型风险清单工具。给定一个拟议部署，它会根据四类风险类别标记该部署，并返回缓解措施 checklist。它是用于理解框架的阅读辅助工具，而不是人类判断的替代品。

## 交付它

`outputs/skill-societal-risk-review.md` 会从社会规模风险姿态角度审查一个部署：它触及四类风险中的哪些类别，已经有哪些缓解措施，组织风险暴露是什么。

## 练习

1. 运行 `code/main.py`。输入三个不同规模的合成部署。确认四类风险标记与你的预期一致；找出一个该工具标记不足或过度标记的案例。

2. 完整阅读 CAIS 四类风险论文。选择一个风险类别，写两段说明你认为该类别中最重要的 2026 年发展是什么。

3. 阅读 California SB-53 的当前草案。找出一个你认为会增强灾难性风险姿态的条款，以及一个你认为会削弱它的条款。分别给出理由。

4. 选择一个你了解的生产 AI 部署（你自己的或公开发布的）。根据组织风险子杠杆为其评分：安全文化、审计严格程度、多层防御、信息安全。哪一项最弱？要把它提升到合格水平需要什么成本？

5. 勾勒一个反映一年额外能力进展和一年额外部署经验的 2028 版四类风险框架。你会添加、删除或重新分组什么？

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|---|---|---|
| CAIS | “Center for AI Safety” | 非营利组织；四类风险框架；2023 年灭绝声明 |
| CAISI | “US government AI safety” | NIST Center；自愿协议；非涉密 evals |
| Four-risk framework | “CAIS 的分类法” | 恶意使用、AI races、组织风险、Rogue AIs |
| Malicious use | “恶意行为者使用 AI” | Bioweapons、disinformation、cyberattacks |
| AI races | “竞争压力” | 实验室/公司/国家推动部署越过安全边界 |
| Organizational risk | “实验室内部失败” | 安全文化、审计、防御、infosec |
| Rogue AI | “Misaligned agent” | 有能力的 AI 追求与人类福祉冲突的目标 |
| California SB-53 | “州级监管” | 2025–2026 年法案；如果签署，将成为 US 第一个州级灾难性风险监管法规 |

## 延伸阅读

- [Center for AI Safety](https://safe.ai/) — 四类风险框架的机构主页。
- [CAIS — AI Risks that Could Lead to Catastrophe](https://safe.ai/ai-risk) — 四类风险论文。
- [CAIS — May 2023 statement on extinction risk](https://safe.ai/statement-on-ai-risk) — 简短的联合声明。
- [NIST CAISI](https://www.nist.gov/caisi) — 面向政府的 AI standards and innovation center。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — 将实验室层面的承诺与社会规模框架连接起来。
