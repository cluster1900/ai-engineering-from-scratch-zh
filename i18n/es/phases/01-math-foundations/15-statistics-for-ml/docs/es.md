# Aprendizaje automático 统计学

> Las estadísticas te hacen saber si tu modelo es realmente efectivo o simplemente por casualidad.

**Type:** Build
**Language:**Python
**前置要求：**Fase 1, Lecciones 06 (Probabilidad y distribución),07 (Teorema de Bayes)
**Time:** ~120 分钟

## El objetivo del aprendizaje
- Desde la estadística descritiva de la calculación de zéro, la correlación Pearson/Spearman y las matrices de covarianza
- 执行 hypothesis tests(t-test、chi-squared),并正确解释 p-valores 和 intervalos de confianza
- Usar bootstrap resampling para construir intervalos de confianza de métricas arbitrarias, sin depender de la hipótesis de distribución
- Utilización de medidas de tamaño de efecto 区分统计意义与实践意义

##  problemas
Usted entrenó dos modelos. El modelo A obtuvo un puntaje de 0.87 en el conjunto de pruebas. El modelo B obtuvo un puntaje de 0.89.

El modelo B  en realidad no es mejor que el modelo A ⋅ 0.02 ⋅ la diferencia es sólo el ruido ⋅ tu conjunto de pruebas es demasiado pequeño, o el cuadro es demasiado alto, o ambos tienen ⋅ has puesto el empaque al azar en mejoras y publicado fuera ⋅

Esta situación ha estado ocurriendo. La clasificación del ranking de la lista de clasificación de Caggle se agita.

Las estadísticas te dan herramientas para distinguir entre señales y ruidos. Te dice cuándo es real la diferencia, cuánto debes tener en cuenta, y cuántos datos necesitas antes de confiar en un resultado.

## 概念
### Estadísticas descriptivas: 总结你的数据

Antes de construir cualquier cosa, necesitas saber cómo es el tamaño de los datos. Las estadísticas descriptivas reducen un conjunto de datos a un número pequeño que pueda capturar su forma.

**Measures of central tendency**¿En el medio de dónde?

```
Mean:   所有值之和 / 数量
        mu = (1/n) * sum(x_i)

Median: 排序后的中间值
        对 outliers 稳健。如果你有 [1, 2, 3, 4, 1000]，mean 是 202，
        但 median 是 3。

Mode:   出现最频繁的值
        对 categorical data 有用。对 continuous data，通常信息量很低。
```

media es un punto de equilibrio. Mediana es un punto de equilibrio. Cuando los demás se desvían, su distribución es sesgada.

**Measures of spread**¿Hay más información disponible?

```
Variance:   相对 mean 的平均平方偏差
            sigma^2 = (1/n) * sum((x_i - mu)^2)

Standard deviation:  variance 的平方根
                     sigma = sqrt(sigma^2)
                     与数据单位相同，因此更容易解释。

Range:      max - min
            对 outliers 敏感。单独使用几乎从来没什么用。

IQR:        Q3 - Q1 (interquartile range)
            数据中间 50% 的范围。
            对 outliers 稳健。用于 box plots 和 outlier detection。
```

**Percentiles**Colocar los datos de la clasificación posterior en 100 个相等部分──第 25 percentil(Q1) significa que el 25% del valor es inferior a este punto──第 50 percentil es la mediana──第 75 percentil es Q3──

```
用于 latency monitoring:
  P50 = median latency        （典型用户体验）
  P95 = 95th percentile       （较差但不是最坏情况）
  P99 = 99th percentile       （tail latency，通常是 median 的 10 倍）
```

En ML, te centrarás en los percentiles, para inferir las distribuciones de confianza de la latencia, predicción y comprensión de las distribuciones de errores. Un error promedio  muy bajo pero error P99  muy malo modelo, para aplicaciones críticas a la seguridad puede ser inútil.

**Sample vs population statistics.**Desde la muestra 计算变量 时,用 (n-1) en lugar de n como divisor. Esta es la corrección de Bessel.

```
Population variance: sigma^2 = (1/N) * sum((x_i - mu)^2)
Sample variance:     s^2     = (1/(n-1)) * sum((x_i - x_bar)^2)
```

实践中: si n 很大(数千个样本), la diferencia puede ser ignorada.

### Correlación: 变量 cómo cambian juntos

