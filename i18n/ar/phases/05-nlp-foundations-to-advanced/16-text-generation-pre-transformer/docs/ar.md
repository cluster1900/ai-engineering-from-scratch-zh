# Transformer 之前的文本生成  N-gram 语言模型

> إذا كان كلمة مفاجئة، فإن النموذج لا يُحسن. تعجّب. تحويل مدى الفجوة إلى رقم.

**Type:** Build
**Languages:** Python
**先修要求：**المرحلة 5 · 01 (文本处理) ، المرحلة 2 · 14 (Naive Bayes)
**Time:** ~45 分钟

## 问题

في ترانسفارمر  قبل، في RNN  قبل، في كلمة إدمج  قبل، لغوي نموذج من خلال统计一个词跟在前面 `n-1`个词后的频率来预测 下一个词――统计 " القط " → "جلس " 47 مرة، " القط " → " قفز " 12 مرة، " القط " → " الثلاجة " 0 次──归一化后得到一个概率分布──

هذا هو نموذج اللغة n-gram. من عام 1980 إلى عام 2015، كل جهاز تعريف الصوت، كل جهاز فحص النص، كل نظام ترجمة آلية قائم على القصص كان يستخدمها.

السؤال الحقيقي هو كيفية التعامل مع غير المرئي n-غرام. النموذج الأصلي المستند إلى الحسابات سوف توزع احتمالات صفر لأي شيء غير المرئي، وهذا سيؤدي إلى كارثة، لأن العبارات طويلة جدا، وكل عبارات طويلة تقريبا تحتوي على على على حد سواء سلسلة غير المرئية.

## 概念

![N-gram model: count, smooth, generate](../assets/ngram.svg)

**N-gram probability:** `P(w_i | w_{i-n+1}, ..., w_{i-1})` ثابتة`n`(عادةً تكرار باستخدام 3,4 جرام باستخدام 4)

```text
P(w | context) = count(context, w) / count(context)
```

**零计数问题。**任何 تدريب لم يظهر n-grams في المدينة الحصول على صفر احتمالات ∙ 2007 دراسة حول براون كوربوس وجدت، حتى في 4 غرام 模型، هناك 30% من الاحتفاظ 4 غرام في التدريب لم يظهر ∙ لا تفعل تسريحة، لا يمكن تقييمها في أي من المواد الحقيقية ∙

**Smoothing 方法，按复杂度递增：**

1. **Laplace (add-one)。**إضافة 1 لكل واحد، ولكن في الحوادث النادرة سيئة
2. **Good-Turing。**基于频率的频率,把概率质量从高频事件重新分配到未见事件──
3. **Interpolation。**تستخدم تعديل الوزن
4. **Backoff。**إذا كان عدد n-gram ≠ 0،就回退到 (n-1) -gram。 كاتز بيكوف 会对其归归化。
5. **Absolute discounting。**من كل الحسابات تخفيض خصم ثابت`D`, إعادة توزيعها على الأحداث غير المرئية
6. **Kneser-Ney。**تخفيض مطلق 加上一个巧妙的低阶模型选择: استخدام *احتمال استمرار*(一个词出现在多少种种背景中),而不是原始频率──

إنّ "سان فرانسيسكو" هي "بيغرام" عاديّة. يظهر "سان" بعدها. يظهر "سان فرانسيسكو" بعد ذلك. يظهر "سان فرانسيسكو" بعد ذلك. يظهر "سان فرانسيسكو" بعد ذلك. يظهر "سان فرانسيسكو" بعد ذلك. يظهر "سان فرانسيسكو" بعد ذلك.

**评估：perplexity。**في مجموعات الاختبارات المُتَمَرَّدة، كل كلمة تتسم بمعدل احتمالات التخفيف المتوسط.

```text
perplexity = exp(- (1/N) * Σ log P(w_i | context_i))
```


```figure
ngram-backoff
```


```figure
prediction-game
```

## بناءها

### الخطوة 1: تكرار 计数

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

输入是标记式句子的列表──输出是 n-gram 计数和文本 计数──`<s>`和 `</s>`"إنها الحدود"

### 步骤 2: تسطيح اللبليس

```python
def laplace_probability(ngrams, contexts, vocab_size, context, word):
    ctx = tuple(context)
    numerator = ngrams.get(ctx + (word,), 0) + 1
    denominator = contexts.get(ctx, 0) + vocab_size
    return numerator / denominator
```

إعطاء كل حساب إضافة 1، يمكن أن تسطيع، ولكن سوف تتميز المرجحات المفرطة النوعية إلى الأحداث غير المرئية، ويمكن أيضا أن تؤذي الحوادث النادرة المعروفة.

### 步骤 3: كنيسر-ني ((بيغرام، متقاطع)

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

ثلاثة عناصر فعالية`continuation_prob`捕捉这个词出现在多少种不同的背景中?`lambda_prev`هو خصم 释放的概率质量,用于给backkoff加权.

### الخطوة الرابعة: استخدام العينات

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

根据概率比例样本化――每个种子 总会给出不同的输出――对于类似光束搜索的输出,在每一步选择 argmax(贪),并加入一个小的随机性旋(温度)。

### الخطوة 5: الارتباك

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

越低越好── بالنسبة لـ Brown corpus، فإن معقدة نموذج KN جيدة من 4 غرامات قد تصل إلى 140‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

## استخدمها

- **经典 NLP 教学。**يمكنك الحصول على ما يتعلق بالهدوء والتحيرات
- **KenLM。**生产级 n-gram 库──在语音和MT 系统中作为回得器 使用,适合低延迟场景──
- **端侧 autocomplete。**مثلث في المفتاح 模型──仍然如此──
- **Baselines。**قبل أن يُعلن عن تعقيداتك العصبية، يجب أن تحسب أولاً تعقيداتك العصبية.

## 交付 it
保存为 `outputs/prompt-lm-baseline.md`:

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

## التدريب

1. **Easy.**في جسم شكسبير الذي يضم 1000 جملة، يُدرّب التجربة التجريبية لـ LM.
2. **Medium.**لـ (كـنـتـكـ) في (شكسبير) المـزقـة المـمـزقـة لـ (كـنـتـكـ) في (كـنـتـكـ) في (شيكسبير) المـزقـة المـزقـة لـ (لـ (لابـلاـس)
3. **Hard.**构建一个三重形 拼写纠错器:给定一个拼错的词及其背景,生成修正候选,并按 LM 下的背景概率 排序──在伯克贝克拼写 corpus(公开) 上评估──

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
- [Jurafsky and Martin — Speech and Language Processing, Chapter 3 (2026 draft)](https://web.stanford.edu/~jurafsky/slp3/3.pdf) n-gram LM 和 سلمة
- [Chen and Goodman (1998). An Empirical Study of Smoothing Techniques for Language Modeling](https://dash.harvard.edu/handle/1/25104739) 确立 كنيسر-ني 作为最佳 n-gram smoother 的论文──
- [Kneser and Ney (1995). Improved Backing-off for M-gram Language Modeling](https://ieeexplore.ieee.org/document/479394) 原始 KN 论文。
- [KenLM](https://kheafield.com/code/kenlm/) 快速的生产级 n-gram LM,2026 年 لا يزال يستخدم في التطبيقات المُتأخرة
