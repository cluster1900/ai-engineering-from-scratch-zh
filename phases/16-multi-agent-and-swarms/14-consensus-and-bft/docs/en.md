# 面向 Agents 的 Consensus 和 Byzantine Fault Tolerance

> 经典 distributed-systems BFT 遇上了随机性的 LLMs。2025-2026 年出现了三个研究方向：**CP-WBFT** (arXiv:2511.10400) 通过 confidence probe 为每次投票加权；**DecentLLMs** (arXiv:2507.14928) 采用无 leader 方式，并行 worker proposals 与 geometric-median aggregation；**WBFT** (arXiv:2505.05103) 将 weighted voting 与 Hierarchical Structure Clustering 结合，把节点拆分为 Core 和 Edge。来自 “Can AI Agents Agree?” (arXiv:2603.01213) 的诚实实证结果是：即使是标量 agreement，今天也很脆弱，一个 deceptive agent 就能破坏 Mixture-of-Agents。BFT 必要但不充分。本课构建一个最小 BFT protocol，注入三种 agent-specific attacks（byzantine lie、sycophantic conformity、correlated-error monoculture），并衡量每种 consensus variant 如何应对。

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**前置要求：** Phase 16 · 07 (Society of Mind and Debate), Phase 16 · 13 (Shared Memory)
**Time:** 约 75 分钟

## 问题

你有 N 个 LLM agents，每个都会产出一个答案。它们意见不一致。Majority vote 选择了错误答案，因为两个 agents 存在相关性（相同 base model、相同 training data、相同 failure modes）。第三个 agent 恰好以一种新的方式出错，所以多数派是一个 false majority。

现在加入一个 deceptive agent：它故意撒谎。或者加入一个 sycophantic agent：它同意最后发言的人。在经典 BFT 中，假设是 Byzantine nodes 占比为 `f < n/3`，且行为任意。2026 年的现实是：LLM nodes 即使诚实时也是随机的，会跨 models 相关，并受彼此 outputs 影响。你不能把它们当成独立的 Bernoulli voters。

经典 BFT（PBFT, 1999）并没有错，但它不完整。它处理任意 bit-flipping。它不处理“三个诚实 agents 因共享 training data 而共享同一个 hallucination”。本课从 PBFT 的基础开始，并叠加三种 2025-2026 年的适配。

## 概念
### 经典 BFT 给你什么

Practical Byzantine Fault Tolerance (Castro & Liskov, OSDI 1999) 可容忍 `f < n/3` 个 Byzantine nodes。该 protocol 有三个阶段（pre-prepare、prepare、commit）和两个 primitives（signed messages、quorum certificates）。它在 `n >= 3f + 1` 个诚实或恶意节点之间对单个值达成 agreement。

这些 guarantees 很强，但有如下假设：

1. **Independent faults。** Byzantines 不会协作。
2. **Honest nodes 确实诚实。** honest outputs 的正确性不是问题；protocol 只对齐 disagreement。
3. **问题存在 ground-truth answer。** 对错误事实达成 consensus 仍然是 consensus。

LLM agents 违反了这三点。两个运行相同 base model 的 agents 会共享 faults。一个“诚实”的 LLM 仍然会 hallucinate。对于模糊问题，“truth” 是 agents 决定的内容，并不存在外部 oracle。

### 三种 LLM-specific attacks

**Byzantine lie。** 一个 agent 输出故意错误的答案。如果 `f < n/3`，经典 BFT 能处理它。

**Sycophantic conformity。** 一个 agent 在投票前读取其他人的答案，并与最后发言的人保持一致。这不是恶意的，但会与最大声的声音相关。经典 BFT 无法防止这种情况，因为该 agent 会通过所有 signature check。

**Correlated-error monoculture。** 三个 agents 共享一个 base model。它们 hallucinate 出同一个错误答案。多数派是错的。经典 BFT 没有帮助，因为三个 agents 都“诚实地”同意了。

### 2025-2026 年的回应

**CP-WBFT** (arXiv:2511.10400) — Confidence-Probed Weighted BFT。每个 voter 给自己的答案附加一个 confidence probe（自报 probability，或单独 calibration model 的 prediction）。Vote weights 随 confidence 缩放。报告称在 complete graphs 上 BFT improvement 为 +85.71%。Mitigation 目标：sycophantic conformity（conforming agents 往往对其主动给出的位置 confidence 较低）。

