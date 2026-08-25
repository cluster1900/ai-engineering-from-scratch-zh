# MCP 一致性工程：版本控制、证据与运维

> server 不会仅仅因为其正常路径通过某个 SDK 成功运行，就符合一致性要求。一致性存在于 wire、版本边界、intermediary 以及回滚期间。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09（transports）、Phase 13 · 17（gateways）、Phase 13 · 30（registry admission）
**Time:** 约 100 分钟

## 学习目标

- 将 MCP 规范性规则转化为 golden 和 negative wire transcript。
- 将严格的 `2026-07-28` 行为与有界的旧版 fallback 分开。
- 区分附加的未知字段与无效的未知 `resultType`。
- 将原始 JSON-RPC 证据与 SDK 规范化视图进行比较。
- 证明通过真实 proxy 边界时 header 和 body 的完整性。
- 使用已编辑敏感信息的 transcript、健康状况和回滚证据控制发布。

## 问题

你的 client 通过 SDK 调用 `tools/list` 并获得了 Tools。集成测试通过了。

这个结果仍留下了一些重要问题：

- 请求是否携带了现代的每请求协议元数据？
- `MCP-Protocol-Version`、`Mcp-Method` 和 `Mcp-Name` 是否与 JSON-RPC body 匹配？
- 响应在 wire 上是否包含有效的 `resultType`，还是由 SDK 合成了该字段？
- client 是否会保留未来新增的附加字段？
- 已识别的现代错误是否会意外触发旧版 handshake？
- proxy 是否保留了 origin status 和 JSON-RPC error？
- notification serializer 是否发出了被禁止的响应？
- 运维人员能否在不存储 secret 的情况下证明发布版本为何被提升或回滚？

一致性是一组可观测的不变量。构建一个 harness，在生产流量被迫发现这些不变量之前捕获它们。

```figure
mcp-conformance-operations
```

## 从版本 Era 开始

MCP `2026-07-28` 使用自包含的每请求元数据。现代请求携带 `params._meta.io.modelcontextprotocol/protocolVersion` 和 `params._meta.io.modelcontextprotocol/clientCapabilities`。这些带 namespace 的精确 key 非常重要；裸露的 `protocolVersion` 或 `clientCapabilities` 别名格式无效。当 HTTP 边界存在镜像路由 header 时，其值必须与 JSON-RPC body 一致。现代的成功结果携带 `resultType`。

截至 `2025-11-25` 的版本使用更早的初始化 era。只有在 client 已选择该早期 era 后，缺少 `resultType` 的旧版结果才会被解释为 complete。

不要创建一个同时接受两种结构的宽松 validator。请使用两个分支：

| 分支 | 入口证据 | 缺少 `resultType` | 初始化 |
|---|---|---|---|
| 现代 | 成功的 `server/discover` 或已识别的现代响应 | 无效 | 不是默认路径 |
| 旧版 | 配置的 allowlist，加上现代 probe 无法得出结论后获得的有效旧版 `initialize` 结果 | 解释为 complete | 该 era 要求执行 |

这种分离可以避免格式错误的现代 peer 因此得到更宽松的验证待遇。

### 严格模式

严格模式要求提供现代行为的证明。成功的 `server/discover` 可以证明现代分支。已识别的现代 JSON-RPC error 同样可以证明。请修正请求或停止。绝不要因为 server 返回 `-32020`、`-32021` 或 `-32022` 就执行 downgrade。

### Fallback 模式

Fallback 模式执行一次有界的现代 probe。timeout、空回复、连接关闭或无法识别的响应都属于无法得出结论的情况。这些情况无法证明 peer 属于旧版。只有明确配置或加入 allowlist 以提供兼容性的 endpoint 才能继续接收有界的旧版 probe，并且 client 只能在验证该 probe 的 `initialize` 结果和协商得到的旧版 revision 后选择旧版分支。

Fallback 并不意味着“遇到任何错误后都尝试旧版”。已识别的现代错误包含有用的修正信息。在这类错误后执行 downgrade 可能会掩盖 header 不匹配、缺少 capability 声明或版本不受支持等问题。

