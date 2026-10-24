---
id: a2a-and-agent-messaging
title: A2A and Agent Communication Protocols
code: A2
subtitle: MCP、A2A、ACP、ANP 与 FIPA-ACL 并排对比。Agent Card、任务、线上名称与故障。A2A 1.0.1。
hue: 165
sources: phases/13-tools-and-protocols/19-a2a-protocol, phases/16-multi-agent-and-swarms/02-fipa-acl-heritage, phases/16-multi-agent-and-swarms/03-communication-protocols, phases/16-multi-agent-and-swarms/12-a2a-protocol
source_hash: 67d717f0e4fbfde7
---

## 四种协议并排对比
type: comparison
span: 2
from: phases/16-multi-agent-and-swarms/03-communication-protocols/docs/en.md

| 维度 | MCP | A2A | ACP | ANP |
|---|---|---|---|---|
| 主要用途 | Agent 到工具 | Agent 到 Agent | Agent 到 Agent | Agent 到 Agent |
| 规范格式 | JSON-RPC | JSON-RPC / REST / gRPC | OpenAPI 3.1（REST） | JSON-RPC |
| 发现 | 工具列表 | `/.well-known/agent-card.json` | `GET /agents`、`/.well-known/agent.yml` | `/.well-known/agent-descriptions` |
| 身份 | 隐式（本地） | 安全方案（OAuth、mTLS） | 服务器级 | W3C DID（`did:wba`）加 E2EE |
| 审计轨迹 | 不适用 | 基础（任务历史） | TrajectoryMetadata | 未正式规定 |
| 流式 | 不适用 | SSE | SSE | 与传输无关 |
| 独有特性 | 工具 schema | Agent Card + Skill | 轨迹审计 | 元协议协商 |
| 状态 | 稳定 | 稳定（v1.0） | 正在并入 A2A | 活跃开发中 |

## 何时选用
type: concepts
from: phases/16-multi-agent-and-swarms/03-communication-protocols/docs/en.md, phases/13-tools-and-protocols/19-a2a-protocol/docs/en.md, phases/16-multi-agent-and-swarms/12-a2a-protocol/docs/en.md

- **MCP**：你想调用某个具体工具。Agent 到工具。
- **A2A**：你想把一整个任务委派给另一个 agent。
- **A2A + ACP 模式**：合规需要审计轨迹。
- **ANP + A2A**：agent 在你的组织之外，且不共享基础设施。
- **A2A + 消息代理**：外部 agent 共享同一套基础设施。
- **直接 RPC**：对延迟敏感的微调用。A2A 的生命周期是异步的。
- **不用协议**：agent 之间不需要通信。

## 通过 HTTP+JSON 调用 A2A
type: architecture
from: phases/16-multi-agent-and-swarms/12-a2a-protocol/docs/en.md, phases/16-multi-agent-and-swarms/12-a2a-protocol/code/main.py

```arch
node | client | 1,1 | Client agent | sends A2A-Version: 1.0 | client
node | card | 2,1 | Agent Card | /.well-known/agent-card.json | store
node | send | 1,2 | POST /message:send | returnImmediately | process
node | store | 2,2 | TaskStore | state + artifacts | store
node | poll | 3,2 | GET /tasks/{id} | until a terminal state | process
edge | client | card | discover
edge | client | send | message
edge | send | store | create task
edge | store | poll | task
```

## 带暂停的任务生命周期
type: flow
from: phases/13-tools-and-protocols/19-a2a-protocol/docs/en.md, phases/13-tools-and-protocols/19-a2a-protocol/code/main.py, phases/16-multi-agent-and-swarms/03-communication-protocols/docs/en.md

