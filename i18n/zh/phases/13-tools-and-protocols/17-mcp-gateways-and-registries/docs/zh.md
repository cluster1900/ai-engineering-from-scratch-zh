# 无状态 MCP 网关与注册表 准入

> 网关应让每个路由都清楚明确.2026-07-28 规范赋予了它方法,名称,版本,能力,身份识别,缓存和跟踪边界,而无需依赖任何传输层会议.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 15 (security), Phase 13 · 16 (authorization)
**Time:** ~75 minutes

## 学习目标

- 聚合在单一2026-07-28端点后,并且不依赖于会话亲和性 (会亲和性)
- 在应用策略或转发之前,先验证每请求元数据与路由头部.
- 根据稳定命名空间、确定性排序、描述器 锁定、RBAC 和私有缓存进行工具 合并──
- 记录服务发现的证据,但仍需要强制执行网关准入策略.
- 正确通过请求级作用域的SSE`subscriptions/listen`、MRTR 重试以及任务 扩展调用──
- 将遗留的握手和会议支持与现代代码路径进行物理隔离.

## 问题

单个客户端直接连接到单个服务器非常简单.

- 允许接入哪些服务器?
- 哪个主体能够查看并调用特定的工具?
- 两者被曝光后,该如何处理?
- 如何审查描述器的后续变化?
- 速度限制和审计事件应在哪里执行?
- 集群中任何一个例子是否能处理下一次到来的请求?

网关(Gateway) 充当客户端与各后端MCP服务器之间的中介――它对外暴露统一的MCP端点,施加横切的安全策略,并负责转发经批准的请求――

旧版网关设计往往将一个客户端会议多路复用到多个后端会议 中,并对 `Mcp-Session-Id`进行重写. 这纯粹属于旧版本兼容设计.

## 概念

### 现代网关请求路径

针对每一个入站请求:

1. 从传输层鉴权中认证请求主体 (主) 
2. 验证`MCP-Protocol-Version`,我知道.`Mcp-Method`,我知道.`Mcp-Name`及`params._meta`,我知道.
3. 授权主体,目标资源,调用方法,工具以及论点.
4. 应用描述器 策略,登记库 准入策略,限制流策略和数据合规策略.
5. 为了选择后端构建一个全新的,自含的下游请求.
6. 检验后返回结果,并向客户端返回网关层处理结果.
7. 记录审计事件,绝对不打印密钥.

整个过程不需要任何隐藏协议会议.应用级状态仍然可以在数据库中得到充分的持久.

### 运行时策略是网关的第一决策

准入机制决定哪个版本后端可以接入网关,但它绝对不代表批准某种具体的实时调用.针对每一次请求,网关都必须基于已认证的主体,发行者和资源,租户,匹配方法和名称,规范化参数,已准入的描述器,锁定证书,端后实时健康状况,能力,交换,数据分级,流程状态以及任何行动的绑定审批,重新计算安全策略.

这种优先级序列至关重要:注册表可能仍然处于有效状态,但用户角色可能已被取消;某个描述器的哈希锁定可能仍然匹配,但目标参数可能已经跨越租户边界;后端服务可能依旧合规,但安全事件应急策略可能正在对状态修改类调用实施全局隔离.因此,运行时策略才决定允许或拒绝第一门禁,注册表和描述器证据只是该决策的输入.

勿允许 决策结果缓存某种连接或已废弃的会话标识符下.当策略评估服务不可用时,必须按操作类遵循明确的故障处理策略:安全的默认做法是对状态修改和敏感读取操作采取故障关闭 (故障关闭,直接拒绝);而针对明确批准的公开读取路径,只有当风险模型允许时才可降级使用时间短暂的 知道策略. 在最后日志中明确的记录中,哪个版本和故障分支做出了该策略,并在后端结果返回客户端之前严格审查它.

### 单一 POST 端点

现代流式HTTP将通过HTTP POST发送每个JSON-RPC报文:

```text
POST /mcp
Authorization: Bearer <gateway-token>
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.search
Accept: application/json, text/event-stream
```

对于该 POST 请求,网关可以返回 JSON 响应,或者返回仅限于该请求作用域的 SSE 流――现代请求针对 GET 和 DELETE 均返回 HTTP 405 方法不允许――`Mcp-Session-Id`与`Last-Event-ID`绝对没有任何授权,任何亲和性或重放能力.

在搜索后端之前,一旦发现不一致,立即返回.`-32020`错误进行拒绝. 如此负载均衡器,网关和流器便无需完整解析.

