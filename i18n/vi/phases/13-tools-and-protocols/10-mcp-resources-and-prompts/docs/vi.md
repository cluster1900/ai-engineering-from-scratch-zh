# MCP Resource 与 Prompt:无状态 Server 的可寻址上下文

> Công cụ được sử dụng để thực hiện hoạt động. Tài nguyên được sử dụng để tiết lộ nội dung có thể tìm kiếm.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lesson 07 (Building an MCP Server), Phase 13, Lesson 09 (MCP Transports)
**Time:** ~60 minutes

## Học mục tiêu

- 根据用户意图在工具,资源和快速之间做出正确选择──
- 通过强制要求 `server/discover`声明 nguồn lực và khả năng tiếp cận nhanh chóng
-  cấu trúc xác định `resources/list`Với`prompts/list`Trả lại kết quả.
-  hợp lý áp dụng `ttlMs`Với`cacheScope`, tránh tiết lộ dữ liệu của người dùng cụ thể.
- 遇到无效或未知资源 URI 时返回 JSON-RPC 错误 `-32602`
-  mở cửa `subscriptions/listen`POST 响应流,并通过订阅 ID 关联每个事件──
- Để tài nguyên  nội dung và prompt 模板一律视为不可信的服务器 输出──

## Từ người dùng ý định xuất phát

滥用 MCP là cách dễ nhất là trực tiếp từ việc thực hiện mã bắt đầu. 查询 cơ sở dữ liệu vì như hàm được biến thành công cụ.

Xin hãy chọn người đến và những gì họ mong muốn xuất hiện.

| Primitive | 主要意图 | 选择主体 | 典型结果 |
|---|---|---|---|
| Tool | 执行某项操作 | Model 或应用程序 | 结构化动作结果 |
| Resource | 读取特定 URI 的内容 | Host、应用程序或用户 | 文本或二进制内容 |
| Prompt | 启动可复用的消息工作流 | 用户（通过 Host UI） | 一条或多条 prompt 消息 |

位于 `notes://note-1`Nó là một tài nguyên, vì nó là nội dung có thể tìm kiếm.`delete_note`Đó là một công cụ, vì nó sẽ thay đổi trạng thái.`review_note`Đó là một sự nhanh chóng, bởi vì người dùng chủ động chọn dự định của quá trình kiểm tra.

Không chỉ để  trông có chức năng hoàn chỉnh mà còn để cùng một hoạt động cùng một lúc lộ ra cho những người này.

## 2026-07-28 无状态信封

本课针对 MCP 协议版本 `2026-07-28`Trong quy định này, không có bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt tay bắt đầu bắt tay bắt tay bắt đầu bắt tay bắt tay bắt đầu bắt đầu bắt tay bắt tay bắt tay bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu bắt đầu`_meta`键中携带其协议版本和客户端功能──

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/list",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      },
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

Server phải được thực hiện`server/discover` Kết quả trả lời của nó  phiên bản hỗ trợ  nguồn lực và khả năng nhanh chóng  thực hiện nhận dạng và gợi ý lưu trữ  gợi ý cache  Khách hàng có thể trực tiếp sử dụng phương pháp khác, nhưng khám phá  cho phép khách hàng có thể tạo ra UI trước để có được một bức ảnh nhanh nhất định 

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "resources": {"listChanged": true, "subscribe": true},
    "prompts": {"listChanged": true}
  },
  "ttlMs": 3600000,
  "cacheScope": "public"
}
```

常规结果会声明 `"resultType": "complete"`                                                                                                                                                                                                                                                              `_meta`会通过 `io.modelcontextprotocol/serverInfo`标识服务端的实现信息──信息用于诊断排错, không phải bằng chứng nhận danh tính──携带未支持协议版本的请求将回复 `-32022`错误, đồng thời với các phiên bản yêu cầu trên cùng với các phiên bản được hỗ trợ của máy chủ.

无状态契约会重塑你的设计直觉――列表查询不能依赖单条连接上前调历史――认证凭证作为请求输入可以改变返回的可见集合,但连接历史绝不能影响结果――

## Nguồn là ổn định URI 契约

Nguồn là bởi nội dung của URI 标识.

良好的 URI 应具备的属性:

- 足够稳定, có thể được gia nhập bằng giấy tờ hoặc được chuyển giữa nhiều lần yêu cầu.
- 划分在服务器的专有命名空间 (nói không gian) 下。
- 独立于具体进程 ID或连接──
- Trong khi đó, các nhà đầu tư đã được kiểm tra trước khi truy cập kho lưu trữ.
- Mỗi lần đọc đều được thực hiện quyền nhận quyền.

`notes://note-1`优于 `note-1`Vì không gian tên của nó là rõ ràng.`file://`URI, nhưng trong các liên kết phân tích (symlinks) và các đường tương đối, phải kiểm tra nghiêm ngặt các biên giới danh mục được cấu hình tốt.