这样可以防止攻击者、服务中断或过滤 proxy 通过丢弃现代响应强制执行 downgrade。将 endpoint 策略、无法得出结论的现代观测结果、确切的旧版正向证据和所选 era 一并记录。

在每份 transcript 旁记录所选 era。如果缺少这一事实，同一个缺失字段可能在一次测试运行中看似可接受，却在另一次运行中无效。

## 构建 Transcript Corpus

transcript fixture 记录的是跨越边界的实际内容，而不仅仅是 SDK 调用：

```json
{
  "name": "golden-modern-list",
  "era": "modern",
  "headers": {
    "MCP-Protocol-Version": "2026-07-28",
    "Mcp-Method": "tools/list"
  },
  "request": {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {
      "_meta": {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientCapabilities": {}
      }
    }
  },
  "responseStatus": 200,
  "responseBody": {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
      "resultType": "complete",
      "tools": []
    }
  }
}
```

保留两类 fixture。

### Golden transcript

Golden transcript 用于证明被接受的行为：

- 元数据与 header 匹配的现代 discovery 或 method 请求
- 包含必需字段的 complete 结果
- 当 method 可以请求更多输入时返回的 `input_required` 结果
- 仅在相应 capability 已发布后返回 extension 结果
- 缺少 `resultType` 的旧版结果，但仅限已选择的旧版 era
- 处理 notification 时不发送 JSON-RPC 响应

Golden transcript 应当精确，而非庞大。让易变的 ID 和时间戳保持确定性，或在比较前将其规范化。

### Negative transcript

Negative transcript 用于证明拒绝行为：

- header 与 body 不匹配
- 缺少每请求 capabilities
- 匹配的协议版本不受支持
- 缺少现代 `resultType`
- 未知或未发布的 `resultType`
- 响应中的 `jsonrpc` 不是 `2.0`，或 ID 的值或 JSON 类型不同
- 响应同时包含 `result` 和 `error`，或两者都不包含
- error 缺少整数 `code` 或字符串 `message`
- 已知协议错误被映射到错误的 HTTP status
- 为 notification 发出响应
- 格式错误的 JSON-RPC envelope
- proxy 折叠协议错误

对于每个 negative case，都要断言拒绝边界和稳定的错误代码。“调用失败”过于薄弱。proxy 生成的 500 和 origin `-32020` 看起来都像失败，但它们向运维人员传达的是完全不同的情况。

header 不匹配 fixture 必须包含 server 实际返回的 HTTP 400 JSON-RPC 响应，并带有匹配的请求 ID 和错误代码 `-32020`。每当本地 validator 观测到 `HeaderMismatch` 时，都要自动强制执行这项要求；不要将响应验证设置为可选 fixture flag。即使本地拒绝代码正确，HTTP 500 且没有 body 的 case 仍然应当失败。如果 harness 在自己的请求 validator 抛出异常后便停止，那么它只测试了自己，而没有测试 server 的 wire 行为。

官方 MCP conformance project 可以用作外部测试套件和有版本控制的参考。也要保留本地 transcript。它们会捕获通用套件无法了解的 proxy、SDK、身份验证、extensions 和发布路径。

## Header 值必须与 RPC Body 匹配

在现代 Streamable HTTP 中，intermediary 可以使用镜像 header 执行路由或策略。JSON-RPC body 仍然是协议事实来源。不匹配属于完整性故障，而不是提示你选择其中一个值。

按以下顺序验证：

1. 解析并验证 JSON-RPC envelope 和元数据类型。
2. 将 `MCP-Protocol-Version` 与 `params._meta.io.modelcontextprotocol/protocolVersion` 进行比较。
3. 将 `Mcp-Method` 与 `method` 进行比较。
4. 当 method 具有路由 name 时，将 `Mcp-Name` 与对应的 body 值进行比较。
5. 确认相等后，再判断匹配的版本和 capability 集合是否受支持。

该顺序可区分不匹配错误 `-32020` 和版本不受支持错误 `-32022`。它还可以阻止 gateway 授权 header 中的 name，却让 origin 执行另一个 body name。

