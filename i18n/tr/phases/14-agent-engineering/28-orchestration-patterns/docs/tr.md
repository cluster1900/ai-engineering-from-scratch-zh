# 编排模式:Sörge, Swarm, Hierarşik

> 2026 yılının çerçevesinde dört çeşit orkestrasyon kalıpları tekrar ortaya çıktı: denetçi-işçi, topluluk / eşeğen, hiyerarşik, tartışma, antropik yönlendirme prensibi:

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**Fase 14 · 12 (Yapışım Düzenleri), Fase 14 · 25 (Büyük Ajanlar Tartışması)
**Time:** ~60 分钟

## Öğrenme hedefi
- Dört çeşit tekrar tekrar ortaya çıkan orkestrasyon kalıplarını ve her uygun bir sahneyi anlatın.
- 描述 2026年 LangChain'ın önerisi: Yönetim kütüphaneleri değil, araç çağrısı üzerine kurulu denetim.
- Antropik'in  yapısal  kuralları, ve nasıl topoloji 选择──
- Bu programı kullanmak için, bir yazılı LLM'ye dayanarak dört farklı modülün gerçekleşmesi gerekir.

## 问题
チーム常常在真正需要之前就急于使用多代理──四种模式会在不同框架中反复出现; bir kez bunları söyleyebildiğinde, doğru bir tür seçebilmek veya tamamen topolojiyi atlamak için kullanılabilir.

## 概念
### Gözetmen işçi

- Bir merkez LLM yönlendirme ve uzman ajanlara görev göndermek için.
- Karar: kendi döngüsüne geri dönmek, uzmanlara teslim olmak, sonlandırmak.
- Uzmanlar birbirleriyle iletişim kurmuyor. Tüm yollar gözetmenle geçiyor.

框架:LangGraph `create_supervisor`、Antropik orkestrasyon-işçiler、CrewAI Hierarşik süreç¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

**2026 LangChain 建议：** Direct tool calls                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `create_supervisor`                                                                                                                                                                                                                                                              

### Swarm / peer-to-peer

- Ajanlar ortak bir alet yüzeyi ile doğrudan elini uzatıyor.
- 没有中心路由器──
- 延迟低于上司 (Söyge) hop 更少 (Hep daha az) 
- Daha zor düşünülüyor.

框架:LangGraph sürüsü topolojisi、OpenAI Ajanları SDK elverileri(当所有代理都可以交付给所有其他代理时)

### Yerarşik

- Gözetmenler 管理 sub-supervisors, sub-supervisors 再管理 workers。
- Bu, LangGraph'de Nested Subgraph'lar için gerçekleştirilmektedir.
- Büyük çaplı ajan gruplarına yayılabilir, ancak fiyatları daha yüksek.

Hangi zaman ihtiyaç vardır: tek bir gözetmenin bağlam bütçesi tüm uzmanların tanımını kabul edemez.

### Tartışma

- Ve öneriler + 代 çapraz eleştiriler
-  Strengly speaking not orchestration,更像 verification, but in frameworks often as a topology 选择出现──                                                                                                                                                                                                                                                 

### CrewAI Crew vs Flow

CrewAI iki çeşit deployment modüsünü formelleştirdi:

- **Flow**Bu, belirlenmiş olay yönlendirici otomasyonla yapılmış bir süreçtir.
- **Crew**Kendi kendine rol tabanlı işbirliği kullanmak için.

Bu yukarıdaki dört modüyle uyumludur, ancak topolojiye göre düzenlenir: Akış genellikle gözetmen veya hiyerarşiktir; Ekib genellikle LLM yönlendiricisi ile gözetmenlidir.

### Antropik'in rehberliği

LLM alanındaki başarı, en karmaşık sistemleri inşa etmede değil, ihtiyaçlarınız için doğru sistemleri inşa etmede yer almaktadır.

决策顺序:

1. 单个代理 + iş akışı kalıpları(Düşünme 12) 从这里开始──
2. Gözetmen-işçi  Eğer 2-4  uzman varsa 时。
3. Swarm  当延迟比推理清晰度更重要时──
4. Yerarşik  只有当監督文脈予算 不足时。
5. Tartışma                                                                                                                                                                                                                                                              

### Bu yol kolayca yanlış bir yerde

- **Topology-first thinking.**Bu yüzden çoklu ajanı tanımak için çoklu ajanın olması gerektiğini söylemeye çalışıyoruz.
- **Bouncing handoffs in swarm.**A -> B -> A -> B。 hop sayıcıları kullanın。
- **Fake hierarchy.**Çünkü şirket üç katlı; aslında sadece iki takım vardır.


```figure
orchestration-pattern
```

## Yapın onu.
`code/main.py`STDlib'i kullanarak, scripture tabanlı LLM'yi gerçekleştirmek için dört modü var:

- `Supervisor` Orta yönlendiricisi。
- `Swarm` 带直接 handfolds of peer-to-peer──
- `Hierarchical` denetçilerin denetçileri¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- `Debate` ve öneriler + eleştiriler

Her türlü işlem biçimi aynı üç amaçlı görevdir.

运行:

```
python3 code/main.py
```

输出: 每种模式的痕迹 + op count──Supervisor 最清晰;swarm 最短;hierarchical 最深;debat 最贵──

## Kullan
- **LangGraph**Üzle ve hiyerarşik yerleşik alt grafikler)
- **OpenAI Agents SDK**Kullanılan araçlar gibi bir şekilde kullanılır.
- **CrewAI Flow**Kesin bir üretim ortamı için kullanılır.
- **Custom**Tartışma için, ya da kontrol etmek istediğinde.

## - Söyle.
`outputs/skill-orchestration-picker.md`Topolojiyi seçip onu gerçekleştirmek için.

## 练习
1. Router'ı kaldırıp bir işçiyi sürüm olarak değiştir. Ne boşa gidecek? Ne gelişecek?
2. 给群 添加跳计:3次交付 后拒绝──它能捕捉 A->B->A 的反复跳转吗?
3. 12 uzmanlık alanı için iki sınıf hiyerarşik sistem oluşturmak.
4. Üretim biçiminin iş yüküne yakınken, profil dört çeşit modellerde hangi bir gösterge üzerinde başarısızlık yapılır?
5. 阅读Antropic's Building Effective Agents 文章──把你的每一个生产流映射到四种模式之一──有没有不能干净映射的?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Supervisor-worker | “Router + specialists” | 中心 LLM 分派给 specialists；它们彼此不通信 |
| Swarm | “Peer-to-peer” | 通过共享 tools 直接 handoffs；没有中心 router |
| Hierarchical | “Supervisors of supervisors” | 面向大规模群体的 nested subgraphs |
| Debate | “Proposer + critique” | 并行 proposers，cross-critique（Lesson 25） |
| Tool-call-based supervision | “Supervisor without a library” | 将 supervisor 实现为直接 tool calls，以控制 context |
| Crew | “Autonomous team” | CrewAI 的 role-based collaboration 模式 |
| Flow | “Deterministic workflow” | CrewAI 的 event-driven production 模式 |

## 延伸阅读
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 五种模式 + ajan vs iş akışı
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) gözetmen  topluluk  hiyerarşik
- [CrewAI docs](https://docs.crewai.com/en/introduction) Ekip vs Akış
- [Du et al., Society of Minds (arXiv:2305.14325)](https://arxiv.org/abs/2305.14325) Tartışma modeli
