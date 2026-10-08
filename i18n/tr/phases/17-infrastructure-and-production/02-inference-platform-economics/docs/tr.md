# 推理平台经济学  Atölyeler Birlikte Baseten ‒Modal ‒Replik ‒Anyscale

> 2026 yılı sonucu Piyasa artık sadece GPU                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    $1/hr，而 $4B  估值和每日 10T+ tokens 的处理量说明了量驱动的模型是可行的──Basen 于 2026 年 1 月 以$5B 估值完成了 $300M Serisi E。 竞争定位规则很简单:Fireworks 优化延迟,Together 优化目录宽度,Baseten 优化企业抛光,Modal 优化Python-native DX,Replicate 优化多模范围,Anyscale 优化分布式Python。本课会给你一个可以直接交给创始人的矩阵──

**Type:** Learn
**Languages:** Python (stdlib, toy per-call economics comparator)
**前置要求:**17 · 01 aşaması (Yönetilen LLM Platformları), 17 · 04 aşaması (vLLM Serving Internals)
**Time:** ~60 minutes

## Öğrenme hedefi
- Üç pazar segmentini anlatmak için, her satıcıyı bir segmentle birleştirmek için özel silikon, GPU platformları, API-birincisi,
- 解释为什么"per-token" API fiyatlandırma modeli 收, değil 收, servisi motor maliyet eğri 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收, 收
- 計算至少三供應商的每次请求有效成本,并解释什么时候/minute (Basen、Modal)
- 识别给定工作负载的正确默认平台(serverless bursty、stable high-throughput、fine-tuned variants、Multimodal)

## 问题
Yönetimsel hiper ölçekleme planını değerlendirdi. Daha kısa bir sunucuya ihtiyacınız olduğunu belirlediniz.$/M tokens；Baseten 显示 $/minute;Modal 显示 $/second；Replicate 显示 $Eğer iş yüküne karşı gelmezsen, onlarla baş başa karşılaşabilirsin.

Daha da kötüsü, her fiyatlandırma sayfası 背后的商业模式都不同──Fireworks在共享 GPU 上运行自己的定制引擎(FireAttention);token 率 反映它们的利用曲线──Baseten 给你Truss + dedicated GPUs;每分 反映了独占性──Modal is a true Python serverless:per-second billing,并且冷开始可低于一秒──相同输出(一个LLM响应),三种不同的成本功能──

Bu ders bu altı platformu oluşturur ve size ne zaman kazanırız, anlatır.

## 概念
### Üç bölüm

**Custom silicon** Groq(LPU)、Cerebras(WSE)、SambaNova(RDU)。 Aynı modelde, dekode genellikle GPU tabanlı bir küme 快 5-10x。per-token 价格更高(2025 yıl sonu Groq 在 Llama-70B 上约为 ~$0.99/M), ancak gecikme hassası kullanım durumları için 无可匹敌──Groq ise sesli ajanlar ve gerçek zamanlı çeviri üretim ortamını seçmektedir。

**GPU platforms**Baseten、Together、Fireworks、Modal、Anyscale。NVIDIA'da çalışır 2026 yıl H100、H200、B200) veya AMD'de çalışır  Bunlar "Hem GPU kiralama" (RunPod、Lambda) ve "hyperscaler yönetilen hizmet" (Bedrock) arasındaki ekonomik seviyeye yer alır.

**API-first marketplaces** Replicate、DeepInfra、OpenRouter、Fal。Broad katalog,pay-per-prediction veya pay-per-second, emphasis time-to-first-call。

### Ateşler  Gecikme Optimized GPU Platform

