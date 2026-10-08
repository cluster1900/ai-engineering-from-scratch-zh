# GloVe、FastText e Embedings de Subpalavras

> Word2Vec 为每个词训练一个嵌入──GloVe 对共现矩阵做因果化──FastText Embedding 词的组成片段──BPE 连接到了变体──

**类型:**Construir
**语言:**Python
**先修要求:**Fase 5 · 03 (Word2Vec a partir do zero)
**时间:**- 45 minutos.

## 问题

O Word2Vec deixou dois problemas abertos.

Primeiro, há também uma linha de estudo que se refere diretamente à factualização da matriz comum (LSA ≠ HAL), em vez de fazer um esquema de pontuação em linha. O método de geração do Word2Vec é melhor do que o original, ou esta diferença é apenas um dos dois métodos de processamento de números?**GloVe** Respondeu a esta questão: 配合精心选择的 Loss, Matrix factorization pode ser combinado até mesmo superior ao Word2Vec, e o custo de treinamento é menor.

Segundo, os dois métodos não tratam de um esquema de palavras nunca vistas.`Zoomer-approved`- Não.`dogecoin`、上周刚被创造出来的任何专名词、罕见词根的每种屈曲形式──**FastText**通过嵌入字符 n-grams 解决了这个问题:一个词是其组成部分的总和, incluindo morfemas, portanto, mesmo fora do vocabulário 词也能得到合理的矢量──

Terceiro, quando os transformadores surgiram, a questão mudou novamente.**Byte-pair encoding (BPE)** e seus métodos relacionados através do aprendizado de cobrir tudo  resolveu este problema ⋅ cada moderno LLM ⋅ cada moderno Tokenizer ⋅ são todos os subpalavras Tokenizer ⋅

Esta aula vai explicar as três coisas e depois explicar quando é que escolher.

## 概念

**GloVe (Global Vectors)。**构建词-词共现 Matrix `X`, entre os `X[i][j]`Expressão `j`Aparecer em palavras`i`上下文中的频率──训练 Vector, fazer `v_i · v_j + b_i + b_j ≈ log(X[i][j])`◊ Sobre Perda + poder, evitar alta frequência

**FastText。**Um termo é o seu caracter n-gramas, adicionado ao termo em si mesmo.`where`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `<wh, whe, her, ere, re>, <where>`。Words Vector é estes componentes de Vector ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼`whereupon`) podem ser combinados por n-gramas já conhecidos.

**BPE (Byte-Pair Encoding)。**Desde o vocabulário de simples bytes (或字符) 开始──统计 corpus 中每个相邻对──把最高频的对合并成新 Token──重复`k`O resultado é: obter um conteúdo.`k + 256`个 Token 的词汇,其中高频序列(`ing`- Não.`tion`- Não.`the`) é um único Token, rar见词会被拆除成熟的片段──每个句子都能被代币化成某种形式──


```figure
n5-subword-merge
```

## Construção

### GloVe:factorizar 共现 Matrix

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

