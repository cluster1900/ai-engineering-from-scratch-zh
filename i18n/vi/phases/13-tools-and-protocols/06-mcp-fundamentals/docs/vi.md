# MCP 基础: Không trạng thái yêu cầu với JSON-RPC

> MCP hiện đại không nắm tay, cũng không có thỏa thuận Session. Mỗi yêu cầu phải mang theo một cách độc lập đủ dữ liệu để có thể được phân tích độc lập, ủy quyền, đường dẫn và thử lại.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 01 至 05（Tool 接口与函数调用）
**Time:** ~55 分钟

## Học mục tiêu

- 区分 MCP's Server 原语(primitives) với Client 端特性的差异──
- Đối với MCP`2026-07-28`规范构建合规的 JSON-RPC 2.0                                                                                                                                                                                                                                                        
- Trong mỗi yêu cầu, bạn có thể nhận được thông tin về khách hàng.
- Sử dụng `server/discover`并 xử lý `UnsupportedProtocolVersionError`, không cần phải bắt tay đầu nào.
- 完整追踪单个独立请求从元数据校验到返回结果的生命周期──

## 问题背景

Trong cùng một quá trình chạy hoặc HTTP Worker, MCP Server có thể tiếp tục nhận được hai yêu cầu từ các Client khác nhau, có khả năng khác nhau. Nếu Server nhớ hoặc phụ thuộc vào một yêu cầu tuyên bố trên sau, sẽ gặp sai lệch trong quy tắc quyền áp dụng, hoặc trả lại cấu trúc báo cáo không phù hợp.

MCP `2026-07-28`Quy định đã hoàn toàn loại bỏ sự khác biệt này:**协议核心完全无状态** Các máy chủ phải tự quyết định cách xử lý yêu cầu hiện tại, mà không phụ thuộc vào lịch sử kết nối.

Điều này đã thay đổi hoàn toàn mô hình tâm trí. Trình tự của thời đại cũ là: trước tiên xây dựng kết nối, sau đó thực hiện nắm tay, cuối cùng bắt đầu hoạt động kinh doanh.

1. Khách hàng gửi một yêu cầu độc lập hoàn toàn tự mô tả.
2. Server 校验该请求携带的协议版本和客户端能力──
3. Server  xử lý đối phó phương pháp:
4. Server 返回带类型标识的结果(typed result) hoặc JSON-RPC 错误──

Lời cầu xin tiếp theo sẽ bắt đầu từ zero lặp lại quá trình hoàn chỉnh này.

## 核心概念

### Server 原语(Server nguyên thủy)

MCP Server 暴露三个核心原语:

1. **Tools（工具）**:由模型驱动的操作,通过 `tools/list`发现并由 `tools/call`调用。
2. **Resources（资源）**: theo URI 寻址的数据,通过 `resources/list`发现并由 `resources/read`读取:
3. **Prompts（提示模板）**: có thể sử dụng lại, thông qua `prompts/list`发现并由 `prompts/get`染──

Roots、Sampling và Logging `2026-07-28`Trong mô hình để兼容性 được giữ lại, nhưng đã được đánh dấu rõ ràng là bị bỏ rơi (deprecated) ⋅ Trong hoàn toàn mới thực hiện, nên sử dụng hiển nhiên Tool hoặc Resource 输入替代 Roots, sử dụng trực tiếp mô hình cung cấp API 替代 Sampling, sử dụng stderr hoặc OpenTelemetry 替代 Logging。Elicitation 则通过多轮请求(Multi Round-Trip Requests, MRTR) giữ sẵn, trong đó Server 返回输入请求,Client 重新启动原始操作后输入完成。现代 Server 绝不动发起独立的 JSON-RPC 请求──

### JSON-RPC

MCP 底层 sử dụng JSON-RPC 2.0:

- Xin vui lòng:`{jsonrpc, id, method, params}`
- 响应(Phản ứng):`{jsonrpc, id, result}`Hoặc`{jsonrpc, id, error}`
- 通知(Sự thông báo):`{jsonrpc, method, params}`, không `id`字段

Trong yêu cầu`id` chỉ dùng để liên kết một lần phản ứng, sẽ không tạo ra bất kỳ phiên thỏa thuận nào.

### Đơn vị yêu cầu

