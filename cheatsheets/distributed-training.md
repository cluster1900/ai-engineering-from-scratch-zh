---
id: distributed-training
title: DDP, FSDP, ZeRO and Pipeline Parallel
code: DF
subtitle: 选择并行方式、估算内存、接好集合通信并修复卡死。CPU 上的 PyTorch gloo。
hue: 280
sources: phases/10-llms-from-scratch/05-scaling-distributed, phases/10-llms-from-scratch/19-dualpipe-parallelism, phases/19-capstone-projects/48-distributed-fsdp-ddp, phases/19-capstone-projects/76-collective-ops-from-scratch, phases/19-capstone-projects/77-data-parallel-ddp, phases/19-capstone-projects/78-zero-parameter-sharding, phases/19-capstone-projects/79-pipeline-parallel
source_hash: a601a24bdbc9c6e0
---

## 四种策略并排对比
type: comparison
span: 2
from: phases/10-llms-from-scratch/05-scaling-distributed/docs/en.md, phases/19-capstone-projects/48-distributed-fsdp-ddp/docs/en.md

| 维度 | DDP | FSDP 或 ZeRO-3 | 流水线 | 张量并行 |
|---|---|---|---|---|
| 切分 | batch | 参数、梯度、优化器 | 按层切分模型 | 每个权重矩阵 |
| 每张 GPU 内存 | 完整副本，不减少 | 每种状态的 1/N | 一组层 | 每层的一个切片 |
| 通信 | 梯度的 all-reduce | 每层 all-gather，reduce-scatter | 层边界处的激活 | 每次 matmul 后 all-reduce |
| 链路 | 与计算重叠 | 比普通 DP 多 | 低带宽，可跨节点 | 节点内 NVLink |
| 主要代价 | 内存 | 每次前向都要 gather | 流水线气泡 | 每层之后的延迟 |

## 各自的选用时机
type: concepts
from: phases/19-capstone-projects/48-distributed-fsdp-ddp/docs/en.md, phases/19-capstone-projects/78-zero-parameter-sharding/docs/en.md, phases/10-llms-from-scratch/05-scaling-distributed/docs/en.md, phases/10-llms-from-scratch/19-dualpipe-parallelism/docs/en.md

- **DDP**：模型放得进单个设备，数据集放不下。
- **FSDP**：模型也放不进单个设备。
- **ZeRO-1**：默认选择。带宽与 DDP 相同，内存随 N 线性下降。
- **ZeRO-2 或 ZeRO-3**：参数分片的内存也成了问题。
- **张量并行**：在节点内使用。需要快速的 GPU 间链路。
- **流水线**：跨节点使用。带宽需求低。
- **DualPipe**：数千 GPU 规模下、重度 EP 的 MoE。
- **DualPipeV**：稠密模型或轻度 EP 的模型。只有一份参数副本。

## ZeRO 各阶段
type: comparison
span: 2
from: phases/19-capstone-projects/78-zero-parameter-sharding/docs/en.md, phases/10-llms-from-scratch/05-scaling-distributed/docs/en.md

| 维度 | DDP | ZeRO-1 | ZeRO-2 | ZeRO-3 |
|---|---|---|---|---|
| 分片内容 | 无 | 优化器状态 | 优化器 + 梯度 | 优化器 + 梯度 + 参数 |
| 每个 rank 的内存 | params + grads + optim | params + grads + optim/N | params + grads/N + optim/N | params/N + grads/N + optim/N |
| 每步通信 | 1x allreduce | 1x reduce_scatter + 1x allgather | 1x reduce_scatter + 1x allgather | 每层 allgather 和 reduce_scatter |
| 节省 | 无 | 约减少 ~4x | 约减少 ~8x | 约减少 ~Nx |
| PyTorch FSDP 名称 | 未列出 | 未列出 | `ShardingStrategy.SHARD_GRAD_OP` | `FULL_SHARD` |

## 内存数字
type: concepts
from: phases/10-llms-from-scratch/05-scaling-distributed/docs/en.md, phases/19-capstone-projects/78-zero-parameter-sharding/docs/en.md

- **Adam 状态**：m 和 v 为 FP32。70B x 4 bytes x 2 = 560GB。
- **朴素混合精度**：每个 rank 16P 字节。
- **ZeRO-1**：4P + 12P/N 字节。N=8 时为 5.5P，下降 65%。
- **FSDP，8 张 GPU 上的 70B**：每张 GPU 105 GB，仍超过 80GB。
- **混合精度，7B**：从 112 GB 降到 84 GB。优化器仍为 FP32。
- **有效 batch 大小**：per_gpu_batch_size x N。

