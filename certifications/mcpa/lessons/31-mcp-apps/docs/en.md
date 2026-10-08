# 会话内部的交互式界面 (Interactive Interfaces Inside the Conversation)

> 工具的执行结果绝不局限于纯文本：服务器可以指向一个小巧的 HTML 交互界面，并允许宿主环境在当前正在发生的对话流中，以安全沙箱的形式将其原生渲染展示。

**Type:** Reference
**Languages:** Python
**Prerequisites:** Lesson 30
**Time:** ~45 minutes

## 学习目标

- 阐述交互式界面相比工具常规返回的纯文本或结构化内容所带来的增强价值，并准确识别引入该特性的高价值业务场景。
- 在单次请求粒度协商 `io.modelcontextprotocol/ui` 扩展，并追踪从工具定义中的 `_meta.ui.resourceUri` 到发起标准 `resources/read` 读取 `ui://` 资源的全流程。
- 解析 UI 资源的 `_meta.ui.csp` 域名清单与 `_meta.ui.permissions` 权限标志位，构建宿主必须强制执行的内容安全策略 (CSP)，包括严格的默认兜底规则。
- 强制实施工具的 `visibility` 可见性隔离策略，确保智能体自身的工具列表与应用内部的 `tools/call` 请求各自只能感知其被允许访问的工具子集。
- 深入剖析沙箱化 iframe 安全架构、应用至宿主的 Bridge 桥接通信机制，并阐明为何由应用前端发起的工具调用依然必须跨越人类同意边界。
- 设计完善的优雅降级方案，确保具备 UI 渲染能力的工具在面对未声明该扩展的宿主时依然能够平稳运转。

## 问题背景

一个响应“展示各地区销售业绩”的报表工具，既可以返回一段包含各种数字的自然语言段落，也可以返回一个被 `structuredContent` 包裹的结构化小表格。然而，这两种方式都无法让用户直接点击某一区域进行数据下钻、将鼠标悬停在柱状图上查看精准数值，或在不同指标维度之间自由切换，除非用户愿意针对每一次点击都让大模型重新调用一遍底层工具。对于配置类工具，从反方向看也会遭遇同样的体验天花板：把“部署在哪个可用区、选择多大规格实例、是否开启自动伸缩”变成一问一答的多轮对话，其交互效率与容错率远远落后于一个预先展示了默认值与即时参数校验、供用户一次性填写的图形表单。

对于绝大多数常规工具而言，纯文本与结构化内容依然是最轻量高效的表达载体。但它们留下的体验空白虽然狭窄却十分真实：那就是用户渴望自主探索而非仅仅被动阅读的数据结果，以及用户希望全局一览、自主勾选而非逐一被动问答的决策表单。MCP Apps 扩展正是为了填补这一空白而诞生的可选扩展，它既没有发明新的底层传输协议，也没有在 MCP 旁边另立门户建立第二套规范；相反，它完美复用了本课程已经掌握的两个核心原语（Tool 与 Resource），并为宿主环境如何安全渲染抓取到的内容补充了一套严谨的安全运行时规则。

## 核心概念

### 扩展协商与 UI 资源绑定

该扩展的标准唯一标识符为 `io.modelcontextprotocol/ui`。它的协商流程完全遵循我们在第 30 课中探讨的通用每请求协商法则：客户端在每次发出的请求元数据中通过 `io.modelcontextprotocol/clientCapabilities.extensions` 声明对该扩展的支持，而服务器则在其 `server/discover` 端点的发现响应中通过 `capabilities.extensions` 声明自身的实现支持。扩展声明不依赖任何历史请求；它是每请求独立的，正如协议版本号及其他一切能力一样。

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "server/discover",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {"io.modelcontextprotocol/ui": {}}
      }
    }
  }
}
```

支持该扩展的服务器会在响应中声明相同的标识符，同时伴随其常规的 `tools` 和 `resources` 能力。这一响应同样客观反映服务器自身的能力，不随调用方的声明而变化：`server/discover` 负责告知服务器能做什么，客户端通过取交集来确定当前真正可用的能力子集。一个从未声明该扩展的普通宿主会收到完全相同的发现报文，只是它绝不会去处理那些它自身未实现的扩展部分。

具备 UI 交互能力的工具会在其工具定义中额外携带一个字段：`_meta.ui.resourceUri`，指向一个以 `ui://` 为协议头的特殊资源 URI。这是静态的单工具元数据，属于每个客户端在 `tools/list` 中都会收到的标准内容的一部分，并不因人而异。由于这种绑定关系在工具被调用之前就已经完全透明暴露，宿主环境完全可以在大模型决定调用该工具之前，提前完成资源的预加载与安全复审，而无需等到调用发生的瞬间才仓促应对。

### 双向可见性控制：模型可见与应用可见

