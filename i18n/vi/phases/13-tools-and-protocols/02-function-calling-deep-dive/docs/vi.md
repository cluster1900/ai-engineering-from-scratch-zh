# Chức năng gọi 深入解析  OpenAI, Anthropic, Gemini

> Ba nhà cung cấp biên giới này vào năm 2024 đã nhận được cùng một vòng gọi công cụ, sau đó chia sẻ thông tin trên tất cả các địa điểm khác.`tools`和 `tool_calls`❖ Sử dụng nhân tạo `tool_use`和 `tool_result`khối──Gemini 使用 `functionDeclarations`Và liên quan ID độc đáo. Bài học này sẽ có sự khác biệt, để trong một nhà cung cấp trên giao dịch mã trong chuyển giao đến một nhà cung cấp khác sẽ không bị hỏng.

**Type:** Build
**Languages:** Python (stdlib, schema translators)
**Prerequisites:** Phase 13 · 01（the tool interface）
**Time:** ~75 分钟

## Học mục tiêu
- Nói ra OpenAI、Anthropic 和 Gemini hàm gọi tải trọng hữu ích 之间的三类形状差异
- Để phân tích một tool declaration 翻译到三个 provider format,并预测 nghiêm ngặt chế độ hạn chế 会在哪里不同──
- Trong mỗi nhà cung cấp 中使用 `tool_choice`Để bắt buộc, cấm hoặc tự động chọn các cuộc gọi công cụ.
- 了解每个供应商的硬界限 (tương tự như số lượng công cụ, độ sâu của sơ đồ, chiều dài của lập luận) cũng như phạm vi phạm hạn của các chữ ký lỗi của mỗi nhà cung cấp.

## 问题
hình thức yêu cầu gọi chức năng bởi nhà cung cấp và khác.

**OpenAI Chat Completions / Responses API.**Anh truyền vào`tools: [{type: "function", function: {name, description, parameters, strict}}]` Phản ứng của mô hình 包含 `choices[0].message.tool_calls: [{id, type: "function", function: {name, arguments}}]`, trong số đó `arguments`是你必须解析的 JSON string──Strict mode(`strict: true`) Thông qua mã hóa hạn chế 强制 tuân thủ quy trình.

