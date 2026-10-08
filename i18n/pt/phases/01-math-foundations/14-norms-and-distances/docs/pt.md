# Fan número e distância

> Sua função de distância define o que se chama de semelhança.

**Type:** Build
**Language:**Python
**前置要求：**Fase 1, Lições 01 (Intuição de álgebra linear),02 (Vectores, Matrizes e Operações)
**Time:** ~90 分钟

## Objectivo de aprendizagem

- Desde zero realizar L1、L2、cosine、Mahalanobis、Jaccard 和 edit distance  função
- Para determinar a tarefa de seleção da distância adequada, e explicar por que outras escolhas falham.
- A L1 e L2 范数 se relacionam com LASSO、Ridge  正则化及其几何束区域
- Mostre o mesmo conjunto de dados em diferentes dimensões produzir diferentes vizinhos mais próximos

## 问题

Você tem dois vetores. Eles podem ser palavras embutidas. Também pode ser um imagem do usuário. Também pode ser um número de imagens. Você precisa saber: eles são muito próximos?

A resposta depende totalmente da função de distância que você escolha. Em uma medida, dois pontos de dados podem ser os vizinhos mais próximos, em outra medida, mas a distância é muito longa. Seu classificador KNN, motor de recomendação, banco de dados vetorial, algoritmo de agrupamento, função de perda dependem dessa escolha.

Não existe a melhor distância de uso geral. L2  adaptado espaço dados. Cossina semelhança em NLP.

Esta aula irá construir cada função de distância principal a partir de zero, explicar quando usar qual, e mostrar como a mesma parte de dados gera vizinhos mais próximos completamente diferentes devido ao uso de diferentes medidas.

## 概念

### Normas: Vector de medida

Cada função de distância entre dois vetores pode ser escrita como um diferencial de valores de um vetor: d, b) = a - b = a = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b

### L1 Norma (distância de Manhattan)

Norma L1 para todos os valores absolutos de divisões

```
||x||_1 = |x_1| + |x_2| + ... + |x_n|
```

É chamado de distância de Manhattan, porque mede a distância que você percorre no meio da rede urbana, onde você só pode se mover ao longo do eixo do eixo, não pode andar em direção a um canto.

```
Point A = (1, 1)
Point B = (4, 5)

L1 distance = |4-1| + |5-1| = 3 + 4 = 7

On a grid, you walk 3 blocks east and 4 blocks north.
```

Qual é o problema?
- 高维稀疏数据(文本特征、one-hot codificações)
- Quando você quer que os valores sejam mais estáveis, as diferenças enormes não vão conduzir o resultado.
- 特征选择问题(L1 regularização 会促进稀疏性)

Com relação à regularização L1 (Lasso): Na função de perda, você vai participar de um punimento de peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do peso do

Com relação às funções de perda:Erro absoluto médio (MAE) é o valor médio da distância entre o valor de previsão e o valor-alvo L1.

### L2 Norma ((distância euclidiana)

A norma L2 é a distância direta. É igual à raiz quadrada da divisão de quantidade e da raiz quadrada.

```
||x||_2 = sqrt(x_1^2 + x_2^2 + ... + x_n^2)
```

É o que você aprendeu em matemática.

```
Point A = (1, 1)
Point B = (4, 5)

L2 distance = sqrt((4-1)^2 + (5-1)^2) = sqrt(9 + 16) = sqrt(25) = 5.0

The straight line, cutting diagonally through the grid.
```

Qual é o problema?
- 低到中等维度的连续数据
- Quando a medida é comparável
- 物理距离(空间数据、传感器读数)
- A semelhança de imagem de nível de imagem

Com L2 regularização (Ridge) 联系: 中中加入你的 Loss Function2^2,将惩罚更大的权重――与 L1 不同,它不会推推重至零――它将比例把所有权重向零收缩――L2 penalty 会产生圆形约束区域,所以坐标轴上没有角──权重会变小,但很少精确为零――

Com relação às funções de perda:Erro médio quadrado (MSE) é a L2 distâncias 平方的平均值──平方会比小误差更重地惩罚大误差──

