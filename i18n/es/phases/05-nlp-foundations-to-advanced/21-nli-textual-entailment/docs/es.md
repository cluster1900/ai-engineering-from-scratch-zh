# Naturaleza  文本含

> "t implica h" significa que la persona que lee t 后会得出 h 为真实结论──NLI es una tarea de previsión de implicación / contradicción / neutralidad── superficialmente seca, pero en la producción asume un papel clave──

**类型：**El aprendizaje
**语言：**Python
**先修：**Fase 5 · 05 (Análisis de sentimientos), Fase 5 · 13 (Respuesta a preguntas)
**时间：**- 60 minutos

##  problemas

¿Cómo sabes que este resumen no contiene alucinaciones?

¿Cómo sabes que la respuesta es un chatbot? ¿Cómo sabes que la respuesta es un chatbot?

¿Necesitas un tema de 10.000 artículos de noticias? ¿No tienes etiquetas de entrenamiento? ¿Puedes volver a usar un modelo?

Estos tres problemas pueden ser reducidos a la inferencia del lenguaje natural.`t`Y una hipótesis `h`¿ Qué ?`h`Es por`t`¿Entra en contradicción o neutral?

- **Hallucination check:** `t`= documento fuente,`h`= afirmación resumida―no implicación=allucinación―
- **Grounded QA:** `t`= pasaje recuperado,`h`= respuesta generada―no implicación=fábricación―
- **Zero-shot classification:** `t`= documento,`h`= etiqueta verbal ("Esto se trata de deportes")―Entraenimiento = etiqueta prevista―

Una tarea, tres usos de producción. Es por eso que cada marco de evaluación RAG está en el nivel inferior con un modelo NLI.

## 概念

![NLI: three-way classification, premise vs hypothesis](../assets/nli.svg)

**三个 labels。**

- **Entailment.** `t`¿ Qué es esto ?`h`"El gato está en la alfombra" implica "Hay un gato".
- **Contradiction.** `t`¿ Qué es esto ?`h`"El gato está en la alfombra" contradice a "No hay gato".
- **Neutral.**"El gato está en la alfombra" o "El gato tiene hambre".

**不是逻辑 entailment。**NLI es una inferencia de lenguaje natural, y es lo que el típico antropólogo ha deducido, en lugar de una lógica estricta. En NLI, "Juan caminó con su perro" implica que "Juan tiene un perro", pero una lógica estricta sólo lo reconoce después de la legalización.

**Datasets。**

- **SNLI**(2015)──570k 人工标注 pares,以图片标题 作为前提──领域较窄──
- **MultiNLI**(2017)──跨 10 个类的 433k pares──2026 年的标准培训 corpus──
- **ANLI**(2019) ――NLI adversarios―humanos especialmente redactados para atacar ejemplos de modelos existentes―.
- **DocNLI, ConTRoL**(202021) ・Primisas de longitud de documento―测试 multi-hop 和 inferencia a largo alcance―

**架构。**Un codificador de transformador (BERT, RoBERTA, DeBERTA)`[CLS] premise [SEP] hypothesis [SEP]`¿Qué es eso?`[CLS]`En el MNLI, en los benchmarks mantenidos, en las pares de distribución, en los pares de distribución, en los pares de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en los equipos de distribución, en el equipo de más de más de 90% de precisión.

**通过 NLI 做 zero-shot。**给定一个文件 和候选标签,把每个标签 转成一个假设("Este texto es sobre deportes")`zero-shot-classification`El sistema de la tubería 背后的机制──


```figure
nli-router
```

## Construirlo

### Paso 1: 运行 un modelo de NLI pre-entrenado

```python
from transformers import pipeline

nli = pipeline("text-classification",
               model="facebook/bart-large-mnli",
               top_k=None)  # return all labels; replaces deprecated return_all_scores=True

premise = "The cat is sleeping on the couch."
hypothesis = "There is a cat in the room."

result = nli({"text": premise, "text_pair": hypothesis})[0]
print(result)
# [{'label': 'entailment', 'score': 0.97},
#  {'label': 'neutral', 'score': 0.02},
#  {'label': 'contradiction', 'score': 0.01}]
```

 para las NLI de producción,`facebook/bart-large-mnli`Y `microsoft/deberta-v3-large-mnli`Es un buen ejemplo de la forma en que el mundo se ha convertido en un lugar de interés.

### 步骤 2: Clasificación de tiro cero

```python
zs = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

text = "The stock market rallied after the central bank cut interest rates."
labels = ["finance", "sports", "politics", "technology"]

result = zs(text, candidate_labels=labels)
print(result)
# {'labels': ['finance', 'politics', 'technology', 'sports'],
#  'scores': [0.92, 0.05, 0.02, 0.01]}
```

默认 template is "Este ejemplo es sobre {label}."―可用 `hypothesis_template`La definición: no necesita datos de entrenamiento: no necesita ajuste fino:

### Paso 3: Verificación de fidelidad de RAG

```python
def is_faithful(answer, context, threshold=0.5):
    result = nli({"text": context, "text_pair": answer})[0]
    entail = next(s for s in result if s["label"] == "entailment")
    return entail["score"] > threshold
```

Esta es la base de la fidelidad de RAGAS. La respuesta generada se divide en afirmaciones atómicas.

