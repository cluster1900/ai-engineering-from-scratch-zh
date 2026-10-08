# 标签和语法分析

> 语法一旦不太流行. 后来每条LLM管道都需要验证结构化抽取,它又回来了.

**Type:** Build
**Languages:** Python
**先修要求：**五期·01 (文本处理),第二期·14期 (原生)
**Time:** ~45 minutes

## 问题

答应过,制 需要部分语音标签――如果不知道`running`是动词,限制者就无法把它原原为`run`如果我不知道`better`是个形容词,它就无法恢复为`good`,我知道.

这个承诺背后藏着一个完整的子领域――语音标签会分配语法类别――语法解析会恢复句子的树结构:哪个词修饰哪个词,哪个动词 支配哪些论点――经典NLP花了二十年磨磨两者――后来深度学习把它们缩小成训练有素的变压器上的代币分类任务,研究社区也转向其他地方――

但是应用社区没有. 每条结构化提取管道. 底层仍然在使用 POS 和依赖树.

值得了解. 本课介绍标签,基本线,以及何时停止从零实现转而调用空间.

## 概念

**POS tagging**会为每个标志标注语法类别.**Penn Treebank (PTB)**标签是英语默认选择. 它有36个标签,区分细分到普通读者会觉得挑:`NN`单一名词,`NNS`复数名词,`NNP`个体名词,单词`VBD`动词过去时,`VBZ`动词第三个单词存在等等.**Universal Dependencies (UD)**标签更粗粒度 (更粗粒度) 标签,且与语言无关;它已成为跨语言作品的默认选择.

```
The/DET cats/NOUN were/AUX running/VERB at/ADP 3pm/NOUN ./PUNCT
```

**Syntactic parsing**树木的生长主要有两种风格:

- **Constituency parsing.**名称词语、动词词语、语法词语 会相互嵌套──输出是一个非终端类别的树,词语作为叶子──
- **Dependency parsing.**每个词都有一个依赖的头词,并带有语法关系标签.输出是一棵树,其中每条边都是一个 (头,依赖,关系) 三个.

由于它能很好地跨语言泛化,特别是适合自由单词顺序语言.

```
running is ROOT
cats is nsubj of running
were is aux of running
at is prep of running
3pm is pobj of at
```


```figure
pos-tagger
```


```figure
dependency-arcs
```

## 构建它

### 步骤1:最常见的标签基线

对于每一个字,预测它是训练中最常见的标签.

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

在棕色体上,这个基线可以达到约85%的准确度.

### 步骤 2: 大型HMM标记器

对于序列的联合概率 建模:

```
P(tags, words) = prod P(tag_i | tag_{i-1}) * P(word_i | tag_i)
```

两张表:过渡概率 (给定前标签的标签) 和排放概率 (给定标签的词) ⋅用带拉普拉斯平滑的计算 来估计二者──用Viterbi 解码(在标签网上做动态编程) ⋅

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

高于93%的准确性. 从85%到93%的跃升主要来自过渡概率:模型学会了`DET NOUN`很常见,而`NOUN DET`很少见.

### 步骤3:为什么现代标签师能战胜它

转变和排放的可能性都是局部的.`saw`在"我买了"中是名词,而在"我看过电影."中是动词──带任意的特征──后音,字形,前后词,词本身) 的CRF 能达到约97%──BiLSTM-CRF 或变压器 能达到98%+──

在Penn Treebank上,人类注释器的时间共识约为97%――超过98%的模型很可能对测试组过于适合――

### 步骤 4:依赖性解析图

从零完整实现依赖性解析 超出本课范围;标准教材讲解见Jurafsky和Martin──需要了解两个经典家庭:

- **Transition-based**像转换减小解析器 一样工作:它们读取代币,将其转移到堆上,并应用减少行动 来创建弧子.
- **Graph-based**们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们们

对于大多数应用工作,调用空间:

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

从下到上读取`dep`列,句子的语法结构就会显现出来.

## 使用它

每个生产NLP图书馆都将POS和依赖性分类作为标准管道的一部分提供.

- **spaCy**(`en_core_web_sm`现在,`md`现在,`lg`现在,`trf`快速,准确,并与代币化+NER+化集成`token.tag_`现在,我们要去做什么?`token.pos_`其他地方`token.dep_`(依赖关系) 
- **Stanford NLP (stanza)**斯坦福对核心NLP的继任者.
- **trankit**基于变压器,UD精度很好.
- **NLTK**,我知道.`pos_tag`可用 慢慢 较旧 适合教学

### 这在2026年仍然很重要的地方

- **Lemmatization.**需要一个正确的炼.
- **Structured extraction from LLM outputs.**验证生成的句子 是否遵守语法限制 (例如主题verb agreement,需要修改)
- **Aspect-based sentiment.**依赖性检查会告诉你哪个属性修饰哪个名词.
- **Query understanding.**"由韦斯安德森导演,明星比尔·穆雷主演的电影" 会通过分析 分解成结构化限制.
- **Cross-lingual transfer.**支持新语言进行零射结构分析.
- **Low-compute pipelines.**如果不能交付变压器,POS+依赖性解析+报纸机能让你走得很远.

## 交付它

保存为`outputs/skill-grammar-pipeline.md`其他:

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

1. **Easy.**在一个小型标记的体积中 (例如NLTK的Brown子集) 使用最频繁的标记基线,测量了持久的句子上的准确性――验证了大约85%的结果――
2. **Medium.**训练上面的大图 HMM,并报告每标签精度/回忆――HMM 最容易混哪些标签?
3. **Hard.**使用空间的依赖解析,从1000句子的样本中抽取主题-动词-对象三倍. 在50个手工标注的三倍上评估.记录抽取 失败位置 (通常是被动的,协调和被删除的主题) ⋅

## 关键术语

| Term | 人们通常怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| POS tag | Word 的类型 | Grammatical category。PTB 有 36 个；UD 有 17 个。 |
| Penn Treebank | Standard tagset | 针对英语。细粒度区分 verb tenses 和 noun number。 |
| Universal Dependencies | Multilingual tagset | 比 PTB 更粗粒度；language-neutral；cross-lingual work 的默认选择。 |
| Dependency parse | Sentence tree | 每个 word 有一个 head，每条 edge 有一个 grammatical relation。 |
| Viterbi | Dynamic programming | 在给定 emissions 和 transitions 的情况下，找到 probability 最高的 tag sequence。 |

## 延伸阅读

- [Jurafsky and Martin — Speech and Language Processing, chapters 8 and 18](https://web.stanford.edu/~jurafsky/slp3/) POS 和解析的标准教材讲解――
- [Universal Dependencies project](https://universaldependencies.org/) 每个多语言分析器都会使用跨语言标签和树银收集.
- [spaCy linguistic features guide](https://spacy.io/usage/linguistic-features) `Token`上公开的每个属性的实用参考.
- [Chen and Manning (2014). A Fast and Accurate Dependency Parser using Neural Networks](https://nlp.stanford.edu/pubs/emnlp2014-depparser.pdf)将神经分辨器带入主流论文.
