# 基于无状态协议的MCP Apps

> Kết quả giao dịch vẫn là một quá trình trao đổi công cụ MCP và tài nguyên.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 10 (resources)
**Time:** ~75 minutes

## Học mục tiêu

-  Thông qua `server/discover`Với mỗi yêu cầu mở rộng khả năng  tuyên bố và thảo luận MCP Apps。
- Trong công cụ được thực sự调用 trước, trong công cụ  định nghĩa trong tuyên bố `ui://`nguồn lực
- Trong 2026-07-28 无状态连线上返回完整的工具与资源 执行结果──
- 将 Apps  chuyên dụng `ui/initialize`桥接消息与废弃的MCP 核心握手严格区分开来来──
- 综合应用源验证 (tài thực xuất bản) 沙箱隔离 (tài thực hành) 内容安全策略 (tài thực hành) CSP (tài thực hành) với tối thiểu quyền hạn (minimum rights limit)

## 问题

Kết quả văn bản thuần túy có thể mô tả thời gian nhưng không thể cung cấp cho người dùng một thời gian động mà người dùng có thể tự do chọn, kiểm tra hoặc giao tiếp.

MCP Apps 通过引入可选的扩展规范解决界面展示难题──工具 定义直接指向一个 `ui://`nguồn lực: Người chủ có thể kiểm tra trước công cụ trước khi chạy, sẽ được rèn luyện trong iframe được hộp đựng, và thông qua JSON-RPC 桥接协议协调代理所有 app 操作.

核心协议 trong 2026-07-28 规范 đã xảy ra một sự thay đổi sâu sắc.

- Không có trung tâm`initialize`Xin vui lòng`notifications/initialized`通知:
- Không tồn tại`Mcp-Session-Id`Xin lỗi.
- Mọi yêu cầu đều ở đó.`params._meta`Trong khi đó, các ứng dụng có thể được sử dụng để cung cấp các dịch vụ.
- Server phải được thực hiện`server/discover`, để khách hàng kiểm tra phiên bản của thỏa thuận, khả năng cốt lõi và hỗ trợ mở rộng.
- Mỗi thành công đều mang lại kết quả.`resultType`判别器.
- Streamable HTTP đối với mỗi yêu cầu sử dụng đơn lần POST。 đối với các quy định hiện đại GET và DELETE vào sao nhập trực tiếp quay lại 405。

Các ứng dụng 桥接通信中仍包含名为 `ui/initialize`                                                                                                                                                                                                                                                              

## 核心概念

### Hai tầng giao ước, một tính năng hoàn chỉnh

保持清晰的分层视角:

1. MCP 核心协议承载 `server/discover``tools/list``tools/call``resources/list`Và `resources/read`
2. MCP Apps  mở rộng để khai báo UI,并定义 iframe đến host của bridge交互──
3. Các quy tắc của browser沙箱 nghiêm ngặt hạn chế các giới hạn mà UI có thể chạm vào.

扩展标识符为 `io.modelcontextprotocol/ui`◊两端均采用选择性加入(opt-in) cơ chế.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "server/discover",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/ui": {}
        }
      },
      "io.modelcontextprotocol/clientInfo": {
        "name": "timeline-host",
        "version": "1.0.0"
      }
    }
  }
}
```

`clientInfo`                                                                                                                                                                                                                                                              

### 染前发现声明

Kết quả phát hiện của Server tuyên bố ủng hộ sự mở rộng này:

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {},
    "resources": {},
    "extensions": {
      "io.modelcontextprotocol/ui": {}
    }
  },
  "ttlMs": 300000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "timeline-app-server",
      "version": "2.0.0"
    }
  }
}
```

Server phải hỗ trợ phát hiện. Nhưng khách hàng không phải phải sử dụng phát hiện trước mỗi động tác, vì mỗi động tác sẽ tự mang lại khả năng của nó.

### Trong Tool 定义中声明 UI

现代 Apps 契约在 `tools/list`Trung将 UI  bị ràng buộc vào công cụ cụ thể:

```json
{
  "name": "notes_timeline",
  "description": "Render a timeline of notes.",
  "inputSchema": {
    "type": "object",
    "properties": {}
  },
  "_meta": {
    "ui": {
      "resourceUri": "ui://notes/timeline.html"
    }
  }
}
```

