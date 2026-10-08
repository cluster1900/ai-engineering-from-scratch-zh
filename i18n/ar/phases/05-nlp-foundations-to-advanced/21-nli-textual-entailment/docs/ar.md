# الطبيعي لغة التفكير  文本含

> "تتتضمن h" تعني، أن الشخص الذي يقرأ t 后会得出 h 为真结论──NLI هي مهمة تنبؤية التضامن / التناقض / الحيادية── على الجانب الجوي مريح، ولكن في الإنتاج تحمل دوراً رئيسياً──

**类型：**學习
**语言：**بايثون
**先修：**المرحلة 5 · 05 (تحليل المشاعر) ، المرحلة 5 · 13 (إجابة السؤال)
**时间：**~ 60 دقيقة

## 问题

أنت بنيت ملخصاً... .. لقد أنتجت ملخصاً...

لقد بنيت مشغل دردشة. أجاب "نعم". كيف تعرف هذه الجوابة؟

هل تحتاج إلى 10 آلاف مقالة أخبار حسب الموضوع؟ هل لديك علامات تدريب؟

هذه المشاكل الثلاث يمكن أن تكون مقارنة مع استنتاج اللغة الطبيعية.`t`وفرضية`h`،`h`هو من`t`هل تتناقض أم محايدة؟

- **Hallucination check:** `t`= وثيقة المصدر`h`= دعوى ملخصة.
- **Grounded QA:** `t`= الممر المُسترد`h`= إجابة تم إنشاؤها.
- **Zero-shot classification:** `t`= وثيقة`h`= علامة شفهية ("هذا عن الرياضة")。التضمين = علامة متوقعة。

مهمة، ثلاثة أشكال لإنتاج. هذا هو السبب في أن كل إطار تقييم RAG سيكون في الطابق السفلي مع نموذج NLI.

## 概念

![NLI: three-way classification, premise vs hypothesis](../assets/nli.svg)

**三个 labels。**

- **Entailment.** `t``h`" القطة على المجادلة " يعني " هناك قطة "
- **Contradiction.** `t`- نعم`h`"الكاتة على المجادلة" تتناقض مع "لا يوجد قطة".
- **Neutral.**"الكاتة على السجادة" إلى "الكاتة جائعة".

**不是逻辑 entailment。**إن إين إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إيه إ

**Datasets。**

- **SNLI**(2015)──570k 人工标注 زوجات,以图像标题 作为前提──领域较窄──
- **MultiNLI**(2017)── عبر 10 个类的 433k زوجات──2026 年的标准培训 corpus──
- **ANLI**(2019) ――الجهات غير المتحالفة للإنسان٬ البشر المخصصة للمصممة لتحقيق النماذج الحالية٬٬
- **DocNLI, ConTRoL**(202021) ―― مقالات طويلة المدى المستندات。测试 متعددة المراكز 和 استنتاج طويل المدى。

**架构。**إعدادات محولات البيانات`[CLS] premise [SEP] hypothesis [SEP]`.`[CLS]`تمثيل 输入到3way softmax──在 MNLI 上训练,在持有基准上评估,在在分销对上获得90%+精度──

**通过 NLI 做 zero-shot。**给定一个文件 和候选标签,把每个标签 转成一个假设("هذا النص هو عن الرياضة")`zero-shot-classification`خط الأنابيب 背后的机制──


```figure
nli-router
```

## بناءها

### الخطوة الأولى: 运行 نموذج NLI مقدم التدريب

```python
from transformers import pipeline

nli = pipeline("text-classification",
               model="facebook/bart-large-mnli",
               top_k=None)  # return all labels; replaces deprecated return_all_scores=True

premise = "The cat is sleeping on the couch."
hypothesis = "There is a cat in the room."

result = nli({"text": premise, "text_pair": hypothesis})[0]
print(result)
# [{'label': 'entailment', 'score': 0.97},
#  {'label': 'neutral', 'score': 0.02},
#  {'label': 'contradiction', 'score': 0.01}]
```

بالنسبة لـ NLI في الصف الإنتاجي`facebook/bart-large-mnli`和 `microsoft/deberta-v3-large-mnli`يـا إـنـتـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـنـيـيـنـيـنـيـنـيـيـنـيـنـيـيـنـيـنـيـيـنـيـنـيـيـنـيـنـيـنـيـنـيـيـنـيـنـيـنـيـنـيـنـيـيـنـنـيـنـيـنـيـنـيـنـيـنـيـنـنـيـيـنـيـنـنـيـنـنـيـنـيـنـيـنـنـنـيـنـيـنـنـيـنـنـنـيـنـنـيـنـيـنـيـنـنـنـيـنـنـنـيـنـنـيـنـنـيـنـنـنـيـنـنـنـنـنـنـنـنـيـنـنـنـنـنـنـيـنـنـنـنـنـنـنـنـنـنـنــ

### 步骤 2: تصنيف الصفر

```python
zs = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

text = "The stock market rallied after the central bank cut interest rates."
labels = ["finance", "sports", "politics", "technology"]

result = zs(text, candidate_labels=labels)
print(result)
# {'labels': ['finance', 'politics', 'technology', 'sports'],
#  'scores': [0.92, 0.05, 0.02, 0.01]}
```

默认 قالب 是 "هذا المثال حول {تسمة}."―可用 `hypothesis_template`تعريف: ليس هناك حاجة إلى بيانات التدريب: ليس هناك حاجة إلى ضبط جيد:

### الخطوة 3: تحقق الوفاء RAG

