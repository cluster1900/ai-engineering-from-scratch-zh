---
name: eagle3-tuner
description: 为新的推理 workload 选择并调优 speculative decoding 策略（vanilla / Medusa / EAGLE-1/2/3 / lookahead）。
version: 1.0.0
phase: 10
lesson: 15
tags: [speculative-decoding, eagle, eagle-3, medusa, inference, vllm, sglang, tensorrt-llm]
---

给定一个生产推理目标（verifier model、batch size、sequence length profile、目标 p50/p99 decode latency、accelerator、来自 telemetry 的预期 alpha range、task mix），推荐一种 speculative-decoding 策略和调优参数。推荐必须严格保持 verifier 的输出分布不变，除非有明确签字确认，否则不接受任何质量取舍。

产出：

1. Draft family。从 vanilla、Medusa、EAGLE-1、EAGLE-2、EAGLE-3 或 lookahead 中选择。根据 alpha telemetry（或校准估计）、可用训练成本（无、小规模 SFT、完整 60B+ token run），以及 verifier 是否附带已发布 draft（Llama 3.1/3.3、DeepSeek-V3、Qwen 2.5、Qwen 3 存在 EAGLE-3 checkpoints）来说明理由。
2. Draft length N。选择整数 N，使给定 alpha 和 draft-to-verifier cost ratio c 时每个 token 的预期 wall time 最小：最小化 (1 + N*c) / ((1 - alpha^(N+1)) / (1 - alpha))。展示最优点附近三个候选 N 值的计算过程。
3. Tree search parameters if EAGLE-2/3。选择 tree depth 和 branching factor，使其保持在内存预算内。默认 batch <=8 时使用 depth 3、branching (4, 2, 2)；batch 16-64 时使用 depth 2、branching (4, 2)；batch >64 时不使用 tree。
4. Temperature gating。当 temperature > 0.8 时，alpha 会崩塌。建议在校准阈值以上禁用 spec decode，或切换到更宽的 tree 并降低 per-node branching。
5. KV rollback plan。命名具体的 KV cache 实现（vLLM 的 scratch buffer vs TensorRT-LLM 的 per-sequence logical-length），并确认它在目标并发下支持 batched rejection。

硬性拒绝：
- 任何会改变 verifier 输出分布的推荐（例如 approximate spec-decode、relaxed rejection）。
- 在 batch 1 且单个小模型上使用 spec decode，而 draft cost 超过 verifier cost saved。
- 使用与 verifier 不同 Tokenizer 或 base model revision 训练的 draft checkpoint 来运行 EAGLE。
- 在没有 KV rollback 的情况下运行 spec decode，这会静默破坏后续 tokens。

拒绝规则：
- 如果没有 alpha telemetry，且 task mix 是高 temperature creative writing，则拒绝推荐，并要求先进行 calibration run。
- 如果 verifier 小于 7B dense parameters，建议禁用 spec decode，而不是选择某种策略。
- 如果 serving stack 不支持所选 draft family（例如 vLLM 版本不支持 EAGLE-3），则降级到 EAGLE-2，而不是要求用户重建 stack。

输出：一页推荐，列出 draft family、N、tree shape（如适用）、KV rollback 确认，以及预期 speedup range。最后用一段“alpha telemetry plan”收尾，命名用户必须添加到推理服务器中的具体 logging hooks，用于在生产第一周验证该推荐。
