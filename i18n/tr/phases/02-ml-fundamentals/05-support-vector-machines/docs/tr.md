# Destek Vektör Makineleri

> İki sınıf arasında en geniş sokak bul.

**Type:** Build
**Language:**Python
**先修要求：**1. aşama: Dersler 08 Optimize, 14 Norma ve Mesafe, 18 Konves Optimize)
**Time:** ~90 分钟

## Öğrenme hedefi
- Çekil kaybı ve ilk formülasyon yukarıdaki dereceli düşüşü kullanarak, sıfırdan bir doğrusal SVM gerçekleştirmek
- 解释最大边际原理,并从训练好的模型中识别支持向量
- Linyal、polinom ve RBF çekirdekleri ile karşılaştırın, çekirdek hilesini nasıl önleyeceğinizi açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça açıkça
-  C parametre tarafından değerlendirilmiş  kontrol alanı genişliği ile sınıflandırma hataları arasındaki tartışma

## 问题
İki tür veri noktası var, onları ayırmak için bir düz çizgi veya hiperplane çizmek gerekir.

选择边界 最大的那一条──margin, iki tarafın yakın veri noktası arasındaki mesafeden karar sınırıdır──更宽的边界意味着分类者更有信心,并且能更好地概括到未见数据──

Bu algı, ML orta matematikte en iyi algoritmalardan biri olan Destek Vektör Makinelerini ortaya çıkardı. SVM'ler Deep Learning'den önce baskın sınıflandırma yöntemleriydi ve küçük veri kümeleri, yüksek veri ve ilkeler gerektiren, tam olarak anlaşılan, teorik güvenceye sahip model sorunları arasında hala en iyi seçimlerdir.

SVM'ler 直接连接到阶段 1:optimization is convex 的 (Öğrenim 18),margin with norms 来度量 (Normalar ile ölçülme) (Öğrenim 14), while kernel trick utilizing dot products, in non-real calculating high维空间) durumunda işleme çizgisiz sınırları──

## 概念
### Maksimum间隔 sınıflandırıcı

Etiketler belirlenir$y_i \in \lbrace -1, +1 \rbrace$和 özellik vektörleri $x_i$Hattı olarak ayırılabilir veriler, biz bir hiper düzlem bulmak için umut $w^T x + b = 0$Bir sınıftan ayrılacağım.

Öldürme$x_i$Hiperplane'a kadar mesafe:

```math
\text{距离} = \frac{\lvert w^T x_i + b \rvert}{\lVert w \rVert}
```

对于正确分类的点:$y_i (w^T x_i + b) > 0$◊ uçurumun uçurumun en yakın noktasından en yakın noktaya iki katı olması.

```mermaid
graph LR
    subgraph Margin
        direction TB
        A["w^T x + b = +1"] ~~~ B["w^T x + b = 0"] ~~~ C["w^T x + b = -1"]
    end
    D["+ class points"] --> A
    E["- class points"] --> C
    B --- F["Decision boundary"]
```

Optimizeleme sorunu:

```math
\begin{aligned}
\text{最大化} \quad & \frac{2}{\lVert w \rVert} \quad \text{（间隔宽度）} \\
\text{约束为} \quad & y_i (w^T x_i + b) \ge 1 \quad \text{对于所有 } i
\end{aligned}
```

等价地(minimize etmek $\lVert w \rVert^2$Daha kolay optimize):

```math
\begin{aligned}
\text{最小化} \quad & \frac{1}{2} \lVert w \rVert^2 \\
\text{约束为} \quad & y_i (w^T x_i + b) \ge 1 \quad \text{对于所有 } i
\end{aligned}
```

Bu bir konveks kare programı. Tek küresel çözümü var.$y_i (w^T x_i + b) = 1$) bu destek vektörleri. Bunlar karar sınırının tek belirleyici noktasıdır.

### Destek vektörleri:关键的少数点