`resources/list`返回调用方当前可见的资源──必需按照稳定键 (例如 URI)排序──确定性的顺序可以防止缓存震荡击穿 (Cache misses) 、快照漂移以及主机UI 在刷新时发生跳动──

```json
{
  "resultType": "complete",
  "resources": [
    {
      "uri": "notes://note-1",
      "name": "Architecture decision",
      "description": "Why the service uses a stateless boundary",
      "mimeType": "text/markdown"
    }
  ],
  "ttlMs": 300000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "notes-server",
      "version": "2.0.0"
    }
  }
}
```

`resources/read`返回一个或多内容项──未知URI 不代表读取成功但内容为空──当前资源规范将无效或未知资源URI 归类为 JSON-RPC 无效参数,错码为`-32602`

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "error": {
    "code": -32602,
    "message": "Unknown or invalid resource URI",
    "data": {
      "uri": "notes://missing"
    }
  }
}
```

Sự phân biệt này giúp khách hàng có thể xác định rõ ràng tài nguyên không tồn tại với tài liệu trống hiệu quả, đồng thời ngăn chặn sự trở lại bất ngờ vào các tìm kiếm rộng lớn hơn.

### Tài nguyên 模板

Các mô hình tài nguyên được sử dụng để mô tả URI của một bộ phận có các yếu tố.`notes://projects/{project}/decisions/{decision}`Nói với khách hàng cách xây dựng địa chỉ hiệu quả, mà không cần phải lập một lần liệt kê tất cả các điều khoản quyết định.

模板 không có nghĩa là làm đơn giản hóa thử nghiệm. 解析变量,执行识权,强制长度与字符限制,并使用强类参数构建存储查询.

### Nội dung không phải là lệnh

Tài liệu văn bản có thể chứa ghi nhập nhanh, khóa, lệnh sai định hoặc dạng dạng xấu. Người chủ lưu trữ nên giữ nguồn theo dõi, và sẽ cung cấp tài nguyên.

## Tempt là user controls mô hình

MCP prompt 专为用户显式选择而设计──Host có thể tệp chúng thành lệnh 斜命令 (slash commands) 、菜单项或工作流按──协议本身不限于某种特定的UI表现形式──

Đối với quyền nhận cùng yêu cầu trên:`prompts/list`Các sản xuất nên là xác định. Mỗi prompt đều cần một cái tên ổn định, mô tả hữu ích, cũng như có thể để cung cấp cho máy chủ trong调用.`prompts/get`之前收集输入的参数声明。

```json
{
  "resultType": "complete",
  "prompts": [
    {
      "name": "review_note",
      "title": "Review a note",
      "description": "Review one note for a named concern",
      "arguments": [
        {
          "name": "uri",
          "description": "The note resource URI",
          "required": true
        }
      ]
    }
  ],
  "ttlMs": 600000,
  "cacheScope": "public"
}
```

`prompts/get`Sẽ phân tích các yếu tố thành một nhóm thông tin. Nó sẽ không thay thế các chỉ thị hệ thống của máy chủ.

Trong các server 边界处严格校验提示 参数。URI được trích dẫn trong thư phải qua với tài nguyên trực tiếp đọc tương tự của kiểm tra quyền nhận dạng。 Đừng để prompt  trở thành vòng qua tài nguyên  truy cập kiểm soát bên tín ngưỡng。

## 缓存提示 là một phần của chính xác

`ttlMs`Thông báo khách hàng kết quả có thể được sử dụng lâu hơn.`cacheScope`Mô tả ai có thể chia sẻ giá trị lưu trữ này.

| 范围 | 含义 | 典型用途 |
|---|---|---|
| `public` | 在鉴权许可的前提下可在多用户间复用 | 公共 prompt 目录 |
| `private` | 绑定到请求发起用户或凭证上下文 | 用户名下的私有笔记内容 |

Dựa trên tần suất thay đổi dữ liệu và thiệt hại có thể gây ra qua thời gian cũ để chọn TTL.

