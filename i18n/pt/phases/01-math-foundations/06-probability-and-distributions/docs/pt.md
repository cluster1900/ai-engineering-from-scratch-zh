# 概率 e distribuição

> A probabilidade é a IA usada para expressar linguagem incerta.

**Type:** 学习
**Language:**Python
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~75 分钟

## Objectivo de aprendizagem

- Desde zero, a realização de distribuições de Bernoulli, categorias, poisson, uniformes e normais de PMF e PDF
-  calcular o valor esperado ∆variância,并 utilizar Teorema do Limite Central  Explicar por que Gaussian 如此常见
- Utilize numer value stabilization techniques( redução de logit máximo) Construir softmax 和 log-softmax  função
- Desde logits  calcular perda de entropia cruzada,并将其与负 log-probabilidade 联系起来

## 问题

Um classificador 输出 `[0.03, 0.91, 0.06]`◊ um modelo de linguagem de 50.000 个候选词中选择下一个词―― um modelo de difusão 通过从学习到的分布 中采样生成图像――这些都是概率在发挥作用――

Cada previsão feita pelo modelo é uma distribuição de probabilidade. Cada função de perda mede a distância entre a distribuição de previsão e a distribuição real. Cada passo de treinamento ajusta os parâmetros, fazendo com que uma distribuição pareça mais como outra distribuição.

## 概念

### Eventos ∆ Espaços de amostra e probabilidade

espaço de amostra S é o conjunto de todos os resultados possíveis. O evento é um subconjunto do espaço de amostra. A probabilidade de mapear os eventos é o número entre 0 e 1.

```
Coin flip:
  S = {H, T}
  P(H) = 0.5,  P(T) = 0.5

Single die roll:
  S = {1, 2, 3, 4, 5, 6}
  P(even) = P({2, 4, 6}) = 3/6 = 0.5
```

Três regras definem todo o sistema de probabilidade:
1. Para qualquer evento A,P(A) >= 0
2. P (S) = 1 (S) sempre vai acontecer alguma coisa)
3. Quando A 和 B 不能同时发生时,P(A ou B) = P(A) + P(B)

其他所有内容(Teorema de Bayes, expectativas, distribuições) podem ser deduzidas a partir desta três regras.

### Probabilidade condicional e independência

P                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

```
P(A|B) = P(A and B) / P(B)

Example: deck of cards
  P(King | Face card) = P(King and Face card) / P(Face card)
                      = (4/52) / (12/52)
                      = 4/12 = 1/3
```

Quando um evento é conhecido por outro evento, não há qualquer informação que possa aumentar, estes dois eventos são independentes:

```
Independent:   P(A|B) = P(A)
Equivalent to: P(A and B) = P(A) * P(B)
```

Para a moeda, não há nada a fazer.

### Funções de massa de probabilidade e funções de densidade de probabilidade

离散随机变量 有概率质量函数 (PMF) . Em cada resultado, há uma probabilidade específica que pode ser lida diretamente.

```
PMF: P(X = k)

Fair die:
  P(X = 1) = 1/6
  P(X = 2) = 1/6
  ...
  P(X = 6) = 1/6

  Sum of all probabilities = 1
```

连续随机变量 有概率密度函数 (PDF) ⋅ densidade de um único ponto não é probabilidade ⋅ probabilidade é proveniente de uma densidade em um determinado espaço 进行积分──

```
PDF: f(x)

P(a <= X <= b) = integral of f(x) from a to b

f(x) can be greater than 1 (density, not probability)
integral from -inf to +inf of f(x) dx = 1
```

Essa diferença em ML é muito importante. Classificação 输出是 PMF (PDF) 离散选择 (PDF) VAE

### 常见 Distribuições

**Bernoulli：**Uma experiência, dois resultados.

```
P(X = 1) = p
P(X = 0) = 1 - p
Mean = p,  Variance = p(1-p)
```

**Categorical：**Uma vez experimentado, k 个 resultados.

```
P(X = i) = p_i,  where sum of p_i = 1
Example: P(cat) = 0.7,  P(dog) = 0.2,  P(bird) = 0.1
```

**Uniform：**Todos os resultados 等概率── para utilização como inicialização.

```
Discrete: P(X = k) = 1/n for k in {1, ..., n}
Continuous: f(x) = 1/(b-a) for x in [a, b]
```

**Normal（Gaussian）：**钟形曲线──由 mean (mu) 和 variance (sigma) 参数化 (sigma)

```
f(x) = (1 / sqrt(2*pi*sigma^2)) * exp(-(x - mu)^2 / (2*sigma^2))

Standard normal: mu = 0, sigma = 1
  68% of data within 1 sigma
  95% within 2 sigma
  99.7% within 3 sigma
```

**Poisson：**固定区间内罕见事件的计数── utilizadas para construir

```
P(X = k) = (lambda^k * e^(-lambda)) / k!
Mean = lambda,  Variance = lambda
```

### Valor esperado e variação

O valor esperado é a média de aumento do resultado.

```
Discrete:   E[X] = sum of x_i * P(X = x_i)
Continuous: E[X] = integral of x * f(x) dx
```

Variância mede a diferença em torno da média.

```
Var(X) = E[(X - E[X])^2] = E[X^2] - (E[X])^2
Standard deviation = sqrt(Var(X))
```

Em ML, o valor esperado aparece na forma de função de perda (o valor esperado é a média da perda na distribuição de dados).

### Distribuições conjuntas e marginais

