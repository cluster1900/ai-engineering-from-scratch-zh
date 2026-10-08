# Các kiến trúc song song / Swarm / Networked

> Đối với người giám sát: không có quyết định trung ương. Các đại lý 读取共享事件bus,异步领取工作,并写回结果. LongGraph 明确支持面向去中心化、动态环境的"Swarm Architecture"――Matrix (arXiv:2511.21686) sẽ kiểm soát dòng chảy và dòng chảy dữ liệu đều được biểu hiện để thông qua các hàng rào phân phối các tin nhắn liên tục, để loại bỏ các dòng chảy của tổ chức.

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`, `queue`)
**前置要求：**Giai đoạn 16 · 05 (Tình mẫu giám sát viên), Giai đoạn 16 · 04 (Tình mẫu sơ bộ)
**Time:** ~75 minutes

## 问题
Giám đốc có thể mở rộng đến một số ít công nhân. Một vài trăm người đó? Giám đốc sẽ trở thành một cái chai: ai làm gì mỗi quyết định phải thông qua một đại lý.

Các kiến trúc hàng loạt phản chuyển thiết kế này── không phải bởi nhà hoạch định trung tâm phân phát công việc, mà là công nhân từ hàng đợi chia sẻ trong nhận được công việc──"sự phối hợp" được đặt trong ngữ nghĩa của bus sự kiện 中── không có nhạc công; hệ thống sẽ tiếp tục mở rộng, cho đến khi hàng đợi  trở thành giới hạn──

## 概念
### Hình dạng

```
                ┌──── shared queue ────┐
                │                      │
       ┌────────┼────────┐  ◄──────┬───┘
       ▼        ▼        ▼         │
     Worker  Worker  Worker   Worker
      A       B       C        D
       │        │        │         │
       └────────┴────────┴─────────┘
                 │
                 ▼
            results pool
