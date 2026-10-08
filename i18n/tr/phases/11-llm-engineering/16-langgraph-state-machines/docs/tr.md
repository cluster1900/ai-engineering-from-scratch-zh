# LangGraph  Ajanın Devlet Makineleri

> El yazısı ReAct döngüsü bir .`while True` LangGraph'in yazılı ReAct döngüsü bir grafiktir, kontrol noktası, kesintisi, dalı, ve zaman yolculuğu yapabilirsiniz.

**Type:** Build
**Languages:** Python
**前置要求:**11 · 09 aşaması (Fonksiyon Çağırımı), 11 · 14 aşaması (Model Konekst Protokolü)
**Time:** ~75 minutes

## 问题

Bir fonksiyon çağıran bir ajan yayınladın. Normal çalışmaya başladı ve sonra bir sorun çıktı. Model, bir geri dönüş 500 aracı kullanmaya çalıştı. Kullanıcı görev sırasında fikrini değiştirdi.`while True:`Çubuk yok. Onu durduramazsın, geri dönemezsin, çıkamazsın. Eğer model o zaman başka bir araç seçse, nasıl olur?

Bir kez bunu anladığında, bir sonraki adım çok açık olacaktır. Ajan 本来就是一台状態マシン:システムプロンプト加メッセージ史,加待发工具コール,再加次アクション. Bu durum makinesini 显式化:ノードを使って表示モデル表示 思考ツール 运行人間 批准, 边形を使って表示 条件的移行を図示します.

LangGraph bu tür bir soyutlama kütüphanesi sunuyor. Bu LangChain anlamında bir ajan çerçevesidir. Burada bir AgentExecutor var.

## 概念

![LangGraph StateGraph: nodes, edges, and the checkpointer](../assets/langgraph-stategraph.svg)

Bir tane .`StateGraph`Üç şey var.

1. **State.**Bir typed dict (TypedDict veya Pydantic model), grafiğe girecek 中流动── her düğüm tam bir durum alır, kısmi bir güncelleme döndürürür, LongGraph her alanı kullanır 应对的 *reducer* 它们的结合:对于应积的列表使用 `operator.add`,默认则覆盖──
2. **Nodes.**Python fonksiyonları `state -> partial_state`
3. **Edges.**düğümler arasındaki geçişler。Stik kenarlar 指向固定位置。Şartlı kenarlar 接收一个路由函数 `state -> next_node_name`, grafik model çıkışına göre paylaşabilir.

Bu grafiği birleştirir. Topolojiyi bir kontrol noktası ekler.`thread_id`调用它──每个执行步骤都会持久化一个以 `(thread_id, checkpoint_id)`Anahtar kontrol noktası.

### Çıkarma yeteneği

**Checkpointing.**Her node geçişinde yeni bir durum oluşturulur.`thread_id`Yeniden düzenleme grafik 即可再開──graph 会从暂停的位置继续──

**Interrupts.**Kullan .`interrupt_before=["human_review"]`标记一个节点,执行 会在该节点 运行前停止――状态 会被持久化――你的API向用户 返回等待批准──之后对同一个 `thread_id`发起带有 `Command(resume=...)`Çekilme işlemini yeniden başlatabilirsiniz.

**Streaming.** `graph.stream(state, mode="updates")`Bölgeye dönerken ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver ıver `mode="messages"`会 stream model düğümleri 内部的LLM tokens──`mode="values"`Uygulama süresinde hangi fotoğrafı göstereceğinizi seçebilirsiniz.

**Time-travel.** `graph.get_state_history(thread_id)`返回完整检查点日志──把任意之前的 `checkpoint_id`- Söyledikleri .`graph.invoke`,you就能从那个点叉──它很适合调试如果模型当时选择工具 B 会怎样?),也适合回归测试,用于重播生产痕迹──

### Kısaltıcılar 才是重点

Her eyalet alanında bir azaltıcı var. Çoğu defa bu değişikliğin farkı yoktur.`operator.add`Bu şekilde yeni mesajlar eklenecek, yerine değiştirilecek. Düz kenarları birleştirmek için bir redüksiyon kullanılacak.`messages`Ama sen unutmuşsun .`Annotated[list, add_messages]`İkinci toplantı da biter, yarım satır içerik kaybedeceksin. Kütüphanede sadece küçük bir şey vardır.

### ReAct grafik dört düğüm

Bir üretim ReAct ajanı dört düğümden oluşuyor

1. `agent` 用当前 mesaj tarihi 调用 LLM。返回助手メッセージ(其中可能包含工具_calls) 』
2. `tools` 执行最后一条助手消息 中的所有工具_calls,并把工具结果 作为工具消息添加进去──
3. - Evet .`agent`Bir şartlı kenar: Eğer son mesaj bir araç çağrıları varsa,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `tools`,否则到 `END`- Evet.
4. - Evet .`tools`Geri dön .`agent`Çekilmiş bir kenar.

