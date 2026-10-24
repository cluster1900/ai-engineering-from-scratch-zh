# Evidence: cheatsheets/distributed-training.md

Abbreviations: P10 = phases/10-llms-from-scratch, P19 = phases/19-capstone-projects. L05 = P10/05-scaling-distributed, L19 = P10/19-dualpipe-parallelism, L48 = P19/48-distributed-fsdp-ddp, L76 = P19/76-collective-ops-from-scratch, L77 = P19/77-data-parallel-ddp, L78 = P19/78-zero-parameter-sharding, L79 = P19/79-pipeline-parallel. d = docs/en.md, c = code/main.py.

## 四种策略并排对比 (comparison)
- Splits: batch L05/d:47, params grads optimizer L05/d:103, layers L05/d:93, weight matrix L05/d:81,83
- Per-GPU memory: full copy, no drop L05/d:51. 1/N L05/d:103. layers per GPU L05/d:93. slice of each layer L05/d:212
- Traffic: all-reduce L05/d:276. all-gather and reduce-scatter L05/d:105,141. activations at boundaries L05/d:95. all-reduce after each matmul L05/d:87
- Link: overlaps with compute L05/d:49. more than vanilla DP L05/d:118. across nodes L05/d:95. NVLink L05/d:87
- Main cost: memory L05/d:51. gather each forward L48/d:71. bubbles L05/d:97. latency L05/d:87

## 各自的选用时机 (concepts)
- DDP: L48/d:19
- FSDP: L48/d:19
- ZeRO-1 default, same bandwidth, linear savings: L78/d:96
- ZeRO-2 or ZeRO-3 when parameter shard memory is a problem: L78/d:96
- Tensor parallel inside a node, fast links: L05/d:87, 204
- Pipeline across nodes, low bandwidth: L05/d:95, 205
- DualPipe EP-heavy MoE at multi-thousand GPU scale: L19/d:94, 100
- DualPipeV dense or EP-light, one copy: L19/d:91, 94

## ZeRO 各阶段 (comparison)
- Sharded row, nothing to params: L78/d:40-43
- Memory per rank row: L78/d:40-43
- Comm per step row: L78/d:40-43
- Savings row, ~4x, ~8x, ~Nx: L05/d:170-172
- PyTorch FSDP name row, SHARD_GRAD_OP is ZeRO-2, FULL_SHARD is ZeRO-3: L78/d:103

## 内存数字 (concepts)
- Adam 70B x 4 bytes x 2 = 560GB: L05/d:41
- 16P bytes vanilla: L78/d:58
- 4P + 12P/N, N=8 5.5P 65%: L78/d:58, 60
- FSDP 70B 8 GPUs 105 GB, does not fit 80GB: L05/d:114, 116
- 7B 112 GB to 84 GB, optimizer FP32: L05/d:194-195, 197
- per_gpu_batch_size x N: L05/d:53

## 流水线调度 (comparison)
- Param copies row: L19/d:91
- Bubble vs micro-batches row: L19/d:92
- Overlap row: L19/d:93
- simulator functions bubble_1f1b, bubble_zero_bubble, bubble_dualpipe, bubble_dualpipev: L19/c:27, 38, 48, 57

## 集合通信 (comparison)
- Per-rank bytes row: L76/d:43-47
- Steps row: L76/d:43-47
- Use when row: L76/d:43-47
- Message size row, ring above ~1 MB, tree below: L76/d:89

## 在队列网格上做 ring allreduce (architecture, 4 nodes, 4 edges)
- rank 0 and queue 0 to 1: L76/d:27
- rank 1 and queue 1 to 2: L76/d:28-29
- rank 2 and queue 2 to 3: L76/d:30-31
- rank 3 and queue 3 to 0: L76/d:32-34
- each rank owns chunk index equal to its rank: L76/d:39
- ring code: L76/c:87-117

## DDP worker 循环 (annotated-code)
- init_process_group gloo, file init_method, rank, world_size: L77/c:102-107
- torch.manual_seed(SEED): L77/c:108
- DistributedDataParallel broadcasts params: L77/c:110, 67-74
- offset own slice: L77/c:117
- zero_grad, backward, sync_grads, step: L77/c:120, 123-125
- sync_grads all_reduce SUM then div_: L77/c:80-81

## 集合通信调用 (task-table, 8)
- MASTER_PORT: L48/d:90
- init_process_group gloo: L48/d:91
- dist.broadcast(p.data, src=0): L77/c:74
- dist.all_reduce SUM: L77/c:80
- p.grad.data.div_(world_size): L48/d:108
- dist.reduce_scatter: L78/c:146
- dist.all_gather: L78/c:157
- bubble_fraction: L79/c:37

## 运行课程 (command-table, 7)
- lesson 48 run, two ranks, ddp-demo.json: L48/d:124, 127
- --world-size 4 and 1e-3 spread: L48/d:143
- --no-write: L48/c:384
- lesson 76 output: L76/d:76, 79
- lesson 77 output: L77/d:79, 82
- lesson 78 output: L78/d:83, 86
- lesson 79 output: L79/d:68, 71

## 代码中的默认值 (defaults, 8)
- --world-size 2: L48/c:379
- --backend gloo: L48/c:380
- --num-steps 6: L48/c:381
- --batch-size 8: L48/c:382
- nccl on GPUs: L48/d:23
- RECV_TIMEOUT_S = 30.0: L76/c:29
- DDP bucket default 25 MB: L76/d:95
- NUM_STAGES = 4: L79/c:27
- NUM_MICROBATCHES = 8: L79/c:28

## 故障排查 (troubleshooting, 8)
- divergence without broadcast: L48/d:98
- shared seed, seed + rank: L77/d:60
- deadlock, find_unused_parameters=True: L77/d:88
- no_sync for accumulation: L77/d:92
- SUM without division retunes LR: L77/d:52
- pipeline send-recv deadlock, even and odd ranks: L79/d:81
- equalise FLOPs per stage: L79/d:45
- 105 GB, 16 GPUs or activation checkpointing: L05/d:116

## 问答 (qa, 7)
- mean not sum: L77/d:52
- mixed precision 25%: L05/d:450
- 27% at M=8 N=4, 4.5% at M=64: L79/d:21
- 1F1B same bubble, bounded activation memory: L79/d:41, 111
- reduce_scatter delivers own shard: L78/d:64
- ZeRO-3 equals FSDP: L05/d:174
- DualPipe overkill under 1k GPUs: L19/d:100
