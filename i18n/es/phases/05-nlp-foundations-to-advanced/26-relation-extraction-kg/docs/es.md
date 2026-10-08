# Relación extracción con el conocimiento gráfico 构建

> NER 找到了实体──entidad vinculada 定定了它们──relación extracción 找到它们之间的边缘──Knowledge Graph 是节点、边和其来源的总和──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 25 (Entity Linking)
**Time:** ~60 分钟

##  problemas

分析师读到:"Tim Cook se convirtió en CEO de Apple en 2011."

- `(Tim Cook, role, CEO)`
- `(Tim Cook, employer, Apple)`
- `(Tim Cook, start_date, 2011)`
- `(Apple, type, Organization)`

Relación Extracción (RE) 将自由文本转成结构化三倍 `(subject, relation, object)` Después de la agrupación de los lenguajes, ya tienes el gráfico de conocimiento.

Las LLM se extraen de manera muy activa de las relaciones. Son demasiado positivas.

## 概念

![Text → triples → knowledge graph](../assets/relation-extraction.svg)

**Triple 形式。** `(subject_entity, relation_type, object_entity)` Relaciones de origen en ontología (propriedades de los datos de Wikipedia, FIBO, UMLS) o colección abierta (OpenIE, cualquier contenido puede ser)

**三种抽取方法。**

1. **Rule / pattern-based。**Modelos Hearst:"X como Y" → `(Y, isA, X)`◊ re-ga-man-escribir regex― fragilidad―精确―可解释―
2. **Supervised classifier。**给定一个句子中的两个实体提到,从固定集合中预测关系──训练到TACRED、ACE、KBP──2015-2022 年的标准方法──
3. **Generative LLM。**Modelo rápido 输出 triples──开箱即用── necesita procedencia, o entonces se alucinará parece razonable contenido de basura──

**AEVS (Anchor-Extraction-Verification-Supplement, 2026)。**Cuando se trata de alucinaciones:

- **Anchor。**Usar la precisión de la ubicación para identificar cada entidad y la relación-frase span.
- **Extract。**生成链接到基长度的三倍――
- **Verify。**Cada elemento triple se ajusta al texto de origen; rechazar cualquier contenido no respaldado.
- **Supplement。**Pases de cobertura  asegurarse de que no haya un espacio anclado  被遗漏──

Las alucinaciones disminuirán considerablemente. Necesitarán más cálculos, pero pueden ser revisados.

**open-vs-closed 取舍。**

- **Closed ontology。**Fija lista de propiedades                                                                                                                                                                                                                                                            
- **Open IE。**Cualquier palabra en inglés puede ser relacionada.

Los KGs de Clasificación de Productos usualmente se usan en combinación: con Open IE hacer descubrimiento, luego en combinación con el gráfico principal  antes de que las relaciones se canonicen a ontología cerrada。


```figure
relation-triples
```

## Construcción

### Paso 1: extracción basada en patrones

```python
PATTERNS = [
    (r"(?P<s>[A-Z]\w+) (?:is|was) (?:a|an|the) (?P<o>[A-Z]?\w+)", "isA"),
    (r"(?P<s>[A-Z]\w+) (?:is|was) born in (?P<o>\w+)", "bornIn"),
    (r"(?P<s>[A-Z]\w+) works? (?:at|for) (?P<o>[A-Z]\w+)", "worksAt"),
    (r"(?P<s>[A-Z]\w+) founded (?P<o>[A-Z]\w+)", "founded"),
]
```

¿ Qué pasa ?`code/main.py`En el extrador de juguetes completo, los patrones de audición todavía aparecen en las líneas de conducción específicas de dominio, ya que pueden ser modificados.

### Paso 2: Código de control

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification

tok = AutoTokenizer.from_pretrained("Babelscape/rebel-large")
model = AutoModelForSequenceClassification.from_pretrained("Babelscape/rebel-large")

text = "Tim Cook was born in Alabama. He later became CEO of Apple."
encoded = tok(text, return_tensors="pt", truncation=True)
output = model.generate(**encoded, max_length=200)
triples = tok.batch_decode(output, skip_special_tokens=False)
```

REBEL es un extractor de relaciones de secuencias:输入文本,输出三倍,并且已经使用维基数据属性IDs──它在远程监督数据上精细调──标准开权基线──

### Paso 3: Extracción de LLM con anclaje

```python
prompt = f"""Extract (subject, relation, object) triples from the text.
For each triple, include the exact character span in the source text.

Text: {text}

Output JSON:
[{{"subject": {{"text": "...", "span": [start, end]}},
   "relation": "...",
   "object": {{"text": "...", "span": [start, end]}}}}, ...]

Only include triples fully supported by the text. No inference beyond what is stated.
"""
```

Renderá cada vuelta de tiempo con la fuente  nuclear对― rechazar cualquier `text[start:end] != triple_entity`El resultado fue el paso "verificar" de AEVS en la forma mínima.

### Paso 4: canonizar a ontología cerrada

```python
RELATION_MAP = {
    "is the CEO of": "P169",       # "chief executive officer"
    "was born in":   "P19",         # "place of birth"
    "founded":        "P112",       # "founded by" (inverted subject/object)
    "works at":       "P108",       # "employer"
}


def canonicalize(relation):
    rel_low = relation.lower().strip()
    if rel_low in RELATION_MAP:
        return RELATION_MAP[rel_low]
    return None   # drop unmapped open relations or route to manual review
