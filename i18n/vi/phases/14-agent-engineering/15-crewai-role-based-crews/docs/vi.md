# CrewAI: dựa trên vai trò của Crew và dòng chảy

> CrewAI là một framework đa đại lý dựa trên vai trò năm 2026 . Có bốn thành phần cơ bản: Agent, Task, Crew, Process.

**类型：**Học tập + xây dựng
**语言：**Python (stdlib)
**先修：**Giai đoạn 14 · 12 (Tình mẫu lưu lượng làm việc), Giai đoạn 14 · 14 (Tình mẫu diễn viên)
**时间：**约75分钟

## Học mục tiêu

- Nói về bốn thành phần cơ bản của CrewAI (Đội ngũ, nhiệm vụ, nhân viên, quy trình) và mỗi thành phần chịu trách nhiệm về gì.
- 区分 序列化和计划中的共识过程;为每类工作负载选择一种――
- 区分 Crews (tổ chức dựa trên vai trò của chủ nhân) với Flow (tổ chức của các nhóm)
- Sử dụng `@tool`trang trí và `BaseTool`Phân loại 接入 công cụ; hiểu các kết quả cấu trúc và lấy văn bản tự do.
- Nói ra bốn loại bộ nhớ của CrewAI, cũng như mỗi loại có giá trị sử dụng vào thời điểm nào.
- 实现一个工作三 经纪人团队 研究员,作家,编辑,产出一份简报
- 识别三种 CrewAI thất bại: tức thời-blowat, quản lý-LLM thuế, giao hàng hỏng lẻo.

## 问题

 Nhóm của các khung đa đại lý sẽ đâm vào cùng một bức tường. Hợp tác tự động trong demo 里 nghe rất tuyệt vời.

Freedom Form ∼ bởi các nhân viên của LLM 路由 都干净地回答这些问题──纯 DAG có thể trả lời tất cả các vấn đề, nhưng sẽ mất trí tuệ đại lý 需要的探索形态──

Sự phân chia trung thực của CrewAI đã đặt ra mặt đối với việc này. Các đội ngũ sử dụng các mô hình hợp tác, dựa trên vai trò, tìm kiếm.

## 概念

### 4 thành phần cơ bản

Mặt bề mặt của thủy thủ đoàn rất nhỏ.

- **Agent。** `role + goal + backstory + tools + (optional) llm`▽backstory 很关键──它塑造语气、判断,以及代理 何时停止──工具 是代理 可以调用函数(下面会讲)。
- **Task。** `description + expected_output + agent + (optional) context + (optional) output_pydantic`❖ có thể sử dụng đơn vị làm việc`expected_output`Đó là một thỏa thuận.`context`列出上游任务,其输遇被传入──`output_pydantic`强制使用结构化形态──
- **Crew。**容器──拥有 `agents`列表,`tasks`列表,`process`, và các lựa chọn `memory`+ `verbose`+ `manager_llm`设置──
- **Process。**执行策略──序列、级、共识(计划中)──选择运行的形态──

Các đại lý sẽ không trực tiếp nhìn thấy nhau. Nhiệm vụ của họ là tham khảo các đại lý.

