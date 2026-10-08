# Bolsa de palabras, TF-IDF y representación de texto

> Antes de contar, volver a pensar... hasta 2026 años, el TF-IDF sigue ganando Embeddings en la tarea de definir claramente...

**Type:** Build
**Languages:** Python
**先修要求：**Fase 5 · 01 (文本处理), Fase 2 · 02 (Regressión lineal desde cero)
**Time:** ~75 分钟

##  problemas
El modelo necesita números.

Cada línea de NLP debe responder a la misma pregunta. ¿Cómo transformar un token de longitud variable en un vector de tamaño fijo?

Este vector 支过的生产级 NLP, es mayor que cualquier Embedding 模型都多──垃圾邮件过器、主题分类器、日志异常检测、搜索排序(BM25 之前) 、第一波情感分析、学术 NLP benchmark的第一十年── hasta 2026 años, los profesionales en la Clasificación 任务 estrecha seguirán priorizando su uso── es rápidamente explicable, y en la palabra surge es la única tarea clave en la que el Embedding es, de vez en cuando y un modelo de Embedding de 400M 参数 几乎没有 diferencia──

Este curso se desarrollará desde la creación de la bolsa de palabras, luego se desarrollará la TF-IDF, luego se mostrará el aprendizaje con el código de código de forma a hacer lo mismo, y finalmente se indicará que se puede cambiar hacia el modelo de fracaso de los embeddings.

## 概念
**Bag of Words (BoW)**Se ha perdido el orden. Se han aparecido varias veces en cada documento.`i`Sí es palabra`i`El número de personas.

**TF-IDF**Una palabra que aparece en cada documento no es alta, por lo que su peso es reducido. Una palabra que aparece en cada documento es muy poco común en el archivo de lenguaje, pero en cada documento aparece frecuentemente como un señal, por lo que su peso es elevado.

```
TF-IDF(w, d) = TF(w, d) * IDF(w)
             = count(w in d) / |d| * log(N / df(w))
```

