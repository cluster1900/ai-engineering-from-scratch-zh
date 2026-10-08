# LLM Routing Layer  LiteLLM, OpenRouter, Portkey

> Provider lock-in 代价高昂── farklı araç çağrıları 工作负载适合不同模型──路由网关 提供统一的API 表面、重试、failover、成本跟踪和 guardrails──2026 yılın içinde üç ana biçim vardır:LiteLLM(开源、自托管)、OpenRouter(托管 SaaS)、Portkey(production level,2026 yılın 3 月开源)──本课会说明决策标准,并演示一个 stdlib路由网关──

**Type:** Learn
**Languages:** Python (stdlib, routing + failover + cost tracker)
**Prerequisites:** Phase 13 · 02 (function calling), Phase 13 · 17 (gateways)
**Time:** ~45 分钟

## Öğrenme hedefi
- 区分自托管、托管和生产级 yönlendirme 选项──
-                                                                                                                                                                                                                                                               
- Takip eden sağlayıcıların tek seferlik talep maliyeti ve Token kullanım miktarı
-  belirli üretim kısıtlamaları için, LiteLLM、OpenRouter ve Portkey arasında seçim yapılır.

## 问题
Provider routing  önemli sahne:

1. **成本。**Claude Sonnet'in maliyeti Haiku'nun 3 katıdır.

2. **Failover。**OpenAI ortaya çıkıyor. Her istek başarısız.

3. **延迟。**实时聊天 UI 需要快速的时间到第一代标志――批量摘要器不需要――按延迟 SLA 路由──

4. **合规。**AB Kullanıcıları AB bölgesinde kalmalıdır.

5. **实验。**Aynı çalışma yükünde iki model için A/B yapın.

Bu süreçte, her bir kullanıcı için bir API oluşturulur.

## 概念
### OpenAI uyumlu vekil 形态

Herkes OpenAI şeklini kullanıyor.`/v1/chat/completions`, OpenAI şemalarını kabul eder ve içtenlikle Anthropic / Gemini / Cohere / Ollama / 任何后端──客户端不需要关心──

### Model isimler

Senin kodun yazılmıyor.`claude-3-5-sonnet-20251022`Ama yazmak yerine.`our_smart_model`Gateway 映射到真实模型──当Anthropic 发布Claude 4 时,你在服务端修改;你的代码无需改变任何东西──

### Çökme zincirleri

```
primary: openai/gpt-4o
on 5xx: anthropic/claude-3-5-sonnet
on 5xx: google/gemini-1.5-pro
on 5xx: refuse
```

Giriş yolu, yapılandırmalarda bunları tanımlıyor.

### Semantik önbelleğe

Aynı veya benzer aynı anket yaşam kaydında, değil giriş sağlayıcısı için.

### Koruma rayları

网关级:

- **PII redaction.**Gönderme süresi Önü gerçekleştirmek Regex veya temel ML işleme
- **Policy violations.**拒绝包含禁止内容的提示──
- **Output filters.**清理完成 中中的泄漏内容──

Portkey ve Kong şehir içinde belirgin bir şekilde yönlendirilmiş korumalar vardır.

### Anahtarlık oranı sınırları

Bir API anahtarı = bir ekip. Bir ekip tüketimini önlemek için anahtarlık bütçesi. Çoğu geçit bunu destekler.

### Kendi kendine konutlanan ve yönetilen bir tercih

| Factor | LiteLLM (self-hosted) | OpenRouter (managed) | Portkey (production) |
|--------|----------------------|----------------------|----------------------|
| Code | 开源，Python | 托管 SaaS | 开源（2026 年 3 月）+ 托管 |
| Setup | 部署一个 proxy | 注册 | 二者均可 |
| Providers | 100+ | 300+ | 100+ |
| Billing | 你自己的 key | OpenRouter credits | 你自己的 key |
| Observability | OpenTelemetry | Dashboard | 完整 OTel + PII redaction |
| Best for | 想要完全控制的团队 | 快速原型开发 | 有合规需求的生产环境 |

Eğer SRE'ye sahipsen ve bir ekip varsa ve verilerin sahibi olmak istediğinde,LiteLLM 胜出.

### Maliyet izleme

