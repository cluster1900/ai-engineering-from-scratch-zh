# ReWOO and Plan-and-Execute：解耦式规划

> ReAct 在一个 stream 中交错 thought 和 action。ReWOO 将它们分离：先制定一个完整的大计划，然后执行。Token 减少 5x，在 HotpotQA 上 accuracy 提升 +4%，并且你可以把 planner distill 到一个 7B model。Plan-and-Execute 将其泛化；Plan-and-Act 将其扩展到 web navigation。

**类型：** 构建
**语言：** Python (stdlib)
**先修要求：** Phase 14 · 01 (Agent Loop)
**时间：** ~60 分钟

## 学习目标
- 解释为什么 ReWOO 的 Planner / Worker / Solver 拆分相比 ReAct 的交错 loop 能节省 tokens 并提升 robustness。
- 实现一个 plan DAG、一个按依赖顺序执行的 executor，以及一个组合 worker outputs 的 solver —— 全部使用 stdlib。
- 使用 2026 年 “five workflow patterns” 框架（Anthropic），判断任务应采用 plan-then-execute 还是交错式 ReAct。
- 识别什么时候 Plan-and-Act 的 synthetic plan data 对 long-horizon web 或 mobile tasks 是必要的。

## 问题
ReAct 的交错式 thought-action-observation loop 简单且灵活，但每次 tool call 都必须携带完整的先前 context —— 包括之前的每一个 thought。Token usage 会随深度呈二次增长。更糟的是：当某个 tool 在 loop 中途失败时，model 必须根据 error observation 重新推导整个 plan。

ReWOO（Xu et al., arXiv:2305.18323, May 2023）注意到了这一点，并做了一个取舍：先完整规划，parallel 获取 evidence，最后组合 answer。一次 LLM call 用于规划，N 次 tool calls 用于 evidence（可以 parallel），一次 LLM call 用于求解。这个取舍是用更少的 flexibility（plan 是 static 的）换取更好的 token efficiency 和更清晰的 failure modes。

## 概念
### The three roles

```
Planner:  user_question -> [plan_dag]
Workers:  [plan_dag]     -> [evidence]        (tool calls, possibly parallel)
Solver:   user_question, plan_dag, evidence -> final_answer
```

Planner 生成一个 DAG。每个 node 都指定一个 tool、它的 arguments，以及它依赖哪些更早的 nodes（例如 `#E1`、`#E2` 这样的 references）。Workers 按 topological order 执行 nodes。Solver 将所有内容拼接在一起。

### Why 5x fewer tokens

ReAct 的 prompt length 会随 step count 线性增长。在第 10 步，prompt 包含 thought 1 加 action 1 加 observation 1 加 thought 2 加 action 2 加 observation 2，依此类推。每个 intermediate step 还会冗余包含原始 prompt。

ReWOO 只支付一次 planner prompt（较大）、N 个小 worker prompts（每个只是 tool call，没有 chain）和一次 solver prompt。论文在 HotpotQA 上测得 tokens 减少约 5x，同时 absolute accuracy 提升 +4。

### Why it is more robust

如果 worker 3 在 ReAct 中失败，loop 必须在 stream 中途从 error 中推理恢复。在 ReWOO 中，worker 3 返回一个 error string；solver 能在原始 plan 的 context 中看到它，并优雅降级。Failure localization 是 per-node 的，而不是 per-step 的。

### Planner distillation

论文的第二个结果：因为 planner 看不到 observations，你可以用 175B teacher 的 planner outputs 来 fine-tune 一个 7B model。小 model 负责 planning；大 model 在 inference 时不再需要。这现在已经很常见 —— 许多 2026 production agents 使用小 planner 和大 executor，或反过来使用。

### Plan-and-Execute (LangChain, 2023)

LangChain 团队在 2023 年 8 月的文章中将 ReWOO 泛化为一个 pattern 名称：Plan-and-Execute。Up-front planner 输出一个 step list，executor 执行每个 step，可选的 replanner 可以在观察结果后进行修订。这比 ReWOO 更接近 ReAct（replanner 会把 observations 带回 planning），但保留了 token savings。

### Plan-and-Act (Erdogan et al., arXiv:2503.09572, ICML 2025)

Plan-and-Act 将该 pattern 扩展到 long-horizon web 和 mobile agents。关键贡献是 synthetic plan data：一个 labeled trajectory generator 生成显式包含 plan 的训练数据。它用于 fine-tune planner models，使其在 WebArena-like tasks 上超过 30-50 步后仍能正常工作，而单条 ReAct trajectory 在这类任务中会丧失 coherence。

### When to pick which

