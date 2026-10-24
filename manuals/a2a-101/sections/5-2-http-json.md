# HTTP+JSON

> HTTP+JSON 用来自 proto 的 `google.api.http` 注解中的动词和路径来命名每个操作，并以普通 JSON 正文发送请求和响应消息。

planner 通过 `test-runner` 的第二个接口，即绑定为 `HTTP+JSON` 的 `http://localhost:41241/a2a/rest`，重复它的第一次测试运行。在 `16-rest-binding.http` 中，回答的是同一个 agent 和同一个任务存储，与 `03-blocking-task.http` 相比只有信封不同。

读完本节后，你能把任何操作映射到它的路由，设置它的内容类型，并在 card 要求时发送 `tenant`。

## 来自 proto 的路由 {#s-http-json-routes-from-the-proto}

`A2AService` 的每个 rpc 都带有一个包含动词和路径模板的 `option (google.api.http)` {{proto A2AService}}，§11.3 列出了同样的路由 {{spec §11.3}}。带请求正文的操作是带有 `body: "*"` 的 `POST`：`/message:send`、`/message:stream`、`/tasks/{id}:cancel` 和 `/tasks/{task_id}/pushNotificationConfigs`。读取操作是 `GET`，删除配置是 `DELETE`。[按绑定列出的操作](#s-ref-operations-by-binding)给出了全部十一个路由及其消息。

对于 subscribe，proto 写的是 `get: "/tasks/{id=*}:subscribe"` {{proto A2AService}}，而 §5.3 和 §11.3.2 写的是 `POST /tasks/{id}:subscribe` {{spec §5.3}} {{spec §11.3.2}}（[冲突 D1](#s-ref-sources)）。参考 SDK 的服务器两个动词都接受，它的客户端发送 `POST` {{sdk src/a2a/server/routes/rest_routes.py}} {{sdk src/a2a/client/transports/rest.py}}。Java 和 .NET 服务器只接受 `POST` {{sdk-java reference/rest/src/main/java/org/a2aproject/sdk/server/rest/quarkus/A2AServerRoutes.java at v1.4.0.Final}} {{sdk-dotnet src/A2A.AspNetCore/A2AEndpointRouteBuilderExtensions.cs at v1.0.0-preview2}}。所以服务器要两者都接受，客户端要发送 `POST`。

```listing
title: SendMessage over HTTP+JSON, with no envelope
source: capture/out/16-rest-binding.http
lang: http
note: Host and the rest of both bodies are cut. Over JSON-RPC the same reply sits under result, in 03-blocking-task.http.
---
POST /a2a/rest/message:send HTTP/1.1
A2A-Version: 1.0
Content-Type: application/a2a+json

{
  "message": {
    "messageId": "48f165d5-7b00-47f4-b81e-f86f5c8cc1ab",
    "role": "ROLE_USER",
…
HTTP/1.1 200 OK
Content-Type: application/a2a+json

{
  "task": {
    "id": "bbfb9ea5-50ea-4441-b991-2a8ba0d6f3f3",
    "contextId": "41c0d462-fed8-4f6b-8569-6c9afe9497c3",
…
```

## 查询参数与内容类型 {#s-http-json-query-parameters-and-content-types}

`GET` 和 `DELETE` 不带正文，所以它们的请求字段以路径参数或查询参数传输 {{spec §11.5}}，采用 camelCase。`GetTask` 把任务 `id` 放在路径中，把 `historyLength` 放在查询中。`ListTasks` 接受 `contextId`、`status`、`pageSize`、`pageToken`、`historyLength`、`statusTimestampAfter` 和 `includeArtifacts` {{proto ListTasksRequest}} {{spec §11.5}}。嵌套对象不能放进查询字符串，所以那种请求必须是 `POST` {{spec §11.5}}。[图](#fig-two-json-bindings)把这两个操作与它们的 JSON-RPC 形式并排放置。

```figure
id: fig-two-json-bindings
kind: comparison
title: SendMessage and GetTask in two JSON bindings
claim: JSON-RPC posts every operation to one URL and names it in the body, HTTP+JSON names it with a verb and a path, and gRPC calls an rpc.
caption: Each row is one operation, headed by its rpc line from a2a.proto. Bold marks where each binding names the operation, and italic type names stand for the message that fills that place. Left, the blocking-task and polling captures. Right, the HTTP+JSON capture. Ids shortened to 8 characters.
```

请求和响应应使用 `application/a2a+json` {{spec §11.1}}，kit 在每个正文上都发送它。参考 SDK 以 `application/json` 发送错误 {{sdk src/a2a/utils/error_handlers.py}}，Java 和 Go 服务器以这种方式发送每个正文 {{sdk-java transport/rest/src/main/java/org/a2aproject/sdk/transport/rest/handler/RestHandler.java at v1.4.0.Final}} {{sdk-go a2asrv/rest.go at v2.6.0}}。所以要发送 `application/a2a+json`，读取时两种类型都接受。

## 流与错误 {#s-http-json-streams-and-errors}

流与 JSON-RPC 中一样是 `text/event-stream` 响应 {{spec §11.7}}。每个 `data:` 行只存放 `StreamResponse`，没有信封。没有捕获记录这种绑定中的流，所以[流式传输与订阅](#s-streaming-and-subscribe-to-task)一节展示的是 JSON-RPC 的帧。

错误使用 HTTP 状态码，以及 `error` 对象中 `google.rpc.Status` 的 JSON 形式 {{spec §11.6}}。记录中的第 3 和第 4 次交换展示了两个错误，[错误](#s-errors)一节读取了这种正文。

## tenant 字段 {#s-http-json-the-tenant-field}

**Tenant：** 接口上一个可选的不透明字符串，把请求路由到某个 agent {{proto AgentInterface}}，或者在多个 agent 共享一个端点时路由到某个租户。同一个 `tenant` 字段位于全部十个请求消息上，从 `SendMessageRequest` 到 `GetExtendedAgentCardRequest` {{proto SendMessageRequest}} {{proto GetExtendedAgentCardRequest}}。客户端把 card 中的值复制到每个请求中，当条目没有设置 `tenant` 时必须省略该字段 {{spec §8.3.2}}。协议没有规定这个值的格式，kit 的 card 也都没有设置它。

在这里，这个值也可以放在路径中传输。每个 rpc 都有第二种带 `/{tenant}` 前缀的 `google.api.http` 形式，例如 `post: "/{tenant}/message:send"` {{proto A2AService}}。只有 proto 列出了这些路由，§5.3、§11.3 和 §11.5 显示的是不带前缀的路由 {{spec §11.3}}。在 JSON-RPC 中这个值是 `params.tenant`，在 gRPC 中它是消息字段。迁移指南把这描述为内置于 gRPC 请求中的租户范围 {{docs whats-new-v1}}，这说得不够全面。

对于一台主机上的多个 agent，项目的指南给出了三种路由键：URL 前缀、凭据和 `tenant` 字段 {{docs multi-tenancy}}。一个部署可以使用其中不止一种 {{docs multi-tenancy}}。

当所选接口设置了 tenant 时，参考 SDK 的客户端会用一个 `TenantTransportDecorator` 包装传输 {{sdk src/a2a/client/client_factory.py}} {{sdk src/a2a/client/transports/tenant_decorator.py}}。它的 HTTP+JSON 传输把这个值放在路径前缀中 {{sdk src/a2a/client/transports/rest.py}}。它的服务器在 `/{tenant}` 下再挂载一遍每个路由，把这个值复制到调用上下文中，并且从不把它与 card 比较 {{sdk src/a2a/server/routes/rest_routes.py}} {{sdk src/a2a/server/routes/rest_dispatcher.py}}。agent 读取 `RequestContext.tenant` 并决定它的含义 {{sdk src/a2a/server/agent_execution/context.py}}。

```takeaways
- 根据 proto 的 `google.api.http` 注解构建每个路由，并在 `:subscribe` 上接受 `GET` 和 `POST`。
- 发送 `application/a2a+json`，读取时也接受 `application/json`。
- 把 `GET` 或 `DELETE` 的字段放在路径或查询字符串中，采用 camelCase。
- 把接口的 `tenant` 复制到每个请求中，card 没有设置时就省略它。
```

Sources: spec §5.3, §8.3.2, §11.1, §11.3, §11.3.2, §11.5, §11.6, §11.7 (research/sources/specification.md); proto A2AService, AgentInterface, SendMessageRequest, GetTaskRequest, ListTasksRequest, GetExtendedAgentCardRequest (research/sources/a2a.proto); docs multi-tenancy, whats-new-v1 (research/sources/docs.md); sdk src/a2a/server/routes/rest_routes.py, src/a2a/server/routes/rest_dispatcher.py, src/a2a/server/agent_execution/context.py, src/a2a/client/client_factory.py, src/a2a/client/transports/tenant_decorator.py, src/a2a/client/transports/rest.py, src/a2a/utils/error_handlers.py (a2a-python 1.2.2); sdk-java reference/rest/src/main/java/org/a2aproject/sdk/server/rest/quarkus/A2AServerRoutes.java, transport/rest/src/main/java/org/a2aproject/sdk/transport/rest/handler/RestHandler.java at v1.4.0.Final; sdk-dotnet src/A2A.AspNetCore/A2AEndpointRouteBuilderExtensions.cs at v1.0.0-preview2; sdk-go a2asrv/rest.go at v2.6.0; capture/out/16-rest-binding.http, 03-blocking-task.http, 04-polling.http; capture/a2a_ref.py
