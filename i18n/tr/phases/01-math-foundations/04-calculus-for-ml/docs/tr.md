# Makine Öğrenimi 微积分

> Nörolar ağının öğrenmesi gereken her şey budur.

**Type:** Learn
**Language:**Python
**Prerequisites:** Phase 1, Lessons 01-03
**Time:** ~60 minutes

## Öğrenme hedefi

- 计算常见 ML 函数($x^2$、sigmoid、cross-entropy) değerli ve çözünür değerli
- 0'dan Gradient Descent'i gerçekleştirmek, 1D ve 2D'de en az düşüş fonksiyonu
- 推导线性回归 模型的渐进,并通过手动更新权重来训练它
- 解释 Hessian Matrix、Taylor serisi 近似,以及它们与优化方法的联系

## 问题

Bir milyon ağırlık içeren nöral ağınız var. Her ağırlık bir dönüm noktasıdır.

微积分, neural ağı eğitmek, her türlü değişimi denemek, sonra da iyi şans elde etmek demektir. 导数 varsa, her bir ağırlığın hataları nasıl etkilediğini tam olarak bilebilirsin.

## 概念

### - Nedir bu?

导数量衡变化率──对函数 $y = f(x)$,导数 $f'(x)$Sana söyleyeyim: Eğer sen$x$Küçük bir adım ilerle.$y$Ne kadar değişecek?

Görevsel olarak, yönlü sayı bir noktada çizginin eğilimi olarak görülür.

**$f(x) = x^2$：**

| $x$ | $f(x)$ | $f'(x)$（斜率） |
|---|------|---------------|
| 0 | 0    | 0（平坦，在底部） |
| 1 | 1    | 2 |
| 2 | 4    | 4（该点处切线的斜率） |
| 3 | 9    | 6 |

- Evet .$x=2$时, eğri oranı 4... eğer $x$Sağya doğru hareket etmek çok küçük bir nokta,$y$Bu hareketlilik miktarını yaklaşık 4 katına çıkarmak istiyorum.$x=0$时,斜率 is 0...

形式化定義:

```math
f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}
```

Kodda, sınırları geçersin, doğrudan çok küçük bir tane kullanırsın.$h$Bu sayı değerinin bir kısmıdır.

### 偏导数: once only see a variable

Gerçek fonksiyonun birçok girişleri vardır. Nöral Ağın Kaybesi, binlerce ağırlığa bağlıdır.

```math
\begin{aligned}
f(x, y) &= x^2 + 3xy + y^2 \\[4pt]
\frac{\partial f}{\partial x} &= 2x + 3y \quad \text{（将 } y \text{ 视为常量）} \\
\frac{\partial f}{\partial y} &= 3x + 2y \quad \text{（将 } x \text{ 视为常量）}
\end{aligned}
```

Her yönlendirme cevap: Eğer sadece bu ağırlığı azaltırsam, Kayıp nasıl değişir?

### Gradient: tüm yön yönlü sayıların oluşturduğu vektör

Gradient, her yönlendirme sayısını bir vektöre toplar.$f(x, y, z)$,Gradient:

```math
\nabla f = \left[ \frac{\partial f}{\partial x}, \frac{\partial f}{\partial y}, \frac{\partial f}{\partial z} \right]
```

Gradient gösterir en yüksek yönde. Bir işlevi en aza indirmek için, karşı yönde hareket etmektedir.

**$f(x,y) = x^2 + y^2$ 的等高线图：**

Bu işlevi bir bowl şeklinde eğri bir şekil oluşturur, eğ高線=同心圆.

| 点 | $\nabla f$ | $-\nabla f$（下降方向） |
|-------|--------|----------------------------|
| (1, 1) | [2, 2]（指向上坡，远离最小值） | [-2, -2]（指向下坡，朝向最小值） |
| (0, 0) | [0, 0]（平坦，在最小值处） | [0, 0] |

İşte bir tabloda bir dereceli düşüş.

### Optimizasyon ile bağlantı

訓練 Neural Network 就是优化──你有一个损失功能 $L(w_1, w_2, \ldots, w_n)$Bu bir model ölçüsü.

```
Gradient descent update rule:

  w_new = w_old - learning_rate * dL/dw

For every weight:
  1. Compute the partial derivative of loss with respect to that weight
  2. Subtract a small multiple of it from the weight
  3. Repeat
```

