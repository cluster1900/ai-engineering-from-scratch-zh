# 模型上下文协议(Mô hình Context Protocol, MCP)

> MCP vì AI Host đã cung cấp một hiệp định, sử dụng cho động thái phát hiện và điều chỉnh công cụ (Tools) 、 Resources (Resources) và gợi ý mô hình (Prompts) ⋅2026-07-28 修订版使该协议彻无化:能力声明与版本状态下文随着每一个请求独立传递,不再依赖连接绑定的握手──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (函数调用), Phase 11 · 03 (结构化输出)
**Time:** ~75 分钟

## Học mục tiêu

- 明确区分 MCP Host、Client、Server、传输层(Transport) với Server 原语(Primitives)
- 构建携带 MCP 2026-07-28 规范必填元数据的 JSON-RPC 请求──
- Sử dụng `server/discover`检查版本、身份与能力声明。
- Từ Công cụ, Tài nguyên và Thông báo  trả về với các loại thẻ và缓存 cảm nhận thông tin 合规结果──
- 解释现代无状态 MCP 如何与握手时代的 Legacy Server 实现双时代互操作──
- Để thiết lập các biên giới tình trạng an toàn của máy chủ, chiến lược truyền và đường thông qua nhân tạo.

## 问题背景

Các ứng dụng của bạn cần các tính năng truy vấn cơ sở dữ liệu, hoạt động lịch sử và đọc tài liệu. Nếu không có một hiệp định giao tiếp thống nhất, mỗi AI Host đều phải viết mã ghi nhớ, điều chỉnh, xử lý sai lầm, truyền và xác định độc quyền hoàn toàn giống nhau.

MCP đã gấp lại khối lượng lớn của N×M  tích hợp. Server  lộ ra các giao diện JSON-RPC tiêu chuẩn. Bất kỳ Client nào có quy định nào cũng có thể tìm thấy giao diện này.

Nhưng có một giới hạn quan trọng: MCP chịu trách nhiệm về bản thân giao thức thông tin tiêu chuẩn hóa. Nó không chịu trách nhiệm quyết định mô hình nên sử dụng các công cụ nào, không chịu trách nhiệm tự động biến nội dung không đáng tin cậy thành an toàn, cũng không sẽ tự động chuyển đổi yêu cầu không trạng thái thành trạng thái ứng dụng lâu dài.

## 核心概念

![MCP Host、无状态请求与 Server 原语](../assets/mcp-architecture.svg)

### 三大 Server 原语

1. **Tools（工具）**: 可调用动作──每个工具包含名称、描述、JSON Schema 输入约束及执行函数──
2. **Resources（资源）**: 具名且按 URI 寻址的内容,供客户 读取──
3. **Prompts（提示模板）**: có thể sử dụng cấu trúc hóa mô hình, cho Host 展现给用户。

Host 指 AI 应用程序. Một MCP Client trong Host và một Server 通信.

### 无状态请求取代 truyền thống tay cầm

MCP 2026-07-28 đã hoàn toàn di chuyển`initialize`和 `notifications/initialized`, cũng chuyển giao các phiên cấp thỏa thuận.`params._meta`Trung携带解析它所需的完整上下文:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

