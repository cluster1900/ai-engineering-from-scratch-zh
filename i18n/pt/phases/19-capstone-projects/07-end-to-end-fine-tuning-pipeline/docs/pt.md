# Capstone 07  端到端 Fine-Tuning Pipeline ((Data até SFT até DPO até Serve)

> Um modelo de nível 8B baseado em seu próprio treinamento de dados, baseado em suas próprias preferências para completar DPO para齐, completar quantização ̊ descodificação especulativa,并以可衡量的 $/1M tokens 成本提供服务. Em 2026 ano, a pilha aberta é Axolotl v0.8、TRL 0.15、 para usar na geração anterior Unsloth、 para quantização GPTQ/AWQ/GGUF, bem como para servir vLLM 0.7 + EAGLE-3.

**Type:** Capstone
**Languages:** Python (pipeline), YAML (configs), Bash (scripts)
**先修要求：**Fase 2 (ML), Fase 3 (DL), Fase 7 (Transformador), Fase 10 (LLM a partir do zero), Fase 11 (engenharia LLM), Fase 17 (infraestrutura), Fase 18 (segurança)
**Phases exercised:**P2 · P3 · P7 · P10 · P11 · P17 · P18
**Time:** 35 小时

## 问题
Em 2026, cada equipe de IA rigorosa estará sempre pronta para um pipeline de ajuste fino. Não porque eles publiquem um modelo base de fronteira, mas porque o domínio SFT seja adaptado, é o caso de DPO direcionado a marcas preferentes, para decodificação especulativa, e usar a versão EAGLE-3, apenas onde se pode medir o lucro realmente surgiu.

