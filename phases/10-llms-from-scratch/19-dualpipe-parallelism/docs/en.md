# DualPipe Parallelism

> DeepSeek-V3 使用 2,048 张 H800 GPUs 训练，MoE experts 分散在多个节点上。跨节点 expert all-to-all communication 每 1 GPU-hour 的计算就需要 1 GPU-hour 的通信。GPUs 有一半时间处于空闲。DualPipe（DeepSeek，2024 年 12 月）是一种双向 pipeline，它将 forward 和 backward 计算与它们触发的 all-to-all 通信重叠起来。Bubbles 减少，吞吐量提升，而且保留两份 model-parameter copies（名称中的 “dual” 来源）在 Expert Parallelism 已经把 experts 分散到各个 ranks 的情况下成本很低。本课是 Learn 类型的讲解，介绍 DualPipe 实际做了什么，以及为什么 Sea AI Lab 的 DualPipeV 改进版以略微更紧的 bubble 为代价，去掉了 2x 参数成本。

**Type:** Learn
**Languages:** Python (stdlib, schedule simulator)
**Prerequisites:** Phase 10 · 05（distributed training、FSDP、DeepSpeed），Phase 10 · 14（open-model architectures 和 MoE）
**Time:** ~60 minutes

## 学习目标
- 说出 DualPipe forward-backward chunk 的四个组成部分，以及为什么每个部分都有自己的重叠窗口。
- 解释大规模下的 pipeline bubble 问题，以及 “bubble-free” 在实践中和在营销语境中的区别。
- 手工跟踪 8 个 PP ranks 和 16 个 micro-batches 的 DualPipe schedule，并确认 forward stream 和 reverse stream 会填充彼此的空闲槽位。
- 说明 DualPipeV（Sea AI Lab，2025）的取舍：在 Expert Parallelism 不活跃时，以略大的 bubble 为代价，去掉 2x 参数复制。

## 问题
在 2k H800 GPUs 上训练 671B MoE model 会遇到三个相互叠加的瓶颈：

1. **内存压力。** 每个 GPU 持有模型的一部分。sequence 8k、61 layers、128 heads 下的 activation memory 非常庞大。
2. **Pipeline bubbles。** 传统 pipeline parallelism（GPipe、1F1B）会让 GPUs 在等待其 stage 的输入或 Gradient 时处于空闲。8 个 stages 时，即使使用 1F1B scheduling，约 12% 的 GPU 时间也可能是 bubble。
3. **跨节点 all-to-all。** 使用 expert parallelism 的 MoE 会把 experts 分散到多个节点。每次 forward pass 都会触发一次 all-to-all，用于把 tokens 派发到各自的 experts，随后还会触发另一次 all-to-all 用于合并。在 2k GPUs 规模下，这很容易变成 1:1 的计算与通信比例。

这些问题各自都有单独的解决方案：memory 用 gradient checkpointing，pipeline bubbles 用 Zero Bubble（Sea AI Lab，2023），all-to-all 用 expert-parallel comm kernels。DualPipe 做的是让它们协同工作。这个 schedule 在单个 forward-backward chunk 内重叠计算和通信，同时从 pipeline 两端注入 micro-batches，并用由此产生的 schedule 将 all-to-all 隐藏在计算窗口中。

报告结果：在 DeepSeek-V3 的 14.8T-token 训练运行中，pipeline bubbles 近乎消除，GPU 利用率超过 95%。

## 概念
### Pipeline parallelism 复习

将一个 N-layer model 拆分到 P 个设备上。设备 `i` 持有 layers `i * N/P .. (i+1) * N/P - 1`。一个 micro-batch 从设备 0 到 P-1 执行 forward，然后从 P-1 到 0 执行 backward。每个设备只有在前一个设备发送其输出后，才能开始自己的 forward stage；也只有在下游设备发送上游 Gradient 后，才能开始 backward。

