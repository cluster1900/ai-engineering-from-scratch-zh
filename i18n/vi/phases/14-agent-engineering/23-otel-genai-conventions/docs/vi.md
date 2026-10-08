# OpenTelemetry GenAI 语义约定

> OpenTelemetry's GenAI SIG(2024 年 4 月启动) đã xác định các quy tắc của điện toán đại lý.

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 13 (LangGraph), Phase 14 · 24 (Observability Platforms)
**Time:** ~60 分钟

## Học mục tiêu
- Nói ra các loại GenAI: mô hình/thành khách, đại lý, công cụ.
- 区分 `invoke_agent`Khách hàng và các phạm vi nội bộ, cũng như các trường hợp thích hợp của chúng.
- 列出顶层 GenAI thuộc tính: tên nhà cung cấp, mô hình yêu cầu, ID nguồn dữ liệu.
- 解释 hợp đồng thu thập nội dung:opt-in`OTEL_SEMCONV_STABILITY_OPT_IN`、đề nghị tham chiếu bên ngoài ❖

## 问题
Mỗi nhà cung cấp đều phát triển tên tuổi phạm vi riêng của mình. Các nhóm hoạt động cuối cùng phải xây dựng bảng điều khiển riêng cho mỗi khung.

## 概念
### Các loại span

1. **Model / client spans.**覆盖原始 LLM gọi. Được phát hành bởi nhà cung cấp SDKs (Anthropic、OpenAI、Bedrock) và các bộ chuyển đổi mô hình khung.
2. **Agent spans.** `create_agent`(độc lập 时) và `invoke_agent`(运行代理 时)
3. **Tool spans.**Mỗi lần gọi công cụ một; thông qua mối quan hệ cha mẹ-con cái  kết nối đến thời gian đại lý

### Tên gọi của đại lý span

- Tên tiếng Tây Ban Nha:`invoke_agent {gen_ai.agent.name}`; sự thất bại vì `invoke_agent`
- Loại Span:
  - **CLIENT** Sử dụng dịch vụ đại lý từ xa (OpenAI Assistants API, Bedrock Agents)
  - **INTERNAL** Sử dụng trong các khung đại lý trong quá trình ((LangChain、CrewAI、Local ReAct) 

### Các thuộc tính chính

- `gen_ai.provider.name` `anthropic``openai``aws.bedrock``google.vertex`
- `gen_ai.request.model` ID mô hình
- `gen_ai.response.model` 解析后的模型(可能因路由而不同于请求)。
- `gen_ai.agent.name` Định danh đại lý
- `gen_ai.operation.name` `chat``completion``invoke_agent``tool_call`
- `gen_ai.data_source.id` Sử dụng RAG: Tìm hiểu được cơ quan hay cửa hàng nào

Anthropic、Azure AI Inference、AWS Bedrock、OpenAI đều có các quy ước kỹ thuật cụ thể.

### Tải nội dung

默认规则:instrumentations 默认 SHOULD NOT 捕获输入/输出──捕获 通过以下方式选择:

- `gen_ai.system_instructions`
- `gen_ai.input.messages`
- `gen_ai.output.messages`

推的生产模式:将内容存储在外部(S3、你的日志存储),在跨度上记录引用(pointer ID,而不是散文) ・・・这是27 Bài học 防接入可观的方法──

### Thường độ ổn định

截至 2026 年 3 月, hầu hết các công ước vẫn là thử nghiệm.

```
OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental
```

Datadog v1.37+ 会将 GenAI thuộc tính 原生映射到其 LLM Observability schema。其他后台(Grafana、Honeycomb、Jaeger) hỗ trợ thuộc tính thô。

### Mô hình này dễ dàng xuất hiện ở nơi

- **在 spans 中捕获完整 prompts。**PII, bí mật, dữ liệu khách hàng sẽ vào các hoạt động có thể đọc được.
- **没有 `gen_ai.provider.name`。**thuộc tính 缺失时, nhiều nhà cung cấp bảng điều khiển 会失效。
- **没有 parent links 的 spans。**会产生孤立的工具范围──始终传播背景──
- **没有设置 stability opt-in。**Khi nâng cấp, các thuộc tính của anh có thể được đặt tên lại.


```figure
ae-genai-span-tree
```

##  xây dựng nó
`code/main.py`实现 một bộ phát phát phát dài stdlib phù hợp với các quy ước GenAI:

- 带 GenAI tính năng schema của `Span`
- 带 `start_span`、đối cảnh tổ của `Tracer`
- Một nhân viên kịch bản chạy, sẽ phát hành:`create_agent``invoke_agent`(INTERNAL) ‧Per tool spans‧ được sử dụng cho các cuộc gọi LLM `chat`bao gồm:
- Một chế độ chụp nội dung, sẽ đưa các yêu cầu được lưu trữ bên ngoài, và kéo dài trên ghi nhận ID.

运行 nó:

```
python3 code/main.py
```

输出: một cây chứa tất cả các thuộc tính cần thiết của GenAI, cũng như một "bộ cửa hàng bên ngoài" của tham chiếu nội dung chọn vào.

## Sử dụng nó
- **Datadog LLM Observability**(v1.37+) nguyên sinh映射 thuộc tính
- **Langfuse / Phoenix / Opik**(Dạy 24)  tự động dụng cụ 生态。
- **Jaeger / Honeycomb / Grafana Tempo** dấu vết OTel nguyên liệu; từ thuộc tính GenAI  cấu trúc bảng điều khiển。
- **Self-hosted** 使用 bộ xử lý GenAI 运行 OTel Collector。

## 交付 nó
`outputs/skill-otel-genai.md`Để mở rộng OTel GenAI 接入现有代理,并带有内容捕获默认和外部参考存储

## 练习
1. Sử dụng `invoke_agent`(INTERNAL) + per tool spans instrument Bạn của Bài học 01 ReAct loop──发送到一个Jaeger instance──
2. Trong chế độ "chỉ tham chiếu" 中添加内容捕获:prompts 写入 SQLite,span attribut 只携带行 ID。
3. 阅读 `gen_ai.data_source.id`Chuyện này sẽ được kết nối với bài học 09 của bạn.
4. 设置 `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`,并验证 các thuộc tính của bạn sẽ không được tập hợp đặt tên lại.
5. Construct a dashboard: chỉ từ các thuộc tính GenAI xem "What tool errors with what models related" (Những lỗi trong công cụ nào có liên quan đến mô hình nào)

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| GenAI SIG | "OpenTelemetry GenAI group" | 定义 schema 的 OTel working group |
| invoke_agent | "Agent span" | 表示一次 agent run 的 span name |
| CLIENT span | "Remote call" | 调用 remote agent service 的 span |
| INTERNAL span | "In-process" | in-process agent run 的 span |
| gen_ai.provider.name | "Provider" | anthropic / openai / aws.bedrock / google.vertex |
| gen_ai.data_source.id | "RAG source" | retrieval 命中了哪个 corpus/store |
| Content capture | "Prompt logging" | 对 messages 的 opt-in capture；prod 中存储在外部 |
| Stability opt-in | "Preview mode" | 用于固定 experimental conventions 的 env var |

## 延伸阅读
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) 规范
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) 默认提供 GenAI trải dài
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) 内置 OTel trải dài
- [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) W3C trace context 传播
