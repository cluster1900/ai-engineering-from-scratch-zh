# Modelleme yönlendirme  maliyetleri azaltma için temel araç olarak

> Bir dinamik broker her talebi değerlendirecek, görev tipi, token uzunluğu, embed etme benzerliği, güven), basit sorguyu gönderir, ucuz modellere gönderir, karmaşık sorguyu sınır modeline yükseltir, model kaskadörlüğü de denir. Üretim vaka çalışmaları gösterir ki, ABD/AB/AB'de, kalite aşağı maliyetinde %20-60 oranında düşebilir; yüksek akımlı SaaS'de %30 oranında yönlendirme verimliliği iyileşebilir.$20/M 降到约 $%40/M── %40'ın büyük kısmı daha iyi servis pillerinden geliyor(Fase 17 · 04-09), donanımlı değil── Routing ise ürün gerilemeyi neden etmemekte, bu fiyatı marjine dönüştürmek için bir yöntemdir── başarısızlık modusu ucuz model sürüşüdür: rota %40'ı daha zayıf modellere, mantıklama görevlerine, yüksek kaliteli aşağıya %3-5, bir dönem içinde dikkat çekmek için kullanmak için online kalite ölçümlerini kullanın ırmaklar için ırmaklar kurmak yerine sadece çevrimdışı değerlendirme ayarlarına güvenmek için kullanın──

**Type:** Learn
**Languages:** Python (stdlib, toy cascading router simulator)
**前置要求：**17 · 01 aşaması (Yönetilen LLM Platformları), 17 · 19 aşaması (AI kapıları)
**Time:** ~60 分钟

## Öğrenme hedefi

- 解释模型 cascading:cheap-first with confidence check, low confidence 时 escalate──
- 枚举四个路由信号(task sınıflandırması、hızlı uzunluk、ağır setlere benzerlik yerleştirmek、birinci geçişin kendine güven)
- Görevi yönlendirme bölümü ve kalite kaybı toleransı aşağı hesaplama beklenen karışık maliyetlerle
- Bahalı modellerin sürükleme izleme metriklerini yakalamak için online kalitede kapı)

## 问题

Sualleri: GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPT-5 Üstü GPTü GPT-5 Üstü GPTü GPT-5 Üstü GPTü GPT-5 Üstü GPTü GPT-5 Üstü GPTü GPT-5 Üstü GPTü GPTü GPT-5 Üstü GPTü GPTü GPT-5 Üstü GPTü GPTü GPTü GPTü GPT-5 Üstü GPTü GPTü GPTü GPTü GPTü GPTü GPTü GPTü GPTü GPTü GPTü GPTü GPTü GPTü GPTü GPTü GPTü GPTü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Gütü Güt

Eğer %70'i ucuz modellere, %30'u pahalı modellere koyarsanız, aynı ürün kalitesi altında, hesabınız %65 oranında düşer.

## 概念

### Dört yönlendirme sinyali

1. **Task classification**:simple/complex/codegen/math/chat──可以是基于规则的分类器、小型 LLM(Haiku-class,$0.25/M),或到标签的桶的嵌入式相似之──输出:route = cheap / balanced / border──

2. **Prompt length**:prompts >4K Token genellikle sınır gerektirir tutarlılığı korumak için.

