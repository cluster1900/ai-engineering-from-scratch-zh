# GetTask 和 ListTasks

> `GetTask` 和 `ListTasks` 是你的恢复途径，二者在省略任务的哪些部分上都遵循确切的规则。

planner 到 `deployer` 的流断了。一个 webhook 说一次测试运行已经结束。planner 重启后，日志中只剩任务 id。在每种情况下，下一步都一样：向 agent 索要它存储的任务。

读完本节后，你能获取所需的历史，翻阅一个 agent 的任务，并解释某个字段为何缺失。

## GetTask 返回存储的任务 {#s-get-task-and-list-tasks-gettask-returns-the-stored-task}

`GetTask` 接受任务 `id` 和一个可选的 `historyLength` {{proto GetTaskRequest}}。它按服务器持有的样子返回 `Task`：状态、artifact 和历史。

你无权查看的 id 会得到 `TaskNotFoundError` {{spec §3.1.3}}，所以未找到的回答绝不能证明任务已经不在了。

## historyLength {#s-get-task-and-list-tasks-historylength}

**历史：** 任务保留下来的消息，不包括当前的状态消息。`historyLength` 参数设定响应带有多少条，在每个操作中含义相同 {{spec §3.2.4}}：

- 未设置（unset）：没有限制。服务器返回它默认数量的历史，这由实现决定，也可能是全部历史 {{spec §3.2.4}}。
- 大于零的数：最多返回任务历史中这么多条最近的消息 {{spec §3.2.4}}。
- 零：没有历史，`history` 字段应被省略 {{spec §3.2.4}}。

`historyLength` 为 1 时，kit 只返回审查任务最新的一条消息：

```listing
title: GetTask with historyLength 1
source: capture/out/13-history.http
lang: json
note: The JSON-RPC envelopes, the reply's ids, status, and artifacts, and the ids inside the message are cut.
---
  "method": "GetTask",
  "params": {
    "id": "e5c95b09-6d4b-4b3b-8693-91e81472d12f",
    "historyLength": 1
  }
…
    "history": [
      {
        "messageId": "8f9ee658-e185-409a-9294-8d4d97ef77bb",
        …
        "role": "ROLE_AGENT",
        "parts": [
          {
            "text": "Comparing the diff against main"
          }
        ]
      }
    ],
```

那条消息并不是 agent 最新说的话。最终的状态消息 "2 findings" 留在 `status.message` 中。在 kit 和参考 SDK 中，状态消息只有在被更新的状态消息替换时才加入 `history` {{sdk src/a2a/server/tasks/task_manager.py}}。要把 `history` 和 `status.message` 放在一起读。

服务器也可以采用更低的限制 {{proto GetTaskRequest}}，历史也不必保留每条消息 {{spec §3.7}}。未设置的情况由实现定义，各 SDK 对 0 和负值的理解也不同：

| SDK | 未设置 `historyLength` | 0 | 小于 0 |
|---|---|---|---|
| a2a-python 1.2.2 | 两个操作中都返回全部历史 | 一个空的 `history` 数组 | `InvalidParamsError` {{sdk src/a2a/utils/task.py}} |
| a2a-go | `GetTask` 中返回全部历史，`ListTasks` 中返回最后 100 条消息 | 省略该字段 | 省略该字段 {{sdk-go a2asrv/handler.go at v2.6.0}} |
| a2a-java | `GetTask` 中返回全部历史，`ListTasks` 中不返回 | 一个空列表 | `InvalidParamsError` {{sdk-java requesthandlers/DefaultRequestHandler.java at v1.4.0.Final}} |
| a2a-js | 两个操作中都返回全部历史 | 省略该字段 | 通过 JSON-RPC 时省略，通过 REST 时返回 HTTP 400 {{sdk-js src/server/request_handler/default_request_handler.ts at v1.3.0}} |
| a2a-dotnet | 两个操作中都返回全部历史 | `GetTask` 中是空数组，`ListTasks` 中没有该字段 | 通过 JSON-RPC 时返回 `InvalidParamsError` {{sdk-dotnet src/A2A/Server/A2AServer.cs at v1.0.0-preview2}} |
| a2a-rs | 两个操作中都返回全部历史 | 空的历史 | 空的历史 {{sdk-rust a2a-server/src/task_store/mod.rs at a2a-server-lf-v0.5.1}} |

## ListTasks 返回分页，最新的在前 {#s-get-task-and-list-tasks-listtasks-returns-pages-newest-first}

`ListTasks` 按 `contextId`、`status` 和 `statusTimestampAfter` 过滤，并用 `pageSize`、`pageToken`、`historyLength` 和 `includeArtifacts` 决定页面的形状 {{proto ListTasksRequest}}。它只返回经过认证的客户端可以看到的任务 {{spec §3.1.4}}，遵循四条规则：

- 大小：没有 `pageSize` 时，一页最多 50 个任务 {{proto ListTasksRequest}}，最大值是 100。
- 顺序：任务必须按状态时间戳排序，最近更新的在前 {{spec §3.1.4}}。
- 令牌：响应必须始终包含 `nextPageToken` {{spec §3.1.4}}。在最后一页上，它是空字符串。
- Artifact：当 `includeArtifacts` 为 false（默认值）时，必须完全省略 `artifacts` 字段 {{spec §3.1.4}}。

kit 向持有五个任务的 `test-runner` 请求 `pageSize` 2 和 `historyLength` 0：

