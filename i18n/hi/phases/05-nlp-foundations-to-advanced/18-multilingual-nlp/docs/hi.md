# 多语言 एनएलपी

> एक मॉडल, 100 से अधिक भाषाओं, जिनमें से अधिकांश भाषाओं में कोई प्रशिक्षण डेटा नहीं है।

**Type:** Learn
**Languages:** Python
**先修要求：**चरण 5 · 04 (ग्लोवे, फास्टटेक्सट, सबवर्ड), चरण 5 · 11 (मशीन अनुवाद)
**Time:** ~45 分钟

## 问题

अंग्रेजी में अरबों लेबल वाले नमूने हैं। उर्दू में हजारों हैं। लगभग कोई भी भाषा नहीं है। किसी भी व्यावहारिक एनएलपी प्रणाली का उपयोग करने वाले वैश्विक उपयोगकर्ता को उन सभी कार्यों को संभालने में सक्षम होना चाहिए जिनके लिए कोई विशिष्ट कार्य प्रशिक्षण डेटा नहीं है।

बहुभाषी मॉडल कई भाषाओं में एक ही समय में एक मॉडल को प्रशिक्षित करके इस समस्या को हल करने में सक्षम है। साझाकरण का कहना है कि मॉडल उच्च संसाधन भाषा से सीखी गई क्षमता को कम संसाधन भाषा में स्थानांतरित करने में सक्षम है। अंग्रेजी भावनात्मक विश्लेषण के साथ मॉडल को ठीक से ट्यून करने के लिए, यह उर्दू भाषा के लिए काफी सही भावनात्मक पूर्वानुमान देने के लिए एक बॉक्स खोलने में सक्षम है। यह शून्य शॉट है 跨भाषा संक्रमण, यह एनएलपी को वैश्विक वितरण के तरीके को फिर से आकार देता है।

इस कक्षा में संबंधित वजन, क्लासिक मॉडल, तथा एक टीम जो अक्सर बहुभाषी काम करना शुरू कर देती है, के निर्णयों को समझाया जाएगाः

## 概念

![通过共享多语言 Embedding space 实现跨语言迁移](../assets/multilingual.svg)

**共享词表。**बहुभाषी मॉडल का उपयोग सभी लक्ष्य भाषाओं के ग्रंथों पर अभ्यास करने वाले वाक्य टुकड़े या WordPiece टोकनराइज़र में किया जाता हैः शब्द का उपयोग एक ही उपशब्द से किया जाता है।`anti-`मैं एक ही टोकन प्राप्त होगा.

**共享表示。**कई भाषाओं में मास्क भाषा मॉडलिंग का प्रयोग करके 预训练的变化器,会学到不同语言中语义相似的句子会产生相似的隐藏状态──mBERT、XLM-R和 NLLB都表现出这一点──英语中"猫" के एम्बेडिंग्स 会聚集在法语中语中语中语中语中语义相似的句子中语相似的句子会产生相似的隐藏状态──mBERT、XLM-R和 NLLB都表现出这一点──英语中猫的嵌入式 会聚集在法语中语中语中语中语中语中语中语的嵌入式和西班牙语中语中语中语中语中语相似的句子中语相似的句子中语中语义相似的句子中语中语相似的句子中语中语中语义相似的句子中语中语中语中语语中语义相似的句子中语中语中语中语中语中语中语中语语中语中语中语相似的句子中语语中语中语中语中语中语中语中语中语中语中语中语中语中语中语中语中语中语语中语中语中语中语语中语中语中语中语中语相似的语语语中语中语中语中语中语中语中语中语中语中语中语中语中语中语中语中语中语语中语中语中语中语中语相似的语语中语中语中语中语中语中语中语中语语中语中语中语中语中语中语语中语中语中语中语中语中语中语中语中语中语中语中语中语中语中语中语中语中语中语中语语中语中语语中语中语中语中语中语中语中语中语中语中语中语语语中语中语中语中语中语中语中语和语中语中语中语中语中语中语中语中语中语

**Zero-shot 迁移。**एक भाषा में (आमतौर पर अंग्रेजी में) लेबल के साथ डेटा पर ठीक-ठीक 模型──推理时, मॉडल समर्थित किसी भी अन्य भाषा पर इसे चलाना──不需要目标语言标签──

