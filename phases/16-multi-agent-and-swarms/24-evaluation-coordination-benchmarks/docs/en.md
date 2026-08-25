# 评估与协调 Benchmarks

> 2025-2026 年的五个 benchmarks 覆盖了 multi-agent 评估空间。**MultiAgentBench / MARBLE**（ACL 2025, arXiv:2503.01935）用 milestone KPIs 评估 star/chain/tree/graph 拓扑；**graph 最适合 research**，cognitive planning 增加约 3% 的 milestone achievement。**COMMA** 评估 Multimodal asymmetric-information coordination；包括 GPT-4o 在内的最先进模型很难超过 random baseline。**MedAgentBoard**（arXiv:2505.12371）覆盖四类医疗任务，并且经常发现 multi-agent 并不优于 single-LLM。**AgentArch**（arXiv:2509.10769）benchmark 结合 tool-use + memory + orchestration 的 enterprise agent architectures。**SWE-bench Pro**（[arXiv:2509.16941](https://arxiv.org/abs/2509.16941)）包含 41 个 repos 中的 1865 个问题，覆盖 business apps、B2B services 和 developer tools；frontier models 在 Pro 上约 23%，而在 Verified 上超过 70% —— 这是对 contamination 的现实检验。据报告，Claude Opus 4.7（2026 年 4 月）在 Pro 上达到 **64.3%**，并显式使用 agent-teams coordination（尚未发布 Anthropic primary source —— 先视为初步结果）；Verdent（agent scaffold）在 Verified 上达到 **76.1% pass@1**（[Verdent technical report](https://www.verdent.ai/blog/swe-bench-verified-technical-report)）。**AAAI 2026 Bridge Program WMAC**（https://multiagents.org/2026/）是 2026 年社区焦点。本课基于 MARBLE 的 metrics，运行 topology-vs-metric sweep，并固定“仅通过 SWE-bench Verified 不是 generalization 证据”这条规则。

**类型：** Learn
**语言：** Python (stdlib)
**先修：** Phase 16 · 15 (Voting and Debate Topology), Phase 16 · 23 (Failure Modes)
**时间：** 约 75 分钟

## 问题

当一篇论文声称“我们的 multi-agent system 更好”时，问题是：比什么更好、在哪些任务上更好、如何衡量？2023-2024 年的 multi-agent 评估很混乱 —— 每个人都选择自己的 metrics、自己的 baselines 和自己的任务集。2025-2026 年的 benchmarks 带来了结构。

没有共享 benchmarks，你无法有意义地比较两个 multi-agent systems。更糟的是，没有 hold-out benchmarks，frontier models 可能被污染。到 2025 年中，SWE-bench Verified 已部分进入训练语料而受到 contamination；frontier scores 膨胀；Pro 被设计成未污染的现实检验。

本课列举 2026 年五个 canonical benchmarks，说明每个 benchmark 衡量什么，并教你用怀疑态度阅读 benchmark claims。

## 概念

### MultiAgentBench (MARBLE) — ACL 2025

arXiv:2503.01935。在 research、coding 和 planning tasks 上评估四种 coordination topologies（star、chain、tree、graph）。基于 milestone 的 KPIs 跟踪部分进展，而不只看最终成功。

测量结果：

- **Graph** topology 最适合 research scenarios；支持 any-to-any critique。
- **Chain** 最适合 stepwise-refinement coding。
- **Star** 最适合 fast-factual consolidation。
- **Coordination tax** 在 graph 上超过约 4 个 agents 后出现。
- **Cognitive planning** 在各 topology 上增加约 3% 的 milestone achievement。

使用场景：你想对 coordination topologies 进行 apples-to-apples 比较。MARBLE repo（https://github.com/ulab-uiuc/MARBLE）提供 evaluator。

### COMMA — Multimodal 非对称信息

覆盖 agents 拥有不同 observation modalities、且必须在没有完整信息共享的情况下协调的任务。报告结果令人不适：包括 GPT-4o 在内的 frontier models 在 COMMA 的 agent-agent collaboration 上很难超过 **random baseline**。信号是：multi-agent modalities 训练不足、评估不足 —— LLMs 能较合理地处理 single-modality cooperation；multi-modality coordination 会崩溃。

使用场景：你的系统具有 Multimodal 或 asymmetric-information coordination。COMMA 的 null result 是一个警告：先衡量，再声称。

### MedAgentBoard — domain stress test

arXiv:2505.12371。四类医疗任务：diagnosis、treatment planning、report generation、patient communication。比较 multi-agent、single-LLM 和传统 rule-based systems。

发现：multi-agent 在大多数类别上并不优于 single-LLM。multi-agent 优势很窄 —— 当 subtasks 可以清晰分离时（diagnosis + treatment），task decomposition 有帮助；当 coordination overhead 超过 specialization gain 时（report generation），它会伤害效果。

使用场景：你的 domain 有明确的 single-LLM baselines。如果 MedAgentBoard 的经验可以 generalize，那么许多 proposed multi-agent systems 都是 over-engineered。

### AgentArch — enterprise architectures

arXiv:2509.10769。将 tool use、memory 和 orchestration 分层组合的 enterprise settings。Benchmark 隔离每一层的贡献：添加 tools 有多大帮助？添加 memory 呢？添加 multi-agent orchestration 呢？

使用场景：你正在设计 enterprise agent stack，并需要证明每一层的合理性。AgentArch 帮助避免购买那些你无法衡量其价值的功能。

### SWE-bench Pro — 现实检验

arXiv:2509.16941。41 个 repositories 中的 1865 个问题，覆盖 business apps、B2B services 和 developer tools。设计目标是相对于较晚训练截止时间保持**未污染**。Frontier models 在 Pro 上约 23%，而在 Verified 上超过 70%。这个差距就是 contamination signal。

2026 年 4 月分数：
- Claude Opus 4.7 on Pro: **64.3%**（报告称显式使用 agent-teams coordination；尚未发布 Anthropic primary source —— 先视为初步结果）。
- Verdent（agent scaffold）on Verified: **76.1% pass@1**（[technical report](https://www.verdent.ai/blog/swe-bench-verified-technical-report)）。
- 不使用 agent scaffolding 的 frontier raw scores on Pro: ~23-35%（[SWE-bench Pro paper](https://arxiv.org/abs/2509.16941)）。

要点：“我们击败了 SWE-bench Verified”不再是能力证据。Pro 是当前 gating test。Agent-team scaffolding 在 Pro 上产生可衡量收益（约 30-40 点 delta），这是 2026 年支持 multi-agent coordination 的最强 empirical arguments 之一。

### AAAI 2026 WMAC

AAAI 2026 Bridge Program — Workshop on Multi-Agent Coordination（https://multiagents.org/2026/）。这是 2026 年 multi-agent AI 研究的社区焦点。Accepted papers 和 workshop proceedings 是评估新方法的 canonical venue；做生产决策时，应优先参考 WMAC-accepted claims，而不是 arXiv preprints。

### 用怀疑态度阅读 benchmark claims — 2026 checklist

当有人声称一个 multi-agent result 时：

1. **哪个 benchmark，哪个 split？** SWE-bench Verified 与 Pro 差异很大。在错误 split 上报告的数字毫无价值。
2. **Contamination check。** Benchmark 是否在被测模型的 training cutoff 之后发布？如果不是，要谨慎对待。
3. **Baseline comparison。** 与 single-LLM baseline、random、prior multi-agent work 比较。不是“与同一系统的 untuned version 比较”。
4. **Statistical significance。** N trials、p-value、confidence interval。Frontier models variance 很高；single runs 会误导。
5. **Task diversity。** 一个任务还是多个？Generalization 对生产很重要。
6. **Cost disclosure。** Tokens per task、wall-clock。20x 成本的 90% solution 是业务决策，不是能力声明。

### 当前 benchmarks 都衡量不好的内容

- **Long-horizon coordination。** 持续数天的 wall-clock interaction。当前所有 benchmarks 都很短。
- **Adversarial resilience。** 当某个 agent 是恶意的或被攻陷时会发生什么？
- **Drift under deployment。** Benchmarks 是静态的；生产分布会变化。
- **Cost-normalized performance。** 大多数 benchmarks 报告 raw accuracy，而不是 accuracy-per-dollar。

为你真正关心的 axis 构建自己的 internal benchmark，通常是正确做法。

```figure
a5-bench-gap
```

## 构建它
`code/main.py` 是一个 non-interactive walk-through：

- 在 toy task 上模拟 3 个 multi-agent systems。
- 为每个系统计算 MARBLE-style milestone metrics。
- 通过从“training” set 中 withholding tasks 来运行 contamination check。
- 显式比较 random baseline。
- 打印 benchmark-claims scorecard。

运行：

```bash
python3 code/main.py
```

预期输出：system scorecard，包含 raw accuracy、milestone achievement、cost-per-task、vs-random baseline delta，以及 contamination-check note。

## 使用它
`outputs/skill-benchmark-reader.md` 读取任意 multi-agent benchmark claim，并应用 scrutiny checklist。输出：grade 和 caveats。

## 交付它
生产评估纪律：

- **构建 internal benchmark**，反映你实际的 production distribution。Public benchmarks 可以提供信息，但不能替代。
- **在每次比较中包含 random baseline。** 如果你在 coordination task 上无法大幅超过 random，那么任务可能定义不良。
- **同时报告 cost 和 accuracy。** Token cost 和 wall-clock。Ops teams 两者都需要。
- **每季度重建 benchmark。** Production distribution 会变化；陈旧 benchmarks 会误导。
- **避免 published-benchmark overfitting。** 如果你的团队专门优化 SWE-bench Pro 数字，你会在生产中回退。

## 练习

1. 运行 `code/main.py`。找出三个模拟系统中哪个具有最佳 cost-per-milestone。它是否与 raw-accuracy 最高的系统一致？
2. 阅读 MultiAgentBench（arXiv:2503.01935）。针对你自己的任务 domain，判断 MARBLE 会推荐四种 topologies 中的哪一种。根据论文结果说明理由。
3. 阅读 SWE-bench Pro paper。它具体如何抵抗 contamination？同样技术能否应用到你关心的其他 benchmarks？
4. 阅读 COMMA 关于 Multimodal coordination 的发现。设计一个可以加入 internal benchmark 的简单 Multimodal coordination task。什么可以算作有用信号？
5. 将 benchmark-claims checklist 应用于一篇近期 multi-agent paper 的 headline result。你会给这个 claim 什么 grade？

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| MARBLE | "MultiAgentBench" | ACL 2025；带 milestone KPIs 的 star/chain/tree/graph topologies。 |
| COMMA | "Multimodal benchmark" | Multimodal asymmetric-info coordination；frontier models 相比 random 表现吃力。 |
| MedAgentBoard | "Domain stress test" | 四个医疗类别；经常发现 multi-agent 并不优于 single-LLM。 |
| AgentArch | "Enterprise benchmark" | Tools + memory + orchestration 分层组合。 |
| SWE-bench Pro | "Contamination-resistant" | 1865 个问题、41 个 repos；在 Verified 上约 23% vs 70%+（contamination signal）。 |
| Milestone achievement | "Partial credit" | 奖励进展而不只奖励最终成功的 benchmarks。 |
| Contamination | "Benchmark leaked into training" | 发布后，benchmarks 进入训练语料；分数膨胀。 |
| WMAC | "AAAI 2026 Bridge Program" | Workshop on Multi-Agent Coordination；社区焦点。 |

## 延伸阅读

- [MultiAgentBench / MARBLE](https://arxiv.org/abs/2503.01935) — 带 milestone KPIs 的 topology benchmark
- [MARBLE repository](https://github.com/ulab-uiuc/MARBLE) — reference implementation
- [MedAgentBoard](https://arxiv.org/abs/2505.12371) — domain stress test；multi-agent 通常并不优于
- [AgentArch](https://arxiv.org/abs/2509.10769) — enterprise agent architectures
- [SWE-bench leaderboards](https://www.swebench.com/) — frontier models 的 Verified 和 Pro 分数
- [AAAI 2026 WMAC](https://multiagents.org/2026/) — 2026 年社区焦点
