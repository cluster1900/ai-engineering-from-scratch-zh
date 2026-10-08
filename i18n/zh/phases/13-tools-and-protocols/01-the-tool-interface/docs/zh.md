# 工具界面 为什么代理 需要结构化 I/O

> 语言模型会生成代币――程序会执行动作――两者之间的差距就是工具界面:一种合同,让模型能够请求某一动作,并让主机执行它――2026年每种堆OpenAI、Anthropic 和 Gemini 上的函数调用;MCP 的`tools/call`课程将命名为这个循环,并展示运行所需的最小机制.

**Type:** Learn
**Languages:** Python (stdlib, no LLM)
**Prerequisites:** Phase 11 (LLM completion APIs)
**Time:** ~45 minutes

## 学习目标
- 解释为什么一个只能生成文本的LLM不能单独对现实世界采取行动.
- 画出四步工具调用循环 (描述 → 决定 → 执行 → 观察),并说出每一步由谁负责.
- 将一个工具描述写成三部分:name、JSON Schema输入,以及确定性的执行函数──
- 区分纯工具和副作用工具,并说明为什么这种分类对安全很重要.

## 问题
果输出是下一个代币的概率分布――这就是它的全部输出表面――如果你问一个聊天模型孟加拉现在天气是怎么样,它可以写出一个句子看起来合理的话,但它不能连接天气API――那句话可能只是巧合正确,也可能已经过了三天――

弥合这个差距正是工具界面的目的――主机程序你的代理运行时间――Claude Desktop、ChatGPT、Cursor,或一个自定义脚本将向模型公布一组可调用工具――当模型判断需要某个动作时,它会输出一个结构化有效载荷,指标工具和其参数――主机解析该有效载荷,真正运行工具,并将结果反回去――直到这个循环持续,模型判断不再需要更多调用――

该合同的第一版本于2023年6月发布在OpenAI的功能参数形式.`tool_use`几个月后加入了`functionDeclarations`△现在每个提供商都暴露在相同的形状上:输入一个由 JSON-Schema标签类型的工具列表,输出一个 JSON-payload工具调用――模型文本协议 (Model Context Protocol) ◎2024 年 11 月) 将这个合同泛化,使一个工具注册表可以服务每个模型――A2A(2026 年 4 月,v1.0) 在同一原始的 之上叠加了代理到代理代表团――

四步循环是这些系统底层的不变量.

## 概念
### 步骤一:描述

接待者 用三个字段声明每个工具.

- **Name.**一个稳定,机器可读的标识符.`get_weather`没有天气.
- **Description.**一段自然语言简介── 当用户询问特定城市当前天气状况时使用──不要使用历史数据──
- **Input schema.**一个描述工具参数的JSON方案对象(草案2020-12)。

模型会接收这个列表.现代提供商会使用提供商特定的模板将这些声明序列化到系统中,因此作为调用方,你只需要处理结构化形式.

### 第二步:决定

给定用户消息和可用的工具,模型会选择三种行为之一.

1. **直接用文本回答**不进行工具调用.
2. **调用一个或多个 tools。**输出结构化调用对象──在`parallel_tool_calls: true`下(OpenAI 和 Gemini 默认启用,人类需要选择),模型可以在一个转中输出多个调用.
3. **拒绝。**严格模式结构化输出可以产生类型化`refusal`区块,而不是电话.

一个工具调用用量 有三个稳定字段:调用`id`工具`name`及JSON`arguments`为了让主机能够将后续结果与特定的呼叫关联起来;当平行呼叫 乱序返回时,这一点很重要.

### 第三步:执行

接收电话的主机,根据声明的方案验证参数,并运行执行者. 无效参数意味着模型幻觉了某个段段或使用错误类型. 这在弱模型上非常常见的失败模式. 在生产环境中的主机对无效参数通常会做三件事之一:快速失败并将错误暴露给模型;使用限制解析器修复JSON;或在提示中包含验证错误.

执行器本身只是普通代码──Python、TypeScript、shell命令、数据库查询──它会产生一个结果,通常是字符串,但也可以是任何JSON值或结构化内容块(在MCP中可以是文本、图像或资源引用)──结果必须可以序列化──

### 第四步:观察

作为带有匹配的工具,`id`的`tool`模型现在在文本中拥有工具输出,可以生成最终答案,或请求更多呼叫. 这个过程将持续到模型停止输出呼叫,或主机达到代次数的安全上限.

### 信任分开了

工具有两种对安全非常重要类型.

- **Pure.**只有读,确定性,没有副作用.`get_weather`,我知道.`search_docs`,我知道.`get_current_time`可以安全地进行投机调用
- **Consequential.**通过用户数据来改变状态.`send_email`,我知道.`delete_file`,我知道.`execute_trade`必须加一个门.

 Meta 2026 年用于代理安全的  规则  表示,一个转换 最多只能同时包含以下三项:不值得信赖的输入,敏感数据,后续行动.

### 循环的存在

| Context | Who describes | Who decides | Who executes |
|---------|---------------|-------------|--------------|
| Single-turn function calling (OpenAI/Anthropic/Gemini) | App developer | LLM | App developer |
| MCP | MCP server | LLM via MCP client | MCP server |
| A2A | Agent Card publisher | Calling agent | Called agent |
| Web browser (function-calling agent) | Browser extension / WebMCP | LLM | Browser runtime |

无论在哪里,都是相同的四步.

### 为什么不直接提示模型输出JSON?

