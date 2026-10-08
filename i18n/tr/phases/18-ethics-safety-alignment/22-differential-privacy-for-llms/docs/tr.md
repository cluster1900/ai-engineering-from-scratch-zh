# LLM'lerin Farklı Gizlilik

> DP-SGD 仍然是標準做法:注入噪音的 Gradient 更新提供形式化的 (epsilon, delta) 保证──计算、内存和效用方面的开销都很大;参数高效的DPfine-tuning (LoRA + DP-SGD) 是常见的 2025 配置 (ACM 2025) 两类证据存在张力: Canary's membership inference (Duan et al., 2024) 报告称对语言模型的成功有限;培训数据提取 (Carlon et al., 2021; Nasr et al., 2025) 恢复大量的计算和效用方式 (arX:2503.808, March 2025):06差证在测量对象不同:插入提议的数据 最容易被取取的数据                                                                                                                                                                     

**Type:** Build
**Languages:** Python (stdlib, DP-SGD 噪声注入和 ε-δ accountant 演示)
**Prerequisites:** Phase 01 · 09（信息论），Phase 10 · 01（大模型训练）
**Time:** ~60 分钟

## Öğrenme hedefi
- 定义 (epsilon, delta) -farklı gizlilik,并说明 DP-SGD 流程──
- Açıklama 2024-2025 yılları 张力:Kanary MIA ve eğitim verileri çıkarımı  farklı bir görünüm göstermiştir:
- PMixED'i ve neden sonucu-zaman özel öngörümü DP eğitimi için bir alternatif olduğunu açıklayın.
- 描述 LLM üzerinden Farklı Gizlilik Değişimi

## 问题
LLMs 会记忆──Carlini et al. 2021'de, üretim dil modeli, ihtiyaçta olan bir sözcükle birleştirilmiş bir eğitim metni olarak kullanılacağını göstermiştir.

## 概念
### (ε, δ) - Farklı gizlilik

