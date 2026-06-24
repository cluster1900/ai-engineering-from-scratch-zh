# Async 与 Hogwild! Inference

> Speculative decoding（Phase 10 · 15）会在单个 sequence 内并行化 tokens。Multi-agent frameworks 会在整个 sequences 之间并行化，但会强制显式协调（voting、sub-task splitting）。Hogwild! Inference（Rodionov et al., arXiv:2504.06261）做的是另一件事：并行运行同一个 LLM 的 N 个 instances，并让它们共享一个 key-value cache。每个 worker 都能立即看到其他 worker 生成的 tokens。现代 reasoning models——QwQ、DeepSeek-R1——无需任何 fine-tuning，就能通过这个 shared cache 自我协调。这个方法仍处于实验阶段，但它开启了 inference parallelism 的一个全新维度，并且与 spec decode 正交。本课会用 stdlib Python 实现一个 two-worker Hogwild! simulator，并解释为什么 shared-cache collaboration 会从现有 model 的 reasoning abilities 中涌现出来。

**类型：** Build
**语言：** Python (stdlib)
**先修：** Phase 10 · 12（inference optimization），Phase 10 · 15（speculative decoding）
**时间：** ~60 分钟

## 学习目标

- 描述三种常见的 parallel-LLM topologies（voting、sub-task、Hogwild!），并说明每一种针对的问题。
- 说出 Hogwild! 的核心设置：多个 workers、一个 shared KV cache、通过 self-prompting 实现 emergent coordination。
- 根据 worker 数量 `N`、task-level parallelism `p` 和 coordination overhead `c` 计算 Hogwild! 的 wall-time speedup。
- 在 toy problem 上实现一个 two-worker Hogwild! simulator，并观察 emergent task division。

## 问题

现代 LLMs 通过生成很长的 reasoning chains 来解决困难问题——5000 tokens 的 step-by-step logic 很常见，深度数学问题上出现数万 tokens 也并不少见。在 70B model 上以 35 tokens/sec decode，50k tokens 需要 24 分钟。这样的 model 并不具备交互性。

Speculative decoding（Phase 10 · 15）通过在单个 sequence 内并行化，可以带来 3-5x speedup。再往后，autoregressive decoding 的 sequential dependency 就是硬上限。每个新 token 都依赖之前的每个 token。

显然的问题是：我们能否跨 sequences 并行化？在同一个问题上运行同一个 model 的多个 copies，让它们协作，让它们分工？

已有工作包括：voting ensembles（运行 N 个 models，选择 majority answer）、tree-of-thought（分支出 reasoning paths 并重新组合）以及 multi-agent frameworks（为每个 agent 分配 sub-task，并使用 coordinator）。这些都能在特定 task domains 中提供帮助。但它们也都会引入显式 coordination machinery——voting rules、branch-and-prune logic、agent-to-agent messaging protocols。

Hogwild! Inference 采用了不同方法。N 个 workers 共享一个 KV cache。每个 worker 都会立即看到其他 worker 生成的 tokens，就像这些 tokens 已经在自己的 context 中一样。workers 在没有任何 training 或 fine-tuning 的情况下，会自己弄清楚如何分工。现代 reasoning models（QwQ、DeepSeek-R1、Claude-family reasoning mode）能够读取 shared cache，并说出类似“我看到 worker 2 已经处理了 base case，所以我来处理 inductive step”这样的话。

截至 2026 年 4 月，speedup 依赖 workload，且仍处于实验阶段。但这个想法值得了解，因为它开启了 inference parallelism 的一个新维度。

## 概念

### 设置

初始化 N 个 worker processes，全部运行同一个 LLM。不要使用 per-worker KV caches，而是维护一个 shared cache。当 worker `i` 生成 token `t_j` 时，该 token 会被写入 shared cache 的下一个位置。当 worker `k` 执行下一步时，它读取 cache 的当前状态（其中包含截至目前所有 N 个 workers 生成的全部内容）。

在 step time，workers 会竞争写入 tokens。没有 per-worker position index——cache 是一个单一的、不断增长的 sequence。顺序由 write arrival time 决定。

