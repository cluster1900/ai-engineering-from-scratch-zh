# Düzsel Sistemler

> Çözüm arayın .$Ax = b$Matematikte en eski sorunlardan biri, ve bugün bile sinir ağını çalıştırıyor.

**Type:** Build
**Language:**Python
**前置要求：**1. Fase Dersler 01 (Hattı Cevabı İntüyüsü),02 (Vektörler ve Matrisler),03 (Matrix Transformations)
**Time:** ~120 minutes

## Öğrenme hedefi
- Gebraç带 kısmi dönme ve geri dönüş değiştirme 求解 $Ax = b$
- LU、QR 和 Cholesky parçalanmalarını kullanın, Matrix'i çözün, ve her türlü yöntemin uygulanabilir olduğunu açıklayın.
- 推导最小正方形的正常方程式,并将其与线性回归和脊回归 联系起来
- İşe yarayan sistemleri teşhis etmek, düzenlemeyi uygulamak, sabitleştirmek

## 问题
Her antrenmanında bir çizgi gerileme sırasında, sen de bir çizgi sistemi çözmeye çalışıyorsun.`y = Wx + b`时,它都在评估线性系统的一侧. 时,你在修改这个系统. 时,你在分解一个矩阵. 时,你在分解一个矩阵. 时,你在解一个线性系统.

方程                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           $Ax = b$- Hayır, hayır.$A$Matrix'in bilinen bir parçasıdır.$b$Yapımcılık vektörünün bilinen bir çıkışıdır.$x$Bu da bir şey.$A$- Verileriniz matrisidir.$b$- Hedef vektörün.$x$Evet, tüm model şu sonuca varabilir:$x$,使 $Ax$- En yakın olabildiğince .$b$- Evet.

Bu ders, bu denklemin tüm ana yöntemlerini sıfırdan kurarak çözecek. Bazı yöntemlerin neden daha hızlı, diğerleri daha istikrarlı olduğunu, bazı yöntemlerin neden sadece kare sistemlere uygulanabileceğini, diğerleri ise aşırı belirlenmiş sistemleri ele alabileceğini ve Matrix'in koşul sayısı neden cevaplarınızın anlamlı olup olmadığını belirlediğini anlayacaksınız.

## 概念
### Ax = b hangi anlamda

Bir çizgisi denklem sistemi 具有几何解释──每个方程式 定义一个超平面──解就是所有超平面相交的点(或点集)──

```
2x + y = 5          2D 中的两条直线。
x - y  = 1          它们相交于 x=2, y=1。
```

```mermaid
graph LR
    A["2x + y = 5"] --- S["解: (2, 1)"]
    B["x - y = 1"] --- S
```

Üç tür durum ortaya çıkabilir:

```mermaid
graph TD
    subgraph "唯一解"
        A1["直线相交于单个点"]
    end
    subgraph "无解"
        A2["直线平行 — 没有交点"]
    end
    subgraph "无穷多解"
        A3["直线重合 — 每个点都是解"]
    end
```

Matrix'te "tek çözüm" anlamı$A$"Hiçbir çözüm yok" anlamı sistem tutarlı değildir.$A$Çoğu ML  problemi  没有精确解的类别, çünkü denklemleriniz (data point) bilinmeyen parametrelerden daha fazla.

### sütun resmi vs satır resmi

Anlamanın iki yolu var.$Ax = b$- Evet.

**Row picture.** $A$Her satır bir denklem tanımlar. Her denklem bir hiperplane.

**Column picture.** $A$Her bir sırada bir vektör var.$A$Sütunların hangi doğrusal kombinasyonu oluşur ?$b$- Ne ?

```
A = | 2  1 |    b = | 5 |
    | 1 -1 |        | 1 |

Row picture: 同时求解 2x + y = 5 和 x - y = 1。

Column picture: 找到 x1, x2，使得：
  x1 * [2, 1] + x2 * [1, -1] = [5, 1]
  2 * [2, 1] + 1 * [1, -1] = [4+1, 2-1] = [5, 1]   check.
```

Sütun resmi daha temel olarak...$b$位于 $A$Sistemi çözmek için bir sütun boşluğu var.$b$Bu nokta en az kare çözümüdür.

