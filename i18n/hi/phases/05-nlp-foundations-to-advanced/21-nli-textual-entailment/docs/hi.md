# प्राकृतिक भाषा推理  文本含

> "t entails h" का अर्थ है, व्यक्ति पढ़ता है 后会得出 h 为真论结论──NLI है पूर्वानुमानित संलग्नता / विरोधाभास / तटस्थ का कार्य──表面上枯燥, लेकिन उत्पादन में महत्वपूर्ण भूमिका निभाए──

**类型：**学习
**语言：**पायथन
**先修：**चरण 5 · 05 (भावना विश्लेषण), चरण 5 · 13 (प्रश्न उत्तर)
**时间：**~ 60 मिनट

## 问题

आप एक सारांशक बनाया है. यह एक सारांश उत्पन्न किया है. आप कैसे जानते हैं कि यह सारांश कोई पगड़ी नहीं है?

आप एक चैटबॉट बनाया है. यह जवाब दिया "हाँ. " आप कैसे पता है कि इस जवाब को प्राप्त किया है?

आप विषय पर विभाजन की आवश्यकता है 10,000 篇 समाचार लेखों──आपके पास प्रशिक्षण लेबल नहीं हैं──क्या आप एक मॉडल का उपयोग कर सकते हैं?

ये तीन प्रश्न प्राकृतिक भाषा के तर्क के रूप में प्रस्तुत किए जा सकते हैं।`t`और एक परिकल्पना `h`,`h``t`क्या यह एक विरोधाभासी या तटस्थ है?

- **Hallucination check:** `t`= स्रोत दस्तावेज,`h`= संक्षेप में दावा करना── नहीं समापन करना = भ्रम करना──
- **Grounded QA:** `t`= प्राप्त मार्ग,`h`= उत्पन्न उत्तर── नहीं समापन = निर्माण──
- **Zero-shot classification:** `t`= दस्तावेज,`h`= शब्दबद्ध लेबल ("यह खेल के बारे में है")。समावेश = भविष्यवाणी लेबल。

एक कार्य, तीन प्रकार के उत्पादन उद्देश्यों के साथ। यही कारण है कि प्रत्येक आरएजी मूल्यांकन ढांचे में एक एनएलआई मॉडल के साथ नीचे रखा गया है।

## 概念

![NLI: three-way classification, premise vs hypothesis](../assets/nli.svg)

**三个 labels。**

- **Entailment.** `t`→ `h`" बिल्ली गद्दे पर है" का अर्थ है "एक बिल्ली है।"
- **Contradiction.** `t`→`h`" बिल्ली गद्दे पर है" "कोई बिल्ली नहीं है" के विपरीत है।
- **Neutral.**"मक्खी गद्दे पर है" या "मक्खी भूख लगी है" तटस्थ है।

**不是逻辑 entailment。**एनएलआई एक *प्राकृतिक* भाषा का निष्कर्ष है, यानि कि एक विशिष्ट मानव पाठक सम्मेलन का निष्कर्ष है, न कि एक कठोर तर्क।

**Datasets。**

- **SNLI**(2015)──570k 人工标注 जोड़े,以图像字幕 作为前提──领域较窄──
- **MultiNLI**(२०७७, 〇 〇 〇) 10 शैलियों के ४३३,००० जोड़े 〇 २०२६ साल का मानक प्रशिक्षण पाठ्यक्रम 〇
- **ANLI**(2019) ――विरोधी एनएलआई── मानव विशेष रूप से मौजूदा मॉडल को मारने के लिए लिखे गए उदाहरण──
- **DocNLI, ConTRoL**(202021)── दस्तावेज़-लंबाई के स्थानों──测试 बहु-हॉप 和 लंबी दूरी के निष्कर्ष──

