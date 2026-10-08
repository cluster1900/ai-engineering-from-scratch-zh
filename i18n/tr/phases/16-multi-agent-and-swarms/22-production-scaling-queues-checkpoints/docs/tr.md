# 生产扩展  队列、Checkpoints、Durability

> Çoklu ajan sistemlerini binlerce işletmeye yaymak için ihtiyaç var.**durable execution**◊ LangGraph'in çalıştırma süresi 会在每一个超级步骤后写入一个由 `thread_id`标识的检查点(默认使用 Postgres);workers 崩会释租,另一个工会接手恢复──Agentler sonsuz bir süre için休眠, waiting for artificial input──**MegaAgent**(arXiv:2408.09955) 运行一个按代理 划分的生产者消费者队列,包含三种状态 (Ideal / Processing / Response) 和两层协调 (组内聊天 +组间管理聊天)**Fiber/async**优于线程-per-jobs:threads 99% of the time都在空等待令牌,而纤维会在I/O 上协作式让出――反方观点:Ashpreet Bedi'nin "Scaling Agent Software" 主张在载证明需要之前使用**FastAPI + Postgres + nothing else**Bu ders, beklenenden daha uzun bir kontrol noktası logı oluşturur, bir ajan başına durum değişikliği iş kuyrukları oluşturur, bir asynk-vs-iç demosu oluşturur ve basit başlama kurallarından gerçekçi bir şekilde yapılır.

**Type:** Learn + Build
**Languages:** Python (stdlib, `asyncio`, `sqlite3`)
**前置要求：**16 · 09 aşaması (Parallel Swarm Networks), 16 · 13 aşaması (Paylaşılan hafıza)
**Time:** ~75 minutes

## 问题

Bir prototip çoklu ajan sistemi bir dizüstü bilgisayarda üç ajanla ve bir hafıza olay döngüsü ile 能正常工作──你把它迁移到生产环境:

- Ajanlar bazen birkaç saat çalışırlar.
- İşçi süreçleri 会崩──重启会失失状态──
- En yüksek yük ortalama yükün 10 katıdır; seviyelerin genişlemesi gerekir.
- User per agent-run 付费; You need to use the exact-once semantics of bilge fee.

hafıza olay döngüsü  bunları işlemeyi mümkün değil.

