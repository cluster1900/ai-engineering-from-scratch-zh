# 任务状态

> 九个值描述一个任务，当前值是活动、中断还是终止状态，告诉客户端接下来能做什么。

proto 把四个状态标为终止状态，两个标为中断状态 {{proto TaskState}}。proto 和正文都没有给出状态转换表，所以由 agent 决定顺序。阻塞式的 `SendMessage` 在终止状态或中断状态时返回 {{spec §3.2.2}}。[Task、TaskStatus 和 TaskState](#s-task-and-task-state) 一节对这些值做了分类，并汇总了 kit 所做的转换。[中断状态](#s-input-required-and-auth-required)和 [CancelTask 与终止状态](#s-cancel-task-and-terminal-states)两节解释了客户端的下一步。

| 状态 | 类别 | 设置者 | 客户端接下来做什么 |
|---|---|---|---|
| TASK_STATE_UNSPECIFIED | 无 | 无人设置：零值 | 把它以及任何未知名称视为错误。 |
| TASK_STATE_SUBMITTED | 活动 | 服务器，在创建时 | 等待、轮询或订阅。 |
| TASK_STATE_WORKING | 活动 | agent，在工作期间 | 与已提交的任务相同 |
| TASK_STATE_INPUT_REQUIRED | 中断 | agent，附带一个问题 | 用一条带有相同 `taskId` 和 `contextId` 的新消息回答。 |
| TASK_STATE_AUTH_REQUIRED | 中断 | agent，为了一次授权 | 在 A2A 之外把请求交给批准它的人，并订阅、注册 webhook 或轮询。 |
| TASK_STATE_COMPLETED | 终止 | agent，在工作完成时 | 读取 artifact 获得结果。用 `referenceTaskIds` 在新任务中跟进。 |
| TASK_STATE_FAILED | 终止 | agent，无法完成工作 | 读取状态消息，修正输入，然后开始一个新任务。 |
| TASK_STATE_CANCELED | 终止 | agent，在 `CancelTask` 之后 | 在同一个 context 中开始一个新任务。 |
| TASK_STATE_REJECTED | 终止 | agent，拒绝该任务 | 停止循环，并按状态消息行事。 |

在任务结束之前，`CancelTask` 请求服务器停止它，但不保证成功 {{spec §3.1.5}}。终止的任务永远不会改变。针对它的 `taskId` 发送的消息和 `SubscribeToTask` 会以 `UnsupportedOperationError` 失败，`CancelTask` 会以 `TaskNotCancelableError` 失败 {{spec §3.1.1}} {{spec §3.1.5}} {{spec §3.1.6}}。只要服务器还保留它，`GetTask` 仍会返回它 {{spec §3.1.3}}。

当任务到达终止状态时，流必须关闭 {{spec §3.1.2}}。在中断状态下，各来源说法不一（[冲突 D3](#s-ref-sources-the-conflict-register)）。kit 在 `TASK_STATE_INPUT_REQUIRED` 时关闭它的流，在 `TASK_STATE_AUTH_REQUIRED` 期间保持打开，正如 kit README 所列。所以在任何关闭之后，都调用 `GetTask`，并根据它返回的状态行事。

Sources: proto TaskState (research/sources/a2a.proto); spec §3.1.1, §3.1.2, §3.1.3, §3.1.5, §3.1.6, §3.2.2, §3.3.2, §3.4.3, §7.6.1, §7.6.2 (research/sources/specification.md); docs life-of-a-task (research/sources/docs.md); research/brief-spec.md sections 4.1 to 4.5, 5.4 and 12.2; manuals/a2a-101/capture/README.md; capture/out/03-blocking-task.http, 04-polling.http, 05-streaming.http, 06-input-required.http, 07-auth-required.http, 08-rejected.http, 09-failed.http, 10-cancel.http