3. **Embedding similarity to known-hard set**Eğer sorgu  yakın bir bilinen sert kova ((kosine > 0.88), doğrudan sınırına tırmanmak

4. **Self-confidence from first-pass**Eğer model log-probları düşük güven gösterirse, ya da reddederse, ya da bir hedging dili çıkarırsa, sınır üzerinde tekrar denemek için %10 trafik üzerinde P95 gecikme artışını gösterecektir, ancak %90 üzerinde %50+ tasarruf olacaktır.

### Üç çeşit modü

**Pre-route**(前置分類器): 5-10 ms gecikme artışı;整体最快──

**Cascade**(inciden ucuz, düşük güven 时 tırmanıyor): ortalama gecikme 约1.2x( ucuz çalıştırmak加验证), tırmanıyor 时约2x。 kalite tabanı 最好。

**Ensemble route**(Böyüm ve sınır için ücretli bir çalışma yapın: kaliteli en yüksek, maliyeti en yüksek; sadece anahtar A/B için kullanılır。

###  gerçekleştirmek

AI geçitleri(17 · 19) açıklama yönlendirme.`router`Yapılandırma.Portkey, koruyucu var + yönlendirme. Kong AI Gateway, eklenti tabanlı yönlendirme. OpenRouter'ın model pazarı.

Açık kaynaklı:RouteLLM (LMSYS)、Diamanti değil (ticari)、Prompt Mule。

### 2026 价格曲线

| Model class | 2022 年末 | 2026 | 变化 |
|-------------|-----------|------|--------|
| GPT-4-level quality | ~$20/M | ~$0.40/M | 便宜 50x |
| Frontier (GPT-5, Claude 4) | — | ~$3-10/M | 新 tier |

Büyük bir kısmı hizmet verimliliğinden kaynaklanan iyileşme, yani 17 · 04-09 döneminde temel kursların sağlayıcı tarafına dönüştürülmesinin maliyetleri azalmıştır. Routing tüm kullanıcıların ucuz seviyeye taşınmasını beklemek yerine uygulama katmanında bu avantajları yakalamanıza izin verir.

### Drift 才是真正风险

Router'ın farkına varmadı, çünkü sınıflandırması Q1 verilerine dayanıyor. Kalite  düştü. Hiç kimse yeterince güçlü bir şikayet göndermedi.

Yol açılış kapısı için online kalite ölçümleri kullan:

- 每条 route 的 kullanıcılar parmak parmakları yukarı / parmakları aşağı
- Her yol üstü, %5'lik bir örnekle otomatik bir LLM yargıç yaptırmak.
- Aşama oranı: Eğer kaskadın yukarı yönü %30'u aşarsa, ucuz model aşırı yönlendirilmiş demektir.
- Her yolun reddedilme oranı:

### Hatırlamalı olduğun bir sayı var.

- 2026 yıl iso-kalite aşağı yönlendirme tasarruf: vaka çalışmaları %20-60
- LLM fiyatlarının düşüşü 2022-2026: toplam yılda yaklaşık 10 katı
- GPT-4 seviyesinde 2022 vs. 2026:~$20/M → ~$0.40/M:
- Kaskadalı gecikme etkisi: ortalama ≈1,2x, artış ≈2x ≈10% trafiği)


```figure
model-cascade-router
```

## Kullan

`code/main.py`Üretim, iş, iş ve eğitim gibi farklı alanlarda çalışmak.

## - Söyle.

本课会产 出 `outputs/skill-router-plan.md`❖ İş yükü ve kalite bütçesi belirlenmesi, yönlendirme biçimi ve sinyalleri seçilmesi

## 练习

1. 运行  İşlem`code/main.py`Aşağıdaki zeminde, kaskadaki yolculuktan önce ne olacak?
2. Sizin kullanıcı tabanınız %30 işletme  Complex queries  70% free tier  Simple  Design routing split  What's online metric  as gate?
3. 某路线 让质下降2%,但省40%──是否应运?
4. OpenAI / Anthropic API'lerin logproblarını kullanın Güven kontrolünü gerçekleştirmek.
5. 6 ay içinde, artış oranı %8'den %22'e yükseldi.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Model routing | "cost broker" | 每个 request 动态选择 model |
| Model cascade | "cheap-first escalate" | 先运行 cheap，low confidence 时 fall through 到 frontier |
| Pre-route | "classify first" | 前置 classifier；不重新运行 |
| Ensemble route | "parallel pick" | 运行多个，由 reward-model 选最佳 |
| Escalation rate | "uprouted %" | cascade requests 中被 escalated 的比例 |
| RouteLLM | "LMSYS router" | OSS router library |
| Not Diamond | "commercial router" | SaaS model-routing product |
| Drift | "cheap creep" | distribution shift 发生但 router 没注意到 |
| Online quality gate | "live check" | 对 live traffic 采样做 automated LLM-judge |

## 延伸阅读

- [AbhyashSuchi — Model Routing LLM 2026 最佳实践](https://abhyashsuchi.in/model-routing-llm-2026-best-practices/)
- [Lukas Brunner — Rise of Inference Optimization 2026](https://dev.to/lukas_brunner/the-rise-of-inference-optimization-the-real-llm-infra-trend-shaping-2026-4e4o)
- [RouteLLM paper / code](https://github.com/lm-sys/RouteLLM)
- [Not Diamond — model routing](https://www.notdiamond.ai/)
- [OpenRouter](https://openrouter.ai/) 带 yönlendirme ilkelerin çoklu model geçidi。
