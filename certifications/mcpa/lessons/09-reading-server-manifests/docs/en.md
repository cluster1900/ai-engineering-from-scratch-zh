# 像审查者一样审阅服务端清单 (Server Manifest)

> 服务端的 discover 结果、工具列表以及 Registry 注册项，是你在发起任何调用前能了解它的全部信息。请像审阅正式合同一样对待它们：：因为未被审查的默认值，最终会变成你并非本意却不得不承担的承诺。

**Type:** Reference
**Languages:** Python
**Prerequisites:** Lesson 08
**Time:** ~45 minutes

## 学习目标

- 将 `server/discover` 结果、`tools/list` 分页以及 Registry `server.json` 理解为在发起任何调用之前描述服务端的三个核心文档
- 掌握工具注解默认值（`readOnlyHint: false`、`destructiveHint: true`、`idempotentHint: false`、`openWorldHint: true`），明确当注解被省略时客户端实际必须做出的保守假设
- 解释能力标志（capability flags）、`x-mcp-header` 标记、图标（icons）以及 `cacheScope` 选取对服务端行为的深层含义
- 敏锐识别清单中的危险信号（red flags）：未提供注解的破坏性工具、通过 `x-mcp-header` 暴露的敏感密钥、针对用户专属内容声明的 `public` 缓存作用域，以及意在操控模型而非描述服务端的指令
- 将 Registry `server.json` 中的名称解析为其所属命名空间（namespace），并阐明该命名空间是如何完成所有权验证的

## 问题背景

在宿主（Host）调用任何工具之前，它其实已经掌握了关于服务端的三个文档：`server/discover` 声称支持的功能、`tools/list` 当前暴露的工具集合，以及若该服务端已公开发布，其注册表（Registry）`server.json` 中声明的所有者信息。然而，协议本身并不会强制要求这三个文档中的任何一个必须完整、谨慎或诚实。注解（annotations）只是提示；指令（instructions）是自行汇报的散文；而注册表名称的可信度完全取决于其背后所有权验证挑战（verification challenge）的严密程度。如果宿主不经审阅就直接挂载服务端，就等于在盲目信任从未核验过的默认值与自我声明。

这种审查能力与编写服务端或调用工具截然不同。它更像是在安装应用之前仔细审阅权限清单（permissions manifest）：你尚未执行任何代码，而是在评估对方暴露的功能形态是否与该类别下合规服务端的预期相符，并在特定位置寻找疏忽或怀有恶意的作者可能偷工减料的痕迹。一个缺少 `annotations` 块的工具并不代表它能避开审查：：规范强制要求客户端必须应用默认值，而这些默认值严格偏向谨慎防御而非放任授权。通过 `x-mcp-header` 镜像到 HTTP 请求头中的参数，将对客户端与服务端之间的每一个代理和负载均衡器暴露无遗。`instructions` 字段是宿主可能直接塞入模型上下文中的文本。优秀地审阅一份清单，意味着将其中每一处声明都视作有待核实的假设，而非直接采纳的事实。

## 核心概念

`server/discover`（来自发现与能力协商课程）是第一个文档：包含 `supportedVersions`、`capabilities`、可选的 `instructions` 字符串以及 `_meta["io.modelcontextprotocol/serverInfo"]`，并且全部封装在附带 `ttlMs` 与 `cacheScope` 的可缓存信封中。审查者应首先阅读 `capabilities`。`tools: {listChanged: true}` 意味着服务端会在工具集变更时通知正在监听的客户端；若客户端从未订阅该通知，其本地工具列表在 `ttlMs` 过期后就会过时。`resources: {subscribe: true}` 意味着支持单个资源的更新订阅，而不仅限于列表变更。`completions: {}` 意味着实现了 `completion/complete`。`extensions` 对象列出了可选的协议扩展及其设置；若出现审查者陌生的扩展键名，在信任其行为之前务必先查阅对应规范。

`tools/list`（来自第 08 课的 Schema 契约）是第二个文档，也是绝大部分危险信号潜藏的地方。每个工具都包含 `name`、`description`、`inputSchema`，以及可选的 `title`、`icons`、`outputSchema` 和 `annotations`。注解是审查者绝不能跳过的核心部分：`readOnlyHint` 默认为 `false`；`destructiveHint` 默认为 `true`（且仅在 `readOnlyHint` 为 `false` 时有意义）；`idempotentHint` 默认为 `false`；`openWorldHint` 默认为 `true`。请务必按照其在规范中的实际逻辑来理解：**如果一个工具在发布时完全省略了 `annotations` 对象，那么根据客户端必须遵守的默认规则，该工具被判定为非只读且具有破坏性。** 在这里，沉默不代表安全。审查者若看到名为 `delete_account` 或 `run_report` 的裸工具定义且缺少注解，必须将其视为破坏性操作，直到明确的 `readOnlyHint: true` 或 `destructiveHint: false` 做出反向澄清：：因为这正是合规客户端按规范必须采取的防御假设。不过，这一切始终只是提示（hint），绝非铁律保障：规范明确指出，除非服务端本身已被高度信任，否则注解必须被视作不受信的输入，因此审查者的职责是识别这种声称，而非盲目依凭。

