# The Tool Interface — 为什么 Agents 需要结构化 I/O

> 语言模型会生成 tokens。程序会执行动作。两者之间的差距就是 tool interface：一种 contract，让模型能够请求某个动作，并让 host 执行它。2026 年的每一种 stack——OpenAI、Anthropic 和 Gemini 上的 function calling；MCP 的 `tools/call`；A2A 的 task parts——都是同一个四步循环的不同编码。本课会命名这个循环，并展示运行它所需的最小机制。

**Type:** Learn
**Languages:** Python (stdlib, no LLM)
**Prerequisites:** Phase 11 (LLM completion APIs)
**Time:** ~45 minutes

## 学习目标
- 解释为什么一个只能生成文本的 LLM 不能单凭自身对真实世界采取行动。
- 画出四步 tool-call loop（describe → decide → execute → observe），并说出每一步由谁负责。
- 将一个 tool description 写成三部分：name、JSON Schema input，以及确定性的 executor function。
- 区分 pure tools 和 side-effecting tools，并说明这种划分为什么对安全很重要。

## 问题
LLM 输出的是下一个 token 的概率分布。这就是它的全部输出表面。如果你问一个 chat model “Bengaluru 现在天气如何”，它可以写出一句看起来合理的话，但它不能接入天气 API。那句话可能只是碰巧正确，也可能已经过时三天。

弥合这个差距正是 tool interface 的目的。host program——你的 agent runtime、Claude Desktop、ChatGPT、Cursor，或一个自定义 script——会向模型公布一组可调用 tools。当模型判断需要某个动作时，它会输出一个结构化 payload，指明 tool 及其 arguments。host 解析该 payload，真正运行 tool，并把结果反馈回去。这个循环会持续进行，直到模型判断不再需要更多调用。

这个 contract 的第一个版本于 2023 年 6 月以 OpenAI 的 “functions” 参数形式发布。Anthropic 随后在 Claude 2.1 中加入了 `tool_use` blocks。Gemini 几个月后加入了 `functionDeclarations`。现在每个 provider 都暴露同样的形状：输入一个由 JSON-Schema 标注类型的 tool list，输出一个 JSON-payload tool call。Model Context Protocol（2024 年 11 月）将这个 contract 泛化，使一个 tool registry 可以服务每个模型。A2A（2026 年 4 月，v1.0）在同一个 primitive 之上叠加了 agent-to-agent delegation。

四步循环是这些系统底层的不变量。Phase 13 的其余内容都是对它的展开。

## 概念
### Step one: describe

host 用三个字段声明每个 tool。

- **Name.** 一个稳定、机器可读的标识符。用 `get_weather`，而不是 “weather thing”。
- **Description.** 一段自然语言简介。“当用户询问某个具体城市的当前天气状况时使用。不要用于历史数据。”
- **Input schema.** 一个描述 tool arguments 的 JSON Schema object（draft 2020-12）。

模型会接收这份列表。现代 providers 会使用 provider-specific template 将这些声明序列化进 system prompt，因此作为调用方，你只需要处理结构化形式。

### Step two: decide

给定用户消息和可用 tools，模型会选择三种行为之一。

1. **直接用文本回答**。不进行 tool call。
2. **调用一个或多个 tools。** 输出结构化 call objects。在 `parallel_tool_calls: true` 下（OpenAI 和 Gemini 默认启用，Anthropic 需要 opt-in），模型可以在一个 turn 中输出多个 calls。
3. **拒绝。** Strict-mode structured outputs 可以生成一个类型化的 `refusal` block，而不是 call。

一个 tool call payload 有三个稳定字段：call `id`、tool `name`，以及 JSON `arguments` object。id 的存在，是为了让 host 能够将后续结果与特定 call 关联起来；当 parallel calls 乱序返回时，这一点很重要。

### Step three: execute

host 接收 call，按照声明的 schema 验证 arguments，并运行 executor。无效 arguments 意味着模型 hallucinated 了某个字段或使用了错误类型——这是弱模型上非常常见的失败模式。生产环境中的 hosts 对无效 arguments 通常会做三件事之一：快速失败并将错误暴露给模型；用 constrained parser 修复 JSON；或在 prompt 中包含 validation error 后重试模型。

executor 本身只是普通代码。Python、TypeScript、shell command、database query。它会产生一个结果，通常是 string，但也可以是任何 JSON value 或 structured content block（在 MCP 中可以是 text、image 或 resource reference）。结果必须可以序列化。

### Step four: observe

host 将 tool result 追加到 conversation 中（作为带有匹配 `id` 的 `tool` role message），并再次调用模型。模型现在在 context 中拥有 tool output，可以生成最终答案，或请求更多 calls。这个过程会持续，直到模型停止输出 calls，或 host 达到迭代次数的安全上限。

### The trust split

Tools 有两种对安全很重要的类型。

- **Pure.** 只读、确定性、无 side effects。`get_weather`、`search_docs`、`get_current_time`。可以安全地进行 speculative 调用。
- **Consequential.** 会改变 state、花钱、触及用户数据。`send_email`、`delete_file`、`execute_trade`。必须加 gate。

Meta 2026 年用于 agent security 的 “Rule of Two” 表示，一个 turn 最多只能同时包含以下三者中的两项：untrusted input、sensitive data、consequential action。tool interface 正是你执行这条规则的位置——通过拒绝 calls、要求用户确认，或提升 scopes。完整安全章节见 Phase 13 · 15，agent-level permission policies 见 Phase 14 · 09。

### Where the loop lives

