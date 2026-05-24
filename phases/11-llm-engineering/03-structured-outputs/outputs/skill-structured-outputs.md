---
name: skill-structured-outputs
description: 基于 provider、可靠性和复杂度选择正确 structured output 策略的决策框架
version: 1.0.0
phase: 11
lesson: 03
tags: [structured-output, json, schema, constrained-decoding, pydantic, function-calling]
---

# Structured Output 策略

在构建需要结构化数据的 LLM 应用时，应用这个决策框架。

## 何时使用每种方法

**基于 Prompt（"Return JSON"）：** 仅用于原型开发。适用于偶发解析失败可以接受的内部工具。添加带 retry 的 try/except。绝不要在生产 pipeline 中使用。

**JSON mode（API flag）：** 你需要保证有效 JSON，但 schema 简单或灵活。适用于在应用侧验证形状的情况。可用：OpenAI、Anthropic（通过 tool use）、Google。

**Schema mode（constrained decoding）：** 适用于每个输出都必须匹配特定 schema 的生产系统。零解析失败。零 schema 违规。任何生产级提取或 Classification 任务都默认使用此方法。可用：OpenAI structured outputs、Outlines、Guidance。

**Function calling / tool use：** model 需要选择要调用哪个 function，而不只是填写参数。你有多个 schema，并由 model 选择合适的一个。与现有 tool/function 基础设施集成时也使用此方法。

**Instructor library：** 你希望在任意 provider 上使用带自动 retry 的 Pydantic validation。对 Python 项目来说 DX 最好。封装了 OpenAI、Anthropic、Google 和 open-source models。

## Provider 特定指导

**OpenAI：** 使用带 `json_schema` 类型的 `response_format`。constrained decoding 已内置。Pydantic models 可直接使用。最可靠的 structured output 实现。

**Anthropic：** 使用 tool use 实现 structured output。定义一个带目标 schema 的单一 tool。model 返回与 schema 匹配的 tool call arguments。可靠，但需要 tool use API 模式。

**Open-source models（vLLM, Ollama）：** 使用 Outlines 或 Guidance 进行 constrained decoding。这些库会将 JSON Schemas 编译为 finite state machines，在生成过程中 mask 无效 tokens。需要本地运行 inference。

## Schema 设计指南

1. 尽可能保持 schema 扁平。超过 2 层的嵌套对象会增加提取错误。
2. 对分类字段使用 enums。不要依赖 model 发明正确的字符串。
3. 对含糊字段，将其设为 required 并显式支持 null，而不是设为 optional。迫使 model 做出决定。
4. 为 schema properties 添加 descriptions。model 会把这些作为指令读取。
5. 除非必要，否则避免 union types（oneOf/anyOf）。它们会增加 decoding 复杂度。
6. 为数字设置 minimum/maximum。可捕获幻觉产生的极端值。
7. 对数组使用 minItems/maxItems，以防止空输出或无界输出。

## 常见失败模式和修复

- **Model 将 JSON 包在 markdown 围栏中**：从基于 prompt 的方式切换到 JSON mode 或 schema mode
- **Schema 有效但事实错误**：在提取后添加一个 LLM-as-judge validation 步骤
- **Enum 值不一致**：切换到 constrained decoding，或添加 post-processing normalization
- **缺少 optional 字段**：将其设为 required，或在应用代码中添加 default values
- **提取非常慢**：constrained decoding 会增加 5-15% latency，如果对 latency 敏感，降低 schema 复杂度
- **包含多样化 items 的大数组**：将输入分块并按 chunk 提取，然后合并结果

## 可靠性阶梯

| Approach | Parse Success | Schema Match | Setup Effort |
|----------|-------------|-------------|-------------|
| Prompt-based | ~90% | ~80% | 1 minute |
| JSON mode | 100% | ~90% | 5 minutes |
| Schema mode | 100% | ~99% | 15 minutes |
| Constrained decoding | 100% | 100% | 30 minutes |
| Instructor + retry | 100% | ~99.5% | 10 minutes |
