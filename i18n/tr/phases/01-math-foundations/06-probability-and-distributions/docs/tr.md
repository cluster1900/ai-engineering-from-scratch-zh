# 概率 ve dağılım

> 概率, belirsizlik dile getirmek için kullanılan bir AI'dir.

**Type:** 学习
**Language:**Python
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~75 分钟

## Öğrenme hedefi

- Bernoulli'nin kategorik Poisson'un tek tipte ve normal dağılımlarının PMF ve PDF'lerini gerçekleştirmek
- 計算予想値、変数,并使用中央限界定理 解释为什么高西য়ান 如此常见
- kullanmak için en büyük logit düşürmek için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullan
- Logits  hesaplama çapraz entropy kaybı,并将其与负 log-概率 联系起来

## 问题

Bir sınıflandırıcı 输出 `[0.03, 0.91, 0.06]`◊ bir dil modeli ◊ 50,000 个候选词中选择下一个词── bir yayılma modeli ◊ öğrenilene kadar dağılımlar yoluyla ◊ 中采样生成图像── bunlar olasılıkların ◊发挥作用──

Model yapılan her tahmin bir olasılık dağılımıdır. Her Kayıp fonksiyonu, tahmin dağılımıyla gerçek dağılım arasındaki mesafeyi ölçer. Her eğitim adımında, bir dağılımın diğer dağılım gibi görünmesini sağlayan parametreleri düzenler.

## 概念

### Olaylar √ Örnek Alanları ve olasılıklar

örnek alanı $S$Evet, tüm olası sonuçların toplamı, olaylar örnek alanının bir parçasıdır.

```
Coin flip:
  S = {H, T}
  P(H) = 0.5,  P(T) = 0.5

Single die roll:
  S = {1, 2, 3, 4, 5, 6}
  P(even) = P({2, 4, 6}) = 3/6 = 0.5
```

Üç genel kurum, genel oran sistemini tanımlıyor:
1. Herhangi bir olay için .$A$- Evet .$P(A) \ge 0$
2. $P(S) = 1$(Her zaman bir şey olacak)
3. - Evet .$A$和 $B$Aynı anda gerçekleşemez.$P(A \text{ or } B) = P(A) + P(B)$

Bayes teoresi, beklentileri, dağıtımları bu üç kuraldan çıkarılabilir.

### Şartlı Muhtemelenlik ve Bağımsızlık

$P(A \mid B)$Gösterme $B$已发生的条件下 $A$发生的概率――

```
P(A|B) = P(A and B) / P(B)

Example: deck of cards
  P(King | Face card) = P(King and Face card) / P(Face card)
                      = (4/52) / (12/52)
                      = 4/12 = 1/3
```

Bir olayın diğer olayla ilgili herhangi bir bilgi artmasıyla ilgili olarak, bu iki olay bağımsızdır:

```math
\begin{aligned}
\text{相互独立：} \quad & P(A \mid B) = P(A) \\
\text{等价于：} \quad & P(A \text{ and } B) = P(A) \cdot P(B)
\end{aligned}
```

抛硬币是独立的──不放回抽牌则不是──

### Muhtemelen Masa Fonksiyonları ve Muhtemelen Sıklık Fonksiyonları

离散随机变量 有概率质函数 (PMF) ──每个结果都有一个可以直接读取的具体概率──

```
PMF: P(X = k)

Fair die:
  P(X = 1) = 1/6
  P(X = 2) = 1/6
  ...
  P(X = 6) = 1/6

  Sum of all probabilities = 1
```

连续随机变量 有概率密度函数 (PDF) ⋅单个点处的密度 不是概率──概率来自某区间上的密度 进行积分──

```
PDF: f(x)

P(a <= X <= b) = integral of f(x) from a to b

f(x) can be greater than 1 (density, not probability)
integral from -inf to +inf of f(x) dx = 1
```

Bu fark ML'de çok önemlidir.

### 常见 Yayınlamalar

**Bernoulli：**Bir deney, iki sonuç.