HTTP field name 不区分大小写，而其 value 仍区分大小写。查找前将 header name 规范化，并拒绝相互冲突的重复项。对于不安全、非 ASCII 或存在首尾空白的 `Mcp-Name`，应先解码精确的 `=?base64?{Base64EncodedValue}?=` UTF-8 sentinel，再与 body 比较。遇到不完整的 sentinel、无效 Base64、无效 UTF-8 或未编码的不安全值时，使用 `-32020` 拒绝。即使 body 包含相同字符，原始的首尾空白仍然无效，因为该值在传输前必须使用 sentinel 编码。

intermediary 可能会在请求到达 MCP server 之前拒绝格式错误的 HTTP，因此其失败结果可能是不带 JSON-RPC 的 HTTP error。捕获拒绝是来自 intermediary 还是 origin。origin MCP server 在处理有效 JSON-RPC 请求时，应使用协议错误契约。

## 未知字段不等于未知结果

向前兼容需要两套不同的规则。

### 附加的未知字段

结果对象和 `_meta` map 可以新增字段。除非字段违反保留契约，否则 validator 应根据字段的作用保留或忽略附加字段。示例会在证据中保留完整的原始结果，并接受与已知结果并列的 `futureHint`。

如果你实现的是透明 proxy，保留未知字段通常比删除它更安全。如果你实现的是应用 client，忽略它可能是有效行为。differential test 仍应揭示 SDK 省略了该字段，从而确保这一行为是有意选择的。

### 未知 `resultType`

`resultType` 是 discriminator。现代核心结果使用 `complete` 或 `input_required`。只有在相应 capability 已发布的情况下，extension 才能添加其他值。例如，Tasks extension 可以在已协商该 capability 的 Context 中添加 `task`。

未知或未发布的 discriminator 不能被安全地视为 complete。client 并不了解自己将会丢弃的生命周期。应拒绝该结果。

因此，同一个原始响应可以同时包含可接受的未知字段和不可接受的未知结果类型。请测试这两种情况。

discriminator 只是第一层。随后还要验证 method 特定的 payload。complete `tools/list` 结果需要提供 `tools` array，其中的描述符必须具有唯一且非空的 name、有用的 description，以及根节点为 object 的 `inputSchema`。`task` 结果仅适用于已具备 Tasks capability、符合条件的 `tools/call`，并要求提供 `taskId`、已知 status、创建与更新时间戳以及 `ttlMs`，同时还可以包含有效的可选轮询间隔。complete `completion/complete` 结果需要一个 `completion` 对象，其中字符串 value 不超过 100 个；可选的非负整数 `total` 不得小于返回的 value 数量；还可以提供可选的 Boolean `hasMore`。即使 `resultType` 拼写正确，也无法让格式错误的 payload 符合一致性要求。

## Notification 不变量

JSON-RPC notification 不包含 `id`。接收方不得发送 JSON-RPC 成功响应或错误响应。

对于可接受的 HTTP notification 结构，harness 期望收到 body 为空的 HTTP `202`。MCP `2026-07-28` 没有定义通过 Streamable HTTP 从 client 发送到 server 的核心 notification。示例使用带 namespace 的课程 extension notification，仅用于测试单向 serializer 不变量。不要把它描述为新的核心 method。

要测试 serializer，而不仅仅是 handler。handler 可能返回 `None`，但 middleware 可能会将它包装到 JSON 成功对象中。捕获最终的 egress byte。

## 添加 SDK Differential

SDK 经常将 wire 对象转换为便于使用的语言类型。这很有用，但规范化对象无法证明实际接收到的内容。

对于每个高风险 fixture，捕获：

1. SDK 解码前的原始 status、header 和 response body。
2. SDK 规范化后的返回值或 exception。
3. 所选 era 对应的预期语义投影。
4. SDK 提取、合成、删除或更改的字段。

示例允许 SDK 在比较应用 payload 时，仅删除已知的 wire 记账字段，例如 `resultType`、`_meta`、`ttlMs` 和 `cacheScope`。示例会报告被删除的 `futureHint`，因为该未知语义字段消失了。

不要假定所有差异都是 SDK bug。重点是让转换过程可见。判断你的组件是可以忽略附加字段的应用 endpoint，还是应保留该字段的透明 intermediary。

针对你发布的每个 SDK 和版本运行 differential。如果两个 SDK 对同一个 transcript 进行不同的规范化，发布策略应明确哪种行为可接受，而不是在事后选择最方便的输出。