- FireAttention motor ((kustom); market propaganda için on on equal effectiveness configuration üzerinde latency vLLM 低 4x ⋅
- Batch seviyesi %50'lik serversiz oranı, etkileşimli olmayan iş yükleri için kullanılır.
- Basis modeline benzer bir oranla hizmet sunma, LoRA'yı ödemek için ücret alacak olanlara karşı gerçek bir fark.
- 2026 yıl ortalarında: talep üzerine GPU kiralama 2026 yıl 5 月 1 日'den itibaren 1 saatlik bir dolarlık bir artışla.
- 财务信号: $4B 估值, günde 10T+ token işleme

### Birlikte  Genişlik Optimize

- 200'den fazla model, açık kaynaklı yayınlar da dahil olmak üzere                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
- Ünlü bir şekilde, bu uygulamaların en önemli özellikleri ise, yeni bir uygulama geliştirmek ve geliştirmek için kullanılan teknolojilerdir.
- İndirim + ince ayarlama + eğitim bir API'de yer almaktadır.

### Baseten  işletme-polonyalı-optimize

- Truss Framework: Dependences,Secrets,Serving Config,Manifest'te yerleştirilir ve model paketleme yapılmaktadır.
- GPU  aralığı T4 ile B200 〜 dakikaya faturasyon,                                                                                                                                                                                                                                                      
- SOC 2 Tip II,HIPAA-yararlı──常见于金融科技 和保健 选择──
- $5B 估值，2026 年 1 月 Series E（来自 CapitalG、IVP、NVIDIA 的 $300M) 

### Modal  Python- native- optimized

- 純 Python'ın altyapısı-kod olarak.`@modal.function(gpu="A100")`Bir işlevyi süslemek ve bir komut kullanmak.
- İkinci başına faturasyon──预热时冷开始 为 2-4s;小模型低于 1s──
- $87M Series B，估值 $1.1B(2025)──Independent Survey中開発者経験得分最高──

### Replik  multimodal genişlik

