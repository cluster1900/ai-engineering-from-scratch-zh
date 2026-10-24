# SendStreamingMessage 与 SubscribeToTask

> 流是一个任务的实时视图，所以连接断开让你失去的是你离开期间发送的帧，绝不是任务本身。

planner 请 `test-runner` 在 commit `9f3c2e1` 上运行 `payments-api` 的完整测试套件，并在流上观看日志到达。收到四帧后，客户端关闭了连接。测试套件继续运行，planner 仍然想要日志的其余部分。

读完本节后，你能用这两个操作中的任一个打开流，判断它何时结束，并在断开后恢复它。

## 流承载什么 {#s-streaming-and-subscribe-to-task-what-a-stream-carries}

**流：** 一个类型为 `text/event-stream` 的 HTTP 响应，其正文是一系列 Server-Sent Events {{spec §9.4.2}} {{spec §11.7}}。每个事件带有一个 `StreamResponse`，其中恰好包含 `task`、`message`、`statusUpdate` 或 `artifactUpdate` 之一 {{proto StreamResponse}}。

有两个操作会打开流：`SendStreamingMessage` 发送一条消息并观看它启动的工作，`SubscribeToTask` 观看一个已经存在的任务 {{spec §3.5.1}}。

```listing
title: the first stream, closed by the client after four frames
source: capture/out/14-resubscribe.http
lang: sse
note: Each frame is cut inside its line. The last line is the kit's own note in the transcript, written when the client drops the connection.
---
HTTP/1.1 200 OK
Content-Type: text/event-stream

data: {"jsonrpc": "2.0", "id": 1, "result": {"task": {… "state": "TASK_STATE_SUBMITTED", …

data: {"jsonrpc": "2.0", "id": 1, "result": {"statusUpdate": {… "state": "TASK_STATE_WORKING", …

data: {"jsonrpc": "2.0", "id": 1, "result": {"artifactUpdate": {… "name": "test-log.txt", …

data: {"jsonrpc": "2.0", "id": 1, "result": {"artifactUpdate": {… "append": true}}}

# the client closes the connection after 4 events
```

