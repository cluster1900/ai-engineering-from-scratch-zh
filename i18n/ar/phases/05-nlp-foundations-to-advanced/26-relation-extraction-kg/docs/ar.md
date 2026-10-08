# العلاقة استخراج مع الرسم البياني المعرفة

> NER 找到了实体──实体连接 定了它们──关系提取 找到它们之间的边缘──知识图是节点、边和其来源的总和──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 25 (Entity Linking)
**Time:** ~60 分钟

## 问题

"تيم كوك أصبح الرئيس التنفيذي لأبل في عام 2011".

- `(Tim Cook, role, CEO)`
- `(Tim Cook, employer, Apple)`
- `(Tim Cook, start_date, 2011)`
- `(Apple, type, Organization)`

الإستخرج العلاقة (RE) 将自由文本转成结构化三倍`(subject, relation, object)`بعد جمع المواد عبر اللغة، لديك الرسم البياني المعرفة.

سؤال عام 2026: سوف تكون الجامعات ذات علاقات فعالة جدا. ستكون ذات علاقات فعالة جدا. سوف تكون ذات هلوسة.

## 概念

![Text → triples → knowledge graph](../assets/relation-extraction.svg)

**Triple 形式。** `(subject_entity, relation_type, object_entity)`العلاقات من تأسيس ويكيديتا خصائص فيبو أو أم إل) أو مجموعة مفتوحة

**三种抽取方法。**

1. **Rule / pattern-based。**أنماط Hearst:"X مثل Y" → `(Y, isA, X)`◊再加手写regex‬ 脆弱‬ 精确‬ 可解释‬
2. **Supervised classifier。**给定一个句子中的两个实体提到,从固定集合中预测关系──训练到TACRED、ACE、KBP──2015-2022 年的标准方法──
3. **Generative LLM。**النموذج السريع 输出三倍──开箱即用──需要来源,否则会幻觉看似合理的垃圾内容──

**AEVS (Anchor-Extraction-Verification-Supplement, 2026)。**حاليّة الهلوسة 缓解框架:

- **Anchor。**استخدام الموقع المحدد لتحديد كل فترة الكيان و فترة العلاقة- الجملة
- **Extract。**生成链接到 ancor spans 的三倍──
- **Verify。**تطبيق كل عنصر ثلاثي مع النص المصدر ؛ رفض أي محتوى غير مدعوم.
- **Supplement。**مرسل تغطية  ضمان عدم وجود فترة ركبة 被遗漏──

الهلوسة سوف تنخفض بشكل كبير.

**open-vs-closed 取舍。**

- **Closed ontology。**قائمة العقارات الثابتة (مثل 11000+ من العقارات في ويكيديتا)
- **Open IE。**أيّة صيغة قصيرة يمكن أن تصبح علاقة.

生产级 KGs عادة اختلط استخدام: مع IE مفتوحة القيام بالاكتشاف، ثم في المجموعة المشتركة في الرسم البياني الرئيسي  قبل أن تكون العلاقات القانونيكية إلى المنظمة المغلقة。


```figure
relation-triples
```

## الإنشاء

### الخطوة 1: استنتاج على أساس النمط

```python
PATTERNS = [
    (r"(?P<s>[A-Z]\w+) (?:is|was) (?:a|an|the) (?P<o>[A-Z]?\w+)", "isA"),
    (r"(?P<s>[A-Z]\w+) (?:is|was) born in (?P<o>\w+)", "bornIn"),
    (r"(?P<s>[A-Z]\w+) works? (?:at|for) (?P<o>[A-Z]\w+)", "worksAt"),
    (r"(?P<s>[A-Z]\w+) founded (?P<o>[A-Z]\w+)", "founded"),
]
```

查看 `code/main.py`中完整的玩具提取器──                                                                                                                                                                                                                                                          

### الخطوة الثانية:

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification

tok = AutoTokenizer.from_pretrained("Babelscape/rebel-large")
model = AutoModelForSequenceClassification.from_pretrained("Babelscape/rebel-large")

