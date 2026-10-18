# 生产模型监控: dữ liệu漂移与概念漂移

> Mô hình đã được triển khai có thể thất bại trong trường hợp không báo cáo sai lầm. Thực tế dần dần rời khỏi dữ liệu đào tạo, mô hình vẫn tiếp tục quay lại số điểm, chỉ có giám sát mới có thể tiết lộ sự khác biệt này.

**Type:** Build
**Languages:** Python
**Prerequisites:** 阶段 2，第 09 课（模型评估）、第 16 课（异常检测）和第 19 课（ML 系统设计）
**Time:** 约 110 分钟

## Học mục tiêu

- Trong hệ thống sức khỏe 输入 预测和结果 4 cấp độ chọn giám sát tín hiệu
- 根据联合分布中变化的部分,区分协变量漂移、先验漂移与概念漂移
- Từ 0 thực hiện chỉ số ổn định nhóm 双样本 Kolmogorov-Smirnov 统计和卡方检查
- Để cố định cửa sổ tham chiếu so sánh cửa sổ hiện tại trượt, giải thích kích thước cửa sổ ảnh hưởng đến tiếng ồn và chậm trễ
-  thiết kế kết hợp hiệu ứng lượng, kiểm tra nhiều lần điều chỉnh và quy tắc liên tục chiến lược báo cáo, hạn chế báo cáo sai lầm
- 判断哪种漂移需要重新训练哪种需要新标签哪种无需处理

## 问题

Một mô hình thanh toán rủi ro với tỷ lệ chính xác 95% trên mạng. Hai tháng sau, chiến dịch tiếp thị mang lại số tiền mua hàng cao hơn cho người dùng ứng dụng.

Trong suốt quá trình, dịch vụ mô hình trả về HTTP 200 cho mỗi yêu cầu.

Ứng dụng kiểm tra kiểm tra phần mềm có đáp ứng được không, mô hình kiểm tra kiểm tra trả lời có vẫn đúng không, cũng như dữ liệu có còn như khi đào tạo hay không.

## 核心概念

###  giám sát gì

监控四层――前三层提供早期预警, chỉ có tầng 4 đo chính xác, nhưng nó đến sớm hơn――

| 层面 | 信号 | 何时可用 | 回答的问题 |
|---|---|---|---|
| 系统健康 | p50/p99 延迟、错误率、吞吐量、内存 | 立即 | 服务是否响应？ |
| 输入 | 各特征分布、缺失率、模式、新类别 | 立即 | 线上数据是否像训练数据？ |
| 预测 | 分数分布、正预测比例、默认答案占比 | 立即 | 模型行为是否与以前一致？ |
| 结果 | 准确率、精确率、校准度、业务指标 | 标签延迟后 | 模型是否仍然正确？ |

Bài học này chủ yếu thảo luận về việc giám sát nhập khẩu, vì nó có sẵn trong quá trình áp dụng.

### 3 loại di chuyển

输入 `x`和标签 `y`Sự phân bố chung có thể được viết thành hai hình thức:

```math
P(x, y) = P(x) \cdot P(y \mid x) = P(y) \cdot P(x \mid y)
```

Mỗi loại di chuyển thay đổi các yếu tố khác nhau:

| 漂移 | 变化部分 | 保持不变的部分 | 支付示例 | 能观察到的监控器 |
|---|---|---|---|---|
| 协变量漂移 | `P(x)` | `P(y \| x)` | 高购物金额的应用用户变多 | 输入监控 |
| 先验漂移 | `P(y)` | `P(x \| y)` | 攻击期间欺诈率翻倍，但欺诈特征不变 | 预测与结果监控 |
| 概念漂移 | `P(y \| x)` | 输入可以不变 | 相同购物金额对应不同欺诈风险 | 只有结果监控 |

Gama 等人将 `P(y | x)`Sự thay đổi được gọi là thực tế khái niệm漂移, sẽ không thay đổi `P(y | x)`của `P(x)`Sự biến đổi được gọi là biến động ảo.

协变量漂移不一定有害──如果模型学好了 `P(y | x)`, cho mỗi loại đầu vào vẫn có thể dự đoán chính xác. Nhưng khi lưu lượng di chuyển đến các mẫu đào tạo hiếm hoặc gần biên giới quyết định của khu vực, tỷ lệ chính xác vẫn có thể giảm.

### 延迟标签

Kết quả xuất hiện trước sau đó.

| 问题 | 标签何时到达 |
|---|---|
| 广告点击 | 数秒后 |
| 未来 30 天流失 | 30 天后 |
| 银行卡欺诈 | 拒付到达时，通常数周后 |
| 贷款违约 | 数月或数年后 |

