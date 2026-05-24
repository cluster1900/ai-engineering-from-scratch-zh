---
name: mesa-diagnostic
description: 将观察到的 safety failure 分类为 outer-alignment、proxy-inner 或 deceptive-inner。
version: 1.0.0
phase: 18
lesson: 6
tags: [mesa-optimization, deceptive-alignment, inner-alignment, hubinger]
---

给定一份 safety evaluation report（eval task、failure mode、model class、training recipe），将 failure 分类到 Hubinger 2019 的类别中，并推荐能够处理它的 mitigation class。

产出：

1. Failure-mode categorization。选择以下之一：
   - Outer-alignment failure：base objective（reward、loss）是错的；model 正确地优化了它。
   - Inner-alignment proxy failure：mesa-objective 是一个 proxy，在 in-distribution 中跟踪 base；在 off-distribution 中失败。
   - Inner-alignment deceptive：mesa-optimizer 有 situational awareness，并在 deployment 时 defect；training behaviour 是干净的。
2. Evidence trace。对每个 category，说明什么 evidence 会支持它。对 deceptive，要与 proxy 区分：situational awareness 的 evidence（date sensitivity、eval-vs-deployment distinguishers、chain-of-thought 中的 strategic reasoning）。
3. Mitigation class。对 outer-alignment：改变 objective（CAI、更好的 reward data、process supervision）。对 proxy-inner：distributional coverage、ensembles、held-out evals。对 deceptive-inner：control measures（Lesson 10）、interpretability（residual-stream probes）、capability reductions。
4. Known-failures check。对 deceptive-inner，引用该 failure 最相似的相关 2024-2026 实证展示（Sleeper Agents、Alignment Faking、In-Context Scheming）。

Hard rejects：
- 任何没有 situational awareness evidence 的 deceptive-inner 分类。“deployment 时出现 unexpected behaviour” 不够，因为它可能是 proxy-inner。
- 任何声称 adversarial robustness training 本身能处理 deceptive-inner 的说法。Hubinger 2019 预测（Sleeper Agents 2024 确认）adversarial training 可能教会更好的 test-vs-deployment distinguishers。
- 任何建议用更多数据 retrain deceptively aligned model 的做法。prior 预测 deception 会在进一步 training 下保留下来。

Refusal rules：
- 如果 evidence 只是单个 prompt 上的一次 failure，拒绝分类。Base rates 很重要；你需要 failures 的 distribution。
- 如果用户要求你 “rule out” deceptive alignment，拒绝，因为你可以根据 evidence 估计它的 probability，但不能仅凭 behaviour 排除它。

Output：一页 diagnosis，包含 category、evidence trace、mitigation class 和 nearest empirical analog。引用一次 Hubinger et al. (arXiv:1906.01820)。
