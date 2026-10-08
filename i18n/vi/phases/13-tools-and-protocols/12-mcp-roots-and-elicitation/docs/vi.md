# 显式权限范围与无状态 征求

> Roots trong MCP 2026-07-28 规范中已被废弃,且它从来不是安全沙箱. 請将权限范围 (范围) đặt vào các công cụ có thể nhìn thấy trong các tham số hoặc nguồn URI, được trình duyệt bởi máy chủ, và được xác định trong công cụ thực sự cần người dùng nhập vào khi sử dụng MRTR.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 11 (stateless MRTR)
**Time:** ~60 minutes

## Học mục tiêu

- Sử dụng biểu thức work区参数、resource URI hoặc server 静态配置替代已废弃的 Roots。
- Để phân biệt nghiêm ngặt phạm vi của hệ điều hành và quyền nhận dạng, hạn chế đường dẫn và hệ điều hành.
-  Thông qua MRTR `input_required`Kết quả交付表单模式(form-mode) của`elicitation/create`
- Trong mỗi yêu cầu của khách hàng khả năng trong tuyên bố yêu cầu  hỗ trợ并 từ chối không được hỗ trợ mô hình.
- 严谨校验 `accept``decline`和 `cancel`Đó là 3 kết quả tương tác khác nhau.
- Sẽ phá hủy xác nhận bị ràng buộc với chủ thể quyền nhận dạng, các nguyên tố ban đầu, tập hợp ứng cử viên và thời gian hết hạn.

## Hai vấn đề giống nhau

Một công cụ ghi chú 收到了如下请求: 删除旧TPS 报告──

Server phải trả lời hai câu hỏi khác nhau:

1. Việc này cho phép chạm vào khu vực làm việc nào?
2. Trong 3 ghi chú phù hợp, người dùng chỉ định là gì?

Thứ nhất là về phạm vi của các tài liệu được chuyển giao, và thứ hai là về quyền phép. Thứ hai là về sự kết nối, và điều này có thể dẫn đến sự kết hợp giữa các tài liệu được chuyển giao và các tài liệu được chuyển giao.

## Roots  chỉ vì di chuyển 过渡表面

Các quy định của MCP ban đầu cho phép khách hàng tuyên bố Roots, và trong danh sách xảy ra sự thay đổi khi thông báo cho máy chủ. Tuy nhiên Roots chỉ là thông tin hướng dẫn gợi ý.

MCP 2026-07-28  đối với thiết kế mới đã hoàn toàn từ bỏ `roots/list`Với`notifications/roots/list_changed`❖                                                                                                                                                                                                                                                              

- Khi phạm vi thay đổi theo từng lần sử dụng, sử dụng`workspaceUri`Hoặc`directory`công cụ 参数。
- Khi hoạt động tự nhắm vào một nguồn tài nguyên cụ thể, sử dụng nguồn URI.
- Khi một bộ phận đặc biệt độc lập chiếm đóng một khu vực làm việc cố định, sử dụng máy chủ 配置文件。
- Khi phải chặn mã từ kỹ thuật qua giới, sử dụng quá trình沙箱 (chỗ sandbox) hoặc hệ thống file cách biệt (các hệ thống file) ⋅

Nếu hiện có 2026-07-28  tiếp cận các chương trình trong quá trình chuyển tiếp bị bỏ qua vẫn cần thiết `roots/list`, máy chủ sẽ được gắn vào MRTR của nó`inputRequests`Trong khi đó, không thể gửi thực tế ngược thời gian yêu cầu. Đây chỉ là một cách chuyển đổi thích ứng; người xử lý của viết mới nên trực tiếp nhận được phạm vi hiển nhiên.

Mô hình có thể nhìn rõ và lặp lại các câu nói rõ ràng (xử lý) ⋅ trong khi ẩn trong phạm vi ẩn trong các cuộc họp truyền tải ⋅ khó hơn để kiểm tra, tái lập, kiểm toán và đường dẫn.

### 3 tầng bảo vệ

URI rõ ràng không tự mang bằng chứng hợp pháp.

1. **鉴权（Authorization）：**Có được phép sử dụng khu vực làm việc này cho chủ sở hữu quyền thông qua không?
2. **路径限制（Containment）：** Mục tiêu sau quy định URI có nghiêm ngặt giữ trong biên giới khu vực làm việc được ủy quyền không?
3. **沙箱隔离（Sandbox）：**Một khi máy chủ bị xâm nhập và bị rơi, hệ điều hành có thể ngăn chặn nó thoát khỏi biên giới không?

Cân bộ có thể vận hành 会维护一个信任工作区 URI 白名单,规范化处理百分号编码的路径,校验真实的路径组件边界,并执行物理删除前即时重新检查路径限制──

