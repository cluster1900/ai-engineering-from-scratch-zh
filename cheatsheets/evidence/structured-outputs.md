# Evidence: cheatsheets/structured-outputs.md

Abbreviations: CD = phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding, SO = phases/11-llm-engineering/03-structured-outputs, TP = phases/13-tools-and-protocols/04-structured-output, PJ = projects/json-schema-output-guard. d = docs/en.md, c = code/main.py, M = PJ/solution/main.ts, CLI = PJ/solution/cli.ts, S4 = PJ/stages/04-bounded-repair/docs/en.md.

## 输出守卫流水线 (architecture, 7 nodes, 8 edges)
- generate(feedback, attempt) callback: M:206-207, PJ/README.md:44
- parseJSON with 100_000 byte cap: M:114-117
- checkSchema preflight, depth > 32 rejected: M:45-52, 193, 213
- validate returns Issue[] with paths: M:118-125, 129-130
- accepted with value and trace: M:220
- repair with maxAttempts budget: M:206-219
- exhausted after the last rejected attempt: M:222, S4:7
- Issue[] fed back to generate: M:217-218, S4:7

## 一次约束解码步骤 (flow, 5 steps)
1. logit vector over ~100k tokens: CD/d:28
2. fsm.valid_tokens(state, tokenizer), accepting path: CD/d:79, 87
3. mask_logits sets others to float("-inf"): CD/d:67-71, CD/c:51-52
4. softmax puts mass on valid tokens, sample: CD/d:28, 81, CD/c:71-72
5. fsm.transition(state, tok), loop until fsm.is_accept(state): CD/d:77, 83

## 运行输出守卫项目 (command-table, 4 rows)
- --init, fresh starter fails: PJ/README.md:9, 12
- --stage 1 --path ... --strict, stages 1 to 4: PJ/README.md:13, 48-53, S4:34
- --all --solution --strict: PJ/README.md:31
- node cli.ts --schema samples/schema.json --attempts samples/attempts.json --output guard.json --html guard.html: PJ/README.md:21, 33; attempt 1 rejected at $/confidence: PJ/README.md:38, output of the command run in PJ/solution
- <ws> = learning-artifacts/json-schema-output-guard: PJ/README.md:12, 20

## 代码中的任务 (task-table, 8 rows)
- outlines.generate.json(model, Review): CD/d:103-104
- instructor.from_anthropic(Anthropic()): CD/d:127
- client.beta.chat.completions.parse(... response_format=Product): SO/d:442-448
- validate_schema(data, schema) returns errors: SO/d:150-153
- extract_with_retry(text, schema, max_retries=3): SO/d:346
- process_model_output(raw, INVOICE_SCHEMA): TP/c:125, 188
- guard(raw, schema) returns ok, value, issues: M:189-205
- repair(generate, schema, maxAttempts): M:206-210, PJ/API.md:3

## 问题 (qa, 5 bullets)
- refusal does not retry, typed refusal: TP/d:116
- often faster, forced tokens skipped: CD/d:39
- 3B with grammar beats 70B with prompting: TP/d:102
- acceptance does not establish factual correctness: PJ/README.md:46
- checkSchema before generate, no provider budget spent: S4:27

## 提示 (tips, 7 bullets)
- Outlines for flat local, XGrammar or llguidance for recursive: CD/d:173-174
- vLLM guided_json, guided_regex, guided_choice: CD/d:34, 175
- tool use when the model must pick among schemas: SO/d:120
- structured Issue[] feedback: PJ/README.md:44, S4:7
- trace keeps every attempt: S4:7
- $ref, format and combinators rejected: PJ/README.md:46
- <ws> path: PJ/README.md:12

## 带 Instructor 的 Pydantic schema (annotated-code, 12 lines)
- Invoice with vendor, total_usd Field(ge=0), line_items: CD/d:121-124
- instructor.from_anthropic(Anthropic()): CD/d:127
- client.messages.create(model="claude-opus-4-7", max_tokens=1024, response_model=Invoice, messages=...): CD/d:128-133
- retries on validation failure, default 3: CD/d:136

## TypeScript 中的有界修复 (annotated-code, 10 lines)
- schema with answer minLength 1, confidence 0..1, required, additionalProperties false: M:228-236
- unknown property issue when additionalProperties is false: M:183-184
- repair(async (_, i) => outputs[i - 1], schema), returns status and trace: M:243, 220-222

## 控制级别 (concepts, 8 bullets)
- Prompt-based ~90%: SO/d:42, 53
- JSON mode valid JSON, no schema guarantee: SO/d:55
- Schema mode native in every major provider: SO/d:57
- Constrained decoding 100% valid by construction: CD/d:20, SO/d:59
- Instructor does not modify logits, retries: CD/d:35, 136
- Outlines FSM, recursive schemas need flattening: CD/d:32
- XGrammar / llguidance CFG, recursive JSON Schema: CD/d:33
- strict mode rules: required, additionalProperties false, no $ref: TP/d:51

## 默认值与数字 (defaults, 8 rows)
- max_retries 3: SO/d:346
- Instructor retries default 3: CD/d:136
- retry max 3x, beyond three is a bad schema: TP/d:95, 98
- maxAttempts 3, budget 1..10: M:209, 211-212
- depth limit 32: M:47, 125
- output cap 100_000 bytes before JSON.parse: M:115-116
- exit code 2 when not ok or not accepted: CLI:51-55
- prompt for JSON 85 to 95 percent: TP/d:21

## 排障 (troubleshooting, 8 rows)
- answer before reasoning, reasoning first: CD/d:43-53, 162
- grammar too strict, invented date, allow null or sentinel: CD/d:161
- huge enum 10,000 options, top-k retrieval: CD/d:160
- recursive schemas, XGrammar or llguidance: CD/d:159
- JSON mode without schema: CD/d:163
- strict mode 400 at request time: TP/d:51
- hallucinated values, schema cannot catch: SO/d:126
- optional field omission, make required, force null: SO/d:134

## 缩写 (glossary, 8 bullets)
- FSM O(1) lookup: CD/d:214
- CFG handles recursion: CD/d:215
- Logit processor (logits, state) -> masked_logits: CD/d:213
- Guided decoding in the inference server: CD/d:217
- Refusal typed outcome: TP/d:142
- Parse error impossible under strict: TP/d:143
- Schema violation: TP/d:144
- Issue { path: string; message: string }: M:31