- Ödeme tahminleri, görüntü, video ve ses modelleri
- Entegre ekosistem ((Zapier、Vercel、CMS eklentileri)
- LLM'de para oranları düşük, ancak çok modal çeşitlilikte kazanılır.

### Herhangi bir ölçek                                                                                                                                                                                                                                                             

- Ray 上;RayTurbo Anyscale'ın özel sonuçlama motoru (Ray 上;RayTurbo)
- En uygun dağıtılmış Python iş yükleri, sonuç adımları en büyük grafik içindeki bir düğümdür.
- Ray AIR ile Ray Serve derinlikleri birleştirilmiştir.

### Per-token vs per-minute:分别在什么时候胜出

İş yükü gecikme karşı duyarlı değilken ve patlak verirken, her token mantıklıdır, çünkü sadece gerçek kullanım ödemesi için kullanılır. Kullanım yüksekken ve tahmin edilebilir olduğunda, her dakika mantıklıdır, çünkü bir kez GPU'yu 和 yaparsanız, her token'u kazanacaksınız.

Kırk kural: İş yükü yüksek olduğunda özel GPU ≈30%'un sürekli kullanımı oranı, dakikada (BaseTEN ≈ Modal) başlamak için her token için kazanmak için başlayın (Fireworks ≈ Together) ∼ düşük olduğunda, token ≈ kazanmak için, çünkü boşluktan kaçınmak için ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ 

### Özel motor gerçek çukur.

VLLM ve SGLang'daki her platformda özel bir motor varmış gibi iddia edilir. FireAttention、RayTurbo、Baseten'in sonuç kümesi。 Custom-engine 声称带有营销色;更诚实的表述是, vLLM + SGLang  yaklaşık % 80'i üretim seviyesindeki açık kaynaklı sonuçları temsil ederken platform katmanının farkı DX、attribution 和 SLAs。

### Hatırlamalısın numaralar

- Ateşler GPU kiralama: 2026 yıl 5 月 1 日 başlayan 1 saatlik bir dolarlık yükseltme
- Ateşbombarı iddiası: Eşitlik ayarlamalarda gecikme oranı vLLM'den 4x düşük.
- Birlikte: LLM'lerde ¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥
- Baseten değerlendirme:$5B（Series E，2026 年 1 月，$300M yuvarlak)
- Modal değerlendirme: $1.1B ((B Serisi,2025)。
- Dakikada % 30'dan fazla  sürekli kullanım oranı % 30'dan fazla.


```figure
cost-per-token
```

## Kullan
`code/main.py`Bir sentetik iş yükü üzerinde fiyatlandırma modelleri karşılaştırın altı satıcı rapor$/day 和 effective $/M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M tokenleri. /M /M tokenleri. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /M. /

## - Söyle.
本课会生成 `outputs/skill-inference-platform-picker.md`❖ İş yükü profilini belirle SLA 和 bütçe, öncelikli sonuçlama platformu seçin, ikinci sırayı belirle

## 练习
1. 运行  İşlem`code/main.py`△ H100'in üstündeki 70B modeli için, ne devamlı kullanımı oranında Baseten (per dakika) Ateş Çanakları (per token) üzerinde başarılı olacak?
2. Yönetim kurulu, yayıncılık ve iletişim kuruluşu, yayıncılık ve iletişim kuruluğu, yayıncılık ve iletişim kuruluğu, yayıncılık ve iletişim kuruluşu, yayıncılık ve iletişim kuruluşu, yayıncılık ve iletişim kuruluşu, yayıncılık ve iletişim kuruluşu, yayıncılık ve iletişim kuruluşu, yayıncılık ve iletişim kuruluşu, yayıncılık ve iletişim kuruluşu, yayıncılık ve iletişim kuruluşu, yayıncılık, yayıncılık ve iletişim kuruluşu, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, yayıncılık, internet, internet, internet, internet, e-ı, e-e, e-e, e-e, e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-
3. Ateşbomberi, ana modelinizin fiyatını 1 saatlik bir arttıracak. Eğer %40'ın trafiği seri seviyesine geçirse, %50 indirimle, yapı modülü karışık maliyet etkisini gösterecektir.
4. Bir denetim altında olan müşteri SOC 2 Tipi II + HIPAA + özel GPU'ları gerektiriyor.
5. Bireyler sunucu olmadan,Temem bir arada talep üzerine,Baseten özel ve Replik API Llama 3.1 70B her 1000 tahminin maliyeti.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Custom silicon | "non-GPU chips" | Groq LPU、Cerebras WSE、SambaNova RDU — 针对 decode 优化 |
| FireAttention | "Fireworks engine" | Custom attention kernel；市场宣传为 latency 比 vLLM 低 4x |
| Truss | "Baseten's format" | Model packaging manifest；dependencies + secrets + serving config |
| Per-token | "API pricing" | 按消耗的 tokens 收费；无需为空闲付费 |
| Per-minute | "dedicated pricing" | 按 wall-clock GPU time 收费；在高 utilization 时胜出 |
| Per-prediction | "Replicate pricing" | 按 model invocation 收费；常见于 image/video |
| RayTurbo | "Anyscale engine" | Ray 上的 proprietary inference；在 Ray clusters 上与 vLLM 竞争 |
| Batch tier | "50% off" | 降价的 non-interactive queue；常见于 Fireworks、OpenAI |
| Fine-tuned at base rate | "Fireworks LoRA" | 以 base model 的 rate 对 LoRA-served requests 收费（差异点） |

## 延伸阅读
- [Fireworks Pricing](https://fireworks.ai/pricing)Token fiyatları, parti seviyesi, GPU kiralama.
- [Baseten Pricing](https://www.baseten.co/pricing/) dakikası oranlar, görevli kapasiteler, işletme seviyeleri,
- [Modal Pricing](https://modal.com/pricing) saniyelik GPU hızları 和 serbest seviyesi
- [Together AI Pricing](https://www.together.ai/pricing) model katalogı 和 token oranları。
- [Anyscale Pricing](https://www.anyscale.com/pricing)RayTurbo ve Ray fiyatlandırmasını yönetti.
- [Northflank — Fireworks AI Alternatives](https://northflank.com/blog/7-best-fireworks-ai-alternatives-for-inference) karşılaştırmalı değerlendirme¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- [Infrabase — AI Inference API Providers 2026](https://infrabase.ai/blog/ai-inference-api-providers-compared)Satıcı manzarası
