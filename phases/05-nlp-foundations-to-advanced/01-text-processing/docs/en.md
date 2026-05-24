# 文本处理 — Tokenization、词干提取、词形还原

> 语言是连续的。模型是离散的。预处理就是两者之间的桥梁。

**Type:** 构建
**Languages:** Python
**Prerequisites:** Phase 2 · 14 (Naive Bayes)
**Time:** ~45 分钟

## 问题

模型不能阅读 "The cats were running."。它读取的是整数。

每个 NLP 系统一开始都会面对同样三个问题。一个词从哪里开始。这个词的词根是什么。当有帮助时，我们如何把 "run"、"running"、"ran" 当作同一个东西；而在不该这样做时，又如何把它们当作不同的东西。

Tokenization 做错了，模型就会从垃圾中学习。如果你的 Tokenizer 把 `don't` 当成一个 Token，但把 `do n't` 当成两个 Token，训练分布就会被拆开。如果你的 Stemmer 把 `organization` 和 `organ` 压缩成同一个 Stem，topic modeling 就会失败。如果你的 Lemmatizer 需要 part-of-speech 上下文，但你没有传入，动词就会被当作名词处理。

本课会从零构建这三个预处理基础组件，然后展示 NLTK 和 spaCy 如何完成同样的工作，这样你就能看清其中的取舍。

## 概念

三个操作。每个操作都有自己的任务和失败模式。

**Tokenization** 把字符串拆分成 Token。"Token" 这个词刻意保持模糊，因为正确粒度取决于任务。传统 NLP 使用 word-level。Transformer 使用 subword。没有空格的语言可能使用 character。

**Stemming** 用规则砍掉后缀。快、激进、粗糙。`running -> run`。`organization -> organ`。第二个就是失败模式。

**Lemmatization** 使用语法知识把词还原成字典形式。更慢、更准确，需要 lookup table 或 morphological analyzer。`ran -> run`（需要知道 "ran" 是 "run" 的过去式）。`better -> good`（需要知道比较级形式）。

经验法则。当速度重要且你能容忍噪声时使用 Stemming（search indexing、粗略 Classification）。当意义重要时使用 Lemmatization（question answering、semantic search、任何用户会阅读的内容）。

## 构建它

### 步骤 1： 一个 regex word tokenizer

最简单可用的 Tokenizer 会按非字母数字字符拆分，同时把标点保留为独立 Token。不完美，不是最终版本，但一行就能运行。

```python
import re

def tokenize(text):
    return re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?|[0-9]+|[^\sA-Za-z0-9]", text)
```

三个模式按优先级排列。带可选内部 apostrophe 的单词（`don't`、`it's`）。纯数字。任何单个非空白、非字母数字字符作为独立 Token（标点）。

```python
>>> tokenize("The cats weren't running at 3pm.")
['The', 'cats', "weren't", 'running', 'at', '3', 'pm', '.']
```

需要注意的失败模式。`3pm` 会拆成 `['3', 'pm']`，因为我们在字母序列和数字序列之间交替匹配。对大多数任务来说足够好。URLs、emails、hashtags 都会失败。生产环境中，要在通用模式之前添加这些专门模式。

### 步骤 2： 一个 Porter stemmer（仅 step 1a）

完整的 Porter algorithm 有五个阶段的规则。单独的 Step 1a 覆盖了最常见的英语后缀，也能教会规则模式。

```python
def stem_step_1a(word):
    if word.endswith("sses"):
        return word[:-2]
    if word.endswith("ies"):
        return word[:-2]
    if word.endswith("ss"):
        return word
    if word.endswith("s") and len(word) > 1:
        return word[:-1]
    return word
```

```python
>>> [stem_step_1a(w) for w in ["caresses", "ponies", "caress", "cats"]]
['caress', 'poni', 'caress', 'cat']
```

自上而下阅读规则。`ies -> i` 规则解释了为什么 `ponies -> poni`，而不是 `pony`。真正的 Porter 会有 step 1b 来修复它。规则之间会竞争。更早的规则获胜。顺序比任何单条规则都更重要。

