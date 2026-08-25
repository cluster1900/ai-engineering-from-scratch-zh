# Capstone 07 — 端到端 Fine-Tuning Pipeline（Data 到 SFT 到 DPO 到 Serve）

> 一个基于你自己的数据训练的 8B model，基于你自己的偏好完成 DPO 对齐，完成 quantization、speculative decoding，并以可衡量的 $/1M tokens 成本提供服务。2026 年的 open stack 是 Axolotl v0.8、TRL 0.15、用于迭代的 Unsloth、用于 quantization 的 GPTQ/AWQ/GGUF，以及用于 serving 的 vLLM 0.7 + EAGLE-3。这个 capstone 的目标是可复现地跑完整条 pipeline：输入 YAML，输出已服务的 endpoint，并在 2026 Model Openness Framework 下发布 model card。

**Type:** Capstone
**Languages:** Python (pipeline), YAML (configs), Bash (scripts)
**先修要求：** Phase 2 (ML), Phase 3 (DL), Phase 7 (Transformer), Phase 10 (LLMs from scratch), Phase 11 (LLM engineering), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:** P2 · P3 · P7 · P10 · P11 · P17 · P18
**Time:** 35 小时

## 问题
2026 年，每个严肃的 AI 团队都会随时备好一条 fine-tuning pipeline。不是因为他们要发布 frontier base model，而是因为下游适配，也就是 domain SFT、针对标注偏好的 DPO、用于 speculative decoding 的 distilled drafts、以及使用 EAGLE-3 的 serving，才是可衡量收益真正出现的地方。Axolotl v0.8 处理 multi-GPU SFT configs。TRL 0.15 处理 DPO 和 GRPO。Unsloth 让你能快速做 single-GPU iteration。vLLM 0.7 + EAGLE-3 在不损失质量的情况下将 decode throughput 提升 2-3x。工具已经可用；真正的技艺在 YAML、data hygiene 和 eval 纪律里。

你将把一个 8B base（Llama 3.3、Qwen3 或 Gemma 3）在 task-specific data 上依次完成 SFT 和 DPO，随后为 serving 做 quantization，并使用 lm-evaluation-harness、RewardBench-2、MT-Bench-v2 和 MMLU-Pro 衡量提升。你将根据 2026 Model Openness Framework 产出一份 model card。重点是可复现性：一个命令端到端重跑整条 pipeline。

## 概念
这条 pipeline 有五个阶段。**Data**：dedup（MinHash / Datatrove）、quality filter（Nemotron-CC 风格 classifier）、PII scrub、针对 public benchmark contamination 的 split-hygiene check。**SFT**：Axolotl YAML、8xH100 上的 ZeRO-3、cosine schedule、packed sequences、2-3 epochs。**DPO or GRPO**：TRL config、1 epoch、preference pairs 可以来自人工标注或 model-judged、beta tuning。**Quantize**：GPTQ + AWQ + GGUF，保证 deployment flexibility。**Serve**：vLLM 0.7 + EAGLE-3 speculative heads（或 SGLang + SpecForge）、K8s deployment、基于 queue-wait 的 HPA。

Ablations 是交付物：在三个 task-specific benchmarks 上比较 SFT-only、SFT+DPO、SFT+GRPO。Serving metrics：batch 1 / 8 / 32 下的 tokens/s、EAGLE-3 acceptance rate、$/1M tokens。Safety eval：Llama Guard 4 pass rate。Model card：bias evaluations、reproducibility seeds、data licensing。

## 架构
```
raw data (HF datasets + internal)
    |
    v
Datatrove dedup + Nemotron-CC quality filter + PII scrub
    |
    v
split hygiene (MMLU-Pro contamination check)
    |
    v
Axolotl SFT config (YAML)  ---> 8xH100, ZeRO-3
    |
    v
TRL DPO / GRPO config       ---> 4xH100, 1 epoch
    |
    v
GPTQ + AWQ + GGUF quantize
    |
    v
vLLM 0.7 + EAGLE-3 speculative decoding
    |
    v
K8s deployment, HPA on queue-wait
    |
    v
lm-eval-harness + RewardBench-2 + MT-Bench-v2 + MMLU-Pro
    |
    v
model card (2026 MOF) + safety eval (Llama Guard 4)
```

## 技术栈
- Data: Datatrove 用于 dedup，Nemotron-CC classifier 用于 quality，Presidio 用于 PII
- Base: Llama 3.3 8B、Qwen3 14B 或 Gemma 3 12B
- SFT: Axolotl v0.8，配合 ZeRO-3、Flash Attention 3、packed sequences
- Preference tuning: TRL 0.15 用于 DPO 或 GRPO；Unsloth 用于 single-GPU iteration
- Quantization: GPTQ (Marlin)、AWQ、通过 llama.cpp 生成 GGUF
- Serving：vLLM 0.7 + EAGLE-3 speculative decoding（或 SGLang 0.4 + SpecForge）
- Eval: lm-evaluation-harness、RewardBench-2、MT-Bench-v2、MMLU-Pro
- Safety eval: Llama Guard 4、ShieldGemma-2
- Infrastructure: Kubernetes + NVIDIA device plugin，基于 queue-wait metric 的 HPA
- Observability: W&B 用于 training，Langfuse 用于 inference

```figure
ce-finetune-stages
```

## 构建它
1. **Data pipeline.** 在 raw corpus 上运行 Datatrove dedup。应用 Nemotron-CC 风格 quality classifier。Presidio 清理 PII。使用明确 seed 写出 train/val splits。

