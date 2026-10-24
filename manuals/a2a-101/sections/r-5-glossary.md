# 术语表

> 下面每个术语在整本手册中只有一个含义，它的链接指向定义它的那一节。

| 术语 | 在本手册中的含义 | 定义于 |
|---|---|---|
| A2A 错误（A2A error） | 规范定义并映射到每种绑定中的九个错误之一，例如 `TaskNotFoundError` | [5.5](#s-errors) |
| Agent card | 描述 agent 的 JSON 文档，通常位于 `/.well-known/agent-card.json` | [2.1](#s-agentcard-fields) |
| Artifact | 任务的一个输出，由 part 组成。较长的 artifact 以分块形式到达。 | [3.3](#s-artifact-and-chunks) |
| 阻塞调用（Blocking call） | 等待终止状态或中断状态的发送，这是默认行为 | [4.1](#s-send-message) |
| 能力（Capability） | card 上的一个标志，例如 `streaming`，它允许一组操作 | [2.1](#s-agentcard-fields) |
| Card 签名（Card signature） | `signatures` 中的一个条目：对 card 的 RFC 8785 规范化形式的 JSON Web Signature | [2.3](#s-extended-cards-and-signatures) |
| Context | 把任务和消息归到同一个 `contextId` 下的一段对话 | [3.5](#s-context-id) |
| 直接回复（Direct reply） | 作为一次发送全部结果的 `Message`，不带任务 | [4.1](#s-send-message) |
| 扩展 card（Extended card） | `GetExtendedAgentCard` 返回给已认证客户端的更完整的 card | [2.3](#s-extended-cards-and-signatures) |
| 扩展（Extension） | 以 URI 命名的协议附加功能，在 `capabilities.extensions` 中声明，并通过 `A2A-Extensions` 激活 | [6.2](#s-extensions) |
| 历史（History） | 任务保留的消息，上限由 `historyLength` 决定 | [4.3](#s-get-task-and-list-tasks) |
| 任务内授权（In-task authorization） | agent 在任务进行中请求许可。任务在 `TASK_STATE_AUTH_REQUIRED` 中等待一个在 A2A 之外到达的答复。 | [6.1](#s-security-schemes-and-in-task-authorization) |
| 接口（Interface） | `supportedInterfaces` 中的一个条目：一个 URL、一个协议绑定、一个协议版本和一个可选的 tenant | [2.1](#s-agentcard-fields) |
| 中断状态（Interrupted state） | `TASK_STATE_INPUT_REQUIRED` 或 `TASK_STATE_AUTH_REQUIRED`。任务处于等待中。 | [4.2](#s-input-required-and-auth-required) |
| Message | 一轮对话，带有 `messageId`、`role` 和 part | [3.1](#s-message) |
| 不透明（Opaque） | 对调用方隐藏。不透明的 agent 只展示它发回的内容。 | [1.1](#s-what-a2a-standardizes) |
| Part | 内容的最小单元：`text`、`raw`、`url` 或 `data` 之一 | [3.2](#s-part) |
| 轮询（Polling） | 反复调用 `GetTask` 来跟踪任务 | [4.1](#s-send-message) |
| 协议绑定（Protocol binding） | 操作的一种具体形式：JSON-RPC、gRPC 或 HTTP+JSON | [5.1](#s-json-rpc) |
| 推送通知（Push notification） | 把一个 `StreamResponse` 以 HTTP POST 发送到客户端注册的 webhook | [4.6](#s-push-notification-configs) |
| 远程 agent（Remote agent） | A2A 端点背后接收消息并运行任务的 agent | [1.1](#s-what-a2a-standardizes) |
| 安全要求（Security requirement） | `securityRequirements` 中的一个条目，它把方案名称映射到请求所需的 scope | [6.1](#s-security-schemes-and-in-task-authorization) |
| 安全方案（Security scheme） | 一种具名的认证方式，在 card 的 `securitySchemes` 中声明 | [6.1](#s-security-schemes-and-in-task-authorization) |
| 服务参数（Service parameter） | 每个请求的一个键，例如 `A2A-Version`，作为 HTTP 头或 gRPC 元数据发送 | [5.4](#s-version-and-extension-headers) |
| Skill | card 的 `skills` 中的一个条目，例如 `run-tests` | [2.1](#s-agentcard-fields) |
| 状态消息（Status message） | `TaskStatus` 可以包含的那一条 `message`，例如一个问题或一个原因 | [3.1](#s-message) |
| 流（Stream） | 由 `StreamResponse` 帧组成的 Server-Sent Events 或 gRPC 流。`SubscribeToTask` 在一个任务上打开一个流。 | [4.5](#s-streaming-and-subscribe-to-task) |
| Task | 服务器为一条消息创建的工作单元，带有 `id` 和 `TaskState` | [3.4](#s-task-and-task-state) |
| Tenant | 接口上的一个可选路由字符串，会复制到发往该接口的每个请求中 | [5.2](#s-http-json) |
| 终止状态（Terminal state） | `TASK_STATE_COMPLETED`、`TASK_STATE_FAILED`、`TASK_STATE_CANCELED` 或 `TASK_STATE_REJECTED`。任务不会再改变。 | [4.4](#s-cancel-task-and-terminal-states) |

Sources: spec §1, §1.2, §1.3, §2.2, §3.2.2, §3.2.6, §3.4.1, §3.4.2, §3.7, §4.6, §7.3, §7.6.1, §8.2, §8.3.2, §8.4, §B (research/sources/specification.md); proto TaskState, Role, Message, Part, Artifact, TaskStatus, TaskPushNotificationConfig, AgentCard, AgentCapabilities, AgentExtension, AgentInterface, SecurityRequirement (research/sources/a2a.proto); the definition paragraphs of sections 1.1 to 6.2; capture/planner.py, capture/agents.py, capture/out/05-streaming.events.json
