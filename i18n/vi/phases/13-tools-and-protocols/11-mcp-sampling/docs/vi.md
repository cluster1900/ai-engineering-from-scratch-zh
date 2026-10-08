# MCP 模型输入:Mẫu 迁移与无状态 MRTR

> MCP 2026-07-28 规范 bỏ qua tính năng Sampling của thiết kế mới,并 chuyển giao các server sang khách hàng  gửi ngược hướng yêu cầu của các đường đi.`input_required`Kết quả là, khách hàng mang mô hình ra lệnh thử lại yêu cầu ban đầu.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 10 (resources and prompts)
**Time:** ~75 minutes

## Học mục tiêu

- 解释为什么 MCP 2026-07-28 弃用样本,并为新构建的服务器 选择直接集成模型 (直接模型集成) 的默认架构──
- 实现一套兼容工作流, thông qua nhiều lần quay trở lại yêu cầu`sampling/createMessage`
- Trong mọi yêu cầu `_meta`Đối tượng trong phiên bản giao dịch và khả năng khách hàng.
-  quay lại `resultType: "input_required"`,并 sử dụng toàn bộ ID JSON-RPC mới 重试原始方法──
- Đối với`requestState`进行完整性保护 (trân trọng được bảo vệ),并将其绑定到主体 (chủ yếu) 、方法、参数及过期时间──
- Thông qua khả năng 校验、人工批准、响应验证和轮次上限, quy định nghiêm ngặt về vòng lặp hỗ trợ mô hình.

## Trong giao thức thiết kế trước khi xây dựng quyết định

形如 `summarize_repo`Công cụ thường cần hai loại công việc:

1. 确定性工作:列出文件、读取允许访问的文件、校验路径以及组装内容──
2. 模型工作:挑选代表性文件并综合生成摘要──

Bây giờ bạn có hai loại hình hợp pháp để lựa chọn.

### 新建 Server: trực tiếp集成模型提供方

Đây là thực tiễn cố định hiện tại.`tools/call`Kết quả.

Khi máy chủ là một dịch vụ quản lý, hoặc khi hiệu suất mô hình dự đoán quan trọng hơn mô hình của máy chủ vay, hãy chọn phương pháp này.

### 现有 工作流:迁移至 MRTR

Trong thời gian chuyển tiếp bị bỏ qua, Sample vẫn tồn tại.`sampling/createMessage`Trái ngược với yêu cầu. Thay vào đó, nó sẽ được yêu cầu được đặt trong.`InputRequiredResult`Trở lại.

Chỉ khi sử dụng mô hình và chứng cứ của khách hàng là nhu cầu cứng của sản phẩm rõ ràng, mới chọn con đường này hợp nhất.

## 无状态契约

Quy tắc giao ước tháng 7 năm 2026 được di chuyển `initialize`交互握手,`notifications/initialized`Và `Mcp-Session-Id` Trong quá khứ, có thông tin trong tay, bây giờ trực tiếp bởi mỗi yêu cầu tự mang theo:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "summarize_repo",
    "arguments": {"audience": "developer"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {"sampling": {}},
      "io.modelcontextprotocol/clientInfo": {
        "name": "lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

Server 会在每个请求上校验协议版本──版本缺失或非字符串类型属于无效参数,返回 `-32602`△ không được hỗ trợ phiên bản 字符串返回 `-32022`, và mang theo dữ liệu chính xác , dữ liệu`{"supported":["2026-07-28"],"requested":"<client version>"}` Nếu thiếu khả năng lấy mẫu 则返回 `-32021`,并将 `data.requiredCapabilities`设为 `{"sampling":{}}`

没有 JSON-RPC `id`Trong các cấp độ HTTP 适配层, thông báo đã được nhận sẽ trả về không chính thức.`202 Accepted`

Server còn phải được thực hiện với độ chính xác`supportedVersions`键、capacities、`ttlMs`和 `cacheScope`của `server/discover`方法, so that client in调用 tool 之前能够获知并缓存服务器的契约──由于发现 声明`tools`, máy chủ cũng phải thực hiện bắt buộc .`tools/list`其确定性的`summarize_repo`描述符包含合法的 đối tượng 类型 `inputSchema``resultType: "complete"`、 máy chủ, dữ liệu và các thông tin lưu trữ công cộng

Mỗi thỏa thuận hiện đại thành công đều bao gồm một phân biệt đối xử:

- `resultType: "complete"`表示操作已全部完成.
- `resultType: "input_required"`Cụ thể client phải thực hiện yêu cầu nhập trong và thực hiện thử lại.
-  mở rộng quy tắc có thể xác định các loại kết quả bổ sung, ví dụ trong bài học 13  mở rộng tăng `"task"`

## 单轮 MRTR 交互流程

Server không thể gọi khách hàng trong thời gian xử lý yêu cầu. Nó chuyển và trả lại như sau:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "pick_files": {
        "method": "sampling/createMessage",
        "params": {
          "messages": [
            {
              "role": "user",
              "content": {
                "type": "text",
                "text": "Choose three representative files and return a JSON array."
              }
            }
          ],
          "systemPrompt": "Return only the requested value.",
          "modelPreferences": {
            "costPriority": 0.8,
            "intelligencePriority": 0.2
          },
          "maxTokens": 400
        }
      }
    },
    "requestState": "opaque-integrity-protected-value"
  }
}
```

Khách hàng 验证 tự hỗ trợ Sampling, áp dụng phê duyệt phê duyệt và chiến lược mô hình,并获取模型响应.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "summarize_repo",
    "arguments": {"audience": "developer"},
    "inputResponses": {
      "pick_files": {
        "role": "assistant",
        "content": {
          "type": "text",
          "text": "[\"README.md\", \"server.py\", \"docs/intro.md\"]"
        },
        "model": "host-model",
        "stopReason": "endTurn"
      }
    },
    "requestState": "opaque-integrity-protected-value",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {"sampling": {}}
    }
  }
}
```

