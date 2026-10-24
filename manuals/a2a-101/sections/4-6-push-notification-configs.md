# 推送通知配置

> TaskPushNotificationConfig 告诉 agent，在你的请求返回之后，带着你选定的凭据，把流所承载的同样的 StreamResponse 对象 POST 到哪里。

一次测试运行可能比 planner 愿意保持打开的任何连接都要长。所以 planner 发送带有 `returnImmediately: true` 和一个 webhook 的 `SendMessage`，得到处于 `TASK_STATE_SUBMITTED` 的任务，然后关闭连接。从那以后，`test-runner` 向 `http://localhost:41250/a2a-events` 发送八条通知。

读完本节后，你能注册一个 webhook，认证到达的内容，并构建一个在通知到达两次时仍然正确的接收方。

## 配置对象 {#s-push-notification-configs-the-configuration-object}

**TaskPushNotificationConfig：** 告诉 agent 把某个任务的更新发到哪里以及如何认证它们的对象 {{proto TaskPushNotificationConfig}}。只有 `url` 是 REQUIRED。可选的 `token` 对该任务或会话是唯一的 {{proto TaskPushNotificationConfig}}，可选的 `authentication` 包含一个 `scheme`（例如 `Bearer`）及其 `credentials` {{proto AuthenticationInfo}}。服务器分配配置的 `id`。正文把这个对象称为 `PushNotificationConfig`，而 proto 并未定义这个类型，所以使用 proto 的名称 {{spec §4.3.1}}（[冲突 D4](#s-ref-sources)）。

```listing
title: a webhook registered inside SendMessage
source: capture/out/15-push.http
lang: http
note: The headers and the message parts are cut. The configuration carries no task id, because the task does not exist yet.
---
POST /a2a/jsonrpc HTTP/1.1
…
  "method": "SendMessage",
  "params": {
    "message": {
      "messageId": "85750621-02fb-4d4f-b57f-bc5af71a1bfc",
…
    "configuration": {
      "returnImmediately": true,
      "taskPushNotificationConfig": {
        "url": "http://localhost:41250/a2a-events",
        "token": "planner-run-0006",
        "authentication": {
          "scheme": "Bearer",
          "credentials": "hook_secret_91d2"
        }
```

像这里这样内联时，配置放在 `configuration.taskPushNotificationConfig` 中 {{proto SendMessageConfiguration}}。这不会留下空档，因为 kit 和参考 SDK 在第一个事件之前就存储了它 {{sdk src/a2a/server/request_handlers/default_request_handler_v2.py}}。对于已经存在的任务，`CreateTaskPushNotificationConfig` 接受配置本身及其 `taskId` {{proto A2AService}}。正文和附录 A 则写的是 `CreateTaskPushNotificationConfigRequest`，而 proto 并未定义它 {{spec §10.4.7}}（[冲突 D5](#s-ref-sources)）。

agent SHOULD 验证 `url` {{spec §13.2}}，[安全要求](#s-security-requirements)一节对此有解释。

## 到达 webhook 的内容 {#s-push-notification-configs-what-arrives-at-the-webhook}

每条通知都是一个 HTTP POST，其正文是一个 `StreamResponse` {{spec §4.3.3}}。无论 agent 使用哪种绑定，JSON 始终是 HTTP+JSON 形式 {{spec §3.5.1}}。所以 `test-runner` 发送一个没有 JSON-RPC 信封的普通 `statusUpdate`，如[图](#fig-push-webhook)所示。

```figure
id: fig-push-webhook
kind: sequence
title: one test run reported through a webhook
claim: With a webhook registered, test-runner posts eight StreamResponse bodies to the planner's receiver after the SendMessage call has already returned.
caption: Read top to bottom in the order the kit ran the steps. The capture file prints the eight deliveries last, but they arrived before the config calls. From capture/out/15-push.http, ids shortened to 8 characters.
```

```listing
title: the first notification, as the receiver saw it
source: capture/out/15-push.http
lang: http
note: The status message is cut. The kit's receiver records only these three headers.
---
POST /a2a-events HTTP/1.1
Content-Type: application/a2a+json
Authorization: Bearer hook_secret_91d2
X-A2A-Notification-Token: planner-run-0006

{
  "statusUpdate": {
    "taskId": "d7d3dceb-7333-4676-90ce-36542116a45c",
    "contextId": "e051d022-3c39-4f5c-bd9c-7a902ae474cd",
    "status": {
      "state": "TASK_STATE_WORKING",
…
      "timestamp": "2026-10-06T09:00:05.000Z"
```

agent 必须把 `PushNotificationConfig.authentication` 中的凭据放进请求头 {{spec §4.3.3}}。规范没有给 `token` 规定传输方式，kit 把它放在 `X-A2A-Notification-Token` 中发送，这是参考 SDK 的请求头 {{sdk src/a2a/server/tasks/base_push_notification_sender.py}}。

规范的请求格式使用 `application/a2a+json` {{spec §4.3.3}}，而参考 SDK 发送的是 `application/json` {{sdk src/a2a/server/tasks/base_push_notification_sender.py}}，kit 的 README 列出了这一点。各 SDK 在令牌请求头和超时上也不同，而且都不重试：

| SDK | Content-Type | 令牌请求头 | 超时 | 重试 |
|---|---|---|---|---|
| a2a-python 1.2.2 {{sdk src/a2a/server/tasks/base_push_notification_sender.py}} | `application/json` | `X-A2A-Notification-Token` | 由服务器传入的 `httpx` 客户端设定 | 无 |
| a2a-go {{sdk-go a2asrv/push/sender.go at v2.6.0}} | `application/json` | `A2A-Notification-Token` | 30 s | 无 |
| a2a-java {{sdk-java server-common/src/main/java/org/a2aproject/sdk/server/tasks/BasePushNotificationSender.java at v1.4.0.Final}} | `application/json` | `X-A2A-Notification-Token` | 未设定 | 无 |
| a2a-js {{sdk-js src/server/push_notification/default_push_notification_sender.ts at v1.3.0}} | `application/a2a+json` | `X-A2A-Notification-Token`，仅当 `authentication` 为空时 | 5 s | 无 |
| a2a-dotnet {{sdk-dotnet src/A2A/Server/A2AServer.cs at v1.0.0-preview2}} | 没有发送方：每个配置操作都返回 `-32003` | | | |
| a2a-rs {{sdk-rust a2a-server/src/push/sender.rs at a2a-server-lf-v0.5.1}} | `application/json` | `A2A-Notification-Token` | 30 s | 无 |

表中的每个发送方都为每个事件发送一个 `StreamResponse`。所以要接受两种内容类型，读取任一个令牌请求头，并把你依赖的密钥放进 `authentication`。规范没有说明发送哪些事件，参考 SDK 还会发送第一个 `Task` {{sdk src/a2a/server/tasks/push_notification_sender.py}}，所以要处理 `StreamResponse` 的每个成员。

## 交付至少尝试一次 {#s-push-notification-configs-delivery-is-attempted-at-least-once}

```rule
label: delivery
source: spec §4.3.3
---
An agent must try to deliver to each configured webhook at least once.
```

至少一次意味着一条通知可能到达两次，所以接收方也有责任。它必须以 HTTP 2xx 状态回应以确认收到。它应以幂等的方式处理通知，因为可能会有重复。它必须检查任务 id 是否对应它预期的某个任务 {{spec §4.3.3}}。

以 `taskId` 和 `timestamp` 为键，状态更新可以安全地应用两次。带有 `append: true` 的 `artifactUpdate` 则不行，而规范没有定义交付 id。所以要把每条通知当作一个信号，并用 `GetTask` 读取任务，正如项目的指南所建议的 {{docs streaming-and-async}}。

重试是可选的：agent 可以用指数退避重试失败的交付 {{spec §4.3.3}}。表中没有任何 SDK 会重试，所以曾经宕机的接收方在恢复后要用 `GetTask` 读取任务。

## 管理配置 {#s-push-notification-configs-managing-configurations}

四个操作管理一个任务存储的配置：创建、获取、列出和删除 {{proto A2AService}}。捕获在运行之后列出、读取并删除了它的配置，如[图](#fig-push-webhook)所示。配置必须保留到任务完成或客户端删除它为止 {{spec §3.1.7}}，删除必须是幂等的 {{spec §3.1.10}}。

在 kit 和参考 SDK 中，获取和列出会原样返回存储的 `credentials` {{sdk src/a2a/server/request_handlers/default_request_handler_v2.py}}，所以能调用它们的人就能读到 webhook 的密钥。这四个操作都需要 card 上的 `pushNotifications`，否则会返回 `PushNotificationNotSupportedError` {{spec §3.3.4}}。

```takeaways
- 在 `SendMessage` 中内联注册 webhook，这样在配置存在之前不会有事件漏掉。
- 把接收方检查的密钥放进 `authentication`，因为 `token` 没有标准的请求头。
- 在根据通知行动之前，先用 `GetTask` 读取任务，因为一条通知可能到达两次。
- 限制谁能调用这四个配置操作，因为读取会返回 webhook 的凭据。
```

Sources: spec §3.1.7, §3.1.10, §3.3.4, §3.5.1, §4.3.1, §4.3.3, §10.4.7, §13.2, Appendix A (research/sources/specification.md); proto TaskPushNotificationConfig, AuthenticationInfo, SendMessageConfiguration, A2AService (research/sources/a2a.proto); docs streaming-and-async (research/sources/docs.md); sdk src/a2a/server/tasks/base_push_notification_sender.py, src/a2a/server/tasks/push_notification_sender.py, src/a2a/server/request_handlers/default_request_handler_v2.py (a2a-python 1.2.2); sdk-go a2asrv/push/sender.go (a2a-go v2.6.0); sdk-java server-common/src/main/java/org/a2aproject/sdk/server/tasks/BasePushNotificationSender.java (a2a-java v1.4.0.Final); sdk-js src/server/push_notification/default_push_notification_sender.ts (a2a-js v1.3.0); sdk-dotnet src/A2A/Server/A2AServer.cs (a2a-dotnet v1.0.0-preview2); sdk-rust a2a-server/src/push/sender.rs (a2a-rs a2a-server-lf-v0.5.1); capture/out/15-push.http; capture/run.py, capture/a2a_ref.py, capture/README.md
