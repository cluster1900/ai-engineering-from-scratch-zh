# LangGraph:Stateful Graphs với thực hiện bền vững

> LangGraph là tiêu chuẩn tham khảo của sự dàn xếp trạng thái cấp thấp năm 2026 ⋅Agent là một trạng thái; node là một hàm; edges là chuyển trạng thái; trạng thái là không thay đổi, và là điểm kiểm soát sau mỗi bước ⋅ bất kỳ thất bại nào có thể được từ một đoạn nào đó để xác định lại ⋅

**类型：**Học tập + xây dựng
**语言：**Python (stdlib)
**先修要求：**Giai đoạn 14 · 01 (Tình thức vận hành của các tác nhân), Giai đoạn 14 · 12 (Tình thức lưu lượng công việc)
**时间：**~ 75 phút

## Học mục tiêu

- Mô hình cốt lõi của LangGraph:带有不变状态、功能节点、条件边和后步检查点的状态机――
- Nói chung tài liệu nhấn mạnh về bốn khả năng: thực hiện lâu dài, phát trực tuyến, người trong vòng lặp, bộ nhớ toàn diện.
- 解释 LangGraph 支持的三种管弦乐拓基: giám sát viên、tương tự đối tác (tội)、luật tự (tương tự so với các hình)。
- 实现一个stdlib状态图,包含不可变状态、条件边,以及检查点/复习周期──

## 问题

Các đại lý và dòng công việc có một vấn đề chung: Khi một trình chạy 40 bước thất bại trong 38 bước, bạn muốn bắt đầu từ 38 bước, chứ không phải từ đầu.

Phản ứng thiết kế của LangGraph là: trạng thái là một đối tượng được đánh dấu, biến đổi là hiển nhiên, và các điểm kiểm soát sẽ tồn tại ở mỗi nút sau đó.`load_state(session_id)`调用。

## 概念

### biểu đồ

Một biểu đồ được định nghĩa bởi phần sau:

- **State type.**Một kiểu dict (đặc mô hình Pydantic), mỗi node sẽ đọc và sửa đổi nó.
- **Nodes.**纯函数 `(state) -> state_update`❖ Cập nhật 会在返回后合并进状态──
- **Edges.**Các chuyển đổi điều kiện hoặc trực tiếp giữa các nút.
- **Entry and exit.** `START`和 `END`Sentinel node 标记边界。

Ví dụ: một chứa `classify``refund``bug``sales``done`Agent của các nút, tức là một biểu đồ 形式 của dòng công việc định tuyến.

### Thực hiện lâu dài

Mỗi nút  quay lại sau, runtime 会序列化状态,并将其写入检查点(SQLite、Postgres、Redis、自定义) ⋅ Nếu trong第N 步失败, runtime có thể`resume(session_id)`,并带着精确状态 从第 N+1 步继续──

LangGraph 文档 rõ ràng nhấn mạnh tầm quan trọng của điều này đối với người dùng sản xuất: Klarna、Uber、J.P. Morgan。

### Chuyển phát

Mỗi nút đều có thể tạo ra một phần đầu ra. Graph 会向调用 dòng mỗi node-delta sự kiện, để UI 能在graph 运行时更新.

### Người trong vòng lặp

Trong các nút 检查并修改状态――实现方式: 在关键节前暂停,将状态 展示给人类,接受修改,然后恢复――Checkpointer 让这件事变得简单,因为状态 已被序列化――

### Tưởng thức

ngắn hạn (一次运行内,即状态中的对话历史) và dài hạn (跨运行,即通过检查点加上独立长期存储 持久化)

### 三种 topology

1. **Supervisor.**Các bộ định tuyến trung tâm LLM phân phát cho các chuyên gia phụ trách.`langgraph-supervisor`Trung `create_supervisor()`(Dù LangChain 团队 trong năm 2026 đề nghị trực tiếp thông qua các cuộc gọi công cụ để làm, để có được kiểm soát ngữ cảnh tốt hơn)
2. **Swarm / peer-to-peer.**Các đại lý thông qua bề mặt công cụ chia sẻ trực tiếp giao tiếp không có bộ định tuyến trung tâm.
3. **Hierarchical.**Giám sát viên quản lý phụ giám sát viên,以 tổ phụ biểu thực hiện.

