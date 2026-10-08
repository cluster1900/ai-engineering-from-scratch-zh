# MCP nhiệm vụ  mở rộng: xây dựng trên một trung tâm không trạng thái nhiệm vụ duy trì

> MCP không có trạng thái không có nghĩa là mọi hoạt động phải được hoàn thành trong một yêu cầu đơn lẻ.`tools/call`Trong câu trả lời, bất kỳ trường hợp nào đều có thể đáp ứng.`tasks/get`, và khách hàng của nhập thông qua `tasks/update`送达, không cần phải thức dậy bất kỳ thỏa thuận nào.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 11 (stateless MRTR), Phase 13 · 12 (elicitation)
**Time:** ~90 minutes

## Học mục tiêu

- 严格区分无状态协议传输层与持久化应用级任务状态――
- Trong mỗi yêu cầu khả năng với`server/discover`中协商 `io.modelcontextprotocol/tasks`扩展──
- Chỉ sau khi hoàn thành, quay lại bởi máy chủ chủ chủ và mang theo`resultType: "task"`của `CreateTaskResult`
- Sử dụng `tasks/get` tiến hành khảo sát, sử dụng `tasks/update`提交任务输入,并使用 `tasks/cancel`发起协作式取消──
- 彻底弃旧版中关于 `tasks/status``tasks/result`和 `tasks/list`                                                                                                                                                                                                                                                              
- 通过 POST 响应的 SSE 流使用 `subscriptions/listen`订阅可选的任务变更通知──
- Chính xác xây dựng cơ chế quá hạn nhiệm vụ, khởi động lại lại logic, nhập key, và thực hiện sai lầm.

## Tại sao nhiệm vụ là một mở rộng

Các nhiệm vụ ban đầu là tính chất cốt lõi thử nghiệm xuất hiện trong quy định 2025-11-25 规范中.`io.modelcontextprotocol/tasks`扩展中, để cho phép khách hàng và máy chủ tự chọn liệu có tham gia vào vòng đời nhiệm vụ bổ sung hay không, mà không cần phải cho tất cả các tình huống phát triển MCP 核心协议.

Mặc dù quy định mở rộng này hiện là quy định chính thức của các nhiệm vụ, nhưng nó vẫn nằm trong bản thảo (mở) trạng thái phát triển.

Khi một hoạt động có một hoặc nhiều đặc điểm sau đây, hãy sử dụng nhiệm vụ:

- 执行耗时可能超越普通请求超时值──
- 已由工作队列 (các người lao động xếp hàng) hoặc hệ thống công việc bên ngoài tiếp quản và thực hiện.
- Khách hàng cần có khả năng truy vấn phục hồi sau khi tự khởi động lại.
- 操作 trong quá trình thực hiện cần phải tạm dừng để chờ người dùng hoặc mô hình cung cấp thêm thông tin nhập vào.
- 支持取消操作与持久化结果检索是明确的产品功能需求──

Đừng tìm kiếm nhiệm vụ tạo hoạt động vì sự chắc chắn rẻ tiền.

## Không có trạng thái lõi, có trạng thái ứng dụng

MCP 2026-07-28 移除了 `initialize``notifications/initialized`、 thỏa thuận và `Mcp-Session-Id` Điều này không loại trừ các chức năng sản phẩm được xây dựng trong trạng thái.

Task id thuộc trạng thái ứng dụng hiển nhiên:

- Server 在返回任务 id 之前必须已将其持久化.
- Khách hàng có thể lưu trữ ID này lâu dài, và tái khởi động sau đó.
- ID này có thể được chuyển hướng đến bất kỳ máy chủ nào của cùng một bộ nhớ lưu trữ lâu dài.
- Mỗi lần điều chỉnh nhiệm vụ  liên quan đến phương pháp luôn phải tái kiểm tra quyền nhận định.
- 过期与清理 được xác định bởi nhiệm vụ 字段, chứ không phải bởi truyền tải tầng kết nối vòng đời.

Điều này có sự khác biệt về chất lượng ở cấp độ vận hành với trạng thái ẩn trên kết nối.

Bắt đầu giải thích rõ ràng bốn vòng đời sau:

| 状态类别 | 生命周期 | 归属位置 |
|---|---|---|
| 协议元数据 | 单次请求 | `params._meta`，在每次调用中重新校验 |
| 传输层任务 | 单个 stdio 请求或 HTTP 响应 | 具有有界超时期限的正在进行的协调器（in-flight coordinator） |
| MRTR 交互延续 | 单次重试序列 | 受完整性保护的 `requestState`，必要时叠加防重放控制 |
| 持久化任务 | 跨越请求、副本、重启与重连 | 以受权的 `taskId` 为键的共享应用程序存储 |

Việc ghi lại nhiệm vụ đơn giản duy trì lưu trữ trong bộ nhớ của một quá trình không thể biến MCP thành một giao thức trạng thái, chỉ làm cho ứng dụng trở nên vô cùng đáng tin cậy.`tasks/get`Được chuyển đến bản sao khác, sẽ không thể khôi phục lại bản ghi. Phải hoàn thành ghi lại lâu dài trước khi trả lại câu cầm, và để mỗi nhiệm vụ được phân tích cùng một phần chia sẻ dưới kiểm tra của người thuê nhà và chủ sở hữu.

## Khả năng 协商

Khách hàng trong mỗi yêu cầu thích hợp tuyên bố mở rộng hỗ trợ:

```json
{
  "_meta": {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientCapabilities": {
      "extensions": {
        "io.modelcontextprotocol/tasks": {}
      }
    },
    "io.modelcontextprotocol/clientInfo": {
      "name": "lesson-client",
      "version": "1.0.0"
    }
  }
}
```

Server từ `server/discover`Trung quay lại chính xác `supportedVersions`、capacities`ttlMs`和 `cacheScope`, và khả năng tải về mở rộng này. Vì nó tuyên bố các công cụ, do đó cũng thực hiện bắt buộc.`tools/list` Kết quả trở lại xác định`generate_report`描述符、合法的 đối tượng 类型 `inputSchema``resultType: "complete"`、 máy chủ, dữ liệu và các thông tin lưu trữ công cộng

Nếu khách hàng không tuyên bố mở rộng nhưng đã sử dụng phương pháp nhiệm vụ, máy chủ sẽ quay lại`-32021`(Mất khả năng khách hàng cần thiết),并将 `data.requiredCapabilities`设为 `{"extensions":{"io.modelcontextprotocol/tasks":{}}}` không được hỗ trợ `-32022`Không có sự xác định.`supported`Với`requested`dữ liệu; thiếu hoặc không dây phiên bản trở lại `-32602`

没有 JSON-RPC `id`Trong các lớp HTTP có thể được phát sóng, thông báo đã được nhận sẽ được trả về không chính thức.`202 Accepted`

Hiện tại, chỉ có`tools/call`支持以任务形式增强执行――请合理设计内部抽象,以便未来请求类型无需重写存储层――

## Server 主导的任务创建

旧版的客户端标志 `params._meta.task.required`已被彻底移除. Hiện tại cơ chế là: khách hàng tuyên bố hỗ trợ mở rộng này, sau đó máy chủ tự quyết định một số cụ thể.`tools/call`Có phải chuyển thành nhiệm vụ không?

