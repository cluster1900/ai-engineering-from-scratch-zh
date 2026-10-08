# 结构化输出  JSON Schema, Pydantic, Zod, Tự hạn chế giải mã

>                                                                                                                                                                                                                                                               `responseSchema`、AI của Pythantic`output_type`, và Zod của `.parse`, là cùng một ý tưởng trong 5 hình thức biểu tượng. Bài học này sẽ xây dựng trình xác nhận sơ đồ và hợp đồng chế độ nghiêm ngặt, học viên sẽ sử dụng chúng trong mỗi ống khai thác cấp sản xuất.

**类型：**构建
**语言：**Python(stdlib,JSON Schema 2020-12 子集)
**前置要求：**Giai đoạn 13 · 02(phong thức gọi lặn sâu)
**时间：**约75分钟

## Học mục tiêu

- Sử dụng đúng sự sắp đặt của bạn (enum、min/max、required、pattern) cho mục tiêu khai thác 编写 JSON Schema 2020-12。
- 解释 tại sao chế độ nghiêm ngặt và mã hóa hạn chế  cung cấp đảm bảo khác với  tạo sau tái kiểm tra 。
- 区分三种失败模式: lỗi phân tích, vi phạm quy hoạch, từ chối mô hình.
- 交付一条带 sửa chữa và xử lý từ chối loại hình ống khai thác

## 问题

Một đại lý mua sắm đơn đặt hàng thư cần chuyển văn bản tự do thành`{customer, line_items, total_usd}`Có 3 cách làm.

**方法一：提示模型输出 JSON。**                                                                                                                                                                                                                                                              

**方法二：生成后验证。**tự do tạo, phân tích, xác minh theo quy trình, thất bại sau thử lại.

**方法三：Constrained Decoding。**提供商在解码时强制执行方案──无效 代币 会从采样分布中被掩盖掉──输出保证可解析,并且保证通过验证──失败会收到一种模式:拒绝(模型判断输入不符合方案)──

Đến năm 2026, mỗi nhà cung cấp hàng đầu sẽ cung cấp một số hình thức phương pháp.

- **OpenAI。** `response_format: {type: "json_schema", strict: true}`, Nếu mô hình từ chối thì phản ứng trong đó bao gồm`refusal`
- **Anthropic。**Đối với`tool_use`输入执行 thực thi kế hoạch;`stop_reason: "refusal"`Không có, nhưng không có công cụ gọi của `end_turn`Đó là tín hiệu.
- **Gemini。**Xin cấp độ `responseSchema`;2026 năm Gemini 针对特定类型提供 Token 级语法限制──
- **Pydantic AI。** `output_type=InvoiceModel`会发出类型为`InvoiceModel`       `RunResult`
- **Zod (TypeScript)。**运行时 parser, sử dụng Zod scheme 验证提供商输出; có thể tương tác với OpenAI `beta.chat.completions.parse`配合使用。

共同点是: một lần tuyên bố kế hoạch, cuối đến cuối bắt buộc thực hiện.

## 概念

### JSON Schema 2020-12  通用语

Mỗi nhà cung cấp đều chấp nhận JSON Schema 2020-12── các cấu trúc thường xuyên nhất của bạn bao gồm:

- `type`- Có thể là:`object``array``string``number``integer``boolean``null`Một trong số đó.
- `properties`:字段名到子方案的映射──
- `required`: phải xuất hiện của字段名列表。
- `enum`:允许值的封闭集合──
- `minimum`- `maximum`(数字),`minLength`- `maxLength`- `pattern`(字符串)
- `items`: được sử dụng cho các phụ quy trình của mỗi số tử
- `additionalProperties`- Có thể là:`false`禁止额外字段(默认值因模式而异)

OpenAI chế độ nghiêm ngặt  tăng thêm 3 yêu cầu: mỗi tài sản phải được xếp hạng trong`required`Trong đó, tất cả các vị trí đều phải có.`additionalProperties: false`, và không thể có được giải quyết`$ref`Nếu vi phạm các yêu cầu này, API sẽ trả lại 400