**Few-shot fine-tuning。**लक्ष्य भाषा में 100-500  लेबल वाले नमूने जोड़ें ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

## 模型

| Model | Year | Coverage | Notes |
|-------|------|----------|-------|
| mBERT | 2018 | 104 languages | 在 Wikipedia 上训练。第一个实用的多语言 LM。低资源语言表现较弱。 |
| XLM-R | 2019 | 100 languages | 在 CommonCrawl 上训练（比 Wikipedia 大得多）。确立了跨语言 baseline。Base 270M，Large 550M。 |
| XLM-V | 2023 | 100 languages | 具有 1M-token 词表的 XLM-R（相比 250k）。低资源语言表现更好。 |
| mT5 | 2020 | 101 languages | 用于多语言生成的 T5 架构。 |
| NLLB-200 | 2022 | 200 languages | Meta 的翻译模型；包含 55 种低资源语言。 |
| BLOOM | 2022 | 46 languages + 13 programming | 以多语言方式训练的开放 176B LLM。 |
| Aya-23 | 2024 | 23 languages | Cohere 的多语言 LLM。在阿拉伯语、印地语、斯瓦希里语上表现强。 |

按用例选择──分类任务可以把XLM-R-base 作为稳定的默认值──生成任务需要根据翻译还是开放生成,在mT5或NLLB 之间选择──LLM 风格工作可以搭配 Aya-23或Claude,并使用明确的多语言提示──

## 源语言决策(2026研究)

अधिकांश टीमों ने अंग्रेजी को ठीक से समायोजित करने के लिए उपयोग करने की मान्यता दी है।

语言相似性原始语料规模更能预测迁移质量──对于斯拉夫语目标语言,德语或俄语往往优于英语──对于印度语族目标语言,印度语往往优于英语──**qWALS**इसी तरह की भाषाओं के ढांचे के विश्व एटलस की विशेषताओं के आधार पर 2026 में इस बिंदु पर माप किया गया।**LANGRANK**(Lin et al., ACL 2019) एक और अधिक प्रारंभिक विधि है, जो भाषा की समानता, भाषा के आकार और वंशानुक्रम को जोड़ती है, उम्मीदवार स्रोत भाषा के लिए क्रमबद्ध करती है।

 व्यावहारिक नियम: यदि आपकी लक्ष्य भाषा में एक प्रकार के उच्च संसाधनों के निकटतम भाषा है, तो पहले उस भाषा पर ठीक से ट्यून करने का प्रयास करें, फिर अंग्रेजी के साथ तुलनात्मक रूप से ठीक से ट्यून करें।


```figure
n5-crosslingual-bridge
```

## 构建

### 步骤 1: शून्य शॉट 跨语言分类

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

tok = AutoTokenizer.from_pretrained("joeddav/xlm-roberta-large-xnli")
model = AutoModelForSequenceClassification.from_pretrained("joeddav/xlm-roberta-large-xnli")


def classify(text, candidate_labels, hypothesis_template="This text is about {}."):
    scores = {}
    for label in candidate_labels:
        hypothesis = hypothesis_template.format(label)
        inputs = tok(text, hypothesis, return_tensors="pt", truncation=True)
        with torch.no_grad():
            logits = model(**inputs).logits[0]
        entail_score = torch.softmax(logits, dim=-1)[2].item()
        scores[label] = entail_score
    return dict(sorted(scores.items(), key=lambda x: -x[1]))


print(classify("I love this product!", ["positive", "negative", "neutral"]))
print(classify("मुझे यह उत्पाद पसंद है!", ["positive", "negative", "neutral"]))
print(classify("J'adore ce produit !", ["positive", "negative", "neutral"]))
```

एक मॉडल, तीन भाषाएं, एक ही एपीआई──XLM-R में एनएलआई डेटा पर प्रशिक्षण, समावेशी चाल के माध्यम से 能很好地迁移到分类任务──

### 步骤 2: 多语言 अंतरिक्ष को एम्बेड करना

```python
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

pairs = [
    ("The cat is sleeping.", "Le chat dort."),
    ("The cat is sleeping.", "El gato está durmiendo."),
    ("The cat is sleeping.", "Die Katze schläft."),
    ("The cat is sleeping.", "The dog is barking."),
]

