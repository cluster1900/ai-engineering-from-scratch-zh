# JSON-RPC

> JSON-RPC 把每个操作都 POST 到同一个 URL，在 `method` 中给出操作名，在 `params` 中携带请求消息，并在一个 200 回复中返回响应消息或错误。

planner 在发送任何 diff 之前先问 `code-reviewer` 一个问题："What languages can you review?"。card 列出了绑定为 `JSONRPC` 的 `http://localhost:41242/a2a/jsonrpc`，所以 planner 向这个 URL 发送一个 POST。审查者以一条消息回答，没有任务，记录是 `02-message-reply.http`。

读完本节后，你能把任何 A2A 调用写成 JSON-RPC 请求，并读懂它的回复、流帧和错误。

## 信封 {#s-json-rpc-the-envelope}

**协议绑定：** 十一个操作在一种传输上采用的形式，包括名称、路由、信封、头和错误形状。标准绑定有三种：JSON-RPC {{spec §9}}、gRPC {{spec §10}} 和 HTTP+JSON {{spec §11}}，card 在 `protocolBinding` 中给出每一种 {{proto AgentInterface}}。核心概念指南仍然说每个请求和响应都以 JSON-RPC 2.0 作为负载格式 {{docs key-concepts}}。那描述的只是三种绑定中的一种（[冲突 D27](#s-ref-sources)）。

JSON-RPC 请求是一个有四个成员的 JSON 对象 {{spec §9.3}}。`jsonrpc` 始终是 `2.0`，客户端选择 `id`，`method` 存放操作名，`params` 存放请求消息。方法名采用 PascalCase，与 gRPC 的名称一样 {{spec §9.1}}，所以 `method` 存放 `SendMessage` 或 `GetTask`，即 `A2AService` 的 rpc 名称 {{proto A2AService}}。§9.3 中的模板仍然显示 0.3 的风格 `"method": "category/action"` {{spec §9.3}}，所以要从 §9.1 或[按绑定列出的操作](#s-ref-operations-by-binding)复制名称（[冲突 D14](#s-ref-sources)）。kit 对旧名称 `message/send` 回答 `-32601`，`11-errors.http` 的第 3 次交换展示了这一点。

回复重复请求的 `id`，并在 `result` 中存放响应消息 {{spec §9.4.1}}。对于 `SendMessage`，该消息是一个带有一个 `task` 或一个 `message` 的 `SendMessageResponse` {{proto SendMessageResponse}}：

```listing
title: a question and its direct answer over JSON-RPC
source: capture/out/02-message-reply.http
lang: http
note: The Host and A2A-Version headers and the parts of both messages are cut. [Send message](#s-send-message) explains when the result is a message and when it is a task.
---
POST /a2a/jsonrpc HTTP/1.1
Content-Type: application/json
…
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "SendMessage",
  "params": {
    "message": {
      "messageId": "d95bafc8-f2a4-427b-9cf4-bb99f4bea973",
      "role": "ROLE_USER",
…
HTTP/1.1 200 OK
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "message": {
      "messageId": "3b4b1206-4b6f-467f-b735-2d7e4f7f4bcd",
      "contextId": "dc423c62-d5f4-48e5-82c0-4963b9bc4334",
      "role": "ROLE_AGENT",
…
```

## 一个 URL，一种内容类型 {#s-json-rpc-one-url-one-content-type}

每次调用都是对所选接口 URL 的一个 POST，因为该绑定是基于 HTTP 或 HTTPS 的 JSON-RPC 2.0 {{spec §9.1}}。路径不带操作名，kit 在 `/a2a/jsonrpc` 提供全部十一个操作。请求和回复都使用 `application/json` {{spec §9.1}}，而 HTTP+JSON 使用它自己的类型，[HTTP+JSON](#s-http-json) 一节对此有解释。

正文旁边的请求头是两个服务参数 `A2A-Version` 和 `A2A-Extensions`，在这种绑定中它们必须作为标准 HTTP 请求头传输 {{spec §9.2}}。[A2A-Version 和 A2A-Extensions](#s-version-and-extension-headers) 一节给出了它们的规则，以及每个 SDK 在缺少它们时的行为。

## 作为 SSE 帧的流 {#s-json-rpc-streams-as-sse-frames}

`SendStreamingMessage` 和 `SubscribeToTask` 以 `Content-Type: text/event-stream` 回答，而不是一个 JSON 正文 {{spec §9.4.2}}。每个 `data:` 行都是一个完整的 JSON-RPC 响应：与请求相同的 `id`，以及 `result` 中的一个 `StreamResponse` {{spec §9.4.2}} {{proto StreamResponse}}。所以同一个解析器既能读单个回复，也能读每一帧。

```listing
title: the first two frames of a stream, each a full JSON-RPC response
source: capture/out/05-streaming.http
lang: sse
note: The request and the inside of each frame are cut. The file holds all nine frames, and 05-streaming.events.json prints them in full.
---
HTTP/1.1 200 OK
Content-Type: text/event-stream

data: {"jsonrpc": "2.0", "id": 1, "result": {"task": {"id": "728ba084-97eb-422b-b94b-b0fe9153ce2c", …

data: {"jsonrpc": "2.0", "id": 1, "result": {"statusUpdate": {"taskId": "728ba084-97eb-422b-b94b-b0fe9153ce2c", …
```

HTTP+JSON 的帧只带 `StreamResponse`，gRPC 则返回一个服务端流式 rpc，[HTTP+JSON](#s-http-json) 和 [gRPC](#s-grpc) 两节展示了这一点。在每种绑定中，帧都带有同样的四种负载，并因同样的原因结束，[流式传输与订阅](#s-streaming-and-subscribe-to-task)一节讲解了这些。

## 同一信封中的错误 {#s-json-rpc-errors-in-the-same-envelope}

失败的调用仍然是一个 JSON-RPC 响应：一个带有 `code`、`message` 和 `data` 的 `error` 成员取代了 `result` {{spec §9.5}}。规范没有为这种情况设定 HTTP 状态，kit 和参考 SDK 发送 `200` {{sdk src/a2a/server/routes/jsonrpc_dispatcher.py}}。A2A 错误使用 `-32001` 到 `-32009` 的代码，指明每种错误的详情在 `data` 中。[错误](#s-errors)一节在每种绑定中读取它们。

```takeaways
- 把每个操作都 POST 到 card 上那一个 JSON-RPC URL，在 `method` 中使用 PascalCase 名称。
- 发送 `Content-Type: application/json`，并从 `result` 中读取响应消息。
- 把每个 SSE `data:` 行解析为一个带有请求 `id` 的完整 JSON-RPC 响应。
- 在读取 `result` 之前，检查每个回复和每一帧中是否有 `error` 成员。
```

Sources: spec §9, §9.1, §9.2, §9.3, §9.4.1, §9.4.2, §9.5, §10, §11 (research/sources/specification.md); proto AgentInterface, A2AService, SendMessageResponse, StreamResponse (research/sources/a2a.proto); docs key-concepts (research/sources/docs.md); sdk src/a2a/server/routes/jsonrpc_dispatcher.py (a2a-python 1.2.2); capture/out/02-message-reply.http, 05-streaming.http, 05-streaming.events.json, 11-errors.http; capture/a2a_ref.py
