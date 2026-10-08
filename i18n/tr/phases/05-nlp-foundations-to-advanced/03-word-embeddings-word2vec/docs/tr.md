# Word Embeddings  Word2Vec'i sıfırdan gerçekleştirmek

> Bu düşünceye dayanarak, bir derinlik içindeki ağ, geometrik yapı ortaya çıkar.

**Type:** Build
**Languages:** Python
**先修要求：**5 · 02 aşaması (BoW + TF-IDF), 3 · 03 aşaması (Çoktan geri yayılma)
**Time:** ~75 minutes

## 问题

TF-IDF                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `dog`和 `puppy`Farklı kelimeler var. Ama anlamları neredeyse aynı.`dog`Üncelik sınıflandırıcısı, hakkında genel olarak ifade edilemez.`puppy`Bu, nadir kelimeler ve düşünmediğiniz dillerde başarısız olur.

Bir ifade biçimi istiyorsun,让 `dog`和 `puppy`Uzayda çok yakındı.`king - man + woman`- Ben de öyleyim .`queen`Yakınlıkta bir tane olsun.`dog`Üst eğitim modelinin bir kısmını serbestçe sinyallere aktarmak için kullanılabilir.`puppy`- Evet.

Word2Vec bize bu alanı verdi. İki katlı sinir ağı, trilyonlarca tokenli bir eğitim çalışması, 2013 yılında yayınlandı. Bu yapı basit ve neredeyse hoş olmayan bir yapıydı.

## 核心概念

**Distributional hypothesis**Bir kelimenin, bir şirket tarafından bilinmesi gerekir. Eğer iki kelime bir diğerine benzerse, muhtemelen aynı anlamda ifade edilir.

Word2Vec'in iki şekli var, hep bu fikri kullanıyorum.

- **Skip-gram。**给定中心词,预测周围的词──窗户大小为2时,`cat -> (the, sat, on)`- Evet.
- **CBOW (continuous bag of words)。**给定周围的词,预测中心词──`(the, sat, on) -> cat`- Evet.

Skip-gram trenman daha yavaş, ama nadir kelimeler için daha iyi işlenir.

Bu ağda gizli bir katman var, hiçbir bağlantısızlık yoktur. Giriş kelimenin üzerinde sıcak bir vektördür.

```
one-hot(center) ── W ──▶ hidden (d-dim) ── W' ──▶ softmax(vocab)
                          ^
                          this is the embedding
```

技巧在于: 100k 个词做软max 价格高不可接受──Word2Vec 使用 **negative sampling**, onu ikili bir sınıflandırma 任务──预测这个上下文词是否出现这个中心词附近,是或否──每个训练对只采样少量负面未共现)词,而不是对整个词表计算软max──


```figure
word-vector-arithmetic
```

## Yapın onu.

### 步骤 1:语料 oluşturmak için eğitim çiftleri

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

窗中的每个 `(center, context)`Çiftlik bir pozitif eğitim örneğidir.

### 步骤 2:Embedding tabloları

İki Matrix.`W`Evet, bu da bir şey.`W'`Yukarıdaki kelimeler genellikle terk edilir, bazen de geçer.`W`取平均) ⋅

```python
import numpy as np


def init_embeddings(vocab_size, dim, seed=0):
    rng = np.random.default_rng(seed)
    W = rng.normal(0, 0.1, size=(vocab_size, dim))
    W_prime = rng.normal(0, 0.1, size=(vocab_size, dim))
    return W, W_prime
```

Küçük zamanlı başlangıçlar. Sözcük sayısı: 10k, boyut 100 gerçekle karşılaştırıldığında; öğretim sırasında kullanılırken, 50 字表 x 16 维已经足够看几何结构──

### 步骤 3: negatif örnekleme amacı

Her olumlu çift için .`(center, context)`, sözcük gösteriminden `k`个词作为负面──训练模型,使积极上的点积 `W[center] · W'[context]`较高,而负上点积较低――

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

关键公式: pozitif çift 上的物流 Loss(希望 sigmoid 接近 1)加上负面对 上的物流 Loss(希望 sigmoid 接近 0) ・・・ Gradient 流向两个表──完整推导在原论文中; Eğer gerçekten hatırlıyorsan,就用纸笔推一遍──

