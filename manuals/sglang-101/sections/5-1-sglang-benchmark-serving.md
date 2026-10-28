# sglang.benchmark.serving

> 一次基准跑测一个并发，所以你扫并发，直到额外负载不再加吞吐、只加等待。

一位同事在团队频道里发「SGLang 在我的笔记本上做到每秒 255 个 token」。这个数字是真的。它来自我们的抓取。它本身也没用。同一台服务器在一种负载下带着 0.8 秒的中位第一个 token 给出那个吞吐，在另一种负载下是 3.9 秒。一个没有伴随延迟的吞吐数字，描述不了用户感觉到的任何东西。

读完本节后，你能用你能辩护的设置跑 `sglang.benchmark.serving`，并读懂其报告的每一行。你能找到更多并发不再划算的那个拐点。你也能说出你自己的哪些数字会转到 GPU 上、哪些不会。

## 我们跑的命令 {#s-sglang-benchmark-serving-the-command-we-ran}

服务器是一个进程，模型是抓取 Mac 上的 `mlx-community/Qwen3-0.6B-4bit`。本节每一次跑都对着这一台服务器说话。

```listing
title: the server under test
source: capture/out/server-default.command.txt
lang: text
note: The full command, as the capture kit started it.
---
SGLANG_USE_MLX=1 sglang serve --model-path mlx-community/Qwen3-0.6B-4bit --disable-cuda-graph --host 127.0.0.1 --port 30000 --enable-cache-report --enable-metrics --mem-fraction-static 0.4
```

那条命令里有两个标志需要一句说明。SGLang 的 Apple silicon 指南仍传 `--disable-cuda-graph`，而 v0.5.22 的帮助把它标成弃用，改用 `--cuda-graph-backend-{decode,prefill}=disabled`。在 MLX 后端上，除非你加 `--mlx-enable-sampling`，decode 是贪心的，所以我们的跑测的是贪心路径。基准默认发温度 0，所以这里客户端与服务器一致。

客户端是 SGLang 自带的基准模块。我们跑了三次，并发上限分别是 1、8 与 32。上限 8 的那次看起来像这样：

```bash
python -m sglang.benchmark.serving --backend sglang --port 30000 \
  --dataset-name random --random-input-len 512 --random-output-len 128 \
  --random-range-ratio 1.0 --num-prompts 32 --max-concurrency 8 --seed 7
```