Öğrenme hızı  kontrol et                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

**Loss landscape（1D 切片）：**

Kayıp Fonksiyonu $L(w)$                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             $w$Değişiklikler bir tepesi olan bir dalın eğri oluşur.

| 特征 | 描述 |
|---------|-------------|
| Global minimum | 整条曲线上的最低点，即最佳解 |
| Local minimum | 比邻近位置更低、但不是整体最低点的谷 |
| Slope | Gradient Descent 会从任意起点沿斜率向下走 |

Gradient Descent 会 ırmak oranının aşağı yukarı giderek gerçekleşir. Yerel minimumlara düşebilir, ancak yüksek boyutlu alanlarda bu pek az gerçek bir sorundur.

### 解析导数 vs 解析导数

Bilgisayarın iki yolu vardır.

解析方式:手动应用微积分规则──对 $f(x) = x^2$,导数是 $f'(x) = 2x$❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖

sayı değer biçimi: kullanımı tanımlama için yaklaşımlılık.$h$计算 $f(x+h)$和 $f(x-h)$Sonra da farkı çıkar.

```
Numerical (central difference):

f'(x) ~= f(x + h) - f(x - h)
          -----------------------
                  2h

h = 0.0001 works well in practice
```

Değerli bir dizgin daha yavaş, ancak herhangi bir işlevi için uygundur. Değerli bir dizgin hızlıdır, ancak yönlendirmelisiniz.

### Hand Handling: basit fonksiyonların indirgenicesi

Bunlar ML'de tekrar tekrar gördüğünüz yönlendirmeler.

```
Function        Derivative       Used in
--------        ----------       -------
f(x) = x^2     f'(x) = 2x      Loss functions (MSE)
f(x) = wx + b  f'(w) = x        Linear layer (gradient w.r.t. weight)
                f'(b) = 1        Linear layer (gradient w.r.t. bias)
                f'(x) = w        Linear layer (gradient w.r.t. input)
f(x) = e^x     f'(x) = e^x     Softmax, attention
f(x) = ln(x)   f'(x) = 1/x     Cross-entropy loss
f(x) = 1/(1+e^-x)  f'(x) = f(x)(1-f(x))   Sigmoid activation
```

- Evet .$f(x) = x^2$- ...

```
f(x) = x^2    f'(x) = 2x

  x    f(x)   f'(x)   meaning
  -2    4      -4      slope tilts left (decreasing)
  -1    1      -2      slope tilts left (decreasing)
   0    0       0      flat (minimum!)
   1    1       2      slope tilts right (increasing)
   2    4       4      slope tilts right (increasing)
```

- Evet .$f(w) = wx + b$, ve $x=3$- Evet.$b=1$- ...

```
f(w) = 3w + 1    f'(w) = 3

The derivative with respect to w is just x.
If x is big, a small change in w causes a big change in output.
```

### 链式法则

Bir fonksiyon oluştuğunda, zincir kuralları size nasıl yönlendirileceğini söyler.

```
If y = f(g(x)), then dy/dx = f'(g(x)) * g'(x)

Example: y = (3x + 1)^2
  outer: f(u) = u^2       f'(u) = 2u
  inner: g(x) = 3x + 1    g'(x) = 3
  dy/dx = 2(3x + 1) * 3 = 6(3x + 1)
```

Nöral Ağı:bir satır işlevi: giriş -> doğrusal -> etkinleştirme -> doğrusal -> etkinleştirme -> kaybı。 Geri yayılma, yani çıkıştan girişe dönüştürülmüş uygulama zinciri biçimi¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

### Hessian Matrix

Gradient 告诉你斜率──Hessian 告诉你曲率──

Hessian ise ikinci aşamalı bir dizi oluşum matrisi.$f(x_1, x_2, \ldots, x_n)$Hessian'ın$(i, j)$项是:

```math
H_{ij} = \frac{\partial^2 f}{\partial x_i \, \partial x_j}
```

对于二变量函数 $f(x, y)$- ...

```math
H = \begin{bmatrix} \dfrac{\partial^2 f}{\partial x^2} & \dfrac{\partial^2 f}{\partial x \, \partial y} \\[8pt] \dfrac{\partial^2 f}{\partial y \, \partial x} & \dfrac{\partial^2 f}{\partial y^2} \end{bmatrix}
```

**Hessian 在临界点（Gradient = 0 的地方）告诉你什么：**

