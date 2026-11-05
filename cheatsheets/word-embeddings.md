---
id: word-embeddings
title: Word2Vec, GloVe and FastText
code: WG
subtitle: 统计词、用 TF-IDF 加权、训练稠密向量，并把罕见词切成子词。课文中的 Python。
hue: 25
sources: phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf, phases/05-nlp-foundations-to-advanced/03-word-embeddings-word2vec, phases/05-nlp-foundations-to-advanced/04-glove-fasttext-subword
source_hash: 0383ae27ed824c5a
---

## 带负采样的 Skip-gram
type: architecture
from: phases/05-nlp-foundations-to-advanced/03-word-embeddings-word2vec/docs/en.md

```arch
node | in | 1,1 | one-hot(center) | vocab size | client
node | w | 2,1 | W | center table, kept | store
node | h | 3,1 | hidden | d-dim, no nonlinearity | process
node | wp | 2,2 | W' | context table | store
node | out | 4,1 | sigmoid scores | 1 positive, k negatives | model
edge | in | w |
edge | w | h | lookup
edge | h | out | dot product
edge | wp | out | u_pos, u_negs
```

## 一次训练步骤：train_pair
type: flow
from: phases/05-nlp-foundations-to-advanced/03-word-embeddings-word2vec/code/main.py, phases/05-nlp-foundations-to-advanced/03-word-embeddings-word2vec/docs/en.md

1. **配对**：`skipgram_pairs` 在 `window` 内发出每一个 (center, context) 对。
2. **负样本**：抽取 `k_neg` 个随机 id。丢掉中心和上下文 id。
3. **分数**：`sigmoid(v_c @ u_pos)` 应接近 1。`sigmoid(u_negs @ v_c)` 接近 0。
4. **误差**：`pos_err` 是正样本分数减 1.0。`neg_errs` 是负样本分数。
5. **更新 W'**：对每个上下文行减去 `lr` 乘误差乘 `v_c`。
6. **更新 W**：从中心行减去 `lr * grad_center`。

## 代码中的任务
type: task-table
span: 2
from: phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf/code/main.py, phases/05-nlp-foundations-to-advanced/03-word-embeddings-word2vec/docs/en.md, phases/05-nlp-foundations-to-advanced/04-glove-fasttext-subword/docs/en.md

| 任务 | 代码 |
|---|---|
| 计数矩阵 | `bag_of_words(docs, vocab)` |
| 单位长度的 TF-IDF 行 | `l2_normalize(tfidf(bow))` |
| 从零训练 skip-gram | `train(docs, dim=16, window=2, k_neg=5, epochs=100, lr=0.05, seed=0)` |
| 类比查询 | `analogy(vocab, W, "man", "king", "woman")` |
| 共现计数 | `build_cooccurrence(docs, window=5)` |
| 训练 GloVe | `glove_train(vocab, pair_counts, dim=16, epochs=100, lr=0.05, x_max=100, alpha=0.75, seed=0)` |
| FastText n-gram | `char_ngrams(word, n_min=3, n_max=6)` |
| 学习并应用 BPE | `apply_bpe("lowest", learn_bpe(corpus, k_merges=10))` |

## 生产中的库
type: annotated-code
lang: python
from: phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf/docs/en.md, phases/05-nlp-foundations-to-advanced/03-word-embeddings-word2vec/docs/en.md, phases/05-nlp-foundations-to-advanced/04-glove-fasttext-subword/docs/en.md

```python
tfidf = TfidfVectorizer().fit_transform(docs)  # IDF weights plus L2 norm
model = Word2Vec(sentences, vector_size=100, window=5,
                 min_count=1, sg=1, negative=5, workers=4, epochs=30)
model.wv.most_similar("cat", topn=3)           # nearest neighbours
fasttext.util.download_model("en", if_exists="ignore")
ft = fasttext.load_model("cc.en.300.bin")
ft.get_word_vector("zoomerapproved")           # OOV word still gets a vector
tok = AutoTokenizer.from_pretrained("gpt2")
tok.tokenize("unbelievably tokenized")         # Ġ marks a word boundary
```

## 公式
type: concepts
from: phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf/docs/en.md, phases/05-nlp-foundations-to-advanced/04-glove-fasttext-subword/docs/en.md

- **TF-IDF**：$\frac{\mathrm{count}(w \text{ in } d)}{|d|} \cdot \log\frac{N}{\mathrm{df}(w)}$
- **平滑 IDF**：$\log\frac{n+1}{d+1} + 1$。出现在每个文档中的词 IDF 仍为 1。
- **余弦**：L2 归一化行的点积。1 是相同，0 是正交。
- **GloVe 拟合**：$v_i \cdot v_j + b_i + b_j \approx \log X_{ij}$
- **GloVe 权重**：$f(x) = (x / x_{max})^{\alpha}$ 在低于 `x_max` 时，否则 1.0。
- **GloVe 输出**：`W + W_tilde`。两者之和胜过单独一张表。
- **FastText 向量**：该词字符 n-gram 向量之和。
- **BPE 词表**：`k` 次合并后是 `k + 256` 个 token。

