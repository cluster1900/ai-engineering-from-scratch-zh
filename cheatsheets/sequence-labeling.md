---
id: sequence-labeling
title: NER, POS Tagging and Coreference
code: NP
subtitle: BIO 标签、CRF 与 HMM 标注器、Viterbi、依存句法、共指簇，以及链到 KB 的实体链接。
hue: 160
sources: phases/05-nlp-foundations-to-advanced/06-named-entity-recognition, phases/05-nlp-foundations-to-advanced/07-pos-tagging-parsing, phases/05-nlp-foundations-to-advanced/24-coreference-resolution, phases/05-nlp-foundations-to-advanced/25-entity-linking
source_hash: 7dc1ba47e8b7fdac
---

## 抽取流水线
type: architecture
from: phases/05-nlp-foundations-to-advanced/24-coreference-resolution/docs/en.md, phases/05-nlp-foundations-to-advanced/25-entity-linking/docs/en.md, phases/05-nlp-foundations-to-advanced/06-named-entity-recognition/docs/en.md

```arch
node | text | 1,1 | Document | | client
node | ner | 2,1 | NER | BIO token labels to spans | model
node | coref | 3,1 | Coref | mention clusters | model
node | cand | 3,2 | Candidate generation | alias index, 10-30 per mention | store
node | dis | 2,2 | Disambiguation | prior + context or embeddings | process
node | kb | 1,2 | KB id per entity | or NIL | store
edge | text | ner | tokens
edge | ner | coref | mentions
edge | coref | cand | each mention
edge | cand | dis | candidates
edge | dis | kb | top-1
```

## 核心概念
type: concepts
from: phases/05-nlp-foundations-to-advanced/06-named-entity-recognition/docs/en.md, phases/05-nlp-foundations-to-advanced/07-pos-tagging-parsing/docs/en.md, phases/05-nlp-foundations-to-advanced/24-coreference-resolution/docs/en.md, phases/05-nlp-foundations-to-advanced/25-entity-linking/docs/en.md

- **BIO**：`B-X` 开始，`I-X` 继续，`O` 在外面。`New B-GPE`，`York I-GPE`。
- **BILOU**：加上 `L-X`（last）和 `U-X`（unit），边界更干净。
- **HMM**：$P = \prod_i P(t_i \mid t_{i-1}) \, P(w_i \mid t_i)$。转移乘以发射。
- **CRF**：判别式。混合词形、大小写和邻居特征。强制合法标签序列。
- **Viterbi**：在标签格子上用动态规划求最佳标签序列。
- **依存句法**：每个词有一个中心词和一个关系标签。
- **提及类型**：命名实体、名词性、代词性、同位语。
- **先验 + 上下文**：`P(entity | mention) × context-similarity(entity, text)`。

## 基于规则的代词消解
type: flow
from: phases/05-nlp-foundations-to-advanced/24-coreference-resolution/docs/en.md, phases/05-nlp-foundations-to-advanced/24-coreference-resolution/code/main.py

1. **extract_mentions**：大写跨度、按查找表的代词、定冠词 "the X" 短语。
2. **resolve**：对每个代词，取更早的命名与名词性提及。
3. **agreement_score**：数一致 +1。性别冲突代价为 2。
4. **recency_score**：更近的候选得分更高。
5. **resolve**：链接得分之和最高的候选。
6. **clusters**：在链接上做 union-find，每个实体一个簇。

## 代码中的任务
type: task-table
span: 2
from: phases/05-nlp-foundations-to-advanced/06-named-entity-recognition/code/main.py, phases/05-nlp-foundations-to-advanced/07-pos-tagging-parsing/code/main.py, phases/05-nlp-foundations-to-advanced/25-entity-linking/code/main.py

| 任务 | 代码 |
|---|---|
| 跨度到 BIO 标签 | `spans_to_bio(tokens, spans)` |
| BIO 标签回到跨度 | `bio_to_spans(tokens, labels)` |
| 大小写形状 | `word_shape(word)` |
| Gazetteer 基线 | `rule_based_ner(tokens)` |
| 最频标签基线 | `predict_mft(tokens, word_best, default_tag)` |
| 训练 bigram HMM | `train_hmm(examples, alpha=0.01)` |
| 解码标签 | `viterbi(tokens, transitions, emissions, tags, vocab, alpha=0.01)` |
| 链接一个提及 | `disambiguate(mention, context, use_prior=True)` |

## CRF 与 transformer NER
type: annotated-code
lang: python
from: phases/05-nlp-foundations-to-advanced/06-named-entity-recognition/docs/en.md

```python
crf = sklearn_crfsuite.CRF(algorithm="lbfgs",
    c1=0.1, c2=0.1,                   # L1 and L2 regularization
    max_iterations=100,
    all_possible_transitions=True)    # learns I-ORG after O is unlikely
X_train = [to_features(s) for s in sentences_tokenized]
crf.fit(X_train, bio_labels_train)    # ~84 F1 on CoNLL-2003
ner = pipeline("ner", model="dslim/bert-base-NER",
               aggregation_strategy="simple")  # merges B-X, I-X into spans
print(ner("Apple sued Google over its iPhone in the US."))
```

## spaCy：标签、句法、实体、簇
type: annotated-code
lang: python
from: phases/05-nlp-foundations-to-advanced/07-pos-tagging-parsing/docs/en.md, phases/05-nlp-foundations-to-advanced/06-named-entity-recognition/docs/en.md, phases/05-nlp-foundations-to-advanced/24-coreference-resolution/docs/en.md

