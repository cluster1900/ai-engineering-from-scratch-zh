# Pipeline Parallel 与 Bubble 分析

> Tensor parallelism 把矩阵乘法切到多个 rank 上。Pipeline parallelism 把模型切到多个 rank 上，每个 rank 一个 stage。Microbatch 流过 pipeline。首尾的空闲时间就是 bubble；把它压下去，就是整门手艺。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 19 Track C lessons 42-49
**Time:** ~90 分钟

## 学习目标

- 把一个顺序模型拆成 N 个 stage，并在 N 个 rank 上模拟 forward pipeline。
- 用 GPipe 调度（先只做 forward 填满，再 backward）让 M 个 microbatch 过管，并计算 bubble 比例。
- 与 Megatron-LM、PipeDream 使用的交错 1F1B 调度比较 bubble。
- 论证 stage 分配：每 stage 算力相等，比每 stage 参数量相等更重要。

## 问题

fp16 下的 70B 参数模型，光参数就要 140 GB。没有任何消费级 GPU 装得下。ZeRO-3 会把参数分片到各个 rank，但每个 forward step 仍要让每个 rank allgather 完整一层，每层付出 $\log(N)$ 跳。Pipeline parallel 换一条路：把模型切成 N 个 stage，每个 rank 放一个。Layer 1 的 forward 在 rank 0 做完，把激活张量交给 rank 1；rank 1 跑 layer 2 再交给 rank 2；以此类推。Backward 反向流回。内存近似线性下降，因为每个 rank 只持有一个 stage；计算是串行的，这就是 bubble 问题。

Bubble 是 pipeline 开头的空闲（等第一个 microbatch 到达最后一 stage）和结尾的空闲（等最后一个 microbatch 回抽）。M 个 microbatch、N 个 stage 时，每 stage 的 bubble 比例是 $(N-1)/(M+N-1)$。M=8、N=4 时是 27%；M=64、N=4 时是 4.5%。每个 step 的 microbatch 越多，bubble 越小，这意味着每个 microbatch 的 batch size 更小——这正是驱动 microbatch 设计的约束。

## 概念

```mermaid
flowchart LR
  R0[rank 0: stage 0 / layer 0] --> R1[rank 1: stage 1 / layer 1]
  R1 --> R2[rank 2: stage 2 / layer 2]
  R2 --> R3[rank 3: stage 3 / loss]
  R3 -.backward.-> R2
  R2 -.backward.-> R1
  R1 -.backward.-> R0
```

### GPipe 调度

先用全部 M 个 microbatch 把 pipeline 的 forward 填满，再开始任何 backward；然后反向排空。每个 microbatch 的激活必须留到它的 backward，所以内存随 M 线性增长。Forward 占 M+N-1 个周期，backward 再占 M+N-1 个。每 stage 的有效工作是 2M 个周期；每 stage 的 bubble 是 2(N-1) 个周期。当每次 forward 与 backward 各占一个时间单位时，bubble 比例是 $(N-1)/(M+N-1)$。把 M 取得远大于 N，就能把 bubble 藏起来。

### 1F1B 调度

交错：某个 microbatch 的 forward 一到最后一 stage，就立刻开始它的 backward 并让它往回流。每个 stage 交替做一次 forward、一次 backward。Bubble 仍是 N-1，但激活内存由 pipeline 深度界定，而不由 microbatch 数量界定。生产 pipeline 用 1F1B（Megatron、PipeDream）。本课先实现更简单的 GPipe，把 1F1B 留作练习。

### 为什么每 stage 算力相等很重要

若 stage 0 要 50 ms、stage 1 要 100 ms，每个周期都会卡在 stage 1 上。其他 stage 每个周期空等 50 ms，等 stage 1 放行。参数量相等是错轴：transformer 的算力由每层的 attention 加 MLP 主导，embedding 层参数多但算力少。Stage 分配应按每 stage 的 FLOPs 均衡，而不是按权重数均衡。

### Microbatch 与 batch

Pipeline 跑 M 个、每个大小为 B 的 microbatch。有效 batch size 是 $M \cdot B$。一个 pipeline step 结束时的梯度，是对合并后 $M \cdot B$ 个样本的梯度。Bubble 比例取决于 M；优化器看到的是 $M \cdot B$。调 M，就是在 bubble（M 大则更低）与每 microbatch 内存（GPipe 下 M 大则激活内存更高）之间权衡。

