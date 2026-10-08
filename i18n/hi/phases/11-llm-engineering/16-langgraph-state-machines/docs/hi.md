# LangGraph  एजेंट की राज्य मशीनें

> हस्तलिखित प्रतिक्रिया लूप एक है `while True`◊ LangGraph 写的 ReAct लूप एक ग्राफ है, आप इसके लिए चेकपॉइंट, इंटरट्रुट, शाखा, और समय यात्रा कर सकते हैं।

**Type:** Build
**Languages:** Python
**前置要求:**चरण 11 · 09 (फंक्शन कॉल), चरण 11 · 14 (मॉडल कॉन्टेक्स्ट प्रोटोकॉल)
**Time:** ~75 minutes

## 问题

आप एक फ़ंक्शन-कॉल एजेंट को जारी करते हैं. यह सामान्य रूप से चल रहा है, फिर समस्याएं आती हैंः मॉडल 500 के लिए एक वापसी उपकरण का उपयोग करने का प्रयास करता है, उपयोगकर्ता अपने विचार को बदलने के लिए एक मिशन के दौरान, या एजेंट बिना किसी मानव हस्ताक्षर के आदेश को वापस करने का निर्णय लेता है।`while True:`लूप  बिना हुक 😇 आप इसे रोक नहीं सकते, इसे वापस नहीं कर सकते, इसे भी नहीं निकाल सकते  यदि मॉडल उस समय एक और उपकरण चुनता है 会怎样── एक बार जब आप इसे डेमो से वास्तविक वातावरण में ले जाते हैं, तो एजेंट एक ब्लैक बॉक्स में बदल जाता हैः या तो सफलता, या असफलता 😇

एक बार जब आप इस बिंदु को देखते हैं, तो अगला कदम बहुत स्पष्ट है। एजेंट 本来就是 एक स्टेट मशीनः सिस्टम प्रॉम्प्ट加 संदेश इतिहास,加 pending tool calls,再加下一步行动.

LangGraph यह इस तरह के अमूर्तता की लाइब्रेरी प्रदान करता है। यह LangChain के अर्थ में एजेंट फ्रेमवर्क नहीं है।

## 概念

![LangGraph StateGraph: nodes, edges, and the checkpointer](../assets/langgraph-stategraph.svg)

एक `StateGraph`वहाँ तीन चीजें हैं.

1. **State.**एक टाइप किया गया डिक्ट (typeDict या Pydantic model), ग्राफ में होगा 中流动── प्रत्येक नोड को पूर्ण स्थिति प्राप्त होगी, फिर आंशिक अपडेट लौटाएगा, LangGraph प्रत्येक फ़ील्ड को उपयोग करेगा`operator.add`,默认则覆盖──
2. **Nodes.**पायथन फ़ंक्शंस `state -> partial_state` प्रत्येक नोड एक अलग कदम हैः कॉल मॉडलrun उपकरणसंक्षेप
3. **Edges.**नोड्स के बीच संक्रमणों──स्थिर किनारे 指向固定位置──सर्त किनारे 接收一个路由函数 `state -> next_node_name`, चलो ग्राफ मॉडल आउटपुट के आधार पर विभाजित किया जा सकता है

आप इस ग्राफ को संकलित करेंगे. आप एक चेकपॉइंटर को जोड़ सकते हैं. लेकिन उत्पादन के लिए यह महत्वपूर्ण है. आप इसे एक रन करने योग्य में वापस कर सकते हैं. आप प्रारंभिक स्थिति के साथ हैं.`thread_id`调用它── प्रत्येक निष्पादन चरण                                                                                                                                                                                                                                                           `(thread_id, checkpoint_id)` मुख्य चेक पॉइंट

### चार प्रकार की क्षमता

**Checkpointing.**प्रत्येक नोड संक्रमण शहर में एक नया राज्य 写入店 测试用 in-memory,prod 用 Postgres/Redis/SQLite) ⋅ 用同一个 `thread_id`पुनः पुनः अनुसूची का प्रयोग करना 即可再起──graph 会从暂停的位置继续──

