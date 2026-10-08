# AI Gateways  LiteLLM、Portkey、Kong AI Gateway、Bifrost

> Gateway 位于你的应用和模型供应商 之间──核心功能是供应商路由、倒退、退行、速率限制、秘密引用、可观察性、防护──2026 yılının pazar dağılımı:**LiteLLM**MIT OSS, 100'den fazla sağlayıcıyı destekler, OpenAI- uyumlu, ancak yaklaşık 2000 RPS'de 时会崩(8 GB bellek, yayınlanmış bir referans değerinde kaskadör hatalar ortaya çıktı); Python için en uygun 、<500 RPS、dev/prototyping。**Portkey**定位为控制平面(gardrails、PII redaksiyonu、jailbreak tespit、audit trails),2026 yıl 3 月 dönüşüm Apache 2.0 açık kaynak, gecikme overhead 为 20-40 ms, üretim seviyesı 为$49/mo。**Kong AI Gateway** 基于 Kong Gateway 构建 — Kong 在相同 12 CPUs 上的自有 benchmark：比 Portkey 快 228%，比 LiteLLM 快 859%；定价 $100/model/ay(Plus Tier 最多 5 个); Eğer Kong kullanıyorsanız, işletmeye uygundur。**Bifrost**(Maxim AI)  otomatik geri deneyler, yapılandırılabilir geri çekilmeyi destekler, OpenAI 429 时倒向人类─**Cloudflare / Vercel AI Gateways** yönetilen 零-ops、 temel yeniden deneme¬leri. Veri oturumları kendi kendine ev sahipliği yapmayı karar verir; Portkey 和 Kong 处于中间位置,提供 OSS + اختیاری yönetilen 

**Type:** Learn
**Languages:** Python (stdlib, toy gateway-routing simulator)
**前置要求:**17 · 01 aşaması (Yönetilen LLM Platformları), 17 · 16 aşaması (Model Routing)
**Time:** ~60 minutes

## Öğrenme hedefi
- 列举六个核心 gateway 功能 路由,倒退,倒退, geri çekilme, hız sınırları, sırlar, gözlemlenebilirlik, koruma) 
- 4 2026 kapısı olacak. LITELM, Portkey, Kong AI, Bifrost.
- 引用 Kong referansı ((相比Portkey 228%,相比LiteLLM 859%),并解释为什么对 >500 RPS 很重要──
- Verilen veri oturum ve operasyon bütçesi durumunda kendi kendine barındırılmış veya yönetilen seçin.

## 问题
Bu nedenle, bu ürünler için bir diğer ürün de kullanılabilir. Bu ürünler için bir diğer ürün de kullanılabilir.

Bu uygulama katmanında, her hizmetin her sağlayıcıyla 合 olmasına izin verir.Gateway katmanı, bir sürece birleştirir, bir API sağlar, genellikle OpenAI uyumlu), her sağlayıcıya yeniden dağıtır.

## 概念
### Altı temel özellik

1. **Provider routing** OpenAI  Antropik  Gemini  Self-hosted 等等 API 后面に置く
2. **Fallback** 遇到429、5xx 或质量故障 时,在别处重试──
3. **Retries** Eksponansiyel geri dönüş,有界 girişimleri──
4. **Rate limits**Kiracıya göre anahtar model
5. **Secret references** 运行时从库 拉取凭证(绝不放在app中) 
6. **Observability** OTel + GenAI özellikleri(17 aşama · 13) + maliyet atributı。
7. **Guardrails** PII düzenleme, jailbreak tespit, izin verilen konular filtreleri

### LiteLLM  MIT OSS, Python

- 100'den fazla sağlayıcı,OpenAI uyumlu, yönlendiricilerin yapılandırılması, geri dönüşü, temel gözlemlenebilirlik.
- Kong'un referans değerinde 2000 RPS 时崩; 8 GB hafıza ayak izleri, sürekli yük altında kaskadaki başarısızlıklar oluşmaktadır。
- 最适合:Python uygulaması <500 RPS dev/staging gateways  deneysel yönlendirme
- Ücret: OSS $0; bulutsuz bir seviyede var.

### Portkey  kontrol uçağının konumlandırılması

- 截至 2026年 3月为Apache 2.0 OSS──Gardrails、PII redaksiyonu、jailbreak tespit、audit izleri──
- Her istek için 20-40 ms'lik bir gecikme masrafı vardır.
- Üretim seviyesinin fiyatı 49 $ / ay.
- En uygun: Bağlı korumalara ihtiyaç duyulur + gözlemlenebilirlik düzenlenmiş endüstriler.

### Kong AI Gateway  ölçek oyunu

- Kong Gateway'a dayalı 构建(成熟的API gateway 产品,lua+OpenResty)
- Kong kendi kendine 12 CPU eşdeğerinde bir referans var.
- Fiyat: 100 dolar / model / ay, Artı seviye en fazla 5 个.
- En uygun: Kong kullanılıyor;> 1000 RPS;

### Bifrost (Maxim AI)

- Otomatik tekrar denemeler, yapılandırılabilir geri dönüş desteklenir.
- OpenAI 429 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时 时
- Yeni giriş; Ticari.

