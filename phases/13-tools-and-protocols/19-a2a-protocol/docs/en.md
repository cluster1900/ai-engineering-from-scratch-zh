# A2A — Agent-to-Agent 协议

> MCP 是 Agent-to-Tool（智能体与工具交互）。A2A (Agent2Agent) 则是 Agent-to-Agent（智能体与智能体交互）—— 一个用于让基于不同框架构建的不透明智能体进行互操作协作的开放协议。Google 于 2025 年 4 月发布该协议，同年 6 月捐赠给 Linux Foundation，并于 2026 年 4 月达到 v1.0，拥有包括 AWS、Cisco、Microsoft、Salesforce、SAP 和 ServiceNow 在内的 150+ 支持方。它吸收了 IBM 的 ACP，并新增了 AP2 支付扩展。本课结合 A2A 1.0.1 线缆命名规范，详解 Agent Card、Task 生命周期以及三种协议绑定。

**Type:** Build
**Languages:** Python (stdlib, Agent Card + Task harness)
**Prerequisites:** Phase 13 · 06 (MCP 基础), Phase 13 · 08 (MCP Client)
**Time:** ~75 分钟

## 学习目标

- 区分 Agent-to-Tool (MCP) 与 Agent-to-Agent (A2A) 的应用场景。
- 在 `/.well-known/agent-card.json` 发布包含 Skills 和 `supportedInterfaces` 元数据的 Agent Card。
- 走通完整的 Task 生命周期：`TASK_STATE_SUBMITTED`、`TASK_STATE_WORKING`、`TASK_STATE_INPUT_REQUIRED`，以及终态 `TASK_STATE_COMPLETED`、`TASK_STATE_FAILED`、`TASK_STATE_CANCELED`、`TASK_STATE_REJECTED`。
- 使用各 Part 仅包含 `text`、`raw`、`url` 或 `data` 之一的 Messages，并使用 Artifacts 作为结构化产物输出。

## 问题背景

一个客服 Agent 需要把报告撰写委托给一个专门的写作 Agent。在 A2A 出现之前的选项：

- 自定义 REST API：可行，但每一组配对都是一次性的。
- 共享 Codebase：要求两个 Agent 运行在同一个框架上。
- MCP：不适合，MCP 用于调用工具，无法支持两个 Agent 在保留各自不透明内部推理（Opaque Reasoning）的同时进行对等协作。

A2A 填补了这一空白。它将交互抽象为一个 Agent 向另一个 Agent 发送 Task，包含显式生命周期、Messages 和 Artifacts。被调用 Agent 的内部状态保持不透明——调用方只能看到 Task 状态流转和最终输出。

A2A 是“让跨框架 Agent 相互对话”的标准协议。它不是要取代 MCP，两者是互补协作的关系。

## 核心概念

### Agent Card（智能体名片）

每个符合 A2A 规范的 Agent 都会在 `/.well-known/agent-card.json` 暴露其名片：

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

发现机制基于 URL：拉取名片，选择 Client 所支持的第一个 `supportedInterfaces` 条目，并枚举其暴露的 Skills。输入和输出模式均采用标准 Media Types。

### 签名 Agent Card（Signed Agent Cards）

名片可以包含一个 `signatures` 数组。每个条目都是一个 JWS (RFC 7515)，针对去除 `signatures` 字段后的名片按 RFC 8785 规范化 JSON 计算生成。使用方以同样方式规范化并校验签名，防止假冒伪造。

### Task 生命周期

```text
TASK_STATE_SUBMITTED
  -> TASK_STATE_WORKING
  -> TASK_STATE_COMPLETED | TASK_STATE_FAILED | TASK_STATE_CANCELED | TASK_STATE_REJECTED

TASK_STATE_WORKING
  -> TASK_STATE_INPUT_REQUIRED
  -> TASK_STATE_WORKING (客户端发送携带相同 taskId 的补充消息)
```

Client 发起 `SendMessage`，Server 创建 Task。被调用的 Agent 在各状态间流转；Client 可通过 `GetTask` 轮询，或通过 `SendStreamingMessage` 与 `SubscribeToTask` 进行 SSE 流式监听。流式事件包含 `statusUpdate` 与 `artifactUpdate`，并在 Task 进入终态时关闭连接。规范中没有单独的 `final` 标志。

### Messages 与 Parts

一条 Message 包含 `messageId`、`role`（`ROLE_USER` 或 `ROLE_AGENT`）以及一个或多个 Parts。每个 Part **仅包含一个内容字段**，该字段名称即为其类型，不再使用 `kind` 判别字段：

- `text`：纯文本内容。
- `raw`：文件二进制流（在 JSON 中表现为 Base64），通常伴随 `filename` 和 `mediaType`。
- `url`：指向文件内容的链接。
- `data`：结构化 JSON 数据载荷（为被调用 Agent 提供的结构化输入）。

示例：

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

### Artifacts（产物）

任务输出是 Artifacts，而不是松散的字符串。Artifact 是具名、带类型的结构化产物：

```json
{
  "artifactId": "art-001",
  "name": "summary",
  "parts": [{"text": "...", "mediaType": "text/markdown"}]
}
```

Artifacts 支持流式分块传输。每个 `artifactUpdate` 事件携带产物数据以及 `append` 和 `lastChunk` 标志。

### 三种协议绑定（Protocol Bindings）

1. **JSON-RPC 2.0 over HTTP** (`JSONRPC`)：POST 用于请求，SSE 用于流。方法名采用大驼峰 PascalCase：`SendMessage`、`SendStreamingMessage`、`GetTask`、`ListTasks`、`CancelTask`、`SubscribeToTask`、`CreateTaskPushNotificationConfig` 等。
2. **gRPC** (`GRPC`)：适用于原生支持 gRPC 的企业内部环境，具有相同的方法名。
3. **HTTP+JSON/REST** (`HTTP+JSON`)：标准的 REST 资源路径，如 `POST /message:send` 和 `GET /tasks/{id}`。

