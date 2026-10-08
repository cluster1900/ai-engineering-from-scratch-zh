# ज्ञान ग्राफ के साथ संबंध निकासी 构建

> NER 找到了实体──实体连接 定了它们──关系提取 找到它们之间的边缘──ज्ञान आलेख 是节点、边和其来源的总和──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 25 (Entity Linking)
**Time:** ~60 分钟

## 问题

分析师读到:"Tim Cook 2011 में Apple के सीईओ बने।" चार तथ्यः

- `(Tim Cook, role, CEO)`
- `(Tim Cook, employer, Apple)`
- `(Tim Cook, start_date, 2011)`
- `(Apple, type, Organization)`

रिलेशन निष्कर्षण (RE) 将自由文本转成结构化三倍 `(subject, relation, object)`                                                                                                                                                                                                                                                              

2026 प्रश्न:एलएलएम बहुत सक्रिय रूप से संबंध खींचते हैं। बहुत सक्रिय हैं। वे भ्रम में पड़ते हैं। स्रोत ग्रंथों का समर्थन नहीं करता है।

## 概念

![Text → triples → knowledge graph](../assets/relation-extraction.svg)

**Triple 形式。** `(subject_entity, relation_type, object_entity)`◊ रिलेशनशिप से आते हैं ontology(विकिडेटा गुण、FIBO、UMLS) या खुला संग्रह(OpenIE 风格, जो भी हो सकता है)

**三种抽取方法。**

1. **Rule / pattern-based。**Hearst पैटर्नः "X जैसे Y" → `(Y, isA, X)`再加手写regex──脆弱──精确──可解释──
2. **Supervised classifier。**给定一个句子中的两个实体提到,从固定集合中预测关系──训练到 TACRED、ACE、KBP──2015-2022 साल के मानक方法──
3. **Generative LLM。**शीघ्र मॉडल 输出三倍──开箱即用── आवश्यकता है, अन्यथा भ्रम होगा, लग seems合理的垃圾内容──

**AEVS (Anchor-Extraction-Verification-Supplement, 2026)。**当前的幻觉 缓解框架:

- **Anchor。**प्रत्येक इकाई अवधि एवं संबंध-वक्त अवधि को सटीक स्थान से पहचानें।
- **Extract。**生成链接到基长度的三倍
- **Verify。**प्रत्येक तीन तत्व को स्रोत पाठ के अनुरूप बनाएँ; किसी भी असमर्थित सामग्री को अस्वीकार करें।
- **Supplement。**कवरेज पास  सुनिश्चित करें कोई एंकरिंग स्पैन नहीं 遗漏──

भ्रामकता में भारी कमी आएगी।

**open-vs-closed 取舍。**

- **Closed ontology。**固定 property list (उदाहरण के लिए, विकिडाटा के 11,000+ गुण) 可预测──可查询──难以凭空编造──
- **Open IE。**任何动词短语都可以成为关系──高回忆──低精度──查询起来混乱──

生产级 KGs आमतौर पर मिश्रित उपयोगः ओपन आईई के साथ खोज करें, फिर संयुक्त रूप से मुख्य ग्राफ में  पहले संबंध को बंद ओंटोलॉजी में कैनोनिकलाइज़ करें。


```figure
relation-triples
```

## 构建

### 步骤 1: 模式 आधारित का निकालना

```python
PATTERNS = [
    (r"(?P<s>[A-Z]\w+) (?:is|was) (?:a|an|the) (?P<o>[A-Z]?\w+)", "isA"),
    (r"(?P<s>[A-Z]\w+) (?:is|was) born in (?P<o>\w+)", "bornIn"),
    (r"(?P<s>[A-Z]\w+) works? (?:at|for) (?P<o>[A-Z]\w+)", "worksAt"),
    (r"(?P<s>[A-Z]\w+) founded (?P<o>[A-Z]\w+)", "founded"),
]
```

查看 `code/main.py`中完整的玩具提取器── श्रवण पैटर्न 仍然会出现在域特定管道中,因为它们可调试──

### 步骤 2: 有监督关系 वर्गीकरण

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification

tok = AutoTokenizer.from_pretrained("Babelscape/rebel-large")
model = AutoModelForSequenceClassification.from_pretrained("Babelscape/rebel-large")