Nó được thiết kế để hiển thị dữ liệu tĩnh trước khi được sử dụng. Host có thể hiển thị kết quả thực tế của việc sử dụng HTML trước khi, tải trước, lưu trữ và kiểm tra an toàn cho HTML. Mặc dù mã tính tương thích vẫn có thể chấp nhận các phím dữ liệu bình thường của phiên bản cũ, nhưng máy chủ mới được xây dựng nên thống nhất các bản kết quả.`_meta.ui.resourceUri`结构

Trong quy định cốt lõi hiện tại`tools/list`                                                                                                                                                                                                                                                              `ttlMs`Và `cacheScope`◊ Khi có sự khác biệt về công cụ có thể thấy được vì người dùng hoặc chứng chỉ, xin sử dụng `private`

### 返回数据,交由 Host 绑定视图

Công cụ 调用 trở lại nội dung thông thường và dữ liệu cấu trúc:

```json
{
  "resultType": "complete",
  "content": [
    {"type": "text", "text": "Timeline ready."}
  ],
  "structuredContent": {
    "notes": [
      {"id": "note-1", "title": "Discover", "created": "2026-07-28"}
    ]
  },
  "isError": false
}
```

Người chủ đã xác định rõ rằng công cụ này là gì để đối phó với các hình ảnh.

### 将 App 作为资源 提供服务

Vì máy chủ đã phát hiện trong tuyên bố`resources`, vì vậy phải thực hiện bắt buộc`resources/list`操作──其确定性的列表条目包含规范 URI、稳定的名称、描述以及 MIME 类型──列表结果也包含 `resultType`、 máy chủ, dữ liệu của bạn`ttlMs`和 `cacheScope`, như công cụ xác định như danh sách.

Nhà chủ 发送 `resources/read` 在 Streamable HTTP 上, yêu cầu có cấu trúc sau:

```text
POST /mcp
MCP-Protocol-Version: 2026-07-28
Mcp-Method: resources/read
Mcp-Name: ui://notes/timeline.html
```

HTTP 头字段值与 JSON-RPC 正文必须严格保持一致──若不匹配,将触发协议错误`-32020`

返回结果包含 HTML tài nguyên và缓存提示:

```json
{
  "resultType": "complete",
  "contents": [
    {
      "uri": "ui://notes/timeline.html",
      "mimeType": "text/html;profile=mcp-app",
      "text": "<!doctype html>...",
      "_meta": {
        "ui": {
          "csp": {
            "connectDomains": [],
            "resourceDomains": [],
            "frameDomains": [],
            "baseUriDomains": []
          },
          "permissions": {}
        }
      }
    }
  ],
  "ttlMs": 60000,
  "cacheScope": "public"
}
```

### Để Cáo lưu UI Resource 视作可执行内容

Tài nguyên ứng dụng và nội dung văn bản thông thường có sự khác biệt thực chất.`cacheScope`Trong trường hợp tư nhân, các khóa lưu trữ phải có quy định.`ui://`URI, thông qua các máy chủ, bản gốc và phiên bản, nguồn tài nguyên, bản tóm tắt nội dung và quyền nhận dạng trên các tài liệu bên dưới. Không cần phải sử dụng tài nguyên ứng dụng riêng tư giữa các đối tượng, bởi vì ngay cả khi URI hoàn toàn giống nhau, dữ liệu trong HTML hoặc các chiến lược của nó cũng có thể có sự khác biệt đáng kể.

Trong các trường hợp sau đây, cần phải làm mất hiệu lực các mục tiêu lưu trữ:`ttlMs`Đến thời điểm, công cụ của`_meta.ui.resourceUri`绑定发生变化、服务器 版本或准入描述符固定指纹变化,或已确认的资源变化订阅中指定该 URI──在重新挂载之前,必须重新拉取并重新进行CSP 和权限审查──过期的iframe 绝不能仅仅因为新版本的资源 尚未加载完成就继续保留更广泛的权限──

### Trong đánh giá tính chất chiến lược trước từ chối thỏa thuận

