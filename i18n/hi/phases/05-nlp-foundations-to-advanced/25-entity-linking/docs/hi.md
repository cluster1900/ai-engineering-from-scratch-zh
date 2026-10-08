# 实体链接与消歧

> NER 找到了 "पेरिस"──संस्था जोड़ी करने वाली है 必須決定:पेरिस, फ्रांस?पेरिस हिल्टन?पेरिस, टेक्सास?पेरिस(ट्रोजन राजकुमार? यदि कोई लिंक नहीं है, तो आपका ज्ञान ग्राफ 仍然是模糊的──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 24 (Coreference Resolution)
**Time:** ~60 分钟

## 问题

句子写道:"जॉर्डन ने प्रेस को हराया। "आपके NER ने "जॉर्डन" को व्यक्ति के रूप में चिह्नित किया।

- माइकल जॉर्डन?
- माइकल बी. जॉर्डन?
- माइकल I. जॉर्डन ((बर्क्ले एमएल प्रोफेसर  हाँ, इस तरह के मिश्रण एमएल कागजात 里真的存在)?
- जॉर्डन?
- जॉर्डन (हिब्रू नाम)?

इकाई लिंकिंग (EL) प्रत्येक उल्लेख को ज्ञान आधार में हल करेगा.

1. **Candidate generation。**给定 "जॉर्डन", कौन सी KB प्रविष्टियाँ है संभव?
2. **Disambiguation。**                                                                                                                                                                                                                                                              

 दो चरणों में सब कुछ सीखना है  दो चरणों में बेंचमार्क है  组合后的管道 已稳定了十年  变化是分歧的质量

## 概念

![Entity linking pipeline: mention → candidates → disambiguated entity](../assets/entity-linking.svg)

**Candidate generation。**给定 उल्लेख सतह रूप("जॉर्डन"),在别名指数 中查找候选人──维基百科别名词典 覆盖大多数命名实体:"JFK" → जॉन एफ. केनेडी、 जैक्लीन केनेडी、जेकेके हवाई अड्डा、जेकेके(फिल्म)──典型指数 会为每个提名 返回 10-30 个候选人──

**Disambiguation：三种方法。**

1. **Prior + context (Milne & Witten, 2008)。** `P(entity | mention) × context-similarity(entity, text)`️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️
2. **Embedding-based (ESS / REL / Blink)。**एनकोड उल्लेख + संदर्भ── एनकोड प्रत्येक उम्मीदवार का विवरण── चयन कॉस्मीन 最大的──2020-2024 साल के默认方法──
3. **Generative (GENRE, 2021; LLM-based, 2023+)。**逐 टोकन डिकोड इकाई का कैनोनिक नाम── एक मान्य इकाई नामों के लिए सीमित है, इसलिए输出保证是有效 KB id──

**End-to-end vs pipeline。**现代 मॉडल (ELQ、BLINK、ExtEnD、GENRE) एक बार में 中运行 NER + उम्मीदवार पीढ़ी + असंबद्धता。 पाइपलाइन सिस्टम 在生产中仍占主导地位,因为你可以替换组件──

### दो संकेतक

- **Mention recall (candidate gen)。**मध्य,正确 KB प्रविष्टि 出现在候选人名单中的比例──这是整个管道的下限──
- **Disambiguation accuracy / F1。** सही उम्मीदवारों को दिया, शीर्ष 1  अधिक बार सही होते हैं

始终同时报告两者──80% उम्मीदवारों में से एक याद दिलाता है ऊपर 99% असंबद्धता है प्रणाली, मूलतः 80% पाइपलाइन है──


```figure
gx-entity-linking
```

##  इसे निर्माण

### 步骤 1: विकिपीडिया से पुनर्निर्देशित 构建 alias index

```python
alias_to_entities = {
    "jordan": ["Q41421 (Michael Jordan)", "Q810 (Jordan, country)", "Q254110 (Michael B. Jordan)"],
    "paris":  ["Q90 (Paris, France)", "Q663094 (Paris, Texas)", "Q55411 (Paris Hilton)"],
    "apple":  ["Q312 (Apple Inc.)", "Q89 (apple, fruit)"],
}
```

विकिपीडिया उपनाम डेटाः लगभग 18M 个 (अज्ञात, इकाई) जोड़े── From Wikidata dumps 下载──存为 उल्टा सूचकांक──

### 步骤 2: संदर्भ के आधार पर असंगति

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

जैकर्ड ओवरलैप एक खिलौना है।`code/main.py`चरण-2) 

### 步骤 3:अंतर-आधारित

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

एक बार में प्रत्येक KB इकाई को एम्बेड करने के लिए, एक बार में प्रश्न समय, एक बार में उल्लेख + संदर्भ एम्बेड करने के लिए, एक बार में उम्मीदवार पूल को डॉट-प्रोडक्ट बनाने के लिए, अधिकतम मूल्य चुनें।

### 步骤 4:संरचनात्मक इकाई जोड़ने ((概念)

GENRE 会逐字符解码实体的维基百科标题──限度解码──见课 20) 确保只能输出有效标题──它与 KB समर्थित trie 紧密集成──现代后继是 REL-GEN,以及带结构化输出的LLM-prompted EL──

