# Fan y distancia

> Su función de distancia define lo que se llama semejanza.

**Type:** Build
**Language:**Python
**前置要求：**Fase 1, Lecciones 01 (Intucción de álgebra lineal),02 (Vectores, matrices y operaciones)
**Time:** ~90 分钟

## El objetivo del aprendizaje

- Desde el 0 realizando L1、L2、cosine、Mahalanobis、Jaccard 和 editar distancia  función
- Para determinar la tarea de ML, elegir la medida de distancia adecuada, y explicar por qué otras opciones fracasarán.
- Enlazar las L1 y L2 con las LASSO, Ridge y su área de reglamentación
-  mostrar el mismo conjunto de datos en diferentes dimensiones generará diferentes vecinos más cercanos

##  problemas

Usted tiene dos vectores. Ellos pueden ser palabras incrustadas. También puede ser imágenes de usuario. También puede ser un grupo de imágenes.

La respuesta depende completamente de la función de distancia que elijas. Dos puntos de datos en una medida pueden ser vecinos más cercanos, en otra medida pueden estar muy lejos. Tu clasificador KNN, motor de recomendación, base de datos de vectores, algoritmo de agrupación, función de pérdida dependen de esta opción.

No existe la mejor distancia de uso general. L2  adaptado a datos de espacio. La similitud de la cosina en la PNL es la principal. Jackard  procesar conjunto. Editar distancia  procesar la cadena. Mahalanobis 会考虑相关性.

Esta clase se desarrollará desde cero para construir cada función de distancia principal, explicará cuándo utilizar la cual, y mostrará cómo la misma parte de datos genera vecinos más cercanos completamente diferentes debido a la utilización de diferentes dimensiones.

## 概念

### Normas: Vektor de la medida

La función de cada distancia entre dos vectores puede ser escrita como su diferencia de valor en la función de un vector: d, b) = a - b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b = b =

### L1 Norma de Manhattan distancia)

Norma L1 para el valor absoluto de todas las fracciones

```
||x||_1 = |x_1| + |x_2| + ... + |x_n|
```

Se le llama distancia de Manhattan, porque mide la distancia que usted camina en la red urbana, donde sólo puede moverse a lo largo del eje de la señal, no puede caminar en contra de la línea.

```
Point A = (1, 1)
Point B = (4, 5)

L1 distance = |4-1| + |5-1| = 3 + 4 = 7

On a grid, you walk 3 blocks east and 4 blocks north.
```

¿Cuándo usar L1:
- 高维稀疏数据(文本特征、one-hot codificaciones)
- Cuando quieres que los valores sean más estables, las diferencias no se producen.
- 特征选择问题(L1 regularización 会促进稀疏性)

En la función de pérdida 1, se incluye el peso de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la puntuación de la pun

La relación de las funciones de pérdida:Erro absoluto medio (MAE) es el valor promedio de la distancia L1 entre el valor de previsión y el valor objetivo.

### L2 Norma ((Distancia euclidiana)

La norma L2 es la distancia directa. Es igual a la raíz cuadrada de la cuadrata.

```
||x||_2 = sqrt(x_1^2 + x_2^2 + ... + x_n^2)
```

Así es la distancia que has aprendido en las clases de geometría.

```
Point A = (1, 1)
Point B = (4, 5)

L2 distance = sqrt((4-1)^2 + (5-1)^2) = sqrt(9 + 16) = sqrt(25) = 5.0

The straight line, cutting diagonally through the grid.
```

¿Cuándo usar L2:
- 低到中等维度的连续数据
- Cuando las características de la medida son comparables
- 物理距离(空间数据、传感器读数)
- Similaridad de imagen de la categoría de imagen

En la función de pérdida de la L1, el peso de la L1 se reduce a 0, pero el peso de la L2 se reduce a 0, en proporción.

La función de pérdida se refiere a la función de pérdida de peso de la función de pérdida de peso.

```
MAE (L1 loss):  |y - y_hat|         Linear penalty. Robust to outliers.
MSE (L2 loss):  (y - y_hat)^2       Quadratic penalty. Sensitive to outliers.
```

### Normas de la Lp:

L1 y L2 son las situaciones especiales de la norma Lp:

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

### L-infinidad Norma ((Chebyshev distancia)

Cuando la norma de la Lp se acerca a la máxima cantidad absoluta de

```
||x||_inf = max(|x_1|, |x_2|, ..., |x_n|)
```

La distancia entre dos puntos es determinada por la dimensión que más difiere de ellos. Todas las demás dimensiones son ignoradas.

```
Point A = (1, 1)
Point B = (4, 5)

L-inf distance = max(|4-1|, |5-1|) = max(3, 4) = 4
```

