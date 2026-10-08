# Quadro đại lý 取舍  LangGraph vs CrewAI vs AutoGen vs Agno

> Mỗi khung đều đang bán cùng một bản demo (đơn vị nghiên cứu)  xây dựng báo cáo (đơn vị nghiên cứu)  cũng đều có cùng một lỗi (đơn vị tình trạng và lớp dàn xếp)  saling đụng nhau (đơn vị)  chọn một khung hợp lý với hình dạng của vấn đề của bạn; phần còn lại là bạn phải viết 2 lần mã dán glue 

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (Function Calling), Phase 11 · 16 (LangGraph)
**Time:** ~45 minutes

## 问题

Bạn có một nhiệm vụ, cần không ngừng một lần gọi LLM. Có lẽ nó là một dòng công việc nghiên cứu (chế hoạch, tìm kiếm, tóm tắt, trích dẫn) Có lẽ nó là một hệ thống đánh giá mã (của các phân tích khác nhau, phê bình, váy, xác thực) Có lẽ nó là một trợ lý đa lượt, có thể đặt hàng, viết thư, gửi báo cáo. Bạn đã chọn một khung hình.

Ba ngày sau, bạn phát hiện ra rằng bản phác thảo của khung này bắt đầu bị rò rỉ. Cỗ máy tạo ra vai trò cho bạn, nhưng khi bạn làm nghiên cứu, bạn cần phải đưa ra kế hoạch cấu trúc cho tác giả. Nó sẽ tương tác với bạn. AutoGen cho bạn trò chuyện giữa các đại lý, nhưng không có trạng thái nào, vì vậy điểm kiểm soát của bạn chỉ là một miếng nhựa trong nhật ký cuộc trò chuyện. LongGraph cho bạn biểu đồ trạng thái, nhưng nó sẽ khiến bạn không biết đại lý sẽ làm gì trước khi bạn đặt tên cho mỗi chuyển đổi. Agno cho bạn một trừu tượng đơn vị, nhưng khi bạn yêu thích đến ba và gửi công nhân, nó sẽ bắt đầu kêu lên.

Phong cách sửa chữa không phải là chọn khung tốt nhất, mà là so sánh các bản tóm tắt của khung với hình dạng vấn đề của bạn.

## 概念

![Agent framework 矩阵：核心抽象 vs 问题形状](../assets/framework-matrix.svg)

Bốn khung chủ yếu định hướng phong cảnh năm 2026:

| Framework | 核心抽象 | 最适合 | 最不适合 |
|-----------|----------|--------|----------|
| **LangGraph** | `StateGraph` — typed state、nodes、conditional edges、checkpointer。 | 有显式 state 和 human-in-the-loop interrupts 的 workflows；需要 time-travel debugging 的 production agents。 | 拓扑未知、由 role 驱动的松散 brainstorming。 |
| **CrewAI** | `Crew` — roles（goal、backstory）、tasks、process（sequential 或 hierarchical）。 | 有短线性/层级 plan 的 role-playing 或 persona-driven workflows。 | 超出 crew turn history 的任何 stateful 场景；复杂 branching。 |
| **AutoGen** | `ConversableAgent` pair — 两个或更多 agents 轮流说话，直到满足 exit condition。 | Multi-agent *dialogue*（teacher-student、proposer-critic、actor-reviewer），其中思考从 chat 中涌现。 | 有已知 DAG 的 deterministic workflows；任何需要跨重启 durable state 的场景。 |
| **Agno** | `Agent` — 单个 LLM + tools + memory，可组合成 teams。 | 快速构建 single agents 和 lightweight teams；强 Multimodality 和内置 storage drivers。 | 带 custom reducers 的深度、显式分支 graphs。 |

### 抽象到底是什么意思

Một bản tóm tắt cốt lõi của một khung, là những gì bạn vẽ ra trong bảng màu trên kiến trúc.

- **LangGraph**Bạn vẽ một biểu đồ. Các nút là bước, cạnh là chuyển đổi, mỗi điểm của các đối tượng trạng thái đều được đánh dấu.
- **CrewAI**Bạn vẽ một biểu đồ tổ chức. Mỗi vai trò có mô tả công việc, quản lý.
- **AutoGen**→ 你画一个 Slack DM──两个代理 发消息彼此; nếu cần người điều hành,第三个加入── tâm lý mô hình là trò chuyện──
- **Agno**→ Bạn vẽ một hộp độc lập, bên cạnh treo trên các công cụ.

### Nhà nước 问题

Nhà nước là nơi mà hầu hết các khung hình  chọn trong sản xuất rơi vào tình trạng thất bại.

