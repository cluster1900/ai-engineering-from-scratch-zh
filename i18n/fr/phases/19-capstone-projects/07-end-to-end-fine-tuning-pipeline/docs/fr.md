# Capstone 07  端到端 Fine-Tuning Pipeline(Données à SFT à DPO à Serve)

> Un modèle 8B basé sur votre propre entraînement de données, basé sur vos propres préférences pour terminer DPO pour Z, terminer la quantification, décoder spéculatif, et avec des jetons de 1 million de dollars mesurables 成本提供服务.

**Type:** Capstone
**Languages:** Python (pipeline), YAML (configs), Bash (scripts)
**先修要求：**La phase 2 (ML), la phase 3 (DL), la phase 7 (transformateur), la phase 10 (LLM à partir de zéro), la phase 11 (ingénierie LLM), la phase 17 (infrastructure), la phase 18 (sécurité)
**Phases exercised:**P2 · P3 · P7 · P10 · P11 · P17 · P18
**Time:** 35 小时

##  problématique
En 2026, chaque équipe d'IA sérieuse sera toujours prête à un pipeline de réglage de la fine-tuning. Non pas parce qu'ils doivent publier un modèle de base frontalier, mais parce que la mise en œuvre de la base de base de la base de l'IA est en train de se faire.

Vous allez mettre une base 8B(Llama 3.3、Qwen3 ou Gemma 3) dans les données spécifiques à la tâche 上依次完成 SFT 和 DPO, puis pour servir faire la quantification,并使用 lm-évaluation-harness、RewardBench-2、MT-Bench-v2 和 MMLU-Pro 衡量升级──you allez basé 2026 Model Openness Framework 产出一个模型卡──重点是可复现性:出端命令到端重跑整条管道──

## 概念
Ce pipeline a cinq étapes.**Data**:dedup(MinHash / Datatrove) ‧filtre de qualité(Nemotron-CC 风格) ‧PII scrub、 contrôle de l'hygiène partagée de la contamination par les indices de référence publics―**SFT**Le modèle de ZERO 3 est le modèle de ZERO 3 et le modèle de ZERO 3 est le modèle de ZERO 3 et le modèle de ZERO 3 est le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO 3 et le modèle de ZERO.**DPO or GRPO**:TRL configuration ∞1 époque ∞pares de préférences peuvent provenir d'étiquettes artificielles ou de réglages bêta jugés par le modèle ∞**Quantize**:GPTQ + AWQ + GGUF, garantie de la flexibilité du déploiement**Serve**:vLLM 0.7 + EAGLE-3 tête spéculative(ou SGLang + SpecForge) 、K8s déploiement、 basé sur la HPA de l'attente en file d'attente。

Les échanges sont livrés: dans trois indicateurs de référence spécifiques à la tâche 上比较 SFT-only、SFT+DPO、SFT+GRPO。Métriques de service:batch 1 / 8 / 32 下的代币/s、EAGLE-3 acceptation rate、$/1M de dépôts。Evaluation de sécurité:Llama Guard 4 pass rate。Model card:évaluation biaisée、séments de reproductibilité、licence de données。

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

## 技术
- Données: Datatrove pour déduire, Nomotron-CC classifiateur pour la qualité, Presidio pour les PII
- Base: Llama 3.3 8B、Qwen3 14B ou Gemma 3 12B
- SFT: Axolotl v0.8, avec ZeRO-3 ✓ Attention flash 3 ✓ séquences emballées
- TRL 0.15 utilise pour le DPO ou le GRPO; Unsloth utilise pour l'itération à GPU unique
- Quantification: GPTQ (Marlin) 、AWQ、 par llama.cpp 生成 GGUF
- Servant: vLLM 0,7 + décoding spéculatif EAGLE-3
- Eval: lm-évaluation-exploitation  Récompense-banque-2  MT-banque-v2  MMLU-Pro
- Évaluation de la sécurité: Garde de la lame 4  ShieldGemma-2
- Infrastructure: Kubernetes + NVIDIA plugin de périphérique, basé sur la métrique d'attente de file d'attente
- Observabilité: W&B pour l'entraînement, Langfuse pour l'inférence


