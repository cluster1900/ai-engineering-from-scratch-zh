# Yapacaklar ve Routines  无状态编排

> OpenAI'nin Swarm(2024年 10月) çoklu ajan 编排提炼为两个原语:**routines**(Sistem promptı olarak + araçlar)**handoffs**(Başlangıç) ⋅ hiçbir durum makinesi, hiçbir dalgalı DSLLLM ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅                                                                                                              

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

## 问题

Her çoklu ajan çerçevesinde DSL'yi öğrenmenizi ister: LongGraph'ın düğümleri ve kenarları, CrewAI'nin ekipleri ve görevleri, AutoGen'in GroupChat ve yöneticileri.

Swarm 走向相反方向:使用模型已经具备的工具调用能力──Handffs 变成工具调用──Orchestrator 就是当前掌握对话的那个代理──状态机隐含在代理的系统提示中──

## 概念

### 两个原语

**Routine。**定義 Agent 角色和可用工具的系统提示────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

**Handoff。**Ajan bir aracı ayarlayabilir, yeni bir Ajan nesnesini geri gönderir. Swarm çalıştırma zamanı Ajan'ı kontrol eder.

```
def transfer_to_refunds():
    return refund_agent  # Swarm sees Agent return → switch active agent

triage_agent = Agent(
    name="triage",
    instructions="Route the user to the right specialist.",
    functions=[transfer_to_refunds, transfer_to_sales, transfer_to_support],
)
```

Sistemi çağıracak                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

### Neden hızla yayılıyor?

- **API 小。**Sadece iki kavramı öğrenmek zorundayım.
- **使用模型已经会做的事。**Araç çağrıları, çeşitli tedarikçiler arasında üretim seviyesine ulaşmıştır.
- **没有状态机负担。**Grafiği tanımlamanın gerekliliği yok.Agent'in isteklerini tanımlamak için el ele verilir.

### 无状态取舍

Swarm                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

Çevre üretiminde (OpenAI Agents SDK,2025 yıl 3 月), bu önemli değişikliklerden biridir:SDK 內置セッション yönetimi 、gardrails 和 tracing, aynı zamanda el uzatmayı koruyan 、

### Swarm/Handoffs 适合的场景

- **Triage patterns。**Bir ajan kullanıcıyu uzmanına yönlendirecek.
- **基于技能的 handoffs。** Eğer görev kod gerektiriyorsa, kodlayıcıyı arayın; eğer araştırma gerekirse, araştırmacıyı arayın.
- **短而有边界的对话。**Müşteri desteği, sıklıkla yapılan soruları, basit iş akışları.

### Swarm 吃力的场景

- **带共享 memory 的长 sessions。**Handoffs, konuşma durumunu yeniden ayarlayacak. Yeni Ajanın hemen gelişmesi ve geçmişi.
- **并行执行。**Bir kez bir aktif ajanı bir kez açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak açıştırmak 
- **Audit 和 replay。**无状态 runs 很难精确重播;LLM'nin teslimatı 选择不是确定性的──

### OpenAI Ajanları SDK(2025年 3月)

Doğum sınıfı sonrakiler ekledi:

- **Session state。**跨 runs 的持久线──
- **Guardrails。**输入/输出 doğrulama hakları。
- **Tracing。**Her araç çağrısı ve teslimat kaydedilmiştir.
- **Handoff filters。**Kontrol el uzatma 时转移哪些上下文──

Handoff orijinal dil korunmaktadır; üretimi mümkün olan çevresinde tamamlanmıştır.

### Swarm vs GroupChat

两者都使用LLM-driven routing,但区别在**谁选择下一个**- ...

- Grup Çat: dıştan seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı seçen bir konuşmacı.
- Swarm: 当前 代理 通过调用手渡工具 选择它的继任者──

Swarm Agent karar verir next step                                                                                                                                                                                                                                                          `GroupChatManager`İçeride.


