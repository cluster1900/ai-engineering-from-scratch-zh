# MCP 模型输入：Sampling 迁移与无状态 MRTR

> MCP 2026-07-28 规范弃用了面向新设计的 Sampling 特性，并移除了 server 向 client 发送反向请求的通道。若现有工作流仍需使用 client 端的模型，server 会返回 `input_required` 结果，由 client 携带模型输出重试原始请求。推理循环在协议层由此转变为显式、有界且无状态的机制。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 10 (resources and prompts)
**Time:** ~75 minutes

## 学习目标

- 解释为何 MCP 2026-07-28 弃用了 Sampling，并为新构建的 server 选用直接集成模型（direct model integration）的默认架构。
- 实现一套兼容工作流，通过多轮往返请求（Multi Round-Trip Requests, MRTR）承载 `sampling/createMessage`。
- 在每个请求的 `_meta` 对象中注入协议版本和客户端 capabilities。
- 返回 `resultType: "input_required"`，并使用全新的 JSON-RPC id 重试原始方法。
- 对 `requestState` 进行完整性保护（integrity-protected），并将其绑定到主体（principal）、方法、参数及过期时间。
- 通过 capability 校验、人工批准、响应验证和轮次上限，对模型辅助循环进行严格约束。

## 在协议设计之前的架构决策

形如 `summarize_repo` 的 tool 通常需要两类工作：

1. 确定性工作：列出文件、读取允许访问的文件、校验路径以及组装内容。
2. 模型工作：挑选代表性文件并综合生成摘要。

现在你有两种合法的架构选择。

### 新建 Server：直接集成模型提供方

这是当前的默认推荐做法。Server 端自行管理模型选择、凭据配置、调用预算、重试策略以及可观测性。它直接向 MCP client 返回普通的 `tools/call` 结果。

当 server 本身就是一个托管服务，或者可预测的模型表现比借用 host 的模型更重要时，请选用此方案。

### 现有 Sampling 工作流：迁移至 MRTR

在弃用过渡期内，Sampling 依然存在。面向 2026-07-28 规范的 server 无法再向 client 发送实时的 `sampling/createMessage` 反向请求。取而代之的是，它将该请求内嵌在 `InputRequiredResult` 中返回。

仅当使用 client 端的模型和凭据是明确的产品硬性需求时，才选择此兼容路径。同时应制定移除计划，因为新实现不应采纳已被弃用的 Sampling。

## 无状态契约

2026 年 7 月的协议规范移除了 `initialize` 交互握手、`notifications/initialized` 以及 `Mcp-Session-Id`。过去保存在握手中的信息，现在直接由每个请求自行携带：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "summarize_repo",
    "arguments": {"audience": "developer"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {"sampling": {}},
      "io.modelcontextprotocol/clientInfo": {
        "name": "lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

Server 会在每个请求上校验协议版本。版本缺失或非字符串类型属于无效参数，返回 `-32602`。不受支持的版本字符串返回 `-32022`，并携带精确的 data 数据 `{"supported":["2026-07-28"],"requested":"<client version>"}`。若缺失 Sampling capability 则返回 `-32021`，并将 `data.requiredCapabilities` 设为 `{"sampling":{}}`。

没有 JSON-RPC `id` 的信封属于 notification（通知）。接收方可以处理它，但既不发出成功响应也不发出错误响应。在 Streamable HTTP 适配层中，已接受的 notification 会返回无正文的 `202 Accepted`。

Server 还必须实现带有准确 `supportedVersions` 键、capabilities、`ttlMs` 和 `cacheScope` 的 `server/discover` 方法，以便 client 在调用 tool 之前能够获知并缓存 server 的契约。由于 discovery 声明了 `tools`，server 同样必须实现强制性的 `tools/list`。其确定性的 `summarize_repo` 描述符包含合法的 object 类型 `inputSchema`、`resultType: "complete"`、server 身份元数据以及 public 缓存提示。

每个成功的现代协议返回结果都包含一个判别器（discriminator）：

- `resultType: "complete"` 表示操作已全部完成。
- `resultType: "input_required"` 表示 client 必须履行内嵌的输入请求并进行重试。
- 扩展规范可以定义额外的结果类型，例如在第 13 课中 Tasks 扩展增加了 `"task"`。

## 单轮 MRTR 交互流程

Server 在处理请求期间无法调用 client。它转而返回如下结果：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "pick_files": {
        "method": "sampling/createMessage",
        "params": {
          "messages": [
            {
              "role": "user",
              "content": {
                "type": "text",
                "text": "Choose three representative files and return a JSON array."
              }
            }
          ],
          "systemPrompt": "Return only the requested value.",
          "modelPreferences": {
            "costPriority": 0.8,
            "intelligencePriority": 0.2
          },
          "maxTokens": 400
        }
      }
    },
    "requestState": "opaque-integrity-protected-value"
  }
}
```

Client 验证自身支持 Sampling，应用其审核批准与模型策略，并获取模型响应。随后，client 发送一个带有全新 JSON-RPC id 的新请求：

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "summarize_repo",
    "arguments": {"audience": "developer"},
    "inputResponses": {
      "pick_files": {
        "role": "assistant",
        "content": {
          "type": "text",
          "text": "[\"README.md\", \"server.py\", \"docs/intro.md\"]"
        },
        "model": "host-model",
        "stopReason": "endTurn"
      }
    },
    "requestState": "opaque-integrity-protected-value",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {"sampling": {}}
    }
  }
}
```