何时使用 L-infinity:
- Cuando la diferencia entre las peores y peores situaciones es importante
- 游戏棋盘(国际象棋中的国王按L-infinity 移动:任意方向走一步的代价都是1)
- 制造公差 ((cada dimensión tiene que estar en el ámbito de la normativa)

### Similaridad cosina y distancia cosina

La similitud cosínica mide los ángulos entre dos vectores, ignorando su tamaño.

```
cos_sim(a, b) = (a . b) / (||a||_2 * ||b||_2)
```

Su alcance es -1 ((dirección相反) a +1 ((dirección igual) ⋅ semejantad cosínica de los vectores vertical 为 0。

La distancia cosínea se transformará en distancia:cosínea_distancia = 1 - cosínea_similaridad── alcance es 0(dirección igual) a 2(dirección相反)──

```
a = (1, 0)    b = (1, 1)

cos_sim = (1*1 + 0*1) / (1 * sqrt(2)) = 1/sqrt(2) = 0.707
cos_dist = 1 - 0.707 = 0.293
```

Por qué el cosino en la PNL y las incorporaciones es dominante: en el texto, la longitud del archivo no debe afectar a la similitud. Un artículo sobre el gato en el archivo incluso sobre el gato en el otro artículo tiene dos veces más de similitud. La similitud del cosino sólo tiene sentido.

何时使用 cosino similitud:
- 文本相似度(vectores TF-IDF, palabras incrustadas, oraciones incrustadas)
- Cualquier tamaño es ruido, dirección es el área de la señal.
- 推系统( usuario preferencia de vectores)
- Embedding search ((bases de datos vectoriales  casi siempre utiliza cosino o producto punto)

### Similaridad de producto de punto vs. semejanza de cosino

两个 vectores de producto de puntos es:

```
a . b = a_1*b_1 + a_2*b_2 + ... + a_n*b_n
      = ||a|| * ||b|| * cos(angle)
```

La similitud cosínica es según dos grandes y pequeños productos de puntos después de la regeneración.

```
If ||a|| = 1 and ||b|| = 1:
    a . b = cos(angle between a and b)
```

它们 son diferentes: producto punto  contiene grandes informaciones  Vector más grande Obtiene un producto punto más alto  Número  En algunos sistemas de búsqueda, si desea que los productos calificados sean más altos, este punto es importante                                                                                                                                                                                                                                                          

```
a = (3, 0)    b = (1, 0)    c = (0, 1)

dot(a, b) = 3     dot(a, c) = 0
cos(a, b) = 1.0   cos(a, c) = 0.0

Both agree on direction, but dot product also reflects magnitude.
```

实践中:
- Cuando quieres una dirección pura de similitud, usa la similitud cosina.
- Cuando el tamaño de la información es significativo, utilizar el producto punto
- 许多矢量数据库(Pinecone、Weaviate、Qdrant) permite que entre los dos elijas
- Si tus embebidos ya están L2 normalizados, entonces elegir cualquiera es un problema.

### Distancia de Mahalanobis

La distancia euclidiana es igual para todas las dimensiones. Pero si tus características están relacionadas, o la dimensión es diferente, L2 dará resultados equivocados.

La distancia de Mahalanobis se tendrá en cuenta la estructura de la covarianza de los datos.

```
d_M(x, y) = sqrt((x - y)^T * S^(-1) * (x - y))
```

Entre ellos S es la matriz de covarianza de datos.

直观理解:La distancia de Mahalanobis 会先对数据去相关并归一化(whitening), luego en el espacio de cambios después de calcular la distancia L2──如果 S es matriz de identidad(不相关、单位差特征),La distancia de Mahalanobis se volverá a la distancia euclidiana──

```
Example: height and weight are correlated.
Someone 6'2" and 180 lbs is not unusual.
Someone 5'0" and 180 lbs is unusual.

Euclidean distance might say they are equally far from the mean.
Mahalanobis distance correctly identifies the second as an outlier
because it accounts for the height-weight correlation.
```

何时使用 Mahalanobis distancia:
- Detección de anomalías (con un valor medio de Mahalanobis)
- Clasificación cuando las características son diferentes y existen correlaciones
- Cuando tienes suficiente datos para estimar una matriz de covarianza confiable
- 制造质量控制 (control del proceso de fabricación de la cantidad de cambios en la cantidad de productos)

### Jaccard Similaridad (en inglés)

La similitud de Jaccard mide la superposición entre dos conjuntos.

```
J(A, B) = |A intersect B| / |A union B|
```

Su alcance es de 0 (no se superpone) a 1 (conjunto es igual) JACCARDO distancia = 1 - similaridad de JaccARD JACCARDO

```
A = {cat, dog, fish}
B = {cat, bird, fish, snake}

Intersection = {cat, fish}         size = 2
Union = {cat, dog, fish, bird, snake}  size = 5

Jaccard similarity = 2/5 = 0.4
Jaccard distance = 0.6
```

¿Cuándo usar Jaccard:
- Comparación de etiquetas, categorías o colección de características
- 基于词是否出现的文档相似度 (en lugar de frecuencia)
- 近重复检测(Jaccard's MinHash 近似)
- Compare vectores de características de valor (exist/no exist datos)
- 评估分割模型(Intersección sobre la Unión = Jaccard)

### Edición de distancia

Edición de distancia 计算把一个字符串转换成另一个字符串所需的最小单字符操作数――操作包括:插入、删除或替换──

```
"kitten" -> "sitting"

kitten -> sitten  (substitute k -> s)
sitten -> sittin  (substitute e -> i)
sittin -> sitting (insert g)

Edit distance = 3
```

Utilizaciómotividades de cálculo. Rellenar una matriz, entre la cual el artículo (i, j) es la distancia de edición entre el prefijo de la cadena A y el prefijo de la cadena B.

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

何時使用 Distancia de edición:
- 拼写 inspección y rectificación
- Alineación de secuencias de ADN (带加权操作)
- 模糊字符串匹配
- 脏文本数据去重

### KL Divergencia (no es distancia, pero siempre se utiliza como distancia)

KL divergencia  Medir la diferencia entre una distribución de probabilidad y otra distribución de probabilidad ⋅ Este contenido se ha hablado en la Lección 09 , pero pertenece a esta discusión, ya que la gente a menudo lo utiliza como una distancia ⋅ aunque no es distancia ⋅

```
D_KL(P || Q) = sum(p(x) * log(p(x) / q(x)))
```

关键性质:La divergencia de KL no es la de la homología.

```
D_KL(P || Q) != D_KL(Q || P)
```

Esto significa que no satisface los requisitos básicos de la distancia.

El modelo de la tecnología de la información (PQ) es un modelo de la tecnología de la información (PQ) que se utiliza para la información.
Reverso KL(D_KL(Q   P)) es mode-seeking:Q 专注于P 的单个模式──

Verás en estos lugares la divergencia de KL:
- VAEs ((ELBO en el KL 项会把 distribución latente 推向前)
- Destilación del conocimiento (estudiante 试图匹配 profesor 的分布)
- RLHF(Penalidad KL 让调整模型 保持接近基本模型)
- Métodos de gradiente de la política (en inglés)

### Distancia de Wasserstein (Distancia del Mover de la Tierra)

Distancia de Wasserstein  medir una distribución de probabilidad transformar en otra distribución de probabilidad  trabajos mínimos necesarios ── se puede entender así: si una distribución es una pila de tierra, otra es un cratero, ¿necesitas mover cuánta tierra  mover hasta dónde?

```
W(P, Q) = inf over all transport plans gamma of E[d(x, y)]
```

 Para 1D de distribución, se simplifica a la función acumulada de distribución de la diferencia absoluta de积分:

```
W_1(P, Q) = integral |CDF_P(x) - CDF_Q(x)| dx
```

¿Por qué Wasserstein es importante ?
- Es una verdadera métrica.
- Incluso si la distribución no se superpone, también puede proporcionar Gradientes (KL divergencia se tiende a ser infinito)
- Esta naturaleza lo hizo ser el núcleo de las GANs de Wasserstein, las cuales resolvieron el problema de la inestabilidad de las GANs originales.

```
Distributions with no overlap:

P: [1, 0, 0, 0, 0]    Q: [0, 0, 0, 0, 1]

KL divergence: infinity (log of zero)
Wasserstein: 4 (move all mass 4 bins)

Wasserstein gives a meaningful gradient. KL does not.
```

¿Cuándo usar Wasserstein:
- Formación en GAN (GAN-GP)
- Comparación de posibles diferencias
- Transporte óptimo 问题
- 图像检索(comparación de colores

### ¿Por qué las diferentes tareas necesitan diferentes distancias?

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

### Enlace con Funciones de pérdida

Las funciones de pérdida son las funciones de distancia entre el valor de pronóstico y el valor objetivo.

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

### Enlace con la normalización

La función de pérdida se puede aplicar en función de peso.

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

¿Por qué L1 producirá rarequidad y L2 no? Imagina 2D  área de confinamiento en el espacio de peso. L1 es 形, L2 es redonda.

### Buscar al vecino más cercano

Cada función de distancia contiene una búsqueda de vecino más cercano.

En la búsqueda de vecindario más cercana, la complejidad de cada consulta es O (n * d) ⋅ para un conjunto de datos de gran tamaño, es demasiado lento.

Algorithm de la ANN con un índice de precisión menor a cambio de una velocidad enorme:

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

HNSW(Mundo pequeño de navegación jerárquica) es un algoritmo moderno que ocupa la base de datos de vectores. Se construye un gráfico de múltiples niveles, cada uno de los cuales se conecta con sus vecinos más cercanos.


```figure
norm-unit-balls
```

## Construirlo

### Paso 1: Todas las funciones de dimensiones y distancias

完整实现见 `code/distances.py` Cada función es de la construcción de zéro, sólo usando la base Python matemática

### Paso 2: La misma información, diferentes distancias, diferentes vecinos

`distances.py`En el medio de la demostración se crea un conjunto de datos, se selecciona un punto de consulta, y se muestra el vecino más cercano  cómo cambia y cambia con la distancia de la magnitud ⋅ en L1 ⋅ en el punto más cercano ⋅ en L2 o en el cosino ⋅ en el que el vecino más cercano ⋅ en el punto más cercano ⋅ en el punto más cercano ⋅ en el punto más cercano ⋅ en el punto más cercano ⋅ en el punto más cercano ⋅ en el punto más cercano ⋅ en el punto más cercano ⋅ en el punto más cercano ⋅ en el punto más cercano ⋅ en el punto más cercano ⋅ en el punto más cercano ⋅ en el punto más cercano ⋅ en el punto más cercano ⋅ en el punto más cercano ⋅ en el punto más cercano ⋅ en el punto más cercano ⋅ en el cosino ⋅ en el punto más cercano ⋅ en el punto más cercano ⋅ en el punto más cercano ⋅ en el punto más cercano ⋅ en el punto más cercano ⋅ en el punto más cercano ⋅ en el punto

### 步骤 3:Inmover búsqueda de similitud

代码包含一个模拟嵌入式相似性搜索,使用共数相似性与L2距离 查找与查询 最相似的文档,展示排名可能不同──

## Usalo

Útigo real: en la base de datos vectorial buscar en la base de datos similares.

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

Cuando tú调用 `model.encode(text)`Luego, cuando buscas una base de datos vectorial, lo que ocurre en la base es esto. El modelo de incorporación se asigna a los vectores. La base de datos vectorial calcula la similitud cosínica entre el vector de consulta y cada vector almacenado.

##  ejercicios

1. 計算 (1, 2, 3) 和 (4, 0, 6)  之间的 L1、L2 和 L-infinity distancias。验证对任意一对点,总有L-inf <= L2 <= L1。证明为什么这个顺序一定成立──

2. 创建两个向量,使宇宙相似性 很高(> 0.9), pero L2 distancia 很大(> 10) ・・・ 从几何角度解释发生了什么――然后创建两个向量,使宇宙相似性 很低(< 0.3), pero L2 distancia 很小(< 0.5) ・・・

3. 实现 una función, recibir un conjunto de datos y un punto de consulta,并分别返回 L1、L2、cosine 和 Mahalanobis distance 下的最近邻居──找一个数据集,使四种距离对哪个点最近的全部意见不一致──

4. Utiliza CDF 方法手动计算 [0,5, 0,5, 0,0] 和 [0, 0, 0,5, 0.5] 之间的 Wasserstein distancia──然后计算 [0,25, 0.25, 0.25, 0.25] 和 [0, 0, 0,5, 0.5] 之间的距离──哪个更大,为什么?

5. Para lograr la similitud de Jaccard 实现 MinHash── generar 100 个随机集合, calcular todos los pares de Jaccard,并使用 50、100、200 个 hash funciones  MinHash 近似进行比较──绘制近似误差──

## 关键术语: "El hombre es un hombre"

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

- [FAISS: A Library for Efficient Similarity Search](https://github.com/facebookresearch/faiss)- Meta utiliza una biblioteca de búsqueda de ANN a una escala de mil millones
- [Wasserstein GAN (Arjovsky et al., 2017)](https://arxiv.org/abs/1701.07875)- La distancia del Mover de la Tierra  introducción GANs 论文
- [Locality-Sensitive Hashing (Indyk & Motwani, 1998)](https://dl.acm.org/doi/10.1145/276698.276876)- 基础 ANN 算法
- [Efficient Estimation of Word Representations (Mikolov et al., 2013)](https://arxiv.org/abs/1301.3781)- Word2Vec, similaridad de cosina en los embebidos entre se convirtió en el lugar de elección preferente
- [sklearn.neighbors documentation](https://scikit-learn.org/stable/modules/neighbors.html)- guía práctica de la medición de distancia y los algoritmos de vecindad
