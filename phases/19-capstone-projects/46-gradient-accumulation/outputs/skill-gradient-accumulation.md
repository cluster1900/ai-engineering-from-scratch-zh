---
name: gradient-accumulation
description: 通过缩放 micro-batch Loss，并在每个窗口只执行一次 Optimizer step，以大于设备内存可容纳的 effective batch 进行训练。
version: 1.0.0
phase: 19
lesson: 46
tags: [training, batch-size, distributed, scaling]
---

## 何时使用

Effective batch 是平滑 Gradient 并匹配 learning rate schedule 的杠杆。当你无法在一次 forward pass 中承载它时，这就是对应的配方。

## 配方

1. 将 `micro_batch` 选为既能放入内存、又能让 accelerator 饱和的最大大小。
2. 从 learning rate schedule 中选择 `effective_batch`。
3. 设置 `accum_steps = effective_batch // (micro_batch * world_size)`，并断言它可以整除。
4. 对每个 micro batch：`loss = criterion(model(x), y) / accum_steps; loss.backward()`。
5. 对非最后一个 micro，进入 `model.no_sync()`，以跳过 DDP 中的 Gradient all-reduce。
6. 最后一个 micro batch 之后，运行一次 `optimizer.step()`。在下一个窗口前清零 Gradient。
7. Optimizer state 每个 effective batch 推进一次；learning rate schedule 每个 effective batch tick 一次。

## Logging

每个 effective step 输出一条小型 JSON 记录，包含 `samples_per_sec`、`median_step_ms`、`sync_calls`、`accum_steps`、`effective_batch`。没有它，成本权衡是不可见的。

## Failure modes

- 忘记 `/ accum_steps` 缩放：Gradient 会放大 N 倍。
- 在窗口中途 step：parameter 会漂移。
- 每个 micro batch 都同步：网络受限，却没有统计收益。
- 与 mixed precision unscaling 混用：只缩放未缩放的 Loss。