```figure
ce-finetune-stages
```

## - Je le construis.
1. **Data pipeline.**Dans le corpus brut, il est utilisé pour la production de données.

2. **Contamination check.**Pour chaque fraction de validation, calculer son rapport avec les ensembles de test MMLU-Pro、MT-Bench-v2、RewardBench-2 MinHash── refuser toute superposition──

3. **Axolotl SFT.**YAML contient ZeRO-3、FA3、emballage de séquences。 utiliser 8xH100  entraînement 2-3 époques。 enregistré jusqu'à W&B。

4. **TRL DPO / GRPO.**取 SFT checkpoint, dans les paires de préférences 上运行一个时代的DPO(或在数学/代码上使用可验证奖励的GRPO) 』扫描beta。

5. **Quantize.**生成三种量子:GPTQ-INT4-Marlin、AWQ-INT4、面向 llama.cpp 的 GGUF-Q4_K_M──enregistrement taille 和 débit nominal──

6. **Serve with speculative decoding.**VLLM 0.7 configuration, utilisant par le biais de Red Hat Speculators  entraînement EAGLE-3 ébauches de têtes  mesure lot 1 / 8 / 32  taux d'acceptation et latence de queue  rapport avec Anthropic / OpenAI  évaluation similaire de $ / 1M jetons  comparaison 

7. **Eval matrix.**Dans le même temps, le système de gestion des données est également utilisé pour les données de référence.

8. **Safety eval.**Dans le jeu de développement, le taux de réussite de Llama Guard 4 est fixé à l'échelle du système.

9. **Model card.**MOF 2026 modèle: données, formation, évolution, sécurité, licence, ainsi que contenant la section de reproductibilité des YAML et des SHA engagés

## Utilisez-le
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

## Je le livre.
`outputs/skill-finetuning-pipeline.md`描述交付物──一命令完成数据到 SFT到 DPO到 quant到服务到 eval的全流程,并输出模型卡+已服务的终点──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Eval delta vs base | 在目标任务上的 measured gain（MMLU-Pro、MT-Bench-v2、task-specific） |
| 20 | Pipeline reproducibility | 一个命令用相同 seeds 端到端重跑 |
| 20 | Data hygiene | Dedup rate、PII scrub coverage、contamination check green |
| 20 | Serving efficiency | bs=1/8/32 下的 tokens/s、EAGLE-3 acceptance rate、$/1M tokens |
| 15 | Model card + safety eval | 2026 MOF completeness + Llama Guard 4 pass rate |
| **100** | | |

## 练习
1. Dans le même benchmark spécifique à la tâche, il est possible de calculer les taux de référence de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur.

2. Pour le modèle Llama 3.3 8B  remplacement pour Qwen3 14B ⋅ en correspondance avec la qualité des jetons $/1M ⋅

3. ∆ mesure des données de domaine avec le taux d'acceptation EAGLE-3 générique ShareGPT ∞.

4. Résumé: Résultats de la formation sur la mise en œuvre de la méthode de formation de base de l'AMLU-Pro

5. 添加 LoRA SFT, comme alternative à la mise à jour complète.

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
- [Axolotl documentation](https://axolotl-ai-cloud.github.io/axolotl/) 参考 formateur de la SFT / DPO
- [TRL documentation](https://huggingface.co/docs/trl) DPO et GRPO                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
- [Unsloth](https://github.com/unslothai/unsloth) Iteration à GPU unique 参考
- [DeepSeek R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) GRPO 方法
- [vLLM + EAGLE-3 documentation](https://docs.vllm.ai) 参考 pile de service
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge)  Un autre formateur de décoding spéculatif
- [Model Openness Framework 2026](https://isocpp.org/) libération ouverte 评分标准
- [lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness) coureur d'évaluation canonique
