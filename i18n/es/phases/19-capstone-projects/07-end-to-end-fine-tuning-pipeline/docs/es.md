# Capstone 07  端到端 Fine-Tuning Pipeline(Data hasta SFT hasta DPO hasta Serve)

> Un modelo 8B basado en su propio entrenamiento de datos, basado en sus propias preferencias para completar DPO en conjunto, completar la cuantificación ‒descodación especulativa, y con un tamaño medible de $/1M tokens 成本提供服务. La pila abierta del año 2026 es Axolotl v0.8、TRL 0.15、 para la generación de Unsloth ‒ para la cuantificación ‒ GPTQ/AWQ/GGUF, así como para el servicio de vLLM 0.7 + EAGLE-3.

**Type:** Capstone
**Languages:** Python (pipeline), YAML (configs), Bash (scripts)
**先修要求：**Fase 2 (ML), Fase 3 (DL), Fase 7 (Transformador), Fase 10 (LLM desde cero), Fase 11 (ingeniería de LLM), Fase 17 (infraestructura), Fase 18 (seguridad)
**Phases exercised:**P2 · P3 · P7 · P10 · P11 · P17 · P18
**Time:** 35 小时

##  problemas
En 2026, cada equipo de IA se preparará a cualquier momento para un proceso de ajuste fino. No es porque publiquen un modelo base fronterizo, sino porque se adapte, es decir, el dominio SFT, DPO dirigido a etiquetas preferentes, y los proyectos destilados de descifrado especulativo para el uso de EAGLE-3, sólo es donde se puede medir el beneficio real.

Usted pondrá una base 8B(Llama 3.3、Qwen3 o Gemma 3) en datos específicos de tareas 上依次完成 SFT 和 DPO, posteriormente servir para hacer cuantización,并使用lm-evaluation-harness、RewardBench-2、MT-Bench-v2 和 MMLU-Pro 衡升级── usted pondrá en función del Marco de apertura del modelo 2026 产出一个模型卡──重点是可复现性:出端命令到端重跑整条管道──

## 概念
Este oleoducto tiene cinco etapas.**Data**El análisis de la calidad de los datos de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información.**SFT**:Axolotl YAML、8xH100 上的 ZeRO-3、cosin schedule、packed sequences、2-3 épocas。**DPO or GRPO**:TRL configuración ∞1 época ∞ pares de preferencias pueden provenir de etiquetado artificial o de modelo-juzgado ∞beta sintonización ∞**Quantize**:GPTQ + AWQ + GGUF,保证 flexibilidad de despliegue―**Serve**:vLLM 0.7 + EAGLE-3 cabezas especulativas(o SGLang + SpecForge) 、K8s despliegue、 basado en HPA de espera en cola―

Ablaciones are交付物:在三个 puntos de referencia específicos de tareas 上比较 SFT-only、SFT+DPO、SFT+GRPO。Métricas de servicio:batch 1 / 8 / 32 下的 tokens/s、EAGLE-3 tasa de aceptación、$/1M tokens。Evaluación de seguridad:Llama Guard 4 tasa de aprobación。Modelo de tarjeta:valuaciones de sesgos、semillas de reproductibilidad、licencia de datos。

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
- Datatroves para dedup, clasificadores de Nemotron-CC para calidad, Presidio para PII
- Base: Llama 3.3 8B、Qwen3 14B o Gemma 3 12B
- SFT: Axolotl v0.8, junto con ZeRO-3 ✓ Flash Attention 3 ✓ secuencias empaquetadas
- La configuración de preferencia: TRL 0.15 Usado para DPO o GRPO; Unsloth Usado para iteración de GPU única
- Cuantización: GPTQ (Marlin) 、AWQ、 a través de llama.cpp 生成 GGUF
- Servir: vLLM 0.7 + EAGLE-3 decodificación especulativa
- Evaluación: Im-evaluación-harness  RewardBench-2  MT-Bench-v2  MMLU-Pro
- Evaluación de seguridad: Llama Guard 4 ∙ ShieldGemma-2
- Infraestructura: Kubernetes + NVIDIA dispositivo de complemento, basado en la métrica de espera en fila de HPA
- Observabilidad: W&B para entrenamiento, Langfuse para inferencia