- **LangGraph.**Tiêu dạng trạng thái`TypedDict`(đối với các phương pháp kiểm tra, các phương pháp kiểm tra và kiểm tra của các nhà nghiên cứu và các nhà nghiên cứu về các phương pháp kiểm tra và kiểm tra của các nhà nghiên cứu về các phương pháp kiểm tra và kiểm tra của các nhà nghiên cứu về các phương pháp kiểm tra và kiểm tra của các nhà nghiên cứu về các phương pháp kiểm tra và kiểm tra của các nhà nghiên cứu về các phương pháp kiểm tra và kiểm tra của các nhà nghiên cứu về các phương pháp kiểm tra và kiểm tra của các nhà nghiên cứu về các phương pháp kiểm tra và kiểm tra của các nhà nghiên cứu về các phương pháp kiểm tra và kiểm tra của các nhà nghiên cứu về các phương pháp kiểm tra và kiểm tra của các nhà nghiên cứu về các phương pháp kiểm tra và kiểm tra của các nhà nghiên cứu về các phương pháp kiểm tra về các phương pháp kiểm tra và kiểm tra của các nhà nghiên cứu về các phương pháp kiểm tra về các phương pháp kiểm tra về thời gian)
- **CrewAI.**Quốc gia thông qua`context`trường 以字符串形式在任务之间流动,或通过`output_pydantic`结构化传递──开箱 không có cửa hàng bền bỉ cho mỗi thủy thủ đoàn; nếu thủy thủ đoàn phải sống sau khi khởi động, bạn cần tự tiếp nối──
- **AutoGen.**State is chat history và bất kỳ người dùng xác định `context`❖ Các bản sao cuộc trò chuyện có thể được duy trì; trạng thái lưu lượng công việc tùy chọn sẽ không duy trì, trừ khi bạn viết bộ chuyển đổi.
- **Agno.**内置 trình điều khiển lưu trữ(SQLite、Postgres、Mongo、Redis、DynamoDB), thông qua `storage=`  `Agent`上  các phiên trò chuyện và ký ức người dùng 会自动持久化──它 không phải là một điểm kiểm tra đồ thị hoàn chỉnh; mà là cửa hàng phiên──

### Các ngành 问题

Mỗi đại lý bất thường đều có thể làm một bộ phận.

- **LangGraph** 由你决定,通过条件边缘──Routing 是带命名分支的Python函数──Ránh là một đối tượng trong biểu đồ được biên soạn;checkpointer 会记录采取哪条分支──
- **CrewAI** chế độ phân cấp 中由经理决定;序列模式 中由你在构建时决定;;路由 隐含在任务列表; ngoại trừ lời nhắc của quản lý bên ngoài, không có một thứ if──
- **AutoGen** đại lý  thông qua trò chuyện quyết định── phân nhánh Từ 下一个发言者中涌现──`GroupChatManager`选择 next speaker; bạn có thể viết tay `speaker_selection_method`Nhưng được phép làm theo bằng LLM.
- **Agno** đại lý  thông qua bước tiếp theo调用哪个工具来决定──Teams có bộ điều phối viên/router/mô hình cộng tác viên; vượt ra khỏi những chi nhánh này là trách nhiệm của nhà phát triển──

### Sự quan sát 问题

- **LangGraph** Thông qua LangSmith hoặc bất kỳ nhà xuất khẩu OTel nào sử dụng OpenTelemetry. Mỗi chuyển đổi nút đều là khoảng thời gian theo dõi; các điểm kiểm tra đồng thời cũng có thể chơi lại.
- **CrewAI** Từ cuối năm 2025 起一等支持OpenTelemetry;集成 Langfuse、Phoenix、Opik、AgentOps。
- **AutoGen** 通过 `autogen-core`集成 OpenTelemetry;AgentOps 和 Opik có các kết nối──Tracking 粒度 là per-agent-message, không phải per-node──
- **Agno** 内置 `monitoring=True`cờ 加 OpenTelemetry xuất khẩu; với Langfuse 深度集成, được sử dụng để theo dõi phiên họp。

### Chi phí và thời gian trễ

Các cơ sở khác nhau chính là cơ sở làm được bao nhiêu phụ phí LLM định tuyến quyết định;. Người quản lý cấp bậc của CrewAI sẽ quyết định ai tiếp theo thực hiện; AutoGen của`GroupChatManager`Cũng vậy. Longgraph chỉ cần bạn viết.`llm.invoke`Địa chỉ hoa địa phương của Agno.

Khi mỗi lần vận hành chi phí  quan trọng khi, ưu tiên chọn đường dẫn rõ ràng`speaker_selection_method`), thay vì chọn đường dẫn LLM-

### Sự tương tác

- **LangGraph** **LangChain**Các công cụ, máy tìm kiếm, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, và máy tính truyền tải, máy tính truyền tải, máy tính truyền tải, và máy tính truyền tải, và máy tính truyền tải, và máy tính truyền tải, và các máy tính truyền tải.
- **CrewAI** công cụ 继承自 `BaseTool`Các công cụ LongChain, LlamaIndex và MCP đều có thể được điều chỉnh.`allow_delegation=True`Làm đại diện phi hành đoàn cho phi hành đoàn.
- **AutoGen**→ `FunctionTool`包装 bất kỳ Python có thể gọi; có bộ điều chỉnh MCP.
- **Agno**→ `@tool`trang trí hoặc phân loại BaseTool; bộ điều chỉnh MCP; các công cụ có thể được chia sẻ giữa các đại lý và các nhóm.

