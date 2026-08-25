# MCP Security：受污染的 Metadata、Routing 与 MRTR State

> 无状态并不意味着无需信任。它意味着每个请求都会暴露服务器和 gateway 独立验证调用所需的证据。

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 07（MCP server），Phase 13 · 08（MCP client）
**Time:** ~60 分钟

## 学习目标

- 将 Tool 描述、annotation、客户端信息和服务器信息视为不可信数据。
- 检测 metadata poisoning、descriptor 变更和跨服务器名称冲突。
- 验证 2026-07-28 请求 metadata 和 Streamable HTTP routing header。
- 防止 MRTR `requestState` 被篡改，并将确认绑定至准确参数。
- 将授权和速率限制应用于 principal，而不是已移除的协议 session。

## 问题

Model 会读取 Tool 描述，以决定调用什么。router 会读取 Tool 名称，以决定将请求发送到哪里。用户会读取标签，以决定批准什么。一个恶意 descriptor 就能同时攻击这三者。

MCP 官方 security 指南对此说得很直接：除非描述和 annotation 来自可信服务器，否则应将其视为不可信内容。即便如此，部署信任也可能发生变化。服务器更新、软件包被入侵、registry 错误或 gateway 合并，都可能改变 Model 看到的内容。

当前协议也改变了 security 边界。在 2026-07-28 中，不存在核心 handshake，也不存在 transport session。仅使用 `Mcp-Session-Id` 作为 approval、速率限制或审计历史 key 的 security 设计，并不属于当前设计。

## 概念

### 值得检查的七个攻击面

应使用具体清单，而不是含糊地要求保持谨慎。

1. **Metadata poisoning。** 描述中包含与所声明 Tool 行为无关的指令。
2. **Descriptor rug pull。** 已批准的名称、描述、schema 或 annotation 发生变化。
3. **跨服务器 shadowing。** 两个 backend 暴露相同的非限定 Tool 名称，而 routing 在未提示的情况下选择其中一个。
4. **Header 与 body 混淆。** `Mcp-Method` 或 `Mcp-Name` 与 JSON-RPC 请求不一致。
5. **Capability escalation。** peer 声明某项 extension 或客户端功能，而服务器错误地将该声明视为授权。
6. **MRTR state 篡改。** 客户端修改 `requestState`、回答另一个问题，或对不同参数重复使用确认。
7. **供应链 identity 混淆。** 将熟悉的显示名称视为 publisher 或服务器 identity 的证明。

这些攻击面彼此重叠。hash pinning 有助于发现 descriptor 变更，但无法证明第一个 descriptor 是安全的。静态扫描可以捕获明显短语，却无法发现隐晦指令。namespace 能防止一类冲突，却无法阻止恶意的 namespaced server。需要叠加使用多种控制措施。

### 当前请求 envelope 是证据，而不是 identity

每个 2026-07-28 请求都包含：

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

在每个请求中验证 version 和 capability 结构。使用 capability 选择兼容的响应结构。不要将 `clientInfo` 用作经过身份验证的 principal。它由客户端自行报告。

同样的警告也适用于结果 metadata 中的 `io.modelcontextprotocol/serverInfo`。它有助于日志记录和调试，但不是证书、registry 证明或授权决策。

### 在执行策略前验证 routing

对于 `tools/call`，Streamable HTTP 包含：

```text
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.export
```

header method 必须等于 body method。header name 必须等于 `params.name`。如果两者不一致，应在选择 backend、应用 RBAC 或消耗速率限制 Token 之前，以 `-32020` 拒绝请求。

这一顺序消除了一种常见歧义：一个组件根据 body 进行授权，而另一个组件根据 header 执行 routing。

Wire 验证遵循一个确切顺序。首先验证 JSON-RPC 和 metadata 类型，然后比较 header 值与 body，最后检查匹配后的 version 是否受支持。header 不匹配时返回 HTTP 400 和 `-32020`。如果 header 与 body 一致，但使用了不受支持的 version，则返回 HTTP 400 和 `-32022`，其 `data` 必须准确为 `{"supported":["2026-07-28"],"requested":"<actual>"}`。未知 method 返回 HTTP 404 和 `-32601`。

当契约需要结构化恢复信息时，每个 error 对象都包含可选的 `data`。notification 没有 `id`，因此绝不能接收 JSON-RPC success 或 error 响应。已接受的 HTTP notification 返回 202 和空 body。

### Pin 完整 descriptor

仅对描述进行 hash 会遗漏 schema 和 annotation 的变化。对用户已批准的 descriptor 字段进行 canonicalize 和 hash：

```python
normalized = json.dumps(tool, sort_keys=True, separators=(",", ":"))
digest = hashlib.sha256(normalized.encode()).hexdigest()
```

使用 `notes.export` 之类的 qualified key 存储 digest，并在本示例之外同时存储 publisher 证据和批准时间。

每次刷新时：

- 未知 key：隔离并等待审查。
- 相同 key、不同 digest：作为 rug pull 隔离，直到重新批准。
- 重复的非限定名称：要求使用确定性的 namespace。
- 命中 scanner：阻止并审查完整 descriptor。

