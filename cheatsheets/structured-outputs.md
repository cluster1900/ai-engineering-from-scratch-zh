---
id: structured-outputs
title: Structured Outputs and Constrained Decoding
code: SO
subtitle: 每次都拿到合法 JSON。Schema、严格模式、logit 掩码、校验器、重试，以及输出守卫项目。
hue: 215
sources: phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding, phases/11-llm-engineering/03-structured-outputs, phases/13-tools-and-protocols/04-structured-output, projects/json-schema-output-guard
source_hash: 85ee821939cf37d5
---

## 输出守卫流水线
type: architecture
from: projects/json-schema-output-guard/solution/main.ts, projects/json-schema-output-guard/README.md

```arch
node | gen | 1,1 | generate | feedback, attempt | model
node | parse | 2,1 | parseJSON | 100_000 byte cap | process
node | check | 2,2 | checkSchema | preflight, depth 32 | process
node | val | 3,1 | validate | Issue[] with paths | process
node | ok | 4,1 | accepted | value plus trace | client
node | rep | 3,2 | repair | maxAttempts budget | queue
node | out | 4,2 | exhausted | every attempt in trace | client
edge | gen | parse | raw string
edge | check | val | schema
edge | parse | val | value
edge | val | ok | no issues
edge | val | rep | issues
edge | rep | gen | Issue[]
edge | rep | out | budget spent
```

## 一次约束解码步骤
type: flow
from: phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding/docs/en.md, phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding/code/main.py

1. **Model**：在完整词表上发出一个 logit 向量（约 100k tokens）。
2. **FSM**：`fsm.valid_tokens(state, tokenizer)` 列出仍保持接受路径的 token。
3. **Mask**：`mask_logits` 把其余每个 logit 设为 `float("-inf")`。
4. **Sample**：softmax 把全部概率放在合法 token 上。挑一个。
5. **Advance**：`fsm.transition(state, tok)`。当 `fsm.is_accept(state)` 时停止。

## 运行输出守卫项目
type: command-table
span: 2
from: projects/json-schema-output-guard/README.md, projects/json-schema-output-guard/stages/04-bounded-repair/docs/en.md

| 命令 | 作用 |
|---|---|
| `python3 scripts/project_test.py json-schema-output-guard --init <ws>` | 一次性创建你的工作区。全新 starter 会失败 |
| `python3 scripts/project_test.py json-schema-output-guard --stage 1 --path <ws> --strict` | 给一个阶段打分，1 到 4 |
| `python3 scripts/project_test.py json-schema-output-guard --all --solution --strict` | 给参考解答打分 |
| `node cli.ts --schema samples/schema.json --attempts samples/attempts.json --output guard.json --html guard.html` | 录制的修复。第 1 次尝试在 `$/confidence` 失败 |

## 代码中的任务
type: task-table
span: 2
from: phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding/docs/en.md, phases/11-llm-engineering/03-structured-outputs/docs/en.md, phases/13-tools-and-protocols/04-structured-output/code/main.py, projects/json-schema-output-guard/solution/main.ts

| 任务 | 代码 |
|---|---|
| 用 FSM 做本地 JSON | `generator = outlines.generate.json(model, Review)` |
| Pydantic 加重试，任意 provider | `client = instructor.from_anthropic(Anthropic())` |
| 厂商 schema 模式 | `client.beta.chat.completions.parse(..., response_format=Product)` |
| 校验一个 dict | `validate_schema(data, schema)` 返回一个错误列表 |
| 解析、校验、重试 | `extract_with_retry(text, schema, max_retries=3)` |
| 三分支处理器 | `process_model_output(raw, INVOICE_SCHEMA)` |
| 守卫一条原始字符串 | `guard(raw, schema)` 返回 `ok`、`value`、`issues` |
| 有界修复 | `await repair(generate, schema, maxAttempts)` |

## 问题
type: qa
from: phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding/docs/en.md, phases/13-tools-and-protocols/04-structured-output/docs/en.md, projects/json-schema-output-guard/README.md, projects/json-schema-output-guard/stages/04-bounded-repair/docs/en.md

- **拒绝是否应触发重试？** 不。记录它并返回带类型的拒绝。
- **约束解码更慢吗？** 常常更快。强制 token 会跳过生成。
- **需要大模型吗？** 不。带 grammar 的 3B 模型胜过靠 prompt 的 70B 模型。
- **接受能证明答案正确吗？** 不。它并不确立事实正确性。
- **为什么先调用 checkSchema？** 这样损坏的 schema 就花不了 provider 预算。

## 提示
type: tips
from: phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding/docs/en.md, phases/11-llm-engineering/03-structured-outputs/docs/en.md, projects/json-schema-output-guard/README.md, projects/json-schema-output-guard/stages/04-bounded-repair/docs/en.md

