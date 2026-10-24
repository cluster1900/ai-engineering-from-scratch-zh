# CancelTask 与终止状态

> 四种终止状态会结束一个任务，其中三种由 agent 选择，第四种由 CancelTask 请求，之后的任何调用都不能让任务离开终止状态。

planner 请 `test-runner` 在 commit `9f3c2e1` 上运行单元测试。一个测试失败了，任务以 `TASK_STATE_COMPLETED` 返回。只读状态的 planner 会部署有问题的代码，读取 artifact 的 planner 会停止发布。

读完本节后，你能区分四种结局，调用 `CancelTask`，并预测已结束的任务会如何回答。

## 终止状态 {#s-cancel-task-and-terminal-states-terminal-states}

**终止状态：** 结束任务的四种状态之一：`TASK_STATE_COMPLETED`、`TASK_STATE_FAILED`、`TASK_STATE_CANCELED` 和 `TASK_STATE_REJECTED`。proto 把每一种都标为终止状态 {{proto TaskState}}。

终止的任务永远不会再改变：一旦完成、取消、拒绝或失败，它就不能重新开始 {{docs life-of-a-task}}。[图](#fig-task-endings)把四种结局并排放置。

```figure
id: fig-task-endings
kind: comparison
title: four ways a task ends
claim: The agent chose three of these endings and the client one, and once a task ends, the server refuses any further message or cancel.
caption: Each card is one task from the kit: who chose the ending, the final status message, and the artifacts left behind. The bottom rows show what the canceled task answers afterwards. Ids are shortened to 8 characters. From capture/out/03-blocking-task.http, 09-failed.http, 10-cancel.http, and 08-rejected.http.
```

## agent 的三种结局 {#s-cancel-task-and-terminal-states-the-agent-s-three-endings}

任务 `3d8f7801` 在 `9f3c2e1` 上运行了测试套件。十二个测试中有一个失败，任务仍然以 `TASK_STATE_COMPLETED` 结束：

```listing
title: a completed task that reports a failing test
source: capture/out/03-blocking-task.http
lang: json
note: Cut to the state, the status message, and the start of the summary.json data part.
---
    "task": {
      "id": "3d8f7801-f421-4e4e-aa2d-8b6da17d9281",
      …
        "state": "TASK_STATE_COMPLETED",
        …
              "text": "1 failed, 11 passed"
      …
          "artifactId": "summary",
          "name": "summary.json",
          "parts": [
            {
              "data": {
                "passed": 11,
                "failed": 1,
```

完成的意思是任务成功结束了 {{proto TaskState}}，而这项工作是运行测试套件。代码好不好是一个结果，结果放在 artifact 中传输 {{spec §3.7}}。kit 的 planner 在部署之前读取 `summary.json` 中的 `failed` 计数。

commit `deadbee` 不存在，所以任务 `8ae21dcb` 以 `TASK_STATE_FAILED` 结束，意思是任务以错误结束 {{proto TaskState}}。同样的请求会以同样的方式失败，所以要修正输入并开始一个新任务。如果 agent 崩溃，参考 SDK 会把任务存为失败，但阻塞发送会得到一个错误 {{sdk src/a2a/server/agent_execution/active_task.py}}。把那个错误当作未知的结果。

planner 请 `deployer` 进行一次生产环境部署。任务 `23cf3710` 直接进入 `TASK_STATE_REJECTED`，意思是 agent 决定不做这个任务 {{proto TaskState}}。只在完成、失败和取消时停止的循环会永远轮询一个被拒绝的任务。同样的请求会得到同样的拒绝，所以要遵循状态消息："Production deploys are outside this agent's policy. Use the release train."

## CancelTask {#s-cancel-task-and-terminal-states-canceltask}

**CancelTask：** 给定任务的 `id`，请求服务器停止该任务的操作 {{proto CancelTaskRequest}}。planner 调用它时，任务 `f22ed7af` 正在运行完整的测试套件。回复是处于 `TASK_STATE_CANCELED` 的任务，带有它已经写入的两个日志分块。

取消是一个请求：服务器会尝试取消任务，但不保证成功 {{spec §3.1.5}}。规范没有说明服务器必须取消哪些未完成的状态，参考 SDK 会取消任何非终止的任务 {{sdk src/a2a/server/request_handlers/default_request_handler_v2.py}}。

第二次 `CancelTask` 会从 kit 和参考 SDK 得到 `TaskNotCancelableError`，即 `-32002` {{sdk src/a2a/server/request_handlers/default_request_handler_v2.py}}，正如 §3.1.5 对已结束任务所列的那样 {{spec §3.1.5}}。第 3.3.1 节与此不一致：它称 Cancel Task 是幂等的，所以多次取消请求具有相同的效果 {{spec §3.3.1}}。对已删除任务的重复请求可以返回 `TaskNotFoundError` {{spec §3.3.1}}。

所以在取消出错之后，调用 `GetTask`。已取消意味着之前的一次取消成功了，其他终止状态意味着任务先结束了，仍在运行意味着服务器无法停止它 {{spec §3.1.5}}。

## 对已结束任务的调用 {#s-cancel-task-and-terminal-states-calls-on-a-finished-task}

已结束的任务仍然会回答。`GetTask` 返回最终的任务 {{spec §3.1.3}}。带有其 `taskId` 的 `SendMessage` 会得到 `UnsupportedOperationError`，即 `-32004` {{spec §3.1.1}}，`SubscribeToTask` 也会得到同样的错误 {{spec §3.1.6}}。`CancelTask` 会得到 `TaskNotCancelableError` {{spec §3.1.5}}。`UnsupportedOperationError` 也涵盖无关的失败，所以要读取它的详情，[错误](#s-errors)一节对此有解释。

官方 SDK 发送同样的错误，在其他绑定中有两处差异：

| SDK | JSON-RPC | HTTP+JSON | gRPC |
|---|---|---|---|
| a2a-python 1.2.2 {{sdk src/a2a/server/agent_execution/active_task.py}} {{sdk src/a2a/utils/errors.py}} | `-32004` | `400` | `FAILED_PRECONDITION` |
| a2a-go {{sdk-go a2asrv/agentexec.go at v2.6.0}} | `-32004` | `400` | `FAILED_PRECONDITION` |
| a2a-java {{sdk-java server-common/src/main/java/org/a2aproject/sdk/server/requesthandlers/DefaultRequestHandler.java at v1.4.0.Final}} | `-32004` | `400` | `UNIMPLEMENTED` |
| a2a-js {{sdk-js src/server/request_handler/default_request_handler.ts at v1.3.0}} | `-32004` | `400` | `FAILED_PRECONDITION` |
| a2a-dotnet {{sdk-dotnet src/A2A/Server/A2AServer.cs at v1.0.0-preview2}} | `-32004` | `400`，带 problem-details 正文 | 该版本中没有 |
| a2a-rs {{sdk-rust a2a-server/src/handler.rs at a2a-server-lf-v0.5.1}} | `-32004` | `400` | `FAILED_PRECONDITION` |

a2a-java 以 `UNIMPLEMENTED` 回答 gRPC，而 §5.4 把该错误映射为 `FAILED_PRECONDITION` {{spec §5.4}}。a2a-go 在其实验性的集群模式中则回答 `InvalidParamsError`，即 `-32602` {{sdk-go internal/taskexec/distributed_manager.go at v2.6.0}}。

要继续，就在同一个 context 中开始一个新任务，并在 `referenceTaskIds` 中指明已结束的任务 {{spec §3.4.3}}，[contextId](#s-context-id) 一节展示了这一点。

```takeaways
- 在全部四种终止状态（包括 `TASK_STATE_REJECTED`）上停止每个等待或轮询循环。
- 从 artifact 中读取结果，因为一次已完成的测试运行可能带有失败的测试。
- 在取消出错之后，调用 `GetTask` 并根据它返回的状态行动。
- 在同一个 context 中用 `referenceTaskIds` 开始一个新任务，而不是给已结束的任务发消息。
```

Sources: spec §3.1.1, §3.1.3, §3.1.5, §3.1.6, §3.3.1, §3.4.3, §3.7, §5.4 (research/sources/specification.md); proto TaskState, CancelTaskRequest (research/sources/a2a.proto); docs life-of-a-task (research/sources/docs.md); sdk src/a2a/server/agent_execution/active_task.py, src/a2a/server/request_handlers/default_request_handler_v2.py, src/a2a/utils/errors.py (a2a-python 1.2.2); sdk-go a2asrv/agentexec.go, internal/taskexec/distributed_manager.go (a2a-go v2.6.0); sdk-java server-common/src/main/java/org/a2aproject/sdk/server/requesthandlers/DefaultRequestHandler.java (a2a-java v1.4.0.Final); sdk-js src/server/request_handler/default_request_handler.ts (a2a-js v1.3.0); sdk-dotnet src/A2A/Server/A2AServer.cs (a2a-dotnet v1.0.0-preview2); sdk-rust a2a-server/src/handler.rs (a2a-rs a2a-server-lf-v0.5.1); capture/out/03-blocking-task.http, 08-rejected.http, 09-failed.http, 10-cancel.http, 14-resubscribe.http; capture/planner.py