工具的 `_meta.ui` 还可以携带一个 `visibility` 数组；当该字段缺省时，默认取值为 `["model", "app"]`：
- 对 `"model"` 可见的工具，是大模型智能体能够感知并在对话中自主决定调用的常规工具（即第 11 课以来学习的标准工具形态）。
- 对 `"app"` 可见的工具，则是渲染出来的 HTML 应用前端自身能够通过桥接通道直接发起的工具，调用过程无需模型参与轮次交互。

这两项是宿主环境在两份独立清单上严格把关的独立安全网关：
- 如果一个工具的可见性配置剔除了 `"model"`，它将**绝对不会**出现在呈现给大模型的工具列表中；
- 如果一个工具剔除了 `"app"`，模型依然可以像往常一样看到并调用它，但宿主会坚决拦截任何由前端 App 试图针对该工具发起的 `tools/call` 请求；
- 另外，任何跨服务器调用 App 专属工具的企图（即发起调用的 App 所在的服务器与目标工具所在的服务器不匹配），无论配置了何种可见性，都将被宿主就地彻底阻断。

### 抓取 UI 资源与严格 MIME 校验

获取该 UI 资源无需使用任何特殊方法。宿主通过现成的 `resources/read` 接口发起读取，与读取普通资源别无二致。但是，返回的内容必须严格满足一个致命条件：其 `mimeType` 必须精确等于 `text/html;profile=mcp-app`。

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "resultType": "complete",
    "contents": [
      {
        "uri": "ui://dashboard/sales-by-region.html",
        "mimeType": "text/html;profile=mcp-app",
        "text": "<!doctype html>...",
        "_meta": {
          "ui": {
            "csp": {
              "connectDomains": ["https://api.sales-metrics.example"],
              "resourceDomains": ["https://cdn.trusted-charts.example"]
            },
            "permissions": {"camera": {}, "geolocation": {}},
            "prefersBorder": true
          }
        }
      }
    ],
    "ttlMs": 60000,
    "cacheScope": "public"
  }
}
```

这里的 `profile=mcp-app` 参数是唯一将该文档标记为“可由宿主沙箱渲染的受控 App”而非“普通浏览器网页”的技术依据。任何返回普通 `text/html` 的资源，无论其 HTML 结构多么完整合规，都坚决不得作为 App 予以渲染；严谨的宿主在每次抓取后都必须严格校验 MIME 类型，绝不能仅凭 `ui://` 协议头就轻信内容性质。

### 内容安全策略 (CSP) 与沙箱权限控制

UI 资源内部携带了指导宿主如何渲染它的安全元数据，全部位于 `_meta.ui` 中。`csp` 是一个结构化对象而非扁平字符串：
- `connectDomains`：限制 fetch、XHR 与 WebSocket 的出站通信域名；
- `resourceDomains`：限制加载脚本、样式、图片及字体的合法来源域名；
- `frameDomains`：限制嵌套 iframe 的来源域名；
- `baseUriDomains`：限制文档自身的基准 URI。

所有字段均为可选。规范要求宿主必须（MUST）严格依据资源显式声明的域名来装配最终的内容安全策略 (CSP)，且绝不准（MUST NOT）放行任何资源未曾声明的域名。请注意：声明了某个域名并不代表必然能获得该权限，因为宿主完全可以依据自身更严格的本地安全策略对其进一步收紧。如果资源完全省略了 `csp` 字段，宿主必须强制回退到极其保守的默认防御策略：全面阻断同源内容以外的一切网络请求，严禁任何外部出站网络连接，仅允许内联脚本与样式。未声明 `frameDomains` 恒等同于 `frame-src 'none'`；未声明 `baseUriDomains` 恒等同于 `base-uri 'self'`。宿主应当对最终装配出的 CSP 字符串进行持久化审计留痕。

`permissions` 是第二个权限对象，包含一组可选的空对象标志位：`camera`、`microphone`、`geolocation`、`clipboardWrite`。宿主可以根据本地策略，通过配置 iframe 的 `allow` 属性选择性放行某些硬件权限；App 绝不应假定申请的权限必然获批，而必须像常规现代网页那样在权限被拒时平稳降级运行。UI 的渲染过程绝不会因为缺少某项硬件权限而中断。

### 沙箱架构与跨 Bridge 调用的同意网关

一旦渲染完成，App 与宿主之间通过基于 `postMessage` 的专有 JSON-RPC 通信协议进行交互，该通道完全独立于客户端与服务器之间的底层网络链路。在这个专有通道中，部分报文与核心协议同名（如 `tools/call`），多数则带有 `ui/` 前缀（如用于建立本地双向通道的 `ui/initialize`）。请注意：这个本地初始握手与 2026-07-28 规范中早已废除的旧版核心 `initialize` 握手毫无关系：它不协商协议版本、不创建持久连接会话，也绝不触碰核心客户端与服务器之间的无状态通信报文。当宿主本身是一个 Web 页面时，规范严禁（MUST NOT）宿主页面与 App 视图直接跨域通信：宿主必须将视图包裹在一个与自身主域名完全不同的独立源 (Origin) 的中间沙箱代理 (Sandbox Proxy) 中，由该代理负责在两端安全转发 Bridge 消息。