## 技能

> Bạn có thể giải thích bằng một câu, tại sao một khung hình nào đó phù hợp với một đại lý nào đó vấn đề.

构建前 danh sách kiểm tra:

1. **画出形状。**Đây là biểu đồ (¿có kiểu trạng thái, tên chuyển đổi) ?Để chơi vai trò (¿có chuyên gia 交接工作) ?Đối thoại (¿có đại lý 交谈直到完成) ?
2. **决定谁来 branching。**Các chi nhánh được quyết định bởi nhà phát triển → LangGraph──Chủ quản lý-nhà quyết → CrewAI hierarchical──Chat-emergent → AutoGen──Tool-call-decided → Agno──
3. **检查 state budget。**Bạn có cần tiếp tục từ điểm kiểm tra?Thành hành trình thời gian?Con người gián đoạn giữa chạy? Nếu có, LongGraph là một lựa chọn mặc định;Ngày họp không bao gồm trạng thái được mở rộng cuộc trò chuyện。
4. **检查 cost budget。**LLM chọn đường hàng tuần mỗi vòng sẽ có thêm tiền mã thông báo. Nếu đại lý hàng ngày chạy hàng ngàn lần, ưu tiên chọn đường thẳng.
5. **为 framework overhead 做预算。**Mỗi framework đều là một sự phụ thuộc khác. Nếu nhiệm vụ chỉ là hai lần LLM gọi và một công cụ, viết 30 行 Python đơn giản; không có bất kỳ framework nào hơn không có framework nào.

Trong khi bạn có thể vẽ biểu đồ, biểu đồ, trò chuyện hoặc hộp đại lý trước đó, từ chối mở ra khung hình.

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

1. **Easy.**取同一个任务  research Quỹ chính của Anthropic, viết một bản tóm tắt 200 từ, trích dẫn các nguồn  分别使用 LangGraph(四个节点: kế hoạch, tìm kiếm, viết, trích dẫn) và CrewAI(三个 vai trò: nhà nghiên cứu, nhà văn, biên tập viên) thực hiện── báo cáo mỗi lần vận hành chi phí token 和代码行数──
2. **Medium.**用 AutoGen  nhà nghiên cứu  nhà văn trò chuyện, biên tập viên 通过 `GroupChat`加入) 和 Agno(带 `search_tools`和 `write_tools`(a) Chi phí vận hành mỗi lần, (b) khả năng tiếp tục sau khi xảy ra tai nạn, (c) khả năng viết bước trước để nhập vào sự chấp thuận của con người, đối với bốn thứ tự thực hiện.
3. **Hard.** xây dựng một kịch bản cây quyết định `pick_framework.py`, chấp nhận một câu hỏi ngắn gọn mô tả:`{has_typed_state, has_roles, has_dialogue, has_parallel_fanout, needs_resume}`),并返回推和一句话证明──用你自己设计的六个案例 验证它──

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

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/)StateGraph, checkpointers, interrupts, thời gian đi lại
- [CrewAI documentation](https://docs.crewai.com/) Đội ngũ, dòng chảy, đại lý, nhiệm vụ, quy trình.
- [AutoGen documentation](https://microsoft.github.io/autogen/) ConversableAgent、GroupChat、teams、tools。
- [Agno documentation](https://docs.agno.com/) Nhân viên, Đội ngũ, Giao thông công việc, lưu trữ, trí nhớ.
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) Với framework 无关的图案库(quay chuỗi lập tức, định tuyến, song song, nhạc công, đánh giá, tối ưu hóa)
- [Yao et al., "ReAct: Synergizing Reasoning and Acting" (ICLR 2023)](https://arxiv.org/abs/2210.03629)Mỗi khung thành sẽ đóng gói vòng lặp xuất hiện.
- [Wu et al., "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation" (2023)](https://arxiv.org/abs/2308.08155) Bức tranh thiết kế của AutoGen
- [Park et al., "Generative Agents: Interactive Simulacra of Human Behavior" (UIST 2023)](https://arxiv.org/abs/2304.03442) CrewAI 风格 persona stacks 建立其上的角色扮演基础──
- Giai đoạn 11 · 16 (LangGraph)  本课用来基准的框架──
- Giai đoạn 11 · 19 (Tình phản ánh)  一个能干净映射到 LangGraph、但映射到 CrewAI 会很扭曲的模式──
- Giai đoạn 11 · 22 (Với khả năng quan sát sản xuất)  如何仪器 你选择的任何框架──
