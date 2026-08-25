# Transformer 之前的文本生成 — N-gram Language Model

> 如果一个词出人意料，说明 Model 很差。Perplexity 将意外程度变成数字。Smoothing 则让这个数字保持有限。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 01（文本处理），Phase 2 · 14（Naive Bayes）
**Time:** ~45 分钟

## 问题

在 Transformer、RNN 和词 Embedding 出现之前，Language Model 通过统计一个词出现在前 `n-1` 个词之后的频率来预测下一个词。统计 "the cat" → "sat" 出现 47 次，"the cat" → "jumped" 出现 12 次，"the cat" → "refrigerator" 出现 0 次。归一化后即可得到 Probability Distribution。

这就是 N-gram Language Model。从 1980 年到 2015 年，它支撑了每一种语音识别器、拼写检查器和基于短语的机器翻译系统。如今，当你需要低成本的端侧 Language Modeling 时，它仍在发挥作用。

真正有趣的问题是如何处理未见过的 N-gram。基于原始计数的 Model 会为所有未见过的内容分配零 Probability，这会造成灾难性后果，因为句子很长，几乎每个长句都至少包含一个未见过的序列。五十年的 Smoothing 研究解决了这个问题。Kneser-Ney Smoothing 是其成果，现代 Deep Learning 也继承了这种重视实证的传统。

## 概念

![N-gram Model：计数、Smoothing、生成](../assets/ngram.svg)

### 预测游戏

在这些机制出现之前，有一个实验定义了 Language Model 是什么。遮住一个英语句子的下一个字母，让某个人逐次猜测，直到猜对为止。记录猜测次数。对几百个字母重复这个过程。

这些猜测次数并非无关紧要的数据。它们是文本的一种无损重新编码：把次数序列交给另一个完全相同的猜测者，他们就能还原每个字母，因为在每个位置上，他们都确切知道各次猜测的先后顺序。能够用更少符号重新编码的消息，每个符号携带的信息更少，因此猜测次数的统计结果为英语的 Entropy 设定了上限。

Shannon 在 1951 年进行了这项实验，得到的数字至今仍影响着该领域。由 27 个符号组成的字母表（26 个字母加空格）每个字母最多可以携带 `log2(27) ≈ 4.75` bits。拥有 100 个字母 Context 的人类猜测者达到了每个字母 0.6 到 1.3 bits。英语中大约四分之三的步骤都是被上下文确定的。在任何 Model 能够学习这种结构之前，人们就已经测量了 Model 必须学习的内容。

此后的每一种 Language Model 都是这个游戏的机械玩家，而本课中的每个 Evaluation 数字，都是对这场游戏的评分：

- **Cross-entropy Loss** 是 Model 平均每个符号需要的 bits 数。Training LM 实际上就是在最小化它在猜测游戏中的得分。
- **Perplexity** 是 `2^bits`（或 `e^nats`）：在 Model 完成猜测后仍然面对的分支因子。在 27 个符号中进行均匀猜测时，Perplexity 为 27；每个字母需要 1 bit 的玩家，其 Perplexity 为 2。
- **Context length 是玩家的记忆容量。** Trigram Model 使用两个 Token 的记忆来玩这个游戏。Transformer 使用 100K 个 Token 玩同一个游戏。规则从未改变，只是玩家变得更强了。

需要留意一个单位转换：这个游戏使用 bits（`log2`）按字母计分，而下面的 N-gram 公式使用 nats（自然对数）按词 Token 计分。由于以 nats 表示的 Perplexity `e^H` 等于以 bits 表示的 `2^H`，这两种视角只是用不同单位衡量同一件事。

```figure
prediction-game
```

**N-gram Probability：** `P(w_i | w_{i-n+1}, ..., w_{i-1})`。固定 `n`（Trigram 通常取 3，4-gram 取 4）。根据计数计算：

```text
P(w | context) = count(context, w) / count(context)
```

