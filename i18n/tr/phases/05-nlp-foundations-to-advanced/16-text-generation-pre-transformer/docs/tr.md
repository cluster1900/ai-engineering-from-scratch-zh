# Transformer 之前的文本生成  N-gram 语言模型

> Eğer bir kelime şaşırtıcı ise model çok kötü olacaktır.

**Type:** Build
**Languages:** Python
**先修要求：**5 · 01 aşama (文本处理), 2 · 14 aşama (Naive Bayes)
**Time:** ~45 分钟

## 问题

之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,之前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前,以前;;;;;; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye; ye;`n-1`个词后的频率来预测 下一个词――统计 " kedi " → " otur " 47 kez, " kedi " → " atladı " 12 kez, " kedi " → " buzdolabı " 0 次──归一化后得到一个概率分布──

İşte n-gram 言語模型── 1980'den 2015'e kadar, her ses tanıtımcısı, her yazım denetçisi, her kısayol tabanlı Makine Tercüme sistemi kullanıyordu── ucuz bir dil oluşturma sistemine ihtiyaç duyduğunda bugün hala çalışmaktadır──

Gerçek anlamlı bir soru, görülmemiş n-gramları nasıl ele alacağıdır. İlk sayısal tabanlı modellerin görülmemiş olan her şeyi sıfır olasılıkla paylaşacağıdır. Bu da felaketlere yol açar, çünkü cümleler uzundur, neredeyse her cümle en az bir görülmemiş bir sırada bulunur.

## 概念

![N-gram model: count, smooth, generate](../assets/ngram.svg)

**N-gram probability:** `P(w_i | w_{i-n+1}, ..., w_{i-1})`❖ Düzeltme`n`(genellikle 3,4 gram kullanılır 4)

```text
P(w | context) = count(context, w) / count(context)
```

**零计数问题。**任何训练中没有见过的n-gram 没有见过的 n-gram 没有见过的 n-gram 没有见过的 n-gram 没有见过的 n-gram 没有见过的 n-gram 没有见过的 n-gram 没有见过的 n-gram 没有见过的 n-gram 没有见过的 n-gram 没有见过的 n-gram 没有见过的 n-gram 没有见过的 n-gram 没有见过的 n-gram 没有见过的 n-gram 没有见过的 n-gram 没有见过的 n-gram 没有见过的 n-gram 没有见过的 n-gram 没有见过的 n-gram 没有见过的 n-gram 没有见过的 n-gram 没有过的 n-gram 没有过的 n-graden 没有过的 n-graden 没有过的 n-graden 没有过的 n-graden 没有了 没有过的 n-graden 没有了 没有了 没有了 没有了 没有了 没有了 没有了 没有了 没有了 没有了 没有了 没有了 没有了 没有了 没有了 没有了 没有了 没有了 没有 没有 没有 没有 没有 没有 没有 没有 没有 没有 没有 没有 没有 没有 没有 没有 没有 没有 没有 没有 没有 没有 没有 没有 没有 没有 没有 没有 没有 没有 了 了 没有 了 了 没有 没有 没有 没有 了 了 了 没有 没有 了 没有 没有 了 了 了 了 了

**Smoothing 方法，按复杂度递增：**

1. **Laplace (add-one)。**Her sayıya bir ekle. Ama nadir olaylarda çok kötü.
2. **Good-Turing。**                                                                                                                                                                                                                                                              
3. **Interpolation。**N-gram  n-1) -gram  等估计──
4. **Backoff。**Eğer n-gram 计数为零 ise, (n-1) -gram'a geri döneriz.
5. **Absolute discounting。**Tüm hesaplardan bir sabit indirim çıkar .`D`, yeniden görülmemiş olaylara yeniden dağıtıldı.
6. **Kneser-Ney。**Mutlak indirim 加上一个巧妙的低阶模型选择:使用 *继续概率*(一个词出现多少种种背景中),而不是原始频率──

