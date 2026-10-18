# 概率 एवं वितरण

> 概率 है अस्थिरता की भाषा व्यक्त करने के लिए AI का उपयोग किया गया है।

**Type:** 学习
**Language:**पायथन
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~75 分钟

## 学习目标

- शून्य से प्राप्त करने के लिए Bernoulli 、श्रेणी 、Poisson 、 समान तथा सामान्य वितरण के PMF और PDF
-  गणना अपेक्षित मूल्य、परिवर्तन,并 उपयोग केंद्रीय सीमा प्रमेय  व्याख्या क्यों Gaussian 如此常见
- प्रयोग संख्यात्मक मूल्य स्थिर करने की तकनीक( घटाएँ अधिकतम लॉजिट) निर्माण softmax 和 लॉग-softmax  फ़ंक्शन
- Logits से  गणना क्रॉस-एंट्रोपी हानि,并将其与负 log-संभावना 联系起来

## 问题

एक वर्गीकरण 输出 `[0.03, 0.91, 0.06]`◊ एक भाषा मॉडल ◊ 50,000 个候选词中选择下一个词── एक विसारण मॉडल ◊ एक भाषा मॉडल ◊ एक भाषा मॉडल से सीखकर छवियां उत्पन्न करना ◊ ये सभी संभावनाएं हैं ◊

模型 द्वारा किए जाने वाले प्रत्येक पूर्वानुमान एक संभावना वितरण हैं। प्रत्येक हानि फ़ंक्शन पूर्वानुमान वितरण और वास्तविक वितरण के बीच की दूरी को मापता है। प्रत्येक प्रशिक्षण चरण में सभी तत्वों को समायोजित किया जाता है, एक वितरण को दूसरे वितरण की तरह दिखने दें। कोई संभावना नहीं है, आप किसी भी एमएल पेपर को नहीं पढ़ सकते हैं, किसी भी मॉडल को डिबग नहीं कर सकते हैं, न ही यह समझ सकते हैं कि प्रशिक्षण हानि क्यों NaN में बदल जाएगी।

## 概念

### घटनाएँ √नमूना स्थान और संभावना

नमूना स्थान $S$सभी संभव परिणामों का संग्रह। घटना नमूना स्थान का एक अंश है। घटनाओं को 0 से 1 के बीच में प्रदर्शित करने की संभावना है।

```
Coin flip:
  S = {H, T}
  P(H) = 0.5,  P(T) = 0.5

Single die roll:
  S = {1, 2, 3, 4, 5, 6}
  P(even) = P({2, 4, 6}) = 3/6 = 0.5
```

तीनों सूत्रों ने समग्र अनुमान प्रणाली को परिभाषित किया हैः
1. किसी भी घटना के लिए$A$,$P(A) \ge 0$
2. $P(S) = 1$(सदा कुछ होता है)
3. $A$和 $B$जब यह एक साथ नहीं हो सकता है,$P(A \text{ or } B) = P(A) + P(B)$

其他所有内容(बेय का प्रमेय, अपेक्षाएँ, वितरण) इस तीनों नियमों से प्रवृत्त हो सकते हैं

### सशर्त संभावना और स्वतंत्रता

$P(A \mid B)$ में प्रदर्शित$B$जिसका हुआ है उसके अंतर्गत $A$发生 होने की संभावना 

```
P(A|B) = P(A and B) / P(B)

Example: deck of cards
  P(King | Face card) = P(King and Face card) / P(Face card)
                      = (4/52) / (12/52)
                      = 4/12 = 1/3
```

जब एक घटना को दूसरे घटना के बारे में कोई जानकारी नहीं है, तो ये दोनों घटनाएँ स्वतंत्र हैंः

```math
\begin{aligned}
\text{相互独立：} \quad & P(A \mid B) = P(A) \\
\text{等价于：} \quad & P(A \text{ and } B) = P(A) \cdot P(B)
\end{aligned}
```

抛硬币是独立的──不放回抽牌则不是──

### संभावना द्रव्यमान कार्य और संभावना घनत्व कार्य

