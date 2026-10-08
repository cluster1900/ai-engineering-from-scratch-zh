# AutoGen v0.4:Actor Model ve Agent Framework

> AutoGen v0.4 (Microsoft Research, 2025 yıl 1 月) oyuncu modeli 重新设计了代理配套──Async mesaj değişimi、event-driven agents、defect isolation、自然并发── bu çerçeve şimdi bakım modunda, Microsoft Agent Framework (Microsoft Agent Framework, 2025 yıl 10 月 kamu ön gösterisi) ise onun ardıcıdır.

**类型：**Öğrenim + yapı
**语言：**Python (stdlib)
**先修：**Fase 14 · 01 (Ajans Çapı), Fase 14 · 12 (İş akışı kalıpları)
**时间：**75 dakika kadar .

## Öğrenme hedefi

- 描述 actor model:agent 作为演员,信息是唯一的IPC,每个演员 独立隔离故障──
- AutoGen v0.4'in üç API seviyesini açıklayın:Core,AgentChat,Ekstensiyonlar ve kendi kullanımları.
- 解会 neden mesaj teslimatı ile işleme 解会 解会 neden hata izolesiyon getirir 和自然并发──
- Python'da bir stdlib aktör çalıştırma zamanını gerçekleştirmek için, bir çift ajan kod değerlendirmesi akışı 移植到其上──

## 问题

Büyük çoğunluk ajan çerçevesinin hepsi aynıdır: bir ajan  içerik üretir, bir ajan  tüketir içerik, bir çağrı yığınında çalışır.

AutoGen v0.4'in cevabı: aktör modeli. Her ajan özel bir e-posta kutusu olan bir aktördür. Mesaj, tek iletişim yöntemidir.

## 概念

### Oyuncular

Bir aktör 拥有:

- Private有 state ( dışı asla doğrudan temas edemez)
- Bir posta kutusu (Message queue)
- Bir yöneticisi:`receive(message) -> effects`, bu etkiler arasında reply

İki oyuncu hafızayı paylaşamaz. Sadece mesaj gönderebilirler.

### AutoGen v0.4 中的三个API层

1. **Core.**Alt seviyedeki aktörler çerçevesinde.`AgentRuntime`- Evet.`Agent`- Evet.`Message`- Evet.`Topic`❖ Eşzamanlı mesaj değişimi,evet yönlendirilir。
2. **AgentChat.**面向任务的高层API (altı seviye API) `AssistantAgent`- Evet.`UserProxyAgent`- Evet.`RoundRobinGroupChat`- Evet.`SelectorGroupChat`- Evet.
3. **Extensions.**集成:OpenAI、Anthropic、Azure、tools、memory。

### Neden çözmek çok önemli?

V0.2 modelinde,同步调用`agent_a.chat(agent_b)`A.B.A.A.A.A.A.B.A.B.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.A.`send(agent_b, msg)`Bu mesajı agent_b'nin posta kutusuna yerleştireceğim ve hemen geri döneceğim.

- **Fault isolation.**Ajan B 崩 崩 崩                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
- **自然并发。**Çok fazla mesaj aynı anda yolculukta olabilir.
- **面向分布式。**Aktris işlemi içinde ya da başka bir ev sahibi üzerinde olsun, posta kutusu + nakliye hepsi aynı bir çekim.

### 拓

- **RoundRobinGroupChat.**Ajanı sabit rotasyon sırası rotasyon gönderme
- **SelectorGroupChat.**Seçmen ajanı 選択下一位── konuşma bağlamına göre
- **Magentic-One.**Web tarama, kod çalıştırma, dosya yönetimi için kullanılmış referans çoklu ajan ekibi.

### Görüşme

内置支持 OpenTelemetry── her mesaj şehirler bir süre yayınlayacak; araç çağrı 2026 OTel GenAI semantik sözleşmelerine göre(Lection 23) taşı `gen_ai.*`Özellikler

### 状态: bakım modusu

2026 yılının başlarında:AutoGen v0.7.x araştırma ve prototipleme için ise sabit. Microsoft aktif gelişim sürecini Microsoft Agent Framework'e yönlendirdi.


```figure
actor-mailbox
```

## Yapın onu.

`code/main.py`实现一个 stdlib aktör çalıştırma zamanı:

- `Message`- Evet .`sender`- Evet.`recipient`- Evet.`topic`- Evet.`body`Çekilme yükü
- `Actor`- Evet .`receive(message, runtime)`- Evet.
- `Runtime`:带有共享 queue、delivery、defect isolation 的事件ループ──
- Bir iki oyuncu gösterisi:`ReviewerAgent`inceleme kodu,`ChecklistAgent`运行 kontrol listesine; konsensüze ulaşana kadar mesajları değiştirirler.

运行:

```
python3 code/main.py
```

Trace, bir aktörün mesaj teslimatını gösterir. Bir aktörün diğer aktörün başarısız olmasını ve ortak hüküm sürecini gösterir.

## Kullan

- **AutoGen v0.4/v0.7**(bitim):适合 araştırma, prototip üretim, çoklu ajanlı modeller
- **Microsoft Agent Framework**(ağcılık ön görünümü):未来路径;同样演员-模型 思想,刷新后的API。
- **LangGraph swarm topology**(Deneyim 13): Paylaşılan araçlar ile paylaşım yoluyla benzer bir örneği gerçekleştirmek.
- **Custom actor runtime**- Ne zaman? - Ne zaman?

## - Söyle.

`outputs/skill-actor-runtime.md`Bir tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane

## 练习

1. 添加死字队:当处理者 抛出异常时,把失败消息 停止放起来为人工检查―― DLC 多久会被打发一次?
2.  gerçekleştirmek `SelectorGroupChat`: Bir seçmen aktör 根据对话状态 选择谁处理下一条条消息。
3. 添加分布式运输:把 in-process queue 替换为 JSON-over-HTTP server,让演员可以运行在独立进程中──
4. "Hepsi mesajı bir OTel süresi içinde bırakın"`gen_ai.agent.name`- Evet.`gen_ai.operation.name`- Evet.
5. AutoGen v0.4'ün mimarlık yazısını okuyun. Oyuncaklarınızı gerçeklere taşıyın.`autogen_core`Üretimdeki önemli şeylerden hangisini atladın?

## 关键术语

| 术语 | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| Actor | "Agent" | 私有 state + inbox + handler；没有共享 memory |
| Message | "Event" | 类型化 payload；actor 交互的唯一方式 |
| Inbox | "Mailbox" | 每个 actor 的 pending message queue |
| Runtime | "Agent host" | 路由 message 并隔离失败的 event loop |
| Topic | "Channel" | actor 之间命名的 publish-subscribe route |
| Fault isolation | "Let it crash" | 一个 actor 失败不会让其他 actor 崩溃 |
| RoundRobinGroupChat | "固定轮转 team" | Agent 按顺序轮流行动 |
| SelectorGroupChat | "按 context 路由的 team" | Selector 选择下一位 |
| Magentic-One | "参考 team" | 用于 web + code + files 的 multi-agent squad |

## 延伸阅读

- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) yeniden tasarlama 文章
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) Grafik şeklinde alternatif
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) AutoGen 默认发射跨度
