# 生产模型监控:数据漂移与概念漂移

> 已部署的模型可能在不报错的情况下失效──现实逐渐偏离训练数据,模型仍持续返回分数, ancak izleme bu farkı ortaya çıkarmak için mümkün──

**Type:** Build
**Languages:** Python
**Prerequisites:** 阶段 2，第 09 课（模型评估）、第 16 课（异常检测）和第 19 课（ML 系统设计）
**Time:** 约 110 分钟

## Öğrenme hedefi

- Sistem Sağlığı DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA     DATA                 DATA                                                                                                                                                                                                                 
- Birleştirilmiş dağılımdaki değişim bölümüne göre, bölükleşmiş değişim değişimi, öncesinde değişim ve kavram değişimi
- 0'dan gerçekleştirilen grup istikrarlılık endeksi, iki örnek Kolmogorov-Smirnov  Statistika ve Karakans incelemesi
- Sıkı bir referans penceresi ile kaydırıcı bir önceki pencerenin karşılaştırılması, pencerenin büyüklüğünün gürültü ve gecikmeyi nasıl etkilediğini açıklamak
- 设计结合效量、多重检查校正和持续性规则的告警策略,限制误报
- 判断哪种漂移需要重新训练 哪种需要新标签 哪种无需处理

## 问题

Bir ödeme risk modeli 95% doğruluk oranıyla çevrimiçi olarak yayınlandı. İki ay sonra, pazarlama faaliyetleri daha yüksek bir satın alma miktarı getirdi.

Tüm süreçte, model servis her istek için HTTP 200'e geri döndü. Geçmiş normal, güncel hata yok. İlk sorunun belirti birkaç hafta sonra bir mali reddedilme raporu oldu.

软件监控检查服务是否响应,模型监控检查答案是否仍然正确,以及数据是否还像训练时的数据──本课后者为构建统计量、窗口和告警策略──

## 核心概念

### Neyi izleyeceksin ?

監控四層──前三層提供早期预警, yalnızca dördüncü aşama ölçüm doğruluğu, ama daha geç gelir──

| 层面 | 信号 | 何时可用 | 回答的问题 |
|---|---|---|---|
| 系统健康 | p50/p99 延迟、错误率、吞吐量、内存 | 立即 | 服务是否响应？ |
| 输入 | 各特征分布、缺失率、模式、新类别 | 立即 | 线上数据是否像训练数据？ |
| 预测 | 分数分布、正预测比例、默认答案占比 | 立即 | 模型行为是否与以前一致？ |
| 结果 | 准确率、精确率、校准度、业务指标 | 标签延迟后 | 模型是否仍然正确？ |

Bu ders, giriş denetimi üzerinde yoğunlaşır, çünkü bu işaretlenmeden önce kullanılabilir.

### Üç sınıf göç

输入 `x`Ünlüler`y`Birleştirilmiş dağılım iki biçime yazılabilir:

```math
P(x, y) = P(x) \cdot P(y \mid x) = P(y) \cdot P(x \mid y)
```

Her hareket değişir farklı faktörler:

| 漂移 | 变化部分 | 保持不变的部分 | 支付示例 | 能观察到的监控器 |
|---|---|---|---|---|
| 协变量漂移 | `P(x)` | `P(y \| x)` | 高购物金额的应用用户变多 | 输入监控 |
| 先验漂移 | `P(y)` | `P(x \| y)` | 攻击期间欺诈率翻倍，但欺诈特征不变 | 预测与结果监控 |
| 概念漂移 | `P(y \| x)` | 输入可以不变 | 相同购物金额对应不同欺诈风险 | 只有结果监控 |

Gama  et al. `P(y | x)`Gerçek kavramın değişmesi, değişmeyecek.`P(y | x)``P(x)`变化称为虚拟漂移―― onların genel anlatısı da zamanlı bir şekilde 漂移模式 olarak bölünür,突发、增量、渐进和概念复现―― olarak adlandırılır.

协变量漂移不一定有害──如果模型学好 `P(y | x)`Her giriş için doğru tahmin yapılabilir, ancak akım tren örneğine nadiren veya karar sınırına yakın bir bölgeye doğru ilerlediğinde, doğruluk oranı hala düşebilir.

### 延迟标签

结果出现在预测后──延迟取决于问题:

| 问题 | 标签何时到达 |
|---|---|
| 广告点击 | 数秒后 |
| 未来 30 天流失 | 30 天后 |
| 银行卡欺诈 | 拒付到达时，通常数周后 |
| 贷款违约 | 数月或数年后 |

