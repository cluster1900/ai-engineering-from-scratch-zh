# Grup Çatı ve Konuşmacı Seçimi

> AutoGen GroupChat ve AG2 GroupChat arasında bir konuşma paylaşmak; bir seçmen  fonksiyonu (LLM、round-robin veya özel) seçmek; bir sonraki konuşmacı seçmek. Bu gelişen çoklu ajan konuşmalarının bir prototipi: ajanlar kendilerini statik grafikte rollerini bilmiyorlar, sadece paylaşım havuzuna tepki veriyorlar. AutoGen v0.2'nin GroupChat 语义 olarak AG2 çatalında kalmıştır; AutoGen v0.4 olay yönlendirilmiş aktör modeline yeniden yazılacak. Microsoft 2026'ın 2 ayında AutoGen 'yi sürdürme modeline koyacak, Semantic Kernel 'le birleşecek Microsoft Agent Framework'e 2026 yılının 2 ayına kadar.

**类型：**Öğrenim + yapı
**语言：**Python (stdlib)
**前置条件：**16 · 04 aşaması (İlk model)
**时间：**~ 60 dakika

## 问题

İş akışı 已知时,静态图表(LangGraph) çok kullanışlı。 Gerçek konuşma静态 değildir: bazen kodlayıcı eleştirmen sorar, bazen araştırmacı sorar, bazen yazar sorar。硬编码 Her türlü olası teslimat kenar yaratacaktır 爆──What you want is *agents to share pool make a reaction*,并由某函数决定下一个谁说话──

İşte bu, AutoGen GroupChat'ın yaptığı şey.

## 概念

### 形状

```
              ┌─── shared pool ────┐
              │   m1  m2  m3  ...  │
              └─────────┬──────────┘
                        │ (everyone reads all)
      ┌───────┬─────────┼─────────┬───────┐
      ▼       ▼         ▼         ▼       ▼
    Agent A  Agent B  Agent C  Agent D  Selector
                                           │
                                           ▼
                                  "next speaker = C"
```

Her ajan her mesajı görebilir. Her seferinde bir seçicisi seçmek için bir fonksiyon kullanır.

### Üç çeşit seçmen 风格

**Round-robin。**固定循环──确定性──按N 线性扩展,但会忽略上下文: Even话题是法律审查,coder也会获得轮次──

**LLM-selected。**调用一个LLM,它读取最近池内容并返回最合适的下文发言人──具有上下文感知能力,但速度慢:每轮都会增加一次LLM 调用──AutoGen'in默认方式──

**Custom。**Bir Python  işlevi, istediğiniz herhangi bir mantığı içerir.

### KonuşılabilirAgent API

```
agent = ConversableAgent(
    name="coder",
    system_message="You write Python.",
    llm_config={...},
)
chat = GroupChat(agents=[coder, reviewer, tester], messages=[])
manager = GroupChatManager(groupchat=chat, llm_config={...})
```

`GroupChatManager`持有选择者──当一个代理──完成一轮后,经理会调用选择者,选择者──返回下一个代理──循环持续到满足终止条件──

### Sonunda

Üç adet:

- **Max rounds。**Toplam döngü sayısı için sert bir sınır ayarlama.
- **"TERMINATE" token。**Ajanlar bir nöbetçi mesaj gönderebilir. Yöneticisi ortaya çıktığında durdurulur.
- **Goal-reached check。**Bir tane verifikatör her seferinde bir kez çalıştırılır ve sohbet 完成时停止──

### AutoGen → AG2 分裂, ve Microsoft Agent Framework 合并

2025 yılının başlarında, Microsoft, AutoGen'in etkinlik odaklı aktör modelini çevreleyerek büyük bir yeniden yazma yapmaya başladı.

2026 yılının 2 ayında Microsoft, AutoGen'in devamlı bir şekilde devam edeceğini açıkladı.**Microsoft Agent Framework**(RC 2026 年 2 月,现在已与语义内核合并) ――GroupChat 概念在两条路线中都保留下来;实现细节不同──对于兼容 v0.2 的代码,AG2 是首选上游──

### 什么时候适合 Grup Çat

- **Emergent conversations。**Önceden her olası konuşmacıyla bağlantı kurmak istemiyorsun.
- **角色混合任务。**Kodlayıcı soruyor araştırmacı soruyor arşivci soruyor arşivci tekrar soruyor kodlayıcı soruyor
- **探索式问题解决。**头脑风暴会议, 流水线 değil 

### Ne zaman başarısız olacağım ?

