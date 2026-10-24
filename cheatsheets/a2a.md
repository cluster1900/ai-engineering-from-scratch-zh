---
id: a2a
title: A2A Protocol
code: AP
subtitle: A2A 1.0.1 的 cards、messages、tasks、states、三种 bindings、errors 以及 0.3 兼容层。事实均来自手册。
hue: 200
sources: manuals/a2a-101
source_hash: ad21d385000c4e28
---

## 协议架构
type: architecture
from: manuals/a2a-101/sections/1-1-what-a2a-standardizes.md, manuals/a2a-101/sections/2-1-agentcard-fields.md, manuals/a2a-101/sections/2-2-discovery-and-supported-interfaces.md, manuals/a2a-101/sections/5-1-json-rpc.md, manuals/a2a-101/sections/5-2-http-json.md, manuals/a2a-101/sections/7-2-a-server.md

```arch
node | planner | 1,1 | Planner | client，读取 cards | client
node | card | 1,2 | AgentCard | /.well-known/agent-card.json | client
node | jsonrpc | 2,1 | JSON-RPC | /a2a/jsonrpc | process
node | handler | 3,1 | Handler | 先检查，再交给 executor | process
node | rest | 3,2 | HTTP+JSON | /a2a/rest | process
node | store | 4,1 | Task store | 每个 task 的记录 | store
edge | planner | card | GET
edge | planner | jsonrpc | POST
edge | jsonrpc | handler | method
edge | rest | handler | route
edge | handler | store | task
```

## 发送并读取 task
type: task-table
from: manuals/a2a-101/sections/2-2-discovery-and-supported-interfaces.md, manuals/a2a-101/sections/4-1-send-message.md, manuals/a2a-101/sections/5-1-json-rpc.md, manuals/a2a-101/sections/5-4-version-and-extension-headers.md, manuals/a2a-101/capture/out/01-agent-cards.http

| 任务 | 代码 |
|---|---|
| 读取 agent card | `GET /.well-known/agent-card.json HTTP/1.1` |
| 发送一条 message | 向 `/a2a/jsonrpc` POST `"method": "SendMessage"` |
| 发送版本号 | `A2A-Version: 1.0` |
| 发送后立即返回 | 在 `configuration` 中设置 `"returnImmediately": true` |
| 打开 stream | `"method": "SendStreamingMessage"` |

## HTTP+JSON 上的命令
type: command-table
from: manuals/a2a-101/sections/5-2-http-json.md, manuals/a2a-101/sections/4-4-cancel-task-and-terminal-states.md, manuals/a2a-101/capture/out/16-rest-binding.http

| 命令 | 作用 |
|---|---|
| `POST /a2a/rest/message:send` | 发送一条 message。回复是一个 task 或一条 message。 |
| `POST /a2a/rest/tasks/<task id>:cancel` | 请求 server 停止一个尚未进入 terminal 的 task。 |
| `GET /.well-known/agent-card.json` | 从 well-known 路径读取 agent card。 |
| `POST /a2a/rest/tasks/<task id>:cancel` | 当 task 已经 terminal 时，返回 task error。 |

## 设置与默认值
type: defaults
from: manuals/a2a-101/sections/4-1-send-message.md, manuals/a2a-101/sections/4-3-get-task-and-list-tasks.md, manuals/a2a-101/sections/2-1-agentcard-fields.md, manuals/a2a-101/sections/5-4-version-and-extension-headers.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `returnImmediately` | false | 一次 send 会等待 terminal 或 interrupted 状态 |
| `historyLength` | unset | 由 server 决定返回多少 history。`0` 表示不返回 history。 |
| `pageSize` | 50 | `ListTasks` 中的最大值为 100 |
| `includeArtifacts` | false | list 结果中不包含 artifacts |
| `A2A-Version` | 1.0 | 每个请求都必须携带，不带 patch 版本号 |

## 比较三种 bindings
type: comparison
from: manuals/a2a-101/sections/5-1-json-rpc.md, manuals/a2a-101/sections/5-2-http-json.md, manuals/a2a-101/sections/5-3-grpc.md, manuals/a2a-101/sections/5-5-errors.md, manuals/a2a-101/sections/5-4-version-and-extension-headers.md

| 维度 | JSON-RPC | HTTP+JSON | gRPC |
|---|---|---|---|
| 操作的命名方式 | `method`，如 `SendMessage` | route，如 `POST /message:send` | `A2AService` 中的 rpc `SendMessage` |
| 发送位置 | 单一 URL，kit 中为 `/a2a/jsonrpc` | 每个操作一个 route | 基于 HTTP/2 + TLS 的 `lf.a2a.v1.A2AService` |
| Stream frame | 一行 `data:`，内含完整 JSON-RPC response | 一行 `data:`，只含 `StreamResponse` | `StreamResponse` 的 server-streaming rpc |
| `TaskNotFoundError` | `-32001`，HTTP 200 | HTTP 404 | `NOT_FOUND` |
| 版本 header | `A2A-Version` header | `A2A-Version` header | `a2a-version` metadata key |

## Task 状态
type: concepts
from: manuals/a2a-101/sections/3-4-task-and-task-state.md, manuals/a2a-101/sections/4-2-input-required-and-auth-required.md, manuals/a2a-101/sections/4-4-cancel-task-and-terminal-states.md

