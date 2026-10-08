# 与知识抽取关系图构建

> 发现实体. 实体连接. 确定它们. 关系抽取. 找到它们之间的边缘.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 25 (Entity Linking)
**Time:** ~60 分钟

## 问题

分析师读到:"蒂姆·库克于2011年成为果公司的首席执行官.

- `(Tim Cook, role, CEO)`
- `(Tim Cook, employer, Apple)`
- `(Tim Cook, start_date, 2011)`
- `(Apple, type, Organization)`

关系提取 (RE) 将自由文本转化为结构化三倍`(subject, relation, object)`△跨语料聚合后,你就有了知识图.

2026年问题:LLMs会非常积极地抽取关系――过于积极――它们会幻觉 源文本不支持的三倍――没有来源,你无法分辨真实三倍和似乎合理的虚构内容――2026年答案是AEVS风格的和验证管道――

## 概念

![Text → triples → knowledge graph](../assets/relation-extraction.svg)

**Triple 形式。** `(subject_entity, relation_type, object_entity)`◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎

**三种抽取方法。**

1. **Rule / pattern-based。**赫斯特模式:"X如Y" → `(Y, isA, X)` 再加手写 regex 脆弱 精确 可解释
2. **Supervised classifier。**给定一个句子中的两个实体提到,从固定集合中预测关系――训练到TACRED、ACE、KBP──2015-2022年标准方法──
3. **Generative LLM。**快速模型 输出三倍――开箱即用――需要来源,否则会产生幻觉看似合理的垃圾内容――

**AEVS (Anchor-Extraction-Verification-Supplement, 2026)。**当前的幻觉缓解框架:

- **Anchor。**用精确位置识别每个实体跨度和关系短语跨度.
- **Extract。**生成链接到杆跨度的三倍.
- **Verify。**将每个三元元素匹配回源文本;拒绝任何不支持的内容.
- **Supplement。**覆盖卡 确保没有扎的跨度 被遗漏.

幻觉会大幅下降.需要更多的计算,但可审计.

**open-vs-closed 取舍。**

- **Closed ontology。**固定物业名单 (例如,维基数据的11000+个物业) 可预测可查询难以凭空编制
- **Open IE。**任何动词短语都可以成为关系――高回忆――低精度――查询起来混乱――

生产级KGs通常混合使用:使用开放IE做发现,然后在合并进主图中 之前将关系定向到关闭的 ontology。


```figure
relation-triples
```

## 构建

### 步骤1:基于模式的抽取

```python
PATTERNS = [
    (r"(?P<s>[A-Z]\w+) (?:is|was) (?:a|an|the) (?P<o>[A-Z]?\w+)", "isA"),
    (r"(?P<s>[A-Z]\w+) (?:is|was) born in (?P<o>\w+)", "bornIn"),
    (r"(?P<s>[A-Z]\w+) works? (?:at|for) (?P<o>[A-Z]\w+)", "worksAt"),
    (r"(?P<s>[A-Z]\w+) founded (?P<o>[A-Z]\w+)", "founded"),
]
```

查看`code/main.py`中完整的玩具提取器──听力模式仍然会出现在域特定的管道中,因为它们可以调试──

### 步骤2: 有监督关系 分类

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification

tok = AutoTokenizer.from_pretrained("Babelscape/rebel-large")
model = AutoModelForSequenceClassification.from_pretrained("Babelscape/rebel-large")

text = "Tim Cook was born in Alabama. He later became CEO of Apple."
encoded = tok(text, return_tensors="pt", truncation=True)
output = model.generate(**encoded, max_length=200)
triples = tok.batch_decode(output, skip_special_tokens=False)
```

REBEL 是一个连续关系提取器:输入文本,输出三倍,并且已经使用维基数据属性ID. 它在远程监督数据上进行了细节调整.

### 步骤3: 带的LLM促成提取

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

将每个回报的时间与源源 核对――拒绝任何`text[start:end] != triple_entity`结果──这是 AEVS"验证"步骤的最小形式──

### 步骤 4:可纳纳化到关闭的学

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

纳化往往占工程工作的60至80%──要为其预留预算──

### 步骤5: 构建一个小图并查询

```python
triples = extract(text)
graph = {}
for s, r, o in triples:
    graph.setdefault(s, []).append((r, o))


def neighbors(node, relation=None):
    return [(r, o) for r, o in graph.get(node, []) if relation is None or r == relation]


print(neighbors("Tim Cook", relation="P108"))    # -> [(P108, Apple)]
```

这是每个RAG-over-KG系统的原子单元――使用RDF三重存储器 (RDF三重存储器) 蓝图图,虚拟图,物质图,Neo4j或向量增强图库扩展它――

## 常见陷

- **RE 前先做 coreference。**他创立了果. 他是谁?
- **Entity canonicalization。**果公司和果公司必须分为同一个节点.
- **Hallucinated triples。**法律法规会输出文本不支持的三倍.
- **Relation canonicalization drift。**开放IE关系 不一致("出生于","来自","是原生")──折叠到正文标识,否则图图无法查询──
- **Temporal errors。**"蒂姆·库克是果公司的首席执行官"  现在为真,2005年为假.`P580`开始时间`P582`终点时间) 』
- **Domain mismatch。**乱在维基百科上训练――法律、医学和科学文本通常需要域名精确调节的RE模型――

## 使用

2026 年的堆:

| Situation | Pick |
|-----------|------|
| 快速生产、通用 domain | REBEL 或 LlamaPred，并进行 Wikidata canonicalization |
| Domain-specific（biomed、legal） | SciREX-style domain fine-tune + custom ontology |
| LLM-prompted、已审计输出 | AEVS pipeline：anchor → extract → verify → supplement |
| 高容量 news IE | Pattern-based + supervised hybrid |
| 从零构建 KG | Open IE + manual canonicalization pass |
| Temporal KG | 使用 qualifiers 抽取（start/end time、point in time） |

集成模式:NER → coref →实体链接 →关系提取 → ontology mapping →图形负载――每一阶段都是潜在质量门――

## 交付

保存为`outputs/skill-re-designer.md`其他:

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

1. **Easy。**在 5 条新闻文章句子上运行`code/main.py`中的图案提取器――手工检查精度――
2. **Medium。**在同一句话中使用REBEL (或小型LLM) 比三倍.哪个提取器更精确?更高的回忆?
3. **Hard。**构建AEVS管道:使用LLM摘录 +对照来源验证跨度──在50条维基百科类句子上测量验证步骤 前后的幻觉率──

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

- [Mintz et al. (2009). Distant supervision for relation extraction without labeled data](https://www.aclweb.org/anthology/P09-1113.pdf)远程监督论文
- [Huguet Cabot, Navigli (2021). REBEL: Relation Extraction By End-to-end Language generation](https://aclanthology.org/2021.findings-emnlp.204.pdf)后续 RE 主力方案
- [Wadden et al. (2019). Entity, Relation, and Event Extraction with Contextualized Span Representations (DyGIE++)](https://arxiv.org/abs/1909.03546) 联合 IE。
- [AEVS — Anchor-Extraction-Verification-Supplement framework](https://www.mdpi.com/2073-431X/15/3/178) 2026幻觉减轻设计
- [Wikidata SPARQL tutorial](https://www.wikidata.org/wiki/Wikidata:SPARQL_tutorial)可信图表查询──
