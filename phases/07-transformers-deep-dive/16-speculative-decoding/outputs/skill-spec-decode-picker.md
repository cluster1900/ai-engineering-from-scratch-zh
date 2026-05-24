---
name: spec-decode-picker
description: 为新的 LLM inference workload 选择 speculative decoding 策略（vanilla / Medusa / EAGLE / lookahead）和调优参数。
version: 1.0.0
phase: 7
lesson: 16
tags: [inference, decoding, latency, speculative, optimization]
---

# Speculative Decoding 选择器

帮助工程师在 vanilla speculative、Medusa、EAGLE 或 lookahead decoding 之间做选择，并为特定 workload 调优 `N`（draft length）。

## 需要收集的输入

1. **Verifier model** — 产生最终输出的 LLM。规模很重要（draft cost 必须低于 verifier cost 才能带来 speedup）。
2. **Workload type** — code、chat、structured output、summarization。决定 acceptance rate。
3. **Sampling strategy** — greedy、low-T、high-T、beam。High-T sampling 会降低 acceptance。
4. **Hardware target** — memory budget 决定是否能容纳单独的 draft model。
5. **Engineering budget** — Medusa 和 EAGLE 需要 fine-tuning；vanilla 和 lookahead 不需要。
6. **Latency target** — interactive chat（<500ms TTFT，<50ms per token）vs batch（throughput-first）。

## 决策规则

- **快速启动，无需训练**：使用同系列 1B–3B model 作为 vanilla draft。典型为 2×。
- **可以 fine-tune**：使用 verifier hidden states 的 EAGLE-2 或 EAGLE-3。典型为 3–4×。
- **可以 fine-tune 但不能运行两个 models**：Medusa（verifier 上的额外 heads）。2–3×。
- **没有训练预算，也没有可用 draft model**：lookahead decoding。1.3–1.6×。
- **Batch-heavy serving**：continuous batching 更重要；随着 batch 变大，speculative gains 会下降，因为 verifier 已经饱和。
- **High temperature 或 stochastic sampling**：acceptance 会大幅下降。考虑降低 N（2–3）或禁用。
- **Structured output（JSON、code）**：acceptance 高。将 N 推到 7+ 以获得最大 speedup。

## 调优

- **N（draft length）**：从 5 开始。测量 acceptance。如果 α > 0.9，推到 7。如果 α < 0.6，降到 3。
- **Draft temperature**：与 verifier 的 temperature 保持一致。draft sampling 不匹配会损失 α。
- **Tree depth（EAGLE-2 / Medusa）**：3–5 个 branches；更宽的 trees 只有在 α > 0.8 时才有帮助。
- **Draft model size**：选择能达到 α > 0.7 的最小 model。70B verifier 搭配 1B draft 很典型；不要低于 verifier 的 tokenizer / embedding 兼容性要求。

## 始终提示

- 检查 draft 和 verifier 是否共享 tokenizer。不同的 BPE splits 会破坏 speculative guarantees。
- Spec decoding 会与 vLLM 中的 continuous batching 相互影响：当 batch 已经饱和时，per-request speedup 会下降。
- EAGLE 的 hidden-state input 需要 verifier internals；HF APIs 并不总是暴露这些内容。优先使用 vLLM 或 SGLang runtimes。
- Medusa heads 需要在 verifier 自身 outputs 上做 supervised fine-tune。Data-gathering 步骤通常是主要成本。

## 输出格式

返回：

1. **Recommendation** — 一个 strategy name 和 tuning parameters（例如 "EAGLE-2, N=5, tree_depth=4"）。
2. **Expected speedup** — 明确写出 α assumption。
3. **Compatibility checks** — tokenizer match、runtime support、KV cache rollback support。
4. **Fallback plan** — 如果 primary strategy 表现不佳，下一步尝试什么。
5. **Measurement plan** — 如何在 representative sample 上验证 acceptance rate 和 speedup。