**零计数问题。** Training 中未出现过的任何 N-gram，其 Probability 都为零。一项 2007 年针对 Brown corpus 的研究发现，即使使用 4-gram Model，保留数据中仍有 30% 的 4-gram 未在 Training 中出现。如果不使用 Smoothing，就无法在任何真实文本上进行 Evaluation。

**Smoothing 方法，按复杂程度排列：**

1. **Laplace（add-one）。** 为每个计数加 1。简单，但处理稀有事件的效果很差。
2. **Good-Turing。** 根据频率的频率，将 Probability mass 从高频事件重新分配给未见事件。
3. **Interpolation。** 使用可调权重组合 N-gram、(n-1)-gram 等估计结果。
4. **Backoff。** 如果 N-gram 的计数为零，就退回到 (n-1)-gram。Katz Backoff 对此进行归一化。
5. **Absolute discounting。** 从所有计数中减去固定折扣 `D`，再将其重新分配给未见事件。
6. **Kneser-Ney。** Absolute discounting 加上对低阶 Model 的巧妙选择：使用 *continuation probability*（一个词出现在多少种 Context 中），而不是原始频率。

Kneser-Ney 的洞见非常深刻。"San Francisco" 是常见的 Bigram。Unigram "Francisco" 大多出现在 "San" 之后。朴素的 Absolute discounting 会为 "Francisco" 分配较高的 Unigram Probability，因为它的计数很高。Kneser-Ney 注意到 "Francisco" 只出现在一种 Context 中，因此相应降低了它的 continuation probability。结果是：一个以 "Francisco" 结尾的新 Bigram 会得到恰当的低 Probability。

**Evaluation：Perplexity。** 在保留测试集上，每个词的平均负 Log-Likelihood 的指数。越低越好。Perplexity 为 100，意味着 Model 的困惑程度相当于在 100 个词中进行均匀选择。

```text
perplexity = exp(- (1/N) * Σ log P(w_i | context_i))
```

```figure
ngram-backoff
```

## 动手构建

### 第 1 步：Trigram 计数

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

输入是一个由 Tokenized 句子组成的列表。输出是 N-gram 计数和 Context 计数。`<s>` 和 `</s>` 是句子边界。

### 第 2 步：Laplace Smoothing

```python
def laplace_probability(ngrams, contexts, vocab_size, context, word):
    ctx = tuple(context)
    numerator = ngrams.get(ctx + (word,), 0) + 1
    denominator = contexts.get(ctx, 0) + vocab_size
    return numerator / denominator
```

为每个计数加 1。它实现了 Smoothing，但会向未见事件分配过多 Probability mass，也会损害已知稀有事件。

### 第 3 步：Kneser-Ney（Bigram，Interpolated）

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

这里有三个相互作用的部分。`continuation_prob` 表示“这个词出现在多少种不同的 Context 中？”（这是 Kneser-Ney 的创新）。`lambda_prev` 是折扣释放出的 Probability mass，用于设置 Backoff 的权重。最终 Probability 等于折扣后的主项加上加权的 continuation 项。

### 第 4 步：通过 Sampling 生成文本

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

按 Probability 比例进行 Sampling。不同 seed 始终会得到不同输出。若要获得类似 Beam Search 的输出，可在每一步选择 argmax（Greedy），并添加一个较小的随机性旋钮（Temperature）。

### 第 5 步：Perplexity

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

越低越好。对于 Brown corpus，经过良好调优的 4-gram KN Model 的 Perplexity 约为 140。Transformer LM 在同一测试集上可以达到 15-30。两者差距约为 10 倍。这就是该领域转向其他方法的原因。

## 实际应用

- **经典 NLP 教学。** 这是理解 Smoothing、MLE 和 Perplexity 最清晰的方式。
- **KenLM。** 生产级 N-gram 库。在重视低延迟的语音和 MT 系统中用作 Rescorer。
- **端侧自动补全。** 键盘中的 Trigram Model。如今仍在使用。
- **Baseline。** 在宣称你的 Neural LM 表现良好之前，始终先计算 N-gram LM 的 Perplexity。如果你的 Transformer 没有大幅超越 KN，就说明存在问题。

## 交付成果

