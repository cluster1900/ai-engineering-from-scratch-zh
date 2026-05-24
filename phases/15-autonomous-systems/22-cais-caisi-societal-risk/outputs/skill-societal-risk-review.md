---
name: societal-risk-review
description: 使用 CAIS 四类风险框架以及 CAISI / SB-53 监管语境，审查一个部署的社会规模风险姿态。
version: 1.0.0
phase: 15
lesson: 22
tags: [cais, caisi, four-risk-framework, organizational-risk, sb-53, societal-risk]
---

给定一个拟议或正在运行的 AI 部署，生成一份社会规模风险审查，根据 CAIS 四类风险框架标记该部署，盘点组织风险子杠杆，并指出监管接触面。

生成：

1. **四类风险标记。** 对四个类别中的每一类（恶意使用、AI races、组织风险、Rogue AIs），说明该部署是否触及它以及如何触及。一个部署可以触及多个类别；“不适用”必须用一句话说明理由。
2. **组织风险清单。** 根据四个子杠杆为该部署评分：安全文化、审计严格程度、多层防御、信息安全。任何被评分为“缺失”的杠杆都是标记出的缺口。
3. **监管接触面。** 列出适用的监管框架：EU AI Act（如果在 EU 或服务 EU 用户）、California SB-53（如果已签署且适用）、CAISI 自愿协议（如果该实验室已签署）。合规是部署关口，不是部署加分项。
4. **外部评估姿态。** 列出该部署或其 base model 已经历的外部评估（METR、CAISI、Apollo、Gray Swan 等）。对于 long-horizon autonomous deployments，没有外部评估是一个标记出的缺口。
5. **结构性力量暴露。** 估计该组织承受的竞争性部署压力有多大，以及这种压力如何与组织风险杠杆相权衡。处于沉重竞赛压力下的团队会首先降低审计优先级；这是 CAIS 的发现。

硬性拒绝：
- 触及 harmful-capability 类别但没有 hardcoded-prohibition 层的部署（第 17 课）。
- 处于竞争性竞赛条件下但没有独立审计的部署。
- 没有外部能力评估的 long-horizon autonomous deployments。
- 没有 Article 14 HITL 的 EU 部署（第 15 课）。
- 如果 SB-53 已签署，California 部署却没有事故报告流程。

拒绝规则：
- 如果用户无法说出 base model 的外部评估者，拒绝并要求先识别。仅靠自我评估是不充分的。
- 如果用户把“我们有 scaling policy”当作符合灾难性风险监管的证明，拒绝并要求进行具体的监管接触面映射。
- 如果用户提议在竞赛压力下无审计部署，拒绝并指出 CAIS 关于组织风险的发现。

输出格式：

返回一份社会风险审查，包含：
- **四类风险行表**（类别、是否触及 y/n、性质）
- **组织风险记分卡**（安全文化 / 审计 / 防御 / infosec）
- **监管接触面**（适用框架及合规状态）
- **外部评估姿态**（评估者、范围、频率）
- **结构性力量暴露**（低 / 中 / 高，并说明理由）
- **部署就绪度**（production / staging / research-only）
