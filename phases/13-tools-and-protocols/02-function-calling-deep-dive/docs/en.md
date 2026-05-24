# Function Calling 深入解析 — OpenAI, Anthropic, Gemini

> 这三家 frontier providers 在 2024 年收敛到了同一个 tool-call loop，然后在其他所有地方分道扬镳。OpenAI 使用 `tools` 和 `tool_calls`。Anthropic 使用 `tool_use` 和 `tool_result` blocks。Gemini 使用 `functionDeclarations` 和 unique-id correlation。本课将三者并排 diff，让在一个 provider 上交付的代码在移植到另一个 provider 时不会坏掉。

**Type:** Build
**Languages:** Python (stdlib, schema translators)
**Prerequisites:** Phase 13 · 01（the tool interface）
**Time:** ~75 分钟

## 学习目标
- 说出 OpenAI、Anthropic 和 Gemini function-calling payloads 之间的三类 shape 差异（declaration、call、result）。
- 将一个 tool declaration 翻译到三个 provider formats，并预测 strict-mode constraints 会在哪里不同。
- 在每个 provider 中使用 `tool_choice` 来强制、禁止或自动选择 tool calls。
- 了解每个 provider 的 hard limits（tool count、schema depth、argument length），以及违反 limits 时各自发出的 error signatures。

## 问题
function-calling request 的 shape 因 provider 而异。以下是 2026 production stacks 中的三个具体例子：

**OpenAI Chat Completions / Responses API.** 你传入 `tools: [{type: "function", function: {name, description, parameters, strict}}]`。model 的 response 包含 `choices[0].message.tool_calls: [{id, type: "function", function: {name, arguments}}]`，其中 `arguments` 是你必须解析的 JSON string。Strict mode（`strict: true`）通过 constrained decoding 强制 schema compliance。

**Anthropic Messages API.** 你传入 `tools: [{name, description, input_schema}]`。response 以 `content: [{type: "text"}, {type: "tool_use", id, name, input}]` 返回。`input` 已经被解析（是 object，不是 string）。你再回复一个新的 `user` message，其中包含 `{type: "tool_result", tool_use_id, content}` block。

**Google Gemini API.** 你传入 `tools: [{functionDeclarations: [{name, description, parameters}]}]`（嵌套在 `functionDeclarations` 下）。response 以 `candidates[0].content.parts: [{functionCall: {name, args, id}}]` 到达，其中 `id` 在 Gemini 3 及以上版本中是 unique，用于 parallel-call correlation。你回复 `{functionResponse: {name, id, response}}`。

同一个 loop。不同的 field names、不同的 nesting、不同的 string-vs-object conventions、不同的 correlation mechanisms。一个团队在 OpenAI 上写 weather agent，只是为了 plumbing，移植到 Anthropic 就要花两天，再移植到 Gemini 又要一天。

本课构建一个 translator，将三种 formats 统一成一个 canonical tool declaration，并在 edge 做 routing。Phase 13 · 17 会把同一模式泛化成 LLM gateway。

## 概念
### The common structure

每个 provider 都需要五样东西：

1. **Tool list.** 每个 tool 的 name、description 和 input schema。
2. **Tool choice.** 强制使用特定 tool、禁止 tools，或让 model 决定。
3. **Call emission.** 命名 tool 和 arguments 的 structured output。
4. **Call id.** 将 response 关联到正确的 call（parallel 时很重要）。
5. **Result injection.** 一个 message 或 block，将 result 绑定回 call。

### 逐个 field 比较 shape diff

| Aspect | OpenAI | Anthropic | Gemini |
|--------|--------|-----------|--------|
| Declaration envelope | `{type: "function", function: {...}}` | `{name, description, input_schema}` | `{functionDeclarations: [{...}]}` |
| Schema field | `parameters` | `input_schema` | `parameters` |
| Response container | assistant message 上的 `tool_calls[]` | type 为 `tool_use` 的 `content[]` | type 为 `functionCall` 的 `parts[]` |
| Arguments type | stringified JSON | parsed object | parsed object |
| Id format | `call_...`（OpenAI 生成） | `toolu_...`（Anthropic） | UUID（Gemini 3+） |
| Result block | role `tool`, `tool_call_id` | 带 `tool_result`, `tool_use_id` 的 `user` | 带匹配 `id` 的 `functionResponse` |
| Force-a-tool | `tool_choice: {type: "function", function: {name}}` | `tool_choice: {type: "tool", name}` | `tool_config: {function_calling_config: {mode: "ANY"}}` |
| Forbid tools | `tool_choice: "none"` | `tool_choice: {type: "none"}` | `mode: "NONE"` |
| Strict schema | `strict: true` | schema-is-schema（始终 enforce） | request level 的 `responseSchema` |