通过该 Bridge 桥接，App 可以请求宿主代表其发起一次工具调用（前提是目标工具的可见性包含了 `"app"`）。但真正拥有最终决定权的依然是宿主应用：宿主在收到请求后，必须将其视为一次全新发起的标准 `tools/call`，生成全新的 ID 与完整的 `_meta`，并**强制经过与普通模型调用完全相同的人类同意 (Consent) 确认流程**；宿主甚至可以直接当场拒绝。iframe 内部的代码绝对无权擅自批准任何可能产生实质后果的副作用操作；它只能发起申请，决定权永远在宿主手中。

这也正是选择 MCP Apps 而非简单嵌入外部网页的核心安全逻辑所在：iframe 无法读取宿主页面的 Cookie、本地存储或 DOM 树，也无法操控父级页面跳转或在宿主上下文中注入脚本；每一项特权操作都必须穿过由宿主严格监管的通信桥梁。这种严密的安全隔离，使得宿主能够放心地将来自第三方服务器的代码在界面上渲染出来，正如它处理不可信的工具执行结果一样，始终坚守第 22 课所确立的信任边界准则。

当然，这一切绝非工具运行的强制前提：具备 UI 渲染能力的工具在每次被调用时，仍然必须返回具有独立业务价值的普通文本 `content`。对于从未声明过 UI 扩展的普通宿主，系统完全跳过读取 `ui://` 资源的过程，直接消费文本内容；双方在无缝兼容中实现优雅降级。

```figure
mcpa-31-app-sandbox
```

## Interactive Lab (交互式实验)

上方的架构图同时展示了一次工具调用在双端协商下的两条执行分支：
- 在左侧分支中，声明了 UI 扩展的宿主通过常规的 `resources/read` 读取工具在 `_meta.ui.resourceUri` 中指定的资源，严格核验 MIME 类型，依据声明域名结合本地安全策略装配出严格的 CSP，并在沙箱化 iframe 中安全渲染视图；图中的虚线清晰标明了关键安全门禁：即使是由 App 前端代码直接发起的工具调用，在满足工具自身可见性的前提下，依然必须越过人类同意确认网关，随后方可发往后端服务器。
- 在右侧分支中，从未声明 UI 扩展的普通宿主在收到常规的 `tools/call` 结果后直接止步，仅提取并展示工具返回的纯文本内容，自始至终绝不触碰任何底层资源。

## Practice Lab (实战演练)

打开 `code/main.py`。该程序构建了一个独立的服务器，暴露了绑定到同一个仪表盘视图的三个典型工具：`sales_by_region`（默认可见性，模型与应用皆可见）、`refresh_sales_view`（`visibility: ["app"]`，对大模型隐蔽，仅供前端视图刷新）、以及 `export_sales_report`（`visibility: ["model"]`，仅供大模型调用，禁止前端 App 触碰）。同时暴露了四个资源：标准的 `ui://` 真实视图、一个返回普通 `text/html` 而非 App Profile 的缺陷部件 `legacy-widget`、一个 CSP 声明域名超出宿主本地白名单的非法部件 `scripts-widget`，以及一个完全省略了 `csp` 字段的最小化部件 `minimal-widget`。

```bash
python3 code/main.py
```

代码中的 `HostAppLoader.load` 分别在声明扩展与未声明扩展的两种情境下，对同一个工具执行了完整的加载决策，终端清晰输出了两套可直接对比的执行计划：一套是 `{"mode": "app", ...}`，基于真实的 `resources/read` 构建，携带着动态生成的完整 `csp` 规则串以及被严格裁减为宿主白名单真子集的 `grantedPermissions`；另一套则是 `{"mode": "text", ...}`，根本不会向服务器发起资源读取请求。函数 `review_app_resource` 与 `build_csp` 分别针对两类缺陷资源与最小化资源展开了专项检测，并在控制台以纯文本逐一解释了各项检测失败的具体原因或生效的默认安全策略。在程序末尾，`request_tool_call_from_app` 演示了两道独立的防御关卡：针对 `export_sales_report` 的调用因为可见性缺少 `"app"` 在触及同意流程前被直接就地拒绝；而针对 `refresh_sales_view` 的调用在遭遇用户拒绝时被当场终止，在获得用户批准后则携带全新 ID 顺利转发至服务端。仔细比对这两次调用的请求报文，验证每次请求均完整携带各自独立的 `_meta` 与扩展声明，无任何跨调用状态残留。