校验逻辑 có một thứ tự trước nghiêm ngặt: trước tiên kiểm tra định dạng JSON-RPC, yêu cầu bắt buộc các tính năng của dữ liệu liên kết liên kết với các loại đối tượng; sau đó kiểm tra các yêu cầu của đường dẫn có phù hợp với nội dung chính thức hay không; cuối cùng là để quyết định phiên bản của giao thức phù hợp có được hỗ trợ không.

| 异常情况 | HTTP 状态码 | JSON-RPC 错误 |
|---|---|---|
| 请求头与正文在版本、方法或名称上不一致 | 400 | `-32020` |
| 请求头与正文一致，但版本不受支持 | 400 | `-32022`，且 `data` 准确为 `{"supported":["2026-07-28"],"requested":"<实际版本>"}` |
| `resources/read` 缺少 Apps 扩展 capability | 400 | `-32021`，附带 `data.requiredCapabilities.extensions.io.modelcontextprotocol/ui` |
| 请求的方法未知 | 404 | `-32601` |

Thông báo JSON-RPC 没有 `id`, vì vậy máy chủ 绝不能为其生成 JSON-RPC 响应── đã được nhận HTTP thông báo sẽ trả lại với có trống chính văn bản ── mặc dù lỗi có thể thay đổi HTTP 状态码, nhưng vẫn không thể để thông báo 产生 JSON-RPC 错正文──

### 沙箱 là ranh giới phòng thủ, chứ không phải là tín nhiệm

Host 牢牢掌控着iframe──App 无法直接读取 host's cookie──本地存储 (本地存储) 页面 DOM── tất cả các quyền hành động đều phải được hoàn thành──

Xin hãy theo dõi các tiêu chuẩn bảo mật sau:

- Để tất cả các CSP danh sách tên miền默认置空, chỉ thêm App 真正需要的来源(origin) 』将 `connectDomains`Sử dụng để lấy, XHR và WebSocket;将 `resourceDomains`Sử dụng kịch bản, phong cách, hình ảnh và chữ.
- Trong trường hợp có thể, bao gồm mã liên kết với dữ liệu tài nguyên.
- Trừ khi các chức năng hiển thị của người dùng được xác định rõ ràng, nếu không thì không xin quyền chụp ảnh, máy bay hoặc địa lý.
- sẽ`postMessage`n nghiêm ngặt ràng buộc đến nguồn gốc chính xác của đối tượng, từ chối từ bất kỳ nguồn gốc nào khác của sự kiện.
- Để phân tích các công cụ, các thông tin, các kết quả, tài nguyên, văn bản và các thông tin liên kết
- 将用户授权同意 (user consent) được giữ lại ở bên chủ.

Đừng cố định trong các bài học`sandbox`属性直接照搬到所有主体中──Host 必须根据App's source model及其自身的隔离设计来谨慎选择沙盒标志──

允许的域名仍然属于数据外发信.`connectDomains: ["https://api.example.com"]`Có nghĩa là bất kỳ kịch bản nào được thực hiện trong ứng dụng đều có thể được gửi dữ liệu được quyền vào địa chỉ này.  Định xác nguồn gốc  phù hợp có thể phòng chống mục tiêu hỗn hợp, nhưng không thể phán quyết liệu nội dung tải trọng có được hoặc không. 默认保持连接 访问为空,避免将载体代币 放入iframe,尽可能通过主机 代理细粒操作,限制请求和响应大小,并审核究竟是哪个用户站操作触发每次出请求.`resourceDomains`Với`connectDomains`Chia sẻ; quyền tải chữ cái hoặc văn bản không nên được trao quyền chuyển dữ liệu trên bất kỳ người nào.

### Các ứng dụng 桥接通道 có chu kỳ sống độc lập

Các ứng dụng giao dịch giao tiếp được thiết lập`postMessage`之上 JSON-RPC 方言──它 có thể được trao đổi `ui/initialize`Với`ui/*`Thông báo, cũng có thể đại diện giống như các phương pháp của thỏa thuận cốt lõi ví dụ:`tools/call`(■)

View 发送带有 `appInfo`和 `appCapabilities`đối tượng`ui/initialize`✿Host  quay lại khả năng của mình với host 上下文。 chỉ trong khi nhận được phản ứng này, Xem 才会发送 `ui/notifications/initialized`✿ Người chủ phải chờ cho ứng dụng ✿ thông báo gửi đến, để có thể xem ✿ gửi tin nhắn.

