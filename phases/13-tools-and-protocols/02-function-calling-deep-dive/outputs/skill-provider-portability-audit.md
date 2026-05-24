---
name: provider-portability-audit
description: 审计针对某个 provider 的 function-calling 集成，判断移植到另外两个 provider 时会破坏什么。
version: 1.0.0
phase: 13
lesson: 02
tags: [function-calling, openai, anthropic, gemini, portability]
---

给定一个基于某个 provider（OpenAI、Anthropic 或 Gemini）的 function-calling 集成，产出一份可移植性审计，列出当同一套逻辑发布到另外两个 provider 时出现的每个字段重命名、行为差异和硬性限制冲突。

产出：

1. 声明差异。对集成中的每个 tool，展示另外两个 provider 分别需要的 envelope / 字段重命名 / schema 转换。标记目标 provider 不支持的任何 JSON Schema 构造（Gemini：OpenAPI 3.0 子集；OpenAI strict：不支持 `$ref`，不支持含糊的 `oneOf`）。
2. 响应差异。记录 tool call 在每个 provider 的响应结构中位于哪里（`tool_calls[]` vs `content[]` block vs `parts[]` entry），以及谁负责解析 `arguments`（OpenAI 上是 string，Anthropic 和 Gemini 上是 object）。
3. `tool_choice` 差异。将集成当前的 choice 设置（auto / forbid / force / required）映射到目标 provider 结构；标记缺失的模式。
4. 限制冲突。报告 tool 数量（128 / 64 / 64）、schema 深度（5 / 10 / 实际上不受限）和单个 argument 长度上限。任何集成超过目标 provider 限制时，提高到 block 级严重性。
5. strict-mode 映射。说明目标上是否保留 strict-mode 语义。OpenAI `strict: true` 在 Anthropic 上没有精确等价物；Gemini `responseSchema` 近似但位于 request 级别。

硬性拒绝：
- 任何假设非 OpenAI 目标上的 `arguments` 是 string 的集成。会静默产生错误结果。
- 任何在没有 router 的情况下移植到 Anthropic 或 Gemini 时 tool 数量超过 64 的集成。
- 任何在目标是 OpenAI strict mode 时在 schema 中使用 `$ref` 的集成。

拒绝规则：
- 如果被要求移植依赖某个 provider-specific feature 且没有对应物的集成（例如 OpenAI Responses API stateful turns、Anthropic computer-use blocks），拒绝并说明哪个 feature 没有目标等价物。
- 如果被要求选出赢家，拒绝。选择取决于 host 的 strict-mode 需求、成本画像和 parallel-call 要求。

输出：一页审计，包含 per-tool diff table、limits table，以及每个目标 provider 的最终 “port verdict”（ship / needs-router / blocked-by-feature）。最后用一句话命名杠杆最高的迁移改动。
