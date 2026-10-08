# 概率 và phân phối

> 概率 là AI sử dụng để thể hiện ngôn ngữ không chắc chắn.

**Type:** 学习
**Language:**Python
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~75 分钟

## Học mục tiêu

- Từ zero thực hiện Bernoulli、categorical、Poisson、uniform và phân phối bình thường của PMF và PDF
- 计算 dự kiến giá trị, biến thể,并 sử dụng Lý thuyết giới hạn trung tâm  giải thích tại sao Gaussian 如此常见
- Sử dụng số giá trị ổn định kỹ thuật( giảm logit tối đa) cấu trúc softmax 和 log-softmax  hàm
- Từ logits  tính toán mất tích entropy chéo,并将其与负 log-cholihood 联系起来

## 问题

Một phân loại 输出 `[0.03, 0.91, 0.06]`Một mô hình ngôn ngữ từ 50.000 个候选词中选择下一个词―― một mô hình phân phối 通过从学习到的分布中采样生成图像――这些都是概率在发挥作用――

Mỗi lần dự đoán được thực hiện bởi mô hình là một phân phối xác suất. Mỗi hàm mất đều đo khoảng cách giữa phân bố dự đoán và phân bố thực tế. Mỗi bước tập luyện đều điều chỉnh các tham số, để phân bố trông giống như phân bố khác. Không có xác suất, bạn không thể đọc được bất kỳ bài báo ML nào, không thể gỡ lỗi bất kỳ mô hình nào, cũng không thể hiểu tại sao tập luyện mất sẽ biến thành NaN.

## 概念

### Các sự kiện √Các không gian mẫu và khả năng

không gian mẫu S là tập hợp tất cả các kết quả có thể. Sự kiện là một tập hợp của không gian mẫu.

```
Coin flip:
  S = {H, T}
  P(H) = 0.5,  P(T) = 0.5

Single die roll:
  S = {1, 2, 3, 4, 5, 6}
  P(even) = P({2, 4, 6}) = 3/6 = 0.5
```

Ba lý thuyết định nghĩa toàn bộ hệ thống tỷ lệ:
1. Đối với sự kiện bất kỳ A,P(A) >= 0
2. P(S) = 1(总会发生某事)
3. 当 A 和 B 不能同时发生时,P(A hoặc B) = P(A) + P(B)

Tất cả các nội dung khác của Bayes' thuyết, kỳ vọng, phân phối có thể được đưa ra từ các quy tắc này.

### Có thể có điều kiện và độc lập

P  A  B) biểu hiện tỷ lệ xảy ra của A trong điều kiện B  đã xảy ra.

```
P(A|B) = P(A and B) / P(B)

Example: deck of cards
  P(King | Face card) = P(King and Face card) / P(Face card)
                      = (4/52) / (12/52)
                      = 4/12 = 1/3
```

Khi biết một sự kiện về sự kiện khác không có bất kỳ thông tin nào tăng lên, hai sự kiện này là độc lập:

```
Independent:   P(A|B) = P(A)
Equivalent to: P(A and B) = P(A) * P(B)
```

抛硬币是独立的──不放回抽牌则不是──

### Các chức năng khối lượng xác suất và chức năng mật độ xác suất

离散随机 biến có hàm khối xác suất (PMF) . Mỗi kết quả đều có một xác suất cụ thể có thể trực tiếp đọc được.

```
PMF: P(X = k)

Fair die:
  P(X = 1) = 1/6
  P(X = 2) = 1/6
  ...
  P(X = 6) = 1/6

  Sum of all probabilities = 1
```

连续随机变量 有概率密度函数 (PDF) ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅                                                                                                                                                                                                                              

```
PDF: f(x)

P(a <= X <= b) = integral of f(x) from a to b

f(x) can be greater than 1 (density, not probability)
integral from -inf to +inf of f(x) dx = 1
```

这个区别在 ML 中很重要──Classification 输出是 PMF(离散选择)──VAE không gian ẩn sử dụng PDF(连续)──

### 常见 Phân phối

**Bernoulli：**Một lần thử nghiệm, hai kết quả.

```
P(X = 1) = p
P(X = 0) = 1 - p
Mean = p,  Variance = p(1-p)
```

**Categorical：**Một lần thử nghiệm, k 个 kết quả.

