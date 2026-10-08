# 范数与距离

> Sizin mesafe işlevi, size benzerlik gösterdi.

**Type:** Build
**Language:**Python
**前置要求：**1. Fase Dersler 01 (Hattı Cevabı İntüyüsü),02 (Vektörler, Matrisler ve İşlemler)
**Time:** ~90 分钟

## Öğrenme hedefi

- L1、L2、cosine、Mahalanobis、Jaccard 和 edit distance  işlevi
- Bu nedenle, bu görevler, uygun mesafe ölçüsünü seçerek, diğer seçeneklerin neden başarısız olduğunu açıklar.
- L1 ve L2 范数'leri LASSO、Ridge  正则化 ve onun geometrik kısıtlama bölgesine bağlamak
-  gösterir Aynı veri kümesi farklı ölçülerde farklı yakın komşuları oluşturacak

## 问题

İki vektörünüz var. Bunlar kelimeler olabilir. Ayrıca kullanıcı resimleri olabilir.

Cevap tamamen hangisi uzaklık fonksiyonunu seçtiğine bağlıdır. Bir ölçümde iki veri noktası en yakın komşu olabilir, diğer ölçümde ise çok uzaklıkta olabilir. KNN sınıflandırıcınız, önerim motorunuz, vektör veritabanınız, kümelerleme algoritması, Kayıp fonksiyonu bu seçeneğe bağlıdır.

En iyi genel mesafe yoktur. L2  适合空间数据。 NLP'de öne çıkan köşe benzerliği。 Jackard 处理集合。 Edit distance 处理字串。 Mahalanobis 会考虑相关性。 Wasserstein 会移动概率质量。

Bu ders, her ana mesafe işleviyi sıfırdan inşa ederek, hangi işlevi ne zaman kullanılacağını açıklar ve aynı veriyi farklı ölçümlerin kullanılması nedeniyle tamamen farklı komşuları nasıl oluşturacağını gösterir.

## 概念

### Normalar:测量 vektörü

范数 ölçüsü bir vektörün 大小── iki vektör arasındaki her mesafe işlevi, farklı değerlerin 范数 olarak yazılabilir: d, b) = a - b a ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ 

### L1 Norm ((Manhattan uzaklığı)

L1 normı tüm bölümlerin mutlak değerini gerektirir ve

```
||x||_1 = |x_1| + |x_2| + ... + |x_n|
```

Manhattan mesafe olarak adlandırılır, çünkü şehir ağının ortasında yürüyüş mesafesi ölçer, orada sadece bir çizgi asın boyunca hareket edebilirsin, köşeler karşısında yürüyemezsin.

```
Point A = (1, 1)
Point B = (4, 5)

L1 distance = |4-1| + |5-1| = 3 + 4 = 7

On a grid, you walk 3 blocks east and 4 blocks north.
```

何時使用 L1:
- 高维稀疏数据(文本特征、one-hot kodlamalar)
- Eğer bu kadar yüksek bir oranın olmasını istiyorsan daha iyi bir zaman elde edeceksin.
- Özellikle seçme sorunu (L1 düzenlenme, nadirliği teşvik eder)

L1 düzenlenmesi ile bağlantı: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Cezası: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ceza: L1 Ce

Loss Fungsiları ile bağlantı: Ortalama Kesin Hata (MAE) = tahmin değeri ve hedef değeri arasındaki L1 mesafesinin ortalama değeri.

### L2 Norm ((Euklid uzaklığı)

L2 normı, düz çizgi mesafedir.

```
||x||_2 = sqrt(x_1^2 + x_2^2 + ... + x_n^2)
```

Bu, geometri dersinde öğrendiğin mesafe.

```
Point A = (1, 1)
Point B = (4, 5)

L2 distance = sqrt((4-1)^2 + (5-1)^2) = sqrt(9 + 16) = sqrt(25) = 5.0

The straight line, cutting diagonally through the grid.
```