| Context | Who describes | Who decides | Who executes |
|---------|---------------|-------------|--------------|
| Single-turn function calling (OpenAI/Anthropic/Gemini) | App developer | LLM | App developer |
| MCP | MCP server | LLM via MCP client | MCP server |
| A2A | Agent Card publisher | Calling agent | Called agent |
| Web browser (function-calling agent) | Browser extension / WebMCP | LLM | Browser runtime |

无论在哪里，都是同样的四步。列名会变，结构不会变。

### 为什么不直接 prompt 模型输出 JSON?

“让模型用 JSON 回复” 是 function calling 出现前的模式。它在 frontier models 上大约有 5% 到 15% 的时间会失败，在更小的模型上失败率更高。失败模式包括缺少大括号、尾随逗号、hallucinated fields 和错误类型。然后你就需要一次 JSON repair pass、一次 retry，或一个 constrained decoder。

Native function calling 更好，原因有三点。第一，provider 会用精确的 call shape 对模型进行 end-to-end 训练，因此 strict mode 下的 valid-JSON rate 会提升到 98% 到 99%。第二，call payload 位于自己的 protocol slot 中，而不是 free-text 内部——因此 tool call 永远不会泄露到用户可见的回复里。第三，providers 会通过 constrained decoding（OpenAI 的 strict mode、Anthropic 的 `tool_use`、Gemini 的 `responseSchema`）强制 schema compliance。输出保证能够通过验证。

Phase 13 · 02 会并排讲解三个 provider APIs。Phase 13 · 04 会深入 structured outputs。

### Circuit breakers

当模型停止输出 calls，或 host 达到最大 turn count 时，循环终止。生产环境 hosts 通常将其设置在 5 到 20 turns 之间。超过这个范围，你几乎肯定进入了模型无法退出的循环。Claude Code 默认是 20；OpenAI Assistants 是 10；Cursor 的 agent mode 是 25。

另一种选择——unbounded loops——每六个月就会以“agent 一夜之间花掉 400 美元 API calls”的事后复盘形式出现。不要在没有边界的情况下上线。

Phase 14 · 12 会深入讲解 error recovery 和 self-healing；Phase 17 会覆盖 production rate limits。

### Phase 13 接下来走向哪里

- Lessons 02 through 05 会打磨 provider-level tool-call surface。
- Lessons 06 through 14 会将这个循环泛化为 MCP。
- Lessons 15 through 18 会防护这个循环，抵御 hostile servers、adversarial users 和 unauthenticated remote auth surfaces。
- Lessons 19 through 22 会将这个模式扩展到 agent-to-agent collaboration、observability、routing 和 packaging。
- Lesson 23 会交付一个使用每个 primitive 的完整 ecosystem。

剩余每一课都是对这个四步循环的展开。请把它作为不变量记在心里。

## 使用它
`code/main.py` 会在没有 LLM 的情况下运行四步循环。一个假的 “decider” function 通过对用户消息进行 pattern-matching 来模拟模型；executor、schema validator 和 observe-step harness 都是真实的。运行它，查看带有可打印中间 state 的完整 request/response choreography；然后在后续课程中将 fake decider 替换为任意真实 provider。

需要关注的内容：

- tool registry 为每个 tool 持有三个字段：name、description、schema，以及 executor reference。
- validator 是一个最小 JSON Schema subset（types、required、enum、min/max），只用 stdlib 编写。Phase 13 · 04 会提供更完整的版本。
- 循环将 iteration count 限制在五次。生产 agents 正是需要这种 circuit breaker。

## 交付它
本课会产出 `outputs/skill-tool-interface-reviewer.md`。给定一份 draft tool definition（name + description + schema + executor outline），该 skill 会审计它的 loop fitness：name 是否 machine-stable，description 是否是完整的 usage brief，schema 是否正确使用 JSON Schema 2020-12，以及 pure-vs-consequential classification 是否明确。

## 练习
1. 向 `code/main.py` 添加第四个 tool，名为 `get_stock_price(ticker)`。将它的 description 写成：“当用户按 ticker 询问当前股票价格时使用。不要用于历史价格或市场摘要。” 运行 harness，并确认 fake decider 会把提到 tickers 的 queries 路由到这个新 tool。

2. 破坏 schema validator。传入一个 `arguments` object 缺少 required field 的 call，并确认 host 会在 execution 前拒绝它。然后传入一个带有额外未知字段的 call。做出决定：host 应该 reject 还是 ignore？用一个安全论证说明你的选择。

3. 将 harness 中的每个 tool 分类为 pure 或 consequential。给需要的 registry entries 添加 `consequential: true` flag，并修改循环，使其在选择 consequential tool 时打印一行 “would confirm with user”。这就是每个生产 host 都需要的 confirmation gate 形状。

4. 在纸上画出四步循环，并用上面的 provider-column table 填入你最喜欢的 client（Claude Desktop、Cursor、ChatGPT 或自定义 stack）。与 Phase 13 · 06 中的 MCP-specific variant 交叉对照。

5. 从头到尾阅读 OpenAI 的 function-calling guide。找出一个位于 request 中、但不在本文所呈现的四步循环中的字段。解释它增加了什么，以及为什么它是方便项而不是必要项。

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
- [OpenAI — Function calling guide](https://platform.openai.com/docs/guides/function-calling) — OpenAI-style tool declarations 和 call shapes 的 canonical reference
- [Anthropic — Tool use overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview) — Claude 的 `tool_use` / `tool_result` block format
- [Google — Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling) — Gemini 中的 `functionDeclarations` 和 parallel-call semantics
- [Model Context Protocol — Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) — tool interface 的 provider 无关泛化
- [JSON Schema — 2020-12 release notes](https://json-schema.org/draft/2020-12/release-notes) — 每个现代 tool API 都使用的 schema dialect