GPipe（Huang et al., 2019）一次调度一个 micro-batch，这会浪费大部分 GPU 时间。1F1B（Narayanan et al., 2021）为多个 micro-batches 交错执行 forward 和 backward passes。Zero Bubble（Qi et al., 2023）将 backward pass 拆成两部分：backward-for-input（B）和 backward-for-weights（W），并调度它们来填补 bubble。经过 Zero Bubble 后，pipeline 已经几乎紧凑。

DualPipe 是下一步。它在此基础上增加了两个想法：

### 思路 1: chunk decomposition

每个 forward chunk 被拆成四个组成部分：

- **Attention。** Q/K/V projections、Attention、output projection。
- **All-to-all dispatch。** 将 tokens 发送给各自 experts 的跨节点通信。
- **MLP。** MoE expert 计算。
- **All-to-all combine。** 将 expert outputs 带回来的跨节点通信。

一个 backward chunk 会加入这些部分的 Gradient 版本。DualPipe 对它们进行调度，使 all-to-all dispatch 与下一个 chunk 的 Attention 计算并行发生，并使 all-to-all combine 与后续 chunk 的 MLP 计算并行发生。

### 思路 2: bidirectional scheduling

大多数 pipeline schedules 从 stage 0 注入 micro-batches，并流向 stage P-1。DualPipe 从两端同时注入 micro-batches。Stage 0 会看到从那里发起的 forward micro-batches；stage P-1 也会看到从那里发起的 forward micro-batches。两条 streams 在中间相遇。

为了实现这一点，设备 `i` 必须同时持有 early-pipeline layer `i` 和 late-pipeline layer `P - 1 - i`。这就是 DualPipe 中 “dual” 的部分：每个设备保留两份它需要服务的 model layers（一份用于每个方向）。在 DeepSeek-V3 的规模下，这是 2x 的参数复制成本。它是可承受的，因为 Expert Parallelism 已经把 MoE experts 分散得很稀，复制两次 non-expert layers 并不算大成本。

关键在于，一个方向上的 forward stream 和另一个方向上的 backward stream 会恰好在单向 schedule 产生 bubbles 的位置重叠。Bubbles 消失了。

### A hand-traced schedule

考虑 P = 4 ranks、8 micro-batches，分为 4 个 forward / 4 个 reverse。时间从左到右移动；行是设备 ranks。

```
           Time →
rank 0:  F1 F2 F3 F4  F5R F6R F7R F8R  B1 B2 B3 B4  ...
rank 1:     F1 F2 F3  F4/F5R F6R F7R   B1 B2 ...
rank 2:        F1 F2  F3/F5R F4/F6R    B1 ...
rank 3:           F1  F2/F5R F3/F6R    ...
```

读取 “F4/F5R” 这种记法：rank 1 在同一个时间槽中，同时运行 micro-batch 4 的 forward（在 pipeline 中从左到右）和 micro-batch 5 的 forward（从右到左）。这就是 “bidirectional” 在操作层面的含义。

在 rank 2 处，交叉 streams 更早重叠；在 rank 0 和 P-1 处，它们最晚重叠。在 schedule 的稳定中间阶段，每个 rank 都运行 X 方向的 forward，并与 Y 方向的 backward 重叠。计算保持忙碌。forward pass 的 all-to-all dispatches 隐藏在 backward 计算中。all-to-all combines 隐藏在 forward 计算中。Bubbles 被挤出去了。

### Bubble accounting

标准 1F1B pipeline bubble（每个 rank 浪费的时间）：

```
bubble_1F1B = (P - 1) * forward_chunk_time
```

Zero Bubble 改进会降低它，但不能降到零。DualPipe 在稳定阶段中，如果 micro-batch 数量可以被 2 倍 pipeline depth 整除，就有零 bubble。在稳定阶段之外（warmup 和 cooldown），仍然会有一些 bubble，但它不会随 micro-batches 数量增长，这是论文强调的关键性质。

