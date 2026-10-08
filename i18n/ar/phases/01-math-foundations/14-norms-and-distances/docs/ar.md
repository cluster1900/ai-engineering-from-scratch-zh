# 范数和距离

> وظيفة المسافة تعريف ما يسميه مثل.

**Type:** Build
**Language:**بايثون
**前置要求：**المرحلة الأولى الدروس 01 (الجهبرية الخطية) ،02 (المتجهات والمعادلات والعمليات)
**Time:** ~90 分钟

## 學习目标

- من صفر تحقيق L1、L2、كوسين、مهالانوبيس、جاكارد 和 تحرير المسافة  وظيفة
- لتحديد مهمة ML اختيار مقياس المسافة المناسبة ، وتفسير لماذا تختار أخرى سوف تفشل
- وتربط L1 و L2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
-  عرض نفس المجموعة البيانية في مختلف الدرجات تظهر مختلف الجيران القريبين

## 问题

لديك متجهين. قد يكونون مدخلين كلمات. ويمكن أن يكونون صور المستخدم. ويمكن أن يكون عدد الصور.

答案完全取决于你选择哪个距离函数──两个数据点在一个度量下可能是最近的邻居,在另一度量下却是很远的距离──你的KN分类器、推引擎、矢量数据库、集群算法、损失函数都依赖于这个选择──选择错误,你的模型就会优化错误的目标──

لا يوجد أفضل مسافة عامة. L2  تناسب البيانات. تشابه السن في النمط النووي. جاكارد  معالجة مجموعة. إصدار المسافة. معالجة الخيوط. مهالنيبيس سوف يفكر في ارتباطها.

سوف يظهر هذا الدروس كيفية بناء كل وظيفة مسافة رئيسية من الصفر، وتوضيح متى يجب استخدام أي نوع، ويعرض كيفية إنتاج نفس البيانات لأقرب جيران مختلفين تمامًا بسبب استخدام مقياس مختلف.

## 概念

### القواعد: نسبة الكمية

فانومبيس قياس متجه واحد 大小── كل وظيفة المسافة بين متجهين يمكن أن تكتب في اختلافهم في الفانومبيس: d, a, b) = a - b في الموقع.

### L1 نورم ((مسافة من مانهاتن)

القاعدة L1 لجميع القيم الحتمية

```
||x||_1 = |x_1| + |x_2| + ... + |x_n|
```

يُطلق عليه مسافة مانهاتن لأنه يقيس المسافة التي تسير بها في شبكة المدينة حيث يمكنك فقط التحرك على طول محور العرض، لا يمكنك السير على الزاوية.

```
Point A = (1, 1)
Point B = (4, 5)

L1 distance = |4-1| + |5-1| = 3 + 4 = 7

On a grid, you walk 3 blocks east and 4 blocks north.
```