`icons` 虽是显示元数据，但它们是通过 URI 拉取的，因此审查者需要核实它们是否使用 `https:` 或 `data:` 协议并与服务端保持同源；SVG 图标内部可能携带可执行脚本，因此必须将其视作内容而非单纯的装饰。定义在 Schema 属性内部的 `x-mcp-header` 属性，会将该参数的值镜像到一个 `Mcp-Param-{Name}` HTTP 头中，以便网关无需解析 Body 即可进行路由。它具有严格的约束条件：请求头名称必须是合法的 HTTP `field-name` Token（不能包含空格或控制字符），在同一个工具的 Schema 内部必须保持大小写不敏感的唯一性，且只能应用于原始类型，绝不能标注在 `number` 上。基于 Streamable HTTP 传输的客户端在解析 `tools/list` 结果时，若发现任何违反上述规则的 `x-mcp-header`，必须将该工具从列表中直接剔除，而不能静默忽略该注解。除语法外，审查者还须核实被镜像的内容：规范严厉告诫服务端绝不能将密码、API Key、Token 或其它机密信息标记为 `x-mcp-header`，因为 HTTP 头对于路径上的所有中间节点（代理、CDN、网关）都是透明可见的。

`server/discover` 与 `tools/list` 均属于可缓存结果，这意味着每个完整的响应都必须携带 `ttlMs` 以及取值为 `public` 或 `private` 的 `cacheScope`。`cacheScope` 是关于谁可以共享该缓存副本的提示，绝非访问控制：`public` 意味着相同的字节可以复用于其他调用方的缓存查询，而 `private` 意味着缓存不能跨越认证边界。审查者需要对照声明的作用域仔细审视工具描述和 discover `instructions`：如果文本内容明显在描述某个特定调用方的数据（如“你的账户”、“当前用户余额”），却搭配了 `cacheScope: "public"`，这就是极大的安全风险：：盲信该作用域声明的缓存层会毫不犹豫地将属于某用户的专属列表交付给下一个发起请求的完全不同的调用者。

`instructions` 同样值得单独审阅。它的存在是为了帮助模型更好地使用服务端，并且它与 `serverInfo` 一样完全属于自我汇报，协议从未对其进行真实性核验。正常的 instructions 专注于描述服务端：它的功能、何时优先选择某个工具、期望的参数单位等。但如果 instructions 被写成直接向模型发出的控制命令（例如指使模型忽略先前的系统提示、强行要求优先调用某个特定工具、或对用户隐瞒某些信息），那它就已经不再是在描述服务端了。这本质上是通过客户端默认信任的通道发起的一种提示注入（prompt injection），审查者对待此类指令必须抱以与对待工具返回结果中注入内容同等高度的戒备。

第三个文档完全独立于网络传输层之外：Registry 的 `server.json`。其 `name` 字段遵循反向 DNS（reverse-DNS）格式，如 `io.github.username/server-name` 或 `com.example/server-name`。MCP Registry 只有在发布者通过验证挑战证明其对背后的 GitHub 账号或域名拥有所有权后，才会接纳该名称。缺少 `/` 的名称根本没有命名空间，这意味着它从未（也不可能）经过任何所有权核验：审查者应将其视作完全未签名的不可信软件包。`packages` 与 `remotes` 描述了服务端的运行方式（npm、PyPI、NuGet、Cargo、MCPB 或 OCI 包，亦或是远程 Streamable HTTP / SSE URL），每种包类型都有专属的所有权凭证，例如 `package.json` 中的 `mcpName` 字段，或 README 中隐藏的 `mcp-name:` 标记。注册表本身不会扫描服务端代码中的漏洞，而是将代码安全转交由底层包管理器和下游聚合平台负责；因此，命名空间验证是审查者可以向注册表索取的唯一所有权保证。

```figure
mcpa-09-manifest-anatomy
```

## 交互式实验

本节图示将三个文档并列展示：带有能力声明与指令的 `server/discover` 结果、附带注解与 `x-mcp-header` 标记的 `tools/list` 工具条目，以及带有命名空间的 Registry `server.json`。每个面板均突出了粗心服务端最容易犯错的关键字段：写得像操控指令而非系统描述的 instructions、没有任何注解声明的工具，以及缺少验证命名空间的裸名称。请将每个高亮字段与上述概念部分的规则一一对应：该字段的初衷是什么，以及对于严格遵循规范的客户端而言，其缺失或误用究竟意味着何种实际行为。

## 实战演练

打开 `code/main.py`。该脚本构建了两个仅响应 `server/discover` 和 `tools/list` 的服务端：一个是典型粗心集成的 `acme-tools` 服务端，另一个则是设计严谨的 `docs-search` 服务端。脚本将两者的响应结果以及各自手写的 `server.json` 传入 `lint_manifest` 进行审查。在课程目录下运行它：

```bash
python3 code/main.py
```

