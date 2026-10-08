# 概率 و توزيع

> احتمال هو استخدام الذكاء الاصطناعي للكشف عن لغة عدم اليقين.

**Type:** 学习
**Language:**بايثون
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~75 分钟

## 學习目标

- من التحقق من صفر برنولي ‬التقسيمات الفئوية ‬بوسون ‬الموحدة والطبيعية من PMF و PDF
-  حساب القيمة المتوقعة  التغير,并 استخدام نظرية الحد المركزي  شرح لماذا غوسيان 如此常见
- استخدام قيمة ثابتة تيكوكس ((خفض أكبر منطق) تشكيل softmax 和 log-softmax  وظيفة
- من المنطق  حساب الخسارة المتقاطعة للاندروبي،并将其与负记录概率 联系起来

## 问题

تصنيف 输出 `[0.03, 0.91, 0.06]` نموذج لغة من 50،000 个候选词中选择下一个词── نموذج انتشار 通过从学习到的分布中采样生成图像──这些都是概率在发挥作用──

كل توقعات يتم إجراؤها من خلال نموذج هي توزيع احتمالية. كل وظيفة خسارة تقوم بقياس المسافة بين التوزيع التوقعي والتوزيع الحقيقي. كل خطوة تدريبية تقوم بتعديل العناصر، تجعل التوزيع يبدو أكثر مما يبدو من التوزيع الآخر.

## 概念

### الأحداث مناطق العينات والاحتمالات

مساحة العينة S هي مجموع جميع النتائج المحتملة. الأحداث هي مجموعة من مساحة العينة. احتمالية تصوير الأحداث إلى عدد بين 0 إلى 1.

```
Coin flip:
  S = {H, T}
  P(H) = 0.5,  P(T) = 0.5

Single die roll:
  S = {1, 2, 3, 4, 5, 6}
  P(even) = P({2, 4, 6}) = 3/6 = 0.5
```

ثلاث أشكال تعريف النظام الإحتمالي بأكمله:
1. على أي حدث A،P(A) >= 0
2. (ب) = 1 (أبداً ما يحدث شيء)
3. عندما A 和 B 不能同时发生时,P(A أو B) = P(A) + P(B)

其他所有内容(نظرية بايز 期望 分布) يمكن أن يتم من هذا 三条规则推推──

### الإحتمال الشريط والإستقلال

P  A  B) يعبر عن احتمال حدوث A  تحت ظروف B  قد حدثت

```
P(A|B) = P(A and B) / P(B)

Example: deck of cards
  P(King | Face card) = P(King and Face card) / P(Face card)
                      = (4/52) / (12/52)
                      = 4/12 = 1/3
```

عندما تعرف حدثا على حدث آخر لا يوجد أي معلومات مضافية، هذه الحدوثين هي مستقلة:

```
Independent:   P(A|B) = P(A)
Equivalent to: P(A and B) = P(A) * P(B)
```

抛硬币是独立的──不放回抽牌则不是──

### وظائف الكتلة من احتمالية وظائف كثافة من احتمالية

