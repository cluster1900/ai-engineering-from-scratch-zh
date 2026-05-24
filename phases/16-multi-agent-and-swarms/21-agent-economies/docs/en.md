# Agent 经济、Token 激励、声誉

> 长周期 autonomous agents（METR 的 1 小时到 8 小时工作曲线）需要经济代理能力。新兴的 **5-layer stack** 是：**DePIN**（physical compute）→ **Identity**（W3C DIDs + 声誉资本）→ **Cognition**（RAG + MCP）→ **Settlement**（account abstraction）→ **Governance**（Agentic DAOs）。生产级 agent-incentive 网络包括 **Bittensor**（TAO subnets 奖励 task-specific models）、**Fetch.ai / ASI Alliance**（ASI-1 Mini LLM + FET token）和 **Gonka**（基于 transformer 的 PoW，将 compute 重新分配到有生产价值的 AI 任务）。学术工作：AAMAS 2025 的去中心化 LaMAS 使用 **Shapley-value credit attribution** 来公平奖励有贡献的 agents；Google Research 的 “Mechanism design for large language models” 提出在 monotone aggregation 下采用 second-price payment 的 **token auctions**。本课会构建一个最小 agent marketplace，将 Shapley-value credit attribution 应用于 multi-agent pipeline，并运行一个 second-price token auction，让 game-theory 机制具体落地。

**Type:** Learn
**Languages:** Python (stdlib)
**前置要求：** Phase 16 · 16（Negotiation and Bargaining），Phase 16 · 09（Parallel Swarm Networks）
**Time:** ~75 分钟

## 问题
当 agents 共同创造价值、但又需要被分别奖励时，Multi-agent systems 会变得复杂。经典机制，比如平均分配、最后贡献者拿走全部，要么不公平，要么容易被操纵。通过 Shapley values 进行基于联盟的奖励，在构造上是公平的，但计算成本很高。2025-2026 年的文献推动了实用近似：Shapley sampling、monotone aggregation auctions，以及从已确认贡献中累积的 on-chain reputation。

除了 credit attribution，这个领域已经转向真正的经济 agents：Bittensor TAO 奖励 mining compute，以 fine-tune subnet-specific models；Fetch.ai/ASI 用 FET tokens 奖励 ASI-1 Mini LLM 使用；Gonka 将 transformer proof-of-work 重新分配到有生产价值的 AI 任务上。能够自主交易的 agents 今天已经存在；问题是如何对齐激励。

本课把 agent economies 视为一个具体问题族：credit attribution、mechanism design 和 reputation，并用最小数学构建每一部分，让概念真正留下来。

## 概念
### 5-layer agent-economy stack

1. **DePIN（physical compute）。** 去中心化基础设施，用于租用 GPU、存储、带宽。Bittensor subnets、Render Network、Akash。它不专属于 agents；agents 使用它。
2. **Identity。** W3C Decentralized Identifiers（DIDs）给每个 agent 一个不依赖任何平台的持久 ID。声誉累积到 DID 上。Agent Network Protocol（ANP）使用 DID 作为 discovery layer。
3. **Cognition。** agent 的 reasoning loop：LLM + RAG + MCP。这是其他 phases 构建的内容。
4. **Settlement。** Account abstraction（ERC-4337）让 agents 可以从自己的余额支付 gas，而不必持有 ETH。Agents 可以为服务、彼此或 compute 付费。
5. **Governance。** Agentic DAOs：由人类和 agents 一起对 protocol changes 投票的治理结构，投票权与声誉绑定。

不是每个生产系统都会使用全部五层。Bittensor 使用第 1、2 层，部分使用第 3、4 层，不使用第 5 层。OpenAI agents 除第 3 层外都不使用。这个 stack 是参考地图，不是必需条件。

### Bittensor、Fetch.ai、Gonka：实际运行的东西

**Bittensor（TAO）。** Subnets 是专门任务（language modeling、image generation、forecasting）。Miners 提交 model outputs。Validators 对它们排序；stake-weighted scoring 分配 TAO rewards。每个 subnet 都有自己的评估方式。经济学教训：为 task-specific output quality 付费，而不是为使用的 compute 付费。

**Fetch.ai / ASI Alliance。** ASI-1 Mini LLM 运行在 Fetch.ai 的网络上；用户用 FET tokens 支付 inference 费用。这里 agents-as-peers 的叙事更强：Fetch 上的一个 agent 可以调用另一个 agent 完成任务，并用 FET 付款。