**DecentLLMs** (arXiv:2507.14928) — 无 leader。Worker agents 并行提出 proposals，evaluator agents 为 proposals 打分，最终答案是 scored positions 的 geometric median。当 `f < n/2` 时具备 robust 性。Mitigation 目标：Byzantine lie 和 correlated errors（geometric median 对 outliers robust，并拉向密集 cluster，而不是 model-biased average）。

**WBFT** (arXiv:2505.05103) — Weighted BFT with Hierarchical Structure Clustering。Vote weights 由 response quality 加上从历史学习到的 trust score 分配。将 agents 聚类为 Core 和 Edge；Core agents 必须先达成 consensus，Edge agents 跟随。Mitigation 目标：scalability（Core consensus 小而快）以及部分应对 monoculture（Core 可按 diversity 选择）。

### 实证：“Can AI Agents Agree?” (arXiv:2603.01213)

这篇 paper 衡量多个 frontier models 上的 scalar agreement（LLM agents 对单个 numeric value 达成一致）。发现令人不适：

- 即使没有 adversaries，LLM agents 在许多 benchmarks 上对 scalar questions 的 disagreement rates 也超过 30%。
- 单个采用 deceptive persona 的 agent 可将 Mixture-of-Agents consensus 拉离 honest baseline 40+ percentage points。
- Disagreement rates 与 model diversity 相关；heterogeneous ensembles 比 homogeneous ensembles 分歧更多（好处：uncorrelated errors），但 drift 也更慢（坏处：time-to-agreement 更长）。

结论：BFT 给你对齐 outputs 的机制，但它不告诉你对齐后的 output 是否正确。要结合 verification（Phase 16 · 08 role specialization）、diversity（Phase 16 · 15 debate variants）和 evaluator agents（Phase 16 · 24 benchmarks）。

### 剥离到核心的 protocol

一个面向 LLM agents 的最小 BFT round：

```
1. task arrives; each agent i produces answer a_i
2. each agent attaches confidence probe c_i in [0, 1]
3. aggregator collects (a_i, c_i) from all n agents
4. aggregator groups by semantic cluster (equivalent answers)
5. aggregator computes weight for each cluster C:
     w(C) = sum_{i in C} c_i
6. winner = cluster with max weight, if max > threshold * sum(c_i)
   else: retry or escalate
7. minority clusters logged with provenance for post-hoc audit
```

semantic clustering 步骤是 LLM-specific 的关键变化。两个答案 “the study reports 4.2%” 和 “4.2% improvement” 属于同一 cluster。朴素的 string-equality check 会漏掉这一点。在生产中，使用便宜的 embedding model 或显式 canonicalization。

### Threshold tuning

`threshold` parameter 决定何时接受、何时重试。过低：你会接受弱多数。过高：你永远不会接受任何东西。经验范围：对 `n=5-7` 个 agents 为 0.5-0.67；更小的 `n` 需要更高阈值。低于阈值时，escalate 给 human 或另一个 agent ensemble。

### Consensus 无法提供帮助的地方

- **Ambiguous questions。** 如果问题没有 ground truth，consensus 就是一种 opinion。请这样标注。
- **Compound questions。** “Write code and explain it” 是两个答案。分别对每个答案投票。
- **Adversarial multi-round。** 如果 agents 能观察 prior rounds 并 mimic（Du 2023 debate），它们会开始彼此同意，而不管 truth。限制 rounds（通常 2-3 轮）。

## 构建它
`code/main.py` 实现：

- `AgentVoter` — 带有 (answer, confidence) 的 scripted policy。
- `MajorityVote` — 经典 plurality。
- `CPWBFT` — 带 semantic clustering 的 confidence-weighted voting。
- `DecentLLMs` — 在 scored proposals 上做 geometric-median aggregation。
- `Scenario` — 在三种 attack patterns 下运行每个 aggregator。

已实现的 attack patterns：

1. `byzantine`：一个 agent 以高 confidence 撒谎。
2. `sycophancy`：一个 agent 复制它看到的第一个 answer，并使用匹配的 confidence。
3. `monoculture`：三个 agents 共享一个 wrong answer（correlated error），confidence 中等。