离散随机变量有概率质量函数 (PMF)  प्रत्येक परिणाम में एक विशिष्ट संभावना होती है जिसे सीधे पढ़ा जा सकता है

```
PMF: P(X = k)

Fair die:
  P(X = 1) = 1/6
  P(X = 2) = 1/6
  ...
  P(X = 6) = 1/6

  Sum of all probabilities = 1
```

连续随机变量 有概率密度函数 (PDF) ⋅ एकल बिंदुओं की घनत्व 不是概率 ⋅概率来自某区间上的密度 进行积分 ⋅

```
PDF: f(x)

P(a <= X <= b) = integral of f(x) from a to b

f(x) can be greater than 1 (density, not probability)
integral from -inf to +inf of f(x) dx = 1
```

यह अंतर ML में बहुत महत्वपूर्ण है।

### 常见 वितरण

**Bernoulli：**एक बार प्रयोग, दो परिणामों हेतु प्रयोग किया जाता है।

```math
\begin{aligned}
P(X = 1) &= p \\
P(X = 0) &= 1 - p \\
\text{均值} = p, &\quad \text{方差} = p(1-p)
\end{aligned}
```

**Categorical：**एक बार प्रयोग,$k$个 परिणाम──用于建模 बहु-वर्ग वर्गीकरण(softmax 输出)──

```math
\begin{aligned}
& P(X = i) = p_i, \quad \text{其中 } \textstyle\sum_i p_i = 1 \\
& \text{示例：} P(\text{cat}) = 0.7, \quad P(\text{dog}) = 0.2, \quad P(\text{bird}) = 0.1
\end{aligned}
```

**Uniform：**सभी परिणाम 等概率── उपयोग में आने वाले समय में प्रारंभ करना──

```math
\begin{aligned}
\text{离散：} \quad & P(X = k) = 1/n \text{ for } k \in \lbrace 1, \ldots, n \rbrace \\
\text{连续：} \quad & f(x) = 1/(b-a) \text{ for } x \in [a, b]
\end{aligned}
```

**Normal（Gaussian）：**钟形曲线──由 मतलब$\mu$) तथा भिन्नता$\sigma^2$) पैरामीटरकरण

```
f(x) = (1 / sqrt(2*pi*sigma^2)) * exp(-(x - mu)^2 / (2*sigma^2))

Standard normal: mu = 0, sigma = 1
  68% of data within 1 sigma
  95% within 2 sigma
  99.7% within 3 sigma
```

**Poisson：**固定区间内罕见事件的计数── निर्माण में उपयोग की जाने वाली घटनाओं की घटना दर──

```math
\begin{aligned}
P(X = k) &= \frac{\lambda^k e^{-\lambda}}{k!} \\
\text{均值} = \lambda, &\quad \text{方差} = \lambda
\end{aligned}
```

### अपेक्षित मूल्य और भिन्नता

अपेक्षित मूल्य परिणाम का अतिरिक्त मूल्य औसत है।

```math
\begin{aligned}
\text{离散：} \quad & \mathbb{E}[X] = \sum_i x_i \, P(X = x_i) \\
\text{连续：} \quad & \mathbb{E}[X] = \int x \, f(x) \, dx
\end{aligned}
```

भिन्नता  औसत के आसपास के विखंडन की डिग्री को मापने हेतु

```math
\begin{aligned}
\mathrm{Var}(X) &= \mathbb{E}[(X - \mathbb{E}[X])^2] = \mathbb{E}[X^2] - (\mathbb{E}[X])^2 \\
\text{标准差} &= \sqrt{\mathrm{Var}(X)}
\end{aligned}
```

एमएल में, अपेक्षित मूल्य हानि फ़ंक्शन के रूप में प्रकट होता है।

### संयुक्त और मार्जिनल वितरण

संयुक्त वितरण $P(X, Y)$साथ ही दो यादृच्छिक चरों का वर्णन करें।

संयुक्त पीएमएफ प्रदर्शन$X$= मौसम,$Y$= छाता):