> **已针对**CrewAI 0.86(2026-05)验证──更新版本可能会重新命名或合并过程类型; 在依赖具体形态之前,请查看 [CrewAI Processes docs](https://docs.crewai.com/concepts/processes)

### Theo trình tự, cấp bậc và đồng thuận

- **Sequential。**Nhiệm vụ 按声明顺序运行──Task N 的输出可作为 `context`提供给任务 N+1──成本最低──最可预测──当顺序固定时使用──
- **Hierarchical。**Một quản lý đại lý (một cuộc gọi LLM độc lập) giữa các chuyên gia 路由──CrewAI sẽ tùy thuộc vào bạn `manager_llm`config hoặc default config generation manager──manager Mỗi lượt chọn nhiệm vụ tiếp theo, và có thể từ chối hoặc tái định tuyến── khi bạn có bốn hoặc nhiều chuyên gia, và thứ tự thực sự phụ thuộc vào thứ tự trước khi xuất khẩu.
- **Consensus。**Trong kế hoạch, API công cộng hiện tại chưa được thực hiện.

Các cuộc họp hàng bậc trên mỗi cuộc gọi chuyên gia tăng lên mỗi vòng một lần của LLM gọi (manager)  Trong 5 bước chạy, chi phí token có thể trở thành 3 lần chỉ cần trong quá trình cần trả cho nó

### Đội ngũ vs dòng chảy

Đây là khung hình của 2026 năm.

- **Crew。**Phân tự trị do LLM-động. khung trong quá trình vận hành.
- **Flow。**Các sự kiện bạn có đang thúc đẩy biểu đồ`@start`标记入口――`@listen(topic)`标记一个步骤, nó sẽ xuất phát trong một bước khác 发发这个话题 时触发──每个步骤都是普通 Python(内部可以调用机组)──适应:生产──可观测──可测──确定性──

文档在 2026年生产建议: từ dòng chảy 开始――当自治 值得其成本时,把船员 作为 dòng chảy bước 内部的 `Crew.kickoff()`Flow  đưa cho bạn đường mòn kiểm toán, Crew  đưa cho bạn khám phá, không chọn

### Công cụ 集成

给 Agent 配备工具有三种方式――选择最简单且适合的一种――

1. **`@tool` decorator。**纯函数变成工具──Signature là schema;docstring là LLM 见的描述──最适合一次性辅助者──

   ```python
   from crewai.tools import tool

   @tool("Search the web")
   def search(query: str) -> str:
       """Return top results for the query."""
       return run_search(query)
   ```

2. **`BaseTool` subclass。**基于类的工具,带显式 args schema、async support、retries──当工具 有状态(client、cache) 或需要结构化的 args 时使用──

   ```python
   from crewai.tools import BaseTool
   from pydantic import BaseModel

   class SearchArgs(BaseModel):
       query: str
       limit: int = 10

   class SearchTool(BaseTool):
       name = "web_search"
       description = "Search the web and return top results."
       args_schema = SearchArgs

       def _run(self, query: str, limit: int = 10) -> str:
           return self.client.search(query, limit=limit)
   ```

3. **内置 toolkits。**CrewAI  cung cấp các bộ chuyển đổi bên đầu tiên:`SerperDevTool``FileReadTool``DirectoryReadTool``CodeInterpreterTool``RagTool``WebsiteSearchTool` Một lần nhập khẩu 即可接入

Kết quả cấu trúc sử dụng Pydantic.`output_pydantic=MyModel` Cụ thể sẽ dựa trên mô hình xác minh phản ứng LLM,并 thực hiện áp lực hoặc thử lại.`expected_output`string 配合使用──Free-text output 适合草稿;structured output 才是下游 dòng chảy 能消费的内容──

### Cây móc nhớ

CrewAI 开箱 cung cấp bốn loại bộ nhớ. Chúng có thể được kết hợp: một Crew có thể kích hoạt cùng một lúc bốn loại.

> **已针对**CrewAI 0.86(2026-05) 验证──近期版本把所有内容都路由到统一的`Memory`Hệ thống này bao gồm bốn loại cửa hàng. Mô hình khái niệm dưới đây vẫn còn tồn tại, nhưng trong phiên bản mới, bề mặt lớp công cộng có thể sẽ được nhận được cho một.`Memory`Điểm nhập cảnh; xin hãy xem [CrewAI memory docs](https://docs.crewai.com/concepts/memory)了解当前 API。

- **Short-term。**单次运行内对话缓冲──结束时清空──
- **Long-term。**跨运行持久化──存储在向量DB 中(默认 Chroma,可替换)──按与当前任务的相似度检索──
- **Entity。**按实体 记录事实──客户 X nằm trong kế hoạch doanh nghiệp. 按实体键, chứ không phải按相似度──跨运行保留──
- **Contextual。**组装时检索──在 Agent 需要时拉取相关记忆,而不是预载──

Trong đội ngũ trên sử dụng`memory=True`                                                                                                                                                                                                                                                              

### 什么时候适合 CrewAI

- 三到六个代理,具名角色和协作工作流――起草、评论、规划、脑风――
- LLM đối với các quyết định của bước tiếp theo tự cấu thành định tuyến giá trị (hierarchical)
- 团队更愿意读 `role + goal + backstory`, thay vì đọc định nghĩa biểu đồ của cảnh tượng.

### 什么时候不适合 CrewAI

- 带严格顺序的确定性 DAGs──使用 LangGraph(Lesson 13)── hình dạng đồ thị là trừu tượng chính xác; khung vai trò của CrewAI 会带来摩擦──
- 亚秒级延迟预算――Trang bậc sẽ tăng chuyến đi vòng lại―― ngay cả các trình tự cũng sẽ có chứa các câu chuyện sau và các lời nhắc về các kết quả trước đây――
- Một vòng lặp đại lý đơn ⋅ nhảy qua khung; một vòng lặp đại lý ⋅ Bài học 1) thêm sổ đăng ký công cụ ⋅ 更短。

Bài học 17 ((Quả hợp tác cơ quan) sử dụng Matrix  đã chứng minh điều này.

### Hình dạng phụ thuộc

独立于LangChain──Python 3.10 đến 3.13──使用 `uv`✿ Số sao:见 [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI)(trước thời điểm 2026-05 của snapshot) ――AWS Bedrock tích hợp có tài liệu;chỉ số chuẩn của nhà cung cấp  báo cáo của nó trên khối lượng công việc QA trên so với LangGraph có tăng tốc đáng kể, nhưng phương pháp luận(đồ sơ, phần cứng, đánh giá métrics) không công khai, do đó, các số khung-chợ cung cấp chỉ có thể làm một tài liệu hướng dẫn。

### Mô hình này sẽ xuất hiện ở đâu

- **Backstories 导致 prompt-bloat。**Mỗi đại lý một câu chuyện sau 2000 từ, thêm 5 nhân viên của đội ngũ, sẽ được gọi lần đầu tiên trước khi đốt cháy ngân sách ngữ cảnh.
- **Manager-LLM token tax。**Quá trình phân cấp 会在每个专业调用前增加一个经理 LLM调用五个任务 五次LLM调用会从五次LLM调用变成六次,并且经理调用携带完整任务列表加上前输出──除非路由依赖输出,否则切换到序列──
- **Brittle handoffs。**Nhiệm vụ N của `expected_output`Đó là một đường viền.`context`读取,并尝试 parse 三个节目──LLM 生成四个──下游 Agent 即兴处理──修复方式在任务 N 上使用 `output_pydantic`,让Task N+1 读取 được đánh máy đối tượng, chứ không phải là văn bản tự do.
- **Crew-as-prod。**Freedom Forma Crew trong trường hợp không có vòng gói dòng chảy được phát hành đến sản xuất.


```figure
ae-crew-vs-flow
```

##  xây dựng nó

`code/main.py`实现了两种形式的 stdlib 版本,以及一个三位代理机组.

形态:

- `Agent``Task`Dataclasses, phù hợp với bề mặt của CrewAI.
- `SequentialCrew.kickoff(inputs)`按声明顺序运行任务,并把输出 作为 `context`传递.
- `HierarchicalCrew.kickoff(topic)` tăng một quản lý đại lý, mỗi vòng chọn một chuyên gia tiếp theo, và đã làm 处停止──
- 带 `@start`和 `@listen(topic)`các nhà trang trí của `Flow`, một vòng lặp nhỏ của sự kiện, cũng như dấu vết.
- `tool(name)`Bộ trang trí, gương của CrewAI `@tool`hình dạng
- 带 `short_term``long_term``entity`cửa hàng của `Memory`;hạo báng tương đồng 使用 numpy。
- Phản ứng LLM giả là dựa trên vai trò cộng với đầu vào tiền tố khóa của chuỗi mã hóa cứng.

具体 demo:researcher、writer、editor crew,产出一份关于 agent engineering 2026 的简报──Researcher 拉取(pk)

运行 nó:

```bash
python3 code/main.py
```

Hướng dẫn: phi hành đoàn theo dõi`context`串接输出, cấp bậc nhóm 带 quản lý chọn ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]]`researched``drafted``edited`)运行同样三步, công cụ gọi qua `@tool`路由, cũng như trí nhớ dài hạn ระหว่าง hai lần kickoff 保存.

