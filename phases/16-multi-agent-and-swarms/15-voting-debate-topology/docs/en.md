# Voting、Self-Consistency 和 Debate Topology

> 最便宜的 aggregation：采样 N 个 independent agents，然后 majority-vote。Wang et al. 2022 的 self-consistency 用一个 model 采样 N 次来做这件事。Multi-agent 通过 **heterogeneous** agents 扩展它，以逃离 monoculture，不同 models、不同 prompts、不同 temperatures、不同 contexts。除了 majority vote，debate topology 也很重要：MultiAgentBench（arXiv:2503.01935, ACL 2025）评估了 star / chain / tree / graph coordination，发现 **graph 最适合 research**，并且超过约 4 个 agents 后会出现“coordination tax”。AgentVerse（ICLR 2024）记录了两种 emergent patterns，volunteer behaviors 和 conformity behaviors，而 conformity 既是一个特性（找到 consensus），也是一个风险（groupthink，Lesson 24）。本课会绘制 topology space，构建每种变体，并测量 coordination tax。

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：** Phase 16 · 07 (Society of Mind and Debate), Phase 16 · 14 (Consensus and BFT)
**Time:** ~75 minutes

## 问题
Debate 可以提升 accuracy（Du et al., arXiv:2305.14325）。它也可能降低 accuracy。debate 是否有帮助，取决于四个 structural choices：

1. 谁和谁对话（topology）。
2. 多少 rounds（Du 2023：rounds 和 agents 都各自独立重要）。
3. agents 是否 heterogeneous（不同 base models 打破 monoculture）。
4. 是否存在 adversarial voice（steel-manning vs. straw-manning）。

把“run 5 agents and vote”硬接到任务上的团队，常常比 single agent 更差。失败不是随机的。它们跟 topology 和 heterogeneity 相关。本课是 topology map。

## 概念
### Self-consistency，single-model baseline

Wang et al. 2022（“Self-Consistency Improves Chain of Thought Reasoning”）在 temperature > 0 时对同一个 model 采样 N 次，并对 reasoning-path answers 做 majority-voted。GSM8K 上的结果是：N=40 samples 相比 single greedy decode 有显著提升。Self-consistency 是 multi-agent voting 的 single-agent 前身。

限制：self-consistency 使用一个 base model。errors 在结构上就是 correlated 的。如果 model 有 systematic bias，所有 N 个 samples 都会共享它。

### Multi-agent vote，heterogeneous extension

用 N 个*不同* agents 替代 N 个 samples。不同 base models（Claude、GPT、Llama）、不同 prompts、不同 tool access。收益：uncorrelated errors。成本：不同 agents 的成本不同；协调它们会增加 overhead。

heterogeneous debate 在 2026 年的 canonical 名称是 **A-HMAD**，即 Adversarial Heterogeneous Multi-Agent Debate。这个名称尚未被普遍采用，但论文会用它表示“different models debate, which reduces correlated errors from monoculture collapse”。

### 四种 topologies

```
star                chain               tree                graph

    ┌─A─┐           A─B─C─D         ┌──A──┐              A───B
    │   │                           │     │              │ × │
    B   C                           B     C              D───C
    │   │                          / \   / \
    D   E                         D   E F   G           (fully connected)
```

Star：一个 hub，所有其他 agents 只和 hub 对话。等价于没有 back-channel 的 supervisor-worker。
Chain：线性结构，每个 agent 看到前一个 agent 的输出。类似 pipeline。
Tree：层级结构，由 hierarchical agent systems 使用（Lesson 06）。
Graph：any-to-any。包括 fully-connected clique 和任意 DAGs。

### Coordination tax（MultiAgentBench）

MultiAgentBench（MARBLE, ACL 2025, arXiv:2503.01935）在一个包含 research、coding 和 planning 的 task suite 上 benchmark 了 star、chain、tree、graph。关键 measured results：

- **Graph** topology 在 research tasks 上获胜。信息 any-to-any 流动；agents 可以互相 critique。
- **Star** 在 fast-answer factual tasks 上获胜。Hub 负责 filter 和 consolidate。
- **Chain** 在 stepwise pipelines（staged refinement）上获胜。
- **Coordination tax** 在 graph topology 中超过约 4 个 agents 后出现。Wall-clock 和 Token cost 的增长快于 quality。