协议版本与客户 能力为强制必填项,客户身份为推项──缺失 `_meta`、缺少必填字段或字段类型错误均属于参数形,返回 不行参数 错误码(`-32602`◊若版本字符串合法但服务器无法支持, quay lại `UnsupportedProtocolVersionError`(`-32022`(■) Server có thể tự do xử lý bất kỳ yêu cầu có hiệu lực nào trong hoàn toàn không có hồ sơ đàm phán lịch sử.

Không trạng thái không có nghĩa là ứng dụng không thể giữ trạng thái kinh doanh. Nó chỉ có nghĩa là trạng thái không còn ẩn trong tầng dưới của MCP  kết nối hoặc `Mcp-Session-Id`Trong số đó, nếu dòng công việc cần phải xuyên qua quá trình sử dụng liên tục, bởi Server sinh ra không minh bạch của trạng thái cụ thể nắm giữ, Khách hàng trong quá trình sử dụng sau đó sẽ sử dụng nó như một công cụ thông thường 参数传入── trên mỗi yêu cầu vẫn phải kiểm tra quyền phép──

### 服务发现与版本协商

Tất cả các máy chủ hiện đại đều phải được thực hiện`server/discover`△其返回结果广播支持的协议版本、能力集合与服务器身分:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "complete",
    "supportedVersions": ["2026-07-28"],
    "capabilities": {
      "tools": {},
      "resources": {},
      "prompts": {}
    },
    "ttlMs": 3600000,
    "cacheScope": "public",
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "demo-server",
        "version": "1.0.0"
      }
    }
  }
}
```

Khách hàng cũng có thể trực tiếp sử dụng phương pháp kinh doanh và xử lý lỗi phiên bản, nhưng sử dụng phát hiện có thể làm cho khả năng hiển thị và đàm phán phiên bản rõ ràng hơn.`UnsupportedProtocolVersionError`, lỗi `-32022` Các dữ liệu 包含 `supported`(Server 支持的修订版数组) và`requested`(被拒绝的修订版)

Trong studio 模式下,双时代(double-era) Khách hàng sử dụng `server/discover`发起探测── phát hiện thành công hoặc nhận `UnsupportedProtocolVersionError`等 đã được nhận ra lỗi hiện đại, đều chứng minh đối với Server hiện đại; chỉ có lỗi không hiện đại hoặc siêu thời gian mới cho phép quay trở lại vào phiên bản cũ của 2025-11-25 `initialize`握手──Legacy 行为仅作为兼容补偿,绝不是现代默认──

### 显式的结果结构

2026-07-28  Mỗi kết quả thành công trong quy định cốt lõi đều mang theo `resultType`- Có thể là:

- `complete`:表示操作已彻底完成──
- `input_required`: cho biết Server 需要通过多轮请求模式(MRTR)发起补充交互──核心规范中只允许从 `tools/call``resources/read`Hoặc`prompts/get`Trở lại loại này.

Khách hàng phải mất`resultType`                                                                                                                                                                                                                                                              

Server 应在每个结果的`_meta`Trong chứa`io.modelcontextprotocol/serverInfo` Sự tự do của Server, chỉ dùng để hiển thị, không thể được dựa trên các quyết định an ninh.

列表和读取操作的结果还附带 `ttlMs`(毫秒生存时间) và `cacheScope`(缓存范围) ―― xác định性的 `tools/list`排序加上新鲜度提示,使 Client 能够安全缓存服务发现结果,并提升模型 Prompt Cache 的稳定性──`cacheScope: public`允许跨上下文共享缓存,`private`则严格限制发起请求的私有上下文内──

### 线缆格式与传输层

MCP trong studio hoặc Streamable HTTP 上运行 JSON-RPC 2.0:

-                                                                                                                                                                                                                                                               `jsonrpc``id``method`和 `params`
- 响应(Phản ứng): chứa相匹配的 `id`Và `result`Hoặc`error`
- 通知(Sự thông báo):无 `id`, không cần bất kỳ phản ứng nào.

现代 Streamable HTTP 暴露单个只接受 POST的端点──每个 JSON-RPC 消息应应一次独立的 POST──请求 POST 接收单个 JSON对象,或接收以最终响应结尾的请求作用域 SSE 流──被接受通知 POST 返回无响应体的 HTTP 202──本核心修订版未定义任何通过 Streamable HTTP 从客户端发送到服务器的通知──

2026-07-28 规范中**不存在**独立的 MCP GET 订阅流、DELETE 注销端点、`Mcp-Session-Id`Hoặc dựa trên`Last-Event-ID`                                                                                                                                                                                                                                                              `subscriptions/listen`POST Xin vui lòng, ứng dụng của nó giữ liên kết dài SSE 流开.

### 无需 Server 发起请求的客户端 输入

旧修订版允许服务器 通过流发送 `sampling/createMessage``roots/list`Hoặc`elicitation/create`之类的请求──当前协议改用多轮往返请求(MRTR)──符合条件的工具 调用、资源读取或快速 获取会回归 `resultType: input_required`,并至少携带`inputRequests`Hoặc`requestState`Một: Nhận dữ liệu nhập nhập cần thiết, sử dụng ID JSON-RPC mới và đối phó với`inputResponses`重试原始方法;若提供了 `requestState`,则原样回传――若没有`inputRequests`, 重试时省略 `inputResponses`

Roots、Sampling và Logging  vẫn có thể sử dụng nhưng đã bị bỏ qua, mới thực hiện không nên sử dụng chúng── hiện có Roots hoặc Sampling                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `inputRequests`Trong truyền tải, tuyệt đối không như một máy chủ độc lập đến khách hàng JSON-RPC yêu cầu.

```figure
mcp-nxm-collapse
```

## 动手构建

### 步骤 1: đăng ký Server 表面

Mặc dù yêu cầu đã thay đổi, cách đăng ký vẫn đơn giản:

```python
server = MCPServer("demo-server")