Hướng dẫn của thủy thủ đoàn là流动的; quản lý nguyên tắc trên có thể được sắp xếp lại.

## Sử dụng nó

- **CrewAI Flow**Được sử dụng để sản xuất. Ngay cả dòng chảy chỉ có một bước điều chỉnh.`Crew.kickoff()`❖ Tỷ lệ lưu lượng cung cấp giới hạn kiểm toán
- **CrewAI Crew (Sequential)**Sử dụng để làm việc hợp tác rõ ràng, đặc biệt là các bản thảo đầu tiên và vòng lặp xem xét.
- **CrewAI Crew (Hierarchical)**Khi định tuyến phụ thuộc vào sản lượng, và bạn có bốn hoặc nhiều chuyên gia sử dụng.
- **LangGraph**(Dân học 13) được sử dụng cho các máy trạng thái hiển nhiên, hồ sơ lâu dài, sắp xếp nghiêm ngặt.
- **AutoGen v0.4**(Dạy học 14) được sử dụng cho sự đồng thời của mô hình diễn viên và sự cô lập lỗi.
- **OpenAI Agents SDK**(Dân học 16) được sử dụng cho các sản phẩm đầu tiên của OpenAI, mang theo những chiếc tay và những tấm chắn.
- **Claude Agent SDK**(Dân học 17) được sử dụng cho các sản phẩm Claude-first,带 subagents 和 session store

