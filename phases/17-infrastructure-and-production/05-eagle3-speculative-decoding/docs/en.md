# 生产环境中的 EAGLE-3 Speculative Decoding

> Speculative decoding 将一个快速 draft model 与 target model 配对。draft 提出 K 个 Token；target 在一次 forward 中验证；被接受的 Token 是免费的。到 2026 年，EAGLE-3 是生产级变体，它在 target model 的 hidden states 上训练 draft head，而不是在原始 Token 上训练，从而在通用聊天中把 acceptance rate alpha 推到 0.6-0.8 区间。正确的问题不是“draft 有多快”，而是“我的流量上的 alpha 是多少？”如果 alpha 低于约 0.55，在高并发下 speculative decoding 会变成净负收益，因为每个被拒绝的 draft 都会消耗第二次 target forward pass。本课教你先测量 alpha，再打开开关。

**类型：** 学习
**语言：** Python（stdlib，玩具 acceptance-rate simulator）
**先修要求：** Phase 17 · 04（vLLM Serving Internals），Phase 10 · 18（Multi-Token Prediction）
**时间：** 约 60 分钟

## 学习目标

- 说出 speculative decoding 的三代演进，并解释 EAGLE-3 相比 EAGLE-2 和经典 draft model 改变了什么。
- 定义 acceptance rate alpha，根据 alpha 和 K（draft length）计算预期加速，并识别目标并发下的 break-even alpha。
- 解释为什么 speculative decoding 在 vLLM 2026 中是 opt-in（非默认），以及为什么不测量 alpha 就开启它是生产反模式。
- 写出测量计划：使用哪个 benchmark、哪种 prompt distribution、哪个 concurrency point、用哪个 metric 作为上线门槛。

## 问题

Decode 是 memory-bound。在一台运行 Llama 3.3 70B FP8 的 H100 上，每个 decoded Token 会读取约 140 GB/s 的权重并输出一个 Token。GPU compute 在 decode 期间几乎空闲，瓶颈是 HBM bandwidth，而不是 matmul throughput。

Speculative decoding 利用了这个差距。用便宜的 draft model 生成 K 个候选 Token，然后让 target model 在一次 forward pass 中验证所有 K 个。每个被验证通过的 Token 实际上都是免费的（摊销进 target 本来无论如何都要做的 batch-of-K forward）。

经典 draft-model 方法使用同一家族的更小模型（Llama 3.2 1B 为 Llama 3.3 70B 起 draft）。它能工作，但 acceptance rate 一般，因为更小模型的 distribution 会偏离 target。EAGLE、EAGLE-2，再到 EAGLE-3，直接在 target model 的 internal states 上训练轻量 draft head，因此 draft 的 distribution 更紧密地跟随 target。这就是为什么 alpha 会从 draft-model 的 0.4 提升到 EAGLE-3 的 0.6-0.8。

关键限制：EAGLE-3 在 vLLM 2026 中是 opt-in。必须显式设置 `speculative_config`。没有 flag，就没有加速。团队如果不在真实流量上测量 alpha 就直接打开，往往会看到 tail latency 变差，而不是变好。

## 概念

### Speculative decoding 实际带来了什么

没有 spec decode 时，每个 Token 的成本是一次 target forward。使用 draft length K 和 acceptance alpha 的 spec decode 时，每次 target forward 的预期 Token 数是 `1 + K * alpha`。加速比是 `(1 + K * alpha) / (1 + epsilon)`，其中 epsilon 是 draft-plus-verify overhead。对于 K=5、alpha=0.7：`(1 + 5*0.7) / (1 + 0.1) = 4.5 / 1.1 = 4.1x`。真实世界数字通常集中在 2-3x，因为生产流量上的 alpha 很少那么高，而且 epsilon 会在高 batch size 下增长。

### 为什么 alpha 是唯一重要的 metric

被拒绝的 Token 不会消失，它们会强制为第一个被拒绝的 Token 进行第二次 target forward。在 alpha 降到 0.4 的 workload 上，你要支付 draft overhead、verification，以及 re-roll。高并发下（例如 256 concurrent），decode batch 已经足够大，“target alone”和“target with verify”之间的 memory-bandwidth 差距会缩小。在大多数 2026 硬件上，alpha 低于 0.55 时，spec decode 在实践中是净负收益。

Alpha 会随 workload 变化。在 ShareGPT 风格的通用聊天上，用 ShareGPT 训练的 EAGLE-3 能达到 0.6-0.8。在 domain-specific traffic（code、medical、legal）上，用通用数据训练的 draft head 会降到 0.4-0.6。训练 domain-specific draft head 可以恢复 alpha；与 target finetuning 相比，这是一个轻量、快速的训练任务。

### EAGLE 代际一览

- **经典 draft model**：同一家族的小模型。Alpha 0.3-0.5。基础设施简单，加载两个模型，draft 每次 target forward 运行 K 次 forward。
- **EAGLE-1（2024）**：在 target hidden states（最后一层）上训练的单个 draft head。Alpha 约 0.5-0.6。在 target 之上有少量参数 overhead。
- **EAGLE-2（2025）**：adaptive draft length 和 tree-based drafts（在一次 target pass 中验证多个分支）。Alpha 约 0.6-0.7。draft scheduler 更复杂。
- **EAGLE-3（2025-2026）**：draft head 在多个 target layers 上训练（不只是最后一层），alignment 更好。通用聊天上 alpha 约 0.6-0.8。

### 2026 生产配方