```math
\begin{aligned}
P(X = 1) &= p \\
P(X = 0) &= 1 - p \\
\text{均值} = p, &\quad \text{方差} = p(1-p)
\end{aligned}
```

**Categorical：**Bir deney,$k$个 sonuçlar。用于建模多类分类化(softmax 输出)。

```math
\begin{aligned}
& P(X = i) = p_i, \quad \text{其中 } \textstyle\sum_i p_i = 1 \\
& \text{示例：} P(\text{cat}) = 0.7, \quad P(\text{dog}) = 0.2, \quad P(\text{bird}) = 0.1
\end{aligned}
```

**Uniform：**Tüm sonuçlar 等概率── kullanılır随机初始化──

```math
\begin{aligned}
\text{离散：} \quad & P(X = k) = 1/n \text{ for } k \in \lbrace 1, \ldots, n \rbrace \\
\text{连续：} \quad & f(x) = 1/(b-a) \text{ for } x \in [a, b]
\end{aligned}
```

**Normal（Gaussian）：**钟形曲线──由 means($\mu$) ve farklılık$\sigma^2$) parametreleştirme

```
f(x) = (1 / sqrt(2*pi*sigma^2)) * exp(-(x - mu)^2 / (2*sigma^2))

Standard normal: mu = 0, sigma = 1
  68% of data within 1 sigma
  95% within 2 sigma
  99.7% within 3 sigma
```

**Poisson：**固定区间内罕见事件の計り── inşaat için kullanılan olayların gerçekleşme oranı──

```math
\begin{aligned}
P(X = k) &= \frac{\lambda^k e^{-\lambda}}{k!} \\
\text{均值} = \lambda, &\quad \text{方差} = \lambda
\end{aligned}
```

### Beklenen Değer ve Değişiklik

Beklenen değer, sonuçların artış oranıdır.

```math
\begin{aligned}
\text{离散：} \quad & \mathbb{E}[X] = \sum_i x_i \, P(X = x_i) \\
\text{连续：} \quad & \mathbb{E}[X] = \int x \, f(x) \, dx
\end{aligned}
```

Varians  ortalama etrafında ölçmek                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

```math
\begin{aligned}
\mathrm{Var}(X) &= \mathbb{E}[(X - \mathbb{E}[X])^2] = \mathbb{E}[X^2] - (\mathbb{E}[X])^2 \\
\text{标准差} &= \sqrt{\mathrm{Var}(X)}
\end{aligned}
```

ML'de, beklenen değer Kayıp fonksiyonu şeklinde ortaya çıkar.

### Ortak ve Marjinal dağıtımlar

ortak dağıtım $P(X, Y)$Aynı zamanda iki rastgele değişken anlatın.

Ortak PMF göstergesi$X$= hava durumu,$Y$= şemsiye):

| | $Y=0$（不带伞） | $Y=1$（带伞） | Marginal $P(X)$ |
|---|---|---|---|
| $X=0$（晴天） | 0.40 | 0.10 | $P(X=0) = 0.50$ |
| $X=1$（下雨） | 0.05 | 0.45 | $P(X=1) = 0.50$ |
| **Marginal $P(Y)$** | $P(Y=0) = 0.45$ | $P(Y=1) = 0.55$ | 1.00 |

Sınırsal dağılım başka bir değişim arıyor ve yok ediyor:

```math
P(X = x) = \sum_{y} P(X = x, Y = y)
```

Yukarıdaki listeler ve listeler sınırlıdır.

### Normal dağıtım neden ortaya çıktı ?

Merkez Sınır Teoremi: Birçok bağımsız rastgele değişkenlerin 

```
Roll 1 die:  uniform distribution (flat)
Average of 2 dice:  triangular (peaked)
Average of 30 dice: nearly perfect bell curve

This works for ANY starting distribution.
```

İşte bu yüzden:
- 测量差近似 conform from normal distribution (normal dağılımdan çok küçük bağımsız kaynak)
- Nöral Ağın normal dağılımları kullanma hakkı
- SGD 中的渐变噪音近似服从正常分布(许多样本梯梯的和)
- Verilmiş ortalama ve varyasyon koşullarında, normal dağılım en büyük dağılımdır.