## Vectorizer 旋钮
type: command-table
from: phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf/docs/en.md

| 命令 | 作用 |
|---|---|
| `ngram_range=(1, 2)` | 加入 bigram。通常有助于分类 |
| `min_df=2` | 丢掉出现在少于 2 个文档中的词 |
| `max_df=0.95` | 丢掉出现在超过 95% 文档中的词 |
| `stop_words="english"` | 内置停用词表。不适合情感分析 |
| `sublinear_tf=True` | 对重复词用 `1 + log(tf)` |
| `get_feature_names_out` | 列出词表各列 |

## 默认值与数字
type: defaults
from: phases/05-nlp-foundations-to-advanced/03-word-embeddings-word2vec/docs/en.md, phases/05-nlp-foundations-to-advanced/04-glove-fasttext-subword/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| gensim `vector_size` | 100 | 稠密向量通常是 100-300 |
| gensim `window` | 5 | 从零实现的代码用 2 |
| `negative`，`k_neg` | 5 | 每个正样本对的负样本数 |
| `sg` | 1 | Skip-gram。对罕见词更好 |
| 初始化标准差 | 0.1 | `rng.normal(0, 0.1, size=(vocab_size, dim))` |
| GloVe `x_max` | 100 | 达到或超过它的配对权重为 1.0 |
| GloVe `alpha` | 0.75 | 降低高频配对的权重 |
| FastText n-gram 长度 | 3 到 6 | 字符，带 `<` 和 `>` 标记 |

## 排障
type: troubleshooting
from: phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf/docs/en.md, phases/05-nlp-foundations-to-advanced/03-word-embeddings-word2vec/docs/en.md, phases/05-nlp-foundations-to-advanced/04-glove-fasttext-subword/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| "not good" 和 "excellent" 看起来一样 | BoW 丢掉了词序 | 加入 bigram 或使用嵌入 |
| `Zoomer-approved` 没有向量 | BoW 和 Word2Vec 中的 OOV | 使用 FastText 或 BPE |
| `bank` 两个意思共用一个向量 | 静态嵌入 | 使用上下文嵌入 |
| 长文档主导相似度 | 行未归一化 | 应用 `l2_normalize` |
| 否定信号丢失 | 去掉了停用词 | 做情感分析时保留停用词 |
| 范数低于 0.01 或高于 100 | 训练缺陷 | 标记该模型 |
| 生产输出悄悄变差 | Tokenizer 与模型不匹配 | 使用模型自带的 tokenizer |
| 稠密的 100k 文档矩阵放不下 | 过早转成稠密 | 保持稀疏 |

## 缩写
type: glossary
from: phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf/docs/en.md, phases/05-nlp-foundations-to-advanced/03-word-embeddings-word2vec/docs/en.md, phases/05-nlp-foundations-to-advanced/04-glove-fasttext-subword/docs/en.md

- **BoW**：Bag of Words。词表词的计数。顺序丢失。
- **TF / DF**：一个文档中的词频，以及含该词的文档数。
- **IDF**：inverse document frequency。降低到处出现的词的权重。
- **CBOW**：Continuous Bag of Words。由上下文预测中心词。
- **Skip-gram**：由中心词预测上下文。默认选择。
- **GloVe**：Global Vectors。分解共现矩阵。
- **OOV**：Out of vocabulary。Word2Vec 和 GloVe 会在上面失败。
- **BPE**：Byte-Pair Encoding。合并最频繁的相邻对，重复。

## 问题
type: qa
from: phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf/docs/en.md, phases/05-nlp-foundations-to-advanced/03-word-embeddings-word2vec/docs/en.md, phases/05-nlp-foundations-to-advanced/04-glove-fasttext-subword/docs/en.md

- **TF-IDF 什么时候仍然胜出？** 垃圾邮件、主题、日志、低数据、紧延迟、可解释输出。
- **为什么用负采样？** 对 100k 词做 softmax 太慢。用一个二分类任务替代。
- **类比为什么有效？** `(king - man)` 抓住了 "royal" 方向。把它加到 `woman` 上。
- **GloVe 还是 FastText？** 拼写错误、新词和丰富形态用 FastText。
- **微调时训练 tokenizer 吗？** 不。使用预训练模型的 tokenizer。

## 提示
type: tips
from: phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf/docs/en.md, phases/05-nlp-foundations-to-advanced/03-word-embeddings-word2vec/docs/en.md, phases/05-nlp-foundations-to-advanced/04-glove-fasttext-subword/docs/en.md

- 标注样本不足 500 时，从 TF-IDF 基线开始。
- 标注大约低于 50k 时，试试 TF-IDF 加权嵌入。
- 不要只靠类比准确率评判嵌入。加上一个下游测试。
- 下载预训练向量。你几乎从不自己训练 Word2Vec。
- GPT、BERT 和 T5 的 tokenizer 学习 30k-100k 次合并。
