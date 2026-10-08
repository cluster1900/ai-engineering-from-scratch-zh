# Transformer 之前的文本生成  N-gram 语言模型

> Nếu một từ bất ngờ, mô hình là không tốt.

**Type:** Build
**Languages:** Python
**先修要求：**Giai đoạn 5 · 01 (文本处理), Giai đoạn 2 · 14 (Naive Bayes)
**Time:** ~45 分钟

## 问题

Trong Transformer  trước, trong RNN  trước, trong Word Embedding  trước, ngôn ngữ mô hình thông qua thống kê một từ theo trên trước `n-1`个词后的频率来预测 下一个词――统计 "hẹ" → "hồi" 47 lần, "hẹ" → " nhảy" 12 lần, "hẹ" → "tủ lạnh" 0 lần――归一化后得到一个概率分布――

Đây là mô hình ngôn ngữ n-gram. Từ năm 1980 đến năm 2015, mỗi bộ nhận dạng tiếng nói, mỗi bộ kiểm tra chữ, mỗi hệ thống dịch thuật máy dựa trên ngôn ngữ đều sử dụng nó.

Vấn đề có ý nghĩa thực sự là làm thế nào để xử lý n-gram chưa thấy. Mô hình dựa trên số liệu ban đầu sẽ phân phối không xác suất bất kỳ thứ gì chưa thấy, điều này sẽ gây ra thảm họa, vì câu dài, và hầu như mỗi câu dài đều có ít nhất một chuỗi chưa thấy.

## 概念

![N-gram model: count, smooth, generate](../assets/ngram.svg)

**N-gram probability:** `P(w_i | w_{i-n+1}, ..., w_{i-1})`❖ Đặt `n`(thường là trigram dùng 3,4 gram dùng 4)

```text
P(w | context) = count(context, w) / count(context)
```

**零计数问题。**Một nghiên cứu năm 2007 về Brown corpus phát hiện ra, ngay cả trong mô hình 4 gram, có 30% 4 gram không xuất hiện trong tập luyện. Không làm trơn, không thể đánh giá trên bất kỳ văn bản thực nào.

**Smoothing 方法，按复杂度递增：**

1. **Laplace (add-one)。**Đưa cho mỗi con số thêm 1... đơn giản, nhưng trong những trường hợp hiếm hoi thì rất tệ.
2. **Good-Turing。**Dựa trên tần suất tần suất, phân bổ chất lượng xác suất từ các sự kiện tần suất cao sang các sự kiện chưa thấy.
3. **Interpolation。**Sử dụng có thể điều chỉnh quyền重组合 n-gram, n-1)-gram 等估计.
4. **Backoff。**Nếu n-gram 计数为零,就回归到 (n-1) -gram.
5. **Absolute discounting。**Từ tất cả các tính toán giảm đi một giảm giá cố định .`D`, tái phân phối cho các sự kiện chưa thấy.
6. **Kneser-Ney。**Sự giảm giá tuyệt đối 加上一个巧妙的低阶模型选择: sử dụng *sự xác suất tiếp tục*(一个词出现现在多少种种背景中), thay vì là thường xuyên nguyên thủy。

Kneser-Ney của洞见很深──"San Francisco" là một hình ảnh lớn thường thấy.

**评估：perplexity。**Trong tập hợp thử nghiệm được tổ chức, mỗi từ trung bình âm tính là chỉ số xác suất log-cho-nếu.

```text
perplexity = exp(- (1/N) * Σ log P(w_i | context_i))
```


```figure
ngram-backoff
```


```figure
prediction-game
```

##  xây dựng nó

### 步骤 1: trigram 计数

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

输入是标记式句子的列表──输出是 n-gram 计数和文本 计数──`<s>`和 `</s>`Đó là giới hạn của nó.

### 步骤 2: Laplace smoothing

```python
def laplace_probability(ngrams, contexts, vocab_size, context, word):
    ctx = tuple(context)
    numerator = ngrams.get(ctx + (word,), 0) + 1
    denominator = contexts.get(ctx, 0) + vocab_size
    return numerator / denominator
```

Đưa cho mỗi con số thêm 1,.. có thể làm trơn, nhưng sẽ phân bổ chất lượng quá nhiều xác suất cho các sự kiện chưa thấy, cũng sẽ gây tổn hại cho các sự kiện hiếm gặp được biết.

### 步骤 3: Kneser-Ney(bigram,đối tác)

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

三个活动部件──`continuation_prob`捕捉这个词出现了多少种不同的背景中?`lambda_prev`là giảm giá 释放的概率质量, được sử dụng để cung cấp backkoff 加权.

### 步骤 4: Sử dụng lấy mẫu 生成文本

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

根据概率比例样本化――每个种子 总会给出不同的输出――对于类似光束搜索的输出,在每一步选择 argmax(贪),并加入一个小的随机性旋(温度)

### Bước 5: Sự bối rối

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

Đối với cơ thể Brown, một độ phức tạp mô hình KN 4 gram tốt có thể đạt 140 người.

## Sử dụng nó

- **经典 NLP 教学。**Bạn có thể nhận được những gì về sự trơn tru, MLE và sự bối rối,
- **KenLM。**生产级 n-gram 库──在语音和MT 系统中作为 rescorer 使用,适合低延迟场景──
- **端侧 autocomplete。**Trigram trong bàn phím 模型── vẫn vậy──
- **Baselines。**Trong tuyên bố về LM thần kinh của bạn  rất tốt trước đó, nhất định trước tiên tính toán n-gram LM phức tạp. Nếu Transformer của bạn không đánh bại KN, thì có vấn đề.

## 交付 nó
保存为 `outputs/prompt-lm-baseline.md`- Có thể là:

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

1. **Easy.**Trong một 1000 câu của Shakespeare corpus trên tập hợp trigram LM.  tạo ra 20 câu.  Chúng sẽ trông hợp lý trên bộ mặt, nhưng trên toàn bộ không liên kết.  Đây là một diễn thuyết cổ điển.
2. **Medium.**Để làm cho bạn biết mô hình của Shakespeare chia rẽ trên thực hiện sự bối rối.
3. **Hard.**构建一个三重形 拼写纠错器:给定一个拼错的词及其背景,生成修正候选,并按 LM 下的背景概率 排序──在 Birkbeck拼写 corpus(公开) 上评估──

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
- [Jurafsky and Martin — Speech and Language Processing, Chapter 3 (2026 draft)](https://web.stanford.edu/~jurafsky/slp3/3.pdf) n-gram LM 和 smoothing 的经典处理──
- [Chen and Goodman (1998). An Empirical Study of Smoothing Techniques for Language Modeling](https://dash.harvard.edu/handle/1/25104739) 确立 Kneser-Ney 作为最佳n-gram smoother 的论文──
- [Kneser and Ney (1995). Improved Backing-off for M-gram Language Modeling](https://ieeexplore.ieee.org/document/479394) 原始 KN 论文。
- [KenLM](https://kheafield.com/code/kenlm/) 快速的生产级 n-gram LM,2026年仍用于延迟敏感应用──
