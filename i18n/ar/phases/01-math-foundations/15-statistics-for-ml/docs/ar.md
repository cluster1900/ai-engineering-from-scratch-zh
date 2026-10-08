# التعلم الآلي 统计学

> الإحصاءات تُخبرك أن نموذجك فعّال حقاً، أم فقط يُمْرُ بصدفة

**Type:** Build
**Language:**بايثون
**前置要求：**المرحلة الأولى الدروس 06 (احتمالات وتوزيعات) ،07 (نظرية بايز)
**Time:** ~120 分钟

## 學习目标
- من صفر حساب الإحصاءات التفصيلية ‧تواصل بيرسون/سبيرمان 和 ماتريشات التباين
- 执行 hypothesis tests(t-test、chi-squared),并正确解释 p-قيم 和 فترات الثقة
- استخدام bootstrap resampling لأي متري  بناء فترات الثقة، دون الاعتماد على افتراض التوزيع
- استخدام تدابير حجم التأثيرات 区分统计意义与实用意义

## 问题
تم تدريب النموذجين. النموذج أ على مجموعة الاختبارات كانت النتيجة 0.87. النموذج ب على النتيجة 0.89. تم نشر النموذج ب.

النموذج ب  في الواقع ليس أفضل من النموذج أ ∙ 0.02 الاختلاف هو مجرد الضجيج ∙ مجموعتك الاختبارية صغيرة جدا أو تكون مربعها مرتفعة جدا أو كلاهما موجودة ∙ أنت وضعت حزمة عشوائية في تحسين نشرتها ∙

هذا هو السبب الأساسي: قد تمت تجاوز الإحصاءات.

الإحصاءات تُعطيك أداة لتمييز الإشارات والضوضاء. إنها تخبرك متى يكون الفرق حقيقيًا، وكيف يجب أن تكون على دراية، وكيف تحتاج إلى البيانات قبل أن تصدق نتيجة.

## 概念
### الإحصاءات التفصيلية: 总结你的数据

قبل أن تبني أي شيء، تحتاج إلى معرفة كيفية البيانات. الإحصاءات التفصيلية سوف تضغط مجموعة بيانات إلى عدد قليل من الأرقام التي يمكن أن تلتقط شكلها.

**Measures of central tendency** وسط وسط أين؟

```
Mean:   所有值之和 / 数量
        mu = (1/n) * sum(x_i)

Median: 排序后的中间值
        对 outliers 稳健。如果你有 [1, 2, 3, 4, 1000]，mean 是 202，
        但 median 是 3。

Mode:   出现最频繁的值
        对 categorical data 有用。对 continuous data，通常信息量很低。
```

متوسط هو نقطة توازن. متوسط هو نقطة وسط. عند الانحراف، توزيعك هو منحرف. توزيع الدخل عادة ما يعني >> متوسط (من خلال المليارات من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من الملايين من المتناسبة.

**Measures of spread**هل هناك احتمالات؟

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

**Percentiles**ضع ترتيبات بعد البيانات إلى 100 个相等部分──第 25 percentile(Q1) يعبر عن قيمة 25% أقل من هذا النقطة──第 50 percentile هي المتوسط──第 75 percentile هي Q3──

```
用于 latency monitoring:
  P50 = median latency        （典型用户体验）
  P95 = 95th percentile       （较差但不是最坏情况）
  P99 = 99th percentile       （tail latency，通常是 median 的 10 倍）
```

في ML، سوف تركز على الفئات، لاستخدام استنتاج تأخرات التنبؤ توزيعات الثقة، فضلا عن فهم توزيعات الخطأ.

**Sample vs population statistics.**من العينة 计算变量 时,用 (n-1) بدلا من n 作为除数──这是 تصحيحة بيسل──它补偿了样本的意思 不是真实人口的意思 这一事实──如果分母是n,你会系统性低估真实变量──如果分母是 (n-1),估算是无偏的──

```
Population variance: sigma^2 = (1/N) * sum((x_i - mu)^2)
Sample variance:     s^2     = (1/(n-1)) * sum((x_i - x_bar)^2)
```

في الممارسة: إذا كان عدد العينات ضخمًا ، فيمكن تجاهل التفاوت.

### التواصل: 变量 كيف تتغير معا

العلاقة: قياس قوة والإتجاه للعلاقة بين متغيرين.

**Pearson correlation coefficient**衡量线性关联:

```
r = sum((x_i - x_bar)(y_i - y_bar)) / (n * s_x * s_y)

r = +1:  完美正线性关系
r = -1:  完美负线性关系
r =  0:  无线性关系（但可能存在非线性关系！）

Range: [-1, 1]
```

بيرسون افتراض العلاقة هي خطية، وكلتا المتغيرات تتبع التوزيع الطبيعي.

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

**黄金法则：**التواصل لا يعني السبب.  حجم الجليد والمياه الغرقية مرتبطة، لأن الثانية كلها تزداد في فصل الصيف.  دقة النموذج و  عدد العناصر مرتبطة، ولكن الزيادة في العناصر لن تحسن دقة تلقائيا.  انظر: التكيف) 

