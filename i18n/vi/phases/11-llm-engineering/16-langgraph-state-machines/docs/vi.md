# LangGraph  Máy nhà nước của đại lý

> Chuyện viết tay của ReAct là một .`while True` Sử dụng LangGraph 写的 ReAct loop là một biểu đồ, bạn có thể đối mặt với nó kiểm soát điểm, gián đoạn, nhánh, và thực hiện thời gian đi lại.

**Type:** Build
**Languages:** Python
**前置要求:**Giai đoạn 11 · 09 (Tạm dịch gọi), Giai đoạn 11 · 14 (Phát giao thức ngữ cảnh mô hình)
**Time:** ~75 minutes

## 问题

Bạn phát hành một đại lý gọi chức năng. Nó chạy bình thường, sau đó xuất hiện một vấn đề: mô hình cố gắng gọi một công cụ trả lại 500, người dùng thay đổi ý tưởng trong nhiệm vụ, hoặc đại lý trong trường hợp không có sự chấp thuận của con người quyết định trả lại đơn đặt hàng.`while True:`vòng không có móng, bạn không thể tạm dừng nó, không thể quay lại nó, cũng không thể phân叉 ra ngoài nếu mô hình lúc đó chọn một công cụ khác 会怎样── một khi bạn đưa nó từ demo 推向真实环境,agent就变成一个黑盒:要么成功,要么失败──

Một khi bạn nhìn thấy điều này, bước tiếp theo là rất rõ ràng. Một lần biểu đồ hình thức hóa, nhựa tự động có được bốn khả năng: kiểm tra điểm (checkpointing)  ở giữa các bước  lưu trữ trạng thái (), gián đoạn (暂停等待)  lưu trữ các token dòng và các sự kiện trung gian)  lưu trữ (streaming)  các token và các sự kiện trung gian), cũng như du lịch thời gian ( quay trở lại trạng thái trước đó,并尝试不同) 

LangGraph là thư viện cung cấp sự trừu tượng này. Nó không phải là một framework đại lý trong nghĩa LangChain.

## 概念

![LangGraph StateGraph: nodes, edges, and the checkpointer](../assets/langgraph-stategraph.svg)

Một `StateGraph`Có 3 thứ.