```mermaid
graph TD
    subgraph Classification
        SV1["Support Vector（+ class）<br>y(w'x+b) = 1"] --- DB["Decision Boundary<br>w'x+b = 0"]
        DB --- SV2["Support Vector（- class）<br>y(w'x+b) = 1"]
    end
    O1["其他 + points<br>（不影响 boundary）"] -.-> SV1
    O2["其他 - points<br>（不影响 boundary）"] -.-> SV2
```

Çoğu eğitim noktası ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

Destek vektörlerinin sayısı da genelleşme hatası sınırını göstermiştir. Verita kümesi boyutuna göre, destek vektörleri 越少, genelleşme 越好。

### Yumuşak Marj: C parametre kullan 処理 noise

Gerçek veriler çok azdır tamamen ayrılabilir ∼ Bazı noktalar sınırın yanlış bir tarafında veya kenarın içinde yerleşebilir ∼ yumuşak kenar formülasyonu ∼ ihlallere izin vermek için gevşek değişkenler ∼

```math
\begin{aligned}
\text{最小化} \quad & \frac{1}{2} \lVert w \rVert^2 + C \sum_i \xi_i \\
\text{约束为} \quad & y_i (w^T x_i + b) \ge 1 - \xi_i \\
& \xi_i \ge 0 \quad \text{对于所有 } i
\end{aligned}
```

gevşek değişken $\xi_i$衡量点  Ölçme Noktası$i$违反差的程度──$C$控制 this tradeoff:

| $C$ value | Behavior |
|---------|----------|
| Large $C$ | 对 violations 施加重罚。margin 窄，misclassifications 更少。Overfits |
| Small $C$ | 允许更多 violations。margin 宽，misclassifications 更多。Underfits |

$C$Bu normalleşme gücü.$C$= 更少定期化── Küçük$C$= 更多规律化──

### Hinge kaybı:SVM'in kaybı işlevi

Soft margin SVM kısıtlama dışı optimizasyon için yeniden yazılabilir:

```math
\text{最小化} \quad \frac{1}{2} \lVert w \rVert^2 + C \sum_i \max(0, 1 - y_i (w^T x_i + b))
```

项 $\max(0, 1 - y_i f(x_i))$İşte bu, bir kenar kaybı. Bu, bir kenarın dışında veya bir kenarın dışında olduğu doğru bir şekilde ayrılır.

```
单个点的 Hinge loss：

loss
  |
  | \
  |  \
  |   \
  |    \
  |     \_______________
  |
  +-----|-----|-------->  y * f(x)
       0     1

当 y*f(x) >= 1 时为 zero loss（正确分类，位于 margin 外）。
当 y*f(x) < 1 时为 linear penalty。
```

•Logistik kayıplarla (logistik gerileme)

```math
\begin{aligned}
\text{Hinge：} \quad & \max(0, 1 - y f(x)) && \text{在间隔处硬截断} \\
\text{Logistic：} \quad & \log(1 + \exp(-y f(x))) && \text{平滑，永不精确为零}
\end{aligned}
```

Hinge kaybı  nadir çözümler üretir(sadece destek vektörleri 有非零贡献) ――logistik kaybı Bütün veri noktalarını kullanın。 bu da SVM'leri tahmin süresi daha hafıza verimli yapar。

### Uzal gradient düşüş 训练 doğrusal SVM

L2 düzenlenmesi ile yukarıdaki derecelendirme düşüşü kullanarak doğrusal SVM'yi eğitmek için kısıtlı QP'yi çözmek zorunda kalmadan kullanabilirsiniz:

```math
\begin{aligned}
& L(w, b) = \frac{\lambda}{2} \lVert w \rVert^2 + \frac{1}{n} \sum_i \max(0, 1 - y_i (w^T x_i + b)) \\[6pt]
& \text{关于 } w \text{ 的梯度：} \\
& \quad \text{若 } y_i (w^T x_i + b) \ge 1\text{:} \quad \frac{\partial L}{\partial w} = \lambda w \\
& \quad \text{若 } y_i (w^T x_i + b) < 1\text{:} \quad \frac{\partial L}{\partial w} = \lambda w - y_i x_i \\[6pt]
& \text{关于 } b \text{ 的梯度：} \\
& \quad \text{若 } y_i (w^T x_i + b) \ge 1\text{:} \quad \frac{\partial L}{\partial b} = 0 \\
& \quad \text{若 } y_i (w^T x_i + b) < 1\text{:} \quad \frac{\partial L}{\partial b} = -y_i
\end{aligned}
```

Bu, ilk formül olarak adlandırılır.$O(n \cdot d)$, içinden $n$- Örneklerin sayısı$d$Bu çok hızlı bir şekilde yapılıyor.

### Çift formülasyon ve çekirdek hilesi

SVM sorunu  Lagrangian dual  (Fase 1 Ders 18,KKT koşullarından) ):

```math
\begin{aligned}
\text{最大化} \quad & \sum_i \alpha_i - \frac{1}{2} \sum_{i,j} \alpha_i \alpha_j y_i y_j (x_i \cdot x_j) \\
\text{约束为} \quad & 0 \le \alpha_i \le C \\
& \sum_i \alpha_i y_i = 0
\end{aligned}
```

Dual sadece ilgili veri noktaları arasındaki nokta ürünleri $x_i \cdot x_j$                                                                                                                                                                                                                                                              $K(x_i, x_j)$√ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √

```math
\begin{aligned}
\text{线性核：} \quad & K(x, z) = x \cdot z \\
\text{多项式核：} \quad & K(x, z) = (x \cdot z + c)^d \\
\text{RBF（高斯核）：} \quad & K(x, z) = \exp(-\gamma \lVert x - z \rVert^2)
\end{aligned}
```

RBF çekirdeği, verileri sonsuz boyutlu uzaylara yerleştirecek. Giriş alanı, çekirdeği değerini 1 yakınında, çekirdeği değerini 0 yakınında öğrenebilir.

```mermaid
graph LR
    subgraph "Input Space（不可 separable）"
        A["2D 中的 data points<br>circular boundary"]
    end
    subgraph "Feature Space（可 separable）"
        B["更高维中的 data points<br>linear boundary"]
    end
    A -->|"Kernel trick<br>K(x,z) = phi(x).phi(z)"| B
```

Kernel numarası, yüksek boyutlu uzayın nokta ürünü olarak hesaplanmaktadır.$D$维中 derecesi$d$Bu çoklu çekirdeğin, açık bir özellik alanı var.$O(D^d)$Ama...$K(x, z)$- Evet .$O(D)$Zaman içinde hesaplanıyorum.

### Geri dönüş için SVM (SVR)

Destek vektör geri dönüşü , bir genişlik için bir veri ile çevrelidir .$\epsilon$Bu nedenle, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak, bu durumla ilgili olarak,

```math
\begin{aligned}
\text{最小化} \quad & \frac{1}{2} \lVert w \rVert^2 + C \sum_i (\xi_i + \xi_i^*) \\
\text{约束为} \quad & y_i - (w^T x_i + b) \le \epsilon + \xi_i \\
& (w^T x_i + b) - y_i \le \epsilon + \xi_i^* \\
& \xi_i, \xi_i^* \ge 0
\end{aligned}
```

$\epsilon$parametre  kontrol tüp genişliği── tüp 越宽 = destek vektörleri 越少 = fit 更平滑── tüp 越窄 = destek vektörleri 越多 = fit 更紧──

### Neden SVM'ler derin öğrenme kazandı ve ne zaman hâlâ kazanıyorlar?

1990'ların sonundan 2010'ların başlarına kadar SVM'ler ML'yi yönlendirdi. Derin Öğrenme birkaç nedenden dolayı onları aşmıştır:

| Factor | SVMs | Deep learning |
|--------|------|---------------|
| Feature engineering | 需要它 | 学习 features |
| Scalability | kernel 为 $O(n^2)$ 到 $O(n^3)$ | 使用 SGD 时每个 epoch 为 $O(n)$ |
| Image/text/audio | 需要 handcrafted features | 从 raw data 学习 |
| Large datasets (>100k) | 慢 | 扩展良好 |
| GPU acceleration | 收益有限 | 巨大加速 |

SVM'ler bu sahnelerde hâlâ kazanıyor:
- Küçük veri kümeleri ((100 ila 1000 örnek)
- 高维 kıt veriler(带 TF-IDF özellikleri 的文本)
- Matematik güvenceye ihtiyacın var.
- Zamanı en aza indirmek gerekir (lineer SVM)
- 具有清晰 margin structure 的二进制分類
- Anomaly tespit(bir sınıf SVM)


```figure
svm-margin
```

## Yapın onu.
### 步骤 1: Çakışıklık kaybı ve eğilimi

基础――计算一个批的关损失及其梯度――

```python
def hinge_loss(X, y, w, b):
    n = len(X)
    total_loss = 0.0
    for i in range(n):
        margin = y[i] * (dot(w, X[i]) + b)
        total_loss += max(0.0, 1.0 - margin)
    return total_loss / n
```

### 步骤 2: Dönüşe düşen çizgi SVM

通過最小化定期化關切損失 来訓練──不需要QP çözücü──

```python
class LinearSVM:
    def __init__(self, lr=0.001, lambda_param=0.01, n_epochs=1000):
        self.lr = lr
        self.lambda_param = lambda_param
        self.n_epochs = n_epochs
        self.w = None
        self.b = 0.0

    def fit(self, X, y):
        n_features = len(X[0])
        self.w = [0.0] * n_features
        self.b = 0.0

        for epoch in range(self.n_epochs):
            for i in range(len(X)):
                margin = y[i] * (dot(self.w, X[i]) + self.b)
                if margin >= 1:
                    self.w = [wj - self.lr * self.lambda_param * wj
                              for wj in self.w]
                else:
                    self.w = [wj - self.lr * (self.lambda_param * wj - y[i] * X[i][j])
                              for j, wj in enumerate(self.w)]
                    self.b -= self.lr * (-y[i])

    def predict(self, X):
        return [1 if dot(self.w, x) + self.b >= 0 else -1 for x in X]
```

### 步骤 3: Kernel fonksiyonları

实现 linear、polinomal 和 RBF çekirdekleri。

```python
def linear_kernel(x, z):
    return dot(x, z)

def polynomial_kernel(x, z, degree=3, c=1.0):
    return (dot(x, z) + c) ** degree

def rbf_kernel(x, z, gamma=0.5):
    diff = [xi - zi for xi, zi in zip(x, z)]
    return math.exp(-gamma * dot(diff, diff))
```

### 步骤 4: Marjin ve destek vektörünü tanımlamak

訓練後, 识别哪些点是支持向量,并计算边界宽度──

```python
def find_support_vectors(X, y, w, b, tol=1e-3):
    support_vectors = []
    for i in range(len(X)):
        margin = y[i] * (dot(w, X[i]) + b)
        if abs(margin - 1.0) < tol:
            support_vectors.append(i)
    return support_vectors
```

完整实现和所有 demos 见 `code/svm.py`- Evet.

## Kullan
Sikit-learn kullanın:

```python
from sklearn.svm import SVC, LinearSVC, SVR
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

clf = Pipeline([
    ("scaler", StandardScaler()),
    ("svm", SVC(kernel="rbf", C=1.0, gamma="scale")),
])
clf.fit(X_train, y_train)
print(f"Accuracy: {clf.score(X_test, y_test):.4f}")
print(f"Support vectors: {clf['svm'].n_support_}")
```

重要: training SVM 之前始终要规模你的特征──SVMs 特性大小对敏感,因为边缘 取决于 $\lVert w \rVert$, ve ölçeksiz özellikler 会扭曲几何结构──

对于大数据集,使用 `LinearSVC`(Birinci formülasyon, her dönem 为 $O(n)$) yerine `SVC`(ikili formülasyon,$O(n^2)$- Ne ?$O(n^3){}$):

```python
from sklearn.svm import LinearSVC

clf = Pipeline([
    ("scaler", StandardScaler()),
    ("svm", LinearSVC(C=1.0, max_iter=10000)),
])
```

## 练习
1. 生成 2D linear olarak ayırılabilir bir veri kümesi。 training your LinearSVM,并识别支持向量──验证支持向量 是最接近决策界的点──

2. Şoklu bir veri kümesi içinde$C$0.001'den 1000'e değişir.$C$değer  karar sınırını çizmek──观察 from wide margin(underfitting) to narrow margin(overfitting) 的过渡──

3. 创建一个类界限 为圆形(非线性) 的数据集──展示线性SVM 会失败──计算 RBF 核矩阵,并展示类别在内核诱导特征空间 中变得分离性──

4. Aynı veri kümesi içinde, yukarıdaki çizgi kaybı ile lojistik kaybı karşılaştırın.

5.  SVR'yi gerçekleştirmek için  Epsilon-ansansit kaybı                                                                                                                                                                                                                                                                                                                                                                         $y = \sin(x) + \text{噪声}$◊ çizim tahminleri 周围的epsilon tube,并突出显示支持向量(tube 外的点) 』

## 关键术语
| Term | What it actually means |
|------|----------------------|
| Support vectors | 最接近 decision boundary 的 training points。唯一决定 hyperplane 的点 |
| Margin | decision boundary 与最近 support vectors 之间的距离。SVMs 会最大化它 |
| Hinge loss | $\max(0, 1 - y f(x))$。正确分类且位于 margin 外时为零。否则为 linear penalty |
| C parameter | margin width 与 classification errors 之间的 trade-off。Large $C$ = narrow margin，small $C$ = wide margin |
| Soft margin | 通过 slack variables 允许 margin violations 的 SVM formulation。处理 non-separable data |
| Kernel trick | 在不显式映射到高维 feature space 的情况下，计算该空间中的 dot products |
| Linear kernel | $K(x, z) = x \cdot z$。等价于标准 dot product。用于 linearly separable data |
| RBF kernel | $K(x, z) = \exp(-\gamma \Vert x-z \Vert^2)$。映射到 infinite dimensions。学习任意 smooth boundary |
| Polynomial kernel | $K(x, z) = (x \cdot z + c)^d$。映射到 polynomial combinations 的 feature space |
| Dual formulation | SVM problem 的重写形式，只依赖数据点之间的 dot products。支持 kernels |
| SVR | Support Vector Regression。围绕数据拟合 epsilon-tube。tube 内的点具有 zero loss |
| Slack variables | $\xi_i$：衡量一个点违反 margin 的程度。正确分类且位于 margin 外的点为零 |
| Maximum margin | 选择能够最大化到每个类别最近点距离的 hyperplane 的原则 |

## 延伸阅读
- [Vapnik: The Nature of Statistical Learning Theory (1995)](https://link.springer.com/book/10.1007/978-1-4757-3264-1)- 关于SVMs和统计学学习的基础文本
- [Cortes & Vapnik: Support-vector networks (1995)](https://link.springer.com/article/10.1007/BF00994018)- Asıl SVM kağıdı
- [Platt: Sequential Minimal Optimization (1998)](https://www.microsoft.com/en-us/research/publication/sequential-minimal-optimization-a-fast-algorithm-for-training-support-vector-machines/)- SVM eğitimi  pratik bir SMO algoritması haline getirin
- [scikit-learn SVM documentation](https://scikit-learn.org/stable/modules/svm.html)- uygulamanın detaylarını içeren pratik yönlendirme
- [LIBSVM: A Library for Support Vector Machines](https://www.csie.ntu.edu.tw/~cjlin/libsvm/)- Büyük çoğunluk SVM uygulamalar  arkasındaki C ++ kütüphanesi
