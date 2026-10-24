# 错误

> 九种 A2A 错误映射到三种绑定中，而由于它们的状态码会重合，details 中的 `ErrorInfo` reason 才是区分它们的依据。

planner 向 `test-runner` 请求一个不存在的任务 id，在每种 JSON 绑定上各请求一次。JSON-RPC 以 `HTTP/1.1 200 OK` 和代码 `-32001` 回答，HTTP+JSON 以 `HTTP/1.1 404 Not Found` 回答。二者都带有同样的 `ErrorInfo`，reason 是 `TASK_NOT_FOUND`，如[图](#fig-task-not-found)所示。

读完本节后，你能读懂任何绑定中的错误，说出它背后的 A2A 错误，并选择下一步怎么做。

```figure
id: fig-task-not-found
kind: comparison
title: TaskNotFoundError in two JSON bindings
claim: The same TaskNotFoundError arrives as HTTP 200 with code -32001 in JSON-RPC and as HTTP 404 in HTTP+JSON, carrying the same ErrorInfo.
caption: Left, GetTask over JSON-RPC from the error capture. Right, the same lookup over HTTP+JSON from the HTTP+JSON capture. The box at the bottom is the detail both replies carry. Ids shortened to 8 characters.
```

## 指明错误的详情 {#s-errors-the-detail-that-names-the-error}

规范定义了九种 A2A 错误，并把每一种映射到每种绑定中 {{spec §3.3.2}} {{spec §5.4}}。JSON-RPC 给它们编号 `-32001` 到 `-32009` {{spec §9.5}}，HTTP 对其中七种回答 `400`，gRPC 对其中六种回答 `FAILED_PRECONDITION`，[错误表](#s-ref-errors)列出了这些。

每个错误都带有一个代码、一条消息和可选的 `details`，每个详情在 `@type` 中给出它的类型 {{spec §3.3.2}}。对于 A2A 错误，起决定作用的详情是一个 `google.rpc.ErrorInfo`：

```rule
label: the detail that names the error
source: spec §11.6
---
For an A2A error, an implementation must put a `google.rpc.ErrorInfo` object in the `details` array.
```

它的 `reason` 是去掉 `Error` 后缀的大写蛇形错误名，例如 `TASK_NOT_FOUND`，它的 `domain` 是 `a2a-protocol.org` {{spec §11.6}}。gRPC 绑定带有同样的 MUST {{spec §10.6}}，JSON-RPC 只是 SHOULD {{spec §9.5}}。`metadata` 是自由格式的：kit 会填写它，参考 SDK 则让它为空，kit 的 README 列出了这一点。

## JSON-RPC 错误随 HTTP 200 到达 {#s-errors-json-rpc-errors-arrive-with-http-200}

JSON-RPC 错误是一个带有 HTTP `200` 的普通响应。它的 `error` 成员在本该是 `result` 的位置存放 `code`、`message` 和 `data` {{spec §9.5}}。五个标准 JSON-RPC 代码，即 `-32700` 以及 `-32600` 到 `-32603`，保持它们原有的含义 {{spec §9.5}}。

验证错误带有另一种详情类型，即一个指明字段的 `google.rpc.BadRequest`：

```listing
title: a message without messageId, refused with a BadRequest detail
source: capture/out/11-errors.http
lang: http
note: The request is cut to the start of its message, which has no messageId.
---
    "message": {
      "role": "ROLE_USER",
…
HTTP/1.1 200 OK
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 4,
  "error": {
    "code": -32602,
    "message": "Invalid parameters",
    "data": [
      {
        "@type": "type.googleapis.com/google.rpc.BadRequest",
        "fieldViolations": [
          {
            "field": "message.messageId",
            "description": "messageId is required"
```

不要按消息文本匹配：参考 SDK 对同一种情况回答 "Validation failed"，并把字段命名为 `message.message_id` {{sdk src/a2a/utils/proto_utils.py}}。

认证可能在 JSON-RPC 运行之前就失败，规范的示例是 HTTP `401` {{spec §3.3.2}}，所以要先读状态，如[安全方案](#s-security-schemes-and-in-task-authorization)一节所示。

## HTTP+JSON 错误是 google.rpc.Status {#s-errors-http-json-errors-are-google-rpc-status}

HTTP+JSON 错误使用 HTTP 状态和一个 JSON 形式的 `google.rpc.Status` {{spec §11.6}}。它的 `error` 对象在 `code` 中重复状态，在 `status` 中给出 gRPC 状态名，并加上 `message` 和 `details`：

```listing
title: a cancel of a completed task over HTTP+JSON
source: capture/out/16-rest-binding.http
lang: http
note: The request headers and body are cut. Over JSON-RPC this error is code -32002, as in 10-cancel.http.
---
POST /a2a/rest/tasks/bbfb9ea5-50ea-4441-b991-2a8ba0d6f3f3:cancel HTTP/1.1
…
HTTP/1.1 400 Bad Request
Content-Type: application/a2a+json

{
  "error": {
    "code": 400,
    "status": "FAILED_PRECONDITION",
    "message": "Task cannot be canceled",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "TASK_NOT_CANCELABLE",
        "domain": "a2a-protocol.org",
        "metadata": {
          "taskId": "bbfb9ea5-50ea-4441-b991-2a8ba0d6f3f3",
          "state": "TASK_STATE_COMPLETED"
```

规范中有两个示例仍然显示旧的 RFC 9457 风格的 `application/problem+json` 正文 {{spec §6.4}} {{spec §6.5}}（[冲突 D13](#s-ref-sources)）。[PR #1641](https://github.com/a2aproject/A2A/pull/1641) 和 [PR #1689](https://github.com/a2aproject/A2A/pull/1689) 替换了这些示例，二者都仍未合并。迁移指南给出的类型是 `application/json` {{docs whats-new-v1}}，而 §11.6 显示的是 `application/a2a+json`。各 SDK 三种都有发送，并且都以 HTTP `200` 回答 JSON-RPC 错误：

| SDK | JSON-RPC 错误 | HTTP+JSON 错误 |
|---|---|---|
| a2a-python 1.2.2 | `application/json` {{sdk src/a2a/server/routes/jsonrpc_dispatcher.py}} | `application/json` {{sdk src/a2a/utils/error_handlers.py}} |
| a2a-go | `application/json` {{sdk-go a2asrv/jsonrpc.go at v2.6.0}} | `application/json` {{sdk-go a2asrv/rest.go at v2.6.0}} |
| a2a-java | `application/json` {{sdk-java reference/jsonrpc/src/main/java/org/a2aproject/sdk/server/apps/quarkus/A2AServerRoutes.java at v1.4.0.Final}} | `application/json` {{sdk-java transport/rest/src/main/java/org/a2aproject/sdk/transport/rest/handler/RestHandler.java at v1.4.0.Final}} |
| a2a-js | `application/json` {{sdk-js src/server/express/json_rpc_handler.ts at v1.3.0}} | `application/a2a+json` {{sdk-js src/server/express/rest_handler.ts at v1.3.0}} |
| a2a-dotnet | `application/json` {{sdk-dotnet src/A2A.AspNetCore/JsonRpcResponseResult.cs at v1.0.0-preview2}} | `application/problem+json`，一个 problem-details 正文 {{sdk-dotnet src/A2A.AspNetCore/A2AHttpProcessor.cs at v1.0.0-preview2}} |
| a2a-rs | `application/json` {{sdk-rust a2a-server/src/jsonrpc.rs at a2a-server-lf-v0.5.1}} | `application/problem+json` {{sdk-rust a2a-server/src/rest.rs at a2a-server-lf-v0.5.1}} |

发送 `application/a2a+json`，读取时三种类型都接受。无论类型怎么写，都把正文解析为 `google.rpc.Status`。例外是该版本的 a2a-dotnet，它的 problem-details 正文不带 `ErrorInfo`。gRPC 绑定把同样的三部分放在 `status.code`、`status.message` 和 `status.details` 中 {{spec §10.6}}。

## 该重试什么 {#s-errors-what-to-retry}

`UnsupportedOperationError` 用一个代码 `-32004` 和一个 reason `UNSUPPORTED_OPERATION` 涵盖三种问题 {{spec §3.3.4}} {{spec §3.1.1}} {{spec §3.1.6}}：card 缺少 `streaming` 或扩展 card，或者任务处于终止状态，如 `10-cancel.http` 中那样。只有 `message` 和 `metadata` 能区分这些情况，而规范两者都没有固定。所以当任务操作得到 `-32004` 时，先用 `GetTask` 读取任务再做决定。

大多数 A2A 错误描述的是请求或任务，所以重发同样的字节会得到同样的回答：

- `-32603`、HTTP `500` 或 `503`，或者连接断开：以退避方式重试，并遵守 `Retry-After` {{spec §3.3.2}}。
- HTTP `401`：获取新的凭据，然后重试。
- `-32600`、`-32602`、`-32005`、`-32009` 及其 `400` 形式：修正请求后再发送。
- `-32001`：停止，因为该 id 是错的、已被清除，或者对你不可见 {{spec §3.3.2}}。
- `-32002`，或终止任务上的 `-32004`：开始一个新任务，如 [CancelTask 与终止状态](#s-cancel-task-and-terminal-states)一节所示。
- `-32003`、`-32007`，或能力检查返回的 `-32004`：重新读取 card。

重试的 `SendMessage` 可能启动第二个任务，因为按 `messageId` 检测重复是可选的 {{spec §3.3.1}}。无论如何都要发送同一个 `messageId`，[Message](#s-message) 一节对此有解释。

```takeaways
- 先读 HTTP 状态，再读 JSON-RPC 的 `error` 成员或 `google.rpc.Status` 正文。
- 根据 `ErrorInfo` 的 `reason` 做决定，绝不只根据状态码或消息文本。
- 只重试传输错误和系统错误，并使用退避。
- 重试发送时保持同一个 `messageId`。
```

Sources: spec §3.1.1, §3.1.6, §3.3.1, §3.3.2, §3.3.4, §5.4, §6.4, §6.5, §9.5, §10.6, §11.6 (research/sources/specification.md); docs whats-new-v1 (research/sources/docs.md); a2aproject/A2A PR #1641 and PR #1689, checked 2026-10-06; sdk src/a2a/utils/proto_utils.py, src/a2a/utils/error_handlers.py, src/a2a/server/routes/jsonrpc_dispatcher.py (a2a-python 1.2.2); sdk-go a2asrv/jsonrpc.go, a2asrv/rest.go (a2a-go v2.6.0); sdk-java reference/jsonrpc/src/main/java/org/a2aproject/sdk/server/apps/quarkus/A2AServerRoutes.java, transport/rest/src/main/java/org/a2aproject/sdk/transport/rest/handler/RestHandler.java (a2a-java v1.4.0.Final); sdk-js src/server/express/json_rpc_handler.ts, src/server/express/rest_handler.ts (a2a-js v1.3.0); sdk-dotnet src/A2A.AspNetCore/JsonRpcResponseResult.cs, src/A2A.AspNetCore/A2AHttpProcessor.cs (a2a-dotnet v1.0.0-preview2); sdk-rust a2a-server/src/jsonrpc.rs, a2a-server/src/rest.rs (a2a-rs a2a-server-lf-v0.5.1); capture/out/11-errors.http, 16-rest-binding.http, 10-cancel.http, 14-resubscribe.http; capture/README.md
