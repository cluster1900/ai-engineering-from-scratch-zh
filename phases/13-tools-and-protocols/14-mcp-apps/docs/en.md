# 无状态协议上的 MCP Apps

> 交互式结果仍然是一次 MCP Tool 与 Resource 交换。2026-07-28 核心使该交换具备自包含性，而 Apps 扩展则添加了沙箱化的浏览器界面。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07（MCP server），Phase 13 · 10（resources）
**Time:** ~75 分钟

## 学习目标

- 通过 `server/discover` 和每个请求的扩展 capabilities 声明 MCP Apps。
- 在调用 Tool 之前，在 Tool 上声明 `ui://` Resource。
- 在 2026-07-28 无状态 wire 上返回完整的 Tool 和 Resource 结果。
- 将 Apps 的 `ui/initialize` bridge 消息与已移除的 MCP 核心握手区分开。
- 应用 origin 验证、沙箱、CSP 和最小权限原则。

## 问题

文本结果可以描述一条时间线，却无法为用户提供一条可以筛选、检查或操作的时间线。

MCP Apps 通过可选扩展解决了展示问题。Tool 定义指向一个 `ui://` Resource。host 可以在 Tool 运行之前获取并审查该 Resource，在沙箱化 iframe 中渲染它，并通过 JSON-RPC bridge 协调所有 App 操作。

核心协议已于 2026-07-28 发生变化。不要将 App 包装在旧的连接生命周期中：

- 不再存在核心 `initialize` 请求或 `notifications/initialized` 通知。
- 不再存在 `Mcp-Session-Id` header。
- 每个请求都在 `params._meta` 中携带协议版本和客户端 capabilities。
- 服务器实现 `server/discover`，使客户端能够检查版本、核心 capabilities 和扩展。
- 每个成功结果都具有 `resultType` 判别字段。
- Streamable HTTP 每个请求使用一个 POST。现代 GET 和 DELETE endpoint 返回 405。

Apps bridge 仍然有一个名为 `ui/initialize` 的方法。它属于 iframe postMessage 方言，并不会重新创建核心 MCP 会话。

## 概念

### 两种协议，一个功能

明确区分各个层级：

1. MCP 核心承载 `server/discover`、`tools/list`、`tools/call`、`resources/list` 和 `resources/read`。
2. MCP Apps 扩展声明 UI，并定义 iframe 到 host 的 bridge。
3. 浏览器沙箱规则限制 UI 可以访问的内容。

扩展标识符是 `io.modelcontextprotocol/ui`。通信双方都需要选择启用它。客户端在每个请求的 capabilities object 中发送扩展支持信息：

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

建议提供 `clientInfo` 以便诊断。它是自行报告的数据，不是授权身份。

### 渲染前先执行发现

服务器的发现结果会声明该扩展：

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

服务器必须支持发现。客户端不必在每次操作前调用发现，因为每个操作都会携带自身的 capabilities。

### 在 Tool 定义上声明 UI

现代 Apps 契约通过 `tools/list` 将 UI 绑定到 Tool：

```json
{
  "name": "notes_timeline",
  "description": "渲染笔记时间线。",
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

这是特意设计为调用前可用的元数据。host 可以在结果请求显示 HTML 之前预加载、缓存并对其进行安全审查。兼容性代码可以接受较旧的扁平元数据 key，但新服务器应该输出嵌套的 `_meta.ui.resourceUri` 形式。

在当前核心中，`tools/list` 可以缓存。应提供确定性顺序、`ttlMs` 和 `cacheScope`。当可见的 Tools 会因用户或 Token 而异时，请使用 `private`。

### 返回数据，然后让 host 绑定 View

Tool 调用返回常规内容和结构化数据：

```json
{
  "resultType": "complete",
  "content": [
    {"type": "text", "text": "时间线已就绪。"}
  ],
  "structuredContent": {
    "notes": [
      {"id": "note-1", "title": "发现", "created": "2026-07-28"}
    ]
  },
  "isError": false
}
```

host 已经知道哪个 View 属于该 Tool。不要仅仅为了重复 URI 而发明新的内容块。

### 将 App 作为 Resource 提供

服务器在发现过程中声明 `resources`，因此它还需要实现强制性的 `resources/list` 操作。其确定性列表条目包含规范 URI、稳定名称、说明和 MIME 类型。与确定性 Tool 列表一样，列表结果也包含 `resultType`、服务器身份元数据、`ttlMs` 和 `cacheScope`。

host 发送 `resources/read`。在 Streamable HTTP 中，请求包含：

```text
POST /mcp
MCP-Protocol-Version: 2026-07-28
Mcp-Method: resources/read
Mcp-Name: ui://notes/timeline.html
```

header 值必须与 JSON-RPC body 匹配。不匹配时会产生协议错误 `-32020`。

结果包含 HTML Resource 和缓存提示：

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

### 将 UI Resource 作为可执行内容缓存

App Resource 与普通说明文本不可互换。它的缓存条目可以执行 bridge 代码、渲染 Tool 数据，并请求由 host 协调的操作。缓存 key 应包含规范 `ui://` URI、获准的服务器身份和版本、Resource 内容摘要，以及当 `cacheScope` 为 private 时的授权 Context。绝不能跨 principal 复用 private App Resource，因为即使 URI 相同，HTML 或其策略元数据也可能不同。

