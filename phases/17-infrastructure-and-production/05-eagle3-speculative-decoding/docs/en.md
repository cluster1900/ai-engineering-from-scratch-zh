# 生产环境中的 EAGLE-3 Speculative Decoding

> Speculative decoding 会将快速的 draft model 与 target model 配对。Draft 会提出 K 个 Token，target 通过一次 forward 完成验证；被接受的 Token 无需额外成本。到 2026 年，EAGLE-3 已成为生产级变体。它基于 target model 的 hidden state 训练 draft head，而不是基于原始 Token，从而在通用聊天场景中将 acceptance rate alpha 推高到 0.6-0.8 区间。正确的问题不是“draft 有多快”，而是“我的流量中 alpha 是多少？”如果 alpha 低于约 0.55，speculative decoding 在高并发下会产生负收益，因为每个被拒绝的 draft 都会带来第二次 target forward pass。本课将教你先测量 alpha，再启用 flag。

**Type:** Learn
**Languages:** Python（stdlib，玩具版 acceptance-rate simulator）
**Prerequisites:** Phase 17 · 04（Serving Engine Internals），Phase 10 · 18（Multi-Token Prediction）
**Time:** ~60 分钟

## Learning Objectives

- 说出 speculative decoding 的三代技术，并解释 EAGLE-3 相比 EAGLE-2 和传统 draft model 做出了哪些改变。
- 定义 acceptance rate alpha，根据 alpha 和 K（draft length）计算预期 speedup，并找出目标并发量下的 break-even alpha。
- 解释为什么 speculative decoding 在 2026 年的 vLLM 中需要显式启用（而不是默认启用），以及为什么未经 alpha 测量就开启它是一种生产 anti-pattern。
- 编写 measurement plan：使用哪个 benchmark、哪种 prompt distribution、哪个 concurrency point，以及用哪项 metric 作为 gate。

## The Problem

Decode 受 memory 限制。在 H100 上运行 Llama 3.3 70B FP8 时，每解码一个 Token 都会读取约 140 GB/s 的权重，并输出一个 Token。GPU compute 在 decode 期间几乎处于空闲状态，bottleneck 是 HBM bandwidth，而不是 matmul throughput。

Speculative decoding 利用了这一缺口。先用成本较低的 draft model 生成 K 个 candidate Token，再让 target model 通过一次 forward pass 验证全部 K 个 Token。每个通过验证的 Token 实际上都无需额外成本，因为它被摊销进 target 本来就必须执行的 batch-of-K forward 中。

传统 draft-model 方法使用同一系列中的较小 Model（例如使用 Llama 3.2 1B 为 Llama 3.3 70B 起草）。这种方式可以工作，但 acceptance rate 表现一般，因为较小 Model 的 distribution 会偏离 target。EAGLE、EAGLE-2 以及 EAGLE-3 都直接基于 target model 的内部 state 训练轻量 draft head，因此 draft 的 distribution 能更紧密地跟随 target。这正是 alpha 从 draft model 的 0.4 提升到 EAGLE-3 的 0.6-0.8 的原因。

问题在于：EAGLE-3 在 2026 年的 vLLM 中需要显式启用。必须明确设置 `speculative_config`。没有配置，就没有加速。团队如果未在真实流量上测量 alpha 就开启它，往往会发现 tail latency 变差，而不是变好。

## The Concept

### Speculative decoding 实际带来了什么

不使用 spec decode 时，每个 Token 的成本是一次 target forward。使用 draft length K 和 acceptance alpha 的 spec decode 时，每次 target forward 预期产生的 Token 数为 `1 + K * alpha`。Speedup 为 `(1 + K * alpha) / (1 + epsilon)`，其中 epsilon 是 draft 加 verify 的 overhead。当 K=5、alpha=0.7 时：`(1 + 5*0.7) / (1 + 0.1) = 4.5 / 1.1 = 4.1x`。真实环境中的数字通常集中在 2-3x，因为生产流量中的 alpha 很少如此之高，而且 epsilon 会随着 batch size 增大而上升。

### 为什么 alpha 是唯一重要的 metric

