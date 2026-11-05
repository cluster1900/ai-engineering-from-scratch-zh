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
label: 默认阻塞
source: spec §3.2.2
---
该操作必须等到任务进入终止状态或中断状态后才返回。终止状态是 `TASK_STATE_COMPLETED`、`TASK_STATE_FAILED`、`TASK_STATE_CANCELED` 和 `TASK_STATE_REJECTED`。中断状态是 `TASK_STATE_INPUT_REQUIRED` 和 `TASK_STATE_AUTH_REQUIRED`。
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
title: 一个方法，两种结果形状
claim: 发给 `code-reviewer` 的同一次 `SendMessage`，对问题返回一条消息，对 diff 返回一个任务，只有任务给客户端留下可以跟进的东西.
caption: 从上到下读。形状由 agent 自己的逻辑选择，这里是 kit 的 agent 代码中的 review_quick 规则。左侧是已捕获的消息回复。右侧是已捕获的 input-required 任务。id 缩短为 8 个字符。
```

## 立即返回并用 GetTask 轮询 {#s-send-message-returning-at-once-and-polling-with-gettask}

**returnImmediately：** `SendMessageConfiguration` 中的一个布尔值，要求服务器在任务一存在时就回答。该操作必须在创建任务后立即返回，即使工作仍在进行 {{spec §3.2.2}}。这个标志对直接的 `Message` 回复、流式操作或推送通知配置都没有影响 {{spec §3.2.2}}。

**轮询：** 用 `GetTask` 读取任务，直到它的状态告诉你停下。在 `04-polling.http` 中，kit 用 `returnImmediately` 发送，然后以 `historyLength` 0 轮询任务 `d0c28826` 两次：

```listing
title: 一次立即返回的发送，然后两次轮询
source: capture/out/04-polling.http
lang: json
note: 发送和第一次 GetTask 请求删节到关键行。第二次 GetTask 请求除 JSON-RPC id 外与第一次相同。每个回复删节到其 state，第一次轮询还展示了它唯一的日志 part。
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
title: 一次阻塞调用，和一次立即返回的调用
claim: 阻塞发送把一个请求保持打开，直到这个任务完成；`returnImmediately` 则在 `TASK_STATE_SUBMITTED` 时回答，并把轮询留给客户端.
caption: 两个任务在请求处对齐，并在 kit 的时钟上经过同样的状态。实心方块是回复向客户端展示过的状态，空心方块是它从未看到的状态。绿色刻度是 artifact 更新，紫色条是仍打开的请求。来自 capture/out/03-blocking-task.http 和 04-polling.http。
```

## 根据结果分派 {#s-send-message-dispatch-on-the-result}

kit 的 planner 在接触任何一个成员之前，先测试哪个成员存在：

```listing
title: planner 对 SendMessage 结果的分派
source: capture/planner.py
lang: python
note: Planner.delegate 中循环的开头。中断状态在这次删节之下处理。
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
