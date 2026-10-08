# Word Embeddings  Từ từ thực hiện Word2Vec

> Một từ được định nghĩa bởi những từ xung quanh nó. Dựa trên ý tưởng này, một mạng lưới tầng thấp, các cấu trúc hình học sẽ xuất hiện.

**Type:** Build
**Languages:** Python
**先修要求：**Giai đoạn 5 · 02 (BoW + TF-IDF), Giai đoạn 3 · 03 (Tăng ngược từ đầu)
**Time:** ~75 minutes

## 问题

TF-IDF 知道 `dog`和 `puppy`Đó là một từ khác nhau. Nó không biết ý nghĩa của chúng gần như giống nhau.`dog`Ưu điểm của bài tập, không thể được tổng hợp về`puppy`Bạn có thể khắc phục bằng cách liệt kê các từ ngữ có cùng nghĩa, nhưng điều này sẽ không hiệu quả trong các thuật ngữ hiếm gặp, trong lĩnh vực nói và tất cả các ngôn ngữ bạn không nghĩ rằng bạn sẽ có.

Anh muốn một cách biểu diễn,让 `dog`和 `puppy`Trong không gian, nó rất gần.`king - man + woman`落在 `queen`附近──让一个在 `dog`Mô hình trên có thể chuyển một phần tín hiệu miễn phí đến`puppy`

Word2Vec đã cho chúng ta không gian này. 2 tầng mạng thần kinh, hàng nghìn tỷ token được đào tạo, được xuất bản vào năm 2013.

## 核心概念

**Distributional hypothesis**(First, 1957): Bạn sẽ biết một từ bởi công ty nó giữ. Nếu hai từ xuất hiện giống nhau trên văn bản dưới, chúng rất có thể biểu hiện giống nhau ý nghĩa.

Word2Vec có hai hình thức, tất cả mọi người đang sử dụng ý tưởng này.

- **Skip-gram。**给定中心词,预测周围的词──窗户大小为2 时,`cat -> (the, sat, on)`
- **CBOW (continuous bag of words)。**给定周围的词,预测中心词――`(the, sat, on) -> cat`

Skip-gram  luyện tập chậm hơn, nhưng đối với những từ hiếm gặp xử lý tốt hơn.

Trong mạng này có một lớp ẩn, không có không dây. Nhập là một khối lượng nóng trên bảng chữ cái.

```
one-hot(center) ── W ──▶ hidden (d-dim) ── W' ──▶ softmax(vocab)
                          ^
                          this is the embedding
```

技巧在于: đối với 100k 个词做软max 价格高不可接受──Word2Vec 使用 **negative sampling**, biến nó thành một phân loại nhị phân 任务──预测 这个上下文词是否出现这个中心词附近,是或否── mỗi cặp huấn luyện chỉ采样少量负面(未共现)词, thay vì tính toán mềmmax đối với toàn bộ词表──


```figure
word-vector-arithmetic
```

##  xây dựng nó

### 步骤 1: từ语料 tạo các cặp huấn luyện

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

窗中的每个 `(center, context)`cặp đều là một mô hình tập luyện tích cực.

### 步骤 2:Tảng nhúng

Hai Matrix.`W`是中心词 嵌入表 (你会保留那个)`W'`là trên bảng từ dưới đây thường bị bỏ rơi, đôi khi gặp gỡ và`W`取平均) ⋅

```python
import numpy as np


def init_embeddings(vocab_size, dim, seed=0):
    rng = np.random.default_rng(seed)
    W = rng.normal(0, 0.1, size=(vocab_size, dim))
    W_prime = rng.normal(0, 0.1, size=(vocab_size, dim))
    return W, W_prime
```

Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ước tính: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm:

### 步骤 3: mục tiêu lấy mẫu tiêu cực

Đối với mỗi cặp tích cực`(center, context)`, Từ từ biểu diễn trong bất cứ khi nào`k`个词作为负面──训练模型,使积极 上的点积 `W[center] · W'[context]`较高,而负的上点积较低.

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

关键公式: cặp dương 上的物流损失(希望 sigmoid 接近 1)加上负对 上的物流损失(希望 sigmoid 接近 0) ・・・Gradients 流向两个表──完整推导在原论文中; Nếu bạn nghĩ thực sự ghi nhớ nó, hãy dùng giấy ghi lại lại lại──

### Bước 4: tập luyện trên bộ đồ chơi

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

