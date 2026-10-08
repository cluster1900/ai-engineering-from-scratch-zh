# Các giao diện công cụ  为什么 đại lý 需要结构化 I/O

> 语言模型会生成代币――程序会执行动作―― sự khác biệt giữa hai thứ này là giao diện công cụ: một hợp đồng,让模型能够请求某一动作,并让主机执行它――2026 年的每种类型OpenAI、Anthropic 和 Gemini 上的函数调用;MCP 的`tools/call`Các phần nhiệm vụ của A2A đều có mã hóa khác nhau của cùng một vòng bốn bước.

**Type:** Learn
**Languages:** Python (stdlib, no LLM)
**Prerequisites:** Phase 11 (LLM completion APIs)
**Time:** ~45 minutes

## Học mục tiêu
- 解释 tại sao một LLM chỉ có thể tạo ra văn bản không thể tự mình hành động đối với thế giới thực.
- 画出四步工具-call loop (xác định → quyết định → thực hiện → quan sát),并说出每一步由谁负责──
- 将一个工具描述 写成三部分:name、JSON Schema input,以及确定性的执行函数──
- 区分纯工具和副作用工具,并说明 tại sao phân chia này rất quan trọng đối với an toàn.

## 问题
LLM 输出 là phân bố tỷ lệ của một token tiếp theo. Đó là toàn bộ bề mặt của nó. Nếu bạn hỏi một mô hình trò chuyện Bengaluru 现在天气如何, nó có thể viết một câu có vẻ hợp lý, nhưng nó không thể kết nối với API 天气.

弥合这个差距正是工具界面的目的──主机程序你的代理运行时间──Claude Desktop、ChatGPT、Cursor,或一个自定义脚本会向模型公布一组可调用工具──当模型判断需要某一动作时,它会输出一个结构化的有效载,指明工具 及其论文──主机解析该有效载,真正运行工具,并把结果反回去──直到这个循环持续,模型判断不再需要更多调用──

Phiên bản đầu tiên của hợp đồng này được phát hành vào tháng 6 năm 2023 với các chức năng của OpenAI dưới dạng tham số.`tool_use`Các khối: Gemini  vài tháng sau đã gia nhập `functionDeclarations` Hiện tại mỗi nhà cung cấp đều lộ dạng tương tự:输入一个由 JSON-Schema标注类型的工具列表,输出一个 JSON-payload tool call;;Model Context Protocol;;2024 年 11 月) sẽ hợp đồng này 泛化,使一个工具注册库 可以服务每个模型;;A2A;;2026 年 4 月,v1.0) 于一个原始的 之上叠加了代理到代理代表;;

Chuyện vòng bốn bước là sự không thay đổi của tầng dưới của các hệ thống này. Phần còn lại của giai đoạn 13 là sự mở rộng của nó.

## 概念
### Bước 1: mô tả

host 用三个字段声明 mỗi công cụ.

