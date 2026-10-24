# Evidence: cheatsheets/context-engineering.md

Abbreviations: L05 = phases/11-llm-engineering/05-context-engineering, L07 = phases/14-agent-engineering/07-memory-virtual-context-memgpt, L08 = phases/14-agent-engineering/08-memory-blocks-sleep-time-compute, L09 = phases/14-agent-engineering/09-hybrid-memory-mem0, L34 = phases/14-agent-engineering/34-repo-memory-and-state, MS = projects/memory-server. d = docs/en.md, c = code/main.py.

## 上下文窗口预算 (architecture, 8 nodes, 6 edges)
- System prompt ~500 tokens: L05/d:40. Goes first: L05/d:67, 92
- Tool definitions ~2K-8K tokens: L05/d:40
- Retrieved context ~2K-10K tokens: L05/d:41
- Conversation history ~2K-20K tokens: L05/d:42
- Few-shot examples ~1K-3K tokens: L05/d:43
- User query ~100-500 tokens: L05/d:44. Goes last: L05/d:68
- Generation budget ~2K-8K tokens: L05/d:45
- Context window 128K tokens: L05/d:38. Components compete for space: L05/d:57
- Edges follow the mermaid chain S to G: L05/d:40-45

## 关键数字 (concepts, 8)
- 85-90% first or last, 60-70% at position 10 of 20: L05/d:63
- Positions 40-70%, 10-20% drop: L05/d:24
- 10K curated beats 100K dumped: L05/d:26
- 50-200 tokens per tool, 50 tools at 150 is 7,500: L05/d:94
- Tool pruning 60-80%: L05/d:94, 581
- 50 turns at 200 tokens is 10,000: L05/d:98
- 100 tokens replace 10 turns of 2,000: L05/d:106
- count_tokens word count times 1.3: L05/d:176-179, L05/c:9

## 按查询组装上下文 (flow, 6 steps)
1. classify_intent keyword counts, fallback ["code"]: L05/c:203, 221. Step 1 of the assembly list: L05/d:151
2. select_tools(query, token_budget=2000), category match: L05/c:227-234, L05/d:152
3. score_relevance(query, documents) word overlap, threshold drop: L05/d:260-270, L05/c:274-278, L05/d:153
4. reorder_lost_in_middle(items, scores), best first and last: L05/d:244-258, L05/d:156
5. ConversationManager summarizes oldest 2 turns over cap: L05/c:95, 110-111, L05/d:154
6. ContextBudget truncates to cap and space left: L05/d:197-216

## ContextEngine.assemble (annotated-code, 8 lines)
- ContextBudget(max_tokens=128000, generation_reserve=4000): L05/c:307
- allocate system_prompt max_tokens=1000: L05/c:267
- select_tools(query, token_budget=2000): L05/c:269
- allocate tools max_tokens=2000: L05/c:271
- allocate retrieved_context max_tokens=3000: L05/c:284
- allocate conversation_history max_tokens=5000: L05/c:288
- allocate user_query max_tokens=500: L05/c:290. Query last: L05/d:68
- print(budget.report()) with tokens and percent per component: L05/c:52-66, 313

## 记忆工具接口 (command-table, 8)
- core_memory_append(section, text): L07/d:52, L07/c:91
- core_memory_replace(section, old, new): L07/d:53, L07/c:96
- archival_memory_insert(text): L07/d:54
- archival_memory_search(query, top_k), result splices into next turn: L07/d:48, 55
- conversation_search(query) over evicted + messages: L07/d:56, L07/c:113-118
- block_append(label, text): L08/d:47
- block_replace(label, old, new): L08/d:48
- block_summarize(label) near limit: L08/d:50

