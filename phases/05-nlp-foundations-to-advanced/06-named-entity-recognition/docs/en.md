# Named Entity Recognition

> 把名称提取出来。听起来很简单，直到你遇到模糊边界、嵌套实体和领域术语。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word Embeddings)
**Time:** ~75 minutes

## 问题

"Apple sued Google over its iPhone search deal in the US." 五个实体：Apple (ORG)、Google (ORG)、iPhone (PRODUCT)、search deal（也许算）、US (GPE)。一个好的 NER 系统会提取全部实体，并给出正确类型。一个差的系统会漏掉 iPhone，把水果 Apple 和公司 Apple 混淆，还会把 "US" 标成 PERSON。

NER 是每条结构化抽取 pipeline 底层的主力。简历解析、合规日志扫描、病历匿名化、搜索查询理解、chatbot 回复的 grounding、法律合同抽取。你几乎看不见它；但你一直依赖它。

本课会沿着经典路径（rule-based、HMM、CRF）走向现代路径（BiLSTM-CRF，然后是 transformers）。每一步都解决前一步的一个具体局限。这个演进模式本身就是本课的重点。

## 概念

**BIO tagging**（或 BILOU）把实体抽取转化为序列标注问题。为每个 token 标上 `B-TYPE`（实体开始）、`I-TYPE`（实体内部）或 `O`（任何实体之外）。

```
Apple    B-ORG
sued     O
Google   B-ORG
over     O
its      O
iPhone   B-PRODUCT
search   O
deal     O
in       O
the      O
US       B-GPE
.        O
```

多 token 实体会串联起来：`New B-GPE`、`York I-GPE`、`City I-GPE`。理解 BIO 的模型可以抽取任意 span。

架构演进：

- **Rule-based.** Regex + gazetteer 查找。对已知实体 precision 高，对新实体 coverage 为零。
- **HMM.** Hidden Markov Model。给定 tag 的 token emission probability，以及 tag 到 tag 的 transition probability。用 Viterbi decode。在标注数据上训练。
- **CRF.** Conditional Random Field。类似 HMM，但属于 discriminative 模型，因此可以混合任意特征（word shape、大小写、邻近词）。到 2026 年，在低资源部署中仍然是经典生产主力。
- **BiLSTM-CRF.** 用 Neural 特征替代手工特征。LSTM 双向读取句子，顶部 CRF 层强制 tag 序列一致。
- **Transformer-based.** 用 token-classification head 微调 BERT。准确率最高。计算量最大。

## 构建它

### 步骤 1: BIO tagging helpers

```python
def spans_to_bio(tokens, spans):
    labels = ["O"] * len(tokens)
    for start, end, label in spans:
        labels[start] = f"B-{label}"
        for i in range(start + 1, end):
            labels[i] = f"I-{label}"
    return labels


def bio_to_spans(tokens, labels):
    spans = []
    current = None
    for i, label in enumerate(labels):
        if label.startswith("B-"):
            if current:
                spans.append(current)
            current = (i, i + 1, label[2:])
        elif label.startswith("I-") and current and current[2] == label[2:]:
            current = (current[0], i + 1, current[2])
        else:
            if current:
                spans.append(current)
                current = None
    if current:
        spans.append(current)
    return spans
```

```python
>>> tokens = ["Apple", "sued", "Google", "over", "iPhone", "sales", "."]
>>> labels = ["B-ORG", "O", "B-ORG", "O", "B-PRODUCT", "O", "O"]
>>> bio_to_spans(tokens, labels)
[(0, 1, 'ORG'), (2, 3, 'ORG'), (4, 5, 'PRODUCT')]
```

### 步骤 2：hand-crafted features

对于经典（非 Neural）NER，特征就是核心。实用特征包括：

```python
def token_features(token, prev_token, next_token):
    return {
        "lower": token.lower(),
        "is_upper": token.isupper(),
        "is_title": token.istitle(),
        "has_digit": any(c.isdigit() for c in token),
        "suffix_3": token[-3:].lower(),
        "shape": word_shape(token),
        "prev_lower": prev_token.lower() if prev_token else "<BOS>",
        "next_lower": next_token.lower() if next_token else "<EOS>",
    }


def word_shape(word):
    out = []
    for c in word:
        if c.isupper():
            out.append("X")
        elif c.islower():
            out.append("x")
        elif c.isdigit():
            out.append("d")
        else:
            out.append(c)
    return "".join(out)
```

`word_shape("iPhone")` 返回 `xXxxxx`。`word_shape("USA-2024")` 返回 `XXX-dddd`。大小写模式对专有名词是高信号特征。

### 步骤 3： 一个简单的 rule-based + dictionary baseline