Há duas partes de atividade de valor.`f(x) = (x/x_max)^alpha`会降低非常高频词对(比如 `(the, and)`O peso de um objeto é o peso do outro, evitando que ele domine a perda.`W`(centro) e `W_tilde`(contexto) O somado dos dois quadros é a combinação de técnicas publicadas no artigo, geralmente melhor do que apenas um deles.

### FastText:Inbuilding sub-word-aware

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

Cada palavra é composta por n-gramas 集合 representando ((normalmente são 3 a 6 caracteres) ⋅词 Embedding é o som de seus n-gram Embeddings ⋅ For skip-gram training, take it to Word2Vec original use single vector position ⋅

```python
def fasttext_vector(word, ngram_table):
    grams = char_ngrams(word)
    vecs = [ngram_table[g] for g in grams if g in ngram_table]
    if not vecs:
        return None
    return np.sum(vecs, axis=0)
```

Para palavras que não foram vistas, desde que alguns n-gramas dela sejam conhecidos, você ainda pode obter um vetor.`whereupon`Com`where`Compartilhamento`<wh`- Não.`her`- Não.`ere`和 `<where`Então, ambos ficam em posição próxima.

### BPE: aprendizagem de vocabulário de subpalavras

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

A primeira vez que se encontraram os par de vizinhos mais comuns.`low`- Não.`est`- Não.`tion`) se tornará um único Token, rarísimos termos são dissolvidos.

O resultado é: qualquer texto que possa ser tokenizado, seja um segmento de IDs conhecidos com uma duração limitada, nunca terá OOV.

## Utilização

Na prática, você pouco treina isso.

```python
import fasttext.util
fasttext.util.download_model("en", if_exists="ignore")
ft = fasttext.load_model("cc.en.300.bin")
print(ft.get_word_vector("whereupon").shape)
print(ft.get_word_vector("zoomerapproved").shape)
```

Em transformador 时代使用 BPE 风格的字幕标记化:

```python
from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained("gpt2")
print(tok.tokenize("unbelievably tokenized"))
```

```
['un', 'bel', 'iev', 'ably', 'Ġtoken', 'ized']
```

`Ġ`Antes de começar, o usuário deve ser informado sobre o uso de um token de identificação.

### Que é que é que é que é?

| 情况 | 选择 |
|-----------|------|
| 预训练通用词 Vector，不需要 OOV 容忍度 | GloVe 300d |
| 预训练通用词 Vector，必须处理拼写错误 / 新词 / 形态丰富的语言 | FastText |
| 任何输入 transformer 的内容（训练或 inference） | 模型随附的 Tokenizer。永远不要替换。 |
| 从零训练自己的语言模型 | 先在你的 corpus 上训练 BPE 或 SentencePiece Tokenizer |
| 使用 linear model 做生产级文本 Classification | 仍然是 TF-IDF。Lesson 02。 |

## 交付

保存为 `outputs/skill-embeddings-picker.md`- Não .

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

## 练习

1. **Easy。**运行 `char_ngrams("playing")`和 `char_ngrams("played")`△ calcular dois n-gram 集合 Jaccard sobreposição── você deve ver um grande número de partes compartilhadas`pla`- Não.`lay`- Não.`play`), é por isso que o FastText pode muito bem mudar para forma de variação.
2. **Medium。**扩展 `learn_bpe`Para acompanhar o vocabulário 增长── desenhar tokens-per-corpus-character 随着数量变化函数的融合── você deve ver primeiro começar a rápido compressão, então gradualmente aproximar-se de ~2-3 caracteres por token──
3. **Hard。**Em Shakespeare  completa obra sobre treinar um 1k-merger BPE── comparar constelação de palavras e raras palavras especiais── medir antes e depois média de tokens por palavra── escrever para fazer você descobrir inesperadamente──

## 关键术语

| 术语 | 人们的说法 | 它实际上的含义 |
|------|-----------------|-----------------------|
| Co-occurrence matrix | 词-词频率表 | `X[i][j]` = 词 `j` 出现在词 `i` 周围窗口中的频率。 |
| Subword | 词的一部分 | 字符 n-gram（FastText）或学习得到的 Token（BPE/WordPiece/SentencePiece）。 |
| BPE | Byte-pair encoding | 迭代合并最高频相邻 pairs，直到 vocabulary 达到目标大小。 |
| OOV | Out of vocabulary | 模型从未见过的词。Word2Vec/GloVe 会失败。FastText 和 BPE 能处理。 |
| Byte-level BPE | 原始 bytes 上的 BPE | GPT-2 的方案。Vocabulary 从 256 个 bytes 开始，所以任何东西都不会 OOV。 |

## 延伸阅读

- [Pennington, Socher, Manning (2014). GloVe: Global Vectors for Word Representation](https://nlp.stanford.edu/pubs/glove.pdf) GloVe 论文,七页,至今仍对损失最好的推──
- [Bojanowski et al. (2017). Enriching Word Vectors with Subword Information](https://arxiv.org/abs/1607.04606) FastText。
- [Sennrich, Haddow, Birch (2016). Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) 将 BPE 引入现代 NLP 的论文──
- [Hugging Face tokenizer summary](https://huggingface.co/docs/transformers/tokenizer_summary) BPE、WordPiece 和 SentencePiece em prática até que ponto há diferença.
