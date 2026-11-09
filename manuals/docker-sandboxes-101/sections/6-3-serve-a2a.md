# serve a2a

> `serve a2a` 在端口 8082 上发布一张 A2A 1.0 agent card，并用一个已完成的任务回答 `SendMessage`，而这张 card 违反了 A2A 1.0.1 的三条 REQUIRED 规则。

另一个团队的 planner 使用 A2A，想把工作交给你的智能体。它会取一张 card、发送一条消息、再读取一个任务，正如 A2A 101 手册在 [SendMessage](manuals/a2a-101/sections/4-1-send-message.md) 中所讲。

读完本节后，你能通过 A2A 提供一个智能体、用 1.0 名称调用它，并预测严格客户端会在何处提出异议。

## well-known 路径上的 card {#s-serve-a2a-the-card-at-the-well-known-path}

**serve a2a：** 启动一个 A2A 服务器，通过 Agent-to-Agent 协议提供该智能体 {{help-agent docker-agent serve a2a}}。它监听 `127.0.0.1:8082`，`-a` 默认为团队的第一个智能体 {{help-agent docker-agent serve a2a}}，旧插件则点名 `root`（[冲突 C64](#s-ref-sources-and-the-conflicts-register)）。`--auth-token` 覆盖 card 和每一次调用，loopback 之外的监听器需要它或 `--insecure-no-auth` {{docs-agent A2A Protocol}}。会话默认使用 `restricted` 安全策略 {{docs-agent A2A Protocol}}。

Docker Agent 文档既没有点名 card 路径，也没有点名协议版本（[冲突 C71](#s-ref-sources-and-the-conflicts-register)）。capture 在 `/.well-known/agent-card.json` 找到了 card。`/.well-known/agent.json` 返回 404，对 `/` 的 POST 也是（[capture](manuals/docker-sandboxes-101/capture/README.md)）。

```listing
title: serve a2a 为 pong.yaml 发布的 agent card
source: capture/out/23-agent-card.json
lang: json
---
{
  "supportedInterfaces": [
    {
      "url": "http://127.0.0.1:8082/invoke",
      "protocolBinding": "JSONRPC",
      "protocolVersion": "1.0"
    }
  ],
  "capabilities": {
    "streaming": true
  },
  "defaultInputModes": [],
  "defaultOutputModes": [],
  "description": "Answers every message with the word pong.",
  "name": "pong",
  "skills": [
    {
      "description": "Answers every message with the word pong.",
      "id": "pong_",
      "name": "",
      "tags": [
        "llm",
        "docker agent"
      ]
    }
  ],
  "version": "v1.149.0"
}
```

card 用文件名 `pong`，而 `serve chat` 用的是智能体名 `root`。它唯一的 skill 的 id 是 `pong_`，描述是该智能体的描述。响应还带了 `Access-Control-Allow-Origin: *`，尽管这次运行没有设置 `--cors-origin`，帮助说 "empty disables CORS" {{help-agent docker-agent serve a2a}}。

## SendMessage 和 GetTask {#s-serve-a2a-sendmessage-and-gettask}

card 指向一个 JSON-RPC 接口 `http://127.0.0.1:8082/invoke`，协议版本 `1.0`。capture 用 `A2A-Version: 1.0` 且没有 `configuration` 向那里发送了 `SendMessage`：

```listing
title: 使用 1.0 名称的 SendMessage，然后是 GetTask
source: capture/out/23-a2a.http
lang: http
note: header、id、history、metadata 和 GetTask 应答已删节。
---
POST /invoke HTTP/1.1
…
A2A-Version: 1.0
…
  "method": "SendMessage",
  "params": {
    "message": {
      "messageId": "m101-0001",
      "role": "ROLE_USER",
      "parts": [
        {
          "text": "ping"
        }
…
  "result": {
    "task": {
…
      "artifacts": [
        {
          "artifactId": "<uuid>",
          "metadata": {
            "adk_partial": true
          },
          "parts": [
            {
              "data": {},
…
        {
          "artifactId": "<uuid>",
          "parts": [
            {
              "text": "pong"
…
      "status": {
        "state": "TASK_STATE_COMPLETED",
…
  "method": "GetTask",
  "params": {
    "id": "<uuid>"
  }
```

这次发送返回了一个已经处于 `TASK_STATE_COMPLETED` 的 `task`，`GetTask` 返回了带 `history` 的同一任务（[capture](manuals/docker-sandboxes-101/capture/out/23-a2a.http)）。回答 `pong` 在第二个 artifact 里，`history` 只保留用户消息。服务器对 `ai/qwen3:4b` 做了一次实时调用，因为 `serve a2a` 没有 `--fake`。card 设置了 `streaming: true`，所以提供了 `SendStreamingMessage`，但 capture 没有调用它。[图](#fig-6-3)画出了这次交换。

自 v1.59.0 起，会话持久化在会话数据库中，客户端通过 `/invoke` 用它的 A2A context 恢复一个会话 {{rel-agent v1.59.0}}。与另一个会话冲突的 context id 会被拒绝，那个会话保持不变 {{docs-agent A2A Protocol}}。较旧二进制存储的会话被标为 `run`，不能通过 A2A 恢复 {{docs-agent A2A Protocol}}。

```figure
id: fig-6-3
kind: sequence
title: 一张 A2A card、一次 SendMessage、一次 GetTask
claim: 客户端读取 card，发送一次会发起一次模型调用的阻塞 SendMessage，并得到一个已完成的任务，GetTask 再次返回该任务.
caption: 从上往下读。实心墨色箭头是请求，虚线墨色箭头是应答。梅色箭头是实时模型调用，琥珀色框是应答携带的任务状态。 From capture/out/23-a2a.http.
```

## 它与 A2A 1.0.1 的不同之处 {#s-serve-a2a-where-it-differs-from-a2a-1-0-1}

本仓库的 A2A 101 手册陈述了 1.0.1 规则：[AgentCard 字段](manuals/a2a-101/sections/2-1-agentcard-fields.md)讲 card，[SendMessage](manuals/a2a-101/sections/4-1-send-message.md)讲调用。下表把每个 capture 到的值对照这些规则。

| `serve a2a` 返回了什么 | A2A 1.0.1，按 A2A 101 的表述 | 结果 |
|---|---|---|
| `/.well-known/agent-card.json` 上的 card | 规范 §8.2 的 well-known 路径 | 相符 |
| 一个接口：`/invoke`、`JSONRPC`、`protocolVersion: "1.0"` | `url`、`protocolBinding` 和 `protocolVersion` 是 REQUIRED，版本是 `Major.Minor` | 相符 |
| `SendMessage`、`GetTask`、`ROLE_USER`、`TASK_STATE_COMPLETED` | PascalCase 方法名和 1.0 枚举名 | 相符 |
| 一次没有 `configuration` 的发送返回了终止态任务 | 一次发送会阻塞到终止态或中断态 | 相符 |
| `skills[0].name` 是空字符串 | 每个 skill 需要一个 `id`、一个 `name`、一个 `description` 和一个 tag | 不符：没有 skill 名称 |
| `defaultInputModes` 和 `defaultOutputModes` 是空列表 | REQUIRED 列表至少包含一个元素 | 不符：两个空列表 |
| `version` 是 `v1.149.0` | `version` 是智能体自己的版本 | 不符：是 docker-agent 的版本 |
| 任务 `metadata` 以 `https://google.github.io/adk-docs/a2a/a2a-extension/` 为键 | 扩展在 `capabilities.extensions` 中声明，其数据以 URI 为键 | 不符：card 未声明扩展 |
| 一个 artifact 的唯一 part 是空的 `data` 对象，标为 `adk_partial` | 一个 artifact 需要唯一的 `artifactId` 和至少一个 part | 允许，但为空 |

`adk_*` 键来自服务器所基于的 A2A 库，v1.129.0 把它迁到了 `adka2a/v2` {{rel-agent v1.129.0}}。文档列出了四条限制。其中一条说 A2A artifact 尚不支持 {{docs-agent A2A Protocol}}（[冲突 C70](#s-ref-sources-and-the-conflicts-register)）。capture 与这一条矛盾，因为回答是以 artifact 到达的。另外三条涉及工具事件、记忆和子智能体，pong 智能体都没有，所以 capture 无法测试它们。

## a2a toolset 是客户端 {#s-serve-a2a-the-a2a-toolset-is-the-client-side}

智能体文件用 `type: a2a` toolset 调用远程 A2A 智能体。它接受 `url`、可选的 `name` 和 `headers`，例如给 `--auth-token` 用的 bearer 令牌 {{docs-agent A2A Tool}}。

schema 增加了 `allow_private_ips`，允许调用非公网 IP 地址。它对 `fetch`、`api`、`openapi` 和 `a2a` 类型以及远程 MCP toolset 有效 {{schema allow_private_ips}}。没有它，客户端在直连路径上拒绝 loopback，所以调用 `127.0.0.1:8082` 需要 `allow_private_ips: true`。capture 没有运行那个 toolset。协议本身见 [A2A 课程](phases/13-tools-and-protocols/19-a2a-protocol)。

```takeaways
- 从 `/.well-known/agent-card.json` 取 card，然后 POST 到它的 `supportedInterfaces` URL。
- 从任务的 artifacts 读取回答，绝不要从 `history` 读。
- 调用 `serve a2a` 的客户端要接受空的 skill 名称和空的 mode 列表。
- 对调用 loopback 服务器的 `a2a` toolset 设置 `allow_private_ips: true`。
```

Sources: help-agent docker-agent serve a2a (research/sources/help-docker-agent.md); docs-agent A2A Protocol, A2A Tool (research/sources/docs-docker-agent.md); schema allow_private_ips (research/sources/agent-schema.json); rel-agent v1.59.0, v1.129.0 (research/sources/docker-agent-CHANGELOG.md); research/conflicts-register.md rows C64, C70, C71; research/plan.md, Part 6; manuals/a2a-101/sections/2-1-agentcard-fields.md, 4-1-send-message.md, 2-2-discovery-and-supported-interfaces.md, 3-3-artifact-and-chunks.md, 5-1-json-rpc.md, 6-2-extensions.md; capture/README.md; capture/fixtures/agents/pong.yaml; capture/out/23-agent-card.json, 23-a2a.http
