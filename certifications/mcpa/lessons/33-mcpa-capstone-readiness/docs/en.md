# 端到端解读单次完整的 MCP 交互 (Reading One MCP Exchange End to End)

> 生产环境中的真实故障绝不会主动贴上标签宣告自己属于 MCPA 认证大纲的哪一个领域。它直接递给你一份通信报文日志，而能够按部就班、抽丝剥茧地正确解读这份日志，正是本项认证所衡量的核心硬实力。

**Type:** Capstone
**Languages:** Python
**Prerequisites:** Lessons 00 to 32
**Time:** ~60 minutes

## 学习目标

- 组装一次完整的 2026-07-28 规范交互：包含带有缓存提示的服务发现、参数 Schema 校验、MRTR 用户同意往返、异步长任务处理、进度通知流、OAuth 受众校验以及基于哈希链的防篡改审计日志，并清晰阐明每一阶段所抵御的安全风险。
- 一眼辨别协议层错误 (Protocol Error)、工具执行错误 (Tool Execution Error) 与缺失能力错误 (Missing Capability Error)，并准确说出对应的标准 JSON-RPC 错误码。
- 在多步骤交互的所有服务跳跃中追踪同一个 W3C Trace ID，包括跨越至 HTTP 传输并由 OAuth 保护的独立出站调用。
- 验证基于哈希链保护的审计日志，并精准阐释对某一个条目的篡改将如何破坏其后续记录的所有条目。
- 使用 `outputs/` 中的备考自查清单，逐项对齐认证大纲考核目标，确保考试考察的五大领域在本次交互日志中均能找到确切的对应实现。

## 问题背景

一名值班运维工程师打开监控控制台，看到两条截然矛盾的信息：工单系统中声称 `checkout-api` 核心结算服务已经在生产环境中执行了重启；而故障应急频道中的监控却显示服务自始至终未曾重启。这一分歧表面上绝不会自动标注文明：“这是一个 MRTR 消息问题”还是“这是一个安全与治理问题”。要想理清真相，唯一的办法就是从头到尾完整通读整份通信日志：重启请求本身是否格式良好？服务器是否按规定发起了人工确认？确认结果返回时是否携带了合法的加密签名且未遭篡改？调用方是否在一开始就声明了能够看到该提问的客户端能力？以及底层的审计日志是否与这一切严丝合缝地相互印证？

上述每一项技术检查，分别精准对应 MCPA 考试大纲中的五大核心领域：**MCP 基础原理、架构与组件、交互与执行、安全与治理，以及实际用例与生态系统**。认证考试中最具挑战性的压轴场景题，正是以类似上述矛盾现象的方式命题：给出一个故障表象而非概念定义，答案往往就隐藏在一次具体交互时序链条的某一个关键节点中。

本课不引入任何新的协议特性。它的使命是将第 00 课至第 32 课逐一讲解的零散知识点，重新拼装成真实生产系统所产出的唯一核心交付物：针对一个 MCP 服务器所发起的完整故障应急响应工作流。系统在该合规的地方表现合规、在该拒绝的地方坚决拒绝、为每一次拒绝给出清晰规范的法定理由，并为全过程留存不可抵赖的持久证据。请将本课视为迎接终极认证大考的实战演习，更是对该凭证所真正认证的职业能力的淬炼：在生产中运维一套任何工具调用默认不可信、任何对端能力在线路声明前绝不擅自揣测的高可靠 AI 基础设施。

## 核心概念

### 全流程演练架构分解

`code/main.py` 完整模拟了针对应急控制台服务器 `incident-console` 的一次故障处理全流程。其中的每一个阶段都精准呼应了前面各课所学的规范知识点：

