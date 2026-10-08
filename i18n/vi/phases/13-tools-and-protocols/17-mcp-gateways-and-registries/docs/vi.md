# 无状态 MCP 网关与 đăng ký 准入

> 网关 nên làm cho mỗi条路由都清晰明确.2026-07-28 规范 trao cho nó phương pháp, tên, phiên bản, khả năng, nhận dạng, lưu trữ và theo dõi biên giới, mà không cần phải phụ thuộc vào bất kỳ giao thông cấp độ họp.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 15 (security), Phase 13 · 16 (authorization)
**Time:** ~75 minutes

## Học mục tiêu

- Để tập hợp nhiều máy chủ MCP trong một điểm cuối 2026-07-28, và không phụ thuộc vào cuộc họp thân mật (Sessions Affinity)
- Trong chiến lược ứng dụng hoặc chuyển phát, trước tiên xác minh từng yêu cầu dữ liệu và đầu đường.
- 依托稳定命名空间、确定性排序、描述器 锁定、RBAC 和私有缓存进行工具 合并──
- Để đăng ký  ghi nhận chứng cứ phát hiện dịch vụ, nhưng vẫn cần phải thực hiện một chiến lược nhập cảnh.
- Chính xác đường dẫn yêu cầu cấp độ tác dụng của SSE`subscriptions/listen`、MRTR 重试以及 nhiệm vụ 扩展调用──
- Để lại tay cầm và phiên  hỗ trợ với phương pháp mã hóa hiện đại để thực hiện phân biệt vật lý.

## 问题

Kết nối trực tiếp một khách hàng với một máy chủ đơn giản. Nhưng với quy mô mở rộng, môi trường sản xuất phức tạp hơn cần phải đưa ra một câu trả lời chung cho các vấn đề sau:

- 允许接入哪些服务器?
- Ứng dụng nào có thể xem và điều chỉnh công cụ cụ thể?
- Khi hai bên tiếp tục phát hiện cùng tên thì làm thế nào để xử lý?
- 如何审查描述器的后续变更?
- Các hạn chế tốc độ và các vụ kiểm toán nên được thực hiện ở đâu?
- Trong tập thể có bất kỳ trường hợp nào có thể xử lý yêu cầu đến lần sau?

网关(Gateway)充当客户端与各后端 MCP服务器 之间的中介――它对外暴露统一的 MCP端点,施加横切的安全策略,并负责转发经批准请求――

旧版网关设计往往将一个客户端会议多路复用到多后端会议 中,并对 `Mcp-Session-Id`进行重写――这纯粹属于旧版兼容设计――2026-07-28 核心协议中已经没有任何协议会议的概念――

## 概念

### 现代网关请求路径

 Đối với mỗi yêu cầu nhập cảnh:

1. Từ truyền tải cấp nhận quyền中认证请求主体(prinsial)
2. 验证 `MCP-Protocol-Version``Mcp-Method``Mcp-Name`Và `params._meta`
3. Đối với chủ đề, mục tiêu tài nguyên, sử dụng phương pháp, công cụ và các lập luận để trao quyền.
4.  ứng dụng mô tả 策略、登记 准入策略、限制流策略和数据合规策略──
5. Để kết thúc việc xây dựng một yêu cầu mới hoàn toàn tự chứa.
6. Kết quả của kết quả kiểm tra sau khi quay lại, và kết quả xử lý của các tầng kết nối trở lại với khách hàng.
7. 记录审计事件, và không cần in mật khẩu.

Tất cả các quy trình không cần bất kỳ phiên giao thức ẩn nào. Các trạng thái cấp ứng dụng vẫn có thể được duy trì tốt trong cơ sở dữ liệu.

### Chiến lược vận hành là quyết định đầu tiên của mạng

Cơ chế truy cập quyết định phiên bản sau nào có thể truy cập vào mạng lưới, nhưng nó không bao giờ đại diện cho phê duyệt một số thực tế cụ thể. Đối với mỗi yêu cầu, mạng lưới phải dựa trên các đối tượng đã được xác nhận, người phát hành và nguồn lực, người thuê nhà, phương pháp và tên gọi phù hợp, quy định tham số, mô tả đã được truy cập, chứng chỉ khóa, tình trạng sức khỏe hậu thực, khả năng giao dịch, phân loại dữ liệu, trạng lưu giới hạn, cũng như bất kỳ động thái nào được phê duyệt, tính toán lại chiến lược an ninh.

