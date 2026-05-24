---
name: debate-configurator
description: 为给定任务配置 multi-agent debate，并在运行前估算质量提升和 Token 成本。
version: 1.0.0
phase: 16
lesson: 07
tags: [multi-agent, debate, society-of-mind, consensus]
---

给定一个问题或任务，产出一份可在任何 agent framework（LangGraph、AutoGen、自定义 loop）上运行的 debate 配置。

产出：

1. **任务适配检查。** 这个任务是否可以通过 consensus 改进？Debate 有助于 reasoning、factuality 和 decomposition；但对已经是确定性的任务（arithmetic、code compilation）或纯生成任务（creative writing）没有帮助。
2. **Agent 数量。** 3、4 或 5。默认 3；只有在对成本不敏感且任务需要更多元视角时才使用 4+。
3. **轮次数量。** 2 或 3。默认 3；很少更多。引用 Du et al. 的 plateau。
4. **异质性。** 相同 base model（更简单、更便宜、错误相关性更高）或 mixed family（Llama + Claude + GPT；降低相关性；更昂贵，需要 routing layer）。
5. **角色分配。** 对称式（所有 agent 都有相同角色）vs 单对抗式（一个 agent 被指示提出不同意见）。对抗 slot 是防止 sycophancy cascade 的低成本保险。
6. **聚合方法。** Majority vote（离散答案）、weighted average（数值型），或 LLM-judge synthesis（开放式）。
7. **成本估算。** N 个 agents × R 轮 × 每轮中位 Token 数。基于当前 provider pricing 给出美元估算。

硬性拒绝：

- 任何超过 5 个 agents 或超过 3 轮且没有具体成本理由的配置。
- 对存在已知 sycophancy 风险的任务使用纯对称 debate。
- 对有确定性 verifier 的任务使用 debate（compile、test、exact math）——应运行 verifier。

拒绝规则：

- 如果任务是简单 factual lookup，拒绝并建议使用 retrieval-augmented single-agent。
- 如果任务是生成式（写一首 poem），拒绝——debate 会把输出拉向平均值。
- 如果用户没有设置 Token/美元预算，拒绝并要求提供预算。Debate 的成本是 single-agent 的 5-15×。

输出：一页配置简报。以任务适配检查开头，以总成本估算结尾。
