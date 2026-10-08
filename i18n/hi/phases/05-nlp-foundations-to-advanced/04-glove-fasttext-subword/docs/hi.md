# ग्लोवे、फास्टटेक्स तथा उपशब्द एम्बेड

> Word2Vec 为每一个词训练一个嵌入──GloVe对共现矩阵做分化──FastText Embedding 词的组成片段──BPE 连接到了变体──

**类型:**निर्माण
**语言:**पायथन
**先修要求:**चरण 5 · 03 (Word2Vec स्क्रैच से)
**时间:**~ 45 मिनट

## 问题

Word2Vec  दो खुले प्रश्न  छोड़ दिया गया है

पहला, एक अन्य अध्ययन मार्ग भी है, जो कि वर्ड 2 वीसी की प्रोसेसिंग विधि से मूल रूप से बेहतर है या यह अंतर केवल दो तरीकों से उत्पन्न है?**GloVe** इस प्रश्न का उत्तर दिया: संयोजन精心选择的损失,मैट्रिक्स कारककरण Word2Vec से भी अधिक हो सकता है,और प्रशिक्षण लागत कम है

दूसरा, दोनों तरीकों में से कोई भी शब्द के लिए एक योजना को संभाल नहीं सकता है जो पहले कभी नहीं देखा गया है।`Zoomer-approved``dogecoin`、上周刚被创造出来的任何专名词、罕见词根的每种屈折形式──**FastText**通过嵌入字符 n-grams 解决了这个问题:一个词是其组成部分的总和,包括摩尔菲姆,因此即使是词汇之外的词也能得到合理的矢量──

तीसरा, जब ट्रांसफार्मर सामने आए, तब समस्या फिर से बदल गई।**Byte-pair encoding (BPE)** और इसके संबंधित तरीकों के माध्यम से सीखने को कवर करना                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  

इस वर्ग में इन तीनों को एक-एक करके समझाया जाएगा, फिर यह समझाया जाएगा कि किसको चुनना है।

## 概念

**GloVe (Global Vectors)。**构建词-词共现 मैट्रिक्स `X`, उनमें से `X[i][j]`表示词 `j` 出现在词 `i`上下文中的频率──训练 वेक्टर,使得 `v_i · v_j + b_i + b_j ≈ log(X[i][j])`                                                                                                                                                                                                                                                              

**FastText。**एक शब्द है उसके वर्ण n-ग्राम प्लस वर्ड स्वयं के योगायोग`where`变成 `<wh, whe, her, ere, re>, <where>`词 भेक्टर 是这些组成的 词的总和──按 Word2Vec 的方式训练──好处:未见过的词(`whereupon`) ज्ञात n-ग्राम से 组合出来──

**BPE (Byte-Pair Encoding)。**开始──统计 corpus 中每个相邻对──把最高频的对合并成新代币──重复`k`परिणामः एक शामिल हो जाओ`k + 256`个 टोकन का शब्दावली, उनमें高频序列(`ing``tion``the`) एक एकल टोकन है, दुर्लभ शब्द को एक परिपक्व टुकड़े में तोड़ दिया जाएगा। प्रत्येक वाक्य को किसी न किसी रूप में टोकन किया जा सकता है।


```figure
n5-subword-merge
```

## 构建

### ग्लोवेःकार्यात्मक 共现矩阵

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

दो गुणात्मक गतिविधि भागों है।`f(x) = (x/x_max)^alpha`会降低非常高频词对(उदाहरण के लिए `(the, and)`) के वजन से बचें, उन्हें हानि से बचें।`W`(केंद्र) और `W_tilde`(context) दो张表的总和──把两张相加是论文中发表的技巧,通常只用其中一个效果更好──

### FastText:उपशब्द-जागरूक एम्बेड

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

प्रत्येक शब्द से इसका n-ग्राम 集合表示 (आमतौर पर 3 से 6 个字符) ⋅词 एम्बेडिंग है उसके n-ग्राम एम्बेडिंग्स का योग ⋅। स्किप-ग्राम 训练 के लिए, इसे Word2Vec तक जोड़ें। मूल रूप से एकल वेक्टर के स्थान का उपयोग करके यह संभव है।

```python
def fasttext_vector(word, ngram_table):
    grams = char_ngrams(word)
    vecs = [ngram_table[g] for g in grams if g in ngram_table]
    if not vecs:
        return None
    return np.sum(vecs, axis=0)
```

अदृश्य शब्द के लिए, जब तक यह कुछ n-ग्राम जानती है, आप अभी भी एक वेक्टर प्राप्त कर सकते हैं`whereupon``where`共享 `<wh``her``ere`和 `<where`तो दोनों एक दूसरे के करीब होंगे।

