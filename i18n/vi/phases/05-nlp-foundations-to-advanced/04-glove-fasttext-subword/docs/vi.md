# GloVe、FastText và Subword Embeddings

> Word2Vec 为每个词训练一个嵌入──GloVe đối với hiện tại Matrix thực hiện phân tích──FastText Embedding 词的组成片段──BPE 连接到了变体──

**类型:**Xây dựng
**语言:**Python
**先修要求:**Giai đoạn 5 · 03 (Word2Vec từ đầu)
**时间:**~ 45 phút

## 问题

Word2Vec 留下了两个开放问题.

Thứ nhất, còn có một bài viết trên nghiên cứu, nó trực tiếp đối với các hệ thống hiện có làm phân tích (LSA、HAL), thay vì làm các giao dịch qua đường trên mạng 更新。**GloVe** trả lời câu hỏi này:配合精心选择的损失,Matrix factorization có thể phù hợp thậm chí vượt qua Word2Vec, và chi phí đào tạo thấp hơn.

Thứ hai, hai phương pháp đều không xử lý các phương pháp từ chưa từng thấy.`Zoomer-approved``dogecoin`、上周刚被创造出来的任何专名词、罕见词根的每种折曲形式──**FastText**Thông qua việc nhúng vào chữ n-grams, chúng tôi đã giải quyết vấn đề này: một từ là tổng hợp của các thành phần của nó, bao gồm cả các morpheme, vì vậy ngay cả từ ngoài từ vựng cũng có thể có được một vector hợp lý.

Thứ ba, khi các biến thể xuất hiện, vấn đề lại xảy ra thay đổi.**Byte-pair encoding (BPE)**及其相关方法通过学习覆盖一切的高频子词单单词词库 解决了这个问题──每个现代 LLM的每个现代 Tokenizer 都是子词 Tokenizer──

Bài này sẽ giải thích sau này, sau đó giải thích khi nào nên chọn một.

## 概念

**GloVe (Global Vectors)。**构建词-词共现 Matrix `X`, trong số đó `X[i][j]`表示词 `j`出现在词 `i`上下文中的频率──训练 矢量, làm cho `v_i · v_j + b_i + b_j ≈ log(X[i][j])`❖ đối với Loss 加权,避免高频词 đối với chiếm chiếm chủ导──完成──

**FastText。**Một từ là ký tự n-gram của nó cộng với từ tự nó tổng cộng.`where`变成 `<wh, whe, her, ere, re>, <where>`▽词 矢量 是这些组成 矢量 的总和──按 Word2Vec的方式训练──好处:未见过的词(`whereupon`) có thể được kết hợp với n-gram đã biết.

