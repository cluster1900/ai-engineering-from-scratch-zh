#  MCP资源与提示:无状态 服务器的可寻址上下文

> 工具用于执行操作.资源用于暴露可寻址内容.简单用于封装用户选择的消息模板.一个优秀的MCP服务器将保持这些协议清晰分离且具有可预测性.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lesson 07 (Building an MCP Server), Phase 13, Lesson 09 (MCP Transports)
**Time:** ~60 minutes

## 学习目标

- 根据用户意图,在工具,资源和提示之间做出正确的选择.
- 通过强制要求`server/discover`声明资源与快速接口能力
- 构建确定性`resources/list`与`prompts/list`返回结果.
- 合理应用`ttlMs`与`cacheScope`避免泄露特定用户数据.
- 遇到无效或未知的资源URI 时返回JSON-RPC 错误`-32602`,我知道.
- 开启`subscriptions/listen`通过订阅ID 关联每个事件.
- 将资源内容和提示视为不可信的服务器输出.

## 发出用户意图

滥用MCP最简单的方式是直接从实现代码开始.数据库查询因为像函数就被做工具;可复用工作流因为存储在文件里就被做资源;快速因为主机可以注入就变成隐藏策略.

首先请从谁来选择以及他们希望什么出发.

| Primitive | 主要意图 | 选择主体 | 典型结果 |
|---|---|---|---|
| Tool | 执行某项操作 | Model 或应用程序 | 结构化动作结果 |
| Resource | 读取特定 URI 的内容 | Host、应用程序或用户 | 文本或二进制内容 |
| Prompt | 启动可复用的消息工作流 | 用户（通过 Host UI） | 一条或多条 prompt 消息 |

位于`notes://note-1`笔记是一个资源,因为它是可查找的内容.`delete_note`是一个工具,因为它会变得更好.`review_note`是一个快速的,因为用户主动选择预设的审核工作流.

为了不仅仅看起来功能完善而同时暴露同一操作对这三者.

## 无状态信封

本课针对MCP协议版本`2026-07-28`在此规范配置下,没有初始化握手或协议会话.`_meta`键中携带其协议版本和客户端功能.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/list",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      },
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

服务器必须实现`server/discover`△其回复结果向外声明支持的版本、资源与即时功能、实现标识以及缓存提示──缓存提示──客户端可以直接调用其方法,但发现让客户端能够在构建UI前获得稳定的快照──

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "resources": {"listChanged": true, "subscribe": true},
    "prompts": {"listChanged": true}
  },
  "ttlMs": 3600000,
  "cacheScope": "public"
}
```

常规结果会声明`"resultType": "complete"`应对的`_meta`通过`io.modelcontextprotocol/serverInfo`标识服务端实现信息. 信息用于诊断排错,而不是身份证. 携带未支持协议版本的请求将回复.`-32022`错误,同时带上请求的版本以及服务器支持的版本列表.

无状态契约会重塑你的设计直觉――列表查询不能依赖单条连接上前调用历史――认证凭证作为请求输入可以改变返回可见集合,但连接历史绝不能影响结果――

## 资源是稳定的URI协议

资源由URI标识的内容. 在编写处理器之前,先设计好URI.

良好的URI应具有的属性:

- 足够稳定,可以被加入书签或在多次请求之间传递.
- 划分在服务器的专有命名空间 (名字空间) 下。
- 独立于具体进程ID或连接.
- 在访问存储之前先经验证.
- 每次读取都进行授权鉴定权.

`notes://note-1`优于`note-1`文件服务器可以使用.`file://`解析符号链接和相对路径后,必须严格检查配置好的目录边界.

`resources/list`返回调用方当前可见的资源――必需按照稳定键 (例如 URI) 排序――确定性的顺序可以防止缓存震荡击穿 (缓存错过) 、快照漂移以及主机UI 在刷新时发生跳动――

```json
{
  "resultType": "complete",
  "resources": [
    {
      "uri": "notes://note-1",
      "name": "Architecture decision",
      "description": "Why the service uses a stateless boundary",
      "mimeType": "text/markdown"
    }
  ],
  "ttlMs": 300000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "notes-server",
      "version": "2.0.0"
    }
  }
}
```

`resources/read`返回一个或多个内容项──未知的URI 不代表读取成功但内容为空──当前资源规范将无效或未知的资源URI归类为JSON-RPC 无效参数,错误码为`-32602`,我知道.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "error": {
    "code": -32602,
    "message": "Unknown or invalid resource URI",
    "data": {
      "uri": "notes://missing"
    }
  }
}
```

这种区别使客户能够清楚地辨别资源不存在与有效空档,同时防止意外返回更广泛的广泛搜索.

### 资源模板

资源模板用于描述一族带参数的URI.`notes://projects/{project}/decisions/{decision}`告诉客户如何构建有效地址,而无需一次性列出所有决策条款.