text = "Tim Cook was born in Alabama. He later became CEO of Apple."
encoded = tok(text, return_tensors="pt", truncation=True)
output = model.generate(**encoded, max_length=200)
triples = tok.batch_decode(output, skip_special_tokens=False)
```

REBEL एक अनुक्रम संबंध निकालनेः输入文字,输出 triples,并且已经使用维基数据属性 ids──它在远程监督数据上精细调──标准开权基线──

### 步骤 3: 带 एंकरिंग के LLM-prompted निष्कर्षण

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

प्रत्येक वापसी अवधि को स्रोत के साथ 核对―― अस्वीकार `text[start:end] != triple_entity`इसका परिणाम ः यह न्यूनतम रूप में AEVS "जांच" चरण है।

### चरण 4: बंद ontology में canonicalize करने के लिए

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

कैनोनिकेशन परियोजना के 60-80% कार्य को संचालित करता है।

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

यह प्रत्येक आरएजी-ओवर-केजी प्रणाली के परमाणु एकाइयों में से एक है। आरडीएफ के तीन स्टोरों के साथ, यह एक प्रकार का है।

## 常见陷

- **RE 前先做 coreference。**"उसने एप्पल की स्थापना की"  RE 需要知道 "उसने" 是谁──先运行核心f (पाठ 24)──
- **Entity canonicalization。**"Apple Inc" और "Apple" को एक ही नोड पर हल करना होगा।
- **Hallucinated triples。**LLM 会输出文本不支持的三倍――强制跨度验证――
- **Relation canonicalization drift。**Open IE relations 不一致("जन्म में," "आता है," "आसमान है")──折叠到法典 ids,否则图 无法查询──
- **Temporal errors。**"टाइम कुक एप्पल के सीईओ हैं"  现在为真,2005年为假。许多关系 有时间边界──使用资格(Wikidata 中的 `P580`प्रारंभ समय`P582`अंत समय) 
- **Domain mismatch。**रिबेल विकिपीडिया में प्रशिक्षण, कानून, चिकित्सा और विज्ञान लेख आमतौर पर डोमेन-अच्छी तरह से समायोजित RE मॉडल की आवश्यकता है।

## उपयोग

2026 वर्ष का स्टैकः

| Situation | Pick |
|-----------|------|
| 快速生产、通用 domain | REBEL 或 LlamaPred，并进行 Wikidata canonicalization |
| Domain-specific（biomed、legal） | SciREX-style domain fine-tune + custom ontology |
| LLM-prompted、已审计输出 | AEVS pipeline：anchor → extract → verify → supplement |
| 高容量 news IE | Pattern-based + supervised hybrid |
| 从零构建 KG | Open IE + manual canonicalization pass |
| Temporal KG | 使用 qualifiers 抽取（start/end time、point in time） |

集成模式:NER → कोरफ → इकाई जोड़ने → संबंध निष्कर्षण → ओंटोलॉजी मैपिंग → ग्राफ लोड── प्रत्येक चरण में सभी संभावित गुणस्तर हैं──

## 交付

保存为 `outputs/skill-re-designer.md`:

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

## अभ्यास

1. **Easy。**में 5 条 समाचार-लेख वाक्य 上运行 `code/main.py`मध्य पैटर्न निकालने वाला उपकरण---手工检查精度---
2. **Medium。**REBEL (REBEL) या लघु LLM (Small LLM) का प्रयोग करते हुए एक ही वाक्य में तुलना करें।
3. **Hard。**构建 AEVS पाइपलाइन: LLM अर्क + 对照 स्रोत के साथ स्पैन सत्यापित करें──在 50 条 विकिपीडिया शैली के वाक्य 上测量 सत्यापित करें चरण 前后的幻觉率──

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

- [Mintz et al. (2009). Distant supervision for relation extraction without labeled data](https://www.aclweb.org/anthology/P09-1113.pdf) दूरस्थ पर्यवेक्षण 论文。
- [Huguet Cabot, Navigli (2021). REBEL: Relation Extraction By End-to-end Language generation](https://aclanthology.org/2021.findings-emnlp.204.pdf) अनुक्रम  मुख्य शक्ति योजना
- [Wadden et al. (2019). Entity, Relation, and Event Extraction with Contextualized Span Representations (DyGIE++)](https://arxiv.org/abs/1909.03546) 联合 IE。
- [AEVS — Anchor-Extraction-Verification-Supplement framework](https://www.mdpi.com/2073-431X/15/3/178) 2026 भ्रम-शमन 设计──
- [Wikidata SPARQL tutorial](https://www.wikidata.org/wiki/Wikidata:SPARQL_tutorial) कैनोनिक ग्राफ क्वेरीएँ。
