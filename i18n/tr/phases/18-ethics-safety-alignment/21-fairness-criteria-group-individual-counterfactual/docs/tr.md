# 公平性标准  群体、个体、反事实

> Üç aile, adalet oluşturur 文献的结构──Grup adaleti:demografik eşitlik、 eşit olasılıklar、 koşullu kullanım doğruluğu eşitliği   平均 anlamda, koruma altındaki gruplar arasında benzer oranlara sahiptir── bireysel adalet(Dwork et al. 2012:相似个体获得相似决策;对决策映射施加 Lipschitz koşulı。Tekeç gerçeklik(Kusner et al. 2017): Eğer karşıt faktör yer değişken hassas özellikler zaman kararlar değişmezse, o zaman karar birey için adil olacaktır. 2023 teorik sonucu.

**类型：**Öğrenin
**语言：**Python(stdlib,Üç kriterle karşılaştırma)
**先修：**18 · 20                                                                                                                                                                                                                                                              
**时间：**60 dakika kadar .

## Öğrenme hedefi

- Üç grup adalet kriterini belirtmek: • demografik eşitlik, eşit olasılıklar, koşullu kullanım doğruluğunun eşitliği ve bir imkansızlık sonucu.
- Dwork et al. 2012'nin Lipschitz formülasyonu  bireysel adalet tanımlamak
-  counterfactual fairness  ve neden grafiğine olan bağımlılığı
-  geriye doğru geriye doğru karşı faktörleri açıklayın, ve neden korunan özellik müdahalelerini çevirebilirler 问题──

## 问题

Ders 20  tartışılması tarafsızlık ölçümüdür. Ders 21  tartışılması ölçümü tanımlamak 应服务的公平标准── bu üç aile yapısal olarak farklı standartlar sunmuştur.

## 概念

### Grup adilliği

- **Demographic parity.**P  Y=1  A=a = P  Y=1  A=a'), tüm gruplar için oluşturulan                                                                                                                                                                                                                                                
- **Equalized odds.**P(Y=1 √ Y*=y, A=a) = P(Y=1 √ Y*=y, A=a') √
- **Conditional use accuracy equality.**P(Y*=y. Y=y, A=a) = P(Y*=y.

İmkansızlık (Chouldechova, Kleinberg-Mullainathan-Raghavan 2017):

### Kişisel adalet

Dwork et al. 2012── eğer bir görev spesifik benzerlik metrikine d, karar haritası f 满足 f x) - f x') <= L * d x, x'), L                                                                                                                                                                                                                                      

Bu, istatistik değil, politika sorusu.

### Gerçeklere karşı adillik

Kusner et al. 2017: Eğer nüfusun nedensel modeli altında, bireyin hassas özellikleri karşıt olarak değiştirildiğinde, karar değişmezse, bireylere karşı kararın karşıt olarak adil olması gerekir.

Bu bir sebepli DAG gerektirir. DAG bir model seçeneği.

### CF vs. Düzgünlik karşılığı

NeurIPS 2024 teorik:tüşünçsel adalet ve tahminsel doğruluk 之间存在内在交易off──一种模型-agnostic 方法可以将优тима-但不公平预测器转换为CF预测器,并付出有界的精度成本──该精度成本 取决于优тима不公平预测器 中敏感属性系数的大小──

### Geriye dönme karşı faktörleri

ArXiv:2401.13935(2024 yıl 1 月)  geleneksel karşıtlıklar                                                                                                                                                                                                                                                    

Geriye doğru karşı faktörler: Özellikle müdahale edilmek değil, bu bireyin gerçek özelliklerinin hangi bir kombinasyonunun karşı faktör sonuçlar doğuracağını sormak.

### Felsefi uzlaşma

ICLR Blogpostes 2024──当手中因果图时,满足某些群-fairness measures 会含反事实性公平──这些三家族并非彼此正交;它们是同一层因果结构的不同方面──

Bu, imkansızlık teorelerini çözemez.Base oranları farklılıklar aynı anda grup adaletini engelleyecektir. Ancak, group ile individual/kontrfaktual  arasında, belirgin bir nedenlik modeli olmadığından ve ortaya çıkan eserlerden dolayı dir.

### Bu ders 18 Eylül'ün ortasındaki konumdadır.

Ders 20 önyargı ölçümüdür. Ders 21 adalet tanımıdır. Ders 22 gizlilikdir. Ders 23 su işaretlemektir. Bunlar, aldatma-kötüleme dersleri tamamlamak için ayırt etme ile ilgili derslerdir. Ders 7-11。


```figure
an-fairness-trilemma
```

## Kullan

`code/main.py`Bir oyuncak ikili sınıflandırma verisi oluşturmak, bunlardan biri hassas bir özelliği ve farklılıkların temel oranlarını içerir.                                                                                                                                                                                                                                              

## - Söyle.

本课会生成 `outputs/skill-fairness-criterion.md`❖ Bir adalet iddiası veya politikası belirle, iddialarının hangi kriter olduğunu belirle, iddiaların eşitsiz taban oranlarının aşağıdaki modelinin diğer kriterleri karşılayabilecek olup olmadığını ve iddiaların nedenlik DAG'ya bağlı olduğunu belirle.

## 练习

1. 运行  İşlem`code/main.py` rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:  rapor:                                                                                                                                                                                                                          

2. Use nonsensitive characteristics on L2 实现 Dwork et al. 2012'in bireysel-eğitim ölçümleri.

3. Kusner et al. 2017: ⇒ Resume puanlaması için ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒    ⇒ ⇒    ⇒ ⇒      ⇒      ⇒    ⇒                                                                                                                                                 

4. 2024 geriye doğru geriye doğru karşı faktörler 论文 avoided intervention on protected attributes── describe a situation which is important to legal compliance ― hukuki uyumluğa karşı önemli bir durum olduğunu anlatmak

5. ICLR 2024 uzlaşması  grup adalet ve karşı gerçek adalet aynı yapının farklı yönleri olduğunu düşünüyor.`code/main.py`İki kriterin arasından birini seçerek, bu iki kriterin nedensel varsayımını eşit hale getireceğini açıklar.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Demographic parity | “equal rates” | P(Y=1 | A=a) 在群体之间相等 |
| Equalized odds | “equal TPR/FPR” | 群体之间相等的 true-positive 和 false-positive rates |
| Conditional use accuracy | “equal PPV/NPV” | 群体之间相等的 predictive values |
| Individual fairness | “Lipschitz condition” | 相似个体获得相似决策 |
| Counterfactual fairness | “causal alteration invariance” | 在 counterfactual attribute alteration 下决策保持不变 |
| Backtracking counterfactual | “explain via actuals” | Counterfactual 是从 outcome 向后推理，而不是从 attribute 向前推理 |
| Impossibility theorem | “the three conflict” | Chouldechova / KMR 2017：在 base rates 不相等时，group criteria 相互排斥 |

## 延伸阅读

- [Dwork et al. — Fairness through Awareness (arXiv:1104.3913)](https://arxiv.org/abs/1104.3913) bireysel adalet
- [Kusner, Loftus, Russell, Silva — Counterfactual Fairness (arXiv:1703.06856)](https://arxiv.org/abs/1703.06856) karşı gerçek adillik
- [Chouldechova — Fair prediction with disparate impact (arXiv:1703.00056)](https://arxiv.org/abs/1703.00056) imkansızlık
- [Backtracking Counterfactuals (arXiv:2401.13935)](https://arxiv.org/abs/2401.13935) korunan özellik müdahalelerinin yeni bir biçimi
