# Hızlı Kaşlama ve Semantik Kaşlama 经济学

> **Pricing snapshot 日期为 2026-04。**Aşağıdaki değer açıklaması bu dersin yayınlandığında toplanan satıcı oran kartlarını yansıtır; aşağıdaki derslerden önce, lütfen önce kontrol edin

> Kaşlama 发生在两层──L2(provider-level)prompt/prefix caching 会为重复 prefix 复用注意 KV  Anthropic 的 prompt-caching dosyaları 宣称,在长提示上最高可降低90% 成本、降低85% latency;对于Claude 3.5 Sonnet,cache reads 为$0.30/M，而 fresh 为 $3.00/M,TTL için 5 dakika, 1 saat TTL seçeneği 2x yazma ödemesi vardır(docs.anthropic.com,2026-04)。OpenAI prompt caching 会 otomatik olarak ≥1024 jetonlarındaki isteklere uygulanır,并将缓存输入 定价为相对新鲜约90%折扣(platform.openai.com,2026-04);精确的每模型缓存率 取决于现金率卡──L1app-level) 语义缓存会在嵌入式相似性中完全跳转LLM──Vendor 95%精度指的是匹配正确性,而不是打卡率  报告的打卡率从10%开封聊) 升级到结构化FAQ) 不等;((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((

**Type:** Learn
**Languages:** Python (stdlib, toy two-layer cache simulator)
**前置要求：**17 · 04 aşaması (vLLM Serving Internals), 17 · 06 aşaması (SGLang RadixAttention)
**Time:** ~60 分钟

## Öğrenme hedefi
- 区分 L2 prompt/prefix caching(provider 侧 KV 复用) vs L1 semantic caching(对相似提示 绕过 LLM)。
- Antropik                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `cache_control`显式标记,以及两个 TTL 选项 ((5-min与1-hour) ve fiyat çarpıcıları。
- 根据击率、快速/响应混合和Token prices,计算预期月度节省。
- Bu, bir diğer diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer şey de, bir diğer de, bir diğer de, bir diğer de, bir de, bir de bir de bir, bir de bir de bir, bir de bir de bir, bir de bir de bir de bir, bir de bir de bir de bir, bir de bir de bir de bir, bir de bir de bir de bir de bir, bir de bir de bir de bir de bir de bir de bir, bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de

## 问题
RAG hizmetini kullanırken, hızlı önbelleğe geçiş yaptırırız. Hesaplar değişmez. Başlama oranını ölçüyorsunuz. Sadece %7'dir. İstekleriniz hareketsiz görünüyor, fakat aslında  sistem önbelleği değil.

Ayrıca, ajanınız her kullanıcı sorusu için çalışır ve 10 araç çağrısını yürütür. 10 talebi ilk kez kaydetme yazısı tamamlanmadan önce sağlayıcısına ulaşır.

Kaşlama bir anlaşmadır, bir bayrak değil.

## 概念
### L2  sağlayıcı önbellek/önbellek önbellek

Provider  depolama cacheable prefix dikkat KV, ve bir sonraki uyarın bu prefix istek 上复用它──你只支付一次写费,读 几乎免费──

**Anthropic (Claude 3.5 / 3.7 / 4 series)**:request 中的显式 `cache_control`işaretçi──你标记哪些块可缓存──TTL:5-minute(yazma maliyetleri 为 1.25x baz) veya 1 saat(yazma maliyetleri 为 2x baz)──缓存读:Claude 3.5 Sonnet 上为$0.30/M，而 fresh 为 $3.00/M  便宜 10x(docs.anthropic.com,截至2026-04)。不同模型的价格 不同(Opus/Haiku 分别发布);始终交叉核对现场价格页。

**OpenAI**: %1024'den fazla token için istekler otomatik önbelleğe kaydedilmektedir; platform.openai.com,2026-04);; hiç açık bayrak yok.`usage.cached_tokens`Kendi durumunuzu ölçmek için.

**Google (Gemini)**: Açık API üzerinden yapın bağlam önbelleği; 1M-token bağlamı anlamına gelir önbelleğin kazancı daha büyük.

**Self-hosted (vLLM, SGLang)**:Fase 17 · 06 介绍 RadixAttention  Öz hesaplamaınızda 上采用相同模式──

### L1  uygulama 级 semantik önbelleği

Önceden, önce hash prompt、对其做 Embedding,并查找相似的缓存请求(kosine benzerliği Yüksek eşiğinde, genellikle 0.95+)

Açık kaynaklı:Redis vektör benzerliği、GPTCache、Qdrant。 Ticari:Portkey Cache、Helicone Cache。

Satıcı doğruluk iddiaları, geri dönüşün önbelleğe alınan yanıtını ifade ederken, hit oranları değil, uygun frekansta ifade eder.

- Açık sohbet: 10-15%
- Yapılandırılmış Soru sorusu / destek:40-70%。
- Kod sorusu: %20-30
- Sesli ajanlar tekrarlama çağrıları:50-80%

### Paralelleşme karşıtı örneği

Ajanınız ve 10 araç çağrısı gönderir. Onlardan 10'unun aynı 4K-token sistemini kullanması istenmektedir. Antropik önbelleği yazma istekleri uyarınca yapılır. İlk önbelleği yazma, sağlayıcı tarafından yapılmaktadır.

修复:batch with sequential-first  单独发起请求 1,然后在1 的缓存 已填充后再触发 2-10──给第一个工具调用 增加300 ms;节省 5-10x 账单──

### Dinamik içeriği anti-önemli

Sisteminize göre:

```
You are a helpful assistant. The current time is 14:32:17.
User ID: abc123. Today is Tuesday...
```

Her istek birdir. Her istek yazılır.

修复:把所有真正静态的内容移动到缓存前;把动态内容 添加到缓存边界 之后:

```
[cacheable]
You are a helpful assistant. [rules, examples, instructions]
[/cacheable]
[dynamic, not cached]
Current time: 14:32:17. User: abc123.
```

ProjectDiscovery bu şekilde, önbelleği vurma oranını %7'ten %74'e yükseltti ve bu anatomiyi yayınladı.

### Gecelik iş yükleri için toplu seri + önbelleği

Satır API'leri(Fase 17 · 15) 24 saatlik dönüşümde 下50% indirim sağlama 叠加后又能获得约10x──夜间分类、标签和报告生成工作负荷可通过叠加降至同步未成成的约10%──

### Hatırlamalısın numaralar

Fiyat noktaları, bağlantı sağlayıcı belgeleri üzerinden toplanan 2026-04 verileridir ve her ay değişir.

- Antropik önbelleği okuyucu:Claude 3.5 Sonnet 上 $0.30/M, yaklaşık yeni giriş 便宜 10x(docs.anthropic.com) ⋅
- Antropik cache yazma primesi:1.25x(5-min TTL) veya 2x(1-saat TTL)。
- OpenAI otomatik önbelleği: ≥1024 jetonların isteklerine uygundur; ⇒% 10 yeni giriş için önbelleğe girilen giriş 定价约为10% (platform.openai.com) ⋅
- Semantik önbelleği isabet oranı(halk tarafından bildirilen):açık sohbet 约 ~10%; yapılandırılmış FAQ 最高约 ~70%──
- ProjeDiscovery: 通过将动态移出前,hit rate from 7% → 74%
- Paralelleşme karşıtı örneği: tipik rapor gösterir, N 个 paralel istekler 错过第一次缓存写时,账单会膨胀 510x。


```figure
semantic-cache-hit
```

## Kullan
`code/main.py`模拟混合 workloads 上的 L1 + L2 caching── rapor hit rate、bilge,并 göster paralellik cezası──

## - Söyle.
本课产 出 `outputs/skill-cache-auditor.md`❖ Dönüştürme templesi ve trafiği, önbelleği denetleme ve yeniden yapılandırma önerisi

## 练习
1. 运行  İşlem`code/main.py`❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖
2. Sistem süresi var. Dışarıya çıkar.
3. Verilmiş talep gelme oranı durumunda, 1 saat TTL ((2x yazmak) ile 5 dakika TTL ((1.25x yazmak) arasında bir kesintisi hesaplayın.
4. Semantik önbelleği %0.95 e yükseldi, %20 aşağıya düştü. %0.85 aşağıya düştü. %50 ama yanlış önbelleğe alınan cevapları görüyorsunuz.
5. Bu, her kullanıcı sorusu seri için 10 paralel alt sorguyu oluşturur.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| L2 prompt cache | "prefix cache" | Provider 存储重复 prefix 的 KV |
| `cache_control` | "Anthropic cache marker" | 标记 cacheable blocks 的显式 attribute |
| Cache write premium | "write tax" | 从首次 miss 到 cache 的额外成本（1.25x 或 2x） |
| L1 semantic cache | "embedding cache" | 调用 LLM 前在 app-level 进行 hash-and-embed |
| GPTCache | "LLM caching lib" | 流行的 OSS L1 cache library |
| Cache hit rate | "hits / total" | 从 cache 服务的 requests 占比 |
| Parallelization anti-pattern | "the N-write trap" | N 个 parallel requests 会 N 次 miss cache |
| Dynamic content trap | "the time-in-prompt trap" | prefix 中的 dynamic bytes 会破坏 hit rate |
| RadixAttention | "intra-replica cache" | SGLang 的 prefix-cache implementation |

## 延伸阅读
- [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) resmi `cache_control`Semantik ve TTL'ler
- [OpenAI Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching) otomatik önbelleğe kaydetme davranışı ve uygunluk¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- [TianPan — Semantic Caching for LLMs Production](https://tianpan.co/blog/2026-04-10-semantic-caching-llm-production)
- [ProjectDiscovery — Cut LLM Costs 59% With Prompt Caching](https://projectdiscovery.io/blog/how-we-cut-llm-cost-with-prompt-caching)
- [DigitalOcean / Anthropic — Prompt Caching](https://www.digitalocean.com/blog/prompt-caching-with-digital-ocean)