Você vai colocar uma base de 8B a 14B ((Llama 3.1 8B、Qwen3 14B ou Gemma 3 12B) em dados específicos de tarefa 上依次完成 SFT 和 DPO, em seguida, para servir fazer quantização,并使用lm-evaluation-harness、RewardBench-2、MT-Bench-v2 和 MMLU-Pro 衡量升级── você vai produzir um modelo de cartão de trabalho em base ao 2026 Model Openness Framework──重点是可复现性:一命令到端重跑整条管道──

## 概念
Este gasoduto tem cinco etapas.**Data**A Comissão Europeia, em nome da Comissão, propõe que a Comissão adopte um novo regulamento que estabelece as regras de segurança para os consumidores.**SFT**Axiolotl YAML、8xH100 上的ZERO-3、cosine schedule、packed sequences、2-3 épocas──**DPO or GRPO**:TRL configuração ∞1 época ∞ pares de preferências podem ser provenientes de etiquetado artificial ou de modelagem ∞beta sintonização ∞**Quantize**:GPTQ + AWQ + GGUF, garantia de flexibilidade de implantação。**Serve**:vLLM 0,7 + EAGLE-3 cabeças especulativas(or SGLang + SpecForge)、K8s implantação、 baseada em HPA de espera na fila。

Ablations are交付物:在三个任务特定基准上比较 SFT-only、SFT+DPO、SFT+GRPO。Serving metrics:batch 1 / 8 / 32 下的代币/s、EAGLE-3 acceptance rate、$/1M tokens。Safety eval:Llama Guard 4 pass rate──Model card:bias evaluations、reproducibility seeds、data licensing──

## Arquitetura
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
- Dados: Datatrove para dedup, Nemotron-CC classificador para qualidade, Presidio para PII
- Base: Llama 3.1 8B、Qwen3 14B ou Gemma 3 12B
- SFT: Axolotl v0.8, com ZERO-3 ✓ Flash Attention 3 ✓ sequências embaladas
- Preferência de sintonização: TRL 0,15 Utilizado para DPO ou GRPO; Unsloth Utilizado para iteração de GPU único
- Quantização: GPTQ (Marlin) 、AWQ、 através de llama.cpp 生成 GGUF
- Servindo: vLLM 0,7 + EAGLE-3 descodificação especulativa (((ou SGLang 0,4 + SpecForge)
- Eval: Im-avaliação-aplicativo  RewardBench-2  MT-Bench-v2  MMLU-Pro
- Avaliação de segurança: Llama Guard 4 ∙ ShieldGemma-2
- Infraestrutura: Kubernetes + NVIDIA dispositivo plugin, baseado em HPA de fila de espera métrica
- Observabilidade: W&B para treinamento, Langfuse para inferência


```figure
ce-finetune-stages
```

## Construí-lo
1. **Data pipeline.**Em corpus bruto 上运行 Datatrove dedupção。 aplicar Nemotron-CC 风格 qualidade classificador。Presidio 清理 PII。使用明确种子 写出火车/val split。

2. **Contamination check.**Para cada divisão de validação, calcula-se com os conjuntos de testes MMLU-Pro、MT-Bench-v2、RewardBench-2 MinHash── rejeitar qualquer sobreposição─

3. **Axolotl SFT.**YAML contém ZeRO-3、FA3、pacotamento de sequência。 utilizando 8xH100  treinar 2-3 épocas。

4. **TRL DPO / GRPO.**取 SFT checkpoint,在偏好对上运行一个时代的DPO(或在数学/代码上使用可验证奖励的GRPO) 』扫描beta──

5. **Quantize.**生成三种量子:GPTQ-INT4-Marlin、AWQ-INT4、面向 llama.cpp 的 GGUF-Q4_K_M──记录大小 和名字吞吐量──

6. **Serve with speculative decoding.**VLLM 0.7 configuração, usando através de Red Hat Speculators  treinamento EAGLE-3 cabeças de projeto  Messação lote 1 / 8 / 32  Taxa de aceitação 和 queil latency  relatório com Anthropic / OpenAI  avaliação igual  $/1M tokens  comparação

7. **Eval matrix.**Em base, apenas SFT, SFT+DPO, SFT+GRPO, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D

8. **Safety eval.**Em conjunto desenvolvido, a taxa de passagem de Llama Guard 4 foi aumentada.

9. **Model card.**MOF 2026 modelo: dados, formação, avaliação, segurança, licença, bem como contenção de YAML e comit SHAs seção de reprodução:

## Use-o
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

## Entrega-o
`outputs/skill-finetuning-pipeline.md`描述交付物──一个命令完成数据到 SFT到 DPO到 quant 到 serve到 eval 的全流程,并输出模型卡 + 已服务的终点──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Eval delta vs base | 在目标任务上的 measured gain（MMLU-Pro、MT-Bench-v2、task-specific） |
| 20 | Pipeline reproducibility | 一个命令用相同 seeds 端到端重跑 |
| 20 | Data hygiene | Dedup rate、PII scrub coverage、contamination check green |
| 20 | Serving efficiency | bs=1/8/32 下的 tokens/s、EAGLE-3 acceptance rate、$/1M tokens |
| 15 | Model card + safety eval | 2026 MOF completeness + Llama Guard 4 pass rate |
| **100** | | |

## 练习
1. Em um mesmo índice de referência específico de tarefa, é possível obter informações sobre o método de preferência 胜出,以及领先多少──

2. Llama 3.1 8B  substituir por Qwen3 14B ⋅ em conformidade

3. ∆o mensuração dos dados de domínio com a taxa de aceitação da EAGLE-3 da ShareGPT geral  ∆o relatório diferencial, bem como o que significa para os orçamentos de latência

4. Introdução a 1% de contaminação (→ MMLU-Pro respostas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               

5. Adicionar LoRA SFT, como alternativa de sintonia completa.

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
- [Axolotl documentation](https://axolotl-ai-cloud.github.io/axolotl/) 参考 treinador SFT / DPO
- [TRL documentation](https://huggingface.co/docs/trl) DPO e GRPO    Referência à realização
- [Unsloth](https://github.com/unslothai/unsloth) Iteração de um único GPU 参考
- [DeepSeek R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) GRPO 方法
- [vLLM + EAGLE-3 documentation](https://docs.vllm.ai) 参考 estaca de servir
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge)  outro treinador de descodificação especulativa
- [Model Openness Framework (arXiv:2403.13784)](https://arxiv.org/abs/2403.13784): liberação aberta 评分标准
- [lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness) canônico avaliador runner