离散随机变量 有概率质量函数 ((PMF)                                                                                                                                                                                                                                                      

```
PMF: P(X = k)

Fair die:
  P(X = 1) = 1/6
  P(X = 2) = 1/6
  ...
  P(X = 6) = 1/6

  Sum of all probabilities = 1
```

连续随机变量 有概率密度函数 (PDF)                                                                                                                                                                                                                                                      

```
PDF: f(x)

P(a <= X <= b) = integral of f(x) from a to b

f(x) can be greater than 1 (density, not probability)
integral from -inf to +inf of f(x) dx = 1
```

هذا الاختلاف في ML مهم جدا. التصنيف 输出是 PMF (离散选择)

### 常见 التوزيعات

**Bernoulli：**تجربة واحدة، نتائج اثنتين.

```
P(X = 1) = p
P(X = 0) = 1 - p
Mean = p,  Variance = p(1-p)
```

**Categorical：**تجربة واحدة، نتائج واحدة، تستخدم لتصنيف فئة متعددة،

```
P(X = i) = p_i,  where sum of p_i = 1
Example: P(cat) = 0.7,  P(dog) = 0.2,  P(bird) = 0.1
```

**Uniform：**النتائج كلها 等概率── تستخدم في التشغيل المحتمل

```
Discrete: P(X = k) = 1/n for k in {1, ..., n}
Continuous: f(x) = 1/(b-a) for x in [a, b]
```

**Normal（Gaussian）：**钟形曲线──由 mean(mu) و التباين(sigma^2)参数化──

```
f(x) = (1 / sqrt(2*pi*sigma^2)) * exp(-(x - mu)^2 / (2*sigma^2))

Standard normal: mu = 0, sigma = 1
  68% of data within 1 sigma
  95% within 2 sigma
  99.7% within 3 sigma
```

**Poisson：**عدد الأحداث النادرة في المنطقة الثابتة 

```
P(X = k) = (lambda^k * e^(-lambda)) / k!
Mean = lambda,  Variance = lambda
```

### القيمة المتوقعة والتشابه

القيمة المتوقعة هي متوسط الاضافه للنتيجة.

```
Discrete:   E[X] = sum of x_i * P(X = x_i)
Continuous: E[X] = integral of x * f(x) dx
```

التباين يقيس درجة الانفصال حول المتوسط

```
Var(X) = E[(X - E[X])^2] = E[X^2] - (E[X])^2
Standard deviation = sqrt(Var(X))
```

في ML، تظهر القيمة المتوقعة في شكل وظيفة الخسارة (المتوسط الخسارة على توزيع البيانات) ――المتغيرات 描述模型稳定性──Gradients high variance يعني تدريب ضجيج──

### التوزيعات المشتركة والحاشية

التوزيع المشترك P(X,Y) 同时 وصف متغيرين عشوائيين

نموذج PMF مشترك ((X = الطقس،Y = مظلة):

| | Y=0（不带伞） | Y=1（带伞） | Marginal P(X) |
|---|---|---|---|
| X=0（晴天） | 0.40 | 0.10 | P(X=0) = 0.50 |
| X=1（下雨） | 0.05 | 0.45 | P(X=1) = 0.50 |
| **Marginal P(Y)** | P(Y=0) = 0.45 | P(Y=1) = 0.55 | 1.00 |

التوزيع الهامشي سوف يضع متغير آخر في طلب وإزالة:

```
P(X = x) = sum over all y of P(X = x, Y = y)
```

المجموعات المرتبطة بالخطوط العليا هي الحدود

### لماذا توزيع طبيعي حتى تظهر

نظرية الحد المركزي: العديد من المتغيرات العشوائية المستقلة  أو متوسط القيمة) ستتلقى إلى التوزيع الطبيعي، بغض النظر عن التوزيع الأصلي هو ما هو.

```
Roll 1 die:  uniform distribution (flat)
Average of 2 dice:  triangular (peaked)
Average of 30 dice: nearly perfect bell curve

This works for ANY starting distribution.
```

هذا هو السبب:
- قياس خطأ تقارب مع التوزيع الطبيعي ((عدد من المصادر المستقلة الصغيرة)
- الوصول إلى الشبكة العصبية باستخدام التوزيعات الطبيعية
- ضجيج دراديينت في وسط SGD قريبة من التوزيع الطبيعي ((عدد من نموذج دراديينتات
- في ظل ظروف المتوسط والمتباين المحدد، التوزيع الطبيعي هو أكبر التوزيع

### احتمالات السجل

الإحتمالات الأولية ستثير مشكلة قيمة العدد.

```
P(sentence) = P(word1) * P(word2) * ... * P(word_n)
            = 0.01 * 0.003 * 0.02 * ...
            -> 0.0 (underflow after ~30 terms)
```

يمكن حل هذه المشكلة.

```
log P(sentence) = log P(word1) + log P(word2) + ... + log P(word_n)
                = -4.6 + -5.8 + -3.9 + ...
                -> finite number (no underflow)
```

规则:
- (log(a * b) = (log(a) + (log(b)
- احتمالات التسجيل 总是 <= 0(因为 0 < P <= 1)
- 越负 = 越不可能
- الخسارة المتقاطعة للاندروبي هو صحيح الطبقة من احتمال السجل السلبي

### Softmax  كوزع احتمال

شبكة عصبية 输出原始分数(لوجيت) ―― سوف تحويلها Softmax إلى توزيع فعال للاحتمالات。

```
softmax(z_i) = exp(z_i) / sum(exp(z_j) for all j)

Properties:
  - All outputs are in (0, 1)
  - All outputs sum to 1
  - Preserves relative ordering of inputs
  - exp() amplifies differences between logits
```

softmax 技巧: في التكبير  قبل خفض أقصى حد من التنفس، لمنع الإفراط

```
z = [100, 101, 102]
exp(102) = overflow

z_shifted = z - max(z) = [-2, -1, 0]
exp(0) = 1  (safe)

Same result, no overflow.
```

سيقوم Log-softmax بتحديد softmax و log                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                

### أخذ العينات

أخذ العينات指 من توزيع معين استخرج أي قيمة.
- الانسحاب سوف يتغير كل ما يفعله العصبية
- زيادة البيانات 会采样随机变化
- نموذج اللغة 会从预测分布中采样下一个 Token
- نماذج التفريق 会采样噪音 并逐步 dénoise

من التوزيعات المحتملة 中采样需要 العكس تحويل العينات ‧الرفض العينات أو إعادة تقييم الخدعة (((للاستخدام فيات) وغيرها من التقنيات‬


```figure
gaussian-pdf
```

## بناءها

### الخطوة 1: المرجح

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

### الخطوة 2: من الصفر لتحقيق PMF و PDF

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

### الخطوة الثالثة: القيمة المتوقعة والفرقة

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

### الخطوة 4: من التوزيعات إلى الاختيار

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

### الخطوة 5: Softmax و احتمالات التسجيل

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

### 步骤 6: نظرية الحد المركزي

```python
def demonstrate_clt(dist_fn, n_samples, n_averages):
    averages = []
    for _ in range(n_averages):
        samples = [dist_fn() for _ in range(n_samples)]
        averages.append(sum(samples) / len(samples))
    return averages
```

### الخطوة 7:

```python
import matplotlib.pyplot as plt

xs = [mu + sigma * (i - 500) / 100 for i in range(1001)]
ys = [normal_pdf(x, mu, sigma) for x, mu, sigma in ...]
plt.plot(xs, ys)
```

يحتوي على كل التطبيقات المُبصرة`code/probability.py`.

## استخدمها

باستخدام NumPy و SciPy، يمكن إنجاز كل ما هو أعلاه:

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

لقد بنيت هذه المواد من الصفر. الآن تعرف المكتبة.

## التدريب

1. لتوزيع التكبير 实现 العكسية تحويل العينات 通过采样 10,000 个值并将历史图与真实PDF对比来验证 

2. لإنشاء توزيع مشترك لـ2 تناظرين، قم بحساب التوزيعات الهامشية، ومراجعة ما إذا كان هذان التناظرين مستقلين.

3.  حساب 5 فئة تصنيف الخسارة المتقاطعة: it输出 logits `[2.0, 0.5, -1.0, 3.0, 0.1]`، صحيح مؤشر الفئة هو 3... ثم باستخدام PyTorch `nn.CrossEntropyLoss`أكد إجابتك

4. كتب وظيفة، وتلقي مجموعة من احتمالات السجل، وتعود إلى أكثر الترتيبات الممكنة ‬احتمالات السجل الكلي، وكذلك احتمالات الأصل للمساوي‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|----------------------|
| Sample space | “所有可能性” | 实验中每个可能 outcome 构成的集合 S |
| PMF | “概率函数” | 给出每个离散 outcome 精确概率的函数，所有概率之和为 1 |
| PDF | “概率曲线” | 用于连续变量的 density function。对某个区间积分即可得到概率 |
| Conditional probability | “给定某事的概率” | P(A\|B) = P(A and B) / P(B)。Bayesian thinking 和 Bayes' theorem 的基础 |
| Independence | “它们互不影响” | P(A and B) = P(A) * P(B)。知道一个 event 对另一个没有任何信息增益 |
| Expected value | “平均值” | 所有 outcomes 的概率加权和。Loss function 就是一个 expected value |
| Variance | “分散程度” | 相对 mean 的 squared deviation 的期望。High variance = 噪声大、不稳定的估计 |
| Normal distribution | “钟形曲线” | f(x) = (1/sqrt(2*pi*sigma^2)) * exp(-(x-mu)^2/(2*sigma^2))。由于 CLT 而无处不在 |
| Central Limit Theorem | “平均值会变成 normal” | 无论来源如何，许多 independent samples 的 mean 都会收敛到 normal distribution |
| Joint distribution | “两个变量放在一起” | P(X, Y) 描述 X 和 Y outcomes 每一种组合的概率 |
| Marginal distribution | “把另一个变量求和消去” | P(X) = sum_y P(X, Y)。从 joint 中恢复单个变量的 distribution |
| Log probability | “概率的 log” | log P(x)。把乘积变成求和，避免长序列中的数值下溢 |
| Softmax | “把分数变成概率” | softmax(z_i) = exp(z_i) / sum(exp(z_j))。将实值 logits 映射为有效的 probability distribution |
| Cross-entropy | “Loss function” | -sum(p_true * log(p_predicted))。衡量两个 distributions 有多不同。越低越好 |
| Logits | “模型原始输出” | softmax 之前的未归一化分数。命名来自 logistic function |
| Sampling | “抽取随机值” | 按照 probability distribution 生成值。模型生成输出的方式 |

## 延伸阅读

- [3Blue1Brown: But what is the Central Limit Theorem?](https://www.youtube.com/watch?v=zeJD6dqJ5lo)- حول سبب تحول متوسط القيمة إلى طبيعة
- [Stanford CS229 Probability Review](https://cs229.stanford.edu/section/cs229-prob.pdf)- تغطية المقالة و المزيد من المحتويات
- [The Log-Sum-Exp Trick](https://gregorygundersen.com/blog/2020/02/09/log-sum-exp/)- لماذا استقرار القيمة العددية مهم وكيفية تحقيقه
