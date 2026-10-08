# Embedings de Word  Desde el punto de vista de Word2Vec

> Una palabra es definida por la palabra que la rodea. Basándose en esta idea, se manifiesta una red de nivel bajo.

**Type:** Build
**Languages:** Python
**先修要求：**Fase 5 · 02 (BoW + TF-IDF), Fase 3 · 03 (Repropagación desde cero)
**Time:** ~75 minutes

##  problemas

TF-IDF                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `dog`Y `puppy`Es un término diferente. No sabe lo que significa.`dog`Clasificador de entrenamiento, no puede generalizarse a acerca de`puppy`Puede hacerse con la lista de sinónimos para compensar, pero esto no funciona en términos raros, en el ámbito de la palabra y en todos los idiomas que no se han imaginado.

Quieres un modo de expresar, que`dog`Y `puppy`En el espacio está muy cerca.`king - man + woman`¿ Qué pasa ?`queen`附近──让一个在 `dog`El modelo de entrenamiento puede transferir parte del mensaje gratis.`puppy`¿Qué es eso?

Word2Vec nos ha dado este espacio. Dos niveles de red neuronal, trillones de tokens, entrenamiento de ejecución, publicado en 2013. Esta estructura es simple a casi inconveniente.

## 核心概念 核心概念 核心概念 核心概念

**Distributional hypothesis**(Primero, 1957): Se debe conocer una palabra por la compañía que mantiene. Si dos palabras aparecen en la siguiente, son muy probable que signifiquen la misma significación.

Word2Vec tiene dos formas, todos están utilizando esta idea.

- **Skip-gram。**给定中心词,预测周围的词──窗口大小为2 时,`cat -> (the, sat, on)`¿Qué es eso?
- **CBOW (continuous bag of words)。**给定周围的词,预测中心词──`(the, sat, on) -> cat`¿Qué es eso?

El programa de Skip-gram  entrenamiento más lento, pero para los raros se trata mejor.

Esta red tiene una capa oculta, no tiene una capa no lineal. La entrada es un vector caliente en la hoja de palabras. La salida es la máxima suave en la hoja de palabras. Después de completar el entrenamiento, dejas de lado la salida. La carga de la capa oculta es los embebidos.

```
one-hot(center) ── W ──▶ hidden (d-dim) ── W' ──▶ softmax(vocab)
                          ^
                          this is the embedding
```

技巧在于: hacer softmax a 100k 个词 价格高可接受──Word2Vec **negative sampling**, transformarlo en una Clasificación binaria 任务──预测 Ese es el siguiente término que aparece en este término central, es o no── cada par de entrenamiento sólo toma una pequeña cantidad negativa未共现) palabra, en lugar de calcular la suavidadmax para todo el término表──


```figure
word-vector-arithmetic
```

## Construirlo

### Paso 1: de la lenguaje generar pares de entrenamiento

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

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `(center, context)`El par es un ejemplo positivo.

### 步骤 2:Mejores de emblema

Dos Matrixas.`W`Es el nombre de la tabla de inserción.`W'`Es la siguiente tabla de palabras que normalmente se abandona, a veces se reúne y`W`取平均) ⋅

```python
import numpy as np


def init_embeddings(vocab_size, dim, seed=0):
    rng = np.random.default_rng(seed)
    W = rng.normal(0, 0.1, size=(vocab_size, dim))
    W_prime = rng.normal(0, 0.1, size=(vocab_size, dim))
    return W, W_prime
```

Pequeño tiempo de iniciación. 字表大小 10k、维度 100比较现实; para la enseñanza, 50 字表 x 16 维已经足够看几何结构──

### 步骤 3: Objetivo negativo de muestreo

Para cada par positivo .`(center, context)`, de la palabra表中随机采样 `k`个词作为负面──训练模型, hacer positivo 上的点积 `W[center] · W'[context]`较高,而负上点积较低──

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

关键公式:par positivo 上的物流损失(希望 sigmoid 接近 1)加上负对 上的物流损失(希望 sigmoid 接近 0) ・・・Gradientes 流向两个表中──完整推导在原论文中; si quieres realmente recordarlo, ¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡

### Paso 4: Entrenamiento en el cuerpo de juguete

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

En el cuerpo del juguete, verás este efecto oculto. En miles de millones de tokens, lo verás muy claramente.

### Paso 5: Analogía 技巧

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

En el pre-entrenamiento de 300d Google Noticias vectores arriba:

```python
>>> analogy(vocab, W, "man", "king", "woman")
[('queen', 0.71), ('monarch', 0.62), ('princess', 0.59), ...]
```

`king - man + woman = queen`No es porque el modelo sabe lo que es la casa de los reyes.`(king - man)`Captura algo parecido a un rey, y lo agrega.`woman`arriba, se quedará en la zona de la mujer real.

## Usalo

Desde el principio de la escritura Word2Vec es para la enseñanza.`gensim`¿Qué es eso?

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

En el trabajo real, casi no te entrenas a ti mismo Word2Vec.

- **GloVe** El método de factorizamiento de la matriz de cooccurrencia de Stanford ⋅ 50d、100d、200d、300d puntos de control― ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅                                                                                                                                                                                                                                 
- **fastText** Facebook para la expansión de Word2Vec, se incorporará en los gráficos n-gramas.
- **Pretrained Word2Vec on Google News** 300d,3M 词表,2013年发布──至今仍每天被下载──

### Word2Vec en 2026 todavía gana en escena

- 轻量级领域特定检索――在笔记本电脑上用一小时训练医学摘要,得到通用模型 捕捉不到的专用向量――
- Analogía 风格的 características de ingeniería。`gender_vector = mean(man - woman pairs)`                                                                                                                                                                                                                                                              
- 可解释性──100d 足足足小, puede pasar por PCA o t-SNE 绘图,并实际看到集群形成──
- 任何必须在设备端、没有GPU 条件下运行推理的地方──Word2Vec búsqueda 只是一次单行搜索──

### Las fracasas de Word2Vec

La polysemia, ese bloqueo.`bank`Sólo hay un vector.`river bank`Y `financial bank`Lo usamos juntos.`table`(Tabla de cálculo vs. muebles) también lo compartimos.

Embedings contextuales (ELMo、BERT y cada Transformer posterior) mediante la generación de diferentes vectores para cada aparición de palabras basados en la siguiente fase de la palabra, resuelve este problema.

fuera del vocabulario  problema es otro punto de fracaso― si `Zoomer-approved`No en el entrenamiento de datos, Word2Vec 就從未见过它──沒有倒退──fastText Usar la composición de las palabras subterráneas 解決了這個問題(lección 04)──

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-embedding-probe.md`¿Qué es esto ?

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

##  ejercicios

1. **Easy.**En un pequeño corpus ((20 关于猫和狗的句子) 运行训练循环──200 个时代后,验证 `nearest(vocab, W, W[vocab["cat"]])`返回 Resultado de los 3 primeros incluidos `dog`Si no, aumentar las épocas o palabras.
2. **Medium.**添加高频词 subsampling──频率高于 `10^-5`La probabilidad de que el término se desprenda de los pares de entrenamiento se basa en la proporción de su frecuencia.
3. **Hard.**En 20 Newsgroups corpus 上训练一个模型――计算两个轴偏:`he - she`Y `doctor - nurse`◊把 vocabulario de ocupación 投投向这两个轴上――报告哪些职业的偏差最大――这是公平性研究人员会使用的类型调查――

## 关键术语: "El hombre es un hombre"

| Term | 人们通常怎么说 | 它实际是什么意思 |
|------|-----------------|-----------------------|
| Word embedding | Word as a Vector | 一种从上下文中学习到的 dense、low-dim（通常 100-300）表示。 |
| Skip-gram | Word2Vec 技巧 | 从中心词预测上下文词。比 CBOW 慢，但对罕见词更好。 |
| Negative sampling | 训练捷径 | 用针对 `k` 个随机词的 binary Classification，替代对完整词表的 softmax。 |
| Static embedding | 每个词一个 Vector | 无论上下文如何都是同一个 Vector。会在 polysemy 上失效。 |
| Contextual embedding | 对上下文敏感的 Vector | 基于周围词，为每次出现生成不同 Vector。这是 transformers 产生的东西。 |
| OOV | Out of vocabulary | 训练中没见过的词。Word2Vec 无法为这些词产生 Vector。 |

## 延伸阅读

- [Mikolov et al. (2013). Distributed Representations of Words and Phrases and their Compositionality](https://arxiv.org/abs/1310.4546) análisis negativo 论文。短且易读。
- [Rong, X. (2014). word2vec Parameter Learning Explained](https://arxiv.org/abs/1411.2738)Si las matemáticas de los trabajos originales te hacen sentir más íntegro, es la mejor guía para los Gradientes.
- [gensim Word2Vec tutorial](https://radimrehurek.com/gensim/models/word2vec.html) 实际有效的生产训练设置──