```python
ORG_GAZETTEER = {"Apple", "Google", "Microsoft", "OpenAI", "Meta", "Amazon", "Netflix"}
GPE_GAZETTEER = {"US", "USA", "UK", "India", "Germany", "France"}
PRODUCT_GAZETTEER = {"iPhone", "Android", "Windows", "ChatGPT", "Claude"}


def rule_based_ner(tokens):
    labels = []
    for token in tokens:
        if token in ORG_GAZETTEER:
            labels.append("B-ORG")
        elif token in GPE_GAZETTEER:
            labels.append("B-GPE")
        elif token in PRODUCT_GAZETTEER:
            labels.append("B-PRODUCT")
        else:
            labels.append("O")
    return labels
```

生产级 gazetteer 有数百万条从 Wikipedia 和 DBpedia 抓取的条目。Coverage 很好。Disambiguation（公司 Apple vs 水果 Apple）很糟。这就是统计模型胜出的原因。

### 步骤 4： CRF 步骤（草图，不是完整实现）

如果没有概率论基础，从零用 50 行写完整 CRF 并不能带来多少启发。改用 `sklearn-crfsuite`：

```python
import sklearn_crfsuite

def to_features(tokens):
    out = []
    for i, tok in enumerate(tokens):
        prev = tokens[i - 1] if i > 0 else ""
        nxt = tokens[i + 1] if i + 1 < len(tokens) else ""
        out.append({
            "word.lower()": tok.lower(),
            "word.isupper()": tok.isupper(),
            "word.istitle()": tok.istitle(),
            "word.isdigit()": tok.isdigit(),
            "word.suffix3": tok[-3:].lower(),
            "word.shape": word_shape(tok),
            "prev.word.lower()": prev.lower(),
            "next.word.lower()": nxt.lower(),
            "BOS": i == 0,
            "EOS": i == len(tokens) - 1,
        })
    return out


crf = sklearn_crfsuite.CRF(algorithm="lbfgs", c1=0.1, c2=0.1, max_iterations=100, all_possible_transitions=True)
X_train = [to_features(s) for s in sentences_tokenized]
crf.fit(X_train, bio_labels_train)
```

`c1` 和 `c2` 是 L1 与 L2 regularization。`all_possible_transitions=True` 让模型学习非法序列（例如 `O` 后面的 `I-ORG`）概率很低，这就是 CRF 在不需要你手写约束的情况下强制 BIO 一致性的方式。

### 步骤 5： BiLSTM-CRF 增加了什么

特征变成学习得到的。输入：token embeddings（GloVe 或 fastText）。LSTM 从左到右、从右到左读取。拼接后的 hidden states 进入 CRF 输出层。CRF 仍然强制 tag 序列一致；LSTM 则用学习得到的特征替代手工特征。

```python
import torch
import torch.nn as nn


class BiLSTM_CRF_Head(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, n_labels):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, bidirectional=True, batch_first=True)
        self.fc = nn.Linear(hidden_dim * 2, n_labels)

    def forward(self, token_ids):
        e = self.embed(token_ids)
        h, _ = self.lstm(e)
        emissions = self.fc(h)
        return emissions
```

CRF 层使用 `torchcrf.CRF`（pip install pytorch-crf）。相比 hand-crafted CRF，提升是可测量的，但除非你有数万条标注句子，否则提升幅度通常比你预期的小。

## 使用它

spaCy 开箱即带生产级 NER。

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("Apple sued Google over its iPhone search deal in the US.")
for ent in doc.ents:
    print(f"{ent.text:20s} {ent.label_}")
```

```
Apple                ORG
Google               ORG
iPhone               ORG
US                   GPE
```

注意 `iPhone` 被标为 `ORG` 而不是 `PRODUCT`，spaCy 的 small model 对 product-entity 的 coverage 较弱。large model（`en_core_web_lg`）表现更好。transformer model（`en_core_web_trf`）还会更好。

Hugging Face 的 BERT-based NER：

```python
from transformers import pipeline

ner = pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple")
print(ner("Apple sued Google over its iPhone in the US."))
```

```
[{'entity_group': 'ORG', 'word': 'Apple', ...},
 {'entity_group': 'ORG', 'word': 'Google', ...},
 {'entity_group': 'MISC', 'word': 'iPhone', ...},
 {'entity_group': 'LOC', 'word': 'US', ...}]