延期期, you have input and prediction, but no results. 延期期, you have input and prediction, but no results. 延期期, you have input and prediction. 延期期, you have input and prediction. 延期期, but no results. 延期期, you have input and prediction. 延期期, but no results. 延期期, but no results. 延期, but no results. 延期, but no results. 延期, but no results. 延期, but no results. 延期, but no results. 延期, but no results. 延期, so long as the result of the event. 延期, so long as the result of the event. 延期, so long as the result of the event is 500 events.

### Reference window ile mevcut pencereler

Her hareket kontrolü iki örneğe göre yapılır:

- **参考窗口。**訓練データ, veya yapay olarak kontrol edilen bir üretim veri bölümü──在重新训练前保持固定──
- **当前窗口。**Son olaylar, son olabilir.`N`- Bu da son bir olay.`T`Küçük bir saat.

滑り窓の前進のステップ長小于窓大小,したがって连续窓重叠──滚り窓の前進のごとく完全な窓大小──窓大小, 滑り窓は取舍の一種である:小窓反応速,却容易に騒音を判断する漂移; 大窓は安定する,却遅い報告変化──

季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节性 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季节 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季 季

### 群体稳定性指数

PSI kredi değerinden kaynaklanır. Genellikle 10 oranlı bir referans olarak 10 kutu olarak bölünür.

```math
\text{PSI} = \sum_{\text{bins}} (\text{current\_share} - \text{reference\_share}) \cdot \ln\left(\frac{\text{current\_share}}{\text{reference\_share}}\right)
```

Bir kutu oranı sıfır olarak sayıyı sonsuz olarak büyük kılar, bu nedenle her oranı 0.0001'e kadar keser.

 Praktiki sıkı kullanılmış sabit bölge açıklaması PSI: 0.1'den düşük, 0.1'den 0.25'e kadar orta ve belirgin bir hareket, 0.25'den yüksek belirgin bir hareket. Bunlar istatistik incelemeler değil deney alışkanlıklarıdır.

### Kolmogorov-Smirnov 统计量

双样本 KS 统计量 `D`İki deney toplam dağılım fonksiyonu arasındaki en büyük dikey fark:

```math
D = \max_x \left\lvert F_{\text{reference}}(x) - F_{\text{current}}(x) \right\rvert
```

样本完全相同时 `D`0, tamamen yüklenmez, 1 olarak.`n * m / (n + m)`Alıyorum.

Örnek miktarı çok büyük olsa bile, gerçek anlamsız farklar p değerini sıfıra yaklaştırır.`D`Bu, sadece bir etki.`D`Ve her şey kendi değer şartlarını karşılar.

### 类别 Karakteristikleri Karakteristikleri

Ödeme yolları gibi sınıf özellikleri için iki satır oluşturun.

```math
\begin{aligned}
\text{expected}[r][c] &= \text{row\_total}[r] \cdot \text{column\_total}[c] / \text{grand\_total} \\
\text{chi2} &= \sum_{\text{cells}} (\text{observed} - \text{expected})^2 / \text{expected}
\end{aligned}
```

- Evet .`k`个类别,检验自由度为 `k - 1` Sadece mevcut pencerede ortaya çıkan sınıflar daha büyük katkılara katkıda bulunur, bu nedenle test yeni değerlere yanıt verebilir.`chi2 / grand_total`Çekirde kök.

### 告警值与误报

Değişiklik yok, her kontrol hala var.`alpha`Kontrolü bir çok denemeyi tekrar tekrar yapmaktadır.`alpha = 0.05`Bu sayı ulaşmadan önce, insanlar haberleri okumayı bırakırlar.

4 Kurallar:

1. **多重检验校正。**Bonferroni 校正将 `alpha`Sadece kontrol numarasını göstermekle kalmadı.`alpha`设为0.01, iki test'e dağıtılır, bu nedenle her test 0.005 kullanılır.
2. **要求足够的效应量。**Sadece PSI'yi...`D`Cramér'in V'i de                                                                                                                                                                                                                                                           
3. **要求持续性。**连续 `k`个窗户出现漂移才告警──演示使用 `k = 2`- Evet.
4. **区分警告与告警。**Alarm, cihazı kontrol altına al.

演示展示规则 2 的效果: 干净窗口的卡方 p值为0.0009,单项检查的低于 `alpha` ama Cramér'in V'si 0.1'den aşağıdır, bu yüzden strateji sadece uyarı kaydetir, uyarı yaymaz.

### 重新训练的触发条件

常见的重训触发方式有三种:

- **定期。**Her hafta veya her ay tekrar eğitim. Basit ama değişmeyen zaman da tekrar eğitim.
- **漂移。**重要特征的输入漂移持续超过值时重训──
- **性能。**结果指标低于参考值减持耐性范围重训时.

漂移类型决定重新训练能解决什么:

| 漂移 | 有用的行动 |
|---|---|
| 协变量漂移，但准确率稳定 | 通常无需处理，继续观察结果指标。 |
| 协变量漂移进入数据稀少区域 | 用覆盖这些区域的近期数据重训 |
| 先验漂移 | 重新校准分数，或调整决策阈值 |
| 概念漂移 | 先收集新标签。用旧标签重训只会再次学到旧概念。 |

Yeniden eğitildikten sonra, son belirtilen veriler üzerinde test yeni modeller, sistem tasarım dersinin gölgeleri ile bir çerçeve aşamasında yayınlanmasını ve sonra referans penceresini yeni eğitim verilerine yeniden ayarlamasını kullanmaktadır.

```figure
mlprod-drift-psi
```

## 0 yapı

`code/main.py`Orta kod sadece standart kutu kullanır.

### İlk adım: PSI ile

箱边界 箱边界 箱边界 箱边界 箱边界 箱边界 箱边界 箱边界 箱边界 箱边界 箱边界 箱边界 箱边界 箱边界 箱边界 箱边界 箱边界 箱边界 箱边界 箱边界 箱边界 箱边界 箱边界 箱边界 箱边界 箱边边界 箱边边界 箱边边边边边边边`bisect_right`Her değerini bul.

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

### 第2 步:KS 统计量 ve onun p  值

Aynı zamanda iki sıralama örneği geçiyor. Her iki farklı değer için, önce iki grup örneği arasında geçen tüm değerlerin tekrarlanmasını, yeniden karşılaştırmak için toplu oranı. Böylece doğru bir şekilde birlikte değerleri işleyebilirsiniz.

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

Kolmogorov'un değerinin değerinin bölünmesi`2 * sum((-1)^(k-1) * exp(-2 k^2 lambda^2))`, içinden `lambda = sqrt(n * m / (n + m)) * D`- Evet.

### Üçüncü adım: Karapanı kontrol etmek

`chi2_sf`通过正则化上不完全马函数计算卡方生存函数,小参数使用级数,大参数使用连分式──`chi_square_test`构建两行表、计算统计量,并返回 p 值和 Cramér's V──

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

### 第4 步: Pencere ve hareket izleyicisi

`SlidingWindow`Kullan .`deque`保存最近 `size`- Bu olayı.`DriftMonitor`Sadece bir kez hesaplamak için referans kutu ve hesaplama.`check`方法 for each numeric characteristic return PSI ∞`D`和 KS p  值,并为每个类特征返回卡方检查结果──

### 第5 步:Bilgi kurma stratejisi

策略将每组指标转为等级,并逐信号统计连续漂移窗口数:

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

`update`Sürekli olarak talep edilen sayıya ulaşmak için pencerelere geri dön .`ALERT`Polislerin ilk açık penceresine geri dönün .`resolved`- Evet.

### 6. adım: Geçici veri akışına girdi

Veriler 9000 ödeme olayı içeriyor. Her olayda bir ödeme var.`amount`- Evet.`channel`Ve dolandırıcılık .`label`Dört bölümden oluşuyor.

| 事件 | 金额 | 渠道比例（app、store、web） | 标签边界 | 变化 |
|---|---|---|---|---|
| 0 到 2999 | 均值 100，标准差 20 | 35%、15%、50% | 120 | 参考期 |
| 3000 到 4999 | 均值 118，标准差 24 | 60%、10%、30% | 120 | 协变量漂移 |
| 5000 到 6499 | 均值 100，标准差 20 | 35%、15%、50% | 120 | 恢复正常 |
| 6500 到 8999 | 均值 100，标准差 20 | 35%、15%、50% | 105 | 概念漂移 |

Model 2000'den önceki olaylara uygun .`amount`值──窗口大小为 500 事件,每次移动 250 个──标签延迟 500 事件到达──

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

分三部分理解結果:

- **协变量漂移。**3000'den sonra,`amount`告警在 3500 出現──由于标签规则未变,准确率保持在0.89~0.95──
- **恢复。**输入在 5000 恢复正常, 2 报警均在 5500 解除.
- **概念漂移。**6500'den itibaren, giriş değişmedi, bu nedenle giriş denetleyicisi sakin kalmıştır. Doğruluk oranı 0.946'dan 0.76'ye düştü.

## kullanım

