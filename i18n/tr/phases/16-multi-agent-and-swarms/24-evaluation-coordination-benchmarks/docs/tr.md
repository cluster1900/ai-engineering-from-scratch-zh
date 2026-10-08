# 评估与协调 Benchmarks

> 2025-2026 yılları için beş referans  multi-agent  değerlendirme alanı kapsamaktadır.**MultiAgentBench / MARBLE**(ACL 2025, arXiv:2503.01935) önemli nokta KPI'lerini kullanarak  评估 star/chain/tree/graph 拓;**graph 最适合 research**,kognitif planlama  yaklaşık % 3'lik bir gelişme göstergesi başarısı**COMMA**评估 Multimodal asimetrik-informasyon koordinasyonu; GPT-4o dahil olmak üzere içinde en gelişmiş model çok zor rastgele temel çizgiyi aşmak için.**MedAgentBoard**(arXiv:2505.12371) dört sınıf tıbbi görev kapsamaktadır ve sıklıkla çoklu ajanın tek bir LLM'den daha iyi olmadığını bulur.**AgentArch**(arXiv:2509.10769) referans 结合 araç kullanımı + bellek + orkestrasyon 的企业代理架构──**SWE-bench Pro**([arXiv:2509.16941](https://arxiv.org/abs/2509.16941)) içeren 41 个 repos arasında 1865 个问题, Business Apps, B2B hizmetleri ve geliştiriciler aracı; sınır modelleri Pro'da %23'e kadar, Verified'de %70'den fazla.**64.3%**,并显式使用代理-teams coordination( henüz Antropic Primary Source  先视为初步结果;Verdent(agent scaffold) 在 Verified 上达到**76.1% pass@1**([Verdent technical report](https://www.verdent.ai/blog/swe-bench-verified-technical-report))。**AAAI 2026 Bridge Program WMAC**(https://multiagents.org/2026/）是2026 yıl社区焦点──本课基于 MARBLE 的指标,运行拓学-对-指标扫描,并固定仅通过SWE-bench Verified 不是概括证证这条规则──

**类型：**Öğrenin
**语言：**Python (stdlib)
**先修：**16 · 15 aşaması (Savlama ve Tartışma Topolojisi), 16 · 23 aşaması (Başarısızlık Modları)
**时间：**75 dakika kadar .

## 问题

Bir makalede, daha iyi bir zaman için çoklu ajan sistemimiz olduğunu iddia ettiğinde, soru şuydu: Neyi daha iyi, hangi görevlerde daha iyi, nasıl ölçülebilir? 2023-2024 yıllarındaki çoklu ajanlar  değerlendirmek çok karışık  Herkes kendi ölçümlerini, kendi temel çizgilerini ve kendi görev kümelerini seçti.

没有共享基准,你不能有意地比较两个多代理系统――更糟的是,没有支out基准,边界模型可能受到污染――到2025年中,SWE-bench Verified 已部分进入训练语料而受到污染;边界分数 膨胀;Pro被设计成未污染的现实检验――

Bu ders 2026 yılın beş kanonik referansını gösterir, her referansın 衡量什么,并教你用怀疑态度阅读reference claims──

## 概念

### MultiAgentBench (MARBLE)  ACL 2025

arXiv:2503.01935── araştırma, kodlama ve planlama görevlerinde dört koordinasyon topolojisini değerlendirmek, yıldız, zincir, ağaç, grafik.

测量结果:

- **Graph**Topoloji, araştırma senaryolarına en uygun; herhangi bir eleştiriyi desteklemek.
- **Chain**En uygun adım adım arıtma kodlaması:
- **Star**En iyi hızlı gerçekleşme için en uygun yöntem.
- **Coordination tax**Graf üzerinde yaklaşık 4 ajanın ortaya çıkması.
- **Cognitive planning**Topolojilerde, başarıların %3 oranında artış göstergesi olarak görülüyor.

