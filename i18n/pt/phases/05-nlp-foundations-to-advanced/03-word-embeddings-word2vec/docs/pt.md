# Embedings de Word  Desde zero implementar Word2Vec

> Uma palavra é definida por palavras ao seu redor. Baseado nessa ideia, a formação de uma rede de níveis baixos, a geometria se manifesta.

**Type:** Build
**Languages:** Python
**先修要求：**Fase 5 · 02 (BoW + TF-IDF), Fase 3 · 03 (Repropagação a partir do zero)
**Time:** ~75 minutes

## 问题

TF-IDF                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `dog`和 `puppy`É uma palavra diferente. Não sabe o que significa.`dog`Classificador de treinamento, não pode ser generalizado para sobre`puppy`Você pode fazer uma lista de semêntimos para compensar, mas isso falha em termos raros, em termos de linguagem e em todas as linguagens que você não espera.

Tu queres um modo de expressar,让 `dog`和 `puppy`Está muito perto do espaço.`king - man + woman`- Está bem .`queen`附近──让一个在 `dog`O modelo de treinamento pode transferir parte do sinal para o local.`puppy`- Não.

O Word2Vec nos deu esse espaço. A rede neural de dois níveis, trilhões de tokens, foi publicada em 2013.

## 核心概念

**Distributional hypothesis**(Primeiro, 1957): Você deve saber uma palavra pela empresa que mantém. Se dois termos aparecem em semelhança em cima e baixo, eles podem significar semelhança.

O Word2Vec tem duas formas, todos estão usando essa ideia.

- **Skip-gram。**给定中心词,预测周围的词──窗口大小为2 时,`cat -> (the, sat, on)`- Não.
- **CBOW (continuous bag of words)。**给定周围的词,预测中心词──`(the, sat, on) -> cat`- Não.

O Skip-gram  treino mais lento, mas para raras palavras é melhor processado.

Esta rede tem uma camada oculta, não há nenhuma não-linearidade. A entrada é um vetor quente na tela de palavras. A saída é a suavidade máxima na tela de palavras. Depois de concluído o treinamento, você deixa de lado a saída.

```
one-hot(center) ── W ──▶ hidden (d-dim) ── W' ──▶ softmax(vocab)
                          ^
                          this is the embedding
```

技巧在于: para 100k 个词做软max 价格高不可接受──Word2Vec **negative sampling**, transformá-lo em uma Classificação binária 任务──预测这个上下文词是否出现这个中心词附近,是或否──每训练对只采样少量负面未共现)词,而不是对整个词表计算软max──


```figure
word-vector-arithmetic
```

## Construí-lo

### 步骤 1: de语料 geração de pares de treinamento

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

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `(center, context)`O par é um exemplo positivo.

### 步骤 2:Tabelas de inserção

- Duas Matrix.`W`É o centro de palavras de mesa de inserção (You'll retain the one)`W'`É a tabela de palavras que normalmente se desistem, às vezes se encontram.`W`取平均) ⋅

```python
import numpy as np


def init_embeddings(vocab_size, dim, seed=0):
    rng = np.random.default_rng(seed)
    W = rng.normal(0, 0.1, size=(vocab_size, dim))
    W_prime = rng.normal(0, 0.1, size=(vocab_size, dim))
    return W, W_prime
```

小随机初始化──词表大小 10k、维度 100比较现实; para uso em ensino, 50 词表 x 16 维已经足够看几何结构──

### 步骤 3:Objetivo negativo de amostragem

Para cada par positivo .`(center, context)`, de "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word" em "Word"`k`个词作为负面──训练模型,使积极上的点积 `W[center] · W'[context]`较高,而负上点积较低──

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

关键公式:par positivo 上的物流损失(希望 sigmoid 接近 1)加上负对 上的物流损失(希望 sigmoid 接近 0) ・・・Gradientes 流向两个表──完整推导在原论文中;

### Passo 4: Treinar no corpo de brinquedo

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

Em grande material de treinamento suficiente para a época , a partilha de palavras em baixo vai obter similaridades de centro embutidos. Em corpus de brinquedo, você vai ver o efeito . Em bilhões de tokens, você vai vê-lo muito claramente.

### 步骤 5: analogia 技巧

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

Em pré-treinamento de 300d Google Notícias vetores acima:

```python
>>> analogy(vocab, W, "man", "king", "woman")
[('queen', 0.71), ('monarch', 0.62), ('princess', 0.59), ...]
```

`king - man + woman = queen`Não é porque o modelo sabe o que é o Vektor.`(king - man)`Apanhei algo parecido com o rei, e depois adicionei.`woman`上, vai cair até a região real-fêmea perto.

## Use-o

Desde o zero escrever Word2Vec é para ensinar.`gensim`- Não.

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

Em trabalho real, você praticamente não se treina Word2Vec.

- **GloVe** Método de factorizamento de matriz de co-ocorrência de Stanford ⋅ 50d、100d、200d、300d pontos de controle──
- **fastText** Facebook para a expansão de Word2Vec, Embedding字符 n-grams── através de um conjunto de subpalavras para tratar palavras fora do vocabulário──Lessão 04──
- **Pretrained Word2Vec on Google News** 300d,3M 词表,2013年发布──至今仍每天被下载──

### O Word2Vec ainda vence em 2026

- 轻量级领域特定检索――在笔记本电脑上用一小时训练医学摘要,得到通用模型 捕捉不到的专用向量――
- Análogia 风格的特征工程──`gender_vector = mean(man - woman pairs)`                                                                                                                                                                                                                                                              
- 可解释性──100d 足足足小, pode ser através de PCA ou t-SNE 绘图,并实际看到集群形成──
- Qualquer coisa que seja necessário em qualquer dispositivo, sem GPU, para executar inferências em qualquer lugar.

### As falhas do Word2Vec

Polissemia, esta parede...`bank`Só há um vetor.`river bank`和 `financial bank`Com o seu uso.`table`(folha de cálculo vs móveis) também comumente.

Embedings Contextuais (ELMo、BERT e cada Transformador posterior) através de uma geração de diferentes vetores de palavras em cada vez que surgem, resolveu este problema.

Out-of-vocabulary  problema é outro ponto de fracasso.`Zoomer-approved`Não está em dados de treinamento, Word2Vec 就从未见过它──没有倒退──fastText Usando composição de subpalavras 解决了这个问题(leção 04)。

## Entrega-o

保存为 `outputs/skill-embedding-probe.md`- Não .

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

1. **Easy.**Em um pequeno corpo ((20 frases sobre gatos e cães)`nearest(vocab, W, W[vocab["cat"]])`返回结果的前3中包含 `dog`Se não houver, aumentem as épocas ou palavras.
2. **Medium.**添加高频词 subsampling──频率高于 `10^-5`A probabilidade de uma palavra ser abandonada em pares de treinamento é medida em proporção à sua frequência.
3. **Hard.**Em 20 Newsgroups corpus 上训练一个模型――计算两个偏差轴:`he - she`和 `doctor - nurse`◊把职业词语 投影到这两个轴上――报告哪些职业的偏差最大――这是公平性研究人员会使用的类型调查――

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

- [Mikolov et al. (2013). Distributed Representations of Words and Phrases and their Compositionality](https://arxiv.org/abs/1310.4546) negativo-sampling 论文。短且易读。
- [Rong, X. (2014). word2vec Parameter Learning Explained](https://arxiv.org/abs/1411.2738)Se a matemática do trabalho original te faz sentir mais intenso, é a melhor orientação para os gradientes.
- [gensim Word2Vec tutorial](https://radimrehurek.com/gensim/models/word2vec.html) 实际有效的生产训练设置──