- **Name.**Một định vị được đọc trên máy tính.`get_weather`, thay vì đời tiết ──
- **Description.**Một đoạn ngôn ngữ tự nhiên简介── Khi người dùng hỏi tình hình thời tiết hiện tại của một thành phố cụ thể, không sử dụng dữ liệu lịch sử──
- **Input schema.**Một mô tả các đối số công cụ của đối tượng JSON Schema ((Mở 2020-12)。

模型 sẽ nhận được danh sách này. Các nhà cung cấp hiện đại sẽ sử dụng mẫu cụ thể của nhà cung cấp sẽ trình bày các tuyên bố này vào hệ thống nhanh chóng, vì vậy như một người dùng, bạn chỉ cần xử lý hình thức cấu trúc.

### Bước 2: quyết định

给定用户消息和可用工具,模型会选择三种行为之一──

1. **直接用文本回答**Không gọi công cụ.
2. **调用一个或多个 tools。**输出 cấu trúc gọi các đối tượng.`parallel_tool_calls: true`下(OpenAI 和 Gemini 默认启用,Anthropic 需要选择), mô hình có thể trong một lượt trong nhiều cuộc gọi.
3. **拒绝。**Các kết quả kết cấu trong chế độ nghiêm ngặt có thể tạo ra một loại hóa`refusal`Block, thay vì gọi.

Một công cụ gọi tải trọng hữu ích có ba phần ổn định: gọi `id`、 dụng cụ `name`, và JSON `arguments`Sự tồn tại của object, để để host có thể kết nối kết quả tiếp theo với cuộc gọi cụ thể; khi các cuộc gọi song song trở lại, điều này rất quan trọng.

### Bước 3: Thực hiện

host  nhận cuộc gọi, theo tuyên bố của schema 验证 arguments,并运行executor。 không hiệu quả arguments nghĩa là mô hình ảo giác 了某段或使用错类型这是模型弱上的非常常见失败模式。

trình thực thực hiện tự nhiên chỉ đơn giản là mã hóa. Python, TypeScript, lệnh shell, truy vấn cơ sở dữ liệu. Nó sẽ tạo ra một kết quả, thường là chuỗi, nhưng cũng có thể là bất kỳ giá trị JSON hoặc khối nội dung cấu trúc nào trong MCP.

### Bước 4: quan sát

Host sẽ kết quả công cụ  thêm vào cuộc trò chuyện 中( như带有匹配 `id`của `tool`(đọc từ bài viết này, bạn có thể tìm thấy một số thông tin về các mô hình và các thông tin khác về các mô hình và các thông tin khác về các mô hình và các thông tin khác về các mô hình và các thông tin khác về các mô hình và các thông tin khác về các mô hình và các thông tin khác về các mô hình và các thông tin khác về các mô hình và các thông tin khác về các mô hình và các thông tin khác về các mô hình và các thông tin khác về các mô hình và các thông tin khác về các mô hình và các thông tin khác về các mô hình và các thông tin khác về các mô hình và các thông tin khác về các mô hình và các thông tin khác về các mô hình.

### Sự tin tưởng chia rẽ

Công cụ có hai loại rất quan trọng đối với an toàn.

- **Pure.**Chỉ đọc, chắc chắn, không có tác dụng phụ.`get_weather``search_docs``get_current_time` có thể an toàn tiến hành đầu cơ 调用
- **Consequential.**Sẽ thay đổi trạng thái, tiền bạc, dữ liệu người dùng.`send_email``delete_file``execute_trade` phải thêm cửa 

Meta 2026 năm sử dụng an ninh đại lý  quy tắc của hai  cho thấy, một lượt 最多只能同时包含以下三项: đầu vào không đáng tin cậy, dữ liệu nhạy cảm, hành động hậu quả.

### Ở đâu vòng lặp sống

| Context | Who describes | Who decides | Who executes |
|---------|---------------|-------------|--------------|
| Single-turn function calling (OpenAI/Anthropic/Gemini) | App developer | LLM | App developer |
| MCP | MCP server | LLM via MCP client | MCP server |
| A2A | Agent Card publisher | Calling agent | Called agent |
| Web browser (function-calling agent) | Browser extension / WebMCP | LLM | Browser runtime |

Bất kể ở đâu, đều giống nhau bốn bước.

### Tại sao không trực tiếp nhắc 模型 xuất JSON?

让模型使用 JSON 回复 là chức năng gọi xuất hiện trước mô hình. Nó trong các mô hình biên giới trên có khoảng 5% đến 15% thời gian sẽ thất bại, tỷ lệ thất bại trên các mô hình nhỏ hơn cao hơn.

Hàm năng gọi bản địa là tốt hơn, vì có ba điểm. Thứ nhất, nhà cung cấp sẽ sử dụng hình dạng gọi chính xác cho mô hình để thực hiện đào tạo cuối cùng, do đó chế độ nghiêm ngặt, tỷ lệ valid-JSON dưới sẽ tăng lên 98% đến 99%. Thứ hai, tải trọng gọi nằm trong khe giao thức của riêng mình, thay vì văn bản tự do bên trong.`tool_use`、Gemini của `responseSchema`(c) Cung cấp quy trình tuân thủ.

Giai đoạn 13 · 02 会并排讲解三个 nhà cung cấp API.

### Máy cắt mạch

Khi mô hình ngừng phát ra các cuộc gọi, hoặc chủ host đạt đến số lượt tối đa, vòng kết thúc. Các máy chủ môi trường sản xuất thường đặt nó trong khoảng 5 đến 20 lượt.

Một lựa chọn khác là vòng lặp không giới hạn mỗi 6 tháng được gặp gỡ với một đại lý một đêm chi tiêu 400 USD API gọi

Giai đoạn 14 · 12 会深入讲解 lỗi phục hồi và tự chữa bệnh;Giai đoạn 17 会覆盖生产率限制──

### Giai đoạn 13 tiếp theo đi đâu

- Bài học 02 đến 05 会打磨 trình độ cung cấp công cụ-call bề mặt.
- Bài học 06 đến 14 sẽ được biến thành MCP.
- Bài học 15 đến 18 会防护这个循环,抵御 hostile servers、adversarial users 和 không xác nhận bề mặt auth từ xa──
- Bài học 19 đến 22 sẽ mở rộng mô hình này đến hợp tác giữa các đại lý, khả năng quan sát, định tuyến và đóng gói.
- Bài học 23 会交付一个使用每个原始的完整生态系统.

Phần còn lại của mỗi bài học là mở đầu của vòng vòng bốn bước này. Xin hãy ghi nhớ nó như không thay đổi trong tâm trí.


```figure
tp-tool-loop
```

## Sử dụng nó
`code/main.py`Trong trường hợp không có LLM, một vòng quay bốn bước được thực hiện. Một chức năng decider giả  thông qua thông tin của người dùng để kết hợp mô hình.

需要关注的内容:

- Registry tool cho mỗi tool 持有三个字段:name、描述、方案,以及执行器引用──
- Validator là một bộ phận nhỏ nhất của JSON Schema (types, required, enum, min/max), chỉ sử dụng stdlib 编写,Phase 13 · 04 会提供更完整的版本,
- 循环将 lặp số 限制在五次――生产代理 正是需要这种断路机――

## 交付 nó
本课会产出 `outputs/skill-tool-interface-reviewer.md`△给定一份草案工具定义 ((名称 + mô tả + sơ đồ + sơ đồ + sơ đồ thực hiện),该技能 会审计它的循环适用性:名称 是否机器稳定, mô tả 是否是完整的使用简介, sơ đồ 是否正确使用 JSON Schema 2020-12,以及纯对后果分类 是否明确──

## 练习
1. `code/main.py`添加第四工具,名为 `get_stock_price(ticker)`将其描述 写成:当用户按 ticker 询问当前股票价格时使用──不要用于历史价格或市场摘要── 运行利用,并确认假决策者 会将提卡者的查询 路由到这个新工具──

2. 破坏 schema validator──传入一个`arguments`Object 缺少 required field                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

3. Sẽ sử dụng trong mỗi công cụ phân loại cho thuần túy hoặc hậu quả.`consequential: true`cờ,并修改循环,使其在选择后果工具 时打印一行 将与用户确认──这是每个生产主都需要的确认门 形状──

4. Trong giấy vẽ vòng quay bốn bước, và sử dụng bảng cột nhà cung cấp trên 填入您最喜欢的客户端 (Claude Desktop、Cursor、ChatGPT或自定义堆) ⋅ với phiên bản cụ thể của MCP trong giai đoạn 13 · 06 交叉对照──

5. Từ đầu đến cuối đọc hướng dẫn gọi chức năng của OpenAI. Tìm ra một đoạn trong vòng bốn bước trong yêu cầu nhưng không có trong văn bản này. Giải thích nó đã tăng lên gì, và tại sao nó là một mục thuận tiện chứ không phải là một mục cần thiết.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Tool | “模型可以调用的东西” | name + JSON-Schema-typed input + executor function 组成的三元组 |
| Function calling | “Native tool use” | Provider-level API 支持，用于输出结构化 tool calls，而不是 prose |
| Tool call | “模型发出的行动请求” | 模型输出的一个 JSON payload，包含 `id`、`name`、`arguments` |
| Tool result | “tool 返回的内容” | executor 的输出，被包装在带有匹配 id 的 `tool` role message 中 |
| Parallel tool calls | “一次多个 calls” | 一个 model turn 中的多个 call objects，彼此独立，并可通过 id 排序 |
| Strict mode | “Guaranteed JSON” | Constrained decoding，强制模型输出通过已声明 schema 的验证 |
| Pure tool | “Read-only tool” | 无 side effects；可以安全地重新运行 |
| Consequential tool | “Action tool” | 会改变 external state；需要 gate、audit 或用户确认 |
| Four-step loop | “The tool-call cycle” | describe → decide → execute → observe |
| Host | “Agent runtime” | 持有 tool registry、调用模型并运行 executor 的程序 |

## 延伸阅读
- [OpenAI — Function calling guide](https://platform.openai.com/docs/guides/function-calling) Các thông báo công cụ kiểu OpenAI và các hình thức gọi của tham chiếu kinh điển
- [Anthropic — Tool use overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview) Claude của `tool_use`- `tool_result`định dạng khối
- [Google — Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling) Gemini 中的 `functionDeclarations`和 ngữ nghĩa gọi song song
- [Model Context Protocol — Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28) Hiện tại không trạng thái  thông thường sử dụng các công cụ giao tiếp quy định
- [JSON Schema — 2020-12 release notes](https://json-schema.org/draft/2020-12/release-notes) Mỗi công cụ hiện đại API đều sử dụng phương ngữ schema
