# 错误

> 每个 A2A 错误都有一个 JSON-RPC 代码、一个 HTTP 状态、一个 gRPC 状态和一个 `ErrorInfo` reason，在 HTTP 上，正是 reason 区分其中的七个。

九个 A2A 错误的代码取自 §5.4 中的规范表 {{spec §5.4}}。每个错误还有一个 `ErrorInfo` reason：它的名称去掉 `Error` 后的大写蛇形写法，例如 `TASK_NOT_FOUND`。spec 只明确写出了这一个和 `TASK_NOT_CANCELABLE`，参考 SDK 使用相同的九个字符串 {{spec §11.6}} {{sdk src/a2a/utils/errors.py}}。

| 错误 | JSON-RPC | HTTP | gRPC |
|---|---|---|---|
| TaskNotFoundError | -32001 | 404 | NOT_FOUND |
| TaskNotCancelableError | -32002 | 400 | FAILED_PRECONDITION |
| PushNotificationNotSupportedError | -32003 | 400 | FAILED_PRECONDITION |
| UnsupportedOperationError | -32004 | 400 | FAILED_PRECONDITION |
| ContentTypeNotSupportedError | -32005 | 400 | INVALID_ARGUMENT |
| InvalidAgentResponseError | -32006 | 500 | INTERNAL |
| ExtendedAgentCardNotConfiguredError | -32007 | 400 | FAILED_PRECONDITION |
| ExtensionSupportRequiredError | -32008 | 400 | FAILED_PRECONDITION |
| VersionNotSupportedError | -32009 | 400 | FAILED_PRECONDITION |
| JSONParseError | -32700 | 无 | 无 |
| InvalidRequestError | -32600 | 无 | 无 |
| MethodNotFoundError | -32601 | 无 | 无 |
| InvalidParamsError | -32602 | 400 | INVALID_ARGUMENT |
| InternalError | -32603 | 500 或 503 | INTERNAL 或 UNAVAILABLE |
| 认证错误 | 自定义 | 401 | UNAUTHENTICATED |
| 授权错误 | 自定义 | 403 | PERMISSION_DENIED |

最后七行没有 A2A 代码。其中五个是标准 JSON-RPC 错误，它们的消息是 `Invalid JSON payload`、`Request payload validation error`、`Method not found`、`Invalid parameters` 和 `Internal error` {{spec §9.5}}。§3.3.2 为其中两个以及认证和授权错误给出了示例 HTTP 和 gRPC 代码 {{spec §3.3.2}}。JSON-RPC 为 A2A 错误保留了 `-32001` 到 `-32099`，只分配了 `-32001` 到 `-32009`。

官方测试 kit，即标签为 `1.0.0.alpha2` 的 a2a-tck，有自己的表，在六处与 §5.4 不同。它期望 `TaskNotCancelableError` 返回 HTTP `409`，`ContentTypeNotSupportedError` 返回 `415`，`InvalidAgentResponseError` 返回 `502`。它期望 `UnsupportedOperationError`、`PushNotificationNotSupportedError` 和 `VersionNotSupportedError` 返回 gRPC `UNIMPLEMENTED`。遵循 §5.4 的服务器会在这些检查上失败，而 a2a-java 在 `UnsupportedOperationError` 上与 kit 一致。[一致性测试](#s-conformance-testing)一节展示了如何运行该 kit。

[按绑定列出的操作](#s-ref-operations-by-binding)列出了抛出每个 A2A 错误的操作，其中没有一个列出 `InvalidAgentResponseError` {{spec §3.3.2}}。`UnsupportedOperationError` 涵盖终止的任务、关闭的流式传输和关闭的扩展 card，所以要读它的消息和元数据 {{spec §3.1.1}} {{spec §3.3.4}}。当客户端无权访问某个资源时，服务器不得透露该资源存在 {{spec §3.3.2}}。所以对调用方无法访问的任务，以 `TaskNotFoundError` 回答。

每个错误都带有一个代码、一条消息和可选的详情，每条详情都有一个 `@type` 键 {{spec §3.3.2}}。JSON-RPC 把它们放在 `error.code`、`error.message` 和 `error.data` 中，HTTP 状态 spec 没有规定 {{spec §9.5}}。kit 和 SDK 发送 `200 OK` {{sdk src/a2a/server/routes/jsonrpc_dispatcher.py}}。gRPC 绑定发送 `google.rpc.Status`，HTTP+JSON 在一个 `error` 对象中发送它的 JSON 形式。对于 A2A 错误，两者都包含一个带有 `reason` 和 `domain` `a2a-protocol.org` 的 `ErrorInfo` {{spec §10.6}} {{spec §11.6}}。[错误](#s-errors)一节逐一解读了每种形式。

Sources: spec §3.1.1 to §3.1.11, §3.3.2, §3.3.4, §5.4, §9.5, §10.6, §11.6 (research/sources/specification.md); research/brief-spec.md sections 7.1 to 7.5 and 12.1; sdk src/a2a/utils/errors.py and src/a2a/server/routes/jsonrpc_dispatcher.py at v1.2.2; a2a-tck tck/requirements/base.py and tests/compatibility/http_json/test_http_status.py at tag 1.0.0.alpha2 (research/conformance-tools.md); capture/out/10-cancel.http, 11-errors.http, 16-rest-binding.http
