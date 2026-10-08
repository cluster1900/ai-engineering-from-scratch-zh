# 概率 et distribution

> La probabilité est une IA utilisée pour exprimer un langage incertain.

**Type:** 学习
**Language:**Python
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~75 分钟

## Objectif de l'apprentissage

- De la réalisation de la répartition de la FPM et du PDF de Bernoulli, catégorique, poisson, uniforme et normale
-  calculer la valeur attendue ∆variance,并 utiliser le théorème de limite centrale  expliquer pourquoi Gaussian 如此常见
- Utilisation de la valeur de la fonction de calcul
- De logits  calculer la perte d'entropie croisée,并将其与负 log-probability 联系起来

##  problématique

Un classifiant 输出 `[0.03, 0.91, 0.06]`◊ un modèle de langage de 50 000 个候选词中选择下一个词―― un modèle de diffusion 通过从学习到的分布中采样生成图像――

Chaque prédiction faite par le modèle est une distribution de probabilité. Chaque fonction de perte mesure la distance entre la distribution prévue et la réelle distribution. Chaque étape de formation ajuste les paramètres, fait en sorte qu'une distribution ressemble à une autre distribution.

## 概念

### Evénements Œuvres d'échantillonnage et probabilité

espace échantillon S est le ensemble de tous les résultats possibles. L'événement est un sous-ensemble de l'espace échantillon. La probabilité de traiter les événements est de 0 à 1 entre le nombre.

```
Coin flip:
  S = {H, T}
  P(H) = 0.5,  P(T) = 0.5

Single die roll:
  S = {1, 2, 3, 4, 5, 6}
  P(even) = P({2, 4, 6}) = 3/6 = 0.5
```

Trois principes définissent l'ensemble du système de probabilité:
1. Pour un événement arbitral A,P(A) >= 0
2. P (S) = 1 (S) toujours quelque chose se passe)
3. Quand A et B ne peuvent pas se produire simultanément, P(A ou B) = P(A) + P(B)

其他所有内容(La théorie de Bayes, les attentes, les distributions) peuvent être tirées de cette règle.

### Probabilité conditionnelle et indépendance

P  A  B) indique la probabilité de l'événement dans les conditions où B  s'est produit.

```
P(A|B) = P(A and B) / P(B)

Example: deck of cards
  P(King | Face card) = P(King and Face card) / P(Face card)
                      = (4/52) / (12/52)
                      = 4/12 = 1/3
```

Quand on sait qu'un événement est différent d'un autre, les deux événements sont indépendants.

```
Independent:   P(A|B) = P(A)
Equivalent to: P(A and B) = P(A) * P(B)
```

La mise en pièces est indépendante de la.

### Fonctions de masse de probabilité et fonctions de densité de probabilité

离散随机变量 有概率质量函数 (PMF) .

```
PMF: P(X = k)

Fair die:
  P(X = 1) = 1/6
  P(X = 2) = 1/6
  ...
  P(X = 6) = 1/6

  Sum of all probabilities = 1
```

连续随机变量 有概率密度函数 (PDF) ⋅ 个点处的密度 不是概率 ⋅ 概率来自某区间上的密度 进行积分 ⋅

```
PDF: f(x)

P(a <= X <= b) = integral of f(x) from a to b

f(x) can be greater than 1 (density, not probability)
integral from -inf to +inf of f(x) dx = 1
```

Cette différence est importante dans le ML. La classification 输出是 PMF (PDF) 离散选择 (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF) 输出是 PMF (PDF) 输出是 PMF) 输出是 PMF (PDF) 输出是是是PDF) 输出是是是是是是是是是是是是是是是是是是的的的的的

### 常见 Distributions

**Bernoulli：**Une expérience, deux résultats.

```
P(X = 1) = p
P(X = 0) = 1 - p
Mean = p,  Variance = p(1-p)
```

