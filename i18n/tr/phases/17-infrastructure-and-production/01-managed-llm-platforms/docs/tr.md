# 托管 LLM 平台  Bedrock, Vertex AI, Azure OpenAI

> Üç farklı strateji, üç farklı strateji. AWS Bedrock model pazarı  Claude, Llama, Titan, Stability, Cohere                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               

**Type:** Learn
**语言：**Python (stdlib, oyuncak maliyeti ve gecikme karşılaştırıcısı)
**前置要求：**11 (LLM Mühendisliği) ve 13 (Açıntılar ve Protokoller) aşama
**Time:** ~60 minutes

## Öğrenme hedefi
- Üç farklı platform stratejisi (Bazı vs. Özel vs. İkiz-İlk) ve her tür stratejiyi bir ürün kullanım örneğine göre uyguladı.
- Açıklayın Azure OpenAI'de sağlanan geçiş üniteleri (PTU'lar) size ne satın aldığını ve neden talep üzerine Bedrock'u 405B  ölçüsünde genellikle okuma sayısı 25 ms kadar sürer.
- 绘制每个平台的 FinOps 归因界面(Bedrock Application Inference Profiles vs Vertex projesi-eki ekip vs Azure kapsamları + PTU rezervasyonları) 👇
- 写下一条iki sağlayıcı minimum  stratejisi,并解释为什么单卖家锁定是2026年代高昂的错误――

## 问题
Siz ürün için Claude 3.7 Sonnet'i seçtiniz. Şimdi hizmet sunmak gerekiyor. Antropic API'yi doğrudan kullanabilirsiniz, AWS Bedrock'u kullanarak da kullanabilirsiniz.

Daha derin bir sorun katalogdır. Eğer aynı üründe Claude、Llama 和 Gemini kullanmak istiyorsanız, aynı zamanda Bedrock加 Vertex加 Azure OpenAI olarak bir yerde olmadıkça, onları tek bir yerden satın alamayacaksınız. Hiperskaler değişken değildir.

Bu ders                                                                                                                                                                                                                                                              

## 概念
### Üç tür kuralı

**AWS Bedrock** pazar yerleri──Claude (Anthropic)、Llama (Meta)、Titan (AWS ilk taraf)、Sitimi (resim)、Cohere (kaynaklar)、Mistral,以及 image 和 embeding 子目录── bir API, bir IAM 界面, bir CloudWatch ihracat──Bedrock'ın bahsi,客户想要可选性,胜过想要单一模型──

**Azure OpenAI** Özel ortaklık──GPT-4 / 4o / 5 / o serisi DALL·E、Whisper, ve OpenAI  modelinin ince ayarlanması için Azure veri merkezlerinde elde edilmiştir.

**Vertex AI** Gemini ilk,其余第二──Gemini 1.5 / 2.0 / 2.5 Flash ve Pro,加上 Model Garden(üçüncü taraf)──Vertex 的押注是多型式 长上下文  1M-token Gemini bağlamı 是差异化因素──

### Sizmi Altındaki Gecikme  fark

Yapay Analiz 运行持续基准──在等效的 Llama 3.1 405B 部署上(shared on demand),Azure OpenAI ortalama ilk token gecikmesi 约为50 ms;Bedrock 约为75 ms── bu fark AWS 失败  它是容量模型差异──Azure 销售 PTUs (Provided Throughput Units),为您的租户 预留 GPU 容量──Bedrock 等价格──Bedrock 提供通过) 也存在,但每单位 起价约$21/小时,大多数共享客户仍然停留在需求上的──

İstek üzerine paylaşılan kapasite 会与其他客户的流量竞争──専用容量 不会── Eğer ürününüzün SLA'sı P99'da TTFT < 100 ms ise, o zaman ya Azure'daki PTU'ları satın almak, ya da Bedrock Provisioned Throughput satın almak, ya da kabul kabul etmek gerekir──

### Sağlanan Üretim 经济性

Azure PTU'ları: bir blok önceden kalmış sonuç hesaplamaları.

Bedrock Provisioned Throughput: Model ve bölgeye göre, প্রতি小时 $21-$Matematik benzer  Break-even 大約在峰值利用的一半──需要月額承诺──

Vertex'in sağlanan kapasite  Gemini SKU  satış; fiyatlandırma                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

### FinOps 界面  Gerçek farklılık faktörü

**Bedrock Application Inference Profiles**Bu, pazarın en temiz yerlerinden biri.`team`- Evet.`product`- Evet.`feature`Mark Profile; let all models be used all through it route; CloudWatch                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

**Vertex**归因是项目-per-team加标签-everywhere──你把每个团队建模为一个GCP项目,在每个资源上打标签,并使用BigQuery Billing Export + DataStudio做rollup──工作更多,但BigQuery 让你对成本数据执行任意SQL──

**Azure**Üyelik/resurs grubu alanlarına bağlı olarak, PTU rezervasyonlarını  bir等コスト对象 olarak                                                                                                                                                                                                                                                  

Bedrock, Vertex, BigQuery, Azur, En Açık, En Çok Çözümlü, Eğer Bir Kullanıcı Olmadıkça

### 2026 yılına kadar kilitlenmiş.