### Kayıt olasılıkları

İlk olasılık sayısal değer sorunu doğuracaktır. Çok küçük olasılıklar hızla sıfırdan sıfırına katlanacak.

```math
\begin{aligned}
P(\text{sentence}) &= P(\text{word}_1) \cdot P(\text{word}_2) \cdot \ldots \cdot P(\text{word}_n) \\
&= 0.01 \cdot 0.003 \cdot 0.02 \cdot \ldots \\
&\to 0.0 \quad \text{（在约 } \sim 30 \text{ 项后下溢）}
\end{aligned}
```

Log olasılıkları bu sorunu çözebilir.

```math
\begin{aligned}
\log P(\text{sentence}) &= \log P(\text{word}_1) + \log P(\text{word}_2) + \ldots + \log P(\text{word}_n) \\
&= -4.6 + -5.8 + -3.9 + \ldots \\
&\to \text{有限数值（不会下溢）}
\end{aligned}
```

规则:
- $\log(a \cdot b) = \log(a) + \log(b)$
- log olasılığı 总是 $\le 0$(Çünkü)$0 < P \le 1$)
- 越负 = 越不可能
- Çarpıcı entropik kaybı = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

### Softmax  olarak olasılık dağıtım

Nöral Ağ 输出原始分数(logits) ――Softmax onları geçerli olasılık dağılımına dönüştürecek──

```
softmax(z_i) = exp(z_i) / sum(exp(z_j) for all j)

Properties:
  - All outputs are in (0, 1)
  - All outputs sum to 1
  - Preserves relative ordering of inputs
  - exp() amplifies differences between logits
```

softmax 技巧:                                                                                                                                                                                                                                                            

```
z = [100, 101, 102]
exp(102) = overflow

z_shifted = z - max(z) = [-2, -1, 0]
exp(0) = 1  (safe)

Same result, no overflow.
```

Log-softmax, sayısal sabitlik elde etmek için softmax ve log'u birleştirir. PyTorch, içtenlikle çapraz entropi kaybını hesaplamak için kullanır.

### Örnekleme

Örnekleme bir dağılımdan çekim değerini elde eder. ML'de:
- Neuronu bırakırken ne olur ne olur .
- Veri artırma 会采样随机变化
- Dil modelleri 会从预测分布中采样下一个 Tıkın
- Diffüzyon modelleri 会采样噪音并逐步指明

Bu yöntemler, örneğin, örneği geri dönüştürmek, reddetmek veya yeniden ölçümleme yöntemini kullanmak için kullanılır.


```figure
gaussian-pdf
```

## Yapın onu.

### 步骤 1:概率基础

```python
import math
import random

def factorial(n):
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result

def combinations(n, k):
    return factorial(n) // (factorial(k) * factorial(n - k))

def conditional_probability(p_a_and_b, p_b):
    return p_a_and_b / p_b

p_king_given_face = conditional_probability(4/52, 12/52)
print(f"P(King | Face card) = {p_king_given_face:.4f}")
```

### 步骤 2: PMF 和 PDF'yi sıfırdan gerçekleştirmek

```python
def bernoulli_pmf(k, p):
    return p if k == 1 else (1 - p)

def categorical_pmf(k, probs):
    return probs[k]

def poisson_pmf(k, lam):
    return (lam ** k) * math.exp(-lam) / factorial(k)

def uniform_pdf(x, a, b):
    if a <= x <= b:
        return 1.0 / (b - a)
    return 0.0

def normal_pdf(x, mu, sigma):
    coeff = 1.0 / (sigma * math.sqrt(2 * math.pi))
    exponent = -0.5 * ((x - mu) / sigma) ** 2
    return coeff * math.exp(exponent)
```

### 步骤 3: Beklenen değer ve değişim

