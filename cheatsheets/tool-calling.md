---
id: tool-calling
title: Tool Calling and Structured Outputs
code: TC
subtitle: 声明工具、读调用、返回结果、并行跑调用、流式参数，并强制校验 JSON。
hue: 30
sources: phases/11-llm-engineering/03-structured-outputs, phases/11-llm-engineering/09-function-calling, phases/13-tools-and-protocols/01-the-tool-interface, phases/13-tools-and-protocols/02-function-calling-deep-dive, phases/13-tools-and-protocols/03-parallel-and-streaming-tool-calls, phases/13-tools-and-protocols/04-structured-output, phases/13-tools-and-protocols/05-tool-schema-design, phases/19-capstone-projects/21-tool-registry-schema-validation, phases/19-capstone-projects/23-function-call-dispatcher
source_hash: ba9bf49229d13a30
---

## 函数调用任务
type: task-table
from: phases/11-llm-engineering/09-function-calling/docs/en.md

| Task | Code |
|---|---|
| 声明工具，OpenAI | `{"type": "function", "function": {...}}` |
| 声明工具，Anthropic | `{"name": ..., "input_schema": {...}}` |
| 让模型决定 | `tool_choice="auto"` |
| 要求一次工具调用 | `tool_choice="required"` |
| 强制某一个工具 | `tool_choice={"type":"function", ...}` |
| 读 OpenAI 调用 | `message.tool_calls` |
| 找一次 Anthropic 调用 | `b.type == "tool_use"` |
| 返回 Anthropic 结果 | `{"type": "tool_result", "tool_use_id": ...}` |

## 结构化输出任务
type: task-table
from: phases/11-llm-engineering/03-structured-outputs/docs/en.md, phases/13-tools-and-protocols/04-structured-output/docs/en.md

| Task | Code |
|---|---|
| 有效 JSON，无模式 | `{ type: "json_object" }` |
| 符合模式的 JSON | `{type: "json_schema", strict: true}` |
| 解析成 Pydantic 模型 | `response_format=Product` |
| 读类型化结果 | `message.parsed` |
| 校验失败时重试 | `instructor.from_openai(OpenAI())` |

## 工具循环
type: architecture
from: phases/13-tools-and-protocols/01-the-tool-interface/docs/en.md, phases/11-llm-engineering/09-function-calling/docs/en.md

```arch
node | user | 1,1 | User | message
node | host | 2,1 | Host | registry, loop bound
node | model | 3,1 | Model | text, call or refuse
node | result | 1,2 | Tool result | tool message, same id
node | exec | 2,2 | Executor | your code runs it
node | valid | 3,2 | Validator | JSON Schema 2020-12
edge | user | host | message
edge | host | model | tools
edge | model | valid | tool call
edge | valid | exec | valid args
edge | exec | result | result
edge | result | host | observe
```

## 一次工具调用
type: flow
from: phases/13-tools-and-protocols/01-the-tool-interface/docs/en.md, phases/13-tools-and-protocols/01-the-tool-interface/code/main.py, phases/11-llm-engineering/09-function-calling/docs/en.md

1. **Host**：声明名字、描述与输入模式。
2. **Model**：作答、调用工具，或拒绝。
3. **Model**：每一次调用有 `id`、`name`、`arguments`。
4. **Host**：对照模式校验参数。
5. **Executor**：跑代码，返回可序列化结果。
6. **Host**：追加一条带同一 id 的 `tool` 消息。
7. **Host**：重复直到没有调用或达到 `MAX_TURNS`。

## OpenAI 往返
type: annotated-code
lang: python
from: phases/11-llm-engineering/09-function-calling/docs/en.md

```python
response = client.chat.completions.create(
    model="gpt-4o", messages=messages,
    tools=tools, tool_choice="auto",           # model picks tool or text
)
tool_call = response.choices[0].message.tool_calls[0]
args = json.loads(tool_call.function.arguments)  # arguments are a string
result = get_weather(**args)                   # your code executes
messages += [
    response.choices[0].message,               # keep the assistant turn
    {"role": "tool", "tool_call_id": tool_call.id,  # same id as the call
     "content": json.dumps(result)},
]
final = client.chat.completions.create(model="gpt-4o", messages=messages)
```

## 先校验，再修复或拒绝
type: annotated-code
lang: python
from: phases/13-tools-and-protocols/04-structured-output/code/main.py, phases/13-tools-and-protocols/04-structured-output/docs/en.md

```python
def process_model_output(raw: str, schema: dict) -> ParsedResult:
    if raw.startswith("__REFUSAL__"):            # model declined: no retry
        return ParsedResult("refusal", raw.removeprefix("__REFUSAL__").strip(), [])
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as e:            # failure 1: not JSON
        return ParsedResult("parse_error", None, [ValidationError("$", str(e))])
    errs = validate(schema, parsed)              # list of path and message
    if errs:
        return ParsedResult("violation", parsed, errs)  # inject errs, retry
    return ParsedResult("ok", parsed, [])
```

## 按提供方的形状
type: concepts
from: phases/13-tools-and-protocols/02-function-calling-deep-dive/docs/en.md

