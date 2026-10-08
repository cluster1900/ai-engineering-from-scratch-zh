# Paylaşılan hafıza ve Blackboard  mode

> 2026 yılında Multi-Agent sisteminde iki yöntem bulunmaktadır:**message pool**(Herkes, herkesin haberlerini görebilir, örneğin AutoGen GroupChat veya MetaGPT) ve**带 subscription 的 blackboard**(Agent 订阅相关事件,如 Context-Aware MCP 或 Matrix framework)                                                                                                                                                                                                                                                    **memory poisoning**Bir ajan 幻觉出一个事实,另一个代理把它当作已验证的内容,准确性逐渐衰退,而且这种衰退比立即崩更难调解――本课将用 stdlib 构建这两种结构,注入一次毒袭,并展示三种在生产中真正有效缓解措施――

**类型：**Öğren + İnşa et
**语言：**Python,`threading`)
**先修：**16 · 04(Öncelik Modelli),16 · 09
**时间：**75 dakika kadar .

## 问题

Multi-Agent  sistem bir yerli bir sistem gerektirir. Bir sözde seçenek ise, tüm içeriği mesaj iletecek                                                                                                                                                                                                                                                 

Bir Ajan  hayalet oluşturduğunda ve hayaleti paylaşım durumuna yazdığında, sonra her bir bu durumu okuduktan sonra Ajan bu hayaleti gerçek olarak görür.

Bu, hafıza zehirlenmesidir. Bu, MAST taksonomidir.

## 概念

### 两种主要拓

**Full message pool。**Her Ajan 读取每条消息──AutoGen GroupChat 和 MetaGPT kullanımı bu şekilde──简单,透明,可检查,但不能扩展到大约10 Ajan,因为每个 Ajan的上下文都会被其他 Ajan的工作填满──

```
agent-A ──write──▶ ┌────────────────┐ ◀──read── agent-D
                   │ message pool   │
agent-B ──write──▶ │                │ ◀──read── agent-E
                   │ (global log)   │
agent-C ──write──▶ └────────────────┘ ◀──read── agent-F
```

**带 subscription 的 Blackboard。**Agent 声明自己感兴趣的话题; alt alt alt alt alt alt sadece路由相关消息;;CA-MCP(arXiv:2601.11595); ve Matrix merkezi olmayan çerçeve;;arXiv:2511.21686) bu şekilde kullanmak。 genişleyiş daha güçlü, ancak aboneliklerin anlamlı olması için önceden tasarlanmış bir şema gerekir。

```
                   ┌─ topic: prices ──┐
agent-A ──pub────▶ │                  │ ──▶ agent-D (subscribed)
                   ├─ topic: orders ──┤
agent-B ──pub────▶ │                  │ ──▶ agent-E (subscribed)
                   ├─ topic: alerts ──┤
agent-C ──pub────▶ │                  │ ──▶ agent-F (subscribed)
                   └──────────────────┘
```

### Kendiliğinden kullanılabilir

- **Full pool**适合 代理 数量少 ((< 10) 、角色异构、对话是短周期的情况──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
- **Blackboard**适合 代理 数量多、角色同质但实例众多(swarms) 、对话长期运行情况──路由 能节省 代币 成本并减少上下文污染──

生产系统通常混合使用:顶部使用一个小型全池 (小型全池) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing layer) (planing) (planing) (planing) (planing) (planing) (planing) (planing)  planing) (planing) (planing) (planing) (planing) (planing)  planing) (planing) (planing) (planing) (planing) (planing) (planing) (planing)  planing)

### Bir hafıza zehirlenmesi

Üç Ücü 执行一个研究任务──Agent A, kurtarma ajanı──Agent B, toplayıcı──Agent C, analist──

1. Bir 获取一个页面,并向共享状态写入消息:Deneyim, %42 doğruluk artışını bildirir.
2. Alınan sayfa aslında %4.2'lik bir gelişme olduğunu yazıyor.
3. B 读取共享状态后写入:Kesinlik artışı % 42 oranında rapor edildi (kaynak: A).
4. C 读取共享状态后写入:Tavsiye edilen kabul  42% yükseltme dönüştürücüdür.
5. Son rapor, hiç olmadığı kadar %42'lik bir rakamdan söz ediyor.