Distribuição conjunta P ((X, Y) 同时描述两个随机变量──

PMF conjunta demonstrações ((X = tempo, Y = guarda-chuva):

| | Y=0（不带伞） | Y=1（带伞） | Marginal P(X) |
|---|---|---|---|
| X=0（晴天） | 0.40 | 0.10 | P(X=0) = 0.50 |
| X=1（下雨） | 0.05 | 0.45 | P(X=1) = 0.50 |
| **Marginal P(Y)** | P(Y=0) = 0.45 | P(Y=1) = 0.55 | 1.00 |

Distribuição marginal vai trazer outra variação de procura e eliminação:

```
P(X = x) = sum over all y of P(X = x, Y = y)
```

Os números de correntes e de correntes são marginais.

### Por que a distribuição normal até onde apareceu

Teorema do limite central: muitas variáveis aleatórias independentes de e (ou de valor médio) serão recebidas para a distribuição normal, independentemente da distribuição original é o que.

```
Roll 1 die:  uniform distribution (flat)
Average of 2 dice:  triangular (peaked)
Average of 30 dice: nearly perfect bell curve

This works for ANY starting distribution.
```

É por isso que:
- 测量误差近似服从正常分布 ((muitos pequenos fontes independentes)
- Rede Neural de poder de inicialização usando distribuições normais
- SGD 中的渐变噪音近似服从正常分布(许多样本渐变的和)
- Em condições de determinada média e variação, a distribuição normal é a maior distribuição.

### Probabilidades de registro

A probabilidade inicial provocará um problema numérico.

```
P(sentence) = P(word1) * P(word2) * ... * P(word_n)
            = 0.01 * 0.003 * 0.02 * ...
            -> 0.0 (underflow after ~30 terms)
```

Log probabilidades pode resolver este problema.

```
log P(sentence) = log P(word1) + log P(word2) + ... + log P(word_n)
                = -4.6 + -5.8 + -3.9 + ...
                -> finite number (no underflow)
```

规则:
- log(a * b) = log(a) + log(b)
- log probabilidades 总是 <= 0(因为 0 < P <= 1)
- 越负 = 越不可能
- Perda de entropia cruzada é a classe correcta de probabilidade de registro negativo

### Softmax  como Distribuição de Probabilidade

Rede Neural 输出原始分数(logits) ――Softmax vai transformá-los em uma distribuição de probabilidade válida―

```
softmax(z_i) = exp(z_i) / sum(exp(z_j) for all j)

Properties:
  - All outputs are in (0, 1)
  - All outputs sum to 1
  - Preserves relative ordering of inputs
  - exp() amplifies differences between logits
```

Softmax 技巧: em exponencial 之前减去最大logit,以防止溢出──

```
z = [100, 101, 102]
exp(102) = overflow

z_shifted = z - max(z) = [-2, -1, 0]
exp(0) = 1  (safe)

Same result, no overflow.
```

Log-softmax irá combinar softmax e log      para obter estabilidade numérica.

### Amostragem

Amostração de indices de uma distribuição em extração de valores de ordem.
- Deixe de lado os neurônios
- Aumento de dados 会采样随机变化
- Modelos de linguagem 会从预测分布中采样下一个 Token
- Modelos de difusão 会采样噪音并逐步 dénoise

De distribuições arbitrárias, a análise requer amostragem de transformação inversa, amostragem de rejeição ou truque de reparametrização (para VAEs) e outras técnicas.


```figure
gaussian-pdf
```

## Construí-lo

### 步骤 1: base de probabilidade

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

### 步骤 2: implementar PMF e PDF a partir de zero

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

### 步骤 3:Válculo esperado e variação

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

### 步骤 4: das distribuições

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

### 步骤 5: Softmax e probabilidades de log

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

### 步骤 6: Teorema do limite central 演示

```python
def demonstrate_clt(dist_fn, n_samples, n_averages):
    averages = []
    for _ in range(n_averages):
        samples = [dist_fn() for _ in range(n_samples)]
        averages.append(sum(samples) / len(samples))
    return averages
```

### 步骤 7: Visualização

```python
import matplotlib.pyplot as plt

xs = [mu + sigma * (i - 500) / 100 for i in range(1001)]
ys = [normal_pdf(x, mu, sigma) for x, mu, sigma in ...]
plt.plot(xs, ys)
```

incluindo toda a realização completa da visualização`code/probability.py`- Não.

## Use-o

Usando NumPy e SciPy, o conteúdo acima pode ser feito de uma maneira completa:

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

Já construíste tudo isto desde o zero. Agora sabes o que a biblioteca está a fazer.

## 练习

1. Para a distribuição exponencial  realizar a amostragem de transformação inversa ⋅ através da tomada de 10.000 个值并将 histogram com PDF real ⋅ comparar para verificar ⋅

2. Para duas partes terem um parâmetro conjunto de distribuição, calcular distribuições marginais, e verificar se estas duas partes são independentes.

3. 计算一个5级分类器的交叉热损失:它输出 logits `[2.0, 0.5, -1.0, 3.0, 0.1]`, índice de classe é 3, e depois usando PyTorch.`nn.CrossEntropyLoss`Verifique a sua resposta.

4.  escrever uma função, receber um conjunto de probabilidades de log, retornar a sequência mais possível  probabilidade total de log, bem como probabilidade original do igual preço  testá-lo com uma frase de 50 palavras, em que a probabilidade de cada palavra é de 0,01 ⋅

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

- [3Blue1Brown: But what is the Central Limit Theorem?](https://www.youtube.com/watch?v=zeJD6dqJ5lo)- Sobre o que a média vai tornar-se normal
- [Stanford CS229 Probability Review](https://cs229.stanford.edu/section/cs229-prob.pdf)- 覆盖本文及更多内容精炼参考
- [The Log-Sum-Exp Trick](https://gregorygundersen.com/blog/2020/02/09/log-sum-exp/)- Por que a estabilidade numérica é importante e como a alcançar
