# MCP 传输层:studio với không trạng thái Streamable HTTP

> 传输层 chịu trách nhiệm mang theo MCP 报文, nhưng nó không bao giờ cung cấp tình trạng thỏa thuận thiếu hụt.`2026-07-28`规范中,本地工作室与远程流媒体 HTTP均承载完全自描述的独立请求──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 07 与 08（构建 MCP Server 与 Client）
**Time:** ~65 分钟

## Học mục tiêu

- Vì vậy, các công trình của bạn sẽ được chọn cho các công nghệ, cho các dịch vụ mạng, cho các dịch vụ HTTP.
- 实现现代单端点、纯 POST(POST-only) của Streamable HTTP 传输协议。
- 镜像并校验 MCP 版本号、方法名与 Name 请求头与 JSON-RPC 消息体的一致性──
- Chính xác giao nộp yêu cầu vòng ngắn của vòng tròn SSE và dài của vòng tròn `subscriptions/listen`推送流──
- 迁移基于 Session 和早期 HTTP+SSE 的部署,杜绝将 Legacy 行为误当现代规范呈现──

## 问题背景

早期的流动 HTTP 修订版将协议协商与底层的连接和会议 绑定混为一谈――Server 可以发发`Mcp-Session-Id`、 tiết lộ độc lập của GET 推送流、 chấp nhận DELETE Ứng dụng để注销`Last-Event-ID`恢复 SSE 断点。

MCP `2026-07-28`Từ mạng lưới, các cơ chế này đã được loại bỏ hoàn toàn. Bất kỳ yêu cầu nào cũng có thể được phân phối cho bất kỳ người lao động nào, vì phiên bản giao thức và năng lực của khách hàng đều được đóng gói hoàn toàn trong request body.

Hệ thống được xây dựng như vậy có khả năng mở rộng横向 mạnh hơn và trí tuệ điều tra rõ ràng hơn. Điều này cũng có nghĩa là: nếu tiếp tục đưa tầng truyền thông năm 2025 như tiêu chuẩn hiện tại, chúng ta sẽ truyền tải các lỗi và mô hình an toàn.

## 核心概念

### stdio 模式

stdio 绑定专用于 Client 启动本地子进程:

- Client mỗi bước hướng đến stdin 写入一条 UTF-8 编码的 JSON-RPC 消息──
- Server 每行向 stdout 写入一条 UTF-8 编码的 JSON-RPC 消息──
- Server sẽ định hướng tất cả thông tin kiểm tra và chẩn đoán vào trong máy tính.
- Khi bạn nhận được EOF, máy chủ phải nhanh chóng xuất hiện.
- Mỗi yêu cầu hiện đại đều trong `params._meta`Trung 携带版本和能力──

进程生命周期 thuộc về chuyển tải vật lý,绝不是现代协议 Session。若子进程意外退出,中断的请求均已丢失──正确做法是重启进程、重新发现、重新列出工具、重新订阅,并仅对安全操作使用新请求 ID 发起重试──

### 2026-07-28 Trung trong Streamable HTTP

现代 Server 暴露一个单一的 MCP 端点(如 `/mcp`), và chỉ chấp nhận POST Ứng dụng

Mỗi yêu cầu hoặc thông báo JSON-RPC, đều là một POST HTTP hoàn toàn mới.

对于收到的请求,Server 返回其中一个:

- `Content-Type: application/json`: trả lại đơn vị JSON-RPC 响应;
- `Content-Type: text/event-stream`: trả lại các sự kiện thông báo liên quan đến yêu cầu, cuối cùng theo sau cuối cùng của JSON-RPC  đáp ứng.

 Đối với thông báo nhận, máy chủ  quay lại không đáp ứng `202 Accepted`

Khách hàng trong yêu cầu tuyên bố đồng thời hai phản ứng hỗ trợ:

```http
Accept: application/json, text/event-stream
```

### 纯 POST(POST-only) của đường sắt

现代 Streamable HTTP không tồn tại độc lập GET 推送端点, cũng không DELETE Session 端点:

- `GET /mcp`直接返回 `405 Method Not Allowed`
- `DELETE /mcp`直接返回 `405 Method Not Allowed`
- `Mcp-Session-Id`直接被忽视,绝不生成,绝不回显.
- `Last-Event-ID`直接被忽视,因为现代流不支持断点重放续传.

Nếu SSE của vùng ứng dụng yêu cầu 流在收到最终响应前中断,Client 视该次在途请求已丢失.

### 源站校验(Tài thực xuất xứ)

Server trong nhận được truyền vào kết nối thời gian học `Origin`Xin lỗi, nếu có một tên gọi không được phép trong danh sách, hãy quay lại.`403 Forbidden`❖ Không trình duyệt Client có thể省略 `Origin`, quy định truyền tải chính thức cho phép.

本地开发 Server 应绑定到 `127.0.0.1`Không phải tất cả các mạng kết nối. Dịch vụ mạng phải thực hiện chứng nhận và ủy quyền trên mỗi yêu cầu.

