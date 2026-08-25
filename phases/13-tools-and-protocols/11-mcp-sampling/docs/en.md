# MCP Model 输入：Sampling 迁移与无状态 MRTR

> MCP 2026-07-28 不建议在新设计中使用 Sampling，并移除了从 server 到客户端的请求通道。如果现有工作流仍需要客户端的 Model，server 会返回 `input_required` 结果，客户端则携带 Model 输出重试原始请求。这样，推理循环在协议层变得显式、有界且无状态。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07（MCP server），Phase 13 · 10（Resource 与 Prompt）
**Time:** ~75 分钟

## 学习目标

- 解释 MCP 2026-07-28 为何弃用 Sampling，并为新 server 选择直接 Model 集成这一默认方案。
- 实现通过 Multi Round-Trip Requests（MRTR）传递 `sampling/createMessage` 的兼容工作流。
- 在每个请求的 `_meta` object 中放入协议版本和客户端 capabilities。
- 返回 `resultType: "input_required"`，并使用新的 JSON-RPC id 重试原始 method。
- 对 `requestState` 进行完整性保护，并将其绑定到 principal、method、参数和过期时间。
- 通过 capability 检查、审批、响应验证和轮次限制，对 Model 辅助循环设置边界。

## 协议之前的决策

像 `summarize_repo` 这样的 Tool 需要完成两类工作：

1. 确定性工作：列出文件、读取允许访问的文件、验证路径并汇集内容。
2. Model 工作：选择具有代表性的文件并综合生成摘要。

现在有两种有效架构。

### 新 server：直接与 Model provider 集成

这是目前的默认方案。Server 负责 Model 选择、凭证、预算、重试和可观测性。它向 MCP 客户端返回一个普通的 `tools/call` 结果。

当 server 已经是托管服务，或可预测的 Model 行为比使用主机的 Model 更重要时，选择此方案。

### 现有 Sampling 工作流：将其迁移到 MRTR

Sampling 在弃用窗口期间仍然存在。面向 2026-07-28 的 server 无法向客户端实时回传 `sampling/createMessage` 请求。它会改为将该请求Embedding `InputRequiredResult`。

只有当使用客户端的 Model 和凭证确实是产品需求时，才选择此兼容路径。请记录移除计划，因为新的实现不应采用已弃用的 Sampling。

## 无状态契约

2026 年 7 月版协议没有 `initialize` 交换、没有 `notifications/initialized`，也没有 `Mcp-Session-Id`。每个请求都会携带过去存放在 handshake 中的信息：

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

Server 会验证每个请求的版本。缺少版本或版本不是 string 属于 invalid params，错误码为 `-32602`。不受支持的 string 会返回 `-32022`，并包含精确数据 `{"supported":["2026-07-28"],"requested":"<client version>"}`。缺少 Sampling capability 会返回 `-32021`，其中 `data.requiredCapabilities` 设置为 `{"sampling":{}}`。

不含 JSON-RPC `id` 的 envelope 是 notification。接收方可以处理它，但不会发出成功响应或错误响应。Streamable HTTP adapter 对接受的 notification 返回不含 body 的 `202 Accepted`。

Server 还会实现 `server/discover`，包含准确的 `supportedVersions` key、capabilities、`ttlMs` 和 `cacheScope`，使客户端能够在调用 Tool 之前了解并缓存 server 契约。由于 discovery 声明了 `tools`，server 还会实现必需的 `tools/list`。其确定性的 `summarize_repo` descriptor 包含有效的 object `inputSchema`、`resultType: "complete"`、server 身份元数据和公共缓存提示。

每个成功的现代结果都有一个 discriminator：

- `resultType: "complete"` 表示操作已经完成。
- `resultType: "input_required"` 表示客户端必须满足Embedding的请求并重试。
- Extension 可以定义其他结果类型。Tasks extension 会在第 13 课中添加 `"task"`。

## 一轮 MRTR

Server 在处理请求时无法调用客户端，而是返回以下结果：

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

客户端验证自身是否支持 Sampling，应用自己的审批和 Model 策略，并获得 Model 响应。然后，它使用不同的 JSON-RPC id 发送一个新请求：

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

此次重试不是 protocol session 的延续。它是一个新请求，会重复原始 method 和参数，仅添加当前轮次的 `inputResponses`，并逐字节回显 `requestState`。

只有 `tools/call`、`prompts/get` 和 `resources/read` 允许使用 MRTR。Server 不得从无关 method 返回 `input_required`。

## 多轮状态

本课需要两次 Model 调用：

1. `pick_files` 返回一个 JSON array。
2. `summary` 返回最终文本。

每次重试只携带该轮次的响应。因此，server 会把阶段和经过验证的中间数据放入下一个 `requestState`。

应将该值视为由攻击者控制。仅对原始阶段名称进行签名是不够的。请将状态绑定到：

- 已认证的 principal，而不是自行报告的 `clientInfo`；
- 发起请求的 method；
- 原始参数的 digest；
- 较短的过期时间；
- 当前阶段和经过验证的中间值。

不要求保密时使用 HMAC。当客户端不得读取状态时，使用 authenticated encryption。对于错误的签名、已过期的值、发生变化的 principal 或发生变化的参数，使用 `-32602` 拒绝。

客户端不得解析或修改 `requestState`。它唯一的任务是在重试时回显完全相同的 string。