## 捕获 Proxy 证据

大多数生产 MCP 故障都会跨越多个进程。记录三种视图：

| 视图 | 最低证据要求 |
|---|---|
| Ingress | 请求 header、JSON-RPC body、content type、已验证身份的路由和接收时间 |
| Origin | 转发的 header 和 body digest、origin status、响应 header 和 body |
| Egress | client 可见的 status、header、body 和发送时间 |

示例会检测两种常见转换：

- origin HTTP 400 或 404 JSON-RPC error 变成通用 proxy 500
- egress JSON-RPC body 与 origin body 不同

针对 content type、`Accept`、压缩、请求级 SSE、cache header 和 trace correlation 添加部署特定的断言。在策略允许时捕获 TLS termination 两侧的证据。绝不要仅仅为了证明路径而记录凭据。

## 在证据离开内存前编辑敏感信息

敏感信息编辑是 conformance operations 的一部分，而不是之后执行的清理工作。应在序列化、hash、日志记录、测试产物写入或失败信息上传前执行。

示例会对 key name 进行大小写折叠并移除分隔符，然后进行匹配；接着递归替换 `Authorization`、`Cookie`、`Set-Cookie`、`X-Api-Key`、`accessToken`、`clientSecret`、`registrationAccessToken`、`token`、`password`、`secret` 和 `api_key` 等 key 下的 value。规范化与 denylist 必须使用相同形式，防止 camelCase、连字符、下划线和点分隔变体绕过彼此的策略。生产 collector 还应添加 method 特定的参数策略，因为 `query` 这样看似无害的 key 仍可能包含个人数据或受监管数据。

对已编辑敏感信息的证据包执行 hash。只有特定调查需要原始捕获内容时，才应将其保存在经过批准的短期系统中。digest 可以证明是哪一个已编辑敏感信息的证据包驱动了决策，但不会泄露被移除的值。

## 将健康状况和回滚纳入 Gate

协议一致性是发布的必要条件，但并不充分。符合一致性要求的候选版本仍可能出现 timeout、内存泄漏或依赖过载。

在推出版本之前定义健康观测窗口：

- 最低样本数
- 最大错误率
- 最大延迟百分位数
- 饱和度或资源限制
- 观测时长
- 与已准入 baseline 的比较

同样要在推出前定义回滚证据：

- 精确的先前版本
- 准入证据 digest
- SHA-256 产物和描述符 pins
- 当前 Registry 状态
- 当前健康状况结果
- 路由恢复流程
- 由可信 release-controller 身份对这些精确字段作出的 attestation

要求在提升候选版本之前验证回滚目标且确认其健康，而不是仅在候选版本失败后才验证。一次没有可用恢复路径的成功发布尚未达到生产就绪状态。

如果候选版本失败，而回滚目标缺少上述证据，应暂停流量而不是猜测。“回滚到之前的版本”并不是运维控制措施。

不要将就绪状态简化为 truthiness 检查，例如非空版本、`healthy: "yes"` 或任意证据字符串。示例要求提供精确类型、active 状态、三个 SHA-256 digest、可信 signer，以及针对完整回滚 payload 的有效 HMAC-SHA-256 attestation。其确定性 demo key 是非 secret fixture。在生产环境中，应在发布边界注入受保护的 key、KMS 验证结果或公钥 attestation verifier。

发布 gate 还会拒绝空的 transcript、SDK differential 或 proxy 证据。每个来源都必须携带有效的证据 digest。绿色的健康观测窗口无法弥补从未被观测的边界。

## 动手构建

运行基于标准库的 harness：

```bash
cd phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations
python3 code/main.py
```

demo 会运行恰好十五个 golden 和 negative transcript，其中包括有效和格式错误的 completion 结果；比较原始结果与 SDK 视图；检查折叠了 origin error 的 proxy；评估健康状况；验证回滚证据的身份；并选择该目标。

预期结构：

```json
{
  "transcriptsPassed": 15,
  "transcriptsTotal": 15,
  "sdkDroppedFields": ["futureHint"],
  "proxyIssues": [
    "proxy collapsed a protocol error into HTTP 500",
    "proxy changed the origin JSON-RPC body"
  ],
  "releaseAction": "rollback",
  "evidenceDigest": "..."
}
```