for eng, other in pairs:
    emb_eng = model.encode([eng], normalize_embeddings=True)[0]
    emb_other = model.encode([other], normalize_embeddings=True)[0]
    sim = float(np.dot(emb_eng, emb_other))
    print(f"  {eng!r} <-> {other!r}: cos={sim:.3f}")
```

译文会落在嵌入空间中相相近的位置中相相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相近的位置中相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相相

### 步骤 3: कुछ शॉट ठीक-ट्यूनिंग 策略

```python
from transformers import TrainingArguments, Trainer
from datasets import Dataset


def few_shot_finetune(base_model, base_tokenizer, examples):
    ds = Dataset.from_list(examples)

    def tokenize_fn(ex):
        out = base_tokenizer(ex["text"], truncation=True, max_length=128)
        out["labels"] = ex["label"]
        return out

    ds = ds.map(tokenize_fn)
    args = TrainingArguments(
        output_dir="out",
        per_device_train_batch_size=8,
        num_train_epochs=5,
        learning_rate=2e-5,
        save_strategy="no",
    )
    trainer = Trainer(model=base_model, args=args, train_dataset=ds)
    trainer.train()
    return base_model
```

对于100-500 个目标语言样本,`num_train_epochs=5`和 `learning_rate=2e-5`यह एक स्थिर मान है। उच्च सीखने की दर से बहुभाषी एक साथ टूट जाते हैं, अंततः एक अंग्रेजी-मात्र का मॉडल मिलता है।

## वास्तविक प्रभावी मूल्यांकन

- **在 held-out 集上按语言统计准确率。**मत जमाओ। जमाओ का संकेत छिपाएगा।
- **与单语言 baseline 对比。**DATA पर्याप्त भाषा के लिए, एक प्रशिक्षण से एक भाषा मॉडल कई भाषाओं के मॉडल से बेहतर होता है 
- **Entity-level 测试。**目標言語中的命名实体──多语言模型对远离拉丁文字的书写系统通常标记化较弱──
- **跨语言一致性。**两种语言表达相同意义时,应产生相同预测――衡量它们之间的差异――

## उपयोग

2026 技术:

| Task | Recommended |
|-----|-------------|
| Classification, 100 languages | XLM-R-base (~270M) fine-tuned |
| Zero-shot text classification | `joeddav/xlm-roberta-large-xnli` |
| Multilingual sentence embeddings | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` |
| Translation, 200 languages | `facebook/nllb-200-distilled-600M`（见 lesson 11） |
| Generative multilingual | Claude, GPT-4, Aya-23, mT5-XXL |
| Low-resource language NLP | XLM-V 或在相关高资源语言上做 domain-specific fine-tune |

यदि प्रदर्शन महत्वपूर्ण है, तो निश्चित रूप से लक्ष्य भाषा ठीक-ठीक करने के लिए 预留预算──零-shot ही प्रारंभ बिंदु है, अंतिम उत्तर नहीं──

### टोकनाइज़ेशन 成本(低资源语言会出什么问题)

बहुभाषी मॉडल सभी भाषाओं के बीच एक टोकन साझा करते हैं। यह शब्दकोश अंग्रेजी, फ्रेंच, स्पेनिश, चीनी, जर्मन से संचालित की गई भाषाओं पर प्रशिक्षित किया जाता है।

- **Fertility 成本。**低资源语言文本会被代币化成比英语更多的代币―― एक भारतीय语句可能需要等价英语句的3-5x代币―― यह 3-5x आपके उपर्युक्त निम्न文窗口、训练效率和延迟预算──
- **变体恢复成本。**प्रत्येक वर्तनी त्रुटि, अतिरिक्त प्रतीक परिवर्तन, यूनिकोड, विनियमन असंगत या बड़े लेखन परिवर्तन, एम्बेडिंग अंतरिक्ष में एक ठंडे प्रारंभ की अनियमित क्रम में बदल जाता है।
- **容量外溢成本。**1. और 2. निम्न स्थान, स्तर गहराई और एम्बेडिंग आयामों पर खपत करते हैं।

实际症状是: आपके मॉडल को भारतीय भाषा में प्रशिक्षित करना सामान्य है, खोई हुई वक्रता सही लगती है, उलझन उचित लगती है, उत्पादन आउटपुट पर सूक्ष्म त्रुटि है।**Tokenizer 坏了，靠扩大数据规模救不回来。**