这次重试并非协议会话的延续。它是一个全新的请求：重复原始的方法与参数，仅附加当前轮次的 `inputResponses`，并原封不动地逐字节回显 `requestState`。

MRTR 仅允许出现在 `tools/call`、`prompts/get` 和 `resources/read` 中。Server 绝不能从无关方法中返回 `input_required`。

## 多轮状态管理

本课需要两次模型调用：

1. `pick_files` 返回一个 JSON 数组。
2. `summary` 返回最终的摘要文字。

由于每次重试仅携带该轮的响应，server 需要将当前的阶段（phase）以及校验通过的中间数据放入下一个 `requestState` 中。

请将该值视为可能被攻击者控制的数据。仅对阶段名称进行简单签名是不够的。必须将状态绑定到：

- 经过鉴权的主体（authenticated principal），而非自行声明的 `clientInfo`；
- 发起调用的原始方法；
- 原始参数的摘要（digest）；
- 较短的过期时间；
- 当前阶段以及经过校验的中间值。

在不需要机密性时可以使用 HMAC。当 client 绝对不能读取状态内容时，请使用经过鉴权的加密（authenticated encryption）。遇到签名错误、状态过期、主体变更或参数变动时，直接返回 `-32602`。

Client 绝不能解析或篡改 `requestState`。它的唯一职责就是在重试时原样回传该字符串。

## 模型偏好仅为参考提示

`costPriority`、`speedPriority` 与 `intelligencePriority` 是相互独立的偏好设置。它们不是概率分布，总和也不需要为 1。Client 拥有对模型策略的绝对控制权，因此完全可以忽略这些偏好。

如果你仍在维护旧版 Sampling 流程，请将 `includeContext` 保持为 `"none"`。其它上下文模式会增加泄露风险，且本身已被弃用。请在请求中仅传递显式的最小上下文。

## 安全不变量

对于内嵌的 Sampling 请求，client 是唯一的信任边界：

- 当策略要求人工批准时，向用户清晰展示 server 正在要求模型执行什么操作。
- 限制 MRTR 轮次上限。否则恶意 server 可能会构造无休止的模型消费循环。
- 在将 sampling 响应作为文件名、URL 或 tool 输入使用之前，对其进行严格校验。
- 限制每轮往返的字节数和 token 数。
- 拒绝在当前 client capabilities 中未声明的输入请求。
- 避免让模型输出来决定授权鉴权逻辑。
- 记录发起的方法及输入请求 key，同时避免在日志中打入敏感的 prompt 内容。

`clientInfo` 和 `serverInfo` 仅用于展示与诊断元数据。绝不能将二者用作鉴权凭证。

```figure
t3-sampling-flip
```

## 手写实现

`code/main.py` 不依赖任何第三方包，完整实现了双轮往返流程：

