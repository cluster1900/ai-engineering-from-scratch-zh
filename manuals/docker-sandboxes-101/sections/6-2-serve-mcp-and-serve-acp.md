# serve mcp 和 serve acp

> `serve mcp` 通过 stdio 或端口 8081 上的流式 HTTP 把每个智能体暴露为一个 MCP 工具，`serve acp` 通过 stdio 用 Agent Client Protocol 与编辑器对话。

你的 MCP 客户端已经在调用工具，你的编辑器已经在与编码智能体对话。它们都不读智能体文件。`serve mcp` 把智能体变成前者的工具，`serve acp` 把它变成后者的编辑器智能体。

读完本节后，你能把智能体作为 MCP 工具提供服务，读它的 schema，并从编辑器打开一个 ACP 会话。

## serve mcp：一个智能体，一个工具 {#s-serve-mcp-and-serve-acp-serve-mcp-one-agent-one-tool}

**serve mcp：** 启动一个 MCP 服务器，通过 Model Context Protocol 提供该智能体，默认使用 stdio 传输 {{help-agent docker-agent serve mcp}}。`--http` 切换到 `127.0.0.1:8081` 上的流式 HTTP。没有 `-a` 时，团队文件中的每个智能体都成为自己的工具，当只暴露一个智能体时 `--tool-name` 重命名该工具 {{help-agent docker-agent serve mcp}}。

`--attach` 暴露正在运行的 TUI 的会话，按 pid、地址或会话 id 查找。`--mcp-keepalive` 只在 stdio 上有效，而 `--auth-token`、`--insecure-no-auth` 和 `--safety` 只与 `--http` 一起工作 {{help-agent docker-agent serve mcp}}。在 HTTP 上，安全策略默认为 `restricted` {{docs-agent MCP Mode}}。

