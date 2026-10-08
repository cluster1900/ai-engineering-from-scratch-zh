# Thời gian sản xuất: Thống kê, Sự kiện, Chron

> Nhân viên sản xuất 运行在六种运行时形 上: yêu cầu- phản ứng、streaming、durable execution、queue-based background、event-driven 和 scheduled──先选择形,再选择框架──Observability 在每种形中都是承载──

**类型：**Học tập
**语言：**Python (stdlib)
**先修要求：**Giai đoạn 14 · 13 (Langgraph), Giai đoạn 14 · 22 (Voice)
**时间：**~ 60 phút

## Học mục tiêu

- Nói ra sáu hình thức chạy thời gian sản xuất,并 sẽ phù hợp với mỗi hình thức của một khuôn khổ / mô hình sản phẩm.
- 解释 tại sao thực hiện lâu dài (LangGraph) đối với nhiệm vụ tầm xa  rất quan trọng.
- Mô tả thời gian chạy dựa trên sự kiện, cũng như Claude quản lý đại lý 适用场景──
- 解释 đa bước đại lý 中 quan sát-như-thánh tải 这一说法。

## 问题

Cách thất bại của đại lý sản xuất, là sổ ghi chép Jupyter  lộn xộn: 第37 步出现网络timeout, người dùng trong cuộc gọi thoại 途中挂,cron job trong máy tính khởi động lại 时死亡, người lao động nền 内存耗尽;; runtime hình thức quyết định những thất bại là có thể phục hồi;;

## 概念

### Đáp lại yêu cầu

- HTTP đồng bộ. Người dùng chờ kết thúc.
- Chỉ thích hợp cho nhiệm vụ ngắn (<30s)
- 技术:Agno (Python + FastAPI)、Mastra (TypeScript + Express/Hono/Fastify/Koa)。
- Tính năng quan sát: Standard HTTP access log + OTel span。

### Chuyển phát

- Sử dụng SSE hoặc WebSocket để thực hiện phát hành tiến bộ.
- LiveKit sẽ mở rộng nó đến WebRTC, sử dụng cho giọng nói / video (Dạy 22)
- Stack: bất kỳ hỗ trợ framework của streaming + 能处理 SSE/WS của frontend.
- Hình ảnh: mỗi phần của thời gian ∞ thời gian trễ đầu tiên ∞ thời gian trễ đuôi ∞

### Thực hiện lâu dài

- Mỗi bước sau đó đều có trạng thái kiểm soát; thất bại tự động phục hồi.
- Mô hình diễn viên AutoGen v0.4 sẽ thất bại tách biệt với một đại lý duy nhất.
- Sự khác biệt trong các bài học của LangGraph (Lớp 13):
- Khi số bước không biết và chi phí phục hồi rất cao, đó là điều cần thiết.

### Dựa trên hàng / nền

- Công việc vào hàng, người lao động 拉取执行, kết quả qua webhook hoặc pub/sub 回流
- Đối với đại lý tầm xa là cần thiết (trong mỗi nhiệm vụ có vài chục đến vài trăm bước, xem thông báo sử dụng máy tính của Anthropic)
- Stack:Celery (Python) ЅullMQ (Node) ЅSQS + Lambda (AWS) Ѕ tùy chỉnh‬
- Sự quan sát: độ sâu hàng, phân phối độ trễ của mỗi công việc, kích thước DLQ.

### Động cơ sự kiện

- Trình kích hoạt: email mới, PR mở, cron fire.
- Claude quản lý đại lý 开箱即支持这一点 (Dạy học 17)
- CrewAI Flow (Dạy học 15) được sử dụng để tổ chức dòng công việc xác định dựa trên sự kiện.
- Sự quan sát: nguồn kích hoạt, thời gian trễ từ sự kiện đến khởi động, thời gian trễ của đại lý.

### Chương trình

- 周期性运行的cron-shaped agent──
- Với việc thực hiện lâu dài 结合使用, như vậy thất bại chạy ban đêm có thể được phục hồi trong lần tiếp theo 时点
- 技术:Kubernetes CronJob + khung bền vững;托管方案(Render cron、Vercel cron)

### Mô hình triển khai năm 2026