Các thứ tự ưu tiên này rất quan trọng: Registry 记录可能仍然处于有效状态,但用户角色可能已被吊销; Hash 锁定可能仍然匹配; nhưng mục tiêu参数可能已经跨越租户边界;后端服务可能依旧合规; nhưng sự cố an ninh khẩn cấp có thể đang áp dụng cho các thay đổi trạng thái.

 Đừng                                                                                                                                                                                                                                                              

### 单一 POST 端点

现代 Streamable HTTP sẽ gửi mỗi JSON-RPC 报文均通过 HTTP POST:

```text
POST /mcp
Authorization: Bearer <gateway-token>
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.search
Accept: application/json, text/event-stream
```

Đối với yêu cầu này, các mạng lưới có thể trả lại câu trả lời JSON, hoặc trả lại chỉ giới hạn trong phạm vi tác dụng của yêu cầu này.`Mcp-Session-Id`Với`Last-Event-ID`Không có bất kỳ quyền lực nào, khả năng nói chuyện và tái phát.

HTTP Header và JSON-RPC Body của giá trị phải hoàn toàn phù hợp.`-32020`错误进行拒绝──这样的负载均衡器、网关与限流器便无需完整解析 机体即可完成快速路由,同时 đảm bảo tính toàn diện của端到端──

底层报文校验遵循严格时序:JSON-RPC 及元数据类型有效性、头目与体 一致性, sau đó kiểm tra liệu phiên bản phù hợp có được hỗ trợ không;; không phù hợp trả về HTTP 400 với mã lỗi `-32020` Nếu tiêu đề và cơ thể  nhưng phiên bản không được hỗ trợ, quay lại HTTP 400 với error code `-32022`, và`data`精确为 `{"supported":["2026-07-28"],"requested":"<actual>"}`◊ Unknown Method Return HTTP 404 với error code `-32601`

`ProtocolError`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `data`,网关会将其序列化 into JSON-RPC 错误对象中──通知(Notification) vì không có `id`, vì vậy sẽ không bao giờ nhận được JSON-RPC thành công hoặc phản ứng sai lầm.

### Trong mỗi tầng đều thực hiện dịch vụ phát hiện (Discovery)

网关面向客户端实现 `server/discover`Đồng thời, các mạng cũng sẽ tìm thấy các dịch vụ thực hiện sau mỗi kết thúc, để tìm hiểu các phiên bản và khả năng của các giao thức hỗ trợ sau kết thúc và mở rộng (Extension)

