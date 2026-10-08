# 基于无状态协议的 MCP Apps

> 交互式结果本质上依然是 MCP tool 与 resource 的交换过程。2026-07-28 核心规范让这一交换过程完全自包含，而 Apps 扩展则进一步添加了沙箱化的浏览器运行界面。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 10 (resources)
**Time:** ~75 minutes

## 学习目标

- 通过 `server/discover` 与每请求扩展 capabilities 声明并协商 MCP Apps。
- 在 tool 被实际调用之前，在 tool 定义中声明 `ui://` resource。
- 在 2026-07-28 无状态连线上返回完整的 tool 与 resource 执行结果。
- 将 Apps 专用的 `ui/initialize` 桥接消息与已废弃的 MCP 核心握手严格区分开来。
- 综合应用源验证（origin validation）、沙箱隔离、内容安全策略（CSP）与最小权限原则。

## 问题

纯文本结果可以描述时间线，但无法给用户提供一个可以自由筛选、审查或交互操作的动态时间线。

MCP Apps 通过引入可选的扩展规范解决了界面展示难题。Tool 定义直接指向一个 `ui://` resource。Host 可以在 tool 运行之前预先拉取并安全审查该 resource，将其渲染在沙箱化的 iframe 中，并通过 JSON-RPC 桥接协议协调代理所有 app 操作。

核心协议在 2026-07-28 规范中发生了深刻变革。切勿将 App 包裹在旧式的连接生命周期中：

- 不存在核心的 `initialize` 请求或 `notifications/initialized` 通知。
- 不存在 `Mcp-Session-Id` 请求头。
- 每个请求都在 `params._meta` 中携带协议版本与 client capabilities。
- Server 必须实现 `server/discover`，以便 client 审查协议版本、核心 capabilities 与扩展支持。
- 每个成功结果均携带 `resultType` 判别器。
- Streamable HTTP 对每个请求使用单次 POST。对现代规范下的 GET 与 DELETE 入口直接返回 405。

Apps 桥接通信中依然包含名为 `ui/initialize` 的方法。它属于 iframe 与 host 之间的 postMessage 通信方言，绝不会复活任何核心 MCP 会话。

## 核心概念

### 两个协议层，一项完整特性

保持清晰的分层视角：

1. MCP 核心协议承载 `server/discover`、`tools/list`、`tools/call`、`resources/list` 以及 `resources/read`。
2. MCP Apps 扩展用于声明 UI，并定义 iframe 到 host 的桥接交互。
3. 浏览器沙箱规则严格限制该 UI 所能触及的边界。

扩展标识符为 `io.modelcontextprotocol/ui`。两端均采用选择性加入（opt-in）机制。Client 在每次请求的 capabilities 对象中声明其扩展支持：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "server/discover",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/ui": {}
        }
      },
      "io.modelcontextprotocol/clientInfo": {
        "name": "timeline-host",
        "version": "1.0.0"
      }
    }
  }
}
```

`clientInfo` 推荐用于诊断排错。它是自行声明的数据，绝非身份鉴权凭据。

### 渲染前发现声明

Server 的 discovery 结果声明其支持该扩展：

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {},
    "resources": {},
    "extensions": {
      "io.modelcontextprotocol/ui": {}
    }
  },
  "ttlMs": 300000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "timeline-app-server",
      "version": "2.0.0"
    }
  }
}
```

Server 必须支持 discovery。但 client 并非每次动作前都必须调用 discovery，因为每次动作都会自行携带自身 capabilities。

### 在 Tool 定义中声明 UI

现代 Apps 契约在 `tools/list` 中将 UI 绑定到具体的 tool：

```json
{
  "name": "notes_timeline",
  "description": "Render a timeline of notes.",
  "inputSchema": {
    "type": "object",
    "properties": {}
  },
  "_meta": {
    "ui": {
      "resourceUri": "ui://notes/timeline.html"
    }
  }
}
```

这被有意设计为调用前的静态元数据。Host 可以在实际调用结果要求展示 HTML 之前，预先加载、缓存并对该 HTML 进行安全审查。虽然兼容性代码可能仍然接受旧版的扁平元数据键，但新构建的 server 应当统一输出嵌套的 `_meta.ui.resourceUri` 结构。

在当前核心规范中 `tools/list` 是可缓存的。返回结果需包含确定性排序、`ttlMs` 以及 `cacheScope`。当可见的 tools 因用户或凭据不同而有所差异时，请使用 `private`。