### Cloudflare AI Gateway / Vercel AI Gateway

- Yönetilen, sıfır operasyonlar, temel yeniden deneme ve gözlemlebilirlik.
- En uygun: Cloudflare/Vercel'de çalıştırılır Edge hizmet veren JavaScript uygulamaları
- Çekil ve hız sınırları 方面不如 Kong/Portkey。

### Kendi kendine barındırılan vs yönetilen

Veriler konaklama ‒ belirleyici faktör. Sağlık ve finans 默认 self-hosted (LiteLLM veya Portkey OSS veya Kong) ‒ tüketici ürünleri 默认 managed (Cloudflare AI Gateway) ‒ middle-tier (Portkey managed) ‒ Hibrid: düzenlenmiş kiracı kullanımı self-hosted,其他使用管理──

### Gecikme bütçesi

- LiteLLM: tipik uç uç uçuş 5-15 ms.
- Portkey: başı 20-40 ms.
- Kong: Başını yukarı çek 3-8 ms.
- Cloudflare/Vercel:overhead 为 1-3 ms

Geçit gecikmesi doğrudan TTFT artırır. TTFT P99 < 100 ms SLA, Kong veya Cloudflare için herhangi bir şey.

### Sınır sınırı semantik meselesi

简单的代币桶 可支到中度规模──多租户 需要滑窗 + blast allowance + per tenant tiering──LiteLLM 内置代币桶;Kong 内置滑窗;Portkey 内置层──

### Geçit + gözlemlenebilirlik + yönlendirme oluştur

17 aşama · 13( gözlemlenebilirlik) + 16 ((modelleşme) + 19 ((kapı) üretim sırasında aynı katmanlara aittir.

### Hatırlamalısın numaralar

- LiteLLM: Yaklaşık 2000 RPS 崩,8 GB bellek
- Portkey: 20-40 ms üst; 2026 yıl 3 月 Apache 2.0
- Kong: Portkey'e göre 快 228%, LiteLLM'e göre 快 859%
- Kong fiyatı: $ 100 / model / ay, Artı seviye en fazla 5 个.
- Cloudflare/Vercel:edge 上 1-3 ms overhead


```figure
mx-gateway-fallback
```

## Kullan
`code/main.py`模拟 3 个提供商 在 429/5xx注下的 gateway routing with fallback──报告延迟、退缩率 和 fallback hit rate──

## - Söyle.
本课产 出 `outputs/skill-gateway-picker.md`❖ belirlenmiş ölçek, pozisyon, uyum, geçicilik bütçesi, bir geçit seçmek.

## 练习
1. 运行  İşlem`code/main.py` Configuration OpenAI→Anthropic→self-hosted 的 fallback──在 5% sağlayıcı hata oranı 下,预期 hit rate 是多少?
2. SLA'nın TTFT P99 < 200 ms, temel 300 ms. Hangi geçitler bütçede hala var?
3. Bir sağlık müşteri  auto hosted + PII redaksiyonu + denetim  seç Portkey OSS ̆̆ da Kong ̆
4. LiteLLM ile Kong: Ekip hangi RPS tavanına taşınmalı?
5. Çoklu kiracı SaaS  tasarım oran- sınırı politikası: ücretsiz katman  deneme katman  ödeme katman  seç token-bucket veya kaydırıcı pencere?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Gateway | “API broker” | 位于 apps 和 providers 之间的 process |
| LiteLLM | “the MIT one” | Python OSS，100+ providers，2K RPS 时崩溃 |
| Portkey | “guardrails gateway” | Control plane + observability，Apache 2.0 |
| Kong AI Gateway | “the scale one” | 基于 Kong Gateway 构建，benchmark leader |
| Bifrost | “Maxim's gateway” | Retries + Anthropic fallback recipe |
| Cloudflare AI Gateway | “edge managed” | Edge-deployed managed gateway，zero-ops |
| PII redaction | “data scrub” | 发送到 model 前进行 Regex + NER mask |
| Jailbreak detection | “prompt injection guard” | 对 user input 的 Classifier |
| Audit trail | “regulated log” | 每次 LLM call 的 immutable record |
| Token-bucket | “simple rate limit” | 基于 refill 的 rate limiter |
| Sliding-window | “precise rate limit” | Time-windowed rate limiter；fairness 更好 |

## 延伸阅读
- [Kong AI Gateway Benchmark](https://konghq.com/blog/engineering/ai-gateway-benchmark-kong-ai-gateway-portkey-litellm)
- [TrueFoundry — AI Gateways 2026 Comparison](https://www.truefoundry.com/blog/a-definitive-guide-to-ai-gateways-in-2026-competitive-landscape-comparison)
- [Techsy — Top LLM Gateway Tools 2026](https://techsy.io/en/blog/best-llm-gateway-tools)
- [LiteLLM GitHub](https://github.com/BerriAI/litellm)
- [Portkey GitHub](https://github.com/Portkey-AI/gateway)
- [Kong AI Gateway docs](https://docs.konghq.com/gateway/latest/ai-gateway/)
