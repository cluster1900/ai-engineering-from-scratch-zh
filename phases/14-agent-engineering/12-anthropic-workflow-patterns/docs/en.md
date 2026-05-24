# Anthropic 的 Workflow Patterns：简单优于复杂

> Schluntz 和 Zhang（Anthropic，2024 年 12 月）区分了 workflows（预定义路径）和 agents（动态工具使用）。五种 workflow patterns 覆盖大多数情况。从直接 API calls 开始。只有当步骤无法预测时，才添加 agents。

**类型：** 学习 + 构建
**语言：** Python (stdlib)
**先修要求：** Phase 14 · 01 (Agent Loop)
**时间：** 约 60 分钟

## 学习目标

- 说出 Anthropic 的五种 workflow patterns：prompt chaining、routing、parallelization、orchestrator-workers、evaluator-optimizer。
- 解释 agent-vs-workflow 的区别，以及各自的工程成本。
- 识别何时选择 workflow 而不是 agent（反之亦然）。
- 使用 stdlib 针对 scripted LLM 实现全部五种 patterns。

## 问题

团队常常为本该用一次函数调用解决的问题引入 multi-agent frameworks。成本是真实存在的：frameworks 会增加层级，遮蔽 prompts，隐藏 control flow，并诱发过早复杂化。Schluntz 和 Zhang 在 2024 年 12 月发布的文章，是行业内被引用最多的反向意见：从简单开始，只有当复杂性值得其成本时才添加复杂性。

## 概念

### Workflows vs agents

- **Workflow。** 通过预定义代码路径编排的 LLMs 和 tools。Engineers 拥有 graph。
- **Agent。** LLMs 动态指挥自己的 tools 并采取自己的步骤。Model 拥有 graph。

两者都有适用场景。Workflows 更便宜、更快，也更容易 debug。Agents 能解锁开放式问题，但会让 failure modes 更难推理。

### Augmented LLM

五种 patterns 的基础：一个 LLM 接入三种能力 — search（retrieval）、tools（actions）、memory（persistence）。任何 API call 都可以使用这些能力。

### 五种 patterns

1. **Prompt chaining。** call 1 的输出作为 call 2 的输入。适用于任务具有清晰线性 decomposition 的情况。步骤之间可以添加可选的 programmatic gates。

2. **Routing。** classifier LLM 选择要调用的 downstream LLM 或 tool。适用于类别明显不同的输入需要不同处理方式的情况（tier-1 support vs refund vs bug vs sales）。

3. **Parallelization。** 并发运行 N 个 LLM calls，聚合结果。两种形态：sectioning（不同 chunks）和 voting（相同 prompt，运行 N 次，majority/synthesis）。

4. **Orchestrator-workers。** orchestrator LLM 动态决定运行哪些 workers（同样是 LLMs），并综合它们的输出。类似 agent loops，但 orchestrator 不会无限循环。

5. **Evaluator-optimizer。** 一个 LLM 提出答案，另一个 LLM 评估它。迭代直到 evaluator 通过。这是 Self-Refine（Lesson 05）的泛化。

### Workflows 胜过 agents 的地方

- **可预测任务。** 如果你能枚举步骤，就应该枚举。
- **受成本约束的任务。** Workflows 有有界的步骤数；agents 可能失控膨胀。
- **受合规约束的任务。** Auditors 希望阅读 graph，而不是从 trajectories 中推断它。

### Agents 胜过 workflows 的地方

- **开放式研究。** 当下一步取决于上一步返回的内容时。
- **可变长度任务。** 需要数分钟到数小时、步骤数未知的工作。
- **新领域。** 当你还不知道正确 workflow 时 — 先探索，之后再 codify。

### Context-engineering 配套内容

"Effective context engineering for AI agents"（Anthropic 2025）形式化了相邻的学科：200k window 是预算，不是容器。该包含什么，何时 compact，何时让 context 增长。本课程在 Phase 14 的 context compression 课程中详细覆盖（在重新编号前是本课程体系中 Phase 14 更早的 lesson 06）。

## 构建它

`code/main.py` 针对 `ScriptedLLM` 实现了全部五种 workflow patterns：

- `prompt_chain(input, steps)` — 顺序执行。
- `route(input, classifier, handlers)` — classification + dispatch。
- `parallel_vote(prompt, n, aggregator)` — 运行 N 次并聚合。
- `orchestrator_workers(task, workers)` — orchestrator 选择 workers。
- `evaluator_optimizer(task, proposer, evaluator, max_iter)` — 循环直到通过。

运行：

```
python3 code/main.py
```

每种 pattern 都会打印自己的 trace。每种 pattern 的总代码行数约为 10-15 行；framework 的成本通常以数千行来衡量。

## 使用它

- 大多数任务使用直接 API calls。
- 只有当 pattern 真正需要 durable state（LangGraph）、actor-model concurrency（AutoGen v0.4）或 role templating（CrewAI）时才使用 framework。
- 当你想要 Claude Code harness 形态、但不想重新构建时，选择 Claude Agent SDK。

## 交付它

`outputs/skill-workflow-picker.md` 会为给定任务描述选择正确的 pattern，包括 decision rationale，以及当 workflows 不足时重构为 agent 的路径。

## 练习

1. 用 confidence threshold 实现 routing。低于 threshold -> 升级给 human。对于 tier-1 support 用例，这个 threshold 应该落在哪里？
2. 给 `parallel_vote` 添加 timeout。当某个 call hang 住时会发生什么？你如何在缺少 votes 的情况下聚合？
3. 把 `evaluator_optimizer` 改成 bandit：跨 iterations 保留 top-2 outputs，这样晚出现的好结果不会被晚出现的坏结果覆盖。
4. 将 prompt chaining 与 routing 结合：router 选择三条 chains 中的一条。衡量 Token 成本，并与单个 big-prompt 替代方案比较。
5. 选择你的一个 production feature。画出 workflow graph。统计步骤数。这里 agent 真的会更好吗？

## 关键术语

| 术语 | 人们常说什么 | 它实际意味着什么 |
|------|----------------|------------------------|
| Workflow | "预定义 flow" | Engineer 拥有的 LLM 和 tool calls graph |
| Agent | "Autonomous AI" | Model 拥有的 graph；动态 tool direction |
| Augmented LLM | "带 tools 的 LLM" | LLM + search + tools + memory；原子单元 |
| Prompt chaining | "顺序 calls" | call N 的输出是 call N+1 的输入 |
| Routing | "Classifier dispatch" | 选择由哪条 chain/model 处理输入 |
| Parallelization | "Fan out" | N 个并发 calls；通过 sectioning 或 voting 聚合 |
| Orchestrator-workers | "Dispatcher agent" | Orchestrator LLM 动态选择 specialist LLMs |
| Evaluator-optimizer | "Proposer + judge" | 迭代直到 evaluator 通过；Self-Refine 的泛化 |

## 延伸阅读

- [Anthropic, Building Effective Agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) — 五种 workflow patterns
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — 配套方法
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — stateful graphs 何时值得其成本
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) — 产品化的 orchestrator-workers pattern