```figure
cd-pipeline-bubble
```

## 构建它

`code/main.py` 实现：

- `PipelineStage`：一个小的 `nn.Module`，持有一个 stage 的参数，并暴露 `forward(activation)`。
- `Pipeline(stages, num_microbatches)`：在模拟 stage 上用每 stage 的模拟墙钟编排 GPipe 调度。
- `bubble_fraction(num_stages, num_microbatches)`：闭式公式 $(N-1)/(M+N-1)$。
- 一个 4-stage 演示：打印按 microbatch 的轨迹，以及测得的 bubble 比例。

运行：

```bash
python3 code/main.py
```

输出：按 stage×microbatch 的 Gantt 图，以及相对闭式预测的 bubble 百分比。

## 生产环境中的实践

三种模式能把 pipeline parallel 硬化到可上线的程度。

**Activation checkpointing 与 pipeline 搭配。** GPipe 上有 M 个 microbatch 在飞时，激活内存是单个 microbatch 的 M 倍。Activation checkpointing 在 backward 时重算 forward，用算力换内存；两者结合，长序列上的 pipeline 才可行。

**Stage 均衡靠测量，不靠假设。** 生产团队会先跑一轮 profiling，在目标硬件上测真实的每层算力（FLOPs 与墙钟），再按测量结果分区。Megatron-LM 的 `--num-layers-per-stage` 接受列表，以便各 stage 每层成本不同时使用不均匀的层数。

**Send/recv 调度必须避免死锁。** 若每个 stage 都先 send 再 recv，线路上会死锁。标准修法是交错：偶数 rank 的 stage 先 send 再 recv，奇数 rank 的 stage 先 recv 再 send。本课显式调度各个 rank，好让这个模式可见。

## 使用它

生产中的用法：

- **Megatron-LM。** 大规模 pipeline parallel 的参考实现。使用 1F1B，并支持 tensor + pipeline + data parallel 组合。
- **DeepSpeed Pipeline。** 与 ZeRO 集成；ZeRO-1 + pipeline 是许多最大开源模型的常见组合。
- **PyTorch Pipe。** PyTorch 原生的 pipeline 包装，基于 `torch.distributed.pipeline.sync.Pipe`。

## 交付它

第 80 课把每 stage 的参数分片存进分片 checkpoint。第 81 课在端到端演示里组合 DDP + ZeRO + pipeline（精神上如此；演示为了运行时仍保持 pipeline 为模拟）。

## 练习

1. 实现 1F1B，验证 bubble 比例与 GPipe 一致，但激活内存有上界。
2. 在更深模型上分析真实每 stage 时间，并按测得的墙钟重新均衡 stage。
3. 跨 pipeline microbatch 做梯度累积，检查梯度等于等价全 batch forward 的梯度。
4. 给 pipeline 配上 activation checkpointing，测量内存下降与算力代价。
5. 把 pipeline 与 DDP 结合（每个 pipeline rank 在 data-parallel 组中复制），并推理二维调度。

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Pipeline | “沿深度的模型并行” | 每个 rank 一个 stage，激活逐 stage 流动 |
| Bubble | “Pipeline 空闲时间” | 首尾各 (N-1) 步，部分 stage 没有工作 |
| Microbatch | “Batch 的切片” | 一次 forward/backward 单元；M 增大则 bubble 缩小 |
| GPipe | “先填满再排空” | M 次 forward 全部完成后再 backward；激活内存高 |
| 1F1B | “交错调度” | 每 stage 一次 forward 一次 backward；激活内存有界 |

## 延伸阅读

- [Huang et al, GPipe: Efficient Training of Giant Neural Networks](https://arxiv.org/abs/1811.06965)
- [Narayanan et al, PipeDream: Generalized Pipeline Parallelism for DNN Training](https://arxiv.org/abs/1806.03377)
- [Megatron-LM pipeline parallel docs](https://github.com/NVIDIA/Megatron-LM)
- Phase 19 Lesson 76 - the send/recv primitives the schedule uses
- Phase 19 Lesson 78 - ZeRO is orthogonal to pipeline and often combined
