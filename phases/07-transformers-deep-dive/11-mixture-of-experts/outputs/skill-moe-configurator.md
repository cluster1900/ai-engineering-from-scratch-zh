---
name: moe-configurator
description: 为新的 MoE Transformer 选择 expert 数量、top-k、balancing strategy 和 shared-expert 布局。
version: 1.0.0
phase: 7
lesson: 11
tags: [transformers, moe, mixture-of-experts, scaling]
---

给定一个 Transformer spec（总参数预算、期望的每 Token active params、可用 training tokens、inference hardware），输出：

1. MoE 布局。`n_experts`、`top_k`、`n_shared`。对于 frontier scales，选择 fine-grained（256+ experts，top-8）；对于较小规模，选择 classic（8 experts，top-2）。用一句话说明理由。
2. Balancing strategy。Auxiliary-loss-free（DeepSeek-V3，默认）、Switch-style auxiliary loss，或 expert-capacity + token drop。如果使用 aux-loss-free，请给出 `γ` 值。
3. Expert parallelism 方案。说明如何根据 VRAM 在 GPUs 间 shard experts。说明每个 expert 的 VRAM 成本和总 fleet size。
4. Routing precision。fp32 router scores 与 fp16 的选择。Router precision 在大规模下很重要。
5. Failure mode 检查。具名风险：router collapse、expert starvation、all-to-all network bottleneck、routing overhead 导致的 inference latency、checkpoint memory footprint。

对于 active-parameter counts 低于 4B 的情况，拒绝推荐 MoE，因为在匹配 compute 时 dense 更优。对于 2026 年的新项目，拒绝仅使用 auxiliary-loss-only balancing（aux-loss-free 是默认选择）。如果 total params 超过 80 GB 且没有 expert-parallel 方案，拒绝交付 MoE。将用于 latency-critical single-user paths 的 MoE 标记为可能比等效 dense 模型更慢。
