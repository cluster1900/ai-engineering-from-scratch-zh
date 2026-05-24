# Word Embeddings — 从零实现 Word2Vec

> 一个词由它周围的词定义。基于这个想法训练一个浅层 net，几何结构就会显现出来。

**Type:** Build
**Languages:** Python
**先修要求：** Phase 5 · 02 (BoW + TF-IDF), Phase 3 · 03 (Backpropagation from Scratch)
**Time:** ~75 minutes

## 问题

TF-IDF 知道 `dog` 和 `puppy` 是不同的词。它不知道它们的意思几乎相同。一个在 `dog` 上训练的 classifier，无法泛化到关于 `puppy` 的评论。你可以通过列出同义词来勉强弥补，但这会在罕见术语、领域行话以及所有你没有预想到的语言上失效。

你想要一种表示方式，让 `dog` 和 `puppy` 在空间中落得很近。让 `king - man + woman` 落在 `queen` 附近。让一个在 `dog` 上训练的 model 能免费把一部分信号迁移到 `puppy`。

Word2Vec 给了我们这个空间。两层 Neural Network，trillion-token 训练运行，发表于 2013 年。这个架构简单到几乎令人不好意思。它的结果重塑了此后十年的 NLP。

## 核心概念

**Distributional hypothesis**（Firth，1957）：“You shall know a word by the company it keeps.” 如果两个词出现在相似的上下文中，它们很可能表示相似的意思。

Word2Vec 有两种形式，都在利用这个想法。

- **Skip-gram。** 给定中心词，预测周围的词。窗口大小为 2 时，`cat -> (the, sat, on)`。
- **CBOW (continuous bag of words)。** 给定周围的词，预测中心词。`(the, sat, on) -> cat`。

Skip-gram 训练更慢，但对罕见词处理得更好。它成了默认选择。

这个网络有一个隐藏层，没有非线性。输入是词表上的 one-hot Vector。输出是词表上的 softmax。训练完成后，你丢弃输出层。隐藏层权重就是 Embeddings。

```
one-hot(center) ── W ──▶ hidden (d-dim) ── W' ──▶ softmax(vocab)
                          ^
                          this is the embedding
```

技巧在于：对 100k 个词做 softmax 代价高得不可接受。Word2Vec 使用 **negative sampling**，把它变成一个 binary Classification 任务。预测“这个上下文词是否出现在这个中心词附近，是或否”。每个训练 pair 只采样少量 negative（未共现）词，而不是对整个词表计算 softmax。

## 构建它

### 步骤 1：从语料生成训练 pairs

```python
def skipgram_pairs(docs, window=2):
    pairs = []
    for doc in docs:
        for i, center in enumerate(doc):
            for j in range(max(0, i - window), min(len(doc), i + window + 1)):
                if i == j:
                    continue
                pairs.append((center, doc[j]))
    return pairs
```

```python
>>> skipgram_pairs([["the", "cat", "sat", "on", "mat"]], window=2)
[('the', 'cat'), ('the', 'sat'),
 ('cat', 'the'), ('cat', 'sat'), ('cat', 'on'),
 ('sat', 'the'), ('sat', 'cat'), ('sat', 'on'), ('sat', 'mat'),
 ...]
```

窗口中的每个 `(center, context)` pair 都是一个 positive 训练样本。

### 步骤 2：Embedding tables

两个 Matrix。`W` 是中心词 Embedding table（你会保留的那一个）。`W'` 是上下文词 table（通常会丢弃，有时会和 `W` 取平均）。

```python
import numpy as np


def init_embeddings(vocab_size, dim, seed=0):
    rng = np.random.default_rng(seed)
    W = rng.normal(0, 0.1, size=(vocab_size, dim))
    W_prime = rng.normal(0, 0.1, size=(vocab_size, dim))
    return W, W_prime
```

小随机初始化。词表大小 10k、维度 100 比较现实；用于教学时，50 词表 x 16 维已经足够看到几何结构。

### 步骤 3：negative sampling objective

对每个 positive pair `(center, context)`，从词表中随机采样 `k` 个词作为 negatives。训练 model，使 positive 上的点积 `W[center] · W'[context]` 较高，而 negative 上的点积较低。