流式传输指南把每个负载称为一个 JSON-RPC 2.0 Response 对象，通常是 `SendStreamingMessageResponse` {{docs streaming-and-async}}，而 proto 并未定义这个类型 {{proto A2AService}}（[冲突 D33](#s-ref-sources)）。迁移指南把更新成员命名为 `taskStatusUpdate` 和 `taskArtifactUpdate` {{docs whats-new-v1}}，而 proto 和这些帧写的是 `statusUpdate` 和 `artifactUpdate`（[冲突 D9](#s-ref-sources)）。按 proto 的名称匹配。

规范没有定义 `event:` 类型、`id:` 行、`retry:` 值或保活机制 {{spec §11.7}}。参考 SDK 会发送保活注释，并用 `event: error` 标记迟到的错误 {{sdk src/a2a/server/routes/jsonrpc_dispatcher.py}}，所以要跳过注释，并检查每个负载中是否有 `error`。

## 顺序与关闭 {#s-streaming-and-subscribe-to-task-order-and-the-close}

每个实现都必须按创建事件的顺序交付事件 {{spec §3.5.2}}，并且必须把每个事件发送给该任务的每个打开的流 {{spec §3.5.2}}。这些流中没有一个拥有该任务：

```rule
label: the stream is not the task
source: spec §3.5.2
---
The lifecycle of a task does not depend on the lifecycle of any one stream.
```

1.0 版没有结束标记，因为它从 `TaskStatusUpdateEvent` 中移除了布尔值 `final` {{docs whats-new-v1}}。任务流必须在任务到达终止状态时关闭 {{spec §3.1.2}}，`SubscribeToTask` 流也是如此 {{spec §3.1.6}}。在一个 `message` 帧之后，流立即关闭 {{spec §3.1.2}}。

在中断状态时，§11.7 和流式传输指南会关闭流，而 §7.6.1 要求 agent 在 `TASK_STATE_AUTH_REQUIRED` 时保持流打开 {{spec §11.7}} {{docs streaming-and-async}} {{spec §7.6.1}}（[冲突 D3](#s-ref-sources)）。[中断状态](#s-input-required-and-auth-required)一节列出了每个 SDK 在哪里关闭，所以关闭本身只意味着读取已经结束。

## 连接断开与 SubscribeToTask {#s-streaming-and-subscribe-to-task-a-dropped-connection-and-subscribetotask}

```figure
id: fig-stream-resubscribe
kind: sequence
title: a stream dropped after four frames and picked back up
claim: A dropped stream loses the frames sent while it was closed, and SubscribeToTask resumes with a Task snapshot that already holds their content.
caption: Read top to bottom. Steps 1 to 5 are the first stream, and only the writes nobody saw are drawn to the task store. Frame numbers count per stream. From capture/out/14-resubscribe.http, ids shortened to 8 characters.
```

在第 4 帧之后，agent 把分块 03 和 04 追加到 `test-log.txt`，没有打开的连接承载它们的 `artifactUpdate` 事件，如[图](#fig-stream-resubscribe)所示。这些事件丢失了，而存储的任务持有这两个分块。

**SubscribeToTask：** 给定任务的 `id`，在现有任务上打开新流的操作 {{proto SubscribeToTaskRequest}}。它的第一帧是一个快照：流的第一个事件必须是一个 `Task` 对象 {{spec §3.1.6}}。

```listing
title: the first frame after SubscribeToTask, a full Task snapshot
source: capture/out/14-resubscribe.events.json
lang: json
note: The status message and the history are cut, and so are parts 02 and 03 of the log.
---
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "task": {
      "id": "25239d4c-798b-4754-be06-d1f94d0645b1",
…
      "status": {
        "state": "TASK_STATE_WORKING",
…
      "artifacts": [
        {
          "artifactId": "test-log",
          "name": "test-log.txt",
          "parts": [
            {
              "text": "tests/test_suite_01.py ........\n"
…
              "text": "tests/test_suite_04.py ........\n"
```

第 2 到第 5 帧追加分块 05 到 08，第 6 帧带有 `TASK_STATE_COMPLETED` 和 `96 passed`。没有任何东西被重放，规范也没有定义游标。所以要用快照中的 artifact 替换你不完整的 `test-log.txt`，然后追加之后的帧。

快照只包含当前的 `status`，所以重新连接的客户端可能错过一些状态更新 {{spec §3.7}}，结果应该放在 artifact 中。

任务完成后再次调用 `SubscribeToTask` 会以 `UnsupportedOperationError`（`-32004`）失败，返回的是普通 JSON，没有流 {{spec §3.1.6}} {{sdk src/a2a/server/routes/jsonrpc_dispatcher.py}}。所以要停止重新连接，并用 `GetTask` 读取最终的任务，[GetTask 与 ListTasks](#s-get-task-and-list-tasks) 一节展示了这一点。

## HTTP+JSON 上的 subscribe 动词 {#s-streaming-and-subscribe-to-task-the-subscribe-verb-over-http-json}

HTTP+JSON 路由是 `/tasks/{id}:subscribe`，规范为它给出了两个动词。proto 把它绑定到 `GET` {{proto A2AService}}，而方法表和 URL 列表显示的是 `POST` {{spec §5.3}} {{spec §11.3.2}}（[冲突 D1](#s-ref-sources)）。2026-09-29，项目的指导委员会在 [PR #2068](https://github.com/a2aproject/A2A/pull/2068) 中选择了 `GET`，与 proto 一致。这一变更在 `dev-1.1` 分支上尚未发布，支持 `POST` 的 [PR #1891](https://github.com/a2aproject/A2A/pull/1891) 在 main 上仍然开着。各 SDK 分成三派：

| SDK | 服务器接受 | 客户端发送 |
|---|---|---|
| a2a-python 1.2.2 {{sdk src/a2a/server/routes/rest_routes.py}} | `GET` 和 `POST` | `POST` |
| a2a-go {{sdk-go a2asrv/rest.go at v2.6.0}} | `GET` 和 `POST` | `POST` |
| a2a-java {{sdk-java reference/rest/src/main/java/org/a2aproject/sdk/server/rest/quarkus/A2AServerRoutes.java at v1.4.0.Final}} | `POST` | `POST` |
| a2a-js {{sdk-js src/server/express/rest_handler.ts at v1.3.0}} | `GET` 和 `POST` | `POST` |
| a2a-dotnet {{sdk-dotnet src/A2A.AspNetCore/A2AEndpointRouteBuilderExtensions.cs at v1.0.0-preview2}} | `POST` | `POST` |
| a2a-rs {{sdk-rust a2a-server/src/rest.rs at a2a-server-lf-v0.5.1}} | `GET` 和 `POST` | `GET` |

`POST` 能到达全部六个服务器，`GET` 只能到达四个，所以像六个客户端中的五个那样发送 `POST`。服务器应两者都接受。

```takeaways
- 只有当最后一帧带有终止状态时，才把任务视为已结束，绝不只凭关闭判断。
- 断开后，调用 `SubscribeToTask`，并根据它的第一帧（`Task` 快照）重建你的副本。
- 当 `SubscribeToTask` 返回 `-32004` 时，停止重新连接，并用 `GetTask` 读取结果。
- 向 `/tasks/{id}:subscribe` 发送 `POST`，因为有两个 SDK 服务器不路由 `GET`。
```

Sources: spec §3.1.2, §3.1.6, §3.5.1, §3.5.2, §3.7, §5.3, §7.6.1, §9.4.2, §11.3.2, §11.7 (research/sources/specification.md); proto StreamResponse, SubscribeToTaskRequest, A2AService (research/sources/a2a.proto); docs whats-new-v1, streaming-and-async (research/sources/docs.md); a2aproject/A2A PR #2068 and PR #1891, checked 2026-10-06; sdk src/a2a/server/routes/jsonrpc_dispatcher.py, src/a2a/server/routes/rest_routes.py, src/a2a/client/transports/rest.py (a2a-python 1.2.2); sdk-go a2asrv/rest.go, a2aclient/rest.go (a2a-go v2.6.0); sdk-java reference/rest/src/main/java/org/a2aproject/sdk/server/rest/quarkus/A2AServerRoutes.java, client/transport/rest/src/main/java/org/a2aproject/sdk/client/transport/rest/RestTransport.java (a2a-java v1.4.0.Final); sdk-js src/server/express/rest_handler.ts, src/client/transports/rest_transport.ts (a2a-js v1.3.0); sdk-dotnet src/A2A.AspNetCore/A2AEndpointRouteBuilderExtensions.cs, src/A2A/Client/A2AHttpJsonClient.cs (a2a-dotnet v1.0.0-preview2); sdk-rust a2a-server/src/rest.rs, a2a-client/src/rest.rs (a2a-rs a2a-server-lf-v0.5.1); capture/out/14-resubscribe.http, 14-resubscribe.events.json