1. **客户端**：发送 `SendMessage`，不带 `taskId`。服务器创建 Task。
2. **服务器**：先置 `TASK_STATE_SUBMITTED`，再置 `TASK_STATE_WORKING`。
3. **服务器**：缺数据。置 `TASK_STATE_INPUT_REQUIRED` 并附一条 `ROLE_AGENT` 消息。
4. **客户端**：用同一个 `taskId` 发送新消息，带一个 `data` part。
5. **服务器**：回到 `TASK_STATE_WORKING` 并添加一个 Artifact。
6. **服务器**：置 `TASK_STATE_COMPLETED`。终止状态不可变。
7. **客户端**：后续请求在同一个 `contextId` 内创建新任务。

## 线上的 A2A 任务
type: task-table
span: 2
from: phases/13-tools-and-protocols/19-a2a-protocol/docs/en.md, phases/16-multi-agent-and-swarms/12-a2a-protocol/docs/en.md, phases/16-multi-agent-and-swarms/12-a2a-protocol/code/main.py

| 任务 | 代码 |
|---|---|
| 发现一个 agent | `GET /.well-known/agent-card.json` |
| 发送并等待（JSON-RPC） | `"method": "SendMessage"` |
| 发送后立即返回（HTTP+JSON） | `POST /message:send` 加 `configuration.returnImmediately` |
| 轮询任务 | `GetTask` 或 `GET /tasks/{id}` |
| 通过 SSE 流式获取任务 | `SendStreamingMessage` 或 `POST /message:stream` |
| 重新挂接正在运行的任务 | `SubscribeToTask` 或 `/tasks/{id}:subscribe` |
| 取消或列出任务 | `CancelTask`、`ListTasks` |
| 运行演示服务器和客户端 | `python3 code/main.py` |

## Agent Card 与 Message 的结构
type: annotated-code
lang: json
from: phases/13-tools-and-protocols/19-a2a-protocol/docs/en.md

```json
{"name": "research-agent", "version": "1.2.0",
 "supportedInterfaces": [{"url": "<url>",           // pick the first binding you speak
   "protocolBinding": "JSONRPC", "protocolVersion": "1.0"}],
 "capabilities": {"streaming": true, "pushNotifications": true},
 "securitySchemes": {"bearer": {"httpAuthSecurityScheme": {"scheme": "Bearer"}}},
 "securityRequirements": [{"schemes": {"bearer": {"list": []}}}],
 "defaultInputModes": ["text/plain"],               // media types
 "skills": [{"id": "summarize_paper", "tags": ["research"]}]}
{"messageId": "msg-001", "role": "ROLE_USER",       // or ROLE_AGENT
 "parts": [{"text": "Summarize this paper."},       // one content field per Part
   {"raw": "...", "filename": "paper.pdf", "mediaType": "application/pdf"},
   {"data": {"targetLength": "3 paragraphs"}}]}     // no kind field
```

## 默认值与数字
type: defaults
from: phases/13-tools-and-protocols/19-a2a-protocol/docs/en.md, phases/16-multi-agent-and-swarms/12-a2a-protocol/docs/en.md, phases/16-multi-agent-and-swarms/12-a2a-protocol/code/main.py, phases/16-multi-agent-and-swarms/03-communication-protocols/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `A2A_VERSION` | "1.0" | 每个请求都发送 `A2A-Version: 1.0` |
| 无 `A2A-Version` 请求头 | 0.3 | 服务器按 0.3 版本解读请求 |
| `returnImmediately` | False | `SendMessage` 阻塞到终止或中断 |
| `A2A_MEDIA_TYPE` | "application/a2a+json" | HTTP+JSON 绑定的内容类型 |
| `PORT` | 8765 | 第 16.12 课演示服务器 |
| ANP 协商 | 最多 10 轮 | 之后超时 |

## FIPA-ACL 渊源
type: comparison
from: phases/16-multi-agent-and-swarms/02-fipa-acl-heritage/docs/en.md

| 现代规范 | FIPA 对应物 | 保留 | 舍弃 |
|---|---|---|---|
| MCP `tools/call` | `request` | 意图、关联 id | 语义、本体 |
| MCP `resources/read` | `query-ref` | 意图、关联 id | 形式语义 |
| A2A 任务生命周期 | contract-net + request-when | 异步生命周期 | 完备性保证 |
| A2A 流式事件 | subscribe/notify | 异步推送 | 带类型谓词的订阅 |
| NLIP | 自然语言内容 | LLM 原生 | schema |