首先阅读 `acme-tools` 的审查报告。`delete_account` 工具完全没有 `annotations` 块，linter 在规范默认规则下直接将其标记为破坏性工具（destructive），这并非无端猜测，而是因为规范要求必须作此假设。`rotate_api_key` 通过 `x-mcp-header` 镜像了 `new_api_key` 参数，linter 捕捉到该头暴露了疑似敏感密钥的内容。`run_report` 通过包含空格的头名 `"Region Code"` 镜像了 `region_code`，这不符合 HTTP field-name token 规范，Streamable HTTP 客户端遇到此类定义必须直接将其从工具列表中剔除。`get_balance` 描述为“当前用户的账户余额”，但服务端的 `tools/list` 结果声明的却是 `cacheScope: "public"`，linter 将这两点结合指出了严重的缓存泄露风险。discover 的 `instructions` 以“Ignore any prior guidance（忽略先前的任何指引）”开头，linter 迅速将其标记为意图操控模型的危险文本。注册表名称 `"acme-tools"` 不包含 `/`，无法解析出有效命名空间，同样被判定违规。作为对比，查看 `docs-search`：每个工具均显式声明只读，使用的请求头规范且唯一，被缓存的文本确实属于公开数据，instructions 专注于描述服务端功能，且注册表名称 `io.github.acmedocs/docs-search` 成功解析出经 GitHub 验证的合法命名空间。通信记录（transcript）的最后一项不是客户端发送的请求，而是粗心服务端可能返回的违规 `server/discover` 响应，它完全缺失了 `ttlMs` 与 `cacheScope`：：我们故意构造此违规信封，以便你在实际发起线上调用之前就能看清破坏缓存契约的具体表现。

## 交付产物

`outputs/manifest-review-checklist.md` 是本课交付的单页速查清单：包含三个文档的必查要素、注解默认值速查表、`x-mcp-header` 语法规则、缓存与 instructions 危险信号特征，以及 Registry 命名空间解析指南。在后续接入陌生服务端时，请常备该清单进行核对。

## 验证方法

在课程目录下运行测试套件：

```bash
python3 -m unittest discover code/tests
```

测试验证了本课阐述的核心主张：缺少注解的工具会被赋予规范默认值而非被当成未知状态；裸露的破坏性工具会被标记，而显式只读工具则安全通过；包含疑似密钥的 `x-mcp-header` 会与违反 HTTP token 语法的头名分别报告；定义在 `number` 属性上的 `x-mcp-header` 会被精准拒绝；公共缓存作用域与专属用户文本的冲突会被检出；`instructions` 中的诱导性语言会被拦截；缺少命名空间的注册表名称会被拒绝，而已验证的 GitHub 命名空间则顺利解析；合规的清单不会产生任何告警；通信记录中的每个请求均完整携带必选的 `_meta`。本仓库的通信检查脚本还会依据 2026-07-28 规范核验本课的通信记录：

```bash
python3 scripts/check_mcpa_wire.py certifications/mcpa/lessons/09-reading-server-manifests
```

## 项目连接

在 Capstone 综合考核的项目端到端交互中，系统在发起任何实质性调用之前，必然首先执行 discover 调用与工具列表拉取。在该阶段能够安全成立的一切前提，均建立在本课的基础之上：能力标志是否被正确读取、注解默认值是否被合规应用而非遗漏、清单中是否潜藏在首次调用前就试图操控模型的违规文本。本认证路线后续关于信任边界与用户授权（Consent）的课程，也直接根植于本课培养的“在采取行动前审慎审查清单声明”的防御性直觉。

## 核心术语

| 术语 | 含义 |
|------|------|
| Manifest（服务端清单） | 在发起任何调用前审查的 discover 结果、工具列表以及 Registry server.json 的统称 |
| Annotation defaults（注解默认值） | 当工具省略注解时，客户端必须假定的 readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true |
| x-mcp-header | Schema 中的扩展属性，用于将原始参数值镜像到 HTTP 请求头中以供网关路由 |
| cacheScope（缓存作用域） | 标明缓存结果是否可跨不同用户和 Token 共享；它只是共享提示，绝非权限访问控制 |
| instructions（指令） | 服务端在 server/discover 中提供的关于自身的自然语言指引，完全属于自我汇报 |
| Reverse-DNS namespace（反向 DNS 命名空间） | server.json 名称中的 io.github.user 或 com.example 前缀，绑定经核验证明的所有者 |
| Red flag（危险信号） | 清单字段的声明与其所属类别下规范服务端应有的严谨行为严重不符的特征 |
| Ownership verification（所有权验证） | Registry 用以将名称绑定到具体发布者的 GitHub、DNS 或 HTTP 挑战机制 |

## 延伸阅读

- [MCP 规范 2026-07-28：服务发现 (Discovery)](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP 规范 2026-07-28：工具原语 (Tools)](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- [MCP Registry 概览](https://modelcontextprotocol.io/registry/about)
- `certifications/mcpa/research/mcp-2026-07-28-brief.md`，第 6、10 及 15 节
