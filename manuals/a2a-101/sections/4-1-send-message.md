# SendMessage

> `SendMessage` 携带一条消息和一个 `SendMessageConfiguration`，agent 以一个 `Message` 或一个 `Task` 回答，默认情况下这个 task 处于终止状态或中断状态。

你的 planner 通过同一个方法给 `code-reviewer` 发送两条消息。第一条问它审查哪些语言，答案以一条消息立即到达。第二条带着一个 diff，答案是一个带有 id、状态以及之后的 artifact 的任务。

读完本节后，你能构建一个 `SendMessage` 请求，并根据返回的任一形状采取行动。

## 请求及其配置 {#s-send-message-the-request-and-its-configuration}

**SendMessageRequest：** 一个 `message`（按 [Message](#s-message) 一节的定义）、一个可选的 `configuration` 以及 `metadata` {{proto SendMessageRequest}}。配置有四个字段 {{proto SendMessageConfiguration}}：

- `acceptedOutputModes`：客户端接受的媒体类型。
- `taskPushNotificationConfig`：一个 webhook，[推送通知配置](#s-push-notification-configs)一节对此有解释。
- `historyLength`：返回的任务带有多少历史。
- `returnImmediately`：服务器是否在任务稳定之前就回答。

除非 `returnImmediately` 为 `true`，否则发送会阻塞：

```rule
label: the blocking default
source: spec §3.2.2
---
The operation must wait to return until the task reaches a terminal state or an interrupted state. The terminal states are `TASK_STATE_COMPLETED`, `TASK_STATE_FAILED`, `TASK_STATE_CANCELED`, and `TASK_STATE_REJECTED`. The interrupted states are `TASK_STATE_INPUT_REQUIRED` and `TASK_STATE_AUTH_REQUIRED`.
```

在 `03-blocking-task.http` 中，一个没有 `configuration` 的 `SendMessage` 得到处于 `TASK_STATE_COMPLETED` 的任务 `3d8f7801`，带有全部 artifact {{spec §3.2.2}}。客户端从未看到 `TASK_STATE_SUBMITTED` 或 `TASK_STATE_WORKING`。规范没有设定时间限制，超时的客户端永远不会得知任务 id {{spec §3.4.2}}。

规范中有一句话说的正相反（[冲突 D2](#s-ref-sources)）：该操作必须立即返回任务信息或一条响应消息 {{spec §3.1.1}}。proto 把 `false` 设为默认值 {{proto SendMessageConfiguration}}，而 proto 是规范性的 {{spec §1.4}}。kit 和参考 SDK 都会阻塞 {{sdk src/a2a/server/request_handlers/default_request_handler_v2.py}}。

对于配置中的 `historyLength` 是否裁剪返回的任务，各 SDK 不一致：

| SDK | 返回任务上的 `configuration.historyLength` |
|---|---|
| a2a-python 1.2.2 | 应用于返回的 `Task` 和流中的 `task` 事件，负值是 `InvalidParamsError` {{sdk src/a2a/server/request_handlers/default_request_handler_v2.py}} |
| a2a-go | 从不应用，所以任务带着完整的存储历史返回 {{sdk-go a2asrv/handler.go at v2.6.0}} |
| a2a-java | 应用于返回的 `Task` 和流中的每个 `Task` 事件，负值是 `InvalidParamsError` {{sdk-java requesthandlers/DefaultRequestHandler.java at v1.4.0.Final}} |
| a2a-js | 应用于返回的任务和流中的 `task` 负载，0 或更小的值会省略历史 {{sdk-js src/server/request_handler/default_request_handler.ts at v1.3.0}} |
| a2a-dotnet | 服务器从不读取，所以任务带着完整的存储历史返回 {{sdk-dotnet src/A2A/Server/A2AServer.cs at v1.0.0-preview2}} |
| a2a-rs | 只应用于阻塞发送返回的 `Task`，流会忽略它 {{sdk-rust a2a-server/src/handler.rs at a2a-server-lf-v0.5.1}} |

## Message 还是 Task {#s-send-message-message-or-task}

`SendMessage` 返回一个 `SendMessageResponse`，其负载是包含 `task` 和 `message` 两个成员的 `oneof` {{proto SendMessageResponse}}。由 agent 决定，规范没有给它任何规则。agent 可以创建一个新的 `Task` 并异步处理消息。对于简单的交流，它也可以返回一个直接的 `Message` {{spec §3.1.1}}。

在 kit 中，`test-runner` 和 `deployer` 为每条消息创建一个任务。当请求没有 `text/x-diff` part 且其文本以问号结尾时，`code-reviewer` 以消息回答（[kit 的 agent 代码](manuals/a2a-101/capture/agents.py)）。一旦任务存在，选择就结束了：从那以后，agent 只以 `Task` 对象回应消息 {{docs life-of-a-task}}。

消息就是完整的答案，没有可以轮询、取消或订阅的 id。它带有一个 `contextId` {{proto Message}}，所以为后续保留它。任务则是对可能比这次调用活得更久的工作的句柄。[图](#fig-message-or-task)把 `code-reviewer` 的两个答案并排放在一起。`SendStreamingMessage` 在它的第一个事件中做同样的选择，[SendStreamingMessage 与 SubscribeToTask](#s-streaming-and-subscribe-to-task) 一节展示了这一点。

```figure
id: fig-message-or-task
kind: decision
title: one method, two result shapes
claim: The same `SendMessage` to `code-reviewer` returns a message for a question and a task for a diff, and only the task gives the client something to follow.
caption: Read top down. The agent's own logic picks the shape, here the review_quick rule of the kit's agent code. Left, the captured message reply. Right, the captured input-required task. Ids are shortened to 8 characters.
```

## 立即返回并用 GetTask 轮询 {#s-send-message-returning-at-once-and-polling-with-gettask}

**returnImmediately：** `SendMessageConfiguration` 中的一个布尔值，要求服务器在任务一存在时就回答。该操作必须在创建任务后立即返回，即使工作仍在进行 {{spec §3.2.2}}。这个标志对直接的 `Message` 回复、流式操作或推送通知配置都没有影响 {{spec §3.2.2}}。

**轮询：** 用 `GetTask` 读取任务，直到它的状态告诉你停下。在 `04-polling.http` 中，kit 用 `returnImmediately` 发送，然后以 `historyLength` 0 轮询任务 `d0c28826` 两次：

```listing
title: a send that returns at once, then two polls
source: capture/out/04-polling.http
lang: json
note: The send and the first GetTask request are cut to their key lines. The second GetTask request matches the first apart from its JSON-RPC id. Each reply is cut to its state, and the first poll also shows its one log part.
---
    "configuration": {
      "returnImmediately": true
    }
…
        "state": "TASK_STATE_SUBMITTED",
…
  "method": "GetTask",
  "params": {
    "id": "d0c28826-28b8-4b15-8b53-4e01ae7a5a3c",
    "historyLength": 0
  }
…
      "state": "TASK_STATE_WORKING",
…
            "text": "collected 12 items\n"
…
      "state": "TASK_STATE_COMPLETED",
```

发送返回 `TASK_STATE_SUBMITTED`，而规范的示例写的是 `TASK_STATE_WORKING` 和 `TASK_STATE_INPUT_REQUIRED` {{spec §3.2.2}}，所以要根据你得到的状态分支。第一次轮询发现 `TASK_STATE_WORKING` 和一个日志 part。第二次发现带有全部 artifact 的 `TASK_STATE_COMPLETED`。[图](#fig-blocking-and-return)把阻塞调用与立即返回及其两次轮询并排放置。

```figure
id: fig-blocking-and-return
kind: timeline
title: a blocking call and a call that returns at once
claim: A blocking send holds one request open until this task completes, while `returnImmediately` answers at `TASK_STATE_SUBMITTED` and leaves the client to poll.
caption: Both tasks are aligned at the request and run through the same states on the kit's clock. Filled squares are states a reply showed the client, and hollow squares are states it never saw. Green ticks are artifact updates, and violet bars are open requests. From capture/out/03-blocking-task.http and 04-polling.http.
```

## 根据结果分派 {#s-send-message-dispatch-on-the-result}

kit 的 planner 在接触任何一个成员之前，先测试哪个成员存在：

```listing
title: the planner's dispatch on a SendMessage result
source: capture/planner.py
lang: python
note: The top of the loop in Planner.delegate. The interrupted states are handled below this cut.
---
        while True:
            if "error" in reply:
                self.note(f"  error {reply['error']['code']}: {reply['error']['message']}")
                return None
            result = reply["result"]
            if "message" in result:
                self.note("  direct reply, no task to follow")
                return result["message"]
            task = result["task"] if "task" in result else result
            state = task["status"]["state"]
            self.note(f"  task {task['id'][:8]} is {state}")
            if state in TERMINAL:
                return task
```

planner 先检查 `error`，因为 JSON-RPC 错误在 HTTP 200 响应中到达。然后它检查 `message` 并停止。只有在这之后，它才根据任务的状态分支，状态的定义见 [Task、TaskStatus 和 TaskState](#s-task-and-task-state)。[客户端](#s-a-client)一节讲解了这个循环的其余部分。

```takeaways
- 在每个 `SendMessage` 结果中测试 `message` 和 `task`，绝不假定某个 agent 只返回一种形状。
- 只要你打算轮询、订阅或等待 webhook，就设置 `returnImmediately: true`。
- 根据每个回复的状态分支，包括阻塞发送提前返回的 `TASK_STATE_SUBMITTED`。
```

Sources: spec §1.4, §3.1.1, §3.2.2, §3.4.2 (research/sources/specification.md); proto SendMessageRequest, SendMessageConfiguration, SendMessageResponse, Message (research/sources/a2a.proto); docs docs/topics/life-of-a-task.md at v1.0.1; sdk src/a2a/server/request_handlers/default_request_handler_v2.py (a2a-python 1.2.2); sdk-go a2asrv/handler.go at v2.6.0; sdk-java server-common/src/main/java/org/a2aproject/sdk/server/requesthandlers/DefaultRequestHandler.java at v1.4.0.Final; sdk-js src/server/request_handler/default_request_handler.ts at v1.3.0; sdk-dotnet src/A2A/Server/A2AServer.cs at v1.0.0-preview2; sdk-rust a2a-server/src/handler.rs at a2a-server-lf-v0.5.1; capture/out/02-message-reply.http, 03-blocking-task.http, 04-polling.http, 06-input-required.http; capture/agents.py, capture/planner.py
