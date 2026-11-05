# 中断状态：INPUT_REQUIRED 和 AUTH_REQUIRED

> 任务可以停下来等你，两种等待在不同的地方得到回应：输入在任务本身上回答，授权在协议之外完成。

planner 把 `payments-api` 的一个 diff 发给 `code-reviewer` 请求审查。审查者无法开始，因为它不知道这个 diff 是相对于哪个分支的。之后 planner 请 `deployer` 把构建 `2026.10.06-1` 部署到 staging，那个任务会停下来，直到操作员批准。

两个任务都没有失败。读完本节后，你能认出中断的任务，在正确的地方回应它，并察觉它恢复的时刻。

## 两种等待的状态 {#s-input-required-and-auth-required-two-states-that-wait}

**中断状态：** agent 已停止工作、需要某样东西才能继续的状态。proto 恰好把两个状态这样标记，即 `TASK_STATE_INPUT_REQUIRED` 和 `TASK_STATE_AUTH_REQUIRED`，并把它们各自标为中断状态 {{proto TaskState}}。

中断的任务保留它的 id、历史和 artifact，它的状态消息说明 agent 需要什么。阻塞的 `SendMessage` 在任务一进入这两种状态之一时就返回 {{spec §3.2.2}}。`TASK_STATE_INPUT_REQUIRED` 需要一个回答，作为同一任务上的新消息发送。`TASK_STATE_AUTH_REQUIRED` 需要一个凭据或一次批准，在 A2A 之外发送，任务可以在没有客户端消息的情况下恢复。

## 在同一个任务上回答 {#s-input-required-and-auth-required-answering-on-the-same-task}

审查者为 planner 的 diff 创建任务 `e5c95b09`，然后停下，阻塞调用返回带着问题的任务：

```listing
title: 第一次回复：一个提问的任务
source: capture/out/06-input-required.http
lang: json
note: 任务上方的信封、状态消息内部的 id 和 history 已删节。history 里只有 planner 的第一条消息。
---
    "task": {
      "id": "e5c95b09-6d4b-4b3b-8693-91e81472d12f",
      "contextId": "49c5a238-4158-455d-8d63-b2cb39c0ecac",
      "status": {
        "state": "TASK_STATE_INPUT_REQUIRED",
        "message": {
          …
          "role": "ROLE_AGENT",
          "parts": [
            {
              "text": "Which base branch should I compare this diff against?"
            }
          ]
        },
        "timestamp": "2026-10-06T09:00:00.500Z"
      },
      …
```

