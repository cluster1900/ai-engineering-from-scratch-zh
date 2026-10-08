# OpenAI Ajanlar SDK: Elde alma, Koruma, Takip

> OpenAI Ajanlar SDK, yanıtlar API'si oluşturulan hafif bir düzeyde çoklu ajan çerçevesine dayanmaktadır.`transfer_to_<agent>`Bu nedenle, bu işlemler, bir sonraki işlem için kullanılabilir.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 06 (Tool Use)
**Time:** ~75 minutes

## Öğrenme hedefi
- Açık AI Ajanları SDK'nin beş ilkinin farkında değilim.
- 解释 handoffs: neden araçlar olarak inşa edilmiştir 模型看的名称 形形是什么以及文本 如何转移──
- 区分 input guardrails、output guardrails 和 tool guardrails; açıklama `run_in_parallel`Bloklama moduna.
- Udddlib                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

## 问题
无法干净 delegate's agents, sonunda tüm içeriği bir anda yerleştirecek. ⇒ gardail olmayan ajanlar PII teslim edecek, politika ihlal eden çıkışlar, ya da sonsuza dek döngü.

## 概念
### Beş ilk

1. **Agent.**LLM + talimatlar + araçlar + el ele alınmalar。
2. **Handoff.**Delege  give another agent ∙∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙`transfer_to_<agent_name>`- Evet.
3. **Guardrail.**Giriş için (sadece ilk ajan) ‧output için (sadece son ajan) veya araç çağrısı için (her fonksiyon aracı için) geçerliliği gerçekleştirmek için
4. **Session.**跨 turns 的自动对话历史──
5. **Tracing.**LLM nesilleri, araç çağrıları, yardımları, koruyucuların içerikli alanları.

### Kullanımlı aletler

Modeller listesi içinde göreceğiz.`transfer_to_billing_agent`❖ İndirme zamanı için kullanılır 发出信号:

1. 复制 sohbet bağlamı(or `nest_handoff_history`Beta çöküşünü başaracak.
2. Uygulama hedef ajanı talimatları
3. Hedef ajanı koşmaya devam et.

İşte bu, ürün değişiminin yönetici örneği.

### Koruma rayları

Üç çeşit:

- **Input guardrails.**İlk ajanın girişleri, başvuruları ve uygulamaları.
- **Output guardrails.**Son ajanın çıkışı, işlevleri, PII sızıntıları, politika ihlalleri, yanlış cevaplar yakalamak.
- **Tool guardrails.**按函数-tool 运行──Argumentleri doğrulayın、 kontrol yetkileri、 denetim yürütülmesi──

Mod:

- **Parallel**(默认) ――Guardrail LLM ile main LLM 同时运行。更低尾延迟。如果触发,main LLM 的工作会被丢弃(浪费代币)。
- **Blocking**(`run_in_parallel=False`*Gardrail LLM Önceden yürürlükte * Eğer başlatılırsa, ana arama olmaz.

Üç tel bir arada bırakılır .`InputGuardrailTripwireTriggered`- Ne ?`OutputGuardrailTripwireTriggered`- Evet.

### İzleme

Her LLM nesli, araç çağrısı, yardım ve koruma bir süre yayınlar.`OPENAI_AGENTS_DISABLE_TRACING=1`Çıkış yapacağım.`add_trace_processor(processor)`Bu yayını kendi arka uçlarına gönderecek ve aynı zamanda OpenAI'nin arka uçlarına gönderecek.

### Sessiyonlar

`Session`Sözleşme geçmişini 存储在后端 中(SQLite、Redis、自定义)`Runner.run(agent, input, session=session)`Ben de yükleniyorum.

### Bu yol kolayca yanlış bir yerde

- **Handoff drift.**A.A. A.A.B.A.A.B.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.
- **Guardrail bypass.**Araç koruma çubuğu sadece fonksiyon araçlarında; içeride yerleştirilmiş araçlar (file reader, web getirmek) tek bir politika gerektirir.
- **Over-tracing.**İçerikleri içeren içerikler: ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒  ⇒ ⇒ ⇒   ⇒ ⇒      ⇒    ⇒                                                                                                                                                                                                                                            


```figure
ae-agent-handoff
```

## Yapın onu.
`code/main.py`SDK biçimi gerçekleştirildi:

- `Agent`- Evet.`FunctionTool`- Evet.`Handoff`(Böyükle aktarım 语义'nin fonksiyon aracı olarak)
- 带 input/output/tool guardrails、handoff dispatch 和 hop counter 的 `Runner`- Evet.
- Bir basit uzayış emiten, izleri göstermek için kullanılır 形状。
- Bir triage ajanı, kullanıcı sorusuna göre, bir giriş üzerinde tutuluyor.

运行:

```
python3 code/main.py
```

Trace  iki başarılı teslimat gösterdi ∞ bir giriş koruma yolculuğu, ve ∞ gerçek SDK ile içerik oranında yayımlayan bir tarama ağacı ∞

## Kullan
- **OpenAI Agents SDK**OpenAI-first ürünleri için kullanılmıştır.
- **Claude Agent SDK**(Deneyim 17) Claude-first ürünleri için kullanılır.
- **LangGraph**(Deneyim 13) Açık bir durum ve kalıcı bir öykü için kullanmak için.
- **Custom**Bu durum, sesli, çoklu sağlayıcı, federasyonlu dağıtımlar için çok önemlidir.

## - Söyle.
`outputs/skill-agents-sdk-scaffold.md`Eklentiler SDK uygulaması, triage ajanı, yardım, giriş/çıkanış/alet koruma çubuğu, oturum mağazası ve izleme işlemcisi içerir.

## 练习
1. 添加 hand-off hop counter: N 次 后拒绝;; 后拒绝;; 后拒绝;; 后拒绝;; 后拒绝;; 后拒绝;; 后拒绝;; 后拒绝;; 后拒绝;; 后拒绝;; 后拒绝;; 后拒绝;; 后拒绝;; 后拒绝;; 后拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒拒
2. - Ben de .`nest_handoff_history`实现为一个选项:在转前将 önceki mesajlar çökmek 成一个总结──
3. 编写一个阻断输出 guardrail──比较会触发它的提示与通过提示的延迟──
4. - Ben de .`add_trace_processor`JSON logger'e bağlanıyor. Her uzaya ne biçim veriyor?
5. SDK dosyalarını okuyun. Oyuncak portunuzu çıkaracağım.`openai-agents-python`Hangi yerlerde yapıyorsunuz?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent | "LLM + instructions" | SDK 中的 Agent type；拥有 tools 和 handoffs |
| Handoff | "Transfer" | 模型调用以 delegate 给另一个 agent 的 tool |
| Guardrail | "Policy check" | 对 input / output / tool invocation 的 validation |
| Tripwire | "Guardrail trip" | guardrail 拒绝时抛出的 exception |
| Session | "History store" | runs 之间持久化的 conversation memory |
| Tracing | "Spans" | 覆盖 LLM + tool + handoff + guardrail 的内置 observability |
| Blocking guardrail | "Sequential check" | Guardrail 先运行；trip 时不浪费 Token |
| Parallel guardrail | "Concurrent check" | Guardrail 同时运行；latency 更低，trip 时浪费 Token |

## 延伸阅读
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) ilkeler,  koruyucu,  izleme
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) Claude 风格'ın eşyaları
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)Ne zaman gerçekten elveriler kullanmalı ?
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) Ajanlar SDK 映射到的标准