没有 Agent 崩──没有测试失败──系统工作正常──这个幻觉通过共享状态,从一个代理的上下文进入每个下游代理的推理中──

### Bu neden yapısal bir sorun?

没有共享状态时,Agent A's幻觉会留在A's上下文中──下游Agent 会重新获取或重新推导,可能会发现错误──天真共享状态后,A's上下文变成所有者的上下文,幻觉洗洗成事事──

Sorun kendi içinde paylaşım durumunda değil, paylaşım durumunda.**没有 provenance，也没有独立 verifier**❖ Üç farklı çözüm önlemi:

1. **每次写入都标注 provenance。**共享状态中的每一个条目都记录是谁写入、何时写入、在什么提示下写入,以及(如适用) Ajan 引用了什么来源──下游 Ajan 根据来源──带着怀疑读取──
2. **对写入做 versioning；把它们视为 append-only。**修正 yeni bir girişdir, eski giriş yerine yeni bir giriş kullanılır.
3. **至少保留一个无法写入共享状态的 Agent。**Sadece okuyucu doğrulayıcı ajanı 抽样入口、重新获取源,并标记不一致──因为它不能写入池,所以它不会被池毒──

### Karayolu ön örnek (Hayes-Roth, 1985)

Blackboard 模式比LLM ajanları早了四十年──Hayes-Roth(1985,A Blackboard Architecture for Control) uzman bilgi kaynaklarını tanımladı: onlar bir genel siyah tahtayı gözlemler, kısmi çözümler katkıda bulunurlar,并触发其他源──2026 yılının siyah tahtası(CA-MCP、Matrix) aynı bir modeldir, sadece LLM ajanları kullanarak 知識 kaynakları olarak, JSON bloblarını kullanarak kısmi çözümler olarak──旧文献已记录了写作,争议的控制和一致的解决方案,而现代系统正在重新发现它们──

### Projection vs. Full View

純黒板 会給每個購読者同等的投影 (→ Konuya göre 限定) 〜 Daha 激進的設計是**per-agent projection**LangGraph'in devlet azaltıcıları, 2026 yılının kurallarıdır.

Ajan projesi 扩展性更强,但需要方案──没有方案──时,你会在每个代理的提示中重建 ad-hoc projeksiyonu──

### Yazıcılık içeriği 模式

Çoklu Ajan Aynı Zaman Bir Eşleşme  Sorun, Sadece LLM  Sorun değil.

- **Sequential writer（single producer）。**Tüm yazılar bir koordinatör aracılığıyla yapılır.
- **带 versioning 的 optimistic concurrency。**Her giriş bir versiyonu vardır; yazarın versiyonu eşleşmezken başarısız ve tekrar denemeyi başarıyor.
- **Topic partitioning。**Çeşitli Ajan  farklı konuları vardır  hiçbir konu çapında tartışma yoktur  İyi bir bölüm sınırları gerekir 

Büyük çoğunluk 2026 yıl çerçevesinde, LLM 调用足够慢, neden tartışmalar 很少见,而瓶影响不大――

### Yazılmamalı doğrulama

En önemli hafifleme önlemleri sadece okunabilir doğrulamacıdır.

- Verifier ve takım ortaklığı durumu ([[读取 blackboard]] veya pool)
- Verifier  paylaşımlı durumlu yazı elçisi  Sadece tek bir doğrulama kanalı yazılabilir。
- Verifier 独立获取 中引用的来源──标记分歧── yazıyor.
- Verifier  kendi girişimi insanlara veya tek başına karar verme ajanlarına yönlendirilir, kesinlikle karşı karşıya değildir.

Bu şekilde ayrılığa uğramadan, verifier'in girişleri havuz içinde yeni girişler haline gelir. Bu da zehirlenmiş havuzın zehir veriförü, ve veriför de zehirlenmiş kendi kontrollerini yapar.


```figure
swarm-blackboard
```

## Yapın onu.

`code/main.py`Python'dan bir oyuncak zehirlenmesi saldırısı ve üç hafifleme önlemini gerçekleştirdim.