让模型使用JSON 回复是调用前面模式的函数. 在边界模型上,它大约有5%至15%的时间会失败,在更小模型上失败率更高.失败模式包括缺少大括号,尾随号,幻觉字段和错误类型.然后你就需要一次JSON修复通过,一次重试,或一个限制式解码器.

产业函数调用更好,原因有三点.第一,提供商会使用精确的调用形状对模型进行端到端训练,因此严格模式下的有效JSON率将提高到98%到99%.第二,调用有效载荷位于自己的协议插槽中,而不是自由文本内部.因此工具调用永远不会泄露给用户可见的回复.第三,提供商会通过限制的解码.`tool_use`子的`responseSchema`强制性遵守方案.

第13阶段 · 02 会并排讲解三个供应商API──第13阶段 · 04 会深入结构化输出──

### 电路断电器

当模型停止输出电话,或主机 达到最大轮数时,循环终止――生产环境主机通常设置在5到20轮之间――超过这个范围,你几乎肯定进入了模型无法退出的循环――Claude Code默认是 20;OpenAI助理是 10;Cursor的代理模式是 25――

另一种选择是无限循环 六个月就会见代理 一夜之间花费400美元的API电话 事件后复盘形式出现――不要在没有边界的情况下上线――

阶段14 · 12 会深入讲解错误恢复和自我治愈;阶段17 会覆盖生产率限制――

### 第13阶段 接下来走向哪里

- 课程 02 至 05 会打磨提供商级工具调用表面
- 课程6至14将将这个循环泛化为MCP.
- 课程15-18 会防护这个循环,抵御敌对服务器,对抗用户和未认证的远程作者表面──
- 课程19-22将扩展到代理人间合作,可观察性,路由和包装.
- 课23 会交付一个使用每个原始的完整生态系统.

剩下的每课都是对这四步循环的开端. 请把它作为一个不变的记忆.


```figure
tp-tool-loop
```

## 使用它
`code/main.py`通过用户消息进行模式匹配来模拟模型;执行者、方案验证器和观察步骤的使用都是真实的. 运行它,查看带有可打印的中间状态的完整请求/响应编程;然后在后续课程中将假的决定者 替换为任意真实提供者.

需要关注的内容:

- 工具注册表 为每个工具 持有三个字段:名称、描述、方案以及执行器引用──
- 验证器是最小的JSON Schema子集 ((类型、要求、enum、min/max),只使用stdlib 编写──Phase 13 · 04 会提供更完整的版本──
- 循环将重复数量 限制在五次.

## 交付它
本课会产出 `outputs/skill-tool-interface-reviewer.md`△给定一份工具草案定义 ((名称 +描述 + 方案 +执行程序概述),该技能 会审计其循环适用性:名称 是否机器稳定,描述 是否是完整的使用简介,方案 是否正确使用 JSON方案 2020-12,以及纯对后果分类 是否明确.

## 练习
1. 向`code/main.py`添加第四个工具,名为`get_stock_price(ticker)`将其描述 写成:当用户按标查询当前股票价格时使用.

2. 破坏方案验证器――传入一个`arguments`缺少对象 缺少所需字段 呼叫,并确认主机 会在执行前拒绝它――然后传入一个带有额外未知的字段的呼叫――做出决定:主机 应该拒绝还是忽略?使用一个安全论证说明你的选择――

3. 将利用中文中的每个工具 分类为纯或后果──给需要的注册表输入 添加`consequential: true`旗并修改循环,使其在选择后果工具时打印一行 将与用户确认──这是每个生产主机都需要的确认门形状──

4. 在纸上画出四步循环,并使用上述供应商列表填写您最喜欢的客户端:

5. 从头到尾阅读OpenAI的函数调用指南――找到一个位于请求中的段落,但不在本文所呈现的四步循环中的段落――解释它增加了什么,以及为什么它是方便项而不是必要项――

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Tool | “模型可以调用的东西” | name + JSON-Schema-typed input + executor function 组成的三元组 |
| Function calling | “Native tool use” | Provider-level API 支持，用于输出结构化 tool calls，而不是 prose |
| Tool call | “模型发出的行动请求” | 模型输出的一个 JSON payload，包含 `id`、`name`、`arguments` |
| Tool result | “tool 返回的内容” | executor 的输出，被包装在带有匹配 id 的 `tool` role message 中 |
| Parallel tool calls | “一次多个 calls” | 一个 model turn 中的多个 call objects，彼此独立，并可通过 id 排序 |
| Strict mode | “Guaranteed JSON” | Constrained decoding，强制模型输出通过已声明 schema 的验证 |
| Pure tool | “Read-only tool” | 无 side effects；可以安全地重新运行 |
| Consequential tool | “Action tool” | 会改变 external state；需要 gate、audit 或用户确认 |
| Four-step loop | “The tool-call cycle” | describe → decide → execute → observe |
| Host | “Agent runtime” | 持有 tool registry、调用模型并运行 executor 的程序 |

## 延伸阅读
- [OpenAI — Function calling guide](https://platform.openai.com/docs/guides/function-calling)OpenAI式工具声明和呼叫形状的可信引用
- [Anthropic — Tool use overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview)克劳德的`tool_use`现在,`tool_result`区块格式
- [Google — Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling)双子座中中`functionDeclarations`和平行调用语义
- [Model Context Protocol — Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28) 当前无状态 跨供应商通用工具接口规范
- [JSON Schema — 2020-12 release notes](https://json-schema.org/draft/2020-12/release-notes) 每个现代工具API都使用的方案方言
