# Jamba — Hybrid SSM-Transformer

> State space model (SSM) 和 Transformer 想要的东西不同。Transformer 通过 Attention 换取质量，但代价是二次复杂度。SSM 通过递推换取线性时间推理和常量内存，但质量落后。AI21 的 Jamba（2024 年 3 月）和 Jamba 1.5（2024 年 8 月）把它们放进同一个模型：每 7 个 Mamba 层配 1 个 Transformer 层，每隔一个 block 使用 MoE，并提供可在单张 80GB GPU 上运行的 256k context window。Mamba-3（ICLR 2026）通过复数值状态空间和 MIMO projections 强化了 SSM 侧。本课会端到端阅读这两类架构，并解释为什么当 pure-SSM 和 pure-Transformer 的 long-context 尝试都未能持续时，这种 hybrid 配方却在三年的扩展中保留下来。

**Type:** Learn
**Languages:** Python (stdlib, layer-mix calculator)
**前置要求:** Phase 10 · 14 (open-model architectures), Phase 10 · 17 (native sparse attention)
**Time:** ~60 minutes

## 学习目标
- 解释 Jamba block 中的三个 primitives：Transformer layers、Mamba layers、MoE，以及 1:7:even 的交错配方。
- 从高层说明 SSM 的递推形式，以及为什么它能实现常量内存推理。
- 计算 Jamba 模型在 256k context 下的 KV cache 占用，并与 pure-Transformer 模型所需内存进行比较。
- 说出 Mamba-3 的三项创新（exponential-trapezoidal discretization、complex-valued state update、MIMO）以及每项创新针对的问题。

## 问题
Attention 对序列长度是二次复杂度。State space model 是线性的。这个差异会被不断放大：在 256k tokens 下，一个 Transformer Attention map 每个 head 有 65B 个条目；SSM 的递推状态不随序列长度变化，大小固定。

Pure-SSM 模型（Mamba、Mamba-2）在小规模下能匹配 Transformer perplexity，但在 state-tracking 任务上落后，并且在某些 in-context retrieval 类别上失败。直觉是：SSM 将历史压缩进固定状态；当历史很长时，信息会泄漏。Attention 精确记住所有内容，但要付出二次复杂度成本。

显而易见的修复方法：两者都用。在需要精确召回的地方放 Transformer layers。其他地方使用 SSM layers。调节比例。Jamba 是第一个以规模化方式交付这种 hybrid 配方的生产级模型（总计 52B、激活 12B、256k context、单张 80GB GPU）。Jamba 1.5 将该系列扩展到总计 398B / 激活 94B。Mamba-3（ICLR 2026）是当前最佳的 pure-SSM baseline，hybrid 可以围绕它重新构建。

本课会阅读这三篇论文，并形成“选择正确比例”的思维模型。

## 概念
### An SSM in one page

State space model 通过固定大小的状态 `h` 处理序列 `x_1, ..., x_N`：

```
h_t = A h_{t-1} + B x_t
y_t = C h_t
```

每一步中，状态通过线性动力学 `A` 演化，接收输入 `B x_t`，并输出 `C h_t`。`A, B, C` 都可以学习。注意这个关键性质：计算 `y_t` 只需要 `h_{t-1}` 和 `x_t`，不需要任何更早的 `x`。内存是常量。推理是每个 token O(1)。

建模质量的关键在于 `A` 的结构。S4（Gu 2021）使用了一个高度结构化的 matrix，在训练期间可以作为长 convolution 高效求值。Mamba（Gu, Dao 2023）将固定的 `A, B, C` 替换为依赖数据的形式（也就是 “selective” 部分）。Mamba-2（2024）进一步简化了结构。Mamba-3（2026）则在特定位置重新加入复杂性。

关键性质是：对于 decoder LLM，SSM layer 可以作为 Attention layer 的直接替代品，用固定大小的逐层状态取代不断增长的 KV cache。

### The Jamba block

Jamba block 按照两个数字交错层：

- `l`：Attention-to-Mamba ratio。Jamba 使用 `l = 8`，表示每 7 个 Mamba 层配 1 个 Transformer 层（7 Mamba + 1 Attention = 每组 8 层）。
- `e`：MoE frequency。Jamba 使用 `e = 2`，表示每隔一层应用 MoE。

block 内的层序列：

```
M  M  M  M  M  M  M  A    (7 Mamba + 1 Attention)
|  M  |  M  |  M  |  M    (where | marks MoE applied)
```

每个 Jamba block 是 8 层。深度为 4 个 block（总共 32 层）时，你会得到 28 个 Mamba 层和 4 个 Attention 层。其中 16 层使用 MoE。

### Why the 1:7 ratio

AI21 做了 ablations：什么样的 attention-to-Mamba 比例能在他们的 long-context evals 上获得最佳 perplexity-per-parameter 和 in-context recall？

- Attention 太多（1:1）：质量提升，但内存和速度变差。
- Attention 太少（1:15）：内存很好，但 in-context retrieval 失败。
- 最佳点：1:7 或 1:8。

直觉是：Transformer layers 处理精确召回和 state tracking。Mamba layers 负责低成本的大部分处理。

