# 双管平行

> 采用2.048张H800GPU 训练,MoE专家分布在多个节点上――跨节点专家通讯 每1GPU-小时的计算需要1GPU-小时的通信――GPU 时间的半个时间处于空――DualPipe(DeepSeek,2024年12月) 是一种双向管道,它将向前和向后计算与它们触发的通讯重叠起来――泡减少,吞吐量提高,而且保留两个模型参数副本名称 (dual源) 在专家平行主义课程中已经将专家分为各个阶段的情况很低成本――本是学习类型的解说,介绍双管 实际做什么,以及如何进而进的价格,以及对双管 实验室 2 微型的改进,更为微型的代价.

**Type:** Learn
**Languages:** Python (stdlib, schedule simulator)
**Prerequisites:** Phase 10 · 05（distributed training、FSDP、DeepSpeed），Phase 10 · 14（open-model architectures 和 MoE）
**Time:** ~60 minutes

## 学习目标
- 解释双管前后部分的四个组成部分,以及为什么每个部分都有自己的重叠窗口.
- 解释大规模的管道泡 问题,以及 泡免费 在实践中和在营销语境中的区别
- 手工跟踪 8 个PP级和 16 个微批次的双管时间表,并确认前流和反流 会填满彼此的空槽位──
- 解释DualPipeV(海人工智能实验室,2025) 的取舍:在专家平行不活跃时,以略大的泡为代价,掉掉2x 参数复制──

## 问题
在2KH800GPU上训练671BMoE模型会遇到三个相互叠加的瓶:

1. **内存压力。**每个GPU都有一个模型的一部分. 序列8k,61层,128头. 下部激活内存非常大.
2. **Pipeline bubbles。**传统的管道平行性 (GPipe、1F1B) 将让GPU等待其阶段的输入或渐进的时刻处于空──8个阶段.
3. **跨节点 all-to-all。**使用专家平行,MOE将专家分为多个节点. 每次前进传输都会发射一次到所有,用于发送代币给各自的专家,然后还会发射一次到所有.

这些问题都有单独的解决方案:记忆用梯度检查点,管道泡用零泡 (Zero Bubble) (海人工智能实验室,2023),所有用专家并行通信核子――双管做的是让它们协同工作――这个时间表在单个前后的部分内重叠计算和通信,同时从管道 两端注入微批,并使用由此产生的时间表将隐藏在计算窗口中――

报告结果:在深度搜索V3的14.8T标记训练运行中,管道泡几乎消失,GPU利用率超过95%──

## 概念
### 管道平行性 复习

将一个N层模型分成P个设备上.`i`具有层次的`i * N/P .. (i+1) * N/P - 1`△一个微批次从设备0到P-1 执行向前,然后从P-1到0 执行向后――每个设备只有在前一个设备发送其输出后才能开始自己的前进阶段;也只有在下游设备发送上游 之后才能开始向后――

GPipe(Huang等., 2019) 一次调度一个微批次,这会浪费大部分的GPU时间──1F1B(Narayanan等., 2021) 为多个微批次交错执行前进和后进的传递──零泡(Qi等., 2023) 将后进的传递 拆成两部分:后进的输入(B) 和后进的权重(W),并调度它们来填补泡──经过零泡后,管道已经几乎紧──

双管是下一步.

### 思考1: 碎片分解

每个前面的部分被拆分成四个组成部分:

- **Attention。**关注 输出投影
- **All-to-all dispatch。**将代币发送给各自的专家.
- **MLP。**专家计算.
- **All-to-all combine。**带来了专家输出的跨节点通信.

一个倒退的部分会加入这些部分的渐进式版本――双管对它们进行调整,使所有的发送与下一个部分的注意力 计算并行发生,并使所有的结合与后续部分的MLP 计算并行发生――

### 思路2:双向安排

大多数管道时间表从0阶段注入微批次,并流向P-1阶段.

为了实现这一点,设备`i`必须同时拥有早期管道层`i`和后期管道层`P - 1 - i`这是双管中的双管的部分:每个设备保留两个需要服务的模型层,一个用于每个方向. 在DeepSeek-V3的规模下,这是2倍的参数复制成本.

关键在于,一个方向前流和另一方向后流会恰好在单向时间表中产生泡的位置重叠――泡消失――

### 一个手动追踪的时间表

考虑P = 4 列、8 微批,分为 4 个前进 / 4 个倒车──时间从左到右移动;行是设备列──

```
           Time →
rank 0:  F1 F2 F3 F4  F5R F6R F7R F8R  B1 B2 B3 B4  ...
rank 1:     F1 F2 F3  F4/F5R F6R F7R   B1 B2 ...
rank 2:        F1 F2  F3/F5R F4/F6R    B1 ...
rank 3:           F1  F2/F5R F3/F6R    ...
```

读取 F4/F5R 这种记法:在同一时间槽中,同时运行微批4的前进(在管道中从左到右) 和微批5的前进(从右到左) .这是操作层面的含义.

在排列2处,交叉流更早重叠;在排列0处和P-1处,它们最晚重叠.在时间表的稳定中阶段,每个排列都运行 X 方向向前,并与 Y 方向向后重叠.计算保持繁忙.