### 步骤 3： 一个基于 lookup 的 Lemmatizer

真正的 Lemmatization 需要 morphology。一个可教学的版本使用小型 lemma table 和 fallback。

```python
LEMMA_TABLE = {
    ("running", "VERB"): "run",
    ("ran", "VERB"): "run",
    ("runs", "VERB"): "run",
    ("better", "ADJ"): "good",
    ("best", "ADJ"): "good",
    ("cats", "NOUN"): "cat",
    ("cat", "NOUN"): "cat",
    ("were", "VERB"): "be",
    ("was", "VERB"): "be",
    ("is", "VERB"): "be",
}

def lemmatize(word, pos):
    key = (word.lower(), pos)
    if key in LEMMA_TABLE:
        return LEMMA_TABLE[key]
    if pos == "VERB" and word.endswith("ing"):
        return word[:-3]
    if pos == "NOUN" and word.endswith("s"):
        return word[:-1]
    return word.lower()
```

```python
>>> lemmatize("running", "VERB")
'run'
>>> lemmatize("cats", "NOUN")
'cat'
>>> lemmatize("better", "ADJ")
'good'
>>> lemmatize("watched", "VERB")
'watched'
```

最后一个案例是关键教学点。`watched` 不在我们的表中，而且 fallback 只处理 `ing`。真正的 Lemmatization 会覆盖 `ed`、不规则动词、比较级形容词、带音变的复数（`children -> child`）。这就是为什么生产系统会使用 WordNet、spaCy 的 morphologizer，或完整的 morphological analyzer。

### 步骤 4： 把它们串起来

```python
def preprocess(text, pos_tagger=None):
    tokens = tokenize(text)
    stems = [stem_step_1a(t.lower()) for t in tokens]
    tags = pos_tagger(tokens) if pos_tagger else [(t, "NOUN") for t in tokens]
    lemmas = [lemmatize(word, pos) for word, pos in tags]
    return {"tokens": tokens, "stems": stems, "lemmas": lemmas}
```

缺失的一块是 POS tagger。Phase 5 · 07 (POS Tagging) 会构建一个。现在，先默认一切都是 `NOUN`，并承认这个限制。

## 使用它

NLTK 和 spaCy 都提供了生产级版本。各自只需要几行。

### NLTK

```python
import nltk
nltk.download("punkt_tab")
nltk.download("wordnet")
nltk.download("averaged_perceptron_tagger_eng")

from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer, WordNetLemmatizer
from nltk import pos_tag

text = "The cats were running."
tokens = word_tokenize(text)
stems = [PorterStemmer().stem(t) for t in tokens]
lemmatizer = WordNetLemmatizer()
tagged = pos_tag(tokens)


def nltk_pos_to_wordnet(tag):
    if tag.startswith("V"):
        return "v"
    if tag.startswith("J"):
        return "a"
    if tag.startswith("R"):
        return "r"
    return "n"


lemmas = [lemmatizer.lemmatize(t, nltk_pos_to_wordnet(tag)) for t, tag in tagged]
```

`word_tokenize` 会处理 contractions、Unicode，以及你的 regex 漏掉的 edge cases。`PorterStemmer` 会运行全部五个阶段。`WordNetLemmatizer` 需要把 POS tag 从 NLTK 的 Penn Treebank scheme 翻译成 WordNet 的缩写集合。上面的翻译连接代码就是大多数教程跳过的部分。

### spaCy

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("The cats were running.")

for token in doc:
    print(token.text, token.lemma_, token.pos_)