```
MAE (L1 loss):  |y - y_hat|         Linear penalty. Robust to outliers.
MSE (L2 loss):  (y - y_hat)^2       Quadratic penalty. Sensitive to outliers.
```

### Normas de Lp:

L1 e L2 são as circunstâncias especiais da norma Lp:

```
||x||_p = (|x_1|^p + |x_2|^p + ... + |x_n|^p)^(1/p)
```

Diferentes p                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

```
p=1:    Diamond shape      (corners on axes)
p=2:    Circle/sphere      (the usual round ball)
p=3:    Superellipse       (rounded square)
p=inf:  Square/hypercube   (flat sides along axes)
```

### L-infinidade Norma ((Chebyshev distância)

Quando a p                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

```
||x||_inf = max(|x_1|, |x_2|, ..., |x_n|)
```

A distância entre dois pontos é determinada pela maior diferença entre eles. Todas as outras dimensões são ignoradas.

```
Point A = (1, 1)
Point B = (4, 5)

L-inf distance = max(|4-1|, |5-1|) = max(3, 4) = 4
```

何時使用 L-infinity:
- Quando a diferença entre as melhores situações de um só nível é importante
- 游戏棋盘(国际象棋中的国王按L-infinity 移动:任意方向走一步的代价都是1)
- 制造公差 ((cada dimensão tem de estar dentro do âmbito de regulamentação)

### Similaridade de cosino e distância de cosino

A semelhança cosínica mede os ângulos entre dois vetores, ignorando-os em grandeza.

```
cos_sim(a, b) = (a . b) / (||a||_2 * ||b||_2)
```

Seu alcance é -1 ((direção相反) até +1 ((direção mesma) ⋅ semelhança cosínica de vetores vertical 为 0。

Distância cosínea vai transformá-lo em distância:cosínea_distância = 1 - cosínea_similaridade── alcance é 0(direção igual) para 2(direção相反)──

```
a = (1, 0)    b = (1, 1)

cos_sim = (1*1 + 0*1) / (1 * sqrt(2)) = 1/sqrt(2) = 0.707
cos_dist = 1 - 0.707 = 0.293
```

Por que o cosino em NLP e embutidos domina: em textos, a duração do arquivo não deve afetar a similaridade.

何時使用 cosino semelhança:
- 文本相似度(vectores TF-IDF, embutidos de palavras, embutidos de frases)
- Qualquer grandeza é ruído, direção é o campo do sinal.
- 推系统( usuário preferência Vectores)
- Embedding search ((base de dados vetoriais  quase sempre usando cosino ou produto ponto)

### Similaridade do produto de ponto versus Similaridade cosínica

Produto de pontos dos dois vetores é:

```
a . b = a_1*b_1 + a_2*b_2 + ... + a_n*b_n
      = ||a|| * ||b|| * cos(angle)
```

A semelhança cosínica é de acordo com dois grandes números de pontos de produto de uma unificação posterior.

```
If ||a|| = 1 and ||b|| = 1:
    a . b = cos(angle between a and b)
```

它们不同的情况:dot product 包含大小信息──大小更大的矢量会得到更高的点 product 分数──在一些检查系统中, se você quiser que os produtos de alta classificação sejam classificados, este ponto é muito importante──大小会作为隐式质量或重要性信号──

```
a = (3, 0)    b = (1, 0)    c = (0, 1)

dot(a, b) = 3     dot(a, c) = 0
cos(a, b) = 1.0   cos(a, c) = 0.0

Both agree on direction, but dot product also reflects magnitude.
```

实践中:
- Quando você quer direção pura semelhança, use a semelhança cosínica.
- Quando o tamanho é significativo, use o produto ponto
- 许多矢量数据库(Pinecone、Weaviate、Qdrant) permite-lhe entre os dois escolher
- Se os teus embaixamentos já estão normalizados, então escolha o que é que é.

### Distância de Mahalanobis

A distância euclidiana é igual a todas as dimensões. Mas se as suas características estiverem relacionadas, ou se a dimensão for diferente, L2 dará resultados errados.

A distância de Mahalanobis irá considerar a covariância da estrutura dos dados.

```
d_M(x, y) = sqrt((x - y)^T * S^(-1) * (x - y))
```

Entre elas, S é a matriz de covariância dos dados.

直观理解:Mahalanobis distância 会先对数据去相关并归归一化(whitening), então em transformação de espaço calcula L2 distância。 se S é matriz de identidade(不相关、单位差特征),Mahalanobis distância 就会退化为尤克利德的距离。

```
Example: height and weight are correlated.
Someone 6'2" and 180 lbs is not unusual.
Someone 5'0" and 180 lbs is unusual.

Euclidean distance might say they are equally far from the mean.
Mahalanobis distance correctly identifies the second as an outlier
because it accounts for the height-weight correlation.
```

何时使用 Mahalanobis distância:
- Detetação de anomalias (com o valor médio de Mahalanobis distância)
- Classificação quando as características diferem e existem correlações
- Quando você tem dados suficientes para estimar uma matriz de covariância confiável
- 制造质量控制 (Control do processo de transformação)

### Jaccard Similarity (para usar)

A semelhança de Jaccard mede a intensidade de sobreposição entre dois conjuntos.

```
J(A, B) = |A intersect B| / |A union B|
```

Seu alcance é 0 ((( não se sobrepõe) até 1 (( conjunto é igual) ・・・ Distância de Jaccard = 1 - Semelhança de Jaccard。

```
A = {cat, dog, fish}
B = {cat, bird, fish, snake}

Intersection = {cat, fish}         size = 2
Union = {cat, dog, fish, bird, snake}  size = 5

Jaccard similarity = 2/5 = 0.4
Jaccard distance = 0.6
```

何時使用 Jaccard:
- Comparar etiquetas, categorias ou coleção de características
- Baseado em termos de similaridade de arquivo (em vez de frequência)
- 近重复检测(Jaccard's MinHash 近似)
- Comparar vectores de características de valor (existência/não existência de dados)
- 评估分割模型(Intersecção sobre a União = Jaccard)

### Edit Distância ((Levenshtein Distância)

Edição distância 计算把一个字符串转换成另一个字符串所需的最小单字符操作数――操作包括:插入、删除或替换──

```
"kitten" -> "sitting"

kitten -> sitten  (substitute k -> s)
sitten -> sittin  (substitute e -> i)
sittin -> sitting (insert g)

Edit distance = 3
```

Utilize动态规划计算──填充一个矩阵,其中条目 (i, j) 是字符串 A 的前 i 个字符串与字符串 B 的前 j 个字符之间的编辑距离──

```
        ""  s  i  t  t  i  n  g
    ""   0  1  2  3  4  5  6  7
    k    1  1  2  3  4  5  6  7
    i    2  2  1  2  3  4  5  6
    t    3  3  2  1  2  3  4  5
    t    4  4  3  2  1  2  3  4
    e    5  5  4  3  2  2  3  4
    n    6  6  5  4  3  3  2  3
```

何時使用 edição distância:
- 拼写 checking and correcting
- Alinhamento de sequências de DNA (带加权操作)
- 模糊字符串匹配
- 脏文本数据去重

### KL Divergência ((não é distância, mas é sempre utilizada como distância)

A diferença KL é a diferença entre uma distribuição de probabilidade e outra distribuição de probabilidade. Este conteúdo foi mencionado na lição 09 , mas pertence a esta discussão, porque as pessoas costumam usá-lo como uma distância, embora não seja distância.

```
D_KL(P || Q) = sum(p(x) * log(p(x) / q(x)))
```

关键性质:KL divergência não é对称的──

```
D_KL(P || Q) != D_KL(Q || P)
```

Isto significa que não satisfaz os requisitos básicos da quantidade de distância.

Forward KL(D_KL(P   Q)) é meaning-seeking:Q 试图覆盖 P 的所有模式──
Reverso KL(D_KL(Q   P)) é mode-seeking:Q 专注于P 的单个模式──

Você vai ver divergências KL nesses lugares:
- VAEs ((ELBO 项 中的 KL 项会把 latente distribuição 推向前)
- Destilação de conhecimento (student 试图匹配 teacher 的分布)
- RLHF(Penalidade KL 让调整模型 保持接近基模型)
- Métodos de gradiente de política (→ Atualizações de políticas)

### Distância Wasserstein ((Distância do Mover da Terra)

Distância de Wasserstein  medir transformar uma distribuição de probabilidade em outra distribuição de probabilidade  trabalhos mínimos necessários── pode-se entender assim: se uma distribuição é um monte de terra, a outra é um cratera, você precisa mover quantas terras  mover quantas distâncias?

```
W(P, Q) = inf over all transport plans gamma of E[d(x, y)]
```

Para 1D distribuição, ele se simplifica para a função de distribuição acumulativa de diferença absoluta:

```
W_1(P, Q) = integral |CDF_P(x) - CDF_Q(x)| dx
```

Por que Wasserstein  importante:
- É uma métrica real (tradução, satisfação, não é igual).
- Mesmo que a distribuição não se sobreponha, também pode fornecer gradientes (KL divergência vai se tornar infinita).
- Esta natureza tornou-o no núcleo dos GANs de Wasserstein, os quais resolveram o problema de treinamento instável dos GANs originais.

```
Distributions with no overlap:

P: [1, 0, 0, 0, 0]    Q: [0, 0, 0, 0, 1]

KL divergence: infinity (log of zero)
Wasserstein: 4 (move all mass 4 bins)

Wasserstein gives a meaningful gradient. KL does not.
```

何時使用 Wasserstein:
- Formação GAN ((WGAN、WGAN-GP)
- Comparar distribuição
- Transportes ótimos 问题
- 图像检索(比较颜色直方图)

### Por que diferentes missões precisam de diferentes distâncias?

| Task | Best distance | Why |
|------|--------------|-----|
| 文本相似度 | Cosine | 大小是噪声，方向是含义 |
| 图像像素比较 | L2 | 空间关系重要，特征尺度可比较 |
| 稀疏高维特征 | L1 | 稳健，不会放大罕见的大差异 |
| 集合重叠（标签、类别） | Jaccard | 数据天然是集合值，而不是 Vector 型 |
| 字符串匹配 | Edit distance | 操作映射到人类编辑直觉 |
| Outlier detection | Mahalanobis | 考虑特征相关性和尺度 |
| 比较分布 | KL divergence | 衡量使用 Q 而不是 P 时丢失的信息 |
| GAN training | Wasserstein | 即使分布不重叠也能提供 Gradients |
| Embeddings（vector DB） | Cosine or dot product | Embeddings 被训练为在方向中编码含义 |
| 推荐 | Dot product | 大小可以编码流行度或置信度 |
| DNA sequences | Weighted edit distance | 替换成本因核苷酸对而异 |
| Manufacturing QC | L-infinity | 任意维度中的最坏情况偏差都很重要 |

### Relacionamento com Funções de Perda

Funções de perda é uma função de distância entre o valor de previsão e o valor de objetivo.

```
Loss function       Distance it uses       Behavior
MSE                 L2 squared             Penalizes large errors heavily
MAE                 L1                     Penalizes all errors equally
Huber loss          L1 for large errors,   Best of both: robust to outliers,
                    L2 for small errors    smooth gradient near zero
Cross-entropy       KL divergence          Measures distribution mismatch
Hinge loss          max(0, margin - d)     Only penalizes below margin
Triplet loss        L2 (typically)         Pulls positives close, pushes
                                           negatives away
Contrastive loss    L2                     Similar pairs close, dissimilar
                                           pairs beyond margin
```

### Relação com a normalização

A função de perda aumenta a função de perda de peso.

```
L1 regularization (Lasso):   loss + lambda * ||w||_1
  -> Sparse weights. Some weights become exactly zero.
  -> Automatic feature selection.
  -> Solution has corners (non-differentiable at zero).

L2 regularization (Ridge):   loss + lambda * ||w||_2^2
  -> Small weights. All weights shrink toward zero.
  -> No feature selection (nothing goes to exactly zero).
  -> Smooth solution everywhere.

Elastic Net:                  loss + lambda_1 * ||w||_1 + lambda_2 * ||w||_2^2
  -> Combines sparsity of L1 with stability of L2.
  -> Groups of correlated features are kept or dropped together.
```

Por que L1 irá produzir raridade e L2 não vai: imagine 2D  área de restrição no espaço de peso. L1 é 形, L2 é 圆形.

### Buscar o vizinho mais próximo

Cada função de distância inclui uma busca de vizinho mais próximo.

Pesquisa de vizinho mais próxima em um conjunto de dados de dimensão n,d, a complexidade de cada consulta é O ((n * d) ⋅ para grandes conjuntos de dados, é muito lento.

Algoritmos de aproximação do vizinho mais próximo (ANN) com menor quantidade de precisão em troca de uma grande velocidade:

```
Algorithm         Approach                      Used by
KD-trees          Axis-aligned space partition   scikit-learn (low-dim)
Ball trees        Nested hyperspheres            scikit-learn (medium-dim)
LSH               Random hash projections        Near-duplicate detection
HNSW              Hierarchical navigable         FAISS, Qdrant, Weaviate
                  small-world graph
IVF               Inverted file index with       FAISS (billion-scale)
                  cluster-based search
Product quant.    Compress vectors, search       FAISS (memory-constrained)
                  in compressed space
```

HNSW(Hierárquico Navegable Small World) é um algoritmo moderno de base de dados de vetores. Ele constrói um gráfico de várias camadas, cada um dos quais está conectado a seus vizinhos mais próximos.


```figure
norm-unit-balls
```

## Construí-lo

### 步骤 1: Todas as funções de tamanho e distância

完整实现见 `code/distances.py` Cada função é construída desde zero, usando apenas base Python.

### 步骤 2: Os mesmos dados, diferentes distâncias, diferentes vizinhos

`distances.py`Na demonstração, você vai criar um conjunto de dados, selecionar um ponto de consulta e mostrar o vizinho mais próximo como ele varia com a distância da quantidade de variação.

### 步骤 3:Embutida pesquisa de semelhança

代码包含一个模拟嵌入式相似性搜索,使用共数相似性与 L2距离 查找与查询 最相似的文档,展示排名可能不同──

## Use-o

Utilização real mais comum: em base de dados de vetores, pesquisar por elementos semelhantes.

```python
import numpy as np

def cosine_similarity_matrix(X):
    norms = np.linalg.norm(X, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1, norms)
    X_normalized = X / norms
    return X_normalized @ X_normalized.T

embeddings = np.random.randn(1000, 768)

sim_matrix = cosine_similarity_matrix(embeddings)

query_idx = 0
similarities = sim_matrix[query_idx]
top_k = np.argsort(similarities)[::-1][1:6]
print(f"Top 5 most similar to item 0: {top_k}")
print(f"Similarities: {similarities[top_k]}")
```

Quando você está a usar`model.encode(text)`Então, quando você pesquisa o vector base de dados, o que acontece no fundo é isso. O modelo de incorporação irá mapear o texto em vectores.

## 练习

1. 計算 (1, 2, 3) 和 (4, 0, 6)   之间的 L1、L2 和 L-infinity distances。验证对于任意一对点,总有L-inf <= L2 <= L1。证明为为这个顺序一定成立──

2. 创建两个向量,使宇宙相似性 很高(> 0.9),但 L2 distância 很大(> 10)。 从几何角度解释发生了什么――然后创建两个向量,使宇宙相似性 很低(< 0.3),但 L2 distância 很小(< 0.5)。

3. 实现 uma função, receber um conjunto de dados e um ponto de consulta,并分别返回 L1、L2、cosine 和 Mahalanobis distance 下下的最近的邻居──找一个数据集,使四种距离对哪个点最近的全部意见不一致──

4. Utilize CDF 方法手动计算 [0,5, 0,5, 0,0] 和 [0, 0, 0,5, 0.5] 之间的 Wasserstein distância──然后计算 [0,25, 0.25, 0.25, 0.25] 和 [0, 0, 0,5, 0.5] 之间的距离──哪个更大,为什么?

5. Para obter similaridade de Jaccard 实现 MinHash── gerar 100 个随机集合, calcular todos os pares de Jaccard,并使用 50、100、200 个 hash funções  MinHash 近似进行比较──绘制近似误差──

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Norm | “Vector 的大小” | 一个把 Vector 映射到非负标量的函数，满足三角不等式、绝对齐次性，并且只有零 Vector 的值为零 |
| L1 norm | “Manhattan distance” | 分量绝对值之和。在优化中产生稀疏性。对 outliers 稳健 |
| L2 norm | “Euclidean distance” | 平方分量之和的平方根。Euclidean space 中的直线距离 |
| Lp norm | “Generalized norm” | 分量绝对值 p 次方之和的 p 次根。L1 和 L2 是特殊情况 |
| L-infinity norm | “Max norm” 或 “Chebyshev distance” | 最大绝对分量值。当 p 趋近无穷大时 Lp 的极限 |
| Cosine similarity | “Vectors 之间的角度” | 按两个大小归一化的 dot product。范围从 -1 到 +1。忽略 Vector 长度 |
| Cosine distance | “1 minus cosine similarity” | 将 cosine similarity 转换为距离。范围从 0 到 2 |
| Dot product | “Unnormalized cosine” | 按分量相乘后求和。等于 cosine similarity 乘以两个大小 |
| Mahalanobis distance | “Correlation-aware distance” | 在使用数据 covariance matrix 进行 whitened（去相关和归一化）后的空间中的 L2 distance |
| Jaccard similarity | “Set overlap” | 交集大小除以并集大小。用于集合，而不是 Vectors |
| Edit distance | “Levenshtein distance” | 将一个字符串转换为另一个字符串所需的最少插入、删除和替换次数 |
| KL divergence | “Distance between distributions” | 不是真正的距离（不对称）。衡量使用 Q 编码 P 时产生的额外 bits |
| Wasserstein distance | “Earth mover's distance” | 将质量从一个分布运输到另一个分布所需的最小 work。真正的 metric |
| Approximate nearest neighbor | “ANN search” | 比精确搜索快得多地找到近似最近点的算法（HNSW、LSH、IVF） |
| HNSW | “The vector DB algorithm” | Hierarchical Navigable Small World graph。用于快速 approximate nearest neighbor search 的多层图 |
| L1 regularization | “Lasso” | 将权重的 L1 norm 加入 Loss。把权重推向零（稀疏性） |
| L2 regularization | “Ridge” 或 “weight decay” | 将权重的平方 L2 norm 加入 Loss。将权重向零收缩，但不产生稀疏性 |
| Elastic Net | “L1 + L2” | 结合 L1 和 L2 regularization。比任意单独一种方法都更好地处理相关特征组 |

## 延伸阅读

- [FAISS: A Library for Efficient Similarity Search](https://github.com/facebookresearch/faiss)- Meta utiliza a biblioteca de pesquisas ANN de bilhões de dólares
- [Wasserstein GAN (Arjovsky et al., 2017)](https://arxiv.org/abs/1701.07875)- A distância do Mover da Terra  Introdução GANs 论文
- [Locality-Sensitive Hashing (Indyk & Motwani, 1998)](https://dl.acm.org/doi/10.1145/276698.276876)- 基础 ANN 算法
- [Efficient Estimation of Word Representations (Mikolov et al., 2013)](https://arxiv.org/abs/1301.3781)- Word2Vec, semelhança de cosina em embutidos entre tornar-se preferido lugar
- [sklearn.neighbors documentation](https://scikit-learn.org/stable/modules/neighbors.html)- orientação prática para a medição de distância e os algoritmos de vizinhança
