# 生产模型监控：数据漂移与概念漂移

> 已部署的模型可能在不报错的情况下失效。现实逐渐偏离训练数据，模型却仍持续返回分数，只有监控才能揭示这种差距。

**Type:** Build
**Languages:** Python
**Prerequisites:** 阶段 2，第 09 课（模型评估）、第 16 课（异常检测）和第 19 课（ML 系统设计）
**Time:** 约 110 分钟

## 学习目标

- 在系统健康、输入、预测和结果四个层面选择监控信号
- 根据联合分布中变化的部分，区分协变量漂移、先验漂移与概念漂移
- 从零实现群体稳定性指数、双样本 Kolmogorov-Smirnov 统计量和卡方检验
- 将固定参考窗口与滑动当前窗口比较，解释窗口大小如何影响噪声和延迟
- 设计结合效应量、多重检验校正和持续性规则的告警策略，限制误报
- 判断哪种漂移需要重新训练、哪种需要新标签、哪种无需处理

## 问题

一个支付风险模型以 95% 的准确率上线。两个月后，营销活动带来购物金额更高的应用用户。四个月后，欺诈者改变策略，以前安全的支付开始变成拒付。

整个过程中，模型服务对每个请求都返回 HTTP 200。延迟正常，日志没有错误。最早的问题迹象是数周后的一份财务拒付报告，此时损失早已发生。

软件监控检查服务是否响应，模型监控检查答案是否仍然正确，以及数据是否还像训练时的数据。本课为后者构建统计量、窗口和告警策略。你将在人工注入两种变化的合成流上运行它们，观察哪些监控器会响应哪种变化。

## 核心概念

### 监控什么

监控四个层面。前三层提供早期预警，只有第四层测量正确性，但它来得较晚。

| 层面 | 信号 | 何时可用 | 回答的问题 |
|---|---|---|---|
| 系统健康 | p50/p99 延迟、错误率、吞吐量、内存 | 立即 | 服务是否响应？ |
| 输入 | 各特征分布、缺失率、模式、新类别 | 立即 | 线上数据是否像训练数据？ |
| 预测 | 分数分布、正预测比例、默认答案占比 | 立即 | 模型行为是否与以前一致？ |
| 结果 | 准确率、精确率、校准度、业务指标 | 标签延迟后 | 模型是否仍然正确？ |

本课主要讨论输入监控，因为它在标签到达前就可工作。但演示也会展示其局限：有些变化完全不会改变输入。

### 三类漂移

输入 `x` 和标签 `y` 的联合分布可以写成两种形式：

```math
P(x, y) = P(x) \cdot P(y \mid x) = P(y) \cdot P(x \mid y)
```

每类漂移改变不同的因子：

| 漂移 | 变化部分 | 保持不变的部分 | 支付示例 | 能观察到的监控器 |
|---|---|---|---|---|
| 协变量漂移 | `P(x)` | `P(y \| x)` | 高购物金额的应用用户变多 | 输入监控 |
| 先验漂移 | `P(y)` | `P(x \| y)` | 攻击期间欺诈率翻倍，但欺诈特征不变 | 预测与结果监控 |
| 概念漂移 | `P(y \| x)` | 输入可以不变 | 相同购物金额对应不同欺诈风险 | 只有结果监控 |

Gama 等人将 `P(y | x)` 的变化称为真实概念漂移，将不改变 `P(y | x)` 的 `P(x)` 变化称为虚拟漂移。他们的综述还按时间模式将漂移分为突发、增量、渐进和概念复现。

协变量漂移不一定有害。如果模型学好了 `P(y | x)`，对每种输入仍能正确预测。但当流量移向训练样本稀少或靠近决策边界的区域时，准确率仍可能下降。

### 延迟标签

结果出现在预测之后。延迟取决于问题：

| 问题 | 标签何时到达 |
|---|---|
| 广告点击 | 数秒后 |
| 未来 30 天流失 | 30 天后 |
| 银行卡欺诈 | 拒付到达时，通常数周后 |
| 贷款违约 | 数月或数年后 |

延迟期间，你拥有输入和预测，却没有结果。先监控输入与预测，标签到达后进行关联，只在已标注部分计算结果指标。演示的标签延迟为 500 个事件，因此结果监控总是在观察 500 个事件之前的情况。

