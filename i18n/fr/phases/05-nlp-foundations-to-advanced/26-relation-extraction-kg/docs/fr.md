# Réseau extraction et le Graphe de connaissance

> NER 找到了实体──entité liant 定了它们──extraction de relation 找到它们之间的边缘──Knowledge Graph 是节点、边和其来源的总和──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 25 (Entity Linking)
**Time:** ~60 分钟

##  problématique

分析师读到:"Tim Cook est devenu PDG d'Apple en 2011".

- `(Tim Cook, role, CEO)`
- `(Tim Cook, employer, Apple)`
- `(Tim Cook, start_date, 2011)`
- `(Apple, type, Organization)`

Relation Extraction (RE) 将自由文本转成结构化三倍 `(subject, relation, object)` Après l'agrégation des différents éléments, vous avez le Graphe des connaissances.

Les LLM seront très activement attirés par les relations. Ils seront très actives. Ils hallucineront des triplets.

## 概念

![Text → triples → knowledge graph](../assets/relation-extraction.svg)

**Triple 形式。** `(subject_entity, relation_type, object_entity)` Relations de la propriétés de Wikipédia, FIBO, UMLS) ou open collection (OpenIE, tout ce qui peut être)

**三种抽取方法。**

1. **Rule / pattern-based。**Modèles Hearst: "X comme Y" → `(Y, isA, X)`Il est très difficile de comprendre ce que cela signifie.
2. **Supervised classifier。**给定一个句子中的两个实体提到,从固定集合中预测关系──训练到TACRED、ACE、KBP──2015-2022 年的标准方法──
3. **Generative LLM。**Rapide modèle 输出 triples──开箱即用── nécessite une provenance, sinon il va halluciner 看似合理的垃圾内容──

**AEVS (Anchor-Extraction-Verification-Supplement, 2026)。**La situation actuelle de l'hallucination est déséquilibrée.

- **Anchor。**Utilisez une position précise pour identifier chaque espace d'entité et la relation-phrase.
- **Extract。**生成链接到基长度的三倍――
- **Verify。**Résoudre les problèmes de l'information et de la communication.
- **Supplement。**Pas de couverture  assurer qu'il n'y a pas d'espace ancré  遗漏。

Les hallucinations vont diminuer considérablement.

**open-vs-closed 取舍。**

- **Closed ontology。**Liste de propriétés fixes                                                                                                                                                                                                                                                           
- **Open IE。**Toutes les expressions peuvent être associées à des relations.

生产级 KGs usualmente mixed usage: utiliser Open IE faire la découverte, puis en combiner dans le graphique principal 之前将关系 canonize到闭合 ontology。


```figure
relation-triples
```

## Construction

### 步骤 1: 基于 des schémas de tirage

```python
PATTERNS = [
    (r"(?P<s>[A-Z]\w+) (?:is|was) (?:a|an|the) (?P<o>[A-Z]?\w+)", "isA"),
    (r"(?P<s>[A-Z]\w+) (?:is|was) born in (?P<o>\w+)", "bornIn"),
    (r"(?P<s>[A-Z]\w+) works? (?:at|for) (?P<o>[A-Z]\w+)", "worksAt"),
    (r"(?P<s>[A-Z]\w+) founded (?P<o>[A-Z]\w+)", "founded"),
]
```

Regardez !`code/main.py`Le modèle d'écoute est toujours présent dans les pipelines spécifiques à un domaine, car il est modifiable.

### 步骤 2: Une classification de la surveillance

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification

tok = AutoTokenizer.from_pretrained("Babelscape/rebel-large")
model = AutoModelForSequenceClassification.from_pretrained("Babelscape/rebel-large")