4-agent ceiling 是 empirical 的，不是 fundamental 的。它反映了 2026 年 LLM context capacity：每个 agent 的 context 被 peers 的 outputs 填满；一旦每个人都能看到所有人，添加 agent N+1 的 marginal value 就会下降。

### Multi-Agent Debate Strategies（“Should we be going MAD?”）

arXiv:2311.17371 是 2023 年的 MAD strategies survey。被其他研究复现的关键发现：与 self-consistency 结构相似的 MAD variants（independent sampling + aggregation），在相同 budget 下通常不如 self-consistency。只有当 agents 真正 heterogeneous，且 debate 具备 adversarial structure（一个 agent 反向论证）时，MAD 的帮助最大。

### AgentVerse emergent patterns

AgentVerse（ICLR 2024, https://proceedings.iclr.cc/paper_files/paper/2024/file/578e65cdee35d00c708d4c64bce32971-Paper-Conference.pdf）记录了 multi-agent debate 中即使没有显式设计也会 emergence 的两种 behaviors：

- **Volunteer。** agent 主动提供帮助（“I can take the next step”）。有用之处：它把工作分配给最适合某个 subtask 的 agent。
- **Conformity。** agent 调整自己的立场以匹配 critic，即使 critic 是错的。这是 debate 版本的 sycophancy（Lesson 14）。

Conformity 解释了为什么 debate-until-agreement 会奖励 bullies。Bounded rounds 加上独立 judge 可以缓解。

### Heterogeneity：真正推动 accuracy 的旋钮

2024-2026 年 practical literature 中的一个模式：把 N 个 agents 中的一个换成不同 base model，带来的 accuracy 提升通常大于把 N 增加 1。直觉是 monoculture，每一个新的 independent-error source 都比额外的 correlated sample 更有价值。

在极限情况下，heterogeneity 胜过 numerosity。在大多数有清晰 ground truth 的任务上，三个不同 models 胜过一个 model 的五份 copies。

### Jury methods

Sibyl framework（在 Minsky-LLM literature 中被引用）形式化了一个“jury”，即一小组 specialized agents，在每个 stage 通过 voting 来 refine answers。不同于普通 majority vote，jury 有 roles：一个 agent cross-examines，一个提供 context，一个给 plausibility 打分。Jury methods 介于 plain vote（便宜、容易 monoculture）和 full MAD（昂贵、容易 conformity）之间。

### When vote-with-debate dominates

- 问题有 ground truth（fact、math、code behavior）。Vote convergence 是有意义的。
- Agents 可以访问不同 sources 或 tools（heterogeneity 可用）。
- Rounds 有上限（通常 2-3），并且有独立 judge 或 verifier。
- Budget 允许 3-5 个 agents。在 graph topology 上超过 5-7 个 agents 后，coordination tax 会占主导。

### When vote-with-debate hurts

- 问题呈 opinion-shaped。Agents 会收敛到看起来最 confident 的答案，而不是最正确的答案。
- 所有 agents 共享一个 base model。Monoculture 让 consensus 失去意义。
- Rounds 无上限。Conformity 每次都会赢。
- 任务很简单。使用 N=5 self-consistency 的 single agent 更便宜，accuracy 也差不多。

## 构建它
`code/main.py` 实现：

- `run_star(agents, hub, question)` — hub 轮询每个 worker 并 aggregate。
- `run_chain(agents, question)` — sequential refinement。
- `run_tree(root, children, question)` — depth-2 aggregation 的 hierarchical 结构。
- `run_graph(agents, question, rounds)` — all-to-all debate，bounded rounds。
- 一个脚本化的 heterogeneity dial：每个 agent 都有一个 `error_bias`，表示其 systematic wrongness。
- 一个 measurement harness，在 N=3、5、7 下运行每种 topology，并报告（accuracy、total_tokens、wallclock_simulated）。

运行：

```
python3 code/main.py
```

