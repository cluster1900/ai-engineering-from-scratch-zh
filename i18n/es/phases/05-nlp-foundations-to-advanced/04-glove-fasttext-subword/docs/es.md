# GloVe、FastText y los subpalabres

> Word2Vec 为每个词训练一个嵌入──GloVe对共现矩阵做因子化──FastText Embedding 词的组成片段──BPE 连接到了变体──

**类型:**Construir
**语言:**Python
**先修要求:**Fase 5 · 03 (Word2Vec desde cero)
**时间:**- 45 minutos

##  problemas

Word2Vec deja dos preguntas abiertas.

Primero, también hay una línea de investigación que se basa directamente en la factorización de la matriz común existente (LSA ≠ HAL), en lugar de hacer saltos en línea 更新。¿Es el método de generación de Word2Vec fundamentalmente mejor, o esta diferencia es sólo una manifestación de dos métodos de procesamiento de la cuota?**GloVe** Respondió a esta pregunta: 配合精心选择的 Loss, Matrix factorization puede ser compatible incluso más allá de Word2Vec, y el costo de entrenamiento es más bajo

Segundo, ambos métodos no han tratado el esquema de palabras nunca antes vistas.`Zoomer-approved`¿Qué es esto?`dogecoin`、上周刚被创造的任何专名词、罕见词根的每种折曲形式──**FastText**通过嵌入字符n-grams 解决了这个问题:一个词是其组成部分的总和, incluidos los morfemas, por lo que incluso fuera del vocabulario 词也能得到合理的矢量──

En tercer lugar, cuando los transformadores aparecen, el problema cambia de nuevo.**Byte-pair encoding (BPE)** y sus métodos relacionados mediante el aprendizaje de todas las unidades de palabras de alta frecuencia  solucionó este problema ⋅ cada moderno de LLM cada moderno Tokenizer son los Tokenizer ⋅

Esta clase explicará a continuación a estos tres, y luego explicará cuándo elegir cual.

## 概念

**GloVe (Global Vectors)。**构建词-词共现 Matrix `X`, entre ellos `X[i][j]`Quiero decir`j`Aparecen en el mundo`i`上下文中的频率──训练 Vector, hacer `v_i · v_j + b_i + b_j ≈ log(X[i][j])`◊ sobre Pérdida + derecho, evitar高频词对占据主导──完成──

**FastText。**Un palabra es su carácter n-gramos, además de la palabra en sí misma.`where`变成 `<wh, whe, her, ere, re>, <where>`▽词 Vector 是这些组成的词 Vector 的总和──按 Word2Vec的方式训练──好处:未见过的词(`whereupon`) puede ser producido por n-gramos ya conocidos 组合出来──

**BPE (Byte-Pair Encoding)。**Desde el vocabulario de un solo byte (或字符) 开始──统计 corpus 中每个相邻对──把最高频的对合并成新代币──重复`k`Siguiente: Resultado: obtener una contiene`k + 256`个 Token 的词汇库,其中高频序列(`ing`¿Qué es esto?`tion`¿Qué es esto?`the`) es un solo token, rara palabra será desmontada en fragmentos maduros. Cada frase puede ser tokenizada en algún tipo de forma.


```figure
n5-subword-merge
```

## Construcción

### GloVe:factorize 共现 Matrix

```python
import numpy as np
from collections import Counter


def build_cooccurrence(docs, window=5):
    pair_counts = Counter()
    vocab = {}
    for doc in docs:
        for token in doc:
            if token not in vocab:
                vocab[token] = len(vocab)
    for doc in docs:
        indexed = [vocab[t] for t in doc]
        for i, center in enumerate(indexed):
            for j in range(max(0, i - window), min(len(indexed), i + window + 1)):
                if i != j:
                    distance = abs(i - j)
                    pair_counts[(center, indexed[j])] += 1.0 / distance
    return vocab, pair_counts


def glove_train(vocab, pair_counts, dim=16, epochs=100, lr=0.05, x_max=100, alpha=0.75, seed=0):
    n = len(vocab)
    rng = np.random.default_rng(seed)
    W = rng.normal(0, 0.1, size=(n, dim))
    W_tilde = rng.normal(0, 0.1, size=(n, dim))
    b = np.zeros(n)
    b_tilde = np.zeros(n)

    for epoch in range(epochs):
        for (i, j), x_ij in pair_counts.items():
            weight = (x_ij / x_max) ** alpha if x_ij < x_max else 1.0
            diff = W[i] @ W_tilde[j] + b[i] + b_tilde[j] - np.log(x_ij)
            coef = weight * diff

            grad_W_i = coef * W_tilde[j]
            grad_W_tilde_j = coef * W[i]
            W[i] -= lr * grad_W_i
            W_tilde[j] -= lr * grad_W_tilde_j
            b[i] -= lr * coef
            b_tilde[j] -= lr * coef

    return W + W_tilde
```