底层报文校验遵循严格的时间序列:JSON-RPC 及元数据类型有效性,标题与体格一致性,然后检查匹配的版本是否支持――不匹配返回HTTP 400与错误码`-32020`△若标题与体格 一致但版本不支持,返回HTTP 400与错误码`-32022`且`data`精确为`{"supported":["2026-07-28"],"requested":"<actual>"}`◎未知如何返回HTTP 404与错误码`-32601`,我知道.

`ProtocolError`可携带可选的`data`网关会将其序列化到 JSON-RPC 错误对象中.`id`为了永远不会收到 JSON-RPC 成功或错误响应.

### 在每层都实现服务发现 (发现)

网关面向客户端实现`server/discover`△同时,网关也会对各后端执行服务的发现,从而获取后端支持协议版本的功能以及扩展 (扩展) 扩展.

网关返回的发现结果示例:

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {"listChanged": true}
  },
  "ttlMs": 30000,
  "cacheScope": "private",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "enterprise-gateway",
      "version": "2.0.0"
    }
  }
}
```

仅仅向外声明网关本身能够端到端完全支持能力交交交. 后端支持的特性并不意味着直接传输安全;而网关本身声明,但后端根本无法支持的特性对外暴露毫无意义.

`serverInfo`纯粹是自报告的展示和调试数据,不要把它视为注册表或发行者的真实性证明.

### 逐请求的客户端能力

每个转发到后端的请求都需要带上最新的信息`_meta`封信:

```json
{
  "io.modelcontextprotocol/protocolVersion": "2026-07-28",
  "io.modelcontextprotocol/clientCapabilities": {},
  "io.modelcontextprotocol/clientInfo": {
    "name": "enterprise-gateway",
    "version": "1.0.0"
  }
}
```

网关本身就是客户端――只能声明网关能够正确介绍和处理协议的特性――

### 确定性的命名空间隔离

将各端工具 合并并稳定在公共命名空间下:

```text
notes.search
notes.create
issues.list
issues.open
```

维护从公共名称到后端实例及原始工具 名称的映射表――绝不能按发现先后顺序随意处理重名碰撞――公共名称构成审批与审计契约的一部分,变更公共名称属于破裂迁移――

`tools/list`必须是确定性的返回.`cacheScope: private`设定合理的`ttlMs`限制可在减轻后端服务发现压力同时,防止用户专有列表跨越授权边界泄露.

每个暴露于外面的工具描述器都必须包含一个稳定的名称,描述以及对象的根节点.`inputSchema`△命名空间转换绝不能剥离必须的描述符 字段──完整的列表 应也必须包含`resultType`、服务器身份元数据及缓存提示──

### 锁定已批准的描述符 ()

在准入阶段,对完整的描述器进行规范化处理并计算哈希消费,将其保留在完全有限的公共名称下. 在列表展示和发行调用时,严格比对实时描述器与已批准的消费.

一旦检测到变更:

- 立即将其从`tools/list`摘除中
- 坚决拒绝直接调用.
- 触发安全审计事件
- 在更新锁定之前,必须强制通过策略或人工重新审批.

网关是一个强大的集中控制点,但它不能让一个第一次见到的描述器 凭空变得安全.

### 登记 辅助服务发现而非安全决策

登记`server.json`提供软件发布数据.基于软件包托管的记录通常如下:

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
  "name": "com.example/notes",
  "description": "Example notes MCP server.",
  "version": "1.0.0",
  "packages": [
    {
      "registryType": "npm",
      "identifier": "@example/notes-mcp",
      "version": "1.0.0",
      "transport": {"type": "stdio"}
    }
  ]
}
```

发布元数据本身并不代表网关的安全准入决策. 发布者信息和来源证书应经历验证,在独立的准入状态库中保持:

```json
{
  "registryName": "com.example/notes",
  "registryVersion": "1.0.0",
  "publisher": {"namespace": "com.example", "status": "verified"},
  "provenance": {
    "source": "registry.modelcontextprotocol.io",
    "recordId": "com.example/notes@1.0.0"
  },
  "admission": {"status": "approved", "reviewedBy": "gateway-policy"}
}
```

网关负责校验 `server.json`网络关仍然需要执行独立的进入策略.

针对每一个获准后端,完整记录:

- 精确的注册表及记录标识符.
- 经验证的发行者命名空间或域名凭证──
- 允许使用的传输协议与端点地址──
- 锁定版本号或已批准的升级策略
- 软件制品或描述器的哈希消化
- 授权服务器签发者 (发行人) 与资源标识符.
- 审查人员、审批时间及过期时间――

勿仅因为某个服务器的显示名称看起来与某个知名产品相似而放行. 不要把登记器上存在某条记录作为已经通过运营维护安全审查.