营销语境中： “bubble-free”。技术语境中：bubbles 不会随 micro-batch 数量增长。Sea AI Lab 的后续分析（DualPipeV / Cut-in-half）表明，只有在 Expert Parallelism 不是瓶颈时才有完全 zero-bubble；在 EP 驱动的 all-to-all 下，总会存在一些 scheduling 妥协。

### DualPipeV — the refinement

Sea AI Lab（2025）观察到，当 EP comm overlap 不是重点时，2x 参数复制是浪费的。他们的 DualPipeV schedule 将 bidirectional injection 折叠进一个 “V-shape” schedule 中，在单份参数副本上运行。Bubble 比 DualPipe 略大，但内存节省非常可观。DeepSeek 在其 open-source DualPipe implementation 中采用 DualPipeV 作为 EP-off mode。

取舍如下：

| Feature | DualPipe | DualPipeV | 1F1B | Zero Bubble |
|---------|---------|-----------|------|------------|
| 每个设备的参数副本 | 2 | 1 | 1 | 1 |
| Bubble vs micro-batches | constant | small growth | grows | grows |
| Compute-comm overlap | full | partial | minimal | partial |
| Use when | EP-heavy MoE | dense or EP-light | baseline | any pipeline |

### 对 14.8T-token 运行意味着什么

DeepSeek-V3 的 pre-training 在 2,048 张 H800 GPUs 上消耗了 14.8T tokens，约 2.8M GPU-hours。如果使用朴素 1F1B，他们会因 pipeline bubbles 损失其中的 12-15%，也就是 340-420K GPU-hours，足够训练一个完整的 70B model。DualPipe 回收了其中大部分。没有内部日志，很难直接量化其贡献，但论文中的声明是训练平均 GPU 利用率超过 95%。

对于较小规模的运行（低于 1k GPUs），DualPipe 有些过度：pipeline bubbles 相对总成本更小，而且 dense-model training 很少触及 all-to-all 瓶颈。对于数千 GPU 规模的 frontier MoE training，它实际上是必需的。

### 它在 stack 中的位置

- 与 **FSDP**（Phase 10 · 05）互补。FSDP 将 model parameters 分片到 ranks 上；DualPipe 调度 ranks 上的计算。二者可以结合。
- 与 **ZeRO-3** gradient sharding 兼容。两份副本复制的 bookkeeping 需要与 ZeRO 的 sharded gradients 配合。
- 需要针对具体 cluster topology 调优的 **custom all-to-all kernels**。DeepSeek 的 open-source kernels 是参考实现。

## 使用它
`code/main.py` 是一个 pipeline schedule simulator。它接受 `(P, n_micro_batches, schedule)`，并打印 1F1B、Zero Bubble、DualPipe 和 DualPipeV 各自的 stable-phase utilization。它是一个教学工具：数字与论文中的定性主张一致，但不是关于生产实测加速的声明。

这个 simulator 的价值在于：用不同的 P 和 micro-batch counts 运行它，观察 1F1B 的 bubble fraction 如何增长，而 DualPipe 不会。

真实训练运行的集成考虑：

- 选择一个能被你的 micro-batch count 整除的 pipeline-parallel depth。
- 确保你的 expert-parallel mesh 支持 bidirectional all-to-all。DeepSeek 的 kernels 是参考。
- 第一次实现时，预期会在 schedule 本身上花一周调试时间。Bookkeeping 很繁琐。
- 监控每个 rank 的 GPU 利用率，而不只是总体利用率。DualPipe 的收益来自让拖慢进度的 ranks 更紧凑。

## 交付它
本课会生成 `outputs/skill-dualpipe-planner.md`。给定一个 training cluster specification（GPU 数量、topology、interconnect、model shape），它会推荐 pipeline parallelism strategy、应使用的 scheduling algorithm，以及目标规模下的预期 bubble fraction。

