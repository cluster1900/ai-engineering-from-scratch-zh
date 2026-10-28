# Evidence: cheatsheets/tool-calling.md

Abbreviations: A = phases/11-llm-engineering/03-structured-outputs/docs/en.md, F = phases/11-llm-engineering/09-function-calling/docs/en.md, T1 = phases/13-tools-and-protocols/01-the-tool-interface, T2 = phases/13-tools-and-protocols/02-function-calling-deep-dive/docs/en.md, T3 = phases/13-tools-and-protocols/03-parallel-and-streaming-tool-calls, T4 = phases/13-tools-and-protocols/04-structured-output, T5 = phases/13-tools-and-protocols/05-tool-schema-design/docs/en.md, C21 = phases/19-capstone-projects/21-tool-registry-schema-validation, C23 = phases/19-capstone-projects/23-function-call-dispatcher.

## 函数调用任务 (task-table, 8)
- declare OpenAI {"type": "function", "function": {...}}: F:60-64, F:578-580
- declare Anthropic {"name", "input_schema"}: F:628-631, F:658
- tool_choice="auto": F:598, F:104
- tool_choice="required": F:93, F:106
- force one tool tool_choice={"type":"function", ...}: F:108
- message.tool_calls: F:601, F:616
- b.type == "tool_use": F:643
- tool_result with tool_use_id: F:653

## 结构化输出任务 (task-table, 5)
- { type: "json_object" } JSON mode, no schema guarantee: A:55
- {type: "json_schema", strict: true}: T4/docs/en.md:29
- response_format=Product with beta.chat.completions.parse: A:442-448
- message.parsed: A:451
- instructor.from_openai, retries with validation errors: A:494, A:508

## 工具循环 (architecture, 6 nodes, 6 edges)
- User, Host holds registry, loop bound: T1/docs/en.md:19, 54, 142; F:37-43
- Model text, call or refuse: T1/docs/en.md:38-42
- Validator JSON Schema 2020-12: T1/docs/en.md:32, 48
- Executor your code: T1/docs/en.md:50; F:54
- Tool result as tool message with same id: T1/docs/en.md:54, 136
- edges message, tools, tool call, valid args, result, observe: F:42-48; T1/docs/en.md:19, 48, 54

## 一次工具调用 (flow, 7)
1. declare name, description, input schema: T1/docs/en.md:28-32
2. answer, call, refuse: T1/docs/en.md:38-42
3. id, name, arguments: T1/docs/en.md:44
4. validate arguments: T1/docs/en.md:48
5. executor, serializable result: T1/docs/en.md:50
6. tool message with matching id: T1/docs/en.md:54
7. repeat until no calls or MAX_TURNS: T1/docs/en.md:54; T1/code/main.py:28, 184

## OpenAI 往返 (annotated-code, 13 lines)
- create with model, messages, tools, tool_choice="auto": F:594-599
- tool_calls[0]: F:601
- json.loads(tool_call.function.arguments), arguments are a string: F:602; T2:47
- get_weather(**args): F:603
- assistant message, tool message with tool_call_id and json.dumps(result): F:607-611
- final create: F:605-612 (messages list shortened to a variable)

## 先校验，再修复或拒绝 (annotated-code, 11 lines)
- process_model_output body: T4/code/main.py:125-136 (docstring line 126 left out)
- refusal does not retry: T4/docs/en.md:116
- inject errors and retry: T4/docs/en.md:95

## 按提供方的形状 (concepts, 6)
- schema field: T2:45
- call container: T2:46
- arguments string vs object: T2:47
- result link: T2:49
- forbid tools: T2:51
- strict schema: T2:52

## 并行与流式调用 (concepts, 7)
- parallel_tool_calls: true default: T3/docs/en.md:51
- serial when dependent: T3/docs/en.md:55
- correlate by id, order free: T3/docs/en.md:59, 101
- OpenAI per index until finish_reason = "tool_calls": T3/docs/en.md:77
- Anthropic input_json_delta, content_block_stop: T3/docs/en.md:78
- partial JSON raises, parse at end signal: T3/docs/en.md:83
- 400, 600, 800 ms: 1800 serial, 800 parallel: T3/docs/en.md:105; T3/code/main.py:25

## 模式设计规则 (concepts, 5)
- snake_case, verb-noun, no arguments in name: T5:30-35
- Use when ... Do not use for ...: T5:42
- enum every closed set: T5:83
- split when action has more than three values: T5:79
- strict: required, additionalProperties: false, no $ref: T4/docs/en.md:51

## 限制与默认值 (defaults, 8)
- OpenAI 128 tools per request: T2:56
- OpenAI schema depth 5: T2:56
- OpenAI argument string 8192 bytes: T2:56
- Anthropic 64 tools: T2:57
- 1024 characters, truncated: T5:54
- MAX_TURNS 5: T1/code/main.py:28
- retries max 3x, more means bad schema: T4/docs/en.md:95, 98
- timeout_ms 30_000: C21/code/main.py:58

## 排障 (troubleshooting, 8)
- json.loads on partial JSON: T3/docs/en.md:83
- 400 at request time in strict mode: T4/docs/en.md:51
- wrong tool, overlapping descriptions, Do not use for: T5:19, 52
- enum confusion, constrained decoding: A:128
- refusal as typed outcome: T4/docs/en.md:72, 88
- extra fields, Anthropic advisory, validate server-side: T2:94
- schema errors deterministic, no retry: C23/docs/en.md:60
- matched by name breaks, return ids: T3/docs/en.md:63

## 问与答 (qa, 4)
- structured output vs call: F:127-131
- prompt JSON fails 5 to 15 percent: T1/docs/en.md:78
- call id for out-of-order parallel results: T1/docs/en.md:44
- schema cannot catch invented values: A:126

## 提示 (tips, 5)
- structured error result with CITY_NOT_FOUND: F:153-159
- errors for the model, 'city' is required: T5:95
- JSON pointer paths /user/email: C21/docs/en.md:69
- make key fields required, explicit null: A:134
- expose only needed functions: F:139