Eğer herhangi iki sadece farklı bir örnek veriler, ve herhangi bir olay S, bir rastgele algoritma M 满足:
S) <= e^ε * P(M(D') S) + δ。

解释:输出分布足够接近 (由 ε 参数化) ), böylece δ olasılığı istisnalar dışında herhangi bir bireyin katkılarının güvenilir olarak tahmin edilmesi mümkün değildir.

### DP-SGD

Abadi et al. 2016。标准流程:
1. - Mini seri gibi.
2. 计算 per-example gradients。
3. Örnek için her gradient 剪切到值 C──
4. Kürümden sonra gradientlere 求和,并加入 std 为 σ * C'nin Gaussian noise。
5. Use带噪音的和来更新参数──

隐私成本由会计师跟踪(Moments 会计师、Rényi DP 会计师)  LLM 文献中报告的 ε 值会因威胁模型、数据敏感性和效用目标而大幅变化; 没有普适的安全默认 ε──已发言例在某些 LLM 训练设置中大致覆盖 ε ≈ 110,但这些只是例,并非推默认值──较低的 ε 通常需要更多的噪音,并可能增加效用损失──

### LoRA + DP-SGD

Sınır modeline göre, tam DP-SGD 代价过高──LoRA (Hu et al. 2022) Gradient 更新限制在一个小型适配器中,从而减少每例梯度 存储──LoRA + DP-SGD 是常见的 2025 配置──DP保证适用于适配器;基模型 保持固定──

### 2024-2025 yılları

两条证据线:

- **Canary MIA (Duan et al. 2024)。**Bu, MIA'nın zor olduğunu gösterir.
- **Training-data extraction (Carlini 2021, Nasr et al. 2025)。**Önceden 提示模型 kullanın; eğitimden sonra tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar

2025 yıl 3 月的解决方式 (arXiv:2503.06808):二者测量是不同事物──MIA 问的是样本e是否在D 中?对象是插入的Canary──Extraction 问的是我能从D 中恢复什么?隐私而言,最容易提取的样本才重要;Canary 会低估这一点,因为它们没有优化为容易提取──

Yeni Kanar デザイン── 无需影模型的 Loss-based MIA── 首个针对真实数据的LLM──且具备现实DP保证的非凡DP审计──

### DP eğitiminin alternatif programı

- **PMixED (arXiv:2403.15638)。**Sonraki belirtilerde, uzmanların karışımı kullanılır; her uzman bir eğitim veri parçası görür; DP'yi gerçekleştirmek için gürültüye katılırken DP'yi tamamen kaçınır.
- **DP synthetic data generation (Google Research 2024)。**DP-SGD kullanmak, LoRA-fine-tune yapmak, sentetik verileri toplamak, sentetik verileri yeniden kullanmak,

Bu, tüm DP eğitiminin kullanım maliyetini çeviriyor, ancak farklı tehdit modelleri kullanılıyor.

### 通过 LLM Feedback 逆转  Diferensial Gizlilik

2025 yılın yeni gelişimi. DP eğitimi modeli güven puanları kullanmak için Oracle'ı kullanmak için bireyleri yeniden tanımlamak için.

防方式: 暴露前への断断/量化への外掛要求── (ε, δ) -DP eğitimi dışında 追加要求──

### Bu 18'inci aşamada.

Dersler 20-21 ̇ önyargı/eşitlik ̇ Ders 22 ̇ gizlilik ̇ Ders 23 ̇ su işaretleme ̇ kaynak elde etmektir ̇ Ders 27 ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇


```figure
an-dp-clip-noise
```

## Kullan
`code/main.py`Bir oyuncak ikili sınıflandırma 数据集上模拟 DP-SGD──You can scan noise multiplier σ 和 clipping norm C,并跟踪 (ε, δ) budget with accuracy cost──One canary attack 会插入一个唯一训练样本,并测量日志-损失测试 在 DP 前后是否能检查到它──

## - Söyle.
本课会产 出 `outputs/skill-dp-audit.md`◊ belirli bir dil modelinin deploymesi DP iddiasını belirler, bu da: ((ε, δ) 值、 kullanımı mühasib、MIA değerlendirme protokolü, ve güveni-dayanış vektörlerini değerlendirdiğini ödüllendirir.

## 练习
1. 运行  İşlem`code/main.py`◊扫过 σ ∈ {0.5, 1.0, 2.0},并报告 (ε, δ) - doğruluk 权衡──识别效用崩的临界点──

2. 实现 Canary 插入和日志-loss test──测量在 σ = 1.0 时,DP-SGD 前后的检测率──

3. Nasr et al. 2025  Training-data extraction content── neden çıkarım başarısı ortalama bir çöküşe uğramıyor?

4. PMixED (arXiv:2403.15638) kullanan bir deploymayı tasarlayarak, tümüyle sonuçlama zamanında 运行──PMixED  hangi DP-SGD çözülmemiş tehdit modelini çözdü?

5. 概述 DP LLM üzerinden geri dönüş 攻撃──design a limit confidence-score 漏漏の対策,并估算其部署コスト──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| DP | “(ε, δ)-differential privacy” | 形式化隐私：在相邻数据集变化下，输出分布保持接近 |
| DP-SGD | “noise-injected SGD” | Gradient clipping + Gaussian noise addition；标准 DP training |
| LoRA + DP-SGD | “efficient private fine-tune” | 在 low-rank adapters 上做 DP-SGD；标准 2025 配置 |
| MIA | “membership inference” | 判断某个样本是否出现在训练数据中的攻击 |
| Canary | “inserted watermark example” | 用于测量 DP 泄漏的唯一训练样本 |
| PMixED | “private inference mixture” | 在 inference time 通过 next-token 分布上的 mixture-of-experts 实现 DP |
| DP Reversal | “confidence leakage attack” | 使用模型 confidence 作为 oracle 进行重新识别的攻击 |

## 延伸阅读
- [Abadi et al. — DP-SGD (arXiv:1607.00133)](https://arxiv.org/abs/1607.00133) 标准 DP eğitim algoritması
- [Carlini et al. — Extracting Training Data (arXiv:2012.07805)](https://arxiv.org/abs/2012.07805) 经典 论文
- [Duan et al. — Canary MIA on LLMs (arXiv:2402.07841, 2024)](https://arxiv.org/abs/2402.07841) Başarılı sınırlı MIA
- [Kowalczyk et al. — Auditing DP for LLMs (arXiv:2503.06808, March 2025)](https://arxiv.org/abs/2503.06808) Çözüm
- [PMixED (arXiv:2403.15638)](https://arxiv.org/abs/2403.15638) sonucu-zaman 私有预测