text = "Tim Cook was born in Alabama. He later became CEO of Apple."
encoded = tok(text, return_tensors="pt", truncation=True)
output = model.generate(**encoded, max_length=200)
triples = tok.batch_decode(output, skip_special_tokens=False)
```

REBEL est un extracteur de relation de séquence:输入 text,输出 triples, et déjà utilisé les ids de propriété de Wikidata. Il est dans les données de supervision à distance.

### 步骤 3: extraction de l'ancrage avec une MLL

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

Retourner à chaque période de retour avec la source 核对― refuser quoi que ce soit `text[start:end] != triple_entity`Ceci est la plus petite étape de " vérification " de l'AEVS.

### Étape 4: canonize à ontologie fermée

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

La canonisation occupe habituellement 60 à 80% du travail de construction.

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

C'est chaque élément de système RAG-over-KG. Avec des magasins triple RDF, les graphes de propriété neo4j ou les graphes augmentés par vecteur peuvent être étendus.

## 常见陷

- **RE 前先做 coreference。**"Il a fondé Apple"  RE 需要知道 "il" 是谁──先运行核心f24课程──
- **Entity canonicalization。**"Apple Inc" et "Apple" doivent être résolus à un même nœud.
- **Hallucinated triples。**Les LLM seront en double de contrôle obligatoire de la durée de validation.
- **Relation canonicalization drift。**Ouverture de relations IE 不一致("est né en"," "est né de"," "est un natif de")。折叠到 canoniques ids,否则 graph 无法查询。
- **Temporal errors。**"Tim Cook est le PDG d'Apple"  现在为真,2005年为假。许多关系 有时间边界──使用资格(Wikidata 中的 `P580`heure de début,`P582`heure de fin) 
- **Domain mismatch。**REBEL dans Wikipédia 上訓練──法律、医学和科学文本 généralement nécessite des modèles RE bien ajustés du domaine──

## Utilisation

Stack de l'année 2026:

| Situation | Pick |
|-----------|------|
| 快速生产、通用 domain | REBEL 或 LlamaPred，并进行 Wikidata canonicalization |
| Domain-specific（biomed、legal） | SciREX-style domain fine-tune + custom ontology |
| LLM-prompted、已审计输出 | AEVS pipeline：anchor → extract → verify → supplement |
| 高容量 news IE | Pattern-based + supervised hybrid |
| 从零构建 KG | Open IE + manual canonicalization pass |
| Temporal KG | 使用 qualifiers 抽取（start/end time、point in time） |

集成模式:NER → coref → entité liant → relation extraction → mapping ontologie → chargement graphique── chaque étape sont des potentiels de qualité──

## 交付

保存为 `outputs/skill-re-designer.md`- Le numéro de la liste:

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

1. **Easy。**Dans 5 articles de nouvelles, les phrases sont en cours de rédaction.`code/main.py`Extruder des motifs de l'intérieur.
2. **Medium。**Dans la même phrase, utilisez REBEL (ou petit LLM) ⋅ Comparer à trois fois ⋅ Quel extracteur a une plus grande précision ?
3. **Hard。**Construire un pipeline AEVS: utiliser un extrait de LLM + pour vérifier la source de contrôle.

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

- [Mintz et al. (2009). Distant supervision for relation extraction without labeled data](https://www.aclweb.org/anthology/P09-1113.pdf) supervision à distance 论文。
- [Huguet Cabot, Navigli (2021). REBEL: Relation Extraction By End-to-end Language generation](https://aclanthology.org/2021.findings-emnlp.204.pdf) seq2seq RE 主力方案。
- [Wadden et al. (2019). Entity, Relation, and Event Extraction with Contextualized Span Representations (DyGIE++)](https://arxiv.org/abs/1909.03546) 联合 IE。
- [AEVS — Anchor-Extraction-Verification-Supplement framework](https://www.mdpi.com/2073-431X/15/3/178) 2026 hallucination-atténuation 设计──
- [Wikidata SPARQL tutorial](https://www.wikidata.org/wiki/Wikidata:SPARQL_tutorial) requêtes de graphes canoniques。
