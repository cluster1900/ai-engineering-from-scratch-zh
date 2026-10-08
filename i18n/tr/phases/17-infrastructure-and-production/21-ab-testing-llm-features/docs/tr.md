# A/B Testing LLM 功能  GrowthBook、Statsig

> 傳統 A/B Testing 沒有不確定的 LLM 构建的──關鍵区别:evals 回答模型能完成這工作嗎?A/B test 回答用户意意吗?兩者都必不可少;基于氛围检查 發布已结束.2026 yılında test edilmesi gereken nedir: hızlı mühendislik 措辞) 模型選購 (GPT-4 vs GPT-3.5 vs OSS; 確率 vs 成本 vs 延迟) ‧生成參數 (temperatür ‧top-p) ‧ Gerçek örnek: bir sohbetçi ödül modeli 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 變体 变体 变体 变体 变体 变体 变体 变体 变体 变体**Statsig**(OpenAI tarafından 25 Eylül 2025'te 1.1 milyar dolarlık bir satın alma yapıldı)**GrowthBook** açık kaynaklı 、depo-devli 、Bayesian + Frequentist + Sequential  ইঞ্জিন、CUPED、SRM 检查、Benjamini-Hochberg + Bonferroni 校正── senin seçeneğin deponu-SQL'e tercih edip etmemesine ve  OpenAI tarafından satın alınmaya  kuruluşun için önemli olup olmamasına bağlıdır。

**Type:** Learn
**Languages:** Python (stdlib, toy sequential test simulator)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 20 (Progressive Deployment)
**Time:** ~60 minutes

## Öğrenme hedefi
- 区分 evals(模型能完成这工作吗) ve A/B testleri(用户在意吗)
- 列举三个可测试轴线(快点、模型、参数),并为每个轴线选择指标──
- 解释 CUPED、sequential testing 和 Benjamini-Hochberg çoklu karşılaştırma düzeltmeleri。
- 倉庫-SQL 姿态&企业收购立立场, statsig veya GrowthBook  arasında seçim yapmak

## 问题
Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarladın mı? Sen bir sistem ayarlamadın mı? Sen bir sistem ayarlamadın mı? Sen bir sistem ayarlamadın mı? Sen bir sistem ayarlamadın mı? Sen bir sistem kontrol ediyorsun?

Evals, modelin bir etiketleme koleksiyonunda görevleri tamamlayabileceğini yanıtlamıyor. Kullanıcının daha fazla çıkış tercih ettiğini yanıtlamıyor. Sadece kontrol edilen çevrimiçi deney bu soruyu cevaplayabilir.

## 概念
### Evals vs A/B testleri

**Evals** 离线、带标签集合、judge(rubrik、LLM-as-judge 或人工)  cevap: Bu sabit dağılımda,输出是否正确/ 有帮助/安全?

**A/B test** 在线、真实用户、随机分配──回答:新变体是否推动了关键用户级指标?

两者都需要──Evals 在曝光前捕捉回归;A/B 在上线后确认产品影响──

### Neyi test edelim

1. **Prompt engineering** 措辞、system-prompt 结构、示例──标志: görev başarısı oranı、 kullanıcı kalması、maliyet/ talep──
2. **Model selection** GPT-4 vs GPT-3.5-Turbo vs Llama-OSS── 标标:精度(任务) + maliyet/ talep + gecikme P99──多目标──
3. **Generation parameters** sıcaklık, üst-p, maksimum_tokenler,                                                                                                                                                                                                                                                        

### KUPED  方差降低

Kontrol edilen deneyler Ön deney verilerini kullanarak.

实现:Statsig 和 GrowthBook hepsi gerçekleştirilmiştir.

### Sıralama testleri

经典 A/B 假设固定样本量──序列测试(peek-and-decide) 在重复查看时控制虚假阳性率──始终有效的序列程序──mSPRT、Howard'ın güven 序列)让你在明确赢家出现时提前停止──

### Çok ağırlıklı

%95'lik güvenle 20 A/B testi çalıştırılırsa, tesadüfen yanlış pozitif bir sonuç elde edilir. Bonferroni düzeltmesi her testin en iyi şekilde kontrol edilecek.

### SRM  örnek oranı eşleşmezliği

Görev hash kullanıcıları değişkenlere dağıtacaktır. Eğer 50/50 切分 gerçekte 47/53 elde ederse, bir yer bozulmuş olduğunu gösterir.

### Statsig vs. GrowthBook

**Statsig**- ...
- OpenAI tarafından 1.1 milyar dolarlık bir satın alma...
- Sequence testleri,CUPED,değersiz popülasyonlar,
- Entegre: özellik bayrakları + deney + gözlemlenme.
- En uygun olan: Ekipa zaten ürün paketlemek istiyor ve OpenAI sahipliği için istekli değil.

**GrowthBook**- ...
- Açık kaynaklı (MIT); depok-devde(direkt olarak Snowflake/BigQuery/Redshift 读取)
- Çok çeşit motor: Bayesian, Frequentist, Sequential.
- CUPED、SRM、Bonferroni、BH düzeltmeleri。
- Kendi kendine barındırma veya yönetilen bulut.
- En uygun olan: deposu-SQL 团队,数据团队控制指标层,希望使用OSS──

### Bilgi etkisinin karmaşıklaşmasına neden olan belirsizlikler

Aynı anda farklı çıkışlar oluşacak. 传统功率计算 假设 IID观测.

### Gerçek dava sonuçları

- Chatbot ödül modeli 变体: +70% 对话长度 +30% 留存──
- Sonraki konu: Ödül fonksiyonu 优化后 +1% CTR。
- Khan Academy Khanmigo: Çatışmanın ve matematik doğruluğunun etrafında tartışma devam ediyor.

### Antroduce: İzle

Her mühendis, A/B olmadığı bir durumda yayınlanan bir işlev ortaya çıkarabilir. Onlardan çoğu, bir kaç ay boyunca fark etmeden bir ürün göstergesi ortaya çıktı.

### Hatırlamalı olduğun bir sayı var.

- Statsig 被 OpenAI 收购: $1.1B,2025年 9 月。
- GrowthBook:open-source MIT;Bayesian + Frequentist + Sequential。
- KUPED 方差降低30-70%
- LLM belirsiz → +30-50% 样本量缓冲──


```figure
mx-sequential-test
```

## Kullan
`code/main.py`模拟一个带有固定边界和序列界的序列 A/B test──展示序列 如何让你提前停止──

## - Söyle.
本课生成 `outputs/skill-ab-plan.md`◊ belirlenmiş özellik değişikliği, iş yükü, temel çizgi, seçim platform, kapılar, örnek boyutu

## 练习
1. 运行  İşlem`code/main.py`◊ Başındaki %3 dönüşüm için %5 yükseltme beklenmesi %80 güç elde etmek için  Ne kadar örnek miktarı gerekir?
2. Sağlık hizmetleri için                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
3. Bir A/B tasarlayın, test GPT-4 vs GPT-3.5 Üst performansın çözülmüş bilet fiyatı için.
4. Kanary'nin ızdıracağı, ancak A/B'nin %1.2 dönüşümünü gösterdi.
5. CUPED'i bir ön dönem dönem oranı %60'lık bir sonraki dönem oranı için kullanmak için kullanmak için kullanılır.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Eval | “offline test” | 对模型能力的带标签集合评估 |
| A/B test | “experiment” | 面向用户的在线随机比较 |
| CUPED | “variance reduction” | 用前期回归来降低方差 |
| Sequential test | “peek-ok test” | 允许提前停止的 always-valid procedure |
| Multiple comparison | “the family error” | 运行许多测试会放大 false positives |
| Bonferroni | “tight correction” | 将 α 除以测试数量 |
| Benjamini-Hochberg | “BH FDR” | false-discovery-rate 控制，较不保守 |
| SRM | “bad split” | Sample ratio mismatch；分配 bug |
| Statsig | “OpenAI owned” | 商业一体化平台，2025 年被收购 |
| GrowthBook | “the OSS one” | MIT warehouse-native 平台 |
| mSPRT | “sequential probability ratio test” | 经典 sequential procedure |

## 延伸阅读
- [GrowthBook — How to A/B Test AI](https://blog.growthbook.io/how-to-a-b-test-ai-a-practical-guide/)
- [Statsig — Beyond Prompts: Data-Driven LLM Optimization](https://www.statsig.com/blog/llm-optimization-online-experimentation)
- [Statsig vs GrowthBook comparison](https://www.statsig.com/perspectives/ab-testing-feature-flags-comparison-tools)
- [Deng et al. — CUPED](https://www.exp-platform.com/Documents/2013-02-CUPED-ImprovingSensitivityOfControlledExperiments.pdf)
- [Howard — Confidence Sequences](https://arxiv.org/abs/1810.08240)
