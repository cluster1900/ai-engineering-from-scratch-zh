# OpenTelemetry GenAI 语义约定

> OpenTelemetry'nin GenAI SIG(2024 yıl 4 月 başlatıldı) ajan telemetri standart şemalarını tanımladı.

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 13 (LangGraph), Phase 14 · 24 (Observability Platforms)
**Time:** ~60 分钟

## Öğrenme hedefi
- GenAI alanı kategorilerini açıklayın: model/klient, ajan, araç.
- 区分 `invoke_agent`KLIENT ve iç alanlar ve onların uygunlukları.
- 列出顶层 GenAI özellikleri: sağlayıcı adı, talep modeli, veri kaynağı kimliği
- 解释 content capture contract:opt-in`OTEL_SEMCONV_STABILITY_OPT_IN`、dıştan gelen referans tavsiyesi¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

## 问题
Her satıcı kendi alanı isimlerini ortaya çıkarır. Operasyon takımları, her çerçeve için ayrı bir araç tablosu oluşturmalıdır. OpenTelemetry'nin GenAI SIG'i bu sorunu çözmek için tüm ekosistemin standartlarını tanımlayarak çözmelidir.

## 概念
### Sıkıntı kategorileri

1. **Model / client spans.**覆盖原始 LLM çağrıları──由提供者SDKs(Anthropic、OpenAI、Bedrock)
2. **Agent spans.** `create_agent`( yapılandırma ajanı 时)`invoke_agent`(运行代理 时)
3. **Tool spans.**Bir çocuk-ana ilişkisi ile bir ajanın süresi arasında bağlantı kurmak.

### Ajanın adı

- İspanyolca isim: If has been named,则为 `invoke_agent {gen_ai.agent.name}`Geri dönüş`invoke_agent`- Evet.
- - İtfaiye türü:
  - **CLIENT** Uzak ajan hizmetleri için kullanılıyor.
  - **INTERNAL** İşlemdeki ajan çerçevelerinde kullanılır ((LangChain、CrewAI、local ReAct) 

### Ana özellikler

- `gen_ai.provider.name` `anthropic`- Evet.`openai`- Evet.`aws.bedrock`- Evet.`google.vertex`- Evet.
- `gen_ai.request.model` model kimliği。
- `gen_ai.response.model` 解析后的模型(可能因路由而不同于请求)。
- `gen_ai.agent.name` ajan kimliği。
- `gen_ai.operation.name` `chat`- Evet.`completion`- Evet.`invoke_agent`- Evet.`tool_call`- Evet.
- `gen_ai.data_source.id`RAG'de hangi depoyu sormuşlar?

Antropik  Azure AI Inference  AWS Bedrock  OpenAI'nin teknik konvansiyonları vardır.

### İçerik yakalama

默认规则:instrumentations 默认 SHOULD NOT 捕获输入/输出──捕获 通过以下方式选择:

- `gen_ai.system_instructions`
- `gen_ai.input.messages`
- `gen_ai.output.messages`

推的生产模式:将内容存储在外部(S3、你的日志店),在跨度上记录引用(pointer ID'ler, değil, muhabir) ・・・这是27 ders 防接入可观性的内容-poisoning的方法──

### Dayanıklılık

截至2026年 3月, çoğu konvensiyon 仍是实验性──使用以下方式选择到稳定预览:

```
OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental
```

Datadog v1.37+ 会将 GenAI nitelikleri 原生映射到其LLM Observability schema──其他后台(Grafana、Honeycomb、Jaeger) support raw attributes──

### Bu yol kolayca yanlış bir yerde

- **在 spans 中捕获完整 prompts。**PII, sırlar, müşteri verileri, işleme girecek, okunabilir izler, dışta saklanacak.
- **没有 `gen_ai.provider.name`。**Atribut 缺失时,çok sağlayıcılık arabası 会失效。
- **没有 parent links 的 spans。**Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Ç Ç Ç Ç Ç Ç Ç Ç Çeviri: Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç
- **没有设置 stability opt-in。**Son derece yükseltildiğinde, özelliklerin yeniden adlandırılabilir.


```figure
ae-genai-span-tree
```

## Yapın onu.
`code/main.py`GenAI'nin standartlarına uygun bir stdlib uzantı emitenin gerçekleştirilmesi:

- 带 GenAI özelliği şema `Span`- Evet.
- 带 `start_span`、çırılçık bağlamlar `Tracer`- Evet.
- Bir senaryolu ajan koşup, bir mesaj gönderecek:`create_agent`- Evet.`invoke_agent`(İNTERNAL) ✓ her alet için ✓ LLM çağrıları için ✓`chat`Uçaklıkları
- İçerik yakalama modunda, ipuçlarını dışarıda saklar ve üst kayıt kimliklerini uzatır.

- Yapma .

```
python3 code/main.py
```

输出: bir ağacı içerir tüm gerekli GenAI özelliklerinin bir uzantı ağacı, ayrıca bir seçme içeriği referanslarını gösteren bir "dış mağazası"

## Kullan
- **Datadog LLM Observability**(v1.37+) original生映射 özellikleri。
- **Langfuse / Phoenix / Opik**(Deneyim 24)  Otomatik alet 生态。
- **Jaeger / Honeycomb / Grafana Tempo** çi OTel izleri; GenAI özelliklerinden 构建仪表板──
- **Self-hosted** 使用 GenAI işlemcisi 运行 OTel Collector。

## - Söyle.
`outputs/skill-otel-genai.md`OTel GenAI'nin 接入现有代理,并带有内容-capture defaults 和外部参照存储──

## 练习
1. Kullanım`invoke_agent`(İNTERNAL) + per-tool spans instrument Your's Lesson 01 ReAct loop──发送到一个Jaeger instance──
2. "Sadece referanslar" modunda 中添加内容捕捉:prompts 写入 SQLite,span attributes 只携带行 ID;;
3. Okuyucu`gen_ai.data_source.id`Bu yüzden, bu konuyu öğrenmek için, ders 09'da bir araya getireceğim.
4.  ayar `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`,并验证 senin özelliklerin toplayıcı tarafından yeniden adlandırılmayacak.
5. Dashboard oluştur: GenAI özelliklerinden sadece " hangi araç hataları hangi modellerle  bağlantılı"

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| GenAI SIG | "OpenTelemetry GenAI group" | 定义 schema 的 OTel working group |
| invoke_agent | "Agent span" | 表示一次 agent run 的 span name |
| CLIENT span | "Remote call" | 调用 remote agent service 的 span |
| INTERNAL span | "In-process" | in-process agent run 的 span |
| gen_ai.provider.name | "Provider" | anthropic / openai / aws.bedrock / google.vertex |
| gen_ai.data_source.id | "RAG source" | retrieval 命中了哪个 corpus/store |
| Content capture | "Prompt logging" | 对 messages 的 opt-in capture；prod 中存储在外部 |
| Stability opt-in | "Preview mode" | 用于固定 experimental conventions 的 env var |

## 延伸阅读
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) 规范
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)GenAI kapsamlarını  默认提供 GenAI kapsamlarını
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) 内置 OTel kapsamları
- [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) W3C izleme bağlamı 传播