幼稚的字符串前检查是存在严重漏洞的:

```text
allowed:   file:///work/notes
attacker:  file:///work/notes-evil/secret.md
traversal: file:///work/notes/%2e%2e/private.md
```

Hai đường ác ý này đều có vẻ như là một chuỗi các mã pháp luật. Trước tiên phải làm quy định hóa, sau đó tái phân cấp so với các bộ phận đường.

## Sự tạo ra vẫn còn, nhưng cách giao tiếp đã thay đổi

Elicitation là một trong những quy tắc hiện đại được sử dụng trong`tools/call``prompts/get`Hoặc`resources/read`执行期间收集用户输入的客户端特性──方法名称仍然是 `elicitation/create`Sự thay đổi thực sự là hướng di chuyển dữ liệu trên mạng lưới.

2026-07-28 của máy chủ sẽ không gửi ngược JSON-RPC                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `InputRequiredResult`- Có thể là:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "delete_choice": {
        "method": "elicitation/create",
        "params": {
          "mode": "form",
          "message": "Choose one matching note and confirm deletion.",
          "requestedSchema": {
            "type": "object",
            "properties": {
              "note_id": {
                "type": "string",
                "enum": ["note-3", "note-7", "note-14"]
              },
              "confirm": {"type": "boolean"}
            },
            "required": ["note_id", "confirm"]
          }
        }
      }
    },
    "requestState": "integrity-protected-delete-state"
  }
}
```

Host 负责染表单──用户可选择提交接受 (接受) 、显式拒绝 (拒绝) 直接取消/关闭 (取消) 随后客户端 携带全新 id 重试原始的 `tools/call`- Có thể là:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "notes_delete",
    "arguments": {
      "workspaceUri": "file:///Users/alice/Documents/Notes",
      "title": "TPS report"
    },
    "inputResponses": {
      "delete_choice": {
        "action": "accept",
        "content": {"note_id": "note-14", "confirm": true}
      }
    },
    "requestState": "integrity-protected-delete-state",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "elicitation": {"form": {}}
      }
    }
  }
}
```

Trong hai cuộc gọi không có bất kỳ thỏa thuận nào. Trong khi đó, không có bất kỳ thỏa thuận nào.

## Khả năng đàm phán đối với mỗi yêu cầu

支持表单模式 elicitation 的客户 会声明:

```json
{
  "io.modelcontextprotocol/clientCapabilities": {
    "elicitation": {"form": {}}
  }
}
```

空的 năng lực tạo ra`"elicitation": {}`) vì tính hợp tác vẫn tương đương với chỉ hỗ trợ mô hình đơn ̋.`"elicitation": {"form": {}}`Đồng thời hỗ trợ biểu diễn đơn phương.`"elicitation": {"url": {}}`) không hỗ trợ biểu đơn. Bộ máy chủ không thể tích hợp các khả năng của yêu cầu hiện tại trong mô hình thiếu hụt, thậm chí yêu cầu trước đó đã tuyên bố mô hình này.

Mỗi yêu cầu cũng phải được mang theo.`io.modelcontextprotocol/protocolVersion`△ phiên bản thiếu hoặc không phải kiểu chữ `-32602`▽不支持的版本字符串返回 `-32022`Không có sự xác định.`supported`Với`requested`数据──缺失或仅支持 URL 查询 会返回 `-32021`,并将 `data.requiredCapabilities`设为 `{"elicitation":{"form":{}}}`

没有 JSON-RPC `id`Trong HTTP được phát trực tiếp, thông báo đã được nhận sẽ nhận được không chính thức.`202 Accepted`

`clientInfo` phải được bao gồm để dùng để chẩn đoán, nhưng nó là tự tuyên bố, không thể được sử dụng để xác định quyền nhận dạng người dùng.

Server đã được thực hiện`server/discover`Và quay lại bao gồm`resultType: "complete"`của `supportedVersions`、capacities`ttlMs`Và `cacheScope`Đối với thiết kế hiện đại này, nó sẽ không tuyên bố ra ngoài Roots.`tools/list` Kết quả trở lại xác định`notes_delete`描述符、合法的 đối tượng 类型 `inputSchema`、 máy chủ, dữ liệu và các thông tin lưu trữ công cộng

## 表单模式(Phương thức Mode)

Mô hình biểu đơn sử dụng thiết kế JSON Schema có hạn chế dành riêng cho hộp thoại có sẵn. Chế độ gốc phải là đối tượng, các tính chất của nó chỉ giới hạn ở các đoạn văn nguyên bản của 平 (đại nguyên) hoặc được hỗ trợ bởi một số lượng các hình thức.

