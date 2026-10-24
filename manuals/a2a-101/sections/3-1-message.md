# Message

> `Message` 是对话中的一轮，它的 `role` 和三个 id 说明它往哪个方向传输，以及它延续哪个任务。

planner 给 `code-reviewer` 发送一个 diff 请它审查。审查方问要对照哪个基准分支，planner 回答 `main`，审查方以两条发现结束了任务。

读完本节后，你能构建一条有效的消息，并设置它的 id 来延续一个任务。

## messageId、role 和 parts {#s-message-messageid-role-and-parts}

**Message：** 客户端与服务器之间的一个通信单元 {{proto Message}}。它有八个字段，只有 `messageId`、`role` 和 `parts` 是 REQUIRED {{proto Message}}。`parts` 列表必须至少包含一个元素 {{spec §5.7}}，[Part](#s-part) 一节解释 part 包含什么。

[图](#fig-message-fields)把那次审查中的三条消息并排放置，并标出每个字段由谁设置。

```figure
id: fig-message-fields
kind: structure
title: who sets each field of a message
claim: A message carries an id its sender mints, while its `contextId` and `taskId` come from the server and the client echoes them to continue.
caption: Columns are three messages from the input-required capture, in the order they were sent. The right column names who sets each field. Ids shortened to 8 characters.
```

消息的发送方创建 `messageId` {{proto Message}}。kit 会拒绝没有 `messageId` 的消息，[错误](#s-errors)一节展示了这一点。§11.2 和 §6.3 的规范示例省略了 `messageId` {{spec §11.2}} {{spec §6.3}}，所以绝不要照搬示例（[冲突 D23](#s-ref-sources)）。

**Role：** 消息传输的方向。值 `ROLE_USER` 标记从客户端发往服务器的消息 {{proto Role}}，`ROLE_AGENT` 标记从服务器发往客户端的消息 {{proto Role}}。planner 是一个 agent，但它发给 `code-reviewer` 的消息带的是 `ROLE_USER`，因为在那里它是客户端。

§2.2 的术语表仍把这两个 role 写作 "user" 和 "agent" {{spec §2.2}} {{spec §5.5}}（[冲突 D35](#s-ref-sources)）。规范没有为发送 `ROLE_AGENT` 的客户端指定错误，kit 返回 `-32602`，[kit 的 README](manuals/a2a-101/capture/README.md) 列出了这一点。

## contextId 和 taskId {#s-message-contextid-and-taskid}

两个 id 都没有的客户端消息开启新的内容。之后服务器的消息带有它生成的 `contextId`，以及它创建的任何任务的 `taskId` {{proto Message}}。`02-message-reply.http` 中的直接回复带有 `contextId` 而没有 `taskId`，因为审查方没有创建任务就作了回答：

```listing
title: a server message with a context and no task
source: capture/out/02-message-reply.http
lang: json
note: The result of the only exchange in the file, complete.
---
  "result": {
    "message": {
      "messageId": "3b4b1206-4b6f-467f-b735-2d7e4f7f4bcd",
      "contextId": "dc423c62-d5f4-48e5-82c0-4963b9bc4334",
      "role": "ROLE_AGENT",
      "parts": [
        {
          "text": "I review unified diffs in Python, TypeScript and Go. Send the diff as a text/x-diff part and name the base branch."
        }
      ]
    }
  }
```

要延续一个任务，客户端把两个 id 都从任务复制到它的下一条消息中，planner 的回答就是这样做的：

```listing
title: the planner's answer, with both ids copied from the task
source: capture/out/06-input-required.http
lang: json
note: The message of exchange 2, complete.
---
    "message": {
      "messageId": "096d3737-42f9-4039-8320-a4737c2b3abe",
      "contextId": "49c5a238-4158-455d-8d63-b2cb39c0ecac",
      "taskId": "e5c95b09-6d4b-4b3b-8693-91e81472d12f",
      "role": "ROLE_USER",
      "parts": [
        {
          "text": "main"
        }
      ]
    }
```

三条规则约束这两个 id：

- **客户端的 `taskId` 必须指向一个存活的任务。** 客户端放进消息的 `taskId` 必须指向一个存在的任务 {{spec §3.4.2}}。未知的 id 会得到 `TaskNotFoundError`，[CancelTask 与终止状态](#s-cancel-task-and-terminal-states)一节讲解已结束的任务。
- **两个 id 必须一致。** agent 必须拒绝 `contextId` 与 `taskId` 不匹配的消息 {{spec §3.4.3}}。规范没有为此指定错误，kit 和参考 SDK 都返回 `-32602` {{sdk src/a2a/server/request_handlers/default_request_handler_v2.py}}。
- **context 跟随任务。** 消息只有 `taskId` 时，agent 必须从该任务取得 `contextId` {{spec §3.4.3}}。kit 是这样做的，下表说明了每个 SDK 的做法。

带有 `contextId` 而没有 `taskId` 的消息会在那个对话中开始一个新任务，[contextId](#s-context-id) 一节展示了这一点。

## 各 SDK 如何处理这些 id {#s-message-what-the-sdks-do-with-the-ids}

Send Message 操作可以是幂等的，agent 可以用 `messageId` 找出重复的消息 {{spec §3.3.1}}。所以对一次超时的发送进行重试时，可以复用同一个 `messageId`。没有哪个 SDK 会拒绝重复的 id，而在没有 `taskId` 时，每个重复的 id 都会为它再创建一个任务。

| SDK | 只有 `taskId` 的消息 | 同一个 `messageId` 向一个任务发送两次 |
|---|---|---|
| Python 1.2.2 | 不读取任务，并在消息上打上一个新的 `contextId` {{sdk src/a2a/server/agent_execution/context.py}} | 接受。history 跳过第二份副本，agent 再次运行 {{sdk src/a2a/server/agent_execution/active_task.py}} |
| Go v2.6.0 | agent 上下文得到任务的 `contextId`，存储的消息保持发送时的样子 {{sdk-go a2asrv/agentexec.go at v2.6.0}} | 接受。history 跳过第二份副本，agent 再次运行 {{sdk-go a2asrv/agentexec.go at v2.6.0}} |
| Java v1.4.0.Final | agent 上下文及其事件得到任务的 `contextId`，存储的消息保持发送时的样子 {{sdk-java server-common/src/main/java/org/a2aproject/sdk/server/requesthandlers/DefaultRequestHandler.java at v1.4.0.Final}} | 接受。消息再次追加到 history 中，agent 再次运行 {{sdk-java server-common/src/main/java/org/a2aproject/sdk/server/tasks/TaskManager.java at v1.4.0.Final}} |
| JS v1.3.0 | agent 上下文及其消息副本得到任务的 `contextId`，存储的消息保持发送时的样子 {{sdk-js src/server/request_handler/default_request_handler.ts at v1.3.0}} | 接受。消息再次追加到 history 中，agent 再次运行 {{sdk-js src/server/request_handler/default_request_handler.ts at v1.3.0}} |
| .NET v1.0.0-preview2 | agent 上下文得到任务的 `contextId`，存储的消息保持发送时的样子 {{sdk-dotnet src/A2A/Server/A2AServer.cs at v1.0.0-preview2}} | 接受。消息再次追加到 history 中，处理器再次运行 {{sdk-dotnet src/A2A/Server/A2AServer.cs at v1.0.0-preview2}} |
| Rust a2a-server-lf-v0.5.1 | executor 上下文得到任务的 `contextId`，存储的消息保持发送时的样子 {{sdk-rust a2a-server/src/handler.rs at a2a-server-lf-v0.5.1}} | 接受。消息再次追加到 history 中，executor 再次运行 {{sdk-rust a2a-server/src/handler.rs at a2a-server-lf-v0.5.1}} |

五个 SDK 为 agent 推断 context，并按发送时的样子存储消息，而参考 SDK 会生成一个新的 context。两个 id 都发送，这种差异就永远不会影响到你。

## 可选字段与状态消息 {#s-message-optional-fields-and-the-status-message}

kit 的 capture 中没有任何消息设置以下三个字段：

- **`referenceTaskIds`** 列出消息为提供更多上下文而指向的任务 id {{proto Message}}。
- **`extensions`** 列出消息中存在的或向消息添加了内容的扩展的 URI {{proto Message}}，[扩展](#s-extensions)一节讲解它们。
- **`metadata`** 是一个自由格式的 JSON 对象 {{proto Message}}。

**状态消息：** `TaskStatus` 能包含的那一条 `message`，即 agent 在任务内部说的话 {{proto TaskStatus}}。审查方的问题就是一条状态消息，而发现本身在 `review.json` artifact 中到达，[A2A 规定了什么](#s-what-a2a-standardizes)一节解释了这一点。

```takeaways
- 为你发送的每条消息生成新的 `messageId`，只在重试同一条消息时复用它。
- 从客户端发送 `ROLE_USER`，从服务器发送 `ROLE_AGENT`，不论这一方是什么。
- 把 `taskId` 和 `contextId` 都从任务复制到每条后续消息中，因为参考 SDK 不会推断 context。
```

Sources: proto Message, Role, TaskStatus (research/sources/a2a.proto); spec §2.2, §3.3.1, §3.4.2, §3.4.3, §5.5, §5.7, §6.3, §11.2 (research/sources/specification.md); sdk src/a2a/server/agent_execution/active_task.py, src/a2a/server/agent_execution/context.py, src/a2a/server/request_handlers/default_request_handler_v2.py; sdk-go a2asrv/agentexec.go at v2.6.0; sdk-java server-common/src/main/java/org/a2aproject/sdk/server/requesthandlers/DefaultRequestHandler.java, server-common/src/main/java/org/a2aproject/sdk/server/tasks/TaskManager.java at v1.4.0.Final; sdk-js src/server/request_handler/default_request_handler.ts at v1.3.0; sdk-dotnet src/A2A/Server/A2AServer.cs at v1.0.0-preview2; sdk-rust a2a-server/src/handler.rs at a2a-server-lf-v0.5.1; capture/README.md; capture/out/02-message-reply.http, 06-input-required.http
