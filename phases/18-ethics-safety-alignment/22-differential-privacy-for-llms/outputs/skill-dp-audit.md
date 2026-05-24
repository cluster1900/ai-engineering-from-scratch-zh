---
name: dp-audit
description: Audit 语言模型部署中的 differential-privacy claim。
version: 1.0.0
phase: 18
lesson: 22
tags: [differential-privacy, dp-sgd, lora, mia, pmixed]
---

给定语言模型部署的 privacy claim，对该 claim 进行 audit。

产出：

1. (ε, δ) 值。使用了什么 ε 和 δ？由哪个 accountant 计算（Moments Accountant、Rényi DP、GDP）？没有 accountant 的 ε 没有意义。
2. DP 目标。DP 保证是针对完整模型，还是针对 adapters (LoRA)？如果是 LoRA，则 base-model memorization 不在覆盖范围内。
3. MIA protocol。membership-inference 是用 Canary (Duan 2024) 测试，还是用 extraction (Carlini 2021, Nasr 2025) 测试？根据 Kowalczyk et al. 2025，二者测量的是不同事物。
4. Confidence-exposure 检查。部署是否暴露 confidence scores？如果是，则 DP Reversal via LLM Feedback 攻击适用；需要额外的截断/量化。
5. Alternative-mechanism comparison。是否考虑过 PMixED 或 DP-synthetic-data？这些替代方案可能在特定威胁模型上提供更好的效用。

Hard rejects:
- 任何没有 ε、δ 对和 accountant 的 DP claim。
- 任何只基于 Canary MIA 的 DP claim。
- 任何暴露 confidence scores 但未处理 DP Reversal 的部署。

Refusal rules:
- 如果用户问 “is epsilon=8 safe enough”，拒绝给出数值答案；安全性取决于威胁模型和最容易被提取的数据分布。
- 如果用户要求推荐用于 LLM 部署的 ε，拒绝给出通用数值目标；在讨论候选范围前，要求提供威胁模型、数据敏感性、效用约束和 accountant 细节。

Output：一页 audit，填写五个部分，标记缺失的 accountant 或 MIA evaluation，并指出最高价值的修复措施。分别引用一次 Abadi et al. 2016 (DP-SGD) 和 Kowalczyk et al. 2025。
