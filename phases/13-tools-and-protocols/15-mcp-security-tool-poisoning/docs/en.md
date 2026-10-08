# MCP 安全：元数据投毒、路由与 MRTR 状态

> 无状态并不意味着零信任（trustless）。它意味着每个请求都必须暴露出 server 与 gateway 进行独立验证调用所需的全部证据。

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 08 (MCP client)
**Time:** ~60 minutes

## 学习目标

- 将 tool description、annotation、客户端信息以及服务端信息均视为不可信数据。
- 检测元数据投毒（metadata poisoning）、descriptor 恶意篡改（rug pull）以及跨 server 的名字冲突与遮蔽（shadowing）。
- 验证 2026-07-28 版本的请求元数据与 Streamable HTTP 路由头部。
- 保护 MRTR `requestState` 免受篡改，并将人工确认与精确的调用 arguments 强绑定。
- 将授权与速率限制（rate limit）施加于认证主体（principal），而非已被移除的协议 session。

## 问题

模型依靠读取 tool description 来决定调用什么。路由器依靠读取 tool name 来决定将请求发送到何处。用户依靠读取界面标签来决定批准什么操作。只需一个恶意构造的 descriptor，就能同时对这三者发起攻击。

MCP 官方的安全指引非常直接：除非 descriptions 和 annotations 来自完全受信任的 server，否则一律应视为不可信数据。即便如此，运行时的信任状态也会发生变化。一次 server 更新、一个被污染的依赖包、一次 registry 配置失误，或者一次 gateway 合并，都有可能篡改模型看到的内容。

当前协议还改变了安全边界。在 2026-07-28 核心协议中，不存在握手阶段，也不存在传输层 session。任何仅依靠 `Mcp-Session-Id` 来绑定批准凭证、速率限制或审计历史的安全设计，都已不再符合当前协议标准。

## 概念

### 值得检查的七大攻击面

与其模糊地提醒“要小心”，不如遵循一份明确的防御清单：

1. **元数据投毒（Metadata poisoning）：** description 中嵌入了与声明的 tool 行为完全无关的指令（如提示注入、越狱）。
2. **Descriptor 恶意篡改（Descriptor rug pull）：** 之前已被用户或系统批准的 name、description、schema 或 annotation 发生静默变更。
3. **跨 server 名字遮蔽（Cross-server shadowing）：** 两个后端暴露了相同的未加限定 tool name，而路由器根据注册顺序静默选择了其中一个。
4. **Header 与 Body 混淆（Header and body confusion）：** HTTP 头部的 `Mcp-Method` 或 `Mcp-Name` 与 JSON-RPC 请求体中的内容不一致。
5. **Capability 权限提权（Capability escalation）：** 对端在请求中声明了某项 extension 或客户端特性，而 server 错误地将该声明当作了已授权凭据。
6. **MRTR 状态篡改（MRTR state tampering）：** 客户端篡改了 `requestState`、回答了另一个完全不同的确认问题，或者将旧的确认凭证复用到改动后的 arguments 上。
7. **供应链身份混淆（Supply-chain identity confusion）：** 将一个看似熟悉的显示名称（display name）当作发布者或 server 真实身份的证明。

这些攻击面往往相互交织。哈希锁定（Hash pinning）有助于发现 descriptor 的后续篡改，但无法证明最初的 descriptor 本身是安全的。静态扫描能捕获明显的危险短语，却无法识别精巧伪装的语义指令。命名空间能防止同名冲突，却无法阻挡恶意命名空间内的 server。因此，必须采用纵深防御（Defense-in-depth）。

### 当前请求信封是证据，而非身份

每一个 2026-07-28 版本的请求都包含：

```json
{
  "_meta": {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientCapabilities": {
      "elicitation": {"form": {}}
    },
    "io.modelcontextprotocol/clientInfo": {
      "name": "security-lab",
      "version": "1.0.0"
    }
  }
}
```

在每个请求上都要验证 protocol version 与 capability 的结构有效性。利用 capabilities 来选择与之兼容的响应结构。但**绝不能**把 `clientInfo` 当作经过认证的主体标识——它纯粹是客户端自行汇报的数据。

同样的警告也适用于结果元数据中的 `io.modelcontextprotocol/serverInfo`。它对于日志记录和排查调试非常有用，但它既不是数字证书，也不是 registry 凭据，更不能作为授权决策的依据。

### 先验证路由，再执行策略

对于 `tools/call`，Streamable HTTP 传输层包含如下头部：

```text
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.export
```