### 参考窗口与当前窗口

每种漂移检验都比较两个样本：

- **参考窗口。** 训练数据，或人工检查过的一段生产数据。在重新训练前保持固定。
- **当前窗口。** 最近的事件，可以是最近 `N` 个事件，也可以是最近 `T` 小时。

滑动窗口每次前进的步长小于窗口大小，因此连续窗口重叠。滚动窗口每次前进完整窗口大小。窗口大小是一种取舍：小窗口反应快，却容易把噪声判为漂移；大窗口稳定，却较晚报告变化。

季节性会破坏简单的窗口方案。许多产品周一与周六的流量不同。让参考覆盖完整周期，或将当前窗口与前一周期相同时段比较。

### 群体稳定性指数

PSI 源于信用评分。将参考值分箱，通常按参考十分位数划为十箱，使每箱包含参考样本的 10%。统计当前值落入各箱的占比，再将每箱的一项贡献求和：

```math
\text{PSI} = \sum_{\text{bins}} (\text{current\_share} - \text{reference\_share}) \cdot \ln\left(\frac{\text{current\_share}}{\text{reference\_share}}\right)
```

某箱占比为零会使对数无穷大，因此将每个占比截断到 0.0001 等小正数。PSI 是对称的，等于当前分布到参考分布的 KL 散度，加上反方向的 KL 散度。

实践中常用固定区间解释 PSI：低于 0.1 为稳定，0.1 到 0.25 为中等偏移，高于 0.25 为显著偏移。这些是经验惯例，不是统计检验。PSI 随分箱数增大而增大，随样本量增大而减小。在演示中，没有漂移的 500 事件窗口得分约为 0.01 到 0.04。

### Kolmogorov-Smirnov 统计量

双样本 KS 统计量 `D` 是两个经验累积分布函数之间最大的垂直差距：

```math
D = \max_x \left\lvert F_{\text{reference}}(x) - F_{\text{current}}(x) \right\rvert
```

样本完全相同时 `D` 为 0，完全不重叠时为 1。它无需分箱。p 值由 Kolmogorov 分布结合有效样本量 `n * m / (n + m)` 得到。

样本量很大时，即使毫无实际意义的差距也会使 p 值趋近于零。每个窗口有一百万事件时，0.02 个标准差的偏移也可能“显著”。将 `D` 本身作为效应量，只有 `D` 和 p 值都满足各自阈值条件时才告警。

### 类别特征的卡方检验

对于支付渠道等类别特征，构建两行（参考、当前）、每类别一列的表。每个单元格的期望计数由行总数和列总数确定：

```math
\begin{aligned}
\text{expected}[r][c] &= \text{row\_total}[r] \cdot \text{column\_total}[c] / \text{grand\_total} \\
\text{chi2} &= \sum_{\text{cells}} (\text{observed} - \text{expected})^2 / \text{expected}
\end{aligned}
```

对于 `k` 个类别，检验自由度为 `k - 1`。只在当前窗口出现的类别会贡献较大的项，因此检验能响应新值。Cramér's V 是效应量。对于两行表，它等于 `chi2 / grand_total` 的平方根。

### 告警阈值与误报

没有变化时，每个检验仍有 `alpha` 的误报率。监控会反复执行许多检验。若每小时检查 50 个特征，使用 `alpha = 0.05`，即使没有变化，每天也预期约有 60 次误报。远在达到这个数量前，人们就会停止阅读告警。

四条规则让告警保持有用：

1. **多重检验校正。** Bonferroni 校正将 `alpha` 除以检验数。演示将整体 `alpha` 设为 0.01，分配给两个检验，因此每个检验使用 0.005。
2. **要求足够的效应量。** 只有 PSI、`D` 或 Cramér's V 也超过阈值才告警。
3. **要求持续性。** 连续 `k` 个窗口出现漂移才告警。演示使用 `k = 2`。
4. **区分警告与告警。** 警告进入仪表盘，告警通知人员。

演示展示规则 2 的效果：一个干净窗口的卡方 p 值为 0.0009，低于单项检验的 `alpha`。但它的 Cramér's V 低于 0.1，因此策略只记录警告，不发告警。

### 重新训练的触发条件

常见的重新训练触发方式有三种：

