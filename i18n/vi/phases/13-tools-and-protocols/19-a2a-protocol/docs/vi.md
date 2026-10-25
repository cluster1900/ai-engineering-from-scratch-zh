# A2A  Trưởng thành Trưởng 协议

> MCP là Agent-to-Tool (Agent-to-Agent) A2A (Agent2Agent) là Agent-to-Agent (Agent-to-Agent) Một thỏa thuận mở để cho phép các cơ quan thông minh không minh bạch được xây dựng dựa trên các khuôn khổ khác nhau để hợp tác tương tác. Google đã phát hành thỏa thuận này vào tháng 4 năm 2025, cùng tháng 6 năm đó đóng góp cho Quỹ Linux, và vào tháng 4 năm 2026 đạt v1.0, bao gồm AWS, Cisco, Microsoft, Salesforce, SAP và ServiceNow trong 150+ hỗ trợ. Nó đã hấp thụ ACP của IBM, và tăng thêm AP2 支付 mở rộng.

**Type:** Build
**Languages:** Python (stdlib, Agent Card + Task harness)
**Prerequisites:** Phase 13 · 06 (MCP 基础), Phase 13 · 08 (MCP Client)
**Time:** ~75 分钟

## Học mục tiêu

- 区分 Agent-to-Tool (MCP) và A2A (A2A)
- Trong `/.well-known/agent-card.json`发布包含技能和 `supportedInterfaces`Giấy thông tin của đại lý.
- 走通完整的任务 生命周期:`TASK_STATE_SUBMITTED``TASK_STATE_WORKING``TASK_STATE_INPUT_REQUIRED`, và kết thúc`TASK_STATE_COMPLETED``TASK_STATE_FAILED``TASK_STATE_CANCELED``TASK_STATE_REJECTED`
- 使用各 Phần  chỉ chứa `text``raw``url`Hoặc`data`Một trong những Tin nhắn,并 sử dụng Các đồ tạo vật như một sản phẩm cấu trúc

## 问题背景

Một đại lý khách hàng cần phải viết báo cáo và ủy thác cho một đại lý viết chuyên nghiệp.

- tự定义 REST API:可行, nhưng mỗi nhóm配对都 là một lần tình dục.
- 共享 Codebase: yêu cầu hai đại lý hoạt động trên cùng một khung.
- MCP: không phù hợp, MCP dùng để调用 công cụ, không thể hỗ trợ hai đại lý trong việc giữ cho các lý thuyết nội bộ không rõ ràng của mình (Opaque Reasoning) cùng lúc thực hiện đối tác tương tự.

A2A 填补空白 này. Nó sẽ giao tiếp với một đại lý khác  gửi nhiệm vụ, chứa các vòng đời rõ ràng, Thông điệp và đồ tạo.

A2A là một thỏa thuận tiêu chuẩn để tạo ra một cơ cấu giao tiếp giữa các đại lý.

## 核心概念

### Trình đại lý (智能体名片)

Mỗi đại lý phù hợp với quy định A2A sẽ được gặp tại đây .`/.well-known/agent-card.json`暴露其名片:

```json
{
  "name": "research-agent",
  "description": "Summarizes academic papers and drafts citations.",
  "version": "1.2.0",
  "supportedInterfaces": [
    {
      "url": "https://research.example.com/a2a",
      "protocolBinding": "JSONRPC",
      "protocolVersion": "1.0"
    }
  ],
  "capabilities": {"streaming": true, "pushNotifications": true},
  "securitySchemes": {
    "bearer": {"httpAuthSecurityScheme": {"scheme": "Bearer"}}
  },
  "securityRequirements": [{"schemes": {"bearer": {"list": []}}}],
  "defaultInputModes": ["text/plain"],
  "defaultOutputModes": ["text/markdown"],
  "skills": [
    {
      "id": "summarize_paper",
      "name": "Summarize a paper",
      "description": "Read a paper PDF and produce a 3-paragraph summary.",
      "tags": ["research", "summarization"],
      "inputModes": ["text/plain", "application/pdf"],
      "outputModes": ["text/markdown"]
    }
  ]
}
```

发现机制基于URL:拉取名片,选择客户所支持的第一个 `supportedInterfaces`条目,并枚举其暴露的技能──输入和输出模式均采用标准媒体类型──

### 签名 Thẻ đại lý (Tẻ đại lý được ký)

Nó có thể chứa một`signatures`Số组── mỗi条目 là một JWS (RFC 7515), nhằm mục đích loại bỏ `signatures`字段后的名片 theo RFC 8785 规范 hóa JSON 计算生成──使用方以同样方式规范化并校验签名, ngăn chặn giả giả giả──

### Nhiệm vụ  vòng đời