模板并不意味着放松的学习.解析变量,执行识别权,强制长度和字符限制,并使用强类参数构建存储查询.绝对不要直接将任意的URI 后拼接到文件系统路径或数据库语句中.

### 内容并非可信指令

资源文本可能包含即时注入,密钥,误导性命令或恶意格式的标记. 主机应保留来源追踪,并将资源内容视为数据.服务器应限制内容大小,返回准确的MIME类型,脱敏调用者无权访问的字段,并避免返回无关记录.

## 快速是用户控制的模板

协议本身并不限制某种特定的UI表现形式──

对于相同的请求权,`prompts/list`每个提示都需要一个稳定的名称,有用的描述,以及能够让主机调用.`prompts/get`之前收集输入的参数声明.

```json
{
  "resultType": "complete",
  "prompts": [
    {
      "name": "review_note",
      "title": "Review a note",
      "description": "Review one note for a named concern",
      "arguments": [
        {
          "name": "uri",
          "description": "The note resource URI",
          "required": true
        }
      ]
    }
  ],
  "ttlMs": 600000,
  "cacheScope": "public"
}
```

`prompts/get`会将参数解析为一组消息. 它不会替换主机的系统指令.主机拥有决定如何返回消息进入模型下面的最终裁决权,并始终保持自己的信任策略具有更高的优先级.

在服务器边界处严格校验提示参数――提示中引用的URI必须通过与直接读取资源相似的识别权检查――不要让提示成为绕过资源访问控制的侧信道――

## 缓存提示是正确性的一部分

`ttlMs`告知客户 结果可以多久再使用.`cacheScope`描述谁可以分享这个存储值.

| 范围 | 含义 | 典型用途 |
|---|---|---|
| `public` | 在鉴权许可的前提下可在多用户间复用 | 公共 prompt 目录 |
| `private` | 绑定到请求发起用户或凭证上下文 | 用户名下的私有笔记内容 |

根据数据的变化频率以及过期陈旧可能造成的损害,选择TTL──公共提示 目录可能适合设置为5分钟,而私人笔记阅读可能设置为1分钟──

规范中`cacheScope`的有效值仅定义了`public`和 `private`应回报 对于包含敏感秘密或变更频繁的结果`cacheScope: "private"`配合`ttlMs: 0`后者在主端的缓存策略中应用了更严格的无商店规则.`no-store`本身并非MCP规范中的`cacheScope`取值──

缓存提示永远不能取代鉴定权.缓存键必须包含所有影响可见性的请求维度,包括租户 (租户) 、用户、权限范围 (范围) 、语言区域 (区域) 及分页游标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (页标) 标 (标) 标 (标) 标 (标) 标 (标) 标 (标) 标 (标) 标 (标) 标 (标) 标 (标) 标 (标) 标 (标) 标 (标) 标 (标) 标) 标 (标) 标 (标) 标 (标) 标 (标) 标 (标) 标) 标 (标) 标 (标) 标) 标 (标) 标 (标)`private`配合0 TTL,并在主机层实施无商店策略.

## 订阅使用客户端发起的响应流

现代订阅模式取代了原来的.`resources/subscribe`基于HTTP GET的事件端点.

客户端以常规 JSON-RPC 请求形式发送 `subscriptions/listen`在流通 HTTP 传输层上,这是一个 POST 请求,其 HTTP 响应保持开放状态作为 SSE(服务器发送事件) 流。`notifications`对象是一个白名单.服务器绝不能发送未经请求的通知类型.

```json
{
  "jsonrpc": "2.0",
  "id": 17,
  "method": "subscriptions/listen",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      }
    },
    "notifications": {
      "resourcesListChanged": true,
      "promptsListChanged": true,
      "resourceSubscriptions": [
        "notes://note-1"
      ]
    }
  }
}
```

在发送任何所请求的事件之前,服务器会发送`notifications/subscriptions/acknowledged`通知――其中的过条件只包含服务器实际接受的子集――

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/subscriptions/acknowledged",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": 17
    },
    "notifications": {
      "resourcesListChanged": true,
      "resourceSubscriptions": [
        "notes://note-1"
      ]
    }
  }
}
```

后续的每一个事件都带着相同的数据:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/resources/updated",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": 17
    },
    "uri": "notes://note-1"
  }
}
```

通知表明资源已发生变化. 客户在当前的鉴定权约束下通过`resources/read`重新读取该资源──客户不应假设通知事件本身包含最新文档内容──

