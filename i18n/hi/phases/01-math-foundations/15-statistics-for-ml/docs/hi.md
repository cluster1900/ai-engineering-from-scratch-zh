# मशीन लर्निंग 统计学

> आंकड़े आपको यह जानने के लिए कि आपका मॉडल वास्तव में प्रभावी है या सिर्फ संयोग से चलाया गया है।

**Type:** Build
**Language:**पायथन
**前置要求：**चरण 1,लक्षा 06 (संभावना और वितरण),07 (बेयस का प्रमेय)
**Time:** ~120 分钟

## 学习目标
- शून्य गणना से वर्णनात्मक सांख्यिकी, पीयरसन/स्पीयरमैन सहसंबंध तथा सह-भेरिएंसी मैट्रिक्स
- 执行 hypothesis tests(t-test、chi-squared),并正确解释 p-values 和 आत्मविश्वास अंतराल
- उपयोग बूटस्ट्रैप पुनः नमूनाकरण के लिए किसी भी मीट्रिक  निर्माण विश्वास अंतराल, वितरण पर निर्भर नहीं परिकल्पना
- उपयोग प्रभाव आकार माप 区分 सांख्यिकीय महत्व और व्यावहारिक महत्व

## 问题
आपने दो मॉडल को प्रशिक्षित किया है। मॉडल ए ने परीक्षण सेट पर 0.87 अंक प्राप्त किए हैं। मॉडल बी का स्कोर 0.89 अंक प्राप्त किया है।

मॉडल बी 实际上没有优于模型A──0.02 差别只是噪音──你的测试集太小,或方差太高,或两者都都有──你把随机包装改进发行了──

यह स्थिति लगातार होती रही है। कैगल लीडरबोर्ड की रैंकिंग में झटके। अपूर्ण लेख। कुछ सौ नमूनों के आधार पर ए/बी परीक्षणों में सफलता की घोषणा की गई।

आंकड़े आपको संकेत और शोर को अलग करने के लिए उपकरण देते हैं। यह आपको बताता है कि अंतर कब वास्तविक है, आपको कितना पता होना चाहिए, और एक परिणाम पर विश्वास करने से पहले कितना डेटा चाहिए। प्रत्येक एमएल पाइपलाइन, प्रत्येक मॉडल तुलना, प्रत्येक प्रयोग के लिए आंकड़े की आवश्यकता होती है।

## 概念
### वर्णनात्मक सांख्यिकीः 总结你的数据

किसी भी चीज़ के निर्माण से पहले, आपको यह जानना होगा कि डेटा क्या है। वर्णनात्मक सांख्यिकी एक डेटासेट को कुछ संख्याओं में संकुचित करेगी जो इसके आकार को पकड़ सकती है।

**Measures of central tendency** मध्य में कहाँ?

```
Mean:   所有值之和 / 数量
        mu = (1/n) * sum(x_i)

Median: 排序后的中间值
        对 outliers 稳健。如果你有 [1, 2, 3, 4, 1000]，mean 是 202，
        但 median 是 3。

Mode:   出现最频繁的值
        对 categorical data 有用。对 continuous data，通常信息量很低。
```

औसत = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

**Measures of spread** डेटा शायद फैल गया है?

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

**Percentiles**इसे 100 个相等部分 में विभाजित करना 个相等部分──第 25 पर्सेंटाइल  Q1) का अर्थ है कि 25% का मूल्य इस बिंदु से कम है──第 50 पर्सेंटाइल  मध्य  75 पर्सेंटाइल  Q3──

```
用于 latency monitoring:
  P50 = median latency        （典型用户体验）
  P95 = 95th percentile       （较差但不是最坏情况）
  P99 = 99th percentile       （tail latency，通常是 median 的 10 倍）
```

एमएल में, आप प्रतिशत पर ध्यान देंगे, जो कि अनुमानित विलंबता, भविष्यवाणी विश्वास वितरण, तथा त्रुटि वितरण को समझने के लिए उपयोग किया जाएगा।

