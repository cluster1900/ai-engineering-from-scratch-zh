# 长时间运行的后台 Đại diện:持久化执行

> Các đại lý không hoạt động trong vòng chu kỳ sản xuất`while True`Trung Quốc, mỗi lần LLM 调用都将成为一个带有检查点、retry 和重播的活动.`thread_id`Để kiểm soát chính thức mới nhất của 恢复.  Một cách dễ sử dụng mới, một mô hình cũ.  Phòng lưu lượng công việc 编排.  Chỉ cần thêm một mục nhập mới.

**Type:** Learn
**Languages:** Python (stdlib, minimal durable-execution state machine)
**先修要求：**Giai đoạn 15 · 10 (Phương thức cho phép), Giai đoạn 15 · 01 (Các chất có tầm nhìn dài)
**Time:** ~60 minutes

## 问题

设想一个运行四小时的代理――它调用三个工具,两个提示用户,并进行四十次的LLM 调用――运行到半小时,承载它的主机重启――会发生什么?

- Trong một sự đơn giản`while True`循环中:一切都会丢失──Run 从头开始──三工具调用 (带有真实副作用) 将再次执行──用户会再次被要求批准已批准已批准的事物──四十次 LLM 调用会被重新计费──
- Sử dụng kéo dài thực hiện:Run 会 từ điểm kiểm soát gần đây 恢复。 Các hoạt động đã hoàn thành sẽ không được thực hiện lại; kết quả của chúng sẽ được lặp lại từ nhật ký kéo dài。 người dùng không cần phê duyệt lại những điều đã được phê duyệt── đã hoàn thành LLM 调用 sẽ không được tính lại。

Đây là mô hình tương tự mà các công cụ workflow đã cung cấp trong thập kỷ qua (Temporal, Cadence, Uber's Cherami)  Sự thay đổi mới là LLM 调用 hiện cũng trở thành một mô hình hoạt động không chắc chắn  đắt tiền  mang lại tác dụng phụ  và chúng rất tự nhiên thích ứng với mô hình này 

Hướng dẫn chủ yếu của bài học này là: Long cycle reliability will decline (Thời gian dài của sự tin cậy sẽ suy giảm) METR  quan sát thấy  35 phút suy giảm  tỷ lệ thành công lớn theo chu kỳ呈二次下降)  Đường dài thực hiện để chạy có thể vượt quá thời gian được hỗ trợ bởi đường cong tin cậy; nếu thiết kế đúng, đây là một cách thất bại mới về an toàn, nếu thiết kế sai, thì sẽ thất bại theo cách không an toàn 

## 概念

### Các hoạt động, dòng công việc và chơi lại

- **Workflow**: xác định tính của các mã lập trình. Định nghĩa các hoạt động của các thứ tự.
- **Activity**Một đơn vị làm việc không chắc chắn, có thể thất bại. Làm liên lạc, công cụ gọi, viết tệp, yêu cầu HTTP.
- **Event log**:持久化支持商店──每个活动开始,完成,失败,退休,以及每个 Workflow quyết định都会被记录──
- **Replay**Khi phục hồi, Workflow Code sẽ được chạy lại từ đầu; mỗi hoạt động đã hoàn thành sẽ trở lại kết quả đã ghi lại, nhưng sẽ không được thực hiện lại.

Đây là tương tự như React  đối với DOM ảo tái tạo, hoặc Git từ cam kết tái xây dựng hình dạng của cây làm việc giống nhau.

### Tại sao LLM 调用 phù hợp với mô hình này

LLM 调用 có những đặc điểm sau:
- Không xác định: nhiệt độ > 0; ngay cả nhiệt độ 0 cũng sẽ thay đổi và di chuyển theo phiên bản mô hình.
- 昂贵(成本和延迟)
- Có thể thất bại.
- 带有副作用 (如果它们调用工具)

Đây là hình ảnh điển hình của hoạt động. Đưa mỗi lần LLM 调用封装 thành hoạt động, có thể có được với các lần thử nghiệm trở lại tăng trưởng  xuyên bắt đầu lại, cũng như theo dõi các bài tập có thể lặp lại.

### 以 `thread_id`Vì quan trọng của các điểm kiểm soát

LangGraph、Microsoft Agent Framework、Cloudflare Durable Objects 和 Claude Code Routines đều nhận được cùng một API 形态:一个`thread_id`(hoặc tương đương giá) nhận dạng phiên; mỗi lần chuyển đổi trạng thái đều kéo dài đến cuối cuối 

后端选择 rất quan trọng:

- **PostgreSQL**Đánh giá::持久、可查询、可跨部署存活──
- **SQLite**: chỉ dùng cho phần mềm nội bộ; trên máy chủ sẽ bị mất dữ liệu.
- **Redis**: tốc độ nhanh, nhưng nếu không được cấu hình AOF/phản ảnh nhanh thì là tạm thời.
- **Cloudflare Durable Objects**: transparent distributed; bởi chỉ có một khóa 限定范围;可存活数小时到数周──

### 人工输入 như một trạng thái thứ nhất

Đề xuất-sau-thực hành (Lớp 15) cần một sự chờ đợi lâu dài về tình trạng con người.

### 35 phút xuống cấp

METR quan sát thấy, tất cả các loại đại lý được đo lường trong hoạt động liên tục vượt quá khoảng 35 phút sau đó sẽ xuất hiện suy giảm độ tin cậy. Thời gian nhiệm vụ tăng gấp đôi, tỷ lệ thất bại tăng gấp bốn lần.

### 什么时候持久化执行不是正确答案

- Thời gian vận hành chỉ ngắn vài phút và không có đầu vào nhân tạo.
- 严格只读的信息检索──
- 正确性要求在一个文本窗口内端到端完成的任务 (một vài nhiệm vụ được tính toán; một số nhiệm vụ được tạo một lần)


```figure
memory-consolidation
```

## Sử dụng nó

`code/main.py`Sử dụng Python 实现 một động cơ thực hiện tối thiểu.

- `@activity`Decorator,将 inputs 和 outputs 记录到 JSON event log。
- Một hàm Workflow được sử dụng để xếp hạng các hoạt động 顺序.
- Một `run_or_replay(workflow, event_log)`chức năng, có thể chơi lại các hoạt động đã hoàn thành, không thực hiện lại chúng.

Driver 会模拟一个三 Activity 的工作流,在中途崩,并展示 (a) 朴素再试会重新执行所有内容,而 (b) 重播只运行缺失的活动──

## 交付 nó

`outputs/skill-durable-execution-review.md`会审查 một dự kiến dài hạn hoạt động của Cơ quan 部署 có đúng hình thức thực hiện lâu dài:

## 练习

1. 运行 `code/main.py`◊观察朴素重试与重播 之间 Activity 执行次数的差异──修改崩点,并显示重播数 会相应变化──

2. Để động cơ đồ chơi 改为显式使用 `thread_id`❖模拟 hai phiên phát hành của cùng một động cơ,并 xác nhận nhật ký sự kiện của chúng không sẽ xung đột.

3. Trong công cụ đồ chơi, chọn một hoạt động.  Đưa ra một quyết định không xác định.  Đánh dấu thời gian của dòng công việc.  Bước:`Workflow.now()`API) 

4. 阅读 LangChain của Runtime đằng sau các đại lý sâu sản xuất 文章──列出 runtime 持久化的每种状态,并说明每种覆盖了哪种失败模式──

5. Để một nhiệm vụ lập mã tự trị 6 giờ  thiết kế chính sách kiểm soát điểm. Bạn sẽ ở đâu?

## 关键术语

| Term | 人们通常怎么说 | 实际含义 |
|---|---|---|
| Workflow | “Agent 的脚本” | 确定性编排代码；可从 event log replay |
| Activity | “一个步骤” | 非确定性单元（LLM call、tool call）；执行前后都会被记录 |
| Event log | “backing store” | 每一次 state transition 的持久化记录 |
| Replay | “恢复” | 重新运行 Workflow；已完成 Activities 返回已记录结果，不重新执行 |
| Checkpoint | “保存点” | 以 thread_id 为 key 的持久化 state；resume 时最新状态胜出 |
| thread_id | “Session key” | 用来限定 durable state 范围的 identifier |
| 35-minute degradation | “可靠性衰减” | METR：成功率随周期大约呈二次下降 |
| Non-determinism | “replay 漂移” | Wall clock、random、LLM output；必须注册为 side effect |

## 延伸阅读

- [Anthropic — Claude Code Agent SDK: agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop) ngân sách, quay lại và sơ yếu lý lịch 语义。
- [Microsoft — Agent Framework: human-in-the-loop and checkpointing](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) RequestInfoEvent 形态。
- [LangChain — The Runtime Behind Production Deep Agents](https://www.langchain.com/conceptual-guides/runtime-behind-production-deep-agents)  yêu cầu thời gian chạy cụ thể
- [OpenAI Agents SDK + Temporal integration (Trigger.dev announcement)](https://trigger.dev) LLM 调用 hoạt động 形态。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 35 phút xuống cấp 参考。