### BPE: सीखने के लिए प्राप्त की उपशब्द शब्दावली

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

पहली बार 代会并最常见的相邻对──经过足够多次 代后,高频子串(`low``est``tion`) एक एकल टोकन में बदल जाएगा, दुर्लभ शब्द तो कर रहे हैं साफ-सुथरा टूट गया।

वास्तविक GPT / BERT / T5 Tokenizers 会学习 30k-100k 个合并── परिणाम यह हैः किसी भी文本都能 टोकन化成一段长度受限的已知IDs 序列,永远不会有OOV──

## उपयोग

अभ्यास में, आप बहुत कम खुद को इन चीजों को प्रशिक्षित करते हैं.

```python
import fasttext.util
fasttext.util.download_model("en", if_exists="ignore")
ft = fasttext.load_model("cc.en.300.bin")
print(ft.get_word_vector("whereupon").shape)
print(ft.get_word_vector("zoomerapproved").shape)
```

में ट्रांसफार्मर 时代 उपयोग BPE 风格 के उपशब्द टोकनाइज़ेशन:

```python
from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained("gpt2")
print(tok.tokenize("unbelievably tokenized"))
```

```
['un', 'bel', 'iev', 'ably', 'Ġtoken', 'ized']
```

`Ġ`前标记词边界(GPT-2 约定) ・・・ प्रत्येक आधुनिक टोकन बनाने वाला 都是 BPE 变体、WordPiece(BERT) या SentencePiece(T5、LLaMA) ・・・

### 什么时候选择哪一个

| 情况 | 选择 |
|-----------|------|
| 预训练通用词 Vector，不需要 OOV 容忍度 | GloVe 300d |
| 预训练通用词 Vector，必须处理拼写错误 / 新词 / 形态丰富的语言 | FastText |
| 任何输入 transformer 的内容（训练或 inference） | 模型随附的 Tokenizer。永远不要替换。 |
| 从零训练自己的语言模型 | 先在你的 corpus 上训练 BPE 或 SentencePiece Tokenizer |
| 使用 linear model 做生产级文本 Classification | 仍然是 TF-IDF。Lesson 02。 |

## 交付

保存为 `outputs/skill-embeddings-picker.md`:

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

## अभ्यास

1. **Easy。**运行 `char_ngrams("playing")`和 `char_ngrams("played")`◊ गणना दो n-ग्राम 集合 के जैकार्ड ओवरलैप──आपको बहुत अधिक साझा भागों को देखना चाहिए`pla``lay``play`), यही कारण है कि फास्टटेक्सट  अच्छे रूप से रूप परिवर्तन पर स्थानांतरित हो सकता है।
2. **Medium。**扩展 `learn_bpe`शब्दकोश का अनुसरण करने के लिए 增长── प्रति कर्पस वर्ण टोकन को आकर्षित करें 随着数量变化的函数相结合──आपको देखना चाहिए कि एक त्वरित संपीड़न शुरू होता है, फिर लगभग ~2-3 वर्ण प्रति टोकन तक पहुंच जाता है──
3. **Hard。**完整作品上练习一个1k-合并BPE──比较常见词和罕见专名词的标记化──测量前后平均每字的标记──写下让你意外的发现──

## 关键术语

| 术语 | 人们的说法 | 它实际上的含义 |
|------|-----------------|-----------------------|
| Co-occurrence matrix | 词-词频率表 | `X[i][j]` = 词 `j` 出现在词 `i` 周围窗口中的频率。 |
| Subword | 词的一部分 | 字符 n-gram（FastText）或学习得到的 Token（BPE/WordPiece/SentencePiece）。 |
| BPE | Byte-pair encoding | 迭代合并最高频相邻 pairs，直到 vocabulary 达到目标大小。 |
| OOV | Out of vocabulary | 模型从未见过的词。Word2Vec/GloVe 会失败。FastText 和 BPE 能处理。 |
| Byte-level BPE | 原始 bytes 上的 BPE | GPT-2 的方案。Vocabulary 从 256 个 bytes 开始，所以任何东西都不会 OOV。 |

## 延伸阅读

- [Pennington, Socher, Manning (2014). GloVe: Global Vectors for Word Representation](https://nlp.stanford.edu/pubs/glove.pdf) ग्लोवे 论文,七页,至今仍对损失最好的推──
- [Bojanowski et al. (2017). Enriching Word Vectors with Subword Information](https://arxiv.org/abs/1607.04606) फास्टटेक्सट。
- [Sennrich, Haddow, Birch (2016). Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) 将 BPE 引入现代 NLP 的论文──
- [Hugging Face tokenizer summary](https://huggingface.co/docs/transformers/tokenizer_summary) BPE、WordPiece 和 SentencePiece अभ्यास में क्या अंतर है?