text = "Tim Cook was born in Alabama. He later became CEO of Apple."
encoded = tok(text, return_tensors="pt", truncation=True)
output = model.generate(**encoded, max_length=200)
triples = tok.batch_decode(output, skip_special_tokens=False)
```

REBEL هو إستخراج علاقة متتالية:输入文本,输出 triples,并且已经使用维基数据属性 ids──它在远程监督数据上精细调──标准开权基线──

### الخطوة 3: استخراج المهارات المُساعدة في الـ LLM

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

ستقوم كل مرة أخرى مع المصدر`text[start:end] != triple_entity`نتيجة: هذا هو الحد الأدنى من أشكال خطوة "التحقق" AEVS

### الخطوة 4: القنوني إلى المنظمة المغلقة

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

التشريح يحتوي على 60 إلى 80٪ من أعمال البناء.

### الخطوة 5: قم ببناء الرسم البياني الصغير و قم بالتحقيق

```python
triples = extract(text)
graph = {}
for s, r, o in triples:
    graph.setdefault(s, []).append((r, o))


def neighbors(node, relation=None):
    return [(r, o) for r, o in graph.get(node, []) if relation is None or r == relation]


print(neighbors("Tim Cook", relation="P108"))    # -> [(P108, Apple)]
```

هذا كل نظام RAG-over-KG من عناصر الوحدة. باستخدام مخازن ثلاثية RDF.

## 常见陷

- **RE 前先做 coreference。**"لقد أسس آبل"  RE 需要知道 "هو" 是谁──先运行核心f
- **Entity canonicalization。**"آبل" و "آبل" يجب أن يتم حل إلى نفس العقدة.
- **Hallucinated triples。**الـ LLM 会输出文本不支持的三倍―― إضطراب التحقق من فترة المدى――
- **Relation canonicalization drift。**العلاقات IE غير متوافقة (("ولد في،" "أتى من،" "من هو أصل")。折叠到 صناعية الهويات،否则图图 无法查询。
- **Temporal errors。**"تيم كوك هو الرئيس التنفيذي لشركة آبل"  现在为真,2005年为假。许多关系 有时间边界──使用资格(Wikidata 中的 `P580`وقت البدء`P582`وقت النهاية)
- **Domain mismatch。**تمارين في ويكيبيديا. قانون 医学和科学文本 عادة ما تتطلب نماذج RE المحددة في مجال النطاقات.

## استخدام

2026 سنة:

| Situation | Pick |
|-----------|------|
| 快速生产、通用 domain | REBEL 或 LlamaPred，并进行 Wikidata canonicalization |
| Domain-specific（biomed、legal） | SciREX-style domain fine-tune + custom ontology |
| LLM-prompted、已审计输出 | AEVS pipeline：anchor → extract → verify → supplement |
| 高容量 news IE | Pattern-based + supervised hybrid |
| 从零构建 KG | Open IE + manual canonicalization pass |
| Temporal KG | 使用 qualifiers 抽取（start/end time、point in time） |

集成模式:NER → coref → كيان ربط → استخراج العلاقات → خريطة التنظيم → تحميل الرسم البياني── كل مرحلة كلها محتملة质量门──

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

## التدريب

1. **Easy。**في 5 条 أحكام مقالة أخبار 上运行 `code/main.py`مركز استخراج الأنماط.
2. **Medium。**في نفس العبارة استخدام REBEL ((أو LLM صغير) ◦ مقارنة ثلاث مرات── أي مستخرج لديه أدقية أعلى؟
3. **Hard。**构建 AEVS管道: باستخدام استخراج LLM + 对照来源 验证跨度──在 50 条 文章 Wikipedia-style 上测量 验证步骤 前后的幻觉率──

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

- [Mintz et al. (2009). Distant supervision for relation extraction without labeled data](https://www.aclweb.org/anthology/P09-1113.pdf) إشراف عن بعد 论文。
- [Huguet Cabot, Navigli (2021). REBEL: Relation Extraction By End-to-end Language generation](https://aclanthology.org/2021.findings-emnlp.204.pdf) تتابع تتابع RE 主力方案
- [Wadden et al. (2019). Entity, Relation, and Event Extraction with Contextualized Span Representations (DyGIE++)](https://arxiv.org/abs/1909.03546) 联合 IE。
- [AEVS — Anchor-Extraction-Verification-Supplement framework](https://www.mdpi.com/2073-431X/15/3/178)2026 الهلوسة-التخفيف 设计。
- [Wikidata SPARQL tutorial](https://www.wikidata.org/wiki/Wikidata:SPARQL_tutorial) استفسارات الرسم البياني القنوني。
