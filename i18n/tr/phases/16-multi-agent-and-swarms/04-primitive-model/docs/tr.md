# Çoklu Ajanlı İlkel Model

> 2026 yılında yayınlanan her çoklu ajan çerçevesinde  AutoGen、LangGraph、CrewAI、OpenAI Agent SDK、Microsoft Agent Framework  hepsi dört boyutlu tasarım alanında bir noktadır.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 (Agent Engineering), Phase 16 · 01 (Why Multi-Agent)
**Time:** ~60 minutes

## 问题
Her altı ayda bir yeni çoklu ajan çerçevesini yayınlayacağız. 2023 yılındaki AutoGen. 2024 yılındaki CrewAI. 2024 yılındaki LangGraph ve OpenAI Swarm. 2025 yılındaki Google ADK.

Eğer bunları bire bire öğrenmeye çalışırsan, çok yorulacaksın. APIs farklı görünüyor. Bir çerçeve, paylaşılmış hafızasını blackboard , bir diğerini message pool , bir diğerini StateGraph , bir diğerini StateGraph , bir diğerini stateGraph , bir diğerini stateGraph , bir diğerini stategraph , bir diğerini stategraph , bir diğerini stategraph , bir diğerini stategraph , bir diğerini stategraph , bir diğerini stategraph , bir diğerini stategraph , bir diğerini stategraph , bir diğerini stategraph , bir diğerini stategraph , bir diğerini stategraph , bir diğerini stategraph , bir diğerini stategraph , bir diğerini stategraph , bir diğerini stategraph , bir diğerini stategraph stategraph , bir diğerini stategraph stategraph , bir diğerini stategraph 

Hayır, değil. Satış paketinin altında, dört ilkel şey var.

## 概念
### Dört ilkel

1. **Agent** Bir sistem promptı加一个工具列表──无状态;每次运行都从其系统 prompt 和当前消息历史 开始──
2. **Handoff**  Kontrolün bir ajandan diğer ajanın yapısal aktarımı.
3. **Shared state** 任何能被多个代理 读取(有时也能写入) 的数据结构──Message pool、blackboard、key-value store、vector memory──
4. **Orchestrator** decide下一个由谁发言的角色──选项包括:显式图表(确定性)、LLM hoparlör-selektor(soft)、上一位 hoparlör'ün el ele çağrı(OpenAI Swarm),或排列上的安排者(swarm architecture)。

İşte tam tasarım alanı. Her çerçeve her bir aksel için seçilmiş bir değer içerir.

### 2026 çerçevesinin nasıl haritası

| Framework | Agent | Handoff | Shared state | Orchestrator |
|-----------|-------|---------|--------------|--------------|
| OpenAI Swarm / Agents SDK | `Agent(instructions, tools)` | tool returns Agent | caller's problem | the LLM's next handoff call |
| AutoGen v0.4 / AG2 | `ConversableAgent` | speaker-selector on GroupChat | message pool | selector function (LLM or round-robin) |
| CrewAI | `Agent(role, goal, backstory)` | `Process.Sequential / Hierarchical` | Task outputs chained | manager LLM or static order |
| LangGraph | node function | graph edge + condition | `StateGraph` reducer | the graph, deterministic |
| Microsoft Agent Framework | agent + orchestration patterns | pattern-specific | thread / context | pattern-specific |
| Google ADK | agent + A2A card | A2A task | A2A artifacts | host decides |

Yukarıdaki fark çok büyük görünüyor. Alt kat: Aynı dört döngü.

### Bu neden önemli?

Bir kez primitifleri görmezden gelince, çerçeve karşılaştırması kısa bir kontrol listesi haline gelir:

- Orkestör, "Langgraph" için bir yol ayarlıyor mu?
- Paylaşılan durum tamamı tarih mi?
- Birbirinin emirlerini değiştirmek için çalışanlar mı yoksa sadece bir sürü mi?

Bu üç sorunun cevabı bir çerçeve ile belirli bir sorunun %80'ine uygun olup olmadığını belirleyebilir.

### Ülkesiz bir anlayış

Paylaşılan durum dışında, her primitif hiçbir durum bulunmuyor. Ajan ise bir fonksiyonun bir parçasıdır.**系统中唯一有状态的东西是 shared state。**Tüm ilginç hatalar orada yaşıyor: hafıza zehirlenmesi (Düşünme 15)

藏藏共享状态框架(Swarm) sorunu arayan kişiye yönlendirecek.

### Tek bir ilkelin anatomisi

#### Ajan .

```
Agent = (system_prompt, tools, model, optional_name)
```

没有记忆――没有状态――拥有相同的系统提示和工具的两个代理是可互换的――任何看起来像每代理状态的东西,实际上都在共享状态或handoff协议中――

#### Elverme

```
Handoff = (from_agent, to_agent, reason, payload)
```

Üç çeşit gerçekleşme:

- **Function return** araç 返回下一个代理──这是OpenAI Swarm 模式──Agentler kendi araç şemelerine yönlendirme taşır──
- **Graph edge** LangGraph。Edges is declaration式的──LLM 生成一个值;condition 选择下一个节点──
- **Speaker selection** AutoGen GroupChat──seçici fonksiyonu(有时它本身也是一次LLM call)读取池并选择下一位发言者──

#### Paylaşılan devlet

```
SharedState = { messages: [], artifacts: {}, context: {} }
```

En azından bir mesaj 列表──通常更多: yapılandırılmış eserler(CrewAI Görev çıkışları)、tipiye bağlamı(Langgraph azaltıcıları)、dış hafızası(MCP、vektor DB)。

两种 topoloji:**full pool**(Her ajan her mesajı görüyor)**projected**(Agentler göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre göre)

#### Orkestratör