**Sample vs population statistics.**∈ N से, n−1 के बजाय n ∈ N के रूप में भिन्नता है। यह बेसल की सुधार है। यह नमूना अर्थ का भुगतान करता है। यह वास्तविक जनसंख्या अर्थ नहीं है। यदि ∈ N है, तो आप एक प्रणालीगत कम अनुमान वास्तविक भिन्नता है।

```
Population variance: sigma^2 = (1/N) * sum((x_i - mu)^2)
Sample variance:     s^2     = (1/(n-1)) * sum((x_i - x_bar)^2)
```

实践中: यदि n 很大(数千个样本),差异可以忽略──如果 n 很小(几十个样本),它就很重要──

### संयोगः 变量 कैसे एक साथ बदलते हैं

संयोग दो चर के बीच संभोग के बल और दिशा को मापता है।

**Pearson correlation coefficient**衡量线性关联:

```
r = sum((x_i - x_bar)(y_i - y_bar)) / (n * s_x * s_y)

r = +1:  完美正线性关系
r = -1:  完美负线性关系
r =  0:  无线性关系（但可能存在非线性关系！）

Range: [-1, 1]
```

पियरसन का मानना है कि संबंध रैखिक है, और दो चर सामान्य वितरण के अधीन हैं। यह अपवादों के प्रति संवेदनशील है।

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

**黄金法则：**संबद्धता का अर्थ कारण नहीं है। बर्फ बिक्री और डूबने वाले लोगों की संख्या से संबंधित है, क्योंकि दोनों गर्मियों में बढ़ते हैं। मॉडल की सटीकता और पैरामीटर की संख्या से संबंधित है, लेकिन बढ़ते पैरामीटर स्वचालित रूप से सटीकता में वृद्धि नहीं करते हैं।

### सह-विवर्तन मैट्रिक्स

दो चर के बीच सह-परिवर्तन  मापें कि वे कैसे संयुक्त रूप से बदलते हैंः

```
Cov(X, Y) = (1/n) * sum((x_i - x_bar)(y_i - y_bar))

Cov(X, Y) > 0:  X 和 Y 倾向于一起增加
Cov(X, Y) < 0:  当 X 增加时，Y 倾向于减少
Cov(X, Y) = 0:  无线性共同变化
```

对于d 个特征,covariance matrix C 是一个d x d Matrix,其中 C[i][j] = Cov(feature_i, feature_j)。对角线项 C[i][i] 是每个 feature 的变化──

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

**与 PCA 的联系。**पीसीए कोविडेंस मैट्रिक्स के लिए अपनी संरचना बनाएं――अयोजनवेक्टर मुख्य घटक हैं️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

**与 correlation 的联系。**सहसंबंध मैट्रिक्स मानक परिवर्तन की सह-परिवर्तन मैट्रिक्स हैं (प्रत्येक परिवर्तन अपने स्वयं के मानक विचलन के अलावा)

### परिकल्पना परीक्षण

परिकल्पना परीक्षण अनिश्चितता के तहत निर्णय लेने के लिए एक ढांचा है। आप एक विषय से शुरू करते हैं, डेटा एकत्र करते हैं, और फिर यह तय करते हैं कि क्या डेटा उस विषय के अनुरूप है।

**设置：**

```
Null hypothesis (H0):        默认假设，通常是“无效应”
Alternative hypothesis (H1): 你试图证明的内容

Example:
  H0: Model A 和 Model B 具有相同 accuracy
  H1: Model B 的 accuracy 高于 Model A
```

**p-value**यह H0 के लिए वास्तविक संभावना नहीं है। यह आंकड़ों में सबसे आम गलतफहमी है।

```
p-value = P(data this extreme | H0 is true)

If p-value < alpha（通常是 0.05）:
    Reject H0。结果是“statistically significant”。
If p-value >= alpha:
    Fail to reject H0。你没有足够证据。
    这并不意味着 H0 为真。
```

**Confidence intervals** दें तत्वों के एक समूह के मानों को मान्य करेंः

