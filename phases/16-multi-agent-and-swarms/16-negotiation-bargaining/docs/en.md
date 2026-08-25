# 协商与议价

> Agent 会协商资源、价格、任务分配和条款。2026 年的 benchmark 集合已经很明确：NegotiationArena (arXiv:2402.05863) 显示，LLMs 可以通过 persona manipulation（“desperation”）将收益提升约 20%；"Measuring Bargaining Abilities" (arXiv:2402.15813) 显示，buyer 比 seller 更难，scale 并不能带来帮助；他们的 **OG-Narrator**（deterministic offer generator + LLM narrator）将成交率从 26.67% 提升到 88.88%；Large-Scale Autonomous Negotiation Competition (arXiv:2503.06416) 进行了约 180k 次协商，发现 **chain-of-thought-concealing** agents 通过向对手隐藏推理而获胜；Bhattacharya et al. 2025 基于 Harvard Negotiation Project 指标进行排名，Llama-3 最有效，Claude-3 进攻性最强，GPT-4 最公平。本课实现 Contract Net Protocol（FIPA 的前身，Lesson 02），连接一个 LLM 风格的 buyer/seller，运行 OG-Narrator 风格的分解，并衡量每一种结构选择如何改变成交率。

**类型：** 学习 + 构建
**语言：** Python (stdlib)
**前置要求：** Phase 16 · 02 (FIPA-ACL Heritage), Phase 16 · 09 (Parallel Swarm Networks)
**时间：** 约 75 分钟

## 问题

两个 agents 需要就价格达成一致。如果只依赖纯语言 prompt，2024-2026 年的 LLMs 在协商中的成交率低得惊人（在 arXiv:2402.15813 的严格参数化议价中约为 27%）。Scale 并不能修复这个问题：GPT-4 在议价结构上并不比 GPT-3.5 更好；它只是更擅长议价的*语言表达*。

根本问题在于，LLMs 混淆了两项工作：决定 offer 和叙述 offer。OG-Narrator 将两者分离：deterministic offer generator 计算数值移动；LLM 只负责叙述。成交率跃升到约 89%。

这映射了一个经典 multi-agent 发现：将机制层与通信层解耦会赢。Contract Net Protocol（FIPA, 1996; Smith, 1980）是任务市场机制的参考方案。把 LLM 插入叙述槽位，你就得到一个现代 LLM 驱动的任务市场。

## 概念

### 一段话理解 Contract Net

Smith 1980 年的 Contract Net Protocol：一个 **manager** 广播 **call for proposals (cfp)**；**bidders** 用包含其 offer 的 **propose** messages 响应；manager 选择获胜者，并向获胜者发送 **accept-proposal**，向失败者发送 **reject-proposal**。获胜者执行工作。可选 message：**refuse**（bidder 拒绝提出 proposal）。FIPA 将其规范为 `fipa-contract-net` interaction protocol。

### 为什么 OG-Narrator 会赢

"Measuring Bargaining Abilities of Language Models" (arXiv:2402.15813) 观察到：

- LLMs 经常破坏议价规则（给出荒谬价格的 offer，忽略对方的 ZOPA）。
- 它们的 anchoring 很差（接受糟糕的 first offer；counter-offer 使用象征性金额，而不是战略性金额）。
- 仅靠 scale 无法修复这些问题。更大的 models 会生成更可信的语言，但战略错误相似。

OG-Narrator 分解：

```
           ┌──────────────────┐        ┌──────────────────┐
  state  → │ offer generator  │ price → │  LLM narrator    │ → message
           │  (deterministic) │        │  (writes the     │
           │                  │        │   human-style    │
           └──────────────────┘        │   accompaniment) │
                                       └──────────────────┘
```

offer generator 是一种经典协商策略：Rubinstein bargaining model、Zeuthen strategy，或围绕价格的简单 tit-for-tat。LLM 负责叙述。message 包含 deterministic price 和自然语言 framing。

成交率提升是因为：
- 价格保持在 bargaining zone 内。
- Anchors 是战略性的，而不是情绪性的。
- LLM 做它擅长的事：写作。

### NegotiationArena 发现

arXiv:2402.05863 提供了规范 benchmark。核心发现：

