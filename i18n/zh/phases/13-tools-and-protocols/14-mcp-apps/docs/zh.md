# 基于无状态协议的MCP应用程序

> 交互式结果本质上仍然是MCP工具与资源交换过程.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 10 (resources)
**Time:** ~75 minutes

## 学习目标

- 通过`server/discover`与每一个请求扩展能力 声明并协商MCP应用程序──
- 在工具被实际调用之前,在工具定义中声明`ui://`资源
- 在2026-07-28 无状态连线上返回完整的工具与资源 执行结果.
- 将应用程序专用`ui/initialize`桥接消息与废弃的MCP核心握手严格分开来.
- 综合应用源验证 (原始验证) 沙箱隔离 (沙箱隔离) 内容安全策略 (CSP) 与最小权限原则

## 问题

纯文本结果可以描述时间线,但不能给用户提供一个可以自由选择,审查或交互操作的动态时间线.

通过引入可选扩展规范解决界面展示难题.`ui://`资源: 机器人可以在工具运行之前预先取并安全审查该资源,将其染在沙箱化的iframe中,并通过JSON-RPC 桥接协议协调代理所有应用程序操作.

核心协议在2026-07-28 规范发生了深刻的变化.

- 没有核心`initialize`求你`notifications/initialized`通知.
- 没有`Mcp-Session-Id`求你,请你.
- 每个请求都在`params._meta`中携带协议版本与客户端功能.
- 服务器必须实现`server/discover`为了客户端 审查协议版本,核心能力和扩展支持.
- 每个成功结果都带来了`resultType`判别器.
- 流式 HTTP 对每一个请求使用单次 POST──对现代规范下 GET 与 DELETE 入口直接返回 405──

应用程序 桥接通信中仍包含名为 `ui/initialize`方法──它属于iframe和主机之间的邮件Message 通信方言,绝不会恢复任何核心MCP 会话──

## 核心概念

### 两个协议层,一个完整的特性

保持清晰的分层视角:

1. 核心协议承载`server/discover`,我知道.`tools/list`,我知道.`tools/call`,我知道.`resources/list`及`resources/read`,我知道.
2. 扩展用于声明UI,并定义iframe到主机的桥接交互.
3. 浏览器沙箱规则严格限制该UI所触及的边界.

扩展标识符为`io.modelcontextprotocol/ui`△两端均采用选择性加入 (opt-in) 机制──客户在每次请求的能力中对象表示其扩展支持:

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

`clientInfo`推用于诊断排错. 它是自发声明的数据,绝对不是身份识别权证书.

### 染前发现声明

服务器的发现结果表示支持此扩展:

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

服务器必须支持发现,但客户端并非必须调用发现,因为每个动作都会自行携带自己的能力.

### 在工具定义中声明 UI

现代应用程序 契约在`tools/list`中将 UI 绑定到具体的工具:

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

它是为了调用前的静态元数据设计的. 服务器可以在实际调用结果要求之前显示HTML,预先加载,缓存并对HTML进行安全审查. 虽然兼容性代码可能仍然接受旧版本的平元数据键,但新构建的服务器应统一输出嵌套.`_meta.ui.resourceUri`结构

在当前核心规范中`tools/list`返回结果需要包含确定性排序,`ttlMs`及`cacheScope`可见的工具因用户或凭证不同而有所不同时,请使用`private`,我知道.

### 返回数据,交由主机 绑定视图

工具调用回常规内容与结构化数据:

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

主机已经明确知道该工具对应的视图是什么.

### 将App 作为资源提供服务

由于服务器在发现中声明了`resources`必须实现强制性`resources/list`操作――其确定性列表条目包含规范URI、稳定的名称、描述以及MIME类型――列表结果也包含`resultType`服务器 您的数据`ttlMs`和 `cacheScope`确定性工具的列表一样.

东道主发送`resources/read`在流式HTTP上,请求有如下结构:

```text
POST /mcp
MCP-Protocol-Version: 2026-07-28
Mcp-Method: resources/read
Mcp-Name: ui://notes/timeline.html
```

 HTTP 头字段值与 JSON-RPC 正文必须严格保持一致.`-32020`,我知道.

返回结果包含HTML资源和缓存提示:

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

