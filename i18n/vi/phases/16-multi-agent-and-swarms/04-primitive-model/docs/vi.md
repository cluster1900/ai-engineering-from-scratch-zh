# Mô hình nguyên thủy đa tác nhân

> Mỗi framework đa đại lý được phát hành vào năm 2026  AutoGen、LangGraph、CrewAI、OpenAI Agents SDK、Microsoft Agent Framework  都是四维设计空间中的一个点──四个原始,仅此而已:agent、handoff、shared state、orchestrator──本课从零构建它们,运行一个玩具系统,然后将每个主流框架映射到同一组坐标轴上,让你能用一段话读懂任何新发布版本──

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 (Agent Engineering), Phase 16 · 01 (Why Multi-Agent)
**Time:** ~60 minutes

## 问题
Mỗi sáu tháng sẽ có một khung đa đại lý mới được phát hành. AutoGen năm 2023. CrewAI năm 2024. LangGraph năm 2024 và OpenAI Swarm. Google ADK tháng 4 năm 2025.

Nếu bạn cố gắng học từng người, bạn sẽ mệt mỏi hết. Các API trông khác nhau. Một khung đặt bộ nhớ chia sẻ của nó được gọi là bảng đen, một gọi là bể tin nhắn, một gọi là StateGraph. Bạn bắt đầu nghi ngờ lĩnh vực này chỉ là trong phản hồi.

Không phải vậy, dưới gói tiếp thị, bốn nguyên thủy là ổn định, học một lần, có thể sử dụng một đoạn văn để hiểu mỗi khung mới.

## 概念
### Bốn nguyên thủy

1. **Agent** Một hệ thống nhắc thêm một danh sách công cụ. Không trạng thái. Mỗi lần chạy đều từ hệ thống nhắc và lịch sử tin nhắn hiện tại.
2. **Handoff**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
3. **Shared state** 任何能被多个代理 读取(有时也能写入) của cấu trúc dữ liệu.
4. **Orchestrator** quyết định下一个由谁发言的角色──选项包括:显式图表(确定性)、LLM loa-selector(soft)、上一位 loa's handoff call(OpenAI Swarm), hoặc hàng lên lên của lập trình viên(swarm architecture)。

Đây là không gian thiết kế hoàn chỉnh. Mỗi khung đều có giá trị tùy chọn tùy chỉnh cho mỗi trục.

### Làm thế nào mỗi khung 2026 được lập bản đồ

| Framework | Agent | Handoff | Shared state | Orchestrator |
|-----------|-------|---------|--------------|--------------|
| OpenAI Swarm / Agents SDK | `Agent(instructions, tools)` | tool returns Agent | caller's problem | the LLM's next handoff call |
| AutoGen v0.4 / AG2 | `ConversableAgent` | speaker-selector on GroupChat | message pool | selector function (LLM or round-robin) |
| CrewAI | `Agent(role, goal, backstory)` | `Process.Sequential / Hierarchical` | Task outputs chained | manager LLM or static order |
| LangGraph | node function | graph edge + condition | `StateGraph` reducer | the graph, deterministic |
| Microsoft Agent Framework | agent + orchestration patterns | pattern-specific | thread / context | pattern-specific |
| Google ADK | agent + A2A card | A2A task | A2A artifacts | host decides |

Bức độ khác biệt trông rất lớn.

### Tại sao điều này quan trọng

Một khi xem nguyên thủy, so sánh khung hình thành một danh sách kiểm tra ngắn gọn:

- Orchestrator là tín nhiệm của LLM đến đường dẫn?
- chia sẻ trạng thái là toàn bộ lịch sử (GroupChat), hay dự đoán (StateGraph reducer)?
- Các nhân viên có thể thay đổi lời khuyên của nhau hay chỉ có thể giao tiếp với nhau?

Ba câu hỏi này có thể trả lời một khung liệu có phù hợp với 80% vấn đề cụ thể hay không. Bạn không còn tìm kiếm khung đa đại lý tốt nhất, mà bắt đầu thiết kế xung quanh một trục quan tâm thực sự.

### Sự hiểu biết vô quốc gia

Ngoài trạng thái chia sẻ, mỗi nguyên thủy đều là không trạng thái.**系统中唯一有状态的东西是 shared state。**Tất cả những lỗi thú vị đều sống ở đó: ngộ độc trí nhớ (Dạy 15) Ứng dụng truyền tin, phiên bản, tranh cãi văn bản

藏藏共享状态框架(Swarm) sẽ đưa vấn đề đến người gọi.

### Phân tích của một nguyên thủy duy nhất

#### - Trưởng lý.

```
Agent = (system_prompt, tools, model, optional_name)
```

Không có bộ nhớ, không có trạng thái, không có cùng một hệ thống nhanh và hai đại lý của các công cụ là có thể trao đổi. Bất cứ điều gì trông giống như trạng thái của mỗi đại lý, thực tế đều trong trạng thái chia sẻ hoặc giao thức giao dịch.

#### Chuyển

```
Handoff = (from_agent, to_agent, reason, payload)
```

三种实现占主导:

- **Function return** công cụ 返回下一个代理──这是 OpenAI Swarm pattern──Agents trong các chương trình công cụ của riêng mình mang theo định tuyến──
- **Graph edge** LangGraph。Edges 是声明式的──LLM 生成一个值;condition 选择下一个节点──
- **Speaker selection** AutoGen GroupChat。 chức năng chọn lọc(有时它本身也是一次LLM call)读取池并选择下一位发言者。