1. **State.**Một kiểu dict (((TypedDict hoặc mô hình Pydantic), sẽ trong biểu đồ 中流动。 mỗi nút đều nhận được trạng thái hoàn chỉnh, và quay lại một bản cập nhật một phần, LongGraph sẽ sử dụng mỗi trường đối với ứng dụng của *reducer* để hợp nhất chúng: đối với danh sách nên tích lũy  Sử dụng`operator.add`,默认则覆盖.
2. **Nodes.**Phụng chức năng Python `state -> partial_state`每个节点是一个离散步:call the modelrun toolssummarize。
3. **Edges.**Các nút  giữa các chuyển đổi. Các cạnh tĩnh 指向固定位置.`state -> next_node_name`, để biểu đồ có thể dựa trên mô hình đầu ra phân chia.

Bạn sẽ biên soạn biểu đồ này. Bạn sẽ biên soạn tập tập hợp topology, thêm một điểm kiểm tra.`thread_id`调用它. Mỗi bước thực hiện sẽ được kéo dài một cách dài.`(thread_id, checkpoint_id)`Vì điểm kiểm soát chính.

### 4 siêu năng lực

**Checkpointing.**Mỗi lần chuyển đổi nút sẽ đưa ra trạng thái mới 写入店 测试用 in-memory,prod 用 Postgres/Redis/SQLite) ⋅ 用同一个 `thread_id`Quá lần nữa điều chỉnh biểu đồ 即可恢复.

**Interrupts.**用 `interrupt_before=["human_review"]`标记一个节点,执行 会在该节点 运行前停止――状态 会被持久化――你的API向用户 返回等审批──之后对同一个 `thread_id`发起带有 `Command(resume=...)`                                                                                                                                                                                                                                                              

**Streaming.** `graph.stream(state, mode="updates")`会在州地域发生时 yield 它们.`mode="messages"`会 stream model node 内部的 LLM token──`mode="values"`Sẽ tạo ra những bức ảnh đầy đủ. Bạn có thể chọn trong UI hiển thị loại nào.

**Time-travel.** `graph.get_state_history(thread_id)`Trở lại toàn bộ nhật ký kiểm soát.`checkpoint_id`Chuyện này`graph.invoke`, bạn就能从那个点叉──它 rất phù hợp với debugging(如果模型当时选择工具B 会怎样?), cũng phù hợp với các thử nghiệm hồi quy, để chơi lại các dấu vết sản xuất──

### Các giảm 才是重点

Mỗi trường trạng thái đều có một người giảm đi. Hầu hết các hành vi默认都没问题:新值覆盖旧值.`operator.add`, như vậy các tin nhắn mới sẽ thêm, thay vì thay thế.`messages`, và anh quên `Annotated[list, add_messages]`, 2nd meeting quietly triumph out, you'll lose half round content―reducer is the only tiny thing in this library.

### Quảng cáo ReAct của bốn nút

Một đại lý sản xuất ReAct bởi bốn nút 和两条边缘 组成:

1. `agent` 用当前消息历史 调用 LLM。 trả lại thư trợ lý( trong đó có thể chứa tool_calls)。
2. `tools` 执行最后一条助手消息 中所有工具_call,并把工具结果 作为工具消息添加进去──
3. Từ `agent`Một điều kiện cạnh: Nếu tin nhắn cuối cùng có tool_calls, thì đường đến `tools`,否则到 `END`
4. Từ `tools`Trở lại`agent`                                                                                                                                                                                                                                                              

Chính vì vậy. Bạn sử dụng khoảng 40 行代码,就能获得完整 ReAct loop (Think → Action → Observation → Thought → ...), đồng thời có điểm kiểm soát, gián đoạn và streaming.

### StateGraph vs Send (được xem xét)

`Send(node_name, state)`允许一个节点发送平行子图. 例:agent quyết định đồng thời truy vấn 三个检索器.`Send`Thành phố tạo ra một lần thực hiện song song của nút mục tiêu; các sản phẩm của chúng sẽ được kết hợp bằng bộ giảm trạng thái. Đây là cách LangGraph biểu hiện mô hình nhạc công trong trường hợp không sử dụng nguyên thủy threading.

### Các phụ đề

Một biểu đồ được biên soạn có thể được coi như một biểu đồ khác trong các nút. Một biểu đồ bên ngoài nhìn thấy là một nút duy nhất; biểu đồ bên trong có trạng thái riêng và các điểm kiểm soát riêng của mình. Đây là cách của nhóm xây dựng các đại lý người giám sát: biểu đồ người giám sát sẽ hướng định ý định của người dùng đến một bộ phận người làm việc phụ tuyến.


```figure
l5-state-graph-ledger
```

##  xây dựng nó

### 步骤 1: trạng thái và nút

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

`add_messages`là để danh sách tin nhắn  tích lũy thay vì giảm phủ phủ.

### 步骤 2: chạy với một sợi dây

```python
config = {"configurable": {"thread_id": "user-42"}}
for event in app.stream(
    {"messages": [HumanMessage("find the Anthropic headquarters address")]},
    config,
    stream_mode="updates",
):
    print(event)
```

Mỗi bản cập nhật đều là một lời khuyên .`{node_name: state_delta}` Your frontend can put these streams into UI, let users seeagent is thinking... đang điều chỉnh search_web... nhận được kết quả... đang trả lời

### 步骤 3: 添加 người trong vòng tròn gián đoạn

Đánh dấu một nút, để việc thực hiện dừng lại trước khi nó chạy.

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

State、checkpoint 和 thread 都会跨中断 持久存在── ngoại trừ thời gian thực hiện, không có gì chỉ tồn tại trong bộ nhớ──

### Bước 4: Sử dụng để điều tra thời gian đi du lịch

```python
history = list(app.get_state_history(config))
for snapshot in history:
    print(snapshot.values["messages"][-1].content[:80], snapshot.config)

# Fork from a prior checkpoint
target = history[3].config  # three steps back
for event in app.stream(None, target, stream_mode="values"):
    pass  # replay from that point forward
```

- Đưa đi.`None`作为输入 传入, sẽ từ một điểm kiểm soát được xác định;传入一个值,则将在复习前将它作为更新添加到该点的状态上.

### 步骤 5: Thay thế điểm kiểm soát cho môi trường sản xuất

```python
from langgraph.checkpoint.postgres import PostgresSaver

with PostgresSaver.from_conn_string("postgresql://...") as checkpointer:
    checkpointer.setup()
    app = graph.compile(checkpointer=checkpointer)
```

SQLite、Redis 和 Postgres đã được cung cấp.`MemorySaver`Để thử nghiệm, bất cứ thứ gì cần được khởi động lại, đều nên sử dụng cửa hàng thực sự.

## 技能

> Bạn sẽ tạo ra các đại lý cho đồ thị, thay vì`while True`vòng lặp.

Trong khi sử dụng LangGraph  trước, trước tiên làm một thiết kế 60 giây:

1. **命名 nodes。**Mỗi quyết định phân tán hoặc hành động tác động phụ đều là một nút.
2. **声明 state。**Sử dụng TypeedDict tối thiểu,并为每个列表字段 配减剂. Đừng để tất cả mọi thứ vào.`messages`;把 nhiệm vụ cụ thể các lĩnh vực làm việc`plan`Một người`budget`Đặt đếm`retrieved_docs`danh sách) nâng lên cấp cao nhất.
3. **画出 edges。**Ngoài việc tiếp theo phụ thuộc vào sản xuất mô hình, nếu không sử dụng tĩnh── mỗi cạnh điều kiện đều cần một hàm router có tên là nhánh──
4. **一开始就选择 checkpointer。**thử nghiệm 用 `MemorySaver`, Other scenarios using Postgres/Redis/SQLite―don't publish in a situation without checkpoint no checkpoint 就没有复习、没有中断、没有时间旅行──
5. **在 tools 运行前决定 interrupts，而不是运行后。**Ưu điểm  nên đặt vào cạnh của nút tác động phụ, để bạn có thể gây ảnh hưởng trước khi hủy bỏ; xác nhận  nên đặt trên cạnh của mô hình 输出 sau khi lên, để bạn có thể giảm chi phí từ chối các cuộc gọi xấu.
6. **默认 stream。**User `mode="updates"`, mô hình các nút  nội bộ token cấp phát sử dụng `mode="messages"`,vận dụng các bức ảnh đầy đủ trong thời gian qua`mode="values"`

