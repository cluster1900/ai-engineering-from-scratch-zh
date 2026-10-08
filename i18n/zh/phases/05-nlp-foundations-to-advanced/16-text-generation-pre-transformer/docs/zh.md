# 变压器 之前的文本生成  N-gram 语言模型

> 如果一个词令人惊,模型就不好――困惑 把意外程度变成数字――滑滑让它保持有限――

**Type:** Build
**Languages:** Python
**先修要求：**五期·01 (文本处理),第二期·14期 (原生)
**Time:** ~45 分钟

## 问题

在变形器之前,在RNN之前,在词嵌入之前,语言模型通过统计一个词跟在前面`n-1`个词后的频率来预测下一个词――统计"猫" → "坐" 47 次,"猫" → "跳" 12 次,"猫" → "冰箱" 0 次――归一化后得到一个概率分布――

这就是n-gram语言模型.从1980年到2015年,每个语音识别器,每个拼写检查器,每个基于短语的机器翻译系统都在使用它.

真正有意义的问题是如何处理未见的n-gram――原始的基于数值的模型将给任何未见的东西分配零概率,这会造成灾难,因为句子很长,而几乎每个长句子至少包含一个未见的序列――五十年的平滑研究解决了这个问题――Kneser-Ney平滑就是结果,现代深度学习继承了它的经验传统――

## 概念

![N-gram model: count, smooth, generate](../assets/ngram.svg)

**N-gram probability:** `P(w_i | w_{i-n+1}, ..., w_{i-1})`〔固定〕`n`根据计数计算:

```text
P(w | context) = count(context, w) / count(context)
```

**零计数问题。**任何训练中没有见过的n-gram都会得到零概率――2007年关于布朗体研究发现,即使是4gram模型,也有30%的持久4gram在训练中没有出现――不做滑滑,就无法在任何真实文本上评估――

**Smoothing 方法，按复杂度递增：**

1. **Laplace (add-one)。**给每一个人加一个. 简单,但在稀有事件中,很糟糕.
2. **Good-Turing。**基于频率频率,将概率质量从高频事件重新分配到未见事件.
3. **Interpolation。**根据""的数据,
4. **Backoff。**如果 n-gram 计数为零,就回归到 (n-1) -gram.
5. **Absolute discounting。**减去所有计数中一个固定折扣`D`重新分配给未见事件.
6. **Kneser-Ney。**绝对折扣加上一个巧妙的低阶模型选择:使用 *延续概率*(一个词出现于多少种背景中),而不是原始频率──

简单的绝对折扣会给"旧金山" 很高的单一图 概率(因为数量很高) . 克纳斯-尼注意到"旧金山"只出现在一个背景中,因此相应降低了其延续概率.

**评估：perplexity。**在进行的测试集中,每个词平均负负 log-likelihood的指数──越低越好──困惑为100意味着模型的困惑程度相当于在100个词中均随机选择──

```text
perplexity = exp(- (1/N) * Σ log P(w_i | context_i))
```


```figure
ngram-backoff
```


```figure
prediction-game
```

## 构建它

### 步骤1:三角形计数

```python
from collections import Counter, defaultdict


def train_ngram(corpus_tokens, n=3):
    ngrams = Counter()
    contexts = Counter()
    for sentence in corpus_tokens:
        padded = ["<s>"] * (n - 1) + sentence + ["</s>"]
        for i in range(len(padded) - n + 1):
            ctx = tuple(padded[i:i + n - 1])
            word = padded[i + n - 1]
            ngrams[ctx + (word,)] += 1
            contexts[ctx] += 1
    return ngrams, contexts


def raw_probability(ngrams, contexts, context, word):
    ctx = tuple(context)
    if contexts.get(ctx, 0) == 0:
        return 0.0
    return ngrams.get(ctx + (word,), 0) / contexts[ctx]
```

输入是标记式句子的列表.输出是n-gram 计数和文本 计数.`<s>`和 `</s>`是句子边界.

### 步骤 2: 拉普拉斯滑滑

```python
def laplace_probability(ngrams, contexts, vocab_size, context, word):
    ctx = tuple(context)
    numerator = ngrams.get(ctx + (word,), 0) + 1
    denominator = contexts.get(ctx, 0) + vocab_size
    return numerator / denominator
```

给每一个计数加1――能平滑,但会把太多的概率质量分配给未见事件,也会伤害已知的稀有事件――

### 步骤3: 子-新 (大图,插入)

```python
def kneser_ney_bigram_model(corpus_tokens, discount=0.75):
    unigrams = Counter()
    bigrams = Counter()
    unigram_contexts = defaultdict(set)

    for sentence in corpus_tokens:
        padded = ["<s>"] + sentence + ["</s>"]
        for i, w in enumerate(padded):
            unigrams[w] += 1
            if i > 0:
                prev = padded[i - 1]
                bigrams[(prev, w)] += 1
                unigram_contexts[w].add(prev)

    total_unique_bigrams = sum(len(ctx_set) for ctx_set in unigram_contexts.values())
    continuation_prob = {
        w: len(ctx_set) / total_unique_bigrams for w, ctx_set in unigram_contexts.items()
    }

    context_totals = Counter()
    for (prev, w), count in bigrams.items():
        context_totals[prev] += count

    unique_follow = defaultdict(set)
    for (prev, w) in bigrams:
        unique_follow[prev].add(w)

    def prob(prev, w):
        count = bigrams.get((prev, w), 0)
        denom = context_totals.get(prev, 0)
        if denom == 0:
            return continuation_prob.get(w, 1e-9)
        first_term = max(count - discount, 0) / denom
        lambda_prev = discount * len(unique_follow[prev]) / denom
        return first_term + lambda_prev * continuation_prob.get(w, 1e-9)

    return prob
```