```
P(X = i) = p_i,  where sum of p_i = 1
Example: P(cat) = 0.7,  P(dog) = 0.2,  P(bird) = 0.1
```

**Uniform：**Tất cả kết quả 等概率── được sử dụng để tự động khởi tạo──

```
Discrete: P(X = k) = 1/n for k in {1, ..., n}
Continuous: f(x) = 1/(b-a) for x in [a, b]
```

**Normal（Gaussian）：**钟形曲线──由 mean(mu) và sự khác biệt(sigma^2)参数化──

```
f(x) = (1 / sqrt(2*pi*sigma^2)) * exp(-(x - mu)^2 / (2*sigma^2))

Standard normal: mu = 0, sigma = 1
  68% of data within 1 sigma
  95% within 2 sigma
  99.7% within 3 sigma
```

**Poisson：**Số lượng các sự kiện hiếm gặp trong khu vực cố định.

```
P(X = k) = (lambda^k * e^(-lambda)) / k!
Mean = lambda,  Variance = lambda
```

### Giá trị dự kiến và sự biến động

Giá trị dự kiến là kết quả của tăng giá trung bình.

```
Discrete:   E[X] = sum of x_i * P(X = x_i)
Continuous: E[X] = integral of x * f(x) dx
```

Sự biến động đo lường mức độ phân tán xung quanh trung bình.

```
Var(X) = E[(X - E[X])^2] = E[X^2] - (E[X])^2
Standard deviation = sqrt(Var(X))
```

Trong ML, giá trị dự kiến sẽ xuất hiện dưới dạng hàm Loss (Phung tích Loss trung bình trên phân bố dữ liệu)  Variance  mô tả mô hình ổn định  Sự khác biệt cao của các gradient có nghĩa là tập luyện tiếng ồn lớn 

### Phân phối chung và biên giới

phân phối chung P(X, Y) 同时 mô tả hai biến ngẫu nhiên.

PMF chung 示例(X = thời tiết,Y = dù):

| | Y=0（不带伞） | Y=1（带伞） | Marginal P(X) |
|---|---|---|---|
| X=0（晴天） | 0.40 | 0.10 | P(X=0) = 0.50 |
| X=1（下雨） | 0.05 | 0.45 | P(X=1) = 0.50 |
| **Marginal P(Y)** | P(Y=0) = 0.45 | P(Y=1) = 0.55 | 1.00 |

Phân bố biên sẽ chuyển đổi khác tìm và tiêu diệt:

```
P(X = x) = sum over all y of P(X = x, Y = y)
```

Trong biểu đồ trên, các tập hợp và tập hợp là các biên giới.

### Tại sao phân phối bình thường đến nơi xuất hiện

Lý thuyết giới hạn trung tâm: Nhiều biến ngẫu nhiên độc lập của và(hoặc giá trị trung bình) sẽ được nhận vào phân bố bình thường, bất kể phân bố ban đầu là gì.

```
Roll 1 die:  uniform distribution (flat)
Average of 2 dice:  triangular (peaked)
Average of 30 dice: nearly perfect bell curve

This works for ANY starting distribution.
```

