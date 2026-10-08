# İlişki Çekim ve Bilgi Grafi  yapılandırma

> NER 找到了实体──实体连接──它们定定了──关系提取──它们之间的边找到──知识图是节点、边和其来源的总和──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 25 (Entity Linking)
**Time:** ~60 分钟

## 问题

分析师读到:"Tim Cook 2011 yılında Apple'ın CEO'su oldu".

- `(Tim Cook, role, CEO)`
- `(Tim Cook, employer, Apple)`
- `(Tim Cook, start_date, 2011)`
- `(Apple, type, Organization)`

İlişki Çekimi (RE) 将自由文本转成结构化三倍 `(subject, relation, object)`❖ Sözcükler arasında bir araya gelince, Bilgi Grafiğine sahip olursunuz.

2026 yılının sorusu: LLM'ler çok aktif bir şekilde ilişkiler çekmektedir. Çok olumlu. Onlar halüsinasyonlar yapar.

## 概念

![Text → triples → knowledge graph](../assets/relation-extraction.svg)

**Triple 形式。** `(subject_entity, relation_type, object_entity)` İlişkiler  Özgür bir kitle, her şey olabilir)

**三种抽取方法。**

1. **Rule / pattern-based。**Hearst kalıpları:"X gibi Y" → `(Y, isA, X)`❖ 再加手写regex──脆弱、精确、可解释──
2. **Supervised classifier。**给定一个句中两个实体的提及,从固定集合中预测关系──训练到 TACRED、ACE、KBP──2015-2022 年的标准方法──
3. **Generative LLM。**Hızlı model 输出 triples──开箱即用──需要来源,否则会幻觉看似合理的垃圾内容──

**AEVS (Anchor-Extraction-Verification-Supplement, 2026)。**Şimdiki halüsinasyonlar 缓解框架:

- **Anchor。**Her bir varlık aralığını ve ilişki-söz aralığını doğru bir şekilde tanımlamak için kullanın.
- **Extract。**生成链接到基 长度的三倍――
- **Verify。**Her üç elementin kaynağa uygun olması; desteklenmeyen herhangi bir içeriği reddetmek.
- **Supplement。**Kapsamlılık geçitleri                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

Halüsinasyonlar çok azalır. Daha fazla hesaplama gerekiyor. Ama kontrol edilebilir.

**open-vs-closed 取舍。**

