# Embedding Word  de zéro réalisation Word2Vec

> Un mot est défini par les mots qui l'entourent. Sur la base de cette idée, un réseau de couches basses apparaît.

**Type:** Build
**Languages:** Python
**先修要求：**La phase 5 · 02 (BoW + TF-IDF), la phase 3 · 03 (répartition à partir de zéro)
**Time:** ~75 minutes

##  problématique

TF-IDF  知道 `dog`et `puppy`C'est un mot différent. Il ne sait pas ce que cela signifie.`dog`Classifiateur de la formation, incapable de généraliser à propos de`puppy`Vous pouvez réparer ces problèmes en lisant des synonymes, mais cela ne fonctionne pas dans les termes rares, les langages dans les domaines et les langues que vous ne pensez pas.

Tu veux une façon de dire, fais.`dog`et `puppy`Dans l'espace, il est très proche.`king - man + woman`Je suis tombé`queen`Je suis là.`dog`Le modèle de formation peut déplacer gratuitement une partie du signal vers`puppy`Il y a une autre.

Word2Vec nous a donné cet espace. Le réseau neural à deux niveaux, un réseau de formation de plusieurs milliards de tokens, a été publié en 2013. Cette structure est simple à presque inconfortable.

## 核心概念

**Distributional hypothesis**(First, 1957): Vous devez connaître un mot par la société qu'il garde. Si deux mots apparaissent en comparaison, ils peuvent très probablement signifier la même signification.

Word2Vec a deux formes, tout le monde utilise cette idée.

- **Skip-gram。**给定中心词,预测周围的词──窗大小为2 时,`cat -> (the, sat, on)`Il y a une autre.
- **CBOW (continuous bag of words)。**给定周围的词,预测中心词──`(the, sat, on) -> cat`Il y a une autre.

Le ski-gramme est plus lent, mais il est mieux traité pour les rares mots.

Cette ligne a une couche cachée, sans non-linearité. L'entrée est un vecteur chaud sur la liste de mots. L'entrée est un vecteur doux sur la liste de mots. Après la formation, vous abandonnez la couche de sortie.

```
one-hot(center) ── W ──▶ hidden (d-dim) ── W' ──▶ softmax(vocab)
                          ^
                          this is the embedding
```

技巧在于: faire du softmax à 100k 个词 价格高可接受──Word2Vec **negative sampling**, le transformer en un Classification binaire 任务──预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预


```figure
word-vector-arithmetic
```

## - Je le construis.

### 步骤 1: générer des paires de formation à partir du langage

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

 chaque  dans la fenêtre`(center, context)`Le couple est un modèle positif.

### 步骤 2: Tableaux d'intégration

Deux Matrices.`W`C'est le mot central de la table d'intégration.`W'`C'est le cas de la table des mots.`W`取平均) ⋅

```python
import numpy as np


def init_embeddings(vocab_size, dim, seed=0):
    rng = np.random.default_rng(seed)
    W = rng.normal(0, 0.1, size=(vocab_size, dim))
    W_prime = rng.normal(0, 0.1, size=(vocab_size, dim))
    return W, W_prime
```

Petit épisode de la première édition de la série.

### 步骤 3:objectif d'échantillonnage négatif

Pour chaque paire positive`(center, context)`, du mot expression dans le cas où`k`个词作为负面――训练模型, faire positif 上的点积 `W[center] · W'[context]`较高,而负 上的点积较低──

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

关键公式:par positif 上的物流损失(希望 sigmoid 接近 1)加上负对 上的物流损失(希望 sigmoid 接近 0) ・・・Gradients 流向两个表──完整推导在原论文中; si tu veux vraiment te souvenir de cela, use du papier à la main推一遍──

### Étape 4: entraînement en corps de jouet

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

Dans le grand matériel de formation assez longtemps  Après, le partage des mots sur le texte ci-dessous obtiendra des emplacements similaires. Dans le corps du jouet, vous verrez presque cet effet. Dans les milliards de jetons, vous le verrez très clairement.

### 步骤 5: analogy 技巧

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