#### 1. 版本协商与发现契约（第 04 课、第 05 课、第 20 课）
日志由协议版本协商拉开序幕。客户端由于疏忽配置了旧版的 `2025-11-25`，在向 `server/discover` 发起请求时立即被拦截，返回 `UnsupportedProtocolVersionError`（错误码 `-32022`），并在 `data.supported` 中明确列出服务器实际支持的所有版本。这里不存在可以推诿的历史建连握手，也没有会隐式记住版本的持久会话：每一个请求都在 `params._meta` 中独立显式声明其协议版本。因此修复方法极其直接：使用正确的版本号重新发起发现请求。修正后的 `server/discover` 返回了一个标准的、可公开缓存的发现结果：包含 `supportedVersions`、能力清单（其中显式包含了 `extensions: {"io.modelcontextprotocol/tasks": {}}`，提前告知客户端长任务扩展已就位）、有效期 `ttlMs`，以及 `cacheScope: "public"`。

```json
{
  "jsonrpc": "2.0", "id": 2,
  "result": {
    "resultType": "complete",
    "supportedVersions": ["2026-07-28"],
    "capabilities": {"tools": {"listChanged": false}, "extensions": {"io.modelcontextprotocol/tasks": {}}},
    "ttlMs": 600000, "cacheScope": "public"
  }
}
```

#### 2. 工具枚举与双通道错误划分（第 02 课、第 08 课、第 16 课、第 18 课）
`tools/list` 的调用与第一次业务操作（只读的服务集群健康扫描 `scan_fleet_health`）联合考察了架构与交互流：每个工具对外公开的输入 Schema 是客户端唯可依赖的通信契约。如果客户端请求了一个服务器从未注册过的工具名称，返回的标准错误码是 `-32602`（非法参数），而**绝不是 `-32601`**（这是整套错误体系中考试最常考查的辨析点）。错误码 `-32601` 严格保留用于服务器根本未曾听说过的 JSON-RPC Method，本课代码特意通过将 `tools/call` 拼写为 `tools/execute` 触发了一次 `-32601` 作为反例对比。另外，由于健康扫描请求中显式设置了 `_meta.progressToken`，服务器在返回最终结果前，在当前请求的私有响应流上连续输出了数条 `notifications/progress` 进度通知；该通知流完全独立于全局订阅机制，且在请求返回的瞬间即告终结。

#### 3. 参数校验、能力门禁与 MRTR 用户同意闭环（第 07 课、第 14 课、第 22 课、第 25 课）
服务重启序列 `restart_service` 是三大领域交汇的核心熔炉：
- 当调用缺少必填参数 `environment` 时，服务器返回包含 `isError: true` 的常规工具执行结果，这是一个模型能够自主阅读并根据提示自我纠错的业务级错误，**绝不能返回协议层错误**，因为请求本身的 JSON-RPC 语法完全合法。
- 随后，由一个只读控制台发起的修正调用，由于未在其客户端能力中声明 `elicitation`，被服务器当场返回 `-32021`（`MissingRequiredClientCapability`）坚决拒绝，并在错误数据中精准指明缺少的能力。规范严禁服务器擅自脑补任何请求中未显式声明的客户端能力。
- 唯有当上述两项检查全部绿灯放行后，服务器才会正式启动 MRTR 信息引出往返：返回 `resultType: "input_required"`，在 `inputRequests` 映射中放入 `elicitation/create` 表单，并下发一个经过 HMAC 加密签名、与认证主体强绑定且仅限单次消费的 `requestState` 状态凭据。重试请求必须使用全新的 JSON-RPC ID，并原样逐字节回传该状态：

```json
{
  "jsonrpc": "2.0", "id": 10, "method": "tools/call",
  "params": {
    "name": "restart_service",
    "arguments": {"service": "checkout-api", "environment": "production"},
    "inputResponses": {"confirm": {"action": "accept", "content": {"confirmed": true}}},
    "requestState": "eyJwcmluY2lwYWwiOiJhbGljZS1vbmNhbGwi...9f1c2a"
  }
}
```

