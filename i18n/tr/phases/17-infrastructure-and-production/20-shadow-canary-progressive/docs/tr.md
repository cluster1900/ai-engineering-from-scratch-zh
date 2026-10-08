# LLM'lerin Gölge Trafikleri, Kanarya Çeviri ve Gelişmiş Çeviri

> LLM başlatmaları  Yazılım dağıtımında en zor kısmı birleştirir: birim testleri yoktur, başarısızlık modları ızdırap ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ızdıracak ız

**Type:** 学习
**语言：**Python, oyuncak, kanarya ilerleme simülatörü.
**Prerequisites:** Phase 17 · 13（Observability），Phase 17 · 21（A/B Testing）
**Time:** ~60 分钟

## Öğrenme hedefi

- 区分影模式 (零影响比较) 卡尼尔 (canary) 现场流量 (live traffic)  A/B (stability confirmation) 后的比较)
- 列举五个LLM-sözlü kanarya ölçümleri ((latency,cost/request,error/refusal,output-length distribution,user feedback) ]]
- LLM'nin neden belirsizliksizliğine açıklayın.
- 设计一个耗时数秒的政策转变) 设计一个耗时数秒的政策转变) 设计一个耗时数秒的政策转变) 设计一个耗时数秒的政策转变 (rollback) 设计一个耗时数秒的政策转变) 设计一个耗时数秒的政策转变 (rollback) 路径,而不是数小时的重新部署 (rollback) 的路径──

## 问题

Yeni bir model yayınladınız. Offline değerlendirmeler. Kesinliği %3 arttı. Üretim sırasında etkinleştirildi. 24 saat içinde maliyet %40 arttı. Kullanıcı parmaklarını aşağıya düşürdü. %8 arttı.

Bu her şeyi önleyebiliriz. Shadow Mode, herhangi bir kullanıcı görmeden önce %40'lık maliyet artışını yakalar. Canary Program, parmaklarını aşağıda bırakır.

## 概念

### Gölge modusu

Başvurucu  alım ve üretim benzer istekler; çıkışlar kaydedilecek, ancak kullanıcılara geri dönmeyecek ∞ kullanıcılara ∞ etkisi ∞ kaydedilecek:

- Üretim içerikleri üretim ile farklılık göstermektedir.
- Token sayıları ((cost delta)
- Gecikme.
- İtiraz ve hata.

能捕捉:cost blow-ups、length regressions、明显 প্রত্যাখ্যান değişiklikleri、hard errors──不能捕捉: user will perceive to its quality delta──影是烟雾测试,不是质量测试──

### Kanaryaların dağıtımı

带 gate 的渐进性交通转移──典型进度:1% → 10% → 25% → 50% → 75% → 100%──每一步基于 5 个指标 设置门:

1. **Latency percentiles** P50、P95、P99。 违规:canary's P99 > baseline's 1.5x。
2. **Cost per request** 混合 $──违规:高于基线 >20%──
3. **Error / refusal rate** 5xx 加明显拒绝──违规:基线的2x──
4. **Output length distribution** ortalama + P99。违规: dağıtım değişimi。
5. **User-feedback rate** parmaklarını aşağı / biletler için kayıtlar。 违规:baseline 的 1.5x。

### Devrimsizlik yeni bir değişimdir .

Aynı giriş tamamen aynı çıkış üretmez.

- GPU FP ilişkili olmaması (Floating-point reduction order 会随批 变化)
- Satır boyutları değişimi ((( Aynı sorgu, 128'li satır ile 16'li satır arasında farklıdır)
- Örnekleme ((temperatür > 0)。

实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实测: 实: 实:

### Masrafı değişim

Bir iyi %20 model Her seferinde kullanmak 3 kat pahalı olabilir.

### Rollback bir silah .

- Politika bayrağı(kaynak bayrağı sistemi):在配置中切换百分比;耗时数秒──
- Model sıkıştırma (registry digest):pinned model 不会自动升级──
- Rollback = geri dönme bayrağı + önceki için sabitlenmiş dijesini ayarlayın.

Eğer bu yükünüzün yeniden dağıtılması gerekiyorsa, bunu başlatmadan önce düzeltin.

### Araçlama

**Argo Rollouts**- Ne ?**Flagger** Kubernetes ilerici teslimat kontrolörleri──与 Istio/Linkerd ağırlıklı yönlendirme 集成──

**Istio weighted routing**Servis ağı 级流量拆分──

**KServe / Seldon Core** 内置 kanary さんの モデルサービス。

**Feature flags** BaşlatmaKaranlık  Bayrakcı  Çıkarma  Politik düzeyde dönüşüm, yeniden dağıtım gerekmiyor 

### Metrikler kadansı

Kanar Geçidi, her 5-15 dakikada bir kez kontrol edilir. Trafik hacminin %1'ine ve 10 rek/minte, her pencerede 50-150 veri noktası vardır.

### A/B 步骤是可选的

Yeni model 明显不同( farklı davranış, farklı maliyet eğri, farklı ton), kanary 通過後以50% A/B test yapın.

### Hatırlamalı olduğun bir sayı var.

- Kanarya ilerleme: %1 → 10% → 25% → 50% → 75% → 100%。
- Determinizm sınırlaması: Aynı giriş üzerindeki uçuş değişimi en yüksek %15'e kadar
- 五个加拿大指标:latency、cost、error/refusal、output length、user feedback──
- Üretim: %20'lik bir bozukluk için.
- Rollback: birkaç saniye, birkaç saat değil.


```figure
i4-canary-ramp
```

## Kullan

`code/main.py`模拟带有注入回归的加纳里推移―― rapor 推移 在哪个阶段 停止,以及哪个门被触发──

## - Söyle.

本课生成 `outputs/skill-rollout-runbook.md`△ belirlenen aday modeli、baseline 和 risk tolerans, tasarım gölge→kanary→100% plan。

## 练习

1. 运行  İşlem`code/main.py`❖ %25 maliyet geri dönüşü için %25 yatırım yapın.
2. Yeni modeliniz çevrimdışı ortamda %3 doğruluk artışı elde etti, ancak maliyet/ talep %18'dir.
3.  Design a end to end consumption time of less than 60 seconds rollback── listing required infrastructure──
4. Değerlendirme eksikliği, %7'yi gösterir. Kanarya kapılarını ayarlayın, yanlış alarmlardan kaçının. Hangi çarpıcıları kullanıyorsunuz?
5. Gölge modunda,  canary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Shadow mode | “duplicate to new” | 用于 logging 的零影响 send-to-candidate |
| Canary | “progressive traffic” | 带 gates、暴露给用户的渐进式 rollout |
| Gates | “rollout checks” | 阻止 progression 的 metric thresholds |
| Non-determinism | “LLM variance” | 不可消除的 run-to-run differences |
| Policy flag | “flag flip rollback” | Config-level rollback，数秒而不是数小时 |
| Model pin | “registry digest” | 指向 model version 的不可变 reference |
| Argo Rollouts | “K8s progressive” | Kubernetes-native canary/rollback controller |
| KServe | “inference K8s” | 带 canary primitives 的 model serving |
| Istio weighted | “mesh split” | Service-mesh traffic splitter |

## 延伸阅读

- [TianPan — Releasing AI Features Without Breaking Production](https://tianpan.co/blog/2026-04-09-llm-gradual-rollout-shadow-canary-ab-testing)
- [MarkTechPost — Safely Deploying ML Models](https://www.marktechpost.com/2026/03/21/safely-deploying-ml-models-to-production-four-controlled-strategies-a-b-canary-interleaved-shadow-testing/)
- [APXML — Advanced LLM Deployment Patterns](https://apxml.com/courses/mlops-for-large-models-llmops/chapter-4-llm-deployment-serving-optimization/advanced-llm-deployment-patterns)
- [Argo Rollouts docs](https://argo-rollouts.readthedocs.io/)
- [Flagger docs](https://docs.flagger.app/)