网关返回的发现结果例:

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {"listChanged": true}
  },
  "ttlMs": 30000,
  "cacheScope": "private",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "enterprise-gateway",
      "version": "2.0.0"
    }
  }
}
```

Chỉ có một tuyên bố bên ngoài, nhưng kết quả của nó là không thể hỗ trợ được.

`serverInfo`纯粹是自报告的展示和调试数据, đừng coi nó là một đăng ký hoặc chứng minh tính thật của nhà phát hành.

### 逐请求的客户端 Khả năng

Mỗi yêu cầu chuyển tiếp phải mang theo những gì mới nhất.`_meta`信封:

```json
{
  "io.modelcontextprotocol/protocolVersion": "2026-07-28",
  "io.modelcontextprotocol/clientCapabilities": {},
  "io.modelcontextprotocol/clientInfo": {
    "name": "enterprise-gateway",
    "version": "1.0.0"
  }
}
```

Đừng ngơ ngơ nhìn vào khả năng của các khách hàng bên ngoài. Trong những lúc sau, các mạng chính nó là khách hàng. Chỉ cần tuyên bố rằng các mạng có thể chính xác giao dịch và xử lý các tính năng của các giao thức.

### 确定性的命名空间隔离

Các công cụ cuối cùng sẽ được hợp tác và được xác định dưới không gian đặt tên công cộng:

```text
notes.search
notes.create
issues.list
issues.open
```

维护 từ công khai名称到后端实例及原始工具 名称的映射表――绝不能按发现先后顺序随意处理重名碰撞―― công khai名称构成审批与审审审契约的一部分,变更公共名称属于 Breaking Migration――

`tools/list`Việc trả lại phải là xác định. Khi các công cụ khác nhau có thể nhìn thấy danh sách có sự khác biệt, phải trả lại.`cacheScope: private` 设定 hợp lý `ttlMs`Ưu điểm có thể giảm áp lực phát hiện dịch vụ cuối cùng, đồng thời ngăn chặn các danh sách độc quyền của người dùng vượt qua biên giới quyền bị rò rỉ.

Mỗi mô tả công cụ được phơi bày bên ngoài phải chứa một tên, mô tả và các mục tiêu như là gốc.`inputSchema`△命名空间转换绝不能剥离必需的描述符 字段──完整的列表 ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎`resultType`、 máy chủ danh tính dữ liệu và lưu trữ提示。

### 锁定已批准的描述符 (đóng)

Trong giai đoạn chuẩn bị, đối với mô tả đầy đủ  tiến hành quy định hóa xử lý và tính toán hash digest, sẽ duy trì nó tồn tại dưới tên công cộng hoàn toàn giới hạn  Trong danh sách hiển thị và phát triển调用, nghiêm ngặt so với mô tả thực thời gian với đã được phê duyệt digest

Một khi kiểm tra đến biến đổi:

- 立即将其从 `tools/list`Trung thu hoạch
- 坚决拒绝直接调用──
- 触发 an ninh kiểm tra sự kiện
- Trong khi mới được khóa, cần phải bắt buộc qua chiến lược hoặc tái phê duyệt nhân tạo.

网关 là một điểm kiểm soát tập trung mạnh mẽ, nhưng nó không thể làm cho một mô tả lần đầu tiên được nhìn thấy 凭空 trở nên an toàn.

### Registry 辅助服务发现,而非安全决策

Đăng ký của `server.json`提供软件发布元数据―― Một hồ sơ dựa trên phần mềm quản lý bao gồm thường như sau:

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
  "name": "com.example/notes",
  "description": "Example notes MCP server.",
  "version": "1.0.0",
  "packages": [
    {
      "registryType": "npm",
      "identifier": "@example/notes-mcp",
      "version": "1.0.0",
      "transport": {"type": "stdio"}
    }
  ]
}
```

Bản phát hành dữ liệu không đại diện cho các quyết định truy cập an toàn của mạng. Thông tin và nguồn gốc của nhà phát hành của chứng chỉ nên được kiểm chứng trong kho lưu trữ truy cập độc lập:

```json
{
  "registryName": "com.example/notes",
  "registryVersion": "1.0.0",
  "publisher": {"namespace": "com.example", "status": "verified"},
  "provenance": {
    "source": "registry.modelcontextprotocol.io",
    "recordId": "com.example/notes@1.0.0"
  },
  "admission": {"status": "approved", "reviewedBy": "gateway-policy"}
}
```

网关负责校验 `server.json`Các cơ cấu của nó, và kết nối với các trạng thái nhập cảnh bên ngoài.

Đối với mỗi phần sau khi được nhận, ghi lại đầy đủ:

- 精确的注册表 及记录标识符──
- 经验证的发行者命名空间或域名凭证──
- 允许使用的传输协议与端点地址──
- 锁定版本号或已批准升级策略──
- 软件制品或描述器 的哈希消化──
- 授权服务器签发者 (Emitted) với tài nguyên标识符.
- 审查 nhân viên 审核时间及过期时间──

Đừng chỉ vì tên hiển thị của một máy chủ trông giống như một sản phẩm nổi tiếng nào đó nên bạn không nên để Registry tồn tại một số ghi chép như đã qua kiểm tra bảo mật vận hành. Ngay cả khi một số máy chủ tư nhân sẽ không bao giờ xuất hiện trong Registry công khai, chúng cũng có thể thông qua mô hình chứng minh nhập tương tự để hoàn thành nhập nhập.

