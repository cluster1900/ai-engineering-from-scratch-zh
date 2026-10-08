# 传输协议与 HTTP 请求头契约

> 传输协议并不改变报文本身的内涵，仅决定其如何在物理链路中流转：stdio 将单行 JSON-RPC 交付给子进程，而流式 HTTP 为每条报文发起独立 POST 请求，并将部分字段镜像到请求头中，以便网关无需解析报文体即可完成智能路由。

**Type:** Reference
**Languages:** Python
**Prerequisites:** Lesson 18
**Time:** ~45 minutes

## 学习目标

- 掌握 stdio 传输协议所要求的换行符定界 (Newline-delimited) JSON-RPC 报文组帧与解析规则，理解为何报文内部夹带换行符会破坏消息边界
- 熟练阐明流式 HTTP (Streamable HTTP) 的请求与响应范式：单条消息独立 POST、单 JSON 对象或单请求级专属 SSE 流、针对单向通知返回 `202 Accepted`，且不存在任何 GET 端点
- 正确构造并严格校验必需的 HTTP 请求头：`MCP-Protocol-Version`、`Mcp-Method` 与 `Mcp-Name`，掌握通过 `x-mcp-header` 配合 Base64 哨兵编码 (Sentinel Encoding) 镜像工具参数的机制
- 深入理解源验证 (Origin Validation) 与本地绑定在防御 DNS 重绑定攻击 (DNS Rebinding) 中的关键作用，以及现代服务端面对 GET、DELETE 与非法 Origin 时返回的标准状态码
- 准确区分 `HeaderMismatch` (`-32020`) 协议级错误与底层传输通道在不产生 JSON-RPC 报文时直接返回的纯 HTTP 状态码

## 问题背景

在 MCP 体系中，每条消息都已自包含其被正确理解所需的全部上下文：调用的方法、具体的入参，以及位于 `params._meta` 中的单请求级元数据。这些语义内容完全独立于字节流在客户端与服务端之间的物理传输介质。然而，系统依然需要具体的底层机制来承载这些字节、划分消息边界、在连接意外中断时感知故障，并允许负载均衡器或 API 网关无需充当全功能 JSON-RPC 解析器即可实施高效路由。这正是传输层 (Transport) 的核心职责。在 MCP 2026-07-28 规范中，仅正式定义了两种标准传输协议：用于客户端拉起本地子进程的 stdio，以及可供任意数量远程客户端并发访问的网络服务协议 Streamable HTTP。

如果课程将传输层视作无足轻重的底层细节，就会留下认证考试专门针对的大片盲区。第 04 课所阐述的无状态核心设计，其在端到端系统中的有效运转完全建立在底层传输绑定绝不偷偷夹带自身状态的基石之上：严禁引入 Session ID、断点续传流，或让服务端隐式记住当前连接的历史上下文。本课讲解的每一项硬性规范，都是为了牢牢捍卫这一承诺：传输层仅负责消息的分帧与投递，绝不承载任何额外状态。

## 核心概念

### stdio：共享三条标准流的子进程拓扑

在 stdio 传输绑定中，客户端直接将服务端作为自身的子进程启动，双方共享操作系统的标准输入输出流。服务端从 `stdin` 读取客户端发来的 JSON-RPC 请求与通知，并将响应与服务端通知写向 `stdout`。数据必须按行严格分隔，每行承载一条独立报文，报文内部绝不允许夹带任何换行符。`stdout` 仅用于传输完全合法的 MCP 规范报文；服务端绝不会在此通道主动向客户端发起 JSON-RPC 请求，因为第 14 课介绍的 MRTR 模式已将所有历史上由服务端发起的逆向请求全面重构为携带 `input_required` 的阶段性响应。`stderr` 则完全保留给各级别日志输出，客户端绝不能先验地将出现在 `stderr` 中的内容一概武断视作系统报错。

