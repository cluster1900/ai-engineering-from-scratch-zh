# कोरफेरेंस संकल्प

>  उसने फोन किया उसे. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 07 (POS & Parsing)
**Time:** ~60 分钟

## 问题
एक 300 शब्द से एक लेख में Apple Inc. के प्रत्येक उल्लेख को निकालें। लेख लिखा Apple 时很简单── लिखा the company、the、Cupertino के प्रौद्योगिकी दिग्गज या Jobs की फर्म 时就很难── यदि आप इन सभी उल्लेखों को एक ही इकाई में हल नहीं करते हैं, तो आपकी NER पाइपलाइन 60-80% उल्लेख को खो देगा──

कोरफ़ेरेंस रिज़ॉल्यूशन एक ही वास्तविक दुनिया इकाई के अभिव्यक्ति लिंक को एक क्लस्टर में इंगित करेगा। यह एक स्तर की एनएलपी (एनआरआर) और निम्न भाषा के बीच एक संयोजन है।

यह 2026 में महत्वपूर्ण क्यों हैः

- सारांशःCEO ने घोषणा की... vs Tim Cook ने घोषणा की... सारांश 应该说出 CEO 的名字──
- प्रश्न का उत्तर: उसने किससे फोन किया? 需要解析 她──
- जानकारी निकालना: एक ज्ञान ग्राफ 里同时有 PER1 ने Apple和 Jobs ने Apple को 作为不同条目,这是错的──
- बहु-दस्तावेज IE:合并多篇关于同一事件文章中的提到,就是跨-दस्तावेज कोरफेरेंस──

## 概念
![Coreference clustering: mentions → entities](../assets/coref.svg)

**The task.**输入: एक दस्तावेज़──输出:mention(span) के समूह, जिनमें से प्रत्येक समूह एक इकाई को इंगित करता है──

**Mention types.**

- **Named entity.**Tim Cook
- **Nominal.**प्रमुख  कंपनी 
- **Pronominal.**
- **Appositive.**Tim Cook, Apple के सीईओ,

**Architectures.**

1. **Rule-based (Hobbs, 1978).**基于语法树的代词解析,使用语法规则──很好的基线──在代词上意外地难以超越──
2. **Mention-pair classifier.**प्रति प्रति उल्लेख (m_i, m_j), पूर्वानुमान करें कि वे अधिक महत्वपूर्ण हैं या नहीं।
3. **Mention-ranking.**प्रत्येक उल्लेख के लिए, 排序候选前 (→ कोई पूर्व नहीं) ︎) ︎
4. **Span-based end-to-end (Lee et al., 2017).**ट्रांसफार्मर एन्कोडर──枚举所有长度上限内的候选 span──预测 उल्लेख स्कोर──为每 span 预测前前概率──贪心聚类──现代默认方案──
5. **Generative (2024+).**शीघ्र एक LLM: इस पाठ में प्रत्येक प्रत्यय और उसके पूर्ववर्ती को सूचीबद्ध करें. 在简单案例上效果不错,但在长文档和少见引用上会吃力──

**The evaluation metrics.**️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

**Known hard cases.**