1. 带 checkpoint 带 checkpoint ⋅ Time Time ⋅ LongGraph Runtime
2. 带 devlet mağazası さんの mesaj kuyrukları(Postgres + SQS/RabbitMQ)
3. Aktör-Model Çerçevreları (MegaAgent'in)
4. Handeks FastAPI + Postgres(Bedi'nin görüşü)。

Bu ders her programın küçük bir versiyonunu oluşturur.

## 概念

### Sürekli işlev, bu model

Sürdürülebilir-öğütleme motor 会在每一个"步骤" (LangGraph 术语中的超级步骤) 后持久化完整程序状态──崩时:

```
worker crashes mid-step
  -> lease timeout
  -> another worker picks up the thread_id
  -> resumes from last checkpoint
  -> no duplicate side effects
```

Çalışması için, bunu yapmalısın:

- **Serializable state。**Tüm ajan devletleri kalıcı hale getirilmelidir. Gerçek zamanlı veritabanı bağlantılarının işlev kapanması sağ kalmaz.
- **Deterministic resume。**Aynı durum ve aynı girişleri belirleyen, ajan aynı eylemleri üretir veya LLM çağrılarını dış belirleyici orakel'e vermiştir.
- **Idempotent side effects。**Dış çağrılar (örnek çağrıları, ödeme) idempotent olmalıdır veya kopyalanma anahtarı kullanmalıdır.

LangGraph 在每个超级步骤后写检查点;Temporal 在每个活动后写;Restate 使用事件来源的期刊──三者实现的是同一个模式──

### LangGraph'in çalıştırma süresi

Her ajanın bir tane var .`thread_id`;stat is typed dict; her super-step 都向检查点表 写入一行──恢复时,runtime 从最后一个检查点 继续,而不是从头开始──Agent 可以`interrupt()`İsteğe girme zamanı gelince, herhangi bir işçi geri dönebilir.

Bu 2026 Nisan'ın bir referans üretim tasarımı.

### MegaAgent'in bir ajan başına sırası

arXiv:2408.09955  Bir ölçek deneyi tanımlıyor: bir küme içinde binlerce并发代理 var.

```
agent i:
  state ∈ {Idle, Processing, Response}
  in_queue   <- messages addressed to agent i
  out_queue  -> replies + side effects

coordinators:
  intra-group chat  (agents in the same group)
  inter-group admin chat  (high-level routing)
```

İki katlı koordinasyon, grup içi konuşmayı yüksek yoğunlukla gerçekleştirmesine izin verirken grup içi nadirliği korur.

### Async vs. iş başına ip

LLM çağrıları I/O bağlanmıştır. Sonraki bir token düğmesine beklemek için %99'da boşluk vardır. Her bir düğüm yaklaşık 1 MB RAM tüketir. 10.000'de yapılan çağrılarda, ışık yığıntıları 10 GB'ye ihtiyaç duyar.

Fiber (Python)`asyncio`、Goru rutinleri 、Rust `tokio`) I/O 上协作式让出. Aynı şekilde 10.000 arama kolayca bir sürece yerleştirilebilir.

Örnek:CPU- bağlı post-processing (eğleme, tokenizer teknikler) hala ipler veya işlemler gerektirir.

### Bedi'nin karşı görüşü

"Skaling Agentic Software" (Ashpreet Bedi, 2026) çoğu ekip ölçüm yüklenmeden önce aşırı olarak işlenmiş olduğunu düşünüyor.

- FastAPI + Postgress。
- Her ajanın çalışması yapılır.
- - Evet .`pg_notify`Ya da basitçe seleri işçisi  arka plan işleri yapmak 
- Uygulama kodunda yeniden deneme politikasını gerçekleştirmek

Bu, genellikle yeterli. Başarısız olduğunda yeniden yükseltmeyi beklersiniz.

Kurallar şunlardır: basit yapıların çözemeyeceği belirli sorunlarla karşılaştığınızda, dayanıklı yürütme çerçevelerini yeniden kullanın.

### Tam bir kez semantik

Ödeme ajanı çalışması için, "bir kere tam olarak etkili" (en az bir kez teslimat + idempotent tüketicisi)

- **每个 run 一个 dedup key。**Her yan etkisi çağrısı içerir.
- **Outbox pattern。**Yan etkiler önce bir tabloya yazılsın, sonra bağımsız bir süreç tarafından gerçekleştirilsin.
- **Compensating transactions。**Yan etkisi başarısız olduğunda, izleme yazısı başarısız olduğunda, telafi işlemini düzenleyin.

Bunlar veritabanı mühendisliği modelleri, LLM-süsusi değillerdir. LLM vergisi sadece LLM çağrılarına bağlıdır.

### Gökkuşağı dağıtımı

Anthropic'in çoklu ajan araştırma sistemi "hemirboyu dağıtımları" kullanıyor: Multiple agent runtime 版本并发运行, böylece uzun süre çalışan ajanlar 始终在每次代码部署时被杀了──对一小部分流量 kanary 新版本;当旧版本的代理人 结束后再淘汰旧版本──

Bu uzun süreli devletli sistemlerin standart uygulamasıdır; 2026 yılının uygun noktası ajanların birkaç saat hayatta kalabilmeleri içindir, bu nedenle dağıtım döngüleri 兼容 olmalıdır.

### 典型生产 kontrol listesini

- Kalıcı durum ((checkpoint、snapshots, veya outbox + playable log)
- İdempotent yan etkileri:
- LLM çağrılarının async I/O katmanı kullanıyor.
- En az bir kez teslimat edilmesi için.
- 面向 stateful workloads of rainbow/canary deployment──
- Gözlemsellik: ajan başına izler, süper aşama denetimi, geri dönüş hesaplaması.


```figure
sw-checkpoint-replay
```

## Yapın onu.

`code/main.py`实现了:

- `CheckpointStore` SQLite desteklenen kontrol noktası günlüğü, kullanın thread-id anahtarları。 her süper adım 追加一行。
- `run_with_checkpoint(agent, thread_id)` 模拟中期崩; ikinci işçi son kontrol noktasından 恢复。
- `AgentQueue` Bir ajanı başına İzle / İşleme / Cevaplama durum makinesi, küçük bir iş kuyruklu olarak
- `demo_async_vs_threads()` 通過無同化 和 运行 500 个并发模拟 "LLM aramaları"; rapor duvar saati 和 峰值 bellek(近似) 』

运行:

```
python3 code/main.py
```

预期输出:模拟崩后检查点再启动 成功;async versiyonu 在 < 1s 内处理 500 个并发电话;thread versiyonu 需要几秒,并且每个并发单元使用的内存 高出数量级;;

## Kullan

`outputs/skill-scaling-advisor.md`会根据负载、状态-retention 需求和部署 频率,建议持久执行 选择:FastAPI + Postgres、LangGraph runtime、Temporal 或 custom。

## Yayınla

典型生产加固:

- **从简单开始（Bedi 的规则）。**FastAPI + Postgres kullan, başarısız olana kadar.
- **在优化之前 instrument everything。**Çözümlü gecikme histogramı, adımlık zaman, geri dönüş sayımı, başarısızlık kategorisasyonu.
- **为 side effects 使用 outbox pattern。**Özellikle ödeme ve dış API çağrıları.
- **Rainbow deploys。**Uçuş sırasında ajanı öldürmeyin.
- **当你遇到具体问题时采用 durable-execution engines（Temporal / LangGraph / Restate）：**Bir saatlik insanlık beklentisi, bölge çapındaki koordinasyon, karmaşık geri deney/karşılama politikaları.
- **I/O layer 使用 async。**İpuçlar sadece CPU'ya bağlı sonrası işleme için kullanılır.

## 练习

1. 运行  İşlem`code/main.py` Kontrol noktası devamını onaylayın 生效;测量 async vs thread concurrency 差异──
2. 实现一个 **outbox**Tablo: Her araç çağrısı Önceden yazılır, sonra da tek başına yapılan bir rutin/işle gerçekleştirilmektedir.
3. 模拟一个 **rainbow deploy**İki sürüm sürümü: iki sürüm sürümü; yarı yeni thread_ids 路由到各自版本; eski sürümdeki uçuş içi threadsın kesinleşmesini onaylamak
4. 阅读下面链接中的 LangGraph runtime doc──识别 runtime 中哪些功能在手写FastAPI + Postgres 版本中最耗耗时间──这是采用的理由,还是可以延迟吗?
5. 阅读MegaAgent (arXiv:2408.09955) Bölüm 3──两层协调(intra-group + intergroup admin chat) is显式的──画出你会将它映射到带两类队列家庭的消息队列──

## 关键术语

| Term | 人们的说法 | 它实际的含义 |
|------|----------------|------------------------|
| Durable execution | "Persist the program state" | Engine 在每个 super-step 后写入 state；crash recovery 是 deterministic 的。 |
| Super-step | "Transactional boundary" | Checkpoints 之间的 work unit。LangGraph 术语。 |
| thread_id | "Agent run identifier" | 绑定 checkpoints 和 resume logic 的 key。 |
| Idempotency | "Safe to retry" | 重复一个 side effect 产生的结果与一次尝试相同。 |
| Outbox pattern | "Decouple side effects" | 将 intent 写入 table；独立 executor 执行并标记完成。 |
| At-least-once delivery | "Possible duplicates" | Message queue semantics；dedup key 让 consumer 达到 effective-once。 |
| Rainbow deploy | "Overlapping versions" | 长时间运行 workloads 期间多个 runtime versions 并发存在。 |
| Async fiber | "Cooperative yielding" | User-mode concurrency；对于 I/O-bound loads，相比 threads 成本很低。 |
| Checkpoint | "State snapshot" | super-step 边界处的 serialized state；是 resume 的 key。 |

## 延伸阅读

- [LangChain — The runtime behind production deep agents](https://www.langchain.com/conceptual-guides/runtime-behind-production-deep-agents) LangGraph çalıştırma süresi tasarımı
- [MegaAgent](https://arxiv.org/abs/2408.09955) Üreticilere göre üreticiler- tüketiciler sırası; binlerce并发iciler
- [Matrix](https://arxiv.org/abs/2511.21686) Mesaj kuyruklarını kullanmak 作为协调基板的分散框架
- [Temporal docs](https://docs.temporal.io/) dayanıklı yürütme  Reference workflow engine
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) Gökkuşağı dağıtımında üretim deneyimi dahil
