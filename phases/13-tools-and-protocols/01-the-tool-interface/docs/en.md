# Tool 接口——为什么 Agent 需要结构化 I/O

> 语言 Model 生成 Token，程序执行操作。两者之间的缺口由 Tool 接口填补：它是一份契约，让 Model 能够请求执行操作，并让主机程序实际执行。2026 年的每一种技术栈——OpenAI、Anthropic 和 Gemini 的 function calling；MCP 的 `tools/call`；A2A 的任务部分——都只是同一个四步循环的不同编码方式。本课将定义这个循环，并展示运行它所需的最小机制。

**Type:** Learn
**Languages:** Python（stdlib，不使用 LLM）
**Prerequisites:** Phase 11（LLM completion API）
**Time:** 约 45 分钟

## 学习目标

- 解释为什么只能生成文本的 LLM 无法独自对现实世界执行操作。
- 绘制四步 Tool 调用循环（描述 → 决策 → 执行 → 观察），并指出每一步由谁负责。
- 将 Tool 描述编写为三个部分：名称、JSON Schema 输入和确定性的执行器函数。
- 区分纯 Tool 和有副作用的 Tool，并说明这种划分为何对安全至关重要。

## 问题

LLM 输出的是下一个 Token 的 Probability Distribution。这就是它完整的输出界面。如果你询问聊天 Model“班加罗尔现在的天气如何”，它可以写出一句看似可信的话，却无法真正调用天气 API。这个回答可能碰巧正确，也可能已经过时三天。

Tool 接口的目的正是弥合这一缺口。主机程序——你的 Agent runtime、Claude Desktop、ChatGPT、Cursor 或自定义脚本——向 Model 公布一组可调用的 Tool。当 Model 判断需要执行操作时，它会输出一个结构化 payload，指定 Tool 名称及其参数。主机解析该 payload，实际运行 Tool，再将结果反馈给 Model。循环持续进行，直到 Model 判断不再需要调用任何 Tool。

这份契约的第一个版本于 2023 年 6 月作为 OpenAI 的 `functions` 参数发布。Anthropic 随后在 Claude 2.1 中引入了 `tool_use` block。几个月后，Gemini 加入了 `functionDeclarations`。现在，每家提供商都公开了相同的基本形式：输入一组由 JSON Schema 定义类型的 Tool，输出一个 JSON payload 形式的 Tool 调用。Model Context Protocol（2024 年 11 月）对这份契约进行了泛化，使一个 Tool registry 能够服务于所有 Model。A2A（2026 年 4 月，v1.0）又在同一原语之上加入了 Agent 到 Agent 的委派机制。

四步循环是所有这些机制背后的不变量。Phase 13 的其他所有内容都是对它的扩展。

## 概念

### 第一步：描述

主机使用三个字段声明每个 Tool。

- **名称。** 稳定且机器可读的标识符。应使用 `get_weather`，而不是“天气工具”。
- **描述。** 一段自然语言简介。“当用户询问特定城市的当前天气状况时使用。不要用于历史数据。”
- **输入 schema。** 描述 Tool 参数的 JSON Schema object（draft 2020-12）。

Model 会收到这份列表。现代提供商使用各自专用的模板，将这些声明序列化到 system Prompt 中，因此调用方只需处理结构化形式。

### 第二步：决策

根据用户消息和可用 Tool，Model 会选择以下三种行为之一。

1. **直接使用文本回答。** 不调用 Tool。
2. **调用一个或多个 Tool。** 输出结构化调用 object。在 `parallel_tool_calls: true` 下（OpenAI 和 Gemini 默认启用，Anthropic 需要选择启用），Model 可以在一个 turn 中输出多个调用。
3. **拒绝。** strict mode 的结构化输出可以生成带类型的 `refusal` block，而不是 Tool 调用。

Tool 调用 payload 包含三个稳定字段：调用 `id`、Tool `name` 和 JSON `arguments` object。`id` 用于让主机将稍后返回的结果与特定调用关联起来；当并行调用不按顺序返回时，这一点尤为重要。

### 第三步：执行

主机收到调用后，会依据声明的 schema 验证参数，然后运行执行器。参数无效意味着 Model 幻觉出了不存在的字段，或使用了错误的类型——这在能力较弱的 Model 上非常常见。生产环境中的主机通常会选择以下三种处理方式之一：立即失败并将错误呈现给 Model、使用受约束的 parser 修复 JSON，或者在 Prompt 中加入验证错误后重试 Model。

