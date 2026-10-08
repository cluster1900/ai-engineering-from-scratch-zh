# آلات الدولة من وكيل LangGraph 

> الخطوط اليدوية لـ ReAct loop هي واحد`while True` استخدام لنجغراف 写的 ReAct loop هو رسم بياني، يمكنك أن تتعامل مع نقطة التفتيش، والانقطاع، والفروع، والقيام بالسفر عبر الزمن.

**Type:** Build
**Languages:** Python
**前置要求:**المرحلة 11 · 09 (تدعيم الوظائف) ، المرحلة 11 · 14 (مثال بروتوكول السياق)
**Time:** ~75 minutes

## 问题

أنت أصدرت وكيل يدعو وظيفة. كان يعمل بشكل طبيعي، ثم خرجت مشكلة: النموذج  حاول استخدام أداة للعودة 500، المستخدم في طريق المهمة تغيير رأيه، أو وكيل في حالة عدم وجود موافقة بشرية  قرر إعادة طلب.`while True:`لو كانت النموذج تختار أداة أخرى، فسوف يُمكنك أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول أن تُحاول.

عندما ترى هذا النقطة ، فإن الخطوة التالية واضحة جدا. العميل 本来就是 جهاز حالة: نظام سريع加 إرسال تاريخ ،加 منتظر أداة مكالمات ، إضافة الخطوة التالية.

إنّها مكتبة لتلك الاستخفافات. إنها ليست إطار عميل على مقارنة بالخطوط اللانج تشين.

## 概念

![LangGraph StateGraph: nodes, edges, and the checkpointer](../assets/langgraph-stategraph.svg)

واحد`StateGraph`هناك ثلاثة أشياء

1. **State.**سيتم استخدام كل حقل على الجهاز *مخفض* لدمجها: لجنة التجميع استخدام`operator.add`,默认则覆盖♪
2. **Nodes.**وظائف Python `state -> partial_state`كل عقدة هي خطوة انفصال: دعوة النموذجإدارة الأدواتإجمال。
3. **Edges.**العقد  بين الانتقالات。 الحواف الدولية 指向固定位置。 الحواف الشروطية 接收一个路由函数 `state -> next_node_name`، دع الرسم البياني يمكن أن تتم استنادا إلى النموذج المخرجة

سوف تجمع هذا الرسم البياني. تجمع جدول التجميع، اضيف نقطة التفتيش.`thread_id`كل خطوة تنفيذية ستستمر`(thread_id, checkpoint_id)`نقطة تفتيش رئيسية

### أربعة أشكال

**Checkpointing.**كل مرة تنتقل فيها العقدة ستضع حالة جديدة في المتجر`thread_id`إعادة استخدام الرسم البياني 即可恢复── الرسم البياني 会从暂停的位置继续──

**Interrupts.**استخدام`interrupt_before=["human_review"]`标记一个节点,执行 会在该节点 运行前停止――状态 会被持久化――你的API向用户 返回等批准──之后对同一个 `thread_id`发起带有 `Command(resume=...)`طلب استئناف الإنفاذ

**Streaming.** `graph.stream(state, mode="updates")`في الدول الديلتية تحدث تسليمة`mode="messages"`أعمال النموذج التدفق 内部的LLM tokens──`mode="values"`سوف تُعطي صورًا كاملة. يمكنك اختيار أي نوع من هذه الصور يمكن عرضها في واجهة المستخدم.

**Time-travel.** `graph.get_state_history(thread_id)`عودوا إلى سجل المراقبة الكاملة`checkpoint_id`إرسال`graph.invoke`,你就能从那个点叉──它很适合调试如果模型当时选择工具B 会怎么?),也适合回归测试,用于重播生产痕迹──

### القلصات هي التركيز

كل حقل دولي لديه خفضات. معظم المعلومات المتضمنة ليست مشكلة.`operator.add`، مثل هذه الرسائل الجديدة سوف تضيف بدلا من استبدالها.`messages`و أنت نسيت`Annotated[list, add_messages]`، في المرحلة الثانية سوف تفقد نصف الجولة من المحتوى.

### الرسم البياني ReAct أربعة عقدة

وكيل ReAct من أربع عقدات 和两条边缘 组成:

1. `agent` 用当前消息史 调用 LLM──返回助手消息(其中可能包含工具_calls)──
2. `tools` 执行最后一条助手消息 中所有工具_calls,并把工具结果 作为工具消息添加进去──
3. من`agent`إصدار خط مشروط: إذا كانت الرسالة الأخيرة لديها أداة_اتصال، ثم الطريق إلى `tools`، وإلا حتى `END`.
4. من`tools`إلى`agent`                                                                                                                                                                                                                                                              

هذا هو الحال. يمكنك استخدام حوالي 40 行代码، على أن تحصل على حلقة كاملة ReAct ((فكر → العمل → الملاحظة → التفكير → ...) ، في الوقت نفسه مع التفتيش والتقاطع و التدفقات.

### (سيتجراف vs إرسال)

`Send(node_name, state)`允许一个节点发送平行子图案:مثلا:وكيل decide同时 query 三个 retrievers。每个 `Send`ستؤدي المدينة إلى تنفيذ متوازي لعقدة هدف؛ وتخرجاتها ستتم عبر دمج مخفض الحالة. هذا هو طريقة LangGraph في حالة عدم استخدام الأصول البدائية للتعبير عن نمط الموسيقي العاملين.

### المخطوطات الفرعية

يمكن أن يكون الرسم البياني المجمّع كمرسمة أخرى من العقدة في وسطها. الرسم البياني الخارجي هو رؤية عقدة واحدة. الرسم البياني الداخلي لديه حالة خاصة به ومواقع تفتيش خاصة به.


```figure
l5-state-graph-ledger
```

## بناءها

### 步骤 1: الحالة والعقد

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

`add_messages`هو جعل قائمة الرسائل  جمع بدلا من تخفيض تغطية ‬ نسي أنه الأكثر شيوعا لاندغراف خطأ ‬

### 步骤 2: تشغيل مع خيط

```python
config = {"configurable": {"thread_id": "user-42"}}
for event in app.stream(
    {"messages": [HumanMessage("find the Anthropic headquarters address")]},
    config,
    stream_mode="updates",
):
    print(event)
```

كل تحديث هو أمر`{node_name: state_delta}` يمكنك أن تُضيف هذه التدفقات إلى UI، دع المستخدمين يرون عميل يفكّر... يستخدم البحث_الويب... يحصل على النتيجة... يجيب

### الخطوة الثالثة: إضافة الإنسان في الحلقة المقاطعة

علامة على عقدة، دع تنفيذها في فترة توقف قبل أن يتم تشغيله.

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

الحالة 、 نقطة التفتيش و الخيوط ٬ مدة طويلة ٬ وجودها ٬ ما عدا خلال الإجراءات ٬ لا يوجد شيء موجود فقط في الذاكرة

### الخطوة الرابعة: استخدامها في السفر عبر الزمن

```python
history = list(app.get_state_history(config))
for snapshot in history:
    print(snapshot.values["messages"][-1].content[:80], snapshot.config)

# Fork from a prior checkpoint
target = history[3].config  # three steps back
for event in app.stream(None, target, stream_mode="values"):
    pass  # replay from that point forward
```

- لا .`None`作为输入 传入,会从给定的检查点重播;传入一个值,则会在恢复前将它作为更新添加到该检查点状态上.这是你在不重启整个对话的情况下重现一次坏的代理运行的方式.

### الخطوة 5: استبدال نقطة التفتيش للإنتاج

```python
from langgraph.checkpoint.postgres import PostgresSaver

with PostgresSaver.from_conn_string("postgresql://...") as checkpointer:
    checkpointer.setup()
    app = graph.compile(checkpointer=checkpointer)
```

تم توفير SQLite、Redis 和 Postgres`MemorySaver`لأجل الاختبارات.. أي شيء يحتاج إلى إعادة تشغيل..

## 技能

> أنت تُبني العملاء للاستعراضات، بدلاً من ذلك`while True`حلقات

قبل استخدام LangGraph، أولاً قم بتصميم 60 ثانية:

1. **命名 nodes。**كل قرار انفصال أو عمل إضافي هو عقدة. العميل يعتقد أن الأداة تعمل. المراجع يوافق على تدفقات الاستجابة.
2. **声明 state。**استخدم أدنى نوع من القسم،并为每一个列表字段 配减剂──不要把一切都塞进`messages`;把 المهام الخاصة الحقول`plan`واحد`budget`العداد`retrieved_docs`القائمة) ارتفعت إلى أعلى مستوى
3. **画出 edges。**إلا أن الخطوة التالية تعتمد على إصدار النموذج، وإلا استخدم ثابتة.
4. **一开始就选择 checkpointer。**اختبارات`MemorySaver`, Other scenarios with Postgres/Redis/SQLite― لا تنشر في حالة عدم وجود نقطة التفتيش  بدون نقطة التفتيش ‬ لا استئناف ‬ لا توقف ‬ لا رحلة زمنية‬
5. **在 tools 运行前决定 interrupts，而不是运行后。**يجب وضع الموافقات على حافة العقدة التي تؤثر جانباً، حتى تتمكن من إبطال التأثير قبل التأثير؛ يجب وضع التحقق من التأثير على حافة النموذج بعد الناتج، حتى تتمكن من رفض المكالمات السيئة بتكلفة منخفضة.
6. **默认 stream。**مستخدم`mode="updates"`، النموذج العقدة  داخل إشارة مستوى التدفق مستخدم `mode="messages"`, صور كاملة خلال الفترة`mode="values"`.

