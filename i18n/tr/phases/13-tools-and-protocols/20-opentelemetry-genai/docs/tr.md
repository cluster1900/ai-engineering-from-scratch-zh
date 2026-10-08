# OpenTelemetry GenAI  端到端 takip aracı Çağrılar

> Bir ajan 5 araç kullanmıştır, üç MCP sunucusu ve iki alt ajanı. Bu nedenle, bir ajanın tüm alanları takip etmesi için bir araç kullanılması gerekir. OpenTelemetry GenAI semantik sözleşmeleri (v1.37 及以上版中的稳定属性) 2026 yılına yönelik standarttır.

**Type:** Build
**Languages:** Python (stdlib, OTel span emitter)
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 08 (MCP client)
**Time:** ~75 minutes

## Öğrenme hedefi
- LLM süresi ve araç-öğretim süresi belirlenmesi gereken OTel GenAI özellikleri
- 构建覆盖代理循环、LLM çağrı、工具 çağrı 和 MCP istemci gönderisi iz hiyerarşisi。
- Hangi içeriği ele geçirmek ve hangi içeriği düzenlemek gerektiği konusunda karar vermek.
- Yazmadan yazmak için bir araç kodu kullanırken, r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r r rr r rr r r r r  r r  r   r                                                                                                                         

## 问题
Bir 2026 yılının 2 ayı debug  Kası: User Report My agent 有时需要30秒才响应;其他时候只需3秒──没有痕迹──Loglar 显示LLM arama,但没有显示工具发送、MCP sunucu dönüş yolculuğu,也没有显示子代理──你只能猜──最后你发现:某MCP sunucu 偶尔会在冷启动时卡住──

端到端追踪 yok, bu sorunu çözemiyorsun.

Bu konvansiyonlar, 2025-2026 yıllarında OpenTelemetry semantik-konvensiyon grubu tarafından 定型── onlar sabit özelliği isimleri tanımladı, bu nedenle Datadog、Langfuse、Phoenix、OpenLLMetry 和 AgentOps aynı aralıkları çözebilir── sadece bir kez; istedikleri arka uçlara gönderilebilir──

## 概念
### İspanyol hiyerarşi

```
agent.invoke_agent  (top, INTERNAL span)
 ├── llm.chat       (CLIENT span)
 ├── tool.execute   (INTERNAL)
 │    └── mcp.call  (CLIENT span)
 ├── llm.chat       (CLIENT span)
 └── subagent.invoke (INTERNAL)
```

Tüm süreç aynı iz kimliğinde yer alıyor.

### Gerekli özellikler

2025-2026 semkonv'e göre:

- `gen_ai.operation.name` `"chat"`- Evet.`"text_completion"`- Evet.`"embeddings"`- Evet.`"execute_tool"`- Evet.`"invoke_agent"`- Evet.
- `gen_ai.provider.name` `"openai"`- Evet.`"anthropic"`- Evet.`"google"`- Evet.`"azure_openai"`- Evet.
- `gen_ai.request.model` Yalvarışın model dizilisi(misal için `"gpt-4o-2024-08-06"`)。
- `gen_ai.response.model` 实际提供服务的模型──
- `gen_ai.usage.input_tokens`- Ne ?`gen_ai.usage.output_tokens`- Evet.
- `gen_ai.response.id`  关联'ın sağlayıcı yanıt kimliği

For araç aralığı:

- `gen_ai.tool.name` araç tanımlayıcısı。
- `gen_ai.tool.call.id` 具体的电话 id──
- `gen_ai.tool.description` Araç tanımlaması(可选)。

对于代理跨度:

- `gen_ai.agent.name`- Ne ?`gen_ai.agent.id`- Ne ?`gen_ai.agent.description`- Evet.

### İtkisiz

- `SpanKind.CLIENT`Öte yandan süreç sınırları için kullanılan bir uygulama.
- `SpanKind.INTERNAL`Ajanın kendi döngü adımlarını ve araç yürütmesini kullanmak.

### Seçili içeriği yakalama

默认情况下, 跨度 携带计量和时间, değil istekler veya tamamlamalar ⋅ büyük payloads 和 PII 默认关闭──设置 ⋅`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`Ayrıca belirli içerik kapma ortamı içeriği içerir.

### Sapanlardaki olaylar

Token seviyesindeki olaylar uzantı olayları olarak yapılabilir 添加:

- `gen_ai.content.prompt` giriş mesajları。
- `gen_ai.content.completion` çıkış mesajları。
- `gen_ai.content.tool_call` 记录下来的工具调

Bir süre içinde olaylar zaman sıralamasıyla, detaylı bir şekilde tekrarlanmaktadır.

