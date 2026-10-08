# Saco de Palavras ¦TF-IDF e Representação de Texto

> Antes de mais, repensar. Até 2026, a TF-IDF continua a vencer em suas missões definidas.

**Type:** Build
**Languages:** Python
**先修要求：**Fase 5 · 01 (文本处理), Fase 2 · 02 (Regressão linear a partir do zero)
**Time:** ~75 分钟

## 问题
O modelo precisa de números.

Cada linha de PNL tem que responder à mesma pergunta. Como transformar um conjunto de componentes de tamanho variável em um vector fixo?

Este vector 支过的生产级 NLP,比任何嵌入 模型都多──垃圾邮件过器、主题分类器、日志异常检测、搜索排序(BM25 之前) 、第一波情感分析、学术 NLP benchmark的第一十年── até 2026, os profissionais em tarefas de Classification 狭窄 仍然将优先使用它──它速度快可解释,而且在词语是否出现才是关键任务,往往与一个400M 参数的嵌入模型几乎没有差异──

Este curso vai começar a construir um saco de palavras, depois construir um TF-IDF, depois mostrar um pouco de aprendizagem usando três linhas de código para fazer o mesmo.

## 概念
**Bag of Words (BoW)**会丢弃顺序――对每个文档,统计每个词表词出现了多少次――Vêctor 长度就是词表大小――位置`i`É um termo`i`O número de pessoas.

**TF-IDF**Uma palavra que aparece em cada documento não é alta, por isso, reduz o seu peso. Uma palavra que aparece muito raramente em cada documento é sinal, por isso, reduz o seu peso.

```
TF-IDF(w, d) = TF(w, d) * IDF(w)
             = count(w in d) / |d| * log(N / df(w))
```