MCP 规范中 `cacheScope`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `public`和 `private`❖ Đối với những kết quả có chứa những bí mật nhạy cảm hoặc thay đổi rất thường xuyên, nên trả lại `cacheScope: "private"`配合 `ttlMs: 0`, sau đó áp dụng các quy tắc không- cửa hàng nghiêm ngặt hơn trong chiến lược lưu trữ ở cuối máy chủ.`no-store`本身并不是MCP 规范中的`cacheScope`取值──

缓存提示永远不能取代鉴权.缓存键必须包含所有影响可见性的请求维度,包括租户 (租户) ▌用户、权限范围 (范围) ▌语言区域 (区域) ▌本地) 以及分页游标 (页标) ▌页面标 (页面标) ▌.`private`配合 0 TTL, và thực hiện không có cửa hàng 策略。

## 订阅 sử dụng khách hàng phát triển của dòng phản ứng

Mô hình đăng ký hiện đại đã thay thế trước đây.`resources/subscribe`RPC và phiên bản cũ dựa trên HTTP GET của sự kiện端点.

Khách hàng theo quy tắc JSON-RPC yêu cầu dạng gửi `subscriptions/listen`Trong cấp độ truyền tải HTTP được phát trực tuyến, đây là một POST yêu cầu, ứng dụng HTTP của nó giữ trạng thái mở như SSE(Server-Send Events)`notifications`đối tượng là một danh sách trắng.

```json
{
  "jsonrpc": "2.0",
  "id": 17,
  "method": "subscriptions/listen",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      }
    },
    "notifications": {
      "resourcesListChanged": true,
      "promptsListChanged": true,
      "resourceSubscriptions": [
        "notes://note-1"
      ]
    }
  }
}
```

Xin nhận dạng 即为订阅 ID(Tình nhận đăng ký) ⋅ 在发送任何所要求的事件之前,服务器会发送 `notifications/subscriptions/acknowledged`Thông báo. Trong đó, các điều kiện chỉ bao gồm máy chủ.

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/subscriptions/acknowledged",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": 17
    },
    "notifications": {
      "resourcesListChanged": true,
      "resourceSubscriptions": [
        "notes://note-1"
      ]
    }
  }
}
```

Mỗi sự kiện trên dòng tiếp theo đều mang cùng một số dữ liệu:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/resources/updated",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": 17
    },
    "uri": "notes://note-1"
  }
}
```

Thông báo cho thấy tài nguyên đã thay đổi. Khách hàng trong quyền nhận dạng hiện tại bị ràng buộc thông qua.`resources/read`重新读取该资源── Khách hàng không nên giả định thông báo sự kiện tự nó chứa nội dung tài liệu mới nhất──

Nhiều người đăng ký có thể chia sẻ cùng một đoạn văn trên đường dẫn. Thẻ đăng ký cho phép khách hàng có thể thực hiện nhiều cách giải thích.`resultType: "complete"`响应.

切勿将订阅流当作协议会话(protocol session) 使用──后续的读取操作仍然是完整的独立请求,能够路由至任何健康的服务器 实例──

```figure
t3-primitive-sort
```

## 交互式实验

Sử dụng biểu đồ cho 5 khả năng trong hệ thống theo dõi dự án để phân loại: vấn đề chi tiết (chỉ số vấn đề)  tạo vấn đề (tạo vấn đề)  tạo vấn đề (tạo vấn đề)  tạo mẫu đánh giá (sample)  quy tắc dự án (strategy)  chính sách dự án (quyết định)  đóng vấn đề (close issue)  sau đó quyết định danh sách nào có thể mở để lưu trữ, những bài đọc nào phải giữ tư nhân, cũng như những nguồn lực nào đáng để cung cấp thông báo mới 

Trong mỗi phân loại, xác định chủ đề chọn của nó. Nếu được thực hiện bởi mô hình, sử dụng công cụ. Nếu host đọc theo URI tìm kiếm nội dung, sử dụng tài nguyên. Nếu được khởi động bởi người dùng, sử dụng prompt.

## 动手实验

Trong thư mục kho:

```bash
cd phases/13-tools-and-protocols/10-mcp-resources-and-prompts/code
python3 main.py
python3 -m unittest discover tests -v
```

按以下顺序检查交互记录(tác phẩm):