Correlación: mide la intensidad y la dirección de la relación lineal entre dos variables.

**Pearson correlation coefficient**衡量线性关联:

```
r = sum((x_i - x_bar)(y_i - y_bar)) / (n * s_x * s_y)

r = +1:  完美正线性关系
r = -1:  完美负线性关系
r =  0:  无线性关系（但可能存在非线性关系！）

Range: [-1, 1]
```

Pearson 假设关系是线性的, y los dos cambios se adaptan en gran medida a la distribución normal.

**Spearman rank correlation**衡量单调关联:

```
1. 将每个值替换为其 rank（1, 2, 3, ...）
2. 在 ranks 上计算 Pearson correlation

Spearman 能捕捉任意单调关系，而不只是线性关系。
如果 y = x^3，Pearson 给出 r < 1，但 Spearman 给出 rho = 1。
```

**何时使用哪一个：**

```
Pearson:    两个变量都是 continuous 且大致 normal。
            你特别关心线性关系。
            没有极端 outliers。

Spearman:   Ordinal data（rankings、ratings）。
            数据不服从 normal distribution。
            你怀疑存在单调但非线性的关系。
            存在 outliers。
```

**黄金法则：**La correlación no significa causalidad. La cantidad de hielo y el número de muertes por ahogamiento están relacionados, porque los dos factores aumentan en la temporada estival. La precisión del modelo y el número de parámetros están relacionados, pero el aumento de parámetros no aumenta automáticamente la precisión.

### Matriz de covarianza

Covarianza entre dos variables  Medir cómo cambian en común:

```
Cov(X, Y) = (1/n) * sum((x_i - x_bar)(y_i - y_bar))

Cov(X, Y) > 0:  X 和 Y 倾向于一起增加
Cov(X, Y) < 0:  当 X 增加时，Y 倾向于减少
Cov(X, Y) = 0:  无线性共同变化
```

对于d 个特征,covariance matrix C es una matriz d x d, de la cual C[i][j] = Cov(feature_i, feature_j)。对角线项 C[i][i] 是每个特征的变化──

```
C = | Var(x1)      Cov(x1,x2)  Cov(x1,x3) |
    | Cov(x2,x1)  Var(x2)      Cov(x2,x3) |
    | Cov(x3,x1)  Cov(x3,x2)  Var(x3)     |

Properties:
  - Symmetric: C[i][j] = C[j][i]
  - Positive semi-definite: all eigenvalues >= 0
  - Diagonal = variances
  - Off-diagonal = covariances
```

**与 PCA 的联系。**PCA para la matriz de covarianza hacer su propia composición. Los egénvectores son los componentes principales. Los egénvalos le dicen a cada componente cuánto variación ha capturado. Esto es exactamente lo que cubre la lección 10, pero ahora puede ver por qué la matriz de covarianza es adecuada para objetos descompuestos: codifica todo lo que hay en los datos en relación a las relaciones linearias.

**与 correlation 的联系。**La matriz de correlación es la matriz de covarianza de variaciones estandarizadas (en inglés: standard variance matrix) (cada variación está separada por su propia desviación estándar).

### Prueba de hipótesis

Las pruebas de hipótesis son un marco para tomar decisiones bajo incertidumbre. Se comienza con una propuesta, se recopila datos y luego se decide si los datos coinciden con la propuesta.

**设置：**

```
Null hypothesis (H0):        默认假设，通常是“无效应”
Alternative hypothesis (H1): 你试图证明的内容

Example:
  H0: Model A 和 Model B 具有相同 accuracy
  H1: Model B 的 accuracy 高于 Model A
```

**p-value**Es en H0 por verdad, ver la probabilidad de datos extremos como los datos que observas. No es H0 por verdad. Es la mayor error de la estadística.

```
p-value = P(data this extreme | H0 is true)

If p-value < alpha（通常是 0.05）:
    Reject H0。结果是“statistically significant”。
If p-value >= alpha:
    Fail to reject H0。你没有足够证据。
    这并不意味着 H0 为真。
```

**Confidence intervals**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

```
mean 的 95% confidence interval:
    x_bar +/- z * (s / sqrt(n))

where z = 1.96 for 95% confidence

解释：如果你重复这个实验很多次，计算得到的 intervals 中有 95%
会包含 true mean。它并不意味着 true mean 有 95% 的概率落在这个
具体 interval 中。
```

