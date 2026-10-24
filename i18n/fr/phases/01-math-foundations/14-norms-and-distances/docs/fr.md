# Fan numérique et distance

> Votre fonction de distance définit ce qu'on appelle une similitude.

**Type:** Build
**Language:**Python
**前置要求：**Phase 1, Leçons 01 (Intuition de l'algèbre linéaire),02 (Vecteurs, matrices et opérations)
**Time:** ~90 分钟

## Objectif de l'apprentissage

- De zéro réaliser L1、L2、cosine、Mahalanobis、Jaccard 和 modifier la distance  fonction
- Pour déterminer la tâche ML, choisir la mesure de distance appropriée, et expliquer pourquoi d'autres choix échoueront.
- L1 et L2 sont liés à la régulation des zones de la Ridge et de la LSO
-  montrer le même ensemble de données dans différentes dimensions produira différents voisins les plus proches

##  problématique

Vous avez deux vecteurs. Ils peuvent être des emblèmes de mots. Ils peuvent aussi être des images utilisateur.

La réponse dépend entièrement de la fonction de distance que vous choisissez. Deux points de données peuvent être les voisins les plus proches d'une mesure, mais très éloignés d'une autre. Votre classifiateur KNN, votre moteur de recommandation, votre base de données vectorielle, votre algorithme de regroupement, votre fonction de perte dépendent de cette option.

Il n'existe pas de meilleure distance commune. L2  adapté à l'espace. Les similitudes de cousine dans la PNL sont les principales. Jaccard  traitement de la collection. Modifier la distance. Traiter des chaînes. Mahalanobis 会考虑相关性.

Ce cours va construire chaque fonction principale de distance à partir de zéro, expliquer quand utiliser laquelle, et montrer comment la même partie de données génère des voisins proches complètement différents en raison de l'utilisation de différentes mesures.

## 概念

### Normes: Vecteur de mesure

范数衡量一个向量的大小──. Chaque fonction de distance entre deux vecteurs peut être écrite comme leur différence de valeur de范数:$d(a, b) = \lVert a - b \rVert$ Donc comprendre le nombre de variables est comprendre la distance

### L1 Norm (distance de Manhattan)

Norme L1 pour la valeur absolue de toutes les fractions

```math
\lVert x \rVert_1 = |x_1| + |x_2| + \cdots + |x_n|
```

On l'appelle la distance de Manhattan, car elle mesure la distance entre les réseaux urbains où vous ne pouvez vous déplacer qu'à l'extrémité du contour, sans pouvoir vous déplacer à l'angle.

```
Point A = (1, 1)
Point B = (4, 5)

L1 distance = |4-1| + |5-1| = 3 + 4 = 7

On a grid, you walk 3 blocks east and 4 blocks north.
```

何時使用 L1:
- 高维稀疏数据(文本特征、one-hot codings)
- Quand tu veux être plus stable que les autres, une différence énorme ne va pas dominer le résultat.
- 特征选择问题(L1 régularisation 会促进稀疏性)

Résultats de la régularisation de L1$\lVert w \rVert_1$, punira le poids absolu et de la valeur. Ceci mettra le poids plus petit au zéro précis, ce qui entraînera l'exécution automatique de la sélection des caractéristiques. L1 penalty entraînera une zone de contraction en forme de poids dans l'espace de poids, tandis que le coin de forme se situera sur l'axe de la position, où certains poids sont à zéro.

Avec des fonctions de perte de liaison:Erreur absolue moyenne (MAE) est la valeur moyenne de la distance L1 entre la valeur prévue et la valeur cible.

### L2 Normalement ((distance euclidienne)

La norme L2 est la distance directe. Elle est égale à la racine carrée de la quantité carrée.

```math
\lVert x \rVert_2 = \sqrt{x_1^2 + x_2^2 + \cdots + x_n^2}
```

C'est la distance que tu as apprise en géographie.$n$维中勾股定理──

```
Point A = (1, 1)
Point B = (4, 5)

L2 distance = sqrt((4-1)^2 + (5-1)^2) = sqrt(9 + 16) = sqrt(25) = 5.0

The straight line, cutting diagonally through the grid.
```

何時使用 L2:
- 低到中等维度的连续数据
- Lorsque la taille est comparable
- 物理距离(空间数据、传感器读数)
- La similitude d'image de la classe de la image

Réglementation de l2 (Ridge)$\lVert w \rVert_2^2$, punirait un poids plus grand. Il ne serait pas différent de L1, il ne serait pas poids réduit à zéro. Il serait proportionnellement réduit à zéro.

Avec les fonctions de perte de contact:Erreur moyenne carré (MSE) est L2 distances 平方的平均值──平方会比小误差更重地惩罚大误差──

```math
\begin{aligned}
\text{MAE（L1 loss）：} \quad & |y - \hat{y}| && \text{线性惩罚。对离群值稳健。} \\
\text{MSE（L2 loss）：} \quad & (y - \hat{y})^2 && \text{二次惩罚。对离群值敏感。}
\end{aligned}
```

### Normes de l'Ip:

L1 et L2 sont des spécificités de la norme Lp:

```math
\lVert x \rVert_p = (|x_1|^p + |x_2|^p + \cdots + |x_n|^p)^{1/p}
```

- Ça ne va pas .$p$值会产生不同形状的单位球((距离原点至多为 1 的所有点的集合; ci-dessous est illustré leur bordure):

```
p=1:    Diamond shape      (corners on axes)
p=2:    Circle/sphere      (the usual round ball)
p=3:    Superellipse       (rounded square)
p=inf:  Square/hypercube   (flat sides along axes)
```

### L-infini Norma ((Chebyshev distance)

- Je suis là .$p$趋近无穷大时,Lp norm 收到最大绝对分量──

```math
\lVert x \rVert_\infty = \max(|x_1|, |x_2|, \ldots, |x_n|)
```

La distance entre les deux points est déterminée par la dimension la plus grande de leur différence.

```math
\begin{aligned}
\text{点 } A &= (1, 1) \\
\text{点 } B &= (4, 5) \\[6pt]
L_\infty \text{ 距离} &= \max(|4-1|, |5-1|) = \max(3, 4) = 4
\end{aligned}
```

何時使用 L-infinity:
- Quand la différence entre les meilleures conditions est importante
- 游戏棋盘(国际象棋中的国王按L-infinity 移动:任意方向走一步的代价都是 1)
- 制造公差 ((( chaque dimension doit être dans le cadre de la réglementation)

### Similation cosine et distance cosine

La similitude cosine mesure les angles entre deux vecteurs, les négligeant en grandeur.

```math
\text{cos\_sim}(a, b) = \frac{a \cdot b}{\lVert a \rVert_2 \, \lVert b \rVert_2}
```

Sa portée est de -1 ((direction相反) à +1 ((direction identique) ⋅ similitude cosytique des vecteurs verticaux 为 0。

La distance cosine va la transformer en distance:cosine_distance = 1 - cosine_similarité。 la portée est 0(direction identique) à 2 ((direction相反)。

```math
\begin{aligned}
& a = (1, 0) \qquad b = (1, 1) \\[6pt]
& \text{cos\_sim} = \frac{1 \cdot 1 + 0 \cdot 1}{1 \cdot \sqrt{2}} = \frac{1}{\sqrt{2}} = 0.707 \\
& \text{cos\_dist} = 1 - 0.707 = 0.293
\end{aligned}
```

Pourquoi le cosine dans la PNL et les emblèmes dominent: dans le texte, la longueur du document ne devrait pas affecter la similitude.

何時使用 similitude cosine:
- 文本相似度(vecteurs TF-IDF, emblèmes de mots, emblèmes de phrases)
- Tout ce qui est grand est un bruit, une direction est le domaine du signal.
- 推系统( préférence des utilisateurs Vecteurs)
- Embedding search ((bases de données vectorielles  presque toujours utilisant cosine ou produit de point)

### Parallèle produit point parallèle cosine

Le produit de la dot de 两个向量是:

```math
\begin{aligned}
a \cdot b &= a_1 b_1 + a_2 b_2 + \cdots + a_n b_n \\
&= \lVert a \rVert \, \lVert b \rVert \cos(\text{角度})
\end{aligned}
```

La similitude cosine est le produit de deux points de grandeur après la régulation.

```math
\text{如果 } \lVert a \rVert = 1 \text{ 与 } \lVert b \rVert = 1: \quad a \cdot b = \cos(\text{夹角，介于 } a \text{ 与 } b)
```

它们不同情况:dot product 包含大小信息──大小更大的矢量会得到更高的点 product 分数── Dans certains systèmes de recherche, si vous souhaitez que les articles de la catégorie 热门物品 se classent plus haut, c'est très important──大小会作为隐式质量或重要性信号──

```
a = (3, 0)    b = (1, 0)    c = (0, 1)

dot(a, b) = 3     dot(a, c) = 0
cos(a, b) = 1.0   cos(a, c) = 0.0

Both agree on direction, but dot product also reflects magnitude.
```

实践中:
- Quand vous voulez une direction pure de similitude, utilisez la similitude cosine
- Lorsque vous portez des informations significatives, utilisez le produit dot
- 许多矢量数据库(Pinecone、Weaviate、Qdrant) vous permet de choisir entre les deux
- Si vos intégrations sont normalisées, alors choisissez qui vous voulez.

### Distance à Mahalanobis

La distance euclidienne est égale à toutes les dimensions. Mais si vos caractéristiques sont liées ou si les dimensions sont différentes, L2 donnera un résultat d'erreur.

La distance de Mahalanobis serait prise en compte de la covariance de la structure.

```math
d_M(x, y) = \sqrt{(x - y)^T S^{-1} (x - y)}
```

Parmi eux $S$est la matrice de covariance des données.

直观理解: La distance de Mahalanobis 会先对数据去相关并归归一化(blanchissement), puis dans le changement de l'espace après calculer la distance L2──如果$S$Il s'agit d'une matrice d'identité (en anglais seulement), une distance de Mahalanobis qui sera définie comme une distance euclidienne.

```
Example: height and weight are correlated.
Someone 6'2" and 180 lbs is not unusual.
Someone 5'0" and 180 lbs is unusual.

Euclidean distance might say they are equally far from the mean.
Mahalanobis distance correctly identifies the second as an outlier
because it accounts for the height-weight correlation.
```

何时使用 Mahalanobis distance:
- Détection de points étranges avec la valeur moyenne de la distance de Mahalanobis (plus grands points sont des points étranges)
- Classification lorsque les caractéristiques sont différentes et qu'il existe une relation
- Quand vous avez assez de données pour estimer une matrice de covariance fiable
- 制造质量控制 (la gestion du processus de fabrication de la quantité de matières utilisées)

### Le jeu de l'action

La similitude de Jaccard mesure le degré de superposition entre deux ensembles.

```math
J(A, B) = \frac{|A \cap B|}{|A \cup B|}
```

Il est de 0 ((( pas de suremplacement) à 1 (( (ensemble identique) ▽) ⋅ distance de Jaccard = 1 - similitude de Jaccard。

```
A = {cat, dog, fish}
B = {cat, bird, fish, snake}

Intersection = {cat, fish}         size = 2
Union = {cat, dog, fish, bird, snake}  size = 5

Jaccard similarity = 2/5 = 0.4
Jaccard distance = 0.6
```

何時使用 Jaccard:
- Comparaison des étiquettes, des catégories ou des ensembles de caractéristiques
- 基于词是否出现的文档相似度 (au lieu de la fréquence)
- Il est également connu pour avoir été un héros de la série de télécommunications télévisées.
- Comparer les vecteurs de caractéristiques de valeur (existant/non-existent)
- 评估分割模型(Intersection sur l'Union = Jaccard)

### Modifier la distance

Modifier la distance 计算把一个字符串转换成另一个字符串所需的最小单字符操作数――操作包括:插入、删除或替换──

```
"kitten" -> "sitting"

kitten -> sitten  (substitute k -> s)
sitten -> sittin  (substitute e -> i)
sittin -> sitting (insert g)

Edit distance = 3
```

Utilisation de l'écriture et de la définition de l'article$(i, j)$Oui, c'est vrai.$i$个字符与字符串 B 的前$j$Distance de commentaire entre les caractères:

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

何時使用 distance de modification:
- 拼写 vérification et rectification
- L'alignement des séquences d'ADN
- 模糊字符串匹配
- 脏文本数据去重

### KL Divergence (non distante, mais souvent utilisée comme distance)

La différence de la distribution de probabilité est mesurée par la différence de la distribution de probabilité entre les deux. Ce contenu a été discuté dans la leçon 09 mais il fait partie de cette discussion, car on l'utilise souvent comme une distance, bien qu'il ne soit pas une distance.

```math
D_{KL}(P \,\|\, Q) = \sum_x p(x) \log\frac{p(x)}{q(x)}
```

关键性质:La divergence de la LC n'est pas une référence à la LC.

```math
D_{KL}(P \,\|\, Q) \ne D_{KL}(Q \,\|\, P)
```

Cela signifie qu'il ne répond pas aux exigences fondamentales de la distance.

Poursuite KL($D_{KL}(P \Vert Q)$) est à la recherche de sens:$Q$试图覆盖 $P$Tous les modes.
Retour en arrière KL($D_{KL}(Q \Vert P)$) est à la recherche de modes:$Q$                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             $P$Le mode de l'unité.

Vous verrez la divergence KL dans ces endroits:
- Les échanges de données (en anglais seulement)
- Destilation des connaissances (étudiant 试图匹配 enseignant 的分布)
- RLHF(penalty KL 让 fine tuned model 保持接近基本模型)
- Métodes de gradient de la politique (en anglais seulement)

### Distance de Wasserstein (distance du déménageur de la Terre)

La distance de Wasserstein  mesure la transformation d'une distribution de probabilité en une autre distribution de probabilité                                                                                                                                                                                                                                                  

```math
W(P, Q) = \inf_{\gamma} \mathbb{E}[d(x, y)] \quad \text{（遍历所有运输方案 } \gamma\text{）}
```

Pour 1D, il se simplifiera en calculant la fonction de distribution accumulée:

```math
W_1(P, Q) = \int |\text{CDF}_P(x) - \text{CDF}_Q(x)| \, dx
```

Pourquoi Wasserstein est important ?
- C'est une vraie métrique.
- Même si la distribution ne se compose pas, elle peut aussi fournir des gradients (la divergence KL tend à être infinie)
- Cette nature en fait le cœur des GAN de Wasserstein, qui ont résolu le problème de l'instabilité des GANs originaux.

```
Distributions with no overlap:

P: [1, 0, 0, 0, 0]    Q: [0, 0, 0, 0, 1]

KL divergence: infinity (log of zero)
Wasserstein: 4 (move all mass 4 bins)

Wasserstein gives a meaningful gradient. KL does not.
```

何時使用 Wasserstein:
- Formation en GAN (GAN-GP)
- Comparer la répartition possible
- Transport optimal 问题
- 图像检索(parler avec une image droite)

### Pourquoi différentes tâches doivent être différentes ?

| Task | Best distance | Why |
|------|--------------|-----|
| 文本相似度 | Cosine | 大小是噪声，方向是含义 |
| 图像像素比较 | L2 | 空间关系重要，特征尺度可比较 |
| 稀疏高维特征 | L1 | 稳健，不会放大罕见的大差异 |
| 集合重叠（标签、类别） | Jaccard | 数据天然是集合值，而不是 Vector 型 |
| 字符串匹配 | Edit distance | 操作映射到人类编辑直觉 |
| Outlier detection | Mahalanobis | 考虑特征相关性和尺度 |
| 比较分布 | KL divergence | 衡量使用 $Q$ 而不是 $P$ 时丢失的信息 |
| GAN training | Wasserstein | 即使分布不重叠也能提供 Gradients |
| Embeddings（vector DB） | Cosine or dot product | Embeddings 被训练为在方向中编码含义 |
| 推荐 | Dot product | 大小可以编码流行度或置信度 |
| DNA sequences | Weighted edit distance | 替换成本因核苷酸对而异 |
| Manufacturing QC | L-infinity | 任意维度中的最坏情况偏差都很重要 |

### Contact avec les fonctions de perte

Les fonctions de perte sont des fonctions de distance entre la valeur prévue et la valeur cible.

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

### Le lien avec la normalisation

L'intégration de la fonction de perte de poids est une partie de la fonction de perte de poids.

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

Pourquoi L1 aura une rareté alors que L2 ne le fera pas: imaginez la zone de confinement 2D  en espace de poids. L1 est  forme, L2 est  forme.

### Rechercher le voisin le plus proche

Chaque fonction de distance implique une recherche de voisin le plus proche.

La recherche de voisin la plus proche est contenue .$n$Je suis là.$d$La complexité de chaque requête est de$O(n \cdot d)$Pour les grands ensembles de données, c'est trop lent.

Le taux de croissance est de 0,5% pour les pays voisins.

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

HNSW(Hiérarchique Navigation Petit Monde) est un algorithme moderne qui domine les bases de données vectorielles. Il construit un diagramme multi-couches, chaque point étant connecté à ses voisins proches.


```figure
norm-unit-balls
```

## - Je le construis.

### 步骤 1: toutes les fonctions de fréquences et de distances

完整实现见 `code/distances.py` chaque fonction est construite à partir de zéro, en utilisant uniquement la base Python mathématiques

### étape 2: Les mêmes données, différentes distances, différents voisins

`distances.py`Le centre de démo va créer un ensemble de données, sélectionner un point de requête, et montrer le voisin le plus proche comment il change avec la distance de la mesure de variation.

### 步骤 3: recherche de similitude d'intégration

代码包含一个模拟嵌入式相似性搜索,使用共数相似性与L2距离 查找与查询 最相似的文档,展示排名可能不同──

## Utilisez-le

L'utilisation réelle la plus courante: recherche d'éléments similaires dans la base de données vectorielle.

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

Quand tu t' en fais`model.encode(text)`Ensuite, la recherche dans la base de données vectorielles 时, le niveau inférieur se produit c'est ce qui se passe. Le modèle d'intégration 会把文本映射为 Vectors. Vector database 会计算您的查询向量和每个已存储的向量 之间的宇宙相似性 (或点产品),并使用 ANN 算法避免一检查全部向量.

## 练习

1. 計算 (1, 2, 3) 和 (4, 0, 6)     L1、 L2 和 L-infinité distances。验证对任意一对点,总有 $L_\infty \le L_2 \le L_1$ prouver pourquoi cette ordonnance doit être établie

2. 创建两个向量,使宇宙相似性 很高(> 0.9),但 L2 distance 很大(> 10)。从几何角度解释发生了什么──然后创建两个向量,使宇宙相似性 很低(< 0.3),但 L2 distance 很小(< 0.5)。

3. 实现 une fonction, recevoir un ensemble de données et un point de requête,并分别返回 L1、L2、cosine 和 Mahalanobis distance 下下的最近邻居──找一个数据集,使四种距离对哪个点最近全部意见不一致──

4. C'est pourquoi, le nombre de personnes qui ont été tuées par les autorités de l'État est de plus en plus élevé.

5. Pour réaliser une similitude de Jaccard proche, générez 100 combinaisons de données, calculer toutes les paires de Jaccard précises, et comparer avec 50 、100、200 fonctions de hachage de MinHash proche, et dessiner des erreurs approximatives.

### 提示

**练习 1。**差向量为 (-3, 2, -3), donc utilisé `l1_norm`- Je suis là.`l2_norm`et `linf_norm`計算该向量的三种范数──证明时,将最大的 $\lvert d_i \rvert$Comparer à la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur

**练习 2。**La similitude cosine  néglige la longueur, donc d'abord prendre deux directions de la même trajectoire, et faire l'un de loin plus long que l'autre ⋅ Deuxièmement, utiliser deux courts trajectoires de point d'origine près de la direction opposée, réutiliser ⋅`cosine_similarity`et `l2_distance`Il y a deux conditions.

**练习 3。**Pour moi .`l1_distance`- Je suis là.`l2_distance`- Je suis là.`cosine_distance`et `mahalanobis_distance`调用 une fois `find_nearest_neighbor(query, dataset, distance_fn)`Il y a une autre.`demo_different_neighbors` a montré des données de différentes dimensions donnant des résultats différents, alors lisez-la d'abord, réajustez chaque point, jusqu'à ce que les quatre réponses soient complètement différentes 

**练习 4。**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `wasserstein_1d(p, q)`检查两次计算结果, reutiliser la probabilité de la quantité doit être déplacé pour expliquer la distance plus grande résultat.

**练习 5。**Pour chaque fonction hash, la signature MinHash d'un ensemble est la valeur minimale hash de son élément; deux ensembles obtiennent la même valeur minimale hash en proportion de la fonction hash, qui peut être estimée par leur similitude Jaccard.`jaccard_similarity`Pour la comparaison$k$个哈希函数, erreur devrait être grossière selon $1/\sqrt{k}$Je suis en train de tomber.

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Norm | “Vector 的大小” | 一个把 Vector 映射到非负标量的函数，满足三角不等式、绝对齐次性，并且只有零 Vector 的值为零 |
| L1 norm | “Manhattan distance” | 分量绝对值之和。在优化中产生稀疏性。对 outliers 稳健 |
| L2 norm | “Euclidean distance” | 平方分量之和的平方根。Euclidean space 中的直线距离 |
| Lp norm | “Generalized norm” | 分量绝对值 $p$ 次方之和的 $p$ 次根。L1 和 L2 是特殊情况 |
| L-infinity norm | “Max norm” 或 “Chebyshev distance” | 最大绝对分量值。当 $p$ 趋近无穷大时 Lp 的极限 |
| Cosine similarity | “Vectors 之间的角度” | 按两个大小归一化的 dot product。范围从 -1 到 +1。忽略 Vector 长度 |
| Cosine distance | “1 minus cosine similarity” | 将 cosine similarity 转换为距离。范围从 0 到 2 |
| Dot product | “Unnormalized cosine” | 按分量相乘后求和。等于 cosine similarity 乘以两个大小 |
| Mahalanobis distance | “Correlation-aware distance” | 在使用数据 covariance matrix 进行 whitened（去相关和归一化）后的空间中的 L2 distance |
| Jaccard similarity | “Set overlap” | 交集大小除以并集大小。用于集合，而不是 Vectors |
| Edit distance | “Levenshtein distance” | 将一个字符串转换为另一个字符串所需的最少插入、删除和替换次数 |
| KL divergence | “Distance between distributions” | 不是真正的距离（不对称）。衡量使用 $Q$ 编码 $P$ 时产生的额外 bits |
| Wasserstein distance | “Earth mover's distance” | 将质量从一个分布运输到另一个分布所需的最小 work。真正的 metric |
| Approximate nearest neighbor | “ANN search” | 比精确搜索快得多地找到近似最近点的算法（HNSW、LSH、IVF） |
| HNSW | “The vector DB algorithm” | Hierarchical Navigable Small World graph。用于快速 approximate nearest neighbor search 的多层图 |
| L1 regularization | “Lasso” | 将权重的 L1 norm 加入 Loss。把权重推向零（稀疏性） |
| L2 regularization | “Ridge” 或 “weight decay” | 将权重的平方 L2 norm 加入 Loss。将权重向零收缩，但不产生稀疏性 |
| Elastic Net | “L1 + L2” | 结合 L1 和 L2 regularization。比任意单独一种方法都更好地处理相关特征组 |

## 延伸阅读

- [FAISS: A Library for Efficient Similarity Search](https://github.com/facebookresearch/faiss)- Meta utilise une base de recherches ANN de plusieurs milliards de dollars
- [Wasserstein GAN (Arjovsky et al., 2017)](https://arxiv.org/abs/1701.07875)- Pour déterminer la distance du Mover Terre  Introduction GANs
- [Locality-Sensitive Hashing (Indyk & Motwani, 1998)](https://dl.acm.org/doi/10.1145/276698.276876)- 基础 ANN 算法
- [Efficient Estimation of Word Representations (Mikolov et al., 2013)](https://arxiv.org/abs/1301.3781)- Word2Vec, similitude de cousine dans les emblèmes entre devenir un choix de choix où
- [sklearn.neighbors documentation](https://scikit-learn.org/stable/modules/neighbors.html)- un guide pratique de la mesure de la distance moyenne et des algorithmes de voisinage