```python
nlp = spacy.load("en_core_web_sm")
doc = nlp("The cats were running at 3pm.")
for token in doc:
    print(token.tag_, token.pos_, token.dep_, token.head.text)  # Penn, UD, relation
for ent in doc.ents:
    print(f"{ent.text:20s} {ent.label_}")   # iPhone comes out ORG in sm
nlp = spacy.load("en_coreference_web_trf")   # experimental model
doc = nlp("<text>")                          # rerun with the coref model
for cluster in doc._.coref_clusters:
    print(cluster, "->", [m.text for m in cluster])
```

## 预期数字
type: defaults
from: phases/05-nlp-foundations-to-advanced/07-pos-tagging-parsing/docs/en.md, phases/05-nlp-foundations-to-advanced/24-coreference-resolution/docs/en.md, phases/05-nlp-foundations-to-advanced/25-entity-linking/docs/en.md, phases/05-nlp-foundations-to-advanced/06-named-entity-recognition/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| Brown 上的最频标签 | 约 85% | 任何标注器的下限 |
| Brown 上的 bigram HMM | 约 93% | 增益来自转移 |
| 带特征的 CRF | 约 97% | BiLSTM-CRF 或 transformer ~98%+ |
| 标注者一致性，PTB | 97% | 超过 98% 很可能过拟合 |
| 标签集 | 36 | PTB 有 36 个标签。UD 有 17 |
| 共指 SOTA，CoNLL-2012 | 约 83 F1 | MUC、B³、CEAF 的均值 |
| 每个提及的候选 | 10-30 | 来自别名索引 |
| 经典 NER 延迟 | 50ms | 低于它时经典 NER 胜出 |

## 排障
type: troubleshooting
from: phases/05-nlp-foundations-to-advanced/06-named-entity-recognition/docs/en.md, phases/05-nlp-foundations-to-advanced/24-coreference-resolution/docs/en.md, phases/05-nlp-foundations-to-advanced/25-entity-linking/docs/en.md, phases/05-nlp-foundations-to-advanced/07-pos-tagging-parsing/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| CoNLL 模型在合同上失败 | 领域偏移 | 在你的领域上微调 |
| ORG 与 FACILITY 重叠 | BIO 不能嵌套跨度 | 基于跨度或多遍 NER |
| 长实体被拆成两段 | 词级标签 | `aggregation_strategy` 或后处理 |
| F1 看起来过高 | 词级 F1 | 用 `seqeval` 做实体级 F1 |
| 每个提及自成一簇 | 单例爆炸 | 一起检查 MUC、B³ 和 CEAF |
| 长文档上共指下降 | 超过 2,000 个 token 约掉 15 F1 | 滑动窗口再合并 |
| 选错了著名实体 | 流行度偏差 | 领域微调，检查 NIL |
| EL 召回下降 | NER 把跨度切短了 | 在上游修好提及边界 |

## 何时用 X
type: qa
from: phases/05-nlp-foundations-to-advanced/06-named-entity-recognition/docs/en.md, phases/05-nlp-foundations-to-advanced/07-pos-tagging-parsing/docs/en.md, phases/05-nlp-foundations-to-advanced/24-coreference-resolution/docs/en.md, phases/05-nlp-foundations-to-advanced/25-entity-linking/docs/en.md

- **经典 NER 还是 LLM？** 低于 50ms、在 98%+ F1，或本地部署时用经典。否则从 LLM 零样本基线开始。
- **PTB 还是 UD？** PTB 用于仅英语的遗留流水线。UD 用于多语言工作。
- **哪个解析器？** 多数生产用 spaCy，多语言用 stanza，最高 UD 准确率用 trankit。
- **哪种 EL 方法？** 英语 Wikipedia 用 BLINK 或 REL。最低延迟用精确匹配先验。
- **LLM 共指？** 仅限简单情形。它会过度合并，并在长文档中丢掉提及。

## 缩写
type: glossary
from: phases/05-nlp-foundations-to-advanced/06-named-entity-recognition/docs/en.md, phases/05-nlp-foundations-to-advanced/07-pos-tagging-parsing/docs/en.md, phases/05-nlp-foundations-to-advanced/24-coreference-resolution/docs/en.md, phases/05-nlp-foundations-to-advanced/25-entity-linking/docs/en.md

- **NER**：named entity recognition。给 token 跨度打类型标签。
- **CRF**：Conditional Random Field。建模标签转移。
- **PTB / UD**：Penn Treebank 和 Universal Dependencies 标签集。
- **EL**：entity linking。把提及映射到一个 KB 条目。
- **NIL**：没有 KB 条目匹配该提及。
- **CoNLL F1**：MUC、B³ 和 CEAF-φ4 F1 的均值。
- **Cataphora**：代词出现在其指代对象之前。

## 提示
type: tips
from: phases/05-nlp-foundations-to-advanced/25-entity-linking/docs/en.md, phases/05-nlp-foundations-to-advanced/24-coreference-resolution/docs/en.md, phases/05-nlp-foundations-to-advanced/07-pos-tagging-parsing/docs/en.md

- 报告提及召回和消歧准确率。80% 召回上的 99% 是 80% 的流水线。
- 把共指簇合并进 NER 实体。每个实体发一个 KB id，而不是每个提及。
- 把 LLM 实体链接约束到合法 KB id。
- 在 20 个抽样输出上测试名-动歧义（`saw`、`book`、`can`）。
