# Word Embeddings  से शून्य को पूरा करने Word2Vec

> एक शब्द द्वारा इसके चारों ओर के शब्दों द्वारा परिभाषित किया गया है। इस विचार के आधार पर एक निम्न स्तरीय जाल का अभ्यास किया जाता है, जिसमे भू-संरचना प्रकट होती है।

**Type:** Build
**Languages:** Python
**先修要求：**चरण 5 · 02 (BoW + TF-IDF), चरण 3 · 03 (निरंतर प्रसारण खरोंच से)
**Time:** ~75 minutes

## 问题

TF-IDF 知道 `dog`和 `puppy`यह अलग शब्द है। यह उनके अर्थ लगभग एक ही है।`dog`उपरोक्त प्रशिक्षण के वर्गीकरण, के बारे में नहीं किया जा सकता`puppy`आप समानार्थी शब्दों को सूचीबद्ध करके कम से कम सुधार कर सकते हैं, लेकिन यह दुर्लभ शब्दों में, क्षेत्र में और उन सभी भाषाओं में विफल रहता है जिनकी आप कल्पना नहीं करते हैं।

आप एक अभिव्यक्ति का तरीका चाहते हैं,让 `dog`和 `puppy`अंतरिक्ष में बहुत करीब है।`king - man + woman`落在 `queen`附近──让一个在 `dog`ऊपर प्रशिक्षण के मॉडल  मुक्त करने के लिए संकेत का एक हिस्सा स्थानांतरित कर सकते हैं `puppy`

Word2Vec ने हमें यह स्थान दिया है। दो स्तरीय तंत्रिका नेटवर्क, ट्रिलियन-टोकन प्रशिक्षण संचालन, 2013 में प्रकाशित किया गया। यह संरचना सरल से लगभग असहज है। इसके परिणामों ने अगले दशक के एनएलपी को फिर से आकार दिया।

## 核心概念

**Distributional hypothesis**(पहला, 1957): आपको एक शब्द को उस कंपनी द्वारा जाना चाहिए जो इसे रखता है. यदि दो शब्द समान प्रतीत होते हैं तो वे समान अर्थों को प्रदर्शित करने की संभावना है।

Word2Vec के दो रूप हैं, हम इस विचार का उपयोग कर रहे हैं।

- **Skip-gram。**给定中心词,预测周围的词──窗口大小为2 时,`cat -> (the, sat, on)`
- **CBOW (continuous bag of words)。**给定周围的词,预测中心词──`(the, sat, on) -> cat`

स्किप-ग्राम प्रशिक्षण धीमा है, लेकिन दुर्लभ शब्दों के लिए बेहतर है।

इस नेटवर्क में एक छिपा हुआ परत है, कोई अ-लाइनर नहीं है। इनपुट शब्दकोश पर एक गर्म वेक्टर है। आउटपुट शब्दकोश पर एक नरम अधिकतम है। प्रशिक्षण पूरा होने के बाद, आप आउटपुट परत को छोड़ देते हैं।

```
one-hot(center) ── W ──▶ hidden (d-dim) ── W' ──▶ softmax(vocab)
                          ^
                          this is the embedding
```

技巧在于: 100k 个词做软max 价格高不可接受──Word2Vec 使用 **negative sampling**, इसे एक द्विआधारी वर्गीकरण 任务──预测 इस पर निम्न शब्द क्या इस केंद्र शब्द के पास में दिखाई देता है, या नहीं── प्रत्येक प्रशिक्षण जोड़ी केवल नकारात्मक की एक छोटी मात्रा का नमूना लेता है未共现) शब्द, बजाय पूरे शब्द表计算软max──


```figure
word-vector-arithmetic
```

##  इसे निर्माण

### 步骤 1: से语料 उत्पन्न प्रशिक्षण जोड़े

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

 खिड़की में प्रत्येक `(center, context)`जोड़ी एक सकारात्मक प्रशिक्षण नमूना है।

### 步骤 2:इम्बेडिंग टेबल

两个矩阵――`W`है केंद्र शब्द एम्बेडिंग टेबल (आपका एक)`W'`                                                                                                                                                                                                                                                              `W`取平均) 

```python
import numpy as np


def init_embeddings(vocab_size, dim, seed=0):
    rng = np.random.default_rng(seed)
    W = rng.normal(0, 0.1, size=(vocab_size, dim))
    W_prime = rng.normal(0, 0.1, size=(vocab_size, dim))
    return W, W_prime
```

लघु随机初始化──词表大小 10k、度 100比现实; शिक्षण के लिए उपयोग में आने वाले 50 词表 x 16 维已经足够看几何结构──

### 步骤 3: नकारात्मक नमूनाकरण उद्देश्य

प्रत्येक सकारात्मक जोड़ी के लिए`(center, context)`, से शब्द表中随机采样 `k`个词作为负面──训练模型,使积极上的点积 `W[center] · W'[context]` उच्च और नकारात्मक  ऊपरी बिंदु कम 

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

关键公式: सकारात्मक जोड़ी 上的物流损失(希望 sigmoid 接近 1)加上负对 上的物流损失(希望 sigmoid 接近 0) ・・・ग्रैडिएंट्स 流向两个表中──完整推导在原论文中; यदि तुम想真正记住它,就用纸笔推一遍──

