---
name: eagle3-rollout
description: 生成分阶段的 EAGLE-3 speculative-decoding rollout plan，在上线前测量真实流量上的 acceptance rate alpha。
version: 1.0.0
phase: 17
lesson: 05
tags: [speculative-decoding, eagle-3, vllm, alpha, production-rollout]
---

给定 target model、硬件（GPU 类型和数量）、流量描述（general chat / code / specialized）、concurrency target，以及当前 baseline metrics（TTFT、ITL、throughput），生成分阶段的 EAGLE-3 rollout plan。

产出：

1. Baseline measurement plan。使用哪个 benchmark（LLMPerf、GenAI-Perf 或 production shadow）、哪种 prompt distribution、哪个 concurrency point、记录哪些 metrics（TTFT mean/P99、ITL mean/P99、throughput、concurrency）。
2. Draft-head selection。通用聊天使用 ShareGPT-trained EAGLE-3。专业流量（code、medical、legal）使用 Domain-trained EAGLE-3，或决定在上线前训练一个。
3. Config。精确的 vLLM `speculative_config` 字段（method、model、num_speculative_tokens）。注明 v0.18.0 兼容性：draft-model speculation 不能与 `--enable-chunked-prefill` 组合；V1 中的 N-gram GPU spec decode 是例外。
4. Alpha gate。生产并发下目标 alpha >= 0.55。测量流程：shadow traffic 24 小时，记录 vLLM `spec_decode_metrics`，用 accepted tokens 除以 requested draft length。如果任意 1 小时窗口中 alpha 低于 0.45，触发 kill switch。
5. Tail watch。绘制 P99 ITL delta（spec on - spec off）。如果 delta 为正，说明 rejected-draft two-pass pattern 正在产生影响。降低 K，或在该 workload 上禁用。
6. Break-even check。在报告的并发下，计算当前 verify overhead 的 break-even alpha。只有当 measured alpha 至少高出 break-even 0.1 时才上线。

硬性拒绝：
- 未测量生产流量上的 alpha 就上线。拒绝，并要求 24 小时 shadow measurement。
- 声称 2-3x speedup 却不说明 measured alpha。
- 为 latency 不是约束的离线 batch jobs 启用 speculative decoding。
- 在 vLLM v0.18.0 上把 draft-model speculation 与 chunked prefill 组合。硬不兼容。

拒绝规则：
- 如果流量主要是非常短的输出（平均低于 50 Token），拒绝。Draft overhead 占主导；上线普通 target。
- 如果硬件是 consumer（RTX 4090 / 5090）且 batch size 保持在 8 以下，推荐普通 target，因为 verify overhead 的 batch-amortization 需要该硬件无法提供的并发。
- 如果用户想要在没有 measurement loop 的情况下 auto-tune K，拒绝。K 由 measured alpha 加 verify overhead 选择；没有 auto-tune 可以替代测量。

输出：一页分阶段 rollout plan，列出 baseline → config → alpha gate → tail watch → break-even confirmation。最后用一个“what to measure next”段落收尾，根据诊断结果指出 domain-specific EAGLE-3 training、lower K，或 reverting to plain target。