### Gaussian ortadan kaldırılması

Gaussian ' ın ortadan kaldırılması$Ax = b$转换为 Üst Üçgen Sistem$Ux = c$Sonra da geri dönüşle çözüm bul. Bu en doğrudan yöntem.

算法:

```
1. 对每一列 k（pivot column）：
   a. 在第 k 行及其下方，找到 column k 中最大的 entry（partial pivoting）。
   b. 将该行与第 k 行交换。
   c. 对 k 下方的每一行 i：
      - 计算 multiplier m = A[i][k] / A[k][k]
      - 从第 i 行中减去 m 倍的第 k 行。
2. Back substitute：从最后一个 equation 向上求解。
```

Örnek:

```
Original:
| 2  1  1 | 8 |       R2 = R2 - (2)R1     | 2  1   1 |  8 |
| 4  3  3 |20 |  -->  R3 = R3 - (1)R1 --> | 0  1   1 |  4 |
| 2  3  1 |12 |                            | 0  2   0 |  4 |

                       R3 = R3 - (2)R2     | 2  1   1 |  8 |
                                       --> | 0  1   1 |  4 |
                                           | 0  0  -2 | -4 |

Back substitute:
  -2 * x3 = -4    -->  x3 = 2
  x2 + 2  = 4     -->  x2 = 2
  2*x1 + 2 + 2 = 8 --> x1 = 2
```

Gaussian elimination'ın hesaplama maliyeti$O(n^3)$ için $1000 \times 1000$Bu sistem, yaklaşık olarak bir milyar kez yüzen nokta işlemleri... Çok hızlı ama aynı şeyi kullanmanız gerekiyorsa...$A$Daha çok sistemi çözmek için daha iyi bir şey yapabilmek için.

### Bölümsel dönüşüm: Neden önemli

 pivot yok, Gaussian ortadan kaldırma başarısız olabilir veya çöp sonuçları üretir. Eğer pivot elementı 为零 ise, siz de 零 olarak ayrılır.

```
Bad pivot:                       With partial pivoting:
| 0.001  1 | 1.001 |            先交换行：
| 1      1 | 2     |            | 1      1 | 2     |
                                 | 0.001  1 | 1.001 |
m = 1/0.001 = 1000              m = 0.001/1 = 0.001
R2 = R2 - 1000*R1               R2 = R2 - 0.001*R1
| 0.001  1     | 1.001   |      | 1      1     | 2     |
| 0     -999   | -999.0  |      | 0      0.999 | 0.999 |

x2 = 1.000（正确）              x2 = 1.000（正确）
x1 = (1.001 - 1)/0.001          x1 = (2 - 1)/1 = 1.000（正确）
   = 0.001/0.001 = 1.000        稳定，因为 multiplier 很小。
```

Kesinlikle sınırlı olan yüzen nokta aritmetikinde, henüz pivot edilmemiş versiyon önemli rakamlar kaybedebilir.

### LU parçalanması

LU parçalanması$A$分解为 alt üçgenli matris$L$和 üst üçgenli matris $U$- ...$A = LU$- Evet.$L$Matrix  depo Gaussian ortadan kaldırma 中的乘因子──$U$Matrix, ortadan kaldırma sonucudur.

```
A = L @ U

| 2  1  1 |   | 1  0  0 |   | 2  1   1 |
| 4  3  3 | = | 2  1  0 | @ | 0  1   1 |
| 2  3  1 |   | 1  2  1 |   | 0  0  -2 |
```

Neden bir faktör olsam, doğrudan ortadan kaldırılmasın?$L$和 $U$, yeni bir şekilde .$b$Çözüm arayın .$Ax = b$Sadece ihtiyacım var.$O(n^2)$- ...

```math
\begin{aligned}
Ax &= b \\
LUx &= b \\
&\text{令 } y = Ux\text{:} \\
Ly &= b \quad \text{（前代，} O(n^2)\text{）} \\
Ux &= y \quad \text{（回代，} O(n^2)\text{）}
\end{aligned}
```

