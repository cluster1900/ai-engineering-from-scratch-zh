# Satış API'leri % 50 indirim sektör standartı haline geldi

> Her ana sağlayıcı %50 indirim ve yaklaşık 24 saatlik dönüşümle eşzamanlı bir seri API sunuyor. OpenAI, Anthropic, Google ve çoğu sonuçlama platformu aynı modeli gerçekleştirdi.

**Type:** Learn
**Languages:** Python (stdlib, toy batch-vs-sync cost simulator)
**前置要求：**17 · 14 aşama (Hatırlatıcı ve semantik önbelleğe kaydedilme)
**Time:** ~45 minutes

## Öğrenme hedefi
- Üç sunucu seri API'si (OpenAI,Anthropic,Google) ve ortak %50 indirim + 24 saatlik dönüş güvencesi.
- 計算 Overnight Classification workload 中叠加 batch + cache-input 費用,并与同步-unchashed基线对比──
- Bir iş yükünü etkileşimli / yarı etkileşimli / partiye bölmek, ve bu yolun nedenlerini açıklamak.
- İki tuzağa düştüğümüzde, kullanıcıların beklediği kısmi etkileşim ve çıkış şeması sürüşü,

## 问题
Senin takım bir gece rapor üretimi borusu yayınladı. 50.000 belgesi, bire bire özetle, grup özetleri, yeniden başlatma yönetim kurulu kısacık.

Satış size %50 indirim verebilir. Sistem promptında bulunuyorsunuz. Tüm 50 bin aramaları paylaşım yapılıyor.

Bu nedenle, bir takımın gerçek zamanlı olduğunu düşünmesi, ancak SLA'nın aslında sabahın ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı 

## 概念
### Üç seri API

**OpenAI Batch API**Üretimlerde genellikle yaklaşık 2-8 saat) ⋅ giriş ve çıkış tokenleri 均有50% 折扣──`/v1/batches`Son nokta: Cache koşullarına uygun girişler; ayrıca bu temel üzerinde önbelleğe girilen giriş fiyatlandırması sağlanabilir.

**Anthropic Message Batches**JSONL yükleme:  24 saat geri dönüş:  50% indirim: 支持`cache_control`Önbelleği yazıyor, açıkça, bir seri içinde otomatik olarak gerçekleşir.

**Google Vertex AI Batch Prediction**BigQuery veya GCS girişleri. Gemini'nin %50 indirimleri var.

### Semantik: Asynchronous, değil yavaş

Satış 24 saat içinde geri dönmeye söz veriyor. Bu 24 saatte geri dönmeye söz veriyor. Tipik olarak P50 2-6 saatte servis yapıyor.

### Kayıtlama 叠加

50k belge özetleme, aynı 4K-token sistemini kullanmak için:

- Sinkron kaydedilmemiş:50000 × ($input × 4000 + $Çıktı × 200), tam oranlara göre
- Sinkron önbelleğe alınmış: sistem promptı 在首次写后被缓存;残余49999次获得便宜 10x 的输入──
- Parça önbelleğe:以上全部,再加上读和写 两者的50%折扣──

叠加效果:batch + cache = 约为同步未缓存账单的10%──任何一夜运行且拥有共享系统提示的工作负载都应使用它──

### İş yükü sınıflandırması

**Interactive** User wait for response──TTFT  çok önemli──使用带 prompt caching ⋅ synchronous call──不能 batch──

**Semi-interactive** Kullanıcı gönderme görevi, birkaç dakika sonra geri dönüp bakmak.

**Batch** User expect results by morning or next hour──Content pipelines、大规模分類、オフライン分析──始终批,始终叠加缓存──

常见错误: çünkü boru hattı üretimdir, her şeyi etkileşimli olarak sınıflandırıyoruz.

### kısmi etkileşim 陷

Bazı işlevler etkileşimli görünüyor, ancak 5-10 dakika kadar tolerant olabilir. Örneğin: 带有 refresh 按 的夜间客户健康报告──用户点击刷新;等待10分钟是可接受的──团队却把它做成同步──50个并发刷新的成本,是批量发送通过电子邮件的10x──

Soru sormak gereken soru şu: 24 saat bu kullanıcı için ne anlama gelir?

### Çıkış şeması

Satış dosya biçimleri 因 dosya sağlayıcısı 而异:

- Her seferinde bir istekle.
- Antropik:JSONL,每行一个消息;响应格式 内嵌。
- Vertex:BigQuery tablo veya TFRecord'un GCS önlüğü

跨 provider 编写 one batch client meaning each provider they need adapter code──宣传多供应商批发的门口──Portkey、LiteLLM'in belirli seviyeleri) hala sadece çiğ biçim için ince bir sarma yapmaktadır──

### Hatırlamalı olduğun bir sayı var.

- 跨 provider's batch discount: input + output 统一 50%。
- Dönüşüm SLA:保证 24 小时,典型 P50 为 2-6 小时──
- 叠加 batch + cached input: yaklaşık % 10 ⇒ sync cached cost
- İş yükü sınıflandırma 规则: eğer 24 saat gecikme kabul edilebilirse,始终批──


```figure
batch-lane-triage
```

## Kullan
`code/main.py`50k belge iş yükü için hesaplama senkronize, senkronize, kasayı, parti, parti, kasayı tasarruf için %

## - Söyle.
本课会产 出 `outputs/skill-batch-triager.md`❖ İş yükü özelliklerini belirle, interaktif/yarı/batch'a akış, tasarruf tahminleri

## 练习
1. 运行  İşlem`code/main.py`△ 100k-doc boru hattı için, 3K-token sistemini kullanıp ve 500-token çıkışını hesaplayın, tam yığınını hesaplayın(batch + cache) senkronize tabanına göre tasarruflar。
2. 選一你熟悉的真实产品中的三个特点──将每个特点分流到互动/半/batch──
3. Kullanıcılar raporlarını 3 saat geçirmiş. Bu bir seri yanlış bir seçim mi, yasal olarak etkileşimli mi?
4. Senin parti API geri SLA 24h, ama P99 20 saat.
5. 计算破平:shared-prefix length 达到多少时,batch + cache 会会比你自己的预备 GPU 上一夜运行更便宜?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Batch API | “async discount” | 50% off，24h turnaround |
| JSONL | “batch format” | 每行一个 JSON request；OpenAI/Anthropic standard |
| Message Batches | “Anthropic batch” | Anthropic 的 batch API product name |
| Batch prediction | “Vertex batch” | Vertex AI 的 batch API product |
| Turnaround SLA | “24h promise” | 保证，不是典型值；典型是 2-6h |
| Workload triage | “interactivity decision” | Interactive / semi / batch routing decision |
| Output schema | “response format” | 每个 provider 的 JSONL layout；不可移植 |
| Stacked discount | “batch + cache” | 两者都适用时，约为 uncached sync bill 的 10% |

## 延伸阅读
- [OpenAI Batch API](https://platform.openai.com/docs/guides/batch) JSONL biçimi 和 `/v1/batches`Semantik.
- [Anthropic Message Batches](https://docs.anthropic.com/en/docs/build-with-claude/batch-processing) parti biçimi 和 `cache_control`etkileşim.
- [Vertex AI Batch Prediction](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/batch-prediction) Gemini parti 语义。
- [Finout — OpenAI vs Anthropic API Pricing 2026](https://www.finout.io/blog/openai-vs-anthropic-api-pricing-comparison)
- [Zen Van Riel — LLM API Cost Comparison 2026](https://zenvanriel.com/ai-engineer-blog/llm-api-cost-comparison-2026/)
