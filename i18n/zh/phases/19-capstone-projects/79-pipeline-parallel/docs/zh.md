# 管道与泡相对

> 矩乘法切割多个级别上――管道平行性 把模型切割多个级别上,每个级别一个阶段――微型电池流过管道――首尾的空时间就是泡;把它压下来,就是整门手艺――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 19 Track C lessons 42-49
**Time:** ~90 分钟

## 学习目标

- 把一个顺序模型拆成N个阶段,并将N个阶段上模拟前进管道.
- 用GPipe调度(先只做前面填满,再倒退)让M个微过管,并计算泡比如――
- 与Megatron-LM、PipeDream 使用的交错 1F1B 调度比较泡──
- 论证阶段 分配:每阶段 算力相等,比每阶段 参数相等更重要.

## 问题

由于它是个微型,它可以将其分开到每个级别,但每一步都需要让每个级别都聚集在一起 完整的层次,每个层次都付出$\log(N)$跳──管道平行 换一条路:把模型切成N个阶段,每个阶段 放一个── 1层的前进 在排列 0完成,把激活张量交给排列 1;排列 1 跑层 2 再交给排列 2;以此类推推── 倒向反向流回──内存近似线性下降,因为每个阶段只有一阶段;计算是串行,这就是泡 问题──

泡是管道 开头的空(等第一个微到达最后一个阶段) 和结尾的空(等最后一个微回抽) ⋅M个微、N个阶段 时,每个阶段的泡 比如是$(N-1)/(M+N-1)$△M=8、N=4 时是27%,M=64、N=4 时是4.5%──每步的微型洗器 越多,泡越小,这意味着每个微型洗器的批量大小更小.

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

### 调度

先用全部M个微包 把管道的前进填满,再开始任何向后;然后反向排空――每个微包的激活必须留在它的后退,所以内存随着M 线性增长而成――前进占M+N-1个周期,后退再占M+N-1个周期――每个阶段的有效工作是2M个周期;每个阶段的泡是2(N-1) 个周期――当每次占进和回的时间单位时,泡比如是$(N-1)/(M+N-1)$把M 取得远大于N,就能把泡藏起来.

### 调度

交错:某个微型电池的前进 一到最后一个阶段,就立刻开始向后并让它往回流. 每个阶段都交换一次向前一次向后. 泡仍然是N-1,但由管道激活内存深度界定,而不是由微型电池数量界定.

### 为什么每一个阶段的计算能力等等都很重要

如果阶段0需要50ms,1阶段100ms,每个周期都卡在阶段1上.其他阶段 每个周期空等50ms,等阶段1放行.参数相等是错轴:变压器的算力由每个层的注意力加上MLP主导,嵌入层参数多但算力少.

### 微分组与分组

管道运行M个个,每个小为B的微型.有效的批量大小是$M \cdot B$△一个管道步骤 结束时的梯度,是对合并后$M \cdot B$个样本的梯度──泡比如取决于M;优化器看到的是$M \cdot B$△调 M,就是在泡中 (M 大则更低) 与每微包内存之间权衡──

```figure
cd-pipeline-bubble
```

## 构建它

`code/main.py`实现:

- `PipelineStage`个小的`nn.Module`没有一个阶段的参数,并暴露`forward(activation)`,我知道.
- `Pipeline(stages, num_microbatches)`                                                                                                                                                                   
- `bubble_fraction(num_stages, num_microbatches)`关式公式$(N-1)/(M+N-1)$,我知道.
- 一个4阶段演示:按微型的轨迹打印,以及测试的泡比如:

运行:

```bash
python3 code/main.py
```

输出:按阶段×微分批的甘特图,以及相对的闭式预测泡百分比.

## 生产环境中的实践

三种模式可以将管道平行硬化到可上线的程度.

**Activation checkpointing 与 pipeline 搭配。**在飞行时,激活内存是单个微量内存的M倍――激活检查点在倒退时重算前进,使用算力换内存;两者结合,长序列上的管道才可行――

**Stage 均衡靠测量，不靠假设。**生产团队会先进行一轮的配置,测试目标硬件上真实的每层算力,再按测量结果分区――Megatron-LM的`--num-layers-per-stage`接受列表,以便各阶段使用不均的层次数,每层成本不同时.

**Send/recv 调度必须避免死锁。**如果每个阶段都先发回复,线路上会死锁――标准修法是交错:偶数级别的阶段先发回复,奇数级别的阶段先发回复,本课显然调整各级别,让这个模式可见――

## 使用它

生产中的使用法:

- **Megatron-LM。**大规模管道平行的参考实现──使用1F1B,并支持子+管道+数据平行组合──
- **DeepSpeed Pipeline。**与ZERO集成;ZRO-1+管道是许多最大的开源模型的常见组合.
- **PyTorch Pipe。**包装,基于 `torch.distributed.pipeline.sync.Pipe`,我知道.

## 交付它

第80课把每个阶段的参数分片存进分片检查点 第81课在端到端演示里组合DDP + ZeRO +管道精神(上这样演示为了运行而保持管道为模拟)

## 练习

1. 实现1F1B,验证泡 比例与GPipe 一致,但激活内存有上界.
2. 在更深层次的模型上分析真实每一个阶段时间,并按测量的墙钟重新平衡阶段.
3. 通过管道微型批量做梯度累积,检查梯度等等等价格全批量前进的梯度.
4. 给管道配上激活检查点,测量内存下降与算力代价.
5. 把管道与DP结合 (),并推理二维调度.

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
- 第19阶段 第76课 - 时间表使用的发送/回收原始函数
- 阶段19课程78 - ZeRO与管道直角,通常是结合的