Hay dos elementos de actividad de valor.`f(x) = (x/x_max)^alpha`会降低非常高频词对(比如 `(the, and)`La pérdida de peso de los animales, la pérdida de peso de los animales y la pérdida de peso de los animales.`W`(centro) y `W_tilde`(contexto) Dos ejemplos de trabajo en conjunto.

### FastText:Inmigraciones conscientes de las palabras

```python
def char_ngrams(word, n_min=3, n_max=6):
    wrapped = f"<{word}>"
    grams = {wrapped}
    for n in range(n_min, n_max + 1):
        for i in range(len(wrapped) - n + 1):
            grams.add(wrapped[i:i + n])
    return grams
```

```python
>>> char_ngrams("where")
{'<where>', '<wh', 'whe', 'her', 'ere', 're>', '<whe', 'wher', 'here', 'ere>', '<wher', 'where', 'here>'}
```

Cada palabra es representada por sus n-gramas 集合 (normalmente 3 a 6 caracteres) ⋅词 Embedding es el total de sus n-gram Embeddings. Para el entrenamiento de skip-gram, se puede llevar a Word2Vec.

```python
def fasttext_vector(word, ngram_table):
    grams = char_ngrams(word)
    vecs = [ngram_table[g] for g in grams if g in ngram_table]
    if not vecs:
        return None
    return np.sum(vecs, axis=0)
```

Para palabras que no se han visto, siempre y cuando se conozcan algunos n-gramos, todavía puedes obtener un vector.`whereupon`Con`where`Compartir`<wh`¿Qué es esto?`her`¿Qué es esto?`ere`Y `<where`Así que ambos se quedarán en una posición cercana.

### BPE: aprender el vocabulario de las palabras

```python
def learn_bpe(corpus, k_merges):
    vocab = Counter()
    for word, freq in corpus.items():
        tokens = tuple(word) + ("</w>",)
        vocab[tokens] = freq

    merges = []
    for _ in range(k_merges):
        pair_freq = Counter()
        for tokens, freq in vocab.items():
            for a, b in zip(tokens, tokens[1:]):
                pair_freq[(a, b)] += freq
        if not pair_freq:
            break
        best = pair_freq.most_common(1)[0][0]
        merges.append(best)

        new_vocab = Counter()
        for tokens, freq in vocab.items():
            new_tokens = []
            i = 0
            while i < len(tokens):
                if i + 1 < len(tokens) and (tokens[i], tokens[i + 1]) == best:
                    new_tokens.append(tokens[i] + tokens[i + 1])
                    i += 2
                else:
                    new_tokens.append(tokens[i])
                    i += 1
            new_vocab[tuple(new_tokens)] = freq
        vocab = new_vocab
    return merges


def apply_bpe(word, merges):
    tokens = list(word) + ["</w>"]
    for a, b in merges:
        new_tokens = []
        i = 0
        while i < len(tokens):
            if i + 1 < len(tokens) and tokens[i] == a and tokens[i + 1] == b:
                new_tokens.append(a + b)
                i += 2
            else:
                new_tokens.append(tokens[i])
                i += 1
        tokens = new_tokens
    return tokens
```

```python
>>> corpus = Counter({"low": 5, "lower": 2, "newest": 6, "widest": 3})
>>> merges = learn_bpe(corpus, k_merges=10)
>>> apply_bpe("lowest", merges)
['low', 'est</w>']
```

La primera vez que se reúne el par más común de vecinos.`low`¿Qué es esto?`est`¿Qué es esto?`tion`) se convertirá en un solo Token, rara palabra se desmonta de forma

Los tokenizadores reales de GPT / BERT / T5 会学习 30k-100k 个合并──结果是: cualquier texto que pueda ser tokenizado, con un segmento de IDs conocidos de longitud limitada, nunca habrá OOV──

## Uso

En la práctica, tú poco entrenas estas cosas.

```python
import fasttext.util
fasttext.util.download_model("en", if_exists="ignore")
ft = fasttext.load_model("cc.en.300.bin")
print(ft.get_word_vector("whereupon").shape)
print(ft.get_word_vector("zoomerapproved").shape)
```

