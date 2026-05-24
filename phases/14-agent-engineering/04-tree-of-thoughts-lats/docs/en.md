# Tree of Thoughts 和 LATS：Deliberate Search

> 单条 chain-of-thought trajectory 没有回溯空间。ToT（Yao et al., 2023）将 reasoning 变成一棵树，并在每个 node 上进行 self-evaluation。LATS（Zhou et al., 2024）在 Monte Carlo Tree Search 下统一了 ToT、ReAct 和 Reflexion。Game of 24 从 4%（CoT）提升到 74%（ToT）；LATS 在 HumanEval 上达到 92.7% pass@1。

**类型：** Build
**语言：** Python (stdlib)
**先修：** Phase 14 · 01 (Agent Loop), Phase 14 · 03 (Reflexion)
**时间：** ~75 分钟

## 学习目标

- 将 reasoning 表述为 search：node 是“thought”，edge 是“expansion”，value 是“有多有希望”。
- 实现一个 stdlib ToT-style BFS tree search，并用 self-evaluation scoring。
- 扩展为一个 toy LATS MCTS loop，包含 select / expand / simulate / backpropagate。
- 判断什么时候 search 值得 Token 倍增成本（Game of 24、code generation），什么时候单条 trajectory 就足够（简单 Q&A）。

## 问题

Chain-of-thought 是线性行走。如果第一步错了，后续每一步都会建立在错误前提上。在 Game of 24（用四个数字和 + − × ÷ 得到 24）中，GPT-4 CoT 的准确率是 4%。model 很早就选错了 subexpression，并且无法恢复。

Reasoning 需要的是提出多个候选、评估它们、选择有希望的候选，并在出现 dead end 时回溯的能力。这就是 search。Tree of Thoughts 和 LATS 是两个 canonical formulation。

## 概念

### Tree of Thoughts (Yao et al., NeurIPS 2023)

每个 node 是一个连贯的中间步骤（“a thought”）。每个 node 可以 expand 为 K 个 child thought。LLM 使用 scoring prompt 对每个 node 进行 self-evaluate。Search 探索这棵树，可以是 BFS、DFS 或 beam。

```
                     (root: "find 24 from 4 6 4 1")
                    /               |            \
           ("6 - 4 = 2")    ("4 + 1 = 5")    ("4 * 6 = 24")  <- Score: HIGH
              /   \              |                  |
          ...    ...          ...                finish
```

Self-evaluation 是承重部分。论文展示了三种变体：`sure / likely / impossible` classification、`1..10` numeric score，以及 candidates 之间的 vote。这三种在 Game of 24 上都显著优于 CoT（GPT-4 从 4% -> 74%）。

### LATS (Zhou et al., ICML 2024)

LATS 在 MCTS 下统一了 ToT、ReAct 和 Reflexion。LLM 扮演三个角色：

- **Policy**：提出候选 next action（ReAct-style）。
- **Value function**：为 partial trajectory 打分（ToT-style self-eval）。
- **Self-reflector**：失败时写下自然语言 reflection（Reflexion-style），并用它重新播种未来 rollout。

Environment feedback（observation）会混入 value function，因此 search 会由真实 tool result 提供信息，而不只是 model opinion。论文发布时的结果：使用 GPT-4 的 HumanEval pass@1 为 92.7%（SOTA），使用 GPT-3.5 的 WebShop average 为 75.9（接近 gradient-based fine-tuning）。

### MCTS，最小形式

每次 iteration 有四个阶段：

1. **Select** — 使用 UCT（upper confidence bound for trees）从 root 走到 leaf。
2. **Expand** — 通过 policy 生成 K 个 child。
3. **Simulate** — 使用 policy 从 child rollout 到 leaf，并用 value function（或 environment reward）为 leaf 打分。
4. **Backpropagate** — 沿路径向上更新 visit count 和 value estimate。

UCT formula：`Q(s, a) + c * sqrt(ln N(s) / N(s, a))`。第一项是 exploitation；第二项是 exploration。按 task 调整 `c`。

### 成本现实

Search 会让 Token 爆炸。Game of 24 上的 ToT 使用的 Token 是 CoT 的 100–1000 倍。LATS 类似。这并不是免费的；应将 search 留给：