被拒绝的 Token 不会凭空消失，它们会迫使系统为第一个被拒绝的 Token 再执行一次 target forward。在 alpha 降至 0.4 的 workload 中，你需要同时支付 draft overhead、verification 和重新生成的成本。在高并发下（例如 256 路并发），decode batch 已经足够大，“仅运行 target”和“运行 target 并执行 verify”之间的 memory-bandwidth 差距会缩小。在大多数 2026 年硬件上，当 alpha 低于 0.55 时，spec decode 会产生负收益。

Alpha 会随 workload 变化。在 ShareGPT 风格的通用聊天中，基于 ShareGPT 训练的 EAGLE-3 可以达到 0.6-0.8。在特定领域流量中（代码、医疗、法律），使用通用数据训练的 draft head 会降至 0.4-0.6。训练特定领域的 draft head 可以恢复 alpha。与 target Fine-tuning 相比，这是一项轻量、快速的 Training 工作。

### EAGLE 各代概览

- **Classic draft model**：同一系列中的较小 Model。Alpha 为 0.3-0.5。基础设施简单，需要加载两个 Model；每次 target forward 对应 draft 运行 K 次 forward。
- **EAGLE-1（2024）**：在 target hidden state（最后一层）上训练的单个 draft head。Alpha 约为 0.5-0.6。在 target 之上只增加少量 parameter overhead。
- **EAGLE-2（2025）**：使用 adaptive draft length 和 tree-based draft（在一次 target pass 中验证多个 branch）。Alpha 约为 0.6-0.7。Draft scheduler 更复杂。
- **EAGLE-3（2025-2026）**：在 target 的多个 layer（而不只是最后一层）上训练 draft head，alignment 更好。在通用聊天中，alpha 约为 0.6-0.8。

### 2026 年的生产方案

1. 先部署不带加速的 target model。在目标并发量下测量 baseline TTFT、ITL 和 throughput。
2. 通过 vLLM `speculative_config` 启用 EAGLE-3 draft。重新运行 benchmark。
3. 记录 acceptance rate alpha。vLLM V1 通过 `spec_decode_metrics.accepted_tokens_per_request` 报告该值。用它除以请求的 draft length 即可得到 alpha。
4. 如果生产流量 distribution 上的 alpha < 0.55，则禁用 spec decode，或训练特定领域的 EAGLE-3 draft。
5. 在生产并发量下重新运行。确认 P99 ITL 没有变差。

### 生产陷阱：P99 tail

Spec decode 会降低平均 ITL。如果没有进行调优，P99 可能变差。被拒绝的 draft 会触发双 pass sequence（draft + verify-fail + reroll）。在 batch 满载时，这两个 pass 会串行执行。应关注 P99 ITL，而不是 P50。

### EAGLE-3 已经部署在哪里

Google 于 2025 年在 AI Overviews 中部署了 speculative decoding，在保持相同质量的同时缩短响应时间。vLLM V1 将 `speculative_config` 作为文档规定的接口；V1 中的 N-gram GPU speculative decoding 是兼容 chunked prefill 的变体。SGLang 支持 EAGLE-3，并将其作为 prefix-heavy workload 推荐使用的 draft 路径。

### 一行 break-even 数学

预期 speedup：`S(alpha, K) = (1 + K*alpha) / (1 + verify_overhead)`。令 `S = 1` 并求解 alpha，可得：`alpha_breakeven = verify_overhead / K`。当典型 verify_overhead 约为 0.15 且 K=5 时：`alpha_breakeven = 0.03`。但这只是原始 decode 数学。在高并发下，verify overhead 会上升，并且 decode batch 已经能在不同 sequence 之间摊销 memory read，因此实践中的有效 alpha_breakeven 会升至约 0.45-0.55。

### 何时不应使用 speculative decoding

- Batch-1 offline generation，且 latency 不重要。直接使用 target。
- 非常短的输出（少于 50 个 Token）。Draft overhead 和 verify 成本会占据主导。
- 没有特定领域 draft head 的专业领域。Alpha 太低。
- vLLM v0.18.0、draft-model spec decode 与 `--enable-chunked-prefill` 的组合。该组合无法编译。文档中说明的例外是 V1 中的 N-gram GPU spec decode。