缓解方式: चयन एक पर लक्ष्य भाषा覆盖良好的 टोकनराइज़र(XLM-V के 1M-token 词表就是直接修复); प्रशिक्षण前在 目标文本上验证 टोकनराइजेशन उर्वरता; वास्तविक长尾 के लिए लेखन प्रणाली का उपयोग बाइट-स्तरीय fallback(SentencePiece `byte_fallback=True`,GPT-2 风格 बाइट-स्तर BPE), सुनिश्चित करें कि कभी भी OOV नहीं होगा

## 交付

保存为 `outputs/skill-multilingual-picker.md`:

```markdown
---
name: multilingual-picker
description: 为多语言 NLP 任务选择源语言、目标模型和评估计划。
version: 1.0.0
phase: 5
lesson: 18
tags: [nlp, multilingual, cross-lingual]
---

给定需求（目标语言、任务类型、每种语言可用的带标签数据），输出：

1. Fine-tuning 的源语言。默认英语；如果目标语言有类型学上接近的高资源语言，检查 LANGRANK 或 qWALS。
2. Base model。XLM-R（classification）、mT5（generation）、NLLB（translation）、Aya-23（generative LLM）。
3. Few-shot 预算。如果可用，从 100-500 个目标语言样本开始。只有在标注不可行时才使用 zero-shot。
4. 评估计划。按语言统计准确率（不是聚合）、跨语言一致性、非拉丁文字上的 entity-level F1。

拒绝交付没有按语言评估的多语言模型，因为聚合指标会掩盖长尾失败。将 tokenization 覆盖率低的书写系统（阿姆哈拉语、提格里尼亚语、许多非洲语言）标记为需要带 byte-fallback 的模型（带 byte_fallback=True 的 SentencePiece，或像 GPT-2 一样的 byte-level tokenizer）。
```

## अभ्यास

1. **Easy.**अंग्रेजी, फ्रेंच, हिंदी और अरबी भाषाओं में, प्रत्येक भाषा में 10 वाक्य होते हैं, शून्य शॉट वर्गीकरण पाइपलाइन चलती है।
2. **Medium.**उपयोग `paraphrase-multilingual-MiniLM-L12-v2`एक छोटे से मिश्रित भाषा की भाषा में एक अंतर भाषा जांचकर्ता पर निर्मित।
3. **Hard.**इन दोनों योजनाओं में 500  लक्ष्य भाषा नमूनों का उपयोग करके कुछ शॉट्स के साथ  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक-ठीक  ठीक  ठीक-ठीक  ठीक  ठीक  ठीक  ठीक  ठीक 

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Multilingual model | 一个模型，多种语言 | 跨语言共享词表和参数。 |
| Cross-lingual transfer | 在一种语言上训练，在另一种语言上运行 | 在源语言上 fine-tune，在没有目标语言标签的情况下在目标语言上评估。 |
| Zero-shot | 没有目标语言标签 | 不在目标语言上 fine-tune 的迁移。 |
| Few-shot | 少量目标标签 | 用于 fine-tuning 的 100-500 个目标语言样本。 |
| mBERT | 第一个多语言 LM | 在 Wikipedia 上预训练的 104 语言 BERT。 |
| XLM-R | 标准跨语言 baseline | 在 CommonCrawl 上预训练的 100 语言 RoBERTa。 |
| NLLB | Meta 的 200 语言 MT | No Language Left Behind。包含 55 种低资源语言。 |

## 延伸阅读

- [Conneau et al. (2019). Unsupervised Cross-lingual Representation Learning at Scale](https://arxiv.org/abs/1911.02116) XLM-R 论文──
- [Pires, Schlinger, Garrette (2019). How Multilingual is Multilingual BERT?](https://arxiv.org/abs/1906.01502) 开启跨语言迁移研究线的分析论文──
- [Costa-jussà et al. (2022). No Language Left Behind](https://arxiv.org/abs/2207.04672) NLLB-200 论文──
- [Üstün et al. (2024). Aya Model: An Instruction Finetuned Open-Access Multilingual Language Model](https://arxiv.org/abs/2402.07827) Aya,Cohere का बहुभाषी LLM。
- [Language Similarity Predicts Cross-Lingual Transfer Learning Performance (2026)](https://www.mdpi.com/2504-4990/8/3/65) QWALS / LANGRANK 源语言论文。
