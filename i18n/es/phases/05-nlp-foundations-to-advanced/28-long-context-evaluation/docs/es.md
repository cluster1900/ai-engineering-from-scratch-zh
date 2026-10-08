# Evaluamiento a largo plazo  NIAH, RULER, LongBench, MRCR

> Gemini 3 Pro 宣称拥有10M tokens的背景──在1M tokens下,8-agullas MRCR 降至26.3%──宣称 ≠可用──Long-context evaluation 会告诉你正在上线的模型的实际容量──

**类型：**El aprendizaje
**语言：**Python
**先修要求：**Fase 5 · 13  Respuestas a preguntas  Fase 5  23  Estrategias de reducción de los costes
**时间：** 60 minutos

##  problemas

Usted tiene un contrato de 200 páginas. El modelo afirma tener un contexto de 1M tokens. Usted lo ha puesto en el contexto y le pregunta: ¿Qué es la disposición final?

Esta es la brecha de capacidad de contexto de 2026 años. La situación actual es de 60-70% disponible, y depende de la tarea.

- **Retrieval（haystack 中的 single needle）：**En los modelos fronterizos, hasta que el valor máximo de la declaración esté cerca de la perfección.
- **Multi-hop / aggregation：**La mayoría de los modelos se han reducido en un aumento de aproximadamente 128k.
- **对分散 facts 的 reasoning：**La última tarea que fracasó.

Evaluar el contexto largo medir estas dimensiones. Esta clase explicará estos puntos de referencia  qué medida realmente, y cómo construir una prueba de aguja autodeterminada para tu área.

## 概念

![NIAH baseline, RULER multi-task, LongBench holistic](../assets/long-context-eval.svg)

**Needle-in-a-Haystack（NIAH，2023）。**Para poner un hecho (la palabra mágica es piña) en el contexto largo, en la posición de profundidad controlada.

**RULER（Nvidia，2024）。**覆盖 4 个类别的 13 种任务类型:retrieval(single / multi-key / multi-value)、multi-hop tracing(variable tracking)、agregación(común palabra frecuencia)、QA──context length 可配置(4k hasta 128k+)── se revelará aquellos modelos en NIAH 上和但在多hop 上失败的──在2024年发布版本,17 个声称32k+ context models, sólo una mitad puede mantener la calidad en 32k──

**LongBench v2（2024）。**503 Cálculos de preguntas de opción múltiple,8k-2M contextos de palabras,六个任务类别:QA de un solo documento、QA de varios documentos、aprendizaje largo en contexto、diálogo largo、repuestos de código、dados estructurados largo―es un punto de referencia de producción de comportamientos en el mundo real en largo contexto―

**MRCR（Multi-Round Coreference Resolution）。**La mayor cantidad de tornos de coreferencia.

**NoLiMa。**Needle non-lexical──needle 与 query 没有字面重叠;recuperar 需要一步语义推理──比 NIAH 更难──

**HELMET。**拼接许多文件,并从任意一个中提问──测试 Selectiva atención──

**BABILong。**¿Qué es esto? ¿Qué es esto?

###                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

- **Advertised context window。**Número de la lista de reglas.
- **Effective retrieval length。**NIAH en algún valor bajo el paso (por ejemplo, el 90%)
- **Effective reasoning length。**El multi-hop o la agregación en la que se realiza el valor bajo.
- **Degradation curve。**Precisión vs longitud del contexto, según la tarea tipo de dibujo separado.

Su reglamento de la muestra requiere dos números: recuperación-eficaz y razonamiento-eficaz.


```figure
gx-niah-decay
```

## Construirlo

### Paso 1: Construir NIAH auto-definido para su área

¿ Qué ?`code/main.py`骨架如下:

```python
def build_haystack(filler_text, needle, depth_ratio, total_tokens):
    if not (0.0 <= depth_ratio <= 1.0):
        raise ValueError(f"depth_ratio must be in [0, 1], got {depth_ratio}")
    if total_tokens <= 0:
        raise ValueError(f"total_tokens must be positive, got {total_tokens}")

    filler_tokens = tokenize(filler_text)
    needle_tokens = tokenize(needle)
    if not filler_tokens:
        raise ValueError("filler_text produced no tokens")

    # Repeat filler until long enough to fill the haystack body.
    body_len = max(total_tokens - len(needle_tokens), 0)
    while len(filler_tokens) < body_len:
        filler_tokens = filler_tokens + filler_tokens
    filler_tokens = filler_tokens[:body_len]

    insert_at = min(int(body_len * depth_ratio), body_len)
    haystack = filler_tokens[:insert_at] + needle_tokens + filler_tokens[insert_at:]
    return " ".join(haystack)


def score_niah(model, haystack, question, expected):
    answer = model.complete(f"Context: {haystack}\nQ: {question}\nA:", max_tokens=50)
    return 1 if expected.lower() in answer.lower() else 0
```

扫描 `depth_ratio`∈ {0, 0.25, 0.5, 0.75, 1.0} × `total_tokens`∈ {1k, 4k, 16k, 64k}── dibujar un mapa de calor── ése es el objetivo del modelo de tarjeta NIAH──

### Paso 2: Multi-agullas 变体

```python
def build_multi_needle(filler, needles, total_tokens):
    depths = [0.1, 0.4, 0.7]
    chunks = [filler[:int(total_tokens * 0.1)]]
    for depth, needle in zip(depths, needles):
        chunks.append(needle)
        next_chunk = filler[int(total_tokens * depth): int(total_tokens * (depth + 0.3))]
        chunks.append(next_chunk)
    return " ".join(chunks)
```

Como estas tres palabras mágicas ¿qué es? Estas preguntas necesitan encontrar todas las tres.

