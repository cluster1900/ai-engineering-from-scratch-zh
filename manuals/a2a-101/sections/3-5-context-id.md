# contextId

> `contextId` 把许多任务归入一次对话，`taskId` 把许多消息归入一项工作，而只有服务器会创建任务 id。

`code-reviewer` 在审查到一半时停下来，问你的 planner 该用哪个基准分支。答案必须送回同一次审查。之后 diff 变了，planner 想要第二次审查，并让它记得第一次。这由两个 id 承载：表示这项工作的任务 id，以及表示这次对话的 context id。

读完本节后，你能继续一个任务，在同一个 context 中开始后续任务，并知道每个 id 由谁创建。

## 两个 id，两种范围 {#s-context-id-two-ids-two-scopes}

**Context：** 一个可选的标识符，把相关的任务和消息归为一组 {{spec §2.2}}。具有相同 `contextId` 的任务和消息应被视为同一个对话会话 {{spec §3.4.1}}。

**任务 id：** 一项有状态工作的 id。服务器在响应消息创建新任务时生成任务 id {{spec §3.4.2}}。[Message](#s-message) 一节给出了回传它的规则。

context 通常也由服务器创建。agent 可以为不带 `contextId` 的消息生成一个新的 `contextId` {{spec §3.4.1}}，响应必须带上它 {{spec §3.4.1}}。在 kit 中，每条第一次发送的消息都不带 id，而每个回答，即使是 `02-message-reply.http` 中的直接回复，都会带回一个新的 context。

客户端应把来自服务器的 `contextId` 视为不透明的标识符 {{spec §3.4.1}}。在这个 id 背后，agent 可以在多次交互之间保存内部状态、对话历史或 LLM 上下文 {{spec §3.4.1}}。

只有在你了解服务器会如何处理时，才提议你自己的 context id {{spec §3.4.1}}。无法接受它的服务器必须以错误拒绝请求，并且不得为响应生成新的 `contextId` {{spec §3.4.1}}。概念指南把 context id 描述为由服务器生成的标识符 {{docs key-concepts}}，这没有给提议留下余地（[冲突 D28](#s-ref-sources)）。以规范为准，所以两种回应都要预料到。

## 继续一个任务 {#s-context-id-continuing-a-task}

当任务在等你时，就在同一个任务上回答，并发送它的两个 id，正如 [Message](#s-message) 一节所解释的。[中断状态](#s-input-required-and-auth-required)一节跟踪了审查的回答。

只有非终止的任务才接收更多消息 {{spec §3.3.3}}。发给已结束任务的消息会以 `UnsupportedOperationError` 失败，[CancelTask 与终止状态](#s-cancel-task-and-terminal-states)一节展示了这一点。

## 后续是一个新任务 {#s-context-id-a-follow-up-is-a-new-task}

审查完成后，第二轮不能重新打开它。改进必须在同一个 `contextId` 中开始一个新任务 {{docs life-of-a-task}}。规范为此给了客户端两个字段。客户端可以发送不带 `taskId` 的 `contextId`，在现有 context 中开始一个新任务 {{spec §3.4.3}}。客户端应使用消息的 `referenceTaskIds` 字段指向相关的任务 {{spec §3.4.3}}。

捕获在这样的后续之前就停止了。kit 的服务器会接受它：给定 `contextId` 而没有 `taskId` 时，它的 `send` 会在该 context 中创建一个新任务。[kit 的服务器代码](manuals/a2a-101/capture/a2a_ref.py)展示了这一点。[图](#fig-context-and-tasks)把捕获的审查与客户端接下来会发送的后续并排画出。

```figure
id: fig-context-and-tasks
kind: tree
title: one context, two tasks
claim: The review task holds both exchanges of the conversation, and a follow-up review joins the same context as a new task, because the review task is terminal.
caption: Read top down: the context, its tasks, and each task's history in order. The dashed task and its message show what a client sends next, because the captures stop before it. Ids shortened to 8 characters. From capture/out/06-input-required.http and capture/out/13-history.http.
```

没有什么限制一个 context 同一时间只能有一个任务：agent 可以为每条后续消息创建一个单独的并行任务 {{docs life-of-a-task}}。

## agent 保留什么 {#s-context-id-what-the-agent-keeps}

审查任务在 `history` 中保留了它的四条消息，[GetTask 与 ListTasks](#s-get-task-and-list-tasks) 一节展示了如何读取它们。不要把这份历史当作完整的记录，因为 agent 决定在任务历史中保留哪些消息 {{spec §3.7}}。特别是，任务创建之前的消息可能不在历史中 {{spec §3.7}}。

context 也不会永远存在。agent 可以让 context 过期或清理它们，并应记录任何此类策略 {{spec §3.4.1}}。在依赖一个旧的 context id 之前，先查看 agent 的文档。

```takeaways
- 第一条消息不带任何 id，然后保存服务器返回的 `taskId` 和 `contextId`。
- 继续非终止的任务时，在每条消息中带上它的两个 id。
- 到达终止状态后，发送后续时使用同一个 `contextId`，不带 `taskId`，并把旧任务放进 `referenceTaskIds`。
- 把 context id 视为 agent 可能让其过期的不透明标识符。
```

Sources: spec §2.2, §3.3.3, §3.4.1, §3.4.2, §3.4.3, §3.7 (research/sources/specification.md); proto Task (research/sources/a2a.proto); docs docs/topics/key-concepts.md and docs/topics/life-of-a-task.md at v1.0.1; capture/out/02-message-reply.http, 06-input-required.http, 10-cancel.http, 13-history.http; capture/a2a_ref.py