## 流水线调度
type: comparison
from: phases/10-llms-from-scratch/19-dualpipe-parallelism/docs/en.md, phases/10-llms-from-scratch/19-dualpipe-parallelism/code/main.py

| 维度 | 1F1B | Zero Bubble | DualPipe | DualPipeV |
|---|---|---|---|---|
| 参数副本数 | 1 | 1 | 2 | 1 |
| 气泡随 micro-batch 数 | 增长 | 增长 | 恒定 | 小幅增长 |
| 重叠 | 极少 | 部分 | 完全 | 部分 |
| 模拟器 | `bubble_1f1b` | `bubble_zero_bubble` | `bubble_dualpipe` | `bubble_dualpipev` |

## 集合通信
type: comparison
from: phases/19-capstone-projects/76-collective-ops-from-scratch/docs/en.md

| 维度 | Ring allreduce | Tree allreduce | Allgather | Reduce_scatter |
|---|---|---|---|---|
| 每个 rank 的字节数 | 2T(N-1)/N | T log2(N) | T(N-1)/N | T(N-1)/N |
| 步数 | 2(N-1) | 2 log2(N) | N-1 | N-1 |
| 适用场景 | T 大 | T 小、延迟高 | ZeRO 取消分片 | ZeRO 梯度分片 |
| 消息大小 | 约 ~1 MB 以上 | 约 ~1 MB 以下 | 任意 | 任意 |

## 在队列网格上做 ring allreduce
type: architecture
from: phases/19-capstone-projects/76-collective-ops-from-scratch/docs/en.md, phases/19-capstone-projects/76-collective-ops-from-scratch/code/main.py

```arch
node | r0 | 1,1 | rank 0 | owns chunk 0 | process
node | r1 | 2,1 | rank 1 | owns chunk 1 | process
node | r2 | 2,2 | rank 2 | owns chunk 2 | process
node | r3 | 1,2 | rank 3 | owns chunk 3 | process
edge | r0 | r1 | queue 0 to 1
edge | r1 | r2 | queue 1 to 2
edge | r2 | r3 | queue 2 to 3
edge | r3 | r0 | queue 3 to 0
```

## DDP worker 循环
type: annotated-code
lang: python
from: phases/19-capstone-projects/77-data-parallel-ddp/code/main.py

```python
dist.init_process_group(
    backend="gloo",
    init_method=f"file://{init_file}",  # file rendezvous
    rank=rank,
    world_size=world_size,
)
torch.manual_seed(SEED)  # same init on every rank
ddp = DistributedDataParallel(model, world_size=world_size)  # broadcasts params
for step in range(steps):
    offset = step * world_size * batch + rank * batch  # own slice
    optim.zero_grad(set_to_none=True)
    loss.backward()
    ddp.sync_grads()  # all_reduce SUM, then div_ by world_size
    optim.step()
```

## 集合通信调用
type: task-table
span: 2
from: phases/19-capstone-projects/48-distributed-fsdp-ddp/docs/en.md, phases/19-capstone-projects/77-data-parallel-ddp/code/main.py, phases/19-capstone-projects/78-zero-parameter-sharding/code/main.py, phases/19-capstone-projects/79-pipeline-parallel/code/main.py, phases/19-capstone-projects/77-data-parallel-ddp/docs/en.md

| 任务 | 代码 |
|---|---|
| 设置 rendezvous 端口 | `os.environ["MASTER_PORT"] = str(port)` |
| 启动 CPU 进程组 | `dist.init_process_group(backend="gloo", rank=rank, world_size=world_size)` |
| 所有 rank 参数一致 | `dist.broadcast(p.data, src=0)` |
| 梯度求和 | `dist.all_reduce(p.grad.data, op=dist.ReduceOp.SUM)` |
| 梯度求平均 | `p.grad.data.div_(world_size)` |
| ZeRO-1 梯度分片 | `dist.reduce_scatter(local_grad, chunks, op=dist.ReduceOp.SUM)` |
| ZeRO-1 取回参数 | `dist.all_gather(gathered, self.master_shard)` |
| GPipe 气泡 | `bubble_fraction(num_stages, num_microbatches)` |