- 单条 trajectory 被证明不足的 task（Game of 24、复杂 code）。
- wall-clock 不如 correctness 重要的 task。
- 有便宜且可靠 value function 的 task（code 的 unit test、math 的 explicit target）。

如果你的 task 有单一正确答案且 evaluator 有噪声，search 往往会让事情更糟，因为它会找到“得分高”的错误答案。

### 2026 定位

大多数 production agent 不运行 LATS。它们运行带有 tool-grounded verification 的 ReAct（CRITIC，Lesson 05）。Search 出现在专门 niche 中：

- 将 test 作为 value function 的 coding agent（HumanEval-style）。
- 探索多条 query path 的 deep-research agent。
- LangGraph subgraph 内部 planning-heavy workflow。

AlphaEvolve（Lesson 11）是 2025 年的极端例子：对 code 进行 evolutionary search、machine-checkable fitness、frontier gain（56 年来第一次 4x4 matmul 改进）。

## 构建它

`code/main.py` 实现了：

- 一个在 stylized “pick arithmetic ops” task 上运行的 tiny ToT BFS。
- 一个在同一 task 上运行的 toy LATS MCTS loop（Select / Expand / Simulate / Backpropagate），使用 UCT selection。
- 一个组合 symbolic score 和 self-eval score 的 value function。

运行它：

```
python3 code/main.py
```

trace 会显示 ToT 用 BFS 每个 node expand 三个 candidate，并与 LATS 通过 MCTS 收敛到最佳 rollout 进行对比。两者的 Token count 都会打印出来。

## 使用它

LangGraph 将 ToT-style exploration 作为 subgraph pattern 提供；LangChain team 关于 LATS 的 blog（2024 年 5 月）是参考教程。LlamaIndex 提供 `TreeOfThoughts` agent。对大多数 2026 production agent 而言，这个 pattern 位于 `if task_complexity > threshold: use_search()` gate 后面——见 Lesson 05 中的 evaluator-optimizer pattern。

## 交付它

`outputs/skill-search-policy.md` 会根据 task shape、budget 和 evaluator fidelity，在 linear ReAct、ToT、LATS 和 evolutionary search 之间进行选择。

## 练习

1. 用 UCT c=0.1 和 c=2.0 运行 toy LATS。trace 中发生了什么变化？
2. 将 value function 换成噪声更大的 scorer（加入 random jitter）。MCTS 还能找到最佳 leaf 吗？它能容忍的最低 signal-to-noise 是多少？
3. 实现 beam-search ToT（每层保留 top-k）并与 BFS 对比。在紧张的 Token budget 下哪一个更好？
4. 阅读 LATS Section 5.1。复现 HumanEval trajectory count：需要多少 rollout 才能达到报告的 pass@1？
5. 阅读 LATS paper 中关于“when LATS helps less”的讨论。写一段 decision rule，将 task shape 映射到 search strategy。

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Tree of Thoughts | “Branching CoT” | Yao et al. — 带有 self-evaluation 的 thought node 树 |
| LATS | “MCTS for LLMs” | Zhou et al. — 在 MCTS 下统一 ToT + ReAct + Reflexion |
| UCT | “Upper confidence bound” | 在 exploitation (Q) 和 exploration (ln N / n) 之间平衡的 select formula |
| Value function | “这个 state 有多好” | Prompted LLM score 或 environment reward；反馈给 backprop |
| Policy | “Action proposer” | ReAct-style generator；发出候选 next thought/action |
| Rollout | “Simulated trajectory” | 使用 policy 从 node 走到 leaf，并用 value 打分 |
| Backpropagate | “更新 ancestors” | 将 leaf 的 reward 沿路径向上推，更新 visit count 和 Q |
| Search cost | “Token explosion” | Game of 24 上是 CoT 的 100-1000 倍；采用前先做 budget |

## 延伸阅读

- [Yao et al., Tree of Thoughts (arXiv:2305.10601)](https://arxiv.org/abs/2305.10601) — 经典论文
- [Zhou et al., LATS (arXiv:2310.04406)](https://arxiv.org/abs/2310.04406) — 带有 Reflexion feedback 的 MCTS
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — 用于 search 的 subgraph pattern
- [AlphaEvolve (arXiv:2506.13131)](https://arxiv.org/abs/2506.13131) — 带 programmatic evaluator 的 evolutionary search