- 本地模型、扁平 schema：Outlines。递归 schema：XGrammar 或 llguidance。
- 自托管服务器：vLLM `guided_json`、`guided_regex`、`guided_choice`。
- 当模型必须从多个 schema 中选一个时，使用 tool use。
- 把结构化的 `Issue[]` 发回模型，而不是自由文本。
- 把每一次尝试都留在 trace 里。后期成功不能掩盖更早的失败。
- 守卫会拒绝 `$ref`、format 和 combinators。
- 在项目命令里，`<ws>` 是 `learning-artifacts/json-schema-output-guard`。

## 带 Instructor 的 Pydantic schema
type: annotated-code
lang: python
from: phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding/docs/en.md

```python
class Invoice(BaseModel):
    vendor: str
    total_usd: float = Field(ge=0)       # numeric bound
    line_items: list[str]

client = instructor.from_anthropic(Anthropic())
invoice = client.messages.create(
    model="claude-opus-4-7",
    max_tokens=1024,
    response_model=Invoice,              # retries on validation failure
    messages=[{"role": "user", "content": "<text>"}],
)
```

## TypeScript 中的有界修复
type: annotated-code
lang: typescript
from: projects/json-schema-output-guard/solution/main.ts

```typescript
const schema: Schema = {
  type: "object",
  properties: {
    answer: { type: "string", minLength: 1 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
  required: ["answer", "confidence"],
  additionalProperties: false,         // unknown property is an issue
};
await repair(async (_, i) => outputs[i - 1], schema)  // status and trace
```

## 控制级别
type: concepts
from: phases/11-llm-engineering/03-structured-outputs/docs/en.md, phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding/docs/en.md, phases/13-tools-and-protocols/04-structured-output/docs/en.md

- **基于 Prompt**："Respond in valid JSON"。约 90% 合法。没有强制。
- **JSON mode**：合法 JSON 语法。没有 schema 保证。
- **Schema mode**：输出匹配 JSON Schema。每个主流 provider 都原生支持。
- **约束解码**：掩掉非法 token。按构造 100% 合法。
- **Instructor**：不碰 logits。它解析、校验并重试。
- **Outlines**：把 schema 或 regex 编译成 FSM。递归需要展平。
- **XGrammar、llguidance**：CFG 引擎。它们处理递归 schema。
- **严格模式**：所有属性都在 `required` 中，`additionalProperties: false`，没有 `$ref`。

## 默认值与数字
type: defaults
from: phases/11-llm-engineering/03-structured-outputs/docs/en.md, phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding/docs/en.md, phases/13-tools-and-protocols/04-structured-output/docs/en.md, projects/json-schema-output-guard/solution/main.ts, projects/json-schema-output-guard/solution/cli.ts

| 设置 | 默认值 | 说明 |
|---|---|---|
| `max_retries` | 3 | 在 `extract_with_retry` 中 |
| Instructor 重试 | 3 | 在校验失败时 |
| 重试上限 | 3x | 更多重试说明 schema 不好 |
| `maxAttempts` | 3 | 预算必须是 1..10 |
| 深度上限 | 32 | `checkSchema` 和 `validate` |
| 输出大小上限 | 100_000 | 字节，在 `JSON.parse` 之前检查 |
| CLI 退出码 | 2 | 被拒绝或耗尽的结果 |
| 仅靠 Prompt 的 JSON | 85% 到 95% | 前沿模型上的成功率 |

## 排障
type: troubleshooting
from: phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding/docs/en.md, phases/11-llm-engineering/03-structured-outputs/docs/en.md, phases/13-tools-and-protocols/04-structured-output/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| JSON 合法，答案错误 | `answer` 在 `reasoning` 前面 | 把推理字段放在前面 |
| 模型编造一个日期 | Grammar 太严 | 允许 `null` 或一个哨兵值 |
| 10,000 选项的 enum 超时 | 巨大的 enum | 检索 top-k，约束到那些选项 |
| 树形输出在 Outlines 中失败 | FSM 会展平递归 | 使用 XGrammar 或 llguidance |
| JSON 合法，形状错误 | JSON mode 没有 schema | 始终发送完整 schema |
| API 返回 400 | 严格模式规则被打破 | 修好 `required`、多余字段、`$ref` |
| 类型对，值是编造的 | 幻觉出来的值 | Schema 抓不到它。检查取值 |
| 可选字段被漏掉 | 字段不是 required | 把它设为 required，允许 `null` |

## 缩写
type: glossary
from: phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding/docs/en.md, phases/13-tools-and-protocols/04-structured-output/docs/en.md, projects/json-schema-output-guard/solution/main.ts

- **FSM**：有限状态机。$O(1)$ 的合法下一 token 查找。
- **CFG**：上下文无关文法。处理递归。
- **Logit processor**：`(logits, state) -> masked_logits`。
- **Guided decoding**：推理服务器内部的同一思路。
- **Refusal**：输入无法套进 schema 时的带类型结果。
- **Parse error**：输出不是 JSON。严格模式下不可能出现。
- **Schema violation**：输出能解析但破坏了 schema。
- **Issue**：守卫项目里的 `{ path: string; message: string }`。