### 泡会计

标准 1F1B管道泡(每个级别 浪费的时间):

```
bubble_1F1B = (P - 1) * forward_chunk_time
```

零泡 改进会降低它,但不能降到零. 在稳定阶段,如果微批量量可以被 2 倍的管道深度 整除,就有零泡. 在稳定阶段以外,

营销语境: 泡无──技术语境:泡不随微批量增长──海人工智能实验室的后续分析(双管V / 切成半) 表示,只有在专家平行不是瓶时才完全零泡;在 EP 驱动的全到所有 下,总会存在一些安排 妥协──

###       

海洋AI实验室(2025) 观察到,当EP通信重点时不是重点时,2x 参数复制是浪费的――他们的双管V计划将双向注射 折叠成一个V形计划中,在单份参数副本上运行――泡比双管 略大,但内存节省非常可观――DeepSeek 在其开源双管实现中采用双管V作为EP-off模式――

取舍如下:

| Feature | DualPipe | DualPipeV | 1F1B | Zero Bubble |
|---------|---------|-----------|------|------------|
| 每个设备的参数副本 | 2 | 1 | 1 | 1 |
| Bubble vs micro-batches | constant | small growth | grows | grows |
| Compute-comm overlap | full | partial | minimal | partial |
| Use when | EP-heavy MoE | dense or EP-light | baseline | any pipeline |

### 对148T代币运行意味着什么?

果版的预训练在2,048张H800GPU上消耗了14.8T代币,约2.8MGPU-小时. 如果使用简单的1F1B,他们会因管道泡损失其中12-15%,也就是340-420KGPU-小时,足以训练一个完整的70B模型.

对于较小规模运行 (比1k GPU低),DualPipe有些过度:管道泡相对于总成本更小,而且密集型式训练很少触及所有的瓶──对于数千个GPU规模的边界MOE训练,实际上是必需的──

### 它在堆中位置

- 与**FSDP**(阶段10 · 05)互补――FSDP将模型参数分分为上等级;双管调度等级上的计算――二者可以结合――
- 与**ZeRO-3**格拉迪ент分化 兼容──两份副本复制的会计管理 需要与 ZeRO 的分化分化 配合──
- 需要针对特定集群拓 调优的**custom all-to-all kernels**深度搜索的开源内核是参考实现的.


```figure
expert-capacity
```

## 使用它
`code/main.py`是一个管道时间表模拟器.`(P, n_micro_batches, schedule)`印发1F1B、零泡、双管和双管V的各个稳步阶段利用――它是一个教学工具:数字与论文中的定性主张一致,但不是关于生产实测加速的声明――

这款模拟器的价值在于:使用不同的P和微批量计算运行它,观察1F1B的泡分数如何增长,而双管不会.

实际训练运行的集成考虑:

- 选择一个能被你的微批次数 整除的管道平行深度.
- 确保你的专家并行网 支持双向的所有至所有.
- 预期会在时间表上.
- 监控每个级别的GPU利用率,而不是总体利用率.

## 交付它
本课会生成`outputs/skill-dualpipe-planner.md`△给定一个训练集群规范,它将推管道平行化战略,应使用的规划算法以及目标规模下的预期泡分数.

## 练习
1. 在`(P=8, micro_batches=16, schedule=dualpipe)`和 `(P=8, micro_batches=16, schedule=1f1b)`上运行 `code/main.py`△计算GPU使用率差异,并将其表示为每百万训练代币回收的GPU小时.

2. 工艺绘画`(P=4, micro_batches=8, schedule=dualpipe)`时间表: 通过微批量ID和方向标记每个时间槽,找到第一个没有泡的时间槽.

3. 阅读深度搜索V3技术报告 (arXiv:2412.19437) 的图5──找出双管前行部分 中全向发送的重叠窗口──解释计算时间表 如何隐藏它──

4. 计算双管对一个P=8管道阶段的70B密集模型,以及一个P=16管道阶段的671B MoE模型的2x参数开销.说明为什么MoE情况下开销比例更小.

5. 将双管与马 (二方向调度器) 的竞争性2021年进行比较.

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
- [DeepSeek-AI — DeepSeek-V3 Technical Report (arXiv:2412.19437), Section 3.3.2 and Figure 5](https://arxiv.org/abs/2412.19437) 主要双管 参考资料
- [DeepSeek — DualPipe GitHub repository](https://github.com/deepseek-ai/DualPipe)开源参考实现,包含双管V(中断模式
- [Qi et al. — Zero Bubble Pipeline Parallelism (arXiv:2401.10241, Sea AI Lab 2023)](https://arxiv.org/abs/2401.10241)零泡前身
- [Sea AI Lab — DualPipe could be better without the Dual](https://sail.sea.com/blog/articles/63) 影响 DeepSeek EP-off模式的 DualPipeV 分析
- [Narayanan et al. — PipeDream / 1F1B (arXiv:1806.03377, 2018-2021)](https://arxiv.org/abs/1806.03377) 双管对比的1F1B时间表
- [Huang et al. — GPipe (arXiv:1811.06965, 2018)](https://arxiv.org/abs/1811.06965) 原始管道平行论文和泡问题