### Positional encoding

Mamba layers 本身具有位置感知能力（通过递推）。原始 Mamba-based hybrids 中的 Attention layers 没有使用 RoPE，因为 SSM layers 提供了位置信息。Jamba 1.5 为 Attention layers 添加 RoPE，以增强 longer-context generalization；这是基于经验 long-context evaluation 的事后改进。

### The memory budget

对于 Jamba-1 形状（32 层：28 Mamba + 4 Attention，hidden 4096，32 attention heads）：

- KV cache（仅 Attention layers）：在 256k BF16 下为 `2 * 4 * 32 * 128 * 256k * 2 = 8.4 GB`。只有 4 个 Attention layers 贡献 KV cache。
- SSM state：每个 token prefix 为 `28 * hidden * state_size`，但这是逐层固定大小，不随序列长度扩展。典型 Mamba state 是每个 feature 16，hidden 4096：总计 `28 * 4096 * 16 * 2 = 3.7 MB`。

与相同 hidden、32 层、32 heads full MHA 的 pure Transformer 相比：在 256k BF16 下为 `2 * 32 * 32 * 128 * 256k * 2 = 128 GB`。KV cache 减少 8x。即使对比大多数 2024 模型使用的 GQA(8) baseline（`2 * 32 * 8 * 128 * 256k * 2 = 32 GB`），Jamba 的 1:7 hybrid 在 16 GB 下仍然小 2x。

这就是 AI21 所说的“单张 80GB GPU 上的 256k context”。full-MHA pure Transformer 的 KV cache 放不下；即使 GQA baseline 也几乎不给 weights 和 activations 留空间；而 Jamba 可以。

### Mamba-3: 2026 年的 pure-SSM baseline

Mamba-3（ICLR 2026，arXiv:2603.15569）在 pure-SSM 侧引入了三项创新：

1. **Exponential-trapezoidal discretization.** 用更有表达力的递推替换 Mamba-2 中的 Euler-method discretization。Convolution-like operation 应用于核心递推中的 state-input，而不是作为 `x_t` 上的外部 convolution。

2. **Complex-valued state update.** 之前的 Mamba 将 state matrix 从 complex（S4）降低为 real diagonal（Mamba），再降低为 scaled identity（Mamba-2）。Mamba-3 重新加入 complex values，相当于对状态进行 data-dependent rotary embedding。这恢复了之前 real-valued 简化所牺牲的 state-tracking 能力。

3. **Multi-input multi-output (MIMO) projections.** 不使用逐 feature 标量 projections，而是使用 matrix-valued projections。在不增加 decode latency 的情况下提升建模能力和推理时硬件利用率。

在 1.5B 参数规模下，Mamba-3 相比 Gated DeltaNet 将平均 downstream accuracy 提高 0.6 个点；MIMO variant 额外增加 1.2 个点，总共提升 1.8 个点。在相同 state size 下，Mamba-3 以一半 state 匹配 Mamba-2。

Mamba-3 还没有在大规模生产 hybrid 中交付，但它显然是下一代 Jamba-class 模型 SSM 侧的候选方案。

### 何时使用 hybrid

Hybrid 适合以下情况：

- Context 足够长，以至于 pure Transformer KV cache 变得痛苦（64k+）。
- 任务混合了 short-range structure（适合 SSM）和 long-range recall（需要 Transformer）。
- 你希望在单 GPU 内存预算上部署，而 Transformer KV cache 本身就放不下。

Hybrid 不适合以下情况：

- Context 很短（低于 16k）。SSM overhead 被浪费；pure Transformer 足够好。
- 任务需要 everywhere-to-everywhere Attention（深度推理、多文档交叉引用）。Hybrid 中 Attention layers 的稀疏性会伤害效果。
- 你正在扩展到 trillion-parameter frontier models。Pure-Transformer + MLA + MoE（DeepSeek-V3 风格）目前在能力竞赛中胜出。

### The competitive landscape

| Model | Family | Scale | Unique claim |
|-------|--------|------|-------------|
| Mamba-2 | pure SSM | 3B | linear time, constant memory |
| Jamba | hybrid | 52B/12B | 256k on 80GB |
| Jamba 1.5 Large | hybrid | 398B/94B | enterprise-grade long-context |
| Mamba-3 | pure SSM | 1.5B (paper) | state-tracking restored |
| DeepSeek-V3 | pure Transformer + MoE | 671B/37B | frontier capability |

2026 年的格局：pure-Transformer MoE 主导 frontier，但 hybrid 占据 256k 以上 context 的细分领域。Mamba-3 在 state-tracking 上的胜利，可能会推动下一代 hybrid 采用更低比例（更多 SSM、更少 Attention）。

## 使用它
`code/main.py` 是一个用于 hybrid architectures 的内存计算器。给定 SSM-Transformer ratio 和 hidden-size / layer-count config，它会计算：

- 目标 context 下的 KV cache。
- SSM state memory。
- 一系列模型形状在 context N 下的总内存。

该计算器支持：