```

```
The      the     DET
cats     cat     NOUN
were     be      AUX
running  run     VERB
.        .       PUNCT
```

spaCy 把整个 pipeline 隐藏在 `nlp(text)` 后面。Tokenization、POS tagging 和 Lemmatization 都会运行。大规模场景下比 NLTK 更快。开箱即用也更准确。取舍是你很难单独替换某个组件。

### 什么时候选哪个

| 情况 | 选择 |
|-----------|------|
| 教学、研究、替换组件 | NLTK |
| 生产、多语言、速度重要 | spaCy |
| Transformer pipeline（反正你会用模型的 Tokenizer） | 使用 `tokenizers` / `transformers`，跳过传统预处理 |

### 没人提醒你的两个失败模式

大多数教程讲完算法就停了。真实的 preprocessing pipeline 会被两件事咬住，而且它们几乎从不被覆盖。

**Reproducibility drift.** NLTK 和 spaCy 会在版本之间改变 Tokenization 和 Lemmatizer 行为。在 spaCy 2.x 中产出 `['do', "n't"]` 的东西，在 3.x 中可能产出 `["don't"]`。你的模型是在一个分布上训练的。Inference 现在运行在另一个分布上。准确率悄悄下降，而没人知道原因。把库版本固定在 `requirements.txt`。写一个 preprocessing regression test，冻结 20 个示例句子的期望 Tokenization。每次升级都运行它。

**Training / inference mismatch.** 训练时使用激进预处理（lowercase、stopword removal、stemming），部署时却使用原始用户输入，然后看着性能崩掉。这是最常见的生产 NLP 失败。如果你在训练期间做预处理，inference 期间必须运行完全相同的函数。把 preprocessing 作为函数随 model package 一起发布，而不是作为 serving 团队重新实现的 notebook cell。

## 发布它

一个可复用的 prompt，帮助工程师在不读三本教材的情况下选择 preprocessing strategy。

保存为 `outputs/prompt-preprocessing-advisor.md`：

```markdown
---
name: preprocessing-advisor
description: 为一个 NLP 任务推荐 Tokenization、Stemming 和 Lemmatization 设置。
phase: 5
lesson: 01
---

你负责为传统 NLP preprocessing 提供建议。给定任务描述后，你输出：

1. Tokenization 选择（regex、NLTK word_tokenize、spaCy，或 transformer tokenizer）。解释原因。
2. 是否 stem、lemmatize、两者都做，或两者都不做。解释原因。
3. 具体 library calls。说出函数名称。如果涉及 NLTK，引用 POS-tag 翻译。
4. 用户应该测试的一个失败模式。

拒绝为用户可见文本推荐 Stemming。拒绝在没有 POS tags 的情况下推荐 Lemmatization。把非英语输入标记为需要不同的 pipeline。
```

## 练习

1. **Easy.** 扩展 `tokenize`，把 URLs 保留为单个 Token。测试：`tokenize("Visit https://example.com today.")` 应该产生一个 URL Token。
2. **Medium.** 实现 Porter step 1b。如果一个词包含 vowel 并以 `ed` 或 `ing` 结尾，就移除它。处理 double-consonant 规则（`hopping -> hop`，不是 `hopp`）。
3. **Hard.** 构建一个 Lemmatizer，使用 WordNet 作为 lookup table，但当 WordNet 没有条目时 fallback 到你的 Porter stemmer。在 tagged corpus 上测量它相对于 plain WordNet 和 plain Porter 的准确率。

## 关键术语

| Term | 人们通常说 | 实际含义 |
|------|-----------------|-----------------------|
| Token | 一个词 | 模型消费的任何单位。可以是 word、subword、character 或 byte。 |
| Stem | 一个词的词根 | 基于规则剥离后缀的结果。不一定是真实单词。 |
| Lemma | 字典形式 | 你会去查词典的形式。需要语法上下文才能正确计算。 |
| POS tag | Part of speech | 类别，如 NOUN、VERB、ADJ。准确 Lemmatization 需要它。 |
| Morphology | 词形规则 | 一个词如何根据 tense、number、case 改变形式。Lemmatization 依赖它。 |

## 延伸阅读

- [Porter, M. F. (1980). An algorithm for suffix stripping](https://tartarus.org/martin/PorterStemmer/def.txt) — 原始论文，五页，至今仍是最清晰的解释。
- [spaCy 101 — linguistic features](https://spacy.io/usage/linguistic-features) — 真实 pipeline 是如何连接起来的。
- [NLTK book, chapter 3](https://www.nltk.org/book/ch03.html) — 你可能还没想到的 Tokenization edge cases。
