# 概率 y distribución

> La probabilidad es la IA utilizada para expresar un lenguaje incierto.

**Type:** 学习
**Language:**Python
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~75 分钟

## El objetivo del aprendizaje

- Desde la realización de la distribución de la FPM y la de la FPM de Bernoulli, de la categoría, de Poisson, de la distribución uniforme y normal
-  calcular el valor esperado ∆varianza,并 utilizar el Teorema del límite central  Explicar por qué Gaussian 如此常见
- Uso de la cantidad de valores estabilizadores técnicas(Reducción de la máxima logit) Construir softmax y log-softmax  función
- Desde logits  calcular pérdida de entropía cruzada,并将其与负 log-probabilidad 联系起来

##  problemas

Un clasificador 输出 `[0.03, 0.91, 0.06]`◊ un modelo de lenguaje de 50.000 个候选词中选择下一个词―― un modelo de difusión 通过从学习到的分布中采样生成图像――这些都是概率在发挥作用――

 Cada predicción realizada por el modelo es una distribución de probabilidad―cada función de pérdida mide la distancia entre la distribución de predicción y la distribución real―cada etapa de entrenamiento ajusta los parámetros, hace que una distribución parezca más como otra distribución―sin probabilidad, no puedes leer ningún artículo de ML, no puedes deshacerte de ningún modelo, tampoco puedes entender por qué entrenar la pérdida se convertirá en NaN―

## 概念

### Eventos √ Espacios de muestras y probabilidad

espacio de muestra S es el conjunto de todos los resultados posibles. Evento es un subconjunto del espacio de muestra.

```
Coin flip:
  S = {H, T}
  P(H) = 0.5,  P(T) = 0.5

Single die roll:
  S = {1, 2, 3, 4, 5, 6}
  P(even) = P({2, 4, 6}) = 3/6 = 0.5
```

Tres principios definen todo el sistema de probabilidad:
1. Para cualquier evento A,P(A) >= 0
2. P(S) = 1( siempre sucederá algo)
3. Cuando A y B no pueden ocurrir simultáneamente, P(A o B) = P(A) + P(B)

其他所有内容(Teorema de Bayes, expectativas, distribuciones) se puede deducir de esta tres reglas.

### Probabilidad condicional y independencia

P                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

```
P(A|B) = P(A and B) / P(B)

Example: deck of cards
  P(King | Face card) = P(King and Face card) / P(Face card)
                      = (4/52) / (12/52)
                      = 4/12 = 1/3
```

Cuando un evento se acerca a otro evento  no hay información adicional, estos dos eventos son independientes:

```
Independent:   P(A|B) = P(A)
Equivalent to: P(A and B) = P(A) * P(B)
```

La moneda es independiente de la.

### Funciones de masa de probabilidad y de densidad de probabilidad

离散随机变量 有概率质函数 (PMF) ⋅ cada resultado tiene una probabilidad específica que se puede leer directamente ⋅

```
PMF: P(X = k)

Fair die:
  P(X = 1) = 1/6
  P(X = 2) = 1/6
  ...
  P(X = 6) = 1/6

  Sum of all probabilities = 1
```

连续随机变量 有概率密度函数 (PDF) ⋅ densidad de un solo punto de la región ⋅ 不是概率 ⋅概率来自某区间上的密度 进行积分 ⋅

```
PDF: f(x)

P(a <= X <= b) = integral of f(x) from a to b

f(x) can be greater than 1 (density, not probability)
integral from -inf to +inf of f(x) dx = 1
```

Esta diferencia en ML es muy importante. Clasificación 输出是 PMF (PDF) 离散选择 (PDF) 输出是 PMF (PDF) 离散选择 (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是 PMF) 输出是 PMF (PDF) 输出是 PMF (PDF) 输出是PDF) 输出是PDF) 输出是PDF (PDF) 输出是是是PDF) 输出是是是是是是是是是是是的的的的的的的的的的的.

### 常见 Distribuciones

**Bernoulli：**Una prueba, dos resultados. Se utiliza para construir la clasificación binaria.

```
P(X = 1) = p
P(X = 0) = 1 - p
Mean = p,  Variance = p(1-p)
```