| Pattern | When |
|---------|------|
| ReAct | 短任务、未知 environment、需要 reactive exception handling |
| ReWOO | 具备已知 tools 的结构化任务、对 token 敏感、evidence 可 parallelize |
| Plan-and-Execute | 类似 ReWOO，但在 partial execution 后支持 replanning |
| Plan-and-Act | Long-horizon（>30 步）、web/mobile/computer-use |
| Tree of Thoughts | Search 值得付出成本（Lesson 04） |

Anthropic 的 2024 年 12 月指导：从最简单的方式开始。如果任务只是一次 tool call 加一次 summary，就不要构建 ReWOO。如果任务是一个 40 步 research assignment，就不要只用 ReAct。

## 构建它
`code/main.py` 实现了一个玩具版 ReWOO：

- `Planner` —— 一个 scripted policy，根据 prompt 输出 plan DAG。
- `Worker` —— 通过 registry 分发每个 node 的 tool call。
- `Solver` —— scripted composition，读取 evidence 并生成 final answer。
- Dependency resolution —— 类似 `#E1` 的 references 会被替换为更早的 worker outputs。

这个 demo 回答 “What is the population of the capital of France, rounded to millions?”，使用两步 plan：（1）查找 capital，（2）查找 population，然后求解。

运行它：

```
python3 code/main.py
```

trace 会先显示完整 plan，然后显示 worker results，最后显示 solver composition。将 token count（我们打印了粗略的 character count）与 ReAct-style 交错运行进行比较 —— 在这种结构化任务上 ReWOO 胜出。

## 使用它
LangGraph 将 Plan-and-Execute 作为 recipe 提供（`create_react_agent` 用于 ReAct，custom graphs 用于 plan-execute）。CrewAI 的 Flows 直接编码了该 pattern：你预先定义 tasks，然后 Flow DAG 执行它们。Plan-and-Act 的 synthetic data 方法目前仍主要属于研究；runtime pattern（显式 plan DAG）通过 LangGraph 和 CrewAI Flows 在 production 中提供。

## 交付它
`outputs/skill-rewoo-planner.md` 会在给定 tool catalog 的情况下，根据 user request 生成 ReWOO plan DAG。它会在交给 executor 之前验证 plan（acyclic、每个 reference 都已 resolved、每个 tool 都存在）。

## 练习
1. 对独立的 plan nodes 进行 parallel worker execution。在一个包含 2 个 parallel groups 的 6-node DAG 上，这能带来什么收益？
2. 添加一个 replanner node，当任何 worker 返回 error 时触发。让 ReWOO 变成 Plan-and-Execute 的最小改动是什么？
3. 用一个 small model（7B class）替换 `Planner`，并让 `Solver` 使用 frontier model。比较 end-to-end quality —— 这个拆分会在哪里失效？
4. 阅读 ReWOO 论文中关于 planner distillation 的 Section 4。从概念上复现 175B -> 7B 的结果：你需要什么 training data，以及如何评估 plan quality？
5. 将这个玩具实现移植到 Plan-and-Act 的 trajectory shape：plan 是 sequence，而不是 DAG。哪些 tradeoffs 会改变？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| ReWOO | “Reasoning without observations” | 先 plan，然后 parallel 获取 evidence，最后 solve —— planning prompt 中没有 observations |
| Plan-and-Execute | “LangChain's plan-execute pattern” | ReWOO 加上 execution 后可选的 replanner node |
| Plan-and-Act | “Scaled plan-execute” | 显式 planner/executor 拆分，并用 synthetic plan training data 支持 long-horizon tasks |
| Evidence reference | “#E1, #E2, ...” | plan-node placeholder，在 dispatch 时用先前的 worker output 替换 |
| Planner distillation | “Small planner, big executor” | 用 large teacher 的 planner traces 来 fine-tune small model |
| Token efficiency | “Fewer round trips” | 论文中在 HotpotQA 上相对 ReAct 减少 5x tokens |
| DAG executor | “Topological dispatcher” | 按 dependency order 运行 plan nodes；每一层可 parallel |

## 延伸阅读
- [Xu et al., ReWOO: Decoupling Reasoning from Observations (arXiv:2305.18323)](https://arxiv.org/abs/2305.18323) —— 经典论文
- [Erdogan et al., Plan-and-Act (arXiv:2503.09572)](https://arxiv.org/abs/2503.09572) —— 带 synthetic plans 的 scaled planner-executor
- [LangGraph Plan-and-Execute tutorial](https://docs.langchain.com/oss/python/langgraph/overview) —— framework recipe
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) —— 选择能工作的最简单 pattern