**Categorical：**Une fois expérimenté, il y a eu des résultats.

```
P(X = i) = p_i,  where sum of p_i = 1
Example: P(cat) = 0.7,  P(dog) = 0.2,  P(bird) = 0.1
```

**Uniform：**Les résultats sont égalés à la probabilité.

```
Discrete: P(X = k) = 1/n for k in {1, ..., n}
Continuous: f(x) = 1/(b-a) for x in [a, b]
```

**Normal（Gaussian）：**钟形曲线──由 mean (mu) et variance (sigma)

```
f(x) = (1 / sqrt(2*pi*sigma^2)) * exp(-(x - mu)^2 / (2*sigma^2))

Standard normal: mu = 0, sigma = 1
  68% of data within 1 sigma
  95% within 2 sigma
  99.7% within 3 sigma
```

**Poisson：**Cote des incidents rares dans les zones fixes.

```
P(X = k) = (lambda^k * e^(-lambda)) / k!
Mean = lambda,  Variance = lambda
```

### Value attendue et variance

La valeur attendue est la moyenne de l'augmentation des résultats.

```
Discrete:   E[X] = sum of x_i * P(X = x_i)
Continuous: E[X] = integral of x * f(x) dx
```

Variance mesure le degré de dispersion autour de la moyenne.

```
Var(X) = E[(X - E[X])^2] = E[X^2] - (E[X])^2
Standard deviation = sqrt(Var(X))
```

Dans le ML, la valeur attendue apparaît sous la forme de la fonction Loss (la moyenne de la perte de données)  Variance  description du modèle stabilité  Variance élevée des gradients signifiant train noise 

### Distributions conjointes et marginales

Distribution commune P(X, Y) Dans le même temps, décrivez deux variables aléatoires.

Exemple commun de PMF: X = temps, Y = parapluie:

| | Y=0（不带伞） | Y=1（带伞） | Marginal P(X) |
|---|---|---|---|
| X=0（晴天） | 0.40 | 0.10 | P(X=0) = 0.50 |
| X=1（下雨） | 0.05 | 0.45 | P(X=1) = 0.50 |
| **Marginal P(Y)** | P(Y=0) = 0.45 | P(Y=1) = 0.55 | 1.00 |

La distribution marginale va traiter une autre variable:

```
P(X = x) = sum over all y of P(X = x, Y = y)
```

Les écarts de la liste sont les marges.

### Pourquoi une distribution normale est-elle apparue ?

Théorème de limite centrale: de nombreuses variables aléatoires indépendantes de la distribution normale, quelle que soit la distribution initiale, sont répertoriées.

```
Roll 1 die:  uniform distribution (flat)
Average of 2 dice:  triangular (peaked)
Average of 30 dice: nearly perfect bell curve

This works for ANY starting distribution.
```

C'est pour ça que je suis là.
- 测量误差近似服从正常分布(numéro de sources indépendantes)
- Réseau neuronal de pouvoir de démarrage à l'aide de distributions normales
- Le bruit de gradient du SGD est proche de la distribution normale (environ 200°C)
- Dans les conditions de moyenne et de variance, la distribution normale est la distribution maximale.

### Probabilités de log

La probabilité initiale provoquera des problèmes de valeur numérique.

```
P(sentence) = P(word1) * P(word2) * ... * P(word_n)
            = 0.01 * 0.003 * 0.02 * ...
            -> 0.0 (underflow after ~30 terms)
```

Les probabilités de logement peuvent résoudre ce problème.

```
log P(sentence) = log P(word1) + log P(word2) + ... + log P(word_n)
                = -4.6 + -5.8 + -3.9 + ...
                -> finite number (no underflow)
```

Règles:
- log(a * b) = log(a) + log(b)
- Les probabilités de log 总是 <= 0(因为 0 < P <= 1)
- 越负 = 越不可能
- La perte de l' entropie croisée est une vraie classe de probabilité négative de log

