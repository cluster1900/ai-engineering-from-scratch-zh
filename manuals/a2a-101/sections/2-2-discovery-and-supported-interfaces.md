# 发现与 supportedInterfaces

> 规范只标准化了通往 card 的 well-known 路径，客户端在检查 capability 标志之前，先选取 `supportedInterfaces` 中它支持的第一个条目。

planner 的配置中一开始有三个端口：`41241`、`41242` 和 `41243`。在委派任何工作之前，它获取三张 card，从每张中选一个 interface，并记下哪些 agent 支持流式传输、哪个需要 token。

读完本节后，你能找到 agent 的 card，选出要调用的 interface，并避开它的 card 排除的调用。

## 获取 card 的三条途径 {#s-discovery-and-supported-interfaces-three-routes-to-a-card}

规范列出了获取 card 的三种方式，但只标准化了其中一种的细节 {{spec §8.2}}：

- **Well-known URI。** 客户端从一个它已知的主机获取 `https://{server_domain}/.well-known/agent-card.json` {{spec §8.2}}。项目推荐公开的 agent 使用这条途径 {{docs agent-discovery}}。
- **注册中心或目录。** 客户端查询一个精选的 agent 目录 {{spec §8.2}}，而当前规范没有为这类注册中心规定标准 API {{docs agent-discovery}}。
- **直接配置。** 客户端从它已有的 Agent Card URL 或 card 内容出发 {{spec §8.2}}，这些内容保存在代码、配置文件或环境变量中 {{docs agent-discovery}}。

planner 的端口来自[kit 运行脚本](manuals/a2a-101/capture/run.py)中的直接配置，每张 card 来自 well-known 路径。

```listing
title: discovery is one GET on the well-known path
source: capture/out/01-agent-cards.http
lang: http
note: The response body is cut after its first field. [Figure](#fig-agent-card-fields) draws the whole card.
---
### 1 · discover test-runner
GET /.well-known/agent-card.json HTTP/1.1
Host: localhost:41241
Accept: application/json

HTTP/1.1 200 OK
Content-Type: application/json

{
  "name": "test-runner",
…
}
```

