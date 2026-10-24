# 按绑定列出的操作

> 每个 A2A 操作在 JSON-RPC 和 gRPC 中有一个名称，在 HTTP+JSON 中有一个路由，有一个请求消息和一个响应消息，以及一份固定的错误列表。

proto 在一个 gRPC 服务 `A2AService` 中定义了十一个操作，JSON-RPC 的 `method` 使用与 rpc 相同的名称 {{proto A2AService}} {{spec §5.3}}。路由是 proto 的 `google.api.http` 模板 {{proto A2AService}}。第一列把每个操作链接到讲解它的那一节。

| JSON-RPC 方法 | gRPC rpc | HTTP+JSON 路由 | 输入请求，输出响应 |
|---|---|---|---|
| [SendMessage](#s-send-message) | `SendMessage` | `POST /message:send` | `SendMessageRequest`，`SendMessageResponse` |
| [SendStreamingMessage](#s-streaming-and-subscribe-to-task) | `SendStreamingMessage` | `POST /message:stream` | `SendMessageRequest`，`StreamResponse` 流 |
| [GetTask](#s-get-task-and-list-tasks) | `GetTask` | `GET /tasks/{id=*}` | `GetTaskRequest`，`Task` |
| [ListTasks](#s-get-task-and-list-tasks) | `ListTasks` | `GET /tasks` | `ListTasksRequest`，`ListTasksResponse` |
| [CancelTask](#s-cancel-task-and-terminal-states) | `CancelTask` | `POST /tasks/{id=*}:cancel` | `CancelTaskRequest`，`Task` |
| [SubscribeToTask](#s-streaming-and-subscribe-to-task) | `SubscribeToTask` | proto 中是 `GET /tasks/{id=*}:subscribe`，§5.3 和 §11.3.2 中是 `POST`，所以两个动词都接受，参考 SDK 就是这样做的（[冲突 D1](#s-ref-sources-the-conflict-register)） {{sdk src/a2a/server/routes/rest_routes.py}} | `SubscribeToTaskRequest`，`StreamResponse` 流 |
| [CreateTaskPushNotificationConfig](#s-push-notification-configs) | `CreateTaskPushNotificationConfig` | `POST /tasks/{task_id=*}/pushNotificationConfigs` | 输入和输出都是 `TaskPushNotificationConfig`，没有请求包装（[冲突 D5](#s-ref-sources-the-conflict-register)） |
| [GetTaskPushNotificationConfig](#s-push-notification-configs) | `GetTaskPushNotificationConfig` | `GET /tasks/{task_id=*}/pushNotificationConfigs/{id=*}` | `GetTaskPushNotificationConfigRequest`，`TaskPushNotificationConfig` |
| [ListTaskPushNotificationConfigs](#s-push-notification-configs) | `ListTaskPushNotificationConfigs` | `GET /tasks/{task_id=*}/pushNotificationConfigs` | `ListTaskPushNotificationConfigsRequest`，`ListTaskPushNotificationConfigsResponse` |
| [DeleteTaskPushNotificationConfig](#s-push-notification-configs) | `DeleteTaskPushNotificationConfig` | `DELETE /tasks/{task_id=*}/pushNotificationConfigs/{id=*}` | `DeleteTaskPushNotificationConfigRequest`，`google.protobuf.Empty` |
| [GetExtendedAgentCard](#s-extended-cards-and-signatures) | `GetExtendedAgentCard` | `GET /extendedAgentCard` | `GetExtendedAgentCardRequest`，`AgentCard` |

每个 rpc 在其 `additional_bindings` 中都有第二个路由，即位于 `/{tenant}` 前缀下的同一路径，例如 `POST /{tenant}/message:send` {{proto A2AService}}。§5.3、§11.3 和 §11.5 的正文只列出了不带前缀的路由（[差异 N12](#s-ref-sources-discrepancies-found-after-the-register)）。在 JSON-RPC 中，同一个值以 `params.tenant` 传输，在 gRPC 中以请求的 `tenant` 字段传输。在每种绑定中，当所选接口设置了 `tenant` 时，它都必须与之匹配 {{proto SendMessageRequest}}，正如 [HTTP+JSON](#s-http-json) 一节所解释的。

`SendMessageResponse` 包含一个 `task` 或一个 `message`。发送需要 `message`，获取、取消和订阅需要任务 `id`。获取、列出和删除配置的请求需要 `taskId`，获取和删除还需要 `id`，创建需要 `url`。JSON-RPC 把每次调用作为一个信封 POST，名称放在 `method` 中，请求消息放在 `params` 中 {{spec §9.3}}。

每个操作都可能抛出 §3.1 为它列出的错误。最后一列给出必须为 `true` 的 card 能力。当它为 `false` 或缺失时，推送配置方法以 `PushNotificationNotSupportedError` 失败，其他方法以 `UnsupportedOperationError` 失败 {{spec §3.3.4}}。

| 方法 | 其他 A2A 错误 | 能力标志 |
|---|---|---|
| SendMessage | `ContentTypeNotSupportedError`、`TaskNotFoundError`，以及针对终止任务的 `UnsupportedOperationError` | 无 |
| SendStreamingMessage | 与 `SendMessage` 相同的三种 | streaming |
| GetTask | `TaskNotFoundError` | 无 |
| ListTasks | 除标准协议错误外没有其他错误 | 无 |
| CancelTask | `TaskNotCancelableError`、`TaskNotFoundError` | 无 |
| SubscribeToTask | `TaskNotFoundError`，以及针对终止任务的 `UnsupportedOperationError` | streaming |
| 四个推送配置方法 | `TaskNotFoundError`，对于不存在的配置，`GetTaskPushNotificationConfig` 也返回它 | pushNotifications |
| GetExtendedAgentCard | 当标志开启但没有配置扩展 card 时返回 `ExtendedAgentCardNotConfiguredError` | extendedAgentCard |

任何操作也都可能以 `VersionNotSupportedError`、`ExtensionSupportRequiredError` 或认证、授权错误失败 {{spec §3.6.2}} {{spec §3.3.2}}。[错误](#s-ref-errors)给出了它们在每种绑定中的代码，[gRPC 绑定](#s-grpc)一节展示了一个带完整注解的 rpc。

Sources: proto `A2AService` with its `google.api.http` routes and `additional_bindings`, and the request and response messages from `SendMessageRequest` to `ListTaskPushNotificationConfigsResponse` (research/sources/a2a.proto); spec §3.1.1 to §3.1.11, §3.3.2, §3.3.4, §3.6.2, §5.3, §9.3, §11.3, §11.3.2, §11.5 (research/sources/specification.md); research/brief-spec.md sections 2.7, 2.8, 3.0, 7.5 and 12.2; research/migration.md section D.6 (N12); sdk src/a2a/server/routes/rest_routes.py at v1.2.2
