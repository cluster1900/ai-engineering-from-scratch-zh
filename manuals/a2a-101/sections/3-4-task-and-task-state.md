# Task、TaskStatus 和 TaskState

> 一个 `Task` 带有一个 `TaskStatus`，其 `state` 是九个 `TaskState` 值之一，而规范给出了这些值的名称，却没有给出它们之间的转换表。

你的 planner 同时持有三个任务：`test-runner` 上的测试、`code-reviewer` 上的审查和 `deployer` 上的部署。每个都是一个带有 `status` 的 `Task`，planner 的下一步动作取决于 `status.state`：等待、行动或停止。

读完本节后，你能读懂 `Task` 的每个字段，对每个 `TaskState` 值进行分类，并说出规范定义了哪些转换。

## Task {#s-task-and-task-state-task}

**Task：** A2A 中的基本工作单元，具有唯一的 id {{spec §2.2}}。proto 给 `Task` 六个字段，并把 `id` 和 `status` 标为 REQUIRED {{proto Task}}。服务器创建 `id` {{proto Task}}，客户端不能提供它 {{spec §3.4.2}}。

可选字段是 `contextId`、`artifacts`、`history` 和 `metadata` {{proto Task}}。[contextId](#s-context-id)、[Artifact 与分块](#s-artifact-and-chunks)和 [GetTask 与 ListTasks](#s-get-task-and-list-tasks) 三节依次讲解前三个。[图](#fig-task-object-model)展示了阻塞运行中的任务 `3d8f7801`。

```figure
id: fig-task-object-model
kind: structure
title: the object model of one task
claim: A task carries its own id, its context, one current status, its artifacts, and its history, and every message and artifact inside it is made of parts.
caption: Read the task table from the top, in the order the blocking run filled it. The boxes on the right expand its last two rows, and the chips below show the four kinds of part. Values come from the blocking-task capture, ids shortened to 8 characters. The raw and url examples come from the input-required and error captures.
```

## TaskStatus {#s-task-and-task-state-taskstatus}

**TaskStatus：** 任务的当前状态，其中 `state` 是 REQUIRED，`message` 和 `timestamp` 是可选的 {{proto TaskStatus}}。message 属于这个状态 {{proto TaskStatus}}，timestamp 是记录该状态时的 ISO 8601 时间 {{proto TaskStatus}}。

一个任务同一时间只有一个状态，之前的状态消息可以移入 `history`，`06-input-required.http` 展示了这一点。

## TaskState {#s-task-and-task-state-taskstate}

枚举 `TaskState` 有九个值，编号为 0 到 8 {{proto TaskState}}。在 JSON 中，状态以它的名称传输 {{spec §5.5}}。

**终止状态：** 让任务永久结束的状态。proto 把四个值标为终止状态 {{proto TaskState}}。

**中断状态：** 任务在其中等待来自 agent 外部的某样东西的状态。proto 把两个值标为中断状态 {{proto TaskState}}。

**活动状态：** 本手册对 `TASK_STATE_SUBMITTED` 和 `TASK_STATE_WORKING` 的称呼，proto 没有把它们归入任何一组。

| 值 | 编号 | 类别 | 在 kit 中 |
|---|---|---|---|
| `TASK_STATE_UNSPECIFIED` | 0 | 无 | 从未发送 |
| `TASK_STATE_SUBMITTED` | 1 | 活动 | 每个新任务，`04-polling.http` |
| `TASK_STATE_WORKING` | 2 | 活动 | 测试套件运行中，`05-streaming.http` |
| `TASK_STATE_COMPLETED` | 3 | 终止 | 测试结束，`03-blocking-task.http` |
| `TASK_STATE_FAILED` | 4 | 终止 | commit `deadbee`，`09-failed.http` |
| `TASK_STATE_CANCELED` | 5 | 终止 | `CancelTask` 之后，`10-cancel.http` |
| `TASK_STATE_INPUT_REQUIRED` | 6 | 中断 | 关于基准分支的问题，`06-input-required.http` |
| `TASK_STATE_REJECTED` | 7 | 终止 | 一次生产环境部署，`08-rejected.http` |
| `TASK_STATE_AUTH_REQUIRED` | 8 | 中断 | 等待操作员，`07-auth-required.http` |

`TASK_STATE_UNSPECIFIED` 是 proto3 的零值，用于状态未知的任务 {{proto TaskState}}。kit 从不发送它，所以把它和任何未知的名称都当作错误。

客户端两组名称都需要，因为阻塞的 `SendMessage` 会在终止状态或中断状态时返回 {{spec §3.2.2}}，[SendMessage](#s-send-message) 一节展示了这一点。

## 规范允许的转换 {#s-task-and-task-state-the-transitions-the-specification-allows}

规范说任务会经历一个定义好的生命周期 {{spec §2.2}}，但无论是它的正文还是 proto 都没有转换表。它关于转换的说法可以归纳为四条规则：

- 输入：agent 可以在工作期间把任务移到 `input-required` 状态，以请求更多输入 {{spec §3.4.3}}。那是 `TASK_STATE_INPUT_REQUIRED` 在 0.3 版中的名称（[冲突 D37](#s-ref-sources)）。
- 授权：agent 要请求授权，"MUST transition the TaskState to `TASK_STATE_AUTH_REQUIRED`"，并且可以在没有客户端消息的情况下恢复 {{spec §7.6.1}}。
- 拒绝：agent 可以在创建任务时或之后拒绝它 {{proto TaskState}}。
- 终结：终止的任务拒绝消息 {{spec §3.1.1}}、取消 {{spec §3.1.5}} 和订阅 {{spec §3.1.6}}。

迁移指南说 1.0 让取消的状态转换更清楚了 {{docs whats-new-v1}}，而规范一个都没有列出（[冲突 D38](#s-ref-sources)）。扩展指南列出了添加新状态或新转换的扩展 {{docs extensions}}。它又说扩展应使用现有的枚举值 {{docs extensions}}（[冲突 D29](#s-ref-sources)）。只预期这九个值。

协议中没有转换表，所以一个 agent 的转换就是它的代码发出的任何转换。[图](#fig-task-states)汇集了 kit 的 agent 做出的每个转换。

```figure
id: fig-task-states
kind: state
title: the nine task states and the transitions the kit makes
claim: The kit's captures show nine transitions between task states, and none of them leaves a double-bordered terminal state.
caption: Boxes are TaskState values with the TASK_STATE_ prefix dropped. Dashed arrows are the transitions the kit's agents make, in capture order, labelled with the capture that shows each one. Read them as one implementation's behavior, never as the protocol's rules. Blocking captures return only the final state, so their earlier transitions come from the history they return and from the kit's agent code.
```

deployer 在没有客户端消息的情况下离开 `TASK_STATE_AUTH_REQUIRED`，这是规范允许的 {{spec §7.6.1}}，并直接从 `TASK_STATE_SUBMITTED` 拒绝。参考 SDK 也不强制任何转换表 {{sdk src/a2a/server/agent_execution/active_task.py}}，所以要接受从非终止状态出发的任何转换。

终止的任务会以 `UnsupportedOperationError` 拒绝针对其 `taskId` 的消息和 `SubscribeToTask`，以 `TaskNotCancelableError` 拒绝 `CancelTask` {{spec §3.1.1}} {{spec §3.1.5}} {{spec §3.1.6}}。[CancelTask 与终止状态](#s-cancel-task-and-terminal-states)一节讲解这四种结局，[状态表](#s-ref-task-states)列出了客户端针对每个值的下一步。

```takeaways
- 把两组写死：终止状态是 `COMPLETED`、`FAILED`、`CANCELED`、`REJECTED`，中断状态是 `INPUT_REQUIRED`、`AUTH_REQUIRED`，每个都带 `TASK_STATE_` 前缀。
- 按名称比较状态，把 `TASK_STATE_UNSPECIFIED` 或未知的名称当作错误。
- 接受从非终止状态出发的任何转换，包括创建后立即拒绝。
- 在发消息、取消或订阅之前先检查状态，因为这三者在终止的任务上都会失败。
```

Sources: spec §2.2, §3.1.1, §3.1.5, §3.1.6, §3.2.2, §3.4.2, §3.4.3, §5.5, §7.6.1 (research/sources/specification.md); proto Task, TaskStatus, TaskState (research/sources/a2a.proto); docs docs/topics/extensions.md and docs/whats-new-v1.md at v1.0.1; sdk src/a2a/server/agent_execution/active_task.py at a2a-python 1.2.2; capture/out/03-blocking-task.http, 04-polling.http, 05-streaming.http, 06-input-required.http, 07-auth-required.http, 08-rejected.http, 09-failed.http, 10-cancel.http, 11-errors.http; capture/agents.py