**Interrupts.**उपयोग `interrupt_before=["human_review"]`标记一个节点,执行 会在该节点 运行前停止――状态 会被持久化――你的API向用户 返回等待批准──之后对同一个 `thread_id`发起带有 `Command(resume=...)`का अनुरोध है कि निष्पादन को फिर से शुरू किया जा सके।

**Streaming.** `graph.stream(state, mode="updates")`                                                                                                                                                                                                                                                              `mode="messages"`会 धारा मॉडल नोड्स 内部的 LLM टोकन──`mode="values"`आप UI में किस प्रकार का प्रदर्शन कर सकते हैं।

**Time-travel.** `graph.get_state_history(thread_id)` लौटें पूर्ण चेकपॉइंट लॉग `checkpoint_id`传给 `graph.invoke`,आप उस बिंदु कांटा से प्राप्त कर सकते हैं. यह डिबगिंग के लिए बहुत उपयुक्त है.

### घटाने वाले 才是重点

प्रत्येक राज्य क्षेत्र में एक रिड्यूसर है। अधिकांश默认行为都没问题:新值覆盖旧值.`operator.add`, इस तरह नए संदेशों को जोड़ना होगा, बजाय प्रतिस्थापित करना होगा. समानांतर किनारे होगा के माध्यम से घटाने के विलय  के अद्यतनों.`messages`, और तुम भूल गए .`Annotated[list, add_messages]`, दूसरा सत्र शांत हो जाएगा, आप आधा दौर सामग्री खो देंगे.

### चार नोड्स का ReAct ग्राफ

एक उत्पादन ReAct एजेंट द्वारा चार नोड्स 和两条边缘 组成:

1. `agent` 用当前 संदेश इतिहास 调用 LLM──返回 सहायक संदेश(其中可能包含工具_calls)──
2. `tools`  निष्पादन अंतिम 条 सहायक संदेश 中 सभी tool_calls,并把 tool results 作为 tool messages append 进去──
3. से `agent`एक सशर्त किनारा: यदि अंतिम संदेश कोई उपकरण_कॉल है, तो मार्ग तक`tools`,否则到 `END`
4. से `tools`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `agent`की एक स्टैटिक किनारा

यही है। आप लगभग 40 行代码 का उपयोग कर, पूर्ण ReAct लूप प्राप्त कर सकते हैं।

### StateGraph बनाम Send(fanout)

`Send(node_name, state)`允许一个节点发送并行子图――例:agent decide同时 query 三个 retrievers──每个 `Send`शहर एक बार लक्ष्य नोड के समानांतर निष्पादन को उत्पन्न करता है; उनके आउटपुट राज्य घटाने वाले विलय के माध्यम से आते हैं। यह लैंगग्राफ में थ्रेडिंग आदिमताओं का उपयोग न करने के मामले में ऑर्केस्ट्रेटर-कार्यकर्ताओं के पैटर्न को व्यक्त करने का तरीका है।

### उपग्राफ

एक संकलित ग्राफ एक अन्य ग्राफ के रूप में किया जा सकता है मध्य नोडों का एक बाहरी ग्राफ  देखें एक एकल नोड है; आंतरिक ग्राफ  अपने स्वयं के राज्य और अपने स्वयं के चेकपोइंट्स का मालिक है  यही है टीम निर्माण पर्यवेक्षक-कामगार एजेंटों का तरीकाः पर्यवेक्षक ग्राफ उपयोगकर्ता इरादा मार्ग को किसी डोमेन कार्यकर्ता उपग्राफ तक लाएगा 👇


```figure
l5-state-graph-ledger
```

##  इसे निर्माण

### 步骤 1: राज्य और नोड्स

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

`add_messages`यह संदेश सूची को संकलित करने के बजाय कवर करने के लिए एक कमी है। भूल जाओ यह सबसे आम LangGraph बग है।

### 步骤 2: एक धागे के साथ चलें

```python
config = {"configurable": {"thread_id": "user-42"}}
for event in app.stream(
    {"messages": [HumanMessage("find the Anthropic headquarters address")]},
    config,
    stream_mode="updates",
):
    print(event)
```