Một phần mềm này đã tạo ra một cây cầu giữa một iframe và một cửa sổ chủ sở hữu. Nó không chịu trách nhiệm đàm phán phiên bản giao thức MCP, không tạo ra một trạng thái máy chủ, cũng không tạo ra một cuộc họp cấp truyền.`notifications/initialized`已被移除,而Apps 扩展中的 `ui/notifications/initialized`依然保留──通过桥梁产生的工具调用所触发的核心请求,是一个拥有全新的 JSON-RPC id 和完整的请求元数据的、自含的独立请求──

### Host 上下文、动作代理与权限撤销

Trong khi kết nối kết nối kết nối, Host vẫn giữ quyền tối cao. Xem chỉ có thể thông qua host 明确声明 khả năng để yêu cầu công cụ 动作、页导航、剪贴板 truy cập hoặc các hiệu ứng đặc quyền khác.

Để xem chủ đề, kích thước và không có rào cản thích hợp (accesibility) như là chủ nhân của động thái thay đổi trên, không phải là một lần nhập:

- 应用 host  cung cấp màu sắc và biểu tượng phát hành, và thay đổi sở thích đối với chủ đề hoặc đối với tương đối trong thực tế
- 允许 Xem lên báo cáo kích thước mong đợi của nó, nhưng bởi chủ 限制并 áp dụng iframe kích thước, ngăn chặn nội dung thoát khỏi cấu trúc hoặc xây dựng gian lận phủ lớp.
- Trong iframe  bên trong giữ các bảng điều khiển định tuyến thứ tự, có thể nhìn thấy焦点, không có trở ngại tên gọi, màn hình đọc trạng thái, đầy đủ đối số, giảm hỗ trợ và giảm động tác, giảm chuyển động, ưu tiên.
- Trong cửa sổ điều chỉnh kích thước và tái tạo, tái kiểm tra chuyển đổi trọng tâm giữa host control và View control.

Trong khi mở ứng dụng, do người dùng chuyển đổi tài khoản, thay đổi chiến lược bảo mật, máy chủ bị kiểm tra tách biệt hoặc máy chủ bị thu hẹp phạm vi quyền hạn, các khả năng liên quan có thể bị hủy bỏ.`ui/initialize`Khi quyền bị hủy bỏ, nên ngay lập tức từ chối việc khai thác quyền đặc quyền, chấm dứt không còn phù hợp với chiến lược hoạt động mạng, xóa tình trạng bị nhiễm trùng nhạy cảm, và không còn được truy cập vào tài nguyên UI tự mình khi tái cài đặt hoặc hạ xuống trở lại mô hình văn bản.

### Tăng cấp trở lại là một phần cần thiết của hiệp ước

Sơ Vân có khả năng nhận thức ứng dụng  phải vẫn có khả năng phục vụ không được tuyên bố của người chủ mở rộng UI:

- Trong `tools/list`中返回不带 `_meta.ui`- Cũng như công cụ này.
- Vì vậy`tools/call`Bảo tồn có giá trị của văn bản thông thường kết quả.
- Đối với khả năng không được khai báo của máy chủ 读取 UI `resources/read`时返回缺失能力 错误――
- Trong việc quyết định công cụ có phải thực hiện hoàn thành, tuyệt đối không giả định iframe nhất định tồn tại.

```figure
t3-ui-sandbox
```

## 手写实现

`code/main.py`Không phụ thuộc vào SDK  xây dựng một mô hình giao thức trong quá trình tinh tế.`server/discover`声明 Apps  mở rộng, liệt kê các công cụ và tài nguyên, công cụ thực hiện,并 cung cấp tài nguyên HTML tự chứa 服务。

Các mô hình nhận được đã hoàn thành phân tích chính văn bản và đường dẫn. Nó không phải là một HTTP 适配器 hoàn chỉnh, không chịu trách nhiệm phân tích.`Content-Type`Hoặc`Accept`◊ toàn bộ HTTP 适配器 được phát trực tuyến xin hãy tham khảo 课第 09 课, nó yêu cầu `Content-Type: application/json`且 `Accept`Đồng thời bao gồm`application/json`Với`text/event-stream`