拒绝发布没有检查点的 LangGraph代理──拒绝发布在副作用后才中断的 LangGraph代理──拒绝发布`messages`field 没有使用 `add_messages`作为减轻剂的LangGraph代理──

## 练习

1. **Easy.**Sử dụng công cụ máy tính và công cụ tìm kiếm web 实现 trên trên bốn nút ReAct đồ thị.`list(app.get_state_history(config))`Ít nhất quay lại bốn điểm kiểm soát.
2. **Medium.**Thêm một trong `agent`之前运行的 `planner`node,并向状态 写入结构化的 `plan: list[str]`✿让 `agent`Hãy lên kế hoạch để làm được.`plan`Trong điểm kiểm soát tiếp tục 后丢失 (reducer) 错误 (trượt),测试应失败 (đánh thành thất bại).
3. **Hard.**构建一个监督图,使用 `Send`Trong ba phụ tùng`researcher``writer``reviewer`(Trong đường đi) Mỗi tiểu đồ thị đều có trạng thái và điểm kiểm tra của riêng mình (Bằng đường trên biểu đồ bên ngoài)`interrupt_before=["writer"]`, để con người có thể phê duyệt nghiên cứu ngắn hạn.

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

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/)StateGraph, Reducers, Checkpoints và sự gián đoạn của quyền lực tham khảo
- [LangGraph concepts: state, reducers, checkpointers](https://langchain-ai.github.io/langgraph/concepts/low_level/) Mô hình tâm lý sử dụng trong bài học này, trực tiếp từ nguồn chính thức.
- [LangGraph Persistence and Checkpoints](https://langchain-ai.github.io/langgraph/concepts/persistence/) 关于 Postgres/SQLite/Redis store, checkpoint namespaces và thread IDs 的细节.
- [LangGraph Human-in-the-loop](https://langchain-ai.github.io/langgraph/concepts/human_in_the_loop/) `interrupt_before``interrupt_after``Command(resume=...)`和 edit-state pattern.
- [Yao et al., "ReAct: Synergizing Reasoning and Acting in Language Models" (ICLR 2023)](https://arxiv.org/abs/2210.03629)Mỗi đại lý LangGraph đều có một mô hình thực hiện; đọc nó có thể hiểu được các dấu vết lý luận.
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) Nói rõ nên trong何时 chọn những hình dạng biểu đồ nào (chuỗi, bộ định tuyến, nhạc công, người đánh giá, người tối ưu hóa)
- Giai đoạn 11 · 09 (Calling Function)  Mỗi node đại lý LangGraph 复用工具-call nguyên thủy。
- Giai đoạn 11 · 14 (Mô hình Công thức ngữ cảnh)  Kỹ thuật khám phá công cụ, có thể thông qua bộ chuyển đổi MCP 接入 LangGraph `ToolNode`
- Giai đoạn 11 · 17 (Tương đương với cơ sở quản lý của các đại lý)  何时选择 LangGraph, thay vì CrewAI、AutoGen 或 Agno。