हर अद्यतन एक आदेश है`{node_name: state_delta}`आपका फ्रंटेंड इन स्ट्रीम को यूआई में ले जा सकता है, उपयोगकर्ताओं को एजेंट सोच रहा है एजेंट खोज_वेब को संचालित कर रहा है उत्पाद प्राप्त कर रहा है उत्तर दे रहा है 

### 步骤 3: 添加 मानव-इन-द-लूप में बाधित

标记一个节点,让执行在它运行之前暂停.

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

राज्य  चेकपॉइंट 和 थ्रेड  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर  ट्रिगर 

### 步骤 4: समय यात्रा के लिए प्रयोग

```python
history = list(app.get_state_history(config))
for snapshot in history:
    print(snapshot.values["messages"][-1].content[:80], snapshot.config)

# Fork from a prior checkpoint
target = history[3].config  # three steps back
for event in app.stream(None, target, stream_mode="values"):
    pass  # replay from that point forward
```

`None`作为输入 传入,会从给定的检查点重播;传入一个值,则会在复习前将其作为更新添加到该检查点的状态上. 作为输入 传入,会从给定的检查点重播;传入一个值,则会在复习前将其作为更新添加到该检查点的状态上.

### 步骤 5: उत्पादन पर्यावरण के लिए चेक पॉइंट की प्रतिस्थापन

```python
from langgraph.checkpoint.postgres import PostgresSaver

with PostgresSaver.from_conn_string("postgresql://...") as checkpointer:
    checkpointer.setup()
    app = graph.compile(checkpointer=checkpointer)
```

SQLite、Redis 和 Postgres 都已提供──`MemorySaver`परीक्षणों के लिए प्रयोग किया जाता है। किसी भी चीज़ को पुनः आरंभ करने की आवश्यकता होती है जो स्थायी रूप से मौजूद है, उसे वास्तविक स्टोर का उपयोग करना चाहिए।

##  कौशल

> आप एजेंटों को ग्राफ के लिए निर्माण करते हैं, बजाय `while True`लूप्स

之前使用LangGraph, पहले एक 60 सेकंड डिजाइन करेंः

1. **命名 nodes。**प्रत्येक विघटन निर्णय या साइड इफेक्टिंग एक्शन एक नोड है। एजेंट सोचता है कि  उपकरण चलता है  समीक्षक  प्रतिक्रिया प्रवाह  को मंजूरी देता है  यदि आप उन्हें नहीं छोड़ते हैं, तो यह कार्य 形状── एजेंट भी नहीं है।
2. **声明 state。**प्रयोग न्यूनतम टाइप किया गयाDict,并为每一个列表字段 配减小器──不要把一切都塞进`messages`;把 कार्य-विशिष्ट क्षेत्र`plan`、 एक `budget`काउंटर एक`retrieved_docs`सूची) शीर्ष स्तर पर उन्नत किया गया है
3. **画出 edges。**इसके अलावा अगले चरण मॉडल आउटपुट पर निर्भर करता है, अन्यथा स्थिर उपयोग करना है। प्रत्येक सशर्त किनारे को शाखाओं के नामित रूटर फ़ंक्शन की आवश्यकता होती है।
4. **一开始就选择 checkpointer。**प्रयोग`MemorySaver`Postgres/Redis/SQLite के साथ अन्य दृश्यों में पोस्टग्रेस/रेडिस/SQLite के साथ अन्य दृश्यों में पोस्टग्रेस/रेडिस/SQLite के साथ पोस्टग्रेस/रेडिस/SQLite के साथ पोस्टग्रेस/रेडिस/SQLite के साथ पोस्टग्रेस/रेडिस/SQLite के साथ पोस्टग्रेस/रेडिस/SQLite के साथ पोस्टग्रेस/रेडिस/SQLite के साथ पोस्टग्रेस/रेडिस/SQLite के साथ पोस्टग्रेस/रेडिस/SQLite के साथ पोस्टग्रेस/रेडिस/SQLite के साथ पोस्टग्रेस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/रेडिस/
5. **在 tools 运行前决定 interrupts，而不是运行后。**अनुमोदन  को साइड-इफेक्टिंग नोड के किनारे पर रखा जाना चाहिए, ताकि आप प्रभावित होने से पहले रद्द कर सकें; सत्यापन  को मॉडल  आउटपुट के बाद किनारे पर रखा जाना चाहिए, ताकि आप कम लागत पर बुरे कॉल को अस्वीकार कर सकें।
6. **默认 stream。**यूज़ करें`mode="updates"`, मॉडल नोड्स  आंतरिक टोकन स्तर स्ट्रीमिंग `mode="messages"`,भारी अवधि के पूर्ण स्नैपशॉट`mode="values"`

