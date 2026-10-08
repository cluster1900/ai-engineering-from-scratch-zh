# 显式权限范围与无状态 Elicitation

> Roots 在 MCP 2026-07-28 规范中已被弃用，且它从来就不是安全沙箱。请将权限范围（scope）置于可见的 tool 参数或 resource URI 中，由 server 进行鉴权，并在 tool 真正需要用户输入时使用 MRTR。用户能看清决策内容，模型能获得引用句柄，任何 server 实例都能无状态地处理重试。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 11 (stateless MRTR)
**Time:** ~60 minutes

## 学习目标

- 使用显式工作区参数、resource URI 或 server 静态配置替代已弃用的 Roots。
- 将 scope 提示与鉴权、路径限制（containment）及操作系统级沙箱严格区分开来。
- 通过 MRTR 的 `input_required` 结果交付表单模式（form-mode）的 `elicitation/create`。
- 在每个请求的 client capabilities 中声明 elicitation 支持并拒绝不受支持的模式。
- 严谨校验 `accept`、`decline` 和 `cancel` 这三种截然不同的交互结果。
- 将破坏性确认绑定到鉴权主体、原始参数、候选集合与过期时间。

## 两个看似相似的问题

一个 notes tool 收到了如下请求：“删除旧的 TPS 报告。”

Server 必须回答两个不同的问题：

1. 本次操作允许触碰哪个工作区（workspace）？
2. 三份匹配的笔记中，用户指的究竟是哪一份？

第一个问题关乎范围（scope）与鉴权（authorization）。第二个问题属于交互式消除歧义（interactive disambiguation）。将二者混为一谈会导致极其危险的设计——例如误将 client 传入的文件夹当作“调用方被允许删除其中所有内容”的凭证。

## Roots 仅为迁移过渡表面

早期的 MCP 规范允许 client 声明 Roots，并在列表发生变更时通知 server。然而 Roots 仅仅是提示性的引导信息（informational guidance）。它既没有限制 server 进程实际可以读取哪些文件，也没有对调用方完成鉴权，更没有建立任何操作系统级别的安全沙箱。

MCP 2026-07-28 针对新设计全面弃用了 `roots/list` 与 `notifications/roots/list_changed`。推荐使用以下显式方案作为替代：

- 当范围随每次调用发生变化时，使用 `workspaceUri` 或 `directory` tool 参数。
- 当操作本身针对特定资源时，使用 resource URI。
- 当特定部署单例独占固定工作区时，使用 server 配置文件。
- 当必须从技术上阻止代码越界时，使用进程沙箱（process sandbox）或隔离文件系统（jailed filesystem）。

如果现有的 2026-07-28 接入方案在弃用过渡期仍需要 `roots/list`，server 应将其内嵌在 MRTR 的 `inputRequests` 中，绝不能发送实时的反向请求。这只是一种迁移适配器；新编写的 handler 应当直接接收显式的 scope。

模型能够看清并复述显式的句柄（handle）。而隐藏在传输层会话中的隐式 scope 则更难以审查、重放、审计和路由。

### 三层防御原则

显式的 URI 本身并不自带合法性证明。必须严格执行以下三层防护：

1. **鉴权（Authorization）：** 该经过鉴权的主体是否被允许使用此工作区？
2. **路径限制（Containment）：** 规范化后的目标 URI 是否严格保持在受权的工作区边界内部？
3. **沙箱隔离（Sandbox）：** 一旦 server 遭遇入侵沦陷，操作系统能否有效阻止其逃逸越界？

可运行的 server 会维护一份受信任工作区 URI 白名单，规范化处理百分号编码的路径，校验真实的路径组件边界，并在执行物理删除前即刻重新检查路径限制。

幼稚的字符串前缀检查是存在严重漏洞的：

```text
allowed:   file:///work/notes
attacker:  file:///work/notes-evil/secret.md
traversal: file:///work/notes/%2e%2e/private.md
```

这两条恶意路径都以看似合法的字符串开头。必须先做规范化（normalize），随后再逐级比对路径组件。生产级的文件系统 server 还必须抵御符号链接竞争（symlink race）以及平台特定的路径语义攻击。

## Elicitation 依然存在，但交互方式已发生转变

Elicitation 是现代规范中用于在 `tools/call`、`prompts/get` 或 `resources/read` 执行期间收集用户输入的 client 特性。方法名称依然是 `elicitation/create`。真正改变的是数据在网络连线上的流动方向。

2026-07-28 的 server 不会发送反向 JSON-RPC 请求。它直接返回 `InputRequiredResult`：

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

Host 负责渲染表单。用户可以选择提交接受（accept）、显式拒绝（decline）或直接取消/关闭（cancel）。随后 client 携带全新的 id 重试原始的 `tools/call`：

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

在两次调用之间不存在任何协议会话。Server 校验回显的状态，根据预期的 schema 验证响应内容，确认选中的笔记包含在经过签名的候选集合内，重新对工作区鉴权，重新检查路径限制，最后才执行删除。

