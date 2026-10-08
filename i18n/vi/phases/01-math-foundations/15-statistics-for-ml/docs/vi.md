# Máy học 统计学

> Thống kê cho bạn biết mô hình của bạn thực sự hiệu quả, hoặc chỉ là ngẫu nhiên chạy.

**Type:** Build
**Language:**Python
**前置要求：**Giai đoạn 1, Bài học 06 (Tình lí và phân phối),07 (Định lý Bayes)
**Time:** ~120 分钟

## Học mục tiêu
- Từ zero计算 thống kê mô tả, mối tương quan Pearson/Spearman và các matrix sự tương thích
- 执行 giả thuyết test ((t-test 、chi-quad),并正确解释 p-đáng giá 和 confidence interval
- Sử dụng bootstrap resampling để tạo ra các khoảng thời gian tin cậy, không phụ thuộc vào giả thuyết phân bố
- Sử dụng các biện pháp kích thước hiệu ứng 区分 thống kê ý nghĩa với ý nghĩa thực tế

## 问题
Bạn đã đào tạo hai mô hình. Mô hình A trên tập hợp thử nghiệm đạt điểm 0,87. Mô hình B đạt điểm 0,89. Bạn đã triển khai mô hình B.

Mô hình B thực sự không tốt hơn mô hình A──0.02 khác biệt chỉ là tiếng ồn──con số thử nghiệm của bạn quá nhỏ, hoặc quá cao, hoặc cả hai đều có── bạn đã đưa gói tùy tiện vào cải tiến và phát hành ra ngoài──

Tình huống này đã xảy ra. Đường xếp hạng của bảng xếp hạng Kaggle trục trặc. Không thể hoàn thành bài báo.

Thống kê cho bạn một công cụ để phân biệt tín hiệu và tiếng ồn. Nó cho bạn biết khi nào sự khác biệt là thực, bạn nên có một hiểu biết lớn, cũng như bao nhiêu dữ liệu cần trước khi tin vào một kết quả. Mỗi dòng đường ống ML, mỗi mô hình so sánh, mỗi thí nghiệm đều cần thống kê. Không có nó, bạn chỉ cần đoán.

## 概念
### Thống kê mô tả: 总结你的数据

Trước khi xây dựng bất cứ thứ gì, bạn cần biết dữ liệu dài như thế nào.

**Measures of central tendency**回答中间在哪里?

```
Mean:   所有值之和 / 数量
        mu = (1/n) * sum(x_i)

Median: 排序后的中间值
        对 outliers 稳健。如果你有 [1, 2, 3, 4, 1000]，mean 是 202，
        但 median 是 3。

Mode:   出现最频繁的值
        对 categorical data 有用。对 continuous data，通常信息量很低。
```

trung bình là điểm cân bằng, trung bình là điểm trung bình. Khi người khác rời đi, phân bố của bạn là bị lệch.

**Measures of spread**                                                                                                                                                                                                                                                              

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

**Percentiles**Để phân chia dữ liệu sau thứ tự thành 100 个相等部分──第 25 phần trăm(Q1) cho thấy 25% giá trị thấp hơn điểm này──第 50 phần trăm là trung bình──第 75 phần trăm là Q3──

```
用于 latency monitoring:
  P50 = median latency        （典型用户体验）
  P95 = 95th percentile       （较差但不是最坏情况）
  P99 = 99th percentile       （tail latency，通常是 median 的 10 倍）
```

Trong ML, bạn sẽ tập trung vào phần trăm, sử dụng để suy luận độ trễ, phân phối sự tin tưởng dự đoán, cũng như hiểu phân phối lỗi. Một lỗi trung bình rất thấp nhưng lỗi P99 rất tồi tệ, cho các ứng dụng quan trọng về an toàn có thể không có ích gì.

**Sample vs population statistics.**Từ mẫu 计算 biến số 时, dùng (n-1) thay vì n như số trừ số. Đây là sự sửa đổi của Bessel. Nó bù đắp cho mẫu trung bình không phải là thực dân trung bình.

```
Population variance: sigma^2 = (1/N) * sum((x_i - mu)^2)
Sample variance:     s^2     = (1/(n-1)) * sum((x_i - x_bar)^2)
```

Thực tế: Nếu n  rất lớn ((1000 mẫu), sự khác biệt có thể bị bỏ qua. Nếu n  rất nhỏ ((几十样), nó là rất quan trọng.

### Sự tương quan: 变量如何一起变化

Sự tương quan đo lường cường độ và hướng của mối quan hệ liên quan giữa hai biến động.

**Pearson correlation coefficient**衡量线性关联:

```
r = sum((x_i - x_bar)(y_i - y_bar)) / (n * s_x * s_y)

r = +1:  完美正线性关系
r = -1:  完美负线性关系
r =  0:  无线性关系（但可能存在非线性关系！）

Range: [-1, 1]
```

Pearson giả định mối quan hệ là tuyến tính, và hai biến đều tuân theo phân bố bình thường. Nó nhạy cảm với các điểm ngoại lệ.

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

**黄金法则：**Sự tương quan không có nghĩa là nguyên nhân. Số lượng băng và số người chết đuối liên quan, vì hai thứ đều tăng trong mùa hè.

### Matrix tính hợp tác

 Sự khác nhau giữa hai biến thể  đo lường cách chúng thay đổi chung:

```
Cov(X, Y) = (1/n) * sum((x_i - x_bar)(y_i - y_bar))

Cov(X, Y) > 0:  X 和 Y 倾向于一起增加
Cov(X, Y) < 0:  当 X 增加时，Y 倾向于减少
Cov(X, Y) = 0:  无线性共同变化
```

Đối với d 个 tính năng, matrix covariance C là một d x d Matrix, trong đó C[i][j] = Cov(feature_i, feature_j)。 đối với các góc line C[i][i] là sự khác biệt của mỗi tính năng。

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

**与 PCA 的联系。**PCA đối với matrix có biến thể làm cho cấu trúc riêng của mình. Eigenvectors là các thành phần chính. Eigenvalues nói với bạn mỗi thành phần đã nắm bắt được bao nhiêu biến thể. Đây chính là nội dung của Bài học 10.

**与 correlation 的联系。**Matrix tương quan là matrix covariance của các biến số chuẩn hóa (standardised variable) (các biến số đều trừ bằng cách lệch chuẩn của riêng mình).

### Kiểm tra giả thuyết

Phân tích giả thuyết là một khuôn khổ để đưa ra quyết định trong sự không chắc chắn. Bạn bắt đầu từ một chủ đề, thu thập dữ liệu, sau đó quyết định liệu dữ liệu có phù hợp với chủ đề đó hay không.

**设置：**

```
Null hypothesis (H0):        默认假设，通常是“无效应”
Alternative hypothesis (H1): 你试图证明的内容

Example:
  H0: Model A 和 Model B 具有相同 accuracy
  H1: Model B 的 accuracy 高于 Model A
```

**p-value**H0 là xác suất thực, nhìn vào dữ liệu cực cùng với dữ liệu bạn quan sát. Nó không phải là H0 là xác suất thực. Đây là sự hiểu lầm phổ biến nhất trong thống kê.

```
p-value = P(data this extreme | H0 is true)

If p-value < alpha（通常是 0.05）:
    Reject H0。结果是“statistically significant”。
If p-value >= alpha:
    Fail to reject H0。你没有足够证据。
    这并不意味着 H0 为真。
```

**Confidence intervals**给出 một nhóm các giá trị hợp lý:

```
mean 的 95% confidence interval:
    x_bar +/- z * (s / sqrt(n))

where z = 1.96 for 95% confidence

解释：如果你重复这个实验很多次，计算得到的 intervals 中有 95%
会包含 true mean。它并不意味着 true mean 有 95% 的概率落在这个
具体 interval 中。
```

Độ rộng của khoảng thời gian tin cậy cho bạn biết độ chính xác.

### Thử nghiệm t

T-test 比较 phương tiện. Có vài hình thức.

**One-sample t-test:**dân số có khác với một giả định?

```
t = (x_bar - mu_0) / (s / sqrt(n))

degrees of freedom = n - 1
```

**Two-sample t-test (independent):**两组 nhóm có nghĩa là có khác nhau không?

```
t = (x_bar_1 - x_bar_2) / sqrt(s1^2/n1 + s2^2/n2)

这是 Welch's t-test，它不假设 equal variances。
除非你有特定理由假设 equal variances，否则始终使用 Welch's。
```

**Paired t-test:**Khi các phép đo 成对出现时(同一个模型在相同数据分上评估):

```
对每一对计算 d_i = x_i - y_i
然后在 d_i values 上针对 mu_0 = 0 运行 one-sample t-test
```

Trong ML, t-test đôi  rất phổ biến: bạn đang trong cùng 10 lần xác nhận chéo trên chạy hai mô hình, và từng so sánh điểm số của chúng.

### Kiểm tra hình vuông

Kiểm tra tần số quan sát được kiểm tra là không phù hợp với tần số dự kiến.

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

### Kiểm tra A/B cho các mô hình ML

Các thử nghiệm A/B trong ML và thử nghiệm A/B trên Web khác nhau.

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

### Tầm quan trọng thống kê so với tầm quan trọng thực tế

Một kết quả có thể là đáng kể về mặt thống kê, nhưng trên thực tế là vô nghĩa.

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

**Effect size**Sự khác biệt về quy mô có nhiều, và độc lập với kích thước mẫu:

```
Cohen's d = (mean_1 - mean_2) / pooled_std

d = 0.2:  small effect
d = 0.5:  medium effect
d = 0.8:  large effect
```

始终同时报告 p-value 和效果大小──p-value 告诉你差异是否真实──效果大小──告诉你差异是否重要──

### Vấn đề so sánh nhiều lần

Khi bạn kiểm tra rất nhiều giả thuyết, một số trong số đó sẽ trở nên quan trọng bởi tình cờ. Nếu bạn kiểm tra 20 điều, ngay cả khi không có bất kỳ hiệu ứng thực nào, cũng dự kiến sẽ xuất hiện 1 dương tính sai.

```
P(at least one false positive) = 1 - (1 - alpha)^m

m = 20 tests, alpha = 0.05:
P(false positive) = 1 - 0.95^20 = 0.64

你有 64% 的概率至少得到一个 false positive。
```

**Bonferroni correction:**Để alpha trừ bằng các thử nghiệm số lượng.

```
Adjusted alpha = alpha / m = 0.05 / 20 = 0.0025

只有当 p-value < 0.0025 时才 reject H0。
保守但简单。在 tests 独立时有效。
```

Trong ML, khi bạn vượt qua nhiều métrics, so sánh mô hình, thử nghiệm nhiều cấu hình siêu tham số, hoặc đánh giá trên nhiều tập dữ liệu, điều này rất quan trọng.

### Các phương pháp bootstrap

Bootstrapping 通过对数据进行有放回样本来估计某个统计数据的样本分布──不需要对底层分布做假设──

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

Đây là một thử nghiệm t-tết hợp nhất, vì nó không làm giả định phân bố.

### Các thử nghiệm tham số so với các thử nghiệm không tham số

**Parametric tests**假设特定分布 (thường là bình thường):

```
t-test:         假设数据 normal distributed（或由于 CLT 而 n 很大）
ANOVA:          假设 normality 和 equal variances
Pearson r:      假设 bivariate normality
```

**Non-parametric tests**Không làm giả định phân bố:

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

Trong thí nghiệm ML, bạn thường chỉ có n nhỏ n(5 hoặc 10 gấp hợp hợp hợp lệ chéo), vì vậy như Wilcoxon ký-đang như các bài kiểm tra không tham số này 往往比 t-test 更合适──

### Lý thuyết giới hạn trung tâm: tác động thực tế

CLT cho thấy, theo n 增长, phân bố phương tiện mẫu sẽ gần như phân phối bình thường, bất kể phân bố dân số tầng dưới là gì.

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

1. **在 training set 上测试。**Bảo đảm quá phù hợp.

2. **没有 confidence intervals。**Chỉ báo một sự chính xác số không thể hiện sự không chắc chắn, sẽ làm cho kết quả không thể xác minh và không thể xác minh.

3. **忽略 multiple comparisons。**测试 50 cấu hình không có sự điều chỉnh trong trường hợp báo cáo tốt nhất, sẽ tăng tỷ lệ dương tính sai.

4. **混淆 statistical 和 practical significance。**0,01% chính xác 提升上的 p-值 = 0,001 并没有意义──

5. **在 imbalanced data 上使用 accuracy。**Một tập dữ liệu của lớp âm 99% lên đạt độ chính xác 99%, có nghĩa là mô hình không được học.

6. **Cherry-picking metrics。**Chỉ báo métrics của mô hình của bạn chiến thắng.

7. **在 train/test splits 之间泄露信息。**Trong chia  trước làm bình thường hóa, hoặc sử dụng dữ liệu tương lai dự đoán quá khứ.

8. **小 test sets 且没有 variance estimates。**Trong 100 mẫu, người đánh giá đã tuyên bố có 2% tăng, đó là tiếng ồn, không phải là tín hiệu.

9. **在数据不独立时假设 independence。**Từ hình ảnh y tế của cùng một bệnh nhân, từ nhiều câu trong cùng một tài liệu.

10. **P-hacking。**Không ngừng thử các thử nghiệm khác nhau, các nhóm phụ hoặc các tiêu chí loại trừ cho đến khi có được p < 0.05. Kết quả chỉ là một tác phẩm của quá trình tìm kiếm.

## Xây dựng nó


```figure
f3-bootstrap-resample
```

Bạn sẽ thực hiện:

1. **从零实现 descriptive statistics**(tỷ lệ trung bình, chế độ, lệch tiêu chuẩn, tỷ lệ phần trăm, IQR)
2. **Correlation functions**(Pearson và Spearman, cũng như matrix tính biến số)
3. **Hypothesis tests**(một mẫu t-test, hai mẫu t-test, chi-quad test)
4. **Bootstrap confidence intervals**(được áp dụng cho số liệu thống kê tùy ý, không cần giả định)
5. **A/B test simulator**(tạo dữ liệu, kiểm tra, kiểm tra lỗi loại I và loại II)
6. **Statistical vs practical significance demo**(thể hiện cách làm mọi thứ trở nên quan trọng)

Tất cả từ không thực hiện, chỉ sử dụng `math`和 `random`❖不使用 numpy,不使用 scipy。

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
