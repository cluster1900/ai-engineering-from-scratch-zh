# 逐个请求看一个任务

> test-runner 的一次流式运行按顺序展示了协议的每个部分，从读取 card 到服务器关闭流的那一刻。

你的 planner 想在 commit `9f3c2e1` 上运行 `payments-api` 的单元测试，并想在测试运行时看着日志增长。它已经持有 `test-runner` 的 card，其 capabilities 包含 `"streaming": true`，所以它用 `SendStreamingMessage` 发送请求。

本节根据[流式 capture](manuals/a2a-101/capture/out/05-streaming.http)逐帧跟踪这次运行，[图](#fig-one-streamed-task)展示了它。读完本节后，你能读懂任意任务流，并说出每一帧改变了存储的任务中的什么。

```figure
id: fig-one-streamed-task
kind: sequence
title: one streamed task from the card read to the close
claim: A streamed task opens with the task itself, reports its work as status and artifact frames, and ends when the server closes the stream after the terminal status.
caption: Read top to bottom. Unnumbered rows come before the stream, and each numbered row is one data frame, numbered as in the streaming capture. Timestamps on the right come from the kit clock, and the task id is shortened to 8 characters.
```

## 第一帧之前 {#s-one-task-request-by-request-before-the-first-frame}

除非 card 把 `capabilities.streaming` 设为 `true`，否则 agent 必须用 `UnsupportedOperationError` 拒绝 `SendStreamingMessage` {{spec §3.3.4}}，[发现](#s-discovery-and-supported-interfaces)一节解释了这一点。请求本身很短：

```listing
title: the request that opens the stream
source: capture/out/05-streaming.http
lang: http
note: The first lines of the JSON-RPC envelope and its closing brackets are cut.
---
POST /a2a/jsonrpc HTTP/1.1
Host: localhost:41241
Content-Type: application/json
A2A-Version: 1.0
Accept: text/event-stream
…
  "method": "SendStreamingMessage",
  "params": {
    "message": {
      "messageId": "5bc8fbbc-bde5-4099-8164-d8399f767c45",
      "role": "ROLE_USER",
      "parts": [
        {
          "text": "Run the unit tests for payments-api at commit 9f3c2e1"
        }
      ]
…
```

客户端自己生成了 `messageId`，没有发送 `taskId` 和 `contextId`，所以由 agent 创建这两者。响应头是 `HTTP/1.1 200 OK`，带有 `Content-Type: text/event-stream`。之后的每个事件都是一行 `data:`，其中是一个完整的 JSON-RPC 响应，带有请求的 `id`，即 `1` {{spec §9.4.2}}。

## 第 1 帧：任务出现 {#s-one-task-request-by-request-frame-1-the-task-appears}

任务流有固定的开头：流必须以 `Task` 对象开始 {{spec §3.1.2}}。这个任务已经处于 `TASK_STATE_SUBMITTED`：

```listing
title: frame 1, the new task
source: capture/out/05-streaming.events.json
lang: json
note: The JSON-RPC envelope, the message parts, and the closing brackets are cut.
---
"task": {
  "id": "728ba084-97eb-422b-b94b-b0fe9153ce2c",
  "contextId": "c026046c-6890-4830-9618-8fffa35cb080",
  "status": {
    "state": "TASK_STATE_SUBMITTED",
    "timestamp": "2026-10-06T09:00:01.750Z"
  },
  "history": [
    {
      "messageId": "5bc8fbbc-bde5-4099-8164-d8399f767c45",
      "contextId": "c026046c-6890-4830-9618-8fffa35cb080",
      "taskId": "728ba084-97eb-422b-b94b-b0fe9153ce2c",
      "role": "ROLE_USER",
      …
```

服务器生成了任务 `728ba084` 和 context `c026046c`，并把两个 id 都写进它保存的 planner 消息副本。从这里开始，planner 用这两个 id 匹配每一帧。kit 填写了第一个状态中可选的 `timestamp` {{proto TaskStatus}}，而 SDK 省略了它，[kit 的 README](manuals/a2a-101/capture/README.md) 列出了这一差异。

## 第 2 帧：工作开始 {#s-one-task-request-by-request-frame-2-the-work-starts}

第 2 帧是一个 `statusUpdate`，它把任务移到 `TASK_STATE_WORKING`，状态消息是 "Checking out 9f3c2e1 and starting the suite"。每个状态事件都会写明它的任务和 context，因为 `taskId`、`contextId` 和 `status` 都是 REQUIRED {{proto TaskStatusUpdateEvent}}。

## 第 3 到 8 帧：结果分块到达 {#s-one-task-request-by-request-frames-3-to-8-the-results-arrive-in-pieces}

接下来的六帧是 `artifactUpdate` 事件，这种类型没有时间戳字段 {{proto TaskArtifactUpdateEvent}}。第 3 到 7 帧构建一个 artifact `test-log`，每次加入日志的一行：

- 第 3 帧带有 `artifactId` `test-log`、`name` `test-log.txt` 和第一个 part。它没有 `append`，所以它开始这个 artifact。
- 第 4、5、6 帧重复 `artifactId`，省略 `name`，并设置 `append: true`。
- 第 7 帧同时设置 `append: true` 和 `lastChunk: true`，所以日志完整了。
- 第 8 帧用一个分块开始第二个 artifact `summary`：一个媒体类型为 `application/json` 的 data part，以及 `lastChunk: true`。

`lastChunk` 只结束一个 artifact，不结束别的：第 8 帧带有它自己的 `lastChunk`，而任务仍在运行。[Artifact 与分块](#s-artifact-and-chunks)一节展示了客户端如何拼接分块，以及规范没有规定的部分。

## 第 9 帧与关闭 {#s-one-task-request-by-request-frame-9-and-the-close}

第 9 帧是最后一个 `statusUpdate`。它在 `09:00:02.250Z` 把任务移到 `TASK_STATE_COMPLETED`，状态消息是 "1 failed, 11 passed"。虽然有一个测试失败，任务仍然是完成的，因为这个失败是结果的一部分。

然后服务器关闭连接，没有任何帧宣告这一点，因为 1.0 版移除了 `final` 标志 {{docs whats-new-v1}}。规则是：任务到达终止状态时，流必须关闭 {{spec §3.1.2}}。在中断状态下，规范对流是否关闭自相矛盾（[冲突 D3](#s-ref-sources)）。[中断状态](#s-input-required-and-auth-required)一节说明了流何时关闭，它的[图](#fig-auth-required)跟踪了一个保持打开的流。

## 流结束后的任务 {#s-one-task-request-by-request-the-task-after-the-stream}

关闭之后，任务仍留在存储中，客户端用 `GetTask` 把它读回来。这个操作在收到推送通知后或流结束后读取任务的最终状态 {{spec §3.1.3}}。[GetTask 与 ListTasks](#s-get-task-and-list-tasks) 一节讲解它返回什么。

```takeaways
- 从第一帧取得任务 id 和 context id，并用它们匹配之后的每一帧。
- 把 `lastChunk` 当作一个 artifact 的结束，绝不当作任务的结束。
- 流关闭后，用 `GetTask` 确认任务的状态。
```

Sources: spec §3.1.2, §3.1.3, §3.3.4, §9.4.2 (research/sources/specification.md); proto TaskStatus, TaskStatusUpdateEvent, TaskArtifactUpdateEvent (research/sources/a2a.proto); docs whats-new-v1 (research/sources/docs.md); capture/README.md, capture/a2a_ref.py; capture/out/01-agent-cards.http, 05-streaming.http, 05-streaming.events.json
