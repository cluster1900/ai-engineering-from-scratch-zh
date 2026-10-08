# Prompt 模板与参数自动补全 (Prompt Templates and Argument Completion)

> Prompt 是由服务端编写、由人类用户主动选择运行的交互模板。它的任何行为都不应对选择它的人造成突兀或意外。

**Type:** Reference
**Languages:** Python
**Prerequisites:** Lesson 12
**Time:** ~45 minutes

## 学习目标

- 深入阐明为何 Prompt 属于用户控制（user-controlled），并辨析它与模型控制的工具原语以及应用驱动的资源原语之间的核心差异
- 准确解析 `prompts/list` 与 `prompts/get` 的请求与响应结构，涵盖入参声明、分页游标以及缓存提示字段
- 基于文本和资源链接构造合规的 `PromptMessage` 内容，并将调用方传入的实参精准替换到模板占位符中
- 针对未知 Prompt 名称、缺少必填参数以及未识别的分页游标，规范返回统一的错误码 `-32602`
- 熟练运用 `completion/complete` 方法，配合 `ref/prompt` 与 `ref/resource` 引用类型、`context.arguments` 上下文机制，以及基于 100 条上限的 `hasMore` 截断标志

## 问题背景

当宿主允许用户在聊天框输入斜杠命令（slash command）时，必须有特定的地方来存放这些命令展开后的具体文本。宿主固然可以在客户端代码中硬编码若干常用模板，但这会导致每次新增或修改模板都必须发布客户端新版本，且不同宿主之间极难就这套模板达成共识。宿主也可以放手让大模型每次自由组织语言，但这会导致经过团队精心打磨与严格法务审查的高质量 Prompt（例如代码审查规范、安全事故应急处理手册或发版公告）在每次运行时发生无法控制的语义漂移。

MCP 将这部分文本的管辖权交还给服务端，置于专为此类场景设计的协议原语之后：由用户主动选择执行，并带有宿主可动态转化为前端表单的命名参数。持有业务领域所有权的服务端（例如负责代码审查策略、事故排查指南或发布流程的后端系统）全权掌控具体的 Prompt 措辞，而任何支持 MCP 协议的客户端都可以枚举可用模板、展示给用户、收集参数输入，并以完全一致的逻辑渲染出标准模板。用户通常通过菜单或斜杠命令发起交互，但协议本身并不限定具体的用户界面展现形式。协议确立的是不可动摇的契约分工：人类用户决定何时触发 Prompt，而具体的提示词内容属于服务端对外提供的数据服务，绝非客户端预先打包的死数据。

与此并存的一个更具体的问题是：当模板包含多个参数时，全凭手动键入既繁琐又极易出错。`completion/complete` 机制完美解决了这一痛点：它允许服务端在用户输入过程中动态提供候选建议，并允许后置参数的补全建议参考前置参数已填入的内容。

## 核心概念

控制权模型（Control model）在这一原语中处于决定性地位，它界定了该原语的一切行为特征。工具（Tools）由模型控制：模型自主判定何时调用；资源（Resources）由应用程序驱动：宿主决定哪些资源内容被注入上下文；Prompt 则由用户控制：人类用户必须显式做出选择，通常通过宿主渲染的菜单或斜杠命令触发。服务端依然是 Prompt 措辞、参数 Schema 以及消息结构的作者。“控制权”界定的是谁来决定触发时机，而非谁来编写文本内容。

支持该原语的服务端会在 `server/discover` 响应的 `capabilities` 对象中声明 `prompts: {"listChanged": true}`，且必须响应 `prompts/list` 请求。该响应包含 `resultType: "complete"`、`prompts` 数组，且因为 `prompts/list` 属于六大可缓存操作之一，它必须附带整型毫秒数 `ttlMs` 以及取值为 `"public"` 或 `"private"` 的 `cacheScope`。列表枚举支持游标分页：请求携带不透明的 `cursor`，而当仍有后续页面时响应返回不透明的 `nextCursor`。若客户端传入了一个服务端从未签发的非法游标，这绝不是可以含糊容忍的轻微异常，而必须严格返回错误码为 `-32602`（Invalid params）的 JSON-RPC 协议错误，该错误码与请求未知 Prompt 名称或缺少参数时返回的代码完全一致。

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "prompts/list",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

`prompts` 数组中的每个条目声明了 Prompt 的名称及其 `arguments` 列表，每个参数附带 `name`、`description` 以及 `required` 布尔标志。客户端甚至在用户尚未键入任何字符前，就可以直接依据该列表在界面上动态绘制输入表单。为解析具体模板，客户端发起 `prompts/get` 请求，传入 `name` 以及键值对形式的 `arguments` 字典。这里存在两种失败形态，这也是考试中与工具原语产生鲜明对比的高频考点：Prompt 原语根本不存在 `isError` 通道，因为 Prompt 本身不执行任何业务逻辑，它仅仅负责渲染文本。未知的 Prompt 名称或缺失必填参数均属于底层的标准 JSON-RPC 协议错误（`-32602`），绝非能够留给模型自行纠偏的局部业务返回。2026-07-28 规范还允许 `prompts/get` 返回 `InputRequiredResult` 代替最终结果，采用与多轮往返请求（MRTR）相同的机制，让服务端在渲染完成前向宿主索取补充输入的同时保持完全无状态。

