# POS Tagging 与 Syntactic Parsing

> Grammar 曾一度不受重视。后来，每个 LLM Pipeline 都需要验证结构化提取结果，于是它又回来了。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 01（文本处理）、Phase 2 · 14（Naive Bayes）
**Time:** ~45 分钟

## 问题

Lesson 01 曾提到，lemmatization 需要 part-of-speech tag。如果不知道 `running` 是 verb，lemmatizer 就无法将它还原为 `run`。如果不知道 `better` 是 adjective，它就无法将其还原为 `good`。

这一承诺背后隐藏着一整个子领域。POS tagging 会分配语法类别。Syntactic parsing 会恢复句子的树状结构：哪个词修饰哪个词，哪个 verb 支配哪些参数。经典 NLP 用了二十年时间不断完善这两项技术。随后，Deep Learning 将它们简化为预训练 Transformer 之上的 Token Classification 任务，研究社区便转向了其他方向。

应用社区并没有离开。每个结构化提取 Pipeline 仍然在底层使用 POS 和 dependency tree。LLM 生成的 JSON 会依据语法约束进行验证。问答系统使用 dependency parse 分解查询。Machine Translation 质量评估器会检查 parse tree 的对齐情况。

这些知识值得掌握。本课会介绍 tagset、baseline，以及应该停止从零实现、转而调用 spaCy 的边界。

## 概念

**POS tagging** 会为每个 Token 标注一个语法类别。**Penn Treebank (PTB)** tagset 是英语领域的默认选择。它包含 36 个 tag，并区分了许多普通读者会觉得过于琐细的情况：`NN` 表示单数 noun，`NNS` 表示复数 noun，`NNP` 表示单数 proper noun，`VBD` 表示过去时 verb，`VBZ` 表示第三人称单数现在时 verb，等等。**Universal Dependencies (UD)** tagset 粒度更粗（17 个 tag），且与语言无关；它已经成为跨语言工作的默认选择。

```text
The/DET cats/NOUN were/AUX running/VERB at/ADP 3pm/NOUN ./PUNCT
```

**Syntactic parsing** 会生成一棵树。主要有两种形式：

- **Constituency parsing。** Noun phrase、verb phrase 和 prepositional phrase 会相互嵌套。输出是一棵由 non-terminal category（NP、VP、PP）组成、以单词为叶节点的树。
- **Dependency parsing。** 每个单词都有一个自己依赖的 head word，并带有语法关系 Label。输出是一棵树，其中每条边都是 `(head, dependent, relation)` 三元组。

Dependency parsing 在 2010 年代占据主流，因为它可以自然地推广到不同语言，尤其是语序自由的语言。

```text
running 是 ROOT
cats 是 running 的 nsubj
were 是 running 的 aux
at 是 running 的 prep
3pm 是 at 的 pobj
```

```figure
pos-tagger
```

```figure
dependency-arcs
```

## 构建它

### 第 1 步：most-frequent-tag baseline

这是最简单但有效的 POS tagger。对于每个单词，预测它在 Training 中最常出现的 tag。

```python
from collections import Counter, defaultdict


def train_mft(train_examples):
    word_tag_counts = defaultdict(Counter)
    all_tags = Counter()
    for tokens, tags in train_examples:
        for token, tag in zip(tokens, tags):
            word_tag_counts[token.lower()][tag] += 1
            all_tags[tag] += 1
    word_best = {w: c.most_common(1)[0][0] for w, c in word_tag_counts.items()}
    default_tag = all_tags.most_common(1)[0][0]
    return word_best, default_tag


def predict_mft(tokens, word_best, default_tag):
    return [word_best.get(t.lower(), default_tag) for t in tokens]
```

在 Brown corpus 上，这个 baseline 的准确率约为 85%。不算好，但任何严肃 Model 的表现都不应低于这个下限。

### 第 2 步：bigram HMM tagger

对序列的联合 Probability 建模：

```text
P(tags, words) = prod P(tag_i | tag_{i-1}) * P(word_i | tag_i)
```

需要两张表：transition Probability（给定前一个 tag 时当前 tag 的 Probability）和 emission Probability（给定 tag 时某个单词的 Probability）。使用 Laplace smoothing 从计数中估计二者。使用 Viterbi 进行解码，也就是在 tag lattice 上执行 Dynamic Programming。