Entre ellos `TF`Es la frecuencia del término en el archivo,`df`Es la frecuencia del documento (((hay muchos documentos que contienen este palabra),`N`Es el número total de archivos.`log`El poder de mantener el peso de las palabras frecuentes tiene límites.

关键性:二者都会产生具有可解释坐标轴的稀疏矢量── puedes ver el peso del ordenador después del entrenamiento, leer qué palabras llevarán el archivo a qué clase── para un 768 维的 BERT Embedding, tú no lo haces hasta este punto──


```figure
bow-tfidf
```

## Construirlo
### 步骤 1: construir el vocabulario

```python
def build_vocab(docs):
    vocab = {}
    for doc in docs:
        for token in doc:
            if token not in vocab:
                vocab[token] = len(vocab)
    return vocab
```

输入:已 Tokenize 的文档列表(任意词级 Tokenizer 都可以;本课的 `code/main.py`Utiliza una pequeña escritura simplificada (→ ∞)`{word: index}`Dictamen:                                                                                                                                                                                                                                                             

### 步骤 2: bolso de palabras

```python
def bag_of_words(docs, vocab):
    matrix = [[0] * len(vocab) for _ in docs]
    for i, doc in enumerate(docs):
        for token in doc:
            if token in vocab:
                matrix[i][vocab[token]] += 1
    return matrix
```

```python
>>> docs = [["cat", "sat", "on", "mat"], ["cat", "cat", "ran"]]
>>> vocab = build_vocab(docs)
>>> bag_of_words(docs, vocab)
[[1, 1, 1, 1, 0], [2, 0, 0, 0, 1]]
```

行是文档──列是词表索引──条目 `[i][j]`Quiero decir`j`En el archivo`i`En el medio apareció muchas veces ──文档 1 中 `cat`Se ha producido dos veces, porque realmente ha aparecido dos veces.`ran`Se ha producido de forma incesante, porque no ha aparecido.

### 步骤 3: frecuencia de los términos y frecuencia de los documentos

```python
import math


def term_frequency(doc_bow, doc_length):
    return [c / doc_length if doc_length else 0 for c in doc_bow]


def document_frequency(bow_matrix):
    df = [0] * len(bow_matrix[0])
    for row in bow_matrix:
        for j, count in enumerate(row):
            if count > 0:
                df[j] += 1
    return df


def inverse_document_frequency(df, n_docs):
    return [math.log((n_docs + 1) / (d + 1)) + 1 for d in df]
```

Hay dos técnicas de planeación que merecen el nombre.`(n+1)/(d+1)` evitó `log(x/0)`末尾的 `+1` asegurarse de que en cada documento aparezca un texto que sigue teniendo IDF 1 ((no 0), lo cual coincide con el comportamiento de aprendizaje poco común―`log(N/df)`△二者都能工作;平滑版本更友好──

### 步骤 4: TF-IDF

```python
def tfidf(bow_matrix):
    n_docs = len(bow_matrix)
    df = document_frequency(bow_matrix)
    idf = inverse_document_frequency(df, n_docs)
    out = []
    for row in bow_matrix:
        length = sum(row)
        tf = term_frequency(row, length)
        out.append([tf_j * idf_j for tf_j, idf_j in zip(tf, idf)])
    return out
```

```python
>>> docs = [
...     ["the", "cat", "sat"],
...     ["the", "dog", "sat"],
...     ["the", "cat", "ran"],
... ]
>>> vocab = build_vocab(docs)
>>> bow = bag_of_words(docs, vocab)
>>> tfidf(bow)
```

Tres documentos, cinco palabras`the`¿Qué es esto?`cat`¿Qué es esto?`sat`¿Qué es esto?`dog`¿Qué es esto?`ran`)。`the`Aparece en todos los archivos, así que su IDF es baja.`dog`Sólo aparece una vez, por lo que su IDF 高── Estos vectores son raros.

### 步骤 5: Normaliza las filas L2

```python
def l2_normalize(matrix):
    out = []
    for row in matrix:
        norm = math.sqrt(sum(x * x for x in row))
        out.append([x / norm if norm else 0 for x in row])
    return out
```

Si no se hace la integración, el archivo de mayor duración obtiene un vector más grande, y domina la similaridad entre los números de puntos. La normalización L2 pondrá cada archivo en unidad superesfera. La similitud cosínica entre el eje y el eje es ahora el producto de punto.

## Usalo
Scikit-learn  proporcionó una versión de producción.

```python
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer

docs = ["the cat sat on the mat", "the dog sat on the mat", "the cat ran"]

bow_vectorizer = CountVectorizer()
bow = bow_vectorizer.fit_transform(docs)
print(bow_vectorizer.get_feature_names_out())
print(bow.toarray())

tfidf_vectorizer = TfidfVectorizer()
tfidf = tfidf_vectorizer.fit_transform(docs)
print(tfidf.toarray().round(3))
```

`CountVectorizer`En una ocasión调用中完成 Tokenization、词表构建和 BoW──`TfidfVectorizer`Además de la IDF 加权和 L2 normalización──二者都回归稀疏矩阵── para 100k 个文档, dense 版本无法存储;在分类器要求 dense 之前保持稀稀──

¿Qué es lo que está pasando?

| Arg | Effect |
|-----|--------|
| `ngram_range=(1, 2)` | 包含 bigram。通常会提升 Classification。 |
| `min_df=2` | 丢弃出现在少于 2 个文档中的词。在噪声数据上裁剪词表。 |
| `max_df=0.95` | 丢弃出现在超过 95% 文档中的词。不使用硬编码列表也能近似移除 stopword。 |
| `stop_words="english"` | scikit-learn 内置的 stopword 列表。取决于任务——情感分析不应该丢弃否定词。 |
| `sublinear_tf=True` | 使用 `1 + log(tf)` 而不是原始 `tf`。当某个 term 在一个文档中重复很多次时有帮助。 |

### TF-IDF 仍然胜出的场景 (截至2026年)

- 垃圾邮件检测、主题标注、日志异常标注──¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
- 低数据场景(100带标签样本) ――TF-IDF 加物流回归 没有预训成本──
- 任何地方对延迟敏感的地方──TF-IDF 加线性模型可以在微秒级中提供答案──通过变压器对文档做嵌入 需要10-100ms──
- 必须解释预测结果的系统──检查分类器的系数──排名靠前的正向词就是原因──

### Cuando el TF-IDF falla

语义盲区失败──考虑这两个文档:

- "La película no fue buena en absoluto".
- "La película fue excelente".

Uno es un comentario negativo. Uno es un comentario positivo.`{the, movie, was}`✿ Bolsa de palabras  分类器 debe recordar `not` En la cercanía `good`Cuando haya suficiente información, puede aprenderlo, pero nunca entenderá el modelo de la gramática.

另一个失败:推理时遇到出语库词――一个在IMDb 评论上训练的BoW 模型,如果 `Zoomer-approved`Este token desde que no apareció en el entrenamiento, no sabe cómo manejar.

### El sistema de transporte de vehículos de alta velocidad

Clasificación de datos de la media de 2026: con TF-IDF 权重作为词嵌上的注意──

```python
def tfidf_weighted_embedding(doc, tfidf_scores, embedding_table, dim):
    vec = [0.0] * dim
    total_weight = 0.0
    for token in doc:
        if token not in embedding_table or token not in tfidf_scores:
            continue
        weight = tfidf_scores[token]
        emb = embedding_table[token]
        for i in range(dim):
            vec[i] += weight * emb[i]
        total_weight += weight
    if total_weight == 0:
        return vec
    return [v / total_weight for v in vec]
```

Usted obtiene de Embeddings 语义能力, de TF-IDF 获得稀有词强调──分类器在聚向量上训练── para aproximadamente 50k 个带标签样本下面情感、主题和意图分类, este método superará el uso individual de cualquiera de ellos──

##  entregarlo
保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/prompt-vectorization-picker.md`¿Qué es esto ?

```markdown
---
name: vectorization-picker
description: 给定一个文本 Classification 任务，推荐 BoW、TF-IDF、Embeddings 或 hybrid。
phase: 5
lesson: 02
---

你推荐一种文本 Vectorization 策略。给定任务描述，输出：

1. Representation（BoW、TF-IDF、Transformer Embeddings，或 hybrid）。用一句话解释原因。
2. 具体的 vectorizer 配置。写出库名。引用参数（`ngram_range`、`min_df`、`max_df`、`sublinear_tf`、`stop_words`）。
3. 发布前要测试的一个失败模式。

当用户少于 500 个带标签样本时，拒绝推荐 Embeddings，除非他们展示了 TF-IDF baseline 存在语义失败的证据。拒绝为情感分析移除 stopwords（否定词携带信号）。指出类别不平衡需要的不只是更改 vectorizer。

Example input: "Classifying 30k customer support tickets into 12 categories. Most tickets are 2-3 sentences. English only. Need explainability for audit logs."

Example output:

- Representation: TF-IDF。30k 个样本不算少；可解释性要求排除了 dense Embeddings。
- Config: `TfidfVectorizer(ngram_range=(1, 2), min_df=3, max_df=0.95, sublinear_tf=True, stop_words=None)`。保留 stopwords，因为类别关键词有时就是 stopwords（"not working" vs "working"）。
- Failure to test: 验证 `min_df=3` 不会丢弃稀有类别关键词。运行 `get_feature_names_out`，按类别筛选并人工检查。
```

##  ejercicios
1. **Easy.**En L2 normalizado TF-IDF 输出实现 `cosine_similarity(doc_vec_a, doc_vec_b)` Prueba de que el mismo documento tiene un puntaje de 1.0, la nota de un documento que no se compara es de 0.0♦
2. **Medium.**- ¿ Qué ?`bag_of_words`添加                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `n-gram`支持──参数 `n`¡ ¡ ¡ Se ha hecho !`n`-gramas de cuentas.`n=2`作用于 `["the", "cat", "sat"]`时,会为 `["the cat", "cat sat"]`¿Qué es eso?
3. **Hard.**Utiliza GloVe 100d vectores (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en) (en) (en inglés) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| BoW | 词频 Vector | 一个文档中词表词的计数。丢弃顺序。 |
| TF | Term frequency | 一个词在文档中的计数，可选地按文档长度归一化。 |
| DF | Document frequency | 至少包含该词一次的文档数量。 |
| IDF | Inverse document frequency | 平滑后的 `log(N / df)`。降低到处都出现的词的权重。 |
| Sparse vector | 大多为零 | 词表通常有 10k-100k 个词；对任意给定文档来说，大多数词都不存在。 |
| Cosine similarity | Vector 夹角 | L2-normalized vectors 的 dot product。1 表示相同，0 表示正交。 |

## 延伸阅读
- [scikit-learn — feature extraction from text](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction) 权威 API 参考,并包含每个旋的说明──
- [Salton, G., & Buckley, C. (1988). Term-weighting approaches in automatic text retrieval](https://www.sciencedirect.com/science/article/pii/0306457388900210) 让TF-IDF 成为十年默认方法的论文──
- ["Why TF-IDF Still Beats Embeddings" — Ashfaque Thonikkadavan (Medium)](https://medium.com/@cmtwskb/why-tf-idf-still-beats-embeddings-ad85c123e1b2) 2026 años sobre el viejo método ¿Cuándo se venció y qué es lo que lo hizo?
