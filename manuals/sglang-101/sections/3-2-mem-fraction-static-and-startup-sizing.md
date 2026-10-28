# --mem-fraction-static 与启动时的容量划分

> SGLang 在启动时根据一次空闲内存快照给 KV pool 定大小，所以启动后机器变了，可能把整台服务器打死。

我们在 capture Mac 上最早的 SGLang 服务器之一只跑了四分钟。然后一个 32 并发请求的基准用 Metal 内存不足错误把它打崩，服务器的每个进程都退出了。那一刻 KV pool 还有 95% 是空的。内存都进了 pool，下一次 prefill 没地方跑。

读完本节后，你能读懂 SGLang 启动时如何划分内存，并预测这种划分何时失败。你也能有意地设置 `--mem-fraction-static`。

## 我们记下的那次崩溃 {#s-mem-fraction-static-and-startup-sizing-the-crash-we-recorded}

在 capture kit 存在之前，我们用同一条命令、不带 `--mem-fraction-static` 启了两次服务器。两次启动给 pool 定的大小差很多。

```listing
title: two startups, two pool sizes
source: capture/out/oom-exploratory.log
lang: text
note: Lines from two exploratory runs on the same Mac, before the capture kit. The comment lines are ours.
---
# run 1 startup
[2026-10-16 13:30:31] Auto-sized attention KV pool: sys_available=27.81 GB, mlx_limit=51.8 GB, mlx_used=0.31 GB, kv_budget=24.25 GB, bytes_per_slot=114688, pool_size=227022
# run 2 startup
'mem_fraction_static': 0.872
[2026-10-16 13:38:58] Auto-sized attention KV pool: sys_available=38.29 GB, mlx_limit=51.8 GB, mlx_used=0.31 GB, kv_budget=33.39 GB, bytes_per_slot=114688, pool_size=312581
```

两次运行之间 SGLang 什么都没变。第二次启动时 Mac 上其他程序用的内存更少，所以 `sys_available` 从 27.81 GB 涨到 38.29 GB。pool 跟着涨，从 24.25 GB 到 33.39 GB。两份预算都是空闲内存的 87.2%，因为自动的 `mem_fraction_static` 解析成了 0.872。

```listing
title: the crash at concurrency 32
source: capture/out/oom-exploratory.log
lang: text
note: Lines from run 2. The traceback above the RuntimeError line is cut.
---
[2026-10-16 13:42:53] Decode batch, #running-req: 32, #token: 16095, token usage: 0.05, cuda graph: False, gen throughput (token/s): 564.55, #queue-req: 0
[2026-10-16 13:42:55] Prefill batch, #new-seq: 1, #new-token: 511, #cached-token: 0, token usage: 0.00, #running-req: 0, #queue-req: 9, #pending-token: 0, cuda graph: False, input throughput (token/s): 66.85
RuntimeError: [METAL] Command buffer execution failed: Insufficient Memory (00000008:kIOGPUCommandBufferCallbackErrorOutOfMemory).

[2026-10-16 13:42:57] SIGQUIT received. signum=None, frame=None. It usually means one child failed.
…
[2026-10-16 13:43:02] kill_process_tree called: parent_pid=81559, include_parent=True, pid=81559
```

先读 `token usage: 0.05`。三十二条请求持有 16,095 个 token，是 312,581 token pool 的 5%。pool 预留了 33 GB，用掉的不到 2 GB。下一次前向的激活需要 pool 之外的内存，操作系统已经没有了。一次失败的 command buffer 拖垮了调度器，服务器杀掉了整棵进程树。

```figure
id: fig-3-2
kind: comparison
title: the same Mac, two memory splits
claim: A pool sized at 87 percent of free memory left too little for activations, and a fraction of 0.4 kept the server alive.
caption: Read each bar left to right. The green part is the KV pool, and the grey part is everything else. From capture/out/oom-exploratory.log and capture/out/server-default.log.
```

## SGLang 如何决定划分 {#s-mem-fraction-static-and-startup-sizing-how-sglang-decides-the-split}

**--mem-fraction-static：** SGLang 分给模型权重加 KV pool 的那份内存份额。份额之外的一切留给激活、CUDA graphs 和其他程序。该旗标默认是 `None`，SGLang 在启动时算出一个值 {{code}}。

