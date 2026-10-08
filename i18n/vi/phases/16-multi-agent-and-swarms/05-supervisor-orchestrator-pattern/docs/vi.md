# Mô hình giám sát viên / nhạc sĩ-người làm việc

> Một đại lý hàng đầu 负责规划和委派; chuyên dụng các nhân viên trong các bối cảnh cùng hành trình thực hiện并回报结果──这是Anthropic Research system 背后的模式(Claude Opus 4 作为领导,Sonnet 4 作为子体), trong các đánh giá nghiên cứu nội bộ 较上单代理 Opus 4 升高 +90.2%──Anthropic的工程文章报告称,BrowseComp 上 80% 方差仅仅由Token 解释 多代理 之所以获胜, phần lớn là vì mỗi子体都获得一个全新的背景窗口──本课从原始人 构建监督模式,并覆盖生产来自部署的2026课程工程课程──

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~75 minutes

## 问题

Nghiên cứu là một nhiệm vụ điển hình của hệ thống đại lý duy nhất sẽ thất bại. Bạn hỏi: trong năm 2023 đến 2026 hệ thống đa đại lý đã thay đổi như thế nào?

Mô hình giám sát viên sửa chữa điều này: một đại lý dẫn đầu lập kế hoạch tìm kiếm, đưa mỗi phụ câu hỏi ủy nhiệm cho một công nhân, sau đó tiến hành tổng hợp. Mỗi công nhân đều có được cửa sổ 200k-Token của riêng mình vì một vấn đề hẹp.

Hệ thống nghiên cứu sản xuất của Anthropic  báo cáo, trong các đánh giá nghiên cứu nội bộ 上相比单独 Opus 4 提升 +90.2%。 cùng một bài viết cho biết,BrowseComp 方差的80% chỉ do *Token sử dụng một mình* 解释──每个 subagent 拥有新文本是主要机制──

## 概念

### Mô hình này

```
                 ┌──────────────┐
                 │   Lead       │  plans, decomposes,
                 │  (Opus 4)    │  synthesizes
                 └──┬────┬───┬──┘
                    │    │   │
            ┌───────┘    │   └───────┐
            ▼            ▼           ▼
      ┌─────────┐  ┌─────────┐  ┌─────────┐
      │ Worker1 │  │ Worker2 │  │ Worker3 │
      │(Sonnet) │  │(Sonnet) │  │(Sonnet) │
      └─────────┘  └─────────┘  └─────────┘
         fresh       fresh        fresh
         context     context      context
```

Đàn 永远不读原料──Traba nhân trong tổng hợp chì 永远不会 thấy nhau làm việc──Tất cả các mũi tên đều là một lần với một tác phẩm nhỏ bé.

### Tại sao nó hiệu quả

三种机制:

1. **每个 subagent 都有 fresh context。**探索FIPA-ACL di sản nhân viên sẽ không mang theo dẫn đầu trong kế hoạch tiêu thụ 40k Token── nó nhận được một cửa sổ 200k để giải quyết một vấn đề──
2. **通过 prompt 实现 specialization。**Động lực của Lead là  phân hủy và tổng hợp, không phải  nghiên cứu── mỗi nhân viên                                                                                                                                                                                                                                                   
3. **Parallelism。**Công nhân không phát hành.`max(worker_times) + plan + synthesis`, thay vì `sum(worker_times)`

### Bài học kỹ thuật (Anthropic 2025)

Anthropic 文章 liệt kê một số bài học sản xuất vẫn liên quan đến năm 2026:

- **Scale effort to query complexity.** đơn giản các truy vấn: một đại lý,3-10 lần gọi công cụ. 复杂 truy vấn: 10+ đại lý.
- **Broad then narrow.**Trước tiên phân chia thành các câu hỏi phụ rộng, sau đó trong câu trả lời cần độ sâu để mỗi câu hỏi phụ tạo ra nhiều người lao động hơn.
- **Rainbow deployments.**Các đại lý là lâu dài 且状态的──传统蓝绿不适用──Anthropic 使用彩虹:逐步推出 新版本,同时让旧版本排水──
- **Token usage dominates.**Multi-agent 大约是单代理的15倍 Tokens──只有当任务值 足以证明成本合理时才运行它──

### LangGraph 转向

LangGraph ban đầu đã phát hành một con đường cao cấp .`create_supervisor`trợ lý của `langgraph-supervisor`library──2025年,LangChain sẽ đề xuất cách thức thay đổi để thông qua tool-calling 直接实现 supervisor pattern, vì tool calls 能更好地控制 *supervisor sees what*(context engineering)──

### Các chế độ thất bại

- **Lead hallucinates the plan.**Nếu các câu hỏi phụ của nhà sản xuất không giải quyết được vấn đề thực tế, công nhân sẽ làm nghiên cứu chính xác trên mục tiêu sai lầm.
- **Workers over-explore.**Nếu không có ranh giới phạm vi rõ ràng, công nhân sẽ phân bổ cho họ các phụ đề, và làm bẩn bước tổng hợp.
- **Synthesis conflicts.**Hai công nhân  trả lại những sự thật mâu thuẫn lẫn nhau. Người lãnh đạo phải hỏi lại.

### 什么时候 giám đốc là lựa chọn sai lầm