### 将 UI资源 视作可执行内容进行缓存

应用资源与普通文本内容存在质量区别.`cacheScope`作为私人,存储键必须包含规范化`ui://`无需跨主体使用私有应用资源,因为即使URI完全相同,HTML内部或其策略元数据也可能存在显著的差异.

在以下情况下,缓存条例必须失效:`ttlMs`到了期,工具的`_meta.ui.resourceUri`绑定发生变化,服务器 版本或准入描述符 固定指纹变化,或已确认的资源变化订阅中指定该URI──在重新挂载之前,必须重新拉取并重新进行CSP 和权限审查──过期的iframe 绝不能仅仅因为新版本的资源尚未加载完成就继续保留更广泛的权限──

### 在评估特征策略前先拒绝协议歧义

校验逻辑具有严格的后续序列:首先校验JSON-RPC格式,强制要求字符串协议元数据和对象类型客户端能力映射表;然后核对路由请求头是否与正文内容一致;最后才判断是否支持匹配协议版本.

| 异常情况 | HTTP 状态码 | JSON-RPC 错误 |
|---|---|---|
| 请求头与正文在版本、方法或名称上不一致 | 400 | `-32020` |
| 请求头与正文一致，但版本不受支持 | 400 | `-32022`，且 `data` 准确为 `{"supported":["2026-07-28"],"requested":"<实际版本>"}` |
| `resources/read` 缺少 Apps 扩展 capability | 400 | `-32021`，附带 `data.requiredCapabilities.extensions.io.modelcontextprotocol/ui` |
| 请求的方法未知 | 404 | `-32601` |

没有 JSON-RPC 通知`id`由于此,服务器绝对无法生成JSON-RPC 响应.已接受的HTTP通知将返回带有空正文的202.

### 沙箱是防御边界,而不是信任背书

服务器牢牢控制iframe――App无法直接读取服务器的cookie――本地存储 (本地存储) 或页面DOM――所有特权操作都必须跨越桥接通道完成――

请遵循以下默认安全线:

- 将所有CSP域名列表默认置空,只添加App 真正需要的来源 (来源) ◎将`connectDomains`为了获取XHR和WebSocket;将`resourceDomains`用脚本,样式,图片和字体.
- 在可行的情况下,打包内联代码与资源数据.
- 除了用户可见的功能明确要求,否则不申请摄像头,风机或地理位置权限.
- 将`postMessage`严格地绑定到精确的对端起源,拒绝来自其它任何起源的事件.
- 将工具 参数、工具 结果、资源文本以及桥接消息一律视为不可信输入.
- 系统绝不能自行批准其发起的重大影响操作.

不要将教程中死板固定的`sandbox`属性直接照搬到所有主机中──主机必须根据应用程序的源模型及其自身的隔离设计来谨慎选择沙箱标志──

允许的域名仍然属于数据外发信.`connectDomains: ["https://api.example.com"]`任何在应用程序内部执行的脚本都可以被权限数据发送到该地址. 精确的来源可以匹配,但无法判断有效载荷内容是否可以得到.默认保持连接,避免将载体代币放入iframe,尽可能通过主机代理细分操作,限制请求和响应大小,并审计哪个用户站操作触发每次发出请求.`resourceDomains`与`connectDomains`分开待;加载字体或脚本权限绝不应赋予任意传输数据权限.

### 应用程序 桥接通道具有独立的生命周期

应用程序 桥接协议是建立在`postMessage`之上的JSON-RPC 方言──它可以交换`ui/initialize`与`ui/*`通知,也可以代理类似核心协议的方法.`tools/call`

查看 发送带有 `appInfo`和 `appCapabilities`对象`ui/initialize`◎主机回归其功能与主机上下文──仅在收到该响应后,查看才会发送`ui/notifications/initialized`◎主机必须等待该应用程序的通知到达后,才能向视频发送消息.

这一本地握手建立了一个桥梁,一个iframe和一个主机窗口之间. 它不负责协商MCP协议版本,不创建服务器状态,也不构建传输层会议. 请注意确切的前差异:核心协议中的`notifications/initialized`已被移除,而应用程序扩展中`ui/notifications/initialized`仍然保留──通过桥接产生的工具调用所触发的核心请求,是一个拥有全新的JSON-RPC id和完整的请求元数据的、自含的独立请求──

