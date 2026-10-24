---
id: agent-tool-use-skills
title: Agent Tool Use and Skill Libraries
code: AT
subtitle: 定义、校验、分发并保护工具调用。把技能存为代码，检索、组合并改进它们。
hue: 160
sources: phases/14-agent-engineering/06-tool-use-and-function-calling, phases/14-agent-engineering/10-skill-libraries-voyager, phases/11-llm-engineering/09-function-calling
source_hash: 38005f151c51ea9a
---

## 函数调用循环
type: architecture
from: phases/11-llm-engineering/09-function-calling/docs/en.md

```arch
node | user | 1,1 | User | sends a message | client
node | app | 2,1 | Application | executes tools | process
node | model | 3,1 | Model | decides the call | model
node | tool | 2,2 | Tool | get_weather("Tokyo") | process
node | reg | 3,2 | Tool definitions | JSON Schema | store
edge | user | app | message
edge | app | model | messages + tool definitions
edge | model | app | tool_call
edge | app | tool | execute
edge | tool | app | result
edge | reg | model | schemas
```

## 工具 schema
type: annotated-code
lang: json
from: phases/11-llm-engineering/09-function-calling/docs/en.md

```json
{"type": "function", "function": {
  "name": "get_weather",
  "description": "Get current weather for a city.",  # a prompt for tool selection
  "parameters": {"type": "object",  # Anthropic: input_schema
    "properties": {"city": {"type": "string"},
      "units": {"enum": ["celsius", "fahrenheit"]}},
    "required": ["city"]}}}  # missing field: error observation
```

## 各家提供商对比
type: comparison
span: 2
from: phases/11-llm-engineering/09-function-calling/docs/en.md, phases/14-agent-engineering/06-tool-use-and-function-calling/docs/en.md

| 维度 | OpenAI | Anthropic | Google |
|---|---|---|---|
| 工具参数 | `tools` | `tools` | `function_declarations` |
| 调用格式 | `tool_calls[].function` | `content[].type="tool_use"` | `functionCall` |
| Schema 字段 | `function.parameters` | `input_schema` | JSON Schema |
| 强制调用 | `tool_choice="required"` | `tool_choice={"type":"any"}` | `function_calling_config` |
| 结果回传方式 | `{"role": "tool", "tool_call_id": ...}` | user 消息中的 `type: "tool_result"` | 课程表格中未列出 |

## 代码中的任务
type: task-table
from: phases/14-agent-engineering/06-tool-use-and-function-calling/code/main.py, phases/14-agent-engineering/10-skill-libraries-voyager/code/main.py, phases/11-llm-engineering/09-function-calling/code/function_calling.py, phases/14-agent-engineering/06-tool-use-and-function-calling/docs/en.md, phases/14-agent-engineering/10-skill-libraries-voyager/docs/en.md

| 任务 | 代码 |
|---|---|
| 注册工具 | `reg.register(ToolDef(...))` |
| 把工具目录展示给模型 | `reg.catalog()` |
| 运行一轮中的调用 | `reg.dispatch_many(calls)` |
| 按 schema 校验参数 | `validate(args, schema)` |
| 带上限运行循环 | `run_function_calling_loop(user_message, max_iterations=5)` |
| 为任务查找技能 | `lib.search("I need a pickaxe")` |
| 连同依赖运行技能 | `lib.execute("craft_iron_pickaxe")` |
| 运行 demo | `python3 code/main.py` |

## 带结构化错误的注册表
type: annotated-code
lang: python
from: phases/14-agent-engineering/06-tool-use-and-function-calling/code/main.py

```python
reg = ToolRegistry()
reg.register(ToolDef(name="classify", description="<when to use>",
    input_schema={"type": "object", "required": ["status"],
        "properties": {"status": {"type": "string",
            "enum": ["open", "closed", "pending"]}}},
    executor=classify))   # timeout_s defaults to 5.0
calls = [ToolCall("u02", "multiply", {"a": "4", "b": 5}),  # "4" coerces
         ToolCall("u03", "classify", {"status": "in_progress"})]  # not in enum
for result in reg.dispatch_many(calls):
    result.ok, result.content  # errors are strings, never raised
```

## 技能库循环
type: annotated-code
lang: python
from: phases/14-agent-engineering/10-skill-libraries-voyager/code/main.py

```python
lib = SkillLibrary()
lib.register(Skill(name="craft_iron_pickaxe", description="<what it does>",
    code="mine_ore(); place_table(); craft('iron_pickaxe')",
    fn=_craft_iron_pick_v1, tags=("craft", "tool"),
    depends_on=("mine_ore", "place_crafting_table")))  # v1
lib.search("I need a pickaxe")           # token overlap, top_k=3
ctx = lib.execute("craft_iron_pickaxe")  # deps first, topo_order
ctx["failed"]                            # True: need 2 stick, have 0
lib.register(Skill(..., fn=_craft_iron_pick_v2))  # same name: v2
```