- `MessagePool` 线程安全的附属日志,支持完整读出──
- `Blackboard` 按主题键的pub/sub,支持每代理订阅──
- `ProvenanceEntry` Her zamanki kayıtları yazıyor.
- `PoisoningScenario` 运行一个三 代理研究任务,其中 Agent A 幻觉出小数点――打印最终报告――
- `Verifier` Tek okuyucu ajan, kaynakları yeniden alacak ve onaylayıcı varken aynı sahneyi kullanmaya devam edecek.

运行:

```
python3 code/main.py
```

预期输出:
- Verifiyeci olmadan çalıştır: %42'si son raporuna kadar yayılacak.
- 2( var doğrulayıcı):verifier 标记不一致,pool 被标记为 旗,最终报告包含撤销──

## Kullan

`outputs/skill-memory-auditor.md`Bu, herhangi bir Multi-Agent  sistemi ortak hafıza tasarımı, kontrol etkeni, versiyonlama ve doğrulayıcı ayrımı için kullanılacak bir beceri. Yeni Multi-Agent  yapı üretime girer ve onu kullanır.

## Yayınla

对于任何共享-memory 设计:

- Her yazılı kayıttan kaynak:`(writer, timestamp, prompt_hash, tool_calls_cited, source_uri)`- Evet.
- 让日志保持 apend-only──Corrections are引用被取代的新条目──
- 部署 en az bir bağımsız kaynak erişimine sahip sadece okunur doğrulayıcı ajanı。
- Verifiyeci çıkışı paylaşımlı havuza geri dönmek yerine 路由到单独频道.
- 记录 记录 记录 记录 记录 记录 记录 记录 记录 记录 记录 记录 记录 记录 记录 记录 记录 记录 记录 记录 记录  记录  记录  记录                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

## 练习

1. 运行  İşlem`code/main.py`Birinci koşunun yayıldığını ve ikinci koşunun onu yakaladığını belirleyin.
2. 添加第二幻:agent B 编制一个数据集尺寸──verifier 应该能够捕获两者,而不需要针对任一情况手工调优──
3. Bu bölümler tamamen değişecek .`prices`- Evet.`summaries`- Evet.`analyses`Konu bölümü hangi zehirlenme senaryolarını daha zor uygulayabilir, hangi senaryoları daha da zorlaştırır?
4. Hayes-Roth'un 1985 yılında yaptığı bir çalışma, kontrol için bir kartaritet yapımı, kontrol için iki kontrol örneği ortaya çıkmıştır.
5. CA-MCP(arXiv:2601.11595)。将其 Paylaşılan Konteks Mağazası 映射到 `code/main.py`Orta Mesaj Havuzu veya Kara Çubuğu sınıfı. CA-MCP'de hangi primitifler eklendi?

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| Message pool | “Shared chat history” | 每个 Agent 都会读取的 append-only log。完全透明，但扩展性差。 |
| Blackboard | “Shared workspace” | 按 topic keyed 的 pub/sub。Agent 订阅相关 topics。扩展更远。 |
| Provenance | “谁写了什么” | 每次写入的 metadata：writer、timestamp、prompt、sources。 |
| Memory poisoning | “幻觉在扩散” | 一个 Agent 的错误进入共享状态，下游 Agent 将其当作事实。 |
| Append-only | “没有原地更新” | Corrections 是用来 supersede 的新 entries。保留 audit trail。 |
| Unwritable verifier | “Independent auditor” | read-only Agent，会重新获取 sources 并标记不一致。 |
| Projection | “Scoped view” | 从 global state 计算出的 per-agent view。LangGraph reducers 是规范案例。 |
| Knowledge Source | “Specialist agent” | Hayes-Roth 在 1985 年对 blackboard participant 的称呼。 |

## 延伸阅读

- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) MAST taksonomisi; hafıza zehirlenmesi koordinasyon-başarısızlık 的一个子家族
- [CA-MCP — Context-Aware Multi-Server MCP](https://arxiv.org/abs/2601.11595) Koordinate MCP sunucularının Paylaşılan Kontekst Depoyu
- [Matrix — decentralized multi-agent framework](https://arxiv.org/abs/2511.21686)Mesaj sırasına dayalı bir tablo, merkezi orkestrasyoncu yok
- [LangGraph state and reducers](https://docs.langchain.com/oss/python/langgraph/workflows-agents) 生产中的 agen projesi 模式
- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) Üretim Bakanlığı'ndan gelen kaynak ve doğrulama notları