### Softmax  en tant que répartition de probabilité

Réseau neuronal 输出原始分数(logits)。Softmax les transformera en une distribution de probabilité efficace。

```
softmax(z_i) = exp(z_i) / sum(exp(z_j) for all j)

Properties:
  - All outputs are in (0, 1)
  - All outputs sum to 1
  - Preserves relative ordering of inputs
  - exp() amplifies differences between logits
```

Softmax 技巧: avant d'exposer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  

```
z = [100, 101, 102]
exp(102) = overflow

z_shifted = z - max(z) = [-2, -1, 0]
exp(0) = 1  (safe)

Same result, no overflow.
```

Log-softmax va combiner softmax et log pour obtenir la stabilité numérique. PyTorch utilise l'intérieur pour calculer la perte d'entropie croisée.

### Prise d'échantillons

Prise d'échantillons indique la valeur de la distribution extraite dans le tableau ML:
- Le dérapagement est une sorte de neurones qui sont en train de disparaître .
- Augmentation des données 会采样随机变化
- Modèles de langage 会从预测分布中采样下一个 Token
- Modèles de diffusion 会采样噪音并逐步 dénoncer

De distributions arbitraires, les échantillonnages doivent être transformés inversement, les échantillonnages sont rejetés ou sont réparamétrisés pour les VAE.


```figure
gaussian-pdf
```

## - Je le construis.

### 步骤 1: base de la probabilité

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

### 步骤 2: réaliser de zéro les PMF et PDF

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

### 步骤 3:Value attendue et variance

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

### 步骤 4: de la distribution à la prise en compte

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

### 步骤 5:Softmax et probabilités de log

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

### 步骤 6: Théorème de la limite centrale 演示

```python
def demonstrate_clt(dist_fn, n_samples, n_averages):
    averages = []
    for _ in range(n_averages):
        samples = [dist_fn() for _ in range(n_samples)]
        averages.append(sum(samples) / len(samples))
    return averages
```

### Étape 7: visibilité

```python
import matplotlib.pyplot as plt

xs = [mu + sigma * (i - 500) / 100 for i in range(1001)]
ys = [normal_pdf(x, mu, sigma) for x, mu, sigma in ...]
plt.plot(xs, ys)
```

incluant la réalisation complète de l'ensemble des visibilités`code/probability.py`Il y a une autre.

## Utilisez-le

Utilisez NumPy et SciPy, le contenu ci-dessus peut être réalisé en un seul coup:

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

Vous avez déjà construit ces contenus depuis le zéro.

## 练习

1. Pour une distribution exponentielle, il est possible de réaliser un échantillonnage de transformation inverse.

2. Pour deux particules construire une distribution commune, calculer les distributions marginales, et vérifier si ces deux particules sont indépendantes.

3. 计算一个5级分类器的交叉热损失:它输出 logits `[2.0, 0.5, -1.0, 3.0, 0.1]`, l'indice de la classe correcte est 3... puis utilisez PyTorch.`nn.CrossEntropyLoss`验证你的答案── Je suis là pour vous.

4.  rédiger une fonction, recevoir un ensemble de probabilités de log, et retourner la séquence la plus probable ∞ probabilité totale de log, ainsi que la probabilité initiale du prix égal ∞ avec une phrase de 50 mots, dont la probabilité de chaque mot est de 0,01 ∞

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

- [3Blue1Brown: But what is the Central Limit Theorem?](https://www.youtube.com/watch?v=zeJD6dqJ5lo)- La preuve de la façon dont la moyenne devient normale
- [Stanford CS229 Probability Review](https://cs229.stanford.edu/section/cs229-prob.pdf)- 覆盖本文及更多内容精炼参考
- [The Log-Sum-Exp Trick](https://gregorygundersen.com/blog/2020/02/09/log-sum-exp/)- Pourquoi la stabilité numérique est importante et comment la réaliser