严格按照规范的写法使用这个路径。项目指南中有一张图仍显示没有 `.json` 的 `/.well-known/agent-card`，以及 `POST /sendMessage`，而 1.0 中是 `POST /message:send` {{docs what-is-a2a}} {{spec §5.3}}（[冲突 D32](#s-ref-sources)）。[PR #2261](https://github.com/a2aproject/A2A/pull/2261) 在 v1.0.1 之后于 main 上修复了这张图，尚未发布。

[图](#fig-finding-an-agent)跟踪 planner 从它的配置到对 `code-reviewer` 的一次经过检查的调用。

```figure
id: fig-finding-an-agent
kind: flow
title: from a host to a checked call
claim: Three routes lead to one card, and a client takes the first interface it speaks and checks a capability flag before each optional operation.
caption: Read top to bottom. The planner finds the code-reviewer card through configuration and the well-known path, takes interface 0, and reads two flags. The failed call is exchange 6 of the error capture.
```

## 从 supportedInterfaces 中选择 {#s-discovery-and-supported-interfaces-choosing-from-supportedinterfaces}

规范为客户端处理 `supportedInterfaces` 给出了四条规则，全部是 MUST {{spec §8.3.2}}。第一条决定端点：

```rule
label: the first rule of interface selection
source: spec §8.3.2
---
Read `supportedInterfaces` when the card has it, and select the first transport that you support.
```

支持是指客户端实现了的绑定和版本。一个 JSON-RPC 1.0 客户端会跳过 `GRPC` 条目和版本为 `0.3` 的 `JSONRPC` 条目，因为一张 card 可以以多个版本列出同一种绑定 {{spec §3.6.2}}。

另外三条规则要求客户端优先选择靠前的条目，并使用所选条目的 URL。客户端还要把每条请求消息的 `tenant` 字段设为该 `AgentInterface` 条目中的确切值 {{spec §8.3.2}}。kit 的 card 都没有设置 tenant。

## 调用前检查 capability {#s-discovery-and-supported-interfaces-checking-capabilities-before-a-call}

```rule
label: read the card before an optional call
source: spec §3.3.4
---
A client should read the Agent Card to confirm that a capability is supported before it calls an operation that needs an optional capability.
```

在服务器端，这条规则是 MUST：card 排除的调用会以固定的错误失败 {{spec §3.3.4}}。下表给出每个错误及其 JSON-RPC 代码 {{spec §5.4}}。

| `capabilities` 中的标志 | 它允许的操作 | 标志缺失或为 `false` 时的错误 |
|---|---|---|
| `streaming` | `SendStreamingMessage`, `SubscribeToTask` | `UnsupportedOperationError`, `-32004` |
| `pushNotifications` | `CreateTaskPushNotificationConfig`, `GetTaskPushNotificationConfig`, `ListTaskPushNotificationConfigs`, `DeleteTaskPushNotificationConfig` | `PushNotificationNotSupportedError`, `-32003` |
| `extendedAgentCard` | `GetExtendedAgentCard` | `UnsupportedOperationError`, `-32004` |

第 3 节说每个 A2A 实现都必须支持它的操作 {{spec §3}}。然而 agent 只要省略相应标志，就可以不支持流式传输、推送或扩展 card。以标志为准（[冲突 D26](#s-ref-sources)）。

`code-reviewer` 的 card 没有 `pushNotifications` 标志，而 kit 的错误场景仍向它注册了一个 webhook：

```listing
title: a push configuration on an agent that declares no push support
source: capture/out/11-errors.http
lang: http
note: Exchange 6, cut to the method, the task id, and the error. The JSON-RPC error arrives with HTTP 200, as [Errors](#s-errors) explains.
---
### 6 · CreateTaskPushNotificationConfig: not supported
POST /a2a/jsonrpc HTTP/1.1
Host: localhost:41242
…
  "method": "CreateTaskPushNotificationConfig",
  "params": {
    "taskId": "00000000-0000-4000-8000-000000000000",
…
HTTP/1.1 200 OK
…
    "code": -32003,
    "message": "Push notifications are not supported",
…
        "reason": "PUSH_NOTIFICATION_NOT_SUPPORTED",
```

这个任务 id 并不存在，但错误指出的是缺少的 capability，所以这次调用白白花了一次往返，而 card 早已给出了答案。

skill、mode 和安全字段说明这个 agent 是否适合这项工作，以及它需要什么。planner 把 `run-tests` 对应到 `test-runner`，并在每次调用 `deployer` 时附上 bearer token（[planner 代码](manuals/a2a-101/capture/planner.py)）。[Part](#s-part) 和[安全方案](#s-security-schemes-and-in-task-authorization)两节读取这些字段。

## 缓存 card {#s-discovery-and-supported-interfaces-caching-the-card}

card 很少变化，所以规范要求双方使用普通的 HTTP 缓存 {{spec §8.6}}。服务器应发送带有 `max-age` 指令的 `Cache-Control` 响应 header {{spec §8.6.1}}。它还发送一个 `ETag`，由 card 的 `version` 或其内容的哈希得出。客户端遵守这些 header，并用 `If-None-Match` 或 `If-Modified-Since` 重新验证过期的 card {{spec §8.6.2}}。

kit 不发送 `Cache-Control` 或 `ETag` header，[kit 的 README](manuals/a2a-101/capture/README.md) 列出了这一点。在经过认证的会话中，扩展 card 会取代缓存的公开 card，[扩展 card 与签名](#s-extended-cards-and-signatures)一节解释了这一点。

```takeaways
- 在运行注册中心之前，把 agent 主机放在配置中，并从 `/.well-known/agent-card.json` 获取每张 card。
- 选取 `supportedInterfaces` 中第一个你支持其绑定和版本的条目，并在每个请求中回传它的 `tenant`。
- 跳过 capability 标志缺失或为 `false` 的任何操作，因为服务器必须拒绝它。
- 用标准 HTTP 缓存来缓存 card，并用 `ETag` 重新验证过期的 card。
```

Sources: spec §3, §3.3.4, §3.6.2, §5.3, §5.4, §8.2, §8.3.2, §8.6, §8.6.1, §8.6.2 (research/sources/specification.md); docs/topics/agent-discovery.md, docs/topics/what-is-a2a.md at v1.0.1; capture/README.md, capture/run.py, capture/planner.py; capture/out/01-agent-cards.http, 11-errors.http
