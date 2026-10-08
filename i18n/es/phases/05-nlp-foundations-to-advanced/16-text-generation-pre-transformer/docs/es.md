# Transformer 之前的文本生成  N-gram 语言模型

> Si una palabra es sorprendente, el modelo es malo. La perplejidad, la incidencia de la incidencia, se vuelve numérica.

**Type:** Build
**Languages:** Python
**先修要求：**Fase 5 · 01 (文本处理), Fase 2 · 14 (Naive Bayes)
**Time:** ~45 分钟

##  problemas

En Transformer 之前, en RNN 之前, en Embedding 之前,语言模型通过统计一个词跟在前面 `n-1`个词后的频率来预测 下一个词――统计 "el gato" → "sat" 47 veces, "el gato" → "jumped" 12 veces, "el gato" → "frigerador" 0 veces──归一化后得到一个概率分布──

Este es el n-gram 语言模型── desde 1980 hasta 2015, cada reconocedor de voz, cada revisor de escritura, cada sistema de traducción automática basado en palabras, estaba en uso. Cuando necesitabas un lenguaje barato, todavía funcionaba hoy en día.

El verdadero problema es cómo manejar los n-gramos no vistos. El modelo primitivo basado en la contabilidad distribuirá cero probabilidades de que cualquier cosa no vista sea distribuida, lo que causará un desastre, ya que las oraciones son largas, y casi todas las oraciones contienen al menos una secuencia no vista.

## 概念

![N-gram model: count, smooth, generate](../assets/ngram.svg)

**N-gram probability:** `P(w_i | w_{i-n+1}, ..., w_{i-1})`❖ Fija`n`(normalmente trigrama con 3,4 gramos con 4)

```text
P(w | context) = count(context, w) / count(context)
```

**零计数问题。** Los n-gramos que no se hayan visto en cualquier entrenamiento obtendrán una probabilidad de 0.  Un estudio de 2007 sobre el cuerpo de Brown encontró que incluso en un modelo de 4 gramos, hay un 30% de 4 gramos que no se han mantenido en el entrenamiento                                                                                                                                                                                                                               

**Smoothing 方法，按复杂度递增：**