```
mean 的 95% confidence interval:
    x_bar +/- z * (s / sqrt(n))

where z = 1.96 for 95% confidence

解释：如果你重复这个实验很多次，计算得到的 intervals 中有 95%
会包含 true mean。它并不意味着 true mean 有 95% 的概率落在这个
具体 interval 中。
```

विश्वास अंतराल की चौड़ाई आपको सटीकता बताती है। चौड़ा अंतराल का अर्थ है ऊंचाई अनिश्चित। संकीर्ण अंतराल का अर्थ है कि आपका अनुमान बहुत सटीक है।

### टी-टेस्ट

t-test तुलना के साधनों── there are several forms──

**One-sample t-test:**जनसंख्या का अर्थ क्या किसी मानदंड से भिन्न है?

```
t = (x_bar - mu_0) / (s / sqrt(n))

degrees of freedom = n - 1
```

**Two-sample t-test (independent):**两组 समूह का अर्थ है या नहीं भिन्न?

```
t = (x_bar_1 - x_bar_2) / sqrt(s1^2/n1 + s2^2/n2)

这是 Welch's t-test，它不假设 equal variances。
除非你有特定理由假设 equal variances，否则始终使用 Welch's。
```

**Paired t-test:**जब माप 成对出现时(同一个模型在相同数据中分开上评估):

```
对每一对计算 d_i = x_i - y_i
然后在 d_i values 上针对 mu_0 = 0 运行 one-sample t-test
```

एमएल में, जोड़ी टी-टेस्ट  बहुत आम हैः आप एक ही 10 क्रॉस-वैलिडेशन फोल्ड में हैं, ऊपर दो मॉडल चलाते हैं, और एक दूसरे से तुलना करते हैं।

### चि-क्वाड टेस्ट

चि-क्वायर टेस्ट  निरीक्षण की गई आवृत्तियों का निरीक्षण करें या नहीं अपेक्षित आवृत्तियों के अनुरूप है।

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

### एमएल मॉडल के लिए ए/बी परीक्षण

एमएल में ए/बी परीक्षण और वेब ए/बी परीक्षण अलग-अलग हैं।

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

### सांख्यिकीय महत्व बनाम व्यावहारिक महत्व

एक परिणाम सांख्यिकीय रूप से महत्वपूर्ण हो सकता है, लेकिन व्यावहारिक रूप से कोई अर्थ नहीं है।

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

**Effect size**量化差异有多大,且独立于样本大小:

```
Cohen's d = (mean_1 - mean_2) / pooled_std

d = 0.2:  small effect
d = 0.5:  medium effect
d = 0.8:  large effect
```

始终同时报告 p-value 和 प्रभाव आकार──p-value 告诉你差异是否真实──efffect size 告诉你差异是否重要──

### कई तुलना समस्या

जब आप बहुत सारी परिकल्पनाओं का परीक्षण करते हैं, तो उनमें से कुछ आकस्मिक रूप से महत्वपूर्ण हो जाते हैं। यदि आप अल्फा = 0.05 पर हैं, तो 20 चीजों का परीक्षण करते हैं, भले ही कोई वास्तविक प्रभाव न हो, तो भी 1 झूठी सकारात्मक दिखाई देगा।

```
P(at least one false positive) = 1 - (1 - alpha)^m

m = 20 tests, alpha = 0.05:
P(false positive) = 1 - 0.95^20 = 0.64

你有 64% 的概率至少得到一个 false positive。
```

**Bonferroni correction:**अल्फा को अलग करके परीक्षण करें।

```
Adjusted alpha = alpha / m = 0.05 / 20 = 0.0025

只有当 p-value < 0.0025 时才 reject H0。
保守但简单。在 tests 独立时有效。
```

ML में, जब आप कई मापदंडों तुलना मॉडल, परीक्षण कई हाइपरपरमैटर विन्यास, या कई डेटासेट पर मूल्यांकन करते हैं, तो यह महत्वपूर्ण है।

### बूटस्ट्रैप विधि

बूटस्ट्रैपिंग  डेटा के माध्यम से किसी सांख्यिकीय के नमूना वितरण का अनुमान लगाने के लिए पुनः नमूनाकरण किया जाता है 

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