## Voyager 改进循环
type: flow
from: phases/14-agent-engineering/10-skill-libraries-voyager/docs/en.md

1. **Curriculum**：提出一个略高于当前能力的任务。
2. **Library**：按查询与描述的相似度返回 top-k 技能。
3. **Agent**：以可执行代码编写或组合技能。
4. **Environment**：运行技能并返回 `success`、`error` 或 `self-verification failure`。
5. **Agent**：以该信号为上下文重写技能。
6. **Library**：保存新版本。成功或达到最大轮数时循环结束。

## 校验失败与修复
type: troubleshooting
from: phases/14-agent-engineering/06-tool-use-and-function-calling/code/main.py, phases/14-agent-engineering/06-tool-use-and-function-calling/docs/en.md, phases/14-agent-engineering/10-skill-libraries-voyager/docs/en.md, phases/11-llm-engineering/09-function-calling/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| `error: unknown tool 'subtract'` | 模型调用了不存在的工具 | 返回错误。加一个用于拒绝的空操作工具 |
| `missing required: <name>` | 缺少必填字段 | 把错误回传。模型会重试 |
| `'in_progress' not in [...]` | 值不在枚举范围内 | 以描述性错误拒绝 |
| 选错了工具 | 工具描述不好 | 说明工具做什么、何时使用 |
| 结果对应到错误的调用 | `tool_use_id` 值被调换 | 按 ID 关联每个结果 |
| 检索变差 | 技能库超过几百个技能 | 加标签过滤和硬约束 |

## 课程代码中的默认值
type: defaults
from: phases/14-agent-engineering/06-tool-use-and-function-calling/code/main.py, phases/14-agent-engineering/10-skill-libraries-voyager/code/main.py, phases/11-llm-engineering/09-function-calling/code/function_calling.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `timeout_s` | `5.0` | `ToolDef` 中每个工具一个 |
| `version` | `1` | 新的 `Skill` |
| `dedup` | `True` | 同名即改进该技能 |
| `top_k` | `3` | 技能搜索结果数 |
| `tag_filter` | `None` | 设置后只在一个标签内搜索 |
| `max_iterations` | `5` | `run_function_calling_loop` |

## 关键数字
type: concepts
from: phases/14-agent-engineering/06-tool-use-and-function-calling/docs/en.md, phases/14-agent-engineering/10-skill-libraries-voyager/docs/en.md, phases/11-llm-engineering/09-function-calling/docs/en.md

- **BFCL V4**：40% agentic，30% 多轮，10% live，10% non-live，10% 幻觉。
- **并行调用**：往返次数从 2 降到 1。
- **并行延迟**：每个查询 5-10 次工具调用时降低 60-80%。
- **调用预算**：每次对话 10-20 次调用是合理的。
- **Voyager**：独特物品多 3.3x，石制工具快 8.5x，铁制工具快 6.4x。
- **Toolformer**：只有当工具结果降低下一个 token 的损失时才保留该调用。

## 安全规则
type: tips
from: phases/11-llm-engineering/09-function-calling/docs/en.md, phases/11-llm-engineering/09-function-calling/code/function_calling.py, phases/14-agent-engineering/06-tool-use-and-function-calling/docs/en.md

- 绝不把模型生成的 SQL 直接传给数据库。使用参数化。
- 函数白名单。只暴露用户需要的工具。
- 校验每个参数的类型、范围和格式。
- 清洗工具结果。去掉 API key、PII 和内部错误。
- `run_code` 用 `ast.parse` 解析代码，拦截 import 和 dunder 访问。
- 在独立进程或容器中运行不可信代码。

## 问答
type: qa
from: phases/11-llm-engineering/09-function-calling/docs/en.md, phases/14-agent-engineering/06-tool-use-and-function-calling/docs/en.md, phases/14-agent-engineering/10-skill-libraries-voyager/docs/en.md

- **谁执行工具？** 你的代码。模型只决定调用什么。
- **结构化输出还是函数调用？** 数据抽取用结构化输出。对外部系统执行操作用函数调用。
- **为什么把错误作为结果返回？** 模型能根据结构化错误自我纠正。遇到空的或笼统的错误就会失败。
- **什么是技能？** 一段有名字的代码加一段描述，可按相似度检索。
- **为什么给技能加版本？** 固定在 v1 的父技能不会用上子技能的 v3。