执行器本身只是普通代码，可以是 Python、TypeScript、shell 命令或数据库查询。它会生成一个结果，结果通常是字符串，但也可以是任意 JSON value 或结构化内容 block（MCP 中的文本、图像或资源引用）。结果必须能够被序列化。

### 第四步：观察

主机将 Tool 结果追加到对话中（作为具有匹配 `id` 的 `tool` role 消息），然后再次调用 Model。此时 Model 的 Context 中已经包含 Tool 输出，因此可以生成最终回答或请求更多调用。这个过程持续到 Model 停止输出调用，或主机触发迭代次数的安全上限。

### 信任边界

从安全角度看，Tool 可以分为两类。

- **纯 Tool。** 只读、确定性且没有副作用。例如 `get_weather`、`search_docs`、`get_current_time`。可以安全地进行推测性调用。
- **后果性 Tool。** 会修改状态、花费资金或接触用户数据。例如 `send_email`、`delete_file`、`execute_trade`。必须设置门禁。

Meta 在 2026 年提出的 Agent 安全“Rule of Two”指出，一个 turn 最多只能同时包含以下三项中的两项：不受信任的输入、敏感数据、后果性操作。Tool 接口正是执行这项规则的位置——你可以拒绝调用、要求用户确认或提升权限范围。完整的安全章节请参阅 Phase 13 · 15，Agent 级权限策略请参阅 Phase 14 · 09。

### 循环位于何处

| Context | 谁负责描述 | 谁负责决策 | 谁负责执行 |
|---------|---------------|-------------|--------------|
| 单 turn function calling（OpenAI/Anthropic/Gemini） | App 开发者 | LLM | App 开发者 |
| MCP | MCP server | LLM，通过 MCP client | MCP server |
| A2A | Agent Card 发布者 | 发起调用的 Agent | 被调用的 Agent |
| Web 浏览器（使用 function calling 的 Agent） | 浏览器扩展 / WebMCP | LLM | 浏览器 runtime |

无论在哪里，都遵循相同的四个步骤。列名会变化，结构不会变化。

### 为什么不能只通过 Prompt 要求 Model 输出 JSON？

“要求 Model 使用 JSON 回复”是 function calling 出现之前的常用模式。即使在 frontier Model 上，它也有约 5% 到 15% 的失败率，在较小的 Model 上失败率更高。失败形式包括缺少大括号、多余的尾随逗号、幻觉字段和错误类型。之后你还需要执行 JSON 修复、重试或使用 constrained decoder。

原生 function calling 更好，原因有三点。首先，提供商会针对准确的调用结构对 Model 进行端到端 Training，因此在 strict mode 下，有效 JSON 的比例可以提升到 98% 至 99%。其次，调用 payload 位于独立的协议槽位中，而不是自由文本内，因此 Tool 调用不会泄漏到用户可见的回复中。第三，提供商使用 constrained decoding 强制满足 schema（OpenAI 的 strict mode、Anthropic 的 `tool_use`、Gemini 的 `responseSchema`），从而保证输出通过验证。

Phase 13 · 02 将并列介绍三家提供商的 API。Phase 13 · 04 将深入讲解结构化输出。

### Circuit breaker

当 Model 停止输出调用，或主机达到最大 turn 数时，循环终止。生产环境中的主机通常将上限设置在 5 到 20 个 turn 之间。超过这个范围，几乎可以确定 Model 已陷入无法自行退出的循环。Claude Code 默认为 20，OpenAI Assistants 默认为 10，Cursor 的 Agent mode 默认为 25。

另一种选择——无限制循环——每隔约六个月就会出现在类似“Agent 一夜之间花掉 400 美元 API 调用费”的事后分析中。不要在没有上限的情况下发布。

Phase 14 · 12 深入讲解错误恢复和自愈；Phase 17 讲解生产环境中的速率限制。

### Phase 13 接下来讲什么

- 第 02 至 05 课完善提供商层面的 Tool 调用界面。
- 第 06 至 14 课将该循环泛化到 MCP。
- 第 15 至 18 课保护该循环免受恶意 server、对抗性用户和未经身份验证的远程认证界面的攻击。
- 第 19 至 22 课将该模式扩展到 Agent 之间的协作、可观测性、路由和打包。
- 第 23 课使用所有原语交付一个完整的生态系统。

后续每一课都是对这个四步循环的扩展。请始终将它作为不变量牢记在心。

```figure
tp-tool-loop
```

## 使用它