Bài học này đã thực hiện các kết nối dữ liệu của tầng kết nối mạng: trước khi trở nên khả thi sau đó, sẽ phát hành chứng chỉ với trạng thái nhập cảnh địa phương.[第 30 课：MCP Registry 供应链、准入、漂移与回滚](../../30-mcp-registry-supply-chain-and-drift/docs/en.md)Để xây dựng một diện tích kiểm soát hoàn chỉnh, bao gồm xác định tên không gian chứng minh, nguồn gốc của các sản phẩm phần mềm, không thể thay đổi, khóa, mô tả thời gian thực, kiểm tra di chuyển, đăng ký, trạng thái chuẩn bị, phòng chống biến đổi, và cơ chế quay lại dựa trên bằng chứng.

### 凭据中介机制(Credential Mediation)

网关 cho phép người dùng bên ngoài được xác nhận,并 độc lập với các máy chủ cuối cùng 进行身份认证;; chứng chỉ xác nhận cuối cùng không thể được tiết lộ cho khách hàng cuối cùng;;

保持以下映射绑定关系显式清晰:

```text
outer principal -> gateway role and policy
backend issuer + resource -> backend registration and token
```

Không thể chuyển giao các token kết nối mạng bên ngoài cho các bên sau. Không thể chuyển giao các token sau một bên cho các bên phát hành hoặc các nguồn khác. Nếu một công cụ cần đại diện cho việc thực hiện hoạt động của người dùng cuối cùng, nên thông qua giao dịch token được thiết kế đặc biệt hoặc các tuyên bố chuyển giao mô hình này, đừng sử dụng chứng chỉ tài khoản dịch vụ chung để nhập người dùng.

### Không phụ thuộc vào hạn chế tốc độ của phiên

根据已认证主体、发发发人、资源、公共工具 名称、成本等级以及时间窗口实施限流──协议会议 id 已不存在,即便存在也极易被轮换绕过──

Trước khi thực hiện logic kinh doanh cao, trước đó thực hiện chứng minh tính hợp pháp của tiêu thụ thấp.

### 审计 toàn bộ chuỗi quyết định

记录足以完整复现一次调用全套审计要素:

- Xin nhận dạng và liên kết theo dõi ID
- 已认证的主体与签发者──
- Công cụ công cộng 名称与最终后端路由──
- Tác giả 哈希锁定版本──
- Kết quả quyết định chiến lược và các nguyên nhân xác định.
- 响应耗时与结果类别──
- MRTR 往返轮次或任务标识符 (若适用)

Đối với các token người mang, mã quyền, mã thông báo, mã thông báo, mã thông báo chính và các yếu tố nhạy cảm không cần thiết, thực hiện các lệnh bắt buộc.

### SSE của quy mô yêu cầu

Khi một yêu cầu được thực hiện trong thời gian cần lưu lượng truyền dữ liệu, yêu cầu POST thông thường có thể trực tiếp quay lại SSE 响应 của phạm vi quy mô yêu cầu.

Đừng tạo ra một GET độc lập, cũng đừng dựa vào`Last-Event-ID`Các cơ chế tái phát. Tất cả đều thuộc về giả định của các giao ước truyền tải cũ.

### 长生命周期的变更通知

 Đối với thông báo thay đổi danh sách và tài nguyên,现代客户端通过 POST 发送 `subscriptions/listen`并接收 SSE 响应──通知过器使用平字段:`toolsListChanged``promptsListChanged``resourcesListChanged`Và `resourceSubscriptions`- Có thể là:

```json
{
  "jsonrpc": "2.0",
  "id": "listen-tools",
  "method": "subscriptions/listen",
  "params": {
    "notifications": {
      "toolsListChanged": true
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

首个事件用于确认所支持的通知子集──其订阅标识符即为启动该连接流的请求所携带的 JSON-RPC id:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/subscriptions/acknowledged",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": "listen-tools"
    },
    "notifications": {
      "toolsListChanged": true
    }
  }
}
```

网关 sau đó chỉ chuyển phát được xác nhận các loại thay đổi.`params._meta`Trong khi đó, chúng tôi cũng có thể mang theo một số hình ảnh tương tự.`io.modelcontextprotocol/subscriptionId`Không có cơ chế tự động tái lập hoặc tự động tái giám sát. Sau khi kết nối lại, khách hàng nên mở lại đăng ký và bắt đầu lấy dữ liệu danh sách phụ thuộc của mình.

