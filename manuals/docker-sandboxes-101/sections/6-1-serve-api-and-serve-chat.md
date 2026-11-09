# serve api 和 serve chat

> `serve api` 是原生控制平面，在 8080 端口上提供 session 和 SSE 运行流，`serve chat` 是 8083 端口上的 OpenAI 兼容子集。

你的智能体文件在终端里回答得很好，现在一个网页和一个 CI 任务必须通过 HTTP 调用它。网页想要一个回合的每个事件，CI 任务只使用 OpenAI chat 格式。

读完本节后，你能在一个智能体文件上启动这两个服务器，各跑一个回合，并读懂事件流。

## 一个智能体文件，五个服务器 {#s-serve-api-and-serve-chat-one-agent-file-five-servers}

`a2a`、`acp`、`api` 和 `mcp` 命令在 v1.23.4 移到了 `serve` 下 {{rel-agent v1.23.4}}，v1.53.0 增加了 `chat` {{rel-agent v1.53.0}}。v1.149.0 的帮助列出了全部五个 {{help-agent docker-agent serve}}。本部分用全部五种方式 serve 一个小文件。它的唯一智能体 `root` 用单词 pong 回答每条消息：

```listing
title: 第 6.1 到 6.3 节所 serve 的智能体文件
source: capture/fixtures/agents/pong.yaml
lang: yaml
---
version: "16"

agents:
  root:
    model: local
    description: Answers every message with the word pong.
    instruction: Reply with exactly the word pong and nothing else.

models:
  local:
    provider: dmr
    model: ai/qwen3:4b
    temperature: 0
```

## serve api：先建 session，再跑一次 run {#s-serve-api-and-serve-chat-serve-api-a-session-then-a-run}

**serve api：** 通过带 Server-Sent Events（SSE）流式传输的 REST 风格 API 来 serve 你的智能体的命令 {{docs-agent API Server}}。它监听 `127.0.0.1:8080`，空的 `--auth-token` 表示不认证 {{help-agent docker-agent serve api}}。`--max-request-size` 以 HTTP 413 拒绝超过 1 MiB 的请求体，`--session-workingdir-root` 限制新 session 的 `working_dir` {{help-agent docker-agent serve api}}。