Đó là lý do tại sao:
- 测量差近似 tuân theo phân bố bình thường ((许多小的独立来源)
- Nền mạng thần kinh của quyền重初始化 sử dụng phân phối bình thường
- SGD 中的 Gradient noise 近似服从正常分布(许多样本梯梯的和)
- Trong các điều kiện của sự khác biệt và trung bình nhất định, phân bố bình thường là phân bố lớn nhất

### Khoản log

Sự xác suất ban đầu sẽ gây ra các vấn đề về giá trị số.

```
P(sentence) = P(word1) * P(word2) * ... * P(word_n)
            = 0.01 * 0.003 * 0.02 * ...
            -> 0.0 (underflow after ~30 terms)
```

Log xác suất có thể giải quyết vấn đề này.

```
log P(sentence) = log P(word1) + log P(word2) + ... + log P(word_n)
                = -4.6 + -5.8 + -3.9 + ...
                -> finite number (no underflow)
```

Quy tắc:
- log(a * b) = log(a) + log(b)
- log xác suất 总是 <= 0(因为 0 < P <= 1)
- 越负 = 越不可能
- Thiệt hại giao hợp entropy là đúng lớp của xác suất log âm

### Softmax  như phân phối xác suất

Mạng thần kinh 输出原始分数(logits) ――Softmax sẽ chuyển chúng thành phân phối xác suất hiệu quả―

```
softmax(z_i) = exp(z_i) / sum(exp(z_j) for all j)

Properties:
  - All outputs are in (0, 1)
  - All outputs sum to 1
  - Preserves relative ordering of inputs
  - exp() amplifies differences between logits
```

Softmax 技巧: Trong việc tăng trưởng  trước khi giảm độ nét tối đa, để ngăn chặn quá tải.

```
z = [100, 101, 102]
exp(102) = overflow

z_shifted = z - max(z) = [-2, -1, 0]
exp(0) = 1  (safe)

Same result, no overflow.
```

Log-softmax sẽ softenmax và log kết hợp để đạt được tính ổn định số lượng. PyTorch sử dụng nó bên trong để tính toán mất tích entropy chéo.

### Tiêu chuẩn

Sampling 指 từ một phân phối 中抽取随机值──在 ML 中:
- Thất vả sẽ theo thời gian.
- Tăng cường dữ liệu 会采样随机变化
- Các mô hình ngôn ngữ 会从预测分布中采样下一个Token
- Mô hình phân phối 会采样噪音并逐步 dénoise

Từ phân phối tùy ý 中采样需要逆转变样本采样,拒绝样本或重设化技巧 (用于 VAE) 等技术──


```figure
gaussian-pdf
```

##  xây dựng nó

### 步骤 1:概率 cơ sở

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

### 步骤 2: Từ không thực hiện PMF và PDF

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

### 步骤 3: Giá trị dự kiến và sự khác biệt

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

### 步骤 4: Từ phân phối 中采样

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

### 步骤 5:Softmax và xác suất log

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

### 步骤 6: Lý thuyết giới hạn trung ương

```python
def demonstrate_clt(dist_fn, n_samples, n_averages):
    averages = []
    for _ in range(n_averages):
        samples = [dist_fn() for _ in range(n_samples)]
        averages.append(sum(samples) / len(samples))
    return averages
```

### Bước 7: Khả năng nhìn thấy

```python
import matplotlib.pyplot as plt

xs = [mu + sigma * (i - 500) / 100 for i in range(1001)]
ys = [normal_pdf(x, mu, sigma) for x, mu, sigma in ...]
plt.plot(xs, ys)
```

包含全部可视化的完整实现位于`code/probability.py`

## Sử dụng nó

Sử dụng NumPy và SciPy, nội dung trên có thể được hoàn thành một cách:

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

Bạn đã xây dựng những nội dung này từ không. Bây giờ bạn biết thư viện đang làm gì.

## 练习

1. Để phân phối theo tỷ lệ thoả thuận, thực hiện việc lấy mẫu biến đổi ngược.

2. Vì hai 子 có phương hướng xây dựng một phân phối chung 表―― tính toán phân bố biên,并 kiểm tra xem hai 子 có độc lập không――

3. 计算一个5类分类器的交叉entropy损失:它输出 logits `[2.0, 0.5, -1.0, 3.0, 0.1]`, chỉ số của lớp chính xác là 3... sau đó sử dụng PyTorch của `nn.CrossEntropyLoss`验证 câu trả lời của bạn.

4.  biên tập một hàm, nhận một nhóm xác suất log, và trả lại chuỗi có thể nhất  tổng xác suất log, cũng như xác suất nguyên thủy của giá tương đương  dùng một câu 50 từ để kiểm tra nó, trong đó xác suất của mỗi từ là 0.01 ⋅

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

- [3Blue1Brown: But what is the Central Limit Theorem?](https://www.youtube.com/watch?v=zeJD6dqJ5lo)-  Về lý do tại sao giá trị trung bình sẽ trở nên bình thường
- [Stanford CS229 Probability Review](https://cs229.stanford.edu/section/cs229-prob.pdf)- 覆盖本文及更多内容精炼参考
- [The Log-Sum-Exp Trick](https://gregorygundersen.com/blog/2020/02/09/log-sum-exp/)- Tại sao sự ổn định số là quan trọng, và làm thế nào để thực hiện nó
