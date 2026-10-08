# 用户同意与最小权限 (Consent and Least Privilege)

> 会在外部世界产生副作用的工具调用，绝不能仅仅因为模型决定调用它就直接执行。它的执行必须源于人类对该次具体调用的明确许可，且客户端持有的访问权限不得超出该次调用实际所需的最小范围。

**Type:** Reference
**Languages:** Python
**Prerequisites:** Lesson 24
**Time:** ~45 minutes

## 学习目标

- 阐述为什么 MCP 没有由服务器主动向客户端推送审批请求的机制，以及多轮往返请求 (MRTR) 中的 elicitation（信息引出）如何承载用户同意 (Consent) 询问。
- 区分逐工具同意范围界定 (Per-tool consent scoping) 与笼统的“信任此服务器”授权，并解释工具注解 (Annotations) 为何只能作为决策参考而绝不能用于强制安全执行。
- 解析 HTTP 403 `insufficient_scope` 质询响应，并计算客户端接下来应请求的作用域（即已持有的作用域与质询所要求的作用域之并集）。
- 在步进式授权 (Step-up authorization) 循环中引入重试上限机制，确保无法获取所需作用域的客户端能够显式报错，而非陷入无限重试。
- 解释为什么像 `tools/list` 这样的结果可以根据调用方被授予的作用域动态变化，但在同一授权下对于同一调用方的同一请求必须始终返回一致的结果。

## 问题背景

拥有工具调用权限的智能体 (Agent) 能够执行许多人类无法轻易撤销的操作：删除文件、发起转账支付、向客户发送消息、注销系统账户等。执行这些操作的工具运行在非客户端编写的第三方服务器上，且完全由模型自主判断何时发起调用。有两种极端设计都会走向失败：第一种是在服务器连接建立的瞬间将所有调用视为预先批准，这会导致单个疏忽或遭受入侵的服务器直接拥有用户的全部操作权限，整个过程中没有任何人类介入审查即将发生的变更；第二种极端则是对所有调用（包括仅读取数据的安全操作）都要求弹出确认框，这会导致提示信息沦为噪音，用户不加阅读便快速点击“同意”，这绝非真正的同意，而是披着同意伪装的“弹窗疲劳” (Consent fatigue)。

在 MCP 规范中妥善解决这一问题，比单纯制定一套安全策略要困难得多，因为底层协议没有提供任何简化的快捷方式。在 2026-07-28 规范修订版中，核心架构是无状态的，不存在有状态的 Session，也没有服务器主动发起的 Push 机制：服务器无法像传统的面向连接协议那样，在调用执行中途直接打断客户端并抛出提问。此外，在人类同意网关的下一层，还潜藏着一个容易混淆的独立网关：在任何人被要求审批某项操作之前，客户端持有的访问令牌 (Access Token) 必须首先具备执行该操作所需的足够 OAuth 作用域 (Scope)。“用户同意”回答的是“这一次具体的行动是否应当发生”，而“OAuth 作用域”回答的是“该客户端是否被允许尝试此类操作”。如果只讨论其中一个，安全与治理 (Security and Governance) 领域就只被触及了一半。

## 核心概念

### 无会话下的询问：基于 MRTR 的信息引出 (Elicitation)