### Phong cách này dễ dàng xuất hiện ở nơi

- **Checkpoints too small.**Chỉ chuyển đổi cuộc trò chuyện điểm kiểm soát 会让 công cụ trạng thái 和 bộ nhớ viết 无法恢复;; trạng thái đầy đủ 必须可序列化;;
- **Non-deterministic nodes.**Thử lại  giả định đầu vào nút sẽ tạo ra cập nhật trạng thái tương tự.
- **Over-use of conditional edges.**Mỗi cạnh đều là biểu đồ có điều kiện, là một trạng thái không thể đoán được.


```figure
langgraph-state
```

##  xây dựng nó

`code/main.py`实现 một biểu đồ trạng thái stdlib:

- `State`: một kiểu dict,包含 `messages``step``route``output``human_approval`
- `Node`:接收状态并返回更新 dict 的调用式──
- `StateGraph`:nodes + edges + conditional edges + run + resume。
- `SQLiteCheckpointer`(trong trí nhớ giả): trong mỗi nút 后序列化 trạng thái;`load(session_id)`恢复:
- Một biểu đồ demo: phân loại -> chi nhánh(chuyển / lỗi / bán hàng) -> cổng con người -> gửi。

运行 nó:

```
python3 code/main.py
```

Trace 会 hiển thị lần đầu tiên chạy trên cổng của con người 失败、完成持久化, sau đó tiếp tục và tạo ra kết quả cuối cùng.

## Sử dụng nó

- **LangGraph**: để thực hiện, sản xuất sẵn sàng.`create_react_agent``create_supervisor`, hoặc xây dựng biểu đồ của riêng bạn.
- **AutoGen v0.4**(Dạy học 14): ứng dụng cho các kịch bản cạnh tranh cao mô hình diễn viên 替代方案。
- **Claude Agent SDK**(Dạy học 17):带 tích hợp cửa hàng phiên quản lý 
- **Custom**: khi bạn cần đối với hình dạng trạng thái hoặc kiểm tra điểm hậu  thực hiện kiểm soát chính xác khi sử dụng。

## 交付 nó

`outputs/skill-state-graph.md`会在任意目标运行时 中生成一个 LangGraph hình dạng biểu đồ trạng thái,并接好检查点与恢复.

## 练习

1. Khi sự tin tưởng phân loại 低于值时, từ `classify`添加一条 边缘 điều kiện đến `end`❖ Trong người 手动设置 `route`后 tiếp tục 运行。
2. Để thay thế giả mạo của SQLite như một điểm kiểm tra SQLite thực sự.
3. 实现 rìa song song: hai nút并发运行,并通过 tùy chỉnh giảm 合并── trạng thái không thay đổi ở đây mang lại gì?
4. 阅读 `langgraph-supervisor`Reference: 把 đồ chơi 移植到`create_supervisor`❖ So sánh hình dạng dấu vết
5. 添加流: Mỗi nút trong vận hành tạo ra trạng thái phân phần.

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| State graph | “Agent 即状态机” | Typed state + nodes + edges + reducers |
| Checkpointer | “Persistence backend” | 在每个 node 后序列化 state；支持 resume |
| Reducer | “State merger” | 将当前 state 与 node update 组合起来的函数 |
| Conditional edge | “Branch” | 由 state 函数选择的 edge |
| Subgraph | “Nested graph” | 作为另一个 graph 中 node 使用的 graph |
| Durable execution | “从失败处 resume” | 使用精确 state 从最后一个成功 node 重启 |
| Supervisor | “Router LLM” | 面向 specialist subagents 的 central dispatcher |
| Swarm | “P2P agents” | Agents 通过 shared tools hand off；没有 central router |

## 延伸阅读

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) tài liệu tham chiếu
- [langgraph-supervisor reference](https://reference.langchain.com/python/langgraph/supervisor/) API mô hình giám sát
- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) diễn viên-chương mẫu 替代方案
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) cửa hàng phiên với các bộ phận phụ