本课程实现了网关层的数据连接:在后端成为可路由之前,将发布证书与本地进入状态进行联合.[第 30 课：MCP Registry 供应链、准入、漂移与回滚](../../30-mcp-registry-supply-chain-and-drift/docs/en.md)构建完整的控制平面,覆盖精确的命名空间证明,软件产品追溯源,不可变的哈希锁定,实时描述器,漂移检查,登记器,状态对齐,防改进账本以及基于证据的滚动机制.

### 凭据中介机制(认证调解)

网关对外部调用者进行身份认证,并独立向后端各服务器进行身份认证.后端的认证凭证绝不能泄露给前端客户端.

保持以下映射绑定关系显式清晰:

```text
outer principal -> gateway role and policy
backend issuer + resource -> backend registration and token
```

绝不能把外部网关代币传递到后端.绝不能把某个后端代币复用到其他发行者或资源上. 如果某种工具需要代表终端用户执行操作,应通过专门设计的代币交易所或索赔委托模型传递该身份,不要使用共享服务账号凭证冒充用户.

### 不依赖会议的速度限制

根据已认可的主体,发发行人,资源,公共工具,名称,成本等级以及时间窗口实施限制流程,协议会议ID已不存在,即便存在也很容易被轮换过来.

在执行高开销业务逻辑之前,首先执行低开销的合法性验证.

### 审计整个决策链路

记录足以完整复现一次调用的全套审计要素:

- 要求身份证与链路追踪身份证
- 已认证的主体与发发行者
- 公共工具 名称与最终后端路由──
- 描述器 哈希锁定版本
- 策略决策结果与决定原因
- 响应耗时与结果类别
-  MRTR 往返轮次或任务标识符 (若适用)

对于持有符号"",授权码"",更新符号"",原密钥关键文以及不必要的敏感参数执行强制脱敏"",

### 要求级作用域的SSE

当某个请求执行期间需要流式传输数据时,普通的POST请求可以直接返回请求级作用域的SSE响应.

不要建立独立的GET流,也不要依赖于`Last-Event-ID`这些都是早期的旧版本传输协议的假设.

### 长生命周期的变更通知

关于列表和资源变更的通知,现代客户端通过邮件发送`subscriptions/listen`并接收SSE响应──通知过器使用平字段:`toolsListChanged`,我知道.`promptsListChanged`,我知道.`resourcesListChanged`及`resourceSubscriptions`其他:

```json
{
  "jsonrpc": "2.0",
  "id": "listen-tools",
  "method": "subscriptions/listen",
  "params": {
    "notifications": {
      "toolsListChanged": true
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

首个事件用于确认所支持的通知子集.

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/subscriptions/acknowledged",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": "listen-tools"
    },
    "notifications": {
      "toolsListChanged": true
    }
  }
}
```

网关随后只转发已确认的变更类型.`params._meta`带着相同的东西`io.modelcontextprotocol/subscriptionId`△没有自动重放或自动重监听机制――断线重连接后,客户端应重新启动订阅并主动拉取更新其依赖列表数据――由服务端发起的主动平滑关闭将返回一个标记与相同的订阅ID的最终完整结果――

现代路径彻底取代了`resources/subscribe`,我知道.`resources/unsubscribe`这些旧特性仅作为带有版本控制的旧版本路径保留.

### 穿透网关的MRTR 交互

当后端回来`resultType: input_required`只有在外部客户端声明支持所需输入请求的情况下,网关才能转发该结果.`requestState`,我知道.

客户端使用全新的JSON-RPCID与`inputResponses`重试原始公共工具――网关对重试请求重新认定权,验证相同的公共路径,然后构建全新的后端请求向下转发――网关绝不能假设前轮已经获得无限的无限批准――

### 任务延伸路由

任务是官方扩展,标识为`io.modelcontextprotocol/tasks`,它绝对不是核心协议会议的替代品.

客户端在客户端要求中 声明支持扩展,而网关只能在终端保证任务生命周期时,才在发现中外声明支持.`tools/call`完全由后端决定返回常规结果还是`resultType: task`◎任务结果直接包含`taskId`,我知道.`status`时间`ttlMs`及可选的`pollIntervalMs`在发送该结果之前,任务状态必须已可靠,可持续和可读.

网关针对这个不透明的任务 标识符记录已认可的主体和后端路由.`tasks/get`,我知道.`tasks/update`及`tasks/cancel`调用均使用`params.taskId`作为一个`Mcp-Name`它们的中介类型提供了天然的路由键.`tasks/get`返回带有当前任务状态`resultType: complete`进入终态时内联最终结果或协议错误.`tasks/update`发送带键名的`inputResponses`为了提供任务所需的未决输入,并返回空空的完整确认响应.`tasks/cancel`表明协作式取消意图,返回空空的完整确认响应,但不保证后台任务立即停止.

