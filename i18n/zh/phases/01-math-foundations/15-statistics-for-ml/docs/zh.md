# 机器学习 统计学

> 统计数据让你知道你的模型是真的有效的,还是只是偶然运行.

**Type:** Build
**Language:**字符串
**前置要求：**阶段1课程06 (概率和分布)07 (贝斯定理)
**Time:** ~120 分钟

## 学习目标
- 从零计算描述性统计数据,皮尔森/斯皮尔曼相关性和共变矩阵
- 执行假设测试 (t测试),并正确解释p值和信心间隔
- 使用启动线重新样本为任意的度量 构建信任间隔,而不依赖分布假设
- 使用效果尺寸测量 区分统计意义与实用意义

## 问题
你训练了两个模型. 模型A在测试组上的分数是0.87――B模型的分数是0.89――你部署了B模型――三周后,生产环境指标比以前更差――发生了什么?

模型B 实际上没有比模型A.0.02的差异只是噪音. 你的测试集太小,或者方差太高,或者两者都有.

根据几百个样本的A/B测试结果,总是因为有人跳过了统计.

统计数据给你工具来区分信号和噪音. 它告诉你什么时候差异是真实的,你应该有多大把握,以及需要多少数据才能相信一个结果.

## 概念
### 总结你的数据

在构建任何东西之前,你需要知道数据长什么样子.

**Measures of central tendency**回答:中间在哪里?

```
Mean:   所有值之和 / 数量
        mu = (1/n) * sum(x_i)

Median: 排序后的中间值
        对 outliers 稳健。如果你有 [1, 2, 3, 4, 1000]，mean 是 202，
        但 median 是 3。

Mode:   出现最频繁的值
        对 categorical data 有用。对 continuous data，通常信息量很低。
```

平均是平衡点,平均是中点标记.当二者偏离时,你的分布是偏差.收入分布通常意味着:

**Measures of spread**答案: 数据可能散发?

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

**Percentiles**把排序后的数据分成100个相等部分.第25个百分点.

```
用于 latency monitoring:
  P50 = median latency        （典型用户体验）
  P95 = 95th percentile       （较差但不是最坏情况）
  P99 = 99th percentile       （tail latency，通常是 median 的 10 倍）
```

在 ML 中,你会关注百分比,用于推断延迟,预测信心分布,以及理解错误分布.

**Sample vs population statistics.**从样本计算变量时,用 (n-1) 而不是n作为除数――这是贝塞尔的修正――它补偿了样本的平均值 不是真实人口的平均值 这一事实――如果分母是n,你会会系统性低估真实变量――如果分母是 (n-1),估计是无偏见――

```
Population variance: sigma^2 = (1/N) * sum((x_i - mu)^2)
Sample variance:     s^2     = (1/(n-1)) * sum((x_i - x_bar)^2)
```

实践中:如果n 很大 ((数千个样本),差异可以忽略.

### 变量如何变化

关系 衡量两种变量之间的线性关系强度和方向.

**Pearson correlation coefficient**衡量线性关联:

```
r = sum((x_i - x_bar)(y_i - y_bar)) / (n * s_x * s_y)

r = +1:  完美正线性关系
r = -1:  完美负线性关系
r =  0:  无线性关系（但可能存在非线性关系！）

Range: [-1, 1]
```

皮尔森假设关系是线性的,并且两个变量都大致遵循正常分布.

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

**黄金法则：**相关性不意味着因果性.冰淋销量和溺水死亡人数相关,是因为二者都在夏季增加.模型精度和参数数量相关,但增加参数不会自动提高精度.

### 变量矩阵

两个变量之间的共变量 衡量它们如何共同变化:

```
Cov(X, Y) = (1/n) * sum((x_i - x_bar)(y_i - y_bar))

Cov(X, Y) > 0:  X 和 Y 倾向于一起增加
Cov(X, Y) < 0:  当 X 增加时，Y 倾向于减少
Cov(X, Y) = 0:  无线性共同变化
```

对于d个特征,covariance矩阵C 是一个d x d矩阵,其中C[i][j] =Cov(feature_i, feature_j) ――对角线项C[i][i] 是每个特征的变化──

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

**与 PCA 的联系。**对于共变矩阵做自己的组合――自变量是主要的组件―― 它们的值告诉你每个组件 捕获了多少变量―― 这正是第十课的内容,但现在你能看到为什么共变矩阵是适合分解的对象:它编码了数据中的所有对线性关系――

**与 correlation 的联系。**相关性矩阵是标准化变量的共变矩阵 (),每个变量都除了自己的标准偏差) ⋅ 相关性会归结为共变,使所有值落在 [-1, 1]⋅

### 假设测试

假设测试是一个在不确定性下做出决策的框架.

**设置：**

```
Null hypothesis (H0):        默认假设，通常是“无效应”
Alternative hypothesis (H1): 你试图证明的内容

Example:
  H0: Model A 和 Model B 具有相同 accuracy
  H1: Model B 的 accuracy 高于 Model A
```

**p-value**实际上,看出与你观察到的数据一样极端的数据概率.

```
p-value = P(data this extreme | H0 is true)

If p-value < alpha（通常是 0.05）:
    Reject H0。结果是“statistically significant”。
If p-value >= alpha:
    Fail to reject H0。你没有足够证据。
    这并不意味着 H0 为真。
```

**Confidence intervals**给出参数的一组可行的值:

```
mean 的 95% confidence interval:
    x_bar +/- z * (s / sqrt(n))

where z = 1.96 for 95% confidence

解释：如果你重复这个实验很多次，计算得到的 intervals 中有 95%
会包含 true mean。它并不意味着 true mean 有 95% 的概率落在这个
具体 interval 中。
```

宽间隔意味着高度不确定.狭间隔意味着你的估计非常精确.

### 测试

试验比较方式――有几种形式――

**One-sample t-test:**人口平均值是否不同于某种假设值?

```
t = (x_bar - mu_0) / (s / sqrt(n))

degrees of freedom = n - 1
```

**Two-sample t-test (independent):**两组组组是否不同?

```
t = (x_bar_1 - x_bar_2) / sqrt(s1^2/n1 + s2^2/n2)

这是 Welch's t-test，它不假设 equal variances。
除非你有特定理由假设 equal variances，否则始终使用 Welch's。
```

**Paired t-test:**当测量成对出现时 (同一个模型在相同的数据中分开上评估):

```
对每一对计算 d_i = x_i - y_i
然后在 d_i values 上针对 mu_0 = 0 运行 one-sample t-test
```

在ML中,对 t测试很常见:你在相同的10个验证交叉折叠上运行两个模型,并逐渐比较它们的分数.

### 奇方体测试

检查观察频率 是否匹配预期频率――对类别数据有用――

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

### 对于ML模型进行A/B测试

模块比较有特定的挑战:

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

### 统计意义与实用意义

一个结果可以是统计上显著的,但实际上是无意义的.只要数据足够多,即使是微不足道的差异也会变得统计上显著.

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

**Effect size**量化差异很大,并且独立于样本大小:

```
Cohen's d = (mean_1 - mean_2) / pooled_std

d = 0.2:  small effect
d = 0.5:  medium effect
d = 0.8:  large effect
```

始终同时报告p值和效果大小──p值 告诉你差异是否真实──效果大小──告诉你差异是否重要──

### 多种比较问题

当你检查许多假设时,其中一些会因为偶然而变得显著.如果你在alpha =0.05下检查20件事,即使没有任何真实效果,也预计会出现1个错误阳性.

```
P(at least one false positive) = 1 - (1 - alpha)^m

m = 20 tests, alpha = 0.05:
P(false positive) = 1 - 0.95^20 = 0.64

你有 64% 的概率至少得到一个 false positive。
```

**Bonferroni correction:**测试量量.

```
Adjusted alpha = alpha / m = 0.05 / 20 = 0.0025

只有当 p-value < 0.0025 时才 reject H0。
保守但简单。在 tests 独立时有效。
```

在ML中,当你跨多个指标比较模型,测试多个超参数配置,或者在多个数据集上评估时,这一点很重要.

### 启动方法

通过引导数据进行放回样本来估计某个统计数据的样本分布.

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

这比对式t测试更稳健,因为它不做分布假设.

### 参数对非参数测试

**Parametric tests**假设特定分布通常是正常的):

```
t-test:         假设数据 normal distributed（或由于 CLT 而 n 很大）
ANOVA:          假设 normality 和 equal variances
Pearson r:      假设 bivariate normality
```

**Non-parametric tests**不做分布假设:

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

在ML实验中,你通常只有很小的 n  5 或 10 个交叉验证折叠),因此像威尔科森签名等级这样的非参数测试往往比t测试更合适.

### 中央限度定理:实际影响

随着样本的分布的增加, 样本的分布将趋于正常分布, 不管底层人口分布是什么.

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

### 统计错误中常见的统计错误

1. **在 training set 上测试。**保证会过度适应――始终留出在训练期间从未见过的模型数据――

2. **没有 confidence intervals。**只有报告一个准确的数字,不说明不确定性,会使结果不可复制和不可验证.

3. **忽略 multiple comparisons。**测试50个配置并没有修正的情况下报告最好的一个,会提高虚假阳性率.

4. **混淆 statistical 和 practical significance。**提升的p值 = 0.001 并没有意义.

5. **在 imbalanced data 上使用 accuracy。**一个99%负类的数据集上达到99%的准确性,这意味着模型什么也没学到.

6. **Cherry-picking metrics。**仅报告你的模型获胜的指标.

7. **在 train/test splits 之间泄露信息。**在分开之前做正常化,或者用未来数据预测过去.

8. **小 test sets 且没有 variance estimates。**在100个样本上评估并声称有2%的提升,这是噪音,不是信号.

9. **在数据不独立时假设 independence。**医疗图像来自同一档案的多句话.

10. **P-hacking。**不断尝试不同的测试,子组或排除标准,直到得到p <0.05──结果只是搜索过程的文物──

## 建立它


```figure
f3-bootstrap-resample
```

你将实现:

1. **从零实现 descriptive statistics**(平均,中位数,模式,标准偏差,百分比,IQR)
2. **Correlation functions**(皮尔森和斯皮尔曼以及共变矩阵)
3. **Hypothesis tests**(一个样本的t测试,2个样本的t测试,5个平方测试)
4. **Bootstrap confidence intervals**(适用于任意统计,不需要假设)
5. **A/B test simulator**(生成数据、测试、检查类型I和类型II错误)
6. **Statistical vs practical significance demo**(展示大 n 如何让一切变得重要)

完全从零实现,只使用`math`和 `random`不用,不用.

## 关键术语
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