何時使用 L1:
- 高维稀疏数据 ((文本特征、 واحد حار تشفيرات)
- عندما تريد أن تكون أكثر ثباتاً في النتائج
- خصائص اختيار مشكلة ((L1 تنظيمية 会促进稀疏性)

مع L1 تنظيمات ((Lasso) ارتباط: في المشاركة في فانك الخسارة وظيفة، سوف تنضم إلى معينك في العقوبة الوزن على القدر الحتمي و.

مع وظائف الخسارة 联系:Mean Absolute Error (MAE) هو متوسط قيمة المسافة بين L1 والقيمة المستهدفة.

### L2 نورم ((مسافة اليوكليدية)

القاعدة L2 هي المسافة المباشرة.

```
||x||_2 = sqrt(x_1^2 + x_2^2 + ... + x_n^2)
```

هذا هو المسافة التي تعلمتها في دروس الهندسة

```
Point A = (1, 1)
Point B = (4, 5)

L2 distance = sqrt((4-1)^2 + (5-1)^2) = sqrt(9 + 16) = sqrt(25) = 5.0

The straight line, cutting diagonally through the grid.
```

何時使用 L2:
- 低到中等维度的连续数据
- عندما تكون الخصائص مقارنة
- 物理距离(空间数据、传感器读数)
- شبيهة الصورة من الصفحة

ارتباط مع L2 تنظيم ((Ridge): في شمولك مع خسارة الميزان في الميزان، سوف يعاقب الوزن الأكبر.

مع خسارة وظائف 联系: متوسط خطأ مربع(MSE) هو L2 المسافات 平方的平均值──平方会比小误差更重地惩罚大误差──

```
MAE (L1 loss):  |y - y_hat|         Linear penalty. Robust to outliers.
MSE (L2 loss):  (y - y_hat)^2       Quadratic penalty. Sensitive to outliers.
```

### القواعد:

L1 و L2 هي حالات خاصة من معايير Lp:

```
||x||_p = (|x_1|^p + |x_2|^p + ... + |x_n|^p)^(1/p)
```

مختلفة p                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

```
p=1:    Diamond shape      (corners on axes)
p=2:    Circle/sphere      (the usual round ball)
p=3:    Superellipse       (rounded square)
p=inf:  Square/hypercube   (flat sides along axes)
```

### (معدل (شيبشيف)

عندما تدرج إلى الحد الأقصى، تصل القاعدة إلى الحد الأقصى.

```
||x||_inf = max(|x_1|, |x_2|, ..., |x_n|)
```

يُحدد المسافة بين النقاط التي تختلف بينها أكبر درجة.

```
Point A = (1, 1)
Point B = (4, 5)

L-inf distance = max(|4-1|, |5-1|) = max(3, 4) = 4
```

何時使用 L- لا نهاية لها:
- عندما يكون الاختلاف في أسوأ حالات الحالة مهم
- 游戏棋盘(国际象棋中的国王按L-无限 移动:任意方向走一步的代价都是1)
- 制造公差 ((كل طول يجب أن يكون في حدود المواصفات)

### تشابه الكوزين و مسافة الكوزين

تشابه الكوسين  قياس الزاوية بين اثنين من المتجهات ، تجاهلهم الكبير

```
cos_sim(a, b) = (a . b) / (||a||_2 * ||b||_2)
```

نطاقها هو -1 ((التوجيه相反) إلى +1 ((التوجيه نفسه)。 التشابه الكويسيني للنواقل العمودية 为 0。

المسافة الكوسينية سوف تحويلها إلى المسافة:cosine_distance = 1 - cosine_similarity── المدى هو 0(الجهة نفسها) إلى 2(الجهة相反)──

```
a = (1, 0)    b = (1, 1)

cos_sim = (1*1 + 0*1) / (1 * sqrt(2)) = 1/sqrt(2) = 0.707
cos_dist = 1 - 0.707 = 0.293
```

لماذا الكوزين في النموذج النووي والإدمج: في المقال، لم يكن طول المقالة يجب أن يؤثر على التشابه.

何時使用 تشابه الكويسين:
- 文本相似度 ((متجهات TF-IDF
- أيّة ضجيجٍ كبيرة، أوّلّ إرشادٍ هو مجال الإشارة
- 推系统( المستخدمين الاختيارات المتجهات)
- إدراج البحث في قواعد البيانات المتجهة  تقريبا دائما باستخدام كوسين أو نقطة النقاط)

### شبيهة المنتج عند النقطة مقابل شبيهة الكوزين

نسبة نقطة من الـ 两个 متجهات هي:

```
a . b = a_1*b_1 + a_2*b_2 + ... + a_n*b_n
      = ||a|| * ||b|| * cos(angle)
```

تشابه الكويسين هو على حد اثنين من الكبيرة التوطين بعد النقطة المنتجة.

```
If ||a|| = 1 and ||b|| = 1:
    a . b = cos(angle between a and b)
```

في بعض أنظمة البحث، إذا كنت ترغب في تحديد ترتيب المنتجات المنزلية أعلى، فمن المهم أن يكون ذلك كإشارة للجودة أو الأهمية الخفية.

```
a = (3, 0)    b = (1, 0)    c = (0, 1)

dot(a, b) = 3     dot(a, c) = 0
cos(a, b) = 1.0   cos(a, c) = 0.0

Both agree on direction, but dot product also reflects magnitude.
```

实践中:
- عندما تريد التشابه في اتجاهاتك، استخدم التشابه في الكويسين
- عندما يحمل الكبير معلومات ذات مغزى، استخدام منتج نقطة
- العديد من قواعد البيانات المتجهة ((Pinecone、Weaviate、Qdrant) يسمح لك بين بينهم للاختيار
- إذا كان إضافةك قد تمت تطبيعها، فاختر أي شيء

### المسافة إلى مهالانوبي

المسافة الأوكليدية = مساوية لكل الأبعاد. ولكن إذا كانت خصائصك مرتبطة أو مختلفة عن الأبعاد، فإن L2 سوف تعطى نتيجة خاطئة.

المسافة من مهالانوبي سوف تأخذ بعين الاعتبار البيانات من التغيرات

```
d_M(x, y) = sqrt((x - y)^T * S^(-1) * (x - y))
```

ومن بينها S هي المصفوفة التغيرات البيانية

直观理解:سعد المهالانوبيس 会先对数据去相关并归一化(whitening), ثم في التغيير بعد ذلك في الفضاء حساب المسافة L2。 إذا كان S هو المصفوفة الهوية(不相关、单位差特征),سعد المهالونوبيس سوف يعود إلى مسافة أوكليديا。

```
Example: height and weight are correlated.
Someone 6'2" and 180 lbs is not unusual.
Someone 5'0" and 180 lbs is unusual.

Euclidean distance might say they are equally far from the mean.
Mahalanobis distance correctly identifies the second as an outlier
because it accounts for the height-weight correlation.
```

何时使用 مهالانوبي
- الكشف عن حالات خارجية (مع متوسط القيمة المهلانوبي المسافة  أكبر نقاط هي حالات خارجية)
- عندما تكون الخصائص مختلفة وتوجد صلة
- عندما يكون لديك ما يكفي من البيانات لتقدير المصفوفة الموثوقة للتغيرات
- 制造质量控制 (تحكم في عملية التحكم في التغيرات)

### جاكارد تشابه ((用于集合)

تشابه جاكارد قياس التركيب بين مجموعتين

```
J(A, B) = |A intersect B| / |A union B|
```

يبلغ نطاقها 0 ((ليس هناك تعليق) إلى 1 ((جمع نفسه))). مسافة جاكارد = 1 - تشابه جاكارد。

```
A = {cat, dog, fish}
B = {cat, bird, fish, snake}

Intersection = {cat, fish}         size = 2
Union = {cat, dog, fish, bird, snake}  size = 5

Jaccard similarity = 2/5 = 0.4
Jaccard distance = 0.6
```

何時使用 جاكارد:
- مقارنة العلامات أو الفئات أو مجموعات الخصائص
- على أساس ما يحدث في الملفات مماثلة
- 近重复检测(جاكارد من مين هاش 近似)
- تقارن ثاني قيمة خصائص المتجهات ((exist/noexist data)
- 评估分割模型(القطع على الاتحاد = جاكارد)

### إصلاح المسافة ((مسافة ليفينشتاين)

إصلاح المسافة 计算把一个字符串转换成另一个字符串所需的最小单字符操作数──操作包括:插入、删除或替换──

```
"kitten" -> "sitting"

kitten -> sitten  (substitute k -> s)
sitten -> sittin  (substitute e -> i)
sittin -> sitting (insert g)

Edit distance = 3
```

استخدام动态规划计算──填充一个矩阵,其中条目 (i, j) 是字符串 A 的前 i 个字符串与字符串 B 的前 j 个字符之间的编辑距离──

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

何時使用 المسافة التحرير:
- 拼写 تفتيش وتصحيح
- التنظيم التسلسل الحمض النووي
- 模糊字符串匹配
- 脏文本数据去重

### KL التباين ((ليس عن بعد، ولكن دائماً ما يتم استخدامها على بعد)

الاختلافات المرجعية لقياس اختلافات توزيع الاحتمالات مع توزيع الاحتمالات الأخرى. تمت سرد هذا المحتوي في الدروس 09، ولكنه يقع ضمن هذه المناقشة، لأن الناس غالبا ما يستخدمونه على أنه مسافة، على الرغم من أنه ليس مسافة.

```
D_KL(P || Q) = sum(p(x) * log(p(x) / q(x)))
```

关键性质:اختلاف الكلي ليس معادلة.

```
D_KL(P || Q) != D_KL(Q || P)
```

هذا يعني أنه لا يلبي متطلبات الأساسية للمسافة.

المضي قدما KL(D_KL(P  Q)) هومطلب البحث:Q 试图覆盖 P 的所有模式──
العكس KL(D_KL(Q يذهب P)) هوالبحث عن الوضع:Q 专注于P的单个模式

سترى في هذه الأماكن تباين ك.إل:
- VAEs ((التي تتميز بالتنفيذ الخفيف في إيلبو)
- تحليل المعرفة ((طالب 试图匹配 معلم)
- RLHF(جريمه KL 让细调模型 保持接近基模型)
- أساليب تراجع السياسة (تحديثات سياسة)

### مسافة Wasserstein ((مسافة Earth Mover)

مسافة Wasserstein  قياس تحويل توزيع احتمال إلى آخر توزيع احتمالية الحد الأدنى  العمل المطلوب 🏼 يمكن فهم ذلك: إذا كان توزيع واحد هو كومة من التربة ، والآخر هو حفرة ، تحتاج إلى تحريك كم من التربة ‬ تحريك إلى أين؟

```
W(P, Q) = inf over all transport plans gamma of E[d(x, y)]
```

بالنسبة لـ 1D 分布، فإنه سوف يُبسط إلى وظيفة التوزيع المتراكمة الحصرية:

```
W_1(P, Q) = integral |CDF_P(x) - CDF_Q(x)| dx
```

لماذا واصيرين مهم:
- إنها مقياسية حقيقية (بالمعنى:
- حتى لو أن التوزيع لا يتزايد، فإنه يمكن أن يوفر أيضاً درجات (التباين الكليمي يتجه إلى لا نهاية لها)
- هذه الطبيعة جعلها صلبة من GANs ((WGANs) Wasserstein ، والتي حللت مشاكل عدم الاستقرار في تدريب GANs الأصلية

```
Distributions with no overlap:

P: [1, 0, 0, 0, 0]    Q: [0, 0, 0, 0, 1]

KL divergence: infinity (log of zero)
Wasserstein: 4 (move all mass 4 bins)

Wasserstein gives a meaningful gradient. KL does not.
```

何時使用 واصرتين:
- تدريب GAN ((WGAN、WGAN-GP)
- تقسيم مقارنة
- النقل المثالي 问题
- 图像检索(比较颜色直方图)

### لماذا المهام المختلفة تحتاج إلى مسافة مختلفة

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

### ارتباط مع وظائف الخسارة

وظائف الخسارة هي وظيفة المسافة بين القيمة التوقعات والقيمة المستهدفة.

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

### الاتصال مع المعايير

تمت إعادة تنظيمها في وظيفة الخسارة

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

لماذا L1 سوف تحدث نادرة بينما L2 لا: تخيل 2D  منطقة الحزم في الفضاء الوزني. L1 هو 形، L2 هو دوري.

### البحث عن أقرب جيران

كل وظيفة المسافة تتضمن أقرب جيران بحث  مشكلة: إعطاء نقطة استفسار، في مركز البيانات العثور على أقرب نقطة.

في البحث عن الجوار القريب المحدد في مركز البيانات الذي يحتوي على n 个点、d 个维度, تعقيد كل استفسار هو O(n * d)  بالنسبة لمجموعة البيانات الكبيرة, هذا بطيء جدا

الحساب القريب القريب (ANN) مع معدلات أدنى للتغيير بسرعة كبيرة

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

HNSW ((هييراريكية العالم الملاحة الصغيرة) هي خوارزمية مدنية في قواعد البيانات المتجهة. تقوم بتكوين خريطة متعددة الطبقات، وتتصل كل نقطة إلى أقرب جيرانها المماثلين لها.


```figure
norm-unit-balls
```

## بناءها

### الخطوة 1: جميع وظائف النقاط والمسافة

完整实现见 `code/distances.py`كل وظيفة هي من الصفر، فقط باستخدام أساس بيثون الرياضيات.

### الخطوة 2: نفس البيانات، مختلفة عن بعضها البعض، مختلفة عن الجيران

`distances.py`في الدرجة الوسطى، سوف تقوم بتكوين مجموعة بيانات، واختيار نقطة استفسار، وتعرض أقرب جيران  كيف يتغير وتغير مع تغيرات الدرجة المقصودة ∙ في L1                                                                                                                                                                                                                                     

### 步骤 3: إدراج بحث التشابه

代码包含一个模拟嵌入式相似性搜索,使用kosine similarity 与 L2距离 查找与查询 最相似的文档,展示排名可能不同──

## استخدمها

最常见的实际用途: در قاعدة بيانات المتجهات البحث عن أشياء مشابهة.

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

عندما ت调用`model.encode(text)`ثم البحث في قاعدة بيانات المتجهات 时,底层发生之就是此事──嵌入模型 会把文本映射为向量── المتجهات قاعدة بيانات 会计算您的查询向量和每个已存储的向量 之间的宇宙相似性(或点产品),并使用ANN 算法避免一检查全部向量──

## التدريب

1. 計算 (1, 2, 3) 和 (4, 0, 6)  بين L1、L2 و L-المدى المسافات‬ 验证对于任意一对点,总有 L-inf <= L2 <= L1‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

2. 创建两个向量,使宇宙相似性 很高(> 0.9),但 L2距离 很大(> 10)。从几何角度解释发生了什么──然后创建两个向量,使宇宙相似性 很低(< 0.3),但 L2距离 很小(< 0.5)。

3. 实现函数,接收一个数据集和一个查询点,并分别返回 L1、L2、科西因和马哈拉诺比斯距离下下下的最近邻居――找一个数据集,使四种距离对哪个点最近的全部意见不一致――

4. استخدام CDF 方法手动计算 [0.5, 0.5, 0,0] 和 [0, 0, 0.5, 0.5] 之间的Wasserstein距离──然后计算 [0.25, 0.25, 0.25, 0.25] 和 [0, 0, 0.5, 0.5] 之间的距离──哪个更大,为什么?

5. لتنسيق شبيهات جاكارد 实现 MinHash──生成 100 个随机集合,计算所有对的精确Jaccard,并使用 50、100、200 个哈希函数的 MinHash 近似进行比较──绘制近似误差──

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

- [FAISS: A Library for Efficient Similarity Search](https://github.com/facebookresearch/faiss)- الميتا تستخدم بمجموعة من البحث عن ANN على نطاق مليارات
- [Wasserstein GAN (Arjovsky et al., 2017)](https://arxiv.org/abs/1701.07875)- تحريك مسافة الأرض 引入 GANs 的论文
- [Locality-Sensitive Hashing (Indyk & Motwani, 1998)](https://dl.acm.org/doi/10.1145/276698.276876)- 基础 ANN 算法
- [Efficient Estimation of Word Representations (Mikolov et al., 2013)](https://arxiv.org/abs/1301.3781)- Word2Vec، تشابه كوزين في التوابل بين تصبح مكان الاختيار المتضمن
- [sklearn.neighbors documentation](https://scikit-learn.org/stable/modules/neighbors.html)- التعلم القليل - دليل عملي لقياس المسافة و خوارزميات الجوار