Kneser-Ney'in洞见很深──"San Francisco" is常见 bigram──"San Francisco" 主要出现在"San" 之后──朴素的绝对折扣 会给"Francisco" 很高的 unigram 概率(因为计数很高)──Kneser-Ney "Francisco" nın yalnızca bir bağlamda ortaya çıktığını, bu nedenle de devam etmesinin olasılıklarını azaltır.

**评估：perplexity。**Bu testler üzerinde her kelime ortalama negatif log- olasılık göstergesi vardır.

```text
perplexity = exp(- (1/N) * Σ log P(w_i | context_i))
```


```figure
ngram-backoff
```


```figure
prediction-game
```

## Yapın onu.

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

输入是标记式句的列表──输出是 n-gram 计数和文本 计数──`<s>`和 `</s>`Bu bir sınır.

### 步骤 2: Laplace düzeltme

```python
def laplace_probability(ngrams, contexts, vocab_size, context, word):
    ctx = tuple(context)
    numerator = ngrams.get(ctx + (word,), 0) + 1
    denominator = contexts.get(ctx, 0) + vocab_size
    return numerator / denominator
```

Her sayı 1 ekle. Yeterince iyileşebilir. Ama çok fazla olasılık miktarını görülmemiş olaylara dağıtacak.

### 步骤 3: Kneser-Ney(bigram,interpolated)

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

Üç etkinlik parçası.`continuation_prob`捕捉这个词现在有多少种不同的背景中?`lambda_prev`Bu, bir gerileme hakkı için kullanılan bir indirim  serbest bırakılan olasılık kalitesi.

### 4 adım: Örnekleme kullanın

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

概率 oranında örnekleme. Her tohum her zaman farklı bir çıkış verir.

### 5 adım: Kafası karışıklık

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

越低越好── Brown korpus için, iyi düzenlenen 4 gram KN  model karmaşıklığı yaklaşık 140'a ulaşabilir── Transformer LM aynı test kitlesinde 15-30'a ulaşabilir── fark yaklaşık 10x── bu da bu alanın ilerlemesinin nedeni──

## Kullan

- **经典 NLP 教学。**Sen de en iyi şekilde görebilirsin.
- **KenLM。**生产级 n-gram 库──在语音和MT 系统中作为 rescorer 使用,适合低延迟场景──
- **端侧 autocomplete。**Kişilik üzerinde bir trigram var.
- **Baselines。**Neural LM'nin çok iyi olduğunu söyleyen bir kişi önce n gram LM karmaşıklığını hesaplamalıdır. Eğer Transformer'ın KN'yi çok fazla yenmediyse, sorun vardır.

## - Söyle.
保存为 `outputs/prompt-lm-baseline.md`- ...

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

1. **Easy.**1000 cümlelik Shakespeare'in bir korpusunda LM üçlügeyi eğitmek için 20 cümle üretmek için kullanılır.
2. **Medium.**Bu yüzden, senin için bir karmaşıklık yaratmak için, Shakespeare'in uzun süren bölünmesi için, karmaşıklığı azaltmak için, Laplace ile karşılaştırıldığında, karmaşıklığı %30-50 oranında azaltmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir karmaşıklık yaratmak için, bir düzenlenmek için, bir düzenlenmek için, bir düzenlen.
3. **Hard.**构建一个三重形拼写纠错器:给定一个拼错的词及其背景,生成修正候选,并按 LM 下的背景概率 排序──在 Birkbeck ortalı korpusında(公开) 上评估──

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
- [Chen and Goodman (1998). An Empirical Study of Smoothing Techniques for Language Modeling](https://dash.harvard.edu/handle/1/25104739) 确立 Kneser-Ney 作为最佳 n-gram smoother 的论文──
- [Kneser and Ney (1995). Improved Backing-off for M-gram Language Modeling](https://ieeexplore.ieee.org/document/479394) 原始 KN 论文。
- [KenLM](https://kheafield.com/code/kenlm/) 快速的生产级 n-gram LM,2026 yıl hâlâ geçiş hassas uygulamalarda kullanılıyor.
