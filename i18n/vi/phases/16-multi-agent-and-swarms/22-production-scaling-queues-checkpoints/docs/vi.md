# 生产扩展  队列、Checkpoints、Durability

> Các hệ thống đa đại lý sẽ mở rộng đến hàng ngàn và phát triển hoạt động, cần thiết**durable execution**◊ Thời gian chạy của LongGraph 会在每个超级步骤 后写入一个由 `thread_id`标识的检查点(默认使用 Postgres); người lao động 崩会释租, người lao động khác 会接手恢复──**MegaAgent**(arXiv:2408.09955) 运行一个按代理 划分的生产者消费者队列,包含三种状态 (Idle / Processing / Response) 和两层协调 (组内聊天 +组间管理聊天)**Fiber/async**优于线程-per-jobs:threads 99% of the time都在空等待代币, trong khi các sợi 会在 I/O 上协作式让出.**FastAPI + Postgres + nothing else**, đơn giản cấu trúc hơn dự kiến đi xa hơn. Bài học này sẽ xây dựng một nhật ký kiểm soát lâu dài, một xếp hàng làm việc mỗi đại lý chuyển đổi trạng thái, một bản demo đồng bộ với sợi, và đặt thực tế.

**Type:** Learn + Build
**Languages:** Python (stdlib, `asyncio`, `sqlite3`)
**前置要求：**Giai đoạn 16 · 09 (Mạng lưới sôi đồng thời), Giai đoạn 16 · 13 (Tưởng thức chia sẻ)
**Time:** ~75 minutes

## 问题

Một hệ thống đa đại lý nguyên mẫu trên một máy tính xách tay 上 sử dụng ba đại lý và một vòng lặp trong bộ nhớ hoạt động bình thường.

- Các đại lý có thể chạy vài giờ.
- Các quy trình công nhân sẽ sụp đổ.
- Lượng tải đỉnh là 10 lần tải trung bình; bạn cần mở rộng mức độ.
- Người dùng theo đại lý  trả phí; bạn cần phải sử dụng để tính toán chính xác một lần ngữ nghĩa.

In-memory event loop 无法处理这些问题──你需要在底层增加一个持久的执行层──2026年的典型选项是:

1. 带 checkpoint của công cụ lưu lượng công việc ((Temporal、LangGraph runtime) 👇
2. 带 cửa hàng nhà nước của thư xếp hàng(Postgres + SQS/RabbitMQ)
3. Các khung mô hình diễn viên (MegaAgent's per-agent producer-consumer)
4. 手写 FastAPI + Postgres(Bedi 的观点)。

Bài học này sẽ xây dựng một phiên bản nhỏ của mỗi chương trình.

## 概念

### Hoạt động lâu dài, mô hình này

Longgraph 术语中的超级步骤) sau đó持久化完整程序状态──崩时:

```
worker crashes mid-step
  -> lease timeout
  -> another worker picks up the thread_id
  -> resumes from last checkpoint
  -> no duplicate side effects
```

Để làm việc, cần phải đáp ứng:

- **Serializable state。**Tất cả các nhà nước đại lý đều phải được duy trì.
- **Deterministic resume。**给定相同状态和相同的输入,agent会产生相同的行动 (或将LLM call 委托给外部决定性 Oracle)
- **Idempotent side effects。**Các cuộc gọi bên ngoài (các cuộc gọi công cụ, thanh toán) phải là vô hiệu hoặc sử dụng khóa giảm trùng lặp.

LangGraph trong mỗi siêu bước 后写 kiểm tra điểm;Temporary trong mỗi hoạt động 后写;Restate Sử dụng các tạp chí nguồn gốc sự kiện。

### Thời gian chạy của LangGraph

Mỗi đại lý đều có một.`thread_id`;state là type dict; mỗi siêu bước đều hướng đến bảng điểm kiểm soát 写入一行。恢复时,runtime từ điểm kiểm soát cuối cùng 继续, thay vì từ头开始。`interrupt()`Để chờ nhập nhân tạo; thời gian chạy 会持久化并释放工人──

Đây là một thiết kế sản xuất tham khảo cho tháng 4 năm 2026.

### Đường xếp hàng của MegaAgent

ArXiv:2408.09955  mô tả một thí nghiệm quy mô: một cluster trong đó có hàng ngàn các đại lý并发── cấu trúc như sau:

```
agent i:
  state ∈ {Idle, Processing, Response}
  in_queue   <- messages addressed to agent i
  out_queue  -> replies + side effects

coordinators:
  intra-group chat  (agents in the same group)
  inter-group admin chat  (high-level routing)
```

两层协调允许组内对话发生高密度,而组间保持稀疏―― đây là một mô hình duy trì chi phí tuyến tính giữa hàng ngàn đại lý――

### Async vs thread-per-job

LLM gọi là I/O-bound. chờ đợi một chuỗi tiếp theo của token 99% thời gian là空的. Mỗi chuỗi tiêu thụ khoảng 1MB RAM. Trong 10.000 cuộc gọi, ánh sáng xếp chồng lên cần 10GB.

Sợi: Python`asyncio`、Go goroutines、Rust `tokio`(văn) sẽ được thực hiện trong I/O trên các cuộc gọi để đưa ra.

Ví dụ:Phục bộ xử lý liên quan đến CPU (impedding, tokenizer) vẫn cần các chuỗi hoặc quy trình.

### Quan điểm ngược lại của Bedi

"Scaling Agentic Software" (Ashpreet Bedi, 2026) cho rằng, hầu hết các nhóm đã quá trình xây dựng trước khi tải trọng được đo lường.

- FastAPI + Postgrres。
- Mỗi đại lý chạy là một dòng; trạng thái sử dụng đồng thời lạc quan 原地更新。
-  Thông qua `pg_notify`Hoặc đơn giản là công nhân chăn nuôi  thực hiện các công việc nền tảng
- Trong mã ứng dụng thực hiện chính sách thử lại.

Đối với ít hơn 100 lần phát hành các tác vụ, nhiệm vụ có thể kiểm soát được, điều này thường đã đủ.

Quy tắc là: Khi bạn gặp vấn đề cụ thể mà cấu trúc đơn giản không thể giải quyết, hãy sử dụng lại các khung thực hiện bền vững.

### - Đúng là một lần -

Đối với các hoạt động của đại lý thanh toán, bạn cần "đơn giản hiệu quả một lần" (đối thiểu một lần giao hàng + người tiêu dùng không có khả năng)

- **每个 run 一个 dedup key。**Trong mỗi cuộc gọi tác dụng phụ, nó chứa nó.
- **Outbox pattern。**Các tác dụng phụ trước viết vào một bảng, lại bởi quá trình độc lập 执行── hai bước cần phải là vô hiệu.
- **Compensating transactions。**Khi tác dụng phụ thành công nhưng theo dõi viết 失败时, sắp xếp bù đắp操作。

Những này là các mô hình kỹ thuật cơ sở dữ liệu, không phải là LLM cụ thể.

### Việc triển khai sơn sơn

Hệ thống nghiên cứu đa đại lý của Anthropic sử dụng "đưa cầu vồng": nhiều đại lý runtime 版本并发运行, vì vậy đại lý chạy dài thời gian không cần phải bị giết trong mỗi lần triển khai mã ⋅ đối với một phần nhỏ lưu lượng Canary ⋅ phiên bản mới;当旧版本的代理 结束后再淘汰旧版本──

Đây là thực tiễn tiêu chuẩn của hệ thống trạng thái dài hạn; điểm thích ứng năm 2026 là các đại lý có thể tồn tại trong một số giờ, do đó chu kỳ triển khai phải phù hợp với điều này.

### 典型生产 kiểm tra danh sách

- Tình trạng bền vững ((điểm kiểm tra, chụp nhanh, hoặc hộp thư xả + bản ghi có thể chơi lại)
- Các tác dụng phụ không có khả năng:.
- Sử dụng lớp I/O không đồng bộ của các cuộc gọi LLM.
- 带 dedup của ít nhất một lần giao hàng.
- 面向 trạng thái tải trọng công việc của sương cầu/canary triển khai.
- Hình ảnh:chỉ số các hoạt động của các đại lý, kiểm toán siêu bước, kiểm toán trở lại.


```figure
sw-checkpoint-replay
```

##  xây dựng nó

`code/main.py`实现:

- `CheckpointStore` Quý vị kiểm soát được hỗ trợ bởi SQLite, sử dụng các khóa thread-id.
- `run_with_checkpoint(agent, thread_id)` 模拟中期崩; nhân viên thứ hai từ điểm kiểm soát cuối cùng 恢复。
- `AgentQueue` mỗi đại lý  Máy trạng thái không hoạt động / xử lý / phản ứng, với một hàng làm việc nhỏ.
- `demo_async_vs_threads()` 通过asyncio 和线程 运行 500 个并发模拟"LLM gọi"; báo cáo tường đồng hồ 和 memory đỉnh ((近似) ").

运行:

```
python3 code/main.py
```

预期输出:模拟崩后检查点恢复 成功;async version 在 < 1s 内处理 500 个并发电话;thread version 需要几秒,并且每个并发单元使用的内存 高出数量级──

## Sử dụng nó

`outputs/skill-scaling-advisor.md`会根据负载、状态-retention 需求和部署 频率,建议持续执行 选择:FastAPI + Postgres、LangGraph runtime、Temporal或 custom。

##  phát hành nó

典型生产加固:

- **从简单开始（Bedi 的规则）。**Sử dụng FastAPI + Postgres, cho đến khi bạn nhận thấy nó thất bại.
- **在优化之前 instrument everything。**HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGAM HISTORGEM HISTORGEM HISTORGEM HISTORGEM HISTORGEM HISTORGEM HISTORGEM HISTORGEM HISTORGEM HISTORGEM
- **为 side effects 使用 outbox pattern。**Đặc biệt là thanh toán và các cuộc gọi API bên ngoài.
- **Rainbow deploys。**Trong thời gian triển khai, đừng bao giờ giết người trong chuyến bay.
- **当你遇到具体问题时采用 durable-execution engines（Temporal / LangGraph / Restate）：**Những người chờ đợi trong vòng vòng một giờ, phối hợp xuyên khu vực, các chính sách bồi thường/bồi thường phức tạp.
- **I/O layer 使用 async。**Các dây chỉ được sử dụng để xử lý sau khi kết nối với CPU.

## 练习

1. 运行 `code/main.py` xác nhận điểm kiểm soát tiếp tục 生效; đo lường đồng bộ so với chuỗi đồng thời 差异。
2. 实现一个 **outbox**Bảng: Mỗi tool call trước viết vào outbox, sau đó bởi đơn độc goroutine/task 执行──通过运行两次 tool call 来验证无权──
3. 模拟一个 **rainbow deploy**: hai并发 runtime phiên bản;将一半新线_ids 路由到各自版本; xác nhận các线程 trên phiên bản cũ không bị gián đoạn.
4. 阅读下面链接中的 LangGraph runtime doc──识别 runtime 中哪些功能在手写 FastAPI + Postgres 版本中最耗耗时间──那是理由采用它,还是可以延迟?
5. 阅读 MegaAgent (arXiv:2408.09955) Phần 3──两层协调(intra-group + intergroup admin chat) là hiển nhiên──画出你会将它映射到带两类队列家庭的消息队列──

## 关键术语

| Term | 人们的说法 | 它实际的含义 |
|------|----------------|------------------------|
| Durable execution | "Persist the program state" | Engine 在每个 super-step 后写入 state；crash recovery 是 deterministic 的。 |
| Super-step | "Transactional boundary" | Checkpoints 之间的 work unit。LangGraph 术语。 |
| thread_id | "Agent run identifier" | 绑定 checkpoints 和 resume logic 的 key。 |
| Idempotency | "Safe to retry" | 重复一个 side effect 产生的结果与一次尝试相同。 |
| Outbox pattern | "Decouple side effects" | 将 intent 写入 table；独立 executor 执行并标记完成。 |
| At-least-once delivery | "Possible duplicates" | Message queue semantics；dedup key 让 consumer 达到 effective-once。 |
| Rainbow deploy | "Overlapping versions" | 长时间运行 workloads 期间多个 runtime versions 并发存在。 |
| Async fiber | "Cooperative yielding" | User-mode concurrency；对于 I/O-bound loads，相比 threads 成本很低。 |
| Checkpoint | "State snapshot" | super-step 边界处的 serialized state；是 resume 的 key。 |

## 延伸阅读

- [LangChain — The runtime behind production deep agents](https://www.langchain.com/conceptual-guides/runtime-behind-production-deep-agents) Thiết kế thời gian chạy LangGraph
- [MegaAgent](https://arxiv.org/abs/2408.09955) hàng đầu sản xuất-thành khách hàng cho mỗi đại lý; hàng ngàn đại lý và đại lý
- [Matrix](https://arxiv.org/abs/2511.21686) Sử dụng hàng thư 作为协调基的分散框架
- [Temporal docs](https://docs.temporal.io/) thực hiện bền của công cụ lưu lượng công việc tham khảo
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) Bao gồm triển khai cung điện trong kinh nghiệm sản xuất