现代路径彻底取代了`resources/subscribe``resources/unsubscribe`Và không yêu cầu của độc lập GET 流. Những tính năng cũ chỉ như là có phiên bản kiểm soát của phiên bản cũ vẫn còn.

### 穿透网关的 MRTR 交互

Khi trở về`resultType: input_required`时, chỉ có trong trường hợp các tuyên bố khách hàng bên ngoài hỗ trợ yêu cầu nhập cần thiết, 网关才能转向下游发发结果. trừ khi 网关 cố ý kết thúc và tái tạo quá trình giao tiếp, nếu không phải chuyển tiếp theo từng phần.`requestState`

客户端 sử dụng toàn bộ ID JSON-RPC mới với `inputResponses`重试原始公共工具──网关对重试请求重新鉴定权,校验相同的公共路径,然后构建全新的后端请求向下转发──网关绝不能假定前轮已经获得无限无限批准──

### Nhiệm vụ mở rộng 路由

Nhiệm vụ là một sự mở rộng chính thức,`io.modelcontextprotocol/tasks`Nó không phải là một thay thế cho phiên giao thức cốt lõi.

客户端在逐个请求的客户端Capacities中声明支持扩展,而网关只能在端到端保证任务生命周期时,才在发现中向外声明支持.`tools/call`, hoàn toàn là sau cùng tự quyết định trở lại kết quả thường xuyên hay không`resultType: task` Kết quả nhiệm vụ trực tiếp bao gồm`taskId``status`Thời gian`ttlMs`Và những lựa chọn `pollIntervalMs` Trước khi gửi kết quả này, trạng thái nhiệm vụ phải được duy trì và có thể đọc được.

网关                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `tasks/get``tasks/update`Và `tasks/cancel`调用均使用 `params.taskId`作为 `Mcp-Name`, cho các loại trung gian cung cấp các đường dẫn tự nhiên.`tasks/get` quay lại với trạng thái nhiệm vụ hiện tại `resultType: complete`, và vào trong thời gian cuối cùng kết quả cuối cùng hoặc thỏa thuận sai lầm.`tasks/update`发送带键名 的 `inputResponses`Để cung cấp các nhiệm vụ cần thiết chưa được đưa vào,并 quay lại không gian đầy đủ  xác nhận đáp ứng.`tasks/cancel`n biểu hiện sự hợp tác 取消意图,返回空的完整 确认响应, nhưng không đảm bảo nhiệm vụ sau đó ngay lập tức dừng lại.

Đừng thực hiện mới `tasks/list`Hoặc`tasks/result`方法, chúng thuộc về mô hình thực nghiệm cũ. 需要输入的任务通过 `tasks/get`暴露完整的内嵌请求; khách hàng thông qua `tasks/update`进行回复, thay vì thử lại cuộc gọi công cụ ban đầu.

Các hoạt động của các công ty được thực hiện theo quy định của các quy định của các quy định của các công ty.

### 向后兼容边界

Nếu mạng phải tương thích với phiên bản cũ của khách hàng hoặc cuối:

- 显式探测协议所处的时代版本──
- 将初始化握手、传输层 session、独立 GET 流、资源订阅和旧版任务 语法 hoàn toàn tách biệt trong phần mềm 适配器内部──
- 绝不能将旧版会议 id 泄露到现代路由或鉴权逻辑中。
- Ưu tiên sử dụng các dịch vụ tìm kiếm và tìm kiếm hạn chế và chiến lược quay trở lại rõ ràng, tránh sự giảm đi im lặng.

```figure
t3-gateway-funnel
```

## 动手构建

`code/main.py`实现协议网关模型和两个后端服务器在一个进程内. Mỗi后端都会接收到全新构建符合当前协议的请求. 网关完整提供服务发现,用户过的确定性.`tools/list`、 dựa trên tên không gian của đường 、Tăng ký `server.json`Các mô tả liên kết với trạng thái nhập cảnh bên ngoài  khóa  RBAC  theo giới hạn của chỉ mục chủ yếu  quyết định kiểm toán, cũng như mô phỏng `subscriptions/listen`SSE  xác nhận流程──