### 你实际会遇到的限制

- **OpenAI.** 每个 request 最多 128 个 tools。Schema depth 5。Argument string <= 8192 bytes。Strict mode 要求没有 `$ref`，没有带 overlap 的 `oneOf`/`anyOf`/`allOf`，每个 property 都列在 `required` 中。
- **Anthropic.** 每个 request 最多 64 个 tools。Schema depth 实际上不设上限，但 practical limit 为 10。没有 strict-mode flag；schema 是 contract，model 通常会遵守。
- **Gemini.** 每个 request 最多 64 个 functions。Schema types 是 OpenAPI 3.0 subset（与 JSON Schema 2020-12 略有差异）。自 Gemini 3 起，parallel calls 使用 unique-id。

### `tool_choice` behavior

三种模式大家都支持，只是命名不同。

- **Auto.** Model 选择 tool 或 text。默认值。
- **Required / Any.** Model 必须至少调用一个 tool。
- **None.** Model 不得调用 tools。

另外，每个 provider 都有一个独有模式：

- **OpenAI.** 按 name 强制使用特定 tool。
- **Anthropic.** 按 name 强制使用特定 tool；`disable_parallel_tool_use` flag 区分 single vs multi。
- **Gemini.** `mode: "VALIDATED"` 会让每个 response 经过 schema validator，无论 model intent 如何。

### Parallel calls

OpenAI 的 `parallel_tool_calls: true`（默认）会在一个 assistant message 中发出多个 calls。你运行全部 calls，然后用 batched tool-role message 回复，其中每个 `tool_call_id` 对应一个 entry。Anthropic 过去是 single-call；`disable_parallel_tool_use: false`（截至 Claude 3.5 的默认值）启用 multi。Gemini 2 允许 parallel calls，但没有给出 stable ids；Gemini 3 增加 UUIDs，因此 out-of-order responses 可以干净地 correlate。

### Streaming

三者都支持 streamed tool calls。wire format 不同：

- **OpenAI.** `tool_calls[i].function.arguments` 的 delta chunks 会增量到达。你累积到 `finish_reason: "tool_calls"`。
- **Anthropic.** Block-start / block-delta / block-stop events。`input_json_delta` chunks 携带 partial arguments。
- **Gemini.** `streamFunctionCallArguments`（Gemini 3 新增）发出带 `functionCallId` 的 chunks，因此多个 parallel calls 可以交错。

Phase 13 · 03 会深入讲 parallel + streaming reassembly。本课聚焦 declaration 和 single-call shapes。

### Errors and repair

Invalid-argument errors 的表现也不同。

- **OpenAI (non-strict).** Model 返回 `arguments: "{bad json}"`，你的 JSON parse 失败，你注入 error message 并重新 call。
- **OpenAI (strict).** Validation 在 decoding 期间发生；invalid JSON 不可能出现，但可能出现 `refusal`。
- **Anthropic.** `input` 可能包含 unexpected fields；schema 是 advisory。需要 server-side validate。
- **Gemini.** OpenAPI 3.0 quirk：object fields 上的 `enum` 会被静默忽略；你需要自己 validate。

### The translator pattern

你代码中的 canonical tool declaration 看起来像这样（shape 由你选择）：

```python
Tool(
    name="get_weather",
    description="Use when ...",
    input_schema={"type": "object", "properties": {...}, "required": [...]},
    strict=True,
)
```

三个小函数将它翻译成三种 provider shapes。`code/main.py` 中的 harness 正是这样做的，然后把一个 fake tool call 通过每个 provider 的 response shape 做 round-trip。无需网络，本课教授的是 shapes，不是 HTTP。