$O(n^3)$Bu yüzden, bu kadar çok şey var.$O(n^2)$Eğer aynısını kullanmak istiyorsan.$A$Farklı.$b$Vectörler 1000'i çözmek için çalışıyorlar.

Parsiyel dönüşüm kullanın, elde edersiniz.$PA = LU$, içinden $P$                                                                                                                                                                                                                                                              

### QR parçalanması

QR parçalanması$A$分解为 ortogonal matris $Q$和 üst üçgenli matris $R$- ...$A = QR$- Evet.

Ortogonal matris 具有 $Q^T Q = I$Yapısal olarak, sütunları ortonomik vektörlerdir.$Q$Uzunlukları ve açıları tutmak için.

```
A = Q @ R

Q has orthonormal columns: Q^T Q = I
R is upper triangular

To solve Ax = b:
  QRx = b
  Rx = Q^T b    (只需乘以 Q^T，不需要 inversion)
  Back substitute to get x.
```

En az kare problemlerini çözmek için çalışırken, QR LU'dan daha iyi sayısal istikrarda.$Q$- ...

```
Given columns a1, a2, ... of A:

q1 = a1 / ||a1||

q2 = a2 - (a2 . q1) * q1        (减去到 q1 上的 projection)
q2 = q2 / ||q2||                (normalize)

q3 = a3 - (a3 . q1) * q1 - (a3 . q2) * q2
q3 = q3 / ||q3||

R[i][j] = qi . aj    for i <= j
```

Her adımın ardından her şey taşınır.$q$vektörlerin bileşenleri, sadece yeni ortogonal yön bırakın.

### Cholesky parçalanması