**Gonka。** Transformer proof-of-work：“work” 是 transformer 的 forward passes。Miners 通过运行具有已知正确输出（来自 training data）的 inference tasks 来获利。它是 resource-productive PoW，而不是基于 hash 的 PoW。

截至 2026 年 4 月，这三者都是 production-grade。回报分配方式不同。Bittensor 根据 subnet validators 的相对质量奖励；Fetch 根据付费用户衡量的 utility 奖励；Gonka 奖励可验证的 inference work。

### Shapley-value credit attribution

三个 agents 协作完成一个任务。输出得分 0.8。谁贡献了多少？

Shapley value：满足四个公理（efficiency、symmetry、linearity、null）的唯一 credit allocation。对于 agent `i`：

```
shapley(i) = (1/N!) * sum over all orderings O of (v(S_i_O ∪ {i}) - v(S_i_O))
```

其中 `S_i_O` 是排序 `O` 中位于 `i` 之前的 agents 集合。实践中：枚举所有 permutations，记录每个 agent 在每个 permutation 中的 marginal contribution，然后取平均。

对于 N=3 个 agents，有 6 个 permutations。对于 N=10，有 3.6M 个，所以实践中会对 orderings 采样，而不是枚举。

### 用于 aggregation 的 second-price auction

Google Research（“Mechanism design for large language models”）提出用 second-price token auctions 来聚合 LLM outputs。设置：N 个 agents 各自提出一个 completion；每个 agent 对被选中都有一个 private value。auctioneer 选择最高价值的 proposal，并支付 *第二高* 的 value。在 monotone aggregation 下（value 取决于哪个 proposal 被选中，而不是有多少 bid），这是真实的，agents 会报出自己的真实 value。

这对 LLM systems 很重要：你可以把 completion tasks 外包给多个价格不同的 agents；auction 选择最佳方案并公平付款，agents 没有误报的激励。

### Reputation capital

绑定 DID 的 reputation score 从已确认贡献中累积。一个简单更新规则：

```
rep(i, t+1) = alpha * rep(i, t) + (1 - alpha) * contribution_quality(i, t)
```

其中 decay factor `alpha` 接近 1。Reputation：

- 对 routing decisions 来说读取成本低（“把困难任务发给高 rep agents”）。
- 伪造成本高（随时间累积，绑定 DID）。
- 可以被 slashed：未通过验证的贡献会扣分。

### AAMAS 2025 去中心化 LaMAS

LaMAS 提案（AAMAS 2025）结合了：DID identity、Shapley-value credit attribution 和一个简单 auction mechanism。核心主张是：将 credit attribution 步骤去中心化，可以让系统可审计，并免于单点操纵。

### 经济机制会在哪里崩掉

- **Price oracle manipulation。** 如果 credit function 可以被操纵，agents 就会操纵它。每个机制都需要 adversarial test。
- **Sybil attacks。** 一个 operator 启动 N 个假 agents 来抬高自己的贡献。DIDs 会减缓但不能阻止这种行为；缓解手段是 reputation cost-to-forge。
- **Verification cost。** Credit attribution 的公平性取决于 verifier。如果 verification 便宜（小 LLM），它可能被操纵；如果昂贵（human panel），系统就无法扩展。
- **Regulatory overhang。** Agent economies 与金融监管相交。截至 2026 年，Bittensor、Fetch 和 Gonka 在一些司法辖区都处于法律灰色地带。

### 什么时候 agent economies 有意义

- **具有异构 operators 的开放网络。** 没有单个团队控制所有 agents。
- **可验证输出。** 没有 verification，credit attribution 就只是猜测。
- **Long-horizon workflows。** 一次性任务无法从 reputation accumulation 中受益。
- **Tokenized payments 在你的司法辖区合法可行。**

在封闭的企业系统中，经济机制会让位于更简单的分配方式（managers 分配工作，metrics 是内部的）。经济学文献主要适用于开放网络。

## 构建它
`code/main.py` 实现：

- `shapley(value_fn, agents)` — 通过枚举为小 N 精确计算 Shapley。
- `second_price_auction(bids)` — 真实机制；winner 支付 second-highest。
- `Reputation` — 绑定 DID、带 exponential decay 和 slashing 的 reputation。
- Demo 1：三个 agents 协作，exact Shapley 归因 credit。
- Demo 2：五个 agents 为一个 task slot 出价；second-price auction 选择 winner + payment。
- Demo 3：100 轮任务分配给具有异构 rep 的 agents；rep-weighted routing 优于 random。