Header 中的 method 必须与 body 中的 method 完全一致。Header 中的 name 必须与 body 中的 `params.name` 完全一致。在选择后端、应用 RBAC（基于角色的访问控制）或消耗限流 token 之前，一旦发现不一致，必须立即返回 `-32020` 错误进行拒绝。

这种验证顺序消除了常见的歧义漏洞：防止出现一个组件基于 body 授权，而另一个网关组件却根据 header 路由的情况。

底层报文验证遵循严格的时序：先验证 JSON-RPC 和元数据类型，比对 header 与 body 的值，然后检查匹配的版本是否受支持。Header 不匹配返回 HTTP 400 与错误码 `-32020`。如果 header 与 body 一致但版本不受支持，返回 HTTP 400 与错误码 `-32022`，且 `data` 必须精确为 `{"supported":["2026-07-28"],"requested":"<actual>"}`。若请求了未知方法，则返回 HTTP 404 与错误码 `-32601`。

当契约需要结构化恢复信息时，每个错误对象都可以包含可选的 `data` 字段。由于通知（notification）没有 `id`，因此它永远不会收到 JSON-RPC 成功或错误响应。被接受的 HTTP 通知应返回 HTTP 202 且响应体为空。

### 对整个 Descriptor 进行哈希锁定（Pinning）

仅对 description 计算哈希会遗漏 schema 和 annotation 的篡改。必须对用户批准过的所有 descriptor 字段进行规范化（canonicalize）并计算哈希：

```python
normalized = json.dumps(tool, sort_keys=True, separators=(",", ":"))
digest = hashlib.sha256(normalized.encode()).hexdigest()
```

将该 digest 存储在完全限定键（如 `notes.export`）下，并在生产环境中记录发布者证据及审批时间戳。

在每次刷新或发现时：

- 未知键：隔离（quarantine）直到人工审查完成。
- 相同键，不同 digest：作为恶意篡改（rug pull）予以隔离，直到重新获得批准。
- 重复的未限定名称：强制要求确定性的命名空间划分。
- 静态扫描命中：拦截并全面审查整个 descriptor。

哈希一致只能证明内容未发生变化，不能证明其本质安全。一个已被投毒的 descriptor 在被完美 pin 住后依然是带毒的。

### 静态扫描是一道警报线

简单的模式匹配能够标记出角色标签、指令覆盖、隐蔽行为、秘密访问以及可疑的网络外连目的地。这类扫描成本极低，非常适合放在安装时和 CI 流水线中运行。

但静态扫描不能作为语义证明。一个安全的 description 可能会在合法的安全警告中包含被标记的短语；而一个精心构造的恶意 description 完全可以避开所有关键词。应将扫描输出视为审查证据，而非自动免检证明。

### 合并之前进行命名空间隔离

假设两个 server 都暴露了名为 `search` 的 tool，绝不能由注册发现的先后顺序决定谁生效。

```text
notes.search
issues.search
```

完全限定名就是对外暴露的 gateway 公共名称。后端映射关系应单独记录。稳定的命名能确保审批、审计、哈希锁定以及 `Mcp-Name` 路由全部指向同一个实体对象。

### Capabilities 是兼容性声明

每个请求中的 `clientCapabilities` 只是告知 server 客户端能够处理哪些协议特性。它**绝不代表**授予客户端访问 tools、数据或操作的权限。

授权依然完全来自已认证的主体（principal）与资源策略。严格的执行步骤为：

1. 认证传输层凭证。
2. 验证协议版本、headers 以及请求结构。
3. 检查 capability 兼容性。
4. 对主体、tool、资源及 arguments 进行鉴权。
5. 执行操作或向用户请求输入。

### 保护无状态 MRTR 确认

具有重大影响的 tool（consequential tool）可能需要用户确认。当前 MCP 采用多往返请求（MRTR），而非 server 到 client 的反向回调。

第一轮响应：

```json
{
  "resultType": "input_required",
  "inputRequests": {
    "confirm": {
      "method": "elicitation/create",
      "params": {
        "mode": "form",
        "message": "Export notes to archive?",
        "requestedSchema": {
          "type": "object",
          "properties": {
            "confirm": {"type": "boolean"}
          },
          "required": ["confirm"]
        }
      }
    }
  },
  "requestState": "opaque-integrity-protected-value"
}
```

