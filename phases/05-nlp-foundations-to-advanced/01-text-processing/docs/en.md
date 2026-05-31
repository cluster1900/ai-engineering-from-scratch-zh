# Text Processing — Tokenization, Stemming, Lemmatization

> 语言是连续的。模型是离散的。Preprocessing 是桥梁。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 2 · 14 (Naive Bayes)
**Time:** ~45 分钟

## The Problem

模型无法阅读 "The cats were running."。它读取的是整数。

每个 NLP 系统都会从同样三个问题开始。词从哪里开始。词的词根是什么。我们如何在有帮助时把 "run"、"running"、"ran" 当作同一事物，又在无帮助时把它们当作不同事物。

Tokenization 做错了，模型就会从垃圾中学习。如果你的 Tokenizer 把 `don't` 当作一个 Token，却把 `do n't` 当作两个 Token，训练分布就被拆开了。如果你的 stemmer 把 `organization` 和 `organ` 压成同一个 stem，topic modeling 就完了。如果你的 lemmatizer 需要 part-of-speech 上下文但你没有传入，动词就会被当作名词处理。

本课会从零构建这三个 preprocessing 步骤，然后展示 NLTK 和 spaCy 如何做同样的工作，让你看清其中的取舍。

## The Concept

三个操作。每个都有自己的职责和 failure mode。

**Tokenization** 将字符串切分为 tokens。"Token" 这个词有意保持模糊，因为正确的粒度取决于任务。经典 NLP 使用 word-level。Transformers 使用 subword。没有空格的语言使用 character。

**Stemming** 用规则砍掉后缀。快、激进、粗糙。`running -> run`。`organization -> organ`。第二个就是 failure mode。

**Lemmatization** 使用语法知识把词还原为词典形式。更慢、更准确，需要 lookup table 或 morphological analyzer。`ran -> run`（需要知道 "ran" 是 "run" 的过去式）。`better -> good`（需要知道比较级形式）。

经验法则。速度重要且可以容忍噪声时使用 stemming（search indexing、粗略 classification）。语义重要时使用 lemmatization（question answering、semantic search、任何用户会阅读的内容）。

## Build It

### Step 1: 一个 regex word tokenizer

最简单有用的 Tokenizer 会按非字母数字字符切分，同时把标点保留为自己的 Token。不完美，不是终点，但一行就能运行。

```python
import re

def tokenize(text):
    return re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?|[0-9]+|[^\sA-Za-z0-9]", text)
```

三个 pattern 按优先级排列。带可选内部撇号的词（`don't`、`it's`）。纯数字。任何单个非空白、非字母数字字符作为独立 Token（标点）。

```python
>>> tokenize("The cats weren't running at 3pm.")
['The', 'cats', "weren't", 'running', 'at', '3', 'pm', '.']
```

需要注意的 failure modes。`3pm` 会被切成 `['3', 'pm']`，因为我们在字母段和数字段之间交替。对大多数任务足够好。URLs、emails、hashtags 都会出问题。生产环境中，在通用 pattern 之前添加专门的 pattern。

### Step 2: 一个 Porter stemmer（仅 step 1a）

完整 Porter algorithm 有五个规则阶段。仅 step 1a 就覆盖了最常见的英语后缀，并能教清这个模式。

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

按从上到下读取规则。`ies -> i` 规则就是 `ponies -> poni` 而不是 `pony` 的原因。真实的 Porter 有 step 1b，会修正它。规则会竞争。更早的规则获胜。顺序比任何单条规则都更重要。

### Step 3: 一个基于 lookup 的 lemmatizer

真正的 lemmatization 需要 morphology。一个可教学的版本使用小型 lemma table 和 fallback。

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

最后一个例子是关键教学点。`watched` 不在我们的 table 中，而 fallback 只处理 `ing`。真实 lemmatization 会覆盖 `ed`、不规则动词、比较级形容词、带音变的复数（`children -> child`）。这就是生产系统使用 WordNet、spaCy 的 morphologizer 或完整 morphological analyzer 的原因。

### Step 4: 把它们串起来

```python
def preprocess(text, pos_tagger=None):
    tokens = tokenize(text)
    stems = [stem_step_1a(t.lower()) for t in tokens]
    tags = pos_tagger(tokens) if pos_tagger else [(t, "NOUN") for t in tokens]
    lemmas = [lemmatize(word, pos) for word, pos in tags]
    return {"tokens": tokens, "stems": stems, "lemmas": lemmas}
```

缺失的一块是 POS tagger。Phase 5 · 07 (POS Tagging) 会构建一个。现在，默认全部为 `NOUN`，并承认这个限制。

## Use It

NLTK 和 spaCy 提供生产版本。各自只需几行。

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