- **定期。** 每周或每月重训。简单，但无变化时也重训，有变化时却要等待。
- **漂移。** 重要特征的输入漂移持续超过阈值时重训。
- **性能。** 结果指标低于参考值减去容忍范围时重训。

漂移类型决定重新训练能解决什么：

| 漂移 | 有用的行动 |
|---|---|
| 协变量漂移，但准确率稳定 | 通常无需处理，继续观察结果指标。 |
| 协变量漂移进入数据稀少区域 | 用覆盖这些区域的近期数据重训 |
| 先验漂移 | 重新校准分数，或调整决策阈值 |
| 概念漂移 | 先收集新标签。用旧标签重训只会再次学到旧概念。 |

重新训练后，在最近的已标注数据上测试新模型。采用系统设计课的影子与金丝雀阶段发布，然后将参考窗口重置为新训练数据。

```figure
mlprod-drift-psi
```

## 从零构建

`code/main.py` 中的代码只使用标准库。

### 第 1 步：分位数分箱与 PSI

箱边界来自参考十分位数。`bisect_right` 找到每个值所属的箱。

```python
def quantile_edges(reference: list[float], bins: int = 10) -> list[float]:
    ordered = sorted(reference)
    n = len(ordered)
    edges = [ordered[min(n - 1, (n * i) // bins)] for i in range(1, bins)]
    return sorted(set(edges))


def psi_from_fractions(expected: list[float], actual: list[float], eps: float = 1e-4) -> float:
    total = 0.0
    for e, a in zip(expected, actual):
        e, a = max(e, eps), max(a, eps)
        total += (a - e) * math.log(a / e)
    return total
```

### 第 2 步：KS 统计量及其 p 值

同时遍历两个排序样本。对每个不同的值，先在两组样本中跨过该值的所有重复项，再比较累计占比。这样才能正确处理并列值。

```python
def ks_statistic(sample_a: list[float], sample_b: list[float]) -> float:
    a, b = sorted(sample_a), sorted(sample_b)
    n, m = len(a), len(b)
    i = j = 0
    d = 0.0
    while i < n and j < m:
        x = min(a[i], b[j])
        while i < n and a[i] <= x:
            i += 1
        while j < m and b[j] <= x:
            j += 1
        d = max(d, abs(i / n - j / m))
    return d
```

p 值使用 Kolmogorov 分布的级数 `2 * sum((-1)^(k-1) * exp(-2 k^2 lambda^2))`，其中 `lambda = sqrt(n * m / (n + m)) * D`。

### 第 3 步：卡方检验

`chi2_sf` 通过正则化上不完全伽马函数计算卡方生存函数，小参数使用级数，大参数使用连分式。`chi_square_test` 构建两行表、计算统计量，并返回 p 值和 Cramér's V。

```python
def chi_square_test(reference_counts: dict[str, int], current_counts: dict[str, int]) -> ChiSquareResult:
    categories = [c for c in sorted(set(reference_counts) | set(current_counts))
                  if reference_counts.get(c, 0) + current_counts.get(c, 0) > 0]
    rows = [[reference_counts.get(c, 0) for c in categories], [current_counts.get(c, 0) for c in categories]]
    row_totals = [sum(r) for r in rows]
    grand = sum(row_totals)
    if len(categories) < 2 or 0 in row_totals:
        return ChiSquareResult(0.0, 0, 1.0, 0.0)
    statistic = 0.0
    for col, _ in enumerate(categories):
        col_total = rows[0][col] + rows[1][col]
        for r in range(2):
            expected = row_totals[r] * col_total / grand
            statistic += (rows[r][col] - expected) ** 2 / expected
    dof = len(categories) - 1
    return ChiSquareResult(statistic, dof, chi2_sf(statistic, dof), math.sqrt(statistic / grand))
```

### 第 4 步：窗口与漂移监控器

`SlidingWindow` 用 `deque` 保存最近 `size` 个事件。`DriftMonitor` 只计算一次参考分箱和计数。其 `check` 方法为每个数值特征返回 PSI、`D` 和 KS p 值，并为每个类别特征返回卡方检验结果。

### 第 5 步：告警策略

策略将每组指标转为等级，并逐信号统计连续漂移窗口数：