- **Closed ontology。**固定 property list (örneğin Wikidata'nın 11.000+ mülkiyeti) 可预测──可查询──难以凭空编造──
- **Open IE。**动词短语都可以成为关系──高回忆──低精度──查询起来混乱──

生产级 KGs genellikle karışık kullanımı: Open IE ile bulma, sonra ortak birleşme içinde ana grafik  önce ilişkiler kapanmış ontolojiye kanonize olacaktır。


```figure
relation-triples
```

## Yapım

### 步骤 1: 基于模式的抽取

```python
PATTERNS = [
    (r"(?P<s>[A-Z]\w+) (?:is|was) (?:a|an|the) (?P<o>[A-Z]?\w+)", "isA"),
    (r"(?P<s>[A-Z]\w+) (?:is|was) born in (?P<o>\w+)", "bornIn"),
    (r"(?P<s>[A-Z]\w+) works? (?:at|for) (?P<o>[A-Z]\w+)", "worksAt"),
    (r"(?P<s>[A-Z]\w+) founded (?P<o>[A-Z]\w+)", "founded"),
]
```

- Bakın .`code/main.py`İçinde tam oyuncak çıkarıcıları vardır. Duyuru örneği hala alan-specifik borularda ortaya çıkar. Çünkü onlar düzeltilebilir.

### 步骤 2: 有监督关系 sınıflandırma

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification

tok = AutoTokenizer.from_pretrained("Babelscape/rebel-large")
model = AutoModelForSequenceClassification.from_pretrained("Babelscape/rebel-large")

text = "Tim Cook was born in Alabama. He later became CEO of Apple."
encoded = tok(text, return_tensors="pt", truncation=True)
output = model.generate(**encoded, max_length=200)
triples = tok.batch_decode(output, skip_special_tokens=False)
```

REBEL bir seküden seküden ilişki çıkarıcısıdır:输入文,输出三倍,并且已经使用维基数据属性 ids──它在远程监督数据上精细调──标准开权基线──

### 3 adım: Ankerleme ile LLM ile yapılan çıkarım

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

Her geri dönüş süreci ve kaynağı 核对──拒绝任何`text[start:end] != triple_entity`Sonuç: Bu, AEVS'in en küçük biçimindeki "tutar" adımıdır.

### 4 adım: kapatılmış ontolojiye kanonikleştir

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

Kanonizasyon, inşaat işinin %60-80%'ini oluşturuyor.

### 5 adım: Küçük bir grafik oluşturun ve sorgu sorun

```python
triples = extract(text)
graph = {}
for s, r, o in triples:
    graph.setdefault(s, []).append((r, o))


def neighbors(node, relation=None):
    return [(r, o) for r, o in graph.get(node, []) if relation is None or r == relation]


print(neighbors("Tim Cook", relation="P108"))    # -> [(P108, Apple)]
```

Bu her RAG-over-KG sisteminin atom birimidir. RDF üçlü depoları kullanıyor.

## 常见陷

- **RE 前先做 coreference。**"Apple'ı kurdu"  RE 需要知道 "he" 是谁──先运行核心f (Deneyin başı)
- **Entity canonicalization。**"Apple Inc" ve "Apple" ı aynı düğmeye çözmek gerekir.
- **Hallucinated triples。**LLM'ler, üç katı verifikasyon yaptırmak için geçerlidir.
- **Relation canonicalization drift。**Açık IE ilişkiler 不一致("doğuştu," "doğuştu," "doğuştu")。折叠到 kanonik kimlikler,否则图 无法查询。
- **Temporal errors。**"Tim Cook Apple'ın CEO'su"  现在为真,2005年为假。许多关系 有时间边界──使用资格(Wikidata 中的 `P580`Başlama zamanı`P582`Son zamanı) 』
- **Domain mismatch。**REBEL Wikipedia'da eğitimli olarak yayımlanan kanun, tıp ve bilim makalelerinde genellikle alanlardaki ince ayarlanmış RE modelleri gerekmektedir.

## kullanımı

2026 yılının birimi:

| Situation | Pick |
|-----------|------|
| 快速生产、通用 domain | REBEL 或 LlamaPred，并进行 Wikidata canonicalization |
| Domain-specific（biomed、legal） | SciREX-style domain fine-tune + custom ontology |
| LLM-prompted、已审计输出 | AEVS pipeline：anchor → extract → verify → supplement |
| 高容量 news IE | Pattern-based + supervised hybrid |
| 从零构建 KG | Open IE + manual canonicalization pass |
| Temporal KG | 使用 qualifiers 抽取（start/end time、point in time） |

集成模式:NER → coref → entite bağlantısı → ilişki çıkarımı → ontoloji haritası → grafik yükü── her aşama potansiyel质量门──

## 交付

保存为 `outputs/skill-re-designer.md`- ...

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

1. **Easy。**5 haber makale cümleleri 上运行 `code/main.py`Orta örneği çıkarıcılı.
2. **Medium。**REBEL veya küçük LLM kullanmak için aynı cümleyi kullanın.
3. **Hard。**构建 AEVS管线: LLM ekstraktı + 对照源で                                                                                                                                                                                                                                                      

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

- [Mintz et al. (2009). Distant supervision for relation extraction without labeled data](https://www.aclweb.org/anthology/P09-1113.pdf) Uzak denetim 论文。
- [Huguet Cabot, Navigli (2021). REBEL: Relation Extraction By End-to-end Language generation](https://aclanthology.org/2021.findings-emnlp.204.pdf)                                                                                                                                                                                                                                                              
- [Wadden et al. (2019). Entity, Relation, and Event Extraction with Contextualized Span Representations (DyGIE++)](https://arxiv.org/abs/1909.03546) 联合 IE。
- [AEVS — Anchor-Extraction-Verification-Supplement framework](https://www.mdpi.com/2073-431X/15/3/178)2026 Halüsinasyon-Düzeltme デザイン。
- [Wikidata SPARQL tutorial](https://www.wikidata.org/wiki/Wikidata:SPARQL_tutorial) kanonik grafik sorguları。