### 返回数据，交由 Host 绑定视图

Tool 调用返回常规内容与结构化数据：

```json
{
  "resultType": "complete",
  "content": [
    {"type": "text", "text": "Timeline ready."}
  ],
  "structuredContent": {
    "notes": [
      {"id": "note-1", "title": "Discover", "created": "2026-07-28"}
    ]
  },
  "isError": false
}
```

Host 已经明确知晓该 tool 对应的视图是什么。避免为了重复声明 URI 而人为发明多余的内容块类型。

### 将 App 作为 Resource 提供服务

由于 server 在 discovery 中声明了 `resources`，因此必须实现强制性的 `resources/list` 操作。其确定性的列表条目包含规范 URI、稳定的名称、描述以及 MIME 类型。列表结果同样包含 `resultType`、server 身份元数据、`ttlMs` 和 `cacheScope`，正如确定性的 tool 列表一样。

Host 发送 `resources/read`。在 Streamable HTTP 上，请求具备如下结构：

```text
POST /mcp
MCP-Protocol-Version: 2026-07-28
Mcp-Method: resources/read
Mcp-Name: ui://notes/timeline.html
```

HTTP 头字段值与 JSON-RPC 正文必须严格保持一致。若不匹配，将触发协议错误 `-32020`。

返回结果包含 HTML resource 与缓存提示：

```json
{
  "resultType": "complete",
  "contents": [
    {
      "uri": "ui://notes/timeline.html",
      "mimeType": "text/html;profile=mcp-app",
      "text": "<!doctype html>...",
      "_meta": {
        "ui": {
          "csp": {
            "connectDomains": [],
            "resourceDomains": [],
            "frameDomains": [],
            "baseUriDomains": []
          },
          "permissions": {}
        }
      }
    }
  ],
  "ttlMs": 60000,
  "cacheScope": "public"
}
```

### 将 UI Resource 视作可执行内容进行缓存

App resource 与普通文本内容存在本质区别。它的缓存条目能够执行桥接代码、渲染 tool 数据并请求 host 代理的动作。在 `cacheScope` 为 private 时，缓存键必须包含规范化的 `ui://` URI、经准入的 server 身份与版本、resource 内容摘要以及鉴权上下文。绝不要跨主体复用私有的 App resource，因为即使 URI 完全相同，HTML 内部或其策略元数据也可能存在显著差异。

在以下情况下必须使缓存条目失效：`ttlMs` 到期、tool 的 `_meta.ui.resourceUri` 绑定发生变更、server 版本或准入描述符固定指纹变更，或者已确认的资源变更订阅中指定了该 URI。在重新挂载（remount）之前，必须重新拉取并重新进行 CSP 和权限审查。过期的 iframe 绝不能仅仅因为新版本的 resource 尚未加载完成就继续保留更宽泛的权限。

### 在评估特性策略前先拒绝协议歧义

校验逻辑具有严格的先后顺序：首先校验 JSON-RPC 格式，强制要求字符串协议元数据与对象类型的 client capabilities 映射表；接着核对路由请求头与正文内容是否一致；最后才判断匹配的协议版本是否受支持。这种顺序能够有效防止代理中间件与最终 server 对同一个请求做出存在分歧的不同解读。

| 异常情况 | HTTP 状态码 | JSON-RPC 错误 |
|---|---|---|
| 请求头与正文在版本、方法或名称上不一致 | 400 | `-32020` |
| 请求头与正文一致，但版本不受支持 | 400 | `-32022`，且 `data` 准确为 `{"supported":["2026-07-28"],"requested":"<实际版本>"}` |
| `resources/read` 缺少 Apps 扩展 capability | 400 | `-32021`，附带 `data.requiredCapabilities.extensions.io.modelcontextprotocol/ui` |
| 请求的方法未知 | 404 | `-32601` |

JSON-RPC notification 没有 `id`，因此 server 绝不能为其生成 JSON-RPC 响应。已接受的 HTTP notification 会返回带有空正文的 202。虽然错误可以改变 HTTP 状态码，但依然不能为 notification 生成 JSON-RPC 错误正文。

### 沙箱是防御边界，而非信任背书

Host 牢牢掌控着 iframe。App 无法直接读取 host 的 cookie、本地存储（local storage）或页面 DOM。所有特权操作都必须跨越桥接通道完成。

请遵循以下默认安全基线：