Mỗi người yêu cầu hiện đại đều ở đó.`params`内部携带一个 `_meta`Đối tượng:

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/list",
  "params": {
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

协议版本号(`protocolVersion`) và năng lực của khách hàng`clientCapabilities`(Trong trường hợp này, bạn có thể làm việc với khách hàng của mình.)`clientInfo`) cho các đề xuất, thuộc về tự báo cáo và điều tra thông tin, không thể được coi là chứng minh an ninh.

Server  nghiêm cấm từ trước đó yêu cầu studio  quá trình môi trường HTTP  kết nối hoặc truyền tải tầng yêu cầu trong đầu độc lập xác định những dữ liệu này.

### 完整结果与 Server Identity

Mỗi thành công hiện đại đều có kết quả`resultType`◊ thường规的终态结果使用 `"complete"` Server cũng nên tuyên bố bản thân trong kết quả:

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "resultType": "complete",
    "tools": [],
    "ttlMs": 30000,
    "cacheScope": "public",
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "notes-server",
        "version": "1.0.0"
      }
    }
  }
}
```

`tools/list``resources/list``prompts/list``resources/templates/list``resources/read`Và `server/discover`平均为可存储结果, phải bao gồm `ttlMs`(毫秒存活时间) và `cacheScope`(缓存范围) ◦ an toàn của默认值 là `ttlMs: 0`和 `cacheScope: "private"` Các mục trong kết quả danh sách phải áp dụng thứ tự xác định tính (definitive ordering) để đảm bảo rằng các phản ứng của giá cả có thể tạo ra các khóa lưu trữ ổn định và các mô hình phù hợp trên:

### 无握手的服务发现(Khám phá mà không cần bắt tay)

Mỗi mô hình máy chủ phải được thực hiện`server/discover`❖ Khách hàng có thể sử dụng nó để có được:

- `supportedVersions`:Server 支持的协议版本列表
- `capabilities`: Server  cung cấp năng lực字典
- 可选的使用说明文档(`instructions`(văn)
- Kết quả`_meta`Trung tâm Server Identity ID
- 缓存提示`ttlMs`和 `cacheScope`(văn)

服务发现非常有用,但它不是访问的前提门禁.`tools/list`作为首个请求,因为请求本身已经完整了协议版本和客户端能力.

Nếu phiên bản yêu cầu không được hỗ trợ, Server trả lại JSON-RPC  errorcode `-32022`Không có dữ liệu:

```json
{
  "requested": "2027-01-01",
  "supported": ["2026-07-28"]
}
```

Khách hàng chọn phiên bản hợp tác của các bên, và sử dụng toàn bộ phiên bản mới của JSON-RPC  yêu cầu ID  để thử lại.

### 单次请求的完整生命周期

Xin nghiêm túc theo quy trình sau đây:

1. 解析单个 JSON-RPC Envelope──
2. 校验 `jsonrpc`字段为 `"2.0"`, tồn tại`id`- Tôi không biết.`method`为字符串, và `params`Để đối tượng.
3. 校验 `params._meta`Trong chứa các phiên bản chữ cái và khả năng đối tượng; Nếu dữ liệu bị mất tích hoặc hình thức bất hợp pháp, trả lại lỗi mã `-32602`
4. Trên đường biên giới HTTP, so với tên của phiên bản giao thức, phương pháp và đối ứng, nếu yêu cầu phù hợp với yêu cầu, hãy trả lại ngay lập tức.`-32020`(Mặc dù một trong số đó là giá trị phiên bản không được hỗ trợ)
5. Trong xác định kết hợp, nếu yêu cầu phiên bản được hỗ trợ nhưng máy chủ không phù hợp, trả về `-32022`
6. 检查所需能力, sau đó theo `method`路由并校验方法专有参数──
7. Trong cụ thể Người xử lý 执行前完成认证 (đăng bằng)
8. 返回带有 Server 身份信息的完整结果(hậu quả hoàn chỉnh)。
9. 立即遗忘当前请求作用域的协议元数据──

Sự sắp xếp nghiêm ngặt này có thể tạo ra sự hiểu biết không đồng bộ giữa các thành phần khác nhau.`Mcp-Name: notes.read`Trong khi đó, bởi nguồn của nhà máy thực hiện`params.name: notes.delete`Nó cũng cho phép các hình thức nhập, đầu thông tin混, phiên bản đàm phán, thiếu năng lực, thất bại ủy quyền và các báo cáo kinh doanh của người quản lý trở thành chứng cứ chẩn đoán phân biệt lẫn nhau.

关闭 stdin hoặc关闭 HTTP 响应连接 chỉ đại diện cho sự kết thúc của chu kỳ đời sống của truyền tải, nó sẽ không kết thúc bất kỳ giao thức Session, vì MCP hiện đại 根本不存在协议 Session.

### 显式 Legacy 兼容

`2025-11-25`及更早版本依赖 `initialize``notifications/initialized`、 kết nối kết nối khả năng, cũng như trong các phiên bản có thể chọn trong HTTP Streamable sớm.

Nhưng phải phân biệt hoàn toàn hai thời đại. Các yêu cầu hiện đại thông qua việc xác định dữ liệu của mỗi lần yêu cầu bắt buộc; các kết nối phiên bản cũ chỉ có thể được xác định thông qua các đường ngược đã được quy định bởi các tài liệu đặc biệt.**绝不能把 `initialize` 当作连接 `2026-07-28` Server 的默认行为。**

```figure
mcp-tool-call
```

## 动手实践

`code/main.py`Trong khuôn khổ không phụ thuộc vào bất kỳ khung nào, đơn thuần dựa trên các tiêu chuẩn xây dựng, thử nghiệm, theo dõi và phát hành các lệnh hành vi của MCP hiện đại:

```bash
python3 code/main.py
python3 -m unittest discover code/tests -v
```

Trong输出中重点观察三个关键不变量:

- Mỗi yêu cầu đều hoàn toàn lặp lại.`_meta`字段。
- Mỗi kết quả thành công đều bao gồm`resultType: "complete"`Không bao gồm Server ID:
- 列表结果具有严格确定性的排序,并附带显然的缓存提示(TTL 和 Cache Scope)

## 交付物

本课交付 `outputs/skill-mcp-handshake-tracer.md`Mặc dù giữ tên của các tài liệu lịch sử, nhưng hiện tại, đây là một máy theo dõi yêu cầu không có trạng thái (non-state request tracer) ◊ nó kiểm tra độc lập từng bài báo, chỉ có sự tồn tại thực sự của giao tiếp tay tay khi đánh dấu di sản tay lưu lượng.

## 练习与思考

1. 将一个请求的协议版本修改为 `2027-01-01`                                                                                                                                                                                                                                                              `-32022`, và trả lại dữ liệu 字段中正确广播了支持版本列表──
2. Từ yêu cầu thứ hai di chuyển `io.modelcontextprotocol/clientCapabilities`❖ xác nhận Server sẽ không sử dụng khả năng khai trong yêu cầu thứ nhất ❖
3. 颠倒内存中的工具注册表顺序── xác nhận `tools/list`输出 vẫn giữ nguyên một thứ tự xác định hoàn toàn giống nhau.
4. sẽ`cacheScope`Từ `public`修改为 `private` giải thích trong hai trường hợp khác nhau cho phép những gì được ủy quyền trên
5. 编写一个省略 `clientInfo`                                                                                                                                                                                                                                                              

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| 无状态协议 (Stateless protocol) | 每一个请求都自包含解析它所需的完整元数据 |
| 请求元数据 (Request metadata) | 在 `params._meta` 中携带的协议版本、Client 能力声明及推荐的 Client 身份 |
| `server/discover` | 强制实现的 Server 方法，用于声明支持版本、能力、使用说明及身份 |
| `resultType` | 每个现代成功结果上的类型鉴别字段（如 `"complete"`） |
| 可缓存结果 (Cacheable result) | 必须包含 `ttlMs` 与 `cacheScope` 提示的查询或列表结果 |
| 协议时代 (Protocol era) | 现代基于每次请求元数据的模式，或旧版连接作用域初始化的模式 |
| 传输生命周期 (Transport lifetime) | 进程、连接或响应流的物理生存周期，不等同于协议 Session |
| `-32022` | 不支持的协议版本错误码，返回请求的版本及支持的版本列表 |

## 延伸阅读

- [MCP Architecture](https://modelcontextprotocol.io/specification/2026-07-28/architecture)
- [MCP Base Protocol](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP 2026-07-28 Changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
