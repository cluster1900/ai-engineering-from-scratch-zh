# 多语言 نLP

> نموذج، 100 + 种语言، معظم اللغات لا تمرين للبيانات.

**Type:** Learn
**Languages:** Python
**先修要求：**المرحلة 5 · 04 (GloVe، FastText، Subword) ، المرحلة 5 · 11 (ترجمة الآلة)
**Time:** ~45 分钟

## 问题

هناك مليارات من النماذج المعلقة باللغة الإنجليزية. هناك آلاف من اللغات الأوربية.

تمكن نموذج متعدد اللغات من نقل القدرة على التعلم من لغة عالية الوسائل إلى لغة منخفضة الوسائل. تمكن من تحليل العاطفة الإنجليزية على النموذج من إجراء ضبطات دقيقة ، ويمكن أن يفتح الصندوق على الفور لإعطاء توقعات عاطفية غير خاطئة إلى اللغة الأوربية.

هذا الدروس سوف يوضح الوزن المتعلقة والنموذج الكلاسيكي، وكذلك قرار فريق من المستخدمين في العمل متعددة اللغات:

## 概念

![通过共享多语言 Embedding space 实现跨语言迁移](../assets/multilingual.svg)

**共享词表。**تعريف اللغة متعددة اللغات تستخدم في جميع لغات المستهدفة تعليما على متن جملة أو كلمة تميزة. تعريف اللغة المشتركة: نفس كلمة فرعية 单元表示相同词素在相关语言中──英语和意大利语中.`anti-`سأحصل على نفس الشريحة

**共享表示。**في العديد من اللغات على استخدام نمذجة اللغة المخفية 预训练的变former,会学到不同语言中语义相似的句子会产生相似的隐藏状态──mBERT、XLM-R 和 NLLB 都表现出这一点──英语中"猫"的嵌入会聚集在法语中语中语中语中语中语语中语义相似的句子会产生相似的隐藏状态──mBERT、XLM-R 和 NLLB 都表现出这一点──英语中语中语中的"猫"的嵌入会聚集在法语中语中语中语中语中语中语语中语义相似的句子会产生相似的隐藏状态──英语中语中语中语语语中语义相似的句子会聚集在法语中语中语中语中语中语中语中语语中语语中语语中语语相似的句子中语中语中语语中语语中语语语中语语相似的句子中语语中语中语中语语中语中语语中语语中语语中语语语语中语和语语中语语中语中语中语中语语中语中语中语中语语中语语中语中语中语语中语中语中语中语中语语中语语中语语语中语中语和语语语中语中语中语中语中语语中语中语中语语中语中语语语语中语中语中语中语中语和语语语中语中语中语中语中语语中语和语中语语中语中语语语中语中语中语中语中语中语语中语中语中语中语中语中语中语中语中语和语中语中语中语中语中语中语中语语语语中语中语中语语中语中语中语语和语中语语语中语中语中语语语中语中语中语中语中语和语中语中语中语中语中语中语中语中语中语中语中

**Zero-shot 迁移。**في لغة واحدة (عادةً باللغة الإنجليزية) مع علامات على بيانات الموديل. عند التفكير، يتم تشغيلها على أي لغة أخرى تدعم الموديل.

**Few-shot fine-tuning。**إضافة 100-500 نموذج مع علامات في اللغة المستهدفة. يرتفع معدل تحديد المهام إلى 95-98% من القاعدة الإنجليزية.

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

按用例选择──分类任务可以把XLM-R-base 作为稳定的默认值──生成任务需要根据翻译还是开放生成,在MT5或NLLB 之间选择──LLM 风格工作可以搭配 Aya-23或Claude,并使用明确的多语言提示──

## 源语言决策(2026 研究)

العديد من المجموعات يستخدمون الإنجليزية كمناسبة دقيقة لللغة.

语言相似性比原始语料规模更能预测迁移质量──对于斯拉夫语目标语言,德语或俄语往往优于英语──对于印度语族目标语言,印度语往往优于英语──**qWALS**تم تقييم هذا النقطة على أساس ميزات "آطلس العالمي للهيكل اللغوي" لعام 2026.**LANGRANK**(Lin et al., ACL 2019) هو طريقة أخرى أقدم، وهي تتضمن شباهة اللغة، حجم المواد، والصنف، والترتيب على لغات المصدر المرشح.

قاعدة عملية: إذا كان لغتك المستهدفة لديها نوعية قريبة من لغة ذات مصادر عالية، حاول أولاً ضبطها بشكل جيد، ثم ضبطها بشكل جيد مع اللغة الإنجليزية.


```figure
n5-crosslingual-bridge
```

## الإنشاء

### الخطوة الأولى: الصفر الصارخ 跨语言分类

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

نموذج، ثلاث لغات، نفس API.XLM-R في NLI اعدادات على تدريب، من خلال خدعة التمثيل يمكن أن تنتقل بشكل جيد إلى قسم المهام.

### 步骤 2: 多语言 إدراج المساحة

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