预期输出：一张 topology × N →（accuracy、tokens、latency）的表。Graph 在 N=3-5 的 research-style tasks 上获胜；star 在 fast-factual tasks 上获胜；N=7 的 graph 展示 coordination tax（latency 的膨胀速度快于 accuracy）。

## 使用它
`outputs/skill-topology-picker.md` 是一个 skill，它读取 task description，并推荐 topology（star / chain / tree / graph）、N（agents 数量）、heterogeneity profile（要使用的 base models）和 round bound。

## 交付它
对于任何 ensemble：

- 从使用一个强 base model 的 **self-consistency at N=5** 开始。它是便宜的 baseline。
- 如果 accuracy 很重要，升级到 **heterogeneous voting at N=3**。测量 delta。
- 只有当任务有结构（research、multi-step）且 bounded rounds 可行时，才升级到 **debate topology**。
- 始终记录 minority cluster。当 minority 持续正确时，你就有了 diversity signal。
- 在 accuracy 旁边同时 benchmark wall-clock 和 tokens。“10x 成本换来更高 accuracy”是一个 business decision。

## 练习
1. 运行 `code/main.py`。绘制 graph topology 的 coordination-tax curve：accuracy vs N、tokens vs N。曲线在什么 N 处 inflect？
2. 实现 A-HMAD：三个带有刻意不同 biases 的 agents。在 Lesson 14 的 monoculture attack 上，all-same-bias baseline 与 A-HMAD 相比如何？
3. 给 graph topology 添加一个“judge”role，它不 vote，只对 final consensus 打分。这会改变 emergent conformity behavior 吗？
4. 阅读 AgentVerse paper（ICLR 2024）。识别你的实现最强烈展现的是哪种 emergent behavior。你能通过 prompt change 引出相反的 behavior 吗？
5. 阅读 MultiAgentBench（arXiv:2503.01935）Section 4（topology experiments）。用你的 harness 在论文中的一个任务上复现“graph-wins-research”结果。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Self-consistency | “Sample N times, vote” | Wang 2022。Single model，N 个 temperature>0 samples，对 reasoning paths 做 majority vote。 |
| Heterogeneity | “Different models” | 由不同 base models 或 prompt families 组成的 ensemble。打破 monoculture。 |
| MAD | “Multi-agent debate” | agents 在多个 rounds 中交换 critiques 的通用术语。见 Du 2023。 |
| A-HMAD | “Adversarial Heterogeneous MAD” | 强调不同 models + adversarial structure 的 MAD variant。 |
| Topology | “Who talks to whom” | Star、chain、tree、graph。决定 information flow。 |
| Coordination tax | “Diminishing returns” | 在 graph 上超过约 4 个 agents 后，cost 增长快于 quality。 |
| Volunteer behavior | “Unprompted help” | AgentVerse emergent pattern：agent 主动提出承担一个 step。 |
| Conformity behavior | “Agreement under pressure” | AgentVerse emergent pattern：agent 与 critic 对齐。 |
| Jury | “Small specialized panel” | 带 roles（examiner、context、scorer）的 Sibyl-style ensemble。 |

## 延伸阅读
- [Wang et al. — Self-Consistency Improves Chain of Thought Reasoning](https://arxiv.org/abs/2203.11171) — single-model baseline
- [Du et al. — Improving Factuality and Reasoning via Multiagent Debate](https://arxiv.org/abs/2305.14325) — agents 和 rounds 都各自独立重要
- [MultiAgentBench / MARBLE](https://arxiv.org/abs/2503.01935) — topology benchmark，显示 graph 最适合 research，chain 适合 pipelines
- [Should we be going MAD?](https://arxiv.org/abs/2311.17371) — MAD-strategy survey；发现同等 budget 下 MAD 通常输给 self-consistency
- [AgentVerse (ICLR 2024)](https://proceedings.iclr.cc/paper_files/paper/2024/file/578e65cdee35d00c708d4c64bce32971-Paper-Conference.pdf) — volunteer 和 conformity emergent patterns
- [MARBLE repo](https://github.com/ulab-uiuc/MARBLE) — reference benchmark implementation