```figure
mx-speculative-tree
```

## Use It

`code/main.py` 模拟使用和不使用 speculative decoding 的 decode loop，并覆盖一系列 alpha 值和 draft length K。它会输出 break-even alpha、测得的 speedup 和 tail behavior。在多组（alpha, K）组合上运行它，可以准确观察 speculative decoding 从何处开始不再产生收益。

## Ship It

本课会产出 `outputs/skill-eagle3-rollout.md`。给定 target model、traffic distribution 描述和 concurrency target，它会生成分阶段的 EAGLE-3 rollout plan：测量 benchmark baseline、启用 config、测量 alpha、以 alpha >= 0.55 作为 gate，并监控 P99 ITL。

## Exercises

1. 运行 `code/main.py`。当 K=5 时，实现 2x speedup 需要多少 alpha？实现 3x speedup 呢？结果对 verify_overhead 有多敏感？
2. 假设生产流量中 70% 是通用聊天，30% 是代码。基于 ShareGPT 训练的 EAGLE-3 在通用聊天上达到 alpha 0.7，在代码上达到 alpha 0.4。混合 alpha 是多少？Spec decode 是否产生正收益？
3. 阅读 vLLM `speculative_config` 文档。说出三种 mode（draft model、EAGLE、N-gram），以及其中哪一种兼容 chunked prefill。
4. 启用 EAGLE-3 后，你看到平均 ITL 下降了 25%，但 P99 ITL 上升了 15%。诊断原因并提出缓解方案。
5. 计算 Llama 3.3 70B 的 EAGLE-3 draft head memory cost。它与使用 Llama 3.2 1B 作为 classic draft 相比如何？

## Key Terms

| Term | 人们怎么说 | 它实际表示什么 |
|------|----------------|------------------------|
| Speculative decoding | “draft 加 verify” | 使用低成本 Model 提出 K 个 Token，再通过一次 target forward 验证全部 K 个 Token |
| Acceptance rate alpha | “spec accept rate” | 被 target 接受的 draft Token 比例；唯一重要的 metric |
| Draft length K | “spec k” | 每次 target forward 中 draft 提出的 Token 数；典型值为 4-8 |
| Verify overhead epsilon | “spec overhead” | 相比普通 target forward，verify-and-reroll 带来的额外成本；随 batch 增长 |
| EAGLE-3 | “最新的 EAGLE” | 2025-2026 年的变体；在 target 的多个 layer 上训练 draft head；通用聊天中的 alpha 为 0.6-0.8 |
| `speculative_config` | “vLLM spec config” | vLLM V1 中需要显式启用的配置；默认不启用意味着没有加速 |
| N-gram spec decode | “N-gram draft” | 使用 prompt 中的 N-gram lookup 在 GPU 端生成 draft；兼容 chunked prefill |
| Break-even alpha | “无收益 alpha” | Spec decode 恰好不产生 speedup 时的 alpha；应在生产并发量下关注该值 |
| Rejected-draft two-pass | “reroll cost” | Draft 被拒绝时执行两次 target forward；会推高 P99 tail |

## Further Reading

- [vLLM — Speculative Decoding 文档](https://docs.vllm.ai/en/latest/features/spec_decode/) — 关于 V1 中 `speculative_config` 和 chunked prefill 兼容性的权威来源。
- [vLLM Speculative Config API](https://docs.vllm.ai/en/latest/api/vllm/config/speculative/) — 完整且精确的字段集合。
- [EAGLE 论文（arXiv:2401.15077）](https://arxiv.org/abs/2401.15077) — 最初的 EAGLE draft-head 形式。
- [EAGLE-2 论文（arXiv:2406.16858）](https://arxiv.org/abs/2406.16858) — adaptive draft 和 tree。
- [UC Berkeley EECS-2025-224](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2025/EECS-2025-224.html) — 使用 speculative decoding 的高效 LLM system。
- [BentoML — Speculative Decoding](https://bentoml.com/llm/inference-optimization/speculative-decoding) — 生产 rollout checklist。
