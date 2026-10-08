# 范数 và khoảng cách

> Nhiệm vụ khoảng cách của bạn định nghĩa cái gì gọi là giống như.

**Type:** Build
**Language:**Python
**前置要求：**Giai đoạn 1, Bài học 01 (Linear Algebra Intuition),02 (Vectors, Matrices & Operations)
**Time:** ~90 分钟

## Học mục tiêu

- Từ zero thực hiện L1、L2、cosine、Mahalanobis、Jaccard 和 edit distance  hàm
- Để xác định ML  nhiệm vụ chọn một khoảng cách phù hợp, và giải thích tại sao các lựa chọn khác sẽ thất bại
- Kết nối L1 và L2 范数 với LASSO、Ridge 正规化及其几何束区
-  hiển thị cùng một tập dữ liệu sẽ tạo ra các hàng xóm gần nhất khác nhau trong số lượng khác nhau

## 问题

Bạn có hai vector. Chúng có thể là word embeddings. cũng có thể là user image. cũng có thể là các hình ảnh.

答案完全取决于您选择哪个距离函数――两个数据点在一个度量下可能是最近邻,在另一度量下却是很远的距离――您的KNN分类器、推引擎、矢量数据库、集群算法、损失函数都依赖于这个选择――选择错误,您的模型就会优化错误的目标――

Không có khoảng cách tốt nhất phổ biến. L2 适合空间数据. Cọsin tương đồng trong NLP chiếm chủ yếu. Jackard 处理集合. Editing distance. 处理字符串. Mahalanobis 会考虑相关性.

Bài này sẽ xây dựng từng hàm khoảng cách chính từ không, giải thích khi nào nên sử dụng một trong những hàm này, và cho thấy một phần dữ liệu như thế nào để tạo ra những người hàng xóm gần nhất hoàn toàn khác nhau do sử dụng các thước đo khác nhau.

## 概念

### Các chuẩn: đo lường vector

范数 đo một vector của 2 vector. Mỗi hàm khoảng cách giữa hai vector có thể được viết thành các khác biệt của chúng.

### L1 Norm ((trường Manhattan)

L1 chuẩn đối với tất cả các phân tích giá trị tuyệt đối

```
||x||_1 = |x_1| + |x_2| + ... + |x_n|
```

Nó được gọi là khoảng cách Manhattan, vì nó đo lường khoảng cách bạn đi trong mạng lưới thành phố, nơi bạn chỉ có thể di chuyển theo trục trục, không thể đi về góc.

```
Point A = (1, 1)
Point B = (4, 5)

L1 distance = |4-1| + |5-1| = 3 + 4 = 7

On a grid, you walk 3 blocks east and 4 blocks north.
```

何時使用 L1:
- 高维稀疏数据 ((文本特征、one-hot coding)
- Khi bạn muốn đối với các điểm khác biệt hơn ổn định thì một sự khác biệt lớn sẽ không dẫn đến kết quả)
- Đặc điểm chọn vấn đề (L1 regularization 会促进稀疏性)

Liên hệ với L1 regularization (Lasso): Trong hàm Loss1, sẽ tham gia vào các tác phẩm của bạn để trừng phạt trọng lượng của mình đối với giá trị tuyệt đối của nó và.

Liên hệ với Hỗn Loss:Mán độ Hỏng hoàn toàn (MAE) là giá trị trung bình của khoảng cách L1 giữa giá trị dự đoán và giá trị mục tiêu.

### L2 Norm ((trường dài Euclidean)

L2 chuẩn là đường thẳng khoảng cách. Nó tương đương với phần vuông của phân tích và gốc vuông.

```
||x||_2 = sqrt(x_1^2 + x_2^2 + ... + x_n^2)
```

Đó là cách bạn học trong các lớp học về địa chất.

```
Point A = (1, 1)
Point B = (4, 5)

L2 distance = sqrt((4-1)^2 + (5-1)^2) = sqrt(9 + 16) = sqrt(25) = 5.0

The straight line, cutting diagonally through the grid.
```

何時使用 L2:
- 低到中等维度的连续数据
- Khi tính chất có thể so sánh
- 物理距离(空间数据、传感器读数)
- Tương tự hình ảnh của cấp độ hình ảnh