hash 相等只能证明稳定性，不能证明安全性。一个受污染的 descriptor 即使被完美 pin，仍然是受污染的。

### 静态扫描是一条 tripwire

简单 pattern 可以标记 role tag、指令覆盖、隐藏行为、secret 访问和被掩饰的网络 destination。它们的成本足够低，可以在安装阶段和 CI 中运行。

它们并非语义证明。安全的描述可能在合理的警告中包含被标记的短语，恶意描述也可能避开所有短语。应将 scanner 输出视为审查证据，而不是自动生成的无害评分。

### 合并前使用 namespace

假设两个服务器都暴露 `search`。绝不能让 discovery 顺序决定谁胜出。

```text
notes.search
issues.search
```

qualified name 是公开的 gateway 名称。另行记录 backend mapping。稳定名称使 approval、审计、hash pin 和 `Mcp-Name` routing 都指向同一个对象。

### Capability 是兼容性声明

每个请求中的 `clientCapabilities` 告诉服务器客户端可以处理哪些协议功能。它不会授予客户端访问 Tool、数据或操作的权限。

授权仍然来自已经过身份验证的 principal 和 resource policy。顺序如下：

1. 验证 transport credential。
2. 验证 version、header 和请求结构。
3. 检查 capability 兼容性。
4. 对 principal、Tool、resource 和参数进行授权。
5. 执行操作或请求用户输入。

### 保护无状态 MRTR 确认

会产生实际后果的 Tool 可能需要用户确认。当前 MCP 使用 Multi Round-Trip Requests，而不是服务器到客户端的 callback。

第一次响应：