stdio 模式下不存在请求头 (Headers) 抽象层。所有在 Streamable HTTP 中被镜像至请求头的元数据字段在此依然完全存在，但它们仅以内联键值对的形式直接沉淀在 `params._meta` 之中，这与其他任何传输协议的处理完全一致。若要取消正在执行中的请求，客户端必须向 `stdin` 发送 `notifications/cancelled` 通知并明确声明关联的请求 id，因为在 stdio 管道中不存在可供单独关闭的单请求级独立网络流。子进程的生命周期终止遵循协作关停原则：客户端首先主动关闭 `stdin` 写端，短暂等待子进程自我退出；只有在超时未响应时，才会将控制权升级为操作系统进程信号（如 SIGTERM 或 SIGKILL）。若子进程意外崩溃，无状态架构的恢复流程极为清爽：客户端就地重启新进程，直接丢弃之前在途的悬挂请求，并针对自身仍然需要的订阅资源重新发起 `subscriptions/listen`；全新的子进程与刚刚崩溃的旧实例具备完全等价的处理能力。

### Streamable HTTP：单端点、单 POST 单报文

Streamable HTTP 服务端仅对外暴露一个统一的 MCP 协议端点（例如 `/mcp`），在协议层面该端点仅接收 POST 请求。每一个 JSON-RPC 请求或通知都被封装为一个独立的 POST 动作。客户端在发起请求时，其 `Accept` 请求头必须同时声明 `application/json` 与 `text/event-stream`：因为服务端既可以直接返回包含单个 JSON 对象的标准响应，也可以选择开启仅限定于该次请求生命周期的专属 SSE 流，以便在返回终态响应之前持续推送进度通知或日志流。如果服务端顺利接纳了一个通知类的 POST 请求，必须返回 HTTP `202 Accepted` 且不附带任何响应体；通知永远不会产生 JSON-RPC 响应报文。

在 2026-07-28 规范中，彻底移除了独立的 GET 路由端点、Session 机制与长连接断点续传。现代服务端若在 MCP 端点收到 GET 或 DELETE 请求，必须直接拒绝并返回 `405 Method Not Allowed`。服务端既不生成也不读取任何 Session 相关的请求头；若底层 SSE 流发生非预期中断，客户端不再支持携带重放 ID 进行重连续传，而是直接判定该次请求失败，并在操作安全的前提下使用全新的 JSON-RPC id 发起全新调用。当服务端开启长生命周期的流式响应时，应当主动附带 `X-Accel-Buffering: no` 响应头以阻止反向代理层对事件块进行缓冲阻滞，并周期性发送 SSE 注释行（保活心跳包），防止代理层空闲超时在静默期掐断 TCP 连接。

源验证 (Origin Validation) 是现代规范的一道关键安全屏障：即使 MCP 服务端仅安全绑定在 `127.0.0.1` 本地回环地址上，若不主动核验请求方身份，恶意网页依然可以通过 DNS 重绑定攻击穿透浏览器沙箱直接操控本地服务端。因此，只要请求携带了 `Origin` 请求头，且其取值不在服务端白名单内，服务端必须强制返回 `403 Forbidden`。对于完全未附带 `Origin` 头部的请求（例如宿主应用自带的非浏览器原生 HTTP 客户端），则无需机械拒绝。需要明确的是，源验证绝不等于身份认证，服务端仍须在此之上严格实施基于 Bearer Token 的权限核验。

### 请求头镜像及其安全契约

Streamable HTTP 将请求体中的若干核心字段镜像 (Mirror) 至 HTTP 请求头中，从而赋能外部网络基础设施（如负载均衡器、WAF 或 API 网关）在无需开销巨大的全量 JSON 反序列化的前提下，精准执行流量路由与鉴权策略。每一个 POST 请求都必须携带 `MCP-Protocol-Version` 头，其值必须与请求体内 `params._meta["io.modelcontextprotocol/protocolVersion"]` 的声明保持绝对一致。每个请求还必须携带 `Mcp-Method` 头，其值必须严格等于 JSON-RPC 的 `method` 字段。对于 `tools/call`、`resources/read` 与 `prompts/get` 请求，必须额外附加 `Mcp-Name` 头，分别对应 `params.name`，或针对资源读取场景对应 `params.uri`。一旦服务端发现上述请求头与请求体实际内容存在偏差，或发现必需的请求头缺失，必须立刻以 HTTP `400 Bad Request` 拒绝请求，并在响应体中包装错误码为 `-32020` (`HeaderMismatch`) 的标准 JSON-RPC 错误对象。这一规则具有绝对的强制性：如果网关依据请求头进行路由转发，而后端服务器却依据请求体执行具体代码，二者之间的不一致窗口恰恰会成为恶意攻击者实施请求走私或权限绕过的绝佳温床。