工具由模型控制：模型自主决定何时发起工具调用。MCP 规范并未强制要求特定的用户交互界面模型，但明确指出：整个系统应始终保持人类在回路中 (Human-in-the-loop)，并保留拒绝调用的能力；宿主应用程序应当清晰展示已暴露的工具列表、标注何时调用了工具，并在敏感操作真正发生前进行确认。由于 MCP 不存在服务器主动推送通道，这一确认流程完全依赖所有“服务器需要更多信息”场景通用的机制：多轮往返请求 (Multi Round-Trip Request, MRTR)。当服务器收到 `tools/call` 请求时，若需要人类确认，它不会直接返回执行结果，而是返回 `resultType: "input_required"`，并在 `inputRequests` 映射表中放入 `elicitation/create` 请求；若需要将最终审批结果关联回本次调用上下文，还会附带一个 `requestState` 字符串。客户端收集人类用户的决策后，使用全新的 JSON-RPC `id` 重新发起完全相同的操作请求，在 `inputResponses` 中使用服务器此前命名的键填入用户反馈，并将 `requestState` 原样逐字节回传。

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "confirm": {
        "method": "elicitation/create",
        "params": {
          "mode": "form",
          "message": "Allow delete_file to run with arguments {\"path\": \"notes.txt\"}?",
          "requestedSchema": {
            "type": "object",
            "properties": {"approved": {"type": "boolean", "title": "Approve this call"}},
            "required": ["approved"]
          }
        }
      }
    },
    "requestState": "eyJ0b29sIjogImRlbGV0ZV9maWxlIn0.9f2c..."
  }
}
```

用户的回答必须作为三种标准操作之一返回，而绝不能是简陋的布尔值 yes 或 no：`accept`（在表单模式下附带符合请求 schema 的 `content`）、`decline`（用户明确表示拒绝）或 `cancel`（用户离开界面未作决定）。这三种动作都会阻止工具调用的直接执行，但唯有 `accept` 才代表获得了用户同意；如果客户端将 `cancel` 视为 `decline`，或者将任意一种静默自动重试，都是在擅自揣测用户的真实意图。值得注意的是，这些情况都不属于协议层错误 (Protocol Error)。当服务器因未获得用户同意而拒绝执行工具时，它应当以报告业务拒绝的标准方式进行响应：返回正常的 `tools/call` 结果，其中设置 `isError: true` 并附带模型可读的文本解释，而不是返回 JSON-RPC error，更不能凭空捏造错误码。在 2026-07-28 规范的错误码表中，没有任何一项是留给“需要用户同意 (consent required)”的，未来也不应当有。

对于 `requestState`，你必须保持与任何跨越信任边界并在稍后返回的数据相同的防范心理：一旦离开服务器，它在本质上就变成了攻击者可控的外部输入。如果该状态值被允许影响后续的执行逻辑，服务器必须对其进行加密签名（对大多数服务器而言 HMAC 或 AEAD 已足够），将其严格绑定到生成该状态的具体调用请求，并在消费后立即作废（一次性使用）。如果在重试请求中附带了来自某次调用的 `requestState`，却要求执行一组完全不同的参数，这绝不是合法的重试，而是人类审查后被篡改的恶意请求；捕捉此类篡改必须依赖服务器自身的签名与参数校验，而不能寄希望于报文传输格式本身。

### 同意作用域绑定到单一工具，而非整个服务器

用户授予的同意，其作用范围必须严格限制在被授予许可的具体工具上。批准 `delete_file` 绝不代表同时批准了 `send_payment`，即使它们属于同一个服务器、发生在同一段对话中、甚至时间上仅相隔数秒。给整个服务器打上“信任此服务器”的标签，会彻底瓦解为每个工具独立命名的初衷：它把一次具体的、知情的决策退化成了一个用户从未真正做出的笼统授权。正是在这里，工具的注解 (`annotations`) 发挥了作用，同时也立即暴露了它的局限性。`readOnlyHint`、`destructiveHint` 和 `openWorldHint` 正是客户端用于决定何时弹出用户提示的关键信号：仅读取数据的调用通常可以直接放行，而写入、删除、发送或涉及开放世界的调用通常必须提示确认。然而，注解只是服务器关于自身特性的“声明性提示”，规范明确要求客户端必须将其视为不可信数据，除非该服务器本身属于受信任实体。一个谎称自己是只读工具的恶意工具，绝不会因为其 `annotations` 写着 read-only 就变得安全。无论客户端在注解之上构建何种策略，真正的强制执行机制（即记录人类到底批准了哪个具名工具）必须存在于客户端内部，而不能盲信服务器对自身工具的吹捧。同时，请注意默认值的安全含义：`destructiveHint` 和 `openWorldHint` 默认均为 `true`，而 `readOnlyHint` 默认值为 `false`。当一个工具完全没有提供注解时，协议在默认情况下将其视为具有破坏性且面向开放世界的危险工具，而非安全工具。当服务器保持沉默时，MCP 协议在设计上采取了绝对保守的安全立场。

### 步进式授权 (Step-up Authorization)：下一层的不同网关

在触达用户同意网关之前，一次调用可能会因为完全不同的原因失败：支撑该请求的访问令牌没有包含足够的操作作用域 (Scope)。这是由 OAuth 治理的传输层控制，它回答的问题与人类同意截然不同。当请求携带的作用域不足时，服务器会返回 `403 Forbidden`，并在 `WWW-Authenticate` 响应头中一次性声明该操作所需的全部作用域，而不是在多次往返中逐个质询：

```http
HTTP/1.1 403 Forbidden
WWW-Authenticate: Bearer error="insufficient_scope",
                         scope="payments:write",
                         resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource"
