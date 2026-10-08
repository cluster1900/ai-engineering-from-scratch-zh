# AutoGen v0.4: Mô hình diễn viên và Quadro đại lý

> AutoGen v0.4 (Microsoft Research, tháng 1 năm 2025) xoay quanh mô hình diễn viên 重新设计了代理配套――Async message exchange、事件驱动的代理、故障隔离、自然并发──

**类型：**Học tập + xây dựng
**语言：**Python (stdlib)
**先修：**Giai đoạn 14 · 01 (Tình thức vận hành của các tác nhân), Giai đoạn 14 · 12 (Tình thức lưu lượng công việc)
**时间：**约75分钟

## Học mục tiêu

- Mô hình diễn viên: đại lý 作为演员,信息是唯一的IPC,每个演员 独立隔离故障──
- Nói ra ba cấp độ API của AutoGen v0.4: Core, AgentChat, và các tiện ích riêng rẽ.
- 解释 tại sao việc giao thông tin và xử lý sẽ mang đến sự cô lập lỗi 和自然并发──
- Trong Python để thực hiện một runtime diễn viên stdlib,并将一个双代理代码- Review flow 移植到其上.

## 问题

Đại đa số các cơ sở đại lý đều đồng bộ: một đại lý tạo nội dung, một đại lý tiêu thụ nội dung, hoạt động trong một đống gọi trong một đống thất bại sẽ làm cho đống sụp đổ.

Câu trả lời của AutoGen v0.4 là: mô hình diễn viên. Mỗi đại lý đều là một diễn viên có hộp thư đến riêng. Thông điệp là phương thức giao tiếp duy nhất.

## 概念

### Các diễn viên

Một diễn viên 拥有:

- Private có trạng thái bên ngoài luôn không thể tiếp xúc trực tiếp)
- Một hộp thư đến (một dòng tin nhắn)
- Một người quản lý:`receive(message) -> effects`, trong đó các hiệu ứng có thể là  trả lời   gửi đến các diễn viên khác   tạo ra các diễn viên mới    cập nhật trạng thái    tự dừng lại   

Hai diễn viên không thể chia sẻ trí nhớ. Họ chỉ có thể gửi tin nhắn.

### AutoGen v0.4 中的三个API层

1. **Core.**- Quản lý diễn viên cấp dưới.`AgentRuntime``Agent``Message``Topic`❖ trao đổi tin nhắn đồng bộ, dựa trên sự kiện ❖
2. **AgentChat.**面向任务的高层API(替代 v0.2 của ConversableAgent)`AssistantAgent``UserProxyAgent``RoundRobinGroupChat``SelectorGroupChat`
3. **Extensions.**集成:OpenAI、Anthropic、Azure、tools、memory。

### Tại sao giải thích là quan trọng

Trong v0.2 模型中,同步调用 `agent_a.chat(agent_b)`会阻塞 agent_a, cho đến khi agent_b  quay lại. Trong v0.4,`send(agent_b, msg)`会把消息 放入 agent_b's inbox, rồi ngay lập tức quay lại.