- `server/discover` 返回 `supportedVersions`，声明 tool 支持，并返回缓存提示。
- `tools/list` 返回具有对象输入 schema 的、确定性且可缓存的 `summarize_repo` 描述符。
- `tools/call` 校验每个请求的元数据。
- 第一个结果内嵌用于文件选择的 `sampling/createMessage`。
- 第一次重试校验模型结果并内嵌第二个请求。
- 受 HMAC 保护的 `requestState` 在独立请求之间安全传递执行阶段。
- 最终结果使用 `resultType: "complete"`。

模拟的 host 模型保证了示例的确定性。当接入真实 host 时，仅需替换 `fake_host_model`。Server 侧的状态机应始终保持确定性并易于测试。

## 使用与运行

在仓库根目录下运行：

```bash
cd phases/13-tools-and-protocols/11-mcp-sampling/code
python3 main.py
python3 -m unittest discover tests -v
```

预期检查点：

- Discovery 返回带有 `ttlMs` 和 `cacheScope` 的 complete 结果。
- Tool discovery 返回排序相同的描述符，带有 `resultType`、server 身份与缓存提示。
- 缺失 capability 与不支持的版本分别返回精准的 `-32021` 与 `-32022` 错误数据。
- 没有 id 的 notification 不产生任何 JSON-RPC 响应。
- 请求 id 依次为 `[1, 2, 3]`，证明每个 MRTR 轮次均完全独立。
- 前两个结果类型为 `input_required`。
- 最终结果类型为 `complete`，并包含选出的文件以及最终摘要。
- 在重试时篡改原始参数会导致 request-state 校验失败。

## 交付产物

`outputs/skill-sampling-loop-designer.md` 现已升级为迁移规划器。它首先决策是否应废弃 Sampling 改用直接模型集成。若必须保留兼容性，它会生成 MRTR 交互轮次、状态绑定、capability 门禁、预算控制、数据校验以及平稳退役方案。

## 课后练习

1. 将文件选择的响应修改为无效的 JSON 字符串。确认 server 会返回 `-32602` 而不是盲目信任模型输出。
2. 在初次调用与重试调用之间修改 `audience` 参数。解释为什么封印后的状态能够阻止跨请求复用。
3. 增加第三轮交互，要求 host 对摘要进行评审批判。将先前的摘要保存在签名状态中，并将整个流程严格限制为最多三轮。
4. 彻底移除 Sampling：将模拟的 host 回调替换为 server 自持的模型适配器。列出此时有哪些批准、计费和可观测性职责转移到了 server 端。
5. 添加一个过期测试：传入一个已超过截止期限 1 秒的状态值，验证校验失败。

## 关键术语

| 术语 | 2026-07-28 中的含义 |
|------|------------------------|
| Sampling | 已弃用特性，用于请求 client 端的模型执行文本补全 |
| MRTR | 多轮往返请求（Multi Round-Trip Requests），用于在请求中获取 client 输入的无状态重试模式 |
| `InputRequiredResult` | 带有 `resultType: "input_required"` 的结果对象 |
| `inputRequests` | Server 分配的映射表，包含内嵌的 elicitation、sampling 或 roots 请求 |
| `inputResponses` | Client 在当前轮次提交的响应，键名与 `inputRequests` 一一对应 |
| `requestState` | 不透明的 server 状态字符串，由 client 原样回显并由 server 校验完整性 |
| `resultType` | 现代 MCP 返回结果中必须包含的类型判别器 |
| 直接模型集成（Direct model integration） | 新建 server 需要模型推理时的官方推荐替代方案 |
| Capability 门禁（Capability gate） | 防止向未声明相应支持的 client 发送内嵌请求的安全规则 |
| 循环预算（Loop budget） | 本次操作允许的最大轮次、token 数、字节数、执行时长以及花费上限 |

## 旧版兼容性

固定在 2025-11-25 版本的 client 可能仍会在存活连接上使用旧式的 server 发起 `sampling/createMessage` 流程。请将该行为严格隔离在版本专用的适配器中。切勿将有会话路径作为 2026-07-28 server 的基础架构。

官方 SDK 可以将现代的 `input_required` 处理程序转换为适配旧版对端的通信。这种垫片（shim）是兼容性边界，绝不意味着允许在此添加新的依赖会话的逻辑。

## 延伸阅读

- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP Sampling deprecation](https://modelcontextprotocol.io/seps/2577-deprecate-roots-sampling-and-logging)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