- **严格确定性。**LLM seçeneği, aynı sürede, farklı çalışmalarda, farklı bir şey elde edebilirsiniz.
- **Sycophancy cascades。**Ajanlar en güvenli kişiyi konuşmaya itaat eder.
- **Context bloat。**Her ajan her mesajı okuyacak. 10 rondan sonra bağlamı çok büyük olacak.
- **Hot speakers。**某个代理因为选择者 偏好它的专长而主导对话――将扬声器平衡――作为选择者特征――引入――

### Grup sohbetleri ve yöneticisi

Aynı ilkel, farklı bir değer:

- Gözetmen: bir ajan 规划,其他代理 执行──Selector is 问规划师 接下来做什么──
- Grup sohbet: Tüm ajanlar eşleridir; seçicisi paylaşım kümesinin işlevi için bir rol oynar.

两者都使用课 04 中的四个原始语──グループチャット 默认使用LLM seçilmiş orkestra 和 full-pool shared state──


```figure
swarm-speaker
```

## Yapın onu.

`code/main.py`Bu programın bir grup sohbet gerçekleştirilmesi için üç ajanı içerir.`TERMINATE`- Bu bir şey.

Demo iki değişken konuşma transkripti ve seçicinin karar izlerini basıyor.

运行:

```
python3 code/main.py
```

## Kullan

`outputs/skill-groupchat-selector.md`Grup Çat seçicisi:Dönüş-robin vs LLM-seçilmiş vs özel, ayrıca hangi seçicilerin girişlerini kullanmak için

## Yayınla

Kontrol listesini:

- **Max rounds cap。**始终需要──典型任务为 10-20──
- **Speaker-balance metric。**Her ajanın sırasındaki sıradanlık, dengesizlik zamanında değerden fazla.
- **Termination token。** `TERMINATE`Ya da özel bir doğrulama ajanı.
- **Projection 或 scoped memory。**约10 条 条 后, düşünün sadece her ajanın bir kapsamlı görüşü, bağlam şişmesini önlemek için.
- **Selector logging。**LLM seçilen 变体 için, aynı zamanda seçicinin girişini ve seçimini kaydetmek ve kontrol etmek mümkün değildir.

## 练习

1. 运行  İşlem`code/main.py`❖ Dönemli bir görüşme ile LLM seçilmişleri arasındaki görüşmeyi karşılaştırın ❖ Her türlü hangi ajanın yönlendirme yapması gerekir?
2. Seçicide bir "maksimum konuşma-per-agent" kuralını ekle.
3. 实现目标达成终止:当评论者 返回"批准"时停止──它在圆顶前触发的频率是多少?
4. 阅读 AutoGen sabit belgeler 中关于 GroupChat 的内容(https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html）。识别 `GroupChatManager`Uses of default selector──
5. 阅读 AG2 repo(https://github.com/ag2ai/ag2），并将其V0.2 GroupChat ile v0.4 olay yönlendirilen  versiyon karşılaştırma. v0.4  hangi özel özellikleri artırdı?

## 关键术语

| Term | 人们的说法 | 它实际的含义 |
|------|----------------|------------------------|
| GroupChat | "Agents in one chat room" | Shared message pool + selector function。AutoGen / AG2 primitive。 |
| Speaker selection | "Who talks next" | 选择下一个 agent 的函数。Round-robin、LLM-selected 或 custom。 |
| GroupChatManager | "The meeting host" | 拥有 selector 并循环处理轮次的 AutoGen component。 |
| ConversableAgent | "The base agent" | AutoGen base class；一个可以发送和接收 messages 的 agent。 |
| Termination token | "The 'stop' word" | 结束 chat 的 sentinel string（通常是 `TERMINATE`）。 |
| Hot speaker | "One agent dominates" | selector 不断选择同一个 agent 的 failure mode。 |
| Context bloat | "Pool grows unbounded" | 每个 agent 都读取所有先前 message；context 随轮次增长。 |
| Projection | "Scoped view" | 面向角色的共享池视图，用于防止 context bloat。 |

## 延伸阅读

- [AutoGen group chat docs](https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html) Referans uygulanması
- [AG2 repo](https://github.com/ag2ai/ag2) 社区延续的 AutoGen v0.2
- [Microsoft Agent Framework docs](https://microsoft.github.io/agent-framework/) 合并后的继任者,RC 2026 年 2 月
- [AutoGen v0.4 release notes](https://microsoft.github.io/autogen/stable/) olay yönlendirici aktör modeli 重写细节
