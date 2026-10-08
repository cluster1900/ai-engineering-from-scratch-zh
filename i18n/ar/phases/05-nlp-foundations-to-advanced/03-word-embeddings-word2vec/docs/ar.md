# Word Embeddings  من الصفر لتحقيق Word2Vec

> تعريف كلمة من قبل الكلمات المحيطة بها. بناء على هذه الفكرة تدريب على شبكة سطحية، والهيكل الهرمي سوف تظهر.

**Type:** Build
**Languages:** Python
**先修要求：**المرحلة 5 · 02 (BoW + TF-IDF) ، المرحلة 3 · 03 (الانتشار الخلفي من الصفر)
**Time:** ~75 minutes

## 问题

TF-IDF  知道 `dog`和 `puppy`إنها كلمة مختلفة. لا تعرف معناها تقريباً.`dog`تصنيف التدريبات العليا، لا يمكن أن يتناسب مع`puppy`يمكنك أن تُعالج ذلك عن طريق إعداد المفاهيم، ولكن هذا لن ينجح في لغات نادرة، أو في مجال الكلام، أو في لغات لم تتوقعيها.

أنت تريد طريقة للتعبير،让 `dog`和 `puppy`في الفضاء سقطت قريبة جدا.`king - man + woman`-أقف في`queen`附近──让一个在 `dog`نموذج التدريب العلوي يمكن تحويل جزء من الإشارة إلى`puppy`.

Word2Vec  أعطى لنا هذا الفضاء ∙ دو لاير شبكة عصبية، تريليونات الرموز  تدريب تشغيل، نشرت في عام 2013 ∙ هذا الإطار بسيط إلى غير مقنع تقريبا ∙

## مفهوم الأساسي

**Distributional hypothesis**(أول، 1957): يجب أن تعرف كلمة من قبل الشركة التي تحتفظ بها.

كلمة2Vec هناك نوعان من الأشكال، كلنا نستخدم هذه الفكرة

- **Skip-gram。**给定中心词,预测周围的词──窗口大小为2 时,`cat -> (the, sat, on)`.
- **CBOW (continuous bag of words)。**给定周围的词,预测中心词――`(the, sat, on) -> cat`.

تمارس المادة بشكل أبطأ، ولكن معالجتها أفضل من الكلمات النادرة.

هذا الشبكة لديها طبقة مخفية، لا توجد طبقة غير خليوية. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

```
one-hot(center) ── W ──▶ hidden (d-dim) ── W' ──▶ softmax(vocab)
                          ^
                          this is the embedding
```

技巧在于: لـ 100k 个词做软max 价格高不可接受──Word2Vec 使用 **negative sampling**، تحويلها إلى تصنيف ثنائي 任务──预测 هل هذا العبارة التالية تعود إلى هذا المركز لفظ قريبة، نعم أو لا── كل زوج من التدريبات فقط تقتصر على كمية قليلة من السلبيات


```figure
word-vector-arithmetic
```

## بناءها

### الخطوة 1: من لغة إنتاج التدريب أزواج

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

كلّ شخص في النافذة`(center, context)`زوجة مثيرة للإعجاب

### 步骤 2:جداول الإدراج

ماتركس`W`هو مركز كلمة طاولة إضافة (تحتفظ بالواحدة)`W'`هو على جدول الكلمات`W`取平均)

```python
import numpy as np


def init_embeddings(vocab_size, dim, seed=0):
    rng = np.random.default_rng(seed)
    W = rng.normal(0, 0.1, size=(vocab_size, dim))
    W_prime = rng.normal(0, 0.1, size=(vocab_size, dim))
    return W, W_prime
```

微随机初始化──词表大小 10k、维度 100比较现实;用于教学时,50 词表 x 16 维已经足够看几何结构──

### الخطوة 3: هدف أخذ العينات السلبي

لكل زوج إيجابي`(center, context)`, من كلمة表中随机采样 `k`个词作为负面──训练模型,使积极上的点积 `W[center] · W'[context]`较高,而负 上的点积较低──

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

关键公式: زوج إيجابي 上的物流损失(希望 sigmoid 接近 1)加上负对 上的物流损失(希望 sigmoid 接近 0) ・・・الجدران 流向两个表──完整推导在原论文中; إذا كنت تفكر حقا تذكر ذلك،就用纸笔推一遍──

