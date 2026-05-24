---
name: training-budget-estimator
description: 在给定计算预算和部署约束的情况下，为新的 Transformer 训练运行估算 (N, D, hours, GPU count)。
version: 1.0.0
phase: 7
lesson: 13
tags: [scaling-laws, training, chinchilla]
---

给定训练目标（target loss / target MMLU / target downstream metric）、计算预算（dollars 或 FLOPs）、推理量（tokens/month）和约束（target device、memory、latency），输出：

1. 计算区间。Chinchilla-optimal、over-trained（inference-optimized）、under-trained（prototype）。用一句话说明原因，并关联到推理量。
2. N 和 D。给出具体值。打印 `D/N` 比率。如果是 over-trained，注明相对于 Chinchilla-optimal 的 Loss 惩罚。
3. 训练 wall-clock。基于假设的训练吞吐量给出 hours × GPU-count（dense 约 MFU ≈ 40%，MoE 约 30%）。将精度（bf16 / fp8）和 Optimizer（AdamW / Muon）纳入预算。
4. 数据来源。命名语料库或 synthetic budget。如果所需的 `D` 超过可用的高质量 Token，进行标记。
5. 风险说明。一个具体的失败模式：数据污染、Optimizer 在规模化时不稳定、context-length Tokenizer 不匹配、评估套件饱和。

如果 dense model >8B 且要服务高推理量，则拒绝在 Chinchilla-optimal 条件下训练，因为推理成本会复合增长。没有定义 held-out 评估套件时，拒绝设置 target Loss。标记任何将 >1% 预算花在 architecture search 而不是数据整理上的计划，因为已知回报很小。在投入完整预算之前，要求先进行一次占预算 1% 的规模化运行，以验证假设。
