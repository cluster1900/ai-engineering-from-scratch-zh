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

本地开发 Server 应绑定到 `127.0.0.1`Không phải`0.0.0.0` Dịch vụ mạng phải thực hiện chứng nhận và ủy quyền trên mỗi yêu cầu;

### Đơn xin dữ liệu HTTP

Mỗi ngày POST yêu cầu bao gồm:

```http
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes_search
```

规则要求:

- `MCP-Protocol-Version`必须与 `params._meta.io.modelcontextprotocol/protocolVersion`完全一致──
- `Mcp-Method`必须与 JSON-RPC 的 `method`完全一致──
- `Mcp-Name`Trong `tools/call``resources/read`和 `prompts/get`时强制必填――
- `Mcp-Name`Đối với`params.name`(hoặc `resources/read`时的 `params.uri`(■)
- Xin lỗi về giá trị của các phân biệt.

Đối với bao gồm không phải ASCII hoặc các ký tự đặc biệt`Mcp-Name`, sử dụng tiêu chuẩn của Base64 哨兵格式:

```text
=?base64?{Base64EncodedValue}?=
```

Bất kỳ thiếu hụt  hình hoặc không phù hợp với yêu cầu của các hình ảnh, ngay lập tức quay lại HTTP `400`Với lỗi `-32020`◊ Nếu phiên bản của máy chủ không hỗ trợ phiên bản này, quay lại HTTP `400`Với lỗi `-32022`

### Các yêu cầu trong vòng ngắn

Server có thể sử dụng SSE cho một yêu cầu đơn dài hơn:

```text
POST tools/call id=41
  <- notifications/progress (针对 id=41)
  <- notifications/progress (针对 id=41)
  <- JSON-RPC response (id=41)
流关闭
```

Server 绝不能在这个流中主动向客户端发发独立的 JSON-RPC 请求.

### 长周期变更推送:`subscriptions/listen`

变更通知 phải thông qua Khách hàng 主动发起的专业 POST 请求开启:

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

POST 响应是一个长连接 SSE 流──其首条协议消息为 `notifications/subscriptions/acknowledged` Đảm nhận thông báo  Mỗi lần thay đổi thông báo tiếp theo và kết quả cuối cùng, đều trong `_meta`Trong tay`io.modelcontextprotocol/subscriptionId`, và giá trị bằng với ID của yêu cầu này.`subscriptions/listen`Và lấy lại có thể đã thay đổi dữ liệu.

### 显然的应用层状态

移除协议 Session 绝对不意味禁止有状态的工作流──Server có thể tạo ra một trạng thái không minh bạch 句柄 (State Handle) và trả lại nó trong kết quả của Tool 正常──Client trong quá trình调用 sau đó sẽ đưa ra các cụm từ này như một phần tử hiển nhiên.

Để kết nối các cụm từ với chủ đề chứng nhận, trao cho sự ngẫu nhiên và thời gian hết hạn có hiệu lực không thể đoán được, và được ủy quyền nghiêm ngặt trong mỗi lần sử dụng.

```figure
tp-transport-handshake
```

## 动手实践

`code/main.py`仅使用Python 标准库实现一个小巧、合规的现代 Streamable HTTP Server:

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
- 版本不支持时返回 `-32022` và danh sách phiên bản hỗ trợ;
- 接收的无身份通知 返回 HTTP `202`Không đáp ứng;
- GET và DELETE                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `405`-
- `subscriptions/listen`建立长连接并携带对应的订阅 ID trong thông báo

## 交付物

本课交付 `outputs/skill-mcp-transport-migrator.md` Nó cung cấp hướng dẫn quy định để di chuyển quá khứ của hiệp định`subscriptions/listen`替代裸 GET 流,并使 Legacy 适配层保持清晰独立──

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| stdio | 基于 Client 发起的子进程 stdin/stdout、以换行符分隔的 JSON-RPC 传输 |
| Streamable HTTP | 单一端点架构，其中每条现代消息均为一次全新的 HTTP POST 调用 |
| 请求作用域 SSE (Request-scoped SSE) | 针对单个请求的 POST 响应流，输出相关通知及最终响应后自动关闭 |
| `subscriptions/listen` | 客户端主动开启的长周期 POST 请求，用于接收选择订阅的变更通知 |
| 请求头不匹配 (Header mismatch) | 当镜像请求头与请求体内容不一致时，返回 HTTP 400 与 -32020 报错 |
| 源站校验 (Origin validation) | 针对传入网络连接的 DNS 重绑定防御机制，不能替代身份认证 |
| 显式状态句柄 (Explicit state handle) | 作为普通业务参数传递的应用层 Token，代替底层隐藏的传输连接状态 |
| Legacy 桥接层 (Legacy bridge) | 专门隔离保留的旧版本行为，仅用于向后兼容历史客户端 |

## 延伸阅读

- [MCP Transport Overview](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP Subscriptions](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