En el transformer 时代 usando BPE 风格 de la tokenización de las palabras:

```python
from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained("gpt2")
print(tok.tokenize("unbelievably tokenized"))
```

```
['un', 'bel', 'iev', 'ably', 'Ġtoken', 'ized']
```

`Ġ`Antes de la fecha de publicación de la publicación de la publicación de la revista, el nombre de los Tokenizer es el nombre de los Tokenizer de la revista.

### ¿Cuándo elegir qué?

| 情况 | 选择 |
|-----------|------|
| 预训练通用词 Vector，不需要 OOV 容忍度 | GloVe 300d |
| 预训练通用词 Vector，必须处理拼写错误 / 新词 / 形态丰富的语言 | FastText |
| 任何输入 transformer 的内容（训练或 inference） | 模型随附的 Tokenizer。永远不要替换。 |
| 从零训练自己的语言模型 | 先在你的 corpus 上训练 BPE 或 SentencePiece Tokenizer |
| 使用 linear model 做生产级文本 Classification | 仍然是 TF-IDF。Lesson 02。 |

## 交付

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-embeddings-picker.md`¿Qué es esto ?

```markdown
---
name: tokenizer-picker
description: Pick a tokenization approach for a new language model or text pipeline.
version: 1.0.0
phase: 5
lesson: 04
tags: [nlp, tokenization, embeddings]
---

Given a task and dataset description, you output:

1. Tokenization strategy (word-level, BPE, WordPiece, SentencePiece, byte-level). One-sentence reason.
2. Vocabulary size target (e.g., 32k for an English-only LM, 64k-100k for multilingual).
3. Library call with the exact training command. Name the library. Quote the arguments.
4. One reproducibility pitfall. Tokenizer-model mismatch is the single most common silent production bug; call out which pair must be used together.

Refuse to recommend training a custom tokenizer when the user is fine-tuning a pretrained LLM. Refuse to recommend word-level tokenization for any model targeting production inference. Flag non-English / multi-script corpora as needing SentencePiece with byte fallback.
```

##  ejercicios

1. **Easy。**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `char_ngrams("playing")`Y `char_ngrams("played")`△ calcular dos n-gramos 集合 de Jaccard superposición── Usted debería ver un montón de compartido 片段(`pla`¿Qué es esto?`lay`¿Qué es esto?`play`), es por eso que FastText puede muy bien migrar a los cambios de forma.
2. **Medium。**扩展 `learn_bpe`Para seguir el vocabulario 增长── dibujar tokens-per-corpus-character 随着数量变化函数的融合── usted debería ver primero comenzar a rápidamente comprimir, luego llegar a aproximadamente ~2-3 caracteres por token──
3. **Hard。**En Shakespeare  completa obra sobre entrenar un 1k-merger BPE── comparar con frecuencia los términos y los raros ejemplos de los ejemplos de la palabra.

## 关键术语: "El hombre es un hombre"

| 术语 | 人们的说法 | 它实际上的含义 |
|------|-----------------|-----------------------|
| Co-occurrence matrix | 词-词频率表 | `X[i][j]` = 词 `j` 出现在词 `i` 周围窗口中的频率。 |
| Subword | 词的一部分 | 字符 n-gram（FastText）或学习得到的 Token（BPE/WordPiece/SentencePiece）。 |
| BPE | Byte-pair encoding | 迭代合并最高频相邻 pairs，直到 vocabulary 达到目标大小。 |
| OOV | Out of vocabulary | 模型从未见过的词。Word2Vec/GloVe 会失败。FastText 和 BPE 能处理。 |
| Byte-level BPE | 原始 bytes 上的 BPE | GPT-2 的方案。Vocabulary 从 256 个 bytes 开始，所以任何东西都不会 OOV。 |

## 延伸阅读

- [Pennington, Socher, Manning (2014). GloVe: Global Vectors for Word Representation](https://nlp.stanford.edu/pubs/glove.pdf) Glove 论文,七页, hasta ahora sigue siendo la mejor recomendación sobre la pérdida.
- [Bojanowski et al. (2017). Enriching Word Vectors with Subword Information](https://arxiv.org/abs/1607.04606) FastText。
- [Sennrich, Haddow, Birch (2016). Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) 将 BPE 引入现代 NLP 的论文──
- [Hugging Face tokenizer summary](https://huggingface.co/docs/transformers/tokenizer_summary) BPE、Piece de palabras 和 PéntesisPiece en la práctica ¿qué hay de diferente?