本课交互记录中还特意发送了一次蓄意破坏该签名的篡改重试（在日志中包裹为 `violation`），服务器端的 HMAC 校验逻辑当场识别出签名破损，并返回了精准指明签名失效的工具执行错误。这生动展示了生产级系统所谓的“受保护状态”的真实含义：绝非仅仅存在即可，而是必须具备严密的可防篡改性。

#### 4. 长任务轮询与协作式取消（第 21 课）
全量系统诊断工具 `run_full_diagnostics` 完美诠释了 Tasks 扩展的价值。同一个工具调用，其行为完全取决于单次请求的独立声明：若客户端未在 `clientCapabilities.extensions` 中声明 `io.modelcontextprotocol/tasks`，该工具将同步阻塞执行到底并返回 `complete`；而一旦客户端声明了该扩展（且服务器在发现阶段也支持该扩展），它会立刻返回 `resultType: "task"` 与持久化的 `taskId`，客户端随后通过 `tasks/get` 展开轮询。针对未知任务 ID 的查询返回 `-32602`；而如果轮询请求自身忘记声明该扩展，则同样受到 `-32021` 的能力拦截。针对另一任务的 `tasks/cancel` 取消操作展现了协作式语义：接口当场确认接收取消意图，并在下一次轮询时状态转为 `cancelled`；请注意这里绝不使用 `notifications/cancelled`，因为后者在当前修订版中仅保留用于销毁流式长连接或在 stdio 上取消未决请求。

#### 5. Streamable HTTP、请求头镜像与 OAuth 受众校验（第 19 课、第 23 课）
整个流程中有一个调用特意采取了不同的通信方式：事故确认工具 `acknowledge_incident` 通过 Streamable HTTP 发出，外层携带的 `MCP-Protocol-Version`、`Mcp-Method` 与 `Mcp-Name` 请求头必须与内部 JSON-RPC 请求体完全呼应。该调用处于 OAuth 2.1 的严密保护之下。当客户端传入一个为其他资源服务器签发的非法 Bearer Token 时，在报文触达 JSON-RPC 解析层之前，HTTP 层便直接以 `401 Unauthorized` 将其拦截，因为受众 (Audience) 校验是一道不可逾越的安全红线，服务器严禁接受并非为自身签发的令牌。使用带有正确 Audience 签名的合法令牌重试后，请求顺利执行。本课没有将所有调用都强行套上 OAuth，因为规范明确指出 stdio 传输不应走 OAuth，保持这一物理区隔有助于强化对不同架构边界的认知。

#### 6. 全链路追踪与防篡改哈希链审计（第 27 课）
在上述所有阶段的底层，同一个 W3C `traceparent` 像一条无形的金线贯穿于每个请求的 `_meta` 中：保持 32 位 Trace ID 恒定不变，并在每一次跳跃中派生出全新且唯一的 Parent ID。与此同时，底层维护着一条严密的哈希链审计日志：每一个决策落盘为一个条目，每个条目的哈希计算都将前一个条目的哈希值作为自身的输入因子。事后如果有人恶意篡改了历史日志中的任何一个字段（无论是版本号、执行结果还是参数），随后执行的 `verify()` 校验逻辑将在发生篡改的具体条目索引处立即告警，因为该条目之后的所有历史哈希链接已全部崩塌。这正是将普通日志升华为铁证的关键。

```figure
mcpa-33-capstone-flow
```

## 交互式实验

上方的全景拓扑图清晰描绘了整套交互流程：服务发现孕育了参数校验、参数校验引出 MRTR 用户同意流程、用户同意解锁了异步轮询任务，并最终产生业务结果；图表底部的虚线贯穿全程，代表着跨越每一个服务跳跃的单一持久 Trace ID；而旁边环环相扣的小方块，则代表着在交互最终时刻通过严密数学验证的防篡改哈希链。运行本课实验，并对照终端打印的每一行输出逐一核验：

```bash
python3 code/main.py
```

