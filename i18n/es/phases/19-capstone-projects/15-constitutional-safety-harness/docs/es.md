# 综合项目 15  Arnés de seguridad constitucional + Red-Team Range

> Los clasificadores constitucionales de Anthropic ̊ Meta ̊ Llama Guard 4̊ Google ̊ ShieldGemma-2̊ NVIDIA ̊ Nemotron 3 Content Safety, así como para uso en X-Guard ̊ Multilingue ̊ cover, definieron conjuntamente la pila de clasificadores de seguridad ̊ garak ̊ PyRIT ̊ NVIDIA Aegis 和 promptfoo ̊ convertirse en la evaluación adversarial estándar  tool¬ NeMo Guardrails v0.12 ̊ los conectará a la tubería de producción ̊ esta piedra angular ̊ conectará todo el contenido: alrededor de la aplicación objetivo ̊ construir un arnés de seguridad en capas ̊, operar ̊ cover ̊ 6+ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ 

**类型：**Capstone
**语言：**Python(pipelina de seguridad、equipo rojo)
**先修要求：**Fase 10 (desde la creación de LLM) Fase 11 (ingeniería de LLM) Fase 13 (herramientas) Fase 14 (agentes) Fase 18 (ética, seguridad, alineamiento)
**涉及阶段：**P10 · P11 · P13 · P14 · P18
**时间：**25 小时

##  problemas

El problema de la seguridad del LLM en 2026 no depende del clasificador, sino de cómo se componen correctamente las aplicaciones de producción, ya que no se rechazan en exceso, ni de qué se caen las faltas.

攻击演化同样重要──PAIR 和 TAP 自动化发现 jailbreak──GCG 运行基于 Gradient的后音攻击──Multi-turn 和 code-switch attacks利用代理记忆──任何已部署的LLM 都需要一个红团队范围,garak 和 PyRIT是正规的驱动程序,并且还需要记录减缓和根据CVSS 评分的发现──

Usted va a consolidar una aplicación objetivo(un modelo 8B de instrucciones, o un chatbot RAG entre otros capstones), para su funcionamiento 6+  атака家族,并产出前/后无害性测量──

## 概念