Mô hình nhận được các yêu cầu đã được phân tích, đường dẫn đầu với người mang đã được xác nhận. Nó không phải là một ứng dụng HTTP hoàn chỉnh, không chịu trách nhiệm phân tích.`Content-Type`Hoặc hoàn chỉnh `Accept`规范──你将其连接到第09 课的 Streamable HTTP 适配器,后者强制要求 `Content-Type: application/json`Và đồng thời bao gồm`application/json`和 `text/event-stream`của `Accept`头──

运行 nó:

```bash
cd phases/13-tools-and-protocols/17-mcp-gateways-and-registries
python3 code/main.py
python3 -m unittest discover code/tests -v
```

Ứng dụng trình bày sẽ in ra ID yêu cầu bên ngoài với ID yêu cầu cuối cùng được tạo ra mới, để trực tiếp hiển thị quá trình chuyển đổi không trạng thái.

## Sử dụng nó

Để thay thế các đối tượng cuối trong quá trình thành khách hàng giao thức hiện đại thực tế.

- 连接前检查准入记录──
- Khả năng phát hiện trước khi hoàn thành sau khi kết thúc dịch vụ phát hiện.
- 鉴权前先完成公共名称限定──
- 列表或调用前先核对描述器 哈希锁定。
- 转发前 tái cấu trúc theo yêu cầu của dữ liệu.
- 返回前校验后端执行结果──

## 交付 nó

本课交付 `outputs/skill-gateway-bootstrap.md`Nó cung cấp một bộ kế hoạch kỹ thuật hiện đại toàn diện, bao gồm lưu lượng nhập cảnh, phát hiện dịch vụ, kiểm soát quyền truy cập, đặt tên, lưu trữ, lưu trữ truyền tải, đăng ký, nghe MRTR, nhiệm vụ, quan sát và cách ly phiên bản cũ.

## 课后深练习

1. Trong các yêu cầu bên ngoài và chuyển phát yêu cầu, hãy tham gia vào các dữ liệu chia sẻ liên kết theo dõi trên các bài viết dưới đây, và ghi lại các mối quan hệ trong các sự kiện kiểm toán.
2.  Kết nối với một  có khả năng  nhiệm vụ   cuối cùng, và `Mcp-Name`中根据 nhiệm vụ id 完成 `tasks/get`Đường chính xác.
3. 刻意修改其中一个后端的描述器,验证网关的服务发现列表与直接调用是否均被拦阻阻──
4. Để có thể bổ sung khả năng máy chủ chuyên dụng cho một đối tượng cụ thể,并深入论证为什么此时服务发现结果必须保持私有缓存 (私有缓存) 
5. 编写 một di sản 适配器接口, yêu cầu trong không hướng đến hiện đại `Gateway`类中添加任何遗留状态的前提下完成兼容接入──

## 关键术语

| 术语 | 含义 |
|------|------|
| MCP 网关 | 位于客户端与后端 MCP server 之间的安全策略与路由中心 |
| 准入记录（Admission record） | 允许特定后端接入网关的完整安全证据与审批策略决策 |
| 完全限定 tool 名称 | 稳定的对外公共路由名称，如 `notes.search` |
| Descriptor 锁定（Pin） | 在服务发现和请求分发期间严格比对校验的已批准哈希 digest |
| 私有缓存作用域（Private cache） | 缓存结果严格受限于单一授权主体与上下文，禁止跨用户共享 |
| 请求级作用域 SSE | 直接挂载在单次 POST 请求上的流式响应，连接关闭即取消请求 |
| `subscriptions/listen` | 客户端通过 POST 打开的 SSE 长连接，用于监听特定的列表变更通知 |
| 任务路由（Task route） | 将不透明的 taskId 映射到具体后端的应用层状态映射 |
| Legacy 适配器 | 带有明确版本门禁的隔离层，用于兼容旧版握手与 session 机制 |

## 延伸阅读

- [Streamable HTTP 传输协议规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [服务发现（Server Discovery）规范](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [官方 Registry server.json 规范与要求](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/official-registry-requirements.md)
- [MCP Tasks 扩展规范草案](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
