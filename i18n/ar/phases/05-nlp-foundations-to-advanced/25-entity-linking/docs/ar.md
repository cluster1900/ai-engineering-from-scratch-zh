# 实体链接与消歧

> نير 找到了 "باريس"── الكيان الذي يربط يجب أن يقرر: باريس، فرنسا؟ باريس هيلتون؟ باريس، تكساس؟ باريس ((ملك طروادة)) إذا لم يكن هناك ربط، فإن الرسم البياني المعروف الخاص بك  مازال غامض

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 24 (Coreference Resolution)
**Time:** ~60 分钟

## 问题

"الردنيّة ضربت الصحافة" "أجل، لا بأس، لكنّها "أردنيّة"

- مايكل جوردان) ؟
- مايكل بي جوردان) ؟)
- مايكل أ. جوردان بروكلي المعلمين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين الجامعيين
- الأردن) ؟
- الأردن ((اسم أول عبراني) ؟

ربط الكيانات (EL) 会把每个提到 解析到知识库 中中唯一条目:ويكيداتا、ويكيبيديا、DBpedia، أو مجال KB──两个子任务:

1. **Candidate generation。**أعطينا "الأردن"، أي إدخالات KB ممكنة؟
2. **Disambiguation。**من هو المرشح الصحيح؟

يمكن تعلم الخطوات الثنائية. الخطوات الثنائية لها مقياس.

## 概念

![Entity linking pipeline: mention → candidates → disambiguated entity](../assets/entity-linking.svg)

**Candidate generation。**给定 mention surface form (("الأردن")),在别名索引中查找候选人──维基百科别名词典 覆盖大多数名字实体:"JFK" → جون F. كينيدي、جاكلين كينيدي、 JFK机场、JFK(电影)──典型索引 会为每个提名 返回 10-30 个候选人──

**Disambiguation：三种方法。**

1. **Prior + context (Milne & Witten, 2008)。** `P(entity | mention) × context-similarity(entity, text)`◊ نتائج جيدة ‬ السرعة السريعة ‬ لا حاجة للتدريب‬
2. **Embedding-based (ESS / REL / Blink)。**إشعار إشعار + سياق. إشعار وصف كل مرشح. اختيار كوسين 最大的. 2020-2024 年的默认方法.
3. **Generative (GENRE, 2021; LLM-based, 2023+)。**逐 Token decode اسم الكيان القنوني── محدود إلى محاولة أسماء الكيانات المفعولة، لذلك输出保证是有效 KB id──

**End-to-end vs pipeline。**النماذج الحديثة ((ELQ、BLINK、ExtEnD、GENRE) في مرّة واحدة 中运行 NER + توليد مرشح + تشويشها。 النظم النابطة في الإنتاج لا تزال تسيطر على التغيير، لأنّك تستطيع استبدال المكونات。

### مؤشرين

- **Mention recall (candidate gen)。**ذكرت الذهب 中,正确 KB إدخال 现今候选人名单 比例──这是整个管道的下限──
- **Disambiguation accuracy / F1。**و قد يكون هناك الكثير من المواطنين الصادقين

始终同时报告两者──一个在80%候选人回忆 上有99%歧义的系统,本质上是80%管道──


```figure
gx-entity-linking
```

## بناءها

### الخطوة 1: إعادة توجيهات من ويكيبيديا  بنية مؤشر مستعار

```python
alias_to_entities = {
    "jordan": ["Q41421 (Michael Jordan)", "Q810 (Jordan, country)", "Q254110 (Michael B. Jordan)"],
    "paris":  ["Q90 (Paris, France)", "Q663094 (Paris, Texas)", "Q55411 (Paris Hilton)"],
    "apple":  ["Q312 (Apple Inc.)", "Q89 (apple, fruit)"],
}
```

بيانات ويكيبيديا المجهول: حوالي 18 مليون زوج (مجهول، كيان)

### الخطوة 2: التشويش على أساس السياق

```python
def disambiguate(mention, context, alias_index, entity_desc):
    candidates = alias_index.get(mention.lower(), [])
    if not candidates:
        return None, 0.0
    context_words = set(tokenize(context))
    best, best_score = None, -1
    for entity_id in candidates:
        desc_words = set(tokenize(entity_desc[entity_id]))
        union = len(context_words | desc_words)
        score = len(context_words & desc_words) / union if union else 0.0
        if score > best_score:
            best, best_score = entity_id, score
    return best, best_score
```

التداخل جاكارد هو لعبة.`code/main.py`الخطوة 2):

### 步骤 3:بناء على الإدراج

```python
from sentence_transformers import SentenceTransformer
encoder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def embed_mention(text, mention_span):
    start, end = mention_span
    marked = f"{text[:start]} [MENTION] {text[start:end]} [/MENTION] {text[end:]}"
    return encoder.encode([marked], normalize_embeddings=True)[0]

def embed_entity(entity_id, description):
    return encoder.encode([f"{entity_id}: {description}"], normalize_embeddings=True)[0]
```

في وقت المؤشر، على كل كيب كيان تضمين 一次──在查询 الوقت، على ذكر + إضافة السياق 一次، على مجموعة المرشحين صنع نقطة-المنتج، اختيار أقصى قيمة──

### 步骤 4: كيان توليدي يربط ((概念)

GENRE 会逐字符解码实体的维基百科标题──限制解码(见课 20) ضمان فقط能输出有效标题──它与 KB-backed trie 紧密集成──现代后继是 REL-GEN,以及带结构化输出的LLM-prompted EL──

```python
prompt = f"""Text: {text}
Mention: {mention}
List the best Wikipedia title for this mention.
Respond with JSON: {{"title": "..."}}"""
```

结合 قائمة بيضاء `choice`), هذا هو أسهل خط أنابيب الكهرباء على الخط في عام 2026

