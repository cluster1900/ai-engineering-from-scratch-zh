# OpenAI Agents SDK: Handoffs, Guardrails, Tracking

> OpenAI Agents SDK dựa trên các ứng dụng của API xây dựng các hệ thống đa đại lý hạng nhẹ.`transfer_to_<agent>`Các công cụ. Guardrail 会在输入或输出 上触发.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 06 (Tool Use)
**Time:** ~75 minutes

## Học mục tiêu
- Nói ra 5 nguyên thủy của OpenAI Agents SDK.
- Giải thích giao dịch: Tại sao chúng được xây dựng như là công cụ 模型看的名称 形状是什么以及背景 如何转移──
- 区分 input guardrails、output guardrails 和 tool guardrails; giải thích `run_in_parallel`Với chế độ chặn.
- Sử dụng stdlib 实现一个带有手渡 + guardrails + span-style tracing của thời gian chạy.

## 问题
Các đại lý không thể làm sạch đại diện cuối cùng sẽ đưa tất cả nội dung vào một prompt. Các đại lý không có hàng rào sẽ giao PII, sản xuất trái với chính sách, hoặc một vòng lặp vĩnh viễn.

## 概念
### 5 nguyên thủy

1. **Agent.**LLM + hướng dẫn + công cụ + giao tiếp:
2. **Handoff.**Delege 给另一个代理――对模型表现为一个名为`transfer_to_<agent_name>`của công cụ.
3. **Guardrail.**Để nhập (( chỉ thứ nhất đại lý) ≈output (( chỉ thứ nhất đại lý) ≈ tool invocation ((mỗi công cụ chức năng) ≈ validation ((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((
4. **Session.**跨 turns ở lịch sử trò chuyện tự động
5. **Tracing.**Các thế hệ LLM, các công cụ gọi, trợ giúp, và các thiết bị bảo vệ.

### Giúp như là công cụ

模型会在它的工具列表中看 `transfer_to_billing_agent`❖调用 nó sẽ chạy thời gian 发出信号:

1. 复制 ngữ cảnh trò chuyện`nest_handoff_history`Beta sẽ sụp đổ)
2. Sử dụng mục tiêu đại lý hướng dẫn
3. Use target agent  tiếp tục chạy.

Đó là mô hình giám sát sản phẩm hóa (Dân học 13 / Dân học 28)

### Đường dây bảo vệ

三种类型:

- **Input guardrails.**Trong đầu tiên của đại lý đầu tiên                                                                                                                                                                                                                                                           
- **Output guardrails.**Trong cuối cùng của một đại lý xuất phát trên hành trình.
- **Tool guardrails.**按功能工具 运行──Tính dụng các lập luận、 kiểm tra quyền、 kiểm toán thực hiện──

Phương thức:

- **Parallel**(默认) ・Guardrail LLM 与主要 LLM 同时运行。较低尾延迟。如果触发,主要 LLM 的工作会被丢弃(浪费代币)。
- **Blocking**(`run_in_parallel=False`(Guardail LLM 先运行. Nếu触发, cuộc gọi chính sẽ không lãng phí Token.

Tripwire sẽ bị bỏ ra`InputGuardrailTripwireTriggered`- `OutputGuardrailTripwireTriggered`

### Theo dõi

Mỗi lần phát sóng của LLM, mỗi lần gọi công cụ, và mỗi lần phát sóng của một thành phố.`OPENAI_AGENTS_DISABLE_TRACING=1`Tôi sẽ quay lại.`add_trace_processor(processor)`会将 trải dài các fan đến phần sau của bạn, đồng thời cũng được gửi đến phần sau của OpenAI.

### Các buổi

`Session`将 lịch sử cuộc trò chuyện 存储在后端 中(SQLite、Redis、自定义)`Runner.run(agent, input, session=session)`会自动加载并添加.

### Mô hình này dễ dàng xuất hiện ở nơi

- **Handoff drift.**Cảnh sát A đưa tay ra cho Cảnh sát B, Cảnh sát B đưa tay lại cho Cảnh sát A.
- **Guardrail bypass.**Các công cụ bảo vệ chỉ trong các công cụ chức năng 上触发;内置 công cụ(fail reader、web fetch) cần chính sách riêng biệt.
- **Over-tracing.**Trong các khoảng thời gian, có chứa nội dung nhạy cảm.


```figure
ae-agent-handoff
```

##  xây dựng nó
`code/main.py`Sử dụng stdlib 实现 SDK 形状:

- `Agent``FunctionTool``Handoff`(Làm như một công cụ chức năng có chuyển giao 语义)
- 带 input/output/tool guardrails、handoff dispatch 和 hop counter 的 `Runner`
- Một máy phát sóng dài đơn giản, được sử dụng để hiển thị hình dạng dấu vết.
- Một đại lý phân loại, sẽ theo yêu cầu của người dùng chuyển đến thanh toán hoặc hỗ trợ; guardrail sẽ ở trong một đầu vào trên xúc tác.

运行:

```
python3 code/main.py
```

Trace  đã cho thấy hai giao hàng thành công, một chuyến đi vào và một cây phát ra nội dung tương ứng với SDK thực sự.

## Sử dụng nó
- **OpenAI Agents SDK**Sử dụng cho các sản phẩm đầu tiên của OpenAI.
- **Claude Agent SDK**(Dạy 17) được sử dụng cho các sản phẩm Claude-first.
- **LangGraph**(Dạy học 13) Để sử dụng tình huống bạn muốn rõ ràng và có thể sống lâu dài.
- **Custom**用于你需要精确控制 (khả năng kiểm soát giọng nói, đa nhà cung cấp, triển khai liên bang)

## 交付 nó
`outputs/skill-agents-sdk-scaffold.md`Đàn giáo một ứng dụng SDK của Agents, chứa các bộ phận phân loại, hỗ trợ, cửa hàng phòng thủ đầu vào, đầu ra, cửa hàng phiên và bộ xử lý theo dõi.

## 练习
1. 添加 handoff hop counter: vượt quá N 次 chuyển nhượng 后拒绝;;
2. sẽ`nest_handoff_history`实现为一个选项: 在转移 前将前条消息崩 成一个总结──
3. 编写 một màn hình bảo vệ sản xuất chặn.
4. sẽ`add_trace_processor` kết nối với máy ghi JSON. Nó phát ra hình dạng gì cho mỗi khoảng thời gian?
5. 阅读 SDK doc──将你的sdlib玩具端口到`openai-agents-python` Bạn có những nơi xây dựng sai rồi?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent | "LLM + instructions" | SDK 中的 Agent type；拥有 tools 和 handoffs |
| Handoff | "Transfer" | 模型调用以 delegate 给另一个 agent 的 tool |
| Guardrail | "Policy check" | 对 input / output / tool invocation 的 validation |
| Tripwire | "Guardrail trip" | guardrail 拒绝时抛出的 exception |
| Session | "History store" | runs 之间持久化的 conversation memory |
| Tracing | "Spans" | 覆盖 LLM + tool + handoff + guardrail 的内置 observability |
| Blocking guardrail | "Sequential check" | Guardrail 先运行；trip 时不浪费 Token |
| Parallel guardrail | "Concurrent check" | Guardrail 同时运行；latency 更低，trip 时浪费 Token |

## 延伸阅读
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) nguyên thủy, thủ công, thám hiểm, theo dõi
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) Claude 风格的 đối tác
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 何時真正应该使用手柄
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) Các đại lý SDK trải dài 映射到的标准