- **Active**: `TASK_STATE_SUBMITTED` and `TASK_STATE_WORKING`. agent 仍在工作。
- **Interrupted**: `TASK_STATE_INPUT_REQUIRED` and `TASK_STATE_AUTH_REQUIRED`. task 在等你。
- **Terminal**: `TASK_STATE_COMPLETED`, `TASK_STATE_FAILED`, `TASK_STATE_CANCELED`, `TASK_STATE_REJECTED`. task 不会再改变。
- **TASK_STATE_UNSPECIFIED**: kit 从不发送它。应将其视为错误。

## 一个 task 的完整步骤
type: flow
from: manuals/a2a-101/sections/1-1-what-a2a-standardizes.md, manuals/a2a-101/sections/3-1-message.md, manuals/a2a-101/sections/4-1-send-message.md, manuals/a2a-101/sections/4-2-input-required-and-auth-required.md, manuals/a2a-101/sections/4-3-get-task-and-list-tasks.md

1. **Client**: 发送一个阻塞的 `SendMessage`，带新的 `messageId`，不带 `taskId`。
2. **Server**: 创建 task，并生成其 `taskId` 和 `contextId`。
3. **Agent**: 停在 `TASK_STATE_INPUT_REQUIRED`，调用返回该 task 及其提问。
4. **Client**: 用第二个 `SendMessage` 作答，带相同的 `taskId` 和 `contextId`。
5. **Server**: 返回处于 `TASK_STATE_COMPLETED` 的同一 task 及其 artifact。
6. **Client**: 用 `taskId` 调用 `GetTask`，再次读取已存储的 task。

## JSON-RPC 请求
type: annotated-code
lang: bash
from: manuals/a2a-101/sections/5-1-json-rpc.md, manuals/a2a-101/sections/3-1-message.md, manuals/a2a-101/sections/5-4-version-and-extension-headers.md, manuals/a2a-101/capture/out/02-message-reply.http

```bash
curl -s http://localhost:41242/a2a/jsonrpc \  # 所有操作共用一个 URL
  -H 'Content-Type: application/json' \  # JSON 请求体
  -H 'A2A-Version: 1.0' \  # 每个请求都必须携带
  -d '{
    "jsonrpc": "2.0",  # envelope 版本，始终为 2.0
    "id": 1,  # 回复会重复这个 id
    "method": "SendMessage",  # PascalCase 操作名
    "params": {"message": {
      "messageId": "d95bafc8-f2a4-427b-9cf4-bb99f4bea973",  # 由 client 生成
      "role": "ROLE_USER",  # client 始终发送 ROLE_USER
      "parts": [{"text": "What languages can you review?"}]  # 至少一个 part
    }}
  }'
```

## 故障排查
type: troubleshooting
from: manuals/a2a-101/sections/5-4-version-and-extension-headers.md, manuals/a2a-101/sections/5-5-errors.md, manuals/a2a-101/sections/4-4-cancel-task-and-terminal-states.md, manuals/a2a-101/sections/7-4-from-0-3-to-1-0.md, manuals/a2a-101/sections/3-5-context-id.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 每次调用都返回 `-32009` | 缺少 `A2A-Version` header | 发送 `A2A-Version: 1.0` |
| 使用 `message/send` 时返回 `-32601` | 这是 0.3 的 method 名 | 发送 `SendMessage` |
| 对已完成的 task 返回 `-32004` | task 已 terminal | 在同一 context 中用 `referenceTaskIds` 启动新 task |
| push config 调用返回 `-32003` | card 没有 `pushNotifications` flag | 调用前先读取 card |
| 返回带 `BadRequest` detail 的 `-32602` | 缺少 `message.messageId` | 为每条 message 生成 `messageId` |
| `-32001` 或 HTTP 404 | id 未知、已清除或被隐藏 | 检查 id，然后停止 |

## 问答
type: qa
from: manuals/a2a-101/sections/4-1-send-message.md, manuals/a2a-101/sections/3-1-message.md, manuals/a2a-101/sections/3-3-artifact-and-chunks.md, manuals/a2a-101/sections/6-1-security-schemes-and-in-task-authorization.md

- **为什么 send 会等待？** `returnImmediately` 默认为 false。调用会一直挂起，直到进入 terminal 或 interrupted 状态。
- **结果在哪里？** 在 `artifacts` 中。message 不应携带 task 的输出。
- **为什么对其他调用者的 task 回复 `TaskNotFoundError`？** 规范禁止泄露资源是否存在。

## 提示
type: tips
from: manuals/a2a-101/sections/3-1-message.md, manuals/a2a-101/sections/3-2-part.md, manuals/a2a-101/sections/4-3-get-task-and-list-tasks.md, manuals/a2a-101/sections/2-2-discovery-and-supported-interfaces.md

- 每条新 message 都生成新的 `messageId`。只有重试时才复用。
- client 发送 `ROLE_USER`，server 发送 `ROLE_AGENT`。
- 做状态检查时发送 `historyLength` 0。
- 调用可选功能前，先读取 card 并检查其 capability flags。