重点观察在进入核心业务逻辑之前决定调用命运的四个关键时刻：
1. 顶层在修正版本号之前触发的 `-32022`；
2. 因缺少 `environment` 参数触发的 `isError: true`；
3. 因控制台未声明能力触发的 `-32021`；
4. 以及在上述门槛全部跨越之后才真正亮相的 `input_required`。

随后观察终端打印的完整审计账本，验证 `verify()` 输出 `True`；紧接着观察程序在内存中对某条历史记录的原地篡改，以及 `verify()` 如何瞬间在相同索引处精准报错。尝试修改变量 `alice` 发起 `run_full_diagnostics` 时声明的能力集合，并在重新运行前预测你将会看到异步的 `resultType: "task"` 还是同步的普通结果。

## 实战演练

在终端中进入 `code/` 目录并启动 Python 交互式环境，执行 `import main`。使用 `server = main.build_server()` 初始化一个新服务器，并使用 `client = main.Client("alice-oncall", server)` 构建一个客户端。首先传入 `capabilities={}` 调用 `restart_service`，确认终端如期返回 `-32021`；随后传入 `capabilities=main.ELICIT_CAPS` 再次调用，验证相同的请求此时顺利返回 `input_required`。从该结果中提取出 `requestState` 字符串，像演示脚本那样篡改其最后一位字符并手动发起重试：你将清晰捕获到一个文本明确提示签名校验失败的 `isError` 结果，而不是发生未授权的静默成功。最后，创建一个长任务并轮询一次，随后直接修改 `server.audit.entries` 中已记录条目的某个属性值。在修改前后分别调用 `server.audit.verify()`：观察校验报告的错误索引恰好就是你刚刚触碰的那个条目，绝不会是前一个，也绝不会是列表末尾，因为该条目之后的所有哈希链环均已断裂。

## 交付产物

`outputs/mcpa-readiness-checklist.md` 是专为本次认证大考准备的“考前冲刺复习宝典”：它完整收录了来自 `certifications/mcpa/tracks/mcpa-f.json` 官方大纲的全部 18 项核心考核目标，按五个大纲加权领域科学归类，并将每一项目标都映射为了你在本课日志中亲手运行过的确凿实战记录或前序对应课程。建议在完成本课后趁热打铁通读一遍以巩固记忆；并在正式迈入考场的前一天晚上再次通读，实现对全领域核心考点的极速唤醒。

## 验证方法

在课程根目录下执行单元测试：

```bash
python3 -m unittest discover code/tests
```

测试套件直接覆盖了本课所有的核心考核指标：通信记录中的每一个请求均携带包含协议版本与能力的完整 `_meta`；未知工具严格触发 `-32602` 而未知方法严格触发 `-32601`；参数违规的 `restart_service` 调用返回工具执行错误而在参数补齐后顺利抵达 `input_required`；未声明引出能力的调用者收到 `-32021`；获批的 MRTR 重试采用新 ID 并原样回传状态；被篡改的状态凭据当场被拒；`run_full_diagnostics` 唯有在请求显式声明扩展时才转化为长任务；任务支持协作式取消与状态轮询；`tasks/get` 自身严格执行能力检查；非法 Audience 令牌在协议层前被 HTTP 401 拦截而合法令牌顺利放行；跨跳通信中保持 Trace ID 稳定继承；审计日志顺利通过全量验证且篡改能被精确定位；且通信全程绝不使用任何已废弃的方法或旧版错误码。仓库内的报文检查器同样会严格依据 2026-07-28 规范检验该交互流：

```bash
python3 scripts/check_mcpa_wire.py certifications/mcpa/lessons/33-mcpa-capstone-readiness
```

## 项目连接