@server.tool(
    "add",
    "Add two integers.",
    {
        "type": "object",
        "properties": {
            "a": {"type": "integer"},
            "b": {"type": "integer"}
        },
        "required": ["a", "b"]
    }
)
def add(a: int, b: int) -> dict:
    return {"sum": a + b}
```

`code/main.py`Trung tâm hoàn chỉnh thực hiện cũng đăng ký một tài nguyên và một prompt. Nó cố ý chỉ sử dụng standard library, để bạn có thể xem rõ mỗi cấu trúc giao dịch, thay vì giao giao thông chi tiết cho SDK.

### 步骤 2: cho mỗi yêu cầu thêm dữ liệu

```python
def request(method, params=None):
    body_params = dict(params or {})
    body_params["_meta"] = {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientCapabilities": {},
        "io.modelcontextprotocol/clientInfo": {
            "name": "demo-client",
            "version": "1.0.0"
        }
    }
    return {
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": body_params
    }
```

Đừng chỉ đặt các dữ liệu này trong các đối tượng kết nối.

### 步骤 3: 可选) 先发现再列出

调用 `server/discover`, chọn một phiên bản được hỗ trợ, sau đó调用 `tools/list`Nếu bạn đã biết phiên bản này có thể xử lý được`-32022`, trực tiếp调用`tools/list`Cũng hợp pháp.

演示按名称顺序返回工具列表,并附带 `ttlMs``cacheScope``resultType`Với Server Identity, công cụ 调用 trả về kết quả đầy đủ nhưng không thể lưu trữ, vì sản lượng của nó có thể phụ thuộc vào trạng thái hiện tại.

### 步骤 4: Đưa cùng một yêu cầu lên HTTP

远程 `tools/call`POST  mang ảnh JSON-RPC yêu cầu của yêu cầu:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: add
```

`MCP-Protocol-Version`Các yêu cầu phải được thực hiện`_meta`Bản trung bản:`Mcp-Method`Trong mỗi JSON-RPC yêu cầu là các mục cần phải được điền, và phải được tham gia`method`Một chiều.`Mcp-Name`Chỉ là`tools/call``resources/read`Với`prompts/get`时必填,且必须与工具名、资源 URI或提示名一致.`HeaderMismatch`错误码 `-32020`

### Bước 5: Thực hiện an ninh bên ngoài trạng thái thỏa thuận

- Trong mỗi HTTP yêu cầu trên trường học
- 本地 Server  bị ràng buộc với localhost, và được phát trực tuyến HTTP 上校验 `Origin`
- 用 `destructiveHint: true`标记会修改状态的工具,并要求主持人审批──
- 显式传递目录与文件范围, chứ không phải dựa trên Roots đã bị bỏ qua
- Việc xuất khẩu tài nguyên và công cụ được coi là dữ liệu không thể tin cậy.
- stdio 下 stdout 专用于 JSON-RPC;

## 动手实践

Trong danh mục khóa học:

```bash
python3 code/main.py
cd code
python3 -m unittest discover tests -v
```

Đầu tiên xuất khẩu nên báo cáo trong thỏa thuận`2026-07-28`Tôi đã thấy rồi.`demo-server`✿ rồi nhìn ✿`MCPClient.request`Nó được xây dựng lại mỗi lần.`_meta`❖ Tẩy data từ một yêu cầu, quan sát Server  từ chối nó.

## 交付物

本课交付 `outputs/skill-mcp-server-designer.md` Nó có thể chuyển đổi một lĩnh vực kinh doanh thành một MCP không trạng thái  kế hoạch  Its acceptance requirements: find results  từng yêu cầu dữ liệu  xác định cache danh sách  rõ ràng trạng thái câu lệnh  truyền tải đầu tiên kiểm tra  ủy quyền và phê duyệt chiến lược 