##  phát hành nó

`outputs/skill-crew-or-flow.md`会为一个任务 选择 Crew vs Flow,并脚架 最小实现──对 Crew-without-back story、Flow-without-explicit-topics、少于三个专家的等级 进行硬拒──

## 常见坑

- **把 backstory 当作调味。**Nó sẽ tạo ra các kết quả. Mỗi đại lý thử nghiệm ba biến thể.
- **跳过 `expected_output`。**Không có thỏa thuận của mỗi nhiệm vụ, các nhiệm vụ sẽ đạt được bất cứ nội dung nào LLM 产出的──Crew 能跑;audit 会失败──
- **Memory always-on。**Trong dài hạn, mỗi lần chạy đều sẽ được viết vào.
- **Manager prompt drift。**Các trình quản lý của trình tự quản lý là ẩn式的──如果路由变奇怪,在语句模式下 dump 出来阅读──
- **Crews 中 tool side effects。**Thuộc phi hành đoàn có thể hơn dự kiến nhiều lần sử dụng công cụ.

## 练习

1. Hãy chuyển đổi thành Flow. Số một số biến đổi.
2. 给船员 添加实体记忆: Về khách hàng thực tế trong kickoff 之间持久化――验证检索 拉取了正确实体――
3. 实现一个等级过程:manager 在作者的输出至少有三段之前,拒绝路由到编辑──追踪 这次再尝试──
4. 为一个(lại cười) Tìm kiếm trên web 接入 `BaseTool`phân loại:`@tool`trang trí 版本。
5. 给编辑 nhiệm vụ 添加 `output_pydantic=Brief`, trong số đó `Brief`Có `title``summary``sections`❖ Hãy để tác vụ của nhà văn 输出 một lần JSON bị trục trặc;验证 CrewAI trong trace 中的重试行为──
6. 阅读 CrewAI's docs intro.`crewai`API: STDlib  phiên bản đã vượt qua những đảm bảo nào?
7. Để làm việc với AgentOps hoặc Langfuse (Dân học 24) tiếp tục thực sự hoạt động.

## 关键术语

| Term | 大家常说 | 实际含义 |
|------|----------------|------------------------|
| Agent | “Persona” | Role + goal + backstory + tools |
| Task | “工作单元” | Description + expected output + assignee + optional structured output |
| Crew | “Agent team” | Agents + Tasks + Process 的容器 |
| Process | “执行策略” | Sequential / Hierarchical / Consensus（计划中） |
| Flow | “Deterministic workflow” | 事件驱动、代码拥有、可测试 |
| Backstory | “Persona prompt” | Agent 的语气与判断塑造器 |
| `@tool` | “Function tool” | 把函数变成 Agent 可调用 tool 的 decorator |
| `BaseTool` | “Class tool” | 带 args schema、retries、async support 的 class-based tool |
| Entity memory | “Per-entity facts” | 限定到某个 customer / account / issue 的 memory |
| Long-term memory | “Cross-run memory” | 在 kickoffs 之间保留的 vector-backed memory |
| Contextual memory | “Just-in-time retrieval” | Agent 需要时才拉取的 memory |
| Manager LLM | “Router agent” | Hierarchical process 中选择下一个 task 的额外 LLM |
| `expected_output` | “Task contract” | 告诉 Agent（和 audit）要返回什么形态的 string |

## 延伸阅读

- [CrewAI docs introduction](https://docs.crewai.com/en/introduction): khái niệm và phương pháp sản xuất
- [CrewAI Flows guide](https://docs.crewai.com/en/concepts/flows): sự kiện động thái`@start``@listen`
- [CrewAI tools reference](https://docs.crewai.com/en/concepts/tools)- Có thể là:`@tool``BaseTool`、内置 công cụ
- [CrewAI memory](https://docs.crewai.com/en/concepts/memory): ngắn hạn, dài hạn, đơn vị, ngữ cảnh
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents): multi-agent  khi nào có giúp đỡ, khi nào không có
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview): thay thế máy nhà nước