#### Nhà nước chung

```
SharedState = { messages: [], artifacts: {}, context: {} }
```

至少是一个消息列表──通常更多: cấu trúc các hiện vật(CrewAI Task output) ‧typed context(Langgraph reducers) ‧external memory(MCP、vector DB) ‧

两种 topology:**full pool**(Mỗi đại lý đều thấy mỗi bài tin) và **projected**(trong các đại lý xem theo tầm nhìn của vai trò) ――Tổng hồ bơi  đơn giản nhưng mở rộng性差── Dự kiến hồ bơi có thể mở rộng, nhưng cần sơ đồ thiết kế trước――

#### Nhà dàn nhạc

```
Orchestrator = ({state, last_speaker}) -> next_agent
```

4 kiểu:

- **Static** đồ thị trong xây dựng thời gian  cố định(LangGraph xác định tính、CrewAI theo trình)。
- **LLM-selected** LLM 读取 pool 并选择下一位讲者(AutoGen、CrewAI Hierarchical)
- **Handoff-driven** 当前代理 通过调用交付工具 来决定(Swarm) 』
- **Queue-driven** công nhân từ hàng chia sẻ 拉取任务; không có bộ đàm tiếp theo rõ ràng

### Những thay đổi giữa các khung

Một khi nguyên thủy được cố định, phần còn lại của quyết định thiết kế là:

- **Memory strategy** kiểm soát tạm thời đối với kiểm soát bền vững (Langgraph checkpointer)
- **Safety boundary** 谁可以批准交付 (Human-in-the-loop)
- **Cost accounting** mỗi đại lý Ngân sách token
- **Observability** theo dõi giao hàng, để tái diễn 持久化状态──

Tất cả những điều này đều có thể được thực hiện trên nguyên thủy.


```figure
a5-primitive-radar
```

##  xây dựng nó
`code/main.py`Sử dụng khoảng 150 行 stdlib Python  thực hiện bốn nguyên thủy  Không có LLM thực sự  Mỗi đại lý đều là một chính sách kịch bản, do đó tập trung giữ trong cấu trúc phối hợp trên 

Tài liệu xuất phát:

- `Agent` 包含 name、system prompt、tools、policy function 的数据类──
- `Handoff` 返回新代理的功能──
- `SharedState` hồ chứa thông điệp an toàn với dây chuyền
- `Orchestrator` 三个变体:`StaticOrchestrator``HandoffOrchestrator``LLMSelectorOrchestrator`(được mô phỏng)

demo 通过所有三种乐队员类型 运行同一个三代理管道(phác tích → viết → đánh giá), và cuối cùng in lại thông điệp bểềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnền

运行 nó:

```
python3 code/main.py
```

预期输出: 三次 orchestrator runs,每种模式 一次──每次都会打印最终信息池──如果研究员 判断已经提前完成, tài trợ-驱动运行 会到达更少的代理 这就是LLM-routing tradeoff 的缩写版──

## Sử dụng nó
`outputs/skill-primitive-mapper.md`là một kỹ năng, nó đọc bất kỳ cơ sở mã đa đại lý hoặc tài liệu khung,并 quay lại bản đồ bốn nguyên thủy. Trong bản phát hành khung mới 上运行 nó,即可在深入阅读 doc 前获得一段话的理解.

## 交付 nó
Trong khi sử dụng khung mới trước, trước tiên viết bản đồ nguyên thủy. Nếu không xuất hiện, hãy nói rằng các tài liệu không hoàn chỉnh, hoặc khung đang phát triển thứ năm nguyên thủy.

Hãy lập bản đồ  cố định trong văn bản kiến trúc của bạn 中──当新团队成员 加入时,先把 bản đồ 发送给他们,再发送 API docs──当框架版本 变化时,对比对映射,而不是变更──

## 练习
1. Sử dụng các chính sách của các đại lý khác nhau`code/main.py`三次──观察 dàn nhạc sĩ lựa chọn 如何改变哪些代理会运行──
2. 实现第四种管弦乐器类型:队列驱动, trong đó các đại lý 轮询 chia sẻ nhà nước 寻找工作.
3. 取 LangGraph khởi động nhanh (https://docs.langchain.com/oss/python/langgraph/workflows-agents), biến nó thành bốn nguyên thủy. Những trừu tượng nào của LongGraph là 1: 1 映射, những gì là gói tiện lợi?
4. 阅读 OpenAI Swarm cookbook (https://developers.openai.com/cookbook/examples/orchestrating_agents◊ nhận dạng Swarm 让四个原始人中最多能,以及它把哪个推给调用者──
5. Trong biểu đồ này tìm ra một khuôn khổ của một trạng thái chia sẻ hoàn toàn ẩn ở đây.

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
- [OpenAI cookbook: Orchestrating Agents — Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) Về việc dàn nhạc do tay tay tay
- [AutoGen stable docs](https://microsoft.github.io/autogen/stable/)GroupChat + sự lựa chọn diễn giả là sự lựa chọn của tổ chức nhạc kịch LLM để thực hiện
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) Phân phối cạnh biểu đồ và dựa trên giảm giá của trạng thái chia sẻ
- [CrewAI introduction](https://docs.crewai.com/en/introduction) các nhân viên vai trò-goal-backstory,Các quy trình theo trình tự / Trật tự
- [AG2 (community AutoGen continuation)](https://github.com/ag2ai/ag2) Microsoft sẽ chuyển v0.4 vào bảo trì  vẫn còn hoạt động của AutoGen v0.2 线
