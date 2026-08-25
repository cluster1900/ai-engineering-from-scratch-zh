# 显式范围与无状态 Elicitation

> Roots 在 MCP 2026-07-28 中已被弃用，而且从来都不是安全 sandbox。应将范围放入可见的 Tool arguments 或资源 URI，在 server 上对其进行授权，并在 Tool 确实需要用户输入时使用 MRTR。用户可以看到决策，Model 可以看到句柄，任何 server 实例都可以处理重试。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07（MCP server），Phase 13 · 11（无状态 MRTR）
**Time:** 约 60 分钟

## 学习目标

- 使用显式工作区参数、资源 URI 或 server 配置替代已弃用的 Roots。
- 区分范围提示与授权、路径包含性检查和操作系统 sandbox。
- 通过 MRTR `input_required` 结果交付 form mode 的 `elicitation/create`。
- 在每个请求的客户端 capabilities 中声明 Elicitation 支持，并拒绝不受支持的 mode。
- 将 `accept`、`decline` 和 `cancel` 作为不同结果进行验证。
- 将破坏性操作的确认绑定到经过身份验证的主体、原始 arguments、候选集合和有效期。

## 两个看似相似的问题

一个笔记 Tool 收到以下请求：“删除旧的 TPS 报告。”

server 必须回答两个不同的问题。

1. 此操作可以影响哪个工作区？
2. 用户指的是三个匹配笔记中的哪一个？

第一个问题涉及范围和授权。第二个问题涉及交互式消歧。混淆二者会导致危险的设计，例如把客户端提供的文件夹当作调用者有权删除其中所有内容的证明。

## Roots 是一个迁移界面

早期 MCP 修订版允许客户端声明 Roots，并在列表发生变化时通知 server。Roots 是信息性指引。它们不会限制 server 进程可以读取的内容，不会为调用者授权，也不会创建操作系统 sandbox。

MCP 2026-07-28 已针对新设计弃用 `roots/list` 和 `notifications/roots/list_changed`。优先使用以下显式替代方案之一：

- 当每次调用的范围不同时，使用 `workspaceUri` 或 `directory` Tool argument。
- 当操作已经以某项资源为目标时，使用资源 URI。
- 当一个部署只拥有一个固定工作区时，使用 server 配置。
- 当代码在技术上必须无法越界时，使用进程 sandbox 或受限文件系统。

如果现有的 2026-07-28 集成在弃用过渡期内仍需要 `roots/list`，server 应将其Embedding MRTR `inputRequests`。它不得发送实时反向请求。这是一个迁移 adapter；新的 handler 应接受显式范围。

Model 可以看到并重复显式句柄。隐藏的 transport-session 范围更难检查、重放、审计和路由。

### 三层规则

显式 URI 本身仍然不能授权。应强制执行以下三层检查：

1. **授权：** 这个经过身份验证的主体是否被允许使用此工作区？
2. **包含性：** 规范化后的目标 URI 是否仍处于已授权工作区边界内？
3. **Sandbox：** 即使 server 遭到入侵，操作系统是否仍能阻止它越界？

可运行的 server 会维护已授权工作区 URI 的 allowlist，对 percent-encoded 路径进行规范化，检查真实的路径组件边界，并在删除前立即重新检查包含性。

简单的字符串前缀检查是错误的：

```text
allowed:   file:///work/notes
attacker:  file:///work/notes-evil/secret.md
traversal: file:///work/notes/%2e%2e/private.md
```

这两个恶意路径都以具有误导性的字符串开头。应先进行规范化，再比较路径组件。生产环境中的文件系统 server 还必须防范 symbolic-link race 和平台特定的路径语义。

## Elicitation 仍然存在，但交付方式已经改变

Elicitation 是当前用于在 `tools/call`、`prompts/get` 或 `resources/read` 期间收集用户输入的客户端功能。method 名称仍为 `elicitation/create`。改变的是线路流程的方向。

2026-07-28 server 不会发送反向 JSON-RPC 请求。它会返回 `InputRequiredResult`：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "delete_choice": {
        "method": "elicitation/create",
        "params": {
          "mode": "form",
          "message": "Choose one matching note and confirm deletion.",
          "requestedSchema": {
            "type": "object",
            "properties": {
              "note_id": {
                "type": "string",
                "enum": ["note-3", "note-7", "note-14"]
              },
              "confirm": {"type": "boolean"}
            },
            "required": ["note_id", "confirm"]
          }
        }
      }
    },
    "requestState": "integrity-protected-delete-state"
  }
}
```

host 会渲染表单。用户可以接受、明确拒绝或关闭表单。随后，客户端使用新的 id 重试原始 `tools/call`：

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "notes_delete",
    "arguments": {
      "workspaceUri": "file:///Users/alice/Documents/Notes",
      "title": "TPS report"
    },
    "inputResponses": {
      "delete_choice": {
        "action": "accept",
        "content": {"note_id": "note-14", "confirm": true}
      }
    },
    "requestState": "integrity-protected-delete-state",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "elicitation": {"form": {}}
      }
    }
  }
}
```