**Anthropic Messages API.**Anh truyền vào`tools: [{name, description, input_schema}]`◊ phản ứng 以 `content: [{type: "text"}, {type: "tool_use", id, name, input}]`Trở lại.`input`已被解析 ((是对象,不是字符串) 〕你再回复一个新的 `user`Thông điệp, trong đó có`{type: "tool_result", tool_use_id, content}`khối

**Google Gemini API.**Anh truyền vào`tools: [{functionDeclarations: [{name, description, parameters}]}]`(đúng trong `functionDeclarations`下) ⋅ phản ứng 以 `candidates[0].content.parts: [{functionCall: {name, args, id}}]`Đến, trong số đó `id`Trong phiên bản trên, Gemini 3 là một phiên bản độc đáo, được sử dụng để tương quan liên lạc song song.`{functionResponse: {name, id, response}}`

Cùng một vòng. Tên trường khác nhau, tổ khác nhau, quy ước dây đối với vật thể khác nhau, cơ chế tương quan khác nhau. Một nhóm người làm việc tại OpenAI viết về nhân viên thời tiết, chỉ để làm ống nước, chuyển sang Anthropic, mất hai ngày, tái chuyển sang Gemini, còn một ngày nữa.

本课构建一个翻译,将三种格式统一成一个法典工具宣言,并边做路由――Phase 13 · 17 会把同一模式泛化成 LLM gateway――

## 概念
### Cơ cấu chung

Mỗi nhà cung cấp cần 5 thứ:

1. **Tool list.**Tên, mô tả và mô hình đầu vào của mỗi công cụ.
2. **Tool choice.**强制 sử dụng cụ thể 禁止工具, hoặc cho mô hình quyết định
3. **Call emission.**命名 công cụ và các lập luận của kết quả cấu trúc.
4. **Call id.**Sẽ trả lời 关联到正确的电话 (phần song 时 rất quan trọng)
5. **Result injection.**Một tin nhắn hoặc chặn, sẽ kết quả 绑定回调.

### 个个 field 比较 hình dạng khác nhau

| Aspect | OpenAI | Anthropic | Gemini |
|--------|--------|-----------|--------|
| Declaration envelope | `{type: "function", function: {...}}` | `{name, description, input_schema}` | `{functionDeclarations: [{...}]}` |
| Schema field | `parameters` | `input_schema` | `parameters` |
| Response container | assistant message 上的 `tool_calls[]` | type 为 `tool_use` 的 `content[]` | type 为 `functionCall` 的 `parts[]` |
| Arguments type | stringified JSON | parsed object | parsed object |
| Id format | `call_...`（OpenAI 生成） | `toolu_...`（Anthropic） | UUID（Gemini 3+） |
| Result block | role `tool`, `tool_call_id` | 带 `tool_result`, `tool_use_id` 的 `user` | 带匹配 `id` 的 `functionResponse` |
| Force-a-tool | `tool_choice: {type: "function", function: {name}}` | `tool_choice: {type: "tool", name}` | `tool_config: {function_calling_config: {mode: "ANY"}}` |
| Forbid tools | `tool_choice: "none"` | `tool_choice: {type: "none"}` | `mode: "NONE"` |
| Strict schema | `strict: true` | schema-is-schema（始终 enforce） | request level 的 `responseSchema` |

### Bạn thực sự sẽ gặp phải những hạn chế

- **OpenAI.**Mỗi yêu cầu tối đa 128 个工具――Schema depth 5――Argument string <= 8192 bytes――Strict mode 要求没有 `$ref`, không có sự chồng chéo `oneOf`- Không.`anyOf`- Không.`allOf`, mỗi tài sản đều nằm trong thành phố`required`Ở giữa.
- **Anthropic.**Mỗi yêu cầu tối đa 64 công cụ Ưu điểm độ sâu  thực tế không đặt giới hạn, nhưng giới hạn thực tế là 10 Ưu điểm không có cờ chế độ nghiêm ngặt; mô hình là hợp đồng, mô hình thường sẽ tuân thủ Ưu điểm:
- **Gemini.**Mỗi yêu cầu tối đa 64 个 hàm。Các loại Schema là OpenAPI 3.0 tiểu tập hợp(với JSON Schema 2020-12 略有差异)。自 Gemini 3 起, liên lạc song song song 使用 unique-id。

### `tool_choice`hành vi

Có 3 kiểu mọi người ủng hộ, chỉ có tên khác nhau.

- **Auto.**Mô hình  chọn công cụ hoặc văn bản.
- **Required / Any.**Mô hình  phải ít nhất điều chỉnh một công cụ.
- **None.**Mô hình không được điều chỉnh bằng công cụ.

Ngoài ra, mỗi nhà cung cấp có một mô hình độc đáo:

- **OpenAI.**按名 强制使用特定工具──
- **Anthropic.**按名 强制使用特定工具;`disable_parallel_tool_use`cờ 区分 đơn vs nhiều。
- **Gemini.** `mode: "VALIDATED"`会让每个反应通过方案验证器, bất kể mục đích mô hình 如何.

### Các cuộc gọi song song

OpenAI của `parallel_tool_calls: true`(默认) sẽ gửi nhiều cuộc gọi trong một thư trợ lý. Bạn chạy tất cả các cuộc gọi, sau đó sử dụng hàng loạt thông điệp vai trò công cụ.`tool_call_id`đối ứng một mục: Anthropic 过去是单调;`disable_parallel_tool_use: false`(截至Claude 3.5 的默认值) bật nhiều gếṃn 2 允许通话 song song, nhưng không cung cấp ID ổn định; gếṃn 3 增加 UUID, do đó các phản ứng ngoài trật tự có thể có liên quan 净地.

### Chuyển phát

三者都支持 dòng chảy công cụ gọi.

- **OpenAI.** `tool_calls[i].function.arguments`Các phần delta sẽ tăng lên.`finish_reason: "tool_calls"`
- **Anthropic.**Các sự kiện bắt đầu khối / block-delta / block-stop.`input_json_delta`Các phần 携带 các lập luận một phần.
- **Gemini.** `streamFunctionCallArguments`(Temini 3 新增) 发出带 `functionCallId`Các phần của các phần, do đó nhiều cuộc gọi song song có thể giao tiếp.

Giai đoạn 13 · 03 会深入讲 song song + streaming reassembly。本课聚焦宣言 和 đơn gọi hình dạng。

### Hầm lẫn và sửa chữa

Sự biểu hiện của lỗi lập luận không hợp lệ cũng khác nhau.

- **OpenAI (non-strict).**Mô hình  trả lại `arguments: "{bad json}"`, Parse JSON của bạn 失败, bạn nhập thông điệp lỗi và gọi lại.
- **OpenAI (strict).**Truy cập trong thời gian giải mã; không hợp lệ JSON không thể xuất hiện, nhưng có thể xuất hiện `refusal`
- **Anthropic.** `input`Có thể chứa các trường bất ngờ; sơ đồ là tư vấn.
- **Gemini.**OpenAPI 3.0 quirk:object fields 上的 `enum`Sẽ bị bỏ qua; bạn cần tự xác nhận mình.

### Mô hình dịch giả

Bạn代码中的 công cụ công bố có vẻ như vậy:

```python
Tool(
    name="get_weather",
    description="Use when ...",
    input_schema={"type": "object", "properties": {...}, "required": [...]},
    strict=True,
)
```

三个小函数将它翻译成三种提供形状──`code/main.py`Trung Harness chính là làm như vậy, sau đó đưa một công cụ giả gọi qua mỗi nhà cung cấp hình thức phản hồi làm round-trip. Không cần mạng, bài học dạy là hình dạng, không phải HTTP.

Các nhóm sản xuất sẽ đưa người dịch này vào.`AbstractToolset`(AI Pydantic)`UniversalToolNode`(LangGraph) hoặc `BaseTool`(LlamaIndex) ――Phase 13 · 17 会交付一个门户,在三者任意一个前面暴露OpenAI-形状API──


```figure
function-call-args
```

## Sử dụng nó
`code/main.py`定义一个法典 `Tool`Dataclass, cũng như ba trình dịch, được sử dụng để phát hành OpenAI、Anthropic 和 Gemini tuyên bố JSON── sau đó nó sẽ giải quyết câu trả lời của nhà cung cấp bằng tay của mỗi hình dạng 解析为同一个定式呼叫对象,展示语义在表层之下是相同的──运行它,并并排差三种声明──

需要观察的点:

- Ba khối tuyên bố chỉ trong phong bì và tên trường trên khác nhau.
- 3 khối phản ứng khác nhau trong cuộc gọi vị trí ở cấp trên`tool_calls``content[]`khối`parts[]`nhập) 
- Một `canonical_call()`chức năng Từ tất cả ba hình thức phản ứng 中提取 `{id, name, args}`

