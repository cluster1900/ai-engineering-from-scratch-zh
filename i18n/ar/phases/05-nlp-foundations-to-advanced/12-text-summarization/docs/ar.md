# خلاصة النص

> الاختراجية 系统告诉你文档说了什么―― الامتناقية 系统告诉你作者想表达什么――任务不同,陷也不同――

**类型：**بناء
**语言：**بايثون
**先修：**المرحلة 5 · 02 (BoW + TF-IDF) ، المرحلة 5 · 11 (ترجمة الآلة)
**时间：**75 دقيقة

## 问题

واحد من 2000 كلمة من مقالات صحفية دخول تغذيتك. تحتاج إلى استخدام 120 كلمة لالتقاط جوهرها. يمكنك اختيار ثلاثة أقوى جملة من مقالاتك.

الاختصار الاستخرجي هو مشكلة ترتيبية.`k`个──输出总是语法正确, لأنه يتم استخراجها من المصدر الفردي.

التجميع المجرد هو مشكلة إنتاج. المحول في ظل ظروف النقل يخلق نص جديد.

هذا الدرس سوف يبناها ويعرض طريقتها الفاشلة المحددة

## 概念

![Extractive TextRank vs abstractive transformer](../assets/summarization.svg)

**Extractive。**将文章视为图,其中节点是句子,边缘是相似性.**TextRank**(ميهالسيّا و طاراو، 2004)

**Abstractive。**في أزواج المستندات-التاليات، فوق التنسيق الدقيق واحد محول إكودر-تنسيق البيانات، بارت 、T5、بيغاسوس)  في الاستنتاج 时,نموذج 读取文档,并通过 越来越注意 逐代币 生成摘要。بيغاسوس 尤其使用差句预训目标,使它在不需要太多的细调的情况下非常适合总结──

استخدام **ROUGE**(تدقيق التذكر المتوجه لتقييم الغزل) تقييم: ROUGE-1 和 ROUGE-2 衡量 unigram 和 bigram overlap: ROUGE-L 衡量最长的常见次序:`rouge-score`الحزمة


```figure
summarize-collapse
```

## الإنشاء

### 步骤 1: TextRank(استخراج)

```python
import math
import re
from collections import Counter


def sentence_split(text):
    return re.split(r"(?<=[.!?])\s+", text.strip())


def similarity(s1, s2):
    w1 = Counter(s1.lower().split())
    w2 = Counter(s2.lower().split())
    intersection = sum((w1 & w2).values())
    denom = math.log(len(w1) + 1) + math.log(len(w2) + 1)
    if denom == 0:
        return 0.0
    return intersection / denom


def textrank(text, top_k=3, damping=0.85, iterations=50, epsilon=1e-4):
    sentences = sentence_split(text)
    n = len(sentences)
    if n <= top_k:
        return sentences

    sim = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                sim[i][j] = similarity(sentences[i], sentences[j])

    scores = [1.0] * n
    for _ in range(iterations):
        new_scores = [1 - damping] * n
        for i in range(n):
            total_out = sum(sim[i]) or 1e-9
            for j in range(n):
                if sim[i][j] > 0:
                    new_scores[j] += damping * sim[i][j] / total_out * scores[i]
        if max(abs(s - ns) for s, ns in zip(scores, new_scores)) < epsilon:
            scores = new_scores
            break
        scores = new_scores

    ranked = sorted(range(n), key=lambda k: scores[k], reverse=True)[:top_k]
    ranked.sort()
    return [sentences[i] for i in ranked]
```

هناك شيئين يستحق النسم. وظيفة التشابه باستخدام لغة التداخل المعتاد، هذا هو الكوزين الأصلي لمتجهات TextRank 变体──TF-IDF.

### 步骤 2: استخدام BART جعل تجريبي

```python
from transformers import pipeline

summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

article = """(long news article text)"""

summary = summarizer(article, max_length=120, min_length=60, do_sample=False)
print(summary[0]["summary_text"])
```

بارت-كبير-CNN في CNN/DailyMail corpus 上 تحسيناتها.

### الخطوة الثالثة: تقييم ROUGE

```python
from rouge_score import rouge_scorer

scorer = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
scores = scorer.score(reference_summary, generated_summary)
print({k: round(v.fmeasure, 3) for k, v in scores.items()})
```

始终使用 stemming──否则, "running" 和 "run" 会被算作不同词,ROUGE 会低估──

### ROUGE 之外(2026 تقييم الموجب)

على مدى عشر سنوات، كانت ROUGE مقياسية تلخص بشكل رئيسي، ولكن في عام 2026 كان استخدامها وحده لا يصل إلى حد كبير.

- **BERTScore**(تشابه التضمين السياسي) في 2023 سنة قبل و بعد استمرار الحصول على التبني، الآن أغلب أوراق التجميع 会与 ROUGE 一起报告──
- **BARTScore**                                                                                                                                                                                                                                                              
- **MoverScore**(التوابع السياقية على مسافة حركة الأرض) في 2025 وصلت إلى المركز الأول من بين المعايير المرجعية للجمع، لأنه أفضل من الاحتفاظ بالترابط الجوهري من الارق الأحمر.
- **FactCC**和 **QA-based faithfulness**في 2021-2023 سنة شائعة جدا، حالياً شائعة جداً**G-Eval**替代(一个GPT-4 سلسلة استشارات، من خلال التفكير في سلسلة التفكير على التماسك والتوافق والسريع والسريع 打分)
- **G-Eval**وبدون تغيير في القانون، فإن الاختبارات البشرية تُعتبر أكثر من 80% من الاختبارات البشرية.