```

客户端收到质询后的正确反应是：计算自身当前已持有的作用域与本次质询所要求的作用域的并集 (Union)，绝不能用新的作用域覆盖旧集合。按操作发起质询的服务器绝不应该导致客户端丢失此前已经合法获得的作用域。随后，客户端针对合并后的作用域集合重新发起授权并重试。这与首次选择作用域的流程有所不同：当客户端首次发起授权且初始 `401` 响应未包含任何 `scope` 参数时，它应退回使用服务器受保护资源元数据 (Protected Resource Metadata) 中的 `scopes_supported` 作为最小初始集合，而不是盲目请求服务器定义过的所有作用域。这两个规则的存在原因是一致的：只在需要时请求所需的最小权限，并通过一次干净的跳跃完成步进提权，而不是在无数轮往返中零星申请权限。步进式授权循环也必须设置上限：客户端应将重新授权的重试次数限制在一个较小的确定阈值内；超过该上限后，应将该操作判定为永久性授权失败，而不是对着一个永远无法获取的作用域陷入死循环。

### 最小权限原则：服务器应该声明和展示什么

无状态性 (Statelessness) 意味着 `tools/list` 绝不能因为其他请求的副作用而改变，并且在相同的授权状态下，针对同一调用方必须始终返回相同的工具集合。但是，规范明确允许针对两个不同的调用方返回不同的工具列表，因为请求中附带的 Scope 属于输入参数的一部分，而非连接状态。如果一个服务器始终对所有调用者暴露所有工具，等到调用者尝试调用时才去拒绝无权访问的工具，这实际上是在向调用者泄露其本不应知晓的能力存在与参数结构，并且会误导模型去尝试注定失败的调用。遵循最小权限原则的做法是：根据请求中实际呈现的作用域来动态过滤 `tools/list` 的返回内容，并将该响应结果标记为 `cacheScope: "private"` 而非 `"public"`，因为公开缓存会把某个用户的工具表面泄露给其他用户。

```figure
mcpa-25-consent-gates
```

## Interactive Lab (交互式实验)

上方的流程图展示了一次 `tools/call` 在执行具体逻辑之前所经过的两道检验网关。它首先穿过授权边界：如果令牌的作用域不足，服务器将返回 `403` 及所需的作用域进行拦截，客户端将该作用域与现有作用域取并集后重试授权并再次调用。只有在授权通过后，请求才会抵达用户同意网关：如果该工具需要人类决策且当前没有任何针对该具体工具的批准记录，服务器将返回 `input_required` 而非执行操作，客户端通过一轮 `elicitation/create` 往返交互完成用户确认后重试。请注意这两道网关是相互独立且具备严格先后顺序的：一个完全获得 OAuth 授权的客户端仍然可能被要求进行人工确认；反之，一个没有任何用户同意阻碍的调用也可能因为作用域不足而被拦截。一个工具可以受其中一道网关保护、同时受两者保护，或者两者都不受。

## Practice Lab (实战演练)

打开 `code/main.py`。该程序构建了一个拥有四个工具的完整模拟服务器：`list_files`（只读、封闭世界、立即执行）、`search_web`（只读但涉及开放世界，因 `openWorldHint` 为 true 仍受同意网关约束）、`delete_file`（破坏性操作、受同意网关约束，由小型内存文件系统支撑，以便观察拒绝操作如何保留文件完整性），以及 `send_payment`（破坏性操作且受 `payments:write` 作用域保护，同时触发两道网关）。

```bash
python3 code/main.py
```

对照上述讲解阅读执行日志。定位针对 `delete_file` 返回的 `input_required` 结果；观察用户的 `decline` 如何让 `notes.txt` 保持原样；观察随后的全新引出（拒绝同意不会被持久记录）；以及最终被用户接受 (`accept`) 并成功执行删除的重试请求。接着观察故意构造的恶意调用记录：某次重试虽然回传了合法的 `requestState`，但却试图删除一个与用户所见不同的文件。由于服务器的签名校验识别出了参数不匹配，日志将其标记为 `violation`，而没有轻信重试请求。另外，观察 `send_payment` 如何先因作用域不足被拦截质询，客户端如何计算 `payments:read` 与质询的 `payments:write` 的并集，并在授权通过后才进入独立的同意确认提示。最后，对比仅持有 `payments:read` 时 `tools/list` 的返回结果与获得 `payments:write` 之后的返回结果。

## Shipped Artifact (交付产物)

`outputs/consent-design-checklist.md` 是一份用于审查用户同意与授权架构设计的一页式参考清单：涵盖何时触发提示、如何界定授权作用域、如何设计步进式质询，以及哪些必须当场拒绝的常见错误反模式。

## Verify It (验证方法)

在课程目录下运行测试套件：

```bash
python3 -m unittest discover code/tests
```

测试套件全面验证了本课的核心论断：只读工具无需任何提示即可执行；破坏性工具必须触发 elicitation；拒绝与取消操作均不产生任何副作用；针对某一工具的同意绝不延伸至其他工具；篡改的重试请求会在不破坏合法 `requestState` 的前提下被直接拒绝；已被消费的 `requestState` 无法被重放；步进式授权计算作用域并集并严格执行重试上限；以及 `tools/list` 严格根据实际授予的作用域进行过滤。仓库提供的报文检查器也会依据 2026-07-28 规范检验本课的传输日志：

```bash
python3 scripts/check_mcpa_wire.py certifications/mcpa/lessons/25-consent-and-least-privilege
```

## Capstone Connection (项目连接)

在 Capstone 综合项目中，每一个具有副作用的工具都必须拥有严格限定在其自身名称上的独立同意决策，绝不能从同级工具中隐式继承，也绝不能单凭服务器自身声明的注解而予以信任。每一个受作用域约束的工具都必须提供通过取并集而非覆盖进行提权的步进路径，并设置重试上限。当 Capstone 考核要求你为调用方的可见性与执行边界辩护时，请从本课的两道网关出发作答：人类明确批准了什么，以及当前持有的令牌实际授权了什么，并能够清晰指出某一具体失败属于哪一道网关。

## 关键术语 (Key Terms)

| 术语 | 定义说明 |
|------|---------|
| Elicitation（信息引出） | 服务器向客户端请求用户输入的 MRTR 请求，在 `inputRequests` 中以 `elicitation/create` 条目呈现 |
| requestState | 服务器生成的非透明字符串，重试请求必须原样回传；被视为不可信输入，在关键场景下必须进行签名并仅允许一次性消费 |
| Per-tool consent scoping（逐工具同意范围界定） | 针对单个具名工具记录的批准记录，绝不能跨越到整个服务器、类别或通配命名规则 |
| Annotation hint（注解提示） | 服务器声明的属性（如 `destructiveHint`），仅用于辅助客户端的提示策略，绝不能被当作安全强制保证 |
| Step-up authorization（步进式授权） | 在收到 `403 insufficient_scope` 响应后，针对先前持有与新质询要求的 OAuth 作用域并集重新发起授权的机制 |
| Scope union（作用域并集） | 客户端先前作用域与质询所需作用域的合并集合，确保重新授权过程绝不丢失先前的权限授予 |
| Least privilege in list results（列表结果中的最小权限） | 过滤为仅展示调用者当前授权允许访问的内容的 `tools/list` 响应，且缓存作用域标记为 `cacheScope: "private"` |

## 延伸阅读 (Further Reading)

- [Model Context Protocol 规范 2026-07-28, Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)，查阅用户交互模型 (User Interaction Model) 与工具双错误通道机制。
- [Model Context Protocol 规范 2026-07-28, Elicitation](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation)，了解表单模式 (Form Mode)、URL 模式以及三种响应动作。
- [Model Context Protocol 规范 2026-07-28, Authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)，学习作用域选择策略与步进式授权流程。
- `certifications/mcpa/research/mcp-2026-07-28-brief.md`，第 7、11 和 12 节。
- `phases/13-tools-and-protocols/12-mcp-roots-and-elicitation`，从第一性原理探索从零构建 elicitation。
