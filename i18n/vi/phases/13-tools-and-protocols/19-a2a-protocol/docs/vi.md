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
  "description": "总结学术论文并草拟引用。",
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
      "name": "总结论文",
      "description": "读取论文 PDF，并生成 3 段摘要。",
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
    {"text": "总结这篇论文。"},
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
      "parts": [{"text": "总结这篇论文。"}]
    }
  }
}
```

### 不透明性保留 (khả năng giữ lại khoảng trống)

核心设计哲学: trạng thái bên trong của một đại lý được调用 là vô minh mờ. 调用方只能看到任务状态与输出艺术品;被调用者的思维链 (Tạm dịch: 调用) 内部工具 调用、子代理发发发过程对外界一律不可见.

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

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| A2A | Agent-to-Agent 协议，用于异构不透明智能体间跨系统对等协作 |
| Agent Card | 暴露于 `/.well-known/agent-card.json` 的名片，公布能力、接口与鉴权 |
| Skill | Agent 所支持的命名功能单元（类似于 MCP 中的 Tool） |
| Task | 具备独立生命周期和产物输出的异步任务委托单元 |
| Message | 承载交互内容的实体，内含纯内容字段标识的 Parts 数组 |
| Part | 仅包含 `text`、`raw`、`url` 或 `data` 之一的独立内容切片 |
| Artifact | 任务完成时产出的具名、带类型输出成果 |
| `TASK_STATE_INPUT_REQUIRED` | 当任务执行遇阻需要调用方提供补充输入时的挂起状态 |

## 延伸阅读

- [a2a-protocol.org](https://a2a-protocol.org/latest/) A2A 规范主站
- [a2aproject/A2A GitHub](https://github.com/a2aproject/A2A) 参考实现与SDK
- [A2A v1.0.1 release](https://github.com/a2aproject/A2A/tree/v1.0.1) Quy tắc và Hiệp ước Protobuf 契约