İşte böyle. 40 行代码 kullanırken tam bir ReAct döngüsü elde edebilirsiniz. Düşün → Eylem → Gözlem → Düşünce → ...), aynı zamanda kontrol noktası、 kesintiler 和 akışlılık vardır.

### StateGraph vs Send (Fanout)

`Send(node_name, state)`允许一个节点发送平行子图――例:agent决定同时 query 三个 retrievers──每个 `Send`Şehir bir hedef düğümün paralel çalıştırmasını oluşturur; bunların çıkışları, durum azaltıcı birleşimi ile gerçekleşir. Bu, LangGraph'in, örgü primitiflerini kullanmadan orkestrasyoncu-işçilerin örneğini ifade etme şekliyle gerçekleşir.

### Altyazılar

Bir toplanmış grafik başka bir grafik olarak kullanılabilir. İçeriden bir düğüm görülebilir. İçeriden bir grafik görülebilir. Kendi eyaletine ve kendi kontrol noktalarına sahip olmak gerekir.


```figure
l5-state-graph-ledger
```

## Yapın onu.

### 步骤 1: durum ve düğümler

```python
from typing import Annotated, TypedDict
from langchain_core.messages import AnyMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver

class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]

def agent_node(state: State) -> dict:
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

def should_continue(state: State) -> str:
    last = state["messages"][-1]
    return "tools" if getattr(last, "tool_calls", None) else END

tool_node = ToolNode(tools=[search_web, read_file])

graph = StateGraph(State)
graph.add_node("agent", agent_node)
graph.add_node("tools", tool_node)
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
graph.add_edge("tools", "agent")

app = graph.compile(checkpointer=MemorySaver())
```

`add_messages`Bu mesaj listesi  toplamayı değil, kapsamayı azaltmayı unutmak için en yaygın LangGraph hatalarıdır.

### 步骤 2: bir iple çalıştır

```python
config = {"configurable": {"thread_id": "user-42"}}
for event in app.stream(
    {"messages": [HumanMessage("find the Anthropic headquarters address")]},
    config,
    stream_mode="updates",
):
    print(event)
```

Her güncelleme bir dikt .`{node_name: state_delta}` Your frontend can these streams to UI, let users seeagent is thinking... is using search_web... get to results... is reply

### 步骤 3: 添加 insan-in-the-loop kesintisi

Bir düğüm işaretle, çalıştırılmadan önce çalıştırılmasını durdur.

```python
app = graph.compile(
    checkpointer=MemorySaver(),
    interrupt_before=["tools"],  # pause before every tool call
)

state = app.invoke({"messages": [HumanMessage("delete the production database")]}, config)
# state["__interrupt__"] is set. Inspect proposed tool calls.
# If approved:
from langgraph.types import Command
app.invoke(Command(resume=True), config)
# If denied: write a rejection message and resume
app.update_state(config, {"messages": [AIMessage("Blocked by human reviewer.")]})
```

Durum, kontrol noktası ve düğümler, kesintiler arasında devamlı varlık vardır.

### 4 adım: Zaman yolculuğu için

```python
history = list(app.get_state_history(config))
for snapshot in history:
    print(snapshot.values["messages"][-1].content[:80], snapshot.config)

# Fork from a prior checkpoint
target = history[3].config  # three steps back
for event in app.stream(None, target, stream_mode="values"):
    pass  # replay from that point forward
```

- Ne ?`None`输入 传入 olarak, verilen kontrol noktasının tekrar oynatılmasından; 传入 olarak bir değer, yeniden başlatılırken önde bırakılır.

### 步骤 5: Çekilin yerine üretim ortamı için

```python
from langgraph.checkpoint.postgres import PostgresSaver

with PostgresSaver.from_conn_string("postgresql://...") as checkpointer:
    checkpointer.setup()
    app = graph.compile(checkpointer=checkpointer)
```

SQLite、Redis 和 Postgres hepsi sunuldu.`MemorySaver`Testler için kullanılıyor. Sürekli var olan her şeyi yeniden başlatmak için gerçek bir mağazayı kullanmalıyız.

## 技能

> Sen ajanları grafikler için inşa ediyorsun, değil mi?`while True`Çubuklar.

LangGraph kullanmadan önce, önce 60 saniyelik bir tasarım yapın:

1. **命名 nodes。**Her ayrılık kararı veya yan etkisi olan eylem bir düğümdür. Ajan, Aktı çalıştırır Reviewer Response akışlarını onaylar 🏻 Eğer bunları yapmazsan, bu görev de 形状の 代理ı yok.
2. **声明 state。**En az Tipleme Dikti kullan,并为每个列表字段配减机.`messages`;把 görev-özel alanlar(one working `plan`Bir tane.`budget`Bir karşıtı`retrieved_docs`list) yükseltilmiş en üst seviyeye kadar.
3. **画出 edges。**Sonraki adım, model çıkışına bağlı değilse, sabit kullanmak gerekir.
4. **一开始就选择 checkpointer。**Testler `MemorySaver`Postgres/Redis/SQLite ile ilgili diğer durumlar.
5. **在 tools 运行前决定 interrupts，而不是运行后。**Onaylar  yan etkileme düğümünün kenarına yerleştirilmelidir, böylece etki etmeden önce iptal edilebilir; geçerlilik  model  çıkış sonrası kenarına yerleştirilmelidir, böylece düşük maliyetli kötü çağrıları reddedebilirsiniz.
6. **默认 stream。**Kullanıcı kullanımı`mode="updates"`,model düğümleri  içi token seviyesinde akış kullan `mode="messages"`,ev 期间 tüm anlık fotoğraflar kullan `mode="values"`- Evet.

拒绝发布没有检查点的 LangGraph代理──拒绝发布在副作用后才中断的 LangGraph代理──拒绝发布 `messages`alan 没有使用 `add_messages`作为减肥的LangGraph代理──

## 练习

1. **Easy.**Kulübatör aracı ve web arama aracı 实现上面的四节 ReAct graph──验证对一个两转对话,`list(app.get_state_history(config))`En azından dört kontrol noktasına dön.
2. **Medium.**Bir tane ekle.`agent`之前运行的 `planner`Kodu,并向状态 写入结构化的 `plan: list[str]`❖ 让 `agent`Planlama adımlarını yap.`plan`Kontrol noktası devamı 后丢失(reducer 错误),测试应失败。
3. **Hard.**构建一个监督图,使用 `Send`Üç alt çizgi içinde`researcher`- Evet.`writer`- Evet.`reviewer`) arasında rota. Her altgrafın kendi durumuna ve kontrol noktasına sahip.`interrupt_before=["writer"]`İnsanın araştırma raporunu onaylaması için, bir kontrol noktasından zaman yolculuğu yapması için, sadece çatal dalını yeniden çalıştırması için onaylanmıştır.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| StateGraph | “LangGraph graph” | 你在 compile 前向其中添加 nodes 和 edges 的 builder object。 |
| Reducer | “field 如何 merge” | 当 node 返回某个 field 的 update 时应用的函数 `(old, new) -> merged`；默认是 overwrite，`add_messages` 会 append。 |
| Thread | “一个 conversation ID” | 一个 `thread_id` 字符串，用于限定一个 session 的所有 checkpoints。 |
| Checkpoint | “一个 paused state” | node transition 后完整 graph state 的持久化 snapshot，以 `(thread_id, checkpoint_id)` 为 key。 |
| Interrupt | “暂停等待 human” | `interrupt_before` / `interrupt_after` 会在 node boundary 停止 execution；用 `Command(resume=...)` resume。 |
| Time-travel | “从之前的 step fork” | `graph.invoke(None, config_with_old_checkpoint_id)` 会从该 checkpoint 向前 replay。 |
| Send | “Parallel subgraph dispatch” | node 可以返回的 constructor，用于 spawn N 个 target node 的 parallel executions。 |
| Subgraph | “作为 node 的 compiled graph” | 在另一个 graph 中作为 node 使用的 compiled StateGraph；保留自己的 state scope。 |

## 延伸阅读

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) StateGraph、reducers、checkpointers 和 interrupts 权威参考──
- [LangGraph concepts: state, reducers, checkpointers](https://langchain-ai.github.io/langgraph/concepts/low_level/)Bu ders kullanımı, doğrudan resmi kaynaklardan geliyor.
- [LangGraph Persistence and Checkpoints](https://langchain-ai.github.io/langgraph/concepts/persistence/) 关于 Postgres/SQLite/Redis stores、checkpoint namespaces 和 thread IDs 的细节──
- [LangGraph Human-in-the-loop](https://langchain-ai.github.io/langgraph/concepts/human_in_the_loop/) `interrupt_before`- Evet.`interrupt_after`- Evet.`Command(resume=...)`和 edit-state modelı
- [Yao et al., "ReAct: Synergizing Reasoning and Acting in Language Models" (ICLR 2023)](https://arxiv.org/abs/2210.03629) Her LangGraph ajanı gerçekleştirilen bir örneğe sahiptir; okuyunca mantık izlerini anlayabilirsiniz.
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) Açıklamak gerekir hangi grafik şekilleri seçmek için (→ Chain  Router  Orchestrator  Workers  Evaluator  Optimizer)
- Eğlence Arama Fase 11 · 09 (Fonksiyon Arama)  Her LangGraph ajan düğüm 复用工具-call primitivi。
- Fase 11 · 14 (Model Kontekst Protokolü)  Dış Departman Araç keşfi, MCP adaptörü ile yapılabilir 接入 LangGraph `ToolNode`- Evet.
- EY 11 · 17 (Agent çerçeve pazarlamaları)  何時選択 LangGraph, CrewAI、AutoGen veya Agno¬ yerine
