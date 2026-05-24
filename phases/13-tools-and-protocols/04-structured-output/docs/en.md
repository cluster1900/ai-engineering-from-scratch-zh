# 结构化输出 — JSON Schema, Pydantic, Zod, Constrained Decoding

> “好好要求模型返回 JSON”即使在前沿模型上，也有 5% 到 15% 的时间会失败。结构化输出通过 Constrained Decoding 缩小了这个差距：模型实际上会被阻止生成任何违反 schema 的 Token。OpenAI 的 strict mode、Anthropic 的 schema-typed tool use、Gemini 的 `responseSchema`、Pydantic AI 的 `output_type`，以及 Zod 的 `.parse`，都是同一个理念的五种表层形式。本课将构建 schema validator 和 strict-mode contract，学习者会在每条生产级 extraction pipeline 中使用它们。

**类型：** 构建
**语言：** Python（stdlib，JSON Schema 2020-12 子集）
**前置要求：** Phase 13 · 02（function calling deep dive）
**时间：** 约 75 分钟

## 学习目标

- 使用正确的约束（enum、min/max、required、pattern）为 extraction target 编写 JSON Schema 2020-12。
- 解释为什么 strict mode 和 Constrained Decoding 提供的保证不同于“生成后再验证”。
- 区分三种失败模式：parse error、schema violation、model refusal。
- 交付一条带 typed repair 和 typed refusal handling 的 extraction pipeline。

## 问题

一个读取采购订单邮件的 agent 需要把自由文本转成 `{customer, line_items, total_usd}`。有三种做法。

**方法一：提示模型输出 JSON。** “以 JSON 回复，字段包括 customer、line_items、total_usd。”在前沿模型上有 85% 到 95% 的时间可用。会以六种方式失败：缺少大括号、尾随逗号、类型错误、幻觉字段、在 Token 限制处截断、泄漏类似“Here is your JSON:”这样的说明文字。

**方法二：生成后验证。** 自由生成、解析、根据 schema 验证，失败后重试。可靠但昂贵——你要为每次重试付费，而且截断 bug 每出现一次就多花一轮。

**方法三：Constrained Decoding。** 提供商在 decode 时强制执行 schema。无效 Token 会从采样分布中被 mask 掉。输出保证可解析，并且保证通过验证。失败会收敛到一种模式：refusal（模型判断输入不符合 schema）。

到 2026 年，每个前沿提供商都提供了某种形式的方法三。

- **OpenAI。** `response_format: {type: "json_schema", strict: true}`，如果模型拒绝则响应中包含 `refusal`。
- **Anthropic。** 对 `tool_use` 输入执行 schema enforcement；`stop_reason: "refusal"` 并不存在，但没有 tool call 的 `end_turn` 就是信号。
- **Gemini。** 请求级别的 `responseSchema`；2026 年 Gemini 针对特定类型提供 Token 级 grammar constraints。
- **Pydantic AI。** `output_type=InvoiceModel` 会发出类型为 `InvoiceModel` 的结构化 `RunResult`。
- **Zod (TypeScript)。** 运行时 parser，用 Zod schema 验证提供商输出；可与 OpenAI 的 `beta.chat.completions.parse` 配合使用。

共同点是：一次声明 schema，端到端强制执行。

## 概念

### JSON Schema 2020-12 — 通用语

每个提供商都接受 JSON Schema 2020-12。你最常用的构造包括：

- `type`：`object`、`array`、`string`、`number`、`integer`、`boolean`、`null` 之一。
- `properties`：字段名到 subschema 的映射。
- `required`：必须出现的字段名列表。
- `enum`：允许值的封闭集合。
- `minimum` / `maximum`（数字），`minLength` / `maxLength` / `pattern`（字符串）。
- `items`：应用于每个数组元素的 subschema。
- `additionalProperties`：`false` 禁止额外字段（默认值因模式而异）。

OpenAI strict mode 增加了三项要求：每个 property 都必须列在 `required` 中，所有位置都必须有 `additionalProperties: false`，并且不能有未解析的 `$ref`。如果违反这些要求，API 会在请求时返回 400。

### Pydantic，Python 绑定

Pydantic v2 通过 `model_json_schema()` 从 dataclass 形状的 model 生成 JSON Schema。Pydantic AI 对此做了封装，所以你可以这样写：

```python
class Invoice(BaseModel):
    customer: str
    line_items: list[LineItem]
    total_usd: Decimal
```

agent framework 会在边界处把 schema 转换成 OpenAI strict mode、Anthropic `input_schema` 或 Gemini `responseSchema`。模型输出会以类型化的 `Invoice` 实例返回。验证错误会抛出 `ValidationError`，并带有类型化的错误路径。

### Zod，TypeScript 绑定

Zod（`z.object({customer: z.string(), ...})`）是 TS 等价物。OpenAI 的 Node SDK 暴露了 `zodResponseFormat(Invoice)`，它会转换为 API 的 JSON Schema payload。

### Refusals

Strict mode 不能强迫模型回答。如果输入无法适配 schema（“邮件是一首诗，不是 invoice”），模型会发出包含原因的 `refusal` 字段。你的代码必须把它作为一等结果处理，而不是当作失败。refusal 也可作为安全信号：当模型被要求从受保护内容邮件中提取信用卡号时，会返回带有安全原因的 refusal。

### 开放环境中的 Constrained Decoding

开放权重实现使用三种技术。

