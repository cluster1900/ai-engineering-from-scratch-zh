# A2A 101 capture kit

A2A 101 中每一个请求、响应和流帧都来自本 kit。它在你的机器上运行三个远程 agent 和一个录制客户端，只用 Python 标准库。它不需要网络，也不需要密钥。

```bash
python3 run.py          # writes out/
python3 run.py --check  # captures again into a temporary folder and compares
```

输出是确定性的。id 来自带种子的生成器，时间戳来自一个从 2026-10-06T09:00:00Z 开始的时钟，每给一个新任务或一个状态打一次时间戳就前进 250 ms，每个场景按固定顺序跑它的步骤。两次运行写出逐字节相同的文件，所以 `--check` 就是一次普通比较，什么都不掩码。

## 这些 agent

| Agent | 端口 | 作用 | 展示内容 |
|---|---|---|---|
| `test-runner` | 41241 | 运行测试套件并流式传输日志 | 流式传输、分块 artifact、轮询、取消、推送通知、两种 JSON 绑定 |
| `code-reviewer` | 41242 | 对照基准分支审查 diff | 直接消息回复、`TASK_STATE_INPUT_REQUIRED`、被拒绝的内容类型、不支持推送 |
| `deployer` | 41243 | 操作员批准后把构建部署到 staging | bearer 认证、`TASK_STATE_AUTH_REQUIRED` 且在 A2A 之外批准、拒绝、扩展 card 与签名 card |

`planner.py` 是第 7.1 节的客户端 agent。它读取三张 card，为每个 skill 选一个 agent，并处理任务到达的每一种状态。

## 这些场景

| 文件 | 展示 |
|---|---|
| `01-agent-cards.http` | 来自 `/.well-known/agent-card.json` 的三张 card |
| `02-message-reply.http` | 用一条消息回答问题，没有任务 |
| `03-blocking-task.http` | 一次等到任务完成的 `SendMessage` |
| `04-polling.http` | `returnImmediately`，然后在工作中和完成后做 `GetTask` |
| `05-streaming.http` | `SendStreamingMessage` 的每一帧，日志以分块到达 |
| `06-input-required.http` | 审查方询问基准分支，客户端在同一任务上回答 |
| `07-auth-required.http` | 一次部署等待操作员，流保持打开 |
| `08-rejected.http` | agent 拒绝的一次生产环境部署 |
| `09-failed.http` | 一个不存在的 commit |
| `10-cancel.http` | 取消一个运行中的任务，再取消一次，并在结束后给它发消息 |
| `11-errors.http` | 任务未找到、缺少版本 header、一个 v0.3 方法名、无效参数、不支持的媒体类型、不支持推送、格式错误的正文 |
| `12-list-tasks.http` | `ListTasks` 分页和一个状态过滤器 |
| `13-history.http` | `GetTask` 带和不带 `historyLength` |
| `14-resubscribe.http` | 流在四帧后断开，再用 `SubscribeToTask` 接上 |
| `15-push.http` | 在 `SendMessage` 中注册的 webhook、它收到的通知，以及配置操作 |
| `16-rest-binding.http` | 同一组操作走 HTTP+JSON，包括它的错误形状 |
| `17-signed-card.txt` | 对 deployer card 做规范化、签名和验证 |
| `18-extended-card.http` | 不带 token 和带 token 的 `GetExtendedAgentCard` |
| `19-planner.http` 和 `19-planner.log` | planner 的运行及其决定 |

名为 `*.events.json` 的文件保存流的各帧，并做了 pretty-print。

## 本 kit 与参考 SDK 的差异

这些记录与 `a2a-sdk` 1.2.2（Python 参考实现）的流量做过对照。结构、字段名、对象内的字段顺序、枚举值、错误码和 history 记账都一致。下列选择与它不同，或者补上了规范留下的空隙：

- kit 把 JSON-RPC 信封写成 `jsonrpc`、`id`、`result`。SDK 写成 `result`、`id`、`jsonrpc`。JSON 对象没有顺序，所以两者是同一条消息。
- kit 给第一个 `TASK_STATE_SUBMITTED` 状态打上时间。SDK 省略它。该字段是可选的。
- 任务到达终止状态或 `TASK_STATE_INPUT_REQUIRED` 时流会关闭，经过 `TASK_STATE_AUTH_REQUIRED` 时保持打开，这是任务内授权一节的要求。规范对中断状态自相矛盾。SDK 的默认请求处理器在 agent 的 `execute()` 调用返回时关闭流，所以由 agent 代码决定（`src/a2a/server/agent_execution/active_task.py`）。
- HTTP+JSON 错误和推送通知按规范以 `application/a2a+json` 发送。SDK 把两者都作为 `application/json` 发送。
- 推送 `token` 放在 `X-A2A-Notification-Token` header 中传输。规范没有给 token 规定传输方式。这个 header 来自 SDK（`src/a2a/server/tasks/base_push_notification_sender.py`）。
- 创建推送配置时如果没有 `id`，会得到一个新的 UUID。SDK 使用任务 id。规范只说由服务器分配一个。
- JSON-RPC 上的 `DeleteTaskPushNotificationConfig` 返回 `{}`，即空 protobuf 消息的 JSON 形式。SDK 返回 `null`。
- 错误详情携带诸如任务 id 之类的 metadata，与规范的示例一致。SDK 发送一个空的 `metadata` 对象。
- 空闲流不会收到 keep-alive 注释。SDK 的服务器每 15 秒发送一条。
- 输入检查只读取 card 的 `defaultInputModes`。它把一个 `text` part 在没有 `mediaType` 时当作 `text/plain`，把 `data` part 当作 `application/json`。SDK 的检查默认关闭。打开时，SDK 也接受每个 skill 的 `inputModes`，并跳过没有 `mediaType` 的 part。
- 一个 `artifactUpdate` 若带 `append` 且 `artifactId` 未知，会开始一个新 artifact。SDK 以 `InvalidAgentResponseError` 拒绝它。
- 客户端回答一个中断的任务时，kit 的服务器自己把状态设为 `TASK_STATE_WORKING`，不带消息，然后再让 agent 代码继续。
- webhook 收到状态和 artifact 更新，从不会收到第一个 Task 快照。SDK 也会推送那个 Task。
- 版本检查只接受恰好为 `1.0` 的值，来自 `A2A-Version` header 或 `A2A-Version` 查询参数，这是 §3.6.1 允许的。SDK 只比较主版本号，并且只读取 header。
- 认证在协议之前运行。缺少或错误的 bearer token 会在任何 A2A 方法运行之前得到带 `WWW-Authenticate` 质询的 HTTP 401，两种绑定都是如此。
- deployer 用 HS256 给它的 card 签名，因为标准库没有 ECDSA。真实部署用 ES256 或 RS256 签名，并把密钥发布在 JWKS 中。
- 规范化形式会排序键并去掉空格。对这几张 card 的纯 ASCII 文本，这与 RFC 8785 一致；对 deployer card，它等于 SDK 的规范化字节。
- card 响应不带 `Cache-Control` 或 `ETag` header。SDK 发送一个弱 `ETag`，并对匹配的请求回答 `304`。
- 客户端消息的 role 若不是 `ROLE_USER`，会得到 `-32602`。规范没有为这种情况指定错误。
- deployer 上的 `POST /approve/<task id>` 代表在 A2A 之外批准部署的操作员。它不是 A2A 的一部分。