按以下顺序阅读 `code/main.py`：

1. `validate_request()` 强制执行 era 特定的请求和 header 规则。
2. `validate_result()` 区分缺失的旧版 discriminator、有效的现代值、extensions 和未知值。
3. `select_era()` 实现严格且有界的 fallback 策略。
4. `run_transcript()` 评估 golden 和 negative fixture。
5. `compare_sdk_view()` 揭示规范化差异。
6. `inspect_proxy()` 比较 ingress、origin 和 egress 证据。
7. `redact()` 在对证据执行 hash 前移除明显的 secret。
8. `rollback_evidence_ready()` 验证精确的 pin 字段和可信的发布 attestation。
9. `ReleaseGate.evaluate()` 关联非空的一致性、SDK、proxy、健康状况和回滚证据。

## 实际应用

在四个节点运行 harness：

1. 每次实现发生更改时，通过进程内 test adapter 运行。
2. 通过真实 transport，针对已构建的 client 和 server binary 运行。
3. 在 staging 环境中通过已部署的 proxy 或 gateway 运行。
4. 在 canary rollout 期间结合实时健康状况和回滚证据运行。

在不同层之间保留相同且稳定的 case name。`negative-header-body-mismatch` 在 unit、end-to-end、proxy 和 canary 报告中应表示同一个不变量。由于边界发生变化，证据 digest 会不同，但要求不应改变。

将 fixture schema 存储在版本控制中。将已编辑敏感信息的运行证据存储在发布系统中。仅在 incident 访问控制下存储短期原始捕获内容。

## 交互式 Lab

### Lab A：证明 era 边界

从 `code` 目录打开 Python：

```bash
cd phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/code
python3 -q
```

运行：

```python
from main import *
validate_result({"tools": []}, "legacy")
validate_result({"tools": []}, "modern")
```

旧版调用会推断为 `complete`。现代调用会抛出 `ProtocolViolation`。现在测试 fallback：

```python
select_era({"kind": "timeout"}, "fallback")
select_era(
    {"kind": "timeout"},
    "fallback",
    legacy_allowed=True,
    legacy_evidence={"kind": "initialize_success", "protocolVersion": LEGACY_VERSION},
)
select_era({"kind": "jsonrpc_error", "code": -32021}, "fallback")
```

第一次 timeout 会失败关闭，因为静默并不是旧版证据。第二次调用仅在配置允许且观测到有效旧版初始化结果的情况下选择旧版。已识别的 capability 缺失错误可以证明现代分支。

### Lab B：附加字段与 discriminator

```python
validate_result({"resultType": "complete", "tools": [], "futureHint": True}, "modern")
validate_result({"resultType": "future_mode", "tools": []}, "modern")
```

第一个结果会保留 `futureHint`。第二个结果会被拒绝，因为其生命周期 discriminator 未知。

### Lab C：检查 SDK 转换

```python
compare_sdk_view(
    {"resultType": "complete", "tools": [], "futureHint": {"mode": "new"}},
    {"tools": []},
)
```

判断你的组件可以忽略 `futureHint`，还是必须转发它。将这一选择写入发布策略。不要静默消除该 differential。

### Lab D：修复 proxy

修改 demo exchange，使 egress 保留 origin status 和 body。再次运行 `python3 main.py`。proxy 问题应消失，但 SDK differential 仍会阻止提升。然后在 SDK 视图中加入 `futureHint`，并观测每个证据来源均通过时 action 如何变为 `promote`。

## 练习 Lab

向 harness 添加请求级 SSE transcript。

要求：

- 捕获响应 status、content type、有序 SSE event 和 stream termination。
- 证明每个 JSON-RPC event 都具有有效的 era 特定结果或 error。
- 为在转发前缓冲完整 stream 的 proxy 添加一个 negative case。
- 为 JSON-RPC id 与请求不同的 SSE event 添加一个 negative case。
- 写入证据前编辑 event data 中的敏感信息。
- 在健康观测窗口中包含 stream duration、first-event latency 和 event count。
- stream 失败时，让发布 gate 仅选择有证据支持的回滚目标。

