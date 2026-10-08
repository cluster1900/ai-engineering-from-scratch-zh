# पाठ संक्षेप

> निष्कर्षण 系统告诉你文档说了什么――抽象 系统告诉你作者想表达什么――任务不同,陷也不同――

**类型：**निर्माण
**语言：**पायथन
**先修：**चरण 5 · 02 (BoW + TF-IDF), चरण 5 · 11 (मशीन अनुवाद)
**时间：**~ 75 मिनट

## 问题

एक 2,000 शब्द का समाचार लेख आपके फ़ीड में प्रवेश करे। आपको 120 शब्दों का उपयोग करके इसका मूल पकड़ने की आवश्यकता है। आप लेख में से तीन सबसे महत्वपूर्ण वाक्य चुन सकते हैं।

निष्कर्षण संक्षेप एक क्रमबद्ध प्रश्न है।`k`个──输出总是语法正确的,因为它是从原文中提取的.

अमूर्त संक्षेप एक उत्पन्न समस्या है। एक परिवर्तक एक प्रविष्टि के तहत नया पाठ उत्पन्न करता है।

इस वर्ग में दोनों का निर्माण किया जाएगा और वे अपनी-अपनी असफलता का तरीका प्रदर्शित करेंगे।

## 概念

![Extractive TextRank vs abstractive transformer](../assets/summarization.svg)

**Extractive。**इसे एक ग्राफ के रूप में देखा जाता है, जिसमें नोड्स वाक्य हैं, किनारे समानता हैं।**TextRank**(मिहलसीआ और ताराऊ, 2004)

**Abstractive。**                                                                                                                                                                                                                                                              

उपयोग **ROUGE**(Remember-Oriented Understudy for Gisting Evaluation) मूल्यांकन──ROUGE-1 和 ROUGE-2 衡量 unigram 和 बिग्राम ओवरलैप──ROUGE-L 衡量最长的常见后续──越高越好,但40 ROUGE-L 算好,50 算例外──每篇论文都会报告这三项──使用 `rouge-score`पैकेज


```figure
summarize-collapse
```

## 构建

### 步骤 1: TextRank(अवशिष्ट)

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

There are two things worth a point name── समानता फ़ंक्शन लॉग-नर्मलाइज़ेड वर्ड ओवरलैप का उपयोग करें, यह मूल TextRank 变体──TF-IDF वेक्टरों का कॉसिन भी हो सकता है── डैम्पिंग फ़ाक्टर 0.85 तथा पुनरावृत्ति संख्या ही पेजरैंक का डिफ़ॉल्ट मान──

### 步骤 2: BART का प्रयोग करें

```python
from transformers import pipeline

summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

article = """(long news article text)"""

summary = summarizer(article, max_length=120, min_length=60, do_sample=False)
print(summary[0]["summary_text"])
```

BART-big-CNN में CNN/DailyMail corpus ऊपर ठीक-ठीक---यह खुला बॉक्स即可生成 समाचार शैली के सारांशों--- अन्य क्षेत्रों के लिए(वैज्ञानिक पत्रों、 संवाद、कानूनी), उपयोग करने के लिए应对Pegasus चेकपॉइंट, या अपने लक्ष्य डेटा ऊपर ठीक-ठीक---

### 步骤 3: ROUGE मूल्यांकन

```python
from rouge_score import rouge_scorer

scorer = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
scores = scorer.score(reference_summary, generated_summary)
print({k: round(v.fmeasure, 3) for k, v in scores.items()})
```

始终使用 stemming──否则, "running" 和 "run" 会被算作不同词,ROUGE 会低估──

### ROUGE 之外(2026 संक्षेप मूल्यांकन)

बीते दो दशक से रूज एक प्रमुख संक्षेप मेट्रिक है, लेकिन 2026 में इसका अकेले उपयोग पहले से ही पर्याप्त नहीं है।

- **BERTScore**(सापेक्ष रूप से सम्मिलित समानता) में 2023 वर्ष पूर्व एवं बाद में निरंतर प्राप्ति, अब अधिकांश सारांश पत्र 会与 ROUGE 一起报告──
- **BARTScore** मूल्यांकन 视为世代: पूर्व प्रशिक्षित BART  में दिए गए स्रोत  में संक्षेप देने की संभावना 
- **MoverScore**(संदर्भात्मक एम्बेडिंग ऊपर की पृथ्वी मूवर की दूरी) 2025 में सारांश बेंचमार्क में प्रथम स्थान पर पहुंच गया, क्योंकि यह ROUGE की तुलना में बेहतर सेमंटिक ओवरलैप को पकड़ता है।
- **FactCC**和 **QA-based faithfulness**2021-2023 साल में बहुत आम है, अब अक्सर किया जाता है **G-Eval**替代(एक GPT-4 शीघ्र श्रृंखला, एक विचार श्रृंखला तर्क के माध्यम से एकीकरण, स्थिरता, तरलता, प्रासंगिकता 打分) 
- **G-Eval**और LLM-judge 方法  rubric  अच्छी तरह से डिज़ाइन किए जाने पर, मानव न्याय के साथ लगभग 80% एकजुटता है।