Trong quá trình tập luyện trên các ngôn ngữ lớn đủ thời gian, chia sẻ trên các từ dưới đây sẽ có được các nhúng giống nhau trung tâm trên cơ thể đồ chơi, bạn sẽ ẩn ý thấy hiệu quả này trên hàng tỷ token, bạn sẽ thấy nó rất rõ ràng.

### 步骤 5: Analogy 技巧

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

Trong bài tập trước 300d Google News vector trên:

```python
>>> analogy(vocab, W, "man", "king", "woman")
[('queen', 0.71), ('monarch', 0.62), ('princess', 0.59), ...]
```

`king - man + woman = queen`Không phải vì mô hình 知道是王室 而是因为 Vector`(king - man)`n bắt được thứ giống như hoàng gia, đưa nó lên `woman`上,会落到皇室女区附近.

## Sử dụng nó

Từ viết từ零 Word2Vec là để dạy.`gensim`

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

Trong thực tế, bạn hầu như không tự tập Word2Vec. Bạn sẽ tải xuống các vector huấn luyện trước.

- **GloVe** Stanford's co-occurrence-matrix factorization 方法──50d、100d、200d、300d checkpoints──通用覆盖很好──Lesson 04 会专门讲 GloVe──
- **fastText** Facebook đối với Word2Vec mở rộng, sẽEmbedding字符 n-grams── thông qua bộ hợp phụ từ để xử lý từ ngoài từ vựng──Lớp 04──
- **Pretrained Word2Vec on Google News** 300d,3M 词表,2013年发布──至今仍每天被下载──

### Word2Vec trong năm 2026 vẫn còn chiến thắng

- 轻量级领域特定检索――在笔记本电脑上使用一小时训练医学摘要,得到通用模型 捕捉不到的专用向量――
- Phân tích 风格的特征工程──`gender_vector = mean(man - woman pairs)` Từ từ khác giảm nó, có được một trục trung lập về giới tính trong nghiên cứu công bằng vẫn còn được sử dụng
- 可解释性──100d 足够小, có thể qua PCA hoặc t-SNE 绘图,并实际看到集群形成──
- 任何必须在设备端、无GPU 条件下运行推断的地方──Word2Vec tìm kiếm 只是一次单行搜索──

### Word2Vec's thất bại

- Thường này là một bức tường.`bank`Chỉ có một vector thôi.`river bank`和 `financial bank`Cùng dùng nó.`table`(spreadsheet vs. furniture) cũng dùng nó.

Các kết hợp ngữ cảnh (ELMo、BERT và sau đó mỗi Transformer) bằng cách tạo ra các vector khác nhau cho mỗi lần xuất hiện của từ ngữ dựa trên xung quanh trên các bài viết dưới đây, giải quyết vấn đề này.

- Không có từ vựng  vấn đề là một điểm thất bại khác.`Zoomer-approved`Không trong dữ liệu đào tạo, Word2Vec 就从未见过它──没有倒退──fastText 使用字母组合 解决了这个问题(课04〕

## 交付 nó

保存为 `outputs/skill-embedding-probe.md`- Có thể là:

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

1. **Easy.**Trong một tập hợp nhỏ ((20 câu về mèo và chó) trên hành trình tập luyện vòng lặp.`nearest(vocab, W, W[vocab["cat"]])`返回结果的前三中包含 `dog`Nếu không, tăng thời đại hoặc từ表.
2. **Medium.**添加高频词 phụ mẫu.`10^-5`Từ sẽ được bỏ qua trong các cặp tập luyện theo tỷ lệ tỷ lệ tương ứng tần suất của nó.
3. **Hard.**Trong 20 Newsgroups corpus 上训练一个模型――计算两个偏差轴:`he - she`和 `doctor - nurse`◊把 nghề nghiệp từ 投投向这两个轴上――报告哪些职业的偏差最大――这是公平性研究人员会使用的类型调查――

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

- [Mikolov et al. (2013). Distributed Representations of Words and Phrases and their Compositionality](https://arxiv.org/abs/1310.4546) tiêu cực-chọn mẫu 论文。短且易读。
- [Rong, X. (2014). word2vec Parameter Learning Explained](https://arxiv.org/abs/1411.2738)Nếu toán học của bài luận nguyên bản khiến bạn cảm thấy mật thiết, đây là hướng dẫn rõ ràng nhất đối với Gradients.
- [gensim Word2Vec tutorial](https://radimrehurek.com/gensim/models/word2vec.html) 实际有效的生产训练设置──