La amplitud del intervalo de confianza le dice la precisión. El intervalo de amplitud significa la altura incierta. El intervalo de estrecha significa que su estimación es muy precisa.

### El t-test

T-test comparar medios.

**One-sample t-test:**¿El valor de población es diferente de un valor de hipótesis?

```
t = (x_bar - mu_0) / (s / sqrt(n))

degrees of freedom = n - 1
```

**Two-sample t-test (independent):**¿El grupo dos significa si es diferente?

```
t = (x_bar_1 - x_bar_2) / sqrt(s1^2/n1 + s2^2/n2)

这是 Welch's t-test，它不假设 equal variances。
除非你有特定理由假设 equal variances，否则始终使用 Welch's。
```

**Paired t-test:**Cuando las mediciones 成对出现时(同一个模型在相同数据分区上评估):

```
对每一对计算 d_i = x_i - y_i
然后在 d_i values 上针对 mu_0 = 0 运行 one-sample t-test
```

En ML, el t-test de pareja es muy común: se ejecuta dos modelos en 10 pliegues de validación cruzada, comparando cada uno sus resultados.

### Prueba en cuadrado de chi

Prueba en el cuadrado de chi  inspección de frecuencias observadas 否匹配预期频率──对类数据 有用──

```
chi^2 = sum((observed - expected)^2 / expected)

Example: language model 的 output distribution 是否匹配
各类别上的 training distribution？

Category    Observed   Expected
Positive       120        100
Negative        80        100
chi^2 = (120-100)^2/100 + (80-100)^2/100 = 4 + 4 = 8

在 1 degree of freedom 下，chi^2 = 8 给出 p < 0.005。
差异是 significant。
```

### Pruebas A/B para modelos ML

Los ensayos A/B en ML y los ensayos A/B en Web son diferentes.

```
1. Same test set:    两个模型必须在完全相同的数据上评估。
                     不同 test sets 会让比较失去意义。

2. Multiple metrics: Accuracy alone is not enough. You need precision,
                     recall, F1, latency, and fairness metrics.

3. Variance:         使用 cross-validation 或 bootstrap 来估计
                     每个 metric 的 variance，而不只是 point estimates。

4. Data leakage:     如果 test set 在 model selection 期间被使用过，
                     你的比较就是 biased。留出最终 test set。
```

**流程：**

```
1. 定义你的 metric 和 significance level（alpha = 0.05）
2. 在相同的 k-fold cross-validation splits 上运行两个模型
3. 收集 paired scores: [(a1, b1), (a2, b2), ..., (ak, bk)]
4. 计算 differences: d_i = b_i - a_i
5. 在 differences 上运行 paired t-test
6. 检查：mean difference 是否显著不同于 0？
7. 为 mean difference 计算 confidence interval
8. 计算 effect size（Cohen's d）来判断 practical significance
```

### Significancia estadística vs. Significancia práctica

Un resultado puede ser estadísticamente significativo, pero en la práctica no tiene sentido.

```
Example:
  Model A accuracy: 0.9234
  Model B accuracy: 0.9237
  n = 1,000,000 test samples
  p-value = 0.001

Statistically significant? 是。
Practically significant? 0.03% 的提升不值得
部署新模型所需的 engineering cost。
```

**Effect size**La diferencia cuantitativa es grande, y independiente del tamaño de la muestra:

```
Cohen's d = (mean_1 - mean_2) / pooled_std

d = 0.2:  small effect
d = 0.5:  medium effect
d = 0.8:  large effect
```

始终同时报告 p-value 和 effect size──p-value 告诉你差异是否真实──effect size 告诉你差异是否重要──

### Problemas de comparación múltiples

Cuando usted prueba muchas hipótesis, algunas de ellas se vuelven significativas por casualidad. Si usted prueba 20 cosas en alfa = 0.05 , incluso si no tiene ningún efecto real, también se espera que surja 1 falso positivo.

```
P(at least one false positive) = 1 - (1 - alpha)^m

m = 20 tests, alpha = 0.05:
P(false positive) = 1 - 0.95^20 = 0.64

你有 64% 的概率至少得到一个 false positive。
```

**Bonferroni correction:**Se llevará a cabo un análisis de la cantidad de alfa.

```
Adjusted alpha = alpha / m = 0.05 / 20 = 0.0025

只有当 p-value < 0.0025 时才 reject H0。
保守但简单。在 tests 独立时有效。
```