### 步骤 4: में खिलौना शरीर ऊपर प्रशिक्षण

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

बड़े भाषी सामग्री पर प्रशिक्षण पर्याप्त समय के बाद, साझा करने पर नीचे दिए गए शब्दों को समान केंद्र एम्बेडिंग प्राप्त होगा। खिलौना के शरीर पर, आप इस प्रभाव को छिपकर देखेंगे। अरबों टोकन पर, आप इसे बहुत स्पष्ट रूप से देखेंगे।

### 步骤 5: एनालॉग 技巧

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

पूर्व प्रशिक्षण में 300d गूगल समाचार वेक्टर ऊपरः

```python
>>> analogy(vocab, W, "man", "king", "woman")
[('queen', 0.71), ('monarch', 0.62), ('princess', 0.59), ...]
```

`king - man + woman = queen`️ नहीं क्योंकि मॉडल  जानता है कि क्या है `(king - man)` कुछ ऐसा पकड़ा गया है जो शाही  जैसा है, इसे जोड़ें `woman`ऊपर, शाही-महिला क्षेत्र के पास में गिर जाएगा

## इसका उपयोग करें

शून्य लेखन Word2Vec है के लिए शिक्षण. उत्पादन स्तर एनएलपी उपयोग.`gensim`

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

वास्तविक काम में, आप लगभग खुद को प्रशिक्षित नहीं करते हैं Word2Vec──आप प्री-ट्रेनिंग वेक्टर डाउनलोड करेंगे──

- **GloVe** स्टैनफोर्ड का सह-घटना-मैट्रिक्स कारककरण 方法──50d、100d、200d、300d चेकपोइंट──通用覆盖很好──Lesson 04 会专门讲 GloVe──
- **fastText** फेसबुक वर्ड2वीसी के विस्तार के लिए, इम्बेडिंग字符 n-ग्राम──आया संश्लेषण उपशब्दों से बाहर की शब्दावली के शब्दों को संसाधित करने हेतु।
- **Pretrained Word2Vec on Google News** 300d,3M 词表,2013 साल जारी──至今仍每天被下载──

### Word2Vec में 2026 साल में अभी भी जीतने का परिदृश्य

- 轻量级领域特定检索―― लैपटॉप上上用一小时训练医学摘要, प्राप्त सामान्य मॉडल 捕捉不到的专用向量――
- समानता 风格的 विशेषता इंजीनियरिंग`gender_vector = mean(man - woman pairs)`                                                                                                                                                                                                                                                              
- 可解释性──100d 足足足小, PCA या t-SNE 绘图 के माध्यम से,并实际上看到集群 形成──
- 任何必须在设备端、无GPU 条件下运行推理的地方──Word2Vec खोज 只是一次单行搜索──

### Word2Vec की विफलता की स्थिति

बहुलता, यह दीवार है`bank` केवल एक वेक्टर`river bank`和 `financial bank`साथ में इसका उपयोग करें`table`(प्रकृति शीट बनाम फर्नीचर) ने भी इसे साझा किया।

संदर्भ सम्मिलित करना (ELMo、BERT तथा उसके बाद के प्रत्येक ट्रांसफार्मर) के आधार पर चारों ओर के शब्दों के लिए प्रत्येक बार उत्पन्न होने वाले विभिन्न वेक्टरों के माध्यम से इस समस्या का समाधान किया गया है।

शब्द संग्रह से बाहर  समस्या  एक और असफल बिंदु `Zoomer-approved`प्रशिक्षण डेटा में,Word2Vec ने इसे कभी नहीं देखा है।

## 交付 यह

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

## अभ्यास

1. **Easy.**एक छोटे से शरीर में (२० वाक्य) पर चलना प्रशिक्षण चक्र──२०० युगों के बाद, सत्यापन`nearest(vocab, W, W[vocab["cat"]])`返回 परिणाम के शीर्ष 3 में शामिल `dog`यदि नहीं, तो युगों या शब्दों में वृद्धि करें
2. **Medium.**添加高频词 उप-उदाहरण──频率高于 `10^-5`शब्द की आवृत्ति के अनुपात में शब्द की संभावना को अभ्यास जोड़े में छोड़ दिया गया है।
3. **Hard.**में 20 न्यूजग्रुप कॉर्पस 上训练一个模型――计算两个偏差轴:`he - she`和 `doctor - nurse`把职业词 投影到这两个轴上.报告哪些职业的偏差最大. यह एक प्रकार का सर्वेक्षण है जिसका उपयोग निष्पक्षता शोधकर्ता करेगा.

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

- [Mikolov et al. (2013). Distributed Representations of Words and Phrases and their Compositionality](https://arxiv.org/abs/1310.4546) नकारात्मक-सैंपलिंग 论文。短且易读──
- [Rong, X. (2014). word2vec Parameter Learning Explained](https://arxiv.org/abs/1411.2738) यदि मूल निबंध के गणित आपको घनिष्ठ महसूस करते हैं, तो यह ग्रेडिएंट्स के लिए सबसे स्पष्ट मार्गदर्शन है
- [gensim Word2Vec tutorial](https://radimrehurek.com/gensim/models/word2vec.html) 实际有效的生产训练设置──