三个活动部件.`continuation_prob`捕捉这个词现在出现在多种不同的背景中?`lambda_prev`优惠 释放的概率质量,用于给backkoff加权.

### 步骤4:使用样本 生成文本

```python
import random


def generate(prob_fn, vocab, prefix, max_len=30, seed=0):
    rng = random.Random(seed)
    tokens = list(prefix)
    for _ in range(max_len):
        candidates = [(w, prob_fn(tokens[-1], w)) for w in vocab]
        total = sum(p for _, p in candidates)
        r = rng.random() * total
        acc = 0.0
        for w, p in candidates:
            acc += p
            if r <= acc:
                tokens.append(w)
                break
        if tokens[-1] == "</s>":
            break
    return tokens
```

根据概率比例抽样. 每种种子总会给出不同的输出.

### 步骤5:困惑

```python
import math


def perplexity(prob_fn, sentences):
    total_log_prob = 0.0
    total_tokens = 0
    for sentence in sentences:
        padded = ["<s>"] + sentence + ["</s>"]
        for i in range(1, len(padded)):
            p = prob_fn(padded[i - 1], padded[i])
            total_log_prob += math.log(max(p, 1e-12))
            total_tokens += 1
    return math.exp(-total_log_prob / total_tokens)
```

越低越好──对于布朗体,一个调整好的4克KN模型的乱大约能达到140──变压器LM在同一试验组上可以达到15-30──差距大约是10x──这就是这个领域继续进步的原因──

## 使用它

- **经典 NLP 教学。**你能得到关于平滑的信息,
- **KenLM。**生产级 n-gram 库──在语音和MT 系统中作为回数器 使用,适合低延迟场景──
- **端侧 autocomplete。**键盘中的三角形模型.
- **Baselines。**在宣称你的神经系统是很好的之前,一定要先计算n-gram的 LM困难.

## 交付它
保存为`outputs/prompt-lm-baseline.md`其他:

```markdown
---
name: lm-baseline
description: 在训练 Neural LM 之前，构建一个可复现的 n-gram 语言模型 baseline。
phase: 5
lesson: 16
---

给定一个 corpus 和目标用途（next-word prediction、rescoring、perplexity baseline），输出：

1. N-gram order。通用英语使用 trigram；如果 corpus 很大，使用 4-gram；语音 rescoring 使用 5-gram。
2. Smoothing。Modified Kneser-Ney 是默认选择；Laplace 只用于教学。
3. Library。生产使用 `kenlm`，教学使用 `nltk.lm`，只有为了学习才自己实现。
4. Evaluation。在训练集和测试集之间使用一致 Tokenization 的 held-out perplexity。

拒绝报告在被比较系统之间使用不同 Tokenization 计算出的 perplexity —— perplexity 数字只有在完全相同的 Tokenization 下才可比较。标记测试集中的 OOV rate；除非在训练期间预留特殊的 <UNK> Token，否则 KN 对 OOV 处理很差。
```

## 练习

1. **Easy.**在一个1000句的莎士比亚作品中,上练习三角形 LM──产生20句――它们会在局部看起来合理,但整体上不连贯──这是经典演示──
2. **Medium.**为了让你知道,你应该看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到,你会看到的.
3. **Hard.**构建一个三重形 拼写纠错器:给定一个拼错的词及其背景,生成修正候选,并按LM下的背景概率 排序――在伯克贝克拼写体 (Birkbeck spelling corpus) 开) 上评估――

## 关键术语
| Term | 人们通常怎么说 | 它实际是什么意思 |
|------|-----------------|-----------------------|
| N-gram | 词序列 | `n` 个连续 Token 的序列。 |
| Smoothing | 避免零 | 重新分配概率质量，使未见事件获得非零概率。 |
| Perplexity | LM 质量指标 | held-out 数据上的 `exp(-average log-prob)`。越低越好。 |
| Backoff | 回退到更短 context | 如果 trigram 计数为零，就使用 bigram。Katz backoff 将其形式化。 |
| Kneser-Ney | n-gram 的最佳 smoothing | Absolute discounting + 低阶模型的 continuation probability。 |
| Continuation probability | KN 专用 | `P(w)` 按 `w` 出现的 context 数量加权，而不是按原始计数加权。 |

## 延伸阅读
- [Jurafsky and Martin — Speech and Language Processing, Chapter 3 (2026 draft)](https://web.stanford.edu/~jurafsky/slp3/3.pdf)n克LM 和滑滑的经典处理
- [Chen and Goodman (1998). An Empirical Study of Smoothing Techniques for Language Modeling](https://dash.harvard.edu/handle/1/25104739) 确立Kneser-Ney作为最佳n-gram滑的论文
- [Kneser and Ney (1995). Improved Backing-off for M-gram Language Modeling](https://ieeexplore.ieee.org/document/479394) 原始 KN 论文──
- [KenLM](https://kheafield.com/code/kenlm/) 快速的生产级 n-gram LM,2026年仍在延迟敏感应用中.