## 运行课程
type: command-table
from: phases/19-capstone-projects/48-distributed-fsdp-ddp/docs/en.md, phases/19-capstone-projects/48-distributed-fsdp-ddp/code/main.py, phases/19-capstone-projects/76-collective-ops-from-scratch/docs/en.md, phases/19-capstone-projects/77-data-parallel-ddp/docs/en.md, phases/19-capstone-projects/78-zero-parameter-sharding/docs/en.md, phases/19-capstone-projects/79-pipeline-parallel/docs/en.md

| 命令 | 作用 |
|---|---|
| `python3 code/main.py` | 第 48 课：两个 gloo rank，写出 `outputs/ddp-demo.json` |
| `--world-size 4` | 第 48 课：四个 rank。参数差异保持在 1e-3 以下 |
| `--no-write` | 第 48 课：跳过 JSON 文件 |
| `python3 code/main.py` | 第 76 课：队列网格对比 gloo，字节计数器 |
| `python3 code/main.py` | 第 77 课：单进程对比 4 个 rank 的 DDP |
| `python3 code/main.py` | 第 78 课：损失与 ZeRO-1 内存表 |
| `python3 code/main.py` | 第 79 课：甘特图与气泡百分比 |

## 代码中的默认值
type: defaults
from: phases/19-capstone-projects/48-distributed-fsdp-ddp/code/main.py, phases/19-capstone-projects/48-distributed-fsdp-ddp/docs/en.md, phases/19-capstone-projects/76-collective-ops-from-scratch/code/main.py, phases/19-capstone-projects/76-collective-ops-from-scratch/docs/en.md, phases/19-capstone-projects/79-pipeline-parallel/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `--world-size` | 2 | 第 48 课的 rank 数 |
| `--backend` | `gloo` | GPU 上使用 `nccl` |
| `--num-steps` | 6 | 第 48 课的训练步数 |
| `--batch-size` | 8 | 每个 rank |
| `RECV_TIMEOUT_S` | 30.0 | 队列网格接收截止时间 |
| DDP bucket 大小 | 25 MB | 每个 bucket 一次 allreduce |
| `NUM_STAGES` | 4 | 第 79 课流水线 |
| `NUM_MICROBATCHES` | 8 | 第 79 课流水线 |

## 故障排查
type: troubleshooting
from: phases/19-capstone-projects/48-distributed-fsdp-ddp/docs/en.md, phases/19-capstone-projects/77-data-parallel-ddp/docs/en.md, phases/19-capstone-projects/79-pipeline-parallel/docs/en.md, phases/10-llms-from-scratch/05-scaling-distributed/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| 从第一步起各 rank 就发散 | 每个 rank 各自初始化 | 构造时 `dist.broadcast(tensor, src=0)` |
| 所有 rank 看到相同的 batch | 打乱时共用一个种子 | 打乱用 `torch.manual_seed(seed + rank)` |
| Allreduce 死锁 | 被跳过的参数没有梯度 | `find_unused_parameters=True` |
| 梯度累积很慢 | 每个 microbatch 都做 allreduce | 用 `no_sync()` 包住 microbatch |
| N 改变后学习率失效 | 只做 SUM 没有除法 | 除以 world_size |
| 流水线在通信上卡住 | 每个阶段都先发送后接收 | 偶数 rank 先发送，奇数 rank 先接收 |
| 某个阶段拖住每个周期 | 按参数量切分阶段 | 让每个阶段的 FLOPs 相等 |
| 8 张 GPU 上 70B FSDP 超过 80GB | 每张 GPU 105 GB | 用 16 张 GPU 或激活检查点 |

## 问答
type: qa
from: phases/19-capstone-projects/77-data-parallel-ddp/docs/en.md, phases/10-llms-from-scratch/05-scaling-distributed/docs/en.md, phases/19-capstone-projects/79-pipeline-parallel/docs/en.md, phases/19-capstone-projects/78-zero-parameter-sharding/docs/en.md, phases/10-llms-from-scratch/19-dualpipe-parallelism/docs/en.md

- **为什么求平均而不是求和？** 这样在一个 rank 上调好的学习率在四个 rank 上同样适用。
- **混合精度能让内存减半吗？** 不能。大约节省 25%。
- **M=8、N=4 时 GPipe 的气泡？** 27%。M=64、N=4 时为 4.5%。
- **GPipe 还是 1F1B？** 气泡相同。1F1B 限制了激活内存。
- **ZeRO 为什么用 reduce_scatter？** 每个 rank 只拿到自己分片的和。
- **ZeRO-3 和 FSDP 是一回事吗？** 是。机制相同。
- **1k 张 GPU 以下用 DualPipe？** 大材小用。气泡只占成本的一小部分。