### المصفوفة المتكافئة

التغيرات المتجانسة بين المتغيرين

```
Cov(X, Y) = (1/n) * sum((x_i - x_bar)(y_i - y_bar))

Cov(X, Y) > 0:  X 和 Y 倾向于一起增加
Cov(X, Y) < 0:  当 X 增加时，Y 倾向于减少
Cov(X, Y) = 0:  无线性共同变化
```

بالنسبة لميزات d 个, المصفوفة C هي واحدة d x d المصفوفة, منها C[i][j] = Cov(ميزة_i, feature_j)。对角线项 C[i][i] 是每个 ميزة من التباينات。

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

**与 PCA 的联系。**PCA لمصفوفة التباينات جعل التركيب الخاصها. الموجات هي المكونات الرئيسية. القيم الموجية هي تخبرك كل مكون.

**与 correlation 的联系。**المصفوفة التواصل هي المصفوفة التواصلية للتغيرات القياسية ((كل متغيرات مدفوعة بعكس الاختلافات القياسية الخاصة بها) ―― التواصل سوف يعود إلى التواصلية التواصلية، مما يجعل كل القيمة تقع في [-1, 1]。

### اختبار الفرضية

اختبار الفرضية هو إطار للقيام بإجراء قرارات تحت عدم اليقين. تبدأ من رأي واحد، وتجمع البيانات، ثم تقرر ما إذا كانت البيانات تتفق مع رأي واحد.

**设置：**

```
Null hypothesis (H0):        默认假设，通常是“无效应”
Alternative hypothesis (H1): 你试图证明的内容

Example:
  H0: Model A 和 Model B 具有相同 accuracy
  H1: Model B 的 accuracy 高于 Model A
```

**p-value**هو في H0 هو حقيقي، انظر إلى احتمالية البيانات التي تتراوح مع البيانات التي تلاحظها.

```
p-value = P(data this extreme | H0 is true)

If p-value < alpha（通常是 0.05）:
    Reject H0。结果是“statistically significant”。
If p-value >= alpha:
    Fail to reject H0。你没有足够证据。
    这并不意味着 H0 为真。
```

**Confidence intervals**عطاء مجموعة من العناصر القيم المثيرة للصدق:

```
mean 的 95% confidence interval:
    x_bar +/- z * (s / sqrt(n))

where z = 1.96 for 95% confidence

解释：如果你重复这个实验很多次，计算得到的 intervals 中有 95%
会包含 true mean。它并不意味着 true mean 有 95% 的概率落在这个
具体 interval 中。
```

عرض عرض الوصول إلى الموقع يخبرك بالدقة.

### اختبار التأثير

اختبار تقييم الوسائل.

**One-sample t-test:**هل معدل السكان يختلف عن قيمة افتراضية؟

```
t = (x_bar - mu_0) / (s / sqrt(n))

degrees of freedom = n - 1
```

**Two-sample t-test (independent):**هل تعني مجموعة 两组 是否不同؟

```
t = (x_bar_1 - x_bar_2) / sqrt(s1^2/n1 + s2^2/n2)

这是 Welch's t-test，它不假设 equal variances。
除非你有特定理由假设 equal variances，否则始终使用 Welch's。
```

**Paired t-test:**عندما تظهر القياسات 成对出现时(同一个模型在相同数据分开上评估):

```
对每一对计算 d_i = x_i - y_i
然后在 d_i values 上针对 mu_0 = 0 运行 one-sample t-test
```

في ML، اختبار t المزدوج هو شائع جدا: أنت في نفس 10 طوابق التحقق المتقاطع فوق عمل اثنين من النماذج، ومقارنتها مع النتائج.

### اختبار المربع (شي)

اختبار المربع من المعدل الثاني  تفتيش ترددات الملاحظة 是否匹配预期频率──对类数据 有用──

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

### اختبار A/B لنماذج ML

اختبار A/B في ML ومختبر A/B على شبكة الإنترنت مختلفة.

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

### الأهمية الإحصائية مقابل الأهمية العملية

يمكن أن يكون النتيجة ذات أهمية إحصائية، ولكن لا معنى لها في الممارسة العملية.

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

**Effect size**التباين الكمي كبير جداً و مستقل عن حجم العينة:

```
Cohen's d = (mean_1 - mean_2) / pooled_std

d = 0.2:  small effect
d = 0.5:  medium effect
d = 0.8:  large effect
```

始终同时报告 p-value 和效果大小──p-value 告诉你差异是否真实──效果大小──告诉你差异是否重要──

### مشكلة مقارنة متعددة

عندما تقوم بتحقق من العديد من الفرضيات، بعضها يصبح مهماً بسبب الصدفة. إذا كنت في ألفا = 0.05، فإنك تتوقع أن تظهر 1 إيجابية خاطئة.

```
P(at least one false positive) = 1 - (1 - alpha)^m

m = 20 tests, alpha = 0.05:
P(false positive) = 1 - 0.95^20 = 0.64

你有 64% 的概率至少得到一个 false positive。
```

**Bonferroni correction:**سوف أضع الألفا في اختبارات

```
Adjusted alpha = alpha / m = 0.05 / 20 = 0.0025

只有当 p-value < 0.0025 时才 reject H0。
保守但简单。在 tests 独立时有效。
```

في ML، عندما تتجاوز العديد من المقاييس مقارنة النموذج، اختبار العديد من تشكيلات المعلمات العالية، أو عند تقييم مجموعة بيانات متعددة، هذا أمر مهم.

### طرق التشغيل

التمهيد من خلال إجراء إعادة أخذ العينات من خلال البيانات لتقدير توزيع العينات في إحصائيات معينة.

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

هذا أفضل من اختبار التزامن أكثر استقرارًا لأنه لا يقدم افتراضات توزيع.

### الاختبارات المعلمية مقابل غير المعلمية

**Parametric tests**假设特定分布(عادة ما تكون طبيعية):

```
t-test:         假设数据 normal distributed（或由于 CLT 而 n 很大）
ANOVA:          假设 normality 和 equal variances
Pearson r:      假设 bivariate normality
```

**Non-parametric tests**غير مقسمة:

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

في تجربة ML، عادة ما تكون لديك فقط عدد صغير من n 5 أو 10 طوابق التحقق المتقاطع) ، لذلك مثل Wilcoxon وقعت على المرتبة هذه النوع من الاختبارات غير المعلمية 往往比 t-اختبارات 更合适──

