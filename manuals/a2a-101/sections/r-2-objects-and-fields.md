# 对象与字段

> proto 定义了请求、响应或流帧中的每个对象，每个字段都有一个 lowerCamelCase 的 JSON 名称、一个类型和一条存在规则。

粗体行是 proto 消息的名称，proto 是数据对象的规范性来源，每个粗体行下面的行是它的字段 {{spec §1.4}}。字段使用它们的 lowerCamelCase JSON 名称 {{spec §5.5}}，尽管 §5.5 的示例转换的是 `push_notification_config`，而 proto 把这个字段命名为 `task_push_notification_config`（[冲突 D22](#s-ref-sources-the-conflict-register)）。

必需一列中的 *是* 标记一个 `REQUIRED` 字段，它在每条有效消息中都必须存在且被设置 {{spec §5.7}}。必需的数组包含一个或多个元素，但空的 `tasks` 列表是合法的（[冲突 D19](#s-ref-sources-the-conflict-register)）。以 `optional` 开头的类型使用 proto 关键字，记录该字段是否被设置。

表格省略了一些可选字段。`Task`、`Message`、`Part`、`Artifact` 和两种流事件都带有一个 `metadata` 对象，`Message` 和 `Artifact` 带有 `extensions`，即一个 URI 列表。part 可以给出 `filename`，artifact 可以给出 `description`，skill 可以给出 `examples`，card 可以给出 `documentationUrl` 和 `iconUrl`。每个请求消息，从 `SendMessageRequest` 到 `GetExtendedAgentCardRequest`，都带有一个可选的 `tenant` 字符串，当所选接口设置了 `tenant` 时，它必须与之匹配 {{proto SendMessageRequest}}。[按绑定列出的操作](#s-ref-operations-by-binding)列出了请求和响应消息。

## 任务与消息对象 {#s-ref-objects-and-fields-task-and-message-objects}

[Message](#s-message)、[Part](#s-part)、[Artifact 与分块](#s-artifact-and-chunks)、[Task、TaskStatus 和 TaskState](#s-task-and-task-state)、[SendMessage](#s-send-message) 和[推送通知配置](#s-push-notification-configs)几节定义了这些对象。

| 字段 | 类型 | 必需 | 含义 |
|---|---|---|---|
| **Task** | | | 工作单元，由服务器创建 |
| id | string | 是 | 由服务器生成 |
| contextId | string | | context。两种流事件都需要它。 |
| status | TaskStatus | 是 | 状态、状态消息和时间 |
| artifacts | repeated Artifact | | 输出。`ListTasks` 需要 `includeArtifacts` 才会返回它们。 |
| history | repeated Message | | 保留的消息，上限由 `historyLength` 决定 |
| **TaskStatus** | | | 任务的状态 |
| state | TaskState | 是 | [任务状态](#s-ref-task-states)中的一个值 |
| message | Message | | agent 的附注，例如一个问题 |
| timestamp | google.protobuf.Timestamp | | 记录的时间，采用 ISO 8601 和 UTC |
| **Message** | | | 对话中的一轮 |
| messageId | string | 是 | 由发送方生成。agent 可以用它检测重复。 |
| contextId | string | | context。每条服务器消息都有它。 |
| taskId | string | | 任务。客户端给出的值指向一个与 `contextId` 匹配的现有任务。 |
| role | Role | 是 | 客户端为 `ROLE_USER`，服务器为 `ROLE_AGENT` |
| parts | repeated Part | 是 | 内容，一个或多个 part |
| referenceTaskIds | repeated string | | 消息引用的其他任务 |
| **Part** | | | 恰好是 `text`、`raw`、`url` 和 `data` 之一 |
| text | string | | 文本内容 |
| raw | bytes | | 文件内容，在 JSON 中为 base64 |
| url | string | | 指向文件内容的 URL |
| data | google.protobuf.Value | | 任意 JSON 值 |
| mediaType | string | | 媒体类型，适用于每种 part |
| **Artifact** | | | 任务的一个输出 |
| artifactId | string | 是 | 在任务内唯一。分块按它匹配。 |
| name | string | | 可读的名称，例如 `test-log.txt` |
| parts | repeated Part | 是 | 内容，一个或多个 part |
| **TaskStatusUpdateEvent** | | | 任务状态的一次变化 |
| taskId, contextId | string | 是 | 任务及其 context |
| status | TaskStatus | 是 | 新的状态 |
| **TaskArtifactUpdateEvent** | | | 一个新的 artifact，或它的一个分块 |
| taskId, contextId | string | 是 | 任务及其 context |
| artifact | Artifact | 是 | artifact 或分块 |
| append | bool | | 为 true 时，添加到具有此 `artifactId` 的 artifact |
| lastChunk | bool | | 为 true 时，这是最后一个分块 |
| **StreamResponse** | | | 一个流帧或推送正文，四者之一 {{spec §3.2.3}} {{spec §4.3.3}} |
| task | Task | | 任务的当前状态。它是任务流和订阅的开头。 |
| message | Message | | 只有消息的流包含一个，然后关闭。 |
| statusUpdate | TaskStatusUpdateEvent | | 任务状态的一次变化 |
| artifactUpdate | TaskArtifactUpdateEvent | | 一个新的 artifact 或分块 |
| **SendMessageConfiguration** | | | 一次发送的 `configuration` |
| acceptedOutputModes | repeated string | | 客户端接受的媒体类型 |
| taskPushNotificationConfig | TaskPushNotificationConfig | | 要注册的 webhook，不带 `taskId` |
| historyLength | optional int32 | | 未设置表示没有限制，`0` 表示不返回。 |
| returnImmediately | bool | | 为 true 时，任务一存在就返回。默认会等待。 |
| **TaskPushNotificationConfig** | | | 一个任务的 webhook |
| tenant | string | | 如果设置了，必须与接口的 `tenant` 匹配 |
| id | string | | 配置 id，在创建时分配 |
| taskId | string | | 它所属的任务 |
| url | string | 是 | webhook URL |
| token | string | | 任务或会话的令牌。没有定义传输方式。 |
| authentication | AuthenticationInfo | | agent 如何认证：一个必需的 `scheme`（例如 `Bearer`）和可选的 `credentials` |

## Agent card 对象 {#s-ref-objects-and-fields-agent-card-objects}

[AgentCard 字段](#s-agentcard-fields)、[扩展 card 与签名](#s-extended-cards-and-signatures)、[安全方案](#s-security-schemes-and-in-task-authorization)和[扩展](#s-extensions)几节定义了这些对象。

| 字段 | 类型 | 必需 | 含义 |
|---|---|---|---|
| **AgentCard** | | | agent 提供什么、在哪里提供、要求什么 |
| name | string | 是 | 可读的名称，例如 `test-runner` |
| description | string | 是 | agent 做什么 |
| supportedInterfaces | repeated AgentInterface | 是 | 在哪里访问它。首选第一个条目。 |
| provider | AgentProvider | | 提供方：必需的 `url` 和 `organization` |
| version | string | 是 | agent 自己的版本，例如 `2.3.0` |
| capabilities | AgentCapabilities | 是 | 它支持的可选功能 |
| securitySchemes | map<string, SecurityScheme> | | 接受的认证方案，按名称列出 |
| securityRequirements | repeated SecurityRequirement | | 方案名称到 scope 的映射，例如 `{"schemes": {"bearer": {"list": []}}}` |
| defaultInputModes | repeated string | 是 | 所有 skill 都接受的媒体类型 |
| defaultOutputModes | repeated string | 是 | 所有 skill 都产生的媒体类型 |
| skills | repeated AgentSkill | 是 | agent 擅长做的事 |
| signatures | repeated AgentCardSignature | | 对规范化 card 的 JWS 签名 |
| **AgentInterface** | | | 访问 agent 的一种方式 |
| url | string | 是 | 生产环境中为绝对 HTTPS URL |
| protocolBinding | string | 是 | `JSONRPC`、`GRPC`、`HTTP+JSON` 或自定义绑定 URI |
| tenant | string | | 一个路由值。设置时，把它复制到发往此接口的每个请求中。 |
| protocolVersion | string | 是 | A2A 版本，例如 `1.0` |
| **AgentCapabilities** | | | 可选功能。缺失的标志表示 `false`。 |
| streaming | optional bool | | 允许 `SendStreamingMessage` 和 `SubscribeToTask` |
| pushNotifications | optional bool | | 允许四个推送配置操作 |
| extensions | repeated AgentExtension | | 它支持的协议扩展 |
| extendedAgentCard | optional bool | | 允许 `GetExtendedAgentCard` |
| **AgentExtension** | | | agent 支持的一个扩展，位于 `capabilities.extensions` 中 |
| uri | string | | 标识该扩展的 URI |
| description | string | | 这个 agent 如何使用该扩展 |
| required | bool | | 为 true 时，客户端必须理解并遵守该扩展 |
| params | google.protobuf.Struct | | 扩展的配置，是一个 JSON 对象 |
| **AgentSkill** | | | agent 擅长的一件事 |
| id | string | 是 | skill id，例如 `run-tests` |
| name | string | 是 | 可读的名称 |
| description | string | 是 | skill 做什么 |
| tags | repeated string | 是 | 关键词，一个或多个 |
| inputModes | repeated string | | 覆盖 card 设置的输入媒体类型 |
| outputModes | repeated string | | 覆盖 card 设置的输出媒体类型 |
| securityRequirements | repeated SecurityRequirement | | 这个 skill 的要求 |

## proto 未定义的名称 {#s-ref-objects-and-fields-names-the-proto-does-not-define}

较旧的资料和文档中过时的页面仍在使用这些名称，而 v1.0.1 的 proto 中没有一个存在（[冲突 D10](#s-ref-sources-the-conflict-register)）。

| 名称 | 改用 |
|---|---|
| part 或流事件上的 `kind` | 成员名，例如 `text` 或 `statusUpdate` |
| `TextPart`, `FilePart`, `DataPart` | 一个带有 `text`、`raw` 或 `url`、或 `data` 的 `Part` |
| `TaskStatusUpdateEvent` 上的 `final` | 流的关闭 |
| `taskStatusUpdate`, `taskArtifactUpdate` | `statusUpdate`, `artifactUpdate` |
| `Task.createdAt`, `Task.lastModified` | `status.timestamp` |
| `TaskArtifactUpdateEvent.index` | `artifactId`，分块按它匹配 |
| `PushNotificationConfig`, `CreateTaskPushNotificationConfigRequest` | `TaskPushNotificationConfig`，创建操作把它作为请求（[冲突 D4](#s-ref-sources-the-conflict-register)） |
| 推送配置上的 `configId` | `id` |
| card 的 `url`、`protocolVersion`、`preferredTransport`、`additionalInterfaces` | `supportedInterfaces`，每个条目上有 `url` 和 `protocolVersion` |
| card 的 `supportsAuthenticatedExtendedCard` | `capabilities.extendedAgentCard` |
| card 的 `security` | `securityRequirements`（[冲突 D6](#s-ref-sources-the-conflict-register)） |
| 顶层的 card `extensions` | `capabilities.extensions`（[差异 N2](#s-ref-sources-discrepancies-found-after-the-register)） |
| `cursor`, `limit`, `nextCursor` | `pageToken`, `pageSize`, `nextPageToken` |

Sources: proto messages from Task to AgentSkill, with AgentExtension, AuthenticationInfo, AgentProvider, SecurityRequirement, and the request messages from SendMessageRequest to GetExtendedAgentCardRequest (research/sources/a2a.proto); spec §1.4, §3.1.4, §3.1.7, §3.2.2, §3.2.3, §3.3.4, §3.4.2, §4.3.3, §5.5, §5.6.1, §5.7, §A.2.1 (research/sources/specification.md); docs whats-new-v1 (research/sources/docs.md); research/brief-spec.md sections 2.0 to 2.8, 8.3 and 12.2; research/brief-docs.md; research/migration.md section D.6 (N2); capture/out/01-agent-cards.http