### 4 adım: Oyuncak vücudu üzerinde eğitim

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

Büyük bir dil üzerinde eğitim yeterince uzun bir dönem sonra, paylaşım aşağıdaki kelimeler benzer merkezi yerleşimler elde edecektir. Oyuncak korpusunda, bu etkeni gizlice göreceksiniz.

### 步骤 5: Analogie 技巧

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

Önceden eğitim 300d Google Haber vektörleri yukarı:

```python
>>> analogy(vocab, W, "man", "king", "woman")
[('queen', 0.71), ('monarch', 0.62), ('princess', 0.59), ...]
```

`king - man + woman = queen`Vector'dan dolayı değil.`(king - man)`Kral gibi bir şey yakalayıp onu da ekle.`woman`Ü, kral-kadın bölgesine düşecek.

## Kullan

Word2Vec öğretim için yazılmaktadır.`gensim`- Evet.

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

Gerçek işlerde, neredeyse kendinizi eğitmiyorsunuz Word2Vec──you will download pre-training vectors──

- **GloVe**Stanford'un ortak oluşu-matriks faktörleştirme yöntemi: 50d、100d、200d、300d kontrol noktaları:
- **fastText** Facebook için Word2Vec'in genişlemesi, Embedding字符 n-grams──通过组合子词来处理词汇外的词语──Lesson 04──
- **Pretrained Word2Vec on Google News** 300d,3M 词表,2013年发布──至今仍每天被下载──

### Word2Vec 2026 yılında hâlâ kazanma sahnesi

- 轻量级领域特定检索――在笔记本电脑上用一小时训练医学摘要,得到通用模型 捕捉不到的专用向量――
- Analogie 风格的特征工程──`gender_vector = mean(man - woman pairs)`                                                                                                                                                                                                                                                              
- 可解释性──100d 足足小, PCA veya t-SNE 绘图,并实际看到集群形成──
- 任何必须在设备端、无GPU 条件下运行推断的地方──Word2Vec arama 只是一次单行搜索──

### Word2Vec'in başarısızlıkları

Bu bir duvar.`bank`Sadece bir vektör var.`river bank`和 `financial bank`Onunla birlikte.`table`(tablo vs mobilya) ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎

Konekstel Eklentiler (ELMo、BERT ve sonrasında her Transformer) etrafındaki kelimelerin her kez ortaya çıkmasına dayanarak, bu sorunu çözdü. Bu, Word2Vec'ten BERT'in sıçrayışından: statikten bağlamlara doğru.

Sözcükten çıkmış bir konu, başka bir başarısızlık noktasıdır.`Zoomer-approved`Bu nedenle, bu konuyu daha önce hiç görmemiştim.

## - Söyle.

保存为 `outputs/skill-embedding-probe.md`- ...

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

1. **Easy.**Bir küçük kurpusda (Büyük bir eğitim döngüsü)`nearest(vocab, W, W[vocab["cat"]])`返回結果'ın en üst 3 içeren `dog`Eğer yoksa, daha fazla zaman veya sözcük göstermek.
2. **Medium.**添加高频词 alt örnekleme──频率高于 `10^-5`Sözcüklerin sıklık oranı oranı, eğitim çiftlerinden atılmasının olasılıklarını ölçerek nadir kelime benzerliğine etkisini ölçer.
3. **Hard.**20 Haber Grubları korpusı 上训练一个模型――计算两个偏差轴:`he - she`和 `doctor - nurse`◊ İş sözcüklerini                                                                                                                                                                                                                                                            

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

- [Mikolov et al. (2013). Distributed Representations of Words and Phrases and their Compositionality](https://arxiv.org/abs/1310.4546) negatif örnekleme 论文。短且易读。
- [Rong, X. (2014). word2vec Parameter Learning Explained](https://arxiv.org/abs/1411.2738)Eğer matematik seni yoğun hissettirirse, bu Gradients'e en net bir öneridir.
- [gensim Word2Vec tutorial](https://radimrehurek.com/gensim/models/word2vec.html) 实际有效的生产训练设置──
