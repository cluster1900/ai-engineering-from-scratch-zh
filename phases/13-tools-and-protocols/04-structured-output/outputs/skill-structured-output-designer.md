---
name: structured-output-designer
description: 为自由文本提取目标设计兼容 strict-mode 的 JSON Schema 和 Pydantic model，并加入 typed refusal 与 retry handling stub。
version: 1.0.0
phase: 13
lesson: 04
tags: [structured-output, json-schema, pydantic, strict-mode, extraction]
---

给定一个自由文本提取目标（invoices、resumes、support tickets、research summaries），产出一个可用于生产的提取契约：JSON Schema 2020-12、Pydantic model、refusal handler 和 retry policy。

产出：

1. JSON Schema 2020-12。每个 property 都有类型。`required` 列出每个 property。每个 object 都设置 `additionalProperties: false`。对封闭取值集合使用 enums。不使用 `$ref`。不使用含糊的 `oneOf` / `anyOf`。按照 OpenAI strict-mode requirements 验证。
2. Pydantic v2 BaseModel。使用 Python types 镜像 schema。`model_json_schema()` 必须生成与 (1) 等价的 schema。
3. Refusal handler。typed `Refusal(reason: str, category: str)` outcome。列出 categories：`safety`、`input_mismatch`、`insufficient_info`。
4. Retry policy。三种 retry 形态：(a) 注入 validation errors 并 retry 一次（在 strict mode 之外）；(b) 接受 refusal 作为 final（strict mode）；(c) 在 repeated refusal 时升级到更强的 model。
5. Test vectors。十个 inputs，覆盖 happy path、adversarial fields、partial input 和一个触发 refusal 的 case。每个都带 expected outcome。

硬性拒绝：
- 任何包含 untyped fields 的 schema。strict mode 和 validator 都会失败。
- 任何缺少 `additionalProperties: false` 的 schema。会泄漏 hallucinations。
- 任何使用 `oneOf` 但没有 discriminator field 的 schema。decoding 含糊。
- 任何没有检查 JSON Schema round-trip 的 Pydantic model。

Refusal rules：
- 如果目标 domain 包含 personally identifying data 且没有 documented purpose，则 refuse，并路由到 Phase 18（ethics）以给出 lawful-basis argument。
- 如果用户要求的 schema 无法用 JSON Schema 2020-12 表达（例如 recursive arbitrary graphs），则 refuse，并提出最接近的可表达放宽方案。
- 如果 extraction target 是 “extract structured data from anything”，则 refuse，并要求给出 specific domain。

Output：一页契约，包含 schema JSON、Pydantic class、refusal 和 retry policy，以及十个 test vectors。最后附上一条说明：第一个要目标适配的 provider 是哪个，以及原因。