`word_tokenize` 会处理 contractions、Unicode，以及你的 regex 漏掉的边界情况。`PorterStemmer` 会运行全部五个阶段。`WordNetLemmatizer` 需要把 POS tag 从 NLTK 的 Penn Treebank scheme 翻译到 WordNet 的缩写集合。上面的转换接线是大多数教程跳过的部分。

### spaCy

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("The cats were running.")

for token in doc:
    print(token.text, token.lemma_, token.pos_)
```

```text
The      the     DET
cats     cat     NOUN
were     be      AUX
running  run     VERB
.        .       PUNCT
```

spaCy 把整个 pipeline 隐藏在 `nlp(text)` 后面。Tokenization、POS tagging 和 lemmatization 都会运行。大规模时比 NLTK 更快。开箱即用更准确。取舍是你不容易替换单个组件。

### 什么时候选哪个

| Situation | Pick |
|-----------|------|
| 教学、研究、替换组件 | NLTK |
| 生产、多语言、速度重要 | spaCy |
| Transformer pipeline（反正你会用模型自己的 Tokenizer） | 使用 `tokenizers` / `transformers`，跳过经典 preprocessing |

### 没人提醒你的两个 failure modes

大多数教程只讲算法，然后就停了。真实 preprocessing pipeline 会被两件事咬住，而且它们几乎从不被覆盖。

**Reproducibility drift。** NLTK 和 spaCy 在版本之间会改变 tokenization 和 lemmatizer 行为。在 spaCy 2.x 中产生 `['do', "n't"]` 的内容，在 3.x 中可能产生 `["don't"]`。你的模型是在一个分布上训练的。Inference 现在运行在另一个分布上。准确率悄悄下降，而没人知道原因。在 `requirements.txt` 中固定 library 版本。写一个 preprocessing regression test，冻结 20 个示例句子的预期 tokenization。每次升级都运行它。

**Training / inference mismatch。** 训练时使用激进 preprocessing（lowercase、stopword removal、stemming），部署时却喂原始用户输入，然后看性能崩掉。这是最常见的生产 NLP failure。如果训练时做 preprocessing，inference 时必须运行完全相同的函数。把 preprocessing 作为函数随模型包发布，而不是作为 notebook cell 让 serving team 重写。

## Ship It

一个可复用 prompt，帮助工程师在不读三本教材的情况下选择 preprocessing 策略。

保存为 `outputs/prompt-preprocessing-advisor.md`：

```markdown
---
name: preprocessing-advisor
description: Recommends a tokenization, stemming, and lemmatization setup for an NLP task.
phase: 5
lesson: 01
---

You advise on classical NLP preprocessing. Given a task description, you output:

1. Tokenization choice (regex, NLTK word_tokenize, spaCy, or transformer tokenizer). Explain why.
2. Whether to stem, lemmatize, both, or neither. Explain why.
3. Specific library calls. Name the functions. Quote the POS-tag translation if NLTK is involved.
4. One failure mode the user should test for.

Refuse to recommend stemming for user-visible text. Refuse to recommend lemmatization without POS tags. Flag non-English input as needing a different pipeline.
```

## Exercises

1. **Easy.** 扩展 `tokenize`，让 URLs 保持为单个 Token。测试：`tokenize("Visit https://example.com today.")` 应该产生一个 URL Token。
2. **Medium.** 实现 Porter step 1b。如果一个词包含元音并以 `ed` 或 `ing` 结尾，移除它。处理双辅音规则（`hopping -> hop`，不是 `hopp`）。
3. **Hard.** 构建一个使用 WordNet 作为 lookup table 的 lemmatizer，但当 WordNet 没有条目时 fallback 到你的 Porter stemmer。在 tagged corpus 上衡量它相对 plain WordNet 和 plain Porter 的准确率。

## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Token | 一个词 | 模型消耗的任何单位。可以是 word、subword、character 或 byte。 |
| Stem | 词根 | 基于规则的后缀剥离结果。不一定是真实单词。 |
| Lemma | 词典形式 | 你会去查词典的形式。需要语法上下文才能正确计算。 |
| POS tag | Part of speech | 像 NOUN、VERB、ADJ 这样的类别。准确 lemmatization 需要它。 |
| Morphology | 词形规则 | 词如何基于 tense、number、case 改变形式。Lemmatization 依赖它。 |

## Further Reading

- [Porter, M. F. (1980). An algorithm for suffix stripping](https://tartarus.org/martin/PorterStemmer/def.txt) — 原始论文，五页，至今仍是最清晰的解释。
- [spaCy 101 — linguistic features](https://spacy.io/usage/linguistic-features) — 真实 pipeline 如何接线。
- [NLTK book, chapter 3](https://www.nltk.org/book/ch03.html) — 你还没想到的 tokenization 边界情况。