```python
prompt = f"""Text: {text}
Mention: {mention}
List the best Wikipedia title for this mention.
Respond with JSON: {{"title": "..."}}"""
```

结合 श्वेतसूची `choice`), यह 2026 वर्ष की सबसे आसान ईएल पाइपलाइन है।

### चरण 5: एआईडीए-सीओएनएलएल पर मूल्यांकन

AIDA-CoNLL is standard EL benchmark:1,393 篇 रॉयटर्स लेख、34k उल्लेख、विकिपीडिया संस्थाएँ── रिपोर्ट इन-केबी सटीकता(`P@1`) तथा केबी से बाहर की एनआईएल-जांच दर。

## 陷

- **NIL handling。**कुछ उल्लेखों में नहीं है KB में नया उभरते हुए संस्थाएँ  शीतल व्यक्ति)  सिस्टम  को NIL का अनुमान लगाना चाहिए, न कि अनुमानित इकाई 
- **Mention boundary errors。**上游 NER 漏掉 आंशिक स्पैन्स("बैंक ऑफ अमेरिका" केवल "बैंक" के रूप में चिह्नित)
- **Popularity bias。** प्रशिक्षण प्रणाली  अत्यधिक पूर्वानुमानित आवृत्ति  एमएल पेपर  में "माइकल आई. जॉर्डन"  往往会  से जुड़ते हैं
- **Cross-lingual EL。**把中文文本中的 उल्लेख 映射到英语维基百科实体──需要多语言编码或翻译步骤──
- **KB staleness。**नई कंपनी, नई घटना, नए व्यक्ति पिछले साल विकिपीडिया डिंप में नहीं थे।

## इसका उपयोग करें

2026 वर्ष का स्टैकः

| Situation | Pick |
|-----------|------|
| 通用 English + Wikipedia | BLINK or REL |
| Cross-lingual, KB = Wikipedia | mGENRE |
| LLM-friendly, 少量 mentions/day | Prompt Claude/GPT-4 with candidate list + constrained JSON |
| Domain-specific KB（medical, legal） | Custom BERT with KB-aware retrieval + fine-tune on domain AIDA-style set |
| 极低 latency | Exact-match prior only (Milne-Witten baseline) |
| Research SOTA | GENRE / ExtEnD / generative LLM-EL |

2026 साल可上線的生产模式:NER → coref → प्रत्येक उल्लेख के लिए करें EL → क्लस्टर को एक कैनोनिक इकाई में फोल्ड करें ∙ आउटपुटःdocument 中每一个实体 一个 KB id,而不是每一个提到 一个──

## 交付 यह
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

## अभ्यास

1. **Easy。**`code/main.py`मध्य, 10  अस्पष्ट उल्लेखों के आधार पर (पेरिस, जॉर्डन, ऐप्पल) पूर्व + संदर्भ असंगतिकरण को प्राप्त करें।
2. **Medium。**प्रयोग वाक्य ट्रांसफार्मर को कोड 50 个 अस्पष्ट उल्लेखों──Embed प्रत्येक उम्मीदवार का विवरण── तुलना एम्बेडिंग आधारित असंबद्धता 和 जैकार्ड संदर्भ ओवरलैप──
3. **Hard。**构建一个1k-实体域 KB(例如你公司的员工+产品) 实现端到端 NER + EL──在100 条中延长的句子上测量精度和回忆──

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
- [Milne, Witten (2008). Learning to Link with Wikipedia](https://www.cs.waikato.ac.nz/~ihw/papers/08-DM-IHW-LearningToLinkWithWikipedia.pdf) मौलिक पूर्व + संदर्भ 方法。
- [Wu et al. (2020). Zero-shot Entity Linking with Dense Entity Retrieval (BLINK)](https://arxiv.org/abs/1911.03814) 基于嵌入 的主力方法──
- [De Cao et al. (2021). Autoregressive Entity Retrieval (GENRE)](https://arxiv.org/abs/2010.00904) 带 प्रतिबंधित डिकोडिंग के जनरेटिव EL──
- [Hoffart et al. (2011). Robust Disambiguation of Named Entities in Text (AIDA)](https://www.aclweb.org/anthology/D11-1072.pdf) बेंचमार्क 论文──
- [REL: An Entity Linker Standing on the Shoulders of Giants (2020)](https://arxiv.org/abs/2006.01969) 开源 उत्पादन स्टैक──