En ML, cuando se transfieren varias métricas comparar modelos, probar muchas configuraciones de hiperparámetros, o evaluar varios conjuntos de datos, esto es importante.

### Métodos de arranque

Bootstrapping                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

**算法：**

```
1. 你有 n 个 data points
2. 有放回地抽取 n 个 samples（有些点出现多次，
   有些完全不出现）
3. 在这个 bootstrap sample 上计算你的 statistic
4. 重复 B 次（通常 B = 1000 到 10000）
5. bootstrap statistics 的分布近似于
   sampling distribution
```

**Bootstrap confidence interval (percentile method):**

```
对 B 个 bootstrap statistics 排序
95% CI = [2.5th percentile, 97.5th percentile]
```

**为什么 bootstrap 对 ML 很重要：**

```
- Test set accuracy 是 point estimate。Bootstrap 给你
  confidence intervals。
- 你不能假设 metric distributions 是 normal（尤其是
  AUC、F1、precision at k）。
- Bootstrap 适用于任意 statistic：median、两个 means 的 ratio、
  两个模型之间的 AUC difference。
- 不需要 closed-form formula。
```

**用于模型比较的 Bootstrap：**

```
1. 你有 Model A 和 Model B 在同一个 test set 上的 predictions
2. 对每次 bootstrap iteration:
   a. 有放回地 resample test indices
   b. 在 resampled set 上计算 metric_A 和 metric_B
   c. 存储 diff = metric_B - metric_A
3. difference 的 95% CI:
   [diffs 的 2.5th percentile, diffs 的 97.5th percentile]
4. 如果 CI 不包含 0，则差异 significant
```

Esto es más que el test de t-pareado, porque no hace hipótesis de distribución.

### Pruebas parámétricas vs no parámétricas

**Parametric tests**假设特定分布 (normalmente es normal):

```
t-test:         假设数据 normal distributed（或由于 CLT 而 n 很大）
ANOVA:          假设 normality 和 equal variances
Pearson r:      假设 bivariate normality
```

**Non-parametric tests**No hace la distribución:

```
Mann-Whitney U:     比较两组（替代 independent t-test）
Wilcoxon signed-rank: 比较 paired data（替代 paired t-test）
Spearman rho:       ranks 上的 correlation（替代 Pearson）
Kruskal-Wallis:     比较多个 groups（替代 ANOVA）
```

**何时使用 non-parametric：**

```
- sample size 很小（n < 30）且数据明显 non-normal
- Ordinal data（ratings、rankings）
- 无法移除的 heavy outliers
- Skewed distributions
```

**何时使用 parametric：**

```
- sample size 很大（CLT 使 test statistic 近似 normal）
- 数据大致 symmetric 且没有极端 outliers
- 更高 statistical power（更擅长检测真实差异）
```

En el experimento ML, normalmente solo hay 5 o 10 pliegues de validación cruzada), por lo que, como Wilcoxon, este tipo de pruebas no parámétricas suelen ser más adecuadas que las pruebas t.

### Teorema del límite central: impacto real

El CLT indica que, con el aumento de la cantidad de muestras, la distribución de los medios se acercará a la distribución normal, independientemente de la distribución de la población de la base.

```
If X_1, X_2, ..., X_n are iid with mean mu and variance sigma^2:

    X_bar ~ Normal(mu, sigma^2 / n)    as n -> infinity

在大多数情况下 n >= 30 即可工作。
对于高度 skewed distributions，你可能需要 n >= 100。
```

**为什么这对 ML 很重要：**

```
1. 为 aggregated metrics 上的 confidence intervals 和 t-tests 提供依据
2. 解释了为什么对 cross-validation folds 取平均会给出稳定估计，
   即使单个 folds 差异很大
3. Mini-batch Gradient Descent 有效，是因为一个 batch 上的平均 Gradient
   近似 true Gradient（CLT 在发挥作用）
4. Ensemble methods: 对多个模型的 predictions 取平均，
   比任何单个模型都更稳定
```

**CLT 不能做什么：**

```
- 不会让你的数据变 normal。它让 samples 的 MEAN 变 normal。
- 不适用于具有 infinite variance 的 heavy-tailed distributions
  （Cauchy distribution）。
- 不适用于 dependent data（没有修正的 time series）。
```

