# GloVe、FastText ve Alt Sözcük Eklentileri

> Word2Vec 为每个词训练一个嵌入──GloVe对共现矩阵做因果化──FastText Embedding 词的组成片段──BPE 连接到了变体──

**类型:**Yapım
**语言:**Python
**先修要求:**5 · 03 aşaması (Söz2Vec sıfırdan)
**时间:**~ 45 dakika

## 问题

Word2Vec'in iki açık sorunu kaldı.

Birinci olarak, bir başka araştırma yolu da var, bu da online skip-gram 更新 değil, doğrudan mevcut matrisleri faktörleştirmeye yöneliktir.**GloVe**回答:配合精心选择的 Loss,Matrix faktörleşmesi Word2Vec'e göre hatta daha fazla olabilir ve eğitim maliyeti daha düşüktür.

İkinci olarak, her iki yöntem de hiç görülmemiş bir kelime ile ilgili bir çözüm bulunmamıştır.`Zoomer-approved`- Evet.`dogecoin`、上周刚被创造出来的任何专名词、罕见词根的每种屈曲形式──**FastText**通过嵌入字符 n-grams 解决了这个问题:一个词是其组成部分的总和,包括 morphemes,因此即使是外语词也能得到合理的矢量──

Üçüncü olarak, dönüştürücüler ortaya çıktıktan sonra, sorunlar yeniden ortaya çıktı. Söz sınıfı sözcükleri genellikle en fazla yaklaşık bir milyon sözcüktür.**Byte-pair encoding (BPE)** ve ilgili yöntemleri ile                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

Bu derste bu üç kişiyi birbiriyle ele alacağız ve hangisini seçmemiz gerektiğini açıklayacağız.

## 概念

**GloVe (Global Vectors)。**构建词-词共现 Matrix `X`, içinden `X[i][j]` 表示词`j` 出现在词 `i`Ünlü metinlerde frekansı--- eğitim vektörü, yapın `v_i · v_j + b_i + b_j ≈ log(X[i][j])`❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖

**FastText。**Bir kelime onun harfleri n-gramlar eklemiş bir kelime kendi toplamı vardır.`where`变成 `<wh, whe, her, ere, re>, <where>`▽词 Vector 是这些组成 矢量 的总和──按 Word2Vec 的方式训练──好处:未见过的词(`whereupon`) bilinen n-gramlar tarafından 组合出来──

**BPE (Byte-Pair Encoding)。**开始──统计 corpus 中每个相邻对──把最高频的对──合并成新代币──重复`k`Sonraki sonuç: bir tane var.`k + 256`个 Token 的词汇,其中高频序列(`ing`- Evet.`tion`- Evet.`the`) tek bir işaret, nadir sözcükler olgunlaşmış parça parçaları sökülür.


```figure
n5-subword-merge
```

## Yapım

### GloVe: 共现 Matrix faktörleştir

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

İki etkinlik parçası var.`f(x) = (x/x_max)^alpha`会降低非常高频词对(例如`(the, and)`Bu yüzden, bu durumun en son gerçekleşmesi,`W`(merkezi)`W_tilde`(kontext) iki tabloların toplamı: iki tabloyu bir araya getirmek, genellikle tek birincisiyle daha iyi sonuçlar elde etmekten daha iyi bir yöntemdir.

### FastText:Ayrek kelime bilgili yerleşimler

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

Her kelime n-gramları tarafından 集合 gösterir (sık sık 3 ila 6 karakter) ⋅词 Embedding is its n-gram Embeddings'ın toplamı ⋅ For skip-gram  training,把它接到 Word2Vec 原本使用单个矢量的位置即可──

```python
def fasttext_vector(word, ngram_table):
    grams = char_ngrams(word)
    vecs = [ngram_table[g] for g in grams if g in ngram_table]
    if not vecs:
        return None
    return np.sum(vecs, axis=0)
```

                                                                                                                                                                                                                                                              `whereupon`ile`where`共享 `<wh`- Evet.`her`- Evet.`ere`和 `<where`Bu yüzden ikisi de birbirine yakın bir yerde olacak.

### BPE: öğrenmek için sözcük sözcükleri

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

İlk kez 代会并最常见的相邻对──经过足够多次代后,高频子串(`low`- Evet.`est`- Evet.`tion`) tek bir simgeye dönüşür, nadir sözcükler ise temiz olarak sökülür.

Gerçek GPT / BERT / T5 Tokenizers 会学习 30k-100k 个合并──结果是:任何文本都能标记成一段长度受限的已知IDs 序列,永远不会有OOV──

## kullanımı

Bu şeyleri pratikte çok az kendin eğitmişsin.

```python
import fasttext.util
fasttext.util.download_model("en", if_exists="ignore")
ft = fasttext.load_model("cc.en.300.bin")
print(ft.get_word_vector("whereupon").shape)
print(ft.get_word_vector("zoomerapproved").shape)
```

Transformer 时代使用 BPE 风格的字幕标记化:

```python
from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained("gpt2")
print(tok.tokenize("unbelievably tokenized"))
```

```
['un', 'bel', 'iev', 'ably', 'Ġtoken', 'ized']
```

`Ġ`Ön标记词边界(GPT-2 约定) ・・・每个现代 Tokenizer 都是 BPE 变体、WordPiece(BERT) 或 SentencePiece(T5、LLaMA) ・・・

### Ne zaman seçmek?

| 情况 | 选择 |
|-----------|------|
| 预训练通用词 Vector，不需要 OOV 容忍度 | GloVe 300d |
| 预训练通用词 Vector，必须处理拼写错误 / 新词 / 形态丰富的语言 | FastText |
| 任何输入 transformer 的内容（训练或 inference） | 模型随附的 Tokenizer。永远不要替换。 |
| 从零训练自己的语言模型 | 先在你的 corpus 上训练 BPE 或 SentencePiece Tokenizer |
| 使用 linear model 做生产级文本 Classification | 仍然是 TF-IDF。Lesson 02。 |

## 交付

保存为 `outputs/skill-embeddings-picker.md`- ...

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

1. **Easy。**运行  İşlem`char_ngrams("playing")`和 `char_ngrams("played")`△ hesaplamak iki n-gram 集合 Jaccard üst üste geçiyor.`pla`- Evet.`lay`- Evet.`play`), bu yüzden FastText çok iyi bir şekilde biçim değişimlerine geçebilir.
2. **Medium。**扩展 `learn_bpe`Sözlükleri takip etmek için 增长──token-per-corpus-character çizmek 随着数量变化函数的合并──你应该看到一开始快速压缩,然后渐近到每代币约2-3个字符──
3. **Hard。**Shakespeare'in tamamı eserlerinde 1k birleşim BPE'yi eğitmek için.

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
- [Sennrich, Haddow, Birch (2016). Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909)BPE'yi modern NLP'nin makalesine yerleştirmek.
- [Hugging Face tokenizer summary](https://huggingface.co/docs/transformers/tokenizer_summary) BPE、WordPiece 和 SentencePiece pratikte ne farkı var?