## Shipped Artifact (交付产物)

`outputs/mcp-apps-review-checklist.md` 是一份单页架构审查清单：系统整理了在信任并渲染一个 `ui://` 资源之前必须执行的完整检查项；规范了 UI 工具必须保留的纯文本兜底准则；并提供了一份决策矩阵，将各项检测结果映射为“正常渲染”、“平稳降级”或“彻底拦截”。当你在工具定义中引入 `_meta.ui` 时，请务必参照本清单进行技术审查。

## Verify It (验证方法)

在课程根目录下执行单元测试：

```bash
python3 -m unittest discover code/tests
```

测试套件全面验证了本课的各项论断：扩展唯有在双端共同声明时才会被激活；工具的 UI 绑定关系无论调用者是谁均如实呈现在 `tools/list` 中；省略的 `visibility` 默认赋值为 `["model", "app"]`；大模型自身的工具列表坚决排除仅供 App 调用的工具；感知 App 的宿主通过标准 `resources/read` 解析资源；未声明扩展的宿主直接平稳回退至纯文本并完全跳过资源读取；MIME 类型错误的资源即胜利读取也会被安全拒绝；CSP 声明域名违规的资源会被精准拦截并指明违规域名；`build_csp` 能正确装配指令并在缺省时回退至极度严格的默认策略；授予的硬件权限绝不超出宿主自身白名单边界；被拒绝的 App 端工具调用绝不发出物理报文；获批的调用携带全新 ID 正常转发；针对无 App 权限工具的发起源头拦截发生在请求同意之前；请求未知资源返回标准协议错误；且所有可缓存结果均附带合法的 `ttlMs` 与 `cacheScope`。仓库的报文检查器同样会验证通信日志是否完全符合 2026-07-28 规范：

```bash
python3 scripts/check_mcpa_wire.py certifications/mcpa/lessons/31-mcp-apps
```

## Capstone Connection (项目连接)

在 Capstone 综合大作业的端到端全流程考核中，考官可能会在调用链路中加入具备 UI 交互能力的工具。本课探讨的每一个问题在此时都将成为答辩考点：本次请求在线路上是否真正完成了扩展的协商？抓取到的资源在真正渲染之前是否严格核验了标准的 MIME 类型？以及由前端界面触发的工具调用是否依然穿过了 Capstone 统一要求的人类同意授权网关。

## 关键术语 (Key Terms)

| 术语 | 定义说明 |
|------|---------|
| MCP Apps | 允许工具指向由宿主在沙箱中渲染的 HTML 交互界面的可选协议扩展 |
| `io.modelcontextprotocol/ui` | 客户端与服务器双方用于协商启用 MCP Apps 特性的标准扩展标识符 |
| `ui://` | 专门为交互式 App UI 资源保留的专用 URI 协议头 |
| `_meta.ui.resourceUri` | 工具定义中用于指向其配套 `ui://` 资源地址的元数据字段 |
| `text/html;profile=mcp-app` | 唯一能够合法将资源标记为可渲染交互式 App 的精准 MIME 类型 |
| `_meta.ui.csp` | 包含出站与资源加载域名的对象，宿主据此装配实际执行的内容安全策略 |
| `_meta.ui.permissions` | 包含硬件与敏感权限标志位的对象，宿主可依据本地策略决定是否授权给 iframe |
| `visibility` | 工具的可见性配置数组，默认为 `["model", "app"]`，独立控制模型与前端 App 的调用权限 |
| Sandboxed iframe | 宿主渲染 App 所采用的隔离沙箱容器，严密阻断对宿主主页面 DOM 与敏感数据的直接访问 |
| Sandbox proxy | Web 宿主与视图之间必须强制采用的异源中间代理，用于中继转发桥接消息 |
| App-to-host bridge | 基于 `postMessage` 构建的专属 JSON-RPC 通信桥梁，独立于底层的客户端-服务器连接 |
| Text fallback（文本降级） | 具备 UI 能力的工具为不支持该扩展的普通宿主所保留的纯文本 `content` 兜底响应 |

## 延伸阅读 (Further Reading)

- [MCP Apps 扩展总览](https://modelcontextprotocol.io/extensions/apps/overview)。
- [构建 MCP App 官方实战指南](https://modelcontextprotocol.io/extensions/apps/build)。
- [SEP-1865: MCP Apps 规范增强提议](https://modelcontextprotocol.io/seps/1865-mcp-apps-interactive-user-interfaces-for-mcp)。
- [MCP Apps 规范定义 (2026-01-26)](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)。
- `certifications/mcpa/research/mcp-2026-07-28-brief.md`，第 14 节。
- `phases/13-tools-and-protocols/14-mcp-apps`，深入探索构建完备的请求-资源服务器及 Streamable HTTP 严格适配器。