```python
import math


def train_hmm(train_examples, alpha=0.01):
    transitions = defaultdict(Counter)
    emissions = defaultdict(Counter)
    tags = set()
    vocab = set()

    for tokens, ts in train_examples:
        prev = "<BOS>"
        for token, tag in zip(tokens, ts):
            transitions[prev][tag] += 1
            emissions[tag][token.lower()] += 1
            tags.add(tag)
            vocab.add(token.lower())
            prev = tag
        transitions[prev]["<EOS>"] += 1

    return transitions, emissions, tags, vocab


def log_prob(table, given, key, smooth_denom, alpha):
    return math.log((table[given].get(key, 0) + alpha) / smooth_denom)


def viterbi(tokens, transitions, emissions, tags, vocab, alpha=0.01):
    tags_list = list(tags)
    n = len(tokens)
    V = [[0.0] * len(tags_list) for _ in range(n)]
    back = [[0] * len(tags_list) for _ in range(n)]

    for j, tag in enumerate(tags_list):
        em_denom = sum(emissions[tag].values()) + alpha * (len(vocab) + 1)
        tr_denom = sum(transitions["<BOS>"].values()) + alpha * (len(tags_list) + 1)
        tr = log_prob(transitions, "<BOS>", tag, tr_denom, alpha)
        em = log_prob(emissions, tag, tokens[0].lower(), em_denom, alpha)
        V[0][j] = tr + em
        back[0][j] = 0

    for i in range(1, n):
        for j, tag in enumerate(tags_list):
            em_denom = sum(emissions[tag].values()) + alpha * (len(vocab) + 1)
            em = log_prob(emissions, tag, tokens[i].lower(), em_denom, alpha)
            best_prev = 0
            best_score = -1e30
            for k, prev_tag in enumerate(tags_list):
                tr_denom = sum(transitions[prev_tag].values()) + alpha * (len(tags_list) + 1)
                tr = log_prob(transitions, prev_tag, tag, tr_denom, alpha)
                score = V[i - 1][k] + tr + em
                if score > best_score:
                    best_score = score
                    best_prev = k
            V[i][j] = best_score
            back[i][j] = best_prev

    last_best = max(range(len(tags_list)), key=lambda j: V[n - 1][j])
    path = [last_best]
    for i in range(n - 1, 0, -1):
        path.append(back[i][path[-1]])
    return [tags_list[j] for j in reversed(path)]
```

Bigram HMM 在 Brown 上的准确率约为 93%。从 85% 跃升到 93% 主要得益于 transition Probability：Model 学会了 `DET NOUN` 很常见，而 `NOUN DET` 很少见。

### 第 3 步：现代 tagger 为何表现更好

Transition 和 emission Probability 都是局部的。它们无法理解 `saw` 在 “I bought a saw” 中是 noun，而在 “I saw the movie.” 中是 verb。使用任意 Feature（suffix、word shape、前后单词和单词本身）的 CRF 可以达到约 97% 的准确率。BiLSTM-CRF 或 Transformer 可以达到约 98% 以上。

这项任务的上限由标注者之间的分歧决定。在 Penn Treebank 上，人工标注者的一致率约为 97%。超过 98% 的 Model 很可能是在对 test set 进行 overfitting。

### 第 4 步：dependency parsing 概览

完整地从零实现 dependency parsing 超出了本课范围；规范的教科书讲解可见 Jurafsky 和 Martin。需要了解两个经典系列：

- **Transition-based** parser（arc-eager、arc-standard）的行为类似 shift-reduce parser：它读取 Token，将其 shift 到 stack 上，然后执行创建 arc 的 reduce action。Greedy decoding 速度很快。经典实现是 MaltParser。现代 Neural Network 版本是 Chen 和 Manning 的 transition-based parser。
- **Graph-based** parser（Eisner's algorithm、Dozat-Manning biaffine）会为每一条可能的 head-dependent 边评分，并选出 maximum spanning tree。速度较慢，但更准确。

对于大多数应用工作，直接调用 spaCy：

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("The cats were running at 3pm.")
for token in doc:
    print(f"{token.text:10s} tag={token.tag_:5s} pos={token.pos_:6s} dep={token.dep_:10s} head={token.head.text}")
