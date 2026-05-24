---
name: parallel-inference-router
description: 在 voting、tree-of-thought、multi-agent、Hogwild! 和 speculative decoding 策略之间路由 reasoning 工作负载。
version: 1.0.0
phase: 10
lesson: 22
tags: [parallel-inference, hogwild, speculative-decoding, tree-of-thought, multi-agent, reasoning]
---

给定一个 reasoning 工作负载画像（每个任务的 Token budget、任务 parallelism 特征、model family、deployment target、latency budget），推荐一种 parallel-inference 策略或组合。

生成：

1. 任务 Classification。长 reasoning（5k+ tokens）、中等 chain-of-thought（1k-5k）、短 chat（低于 1k），或 Classification。它驱动第一轮决策。
2. Parallelism 轴。Within-sequence（speculative decoding）vs across-sequence（voting、Hogwild!、multi-agent）。大多数工作负载应先从 within-sequence 轴获益。
3. 策略推荐。从以下选项中选择：仅 speculative decoding（任何超过 100 tokens 的工作负载的安全默认值）、speculative + Hogwild!（具有可并行结构的长 reasoning）、tree-of-thought（显式 branch-and-prune 问题）、multi-agent（角色专门化问题）、voting ensemble（高风险 Classification）。
4. 参数设置。对于 speculative decoding：draft family（默认 EAGLE-3）和 `N`（Phase 10 · 15 skill）。对于 Hogwild!：worker count N（2 到 4，很少更多）、coordination prompt template、single-node deployment 确认。
5. 组合 speedup 估计。如果组合 speculative decoding 与 Hogwild!，报告乘法 speedup（典型范围：3x spec * 1.5-2x Hogwild! = 4.5-6x）。

硬性拒绝：
- 对任何低于 2000 tokens 的工作负载使用 Hogwild!。coordination overhead 会占主导。
- 在非 reasoning models 上使用 Hogwild!（没有 emergent coordination）。
- 对没有自然角色分解的问题使用 multi-agent framework。
- 没有显式 branch-and-prune 逻辑的 tree-of-thought（否则该策略会退化为线性 CoT）。
- 跨节点运行 Hogwild!（cross-node cache synchronization 太慢）。

拒绝规则：
- 如果工作负载是实验性研究，将 Hogwild! 推荐为实验，而不是 production bet。speedups 依赖任务，并且截至 2026 年 4 月，真实世界 deployment 仍然少见。
- 如果用户要求保证 speedup，拒绝并解释只有 speculative decoding 具有强保证属性（保留 output distribution）。Hogwild! 是经验性的。
- 如果用户 VRAM 有限，拒绝 Hogwild! N>2 —— 每个 worker 都需要自己的 activation memory，尽管 cache 是共享的。

输出：一页推荐，列出任务 Classification、parallelism 轴、策略、参数和组合 speedup 估计。最后以一个 "rollback trigger" 段落收尾，指出具体的 latency 或 accuracy metric：如果 Hogwild! 在前 100 个 production requests 中没有带来收益，该指标将证明应回退到仅使用 speculative decoding。