### 步骤 4: 手写 NLI clasificador (concepto de la versión)

¿ Qué pasa ?`code/main.py`En el caso de los modelos de Transformer, el modelo de la prueba de la prueba de la prueba de la prueba de la prueba de la prueba de la prueba de la prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba de prueba`{entail, contradict, neutral}`La entropía cruzada de arriba...

## 陷

- **Hypothesis-only shortcuts.**Los modelos sólo ven la hipótesis de que puede obtener una etiqueta de pronóstico de la tasa de precisión de aproximadamente el 60% en SNLI, ya que "no""",nadie""",nunca" está relacionado con la contradicción.
- **Lexical overlap heuristic.**La heurística de la subsecuencia se puede hacer a través de SNLI, pero se puede hacer en HANS/ANLI.
- **Document-length degradation.**Modelos de NLI de una sola oración en instalaciones de longitud de documentos 上会下降 20+ F1──长上下文应使用 DocNLI-trained models──
- **Zero-shot template sensitivity.**"Este ejemplo es sobre {label}"、"{label}"、"El tema es {label}" 之间可能导致精度 波动 10+ puntos──需要调优模板──
- **Domain mismatch.**MNLI en el inglés general en formación.

## Usalo

Estaca 2026:

| Use case | Model |
|---------|-------|
| 通用 NLI | `microsoft/deberta-v3-large-mnli` |
| 快速 / edge | `cross-encoder/nli-deberta-v3-base` |
| Zero-shot classification（轻量） | `facebook/bart-large-mnli` |
| Document-level NLI | `MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli` |
| Multilingual | `MoritzLaurer/multilingual-MiniLMv2-L6-mnli-xnli` |
| RAG 中的 hallucination detection | RAGAS / DeepEval 内部的 NLI layer |

El meta-patrón de 2026: NLI es un texto comprensible. Si necesitas juzgar si es compatible con B? o si es contrario con B? en el lanzamiento de otra llamada de LLM, primero considera a NLI.

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-nli-picker.md`¿Qué es esto ?

```markdown
---
name: nli-picker
description: Pick an NLI model, label template, and evaluation setup for a classification / faithfulness / zero-shot task.
version: 1.0.0
phase: 5
lesson: 21
tags: [nlp, nli, zero-shot]
---

Given a use case (faithfulness check, zero-shot classification, document-level inference), output:

1. Model. Named NLI checkpoint. Reason tied to domain, length, language.
2. Template (if zero-shot). Verbalization pattern. Example.
3. Threshold. Entailment cutoff for the decision rule. Reason based on calibration.
4. Evaluation. Accuracy on held-out labeled set, hypothesis-only baseline, adversarial subset.

Refuse to ship zero-shot classification without a 100-example labeled sanity check. Refuse to use a sentence-level NLI model on document-length premises. Flag any claim that NLI solves hallucination — it reduces it; it does not eliminate it.
```

##  ejercicios

1. **Easy.**En 20 个手写的 (premis, hipótesis, etiqueta) triples 上运行 `facebook/bart-large-mnli`,覆盖所有三类──测量精度──加入对抗性的 "subsecuencia heurística" trampas("No comí el pastel" vs "comí el pastel"), ver si se va a perder de efecto──
2. **Medium.**En 100 条 AG titulares de noticias 上比较零射模板 `"This text is about {label}"`¿Qué es esto?`"The topic is {label}"`Y `"{label}"` Informar sobre el swing de precisión
3. **Hard.**Construir un comprobador de fidelidad RAG:compuestación de las reclamaciones atómicas + cada reclamación hacer NLI。 en 50 个带金背景的RAG-generated answers 上评估──测量对人工标签的错正和错负率──

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| NLI | Natural Language Inference | premise-hypothesis 关系的 3-way classification。 |
| RTE | Recognizing Textual Entailment | NLI 的旧名称；同一任务。 |
| Entailment | "t implies h" | 给定 t，典型读者会得出 h 为真的结论。 |
| Contradiction | "t rules out h" | 给定 t，典型读者会得出 h 为假的结论。 |
| Neutral | "undecided" | 从 t 到 h 双向都无法推断。 |
| Zero-shot classification | NLI as classifier | 把 labels verbalize 成 hypotheses，选择最大 entailment。 |
| Faithfulness | 答案是否有支持？ | 在（retrieved context, generated answer）上做 NLI。 |

## 延伸阅读
- [Bowman et al. (2015). A large annotated corpus for learning natural language inference](https://arxiv.org/abs/1508.05326) SNLI。
- [Williams, Nangia, Bowman (2017). A Broad-Coverage Challenge Corpus for Sentence Understanding through Inference](https://arxiv.org/abs/1704.05426) MultiNLI。
- [Nie et al. (2019). Adversarial NLI](https://arxiv.org/abs/1910.14599) Indicador de referencia de la ANLI。
- [Yin, Hay, Roth (2019). Benchmarking Zero-shot Text Classification](https://arxiv.org/abs/1909.00161) NLI-as-clasificador。
- [He et al. (2021). DeBERTa: Decoding-enhanced BERT with Disentangled Attention](https://arxiv.org/abs/2006.03654) 2026 años de NLI 主力──
