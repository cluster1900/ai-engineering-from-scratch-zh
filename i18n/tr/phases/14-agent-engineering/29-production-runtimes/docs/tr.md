# Üretim Süreleri:Sırı,Event,Cron

> Üretim ajanı 运行在六种运行时形 上:request-response、streaming、durable execution、queue-based background、event-driven 和 scheduled──先选择形,再选择 framework──Observability 在每种形中都是承载──

**类型：**Öğrenme
**语言：**Python (stdlib)
**先修要求：**14 · 13 aşaması (Langgraf), 14 · 22 aşaması (Sessiz)
**时间：**~ 60 dakika

## Öğrenme hedefi

- 6 çeşit üretim çalışma şekli belirtilir, her biri bir çerçeve / ürün kalıbına uyum sağlayacak.
- 解释为什么长远任务的长远执行 (LangGraph) 很重要──
- 描述事件驱动运行时间,以及 Claude Managed Agents 适用场景──
- 解释多步骤代理 中可观性-as-load-bearing 这一说法──

## 问题

Üretim ajanının başarısızlığı biçimi,  Jupyter not defteri 暴露不出的:第 37 步出现网络时out,用户在语音调中 挂断,cron job在机重启时死亡,背景工人内存耗尽;;运行时间形决定哪些失败是可恢复的;;

## 概念

### İstek- yanıt

- Sinkron HTTP── kullanıcı bekliyor tamamlanmak──
- Sadece kısa görevler için uygundur.
- 技术:Agno (Python + FastAPI)、Mastra (TypeScript + Express/Hono/Fastify/Koa)。
- Gözlem: standart HTTP erişim log + OTel uzantısı。

### Akış

- SSE veya WebSocket kullanılarak  ilerici çıkış yapılır.
- LiveKit, ses/video için WebRTC'ye genişletilecektir.
- Stack: herhangi bir akış desteği çerçevesini + SSE/WS ön ucunu 能处理──
- Gözlem: Her parça zaman tüketimi, ilk işaret gecikmesi, kuyruğun gecikmesi.

### Sürekli çalıştırma

- Her adımdan sonra kontrol noktası durumu; başarısız olduğunda otomatik olarak geri kazanılmak.
- AutoGen v0.4 oyuncu modeli, tek bir ajanla ayrılıp başarısız olacak.
- LangGraph'ın çekirdek farkı: Ders 13.
- Adım sayımı bilinmeyen ve kurtarma maliyeti çok yüksek, bu çok gerekli.

### Sırada / arka planda

- İş  sıraya girmek, işçi 拉取执行, sonuç webhook veya pub/sub 回流
- Uzun vadede çalışan ajanlar için her görev için birkaç yüz adım vardır.
- Stack:Celery (Python)、BullMQ (Node)、SQS + Lambda (AWS)、custom。
- Gözlem: kuyruğun derinliği, her işin gecikme dağılımı, DLQ boyutu,

### Olaylara dayalı

- Ajan 订阅 tetikleyici: yeni e-posta, PR açıldı, cron ateş.
- Claude Yönetim Ajanları 开箱即支持这一点 (Deneyim 17)
- CrewAI Akışları (Disim 15) olaylara dayalı belirleyici iş akışını organize etmek için kullanılır.
- Gözlem: tetikleme kaynağı, olay-başlatma gecikmesi, ajan gecikmesi.

### Programlı

- 周期性运行的 cron şeklinde ajanı¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- Sürekli çalıştırma ile birlikte, bu şekilde başarısız gece çalıştırma bir sonraki seferinde geri kazanılabilir.
- 技术:Kubernetes CronJob + kalıcı çerçeve;托管方案(Render cron、Vercel cron)

### 2026 dağıtım modeli