2. **Contamination check.** 对每个 validation split，计算其与 MMLU-Pro、MT-Bench-v2、RewardBench-2 test sets 的 MinHash。拒绝任何 overlap。

3. **Axolotl SFT.** YAML 包含 ZeRO-3、FA3、sequence packing。使用 8xH100 训练 2-3 epochs。记录到 W&B。

4. **TRL DPO / GRPO.** 取 SFT checkpoint，在 preference pairs 上运行一个 epoch 的 DPO（或在 math/code 上使用可验证 reward 的 GRPO）。扫描 beta。

5. **Quantize.** 生成三种 quants：GPTQ-INT4-Marlin、AWQ-INT4、面向 llama.cpp 的 GGUF-Q4_K_M。记录 size 和 nominal throughput。

6. **Serve with speculative decoding.** vLLM 0.7 config，使用通过 Red Hat Speculators 训练的 EAGLE-3 draft heads。测量 batch 1 / 8 / 32 下的 acceptance rate 和 tail latency。报告与 Anthropic / OpenAI 在同一 eval 上的 $/1M tokens 对比。

7. **Eval matrix.** 在 base、SFT-only、SFT+DPO、SFT+GRPO 上运行 lm-eval-harness、RewardBench-2、MT-Bench-v2、MMLU-Pro。产出一张表。

8. **Safety eval.** 在 dev set 上统计 Llama Guard 4 pass rate。使用 ShieldGemma-2 output filter。

9. **Model card.** MOF 2026 template：data、training、eval、safety、license，以及包含 YAML 和 commit SHAs 的 reproducibility section。

## 使用它
```
$ ./pipeline.sh config/llama3.3-8b-domainX.yaml
[data]    300k deduped, 12k filtered, 280k accepted (seed=7)
[SFT]     3 epochs, 8xH100, 6h12m, val loss 1.42 -> 1.03
[DPO]     1 epoch, beta=0.08, 4xH100, 1h40m
[quant]   GPTQ-INT4 4.6 GB, AWQ-INT4 4.8 GB, GGUF-Q4_K_M 5.1 GB
[serve]   vLLM 0.7, EAGLE-3 acceptance 0.74, p99 126ms @ bs=8
[eval]    MMLU-Pro +3.2, MT-Bench-v2 +0.41, RewardBench-2 +0.08
[card]    model-card.md generated under 2026 MOF
```

## 交付它
`outputs/skill-finetuning-pipeline.md` 描述交付物。一个命令完成 data 到 SFT 到 DPO 到 quant 到 serve 到 eval 的全流程，并输出 model card + 已服务的 endpoint。

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Eval delta vs base | 在目标任务上的 measured gain（MMLU-Pro、MT-Bench-v2、task-specific） |
| 20 | Pipeline reproducibility | 一个命令用相同 seeds 端到端重跑 |
| 20 | Data hygiene | Dedup rate、PII scrub coverage、contamination check green |
| 20 | Serving efficiency | bs=1/8/32 下的 tokens/s、EAGLE-3 acceptance rate、$/1M tokens |
| 15 | Model card + safety eval | 2026 MOF completeness + Llama Guard 4 pass rate |
| **100** | | |

## 练习
1. 在同一个 task-specific benchmark 上运行 SFT-only、SFT+DPO、SFT+GRPO。报告哪种 preference method 胜出，以及领先多少。

2. 将 Llama 3.3 8B 替换为 Qwen3 14B。在匹配质量下测量 $/1M tokens。

3. 测量 domain data 与 generic ShareGPT 上的 EAGLE-3 acceptance rate。报告差值，以及它对 latency budgets 意味着什么。

4. 注入 1% contamination（把 MMLU-Pro answers 泄漏进 training data）并重跑 eval。观察 MMLU-Pro accuracy 不真实地跃升。构建一个能捕获此问题的 contamination-check CI gate。

5. 添加 LoRA SFT，作为 full fine-tune 的替代方案。测量在 memory 降低 10x 时的 quality gap。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Axolotl | "SFT trainer" | 由 YAML 驱动的统一 trainer，用于 SFT、DPO 和 distillation |
| TRL | "Preference tuner" | Hugging Face library，用于 LLMs 上的 DPO、GRPO、PPO |
| GRPO | "Group-relative policy optimization" | DeepSeek R1 的 RL recipe，使用可验证 rewards |
| EAGLE-3 | "Speculative decoding draft" | 可提前预测 N 个 tokens 的 draft heads；vLLM 使用 target model 验证 |
| MOF | "Model Openness Framework" | 2026 年用于按 data、code、license 对 model releases 评分的标准 |
| Contamination check | "Split hygiene" | 基于 MinHash 检测 test-set 泄漏进 training |
| Acceptance rate | "EAGLE / MTP metric" | target model 接受 drafted tokens 的比例 |

## 延伸阅读
- [Axolotl documentation](https://axolotl-ai-cloud.github.io/axolotl/) — 参考 SFT / DPO trainer
- [TRL documentation](https://huggingface.co/docs/trl) — DPO 和 GRPO 参考实现
- [Unsloth](https://github.com/unslothai/unsloth) — single-GPU iteration 参考
- [DeepSeek R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) — GRPO 方法
- [vLLM + EAGLE-3 documentation](https://docs.vllm.ai) — 参考 serving stack
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge) — 另一种 speculative-decoding trainer
- [Model Openness Framework 2026](https://isocpp.org/) — open-release 评分标准
- [lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness) — canonical eval runner