Đây là một sự tiếp tục của cuộc họp không thỏa thuận. Nó là một yêu cầu hoàn toàn mới: phương pháp và tham số tái tạo, chỉ thêm vào các phiên trước.`inputResponses`,并原封不动地逐字节回显 `requestState`

MRTR chỉ cho phép xuất hiện`tools/call``prompts/get`和 `resources/read`中──Server 绝不能从无关方法中返回 `input_required`

## 多轮 trạng thái quản lý

本课需要两次模型调用:

1. `pick_files`返回一个 JSON 数组──
2. `summary`返回最终的摘要文字──

Vì mỗi lần thử lại chỉ mang lại phản ứng của vòng, máy chủ cần phải đưa dữ liệu giữa giai đoạn hiện tại (phase) và giai đoạn qua của trường vào giai đoạn tiếp theo.`requestState`Ở giữa.

Xin hãy xem giá trị này như dữ liệu có thể được kiểm soát bởi kẻ tấn công. Chỉ cần thực hiện đơn giản ký tên của giai đoạn là không đủ.

- 经过鉴权的主体 (tổ chức chứng minh), chứ không phải tự tuyên bố `clientInfo`-
- 发起调用 nguyên thủy;
- 摘要原始参数的摘要(chử trùng);
- 较短的过期时间;
- Giá trị trung bình của giai đoạn trước và qua học.

Trong khi không cần mật khẩu, bạn có thể sử dụng HMAC. Khi khách hàng không thể đọc nội dung trạng thái, xin sử dụng thông qua quyền nhận dạng mật mã (truyền mã hóa xác thực)`-32602`

Khách hàng không thể giải quyết hoặc thay đổi`requestState` Nhiệm vụ duy nhất của nó là trong thời gian thử lại như thế nào để truyền tải 字符串.

## 模型偏好 chỉ để chỉ dẫn

`costPriority``speedPriority`Với`intelligencePriority`Các lựa chọn không phải là phân bố tỷ lệ, tổng hợp cũng không cần phải là 1. Khách hàng có quyền kiểm soát tuyệt đối về chiến lược mô hình, do đó có thể hoàn toàn bỏ qua những lựa chọn này.

Nếu bạn vẫn đang trong quá trình lấy mẫu, xin hãy`includeContext` giữ cho `"none"` Các mô hình văn bản trên nó sẽ tăng nguy cơ phát tán, và nó đã bị từ bỏ.

## 安全不变量

Đối với các yêu cầu lấy mẫu trong nội dung, khách hàng là giới hạn duy nhất:

- Khi chiến lược yêu cầu sự phê duyệt nhân tạo, máy chủ hiển thị rõ ràng cho người dùng đang yêu cầu mô hình thực hiện những hoạt động nào.
- 限制 MRTR 轮次上限──否则恶意服务器可能构建无休止的模型消费循环──
- Trong khi sẽ lấy mẫu 响应 như tên tệp URL hoặc công cụ 输入 sử dụng trước khi, nó được thực hiện kiểm tra nghiêm ngặt.
- 限制 số chữ cái và mã thông báo mỗi vòng quay trở lại
- 拒绝在当前客户能力中未声明的输入请求──
- 避免让模型输出决定授权鉴权逻辑──
- 记录发起的方法及输入请求钥匙, đồng thời tránh gõ 内容敏感于日志中的快速内容.

`clientInfo`和 `serverInfo`Chỉ dùng để hiển thị và chẩn đoán dữ liệu. Không thể sử dụng bằng chứng nhận.

```figure
t3-sampling-flip
```

## 手写实现

`code/main.py`Không phụ thuộc vào bất kỳ gói thứ ba nào, hoàn toàn thực hiện quá trình quay lại hai vòng:

- `server/discover` quay lại `supportedVersions`, tuyên bố công cụ 支持,并返回缓存提示。
- `tools/list`返回具有对象输入方案的、确定性且可缓存的 `summarize_repo`描述符──
- `tools/call`校验每个请求的元数据──
- Kết quả đầu tiên được sử dụng để chọn các file `sampling/createMessage`
- Kết quả thử nghiệm lần đầu tiên và kết quả của mô hình được đặt vào yêu cầu thứ hai.
- Được bảo vệ bởi HMAC`requestState`Trong giai đoạn tự do giữa các yêu cầu an ninh truyền tải thực hiện.
- Kết quả cuối cùng sử dụng`resultType: "complete"`

模拟的宿主 模型保证了示例的确定性──当接入真实宿主时,只需要更换 `fake_host_model`❖ Tình trạng bên máy chủ 应始终保持确定性并易测试──

## Sử dụng và vận hành

Trong thư mục kho:

```bash
cd phases/13-tools-and-protocols/11-mcp-sampling/code
python3 main.py
python3 -m unittest discover tests -v
```

预期检查点:

- Phát hiện  quay lại 带有`ttlMs`和 `cacheScope`Kết quả hoàn chỉnh của
- Khám phá công cụ  trả lại排序相同的描述符,带有 `resultType`、server 身份与缓存提示──
-  thiếu khả năng và không hỗ trợ phiên bản phân biệt trở lại精准的 `-32021`Với`-32022`错误数据――
- Không có thông báo của ID không tạo ra bất kỳ phản ứng JSON-RPC nào.
- Xin lỗi, xin lỗi.`[1, 2, 3]`, chứng minh mỗi MRTR 轮次均完全独立──
- 前两结果类型为 `input_required`
- Kết quả cuối cùng`complete`,并包含 các tài liệu được chọn và bản tóm tắt cuối cùng.
- Trong lần thử lại, các yếu tố nguyên thủy sẽ dẫn đến yêu cầu của nhà nước thất bại.

## 交付产物

`outputs/skill-sampling-loop-designer.md`现已升级为迁移规划器――它首先决定是否应废弃样本 改用直接模型集成――如果必须保留兼容性,它会产生MRTR 交互轮次、状态绑定、能力 门禁、预算控制、数据校验以及平稳退役方案――

## 课后练习

1. 将文件选择的响应修改为无效的 JSON字符串――确认服务器会返回`-32602`Không phải là một mô hình tin tưởng mù quáng.
2. Trong lần đầu tiên và lần thử lại`audience`参数―― giải thích tại sao trạng thái sau khi đóng lại có thể ngăn chặn việc lặp lại yêu cầu――
3. Tăng cường giao tiếp vòng thứ ba, yêu cầu chủ nhà đánh giá và phê bình bản tóm tắt.
4. 彻底移除 Sampling:将模拟的宿主回调替换为服务器自持的模型适配器──列出此时有哪些批准、计费和可观测性职责转移到服务器端──
5. Thêm một quá hạn test:传入 một đã vượt quá thời hạn 1 giây của trạng thái giá trị, xác minh trường học thử thất bại.

## 关键术语

| 术语 | 2026-07-28 中的含义 |
|------|------------------------|
| Sampling | 已弃用特性，用于请求 client 端的模型执行文本补全 |
| MRTR | 多轮往返请求（Multi Round-Trip Requests），用于在请求中获取 client 输入的无状态重试模式 |
| `InputRequiredResult` | 带有 `resultType: "input_required"` 的结果对象 |
| `inputRequests` | Server 分配的映射表，包含内嵌的 elicitation、sampling 或 roots 请求 |
| `inputResponses` | Client 在当前轮次提交的响应，键名与 `inputRequests` 一一对应 |
| `requestState` | 不透明的 server 状态字符串，由 client 原样回显并由 server 校验完整性 |
| `resultType` | 现代 MCP 返回结果中必须包含的类型判别器 |
| 直接模型集成（Direct model integration） | 新建 server 需要模型推理时的官方推荐替代方案 |
| Capability 门禁（Capability gate） | 防止向未声明相应支持的 client 发送内嵌请求的安全规则 |
| 循环预算（Loop budget） | 本次操作允许的最大轮次、token 数、字节数、执行时长以及花费上限 |

## 旧版兼容性

 Fixed in 2025-11-25  phiên bản khách hàng có thể vẫn còn sử dụng máy chủ cũ trên kết nối sống  khởi động `sampling/createMessage`流程──请将该行为严格隔离在版本专用适配器中──切勿将会话路径作为2026-07-28服务器基础架构──

官方 SDK có thể sẽ hiện đại `input_required`处理程序转换为适应旧版对端的通信. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片.   片.    片.                                                                                                                          

## 延伸阅读

- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP Sampling deprecation](https://modelcontextprotocol.io/seps/2577-deprecate-roots-sampling-and-logging)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
