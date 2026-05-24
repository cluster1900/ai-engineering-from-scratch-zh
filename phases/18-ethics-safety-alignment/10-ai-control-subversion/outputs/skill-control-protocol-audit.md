---
name: control-protocol-audit
description: 在 AI Control 威胁模型下审计部署协议。
version: 1.0.0
phase: 18
lesson: 10
tags: [ai-control, subversion, trusted-editing, untrusted-monitoring, safety-case]
---

给定一个部署协议描述，在 AI Control 威胁模型下审计它：U（不可信强模型）、T（可信弱模型）、H（可信人类），并衡量该协议在 usefulness-safety frontier 上的位置。

产出：

1. 角色分配。识别哪个模型扮演 U，哪个模型扮演 T。如果 T 是 U 的另一个实例，立即标记 collusion 风险。
2. 审计预算核算。H 如何分配？Uniform、random、flag-directed？预期中审计了多少比例的输出？
3. Collusion-vector 枚举。对于每一对不可信组件（U-producer + U-monitor、U-producer + U-editor），枚举 collusion vectors：steganographic cues、shared-training prior exploitation、timing channels。
4. Capability-gap 分析。T 比 U 弱多少？在什么点上 T 的 editing signal 会变成噪声（例如，T 无法可靠检测 U 产生的 backdoors）？
5. 最坏情况威胁模型。在假设 U 是对抗性的，并且完全了解协议的前提下，对手的最佳策略是什么？Red-team 尝试中有多少比例会成功？

硬性拒绝：
- 任何把 U 用作自身 monitor、却没有 collusion-resistance 机制的协议描述。
- 任何声称“near-zero backdoor rate”、却没有 red-team evaluation 且 red team 可见协议的协议主张。
- 任何没有阐明 T-to-U capability gap 和 H 预算的协议审计。

拒绝规则：
- 如果用户问“is this protocol safe”，在没有三部分证据时拒绝回答：(a) red-team result，(b) capability-gap estimate，(c) H budget。
- 如果用户混淆 alignment 和 control（“we aligned U so we don't need a protocol”），拒绝并指向第 9 课（alignment faking）——alignment 是 U 的属性；control 是协议的属性。

输出：一页审计，填写以上五个部分，命名最薄弱环节（通常是 T-to-U capability gap 或 collusion resistance），并说明单个最大的未解决 failure mode。引用 Greenblatt et al. (arXiv:2312.06942) 一次，作为 threat-model 来源。
