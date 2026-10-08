# 文本处理 标记化,排序,化

> 语言是连续的.模型是离散的.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 2 · 14 (Naive Bayes)
**Time:** ~45 分钟

## 问题

模型不能读"猫们跑了. "──它读取的是整数──

每个NLP系统都从同样的三个问题开始.词从哪里开始.词的根源是什么. 我们如何在有帮助的时候把"运行","运行","运行"当作同一个事,又在无助的时候把它们当作不同的事物.

标记化做错了,模型就会从垃圾中学习.`don't`当作一个标志,却把`do n't`当作两个代币,训练分布就被拆开了.`organization`和 `organ`压成同一个干,主题建模就完成了. 如果你的 lemmatizer 需要部分的演讲 上下文但你没有传入,动词就会被当作名词处理.

本课程将从零构建到这些三个预处理步骤,然后展示NLTK和SpaceCy如何做同样的工作,让你看清其中的取舍.

## 概念

它们都具有自己的责任和失败模式.

**Tokenization**将字符串切分为代币――"代币"这个词有意保持模糊,因为正确的粒度取决于任务――经典的NLP 使用词级――变化器 使用字母――没有空格的语言使用字符――

**Stemming**用规则砍掉后──快──激进──粗──`running -> run`,我知道.`organization -> organ`第二就是失败模式.

**Lemmatization**使用语法知识把词还原为词典形式――更慢、更准确,需要搜索表或形态分析仪――`ran -> run`(需要知道"跑"是"跑"的过去式)`better -> good`(需要知道比较级形式)

经验法则──速度很重要且可以容忍噪音时使用源源的搜索索引,粗略分类)──语义很重要时使用化.


```figure
edit-distance
```

## 建立它

### 步骤1:一个regex字符标记器

最简单的可用的标记符将按非字母数字字符切分,同时保留标记点为自己的标记.

```python
import re

def tokenize(text):
    return re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?|[0-9]+|[^\sA-Za-z0-9]", text)
```

三个模式 按优先排列.带可选内部留号的词.`don't`,我知道.`it's`)──纯数字──任何单个非空白、非字母数字字符作为独立标记(标点)──

```python
>>> tokenize("The cats weren't running at 3pm.")
['The', 'cats', "weren't", 'running', 'at', '3', 'pm', '.']
```

需要注意的失败模式.`3pm`会被切成`['3', 'pm']`由于我们在字母段和数字段之间交换. 对于大多数任务来说,URL,电子邮件,hashtag都会出现问题.

### 步骤2: 一个 Porter stemmer (仅仅是步骤1)

完整的波特算法有五个规则阶段. 只有步骤1a就覆盖了最常见的英语后,并能教出这个模式.

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

按从上到下读取规则.`ies -> i`规则就是`ponies -> poni`而不是`pony`原因──真实的波特有第一步b,会修改它──规则会竞争──更早的规则胜利──顺序比任何单条规则都更重要──

### 步骤3:一个基于搜索的 lemmatizer

真正的化需要形态学――一个可教学的版本使用小式表 和倒退――

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

最后一个例子是关键教学点.`watched`没有在我们的桌子中,而倒退只是处理.`ing`◎ 实际的化 会覆盖`ed`、不规则动词、比较级形容词、带音变的复数(`children -> child`这就是生产系统使用WordNet、spaCy的形态分析器或完整的形态分析器的原因.

### 步骤4:把它们连接起来

```python
def preprocess(text, pos_tagger=None):
    tokens = tokenize(text)
    stems = [stem_step_1a(t.lower()) for t in tokens]
    tags = pos_tagger(tokens) if pos_tagger else [(t, "NOUN") for t in tokens]
    lemmas = [lemmatize(word, pos) for word, pos in tags]
    return {"tokens": tokens, "stems": stems, "lemmas": lemmas}
```

缺失的一块是POS标签. 阶段5 · 07 (POS标签) 会构建一个.`NOUN`承认这个限制.

## 用它

它们只需要几行.

### 其他国家

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

`word_tokenize`处理收缩,Unicode,以及你的regex 漏掉的边界情况.`PorterStemmer`运行全部五个阶段.`WordNetLemmatizer`需要把 POS 标签从 NLTK 的 Penn Treebank 计划 翻译成 WordNet 的缩写集合上面.

### 空间

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

整个管道被隐藏在`nlp(text)`后面──标签化、POS标签化 和 lemmatization 都会运行──大规模时比NLTK更快──开箱即用更准确──取舍是你不容易替换单个组件──

### 什么时候选择哪个

| Situation | Pick |
|-----------|------|
| 教学、研究、替换组件 | NLTK |
| 生产、多语言、速度重要 | spaCy |
| Transformer pipeline（反正你会用模型自己的 Tokenizer） | 使用 `tokenizers` / `transformers`，跳过经典 preprocessing |

### 没有人提醒你的两个失败模式

实际上,预处理管道将被两件事咬住,而且它们几乎从来没有被覆盖.

**Reproducibility drift。**在2x中产生了NLTK和spaCy的变化.`['do', "n't"]`内容,在3.x中可能产生`["don't"]`你的模型在一个分布上训练的. 推理现在运行在另一个分布上.`requirements.txt`中固定图书馆 版本──写一个预处理回归测试,结结 20 个示例句子的预期代码化──每次升级都运行它──

**Training / inference mismatch。**训练时使用激进预处理(下文字母、停止字母删除、声音),部署时却原始用户输入,然后看性能崩──这是最常见的生产NLP失败──如果训练时做预处理,输入时必须运行完全相同的函数──把预处理作为函数随模型包发布,而不是作为笔记本电脑细胞让服务团队重写──

## 运送它

一个可复制的提示,帮助工程师在不读三本教材的情况下选择预处理策略.

保存为`outputs/prompt-preprocessing-advisor.md`其他:

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

## 运动

1. **Easy.**扩展`tokenize`让URL保持为单个代币.`tokenize("Visit https://example.com today.")`应该产生一个URL标记.
2. **Medium.**实现波特步骤1b. 如果一个词包含元音并以`ed`或`ing`结尾,移除它――处理双辅音规则(`hopping -> hop`没有`hopp`
3. **Hard.**构建一个使用WordNet 作为搜索表的 lemmatizer,但当WordNet 没有条目时倒退到你的 Porter stemmer──在标签的体内上衡量它对平凡WordNet 和平凡 Porter 的准确率──

## 关键词

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Token | 一个词 | 模型消耗的任何单位。可以是 word、subword、character 或 byte。 |
| Stem | 词根 | 基于规则的后缀剥离结果。不一定是真实单词。 |
| Lemma | 词典形式 | 你会去查词典的形式。需要语法上下文才能正确计算。 |
| POS tag | Part of speech | 像 NOUN、VERB、ADJ 这样的类别。准确 lemmatization 需要它。 |
| Morphology | 词形规则 | 词如何基于 tense、number、case 改变形式。Lemmatization 依赖它。 |

## 进一步阅读

- [Porter, M. F. (1980). An algorithm for suffix stripping](https://tartarus.org/martin/PorterStemmer/def.txt) 原始论文,五页,至今仍然是最清晰的解释.
- [spaCy 101 — linguistic features](https://spacy.io/usage/linguistic-features)真实管道 如何接线.
- [NLTK book, chapter 3](https://www.nltk.org/book/ch03.html) 你还没有想到的标记化 边界情况.