```

Không có nhạc công. Mỗi công nhân phản hồi: 拉取一个任务,处理,写入结果.

### Khi đám đông phù hợp

- **许多独立 tasks。**Scraping, transforming, classifying, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks, tasks,
- **可变时长的工作。**Nếu một số công việc cần 100ms, còn một số khác cần 10s, swarm sẽ tự động cân bằng tải  快速工会拉取后续工作── giám sát viên 必须提提前预测时间──
- **Throughput 优先于 determinism。**Bạn quan tâm đến thời gian hoàn thành, chứ không phải là yêu cầu nghiêm ngặt.

### Khi đám đông thất bại

- **有序 workflows。**Nếu bước 3  cần đầu ra bước 2, hàng có thể để bước 3 完成前触发。
- **Global-plan tasks。** Các câu hỏi nghiên cứu phức tạp được hưởng lợi từ nhà hoạch định.
- **Debugging。**Không có ghi chép trung tâm và hoạt động 异步时,复现 bug 成本很高──

### Matrix (arXiv:2511.21686)

Matrix là một bài báo năm 2025, nó sẽ tràn ngập  hướng đến kết luận tự nhiên: lưu lượng kiểm soát và lưu lượng dữ liệu đều nằm trong hàng phân phối trên các tin nhắn được sắp xếp theo chuỗi. Không có điều phối viên trung tâm.

贡献: Một mô hình lập trình, trong đó sự phối hợp đa đại lý là  this agent 订阅哪个消息主题?, thay vì supervisor Next step choose which agent? This makes the system look like a pub/sub event mesh。

### Thiết kế của LangGraph

LangGraph 2025 docs 明确将将"Swarm Architecture" 描述为多代理模式 之一:agents are nodes, nhưng cạnh 形成带周期的导向图,并且任何 node 都可以从池中被激活──Worker 根据条件从可用工作中选择,而不是由监督任务指派──

### Phương thức không hoạt động: đói và phát hiện điểm nóng

Nếu tất cả công nhân đều có nhiệm vụ nhanh nhất có thể, nhiệm vụ dài hạn cho đến khi chỉ còn lại chúng sẽ được thực hiện.

Giảm thiểu:
- 带显式老龄化的优先排队 (随着等待时间) 提高优先排队 (随着等待时间)
- Chuyên môn công nhân: một số công nhân chỉ nhận được các nhiệm vụ "dường dài"
- Khác áp lực: hạn chế vào hàng các nhiệm vụ nhanh số lượng.

### Liên kết định tuyến dựa trên nội dung

Swarm và định tuyến dựa trên nội dung (Dạy 22): tự nhiên配对―― không sử dụng hàng đợi chung, mà dành cho mỗi loại tin nhắn  chuẩn bị một hàng đợi―― Công nhân chuyên gia chỉ đăng ký loại của mình―― đây là cơ sở của kiến trúc bus tin nhắn của hàng ngàn đại lý.


```figure
sw-work-stealing
```

##  xây dựng nó
`code/main.py`Thực hiện một đám đông gồm 4 dây thép công nhân, chúng được chia sẻ.`queue.Queue`中拉取任务──Tasks 具有可变的持续时间(有些快,有些慢)──该 demo 对比:

- **Sequential baseline:**Một công nhân làm tất cả các nhiệm vụ.
- **Fixed assignment:**Mỗi nhiệm vụ  tiên quyết phân bổ cho một công nhân cụ thể (tương tự giám sát viên)
- **Swarm:**Công nhân từ hàng đợi chia sẻ 中拉取──

Swarm sẽ tự động cân bằng tải trọng; nhiệm vụ cố định 会在某项任务 很慢时让快工人 置──

Đi chạy:

```
python3 code/main.py
```

Kết quả sẽ cho thấy mỗi công nhân có nhiệm vụ đếm số lượng (swarm 分布不均但优) và thời gian đồng hồ tường.

## Sử dụng nó
`outputs/skill-swarm-fit.md`评估一个任务 应该使用群 还是监督者──Input:task independence、duration variance、ordering requirements、debugability needs──

## 交付 nó
Danh sách kiểm tra:

- **带 aging 的 Priority queue。** ngăn ngừa nạn đói trong quá trình làm việc dài.
- **Worker idempotency。**Nếu người lao động trong thời gian giữa, một nhiệm vụ có thể được kéo theo nhiều lần.
- **Durable queue。**生产环境使用 Kafka、Redis Streams hoặc hàng xếp dựa trên cơ sở dữ liệu`queue.Queue`Chỉ trong lưu trữ.
- **每个 task 的 observability。**Mỗi nhiệm vụ đều có thẻ ghi dấu; mỗi công nhân đều sử dụng nó ghi lại bắt đầu / kết thúc.
- **Back-pressure。**Nếu hàng rào tăng nhanh hơn là công nhân cạn kiệt tốc độ của nó, bạn sẽ làm chậm nhà sản xuất.

## 练习
1. 运行 `code/main.py`Trong khối lượng công việc thời gian biến đổi trên, swarm hơn chuỗi 快多少?
2. 添加一个优先排列变体(使用 `queue.PriorityQueue`(■) Theo nhiệm vụ của "bách trọng" trường phân chia ưu tiên■ quan sát trong tải liên tục
3. 实现一个热点检测器:当任何工人 处理的任务 数量达到最慢工人的3× 时记录日志――说明 nhiệm vụ-duration分布 存在什么情况?
4. 阅读 Matrix paper (arXiv:2511.21686) trừu tượng 和 Section 3。识别 Matrix 接受一个具体的交易️扩展性获益) 以及它放弃一个交易️追溯性、定制主义)。
5. 将 swarm demo 改为使用由 (task_type, payload) tuples 组成的 `queue.Queue`,workers only subscribe specific types. Khi các nhiệm vụ khác nhau, những quy tắc định tuyến nào là hợp lý?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Swarm architecture | "Decentralized agents" | Workers 从 shared queue 中拉取；没有 central orchestrator。 |
| Event bus | "Agents subscribe to topics" | 按 type 或 content 将 tasks 路由给 workers 的 message broker。 |
| Starvation | "Task never runs" | 因为 higher-priority work 持续到达，low-priority task 永远不会被选中。 |
| Hot-spotting | "One worker drowns" | 一个 worker 获得大多数 tasks 的 load imbalance。 |
| Back-pressure | "Slow down the producer" | 当 queue 填满时，向 upstream 发出停止生产信号的 mechanism。 |
| Idempotent worker | "Safe to re-run" | 一个 task 被处理两次会产生相同 result。因为 workers 可能在 mid-run 崩溃，所以这是必需的。 |
| Durable queue | "Survives crashes" | 由 disk 或 replicated storage 支持的 queue；worker 崩溃时 tasks 不会丢失。 |
| Matrix framework | "Full message-passing swarm" | Data 和 control flow 都是在 distributed queues 上的 serialized messages。 |

## 延伸阅读
- [LangGraph workflows and agents — Swarm Architecture](https://docs.langchain.com/oss/python/langgraph/workflows-agents) 明确支持群
- [Matrix — A Decentralized Framework for Multi-Agent Systems](https://arxiv.org/abs/2511.21686) 完整 thông điệp thông qua đàn
- [Anthropic engineering — why supervisor not swarm in Research](https://www.anthropic.com/engineering/multi-agent-research-system) Tại sao một hệ thống sản xuất cụ thể 明确选择 giám sát viên chứ không phải đàn
- [AutoGen v0.4 actor-model docs](https://microsoft.github.io/autogen/stable/) diễn viên tập trung vào sự kiện viết lại,比 v0.2 của GroupChat
