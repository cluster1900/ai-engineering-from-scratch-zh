# Resolución de la Comisión

>  ella llamó a él.  él no lo hizo.  Médecins en el almuerzo.  Tres referencias, dirigidas a dos personas, y nadie fue nombrado.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 07 (POS & Parsing)
**Time:** ~60 分钟

##  problemas
Se trata de un artículo que trata de una serie de artículos que se han publicado en la revista Apple Inc. en el que se extraen de cada mención de Apple Inc. 文章写着Apple 时很简单──写成 the company、the、Cupertino's technology giant或 Jobs's firm 时就很难── si no se resuelve a la misma entidad, su NER pipeline se perdería el 60-80% de la mención──

La resolución de Coreferencia se centra en el cluster de la misma entidad del mundo real.

¿Por qué es importante en 2026?

- Resumen:El CEO anunció... vs Tim Cook anunció...  resumen 应该说出 CEO 的名字──
- Respuesta a la pregunta: ¿A quién llamó?
- Extracción de información: un gráfico de conocimiento 里同时有PER1 fundó Apple 和 Jobs fundó Apple 作为不同条目,这是错的──
- El documento multi-documento IE:合并多篇关于同一事件文章中的提到,就是跨文档核心参考.

## 概念
![Coreference clustering: mentions → entities](../assets/coref.svg)

**The task.**输入: un documento──输出:mention(span) de agrupamiento, cada uno de los cuales se dirige a una entidad──

**Mention types.**

- **Named entity.**Tim Cook
- **Nominal.**El CEO de la empresa
- **Pronominal.**Él, ella, ellos, ella, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, y ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, y ellos, ellos, ellos, ellos, ellos, ellos, ellos, ellos, y ellos, ellos, ellos, ellos, y ellos, ellos, ellos, y ellos, ellos, ellos, ellos, y ellos, ellos, ellos, ellos, y ellos, ellos, ellos, y ellos, ellos, y ellos, ellos, ellos, y ellos, y ellos, los, los, los, los cuales, los cuales, los cuales, los cuales, son, los cuales, y ellos, los cuales, son, los cuales, y ellos, los cuales, los cuales, los cuales, los cuales, los cuales, los cuales, y ellos, son, los cuales, los cuales, los cuales, los cuales, los cuales, y ellos, los cuales, los cuales, los cuales, los cuales, los cuales, los cuales, los cuales, los cuales, los cuales, cuananananananananananananananananananananananananananananananananananananananananananananananananananananananananananananananananananananananananananananananananananananananananan
- **Appositive.**Tim Cook, director ejecutivo de Apple,

**Architectures.**

1. **Rule-based (Hobbs, 1978).**基于语法树的代词解析,使用语法规则──很好的基线──在代词上意外地难以超越──
2. **Mention-pair classifier.**Para cada uno de los mencionados, prevé si son más importantes.
3. **Mention-ranking.**Para cada mención, la lista de candidatos antecedentes incluye no antecedentes)
4. **Span-based end-to-end (Lee et al., 2017).**El codificador de transformadores, el cuadro de la lista de candidatos en el período de tiempo de cada período de tiempo, el cuadro de la lista de candidatos, el cuadro de la lista de candidatos, el cuadro de la lista de candidatos, el cuadro de la lista de candidatos, el cuadro de la lista de candidatos, el cuadro de la lista de candidatos, el cuadro de los candidatos, el cuadro de los candidatos, el cuadro de los candidatos, el cuadro de los candidatos, el cuadro de los candidatos, el cuadro de los candidatos, el cuadro de los candidatos, el cuadro de la lista de candidatos, el cuadro de los candidatos, el cuadro de los candidatos, el cuadro de los candidatos, el cuadro de los candidatos, el cuadro de los candidatos, el cuadro de los candidatos, el cuadro de los cuadrados, etc., el cuadro de los cuadrados, etc., etc., etc., etc., etc.
5. **Generative (2024+).**Prompt 一个LLM:Lista todos los pronombres en este texto y sus antecedentes. 在简单案例上效果不错,但在长文档和少见引用上会吃力──

**The evaluation metrics.**Hay cinco indicadores estándar (MUC、B3、CEAF、BLANC、LEA), ya que no hay un solo indicador que pueda captar completamente el agrupamiento de calidad―.

**Known hard cases.**

- Descripción definida de la entidad introducida antes de la fecha de introducción.
- Puente de anaforalas ruedas → 之前提到一辆车)。
- En otros idiomas, el término "anafora" es "nulo".
- Cataphora (pronom de la palabra)  出现在 之前:**she**Entró, Mary sonrió.


```figure
coref-links
```

## Construirlo
### 步骤 1: coreferencia neural preentrenada (AllenNLP / spaCy-experimental)

```python
import spacy
nlp = spacy.load("en_coreference_web_trf")   # experimental model
doc = nlp("Apple announced new products. The company said they would ship soon.")
for cluster in doc._.coref_clusters:
    print(cluster, "->", [m.text for m in cluster])
```

En el documento más largo arriba, obtendrás resultados similares:
- Cluster 1: [Apple, la compañía, ellos]
- Grupo 2: [productos nuevos]

### 步骤 2: resolver del pronombre basado en reglas (enseñar)

¿ Qué pasa ?`code/main.py`En solo utilizar stdlib de la realización:

1. 抽取 mención: entidades denominadas (en inglés)                                                                                                                                                                                                                                                         
2. Para cada pronombre, ver anterior K 个 mención,并按以下因素打分:
   - acuerdo de género/número (heurística)
   - reciente ((越近越优)
   - papel sintáctico (subyecto prioritario)
3. 链接最高分前史──

Esto no puede competir con los modelos neurales, pero muestra el espacio de búsqueda, así como el modelo de extremo a extremo, que debe tomarse decisiones.

### Paso 3: Utiliza los LLM para realizar una evaluación

```python
prompt = f"""Text: {text}

List every pronoun and noun phrase that refers to a person or company.
Cluster them by what they refer to. Output JSON:
[{{"entity": "Apple", "mentions": ["Apple", "the company", "it"]}}, ...]
"""
```

需要注意两种失败模式――第一,LLMs 会过度合并(把指向两个不同人的 him和 her合并)――第二,LLMs 会在长文档中漏掉提到――始终使用跨度抵消检查验证――

### Paso 4: evaluación

标准 conll-2012 script 会计算 MUC、B3、CEAF-φ4,并报告平均值──对于内部 eval,先在带标注的测试集 上做跨度级精度和回忆,再加入提到链接 F1──

## 陷
- **Singleton explosion.**Algunos sistemas pondrán cada mención en su propio grupo.
- **Pronouns in long context.**DATA                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- **Gender assumptions.**硬编码性别规则 会在非二进制参考,组织,动物 上失效──使用学习模型或中立分分点──
- **LLM drift on long docs.**单次 API 调用不可靠地对 50+ 段落中的提到 聚类──使用滑窗+ merge──

## Usalo
Estaca de 2026 años:

| Situation | Pick |
|-----------|------|
| English, single document | `en_coreference_web_trf` (spaCy-experimental) 或 AllenNLP neural coref |
| Multilingual | 在 OntoNotes 或 Multilingual CoNLL 上训练的 SpanBERT / XLM-R |
| Cross-document event coref | 专门的 end-to-end models（2025–26 SOTA） |
| Quick LLM baseline | 带 structured-output coref prompt 的 GPT-4o / Claude |
| Production dialog systems | Rule-based fallback + neural primary + critical slots 的 manual review |

2026 年能上线的整合模式:先运行 NER,再运行 coref,把 coref clusters 合并进 NER entities──下游任务看到是每个集群一个实体,而不是每个提到一个实体──

##  entregarlo
保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-coref-picker.md`¿Qué es esto ?

```markdown
---
name: coref-picker
description: Pick a coreference approach, evaluation plan, and integration strategy.
version: 1.0.0
phase: 5
lesson: 24
tags: [nlp, coref, information-extraction]
---

Given a use case (single-doc / multi-doc, domain, language), output:

1. Approach. Rule-based / neural span-based / LLM-prompted / hybrid. One-sentence reason.
2. Model. Named checkpoint if neural.
3. Integration. Order of operations: tokenize → NER → coref → downstream task.
4. Evaluation. CoNLL F1 (MUC + B³ + CEAF-φ4 average) on held-out set + manual cluster review on 20 documents.

Refuse LLM-only coref for documents over 2,000 tokens without sliding-window merge. Refuse any pipeline that runs coref without a mention-level precision-recall report. Flag gender-heuristic systems deployed in demographically diverse text.
```

##  ejercicios
1. **Easy.**En el`code/main.py`En el caso de los datos de la base de datos, el valor de la información de la base de datos es el valor de la información de la base de datos.
2. **Medium.**En un artículo de prensa sobre el uso de un modelo de núcleo neural preentrenado, ¿cluster con su propia anotación manual en comparación? ¿Dónde fracasó?
3. **Hard.**Construir un oleoducto de NER mejorado en el núcleo: primero NER, luego Cluster 合并──衡量 100 篇文章上相对NER-only entities-coverage improvement──

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Mention | 一个 reference | 一段指向某个 entity 的文本（name、pronoun、noun phrase）。 |
| Antecedent | “it” 指向什么 | 后续 mention 与之 corefer 的更早 mention。 |
| Cluster | entity 的 mentions | 全部指向同一个真实世界 entity 的 mention 集合。 |
| Anaphora | 后向 reference | 后续 mention 指向更早内容（“he” → “John”）。 |
| Cataphora | 前向 reference | 更早 mention 指向后续内容（“When he arrived, John...”）。 |
| Bridging | 隐式 reference | “I bought a car. The wheels were bad.”（那辆 car 的 wheels。） |
| CoNLL F1 | leaderboard 上的数字 | MUC、B³、CEAF-φ4 F1 scores 的平均值。 |

## 延伸阅读
- [Jurafsky & Martin, SLP3 Ch. 26 — Coreference Resolution and Entity Linking](https://web.stanford.edu/~jurafsky/slp3/26.pdf) 经典教材章节──
- [Lee et al. (2017). End-to-end Neural Coreference Resolution](https://arxiv.org/abs/1707.07045) 基于 span de extremo a extremo
- [Joshi et al. (2020). SpanBERT](https://arxiv.org/abs/1907.10529) 改进 coref de la pre-entrenamiento。
- [Pradhan et al. (2012). CoNLL-2012 Shared Task](https://aclanthology.org/W12-4501/) referencia
- [Hobbs (1978). Resolving Pronoun References](https://www.sciencedirect.com/science/article/pii/0024384178900064) método clásico basado en reglas