```text
TASK_STATE_SUBMITTED
  -> TASK_STATE_WORKING
  -> TASK_STATE_COMPLETED | TASK_STATE_FAILED | TASK_STATE_CANCELED | TASK_STATE_REJECTED

TASK_STATE_WORKING
  -> TASK_STATE_INPUT_REQUIRED
  -> TASK_STATE_WORKING (客户端发送携带相同 taskId 的补充消息)
```

Khách hàng 发起 `SendMessage`,Server  tạo nhiệm vụ  Được gọi là đại lý trong mọi trạng thái chuyển đổi; Khách hàng có thể qua`GetTask`轮询, hoặc thông qua `SendStreamingMessage`Với`SubscribeToTask` tiến hành SSE 流式监听──流式事件包含 `statusUpdate`Với`artifactUpdate`, và Thức vụ  vào trạng thái cuối cùng  đóng kết nối  Không có quy định riêng biệt `final`标志──

### Thông điệp và phần

Một条 Thông điệp 包含 `messageId``role`(`ROLE_USER`Hoặc`ROLE_AGENT`) và một hoặc nhiều phần.**仅包含一个内容字段**,该字段名称即为其类型, không còn được sử dụng `kind`判别字段:

- `text`: Pure text content──
- `raw`:文件二进制流(在 JSON 中表现为 Base64), thường đi kèm `filename`和 `mediaType`
- `url`:指向文件内容的链接──
- `data`: cấu trúc JSON 数据载荷(为被调用代理 提供结构化输入)

Ví dụ:

```json
{
  "messageId": "msg-001",
  "role": "ROLE_USER",
  "parts": [
    {"text": "Summarize this paper."},
    {"raw": "...", "filename": "paper.pdf", "mediaType": "application/pdf"},
    {"data": {"targetLength": "3 paragraphs"}, "mediaType": "application/json"}
  ]
}
```

### Các đồ tạo tác (产物)

任务输出 là các đồ tạo, chứ không phải là các chữ cái rải rác.

```json
{
  "artifactId": "art-001",
  "name": "summary",
  "parts": [{"text": "...", "mediaType": "text/markdown"}]
}
```

Các hiện vật 支持流式分块传输──每个 `artifactUpdate`事件携带产品数据以及 `append`和 `lastChunk`标志──

### 三种协议绑定(Protocol Binding)

1. **JSON-RPC 2.0 over HTTP**(`JSONRPC`):POST 用于请求,SSE 用于流.`SendMessage``SendStreamingMessage``GetTask``ListTasks``CancelTask``SubscribeToTask``CreateTaskPushNotificationConfig`Đúng vậy.
2. **gRPC**(`GRPC`): thích hợp cho môi trường nội bộ doanh nghiệp của gRPC, có tên phương pháp tương tự.
3. **HTTP+JSON/REST**(`HTTP+JSON`): Standard of REST 资源路径, ví dụ:`POST /message:send`和 `GET /tasks/{id}`

Có 3 mô hình dữ liệu kết hợp hoàn toàn.`supportedInterfaces`条目 tuyên bố đối với các loại buộc đối với nó `protocolVersion`◊ Khách hàng phải gửi trong mỗi yêu cầu `A2A-Version: 1.0`Xin lỗi, nếu không máy chủ có thể sẽ xem nó như phiên bản cũ 0.3  xử lý.

```http
POST /a2a HTTP/1.1
Host: research.example.com
Content-Type: application/json
A2A-Version: 1.0

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "SendMessage",
  "params": {
    "message": {
      "messageId": "msg-001",
      "role": "ROLE_USER",
      "parts": [{"text": "Summarize this paper."}]
    }
  }
}
```

### 不透明性保留 (khả năng giữ lại khoảng trống)

核心设计哲学: trạng thái bên trong của một đại lý được调用 là vô minh mờ. 调用方只能看到任务状态与输出艺术品;被调用者的思维链 (Tạm dịch: 调用) 内部工具 调用、子代理发发发过程对外界一律不可见.

Lý do thiết kế:A2A 让相互竞争的公司也能合作,而无需暴露各自的内部实现.A2A có thể được调用客服代理,而调用方不会因此知道该代理是如何实现该服务.

### Thời gian

- **2025-04-09.**Google phát hành A2A:
- **2025-06-23.**捐赠 cho Linux Foundation.
- **2025-08.**吸收 IBM của ACP:
- **2025-09.**AP2 扩展(Bí lệ thanh toán của đại lý) 发布。
- **2026-04.**V1.0  phát hành, nhận được sự hỗ trợ của hơn 150 tổ chức.

### Tương quan với MCP

| 维度 | MCP | A2A |
|---|---|---|
| 使用场景 | Agent-to-tool（智能体调用工具） | Agent-to-agent（智能体间对等协作） |
| 透明度 | 透明的 Tool 调用 | 不透明的内部推理与执行细节 |
| 典型调用方 | Agent Runtime | 另一个外部 Agent |
| 状态模型 | Tool 调用结果（无状态核心） | 具备完整生命周期的 Task |
| 授权鉴权 | OAuth 2.1 | Agent Card `securitySchemes` + `securityRequirements` |
| 传输层 | Stdio / Streamable HTTP | JSON-RPC / gRPC / HTTP+JSON |

