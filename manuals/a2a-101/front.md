# 如何阅读本手册

> 本手册中的每个论断都能追溯到一个排了等级的来源，每个请求、响应和流帧都来自一个你可以自己运行的 capture kit。

本手册通过一个系统讲解 1.0.1 版的 Agent2Agent 协议（A2A）：一个 planner 把工作交给三个它看不到内部的 agent。

## 本手册写给谁 {#s-front-who-this-manual-is-for}

你已经构建过调用工具或模型 API 的 agent，并且了解 HTTP 和 JSON。现在你想把工作交给另一个团队拥有的 agent。

读完最后一个部分后，你能：

- 读懂一张 agent card，说出这个 agent 提供什么、如何访问它，以及它有哪些要求。
- 预测一个任务在运行中任意时刻处于哪个状态，以及客户端接下来能做什么。
- 为给定的工作在阻塞调用、轮询、流式传输和推送通知之间做出选择。
- 逐行读懂任意 A2A 请求、响应或流帧，无论它使用哪种 JSON 绑定。
- 说出客户端必须处理的错误，以及服务器可能在不知不觉中违反的规则。

[A2A 课程](phases/13-tools-and-protocols/19-a2a-protocol)早于 1.0 版，所以两者不一致时，以本手册为准。

## 本手册是如何写成的 {#s-front-how-it-was-made}

本手册锁定 A2A 仓库的 tag `v1.0.1`，即 commit `3303592`。在请求和 card 中，这个 release 的协议版本是 `1.0`，因为请求、响应和 Agent Card 不应带有 patch 版本号 {{spec §3.6}}。这些事实还对照了 2026-10-05 的 main 分支 commit `679ab3a` 进行核对，当时 v1.0.1 仍是最新的 release。

事实来自五个来源，按权威性排序。两个来源不一致时，以等级更高的为准，正文也会说明这一点。

| 等级 | 来源 | 本手册从中取用什么 | 来源键 |
|---|---|---|---|
| 1 | v1.0.1 版的 `specification/a2a.proto` | 每个对象、字段、枚举值和方法 | `proto` 加上 message 或 enum 名 |
| 2 | v1.0.1 版的 `docs/specification.md` | 每条行为规则，用我们自己的话表述 | `spec` 加上章节号 |
| 3 | 项目在 v1.0.1 版的文档页面 | 项目自己的表述，页面过时之处会标出 | `docs` 加上页面名 |
| 4 | 参考 SDK a2a-python 1.2.2 | 规范没有规定时，一个生产级实现的做法 | `sdk` 加上源文件 |
| 5 | `capture/` 中的 capture kit | 本手册展示的每个请求、响应和流帧 | capture 文件名 |

proto、规范和文档页面原样存放在[仓库中](manuals/a2a-101/research/sources)。