- LLMs 可以通过采用 personas（“I am desperate to sell this by Friday”）将收益提升约 20%；persona manipulation 是一种真实策略。
- 公平/合作型 agents 会被对抗型 agents 利用；防御需要显式 counter-posturing。
- 对称配对在约 40% 的 benchmark scenarios 中收敛到不公平结果。

这不是“LLMs 是糟糕的协商者”。而是“LLMs 协商得太像人类，包括那些可被利用的部分”。

### Chain-of-thought 隐藏

Large-Scale Autonomous Negotiation Competition (arXiv:2503.06416) 在许多 LLM 策略上进行了约 180k 次协商。获胜者会向对手隐藏自己的推理：

- 如果一个 agent 在公开可见的 scratchpad 中输出“I will only go to $75; my reservation price is $70”，对手就会读到它。
- 获胜者私下计算策略；输出通道只包含 offer 和最低限度的必要叙述。

这是经典 game theory（Aumann 1976 关于 rationality 和 information）在 2026 年的回响：暴露你的 private valuation 会损失收益。LLMs 不会直觉理解这一点，并且会乐于把自己的 reservation 写进对手可见的 reasoning traces。

工程结论：将 private-scratchpad context 与 public-message context 分离。这不是可选项。

### Bhattacharya et al. 2025 — model 排名

基于 Harvard Negotiation Project 指标（principled negotiation、BATNA respect、interest reciprocity）：

- **Llama-3** 在达成交易方面最有效（deal rate + payoff）。
- **Claude-3** 是进攻性最强的协商者（高 anchors，晚 concession）。
- **GPT-4** 最公平（不同配对中的 payoff variance 最小）。

这是 2025 年的快照。重点不是哪个 model 在 2026 年 4 月获胜，而是不同 base models 具有持续存在的协商风格。Heterogeneous ensembles（Lesson 15）会把这一点作为 diversity source。

### 通过 Contract Net + LLM 进行任务分配

Contract Net 在 LLM multi-agent 中的现代复用：

1. Manager agent 将任务分解为单元。
2. 使用任务描述向 worker agents 广播 `cfp`。
3. 每个 worker 返回一个 offer：`(price, eta, confidence)`，其中 price 可以是 tokens、compute units 或 dollars。
4. Manager 选择获胜者（单个或多个，取决于任务）并授予任务。
5. 被拒绝的 workers 可以自由为其他任务出价。

这可以很好地扩展到 100 个以上的 workers，因为协调方式是 broadcast-and-respond，而不是 synchronous chat。生产中已有使用：Microsoft Agent Framework 的 orchestration patterns，以及一些 LangGraph implementations。

### LLM-Stakeholders Interactive Negotiation

