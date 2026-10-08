# قرار الإستشارة

>  هي打电话给他──他没有接──医生在吃午饭── 三个参考,指向两个人,而且没有人被点名──引用决议 会弄清楚谁是谁──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 07 (POS & Parsing)
**Time:** ~60 分钟

## 问题
من 300 كلمة في مقال استخرج كل ذكر شركة آبل.

قرار الكورفرنس سوف يضع كل شيء يشير إلى نفس الكيان العالم الحقيقي على اتصال مع مجموعة واحدة.

لماذا هو مهم في عام 2026:

- المختصرة: الرئيس التنفيذي أعلن... vs Tim Cook أعلن...  المختصرة 应该说出 CEO 的名字──
- الإجابة على السؤال: من اتصلت به؟
- استخراج المعلومات: رسم بياني معرفت 里同时有 PER1 أسس آبل 和 Jobs أسس آبل 作为不同条目,这是错的──
- المذكرة في مقالات الحوادث نفسها، هي إشارة أساسية عبر الوثائق.

## 概念
![Coreference clustering: mentions → entities](../assets/coref.svg)

**The task.**输入: a document──输出:mention(span) من التجميع، كل مجموعة منها توجه إلى كيان واحد──

**Mention types.**

- **Named entity.**تيم كوك
- **Nominal.**الرئيس التنفيذي
- **Pronominal.**هو هو هي هي هي هي هي هي هي هي هي هي هي هي
- **Appositive.**تيم كوك، الرئيس التنفيذي لشركة آبل

**Architectures.**

1. **Rule-based (Hobbs, 1978).**基于语法树的代词解析,使用语法规则──很好的基线──在代词上意外地难以超越──
2. **Mention-pair classifier.**على كل ذكر (م) ، التوقعات ما إذا كانت أساسية.
3. **Mention-ranking.**لكل ذكر، تم تحديد سابقة المرشحين
4. **Span-based end-to-end (Lee et al., 2017).**ترانسفورمتر مُشفّر 枚举所有长度上限内的候选 span。预测提及分点──为每 span 预测前概率──贪心聚类──现代默认方案──
5. **Generative (2024+).**عجلة واحد LLM:قسم كل اسم في هذا النص والسابقة. 在简单案例上效果不错,但在长文档和少见引用 上会吃力。

