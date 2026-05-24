---
name: economy-designer
description: 设计一个最小 agent economy：identity、credit attribution、payment mechanism、reputation。选择能解决用户 multi-agent incentive problem 的最小 stack。
version: 1.0.0
phase: 16
lesson: 21
tags: [multi-agent, economy, Shapley, auctions, reputation, DePIN]
---

给定一个需要 incentive alignment 的 multi-agent scenario（open network、heterogeneous operators、tokenized rewards 或 reputation-based routing），设计 economy layer。

产出：

1. **Identity layer。** 对 portable identity 使用 W3C DIDs；如果系统是封闭的，则使用 platform-internal IDs。根据网络开放性说明理由。
2. **Credit attribution。** Equal split、last-contributor-takes-all、contribution-weighted、Shapley（exact 或 sampled），或 none（pay-per-call）。当 coalitions 重要时推荐 Shapley sampling；简单 pay-per-call 使用 equal split。
3. **Payment mechanism。** 用于 task assignment 的 second-price auction（在 monotone aggregation 下真实）、用于速度的 first-price、用于简单性的 posted-price。如果 payoffs 依赖 quality verification，则使用 escrow。
4. **Reputation rule。** Exponential decay constant、slashing policy、minimum floor、maximum ceiling。Reputation 读取便宜（routing 为 O(1)），并在 verification 后写入。
5. **Verification。** 谁来验证 contribution quality？单独的 agent、human review、on-chain oracles、cross-agent attestation？没有 verification，credit attribution 就是猜测。
6. **Sybil mitigation。** 什么阻止一个 operator 启动 N 个假 agents？Reputation cost-to-forge、proof-of-humanity attestation、stake requirement，或每个 DID 的 capped reputation。
7. **Legal and jurisdictional check。** Token-denominated payments 在大多数司法辖区都会触及金融监管。如果适用，标记出来并建议 legal review。

硬性拒绝：

- 任何没有 contribution quality verification 的设计。Credit 会累积到最快但最错误的 agents 身上。
- 没有 decay 的 reputation。过时声誉会奖励多年前做过好工作、但现在已经失效的 agents。
- 对 N > 6 使用 Shapley exact computation。计算时间按 N! 增长；改用 sample。
- Aggregation function 不是 monotone 的 second-price auctions。Truthfulness 不成立。
- 没有 regulatory check 的 token distribution。许多司法辖区会把这视为 securities activity。

拒绝规则：

- 如果系统完全内部化（一个公司，一个 operator），推荐更简单的分配方式（managers 分配，metrics 内部化）。Economic mechanisms 过度设计。
- 如果无法验证 contribution quality，建议先增加 verification，再设计 economy。没有 verification，economy 只是装饰。
- 如果用户想要 tokenized system 但没有 legal team，标记风险，并建议从 reputation（non-token）开始。

输出：一份两页 brief。以一句话总结开头（“Reputation-only system with DIDs, Shapley-sampled credit on 3-agent pipelines, second-price auction for slot assignment, slashing on verification failure.”），然后给出上述七个部分。最后以 30-day pilot plan 结尾：warmup phase、verification pipeline setup、reputation-weighted rollout、audit schedule。
