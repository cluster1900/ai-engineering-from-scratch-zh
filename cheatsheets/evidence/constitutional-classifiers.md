# Evidence: cheatsheets/constitutional-classifiers.md

Abbreviations: C17 = phases/15-autonomous-systems/17-constitutional-ai, G18 = phases/15-autonomous-systems/18-llama-guard, R05 = phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif, E86 = phases/19-capstone-projects/86-constitutional-rules-engine. d = docs/en.md, c = code/main.py.

## CAI 训练的两个阶段 (flow, 6 steps)
1. helpful-but-not-yet-harmless SFT model answers a red-team prompt: R05/d:24
2. critique under a sampled principle: R05/d:24, C17/d:52
3. revise, revised response is the SFT target: R05/d:24, C17/d:53
4. generate pairs of completions: R05/d:30
5. feedback model scores each against sampled principles: R05/d:30, 102
6. reward model on AI preferences, PPO against it: R05/d:30

## 分层防御 (architecture, 7 nodes, 6 edges)
- User turn, input rails classify-and-block it: G18/d:42
- Input rail, Llama Guard and NeMo: G18/d:42, 45
- Model weights trained with Constitutional AI: G18/d:79
- Output rail, classifier gate: R05/d:58, 100; G18/d:43
- Rules engine over a YAML constitution: E86/d:14
- Fixer, local edits per rule: E86/d:16, 50
- Verdict, accepted or escalated: E86/d:26
- draft to rules engine to violations to fixer to 2nd pass: E86/d:21-27

## 三层并排对比 (comparison, 6 rows)
- acts on: weights prefer C17/d:80. every request and response G18/d:12. candidate output E86/d:14
- signal: principles, critique, RLAIF R05/d:24, 30. S1-S14 taxonomy G18/d:29, 34. predicates E86/d:46
- result: principled refusal C17/d:56. block, flag, route G18/d:29, 64. Violation per rule plus fixer E86/d:14-16
- wins on: close analogs C17/d:62. fast default rejection G18/d:63. contractual constraints E86/d:12
- misses: principle ambiguity, drift C17/d:66, 68. emoji smuggling, homoglyph, paraphrase G18/d:70, 73. structural rewrites E86/d:50
- example: Claude Constitution C17/d:3. Llama Guard 3, NeMo Guardrails G18/d:3. rules.yml E86/d:61

## 层级与区域 (concepts, 7)
- Tier 1 safety and supporting human oversight: C17/d:22
- Tier 2 ethics, supersedes guidelines: C17/d:23
- Tier 3 Anthropic guidelines: C17/d:24
- Tier 4 helpfulness, lowest: C17/d:25
- hardcoded list, no operator or user override: C17/d:32-37
- soft-coded defaults inside a declared bound: C17/d:40-45
- R05 order catastrophic, guidelines, ethics, helpful, top-down: R05/d:48-52

## 需要知道的数字 (concepts, 8)
- 79 pages, CC0, January 2026: C17/d:3
- 16 principles: R05/d:26
- ~1,000 US respondents, ~50% agreement: C17/d:72
- 23.7% v1, ~1% v2: R05/d:58
- Llama-3.1-8B, 13-hazard taxonomy, 8 languages: G18/d:22-26
- 1B-INT4 >30 tok/s on mobile CPUs: G18/d:27
- S1-S14, S14 Code Interpreter Abuse: G18/d:34
- Emoji Smuggling 100% ASR on six guards, NeMo Guard Detect 72.54%: G18/d:51, 59

## 四层裁决器（L15.17） (annotated-code, 9 lines)
- block = hardcoded_block(action), substring match: C17/c:25-26, 42-47, 52
- refuse on hardcoded prohibition: C17/c:53-54
- safety >= 3 refuse, higher tier wins: C17/c:56-59
- ethics >= 3 refuse: C17/c:60-61
- guidelines >= 3 modify: C17/c:62-63
- allow: C17/c:67

## 先归一化，再分类（L15.18） (annotated-code, 5 lines)
- unicodedata.normalize("NFKC", text): G18/c:64
- _homoglyph_map, Cyrillic to Latin: G18/c:65, 87-99
- drop invisible code points: G18/c:66, 69-80
- classify_raw(normalize(text)): G18/c:102-103
- output_rail(o) over OUTPUT_DISALLOWED: G18/c:108-122, 159

## rules.yml 中的一条规则 (annotated-code, 11 lines)
- no-empty-refusal rule, severity, applies_when, must any_of, explanation, fix append_if_missing: E86/code/rules.yml:3-13
- severities low, medium, high: E86/d:48, E86/c:27
- not_applicable when applies_when fails: E86/d:46, E86/c:150-155

## 规则语法 (command-table, 8)
- contains_regex, not_contains_regex with IGNORECASE: E86/d:46, E86/c:104-109
- starts_with_regex, ends_with_regex: E86/d:46, E86/c:110-115
- max_words, min_words: E86/d:46, E86/c:116-121
- all_of, any_of, not_, short-circuit on any_of: E86/d:46, 61, E86/c:84-103
- applies_when false -> not_applicable: E86/d:46
- append_if_missing, prepend_if_missing: E86/d:50, E86/c:187-194
- replace_regex pattern -> replacement: E86/c:195-197
- high blocks at the lesson 87 gate: E86/d:48

## 运行与使用 (task-table, 8)
- Run code/main.py (15.17): C17/d:97
- Run code/main.py (15.18): G18/d:101
- Usage python3 code/main.py (18.05): R05/c:9
- Run python3 main.py (19.86): E86/c:8
- engine = Engine(): E86/c:255, E86/code/tests.py:40
- report = engine.evaluate(draft): E86/c:264
- fixer.apply(draft, report.violations()): E86/code/tests.py:93
- diff(draft, revised): E86/c:269

## 故障排查 (8)
- emoji smuggling, invisible characters, normalize first: G18/d:51, 101, G18/c:58-66, 132
- homoglyph, partial map, broaden: G18/d:53, G18/c:83-86
- output rails catch what input rails missed: G18/d:65, G18/c:178-179
- multi-turn drift, dialog rails persist across turns: G18/d:44, 47, 71, 122
- premise framing, hardcoded prohibitions do not bend: C17/d:76
- has bad severity: E86/c:136-137
- missing required field: E86/c:138-139
- unknown predicate: E86/c:122

## 问答 (5)
- not cheaper RLHF, labeler bias shifts to principle interpretation: R05/d:34-36
- sycophancy drops, Goodhart's Law persists: R05/d:38
- classifier below constitutional layer, above runtime: G18/d:77
- structural rewrites belong in a separate refusal-and-help layer: E86/d:50
- CAI shapes behaviour, classifiers enforce invariants, neither alone: R05/d:60