多个订阅可以共享相同的工作室通道――订阅ID 让客户端能够对此进行多路解复用(demultiplex) ―― 在HTTP上,关闭响应流即可取消订阅――平稳关闭流的服务器会返回一个与最初请求关联的最终`resultType: "complete"`响应.

切勿将订阅流当作协议会话(协议会议) 使用──后续的读取操作仍然是完整的独立请求,能够路由到任何健康的服务器 实例──

```figure
t3-primitive-sort
```

## 交互式实验

利用图表对项目跟踪系统中的五种能力进行分类:问题详细问题详细问题创建问题创建问题创建问题创建问题创建问题创建问题创建问题创建项目规范策略以及关闭问题 确定哪些列表可以公开缓存,哪些读取必须保持私有,以及哪些资源值得配置更新通知.

在做每次分类时,明确其选择主体. 如果由模型执行动作,使用工具. 如果主机读取按URI寻址的内容,使用资源. 如果由用户启动预设的消息工作流,使用提示.

## 动手实验

在仓库根目录下运行模拟器:

```bash
cd phases/13-tools-and-protocols/10-mcp-resources-and-prompts/code
python3 main.py
python3 -m unittest discover tests -v
```

按以下顺序检查交互记录(转录):

1. 确认`server/discover`声明了目前协议版本以及两项功能.
2. 确认两次列表查询的结果均排列并包含`resultType: "complete"`,我知道.
3. 确认列表和阅读结果均带有预期缓存提示.
4. 将读取的URI 改为`notes://missing`观察回归`-32602`错误.
5. 确认订阅确认通知先于资源更新事件发出.
6. 确认事件与平稳关闭均携带订阅身份证`5`,我知道.

该Python模型没有打开真实的HTTP连接. 它模拟显示SDK必须放置在请求作用域响应流中的消息结构.

## 交付产物

`outputs/skill-primitive-splitter.md`是用于MCP原始的可复用设计审查指南. 它现在能够检查确定性发现,缓存范围,无效的URI处理行为以及现代订阅过器.

本课还附带`assets/primitive-split.svg`提供原始的与订阅边界的静态图解供离线学习.

## 验证它

```bash
cd phases/13-tools-and-protocols/10-mcp-resources-and-prompts/code
python3 main.py
python3 -m unittest discover tests -v
```

预期结果:主程序输出JSON 交互记录,测试命令报告至少通过12个测试用例──

## 石头 连接

当你的终点服务器除了行动之外还暴露可寻址知识时,请应用此契约.应包含一个确定性的目录快照,一次经授权的资源,一次快速解析,一个无效的URI处理用例以及一个订阅交互记录.

你的测试凭证应证明:任何列表都不依赖连接历史,并且订阅事件绝不会向未授权泄露底层资源的访问权限.

## 课后练习

1. 添加一个`notes://projects/{project}/notes/{id}`模板,并对两个变量进行验证.
2. 为`resources/list`添加分页支持,同时保持排序的确定性.
3. 设定一个资源`cacheScope: "private"`且`ttlMs: 0`增加主机级别的无商店策略,并解释支这两项控制措施的威胁模型.
4. 添加快速 列表变更订阅,并证明当过条件省略 `promptsListChanged`时不会发送任何事件.
5. 创建两个并发订阅,并证明每个事件都带有正确的请求身份证.
6. 为读取处理器 添加鉴权主体(主体),并证明缓存条目无法跨主体越权复用。

## 关键术语

- **Resource：**通过URI寻址的内容.
- **Prompt：**信息模板由用户控制
- **确定性列表（Deterministic list）：**针对相同的请求输入,其成员与顺序保持稳定的发现结果.
- **`ttlMs`：**缓存新鲜度持续时间
- **`cacheScope`：**缓存结果的共享边界`public`或`private`
- **`subscriptions/listen`：**一种长期生命周期请求,其响应流按显而易见的过条件交付通知.
- **Subscription ID（订阅 ID）：**原始听 请求的身份证,在通知元数据中重复传递.
- **无效参数（Invalid parameters）：**错误的 JSON-RPC`-32602`用于无效或未知的资源URI
- **不支持的协议版本（Unsupported protocol version）：**错误的 JSON-RPC`-32022`包含`supported`与`requested`版本列表
- **`server/discover`：**强制要求服务器 方法,返回支持的版本,能力,服务身份识别及可选缓存提示.

## 延伸阅读

- [MCP 2026-07-28 Resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)
- [MCP 2026-07-28 Prompts](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts)
- [MCP 2026-07-28 Subscriptions](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
- [MCP 2026-07-28 Caching](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching)