**Categorical：**Una vez que se realizó un ensayo, se obtuvieron resultados.

```
P(X = i) = p_i,  where sum of p_i = 1
Example: P(cat) = 0.7,  P(dog) = 0.2,  P(bird) = 0.1
```

**Uniform：**Todos los resultados等概率── para ser utilizados en cualquier inicialización──

```
Discrete: P(X = k) = 1/n for k in {1, ..., n}
Continuous: f(x) = 1/(b-a) for x in [a, b]
```

**Normal（Gaussian）：**钟形曲线──由 mean(mu) y varianza(sigma^2)参数化──

```
f(x) = (1 / sqrt(2*pi*sigma^2)) * exp(-(x - mu)^2 / (2*sigma^2))

Standard normal: mu = 0, sigma = 1
  68% of data within 1 sigma
  95% within 2 sigma
  99.7% within 3 sigma
```

**Poisson：**Cuenta de eventos raros en zonas fijas 

```
P(X = k) = (lambda^k * e^(-lambda)) / k!
Mean = lambda,  Variance = lambda
```

### Valor esperado y variación

El valor esperado es el resultado de la media de aumento.

```
Discrete:   E[X] = sum of x_i * P(X = x_i)
Continuous: E[X] = integral of x * f(x) dx
```

Varianza mide el grado de dispersión de la media

```
Var(X) = E[(X - E[X])^2] = E[X^2] - (E[X])^2
Standard deviation = sqrt(Var(X))
```

En ML, el valor esperado aparece en forma de función de pérdida (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en hebracisementementementementementement) (ing) (ing) (en) (en) (en) (en) (en anglais) (en anglais) (en anglais) (ing) (ing) (ing) (ing) (ing)

### Distribuciones conjuntas y marginales

Distribución conjunta P(X, Y) 同时 describir dos variables aleatorias。

Muestras de PMF conjuntas: X = tiempo, Y = paraguas:

| | Y=0（不带伞） | Y=1（带伞） | Marginal P(X) |
|---|---|---|---|
| X=0（晴天） | 0.40 | 0.10 | P(X=0) = 0.50 |
| X=1（下雨） | 0.05 | 0.45 | P(X=1) = 0.50 |
| **Marginal P(Y)** | P(Y=0) = 0.45 | P(Y=1) = 0.55 | 1.00 |

Distribución marginal se pondrá otro cambio en la búsqueda y la eliminación:

```
P(X = x) = sum over all y of P(X = x, Y = y)
```

Los números de la lista de arriba y abajo son marginales.

### ¿Por qué la distribución normal hasta donde aparecen

Teorema del límite central: muchas variables aleatorias independientes de y  o el valor medio) se reciben a la distribución normal, independientemente de la distribución original es lo que.

```
Roll 1 die:  uniform distribution (flat)
Average of 2 dice:  triangular (peaked)
Average of 30 dice: nearly perfect bell curve

This works for ANY starting distribution.
```

Es por eso que:
- 测量误差近似服从正常分布(numero de pequeñas fuentes independientes)
- La red neuronal de la red de la red neuronal de la red de la red neuronal de la red de la red neuronal de la red de la red neuronal de la red de la red de la red neuronal de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de
- El ruido de gradiente de SGD en el medio casi se adapta a la distribución normal de muchos gradientes de muestras
- En condiciones de media y variación determinadas, la distribución normal es la distribución máxima

### Probabilidades de registro

La probabilidad inicial provocará un problema de valor numérico.

```
P(sentence) = P(word1) * P(word2) * ... * P(word_n)
            = 0.01 * 0.003 * 0.02 * ...
            -> 0.0 (underflow after ~30 terms)
```

Las probabilidades de registro pueden resolver este problema.

```
log P(sentence) = log P(word1) + log P(word2) + ... + log P(word_n)
                = -4.6 + -5.8 + -3.9 + ...
                -> finite number (no underflow)
```

规则:
- log(a * b) = log(a) + log(b)
- Las probabilidades de log 总是 <= 0(因为 0 < P <= 1)
- 越负 = 越不可能
- La pérdida de entropía cruzada es la clase correcta de probabilidad de registro negativo

