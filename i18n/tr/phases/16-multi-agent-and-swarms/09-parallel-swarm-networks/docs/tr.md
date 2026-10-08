# Paralel / Swarm / Ağlı Arsitekler

> LangGraph 明确支持面向去中心化、动态环境的"Swarm Architecture"――Matrix (arXiv:2511.21686) 将控制流和数据流 都表示为通过分布式排列传递的串流消息,以消除乐队员 瓶──权衡很明确:用确定性和可追溯性改变可扩展性──Swarm 适合包含许多独立子任务;不适合需要单连贯计划的任务──

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`, `queue`)
**前置要求：**16 · 05 aşaması (Negeri Şekil), 16 · 04 aşaması (İlk model)
**Time:** ~75 minutes

## 问题
Gözetmen, birkaç işçiye kadar genişleyebilir. Bu birkaç yüz kişiye kadar. Gözetmen kendiliğinden bir şişe haline gelir.

Swarm mimarileri bu tasarımı değiştirdi. Bu tasarımın gerçekleşmesi merkezi planlayıcı tarafından değil, işçiler tarafından paylaşılan kuyruklar arasında elde edilen çalışmalarla gerçekleşmiştir.

## 概念
### Şekil

```
                ┌──── shared queue ────┐
                │                      │
       ┌────────┼────────┐  ◄──────┬───┘
       ▼        ▼        ▼         │
     Worker  Worker  Worker   Worker
      A       B       C        D
       │        │        │         │
       └────────┴────────┴─────────┘
                 │
                 ▼
            results pool