kullanma: 你想对协调拓学进行果对果比较──MARBLE repo(https://github.com/ulab-uiuc/MARBLE）提供değerlendirici

### COMMA  Multimodal 非对称信息

Rapor sonuçları uygun değildir: GPT-4o'nun içindeki sınır modelleri de dahil olmak üzere COMMA'nın ajan-ajen işbirliği üzerinde çok zorluk çekti.**random baseline** sinyal: çoklu ajan modaliteleri  eğitim eksikliği  değerlendirme eksikliği  LLM'ler  tek modalitelerle işbirliği daha mantıklı bir şekilde halledebilir; çok modalitelerle koordinasyon 会崩。

kullanma: sisteminiz multimodal veya asimetrik-informasyon koordinasyonu vardır.

### MedAgentBoard  alan stres testi

arXiv:2505.12371──四类医疗任务:诊断、治疗规划、报告生成、患者通信──比较多代理、单个LLM 和传统规则基础系统──

发现:multi-agent 在大多数类别上不优于单-LLM──multi-agent优势很狭 当子任务可以清晰分离时(诊断 +治疗),任务分解 有帮助; 当协调总费 超过专业化获取时(报告生成),它会伤害效果──

kullanma: alanınız tek bir LLM temel çizgisi vardır. MedAgentBoard'un tecrübesinin genel hale getirilmesi mümkünse, önerilen birçok multi-agent sistemi aşırı mühendislik yapılmıştır.

### AgentArch  Girişimci mimarlıklar

ArXiv:2509.10769──将工具使用、内存 和配乐 分层组合的企业设置──基准 隔离每层的贡献: 添加工具有多大帮助吗? 添加内存吗? 添加多代理配乐吗? 添加多代理配乐吗? 添加多代理配乐吗? 添加多代理配乐吗? 添加多代理配乐吗? 添加多代理配乐吗? 添加多代理配乐吗? 添加多代理配乐吗? 添加多代理配乐吗?

Use scenario:You are designing an enterprise agent stack,并需要证明每层的合理性──AgentArch 帮助避免购买那些你无法衡量其价值的功能──

### SWE-bench Pro  现实检验

ArXiv:2509.16941──41 个库 中的 1865 个问题,覆盖商业应用,B2B hizmetleri,开发者工具──设计目标是相对较晚训截止时间保持**未污染**❖ Sınırlı modeller %23 oranında Pro'da, %70 oranında Verified'de bulunmaktadır.

2026 yıl 4 月分数:
- Claude Opus 4.7 Pro: **64.3%**(rapport称显式使用代理-teams coordination; henüz Antropic ilk kaynak yayınlanmamış  先视为初步结果)
- Verified: **76.1% pass@1**([technical report](https://www.verdent.ai/blog/swe-bench-verified-technical-report))。
- İzleyici asfaltlama nın sınırlı ham puanları Pro: ~23-35%([SWE-bench Pro paper](https://arxiv.org/abs/2509.16941))。

Önemli nokta:                                                                                                                                                                                                                                                            

### AAAI 2026 WMAC

AAAI 2026 Köprü Programı  Çoklu Ajan Koordinasyonu Atölyesindehttps://multiagents.org/2026/）。这是2026 yıl multi-agent AI Araştırmalar'ın toplumsal odak noktası. Kabul edilen makaleler ve atölye işlemleri yeni yöntemlerin kanonik değerlendirilmesidir.

### Şüphecilik  2026 kontrol listesi

Birileri çoklu ajan sonucu iddia ettiğinde:

1. **哪个 benchmark，哪个 split？**SWE-bench Verified ve Pro                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
2. **Contamination check。**Benchmark test edilmiş modellerin eğitim kesinti sonrasında yayınlanmalı mıydı?
3. **Baseline comparison。**Tek LLM temel hattı, rastgele, önceki çoklu ajan çalışmaları ile karşılaştırılmaktadır.
4. **Statistical significance。**N test 、p-değer 、güven aralığı。Sınır modelleri varansı 很高; tek çalışmalar 会误导。
5. **Task diversity。**Bir görev mi yoksa çok mu? Üretim için genelleşme çok önemlidir.
6. **Cost disclosure。**Görev başına tokens 壁 saatı ⋅ 20x %90 çözümü iş kararları, yetenek açıklaması değil ⋅

### Geçmişte değerlendirme , kötü içeriği ölçüyor

- **Long-horizon coordination。**持续 birkaç gün boyunca duvar-saati etkileşimi──
- **Adversarial resilience。**Bir ajan kötü niyetle saldırdığında ne olur?
- **Drift under deployment。**Benchmarks is statiquo; production distribution will change.
- **Cost-normalized performance。**Büyük çoğunluk referans değerleri, dolar başına doğru değil, çamurlu doğruluk rapor eder.

Gerçek ilgi alanınız için kendi iç standartlarınızı oluşturmak genellikle doğru bir yöntemdir.


```figure
a5-bench-gap
```

## Yapın onu.
`code/main.py`Bu, etkileşimsiz bir yürüyüş.

- Oyuncak görevi üstü üç tane çoklu ajan sistemi.
- Her sistem için MARBLE tarzı kilometrelik metrikleri hesaplanır.
- Treining Set                                                                                                                                                                                                                                                            
- 显式比较随机基线──
- 打印 referans değerleri-için puan kartı

运行:

```bash
python3 code/main.py
```

预期输出:Sistem puan kartı, çiğ doğruluk, öncü noktaların başarısı, görev başına maliyetler vs. rastgele başlangıç çizgisi delta ve kirlilik kontrol notu içerir.

## Kullan
`outputs/skill-benchmark-reader.md`读取任意多代理基准索赔,并应用审查检查清单──输出:grade 和 caveats──

## - Söyle.
生产评估纪律:

- **构建 internal benchmark**Halkın referans değerleri bilgi sağlayabilir, ancak değiştiremez.
- **在每次比较中包含 random baseline。**Eğer koordinasyon göreviyle birlikte rastgeleden fazla ilerleyemezsen, görevi tanımlamak kötü olabilir.
- **同时报告 cost 和 accuracy。**Token cost 和 duvar saati──Ops takımları 两者都需要──
- **每季度重建 benchmark。**Üretim dağılımı 会变化;陈旧基准 会误导──
- **避免 published-benchmark overfitting。**Eğer takımınız özel olarak SWE-bench Pro numarasını optimize ederse, siz de üretim sırasında geri döneceksiniz.

## 练习

1. 运行  İşlem`code/main.py`❖ Üç simülasyon sisteminden hangisinin en iyi maliyet-bir kilometre taşı ile uyumlu olduğunu bul.
2. 阅读 MultiAgentBench(arXiv:2503.01935)。 Kendi görev alanına göre, MARBLE 会推四种TOPOLOGY 中的哪一种──根据论文结果说明理由──
3. SWE-bench Pro kağıdı okuyun. Nasıl bulaşmaya direnir? Aynı şekilde, sizin ilginizi çeken diğer referanslara da uygulanabilir mi?
4. COMMA'nın Bulguları hakkında bilgi almak için, bir iç referanslamayı oluşturmak için basit bir çok modal koordinasyon görevi oluşturmak için ne yapılabilir?
5. Benchmark iddiaları kontrol listesini 应用于一篇近期多代理论文的头条结果──你会给这个索赔什么评分?

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| MARBLE | "MultiAgentBench" | ACL 2025；带 milestone KPIs 的 star/chain/tree/graph topologies。 |
| COMMA | "Multimodal benchmark" | Multimodal asymmetric-info coordination；frontier models 相比 random 表现吃力。 |
| MedAgentBoard | "Domain stress test" | 四个医疗类别；经常发现 multi-agent 并不优于 single-LLM。 |
| AgentArch | "Enterprise benchmark" | Tools + memory + orchestration 分层组合。 |
| SWE-bench Pro | "Contamination-resistant" | 1865 个问题、41 个 repos；在 Verified 上约 23% vs 70%+（contamination signal）。 |
| Milestone achievement | "Partial credit" | 奖励进展而不只奖励最终成功的 benchmarks。 |
| Contamination | "Benchmark leaked into training" | 发布后，benchmarks 进入训练语料；分数膨胀。 |
| WMAC | "AAAI 2026 Bridge Program" | Workshop on Multi-Agent Coordination；社区焦点。 |

## 延伸阅读

- [MultiAgentBench / MARBLE](https://arxiv.org/abs/2503.01935) 带 milestone KPIs'in topoloji referansı
- [MARBLE repository](https://github.com/ulab-uiuc/MARBLE) Referans uygulanması
- [MedAgentBoard](https://arxiv.org/abs/2505.12371) Domain stress test; multi-agent genellikle iyi değildir
- [AgentArch](https://arxiv.org/abs/2509.10769) Girişimci ajan mimarisi
- [SWE-bench leaderboards](https://www.swebench.com/) sınır modelleri  Verified 和 Pro 分数
- [AAAI 2026 WMAC](https://multiagents.org/2026/) 2026 yıl社区焦点
