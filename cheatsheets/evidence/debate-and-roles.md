# Evidence: cheatsheets/debate-and-roles.md

Abbreviations: A = phases/16-multi-agent-and-swarms/07-society-of-mind-debate, B = phases/16-multi-agent-and-swarms/08-role-specialization, C = phases/14-agent-engineering/25-multi-agent-debate, D = phases/19-capstone-projects/10-multi-agent-software-team, E = projects/multi-agent-code-review-panel. d = docs/en.md, c = code/main.py.

## 辩论协议 (flow, 6 steps)
1. N agents produce an initial answer: A/d:20, C/d:22
2. Round r = 2..R, read the other agents' round r-1 answers: A/d:21, C/d:23
3. Critique peers and update: C/d:23-24, A/d:21
4. Re-inject the question every round against topic drift: A/d:54
5. Majority-vote after R rounds: A/d:22, C/d:25
6. N agents x R rounds = N·R LLM calls with growing context: A/d:55

## 辩论拓扑 (comparison, 7 rows)
- Who reads whom: C/d:105-107, C/c:37, 52-55
- Runners full_mesh_round and sparse_star_round: C/c:32, 43
- ops += len(peers), hub reads spokes, spoke adds 1: C/c:39, 51, 56
- 60 vs 12 critique ops at N=5, R=3: C/d:37-38
- 15 proposals: C/d:37-38
- Convergence collapse and hub failure: C/d:61-62
- Required disagreement rounds, rotate or use multiple hubs: C/d:61-62

## 四种经典角色 (concepts, 7)
- Planner: B/d:20
- Executor: B/d:22
- Critic: B/d:24
- Verifier: B/d:26
- Critic vs verifier not the same role: B/d:28
- Communicative dehallucination, ask the relevant role by name: B/d:44-46
- Code = SOP(Team), strict input/output schema: B/d:40

## 代码中的角色流水线 (annotated-code, 8 lines)
- spec = planner(user_wish), 3 tests: B/c:94, 44
- art = executor(spec), Artifact code string: B/c:96, 22-23
- crep = critic(spec, art), checks def, return, task name: B/c:98, 60-65
- vrep = verifier(spec, art): B/c:100
- exec(art.code, ns, ns): B/c:74
- fn = ns.get(spec.task_name), no callable failure: B/c:77-79
- got = fn(*args) against expected: B/c:83, 87-88
- if crep.approved and vrep.passed: B/c:102

## 软件团队架构 (architecture, 8 nodes, 7 edges)
- GitHub issue URL: D/d:25
- Architect plan with subtasks + interfaces: D/d:28-29
- Task board file / Redis: D/d:32
- Coders A to D, worktree + Daytona: D/d:36-39
- Merge coordinator three-way merge: D/d:43
- Reviewer: D/d:46, approve or request changes: D/d:17
- Tester clean sandbox: D/d:79
- Open PR after tests pass: D/d:49
- Edge labels plan_request, subtask, diff_ready, review_needed, approved, test_passed: D/c:25-32, 119, 126, 136, 140, 146, 166

## 任务看板消息 (command-table, 8)
- plan_request with DAG of subtasks: D/c:119-121, D/d:71
- subtask with files to a coder: D/c:126-127
- diff_ready to merge_coord: D/c:136
- review_needed to reviewer: D/c:140-141
- review_feedback back to coder: D/c:150, D/d:77
- approved to tester: D/c:146
- test_passed to pr_opener: D/c:166
- test_failed with stacktraces back to coder: D/c:169, D/d:79

## 评审小组 API (task-table, 7)
- validateFinding(raw, files): E/API.md:10
- aggregate(reviews, files, quorum = 2): E/API.md:11
- runPanel(reviewers, budget, timeoutMs = 1000): E/API.md:12
- evaluate(predicted, expected): E/API.md:13
- JSON.stringify([f.file, f.line, f.rule]): E/solution/main.ts:70
- node cli.ts --input samples/review.json: E/README.md:21
- --pr-report /path/review.json: E/README.md:63

## 法定人数与预算代码 (annotated-code, 7 lines)
- duplicate reviewer throws: E/solution/main.ts:61
- seen.has(key) continue: E/solution/main.ts:71
- status consensus or needs-review: E/solution/main.ts:86
- disagreement from severities set: E/solution/main.ts:87
- spent + r.cost > budget, budget-skipped: E/solution/main.ts:113-114
- controller.abort() on deadline, timeout status: E/solution/main.ts:129, 137
- precision 0 on zero predictions: E/solution/main.ts:155

## 默认值与数字 (defaults, 8)
- Cap rounds at 3: A/d:82
- Cap agents at 5: A/d:83
- N=3, R=2 due to cost: C/d:27
- Max 2 critic-executor revision rounds then human: B/d:106
- quorum default "2": E/solution/cli.ts:10
- budget default "3": E/solution/cli.ts:9
- timeout default "1000": E/solution/cli.ts:11
- maxTurns = 12: D/code/ts/src/coordinator.ts:32

## 失败模式 (troubleshooting, 7)
- Sycophancy cascade, counter-position: A/d:53
- Topic drift, re-inject question: A/d:54
- Compute blowup, more than 10x CoT: A/d:55, caps A/d:82-83
- Prompt homogenization: C/d:63
- Hub failure: C/d:62
- All-LLM anti-pattern, add code verifier: B/d:63
- False approval under 5%: D/d:117, D/d:136

## 要记住的数字 (concepts, 6)
- 5-agent 5-round = 25 calls: A/d:55
- NLSOM 129: A/d:49
- MAST 1642, 21.3%: B/d:50
- 10% to 70%, 7x: B/d:52
- 40-turn becomes 160 turns: D/d:21
- Rubric weights: D/d:109-113

## 问答 (qa, 5)
- Correlated errors, debate decorrelates: A/d:39
- Agents alone and rounds alone plateau, both give jumps: A/d:30-32
- Latency, cost, simple lookups: C/d:48-50
- Consensus measures support, not truth: E/README.md:46
- Distinct reviewer ids, not reports: E/stages/02-agreement/docs/en.md:13

## 上线清单 (tips, 6)
- Two different base models: A/d:84
- Log every round: A/d:86
- One deterministic verifier: B/d:102
- Critic first, verifier second: B/d:105
- Plan frozen once coders start: D/d:19
- Reviewer cannot approve its own changes: D/d:19