规范在[`SubscribeToTask` 的 HTTP 方法](#s-json-rpc)（[冲突 D1](#s-ref-sources)）和[一次发送是否等待](#s-send-message)（[冲突 D2](#s-ref-sources)）上与自身或 proto 不一致。它在[流何时关闭](#s-input-required-and-auth-required)（[冲突 D3](#s-ref-sources)）和[card 的安全字段名](#s-security-schemes-and-in-task-authorization)（[冲突 D6](#s-ref-sources)）上也不一致。[来源参考](#s-ref-sources)列出了全部四十处冲突，以及讨论每处冲突的章节。

## capture kit {#s-front-the-capture-kit}

capture kit 在你的机器上运行三个远程 agent 和一个录制客户端，只用 Python 标准库，不需要网络或密钥。

| Agent | 端口 | 它做什么 | 它的运行展示了什么 |
|---|---|---|---|
| `test-runner` | 41241 | 运行测试套件并以流的形式输出日志 | 流式传输、分块的 artifact、轮询、取消、推送通知、两种 JSON 绑定 |
| `code-reviewer` | 41242 | 对照基准分支审查一个 diff | 直接用消息回复、`TASK_STATE_INPUT_REQUIRED`、被拒绝的内容类型、不支持推送 |
| `deployer` | 41243 | 在操作员批准后把一个构建部署到 staging | bearer 认证、在 A2A 之外批准的 `TASK_STATE_AUTH_REQUIRED`、拒绝、扩展 card 和签名 card |

[客户端](#s-a-client)一节逐步讲解[真实的 planner](manuals/a2a-101/capture/planner.py)。

带种子的 id 和固定的时钟让两次运行逐字节相同。[kit 的 README](manuals/a2a-101/capture/README.md) 列出了 kit 与参考 SDK 的不同之处。

## 约定 {#s-front-conventions}

每节都在手册源文件中记录它的来源，audit 会在那里检查每个引用和数字。各节正文不显示这些来源。来源参考列出了它们。

代码清单原样复制 capture 文件中的行，`…` 标出一处删节，由注释加以说明。

字段名和枚举值按它们传输时的样子用代码字体排印，例如 `messageId`。图中把任务 id 和 context id 缩短为 8 个字符，所以 `728ba084-97eb-422b-b94b-b0fe9153ce2c` 显示为 `728ba084`。

图在网页上有动画，Replay 按钮会重新播放各步，印刷版和减少动态效果模式显示最后一帧。

## 第一次运行 {#s-front-a-first-run}

kit 需要 Python 3 和 `127.0.0.1` 上的四个空闲端口：41241 到 41243 给各 agent，41250 给 webhook 接收器。在仓库根目录下运行它并检查：

```bash
cd manuals/a2a-101
python3 capture/run.py
python3 capture/run.py --check
```

先打开 `capture/out/02-message-reply.http`：向 `code-reviewer` 提一个问题并得到直接回答，没有任务。然后打开 `capture/out/05-streaming.http`，其中一个发给 `test-runner` 的请求打开了一个包含九行 `data:` 的流：

```listing
title: the start of a stream
source: capture/out/05-streaming.http
lang: http
note: The request body and the rest of the first frame are cut. Frames 2 to 9 follow it in the file.
---
POST /a2a/jsonrpc HTTP/1.1
Host: localhost:41241
Content-Type: application/json
A2A-Version: 1.0
Accept: text/event-stream
…
HTTP/1.1 200 OK
Content-Type: text/event-stream

data: {"jsonrpc": "2.0", "id": 1, "result": {"task": {"id": "728ba084-97eb-422b-b94b-b0fe9153ce2c", … "state": "TASK_STATE_SUBMITTED", …
```

第一帧就是 `task` 本身，[逐个请求看一个任务](#s-one-task-request-by-request)一节读完了全部九帧。

## 各部分的顺序 {#s-front-how-the-parts-are-ordered}

第 1 部分给你整个协议。第 2 到 6 部分各讲一层，从 AgentCard 到安全与扩展，第 7 部分构建一个客户端和一个服务器：

```parts
```

## 图中的颜色 {#s-front-colour-in-figures}

每种色调在每张图中都只有一个含义：

```palette
```

[图](#fig-reading-a-sequence)讲解了八种箭头样式中的七种。它省略了实线 plum，因为 A2A 从不承载模型调用。

```figure
id: fig-reading-a-sequence
kind: sequence
title: reading a sequence figure in this manual
claim: Each of the seven arrow styles marks one kind of exchange, and the label on each arrow is a real name from a run of the kit.
caption: Read each numbered row from the tail of the arrow to its head. The note under a label gives the style and its meaning. The rows come from 03-blocking-task.http, 05-streaming.http, 15-push.http, 19-planner.log, and 11-errors.http, and the task store is the kit's own store inside test-runner.
```

Sources: spec §3.6, §3.7 (research/sources/specification.md); proto TaskState (research/sources/a2a.proto); docs life-of-a-task (research/sources/docs.md); sdk src/a2a/server/tasks/task_manager.py; manual.json; research/sources/README.md; research/brief-spec.md §12.2; research/brief-docs.md; research/sources/specification-main.md (main at 679ab3a); capture/README.md, capture/run.py, capture/agents.py, capture/a2a_ref.py, capture/planner.py; capture/out/02-message-reply.http, 03-blocking-task.http, 05-streaming.http, 11-errors.http, 15-push.http, 19-planner.log
