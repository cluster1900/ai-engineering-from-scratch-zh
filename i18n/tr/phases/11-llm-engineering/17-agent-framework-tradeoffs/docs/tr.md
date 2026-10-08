# Agent Framework 取舍  LangGraph vs CrewAI vs AutoGen vs Agno

> Her çerçeve aynı demo satıyor, araştırma ajanı oluşturmaktadır, aynı hata da var. Devlet şeması ve orkestrasyon katmanı birbirine çarpışmaktadır.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (Function Calling), Phase 11 · 16 (LangGraph)
**Time:** ~45 minutes

## 问题

Bir görev var, bir kere LLM çağrısı yaptırmak gerekiyor. Belki de bir araştırma iş akışıdır. Plan, arama, özet, alıntı. Belki de bir kod inceleme boru hattıdır.

Üç gün sonra, bu çerçevenin çekimlerini bulursun. Soruşturmacı sana roller verir, ama bir araştırmacı olduğunda, yapılandırılmış planı vermeye ihtiyaç duyar. Bu, senle karşılaştırılır. AutoGen'in size ajanlar arasındaki sohbetini verir, ama bir durum yoktur. Bu yüzden kontrol noktanız sadece konuşma logunun bir kırıntısı.

修复方式 选择最好的框架──而把框架的核心抽象匹配到你的问题形状──本课将绘画这个地图──

## 概念

![Agent framework 矩阵：核心抽象 vs 问题形状](../assets/framework-matrix.svg)

4 çerçeve 2026 yılına odaklanır.

| Framework | 核心抽象 | 最适合 | 最不适合 |
|-----------|----------|--------|----------|
| **LangGraph** | `StateGraph` — typed state、nodes、conditional edges、checkpointer。 | 有显式 state 和 human-in-the-loop interrupts 的 workflows；需要 time-travel debugging 的 production agents。 | 拓扑未知、由 role 驱动的松散 brainstorming。 |
| **CrewAI** | `Crew` — roles（goal、backstory）、tasks、process（sequential 或 hierarchical）。 | 有短线性/层级 plan 的 role-playing 或 persona-driven workflows。 | 超出 crew turn history 的任何 stateful 场景；复杂 branching。 |
| **AutoGen** | `ConversableAgent` pair — 两个或更多 agents 轮流说话，直到满足 exit condition。 | Multi-agent *dialogue*（teacher-student、proposer-critic、actor-reviewer），其中思考从 chat 中涌现。 | 有已知 DAG 的 deterministic workflows；任何需要跨重启 durable state 的场景。 |
| **Agno** | `Agent` — 单个 LLM + tools + memory，可组合成 teams。 | 快速构建 single agents 和 lightweight teams；强 Multimodality 和内置 storage drivers。 | 带 custom reducers 的深度、显式分支 graphs。 |

### 抽象到底是什么意思

Bir çerçevenin çekirdeği, beyaz tahtada mimari konuşurken çizdiğin bir şey.

- **LangGraph**→ 你画一个图.Nodes are steps, edges are transitions.
- **CrewAI**→ 你画一个组织图片──每个角色有职位描述,管理者 路由任务──心理模型 是一个小型专家团队──
- **AutoGen**Bir Slack DM'yi çiziyorsun. İki ajan birbirine mesaj gönderiyor. Eğer moderatör gerekiyorsa, üçüncü bir katılımcı var.
- **Agno**Bir tek kutu çizersin, yanında aletler asılır. Birden fazla kutuyu bir arada koy.

### Devlet  problem

Devlet, çoğu çerçeveyi seçen üretim içinde çökmüş yerlerdir.