1. **Laplace (add-one)。**Dá cada cuenta más 1― sencillo, pero en casos raros es muy malo―
2. **Good-Turing。**Basándose en la frecuencia de la frecuencia, redistribuir la calidad de la probabilidad de los eventos de alta frecuencia a los eventos no vistos.
3. **Interpolation。**Usado para la evaluación de la cantidad de gramos.
4. **Backoff。**Si n-gram 计数为零,就返回到 (n-1) -gram──Katz backoff 会对其归归化──
5. **Absolute discounting。**De todos los contactos se deduce un descuento fijo .`D`, re-distribución a los hechos no vistos.
6. **Kneser-Ney。**Discounting absoluto 加上一个巧妙的低阶模型选择: utilizar *probabilidad de continuación*((un palabra aparece en muchos contextos en el medio), en lugar de la frecuencia original。

Kneser-Ney's洞见很深──"San Francisco"是常见的bigram──Unigram "Francisco" 主要出现在"San"之后──朴素的绝对折扣 会给"Francisco" 很高的 unigram 概率(因为计数很高)──Kneser-Ney nota que "Francisco" sólo aparece en un contexto, por lo tanto相应降低其延续概率──结果:

**评估：perplexity。**En el ensayo de ensayos realizado, cada palabra tiene un índice de probabilidad de logro promedio negativo.

```text
perplexity = exp(- (1/N) * Σ log P(w_i | context_i))
```


```figure
ngram-backoff
```


```figure
prediction-game
```

## Construirlo

### Paso 1: Trigrama 计数

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

输入是标记式句子的列表──输出是n-gram 计数和文本 计数──`<s>`Y `</s>`Es el límite de la frase.

### 步骤 2: Limpiación de la zona

```python
def laplace_probability(ngrams, contexts, vocab_size, context, word):
    ctx = tuple(context)
    numerator = ngrams.get(ctx + (word,), 0) + 1
    denominator = contexts.get(ctx, 0) + vocab_size
    return numerator / denominator
```

Damos a cada cuenta más 1― puede suavizar, pero distribuiremos la calidad de la probabilidad excesivamente a los eventos no vistos, también perjudicaremos a los eventos raros conocidos―

### 步骤 3: Kneser-Ney (bigramas, interpolados)

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

Tres partes de la actividad:`continuation_prob`捕捉这个词出现在多少种不同的背景中? (Kneser-Ney 的创新) `lambda_prev`Es la probabilidad de descuento  la calidad de la probabilidad liberada, utilizada para dar el back-off .

### Paso 4: Con muestreo

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

根据概率比例样本――每种种子 总会给出不同的输出――对于类似束搜索的输出,在每一步选择 argmax(贪),并加入一个小的随机性旋(温度)―

### Paso 5: Perplejidad

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

越低越好── Para el cuerpo de Brown, una buena confusión de un modelo KN de 4 gramos puede alcanzar aproximadamente 140── Transformer LM en el mismo ensayo puede alcanzar entre 15 y 30── la diferencia es aproximadamente 10x── es la razón por la cual este campo continúa avanzando──

## Usalo

- **经典 NLP 教学。**Puedes obtener lo que sea sobre el suavización, la MLE y la perplejidad, la entrada más clara.
- **KenLM。**Clasificación de producción n-gramo 库──在语音和MT 系统中作为 rescorer 使用,适合低延迟场景──
- **端侧 autocomplete。**El trigrama en la tecla es el modelo.
- **Baselines。**En la declaración de tu LM Neural  muy bien antes, debes primero calcular la perplejidad de LM n-gramas ⋅ Si tu Transformer  no ha superado KN, entonces hay problemas ⋅

##  entregarlo
保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/prompt-lm-baseline.md`¿Qué es esto ?

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

##  ejercicios

1. **Easy.**En un corpus de Shakespeare de 1.000 frases, el trigrama LM se entraña, generando 20 frases.
2. **Medium.**Por tu KN 模型 en el sostenido Shakespeare dividido                                                                                                                                                                                                                                                         
3. **Hard.**构建一个三重字拼写纠错器:给定一个拼错的词及其背景,生成修正候选,并按 LM 下的背景概率 排序──在 Birkbeck ortografía corpus(公开) 上评估──

## 关键术语: "El hombre es un hombre"
| Term | 人们通常怎么说 | 它实际是什么意思 |
|------|-----------------|-----------------------|
| N-gram | 词序列 | `n` 个连续 Token 的序列。 |
| Smoothing | 避免零 | 重新分配概率质量，使未见事件获得非零概率。 |
| Perplexity | LM 质量指标 | held-out 数据上的 `exp(-average log-prob)`。越低越好。 |
| Backoff | 回退到更短 context | 如果 trigram 计数为零，就使用 bigram。Katz backoff 将其形式化。 |
| Kneser-Ney | n-gram 的最佳 smoothing | Absolute discounting + 低阶模型的 continuation probability。 |
| Continuation probability | KN 专用 | `P(w)` 按 `w` 出现的 context 数量加权，而不是按原始计数加权。 |

## 延伸阅读
- [Jurafsky and Martin — Speech and Language Processing, Chapter 3 (2026 draft)](https://web.stanford.edu/~jurafsky/slp3/3.pdf) n-gram LM 和 suavizamiento de la clásica tratamiento。
- [Chen and Goodman (1998). An Empirical Study of Smoothing Techniques for Language Modeling](https://dash.harvard.edu/handle/1/25104739) 确立 Kneser-Ney 作为最佳n-gram smoother 的论文──
- [Kneser and Ney (1995). Improved Backing-off for M-gram Language Modeling](https://ieeexplore.ieee.org/document/479394) 原始 KN 论文──
- [KenLM](https://kheafield.com/code/kenlm/) 快速的生产级 n-gram LM,2026年仍用于延迟敏感应用──
