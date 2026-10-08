# Transformer 之前的文本生成  N-gram 语言模型

> Si un mot est surprenant, le modèle est mauvais. La perplexité, la surprise, la numérotation.

**Type:** Build
**Languages:** Python
**先修要求：**Phase 5 · 01 (文本处理), phase 2 · 14 (Naive Bayes)
**Time:** ~45 分钟

##  problématique

Dans le cadre de la formation de la langue, les utilisateurs peuvent utiliser des mots comme un mot pour les autres.`n-1`个词后的频率来预测 下一个词――统计 "le chat" → "sat" 47 fois, "le chat" → "sauté" 12 fois, "le chat" → "réfrigérateur" 0次──归一化后得到一个概率分布──

C'est le modèle de langue n-gramme. De 1980 à 2015, chaque reconnaisseur de voix, chaque vérificateur de caractères, chaque système de traduction automatique basé sur des mots, était en service.

Le vrai problème est de savoir comment traiter les n-grammes non vus. Le modèle calculé original distribuera une probabilité de zéro sur tout ce qui n'a pas été vu. Cela provoquera un désastre, car les phrases sont longues, et presque chaque phrase contient au moins une séquence non vue.

## 概念

![N-gram model: count, smooth, generate](../assets/ngram.svg)

**N-gram probability:** `P(w_i | w_{i-n+1}, ..., w_{i-1})`❖ Fixée `n`(habituellement trigramme avec 3,4 grammes avec 4)

```text
P(w | context) = count(context, w) / count(context)
```

**零计数问题。**Une étude de 2007 sur le corpus brown a révélé que même un modèle de 4 grammes, 30% des 4 grammes non observés n'étaient pas observés dans l'entraînement.

**Smoothing 方法，按复杂度递增：**

1. **Laplace (add-one)。**Je ne peux pas le faire.
2. **Good-Turing。**Basé sur la fréquence de fréquence, redistribuer la qualité de la probabilité des événements à forte fréquence aux événements invisibles.
3. **Interpolation。**Il est possible de modifier le poids de la masse de l'échantillon.
4. **Backoff。**Si n-gramme 计数为零,就返回到 (n-1) -gram.
5. **Absolute discounting。**D'après tous les comptes, une réduction fixe est déduite.`D`, réaffecté à l'événement inédit.
6. **Kneser-Ney。**Le discount absolu 加上一个巧妙的低阶模型选择: utiliser *continuation probability*(一个词出现多少种种背景中), plutôt que le temps de fréquence originale。

Kneser-Ney's洞见很深──"San Francisco" is常见 bigram──Unigram "Francisco" 主要出现在"San" 后──朴素的绝对折扣 会给"Francisco" 很高的 unigram 概率(因为计数很高)──Kneser-Ney note que "Francisco" ne se produit que dans un contexte, de sorte que la probabilité de sa continuation est donc réduite──结果:

**评估：perplexity。**Dans le ensemble de tests, chaque mot est un indicateur de probabilité de logement moyen négatif.

```text
perplexity = exp(- (1/N) * Σ log P(w_i | context_i))
```


```figure
ngram-backoff
```


```figure
prediction-game
```

## - Je le construis.

### 步骤 1: compte des trigrammes

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

输入是标记式句子的列表──输出是 n-gramme 计数和文本 计数──`<s>`et `</s>`C'est le bord de la ligne.

### 步骤 2: Légalisation de la place

```python
def laplace_probability(ngrams, contexts, vocab_size, context, word):
    ctx = tuple(context)
    numerator = ngrams.get(ctx + (word,), 0) + 1
    denominator = contexts.get(ctx, 0) + vocab_size
    return numerator / denominator
```

≈ 1 ≈ 1 ≈ 1 ≈ 1 ≈ 1 ≈ 1 ≈ 1 ≈ 1 ≈ 1 ≈ 1 ≈ 1 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 ≈ 2 + 2 + 2 + 2 + 2 + 2 + 2 + 2 + 2 + 2 + 2 + 2 + 2 + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +

### 步骤 3: Kneser-Ney (bigramme, interpolé)

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

Trois activités`continuation_prob`Le mot apparaît dans plusieurs contextes différents.`lambda_prev`La probabilité de la réduction est la quantité de probabilité libérée, utilisée pour donner le back-off plus de droits.

### 步骤 4: Utilisation de l'échantillonnage

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

概率 pourcentage échantillonnage。 chaque graine 总会给出不同的输出── Pour une sortie similaire à la recherche de faisceaux, dans chaque étape choisir argmax(avarice),并加入一个小的随机性旋(温度)──

### 步骤 5: La perplexité

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

Pour le corps brun, une bonne complexité de 4 grammes de KN peut atteindre 140°C. Le LM transformateur peut atteindre 15 à 30°C. La différence est d'environ 10°C. C'est la raison pour laquelle ce domaine continue de progresser.

## Utilisez-le

- **经典 NLP 教学。**Vous pouvez obtenir ce que vous pouvez sur le smoothing, MLE et la perplexité, la meilleure façon de comprendre.
- **KenLM。**Classe de production n-gramme 库── dans le système de langage et de communication numérique en tant que réscorer Utilisation, adapté à la situation de retard de rendement.
- **端侧 autocomplete。**Le trigramme de la clé est toujours le même.
- **Baselines。**Avant de décider de votre LM neural, il faut d'abord calculer la perplexité de votre LM n-grammes.

## Je le livre.
保存为 `outputs/prompt-lm-baseline.md`- Le numéro de la liste:

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

1. **Easy.**Dans un corpus de Shakespeare de 1000 phrases, il est possible de former un trigramme LM. Il en résulte 20 phrases.
2. **Medium.**Pour votre connaissance, le schéma de Shakespeare est déchiré et la confusion est réduite de 30 à 50%.
3. **Hard.**构建一个三重文字拼写纠错器:给定一个拼错的词及其背景,生成修正候选,并按 LM 下的背景概率 排序──在 Birkbeck orthographies corpus(公开) 上评估──

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
- [Jurafsky and Martin — Speech and Language Processing, Chapter 3 (2026 draft)](https://web.stanford.edu/~jurafsky/slp3/3.pdf) n-gramme de LM 和 lissage de traitement classique
- [Chen and Goodman (1998). An Empirical Study of Smoothing Techniques for Language Modeling](https://dash.harvard.edu/handle/1/25104739) 确立 Kneser-Ney 作为最佳 n-gramme plus lisse 的论文──
- [Kneser and Ney (1995). Improved Backing-off for M-gram Language Modeling](https://ieeexplore.ieee.org/document/479394) 原始 KN 论文。
- [KenLM](https://kheafield.com/code/kenlm/) 快速的生产级 n-gram LM,2026年仍用于延迟敏感应用──
