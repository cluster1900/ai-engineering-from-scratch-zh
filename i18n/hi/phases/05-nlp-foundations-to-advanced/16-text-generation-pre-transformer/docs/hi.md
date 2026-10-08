# ट्रांसफार्मर 之前的文本生成  N-gram 语言模型

> यदि एक शब्द अप्रत्याशित है, तो मॉडल न अच्छा है।

**Type:** Build
**Languages:** Python
**先修要求：**चरण 5 · 01 (文本处理), चरण 2 · 14 (नएव बेय)
**Time:** ~45 分钟

## 问题

之前,之前 RNN 之前,之前 शब्द एम्बेडिंग 之前,语言模型通过统计一个词跟在前面 `n-1`个词后的频率来预测下一个词――统计 "ती मां" → "बैठा" 47 बार,"ती मां" → "उड़ गई" 12 बार,"ती मां" → "शीतौल" 0 बार──归一化后得到一个概率分布──

यह है n-gram भाषा मॉडल। 1980 से 2015 तक, प्रत्येक भाषा पहचानकर्ता, प्रत्येक शब्द लिखने की जांचकर्ता, प्रत्येक लघुवचन आधारित मशीन अनुवाद प्रणाली इसका उपयोग करती थी। जब आपको सस्ती भाषा निर्माण की आवश्यकता होती थी, तो यह आज भी काम कर रही है।

वास्तविक सार्थक प्रश्न यह है कि अप्रत्याशित n-ग्राम को कैसे संभालें। मूल गणना आधारित मॉडल किसी भी अप्रत्याशित चीज़ को शून्य संभावना देता है, जिससे आपदा होती है, क्योंकि वाक्य लंबे होते हैं, जबकि लगभग प्रत्येक दीर्घ वाक्य में कम से कम एक अप्रत्याशित अनुक्रम होता है।

## 概念

![N-gram model: count, smooth, generate](../assets/ngram.svg)

**N-gram probability:** `P(w_i | w_{i-n+1}, ..., w_{i-1})` तय `n`(आमतौर पर त्रिकोण प्रयोग 3,4-ग्राम प्रयोग 4)

```text
P(w | context) = count(context, w) / count(context)
```

**零计数问题。** किसी भी प्रशिक्षण में न देखे गए n-gram को शून्य संभावना प्राप्त होती है ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

**Smoothing 方法，按复杂度递增：**

1. **Laplace (add-one)。** प्रत्येक गणना को 1  सरल, लेकिन दुर्लभ घटनाओं पर बहुत बुरा 
2. **Good-Turing。** आवृत्ति की आवृत्ति के आधार पर, उच्च आवृत्ति घटनाओं से अप्रत्याशित घटनाओं में संभावना की गुणवत्ता को पुनः वितरित करें
3. **Interpolation。**उपयोग कर सकते हैं n-gram, n-1)-gram 等估计──
4. **Backoff。**यदि n-ग्राम 计数为零,就返回到 (n-1)-ग्राम――Katz backoff 会对其归化――
5. **Absolute discounting。**सभी खातों से एक निश्चित छूट घटाई जाए`D`, पुनः अप्रत्याशित घटनाओं को पुनः वितरित किया गया।
6. **Kneser-Ney。**पूर्ण छूट 加上一个巧妙的低阶模型选择:使用 *继续概率*(一个词出现现在多少种种背景中),而不是原始频率──

Kneser-Ney का洞见很深──"सैन फ्रांसिस्को"是常见大公布──"सैन फ्रांसिस्को" 主要出现在"San"之后──朴素的绝对折扣 会给"فرانسिसको" 很高的 unigram 概率(因为计数很高)──Kneser-Ney नोटिस "فرانسिसको" केवल एक संदर्भ में दिखाई देता है, इसलिए相应降低它的延续概率──结果:

**评估：perplexity。**测试集 में, प्रत्येक शब्द औसत नकारात्मक लॉग-संभाव्यता का सूचक──越低越好── गुंतागुंती के कारण 100 个词中均随机选择──

```text
perplexity = exp(- (1/N) * Σ log P(w_i | context_i))
```


```figure
ngram-backoff
```


