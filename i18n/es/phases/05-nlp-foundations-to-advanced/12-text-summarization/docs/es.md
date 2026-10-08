# Resumen del texto

> Extractivo 系统告诉你文档说了什么――Abstractivo 系统告诉你作者想表达什么―― tareas diferentes, en la trampa también diferentes――

**类型：**Construir
**语言：**Python
**先修：**Fase 5 · 02 (BoW + TF-IDF), Fase 5 · 11 (Traducción automática)
**时间：**~ 75 minutos

##  problemas

Un artículo de noticias de 2.000 palabras entra en tu feed. Necesitas usar 120 palabras para captar su núcleo. Puedes elegir tres frases más importantes de la publicación. También puedes volver a escribir contenido con tu propio contenido.

La resumen extractiva es un problema de ordenamiento.`k`个──输出总是语法正确的, pues es extraído de un texto en el otro.

La resumen abstracta es un problema de generación. Un transformador en condiciones de entrada genera un nuevo texto.

Este curso construirá ambos, y mostrará su propio modo de fracaso.

## 概念

![Extractive TextRank vs abstractive transformer](../assets/summarization.svg)

**Extractive。**Se trata de un gráfico en el que los nodos son una frase, los bordes son una similitud.**TextRank**(Mihalcea y Tarau, 2004):

**Abstractive。**En los pares de resumen de documentos 上 fine-tune 一个变体编码解码器(BART、T5、Pegasus) ⋅在推论时,model 读取文档,并通过横切注意 逐代币 生成总结──Pegasus 尤其使用差句预训目标,使它在不需要太多的细调的情况下非常适合总结──

Uso **ROUGE**(Recall-Oriented Understudy for Gisting Evaluation) evaluación──ROUGE-1 和 ROUGE-2 衡量 unigram 和 bigram overlap──ROUGE-L 衡量最长的常见后续──越高越好,但40 ROUGE-L 算好,50 算例外──每篇论文都会报告这三项──使用 `rouge-score`paquete


```figure
summarize-collapse
```

## Construcción

### 步骤 1: TextRank (extractivo)

```python
import math
import re
from collections import Counter


def sentence_split(text):
    return re.split(r"(?<=[.!?])\s+", text.strip())


def similarity(s1, s2):
    w1 = Counter(s1.lower().split())
    w2 = Counter(s2.lower().split())
    intersection = sum((w1 & w2).values())
    denom = math.log(len(w1) + 1) + math.log(len(w2) + 1)
    if denom == 0:
        return 0.0
    return intersection / denom


def textrank(text, top_k=3, damping=0.85, iterations=50, epsilon=1e-4):
    sentences = sentence_split(text)
    n = len(sentences)
    if n <= top_k:
        return sentences

    sim = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                sim[i][j] = similarity(sentences[i], sentences[j])

    scores = [1.0] * n
    for _ in range(iterations):
        new_scores = [1 - damping] * n
        for i in range(n):
            total_out = sum(sim[i]) or 1e-9
            for j in range(n):
                if sim[i][j] > 0:
                    new_scores[j] += damping * sim[i][j] / total_out * scores[i]
        if max(abs(s - ns) for s, ns in zip(scores, new_scores)) < epsilon:
            scores = new_scores
            break
        scores = new_scores

    ranked = sorted(range(n), key=lambda k: scores[k], reverse=True)[:top_k]
    ranked.sort()
    return [sentences[i] for i in ranked]
```

Hay dos cosas que vale la pena destacar. La función de similitud utiliza una superposición de palabras normalizadas en el registro, esto es el cosino de los vectores de TextRank 变体──TF-IDF. También se puede hacer. El factor de amortiguación 0.85 y el número de iteraciones es el valor de seguridad de PageRank.

### Paso 2: Utiliza BART hacer abstracto

```python
from transformers import pipeline

summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

article = """(long news article text)"""

summary = summarizer(article, max_length=120, min_length=60, do_sample=False)
print(summary[0]["summary_text"])
```

BART-grand-CNN en CNN/DailyMail corpus 上精细调──它开箱即可生成新闻风格的摘要──对于其他领域(论文、对话、法律),使用对应的Pegasus checkpoint,或在你的目标数据上精细调──

### Paso 3: Evaluación ROUGE

```python
from rouge_score import rouge_scorer

scorer = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
scores = scorer.score(reference_summary, generated_summary)
print({k: round(v.fmeasure, 3) for k, v in scores.items()})
```

始终使用 stemming──否则, "running" 和 "run" 会被算作不同词,ROUGE 会低估──

### ROUGE 之外(2026 evaluación de resumen)

Durante dos décadas, ROUGE ha sido una métrica de resumen predominante, pero en 2026 ya no basta con usarlo solo.

- **BERTScore**(similaridad de inserción contextual) en el año 2023 pre y después de su adopción continua, ahora la mayoría de los documentos de resumen 会与 ROUGE 一起报告──
- **BARTScore**La evaluación de la generación: según la probabilidad de que el BART pre-entrenado en una fuente determinada, proporcione un resumen de la información.
- **MoverScore**(embedadas contextuales de la distancia del Mover de la Tierra) alcanzó el primer lugar entre los puntos de referencia de resumen de 2025, ya que es mejor que ROUGE para capturar la superposición semántica.
- **FactCC**Y **QA-based faithfulness**En 2021-2023 años muy común, ahora frecuentemente **G-Eval**替代(1 GPT-4 cadena de respuesta, a través de la cadena de pensamiento razonamiento a la coherencia, la coherencia, la fluidez, la relevancia 打分)
- **G-Eval**Y similar LLM-juzgado  métodos en la rubrica  diseño bueno, con el juicio humano tiene aproximadamente el 80% de la misma.