### ML 论文中常见的统计错误

1. **在 training set 上测试。**Mantener un modelo sobreajustado. Siempre deja datos que nunca se habían visto durante el entrenamiento.

2. **没有 confidence intervals。**Sólo se puede informar de una precisión numérica sin explicar la incertidumbre, haciendo que los resultados sean irrefutables e indetectables.

3. **忽略 multiple comparisons。**测试 50 configuraciones no se correccionan en caso de que se informe el mejor, elevará las tasas falsas positivas.

4. **混淆 statistical 和 practical significance。**Precisión del 0,01% 提升上 p-value = 0.001 并没有意义──

5. **在 imbalanced data 上使用 accuracy。**Un conjunto de datos de clase negativa del 99% alcanza la precisión del 99%, lo que significa que el modelo no ha aprendido a utilizar precisión, recuerdo, F1 o AUC.

6. **Cherry-picking metrics。**Sólo reportar las métricas de la victoria de tu modelo.

7. **在 train/test splits 之间泄露信息。**En la división antes de hacer normalización, o con futuros datos de pronóstico pasado.

8. **小 test sets 且没有 variance estimates。**En 100 muestras, la evaluación de arriba y afirma que hay un aumento del 2%, es ruido, no señal.

9. **在数据不独立时假设 independence。**Las imágenes médicas de los mismos pacientes, de varias frases del mismo archivo, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos pacientes, de los mismos, de los mismos, de los mismos, de los mismos, de los mismos, de los cuales son los que se encuentran en el mismo.

10. **P-hacking。**No se deja de intentar diferentes pruebas, subconjuntos o criterios de exclusión hasta que se obtiene p < 0.05.

## Construirlo


```figure
f3-bootstrap-resample
```

Usted va a lograr:

1. **从零实现 descriptive statistics**(mediano, modo, desviación estándar, porcentajes, RIC)
2. **Correlation functions**(Pearson y Spearman, así como la matriz de covarianza)
3. **Hypothesis tests**(testa de una muestra t-testa de dos muestras t-testa de chi-cuadrado)
4. **Bootstrap confidence intervals**(Aplicable para estadísticas arbitrarias, no necesita假设)
5. **A/B test simulator**(generar datos, pruebas, inspecciones de errores de tipo I y tipo II)
6. **Statistical vs practical significance demo**(Mostra cómo hacer que todo sea significativo)

Todo desde el cero, solo para usar.`math`Y `random`。不使用numpy,不使用scipy。

## 关键术语: "El hombre es un hombre"
| Term | Definition |
|---|---|
| Mean | values 之和除以 count。对 outliers 敏感。 |
| Median | 排序后数据的中间值。对 outliers 稳健。 |
| Standard deviation | variance 的平方根。以原始单位衡量 spread。 |
| Percentile | 给定百分比的数据低于该值。 |
| IQR | Interquartile range。Q3 减 Q1。中间 50% 的 spread。 |
| Pearson correlation | 衡量两个变量之间的线性关联。Range [-1, 1]。 |
| Spearman correlation | 使用 ranks 衡量单调关联。 |
| Covariance matrix | 所有 features 两两 covariances 组成的 Matrix。 |
| Null hypothesis | 默认假设，即无效应或无差异。 |
| p-value | 在 null hypothesis 为真时，出现如此极端数据的概率。 |
| Confidence interval | 在给定 confidence level 下，参数的一组 plausible values。 |
| t-test | 检验 means 是否显著不同。使用 t-distribution。 |
| Chi-squared test | 检验 observed frequencies 是否不同于 expected frequencies。 |
| Effect size | 差异的大小，独立于 sample size。Cohen's d 很常见。 |
| Bonferroni correction | 将 significance threshold 除以 tests 数量，以控制 false positives。 |
| Bootstrap | 有放回 resampling，用于估计 sampling distributions。 |
| Type I error | False positive。当 H0 为真时 reject H0。 |
| Type II error | False negative。当 H0 为假时 fail to reject H0。 |
| Statistical power | 正确 reject false H0 的概率。Power = 1 减 Type II error rate。 |
| Central limit theorem | 随着 sample size 增大，sample means 收敛到 normal distribution。 |
| Parametric test | 假设数据服从特定分布（通常是 normal）。 |
| Non-parametric test | 不做分布假设。基于 ranks 或 signs 工作。 |
