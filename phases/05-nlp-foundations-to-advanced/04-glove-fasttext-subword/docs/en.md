# GloVe、FastText 与 Subword Embeddings

> Word2Vec 为每个词训练一个 Embedding。GloVe 对共现 Matrix 做 factorization。FastText Embedding 词的组成片段。BPE 连接到了 transformers。

**类型:** Build
**语言:** Python
**先修要求:** Phase 5 · 03 (Word2Vec from Scratch)
**时间:** ~45 分钟

## 问题

Word2Vec 留下了两个开放问题。

第一，还有一条并行研究路线，它直接对共现 Matrix 做 factorization（LSA、HAL），而不是做在线 skip-gram 更新。Word2Vec 的迭代方法是否从根本上更好，还是这种差异只是两种方法处理计数方式造成的表象？**GloVe** 回答了这个问题：配合精心选择的 Loss，Matrix factorization 可以匹配甚至超越 Word2Vec，而且训练成本更低。

第二，两种方法都没有处理从未见过的词的方案。`Zoomer-approved`、`dogecoin`、上周刚被创造出来的任何专有名词、罕见词根的每一种屈折形式。**FastText** 通过 Embedding 字符 n-grams 解决了这个问题：一个词是其组成部分的总和，包括 morphemes，因此即使是 out-of-vocabulary 词也能得到合理的 Vector。

第三，当 transformers 出现后，问题又发生了变化。词级 vocabulary 通常最多约一百万项；真实语言比这开放得多。**Byte-pair encoding (BPE)** 及其相关方法通过学习覆盖一切的高频 subword units vocabulary 解决了这个问题。每个现代 LLM 的每个现代 Tokenizer 都是 subword Tokenizer。

本课会依次讲解这三者，然后说明什么时候该选择哪一个。

## 概念

**GloVe (Global Vectors)。** 构建词-词共现 Matrix `X`，其中 `X[i][j]` 表示词 `j` 出现在词 `i` 上下文中的频率。训练 Vector，使得 `v_i · v_j + b_i + b_j ≈ log(X[i][j])`。对 Loss 加权，避免高频词对占据主导。完成。

**FastText。** 一个词是其字符 n-grams 加上词本身的总和。`where` 变成 `<wh, whe, her, ere, re>, <where>`。词 Vector 是这些组成 Vector 的总和。按 Word2Vec 的方式训练。好处：未见过的词（`whereupon`）可以由已知 n-grams 组合出来。

**BPE (Byte-Pair Encoding)。** 从单个 bytes（或字符）的 vocabulary 开始。统计 corpus 中每个相邻 pair。把最高频的 pair 合并成新的 Token。重复 `k` 次。结果：得到一个包含 `k + 256` 个 Token 的 vocabulary，其中高频序列（`ing`、`tion`、`the`）是单个 Token，罕见词会被拆成熟悉的片段。每个句子都能被 tokenizes 成某种形式。

## 构建

### GloVe：factorize 共现 Matrix

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

有两个值得点名的活动部件。加权函数 `f(x) = (x/x_max)^alpha` 会降低非常高频词对（比如 `(the, and)`）的权重，避免它们主导 Loss。最终 Embedding 是 `W`（center）和 `W_tilde`（context）两张表的总和。把两者相加是论文中发表过的技巧，通常比只用其中一个效果更好。

### FastText：subword-aware Embeddings

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

每个词由它的 n-grams 集合表示（通常是 3 到 6 个字符）。词 Embedding 是其 n-gram Embeddings 的总和。对于 skip-gram 训练，把它接到 Word2Vec 原本使用单个 Vector 的位置即可。

```python
def fasttext_vector(word, ngram_table):
    grams = char_ngrams(word)
    vecs = [ngram_table[g] for g in grams if g in ngram_table]
    if not vecs:
        return None
    return np.sum(vecs, axis=0)
```

对于未见过的词，只要它的一些 n-grams 已知，你仍然能得到一个 Vector。`whereupon` 与 `where` 共享 `<wh`、`her`、`ere` 和 `<where`，所以两者会落在相近位置。

### BPE：学习得到的 subword vocabulary

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