工具模式定义还可以进一步要求客户端将其中的某些具体业务入参镜像到自定义请求头中，这通过在对应属性的模式中声明 `"x-mcp-header"` 实现。例如一个被标记为 `"x-mcp-header": "Region"` 的参数，在网络传输时必须映射为 `Mcp-Param-Region` 请求头，且其值必须与请求体中 `arguments.region` 完全一致。由于 HTTP 请求头必须由可见 ASCII 字符构成，若参数取值包含非 ASCII 字符、控制字符、前后空白符，或者巧合地与哨兵格式雷同，必须在网络封包前统一通过 Base64 哨兵格式进行转义编码：`=?base64?{value}?=`；服务端在将其与请求体比对前需先解码还原。请求头名称大小写不敏感，但请求头取值（包括方法名与工具名）大小写绝对敏感。镜像能力有其明确的边界：仅适用于位于模式根节点、且类型为整数、字符串或布尔值的静态参数，绝不适用于浮点数 (`number`)；若某个工具的 `x-mcp-header` 破坏了上述约束，运行在 Streamable HTTP 上的客户端必须在 `tools/list` 发现阶段直接剔除该工具而非尝试调用；此外，服务端开发者绝不应将 API 密钥或敏感凭据标记为镜像参数，因为请求头信息会对链路上的所有代理网关与访问日志全面暴露。

在可靠字节流上运行的自定义传输协议，应直接复用 stdio 的换行定界分帧机制，而非自造轮子。2024-11-05 时期早期采用的旧版 HTTP+SSE 传输协议已被官方正式废弃 (Deprecated)：全新服务端不得再行采用，存量系统必须逐步向标准的 Streamable HTTP 平滑迁移。

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: run_report
Mcp-Param-Region: us-west1