### 为什么 coordination 会涌现

workers 共享一个 prompt。通常类似于：“You are one of N instances working together on this problem. Each instance reads the shared memory and can see what other instances have written. Avoid redundant work.” 这个 prompt 加上 shared cache 就足够了。Reasoning models 会读取 cache，注意到问题的哪些部分已经被尝试过，并且（经常但并非总是）转向尚未探索的部分。

Hogwild! paper（Rodionov et al., 2025）报告了如下观察：

- Workers 会制定 plans，并通过 cache 将其传达给其他 workers。
- Workers 会注意到其他 workers reasoning 中的 errors，并指出这些问题。
- Workers 会在 plan 失败时适应情况，并提出 alternatives。
- 当 prompt 要求检查 redundancy 时，workers 会检测到它并转向其他工作。

这些都不需要 fine-tuning。Emergent behavior 来自 model 已经具备的 reasoning capabilities。

### 命名

这篇 paper 的名称借用了 Hogwild! SGD（Recht et al., 2011），一种 asynchronous-update optimizer。类比是：SGD 的 asynchronous workers 都写入一个 shared parameter vector；Hogwild! Inference 的 workers 都写入一个 shared KV cache。两者都依赖 empirical convergence，而不是 synchronization guarantees。

### RoPE 让这变得可行

Rotary Position Embeddings（RoPE, Su et al. 2021）通过 Q 和 K vectors 中的 rotation 编码 position information。因为 positions 是 rotations，而不是固化的 offsets，所以 token 的 position 可以移动，而不需要重新计算 KV cache entry。当 worker `i` 写入 shared cache 的 position `p` 时，读取该 position 的其他 workers 可以直接使用 cached entry——不需要 re-rotation。

在 learned-position 或 absolute-position model 中，Hogwild! 会在每次 concurrent write 时都需要 cache invalidation。RoPE 让 cache 保持稳定。

### Wall-time 数学

设 `T_serial` 是一个 worker 单独解决问题所需的时间。设 `p` 是 task-level parallelizable fraction。设 `c` 是 per-step coordination overhead（读取扩展后的 cache，并决定要写什么）。

Single-worker time：`T_serial`。
如果 coordination 是免费的，N-worker Hogwild! time 为：`T_serial * ((1 - p) + p / N)`。这是经典 Amdahl。
加入 coordination overhead 后：`T_serial * ((1 - p) + p / N) + c * steps_per_worker`。

要让 worker 有产出，`c` 必须相对于 per-step decode time 足够小。对于生成 5k+ tokens 的 reasoning models，workers 可以承受数百 tokens 的 coordination overhead，并且仍然领先。对于短 chat tasks，coordination 会占主导，Hogwild! 会比 serial 更差。

### 具体示例

Reasoning problem：10k tokens 的 chain-of-thought。假设问题有 `p = 0.7` 的 parallelizable content（不同 proof strategies、不同 case analyses），且每个 worker 的 coordination overhead 为 `c = 200` tokens。使用 `N = 4` workers：

- Serial time：10000 decode steps。
- Hogwild! time：10000 * (0.3 + 0.7 / 4) + 200 * 4 = 10000 * 0.475 + 800 = 5550 decode steps。
- Speedup：10000 / 5550 = 1.8x。

这只是中等收益。但在更长的 reasoning problems（50k tokens）上，coordination overhead 会被摊薄，speedup 会推向 2.5-3x。Hogwild! 相当于 inference 领域的 thread-level parallelism，让你能够自然地编写 multi-threaded code。

### 什么时候使用 Hogwild!

- 长 reasoning problems（数千 tokens），其中 task 可以跨 independent sub-goals 并行化。
- 已经被训练为 step by step 思考的 reasoning models。Non-reasoning models 无法很好地 self-coordinate。
- Single-node deployments，并且有足够 VRAM 容纳 shared cache 加 N 个 worker processes。cache 是共享的，但每个 worker 有自己的 activation memory。

### 什么时候不使用