```json
{
  "resultType": "input_required",
  "inputRequests": {
    "confirm": {
      "method": "elicitation/create",
      "params": {
        "mode": "form",
        "message": "将笔记导出到 archive？",
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

客户端获取输入，并使用新的 JSON-RPC id 重试原始 method：

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

每个 `inputRequests` value 都是包含 `method` 和 `params` 的完整Embedding式请求。它的 key 必须与 `inputResponses` 中对应条目的 key 匹配。form elicitation 使用以对象为根的 `requestedSchema`，并且在服务器请求该功能之前，客户端必须已声明 form elicitation capability。

当前 capability 有两种有效的 form 声明。`{"elicitation":{}}` 隐式支持 form elicitation，而 `{"elicitation":{"form":{}}}` 则显式声明支持。像 `{"elicitation":{"url":{}}}` 这样的仅 URL 声明不支持 form 请求。服务器返回 HTTP 400 和 `-32021`，并且 `data.requiredCapabilities` 等于 `{"elicitation":{"form":{}}}`。

将 `requestState` 视为恶意输入。对其进行签名或加密并加以验证，同时将其绑定至 method、Tool、准确参数、用途、过期时间、principal，以及在需要防止 replay 时使用的一次性 nonce。课程代码使用 HMAC 和严格参数匹配，使这一边界清晰可见。

nonce ledger 不得存放在单个 gateway 对象中。可运行 Model 注入了一个有界且会按 TTL 清理的 replay store，可供多个 gateway instance 共享。其原子 claim 是执行边界：仅经过验证的接受或明确的终止性拒绝会消耗 state。格式错误的响应或 `cancel` 不会执行任何操作，并且在过期前仍可重试。生产 fleet 需要在共享的 durable storage 中实现相同的条件式 claim。

不要将隐藏的确认 Context 存储在协议 session 中。任何服务器 instance 都应能够验证重试请求。

### 高风险调用的二项规则

从三个维度对调用进行分类：

- 它会使用不可信输入。
- 它可以访问敏感数据。
- 它会造成有实际后果的外部操作。

单个自动化步骤不应同时具备以上三项。应拆分步骤、降低权限，或通过 MRTR 请求显式用户输入。这是一项设计 heuristic，而不是协议 capability。

### 执行前缩减 authority

无状态本身并不等于安全。它消除了隐藏的协议历史，但一个自包含请求仍然可以要求权限过大的 handler 泄露数据或执行不可逆变更。安全性来自在每个边界缩减 authority：

1. **Typed verb。** 暴露一个有界操作，例如 `archive_note`，不要暴露能够表达无关权限的通用 `run` 或 `request` Tool。
2. **已验证的参数。** 在可行情况下使用封闭 schema，拒绝未知字段，只执行一次 identifier normalization，限制大小，并在策略评估前验证 destination、tenant 和 resource ownership。
3. **当前授权。** 将经过身份验证的 principal 绑定至准确的 verb、resource、environment 和 normalized arguments。Tool annotation 和客户端 capability 不会授予这种 authority。
4. **与操作绑定的 approval。** 对于会产生实际后果的调用，将 approval 绑定至 typed verb 和 normalized arguments 的 digest，同时绑定 principal、过期时间和一次性策略。任何字段发生变化，都需要重新决策。
5. **一等 refusal。** 将 deny、approval 过期、用户拒绝和不安全 destination 建模为不会产生 side effect 的普通结果。不要将 refusal 转换为权限更弱的 fallback Tool。
6. **经过脱敏的审计证据。** 记录请求者、使用的已准入 descriptor 和策略 version、获得授权的 normalized target、允许或拒绝该决策的原因，以及执行是否已经开始。存储 digest 或脱敏值，不要存储 secret。

每个步骤都会缩小下一个组件可以执行的操作范围。最终 handler 应接收已经验证的 domain command，而不是原始 Model 文本和宽泛的 credential。在 MRTR 重试、任务更新或经 gateway 转发的调用中，应重复执行整条链路。先前的 approval 不会使之后的请求变成受信任的 session traffic。

### 当前和旧版交互路径

对于新的 2026-07-28 实现，Roots、Sampling 和 Logging 已被弃用。gateway 只能将旧版请求 channel 代码保留为由 version 控制的兼容路径。

不要围绕按 session 计算的 sampling limiter 构建新防御。应按照经过身份验证的 principal、issuer、resource、Tool 和时间窗口应用 quota。对于当前交互式工作，应检查 MRTR input request 和 response。

### 无状态 transport 检查

- 在单一 POST endpoint 接受现代 MCP 消息。
- 对现代 GET 和 DELETE 返回 405。
- 不要生成或依赖 `Mcp-Session-Id`。
- 不要将旧版 session 和 replay header 作为 authority 输入。
- 针对该 POST 返回 JSON 或请求范围内的 SSE。
- 仅对选择启用的长期变更 notification 使用 `subscriptions/listen`。

```figure
tp-tool-poisoning
```

## Build It

`code/main.py` 实现了一个小型进程内 security gateway Model。它会对完整 Tool descriptor 进行 canonicalize 和 pin，报告 metadata poisoning 和 shadowing，验证现代请求 envelope 与 routing 值，并使用已签名的 `requestState` 和注入的共享 replay store 执行两轮确认式导出。

该 Model 在 HTTP adapter 已解析 JSON body 和 routing header 后开始工作。它不验证 `Content-Type` 或 `Accept`。请将同一个 dispatcher 连接至 Lesson 09 的完整 Streamable HTTP adapter；该 adapter 要求 `Content-Type: application/json`，并要求 `Accept` 值同时包含 `application/json` 和 `text/event-stream`。

运行：

```bash
cd phases/13-tools-and-protocols/15-mcp-security-tool-poisoning
python3 code/main.py
python3 -m unittest discover code/tests -v
```

该示例会有意修改一个 descriptor。scanner 和 digest 比较会产生相互独立的发现。随后，导出流程会演示 `input_required` 响应和无状态重试。

## Use It

将 `SAFE_TOOLS` 替换为从你自己已批准服务器获取的 normalized snapshot。不要在 snapshot 中包含 credential 和 secret。更新 digest 前，审查每个新增或变更的 descriptor。

在 gateway 中，应在 discovery 期间和 dispatch 之前运行相同检查。缓存可以减少 discovery 工作量，但已缓存的 approval 必须过期，或者在 descriptor 发生变化时失效。

## Ship It

本课程交付 `outputs/skill-mcp-threat-model.md`。它会针对 metadata、routing、capability、授权、MRTR、缓存、registry 和兼容性边界生成符合当前协议的 threat model。

## 练习

1. 将经过身份验证的 principal 和当前授权决策绑定至 sealed MRTR state，然后拒绝来自不同 principal 的重试。
2. 将内存 replay store 替换为持久化的条件式插入，并证明两个进程无法同时 claim 同一个 nonce。
3. 在 claim replay 后、模拟导出前注入失败。定义并测试可以确保安全恢复的 transaction 或 idempotency 规则。
4. 修改 Tool 的 `inputSchema`，但不修改其描述。确认完整 descriptor pinning 可以检测到该变化。
5. 添加一项策略：当 `tools/list` 随 principal 不同时，拒绝 public caching。
6. 在 gateway 后方对旧版服务器进行建模。将所有 handshake 和 session 行为放入显式的 `2025-11-25` 兼容分支。

## 关键术语

| 术语 | 含义 |
|------|------|
| Metadata poisoning | Embedding Tool descriptor 中的指令或欺骗性声明 |
| Rug pull | 对先前已批准 descriptor 的变更 |
| Tool shadowing | 由重复的非限定名称导致的 routing 歧义 |
| Header mismatch | Routing header 与 JSON-RPC body 不一致，error 为 `-32020` |
| Hash pin | 完整已批准 descriptor 的 digest |
| MRTR | 用于服务器请求输入的无状态响应和重试模式 |
| `requestState` | 必须被视为不可信输入的不透明往返值 |
| Capability declaration | 协议兼容性声明，而不是授权 |
| Implicit form support | 空的 `elicitation` capability 对象，等同于支持 form |
| Qualified tool name | 类似 `notes.search` 的稳定 gateway 名称 |

## 延伸阅读

- [MCP security 与信任指南](https://modelcontextprotocol.io/specification/2026-07-28#security-and-trust--safety)
- [Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [Streamable HTTP transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [已弃用功能](https://modelcontextprotocol.io/specification/2026-07-28/deprecated)