```python
def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-np.clip(x, -20, 20)))


def train_pair(W, W_prime, center_idx, context_idx, negative_indices, lr):
    v_c = W[center_idx]
    u_pos = W_prime[context_idx]
    u_negs = W_prime[negative_indices]

    pos_score = sigmoid(v_c @ u_pos)
    neg_scores = sigmoid(u_negs @ v_c)

    grad_center = (pos_score - 1) * u_pos
    for i, u in enumerate(u_negs):
        grad_center += neg_scores[i] * u

    W[context_idx] = W[context_idx]
    W_prime[context_idx] -= lr * (pos_score - 1) * v_c
    for i, neg_idx in enumerate(negative_indices):
        W_prime[neg_idx] -= lr * neg_scores[i] * v_c
    W[center_idx] -= lr * grad_center
```

关键公式：positive pair 上的 logistic Loss（希望 sigmoid 接近 1）加上 negative pairs 上的 logistic Loss（希望 sigmoid 接近 0）。Gradients 流向两个 tables。完整推导在原论文中；如果你想真正记住它，就用纸笔推一遍。

### 步骤 4：在 toy corpus 上训练

```python
def train(docs, dim=16, window=2, k_neg=5, epochs=100, lr=0.05, seed=0):
    vocab = build_vocab(docs)
    vocab_size = len(vocab)
    rng = np.random.default_rng(seed)
    W, W_prime = init_embeddings(vocab_size, dim, seed=seed)
    pairs = skipgram_pairs(docs, window=window)

    for epoch in range(epochs):
        rng.shuffle(pairs)
        for center, context in pairs:
            c_idx = vocab[center]
            ctx_idx = vocab[context]
            negs = rng.integers(0, vocab_size, size=k_neg)
            negs = [n for n in negs if n != ctx_idx and n != c_idx]
            train_pair(W, W_prime, c_idx, ctx_idx, negs, lr)
    return vocab, W
```

在大语料上训练足够多 epoch 后，共享上下文的词会得到相似的中心 Embeddings。在 toy corpus 上，你会隐约看到这个效果。在 billions of tokens 上，你会非常明显地看到它。

### 步骤 5：analogy 技巧

```python
def nearest(vocab, W, target_vec, topk=5, exclude=None):
    exclude = exclude or set()
    inv_vocab = {i: w for w, i in vocab.items()}
    norms = np.linalg.norm(W, axis=1, keepdims=True) + 1e-9
    W_norm = W / norms
    target = target_vec / (np.linalg.norm(target_vec) + 1e-9)
    sims = W_norm @ target
    order = np.argsort(-sims)
    out = []
    for i in order:
        if i in exclude:
            continue
        out.append((inv_vocab[i], float(sims[i])))
        if len(out) == topk:
            break
    return out


def analogy(vocab, W, a, b, c, topk=5):
    v = W[vocab[b]] - W[vocab[a]] + W[vocab[c]]
    return nearest(vocab, W, v, topk=topk, exclude={vocab[a], vocab[b], vocab[c]})
```

在预训练的 300d Google News vectors 上：

```python
>>> analogy(vocab, W, "man", "king", "woman")
[('queen', 0.71), ('monarch', 0.62), ('princess', 0.59), ...]
```

`king - man + woman = queen`。不是因为 model 知道什么是王室。是因为 Vector `(king - man)` 捕捉到了类似“royal”的东西，把它加到 `woman` 上，会落到 royal-female 区域附近。

## 使用它

从零写 Word2Vec 是为了教学。生产级 NLP 使用 `gensim`。

```python
from gensim.models import Word2Vec

sentences = [
    ["the", "cat", "sat", "on", "the", "mat"],
    ["the", "dog", "ran", "across", "the", "room"],
]

model = Word2Vec(
    sentences,
    vector_size=100,
    window=5,
    min_count=1,
    sg=1,
    negative=5,
    workers=4,
    epochs=30,
)

print(model.wv["cat"])
print(model.wv.most_similar("cat", topn=3))
```

在真实工作中，你几乎从不自己训练 Word2Vec。你会下载预训练 vectors。

- **GloVe** — Stanford 的 co-occurrence-matrix factorization 方法。50d、100d、200d、300d checkpoints。通用覆盖很好。Lesson 04 会专门讲 GloVe。
- **fastText** — Facebook 对 Word2Vec 的扩展，会Embedding字符 n-grams。通过组合 subwords 来处理 out-of-vocabulary words。Lesson 04。
- **Pretrained Word2Vec on Google News** — 300d，3M 词表，2013 年发布。至今仍然每天被下载。

### Word2Vec 在 2026 年仍然胜出的场景

- 轻量级领域特定 retrieval。在 laptop 上用一小时训练 medical abstracts，得到通用 model 捕捉不到的专用 vectors。
- Analogy 风格的 feature engineering。`gender_vector = mean(man - woman pairs)`。从其他词中减去它，得到一个 gender-neutral axis。公平性研究中仍在使用。
- 可解释性。100d 足够小，可以通过 PCA 或 t-SNE 绘图，并实际看到 clusters 形成。
- 任何必须在设备端、无 GPU 条件下运行 inference 的地方。Word2Vec lookup 只是一次单行 fetch。