## 练习
1. 在 `(P=8, micro_batches=16, schedule=dualpipe)` 和 `(P=8, micro_batches=16, schedule=1f1b)` 上运行 `code/main.py`。计算 GPU utilization 差异，并将其表示为每百万 training tokens 回收的 GPU-hours。

2. 手工绘制 `(P=4, micro_batches=8, schedule=dualpipe)` 的 schedule table。用 micro-batch ID 和方向标记每个时间槽。找出第一个没有 bubbles 的时间槽。

3. 阅读 DeepSeek-V3 technical report（arXiv:2412.19437）的 Figure 5。找出 DualPipe forward chunk 中 all-to-all dispatch 的 overlap window。解释 compute schedule 如何隐藏它。

4. 计算 DualPipe 对一个 P=8 pipeline stages 的 70B dense model，以及一个 P=16 pipeline stages 的 671B MoE model 的 2x 参数开销。说明为什么 MoE 情况下的开销比例更小（大多数参数是 experts，并且被分片到大型 EP group 上）。

5. 将 DualPipe 与 Chimera（2021 年的一个竞争性 bidirectional scheduler）进行比较。使用论文 Section 3.4 作为参考，找出 DualPipe 添加而 Chimera 没有的两个具体性质。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Pipeline bubble | “每个 rank 的空闲时间” | pipeline stage 等待其输入或 Gradient 时浪费的 GPU cycles |
| 1F1B | “默认 pipeline schedule” | one forward / one backward 交错调度；DualPipe 击败的 baseline |
| Zero Bubble | “Sea AI Lab 2023” | 将 backward 拆成 B（input Gradient）和 W（weight Gradient）；几乎完全收紧 pipeline |
| DualPipe | “DeepSeek-V3 schedule” | bidirectional pipeline + compute-comm overlap；bubbles 不随 micro-batch count 增长 |
| DualPipeV | “Cut-in-half” | V-shape 改进版，以略大的 bubbles 为代价去掉 2x 参数复制 |
| Chunk | “pipeline work 的单位” | 一个 micro-batch 通过一个 pipeline stage 的 forward 或 backward pass |
| All-to-all dispatch | “把 tokens 发送给 experts” | 将 tokens 路由到其分配的 MoE experts 的跨节点通信 |
| All-to-all combine | “把 expert outputs 带回来” | MLP 之后收集 expert outputs 的跨节点通信 |
| Expert Parallelism (EP) | “Experts across GPUs” | 将 MoE experts 分片到 ranks 上，使不同 GPUs 持有不同 experts |
| Pipeline Parallelism (PP) | “Layers across GPUs” | 将 model layers 分片到 ranks 上；DualPipe 调度的维度 |
| Bubble fraction | “浪费的 GPU 时间” | (bubble_time / total_time)；DualPipe 推向零的比例 |

## 延伸阅读
- [DeepSeek-AI — DeepSeek-V3 Technical Report (arXiv:2412.19437), Section 3.3.2 and Figure 5](https://arxiv.org/abs/2412.19437) — 主要 DualPipe 参考资料
- [DeepSeek — DualPipe GitHub repository](https://github.com/deepseek-ai/DualPipe) — open-source reference implementation，包含 DualPipeV（Cut-in-half）mode
- [Qi et al. — Zero Bubble Pipeline Parallelism (arXiv:2401.10241, Sea AI Lab 2023)](https://arxiv.org/abs/2401.10241) — Zero Bubble 前身
- [Sea AI Lab — DualPipe could be better without the Dual](https://sail.sea.com/blog/articles/63) — 影响 DeepSeek EP-off mode 的 DualPipeV 分析
- [Narayanan et al. — PipeDream / 1F1B (arXiv:1806.03377, 2018-2021)](https://arxiv.org/abs/1806.03377) — DualPipe 对比的 1F1B schedule
- [Huang et al. — GPipe (arXiv:1811.06965, 2018)](https://arxiv.org/abs/1811.06965) — 原始 pipeline parallelism 论文和 bubble 问题
