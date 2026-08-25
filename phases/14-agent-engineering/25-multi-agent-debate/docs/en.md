# Multi-Agent Debate 与协作

> Du et al.（ICML 2024，“Society of Minds”）运行 N 个模型实例，这些实例先独立提出答案，然后在 R 轮中彼此迭代 critique，以实现收敛。它能提升 factuality、rule-following 和 reasoning。Sparse topology 在 Token 成本上优于 full mesh。

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 12（Workflow Patterns），Phase 14 · 05（Self-Refine and CRITIC）
**Time:** ~60 分钟

## 学习目标
- 解释 debate protocol：N 个 proposers、R 轮，并收敛到一个共享答案。
- 描述为什么 debate 能提升 factuality、rule-following 和 reasoning。
- 解释 sparse topology：并不是每个 debater 都需要看到其他所有 debater。
- 在 scripted LLM 上实现一个 stdlib debate，包含 full-mesh 和 sparse 变体；衡量 Token 成本与 accuracy。

## 问题
Self-Refine（第 05 课）是一个模型 critique 自己，存在 groupthink 风险。CRITIC（第 05 课）把 critique grounding 到外部 tools 中，但这些 tools 并不总是可用。Debate 引入了第三种模式：多个实例、cross-critique，以及通过分歧实现收敛。

## 概念
### Society of Minds（Du et al., ICML 2024）

- N 个模型实例针对同一个问题独立提出答案。
- 在 R 轮中，每个模型读取其他模型的 proposals 并 critique 它们。
- 模型根据 critiques 更新自己的答案。
- R 轮之后，返回收敛后的答案。

原始实验出于成本考虑使用了 N=3、R=2。在困难问题上（MMLU、GSM8K、Chess Move Validity、biography generation），更多 agents 和更多轮次会提升 accuracy。

Cross-model 组合优于 single-model debates：ChatGPT + Bard 组合 > 任一单独模型。

### Sparse topology

“Improving Multi-Agent Debate with Sparse Communication Topology”（arXiv:2406.11776，2024-2025）表明，full-mesh debate 并不总是最优。Sparse topologies（star、ring、hub-and-spoke）可以用更低的 Token 成本达到相近 accuracy。每个 debater 只看到 peers 的一个子集。

影响：

- Full mesh N=5，R=3 = 5 × 3 = 15 个 proposals，每个都读取 4 个 peers = 60 次 critique ops。
- Star N=5，R=3（一个 hub + 4 个 spokes）= 15 个 proposals，spokes 只读取 hub = 12 次 critique ops。

### When debate helps

- **Factuality。** N 个独立 proposals，cross-check 降低 hallucination。
- **Rule-following。** Chess move validity 中，一个模型漏掉规则，其他模型会抓出来。
- **Open-ended reasoning。** 多种 framing 会逐步收窄到正确答案。

### When debate hurts

- **Latency-sensitive UX。** N × R 个串行轮次会产生你可能无法承受的 latency。
- **Cost-sensitive scale。** 每个问题需要 N × R Token。
- **Simple factual lookups。** 一次 lookup 比五场 debates 更便宜。

### 2026 practical instantiations

- **Anthropic orchestrator-workers**（第 12 课）—— 带 synthesis step 的一种 debate 变体。
- **LangGraph supervisor**（第 13 课）—— central router + specialist agents 可以把 debate 实现为一个 node。
- **OpenAI Agents SDK**（第 16 课）—— agents 通过 handoff 来回进行 iterative critique。
- **Multi-agent evals** —— 将 debate + evaluator-optimizer 配对，用于 eval signal。

### 这个模式容易出错的地方

- **Convergence collapse。** 所有 agents 都收敛到第一个错误答案。通过要求 disagreement rounds 来缓解。
- **Hub failure。** 在 star topology 中，一个糟糕的 hub 会污染所有人。轮换 hub 或使用多个 hubs。
- **Prompt homogenization。** 所有 agents 使用相同 prompt；它们会产生相同答案。使用多样化 prompts 和/或模型。

```figure
debate-converge
```

## 构建它
`code/main.py` 实现了 stdlib debate：

- `Debater` class（带有每个 debater opinion drift 的 scripted LLM）。
- `FullMeshDebate` 和 `SparseDebate` runners。
- 三个问题：一个 factual、一个 rule-based、一个 reasoning。
- Metrics：convergent answer、rounds to convergence、total critique ops。

运行：

```
python3 code/main.py
```

输出：每个 protocol 的 accuracy 和 cost；sparse 在 2/3 个问题上以更低成本匹配 full mesh。

## 使用它
- **Anthropic orchestrator-workers** 用于简单的 2-3-worker debates。
- **LangGraph** 用于带 checkpointing 的 stateful multi-round debate。
- **Custom** 用于研究或专门的 correctness guarantees。

## 交付它
`outputs/skill-debate.md` 搭建一个 multi-agent debate，具备可配置的 topology、N、R 和 convergence rule。

## 练习
1. 实现一个“forced disagreement”规则：在第 1 轮中，每个 debater 必须产生一个不同 proposal。衡量它对 convergence speed 的影响。
2. 添加 confidence-weighted aggregation：debaters 返回 (answer, confidence)；aggregator 按 confidence 加权。它有帮助吗？
3. 将一个“agent”替换为带有不同 opinions 的另一个 scripted LLM。Heterogeneity 是否提升 accuracy？
4. 在你的 3 个问题上衡量 full mesh 与 sparse 的 Token 成本。绘制 cost vs accuracy。
5. 阅读 Society of Minds paper。把你的 toy 移植到 N=5、R=3。什么会坏掉？什么会变好？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Debate | “Multi-agent critique” | N 个 proposers，R 轮 cross-critique，并收敛 |
| Full mesh | “Everyone reads everyone” | 每个 debater 每轮读取每个 peer |
| Sparse topology | “Limited peer view” | Debaters 只读取 peers 的一个子集 |
| Hub-and-spoke | “Star topology” | 一个 central debater，N-1 个 spokes 只读取 hub |
| Convergence | “Agreement” | Debaters 收敛到一个共享答案 |
| Society of Minds | “Du et al. debate paper” | ICML 2024 multi-agent debate method |

## 延伸阅读
- [Du et al., Society of Minds (arXiv:2305.14325)](https://arxiv.org/abs/2305.14325) — 经典 multi-agent debate
- [Sparse Communication Topology (arXiv:2406.11776)](https://arxiv.org/abs/2406.11776) — sparse topology 结果
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — orchestrator-workers 作为一种 debate 变体
- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) — single-model self-critique 对应方法