Dans les vecteurs de Google News 300d de pré-entraînement:

```python
>>> analogy(vocab, W, "man", "king", "woman")
[('queen', 0.71), ('monarch', 0.62), ('princess', 0.59), ...]
```

`king - man + woman = queen`Ce n'est pas parce que le modèle sait ce qu'est la chambre.`(king - man)`Tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu es, tu sais, tu sais, tu es, tu sais, tu sais, tu es, tu sais, tu es, tu sais, tu es, tu es, tu sais, tu es, tu es, tu es, tu es, tu sais, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es.`woman`À la maison de la femme royale.

## Utilisez-le

De l'écriture à zéro Word2Vec est pour l'enseignement.`gensim`Il y a une autre.

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

Dans le travail réel, vous ne vous entraînez presque pas Word2Vec. Vous téléchargez des vecteurs de pré-entraînement.

- **GloVe** Le processus de facteurisation de la matrice de co-occurrence de Stanford ⋅ 50d、100d、200d、300d points de contrôle ⋅
- **fastText** Facebook pour l'expansion de Word2Vec, Embedding字符 n-grammes──en passant par la mise en place de sous-parts pour traiter les mots hors vocabulaire──L'enseignement 04──
- **Pretrained Word2Vec on Google News** 300d,3M 词表,2013年发布──至今仍每天被下载──

### Word2Vec est encore en victoire en 2026

- 轻量级领域特定检索――在笔记本电脑上使用一小时训练医学摘要, obtenir le modèle général 捕捉不到的专用向量――
- Analogie 风格的特色工程──`gender_vector = mean(man - woman pairs)`                                                                                                                                                                                                                                                              
- 可解释性──100d 足足足小, peut être dessiné par PCA ou t-SNE,并实际看到集群形成──
- 任何必须在设备端、没有GPU 条件下运行推断的地方──Word2Vec recherche 只是一次单行搜索──

### Les défaillances de Word2Vec

La polysémie, c'est une chose.`bank`Il n'y a qu'un seul vecteur.`river bank`et `financial bank`Je l'utilise.`table`(tableau de calcul contre meubles) 也共用它──下游分类器 无法仅凭这个矢量 区分不同词义──

Les embellissements contextuels (ELMo、BERT et ensuite chaque transformateur) ont résolu ce problème en générant différents vecteurs à chaque fois que des mots apparaissent à travers la phase 7 de la transformation.

Le problème est un autre défaut.`Zoomer-approved`Il n'y a pas de retour en arrière.

## Je le livre.

保存为 `outputs/skill-embedding-probe.md`- Le numéro de la liste:

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

1. **Easy.**Dans un petit corpus de 20 phrases sur les chats et les chiens, 200 époques plus tard, la vérification`nearest(vocab, W, W[vocab["cat"]])`返回 Result  Top 3 du classement`dog` Si non, augmenter les époques ou les mots 
2. **Medium.**添加高频词 sous-échantillonnage──频率高于 `10^-5`Les mots sont rejetés par les paires d'entraînement en fonction de la probabilité de leur proportion de fréquence.
3. **Hard.**Dans le corpus de 20 groupes de nouvelles, on peut apprendre à calculer deux axes de biais:`he - she`et `doctor - nurse`◊ La mise en scène des mots de l'occupation ⋅ projeter sur ces deux axes ⋅ rapport sur les occupations ⋅ déficit de partialité maximal ⋅ est le type de recherche utilisé par les chercheurs en équité ⋅

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

- [Mikolov et al. (2013). Distributed Representations of Words and Phrases and their Compositionality](https://arxiv.org/abs/1310.4546) échantillonnage négatif 论文。短且易读。
- [Rong, X. (2014). word2vec Parameter Learning Explained](https://arxiv.org/abs/1411.2738)Si les mathématiques de l'article original vous font sentir plus étroit, c'est la meilleure recommandation pour les Gradients.
- [gensim Word2Vec tutorial](https://radimrehurek.com/gensim/models/word2vec.html) 实际有效的生产训练设置──