### الخطوة 5: في تقييم AIDA-CoNLL

AIDA-CoNLL هو معيار EL المرجعية: 1,393 篇 مقالات رويترز  34k ذكرات ]] كيانات ويكيبيديا ]] تقرير دقة في KB`P@1`) و معدل اكتشاف NIL خارج KB。

## فخ

- **NIL handling。**بعض الذكرات غير موجودة في KB 中(新兴实体、冷门人物) ―― الأنظمة 必须预测 NIL,而不是猜错实体──单独衡量──
- **Mention boundary errors。**上游 نير 漏掉 جزئيات الإمدادات (("بنك أمريكا" فقط标志成 "بنك")
- **Popularity bias。**أنظمة التدريب سوف تتوقع كثيرا الكيانات المتكررة.
- **Cross-lingual EL。**ضع الذكرات في الصين في النصوص الإنجليزية على ويكيبيديا. تحتاج إلى مرموز متعدد اللغات أو خطوة ترجمة.
- **KB staleness。**新公司、新事件、新人物 ليس في سلة ويكيبيديا من العام الماضي 里── خطوط الإنتاج 需要刷新循环──

## استخدمها

2026 سنة:

| Situation | Pick |
|-----------|------|
| 通用 English + Wikipedia | BLINK or REL |
| Cross-lingual, KB = Wikipedia | mGENRE |
| LLM-friendly, 少量 mentions/day | Prompt Claude/GPT-4 with candidate list + constrained JSON |
| Domain-specific KB（medical, legal） | Custom BERT with KB-aware retrieval + fine-tune on domain AIDA-style set |
| 极低 latency | Exact-match prior only (Milne-Witten baseline) |
| Research SOTA | GENRE / ExtEnD / generative LLM-EL |

2026 年可上线的生产模式:NER → coref → لكل ذكر قم بقيام EL → سوف تقوم بتجاعيد المجموعات إلى كل مجموعة كيانات قائمة واحدة──输出:document in each entity one KB id, instead of each mention one──

## 交付 it
保存为 `outputs/skill-entity-linker.md`:

```markdown
---
name: entity-linker
description: Design an entity linking pipeline — KB, candidate generator, disambiguator, evaluation.
version: 1.0.0
phase: 5
lesson: 25
tags: [nlp, entity-linking, knowledge-graph]
---

Given a use case (domain KB, language, volume, latency budget), output:

1. Knowledge base. Wikidata / Wikipedia / custom KB. Version date. Refresh cadence.
2. Candidate generator. Alias-index, embedding, or hybrid. Target mention recall @ K.
3. Disambiguator. Prior + context, embedding-based, generative, or LLM-prompted.
4. NIL strategy. Threshold on top score, classifier, or explicit NIL candidate.
5. Evaluation. Mention recall @ 30, top-1 accuracy, NIL-detection F1 on held-out set.

Refuse any EL pipeline without a mention-recall baseline (you cannot evaluate a disambiguator without knowing candidate gen surfaced the right entity). Refuse any pipeline using LLM-prompted EL without constrained output to valid KB ids. Flag systems where popularity bias affects minority entities (e.g. name-clashes) without domain fine-tuning.
```

## التدريب

1. **Easy。**في`code/main.py`وسط، على أساس 10 ذكرات غامضة ((باريس、 الأردن、 أبل) تحقيق سابق+مناقشة السياق٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬٬
2. **Medium。**استخدام محول الجملة ترمز 50 ذكرات غامضة. تم تصفية كل مرشح. تم تشبيه تشكيلات غامضة على أساس التوابل و تداخلات سياق جاكارد.
3. **Hard。**构建一个1k-entity domain KB(例如:موظفي شركتك + منتجات) ――实现端到端 NER + EL──在100 条长期的句子上测量精度和回忆──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Entity linking (EL) | Link 到 Wikipedia | 将 mention 映射到唯一 KB entry。 |
| Candidate generation | 它可能是谁？ | 为 mention 返回一个 plausible KB entries 的 shortlist。 |
| Disambiguation | 选对的那个 | 使用 context 为 candidates 打分，选择 winner。 |
| Alias index | Lookup table | 从 surface form → candidate entities 的映射。 |
| NIL | 不在 KB 中 | 明确预测没有匹配的 KB entry。 |
| KB | Knowledge base | Wikidata、Wikipedia、DBpedia，或你的 domain KB。 |
| AIDA-CoNLL | Benchmark | 带 gold entity links 的 1,393 篇 Reuters articles。 |

## 延伸阅读
- [Milne, Witten (2008). Learning to Link with Wikipedia](https://www.cs.waikato.ac.nz/~ihw/papers/08-DM-IHW-LearningToLinkWithWikipedia.pdf) الهيئة الأساسية + السياق 方法。
- [Wu et al. (2020). Zero-shot Entity Linking with Dense Entity Retrieval (BLINK)](https://arxiv.org/abs/1911.03814) 基于嵌入 的主力方法──
- [De Cao et al. (2021). Autoregressive Entity Retrieval (GENRE)](https://arxiv.org/abs/2010.00904) 带 مقيدة فك التشفيرات التوليد EL。
- [Hoffart et al. (2011). Robust Disambiguation of Named Entities in Text (AIDA)](https://www.aclweb.org/anthology/D11-1072.pdf) مقياس مقياس 论文。
- [REL: An Entity Linker Standing on the Shoulders of Giants (2020)](https://arxiv.org/abs/2006.01969) 开源 إنتاج كومة