- 短 interactive chat。Coordination overhead 会占主导。
- 无法并行化的 tasks（单一 linear proof、单一 compilation）。N=1 是上限。
- Non-reasoning models。不会涌现 coordination。
- Multi-node deployments。shared cache 需要非常快的 cross-worker synchronization。Intra-node 可以；cross-node 会成为 latency disaster。

### 实验状态

截至 2026 年 4 月，Hogwild! 是一种 research method，并有 open-source PyTorch implementation。尚未出现 production adoption。三个阻碍因素：

1. 跨 concurrent processes 管理 shared KV cache 是非平凡的工程问题。
2. Emergent coordination 依赖 task；benchmarks 仍在构建中。
3. 与 speculative decoding 已经带来的收益相比，speedups 较为温和；两者可以组合，但组合后的工程复杂度又是一层。

值得了解。值得实验。还不值得把产品押在上面。


```figure
continuous-batching
```

## 构建它

`code/main.py` 实现了一个 toy Hogwild! simulator：

- 两个 worker processes，每个都是确定性的“LLM”，会以已知概率生成几类 tokens（work-token、observe-token、coordinate-token）之一。
- 一个 shared cache（只是一个 tokens list），两个 workers 都会读取和写入。
- 一个简单的 coordination logic：当某个 worker 看到另一个 worker 已经在某个 category 中产生了足够的 work tokens 时，它会选择不同 category。

simulator 会在固定 step budget 下运行，并报告：

- 产生的 work-tokens 总数。
- 总 wall time（worker steps 数量）。
- 相对于 single worker 的 effective speedup。
- 哪个 worker 写入了哪个 token 的 trace。

### 步骤 1：shared cache

一个两个 workers 都会 append 的 list。真实实现中会使用简单 locking（Python `threading.Lock`）；这里我们用 counter 模拟。

### 步骤 2：worker loop

每个 worker 在每一步：

- 读取当前 shared cache。
- 根据其中已有内容决定要写入哪类 token。
- 写入一个 token。

### 步骤 3：coordination heuristic

如果 category X 在 cache 中已经有 K 个 tokens，并且 worker 原本想写的 category 是 X，那么 worker 会切换到 category Y。这是一个 toy stand-in，用来表示 reasoning-model 的行为：“注意到这已经被覆盖了，改做其他事情。”

### 步骤 4：测量 speedup

分别用 N=1 worker 和 N=2 workers 运行 simulator，使用相同的总 step budget。统计产生的 work-tokens。由于 coordination-driven task division，N=2 应该产生大约 1.5-1.8x 的 work-tokens。

### 步骤 5：对 coordination 施压

降低 coordination heuristic 的 sensitivity。再次运行。观察如果没有好的 coordination，N=2 会冗余地产生相同 tokens，speedup 会跌到 1 以下。这与 paper 的观察一致：这个技巧只有在 workers 具备 self-coordinate 的 reasoning capacity 时才有效。

## 使用它

截至 2026 年 4 月，Hogwild! integration 在 production 中仍是 research-grade。Yandex/HSE/IST 的 reference implementation 基于 PyTorch，目标是 DeepSeek-R1 和 QwQ models 上的 single-node multi-process setups。

务实的采用路径：

1. Profile 你的 reasoning-task workload。测量 tokens 中 exploratory（multiple strategies、case analyses、search）与 linear 的占比。
2. 如果 exploration 占主导，运行 two-worker Hogwild! experiment。测量 wall-time improvement。
3. 如果 improvement 低于 1.3x，说明你处在 coordination-dominated regime。回退到 single-worker。
4. 如果 improvement 超过 1.5x，推进到 N=4 并再次测量。Diminishing returns 通常会在 N=4-8 左右出现。

与 speculative decoding 组合：每个 Hogwild! worker 都可以独立使用 spec decode。两种 speedups 会（大致）相乘，使 3x spec decode 和 1.8x Hogwild! 达到相对于 naive single-worker decoding 的有效 5.4x。

## 交付它

本课会生成 `outputs/skill-parallel-inference-router.md`。给定一个 reasoning workload profile（token budget、task parallelism profile、model family、deployment target），它会在 voting、tree-of-thought、multi-agent、Hogwild! 和 speculative decoding strategies 之间进行路由。