不要实现新的`tasks/list`或`tasks/result`方法,它们属于旧版本的实验模型.`tasks/get`暴露完整的内嵌请求;客户端通过 `tasks/update`进行回复,而不是重试最初的工具调用――客户端仍然按照建议的间隔轮询;任务的创建仍然完全由服务端主导――

持久化任务路由状态属于按任务句柄索引的业务应用数据,绝非协议会议.

### 向后兼容边界

如果网关必须兼容旧版本客户端或后端:

- 显式探测协议所处的时代版本──
- 将初始化握手"",传输层会议"",独立 GET 流"",资源订阅和旧版本任务语法完全隔离在遗产适配器内部――
- 绝不能将旧版会议ID泄露到现代路由或鉴权逻辑中.
- 优先采用有限服务发现探测和明显退回策略,避免发生静默降低.

```figure
t3-gateway-funnel
```

## 动手构建

`code/main.py`实现一个进程中的协议网关模型和两个后端服务器. 每个后端都会收到符合当前协议的要求的全新构建.`tools/list`基于命名空间的路由,登记.`server.json`根据主体索引的限制流程,审计决策以及模拟的`subscriptions/listen`证流程――

该模型接收已解析的请求体,路由头部与已认可的载体身份.它本身不是完整的HTTP适配器,不负责解析.`Content-Type`或完整的`Accept`规范──你可将其连接到第09 课的流动HTTP适配器,后者强制要求 `Content-Type: application/json`并且同时包含`application/json`和 `text/event-stream`的`Accept`头子

运行它:

```bash
cd phases/13-tools-and-protocols/17-mcp-gateways-and-registries
python3 code/main.py
python3 -m unittest discover code/tests -v
```

演示程序将打印出外部请求 id 和新生成后端请求 id,以便直观地展示无状态转发过程.

## 使用它

将进程中的后端对象替换为真实的现代协议客户端――保持相同的分层边界:

- 连接前检查准入记录
- 暴露能力 前先完成后端服务发现
- 鉴权前先完成公共名称限定──
- 列表或调用前先核对描述器 哈希锁定.
- 转发前重新构建以请求元数据.
- 返回前校验后端执行结果.

## 交付它

本课交付 `outputs/skill-gateway-bootstrap.md`提供了完整的现代网关工程脚本架构设计,覆盖流量入口,服务发现,进入控制,命名空间,授权识别权,缓存,流式传输,订阅监听,MRTR,任务可观测性以及旧版本隔离.

## 课后深度练习

1. 在外部请求和转发请求的元数据中加入分布式链路追踪上下文 (Trace Context),并在审计事件中记录关联关系.
2. 接入一个具有任务能力的后端,并`Mcp-Name`中根据任务 id 完成 `tasks/get`精准的路由.
3. 刻意修改其中一个后端的描述器,验证网关的服务发现列表和直接调用是否被拦截断.
4. 为了特定主体添加专用服务器功能,并深入论证为什么此时服务发现结果必须保持私有缓存 (私有缓存) .
5. 编写一个传统的适配器接口,要求在不向现代`Gateway`类中添加任何遗留状态的前提下完成兼容接入.

## 关键术语

| 术语 | 含义 |
|------|------|
| MCP 网关 | 位于客户端与后端 MCP server 之间的安全策略与路由中心 |
| 准入记录（Admission record） | 允许特定后端接入网关的完整安全证据与审批策略决策 |
| 完全限定 tool 名称 | 稳定的对外公共路由名称，如 `notes.search` |
| Descriptor 锁定（Pin） | 在服务发现和请求分发期间严格比对校验的已批准哈希 digest |
| 私有缓存作用域（Private cache） | 缓存结果严格受限于单一授权主体与上下文，禁止跨用户共享 |
| 请求级作用域 SSE | 直接挂载在单次 POST 请求上的流式响应，连接关闭即取消请求 |
| `subscriptions/listen` | 客户端通过 POST 打开的 SSE 长连接，用于监听特定的列表变更通知 |
| 任务路由（Task route） | 将不透明的 taskId 映射到具体后端的应用层状态映射 |
| Legacy 适配器 | 带有明确版本门禁的隔离层，用于兼容旧版握手与 session 机制 |

## 延伸阅读

- [Streamable HTTP 传输协议规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [服务发现（Server Discovery）规范](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [官方 Registry server.json 规范与要求](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/official-registry-requirements.md)
- [MCP Tasks 扩展规范草案](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