## 交付 nó
本课产 出 `outputs/skill-provider-portability-audit.md` Đưa ra một sự tích hợp gọi chức năng đối với một nhà cung cấp, kỹ năng này sẽ tạo ra kiểm toán khả năng di động: nó phụ thuộc vào những giới hạn của nhà cung cấp  những lĩnh vực cần đổi tên, cũng như chuyển sang nhà cung cấp khác  những sự phá vỡ sẽ xảy ra khi

## 练习
1. 运行 `code/main.py`, xác minh ba tuyên bố nhà cung cấp JSON đều được sắp xếp cùng một tầng dưới cùng`Tool`Object── Modify công cụ truyền thống, thêm một parameter enum,并 xác nhận chỉ có phiên dịch viên Gemini 需要处理 OpenAPI quirk──

2. Đối với mỗi nhà cung cấp  thêm một `ListToolsResponse`Parser, từ mô hình trong `list_tools`Hoặc phát hiện gọi 后返回的内容中提取工具列表──OpenAI 原生没有这个项目;记录这个不对称──

3. 实现 `tool_choice`chuyển đổi:将 canonical `ToolChoice(mode="force", tool_name="x")`映射到三种供应商形――然后映射 `mode="any"`和 `mode="none"`◊ kiểm tra bảng điểm khác biệt của bài học

4.  chọn một trong ba nhà cung cấp, đọc hướng dẫn gọi chức năng của nó từ đầu đến cuối. Tìm ra các quy mô sơ đồ của nó trong một trong hai trường không được hỗ trợ. 候选项:OpenAI `strict`、Anthropic `disable_parallel_tool_use`、Tình sinh`function_calling_config.allowed_function_names`

5. 写一个测试向量:一个论点 违反声明的方案的工具调用――将它运行过每个供应商的验证器(Lesson 01 中的 stdlib验证器可以作为代理),并记录触发了哪些错误──记录你在生产中会为了严格使用哪个供应商──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Function calling | "Tool use" | 用于 structured tool-call emission 的 provider-level API |
| Tool declaration | "Tool spec" | Name + description + JSON Schema input payload |
| `tool_choice` | "Force / forbid" | Auto / required / none / specific-name modes |
| Strict mode | "Schema enforcement" | OpenAI flag，用于约束 decoding 以匹配 schema |
| `tool_use` block | "Anthropic's call shape" | 带 id、name、input 的 inline content block |
| `functionCall` part | "Gemini's call shape" | 包含 name、args 和 id 的 `parts[]` entry |
| Arguments-as-string | "Stringified JSON" | OpenAI 将 args 作为 JSON string 返回，而不是 object |
| Parallel tool calls | "Fan-out in one turn" | 一个 assistant message 中的多个 tool calls |
| Refusal | "Model declines" | strict-mode-only 的 refusal block，而不是 call |
| OpenAPI 3.0 subset | "Gemini schema quirk" | Gemini 使用一种类似 JSON-Schema 的 dialect，存在细微差异 |

## 延伸阅读
- [OpenAI — Function calling guide](https://platform.openai.com/docs/guides/function-calling) 包含 nghiêm ngặt chế độ và liên kết song song của tham chiếu kinh điển
- [Anthropic — Tool use overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview) `tool_use`和 `tool_result`block semantics
- [Google — Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling) các cuộc gọi song song 、đặc danh duy nhất và OpenAPI
- [Vertex AI — Function calling reference](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/function-calling) bề mặt doanh nghiệp cấp của Gemini
- [OpenAI — Structured outputs](https://platform.openai.com/docs/guides/structured-outputs) quy trình chế độ nghiêm ngặt 强制执行细节