运行：

```
python3 code/main.py
```

预期输出：每个 agent 的 Shapley values；展示 truthful-bid equilibrium 的 auction result；展示 warmup 后 rep-weighted routing 相比 random 有 10-20% quality gain。

## 使用它
`outputs/skill-economy-designer.md` 设计一个最小 agent economy：identity layer 选择、credit attribution mechanism、payment mechanism、reputation rule。

## 交付它
在 2026 年运行 agent economy：

- **从 reputation 开始，而不是 tokens。** Reputation 实现成本低，单独就有价值；tokens 会增加法律和经济复杂性。
- **奖励前先验证。** 不要在没有独立 verification 步骤的情况下分配 credit。自报 quality 会累积 sybil games。
- **使用 Shapley-sample，而不是 Shapley-exact。** 采样 100-1000 个 orderings；精确枚举无法扩展。
- **限制 decay factor，并设置 reputation floor。** 无界 decay 会抹去合法贡献者；过慢 decay 会奖励过时的高 rep agents。
- **以 adversarial 方式审计机制。** 在开放网络前运行 red-team scenarios。每个机制都有 game theory；你要找到漏洞，而不是等 attackers 找到。

## 练习
1. 运行 `code/main.py`。确认 Shapley values 之和等于 total value（efficiency axiom）。修改 value function；Shapley allocations 是否按预期方向变化？
2. 实现 Shapley *sampling*（在 K 个 orderings 上 Monte Carlo）。K 如何影响 approximation accuracy？与 N=4 的 exact 结果比较。
3. 在 auction 前实现一个 coalition-forming 步骤：agents 可以合并成 teams 并作为一个 unit 出价。会形成哪些 coalitions？结果是否比 individual bidding 更 Pareto-better？
4. 阅读 Google Research 的 mechanism-design 文章。找出一个一旦被违反就会破坏 truthfulness 的假设。在 LLM 场景中，这种 failure mode 是什么样？
5. 阅读 AAMAS 2025 去中心化 LaMAS 论文。在一个 synthetic task 上为 10 个 agents 实现其中的 Shapley 步骤。exact computation 需要多长时间？用 100 次 draws 采样能有多接近？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| DePIN | “Decentralized physical infrastructure” | Token-incentivized compute/storage/bandwidth。Bittensor、Akash、Render。 |
| DID | “Decentralized identifier” | 用于 portable IDs 的 W3C spec。Agent reputation 绑定到 DID，而不是平台。 |
| ERC-4337 | “Account abstraction” | 可以 sponsor gas 的 contract accounts，从而支持 agent payments。 |
| Shapley value | “Fair credit attribution” | 满足 efficiency、symmetry、linearity、null 的唯一 allocation。 |
| Second-price auction | “Vickrey auction” | 真实机制：winner 支付 second-highest bid。与 monotone aggregation 兼容。 |
| Reputation capital | “Accumulated quality score” | 来自已确认贡献、绑定 DID 的 score；会随时间 decay。 |
| Agentic DAO | “Agents + humans govern” | 把 agent voters 作为 first-class、投票权绑定 reputation 的 DAO。 |
| TAO / FET / GPU credits | “Token denominations” | Bittensor TAO、Fetch.ai FET、各种 DePIN tokens。 |

## 延伸阅读
- [The Agent Economy](https://arxiv.org/abs/2602.14219) — 2026 年关于 5-layer agent-economy stack 的综述
- [Google Research — Mechanism design for large language models](https://research.google/blog/mechanism-design-for-large-language-models/) — 带 monotone aggregation 的 token auctions
- [AAMAS 2025 — decentralized LaMAS](https://www.ifaamas.org/Proceedings/aamas2025/pdfs/p2896.pdf) — Shapley-value credit attribution
- [Bittensor TAO documentation](https://docs.bittensor.com/) — subnet structure 和 reward distribution
- [Fetch.ai / ASI Alliance](https://fetch.ai/) — ASI-1 Mini LLM 和 FET token
- [W3C Decentralized Identifiers (DIDs) spec](https://www.w3.org/TR/did-core/) — identity foundation
