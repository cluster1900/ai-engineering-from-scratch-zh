# 来源

> 本手册基于一个固定的发布版本、一个参考 SDK、另外五个 SDK、一个测试 kit 和一个捕获 kit，并指出这些来源相互矛盾的每一处。

[如何阅读本手册](#s-front)对来源做了排序，并介绍了 kit。本页固定它们的版本，列出它们之间的冲突，并记录项目在打标签之后做了哪些改动。

## 固定版本 {#s-ref-sources-the-pin}

| 项目 | 值 |
|---|---|
| 发布版本 | A2A 1.0.1，[github.com/a2aproject/A2A](https://github.com/a2aproject/A2A) 的标签 `v1.0.1`，提交 `3303592588e388e62e0f69f701af531d2f4e3991`，于 2026-05-28 打标签 |
| 协议版本 | 每个请求和 card 中都是 `1.0`。事实核实于 2026-10-06。 |
| 主分支 | 2026-10-05 的提交 `679ab3a`，读取它是为了了解标签之后的改动，只在标签缺少某条规则时才引用 |
| 参考 SDK | `a2a-sdk` 1.2.2，[github.com/a2aproject/a2a-python](https://github.com/a2aproject/a2a-python) 的标签 `v1.2.2`，提交 `2f9e44af243df5c7c7a3da361c8d095324bcd5e3`，Apache License 2.0 |
| 捕获 kit | [kit 文件夹](manuals/a2a-101/capture)，只用标准库，在 [kit README](manuals/a2a-101/capture/README.md) 中介绍 |

更新日志把发布日期写为 2026-05-26，而规范横幅仍把 1.0.0 称为最新发布版本（[冲突 D16](#s-ref-sources-the-conflict-register)）。本手册以 `sdk` 加 `src/a2a/` 下的路径引用参考 SDK，从不直接引述它。

## 随附文件 {#s-ref-sources-vendored-files}

[随附文件](manuals/a2a-101/research/sources)按 Apache License 2.0 从该标签复制而来，许可证见 [LICENSE](manuals/a2a-101/research/sources/LICENSE)。审计会检查每个来源标记使用的都是手册声明过的来源键。

| 文件 | 上游 | 来源键 |
|---|---|---|
| a2a.proto | `specification/a2a.proto`，811 行，规范性 | `proto` 加消息名或枚举名 |
| specification.md | `docs/specification.md`，3610 行 | `spec` 加节号 |
| specification-main.md | main 上 `679ab3a` 处的 `docs/specification.md`，3618 行，未发布 | `spec-main` 加节号，只用于标签之后新增的规则 |
| docs.md | 十四个项目页面，共 3019 行，非规范性。本版新增了 `multi-tenancy`、`custom-protocol-bindings` 和 `extension-and-binding-governance`。 | `docs` 加页面名 |

规范 第 1.4 节把 proto 路径写成 `spec/a2a.proto`，这是错的（[冲突 D15](#s-ref-sources-the-conflict-register)）。两份简报按行索引这些文件：[规范简报](manuals/a2a-101/research/brief-spec.md)，包含 40 条发现和下面的冲突登记表；[docs 简报](manuals/a2a-101/research/brief-docs.md)，标出了过时的页面。

## SDK 与测试 kit {#s-ref-sources-the-sdks-and-the-test-kit}

正文各节比较了六个官方 SDK 和官方测试 kit，每个都在一个标签处读取。本手册以 `sdk` 引用参考 SDK，其他的分别为 `sdk-go`、`sdk-java`、`sdk-js`、`sdk-dotnet` 和 `sdk-rust`，并附上文件路径和标签。手册只转述它们，从不直接引述。

| 仓库 | 来源键 | 标签 | 提交 | 日期 |
|---|---|---|---|---|
| [a2a-python](https://github.com/a2aproject/a2a-python) | `sdk` | `v1.2.2` | `2f9e44a` | 2026-10-05 |
| [a2a-go](https://github.com/a2aproject/a2a-go) | `sdk-go` | `v2.6.0` | `ebf17c5` | 2026-09-25 |
| [a2a-java](https://github.com/a2aproject/a2a-java) | `sdk-java` | `v1.4.0.Final` | `6408194` | 2026-09-28 |
| [a2a-js](https://github.com/a2aproject/a2a-js) | `sdk-js` | `v1.3.0` | `29417a5` | 2026-09-29 |
| [a2a-dotnet](https://github.com/a2aproject/a2a-dotnet) | `sdk-dotnet` | `v1.0.0-preview2` | `87fd448` | 2026-04-09 |
| [a2a-rs](https://github.com/a2aproject/a2a-rs) | `sdk-rust` | `a2a-server-lf-v0.5.1` | `32c31f6` | 2026-09-30 |
| [a2a-tck](https://github.com/a2aproject/a2a-tck) | `a2a-tck` 加文件路径 | `1.0.0.alpha2` | `29063fe` | 2026-05-27 |

## 冲突登记表 {#s-ref-sources-the-conflict-register}

此表浓缩了 [规范简报](manuals/a2a-101/research/brief-spec.md)的第 12.2 节，D36 到 D40 是撰写手册时发现的。最后一列说明 A2A 仓库在打标签之后对每一项做了什么，核查于 2026-10-06。“已在 main 修复”表示已合并但未发布。“部分修复”表示 main 上仍有残留。

| ID | 来源的说法 | 手册遵循 | 讨论于 | 上游 |
|---|---|---|---|---|
| D1 | **订阅动词。** proto 为 `GET`。§5.3 和 §11.3.2 为 `POST`。 | proto。两者都接受。 | [前言](#s-front)、[4.5](#s-streaming-and-subscribe-to-task)、[5.2](#s-http-json)、[R.1](#s-ref-operations-by-binding) | 未合并的 [PR #2068](https://github.com/a2aproject/A2A/pull/2068) |
| D2 | **阻塞。** §3.1.1 立即返回。§3.2.2 和 proto 等待。 | §3.2.2 和 proto | [前言](#s-front)、[4.1](#s-send-message)、[7.1](#s-a-client) | 未关闭的 [issue #2135](https://github.com/a2aproject/A2A/issues/2135) |
| D3 | **中断状态下的流。** §3.1.2 和 §3.1.6 在终止状态关闭。§11.7 和流式指南在中断状态也关闭。§7.6.1 让认证流保持打开。 | 在终止状态关闭，在中断状态两种情况都要预料到 | [前言](#s-front)、[1.2](#s-one-task-request-by-request)、[4.2](#s-input-required-and-auth-required)、[4.5](#s-streaming-and-subscribe-to-task)、[R.3](#s-ref-task-states) | 未合并的 [PR #2270](https://github.com/a2aproject/A2A/pull/2270) |
| D4 | **推送配置名称。** 正文为 `PushNotificationConfig`。proto 为 `TaskPushNotificationConfig`。 | proto 的名称 | [4.6](#s-push-notification-configs)、[R.2](#s-ref-objects-and-fields) | 已在 main 部分修复（[PR #1981](https://github.com/a2aproject/A2A/pull/1981)） |
| D5 | **创建请求。** 正文和附录 A 为 `CreateTaskPushNotificationConfigRequest`。proto 为 `TaskPushNotificationConfig`。 | proto | [4.6](#s-push-notification-configs)、[R.1](#s-ref-operations-by-binding) | 已在 main 部分修复（[PR #1981](https://github.com/a2aproject/A2A/pull/1981)） |
| D6 | **card 安全字段。** §3.1.11、§13.3 和 §8.5 示例为 `security`。proto 为 `securityRequirements`。 | proto | [前言](#s-front)、[2.1](#s-agentcard-fields)、[2.3](#s-extended-cards-and-signatures)、[6.1](#s-security-schemes-and-in-task-authorization)、[R.2](#s-ref-objects-and-fields) | 已在 main 部分修复（[PR #2046](https://github.com/a2aproject/A2A/pull/2046)） |
| D7 | **扩展 card 标志的编号。** 附录 A.2.2 为字段 5。proto 为字段 4。 | proto | [2.3](#s-extended-cards-and-signatures) | 无动静 |
| D8 | **协议版本。** 附录 A.2.1 在 card 上用 `protocolVersions`。proto 在每个接口上用 `protocolVersion`。 | 每个接口一个 | [2.1](#s-agentcard-fields) | 已在 main 修复，未发布（[PR #2165](https://github.com/a2aproject/A2A/pull/2165)） |
| D9 | **流事件名称。** 迁移指南为 `taskStatusUpdate`、`taskArtifactUpdate`。proto 为 `statusUpdate`、`artifactUpdate`。 | proto | [4.5](#s-streaming-and-subscribe-to-task)、[7.4](#s-from-0-3-to-1-0) | 已在 main 修复，未发布（[PR #2056](https://github.com/a2aproject/A2A/pull/2056)） |
| D10 | **proto 中没有的字段。** 迁移指南有 `Task.createdAt`、`Task.lastModified`、`configId`、`TaskArtifactUpdateEvent.index`。 | 不要发送它们 | [R.2](#s-ref-objects-and-fields)、[7.4](#s-from-0-3-to-1-0) | 已在 main 部分修复（[PR #2056](https://github.com/a2aproject/A2A/pull/2056)） |
| D11 | **已弃用的 OAuth 流程。** 迁移指南：implicit 和 password 已移除。proto：保留，已弃用。 | 存在，从不使用 | [6.1](#s-security-schemes-and-in-task-authorization) | 无动静 |
| D12 | **分页名称。** 迁移指南为 `cursor`、`limit`、`nextCursor`。proto 为 `pageToken`、`pageSize`、`nextPageToken`。 | proto | [4.3](#s-get-task-and-list-tasks) | 已在 main 修复，未发布（[PR #2165](https://github.com/a2aproject/A2A/pull/2165)） |
| D13 | **错误正文。** §6.4 和 §6.5 示例为 `application/problem+json`。迁移指南为 `application/json`。§11.6 为 `google.rpc.Status`。 | §11.6 | [5.5](#s-errors) | 未合并的 [PR #1641](https://github.com/a2aproject/A2A/pull/1641) 和 [PR #1689](https://github.com/a2aproject/A2A/pull/1689) |
| D14 | **JSON-RPC 方法模板。** §9.3 为 `category/action`。§9.1 和 §9.4 为 PascalCase。 | PascalCase | [5.1](#s-json-rpc) | 无动静 |
| D15 | **proto 路径。** §1.4 为 `spec/a2a.proto`。§5.7、§10.1 和仓库为 `specification/a2a.proto`。 | 仓库 | [1.1](#s-what-a2a-standardizes)、[随附文件](#s-ref-sources-vendored-files) | 无动静 |
| D16 | **发布版本与日期。** 横幅：1.0.0 是最新版本。更新日志 2026-05-26。标签消息 2026-04-23。标签提交 2026-05-28。 | 1.0.1，于 2026-05-28 打标签 | [固定版本](#s-ref-sources-the-pin) | 未合并的 [PR #2072](https://github.com/a2aproject/A2A/pull/2072) |
| D17 | **头部注册。** §14.2.1 和 §14.2.2 引用 Section 3.2.5。服务参数是 §3.2.6。 | §3.2.6 | [5.4](#s-version-and-extension-headers) | 未关闭的 [issue #2305](https://github.com/a2aproject/A2A/issues/2305) |
| D18 | **TLS 版本。** 规范为 1.3 或更高。企业指南为 1.2 或更高。 | 规范 | [6.1](#s-security-schemes-and-in-task-authorization) | 无动静 |
| D19 | **空的必需数组。** §5.7 要求至少一个元素。§8.4.1 的示例 `skills` 为空，而空的 `tasks` 是合法的。 | 无结果时 `tasks` 为空，每个真实 card 上至少一个 skill | [2.1](#s-agentcard-fields)、[R.2](#s-ref-objects-and-fields) | 未关闭的 [issue #2122](https://github.com/a2aproject/A2A/issues/2122) |
| D20 | **typ 头。** §8.4.2 把 `typ` 列在 MUST 字段中，措辞却是 SHOULD。 | 发送 `alg`、`kid`，以及设为 `JOSE` 的 `typ` | [2.3](#s-extended-cards-and-signatures) | 无动静 |
| D21 | **签名步骤。** §8.4.2 和 §8.4.3 移除默认值。§8.4.1 保留 REQUIRED 字段和已设置的可选字段。 | §8.4.1 | [2.3](#s-extended-cards-and-signatures) | 未关闭的 [issue #2249](https://github.com/a2aproject/A2A/issues/2249) |
| D22 | **JSON 命名示例。** §5.5 为 `push_notification_config`。proto 为 `task_push_notification_config`。 | proto | [R.2](#s-ref-objects-and-fields) | 无动静 |
| D23 | **违反 REQUIRED 的示例。** 有些示例省略了 `messageId`、`artifactId` 或事件的 `contextId`。 | 永远不要原样照抄示例 | [3.1](#s-message)、[6.2](#s-extensions) | 已在 main 部分修复（[PR #2083](https://github.com/a2aproject/A2A/pull/2083)） |
| D24 | **无效的 JSON。** §4.6.1、§6.7 和 §9.4.1 中的示例。 | 永远不要原样照抄示例 | [3.2](#s-part)、[6.2](#s-extensions) | 未合并的 [PR #1657](https://github.com/a2aproject/A2A/pull/1657) |
| D25 | **第 2 层图示。** §1.3 显示 Get Agent Card。§3.1 只定义了 Get Extended Agent Card。 | 该图是非正式的 | [1.1](#s-what-a2a-standardizes) | 无动静 |
| D26 | **必须实现的操作。** §3.1 要求全部实现。§3.3.4 允许用标志拒绝流式传输、推送和扩展 card。 | 能力标志 | [2.2](#s-discovery-and-supported-interfaces) | 无动静 |
| D27 | **指南中的传输。** Core Concepts：一切都用 JSON-RPC 2.0。规范：三种绑定。 | 规范 | [5.1](#s-json-rpc) | 无动静 |
| D28 | **谁创建 context id。** Core Concepts：服务器。规范：客户端可以提议一个。 | 规范 | [3.5](#s-context-id) | 未关闭的 [issue #1317](https://github.com/a2aproject/A2A/issues/1317) |
| D29 | **来自扩展的状态。** 扩展指南列出了添加状态的扩展，同时又禁止新的枚举值。 | 两者都不是规范性的。不要添加状态。 | [3.4](#s-task-and-task-state)、[6.2](#s-extensions) | 无动静 |
| D30 | **扩展激活。** §4.6.1 为 JSON-RPC 参数。§9.2 为 HTTP 头。 | 头部 | [5.4](#s-version-and-extension-headers) | 无动静 |
| D31 | **作为参数的版本。** §3.6.1 允许请求参数。§9.2 和 §11.2 要求使用头部。 | 头部 | [5.4](#s-version-and-extension-headers) | 未关闭的 [issue #2184](https://github.com/a2aproject/A2A/issues/2184) |
| D32 | **旧的端点名称。** what-is-a2a 图示：`POST /sendMessage`、`/.well-known/agent-card`。 | `message:send`、`agent-card.json` | [2.2](#s-discovery-and-supported-interfaces) | 已在 main 修复，未发布（[PR #2261](https://github.com/a2aproject/A2A/pull/2261)） |
| D33 | **指南中的流类型。** 流式指南为 `SendStreamingMessageResponse`。规范为 `StreamResponse`。 | 规范 | [4.5](#s-streaming-and-subscribe-to-task) | 无动静 |
| D34 | **gRPC 接口 URL。** proto：绝对 HTTPS URL。gRPC 拨号的是主机和端口。 | 标签处没有规则 | [2.1](#s-agentcard-fields)、[5.3](#s-grpc) | 已在 main 修复，未发布（[PR #1997](https://github.com/a2aproject/A2A/pull/1997)） |
| D35 | **role 的拼写。** §2.2 为 user 和 agent。proto 和 §5.5 为 `ROLE_USER`、`ROLE_AGENT`。 | 枚举名称 | [3.1](#s-message) | 无动静 |
| D36 | **另一个客户端的任务。** §3.3.2 称之为授权错误，并禁止透露它存在。 | `TaskNotFoundError` | [6.1](#s-security-schemes-and-in-task-authorization) | 无动静 |
| D37 | **0.3 的状态名称。** §3.4.3 为 `input-required`。proto 为 `TASK_STATE_INPUT_REQUIRED`。 | proto 的名称 | [3.4](#s-task-and-task-state) | 未合并的 [PR #2155](https://github.com/a2aproject/A2A/pull/2155) |
| D38 | **取消的状态转换。** 迁移指南：在 1.0 中已澄清。spec：没有转换表。 | 状态转换属于实现行为 | [3.4](#s-task-and-task-state) | 未关闭的 [issue #1992](https://github.com/a2aproject/A2A/issues/1992) |
| D39 | **示例中的版本。** §9.2、§11.2 和 §14.2.1 发送 `A2A-Version: 0.3`。 | 发送 `1.0` | [5.4](#s-version-and-extension-headers) | 无动静 |
| D40 | **旧的扩展 card 标志。** 附录 A.2.2 为 `supportsExtendedAgentCard`。迁移指南和 SDK 为 `supportsAuthenticatedExtendedCard`。 | `capabilities` 中的 `extendedAgentCard` | [2.3](#s-extended-cards-and-signatures)、[7.4](#s-from-0-3-to-1-0) | 无动静 |

## 登记表之后发现的差异 {#s-ref-sources-discrepancies-found-after-the-register}

为本版所做的研究又发现了二十处文档页面、附录或示例与 proto 或 spec 不一致的地方。它们都不改变手册遵循的内容。最后一列说明 main 上是否仍有该文本，核查于 2026-10-06。

| ID | 来源的说法 | 手册遵循 | 讨论于 | 在 main 上 |
|---|---|---|---|---|
| N1 | **指南中的流事件 kind。** 迁移指南，针对 0.3：`kind` 值为 `taskStatusUpdate` 和 `taskArtifactUpdate`。附录 A.2.1 和 0.3 schema：`status-update` 和 `artifact-update`。 | 附录 A.2.1 | 仅 R.6 | 已修复 |
| N2 | **扩展路径。** 迁移指南为 `agentCard.extensions`。proto 为 `capabilities.extensions`。 | proto | [6.2](#s-extensions)、[R.2](#s-ref-objects-and-fields) | 未改变 |
| N3 | **tenant 范围。** 迁移指南：gRPC 请求中的 tenant 作用域。proto：每个请求消息上都有 `tenant`，每个 rpc 都有一个 `/{tenant}` 路由。 | proto | [5.2](#s-http-json) | 未改变 |
| N4 | **0.3 中的 ListTasks。** 迁移指南：0.3 中不可用。0.3 正文列出了 `tasks/list`，而 0.3 的 proto 和 schema 没有。 | 指南，理解为不在 0.3 schema 中 | 仅 R.6 | 无需改动 |
| N5 | **升级标题。** 附录 A.2.1 在关于 1.0 变更的标题下写的是 `pre-0.3.x`。 | 理解为 pre-1.0 | 仅 R.6 | 未改变 |
| N6 | **移除时间表。** 附录 A 把 1.0 重命名的名称的移除定在 0.5.0 或更高版本，并称该时间表只是示例。 | §1.4：下一个主版本 | 仅 R.6 | 未改变 |
| N7 | **被移除的 card 字段名。** 附录 A.2.2 为 `supports_extended_agent_card`，字段 13。0.3 proto 为 `supports_authenticated_extended_card`，字段 13。 | 0.3 proto | 仅 R.6 | 未改变 |
| N8 | **§10.2 示例中的版本。** gRPC 示例发送 `a2a-version` `0.3`，D39 没有列出这一处。 | 发送 `1.0` | [5.3](#s-grpc) | 未改变 |
| N9 | **配置 id 名称。** 迁移指南为 `config_id`。proto 为 `id`。 | proto | [R.2](#s-ref-objects-and-fields) | 已修复 |
| N10 | **把扩展列表当作新字段。** 迁移指南说 1.0 新增了 `Message.extensions` 和 `Artifact.extensions`。两者在 0.3 proto 中都已存在。 | 不是新增的 | 仅 R.6 | 未改变 |
| N11 | **把双向 TLS 当作新功能。** 迁移指南说 1.0 新增了双向 TLS。0.3 proto 已有 `mtls_security_scheme`。 | 不是新增的 | 仅 R.6 | 未改变 |
| N12 | **tenant 路由。** §5.3、§11.3 和 §11.5 没有列出 `/{tenant}` 路由。proto 为每个 rpc 都添加了一个。 | proto | [5.2](#s-http-json)、[R.1](#s-ref-operations-by-binding) | 未改变 |
| N13 | **tenant 字段编号。** `ListTaskPushNotificationConfigsRequest.tenant` 是字段 4。其他每个请求都是字段 1。 | 没有冲突。只在 gRPC 中可见。 | 仅 R.6 | 未改变 |
| N14 | **任何 part 上的 filename。** 迁移指南：每个 part 上都有 `filename`。proto 注释：用于文件。 | proto 允许它出现在任何 part 上。用于文件。 | [3.2](#s-part) | 未改变 |
| N15 | **附录 A 中的创建请求。** 该表把 `CreateTaskPushNotificationConfigRequest` 列为当前类型。它是 0.3 的类型。 | proto，同 D5 | [4.6](#s-push-notification-configs) | 未改变 |
| N16 | **操作别名。** 迁移指南：过渡期间有别名。proto 和方法集都没有定义。SDK 兼容层定义了。 | spec。指明是 SDK 层。 | 仅 R.6 | 未改变 |
| N17 | **翻转的默认值。** 迁移指南把 `returnImmediately` 列为新增。0.3 的 `blocking` 默认为 false，即不等待。1.0 的 `returnImmediately` 默认为 false，即等待。 | §3.2.2 和 proto | [4.1](#s-send-message) | 未改变 |
| N18 | **扩展指南中的 card 示例。** 顶层的 `url`，这是 0.3 的结构。 | `supportedInterfaces` | 仅 R.6 | 已修复 |
| N19 | **gRPC 专用包装。** §10.5.1 称 `TaskPushNotificationConfig` 为 gRPC 资源类型。proto 在每种绑定中都使用它。 | proto | 仅 R.6 | 未改变 |
| N20 | **多租户指南中的安全。** multi-tenancy 页面为 `securitySchemes` 和 `security`。proto 为 `securityRequirements`。 | proto，同 D6 | 仅 R.6 | 未改变 |

## v1.0.1 之后 {#s-ref-sources-after-v1-0-1}

本手册核查了 A2A 仓库 `main` 分支在提交 `679ab3a`（日期 2026-10-05）处的状态，发现标签之后有 73 个提交。其中一个改动了 proto：[PR #1997](https://github.com/a2aproject/A2A/pull/1997) 允许 gRPC 接口的 `url` 是 `hostname:port` 地址，这解决了 D34。它是待发布的 1.0.2 版本中唯一的条目，该版本对应的 [PR #2072](https://github.com/a2aproject/A2A/pull/2072) 仍未合并。

[PR #2081](https://github.com/a2aproject/A2A/pull/2081) 新增了 §7.6.4 In-Task Authorization Scope，本手册以键 `spec-main` 引用它。分支 `dev-1.1` 在 2026-09-22 的提交 `db39eb5` 处包含 1.1 的工作：一个 `generation` 字段和一个任务时间线。针对 D1 和 D3 的已批准修复以该分支为目标，目前仍未合并。截至 2026-10-06，不存在比 `v1.0.1` 更新的标签。

Sources: manual.json pin, sources and quoteSources; research/sources/README.md and LICENSE; spec §1.4, §3.6, §5.7, §10.1 (research/sources/specification.md); research/sources/specification-main.md §7.6.4 (main at 679ab3a); research/brief-spec.md sections 1.1, 12.2 and 14; research/brief-docs.md; research/conflicts-upstream.md, research/migration.md section D.6, research/sdk-splits.md section 1, research/conformance-tools.md (research of 2026-10-06); a2aproject/A2A main at 679ab3a, branch dev-1.1 at db39eb5, and the PRs and issues in the Upstream column, checked 2026-10-06; the a2a-python checkout at tag v1.2.2 (pyproject.toml, LICENSE); the SDK and a2a-tck repositories at the tags in the SDK table; manuals/a2a-101/capture/README.md, capture/run.py