**架构。**एक ट्रांसफार्मर एन्कोडर ((BERT, ROBERTA, DEBERTA) पढ़取 `[CLS] premise [SEP] hypothesis [SEP]``[CLS]`प्रतिनिधित्व 输入到三道软max──在 MNLI上训练,在持久的基准上评估,在分发对上获得90%+精度──

**通过 NLI 做 zero-shot。**给定一个文件 和候选标签,把每个标签 转成一个假设("यह पाठ खेल के बारे में है")`zero-shot-classification`पाइपलाइन 背后的机制──


```figure
nli-router
```

##  इसे निर्माण

### 步骤 1: 运行一个预训练的NLI模型

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

 उत्पादन श्रेणी के एनएलआई के लिए,`facebook/bart-large-mnli`和 `microsoft/deberta-v3-large-mnli`️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

### 步骤 2: शून्य-शॉट वर्गीकरण

```python
zs = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

text = "The stock market rallied after the central bank cut interest rates."
labels = ["finance", "sports", "politics", "technology"]

result = zs(text, candidate_labels=labels)
print(result)
# {'labels': ['finance', 'politics', 'technology', 'sports'],
#  'scores': [0.92, 0.05, 0.02, 0.01]}
```

默认 टेम्पलेट 是 "यह उदाहरण {लेबल} के बारे में है।"―可用 `hypothesis_template`स्व परिभाषा──不需要培训数据──不需要细节调整──开箱即用──

### 步骤 3: RAG की निष्ठा जांच

```python
def is_faithful(answer, context, threshold=0.5):
    result = nli({"text": context, "text_pair": answer})[0]
    entail = next(s for s in result if s["label"] == "entailment")
    return entail["score"] > threshold
```

यह RAGAS निष्ठा का मूल है। यह उत्पन्न उत्तर है  परमाणु दावों में विभाजित  प्रत्येक दावों को प्रतिवेदन के संदर्भ से प्रतिवेदन में शामिल अनुपात 

### 步骤 4: 手写 NLI वर्गीकरण (Concept Edition)

查看 `code/main.py`中 केवल प्रयोग stdlib का खिलौना:प्रिमाइसेस 和 परिकल्पना व्यावहारिक ओवरलैप + नकारण पता लगाने  तुलना करें。 यह ट्रांसफार्मर मॉडल 竞争 के साथ नहीं हो सकता है, लेकिन प्रदर्शन किया गया है कार्य का आकार:输入两段文本,输出 3-तरफा लेबल, हानि = `{entail, contradict, neutral}`ऊपर की क्रॉस-एंट्रोपी

## 陷

- **Hypothesis-only shortcuts.**मॉडल केवल परिकल्पना को देखते हैं कि एसएनएलआई पर लगभग 60% की सटीकता दर का पूर्वानुमान लेबल हो सकता है, क्योंकि "नहीं""",कोई नहीं""",कभी" विरोधाभास से संबंधित है।
- **Lexical overlap heuristic.**अनुक्रमिक अनुक्रमिक (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपक्रमिक) (उपयोगिक) (उपयोगिक) (उपयोगिक) (उपयोगिक) (उपयोगिक) (उपयोगिक) (उपयोगिक) (उपयोगिक) (उपयोगिक) (उपयोगिक) (उपयोगिक) (उपयोगिक) (उपयोगिक) (उपयोगिक) (उपयोगिक) (उपयोगिक) (उपयोगिक) (उपयोगिक) (उपयोगिक) (उपयोग) (उपयोग) (उपयोग) (उपयोग) (उपयोग) (उपयोग) (उपयोग) (उपयोग) (उपयोग) (उपयोग) (उपयोग) (उपयोग) (उपयोग) (उपयोग) (उपयोग) (उपयोग) (उ) (उपयोग) (उपयोग) (उ) (उपयोग) (उ) (उ) (उ) (उ) (उ) (उ) (उ) (उ) (उ) (उ) (उ) (उ) (उ) (उ) (उ) (उ) (उ) (उ) (उ) (उ) (उ) (),),), (), (), (), (), (), (), (), (), (), (), (), (), (), (), (),
- **Document-length degradation.**एकल वाक्य एनएलआई मॉडल में दस्तावेज लंबाई परिसरों 上会下降 20+ F1──长上下文应使用 DocNLI-प्रशिक्षित मॉडल──
- **Zero-shot template sensitivity.**"यह उदाहरण {लेबल}"、"{लेबल}"、"विषय {लेबल}" 之间可能导致精度 波动 10+ अंक──需要调优模板──
- **Domain mismatch.**एमएनएलआई में सामान्य अंग्रेजी में प्रशिक्षण। कानून, चिकित्सा और विज्ञान के लिए विशेष एनएलआई मॉडल की आवश्यकता है।

## इसका उपयोग करें

2026 स्टैकः

| Use case | Model |
|---------|-------|
| 通用 NLI | `microsoft/deberta-v3-large-mnli` |
| 快速 / edge | `cross-encoder/nli-deberta-v3-base` |
| Zero-shot classification（轻量） | `facebook/bart-large-mnli` |
| Document-level NLI | `MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli` |
| Multilingual | `MoritzLaurer/multilingual-MiniLMv2-L6-mnli-xnli` |
| RAG 中的 hallucination detection | RAGAS / DeepEval 内部的 NLI layer |

2026 के मेटा-पैटर्नः एनएलआई है ग्रंथ समझ की万能── यदि आपको यह निर्णय लेने की आवश्यकता है कि क्या A B? का समर्थन करता है या क्या A B? के विपरीत है, तो  एक और LLM कॉल शुरू करने से पहले, पहले एनएलआई को विचार करें

## 交付 यह

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

## अभ्यास

1. **Easy.**个手写的在20 个手写的 前提, परिकल्पना, लेबल)`facebook/bart-large-mnli`,覆盖所有三类──测量精度──加入对抗性"次序" heuristic" फंसे("मैंने केक नहीं खाया" बनाम "मैंने केक खाया"),看看它是否会失效──
2. **Medium.**में 100 条 AG समाचार शीर्षकों 上比较零射模板 `"This text is about {label}"``"The topic is {label}"`和 `"{label}"` सटीकता स्विंग रिपोर्ट करें
3. **Hard.**构建一个RAG忠诚度检查器:原子-claims decomposition + प्रत्येक दावा करना NLI──在 50 个带金背景的RAG-genered answers 上评估──测量对人工标签的错正和错负率──

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
- [Bowman et al. (2015). A large annotated corpus for learning natural language inference](https://arxiv.org/abs/1508.05326) SNLI。
- [Williams, Nangia, Bowman (2017). A Broad-Coverage Challenge Corpus for Sentence Understanding through Inference](https://arxiv.org/abs/1704.05426) बहुविध 
- [Nie et al. (2019). Adversarial NLI](https://arxiv.org/abs/1910.14599) ANLI बेंचमार्क。
- [Yin, Hay, Roth (2019). Benchmarking Zero-shot Text Classification](https://arxiv.org/abs/1909.00161) NLI-as-classifier。
- [He et al. (2021). DeBERTa: Decoding-enhanced BERT with Disentangled Attention](https://arxiv.org/abs/2006.03654) 2026 के एनएलआई 主力──