यह जोड़ी टी-टेस्ट से अधिक स्थिर है, क्योंकि यह वितरण परिकल्पना नहीं करता है।

### पैरामेट्रिक बनाम गैर-परमेट्रिक परीक्षण

**Parametric tests**假设特定分布 (आमतौर पर सामान्य):

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

ML प्रयोगों में, आप आमतौर पर केवल बहुत छोटे n  5 या 10 क्रॉस-वैलिडेशन फोल्ड करते हैं), इसलिए Wilcoxon के हस्ताक्षरित-रैंक जैसे गैर-परिमाट्रिक परीक्षण 往往比 t-टेस्ट 更合适──

### केंद्रीय सीमा प्रमेय: वास्तविक प्रभाव

सीएलटी से पता चलता है कि जैसे-जैसे नैनो का संप्रदाय बढ़ता है, वैसे-वैसे जनसंख्या का निचला स्तर क्या होता है, वैसे-वैसे नैनो का वितरण सामान्य वितरण के करीब आता है।

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

### सामान्यतः होने वाली सांख्यिकीय त्रुटियां

1. **在 training set 上测试。**प्रशिक्षण के दौरान कभी नहीं देखे गए डेटा को हमेशा छोड़ दिया जाता है।

2. **没有 confidence intervals。**केवल एक सटीकता रिपोर्ट संख्यात्मक अनिश्चितता को स्पष्ट नहीं करता है, परिणाम को अपरिवर्तनीय और अमान्य बना देगा।

3. **忽略 multiple comparisons。**测试 50 个配置并未进行校正的情况下报告最好的一个,会提高虚假阳性率――

4. **混淆 statistical 和 practical significance。**0.01% सटीकता 提升上 p-मूल्य = 0.001 并没有意义──

5. **在 imbalanced data 上使用 accuracy。**एक 99% नकारात्मक वर्ग के डेटासेट ऊपर 99% सटीकता तक पहुँचने का मतलब है मॉडल क्या भी नहीं सीखा गया है।

6. **Cherry-picking metrics。**केवल अपने मॉडल की जीत की मेट्रिक्स रिपोर्ट करें।

7. **在 train/test splits 之间泄露信息。**之前做正常化, या भविष्य के डेटा पूर्वानुमान के साथ

8. **小 test sets 且没有 variance estimates。**100 नमूनों में ऊपर मूल्यांकन और 2% वृद्धि का दावा किया, यह शोर है, नहीं संकेतों।

9. **在数据不独立时假设 independence。**एक ही रोगी की चिकित्सा छवियों से, एक ही दस्तावेज के कई वाक्यों से, समूह में अवलोकन संबंधित हैं।

10. **P-hacking。**विभिन्न परीक्षणों, उपसमूहों या बहिष्करण मानदंडों का प्रयास करना, जब तक कि p < 0.05 प्राप्त न हो। परिणाम केवल खोज प्रक्रिया का कलाकृतियाँ हैं।

## इसे बनाना


```figure
f3-bootstrap-resample
```

आप को पूरा होगाः

1. **从零实现 descriptive statistics**(मध्यम,मौसम,मानक विचलन,प्रतिशत,IQR)
2. **Correlation functions**(पीयरसन और स्पीयरमैन, साथ ही साथ सह-विवर्तन मैट्रिक्स)
3. **Hypothesis tests**(एक नमूना टी-टेस्ट、दो नमूना टी-टेस्ट、ची-क्वायर टेस्ट)
4. **Bootstrap confidence intervals**(आच्छिक सांख्यिकीय के लिए उपयुक्त, बिना किसी假设 की आवश्यकता)
5. **A/B test simulator**(आवेदन, परीक्षण, जांच प्रकार I और प्रकार II त्रुटियों का उत्पादन)
6. **Statistical vs practical significance demo**(प्रदर्शन करना कैसे सब कुछ महत्वपूर्ण हो जाता है)

सभी शून्य से पूर्ण, केवल उपयोग `math`和 `random`不使用 numpy,不使用 scipy。

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