| Hessian 性质 | 含义 | 示例曲面 |
|-----------------|---------|-----------------|
| 正定（所有 eigenvalues > 0） | Local minimum | 向上开口的碗 |
| 负定（所有 eigenvalues < 0） | Local maximum | 向下开口的碗 |
| 不定（eigenvalues 正负混合） | Saddle point | 马鞍形 |

**示例：** $f(x, y) = x^2 - y^2$(Bir oturağı 函数)

```
df/dx = 2x       df/dy = -2y
d^2f/dx^2 = 2    d^2f/dy^2 = -2    d^2f/dxdy = 0

H = | 2   0 |
    | 0  -2 |

Eigenvalues: 2 and -2 (one positive, one negative)
--> Saddle point at (0, 0)
```

ile$f(x, y) = x^2 + y^2$(一个碗形函数) (BİZİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİN

```
H = | 2  0 |
    | 0  2 |

Eigenvalues: 2 and 2 (both positive)
--> Local minimum at (0, 0)
```

**为什么 Hessian 在 ML 中重要：**

Newton'un yöntemini kullanmak için Hessian'dan daha iyi bir optimizasyon adımını kullanın.

```math
\begin{aligned}
\text{牛顿法更新：} \quad & w_{\text{new}} = w_{\text{old}} - H^{-1} \cdot \text{梯度} \\
\text{梯度下降：} \quad & w_{\text{new}} = w_{\text{old}} - \text{lr} \cdot \text{梯度}
\end{aligned}
```

Newton'un yöntemi 收更快, çünkü Hessian 会 yeniden küçültülmüş  Gradient:方向的步子更小,平坦方向的步子更大──

Sorun şu:$N$个参数的神经网络,Hessian $N \times N$❖ Bir milyon parametre olan bir model, 1 milyar element içeren bir matris gerektirir. Bu yüzden yaklaşım yöntemini kullanıyoruz.

| 方法 | 使用什么 | 成本 | 收敛 |
|--------|-------------|------|-------------|
| Gradient Descent | 只使用一阶导数 | 每步 $O(N)$ | 慢（线性） |
| Newton's method | 完整 Hessian | 每步 $O(N^3)$ | 快（二次） |
| L-BFGS | 从 Gradient 历史近似 Hessian | 每步 $O(N)$ | 中等（超线性） |
| Adam | 每参数自适应 rate（对角 Hessian 近似） | 每步 $O(N)$ | 中等 |
| Natural gradient | Fisher information matrix（统计 Hessian） | 每步 $O(N^2)$ | 快 |

實踐中,Adam is Deep Learning'ın öntanımlı Optimizer── it tracks each parameter Gradient'in run average and square difference, to low cost approximate second-stage information──

### Taylor Serisi 近似

 herhangi bir düzleme işlevi, yerel olarak bir çok yönlü yaklaşım olarak kullanılabilir:

```math
f(x + h) = f(x) + f'(x)\,h + \frac{1}{2} f''(x)\,h^2 + \frac{1}{6} f'''(x)\,h^3 + \cdots
```

包含的项越多,近似越好,但只在点 $x$Yakın bir yerde.

**为什么 Taylor series 对 ML 重要：**

- **一阶 Taylor = Gradient Descent。**Çıkışlı$f(x + h) \approx f(x) + f'(x) h$Bu yüzden, bu çizgi modelini en aza indirmek için, bu çizgi modelini seçmek için.$h = -\text{lr} \cdot f'(x)$- Evet.

- **二阶 Taylor = Newton's method。**Kullanım$f(x + h) \approx f(x) + f'(x) h + \frac{1}{2} f''(x) h^2$Bir ikinci model elde edersin.$h = -f'(x)/f''(x)$Newton'un adımıdır.

- **Loss Function 设计。**MSE ve çapraz entropi düzeltilmiştir, bu da Taylor genişlemeleri iyi performans göstermektedir. Bu tesadüf değil.

```
Approximation order    What it captures    Optimization method
-------------------    -----------------   -------------------
0th order (constant)   Just the value      Random search
1st order (linear)     Slope               Gradient descent
2nd order (quadratic)  Curvature           Newton's method
Higher orders          Finer structure     Rarely used in ML
```

关键洞见是: tüm Gradient tabanlı optimization, aslında tüm yerel yakınlık kaybı işlevi, ve bu yakınlık işlevi en az değeri adım adım.

### ML İçin 积分

导数 size değişim oranını anlatır.

ML'de çok az kişi manuel hesaplama yapıyor, ama bu kavram var.

**概率。**                                   $p(x)$Bu değişim:
```math
P(a < X < b) = \int_a^b p(x) \, dx
```
概率 yoğunluk eğri $a$和 $b$间面积,就是落在该区间内的概率──

**期望值。**概率加权的平均结果:
```math
\mathbb{E}[f(X)] = \int f(x) \, p(x) \, dx
```
Veriler dağıtımında beklenen kayıp bir积分―― eğitim, deneyiminin en azına yaklaşmasıdır.

**KL divergence。** İki farklı dağılım ölçmek:
```math
\mathrm{KL}(p \,\|\, q) = \int p(x) \log \frac{p(x)}{q(x)} \, dx
```
VAE'ler, bilgi destilasyonu ve Bayesian sonuçları kullanıyor.

**归一化常数。**Bayesian sonucu 中:
```math
p(w \mid \text{data}) = \frac{p(\text{data} \mid w) \, p(w)}{\int p(\text{data} \mid w) \, p(w) \, dw}
```
分母, tüm olası parametreler değerinin积分idir. Genellikle işlenmez, bu yüzden MCMC ve varyasyonsal çıkarım gibi yaklaşım yöntemlerini kullanıyoruz.

| 积分概念 | 在 ML 中出现的位置 |
|-----------------|----------------------|
| 曲线下面积 | 由 density functions 得到概率 |
| 期望值 | Loss Functions、risk minimization |
| KL divergence | VAEs、policy optimization、distillation |
| 归一化 | Bayesian posteriors、softmax denominator |
| Marginal likelihood | Model comparison、evidence lower bound (ELBO) |

### Hesaplama Grafiği 中的多变量链式法则

链式法则不仅适用于一条线上的标量函数――在神经网络中,变量会分叉并合并――下面显示导数如何流过一个简单的前进传递:

```mermaid
graph LR
    x["x (input)"] -->|"*w"| z1["z1 = w*x"]
    z1 -->|"+b"| z2["z2 = w*x + b"]
    z2 -->|"sigmoid"| a["a = sigmoid(z2)"]
    a -->|"loss fn"| L["L = -(y*log(a) + (1-y)*log(1-a))"]
```

Geriye geçiş 会从右到左计算 Gradient:

```mermaid
graph RL
    dL["dL/dL = 1"] -->|"dL/da"| da["dL/da = -y/a + (1-y)/(1-a)"]
    da -->|"da/dz2 = a(1-a)"| dz2["dL/dz2 = dL/da * a(1-a)"]
    dz2 -->|"dz2/dw = x"| dw["dL/dw = dL/dz2 * x"]
    dz2 -->|"dz2/db = 1"| db["dL/db = dL/dz2 * 1"]
```

Her bir ok da yerel yönlendirme sayısı üzerinde çarpılır. Herhangi bir parametre'nin derecesi, Kaybettikten bu parametre yoluna kadar tüm yerel yönlendirme sayısı çarpıdır. Yollar ayrılırken ve birleşirken, her bir yolun katkılarını artıracaksınız.

Backpropagation'ın tüm içeriği şudur: Output'tan Input'a kadar sistematik olarak hesaplama grafiklerinde uygulama zinciri kuralları vardır.

### Jacobian Matrix

Bir işlevin vektörü 映射 ettiği zaman, onun yönlendirmesi bir Matrix ve Jacobian'da her giriş ile ilgili her çıkışın tüm yönlendirmelerin bulunması vardır.

- Evet .$f: \mathbb{R}^n \to \mathbb{R}^m$- Yacobian.$J$Evet, bir tane.$m \times n$Matrix:

| | $x_1$ | $x_2$ | ... | $x_n$ |
|---|---|---|---|---|
| $f_1$ | $\partial f_1/\partial x_1$ | $\partial f_1/\partial x_2$ | ... | $\partial f_1/\partial x_n$ |
| $f_2$ | $\partial f_2/\partial x_1$ | $\partial f_2/\partial x_2$ | ... | $\partial f_2/\partial x_n$ |
| ... | ... | ... | ... | ... |
| $f_m$ | $\partial f_m/\partial x_1$ | $\partial f_m/\partial x_2$ | ... | $\partial f_m/\partial x_n$ |

Neural Network için yapmıyorsun. Jacobian. Python. Torch. Bu işlemleri yapar. Ama varlığını bilmen, geri yayılma ortamının şeklini anlamama yardımcı olur.$\mathbb{R}^n$映射到 $\mathbb{R}^m$- Yacobiyen .$m \times n$❖ Gradient 会通过这个矩阵的转置向后流动──

### Bu neden sinir ağı için çok önemli ?

Neural Network'deki her bir güç bir Gradient elde eder. Gradient size bu güçleri nasıl ayarlayacağınızı ve kayıpları nasıl azaltacağınızı söyler.

```mermaid
graph LR
    subgraph Forward["Forward Pass"]
        I["input"] --> W1["W1"] --> R["relu"] --> W2["W2"] --> S["softmax"] --> L["loss"]
    end
```

```mermaid
graph RL
    subgraph Backward["Backward Pass"]
        dL["dL/dloss"] --> dW2["dL/dW2"] --> d2["..."] --> dW1["dL/dW1"]
    end
```

Her kez yeniden yenilenir:
- `W1 = W1 - lr * dL/dW1`
- `W2 = W2 - lr * dL/dW2`

Önceden geçmek 计算预测和 Loss── geriye geçmek 计算 Loss 对于每权重的格第ент──然后每权重都向下坡方向迈一小步──重复数百万步──这是深度学习──


```figure
derivative-tangent
```

## Yapın onu.

### 步骤 1: sıfırdan gerçekleştirici değer

```python
def numerical_derivative(f, x, h=1e-7):
    return (f(x + h) - f(x - h)) / (2 * h)

def f(x):
    return x ** 2

for x in [-2, -1, 0, 1, 2]:
    numerical = numerical_derivative(f, x)
    analytical = 2 * x
    print(f"x={x:2d}  f'(x) numerical={numerical:.6f}  analytical={analytical:.1f}")
```

Sayı değerli ve çözme yönlendirmesi birçok küçük sayılarda uyumludur.

### 步骤 2: Geçici ile Geçici

```python
def numerical_gradient(f, point, h=1e-7):
    gradient = []
    for i in range(len(point)):
        point_plus = list(point)
        point_minus = list(point)
        point_plus[i] += h
        point_minus[i] -= h
        partial = (f(point_plus) - f(point_minus)) / (2 * h)
        gradient.append(partial)
    return gradient

def f_multi(point):
    x, y = point
    return x**2 + 3*x*y + y**2

grad = numerical_gradient(f_multi, [1.0, 2.0])
print(f"Numerical gradient at (1,2): {[f'{g:.4f}' for g in grad]}")
print(f"Analytical gradient at (1,2): [2*1+3*2, 3*1+2*2] = [{2*1+3*2}, {3*1+2*2}]")
```

### 步骤 3: Gradient Descent ile f(x) = x^2'in en az değerini bul

```python
x = 5.0
lr = 0.1
for step in range(20):
    grad = 2 * x
    x = x - lr * grad
    print(f"step {step:2d}  x={x:8.4f}  f(x)={x**2:10.6f}")
```

- Evet .$x=5$Başlayın, her adım daha yaklaşıyor.$x=0$(minimum değer)

### 步骤 4: 2D 函数 üzerinde Gradient Descent gerçekleştir

```python
def f_2d(point):
    x, y = point
    return x**2 + y**2

point = [4.0, 3.0]
lr = 0.1
for step in range(30):
    grad = numerical_gradient(f_2d, point)
    point = [p - lr * g for p, g in zip(point, grad)]
    loss = f_2d(point)
    if step % 5 == 0 or step == 29:
        print(f"step {step:2d}  point=({point[0]:7.4f}, {point[1]:7.4f})  f={loss:.6f}")
```

### Adım 5: Aralıklı değerler ve değerler karşılaştırma ve değerler analiz

```python
import math

test_functions = [
    ("x^2",      lambda x: x**2,          lambda x: 2*x),
    ("x^3",      lambda x: x**3,          lambda x: 3*x**2),
    ("sin(x)",   lambda x: math.sin(x),   lambda x: math.cos(x)),
    ("e^x",      lambda x: math.exp(x),   lambda x: math.exp(x)),
    ("1/x",      lambda x: 1/x,           lambda x: -1/x**2),
]

x = 2.0
print(f"{'Function':<12} {'Numerical':>12} {'Analytical':>12} {'Error':>12}")
print("-" * 50)
for name, f, df in test_functions:
    num = numerical_derivative(f, x)
    ana = df(x)
    err = abs(num - ana)
    print(f"{name:<12} {num:12.6f} {ana:12.6f} {err:12.2e}")
```

### 步骤 6: Hessian sayı değerini hesaplamak

```python
def hessian_2d(f, x, y, h=1e-5):
    fxx = (f(x + h, y) - 2 * f(x, y) + f(x - h, y)) / (h ** 2)
    fyy = (f(x, y + h) - 2 * f(x, y) + f(x, y - h)) / (h ** 2)
    fxy = (f(x + h, y + h) - f(x + h, y - h) - f(x - h, y + h) + f(x - h, y - h)) / (4 * h ** 2)
    return [[fxx, fxy], [fxy, fyy]]

def saddle(x, y):
    return x ** 2 - y ** 2

def bowl(x, y):
    return x ** 2 + y ** 2

H_saddle = hessian_2d(saddle, 0.0, 0.0)
H_bowl = hessian_2d(bowl, 0.0, 0.0)
print(f"Saddle Hessian: {H_saddle}")  # [[2, 0], [0, -2]] -- mixed signs
print(f"Bowl Hessian:   {H_bowl}")    # [[2, 0], [0, 2]]  -- both positive
```

Seaddle 函数的Hessian has eigenvalues 2 和 -2(符号混合,确认是 Saddle point) ・・・ bowls 函数 has eigenvalues 2 和 2(均为正,确认是最小) ・・・

### 步骤7:Taylor 近似的实际效果

```python
import math

def taylor_approx(f, f_prime, f_double_prime, x0, h, order=2):
    result = f(x0)
    if order >= 1:
        result += f_prime(x0) * h
    if order >= 2:
        result += 0.5 * f_double_prime(x0) * h ** 2
    return result

x0 = 0.0
for h in [0.1, 0.5, 1.0, 2.0]:
    true_val = math.sin(h)
    t1 = taylor_approx(math.sin, math.cos, lambda x: -math.sin(x), x0, h, order=1)
    t2 = taylor_approx(math.sin, math.cos, lambda x: -math.sin(x), x0, h, order=2)
    print(f"h={h:.1f}  sin(h)={true_val:.4f}  order1={t1:.4f}  order2={t2:.4f}")
```

- Evet .$x_0=0$Yakınlık,$\sin(x) \approx x$(一阶泰勒) 〜对很小的$h$Bu çok iyi görünüyor ama daha büyük bir şekilde.$h$Bu yüzden, daha küçük öğrenme oranlarında Gradient Descent'in en iyi etkisi: her adımın doğru olduğunu varsaymak.

### Adım 8: Bu neden sinir ağı için çok önemli ?

```python
import random

random.seed(42)

w = random.gauss(0, 1)
b = random.gauss(0, 1)
lr = 0.01

xs = [1.0, 2.0, 3.0, 4.0, 5.0]
ys = [3.0, 5.0, 7.0, 9.0, 11.0]

for epoch in range(200):
    total_loss = 0
    dw = 0
    db = 0
    for x, y in zip(xs, ys):
        pred = w * x + b
        error = pred - y
        total_loss += error ** 2
        dw += 2 * error * x
        db += 2 * error
    dw /= len(xs)
    db /= len(xs)
    total_loss /= len(xs)
    w -= lr * dw
    b -= lr * db
    if epoch % 40 == 0 or epoch == 199:
        print(f"epoch {epoch:3d}  w={w:.4f}  b={b:.4f}  loss={total_loss:.6f}")

print(f"\nLearned: y = {w:.2f}x + {b:.2f}")
print(f"Actual:  y = 2x + 1")
```

Her Gradient tabanlı eğitim döngüsü bu moduya uyar: öngörüm, hesaplama, kaybı hesaplama, gradyenin yenilemesi, ağırlık.

## Kullan

NumPy kullanın, aynı şekilde daha hızlı, daha basit bir şekilde:

```python
import numpy as np

x = np.array([1, 2, 3, 4, 5], dtype=float)
y = np.array([3, 5, 7, 9, 11], dtype=float)

w, b = np.random.randn(), np.random.randn()
lr = 0.01

for epoch in range(200):
    pred = w * x + b
    error = pred - y
    loss = np.mean(error ** 2)
    dw = np.mean(2 * error * x)
    db = np.mean(2 * error)
    w -= lr * dw
    b -= lr * db

print(f"Learned: y = {w:.2f}x + {b:.2f}")
```

Siz sadece Gradient Descent'i oluşturmuşsunuz. PyTorch otomatik olarak Gradient'i tamamlayacak.

## 练习

1. İki kez kullanılıyor.`numerical_derivative`Nasıl gerçekleştirilir ?`numerical_second_derivative(f, x)`❖ Test$x^3$- Evet .$x=2$处的二阶导数是12──
2. 使用 Gradient Descent 找到 $f(x, y) = (x - 3)^2 + (y + 1)^2$En az değer.$(0, 0)$Başlamak.$(3, -1)$- Evet.
3. Geçici Düşüş Çemberinde İlişki:维护一个会累积过去$f(x) = x^4 - 3x^2$Üst karşılaştırma olarak hiç bir hızın olmadığı bir hızın oluşması.

### 提示

**练习 1。**定义一个返回 `numerical_derivative(f, x)`Bu da bir yardımcı fonksiyon.`numerical_derivative` Eğer sonuç gürültü daha büyükse, iki kez daha büyük bir adım kullanılır, örneğin `h=1e-4`Bu da ...$x=2$处的结果应接近12:

**练习 2。**写出梯度 $(2(x - 3), 2(y + 1))$, veya kullanmak `numerical_gradient`, $(0, 0)$開始调用 `gradient_descent_nd`❖ Her 10 adımda bir tane tane çizgi basın;$(3, -1)$Hareket, kayıp 0'ya yakın düşmelidir.

**练习 3。**保存速度 `v`,按 `v = momentum * v - lr * grad`Yenile, yeniden geleceğim.`v`- Evet .`x`上──statistik iki yöntemi bir dereceyi 0'ya yakın hale getirmek için her iki yönteme de kaç adım gerekmektedir; en az değer bulunmaktadır.$x = \pm\sqrt{1.5} \approx \pm 1.225$- Evet.

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|----------------------|
| Derivative | “斜率” | 函数在某一点的变化率。告诉你输入每变化一个单位，输出会变化多少。 |
| Partial derivative | “一个变量的导数” | 在保持其他所有变量不变时，对某一个变量求导。 |
| Gradient | “最陡上升方向” | 由所有偏导数组成的 Vector。指向让函数增长最快的方向。 |
| Gradient Descent | “往下坡走” | 从参数中减去 Gradient（乘以 learning rate），从而降低 Loss。Neural Network 训练的核心。 |
| Learning rate | “步长” | 控制每一步 Gradient Descent 有多大的标量。太大：发散。太小：收敛缓慢。 |
| Chain rule | “把导数相乘” | 对复合函数求导的规则：$\frac{df}{dx} = \frac{df}{dg} \cdot \frac{dg}{dx}$。Backpropagation 的数学基础。 |
| Jacobian | “导数 Matrix” | 当一个函数把 Vector 映射到 Vector 时，Jacobian 是所有输出相对于输入的偏导数组成的 Matrix。 |
| Numerical derivative | “有限差分” | 通过在两个相邻点上评估函数并计算它们之间的斜率来近似导数。 |
| Backpropagation | “Reverse-mode autodiff” | 使用链式法则，从输出到输入逐层计算 Gradient。Neural Network 就是这样学习的。 |
| Hessian | “二阶导数 Matrix” | 所有二阶偏导数组成的 Matrix。描述函数的曲率。在临界点处 Hessian 正定意味着 local minimum。 |
| Taylor series | “多项式近似” | 使用函数的导数在某一点附近近似函数：$f(x+h) \approx f(x) + f'(x)h + \frac{1}{2}f''(x)h^2 + \cdots$ 它是理解 Gradient Descent 和 Newton's method 为什么有效的基础。 |
| Integral | “曲线下面积” | 某个量在一个范围内的累积。在 ML 中，积分定义概率、期望值和 KL divergence。 |

## 延伸阅读

- [3Blue1Brown: Essence of Calculus](https://www.3blue1brown.com/topics/calculus)- 关于导数,积分和链式法则的视觉直觉
- [Stanford CS231n: Backpropagation](https://cs231n.github.io/optimization-2/)- Gradient  nasıl akıştı Nöral Ağ katmanı