保存为 `outputs/prompt-lm-baseline.md`：

```markdown
---
name: lm-baseline
description: 在 Training Neural LM 之前构建可复现的 N-gram Language Model Baseline。
phase: 5
lesson: 16
---

给定一个 corpus 和目标用途（下一个词预测、Rescoring、Perplexity Baseline），输出：

1. N-gram 阶数。通用英语使用 Trigram；如果 corpus 很大，则使用 4-gram；语音 Rescoring 使用 5-gram。
2. Smoothing。默认使用 Modified Kneser-Ney；Laplace 仅用于教学。
3. 库。生产环境使用 `kenlm`，教学使用 `nltk.lm`，只有为了学习才自行实现。
4. Evaluation。在 Training 集和测试集之间采用一致 Tokenization 的保留集 Perplexity。

拒绝报告使用不同 Tokenization 计算得出的系统间 Perplexity——只有在 Tokenization 完全相同时，Perplexity 数字才具有可比性。标记测试集中的 OOV 率；除非在 Training 期间预留特殊的 <UNK> Token，否则 KN 对 OOV 的处理效果很差。
```

## 练习

1. **简单。** 在包含 1,000 个句子的 Shakespeare corpus 上 Training 一个 Trigram LM。生成 20 个句子。它们在局部上看似合理，但整体上并不连贯。这是经典演示。
2. **中等。** 在保留的 Shakespeare 数据划分上，为你的 KN Model 实现 Perplexity。与 Laplace 比较。你应该会看到 KN 将 Perplexity 降低 30-50%。
3. **困难。** 构建一个 Trigram 拼写纠正器：给定一个拼错的词及其 Context，生成纠正候选，并根据 LM 下的 Context Probability 进行排序。在 Birkbeck spelling corpus（公开）上进行 Evaluation。

## 关键术语

| 术语 | 人们通常怎么说 | 它的实际含义 |
|------|-----------------|-----------------------|
| N-gram | 词序列 | 由连续 `n` 个 Token 组成的序列。 |
| Smoothing | 避免零值 | 重新分配 Probability mass，使未见事件获得非零 Probability。 |
| Perplexity | LM 质量指标 | 在保留数据上的 `exp(-average log-prob)`。越低越好。 |
| Backoff | 退回到更短的 Context | 如果 Trigram 计数为零，则使用 Bigram。Katz Backoff 对此进行了形式化。 |
| Kneser-Ney | 最适合 N-gram 的 Smoothing | Absolute discounting + 用于低阶 Model 的 continuation probability。 |
| Continuation probability | KN 特有概念 | 根据 `w` 出现的 Context 数量，而不是原始计数，为 `P(w)` 加权。 |
| 文本 Entropy | 每个符号的信息量 | 给定 Context 后，编码下一个符号平均需要的 bits 数。Shannon 在 1951 年对最多具有 100 个字母 Context 的印刷英语估计为每个字母 0.6-1.3 bits；这一结果在任何 Model 出现之前就已测得。 |

## 延伸阅读

- [Shannon（1951）。Prediction and Entropy of Printed English](https://www.princeton.edu/~wbialek/rome/refs/shannon_51.pdf) — 定义了每一种 Language Model 至今仍在优化的目标的猜测游戏实验。
- [Jurafsky and Martin — Speech and Language Processing，第 3 章（2026 年草稿）](https://web.stanford.edu/~jurafsky/slp3/3.pdf) — 对 N-gram LM 和 Smoothing 的经典论述。
- [Chen and Goodman（1998）。An Empirical Study of Smoothing Techniques for Language Modeling](https://dash.harvard.edu/handle/1/25104739) — 确立 Kneser-Ney 为最佳 N-gram Smoother 的论文。
- [Kneser and Ney（1995）。Improved Backing-off for M-gram Language Modeling](https://ieeexplore.ieee.org/document/479394) — 最初的 KN 论文。
- [KenLM](https://kheafield.com/code/kenlm/) — 快速的生产级 N-gram LM，2026 年仍用于延迟敏感型应用。
