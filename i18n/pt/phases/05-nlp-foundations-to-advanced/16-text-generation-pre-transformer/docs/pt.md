# Transformer 之前的文本生成  N-gram 语言模型

> Se um termo é surpreendente, o modelo é ruim. Perplexidade.

**Type:** Build
**Languages:** Python
**先修要求：**Fase 5 · 01 (文本处理), Fase 2 · 14 (Naive Bayes)
**Time:** ~45 分钟

## 问题

Em Transformer 之前, em RNN 之前, em Embedding 之前,语言模型通过统计一个词跟在前面 `n-1`个词后的频率来预测 下一个词――统计 "o gato" → "sede" 47 vezes, "o gato" → "jumped" 12 vezes, "o gato" → "frigerador" 0 次──归一化后得到一个概率分布──

É o modelo de linguagem n-gram. De 1980 a 2015, cada reconhecedor de voz, cada revisor de escrita, cada sistema de tradução automática baseado em palavras-chave estava usando-o. Quando você precisava de um terminal de linguagem barato para construir, ele ainda está em funcionamento hoje.

A verdadeira questão significativa é como lidar com n-gram não vistos. O modelo baseado em cálculo original dará zero probabilidade a qualquer coisa que não tenha sido vista, o que causará desastres, porque as frases são longas, e quase todas as frases contêm pelo menos uma sequência não vista.

## 概念

![N-gram model: count, smooth, generate](../assets/ngram.svg)

**N-gram probability:** `P(w_i | w_{i-n+1}, ..., w_{i-1})`Fixação`n`(normalmente trigramas usando 3,4 gramas usando 4)

```text
P(w | context) = count(context, w) / count(context)
```

**零计数问题。** qualquer treinamento que não tenha sido realizado em n-gramas, obtém zero probabilidades  Uma pesquisa de 2007 sobre o corpus de Brown descobriu que, mesmo em modelos de 4 gramas, 30% de 4 gramas não foram realizadas em treino   não fizeram suavização, não conseguiram ser avaliadas em nenhum texto real 

**Smoothing 方法，按复杂度递增：**

1. **Laplace (add-one)。**Dá a cada um um um mais, mas é muito mau em casos raros.
2. **Good-Turing。**Baseado na frequência da frequência, redistribuir a qualidade da probabilidade de eventos de alta frequência para eventos não vistos.
3. **Interpolation。**Usada para a avaliação de peso
4. **Backoff。**Se n-gram 计数为零,就回归到 (n-1) -gram。Katz backoff 会对其归归化──
5. **Absolute discounting。**De todas as contas deduzido um desconto fixo .`D`, re-distribuição para eventos não vistos.
6. **Kneser-Ney。**Desconto absoluto 加上一个巧妙的低阶模型选择: usar *probabilidade de continuação*(一个词出现在多少种种背景中), em vez de freqüência original。

Kneser-Ney's洞见很深──"San Francisco"是常见大公布──"San Francisco" 主要出现在"San"之后──朴素的绝对折扣 会给"Francisco" 很高的 unigram 概率(因为计数很高)──Kneser-Ney nota que "Francisco" só aparece num contexto, portanto,相应降低其延续概率──结果:

**评估：perplexity。**Em um conjunto de testes, cada palavra tem um índice de probabilidade média negativa de logar.

```text
perplexity = exp(- (1/N) * Σ log P(w_i | context_i))
```


```figure
ngram-backoff
```


```figure
prediction-game
```

## Construí-lo

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

输入是标记式句子的列表──输出是n-gram 计数和文本 计数──`<s>`和 `</s>`É a linha da fronteira.

### 步骤 2: Laminagem de laplace

```python
def laplace_probability(ngrams, contexts, vocab_size, context, word):
    ctx = tuple(context)
    numerator = ngrams.get(ctx + (word,), 0) + 1
    denominator = contexts.get(ctx, 0) + vocab_size
    return numerator / denominator
```

 dar a cada cálculo mais 1― pode suavizar, mas irá distribuir a quantidade de probabilidade excessiva para eventos invisíveis, também irá prejudicar os eventos raros conhecidos―

### 步骤 3: Kneser-Ney (bigram, interpolado)

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

Três partes de atividade:`continuation_prob`捕捉这个词出现在多少种不同的背景中? (Kneser-Ney 的创新) `lambda_prev`É a qualidade da probabilidade liberada de desconto, usada para dar o back-off + o direito.

### 步骤 4: Usando amostragem

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

概率成比例抽样──每种种子 总会给出不同的输出──对于类似束搜索的输出,在每一步选择 argmax(贪),并加入一个小的随机性旋(温度)──

### 步骤 5: perplexidade

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

越低越好── Para o corpo de Brown, uma boa perplexidade do modelo KN de 4 gramas pode atingir aproximadamente 140── Transformador LM pode atingir 15-30── na mesma série de testes. A diferença é de aproximadamente 10x── é por isso que este campo continua a avançar──

## Use-o

- **经典 NLP 教学。**Você pode obter o que você pode sobre suavidade MLE e perplexidade
- **KenLM。**生产级 n-gram 库──在语音和MT 系统中作为 rescorer 使用,适合低延迟场景──
- **端侧 autocomplete。**O trigrama do teclado é o mesmo.
- **Baselines。**Antes de dizer que o seu LM Neural é muito bom, deve primeiro calcular a perplexidade do LM n-grammas.

## Entrega-o
保存为 `outputs/prompt-lm-baseline.md`- Não .

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

1. **Easy.**Em um corpo de Shakespeare de 1.000 frases, a formação do trigrama LM. gerou 20 frases.
2. **Medium.**Por sua KN 模型 em Shakespeare dividido                                                                                                                                                                                                                                                           
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
- [Jurafsky and Martin — Speech and Language Processing, Chapter 3 (2026 draft)](https://web.stanford.edu/~jurafsky/slp3/3.pdf) n-gram LM 和 suavizamento 的经典处理──
- [Chen and Goodman (1998). An Empirical Study of Smoothing Techniques for Language Modeling](https://dash.harvard.edu/handle/1/25104739) 确立 Kneser-Ney 作为最佳n-gram smoother 的论文──
- [Kneser and Ney (1995). Improved Backing-off for M-gram Language Modeling](https://ieeexplore.ieee.org/document/479394) 原始 KN 论文──
- [KenLM](https://kheafield.com/code/kenlm/) 快速的生产级 n-gram LM,2026年仍用于延迟敏感应用──