1. 先以普通方式上线 target model。测量目标并发下的 baseline TTFT、ITL、throughput。
2. 通过 vLLM `speculative_config` 启用 EAGLE-3 draft。重新运行 benchmark。
3. 记录 acceptance rate alpha。vLLM V1 将其报告为 `spec_decode_metrics.accepted_tokens_per_request`。除以 requested draft length 即可得到 alpha。
4. 如果生产流量 distribution 上 alpha < 0.55，禁用 spec decode，或训练 domain-specific EAGLE-3 draft。
5. 在生产并发下重新运行。确认 P99 ITL 没有变差。

### 生产陷阱：P99 tail

Spec decode 会降低 mean ITL。如果没有调优，P99 可能变差。被拒绝的 drafts 会触发两段式序列（draft + verify-fail + reroll）。在满 batch 下，这两次 pass 会串行化。关注 P99 ITL，而不是 P50。

### EAGLE-3 已经部署在哪里

Google 在 2025 年的 AI Overviews 中部署了 speculative decoding（质量相同，响应更快）。vLLM V1 将 `speculative_config` 作为文档化接口发布；V1 中的 N-gram GPU speculative decoding 是兼容 chunked prefill 的变体。SGLang 支持 EAGLE-3，并将其作为 prefix-heavy workloads 的推荐 draft path。

### 一行 break-even 数学

预期加速：`S(alpha, K) = (1 + K*alpha) / (1 + verify_overhead)`。令 `S = 1` 可解得 alpha：`alpha_breakeven = verify_overhead / K`。对于典型 verify_overhead 约 0.15 且 K=5：`alpha_breakeven = 0.03`。但这是原始 decode 数学。在高并发下，verify overhead 会上升，而 decode batch 已经在多个序列之间摊销 memory reads，因此实践中的有效 alpha_breakeven 会爬升到约 0.45-0.55。

### 什么时候不要使用 speculative decoding

- Batch-1 离线生成，且 latency 不重要。使用普通 target。
- 输出很短（低于 50 Token）。Draft overhead 和 verify cost 占主导。
- 没有 domain-trained draft head 的专业领域。Alpha 太低。
- vLLM v0.18.0 加 draft-model spec decode 加 `--enable-chunked-prefill`。这个组合无法编译。文档化的例外是 V1 中的 N-gram GPU spec decode。

## 使用它

`code/main.py` 会在一系列 alpha 值和 draft length K 上模拟有无 speculative decoding 的 decode loop。它会打印 break-even alpha、测得的 speedup 和 tail behavior。在多个 (alpha, K) 组合上运行它，准确观察 speculative decoding 在哪里不再划算。

## 交付它

本课产出 `outputs/skill-eagle3-rollout.md`。给定 target model、traffic distribution 描述和 concurrency target，它会生成分阶段的 EAGLE-3 rollout plan：benchmark baseline、enable config、measure alpha、以 alpha >= 0.55 作为门槛、观察 P99 ITL。

## 练习

1. 运行 `code/main.py`。在 K=5 时，要获得 2x speedup 需要什么 alpha？3x speedup 呢？它对 verify_overhead 有多敏感？
2. 假设生产流量由 70% 通用聊天、30% code 组成。通用聊天在用 ShareGPT 训练的 EAGLE-3 上达到 alpha 0.7；code 达到 alpha 0.4。混合 alpha 是多少？spec decode 是否净正收益？
3. 阅读 vLLM `speculative_config` 文档。说出三种模式（draft model、EAGLE、N-gram），以及哪一种兼容 chunked prefill。
4. 启用 EAGLE-3 后你看到 mean ITL 下降 25%，但 P99 ITL 上升 15%。诊断原因并提出缓解措施。
5. 计算 Llama 3.3 70B 的 EAGLE-3 draft head memory cost。它与把 Llama 3.2 1B 作为经典 draft 运行相比如何？

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Speculative decoding | “draft plus verify” | 用便宜模型提出 K 个 Token，在一次 target forward 中验证全部 K 个 |
| Acceptance rate alpha | “spec accept rate” | draft Token 被 target 接受的比例；唯一重要的 metric |
| Draft length K | “spec k” | 每次 target forward 中 draft 提出的 Token 数；典型值 4-8 |
| Verify overhead epsilon | “spec overhead” | verify-and-reroll 相比普通 target forward 的额外成本；随 batch 增长 |
| EAGLE-3 | “latest EAGLE” | 2025-2026 变体；在多个 target layers 上训练 draft head；通用聊天上 alpha 0.6-0.8 |
| `speculative_config` | “vLLM spec config” | vLLM V1 中显式 opt-in；没有默认值就没有加速 |
| N-gram spec decode | “N-gram draft” | 使用 prompt 中 N-gram lookups 的 GPU-side draft；兼容 chunked-prefill |
| Break-even alpha | “no-op alpha” | spec decode 提供零加速时的 alpha；在生产并发下关注它 |
| Rejected-draft two-pass | “reroll cost” | drafts 被拒绝时发生两次 target forward；推高 P99 tail |

## 延伸阅读

- [vLLM — Speculative Decoding docs](https://docs.vllm.ai/en/latest/features/spec_decode/) — `speculative_config` 和 V1 中 chunked-prefill 兼容性的权威来源。
- [vLLM Speculative Config API](https://docs.vllm.ai/en/latest/api/vllm/config/speculative/) — 精确字段集合。
- [EAGLE paper (arXiv:2401.15077)](https://arxiv.org/abs/2401.15077) — 原始 EAGLE draft-head 表述。
- [EAGLE-2 paper (arXiv:2406.16858)](https://arxiv.org/abs/2406.16858) — adaptive drafts 和 trees。
- [UC Berkeley EECS-2025-224](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2025/EECS-2025-224.html) — 使用 speculative decoding 的高效 LLM system。
- [BentoML — Speculative Decoding](https://bentoml.com/llm/inference-optimization/speculative-decoding) — 生产 rollout checklist。