译文会落在嵌入空间 中相近的位置──另一句不同的英语句子会落得更远──这是跨语言检查、集群和相似度能够工作的原因──

### الخطوة الثالثة: استراتيجية ضبط دقيقة

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

对于100-500 个目标语言样本,`num_train_epochs=5`和 `learning_rate=2e-5`يصل إلى نسبة تعلّم أعلى إلى انهيار اللغة المتعددة، في النهاية تحصل على نموذج واحد فقط لللغة الإنجليزية.

## تقييم حقيقي فعال

- **在 held-out 集上按语言统计准确率。**لا تجمع. تجمع. تجمع.
- **与单语言 baseline 对比。**بالنسبة للغات الكافية للبيانات، فإن نموذج اللغة الواحدة من التدريبات في بعض الأحيان يكون أفضل من نموذج اللغة المتعددة.
- **Entity-level 测试。**目標語言中的命名实体──多语言模型对远离拉丁文字的书写系统通常标记化较弱──
- **跨语言一致性。**عندما يكون هناك نفس المعنى في لغتين، يجب أن يكون هناك نفس التوقعات.

## استخدام

2026 技术:

| Task | Recommended |
|-----|-------------|
| Classification, 100 languages | XLM-R-base (~270M) fine-tuned |
| Zero-shot text classification | `joeddav/xlm-roberta-large-xnli` |
| Multilingual sentence embeddings | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` |
| Translation, 200 languages | `facebook/nllb-200-distilled-600M`（见 lesson 11） |
| Generative multilingual | Claude, GPT-4, Aya-23, mT5-XXL |
| Low-resource language NLP | XLM-V 或在相关高资源语言上做 domain-specific fine-tune |

إذا كان الأداء مهمًا ، يجب أن يكون هناك تحسين لغة هدف 預留預算── صفر-shot هو البدء ، وليس الحل النهائي──

### التكنولوجيا 成本(低资源语言会出什么问题)

تعتبر هذه الكلمات تدرب على المواد التي تتحكم في اللغة الإنجليزية والفرنسية والإسبانية والصينية والألمانية.

- **Fertility 成本。**سيتم توكنيزية النصوص اللغوية المنخفضة الموارد كرمز أكثر من اللغة الإنجليزية. قد تحتاج جملة هندية إلى رمز بنسبة 3-5x من العدد المُساوي للقواعد اللغوية.
- **变体恢复成本。**كل خطأ في النصوص، وتغيرات رمزية إضافية، وتغيرات في اليونيكود، تتحول إلى سلسلة من غير المرتبطة بالبدء البارد في مساحة الإضافة.
- **容量外溢成本。**تمتلك المجموعة 1 و 2 كمية من المستخدمين على الموقع التالي، ويعمل على مستوى عمق ووضع الوضع في المجموعة، وتركها على قدرة التفكير الفعلي، وهي أقل من قدرة نفس النموذج على قدرة اللغة ذات الصلة.

العلامات الحقيقية هي: نموذجك يتدرب على الهندية بشكل طبيعي، الخسارة 曲線 تبدو صحيحة، الارتباكات العصرية تبدو معقولة، إنتاج المنتجات ولكن خطأ بسيط.**Tokenizer 坏了，靠扩大数据规模救不回来。**

缓解方式: اختيار رمزية جيدة ل لغة هدف ((XLM-V) 1M-token 词表就是直接修复); training前在 目标文本上验证令牌化肥沃;对真正长尾的书写系统使用字节级倒退(SentencePiece `byte_fallback=True`،GPT-2 风格 بايت مستوى BPE) ، ضمان عدم وجود أبدا OOV

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

## التدريب

1. **Easy.**في الإنجليزية والفرنسية والهندية والعربية، كل لغة تأخذ 10 جملة، وتعمل على خط أنابيب تصنيف صفر إطلاق.
2. **Medium.**استخدام `paraphrase-multilingual-MiniLM-L12-v2`في مكونة من لغات مختلطة صغيرة، تم بناء جهاز فحص عبر اللغات.
3. **Hard.**في تحديد المهام على الهندية، تمكن كل منهما من استخدام 500 نموذج لغة محورية لتنظيم المعلومات.

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

- [Conneau et al. (2019). Unsupervised Cross-lingual Representation Learning at Scale](https://arxiv.org/abs/1911.02116) XLM-R 论文。
- [Pires, Schlinger, Garrette (2019). How Multilingual is Multilingual BERT?](https://arxiv.org/abs/1906.01502) 开启跨语言迁移研究线的分析论文──
- [Costa-jussà et al. (2022). No Language Left Behind](https://arxiv.org/abs/2207.04672) NLLB-200 论文。
- [Üstün et al. (2024). Aya Model: An Instruction Finetuned Open-Access Multilingual Language Model](https://arxiv.org/abs/2402.07827) Aya,Cohere 的多语言 LLM。
- [Language Similarity Predicts Cross-Lingual Transfer Learning Performance (2026)](https://www.mdpi.com/2504-4990/8/3/65) QWALS / LANGRANK 源语言论文。
