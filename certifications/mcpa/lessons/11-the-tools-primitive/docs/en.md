# 工具原语：调用动作与解析结果 (The Tools Primitive: Calling Actions and Reading Their Results)

> 工具调用表面上与其他请求并无二致。让它单独成课的精髓，在于结果中可以携带的丰富内容：纯文本、图片、音频、资源链接或是完整内嵌的资源，且每一项都可以附带标明受众与新鲜度的提示信息。

**Type:** Reference
**Languages:** Python
**Prerequisites:** Lesson 10
**Time:** ~45 minutes

## 学习目标

- 解析 `tools/list` 分页中的分页游标与缓存提示，并阐明为何客户端收到的工具列表绝不能依赖于当前发起请求的具体连接
- 调用工具并将返回的 `CallToolResult` 结构拆解为三大核心字段：`content`、`structuredContent` 以及 `isError`
- 识别工具调用结果支持的五种内容块类型（文本、图片、音频、资源链接和内嵌资源），并理解其自身附带的内容注解含义
- 掌握当服务端未提供注解对象时工具注解的各项默认值，并解释为何这些默认值严格偏向保守防御而非放任授权
- 完整追踪服务端工具列表的变更通知如何精准触达已经建立 `subscriptions/listen` 流的客户端

## 问题背景

一个服务端可以对外暴露单个工具，也可以暴露数百个工具。如果 `tools/list` 每次都在一个未经分页的大数据块中返回全量工具，且响应报文并未对该结果的新鲜度有效期作出任何承诺，那么模型每轮交互要么必须白白重新拉取整套目录，要么就不得不基于可能早已过时的本地副本来做决策。而请求或响应中没有任何线索能告知客户端哪种做法才是安全可靠的。

调用具体工具时则面临这一问题的更为尖锐的版本。工具的任务可能是朗读一段话、绘制一幅图，或是返回文件的底层二进制内容，单一的“返回一个字符串”契约根本无法真实描述如此多样化的形态。如果所有执行结果都被强行塞进单一结构中，客户端就只能瞎猜：返回的文本究竟是供模型阅读、供人类用户直接查看，还是代表一个需要客户端自行抓取的资源标识？同时，客户端也将丧失优雅区分“彻底执行失败”与“执行成功但返回了需要模型继续纠错的内容”的标准途径。

2026-07-28 规范修订版以相同的核心设计思路回应了这两个挑战：在底层通信协议中赋予足够的结构化语义，使客户端永远无需臆测。分页参数与缓存提示直接搭载在列表响应中；返回内容按不同类型分块提供；调用的失败状态则通过明确的结构化字段来检验，而非依靠反向推导字符串形态。

## 核心概念

客户端通过 `tools/list` 向服务端查询可用功能。请求中可以携带从上一页复制而来的不透明游标 `cursor`；首次请求则省略该参数。由于 `tools/list` 属于可缓存操作，一个 `"complete"` 的成功结果始终包含整型毫秒数 `ttlMs` 以及值为 `"public"` 或 `"private"` 的 `cacheScope`；当服务端仍有后续工具时，响应中还会携带 `nextCursor`，这同样是一个客户端绝不应自行解析的不透明字符串。

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "resultType": "complete",
    "tools": [
      {"name": "get_readme_link", "description": "Point at the project README instead of inlining it.", "inputSchema": {"type": "object", "additionalProperties": false}}
    ],
    "nextCursor": "",
    "ttlMs": 300000,
    "cacheScope": "public"
  }
}
```

请特别注意，上述示例中的 `nextCursor` 故意设置为空字符串：在规范中，空字符串是合法的有效游标值，绝非表示“没有更多数据”的哨兵标记。如果客户端通过 `if result.get("nextCursor")` 来判断是否需要继续分页，就会提前一页意外终止，因为在绝大多数编程语言中空字符串都被判定为假（falsy）。唯一严谨的判断准则是检查该键名在响应中是否存在。分页逻辑本身完全属于服务端的内部实现细节；客户端一旦尝试解析、解码或递增游标，就等于将系统依赖建立在服务端下个版本随时可能变更的私有假设之上。同样的纪律也适用于列表的内容：针对未发生变更的工具集合，从三个互不相关的连接发起的 `tools/list` 调用必须返回完全相同的内容与排序。列表条目的差异只能源于请求附带的权限凭证改变了调用方有权查看的范围，绝不能是因为连接本身碰巧记录了某些状态。

调用具体工具的方法是 `tools/call`，在 `params` 中传入 `name` 与 `arguments`。其返回结果统一为 `CallToolResult`：绝不省略的 `content` 列表、可选的 `structuredContent` 结构化对象，以及可选的 `isError` 布尔值。结果中省略 `isError` 即代表调用成功；只有当其值为 `true` 时，才表示工具自身在执行任务时遭遇了业务问题。同时定义了 `outputSchema` 的工具，不仅会在 `structuredContent` 中填入结构化对象，而且为了兼容仅能处理纯文本的轻量客户端，还会将序列化后的同一数据作为文本块同步镜像放入 `content` 列表中。

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "resultType": "complete",
    "content": [{"type": "text", "text": "{\"id\": \"TCK-9\", \"title\": \"VPN drops every hour\", \"status\": \"open\"}"}],
    "structuredContent": {"id": "TCK-9", "title": "VPN drops every hour", "status": "open"}
  }
}
```