उत्पादन सिफारिशः रिपोर्ट ROUGE-L उपयोग विरासत तुलना,BERTScore उपयोग अर्थिक ओवरलैप,G-Eval उपयोग सुसंगतता और तथ्ययोग्यता हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु हेतु

### 步骤 4: तथ्य 问题

अमूर्त सारांशों में भ्रम होना आसान है। निष्कर्षण सारांशों में भ्रम का जोखिम बहुत कम है, क्योंकि आउटपुट मूल से क्रमशः लिया जाता है, भले ही यदि मूल वाक्य नीचे संस्कृति में जा रहे हों, या समय, या अनुक्रम में गलत उद्धरण, वे अभी भी गलत दिशा में हो सकते हैं। यह उत्पादन प्रणालियों में अनुपालन-समीप सामग्री में अभी भी अधिमान्य निष्कर्षण विधियों का मुख्य कारण है।

需要点名的幻觉 类型:

- **Entity swap。**स्रोत 写是" जॉन स्मिथ. " संक्षेप 写成 " जॉन ब्राउन. "
- **Number drift。**स्रोत 写是 "25,000." सारांश 写成 "25 मिलियन."
- **Polarity flip。**स्रोत 写成 "ऑफर अस्वीकार कर दिया।" सारांश 写成 "ऑफर स्वीकार किया।"
- **Fact invention。**स्रोत  कोई सीईओ का उल्लेख नहीं किया गया  सारांश  सीईओ  अनुमोदित किया गया 

प्रभावी मूल्यांकन दृष्टिकोणः

- **FactCC。**एक द्विआधारी वर्गीकरण, प्रशिक्षण लक्ष्य स्रोत वाक्य और सारांश वाक्य के बीच संबंध है ︎ ︎ ︎ ︎ ︎
- **QA-based factuality。**让QA मॉडल 提出答案在源中问题──如果总结 支持不同答案,则标记──
- **Entity-level F1。**स्रोत से तुलना करें सारांश के बीच नामित संस्थाएं  केवल सारांश के बीच मौजूद संस्थाएं 

 किसी भी उपयोगकर्ता के लिए  महत्वपूर्ण सामग्री समाचार, चिकित्सा, कानूनी, वित्तीय), निष्कर्षण  अधिक सुरक्षित 默认选择── निष्कर्षण  आवश्यकता है  प्रक्रम में शामिल तथ्य जांच──

## उपयोग

2026 स्टैकः

| Use case | Recommended |
|---------|-------------|
| News, 3-5 sentence summary, English | `facebook/bart-large-cnn` |
| Scientific papers | `google/pegasus-pubmed` or a tuned T5 |
| Multi-document, long-form | Any LLM with 32k+ context, prompted |
| Dialog summarization | `philschmid/bart-large-cnn-samsum` |
| Extractive, low hallucination risk by construction | TextRank or `sumy`'s LSA / LexRank |

जब गणना नहीं होती है, तो 2026 में एलएलएम आमतौर पर विशेष मॉडल से अधिक सफल होते हैं।

## 发布

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

## अभ्यास

1. **Easy。**५ 篇新闻文章上运行 TextRank──将前三句与参考摘要比较──测量ROUGE-L──你应该能在CNN/DailyMail-style文章上看30-45ROUGE-L──
2. **Medium。**实现实体级事实性:从源和总结 中抽取命名实体(spaCy),计算源实体在总结中的召唤,以及总结实体相对源的精度──高精度──低召唤 表示安全但简略;低精度 表示幻觉实体──
3. **Hard。**50 篇 CNN/DailyMail लेख 上比较 BART-big-CNN与一个LLM(Claude 或 GPT-4) ―― रिपोर्ट ROUGE-L、 तथ्य]](通过实体 F1) तथा प्रति सारांश खर्च──记录各自胜出的场景──

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

- [Mihalcea and Tarau (2004). TextRank: Bringing Order into Texts](https://aclanthology.org/W04-3252/) निष्कर्षण 经典论文──
- [Lewis et al. (2019). BART: Denoising Sequence-to-Sequence Pre-training](https://arxiv.org/abs/1910.13461) BART 论文──
- [Zhang et al. (2019). PEGASUS: Pre-training with Extracted Gap-sentences](https://arxiv.org/abs/1912.08777) पेगासस 和 अंतराल वाक्य उद्देश्य
- [Lin (2004). ROUGE: A Package for Automatic Evaluation of Summaries](https://aclanthology.org/W04-1013/) पीला कागज
- [Maynez et al. (2020). On Faithfulness and Factuality in Abstractive Summarization](https://arxiv.org/abs/2005.00661) तथ्य परिदृश्य पेपर。
