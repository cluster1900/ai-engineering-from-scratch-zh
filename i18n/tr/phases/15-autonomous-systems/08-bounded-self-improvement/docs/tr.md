# Sınırlı Öz-İyilik 设计

> Araştırmalar, dört temel öz geliştirme döngüsünü elde etmiştir. Formal invariantlar, her bir editörün önüne geçerek oluşturulmalıdır. Düzüntülük demirleri, değiştirilmez. Çoklu objektif kısıtlamalar, her boyut, güvenlik, adalet ve dayanıklılık gerektirir. Sadece performans değil, gerileme algısı oluşturulmalıdır. Tarih ölçümlerinde, kapasitelerin kaybını gösterir.

**Type:** Learn
**语言：**Python (stdlib, değişmez kontrol ile sınırlı döngü)
**Prerequisites:** Phase 15 · 07 (RSI), Phase 15 · 04 (DGM)
**Time:** ~60 minutes

## 问题

Ders 7'nin yarış simülatörü, küçük hız farklarının büyük farkları bir araya getirmesini göstermektedir. Ders 4'ün DGM vaka çalışması, bir döngünün kendi değerlendicilerini aktif olarak yönlendirebileceğini göstermektedir. Bu iki sonuç aynı bir tasarım sorunu yönlendirir:

ICLR 2026 RSI Workshop özet (openreview.net/pdf?id=OsPQ6zTQXV)  dört bu tür ilkeleri tanıdı. Antropik'in RSP v3.0  Ders 19) ve DeepMind'in FSF v3  Ders 20)  Capacity thresholds  arasında onları sitat etti.

诚实的表述是:这些是缓解. 信息论的结果限制了任何系统能够证明其自身后系统性质的范围,目前没有任何设计从形式关闭这个问题.

## 概念

### İlkel 1: resmi değişkenler

Değişkinlik, her kendi kendine değiştirilmesinde öncelikle oluşmuş bir özelliktir. Örnek:

- Üretim dağıtımı,                                                                                                                                                                                                                                                            
- 无工具调指向未授权的终点──
- Hatıra, 通過已记录、已签名的路径── yazıyor.
- değerlendirici'nin modül haşi onay versiyonu ile uyumlu olarak kullanılır.

Değişiklikler tarafından düzenlenemez dış kod kontrolü. Eğer bir değişiklik önerilse, Değişikliklerin karşılığı reddedilecek.

難點在選擇既對安全的需要又能在合理時間內計算的變量──過度指定會阻礙進步;過度指定會讓循环 越來越重要属性── 難點在選擇既對安全的需要又能在合理時間內計算的變量──過度指定會阻礙進步;過度指定會讓循环 越來越重要属性── 難點在選擇既對安全的需要,又能在合理時間內計算的變量── 難點在選擇的選擇中.

### Primitive 2: Düzeltme demirleri

Düzeltme demir ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ 

- Her çağrı sadece okunabilir bir yerden yapılır.
- 位于独立存储库、具有独立访问控制的评价员──
- İnsan tarafından imzalanmış ve her döngüde yeniden onaylanmış araç-ilkınat manifesti.

Anchor'ın rolü, objektif sürüklenmeyi önlemektir.

微妙的失败模式: Even loop 不能编辑

### İlkel 3: Çok amaçlı kısıtlamalar

Sadece tek bir skalar puanı optimization loop kısa yollar bulacaktır. Aynı zamanda birçok zor kısıtlamaları karşılamak gerekir.