```

```text
The        tag=DT    pos=DET    dep=det        head=cats
cats       tag=NNS   pos=NOUN   dep=nsubj      head=running
were       tag=VBD   pos=AUX    dep=aux        head=running
running    tag=VBG   pos=VERB   dep=ROOT       head=running
at         tag=IN    pos=ADP    dep=prep       head=running
3pm        tag=NN    pos=NOUN   dep=pobj       head=at
.          tag=.     pos=PUNCT  dep=punct      head=running
```

从下到上读取 `dep` 列，句子的语法结构就会自然呈现出来。

## 使用它

每个生产级 NLP 库都会在标准 Pipeline 中提供 POS 和 dependency parser。

- **spaCy**（`en_core_web_sm` / `md` / `lg` / `trf`）。速度快、准确，并与 Tokenization、NER 和 lemmatization 集成。`token.tag_`（Penn）、`token.pos_`（UD）、`token.dep_`（dependency relation）。
- **Stanford NLP (stanza)**。Stanford 推出的 CoreNLP 后继者。在 60 多种语言上达到 state-of-the-art。
- **trankit**。基于 Transformer，UD 准确率较高。
- **NLTK**。`pos_tag`。可用，但速度慢且较旧，适合教学。

### 这项技术在 2026 年仍然重要的场景

- **Lemmatization。** Lesson 01 需要 POS 才能正确执行 lemmatization，始终如此。
- **从 LLM 输出中进行结构化提取。** 验证生成的句子是否符合语法约束，例如主谓一致和必需的 modifier。
- **Aspect-based sentiment。** Dependency parse 能告诉你哪个 adjective 修饰哪个 noun。
- **查询理解。** “movies directed by Wes Anderson starring Bill Murray” 可通过 parse 分解为结构化约束。
- **跨语言迁移。** UD tag 和 dependency relation 与具体语言无关，因此能够对新语言进行 zero-shot 结构化分析。
- **低计算量 Pipeline。** 如果无法交付 Transformer，POS、dependency parse 加 gazetteer 也能取得意外不错的效果。

## 交付它

保存为 `outputs/skill-grammar-pipeline.md`：

```markdown
---
name: grammar-pipeline
description: 为下游 NLP 任务设计经典的 POS + dependency Pipeline。
version: 1.0.0
phase: 5
lesson: 07
tags: [nlp, pos, parsing]
---

给定一个下游任务（信息提取、重写验证、查询分解、lemmatization），你需要输出：

1. 使用的 tagset。仅面向英语的旧版 Pipeline 使用 Penn Treebank；Multilingual 或跨语言任务使用 Universal Dependencies。
2. 库。大多数生产场景使用 spaCy；学术级 Multilingual 场景使用 stanza；需要最高 UD 准确率时使用 trankit。明确给出具体 Model ID。
3. 集成模式。展示调用该库并使用所需属性（`.pos_`、`.dep_`、`.head`）的 3-5 行代码。
4. 要测试的 Failure mode。Noun-verb 歧义（`saw`、`book`、`can`）和 PP-attachment 歧义是经典陷阱。抽样检查 20 个输出。

拒绝建议自行构建 parser。从零构建 parser 是研究项目，而不是应用任务。任何使用 POS tag 却不处理大小写变体的 Pipeline，都应标记为脆弱。
```

## 练习

1. **简单。** 在一个小型已标注 corpus（例如 NLTK 的 Brown 子集）上使用 most-frequent-tag baseline，测量其在留出句子上的准确率。验证约 85% 的结果。
2. **中等。** 训练上面的 bigram HMM，并报告每个 tag 的 precision/recall。HMM 最容易混淆哪些 tag？
3. **困难。** 使用 spaCy 的 dependency parse，从 1000 个句子的样本中提取 subject-verb-object 三元组。在 50 个手动标注的三元组上进行 Evaluation。记录提取失败的位置，通常包括 passive、coordination 和省略的 subject。

## 关键术语

| 术语 | 人们通常怎么说 | 它的实际含义 |
|------|-----------------|-----------------------|
| POS tag | 单词的类型 | 语法类别。PTB 有 36 种，UD 有 17 种。 |
| Penn Treebank | 标准 tagset | 专用于英语。细分 verb tense 和 noun number。 |
| Universal Dependencies | Multilingual tagset | 粒度比 PTB 更粗；与语言无关；是跨语言工作的默认选择。 |
| Dependency parse | 句子树 | 每个单词都有一个 head，每条边都有一种语法关系。 |
| Viterbi | Dynamic Programming | 在给定 emission 和 transition 的情况下，找出 Probability 最高的 tag 序列。 |

## 延伸阅读

- [Jurafsky and Martin — Speech and Language Processing, chapters 8 and 18](https://web.stanford.edu/~jurafsky/slp3/)：关于 POS 和 parsing 的规范教科书讲解。
- [Universal Dependencies project](https://universaldependencies.org/)：所有 Multilingual parser 都会使用的跨语言 tagset 与 treebank 集合。
- [spaCy linguistic features guide](https://spacy.io/usage/linguistic-features)：`Token` 上公开的每个属性的实用参考资料。
- [Chen and Manning (2014). A Fast and Accurate Dependency Parser using Neural Networks](https://nlp.stanford.edu/pubs/emnlp2014-depparser.pdf)：推动 Neural Network parser 进入主流的论文。