```figure
prediction-game
```

##  इसे निर्माण

### 步骤 1: त्रिकोण 计数

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

输入是 टोकनयुक्त वाक्य की सूची──输出是 n-gram 计数和文本 计数──`<s>`和 `</s>`                                                                                                                                                                                                                                                              

### 步骤 2: लैप्लेस चिकनाई

```python
def laplace_probability(ngrams, contexts, vocab_size, context, word):
    ctx = tuple(context)
    numerator = ngrams.get(ctx + (word,), 0) + 1
    denominator = contexts.get(ctx, 0) + vocab_size
    return numerator / denominator
```

 प्रत्येक गणना को 1  जोड़ना ️ हो सकता है, लेकिन अत्यधिक संभावनाओं की मात्रा को अप्रत्याशित घटनाओं को वितरित करेगा, तथा ज्ञात दुर्लभ घटनाओं को भी नुकसान पहुंचाएगा

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

तीन गतिविधि भागों`continuation_prob`捕捉这个词现在有多少种不同的背景中?(Kneser-Ney 的创新) `lambda_prev`                                                                                                                                                                                                                                                              

### 步骤 4: नमूनाकरण का उपयोग करें 生成文本

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

概率 अनुपात नमूनाकरण── प्रत्येक बीज 总会给出不同的输出──类似束搜索的输出,在每一步选择 argmax(贪),并加入一个小的随机性旋(温度)──

### 步骤 5: भ्रम

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

越低越好── ब्राउन कॉर्पस के लिए, एक अच्छी तरह से समायोजित 4-ग्राम केएन मॉडल की जटिलता लगभग 140 तक पहुंच सकती है── ट्रांसफार्मर एलएम एक ही परीक्षण सेट पर 15-30 तक पहुंच सकती है── अंतर लगभग 10 गुना है── यही कारण है कि इस क्षेत्र में प्रगति जारी है──

## इसका उपयोग करें

- **经典 NLP 教学。**आप मिल सकता है के बारे में चिकनाई, एमएलई और उलझन के बारे में सबसे स्पष्ट प्रवेश द्वार.
- **KenLM。**生产级 n-gram 库──在语音和MT 系统中作为 rescorer 使用,适合低延迟场景──
- **端侧 autocomplete。**键盘中的 त्रिकोण 模型──仍然如此──
- **Baselines。**जब तक आप अपने तंत्रिका LM  बहुत अच्छा है, निश्चित रूप से पहले n-ग्राम LM भ्रम गणना करें.

## 交付 यह
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

## अभ्यास

1. **Easy.**एक 1,000 वाक्य के शेक्सपियर कॉर्पस में ऊपर प्रशिक्षण त्रिकोण LM── उत्पन्न 20 वाक्य── वे स्थानिक रूप से समझदार लगेंगे, लेकिन समग्र रूप से असंबंधित── यह क्लासिक प्रदर्शन है──
2. **Medium.**अपने लिए एक सापेक्षता के लिए एक सापेक्षता को प्राप्त करने के लिए एक सापेक्षता को प्राप्त करें।
3. **Hard.**构建一个三重文字 拼写纠错器:给定一个拼错的词及其背景,生成修正候选,并按 LM 下的背景概率 排序──在伯克贝克拼写体公开) 上评估──

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
- [Jurafsky and Martin — Speech and Language Processing, Chapter 3 (2026 draft)](https://web.stanford.edu/~jurafsky/slp3/3.pdf) n-ग्राम LM 和 चिकनाई का क्लासिक प्रसंस्करण
- [Chen and Goodman (1998). An Empirical Study of Smoothing Techniques for Language Modeling](https://dash.harvard.edu/handle/1/25104739) 确立 Kneser-Ney 作为最佳 n-ग्राम चिकनी 的论文──
- [Kneser and Ney (1995). Improved Backing-off for M-gram Language Modeling](https://ieeexplore.ieee.org/document/479394) 原始 KN 论文──
- [KenLM](https://kheafield.com/code/kenlm/) 快速的生产级 n-gram LM,2026 साल में अभी भी देरी से संवेदनशील अनुप्रयोगों में उपयोग किया जाता है