两次调用之间不存在协议 session。server 会验证原样返回的状态，根据预期 schema 验证响应，检查所选笔记是否位于已签名的候选集合中，重新授权工作区，再次检查包含性，然后执行删除。

## Capability 协商针对每个请求进行

支持 form mode Elicitation 的客户端应声明：

```json
{
  "io.modelcontextprotocol/clientCapabilities": {
    "elicitation": {"form": {}}
  }
}
```

为兼容起见，空的 Elicitation capability，即 `"elicitation": {}`，仍等同于仅支持 form。显式的 `"elicitation": {"form": {}}` 同样支持 form mode。仅声明 URL 的 `"elicitation": {"url": {}}` 则不支持。即使之前的请求声明过某种 mode，server 也不得Embedding当前请求 capabilities 中不存在的 mode。

每个请求还应携带 `io.modelcontextprotocol/protocolVersion`。版本缺失或不是字符串时返回 `-32602`。不受支持的字符串版本应返回 `-32022`，并提供准确的 `supported` 和 `requested` 数据。缺少 Elicitation 支持或仅支持 URL 时，应返回 `-32021`，并将 `data.requiredCapabilities` 设置为 `{"elicitation":{"form":{}}}`。

没有 JSON-RPC `id` 的封装是通知。处理它时不要发送 JSON-RPC 成功或错误响应。在 Streamable HTTP 上，通过接受的通知会收到无正文的 `202 Accepted`。

应包含 `clientInfo` 以便诊断，但它是自行报告的信息，不能用于在授权过程中识别用户。

server 实现 `server/discover`，并返回 `supportedVersions`、capabilities、`ttlMs` 和 `cacheScope`，同时设置 `resultType: "complete"`。这一现代设计不会声明 Roots。由于它声明了 Tool，因此也必须实现强制性的 `tools/list`。该结果会返回确定性的 `notes_delete` 描述符、有效的 object `inputSchema`、server 身份元数据和公共缓存提示。

## Form Mode

Form mode 使用为可用对话框设计的受限 JSON Schema。根节点是 object，其 properties 是扁平的 primitive 字段或受支持的 enum 数组。深层嵌套的 object 和通用文档 schema 不适合确认对话框。

Form mode 适用于：

- 从多个候选项中选择一个；
- 确认破坏性操作；
- 收集非敏感偏好；
- 收集少量必须由用户而非 Model 决定的值。

不要使用 form mode 收集密码、API key、access token 或支付凭据。这些敏感信息会经过 MCP 客户端，并可能进入日志或 Model Context。

server 会再次验证返回的内容。客户端表单验证能够改善 UX，但不会建立信任。

## URL Mode

URL mode 会发送一个安全的 web URL，以进行带外交互：

```json
{
  "method": "elicitation/create",
  "params": {
    "mode": "url",
    "message": "Connect the report service to continue.",
    "url": "https://mcp.example.com/connect/report-service"
  }
}
```

当敏感信息必须直接进入由 server 控制的 web 流程时使用此 mode，例如第三方授权。客户端会显示完整目标地址，并在打开前获得用户同意。客户端不得预取该 URL。

`accept` 响应表示用户同意打开 URL。它不能证明外部流程已经完成。重试时，server 会检查自身状态，然后完成操作或再次返回 `input_required` 结果。

URL Elicitation 不能替代 MCP 客户端与 MCP server 之间的授权。它用于 MCP server 需要代表用户执行的外部交互。server 必须将浏览器用户绑定到发起 MCP 操作的同一个经过身份验证的主体。

## 响应分支

将这些 action 视为产品决策，而不是别名：

| Action | 含义 | 安全的 server 行为 |
|--------|---------|----------------------|
| `accept` | 用户提交了交互 | 验证内容并继续 |
| `decline` | 用户明确拒绝 | 返回完整的非错误拒绝结果 |
| `cancel` | 用户关闭交互或无法完成 | 安全停止，并允许稍后重试 |

绝不要将缺失的内容解释为同意。绝不要把 decline 转换成重复 Prompt 循环。

## 保护破坏性 MRTR 状态

候选列表不能只存在于 Prompt 或未签名的 Base64 值中。客户端可以控制它发回的所有内容。

本课程会对包含以下内容的状态 payload 进行签名：

- 经过身份验证的主体；
- 发起操作的 method；
- `workspaceUri` 和 `title` 的 digest；
- 表单中显示的允许笔记 id；
- 操作阶段；
- 较短的有效期。

在执行修改前，server 还会检查实时笔记记录。这可以捕获删除 race，以及表单显示后目标被移出工作区的情况。