## 记忆设计对比 (comparison, 6 rows)
- Stores: MemGPT main + external: L07/d:41-42. Letta core, recall, archival: L08/d:28-32. Mem0 vector, KV, graph: L09/d:28-33. Repo JSON files under schema: L34/d:19
- Write: memory tool call L07/d:34. Block tools and sleep-time rewrites L08/d:30, 45-50. add(text, user_id, metadata) L09/d:28-33. Validate then atomic write L34/d:22-30, 58
- Read: archival_memory_search L07/d:55. Core always visible L08/d:30. search(query, user_id) fuses L09/d:35-40. Load and validate L34/c:118-121
- Stale facts: consolidation, invalidation L07/d:70. Sleep-time invalidates L08/d:54. Edge marked invalid not deleted L09/d:58. schema_version refuses L34/d:62, 97
- Risks: memory rot, poisoning L07/d:70-71. Block bloat, silent drift L08/d:70-71. Embedding drift, graph explosion L09/d:84-86. Partial writes L34/d:58, 89
- Use when: larger than window L07/d:17-21. Always in prompt L08/d:21. Three query classes L09/d:17-23. Durable state L34/d:3, 19

## 代码中的任务 (task-table, 8)
- create(label, description, limit=300): L08/c:54
- block.near_limit(): L08/c:146
- sleep.run(contradictions=[...]): L08/c:221
- self.archival.invalidate(record.rid): L08/c:153
- mem.add(text, user_id=..., kv_triples=...): L09/c:113-117, 168-172
- mem.search(query, user_id=..., top_k=3): L09/c:134-135, 216
- atomic_write(path, content): L34/c:99
- mgr.commit(state) raises SchemaError: L34/c:56, 123-125, 172-175

## 记忆服务器项目 (command-table, 7)
- --init, fresh starter fails: MS/README.md:9, 12
- --all --path --strict, cumulative grader: MS/README.md:16, 19. Four stages: MS/README.md:62-65
- --put samples/memory.json, revision 1, id cache-policy: MS/README.md:21, 42, MS/solution/samples/memory.json:2
- --query "cache policy", namespace default docs: MS/README.md:22, MS/solution/cli.ts:12
- --put samples/memory-updated.json --revision 1, revision 0 conflict: MS/README.md:42, 58, 91
- --history cache-policy --html history.html, comparison table: MS/README.md:92, 95, MS/solution/cli.ts:43-79
- --serve --port 8788 with MEMORY_TOKEN: MS/README.md:48, 52-55, MS/solution/cli.ts:81-83

## 默认值 (defaults, 8)
- max_tokens 128000, generation_reserve 4000: L05/c:17
- max_history_tokens 5000: L05/c:96
- token_budget 2000: L05/c:227
- threshold 0.05 in code, 0.1 in docs: L05/c:274, L05/d:454
- max_messages 4, evicted list: L07/c:25-31
- Block limit 300 characters, near_limit threshold 0.8: L08/c:18, 46-47, L08/d:118
- w_relevance 0.6, w_importance 0.2, w_recency 0.2: L09/c:99-101
- recency_halflife_s 86400.0, 0.5 per half-life: L09/c:102, 132

## 故障排查 (troubleshooting, 8)
- Lost in the middle, first and last, repeat at end: L05/d:61, 67-70
- Tools fill window, prune by intent: L05/d:94, 110
- Memory rot, consolidate and invalidate: L07/d:70, L08/d:20, 60
- Memory poisoning, retrieved text re-ingested: L07/d:71, 112-113
- Citation loss, store session ID and turn ID: L07/d:72
- Block bloat, summarize before the write: L08/d:70
- Scopes mixed, one scope per write: L09/d:80
- Non-atomic write, temp, fsync, os.replace: L34/d:58, 89

## 问答 (qa, 5)
- 128k baselines miss facts a 4k agent with memory catches: L07/d:23
- Sleep-time no latency cost, stronger model: L08/d:58-59
- Single store wrong for two of three: L09/d:23
- Weighted sum, weights per product: L09/d:13, 44-54
- Repo memory contents, not raw transcripts: L34/d:34-40