- **Fault isolation.**Đặc vụ B    sẽ không dẫn đến sự sụp đổ của đặc vụ A, thời gian chạy 会 bắt giữ người điều hành của B trong thất bại,并 quyết định cách xử lý ((log,retry, dead-letter) 
- **自然并发。**Nhiều tin nhắn có thể được gửi cùng lúc; diễn viên không được gửi đến để xử lý hộp thư đến của mình.
- **面向分布式。**Dù diễn viên đang trong quá trình hay đang ở một người chủ nhà khác trên, hộp thư đến + vận chuyển đều là cùng một sự rút ngắn.

### 拓

- **RoundRobinGroupChat.**Trưởng lý: E E E FIXTING RULE
- **SelectorGroupChat.**Trưởng tuyển chọn 根据对话背景 选择下一位──
- **Magentic-One.**Sử dụng để duyệt web, thực thi mã, xử lý tệp, tham khảo nhóm đa đại lý.

### 可观测性

内置支持 OpenTelemetry── mỗi tin nhắn 都会发发出一个跨度; công cụ gọi 根据2026 OTel GenAI ngữ nghĩa quy ước(Lớp 23)携带 `gen_ai.*`thuộc tính.

### 状态:Phương thức bảo trì

Đầu năm 2026: AutoGen v0.7.x đối với nghiên cứu và tạo mẫu 来说是稳定的──Microsoft 已将积极开发 转向Microsoft Agent Framework(2025 年 10 月 1 日 预览公众;1.0 GA 目标为 2026 年 Q1 末)──AutoGen mô hình có thể干净地向前移植, mô hình diễn viên là một ý tưởng lâu dài──


```figure
actor-mailbox
```

##  xây dựng nó

`code/main.py`实现 một diễn viên chạy thời gian:

- `Message`:带有 `sender``recipient``topic``body`                                                                                                                                                                                                                                                              
- `Actor`:带有 `receive(message, runtime)`ng ng ng ng ng
- `Runtime`:带有共享队列, giao hàng, cách ly lỗi của vòng lặp sự kiện.
- Một diễn viên demo:`ReviewerAgent`mã xem xét,`ChecklistAgent`运行 checklist; chúng trao đổi thông điệp cho đến khi đạt được sự đồng thuận.

运行:

```
python3 code/main.py
```

Trace sẽ hiển thị việc truyền tải thông điệp, một diễn viên trong đó sẽ không làm cho một diễn viên khác thất bại trong sự sụp đổ, cũng như quá trình nhận được kết án chung.

## Sử dụng nó

- **AutoGen v0.4/v0.7**(phục vụ bảo trì):适合 nghiên cứu, tạo mẫu, tạo mẫu đa tác nhân.
- **Microsoft Agent Framework**(chính giả xem trước):未来路径;同样演员-模范思想,刷新后的API。
- **LangGraph swarm topology**(Dạy học 13): Thông qua giao dịch công cụ chung 实现类似模式──
- **Custom actor runtime**Khi bạn cần một loại vận chuyển cụ thể (NATS, RabbitMQ, GRPC)

## 交付 nó

`outputs/skill-actor-runtime.md`会为给定的多代理任务 生成一个最小演员运行时间 和一个团队模板 ((RoundRobin或 Selector) ⋅

## 练习

1. Thêm hàng chữ cái chết: Khi người xử lý 抛出异常时,把失败消息 停止放起来为人工检查. Trong đồ chơi của bạn, DLQ 多久会被命中一次?
2. 实现 `SelectorGroupChat`: Một diễn viên chọn 根据对话状态 选择谁处理下一条条消息。
3. 添加分布式运输:把 in-process queue 替换为 JSON-over-HTTP server,让演员可以运行在独立进程中──
4. 为每条消息 接入一个 OTel span (hoặc không có hoạt động) ⋅按课23 发发发 `gen_ai.agent.name``gen_ai.operation.name`
5. 阅读 AutoGen v0.4 文章 về kiến trúc.`autogen_core`API... Anh nhảy qua những điều quan trọng nào trong sản xuất?

## 关键术语

| 术语 | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| Actor | "Agent" | 私有 state + inbox + handler；没有共享 memory |
| Message | "Event" | 类型化 payload；actor 交互的唯一方式 |
| Inbox | "Mailbox" | 每个 actor 的 pending message queue |
| Runtime | "Agent host" | 路由 message 并隔离失败的 event loop |
| Topic | "Channel" | actor 之间命名的 publish-subscribe route |
| Fault isolation | "Let it crash" | 一个 actor 失败不会让其他 actor 崩溃 |
| RoundRobinGroupChat | "固定轮转 team" | Agent 按顺序轮流行动 |
| SelectorGroupChat | "按 context 路由的 team" | Selector 选择下一位 |
| Magentic-One | "参考 team" | 用于 web + code + files 的 multi-agent squad |

## 延伸阅读

- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) thiết kế lại 文章
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) thay thế hình đồ thị
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) AutoGen 默认发射 span