对于一次性财务操作或不可逆操作，仅使用 HMAC 无法阻止有效状态在其有效期内被重放。应在所有 handler 实例共享的重放存储中，仅存储并消费 nonce 一次。本课程注入了一个有界且会按 TTL 清理的存储，并在执行内存删除时保持对 nonce 的原子 claim。生产数据库应在一个 transaction 或等效的 conditional-write 边界内完成 nonce claim 和修改。

应先验证交互，再 claim nonce。格式错误的响应或 `cancel` 不会执行任何修改，并会使状态在过期前仍可重试。明确的 `decline` 是终止状态，因此本课程会消费 nonce，但不会删除任何内容。

```figure
t3-roots-boundary
```

## 构建

`code/main.py` 演示了一个现代的 `notes_delete` Tool：

- `tools/list` 返回一个确定性、可缓存的描述符，其中包含必需的工作区和标题 schema。
- 范围通过显式的 `workspaceUri` argument 提供。
- server 配置为本课程主体授权该工作区。
- URI 规范化会拒绝前缀混淆和编码路径遍历。
- 每次破坏性删除都需要 form mode Elicitation。
- Elicitation 通过 `resultType: "input_required"` 传递。
- 已签名的 `requestState` 绑定准确的候选列表和原始 arguments。
- 注入的重放存储会跨 server 实例拒绝重复使用同一个已接受或已拒绝的状态。
- 重试使用新的请求 id，并返回 `resultType: "complete"`。

数据存储位于内存中，因此协议行为易于检查。使用数据库时，安全规则保持不变。

## 使用

从 repository 根目录运行：

```bash
cd phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/code
python3 main.py
python3 -m unittest discover tests -v
```

预期检查点：

- Discovery 声明 Tool，但不声明 Roots。
- Tool discovery 返回 `notes_delete`，其中包含 `resultType`、server 身份和缓存提示。
- 请求 id `1` 在 `inputRequests.delete_choice` 中返回表单。
- 请求 id `2` 原样返回已签名状态，并完成删除。
- 前缀路径和编码路径遍历都会无法通过包含性检查。
- 修改后的标题无法复用原始确认状态。
- decline 不会更改笔记。
- 共享笔记和重放状态的两个 server object 无法同时执行同一次确认。
- 空声明和显式 form 声明都可以正常工作，而仅支持 URL 时会返回准确的 `-32021` form 要求。
- 不受支持的版本会使用准确的 `-32022` 数据结构。
- 没有 id 的通知不会产生 JSON-RPC 响应。

## 交付

`outputs/skill-elicitation-form-designer.md` 用于设计显式范围、授权检查、MRTR 表单、响应分支和状态绑定。它拒绝将已弃用的 Roots 当作 sandbox，也拒绝通过 form mode 收集敏感信息。

## 练习

1. 使用 SQLite 替换内存重放存储。使用一个 transaction claim nonce 并删除笔记，然后证明两个进程无法同时 commit。
2. 添加 `url` capability 协商和带外设置流程。不要让第三方凭据进入 `inputResponses`。
3. 使用临时 SQLite 数据库替换内存笔记 map。在修改 transaction 内重新检查授权和包含性。
4. 为真实文件系统实现添加 symbolic-link 策略。解释为什么仅靠 URI lexical containment 无法阻止 symlink 越界。
5. 设计一个 2025-11-25 adapter，将现代 MRTR handler 输出映射到旧版由 server 发起的 Elicitation。将其与当前 handler 隔离。

## 关键术语

| 术语 | 在 2026-07-28 中的含义 |
|------|------------------------|
| Roots | 已弃用的信息性工作区提示，不代表授权，也不提供 sandbox |
| 显式范围 | 在请求 arguments 中可见的工作区、目录或资源句柄 |
| 包含性 | 经过规范化的路径组件检查，用于确保目标位于边界内 |
| Elicitation | 在 MCP 操作期间获取用户输入的客户端功能 |
| Form mode | 使用受限扁平 schema 的带内结构化用户输入 |
| URL mode | 用于敏感或外部工作流的带外交互 |
| MRTR | 无状态的 input-required 结果，随后使用新的请求进行重试 |
| `requestState` | 由客户端原样返回并由 server 进行完整性检查的不透明状态 |
| Decline | 用户明确拒绝 |
| Cancel | 未经批准便关闭交互或交互未完成 |

## 旧版兼容性

对于固定使用 2025-11-25 的 peer，`roots/list`、`notifications/roots/list_changed` 和实时由 server 发起的 `elicitation/create` 可能仍然存在。应将该 adapter 标记为 legacy。不要允许旧版 Root 列表绕过 server 授权，也不要将协议 session 假设带入现代 handler。

## 延伸阅读

- [MCP 2026-07-28 Elicitation](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation)
- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 Roots deprecation](https://modelcontextprotocol.io/specification/2026-07-28/client/roots)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