1. 确认 `server/discover`声明 hiện tại phiên bản của thỏa thuận và hai khả năng.
2.  xác nhận kết quả của hai cuộc khảo sát danh sách đều được sắp xếp và bao gồm `resultType: "complete"`
3. 确认列表和读取结果均带有预期缓存提示.
4. 将读取的 URI 改为 `notes://missing`Và quan sát trở lại của `-32602`错误.
5. 确认订阅 确认通知先于资源 更新事件发发.
6. 确认事件与平稳关闭均携带订阅 ID `5`

Các Python mô hình không mở HTTP thực sự kết nối. Nó mô tả SDK phải được đặt trong các miền truy vấn trong dòng phản ứng.

## 交付产物

`outputs/skill-primitive-splitter.md`là một chỉ dẫn kiểm tra thiết kế có thể sử dụng cho MCP nguyên thủy  chọn lọc. Nó hiện có thể kiểm tra xác định phát hiện, lưu trữ phạm vi, không hiệu quả URI xử lý hành vi và các thiết bị hiện đại.

本课还附带 `assets/primitive-split.svg`, cung cấp các mô hình tĩnh cho học tập trực tuyến.

## 验证 nó

```bash
cd phases/13-tools-and-protocols/10-mcp-resources-and-prompts/code
python3 main.py
python3 -m unittest discover tests -v
```

预期结果: chính chương trình xuất JSON 交互记录, test order report ít nhất 12 个通过的测试用例──

## Capstone 连接

Khi máy chủ cuối của bạn ngoài hành động  còn tiết lộ được tìm kiếm khi kiến thức, xin hãy áp dụng điều này. Nó nên chứa một danh mục xác định nhanh ảnh, một lần qua tài nguyên được ủy quyền, đọc, một lần nhanh chóng phân tích, một URI vô hiệu hóa xử lý sử dụng ví dụ và một đoạn đăng ký giao tiếp ghi lại.

Bạn có thể chứng minh: bất kỳ danh sách nào không phụ thuộc vào lịch sử liên kết, và các sự kiện đăng ký sẽ không bao giờ bị phép để tiết lộ quyền truy cập của tài nguyên cấp dưới.

## 课后练习

1. 添加一个 `notes://projects/{project}/notes/{id}`tài nguyên 模板,并 đối với hai biến đổi được kiểm tra.
2. Vì vậy`resources/list`添加分页支持, đồng thời giữ vững sự xác định của thứ tự.
3. Để một nguồn tài nguyên 设为 `cacheScope: "private"`且 `ttlMs: 0`, tăng host 级 không có cửa hàng 策略,并解释支
4. 添加快速 列表变更订阅,并证明当过条件省略 `promptsListChanged`时不会发送任何事件──
5. Tạo hai đơn đăng ký, và chứng minh mỗi sự kiện đều mang theo ID yêu cầu chính xác.
6. Để đọc trình điều khiển 添加鉴权主体(subject),并证明缓存条目无法跨主体越权复用──

## 关键术语

- **Resource：**MCP máy chủ 暴露的、通过 URI 寻址的内容──
- **Prompt：**MCP máy chủ 暴露 ⋅ bởi người dùng kiểm soát thông tin mô hình.
- **确定性列表（Deterministic list）：**针对 cùng một yêu cầu nhập, thành viên của nó và thứ tự giữ được sự phát hiện ổn định 结果──
- **`ttlMs`：**缓存新鲜度持续时间(毫秒)
- **`cacheScope`：**缓存结果的共享边界(`public`Hoặc`private`(■)
- **`subscriptions/listen`：**Một yêu cầu chu kỳ sống dài, phản ứng của nó được chuyển theo thông báo rõ ràng.
- **Subscription ID（订阅 ID）：**Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp lại: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp: Đáp:
- **无效参数（Invalid parameters）：**JSON-RPC 错误 `-32602`, được sử dụng cho nguồn tài nguyên không hiệu quả hoặc không được biết đến URI
- **不支持的协议版本（Unsupported protocol version）：**JSON-RPC 错误 `-32022`, bao gồm`supported`Với`requested`版本列表──
- **`server/discover`：**强制要求的服务器 方法,返回支持的版本、能力、服务身份识别及可选的缓存提示──

## 延伸阅读

- [MCP 2026-07-28 Resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)
- [MCP 2026-07-28 Prompts](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts)
- [MCP 2026-07-28 Subscriptions](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
- [MCP 2026-07-28 Caching](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching)