`content` 被设计为一个列表，因为单次工具调用完全可能同时返回多种不同类型的内容，规范为此定义了五种核心内容块类型。`text` 块承载字符串文本。`image` 块包含 Base64 编码的 `data` 与媒体类型 `mimeType`。`audio` 块包含相同两个字段以传输音频。`resource_link` 块通过 `uri` 与 `name` 指向某个外部资源而非直接内联其数据，这在数据体积庞大或模型可能根本无需阅读该内容时极为高效。`resource` 块则将资源本体内容（`uri`、`mimeType` 以及 `text` 或 `blob`）直接内嵌在结果中。上述任何内容块均可携带专属的 `annotations`：标明目标受众的 `audience`（`user`、`assistant` 或两者兼具）、介于 0 到 1 之间的 `priority` 优先级，以及 `lastModified` 时间戳。这些内容注解与内容块的其他字段处于同一层级（作为 `data` 或 `resource` 的同级兄弟字段，绝不嵌套在其内部）；这种层级排布值得反复留意，因为开发者很容易误以为内嵌资源的注解应当写在 `resource` 内部，而规范 Schema 严格要求将其置于外侧并列。

```json
{
  "type": "resource",
  "resource": {"uri": "config://release-desk/thresholds", "mimeType": "application/json", "text": "{\"maxOpenIncidents\": 5}"},
  "annotations": {"audience": ["user", "assistant"], "priority": 0.7, "lastModified": "2026-07-01T00:00:00Z"}
}
```

另一组注解用于修饰工具自身，而非单次调用的具体内容：`readOnlyHint`、`destructiveHint`、`idempotentHint`、`openWorldHint` 以及用于前端展示的 `title`。它们全部属于非保证性质的提示信息。客户端除非能彻底信任服务端本身，否则必须将这些注解视为不受信输入；若服务端对工具未声明任何注解，客户端必须回退至规范默认值：`readOnlyHint: false`、`destructiveHint: true`（仅在 `readOnlyHint` 为 `false` 时有意义）、`idempotentHint: false` 以及 `openWorldHint: true`。这些默认值特意设定得极为谨慎：没有任何注解的工具会被假定为连续调用两次可能产生不同的副作用，这并非因为必然如此，而是因为服务端从未向客户端做出过免责承诺。

声明了 `tools: {listChanged: true}` 的服务端承诺会在工具集合发生变动时主动通知，并且该通知是在专用事件流而非通用连接通道中传输的。客户端通过 `subscriptions/listen` 打开该事件流，并在 `params.notifications` 中指定监听 `toolsListChanged`。服务端返回的首条消息必定是 `notifications/subscriptions/acknowledged`，其中会回显服务端同意支持的通知类型，并在 `_meta` 中标注 `io.modelcontextprotocol/subscriptionId`（其值与 listen 请求本身的 `id` 保持一致）。后续在该流上发出的每一条 `notifications/tools/list_changed` 均携带该订阅 ID，以便同时管理多条活动流的客户端能精确知晓哪条流触发了事件。通知消息本身并不携带全量工具列表，它仅仅是一记旧列表已失效的警钟；客户端收到后会主动发起一次标准的 `tools/list` 请求以拉取最新目录。

```figure
mcpa-11-tool-call
```

## 交互式实验

本节图示清晰展示了一次完整的 `tools/call` 往返交互：请求单向流向服务端，`CallToolResult` 则反向返回客户端；在箭头下方，展示了工具结果 `content` 数组中可以混合搭载的五种内容块类型。在此之下，同一个结果中的 `isError` 状态标志分为两个分支：省略或为 false 表示调用正常完成；为 true 则表示工具遭遇了需要模型阅读并介入处理的业务错误。该图谱中的结构不专属于任何特定服务端，无论是回答一句话、绘制徽标，还是返回一个暂不需要直接阅读的文件链接，底层均严格遵循这套统一的通信结构。

## 实战演练

打开 `code/main.py`。该脚本构建了一个包含 6 个工具的 `release-desk` 服务端，分别覆盖了每种内容块类型以及一份结构化工单摘要；脚本以每页 2 个工具的规格执行深度为 3 页的列表查询，其中故意将第二页的游标设计为空字符串以考验客户端的分页鲁棒性。