Production teams 会把这个 translator 包进 `AbstractToolset`（Pydantic AI）、`UniversalToolNode`（LangGraph）或 `BaseTool`（LlamaIndex）。Phase 13 · 17 会交付一个 gateway，在三者任意一个前面暴露 OpenAI-shaped API。

## 使用它
`code/main.py` 定义一个 canonical `Tool` dataclass，以及三个 translators，用来发出 OpenAI、Anthropic 和 Gemini declaration JSON。然后它将每种 shape 的 hand-crafted provider response 解析为同一个 canonical call object，展示语义在表层之下是相同的。运行它，并并排 diff 三个 declarations。

需要观察的点：

- 三个 declaration blocks 只在 envelope 和 field names 上不同。
- 三个 response blocks 的差异在于 call 所在位置（top-level `tool_calls`、`content[]` block、`parts[]` entry）。
- 一个 `canonical_call()` function 从全部三种 response shapes 中提取 `{id, name, args}`。

## 交付它
本课产出 `outputs/skill-provider-portability-audit.md`。给定一个面向某个 provider 的 function-calling integration，该 skill 会生成 portability audit：它依赖哪些 provider limits、哪些 fields 需要 renaming，以及移植到其他 provider 时会出现什么 breakage。

## 练习
1. 运行 `code/main.py`，验证三个 provider declaration JSONs 都序列化同一个底层 `Tool` object。修改 canonical tool，添加一个 enum parameter，并确认只有 Gemini translator 需要处理 OpenAPI quirk。

2. 为每个 provider 添加一个 `ListToolsResponse` parser，从 model 在 `list_tools` 或 discovery call 后返回的内容中提取 tool list。OpenAI 原生没有这一项；记录这个 asymmetry。

3. 实现 `tool_choice` conversion：将 canonical `ToolChoice(mode="force", tool_name="x")` 映射到三种 provider shapes。然后映射 `mode="any"` 和 `mode="none"`。检查本课的 diff table。

4. 选择三个 providers 中的一个，从头到尾阅读它的 function-calling guide。找出它 schema spec 中一个其他两个不支持的 field。候选项：OpenAI `strict`、Anthropic `disable_parallel_tool_use`、Gemini `function_calling_config.allowed_function_names`。

5. 写一个 test vector：一个 arguments 违反 declared schema 的 tool call。将它跑过每个 provider 的 validator（Lesson 01 中的 stdlib validator 可以作为 proxy），并记录触发了哪些 errors。记录你在 production 中会为了 strictness 使用哪个 provider。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Function calling | "Tool use" | 用于 structured tool-call emission 的 provider-level API |
| Tool declaration | "Tool spec" | Name + description + JSON Schema input payload |
| `tool_choice` | "Force / forbid" | Auto / required / none / specific-name modes |
| Strict mode | "Schema enforcement" | OpenAI flag，用于约束 decoding 以匹配 schema |
| `tool_use` block | "Anthropic's call shape" | 带 id、name、input 的 inline content block |
| `functionCall` part | "Gemini's call shape" | 包含 name、args 和 id 的 `parts[]` entry |
| Arguments-as-string | "Stringified JSON" | OpenAI 将 args 作为 JSON string 返回，而不是 object |
| Parallel tool calls | "Fan-out in one turn" | 一个 assistant message 中的多个 tool calls |
| Refusal | "Model declines" | strict-mode-only 的 refusal block，而不是 call |
| OpenAPI 3.0 subset | "Gemini schema quirk" | Gemini 使用一种类似 JSON-Schema 的 dialect，存在细微差异 |

## 延伸阅读
- [OpenAI — Function calling guide](https://platform.openai.com/docs/guides/function-calling) — 包含 strict mode 和 parallel calls 的 canonical reference
- [Anthropic — Tool use overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview) — `tool_use` 和 `tool_result` block semantics
- [Google — Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling) — parallel calls、unique ids 和 OpenAPI subset
- [Vertex AI — Function calling reference](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/function-calling) — Gemini 的企业级 surface
- [OpenAI — Structured outputs](https://platform.openai.com/docs/guides/structured-outputs) — strict-mode schema 强制执行细节