在 GPU 上，自动值来自一份预留。SGLang 从 512 MB 起，再为每个 prefill chunk 的 token 加 1.5 MB {{code}}。然后为张量并行、流水线并行和 CUDA graphs 再加。GPU 大于 60 GB 时，预留至少 10 GiB。分数就是 GPU 内存减去预留，再除以 GPU 内存。SGLang 读不到设备容量时用 0.95。

权重加载之后，SGLang 再量一次空闲内存。KV 预算是空闲内存减去加载前空闲内存的 `1 - fraction` 份额 {{code}}。pool 装下这份预算除以 [第 3.1 节](#s-kv-bytes-per-token-and-the-kv-pool) 的每 token 字节数。预算不是正数时，启动停下，并打印能工作的最小分数。

Apple silicon 上的 MLX 后端用更简单的规则 {{code}}。它取两个数里较小的那个。第一个是 Metal 工作集的分数，减去已经在用的内存。第二个是此刻可用系统内存的分数。第二项就是我们两次运行之间变化的快照。

把分数读成权重和 KV pool 合在一起的份额。代码就是这么做的。

## 默认假设这台机器属于 SGLang {#s-mem-fraction-static-and-startup-sizing-the-default-assumes-the-machine-belongs-to-sglang}

在专用 GPU 上，自动规则合理。那里没有别人再分配内存，预留覆盖一个 prefill chunk 的激活和 CUDA graphs。规则在三种常见情况下失败。

- **共享机器。** 笔记本、工作站，或还有别的作业的节点。启动时的快照撑不过服务器的整个生命周期。
- **未知容量。** 在 SGLang 读不到内存大小的设备上，分数变成 0.95，只留 5% 给激活。Issue #39675 正好报告了 Apple MPS 上的那种失败，第一次 prefill 就内存不足 {{issue #39675}}。
- **估算不知道的额外内存。** Issue #42510 展示 draft 模型的副本还在内存里，而目标 pool 已经按尺寸划好，于是 draft pool 分配失败 {{issue #42510}}。Issue #6027 展示一段 64K token 的 DeepSeek-V3 prompt 在 attention 里内存耗尽，尽管日志报告还有 274,934 个 KV token 的空间 {{issue #6027}}。

## GB10 上的统一内存 {#s-mem-fraction-static-and-startup-sizing-unified-memory-on-a-gb10}

**我们测到** 同一条规则在一块 NVIDIA GB10 上，那是 DGX Spark 的芯片。它的 CPU 和 GPU 共享 121.7 GiB 内存。没有单独的 GPU 内存，启动日志里每个数字的含义因此改变。

```listing
title: one GB10 startup, from capacity to pool
source: capture/gpu/out-gb10/server-default.log
lang: text
note: Lines cut from the startup of the default GPU configuration, Qwen3-30B-A3B in BF16 with a fraction of 0.7.
---
[2026-10-17 14:12:57] Failed to get GPU memory capacity from nvidia-smi. Falling back to torch.cuda.mem_get_info(). Reported total GPU memory per device (MiB): [124610], using min: 124610 MiB.
…
[2026-10-17 14:13:05] Load weight begin. avail mem=112.59 GB
…
[2026-10-17 14:18:29] Load weight end. elapsed=323.61 s, type=Qwen3MoeForCausalLM, avail mem=54.84 GB, mem usage=57.75 GB.
[2026-10-17 14:18:32] KV Cache is allocated. dtype: torch.bfloat16, #tokens: 227243, K size: 10.40 GB, V size: 10.40 GB
[2026-10-17 14:18:32] Memory pool end. avail mem=31.22 GB
```

第一行是容量。`nvidia-smi` 不报告 GB10 的内存大小，所以 SGLang 从 PyTorch 取总量。

第二行是空闲内存，这里代码很小心。在共享系统内存的设备上，`torch.cuda.mem_get_info()` 把内核的文件缓存算成已用。某一天文件缓存很大时，这个读数会远低于机器实际能给的。SGLang 检查设备是否是集成的，然后改读操作系统的可用内存 {{code}}。那个数字会计入内核可以释放的缓存。我们重启后的记录里，两个数字一致：PyTorch 的 112.1 GiB 和 SGLang 的 112.59 GB。

这个选择的代价是，pool 大小跟着机器其余部分动。六次 BF16 启动用了同一条命令和同一份权重：

| Configuration | Available before weights | Weights, as SGLang measured them | KV pool, tokens |
|---|---|---|---|
| default | 112.59 GB | 57.75 GB | 227,243 |
| no CUDA graph | 113.21 GB | 54.78 GB | 258,017 |
| deterministic | 113.44 GB | 57.90 GB | 234,517 |
| no radix cache | 113.17 GB | 57.34 GB | 236,315 |
| no overlap | 113.37 GB | 57.92 GB | 233,822 |
| EAGLE-3, with a draft model | 113.45 GB | 57.49 GB | 216,775 |

权重没变，可测到的大小却从 54.78 GB 到 57.92 GB。SGLang 把它们量成可用内存的下降，而内核缓存在每次加载期间都在变。五次没有 draft 模型的启动里，pool 相差 14%。旗标解释不了散布，因为同一份权重量出差了 3 GB。在统一内存上，一次启动的 pool 大小是对下一次启动的估计，不是常量。

## 其他程序看得见的 pool {#s-mem-fraction-static-and-startup-sizing-a-pool-that-other-programs-see}

在 GB10 上，KV pool 有几十 GB，SGLang 几秒内就分配完。机器上每个其他程序都看见那份内存消失。我们的 GB10 还为其他用户跑了一个内存守护守护进程。空闲内存变低时，它停掉涨得最快的那个进程。启动期间它三次停掉了我们的调度器：

```listing
title: the memory guard stops the scheduler
source: capture/gpu/incidents/gb10-memory-guard-pauses.txt
lang: text
note: The first two lines of the guard log for our runs on the GB10.
---
2026-10-16T12:53:16+00:00 2026/10/16 12:53:16 guardian level: Critical: 34.2 GiB left before the freeze zone.
2026-10-16T12:53:16+00:00 2026/10/16 12:53:16 guardian pause: Paused sglang::schedul (pid 2983880, rohit): it grew 36.7 GiB in 5s with 34.2 GiB left. Resume or stop it from the app.
```

那三次启动的服务器日志我们没留。守护日志显示调度器在 5 秒内涨了 36.7 GiB，正是一次 KV pool 分配的大小。按它自己的规则，守护是对的：调度器是涨得最快的进程。几秒后守护记下 "Back to normal"，因为 pool 已经建完。我们和机器主人约定，在我们跑的那段时间停掉守护。

NVIDIA 驱动在启动时也会报告内存错误。GB10 的内核日志里有成串的这一行：

```listing
title: the driver line at server startup
source: capture/gpu/incidents/gb10-driver-no-memory.txt
lang: text
note: The last line of the file. The lines above it count the bursts per minute.
---
NVRM: nvCheckOkFailedNoLog: Check failed: Out of memory [NV_ERR_NO_MEMORY] (0x00000051) returned from _memdescAllocInternal(pMemDesc) @ mem_desc.c:1359
```

这些突发标在 2026-10-16，是我们在 GB10 上第一次测试和扫描启动的那天。那天的服务器日志我们没留，所以无法把每次突发对上一次启动。我们后来捕获里的每台服务器都变健康了，并跑完了基准。

**我们的立场：** 在统一内存上，KV pool 是整台机器让出的内存。有意地传 `--mem-fraction-static`，并在启动前告诉机器的其他用户。不要只对驱动那一行告警。在服务器没变健康时再告警。

### 分数之外的内存 {#s-mem-fraction-static-and-startup-sizing-memory-outside-the-fraction}

分数并不框住 SGLang 启动时拿走的全部内存。一位用户在 DGX Spark 上用 SGLang 服务 27B 模型。用户报告在 SGLang 的内存记账之外有 25 到 40 GB 的短命分配。FlashInfer autotuner 和 CUDA graph 捕获造出了它们。直接在宿主机上跑，服务器冻住了机器，需要断电重启。用户后来把它放进带内存上限的容器，并加了 `--mem-fraction-static 0.50`。

那是 v0.5.22 之前的现场报告，也没有点名 SGLang 版本。把它当成警告，不要当成关于 v0.5.22 的事实。我们自己没测到。上面的守护日志显示启动时涨得很快，但没把 pool 和其他分配分开。

在其他程序共享的 GB10 上，把 SGLang 放进带内存限制的容器里启动。从低于我们 kit 用的 0.7 分数开始。启动期间每秒记一次机器的空闲内存。只有看到峰值之后再抬分数。

## 我们的立场：任何共享机器上都自己设分数 {#s-mem-fraction-static-and-startup-sizing-our-position-set-the-fraction-yourself-on-any-shared-machine}

在除了 SGLang 还跑别的东西的机器上，自己传 `--mem-fraction-static`。capture kit 在 Mac 上用 0.4。有了那个值，打崩 run 2 的同一基准在并发 32 下跑完了全部 128 条请求。

```listing
title: the kit's server, with an explicit fraction
source: capture/out/server-default.log
lang: text
note: One startup line from the default kit configuration.
---
[2026-10-16 13:58:03] Auto-sized attention KV pool: sys_available=48.49 GB, mlx_limit=51.8 GB, mlx_used=0.31 GB, kv_budget=19.39 GB, bytes_per_slot=114688, pool_size=181574
```

预算现在是 19.39 GB，是 48.49 GB 快照的 0.4。pool 仍持有 181,574 个 token，远多于 32 条各 640 token 的请求所需。更小的 pool 在这个工作负载里没代价，因为工作负载从没填满 pool。

我们在 GB10 上测了另一个方向。[第 5.1 节](#s-sglang-benchmark-serving) 的负载扫描跑了两遍，2026-10-16 用 kit 的分数 0.7，2026-10-17 用 0.82，每个点三个种子。

```listing
title: a larger pool on the GB10, at its fullest
source: capture/gpu/out-gb10/server-load-default-kv-max.log
lang: text
note: The pool at a fraction of 0.82, and the decode line with the highest token usage in the whole sweep.
---
[2026-10-17 16:35:26] KV Cache is allocated. dtype: torch.bfloat16, #tokens: 383065, K size: 17.54 GB, V size: 17.54 GB
[2026-10-17 16:47:45] Decode batch, #running-req: 64, #token: 40751, token usage: 0.11, cuda graph: True, gen throughput (token/s): 263.88, #queue-req: 0
```

**我们测到** 一份 383,065 token 的 BF16 pool，对比 234,600，多了 63%。FP8 pool 从 1,084,458 涨到 1,378,545 个 token。吞吐没动。在 64 用户时，BF16 是 238.72 对 235.38 tok/s，FP8 是 442.71 对 440.86。每个并发下，两个中位都在彼此 2% 以内。

```figure
id: fig-3-2c
kind: chart
title: A larger pool bought nothing when the pool was never full
claim: Raising the fraction from 0.7 to 0.82 on the GB10 grew the BF16 pool by 63 percent and changed closed-loop throughput by less than 2 percent.
caption: Output throughput against max concurrency, three seeds per point. Solid lines are 0.7 and dashed lines are 0.82. Plum is BF16 and green is FP8 with an FP8 KV cache. From capture/gpu/summary/gb10.json.
```

日志行解释了这一点。六十四条请求持有 40,751 个 token，是 pool 的 11%。在 kit 分数 0.7 的服务器上，最高 token usage 是 18%。pool 从来不是上限，所以更大的 pool 无事可做。对比 [第 4.3 节](#s-quantization) 的 L4，那里 BF16 pool 在 64 用户时是满的，FP8 几乎把吞吐乘了三倍。

[第 5.1 节](#s-sglang-benchmark-serving) 的开环扫描给出答案的另一半。在每秒 16 条请求、超过 GB10 能服务的速率时，更早的请求还在跑，新请求不停到达。那里更大的 pool 确实重要。

```listing
title: the pool at 0.7 under an open-loop overload
source: capture/gpu/out-gb10/server-rate-default-full.log
lang: text
note: One decode line at 16 offered requests per second, at a fraction of 0.7.
---
[2026-10-16 19:08:23] Decode batch, #running-req: 374, #token: 227530, token usage: 0.96, cuda graph: False, gen throughput (token/s): 866.37, #queue-req: 101
```

```listing
title: the pool at 0.82 under the same overload
source: capture/gpu/out-gb10/server-rate-default-kv-max.log
lang: text
note: The decode line with the highest token usage at 16 offered requests per second, at a fraction of 0.82.
---
[2026-10-17 18:00:45] Decode batch, #running-req: 480, #token: 289721, token usage: 0.75, cuda graph: False, gen throughput (token/s): 994.20, #queue-req: 0
```

在 0.7 时 pool 满了 96%，101 条请求在外面等。在 0.82 时，那次运行的全部 480 条请求一次装下。**我们测到** 每秒完成 5.19 条请求对 3.88，多 34%，以及 664 对 497 输出 tok/s，各三个种子。两次运行隔了一天，所以差距的一部分可能是机器。日志行展示了机制，收益的大小属于这次运行。FP8 在两个分数下都有超过一百万 token 的 pool，速率没变：8.29 对 8.26。

所以多出的 13.6 GB 在 64 用户时什么也没买到，在过载时多买了三分之一的吞吐。按峰值负载的 token usage 给 pool 定大小，包括比你服务更快到达的突发。在 GB10 和其他程序共享的机器上，你不需要的内存就是别的程序用不了的内存。

在专用 GPU 上，先信任自动值。只有调度器日志显示 pool 满了、还有回退时，才按 0.02 的步长抬分数。用你最长的 prompt 在预发环境找上限，然后在生产里比它低一两步跑。长 prompt 在 attention 里失败时就降低，像 issue #6027。

分数也会改变对比。一次独立基准用自动分数跑 SGLang，用默认占 GPU 内存 0.9 的设置跑 vLLM {{field Rawlinson 2025-12}}。两个引擎的 KV pool 大小差很多。在信任未同时报告两个值的对比之前，先读 [第 5.3 节](#s-reading-other-peoples-benchmarks)。

## 要量什么 {#s-mem-fraction-static-and-startup-sizing-what-to-measure}

- 启动时的 `max_total_num_tokens` 行。它是整次计算的结果。
- decode 行里的 `token usage`。接近 1.0 表示 pool 满了。
- 最重 prefill 期间机器的空闲内存，来自操作系统。

对 Apple silicon 再提醒一句。我们的捕获里 `kv_cache_memory_usage_gb` 指标读到 0.0，因为 MLX 后端在指标读取的记账之外分配了自己的 pool。用 `MlxAttentionKVPool` 日志行，它报告了大约 19,860 MB。

```takeaways
- 按峰值负载的 token usage 给 KV pool 定大小，突发也算，不要按空闲内存。
- 在任何还跑其他程序的机器上，自己传 --mem-fraction-static。
- 每次改动后在启动日志里读 kv_budget 和 max_total_num_tokens。
- 只有 pool 满了、请求回退时，才小步抬分数。
- 长 prompt 在 attention 里内存不足失败时，降低分数。
- 只有两边都报告 KV pool 大小时才对比引擎。
- 在 GB10 上，每次启动日志都读 pool 大小，因为它在启动之间会变。
- 在共享的 GB10 上，用更低分数、有内存上限的容器跑 SGLang，并记录空闲内存。
```

Sources: python/sglang/srt/arg_groups/memory_hook.py (handle_gpu_memory_settings), python/sglang/srt/mem_cache/kv_cache_configurator.py (_profile_available_bytes), python/sglang/srt/hardware_backend/mlx/model_runner.py (_compute_pool_size), python/sglang/srt/arg_groups/fields/schedule.py (mem_fraction_static) at v0.5.22, capture/out/oom-exploratory.log, capture/out/server-default.log, capture/out/metrics.txt, python/sglang/srt/utils/common.py (get_available_gpu_memory) at v0.5.22, capture/gpu/out-gb10/server-*.log, capture/gpu/out-gb10/environment.json, capture/gpu/incidents/gb10-memory-guard-pauses.txt, capture/gpu/incidents/gb10-driver-no-memory.txt, issues #39675, #42510, and #6027, the Rawlinson benchmark of 2025-12-05. capture/gpu/out-gb10/server-load-default-kv-max.log, capture/gpu/summary/gb10.json. capture/gpu/out-gb10/server-rate-default-full.log, capture/gpu/out-gb10/server-rate-default-kv-max.log, capture/gpu/out-gb10/server-default.log, capture/gpu/out-gb10/server-pools.log, basbunarhasan, Qwen3.8-27B at 34-38 tok/s on DGX Spark, open-source one-command setup (SGLang + NVFP4 + DSpark), NVIDIA developer forum (2026-08-15)