- निर्दिष्ट विवरण इंगित करने से पहले प्रविष्ट की गई इकाई
- पहले उल्लेखित एक वाहन की गाड़ी से पहले उल्लेखित एक वाहन से पहले उल्लेखित एक वाहन से पहले उल्लेखित एक वाहन से पहले उल्लेखित एक वाहन से पहले उल्लेखित एक वाहन से पहले उल्लेखित एक वाहन से पहले उल्लेखित एक वाहन से पहले उल्लेखित एक वाहन से पहले उल्लेखित एक वाहन से पहले उल्लेखित एक वाहन से पहले उल्लेखित एक वाहन से पहले उल्लेखित एक वाहन से पहले उल्लेखित एक वाहन से पहले उल्लेखित एक वाहन से पहले उल्लेखित एक वाहन से पहले
- 中文、日文等 भाषाओं में शून्य अनाफोर※
- कैटाफोरा ((उच्चारण 出现在 संदर्भ 之前):जब **she**अंदर चला गया, मैरी मुस्कुराई।


```figure
coref-links
```

##  इसे निर्माण
### 步骤 1: पूर्व प्रशिक्षित तंत्रिका कोरफेरेंस (एलेनएनएलपी / स्पेस-एक्सपीरिएंटल)

```python
import spacy
nlp = spacy.load("en_coreference_web_trf")   # experimental model
doc = nlp("Apple announced new products. The company said they would ship soon.")
for cluster in doc._.coref_clusters:
    print(cluster, "->", [m.text for m in cluster])
```

एक लंबे दस्तावेज में, आप एक समान परिणाम प्राप्त होगाः
- क्लस्टर 1: [Apple, कंपनी, वे]
- समूह 2: [नए उत्पाद]

### 步骤 2: नियम आधारित उच्चारण समाधान (शिक्षण)

查看 `code/main.py`中仅使用 stdlib 的实现:

1. 抽取 उल्लेख:नामित संस्थाएं (大写 span) 代名词 (形容词) 具体描述 (形容词) X) 
2. प्रत्येक विशेषण के लिए, देखें पहले K 个 उल्लेख,并按以下因素打分:
   - लिंग/संख्या समझौते (heuristic)
   - हालिया ((越近越优)
   - वाक्यरचनात्मक भूमिका (प्रथम विषय)
3. 链接最高分前史──

यह तंत्रिका मॉडल के साथ प्रतिस्पर्धा नहीं कर सकता है, लेकिन यह खोज स्थान और अंत-से-अंत मॉडल को प्रदर्शित करता है।

### 步骤 3: LLM का उपयोग करना

```python
prompt = f"""Text: {text}

List every pronoun and noun phrase that refers to a person or company.
Cluster them by what they refer to. Output JSON:
[{{"entity": "Apple", "mentions": ["Apple", "the company", "it"]}}, ...]
"""
```

需要注意两种失败模式──第一,LLMs会过度合并(把指向两个不同人的him和her合并)──第二,LLMs会在长文档中漏掉提到──始终使用跨度抵消检查验──

### 步骤 4: मूल्यांकन

标准 conll-2012 स्क्रिप्ट 会计算 MUC、B3、CEAF-φ4,并报告平均值── आंतरिक मूल्यांकन के लिए,先在带标注的测试集 上做跨度级精度和回忆,再加入提到-链接 F1──

## 陷
- **Singleton explosion.**कुछ सिस्टम प्रत्येक उल्लेख को अपने स्वयं के समूह में रिपोर्ट करेंगे।
- **Pronouns in long context.** 2,000 से अधिक टोकन के दस्तावेज  performance会下降约15 F1──谨慎部分──
- **Gender assumptions.**硬编码 लिंग नियम 会在非二进制参考、组织、动物 上失效──使用学习模型或中立评分──
- **LLM drift on long docs.**单次 API 调用不可靠地对50+ 段落中的提到 聚类──使用滑窗+ merge──

## इसका उपयोग करें
2026 वर्ष का स्टैकः

| Situation | Pick |
|-----------|------|
| English, single document | `en_coreference_web_trf` (spaCy-experimental) 或 AllenNLP neural coref |
| Multilingual | 在 OntoNotes 或 Multilingual CoNLL 上训练的 SpanBERT / XLM-R |
| Cross-document event coref | 专门的 end-to-end models（2025–26 SOTA） |
| Quick LLM baseline | 带 structured-output coref prompt 的 GPT-4o / Claude |
| Production dialog systems | Rule-based fallback + neural primary + critical slots 的 manual review |

2026 साल में एनईआर के एकीकरण पैटर्नः पहले एनईआर का संचालन करें, फिर से कोर का संचालन करें, कोर क्लस्टर को एनईआर संस्थाओं में शामिल करें।

## 交付 यह
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

## अभ्यास
1. **Easy.**`code/main.py`中对 5 个手写段落运行 नियम आधारित resolver── ग्राउंड सत्य का उपयोग करके 引用-लिंक सटीकता को मापने हेतु──
2. **Medium.**एक समाचार लेख में पूर्व प्रशिक्षित तंत्रिका कोर मॉडल का उपयोग करके। यह आपके स्वयं के मैनुअल टिप्पणी के साथ क्लस्टर करेगा। यह किसमे विफल रहा है?
3. **Hard.** एक कोर-फ-प्रोफाइल एनईआर पाइपलाइन का निर्माणः पहले एनईआर, फिर से कोर-फ्लस्टर के माध्यम से 合并──衡量 100 篇文章上

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
- [Lee et al. (2017). End-to-end Neural Coreference Resolution](https://arxiv.org/abs/1707.07045)  基于 span 的端到端──
- [Joshi et al. (2020). SpanBERT](https://arxiv.org/abs/1907.10529) 改进 कोरफ के पूर्व प्रशिक्षण
- [Pradhan et al. (2012). CoNLL-2012 Shared Task](https://aclanthology.org/W12-4501/) बेंचमार्क。
- [Hobbs (1978). Resolving Pronoun References](https://www.sciencedirect.com/science/article/pii/0024384178900064) नियम आधारित 经典方法──
