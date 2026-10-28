# 调度器循环与 --schedule-policy

> 调度器每隔几毫秒回答一个问题：GPU 接下来算哪些 token。在 v0.5.22，它的默认答案是先到先服务。

八个用户在同一秒发来 prompt。其中一个粘贴了一份 4,000 token 的文档，其他人各打了一句话。应该先跑长 prompt，还是先跑短的？与昨天流量共享 system prompt 的请求该不该插队？每一步总得有人决定，在 SGLang 里这个人就是调度器循环。

读完本节后，你能读懂调度器的 `Prefill batch` 和 `Decode batch` 日志行。你能说出给等待队列排序的策略，并决定要不要改它。

## 糟糕顺序的代价 {#s-the-scheduler-loop-and-schedule-policy-the-cost-of-a-bad-order}

对内存带宽受限 GPU 上的稠密模型，decode 一步为 1 条请求算 token，和为 8 条算，代价差不多。在我们的 L4 上用 Qwen3-8B，一步对 1 个用户要 60 ms，对 8 个用户要 66 ms。Mixture-of-experts 模型不一样。在我们的 GB10 上，一步从 33 ms 长到 102 ms，更大的 batch 可能读更多专家。

所以调度器想要大 batch。在队列里等的用户什么都看不到。所以调度器也想要短队列。每一种策略都是这两种代价之间的折损。

显而易见的修法是聪明的顺序，例如缓存前缀最多的请求优先。SGLang 论文正提出了 longest prefix match，并证明它对离线批是最优的 {{paper}}。在线流量不是离线批，而聪明的顺序每一步都要花 CPU 时间。

## 循环的一圈 {#s-the-scheduler-loop-and-schedule-policy-one-turn-of-the-loop}

**调度器循环：** 在调度器进程里永远跑着的函数。每一圈收下新请求、选出下一批、在 GPU 上跑它，并处理结果。

一圈按顺序做四件事 {{code}}：

1. **摄入。** 从 ZMQ socket 排空新请求，把它们加进等待队列。
2. **挑选。** 如果上一批是 prefill，就把它并入正在跑的 decode batch。然后尝试从等待队列建一个新的 prefill batch。若有，就跑它。若没有，就为每条正在跑的请求跑一步 decode。
3. **运行。** 从 `ScheduleBatch` 建出 `ForwardBatch`，并跑模型。
4. **处理。** 追加采样到的 token，检查停止条件，释放或缓存已完成请求的 KV，并把结果发给 detokenizer。

