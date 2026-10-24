# Evidence: cheatsheets/agent-tool-use-skills.md

Abbreviations: A = phases/14-agent-engineering/06-tool-use-and-function-calling, V = phases/14-agent-engineering/10-skill-libraries-voyager, F = phases/11-llm-engineering/09-function-calling. d = docs/en.md, c = code/main.py, fc = code/function_calling.py.

## 函数调用循环 (architecture, 5 nodes, 6 edges)
- User sends a message: F/d:42, 52
- Application executes tools: F/d:45, 54
- Model decides the call: F/d:44, 54
- Tool get_weather("Tokyo"): F/d:45
- Tool definitions as JSON Schema: F/d:43, 52, 58
- edges message, messages + tool definitions, tool_call, execute, result: F/d:42-47

## 工具 schema (annotated-code, 8 lines)
- "type": "function", "function", "name": "get_weather": F/d:62-64
- description "Get current weather for a city.": F/d:65. Description is a prompt for tool selection: F/d:85
- "parameters", "type": "object": F/d:66-67. Anthropic uses input_schema: F/d:649, A/d:54
- properties city string, units enum celsius/fahrenheit: F/d:68-77
- "required": ["city"]: F/d:79. Missing field gives an error observation: A/d:62

## 各家提供商对比 (comparison, 5 rows)
- tools / tools / function_declarations: F/d:93-95
- tool_calls[].function / content[].type="tool_use" / functionCall: F/d:93-95
- function.parameters / input_schema: A/d:54, F/d:649. Google JSON Schema: F/d:98
- tool_choice="required" / tool_choice={"type":"any"} / function_calling_config: F/d:93-95
- {"role": "tool", "tool_call_id": ...}: F/d:601. "tool_result" in a user message: F/d:644, 649

## 代码中的任务 (task-table, 8)
- reg.register(ToolDef(...)): A/c:113, 160
- reg.catalog(): A/c:116, 193
- reg.dispatch_many(calls): A/c:138, 204
- validate(args, schema): A/c:75
- run_function_calling_loop(user_message, max_iterations=5): F/fc:322
- lib.search("I need a pickaxe"): V/c:202
- lib.execute("craft_iron_pickaxe"): V/c:206
- python3 code/main.py: A/d:98, V/d:107

## 带结构化错误的注册表 (annotated-code, 10 lines)
- ToolRegistry(), register ToolDef classify with enum open/closed/pending, required status: A/c:159, 180-190
- timeout_s default 5.0: A/c:19
- ToolCall("u02", "multiply", {"a": "4", "b": 5}) coerces: A/c:41-43, 198
- ToolCall("u03", "classify", {"status": "in_progress"}) not in enum: A/c:94-95, 199
- dispatch_many loop, result.ok, result.content: A/c:204-206
- errors are strings, never raised: A/c:209-210

## 技能库循环 (annotated-code, 10 lines)
- SkillLibrary(), register craft_iron_pickaxe v1 with code, fn, tags, depends_on: V/c:166, 192-199
- search token overlap, top_k=3: V/c:43, 53-56
- execute runs deps first in topo_order: V/c:64, 89
- ctx["failed"] True, need 2 stick, have 0: V/c:105, 132-133, 205
- re-register same name gives v2 with _craft_iron_pick_v2: V/c:30-39, 212-219

## Voyager 改进循环 (flow, 6 steps)
1. Curriculum proposes a task just above current capability: V/d:33, 81
2. Library retrieves top-k skills by query-to-description similarity: V/d:34, 61
3. Agent writes or composes a skill as executable code: V/d:41, 63, 71
4. Environment returns success, error, self-verification failure: V/d:72-73
5. Agent rewrites the skill with the signal as context: V/d:74
6. New version stored, loop until success or max rounds: V/d:75, V/c:38

## 校验失败与修复 (troubleshooting, 6)
- error: unknown tool 'subtract': A/c:127, 201. No-op tool to refuse: A/d:110
- missing required: A/c:83. Error back, model retries: A/d:62, 65
- 'in_progress' not in [...]: A/c:95. Reject with descriptive error: A/d:61
- Wrong tool picked from bad descriptions: A/d:54. Say what and when: A/d:50
- Swapped tool_use_id routes results wrong: A/d:73-75
- Retrieval degrades past a few hundred skills, tag filters and hard constraints: V/d:89

## 课程代码中的默认值 (defaults, 6)
- timeout_s 5.0: A/c:19
- version 1: V/c:19
- dedup True: V/c:29-39
- top_k 3: V/c:43
- tag_filter None: V/c:44, 48
- max_iterations 5: F/fc:322

## 关键数字 (concepts, 6)
- BFCL V4 40/30/10/10/10: A/d:3, 34-38
- round trips 2 to 1: F/d:121
- 60-80% latency for 5-10 tool calls per query: F/d:121
- 10-20 calls per conversation: F/d:145
- Voyager 3.3x, 8.5x, 6.4x: V/d:37
- Toolformer keeps calls that reduce next-token loss: A/d:11, 24, 120

## 安全规则 (tips, 6)
- Never pass model-generated SQL to a database, parameterize: F/d:137
- Allowlist functions, expose only what the user needs: F/d:139
- Validate types, ranges, formats: F/d:141
- Sanitize results, API keys, PII, internal errors: F/d:143
- run_code uses ast.parse, blocks imports and dunder access: F/fc:105-118, F/d:303
- Untrusted code in a separate process or container: F/d:303

## 问答 (qa, 5)
- Model never executes, your code does: F/d:54
- Structured outputs for extraction, function calling for external systems: F/d:131
- Models self-correct from structured errors, fail on empty or generic: F/d:161
- Skill is a named chunk of code plus description, retrievable by similarity: V/d:135
- Parent pinned to v1 does not pick up v3: V/d:88