```

没有管弦乐器──每个工人 反复执行:拉取一个任务,处理,写入结果(并可选地排列后续)──

### Bir sürü uyum sağladığında

- **许多独立 tasks。**Çıkarma, dönüşüm, sınıflandırma. Görevler birbirine bağlı değildir.
- **可变时长的工作。**Eğer bazı görevler 100 ms gerektirirse, diğerleri 10 ms gerektirirse, sürüm otomatik olarak yükü dengeleyecek.
- **Throughput 优先于 determinism。**Senin için önemli olan, zorlu bir sipariş değil, tam tamamlama süresi.

### # Bir sürü düştüğünde #

- **有序 workflows。**Eğer 3 adım 2'nin çıkışını gerektiriyorsa, bir sürü 3 adım 2'nin tamamlanmasını sağlayabilir.
- **Global-plan tasks。**复杂 araştırma soruları 受益于规划者──一个研究群 会产出独立事实,而不是连贯报告──
- **Debugging。**没有中央日志 且工作 异步时,复现 bug 成本很高──

### Matrix (arXiv:2511.21686)

Matrix 2025'te bir makaledir, bu bir sürüm olacak  yön doğaya sonuç: kontrol akışı ve veri akışı dağıtılmış kuyruklarda üst sıralama mesajlardadır。 merkezi koordinatör yok。 Mesaj dayanıklılığından kaynaklanan hata toleransı。 ölçeklendirme sistemi değil mesaj aracı sorunudur。

贡献: Bir çok ajan koordinasyonu olan bir programlama modeli bu ajan hangi mesaj konuyu okuyor? , yerine supervisor 

### LangGraph ' in Swarm Arsitekturası

LangGraph 2025 docs 明确将 "Swarm Architecture" 描述为多代理模式 之一:agents are nodes, but edges 形成带周期的导向图,并且任何 node 都可以从池中被激活──Worker 根据条件从可用工作中选择,而不是由监督员分配指派──

### Başarısızlık modusu: açlık ve sıcak noktalama

Eğer tüm işçiler en hızlı görevi alırsa, uzun süreli görevler sadece kalanları alır.

Yumuşak başlılık:
- 带显式老龄化的优先排列 (Priority queues) 随着等待时间 提高优先) 。
- İşçi uzmanlığı: Bazı işçiler sadece "uzun" görevler alır.
- Geri basınç: sıraya girme sınırlaması hızlı görevler sayı¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

### İçeriğe dayalı yönlendirme bağlantısı

Swarm ve içerik tabanlı yönlendirme ((Lection 22) doğal配对── genel kuyruk kullanmayın, her mesaj tipi için bir kuyruk hazırlayın── Uzman işçiler sadece kendi tiplerini abone etsin──bu binlerce ajanın mesaj otobüs mimarisi temelini oluşturur──


```figure
sw-work-stealing
```

## Yapın onu.
`code/main.py`4 işçi ipinden oluşan bir sürüm gerçekleştirmek, paylaşmak için.`queue.Queue`中拉取任务──Task 具有可变的持续时间──有些快,有些慢──该演示对比:

- **Sequential baseline:**Bir işçi tüm görevleri halleder.
- **Fixed assignment:**Her görev önceden belirli bir işçiye verilir.
- **Swarm:**İşçiler, paylaşılan kuyruktan çekiliyorlar.

Swarm otomatik olarak yükü dengeleyecek; sabit görev, belirli bir görevde olacaktır 很慢时让快工 置──

Çık:

```
python3 code/main.py
```

Üretim 会 gösterir her işçinin görev sayıları(swarm 分布不均但最优)

## Kullan
`outputs/skill-swarm-fit.md`评估一个任务 应该使用群 还是监管者──Inputs:task independence、duration variance、ordering requirements、debugability needs── görev bağımsızlığı、durun değişimi、sortlama gereksinimleri、debugability needs──

## - Söyle.
Kontrol listesini:

- **带 aging 的 Priority queue。** uzun süreli açlık önlenmesi
- **Worker idempotency。**Eğer işçi ortalama bir çöküşte ise bir görev daha fazla sürüklenebilir.
- **Durable queue。**生产环境使用 Kafka、Redis Streams veya veritabanı desteklenen kuyruk`queue.Queue`Sadece kayıtta.
- **每个 task 的 observability。**Her görevde bir iz kimliği vardır. Her işçi baş ve son kayıtlarını kullanır.
- **Back-pressure。**Eğer kuyruk hızla büyüyse işçilerin hızını azalttığında üreticinin hızını azalttır.

## 练习
1. 运行  İşlem`code/main.py`❖ Değişken süresi iş yükünde , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,                                                                                              
2. 添加一个优先队列变体(使用 `queue.PriorityQueue`)── görevin "önem" alanı, önceliği bölünmüştür──── observer in continuous load 下 low-priority tasks
3. 实现一个热点检测器:当任何工人 处理的任务 数量达到最慢工的 3× 时记录日志――Bu görev-duruncu dağılımını açıklıyor 存在什么情况?
4. 阅读Matrix paper (arXiv:2511.21686) 摘要 和 Section 3──识别Matrix 接受一个具体交易(scalability gain) 以及它放弃一个交易(追踪性、确定性) ‖
5. 将 swarm demo 改为使用由 (task_type, payload) tuples 组成的 `queue.Queue`İşçiler sadece belirli türleri abone eder. Görevler yapılırken, hangi yönlendirme kuralları mantıklıdır?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Swarm architecture | "Decentralized agents" | Workers 从 shared queue 中拉取；没有 central orchestrator。 |
| Event bus | "Agents subscribe to topics" | 按 type 或 content 将 tasks 路由给 workers 的 message broker。 |
| Starvation | "Task never runs" | 因为 higher-priority work 持续到达，low-priority task 永远不会被选中。 |
| Hot-spotting | "One worker drowns" | 一个 worker 获得大多数 tasks 的 load imbalance。 |
| Back-pressure | "Slow down the producer" | 当 queue 填满时，向 upstream 发出停止生产信号的 mechanism。 |
| Idempotent worker | "Safe to re-run" | 一个 task 被处理两次会产生相同 result。因为 workers 可能在 mid-run 崩溃，所以这是必需的。 |
| Durable queue | "Survives crashes" | 由 disk 或 replicated storage 支持的 queue；worker 崩溃时 tasks 不会丢失。 |
| Matrix framework | "Full message-passing swarm" | Data 和 control flow 都是在 distributed queues 上的 serialized messages。 |

## 延伸阅读
- [LangGraph workflows and agents — Swarm Architecture](https://docs.langchain.com/oss/python/langgraph/workflows-agents) 明确支持群
- [Matrix — A Decentralized Framework for Multi-Agent Systems](https://arxiv.org/abs/2511.21686) 完整 mesaj geçirme sürüsü
- [Anthropic engineering — why supervisor not swarm in Research](https://www.anthropic.com/engineering/multi-agent-research-system) Neden bir özel üretim sistemi belirten bir denetçi seçin ve bir sürü değil
- [AutoGen v0.4 actor-model docs](https://microsoft.github.io/autogen/stable/) olay yönlendirilmiş aktör yeniden yaz,比 v0.2 的 GroupChat 更接近群