Trong thời gian chậm, bạn có nhập và dự đoán, nhưng không có kết quả. Trước tiên giám sát nhập và dự đoán, nhãn đến được kết nối, chỉ trong phần đã được đánh dấu chỉ số kết quả tính toán.

### 参考窗口与当前窗口

Mỗi loại kiểm tra di chuyển đều so sánh hai mẫu:

- **参考窗口。**DATA đào tạo, hoặc một đoạn dữ liệu sản xuất được kiểm tra nhân tạo.
- **当前窗口。**Sự kiện gần đây nhất, có thể là gần đây `N`个事件, cũng có thể là gần đây `T`- Không.

滑窗 mỗi bước tiến dài hơn cửa sổ, do đó cửa sổ liên tục chồng lên. 滚窗 mỗi bước tiến dài hơn cửa sổ. 滑窗 mỗi bước tiến dài hơn cửa sổ.

季节性 sẽ phá vỡ các chương trình cửa sổ đơn giản. Nhiều sản phẩm tuần qua tuần qua tuần qua tuần qua tuần qua tuần qua tuần qua tuần qua tuần qua tuần qua tuần.

### Chỉ số ổn định nhóm

PSI  xuất phát từ đánh giá tín dụng. Các giá trị tham chiếu sẽ được chia thành 10 hộp, thường theo tỷ lệ tham chiếu 10, để mỗi hộp chứa 10% mẫu tham chiếu.

```math
\text{PSI} = \sum_{\text{bins}} (\text{current\_share} - \text{reference\_share}) \cdot \ln\left(\frac{\text{current\_share}}{\text{reference\_share}}\right)
```

Một số lượng hộp được phân bố bằng không sẽ làm cho số lượng đối với không có kết cục, do đó sẽ cắt giảm mỗi phần vào 0,0001 等小正数.

Trong thực tế thường sử dụng phân đoạn cố định giải thích PSI: thấp hơn 0.1 để ổn định, 0,1 đến 0.25 để chuyển động trung bình, cao hơn 0.25 để chuyển động đáng kể. Đây là các thói quen kinh nghiệm, không phải kiểm tra thống kê.

### Kolmogorov-Smirnov 统计量

双样本 KS 统计量 `D`là khoảng cách thẳng đứng lớn nhất giữa hai hàm phân phối tích lũy kinh nghiệm:

```math
D = \max_x \left\lvert F_{\text{reference}}(x) - F_{\text{current}}(x) \right\rvert
```

样本完全相同时 `D`为 0,完全不重叠时为 1──它无需分箱──p 值由Kolmogorov 分布结合有效样本量 `n * m / (n + m)`Tôi nhận được.

Khi lượng mẫu rất lớn, ngay cả khi không có sự khác biệt thực tế cũng sẽ làm cho p-đáng giá gần như không.`D`Bản thân như hiệu ứng lượng, chỉ có`D`Và tất cả các giá trị đáp ứng các điều kiện giá trị của mình khi chỉ báo cảnh sát.

### 类别 Chất tính của kiểm tra

