---
name: prompt-distributed-training-planner
description: 根据模型大小和可用硬件规划一次 distributed training run
version: 1.0.0
phase: 10
lesson: 5
tags: [distributed-training, fsdp, deepspeed, tensor-parallelism, pipeline-parallelism, scaling]
---

# Distributed Training 规划器

在为大型语言模型规划一次 distributed training run 时，使用这个框架来确定 parallelism strategy、memory budget、communication overhead 和 expected throughput。

## 输入要求

提供：
- **模型大小**（以 billions 为单位的参数量）
- **目标训练 Token**（以 trillions 为单位）
- **可用 GPU**（类型：A100/H100/H200，数量，互连：NVLink/InfiniBand）
- **GPU memory**（A100/H100 为 80GB，H200 为 141GB）
- **Nodes**（每个 node 的 GPU 数量，node 数量）
- **预算约束**（最大美元成本，最大 wall-clock time）

## 步骤 1： Memory Budget

计算每个 GPU 上各组件的内存：

| Component | Formula | FP16 | FP32 |
|-----------|---------|------|------|
| Weights | params x bytes_per_param | params x 2 | params x 4 |
| Adam Optimizer (m + v) | params x 4 x 2 | 始终为 8 bytes/param | 8 bytes/param |
| Gradient | params x bytes_per_param | params x 2 | params x 4 |
| Activations（估算） | seq_len x batch x hidden x layers x 2 | 取决于情况 | 取决于情况 |

如果总量超过 GPU memory，则需要 sharding。按顺序尝试：
1. ZeRO-1（仅 shard Optimizer）-- 通信成本最低
2. ZeRO-2（+ Gradient）-- 中等通信成本
3. FSDP/ZeRO-3（+ weights）-- 通信成本最高，但节省内存最多
4. 如果 activations 仍然过大，添加 activation checkpointing
5. 如果单个 layer 无法放入一块 GPU，添加 tensor parallelism

## 步骤 2: Parallelism 策略

### Decision Tree

1. **一个 layer 能否放入一块 GPU？**
   - 不能：你需要 tensor parallelism。设置 TP = 2、4 或 8（在一个 node 内）。
   - 能：跳过 tensor parallelism。

2. **完整模型（带 sharding）能否放入一个 node 内的 GPU？**
   - 不能：你需要 pipeline parallelism。设置 PP = number of nodes / groups。
   - 能：跳过 pipeline parallelism。

3. **还剩多少 GPU 可用于 data parallelism？**
   - DP = total_gpus / (TP x PP)

4. **data parallel group 内使用什么 sharding level？**
   - 从 FSDP (ZeRO-3) 开始。如果通信成为瓶颈，则降到 ZeRO-2 或 ZeRO-1。

### 典型配置

| Model Size | Total GPUs | TP | PP | DP | Sharding |
|-----------|-----------|----|----|-----|----------|
| 7B | 8 | 1 | 1 | 8 | FSDP |
| 13B | 16 | 2 | 1 | 8 | FSDP |
| 70B | 64 | 8 | 1 | 8 | FSDP |
| 70B | 128 | 8 | 2 | 8 | FSDP |
| 405B | 16,384 | 8 | 16 | 128 | FSDP |

## 步骤 3: 通信分析

估算每个训练 step 的通信量：

- **Data parallel (all-reduce)**：每步 2 x gradient_size x (N-1)/N
- **FSDP (all-gather + reduce-scatter)**：每步约 3 x weight_size x (N-1)/N（高于 DP）
- **Tensor parallel（每层 all-reduce）**：每步 2 x activation_size x num_layers（需要 NVLink）
- **Pipeline parallel (point-to-point)**：每个 stage 边界传递 activation_size（很小）

如果通信时间超过 compute time 的 20%，该策略就是 communication-bound。解决方案：
- Gradient accumulation（降低 all-reduce 频率）
- 将通信与计算重叠（FSDP 默认会这样做）
- 增大 micro-batch size（更好的 compute-to-communication ratio）
- 切换到通信更少的 sharding stage

## 步骤 4: Throughput and Cost Estimate

**每个训练 step 的 FLOPS：**
- Forward：约 2 x params x tokens_per_batch
- Backward：约 4 x params x tokens_per_batch（2x forward）
- Total：约 6 x params x tokens_per_batch

**训练时间：**
- total_flops = 6 x params x total_tokens
- time_seconds = total_flops / (num_gpus x gpu_tflops x 1e12 x utilization)
- 典型 utilization：35-45%（考虑通信、pipeline bubbles、内存开销）

**成本：**
- total_gpu_hours = num_gpus x time_seconds / 3600
- cost = total_gpu_hours x cost_per_gpu_hour

## 步骤 5：验证清单

启动前：

1. 每个 GPU 的 memory 在硬件限制内（保留 10% headroom）
2. Effective batch size 匹配目标（per_gpu_batch x DP x gradient_accumulation_steps）
3. Communication-to-compute ratio 低于 20%
4. Pipeline bubble fraction 低于 15%（有足够的 micro-batches）
5. Learning rate 已按 effective batch size 缩放
6. Checkpointing frequency 考虑了失败概率（大型 run 每 1-2 小时保存一次）
7. Gradient clipping 已设置（大型模型通常为 1.0）
8. Warmup steps 与总 step 数成比例（通常为总量的 0.1-1%）

## 红旗信号
- **TP > 8**：跨 node 的 tensor parallelism（通过 InfiniBand）几乎总是慢于 pipeline parallelism
- **Pipeline stages > 32**：即使有许多 micro-batches，bubble overhead 也会变得显著
- **Effective batch size > 10M tokens**：收益递减；可能损害收敛
- **Utilization below 30%**：communication-bound -- 重新评估 parallelism strategy
- **No activation checkpointing above 13B**：你会在 backward pass 期间耗尽内存
- **No gradient accumulation with small per-GPU batch**：Gradient noise 会增加；累积到 256+ samples 的 effective batch