```python
def expected_value(values, probabilities):
    return sum(v * p for v, p in zip(values, probabilities))

def variance(values, probabilities):
    mu = expected_value(values, probabilities)
    return sum(p * (v - mu) ** 2 for v, p in zip(values, probabilities))

die_values = [1, 2, 3, 4, 5, 6]
die_probs = [1/6] * 6
mu = expected_value(die_values, die_probs)
var = variance(die_values, die_probs)
print(f"Die: E[X] = {mu:.4f}, Var(X) = {var:.4f}, SD = {var**0.5:.4f}")
```

### 步骤 4: dağıtımlardan 中采样

```python
def sample_bernoulli(p, n=1):
    return [1 if random.random() < p else 0 for _ in range(n)]

def sample_categorical(probs, n=1):
    cumulative = []
    total = 0
    for p in probs:
        total += p
        cumulative.append(total)
    samples = []
    for _ in range(n):
        r = random.random()
        for i, c in enumerate(cumulative):
            if r <= c:
                samples.append(i)
                break
    return samples

def sample_normal_box_muller(mu, sigma, n=1):
    samples = []
    for _ in range(n):
        u1 = random.random()
        u2 = random.random()
        z = math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)
        samples.append(mu + sigma * z)
    return samples
```

### 步骤 5: Softmax ve log olasılığı

```python
def softmax(logits):
    max_logit = max(logits)
    shifted = [z - max_logit for z in logits]
    exps = [math.exp(z) for z in shifted]
    total = sum(exps)
    return [e / total for e in exps]

def log_softmax(logits):
    max_logit = max(logits)
    shifted = [z - max_logit for z in logits]
    log_sum_exp = max_logit + math.log(sum(math.exp(z) for z in shifted))
    return [z - log_sum_exp for z in logits]

def cross_entropy_loss(logits, target_index):
    log_probs = log_softmax(logits)
    return -log_probs[target_index]
```

### 步骤 6: Merkez Sınır Teoremi 演示

```python
def demonstrate_clt(dist_fn, n_samples, n_averages):
    averages = []
    for _ in range(n_averages):
        samples = [dist_fn() for _ in range(n_samples)]
        averages.append(sum(samples) / len(samples))
    return averages
```

### Adım 7: Görünüm

```python
import matplotlib.pyplot as plt

xs = [mu + sigma * (i - 500) / 100 for i in range(1001)]
ys = [normal_pdf(x, mu, sigma) for x, mu, sigma in ...]
plt.plot(xs, ys)
```

Tüm görülebilirliklerin tam gerçekleşmesi mevcuttur.`code/probability.py`- Evet.

## Kullan

NumPy ve SciPy kullanın, yukarıdaki içeriği bir şekilde tamamlayabilirsiniz:

```python
import numpy as np
from scipy import stats

normal = stats.norm(loc=0, scale=1)
samples = normal.rvs(size=10000)
print(f"Mean: {np.mean(samples):.4f}, Std: {np.std(samples):.4f}")
print(f"P(X < 1.96) = {normal.cdf(1.96):.4f}")

logits = np.array([2.0, 1.0, 0.1])
from scipy.special import softmax, log_softmax
probs = softmax(logits)
log_probs = log_softmax(logits)
print(f"Softmax: {probs}")
print(f"Log-softmax: {log_probs}")
```

Bu içeriği tamamen oluşturdun. Şimdi bilirsin kitaplık ne yapıyor.

## 练习

1. Eksponansiyel dağılım için ters dönüşüm örneğini gerçekleştirmek için, 10.000 değerli örnekler alınarak, histogram gerçek PDF'ye karşı test edilecek.

2. İki öne çıkan parçacık ortak bir dağılım oluşturur.

3. 计算一个5级分类器的交叉热损失:它输出 logits `[2.0, 0.5, -1.0, 3.0, 0.1]`, doğru sınıfı indeksi 3... sonra PyTorch'i kullanın.`nn.CrossEntropyLoss`Cevabını doğrulamak için.

4. Bir işlevi yazın, bir dizi log olasılığını alın, en olası sıralara geri dönün, toplam log olasılığı, aynı zamanda fiyatın orijinal olasılığı.