拒绝发布没有检查点的 LangGraph代理──拒绝发布在副作用后才中断的 LangGraph代理──拒绝发布 `messages`फ़ील्ड 没有使用 `add_messages`作为减轻剂的兰格拉夫代理──

## अभ्यास

1. **Easy.**उपयोग करें कैलकुलेटर उपकरण 和 वेब-खोज उपकरण 实现 ऊपर के चार नोड ReAct ग्राफ──验证对于一个两转对话,`list(app.get_state_history(config))`कम से कम चार चेकपोस्ट पर वापस जाएं।
2. **Medium.**添加一个在 `agent`之前运行的 `planner`नोड,并向状态 写入结构化的 `plan: list[str]`让 `agent`                                                                                                                                                                                                                                                              `plan`后丢失 (पछि丢失) 错误 (कम करने वाला)
3. **Hard.**构建一个监督图,使用 `Send`तीन उपग्राफों में`researcher``writer``reviewer`) बीच मार्ग― प्रत्येक उपग्राफ के पास अपनी स्थिति तथा चेक पॉइंटर― बाह्य ग्राफ में ऊपर जोड़ा गया है`interrupt_before=["writer"]`, मानव अनुसंधान संक्षिप्त अनुमोदन कर सकते हैं.

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

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) StateGraph、reducers、checkpoints 和 interrupts के अधिकार संदर्भ
- [LangGraph concepts: state, reducers, checkpointers](https://langchain-ai.github.io/langgraph/concepts/low_level/) इस वर्ग का उपयोग मानसिक मॉडल, सीधे आधिकारिक स्रोत से प्राप्त
- [LangGraph Persistence and Checkpoints](https://langchain-ai.github.io/langgraph/concepts/persistence/) 关于 पोस्टग्रेस/SQLite/Redis स्टोर, चेकपॉइंट नामस्थान तथा थ्रेड आईडी के विवरण
- [LangGraph Human-in-the-loop](https://langchain-ai.github.io/langgraph/concepts/human_in_the_loop/) `interrupt_before``interrupt_after``Command(resume=...)`和 सम्पादन-राज्य पैटर्न
- [Yao et al., "ReAct: Synergizing Reasoning and Acting in Language Models" (ICLR 2023)](https://arxiv.org/abs/2210.03629) प्रत्येक लैंगग्राफ एजेंट के लिए एक पैटर्न को पूरा किया गया है; इसे पढ़कर तर्क के निशान के आधार पर समझ सकते हैं।
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) व्याख्या करना चाहिए कि किस समय कौन से ग्राफ आकार चुनें (→ श्रृंखला, राउटर, ऑर्केस्ट्रेटर-कार्यकर्ता, मूल्यांकनकर्ता-अनुकूलनकर्ता)
- चरण 11 · 09 (फंक्शन कॉलिंग)  प्रत्येक लैंगग्राफ एजेंट नोड 复用工具-कॉल आदिम──
- चरण 11 · 14 (मॉडल कॉन्टेक्स्ट प्रोटोकॉल)  बाहरी उपकरण खोज, MCP एडाप्टर के माध्यम से 接入 LangGraph `ToolNode`
- चरण 11 · 17 (एजेंट फ्रेमवर्क ट्रेडऑफ)  何時選擇 LangGraph, बजाय CrewAI、AutoGen या Agno。