رفض نشر بدون نقطة التفتيش عميل LangGraph. رفض نشر في الآثار الجانبية. بعد ذلك فقط انقطاع عميل LangGraph. رفض نشر.`messages`المجال 没有使用 `add_messages`كعامل لنجراف كحد من

## التدريب

1. **Easy.**استخدام أداة الحاسبة و أداة البحث على شبكة الإنترنت 实现 فوق أربعة عقدة ReAct الرسم البياني`list(app.get_state_history(config))`على الأقل عد إلى أربع نقاط تفتيش
2. **Medium.**إضافة واحدة في`agent`之前运行的 `planner`العقدة،并向状态 写入结构化的 `plan: list[str]`‬ ‫جعلي`agent`ضع خطط الخطوات على الخطوط المخططة`plan`في نقطة التفتيش استئناف 后丢失(قليل 错误) ،测试应失败。
3. **Hard.**构建一个监督图,使用 `Send`في ثلاث صور فرعية`researcher`.`writer`.`reviewer`(بين الطريق ) كل خط ذي الحالة لديها حالتها الخاصة و نقطة التفتيش )`interrupt_before=["writer"]`، دع البشر يوافقون على البحث المختصر. تأكيد من نقطة التفتيش السابقة.

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

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) الرسم البياني ‧القلصات ‧المؤشرات و القاطعات
- [LangGraph concepts: state, reducers, checkpointers](https://langchain-ai.github.io/langgraph/concepts/low_level/) هذا النموذج العقلي المستخدم في هذه الدورة، مباشرة من المصدر الرسمي
- [LangGraph Persistence and Checkpoints](https://langchain-ai.github.io/langgraph/concepts/persistence/) 关于 Postgres/SQLite/Redis متاجر 查询点名区 和线程ID的细节──
- [LangGraph Human-in-the-loop](https://langchain-ai.github.io/langgraph/concepts/human_in_the_loop/) `interrupt_before`.`interrupt_after`.`Command(resume=...)`ووضع النمط
- [Yao et al., "ReAct: Synergizing Reasoning and Acting in Language Models" (ICLR 2023)](https://arxiv.org/abs/2210.03629) كل عامل لنجراف تم تحقيق النمط ؛ قراءة يمكن فهم أساس العقلية
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) شرح ينبغي أن يكون في何时 اختيار أي أشكال الرسم البياني ((سلسلة ‬الجهاز التوجيهي ‬المنشغلين الموسيقيين ‬المقيّمين ‬المنحسنين) ‬
- المرحلة 11 · 09 (تصل الوظيفة)  كل عقد عامل لنجراف 复用工具-call primitives。
- المرحلة 11 · 14 (مثال بروتوكول السياق)  اكتشاف أداة خارجية،可通过 MCP adapter 接入 LangGraph `ToolNode`.
- المرحلة 11 · 17 (تبادلات إطار العملاء)  何时选择 LangGraph، بدلا من CrewAI、AutoGen أو Agno。
