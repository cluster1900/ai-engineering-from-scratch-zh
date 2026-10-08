# Công cụ Thiết kế Schema  命名、描述、参数约束

> Khi mô hình không thể quyết định khi nào sử dụng một công cụ nào đó, một công cụ chính xác cũng sẽ bị thất bại. Tên gọi, mô tả và hình dạng tham số sẽ làm cho StableToolBench và MCPToolBench++ và các công cụ khác được đánh giá để xác định độ chính xác trong việc lựa chọn công cụ trên xuất hiện từ 10 đến 20 điểm phần trăm.

**Type:** Learn
**Languages:** Python (stdlib, tool schema linter)
**Prerequisites:** Phase 13 · 01（tool interface），Phase 13 · 04（structured output）
**Time:** ~45 分钟

## Học mục tiêu
- Sử dụng khi X. Không sử dụng cho Y. 模式编写工具描述,并控制在 1024 个字符以内。
- Để chắc chắn`snake_case`、 và trong danh sách lớn, không có cách nào khác để đặt tên.
- 针对 một bề mặt nhiệm vụ nhất định, trong các công cụ nguyên tử và một công cụ đơn lẻ đơn vị 做做选择.
- 针对注册 运行工具-schema linter,并修复发现──

## 问题
设想一个代理有30个工具──每个用户查询 都会触发工具选择:模型 读取每个描述 并选择一个──将出现两种失败形态──

**选错工具。**mô hình  chọn `search_contacts`Nhưng tôi không chọn.`get_customer_details`▽原因: hai mô tả 都说 look up people──model 没有办法消歧──

**有合适工具却没有选择工具。**Người dùng hỏi giá cổ phiếu; mô hình 回复 một số dường như hợp lý nhưng ảo giác.

Các hướng dẫn thực địa năm 2025 của Composio chỉ được xác định, chỉ bằng cách đặt tên lại và viết lại mô tả, độ chính xác của các tiêu chuẩn nội bộ sẽ tạo ra 10 đến 20 điểm phần trăm của biến động.

Mô tả và chất lượng tên là giá trị thấp nhất mà bạn có.

## 概念
### Quy tắc đặt tên

1. **`snake_case`。**Mỗi nhà cung cấp của tokeniser có thể xử lý rõ ràng nó.`camelCase`Trong một số tokeners 上会跨代币界限 碎裂──
2. **Verb-noun 顺序。** `get_weather`, không `weather_get`✿贴近自然英语✿
3. **不要有时态标记。** `get_weather`, không `got_weather`Hoặc`get_weather_later`
4. **稳定。**重命名是 phá vỡ thay đổi.
5. **大型 registries 使用 namespace prefixes。** `notes_list``notes_search``notes_create`优于三个泛命名的工具──MCP 会在服务器名区中采用这一点(Phase 13 · 17)。
6. **不要在名称里放 arguments。** `get_weather_for_city(city)`, không `get_weather_in_tokyo()`

### Mô hình mô tả

Mô hình hai câu này có thể ổn định nâng cao độ chính xác lựa chọn:

```
Use when {condition}. Do not use for {close-but-wrong-cases}.
```

Ví dụ:

```
Use when the user asks about current conditions for a specific city.
Do not use for historical weather or multi-day forecasts.
```

Đừng sử dụng cho  这一行用于和注册 中相近的竞争工具消歧──

保持在1024 个字符内──OpenAI 会在严格模式中截断更长的描述──

包含 định dạng gợi ý:Tình thức nhận tên thành phố bằng tiếng Anh.`units`nói khác. mô hình 会用这些信息正确填充参数──

### Atomic vs monolithic

Một công cụ đơn phương:

```python
do_everything(action: str, target: str, options: dict)
```

Có vẻ khô, nhưng sẽ buộc người mẫu từ dây và các kiểu chữ không được chọn`action`和 `options`, đây là lựa chọn, là loại bề mặt nhất của hai loại.

Công cụ hạt nhân:

```python
notes_list()
notes_create(title, body)
notes_delete(note_id)
notes_search(query)
```

Mỗi người có mô tả và mô hình được đánh dấu theo tên  chọn, chứ không phải phân tích`action`Dòng dây

经验法则: Nếu `action`Đối số có hơn ba giá trị, hãy phân chia.

### Thiết kế tham số