- 将所有 CSP 域名列表默认置空，仅添加 App 真正需要的来源（origin）。将 `connectDomains` 用于 fetch、XHR 和 WebSocket；将 `resourceDomains` 用于脚本、样式、图片与字体。
- 在可行的情况下，打包内联代码与资源数据。
- 除非有用户可见的功能明确需要，否则不申请摄像头、麦克风或地理位置权限。
- 将 `postMessage` 严格绑定到精确的对端 origin，拒绝来自其它任何 origin 的事件。
- 将 tool 参数、tool 结果、resource 文本以及桥接消息一律视为不可信输入。
- 将用户授权同意（user consent）保留在 host 侧。Iframe 绝不能自行批准其发起的重大影响操作。

不要将教程中死板固定的 `sandbox` 属性直接照搬到所有 host 中。Host 必须根据 App 的源模型及其自身的隔离设计来谨慎选择 sandbox 标志。

允许的域名依然属于数据外发信道。`connectDomains: ["https://api.example.com"]` 意味着任何在 App 内部执行的脚本都可以将受权数据发送到该地址。精确的 origin 匹配可以防范目标混淆，但无法判断有效载荷内容是否得当。默认保持 connect 访问为空，避免将 bearer token 放入 iframe，尽可能通过 host 代理细粒度操作，限制请求和响应大小，并审计究竟是哪项用户操作触发了每次出站请求。将 `resourceDomains` 与 `connectDomains` 分开对待；加载字体或脚本的权限绝不应赋予任意上传数据的权限。

### Apps 桥接通道具有独立的生命周期

Apps 桥接协议是建立在 `postMessage` 之上的 JSON-RPC 方言。它可以交换 `ui/initialize` 与 `ui/*` 通知，也可以代理类似核心协议的方法（例如 `tools/call`）。

View 发送带有 `appInfo` 和 `appCapabilities` 对象的 `ui/initialize`。Host 返回其 capabilities 与 host 上下文。仅在收到该响应之后，View 才会发送 `ui/notifications/initialized`。Host 必须等待该 Apps 通知送达后，才能向 View 发送消息。

这一本地握手为单个 iframe 与单个 host 窗口之间建立了桥梁。它并不负责协商 MCP 协议版本，不创建 server 状态，也不铸造传输层会话。请注意确切的前缀差异：核心协议中的 `notifications/initialized` 已被移除，而 Apps 扩展中的 `ui/notifications/initialized` 依然保留。通过桥接产生的 tool 调用所触发的核心请求，是一个拥有全新 JSON-RPC id 和完整请求元数据的、自包含的独立请求。

### Host 上下文、动作代理与权限撤销

在桥接通道完成初始化后，Host 依然保持最高权威。View 只能通过 host 明确声明的 capability 来请求 tool 动作、页面导航、剪贴板访问或其它特权效果。Host 会校验强类型的请求、当前用户、操作目标与参数，应用批准策略，并保留拒绝的权力。按钮点击与合法的桥接消息只代表意图表达，二者均不赋予实际权限。

将主题、尺寸与无障碍适配（accessibility）视为动态变化的 host 上下文，而非一次性的渲染输入：

- 应用 host 提供的颜色与排版 token，并在主题或对比度偏好变动时实时响应。
- 允许 View 上报其期望的尺寸，但由 host 限制并应用 iframe 尺寸，防止内容脱离布局或构造欺骗性遮罩层。
- 在 iframe 内部保持键盘导航顺序、可见焦点、无障碍名称、屏幕阅读器状态、充足的对比度、缩放支持以及减弱动画（reduced-motion）偏好。
- 在窗口调整大小和重新渲染后，重新测试 host 控件与 View 控件之间的焦点转移。

在 App 打开运行期间，由于用户切换账户、安全策略变更、server 遭遇隔离审查或 host 缩减了授权范围，相关 capabilities 可能会被中途撤销。必须在动作实际执行时校验 capability 与鉴权，而不仅在 `ui/initialize` 握手时检查。一旦权限撤销，应立即拒绝挂起的特权调用，终止不再符合策略的网络活动，清理敏感的已渲染状态，并在 UI resource 本身不再被准入时重新挂载或降级回退至文本模式。View 必须将拒绝视作正常结果妥善处理，切勿盲目重复重试直至 host 妥协。

### 降级回退是契约的必要组成部分

具备 Apps 感知能力的 server 必须依然能够服务未声明 UI 扩展的 host：