成功标准是同一个 case 可以直接运行，也可以通过 proxy 运行，并生成能够识别行为发生变化的确切边界的报告。

## 交付产物

本课交付 `outputs/skill-mcp-conformance-release-gate.md`。使用它可以将 server、client、gateway 或 SDK 变更转化为带版本的一致性 Matrix 和发布决策。该产物要求提供原始 wire 证据、negative case、显式 era 选择、SDK differential、proxy 证明、敏感信息编辑、健康阈值和回滚证据。

## 验证

运行 demo 和确定性测试套件：

```bash
cd phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明：

- 每个包含的 golden 和 negative transcript 都得到预期结果
- 现代请求需要精确的带 namespace 的元数据 key
- HTTP header name 以不区分大小写的方式匹配，编码后的 `Mcp-Name` value 会被精确解码
- header 与 body 不匹配时返回现代不匹配错误代码
- 验证响应 version、ID、result 或 error 的互斥性、error 结构和 HTTP 映射
- 强制执行 method 特定的 Tool list、task 和 completion payload 要求
- 每次观测到 `HeaderMismatch` 时，都要求实际收到 HTTP 400 JSON-RPC `-32020` 响应
- 拒绝原始 `Mcp-Name` 中的空白，同时精确经过 sentinel 编码的空白可以往返传输
- 缺少 `resultType` 仅在已选择的旧版 era 中有效
- 附加字段通过原始验证得以保留，而未知结果类型会失败
- extension 结果类型要求发布对应的 capability
- 已识别的现代错误绝不会触发旧版 fallback
- notification 不产生 JSON-RPC 响应
- 区分 SDK 记账字段的移除与语义字段丢失
- 检测 proxy 错误折叠，并针对 camelCase 和分隔符变体递归编辑凭据
- 提升要求提供非空的 transcript、SDK、proxy 和健康运维证据
- 提升和回滚都要求提供经过身份验证、已固定、处于 active 状态且健康的回滚目标

## 生产故障模式

| 故障 | 薄弱测试报告的结果 | harness 必须证明的事实 |
|---|---|---|
| SDK 合成缺失的 discriminator | “tools/list 已通过” | 原始现代结果缺少 `resultType`，因此无效 |
| Client 在 `-32021` 后执行 downgrade | “旧版重试成功” | 已识别的现代错误禁止 fallback |
| 将未知结果类型视为 complete | “响应已解析” | 未发布的生命周期 discriminator 被拒绝 |
| Proxy 授权一个 Tool，而 origin 执行另一个 Tool | “请求已到达 server” | `Mcp-Name` 在每一跳都等于 body 中的路由 name |
| Harness 在读取 server 响应前抛出异常 | “header 不匹配测试已通过” | HTTP 400 和 JSON-RPC `-32020` 响应均被捕获并验证 |
| Proxy 将 origin 400 转换为通用 500 | “upstream error” | origin 和 egress 的 status 与 JSON-RPC body 均被保留 |
| Notification middleware 发出 `{result: null}` | “handler 返回 none” | 最终 egress body 为空，并且不存在 JSON-RPC 响应 |
| SDK 删除附加字段 | “类型化对象匹配” | 原始视图和规范化视图显示确切的被删除字段 |
| 失败产物泄露 bearer token | “调试包已上传” | 在 hash、日志记录或上传前已经编辑敏感信息 |
| 凭据 key 样式绕过敏感信息编辑 | “denylist 包含 api_key” | camelCase 和分隔符变体使用同一种规范化 denylist 形式 |
| Canary 没有样本却表现为健康 | “零错误” | 强制执行最低样本数 |
| 回滚选择未知 build | “先前 deployment 已恢复” | 目标 version、准入 digest、pins、status 和健康状况均存在 |

## 运维规则

测试你发送的 byte、每个 intermediary 转发的 byte、每个 SDK 暴露的语义，以及运维人员在压力下使用的证据。兼容性是一个显式分支。回滚是由证据支持的发布 action。两者都不应成为宽松 parser 的意外副作用。

## 延伸阅读

- [MCP 2026-07-28 基础协议](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP 版本协商](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)
- [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [官方 MCP conformance project](https://github.com/modelcontextprotocol/conformance)