这里 session 数据库的默认值不同。`serve api -s` 把 `session.db` 写到当前目录，而 `run`、`serve a2a` 和 `serve acp` 使用 `<data-dir>/session.db` {{help-agent docker-agent serve api}}（[冲突 C63](#s-ref-sources-and-the-conflicts-register)）。这次 capture 传入了 `-s work/api-session.db` 和 `--fake work/cassettes/23-api`，所以由录好的 cassette 给出模型回答（[这次 capture](manuals/docker-sandboxes-101/capture/out/23-serve-api.log)）。

```listing
title: 列出智能体、创建 session、启动一次 run
source: capture/out/23-api.http
lang: http
note: ping 往返、最后一次读取 session、Host 和 Date 头，以及 session 对象的大部分字段已删节。
---
GET /api/agents HTTP/1.1
…
    "name": "pong",
    "description": "Answers every message with the word pong.",
    "multi": false
…
POST /api/sessions HTTP/1.1
…
{}
…
  "id": "<uuid>",
  "origin": "run",
…
  "tools_approved": false,
…
POST /api/sessions/<uuid>/agent/pong HTTP/1.1
…
Accept: text/event-stream
…
      "role": "user",
      "content": "ping"
…
HTTP/1.1 200 OK
…
Content-Type: text/event-stream
```

路径中的智能体标识符是去掉 `.yaml` 的文件名，所以是 `pong`，而事件把智能体叫做 `root` {{docs-agent API Server}}。run 的请求体是一个 `messages` 数组，带有可选的 `model` 字段，它为该 session 中的那个智能体设置模型覆盖 {{docs-agent API Server}}。新 session 的 `tools_approved` 为 `false`。随后的工具调用会引发 `tool_call_confirmation`，客户端用 `POST /api/sessions/:id/resume` 回答 {{docs-agent API Server}}。

## run 流 {#s-serve-api-and-serve-chat-the-run-stream}

```listing
title: 一个回合的十帧
source: capture/out/23-api-run.sse
lang: sse
note: token_usage 帧的 usage 对象已删节。kit 在写入文件之前丢掉了 reasoning 帧。
---
data: {"agent_name": "root", "available_agents": [{"description": "Answers every message with the word pong.", "model": "ai/qwen3:4b", "name": "root", "provider": "dmr"}], "current_agent": "root", "timestamp": "<ts>", "type": "team_info"}
data: {"agent_name": "root", "available_tools": 0, "loading": false, "timestamp": "<ts>", "type": "toolset_info"}
data: {"message": "ping", "session_id": "<uuid>", "session_position": 0, "timestamp": "<ts>", "type": "user_message"}
data: {"agent_name": "root", "session_id": "<uuid>", "timestamp": "<ts>", "type": "stream_started"}
data: {"agent_name": "root", "available_tools": 0, "loading": false, "timestamp": "<ts>", "type": "toolset_info"}
data: {"agent_name": "root", "description": "Answers every message with the word pong.", "model": "dmr/ai/qwen3:4b", "timestamp": "<ts>", "type": "agent_info"}
data: {"agent_name": "root", "content": "pong", "message_id": "<uuid>", "session_id": "<uuid>", "timestamp": "<ts>", "type": "agent_choice"}
data: {"agent_name": "root", "session_id": "<uuid>", "timestamp": "<ts>", "type": "message_added"}
data: {"agent_name": "root", "session_id": "<uuid>", "timestamp": "<ts>", "type": "token_usage", …}
data: {"agent_name": "root", "finish_reason": "stop", "reason": "normal", "session_id": "<uuid>", "timestamp": "<ts>", "type": "stream_stopped"}
```

文档列出了八种事件类型，从 `stream_started` 到 `error` {{docs-agent API Server}}。这次 capture 又多了六个：`team_info`、`toolset_info`、`user_message`、`agent_info`、`message_added` 和 `token_usage`。pong 智能体没有工具，所以没有 `tool_call` 帧。文件的最后一个请求把 session 读回来，存储的 assistant 消息在回答旁边保留了模型的 `reasoning_content`（[这次 capture](manuals/docker-sandboxes-101/capture/out/23-api.http)）。[图](#fig-6-1)画出了整次交互。

```figure
id: fig-6-1
kind: sequence
title: 一次 serve api session 和一次流式 run
claim: 先创建并存储 session，然后对智能体路径的一次 POST 以 SSE 帧返回整个回合，从 team_info 到 stream_stopped.
caption: 从上往下读。实心墨色箭头是请求，虚线墨色箭头是回复。点状靛色箭头是 SSE 帧，青色箭头存储 session，梅色箭头是 cassette 回答的模型调用。 From capture/out/23-api.http and 23-api-run.sse.
```

一次 run 是一次请求，session 比它活得更久。`/steer` 向正在进行的回合注入消息，`/followup` 用可选的 `Idempotency-Key` 排队，`/fork` 把 session 复制到某条用户消息为止 {{docs-agent API Server}}。`GET /api/sessions/:id/events` 是覆盖整个 session 的流，从 `Last-Event-ID` 或 `?since=` 恢复 {{docs-agent API Server}}。交互式的 `docker-agent run --listen ADDR` serve 同一个控制平面，请求体上限固定为 1 MiB，没有 `--auth-token`。帮助没有列出该标志，每次这样的 run 都会写入 `<data-dir>/runs/<pid>.json` 供发现使用 {{docs-agent API Server}}。

## serve chat：OpenAI 兼容子集 {#s-serve-api-and-serve-chat-serve-chat-the-openai-compatible-subset}

**serve chat：** 通过 `/v1/chat/completions` 和 `/v1/models` 上的 OpenAI 兼容 API 来 serve 智能体的命令 {{help-agent docker-agent serve chat}}。模型 id 是智能体名，所以这次 capture 列出的是文件内部的名字 `root`，而 `serve api` 用的是文件名 `pong`。

```listing
title: 模型列表、一次 completion，以及一次没有 token 的请求
source: capture/out/23-chat.http
lang: http
note: 头、id、时间戳和 usage 对象已删节。
---
GET /v1/models HTTP/1.1
…
Authorization: Bearer m101-chat-key
…
      "id": "root",
…
      "owned_by": "docker-agent",
…
POST /v1/chat/completions HTTP/1.1
…
        "role": "assistant",
        "content": "pong"
…
HTTP/1.1 401 Unauthorized
…
    "message": "missing or invalid bearer token",
```

默认情况下服务器不保存对话，所以每个请求都带上完整历史。`--conversations-max` 按 `X-Conversation-Id` 最多缓存 N 段对话，`--conversation-ttl` 在 30 分钟后驱逐它们 {{help-agent docker-agent serve chat}}。失败的回合不改动已缓存的对话，所以客户端可以用同一个 id 重试 {{docs-agent Chat Server}}。请求体里带 `stream: true` 时，回复是 `chat.completion.chunk` delta 的 SSE 流 {{docs-agent Chat Server}}。`--max-idle-runtimes` 为每个智能体保留四个空闲 runtime，`--request-timeout` 把每个请求限制在五分钟，包含模型和工具调用 {{help-agent docker-agent serve chat}}。不在 loopback 上的监听器需要 `--api-key`、`--api-key-env` 或 `--insecure-no-auth` {{docs-agent Chat Server}}。

| | `serve api` | `serve chat` |
|---|---|---|
| 默认地址 | `127.0.0.1:8080` | `127.0.0.1:8083` |
| Token 标志 | `--auth-token` | `--api-key` 或 `--api-key-env` |
| capture 中的智能体 id | `pong`，文件名 | `root`，智能体名 |
| 状态 | session 在 `-s` 中，默认 `session.db` | 无，或按 `X-Conversation-Id` 做键的缓存 |
| 工具批准 | `tool_call_confirmation`，然后 `resume` | `--safety`，默认 `restricted` {{docs-agent Chat Server}} |
| Cassette | `--fake` 和 `--record` | 无 |

```takeaways
- 客户端必须看到工具确认和每个流事件时，用 `serve api`。
- 只使用 OpenAI chat 格式的客户端用 `serve chat`。
- 给 `serve api` 传入 `-s`，否则它会把 `session.db` 写到当前目录。
- 把任一服务器绑定到非 loopback 地址之前，先设置 token。
```

Sources: help-agent docker-agent serve, serve api, serve chat (research/sources/help-docker-agent.md); docs-agent API Server, Chat Server (research/sources/docs-docker-agent.md); rel-agent v1.23.4, v1.53.0 (research/sources/docker-agent-CHANGELOG.md); research/conflicts-register.md row C63; research/plan.md, Part 6; capture/README.md; capture/fixtures/agents/pong.yaml; capture/out/23-serve-api.log, 23-api.http, 23-api-run.sse, 23-chat.http