**scipy。** `scipy.stats`Bu iki denemeyi gerçekleştirmek için, istatistikler ve sıfırdan gerçekleştirmekle uyumlu olarak çalıştırılmaktadır.

```python
from scipy import stats

result = stats.ks_2samp(reference_amounts, current_amounts)
print(result.statistic, result.pvalue)

table = [[1000, 700, 300], [140, 290, 70]]
chi2 = stats.chi2_contingency(table)
print(chi2.statistic, chi2.pvalue, chi2.dof)
```

Biz de kendiliğimizde olacağız.`ks_statistic`- Evet.`chi_square_test`KS'nin p değerinin ve kS'nin sonuçlarının karşılaştırma farkı, kS'nin değerinin en büyük oranının %18'ine ulaştı; en büyük fark çok küçük bir p değerinde ortaya çıktı.

差异来自方法──我们的代码使用极限 Kolmogorov 分布──默认情况下,两组样本都不超过10,000 个值时,`ks_2samp`Çeviri: Sınırlı örnek dağıtım kullanımı, sadece iki sınıf kullanımı ile.`chi2_contingency`Yates'in 连续性校正'ını kabul etmek, bu nedenle bu durumda da farklı bir statistik var.

**监控库。**Birçok açık kaynak kitapçığı bu deneme ve raporlamaları paketliyor.

- **Evidently**按列选择漂移检验──参考数据不超过1000 行时,数值列用KS,类别列用卡方──数据更大时,使用Wasserstein 距离和Jensen-Shannon 散度,值为0.1──PSI,可选的其他方法之一──
- **NannyML**Etiket ulaşmadan önce tahmin model performansı. Onun güven temelinde performans tahminleri. CBPE) model tahmin olasılığı kullanır, olasılığı iyi bir kurum geçirilmesi gerektirir.
- **TensorFlow Data Validation**L-sonuzluk mesafesini kullanan sınıf özellikleri, Jensen-Shannon 散度'e benzer sayısal değer özellikleri kullanan sınıf özellikleri.

Bu araçların hesaplama içeriğini göstermek için, 0 kod ile kullanılır.

LLM  uygulama, altyapı aşamaları [LLM 可观测性课](../../../17-infrastructure-and-production/13-llm-observability/docs/en.md)介绍 Takip ve değerlendirme araçları。 Bu ders düşüncesi aynı şekilde sistemlerin giriş ve çıkışlarına da uygulanır。

## 交付成果

本课产 出 `outputs/skill-drift-monitoring.md`Bu beceriler yeni model planlama ve izleme için kullanılır ve göç polisiye ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayrıntılı olarak ayr

## 练习

1. 200 ve 2000 olayları pencerelerinden geçerli olan veri akışı.
2.  ayar `n_tests=1`- Evet.`patience=1`- Evet.`min_cramers_v=0`, 5000-6500 干净阶段in haberdarı sayı
3. 100 olay başına ortalama bir değer ekle, öncelikle PSI ile KS'nin nasıl tepki verdiğini bul.
4. Aynı 10 bölümde Jensen-Shannon mesafesini gerçekleştirmek için, her pencerede PSI ile karşılaştırmak
5. Modelin doğru tahmin oranı, neden konsept hareketleri sırasında sessiz kalmasını açıklıyor.

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

- [Gama et al., A Survey on Concept Drift Adaptation (ACM Computing Surveys, 2014)](https://research.tue.nl/en/publications/a-survey-on-concept-drift-adaptation)Gerçek ve Yapay Geçiş, Geçiş Modu ve Uygunluk Yöntemleri
- [Rabanser, Günnemann, and Lipton, Failing Loudly: An Empirical Study of Methods for Detecting Dataset Shift (NeurIPS 2019)](https://arxiv.org/abs/1810.11953): Geçiş denetimi için iki örnek denetimi
- [Lu et al., Learning under Concept Drift: A Review (2020)](https://arxiv.org/abs/2004.05785):漂移检测、理解和适应方法
- [Yurdakul, Statistical Properties of Population Stability Index (Western Michigan University, 2018)](https://scholarworks.wmich.edu/dissertations/3208/)Şablon ve kutu sayısı: PSI'yi nasıl etkiler
- [scipy.stats.ks_2samp documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ks_2samp.html)KS 检验的精确与渐近 p 值方法: iki örnek
- [Evidently, How data drift detection works](https://docs.evidentlyai.com/metrics/explainer_drift): sırada tür ve veri büyüklüğü seçimi
- [NannyML, Performance estimation](https://nannyml.readthedocs.io/en/stable/how_it_works/performance_estimation.html):CBPE  ve onun假设