```

`aggregation_strategy="simple"` 会把连续的 B-X、I-X token 合并成一个 span。没有它，你会得到 token-level labels，并且必须自己合并。

### LLM-based NER（2026 年的选项）

Zero-shot 和 few-shot LLM NER 现在在许多领域已经能与 fine-tuned 模型竞争；在标注数据稀缺时，表现明显更好。

- **Zero-shot prompting.** 给 LLM 一组实体类型和一个示例 schema。要求输出 JSON。开箱可用；在新领域上准确率中等。
- **ZeroTuneBio-style prompting.** 将任务分解为 candidate extraction → meaning explanation → judgment → re-check。多阶段 prompt（不是 one-shot）能显著提升 biomedical NER 的准确率。同样的模式也适用于法律、金融和科学领域。
- **Dynamic prompting with RAG.** 对每次 inference call，从一个小型标注 seed set 中检索最相似的标注样例；动态构建 few-shot prompt。在 2026 年 benchmark 中，这能让 GPT-4 biomedical NER F1 相比 static prompting 提升 11-12%。
- **Per-entity-type decomposition.** 对长文档来说，一次调用同时抽取所有实体类型会随着长度增加而降低 recall。对每种实体类型运行一次抽取。Inference 成本更高，准确率显著更高。这是 clinical notes 和法律合同中的标准模式。

截至 2026 年的生产建议：在收集训练数据之前，先做一个 LLM zero-shot baseline。很多时候 F1 已经足够好，你根本不需要 fine-tune。

### 经典 NER 仍然胜出的地方

即使已经有 LLMs，经典 NER 在以下情况仍然胜出：

- Latency budget 低于 50ms。
- 你有数千个标注样例，并且需要 98%+ F1。
- 领域拥有稳定 ontology，pretrained CRF 或 BiLSTM 迁移效果良好。
- 监管约束要求 on-prem、非生成式模型。

### 它会在哪些地方失效

- **Domain shift.** 在 CoNLL 上训练的 NER 用在法律合同上，表现比 gazetteer 还差。要在你的领域上 fine-tune。
- **Nested entities.** "Bank of America Tower" 同时是 ORG 和 FACILITY。标准 BIO 无法表示重叠 span。你需要 nested NER（multi-pass 或 span-based models）。
- **Long entities.** "United States Federal Deposit Insurance Corporation." Token-level 模型有时会拆开它。使用 `aggregation_strategy` 或后处理。
- **Sparse types.** 医疗 NER 标签包括 DRUG_BRAND、ADVERSE_EVENT、DOSE。通用模型完全不了解这些。Scispacy 和 BioBERT 是这里的起点。

## 交付它

保存为 `outputs/skill-ner-picker.md`：

```markdown
---
name: ner-picker
description: 为给定抽取任务选择合适的 NER 方法。
version: 1.0.0
phase: 5
lesson: 06
tags: [nlp, ner, extraction]
---

给定一个任务描述（领域、标签集、语言、延迟、数据量），输出：

1. 方法。Rule-based + gazetteer、CRF、BiLSTM-CRF，或 transformer fine-tune。
2. 起始模型。命名它（spaCy model ID、Hugging Face checkpoint ID，或 "custom, trained from scratch"）。
3. 标注策略。BIO、BILOU，或 span-based。用一句话说明理由。
4. 评估。使用 `seqeval`。始终报告 entity-level F1（不是 token-level）。

除非用户已经有 pretrained domain model，否则拒绝建议在少于 500 个标注样例上 fine-tuning transformer。如果存在 nested entities，标记为需要 span-based 或 multi-pass models。如果用户提到 "production scale"，且标签与 CoNLL-2003 相同，则要求进行 gazetteer audit。
```

## 练习

1. **Easy.** 实现 `bio_to_spans`（`spans_to_bio` 的逆操作），并在 10 个句子上验证 round-trip consistency。
2. **Medium.** 在 CoNLL-2003 English NER dataset 上训练上面的 sklearn-crfsuite CRF。使用 `seqeval` 报告 per-entity F1。典型结果：~84 F1。
3. **Hard.** 在一个领域特定 NER dataset（medical、legal 或 financial）上 fine-tune `distilbert-base-cased`。与 spaCy small model 对比。记录 data leakage checks，并写下让你意外的发现。

## 关键术语

| Term | 人们通常怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| NER | 提取名称 | 给 token spans 标注类型（PERSON、ORG、GPE、DATE，...）。 |
| BIO | Tagging scheme | `B-X` 表示开始，`I-X` 表示继续，`O` 表示外部。 |
| BILOU | 更好的 BIO | 增加 `L-X`（last）、`U-X`（unit），让边界更清晰。 |
| CRF | 结构化 classifier | 对 labels 之间的 transitions 建模，而不只是 emissions。强制有效序列。 |
| Nested NER | 重叠实体 | 一个 span 是与其子 span 不同的实体。BIO 无法表达这一点。 |
| Entity-level F1 | 正确的 NER metric | 预测 span 必须与真实 span 完全匹配。Token-level F1 会高估准确率。 |

## 延伸阅读

- [Lample et al. (2016). Neural Architectures for Named Entity Recognition](https://arxiv.org/abs/1603.01360) — BiLSTM-CRF 论文。经典。
- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers](https://arxiv.org/abs/1810.04805) — 引入后来成为标准的 token-classification 模式。
- [spaCy linguistic features — named entities](https://spacy.io/usage/linguistic-features#named-entities) — `Doc.ents` 和 `Span` 上每个属性的实用参考。
- [seqeval](https://github.com/chakki-works/seqeval) — 正确的 metric library。始终使用它。
