# 名称实体识别

> 让名字提取出来.听起来很简单,直到你遇到模糊边界.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word Embeddings)
**Time:** ~75 minutes

## 问题

五个实体:果 (ORG) 谷歌 (ORG) iPhone (产品) 搜索协议(也许算) 美国 (GPE) ⋅一个好的NER 系统会提取全部实体,并给出正确的类型――一个差的系统会漏掉iPhone,把水果果和公司果混,还将"美国"标记为个体――

简历解析、合规日志扫描、病历匿名化、搜索查询理解、聊天机 回复的基础、法律合同抽取──你几乎看不见它;但你一直依赖它──

本课程沿着经典路径 (基于规则的 HMM  CRF) 走向现代路径 (BiLSTM-CRF,然后是变压器) .

## 概念

**BIO tagging**转换为序列标记问题.`B-TYPE`现在,我还在做什么?`I-TYPE`实体内部`O`没有任何实体.

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

许多代币 实体会串联起来:`New B-GPE`,我知道.`York I-GPE`,我知道.`City I-GPE`△理解BIO的模型可以随意抽取.

架构演进:

- **Rule-based.**对于已知实体的精度 高,对新实体的覆盖 为零.
- **HMM.**隐藏的马科夫模型――给定标签的标记发射概率,以及标签到标签的过渡概率――使用Viterbi解码――在标签数据上训练――
- **CRF.**条件随机领域――类似于HMM,但属于歧视性模型,因此可以混合任意特征 (字形,大小写,近词).
- **BiLSTM-CRF.**用神经特征替代手工特征――LSTM 双向读取句子,顶部CRF层强制标签 序列一致――
- **Transformer-based.**用代币分类头微调BERT──准确率最高──计算量最大──


```figure
ner-bio-tagging
```

## 构建它

### 步骤1:生物标签助手

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

### 步骤2:手工制作的特征

对于经典的非神经性 (非神经性) 网络,特征就是核心.

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

`word_shape("iPhone")`返回`xXxxxx`,我知道.`word_shape("USA-2024")`返回`XXX-dddd`小写模式对专名词是高信号特征

### 步骤3:一个简单的规则基础的字典基础

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

产业级报纸 有数百万条从维基百科 和DBpedia 抓取的条目――覆盖率很好―― 果公司与水果果) 很糟糕――这就是统计模型胜利的原因――

### 步骤4:CRF 步骤(草图,不是完整实现)

如果没有概率论基础,从零开始写50行完整的CRF不能带来多少启动.`sklearn-crfsuite`其他:

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

`c1`和 `c2`是L1与L2规律化.`all_possible_transitions=True`让模型学习非法序列`O`后面的`I-ORG`由于这种情况,CRF在不需要你写手约束的情况下强制BIO的单一性方式.

### 步骤5: BiLSTM-CRF 增加了什么

拼接后的隐藏状态 进入CRF 输出层──CRF 仍然强制标签 序列一致;LSTM则使用学习得到的特征替代手工特征──

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

 CRF 层使用`torchcrf.CRF`提升是可测量的,但除非你有数万条标记句子,否则提升幅度通常比你预期的小.

## 使用它

开箱即带生产级 NER.

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

注意`iPhone`被标为`ORG`而不是`PRODUCT`空间空间的小型模型对产品实体的覆盖率较弱,较大的模型`en_core_web_lg`)表现更好──变压器模型(`en_core_web_trf`现在还会更好.

基于BERT的NER:

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

`aggregation_strategy="simple"`没有它,你会得到标签级别的标签,并且必须自己合并.

### 基于LLM的NER(2026年的选项)

现在在许多领域已经能够与精细调节的模型竞争;在标注数据稀缺时,表现明显更好.

- **Zero-shot prompting.**给LLM 一组实体类型和一个示例方案.
- **ZeroTuneBio-style prompting.**将任务分解为候选人提取 → 含义解释 → 判断 → 重复检查――多阶段提示(不是一枪) 可以显著提升生物医学NER的准确率――同样的模式也适用于法律、金融和科学领域――
- **Dynamic prompting with RAG.**对于每次推断调用,从一个小型标签种子集中检索最相似的标签样本;动态构建少数拍摄提示――在2026年基准中,这将使GPT-4生物医学NER F1相比静态提示率提升11-12%.
- **Per-entity-type decomposition.**对于长文档来说,一次调用同时抽取所有实体类型将随着长度的增加而减少的回忆. 对每个实体类型运行一次抽取.

截至2026年,生产建议:在收集训练数据之前,先做一个LLM零射线.

### 经典 NER 仍然胜出的地方

尽管已经有LLM,经典的NER在以下情况下仍然胜出:

- 延迟预算低于50ms.
- 你有数千个标签样本,需要98%的F1
- 具有稳定的态,经过CRF或BiLSTM培训的领域 迁移效果良好.
- 监管约束要求现场的非生成式模型――

### 它会在哪些地方失效

- **Domain shift.**在CNLL上训练的NER使用在法律合同上,表现比报纸更差.
- **Nested entities.**标准BIO 无法表示重叠跨度.
- **Long entities.**美国联邦存款保险公司的代币级模型有时会拆开.`aggregation_strategy`或后处理.
- **Sparse types.**医疗 NER 标签包括DRUG_BRAND、ADVERSE_EVENT、DOSE──通用模型完全不了解这些──Scispacy 和 BioBERT 是此处的起点──

## 交付它

保存为`outputs/skill-ner-picker.md`其他:

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

1. **Easy.**实现`bio_to_spans`(`spans_to_bio`经过10个句子的验证,
2. **Medium.**在 CoNLL-2003 英语NER数据集上训练上面的 sklearn-crfsuite CRF──使用`seqeval`报告每单位F1──典型结果:~84 F1──
3. **Hard.**在一个特定领域的NER数据集中,`distilbert-base-cased`△与空间小模型对比──记录数据泄漏检查,并写下让你意外发现──

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

- [Lample et al. (2016). Neural Architectures for Named Entity Recognition](https://arxiv.org/abs/1603.01360) BiLSTM-CRF 论文──经典──
- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers](https://arxiv.org/abs/1810.04805) 引入后成为标准的标志分类模式.
- [spaCy linguistic features — named entities](https://spacy.io/usage/linguistic-features#named-entities) `Doc.ents`和 `Span`任何属性的实用参考.
- [seqeval](https://github.com/chakki-works/seqeval) 正确的计量库──始终使用它──