第一次迭代会合并最常见的相邻 pair。经过足够多次迭代后，高频子串（`low`、`est`、`tion`）会变成单个 Token，罕见词则被干净地拆开。

真实的 GPT / BERT / T5 Tokenizers 会学习 30k-100k 个 merges。结果是：任何文本都能 tokenizes 成一段长度受限的已知 IDs 序列，永远不会有 OOV。

## 使用

实践中，你很少自己训练这些东西。你会加载预训练 checkpoints。

```python
import fasttext.util
fasttext.util.download_model("en", if_exists="ignore")
ft = fasttext.load_model("cc.en.300.bin")
print(ft.get_word_vector("whereupon").shape)
print(ft.get_word_vector("zoomerapproved").shape)
```

在 transformer 时代使用 BPE 风格的 subword tokenization：

```python
from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained("gpt2")
print(tok.tokenize("unbelievably tokenized"))
```

```
['un', 'bel', 'iev', 'ably', 'Ġtoken', 'ized']
```

`Ġ` 前缀标记词边界（GPT-2 约定）。每个现代 Tokenizer 都是 BPE 变体、WordPiece（BERT）或 SentencePiece（T5、LLaMA）。

### 什么时候选择哪一个

| 情况 | 选择 |
|-----------|------|
| 预训练通用词 Vector，不需要 OOV 容忍度 | GloVe 300d |
| 预训练通用词 Vector，必须处理拼写错误 / 新词 / 形态丰富的语言 | FastText |
| 任何输入 transformer 的内容（训练或 inference） | 模型随附的 Tokenizer。永远不要替换。 |
| 从零训练自己的语言模型 | 先在你的 corpus 上训练 BPE 或 SentencePiece Tokenizer |
| 使用 linear model 做生产级文本 Classification | 仍然是 TF-IDF。Lesson 02。 |

## 交付

保存为 `outputs/skill-embeddings-picker.md`：

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

1. **Easy。** 运行 `char_ngrams("playing")` 和 `char_ngrams("played")`。计算两个 n-gram 集合的 Jaccard overlap。你应该会看到大量共享片段（`pla`、`lay`、`play`），这就是为什么 FastText 能很好地迁移到形态变体上。
2. **Medium。** 扩展 `learn_bpe` 来跟踪 vocabulary 增长。绘制 tokens-per-corpus-character 随 merges 数量变化的函数。你应该会看到一开始快速压缩，然后渐近到约 ~2-3 chars per token。
3. **Hard。** 在 Shakespeare 完整作品上训练一个 1k-merge BPE。比较常见词和罕见专有名词的 tokenization。测量前后平均 tokens per word。写下让你意外的发现。

## 关键术语

| 术语 | 人们的说法 | 它实际上的含义 |
|------|-----------------|-----------------------|
| Co-occurrence matrix | 词-词频率表 | `X[i][j]` = 词 `j` 出现在词 `i` 周围窗口中的频率。 |
| Subword | 词的一部分 | 字符 n-gram（FastText）或学习得到的 Token（BPE/WordPiece/SentencePiece）。 |
| BPE | Byte-pair encoding | 迭代合并最高频相邻 pairs，直到 vocabulary 达到目标大小。 |
| OOV | Out of vocabulary | 模型从未见过的词。Word2Vec/GloVe 会失败。FastText 和 BPE 能处理。 |
| Byte-level BPE | 原始 bytes 上的 BPE | GPT-2 的方案。Vocabulary 从 256 个 bytes 开始，所以任何东西都不会 OOV。 |

## 延伸阅读

- [Pennington, Socher, Manning (2014). GloVe: Global Vectors for Word Representation](https://nlp.stanford.edu/pubs/glove.pdf) — GloVe 论文，七页，至今仍是对 Loss 最好的推导。
- [Bojanowski et al. (2017). Enriching Word Vectors with Subword Information](https://arxiv.org/abs/1607.04606) — FastText。
- [Sennrich, Haddow, Birch (2016). Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) — 将 BPE 引入现代 NLP 的论文。
- [Hugging Face tokenizer summary](https://huggingface.co/docs/transformers/tokenizer_summary) — BPE、WordPiece 和 SentencePiece 在实践中到底有何不同。
