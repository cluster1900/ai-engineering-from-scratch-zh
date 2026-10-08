# Relação Extração com o Grafico de Conhecimento  Construção

> NER 找到了实体──Entity linking 定了它们──Relação extração 找到它们之间的边──Knowledge Graph 是节点、边和其来源的总和──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 25 (Entity Linking)
**Time:** ~60 分钟

## 问题

分析师读到:"Tim Cook tornou-se CEO da Apple em 2011."

- `(Tim Cook, role, CEO)`
- `(Tim Cook, employer, Apple)`
- `(Tim Cook, start_date, 2011)`
- `(Apple, type, Organization)`

Relação Extração (RE) 将自由文本转成结构化三倍 `(subject, relation, object)` Depois da aglomeração de linguagens, você já tem o Grafico de Conhecimento.

A resposta para o ano 2026 é que os sistemas de análise de dados são os principais elementos que podem ser utilizados para a análise de dados.

## 概念

![Text → triples → knowledge graph](../assets/relation-extraction.svg)

**Triple 形式。** `(subject_entity, relation_type, object_entity)`Relações de origem de ontologia ((propriedades de Wikidata、FIBO、UMLS) ou open collection ((OpenIE 风格, qualquer coisa pode ser)

**三种抽取方法。**

1. **Rule / pattern-based。**Padrões Hearst:"X como Y" → `(Y, isA, X)`◊ re-clicar regex― fragilidade―精确―可解释―
2. **Supervised classifier。**给定一个句子中的两个实体提及,从固定集合中预测关系──训练到 TACRED、ACE、KBP──2015-2022 年的标准方法──
3. **Generative LLM。**Modelo rápido 输出三倍──开箱即用── necessita de proveniência, senão vai alucinar parece-se razoável lixo contêin­to──

**AEVS (Anchor-Extraction-Verification-Supplement, 2026)。**Agora, a minha alucinação é muito mais difícil.

- **Anchor。**Usar a identificação de cada unidade de espaço e de uma relação de frase.
- **Extract。**生成链接到 ancora spans 的三倍──
- **Verify。**Rejeitar qualquer conteúdo não apoiado.
- **Supplement。**Passagem de cobertura  assegurar que não haja espaço ancorado 被遗漏──

As alucinações vão diminuir muito.

**open-vs-closed 取舍。**

- **Closed ontology。**Lista de propriedades fixas (por exemplo, 11 mil propriedades do Wikidata) 可预测可查询难以凭空编造
- **Open IE。**Qualquer palavra em inglês pode ser relacionada.

KGs de classe de produção geralmente misturados: com Open IE fazer descoberta, então em conjunto em gráfico principal  antes de relacionamentos canonizar para ontologia fechada。


```figure
relation-triples
```

## Construção

### 步骤 1: 基于模式的抽取

```python
PATTERNS = [
    (r"(?P<s>[A-Z]\w+) (?:is|was) (?:a|an|the) (?P<o>[A-Z]?\w+)", "isA"),
    (r"(?P<s>[A-Z]\w+) (?:is|was) born in (?P<o>\w+)", "bornIn"),
    (r"(?P<s>[A-Z]\w+) works? (?:at|for) (?P<o>[A-Z]\w+)", "worksAt"),
    (r"(?P<s>[A-Z]\w+) founded (?P<o>[A-Z]\w+)", "founded"),
]
```

- Não .`code/main.py`O sistema de extração de brinquedos é um sistema de extração de brinquedos.

### 步骤 2: 有监督关系 Classificação

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification

tok = AutoTokenizer.from_pretrained("Babelscape/rebel-large")
model = AutoModelForSequenceClassification.from_pretrained("Babelscape/rebel-large")

text = "Tim Cook was born in Alabama. He later became CEO of Apple."
encoded = tok(text, return_tensors="pt", truncation=True)
output = model.generate(**encoded, max_length=200)
triples = tok.batch_decode(output, skip_special_tokens=False)
```

REBEL é um extrator de relações de sequência:输入文本,输出三倍,并且已经使用维基数据属性 ids──它在远程监督数据上精细调──标准开权基线──

### 步骤 3: Extração de LLM-promptada de ancoragem

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

Vai dar cada volta de volta com a fonte nuclear.`text[start:end] != triple_entity`O resultado é o mínimo da forma AEVS "verificar" passo.

### 步骤 4: canonizar para ontologia fechada

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

A canonização ocupa 60 a 80% do trabalho de construção.

### 步骤 5: 构建一个小图并查询

```python
triples = extract(text)
graph = {}
for s, r, o in triples:
    graph.setdefault(s, []).append((r, o))


def neighbors(node, relation=None):
    return [(r, o) for r, o in graph.get(node, []) if relation is None or r == relation]


print(neighbors("Tim Cook", relation="P108"))    # -> [(P108, Apple)]
```

É cada RAG-over-KG sistema de átomos uní­ones. Usar RDF triple stores. Blazegraph, Virtuoso, Property graphs, Neo4j, Vector-augmented graph stores.

## 常见陷

- **RE 前先做 coreference。**"Ele fundou a Apple"  RE 需要知道 "ele" 是谁──先运行核心f (Lessão 24)──
- **Entity canonicalization。**"Apple Inc" e "Apple" ▌devem ser resolvidos para o mesmo nó── primeiro fazer entidade ligando (leção 25)──
- **Hallucinated triples。**LLM 会输出文本不支持的三倍――verificação de prazos obrigatórios――
- **Relation canonicalization drift。**Relações de IE Não concordam, "nasceu em, " " veio de, " " " é um nativo de")
- **Temporal errors。**"Tim Cook é CEO da Apple"  现在为真,2005年为假。许多关系 有时间边界──使用资格(Wikidata 中的 `P580`hora de início,`P582`Tempo de fim) ⋅
- **Domain mismatch。**REBEL em Wikipedia 上訓練──法律、医学和科学文本 geralmente requer modelos RE-finamente sintonizados em domínio──

## Utilização

Estaca de 2026:

| Situation | Pick |
|-----------|------|
| 快速生产、通用 domain | REBEL 或 LlamaPred，并进行 Wikidata canonicalization |
| Domain-specific（biomed、legal） | SciREX-style domain fine-tune + custom ontology |
| LLM-prompted、已审计输出 | AEVS pipeline：anchor → extract → verify → supplement |
| 高容量 news IE | Pattern-based + supervised hybrid |
| 从零构建 KG | Open IE + manual canonicalization pass |
| Temporal KG | 使用 qualifiers 抽取（start/end time、point in time） |

集成模式:NER → coref → entidade ligando → extração de relações → mapping ontologia → carga gráfica── cada fase são potenciais质量门──

## 交付

保存为 `outputs/skill-re-designer.md`- Não .

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

## 练习

1. **Easy。**Em 5 条 notícias-artigo frases 上运行 `code/main.py`Extrator de padrões de uso interno.
2. **Medium。**Em mesma frase, use REBEL (ou pequeno LLM) ⋅ Comparar triples― Qual extractor tem maior precisão? maior recall?
3. **Hard。**Construir o pipeline AEVS: usar extracto de LLM + 对照 source verificar extensões。 em 50 条 Wikipedia-style sentenças 上测量 verificar passo 前后的幻觉率。

## 关键术语

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

- [Mintz et al. (2009). Distant supervision for relation extraction without labeled data](https://www.aclweb.org/anthology/P09-1113.pdf) supervisão à distância 论文。
- [Huguet Cabot, Navigli (2021). REBEL: Relation Extraction By End-to-end Language generation](https://aclanthology.org/2021.findings-emnlp.204.pdf) sequência RE 主力方案──
- [Wadden et al. (2019). Entity, Relation, and Event Extraction with Contextualized Span Representations (DyGIE++)](https://arxiv.org/abs/1909.03546) 联合 IE。
- [AEVS — Anchor-Extraction-Verification-Supplement framework](https://www.mdpi.com/2073-431X/15/3/178)2026 Alucinação- mitigação デザイン。
- [Wikidata SPARQL tutorial](https://www.wikidata.org/wiki/Wikidata:SPARQL_tutorial) consultas de gráficos canônicos。