- Performans (( görev düzeyinde referans değerleri)
- Güvenlik(kırmızı takım değerlendirmeleri  bilinmeyen kötü                                                                                                                                                                                                                                                        
- Düzgünlik(sansıf alt gruplar (yüksek farklı etki sınırları)
- Güçlülik ((OOD test setleri, karşıt giriş kullanım)

Sadece her kısıtlama kurulduğunda, değişiklik kabul edilir. Ders 13'ün mali kısıtlamalarla birlikte değişecek. Ders 18'in Llama Guard'ı güvenlik eksesi olarak kullanılacak.

### Primitif 4: Regresi tespit

Her döngünün puanları tarihsel dağılımlarla karşılaştırılır. Konutlama toleransının düşüşü bir süreliğine geçiyor. Bu sessiz kapasite kaybını yakalayabilir.

Bir pratik gerçekleşme: depo yakın N 个周期 个任务的分点──每个新周期 计算 per task delta──任意 delta 门值以下,则拒绝该周期并交由人评──

### 信息论限制

Kolmogorov karmaşıklığı ve Lob'un teoremi, kendi doğasını kanıtlayabilecek bir sistem için, kendi doğasını kanıtlayan bir alan belirledi.

Bu bizim ilkelerimize anlamı da şu: Güvenlik sorununu kapatamazlar. Sessiz başarısızlığı daha pahalı hale getirirler. Kötü ya da akıntılı bir döngü. Eğer orijinal bir kontrolün eksikliğiyle karşılaşırsa, artık açık bir kontrolün bozulmasına yol açmalı. Bu daha kolay kontrol edilebilen bir imzadır.

### Bir örnek .

Bir ajanı varsayalım bir kez düzenlemeyi önerir.

1. Değişmeyen kontroller: modül haşları, araç izinleri manifesti, anayasa başlığı,
2. Anchor check:objective statement with approval version matching (Bayt-wise veya semantik olarak)
3. Çok amaçlı değerlendirme:performans, güvenlik, adalet, dayanıklılık aksları¬
4. Geri dönüş algısı: herhangi bir eksis yok.

Dört kişi geçmeli, düzenlemek için.


```figure
bounded-gates
```

## Kullan

`code/main.py`Ders 4'te DGM 风格玩具 上运行一个有限的自我改进循环,但它叠加了这些四个原始人──每个原始人都可以单独启动或禁用──演示目标是:每个原始人都能捕获一个特定的失败类,而移除其中任何一个都将使应对失败类通过──

## - Söyle.

`outputs/skill-bounded-loop-review.md`Bu, önerilen sınırlı döngüyi denetlemektedir ve sadece hangi dört ilkelin gerçekleştiğini iddia etmesinden ziyade, hangi ilk önceliklerin gerçekleştiğini değerlendirir.

## 练习

1. Tüm primitifler başlatıldığında çalıştırılır .`code/main.py`❖ Bildirme döngüsü ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒     ⇒ ⇒  ⇒ ⇒ ⇒     ⇒ ⇒             ⇒        ⇒                                                                                                                                                                                                          

2. 禁用回归检测――构建一个输入,使它导致沉默能力损失被接受――

3. 禁用多目的制约──展示循环 在性能軸上收,同时安全軸下降──

4. Kodlama ajanı için bir ayarlı demir tasarlayın.

5. ICLR 2026 RSI Atölyesi özetini okuyun. Seçim dört ilkelden biri,并为当前状态 提出一个具体改进──

## 关键术语

| Term | 人们的说法 | 实际含义 |
|---|---|---|
| Invariant | “始终为真的属性” | 每次 edit 前后由外部代码检查的属性 |
| Alignment anchor | “固定的目标” | 位于 loop edit surface 之外的不可变 core-goal representation |
| Multi-objective constraint | “所有 axes 都必须成立” | Performance、safety、fairness、robustness——全部必需 |
| Regression detection | “下降时暂停” | 当历史 metric deltas 暗示 capability loss 时暂停 loop |
| Kolmogorov bound | “信息论限制” | 限制系统能够证明其自身后继系统性质的范围 |
| Lob's theorem | “self-reference 陷阱” | 系统可以在没有证明自己应该做某事的情况下，依据“我应该”采取行动 |
| Gate stack | “分层检查” | 多个 primitives 的组合；任何 failure 都会拒绝 edit |
| Bounded improvement | “mitigation，而不是 proof” | 提高 silent-failure 成本；不会关闭 safety problem |

## 延伸阅读

- [ICLR 2026 RSI Workshop summary (OpenReview)](https://openreview.net/pdf?id=OsPQ6zTQXV)Dört ilkelin sayısı.
- [Anthropic Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) Çok amaçlı kapasite eşiği。
- [DeepMind Frontier Safety Framework v3](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) Yanlış uyum izleme  as invariant primitif
- [Schmidhuber (2003). Godel Machines](https://people.idsia.ch/~juergen/goedelmachine.html)Bu ilkelerinin resmi kanıtları  
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) Sebep tabanlı ayarlama demirçiliği。
