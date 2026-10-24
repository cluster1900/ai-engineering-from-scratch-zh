# 服务器

> 服务器由这些部分组成：一张 card、每种绑定一个处理器、任何工作之前的三项检查、一个执行器、一个按所有者划分范围的任务存储，以及一个为流和 webhook 供数的事件队列。

kit 中的三个 agent 来自同[一个文件](manuals/a2a-101/capture/a2a_ref.py)，共 675 行，只用 Python 标准库写成。每个 agent 提供一张 card，回应两种 JSON 绑定，在一个线程中运行自己的逻辑，并把任务保存在一个字典中。读完本节后，你能说出服务器必须构建的每个部分，并在那个文件和参考 SDK 中找到它。

[图](#fig-server-parts)跟踪一个 `SendStreamingMessage` 经过这些部分，从 HTTP 请求一直到流帧和 webhook POST。

```figure
id: fig-server-parts
kind: structure
title: the parts of a server, in the order a request meets them
claim: A request passes authentication, the version check, and the capability check before Agent.send stores a task, and every event then leaves through one broadcast.
caption: Read the left column top to bottom. Each box is a method of the kit's server. Rose boxes on the right are the errors each check returns, with their JSON-RPC codes from the error capture. From capture/a2a_ref.py.
```

## card 与每种绑定一个处理器 {#s-a-server-the-card-and-one-handler-per-binding}

**Card 路由：** `/.well-known/agent-card.json` 上返回 card 的 `GET` {{spec §8.2}}。kit 的 `Handler.do_GET` 用 `published_card` 回答它。SDK 的 `create_agent_card_routes` 提供同一路径，由 `AGENT_CARD_WELL_KNOWN_PATH` 命名 {{sdk src/a2a/server/routes/agent_card_routes.py}} {{sdk src/a2a/utils/constants.py}}。

**绑定处理器：** 每种绑定一个入口点，它解析请求、运行检查，并调用相同的 agent 方法。kit 有位于 `/a2a/jsonrpc` 的 `Handler.jsonrpc` 和位于 `/a2a/rest/` 下的 `Handler.rest`，没有 gRPC，正如 [gRPC](#s-grpc) 一节所解释的。SDK 有 `create_jsonrpc_routes`、`create_rest_routes` 和 `GrpcHandler` {{sdk src/a2a/server/routes/jsonrpc_routes.py}} {{sdk src/a2a/server/routes/rest_routes.py}} {{sdk src/a2a/server/request_handlers/grpc_handler.py}}。三者都调用同一个 `DefaultRequestHandler`，也就是 `DefaultRequestHandlerV2` {{sdk src/a2a/server/request_handlers/__init__.py}}。

```listing
title: the JSON-RPC handler, from the token to the first two methods
source: capture/a2a_ref.py
lang: python
note: The head of the jsonrpc method and its error branch. The other nine method branches are cut.
---
    def jsonrpc(self, raw):
        request_id = None
        if not self.authenticate():
            return None
        try:
            try:
                request = json.loads(raw)
            except ValueError:
                raise A2AError("JSONParseError")
            if not isinstance(request, dict) or request.get("jsonrpc") != "2.0" or "method" not in request:
                raise A2AError("InvalidRequestError")
            request_id = request.get("id")
            self.check_version()
            method = request["method"]
            params = request.get("params") or {}
            agent = self.agent
            if method == "SendMessage":
                return self.write_json(200, {"jsonrpc": "2.0", "id": request_id, "result": agent.send(params)}, "application/json")
            if method == "SendStreamingMessage":
                if not agent.card["capabilities"].get("streaming"):
                    raise A2AError("UnsupportedOperationError")
                stream = queue.Queue()
                agent.send(params, stream)
                self.open_stream()
                return self.pump(stream, lambda event: {"jsonrpc": "2.0", "id": request_id, "result": event})
            …
        except A2AError as error:
            return self.write_json(200, {"jsonrpc": "2.0", "id": request_id, "error": error.jsonrpc()}, "application/json")
```

## 任何工作之前的三项检查 {#s-a-server-three-checks-before-any-work}

认证最先运行。kit 的 `authenticate` 在任何方法之前以 HTTP 401 和一个 `WWW-Authenticate` 质询回答，只在 deployer 上这样做。SDK 自己不检查任何凭据：`ServerCallContext.user` 来自 Web 框架的中间件 {{sdk src/a2a/server/routes/common.py}}。[安全方案](#s-security-schemes-and-in-task-authorization)一节说明了要检查什么。

版本检查第二个运行。`check_version` 只接受恰好为 `1.0` 的值，对其他任何值都抛出 `VersionNotSupportedError`，因为 agent 必须把空值读作 0.3 版 {{spec §3.6.2}}。SDK 的 `validate_version` 装饰器包装每个 JSON-RPC 和 REST 分派方法，并比较主版本 {{sdk src/a2a/utils/version_validator.py}}。它不包装 gRPC servicer。[版本请求头](#s-version-and-extension-headers)一节给出了规则和每个 SDK 的行为。

能力检查第三个运行。在流操作或推送操作之前，kit 读取 `card["capabilities"]`，并抛出 `UnsupportedOperationError` 或 `PushNotificationNotSupportedError` {{spec §3.3.4}}。SDK 在 `on_message_send_stream` 和推送方法上用一个 `validate` 装饰器做同样的事 {{sdk src/a2a/server/request_handlers/default_request_handler_v2.py}}。

## 执行器与任务存储 {#s-a-server-the-executor-and-the-task-store}

**执行器：** 为一个请求运行 agent 并发出其事件的代码。kit 的 `Agent.send` 验证消息，以 `TASK_STATE_SUBMITTED` 创建任务，并在一个线程中启动 `Agent.work`。`work` 调用 `behavior`（agent 自己的逻辑），并应用它产生的每个事件。SDK 的 `AgentExecutor.execute` 接收一个 `RequestContext` 和一个 `EventQueue`，在工作完成或任务进入中断状态时返回 {{sdk src/a2a/server/agent_execution/agent_executor.py}} {{sdk src/a2a/server/agent_execution/context.py}}。

执行器调用了什么，对客户端是隐藏的。[图](#fig-a2a-and-tools)为 kit 的三个 agent 画出了这条界线。

```figure
id: fig-a2a-and-tools
kind: layers
title: A2A between agents, tools inside each one
claim: The planner sees only each agent's card and endpoint, while each agent calls its own logic and tools below a line that A2A never crosses.
caption: Read top to bottom. Above the dashed line is what the planner sees over A2A. Below it is what each agent runs on its own, which the kit simulates in Python. From capture/agents.py and capture/out/01-agent-cards.http.
```

**任务存储：** 每个任务的记录，由 `GetTask`、`ListTasks` 和每条后续消息读取。kit 的 `Agent.tasks` 是一个没有所有者的字典，deployer 的 bearer 令牌是它唯一的保护。SDK 的 `TaskStore` 有 `save`、`get`、`list` 和 `delete`，每个都会收到 `ServerCallContext` {{sdk src/a2a/server/tasks/task_store.py}}。`InMemoryTaskStore` 按所有者为任务设键，默认的 `OwnerResolver` 返回 `context.user.user_name` {{sdk src/a2a/server/owner_resolver.py}} {{sdk src/a2a/server/tasks/inmemory_task_store.py}}。这样另一个调用者的任务就是 `TaskNotFoundError`，但每个没有用户名的调用者共享同一个范围。服务器必须在每个 A2A 操作请求上检查授权 {{spec §13.1}}，所以集成者要添加中间件，[安全方案](#s-security-schemes-and-in-task-authorization)一节针对每个 SDK 展示了这一点。

## 为流和 webhook 服务的同一个事件队列 {#s-a-server-one-event-queue-for-streams-and-webhooks}

kit 的 `Agent.apply` 更新任务记录。然后 `Agent.broadcast` 把事件的一个副本放到每个订阅者队列上，并为每个推送配置调用 `deliver`。`Handler.pump` 读取一个订阅者队列，并把每个事件写成一个 `data:` 帧。`broadcast` 在终止状态或 `TASK_STATE_INPUT_REQUIRED` 时关闭流，`deliver` 带着 `X-A2A-Notification-Token` 把事件 POST 到 webhook URL。

SDK 的 `ActiveTask` 用两个队列做同样的事。执行器写入 `_event_queue_agent`。一个消费者读取它，保存任务，把每个事件转发到 `_event_queue_subscribers`，并调用 `PushNotificationSender.send_notification` {{sdk src/a2a/server/agent_execution/active_task.py}} {{sdk src/a2a/server/tasks/push_notification_sender.py}}。[流式传输](#s-streaming-and-subscribe-to-task)和[推送通知配置](#s-push-notification-configs)两节逐帧展示了这两条路径。

```takeaways
- 在 `/.well-known/agent-card.json` 提供 card，并让每种绑定都经过同样的检查。
- 在执行器启动之前，检查凭据、`A2A-Version` 请求头和能力标志。
- 按所有者为任务存储设键，对范围之外的任务回答 `TaskNotFoundError`。
- 把每个事件写入同一个队列，由它为打开的流和 webhook POST 供数。
```

Sources: spec §3.3.4, §3.6.2, §8.2, §13.1 (research/sources/specification.md); sdk src/a2a/server/routes/agent_card_routes.py, src/a2a/utils/constants.py, src/a2a/server/routes/jsonrpc_routes.py, src/a2a/server/routes/rest_routes.py, src/a2a/server/routes/common.py, src/a2a/server/request_handlers/grpc_handler.py, src/a2a/server/request_handlers/__init__.py, src/a2a/server/request_handlers/default_request_handler_v2.py, src/a2a/utils/version_validator.py, src/a2a/server/agent_execution/agent_executor.py, src/a2a/server/agent_execution/context.py, src/a2a/server/agent_execution/active_task.py, src/a2a/server/tasks/task_store.py, src/a2a/server/tasks/inmemory_task_store.py, src/a2a/server/owner_resolver.py, src/a2a/server/tasks/push_notification_sender.py at a2a-python 1.2.2; capture/a2a_ref.py, capture/agents.py, capture/README.md; capture/out/01-agent-cards.http, 11-errors.http