考试大纲上的每一个领域，最终都汇聚为了本课单次交互时序中的某一个确定阶段，而非孤立的分散练习：
- **MCP Fundamentals (基础原理)**：体现为开头的版本协商机制，以及贯穿全局的无状态核心铁律（任何请求绝不依赖前一请求的隐式上下文）；
- **Architecture and Components (架构与组件)**：体现为指导重启工具的精确 Schema 契约，以及发现健康扫描工具的 `tools/list` 枚举流程；
- **Interactions and Execution (交互与执行)**：体现为本课有意全面覆盖的错误分类学全景（未知工具的 `-32602`、未知方法的 `-32601`、缺失能力的 `-32021`、参数错误的 `isError: true`、同意引出的 `input_required`、长耗时异步处理的 `task`，以及随请求而生的单次进度通知流）；
- **Security and Governance (安全与治理)**：体现为带有 HMAC 签名的 `requestState` 防篡改机制、在 HTTP 报文触及 JSON-RPC 前即时阻断非法令牌的 OAuth Audience 校验，以及让“全面审计”真正具备数学验证力的哈希链账本；
- **Use Cases and Ecosystem (用例与生态)**：展现了协议之所以走出教科书的真正现实意义（应急值班控制台、具备重大故障爆炸半径的重启操作、需要异步长任务支撑的深度诊断、受真实权限管控的事故确认）。

在这节课之后，前面已经没有新的理论课程了。等待你的，是那份沉甸甸的备考核对清单、是真实的在线认证考场，更是未来在工业级生产环境中，将本课所演示的协议交互作为核心关键基础设施、全权对其可靠性与安全性负责的工程师担当。

## 核心术语

| 术语 | 定义说明 |
|------|---------|
| Protocol error（协议层错误） | 针对请求报文本身畸形或不可解析而返回的 JSON-RPC 错误，如未知工具 (`-32602`) 或未知方法 (`-32601`) |
| Tool execution error（工具执行错误） | 返回包含 `isError: true` 的常规结果，报告大模型可理解并能够通过调整参数自行纠正的业务问题 |
| `MissingRequiredClientCapability` | 标准错误码 `-32021`，当某项请求执行所依赖的能力（如 `elicitation`）在本次元数据中未声明时抛出 |
| MRTR | 多轮往返请求 (Multi Round-Trip Request)：以 `input_required` 起始，并以携带新 ID 与回传状态的重试请求收尾的交互流 |
| requestState | 随 `input_required` 下发的不可信状态字符串；当涉及授权时必须加密签名、绑定主体并严格单次消费 |
| Tasks extension（Tasks 扩展） | `io.modelcontextprotocol/tasks`；唯有通信双方在本次请求中均显式声明时，方可将工具调用转化为持久化轮询任务 |
| Canonical resource URI（规范资源 URI） | 服务端在接纳 OAuth 访问令牌前校验其合法受众 (Audience) 的基准 URI；受众不匹配的令牌坚决予以拒绝 |
| `traceparent` | `_meta` 中携带的 W3C 分布式追踪上下文；确保整个交互流中 Trace ID 恒定，并在每一跳派生独立 Span ID |
| Hash chained audit log（哈希链审计日志） | 仅追加写入的不可抵赖账本，每个条目的哈希计算涵盖前一条目的哈希，使任何增删改皆可通过重算链条即时发现 |

## 延伸阅读

- [MCP 规范 2026-07-28 官方全文](https://modelcontextprotocol.io/specification/2026-07-28)，本课交互所严格遵循的权威基准。
- [MCP 架构总览指南](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)，深入理解通信角色分工。
- [自 2025-11-25 以来 MCP 更新日志](https://modelcontextprotocol.io/specification/2026-07-28/changelog)，掌握无状态核心架构的演进历史。
- `certifications/mcpa/research/mcp-2026-07-28-brief.md`，全篇通读，整套认证课程的核心知识事实来源。
- `phases/13-tools-and-protocols/23-capstone-tool-ecosystem`，体验另一种不同业务侧重点的完整工具生态构建实战。
- MCPA 官方认证主页：`training.linuxfoundation.org/certification/model-context-protocol-associate-mcpa`，核对考试形式、时长及各领域权重最新动态。
