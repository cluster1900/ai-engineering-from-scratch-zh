---
name: finetuning-pipeline
description: 运行一条可复现的 data-to-SFT-to-DPO-to-serve fine-tuning pipeline，包含 ablations、quantization，以及一份 2026 Model Openness Framework model card。
version: 1.0.0
phase: 19
lesson: 07
tags: [capstone, fine-tuning, axolotl, trl, dpo, grpo, vllm, eagle-3, mof]
---

给定一个 base model（Llama 3.3 8B、Qwen3 14B 或 Gemma 3 12B）和一个 task-specific dataset，构建一条单命令 pipeline，产出一个已服务的 endpoint 和一份可复现的 model card。

Build plan:

1. Data stage: Datatrove dedup、Nemotron-CC-style quality filter、Presidio PII scrub、带 seed 的 train/val splits。
2. Contamination check: 使用 MinHashLSH 对照 MMLU-Pro、MT-Bench-v2、RewardBench-2。发现 overlap 即拒绝。
3. SFT: Axolotl v0.8，配合 ZeRO-3、Flash Attention 3、packed sequences，在 8xH100 上训练 2-3 epochs。
4. Preference tuning: TRL 0.15 DPO（或使用 verifiable rewards 的 GRPO），训练 1 epoch，进行 beta sweep。
5. Quantize：GPTQ-INT4-Marlin + AWQ-INT4 + GGUF-Q4_K_M。
6. Serve: vLLM 0.7 + EAGLE-3 speculative decoding（draft heads 通过 Red Hat Speculators 或 SGLang SpecForge）。K8s deployment，HPA 基于 queue-wait。
7. Eval: 在 base/SFT-only/SFT+DPO/SFT+GRPO 上运行 lm-evaluation-harness、RewardBench-2、MT-Bench-v2、MMLU-Pro。
8. Safety: Llama Guard 4 pass rate、ShieldGemma-2 output filter。
9. Model card: 基于 2026 Model Openness Framework，包含 data、training、eval、safety、reproducibility sections。

Assessment rubric:

| Weight | Criterion | Measurement |
|:-:|---|---|
| 25 | Eval delta vs base | MMLU-Pro、MT-Bench-v2、task-specific benchmarks 上的 measured gain |
| 20 | Pipeline reproducibility | 用相同 seeds 单命令重跑，产生匹配 hashes |
| 20 | Data hygiene | Dedup rate、PII scrub coverage、contamination check green |
| 20 | Serving efficiency | batch 1/8/32 下的 tokens/s、EAGLE-3 acceptance、$/1M tokens |
| 15 | Model card + safety eval | 2026 MOF completeness + Llama Guard 4 pass rate |

Hard rejects:

- 跳过 MinHash contamination check 的 pipelines。把 MMLU-Pro 泄漏进 training 是经典的 eval-cheating failure mode。
- 没有附带 seeds 或 YAMLs 的 training runs。Reproducibility 是硬性要求。
- 没有 EAGLE-3 或等价 speculative decoding configuration 的 serving。Baseline tokens/s 不是 2026 年的标准。
- 缺少 safety eval。每个 fine-tune 都必须随附 Llama Guard 4 pass rate。

Refusal rules:

- 如果没有附上 lm-eval-harness commit SHA，拒绝发布声称 benchmark scores 的 model card。
- 如果数据 license 禁止 derivative models，拒绝在这些数据上 fine-tune。MOF 会评估 data licensing。
- 如果没有在 eval matrix 上测量 quality loss，拒绝发布 quantized model。

Output: 一个 repo，包含 pipeline orchestrator、Llama 3.3 8B + 一个 alternate base 的 YAMLs、SFT 和 DPO W&B run logs、quantized artifacts、served endpoint、three-benchmark eval matrix、safety eval、2026 MOF model card，以及一份关于你发现并修复的三个最大 data-hygiene issues 的 write-up。