客户端获取用户输入后，使用新的 JSON-RPC id 重试原始方法：

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "notes.export",
    "arguments": {"query": "private", "destination": "archive"},
    "requestState": "opaque-integrity-protected-value",
    "inputResponses": {
      "confirm": {
        "action": "accept",
        "content": {"confirm": true}
      }
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "elicitation": {"form": {}}
      }
    }
  }
}
```

每个 `inputRequests` 的值都是一个包含 `method` 和 `params` 的完整内嵌请求。其键名必须与 `inputResponses` 中的对应条目一致。表单诱导（form elicitation）使用以 object 为根节点的 `requestedSchema`，并且客户端必须在 server 发起请求前已声明具备 form elicitation capability。

当前协议有两种合法的表单 capability 声明：`{"elicitation":{}}` 隐式支持表单；而 `{"elicitation":{"form":{}}}` 为显式声明。若仅声明 URL 支持（例如 `{"elicitation":{"url":{}}}`），则不支持表单请求。此时 server 会返回 HTTP 400 与错误码 `-32021`，且 `data.requiredCapabilities` 为 `{"elicitation":{"form":{}}}`。

必须将 `requestState` 视为不可信输入。对其签名或加密，严密验证，并将其与方法、tool、精确的 arguments、操作目的、过期时间、认证主体以及一次性随机数（nonce，用于防重放）强力绑定。本课代码演示了利用 HMAC 和精确参数比对来构建清晰的安全边界。

Nonce 账本绝不能仅保存在单台 gateway 内存中。可运行模型注入了一个受限的、带 TTL 清理的防重放存储，可由多个 gateway 实例共享。其原子性核销（atomic claim）构成了执行边界：只有经过验证的同意操作或显式的终止拒绝才会消耗该状态。格式错误的响应或 `cancel` 不执行任何操作，且在过期前保持可重试状态。生产集群需要在共享持久化存储中实现相同的条件核销机制。

切勿将确认上下文隐藏在某个协议 session 中。集群中任何一个 server 实例都必须能独立验证重试请求。

### 高风险调用的“两人法则”（Rule of Two）

从三个维度对一次调用进行分类：

- 是否消费不可信输入。
- 是否能够访问敏感数据。
- 是否会产生不可逆的外部重大影响。

任何单一的自动化步骤都不能同时具备这三项特征。一旦汇聚，就必须对其拆分、降权，或者通过 MRTR 引入明确的人工确认。这是一条设计启发式原则，而非协议硬性能力。

### 在执行前收缩权限（Reduce Authority）

无状态本身并不等同于安全。它虽然消除了隐蔽的会话历史风险，但一个自包含的请求依然可能利用权限过大的 handler 泄露数据或造成不可逆破坏。真正的安全来自于在每一个边界层层收缩权限：

1. **类型化动词（Typed verb）：** 暴露单一受限操作（如 `archive_note`），而不是泛化的 `run` 或 `request` 这类可能衍生非预期能力的工具。
2. **校验参数（Validated arguments）：** 尽可能采用封闭的 schema，拒绝未知字段，对标识符进行单次规范化，限制 payload 大小，并在策略评估前验证目标地址、租户归属与资源所有权。
3. **即时鉴权（Current authorization）：** 将已认证主体与精确的动词、资源、环境及规范化参数绑定。Tool annotations 与 client capabilities 绝不赋予此权限。
4. **绑定动作的审批（Action-bound approval）：** 对于高影响调用，将人工审批与类型化动词及规范化参数的 digest 绑定，并附加主体、过期时间与单次有效策略。任何参数变动都必须重新发起审批。
5. **一等拒绝（First-class refusal）：** 将拒绝、审批过期、用户拒绝和不安全目标视为常规预期结果，不执行任何副作用，绝不能将拒绝降级回退为权限更弱的备选 tool。
6. **脱敏审计证据（Redacted audit evidence）：** 记录请求者、所采用的准入 descriptor 与策略版本、被授权的规范化目标、允许或拒绝的原因，以及是否已开始执行。在日志中记录 digest 或脱敏值而非密钥明文。

每一个环节都在收紧下一组件可执行的权力。最终的处理程序接收到的应当是经过验证的领域命令，而非原始的模型文本附带宽泛的凭证。在 MRTR 重试、任务更新或网关转发调用时，必须完整重走该链路。先前的单次批准绝不会使后续请求自动变成受信任的会话流量。

### 当前与遗留交互路径

在 2026-07-28 规范中，Roots、Sampling 与 Logging 针对新实现已被正式废弃。Gateway 仅可将旧版请求通道代码作为受版本门禁控制的向后兼容路径保留。

切勿围绕“按 session 计数的 sampling 限流器”构建新的防御机制。配额限流应施加于认证主体、签发者、具体资源、tool 以及时间窗口上。对于当下的交互式流程，应全面审查 MRTR 的输入请求与响应。

### 无状态 Transport 检查项

- 在单一 POST 端点接收现代 MCP 报文。
- 对针对该端点的现代 GET 和 DELETE 请求返回 405 Method Not Allowed。
- 不生成也不依赖 `Mcp-Session-Id`。
- 忽略旧版 session 和重放头部，不得将其作为授权输入。
- 对该 POST 请求返回 JSON 或请求级作用域的 SSE。
- 仅在双方明确约定的场景下，使用 `subscriptions/listen` 接收长生命周期的变更通知。

```figure
tp-tool-poisoning
```

## 动手构建

`code/main.py` 实现了一个轻量级的进程内安全网关模型。它对完整 tool descriptor 进行规范化和哈希锁定，报告元数据投毒与名字遮蔽，验证现代请求信封与路由字段，并通过带有 HMAC 签名的 `requestState` 与可注入的共享防重放存储完成两轮带确认的导出流程。

该模型在 HTTP 适配器解析 JSON 请求体和路由头部后启动。它本身不验证 `Content-Type` 或 `Accept`。你可将同一个分发器与第 09 课中完整的 Streamable HTTP 适配器连接，后者强制要求 `Content-Type: application/json` 且 `Accept` 同时包含 `application/json` 与 `text/event-stream`。

运行它：

```bash
cd phases/13-tools-and-protocols/15-mcp-security-tool-poisoning
python3 code/main.py
python3 -m unittest discover code/tests -v
```

示例代码刻意修改了一个 descriptor。静态扫描器与 digest 比对能够独立输出检测结果。随后的导出操作展示了 `input_required` 响应与无状态重试的完整流程。

## 使用它

将代码中的 `SAFE_TOOLS` 替换为你自身批准的 server 规范化快照。快照中切勿包含敏感凭证与密钥。在更新任何 digest 前，必须全面人工审查新增或变动的 descriptor。

在网关层，于服务发现期间执行这套检查，并在正式分发调用前再次执行。缓存虽能减少重复发现的开销，但当 descriptor 发生变更时，缓存的批准状态必须立即失效或过期。

## 交付它

本课交付 `outputs/skill-mcp-threat-model.md`。它提供了一套针对当前协议的威胁建模技能，全面覆盖元数据、路由、capability、授权、MRTR、缓存、registry 以及兼容性边界。

## 课后深练习

1. 将已认证主体与当前的授权决策绑定进密封的 MRTR 状态中，并测试拒绝以不同主体身份发起的重试请求。
2. 将内存防重放存储替换为基于数据库的持久化条件写入（conditional insert），证明两个并发进程无法同时核销同一个 nonce。
3. 在核销 nonce 之后、模拟导出执行之前注入系统故障。定义并测试能够确保安全恢复的事务或幂等性规则。
4. 仅修改某个 tool 的 `inputSchema` 而保持其 description 不变，验证全量 descriptor 锁定机制能否准确捕获该篡改。
5. 增加一项安全策略：当不同主体所查看到的 `tools/list` 存在差异时，禁止进行公共缓存（public caching）。
6. 在网关后方接入一个旧版本 server 模型，将所有握手与 session 逻辑完全隔离在显式的 `2025-11-25` 兼容分支中。

## 关键术语

| 术语 | 含义 |
|------|------|
| 元数据投毒（Metadata poisoning） | 在 tool descriptor 中嵌入恶意提示词指令或欺骗性声明 |
| 恶意篡改（Rug pull） | 针对先前已获审批的 descriptor 进行未授权的静默修改 |
| 名字遮蔽（Tool shadowing） | 由未加限定的重复 tool name 导致的路由歧义与覆盖 |
| 头部不匹配（Header mismatch） | 路由 header 与 JSON-RPC body 内容冲突，触发错误 `-32020` |
| 哈希锁定（Hash pin） | 对经审核批准的完整规范化 descriptor 计算所得的 SHA-256 digest |
| MRTR | 多往返请求模式（Multi Round-Trip Requests），用于 server 主动请求输入并由 client 无状态重试 |
| `requestState` | 往返传递的不透明状态值，必须作为不可信输入进行完整性保护与校验 |
| Capability 声明 | 仅表示协议特性的兼容性声明，绝不代表授权与访问许可 |
| 隐式表单支持 | 空的 `elicitation` capability 对象 `{}`，等同于显式声明支持表单 |
| 完全限定名（Qualified tool name） | 网关层稳定的命名，如 `notes.search`，防止命名冲突 |

## 延伸阅读

- [MCP 安全与信任指南（Security and Trust Guidance）](https://modelcontextprotocol.io/specification/2026-07-28#security-and-trust--safety)
- [多往返请求（Multi Round-Trip Requests）规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [Streamable HTTP 传输协议](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [已废弃特性（Deprecated Features）清单](https://modelcontextprotocol.io/specification/2026-07-28/deprecated)