Trong hoàn thành quy định cấu hình sử dụng đúng nguồn kết hợp.`origin.startswith("https://trusted.example")`Việc kiểm tra trước không an toàn, vì nó có thể chấp nhận kiểm soát của kẻ tấn công.

### Đơn xin dữ liệu HTTP

Mỗi ngày POST yêu cầu bao gồm:

```http
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes_search
```

规则要求:

- `MCP-Protocol-Version`Vì cần phải điền, và phải đi cùng`params._meta.io.modelcontextprotocol/protocolVersion`完全一致──
- `Mcp-Method`Để hoàn thành, và phải làm việc với JSON-RPC `method`完全一致──
- `Mcp-Name`Trong `tools/call``resources/read`和 `prompts/get`时强制必填――
- `Mcp-Name`Đối với`params.name`(hoặc `resources/read`时的 `params.uri`(■)
- Đơn xin tên của bạn có giá trị phân biệt lớn, mặc dù yêu cầu tên không phân biệt lớn.

Đối với bao gồm không phải ASCII hoặc các ký tự đặc biệt`Mcp-Name`, sử dụng chính xác UTF-8 Base64 哨兵格式:

```text
=?base64?{Base64EncodedValue}?=
```

Server trong khi so sánh với yêu cầu trước khi giải mã giá trị này.

Bất kỳ thiếu hụt  hình hoặc không phù hợp với yêu cầu của các hình ảnh, ngay lập tức quay lại HTTP `400`Với lỗi `-32020`◊ Nếu phiên bản của máy chủ không hỗ trợ phiên bản này, quay lại HTTP `400`Với lỗi `-32022`,并附精确的错误数据, ví dụ:`{"supported":["2026-07-28"],"requested":"2027-01-01"}`

未知的现代方法 trả về HTTP `404`Với JSON-RPC `-32601`◊ JSON-RPC 响应体 rất quan trọng, vì hai thời đại Client phụ thuộc vào nó phân biệt lỗi hiện đại và Legacy 端点未命中――

### Các yêu cầu trong vòng ngắn

Server có thể sử dụng SSE cho một yêu cầu đơn dài hơn:

```text
POST tools/call id=41
  <- notifications/progress related to id=41
  <- notifications/progress related to id=41
  <- JSON-RPC response id=41
stream closes
```

Server 绝不能在这个流中主动向客户端发起独立的 JSON-RPC 请求;; 样本化、Elicitation与 Roots 交互使用多轮往返请求(Multi Round-Trip Request) 结果──关闭响应流即代表取消该请求──

Đừng để thêm ID SSE 事件`Last-Event-ID`恢复机制 không thuộc về现代修订版.

### 长周期变更推送:`subscriptions/listen`

变更通知 phải được thông qua yêu cầu chủ động phát hành của khách hàng, thay vì một GET độc lập:

```json
{
  "jsonrpc": "2.0",
  "id": "listen-1",
  "method": "subscriptions/listen",
  "params": {
    "notifications": {
      "toolsListChanged": true,
      "resourceSubscriptions": ["notes://note-1"]
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      }
    }
  }
}
```

POST 响应是一个长连接 SSE 流──其首条协议消息为 `notifications/subscriptions/acknowledged` Đảm nhận thông báo  Mỗi lần thay đổi thông báo tiếp theo và kết quả cuối cùng, đều trong `_meta`Trong tay`io.modelcontextprotocol/subscriptionId`, và giá trị bằng với ID của yêu cầu nghe.`subscriptions/listen`Và lấy lại có thể đã thay đổi dữ liệu.

`resources/subscribe`Với`resources/unsubscribe`属于 Legacy 时代, đừng sử dụng chúng trên các kết nối hiện đại.

### 显然的应用层状态

移除协议 Session 绝对不意味禁止有状态的工作流──Server có thể tạo ra một trạng thái không minh bạch 句柄 (State Handle) và trả lại nó trong kết quả của Tool 正常──Client trong quá trình调用 sau đó sẽ đưa ra các cụm từ này như một phần tử hiển nhiên.

Để kết nối các cụm từ với chủ đề chứng nhận, trao cho sự ngẫu nhiên và thời gian hết hạn hợp lệ không thể đoán được, và được ủy quyền nghiêm ngặt trong mỗi lần sử dụng.

Các cố tình do tình trạng ẩn tác gây ra là cơ khí:

1. Ứng dụng A đến副本 1, tạo một bản thảo trong trong trong quá trình内存.
2. 响应没有回复草稿句柄, vì thực hiện giả định kết nối tự nó có thể nhận ra草稿.
3. Xin B là một lần hoàn toàn mới POST, đã đạt được bản 2
4. 副本 2  có dữ liệu của hiệp ước hợp pháp, nhưng không thể đặt tên hoặc tải bản thảo, vì vậy công trình đã thất bại hoặc đã đọc một đối tượng địa phương sai lầm.
5. 粘性路由 (粘路由)                                                                                                                                                                                                                                                          

Biên giới chính xác bao gồm hai phần: bản ghi trên giao thức được giữ trong mỗi yêu cầu; trạng thái ứng dụng lâu dài được lưu trữ trong kho lưu trữ chung, được Server tạo và trả lại cho các câu cầm của Khách hàng như một chìa khóa.

按生命周期选择状态机制:请求内局部变量只服务单调;短暂的MRTR 续接可以使用带完整性保护的 `requestState`; bản thảo hoặc nhiệm vụ kéo dài cần phải được nắm giữ rõ ràng, thêm vào chia sẻ kéo dài, quá hạn, và kiểm soát với tính chất tương tự.

### HTTP 双时代兼容

Đồng thời hỗ trợ现代与 Legacy Server của Client 首先尝试现代 POST── nếu nhận HTTP `400``404`Hoặc`405`, nó sẽ kiểm tra phản ứng:

- 已识别的现代 JSON-RPC 错误证明 Server 是现代的── sửa đổi yêu cầu hoặc sửa đổi phiên bản của công bố đối phương
- Không phản ứng thể hoặc không thể nhận ra phản ứng có thể có nghĩa là đây là Legacy HTTP + SSE Server. Chỉ bây giờ mới thử GET 端点 cũ,并期待其 Legacy.`endpoint`Sự kiện

Trong thời gian di chuyển, Server có thể hỗ trợ hai thời đại: 携带现代元数据的请求路由到现代纯 POST 实现, đồng thời giữ lại độc lập của Legacy 端点.`2026-07-28`Một phần của nó.

```figure
tp-transport-handshake
```

## 动手实践

`code/main.py`仅使用Python 标准库实现一个有限的现代流动HTTP Server――它校验 Origin与镜像请求头,忽略已移动的Session请求头,为普通调用返回JSON,并演示一个有限的`subscriptions/listen`SSE 流──

```bash
cd code
python3 main.py --probe
python3 -m unittest discover tests -v
```

探针会依次检验:

- 非法起源会被拒绝;
- 服务发现在没有会议ID的情况下顺利完成;
- 传入的 `Mcp-Session-Id`Với`Last-Event-ID`Được bỏ qua;
- 头部与请求体不一致时返回 `-32020`-
- 版本不支持时返回 `-32022`及精确的`supported`Với`requested`số liệu;
- 接收的无身份通知 返回 HTTP `202`Không đáp ứng;
- GET và DELETE                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `405`-
- `subscriptions/listen`là một POST 响应流, thông báo xác nhận nó, thông báo thay đổi và kết quả cuối cùng đều mang theo ID đăng ký đối tác.

## 交付物

本课交付 `outputs/skill-mcp-transport-migrator.md` Nó cung cấp hướng dẫn quy định để di chuyển quá khứ của hiệp định`subscriptions/listen`替代裸 GET 流,并使 Legacy 适配层保持清晰独立──

## 练习与思考

1. Từ một POST trong chuyển nhượng`Mcp-Method`, xác nhận quay lại HTTP `400`Với sai lầm `-32020`
2. 发送请求头与请求体一致的版本 `2027-01-01`, xác nhận quay lại HTTP `400`、错误 `-32022`Và dữ liệu chính xác`{"supported":["2026-07-28"],"requested":"2027-01-01"}`
3. Vì một tài nguyên không phải ASCII  URI  gửi Base64  phái sĩ hình dạng `Mcp-Name`, xác nhận giá trị của giải mã sau`params.uri` tiến hành so sánh.
4. Trong khi đó, các công cụ này được sử dụng để tạo ra các công cụ mới.
5. Để  dụng cụ thêm các biểu thức của việc làm, buộc nó vào chủ thể ủy quyền, không phụ thuộc vào kết nối thân mật.

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| stdio | 基于 Client 发起的子进程 stdin/stdout、以换行符分隔的 JSON-RPC 传输 |
| Streamable HTTP | 单一端点架构，其中每条现代消息均为一次全新的 HTTP POST 调用 |
| 请求作用域 SSE (Request-scoped SSE) | 针对单个请求的 POST 响应流，输出相关通知及最终响应后自动关闭 |
| `subscriptions/listen` | 客户端主动开启的长周期 POST 请求，用于接收选择订阅的变更通知 |
| 请求头不匹配 (Header mismatch) | 当镜像请求头与请求体内容不一致时，返回 HTTP 400 与 -32020 报错 |
| 源站校验 (Origin validation) | 针对传入网络连接的 DNS 重绑定防御机制，不能替代身份认证 |
| 显式状态句柄 (Explicit state handle) | 作为普通业务参数传递的应用层 Token，代替隐藏的 Session 状态 |
| Legacy 桥接层 (Legacy bridge) | 专门隔离保留的旧版本行为，仅用于向后兼容历史客户端 |

## 延伸阅读

- [MCP Transport Overview](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP Subscriptions](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
- [MCP 2026-07-28 Changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