运行测试:

```bash
cd phases/13-tools-and-protocols/14-mcp-apps
python3 code/main.py
python3 -m unittest discover code/tests -v
```

5 đặc điểm trung tâm trong kiểm tra xuất khẩu:

1. Mỗi lần điều chỉnh đều hoàn toàn độc lập.
2. Mỗi yêu cầu đều mang theo`_meta`khả năng.
3. `resources/list`Trong thực hiện bất kỳ tài nguyên nào 读取前均返回稳定的描述符──
4. Mỗi kết quả đều có.`resultType`Và máy chủ là dữ liệu của bạn.
5. Không có bất kỳ giao ước cốt lõi nào.

## Sử dụng và vận hành

Từ `server/discover`开始── xác nhận`io.modelcontextprotocol/ui`Hiện tại trong bảng hiển thị mở rộng của máy chủ. Sau đó, hai lần điều chỉnh trong các ứng dụng có khả năng mang hoặc không mang.`tools/list`: lần đầu tiên đáp ứng sẽ tuyên bố tài nguyên 绑定, lần thứ hai giữ cho công cụ văn bản thuần túy có thể sử dụng trực tiếp.

读取 `ui://notes/timeline.html` trong HTML 中检索 `hostOrigin`Và `event.origin`防护代码──These two lines code are proof bridgeway not adopted通配符目标(wildcard target) của ít nhất có thể chứng kiến bằng chứng.

## 交付产物

本课交付 `outputs/skill-mcp-apps-spec.md` Trước khi viết mã khung, có thể sử dụng nó để xem xét 契约. Nó bắt buộc các nhà thiết kế rõ ràng giải thích các mã trong hệ thống, mở rộng thảo luận, giảm cấp trở lại, nguồn lực UI, chiến lược lưu trữ, CSP, phạm vi quyền hạn, phương pháp kết nối và giới hạn đồng ý của người dùng.

## 课后练习

1. Để xác nhận khả năng của khách hàng  sửa đổi cho không gian`tools/list`Giữ công cụ này, nhưng di chuyển UI  nguồn lực bị ràng buộc.
2. 发送 `Mcp-Name: ui://notes/other.html`, nhưng xin xin đọc thời gian.`-32020`
3. Để sửa đổi thuộc tính lưu trữ của tài nguyên`cacheScope: private`◊ mô tả điều kiện đặc quyền của người dùng của việc phân bổ này
4. 将脚本移至`https://static.example.com/app.js`将该 nguồn gốc 添加到 `resourceDomains`Trung,并解释 do đó mang lại một loại mới của chuỗi cung ứng an toàn风险.
5. 增加一个 `notes_open`Công cụ sẽ được nhấn 点击事件路由通过主机.

## 关键术语

| 术语 | 含义 |
|------|---------|
| MCP Apps | 由 MCP host 渲染交互式 HTML 的可选扩展规范 |
| `io.modelcontextprotocol/ui` | 通信双方声明的扩展标识符 |
| `ui://` | 用于标识 App UI 模板的专用 resource scheme |
| `text/html;profile=mcp-app` | 用于 MCP App HTML 的标准 MIME 类型 |
| `server/discover` | 用于协议与 capability 发现的当前规范 RPC 方法 |
| `resources/list` | 当 server 声明支持 resources 时强制必须实现的资源枚举方法 |
| `resultType` | 现代协议规范中成功的返回结果所必须携带的判别器 |
| `ui/initialize` | Apps 桥接通道的首个请求，与已移除的核心协议握手完全独立 |
| `ui/notifications/initialized` | Apps View 在收到 host 响应后发出的就绪通知 |
| CSP | 用于限制脚本、样式、图片和网络 origin 的浏览器内容安全策略 |
| 文本降级（Text fallback） | 面向不支持 Apps 扩展的 host 所保留的 tool 基础行为 |

## 延伸阅读

- [MCP 2026-07-28 base protocol](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP Apps overview](https://modelcontextprotocol.io/extensions/apps/overview)
- [MCP Apps build guide](https://modelcontextprotocol.io/extensions/apps/build)
- [Official extension support matrix](https://modelcontextprotocol.io/extensions/client-matrix)