### Dışarıya aktarıcılar

OTel uzantıları:

- **Jaeger / Tempo.**- OSS, yeryüzünde.
- **Langfuse.**面向 LLM gözlemlenebilirliği;可视化 token kullanımı
- **Arize Phoenix.**Evals + izleme 结合。
- **Datadog.**商业产品; 原生解析 `gen_ai.*`Özellikler
- **Honeycomb.**Sütun yönlendirici; 便于查询。

它们都使用OTLP,也就是电线格式──你的代码无需关心──

### MCP'ler arasında yayılma

MCP istemcisi 调用服务器 时,把 W3C traceparent header 注入请求──Streamable HTTP 支持标准头──Stdio 不原生携带 HTTP头;该规范的2026 路线图 讨论在 JSON-RPC 调用上添加`_meta.traceparent`- Evet.

Yayınlanmadan önce: her istek için elini harekete geç .`_meta`中包含 traceparent──Server 记录 trace id──

### Metrikler

Genişlemenin kapsamına ek olarak, GenAI semconv metrikleri de tanımladı:

- `gen_ai.client.token.usage` histogram。
- `gen_ai.client.operation.duration` histogram。
- `gen_ai.tool.execution.duration` histogram。

Bu bilgileri arama detayları gereksiz olarak kullanılacak.

### AgentOps katmanı

AgentOps (tasarlandı 2024 yılında) GenAI gözlemliliğine odaklanmıştır.


```figure
t3-span-waterfall
```

## Kullan
`code/main.py`OTLP-JSON'a benzer bir biçim kullanılarak, bir LLM'yi kullanmak için iki araç kullanılır, iki MCP geri dönüş aracı gerçekleştirir.

需要关注的点:

- Tüm alanlar 共享同一个痕迹ID──
- Ebeveyn-çocuk bağlantıları       `parentSpanId`- Evet.
- Gerekli`gen_ai.*`已填充──
- İçerik yakalama 默认关闭; bir sahne geçiyor ve açılıyor.

## - Söyle.
本课会产 出 `outputs/skill-otel-genai-instrumentation.md` Bir ajan kod tabanı belirle, bu beceri bir araçlama planı oluşturacaktır:

## 练习
1. 运行  İşlem`code/main.py`◊ Statistik alanı ◊ sayı, ◊ kimlikleri KİTİN, kimlikleri İKİN ◊

2. 打开 içerik yakalama vvar , 确认出现 `gen_ai.content.prompt`和 `gen_ai.content.completion`olaylar, PII'nin etkisine dikkat et.

3. 添加 araç-öğretim metrikleri `gen_ai.tool.execution.duration`,并每次调用将其作为 histogram örnek 发送──

4. Analiyin temsilcisi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `_meta.traceparent`MCP sunucusu aynı iz kimliğini görecek.

5. 阅读 OTel GenAI semconv spec¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| OTel | "OpenTelemetry" | 用于 traces、metrics、logs 的开放标准 |
| GenAI semconv | "GenAI semantic conventions" | LLM / tool / agent spans 的稳定 attribute names |
| `gen_ai.*` | "The attribute namespace" | 所有 GenAI attributes 都共享此前缀 |
| Span | "Timed operation" | 一个具有 start、end 和 attributes 的 work unit |
| Trace | "Cross-span ancestry" | 共享同一个 trace id 的 spans 树 |
| SpanKind | "CLIENT / SERVER / INTERNAL" | 关于 span direction 的提示 |
| OTLP | "OpenTelemetry Line Protocol" | exporters 使用的 wire format |
| Opt-in content | "Prompt / completion capture" | 默认关闭；通过 env var 启用 |
| traceparent | "W3C header" | 跨 services 传播 trace context |
| Exporter | "Backend-specific shipper" | 将 spans 发送到 Jaeger / Datadog / 等的组件 |

## 延伸阅读
- [OpenTelemetry — GenAI semconv](https://opentelemetry.io/docs/specs/semconv/gen-ai/)GenAI'nin kapsamı, ölçümleri ve etkinliklerin yetkililiği
- [OpenTelemetry — GenAI spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/) LLM ve araç-öğretim süresi atributı 列表
- [OpenTelemetry — GenAI agent spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-agent-spans/) ajan düzeyinde `invoke_agent`Uçuş
- [open-telemetry/semantic-conventions — GenAI spans](https://github.com/open-telemetry/semantic-conventions/blob/main/docs/gen-ai/gen-ai-spans.md)GitHub 托管的权威来源
- [Datadog — LLM OTel semantic convention](https://www.datadoghq.com/blog/llm-otel-semantic-convention/) üretim entegrasyonu 讲解