```figure
sw-handoff-routing
```

## Yapın onu.

`code/main.py`Swarm: bir ajan veri sınıfı, bir teslim mekanizması, bir araç, bir geri dönüş ajanı ve bir kontrol ajanı, bir değişim döngüsü.

Demo: bir triage ajanı 会路由到退款、销售或支持专家──每个专家都有自己的工具──运行循环 会打印每次转发──

运行:

```
python3 code/main.py
```

## Kullan

`outputs/skill-handoff-designer.md`Görevleri belirlemek için tasarlanmış bir teslimat topolojisi: hangi ajanlar vardır, hangi teslimatları ayarlayabilir, hangiları yukarı aşağı taşıyabilir.

## Yayınla

Kontrol listesini:

- **Handoff logging。**Her seferinde bir olayı yazıyor. Ajanın akışında bir anlık fotoğraf var.
- **上下文转移规则。**Handoff 时移动什么: 完整历史(昂贵) 、最近 N 条消息,或总结──
- **Handoff guardrail。**Yönetim Kurulu'nun başkanlığından gelenler, farklı araç yetkileri olan uzmanlara verilecek şekilde onaylanmalıdır.
- **Loop detection。**İki ajanın elini bırakmak için bir şey yapması normaldir.
- **Fallback agent。**Eğer teslimat hedefi yoksa, güvenlik öntanımlı değerine geri döner.

## 练习

1. 运行  İşlem`code/main.py`...geri dönüş ajanına ulaşmak... ...İkinci turun aktif ajanının geri dönüş olduğunu doğrulamak...
2. 添加循环-detection 规则: Eğer iki ajanın 3 kez elini uzatmışsa, 则强制退出──设计倒退──
3. 阅读 OpenAI Agents SDK dosyaları 中关于 handoff filtre 的内容──实现一个总结在handoff版本:出发代理 在入口代理 接管之前,将上下文压缩成弹总结──
4. Swarm'i GroupChat Manager seçeneği ile karşılaştırırken hangi paternin enjeksiyonu daha da kötüye gideceğini düşünüyorsun?
5. 阅读 Swarm yemek kitabı(https://developers.openai.com/cookbook/examples/orchestrating_agents）。找出Swarm'ın yaptığı açık bir tasarım kararı, OpenAI Ajanları SDK'nin değiştirdiğini veya koruduğunu açıkladı.

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|----------------|------------------------|
| Routine | “Agent prompt” | System prompt + tool list。定义角色和可用 handoffs。 |
| Handoff | “转交给另一个 Agent” | active agent 可以调用的一个 tool，它返回新的 Agent。runtime 会切换 active agent。 |
| Stateless | “runs 之间没有 memory” | Swarm 不持久化任何东西；memory 是调用方的责任。 |
| Active agent | “现在谁在说话” | 当前掌握对话的 Agent。Handoff 会改变它。 |
| Context transfer | “handoff 时移动什么” | incoming agent 能看到哪些 history 的策略：full、last N 或 summarized。 |
| Handoff loop | “Agents 来回 ping-pong” | 两个 Agents 不断 hand back 给对方的失败模式。 |
| OpenAI Agents SDK | “生产级 Swarm” | 2025 年 3 月的后继者；在 handoff 原语之上添加 sessions、guardrails、tracing。 |
| Handoff filter | “转移时的 gate” | SDK feature，用于在 handoff 边界检查和修改上下文。 |

## 延伸阅读

- [OpenAI cookbook — Orchestrating Agents: Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) 参考性 açıklama
- [OpenAI Swarm repo](https://github.com/openai/swarm) 原始实现,概念参考保留 olarak
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) 带 sesyonları 和 追踪 的生产级后继者
- [Anthropic handoff-in-Claude notes](https://docs.anthropic.com/en/docs/claude-code)Claude Code Subbagents nasıl geçiyor?`Task`Kullanım benzer elverme biçimi