{"jsonrpc": "2.0", "id": 7, "method": "tools/call", "params": {"name": "run_report", "arguments": {"region": "us-west1", "dataset": "signups"}, "_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {}}}}
```

```json
{"jsonrpc": "2.0", "id": 7, "error": {"code": -32020, "message": "Header mismatch: Mcp-Method", "data": {"headers": ["Mcp-Method"]}}}
```

```figure
mcpa-19-transports
```

## 交互式实验

上方的架构图将 stdio 与 Streamable HTTP 两大传输机制并列对照。左侧为 stdio 模式：客户端与服务端完全通过 `stdin`、`stdout` 以及用于日志的虚线 `stderr` 单纯交换行文本，全程不存在任何请求头层，全部元数据自包含在请求体内 `_meta` 中。右侧为 Streamable HTTP 模式：客户端向单一端点发起 POST 请求，服务端直接回传响应；图中的通信箭头上标注了关键检查点，即服务端将镜像请求头与请求体进行严格对比，一旦校验不一致立刻打回 `400` 状态码与 `-32020` 错误，绝不放行进入工具执行层。请顺着两条路径各追踪一次调用，你会发现 JSON-RPC 报文核心完全未变，改变的仅仅是其外层传输封包方式。

## 实战演练

查看 `code/main.py` 代码。该模块构建了一个内置 `run_report` 工具的服务端实例，其 `region` 参数被显式声明为 `x-mcp-header: Region`，并驱动同一个调用在三种场景下执行：`call_stdio` 直接向服务端发送请求，模拟本地子进程视角，利用 `frame_message` 与 `parse_frames` 演示换行分帧；`call_http` 利用 `build_http_headers` 自动构建合规镜像头，经由 `handle_http_request` 执行严格校验，通过后再分发至服务逻辑，并将请求头与报文统一包裹记录；`call_http_with_header_mismatch` 则故意将请求头中的 `Mcp-Method` 篡改为 `prompts/get`，直观展示服务端如何将其拦截并返回 `400` 状态码与 `-32020` 错误码（该条目用 `violation` 标记包裹，使校验器能专门针对随后的标准错误响应进行比对）。

在课程目录下运行脚本：

```bash
python3 code/main.py
```

对于那些从不转化为 JSON-RPC 报文的纯传输层响应（如 GET/DELETE 触发的 `405`、非法 Origin 触发的 `403`，以及成功接收通知返回的 `202` 无实体响应），它们并未出现在运行日志的常规调用列表中，因为此时根本不存在任何 `result` 或 `error` 对象；它们的处理逻辑集中在 `handle_http_get_or_delete`、`validate_origin` 与 `handle_http_notification` 中，并在单元测试中接受直接覆盖。尝试在调试会话中将 `region` 参数修改为包含逗号或中文字符的非常规文本重新运行：观察 `encode_header_value` 如何自动切换至 Base64 哨兵编码，并确认服务端 `decode_header_value` 能够将其无损还原。

## 交付产物

`outputs/transport-selection-guide.md` 是一份单页传输选型与契约指南：清晰指明何时应当选用 stdio、何时选用 Streamable HTTP；提供了完整的请求头映射对照表（指明源字段与必需场景）；详细记录了 Base64 哨兵编码规则；并对 GET、DELETE、Origin 违规、头部冲突以及通知成功接收等纯传输场景提供了权威的状态码决断标准。

## 验证方法

在当前课程目录下执行单元测试：

```bash
python3 -m unittest discover code/tests
```

测试套件严密核验了本课建立的全部规则：stdio 消息帧在 `parse_frames` 中正确无损解析；包含内联换行符的畸形报文被准确拒绝；`tools/call` 的镜像请求头与请求体完美对齐（包括 `x-mcp-header` 声明的自定义参数）；Base64 哨兵编码逻辑与官方规范示例完全一致并可双向解密还原；`resources/read` 能够正确从 `params.uri` 提炼 `Mcp-Name`，而无名称的方法则正确省略该头部；匹配的请求头顺利放行，被篡改的 `Mcp-Method` 头被拦截并返回 `400` 与 `-32020`；非法 Origin 触发 `403`，而合规 Origin 或无 Origin 请求均可正常通过；GET 与 DELETE 请求均命中 `405`；通知请求得到 `202` 确认；且日志中的故意违规示例在被 `violation` 安全包装后紧随标准的错误响应。同时，运行协议通信校验器：

```bash
python3 scripts/check_mcpa_wire.py certifications/mcpa/lessons/19-transports-and-http-headers
```

## 项目连接

毕业设计中的端到端完整交互必须运行在特定的底层传输通道之上，其所附带的每一个请求头都必须恪守本课建立的“报文体为事实唯一基准”的铁律：镜像字段仅用于路由分流，绝不能篡位成为第二数据源。当毕业项目在网络通信层面校验报文时，执行的正是本课实现的头部与报文体双向核验机制；而当项目需要证明为何连接中断后不能机械重连续传时，其立论依据正是本课展现的 stdio 重启与 HTTP 新 id 重发所依赖的纯粹无状态原则。

## 核心术语

| 术语 (Term) | 核心内涵解释 |
|---|---|
| stdio | 客户端将服务端作为本地子进程拉起并直接通过标准输入输出管道交互的传输绑定 |
| Streamable HTTP | 每条 JSON-RPC 消息均作为独立 POST 发送至单一端点的网络传输协议 |
| Frame (消息帧) | stdio 管道中以换行符严格分隔的单条 JSON-RPC 报文，内部绝不能包含换行字符 |
| `MCP-Protocol-Version` | 必需的 HTTP 请求头，其取值必须与请求体 `_meta` 中声明的协议版本严格一致 |
| `Mcp-Method` | 必需的 HTTP 请求头，镜像请求体顶层的 JSON-RPC `method` 字段 |
| `Mcp-Name` | 镜像请求头：针对 `tools/call`、`resources/read` 与 `prompts/get` 分别映射其名称或 URI |
| `x-mcp-header` | 工具模式注解，指示客户端将指定入参镜像为 `Mcp-Param-{Name}` 请求头 |
| Base64 sentinel (哨兵编码) | `=?base64?{value}?=` 编码范式，当镜像请求头取值非标准 ASCII 时用于安全封包 |
| `HeaderMismatch` | 错误码 `-32020`：当镜像请求头与请求体声明冲突或必需请求头缺失时，伴随 HTTP `400` 返回 |
| Origin validation (源验证) | 核查请求的 `Origin` 头部以阻断 DNS 重绑定攻击的安全机制，违规时返回 `403` |

## 延伸阅读

- [MCP 传输协议概述](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports)
- [stdio 传输协议规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [Streamable HTTP 传输协议规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [工具定义：x-mcp-header 说明](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#x-mcp-header)
- `certifications/mcpa/research/mcp-2026-07-28-brief.md`，第 9 章节
- `phases/13-tools-and-protocols/09-mcp-transports`，深入剖析纯 POST 契约细节
