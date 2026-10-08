# METR Zaman Uçakları ve Dış Güçleri Değerlendirme

> METR(前身 ARC Evals) 2023 yılının 12 月 ayından bağımsız bir 501 ((c) 3) 組織── Time Horizon 1.1 referandumu ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

**类型：**Öğrenin
**语言：**Python (stdlib, lojistik uygun ufuk tahmincisi)
**先修：**15 · 01 aşaması (Uzun Uçraklık ajanları), 15 · 19 aşaması (RSP)
**时间：**~ 60 dakika

## 问题

Ölçekleme politikalarının değeri, alıntılanan ölçüm sonuçlarına bağlıdır. AI R&D-4 eşiği ve uzun mesafeli özerklik politika metninde tanımlanmıştır. Sadece belirli değerlendirmeler belirli rakamlar ortaya çıktığında, ancak uygulanabilir hale gelir.

METR, 2024  2026 yılları arasında yapılan bir dış değerlendirme örgütüdür. Bu rakamların birçoğunu tanımlıyor. Genellikle model yayınlanmadan önce  laboratuvar imzalaması şartıyla yürütülür ve sonrasında yöntem teorisini yayınlar. Time Horizon 1.1 referansı  2026 yılının 1 ayı) onların temel başarılarından biridir: Bir kapasiteden insan okuyabileceği bir birim tek birimi olarak sıkıştırılır. Bu model, uzmanların %50 güvenilirlikle tamamlayacağı X 小時処理する类任务) 

Bu dersin bir kısmı metodoloji hakkında, bir kısmı açıklama şekli hakkında. Bu iki beceriyi birlikte anlamak gerekir.

## 概念

### METR 背景

- 成立时间:2023 年 12 月(前身为 ARC Evals,拆分为独立 501(c)(3))
- 范围: sınır modellerinin özerk yeteneklerini değerlendirmek, genellikle yayınlanmadan önce yapılmaktadır.
- 合作实验室:Anthropic、OpenAI(20252026 Yıllarca katılım)
- 重要交付物:Time Horizon 1.0(2025 yıl 3 月) 、Time Horizon 1.1(2026 yıl 1 月) 、原型监控评估──

### Zaman Uçaklığı 拟合

方法论(METR blogundan ve makalelerinden):

1. 收集一个任务套件,覆盖分钟级到小时级的专家完成时间──当前套件:HCAST(180+个任务)、RE-Bench(71个任务)、SWAA──
2. 让模型运行每个任务;记录成功或失败――
3. 拟合一条 lojistik eğri:P(başarılı) is log(专家完成时间) 的函数──
4. ufuk = P(başarılılık) = 0.5 的专家时间──

Logistik-fit  şekli uyguntur, çünkü yetenek ve görev zorluğu arasında genellikle bir artış ve yaklaşım ilişkisi vardır. %50 nokta bir seçimdir.

### 2026 yıl 1 月数字

Zaman Uzaklığı 1.1'e göre:

- Claude Opus 4.6: %50 güvenilirlik altında yaklaşık 14 saat, Time Horizon 1.1 
- HCAST tarzı  görevdeki iki katlama süresi:Time Horizon 1.1(2026 yıl 1 月) Raporunun 2023 sonrası 拟合约为 4.3 个月(130.8 天); yaklaşık 7 个月的数字是Time Horizon 1.0 20192025 时间表 时间表 时间表 时间表 时间表 时间表 时间表 时间表 1.1 时间表 时间表 时间表 时间表 时间表 时间表 时间表 时间表 1.1 时间表 时间表 时间表 时间表 时间表 时间表 时间表 时间表 时间表 时间表 时间表 时间表 时间表 时间表 时间表 时间表 时间表 时间表 时间表 时间表 时间表 时间表 时间 时间表 时间表 时间 时间表 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间  时间 时间 时间   时间 时间    时间  时间                                                                        

Bunlar, 15. aşamada yapılan belirli sayıların bir kısmıdır. Antropik'in RSP v3.0 (Düşünme 19) ve DeepMind'in FSF v3 (Düşünme 20) bunları giriş eşiği değerlendirmelerinin bir ölçümlerinden biri olarak belirtti.

### Benchmark suiteları

- **HCAST**:189 个任务,覆盖 ML、网络安全、软件工程 和一般推理──跨度:1 分钟到8+ 小时的专家时间──它是视界 数字背后的主要套件──
- **RE-Bench**:71 个 ML araştırma- mühendisliği 任务,带有人类专家基线――衡量模型能否完成会输入到AI R&D-4 门值 中的那类 ML R&D 工作――
- **SWAA**:较短任务;校准视野曲线的低端中.

### Çeviri:

20252026 yıl METR 工作 içerir izleme-değerlendirme prototipleri:monitor 能否发现模型正在执行副任务;;即操作员所要求之外的事情);agent 能否规避监督;;这些直接输入到OpenAI PF v2 的Undermining Safeguards类别,以及DeepMind FSF v3(Lesson 20) 中的欺骗-alignment monitoring──

### Neden ufuklar üst sınır ?

- **理想化工具**:benchmark görevleri 给模型提供干净工具和格式良好的数据──真实部署更混乱──
- **没有真实后果**Modelle gerçek müşteriye ücret vermez, gerçek verileri silmez veya gerçek kişilere bağlanır.
- **Eval-context gaming**Ders 1. 模型在测试中的行为不同──2026 Uluslararası AI Güvenlik Raporu bunu gerçek bir şekilde kaydetti.
- **没有真实用户差异**Benchmark istekleri yapılandırılmışdır. Gerçek kullanıcılar belirsiz olarak önerir ve aşağıdaki isteklere bağlıdır.

Uyumlu koşullar altında güç sınırlarıdır. Deployment reliability is another number, lower, and the team must measure their own distribution to know it.

### Dışişleri değerlendirici

Dış değerlendirme önemlidir, çünkü iç laboratuvarlar raporlarını iyileştirme gücüne sahiptir. METR'in bağımsızlığı: Açık metodoloji ve eşevalükar makalelerin 501 (c) (3) sahibi olmak, yapısal bir hafifleme önlemidir.

### 如何在实践中使用视界 数字

- **作为能力过滤器**Eğer bir modelin ufku önerilir görevlerin uzman zamanından daha düşükse, onu kendiliğinden                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
- **作为趋势指标**Bu, yeni bir hafifleme olmamasına rağmen, mevcut uygulamaların uzun süreliğine de devam edebileceğini gösteriyor.
- **作为 prior**14 saatlik ufuk başlangıç noktasıdır. Görevlerin dağılımı, araç kalitesi ve dağıtımına göre aşağıya doğru düzenlenir.


```figure
a5-horizon-fit
```

## Kullan

`code/main.py`合成結果集, görev başarısı ve log  expert time  logistik uyumunu gerçekleştirdi.  rapor 50% ufuk  METR  的主指标)  10% ufuk 保守)  90% ufuk 乐观)  Aynı zamanda başarının oranı değerlendirilmiş kontext oyunları tarafından gösterilmiştir.

## - Söyle.

`outputs/skill-horizon-interpretation.md`审查 vendor's horizon claim,并产出基准索赔与部署现实之间的差分析──

## 练习

1. 运行  İşlem`code/main.py`❖ %50'lik ufuk, toplanmış yeryüzü gerçekliği ile uyumlu olduğunu doğrula­

2. METR'in Time Horizon 1.1 blog yazısını okuyun. En yüksek ve en düşük güvenilirliği olan özel görevleri bul.

3. 阅读 METR 的Measuring Autonomous AI Capabilities资源──列出 HCAST 任务类别──选择一个你会在生产任务中赋予更高权重的类别,并说明理由──

4. Evalu-context oyunları  Simülatör: Başarısız görevlerin %20'sini başarıyla dönüştürmek.

5. DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA COLLECTION DATA DATA COLLECTION DATA DATA COLLECTION DATA COLLECTION DATA DATA DATA DATA COLLECTION DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA  DATA DATA     DATA DATA DATA  DATA  DATA   DATA     DATA DATA DATA    DATA         DATA  DATA                DATA DATA                                    

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| METR | “外部评估者” | 前身为 ARC Evals；自 2023 年 12 月起为独立 501(c)(3) |
| Time Horizon | “能力度量” | 来自 logistic fit 的、50% 可靠性下的专家任务长度 |
| HCAST | “METR 的主套件” | 180+ 个任务，跨度从 1 分钟到 8+ 小时 |
| RE-Bench | “Research engineering” | 71 个带人类 baseline 的 ML research-engineering 任务 |
| SWAA | “短任务套件” | 校准 horizon curve 的低端 |
| Doubling time | “增长率” | 50% horizon 翻倍所需时间；按 HCAST 约 7 个月 |
| Eval-context gaming | “模型行为不同” | 测试与部署之间有记录的行为差距 |
| Upper bound | “Horizon 是上限” | benchmark horizon > 负载下的 deployment reliability |

## 延伸阅读

- [METR — Resources for Measuring Autonomous AI Capabilities](https://metr.org/measuring-autonomous-ai-capabilities/) HCAST、RE-Bench、SWAA 规格──
- [METR — Measuring AI Ability to Complete Long Tasks](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/) 原始 ufuk kağıdı
- [METR — Time Horizon 1.1 (January 2026)](https://metr.org/research/) 当前数字和方法论──
- [Epoch AI — METR Time Horizons benchmark](https://epoch.ai/benchmarks/metr-time-horizons)Gerçekte takip ediyorum.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 关于 METR ölçümlerinin iç açısı