运行：

```
python3 code/main.py
```

预期输出：一张 (attack, aggregator) -> final answer 的表，并高亮正确答案。Plurality 在 monoculture case 中失败。CPWBFT 的 confidence weighting 缓解 sycophancy。DecentLLMs 的 geometric-median 在 monoculture 少于总体一半时会拉向 honest cluster。

## 使用它
`outputs/skill-consensus-designer.md` 为 multi-agent ensemble 设计 consensus protocol：clustering method、weighting、threshold，以及 sub-threshold rounds 的 escalation policy。

## 交付它
在发布任何 consensus mechanism 之前：

- **至少用上面三种 patterns 做 attack-test。** 你的 protocol 应该可预测地失败，而不是静默失败。
- **记录每个 minority cluster** 及其 provenance。Minority clusters 是你发现 correlated errors 的 early-warning system。
- **强制 bounded rounds。** 不要“持续 debate 直到 agreement”，这会奖励 sycophancy。
- **将 agreement 与 correctness 分离。** Consensus output 交给 verifier；verifier 独立于 ensemble。
- **监控 agreement rate。** 急剧上升意味着 conformity bias；急剧下降意味着 model drift。

## 练习
1. 运行 `code/main.py`。确认 plurality 在 monoculture attack 下失败，但当 monoculture confidence 低于 0.7 时 CPWBFT 能部分缓解。
2. 添加第四种 attack pattern：**silent abstention**，一个 agent 拒绝回答（“I don't know”）。每个 aggregator 应如何处理 abstentions？实现你的选择。
3. 将 semantic clustering 从 string canonicalization 换成 embedding-similarity（使用任意 open-source embedding model）。sycophancy attack 会发生什么变化？
4. 阅读 CP-WBFT (arXiv:2511.10400)。实现 confidence-probe calibration 步骤（一个单独的 calibration model 检查每个 agent 自报的 confidence）。衡量 monoculture scenario 上的 accuracy gain。
5. 阅读 “Can AI Agents Agree?” (arXiv:2603.01213)。复现一个简化的 scalar-agreement experiment：三个 agents、一个 scalar question、deceptive-persona prompt。CPWBFT 或 DecentLLMs 能抓住它吗？

## 关键术语
| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| BFT | “Byzantine fault tolerance” | Castro-Liskov 1999 protocol，用于在 `f < n/3` arbitrary faults 下达成 consensus。 |
| Byzantine | “任何坏行为” | 一个可以撒谎、丢弃 messages、静默失败的节点，除了安全 crash 外什么都可能做。 |
| Confidence probe | “你有多确定？” | 附加到 vote 上的自报或 calibrator-predicted probability。 |
| Semantic clustering | “同一答案，不同表述” | 在 counting votes 之前对等价 answers 分组。 |
| Geometric median | “Robust center” | 最小化到 sample points 距离之和的点。与 mean 不同，它对 outliers robust。 |
| Monoculture | “相同 model，相同 failures” | agents 共享 training data 或 base model 时产生的 correlated errors。 |
| Sycophantic conformity | “同意最大声的声音” | agent 的 vote 偏向最先/最大声发言的人。 |
| Core/Edge | “Hierarchical BFT” | WBFT 拆分：小规模 Core 先 consensus，Edge nodes 跟随。限制 latency。 |

## 延伸阅读
- [Castro & Liskov — Practical Byzantine Fault Tolerance (OSDI 1999)](https://pmg.csail.mit.edu/papers/osdi99.pdf) — 基础
- [CP-WBFT — Confidence-Probe Weighted BFT](https://arxiv.org/abs/2511.10400) — 按 confidence 进行 vote weighting
- [DecentLLMs — leaderless multi-agent consensus](https://arxiv.org/abs/2507.14928) — geometric-median aggregation
- [WBFT — Weighted BFT with Hierarchical Structure Clustering](https://arxiv.org/abs/2505.05103) — 用于 bounded latency 的 Core/Edge split
- [Can AI Agents Agree?](https://arxiv.org/abs/2603.01213) — scalar-agreement fragility 和 deceptive-persona attack
