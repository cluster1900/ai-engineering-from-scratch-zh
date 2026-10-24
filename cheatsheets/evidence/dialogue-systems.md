# Evidence: cheatsheets/dialogue-systems.md

Abbreviations: P05 = phases/05-nlp-foundations-to-advanced. CB = P05/17-chatbots-rule-to-neural, DST = P05/29-dialogue-state-tracking, CE = phases/11-llm-engineering/05-context-engineering. d = docs/en.md, c = code/main.py.

## 混合路由 (architecture, 7 nodes, 7 edges)
- User input into hybrid_chat: CB/d:169
- Destructive check with danger words: CB/d:170, 180-182
- Structured flow, confirmation for destructive actions: CB/d:171, 208, 236
- FAQ retrieval with threshold=0.6: CB/d:173-175
- FAQ returns None below threshold, escalate: CB/d:112-117
- LLM agent loop with RAG and tool calls: CB/d:50, 177, 195
- Tools are callable functions: CB/d:162
- Reply: CB/d:158, 175

## Agent 循环 (flow, 6 steps)
1. history starts with the user message, range(max_steps): CB/d:137-139
2. llm(history, tools=tools), response.get("tool_call"): CB/d:140-141
3. unknown tool name or non-dict args append an error and continue: CB/d:145-152
4. fn(**args) runs, call and result appended to history: CB/d:153-156
5. no tool_call returns response["content"]: CB/d:157-158, 162
6. step budget message: CB/d:159, 162

## 代码中的任务 (task-table, 8 rows)
- faq_respond(user_input, threshold=0.5), returns None: CB/d:108-114
- is_destructive_action(text): CB/d:180
- agent_loop(user_message, tools, llm, max_steps=5): CB/d:137
- joint_goal_accuracy(predicted_states, gold_states): DST/d:130-132
- ContextBudget(max_tokens=128000, generation_reserve=4000): CE/c:17, 307
- budget.allocate("tools", tool_text, max_tokens=2000): CE/c:271
- select_tools(query, token_budget=2000): CE/c:227
- reorder_lost_in_middle(items, scores): CE/c:68-79

## 基于规则的状态更新 (annotated-code, 13 lines)
- SLOT_EXTRACTORS dict with four extractors: DST/c:56-61
- update_state copies the state: DST/c:73-74; never reset untouched slots: DST/d:97
- extractor value overwrites slot: DST/c:75-79; correction must overwrite: DST/d:99
- is_negation clears the slot: DST/c:80-81, 68-70; negation must clear: DST/d:98
- return new_state: DST/c:82

## 带 schema 的 LLM 追踪器 (annotated-code, 10 lines)
- RestaurantState fields and Literal sets: DST/d:108-113
- day free-form slot: DST/d:113, 155
- llm_dst prompt with render(history), "Output only the JSON state.": DST/d:116-121
- llm(prompt, response_model=RestaurantState): DST/d:122
- regenerate whole state from history: DST/d:147

## 按查询组装上下文 (flow, 6 steps)
1. system_prompt first, max_tokens=1000: CE/c:267, CE/d:67
2. classify_intent then select_tools, max_tokens=2000: CE/c:228, 269-271, CE/d:151-152
3. score_relevance, threshold filter, max_tokens=3000: CE/c:273-284
4. reorder_lost_in_middle, best at start and end: CE/c:282, CE/d:244
5. history from get_context, summaries plus recent, max_tokens=5000: CE/c:126-136, 286-288
6. user_query last, max_tokens=500, generation reserve: CE/c:290, 20, CE/d:68

## 范式与 DST 术语 (concepts, 8 bullets)
- Rule-based patterns, intents, slot filling, fails outside scope: CB/d:44
- Retrieval-based nearest stored response, no hallucination: CB/d:46
- Neural seq2seq generic outputs, factual drift: CB/d:48
- LLM agent plan, call tool, observe, decide: CB/d:50
- Slot named parameter (cuisine, date): DST/d:206, CB/d:249
- Classification DST yes/no per (slot, candidate_value), closed vocab: DST/d:32
- Generation DST free text, open vocab, modern default: DST/d:33
- JGA every slot correct, all-or-nothing: DST/d:35, 208

## 默认值与数字 (defaults, 8 rows)
- max_tokens 128000: CE/c:17
- generation_reserve 4000, reserve 2,000-4,000: CE/c:17, CE/d:102
- max_history_tokens 5000, drop two oldest turns into a summary: CE/c:96, 110-114
- token_budget 2000: CE/c:227
- relevance threshold 0.05 in code, 0.1 in docs: CE/c:274, CE/d:454
- 1.3 tokens per word: CE/c:9
- max_steps 5: CB/d:137
- FAQ threshold 0.5, hybrid uses 0.6: CB/d:108, 173

## 故障排查 (troubleshooting, 8 rows)
- Confident fabrication, never claim without successful tool return: CB/d:203
- Prompt injection, untrusted input, PVE, confirmation: CB/d:204, 208
- Infinite loops, step budget, dedup: CB/d:212
- Context window exhaustion, summarize or retrieve old turns: CB/d:213
- Lost in the middle, important first, query last: CE/d:61-69
- Correction must not clear other slots: DST/d:50, 97
- Case sensitivity, normalize everywhere: DST/d:153
- Schema drift, version schema: DST/d:152

## 缩写 (glossary, 8 bullets)
- DST maintain slot-value dict: DST/d:205
- JGA, MultiWOZ 2.4 top 80-83%: DST/d:135, 208
- MultiWOZ multi-domain WOZ dataset: DST/d:209
- LDST LLaMA + LoRA, domain-slot prompting: DST/d:41
- TripPy copy-based with BERT, pre-LLM standard: DST/d:40
- PVE Plan-Verify-Execute: CB/d:208
- RAG retrieve docs then ground: CB/d:250
- Lost-in-the-middle 85-90% at ends, 60-70% in middle: CE/d:63

## 问答 (qa, 5 bullets)
- No single architecture handles every request well: CB/d:199
- Rule-based for destructive actions: CB/d:185, 236
- Regenerate whole state handles corrections: DST/d:147
- O(n^2) total tokens, cap or summarize: DST/d:151
- Curated 10K often beats dumped 100K: CE/d:26

## 技巧 (tips, 6 bullets)
- Return None and escalate: CB/d:117
- Log every step (observability), off-task rate evaluations: CB/d:164, 211
- Free-form vs closed-set slots: DST/d:155
- Always pass the full history: DST/d:154
- Tool pruning 60-80%: CE/d:94, 581
- Two to three few-shot examples: CE/d:100
