# 词嵌入  从零实现 Word2Vec

> 基于这个想法,训练一个浅层的网络,几何结构就会显现.

**Type:** Build
**Languages:** Python
**先修要求：**阶段5 · 02 (BoW + TF-IDF),阶段3 · 03 (从零开始反传播)
**Time:** ~75 minutes

## 问题

 TF-IDF 知道`dog`和 `puppy`是不同的词. 它不知道它们的意思几乎相同.`dog`训练的类别,无法泛化到关于`puppy`评论. 你可以通过列出同义词来勉强弥补,但这会在罕见的术语,领域行言以及你没有预料的语言上失效.

你想要一种表达方式,让`dog`和 `puppy`在空间中落在很近.`king - man + woman`落在`queen`附近的.让一个在.`dog`上训练的模型可以免费把部分信号移动到`puppy`,我知道.

Word2Vec 给了我们这个空间. 两层神经网络,数万亿代币的训练运行,发表于2013年.

## 核心概念

**Distributional hypothesis**如果两个词出现相似的上下文中,它们很可能表示相似的意思.

两种形式,都在利用这个想法.

- **Skip-gram。**给定中心词,预测周围的词――窗户大小为2小时,`cat -> (the, sat, on)`,我知道.
- **CBOW (continuous bag of words)。**给定周围的词,预测中心词――`(the, sat, on) -> cat`,我知道.

跳转语法训练更慢,但对罕见词来说处理更好.

这个网络有一个隐藏层,没有非线性――输入是单热的向量――输出是单热的微量――训练完成后,你丢弃输出层――隐藏层重量就是嵌入式――

```
one-hot(center) ── W ──▶ hidden (d-dim) ── W' ──▶ softmax(vocab)
                          ^
                          this is the embedding
```

技巧在于:对100k个词做软最大价格高不可接受.**negative sampling**预测这个上下文词是否出现在这个中心词附近,是或否──每个训练对只采用少量负面的未共现的词,而不是对整个词表计算软max──


```figure
word-vector-arithmetic
```

## 构建它

### 步骤1:从语料生成训练对

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

窗户中的每个`(center, context)`双都是一个积极的训练样本.

### 步骤2:嵌入表

两个矩阵.`W`是中心词嵌入表 (你会保留那个)`W'`是上下文词表(通常会丢弃,有时会和`W`取平均) 〔

```python
import numpy as np


def init_embeddings(vocab_size, dim, seed=0):
    rng = np.random.default_rng(seed)
    W = rng.normal(0, 0.1, size=(vocab_size, dim))
    W_prime = rng.normal(0, 0.1, size=(vocab_size, dim))
    return W, W_prime
```

小随机初始化──词表大小10k、维度100比现实;用于教学时,50 词表 x 16 维已经足够看几何结构──

### 步骤3:负面样本目标

对每一个正面的对`(center, context)`随时采用`k`个词作为负面――训练模型,使积极上的点积`W[center] · W'[context]`较高,而负的上点积较低.

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

关键公式:正对 上的物流损失(希望 sigmoid 接近 1)加上负对 上的物流损失(希望 sigmoid 接近 0) ・・・渐变流向两个表中──完整推导在原论文中;如果你想真正记住它,就用纸笔推一遍──

### 步骤4: 在玩具体上训练

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

在大语料上训练足够长的时代后,分享下文的词语会得到类似的中心嵌入. 在玩具体上,你会隐藏看到这个效果. 在数十亿的代币上,你会非常明显看到它.

### 步骤5:类似性技巧

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

在预训练的300d谷歌新闻向量上:

```python
>>> analogy(vocab, W, "man", "king", "woman")
[('queen', 0.71), ('monarch', 0.62), ('princess', 0.59), ...]
```

`king - man + woman = queen`由于模型,所以知道什么是王室.`(king - man)`抓到了类似皇家的东西,把它加上了.`woman`上,会落到皇室女性附近的区域.

## 使用它

从零写 Word2Vec 是为了教学.`gensim`,我知道.

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

在真实工作中,你几乎没有自己训练 Word2Vec──你会下载预训练向量──

- **GloVe**斯坦福的共发生矩阵因子化方法──50d、100d、200d、300d检查点──通用覆盖很好──课堂04 会专门讲全球──
- **fastText**Facebook对Word2Vec的扩展,会嵌字符n-grams──通过组合子词来处理词汇库之外的词语──课04──
- **Pretrained Word2Vec on Google News** 300d,3M 词表,2013年发布──至今仍每天被下载──

### 现在,2026年,Word2Vec仍然是胜利的场景.

- 轻量级领域的特定检索――在笔记本电脑上使用一小时训练医学摘要,得到通用模型 捕捉不到的专用向量――
- 类似的特征工程`gender_vector = mean(man - woman pairs)`△从其他词中减去它,得到一个性别中立的轴.
- 可解释性──100d 足够小,可以通过PCA或t-SNE绘图,并实际看到集群形成──
- 任何必须在设备端,没有GPU 条件下运行推断的地方――Word2Vec搜索只是一次单行搜索――

### Word2Vec 的失败之处

聚性 这堵墙`bank`只有一个向量.`river bank`和 `financial bank`它们是我的.`table`基于这个向量 区分不同词义──

基于周围的下文为单词的每次出现产生不同的向量,解决了这个问题.

问题是另一个失败点.`Zoomer-approved`在训练数据中,Word2Vec 就从来没有见过它.没有倒退.

## 交付它

保存为`outputs/skill-embedding-probe.md`其他:

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

1. **Easy.**在一个小的体积中,20个关于猫和狗的句子) 上运行训练循环.200个时代后,验证.`nearest(vocab, W, W[vocab["cat"]])`返回结果的前3名中包含`dog`如果没有,增加时代或词表
2. **Medium.**添加高频词子样本──频率高于 `10^-5`词会以其频率比例的概率从训练对中丢弃.
3. **Hard.**在20个新闻组体上训练一个模型――计算两个偏差轴:`he - she`和 `doctor - nurse`△把职业词语投影到这两个轴上. 报告哪些职业的偏差最大.

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

- [Mikolov et al. (2013). Distributed Representations of Words and Phrases and their Compositionality](https://arxiv.org/abs/1310.4546)负面样本论文──短且易读──
- [Rong, X. (2014). word2vec Parameter Learning Explained](https://arxiv.org/abs/1411.2738) 如果原文的数学让你觉得密集,这是对格拉迪恩斯最清晰的推.
- [gensim Word2Vec tutorial](https://radimrehurek.com/gensim/models/word2vec.html) 实际有效的生产训练设置.