Đối với các tính năng của các loại thanh toán, bao gồm cả các loại hình, xây dựng hai dòng (xác định:

```math
\begin{aligned}
\text{expected}[r][c] &= \text{row\_total}[r] \cdot \text{column\_total}[c] / \text{grand\_total} \\
\text{chi2} &= \sum_{\text{cells}} (\text{observed} - \text{expected})^2 / \text{expected}
\end{aligned}
```

 Đối với `k`个类别,检验自由度为 `k - 1` Chỉ có các mục lớn hơn trong các loại xuất hiện trong cửa sổ hiện tại, do đó kiểm tra có thể đáp ứng với giá trị mới.`chi2 / grand_total`của căn vuông.

### 告警值与误报

Không thay đổi, mỗi lần kiểm tra vẫn còn.`alpha`                                                                                                                                                                                                                                                              `alpha = 0.05`Mặc dù không thay đổi, mỗi ngày cũng có thể có khoảng 60 báo cáo sai lầm.

4 quy tắc để cảnh sát giữ hữu ích:

1. **多重检验校正。**Bonferroni 校正将 `alpha`Ngoài số lượng kiểm tra, toàn bộ màn trình diễn sẽ được thực hiện.`alpha`设为0.01, phân chia cho hai kiểm tra, do đó mỗi kiểm tra sử dụng 0.005──
2. **要求足够的效应量。**Chỉ có PSI thôi.`D`V của Cramér cũng vượt quá giá trị của cảnh sát.
3. **要求持续性。**连续 `k`个窗户出现漂移才告警.`k = 2`
4. **区分警告与告警。**- Lấy cảnh báo vào bảng thiết bị, báo cảnh sát cho người biết.

                                                                                                                                                                                                                                                              `alpha`Nhưng Cramér của nó là thấp hơn 0.1, vì vậy chiến lược chỉ ghi nhận cảnh báo, không phát báo cảnh báo.

### 重新训练的触发条件

常见的重训触发方式有三种:

- **定期。**Mỗi tuần hoặc mỗi tháng tập lại. đơn giản, nhưng không thay đổi, cũng tập lại, có thay đổi thì phải chờ đợi.
- **漂移。**Ưu điểm quan trọng của nhập cư kéo dài hơn  giá trị trong thời gian tập luyện.
- **性能。**Kết quả chỉ số thấp hơn giá trị tham chiếu giảm phạm vi dung lượng trong thời gian tập luyện.

漂移类型决定重新训练能解决什么:

| 漂移 | 有用的行动 |
|---|---|
| 协变量漂移，但准确率稳定 | 通常无需处理，继续观察结果指标。 |
| 协变量漂移进入数据稀少区域 | 用覆盖这些区域的近期数据重训 |
| 先验漂移 | 重新校准分数，或调整决策阈值 |
| 概念漂移 | 先收集新标签。用旧标签重训只会再次学到旧概念。 |

Sau khi tập luyện lại, hãy thử nghiệm mô hình mới trên dữ liệu đã được đánh dấu gần đây.

```figure
mlprod-drift-psi
```

## Từ 0 cấu trúc

`code/main.py`Trung代码 chỉ sử dụng standard库.

### 第 1 步:分位数分箱 và PSI

箱边界 từ tham khảo10位.`bisect_right`Tìm hết giá trị của hộp.

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

### 第2 步:KS 统计量及其p 值

Đồng thời trải qua hai thứ tự mẫu. Đối với mỗi giá trị khác nhau, trước tiên trong hai nhóm mẫu vượt qua giá trị đó tất cả các lần lặp lại, so sánh lại tỷ lệ tích lũy.

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

p 值 sử dụng Kolmogorov 分布的级数 `2 * sum((-1)^(k-1) * exp(-2 k^2 lambda^2))`, trong số đó `lambda = sqrt(n * m / (n + m)) * D`

### 第3 步: Kế hoạch kiểm tra

`chi2_sf`Thông qua chính thức hóa trên không hoàn chỉnh马 hàm tính toán các hàm tồn tại, các số nhỏ sử dụng các bậc, các số lớn sử dụng các kết nối.`chi_square_test`构建两行表、计算统计量,并返回 p 值和 Cramér's V──

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

### 第4 步: cửa sổ và bộ giám sát di chuyển

`SlidingWindow`用 `deque`保存 gần đây `size`个事件.`DriftMonitor`Chỉ tính một lần tham khảo phân hộp và tính toán.`check`Phương pháp để trả lại PSI cho mỗi tính năng số`D`和 KS p 值,并为每个类特征返回卡方检测结果──

### 第5 步: Chiến lược cảnh sát

策略 sẽ chuyển mỗi nhóm chỉ số thành cấp,并逐信号统计连续漂移窗口数:

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

`update`Trong số lần tiếp tục đạt được yêu cầu cửa sổ quay lại `ALERT`, sau khi cảnh sát báo , cửa sổ đầu tiên được làm sạch trở lại .`resolved`

### Bước 6: Nhập vào dòng dữ liệu di chuyển

Số liệu có chứa 9000 vụ thanh toán, mỗi vụ có`amount``channel`Và lừa đảo`label`Nó chia thành 4 đoạn:

| 事件 | 金额 | 渠道比例（app、store、web） | 标签边界 | 变化 |
|---|---|---|---|---|
| 0 到 2999 | 均值 100，标准差 20 | 35%、15%、50% | 120 | 参考期 |
| 3000 到 4999 | 均值 118，标准差 24 | 60%、10%、30% | 120 | 协变量漂移 |
| 5000 到 6499 | 均值 100，标准差 20 | 35%、15%、50% | 120 | 恢复正常 |
| 6500 到 8999 | 均值 100，标准差 20 | 35%、15%、50% | 105 | 概念漂移 |

Mô hình được phù hợp với các sự kiện trước 2000`amount`值──窗口大小为 500 事件, mỗi lần di chuyển 250 个──标签延迟 500 事件到达──

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

分三部分理解结果:

- **协变量漂移。**Từ sự kiện 3000  bắt đầu,`amount`告警在 3500 出现. 由于标签规则未变,准确率保持在0.89到0.95
- **恢复。**输入在 5000 恢复正常, hai báo cáo cảnh sát均在 5500 解除.
- **概念漂移。**Từ 6500  bắt đầu, nhập không thay đổi, do đó, bộ điều khiển nhập giữ yên tĩnh. Tỷ lệ chính xác giảm từ 0.946  xuống còn 0.76 đến 0.79 ⋅ tỷ lệ chính xác báo cáo cảnh sát xuất hiện tại 7500, so với 1000 sự kiện thay đổi, trong đó 500 sự kiện do ghi dấu chậm lại gây ra.

## 使用现成工具

**scipy。** `scipy.stats`Thực hiện hai loại kiểm tra, thống kê và từ zero thực hiện phù hợp.

```python
from scipy import stats

result = stats.ks_2samp(reference_amounts, current_amounts)
print(result.statistic, result.pvalue)

table = [[1000, 700, 300], [140, 290, 70]]
chi2 = stats.chi2_contingency(table)
print(chi2.statistic, chi2.pvalue, chi2.dof)
```

Chúng tôi sẽ làm theo cách nào đó.`ks_statistic``chi_square_test`KS 1.8.1 đối với kiểm tra KS 统计量、卡方统计量和卡方 p 值在浮点精度内一致── trên 200 组随机样本, KS p 值与 scipy 结果的相对差最大达到 18% scipy value; 差最大出现非常小的 p 值处──

差异来自方法──我们的代码使用极限 Kolmogorov 分布──默认情况下, hai nhóm mẫu đều không vượt quá 10.000 个值,`ks_2samp`Sử dụng phương pháp chính xác.`chi2_contingency`默认采用Yates 连续性校正, do đó số liệu thống kê trong trường hợp này cũng khác nhau.

**监控库。**Nhiều thư viện mở để kết hợp các kiểm tra này với báo cáo, thiết bị:

- **Evidently**按列选择漂移检验──参考数据不超过1000 行时,数值列用KS,类别列用卡方──数据更大时,使用Wasserstein 距离和Jensen-Shannon 散度,值为0.1──PSI là một trong những phương pháp khác có thể lựa chọn──
- **NannyML**Trong bài viết này, các tác giả đã được giới thiệu về các tác phẩm của các mô hình, các tác phẩm và các tác phẩm của các mô hình, các tác phẩm của các mô hình, các tác phẩm và các tác phẩm của các mô hình.
- **TensorFlow Data Validation**So sánh các dữ liệu liên tục trong các khu vực dữ liệu.

Từ mã số không hiển thị nội dung của các công cụ tính toán.

 Đối với LLM  ứng dụng, cơ sở hạ tầng giai đoạn [LLM 可观测性课](../../../17-infrastructure-and-production/13-llm-observability/docs/en.md)介绍 theo dõi và đánh giá các công cụ.

## 交付成果

本课产 出 `outputs/skill-drift-monitoring.md` Kỹ năng này được sử dụng để kiểm soát, kiểm soát và phân loại các cảnh sát chuyển động: những người nào đã gây ra những cảnh sát chuyển động phù hợp với bằng chứng, cũng như phải chờ đợi, tái chuẩn bị, thu thập nhãn hoặc đào tạo lại.

## 练习

1. Sử dụng 200 và 2000 事件 cửa sổ vận hành dữ liệu lưu lượng.
2. 设置 `n_tests=1``patience=1``min_cramers_v=0`, ước tính số cảnh sát trong giai đoạn khô 5000 đến 6500
3. Thêm một giá trị trung bình cho mỗi 100 sự kiện tăng 0,01 đặc điểm, tìm ra PSI và KS 哪个先响应──
4. Trong cùng một hộp phân chia, thực hiện Jensen-Shannon khoảng cách, trong mỗi cửa sổ so với PSI
5. Để tăng tỷ lệ dự đoán chính xác của mô hình, hãy giải thích tại sao nó giữ yên tĩnh trong quá trình chuyển động khái niệm.

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

- [Gama et al., A Survey on Concept Drift Adaptation (ACM Computing Surveys, 2014)](https://research.tue.nl/en/publications/a-survey-on-concept-drift-adaptation): thực và ảo漂移、漂移模式和适应方法
- [Rabanser, Günnemann, and Lipton, Failing Loudly: An Empirical Study of Methods for Detecting Dataset Shift (NeurIPS 2019)](https://arxiv.org/abs/1810.11953): dùng cho kiểm tra chuyển động
- [Lu et al., Learning under Concept Drift: A Review (2020)](https://arxiv.org/abs/2004.05785):漂移检测、理解和适应方法
- [Yurdakul, Statistical Properties of Population Stability Index (Western Michigan University, 2018)](https://scholarworks.wmich.edu/dissertations/3208/): Số lượng mẫu và số hộp ảnh hưởng đến PSI
- [scipy.stats.ks_2samp documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ks_2samp.html): 2 mẫu KS 检验的精确与渐近 p 值方法
- [Evidently, How data drift detection works](https://docs.evidentlyai.com/metrics/explainer_drift): theo kiểu và quy mô dữ liệu chọn chọn cố định kiểm tra
- [NannyML, Performance estimation](https://nannyml.readthedocs.io/en/stable/how_it_works/performance_estimation.html): CBPE  và giả định của nó