El conducto de seguridad tiene cinco niveles.**Input sanitize**:移除零宽字符,解码 base64/rot13,规范化 Unicode──**Policy layer**:NeMo Guardrails v0.12 rails ((fuera del dominio、toxicidad、extracción de PII) ⋅**Classifier gate**:输入侧使用Llama Guard 4,非英文使用X-Guard,图像输入使用ShieldGemma-2──**Model**El objetivo del LLM:**Output filter**:输出侧使用Llama Guard 4,Presidio PII scrub, y en适用场景 ejecuting citation enforcement──**HITL tier**: está marcado como un alto riesgo de salida en la cola Slack.

RED-TEAM range 按计划器 运行──PAIR 和 TAP 自主发现 jailbreak──GCG 运行基于 Gradient 的后音攻击──ASCII / base64 / rot13 codificación ataques──Multi-turn attacks(persona adopción、memoria explotación)──Code-switch attacks(混合英语与斯瓦希里或泰语)──每次运行都会产出一个结构化发现文件,包含CVSS得分和披露时间线──

La autocrítica constitucional es una intervención en el tiempo de entrenamiento. Toma 1k 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 

## 架构

```
request (text / image / multilingual)
      |
      v
input sanitize (strip zero-width, decode, normalize)
      |
      v
NeMo Guardrails v0.12 rails (off-domain, policy)
      |
      v
classifier gate:
  Llama Guard 4 (English)
  X-Guard (multilingual, 132 langs)
  ShieldGemma-2 (image prompts)
  Nemotron 3 Content Safety (enterprise)
      |
      v (allowed)
target LLM
      |
      v
output filter: Llama Guard 4 + Presidio PII + citation check
      |
      v
HITL tier for flagged outputs

parallel:
  red-team scheduler
    -> garak (classic attacks)
    -> PyRIT (orchestrated red team)
    -> autonomous jailbreak agent (PAIR + TAP)
    -> GCG suffix attacks
    -> multilingual / code-switch
    -> multi-turn persona adoption

output: CVSS-scored findings + disclosure timeline + before/after harmlessness delta
```

## 技术

- Clasificadores de seguridad:Llama Guard 4 ShieldGemma-2 NVIDIA Nemotron 3 Seguridad del contenido X-Guardia
- Cuadro de vigilancia:NeMo Guardrails v0.12 + OPA
- Los controladores del equipo rojo:garak(NVIDIA) PyRIT(Microsoft Azure) NVIDIA Aegis、promptfoo
- Los agentes de escape de cárcel:PAIR(Chao et al., 2023)
- Formación constitucional: ciclo de autocrítica de estilo antropico + FFT en críticas
- Presidio
- Objetivo: un modelo ajustado a instrucciones de 8B, o un chatbot RAG en otras capstone


```figure
cf-safety-stack
```

## Construirlo

1. **目标设置。**En vLLM arriba iniciar un modelo 8B de instrucciones-ajustado(or repetir con otro chatbot RAG en la piedra angular)

2. **包装 safety pipeline。**周围目标连接五层管道──验证每一层都可单独观测(Langfuse en cada nivel de un espacio)──

3. **Classifier 覆盖。**加载 Llama Guard 4、X-Guard(Multilingüe)、ShieldGemma-2(imagen)──en un conjunto pequeño etiquetado 上运行每个分类器,以建立基线──

4. **Red-team scheduler。**调度 garak、PYRIT、 un agente PAIR、 un agente TAP、 un corredor GCG、 un atacante multi-turn y un atacante de código-switch── cada uno está en una cola individual para su ejecución─

5. **Attack suite。**六个攻击家族:(1) PAIR jailbreak automático,(2) TAP árbol de ataques,(3) GCG gradiente sufijo,(4) ASCII / base64 / rot13 codificación,(5) persona multi-turn,(6) código multilingüe-interruptor── informes de cada familia tasa de éxito──

6. **Constitutional self-critique。**选 1k 个害怕试图提示──对于每一个提示,目标先起草响应──一个批评 LLM 根据书面宪法(无害、引用证据、拒绝非法请求) 评分──批评 提出异议的提示 会被重写;目标在批评-改进对上细调──在进行评估 上测量前/后无害性──

7. **Over-refusal measurement。**En la suite de preguntas benignas (por ejemplo, XSTest) se debe seguir la tasa de falsos positivos.

8. **CVSS scoring。**Para cada jailbreak exitoso, según CVSS 4.0 评分(vector de ataque, complejidad, impacto)  Producción de un calendario de divulgación y un plan de mitigación。

9. **Range automation。**Todo lo que hay en el cron está en marcha; hallazgos: escribir en la cola; alertas de regresión de rechazo

## Usalo

```
$ safety probe --model=target --family=PAIR --budget=50
[attacker]   PAIR agent running on target
[attack]     attempt 1/50: disguise query as academic research ... blocked
[attack]     attempt 2/50: appeal to roleplay ... blocked
[attack]     attempt 3/50: chain-of-thought coax ... SUCCEEDED
[finding]    CVSS 4.8 medium: roleplay bypass on target
[range]      7 successes out of 50 (14% success rate)
```

##  entregarlo

`outputs/skill-safety-harness.md`Es un sistema de seguridad de nivel de producción, además de un rango de equipo rojo, que incluye deltas de inocuidad antes/después.

| 权重 | 标准 | 如何测量 |
|:-:|---|---|
| 25 | Attack-surface coverage | 覆盖 6+ 攻击家族、2+ 种语言 |
| 20 | True-positive / false-positive trade-off | Attack block rate vs XSTest benign pass rate |
| 20 | Self-critique delta | held-out eval 上的 before/after harmlessness |
| 20 | Documentation and disclosure | 带 timeline 的 CVSS-scored findings |
| 15 | Automation and repeatability | 所有内容在 cron 上运行并带 alerts |
| **100** | | |

##  ejercicios

1. En el chatbot RAG 上运行 garak's prompt-injection plugin,并比较有无输出过层 时的攻击成功率──

2. 添加第七个攻击家族: mediante inyección directa directa de documentos recuperados.

3.  Realizar un refuso con ayuda  模式: cuando el barricado  bloquea, el objetivo es proporcionar una respuesta relacionada más segura, en lugar de rechazarlo directamente   Medir el delta XSTest 

4. La brecha de cobertura multilingüe: encontrar una lenguaje exhibida por X-Guard. Proponer un conjunto de datos de ajuste fino hacia ella.

5. En el modelo 30B 上运行 constitucional autocrítica,并测量 delta sí sí con escala aumentar.

## 关键术语: "El hombre es un hombre"

| 术语 | 常见说法 | 实际含义 |
|------|-----------------|------------------------|
| Layered safety | “Defense in depth” | 在 input、gate、output、HITL 多处设置 guardrails |
| Llama Guard 4 | “Meta's safety classifier” | 2026 年参考级 input/output content classifier |
| PAIR | “Jailbreak agent” | 关于 LLM-driven jailbreak discovery 的论文（Chao et al.） |
| TAP | “Tree-of-Attacks” | PAIR 的 tree-search 变体 |
| GCG | “Greedy coordinate gradient” | 基于 Gradient 的 adversarial suffix attack |
| Constitutional self-critique | “Anthropic-style training” | Target drafts -> critic scores -> rewrite -> retrain |
| XSTest | “Benign probe set” | 用于 over-refusal regression 的 benchmark |
| CVSS 4.0 | “Severity score” | safety findings 的标准 vulnerability scoring |

## 延伸阅读

- [Anthropic Constitutional Classifiers](https://www.anthropic.com/research/constitutional-classifiers) Referencia del tiempo de formación
- [Meta Llama Guard 4](https://ai.meta.com/research/publications/llama-guard-4/) Clasificador de entrada/salida de 2026
- [Google ShieldGemma-2](https://huggingface.co/google/shieldgemma-2b) imagen + Seguridad multimodal
- [NVIDIA Nemotron 3 Content Safety](https://developer.nvidia.com/blog/building-nvidia-nemotron-3-agents-for-reasoning-multimodal-rag-voice-and-safety/) Referencia de la empresa
- [X-Guard (arXiv:2504.08848)](https://arxiv.org/abs/2504.08848) Seguridad multilingüe de 132 idiomas
- [garak](https://github.com/NVIDIA/garak) NVIDIA red-team kit de herramientas
- [PyRIT](https://github.com/Azure/PyRIT) Microsoft red-team framework
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/) marco ferroviario
- [PAIR (arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) papel de agente de escape de cárcel