### Softmax  como distribución de probabilidades

Red Neural 输出原始分数(logits) ――Softmax los transformará en una distribución de probabilidades efectiva―

```
softmax(z_i) = exp(z_i) / sum(exp(z_j) for all j)

Properties:
  - All outputs are in (0, 1)
  - All outputs sum to 1
  - Preserves relative ordering of inputs
  - exp() amplifies differences between logits
```

Softmax 技巧: en la exponenciación 之前 se reduce la máxima lógica, para evitar el desbordamiento.

```
z = [100, 101, 102]
exp(102) = overflow

z_shifted = z - max(z) = [-2, -1, 0]
exp(0) = 1  (safe)

Same result, no overflow.
```

Log-softmax combinará softmax y log  combinar para obtener estabilidad numérica. PyTorch lo utiliza internamente para calcular la pérdida de entropía cruzada.

### Muestreo

Muestreo de indices extraído de una distribución en el ML:
- Dejar de fumar se hace a la vez que las neuronas se ponen en un punto de baja
- Aumento de datos 会采样随机变化
- Modelos de lenguaje 会从预测分布中采样下一个 Token
- Modelos de difusión 会采样噪音并逐步 dénoise

Desde las distribuciones arbitrarias, el modelo requiere muestreo de transformación inversa, muestreo de rechazo o truco de reparameterización (para VAEs) etc.


```figure
gaussian-pdf
```

## Construirlo

### Paso 1: base de la probabilidad

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

### Paso 2: Implementar desde cero el PMF y PDF

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

### Paso 3: Valor esperado y variación

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

### Paso 4: desde las distribuciones

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

### Paso 5: Softmax y probabilidades de registro

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

### Paso 6: Teorema del límite central 演示

```python
def demonstrate_clt(dist_fn, n_samples, n_averages):
    averages = []
    for _ in range(n_averages):
        samples = [dist_fn() for _ in range(n_samples)]
        averages.append(sum(samples) / len(samples))
    return averages
```

### Paso 7: visibilidad

```python
import matplotlib.pyplot as plt

xs = [mu + sigma * (i - 500) / 100 for i in range(1001)]
ys = [normal_pdf(x, mu, sigma) for x, mu, sigma in ...]
plt.plot(xs, ys)
```

incluye la realización completa de todo lo que se puede ver en el`code/probability.py`¿Qué es eso?

## Usalo

Usando NumPy y SciPy, el contenido de arriba puede ser completado:

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

Ya has construido estos contenidos desde cero. Ahora sabes qué hacer con la biblioteca.

##  ejercicios

1. Para la distribución exponencial  lograr muestreo de transformación inversa ⋅ mediante la toma de 10.000 个值并将 histograma con PDF real ⋅对比验证──

2. Para dos partes tienen un parámetro de distribución conjunta, calcular las distribuciones marginales, y comprobar si estas dos partes son independientes.

3. 计算一个5类分类器的交叉输出输出 logits `[2.0, 0.5, -1.0, 3.0, 0.1]`, el índice de clase correcta es de 3... y luego utiliza PyTorch.`nn.CrossEntropyLoss`Verifique su respuesta.

4.  redactar una función, recibir un conjunto de probabilidades de registro, y regresar a la secuencia más probable  probabilidad total de registro, así como probabilidad original de igual precio  probarlo con una frase de 50 palabras, de las cuales la probabilidad de cada palabra es 0.01 

## 关键术语: "El hombre es un hombre"

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

- [3Blue1Brown: But what is the Central Limit Theorem?](https://www.youtube.com/watch?v=zeJD6dqJ5lo)- Una prueba de visibilidad de por qué la media se vuelve normal
- [Stanford CS229 Probability Review](https://cs229.stanford.edu/section/cs229-prob.pdf)- cover el texto y más contenido de la referencia de la elaboración
- [The Log-Sum-Exp Trick](https://gregorygundersen.com/blog/2020/02/09/log-sum-exp/)- ¿Por qué es importante la estabilidad numérica y cómo lograrla?
