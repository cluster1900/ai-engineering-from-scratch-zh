# 多语言的NLP

> 一个模型,100多种语言,其中大多数语言没有任何训练数据.

**Type:** Learn
**Languages:** Python
**先修要求：**五期·04 (全球,快文,字幕),五期·11 (机器翻译)
**Time:** ~45 分钟

## 问题

英语有数十亿个标签样本.乌尔都语有数千种.几乎没有.任何面向全球用户的实用NLP系统都必须能够处理那些没有特定任务训练数据的长尾语言.

多语言模型通过在多种语言中同时训练一个模型来解决这个问题.共享表示让模型能够从高资源语言中学到低资源语言的能力迁移到低资源语言.使用英语情感分析对模型进行细节调整,它就能在开箱即使用乌尔都语给出相当不错的情感预测.

本课程将说明有关权衡的经典模型以及一个经常开始多语言工作的团队的决定:为迁移选择源语言.

## 概念

![通过共享多语言 Embedding space 实现跨语言迁移](../assets/multilingual.svg)

**共享词表。**多语言模型使用在所有目标语言文本上训练的SentencePiece或 WordPiece代币化器──词表是共享的:同一个子词 单元在相关语言中表示相同的词素──英语和意大利语中.`anti-`我会得到同一个标志.

**共享表示。**在多种语言上使用面具语言建模的预训练,会学到不同语言中语义相似的句子会产生相似的隐藏状态.

**Zero-shot 迁移。**在一种语言 (通常是英语) 带标签数据上进行细节调整模型. 在推理时,在任何其他语言上运行模型支持它.

**Few-shot fine-tuning。**在目标语言中增加100-500个标签样本. 分类任务的准确率将升到英语基线的95-98%.

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

按用例选择――分类任务可以将XLM-R-base 作为稳定默认值――生成任务需要根据翻译还是开放生成,在MT5或NLLB之间选择――LLM风格工作可以配合Aya-23或Claude,并使用明确的多语言提示――

## 源语言决策(2026研究)

多数团队默认使用英语作为细节调整的源语言――近期研究(2026) 表示,这往往是错的――

语言相似性比原始语料规模更能预测迁移质量――对于斯拉夫语目标语言,德语或俄语往往优于英语――对于印度语族目标语言,印地语往往优于英语――**qWALS**根据世界语言结构图库 (World Atlas of Language Structures features) 的2026年相似度指标,**LANGRANK**(Lin et al., ACL 2019) 是另一种更早的方法,它结合语言相似性,语料规模和谱系关系,对候选语言进行排序.

实用规则:如果你的目标语言有一个类型学上接近高资源亲缘语言,


```figure
n5-crosslingual-bridge
```

## 构建

### 步骤1:零射 跨语言分类

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

通过涉及技巧,XLM-R 在 NLI 数据上训练,能很好地迁移到分类任务.

### 步骤2: 多语言 嵌入空间

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

译文会落在嵌入空间中相近的位置. 另一句不同的英语句会落得更远. 这就是跨语言检查,集群和相似性能够工作的原因.

### 步骤3: 几次细调策略

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

对于100-500个目标语言样本,`num_train_epochs=5`和 `learning_rate=2e-5`较高的学习率会导致多语言的崩,最终得到一个只会使用英语的模型.

## 真正有效的评估

- **在 held-out 集上按语言统计准确率。**不要聚聚.聚聚标会掩盖长尾问题.
- **与单语言 baseline 对比。**对于足够的语言数据,从头训练的单语言模型有时会优于多语言模型.
- **Entity-level 测试。**目标语言中的命名实体──多语言模型对远离拉丁文字的书写系统通常是标记化较弱──
- **跨语言一致性。**两种语言表达相同意义时,应产生相同的预测.

## 使用

2026 技术:

| Task | Recommended |
|-----|-------------|
| Classification, 100 languages | XLM-R-base (~270M) fine-tuned |
| Zero-shot text classification | `joeddav/xlm-roberta-large-xnli` |
| Multilingual sentence embeddings | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` |
| Translation, 200 languages | `facebook/nllb-200-distilled-600M`（见 lesson 11） |
| Generative multilingual | Claude, GPT-4, Aya-23, mT5-XXL |
| Low-resource language NLP | XLM-V 或在相关高资源语言上做 domain-specific fine-tune |

如果性能很重要,一定要为目标语言调整预留预算.

### 标记化 成本(低资源语言会出什么问题)

多语言模型在所有语言之间共享一个代币器.这个词表是由英语,法语,西班牙语,中文,德语主导语料训练的.

- **Fertility 成本。**低资源语言文本会被标记成比英语更多的标记――一个印地语句可能需要等价英语句子的3-5倍的标记――这个3-5倍会吞你的下文窗口――训练效率和延迟预算――
- **变体恢复成本。**每个拼写错误,附加符号变体,Unicode 规范化不匹配或大小写变化,都会在嵌入空间中变成一个冷启动的无关序列.
- **容量外溢成本。**构成1和2将消耗在下文位置,层深度和嵌入维度,留给实际推理的容量,系统地小于同一个模型给高资源语言的容量.

实际症状是:你的模型在印地语上训练正常, 损失曲线看起来正确, 时代困惑看起来合理, 生产输出却微妙地错误――形态结构在句子中段崩――罕见折曲形式始终无法恢复――**Tokenizer 坏了，靠扩大数据规模救不回来。**

缓解方式:选择一个对目标语言覆盖良好的代币器(XLM-V的1M代币表词表就是直接修复);训练前在进行 目标文本上验证代币化生育;对真正长尾的书写系统使用字节级落后(SentencePiece`byte_fallback=True`确保永远不会出现OOV──

## 交付

保存为`outputs/skill-multilingual-picker.md`其他:

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

## 练习

1. **Easy.**在英语,法语,印地语和阿拉伯语中,每种语言都需要10个句子,运行零射击分类管道.
2. **Medium.**使用 `paraphrase-multilingual-MiniLM-L12-v2`在一个小型混合语言语料上构建跨语言检查器.
3. **Hard.**在印度语分类任务上,两种方案都使用500个目标语言样本进行少数次细节调整.报告哪个源语言产生了更好的印地语准确率,以及高出多少.

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
- [Pires, Schlinger, Garrette (2019). How Multilingual is Multilingual BERT?](https://arxiv.org/abs/1906.01502) 开启跨语言迁移研究线的分析论文.
- [Costa-jussà et al. (2022). No Language Left Behind](https://arxiv.org/abs/2207.04672) NLLB-200 论文──
- [Üstün et al. (2024). Aya Model: An Instruction Finetuned Open-Access Multilingual Language Model](https://arxiv.org/abs/2402.07827) Aya,Cohere 的多语言法学士.
- [Language Similarity Predicts Cross-Lingual Transfer Learning Performance (2026)](https://www.mdpi.com/2504-4990/8/3/65) QWALS / LANGRANK 源语言论文。