Recomendación de producción: informe ROUGE-L utiliza para la comparación de legado, BERTScore utiliza para la superposición semántica, G-Eval utiliza para la coherencia y la factualidad,

### 步骤 4: realidad 问题

Los resúmenes abstractos son muy fáciles de hallucinar. El riesgo de hallucinar resúmenes extractivos es mucho menor, ya que el extrado es extraído de un texto de la fuente, aunque los términos de la fuente se transforman en la cultura, el tiempo, o el proceso de referencia, siguen siendo errores.

需要点名的 halucinaciones 类型:

- **Entity swap。**La fuente es "John Smith". Resumen es "John Brown".
- **Number drift。**La fuente 写是 "25,000. " Resumen 写成 "25 millones".
- **Polarity flip。**Fuente 写成 es "rechazó la oferta". Resumen 写成 "aceptó la oferta".
- **Fact invention。**La fuente no menciona al CEO. Resumen dice que el CEO lo ha aprobado.

Los enfoques de evaluación eficaces:

- **FactCC。**Un clasificador binario, entrenar objetivos es la implicación entre la frase fuente y la frase resumida 😇😇😇😇😇
- **QA-based factuality。**让QA model 提出答案在源中问题──如果总结 支持不同答案,则标记──
- **Entity-level F1。**Comparación de la fuente con el resumen de las entidades nombradas en el medio.

对于任何面向用户和事实性 重要内容(noticias, médicos, legales, financieros), extractiva es más segura de la opción默认──abstractiva 需要加入在流程中事实性检查──

## Uso

Estaca 2026:

| Use case | Recommended |
|---------|-------------|
| News, 3-5 sentence summary, English | `facebook/bart-large-cnn` |
| Scientific papers | `google/pegasus-pubmed` or a tuned T5 |
| Multi-document, long-form | Any LLM with 32k+ context, prompted |
| Dialog summarization | `philschmid/bart-large-cnn-samsum` |
| Extractive, low hallucination risk by construction | TextRank or `sumy`'s LSA / LexRank |

Cuando el cálculo no es limitado, los LLM en largo contexto en 2026 generalmente superan a los modelos especializados.

##  publicación

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-summary-picker.md`¿Qué es esto ?

```markdown
---
name: summary-picker
description: 选择 extractive 或 abstractive、指定 library、factuality check。
version: 1.0.0
phase: 5
lesson: 12
tags: [nlp, summarization]
---

给定一个任务（document type、compliance requirement、length、compute budget），输出：

1. Approach。Extractive 或 abstractive。用一句话解释原因。
2. Starting model / library。写出名称。`sumy.TextRankSummarizer`、`facebook/bart-large-cnn`、`google/pegasus-pubmed`，或一个 LLM prompt。
3. Evaluation plan。ROUGE-1、ROUGE-2、ROUGE-L（使用带 stemming 的 rouge-score）。如果是 abstractive，再加 factuality check。
4. 一个需要探查的 failure mode。Entity swap 是 abstractive news summarization 中最常见的问题；标记 source entities 未出现在 summary 中的 samples。

如果没有 factuality gate，则拒绝对 medical、legal、financial 或 regulated content 使用 abstractive summarization。将超过 model context window 的输入标记为需要 chunked map-reduce summarization（而不是简单 truncation）。
```

##  ejercicios

1. **Easy。**En 5 篇新闻文章上运行 TextRank──将 top-3 句子与参考摘要比较──测量 ROUGE-L──你应该能在CNN/DailyMail-style articles 上看 30-45 ROUGE-L──
2. **Medium。**实现 la realidad a nivel de entidad: de fuente y resumen 中抽取命名实体(spaCy), calcular entidades fuentes en resumen, así como entidades resumidas en relación con la precisión de la fuente──高精度、低回忆 表示安全但简略;低精度 表示幻觉实体──
3. **Hard。**En 50 篇 artículos de CNN/DailyMail 上比较 BART-big-CNN con una LLM(Claude o GPT-4) ―― informe ROUGE-L、factuality(por medio de la entidad F1) y el costo por resumen―记录各自胜出的场景──

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 实际含义 |
|------|------------|----------|
| Extractive | 选句子 | 从 source 中逐字返回句子。永不 hallucinate。 |
| Abstractive | 重写 | 在 source 条件下生成新文本。可能 hallucinate。 |
| ROUGE | Summary metric | system output 与 reference 之间的 N-gram / LCS overlap。 |
| TextRank | Graph-based extractive | sentence similarity graph 上的 PageRank。 |
| Factuality | 是否正确 | summary claims 是否由 source 支持。 |
| Hallucination | 编造内容 | summary 中 source 不支持的内容。 |

## 延伸阅读

- [Mihalcea and Tarau (2004). TextRank: Bringing Order into Texts](https://aclanthology.org/W04-3252/) extractivo 经典论文。
- [Lewis et al. (2019). BART: Denoising Sequence-to-Sequence Pre-training](https://arxiv.org/abs/1910.13461) BART 论文。
- [Zhang et al. (2019). PEGASUS: Pre-training with Extracted Gap-sentences](https://arxiv.org/abs/1912.08777) Pegasus 和 objetivo de la frase de la brecha
- [Lin (2004). ROUGE: A Package for Automatic Evaluation of Summaries](https://aclanthology.org/W04-1013/)Papel rojo.
- [Maynez et al. (2020). On Faithfulness and Factuality in Abstractive Summarization](https://arxiv.org/abs/2005.00661) papel de paisaje de la realidad¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
