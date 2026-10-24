# 安全要求

> 第 13 和第 14 节列出了服务器和客户端 MUST 和 SHOULD 检查的内容，其中大部分检查针对的是另一个 agent 发来的数据。

planner 读取来自 `code-reviewer` 的 `review.json` 和来自 `test-runner` 的 `test-log.txt` 分块，在 `localhost:41250` 注册一个 webhook，并向 `deployer` 发送一个 bearer 令牌。每一步都跨越两方之间的一条边界，而 A2A 中没有任何字段把跨越边界的内容标为安全。规范的第 13 和第 14 节说明了每一方在这些边界上必须检查什么。

读完本节后，你能说出每条边界上适用的规则，并说出 kit 和各 SDK 是否满足它。[图](#fig-trust-boundaries)标出了 kit 中的六条边界以及每条边界上的检查。

```figure
id: fig-trust-boundaries
kind: layers
title: trust boundaries in the kit, with a threat and a check at each
claim: Data crosses six boundaries in the kit's system, and each needs a check of its own, because A2A labels nothing it carries as safe.
caption: Read each row left to right: where data crosses, what can go wrong, and the check the specification asks for. Rows appear in the order the planner meets them. Violet checks belong to the planner and blue checks to the remote agent. From capture/out/15-push.http, 06-input-required.http, 11-errors.http, and 17-signed-card.txt.
```

## 要求，以及谁满足了它们 {#s-security-requirements-the-requirements-and-who-meets-them}

表中列出了 §13 和 §14 中以 MUST 或 SHOULD 约束服务器或客户端的每条规则。kit 一列说明 kit 在哪里满足或不满足该规则。SDK 一列给出了对六个官方 SDK 的比较（如果做过的话），并链接到负责细节的那一节。

| 规则 | kit | 各 SDK |
|---|---|---|
| 服务器必须在每个 A2A 操作请求上检查授权 {{spec §13.1}} | 不按调用者检查：deployer 需要一个共享令牌，另外两个 agent 接受任何人 | 都不包含认证，所有者范围各不相同，见[安全方案](#s-security-schemes-and-in-task-authorization)一节的表格 |
| `GetExtendedAgentCard` 必须要求认证 {{spec §13.3}} | deployer 在每个方法之前检查它的 bearer 令牌 | 核心处理器中都没有，见[扩展 card](#s-extended-cards-and-signatures)一节的表格 |
| agent 必须在其 webhook 请求中放入认证凭据 {{spec §13.2}} | 每个 POST 上都有 `Authorization: Bearer hook_secret_91d2` | 每个发送推送的 SDK 都满足。a2a-go 和 a2a-rs 只发送 `Bearer` 和 `Basic` 方案 {{sdk-go a2asrv/push/sender.go at v2.6.0}} {{sdk-rust a2a-server/src/push/sender.rs at a2a-server-lf-v0.5.1}}，a2a-dotnet 没有发送方 {{sdk-dotnet src/A2A/Server/A2AServer.cs at v1.0.0-preview2}} |
| agent 应针对 SSRF 验证 webhook URL {{spec §13.2}} | 接受 `http://localhost:41250/a2a-events`，因为所有进程都在一台机器上运行 | a2a-go、a2a-rs 和 a2a-java 默认拒绝私有主机 {{sdk-java server-common/src/main/resources/META-INF/a2a-defaults.properties at v1.4.0.Final}}。a2a-python 有一个需选择启用的验证器 {{sdk src/a2a/utils/push_url_validator.py}}，笔记中没有记录 a2a-js 有任何检查 |
| agent 应为 webhook 请求设置合理的超时，并应重试 {{spec §13.2}} | 10 s，不重试 | a2a-js 为 5 s，a2a-go 和 a2a-rs 为 30 s，a2a-python 和 a2a-java 使用 HTTP 客户端的默认值，都不重试 |
| 客户端必须用它提供的凭据检查每个 webhook {{spec §13.2}} | planner 的接收方记录请求头，但什么都不检查 | 未比较，[推送通知](#s-push-notification-configs)一节列出了接收方的职责 |
| 客户端应为每个推送通知配置使用唯一且单一用途的令牌 {{spec §13.2}} | 每次运行一个令牌，读取时以明文返回 | 参考 SDK 也以明文返回存储的凭据，如[推送通知](#s-push-notification-configs)一节所示 |
| agent 必须在处理请求之前验证每个输入参数。它应检查文件内容类型，并拒绝它没有预料到的媒体类型 {{spec §13.4}} | 缺失的字段以带 `BadRequest` 详情的 `-32602` 回答，`code-reviewer` 拒绝带 `image/png` 的 `url` part | 参考 SDK 的媒体类型检查默认关闭，kit 的 README 列出了这一点 |
| 实现必须针对注入攻击清理来自用户的内容 {{spec §14.1.1}} | planner 只根据有类型的数据字段做决定 | 未比较 |
| A2A 消息中的文件引用必须针对服务端请求伪造（SSRF）进行验证 {{spec §14.1.1}} | `code-reviewer` 不获取任何 URL | 未比较 |
| 日志不得包含凭据或个人数据，除非确有需要并受到保护 {{spec §13.4}} | 捕获文件中有 `dpl_test_7c1e4b` 和 `hook_secret_91d2`，它们是测试值 | 未比较 |
| 实现应通过 HTTPS 提供 Agent Card，card 带有签名时客户端应验证签名 {{spec §14.3}} | planner 通过普通 HTTP 获取 card，不验证任何东西，`17-signed-card.txt` 展示了这项检查 | 未比较，[扩展 card 与签名](#s-extended-cards-and-signatures)一节讲解了验证 |
| agent 应对每个操作限流，并应记录安全事件 {{spec §13.4}} | 无 | 未比较 |

其中三条规则值得多讲几句，因为它们所保护的数据在每个任务中都会到达。

## 文本是数据，即使读起来像命令 {#s-security-requirements-text-is-data-even-when-it-reads-like-an-order}

**提示注入：** 作为数据到达、却被接收方的模型当作指令遵循的文本。part 中没有任何字段说明它的内容可信到什么程度 {{proto Part}}，而 `review.json` 是根据别人写的 diff 构建的。

```rule
label: input is checked before it is read
source: spec §14.1.1
---
The server must validate content against the A2A protocol schema before it processes the content.
```

kit 的 planner 根据数据 part 做决定。它从 `summary.json` 读取 `failed`，从 `review.json` 的每个发现中读取 `severity`，并忽略它们旁边的自由文本。它唯一一次使用远程文本，是对审查者的问题做子串测试。基于模型构建的 planner 会读取多得多的内容。所以只根据你检查过的有类型字段行动。把副作用放在由人或策略控制的批准之后，就像 deployer 那样。

## URL 决定接收方自己的请求指向哪里 {#s-security-requirements-urls-aim-the-receiver-s-own-requests}

**服务端请求伪造（SSRF）：** 服务器向外部调用者选定的地址（例如某个内部服务）发送请求。`url` part 会招致这种情况，webhook URL 也会，agent 会为任务之后的每个事件调用它。

kit 的 `code-reviewer` 拒绝媒体类型为 `image/png` 的 `url` part，因为它的输入 mode 中没有列出这种类型，它也不获取任何内容。对于 webhook，规范要求 agent 拒绝私有地址范围 `127.0.0.0/8`、`10.0.0.0/8`、`172.16.0.0/12` 和 `192.168.0.0/16` {{spec §13.2}}。

它们还要拒绝 localhost 和链路本地地址 {{spec §13.2}}。kit 接受 `http://localhost:41250/a2a-events`，只是因为所有进程都在一台机器上运行。参考 SDK 的验证器会拒绝解析到回环、私有、链路本地、保留、组播或未指定地址的主机 {{sdk src/a2a/utils/push_url_validator.py}}。它只有在宿主开启它时才运行。[推送通知](#s-push-notification-configs)一节讲解了接收方的检查。

## 比任务存在得更久的记录 {#s-security-requirements-records-that-outlive-the-task}

读取存储的配置会以明文返回它的密钥：

```listing
title: the configuration read back with its secret in clear
source: capture/out/15-push.http
lang: json
note: The ListTaskPushNotificationConfigs reply, cut to one configuration.
---
    "configs": [
      {
        "id": "92c697ef-4abc-4e86-82ba-dc6bce4077af",
        "taskId": "d7d3dceb-7333-4676-90ce-36542116a45c",
        "url": "http://localhost:41250/a2a-events",
        "token": "planner-run-0006",
        "authentication": {
          "scheme": "Bearer",
          "credentials": "hook_secret_91d2"
```

这些读取需要任务自身的访问检查 {{spec §13.1}}，[安全方案](#s-security-schemes-and-in-task-authorization)一节讲解了这个范围。捕获文件以明文保存 `dpl_test_7c1e4b` 和 `hook_secret_91d2`，这之所以安全，只是因为它们是测试值。`refunds.diff` part 留在审查任务的 `history` 中。任务历史和 artifact 中的敏感信息必须按数据保护规则的要求加以保护 {{spec §14.1.1}}。按照 §13.4 的建议，为所有这些设定保留期限 {{spec §13.4}}。

```takeaways
- 只根据你验证过的数据 part 中的有类型字段做决定。
- 拒绝解析到回环、私有或链路本地地址的 webhook URL 和文件 URL。
- 在每条通知上检查 `Authorization` 值和任务 id。
- 让凭据远离日志，远离其他调用者能读取的记录。
```

Sources: spec §13.1, §13.2, §13.3, §13.4, §14.1.1, §14.3 (research/sources/specification.md); proto Part (research/sources/a2a.proto); sdk src/a2a/utils/push_url_validator.py at a2a-python 1.2.2; sdk-go a2asrv/push/sender.go at v2.6.0; sdk-rust a2a-server/src/push/sender.rs at a2a-server-lf-v0.5.1; sdk-java server-common/src/main/resources/META-INF/a2a-defaults.properties at v1.4.0.Final; sdk-dotnet src/A2A/Server/A2AServer.cs at v1.0.0-preview2; capture/out/06-input-required.http, 11-errors.http, 15-push.http, 17-signed-card.txt; capture/planner.py, capture/a2a_ref.py, capture/README.md