Xin vui lòng:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "generate_report",
    "arguments": {"size": "large"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

响应:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "task",
    "taskId": "tsk_786512e29e0d",
    "status": "working",
    "statusMessage": "Preparing report outline.",
    "createdAt": "2026-08-21T10:30:00Z",
    "lastUpdatedAt": "2026-08-21T10:30:00Z",
    "ttlMs": 900000,
    "pollIntervalMs": 1000
  }
}
```

Cho đến khi nó đã được thực hiện.`tasks/get`解析读取之前,server 绝不能提前返回这个句柄──在最终一致性存储系统中,必须等待其具有可读可见性 (可读可见性) 阅读可见性 (可见性) 后再做应答──否则客户端 获得一个看起来合法的 id 却会立即遇到未找到的错误──

Nhiệm vụ 响应 có đặc điểm của yêu cầu không chủ động (không được yêu cầu), đó là khách hàng không rõ ràng yêu cầu vào mô hình nhiệm vụ; nhưng nó không phải là một yêu cầu không được đàm phán (không được đàm phán): yêu cầu hiện tại vẫn phải tuyên bố trước sự hỗ trợ mở rộng.

## Cấu trúc đối tượng nhiệm vụ

Mỗi nhiệm vụ đối với các đối tượng đều mang theo các đoạn sau:

- `taskId`: bởi máy chủ sinh ra của định dạng nhận dạng;
- `status`:取值为 `working``input_required``completed``cancelled`Hoặc`failed`-
- `createdAt`Với`lastUpdatedAt`:ISO 8601 时间;
- `ttlMs`: kể từ khi thành lập, thời gian qua (mm), hoặc`null`表示不声明上限;
-                    `pollIntervalMs`:server 当前建议的最小轮询间隔;
-                    `statusMessage`:Faç向用户或模型的上下文描述──

特定状態专用字段 chỉ xuất hiện trong các thời điểm liên quan:

- `input_required`包含 `inputRequests`
- `completed`包含原始请求的 `result`结构
- `failed`包含 JSON-RPC `error`Đối tượng:

Khách hàng  phải tuân thủ `pollIntervalMs`❖ Server có thể áp dụng dòng truy vấn quá kích hoạt, và có thể điều chỉnh động thái trong chu kỳ cuộc sống trong khoảng thời gian này ❖

## Sử dụng nhiệm vụ/ nhận  tiến hành khảo sát

Khách hàng yêu cầu hiện tại của nhanh照:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/get
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tasks/get",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

`tasks/get`Việc điều chỉnh RPC lần này đã hoàn thành thành công, do đó phản ứng bên ngoài của nó luôn bao gồm`resultType: "complete"` Trong khi đó, các nhiệm vụ trong bộ `status`Ừm vẫn có thể `working`Hoặc`input_required`

Sự phân biệt này có thể tránh được lỗi phân tích thường gặp:

```text
result.resultType = complete    表示 tasks/get RPC 本次调用完成
result.status = working        表示其代表的后台作业仍在运行中
```

当前规范中不存在 `tasks/result`方法──当任务 完成时,下一次 `tasks/get`响应会直接在 `result`字段内嵌原始的 字段内嵌原始的 字段内嵌原始的 字段内嵌原始的 字段内嵌原始的 字段内嵌原始的 字段内嵌原始的 字段内嵌原始的 字段内嵌原始的 字段内嵌原始的 字段内嵌原始的 字段内嵌原始的 字段内嵌原始的 字段内嵌原始的 字段内嵌原始的 字段内嵌原始的 字段内嵌原始的 字段内嵌原始的`CallToolResult`- Có thể là:

```json
{
  "resultType": "complete",
  "taskId": "tsk_786512e29e0d",
  "status": "completed",
  "createdAt": "2026-08-21T10:30:00Z",
  "lastUpdatedAt": "2026-08-21T10:34:12Z",
  "ttlMs": 900000,
  "result": {
    "resultType": "complete",
    "content": [
      {"type": "text", "text": "Generated large report with approved outline."}
    ],
    "structuredContent": {"size": "large", "approved": true},
    "isError": false,
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "tasks-demo",
        "version": "1.0.0"
      }
    }
  },
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "tasks-demo",
      "version": "1.0.0"
    }
  }
}
```

Bên ngoài tầng`resultType` 表示`tasks/get`RPC 顺利执行;内层的 `result.resultType`biểu hiện công cụ ban đầu 调用已执行完成──                                                                                                                                                                                                                                                         `CallToolResult`Cũng nên mang theo của mình.`io.modelcontextprotocol/serverInfo`; 本课将其完整保留而非存储为无类型普通载荷――

当前规范中不存在 `tasks/list` Không có máy chủ trò chuyện  không thể xác định một cách an toàn những nhiệm vụ nào nên xuất hiện trong danh sách của một phạm vi kết nối                                                                                                                                                                                                                                               

## Chuyển vào giao tiếp trong quá trình thực hiện nhiệm vụ

Các giao dịch nhập trong nhiệm vụ có vẻ giống với MRTR cốt lõi, nhưng sử dụng cơ chế tiếp tục quy trình khác nhau.

### 任务创建前所需的输入

Từ nguyên thủy`tools/call`中返回核心的 `resultType: "input_required"` Khách hàng 履行输入并重试该原始调用── chỉ sau khi kết thúc tất cả các dòng MRTR cùng bước,才创建持久化任务──

### 任务创建后所需输入

将 nhiệm vụ  trạng thái đặt `input_required`❖ Qua `tasks/get` Khám phá chưa quyết định `inputRequests`, bởi khách hàng qua`tasks/update`提交响应;; Khách hàng **不需要**重试原始的 `tools/call`

快照:

```json
{
  "resultType": "complete",
  "taskId": "tsk_786512e29e0d",
  "status": "input_required",
  "createdAt": "2026-08-21T10:30:00Z",
  "lastUpdatedAt": "2026-08-21T10:31:00Z",
  "ttlMs": 900000,
  "inputRequests": {
    "approve_outline": {
      "method": "elicitation/create",
      "params": {
        "mode": "form",
        "message": "Approve the generated report outline?",
        "requestedSchema": {
          "type": "object",
          "properties": {"approved": {"type": "boolean"}},
          "required": ["approved"]
        }
      }
    }
  }
}
```

更新:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/update
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tasks/update",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "inputResponses": {
      "approve_outline": {
        "action": "accept",
        "content": {"approved": true}
      }
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

Thành công là một sự xác nhận không có`resultType: "complete"`Vì tình trạng thay đổi có thể là kết quả nhất quán, khách hàng nên tiếp tục giữ các cuộc hỏi hoặc nghe.

Mỗi người`inputRequests`Thìa khóa trong toàn bộ nhiệm vụ trong vòng đời phải là toàn bộ các phần duy nhất.`tasks/get`快照可能会显示 cùng một khóa chưa quyết định; client端应在 UI 层进行重复, trong khi máy chủ 应忽略针对未知已覆盖或已执行的关键的响应.`input_required` trạng thái, cho đến khi tất cả các khóa cần thiết 均被作答──

## 取消操作 thuộc về协作式取消

`tasks/cancel`Sử dụng để biểu hiện ý định hủy bỏ và trở lại một không gian hoàn chỉnh 确认── 确认 không đảm bảo người lao động phía sau đã ngay lập tức dừng lại── 工作可能早已完成前一步,可能暂时忽略取消信号,或稍后才完成状态流转──

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/cancel
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tasks/cancel",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

Đối với tất cả ba nhiệm vụ này,`Mcp-Name`Xin xin ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở mặt kính ở ở mặt kính`params.taskId`, thay vì重复 JSON-RPC 方法名──`code/main.py`Trong `make_http_request`Trung thống nhất đã nhận được quy tắc này.

Người lao động trong ví dụ này sẽ ngay lập tức bị hủy bỏ, do đó làm cho việc tái调用 có tính chất tương tự.

Đừng sử dụng `notifications/cancelled`Để hủy bỏ nhiệm vụ, nhưng không phải là để xóa bỏ nhiệm vụ.

Sự phân biệt này trong đường biên giới rất quan trọng. Ứng dụng xóa nhắm vào các hoạt động JSON-RPC đơn đang được thực hiện hoặc các phản ứng HTTP trong phạm vi yêu cầu của nó.`tools/call`Đã trở lại rồi.`resultType: "task"`, cho biết yêu cầu đã kết thúc, đóng cửa các đường truyền của nó không thể chỉ định hoặc không thể chấm dứt hoạt động kéo dài.`tasks/cancel`Đó là một bản RPC mới được cấp phép.`params.taskId`, trong `Mcp-Name`Trung镜像该 id,路由到拥有该任务的后端,记录协作式取消意图,并返回确认响应而不声称工人已停止──

Vì vậy, các mạng cần phải được đặt trong bảng dữ liệu khác nhau giữa các bộ điều phối viên yêu cầu và bảng dữ liệu của các tuyến nhiệm vụ.[第 29 课：MCP 可靠性、取消与流控](../../29-mcp-reliability-cancellation-and-flow-control/docs/en.md)Sẽ sâu sắc xây dựng các quy tắc cạnh tranh, quá thời gian, etc.

## Ứng dụng

轮询 là cơ sở chuẩn bị. 期望推送更新客户可发送带有任务ID 列表的`subscriptions/listen`Trong Streamable HTTP, đây là một POST yêu cầu, nó đáp ứng với một quy mô yêu cầu của SSE 流── không có một GET 事件流 độc lập, cũng không có cần phải bảo tồn cuộc họp thỏa thuận──

Server qua`notifications/subscriptions/acknowledged`确认接受的 id 列表, sau đó có thể thông qua `notifications/tasks`发送完整的快照──确认通知与每个任务 通知都在 `_meta`Trong tay`io.modelcontextprotocol/subscriptionId`(其值等于)`subscriptions/listen`Trong khi đó, mỗi nhiệm vụ 通知都等价于此时调用 `tasks/get`Từ quay trở lại của nhanh照──

Khách hàng vẫn phải tuyên bố nhiệm vụ mở rộng. Chúng phải dựa trên việc tiếp tục và phục hồi nhiệm vụ, chứ không phải dựa vào việc tái lập hoặc tái lập.`Last-Event-ID`

## 失败语义

Xin hãy phân biệt đúng giữa hai loại sai lầm:

### 协议错误

无效的方法参数或未知任务 id sẽ trả về JSON-RPC 错误, thường là `-32602`◊ thiếu hụt mở rộng hỗ trợ trở lại `-32021`Không mang trong dữ liệu khả năng cần thiết đối với các đối tượng.

### 任务执行结果

- 带有 `isError: true`结果仍然属于 `completed`任务, vì công cụ 调用 đã xuất hiện kết quả cấu trúc được xác định của nó.
- Trong quá trình thực hiện chậm xảy ra lỗi cấp giao thức JSON-RPC để đưa nhiệm vụ vào`failed` trạng thái, và `error`字段下记录该 JSON-RPC 错误──
- Người dùng từ chối có thể tạo ra`cancelled`、 một biểu hiện từ chối kết quả đã hoàn thành, hoặc các sản phẩm an ninh cụ thể trong lĩnh vực khác.

## 持久化、过期与所有权

必须至少持久化存储任务 id、status、时间、ttl、轮询间隔、原始操作所有权、结果或错误、未决输入请求以及所有已发行输入钥匙──

 Khóa lưu trữ phải chứa hoặc có thể phân tích được người thuê nhà và chủ sở hữu có quyền.`tasks/get``tasks/update``tasks/cancel`及订阅调用中都必须核验所有权──

`ttlMs`Trong khi đó, các máy chủ có thể kiểm tra các mục tiêu đã lỗi và sau đó thực hiện thanh toán vật lý. Đừng tiếp tục công bố nó để đảm bảo kết quả đã hoàn thành trong vài milliseconds.

采用原子写入或事务机制――本课先写入临时文件再执行原子重命名――跨多副本的服务应使用共享持久化存储,并配合工人租) 租) 或等价的并发控制机制――

```figure
tp-task-lifecycle
```

## 手写实现

`code/main.py`实现一个确定性的任务服务:

- `server/discover` quay lại `supportedVersions`、缓存提示与 nhiệm vụ 扩展──
- `tools/list` quay lại xác định  có thể lưu trữ `generate_report`描述符,附带合法输入方案──
- `tools/call`Trong trở lại`resultType: "task"`之前完成任务的创建与持久化──
- Một ví dụ dịch vụ hoàn toàn mới tái tải cùng nhiệm vụ, cho thấy khả năng khởi động lại.
- `tasks/get`返回完整的任务快照──
- Người lao động từ`working` trạng thái chuyển đến `input_required`
- `tasks/update`接收表单响应并返回空的完整确认──
- Công nhân  lưu trữ内嵌的 `CallToolResult`(có chứa bản thân của mình `resultType`Với máy chủ, sau đó trạng thái chuyển sang`completed`
- 本实现中 `tasks/cancel`Có tính dục như vậy.
- HTTP  cấu trúc sẽ `tasks/get``tasks/update`和 `tasks/cancel`của `Mcp-Name`头统一设置为 `params.taskId`
- 通知助手函数使用 `notifications/subscriptions/acknowledged`Với`notifications/tasks`, 均标注有听 请求 id。
- 无 id 的通知不产生任何 JSON-RPC 响应──

Người lao động sử dụng trạng thái tiến hành rõ ràng thay vì ngủ trong đường dây sau. Điều này giúp cho mỗi trạng thái chuyển đổi có tính xác định, và sẽ làm cho các mô hình giao thức và cơ chế hàng dòng tin được phân loại rõ ràng.

## Sử dụng và vận hành

Trong thư mục kho:

```bash
cd phases/13-tools-and-protocols/13-mcp-async-tasks/code
python3 main.py
python3 -m unittest discover tests -v
```

预期结果序列:

```text
id=0 resultType=complete status=ack
id=1 resultType=task status=working
id=2 resultType=complete status=working
id=3 resultType=complete status=input_required
id=4 resultType=complete status=ack
id=5 resultType=complete status=completed
```

同时验证 trong dịch vụ hiện đại调用 `tasks/status``tasks/result`和 `tasks/list`会返回方法未找到 (方法未找到) 错误──
验证 `tools/list`具有确定性,且当前所有HTTP任务 方法均通过 `Mcp-Name`镜像其任务 id.

## 交付产物

`outputs/skill-task-store-designer.md`现已提供适应扩展的设计:包括能力 协商、返回前必须持久化(持久-前-return) 现代方法集、输入更新流、所有权隔离、过期管理、取消处理、订阅机制以及从废弃的实验性方法平稳迁移的方案──

## 课后练习

1. 增加第二未决输入键──发送包含部分字段的 `tasks/update`, chứng minh trong hai khóa 均作答完成之前, nhiệm vụ vẫn còn được giữ`input_required` trạng thái
2. Để lưu trữ quyền sở hữu của người thuê, khi người có quyền đã được xác định sai lầm xuất hiện công việc hợp pháp, nó được từ chối trực tiếp.
3. 引入带过期时间的工人租约――证明两个服务实例无法并发完成同一个任务――
4. Vì vậy`subscriptions/listen`实现 POST 响应的 SSE 适配器──切勿引入 GET 端点、`Last-Event-ID`Hoặc phiên xin lỗi
5. 增加过期清理逻辑── trong khuôn khổ không gây ra sự rò rỉ tồn tại của các nhà thuê, xác định sự phân biệt giữa nhiệm vụ đã hết hạn và nhiệm vụ hình thức sai lầm.

## 关键术语

| 术语 | 当前扩展中的含义 |
|------|----------------------------------|
| Tasks 扩展 | 用于持久化异步工作的可选 `io.modelcontextprotocol/tasks` capability |
| `CreateTaskResult` | 对符合条件请求返回的、由 server 主导的 `resultType: "task"` 响应 |
| `tasks/get` | 轮询完整的当前任务快照，包含终态结果或未决输入 |
| `tasks/update` | 针对任务当前未决的 `inputRequests` 提交响应 |
| `tasks/cancel` | 确认接收到协作式取消的意图 |
| `input_required` | 表示任务正在等待 client 提供输入的任务状态 |
| `pollIntervalMs` | Server 建议的下次轮询前的最小等待时长 |
| `ttlMs` | 自任务创建起计算的有效时长 |
| 返回前持久化（Durable-before-return） | 必须在 task id 具备可解析可读性之后才能发出其句柄的规则 |
| `notifications/tasks` | 在已订阅的 SSE 响应流上投递的可选完整任务快照 |

## 旧版兼容性

2025-11-25  Chương trình thực nghiệm đã sử dụng yêu cầu của khách hàng tăng cường`tasks/status``tasks/result`Và những lựa chọn `tasks/list` xin chỉ trong phiên bản khóa được bảo lưu 适配器中保留这些名称──现代客户端 应声明扩展能力,接收服务器 主导下发的句柄,轮询 `tasks/get`, qua `tasks/update`提交输入,并从任务快照中读取最终结果──

## 延伸阅读

- [Official MCP Tasks extension](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
