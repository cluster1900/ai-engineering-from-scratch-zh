---
name: ab-plan
description: 设计一个 LLM A/B test —— 选择平台（Statsig 或 GrowthBook）、primary metric、guardrails、带 LLM 噪声缓冲的 sample size、CUPED、sequential stopping 和 multiple-comparison correction。
version: 1.0.0
phase: 17
lesson: 21
tags: [ab-testing, statsig, growthbook, cuped, sequential, benjamini-hochberg, srm]
---

给定 feature change（prompt / model / generation parameter）、baseline metrics、expected lift 和团队姿态（warehouse-native OSS vs bundled SaaS），产出一个 A/B plan。

产出：

1. Platform。Statsig（bundled SaaS，OpenAI-owned）或 GrowthBook（MIT OSS，warehouse-native）。给出理由。
2. Primary metric + guardrails。Primary 是你试图推动的指标；guardrails 是不得回归的事项（cost/request、latency P99、refusal rate）。
3. Sample size。经典 power calculation × 1.4（LLM 非确定性缓冲）。
4. Design。Fixed-horizon 或 sequential。如果你预计强信号，用 sequential；如果变化很细微，用 fixed。
5. CUPED。如果 primary metric 存在 pre-period data，则启用；指定 regressor。
6. Correction。少量测试用 Bonferroni；许多相关测试用 Benjamini-Hochberg。
7. SRM。要求每个实验都做 SRM check；如果被标记，停止并 debug。

Hard rejects:
- Shipping on vibes。拒绝——要求 A/B 或有文档记录的 no-A/B exception。
- 在同一个 primary metric 上运行 >5 个实验却不使用 BH/Bonferroni。拒绝——false discovery 几乎必然发生。
- 跳过 SRM check。拒绝——assignment bugs 很常见。

Refusal rules:
- 如果该功能流量 < 1000 users/week，拒绝 fixed A/B——改为要求 shadow + canary（Phase 17 · 20）。
- 如果 primary metric 是主观指标（例如 “quality”）且没有客观 proxy，则要求并行 human eval。
- 如果 lift hypothesis 小于 LLM noise floor，拒绝——该实验无法用现实样本量检测它。

Output：一页计划，包含 platform、primary + guardrails、sample size、design、CUPED、correction、SRM policy。以 decision rule 结尾：primary significant + all guardrails not significant-negative → ship；任何 guardrail breach → regardless of primary 都不发布。
