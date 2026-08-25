# 使用 HTN 和 Evolutionary Search 进行规划

> Symbolic planning 处理 plan 可证明正确的场景。Evolutionary code search 处理 fitness function 可由机器检查的场景。ChatHTN (2025) 和 AlphaEvolve (2025) 展示了二者与 LLM 结合后分别能解锁什么能力。

**类型:** 构建
**语言:** Python (stdlib)
**先修要求:** Phase 14 · 02 (ReWOO and Plan-and-Execute)
**时间:** ~75 分钟

## 学习目标

- 解释 Hierarchical Task Networks：tasks、methods、operators、preconditions、effects。
- 描述 ChatHTN 的 hybrid loop — symbolic search 加 LLM fallback decomposition。
- 解释 AlphaEvolve 的 evolutionary loop，以及为什么它只适用于 programmatic evaluator。
- 使用 stdlib 实现一个玩具 HTN planner 和一个玩具 evolutionary search。

## 问题

ReWOO (Lesson 02)、Plan-and-Execute 和 ReAct 覆盖了大多数 agent planning。它们不太擅长覆盖两个场景：

1. **可证明正确的 plans。** Scheduling、flight pathing、compliance workflows — plan 必须在构造上就是 sound 的。一个流畅但偶尔 hallucinate 步骤的 LLM plan 是不可接受的。
2. **带有机器可检查 fitness function 的优化。** Matrix multiplication、scheduling heuristics、compiler passes — 目标不是“一个正确的 plan”，而是“最好的 plan”。

HTN planning 和 AlphaEvolve 解决的是两个不同问题。二者都把 LLM 用作放大器，而不是替代品。

## 概念

### Hierarchical Task Networks

HTN 包含：

- **Tasks** — compound（待 decomposed）和 primitive（可直接执行）。
- **Methods** — 将 compound task 分解为 subtasks 的方式，带有 preconditions。
- **Operators** — 带有 preconditions 和 effects 的 primitive actions。
- **State** — 一组 facts。

Planning：给定一个 goal task 和 initial state，找到一个分解，使其成为 preconditions 按顺序满足的 primitive operators。

HTN 早于 LLM 出现，并且仍然是可证明正确 plans 的参考方法。

### ChatHTN (Gopalakrishnan et al., 2025)

ChatHTN (arXiv:2505.11814) 将 symbolic HTN 与 LLM queries 交错执行：

1. 尝试用现有 methods 分解当前 compound task。
2. 如果没有 method 适用，就询问 LLM：“在 state `s` 中，你会如何分解 `task`？”
3. 将 LLM response 转换成 candidate subtasks。
4. 根据 operator schema 做验证；拒绝无效 decompositions。
5. 递归。

论文的核心主张：生成的每个 plan 都可证明 sound，因为 LLM suggestions 只作为 candidate decompositions 进入，永远不会直接编辑 plan。Symbolic layer 负责正确性；LLM 扩展 method library。

Online method learning（OpenReview `gwYEDY9j2x`，2025 follow-up）加入了一个 learner，通过 regression 泛化 LLM 生成的 decompositions — 最多可减少 75% 的 LLM query 频率。

### AlphaEvolve (Novikov et al., 2025)

AlphaEvolve (arXiv:2506.13131, DeepMind, June 2025) 是另一类东西：由 Gemini 2.0 Flash/Pro ensemble 编排的 evolutionary code search。

Loop：

1. 从 seed program + programmatic evaluator 开始（返回 fitness score）。
2. LLMs ensemble 提出 mutations。
3. 将 mutations 交给 evaluator 运行。
4. 保留最好的；继续 mutate。

已发表的成果：

- 56 年来首次改进 Strassen 的 4x4 complex matrix multiplication（48 次 scalar multiplications）。
- 通过 Borg scheduling heuristic 恢复 0.7% 的 Google compute。
- 在 frontier workload 上实现 32% 的 FlashAttention speedup。

硬性约束：fitness function 必须可由机器检查。对 prose answers 做 evolutionary search 不会收敛。

### 何时使用哪个