## 针对每个请求的 Capability 协商

支持表单模式 elicitation 的 client 会声明：

```json
{
  "io.modelcontextprotocol/clientCapabilities": {
    "elicitation": {"form": {}}
  }
}
```

空的 elicitation capability（即 `"elicitation": {}`）出于兼容性考虑仍等同于仅支持表单模式。显式声明 `"elicitation": {"form": {}}` 同样支持表单模式。但仅声明 URL 模式（`"elicitation": {"url": {}}`）则不支持表单。Server 绝不能内嵌当前请求的 capabilities 中所缺失的模式，哪怕先前的请求曾声明过该模式。

每个请求同样必须携带 `io.modelcontextprotocol/protocolVersion`。版本缺失或非字符串类型返回 `-32602`。不支持的版本字符串返回 `-32022` 并带有准确的 `supported` 与 `requested` 数据。缺失或仅支持 URL 的 elicitation 会返回 `-32021`，并将 `data.requiredCapabilities` 设为 `{"elicitation":{"form":{}}}`。

没有 JSON-RPC `id` 的信封属于 notification。直接处理它，不要发出 JSON-RPC 成功或错误响应。在 Streamable HTTP 上，已接受的 notification 会收到无正文的 `202 Accepted`。

`clientInfo` 应当包含用于诊断排错，但它是自行声明的，绝不能用于鉴权识别用户身份。

Server 实现了 `server/discover` 并返回包含 `resultType: "complete"` 的 `supportedVersions`、capabilities、`ttlMs` 以及 `cacheScope`。对于这种现代设计，它不会向外声明 Roots。由于声明了 tools，它同样实现了强制性的 `tools/list`。该结果返回确定性的 `notes_delete` 描述符、合法的 object 类型 `inputSchema`、server 身份元数据以及 public 缓存提示。

## 表单模式（Form Mode）

表单模式使用专为可用对话框设计的受限 JSON Schema。根节点必须是 object，其 properties 仅限于扁平的原始字段（primitive fields）或受支持的枚举数组。深度嵌套的对象和通用文档 schema 绝不属于确认对话框的范畴。

表单模式适用于：

- 从若干候选项目中挑选一个；
- 确认某项破坏性操作；
- 收集不含敏感信息的配置偏好；
- 采集少量必须由人而非模型裁决的数值。

绝不要使用表单模式来收集密码、API key、访问令牌或支付凭据。这些机密信息如果经过 MCP client，极易流入日志或模型上下文中。

Server 必须对回传的内容再次进行校验。Client 端的表单验证只能提升用户体验，绝不能构成信任依据。

## URL 模式（URL Mode）

URL 模式发送一个安全的 Web URL 以进行带外（out-of-band）交互：

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

当敏感信息必须直接输入到由 server 控制的 Web 流程（例如第三方 OAuth 授权）时，请使用 URL 模式。Client 会向用户展示完整的跳转目标并在打开之前获得用户同意。Client 绝不能对该 URL 进行预加载（prefetch）。

`accept` 响应仅表明用户同意打开该 URL，并不证明外部交互已顺利完成。在重试时，server 会检查自身状态，要么执行完成，要么返回另一个 `input_required` 结果。

URL elicitation 绝不能替代 MCP client 与 MCP server 之间的鉴权机制。它是为了让 MCP server 代表用户执行外部交互而设计的。Server 必须将浏览器端的用户与发起 MCP 操作的同一个已鉴权主体紧密绑定。

## 响应分支与处理分支

请将各项 action 视作严肃的产品逻辑决策，而非同义别名：

| 动作 | 含义 | 安全的 Server 处理行为 |
|---|---|---|
| `accept` | 用户提交了交互内容 | 校验内容并继续执行 |
| `decline` | 用户明确表示拒绝 | 返回一个执行完成且非错误的拒绝结果 |
| `cancel` | 用户关闭对话框或未能完成交互 | 安全停止并允许稍后重试 |

绝不要将缺失内容解读为默许同意。绝不要将 decline 转换成重复追问的死循环。

## 保护破坏性 MRTR 状态

候选列表绝不能仅仅存在于 prompt 或未签名的 Base64 值中。Client 对其回传的一切内容都拥有控制权。

本课对状态载荷进行了签名，内容包括：

- 经过鉴权的主体；
- 发起调用的原始方法；
- `workspaceUri` 与 `title` 的摘要；
- 表单中展示的合法笔记 id 列表；
- 操作执行阶段；
- 较短的过期时间。

在执行变更之前，server 还会核查最新的存活笔记记录。这能够防范删除操作的竞态条件，以及在表单展示后目标笔记被移出工作区边界的情况。

对于一次性的金融交易或不可逆操作，仅凭 HMAC 无法阻止合法状态在其有效期内被重放。必须在所有 handler 实例共享的防重放存储中，严格以原子操作生成并消费一次性随机数（nonce）。本课注入了一个有界的、带 TTL 自动清理的存储，并在内存删除期间独占持有其原子声明。生产级数据库应当在同一事务或等价的条件写入边界中同时完成 nonce 声明与数据变更。