## 故障排查
type: troubleshooting
from: phases/13-tools-and-protocols/19-a2a-protocol/code/main.py, phases/16-multi-agent-and-swarms/12-a2a-protocol/code/main.py, phases/16-multi-agent-and-swarms/03-communication-protocols/docs/en.md, phases/16-multi-agent-and-swarms/02-fipa-acl-heritage/docs/en.md, phases/16-multi-agent-and-swarms/12-a2a-protocol/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| JSON-RPC 错误 `-32009` | `A2A-Version` 缺失或错误 | 发送 `A2A-Version: 1.0` |
| JSON-RPC 错误 `-32601` | 方法名未知 | 使用 PascalCase 名称，如 `SendMessage` |
| HTTP 400 `VERSION_NOT_SUPPORTED` | HTTP+JSON 调用缺少该请求头 | 每个请求都加上该请求头 |
| HTTP 404 `TASK_NOT_FOUND` | `GET /tasks/{id}` 上的任务 id 未知 | 使用 `task` 响应中的 id |
| 完成后的更新丢失 | 任务一旦终止即不可变 | yield 之前先检查终止状态 |
| 卡片更新后输出乱码 | 版本间 schema 漂移 | 给 skill 和输出 schema 加版本 |
| 同一个词，动作却错了 | 无本体导致的语义漂移 | 在 `content` 上加 JSON Schema，使用带类型的 artifact |
| 50 个 agent 同时打到 `GET /agents` | 发现阶段的惊群效应 | 带 TTL 缓存 Agent Card |

## 缩写
type: glossary
from: phases/16-multi-agent-and-swarms/03-communication-protocols/docs/en.md, phases/16-multi-agent-and-swarms/02-fipa-acl-heritage/docs/en.md, phases/16-multi-agent-and-swarms/12-a2a-protocol/docs/en.md

- **A2A**：Agent2Agent。带 Agent Card 和任务的对等协议。
- **ACP**：Agent Communication Protocol。带 TrajectoryMetadata 的 REST run。
- **ANP**：Agent Network Protocol。`did:wba` 身份与 HPKE E2EE。
- **DID**：Decentralized Identifier（去中心化标识符）。位于 agent 自有域名上的 W3C 身份。
- **NLIP**：Ecma Natural Language Interaction Protocol（自然语言交互协议）。自然语言内容类型。
- **FIPA**：Foundation for Intelligent Physical Agents。2000 年标准化了 ACL。
- **ACL**：Agent Communication Language。施事行为（performative）加内容加元数据。
- **KQML**：Knowledge Query and Manipulation Language（1993）。FIPA 的前身。

## 问答
type: qa
from: phases/13-tools-and-protocols/19-a2a-protocol/docs/en.md, phases/16-multi-agent-and-swarms/12-a2a-protocol/docs/en.md, phases/16-multi-agent-and-swarms/03-communication-protocols/docs/en.md, phases/16-multi-agent-and-swarms/02-fipa-acl-heritage/docs/en.md

- **调用方在 A2A 中能看到什么？** 任务状态和 artifact。被调用 agent 的内部保持不透明。
- **重试时如何避免产生重复任务？** 按客户端的 `messageId` 去重。
- **Agent Card 如何签名？** 在 `signatures` 中放一个 JWS，签名对象是去掉 `signatures` 后的 RFC 8785 规范化 JSON。
- **ACP 增加了什么？** 每个 part 都可以携带 `tool_name`、`tool_input` 和 `tool_output` 元数据。
- **DID 获取失败，放行还是拒绝？** 按最小信任原则，失败即拒绝（fail closed）。
- **哪些 FIPA 协议值得移植？** Contract Net、Subscribe/Notify 和 Request-When。