一条请求先搭乘一个 prefill batch（可能跨好几个 chunk），然后加入长寿的 decode batch，直到停下。只要调度器能准入什么，prefill 就优先。这条规则让首 token 时间保持低，[第 2.3 节](#s-admission-and-retraction) 展示决定「能准入」的预算检查。

```figure
id: fig-2-2
kind: flow
title: one turn of the scheduler loop
claim: Each turn ingests requests, orders the queue by policy, admits what fits the budget, and runs either one prefill batch or one decode step.
caption: Read top to bottom. Amber boxes are scheduler phases, the green box is the KV budget check, the plum boxes are GPU work. Function names are from the scheduler at v0.5.22.
```

## 两行日志 {#s-the-scheduler-loop-and-schedule-policy-the-two-log-lines}

调度器每个 prefill batch 打一行，每 40 步 decode 打一行 decode（`--decode-log-interval` 的默认）{{code}}。这些行是服务器写出的最有用的文本。下面是我们并发 8 基准里连续的三行。

```listing
title: eight requests, two prefill batches, one decode batch
source: capture/out/server-default.log
lang: text
note: Three consecutive lines from the concurrency 8 benchmark.
---
[2026-10-16 13:59:07] Prefill batch, #new-seq: 1, #new-token: 511, #cached-token: 1, token usage: 0.00, #running-req: 0, #queue-req: 7, #pending-token: 0, cuda graph: False, input throughput (token/s): 155.03
[2026-10-16 13:59:09] Prefill batch, #new-seq: 7, #new-token: 3553, #cached-token: 2, token usage: 0.02, #running-req: 1, #queue-req: 0, #pending-token: 0, cuda graph: False, input throughput (token/s): 1914.13
[2026-10-16 13:59:09] Decode batch, #running-req: 8, #token: 4075, token usage: 0.02, cuda graph: False, gen throughput (token/s): 98.37, #queue-req: 0
```

读这些字段：

- `#new-seq` 是这次 prefill 准入了多少请求。`#new-token` 是它算了多少 prompt token，`#cached-token` 是它从 radix cache 复用了多少。
- `token usage` 是正在使用的 KV pool 占比。我们的 pool 很大，所以这里用量接近零。
- `#running-req` 计正在 decode 的请求。`#queue-req` 计正在等的请求。
- `cuda graph: False` 在 Mac 上是预期的。在 CUDA 上，`True` 表示 decode 步重放了捕获好的 graph，[第 4.1 节](#s-forwardmode-and-cuda-graphs) 解释为什么这重要。

第一行在七条等待时准入了一条。下一次 prefill 把另外七条一起准入，一步算 3,553 个新 token，每秒 1,914 个。然后八条一起作为一批 decode。批处理 prefill 就是吞吐的来源，日志把它写了出来。

## 策略 {#s-the-scheduler-loop-and-schedule-policy-the-policies}

**调度策略：** 准入之前给等待队列排序的规则。用 `--schedule-policy` 设置。

v0.5.22 的默认是 `fcfs` {{code}}。选项分成两组。

| 组 | 策略 | 它们用什么 |
|---|---|---|
| Cache-aware | `lpm`, `dfs-weight`, `hrrn`, `shortest-prefill-first` | radix 树：每条提示已有多少已在缓存 |
| Cache-agnostic | `fcfs`, `lof`, `random`, `routing-key` | 到达顺序、输出长度，或路由键 |

解析器也接受 `--schedule-policy priority`，但调度器没有这种顺序，服务器会以 "Unknown schedule_policy" 停下。要按优先级排序，用 `--enable-priority-scheduling` 配 `fcfs`。

很多读者期待 `lpm`，因为论文描述过它。它在 v0.4.3 是默认，到 v0.4.6 变成了 `fcfs`。为本手册做的研究没有找到改掉它的 pull request。

代码里有两条规则限制 cache-aware 策略 {{code}}：

- 当等待队列超过 128 条请求时，`lpm` 和 `hrrn` 在那一圈改成 FCFS。代码注释说了原因：队列长时，前缀匹配和排序代价太大。
- 关掉 radix cache 时，`lpm`、`dfs-weight` 和 `hrrn` 变成 FCFS。`shortest-prefill-first` 会拒绝启动。

所以 `lpm` 只在很窄的区间有用。队列必须长到值得重排，短到不超过 128，并且充满共享前缀。

## 长 prompt 下的 chunk 大小 {#s-the-scheduler-loop-and-schedule-policy-chunk-size-under-long-prompts}

**分块 prefill：** 把长 prompt 拆成最多 `--chunked-prefill-size` 个 token 的小块、每块一个 prefill batch 的规则。默认取决于 GPU 内存，[第 4.1 节](#s-forwardmode-and-cuda-graphs) 的表会展示。在 22 GB 的 L4 上是 4,096，在 GB10 上是 8,192。

常见建议是把 chunk 调小，好让长 prompt 的各块之间更常插入 decode 步。我们测过这个建议。每次运行发 48 条 1,024 到 4,096 token 的 prompt，输出 256 个 token。请求以 0.5、1 或 2 每秒的泊松到达，三个种子。

| GPU、模型 | 块 | 速率，每秒 | 输出 tok/s | 中位 TTFT | P99 ITL | 中位 SM 时钟 |
|---|---|---|---|---|---|---|
| GB10, Qwen3-30B-A3B | 8,192，默认 | 0.5 | 70.1 | 892 ms | 929 ms | 2,411 MHz |
| GB10, Qwen3-30B-A3B | 1,024 | 0.5 | 68.1 | 1,253 ms | 1,977 ms | 2,398 MHz |
| GB10, Qwen3-30B-A3B | 8,192，默认 | 2 | 129.3 | 269 ms | 312 ms | 2,411 MHz |
| GB10, Qwen3-30B-A3B | 1,024 | 2 | 130.1 | 256 ms | 260 ms | 2,411 MHz |
| L4, Qwen3-8B | 4,096，默认 | 0.5 | 44.1 | 36.0 s | 2,579 ms | 773 MHz |
| L4, Qwen3-8B | 1,024 | 0.5 | 43.3 | 37.4 s | 2,922 ms | 690 MHz |
| L4, Qwen3-8B | 4,096，默认 | 2 | 46.2 | 59.8 s | 2,512 ms | 915 MHz |
| L4, Qwen3-8B | 1,024 | 2 | 44.0 | 62.5 s | 2,930 ms | 825 MHz |

**我们测到** 在两台机器上，更小的 chunk 都没有收益。在 GB10 上我们跑了默认、显式的 8,192，以及 1,024。在每秒 1 和 2 条请求时，三者都在彼此的种子散布之内。在每秒 0.5 条时，1,024 的 chunk 更差。它的 P99 ITL 是 1,977 对 929 ms，种子区间不相交。

一项 2025 年关于 MoE 模型分块 prefill 的研究给出了那种损失的可能原因。prompt 的每一块都会再次加载专家权重，在那项研究里，额外加载把内存流量抬高最多 39%。Qwen3-30B-A3B 是 MoE 模型。chunk 为 1,024 时，最长 4,096 token 的 prompt 最多跑成四块。每一块都再次读专家。我们没有测专家流量，所以这是一种解读，不是结果。

每秒 1 和 2 条的速率还需要第二个警告。在每个种子里，扫描把同样的 48 条 prompt 以每个速率发给同一台服务器，并且没有冲刷缓存。0.5 的速率先跑。GB10 的 pool 装得下那些 prompt，所以后面的运行可能在缓存里找到很多。这可以解释为什么每秒 1 和 2 条时的首 token 比 0.5 更快。[第 5.1 节](#s-sglang-benchmark-serving) 给出防止这种情况的协议。

在 L4 上，这个工作负载在每个速率上都超过了卡能服务的量。输出停在大约每秒 44 个 token，中位首 token 要 36 到 62 秒。卡在节流，中位时钟 690 到 915 MHz，这次扫描没有重跑节流的运行。最差的 token 间隔在两种 chunk 下都停在 2.5 到 2.9 s。1,024 的运行在每秒 0.5 和 2 条时还比默认慢 80 到 90 MHz。所以两种 chunk 之间的小差距不是 chunk 效应。

本节开头的调度器规则能解释 L4 的结果。只要调度器能准入什么，prefill 就优先。队列满时，更小的 chunk 会在 decode 步前面加更多 prefill 圈，流仍然在等。

`--enable-mixed-chunk` 把 decode token 放进 prefill batch，这样 decode 步就不用等一圈 prefill。我们在同一会话里对照新的默认运行，在 L4 上跑了它，中位时钟 953 到 1,095 MHz。

| 速率，每秒 | 输出 tok/s，默认 / 混合块 | P99 ITL，默认 / 混合块 |
|---|---|---|
| 0.5 | 46.5 / 46.5 | 2,521 / 2,406 ms |
| 1 | 46.6 / 47.5 | 2,491 / 2,289 ms |
| 2 | 47.3 / 47.6 | 2,572 / 2,418 ms |

混合 chunk 把中位 P99 ITL 降低了 5% 到 8%，每个速率上种子区间都重叠。最差的 token 间隔仍然超过 2.2 s。在我们的 L4 上用 Qwen3-8B，一块跟不上这些 prompt 的卡，两个旗标都没能让流顺畅。我们预期修法是更多 prefill 容量，或每秒更少的长 prompt，但我们没有测。

GB10 跟得上这个工作负载，在那里混合 chunk 确实有帮助。我们在 2026-10-21 用同样的扫描跑了它，对照同一天的新默认运行。默认服务器的 pool 是 251,910 个 token，混合 chunk 服务器是 236,751 个。每次运行的中位时钟都至少 2,405 MHz。

```listing
title: the GB10 pool with the mixed chunk
source: capture/gpu/out-gb10/server-mixed-chunk.log
lang: text
note: The pool at startup of the server with --enable-mixed-chunk.
---
[2026-10-21 06:26:47] KV Cache is allocated. dtype: torch.bfloat16, #tokens: 236751, K size: 10.84 GB, V size: 10.84 GB
```

| 速率，每秒 | P99 ITL，默认 / 混合块 | 中位 TTFT，默认 / 混合块 | 输出 tok/s，默认 / 混合块 |
|---|---|---|---|
| 0.5 | 922 / 781 ms | 841 / 910 ms | 70.9 / 72.1 |
| 1 | 219 / 177 ms | 244 / 362 ms | 108.8 / 112.6 |
| 2 | 261 / 221 ms | 238 / 416 ms | 133.2 / 138.1 |

**我们测到** 更顺的流和更慢的首 token。P99 ITL 降了 15% 到 19%，在每秒 0.5 和 2 条时落在种子散布之外。中位 TTFT 在每秒 1 和 2 条时升了 49% 到 74%，也在种子散布之外。吞吐升了 2% 到 4%，在散布之内。

2026-10-17 的默认运行给出了同一方向。对照它，P99 ITL 降了 16% 到 29%。中位 TTFT 在每秒 1 和 2 条时升了 35% 和 54%。上面关于缓存的警告对两台服务器在每秒 1 和 2 条时都适用。

在我们两块卡上用这个工作负载，这个旗标是一种折损，卡决定了你能不能拿到它。当 prefill 跟得上时，搭乘 prefill batch 的 decode token 不用再等，每条新 prompt 多等一点。当 prefill 跟不上时，像在 L4 上，队列决定节奏，旗标几乎不变。

```listing
title: a larger chunk that did not start
source: capture/gpu/incidents/l4-chunk-8192-prefill-graph-oom.txt
lang: text
note: SGLang 0.5.22 on the L4 with --chunked-prefill-size 8192. The last error names PyTorch, and the cause is two lines above it.
---
[2026-10-18 07:27:15] Memory pool end. avail mem=2.90 GB
Capturing prefill shape (num_tokens=8192 avail_mem=2.33 GB)
torch.AcceleratorError: CUDA error: out of memory
[2026-10-18 07:28:44] RuntimeError: num_active_captures_ > 0 INTERNAL ASSERT FAILED at "/__w/pytorch/pytorch/c10/cuda/CUDACachingAllocator.cpp":3209, please report a bug to PyTorch. markCaptureEnd called with no captures in progress
```

另一个方向在 L4 启动时失败了。chunk 为 8,192 时，KV pool 仍是 24,094 个 token。然后 8,192 token 的 prefill graph 需要的内存超过了剩下的 2.33 GB。日志最后一行是要求报 bug 的 PyTorch 断言。真正的错误是它上面那行内存不足。

## 我们的立场 {#s-the-scheduler-loop-and-schedule-policy-our-position}

保持 `fcfs`。它公平，不按前缀给队列排序，radix cache 仍然给你缓存命中。先到的共享前缀会在树里，下一条匹配它的请求就能打中，与顺序无关。

只有三件事同时成立时才切到 `lpm`。你的流量共享长前缀。你的队列常常在几条到 128 条之间。你用 `/metrics` 量过切换前后的缓存命中率。[第 5.2 节](#s-the-metrics-endpoint) 展示要对比的 `cache_hit_rate` 序列。

如果需要用户分层，用 `--enable-priority-scheduling`，不要用缓存策略。新请求的优先级比正在跑的高出 `--priority-scheduling-preemption-threshold`（默认 10）时，就可以抢占 {{code}}。

## 一起事故：你设的上限不是你拿到的上限 {#s-the-scheduler-loop-and-schedule-policy-an-incident-the-limit-you-set-is-not-the-limit-you-get}

一位用户服务 hybrid Mamba 模型，并设了 `--max-running-requests 8` {{issue #36889}}。服务器接受了旗标并报告 8。吞吐却在 2 条流处就平了。只有日志里的一行 info 说 Mamba state cache 把 `max_running_requests` 封顶到了 2。

调度器循环同时对照每一条上限做准入，最小的那条赢。报告者用的修法是更多 Mamba cache，`--max-mamba-cache-size 40`，配合 bf16 state 和 `--mem-fraction-static 0.90`，在并发 12 时吞吐多了 75%。在 v0.5.22，这个封顶是警告。读日志里循环真正用的上限，不是你打的那个。

```takeaways
- 读 Prefill batch 和 Decode batch 行，看清准入、缓存和排队。
- 除非你测到了 lpm 带来的缓存收益，否则保持 fcfs 默认。
- 预期等待请求超过 128 时 lpm 会改成 FCFS。
- 设了上限之后，检查日志里的有效上限。
- 把 prefill chunk 调小之前先测 P99 ITL，因为我们的运行里它没有帮助。
- 在 MoE 模型上，预期小 chunk 会花更多 prefill 时间，因为每一块都再次读专家。
- 当 prefill 跟得上时，试 --enable-mixed-chunk 换更顺的流，并预期更慢的首 token。
- 预期高于你 GPU 默认的 chunk 在启动时需要更多空闲内存。
```

Sources: python/sglang/srt/managers/scheduler.py (run_event_loop, event_loop_normal, get_next_batch_to_run, run_batch, process_batch_result), python/sglang/srt/managers/schedule_policy.py (CacheAwarePolicy, CacheAgnosticPolicy, WAITING_QUEUE_PREFIX_MATCH_MAX, _determine_active_policy, _validate_and_adjust_policy), python/sglang/srt/arg_groups/fields/schedule.py at v0.5.22; SGLang paper, arXiv 2312.07104; capture/out/server-default.log; issue https://github.com/sgl-project/sglang/issues/36889; capture/gpu/summary/gb10.json and capture/gpu/summary/l4.json (mixed); capture/gpu/sweep.py (mixed sweep); capture/gpu/incidents/l4-chunk-8192-prefill-graph-oom.txt; capture/gpu/out-gb10/server-mixed-chunk.log, capture/gpu/summary/gb10.json (mixed.mixed-chunk, mixed.graphs-on-b), capture/gpu/out-gb10/server-pools.log, Lee and others, From Tokens to Layers: Redefining Stall-Free Scheduling for MoE Serving with Layered Prefill, arXiv 2510.08055 (2025-10); capture/gpu/sweep.py (the mixed sweep plan).