**The evaluation metrics.**هناك خمسة مؤشرات معايير ((MUC、B3、CEAF、BLANC、LEA) ، لأن لا يوجد مؤشر واحد يمكن أن يلتقط بشكل كامل التجميع 质量── تقرير متوسط ثلاثة من المؤشرات كCoNLL F1──2026 سنة CoNLL-2012 أعلى من أحدث التطورات: حوالي 83 F1──

**Known hard cases.**

- وصف محدد يدل على الكيان الذي تم إدخاله قبل عدد الصفحات
- تعبئة الأنافورا ((العجلات → 之前提到一辆车) 
- الصفحة الصفرية في لغات الصفحة الصفرية
- كاتافورا ((استعارة 出现在 مرجع 之前):When **she**دخلت، ابتسمت ماري.


```figure
coref-links
```

## بناءها
### الخطوة 1: التدريب المسبق للنفس العصبي (ألن ن ل ب / spaCy- تجربي)

```python
import spacy
nlp = spacy.load("en_coreference_web_trf")   # experimental model
doc = nlp("Apple announced new products. The company said they would ship soon.")
for cluster in doc._.coref_clusters:
    print(cluster, "->", [m.text for m in cluster])
```

في الوثيقة الموسعة، ستحصل على نتائج مشابهة:
- المجموعة الأولى: [Apple، الشركة، هم]
- المجموعة الثانية: [المنتجات الجديدة]

### 步骤 2: حل اللفظ القائم على القواعد (التدريس)

查看 `code/main.py`中仅使用stdlib 的实现:

1. 抽取 ذكر:كيانات مسمى ((大写 span) 、استعارة ((بحث مباشر) 、وصف محدد ((the X) ✿
2. لكل اسم، انظر قبل ذكره،并按以下因素打分:
   - الاتفاق بين الجنسين والرقم
   - (تقريباً)
   - دور النصي ((الموضوع الأول)
3. 链接最高分 سابقة

هذا لا يمكن أن يكون مع النماذج العصبية  المنافسة  ولكن ذلك يظهر الفضاء البحث، وكذلك النموذج النهائي  يجب أن يتم اتخاذ القرارات ‬

### الخطوة الثالثة: استخدام الـ LLM

```python
prompt = f"""Text: {text}

List every pronoun and noun phrase that refers to a person or company.
Cluster them by what they refer to. Output JSON:
[{{"entity": "Apple", "mentions": ["Apple", "the company", "it"]}}, ...]
"""
```

需要注意两种失败模式──第一,LLMs 会过度合并(把指向两个不同人的 him 和 her 合并)──第二,LLMs 会在长文档中漏掉提到──始终使用跨度抵消检查验证──

### الخطوة الرابعة: التقييم

标准 conll-2012 نص 会计算 MUC、B3、CEAF-φ4,并报告平均值── بالنسبة لتقييم داخلي،先在带标注的测试集 上做跨度水平精度 和回忆,再加入提到链接 F1──

## فخ
- **Singleton explosion.**بعض النظم سوف تكتب كل ذكر في مجموعة خاصة بها.
- **Pronouns in long context.**أكثر من 2000 رمز وثيقة أعلى أداء سجل أقل حوالي 15 F1──
- **Gender assumptions.**قواعد الجنس الصعبة التدوين في المرجحين غير الثنائيين، المنظمات، الحيوانات 上失效── استخدام النماذج المتعلمة أو الدرجة المحايدة──
- **LLM drift on long docs.**单次 API 调用不可靠地对 50+ 段落中的提到 聚类──使用滑窗+ merge──

## استخدمها
2026 سنة:

| Situation | Pick |
|-----------|------|
| English, single document | `en_coreference_web_trf` (spaCy-experimental) 或 AllenNLP neural coref |
| Multilingual | 在 OntoNotes 或 Multilingual CoNLL 上训练的 SpanBERT / XLM-R |
| Cross-document event coref | 专门的 end-to-end models（2025–26 SOTA） |
| Quick LLM baseline | 带 structured-output coref prompt 的 GPT-4o / Claude |
| Production dialog systems | Rule-based fallback + neural primary + critical slots 的 manual review |

2026 年能上线的集成模式:先运行 NER,再运行 coref,把 coref clusters 合并进 NER实体――下游任务看到是每个集群一个实体,而不是每个提到一个实体――

## 交付 it
保存为 `outputs/skill-coref-picker.md`:

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

## التدريب
1. **Easy.**في`code/main.py`中对 5 个手写段落运行 القاعدة القائمة على الحل.
2. **Medium.**في مقال صحفي يستخدم نموذج النواة العصبية المسبقة. سوف تجمع مع تعليقك اليدوي مقابل.
3. **Hard.**بناء خط أنابيب NER محسنة: أولاً NER، وإعادة تمرير الأغلبية من المجموعات 合并──衡量 100 篇文章上 مقارنة بتحسين تغطية الكيانات التي تعمل على NER فقط──

## 关键术语
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
- [Lee et al. (2017). End-to-end Neural Coreference Resolution](https://arxiv.org/abs/1707.07045) 基于 span 的端到端──
- [Joshi et al. (2020). SpanBERT](https://arxiv.org/abs/1907.10529) 改进核心f ‬التدريب المسبق‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
- [Pradhan et al. (2012). CoNLL-2012 Shared Task](https://aclanthology.org/W12-4501/) مقياس الموازنة‬
- [Hobbs (1978). Resolving Pronoun References](https://www.sciencedirect.com/science/article/pii/0024384178900064) قاعدة القواعد 经典方法──