## 练习

1. 使用默认设置运行 `code/main.py`。确认在相同 wall time 内，N=2 Hogwild! configuration 比 N=1 baseline 产生更多 work-tokens。

2. 降低 coordination heuristic 的强度（设置 `coordination_weight=0.1`）。重新运行。展示 speedup 崩塌。解释原因：当 workers 无法协调时，它们会重复劳动。

3. 计算一个 50k-token reasoning task 在 `p=0.8, c=500` 且 N=4 workers 时的预期 Hogwild! speedup。再对一个 1k-token chat task 在 `p=0.3, c=200` 且 N=4 时做同样计算。为什么一个是收益，另一个是损失？

4. 阅读 Hogwild! paper 的 Section 4（preliminary evaluation）。找出 authors 报告的两个 failure modes。描述一个更好的 coordination prompt 可能如何缓解每一个问题。

5. 在 toy 中将 Hogwild! 与 speculative decoding 组合：每个 worker 内部使用 2-token spec-decode。报告 multiplicative speedup。当两个 workers 都想扩展同一个 shared-cache prefix 时，会出现什么 bookkeeping problem？

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Hogwild! | “Parallel workers, shared cache” | 同一个 LLM 的 N 个 instances 并发运行，并共享一个 KV cache；通过 self-prompting 实现 emergent coordination |
| Shared KV cache | “The coordination medium” | 一个不断增长的 KV buffer，所有 workers 都会读取和写入；让 tokens 能在 workers 之间立即可见 |
| Emergent coordination | “No training needed” | 具备 reasoning 能力的 LLMs 可以读取 shared cache，并在没有任何 fine-tuning 或显式 protocol 的情况下分工 |
| Coordination overhead (c) | “Tokens spent orienting” | 每个 worker 读取扩展后的 cache 并决定下一步做什么的成本；相对于总 decode time 必须保持较小 |
| Parallelizable fraction (p) | “What can run in parallel” | Task-level parallelism：总工作中并非内在 sequential 的比例 |
| RoPE enables Hogwild! | “Rotary positions are shift-invariant” | 因为 positions 是 rotations，写入 shared cache 不需要重新计算之前的 tokens |
| Voting ensemble | “Run N, pick the majority” | 最简单的 parallel inference topology；适用于 classification，对 long-form reasoning 帮助较小 |
| Tree of thought | “Branch and prune” | 探索多个 branches 并进行 pruning 的 reasoning strategy；使用显式 coordination logic |
| Multi-agent framework | “Assign sub-tasks” | 每个 agent 获得一个 role；由 coordinator 编排；protocol overhead 很重 |

## 延伸阅读

- [Rodionov et al. — Hogwild! Inference: Parallel LLM Generation via Concurrent Attention (arXiv:2504.06261)](https://arxiv.org/abs/2504.06261) — Hogwild! paper，在 QwQ 和 DeepSeek-R1 上的 preliminary evaluation
- [Recht, Re, Wright, Niu — Hogwild!: A Lock-Free Approach to Parallelizing Stochastic Gradient Descent (arXiv:1106.5730, NeurIPS 2011)](https://arxiv.org/abs/1106.5730) — 原始 Hogwild!，名称来源
- [Su et al. — RoFormer: Enhanced Transformer with Rotary Position Embedding (arXiv:2104.09864)](https://arxiv.org/abs/2104.09864) — RoPE，使 shared-cache inference 可行的性质
- [Yao et al. — Tree of Thoughts: Deliberate Problem Solving with Large Language Models (arXiv:2305.10601)](https://arxiv.org/abs/2305.10601) — tree-of-thought reasoning strategy，Hogwild! 与其正交
- [Leviathan et al. — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192)](https://arxiv.org/abs/2211.17192) — speculative decoding，Hogwild! 可与其组合的 within-sequence parallelism
- [Hogwild! reference PyTorch implementation](https://github.com/eqimp/hogwild_llm) — paper experiments 的 single source of truth