**BPE (Byte-Pair Encoding)。**Từ单个字符 (单个字节) 开始──统计 corpus 中每个相邻对──把最高频的对合并成新代币──重复`k`Kết quả: nhận được một bao gồm`k + 256`个 Token 的 từ vựng, trong đó高频序列(`ing``tion``the`(Thanks to the symbols of the word, each sentence can be tokenized into some kind of form) (Thanks to the symbols of the word, each sentence can be tokenized into some kind of form) (Thanks to the symbols of the word, each sentence can be tokenized into some kind of form) (Thanks to the symbols of the word, each sentence can be tokenized into some kind of form) (Thanks to the symbols of the word, every sentence can be tokenized into some kind of form) (Thanks to the word, every sentence can be tokenized into some kind of form)


```figure
n5-subword-merge
```

## 构建

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

Có hai phần hoạt động có giá trị:`f(x) = (x/x_max)^alpha`会降低非常高频词对(例如`(the, and)`(trong phần đầu tiên, việc tạo ra các loại hình này là:`W`(trung tâm) và `W_tilde`(context) tổng hợp của hai biểu đồ.

### FastText:Công cụm từ phụ

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

Mỗi từ từ từ n-gram của nó 集合表示(thường là 3 đến 6 chữ cái) ⋅词 嵌入 là tổng hợp của n-gram 嵌入.

```python
def fasttext_vector(word, ngram_table):
    grams = char_ngrams(word)
    vecs = [ngram_table[g] for g in grams if g in ngram_table]
    if not vecs:
        return None
    return np.sum(vecs, axis=0)
```

Đối với những từ chưa thấy, miễn là nó có một số n-gram 已知, bạn vẫn có thể nhận được một vector.`whereupon`Với`where`共享 `<wh``her``ere`和 `<where`Vì vậy cả hai sẽ rơi vào vị trí gần nhau.

### BPE: học được từ ngữ phụ

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

Lần đầu tiên gặp nhau là đôi hàng xóm phổ biến nhất.`low``est``tion`) sẽ trở thành một Token, hiếm từ được làm sạch và tháo rời.

Thực tế GPT / BERT / T5 Tokenizers 会学习 30k-100k 个合并── kết quả là: bất kỳ văn bản nào đều có thể được token hóa thành một đoạn dài hạn hạn của các ID được biết đến 序列, sẽ không bao giờ có OOV──

## 使用

Thực tế, bạn rất ít tự tập những thứ này. Bạn sẽ tải các điểm kiểm tra trước khi tập.

```python
import fasttext.util
fasttext.util.download_model("en", if_exists="ignore")
ft = fasttext.load_model("cc.en.300.bin")
print(ft.get_word_vector("whereupon").shape)
print(ft.get_word_vector("zoomerapproved").shape)
```

Trong biến đổi 时代 sử dụng BPE 风格 của chữ ký:

```python
from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained("gpt2")
print(tok.tokenize("unbelievably tokenized"))
```

```
['un', 'bel', 'iev', 'ably', 'Ġtoken', 'ized']
```

`Ġ`前标记词边界(GPT-2 约定) ・・・每个现代 Tokenizer 都是 BPE 变体、WordPiece(BERT) 或 SentencePiece(T5、LLaMA) ・・・

### 什么时候选择哪一个

| 情况 | 选择 |
|-----------|------|
| 预训练通用词 Vector，不需要 OOV 容忍度 | GloVe 300d |
| 预训练通用词 Vector，必须处理拼写错误 / 新词 / 形态丰富的语言 | FastText |
| 任何输入 transformer 的内容（训练或 inference） | 模型随附的 Tokenizer。永远不要替换。 |
| 从零训练自己的语言模型 | 先在你的 corpus 上训练 BPE 或 SentencePiece Tokenizer |
| 使用 linear model 做生产级文本 Classification | 仍然是 TF-IDF。Lesson 02。 |

## 交付

保存为 `outputs/skill-embeddings-picker.md`- Có thể là:

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

1. **Easy。**运行 `char_ngrams("playing")`和 `char_ngrams("played")`△ tính toán hai n-gram 集合 của Jaccard chồng chéo── bạn nên thấy rất nhiều chia sẻ đoạn片`pla``lay``play`), đó là lý do tại sao FastText có thể chuyển sang dạng biến trên tốt.
2. **Medium。**扩展 `learn_bpe`Để theo dõi từ vựng 增长── vẽ token-per-corpus-character 随着 kết hợp số lượng biến đổi hàm── bạn nên thấy một bắt đầu nhanh chóng nén, sau đó dần gần đến khoảng ~2-3 ký tự mỗi token──
3. **Hard。**Trong Shakespeare 完整作品上练习一个1k-合并 BPE──比较常见词和罕见专名词的代号化──测量前后平均代号每字──写下让你意外的发现──

## 关键术语

| 术语 | 人们的说法 | 它实际上的含义 |
|------|-----------------|-----------------------|
| Co-occurrence matrix | 词-词频率表 | `X[i][j]` = 词 `j` 出现在词 `i` 周围窗口中的频率。 |
| Subword | 词的一部分 | 字符 n-gram（FastText）或学习得到的 Token（BPE/WordPiece/SentencePiece）。 |
| BPE | Byte-pair encoding | 迭代合并最高频相邻 pairs，直到 vocabulary 达到目标大小。 |
| OOV | Out of vocabulary | 模型从未见过的词。Word2Vec/GloVe 会失败。FastText 和 BPE 能处理。 |
| Byte-level BPE | 原始 bytes 上的 BPE | GPT-2 的方案。Vocabulary 从 256 个 bytes 开始，所以任何东西都不会 OOV。 |

## 延伸阅读

- [Pennington, Socher, Manning (2014). GloVe: Global Vectors for Word Representation](https://nlp.stanford.edu/pubs/glove.pdf) GloVe 论文,七页,至今仍是对损失最好的推──
- [Bojanowski et al. (2017). Enriching Word Vectors with Subword Information](https://arxiv.org/abs/1607.04606) FastText。
- [Sennrich, Haddow, Birch (2016). Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) 将 BPE 引入现代NLP的论文──
- [Hugging Face tokenizer summary](https://huggingface.co/docs/transformers/tokenizer_summary) BPE、WordPiece 和 SentencePiece Trong thực tế có gì khác nhau.