- **CrewAI Flows**用于 sự kiện-động sản.
- **Agno**FastAPI không có quốc gia sử dụng cho dịch vụ vi mô Python.
- **Mastra**Server adapter(Express、Hono、Fastify、Koa) được sử dụng để nhúngền。
- **Pipecat Cloud / LiveKit Cloud**用于管理语音 (Pháp 22)
- **Claude Managed Agents**用于 được lưu trữ trong quá trình đồng bộ dài hạn.

### Sự quan sát là chịu tải

Nếu không có OpenTelemetry GenAI span (Dạy 23) và Langfuse/Phoenix/Opik backend (Dạy 24) bạn không thể điều tra một đại lý đa bước thất bại trong bước 40 này.

### Thời gian chạy sản xuất 失败的位置

- **选错 shape。**为一个 5 分钟任务选择请求-响应――用户挂断;工人堆积;retry 叠加――
- **没有 DLQ。**Người lao động xếp hàng không có chữ cái chết.
- **不透明的 background work。**Trình tác nhân nền 运行时不导出追踪. Cho đến khi người dùng báo cáo vấn đề, thất bại là không thể nhìn thấy.
- **跳过 durable state。**Bất cứ thứ gì hơn 30 giây, và bạn không thể chịu đựng được khởi động lại, đều cần thực hiện lâu dài.


```figure
wb-runtime-shapes
```

##  xây dựng nó

`code/main.py`Đó là một demo nhiều hình dạng:

- Điểm cuối yêu cầu-phản ứng (普通函数)
- Bộ xử lý dòng chảy (generator)
- Người lao động xếp hàng của DLQ.
- Registry trigger event.
- Cấp kế hình Cron

运行:

```bash
python3 code/main.py
```

输出:五条 痕迹, trình bày cùng một nhiệm vụ trong mỗi hình dạng 下的行为── cùng một logic đại lý, khác nhau lớp bên ngoài shell──

## Sử dụng nó

- **Request-response**Sử dụng cho UX kiểu trò chuyện.
- **Streaming**Sử dụng để phản ứng tiến bộ.
- **Durable**Để làm việc dài hạn.
- **Queue**用于 lô / đồng bộ / dài hạn.
- **Event**Sử dụng để phản ứng tác nhân.
- **Cron**Sử dụng cho việc quản lý nhà (khúc trình ghi nhớ, báo cáo chi phí).

##  phát hành nó

`outputs/skill-runtime-shape.md`会为一个任务 选择运行时间形状,并连接可观测性要求──

## 练习

1. Để bài học 01 của bạn ReAct vòng chuyển vào hàng của bạn trong tất cả sáu hình dạng.
2. 给队列 dựa trên demo 添加 DLQ──模拟 10% thất bại công việc; lộ kích thước DLQ──
3. 编写 một nhân viên đánh giá được kích hoạt cron, mỗi đêm nhắm vào 20 dấu vết hàng ngày 运行
4. 实现带压力的流媒体: Nếu khách hàng 很慢,就暂停代理――这如何与轮预算交互?
5. 阅读Claude quản lý đại lý docs... khi nào bạn sẽ tự lưu trữ đại lý tầm xa chuyển sang quản lý?

## 关键术语

| 术语 | 人们怎么说 | 实际含义 |
|------|------------|----------|
| Request-response | “Synchronous” | 用户等待；只适合短任务 |
| Streaming | “SSE / WS” | Progressive output；更好的 UX；每个 chunk 的 latency 可观察 |
| Durable execution | “Resume from failure” | Checkpointed state；从最后一步 restart |
| Queue-based | “Background jobs” | Producer / worker pool / DLQ |
| Event-driven | “Trigger-based” | Agent 对 external event 作出反应 |
| DLQ | “Dead-letter queue” | 失败 job 的停车场 |
| Claude Managed Agents | “Hosted harness” | Anthropic-hosted long-running async，带 caching + compaction |

## 延伸阅读

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) thực hiện lâu dài 细节
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) 托管的长期异步
- [Anthropic, Introducing computer use](https://www.anthropic.com/news/3-5-models-and-computer-use)  mỗi nhiệm vụ 几十到几百步
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) Tự tách lỗi mô hình diễn viên