- **CrewAI Flows**Olaylara dayalı üretim için kullanılıyor.
- **Agno**Devleti olmayan FastAPI Python mikroservisi kullanıyor.
- **Mastra**Server adaptörü(Express、Hono、Fastify、Koa) yerleştirme için kullanılır。
- **Pipecat Cloud / LiveKit Cloud**Yönetilen sesle.
- **Claude Managed Agents**Uzun süreli asinkronlama için kullanılıyor.

### Gözlemsellik yük taşıyıcıdır

Eğer OpenTelemetry GenAI uzaması yoksa (Desin 23) ve Langfuse/Phoenix/Opik arka planı yoksa (Desin 24) bu, üretim için seçilebilir bir şey değil. Bu, 快速 debug'da olduğunuzu,  top tekrarlamayı ve  logging                                                                                                                                                                                                                             

### Üretim süresi 失败的位置

- **选错 shape。**Bir 5 dakika görev seçmek isteği- cevabı, kullanıcı bağlantısı, işçi birikimi, geri dönüş,
- **没有 DLQ。**Sıradaki işçi yok. Başaramadık.
- **不透明的 background work。**Arka planlı ajan 运行时不导出追踪――直到用户报告问题之前,失败都是不可见的――
- **跳过 durable state。**30 saniye geçse de, tekrar başlatmayı bile kaldıramazsın. Sürekli çalıştırma gerekir.


```figure
wb-runtime-shapes
```

## Yapın onu.

`code/main.py`Bu bir stdlib çok şekilli demo:

- İstek- yanıt son noktası(普通函数)。
- Akış yöneticisi (Generator)
- DLQ'ın kuyruklu çalışanı
- Olay tetikleyici kayıtı.
- Cron şeklinde programlayıcı

运行:

```bash
python3 code/main.py
```

输出:五条 痕迹,展示 the same task 在每种形 下的行为──同一套代理逻辑,不同外层 shell──可持续执行──第六种形) 已有意放在课13 中通过LangGraph 讲解──

## Kullan

- **Request-response**Çat tarzında kullanılıyor.
- **Streaming**Devamlı bir tepki kullanıyor.
- **Durable**Uzun vadede bir görev için kullanılıyor.
- **Queue**İle / Async / uzun süreli kullanılır.
- **Event**Ajanın reaktifliği için kullanılıyor.
- **Cron**Ev temizliği için kullanılır (memory consolidation,evall,cost report)

## Yayınla

`outputs/skill-runtime-shape.md`Bir görevi için  runtime şeklini seçin,并连接可观性要求──

## 练习

1. Dersinizi 1'den sonra tekrar yapın. Ürün yüzeyinde hangi şekil uygundur?
2. 给排列式演示 添加 DLQ──模拟10% iş başarısızlığı;暴露 DLQ boyutu──
3. 编写一个 cron-triggered eval agent,每晚针对当天的前20 运行.
4. 实现带压力的流: eğer müşteri 很慢,就暂停代理── bu nasıl bir devre bütçesi 交互?
5. Claude Yönetim Ajansları doktorları... ne zaman kendi kendine konutlanmış uzun vadeden ajanı yönetime taşıyacaksın?

## 关键术语

| 术语 | 人们怎么说 | 实际含义 |
|------|------------|----------|
| Request-response | “Synchronous” | 用户等待；只适合短任务 |
| Streaming | “SSE / WS” | Progressive output；更好的 UX；每个 chunk 的 latency 可观察 |
| Durable execution | “Resume from failure” | Checkpointed state；从最后一步 restart |
| Queue-based | “Background jobs” | Producer / worker pool / DLQ |
| Event-driven | “Trigger-based” | Agent 对 external event 作出反应 |
| DLQ | “Dead-letter queue” | 失败 job 的停车场 |
| Claude Managed Agents | “Hosted harness” | Anthropic-hosted long-running async，带 caching + compaction |

## 延伸阅读

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) dayanıklı yürütme 细节
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) 托管的长期异步
- [Anthropic, Introducing computer use](https://www.anthropic.com/news/3-5-models-and-computer-use)  her görev 几十到几百步
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) Aktör model hata izolyasyonu