| | $Y=0$（不带伞） | $Y=1$（带伞） | Marginal $P(X)$ |
|---|---|---|---|
| $X=0$（晴天） | 0.40 | 0.10 | $P(X=0) = 0.50$ |
| $X=1$（下雨） | 0.05 | 0.45 | $P(X=1) = 0.50$ |
| **Marginal $P(Y)$** | $P(Y=0) = 0.45$ | $P(Y=1) = 0.55$ | 1.00 |

मार्जिनल वितरण एक और चर को खोज और समाप्त करेगाः

```math
P(X = x) = \sum_{y} P(X = x, Y = y)
```

उपरोक्त सूची में क्रमबद्ध और क्रमबद्ध हैं।

### क्यों सामान्य वितरण के लिए वहाँ दिखाई दिया

केंद्रीय सीमा प्रमेय: कई स्वतंत्र यादृच्छिक चर का र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र र

```
Roll 1 die:  uniform distribution (flat)
Average of 2 dice:  triangular (peaked)
Average of 30 dice: nearly perfect bell curve

This works for ANY starting distribution.
```

यही कारण है किः
- 测量误差近似 सामान्य वितरण से अनुपालन (बहुत से स्वतंत्र स्रोत)
- सामान्य वितरण का उपयोग करके तंत्रिका नेटवर्क का अधिकार
- SGD मध्य के ग्रेडिएंट शोर लगभग सामान्य वितरण से अनुपालन ((बहुत सारे नमूना ग्रेडिएंट के साथ)
- एक निर्धारित औसत और भिन्नता के संदर्भ में, सामान्य वितरण अधिकतम है

### लॉग संभावनाएं

मूल संभावनाएँ संख्यात्मक प्रश्न उत्पन्न करती हैं।

```math
\begin{aligned}
P(\text{sentence}) &= P(\text{word}_1) \cdot P(\text{word}_2) \cdot \ldots \cdot P(\text{word}_n) \\
&= 0.01 \cdot 0.003 \cdot 0.02 \cdot \ldots \\
&\to 0.0 \quad \text{（在约 } \sim 30 \text{ 项后下溢）}
\end{aligned}
```

लॉग संभावनाएं इस समस्या को हल कर सकती हैं

```math
\begin{aligned}
\log P(\text{sentence}) &= \log P(\text{word}_1) + \log P(\text{word}_2) + \ldots + \log P(\text{word}_n) \\
&= -4.6 + -5.8 + -3.9 + \ldots \\
&\to \text{有限数值（不会下溢）}
\end{aligned}
```

规则:
- $\log(a \cdot b) = \log(a) + \log(b)$
- लॉग संभावना 总是 $\le 0$(कारण $0 < P \le 1$)
- 越负 = 越不可能
- क्रॉस-एंट्रोपी हानि सही वर्ग की नकारात्मक लॉग संभावना है

### Softmax  के रूप में संभावना वितरण

न्यूरल नेटवर्क 输出原始分数(लॉगिट) ―― सॉफ्टमैक्स इन्हें प्रभावी संभावना वितरण में परिवर्तित करेगा―

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

लॉग-सॉफ्टमैक्स को सॉफ्टमैक्स तथा लॉग  संयोजन करके संख्यात्मक स्थिरता प्राप्त करने के लिए उपयोग किया जाएगा।

### नमूनाकरण

नमूनाकरण इंगित करता है एक वितरण से क्रमशः मूल्य निकालना।
- छोड़ना होगा किसी भी न्यूरॉन्स को लेने के लिए
- डेटा वृद्धि 会采样随机变化
- भाषा मॉडल 会从预测分布中采样下一个 टोकन
- विसारण मॉडल 会采样噪音并逐步 dénoise

मध्य采样需要逆转转样本采样、拒绝样本采样或重设法化技巧 (VAE के लिए) आदि तकनीक──


```figure
gaussian-pdf
```

##  इसे निर्माण

### 步骤 1:概率 आधार

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

### 步骤 2: शून्य से पीएमएफ एवं पीडीएफ को लागू करना

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

### 步骤 3: अपेक्षित मूल्य और भिन्नता

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

### 步骤 4: वितरण से 中采样

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

### 步骤 5: सॉफ्टमैक्स और लॉग संभावनाएं

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

### 步骤 6: केंद्रीय सीमा प्रमेय 演示

```python
def demonstrate_clt(dist_fn, n_samples, n_averages):
    averages = []
    for _ in range(n_averages):
        samples = [dist_fn() for _ in range(n_samples)]
        averages.append(sum(samples) / len(samples))
    return averages
```

### 步骤 7: दृश्यता

```python
import matplotlib.pyplot as plt

xs = [mu + sigma * (i - 500) / 100 for i in range(1001)]
ys = [normal_pdf(x, mu, sigma) for x, mu, sigma in ...]
plt.plot(xs, ys)
```

् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ्`code/probability.py`

## इसका उपयोग करें

NumPy और SciPy का उपयोग करके, उपरोक्त सामग्री को एक पंक्ति में पूरा किया जा सकता हैः

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

आप इन सभी सामग्री को शून्य से बना चुके हैं। अब आप जानते हैं कि पुस्तकालय क्या करने के लिए उपयोग किया जाता है।

## अभ्यास

1. एक्सपोनेंशियल वितरण के लिए, रिवर्स ट्रांसफॉर्मेशन सैंपलिंग को प्राप्त करना है।

2.                                                                                                                                                                                                                                                               

3. 计算一个5 वर्ग वर्गीकरण का क्रॉस-एंट्रोपी हानि:它输出logits `[2.0, 0.5, -1.0, 3.0, 0.1]`, सही वर्ग का सूचकांक 3 है. फिर PyTorch का उपयोग करें.`nn.CrossEntropyLoss`验证你的答案──

4.  एक फ़ंक्शन लिखें, लॉग संभावनाओं का एक समूह प्राप्त करें, सबसे संभव क्रम को वापस करें, कुल लॉग संभावना, और समान मूल्य की मूल संभावनाएँ।  50 个词的句子 के साथ परीक्षण करें, जिनमें से प्रत्येक शब्द की संभावनाएं 0.01 हैं।

### 提示

**练习 1。** से औसत वितरण`u`, वापसी $-\ln(1 - u) / \lambda$◊ जांचें कि नमूना औसत मूल्य निकट है या नहीं$1/\lambda$, सीधे-सीधे से प्रत्येक क्षेत्र के अनुरूप है या नहीं$\lambda e^{-\lambda x}$

**练习 2。** एक 6x6 रूपण भरा, प्रत्येक रूपण एक संभावना है, सभी रूपण के लिए और के लिए 1, फिर बुलाओ `joint_to_marginals` उपयोग `check_independence`केवल प्रत्येक भाग दो किनारों की संभावनाओं के गुणांक के बराबर होता है, दो भाग एक दूसरे से स्वतंत्र होते हैं।

**练习 3。**लॉजिट  अनुप्रयोग `softmax`, पुनः सूचकांक 3 ̊s की संभावना $-\ln$◊ परिणाम 0.421 के करीब होना चाहिए,`nn.CrossEntropyLoss`समान समूह के लिए दिए गए परिणामों के अनुरूप है।

**练习 4。**संख्यात्मक संभावनाओं को जोड़ने के लिए, मूल संभावनाओं को गुणा न करें। 50 शब्दों की संभावनाएं 0.01 के होते हैं, कुल संख्यात्मक संभावनाएं होनी चाहिए।$50 \ln(0.01) \approx -230.26$,原始概率为 $10^{-100}$

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

- [3Blue1Brown: But what is the Central Limit Theorem?](https://www.youtube.com/watch?v=zeJD6dqJ5lo)-  के बारे में क्यों औसत मूल्य सामान्य हो जाएगा के दृश्यता प्रमाण
- [Stanford CS229 Probability Review](https://cs229.stanford.edu/section/cs229-prob.pdf)- 覆盖本文及更多内容精炼参考
- [The Log-Sum-Exp Trick](https://gregorygundersen.com/blog/2020/02/09/log-sum-exp/)- क्यों संख्यात्मक स्थिरता महत्वपूर्ण है, और इसे कैसे प्राप्त किया जाए