何時使用 L2:
- 低到中等维度的连续数据
- Özellik ölçüsü karşılaştırılabilir
- 物理距離(空间数据、传感器读数)
- 像素级的图像相似度 (tıpkı resim gibi)

L2 düzenlenmesi ile bağlantı: L2 Ridge: Bu işlevi 2^2'ye dahil olurken daha büyük bir ağırlık cezalandırır. L1'den farklı olarak, ağırlığı sıfıra doğru atmaz.

Hasar İşlevleri ile bağlantı: Orta Çekirde Hata ((MSE) L2 mesafeler 平方的平均值──平方会比小误差更重地惩罚大误差──

```
MAE (L1 loss):  |y - y_hat|         Linear penalty. Robust to outliers.
MSE (L2 loss):  (y - y_hat)^2       Quadratic penalty. Sensitive to outliers.
```

### Lp Normaları:通用族

L1 ve L2 Lp normunun özel durumları:

```
||x||_p = (|x_1|^p + |x_2|^p + ... + |x_n|^p)^(1/p)
```

Farklı p   değerleri farklı şekillerde birlik topları  ((çıkış noktasından 1'in tüm noktalarının toplamı) oluşur:

```
p=1:    Diamond shape      (corners on axes)
p=2:    Circle/sphere      (the usual round ball)
p=3:    Superellipse       (rounded square)
p=inf:  Square/hypercube   (flat sides along axes)
```

### L- sonsuzluk Norm ((Chebyshev mesafe)

Sıcaklıktan sonra, Lp normunun en büyük mutlak oranına ulaşması mümkün.

```
||x||_inf = max(|x_1|, |x_2|, ..., |x_n|)
```

İki nokta arasındaki mesafe, birbirinden en büyük farkı belirleyen boyutlara göre belirlenir.

```
Point A = (1, 1)
Point B = (4, 5)

L-inf distance = max(|4-1|, |5-1|) = max(3, 4) = 4
```

何時使用 L-infinity:
- Tek bir tekliğin en kötü durumunun farkı önemli olduğunda
- 游戏棋盘(国际象棋中的国王按L-infinity 移动:任意方向走一步的代价都是1)
- 制造公差 ((( her boyut da düzenleyici olarak yapılmalıdır)

### Kosin benzerliği 和 Kosin mesafe

Cosine benzerliği  iki vektör arasındaki açıyı ölçmek, büyüklüğünü göz ardı etmek

```
cos_sim(a, b) = (a . b) / (||a||_2 * ||b||_2)
```

Onun aralığı -1 ((direction相反) ile +1 ((direction same) ⋅垂直 vektörlerin kozine benzerliği 为 0。

Kosine mesafeyi değiştirir:kosine_distance = 1 -kosine_semblance──范围是 0(方向相同) to 2(方向相反)──

```
a = (1, 0)    b = (1, 1)

cos_sim = (1*1 + 0*1) / (1 * sqrt(2)) = 1/sqrt(2) = 0.707
cos_dist = 1 - 0.707 = 0.293
```

Neden kozine NLP ve yerleşimlerde baskın yönü: metinde, dosya uzunluğu benzerliği etmemelisin.

何時使用 cosine benzerliği:
- 文本相似度(TF-IDF vektörleri、 kelimeler yerleştirmeleri、 cümle yerleştirmeleri)
- Herhangi bir büyüklükteki ses ses, yönü sinyal alanıdır.
- 推系统(User preference Vectors)
- Arama yerleştirmek (vektor veritabanları neredeyse her zaman cosine veya nokta ürünü kullanır)

### Dot Ürün Benliği vs. Kosin Benliği

两个向的点产量是:

```
a . b = a_1*b_1 + a_2*b_2 + ... + a_n*b_n
      = ||a|| * ||b|| * cos(angle)
```

Kosine benzerliği iki büyüklükte birleştirilmesinden sonra nokta ürünüdür.

```
If ||a|| = 1 and ||b|| = 1:
    a . b = cos(angle between a and b)
```

它们的不同情况:dot product 包含大小信息──大小更大的矢量 会得到更高的点 product 分数──在一些检索系统中, eğer 热门物品排名更高, bu nokta önemlidir──大小会作为隐式质量或重要性信号──

```
a = (3, 0)    b = (1, 0)    c = (0, 1)

dot(a, b) = 3     dot(a, c) = 0
cos(a, b) = 1.0   cos(a, c) = 0.0

Both agree on direction, but dot product also reflects magnitude.
```

实践中:
- Eğer tam bir yönde benzerlik istiyorsan, kozine benzerliği kullan.
- Büyük bir miktar anlamlı bilgi taşıdığında, nokta ürünü kullan
- 许多 vector databases ((Pinecone、Weaviate、Qdrant) izin verir iki arasında seçim yapın
- Eğer yerleşimleriniz L2'ye normalleşmişse, seçen her şey geçerli.

### Mahalanobis Uzaklığı

Euclidean mesafe tüm boyutlara eşit davranır. Ama özellikleriniz ilişkili veya boyut farklı ise, L2 yanlış yönlendirme sonuçları verir.

Mahalanobis mesafesinin veri değişikliğini göz önünde bulundurur 结构。

```
d_M(x, y) = sqrt((x - y)^T * S^(-1) * (x - y))
```

S'in arasında veri değişkenlik matrisi vardır.

直观理解:Mahalanobis mesafe önce verilere ilişkin birleştirme yapar, sonra değişim sonrası uzayda L2 mesafe hesaplanır. S bir kimlik matrisi ise,Mahalanobis mesafeyi evklid mesafe olarak geri çevirir.

```
Example: height and weight are correlated.
Someone 6'2" and 180 lbs is not unusual.
Someone 5'0" and 180 lbs is unusual.

Euclidean distance might say they are equally far from the mean.
Mahalanobis distance correctly identifies the second as an outlier
because it accounts for the height-weight correlation.
```

何時使用 Mahalanobis mesafe:
- Uçuk algılama ((= ortalama değer Mahalanobis mesafesinden                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
- Özellik ölçüsü farklı ve ilişki vardır zaman sınıflandırma
- Eğer yeterince veriler varsa güvenilir bir kovariansa matrisi değerlendirmek için
- 制造质量控制 (do变量过程监控)

### Jaccard Benzerliği ((用于集合)

Jackard benzerliği  Ölçmek iki topluluk arasındaki ağırlıklılık derecesi

```
J(A, B) = |A intersect B| / |A union B|
```

Onun kapsamı 0( hiçbir ağırlık) 1( toplam aynı) ・・・Jaccard mesafe = 1 - Jaccard benzerliği。

```
A = {cat, dog, fish}
B = {cat, bird, fish, snake}

Intersection = {cat, fish}         size = 2
Union = {cat, dog, fish, bird, snake}  size = 5

Jaccard similarity = 2/5 = 0.4
Jaccard distance = 0.6
```

何時使用 Jaccard:
- Etiket, sınıf veya özellik koleksiyonu ile karşılaştırın
- 基于词是否出现的文档相似度 (frequency yerine kelimelerin oluşumu)
- Yakın dönümleşme testleri (Jaccard'ın MinHash 近似)
- Bireysel değer özellik vektörleri (data var/ yok)
- 评估分割模型(Bölge üzerinde kesim = Jaccard)

### Edit Distance(Levenshtein Distance)

Edit distance 计算把一个字符串转换为另一个字符串所需的最小单字符操作数――操作包括:插入、删除或替换──

```
"kitten" -> "sitting"

kitten -> sitten  (substitute k -> s)
sitten -> sittin  (substitute e -> i)
sittin -> sitting (insert g)

Edit distance = 3
```

kullanıyor. Bu metrikte, bir metrik doldurulur.

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

何時使用 düzenleme mesafe:
- 拼写 kontrol ve düzeltme
- DNA sırası düzeltme (带加权操作)
- 模糊字符串匹配
- 脏文本数据去重

### KL Divergence( mesafe değil, ama genellikle bir mesafe olarak kullanılır)

KL farklılığı  bir olasılık dağılımının diğer olasılık dağılımının farklılığını ölçmek. Bu konunun içeriği Ders 09'da anlatılmıştı, ancak bu tartışmaya dahil, çünkü insanlar genellikle onu  mesafe  olarak kullanırlar, ancak mesafe değildir.

```
D_KL(P || Q) = sum(p(x) * log(p(x) / q(x)))
```

KL farklılığı, birbiriyle karşılaştırılmıyor.

```
D_KL(P || Q) != D_KL(Q || P)
```

Bu, mesafe ölçüsünün temel gerekliliklerini karşılamıyor demektir.

Önceki KL(D_KL(P  Q)) is anlam aramak:Q 试图覆盖 P'ın tüm modlarını¬¬
Reverse KL(D_KL(Q   P)) ismode-seeking:Q 专注于P 的单个模式──

Bu yerlerde KL'nin farklılığını göreceksiniz:
- VAE(ELBO'nun KL 项会把潜伏分布 推向前)
- Bilgi destilasyonu(öğrenci 试图匹配 öğretmen 分布)
- RLHF(KL cezası 让细调模型 保持接近基模型)
- Politika gradiyenti yöntemleri (Polisi güncellemeleri)

### Wasserstein Uzaklığı(Yeryüzü Hareketçisinin Uzaklığı)

Wasserstein mesafe  ölçüm bir olasılık dağılımını diğer olasılık dağılımına dönüştürmek için gerekli en az  iş ── bu şekilde anlayabilirsiniz: Eğer bir dağılım toprağın bir yığını ise, diğer bir crater ise, ne kadar toprağı hareket ettirmek gerekir  moving how far?

```
W(P, Q) = inf over all transport plans gamma of E[d(x, y)]
```

1D dağılım için, toplam dağılım işlevi mutlak farkın积分 olarak basitleştirilir:

```
W_1(P, Q) = integral |CDF_P(x) - CDF_Q(x)| dx
```

Neden Wasserstein  önemli:
- Bu gerçek bir metrik.
- Hatta dağılım da fazla değil, aynı zamanda Gradientler de sağlayabilir.
- Bu özellik, Wasserstein GAN'larının (WGAN'ların) çekirdeğine dönüştürdü ve sonradan orijinal GAN'ların eğitiminde belirsiz sorunlar çözüldü.

```
Distributions with no overlap:

P: [1, 0, 0, 0, 0]    Q: [0, 0, 0, 0, 1]

KL divergence: infinity (log of zero)
Wasserstein: 4 (move all mass 4 bins)

Wasserstein gives a meaningful gradient. KL does not.
```

何時使用 Wasserstein:
- GAN eğitim ((WGAN、WGAN-GP)
- Bireyen olası dağılım
- Optimal ulaşım 问题
- 图像检索(比较颜色直方图)

### Neden farklı görevler farklı mesafeler gerektiriyor?

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

### Kayıp Fonksiyonları ile bağlantı

Kayıp Fonksiyonları, tahmin değeri ile hedef değeri arasındaki mesafe işlevi olarak kullanılır.

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

### Düzgünleşme ile bağlantı

Normalleşme: Kayıp fonksiyonu

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

L1 neden nadir oluşur ve L2 neden olmaz: 2D  Vücut ağırlığı alanındaki kısım bölgesi hayal edin. L1  şekillidir, L2 圆形edir.

### En Yakın Komşunu Aramak

Her mesafe işlevi en yakın komşu arama içerir.

En yakın komşu arama n 个点、d 个维度 的数据集 içerir, her sorunun karmaşıklığı O  n * d)                                                                                                                                                                                                                                              

Yaklaşık En Yakın Komşular (ANN) algoritması, büyük bir hızla yükseltmek için az miktarda doğru oranı kullanıyor:

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

HNSW(Hiyerarşik Yürüyen Küçük Dünya) modern vektör veritabanlarında en büyük algoritma yer alıyor. Bu bir çok katlı çizgi oluşturur, her bir nokta en yakın komşularına bağlanır.


```figure
norm-unit-balls
```

## Yapın onu.

### 步骤 1: Tüm fonksiyonlar ve mesafeler

完整实现见 `code/distances.py` her işlev, sadece Python matematikleri temelinde kullanılarak, 

### 步骤 2: Aynı veri, farklı mesafeler, farklı komşular

`distances.py`Orta demo bir veri kümesi oluşturur, bir sorgu noktasını seçer ve en yakın komşunun mesafe ölçüsünün değişmesi ve değişmesi ile nasıl değiştiğini gösterir. L1'de aşağıya yakın bir noktada, L2'de veya cosine'de aşağıya yakın olmayabilir.

### 步骤 3:Embedding benzerlik arama

代码包含一个模拟嵌入式相似性搜索,使用kosinus相似性与L2距离 查找与查询 最相似的文档,展示排名可能不同──

## Kullan

En yaygın kullanım: vektör veritabanında benzerlik bul

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

- Ne ? - Ne ?`model.encode(text)`Sonra vektör veritabanını ararsanız, alt katlı oluşum budur. Eklenti modeli, metni vektörler olarak görüntüleyecek.

## 练习

1. 計算 (1, 2, 3) 和 (4, 0, 6)   arasındaki L1、L2 和 L- sonsuzluk mesafeleri。验证任意一对点,总有L-inf <= L2 <= L1。证明为什么这个顺序一定成立──

2. 创建两个向量,使宇宙相似性 很高(> 0.9),但 L2距离 很大(> 10) ・・・从几何角度解释发生了什么――然后创建两个向量,使宇宙相似性 很低(< 0.3),但 L2距离 很小(< 0.5) ・・・

3. 函数 gerçekleştirmek, bir veri kümesi ve bir sorgu noktasını almak, L1、L2、kosine 和 Mahalanobis mesafesini geri ayırmak, aşağıdaki en yakın komşunun bir veri kümesi bulmak, hangi noktaya yakın olan dört farklı mesafeyi oluşturmak.

4. CDF 方法手动计算 [0.5, 0.5, 0, 0] 和 [0, 0, 0.5, 0.5]  arasındaki Wasserstein mesafe──然后计算 [0.25, 0.25, 0.25, 0.25] 和 [0, 0, 0.5, 0.5] 之间的距离──哪个更大,为什么?

5. Yaklaşık bir şekilde Jaccard benzerliği 实现 MinHash──生成 100 个随机集合,计算所有对的精确 Jaccard,并使用 50、100、200 个 hash 函数 的 MinHash 近似进行比较──绘制近似误差──

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

- [FAISS: A Library for Efficient Similarity Search](https://github.com/facebookresearch/faiss)- Meta , milyarlarca ANN arama kütlesini kullanıyor .
- [Wasserstein GAN (Arjovsky et al., 2017)](https://arxiv.org/abs/1701.07875)- Yer Hareketçisi'nin mesafesini belirlemek  引入 GANs 的论文
- [Locality-Sensitive Hashing (Indyk & Motwani, 1998)](https://dl.acm.org/doi/10.1145/276698.276876)- 基础 ANN 算法
- [Efficient Estimation of Word Representations (Mikolov et al., 2013)](https://arxiv.org/abs/1301.3781)- Word2Vec, cozin benzerliği embeddings içinde bir tercih haline geldi
- [sklearn.neighbors documentation](https://scikit-learn.org/stable/modules/neighbors.html)- Orta mesafe ölçüsü ve komşu algoritması pratik yönlendirme