**路径变了。** 基准工具在 2026-06 移进了 `sglang.benchmark` 包。`python -m sglang.bench_serving` 仍作为弃用别名跑，并导入新模块。`python -m sglang.bench_one_batch` 与 `python -m sglang.bench_offline_throughput` 在 v0.5.22 不跑。[PR #40795](https://github.com/sgl-project/sglang/pull/40795) 于 2026-09-22 删掉了两个别名 {{code}}。如果一份教程用那两条路径，它是为更旧的 SGLang 写的，它的其他标志也可疑。

## 四个会改结果的默认 {#s-sglang-benchmark-serving-four-defaults-that-change-the-result}

客户端在测量任何东西之前就做选择。每一个都会改你报告的数字，而多数已发布的基准不说它们保留了哪些。

| 设置 | v0.5.22 默认 | 对结果的影响 |
|---|---|---|
| `--random-range-ratio` | 0.0 | 每一个长度从 1 抽到你要的长度，所以平均提示大约是 `--random-input-len` 的一半 |
| `ignore_eos` | on | 服务器忽略结束 token，所以每一条请求正好生成 `--random-output-len` 个 token |
| `--request-rate` | `inf` | 所有请求在时间 0 发出，只有 `--max-concurrency` 挡住它们 |
| `--warmup-requests` | 1 | 时钟开始之前跑一条请求 |

第一行是陷阱。用默认比率时，`--random-input-len 512` 给出平均接近 256 个 token 的提示。你的报告随后说 512，却描述一半的工作。我们把比率设成 1.0，报告确认了它。32 条各 512 token 的提示给出 `Total input tokens: 16384`。开着 `ignore_eos` 时，这次跑给出 `Total generated tokens: 4096`，正好是 32 乘以 128。

**我们的立场：** 每一次都传 `--random-range-ratio 1.0`，或把长度分布写在结果旁边。一份藏起其长度的基准无法与任何东西比较。

## 一块一块读报告 {#s-sglang-benchmark-serving-read-the-report-block-by-block}

```listing
title: the report at a concurrency cap of 8
source: capture/out/bench-random-c8.txt
lang: text
note: Cut from the full output. The argument dump, the progress bar, and the P90 and P95 rows are cut.
---
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 8
Successful requests:                     32
Benchmark duration (s):                  16.02
Total input tokens:                      16384
Total generated tokens:                  4096
Request throughput (req/s):              2.00
Output token throughput (tok/s):         255.63
Peak output token throughput (tok/s):    440.00
Peak concurrent requests:                16
Total token throughput (tok/s):          1278.13
Concurrency:                             7.96
…
Median TTFT (ms):                        785.79
P99 TTFT (ms):                           2180.87
…
Mean TPOT (ms):                          23.02
Median TPOT (ms):                        22.52
…
Median ITL (ms):                         20.35
P99 ITL (ms):                            78.79
Max ITL (ms):                            1948.37
```

基准模块里的函数 `calculate_metrics` 计算每一行。其中五行容易读错。

**Concurrency：** 每一条请求端到端延迟之和除以跑的时长。它是事后测到的、平均在进行中的请求数。这里是 7.96，对上限 8。它告诉你上限达到了，别的什么都不告诉你。

**Peak concurrent requests：** 这次跑切成一秒一个桶，每一条请求算进它的区间碰到的每一个桶。该行报告最大的桶计数。两条在同一秒里一前一后跑的请求都计入，所以数字可以超过上限。这就是为什么报告在上限 8 时说 16，在上限 32 时说 64。

**TTFT：** 从发出请求到收到第一个流式块的时间。它包含排队、prefill 与网络。

**TPOT：** 对每一条请求，第一个 token 之后的时间除以剩余 token，`(latency - ttft) / (output_len - 1)`。报告给出跨请求的均值与百分位。**ITL：** 两个流式块之间的每一个间隙，跨所有请求汇集。一个带几个 token 的块算作一个间隙。

**Max ITL：** 单个最长的间隙，这里是 1,948 ms。一条请求在两个 token 之间等了将近两秒，同时新提示在跑它们的 prefill。中位 ITL 20 ms 藏起了那次卡住。P99 的 79 ms 露出一部分。

```figure
id: fig-5-1b
kind: structure
title: what each line of the report is computed from
claim: Concurrency and peak concurrent requests come from request timestamps after the run, so neither line repeats the cap you set.
caption: Read each row left to right, from the report line to the formula in calculate_metrics to our value at a cap of 8. Olive boxes are client measurements. From capture/out/bench-random-c8.txt and the benchmark module at v0.5.22.
```

## Sweep 与拐点 {#s-sglang-benchmark-serving-the-sweep-and-the-knee}

一次跑告诉你一个点。三次跑、上限分别是 1、8 与 32，告诉你形状。

| 上限 | 输出 tok/s | 中位 TTFT | P99 TTFT | 中位 TPOT | 并发 |
|---|---|---|---|---|---|
| 1 | 175.15 | 162.98 ms | 270.18 ms | 4.38 ms | 0.99 |
| 8 | 255.63 | 785.79 ms | 2180.87 ms | 22.52 ms | 7.96 |
| 32 | 252.74 | 3917.54 ms | 8262.86 ms | 93.61 ms | 31.94 |

**我们在抓取 Mac 上测到**这一点。从 1 到 8，输出吞吐升 46%，中位第一个 token 慢 4.8 倍。从 8 到 32，吞吐大约降 1%。中位第一个 token 慢 5 倍，中位每个 token 时间慢 4.2 倍。

```figure
id: fig-5-1
kind: comparison
title: throughput stops at a cap of 8, latency does not
claim: Raising the cap from 8 to 32 added no throughput and made the median first token five times slower.
caption: Left, output tokens per second at each cap. Right, median TTFT at the same caps on a shared scale. Olive bars are client measurements, and rose marks the run past the knee. From capture/out/bench-random-c1.txt, c8.txt, and c32.txt.
```

拐点是吞吐停止上升之后的那个上限。在这台机器上它在 8 或以下。过了拐点，服务器没有空闲算力可给。新请求只是等同一批 decode 步里的一份。调度器在[第 2.2 节](#s-the-scheduler-loop-and-schedule-policy) 里仍会接纳它们，因为这台 Mac 上它的接纳上限是 `max_running_requests=4096`。

**什么会转到 GPU 上。** 绝对数字不会。Apple silicon 上的 0.6B 模型对 H100 什么也说不了。形状转到了我们测过的那些服务器上。每一台都有一个延迟拐点，过了之后延迟比吞吐涨得更快，而默认接纳上限远高于它。

## 同一份 GPU 上的 sweep，当作实验来跑 {#s-sglang-benchmark-serving-the-same-sweep-on-a-gpu-run-as-an-experiment}

GPU 上的一次跑告诉我们假东西。GPU 套件在 NVIDIA GB10 上用 Qwen3-30B-A3B 启动默认服务器，每个上限跑一次。

```listing
title: the server under test on the GB10
source: capture/gpu/out-gb10/server-default.command.txt
lang: text
note: The full command, as the GPU kit started it.
---
sglang serve --model-path Qwen/Qwen3-30B-A3B-Instruct-2507 --host 127.0.0.1 --port 30000 --enable-cache-report --enable-metrics --mem-fraction-static 0.7
```

在上限 8 时单次跑报告中位第一个 token 677.61 ms。在上限 32 时报告 390.38 ms。更多负载给出更快的第一个 token，没有队列能解释那一点。一次跑是一个样本，一个样本可能因为你从未看见的原因是错的。

所以我们按模型团队跑训练比较的方式跑 sweep。[我们的 sweep 脚本](manuals/sglang-101/capture/gpu/sweep.py) 从 1 到 64 每个上限跑三次，种子是 1、2 与 3。它传 `--output-details`，所以每一次跑保留每一条请求的 TTFT 与 token 间隙。[我们的摘要脚本](manuals/sglang-101/capture/gpu/summarize.py) 把每个点的三次跑收成中位、最低与最高值。

| 上限 | 单次套件跑，中位 TTFT | 三个种子，中位 TTFT（最低到最高） |
|---|---|---|
| 8 | 677.61 ms | 209.98 ms（185.25 到 216.02） |
| 32 | 390.38 ms | 416.37 ms（338.06 到 434.64） |

**我们在同一块 GB10 上测到**两者，用两台不同的服务器。套件单次跑在 2026-10-17 有 227,243 个 token 的池，sweep 在 2026-10-16 有 234,600 个 token 的池。677.61 ms 的结果在又三次跑里没有回来。从上限 2 起，第一个 token 随上限变慢，正如队列所预测。

后来我们在套件跑的服务器日志里找到了假结果的原因。套件把每一次带种子 7 的跑发给同一台服务器，且从未清掉前缀缓存。用一个种子时，客户端在每一次跑里发同样的前几条提示 {{code}}。所以每一次跑都在缓存里找到前一次跑的提示：

```listing
title: a run that found its prompts in the cache
source: capture/gpu/out-gb10/server-default.log
lang: text
note: Three prefill lines from the kit run at a cap of 32. The first two admit 29 requests that need one new token each. The third is the first prompt that was new to the cache. The ends of the lines are cut.
---
[2026-10-17 14:23:00] Prefill batch, #new-seq: 14, #new-token: 14, #cached-token: 6879, token usage: 0.07, …
[2026-10-17 14:23:00] Prefill batch, #new-seq: 15, #new-token: 15, #cached-token: 7634, token usage: 0.07, …
[2026-10-17 14:23:47] Prefill batch, #new-seq: 1, #new-token: 510, #cached-token: 2, token usage: 0.01, …
```

**我们数了**每一次套件跑的 prefill 行。在上限 8 时，64 条提示里有 16 条在跑开始前就在缓存里。在上限 32 时，128 条里有 64 条，在上限 64 时，256 条里有 128 条。已缓存的提示跳过其 prefill，所以它的第一个 token 来得快。上限 32 时一半请求有那个优势，上限 8 时是四分之一。这就是中位第一个 token 下降的原因。

```figure
id: fig-5-1c
kind: chart
title: output throughput against concurrency on a GB10
claim: Three seeds per point agree closely, so each line is a measurement and the gaps between the lines are real.
caption: Read each line from left to right, one server configuration per line. The band is the lowest and the highest of three seeds. Qwen3-30B-A3B, 512 tokens in and 128 out. From capture/gpu/summary/gb10.json.
```

图里最宽的带是上限 8 时的 EAGLE-3，从 86.93 到 107.23 tok/s。其他每一条带都在其中位大约 10% 以内。有了那份散布，1.9 倍的差距是真的。在上限 64 时，FP8 给出 440.86 tok/s，BF16 给出 235.38 tok/s。没有 CUDA graph 的那次跑压在默认线上，[第 4.1 节](#s-forwardmode-and-cuda-graphs) 解释了为什么。

### 中位数藏起两群人 {#s-sglang-benchmark-serving-a-median-hides-two-populations}

`--output-details` 写出每一条请求的第一个 token 时间。我们把上限 16 时三个种子的所有请求排序并画出来。

```figure
id: fig-5-1e
kind: chart
title: TTFT quantiles of three runs at a cap of 16
claim: About half of the requests waited several times longer than the other half, so the median describes neither group.
caption: Each line is drawn from 51 quantiles of the pooled requests, from the fastest to the slowest. The rose line marks P90. The time axis is logarithmic. From the per-request records in capture/gpu/summary/gb10.json, the load sweep at a cap of 16.
```

**我们在 GB10 上测到**两群。对 BF16，最快一半请求的第一个 token 从 186.3 到 211.8 ms。从第 68 百分位起，请求等了 1,639.8 到 1,743.4 ms。中位是 237.6 ms，P90 是 1,721.5 ms，多 7.2 倍。FP8 有同样的两群：快的一半是 122.7 到 139.5 ms，慢的一半是 589.9 到 1,162.2 ms。

EAGLE-3 有最慢的中位，579.3 ms，以及最短的尾部，P90 是 1,007.4 ms。它的每个 token 时间反而有最宽的散布：中位 82.8 ms，P98 是 191.3 ms。接受的 draft token 数每一步都在变。

**我们对两群的解读：** 工作负载制造了它们。每一条请求正好要 128 个 token，因为 `--random-range-ratio 1.0` 固定了长度。一起开始的请求因此一起结束，它们的替换一起到达。然后每一波都在前面的请求后面排队等 prefill。真实流量有混合长度。如果你用固定长度测，把 P90 读成一次突发的代价，而不是正常请求的代价。

前缀缓存给出第二种解读，我们排除不了它。Sweep 也为同一种配置的所有跑保留一台服务器，没有冲洗。每个种子在每一个上限发同样的前几条提示。在上限 16 时，64 条提示里有 32 条是上限 8 那次跑的提示。如果它们仍在池里，一半请求跳过了其 prefill。我们没有保留 sweep 的完整服务器日志，所以数不了命中。

我们在 L4 上测了这种解读，不是在 GB10 上。在 2026-10-23 我们跑了 Qwen3-8B 的负载 sweep，每一次跑前冲洗，并锁在 900 MHz。我们把它与同一次会话里没有冲洗的一次跑比较：

```listing
title: median TTFT with and without a flush, Qwen3-8B on our L4 at 900 MHz
source: capture/gpu/out-l4/load-flushed-vs-unflushed.txt
lang: text
note: The median TTFT rows. The share of requests that met the target and the P99 ITL lines are cut.
---
median TTFT, flushed against unflushed
users   vLLM                                   SGLang
4       650 / 145 ms (4.5x)                    532 to 645 / 141 ms (3.8 to 4.6x)
8       951 to 978 / 264 to 274 ms (3.6x)      1,174 to 1,273 / 173 to 178 ms (6.6 to 7.3x)
16      1,550 to 1,587 / 294 to 295 ms (5.3x)  1,804 to 1,944 / 218 ms (8.3 to 8.9x)
…
```

在 L4 上，冲洗把 SGLang 在 4 到 16 个用户时的中位 TTFT 抬高 4 到 9 倍。每个 token 时间变了不到 10%。所以在 L4 上，缓存制造了多数快的那一群。在 GB10 上我们没有重跑 sweep，所以两种解读在那里都仍开着。

### 我们在一块 L4 上测了波浪 {#s-sglang-benchmark-serving-we-tested-the-waves-on-an-l4}

一种解读在你改掉它归咎的那个变量之前都是假设。我们在一块 L4 上用上限 16 与 64 条提示跑 Qwen3-8B，每个点三个种子。只有 `--random-range-ratio` 变了，从 1.0 到 0.5 到 0.0。

```listing
title: one wave on the L4 with fixed lengths
source: capture/gpu/out-l4/server-waves-default.log
lang: text
note: Five consecutive lines from a run at a ratio of 1.0. Timestamps are kept, because the timing is the point.
---
[2026-10-17 15:54:33] Prefill batch, #new-seq: 8, #new-token: 4096, #cached-token: 1, token usage: 0.34, #running-req: 1, #queue-req: 0, #pending-token: 513, cuda graph: True, input throughput (token/s): 3509.80
[2026-10-17 15:54:34] Prefill batch, #new-seq: 8, #new-token: 3583, #cached-token: 0, token usage: 0.34, #running-req: 8, #queue-req: 0, #pending-token: 0, cuda graph: True, input throughput (token/s): 3503.78
[2026-10-17 15:54:35] Decode batch, #running-req: 16, #token: 8240, token usage: 0.34, cuda graph: True, gen throughput (token/s): 2.62, #queue-req: 0
[2026-10-17 15:54:37] Decode batch, #running-req: 16, #token: 8880, token usage: 0.37, cuda graph: True, gen throughput (token/s): 231.07, #queue-req: 0
[2026-10-17 15:54:40] Decode batch, #running-req: 16, #token: 9520, token usage: 0.40, cuda graph: True, gen throughput (token/s): 229.85, #queue-req: 0
```

波浪在日志里。只有一条请求在跑，所以十五条刚一起结束，它们的替换一起到达。调度器把它们当作最多 4,096 个 token 的两块做 prefill，然后全部 16 条一起 decode。

```figure
id: fig-5-1h
kind: chart
title: Fixed lengths trade a slow first token for smooth decoding
claim: With fixed lengths the median TTFT was 1,996 ms and P99 ITL 82 ms, and with mixed lengths they were 291 ms and 300 ms.
caption: Solid lines are median TTFT and dashed lines are P99 inter-token latency, three seeds per point, on a log scale. Plum is BF16 and green is FP8 with an FP8 KV cache. From capture/gpu/summary/l4.json.
```

| 比例 | BF16 中位 TTFT | BF16 P99 ITL | FP8 中位 TTFT | FP8 P99 ITL |
|---|---|---|---|---|
| 1.0 | 1,996 ms | 82 ms | 1,526 ms | 55 ms |
| 0.5 | 364 ms | 396 ms | 130 ms | 95 ms |
| 0.0 | 291 ms | 300 ms | 129 ms | 95 ms |

**我们测到**固定长度时第一个 token 在 BF16 上慢 6.9 倍，在 FP8 上慢 11.8 倍。两个比率下的 FP8 跑中位时钟是 1,185 与 2,040 MHz。所以 FP8 倍数的一部分是时钟。混合长度送出更少 token。在种子 1 里，比率 0.0 送出 17,870 个输入 token，对上 1.0 时的 32,768。所以差距的一部分是更少的工作。

缓存能解释另一部分。在每个种子里，比率 1.0 的跑先来，并以空缓存开始。比率 0.5 与 0.0 的跑在它之后。它们的每一条提示都是比率 1.0 那次跑里一条提示的前一部分。BF16 的 24,094 token 池只持有那次跑 32,768 个 token 的一部分。FP8 的 142,369 token 池能全部持有。

更少的工作与缓存解释不了结果的另一半。混合长度时，P99 ITL 从 82 升到 300 ms。新提示一个接一个到达，每一次 prefill 都停下在跑的 decode。固定长度时，prefill 只发生在波浪之间。

GB10 配 Qwen3-30B-A3B、每个点三个种子时给出同样的形状。固定长度时，BF16 中位 TTFT 是 1,650 ms，P99 ITL 是 169 ms。混合长度时，它们是 320 ms 与 230 ms。FP8 从 1,050 ms 与 92 ms 到 188 ms 与 127 ms。两块 GPU 与两个模型展示同样的权衡，所以在我们两台机器上它来自工作负载，不是来自硬件。

两种设置测的是两台不同的服务器。固定长度测突发：慢的第一个 token，之后平滑的 token。混合长度测稳定流量：快的第一个 token，以及流里的卡住。在比较两个构建时保留 `--random-range-ratio 1.0`，因为它精确重复。在你从它设延迟目标之前，也跑你真实的长度分布。

## 在跑之间重置前缀缓存 {#s-sglang-benchmark-serving-reset-the-prefix-cache-between-runs}

前缀缓存在一次跑结束之后仍保留更早提示的 KV。它改下一次跑里的两件事：速度，有时还有贪心输出，如[第 4.6 节](#s-deterministic-inference-and-logprobs)所示。

为了看速度效应的大小，我们用同一个种子把一种负载连跑四次。我们用 `Qwen/Qwen3-0.6B`，上限 16 时 64 条提示，512 进、128 出。这是在我们 L4 节点的第二块 GPU 上，其所有者共享它，且没有锁时钟。所以信任比率，不要信任时间。

```listing
title: median TTFT in ms, the same load four times in a row
source: capture/gpu/out-l4/prefix-cache-flush.txt
lang: text
note: The SGLang row of the summary. The vLLM row is cut.
---
engine        fresh   repeat, not flushed   repeat after a flush   repeat, not flushed
SGLang 0.6B   394     82.5                  289                    77
…
```

没有冲洗的重复把中位 TTFT 读成比新鲜跑大约低 4.8 倍。冲洗之后，TTFT 回到接近新鲜跑。每个 token 时间变了不到 15%。

对每一次你要比较的跑用这份协议：

1. 让每一次跑以空缓存开始。向 `sglang.benchmark.serving` 传 `--flush-cache`，它在预热请求之后调用 `/flush_cache` {{code}}。你也可以自己调用 `POST /flush_cache`，或重启服务器。
2. 检查冲洗跑过了。只有没有请求在跑或等待时服务器才冲洗。否则该路由以 HTTP 400 回答，日志说 `Cache not flushed because there are pending requests` {{code}}。
3. 每一次跑用新的 `--seed`，好让客户端发新提示。
4. 记下已缓存的 token。在跑之前与之后从 `/metrics` 读 `sglang:cached_tokens_total`。开着 `--enable-cache-report` 时，每一条 OpenAI 风格的响应也给出 `usage.prompt_tokens_details.cached_tokens`。
5. 把缓存设置与已缓存的 token 写在结果旁边。

我们的套件与我们的 sweep 没有遵循这份协议。每一台服务器上每个种子只有第一次跑以空缓存开始。本页后面的 TTFT 数字可能太低，尤其是在 GB10 上，它的池持有我们发过的每一条提示。每个 token 时间暴露得更少，因为缓存命中去掉 prefill 工作，并留下同样的 decode 工作。

## Goodput 找到吞吐藏起的拐点 {#s-sglang-benchmark-serving-goodput-finds-the-knee-that-throughput-hides}

在 GB10 上，BF16 吞吐在上限 64 时仍在上升，因为 KV 池持有 234,600 个 token。一条没有拐点的吞吐曲线不告诉你该停在哪里。一个延迟目标会。

**Goodput：** 在延迟目标内完成的每秒请求数。我们的摘要脚本在第一个 token 1 秒内到来、且平均每个 token 时间低于 100 ms 时计一条请求。

| 上限 | BF16 goodput | BF16 中位 TPOT | FP8 goodput | FP8 中位 TPOT |
|---|---|---|---|---|
| 4 | 0.44 req/s | 71.01 ms | 0.80 req/s | 38.60 ms |
| 8 | 0，某一个种子上最高到 0.04 | 102.21 ms | 1.07 req/s | 54.96 ms |
| 16 | 0 | 154.24 ms | 1.10 req/s | 81.90 ms |
| 32 | 0 | 201.91 ms | 0 | 104.12 ms |

BF16 goodput 在上限 4 时最高。从上限 8 起，中位请求每个 token 超过 100 ms，所以 goodput 是 0。那个上限上的吞吐是 74.11 tok/s 且仍在上升。FP8 把目标保持到上限 16。**我们的立场：** 从你自己目标下的 goodput 选上限，只用吞吐曲线来解释它。

一个上限是闭环。每个客户端在发下一条请求之前等它的答案，所以服务器永远收不到比它完成得更多的工作。真实用户彼此不等。`--request-rate` 改为在泊松到达时间发请求，当服务器比到达更慢时队列增长。我们以每秒 0.5 到 16 个请求跑同一模型，每个三个种子。

```figure
id: fig-5-1d
kind: chart
title: requests served and requests served within the target, against offered load
claim: FP8 served 1.03 requests per second within the target at 1 offered, and BF16 served almost no request within the target at any rate.
caption: Dashed lines are requests completed per second. Solid lines are requests that met the target, with the range of three seeds as a band. Green is FP8 with an FP8 KV cache, plum is BF16. From capture/gpu/summary/gb10.json, the rate sweep.
```

**我们在 GB10 上测到**这一点。在每秒 0.5 个请求时，BF16 已经有 177.5 ms 的中位每个 token 时间。到达重叠：在每秒 0.52 个请求、各 128 个 token、每个 token 177.5 ms 时，大约 12 条请求共享每一个 decode 步。只有每秒 0.07 个请求达到目标。FP8 到每秒 1 个时每一条请求都达到目标，然后在 2 时降到 0.17。

在每秒 16 时，BF16 完成每秒 3.88 个请求，其 P99 第一个 token 花了 55,640.4 ms。FP8 完成 8.26。到每秒 4 个请求时 GPU 时钟停在 2,496 MHz。在 16 时，GPU 到了 89 C，并在 7.3% 的样本里处于热降速。最后一个 BF16 点测的是一块热 GPU，也是一个满队列。

我们在一块 24 GB L4 上用 Qwen3-8B 跑了同样的开环，每一次跑前冷却到 72°C。

```figure
id: fig-5-1g
kind: chart
title: the same open loop on a 24 GB L4
claim: On the L4, FP8 served 3.18 requests per second within the target at 4 offered, and BF16 served none within the target from 4 offered.
caption: Dashed lines are requests completed per second. Solid lines are requests that met the target, with the range of three seeds as a band. Green is FP8 with an FP8 KV cache, plum is BF16. From capture/gpu/summary/l4.json, the rate sweep.
```

**我们在更小的卡上测到**不同的形状。两个服务器到每秒 1 个时每一条请求都达到目标。BF16 在 offer 2 时在目标内保持 0.88，从 4 起一个都没有。FP8 在 offer 4 时在目标内保持 3.18，是最好 BF16 点的三倍。FP8 服务器还有 142,369 个 token 的池，对上 BF16 的 24,094。从 offer 4 起，BF16 池是上限。

过了峰值之后，我们 offer 得越多，BF16 完成的请求越少：offer 4 时每秒 2.01，8 时 1.91，16 时 1.62。遥测显示为什么。中位 SM 时钟从 offer 4 时的 1,320 MHz 降到 16 时的 465 MHz。在 16 时，70% 的样本显示热降速。在我们被动冷却的 L4 上，过载既花吞吐也花延迟。

## 在高速率下检查客户端 {#s-sglang-benchmark-serving-check-the-client-at-high-rates}

`sglang.benchmark.serving` 从一个带 asyncio 的 Python 进程发每一条请求 {{code}}。一项 2026 年对基准客户端的研究发现，这样的客户端在高请求速率下加上自己的队列。客户端随后报告高于服务器实际做的 TTFT 与 TPOT。该研究改用在几个进程里跑的客户端。

我们没有测这个效应。我们的开环停在每秒 16 个请求，我们没有记下客户端的 CPU 使用。在你信任高速率下的 TTFT 之前，把一个客户端进程与两个各发一半速率的进程比较。

## 在一台服务器上比较两个客户端 {#s-sglang-benchmark-serving-compare-two-clients-on-one-server}

我们的 sweep 表来自温度 0 下的 `sglang.benchmark.serving`，那是它的默认。另一个客户端可以从同一台服务器读出不同的数字。我们在 2026-10-23 对着一台带 `Qwen/Qwen3-0.6B` 的 vLLM 0.31.0 服务器跑了三个客户端。它们是带 `--backend vllm` 的这个客户端、`vllm bench serve`，以及它的 Rust 版本。GPU 是我们节点上共享的第二块 L4。它的时钟被节流，但对每一次跑都停在 420 到 495 MHz。

```listing
title: median TTFT in ms from three clients, two rounds each
source: capture/gpu/out-l4/bench-client-bias.txt
lang: text
note: The rows at temperature 0 from the TTFT table. The rows at temperature 0.7 and the throughput table are cut.
---
users   temperature   SGLang client    vllm bench       vllm bench, Rust
1       0             154, 164         149, 150         144, 144
…
16      0             1,077, 1,045     1,033, 1,027     1,088, 1,038
…
64      0             1,688, 1,838     1,624, 1,667     1,674, 1,789
```

- 我们的客户端读到的中位 TTFT 比 `vllm bench serve` 高 3% 到 10%。在 16 与 64 个用户时，它读到的输出吞吐低 2% 到 8%。在一个用户时，它的一轮读到比其他每一轮更高的吞吐，所以我们在那里不给吞吐差距。
- `vllm bench serve` 的 Python 与 Rust 版本在噪声内一致。
- 客户端从它们的随机数据集发不同的提示 token，所以小差距的一部分可能来自提示。
- 温度 0.7 把中位 TPOT 抬高过温度 0。在一个用户时高 10% 到 13%，在 16 与 64 个用户时高 3% 到 6%。

所以两个已发布数字之间几个百分点的差距可以只来自客户端。把客户端与温度和每一个结果一起报告。

## 每一次跑都记下 GPU 时钟 {#s-sglang-benchmark-serving-record-the-gpu-clock-with-every-run}

我们在 NVIDIA L4 上的第一次 sweep 报告说 CUDA graph 什么都没做。上限 1 时中位每个 token 时间带 graph 是 103.4 ms，不带也是 103.4 ms。那个上限上的三个种子给出从 10.0 到 14.9 tok/s，散布是中位的一半。然后我们在 sweep 期间读了 `nvidia-smi`。

```listing
title: the L4 during the first sweep
source: capture/gpu/incidents/l4-thermal-throttle.txt
lang: text
note: The header row and the row of the GPU that ran the sweep.
---
index, temperature.gpu, power.draw [W], power.limit [W], clocks.current.sm [MHz], clocks.max.sm [MHz], clocks_event_reasons.active, clocks_event_reasons.sw_thermal_slowdown, clocks_event_reasons.hw_thermal_slowdown, clocks_event_reasons.sw_power_cap, utilization.gpu [%]
0, 87, 58.36 W, 72.00 W, 360 MHz, 2040 MHz, 0x0000000000000020, Active, Not Active, Not Active, 100 %
```

GPU 在 87 C，软件热降速是 Active，其 SM 时钟是 2040 里的 360 MHz。L4 是一块 72 W、被动冷却的卡，同一机箱里的第二块卡同时跑着其他工作。我们测到的是一块热 GPU，其下的服务器不是原因。

现在 sweep 脚本每秒把 `nvidia-smi` 采样进每一次跑旁边的 `.gpu.csv` 文件。每一次跑之前它最多等 900 秒，让 GPU 冷却到 `--cool` 上限以下，默认 65 C。这个机箱里的 L4 跑得偏热，所以我们用 `--cool 72` 跑。摘要脚本给每个点加上中位 SM 时钟、最高温度，以及带热降速位的样本份额。[图 5.1c](#fig-5-1c) 里的 GB10 负载 sweep 在我们加上采样器之前跑，所以它紧的带是对它唯一的检查。

我们用同样的命令与冷却又跑了 L4 sweep。被节流的 sweep 是下一张图里的玫瑰色线。

```figure
id: fig-5-1f
kind: chart
title: the same server on the same L4, measured hot and measured with a cool-down
claim: The hot sweep reported up to 28 percent less throughput than the cooled sweep, with the same command on the same card.
caption: Blue is the sweep with a cool-down to 72 C and the clock recorded, and rose is the first sweep with no telemetry. Bands are the range of three seeds. Qwen3-8B, 512 tokens in and 128 out. From capture/gpu/summary/l4.json and capture/gpu/summary/l4-throttled.json.
```

**我们在 L4 上测到**差异。在上限 32 时，冷却后的 sweep 给出 270.11 tok/s，热的 sweep 给出 194.16 tok/s。在上限 1 时，中位每个 token 时间是 60.16 ms 对上 103.38 ms。

冷却后的跑也不是全速。它们的中位 SM 时钟是 2,040 里的 1,080 到 1,515 MHz。在上限 1 与 64 时，最差的种子里仍有 41% 到 49% 的样本带着热位。冷却去掉最坏的误差，记下的时钟告诉你还剩多少。

**我们的立场：** 没有每一次跑的时钟与温度的基准不是证据。先读时钟，再读吞吐。

## 我们的立场 {#s-sglang-benchmark-serving-our-position}

报告仍满足你延迟目标的最高并发，并把它的吞吐与同一次上限下的 p50 与 p99 TTFT 与 TPOT 一起报告。「上限 8 时 255 tok/s，中位第一个 token 0.79 s」是一个结果。「255 tok/s」是一句口号。

然后在引擎外强制执行拐点。引擎自己的上限从内存设定，而内存在延迟已经不可接受很久之后才耗尽。把上限放在你的客户端、你的网关，或 `--max-running-requests` 里，并从 sweep 定它的大小。

## 事故：一份手写脚本 {#s-sglang-benchmark-serving-the-incident-a-hand-written-script}

[Issue #3196](https://github.com/sgl-project/sglang/issues/3196) 报告八块 H200 上 DeepSeek V3 是 13 tok/s，对上 DeepSeek API 的 60 tok/s {{issue #3196}}。另一位用户在两个 H100 节点上达到 33 tok/s。测量脚本按空格切词计数，并把第一个 token 时间算进速率。一个词不是一个 token，TTFT 也不是 decode 时间，所以脚本报告的比服务器做的更少。修复是用基准客户端测，它计 token，并把 TTFT 与 TPOT 分开。

```takeaways
- 跑 `python -m sglang.benchmark.serving`，永远不要用手写计时循环。
- 传 `--random-range-ratio 1.0`，或写明你用的长度分布。
- 在设延迟目标之前先测你真实的长度混合，因为固定长度会形成波浪。
- 至少扫三个并发上限，并画出吞吐对上中位 TTFT。
- 只把吞吐与同一次上限下的 p50 与 p99 TTFT 与 TPOT 一起报告。
- 把 Concurrency 读成已达到的平均，把 Peak concurrent requests 读成每秒计数。
- 在你的客户端或网关里强制执行拐点，因为引擎接纳得远更多。
- 每个点用三个种子跑，并画出最低与最高结果。
- 从你延迟目标下的 goodput 选并发上限。
- 每一次跑都记下 SM 时钟与温度，并报告它们。
- 搁置低于时钟下限的跑。
- 在每一次你要比较的跑之前传 --flush-cache，或调用 POST /flush_cache，并记下已缓存的 token。
- 在信任高请求速率下的 TTFT 之前，把客户端拆成几个进程。
- 把客户端与温度和每一个结果一起报告，并让两者都固定。
```

Sources: python/sglang/benchmark/serving.py (calculate_metrics, argument defaults, flush_server_cache, --flush-cache, the asyncio client), python/sglang/benchmark/datasets/common.py (compute_random_lens), python/sglang/benchmark/datasets/random.py (sample_random_requests), python/sglang/srt/entrypoints/http_server.py (flush_cache), python/sglang/srt/managers/scheduler.py (flush_cache), python/sglang/srt/observability/metrics_collector.py (cached_tokens_total), python/sglang/srt/entrypoints/openai/usage_processor.py, python/sglang/bench_serving.py, PR #40795, all at v0.5.22 (baa9befa); capture/out/serve-help.txt, capture/out/server-default.command.txt, capture/out/server-default.log, capture/out/bench-random-c1.txt, capture/out/bench-random-c8.txt, capture/out/bench-random-c32.txt; capture/gpu/sweep.py, capture/gpu/summarize.py, capture/gpu/summary/gb10.json, capture/gpu/summary/l4.json, capture/gpu/summary/l4-throttled.json, capture/gpu/out-gb10/server-default.command.txt, capture/gpu/out-gb10/bench-random-c8.txt, capture/gpu/out-gb10/bench-random-c32.txt, capture/gpu/incidents/l4-thermal-throttle.txt; issue #3196. capture/gpu/out-l4/server-waves-default.log, capture/gpu/out-l4/waves-default-input-tokens.txt, capture/gpu/out-gb10/server-pools.log, capture/gpu/out-gb10/server-default.log, Chandrasekar and Kramberger, Identifying and Mitigating Systemic Measurement Bias in Production LLM Inference Benchmarks, arXiv 2605.24217 (2026-05), capture/gpu/out-l4/prefix-cache-flush.txt, capture/gpu/out-l4/bench-client-bias.txt, capture/gpu/out-l4/load-flushed-vs-unflushed.txt