当其 `ttlMs` 到期、Tool 的 `_meta.ui.resourceUri` 绑定发生变化、服务器版本或获准描述符的固定值发生变化，或已确认的 Resource 变更订阅指定该 URI 时，使缓存条目失效。重新挂载之前，重新获取并再次执行 CSP 和权限审查。不能仅仅因为新的 Resource 版本尚未加载，就让过期 iframe 继续保留更宽泛的权限。

### 在功能策略之前拒绝 wire 歧义

验证需要遵循特定顺序。首先验证 JSON-RPC 结构，并要求协议元数据为字符串、客户端 capability map 为 object。接着比较路由 header 与 body。只有完成这些步骤之后，才能判断匹配的协议版本是否受支持。此顺序可以防止代理和服务器以不同方式解释请求。

| 条件 | HTTP | JSON-RPC 错误 |
|-----------|------|----------------|
| header 与 body 中的版本、方法或名称不一致 | 400 | `-32020` |
| header 与 body 一致，但使用不受支持的版本 | 400 | `-32022`，其 `data` 必须准确为 `{"supported":["2026-07-28"],"requested":"<actual>"}` |
| `resources/read` 缺少 Apps 扩展 capability | 400 | `-32021`，并附带 `data.requiredCapabilities.extensions.io.modelcontextprotocol/ui` |
| 方法未知 | 404 | `-32601` |

JSON-RPC 通知没有 `id`，因此服务器绝不会为其生成 JSON-RPC 响应。被接受的 HTTP 通知会返回空 body 的 202。错误可以改变 HTTP 状态，但仍然不能为通知创建 JSON-RPC 错误 body。

### 沙箱是一道边界，而不是信任判定

host 控制 iframe。App 无法直接读取 host cookie、local storage 或页面 DOM。所有特权操作都必须通过 bridge。

使用以下默认设置：

- 将所有 CSP domain 列表留空，然后只添加 App 所需的 origin。将 `connectDomains` 用于 fetch、XHR 和 WebSocket；将 `resourceDomains` 用于脚本、样式、图像和字体。
- 在可行时将代码和数据打包在一起。
- 除非某项可见功能确实需要，否则不要请求摄像头、麦克风或位置权限。
- 将 `postMessage` 固定到准确的对端 origin，并拒绝来自所有其他 origin 的事件。
- 将 Tool 参数、Tool 结果、Resource 文本和 bridge 消息视为不可信输入。
- 将用户同意机制保留在 host 中。iframe 不能自行批准会产生实质影响的操作。

不要把教程中固定的 `sandbox` attribute 复制到每个 host 中。host 必须根据 App 的 origin 模型和自身的隔离设计来选择 flag。

允许访问的 domain 仍然是数据外泄路径。`connectDomains: ["https://api.example.com"]` 意味着在 App 内执行的任何脚本都可以将获准的数据发送到该地址。精确匹配 origin 可以避免目标混淆，但不能判断 payload 是否合适。默认保持 connect 访问权限为空，避免将 bearer Token 放入 iframe，在可行时通过 host 代理范围明确的操作，限制响应和请求大小，并审计每个出站请求是由哪个用户操作触发的。应分别对待 `resourceDomains` 和 `connectDomains`；加载字体或脚本的权限不应授予任意数据上传能力。

### Apps bridge 拥有自己的生命周期

Apps bridge 是一种通过 `postMessage` 传输的 JSON-RPC 方言。它可以交换 `ui/initialize` 和 `ui/*` 通知，也可以代理类似核心协议的方法，例如 `tools/call`。

View 使用 `appInfo` 和 `appCapabilities` object 发送 `ui/initialize`。host 返回自己的 capabilities 和 host Context。只有在收到该响应之后，View 才会发送 `ui/notifications/initialized`。host 必须等待这条 Apps 通知，然后才能向 View 发送消息。

该本地握手会在一个 iframe 和一个 host frame 之间创建 bridge。它不会协商 MCP 协议版本、创建服务器状态或生成传输会话。请注意准确的前缀：核心 `notifications/initialized` 已被移除，而 Apps 的 `ui/notifications/initialized` 仍然保留。由 bridge Tool 调用生成的核心请求是一个新的自包含请求，具有新的 JSON-RPC id 和完整的请求元数据。

### Host Context、操作与撤销

bridge 初始化完成后，host 仍然是权威方。View 只有通过 host 声明的 capability，才能请求 Tool 操作、导航、剪贴板使用或其他特权效果。host 会验证类型化请求、当前用户、目标和参数，应用审批策略，并且可以拒绝请求。按钮点击和有效的 bridge 消息只能表达意图；二者都不会授予权限。

应将主题、尺寸和无障碍设置视为不断变化的 host Context，而不是一次性的渲染输入：