- Evet .$A$Simetrik.$A = A^T$) ve pozitif kesin ((( tüm öz değerleri doğru) zaman, onu parçalayabilirsiniz$A = L L^T$, içinden $L$Aşağı üçgenli. İşte Cholesky'nin parçalanması.

```
A = L @ L^T

| 4  2 |   | 2  0 |   | 2  1 |
| 2  5 | = | 1  2 | @ | 0  2 |

L[i][i] = sqrt(A[i][i] - sum(L[i][k]^2 for k < i))
L[i][j] = (A[i][j] - sum(L[i][k]*L[j][k] for k < j)) / L[j][j]    for i > j
```

Cholesky LU'dan 快两倍, ve sadece depolama alanının yarısını gerektirir. Sadece simetrik pozitif kesin matrisler için uygundur, ancak bu tür Matrix sıkça ortaya çıkar:

- Kovariansa matrisleri simetrik pozitif yarı kesinlerdir.
- Gaussian süreçleri arasında çekirdek matrisi simetrik pozitif kesintir.
- Konves fonksiyonun en az 处'nin Hessian'ı simetrik pozitif kesin olarak vardır.
- $A^T A$总是对称 olumlu yarı belirlenmiş

Gaussian süreçlerinde, Cholesky'yi kullanarak çekirdek matrisini çözüyorsun.$K$Sonra çözme iste .$K \alpha = y$Cholesky faktörü ayrıca sınırlı olasılıkların log-determinansını verir:$\log \det(K) = 2 \sum \log(\mathop{\mathrm{diag}}(L))$- Evet.

### En az kare:当 Ax = b 没有精确解时

Eğer $A$Evet .$m \times n$Ve$m > n$(eşitlikler çok bilinmiyor), sistem = aşırı belirlenmiş.

```
minimize ||Ax - b||^2

这是 squared residuals 的总和：
  sum((A[i,:] @ x - b[i])^2 for i in range(m))
```

Minimize 满足 normal denklemler:

```math
A^T A x = A^T b
```

推导:展开 $\lVert Ax - b \rVert^2 = (Ax - b)^T (Ax - b) = x^T A^T A x - 2 x^T A^T b + b^T b$- Evet.$x$求 Gradient,并令其为零:$2 A^T A x - 2 A^T b = 0$- Evet.

```
Original system (overdetermined, 4 equations, 2 unknowns):
| 1  1 |         | 3 |
| 1  2 | x     = | 5 |       没有精确的 x 能满足全部 4 个 equations。
| 1  3 |         | 6 |
| 1  4 |         | 8 |

Normal equations:
A^T A = | 4  10 |    A^T b = | 22 |
        | 10 30 |            | 63 |

Solve: x = [1.5, 1.7]

这就是 linear regression。x[0] 是 intercept，x[1] 是 slope。
```

### Normal denklemler = doğrusal gerileme

Bu tür bağlantılar çok net. Düzsel gerileme sırasında, veri matrisi.$X$Her satır bir örnekle karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı$y$Her giriş bir örnekle ilgili.$w$满足:

```math
\begin{aligned}
X^T X w &= X^T y \\
w &= (X^T X)^{-1} X^T y
\end{aligned}
```

Bu bir çizgi geri dönüşün kapalı biçimli çözümü.`sklearn.linear_model.LinearRegression.fit()`Şehir hesaplama sonucu (Yani QR veya SVD)

Matrix 添加 düzenleme terimi $\lambda I$, sen bir tepesi geri dönüşü elde:

```math
\begin{aligned}
(X^T X + \lambda I) w &= X^T y \\
w &= (X^T X + \lambda I)^{-1} X^T y
\end{aligned}
```

Düzenleme Matrix'in koşullandırılmasını daha iyi yapar, daha kolay doğruyu elde eder, ve ağırlıkları aşırı uyumlu olmaktan kaçınmak için sıfırdan küçülür.$\lambda > 0$Matrix.$X^T X + \lambda I$总是对称正确, bu yüzden Cholesky'yi kullanmak için çözüm bulabiliriz.

### Pseudoinverse (Moore-Penrose)

Pseudoinverse $A^+$Matrisin tersine dönüşümünü 推广到非正方和单数矩阵──对任意 Matrix $A$- ...

```math
\begin{aligned}
x &= A^+ b \\[4pt]
\text{其中 } A^+ &= V \Sigma^+ U^T \quad \text{（通过 SVD 计算）}
\end{aligned}
```

$\Sigma^+$通过对每非零单数值 取相互并转置结果构成──如果 $A = U \Sigma V^T$- Öyleyse .$A^+ = V \Sigma^+ U^T$- Evet.

```
A = U Sigma V^T        (SVD)

Sigma = | 5  0 |       Sigma+ = | 1/5  0  0 |
        | 0  2 |                | 0  1/2  0 |
        | 0  0 |

A+ = V Sigma+ U^T
```

Pseudoinverse                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
- 唯一解:$A^+ b$- Çözümünü söyle.
- Çözüm:$A^+ b$En az kare çözümü ver.
- 无穷多解:$A^+ b$- Ver .$\lVert x \rVert$En küçük çözüm.

NumPy'nin `np.linalg.lstsq`和 `np.linalg.pinv`İçeride hep SVD kullanıyorlar.

### Şart numarası

Şart numarası  Ölçüm çözümü girişlerin küçük değişikliklerine karşı çok hassasdır.$A$, koşul numarası:

```math
\kappa(A) = \lVert A \rVert \cdot \lVert A^{-1} \rVert = \frac{\sigma_{\max}}{\sigma_{\min}}
```

İçlerinden $\sigma_{\max}$和 $\sigma_{\min}$分别是最大和最小单数值──

```
Well-conditioned (kappa ~ 1):        Ill-conditioned (kappa ~ 10^15):
b 中的小变化 -->                    b 中的小变化 -->
x 中的小变化                         x 中的巨大变化

| 2  0 |   kappa = 2/1 = 2          | 1   1          |   kappa ~ 10^15
| 0  1 |   safe to solve            | 1   1+10^(-15) |   solution is garbage
```

经验法则:
- $\kappa < 100$Güven, çözüm 准确。
- $\kappa \approx 10^k$- Bu da bir şey . - Evet .$k$位精度──
- $\kappa \approx 10^{16}$(Float64): çözümü anlamsız.

ML'de, kötü koşullar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       $\lambda I$)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             $\sigma_{\max} / \sigma_{\min}$                                                                      $(\sigma_{\max} + \lambda) / (\sigma_{\min} + \lambda)$- Evet.

### İteratif yöntemler:konjugat gradiyenti

对于非常大的稀有系统 (数百万未知),LU 或 Cholesky gibi doğrudan yöntemler 成本过高――Iterative methods 会通过多次代改进一个猜想 来近似解决――

Konjugat gradiyenti (CG)$A$Simetrik pozitif kesin 时求解 $Ax = b$                                                                                                                                                                                                                                                              $n$Bir daha tam bir çözüm bulmaya çalışıyorum.$A$集合,通常会更快收──

```
Algorithm sketch:
  x0 = initial guess (often zero)
  r0 = b - A x0           (residual)
  p0 = r0                 (search direction)

  For k = 0, 1, 2, ...:
    alpha = (rk . rk) / (pk . A pk)
    x_{k+1} = xk + alpha * pk
    r_{k+1} = rk - alpha * A pk
    beta = (r_{k+1} . r_{k+1}) / (rk . rk)
    p_{k+1} = r_{k+1} + beta * pk
    if ||r_{k+1}|| < tolerance: stop
```

CG:
- Büyük ölçekli optimizasyon (Newton-CG yöntemi)
- 求解 PDE diskretleştirmeleri
- Kernel yöntemleri, bunlardan birinde kernel matrisi 太大无法因子
- 作为其他反复解决器的预定条件

Konverjense oranı  koşul sayısına bağlıdır──  daha iyi sistemlerin  收更快 收 收 收 快, bu da düzenlenmenin  yardımcı olan başka bir nedeni

### Tam resim:何時使用哪种方法

| Method | Requirements | Cost | Use case |
|--------|-------------|------|----------|
| Gaussian elimination | Square, nonsingular $A$ | $O(n^3)$ | 对 square system 的一次性求解 |
| LU decomposition | Square, nonsingular $A$ | $O(n^3)$ factor + $O(n^2)$ solve | 使用相同 $A$ 的多次求解 |
| QR decomposition | Any $A$ ($m \ge n$) | $O(mn^2)$ | Least squares，numerically stable |
| Cholesky | Symmetric positive definite $A$ | $O(n^3/3)$ | Covariance matrices，Gaussian processes，ridge regression |
| Normal equations | Overdetermined ($m > n$) | $O(mn^2 + n^3)$ | Linear regression（小 $n$） |
| SVD / pseudoinverse | Any $A$ | $O(mn^2)$ | Rank-deficient systems，minimum-norm solutions |
| Conjugate gradient | Symmetric positive definite, sparse $A$ | $O(n \cdot k \cdot \text{nnz})$ | Large sparse systems，$k$ = iterations |

### ML ile bağlantı

Bu dersten her türlü yöntem üretim sınıfı ML'de ortaya çıkar:

**Linear regression.**Kapalı biçim çözümü 求解 normal denklemler $X^T X w = X^T y$Cholesky'den geçebiliriz.$n$很小) 、QR( eğer sayısal istikrar 很重要) veya SVD( eğer Matrix muhtemelen sıra eksik)完成。

**Ridge regression.**- Evet .$X^T X$添加 $\lambda I$❖ Düzenlenmiş sistem $(X^T X + \lambda I) w = X^T y$- Cholesky'den geçebilirim.$\lambda > 0$时,$X^T X + \lambda I$Evet, simetrik pozitif kesin.

**Gaussian processes.**Tahmin ortalaması 需要求解 $K \alpha = y$, içinden $K$- Evet, çekirdek matrisi.$K$Yapmak Cholesky faktörleşmesi is standard method。Log sınırlı olasılığı 使用 $\log \det(K) = 2 \sum \log(\mathop{\mathrm{diag}}(L))$- Evet.

**Neural network initialization.**Ortogonal başlangıç, QR parçalanmasını kullanmak için ortonomal ağırlık matrisleri oluşturmak için kullanılır. Bu derin ağların içindeki sinyal çöküşünü önleyebilir.

**Preconditioning.**Büyük ölçekli optimizörler kullanın tamamlanmamış Cholesky veya tamamlanmamış LU 作为结合梯度溶剂的预条件──

**Feature engineering.** $X^T X$                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             $\kappa$很大,删除功能或添加规范化──


```figure
linear-system-conditioning
```

## Yapın onu.
### 步骤 1: Gaussian ortadan kaldırma kısmi dönümle

```python
import numpy as np

def gaussian_elimination(A, b):
    n = len(b)
    Ab = np.hstack([A.astype(float), b.reshape(-1, 1).astype(float)])

    for k in range(n):
        max_row = k + np.argmax(np.abs(Ab[k:, k]))
        Ab[[k, max_row]] = Ab[[max_row, k]]

        if abs(Ab[k, k]) < 1e-12:
            raise ValueError(f"Matrix is singular or nearly singular at pivot {k}")

        for i in range(k + 1, n):
            m = Ab[i, k] / Ab[k, k]
            Ab[i, k:] -= m * Ab[k, k:]

    x = np.zeros(n)
    for i in range(n - 1, -1, -1):
        x[i] = (Ab[i, -1] - Ab[i, i+1:n] @ x[i+1:n]) / Ab[i, i]

    return x
```

### 步骤 2: LU parçalanması

```python
def lu_decompose(A):
    n = A.shape[0]
    L = np.eye(n)
    U = A.astype(float).copy()
    P = np.eye(n)

    for k in range(n):
        max_row = k + np.argmax(np.abs(U[k:, k]))
        if max_row != k:
            U[[k, max_row]] = U[[max_row, k]]
            P[[k, max_row]] = P[[max_row, k]]
            if k > 0:
                L[[k, max_row], :k] = L[[max_row, k], :k]

        for i in range(k + 1, n):
            L[i, k] = U[i, k] / U[k, k]
            U[i, k:] -= L[i, k] * U[k, k:]

    return P, L, U

def lu_solve(P, L, U, b):
    n = len(b)
    Pb = P @ b.astype(float)

    y = np.zeros(n)
    for i in range(n):
        y[i] = Pb[i] - L[i, :i] @ y[:i]

    x = np.zeros(n)
    for i in range(n - 1, -1, -1):
        x[i] = (y[i] - U[i, i+1:] @ x[i+1:]) / U[i, i]

    return x
```

### 步骤 3: Cholesky parçalanması

```python
def cholesky(A):
    n = A.shape[0]
    L = np.zeros_like(A, dtype=float)

    for i in range(n):
        for j in range(i + 1):
            s = A[i, j] - L[i, :j] @ L[j, :j]
            if i == j:
                if s <= 0:
                    raise ValueError("Matrix is not positive definite")
                L[i, j] = np.sqrt(s)
            else:
                L[i, j] = s / L[j, j]

    return L
```

### 步骤 4: Normal denklemler üzerinden en az kare

```python
def least_squares_normal(A, b):
    AtA = A.T @ A
    Atb = A.T @ b
    return gaussian_elimination(AtA, Atb)

def ridge_regression(A, b, lam):
    n = A.shape[1]
    AtA = A.T @ A + lam * np.eye(n)
    Atb = A.T @ b
    L = cholesky(AtA)
    y = np.zeros(n)
    for i in range(n):
        y[i] = (Atb[i] - L[i, :i] @ y[:i]) / L[i, i]
    x = np.zeros(n)
    for i in range(n - 1, -1, -1):
        x[i] = (y[i] - L.T[i, i+1:] @ x[i+1:]) / L.T[i, i]
    return x
```

### 步骤 5: Şart numarası

```python
def condition_number(A):
    U, S, Vt = np.linalg.svd(A)
    return S[0] / S[-1]
```

## Kullan
Bu bölümleri bir araya getirerek gerçek veriler üzerinde doğrusal gerileme ve kıyıs gerileme yapılır:

```python
np.random.seed(42)
X_raw = np.random.randn(100, 3)
w_true = np.array([2.0, -1.0, 0.5])
y = X_raw @ w_true + np.random.randn(100) * 0.1

X = np.column_stack([np.ones(100), X_raw])

w_ols = least_squares_normal(X, y)
print(f"OLS weights (ours):    {w_ols}")

w_np = np.linalg.lstsq(X, y, rcond=None)[0]
print(f"OLS weights (numpy):   {w_np}")
print(f"Max difference: {np.max(np.abs(w_ols - w_np)):.2e}")

w_ridge = ridge_regression(X, y, lam=1.0)
print(f"Ridge weights (ours):  {w_ridge}")

from sklearn.linear_model import Ridge
ridge_sk = Ridge(alpha=1.0, fit_intercept=False)
ridge_sk.fit(X, y)
print(f"Ridge weights (sklearn): {ridge_sk.coef_}")
```

## - Söyle.
本课产 出:
- `code/linear_systems.py`, sıfırdan gerçekleşen Gaussian ortadan kaldırımı, LU parçalanması, Cholesky parçalanması, en az kare ve kıyılar geri dönüşü içerir
- Bir çalışılabilir gösterim, normal denklemleri göstermek ve bir çizgi gerileme  aynı ağırlık üretmek

## 练习
1. Gaussian eliminasyonunuzu kullanın LU çözücüünüzü kullanın.`np.linalg.solve`求解 sistem `[[1,2,3],[4,5,6],[7,8,10]] x = [6, 15, 27]`❖ Test3者在浮点宽容内给出相同答案──

2. 生成一个50x5 随机矩阵 X 和 目标 y = X @ w_true + noise──分别使用正常方程、QR(通过 `np.linalg.qr`)、SVD( geçişi`np.linalg.svd`) ve `np.linalg.lstsq`求解 w―比较四个解决方案―测量 $X^T X$Bu durumun nasıl etkilediğini açıklayın.

3. 通過讓兩列差不多來创建一個幾乎單一矩阵 (例如, sütun 2 = sütun 1 + 1e-10 * noise) ──計算它的条件數量──分別在有规律化和無规律化的情况下求解$Ax = b$(添加 $0.01 I$)― solüsyonları ve kalıntıları karşılaştırmak― neden düzenlenmesi gerektiğini açıklamak yardımcı olur―

4. 100x100 rastgele simetrik pozitif kesin matris için  birleşik gradient algoritması gerçekleştirmek 统计它收到容忍 1e-8 需要多少次的反复──与$n$İterasyonların teorik en büyük değeri karşılaştırılmalıdır.

5. 10,50,200,5500'lik simetrik pozitif kesin matrisler üzerinde, Cholesky çözücü için, LU çözücü için`np.linalg.solve`Çolesky'nin yaklaşık 2 kat daha fazla olduğunu görüyorum.

### 提示

**练习 1。**调用 `gaussian_elimination(A, b)`, yeniden kullanmak`lu_decompose(A)`Ve sonra da kullanmaya başladı.`lu_solve(P, L, U, b)`, son调用 `np.linalg.solve(A, b)`。 kullan `np.allclose(A @ x, b)`检查每个解,并用 `np.allclose`Bu üç çözümü karşılaştırın.

**练习 2。**Normal denklemlere`least_squares_normal`, üye kalan yöntemler üç NumPy işlevi kullanmak için kullanılır.`w_true` `condition_number(X.T @ X)`和 `condition_number(X)`: Önceki kişi sonuncunun kare, bu nedenle normal denklemler  kaybın doğruluğu en çok

**练习 3。**预期 koşul sayısı 会超過 $10^{9}$△分別使用`np.linalg.solve`和 `ridge_regression(A, b, 0.01)`求解,再比较各自的 `np.linalg.norm(x)`Ve kalan normı, iki kalanın çok küçük olması mümkündür, ancak düzenlenmeden çözülmesi genellikle büyük bir miktar içerir.

**练习 4。**Kullanım`B @ B.T + n * np.eye(n)`Simetrik pozitif kesin matris oluştur, her öz değerinin doğru olduğunu garanti eder.`conjugate_gradient`Bu daireye katılan hesaplayıcı, son kalan normunun 1e-8'den küçük olup olmadığını kontrol eder.

**练习 5。**Üç çeşit çözücü Aynı kullanın`B @ B.T + n * np.eye(n)`矩阵,并用 `time.perf_counter` ölçmek için her bir çözüm sorusu tüketimi, birçok çalışmanın en iyi sonuçlarını elde etmek. Cholesky'nin gerekli hesaplama çalışmaları LU'nun yaklaşık yarısıdır. Bu nedenle daha büyük bir matron boyutunda bu oran en belirgin olarak görülür.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Linear system | "Solve for x" | 一组 linear equations $Ax = b$。找到 $x$ 意味着找到在 transformation $A$ 下产生 output $b$ 的 input。 |
| Gaussian elimination | "Row reduce" | 使用 row operations 系统性地将 diagonal 下方的 entries 置零，产生可通过 back substitution 求解的 upper triangular system。$O(n^3)$。 |
| Partial pivoting | "Swap rows for stability" | 在 column $k$ 中进行 elimination 前，将该 column 中 absolute value 最大的行交换到 pivot 位置。防止除以很小的数。 |
| LU decomposition | "Factor into triangles" | 写成 $A = LU$，其中 $L$ 是 lower triangular（存储 multipliers），$U$ 是 upper triangular（eliminated matrix）。将 $O(n^3)$ 成本摊销到多次求解中。 |
| QR decomposition | "Orthogonal factorization" | 写成 $A = QR$，其中 $Q$ 的 columns 是 orthonormal，$R$ 是 upper triangular。对于 least squares，比 LU 更稳定。 |
| Cholesky decomposition | "Square root of a matrix" | 对 symmetric positive definite $A$，写成 $A = LL^T$。成本是 LU 的一半。用于 covariance matrices、kernel matrices 和 ridge regression。 |
| Least squares | "Best fit when exact is impossible" | 当 system overdetermined（equations 多于 unknowns）时，最小化 squared residuals 的总和 $\lVert Ax - b \rVert^2$。 |
| Normal equations | "The calculus shortcut" | $A^T A x = A^T b$。将 $\lVert Ax - b \rVert^2$ 的 Gradient 设为零。这就是 linear regression 的 closed-form solution。 |
| Pseudoinverse | "Inversion for non-square matrices" | $A^+ = V \Sigma^+ U^T$ via SVD。对于任意 Matrix，无论 square 或 rectangular、singular 与否，给出 minimum-norm least-squares solution。 |
| Condition number | "How trustworthy is this answer" | $\kappa = \sigma_{\max} / \sigma_{\min}$。衡量对 input perturbations 的敏感性。大约损失 $\log_{10}(\kappa)$ 位精度。 |
| Ridge regression | "Regularized least squares" | 求解 $(X^T X + \lambda I) w = X^T y$。添加 $\lambda I$ 改善 conditioning，并将 weights 向零收缩。防止 overfitting。 |
| Conjugate gradient | "Iterative Ax=b for big matrices" | 用于 symmetric positive definite systems 的 iterative solver。最多 $n$ 步收敛。适合 factorization 成本过高的大型 sparse systems。 |
| Overdetermined system | "More data than parameters" | 在 $m\text{-by-}n$ system 中 $m > n$。不存在精确解。Least squares 找到最佳近似。这就是每个 regression problem。 |
| Back substitution | "Solve from the bottom up" | 给定 upper triangular system，先求解最后一个 equation，然后向后 substitute。$O(n^2)$。 |
| Forward substitution | "Solve from the top down" | 给定 lower triangular system，先求解第一个 equation，然后向前 substitute。$O(n^2)$。用于 LU solves 中的 L step。 |

## 延伸阅读
- [MIT 18.06: Linear Algebra](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/)(Gilbert Strang) --                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
- [Numerical Linear Algebra](https://people.maths.ox.ac.uk/trefethen/text.html)(Trefethen & Bau) -- Sayısal istikrarı, koşullama ve algoritmaları anlamaya neden başarısız olduğunu anlamak standart referans
- [Matrix Computations](https://www.cs.cornell.edu/cv/GolubVanLoan4/golubandvanloan.htm)(Golub & Van Loan) -- 涵盖各种矩阵算法 的百科式参考
- [3Blue1Brown: Inverse Matrices](https://www.3blue1brown.com/lessons/inverse-matrices)- Çözüm için$Ax = b$几何意义的可视化直觉 (görülebilirlik)