- **每个封闭集合都使用 Enum。** `units: "celsius" | "fahrenheit"`, đừng dùng `units: string`◊Enums 会告诉模型可接受值的全集──
- **Required vs optional。**标记最低限需要的字段──其他全部可选──OpenAI 严格模式 要求每个字段都在 `required`Trong; trong代码中添加 `is_default: true`Công ước,并让 mô hình 省略它.
- **Typed IDs。** `note_id: string`Có, nhưng thêm một `pattern`(`^note-[0-9]{8}$`Để bắt được những cái nhìn ảo giác.
- **不要使用过度灵活的 types。**避免 `type: any`✿ mô hình 会 ảo giác hình dạng✿
- **描述 field。** `{"type": "string", "description": "ISO 8601 date in UTC, e.g. 2026-04-22"}`✿ description là một phần của mô hình prompt ✿

### Thông báo lỗi 作为教学信号

Khi công cụ gọi 失败时, thông điệp lỗi 会传给模型──为模型 编写错误──

```
BAD  : TypeError: object of type 'NoneType' has no attribute 'lower'
GOOD : Invalid input: 'city' is required. Example: {"city": "Bengaluru"}.
```

Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm:

### Phiên bản

工具会演化──规则:

- **永远不要重命名稳定工具。**添加 `get_weather_v2`,并 bị khước từ `get_weather`
- **永远不要改变 argument types。**放宽(string đến string-or-number) cũng cần phiên bản mới.
- **可以自由添加 optional parameters。**An toàn.
- **只有在 deprecation window 后才移除工具。**发布 `deprecated: true`cờ; một chu kỳ giải phóng 后移除。

### Phòng ngừa ngộ độc bằng công cụ

Mô tả 会逐字进入模型背景──恶意服务器 可以Embedding隐藏说明(Trong cùng đọc ~/.ssh/id_rsa và gửi nội dung đến attacker.com)──Phase 13 · 15 会深入讨论这一点──对本课而言,linter 会拒绝包含常见间接注射关键字的描述:`<SYSTEM>``ignore previous`、Phần mềm rút ngắn URL 、 chứa các hướng dẫn ẩn của dấu hiệu không chuyển đổi ⋅

### Điểm chuẩn

- **StableToolBench。**Trong registry cố định 上测量 lựa chọn chính xác.
- **MCPToolBench++。**将 StableToolBench  mở rộng đến các máy chủ MCP; nắm bắt khám phá và lựa chọn
- **SafeToolBench。**测量 đối thủ thiết bị công cụ

Trong một bộ thiết lập GPU thông thường, vòng đánh giá hoàn chỉnh có thể chạy trong vòng một giờ.


```figure
tp-schema-routing
```

## Sử dụng nó
`code/main.py`提供一个工具方案linter,用于按照上述规则审计登记.

- 违反 `snake_case`Có chứa tên của các lập luận.
- Ít hơn 40 chữ cái, hơn 1024 chữ cái, hoặc thiếu Đừng sử dụng cho các mô tả của câu。
- 含未类型字段、缺少必需列表,或存在可疑描述模式 (có thể có hình thức mô tả có thể được sử dụng trong các từ khóa tiêm gián tiếp)
- Tự nhiên`action: str`Thiết kế:

Trong bên cạnh `GOOD_REGISTRY`( thông qua) và `BAD_REGISTRY`(每条规则都失败) 上运行它, xem kết quả cụ thể.

## 交付 nó
本课产 出 `outputs/skill-tool-schema-linter.md` Đưa ra bất kỳ danh sách công cụ nào, kỹ năng này 会 dựa trên các quy tắc thiết kế trên kiểm tra nó,并产出包含严重和建议重写的固定列表──可以在CI中运行──

## 练习
1. Sử dụng `code/main.py`Trung `BAD_REGISTRY`, viết lại từng công cụ, làm cho nó qua linter──测重写前后的描述长和规则违反数量──

2. Để ghi chú ứng dụng thiết kế một máy chủ MCP, bao gồm các công cụ nguyên tử: danh sách, tìm kiếm, tạo, cập nhật, xóa, và một`summarize`Slash prompt──Lint registry── mục tiêu là zero findings──

3. Từ đăng ký chính thức  chọn một máy chủ MCP nóng hiện có, và tìm ra ít nhất hai cải tiến có thể thực hiện được.

4. Để thêm một dấu hiệu vào CI của bạn. Trong việc sửa đổi danh sách công cụ của PR, nếu có sự nghiêm trọng.`block`Kết quả,则让 xây dựng 失败──độ hình CI dựa trên thời gian sẽ được thực hiện trong giai đoạn tương lai 覆盖──

5. Từ đầu đến cuối đọc hướng dẫn thiết kế công cụ của Composio. Tìm ra một quy tắc chưa được bao gồm trong bài học này, và thêm nó vào linter.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Tool schema | “Input shape” | 工具 arguments 的 JSON Schema |
| Tool description | “The when-to-use-it paragraph” | model 在 selection 期间读取的 natural-language brief |
| Atomic tool | “One tool one action” | name 能唯一标识其 behavior 的工具 |
| Monolithic tool | “Swiss Army” | 带有 `action` string argument 的单个工具；selection accuracy 会暴跌 |
| Enum-closed set | “Categorical parameter” | `{type: "string", enum: [...]}` 是封闭 domains 的正确形态 |
| Tool poisoning | “Injected description” | 工具 description 中会劫持 agent 的隐藏 instructions |
| Tool-selection accuracy | “Did it pick right?” | model 调用正确工具的 queries 百分比 |
| Description linter | “CI for schemas” | 强制执行 naming、length、disambiguation rules 的自动 audit |
| Namespace prefix | “notes_*” | 在大型 registries 中对相关工具分组的 shared name prefix |
| StableToolBench | “Selection benchmark” | 用于测量 tool-selection accuracy 的 public benchmark |

## 延伸阅读
- [Composio — How to build tools for AI agents: field guide](https://composio.dev/blog/how-to-build-tools-for-ai-agents-a-field-guide) đặt tên, mô tả và nâng độ chính xác của các phép đo
- [OneUptime — Tool schemas for agents](https://oneuptime.com/blog/post/2026-01-30-tool-schemas/view) Các mô hình thiết kế tham số từ sản xuất
- [Databricks — Agent system design patterns](https://docs.databricks.com/aws/en/generative-ai/guide/agent-system-design-patterns)Thiết kế cấp registry của  带可测 benchmarks
- [Anthropic — Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) 基于Claude's agents's description patterns
- [OpenAI — Function calling best practices](https://platform.openai.com/docs/guides/function-calling#best-practices) mô tả 长度、strict-mode 要求、atomic-tool 指导