Liên hệ với L2 regularization (Ridge): Trong hàm Loss (Loss) 中加入你的物流的重量2^2, sẽ trừng phạt trọng lượng lớn hơn. Không giống với L1, nó sẽ không đẩy trọng lượng xuống 0, nó sẽ giảm trọng lượng theo tỷ lệ, giảm trọng lượng.

Liên hệ với hàm mất:Mức độ lỗi vuông trung bình (MSE) là khoảng cách L2 平方的平均值──平方会比小误差更重地惩罚大误差──

```
MAE (L1 loss):  |y - y_hat|         Linear penalty. Robust to outliers.
MSE (L2 loss):  (y - y_hat)^2       Quadratic penalty. Sensitive to outliers.
```

### Lp Norm: chung

L1 và L2 là đặc điểm của Lp chuẩn:

```
||x||_p = (|x_1|^p + |x_2|^p + ... + |x_n|^p)^(1/p)
```

Các p 值 khác nhau sẽ tạo ra các hình dạng khác nhau của các quả bóng đơn vị  ((tránh từ điểm gốc là 1 của tất cả các điểm):

```
p=1:    Diamond shape      (corners on axes)
p=2:    Circle/sphere      (the usual round ball)
p=3:    Superellipse       (rounded square)
p=inf:  Square/hypercube   (flat sides along axes)
```

### L-không giới hạn Norm ((Chebyshev khoảng cách)

Khi p 趋近无穷大时, Lp chuẩn 收到最大绝对分量──

```
||x||_inf = max(|x_1|, |x_2|, ..., |x_n|)
```

Khoảng cách giữa hai điểm được quyết định bởi kích thước lớn nhất của chúng. Tất cả các kích thước khác đều bị bỏ qua.

```
Point A = (1, 1)
Point B = (4, 5)

L-inf distance = max(|4-1|, |5-1|) = max(3, 4) = 4
```

何時使用 L-infinity:
- Khi sự khác biệt trong tình huống tồi tệ nhất trong một sự độc lập quan trọng
- 游戏棋盘(国际象棋中的国王按L-infinity 移动:任意方向走一步的代价都是1)
- 制造公差 ((每个维度都必须在规格范围内)

### Sự tương đồng của cosine và khoảng cách của cosine

Sự tương đồng của cosine đo lường góc giữa hai vector, bỏ qua kích thước của chúng.

```
cos_sim(a, b) = (a . b) / (||a||_2 * ||b||_2)
```

phạm vi của nó là -1 (( hướng相反) đến +1 (( hướng tương tự) ―― Sự tương đồng cosine của các vector trực tuyến 为 0。

Khoảng cách cosine sẽ chuyển đổi thành khoảng cách: cosine_distance = 1 - cosine_similarity。 phạm vi là 0(nghĩa tương tự) đến 2(nghĩa tương phản)。

```
a = (1, 0)    b = (1, 1)

cos_sim = (1*1 + 0*1) / (1 * sqrt(2)) = 1/sqrt(2) = 0.707
cos_dist = 1 - 0.707 = 0.293
```

Tại sao cosine trong NLP và embedings chiếm chủ quyền: Trong văn bản, độ dài văn bản không nên ảnh hưởng đến sự tương đồng. Một bài viết về cat văn bản thậm chí còn nên là 2 lần so với bài viết khác về cat văn bản dài, cũng vẫn nên là  tương tự.

何時使用 cosine tương tự:
- 文本相似度(TF-IDF vector, word embeddings, sentence embeddings)
- Bất kỳ kích thước nào là tiếng ồn, hướng là lĩnh vực của tín hiệu
- 推系统( người dùng chọn lựa Vectors)
- Nhúng tìm kiếm cơ sở dữ liệu vector  hầu như luôn sử dụng cosine hoặc điểm sản phẩm)

### Sự tương đồng của sản phẩm điểm so với sự tương đồng của cosine

两个向量的点产量是:

```
a . b = a_1*b_1 + a_2*b_2 + ... + a_n*b_n
      = ||a|| * ||b|| * cos(angle)
```

Sự tương đồng của cosine là theo hai lớn nhỏ kết hợp sau sản phẩm chấm.

```
If ||a|| = 1 and ||b|| = 1:
    a . b = cos(angle between a and b)
```

Trong một số hệ thống tìm kiếm, nếu bạn muốn xếp hạng hàng hóa 热门物品 cao hơn, điều này rất quan trọng.

```
a = (3, 0)    b = (1, 0)    c = (0, 1)

dot(a, b) = 3     dot(a, c) = 0
cos(a, b) = 1.0   cos(a, c) = 0.0

Both agree on direction, but dot product also reflects magnitude.
```

实践中:
- Khi bạn muốn hướng hoàn hảo tương tự, sử dụng sự tương tự cosine
- Khi lớn nhỏ mang thông tin có ý nghĩa, sử dụng sản phẩm điểm
- Nhiều cơ sở dữ liệu vector (Pinecone, Weviate, Quadrant) cho phép bạn chọn giữa hai
- Nếu các nội dung của bạn đã được chuẩn hóa, thì chọn cái gì đó không có gì.

### Khoảng cách của Mahalanobis

Khoảng cách Euclidean  bình đẳng đối với tất cả các chiều kích. Nhưng nếu các đặc điểm của bạn liên quan, hoặc không giống với kích thước, L2 sẽ đưa ra kết quả sai lầm.

Khoảng cách của Mahalanobis sẽ xem xét dữ liệu của sự thay đổi cấu trúc.

```
d_M(x, y) = sqrt((x - y)^T * S^(-1) * (x - y))
```

Trong đó S là matrix tính biến của dữ liệu.

直观理解: khoảng cách của Mahalanobis 会先对数据去相关并归归一化(whitening), sau đó trong thay đổi后的空间中计算 L2 khoảng cách。 nếu S là matrix danh tính ((不相关、单位差特征), khoảng cách của Mahalanobis sẽ trở lại cho khoảng cách Euclidean。

```
Example: height and weight are correlated.
Someone 6'2" and 180 lbs is not unusual.
Someone 5'0" and 180 lbs is unusual.

Euclidean distance might say they are equally far from the mean.
Mahalanobis distance correctly identifies the second as an outlier
because it accounts for the height-weight correlation.
```

何时使用 Mahalanobis khoảng cách:
- Khám phá ngoại lệ (~ trung bình Mahalanobis khoảng cách  lớn hơn điểm là ngoại lệ)
- Khi các đặc điểm khác nhau và có liên quan
- Khi bạn có đủ dữ liệu để ước tính có thể tin cậy của matrix tính biến
- 制造质量控制 (phân tích quy trình sản xuất)

### Jaccard tương tự (用于集合)

Sự tương đồng Jaccard đo lường mức độ chồng chéo giữa hai tập hợp.

```
J(A, B) = |A intersect B| / |A union B|
```

Kích thước của nó là 0( không chồng lên) đến 1( tập hợp giống nhau)。 khoảng cách Jackard = 1 - Sự tương đồng Jackard。

```
A = {cat, dog, fish}
B = {cat, bird, fish, snake}

Intersection = {cat, fish}         size = 2
Union = {cat, dog, fish, bird, snake}  size = 5

Jaccard similarity = 2/5 = 0.4
Jaccard distance = 0.6
```

何時使用 Jaccard:
- So sánh nhãn, loại hoặc tập hợp đặc điểm
- 基于词是否出现的文档相似度 (không phải là tần suất)
- 近重复检测(Jaccard của MinHash 近似)
- 比较二值特征 矢量 (存在/不存在数据)
- 评估分割模型(Tạm vi giao thông trên Liên minh = Jaccard)

### Edit Distance(Levenshtein Distance)

Edit distance 计算把一个字符串转换成另一个字符串所需的最小单字符操作数――操作包括:插入、删除或替换──

```
"kitten" -> "sitting"

kitten -> sitten  (substitute k -> s)
sitten -> sittin  (substitute e -> i)
sittin -> sitting (insert g)

Edit distance = 3
```

Sử dụng động thái lập trình tính toán. 填充一个矩阵, trong đó条目 (i, j) là khoảng cách chỉnh sửa giữa字符串 A của i 个字符串 và字符串 B của i 个字符串.

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

何時使用 chỉnh sửa khoảng cách:
- 拼写 kiểm tra và sửa chữa
- Định dạng chuỗi DNA (带加权操作)
- 模糊字符串匹配
- 脏文本数据去重

### KL Divergence ((không phải khoảng cách, nhưng thường được coi là khoảng cách sử dụng)

KL sự khác biệt đo lường sự khác biệt giữa phân bố xác suất và phân bố xác suất khác. Nội dung này đã được nói trong Bài học 09 nhưng nó thuộc về cuộc thảo luận này, vì mọi người thường dùng nó như là khoảng cách, mặc dù nó không phải là khoảng cách.

```
D_KL(P || Q) = sum(p(x) * log(p(x) / q(x)))
```

关键性质:KL divergence 不是对称的──

```
D_KL(P || Q) != D_KL(Q || P)
```

Điều này có nghĩa là nó không đáp ứng yêu cầu cơ bản về độ khoảng cách. Nó cũng không đáp ứng các phương pháp khác nhau.

Chuyển tiếp KL(D_KL(P   Q)) là tìm kiếm ý nghĩa:Q 试图覆盖 P 的所有模式──
Reverse KL(D_KL(Q  P)) là tìm kiếm chế độ:Q 专注于P 的单个模式──

Bạn sẽ thấy sự khác biệt KL ở những nơi này:
- VAEs ((ELBO 中的 KL 项会把隐藏分布 推向前)
- Phân phối kiến thức (Destillation of knowledge)
- RLHF(KL phạt 让调整模型 保持接近基模型)
- Phương pháp gradient chính sách

### Wasserstein Distance ((Earth Mover's Distance)

Khoảng cách Wasserstein  đo chuyển phân bố xác suất thành phân bố xác suất khác. Có thể hiểu như thế này: Nếu một phân bố là một đống đất, một khác là một crater, bạn cần phải di chuyển bao nhiêu đất  di chuyển bao nhiêu xa?

```
W(P, Q) = inf over all transport plans gamma of E[d(x, y)]
```

Đối với phân bố 1D, nó sẽ được đơn giản hóa thành tích lũy phân bố hàm tuyệt đối khác biệt:

```
W_1(P, Q) = integral |CDF_P(x) - CDF_Q(x)| dx
```

Tại sao Wasserstein  quan trọng:
- Nó là một số liệu chính xác (được gọi là:
- Ngay cả khi phân bố không chồng lên, nó cũng có thể cung cấp Gradients (KL divergence 会趋向无穷大)
- Bản chất này làm cho nó trở thành trung tâm của các GAN của Wasserstein, sau đó giải quyết vấn đề không ổn định của các GAN ban đầu.

```
Distributions with no overlap:

P: [1, 0, 0, 0, 0]    Q: [0, 0, 0, 0, 1]

KL divergence: infinity (log of zero)
Wasserstein: 4 (move all mass 4 bins)

Wasserstein gives a meaningful gradient. KL does not.
```

何時使用 Wasserstein:
- GAN đào tạo ((WGAN、WGAN-GP)
- So sánh phân bố không chồng lên
- Giao thông tối ưu 问题
- 图像检索(比较颜色直方图)

### Tại sao các nhiệm vụ khác nhau cần khoảng cách khác nhau

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

### Liên hệ với Loss Functions

Các hàm mất là hàm khoảng cách giữa giá trị dự đoán và giá trị mục tiêu được sử dụng.

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

### Liên hệ với các quy tắc

Chính thức hóa sẽ được thực hiện trong hàm mất giá.

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

Tại sao L1 sẽ tạo ra sự hiếm khi L2 không: tưởng tượng 2D  trọng lượng trong không gian khu vực  hình, L2 là hình tròn, L2 là hình tròn, L2 là hình tròn, L2 là hình tròn, L2 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L1 là hình tròn, L2 là hình tròn, L2 là hình tròn, L1 là hình tròn, L2 là hình tròn, L2 là hình tròn, L2 là hình tròn, L2 là hình tròn, L2 là hình tròn, L2 là hình tròn, L2 là hình tròn, L2 là hình tròn, L1 là hình tròn, L1 là hình tròn, và L2 là hình tròn, và L2 là hình tròn, và L2 là hình tròn.

### Tìm người hàng xóm gần nhất

Mỗi hàm khoảng cách đều bao gồm một tìm kiếm hàng xóm gần nhất  vấn đề: cho một điểm truy vấn, trong tập dữ liệu tìm thấy điểm gần nhất.

Tìm kiếm hàng xóm gần nhất trong tập dữ liệu có chứa n 个点, độ phức tạp của mỗi lần truy vấn là O(n * d) ;; Đối với tập dữ liệu lớn, nó quá chậm.

Phương pháp gần nhất của hàng xóm (ANN) với tỷ lệ xác định nhỏ để đổi lấy tốc độ tăng trưởng lớn:

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

HNSW(Hierarchical Navigable Small World) là một thuật toán chủ yếu trong cơ sở dữ liệu vector hiện đại. Nó xây dựng một biểu đồ nhiều tầng, mỗi节点 kết nối với hàng xóm gần nhất gần đó của nó.


```figure
norm-unit-balls
```

##  xây dựng nó

### 步骤 1: tất cả các hàm số và khoảng cách

完整实现见 `code/distances.py` Mỗi hàm đều từ zero cấu trúc, chỉ sử dụng nền tảng Python 数学

### Bước 2: cùng dữ liệu, khoảng cách khác nhau, hàng xóm khác nhau

`distances.py`Trung trong demo sẽ tạo một tập dữ liệu, chọn một điểm truy vấn, và hiển thị hàng xóm gần nhất ư thế nào thay đổi theo khoảng cách độ đo ⋅ ở L1 下 gần đây  của điểm, ở L2 hoặc cosine 下可能并不是最近的──

### 步骤 3:Thiết nhập tìm kiếm tương đồng

代码包含一个模拟嵌入式类似性搜索,使用共数相似与L2距离 查找与查询 最相似的文档,展示排名可能不同──

## Sử dụng nó

ối dụng thực tế thường thấy: tìm kiếm các mục tương tự trong cơ sở dữ liệu vector.

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

Khi bạn调用`model.encode(text)`Sau đó tìm kiếm cơ sở dữ liệu vector 时, tầng dưới xảy ra là điều này. Mô hình nhúng sẽ đưa văn bản được phân tích thành vectors.

## 练习

1. 计算 (1, 2, 3) 和 (4, 0, 6)  giữa L1、L2 和 L-không giới hạn khoảng cách。验证 đối với bất kỳ một đối tượng nào,总有 L-inf <= L2 <= L1。证明为什么这个顺序一定成立──

2. 创建两个向量,使宇宙相似性 很高(> 0.9), nhưng khoảng cách L2 很大(> 10)。 从几何角度解释发生了什么──然后创建两个向量,使宇宙相似性 很低(< 0.3),但 L2 khoảng cách 很小(< 0.5)。

3. Thực hiện một hàm, nhận một tập dữ liệu và một điểm truy vấn,并分别返回 L1、L2、cosine 和 Mahalanobis distance 下的近邻―― tìm một tập dữ liệu, làm cho bốn khoảng cách với bất kỳ điểm gần nhất nào.

4. Sử dụng CDF 方法手动计算 [0,5, 0,5, 0,0] 和 [0, 0, 0,5, 0.5] 之间的 Wasserstein khoảng cách──然后计算 [0,25, 0.25, 0.25, 0.25] 和 [0, 0, 0,5, 0.5] 之间的距离──哪个更大,为什么?

5. Để thực hiện tương đồng Jaccard gần như 实现 MinHash──生成 100 个随机集合,计算所有对的精确 Jaccard,并使用 50、100、200 个 hash hàm của MinHash 近似进行比较──绘制近似误差──

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

- [FAISS: A Library for Efficient Similarity Search](https://github.com/facebookresearch/faiss)- Meta sử dụng các thư viện tìm kiếm ANN quy mô hàng tỷ
- [Wasserstein GAN (Arjovsky et al., 2017)](https://arxiv.org/abs/1701.07875)- 将 Earth Mover's distance 引入 GANs 的论文
- [Locality-Sensitive Hashing (Indyk & Motwani, 1998)](https://dl.acm.org/doi/10.1145/276698.276876)- cơ sở ANN 算法
- [Efficient Estimation of Word Representations (Mikolov et al., 2013)](https://arxiv.org/abs/1301.3781)- Word2Vec, sự tương đồng trong các bản nhúng trong trở thành một lựa chọn cố định nơi
- [sklearn.neighbors documentation](https://scikit-learn.org/stable/modules/neighbors.html)- học tập nhỏ - hướng dẫn thực tế về đo khoảng cách trung bình và thuật toán hàng xóm