Her bir istek taşı .`provider`- Evet.`model`- Evet.`input_tokens`- Evet.`output_tokens`△ model △ token fiyatı △ gateway 维护的价格表 拉取) △ kullanıcı / 团队 / 项目聚合──

### MCP artı yönlendirme

Geçit aynı zamanda LLM 调用和MCP örnekleme istekleri tarafından yönlendirilebilir.

### Yollama stratejileri

- **Static priority.**Liste içindeki ilk; out error time fallback
- **Load balancing.**- Dört-robin veya ekmek.
- **Cost-aware.**选择满足延迟 / 质量要求的最低成本模型──
- **Latency-aware.**选择过去 N 分钟内最快的模型──
- **Task-aware.**Hızlı sınıflandırıcı kodlama 路由到一个模型,将总结 路由到另一个模型――


```figure
tp-router-failover
```

## Kullan
`code/main.py`150 yıl boyunca bir yönlendirme geçitini gerçekleştirmek için: OpenAI şeklinde bir istek kabul edin, her bir sağlayıcıya dönüştürün, öncelikli bir fallback zincirini yürütün, tek bir istek masrafını takip edin, ve giriş uygulamasını PII düzenleme geçitine uygulayın.

需要关注:

- `ROUTES`dict:alias -> 按优先排序的具体供应商列表──
- 5xx'te tekrar deneme.
- Maliyet izleyicisi, her modelin fiyatına göre token kullanım miktarını çarpıyacak.
- PII redaktörü, SSN'nin biçiminde bir şekilde bir işlem yapar.

## - Söyle.
本课会产 出 `outputs/skill-routing-config-designer.md`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                     

## 练习
1. 运行  İşlem`code/main.py`◊触发停电场; 落到第二供应商;并且成本归因正确──

2. 添加语义缓存:prompt 的 SHA256 作为搜索键;缓存击立即返回──测量重复调用成本节省──

3. 添加一个快速分类器,将 `"code ..."`İstihbaratın yönlü yönlü yönlü yönlü yönlü yönlü yönlü yönlü yönlü yönlü yönlü yönlü yönlü yönlü yönlü yönlendirmeler.`"summarize ..."`路由到偏向速度 的 alias──

4.  takım bütçesi tasarımı: her ekip aylık harcamalar sınırına sahiptir; yukarı sınırlara ulaşmak, geçit  reddetme istekleri, bir uygulama ayrıntılılığını seçmek veya bir pencereye geçmek için)

5. Ayrıca, LiteLLM、OpenRouter 和 Portkey 文档── her ürün sunulduğunu ve diğer iki ürünün bir özelliği olmadığını belirtmektedir.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Routing gateway | "LLM proxy" | 位于多个 provider 前方的统一 API 表面层 |
| OpenAI-compatible | "Speaks the OpenAI schema" | 接受 `/v1/chat/completions` shape，并转换到任意 backend |
| Model alias | "our_smart_model" | 你代码中的名称，由 gateway 映射到具体模型 |
| Fallback chain | "Retry list" | 失败时按顺序尝试的 provider 列表 |
| Semantic caching | "Prompt-embedding cache" | Key 是 prompt 的 Embedding；近似重复内容共享一次 cache hit |
| Guardrails | "Input/output filters" | 脱敏 PII，拒绝 policy violations |
| Per-key rate limit | "Team budget" | 作用域限定到 API key 的 quota |
| Cost tracking | "Per-request spend" | 聚合 Token 使用量 x 每个模型的价格 |
| LiteLLM | "The open proxy" | 可自托管的 OSS routing gateway |
| OpenRouter | "The managed SaaS" | 基于 credit 计费的托管 gateway |
| Portkey | "The production option" | 开源 + 托管，内置 guardrails |

## 延伸阅读
- [LiteLLM — docs](https://docs.litellm.ai/) 自托管 yönlendirme kapısı
- [OpenRouter — quickstart](https://openrouter.ai/docs/quickstart) 托管 yönlendirme SaaS
- [Portkey — docs](https://portkey.ai/docs) 带有护的生产级路由
- [TrueFoundry — LiteLLM vs OpenRouter](https://www.truefoundry.com/blog/litellm-vs-openrouter) 决策指南
- [Relayplane — LLM gateway comparison 2026](https://relayplane.com/blog/llm-gateway-comparison-2026) Satıcı 调研