回答是一个指明该任务的普通 `SendMessage`：客户端以一条具有相同 `taskId` 和 `contextId` 的新消息继续 {{spec §3.4.3}}。planner 带着两个 id 回答 `main`。第二个回复返回处于 `TASK_STATE_COMPLETED` 的同一个任务，带有 `review.json` artifact。[图](#fig-input-required)跟踪了整个交流过程。

```figure
id: fig-input-required
kind: sequence
title: 审查提出的问题及其回答
claim: 问题作为暂停任务的状态消息到达，回答是一条携带相同任务 id 和 context id 的新消息.
caption: 从上到下读。第 1 到第 3 步是第一次 `SendMessage` 及其回复，第 4 到第 9 步在同一个任务上回答这个问题。id 缩短为 8 个字符。来自 capture/out/06-input-required.http。
```

## 在 A2A 之外到达的授权 {#s-input-required-and-auth-required-authorization-that-arrives-outside-a2a}

agent 可能在任务进行到一半时需要许可，例如在执行破坏性操作之前需要人工批准 {{spec §7.6}}。这样的 agent 必须把任务移到 `TASK_STATE_AUTH_REQUIRED` {{spec §7.6.1}}。凭据走的是另一条路：

```rule
label: 凭据走哪条通道
source: spec §7.6.1
---
agent 必须通过 A2A 之外的通道获取凭据。例外是双方在 A2A 之外或通过扩展约定好的带内机制。
```

deployer 的第三个流帧指出了操作员进行批准的地方：

```listing
title: 第 3 帧：部署请求批准
source: capture/out/07-auth-required.events.json
lang: json
note: JSON-RPC 信封和状态消息内部的 id 已删节。
---
          "statusUpdate": {
            "taskId": "ecf2dcb6-79c8-48f8-8868-24a0541781f4",
            "contextId": "9e8e6bcf-b117-48b9-992a-67971cddcb1b",
            "status": {
              "state": "TASK_STATE_AUTH_REQUIRED",
              "message": {
                …
                "role": "ROLE_AGENT",
                "parts": [
                  {
                    "text": "An operator must approve this deploy at http://localhost:41243/approve/ecf2dcb6-79c8-48f8-8868-24a0541781f4"
                  }
                ]
              },
              "timestamp": "2026-10-06T09:00:00.750Z"
            }
          }
```

批准从不进入协议。在 kit 中，操作员向 deployer 发送 `POST /approve/<task id>`，[kit 的 README](manuals/a2a-101/capture/README.md) 列出了这一点。之后没有客户端消息。agent 收到凭据后，可以立即继续任务。客户端不必再发送一条消息 {{spec §7.6.1}}。

本身是 agent 的客户端可以把自己的任务移到 `TASK_STATE_AUTH_REQUIRED`，从而把请求向上游传递 {{spec §7.6.2}}。[安全方案与任务内授权](#s-security-schemes-and-in-task-authorization)一节讲解这样的链条对凭据有什么影响。

```figure
id: fig-auth-required
kind: sequence
title: 一次等待操作员的部署
claim: 部署在 `TASK_STATE_AUTH_REQUIRED` 中等待，流保持打开，操作员的批准在 A2A 之外传递，然后同一条流载回结果.
caption: 从上到下读。第 2 到第 4 步和第 7 到第 9 步是同一条流的六帧。第 5、6 步是 A2A 之外的普通 HTTP。id 缩短为 8 个字符。来自 capture/out/07-auth-required.http。
```

## 流何时关闭 {#s-input-required-and-auth-required-when-the-stream-closes}

在这次捕获中，流在等待期间一直保持打开。只有在终止状态时关闭才是 MUST {{spec §3.1.2}}，而 HTTP+JSON 绑定会在终止状态或中断状态时关闭 {{spec §11.7}}。在 A2A 之外等待凭据的 agent，在把任务移到 `TASK_STATE_AUTH_REQUIRED` 之后应保持它打开的响应流 {{spec §7.6.1}}。规范没有解决这一点（[冲突 D3](#s-ref-sources)）。

在上游，`dev-1.1` 分支上的 [PR #2270](https://github.com/a2aproject/A2A/pull/2270) 于 2026-09-29 获批但尚未发布，它让两种中断状态都成为非终止状态。它说进入其中之一并不要求关闭流。在 `main` 上，§11.7 和流式传输指南仍然在这两类状态时关闭。

kit 在 `TASK_STATE_INPUT_REQUIRED` 时关闭，在 `TASK_STATE_AUTH_REQUIRED` 期间保持打开，kit 的 README 列出了这一点。各 SDK 也同样分成两派：

| SDK | 服务器何时关闭 `SendStreamingMessage` 流 |
|---|---|
| a2a-python 1.2.2 | 在 agent 的 `execute()` 调用返回时，所以由 agent 代码决定 {{sdk src/a2a/server/agent_execution/active_task.py}} |
| a2a-go | 在一个 `Message`、终止状态或 `TASK_STATE_INPUT_REQUIRED` 之后，在 `TASK_STATE_AUTH_REQUIRED` 期间保持打开 {{sdk-go internal/taskupdate/final.go at v2.6.0}} |
| a2a-java | 在终止状态、一个 `Message` 或一个错误之后，两种中断状态在 `execute()` 返回后都让它保持打开 {{sdk-java events/EventConsumer.java at v1.4.0.Final}} |
| a2a-js | 在终止状态、`TASK_STATE_INPUT_REQUIRED` 或一个 `Message` 之后，`TASK_STATE_AUTH_REQUIRED` 让它保持打开 {{sdk-js src/server/events/execution_event_queue.ts at v1.3.0}} |
| a2a-dotnet | 在处理器返回时，或在它为终止状态或中断状态调用 `TaskUpdater` 方法时 {{sdk-dotnet src/A2A/Server/TaskUpdater.cs at v1.0.0-preview2}} |
| a2a-rs | 在终止事件之后或执行器的流结束时，对中断状态没有规则 {{sdk-rust a2a-server/src/handler.rs at a2a-server-lf-v0.5.1}} |

流关闭只结束你的观察，绝不结束任务。调用 `GetTask`，如果任务不是终止状态，就根据它的状态行动并调用 `SubscribeToTask`，[SendStreamingMessage 与 SubscribeToTask](#s-streaming-and-subscribe-to-task) 一节展示了这一点。

## 在别人行动时继续观察 {#s-input-required-and-auth-required-keep-watching-while-someone-else-acts}

没有打开的流，客户端可能错过任务更新 {{spec §7.6.2}}，所以要用 `SubscribeToTask` 订阅、注册一个 webhook，或者用 `GetTask` 轮询。

kit 的 planner 选择订阅。它的阻塞 `SendMessage` 返回处于 `TASK_STATE_AUTH_REQUIRED` 的任务 `a31361b3`，它立即调用 `SubscribeToTask`，见 `19-planner.http` 中的第 7 和第 8 次交换。它只在第一帧到达后才提醒操作员，因为规范没有定义对之前事件的重放。

```takeaways
- 用一条带有任务 `taskId` 和 `contextId` 的新消息回答 `TASK_STATE_INPUT_REQUIRED`。
- 通过 A2A 之外的渠道，把 `TASK_STATE_AUTH_REQUIRED` 请求转交给批准它的人。
- 在任何人处理批准请求之前，先订阅、注册 webhook 或轮询。
- 每当流关闭时就调用 `GetTask`，因为各服务器对何时关闭的看法不一致。
```

Sources: spec §3.1.2, §3.2.2, §3.4.3, §7.6, §7.6.1, §7.6.2, §11.7 (research/sources/specification.md); proto TaskState (research/sources/a2a.proto); sdk src/a2a/server/agent_execution/active_task.py (a2a-python 1.2.2); sdk-go internal/taskupdate/final.go at v2.6.0; sdk-java server-common/src/main/java/org/a2aproject/sdk/server/events/EventConsumer.java at v1.4.0.Final; sdk-js src/server/events/execution_event_queue.ts at v1.3.0; sdk-dotnet src/A2A/Server/TaskUpdater.cs at v1.0.0-preview2; sdk-rust a2a-server/src/handler.rs at a2a-server-lf-v0.5.1; a2aproject/A2A PR #2270 (unreleased, branch dev-1.1); capture/out/06-input-required.http, 07-auth-required.http, 07-auth-required.events.json, 19-planner.http; capture/planner.py; capture/README.md