1. **Grammar-based decoding**（`outlines`、`guidance`、`lm-format-enforcer`）：从 schema 构建 deterministic finite automaton；在每一步，mask 掉会违反 FSM 的 Token logits。
2. **带 JSON parser 的 logit masking**：运行一个与模型同步的 streaming JSON parser；在每一步计算 valid-next-token 集合。
3. **带 verifier 的 speculative decoding**：廉价 draft model 提议 Token，verifier 强制执行 schema。

商业提供商会在幕后选择其中一种。2026 年的最新水平是：对短结构化输出比普通生成更快，对长结构化输出速度大致相同。

### 三种失败模式

1. **Parse error。** 输出不是有效 JSON。在 strict mode 下不会发生。在非 strict 提供商上仍可能发生。
2. **Schema violation。** 输出可以解析，但违反 schema。在 strict mode 下不会发生。在 strict mode 之外很常见。
3. **Refusal。** 模型拒绝。必须作为类型化结果处理。

### 重试策略

当你不在 strict mode 下时（Anthropic tool use、非 strict OpenAI、较旧 Gemini），恢复模式是：

```
generate -> parse -> validate -> if fail, inject error and retry, max 3x
```

一次重试通常足够。三次重试能捕捉弱模型偶发问题。超过三次说明 schema 有问题：模型无法对某些输入满足它，prompt 或 schema 需要修正。

### 小模型支持

Constrained Decoding 适用于小模型。在结构化任务上，一个带 grammar enforcement 的 3B 参数开放模型，表现优于使用原始提示的 70B 参数模型。这是结构化输出对生产环境重要的主要原因：它把可靠性和模型大小解耦。

## 使用它

`code/main.py` 提供了一个用 stdlib 编写的最小 JSON Schema 2020-12 validator（types、required、enum、min/max、pattern、items、additionalProperties）。它包装一个 `Invoice` schema，并让 fake LLM output 经过 validator，演示 parse error、schema violation 和 refusal 路径。生产中可以把 fake output 换成任何提供商的真实响应。

需要关注的点：

- validator 返回一个类型化的 `[ValidationError]` 列表，包含 path 和 message。这正是你希望暴露给 retry prompt 的形状。
- refusal 分支不会重试。它会记录日志并返回类型化 refusal。Phase 14 · 09 使用 refusals 作为安全信号。
- `additionalProperties: false` 检查会在 adversarial test input 上触发，展示为什么 strict mode 会把幻觉字段挡在门外。

## 交付它

本课产出 `outputs/skill-structured-output-designer.md`。给定一个自由文本 extraction target（invoices、support tickets、resumes 等），该 skill 会生成一个与 strict mode 兼容的 JSON Schema 2020-12，以及一个与之镜像的 Pydantic model，并内置 typed refusal 和 retry handling stub。

## 练习

1. 运行 `code/main.py`。添加第四个测试用例，其 `total_usd` 为负数。确认 validator 会通过 `minimum` 约束路径拒绝它。

2. 扩展 validator，使其支持带 discriminator 的 `oneOf`。常见情况：`line_item` 要么是 product，要么是 service，并由 `kind` 打标签。Strict mode 在这里有一些细微规则；请查看 OpenAI 的 structured outputs guide。

3. 把同一个 Invoice schema 写成 Pydantic BaseModel，并将 `model_json_schema()` 输出与你手写的 schema 对比。找出 Pydantic 默认设置但手写版本遗漏的一个字段。

4. 测量 refusal 率。构造十个不应可提取的输入（一段 song lyric、一个 math proof、一封空白邮件），并通过带 strict mode 的真实提供商运行它们。统计 refusals 与 hallucinated outputs。这是你进行 refusal-aware retries 的 ground truth。

5. 从头到尾阅读 OpenAI 的 structured outputs guide。找出它在 strict mode 中明确禁止、但普通 JSON Schema 允许的一个构造。然后设计一个非必要地使用该禁用构造的 schema，并将其重构为 strict-compatible。

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| JSON Schema 2020-12 | “schema spec” | 每个现代提供商都支持的 IETF-draft schema dialect |
| Strict mode | “保证符合 schema” | OpenAI 通过 Constrained Decoding 强制执行 schema 的标志 |
| Constrained decoding | “Logit masking” | decode 时的强制执行，会 mask 无效的下一个 Token |
| Refusal | “模型拒绝” | 输入无法适配 schema 时的类型化结果 |
| Parse error | “无效 JSON” | 输出无法解析为 JSON；在 strict 下不可能发生 |
| Schema violation | “形状错误” | 已解析但违反 type / required / enum / range |
| `additionalProperties: false` | “不允许额外字段” | 禁止未知字段；OpenAI strict 中必需 |
| Pydantic BaseModel | “类型化输出” | 会发出并验证 JSON Schema 的 Python class |
| Zod schema | “TypeScript output type” | 用于提供商输出验证的 TS runtime schema |
| Grammar enforcement | “开放权重 constrained decode” | 基于 FSM 的 logit masking，如 outlines / guidance 中所用 |

## 延伸阅读

- [OpenAI — Structured outputs](https://platform.openai.com/docs/guides/structured-outputs) — strict mode、refusals 和 schema requirements
- [OpenAI — Introducing structured outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) — 2024 年 8 月发布文章，解释 decoding guarantee
- [Pydantic AI — Output](https://ai.pydantic.dev/output/) — 会序列化到各提供商的 typed output_type bindings
- [JSON Schema — 2020-12 release notes](https://json-schema.org/draft/2020-12/release-notes) — canonical spec
- [Microsoft — Structured outputs in Azure OpenAI](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs) — 企业部署说明和 strict-mode 注意事项