在声明 nonce 之前必须先校验交互的合法性。格式错误的响应或 `cancel` 不会执行任何变更，并允许该状态在过期前重试。显式的 `decline` 属于终态，因此本课会消费该 nonce 且不执行任何删除。

```figure
t3-roots-boundary
```

## 手写实现

`code/main.py` 演示了一个现代化的 `notes_delete` tool：

- `tools/list` 返回确定性、可缓存的描述符，包含必需的 workspace 与 title schema。
- 权限范围通过显式的 `workspaceUri` 参数传递。
- Server 配置为当前课程主体授予该工作区的访问权限。
- URI 规范化有效拒绝前缀混淆与编码后的目录遍历攻击。
- 所有的破坏性删除均强制要求表单模式 elicitation。
- Elicitation 封装在 `resultType: "input_required"` 中传输。
- 签名的 `requestState` 绑定了精确的候选列表与原始参数。
- 注入的防重放存储能够在多个 server 实例间拒绝复用相同的 accept 或 decline 状态。
- 重试调用采用全新的请求 id 并返回 `resultType: "complete"`。

数据存储采用内存实现，以便于清晰审查协议行为。如果接入数据库，安全规则完全一致。

## 使用与运行

在仓库根目录下运行：

```bash
cd phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/code
python3 main.py
python3 -m unittest discover tests -v
```

预期检查点：

- Discovery 声明 tools 且不包含 Roots。
- Tool discovery 返回 `notes_delete`，附带 `resultType`、server 身份与缓存提示。
- 请求 id `1` 在 `inputRequests.delete_choice` 中返回表单。
- 请求 id `2` 回显签名状态并完成删除。
- 前缀欺骗路径与编码遍历路径均触发路径限制失败。
- 篡改 title 无法复用先前的确认状态。
- 执行 decline 会保留笔记完好无损。
- 共享笔记与重放状态的两个 server 对象无法重复执行同一次确认。
- 空配置与显式表单声明均能正常工作，而仅声明 URL 支持则精准返回 `-32021` 表单需求错误。
- 不受支持版本的错误响应使用精确的 `-32022` 数据结构。
- 没有 id 的 notification 不产生任何 JSON-RPC 响应。

## 交付产物

`outputs/skill-elicitation-form-designer.md` 能够辅助设计显式范围、鉴权检查、MRTR 表单、响应分支与状态绑定。它严格禁止将已弃用的 Roots 当作沙箱使用，也禁止通过表单模式收集敏感机密。

## 课后练习

1. 将内存防重放存储替换为 SQLite。在单个事务中原子化声明 nonce 并删除笔记，证明两个进程无法同时提交成功。
2. 增加 `url` capability 协商与带外设置流程。确保第三方凭证不流入 `inputResponses`。
3. 将内存笔记字典替换为临时的 SQLite 数据库。在变更事务内部重新校验鉴权与路径限制。
4. 为真实文件系统实现设计符号链接（symbolic-link）安全策略。解释为什么仅凭 URI 词法包含检查无法阻止符号链接逃逸。
5. 设计一个 2025-11-25 适配器，将现代 MRTR handler 输出映射为旧式 server 发起的 elicitation，并保持其与当前 handler 的代码隔离。

## 关键术语

| 术语 | 2026-07-28 中的含义 |
|------|------------------------|
| Roots | 已弃用的提示性工作区指引，不具备鉴权或沙箱隔离能力 |
| 显式权限范围（Explicit scope） | 在请求参数中清晰可见的工作区、目录或 resource 句柄 |
| 路径限制（Containment） | 规范化路径组件校验，确保目标严格限制在受控边界之内 |
| Elicitation | 在 MCP 操作执行期间用于获取用户输入的 client 特性 |
| 表单模式（Form mode） | 使用受限扁平 schema 的带内（in-band）结构化用户输入 |
| URL 模式（URL mode） | 针对敏感或外部工作流的带外（out-of-band）Web 交互 |
| MRTR | 多轮往返请求，返回 input-required 结果后由 client 发起全新重试 |
| `requestState` | 不透明的状态凭证，由 client 原样回显并由 server 进行完整性校验 |
| Decline（拒绝） | 用户明确作出的拒绝操作 |
| Cancel（取消） | 用户主动关闭界面或在未获批准的情况下中断交互 |

## 旧版兼容性

对于固定在 2025-11-25 版本的对端，`roots/list`、`notifications/roots/list_changed` 以及实时的 server 发起 `elicitation/create` 可能依然存在。请将该适配器明确标记为 legacy。绝不能允许旧版 Root 列表绕过 server 的鉴权检查，也不要将协议会话的假设引入现代 handler 中。

## 延伸阅读

- [MCP 2026-07-28 Elicitation](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation)
- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 Roots deprecation](https://modelcontextprotocol.io/specification/2026-07-28/client/roots)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