- **模式字段**：`parameters`、`input_schema`、Gemini `parameters`。
- **调用**：`tool_calls[]`、一个 `tool_use` 块、一个 `functionCall` 部分。
- **参数**：OpenAI 发字符串。其他发对象。
- **结果链接**：`tool_call_id`、`tool_use_id`、`functionResponse` id。
- **禁止工具**：`tool_choice: "none"`、`{type: "none"}`、`mode: "NONE"`。
- **Strict**：`strict: true`、始终开启、`responseSchema`。

## 并行与流式调用
type: concepts
from: phases/13-tools-and-protocols/03-parallel-and-streaming-tool-calls/docs/en.md, phases/13-tools-and-protocols/03-parallel-and-streaming-tool-calls/code/main.py

- **启用**：`parallel_tool_calls: true` 是 OpenAI 默认。
- **串行**：调用互相依赖时关掉它。
- **关联**：每一个结果带着其调用 id。顺序自由。
- **OpenAI 流**：按 `index` 拼接块，直到 `finish_reason = "tool_calls"`。
- **Anthropic 流**：`input_json_delta` 块直到 `content_block_stop`。
- **晚解析**：部分 JSON 会抛错。在结束信号时解析。
- **延迟**：400、600、800 ms：串行 1800 ms，并行 800 ms。

## 模式设计规则
type: concepts
from: phases/13-tools-and-protocols/05-tool-schema-design/docs/en.md, phases/13-tools-and-protocols/04-structured-output/docs/en.md

- **名字**：`snake_case`，动词后接名词：`get_weather`。名字里不要参数。
- **描述**："Use when {condition}. Do not use for {close-but-wrong-cases}."
- **Enums**：每一个封闭集合放进 `enum`。
- **原子工具**：当 `action` 超过三个值时拆工具。
- **Strict 模式**：每一个属性都在 `required` 里，`additionalProperties: false`，没有 `$ref`。

## 限制与默认值
type: defaults
from: phases/13-tools-and-protocols/02-function-calling-deep-dive/docs/en.md, phases/13-tools-and-protocols/05-tool-schema-design/docs/en.md, phases/13-tools-and-protocols/01-the-tool-interface/code/main.py, phases/13-tools-and-protocols/04-structured-output/docs/en.md, phases/19-capstone-projects/21-tool-registry-schema-validation/code/main.py

| Setting | Default | Note |
|---|---|---|
| 每次请求的 OpenAI 工具 | 128 | 硬上限 |
| 每次请求的 Anthropic 工具 | 64 | 硬上限 |
| OpenAI 模式深度 | 5 | Strict 模式 |
| OpenAI 参数字符串 | 8192 bytes | 最大大小 |
| 描述长度 | 1024 个字符 | 更长的文本会被截断 |
| `MAX_TURNS` | 5 | 课文循环界限 |
| 修复重试 | 3x | 更多意味着坏模式 |
| `timeout_ms` | 30_000 | 每条工具记录 |

## 排障
type: troubleshooting
from: phases/13-tools-and-protocols/03-parallel-and-streaming-tool-calls/docs/en.md, phases/13-tools-and-protocols/04-structured-output/docs/en.md, phases/13-tools-and-protocols/05-tool-schema-design/docs/en.md, phases/13-tools-and-protocols/02-function-calling-deep-dive/docs/en.md, phases/11-llm-engineering/03-structured-outputs/docs/en.md, phases/19-capstone-projects/23-function-call-dispatcher/docs/en.md

| Symptom | Cause | Fix |
|---|---|---|
| 流中途 `json.loads` 抛错 | 参数是部分 JSON | 在调用结束信号之后解析 |
| Strict 模式下请求时报 400 | Strict 模式规则被破坏 | 全部进 `required`，没有 `$ref` |
| 选错工具 | 两段描述重叠 | 加一行 "Do not use for" |
| 值落在 `enum` 外 | 基于 prompt 的输出 | 使用约束解码 |
| 响应里有 `refusal` | 输入装不进模式 | 把它当作类型化结果处理 |
| `input` 里有额外字段 | Anthropic 模式是建议性的 | 在服务器上校验 |
| 模式错误被重试 | 错误是确定的 | 修好参数，不要重试 |
| 结果落到错误调用上 | 按名字匹配，不是按 id | 用其 id 返回每一个结果 |

## 问与答
type: qa
from: phases/11-llm-engineering/09-function-calling/docs/en.md, phases/13-tools-and-protocols/01-the-tool-interface/docs/en.md, phases/13-tools-and-protocols/04-structured-output/docs/en.md, phases/11-llm-engineering/03-structured-outputs/docs/en.md

- **结构化输出还是调用？** 输出是最终数据。调用是请求行动。
- **为什么不靠 prompt 要 JSON？** 它有 5% 到 15% 的时间会失败。
- **为什么要调用 id？** 并行结果会乱序返回。
- **模式能抓住错误值吗？** 不能。类型对了，值是编造的。

## 提示
type: tips
from: phases/11-llm-engineering/09-function-calling/docs/en.md, phases/13-tools-and-protocols/05-tool-schema-design/docs/en.md, phases/11-llm-engineering/03-structured-outputs/docs/en.md, phases/19-capstone-projects/21-tool-registry-schema-validation/docs/en.md

- 把错误当结果返回：`{"error": true, "code": "CITY_NOT_FOUND"}`。
- 为模型写错误："'city' is required."
- 用 JSON pointer 路径报告错误：`/user/email`。
- 让关键字段成为必填。模型会写 `null`。
- 只暴露用户需要的函数。
