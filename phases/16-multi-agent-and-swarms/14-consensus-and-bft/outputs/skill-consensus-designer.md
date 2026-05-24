---
name: consensus-designer
description: 为 multi-agent ensemble 设计一个 BFT-aware consensus protocol。选择 clustering、weighting、threshold 和 escalation policy；针对 byzantine、sycophancy 和 monoculture patterns 对设计进行 attack-test。
version: 1.0.0
phase: 16
lesson: 14
tags: [multi-agent, consensus, BFT, voting, confidence]
---

给定一个由 N 个 agents 组成、回答同一个问题的 ensemble，设计一个 consensus protocol，使其能抵御三类 canonical LLM-agent attacks：byzantine lie、sycophantic conformity、correlated-error monoculture。

产出：

1. **Clustering strategy。** 答案如何分组？String canonicalization（lowercase + strip punct）、基于 threshold 的 Embedding similarity，或显式 structural canonicalization（JSON schema）。说明预期的 cluster-granularity error rate。
2. **Weighting strategy。** Plurality（counts）、confidence-probe weighted（CP-WBFT）、quality-plus-trust（WBFT），或带 geometric-median robustness 的 score-based 方法（DecentLLMs）。根据 attack profile 说明选择理由。
3. **Threshold。** 总 weight 的多大比例触发 acceptance？低于 threshold 时会怎样：retry、escalate，还是 abstain？
4. **Diversity requirement。** ensemble 需要多少个 base models、prompt families 或 temperature settings？Monoculture 是 plurality 无法恢复的 attack；diversity 是 structural mitigation。
5. **Independent verifier。** 是否有一个 read-only agent 获取 ground truth（如可用）或应用 rubric？verifier 的输出流向哪里？它绝不能重新进入 voting pool。
6. **Round bounding。** escalating 前的最大 rounds。大多数任务默认 2-3。更长 rounds 会放大 sycophancy。
7. **Attack-test table。** 对于（byzantine、sycophancy、monoculture）中的每一种，展示预期的 protocol behavior 和 residual risk。如果该 protocol 存在已知 failure mode，用一句话说明。

Hard rejects：

- 任何在单一 base model 上只做 plurality-only 的设计。Monoculture 会让这种设计静默失败。
- 任何包含 unbounded rounds 或“keep debating until agreement”的设计。这会奖励 conformity。
- 任何让 verifier 输出反馈回 voting pool 的设计。这会污染 verifier。
- 声称 BFT“solves” disagreement。BFT 对齐 outputs；correctness 是另一个问题。

Refusal rules：

- 如果任务没有 ground truth（opinion、synthesis、creative），请说明这一点，并建议“consensus as advisory, human as decider”。
- 如果可用 agents 少于 3 个，consensus 不适用；改为建议 single agent plus verifier。
- 如果所有 agents 共享同一个 base model 且用户无法改变这一点，请明确标出 monoculture ceiling。

输出：一页 design brief。以一句话 summary 开头（“Confidence-weighted voting over 5 agents (3 base models), semantic-cluster threshold 0.55, independent verifier re-fetches sources, max 2 rounds.”），然后给出上面的七个 sections。最后以 attack-test table 结束。