| 问题类别 | 使用 | 原因 |
|---------------|-----|-----|
| 带硬约束的 Scheduling | HTN + ChatHTN | 可证明的 soundness |
| Compiler optimization | AlphaEvolve | 机器可检查的 fitness |
| Multi-step task execution | ReAct / ReWOO | LLM in the loop，没有 formal guarantees |
| 带 tests 的 Code improvement | AlphaEvolve | Tests 就是 evaluator |
| Policy-bound automation | HTN | Preconditions 编码 policy |

### 这个模式哪里容易出错

- **没有 operators 的 HTN。** 没有 precondition/effect schemas，soundness 主张就会崩塌。ChatHTN 的“LLM suggests decomposition”要求 schema 能拒绝无效 moves。
- **没有真实 evaluator 的 AlphaEvolve。** “询问 LLM 代码是否更好”不是 fitness function。Evaluator 必须 deterministic 且 fast。
- **过度工程化。** 大多数 agent tasks 都不需要这两者。先考虑 ReAct 或 ReWOO。

```figure
htn-tree-expand
```

## 构建它

`code/main.py` 实现了两个玩具示例：

- 一个 stdlib HTN planner，包含 operators、methods、preconditions、effects，以及当没有 method 匹配 compound task 时触发的 `LLMFallback`。“LLM”是一个脚本化 decomposer，因此 planner 可离线运行。
- 一个针对 arithmetic programs 的 stdlib evolutionary search：增长 expressions，使其输出在 test set 上最小化 `|f(x) - target|`。Evaluator 是 deterministic 的。

运行：

```
python3 code/main.py
```

Trace 会展示 HTN planner 分解一个 compound task（中途带一次 LLM fallback），以及 evolutionary loop 收敛到一个 target expression。

## 使用它

- **HTN planners** — `pyhop`、`SHOP3`，或者为 domain-specific policy enforcement 构建自己的。
- **ChatHTN** — research code；这个模式（symbolic + LLM fallback）可以干净移植到任何 HTN planner。
- **AlphaEvolve** — DeepMind paper；这个模式（ensemble + evaluator）可复现。OpenEvolve 和类似开源 forks 正在出现。
- **Agent frameworks** — 目前还没有 first-class HTN 或 AlphaEvolve。把它构建成 subagent 或 background worker。

## 交付它

`outputs/skill-hybrid-planner.md` 生成一个 hybrid planner scaffold（HTN 或 evolutionary），并明确限定 LLM role。

## 练习

1. 用 backtracking 扩展 HTN planner：当某个 operator 的 postcondition 在 runtime 失败时，回滚并尝试下一个 method。
2. 给 ChatHTN 添加 LLM-method cache：当 LLM 在 state pattern `P` 中分解 task `T` 时，存储结果。下一次调用时先重新检查 method library。
3. 将 evolutionary search evaluator 替换为真实 test suite。Evolve 一个通过 20 个 test cases 的 sort function；报告收敛所需 generations。
4. 阅读 AlphaEvolve 的 evaluator design notes。为你关心的 domain 设计一个 evaluator（SQL query optimization、test-suite minimization、deployment YAML）。
5. 组合使用：用 HTN 将 compound task 分解为 subtasks，然后在每个 subtask 的 primitive operator 上使用 evolutionary search。它在哪里表现出色，在哪里属于过度工程化？

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| HTN | “Hierarchical planner” | 带有 operators、preconditions、effects 的 task decomposition |
| Method | “Decomposition rule” | 将 compound task 拆分为 subtasks 的方式 |
| Operator | “Primitive action” | 带有 precondition 和 effect 的具体步骤 |
| ChatHTN | “LLM + HTN” | 当没有 method 匹配时，symbolic planner 询问 LLM |
| AlphaEvolve | “Evolutionary code search” | Ensemble LLMs mutate code；deterministic evaluator 负责选择 |
| Fitness function | “Evaluator” | 针对 outputs 的 deterministic、机器可检查 score |
| Online method learning | “Cached LLM decomposition” | 存储并泛化 LLM plans，以降低 query cost |

## 延伸阅读

- [Gopalakrishnan et al., ChatHTN (arXiv:2505.11814)](https://arxiv.org/abs/2505.11814) — symbolic + LLM 混合 planner
- [Novikov et al., AlphaEvolve (arXiv:2506.13131)](https://arxiv.org/abs/2506.13131) — 带 LLM mutations 的 evolutionary code search
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — 何时选择 planner，何时选择 simple loop