Entre eles `TF`É a frequência do termo em arquivo,`df`É a frequência do documento ((( há muitos documentos contendo este termo),`N`É o número total de arquivos.`log`O poder de manter o peso das palavras é limitado.

关键性:二者都会产生具有解释可解释坐标轴的稀疏矢量── você pode ver o peso do treino posterior do divisor, ler quais palavras levarão o arquivo para qual classe── para um embebedimento BERT de 768 维, você não consegue isso──


```figure
bow-tfidf
```

## Construí-lo
### 步骤 1: construir o vocabulário

```python
def build_vocab(docs):
    vocab = {}
    for doc in docs:
        for token in doc:
            if token not in vocab:
                vocab[token] = len(vocab)
    return vocab
```

输入:已 Tokenize 的文档列表(任意词级 Tokenizer 都可以;本课的 `code/main.py`Utilize um pequeno texto simplificado (→ Output:`{word: index}`O que significa "index" é o primeiro que você vê em seu primeiro artigo.

### 步骤 2: saco de palavras

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

行是文档──列是词表索引──条目 `[i][j]`Expressão`j`Em arquivo`i`O que é que se passa?`cat`Apareceu duas vezes, porque realmente apareceu duas vezes.`ran`Aí não apareceu, porque não apareceu.

### 步骤 3: frequência de termos e frequência de documentos

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

Há duas técnicas de planeamento que merecem a pena.`(n+1)/(d+1)` evitou `log(x/0)`末尾の`+1` assegurar que cada palavra em cada documento ainda tenha IDF 1 (( não 0), que coincide com o comportamento de aprendizagem de pouco tempo¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬`log(N/df)`△二者都能工作;平滑版本更友好──

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

Três documentos, cinco palavras para expressão`the`- Não.`cat`- Não.`sat`- Não.`dog`- Não.`ran`)。`the`Aparece em todos os três arquivos, então sua IDF é baixa.`dog`Só aparece uma vez, então seu IDF 高── estes vetores são raros.

### 步骤 5: L2-normalizar as linhas

```python
def l2_normalize(matrix):
    out = []
    for row in matrix:
        norm = math.sqrt(sum(x * x for x in row))
        out.append([x / norm if norm else 0 for x in row])
    return out
```

Se não for feita a regeneração, o maior arquivo obtiverá um maior vetor, e dominará a similaridade entre os números. A normalização L2 colocará cada arquivo em uma unidade super-esfera.

## Use-o
O Sikit-Learn forneceu uma versão de produção.

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

`CountVectorizer`En ein调用中完成 Tokenization、词表构建和 BoW──`TfidfVectorizer`Para os 100 mil documentos, a versão densa não pode ser colocada em memória; em classe de requisito denso                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

- Não. - Não.

| Arg | Effect |
|-----|--------|
| `ngram_range=(1, 2)` | 包含 bigram。通常会提升 Classification。 |
| `min_df=2` | 丢弃出现在少于 2 个文档中的词。在噪声数据上裁剪词表。 |
| `max_df=0.95` | 丢弃出现在超过 95% 文档中的词。不使用硬编码列表也能近似移除 stopword。 |
| `stop_words="english"` | scikit-learn 内置的 stopword 列表。取决于任务——情感分析不应该丢弃否定词。 |
| `sublinear_tf=True` | 使用 `1 + log(tf)` 而不是原始 `tf`。当某个 term 在一个文档中重复很多次时有帮助。 |

### TF-IDF  ainda venceout cenário (截至2026年)

- 垃垃邮检测、主题标注、日志异常标注── palavra ou não surgiu é o único elemento essencial; significativamente, a diferença é insignificante──
- 低数据场景(100带标签样本) ――TF-IDF 加物流回归 没有预训成本──
- Qualquer local sensível ao atraso. O modelo de TF-IDF pode responder em microsecondas.
- 必須解释预测结果的系统──检查分类器的系数──排名靠前的正向词就是原因──

### Quando o TF-IDF falhar

语义盲区失败──考虑这两个文档:

- "O filme não foi bom".
- "O filme foi excelente".

Um é um comentário negativo. Um é um comentário positivo.`{the, movie, was}`O saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras, o saco de palavras.`not`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `good`Quando há dados suficientes, pode aprender, mas nunca entendeu o modelo da linguagem.

另一个失败:推理时遇到出口词典 词――一个在IMDb 评论上训练的BoW 模型,如果 `Zoomer-approved`Este token desde que não apareceu no treinamento, ele não sabe como lidar.

### Híbrido: TF-IDF 加权 Embedding

Classificação dos dados em volume de média de 2026: usando o TF-IDF 权重作为词嵌上的注意──

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

Você obteve habilidade de sintaxe em Embeddings, de TF-IDF, de Rare Word Emphasement.

## Entrega-o
保存为 `outputs/prompt-vectorization-picker.md`- Não .

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

## 练习
1. **Easy.**Em L2 normalizado TF-IDF 输出实现 `cosine_similarity(doc_vec_a, doc_vec_b)` Verificação do mesmo arquivo com uma pontuação de 1.0, nota de arquivo com uma pontuação de 0.0♦
2. **Medium.**- Não .`bag_of_words`添加 `n-gram`支持──参数 `n`- Não .`n`-gram de cálculo.`n=2`作用于 `["the", "cat", "sat"]`- Não, não.`["the cat", "cat sat"]`É um grande número.
3. **Hard.**Utilize GloVe 100d vectores (download once并缓存) construção de híbrido de incorporação ponderada TF-IDF acima.

## 关键术语
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
- [Salton, G., & Buckley, C. (1988). Term-weighting approaches in automatic text retrieval](https://www.sciencedirect.com/science/article/pii/0306457388900210) 让TF-IDF 成为十年默认方法论文──
- ["Why TF-IDF Still Beats Embeddings" — Ashfaque Thonikkadavan (Medium)](https://medium.com/@cmtwskb/why-tf-idf-still-beats-embeddings-ad85c123e1b2) 2026 ano sobre o velho método 何時胜出以及原因解讀──