### Paso 3: rastreo de variables multi-hop (estilo RULER)

```python
haystack = """X1 = 42. ... (filler) ... X2 = X1 + 10. ... (filler) ... X3 = X2 * 2."""
question = "What is X3?"
```

答案需要串联三次赋值――frontier models 在128k 时, aquí la precisión 经常会降至50-70%──

### Paso 4: En tu pila arriba funcionando LongBench v2

```python
from datasets import load_dataset
longbench = load_dataset("THUDM/LongBench-v2")

def eval_model_on_longbench(model, subset="single-doc-qa"):
    tasks = [x for x in longbench["test"] if x["task"] == subset]
    correct = 0
    for x in tasks:
        answer = model.complete(x["context"] + "\n\nQ: " + x["question"], max_tokens=20)
        if normalize(answer) == normalize(x["answer"]):
            correct += 1
    return correct / len(tasks)
```

按类别报告精度──Puntos agregados                                                                                                                                                                                                                                                         

## 陷

- **仅 NIAH evaluation。**En tokens 1M 下通过 NIAH,并不能说明多跳表现──始终运行 RULER 或自定义多跳测──
- **Uniform depth sampling。**很多实现只测试深度=0.5──测试深度=0、0.25、0.5、0.75、1.0, Lost in the middle效应是真实存在的──
- **与 filler 的 lexical overlap。**Si la aguja y el relleno compartieron palabras clave, la recuperación se volvió muy simple.
- **忽略 latency。**1M-token prompts de preempleo  necesita 30-120 segundos ⋅ en precisión ⋅ además de medir tiempo-a-primero-token ⋅
- **Vendor-self-reported numbers。**OpenAI, Google, Antropica publican sus propias cuentas. Siempre en su caso de uso.

## Usalo

Estaca de 2026 años:

| 场景 | Benchmark |
|-----------|-----------|
| 快速 sanity check | 3 个 depths × 3 个 lengths 的自定义 NIAH |
| 生产级 model selection | 目标 length 下的 RULER（13 tasks） |
| 真实世界 QA quality | LongBench v2 single-doc-QA subset |
| Multi-hop reasoning | BABILong 或自定义 variable-tracing |
| Conversational / dialogue | 目标 length 下的 MRCR 8-needle |
| Model upgrade regression | 固定的内部 NIAH + RULER harness，在每个新 model 上运行 |

La ley de la experiencia ambiental de producción: en la longitud de la meta, completar la tarea de razonamiento de NIAH + 1  before, never never trust in context window。

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-long-context-eval.md`¿Qué es esto ?

```markdown
---
name: long-context-eval
description: Design a long-context evaluation battery for a given model and use case.
version: 1.0.0
phase: 5
lesson: 28
tags: [nlp, long-context, evaluation]
---

Given a target model, target context length, and use case, output:

1. Tests. NIAH depth × length grid; RULER multi-hop; custom domain task.
2. Sampling. Depths 0, 0.25, 0.5, 0.75, 1.0 at each length.
3. Metrics. Retrieval pass rate; reasoning pass rate; time-to-first-token; cost-per-query.
4. Cutoff. Effective retrieval length (90% pass) and effective reasoning length (70% pass). Report both.
5. Regression. Fixed harness, rerun on every model upgrade, surface deltas.

Refuse to trust a context window from the model card alone. Refuse NIAH-only evaluation for any multi-hop workload. Refuse vendor self-reported long-context scores as independent evidence.
```

##  ejercicios

1. **Easy。**构建一个3 个深度(0.25、0.5、0.75) × 3 个长度(1k、4k、16k) de NIAH──在任意模型上运行──将通过率 绘制成3×3热图──
2. **Medium。**Añadir una aguja de 3 变体── medir cada longitud 下是否能找到回全部 3 个──与相同长度的单针传率对比──
3. **Hard。**构建一个变量追踪任务(X1 → X2 → X3,3 hops),Inmapping 64k filler 中──测量 3 个边界模型的精度──报告每个模型的有效推理长度──

## 关键术语: "El hombre es un hombre"

| 术语 | 人们的说法 | 实际含义 |
|------|-----------------|-----------------------|
| NIAH | Needle in haystack | 在 filler 中植入一个 fact，让 model 找回它。 |
| RULER | 加强版 NIAH | 覆盖 retrieval / multi-hop / aggregation / QA 的 13 种任务类型。 |
| Effective context | 真实容量 | accuracy 仍高于阈值的长度。 |
| Lost in the middle | Depth bias | Models 对长输入中间部分的内容关注不足。 |
| Multi-needle | 一次多个 facts | 多个植入项；测试 Attention 的同时处理能力，而不只是 retrieval。 |
| MRCR | Multi-round coref | 8、24 或 100-needle coreference；暴露 Attention 饱和。 |
| NoLiMa | Non-lexical needle | Needle 和 query 没有字面 tokens 重叠；需要 reasoning。 |

## 延伸阅读

- [Kamradt (2023). Needle in a Haystack analysis](https://github.com/gkamradt/LLMTest_NeedleInAHaystack) 原始 NIAH repo──
- [Hsieh et al. (2024). RULER: What's the Real Context Size of Your Long-Context LMs?](https://arxiv.org/abs/2404.06654) Indicador de referencia de tareas múltiples。
- [Bai et al. (2024). LongBench v2](https://arxiv.org/abs/2412.15204)                                                                                                                                                                                                                                                              
- [Modarressi et al. (2024). NoLiMa: Non-lexical needles](https://arxiv.org/abs/2404.06666) Más difícil de agujas.
- [Kuratov et al. (2024). BABILong](https://arxiv.org/abs/2406.10149) razonamiento en el manto de heno。
- [Liu et al. (2024). Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172) profundidad-bias 论文。