```

La canonización ocupa el 60-80% del trabajo de construcción.

### Paso 5: Construir un pequeño gráfico y hacer consultas

```python
triples = extract(text)
graph = {}
for s, r, o in triples:
    graph.setdefault(s, []).append((r, o))


def neighbors(node, relation=None):
    return [(r, o) for r, o in graph.get(node, []) if relation is None or r == relation]


print(neighbors("Tim Cook", relation="P108"))    # -> [(P108, Apple)]
```

Es cada uno de los elementos del sistema RAG-over-KG. Usando almacenes triples de RDF, las gráficas de propiedades de Blazegraph, Virtuoso, Neo4j o gráficos aumentados por vectores, se expandió.

## 常见陷

- **RE 前先做 coreference。**"Él fundó Apple"  RE 需要知道 "él" 是谁──先运行核心f课 24)──
- **Entity canonicalization。**"Apple Inc" y "Apple" deben resolverse en el mismo nodo.
- **Hallucinated triples。**Las LLM 会输出文本不支持的三倍―― compulsory span verification――
- **Relation canonicalization drift。**Relaciones abiertas de IE 不一致("nació en," "provino de," "es un nativo de")──折叠到加нонические ids,否则graph 无法查询──
- **Temporal errors。**"Tim Cook es CEO de Apple"  现在为真,2005年为假。 muchos relaciones 有时间边界──使用资格(Wikidata 中的 `P580`hora de inicio`P582`tiempo de fin) ⋅
- **Domain mismatch。**REBEL en Wikipedia 上訓練──法律、医学和科学文本 normalmente requiere modelos de RE afinados en el dominio──

## Uso

Estaca de 2026 años:

| Situation | Pick |
|-----------|------|
| 快速生产、通用 domain | REBEL 或 LlamaPred，并进行 Wikidata canonicalization |
| Domain-specific（biomed、legal） | SciREX-style domain fine-tune + custom ontology |
| LLM-prompted、已审计输出 | AEVS pipeline：anchor → extract → verify → supplement |
| 高容量 news IE | Pattern-based + supervised hybrid |
| 从零构建 KG | Open IE + manual canonicalization pass |
| Temporal KG | 使用 qualifiers 抽取（start/end time、point in time） |

集成模式:NER → coref → entidad vinculada → extracción de relaciones → cartografía ontológica → carga gráfica── cada una de las fases son potenciales质量门──

## 交付

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-re-designer.md`¿Qué es esto ?

```markdown
---
name: re-designer
description: Design a relation extraction pipeline with provenance and canonicalization.
version: 1.0.0
phase: 5
lesson: 26
tags: [nlp, relation-extraction, knowledge-graph]
---

Given a corpus (domain, language, volume) and downstream use (KG-RAG, analytics, compliance), output:

1. Extractor. Pattern-based / supervised / LLM / AEVS hybrid. Reason tied to precision vs recall target.
2. Ontology. Closed property list (Wikidata / domain) or open IE with canonicalization pass.
3. Provenance. Every triple carries source char-span + doc id. Non-negotiable for audit.
4. Merge strategy. Canonical entity id + relation id + temporal qualifiers; dedup policy.
5. Evaluation. Precision / recall on 200 hand-labelled triples + hallucination-rate on LLM-extracted sample.

Refuse any LLM-based RE pipeline without span verification (source provenance). Refuse open-IE output flowing into a production graph without canonicalization. Flag pipelines with no temporal qualifier on time-bounded relations (employer, spouse, position).
```

##  ejercicios

1. **Easy。**En 5 artículos de noticias-artigos oraciones 上运行 `code/main.py`Extrator de patrones de medio. Precisión de inspección manual.
2. **Medium。**En la misma frase se usa REBEL (REBEL) o LLM (LLM) pequeño (LLM) ⋅ Comparado triples― ¿Qué extractor tiene mayor precisión?
3. **Hard。**Construir AEVS pipeline: utilizar extracto de LLM + 对照 fuente verificar períodos de tiempo.

## 关键术语: "El hombre es un hombre"

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| Triple | Subject-relation-object | `(s, r, o)` tuple，是 KG 的原子单元。 |
| Open IE | Extract anything | 开放词汇 relation phrases；高 recall，低 precision。 |
| Closed ontology | Fixed schema | 有边界的 relation types 集合（Wikidata、UMLS、FIBO）。 |
| Canonicalization | Normalize everything | 将表层名称 / relations 映射到 canonical ids。 |
| AEVS | Grounded extraction | Anchor-Extraction-Verification-Supplement pipeline (2026)。 |
| Provenance | Source-of-truth link | 每个 triple 都携带指向其 source 的 doc id + char-span。 |
| Distant supervision | Cheap labels | 将 text 与现有 KG 对齐，以创建 training data。 |

## 延伸阅读

- [Mintz et al. (2009). Distant supervision for relation extraction without labeled data](https://www.aclweb.org/anthology/P09-1113.pdf) supervisión remota 论文。
- [Huguet Cabot, Navigli (2021). REBEL: Relation Extraction By End-to-end Language generation](https://aclanthology.org/2021.findings-emnlp.204.pdf) secuencia de la RE principal
- [Wadden et al. (2019). Entity, Relation, and Event Extraction with Contextualized Span Representations (DyGIE++)](https://arxiv.org/abs/1909.03546) 联合 IE。
- [AEVS — Anchor-Extraction-Verification-Supplement framework](https://www.mdpi.com/2073-431X/15/3/178) 2026 alucinación-mitigation 设计──
- [Wikidata SPARQL tutorial](https://www.wikidata.org/wiki/Wikidata:SPARQL_tutorial) consultas de gráficos canónicos。