### Word2Vec 的失败之处

polysemy 这堵墙。`bank` 只有一个 Vector。`river bank` 和 `financial bank` 共用它。`table`（spreadsheet vs. furniture）也共用它。下游 classifier 无法仅凭这个 Vector 区分不同词义。

Contextual Embeddings（ELMo、BERT 以及之后的每个 Transformer）通过基于周围上下文为单词的每次出现生成不同 Vector，解决了这个问题。这就是从 Word2Vec 到 BERT 的跃迁：从 static 到 contextual。Phase 7 会讲 Transformer 的另一半。

out-of-vocabulary 问题是另一个失败点。如果 `Zoomer-approved` 不在训练数据中，Word2Vec 就从未见过它。没有 fallback。fastText 用 subword composition 解决了这个问题（lesson 04）。

## 交付它

保存为 `outputs/skill-embedding-probe.md`：

```markdown
---
name: embedding-probe
description: 检查 word2vec model。运行 analogies，查找 neighbors，诊断质量。
version: 1.0.0
phase: 5
lesson: 03
tags: [nlp, embeddings, debugging]
---

你会探查训练好的 word embeddings，以验证它们是否正常工作。给定一个 `gensim.models.KeyedVectors` 对象和一个词表，你会运行：

1. 三个标准 analogy 测试。`king : man :: queen : woman`。`paris : france :: tokyo : japan`。`walking : walked :: swimming : ?`。报告 top-1 结果及其 cosine。
2. 对用户提供的领域特定词运行五个 nearest-neighbor 测试。打印 top-5 neighbors 及其 cosines。
3. 一个对称性检查。`similarity(a, b) == similarity(b, a)`，误差在 float precision 范围内。
4. 一个退化检查。如果任何 embedding 的 norm 低于 0.01 或高于 100，则 model 存在训练 bug。标记出来。

拒绝仅凭 analogy accuracy 就宣布 model 很好。Analogy benchmarks 可以被投机优化，并且不会迁移到下游任务。建议同时进行 intrinsic + downstream evaluation。
```

## 练习

1. **Easy.** 在一个 tiny corpus（20 个关于 cats 和 dogs 的句子）上运行训练循环。200 个 epochs 后，验证 `nearest(vocab, W, W[vocab["cat"]])` 返回结果的 top 3 中包含 `dog`。如果没有，增加 epochs 或词表。
2. **Medium.** 添加高频词 subsampling。频率高于 `10^-5` 的词会以与其频率成比例的概率从训练 pairs 中丢弃。衡量它对 rare-word similarity 的影响。
3. **Hard.** 在 20 Newsgroups corpus 上训练一个 model。计算两个 bias axes：`he - she` 和 `doctor - nurse`。把 occupation words 投影到这两个 axes 上。报告哪些 occupations 的 bias gap 最大。这是公平性研究人员会使用的那类 probe。

## 关键术语

| Term | 人们通常怎么说 | 它实际是什么意思 |
|------|-----------------|-----------------------|
| Word embedding | Word as a Vector | 一种从上下文中学习到的 dense、low-dim（通常 100-300）表示。 |
| Skip-gram | Word2Vec 技巧 | 从中心词预测上下文词。比 CBOW 慢，但对罕见词更好。 |
| Negative sampling | 训练捷径 | 用针对 `k` 个随机词的 binary Classification，替代对完整词表的 softmax。 |
| Static embedding | 每个词一个 Vector | 无论上下文如何都是同一个 Vector。会在 polysemy 上失效。 |
| Contextual embedding | 对上下文敏感的 Vector | 基于周围词，为每次出现生成不同 Vector。这是 transformers 产生的东西。 |
| OOV | Out of vocabulary | 训练中没见过的词。Word2Vec 无法为这些词产生 Vector。 |

## 延伸阅读

- [Mikolov et al. (2013). Distributed Representations of Words and Phrases and their Compositionality](https://arxiv.org/abs/1310.4546) — negative-sampling 论文。短且易读。
- [Rong, X. (2014). word2vec Parameter Learning Explained](https://arxiv.org/abs/1411.2738) — 如果原论文的数学让你觉得密集，这是对 Gradients 最清晰的推导。
- [gensim Word2Vec tutorial](https://radimrehurek.com/gensim/models/word2vec.html) — 实际有效的生产训练设置。
