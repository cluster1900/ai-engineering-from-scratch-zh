# OpenTelemetry GenAI  端到端 theo dõi Công cụ gọi

> Một đại lý đã sử dụng năm công cụ, ba máy chủ MCP và hai đại lý phụ. Bạn cần một thông qua tất cả các chuỗi.

**Type:** Build
**Languages:** Python (stdlib, OTel span emitter)
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 08 (MCP client)
**Time:** ~75 minutes

## Học mục tiêu
- Nói ra LLM span và tool-execution span cần thiết các thuộc tính OTel GenAI
- 构建覆盖代理循环、LLM call、tool call 和 MCP client dispatch của sự phân cấp dấu vết。
- quyết định phải thu thập những nội dung nào (opt-in) và cố tình chỉnh sửa những nội dung nào.
- Trong trường hợp không viết lại mã công cụ, sẽ trải dài 发送到本地收藏家 ((Jaeger、Langfuse) ]]

## 问题
Một trường hợp lỗi trong tháng 2 năm 2026: User Report My agent 有时需要30秒才响应;其他时候只需3秒──没有痕迹──Log 显示 LLM call,但没有显示工具发送、MCP server round-trip,也没有显示子代理──你只能猜──最后你发现:某MCP server 偶尔会在冷启动时卡住──

Không có việc theo dõi, bạn không thể định vị vấn đề này.

Các quy ước này được tổ chức các quy ước ngữ nghĩa của OpenTelemetry trong năm 2025-2026 定型── chúng đã xác định tên thuộc tính ổn định, do đó Datadog、Langfuse、Phoenix、OpenLLMetry 和 AgentOps đều có thể giải quyết cùng một khoảng thời gian── chỉ cần thiết bị một lần;即可发送到任意后端──

## 概念
### Tỷ lệ bậc của Span

```
agent.invoke_agent  (top, INTERNAL span)
 ├── llm.chat       (CLIENT span)
 ├── tool.execute   (INTERNAL)
 │    └── mcp.call  (CLIENT span)
 ├── llm.chat       (CLIENT span)
 └── subagent.invoke (INTERNAL)
```

整个流程嵌套在同一个追踪 id 下。Span ids 连接父母-孩子关系──

### Các thuộc tính cần thiết

Theo 2025-2026 semconv:

- `gen_ai.operation.name` `"chat"``"text_completion"``"embeddings"``"execute_tool"``"invoke_agent"`
- `gen_ai.provider.name` `"openai"``"anthropic"``"google"``"azure_openai"`
- `gen_ai.request.model` Xin lỗi của chuỗi mô hình(ví dụ `"gpt-4o-2024-08-06"`(■)
- `gen_ai.response.model` 实际提供服务的模型──
- `gen_ai.usage.input_tokens`- `gen_ai.usage.output_tokens`
- `gen_ai.response.id` Sử dụng ID phản ứng nhà cung cấp của关联

 Đối với các bước công cụ:

- `gen_ai.tool.name` định danh công cụ。
- `gen_ai.tool.call.id` 具体的电话 id──
- `gen_ai.tool.description` mô tả công cụ (可选)

Đối với các đại lý:

- `gen_ai.agent.name`- `gen_ai.agent.id`- `gen_ai.agent.description`

### Loại Span

- `SpanKind.CLIENT`Sử dụng để vượt qua biên giới quy trình của调用 (LLM provider, MCP server)
- `SpanKind.INTERNAL`Sử dụng cho các bước vòng của chính mình và thực hiện công cụ.

### Tải nội dung chọn nhượng

默认情况下, span 携带 metrics và timing, thay vì các lời nhắc hoặc hoàn thành.`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`Và các nội dung cụ thể-tức bao gồm các nội dung trong sản phẩm.

### Các sự kiện trên các span

Các sự kiện cấp token có thể được xem là sự kiện trải dài 添加:

- `gen_ai.content.prompt` thông điệp nhập nhập。
- `gen_ai.content.completion` thông điệp xuất khẩu。
- `gen_ai.content.tool_call` 记录下来的工具调

Các sự kiện trong một khoảng thời gian trong thời gian, dễ dàng để lặp lại chi tiết.

### Các nhà xuất khẩu

Các khoảng thời gian của OTel có thể được dẫn đến:

- **Jaeger / Tempo.**OSS, tại chỗ.
- **Langfuse.**面向 LLM observability;可视化 token sử dụng
- **Arize Phoenix.**Evals + tracing 结合──
- **Datadog.**商业产品; 原生解析 `gen_ai.*`thuộc tính.
- **Honeycomb.**Chuẩn cho cột;便于查询。

Chúng đều sử dụng OTLP, đó là định dạng dây.

### Sự lan truyền trên MCP

Khi khách hàng MCP 调用 máy chủ 时,把 W3C traceparent header 注入请求。Streamable HTTP 支持标准头──Stdio 不原生携带 HTTP头;该规范的2026路线图 讨论在 JSON-RPC调用上添加 `_meta.traceparent`字段。

Trước khi nó được phát hành: thủ công trong mỗi yêu cầu của `_meta`中包含 traceparent──Server 记录 trace id──

### Métrics

Ngoài khoảng thời gian, GenAI Semconv cũng xác định các métrics:

- `gen_ai.client.token.usage` histogram。
- `gen_ai.client.operation.duration` histogram。
- `gen_ai.tool.execution.duration` histogram。

Sẽ được sử dụng không cần chi tiết liên lạc của bảng điều khiển.

### Lớp AgentOps

AgentOps (tổ thành năm 2024) chuyên về khả năng quan sát của GenAI. Nó bao gồm các khung phổ biến.


```figure
t3-span-waterfall
```

## Sử dụng nó
`code/main.py`会把 OTel-shaped spans 发送到stdout (采用类似 OTLP-JSON 的格式), được sử dụng cho một调用 LLM、dispatch 两个工具,并进行一次MCP round-trip的代理──没有真实出口者本课聚焦于跨度形和属性集合──把输出粘贴到OTLP-兼容的观众中,或直接阅读它──

需要关注的点:

- 所有 ải 共享同一个 痕迹 id──
- Liên kết cha mẹ-con  thông qua `parentSpanId`编码.
- cần thiết `gen_ai.*`thuộc tính đã được lấp đầy.
- Khám phá nội dung 默认关闭; một trong những trường hợp sẽ thông qua các 打开它.

## 交付 nó
本课会产出 `outputs/skill-otel-genai-instrumentation.md` Đặt một cơ sở mã đại lý, kỹ năng này sẽ tạo ra một kế hoạch công cụ:

## 练习
1. 运行 `code/main.py`◊ Statistical spans số lượng,并识别哪些是客户,哪些是内部──

2. 打开 nội dung ghi hình nvvar), xác nhận xuất hiện `gen_ai.content.prompt`和 `gen_ai.content.completion`Sự kiện: chú ý đến ảnh hưởng của PII:

3. 添加 công cụ-phục hành métrics `gen_ai.tool.execution.duration`,并按每次调用将其作为 histogram样本发送──

4. Để phát hiện từ đại lý mẹ  truyền đến yêu cầu của MCP `_meta.traceparent`字段──验证 MCP server sẽ thấy identical ID.

5. 阅读 OTel GenAI semconv spec。 tìm ra một semconv trong danh sách nhưng本课代码没有发送的属性──添加它──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| OTel | "OpenTelemetry" | 用于 traces、metrics、logs 的开放标准 |
| GenAI semconv | "GenAI semantic conventions" | LLM / tool / agent spans 的稳定 attribute names |
| `gen_ai.*` | "The attribute namespace" | 所有 GenAI attributes 都共享此前缀 |
| Span | "Timed operation" | 一个具有 start、end 和 attributes 的 work unit |
| Trace | "Cross-span ancestry" | 共享同一个 trace id 的 spans 树 |
| SpanKind | "CLIENT / SERVER / INTERNAL" | 关于 span direction 的提示 |
| OTLP | "OpenTelemetry Line Protocol" | exporters 使用的 wire format |
| Opt-in content | "Prompt / completion capture" | 默认关闭；通过 env var 启用 |
| traceparent | "W3C header" | 跨 services 传播 trace context |
| Exporter | "Backend-specific shipper" | 将 spans 发送到 Jaeger / Datadog / 等的组件 |

## 延伸阅读
- [OpenTelemetry — GenAI semconv](https://opentelemetry.io/docs/specs/semconv/gen-ai/) GenAI trải dài, métrics và các sự kiện quyền lực các hội nghị
- [OpenTelemetry — GenAI spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/) LLM và các công cụ thực hiện thời gian thuộc tính 列表
- [OpenTelemetry — GenAI agent spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-agent-spans/) cấp đại lý `invoke_agent`span
- [open-telemetry/semantic-conventions — GenAI spans](https://github.com/open-telemetry/semantic-conventions/blob/main/docs/gen-ai/gen-ai-spans.md) GitHub 托管的权威来源
- [Datadog — LLM OTel semantic convention](https://www.datadoghq.com/blog/llm-otel-semantic-convention/) Tích hợp sản xuất 讲解