### الخطوة الرابعة: تدريب على جسم الألعاب

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

بعد فترة طويلة من التدريب على المواد الكبيرة، ستحصل على كلمات مشابهة على المشاركة التالية في مركز التوابل.

### 步骤 5: التشابه 技巧

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

في التدريب المقبل 300d Google أخبار المتجهات العليا:

```python
>>> analogy(vocab, W, "man", "king", "woman")
[('queen', 0.71), ('monarch', 0.62), ('princess', 0.59), ...]
```

`king - man + woman = queen`ليس لأن النموذج يعرف ما هو المكتب`(king - man)`لقد أمسكنا بشيء يشبه الملكية، و أضفنا إليه`woman`上, سوف تسقط إلى الملكية-النساء 区域 بالقرب

## استخدمها

من كتابة لفظ2Vec هو من أجل التدريس.`gensim`.

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

في العمل الحقيقي، أنت تقريبا لا تدرب نفسك Word2Vec.

- **GloVe** طريقة تخصيص المصفوفات المشتركة في اتفاقات ستانفورد  50d、100d、200d、300d نقاط التفتيش  تغطية عامة جيدة.
- **fastText** فيسبوك على Word2Vec التوسع، سوفإدمج الكتب n-غرامات.
- **Pretrained Word2Vec on Google News** 300d,3M 词表,2013年发布──至今仍每天被下载──

### كلمة2في 2026 لا تزال ناجحة

- 轻量级领域特定检索――在笔记本电脑上用一小时训练医学摘要,得到通用模型 捕捉不到的专用向量――
- التشابه 风格的特征工程──`gender_vector = mean(man - woman pairs)`                                                                                                                                                                                                                                                              
- 可解释性──100d 足够小, يمكن أن تمر عبر PCA أو t-SNE 绘图,并实际看到集群 形成──
- أي شيء يجب أن يكون على جهازك دون جوبي أوضاع للعمل في إستنتاجات المكان.

### الفشل في Word2Vec

المُتَعَدّدُ هذا الحائطِ`bank`فقط متجه واحد`river bank`和 `financial bank`مع استخدامها.`table`(صفحة بيانات مقابل أثاث) أيضاً يستخدمها.

تم حل هذه المشكلة من خلال إنتاج متجه مختلف لكل ظهور من الكلمات على أساس المحيط على أسفل (ELMo、BERT وكل محول بعد ذلك) ، وهذا هو الانتقال من Word2Vec إلى BERT: من ثابت إلى محول.

الخروج من المفردات  المشكلة هي نقطة أخرى فشلتها`Zoomer-approved`في بيانات التدريب، لم يسبق لهما رؤيتما أبدا.

## 交付 it

保存为 `outputs/skill-embedding-probe.md`:

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

## التدريب

1. **Easy.**في مجموعة صغيرة ((20 عبارات عن القطط والكلاب) على عمل دورة تدريب`nearest(vocab, W, W[vocab["cat"]])`返回 نتائج أعلى 3 من المحتويات `dog`إذا لم يكن هناك، زيادة العصور أو الكلمات
2. **Medium.**添加高频词 فرعي العينات──频率高于 `10^-5`تعتبر الكلمات متباينة في أزواج التدريبات.
3. **Hard.**في 20 مجموعة أخبار corpus 上训练一个模型──计算两个 محور التحيز:`he - she`和 `doctor - nurse`◊ ضع كلمات المهنة 投投投到这两个轴上──报告哪些职业的偏差最大──这是类型的调查.

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

- [Mikolov et al. (2013). Distributed Representations of Words and Phrases and their Compositionality](https://arxiv.org/abs/1310.4546) النتائج السلبية 论文。短且易读。
- [Rong, X. (2014). word2vec Parameter Learning Explained](https://arxiv.org/abs/1411.2738)إذا كانت الرياضيات في المقالة الأصلية تجعلك تشعر بالثقة، فهذا هو أفضل دليل على الدرجات.
- [gensim Word2Vec tutorial](https://radimrehurek.com/gensim/models/word2vec.html) 实际有效的生产训练设置──