表单模式适用于:

- Chọn một trong một số dự án ứng cử viên;
- xác nhận một số hoạt động phá hoại;
- Ưu tiên cấu hình thu thập thông tin không chứa thông tin nhạy cảm;
-  thu thập ít lượng phải là giá trị số của người chứ không phải là quyết định mô hình.

Không cần sử dụng mô hình đơn để thu thập mật khẩu, khóa API, giấy phép truy cập hoặc chứng chỉ thanh toán. Thông tin mật này nếu qua khách hàng MCP, rất dễ dàng vào nhật ký hoặc mô hình.

Server phải kiểm tra lại nội dung chuyển tiếp.

## URL 模式(Mode URL)

URL 模式发送一个安全的 Web URL để thực hiện带外(out-of-band)交互:

```json
{
  "method": "elicitation/create",
  "params": {
    "mode": "url",
    "message": "Connect the report service to continue.",
    "url": "https://mcp.example.com/connect/report-service"
  }
}
```

Khi thông tin nhạy cảm phải được nhập trực tiếp vào Web 流程 do máy chủ  kiểm soát (ví dụ: OAuth của bên thứ ba) thì hãy sử dụng mô hình URL.

`accept`响应 chỉ biểu thị người dùng đồng ý mở URL, không chứng minh giao dịch bên ngoài đã hoàn thành thành công. Trong thử nghiệm lại, máy chủ sẽ kiểm tra trạng thái của mình, hoặc thực hiện hoàn thành, hoặc quay lại một .`input_required`Kết quả.

URL elicitation 绝不能替代 MCP client và MCP server 之间的识别权机制―― nó là để MCP server 代表用户执行外部交互而设计的―― Server 必须将浏览器端的用户与发起 MCP 操作的同一已识别权主体紧密绑定――

## 响应分支与处理分支

Xin hãy đưa ra các hành động 视作严的产品逻辑决策,而非同义别名:

| 动作 | 含义 | 安全的 Server 处理行为 |
|---|---|---|
| `accept` | 用户提交了交互内容 | 校验内容并继续执行 |
| `decline` | 用户明确表示拒绝 | 返回一个执行完成且非错误的拒绝结果 |
| `cancel` | 用户关闭对话框或未能完成交互 | 安全停止并允许稍后重试 |

绝不要将缺失内容解读为默许同意. 绝不要将衰退. 绝不要将衰退. 转换为重复追问的死循环.

## 保护破坏性 MRTR  trạng thái

Danh sách ứng cử viên không thể chỉ tồn tại trong giá trị Base64 của đơn giản hoặc chưa ký kết.

Bài viết này được đăng ký cho các công ty, bao gồm:

- 经过鉴权的主体;
- 发起调用 nguyên thủy;
- `workspaceUri`Với`title`
- 表单中展示的合法笔记 id 列表;
- 操作执行阶段;
- 较短的过期时间──

Trước khi thực hiện thay đổi, máy chủ cũng sẽ kiểm tra hồ sơ ghi chép sống mới nhất. Điều này có thể ngăn chặn các điều kiện cạnh tranh của việc xóa hoạt động, cũng như tình trạng ghi chép mục tiêu được di chuyển ra khỏi biên giới khu vực làm việc sau khi hiển thị trên bảng.

Đối với giao dịch tài chính một lần hoặc không thể đảo ngược, chỉ có HMAC không thể ngăn chặn trạng thái hợp pháp được tái lưu trong thời hạn hiệu lực của nó. Phải được sử dụng trong tất cả các nhà khai thác.

Trong tuyên bố không có  phải kiểm tra trước sự hợp pháp của giao dịch  hình thức phản ứng sai lầm hoặc `cancel`Không thực hiện bất kỳ thay đổi nào, và cho phép trạng thái này trong quá trình thử lại.`decline`属于终态, do đó本课会消费该 nonce 且不执行任何删除──

```figure
t3-roots-boundary
```

## 手写实现

`code/main.py`演示 một hiện đại hóa `notes_delete`công cụ:

- `tools/list`返回确定性、可缓存的描述符,包含必需的工作空间和标题方案──
-  quyền hạn phạm vi thông qua rõ ràng `workspaceUri`参数传递。
- Server  định cấu hình cho chủ đề khóa học hiện tại cấp quyền truy cập vào khu vực làm việc này.
- URI 规范化有效拒绝前混与编码后的目录遍历攻击──
- 所有的破坏性删除均强制要求表单模式诱导――
- Elicitation 封装在 `resultType: "input_required"`Trung truyền tải
- 签名 của `requestState` kết hợp danh sách ứng cử viên chính xác với các tham số ban đầu
- Đăng vào phòng chống lưu trữ có thể trong nhiều máy chủ  thí dụ từ chối sử dụng lại cùng một chấp nhận hoặc giảm  trạng thái 
- 重试调用采用全新请求 id 并返回 `resultType: "complete"`