### 主持人 上下文 动作代理与权限撤销

在桥通道启动完成后,Host 仍然保持最高权威. 通过主机明确声明的功能来请求工具 动作,页面导航,剪贴板访问或其它特权效果. Host 会验证强类型的请求,当前用户,操作目标和参数,应用批准策略,并保留拒绝权力.

视为动态变化的主题,而不是一次性染输入:

- 应用主机提供的颜色与排版代币,并对主题或比较偏好的变化时实时响应.
- 允许查看上报其预期的尺寸,但由主机限制并应用iframe尺寸,防止内容脱离布局或构建欺骗性遮盖层.
- 在iframe 内部保持键盘导航顺序"",可见焦点"",无障碍名称"",屏幕阅读器状态"",充足的对比度"",缩放支持以及减弱动画(减动)偏好――
- 在窗口调整大小和重新染后,重新测试主机控件与视图控件之间的焦点转移.

在应用程序开启运行期间,由于用户切换账户,安全策略变化,服务器遭遇隔离审查或主机缩小授权范围,相关功能可能会被中途撤销.`ui/initialize`握手时检查. 一旦权限撤销,应立即拒绝挂起的特权调用,终止不再符合策略的网络活动,清理敏感的已染状态,并在用户界资源本身不再被准入时重新挂载或降级回文模式.

### 降级回退是契约的必要组成部分

具有应用程序感知能力的服务器 必须仍然能够提供未声明的UI扩展主机:

- 在`tools/list`中返回不带 `_meta.ui`它们是同样的工具.
- 为`tools/call`保存有价值的普通文本结果.
- 对未声明能力的主机 读取 UI `resources/read`时返回缺失能力 错误――
- 在判断工具是否执行完成时,绝不假设iframe 一定存在.

```figure
t3-ui-sandbox
```

## 手写实现

`code/main.py`不依赖 SDK 构建一个精简的进程内协议模型――通过`server/discover`声明应用程序 扩展,列出工具与资源,执行工具,并提供自含的HTML资源 服务

该模型接收已完成解析正文和路由头. 它不是完整的HTTP适配器,不负责解析.`Content-Type`或`Accept`◎完整的流式HTTP适配器 请参阅第09课,它要求`Content-Type: application/json`且`Accept`同时包含`application/json`与`text/event-stream`,我知道.

运行测试:

```bash
cd phases/13-tools-and-protocols/14-mcp-apps
python3 code/main.py
python3 -m unittest discover code/tests -v
```

检查输出中的五大核心特征:

1. 每次调用均完全独立.
2. 每个请求都带着`_meta`能力
3. `resources/list`在执行任何资源中 读取前均返回稳定的描述符.
4. 每个结果都带有`resultType`服务器的数据.
5. 没有任何核心协议会话标识符.

## 使用与运行

从`server/discover`开始确认`io.modelcontextprotocol/ui`现在服务器的扩展映射表中. 随后分别在携带和不携带应用程序的功能中进行了两次调用.`tools/list`首个响应会声明资源 绑定,第二则保持为可直接使用的纯文本工具.

读取`ui://notes/timeline.html`在HTML中检索`hostOrigin`及`event.origin`防护代码──这两行代码是证明桥通道未采用通配符目标的最小可证据──

## 交付产物

本课交付 `outputs/skill-mcp-apps-spec.md`△ 在编写框架代码之前,可使用它审查应用程序协议. 它强制设计师清晰说明当前核心信封,扩展协商,降级回退,UI资源,缓存策略,CSP,权限范围,桥接方法以及用户同意边界.

## 课后练习

1. 将客户端能力修改为空的扩展映射表.`tools/list`保存了这个工具,但移除了UI资源绑定.
2. 发送`Mcp-Name: ui://notes/other.html`现在,我已经开始了.`-32020`,我知道.
3. 将资源的缓存属性修改为`cacheScope: private`△描述促成此配置的用户专属条件.
4. 将脚本移至`https://static.example.com/app.js`〔将该起源〕`resourceDomains`中,并解释了由此带来的新型供应链安全风险.
5. 增加一个`notes_open`工具将按点击事件路由通过主机.

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