- 在 `tools/list` 中返回不带 `_meta.ui` 的相同 tool。
- 为 `tools/call` 保留有价值的普通文本结果。
- 对未声明 capability 的 host 读取 UI `resources/read` 时返回缺失 capability 错误。
- 在判断 tool 是否执行完成时，绝不假设 iframe 一定存在。

```figure
t3-ui-sandbox
```

## 手写实现

`code/main.py` 不依赖 SDK 构建了一个精简的进程内协议模型。它校验当前请求信封与 Streamable HTTP 路由字段值，通过 `server/discover` 声明 Apps 扩展，列出 tools 与 resources，执行 tool，并提供自包含的 HTML resource 服务。

该模型接收已完成解析的正文与路由头。它并非完整的 HTTP 适配器，不负责解析 `Content-Type` 或 `Accept`。完整的 Streamable HTTP 适配器请参阅第 09 课，它要求 `Content-Type: application/json` 且 `Accept` 同时包含 `application/json` 与 `text/event-stream`。

运行测试：

```bash
cd phases/13-tools-and-protocols/14-mcp-apps
python3 code/main.py
python3 -m unittest discover code/tests -v
```

检查输出中的五大核心特征：

1. 每次调用均完全独立。
2. 每个请求都携带 `_meta` capabilities。
3. `resources/list` 在执行任何 resource 读取前均返回稳定的描述符。
4. 每个结果均带有 `resultType` 和 server 身份元数据。
5. 不存在任何核心协议会话标识符。

## 使用与运行

从 `server/discover` 开始。确认 `io.modelcontextprotocol/ui` 出现在 server 的扩展映射表中。随后分别在携带与不携带 Apps capability 的情况下两次调用 `tools/list`：第一次响应会声明 resource 绑定，第二次则保持为可直接使用的纯文本 tool。

读取 `ui://notes/timeline.html`。在 HTML 中检索 `hostOrigin` 以及 `event.origin` 防护代码。这两行代码是证明桥接通道未采用通配符目标（wildcard target）的最小可见证据。

## 交付产物

本课交付 `outputs/skill-mcp-apps-spec.md`。在编写框架代码之前，可用它审查 App 契约。它强制设计者清晰说明当前核心信封、扩展协商、降级回退、UI resource、缓存策略、CSP、权限范围、桥接方法以及用户同意边界。

## 课后练习

1. 将 client capability 修改为空的扩展映射表。确认 `tools/list` 保留了该 tool，但移除了 UI 资源绑定。
2. 发送 `Mcp-Name: ui://notes/other.html`，但正文请求读取 timeline。确认返回错误 `-32020`。
3. 将 resource 的缓存属性修改为 `cacheScope: private`。描述促成这一配置的用户专属条件。
4. 将脚本移至 `https://static.example.com/app.js`。将该 origin 添加到 `resourceDomains` 中，并解释由此带来的新型供应链安全风险。
5. 增加一个 `notes_open` tool 并将按钮点击事件路由通过 host。确保用户批准环节始终保留在 host 侧。

## 关键术语

| 术语 | 含义 |
|------|---------|
| MCP Apps | 由 MCP host 渲染交互式 HTML 的可选扩展规范 |
| `io.modelcontextprotocol/ui` | 通信双方声明的扩展标识符 |
| `ui://` | 用于标识 App UI 模板的专用 resource scheme |
| `text/html;profile=mcp-app` | 用于 MCP App HTML 的标准 MIME 类型 |
| `server/discover` | 用于协议与 capability 发现的当前规范 RPC 方法 |
| `resources/list` | 当 server 声明支持 resources 时强制必须实现的资源枚举方法 |
| `resultType` | 现代协议规范中成功的返回结果所必须携带的判别器 |
| `ui/initialize` | Apps 桥接通道的首个请求，与已移除的核心协议握手完全独立 |
| `ui/notifications/initialized` | Apps View 在收到 host 响应后发出的就绪通知 |
| CSP | 用于限制脚本、样式、图片和网络 origin 的浏览器内容安全策略 |
| 文本降级（Text fallback） | 面向不支持 Apps 扩展的 host 所保留的 tool 基础行为 |

## 延伸阅读

- [MCP 2026-07-28 base protocol](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP Apps overview](https://modelcontextprotocol.io/extensions/apps/overview)
- [MCP Apps build guide](https://modelcontextprotocol.io/extensions/apps/build)
- [Official extension support matrix](https://modelcontextprotocol.io/extensions/client-matrix)