- **Sequential tasks.**Nếu bước 2 thực sự cần kết quả của bước 1, sự song song không có lợi ích.
- **Simple queries.**Một đại lý xử lý chúng nhanh hơn và dễ dàng hơn.
- **Strict determinism.**Giám sát viên sử dụng đại diện được LLM chọn.


```figure
supervisor-hierarchy
```

##  xây dựng nó

`code/main.py`Sử dụng `threading`实现一个由三个并行工人组成的监督者――领导将查询分解为子问题,工人并发处理每个子问题,领导 进行合成――没有真实LLM 工人是脚本,用来模拟搜索和总结――

关键结构:

- `Lead.plan(query)`Sẽ phân chia câu hỏi thành 3 câu hỏi phụ.
- `Worker.run(sub_q)`Trả lại một bản tóm tắt giả mạo (có thể là bất kỳ đại lý sử dụng công cụ nào trong sản xuất)
- `Lead.run(query)`Trong quá trình khởi động công nhân, tham gia, rồi tổng hợp.

运行:

```
python3 code/main.py
```

Kết quả sẽ hiển thị kế hoạch 带 bắt đầu / kết thúc dấu thời gian của các dấu vết của công nhân, cũng như tổng hợp cuối cùng. Bạn có thể xem: ba công nhân 0.3 giây hoàn thành trong khoảng 0.35 giây, thay vì 0.9 giây.

## Sử dụng nó

`outputs/skill-supervisor-designer.md`接收一个用户查询,并产出监督模式设计: dẫn hệ thống nhắc 、 nhân viên vai trò 、 phụ câu hỏi phân hủy quy tắc, cũng như mô hình tổng hợp.

##  phát hành nó

Bộ trưởng quản lý mẫu trước danh sách kiểm tra:

- **Model pairing.**Lead sử dụng mô hình cấp độ lý luận`o3`lớp) ―― Người lao động sử dụng mô hình hơn nhanh hơn hơn hơn`o4-mini`(■)
- **Worker timeout.**Bất cứ công nhân nào vượt quá 2x thời gian chạy trung bình sẽ bị giết; dẫn đầu hoặc sử dụng phạm vi khép lại, hoặc tiếp tục trong tình huống không có nó.
- **Token cap per worker.**Giới hạn cứng (ví dụ như 10x dự kiến đầu vào tổng hợp) ngăn chặn người lao động chạy trốn 爆预算。
- **Observability.**Theo dõi kế hoạch dẫn đầu, gọi công cụ của mỗi công nhân, cũng như tổng hợp. Đây là cơ sở của bất kỳ debugging hậu hoc nào.
- **Rainbow rollout.**Các đại lý lâu dài của nhà nước cần chuyển đổi phiên bản từng bước, thay vì trao đổi nóng.

## 练习

1. 运行 `code/main.py`, sau đó sửa đổi lead, làm cho nó tạo ra 5 người lao động thay vì 3 người. ...xem hiệu ứng đồng hồ tường. Trong demo này, số lượng lao động đến bao nhiêu lần sinh sản sẽ vượt quá tiết kiệm song song?
2. 实现 worker timeout:kill 任何运行超过0.5秒的 worker,并让 lead synthesis 剩余结果――你需要什么可观察性才能知道某工被切断?
3. 给领袖的综合 添加冲突检测步骤: Nếu hai công nhân trả lời phản đối nhau, dẫn đầu 标注分歧, thay vì chọn một trong số đó.
4. 阅读 Anthropic's Research-system engineering post──列出This toy demo phải được thực hiện trong sản xuất
5. So sánh LangGraph của `create_supervisor`(Legacy) và khuyến nghị gọi công cụ mới. Which one make you betterly control supervisor 能 see what? Tại sao Anthropic 明确 chỉ truyền các câu trả lời phụ vào tổng hợp, chứ không phải trong bối cảnh người lao động thô?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Supervisor | “Lead agent” | 一个 orchestrator agent，负责规划、委派和 synthesis。它不亲自执行工作。 |
| Worker | “Subagent” | 由 supervisor 以狭窄 scope 调用的 focused agent，并拥有自己的 context window。 |
| Orchestrator-worker | “Supervisor pattern” | 同一件事，不同名称。2026 文献两种说法都会使用。 |
| Fresh context | “Clean window” | Worker 的 context 从它的 system prompt 和分配的问题开始，而不是 lead 的 history。 |
| Rainbow deployment | “Gradual rollout” | Long-running stateful agents 需要 versioned drain-and-replace，而不是 blue-green。 |
| Token dominance | “Context is the variable” | 根据 Anthropic，research-eval 方差的 80% 来自使用的总 Tokens，而不是 model choice。 |
| Scale effort | “Match agent count to complexity” | Lead 估算 query 难度，并据此生成 1 个或 10+ workers。 |
| Synthesis conflict | “Workers disagree” | 两个 workers 返回互相矛盾的 facts；lead 必须暴露分歧，而不是默默选择一方。 |

## 延伸阅读
- [Anthropic engineering — 我们如何构建 multi-agent 研究系统](https://www.anthropic.com/engineering/multi-agent-research-system) mô hình giám sát của tham chiếu sản xuất
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) công cụ gọi giám sát 现在是推形式
- [LangGraph supervisor reference](https://reference.langchain.com/python/langgraph-supervisor) trợ lý di sản,2026 sản xuất 中仍在使用
- [OpenAI cookbook — Orchestrating Agents: Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) 基于交付的监督人 变体