NeurIPS 2024 (https://proceedings.neurips.cc/paper_files/paper/2024/file/984dd3db213db2d1454a163b65b84d08-Paper-Datasets_and_Benchmarks_Track.pdf) 引入了带有 **secret scores** 和 **minimum-acceptance thresholds** 的多方可评分博弈。每个 stakeholder 都有 private utilities；LLM 必须从 messages 中推断它们。这是从两方议价到 N 方 coalition formation 的泛化。它与具备异构 worker capabilities 的生产任务市场相关。

### narration-vs-mechanism 规则

在所有 2024-2026 年的协商 benchmarks 中，一致的工程规则是：

> 让 LLM 负责叙述。不要让 LLM 计算 offer。

如果 offer 需要是一个数字（price、ETA、quantity），就根据 negotiation state deterministic 生成它，并让 LLM 生成 framing。如果 offer 需要是一个 proposal structure（task decomposition、role assignment），可以让 LLM 起草，但在发送前要根据 schema 验证并进行 constraint-check。

```figure
a5-og-narrator
```

## 构建它

`code/main.py` 实现了：

- `ContractNetManager`, `ContractNetTask`, `Bid` — manager + bidders，广播 cfp，收集 proposals，授予任务。
- `og_narrator_bargain(state, rng)` — OG-Narrator buyer：面向 midpoint 的 deterministic Zeuthen-style concession。
- `seller_response(state, rng)` — deterministic seller counter-offer policy（两种风格的结构性 ground truth）。
- `naive_llm_bargain(state, rng)` — 模拟 all-LLM bargainer：以高 variance 选择价格，且经常落在 ZOPA 之外。
- Measurement：在 1000 次 trials 上衡量 deal rate，每次 trial 都重新采样 reservation prices。

运行：

```
python3 code/main.py
```

预期输出：naive-LLM deal rate 约 65-75%；OG-Narrator deal rate 约 85-95%；15-25 个百分点的差距就是将 offer-generation 与 narration 分解开来的结构优势。此外还会输出一个包含三个 bidders 和一个任务的 Contract Net task-market allocation 示例。

## 使用它

`outputs/skill-bargainer-designer.md` 设计了一个议价协议：谁生成 offers（deterministic 或 LLM）、谁负责叙述、private scratchpads 如何与 public messages 分离，以及如何监控 deal rate。

## 发布它

生产议价 checklist：

- **分离 scratchpad。** Private state 永远不能进入对手的 context。这不可协商。
- **Deterministic offer generation。** Prices、quantities、ETAs：计算，不要 prompt。
- **验证所有 incoming offers** 是否符合 schema。在 protocol boundary 拒绝 out-of-ZOPA offers。
- **限制 rounds。** 最多 3-5 轮；deadlock 时升级给 mediator。
- **持续衡量 deal rate 和 payoff variance。** deal rate 下降是一种症状，通常是 prompt drift 或 counterpart-side attack。
- **记录所有 rejected proposals** 及其 deterministic rationale。对于 Contract Net managers，失败 bidders 需要理解原因。

## 练习

1. 运行 `code/main.py`。确认 OG-Narrator 在 deal rate 上超过 naive-LLM。高出多少？
2. 实现 **persona-based payoff improvement** (arXiv:2402.05863) — buyer 只在 narration 中采用“desperate to buy this week”的 persona，offer generator 保持不变。deal rate 或 payoff 是否发生变化？
3. 实现 chain-of-thought **concealment**：维护一个不会传递给对手的 private scratchpad string。如果你意外泄露它会怎样（通过交换 channels 来模拟）？
4. 将 Contract Net 扩展为带 reserve price 的 N-bidder auction。当所有 bids 都超过 reserve 时，manager 如何在 lowest-price 和 highest-quality 之间做决定？你会选择哪种 award rule，为什么？
5. 阅读 Bhattacharya et al. 2025 关于 Harvard Negotiation Project 指标的内容。实现两个不同风格的 bargainers（aggressive vs fair）。衡量 symmetric 和 asymmetric pairings 下的 payoff variance。

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Contract Net | “任务市场” | Smith 1980，FIPA 1996。cfp + propose + accept/reject。规范任务市场。 |
| ZOPA | “Zone of possible agreement” | buyer 最高价与 seller 最低价之间的重叠区间。其外部的 offers 无法成交。 |
| BATNA | “Best alternative to a negotiated agreement” | 如果本次交易失败，你的后备方案。它设定你的 reservation price。 |
| OG-Narrator | “Offer generator + narrator” | 分解：deterministic offer，LLM narration。 |
| Zeuthen strategy | “Risk-minimizing concession” | 根据风险限制让步的经典 offer-generator。 |
| Rubinstein bargaining | “Alternating-offer equilibrium” | 带 discounting 的 infinite-horizon bargaining 的 game-theoretic model。 |
| CoT concealment | “隐藏你的推理” | arXiv:2503.06416 的获胜者保留 private scratchpads；public channel 只显示 offer。 |
| Persona manipulation | “情绪姿态” | arXiv:2402.05863：从 desperation/urgency personas 获得约 20% payoff gain。 |

## 延伸阅读

- [NegotiationArena](https://arxiv.org/abs/2402.05863) — benchmark；persona manipulation 和 exploitation 发现
- [Measuring Bargaining Abilities of Language Models](https://arxiv.org/abs/2402.15813) — OG-Narrator，以及 buyer-harder-than-seller 结果
- [Large-Scale Autonomous Negotiation Competition](https://arxiv.org/abs/2503.06416) — 约 180k 次协商；chain-of-thought concealment 获胜
- [LLM-Stakeholders Interactive Negotiation (NeurIPS 2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/984dd3db213db2d1454a163b65b84d08-Paper-Datasets_and_Benchmarks_Track.pdf) — 带 secret utilities 的多方可评分博弈
- [Smith 1980 — The Contract Net Protocol](https://ieeexplore.ieee.org/document/1675516) — 经典机制，IEEE Transactions on Computers