```python
def level(self, metrics: dict[str, float]) -> str:
    if "psi" in metrics:
        if metrics["psi"] >= self.psi_drift or (metrics["ks"] >= self.ks_drift and metrics["ks_p"] < self.alpha):
            return "drift"
        return "warn" if metrics["psi"] >= self.psi_warn else "ok"
    if metrics["p"] < self.alpha and metrics["v"] >= self.min_cramers_v:
        return "drift"
    return "warn" if metrics["p"] < self.alpha else "ok"
```

`update` 在连续次数达到要求的窗口返回 `ALERT`，在告警后的第一个干净窗口返回 `resolved`。

### 第 6 步：注入漂移的数据流

数据流包含 9000 个支付事件，每个事件具有 `amount`、`channel` 和欺诈 `label`。它分成四段：

| 事件 | 金额 | 渠道比例（app、store、web） | 标签边界 | 变化 |
|---|---|---|---|---|
| 0 到 2999 | 均值 100，标准差 20 | 35%、15%、50% | 120 | 参考期 |
| 3000 到 4999 | 均值 118，标准差 24 | 60%、10%、30% | 120 | 协变量漂移 |
| 5000 到 6499 | 均值 100，标准差 20 | 35%、15%、50% | 120 | 恢复正常 |
| 6500 到 8999 | 均值 100，标准差 20 | 35%、15%、50% | 105 | 概念漂移 |

模型是在前 2000 个事件上拟合的 `amount` 阈值。窗口大小为 500 个事件，每次移动 250 个。标签延迟 500 个事件到达。

```bash
python3 code/main.py
```

```console
  end    PSI   KS D   chi2 p    acc  levels (amount/channel/accuracy)  events
 3000  0.010  0.041  3.0e-01  0.932  ok/ok/ok
 3250  0.152  0.163  7.6e-06  0.924  drift/warn/ok
 3500  0.463  0.298  2.8e-26  0.936  drift/drift/ok                     ALERT amount
 3750  0.609  0.343  3.5e-35  0.942  drift/drift/ok                     ALERT channel
 ...
 5500  0.026  0.044  2.6e-01  0.898  ok/ok/ok                           resolved amount, resolved channel
 ...
 7250  0.040  0.048  7.1e-01  0.848  ok/ok/drift
 7500  0.022  0.039  6.1e-01  0.778  ok/ok/drift                        ALERT accuracy
```

分三部分理解结果：

- **协变量漂移。** 从事件 3000 开始，`amount` 告警在 3500 出现。由于标签规则未变，准确率保持在 0.89 到 0.95。
- **恢复。** 输入在 5000 恢复正常，两项告警均在 5500 解除。
- **概念漂移。** 从 6500 开始，输入没有改变，因此输入监控器保持安静。准确率从 0.946 降至 0.76 到 0.79。准确率告警在 7500 出现，比变化晚 1000 个事件，其中 500 个事件由标签延迟造成。

## 使用现成工具

**scipy。** `scipy.stats` 实现了这两种检验，统计量与从零实现一致。运行本课并不需要 scipy。

```python
from scipy import stats

result = stats.ks_2samp(reference_amounts, current_amounts)
print(result.statistic, result.pvalue)

table = [[1000, 700, 300], [140, 290, 70]]
chi2 = stats.chi2_contingency(table)
print(chi2.statistic, chi2.pvalue, chi2.dof)
```

我们在随机样本上将 `ks_statistic`、`chi_square_test` 与 scipy 1.18.1 对照。KS 统计量、卡方统计量和卡方 p 值在浮点精度内一致。在 200 组随机样本对上，KS p 值与 scipy 结果的相对差异最大达到 scipy 值的 18%；最大差距出现在非常小的 p 值处。

差异来自方法。我们的代码使用极限 Kolmogorov 分布。默认情况下，两组样本都不超过 10,000 个值时，`ks_2samp` 使用精确方法。其渐近模式使用有限样本分布，并将有效样本量取整。只有两个类别时，`chi2_contingency` 默认采用 Yates 连续性校正，因此该情况下的统计量也不同。

**监控库。** 多个开源库把这些检验与报表、仪表盘打包：