توصية الإنتاج: تقرير ROUGE-L تستخدم مقارنة سابقة، BERTScore تستخدم التداخل الجوهري، G-Eval تستخدم التماسك والواقعية،

### الخطوة الرابعة: الحقائق

الموجات المجردة 易 ظهور الهلوسة 风险 الهلوسة 风险 من الموجات المجردة 风险 منخفض جدا، لأن الناتج هو حرفاً تلو الآخر من المصدر 文中提取, على الرغم من إذا تم الوصول إلى المقالة التالية 文化,过时, أو إشارة ترتيب خطأ, فإنها لا تزال قد تكون خاطئة.

الهلوسة النوع:

- **Entity swap。**المصدر هو "جون سميث". الموجب هو "جون براون".
- **Number drift。**المصدر: 25 ألف. المختصر: 25 مليون.
- **Polarity flip。**المصدر 写是 "رفضت العرض". الموجز 写成 "قبل العرض".
- **Fact invention。**المصدر لم يذكر الرئيس التنفيذي. المختصر يقول الرئيس التنفيذي قد وافق عليه.

طرق التقييم المثمرة:

- **FactCC。**واحد من المصفوفات الثنائية، تمارس الغرض هو العلاقة بين الجملة المصدرة والجملة الملخصة.
- **QA-based factuality。**让QA模型 提出答案在源中问题──如果总结 支持不同答案,则标记──
- **Entity-level F1。**مقارنة المصدر مع الكيانات المسموحة في الموجة الموجة.

对于任何面向用户和事实性 重要内容(اخبار 医学、法律、金融),抽取 是更安全的默认选择。抽象 需要加入在流程中事实性检查──

## استخدام

2026 كومة:

| Use case | Recommended |
|---------|-------------|
| News, 3-5 sentence summary, English | `facebook/bart-large-cnn` |
| Scientific papers | `google/pegasus-pubmed` or a tuned T5 |
| Multi-document, long-form | Any LLM with 32k+ context, prompted |
| Dialog summarization | `philschmid/bart-large-cnn-samsum` |
| Extractive, low hallucination risk by construction | TextRank or `sumy`'s LSA / LexRank |

عندما الحساب غير محدود، فإن LLM في السياق الطويل في عام 2026 عادة ما تفوق النماذج المتخصصة.

##  إصدار

保存为 `outputs/skill-summary-picker.md`:

```markdown
---
name: summary-picker
description: 选择 extractive 或 abstractive、指定 library、factuality check。
version: 1.0.0
phase: 5
lesson: 12
tags: [nlp, summarization]
---

给定一个任务（document type、compliance requirement、length、compute budget），输出：

1. Approach。Extractive 或 abstractive。用一句话解释原因。
2. Starting model / library。写出名称。`sumy.TextRankSummarizer`、`facebook/bart-large-cnn`、`google/pegasus-pubmed`，或一个 LLM prompt。
3. Evaluation plan。ROUGE-1、ROUGE-2、ROUGE-L（使用带 stemming 的 rouge-score）。如果是 abstractive，再加 factuality check。
4. 一个需要探查的 failure mode。Entity swap 是 abstractive news summarization 中最常见的问题；标记 source entities 未出现在 summary 中的 samples。

如果没有 factuality gate，则拒绝对 medical、legal、financial 或 regulated content 使用 abstractive summarization。将超过 model context window 的输入标记为需要 chunked map-reduce summarization（而不是简单 truncation）。
```

## التدريب

1. **Easy。**في 5 篇新闻文章上运行 TextRank. 将 top-3 句子与参考摘要比较. 测 ROUGE-L.  你应该能在CNN/DailyMail-style文章上看 30-45 ROUGE-L.
2. **Medium。**实现实实体级事实性:从源和总结 中抽取命名实体(spaCy),计算源实体在总结中的召回,以及总结实体相对源的精度──高精度、低召回表示安全但简略;低精度表示幻觉实体──
3. **Hard。**في 50 篇 مقالات CNN/DailyMail 上比较 BART-big-CNN مع LLM ((Claude أو GPT-4) ―― تقرير ROUGE-L、واقعية(من خلال الكيان F1) ومكلفة لكل ملخص‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|------------|----------|
| Extractive | 选句子 | 从 source 中逐字返回句子。永不 hallucinate。 |
| Abstractive | 重写 | 在 source 条件下生成新文本。可能 hallucinate。 |
| ROUGE | Summary metric | system output 与 reference 之间的 N-gram / LCS overlap。 |
| TextRank | Graph-based extractive | sentence similarity graph 上的 PageRank。 |
| Factuality | 是否正确 | summary claims 是否由 source 支持。 |
| Hallucination | 编造内容 | summary 中 source 不支持的内容。 |

## 延伸阅读

- [Mihalcea and Tarau (2004). TextRank: Bringing Order into Texts](https://aclanthology.org/W04-3252/) استخراج 经典论文。
- [Lewis et al. (2019). BART: Denoising Sequence-to-Sequence Pre-training](https://arxiv.org/abs/1910.13461) BART 论文。
- [Zhang et al. (2019). PEGASUS: Pre-training with Extracted Gap-sentences](https://arxiv.org/abs/1912.08777) بيغاسوس 和 هدف الجملة الفارغة
- [Lin (2004). ROUGE: A Package for Automatic Evaluation of Summaries](https://aclanthology.org/W04-1013/)ورق حمراء
- [Maynez et al. (2020). On Faithfulness and Factuality in Abstractive Summarization](https://arxiv.org/abs/2005.00661) ورقة المشهد الواقعية
