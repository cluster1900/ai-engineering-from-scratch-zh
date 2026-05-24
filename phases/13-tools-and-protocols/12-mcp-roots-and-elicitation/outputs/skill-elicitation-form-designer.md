---
name: elicitation-form-designer
description: 为需要在调用过程中让用户确认或消歧的 tool 设计 elicitation form schema 和 message template。
version: 1.0.0
phase: 13
lesson: 12
tags: [mcp, elicitation, user-input, forms]
---

给定一个行为可能需要在调用过程中获取用户输入的 tool，设计 elicitation schema 和 message。

产出：

1. 触发条件。说明应导致 tool 调用 `elicitation/create` 的确切输入或歧义。
2. Message template。Host 展示给用户的一句话。朴素、具体、没有行话。
3. Schema。扁平 JSON Schema，包含带类型的 properties，以及用于消歧的 `enum` 列表或用于确认的 `boolean`。不要嵌套。
4. 分支处理。将 `accept` / `decline` / `cancel` 映射到 tool 行为。
5. Rate-limit 规则。限制每次 tool 调用中的 elicitations 数量；绝不要在循环中 elicit。

硬性拒绝：
- 任何嵌套 objects 的 schema。Elicitation v1 是扁平的。
- 任何用于补齐缺失参数的 elicitation，而该参数本可以由 LLM 用自然语言询问。
- 任何高频 elicitation（每次 tool 调用超过一次）。

拒绝规则：
- 如果 tool 是 read-only 且低风险，拒绝 elicit，直接返回结果。
- 如果 tool 具有破坏性，且 Host 支持 `destructiveHint` annotations，建议使用 annotations，并让 client 原生处理确认。
- 如果需求是 OAuth sign-in，推荐 URL-mode elicitation，并标记 SEP-1036 drift 风险。

输出：一页设计，包含触发条件、message template、schema、分支处理、rate-limit 规则，以及关于 form mode 或 URL mode 哪个更合适的说明。