- 应用 host 提供的颜色和字体排版 Token，然后在主题或对比度偏好发生变化时作出响应。
- 允许 View 报告期望尺寸，但由 host 限制并应用 iframe 尺寸，使内容无法越过其布局或创建欺骗性覆盖层。
- 在 iframe 内保留键盘顺序、可见焦点、无障碍名称、屏幕阅读器状态、足够的对比度、缩放和减少动态效果的行为。
- 在调整尺寸和重新渲染后，重新测试 host 控件与 View 控件之间的焦点转移。

App 打开期间，capabilities 可能因用户切换账号、策略变化、服务器被隔离或 host 缩小同意范围而被撤销。应在操作执行时检查 capability 和授权，而不是只在 `ui/initialize` 期间检查。撤销发生时，拒绝待处理的特权调用，停止不再符合策略的网络活动，清除已渲染的敏感状态；当 UI Resource 本身不再获准时，重新挂载或回退到文本模式。View 必须将拒绝作为正常结果处理，不能反复重试直到 host 让步。

### 回退是契约的一部分

支持 Apps 的服务器仍然可以服务未声明 UI 扩展的 host：

- 在 `tools/list` 中返回相同的 Tool，但不包含 `_meta.ui`。
- 为 `tools/call` 保留有用的文本结果。
- 对 UI 的 `resources/read` 返回缺少 capability 的错误。
- 判断 Tool 是否完成时，绝不能假设 iframe 存在。

```figure
t3-ui-sandbox
```

## 构建它

`code/main.py` 在不使用 SDK 的情况下构建一个小型进程内协议模型。它会验证当前请求 envelope 和 Streamable HTTP 路由值，通过 `server/discover` 声明 Apps，列出 Tools 和 Resources，执行 Tool，并提供一个自包含 HTML Resource。

该模型接收已经解析的 body 和路由 header。它不是完整的 HTTP adapter，也不解析 `Content-Type` 或 `Accept`。完整的 Streamable HTTP adapter 请参阅第 09 课；该 adapter 要求 `Content-Type: application/json`，并要求 `Accept` 值同时包含 `application/json` 和 `text/event-stream`。

运行：

```bash
cd phases/13-tools-and-protocols/14-mcp-apps
python3 code/main.py
python3 -m unittest discover code/tests -v
```

检查输出中的四点：

1. 每次调用都相互独立。
2. 每个请求都包含 `_meta` capabilities。
3. `resources/list` 会在读取任何 Resource 之前返回稳定的描述符。
4. 每个结果都包含 `resultType` 和服务器身份元数据。
5. 不会出现核心会话标识符。

## 使用它

从 `server/discover` 开始。确认服务器扩展 map 中出现 `io.modelcontextprotocol/ui`。然后调用两次 `tools/list`，一次带有 Apps capability，另一次不带。第一个响应声明 Resource。第二个仍然是可用的纯文本 Tool。

读取 `ui://notes/timeline.html`。在 HTML 中搜索 `hostOrigin` 和 `event.origin` guard。这两行是 bridge 未使用通配符目标的最低限度可见证据。

## 交付它

本课交付 `outputs/skill-mcp-apps-spec.md`。在编写框架代码之前，使用它审查 App 契约。它要求作者明确说明当前核心 envelope、扩展协商、回退、UI Resource、缓存策略、CSP、权限、bridge 方法和同意边界。

## 练习

1. 将客户端 capability 改为空的扩展 map。确认 `tools/list` 保留 Tool，但移除 UI 绑定。
2. 发送 `Mcp-Name: ui://notes/other.html`，同时在 body 中读取时间线。确认错误 `-32020`。
3. 将 Resource 改为 `cacheScope: private`。说明证明这一设置合理的用户特定条件。
4. 将脚本移动到 `https://static.example.com/app.js`。将该 origin 添加到 `resourceDomains`，并解释新增的供应链风险。
5. 添加 `notes_open` Tool，并通过 host 路由按钮点击。将用户审批保留在 host 中。

## 关键术语

| 术语 | 含义 |
|------|---------|
| MCP Apps | 用于在 MCP host 中渲染交互式 HTML 的可选扩展 |
| `io.modelcontextprotocol/ui` | 由通信双方共同声明的扩展标识符 |
| `ui://` | App UI 模板使用的 Resource scheme |
| `text/html;profile=mcp-app` | MCP App HTML 的 MIME 类型 |
| `server/discover` | 当前用于发现协议和 capability 的 RPC |
| `resources/list` | 服务器声明 resources 时必须提供的 Resource 列表方法 |
| `resultType` | 现代成功结果所必需的判别字段 |
| `ui/initialize` | 第一个 Apps bridge 请求，与已移除的核心初始化分离 |
| `ui/notifications/initialized` | host 响应后由 Apps View 发送的就绪通知 |
| CSP | 限制脚本、样式、图像和网络 origin 的浏览器策略 |
| 文本回退 | 为不支持 Apps 的 host 保留的 Tool 行为 |

## 延伸阅读

- [MCP 2026-07-28 基础协议](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP Apps 概览](https://modelcontextprotocol.io/extensions/apps/overview)
- [MCP Apps 构建指南](https://modelcontextprotocol.io/extensions/apps/build)
- [官方扩展支持Matrix](https://modelcontextprotocol.io/extensions/client-matrix)