### 提示

**练习 1。**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `u`, geri dön .$-\ln(1 - u) / \lambda$◊ Kontrol sample average value yakın mı$1/\lambda$, doğrudan her bölgeye uygun olup olmadığını$\lambda e^{-\lambda x}$- Evet.

**练习 2。**6x6 şeklini doldurun, her birim bir olasılık, tüm şekillerin 1'e kadar, sonra da kullanın.`joint_to_marginals`。 kullan `check_independence`Sadece her bir şey iki kenar olasılıklarının çarpımasıyla eşit olur, iki kenar birbirinden bağımsızdır.

**练习 3。**Logit  uygulaması `softmax`, yeniden indeks 3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          $-\ln$◊ sonuç 0.421'e yakın olmalıdır.`nn.CrossEntropyLoss`Aynı grup logitler ve hedef  verilen sonuçlar uyumlu olarak.

**练习 4。**Sayı olasılığını artırmak için, orijinal olasılığı çarpma.$50 \ln(0.01) \approx -230.26$,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             $10^{-100}$- Evet.

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|----------------------|
| Sample space | “所有可能性” | 实验中每个可能 outcome 构成的集合 $S$ |
| PMF | “概率函数” | 给出每个离散 outcome 精确概率的函数，所有概率之和为 1 |
| PDF | “概率曲线” | 用于连续变量的 density function。对某个区间积分即可得到概率 |
| Conditional probability | “给定某事的概率” | $P(A \mid B) = P(A \text{ and } B) / P(B)$。Bayesian thinking 和 Bayes' theorem 的基础 |
| Independence | “它们互不影响” | $P(A \text{ and } B) = P(A) \cdot P(B)$。知道一个 event 对另一个没有任何信息增益 |
| Expected value | “平均值” | 所有 outcomes 的概率加权和。Loss function 就是一个 expected value |
| Variance | “分散程度” | 相对 mean 的 squared deviation 的期望。High variance = 噪声大、不稳定的估计 |
| Normal distribution | “钟形曲线” | $f(x) = (1/\sqrt{2\pi\sigma^2}) \cdot \exp(-(x-\mu)^2/(2\sigma^2))$。由于 CLT 而无处不在 |
| Central Limit Theorem | “平均值会变成 normal” | 无论来源如何，许多 independent samples 的 mean 都会收敛到 normal distribution |
| Joint distribution | “两个变量放在一起” | $P(X, Y)$ 描述 $X$ 和 $Y$ outcomes 每一种组合的概率 |
| Marginal distribution | “把另一个变量求和消去” | $P(X) = \sum_y P(X, Y)$。从 joint 中恢复单个变量的 distribution |
| Log probability | “概率的 log” | $\log P(x)$。把乘积变成求和，避免长序列中的数值下溢 |
| Softmax | “把分数变成概率” | $\text{softmax}(z_i) = \exp(z_i) / \sum_j \exp(z_j)$。将实值 logits 映射为有效的 probability distribution |
| Cross-entropy | “Loss function” | $-\sum p_{\text{true}} \cdot \log(p_{\text{predicted}})$。衡量两个 distributions 有多不同。越低越好 |
| Logits | “模型原始输出” | softmax 之前的未归一化分数。命名来自 logistic function |
| Sampling | “抽取随机值” | 按照 probability distribution 生成值。模型生成输出的方式 |

## 延伸阅读

- [3Blue1Brown: But what is the Central Limit Theorem?](https://www.youtube.com/watch?v=zeJD6dqJ5lo)- Ortalama değerlerin neden normal hale geldiği hakkında görülebilir kanıt
- [Stanford CS229 Probability Review](https://cs229.stanford.edu/section/cs229-prob.pdf)- 覆盖本文及更多内容精炼参考
- [The Log-Sum-Exp Trick](https://gregorygundersen.com/blog/2020/02/09/log-sum-exp/)- Neden sayısal sabitlik önemlidir ve nasıl gerçekleştirilir?