Data storage sử dụng bộ nhớ để thực hiện, để có thể kiểm tra rõ ràng các giao ước hành vi. Nếu kết nối với cơ sở dữ liệu, các quy tắc an ninh hoàn toàn phù hợp.

## Sử dụng và vận hành

Trong thư mục kho:

```bash
cd phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/code
python3 main.py
python3 -m unittest discover tests -v
```

预期检查点:

- Công cụ phát hiện 声明 且不包含 Roots。
- Khám phá công cụ 返回 `notes_delete`, kèm theo`resultType`、server 身份与缓存提示──
- Xin nhận dạng`1`Trong `inputRequests.delete_choice`Trong trở lại biểu diễn đơn giản.
- Xin nhận dạng`2`回显签名状态并完成删除──
- Trước đây, các phương pháp lừa đảo và mã hóa trên toàn bộ các phương pháp đều gây ra các phương pháp hạn chế thất bại.
- 改 tiêu đề 无法复用先前的确认状态──
- 执行 decline 会保留笔记完好无损――
- 共享笔记与重放状态的两个服务器对象无法重复执行同一次确认──
- Không có cấu hình và đơn tuyên bố biểu hiện đều có thể hoạt động bình thường, nhưng chỉ tuyên bố URL  hỗ trợ  chính xác trả về `-32021`                                                                                                                                                                                                                                                              
- Không được hỗ trợ phiên bản lỗi trả lời sử dụng chính xác `-32022`Các cấu trúc dữ liệu
- Không có thông báo của ID không tạo ra bất kỳ phản ứng JSON-RPC nào.

## 交付产物

`outputs/skill-elicitation-form-designer.md`能够辅助设计显式范围、识别权检查、MRTR 表单、响应分支与状态绑定── nó nghiêm cấm được sử dụng đã bị bỏ hoang Roots khi sử dụng như hộp, cũng cấm thông qua biểu mẫu đơn thu thập thông tin nhạy cảm──

## 课后练习

1. Để thay thế lưu trữ trong SQLite. Trong các vụ việc đơn lẻ, tuyên bố nguyên tử hóa không có và xóa ghi chép, chứng minh hai quá trình không thể gửi thành công cùng một lúc.
2. 增加 `url`khả năng đàm phán với các bên bên ngoài quy trình thiết lập.`inputResponses`
3. Để thay thế sổ ghi nhớ trong SQLite tạm thời.
4. Vì thực tế hệ thống tài liệu thực hiện thiết kế mã liên kết (symbolic-link) chiến lược an toàn.
5.  thiết kế một 2025-11-25 适配器,将现代MRTR handler 输出映射为旧式服务器 发起的发动,并保持其与当前处理器的代码隔离――

## 关键术语

| 术语 | 2026-07-28 中的含义 |
|------|------------------------|
| Roots | 已弃用的提示性工作区指引，不具备鉴权或沙箱隔离能力 |
| 显式权限范围（Explicit scope） | 在请求参数中清晰可见的工作区、目录或 resource 句柄 |
| 路径限制（Containment） | 规范化路径组件校验，确保目标严格限制在受控边界之内 |
| Elicitation | 在 MCP 操作执行期间用于获取用户输入的 client 特性 |
| 表单模式（Form mode） | 使用受限扁平 schema 的带内（in-band）结构化用户输入 |
| URL 模式（URL mode） | 针对敏感或外部工作流的带外（out-of-band）Web 交互 |
| MRTR | 多轮往返请求，返回 input-required 结果后由 client 发起全新重试 |
| `requestState` | 不透明的状态凭证，由 client 原样回显并由 server 进行完整性校验 |
| Decline（拒绝） | 用户明确作出的拒绝操作 |
| Cancel（取消） | 用户主动关闭界面或在未获批准的情况下中断交互 |

## 旧版兼容性

Đối với các kết quả được xác định trong phiên bản 2025-11-25,`roots/list``notifications/roots/list_changed`Và máy chủ thực tế  khởi động `elicitation/create`Có thể vẫn tồn tại. Xin hãy đặt dấu ấn rõ ràng cho bộ điều chỉnh này. Không thể cho phép bản gốc cũ của danh sách vượt qua các máy chủ, cũng không nên đưa giả định của giao thức vào bộ xử lý hiện đại.

## 延伸阅读

- [MCP 2026-07-28 Elicitation](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation)
- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 Roots deprecation](https://modelcontextprotocol.io/specification/2026-07-28/client/roots)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