```figure
ce-finetune-stages
```

## Construirlo
1. **Data pipeline.**En el corpus bruto 上运行 Datatrove dedup。应用 Nemotron-CC 风格 calidad clasificador。Presidio 清理 PII。使用明确种子 写出火车/val split。

2. **Contamination check.**Para cada división de validación, calcular su relación con los conjuntos de pruebas de MMLU-Pro、MT-Bench-v2、RewardBench-2 de MinHash── rechazar cualquier superposición─

3. **Axolotl SFT.**YAML incluye ZeRO-3、FA3、emballaje de secuencias。 utiliza 8xH100  entrenamiento 2-3 épocas。 registro hasta W&B。

4. **TRL DPO / GRPO.**取 SFT checkpoint, en pares de preferencias 上运行一个时代的 DPO(或在数学/código 上使用可验证奖励的 GRPO) 』扫描beta。

5. **Quantize.**生成三种量子:GPTQ-INT4-Marlin、AWQ-INT4、面向 llama.cpp de GGUF-Q4_K_M── tamaño de registro 和 rendimiento nominal──

6. **Serve with speculative decoding.**vLLM 0.7 configuración, usando a través de Red Hat Speculators  entrenamiento EAGLE-3 cabezas de proyecto  Método de lote 1 / 8 / 32  Taxa de aceptación y latencia de cola  Report con Anthropic / OpenAI  evaluación de $/1M tokens  comparación

7. **Eval matrix.**En la base, sólo SFT, SFT+DPO, SFT+GRPO, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D, R&D

8. **Safety eval.**En el conjunto de desarrollo, la tasa de paso de Llama Guard 4 se calcula.

9. **Model card.**Modelo MOF 2026:Datos, formación, evaluación, seguridad, licencia, así como la sección de reproductibilidad de las YAML y las SHAs comprometidas.

## Usalo
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

##  entregarlo
`outputs/skill-finetuning-pipeline.md`描述交付物──一个命令完成数据到 SFT到 DPO到 quant到服务到 eval的全流程,并输出模型卡+已服务的终点──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Eval delta vs base | 在目标任务上的 measured gain（MMLU-Pro、MT-Bench-v2、task-specific） |
| 20 | Pipeline reproducibility | 一个命令用相同 seeds 端到端重跑 |
| 20 | Data hygiene | Dedup rate、PII scrub coverage、contamination check green |
| 20 | Serving efficiency | bs=1/8/32 下的 tokens/s、EAGLE-3 acceptance rate、$/1M tokens |
| 15 | Model card + safety eval | 2026 MOF completeness + Llama Guard 4 pass rate |
| **100** | | |

##  ejercicios
1. En el mismo índice de referencia específico de tarea, se ejecuta SFT+DPO、SFT+GRPO── informe qué método de preferencia 胜出,以及领先多少──

2. Para poner en marcha el nuevo modelo de la Llama 3,8B, se sustituye por el Qwen3,14B.

3.  Medir los datos de dominio con la tasa de aceptación de EAGLE-3 de ShareGPT superior genérico                                                                                                                                                                                                                                                  

4. Inserir 1% de contaminación (¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡

5. Añadir LoRA SFT, como un reemplazo de la sintonía completa.

## 关键术语: "El hombre es un hombre"
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
- [Axolotl documentation](https://axolotl-ai-cloud.github.io/axolotl/) 参考 Entrenador de FFT / DPO
- [TRL documentation](https://huggingface.co/docs/trl) DPO y GRPO  Referencia a la realización
- [Unsloth](https://github.com/unslothai/unsloth) Iteración de un solo GPU 参考
- [DeepSeek R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) GRPO 方法
- [vLLM + EAGLE-3 documentation](https://docs.vllm.ai) 参考 pila de servicio
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge)  otro tipo de entrenador de decodificación especulativa
- [Model Openness Framework 2026](https://isocpp.org/) liberación abierta 评分标准
- [lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness) ejecutor de evaluación canónica