Khi cần điều chỉnh các công cụ cụ cụ thể khi sử dụng MCP; khi cần giao nhiệm vụ cho một cơ thể thông minh khác khi sử dụng A2A;. trong môi trường sản xuất thường kết hợp sử dụng:

```figure
a2a-task-lifecycle
```

## 动手实践

`code/main.py`实现一个基于A2A 1.0.1 规范的轻量测试组件:写作 代理发布其名片,研究代理向其发送带有PDF部分和文本指示的 `SendMessage`Xin vui lòng; nhiệm vụ kinh nghiệm `TASK_STATE_WORKING`→ `TASK_STATE_INPUT_REQUIRED`→ `TASK_STATE_WORKING`→ `TASK_STATE_COMPLETED`, cuối cùng quay lại văn bản Artifact, sử dụng nội dung truyền tải để trực tiếp xem tập trung văn bản cấu trúc.

重点观察:

- Cơ cấu JSON của Agent Card:
- Server 端 Task ID 分配与状态转换──
- 通过内容字段自判别的部分 结构──
-  nhiệm vụ thực hiện trong suốt`TASK_STATE_INPUT_REQUIRED`分支.
- 终态时返回的 Kỹ thuật

## 交付物

本课交付 `outputs/skill-a2a-agent-spec.md` Để có thể tạo ra thẻ đại lý tiêu chuẩn JSON、Skills 声明规范及端点接入设计──

## 练习

1. 运行 `code/main.py` Theo dõi toàn bộ nhiệm vụ  vòng đời, bao gồm được gọi là đại lý `TASK_STATE_INPUT_REQUIRED`暂停.

2. Thêm một thẻ đại lý ký tên.`signatures`中放入一条 `alg`设为 `HS256`của JWS 条目, đối với bỏ đi `signatures`字段后的卡 规范化 JSON 签名──编写 một chứng thực,并 xác nhận nó trong 改卡 上验证失败──

3. 用 `SendStreamingMessage`实现任务流式传输: tác giả Agent 依次发发 `task`、三个 `artifactUpdate`分块, cũng như một带`TASK_STATE_COMPLETED`của `statusUpdate`, sau đó đóng dòng.

4. 设计一个封装 MCP Server的A2A Agent――把每个MCP Tool 映射为一个A2A Skill――记下其中的取舍:失去了哪些不透明性?

5. 阅读 A2A v1.0 phát hành thông báo, tìm ra cho đến năm 2026 năm 4 月 vẫn chưa có bất kỳ khung nào thực hiện một tính năng.

## 核心专业术语

| 术语 | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| A2A | “Agent-to-Agent 协议” | 用于不透明 Agent 协作的开放协议 |
| Agent Card | “`/.well-known/agent-card.json`” | 公开发布的元数据，描述 Agent 的 Skills 和 `supportedInterfaces` |
| Skill | “一个可调用单元” | Agent 支持的具名操作（类似于 MCP 中的 Tool） |
| Task | “委托单元” | 具有生命周期和最终 Artifact 的工作项 |
| Message | “Task 输入” | 承载 Parts（`text`、`raw`、`url`、`data`） |
| Part | “带类型的分块” | `text` / `raw` / `url` / `data` 中恰好一个，外加可选的 `mediaType`；没有 `kind` 字段 |
| Artifact | “Task 输出” | 完成时返回的具名、带类型输出 |
| AP2 | “Agent Payments Protocol” | 构建在 A2A 之上的支付扩展；Card 签名属于 A2A 核心（`signatures`） |
| Opacity | “黑盒协作” | 被调用 Agent 的内部实现对调用方隐藏 |
| `TASK_STATE_INPUT_REQUIRED` | “Task 暂停” | Agent 需要更多信息时的中断状态 |

## 延伸阅读

- [a2a-protocol.org](https://a2a-protocol.org/latest/) A2A 规范主站
- [a2aproject/A2A GitHub](https://github.com/a2aproject/A2A) 参考实现与SDK
- [A2A v1.0.1 release](https://github.com/a2aproject/A2A/tree/v1.0.1) Quy tắc và Hiệp ước Protobuf 契约
- [Linux Foundation — A2A launch press release](https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents) Xuân năm 2025 quyền quản lý chuyển giao
- [Google Cloud — A2A protocol upgrade](https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade) Đường dẫn tiến bộ đối tác
- [Google Dev — A2A 1.0 milestone](https://discuss.google.dev/t/the-a2a-1-0-milestone-ensuring-and-testing-backward-compatibility/352258) v1.0  xuất bản hướng dẫn và hướng dẫn tương thích