```
Orchestrator = ({state, last_speaker}) -> next_agent
```

Dört çeşit:

- **Static** grafik 固定  LongGraph deterministic  CrewAI Sequential)
- **LLM-selected** LLM 读取 pool 并选择下一位讲者(AutoGen、CrewAI Hierarchical)
- **Handoff-driven** 当前 ajan 通过调用手渡工具 来决定(Swarm) 💚
- **Queue-driven** işçiler ortak sıradan 拉取任务; hiç açık bir sonraki hoparlör yok

### Çerçeve arasındaki değişiklikler

Bir kez primitif  sabit, kalan tasarım kararları şunlardır:

- **Memory strategy** geçici vs. dayanıklı kontrol noktası ((Langgraph kontrol noktası)。
- **Safety boundary**Kim bir el uzatmayı onaylayabilir?
- **Cost accounting** Bir ajan başına Token bütçeleri。
- **Observability** el uzatma izleme, tekrarlama 持久化状態に〜

Bunların hepsi ilk önce gerçekleşmiştir.


```figure
a5-primitive-radar
```

## Yapın onu.
`code/main.py`Python'un yaklaşık 150 stdlib kullanımı ile dört ilkel uygulamaya geçiyor. Gerçek bir LLM yok.

Dosya:

- `Agent` 包含 name、system prompt、tools、policy function 的 dataclass──
- `Handoff` 返回新代理'ın işlevi
- `SharedState` ipsiz mesaj havuzu
- `Orchestrator`Üç değişim:`StaticOrchestrator`- Evet.`HandoffOrchestrator`- Evet.`LLMSelectorOrchestrator`(sümüle edilmiş)

demo 通過所有三种管弦器类型 运行同一个三代理管道( Araştırma → yaz → inceleme), ve sonunda yazdır mesaj havuzu。 görebilirsiniz,输出差异只在 *kimin bir sonraki seçtiğine bağlıdır*; ajanlar 和 共有状态 在每次运行中完全相同──

- Yapma .

```
python3 code/main.py
```

预期输出: 三次 orkestrator runs,每种模式 一次──每次都会印打最终信息池──如果研究者 判断已经提前完成,赞助驱动的运行 会到达更少的代理

## Kullan
`outputs/skill-primitive-mapper.md`Bu bir beceri, herhangi bir çok ajan kod tabanını veya çerçeve belgesini okuyarak, dört temel haritalama yapısına geri döner. Yeni çerçeve sürümünde, onu çalıştırmak için, derinlemesine okumanın öncesinde bir bölümde bir anlayış elde edilir.

## - Söyle.
Yeni çerçeveyi kullanırken, önce bunun için ilkel haritalama yazın. Eğer yazılmasa, dosyaların tamamlanmadığını veya çerçeve ilk beş ilkelin gelişmekte olduğunu belirtin.

Yapılandırmayı 固定在你的架构文档 中──当新团队成员 加入时,先把 mapping 发送给他们,再发送 API docs──当框架版本 变化时,对比 mapping,而不是变更洛格──

## 练习
1. Farklı ajan politikaları kullanın .`code/main.py`Üç kez. Orkestör seçimini izle. Hangi ajanları değiştirir.
2. 实现第四种管弦乐器类型:排行驱动,其中的代理人 轮询共享状态 寻找工作.
3. 取 LangGraph hızlı başlatma (https://docs.langchain.com/oss/python/langgraph/workflows-agents), onu dört ilkel olarak yazın. LangGraph'in hangi soyutlamaları 1:1 映射, hangiları rahatlık sarmalarıdır?
4. 阅读 OpenAI Swarm yemek kitabı (https://developers.openai.com/cookbook/examples/orchestrating_agentsSwarm'ı tanımlamak için, dört primitifden hangisinin en ergonomi ve hangisinin sesini çeken kişiye göndermesini yapın.
5. Bu tabloda tamamen gizli bir ortak devlet çerçevesini bulmak için.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent | “一个带 tools 的 LLM” | 一个 `(system_prompt, tools, model)` triple。无状态。 |
| Handoff | “控制权转移” | 一个结构化 call，命名下一个 agent 和可选 payload。三种实现：function return、graph edge、speaker selection。 |
| Shared state | “Memory” / “context” | multi-agent system 中唯一有状态的部分。Message pool 或 blackboard。 |
| Orchestrator | “Coordinator” | 决定下一个运行者的人或机制。Static graph、LLM selector、handoff-driven，或 queue-driven。 |
| Primitive | “Abstraction” | 每个 framework 都会参数化的四个轴之一。不是 framework feature。 |
| Message pool | “Shared chat history” | Full-history shared state。容易推理，扩展性差。 |
| Projected state | “Scoped view” | 面向特定 role 的 shared state view。可扩展，需要 schema design。 |
| Speaker selection | “下一个谁说话” | 一种 orchestrator pattern，其中一个 function（通常是 LLM）从 group 中选择下一个 agent。 |

## 延伸阅读
- [OpenAI cookbook: Orchestrating Agents — Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) Elden gelen orkestrasyon için en net açıklama
- [AutoGen stable docs](https://microsoft.github.io/autogen/stable/) GroupChat + konuşmacı seçimi LLM tarafından seçilen orkestrasyonın bir referansı gerçekleştirmek
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) Grafik kenar orkestrasyon ve azaltıcı tabanlı ortak durum
- [CrewAI introduction](https://docs.crewai.com/en/introduction) Rol-hedef-geçmiş ajanları,Sekvensiyel / Hiyerarşik süreçler
- [AG2 (community AutoGen continuation)](https://github.com/ag2ai/ag2)Microsoft , v0.4 ' i bakım sonrası aktif olarak kullanmaya devam edecek .