capture 运行了 `serve mcp fixtures/agents/pong.yaml --http --listen 127.0.0.1:8081 --tool-name pong`，使用的是 [serve api 和 serve chat](#s-serve-api-and-serve-chat) 的那个文件：

```listing
title: 对 /mcp 的 initialize、tools/list 和 tools/call
source: capture/out/23-mcp.http
lang: http
note: 头部、客户端信息，以及 notifications/initialized 交换已删节。tools/list 那一行在工具定义内部被删节。
---
POST /mcp HTTP/1.1
…
  "method": "initialize",
  "params": {
    "protocolVersion": "2026-07-28",
…
Content-Type: text/event-stream
…
event: message
data: {"jsonrpc":"2.0","id":1,"result":{"capabilities":{"logging":{},"tools":{"listChanged":true}},"protocolVersion":"2025-11-25","serverInfo":{"name":"docker agent","version":"v1.149.0"}}}
…
data: {"jsonrpc":"2.0","id":2,"result":{"ttlMs":0,"cacheScope":"public","tools":[{"annotations":{"destructiveHint":false,"idempotentHint":true,"openWorldHint":false,"readOnlyHint":true,…"inputSchema":{…"properties":{"message":{"description":"the message to send to the agent","type":"string"}},"required":["message"],"type":"object"},"name":"pong","outputSchema":{…
…
data: {"jsonrpc":"2.0","id":3,"result":{"content":[{"type":"text","text":"{\"response\":\"pong\"}"}],"structuredContent":{"response":"pong"}}}
```

客户端请求的修订是 `2026-07-28`，v1.129.0 把它与无状态 Streamable HTTP 传输一起加入 {{rel-agent v1.129.0}}。服务器回答 `2025-11-25`，所以要从结果中读取版本，绝不要从你的请求中读取。没有响应带有 `Mcp-Session-Id` 头。每个回答都作为一条 SSE `message` 事件到来，通知得到 `202 Accepted`（[该 capture](manuals/docker-sandboxes-101/capture/out/23-mcp.http)）。

该工具接受一个字符串 `message`，并返回 `structuredContent.response`，与 `content` 中作为 JSON 字符串的同一段文本。它的 annotations 把它标为只读且幂等，它的 title 是智能体的 `description`。`tools/call` 的回答在整轮结束后作为一条事件到来，之前没有进度通知。kit README 还写到服务器在 `/` 和 `/mcp` 上都做了回答（[该 capture](manuals/docker-sandboxes-101/capture/README.md)）。文档用 `claude mcp add --transport stdio` 把 stdio 形式注册到 Claude Code，后面跟 `-- docker agent serve mcp` 和智能体引用 {{docs-agent MCP Mode}}。

## serve acp：发给编辑器的 JSON-RPC 行 {#s-serve-mcp-and-serve-acp-serve-acp-json-rpc-lines-to-an-editor}

**serve acp：** 一个通过 stdio（标准输入和输出）对话的服务器 {{docs-agent ACP}}。编辑器启动 `docker-agent serve acp FILE`，向其 stdin 写入 JSON-RPC 请求，并从 stdout 读取响应和通知。会话保存在 `<data-dir>/session.db` 中，除非 `-s` 指定另一个文件 {{help-agent docker-agent serve acp}}。团队文件同样可用，文档说它的子智能体对 ACP 无需改动 {{docs-agent ACP}}。

```listing
title: 通过 stdio 的 initialize 和 session/new
source: capture/out/23-acp.jsonl
lang: jsonl
note: 标有 >> 的行写入 stdin，标有 << 的行从 stdout 读出。每个对象都在内部、在每个标记处被删节。
---
>> {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": 1, …}}
<< {"id": 1, "jsonrpc": "2.0", "result": {"agentCapabilities": {"auth": {"logout": {}}, "loadSession": true, …, "agentInfo": {"name": "docker agent", "title": "docker agent", "version": "v1.149.0"}, …, "protocolVersion": 1}}
>> {"jsonrpc": "2.0", "id": 2, "method": "session/new", "params": {"cwd": "$CAPTURE", "mcpServers": []}}
<< {"jsonrpc": "2.0", "method": "session/update", "params": {"sessionId": "<uuid>", "update": {"availableCommands": [{"description": "Summarize and compact session history", …, "name": "compact"}, {"description": "Display current context token usage and session cost", "name": "usage"}], "sessionUpdate": "available_commands_update"}}}
<< {"id": 2, "jsonrpc": "2.0", "result": {"configOptions": [{"category": "mode", "currentValue": "default", …}], "modes": {…, "currentModeId": "default"}, "sessionId": "<uuid>"}}
```

`initialize` 返回 `agentCapabilities`：`loadSession`、通过 HTTP 和 SSE 的 MCP 服务器、音频、图像和嵌入上下文的 prompt，以及会话操作 `close`、`delete`、`list` 和 `resume`。它提供一种认证方法 `host-credentials`，这是 v1.144.0 与会话删除一起加入的 {{rel-agent v1.144.0}}。在 `session/new` 结果之前，一条 `session/update` 通知列出斜杠命令。v1.143.0 发布宣布了 `/compact`、`/usage` 和 `/new` {{rel-agent v1.143.0}}，而录到的列表里没有 `new`。

会话以模式 `default` 开始，它自动批准只读工具，其余的会询问。模式列表把 `default` 加到 `--safety` 的四个值上。客户端用 `session/set_config_option` 或更早的 `session/set_mode` 更改模式 {{rel-agent v1.144.0}}。capture 停在 `session/new`，所以没有展示 ACP 上的 prompt 轮次。文档用方法 `agent/run` 勾画主机侧，并称那段代码为伪代码 {{docs-agent ACP}}。请使用 capture 中的方法名。

```figure
id: fig-6-2
kind: flow
title: 同一个智能体文件通过 ACP 和 MCP 提供服务
claim: 同一个 pong.yaml 通过 stdin 和 stdout 回答编辑器，并通过发往端口 8081 的 HTTP POST 回答 MCP 客户端，两条路径上的方法名不同.
caption: 从左到右读每个条带。每个条带下的方框按顺序列出录到的消息，>> 表示请求，<< 表示响应或通知。 From capture/out/23-acp.jsonl and 23-mcp.http.
```

对于 `serve mcp` 下的协议，阅读 [MCP 传输课程](phases/13-tools-and-protocols/09-mcp-transports)。

```takeaways
- 从 `initialize` 结果中读取 `protocolVersion`，绝不要从你自己的请求中读取。
- 给被服务的智能体一个说明该工具做什么的 `--tool-name`。
- 在 `serve mcp --http` 上设置 `--safety` 和 `--auth-token`，因为 stdio 两者都不接受。
- 用 `session/set_config_option` 按会话选择 ACP 模式。
```

Sources: help-agent docker-agent serve mcp, serve acp (research/sources/help-docker-agent.md); docs-agent MCP Mode, ACP (research/sources/docs-docker-agent.md); rel-agent v1.129.0, v1.143.0, v1.144.0 (research/sources/docker-agent-CHANGELOG.md); research/plan.md, Part 6; capture/README.md; capture/fixtures/agents/pong.yaml; capture/out/23-mcp.http, 23-acp.jsonl