## Model Preferences 是提示

`costPriority`、`speedPriority` 和 `intelligencePriority` 是相互独立的偏好。它们不是 Probability Distribution，也不需要总和为一。客户端可以忽略它们，因为 Model 策略由客户端负责。

如果维护旧版 Sampling 流程，请将 `includeContext` 保持为 `"none"`。其他 Context mode 会增加泄露风险，而且它们本身也已弃用。请在请求中传递最少量的显式 Context。

## 安全不变量

客户端是Embedding式 Sampling 请求的信任边界。

- 当策略要求审批时，向用户展示 server 正在要求 Model 执行什么操作。
- 限制 MRTR 轮数。否则，恶意 server 可以制造消耗 Model 费用的循环。
- 在将每个 Sampling 响应用作文件名、URL 或 Tool 输入之前，对其进行验证。
- 限制每轮的字节数和 Token 数。
- 拒绝当前客户端 capabilities 中未声明的输入请求。
- 不要让 Model 输出参与授权决策。
- 记录发起请求的 method 和输入请求 key，但不要记录敏感的 Prompt 内容。

`clientInfo` 和 `serverInfo` 是用于显示和诊断的元数据。绝不能将它们用作已认证身份。

```figure
t3-sampling-flip
```

## 构建它

`code/main.py` 不使用任何第三方 package，实现完整的两轮流程：

- `server/discover` 返回 `supportedVersions`、声明 Tool 支持并返回缓存提示。
- `tools/list` 返回确定且可缓存的 `summarize_repo` descriptor，其中包含 object input schema。
- `tools/call` 验证每个请求的元数据。
- 第一个结果Embedding用于选择文件的 `sampling/createMessage`。
- 第一次重试会验证 Model 结果并Embedding第二个请求。
- 受 HMAC 保护的 `requestState` 在相互独立的请求之间传递阶段。
- 最终结果使用 `resultType: "complete"`。

虚拟主机 Model 使示例具有确定性。连接真实主机时，只替换 `fake_host_model`。Server 端状态机应保持确定性和可测试性。

## 使用它

从 repository 根目录运行：

```bash
cd phases/13-tools-and-protocols/11-mcp-sampling/code
python3 main.py
python3 -m unittest discover tests -v
```

预期检查点：

- Discovery 返回带有 `ttlMs` 和 `cacheScope` 的完整结果。
- Tool discovery 返回相同且已排序的 descriptor，其中包含 `resultType`、server 身份和缓存提示。
- 缺少 capabilities 和使用不受支持的版本时，分别使用准确的 `-32021` 和 `-32022` 错误数据。
- 不含 id 的 notification 不会产生 JSON-RPC 响应。
- 请求 id 为 `[1, 2, 3]`，证明每轮 MRTR 都相互独立。
- 前两个结果为 `input_required`。
- 最终结果为 `complete`，并包含选定的文件及摘要。
- 在重试时更改原始参数会导致请求状态检查失败。

## 交付它

`outputs/skill-sampling-loop-designer.md` 现在是一个迁移规划器。它会先判断是否应移除 Sampling，转而采用直接 Model 集成。如果确实需要兼容，它会生成 MRTR 轮次、状态绑定、capability gate、预算、验证和移除计划。

## 练习

1. 将文件选择响应改为无效 JSON。确认 server 返回 `-32602`，而不是信任 Model 输出。
2. 在第一次调用和重试之间更改 `audience`。解释为什么密封状态能够阻止跨请求复用。
3. 添加第三轮，让主机评审摘要。将之前的摘要放入已签名状态，并将整个流程限制为三轮。
4. 通过使用 server 自有的 Model adapter 替换虚拟主机 callback 来移除 Sampling。列出哪些审批、计费和可观测性责任会转移到 server。
5. 使用超过截止时间一秒的状态值添加过期测试。

## 关键术语

| 术语 | 在 2026-07-28 中的含义 |
|------|------------------------|
| Sampling | 已弃用的功能，用于请求客户端的 Model 生成 completion |
| MRTR | 在请求期间需要客户端输入时使用的无状态重试模式 |
| `InputRequiredResult` | 带有 `resultType: "input_required"` 的结果 |
| `inputRequests` | 由 server 分配的Embedding式 elicitation、sampling 或 roots 请求映射 |
| `inputResponses` | 当前轮次的客户端结果，key 与 `inputRequests` 对应 |
| `requestState` | 客户端原样回显并由 server 验证的不透明 server 状态 |
| `resultType` | 现代 MCP 结果必需的 discriminator |
| Direct model integration | 推荐用于需要 Model Inference 的新 server 的替代方案 |
| Capability gate | 防止发送客户端未声明的Embedding式请求的规则 |
| Loop budget | 操作所允许的最大轮数、Token、字节数、时间和费用 |

## 旧版兼容性

固定使用 2025-11-25 的客户端仍可通过实时连接使用旧版 server 发起的 `sampling/createMessage` 流程。仅在特定版本的 adapter 中保留该行为。不要让依赖 session 的路径成为 2026-07-28 server 的架构。

官方 SDK 可以为旧版对端转换现代 `input_required` handler。该 shim 是兼容性边界，并不意味着可以添加新的依赖 session 的逻辑。

## 延伸阅读

- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP Sampling deprecation](https://modelcontextprotocol.io/seps/2577-deprecate-roots-sampling-and-logging)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