```python
def is_faithful(answer, context, threshold=0.5):
    result = nli({"text": context, "text_pair": answer})[0]
    entail = next(s for s in result if s["label"] == "entailment")
    return entail["score"] > threshold
```

هذا هو جوهر ولاء راغاس.

### 步骤 4: 手写 NLI تصنيف (مصنفات)

查看 `code/main.py`中 فقط باستخدام ألعاب stdlib: الموقع و الفرضية  من خلال التداخل اللغوي + اكتشاف الرفض  إجراء مقارنة.`{entail, contradict, neutral}`العلوى المتقاطعة

## فخ

- **Hypothesis-only shortcuts.**النماذج فقط انظر الفرضية أن يكون في SNLI أعلى حوالي 60% من معدل تحديد التنبؤ الملصق، لأن "لا""",لا أحد""",لا" أبدا" مع التناقض .
- **Lexical overlap heuristic.**يمكن أن تمرّ بـ SNLI، ولكنّها ستفشل في HANS/ANLI.
- **Document-length degradation.**نماذج NLI ذات جملة واحدة في المباني ذات طول وثيقة 上会下降 20+ F1──长上下文应使用 DocNLI-تدريب النماذج──
- **Zero-shot template sensitivity.**"هذا المثال حول {تسمية}"、"{تسمية}"、"الموضوع هو {تسمية}" 之间可能导致 دقة 波动 10+ نقاط──需要调优模板──
- **Domain mismatch.**تمتد على المعلومات المعلوماتية في مجال التدريبات في اللغة الإنجليزية العامة.

## استخدمها

2026 كومة:

| Use case | Model |
|---------|-------|
| 通用 NLI | `microsoft/deberta-v3-large-mnli` |
| 快速 / edge | `cross-encoder/nli-deberta-v3-base` |
| Zero-shot classification（轻量） | `facebook/bart-large-mnli` |
| Document-level NLI | `MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli` |
| Multilingual | `MoritzLaurer/multilingual-MiniLMv2-L6-mnli-xnli` |
| RAG 中的 hallucination detection | RAGAS / DeepEval 内部的 NLI layer |

نمط الميتا لعام 2026: إنلي هو مفهوم المقالة. إذا كنت بحاجة إلى الحكم على إما إذا كان إيه يؤيد إيه بي أو إيه إيه يتناقض مع إيه بي قبل إطلاق مكالمة أخرى لدرجة الماجستير.

## 交付 it

保存为 `outputs/skill-nli-picker.md`:

```markdown
---
name: nli-picker
description: Pick an NLI model, label template, and evaluation setup for a classification / faithfulness / zero-shot task.
version: 1.0.0
phase: 5
lesson: 21
tags: [nlp, nli, zero-shot]
---

Given a use case (faithfulness check, zero-shot classification, document-level inference), output:

1. Model. Named NLI checkpoint. Reason tied to domain, length, language.
2. Template (if zero-shot). Verbalization pattern. Example.
3. Threshold. Entailment cutoff for the decision rule. Reason based on calibration.
4. Evaluation. Accuracy on held-out labeled set, hypothesis-only baseline, adversarial subset.

Refuse to ship zero-shot classification without a 100-example labeled sanity check. Refuse to use a sentence-level NLI model on document-length premises. Flag any claim that NLI solves hallucination — it reduces it; it does not eliminate it.
```

## التدريب

1. **Easy.**في 20 个手写的(الأساس، الفرضية، اللقب)`facebook/bart-large-mnli`,覆盖所有三类──测量精度──加入 خصومية "التابعة السرية" الفخاخة("لم أكل الكعكة" مقابل "أكل الكعكة"), انظر ما إذا كان سوف يفشل في الفعالية──
2. **Medium.**في 100 条 AG أخبار العناوين 上比较 صفر إطلاق نموذج `"This text is about {label}"`.`"The topic is {label}"`和 `"{label}"` تقرير التذبذب دقة
3. **Hard.**构建一个RAG fidelity checker:atomic-claim decomposition + كل مطالبة صنع NLI──在 50 个带金背景的RAG-generated answers 上评估──测量对人工标签的错正和错负率──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| NLI | Natural Language Inference | premise-hypothesis 关系的 3-way classification。 |
| RTE | Recognizing Textual Entailment | NLI 的旧名称；同一任务。 |
| Entailment | "t implies h" | 给定 t，典型读者会得出 h 为真的结论。 |
| Contradiction | "t rules out h" | 给定 t，典型读者会得出 h 为假的结论。 |
| Neutral | "undecided" | 从 t 到 h 双向都无法推断。 |
| Zero-shot classification | NLI as classifier | 把 labels verbalize 成 hypotheses，选择最大 entailment。 |
| Faithfulness | 答案是否有支持？ | 在（retrieved context, generated answer）上做 NLI。 |

## 延伸阅读
- [Bowman et al. (2015). A large annotated corpus for learning natural language inference](https://arxiv.org/abs/1508.05326) SNLI‬
- [Williams, Nangia, Bowman (2017). A Broad-Coverage Challenge Corpus for Sentence Understanding through Inference](https://arxiv.org/abs/1704.05426) متعددة الأرقام
- [Nie et al. (2019). Adversarial NLI](https://arxiv.org/abs/1910.14599) مقياس ANLI
- [Yin, Hay, Roth (2019). Benchmarking Zero-shot Text Classification](https://arxiv.org/abs/1909.00161) NLI-as-classifier‬
- [He et al. (2021). DeBERTa: Decoding-enhanced BERT with Disentangled Attention](https://arxiv.org/abs/2006.03654) 2026 سنة NLI 主力。