Bir model baskın olduğunda, tek hiper ölçekli taahhüt kabul edilebilir. 2026 yılında, ön kenarında her ay hareketli  Bir dönem Claude 3.7, bir dönem Gemini 2.5, bir dönem GPT-5  bir platform kilitlemek, seni üç bölümün ön kenarında dışlayacaktır.

Effetli ekipler tarafından kullanılan model: herhangi bir ürün için önemli LLM çağrısı, en az iki sağlayıcı kullanın.

### Veri oturumları, BAA'lar ve denetim sektörü

Bedrock: Çoğu bölge BAA'ları, VPC son noktalarını, koruyucuları sağlar.
Azure OpenAI:HIPAA、SOC 2、ISO 27001; AB veri oturumları;
Vertex:HIPAA、GDPR、 bölgeye göre veri oturumları;Google Bulut'un uyumluluk yığınları

Üç者都满足基础チェックボックス。 farklar veri saklama politikaları、loglar  nasıl işlenmesi, ve kötüye kullanımı izleme 否读取你的流量;; çoğu defalarca seçilme; işletme seçilmezliği yapılabilir)。

### Hatırlamalı olduğun bir sayı var.

- Azure OpenAI'de Llama 3.1 405B 等效场景 altında ortalama TTFT: ~ 50 ms(PTU'ları kullanmak)
- İsteğe bağlı yataklılık Ortalama TTFT: ~ 75 ms。
- Yataklı Yüküm: 1 birim $21-$50/saat.
- Azure PTU'nun dengesi: ~40-60% sürdürülebilir kullanım
- Yüksek kullanım oranı düşük PTU oranında talep üzerine tasarruf: %70'e kadar


```figure
i4-platform-lanes
```

## Kullan
`code/main.py`Bu üç platformun karşılaştırması ile yapılmış bir sentetik iş yükü içinde, talep üzerine inşa edilmiştir ve PTU ile karşılaştırılır. Ekonomik ỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹỹ (TTFTTFTTTTTFTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT

## - Söyle.
本课会生成 `outputs/skill-managed-platform-picker.md` Gösterilen iş yükü profilini (necessity model, TTFT SLA, günlük hacmi, uyumluluk gereksinimleri), ana platform, geri dönüş ve FinOps araçlama planını önerecektir.

## 练习
1. 运行  İşlem`code/main.py`❖ 70B sınıfı modeli için,Azure PTU hangi sürdürülebilir kullanımı altında talep üzerinde daha iyidir? hesaplama keskinlik,并与宣称的 40-60% 区间比较。
2. Ürünleriniz Claude 3.7 Sonnet ve GPT-4o'yu gerektiriyor. İki tedarikçiyle bir uygulama tasarlıyor.
3. Bir Üye İzlenen Sağlık 客户要求 BAAs、US-East data residency 和 sub-100ms P99 TTFT── seçin bir platform,并用三个具体功能来论证──
4. Bu ayda Bedrock'un hesapları trafik değişiminin olmadığı bir ortamda 4 kat arttı.
5. Azure OpenAI ve Bedrock fiyatlama sayfalarını okuyun. 100M-token/ay Claude iş yükü için, hangisi daha uygun?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Bedrock | "AWS LLM service" | 跨 Claude、Llama、Titan、Mistral、Cohere 的模型 marketplace |
| Azure OpenAI | "Azure's ChatGPT" | 位于 Azure datacenters 中、带企业控制能力的独家 OpenAI 模型 |
| Vertex AI | "Google's LLM" | 以 Gemini 为先的平台，Model Garden 用于 third-party models |
| PTU | "dedicated capacity" | Provisioned Throughput Unit — 预留 inference GPUs，按小时定价 |
| Application Inference Profile | "Bedrock tagging" | 带 tags 的 per-product cost/usage profile，CloudWatch-native |
| Model Garden | "Vertex catalog" | Vertex AI 的 third-party model section，独立于 Gemini |
| Two-provider minimum | "LLM redundancy" | 让每条关键 LLM 路径跨 ≥2 个 hyperscaler 运行的策略 |
| BAA | "HIPAA paperwork" | Business Associate Agreement；PHI 所必需；三者均提供 |
| Abuse monitoring | "the log watcher" | provider-side safety scan，作用于 prompts/outputs；enterprise 可 opt-out |

## 延伸阅读
- [AWS Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/) 权威 oran kartı 和 Sağlanan Çıktım fiyatlandırması。
- [Azure OpenAI Service Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/)PTU ekonomisi ve oran kartları
- [Vertex AI Generative AI Pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing) Gemini seviyeleri 和 Model Garden taksitleri。
- [Artificial Analysis LLM Leaderboard](https://artificialanalysis.ai/) 跨供应商的持续延迟和吞吐量基准――
- [The AI Journal — AWS Bedrock vs Azure OpenAI CTO Guide 2026](https://theaijournal.co/2026/03/aws-bedrock-vs-azure-openai/) Kurumsal karar çerçevesini oluşturmak
- [Finout — Bedrock vs Vertex vs Azure FinOps](https://www.finout.io/blog/bedrock-vs.-vertex-vs.-azure-cognitive-a-finops-comparison-for-ai-spend) atribut mekanizması yan yana-