`code/main.py` 在不使用 LLM 的情况下运行四步循环。一个虚假的“决策器”函数通过对用户消息进行模式匹配来模拟 Model；执行器、schema validator 和观察步骤的 harness 都是真实的。运行它即可查看完整的请求/响应流程及可打印的中间状态；在后续课程中，你可以将虚假决策器替换为任意真实提供商。

需要关注：

- Tool registry 为每个 Tool 保存名称、描述、schema 和执行器引用。
- validator 是仅使用 stdlib 编写的最小 JSON Schema 子集，支持类型、必填字段、enum 和最小值/最大值。Phase 13 · 04 将提供更完整的版本。
- 循环将迭代次数限制为五次。生产环境中的 Agent 同样需要这种 circuit breaker。

## 交付它

本课会生成 `outputs/skill-tool-interface-reviewer.md`。给定一份 Tool 定义草案（名称 + 描述 + schema + 执行器概要），该 Skill 会审核它是否适合用于循环：名称是否具有机器稳定性、描述是否提供完整的使用说明、schema 是否正确使用 JSON Schema 2020-12，以及是否明确区分纯 Tool 与后果性 Tool。

## 练习

1. 在 `code/main.py` 中添加第四个名为 `get_stock_price(ticker)` 的 Tool。将其描述写为：“当用户通过 ticker 询问当前股票价格时使用。不要用于历史价格或市场摘要。”运行 harness，并确认虚假决策器会将包含 ticker 的查询路由到新 Tool。

2. 破坏 schema validator。传入一个 `arguments` object 缺少必填字段的调用，并确认主机在执行前将其拒绝。然后传入一个包含额外未知字段的调用。作出决定：主机应该拒绝还是忽略？从安全角度论证你的选择。

3. 将 harness 中的每个 Tool 分类为纯 Tool 或后果性 Tool。为有需要的 registry 条目添加 `consequential: true` 标志，并修改循环，使其在选中后果性 Tool 时打印一行“需要向用户确认”。这就是每个生产环境主机所需的确认门禁形式。

4. 在纸上绘制四步循环，并针对你喜欢的 client（Claude Desktop、Cursor、ChatGPT 或自定义技术栈）填写上方的提供商列。将其与 Phase 13 · 06 中 MCP 专用的变体进行交叉对照。

5. 从头到尾阅读 OpenAI 的 function calling 指南。找出请求中存在、但未出现在本课四步循环中的一个字段。解释它增加了什么，以及为什么它只是提供便利而非不可或缺。

## 关键术语

| 术语 | 人们通常怎么说 | 它的实际含义 |
|------|----------------|------------------------|
| Tool | “Model 可以调用的东西” | 名称 + 由 JSON Schema 定义类型的输入 + 执行器函数组成的三元组 |
| Function calling | “原生 Tool 使用” | 提供商层面的 API 支持，使 Model 能够输出结构化 Tool 调用，而不是自然语言文本 |
| Tool call | “Model 发出的操作请求” | Model 输出的 JSON payload，包含 `id`、`name` 和 `arguments` |
| Tool result | “Tool 返回的内容” | 执行器的输出，被包装在具有匹配 id 的 `tool` role 消息中 |
| Parallel tool calls | “同时进行多个调用” | 一个 Model turn 中包含多个调用 object，它们相互独立，并可按 id 排序 |
| Strict mode | “保证有效的 JSON” | constrained decoding，强制 Model 输出通过已声明 schema 的验证 |
| Pure tool | “只读 Tool” | 没有副作用，可以安全地重新运行 |
| Consequential tool | “操作型 Tool” | 修改外部状态，需要门禁、审计或用户确认 |
| Four-step loop | “Tool 调用周期” | 描述 → 决策 → 执行 → 观察 |
| Host | “Agent runtime” | 保存 Tool registry、调用 Model 并运行执行器的程序 |

## 延伸阅读

- [OpenAI — Function calling 指南](https://platform.openai.com/docs/guides/function-calling) — OpenAI 风格 Tool 声明和调用结构的规范参考
- [Anthropic — Tool use 概览](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview) — Claude 的 `tool_use` / `tool_result` block 格式
- [Google — Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling) — Gemini 中的 `functionDeclarations` 和并行调用语义
- [Model Context Protocol — Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28) — 当前无状态、与提供商无关的 Tool 接口泛化规范
- [JSON Schema — 2020-12 release notes](https://json-schema.org/draft/2020-12/release-notes) — 每种现代 Tool API 都使用的 schema 方言