- **LangGraph.**Tipli durum`TypedDict`Ya da Pydantik model) 、per-field reducers、一等 checkpointer(SQLite/Postgres/Redis)  Resume、interrupt 和 time-travel 都是免费的──*(((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((
- **CrewAI.**Devlet tarafından`context`alanı 以字符串形式在任务之间流动,或通过`output_pydantic`结构化传递──开箱没有每个机组的持久的店;如果机组人员必须在重启后生存,你需要自己接上──
- **AutoGen.**Durum ise sohbet geçmişi ve kullanıcı tanımlı herhangi bir şey `context`❖ Konuşma transkriptleri kalıcı olabilir; herhangi bir iş akışı durumu, adapter yazmadıkça kalıcı olmayacaktır.
- **Agno.**İçeride depolama sürücüleri(SQLite、Postgres、Mongo、Redis、DynamoDB), geçiyor `storage=`- Çekil .`Agent`上  sohbet seansları 和 kullanıcı hatıraları 会自動持久化─── bu tam bir grafik kontrol noktası değil;

### Şubeler  sorun

Her sıradışı ajanın şubesi var.

- **LangGraph** 由你决定,通过条件边缘──路由是带命名分的Python函数──分类是编译图中等对象;checkpointer 会记录采取哪条分类──
- **CrewAI** hiyerarşik modunda yöneticiden karar; sıralı modunda yöneticiden karar;  yapılandırma sırasında karar;  yönlendirme 隐含在任务列表中; if── dışında yöneticinin istekleri dışında, hiçbir if── yoktur.
- **AutoGen** ajanlar 通過聊天決定──分支 从下一个发言者中涌现──`GroupChatManager`选择 next speaker;你可以手写 `speaker_selection_method`Ama bu, LLM tarafından yönlendirilir.
- **Agno** ajan 通過下一步调用哪个工具来决定──Teams have coordinator/router/collaborator mode; bunların dışındaki dalgalamalar geliştiricinin sorumluluğudur。

### Gözlemsellik 问题

- **LangGraph** LangSmith veya herhangi bir OTel ihracatçısı tarafından OpenTelemetry kullanın. Her düğüm geçişleri iz uzadıdır. Kontrol noktaları aynı zamanda tekrarlanabilir izleridir.
- **CrewAI** 2025 yılının sonundan itibaren OpenTelemetry'yi desteklemek; Langfuse、Phoenix、Opik、AgentOps¬ı oluşturmak
- **AutoGen** 通過 `autogen-core`集成 OpenTelemetry;AgentOps 和 Opik                                                                                                                                                                                                                                                        
- **Agno** 内置 `monitoring=True`Bayrak 加 OpenTelemetry ihracatçıları;

### Üretim ve geçicilik

Çerçeve, arama başına genel maliyet artışına göre gerçekleşir. Çerçeve mantığı, geçerliliği, seriallendirme)  Genel maliyet artışına göre gerçekleşir.`GroupChatManager`Aynı şey. Sadece senin yazman.`llm.invoke`很薄── Agno'nun tek ajan yolu.

Önemli olan, öncelikli olarak açık yönlendirme seçimi yapılmasıdır.`speaker_selection_method`), LLM tarafından seçilen yönlendirme değil.

### İşbirliği

- **LangGraph** **LangChain**araçlar, geri alıcılar, LLMs, bir diğer MCP adaptörü,
- **CrewAI** araçlar 继承自 `BaseTool`LongChain araçları, LamaIndex araçları ve MCP araçları, buraya ve buraya uygun olarak uygulanabilir.`allow_delegation=True`Ekip-kişif delegasyonu yapın.
- **AutoGen**→ `FunctionTool`包装任何Python callable;有MCP adapti──对代理对代理模式与AG2 紧密合──
- **Agno**→ `@tool`dekorator veya BaseTool alt sınıfı;MCP adaptörü; araçlar ajanlar ve ekipler arasında paylaşılabilir.

## 技能

> Bir cümleyle açıklayabilirsin, neden bir çerçeve bir ajanın sorununa uygun?

构建前 Kontrol listesi:

1. **画出形状。**Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?Bu grafik mi?
2. **决定谁来 branching。**Geliştiriciler tarafından belirlenen dalgalama → LangGraph──Manager-agent tarafından belirlenen → CrewAI hiyerarşik──Chat-emergent → AutoGen──Tool-call-decided → Agno──
3. **检查 state budget。**Eğer bu durum varsa, LangGraph is default choice;Agno seansları cover conversation-scoped state。
4. **检查 cost budget。**LLM tarafından seçilen yönlendirme Her turda ekstra花 tokens── Eğer ajan her gün binlerce kez çalışırsa, öncelikli olarak açık yönlendirme seçin──
5. **为 framework overhead 做预算。**Her çerçeve bir diğer bağımlılıktır. Eğer görev sadece iki LLM çağrısı ve bir araçsa, 30 行 basit Python yazın.

Eğer bir grafik, bir org tablo, bir sohbet ya da bir ajan kutu çizersen, bir çerçeveyi uzatmayı reddet.

## 决策矩阵

| 问题形状 | 首选 framework | 原因 |
|----------|----------------|------|
| 带 typed state、human approvals、long-running 的 Workflow DAG | LangGraph | 一等 state、checkpointer、interrupts、time-travel。 |
| 有明确 roles 的 research / writing pipeline | CrewAI (sequential) 或 LangGraph subgraphs | 在 CrewAI 中表达 role-per-task 很便宜；当 branching 变复杂时用 LangGraph 扩展。 |
| Proposer-critic 或 teacher-student dialogue | AutoGen | Two-agent chat 是它的原生形状。 |
| 带 tools、sessions、memory 的 single agent | Agno | 设置最薄，内置 storage 和 memory。 |
| 带 reducers 的数千个 parallel fanouts | LangGraph + `Send` | 唯一拥有一等 parallel-dispatch API 的选择。 |
| 快速 prototype，不承诺 framework | Plain Python + provider SDK | 没有 framework 是最快的 framework。 |


```figure
l5-framework-fit
```

## 练习

1. **Easy.**取同一个任务  research Anthropic'in merkezi, 200 kelimelik bir özet yazın, kaynakları alıntılayın  分別使用 LangGraph(四个节点:plan、搜索、写、引用) 和 CrewAI(三角色:研究者、作家、編集者) 实现──报告每次运行代码行数 和代码行数──
2. **Medium.**AutoGen'den araştırmacı yazar sohbet editori tarafından`GroupChat`加入) 和 Agno(带 `search_tools`和 `write_tools`Bu, (a) Her seferinde çalışmanın maliyeti, (b) çöküş sonrası devam etme kapasitesinin, (c) adım önceden insan onayına başvurma kapasitesinin, (c) dört gerçekleştirme sırasına göre yapılır.
3. **Hard.**Bir karar ağacı metni oluşturun`pick_framework.py`, accept a简短问题描述(JSON:`{has_typed_state, has_roles, has_dialogue, has_parallel_fanout, needs_resume}`),并返回推和一句话正当化──用你自己设计的六个案例 验证它──

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|------------|------------------|
| Orchestration | “agents 如何协调” | 决定下一个运行哪个 node/role/agent 的 layer。 |
| Durable state | “重启后 resume” | 附着到 checkpoint 或 session store 上、能在 process death 后存活的 state。 |
| LLM-selected routing | “让 model 决定” | planner LLM 每轮选择下一步；灵活，但每次决策都要花 tokens。 |
| Explicit routing | “Developer 决定” | Python function 或 static edge 选择下一步；便宜且可审计。 |
| Crew | “一个 CrewAI team” | roles + tasks + process（sequential 或 hierarchical）绑定成一个 runnable。 |
| GroupChat | “AutoGen 的 multi-agent chat” | N 个 agents 之间由 speaker selector 管理的 conversation。 |
| Team (Agno) | “Multi-agent Agno” | 对一组 agents 使用 route / coordinate / collaborate mode。 |
| StateGraph | “LangGraph 的 graph” | typed-state、node、conditional-edge、checkpointer abstraction。 |

## 延伸阅读

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) StateGraph、checkpointers、interrupts、time-travel──
- [CrewAI documentation](https://docs.crewai.com/) Ekipleri, Akışlar, Ajanlar, Görevler, İşlemler
- [AutoGen documentation](https://microsoft.github.io/autogen/) KonuşabilsenAgent、GroupChat、teams、tools。
- [Agno documentation](https://docs.agno.com/) Ajan, Ekip, İş akışı, depolama, hafıza.
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) Çerçeve 无关的图案库(hızlı zincirleme、路由、对行化、orkestrator-workers、evaluator-optimizer)
- [Yao et al., "ReAct: Synergizing Reasoning and Acting" (ICLR 2023)](https://arxiv.org/abs/2210.03629)Her çerçeve, her döngüyle dolu.
- [Wu et al., "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation" (2023)](https://arxiv.org/abs/2308.08155) AutoGen'in tasarım kağıdı
- [Park et al., "Generative Agents: Interactive Simulacra of Human Behavior" (UIST 2023)](https://arxiv.org/abs/2304.03442) CrewAI 风格 persona stacks 建立其上角色扮演基础──
- Eğitimsel değerlendirme çerçevesinin 11 · 16 aşaması (LangGraph)
- EY 11 · 19 (Düşünme)   一个能干净映射到 LangGraph、但映射到 CrewAI 会很不同的图案──
- EY 11 · 22 (Özellikle gözlemlenebilirlik)  如何仪 你选择的任何框架──