```listing
title: the first page of ListTasks
source: capture/out/12-list-tasks.http
lang: json
note: Each task is cut to its id, state, and status timestamp, and the token is cut after its first 44 characters.
---
    "tasks": [
      {
        "id": "f22ed7af-848d-4f4d-8cd1-3204d1e1bbaf",
        …
          "state": "TASK_STATE_CANCELED",
          …
          "timestamp": "2026-10-06T09:00:03.750Z"
      …
        "id": "8ae21dcb-7449-4d90-82a6-ac01b20fd782",
        …
          "state": "TASK_STATE_FAILED",
          …
          "timestamp": "2026-10-06T09:00:03.000Z"
      …
    ],
    "nextPageToken": "eyJ0cyI6IjIwMjYtMTAtMDZUMDk6MDA6MDMuMDAwWiIs…",
    "pageSize": 2,
    "totalSize": 5
```

第二页包含已完成的运行 `728ba084` 和 `d0c28826`。两页都不带 `artifacts`，尽管两次已完成的运行都存储了日志和摘要。第三个请求按 `TASK_STATE_CANCELED` 过滤，得到一个任务、为 50 的 `pageSize` 和空的 `nextPageToken`。[图](#fig-history-and-pages)把这些页面与各种历史规则并排画出。

```figure
id: fig-history-and-pages
kind: structure
title: history regimes and list pages
claim: `GetTask` trims history to the newest messages you ask for, and `ListTasks` returns newest-first pages that leave out artifacts until you ask for them.
caption: Top, the stored history of task e5c95b09 and what each `historyLength` returns. Bottom, the five tasks on test-runner in list order, grouped into the pages the kit requested. Ids are shortened to 8 characters. From capture/out/13-history.http, 04-polling.http, and 12-list-tasks.http.
```

规范要求基于游标的分页，并且没有规定令牌的格式 {{spec §3.1.4}}，所以每个 SDK 都自己定义：

| SDK | 令牌 | 页面大小 | 最后一页 |
|---|---|---|---|
| a2a-python 1.2.2 | 一个包含状态时间戳和任务 id 的 JSON 游标的 URL 安全 base64 {{sdk src/a2a/utils/task.py}} | 默认 50，范围 1 到 100，否则报错 -32602 | `""` |
| a2a-go | 更新时间和任务 id 的 URL 安全 base64 {{sdk-go a2asrv/taskstore/inmemory.go at v2.6.0}} | 默认 50，范围 1 到 100，否则报错 -32600 | `""` |
| a2a-java | 纯文本：以 epoch 毫秒表示的状态时间、一个冒号和任务 id {{sdk-java util/PageToken.java at v1.4.0.Final}} | 默认 50，范围 1 到 100，否则报错 -32602 | `""` |
| a2a-js | 状态时间戳、一条竖线和任务 id 的 base64 {{sdk-js src/server/utils.ts at v1.3.0}} | 默认 50，范围 1 到 100，否则报错 -32602 | `""` |
| a2a-dotnet | 一个十进制偏移量，例如 `50` {{sdk-dotnet src/A2A/Server/InMemoryTaskStore.cs at v1.0.0-preview2}} | 默认 50，只有 JSON-RPC 会拒绝 1 到 100 以外的大小 | `""` |
| a2a-rs | 在按 id 排序的任务上的十进制偏移量，违反了上面的顺序规则 {{sdk-rust a2a-server/src/task_store/inmemory.rs at a2a-server-lf-v0.5.1}} | 默认 50，大于 100 的大小被截为 100 | `""` |

## 发送每个参数 {#s-get-task-and-list-tasks-send-every-parameter}

第三个请求不发送 `historyLength`，得到了完整的历史，参考 SDK 也会这样做 {{sdk src/a2a/server/request_handlers/default_request_handler_v2.py}}。为 0 时，SDK 返回一个空的 `history` 数组，而规范要求没有该字段 {{sdk src/a2a/server/routes/common.py}}。所以要同样对待缺失的 `history` 和空的 `history`。

原样传回你得到的令牌。迁移指南把这些字段称为 `cursor`、`limit` 和 `nextCursor`，这些名称 proto 并未定义（[冲突 D12](#s-ref-sources)）。

`statusTimestampAfter` 的边界是包含的：结果只包含状态时间戳等于或晚于该值的任务 {{proto ListTasksRequest}}。要只获取有变化的部分，就发送你见过的最新状态时间戳，并跳过你已经持有的边界任务。

```takeaways
- 在流结束、webhook 到达或进程重启之后调用 `GetTask`。
- 每次读取都发送 `historyLength`：检查状态时用 0，查看最新一轮时用一个小数字。
- 用你得到的令牌原样翻页，直到它返回空值。
- 当列表必须带有结果时设置 `includeArtifacts`，或者用 `GetTask` 获取每个任务。
```

Sources: spec §3.1.3, §3.1.4, §3.2.4, §3.7 (research/sources/specification.md); proto GetTaskRequest, ListTasksRequest (research/sources/a2a.proto); sdk src/a2a/server/tasks/task_manager.py, src/a2a/server/request_handlers/default_request_handler_v2.py, src/a2a/server/routes/common.py, src/a2a/utils/task.py (a2a-python 1.2.2); sdk-go a2asrv/handler.go, a2asrv/taskstore/inmemory.go at v2.6.0; sdk-java server-common/src/main/java/org/a2aproject/sdk/server/requesthandlers/DefaultRequestHandler.java, spec/src/main/java/org/a2aproject/sdk/spec/util/PageToken.java at v1.4.0.Final; sdk-js src/server/request_handler/default_request_handler.ts, src/server/utils.ts at v1.3.0; sdk-dotnet src/A2A/Server/A2AServer.cs, src/A2A/Server/InMemoryTaskStore.cs at v1.0.0-preview2; sdk-rust a2a-server/src/task_store/mod.rs, a2a-server/src/task_store/inmemory.rs at a2a-server-lf-v0.5.1; capture/out/04-polling.http, 12-list-tasks.http, 13-history.http
