# POS Tagging 与 Syntactic Parsing

> Grammar 一度不太流行。后来每条 LLM pipeline 都需要验证结构化抽取，它又回来了。

**Type:** Build
**Languages:** Python
**先修要求：** Phase 5 · 01 (文本处理), Phase 2 · 14 (Naive Bayes)
**Time:** ~45 minutes

## 问题

Lesson 01 承诺过，lemmatization 需要 part-of-speech tag。如果不知道 `running` 是 verb，lemmatizer 就无法把它还原为 `run`。如果不知道 `better` 是 adjective，它就无法还原为 `good`。

这个承诺背后藏着一个完整的子领域。Part-of-speech tagging 会分配 grammatical categories。Syntactic parsing 会恢复句子的树结构：哪个词修饰哪个词，哪个 verb 支配哪些 arguments。Classical NLP 花了二十年打磨两者。后来 Deep Learning 把它们压缩成 pretrained transformer 之上的 token-classification task，研究社区也转向了别处。

但 applied community 没有。每条 structured-extraction pipeline 底层仍在使用 POS 和 dependency trees。LLM 生成的 JSON 会根据 grammatical constraints 进行验证。Question-answering systems 会用 dependency parses 分解 queries。Machine translation quality evaluators 会检查 parse trees 的对齐。

值得了解。本课介绍 tagsets、baselines，以及什么时候该停止从零实现、转而调用 spaCy。

## 概念

**POS tagging** 会为每个 token 标注 grammatical category。**Penn Treebank (PTB)** tagset 是英语默认选择。它有 36 个 tags，区分细到普通读者会觉得挑剔：`NN` singular noun、`NNS` plural noun、`NNP` proper noun singular、`VBD` verb past tense、`VBZ` verb 3rd person singular present，等等。**Universal Dependencies (UD)** tagset 更粗粒度（17 个 tags），且与语言无关；它已成为 cross-lingual work 的默认选择。

```
The/DET cats/NOUN were/AUX running/VERB at/ADP 3pm/NOUN ./PUNCT
```

**Syntactic parsing** 会生成一棵树。主要有两种风格：

- **Constituency parsing.** Noun phrases、verb phrases、prepositional phrases 会相互嵌套。输出是一棵 non-terminal categories（NP、VP、PP）组成的树，words 作为 leaves。
- **Dependency parsing.** 每个 word 都有一个它依赖的 head word，并带有 grammatical relation 标签。输出是一棵树，其中每条 edge 都是一个 (head, dependent, relation) triple。

Dependency parsing 在 2010s 胜出，因为它能很好地跨语言泛化，尤其适合 free-word-order languages。

```
running is ROOT
cats is nsubj of running
were is aux of running
at is prep of running
3pm is pobj of at
```

## 构建它

### 步骤 1： most-frequent-tag baseline

最笨但有效的 POS tagger。对每个 word，预测它在训练中最常出现的 tag。

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

在 Brown corpus 上，这个 baseline 能达到约 85% accuracy。不算好，但这是任何严肃 model 都不该低于的下限。

### 步骤 2： bigram HMM tagger

对序列的 joint probability 建模：

```
P(tags, words) = prod P(tag_i | tag_{i-1}) * P(word_i | tag_i)
```

两张表：transition probabilities（给定 previous tag 的 tag）和 emission probabilities（给定 tag 的 word）。用带 Laplace smoothing 的 counts 来估计二者。用 Viterbi 解码（在 tag lattice 上做 dynamic programming）。

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

Bigram HMM 在 Brown 上能达到约 93% accuracy。从 85% 到 93% 的跃升主要来自 transition probabilities：model 学会了 `DET NOUN` 很常见，而 `NOUN DET` 很少见。

### 步骤 3： 为什么 modern taggers 能胜过它

Transition + emission probabilities 都是局部的。它们无法捕捉 `saw` 在 "I bought a saw" 中是 noun，而在 "I saw the movie." 中是 verb。带任意 features（suffix、word shape、前后词、词本身）的 CRF 能达到约 97%。BiLSTM-CRF 或 transformer 能达到 98%+。

这个 task 的上限由 annotator disagreement 决定。Human annotators 在 Penn Treebank 上约 97% 的时间意见一致。超过 98% 的 models 很可能是在对 test set 过拟合。

### 步骤 4： dependency parsing sketch

从零完整实现 dependency parsing 超出本课范围；标准教材讲解见 Jurafsky and Martin。需要了解两个 classical families：

- **Transition-based** parsers（arc-eager、arc-standard）像 shift-reduce parser 一样工作：它们读取 tokens，将其 shift 到 stack 上，并应用 reduce actions 来创建 arcs。Greedy decoding 很快。经典实现是 MaltParser。现代 neural 版本：Chen and Manning 的 transition-based parser。
- **Graph-based** parsers（Eisner's algorithm、Dozat-Manning biaffine）会为每条可能的 head-dependent edge 打分，并选择 maximum spanning tree。更慢但更准确。

对大多数 applied work，调用 spaCy：

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("The cats were running at 3pm.")
for token in doc:
    print(f"{token.text:10s} tag={token.tag_:5s} pos={token.pos_:6s} dep={token.dep_:10s} head={token.head.text}")