### نظرية الحد المركزي: التأثير الحقيقي

أظهرت اللجنة التجارية، مع زيادة عدد العينات، أن توزيع المعايير سيتم تقاربها إلى التوزيع الطبيعي، بغض النظر عن التوزيع السكاني الأساسي.

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

1. **在 training set 上测试。**ضمان التفاضل المفرط. دائما ترك ما دخل النموذج في التدريب.

2. **没有 confidence intervals。**فقط تقرير دقة العدد دون أن يوضح عدم اليقين، وسوف تجعل النتيجة غير قابلة للتعديل وغير قابلة للتحقق.

3. **忽略 multiple comparisons。**测试 50 تكوينات غير في حالة عدم التحسين تقرير أفضل واحد، سوف ترتفع معدلات إيجابية كاذبة.

4. **混淆 statistical 和 practical significance。**دقة 0.01٪ 提升 p-قيمة = 0.001 并没有意义──

5. **在 imbalanced data 上使用 accuracy。**مجموعة بيانات من فئة سلبية 99٪ تصل إلى دقة 99٪ ، مما يعني أن النموذج لا يتعلم.

6. **Cherry-picking metrics。**فقط تقرير المقاييس التي فاز فيها نموذجك.

7. **在 train/test splits 之间泄露信息。**في الانقسام  قبل القيام بتطبيع، أو باستخدام مستقبل البيانات التوقعات الماضي.

8. **小 test sets 且没有 variance estimates。**في 100 عينة، قالوا أن هناك ارتفاع بنسبة 2٪، هذا هو الضجيج، وليس الإشارة.

9. **在数据不独立时假设 independence。**صور طبية من نفس المريض، من عدة جمل من نفس الملفات، وملاحظات في مجموعة هي ذات صلة.

10. **P-hacking。**حاولي دائماً اختبارات مختلفة أو مجموعات فرعية أو معايير استبعاد حتى تحصل على p < 0.05، والنتيجة هي مجرد عملية بحث

## بناءها


```figure
f3-bootstrap-resample
```

ستحقيق:

1. **从零实现 descriptive statistics**(متوسط، متوسط، وضع، انحراف معياري، نسبة مئوية، معدل الكفاءة)
2. **Correlation functions**(بيرسون و سبيرمان، فضلا عن المصفوفة التجاوبية)
3. **Hypothesis tests**(اختبار الـ 1 عينة t-test ∙ اختبار الـ 2 عينة t-test ∙ اختبار الـ Chi-squared)
4. **Bootstrap confidence intervals**(مُصادقة للإحصاءات المتعلقة بالشكل، لا تحتاج إلى فرض)
5. **A/B test simulator**(إنتاج بيانات 测试 检查 نوع I و الخطأ نوع II)
6. **Statistical vs practical significance demo**(تعرض كيف يجعل كل شيء مهم)

كل شيء من صفر لتحقيقه فقط`math`和 `random`。不使用numpy,不使用scipy。

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