三种绑定共享完全一致的数据模型。每个 `supportedInterfaces` 条目声明对应的绑定类型与其 `protocolVersion`。Client 必须在每个请求中发送 `A2A-Version: 1.0` 请求头，否则 Server 可能会将其视作旧版 0.3 处理。

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

### 不透明性保留（Opacity Preservation）

核心设计哲学：被调用 Agent 的内部状态是高度不透明的。调用方只能看到 Task 状态与输出 Artifacts；被调者的思维链（Chain-of-Thought）、内部 Tool 调用、子 Agent 派发过程对外界一律不可见。这与 MCP 的 Tool 调用必须完全透明暴露有着根本区别。

设计理由：A2A 让相互竞争的公司也能协作，而无需暴露各自的内部实现。A2A 可以是“调用这个客服 Agent”，而调用方并不会因此得知那个 Agent 是如何实现这项服务的。

### 时间线

- **2025-04-09.** Google 发布 A2A。
- **2025-06-23.** 捐赠给 Linux Foundation。
- **2025-08.** 吸收 IBM 的 ACP。
- **2025-09.** AP2 扩展（Agent Payments）发布。
- **2026-04.** v1.0 发布，获得 150 多家组织支持。

### 与 MCP 的关系对比

| 维度 | MCP | A2A |
|---|---|---|
| 使用场景 | Agent-to-tool（智能体调用工具） | Agent-to-agent（智能体间对等协作） |
| 透明度 | 透明的 Tool 调用 | 不透明的内部推理与执行细节 |
| 典型调用方 | Agent Runtime | 另一个外部 Agent |
| 状态模型 | Tool 调用结果（无状态核心） | 具备完整生命周期的 Task |
| 授权鉴权 | OAuth 2.1 | Agent Card `securitySchemes` + `securityRequirements` |
| 传输层 | Stdio / Streamable HTTP | JSON-RPC / gRPC / HTTP+JSON |

当需要调用具体工具时使用 MCP；当需要把整个任务委托给另一个智能体时使用 A2A。生产环境中往往结合使用：Agent 内部用 MCP 接入工具，对外用 A2A 参与多智能体协作网络。

```figure
a2a-task-lifecycle
```

## 动手实践

`code/main.py` 实现了一个基于 A2A 1.0.1 规范的轻量测试组件：写作 Agent 发布其名片，研究 Agent 向其发送带有 PDF Part 和文本指示的 `SendMessage` 请求；任务经历 `TASK_STATE_WORKING` → `TASK_STATE_INPUT_REQUIRED` → `TASK_STATE_WORKING` → `TASK_STATE_COMPLETED`，最终返回文本 Artifact。纯标准库实现，使用内存传输以便直观聚焦报文结构。

重点观察：

- Agent Card 的 JSON 结构。
- Server 端 Task ID 分配与状态转换。
- 通过内容字段自判别的 Parts 结构。
- 任务执行中途的 `TASK_STATE_INPUT_REQUIRED` 分支。
- 终态时返回的 Artifact。

## 交付物

本课交付 `outputs/skill-a2a-agent-spec.md`。针对希望被外部调用的新 Agent，它能生成标准 Agent Card JSON、Skills 声明规范及端点接入设计。

## 练习

1. 运行 `code/main.py`。追踪完整的 Task 生命周期，包括被调用 Agent 请求澄清时的 `TASK_STATE_INPUT_REQUIRED` 暂停。

2. 添加一个签名的 Agent Card。在 `signatures` 中放入一条 `alg` 设为 `HS256` 的 JWS 条目，对去掉 `signatures` 字段后的 Card 规范化 JSON 签名。编写一个验证器，并确认它在被篡改的 Card 上验证失败。

3. 用 `SendStreamingMessage` 实现任务流式传输：writer Agent 依次发出 `task`、三个 `artifactUpdate` 分块，以及一个带 `TASK_STATE_COMPLETED` 的 `statusUpdate`，然后关闭流。调用方累积这些分块。

4. 设计一个封装 MCP Server 的 A2A Agent。把每个 MCP Tool 映射为一个 A2A Skill。记下其中的取舍：失去了哪些不透明性？

5. 阅读 A2A v1.0 的发布公告，找出截至 2026 年 4 月还没有任何框架实现的那一个特性。（提示：它与多跳任务委托有关。）
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
| AP2 | Agent Payments Protocol，构建在 A2A 之上的支付扩展；Card 签名属于 A2A 核心（`signatures`） |
| Opacity | 黑盒协作：被调用 Agent 的内部实现对调用方隐藏 |
| `TASK_STATE_INPUT_REQUIRED` | 当任务执行遇阻需要调用方提供补充输入时的挂起状态 |

## 延伸阅读

- [a2a-protocol.org](https://a2a-protocol.org/latest/) — A2A 规范主站
- [a2aproject/A2A GitHub](https://github.com/a2aproject/A2A) — 参考实现与 SDK
- [A2A v1.0.1 release](https://github.com/a2aproject/A2A/tree/v1.0.1) — 本课遵循的规范与 Protobuf 契约
- [Linux Foundation — A2A launch press release](https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents) — 2025 年 6 月的治理权移交
- [Google Cloud — A2A protocol upgrade](https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade) — 路线图与合作伙伴进展
- [Google Dev — A2A 1.0 milestone](https://discuss.google.dev/t/the-a2a-1-0-milestone-ensuring-and-testing-backward-compatibility/352258) — v1.0 发布说明与向后兼容指导