```

```
The        tag=DT    pos=DET    dep=det        head=cats
cats       tag=NNS   pos=NOUN   dep=nsubj      head=running
were       tag=VBD   pos=AUX    dep=aux        head=running
running    tag=VBG   pos=VERB   dep=ROOT       head=running
at         tag=IN    pos=ADP    dep=prep       head=running
3pm        tag=NN    pos=NOUN   dep=pobj       head=at
.          tag=.     pos=PUNCT  dep=punct      head=running
```

从下到上读取 `dep` 列，句子的 grammatical structure 就会显现出来。

## 使用它

每个 production NLP library 都把 POS 和 dependency parsers 作为 standard pipeline 的一部分提供。

- **spaCy** (`en_core_web_sm` / `md` / `lg` / `trf`)。快速、准确，并与 tokenization + NER + lemmatization 集成。`token.tag_` (Penn)、`token.pos_` (UD)、`token.dep_` (dependency relation)。
- **Stanford NLP (stanza)**。Stanford 对 CoreNLP 的继任者。在 60+ languages 上达到 state-of-the-art。
- **trankit**。基于 Transformer，UD accuracy 很好。
- **NLTK**。`pos_tag`。可用、较慢、较旧。适合教学。

### 这在 2026 年仍然重要的地方

- **Lemmatization.** Lesson 01 需要 POS 才能正确 lemmatize。永远如此。
- **Structured extraction from LLM outputs.** 验证生成的 sentence 是否遵守 grammatical constraints（例如 subject-verb agreement、required modifiers）。
- **Aspect-based sentiment.** Dependency parses 会告诉你哪个 adjective 修饰哪个 noun。
- **Query understanding.** "movies directed by Wes Anderson starring Bill Murray" 会通过 parse 分解成 structured constraints。
- **Cross-lingual transfer.** UD tags 和 dependency relations 与语言无关，支持对新语言进行 zero-shot structured analysis。
- **Low-compute pipelines.** 如果不能交付 transformer，POS + dependency parse + gazetteer 能让你走得出乎意料地远。

## 交付它

保存为 `outputs/skill-grammar-pipeline.md`：

```markdown
---
name: grammar-pipeline
description: 为下游 NLP task 设计一个 classical POS + dependency pipeline。
version: 1.0.0
phase: 5
lesson: 07
tags: [nlp, pos, parsing]
---

给定一个下游 task（information extraction、rewrite validation、query decomposition、lemmatization），你输出：

1. 要使用的 tagset。English-only legacy pipelines 使用 Penn Treebank，multilingual 或 cross-lingual 使用 Universal Dependencies。
2. Library。大多数 production 使用 spaCy，academic-grade multilingual 使用 stanza，最高 UD accuracy 使用 trankit。写出具体的 model ID。
3. Integration pattern。展示调用 library 并消费所需 attributes（`.pos_`、`.dep_`、`.head`）的 3-5 行代码。
4. 需要测试的 failure mode。Noun-verb ambiguity（`saw`、`book`、`can`）和 PP-attachment ambiguity 是 classical traps。抽样 20 个 outputs 并人工查看。

拒绝建议自己写 parser。Building parsers from scratch 是 research project，不是 application task。标记任何消费 POS tags 却不处理 lowercase/uppercase variants 的 pipeline 为 fragile。
```

## 练习

1. **Easy.** 在一个小型 tagged corpus（例如 NLTK 的 Brown subset）上使用 most-frequent-tag baseline，测量 held-out sentences 上的 accuracy。验证约 85% 的结果。
2. **Medium.** 训练上面的 bigram HMM，并报告 per-tag precision/recall。HMM 最容易混淆哪些 tags？
3. **Hard.** 使用 spaCy 的 dependency parse，从 1000-sentence sample 中抽取 subject-verb-object triples。在 50 个手工标注的 triples 上评估。记录 extraction 失败的位置（通常是 passives、coordinations 和 elided subjects）。

## 关键术语

| Term | 人们通常怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| POS tag | Word 的类型 | Grammatical category。PTB 有 36 个；UD 有 17 个。 |
| Penn Treebank | Standard tagset | 针对英语。细粒度区分 verb tenses 和 noun number。 |
| Universal Dependencies | Multilingual tagset | 比 PTB 更粗粒度；language-neutral；cross-lingual work 的默认选择。 |
| Dependency parse | Sentence tree | 每个 word 有一个 head，每条 edge 有一个 grammatical relation。 |
| Viterbi | Dynamic programming | 在给定 emissions 和 transitions 的情况下，找到 probability 最高的 tag sequence。 |

## 延伸阅读

- [Jurafsky and Martin — Speech and Language Processing, chapters 8 and 18](https://web.stanford.edu/~jurafsky/slp3/) — POS 和 parsing 的标准教材讲解。
- [Universal Dependencies project](https://universaldependencies.org/) — 每个 multilingual parser 都会使用的 cross-lingual tagset 和 treebank collection。
- [spaCy linguistic features guide](https://spacy.io/usage/linguistic-features) — `Token` 上公开的每个 attribute 的实用参考。
- [Chen and Manning (2014). A Fast and Accurate Dependency Parser using Neural Networks](https://nlp.stanford.edu/pubs/emnlp2014-depparser.pdf) — 将 neural parsers 带入主流的论文。