## tiếp tục sâu vào hệ thống sản xuất MCP

Chương trình này dành cho bạn để xây dựng mô hình giao ước.

1. [MCP Tool Contracts 与内容](../../../13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md): bao gồm đóng cửa nhập khẩu Schema, cấu trúc nội dung, đường dẫn dữ liệu, không minh bạch phân đoạn, bổ sung quyền hạn và phân biệt giữa thỏa thuận và sai lầm kinh doanh.
2. [MCP 可靠性、取消与流控](../../../13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/docs/en.md): bao gồm yêu cầu hủy bỏ, nhiệm vụ kéo dài, hạn ngõ, thời hạn, thời hạn, thời hạn, thời hạn, thời hạn, thời hạn, thời hạn, thời hạn, thời hạn, thời hạn, thời hạn, thời hạn, thời hạn, thời hạn, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian, thời gian và thời gian.
3. [MCP Registry 供应链、准入、漂移与回滚](../../../13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md): bao gồm chứng chỉ không gian tên gọi, nguồn gốc sản phẩm, không thể thay đổi được, thực thời gian di chuyển, đăng ký trạng thái, chứng chỉ nhập cảnh và chiến lược quay lại.
4. [MCP 一致性工程](../../../13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/docs/en.md): bao gồm vàng và phản例线上报文记录(gold and negative wire transcripts) ]]

Khi máy chủ sẽ vượt qua nhóm hoặc giới hạn tin tưởng, vui lòng theo thứ tự học chúng. Chúng cùng nhau giúp bạn giữ an toàn và có thể được chẩn đoán trong suốt quá trình triển khai.

## 练习与思考

1. 添加一个 `subtract`工具, xác nhận `tools/list`仍按字母序排列──
2. 移除 protocol-version 键,验证返回 Không hiệu quả Params(`-32602`(■) Sau đó gửi theo dạng chính xác nhưng không được hỗ trợ phiên bản `2025-11-25`,验证 trở lại `-32022`, xác nhận `requested`Trở lại phiên bản sửa đổi này,`supported`中选择版本──
3. Để tạo thêm các hoạt động được tạo ra bởi máy chủ`draftId`,并 yêu cầu cập nhật hoạt động để đưa nó vào như là các tham số.
4. 让一个需要用户确认的工具返回 `input_required`❖ Sử dụng ID mới ∞`inputResponses`条目和原样 `requestState`重试原始调用, thay vì giả tạo một Server đến Client của JSON-RPC yêu cầu.
5. 设计一个双时代工作室客户端 草图:把结果或已识别的现代错误视为现代对端, chỉ trong khi gặp phải lỗi không thể识别 được hoặc quá thời gian mới cho phép quay trở lại`initialize`

## 核心专业术语

| 术语 | 通俗说法 | 实际含义 |
|------|-----------------|------------------------|
| MCP | “LLM 的工具协议” | 用于服务发现、工具、资源、提示模板与扩展的 JSON-RPC 协议 |
| Host | “AI 应用” | 拥有大模型与用户交互界面、挂载一个或多个 MCP Client 的 AI 应用程序 |
| Client | “连接器” | 代表 Host 与单个具体 Server 执行 MCP 通信的连接器组件 |
| 无状态 MCP (Stateless MCP) | “没有 Session” | 每个请求携带版本与能力元数据，不存在与底层物理连接绑定的协议状态 |
| `server/discover` | “能力探测” | 强制实现的 Server 方法，用于公布支持版本、能力集与身份标识 |
| `resultType` | “结果状态” | 把结果标记为 `complete` 或 `input_required` |
| 显式状态句柄 (State handle) | “工作流 ID” | 由 Server 签发、作为普通业务参数传递的应用层唯一标识符 |
| Streamable HTTP | “远程传输” | 单一 POST 端点架构，返回常规 JSON 或请求作用域的 SSE 响应 |
| MRTR (多轮请求模式) | “请求输入再重试” | 嵌入在响应结果中的输入请求，完成后由客户端重新发起原始操作重试 |

## 延伸阅读

- [MCP 2026-07-28 核心变更](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP 服务发现规范](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Streamable HTTP 传输规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP 多轮请求模式 (MRTR)](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 已弃用特性](https://modelcontextprotocol.io/specification/2026-07-28/deprecated)