### Pydantic, Python 绑定

Pydantic v2  thông qua `model_json_schema()`Từ mô hình hình dạng lớp dữ liệu 生成 JSON Schema。 AI Pydantic đã đóng gói cho nó, vì vậy bạn có thể viết như sau:

```python
class Invoice(BaseModel):
    customer: str
    line_items: list[LineItem]
    total_usd: Decimal
```

Quadro đại lý 会在边界处把方案 转换 thành OpenAI chế độ nghiêm ngặt  Anthropic`input_schema`Hoặc là cặp song sinh`responseSchema` mô hình giao tiếp và kiểu hóa`Invoice`实例返回──验证错误会抛出 `ValidationError`,并带有类型 hóa sai lầm đường đi.

### Zod,TypeScript 绑定

Zod(`z.object({customer: z.string(), ...})`(Thiết: )                                                                                                                                                                                                                                                           `zodResponseFormat(Invoice)`, nó sẽ chuyển thành tải trọng ích của JSON Schema của API.

### Việc từ chối

Định chế nghiêm ngặt 不能强迫模型回答──如果输入无法适应 schema(邮件是一首诗,不是发票),模型会发出包含原因的 `refusal`字段── mã của bạn phải xem nó như một kết quả đầu tiên xử lý, chứ không phải là thất bại── từ chối cũng có thể là một tín hiệu an toàn: khi mô hình được yêu cầu rút thẻ tín dụng trong thư nội dung được bảo vệ, sẽ trả lại với lý do an toàn từ chối──

### 开放环境中的 Tự hạn chế giải mã

开放权重实现使用三种技术──

1. **Grammar-based decoding**(`outlines``guidance``lm-format-enforcer`): Từ sơ đồ  xây dựng một tự động hữu hạn xác định; trong mỗi bước, mặt nạ 掉会 vi phạm các logic Token của FSM.
2. **带 JSON parser 的 logit masking**:运行一个与模型同步的流媒体 JSON parser; 在每一步计算有效-下一个代码集合──
3. **带 verifier 的 speculative decoding**: giá rẻ mô hình dự thảo 提议 Token,verifier 强制执行方案。

 Các nhà cung cấp thương mại đã chọn một trong những bước sau đó.

### 三种失败模式

1. **Parse error。**输出 không có hiệu lực JSON. Trong chế độ nghiêm ngặt 下 sẽ không xảy ra.
2. **Schema violation。**输出 có thể giải quyết, nhưng trái ngược với quy trình.
3. **Refusal。**模型拒绝──必须作为类型化结果处理──

### 重试策略

Khi bạn không ở chế độ nghiêm ngặt 下时(Anthropic tool use、非 nghiêm ngặt OpenAI、较旧 Gemini), phục hồi chế độ là:

```
generate -> parse -> validate -> if fail, inject error and retry, max 3x
```

Một lần thử lại thường đủ. Một lần thử lại có thể nắm bắt mô hình yếu đôi khi xuất hiện vấn đề.

### 小模型支持

Việc giải mã hạn chế 适用于小模型── trong nhiệm vụ cấu trúc, một mô hình mở 3B 参数 của thực thi ngữ pháp, hiệu suất tốt hơn so với việc sử dụng mô hình số 70B của nguyên tắc ban đầu── đây là nguyên nhân chính khiến việc sản xuất cấu trúc quan trọng đối với môi trường sản xuất: nó làm cho độ tin cậy và mô hình lớn nhỏ giải thích──


```figure
constrained-decoding
```

## Sử dụng nó

`code/main.py`提供一个用 stdlib 编写的最小JSON Schema 2020-12验证器(types、required、enum、min/max、pattern、items、additionalProperties) ⋅它包装一个 `Invoice`schema,并让假 LLM output 通过验证器,演示解析错误、方案违规和拒绝路径──生产中可以把假输出 换成任何提供商的真实响应──

需要关注的点:

- Validator  quay lại một loại `[ValidationError]`列表,包含 path 和 message. Đây chính là hình dạng mà bạn muốn lộ cho prompt thử lại.
- từ chối 分支不会重试──它会记录日志并返回类型化 từ chối──Phase 14 · 09 使用 từ chối 作为安全信号──
- `additionalProperties: false`检查会在对抗性测试输入上触发,展示为什么严格模式 会把幻觉字段在门外──

## 交付 nó

本课产 出 `outputs/skill-structured-output-designer.md` Đặt ra một mục tiêu khai thác văn bản tự do (free text extraction target) (trác giá, vé hỗ trợ, resume, v.v.), kỹ năng này sẽ tạo ra một JSON Schema có khả năng tương thích với chế độ nghiêm ngặt 2020-12, cũng như một mô hình Pydantic với gương mặt,并内置 loại từ chối và thử lại xử lý stub。

## 练习

1. 运行 `code/main.py`❖ thêm 4 thí nghiệm sử dụng,其`total_usd`Vì vậy, xác nhận xác nhận sẽ được thông qua.`minimum`约束路径 từ chối nó.

2. 扩展验证器,使其支持带歧视者 的 `oneOf`❖ Tình huống thường gặp:`line_item`Ưu tiên là sản phẩm, Ưu tiên là dịch vụ, Ưu tiên là dịch vụ.`kind`打标签──Tình thức nghiêm ngặt Ở đây có một số quy tắc nhỏ; xin hãy xem hướng dẫn đầu ra có cấu trúc của OpenAI──

3. 把同一个 Faktura schema 写成 Pydantic BaseModel,并将 `model_json_schema()`输出与你手写的 schema 对比──找出 Pydantic 默认设置但手写版本遗漏的一个字段──

4. 测量拒绝率 ∼构造十个不应可提取的输入(一段歌词、一个数学证明、一个空白邮件),并通过带严格模式的真实提供商运行它们──统计拒绝与幻觉输出──这是你进行拒绝意识重复试验的基本真理──

5. Từ đầu đến cuối đọc hướng dẫn đầu ra cấu trúc của OpenAI. Tìm ra nó trong chế độ nghiêm ngặt, nhưng JSON Schema thông thường cho phép một cấu trúc. Sau đó thiết kế một kế hoạch không cần thiết sử dụng cấu trúc bị cấm, và sẽ tái cấu trúc thành nghiêm ngặt.

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| JSON Schema 2020-12 | “schema spec” | 每个现代提供商都支持的 IETF-draft schema dialect |
| Strict mode | “保证符合 schema” | OpenAI 通过 Constrained Decoding 强制执行 schema 的标志 |
| Constrained decoding | “Logit masking” | decode 时的强制执行，会 mask 无效的下一个 Token |
| Refusal | “模型拒绝” | 输入无法适配 schema 时的类型化结果 |
| Parse error | “无效 JSON” | 输出无法解析为 JSON；在 strict 下不可能发生 |
| Schema violation | “形状错误” | 已解析但违反 type / required / enum / range |
| `additionalProperties: false` | “不允许额外字段” | 禁止未知字段；OpenAI strict 中必需 |
| Pydantic BaseModel | “类型化输出” | 会发出并验证 JSON Schema 的 Python class |
| Zod schema | “TypeScript output type” | 用于提供商输出验证的 TS runtime schema |
| Grammar enforcement | “开放权重 constrained decode” | 基于 FSM 的 logit masking，如 outlines / guidance 中所用 |

## 延伸阅读

- [OpenAI — Structured outputs](https://platform.openai.com/docs/guides/structured-outputs) chế độ nghiêm ngặt, từ chối và yêu cầu về chương trình
- [OpenAI — Introducing structured outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) 2024 年 8 月发布文章, giải thích bảo đảm giải mã
- [Pydantic AI — Output](https://ai.pydantic.dev/output/) Hỗn nối các kết nối output_type được đánh dấu của các nhà cung cấp
- [JSON Schema — 2020-12 release notes](https://json-schema.org/draft/2020-12/release-notes) đặc điểm của các bộ phận
- [Microsoft — Structured outputs in Azure OpenAI](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs) 企业部署说明 và chế độ nghiêm ngặt