- Pure-Transformer baseline（KV cache 随 N 增长）。
- Jamba-style 1:7 hybrid。
- Pure-SSM（完全没有 KV cache）。

对于已发布形状，数字直接来自 Jamba-1 和 Jamba-1.5 论文；对于假设变体，则是外推得到。

真实部署的集成考虑：

- 大多数生产推理服务器（vLLM、SGLang）支持 Jamba 和 Mamba。检查具体版本。
- 在 256k context 下，Jamba 的内存优势会体现在 concurrent-request throughput 上。在相同 VRAM 上，你能容纳比 Transformer sequences 更多的 Jamba sequences。
- Mamba-3 作为 standalone model 还没有在生产中交付，只是 1.5B 的 research preview。

## 交付它
本课会产出 `outputs/skill-hybrid-picker.md`。给定 workload specification（context length profile、task mix、memory budget），它会在 pure Transformer、Jamba-style hybrid 和 pure SSM 之间给出推荐，并明确说明内存与质量权衡。

## 练习
1. 运行 `code/main.py`，计算 32 层 pure Transformer（hidden 4096，32 heads）和相同形状的 Jamba-1 hybrid 在 256k context 下的 KV cache。验证 AI21 论文声称的约 8x 内存降低。

2. 修改计算器，建模 1:3 hybrid（4 Mamba : 1 Attention）和 1:15 hybrid（14 Mamba : 1 Attention）。绘制 KV cache vs ratio。在哪个 ratio 下 KV cache 等于 SSM state memory？

3. 阅读 Jamba 论文（arXiv:2403.19887）的第 3 节。解释为什么 AI21 使用 Mamba-1 而不是 Mamba-2，尽管 Mamba-2 更快。提示：hybrid ablation section 记录了这一点。

4. 计算 Jamba 1.5 Large 中 MoE-every-other-layer 的参数 overhead（总计 398B，激活 94B）。将 active ratio 与 DeepSeek-V3（37B/671B）比较，并解释为什么 Jamba 的架构会把 active ratio 推得更高。

5. 阅读 Mamba-3 论文（arXiv:2603.15569）的第 3 节。用三句话解释为什么 complex-valued state update 等价于 data-dependent rotary embedding。把答案关联到 Phase 7 · Lesson 04 的 RoPE 推导。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| State space model (SSM) | “带固定状态的递推” | 具有学习到的递推 `h_t = A h_{t-1} + B x_t` 的层；每个 token 使用常量内存 |
| Selective SSM | “Mamba 的技巧” | 依赖数据的 A、B、C 参数，使模型在线性时间下获得类似 gating 的选择性 |
| Attention-to-Mamba ratio | “多少个 Attention layers” | 在 Jamba 中，`l = 8` 表示每 7 个 Mamba layers 配 1 个 Attention layer |
| Jamba block | “8 层一组” | 一个 Attention + 七个 Mamba + 在交替位置使用 MoE |
| SSM state | “隐藏缓冲区” | 固定大小的逐层状态，用于替代 Mamba layers 的 KV cache |
| 256k context | “Jamba 的旗舰数字” | Jamba-1 可在单张 80GB GPU 上容纳的序列长度；pure Transformer 在该大小下无法做到 |
| Mamba-3 | “2026 pure SSM” | 当前最佳 pure-SSM architecture，具有 complex state + MIMO；是 hybrid 重新构建时围绕的 baseline |
| MIMO | “Multi-input multi-output” | Mamba-3 的创新，使用 matrix-valued projections 而不是逐 feature 标量 |
| Exponential-trapezoidal discretization | “Mamba-3 的递推” | 更有表达力的递推，包含 Mamba-2 的 Euler-method discretization |
| Hybrid architecture | “混合 Attention 和 SSM” | 任何交错 Transformer 和 SSM layers 的模型；Jamba 是生产级原型 |

## 延伸阅读
- [Lieber et al. — Jamba: A Hybrid Transformer-Mamba Language Model (arXiv:2403.19887)](https://arxiv.org/abs/2403.19887) — 原始 Jamba 论文，ratio ablations，256k context 声明
- [AI21 — Jamba 1.5: Hybrid Transformer-Mamba at Scale (arXiv:2408.12570)](https://arxiv.org/abs/2408.12570) — 扩展后的系列，398B/94B 和 12B/52B 公开发布
- [Gu, Dao — Mamba: Linear-Time Sequence Modeling with Selective State Spaces (arXiv:2312.00752)](https://arxiv.org/abs/2312.00752) — Jamba 构建所基于的 selective SSM 论文
- [Dao, Gu — Mamba-2 (arXiv:2405.21060)](https://arxiv.org/abs/2405.21060) — 简化的 structured-state-space 后继者
- [Lahoti et al. — Mamba-3 (arXiv:2603.15569, ICLR 2026)](https://arxiv.org/abs/2603.15569) — complex-valued state、MIMO、2026 pure-SSM frontier
- [Gu et al. — Efficiently Modeling Long Sequences with Structured State Spaces (arXiv:2111.00396)](https://arxiv.org/abs/2111.00396) — S4 论文，面向 LLMs 的 SSM 谱系起点