成功的 `prompts/get` 结果返回 `messages` 列表，其中每条消息包含一个角色 `role`（`"user"` 或 `"assistant"`）以及单个内容块。最常见的是 `text` 块，其中实参已被替换进对应占位符中。消息也可以承载 `resource_link` 块（包含 `uri`、`name` 与 `mimeType`），指向外部资源而无需在消息中内联其原始字节：这对于代码审查时需要引用但不宜通篇嵌入的编码规范或操作手册极为适用。当数据体积足够轻量时，消息还可以承载内嵌的 `resource` 块（直接包含 `uri`、`mimeType` 以及 `text` 或 Base64 编码的 `blob`）。这三种内容形态均支持与资源原语相同的 `audience` 与 `priority` 内容注解。

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "resultType": "complete",
    "description": "Code review request template",
    "messages": [
      {
        "role": "user",
        "content": {
          "type": "text",
          "text": "Review this python snippet for style and correctness. Follow flask community conventions where they apply."
        }
      },
      {
        "role": "user",
        "content": {
          "type": "resource_link",
          "uri": "file:///styleguides/python.md",
          "name": "python-style-guide.md",
          "mimeType": "text/markdown"
        }
      }
    ]
  }
}
```

手动逐项输入多个参数十分低效，因此声明了 `completions: {}` 能力的服务端支持 `completion/complete` 方法。请求通过 `ref` 声明当前正在补全的对象：针对 Prompt 参数为 `{"type": "ref/prompt", "name": "code_review"}`；针对资源模板变量则为 `{"type": "ref/resource", "uri": "file:///src/{path}"}`。请求携带当前正在输入的参数对象 `argument: {"name": ..., "value": ...}`，以及一个可选的 `context.arguments` 映射表，记录用户在该表单前序字段中已经选定的实参。补全响应中的 `values` 数组绝不会超过 100 条；当真实匹配数量超出该上限时，服务端会汇报真实的 `total` 总数并将 `hasMore` 置为 `true`，明确告知客户端当前列表已被截断。请务必注意：`prompts/get` 与 `completion/complete` 均不属于六大可缓存操作，因此其响应报文中绝不包含 `ttlMs` 或 `cacheScope`，这是考试中的典型陷阱：缓存机制属于静态稳定列表的专有属性，绝不能套用在针对动态单次输入的响应上。

```json
{
  "jsonrpc": "2.0",
  "id": 9,
  "result": {
    "resultType": "complete",
    "completion": {
      "values": ["falcon", "fastapi"],
      "total": 2,
      "hasMore": false
    }
  }
}
```

通过前序参数收窄后序参数的候选范围，正是 `context.arguments` 的核心价值所在。若缺少该上下文，服务端只能对着当前输入的字符前缀盲猜，所有拼写匹配的候选词都会被一股脑抛出，无论用户先前已经选定了何种编程语言。而一旦请求在 `context.arguments` 中携带了 `{"language": "python"}`，提供框架建议的服务端就能瞬间过滤掉 JavaScript 或 Java 相关的框架，仅返回真正适用的 Python 框架条目。补全候选词与工具注解类似，仅仅属于建议性提示，绝非权限访问控制。客户端最终仍须对照 Prompt 自身声明的参数契约，对用户提交的数据进行严格校验。

在 2026-07-28 规范之前，如 `prompts/list` 等枚举结果并未强制要求携带缓存字段；支持跨时代兼容的客户端若收到既无 `ttlMs` 又无 `cacheScope` 的旧版 `prompts/list` 响应，应将其作为不缓存的单次数据对待，严禁自行假定默认的新鲜度时间窗口。

```figure
mcpa-13-prompt-template
```

## Interactive Lab

本节架构图左侧完整演示了一次 `prompts/get` 调用的端到端生命周期：包含模板中的 `{language}` 与 `{framework}` 占位符、调用时传入的具体实参，以及最终替换生成的文本结果。右侧演示了针对 `framework` 参数以完全相同的前缀连续执行两次 `completion/complete` 的对比：第一次未传入 `context.arguments`，第二次则由客户端明确告知了用户先前已选定 Python。在第二次调用中候选列表显著收窄，因为服务端得以排除了与该语言无关的框架条目。请注意，图示左右两列均未标注任何缓存提示，因为 `prompts/get` 与 `completion/complete` 本身绝不携带任何缓存元数据。

## Practice Lab

打开 `code/main.py`。该脚本实现了一个基于标准库的 Prompt 服务端，注册了 `code_review` 与 `bug_triage` 两个模板，并以每页 1 个条目的规则进行列表枚举，以此完整展示使用 `cursor` 与 `nextCursor` 的真实分页流。后台维护了一个包含 144 个源码文件路径的虚拟目录，用于支撑 `ref/resource` 的自动补全，使 100 条上限及 `hasMore` 标志完全基于真实超限的路径数据来呈现。

```bash
python3 code/main.py
```

对照核心概念部分的讲解细致研读打印出的交互记录。观察两次 `prompts/list` 调用：第二次调用使用第一次返回的 `nextCursor`，返回了剩余的 Prompt 且不再包含 `nextCursor`，标志着列表已彻底枚举完毕。随后观察第三次 `prompts/list` 调用：客户端故意发送了一个服务端从未签发过的非法游标，服务端严格返回了 `-32602`。接着查看 `code_review` 的 `prompts/get` 调用：其返回结果包含两条消息，一个是已将 `python` 和 `flask` 替换完毕的 `text` 文本块，另一个是指向编码规范文件的 `resource_link`。然后审视两组主动构造的失败场景：未传任何参数的 `prompts/get`，以及请求不存在的 Prompt 名称，两者均统一返回 `-32602`。最后对比针对 `framework` 的两次自动补全：无 `context` 的第一次调用返回了包含 JavaScript 框架在内的 3 个匹配项；而在 `context.arguments` 设定为 `{"language": "python"}` 的第二次调用中，精准缩减为仅属于 Python 的 2 个匹配项。紧随其后的两次调用针对 `ref/resource` 路径执行补全：前缀为空时返回了 144 个可能路径中的前 100 条并标明 `hasMore: true`；而当前缀收窄为 `auth/` 时，精准返回全部 18 条匹配项并标明 `hasMore: false`。你可以尝试修改前缀或添加第三个 Prompt 重新运行，观察分页与补全系统的动态响应。

## Shipped Artifact

`outputs/prompt-and-completion-reference.md` 是本课交付的单页速查手册：涵盖请求与响应标准格式、`PromptMessage` 支持的内容类型矩阵、完整错误码映射表，以及自动补全引用类型规范与截断限制。在审查或实现真实服务端的 Prompt 功能时，请随时对照该手册核实 `prompts/get` 的错误返回以及 `completion/complete` 的 100 条上限与 `hasMore` 表现。

## Verify It

在课程目录下运行测试套件：

```bash
python3 -m unittest discover code/tests
```

测试全面检验了本课阐述的核心主张：`prompts/list` 游标分页运行无误并附带完整缓存提示；未识别的非法游标会被坚决拒绝；`prompts/get` 能够将实参正确替换入文本块并附带资源链接；缺失必填参数与请求未知 Prompt 均一致返回 `-32602`；补全响应严格在 100 条处截断并在超限时将 `hasMore` 置为 true；更精确的前缀能将候选数量压减回收限额之内；`context.arguments` 能够明显收窄候选集合；场景中的每个请求均完整携带符合规范的协议元数据。本仓库的通信检查脚本还会依据 2026-07-28 规范核验本课的通信记录：

```bash
python3 scripts/check_mcpa_wire.py certifications/mcpa/lessons/13-prompts-and-completion
```

## Capstone Connection

在 Capstone 综合考核的项目全流程中，系统会执行服务发现、工具调用并走通用户授权流程；但在真实的生产宿主中，用户往往倾向于直接调用经过审核的标准化模板而非输入自由文本，并在表单输入时依赖自动补全功能。当 Capstone 考核要求你论证“为何在某一特定交互中优先选用 Prompt 而非工具”时，请始终立足于控制权模型进行作答：这是由用户主动发起的明确选择，服务端全权负责文本措辞的规范性，且模板渲染过程纯净无副作用，绝不产生像工具调用那样不可逆的状态变更。

## Key Terms

| 术语 | 含义 |
|------|------|
| Prompt（提示词模板） | 由服务端定义、人类用户主动选择触发且包含命名参数的消息模板 |
| `prompts/list` | 用于枚举当前调用方可见的 Prompt 目录并附带缓存提示的分页请求方法 |
| `prompts/get` | 用于将传入实参替换到模板占位符中并渲染出消息列表的请求方法 |
| `PromptMessage` | 包含 role（user/assistant）以及单个内容块的消息结构 |
| `resource_link` | 通过 URI 指向外部资源而无需在消息体内联其原始字节的内容块 |
| `completion/complete` | 用于为 Prompt 参数或资源模板变量提供排序候选建议的补全请求方法 |
| `ref/prompt` | 用于指明当前正在补全哪一个 Prompt 参数的补全引用类型 |
| `ref/resource` | 用于指明当前正在补全哪一个资源 URI 或模板变量的补全引用类型 |
| `context.arguments` | 客户端回传的已确认前序参数字典，服务端用以大幅收窄后续补全候选范围 |
| `hasMore` | 补全状态标志；只要实际匹配总数 total 超过 100 条上限即置为 true |

## Further Reading

- [MCP 规范 2026-07-28：Prompt 原语 (Prompts)](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts)
- [MCP 规范 2026-07-28：自动补全机制 (Completion)](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/completion)
- `certifications/mcpa/research/mcp-2026-07-28-brief.md`，第 10 节
- `phases/13-tools-and-protocols/10-mcp-resources-and-prompts`，深入学习资源与 Prompt 原语的工程落地
