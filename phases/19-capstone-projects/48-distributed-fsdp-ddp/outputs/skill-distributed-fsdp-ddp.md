---
name: distributed-fsdp-ddp
description: 使用从零实现的 DDP wrapper 和 FSDP 参数分片草图，在 gloo 或 nccl backend 上启动多 rank 训练。
version: 1.0.0
phase: 19
lesson: 48
tags: [distributed, ddp, fsdp, collectives]
---

## 何时使用

模型能放进单个设备，但你需要更高吞吐量（DDP）。模型放不进单个设备（FSDP）。两种情况都一样：用同一条代码路径搭建多 rank 训练。

## 启动 process group

```python
os.environ["MASTER_ADDR"] = "127.0.0.1"
os.environ["MASTER_PORT"] = str(port)
dist.init_process_group(backend="gloo", rank=rank, world_size=world_size)
```

`gloo` 是 CPU backend；`nccl` 是 GPU backend。两者实现相同的 collective surface。

## 包装模型

1. 在 rank 0，根据你的 seed 构建模型。
2. 用 DDP shell 包装它。
3. shell 的 `__init__` 会对每个参数和 buffer 调用 `dist.broadcast(p.data, src=0)`。
4. 每次 `loss.backward()` 后，trainer 调用 `sync_grads()`。
5. `sync_grads()` 调用 `dist.all_reduce(p.grad, op=SUM)`，再调用 `p.grad.div_(world_size)`。
6. 每个 rank 使用相同的平均后 Gradient 执行 Optimizer step。

## 分片参数（FSDP 草图）

1. 展平每个参数，pad 到 `world_size` 的倍数。
2. 在本地保留你的 shard；释放其余部分。
3. forward 前，调用 `dist.all_gather(...)` 在每个 rank 上重建完整 tensor。
4. forward 后，丢弃完整 tensor。

## 失败模式

- 跳过 broadcast：各 rank 从不同初始化开始，并且静默发散。
- sum 后忘记除法：Gradient 被 world_size 放大，Optimizer step 过大。
- checkpoint 使用跨设备 rename：不是 atomic；和第 47 课是同一个陷阱。
- 在同一个 collective 中混用 CPU 和 CUDA tensor：backend 不匹配，运行会 hang。