```bash
python3 code/main.py
```

对照核心概念部分的讲解研读打印出的各个页面：前两页均以客户端绝不擅自解析的 `nextCursor` 结尾，唯独第三页完全没有 `nextCursor` 键，这是表明分页彻底结束的唯一权威信号。接着查看文件顶部的 `render_for_audience` 函数，观察它是如何精准利用 `render_badge` 挂载在内容块上的 `annotations.audience` 列表，将徽标图片从面向 `"assistant"` 的上下文中剔除，同时完整保留在面向 `"user"` 的展示中。最后观察通信记录末尾的 `subscriptions/listen` 交互：首先是订阅确认握手，随后在事件流进行中一旦动态注册了第 7 个工具 `triage_incident`，便立刻触发了 `notifications/tools/list_changed` 通知，紧接着客户端重新遍历 `tools/list`，此时正好需要第 4 个页面才能完整展示。你可以尝试向 `build_tool_server` 中添加自定义的第 8 个工具并重新运行，验证分页边界与 `effective_tool_annotations` 默认值能够在无需改动客户端一行代码的情况下自适应生效。

## 交付产物

`outputs/tool-result-anatomy.md` 是本课交付的单页参考规范速查手册：包含 `tools/list` 的分页与缓存字段定义、`CallToolResult` 的标准结构、五种内容块类型及其必选字段映射表、工具注解默认值矩阵，以及 `listChanged` 变更流的处理时序。在实际审查真实服务端的工具定义时，请随时对照该手册进行核验。

## 验证方法

在课程目录下运行测试套件：

```bash
python3 -m unittest discover code/tests
```

测试全面检验了本课阐述的核心机制：每种内容块类型均结构完备且格式合规；`resource_link` 必定携带 `uri` 与 `name`；内嵌资源将其 `annotations` 正确并列放置在 `resource` 外部而非嵌套在内；按受众过滤内容能够准确剔除面向其他角色的块；正常成功响应中 `isError` 保持缺省；`tools/list` 能顺畅穿越空字符串游标完成分页而不会提前中断；未识别的非法游标会被严谨拒绝；缺少元数据的请求会被驳回；来自两个独立连接的工具列表内容完全一致；缺失的工具注解能正确解析为规范默认值；`subscriptions/listen` 建立的流在报告变更之前必定先返回确认响应。本仓库的通信检查脚本还会依据 2026-07-28 规范核验本课的通信记录：

```bash
python3 scripts/check_mcpa_wire.py certifications/mcpa/lessons/11-the-tools-primitive
```

## 项目连接

在 Capstone 综合考核的项目全流程中，系统会实际调用工具、对照 JSON Schema 校验参数，并将 `isError` 错误结果重新喂给模型以实现自愈重试。这两个环节正是本课 `CallToolResult` 的实战运用：`content` 是模型阅读的素材，`structuredContent` 是宿主程序无需二次解析文本即可安全信任的结构化数据，而 `isError` 则是划分“请求格式非法”与“工具遭遇需要解释的业务异常”的关键判据。

## 核心术语

| 术语 | 含义 |
|------|------|
| Tool（工具） | 由模型控制、具备 Schema 强类型约束并由服务端按名称暴露的操作能力 |
| `tools/list` | 用于枚举服务端所暴露工具集合的分页、可缓存请求方法 |
| `tools/call` | 通过指定名称与参数来执行某一具体工具的请求方法 |
| `CallToolResult` | 工具调用结果的标准结构：包含 content、可选的 structuredContent 以及可选的 isError |
| Content block（内容块） | 工具返回结果 content 列表中的单个数据项：文本、图片、音频、资源链接或内嵌资源 |
| `resource_link` | 通过 URI 指向外部资源而非直接内嵌其具体数据的内容块类型 |
| Content annotations（内容注解） | 内容块上的 audience、priority 与 lastModified，用于修饰展示受众与时效性 |
| Tool annotations（工具注解） | readOnlyHint、destructiveHint、idempotentHint 等用于描述工具运行特性的非保证性提示 |
| `nextCursor` | 分页响应中尚有更多条目时携带的不透明令牌；判断依据是该键是否存在，而非其布尔真假 |
| `subscriptions/listen` | 客户端用于开启事件流以接收服务端 notifications/tools/list_changed 通知的请求 |

## 延伸阅读

- [MCP 规范 2026-07-28：工具原语 (Tools)](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- [MCP 规范 2026-07-28：订阅模式 (Subscriptions)](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
- [MCP 规范 2026-07-28：Schema 规范速查](https://modelcontextprotocol.io/specification/2026-07-28/schema)
- `certifications/mcpa/research/mcp-2026-07-28-brief.md`，第 10 节
- `phases/13-tools-and-protocols/07-building-an-mcp-server` 与 `phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content`，深入掌握工具契约与内容处理