- **Evidently** 按列选择漂移检验。参考数据不超过 1000 行时，数值列用 KS，类别列用卡方。数据更大时，使用 Wasserstein 距离和 Jensen-Shannon 散度，阈值为 0.1。PSI 是可选的其他方法之一。
- **NannyML** 在标签到达前估计模型性能。其基于置信度的性能估计（CBPE）使用模型预测概率，要求概率经过良好校准。NannyML 文档说明 CBPE 能处理协变量偏移，却不能处理概念漂移。演示流说明了原因：只有标签揭示了概念漂移。
- **TensorFlow Data Validation** 比较连续数据区间。类别特征使用 L-infinity 距离，数值特征使用近似 Jensen-Shannon 散度。它也比较训练数据与服务数据，这将在特征存储课讨论。

从零代码展示这些工具计算的内容。工具进一步提供存储、调度、仪表盘和更多检验。

对于 LLM 应用，基础设施阶段的 [LLM 可观测性课](../../../17-infrastructure-and-production/13-llm-observability/docs/en.md)介绍追踪与评估工具。本课思想同样适用于那些系统的输入和输出。

## 交付成果

本课产出 `outputs/skill-drift-monitoring.md`。该技能为新模型规划监控，并对漂移告警进行分诊：哪一层触发了告警、哪类漂移符合证据，以及应等待、重新校准、收集标签还是重训。

## 练习

1. 用 200 和 2000 事件的窗口运行数据流。记录事件 3000 之前的误警告和告警延迟。
2. 设置 `n_tests=1`、`patience=1`、`min_cramers_v=0`，统计 5000 到 6500 干净阶段的告警数。
3. 添加一个均值每 100 个事件增加 0.01 的特征，找出 PSI 与 KS 哪个先响应。
4. 在相同十分位分箱上实现 Jensen-Shannon 距离，在每个窗口与 PSI 比较。
5. 为模型的正预测比例添加监控，解释它为什么在概念漂移期间保持安静。

## 关键术语

| 术语 | 常见说法 | 实际含义 |
|------|----------------|----------------------|
| 数据漂移 | “数据变了” | 相较参考窗口，输入、预测或标签分布发生变化 |
| 协变量漂移 | “出现新类型用户” | `P(x)` 变化，而 `P(y \| x)` 不变 |
| 先验漂移 | “正样本更多了” | `P(y)` 变化，而 `P(x \| y)` 不变，也称标签偏移 |
| 概念漂移 | “游戏规则变了” | `P(y \| x)` 变化，相同输入对应不同正确答案 |
| 参考窗口 | “基准数据” | 与每个当前窗口比较的固定样本，通常是训练数据 |
| PSI | “稳定性分数” | 对各箱的“当前占比减参考占比”乘两者比值的对数求和，具有对称性 |
| KS 统计量 | “KS 检验” | 两个经验累积分布函数之间的最大差距 |
| Cramér's V | “类别效应量” | 将卡方统计量缩放到 0 到 1 范围的量 |
| 标签延迟 | “真实答案晚些到” | 从预测到真实结果到达之间的时间 |
| 告警疲劳 | “通知太多” | 大多数告警都是误报，导致人们忽略告警 |

## 延伸阅读

- [Gama et al., A Survey on Concept Drift Adaptation (ACM Computing Surveys, 2014)](https://research.tue.nl/en/publications/a-survey-on-concept-drift-adaptation)：真实与虚拟漂移、漂移模式和适应方法
- [Rabanser, Günnemann, and Lipton, Failing Loudly: An Empirical Study of Methods for Detecting Dataset Shift (NeurIPS 2019)](https://arxiv.org/abs/1810.11953)：用于偏移检测的双样本检验
- [Lu et al., Learning under Concept Drift: A Review (2020)](https://arxiv.org/abs/2004.05785)：漂移检测、理解和适应方法
- [Yurdakul, Statistical Properties of Population Stability Index (Western Michigan University, 2018)](https://scholarworks.wmich.edu/dissertations/3208/)：样本量和分箱数如何影响 PSI
- [scipy.stats.ks_2samp documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ks_2samp.html)：双样本 KS 检验的精确与渐近 p 值方法
- [Evidently, How data drift detection works](https://docs.evidentlyai.com/metrics/explainer_drift)：按列类型和数据规模选择默认检验
- [NannyML, Performance estimation](https://nannyml.readthedocs.io/en/stable/how_it_works/performance_estimation.html)：CBPE 及其假设
