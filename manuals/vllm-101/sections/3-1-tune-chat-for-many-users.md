# 为大量用户调优聊天服务

> 对聊天来说，token 之间最长的间隔比吞吐量更重要，所以随着用户增加，要盯住 P99 ITL。

你的聊天服务在少量用户时流式输出很流畅，用户一多，token 之间就出现长间隔。读完本节后，你能在用户数量增长时让输出流保持稳定。

**我们的结果：** 在我们的 L4 上，16 个用户时大约三分之二的请求达到了延迟目标，32 个用户时一个都没有。给 batch 设上限并不能解决问题。

## 了解聊天用户的感受 {#s-tune-chat-for-many-users-know-what-a-chat-user-feels}

聊天用户能感受到两个数字。第一个是到第一个 token 的时间（TTFT）。第二个是回答流式输出时 token 之间的间隔（ITL）。吞吐量是你付钱买的东西，但用户看不到它。

盯住 P99 ITL，也就是每 100 个间隔里最差的那个。流里的一次长停顿，比整体稍慢一点的流感觉更糟。为这两个数字都设定目标。我们的目标是第一个 token 在 1 秒内到达，每个 token 不超过 100 ms。

## 看看输出流在哪里断开 {#s-tune-chat-for-many-users-see-where-the-stream-breaks}

**我们测量了** 2026-10-21 在我们的 L4 上用 `Qwen/Qwen3-8B` 同时服务 1 到 64 个用户的情况，在[满频会话](#l4-sessions)中进行。每个请求发送 512 个 prompt token，要求生成 128 个 token，每个点跑三个 seed。

| 用户数，L4 满频会话 | 输出 tok/s | TTFT 中位数 | P99 ITL | 达到目标的请求比例 | SM 时钟中位数 |
|---|---|---|---|---|---|
| 8 | 112.8 | 0.25 s | 67 ms | 75% | 1,485 MHz |
| 16 | 201.3 | 0.29 s | 85 ms | 64% | 1,455 MHz |
| 32 | 275.1 | 1.80 s | 613 ms | 0% | 1,275 MHz |
| 64 | 242.3 | 11.18 s | 1,233 ms | 0% | 1,005 MHz |

在 16 个用户以内，每多一个用户，输出就增加一些，输出流也保持稳定。但在 16 个用户时，已经有三分之一的请求拿到第一个 token 太晚了。到 32 个用户时，输出仍在上升，但 P99 ITL 增长了七倍，没有一个请求达到目标。服务器很忙，而用户在等待。

### 把 32 个用户以下的结果视为受到 prefix cache 复用的影响 {#s-tune-chat-for-many-users-treat-results-below-32-users-as-affected-by-prefix-cache-reuse}

这次扫描在所有用户数下都使用同一个服务器，并且在不同用户数之间没有重置 prefix cache。每个 seed 在每个用户数下都发送相同的前几个 prompt，所以很多请求在 cache 里找到了自己的 prompt，跳过了 prefill。2026-10-23 我们在同一块 L4 上重新跑了这次扫描，每次运行前都做重置，时钟锁定在 900 MHz。我们把它和同一会话中一次未清空 cache 的运行做了比较：

```listing
title: median TTFT with and without a cache flush, Qwen3-8B on our L4 at 900 MHz
source: capture/gpu/out-l4/load-flushed-vs-unflushed.txt
lang: text
note: The median TTFT rows. The share that met the target and the P99 ITL lines are cut.
---
median TTFT, flushed against unflushed
users   vLLM                                   SGLang
4       650 / 145 ms (4.5x)                    532 to 645 / 141 ms (3.8 to 4.6x)
8       951 to 978 / 264 to 274 ms (3.6x)      1,174 to 1,273 / 173 to 178 ms (6.6 to 7.3x)
16      1,550 to 1,587 / 294 to 295 ms (5.3x)  1,804 to 1,944 / 218 ms (8.3 to 8.9x)
32      1,982 to 2,084 / 2,012 to 3,091 ms     3,216 to 3,228 / 2,710 to 2,917 ms
…
```

有了重置后，8 个用户时 50% 的请求达到了我们的目标，而不重置时是 75% 到 81%。16 个用户时，这个比例从大约 65% 降到 25%。16 个用户时，有重置的 P99 ITL 是 522 ms，而同一会话中未清空的运行是 82 到 84 ms。从 32 个用户开始，队列占了主导，重置几乎没有改变什么。所以在这块卡上，输出流在 8 到 16 个用户之间断开，而不是在 16 到 32 之间。上面的表格保留为满频会话的记录。

在这块 GPU 上，每一步有 2,048 个 token 的预算。新的 prompt 到达时，它们的 chunk 会和正在运行的流共享这一步，所以正在运行的流会暂停。[token 预算页](#s-why-one-token-budget-replaces-a-prefill-phase)解释了其中的顺序。

## 了解序列上限的作用 {#s-tune-chat-for-many-users-know-what-a-cap-on-sequences-does}

`--max-num-seqs` 设置同时运行多少个请求。在 L4 上默认值是 256，[token 预算页](#s-keep-long-prompts-from-stalling-short-ones)给出了其他 GPU 的规则。我们把它设成 16，跑了同样的扫描：

```figure
id: fig-3-1
kind: chart
title: a cap of 16 sequences as users grow
claim: A cap of 16 sequences matched the default up to 16 users, and at 32 users it cut output from 275 to 172 tokens per second.
caption: Each point is the median of three seeds, and the bands span them. The time to the first token uses a log scale. From capture/gpu/summary/l4.json.
```

| 用户数，L4 满频会话 | 配置 | 输出 tok/s | TTFT 中位数 | ITL 中位数 | P99 ITL | SM 时钟中位数 |
|---|---|---|---|---|---|---|
| 32 | 默认 | 275.1 | 1.8 s | 80.5 ms | 613 ms | 1,275 MHz |
| 32 | `--max-num-seqs 16` | 171.8 | 12.3 s | 69.8 ms | 595 ms | 1,365 MHz |

上限让每个流都稍微平滑了一点。但一半的用户在队列里等待第一个 token，输出下降了 38%。设上限的运行时钟反而更高，所以时钟解释不了这部分损失。在 64 个用户时，设上限的运行降到了 630 MHz，所以我们不比较那一行。

上限并不能为更多用户腾出空间，它只是决定谁来等待。

### 在 64 个用户时试试上限 {#s-tune-chat-for-many-users-try-a-cap-at-64-users}

在 64 个用户时，我们 L4 上 vLLM 的 P99 ITL 超过一秒，而 SGLang 大约是 150 ms。2026-10-23 我们尝试用上限来缩小这个差距。时钟锁定在 900 MHz，每次运行跑两个 seed 并重置 cache。`--max-num-active-seqs` 是 0.31.0 中的第二个上限，作用于一步中运行的请求。

```listing
title: caps at 64 users on our L4, vLLM 0.31.0 against SGLang 0.5.22
source: capture/gpu/out-l4/admission-cap-64-users.txt
lang: text
note: Rows from the evidence file. The rows that ran far below the lock are cut.
---
config                        median SM clock (s1/s2)   median TTFT       P99 ITL               output tok/s
SGLang default                900 / 900                 19.4 s            143 to 153 ms         225 to 231
…
vLLM default, earlier run     900                       11.8 s            1,359 ms              220
…
--max-num-seqs 32             900 / 795                 17.2 to 20.6 s    1,163 to 1,399 ms     196 to 230
…
--max-num-active-seqs 48      900 / 900                 11.8 s            1,329 to 1,373 ms     215 to 218
…
--max-num-active-seqs 16      795 / 683                 44.8 to 48.8 s    1,133 to 1,139 ms     129 to 136
```

我们试过的上限，没有一个能让 vLLM 的 P99 ITL 接近 SGLang 的数值。在 16 或 32 个运行请求时，P99 ITL 仍高于 1.1 s，第一个 token 要等 17 到 65 s。这一组中很多运行跑在锁定频率以下，文件把它们全部列了出来。所以在这块卡上，上限解决不了 64 个用户时的长间隔。减少每个副本的用户数才能解决。

## 看看小池子的作用 {#s-tune-chat-for-many-users-see-what-a-small-pool-does}

KV 池也会限制用户数。**我们测量了** 一个 6,560 token 的池（使用 `--num-gpu-blocks-override 410` 和 `--max-model-len 4096`），并与我们 24,096 token 的池做比较。两者都在 2026-10-22 于我们的 L4 上、在[锁定在 900 MHz 的会话](#l4-sessions)中运行，32 个用户，各跑两个 seed。

| 池，L4 锁频会话 | TTFT 中位数 | P99 TTFT | SM 时钟中位数 |
|---|---|---|---|
| 24,096 tokens | 3.1 s | 7.1 s | 881 MHz |
| 6,560 tokens | 31.6 s | 48.0 s | 248 MHz |

一个 640 token 的请求，到结束时需要 640 token 的池空间。所以 6,560 token 里同时只能放下大约 10 个请求。另外 22 个要等某个运行中的请求结束。

vLLM 只有在新请求的 block 能放进池里时才会启动它。一个需要新 block 的运行中请求可以把另一个请求挤出去，vLLM 把这算作一次 preemption。所以 32 个请求中的大多数在开始之前都在队列里等待。

小池子的运行降到了大约 250 MHz，低于锁定频率。时钟低 3.6 倍，最多可以让一步慢 3.6 倍。而第一个 token 晚到了 10 倍，所以大部分等待是队列造成的。不要比较这两次运行的吞吐量或每 token 时间。

## 调优 {#s-tune-chat-for-many-users-tune-it}

1. 为第一个 token 和每 token 时间设定目标。
2. 用你自己的负载、逐步增加用户数来跑，找到同时满足两个目标的最大用户数。
3. 如果 KV cache 使用率接近 100% 且请求在等待，说明池太小了。用 [FP8 KV cache](#s-fit-more-users-with-an-fp8-kv-cache) 或 [FP8 权重](#s-fit-a-bigger-model-with-fp8-weights)腾出空间。缩短最大长度在这里没有帮助，因为池的大小不变。
4. 如果池还有空间但 P99 ITL 太高，说明 GPU 已经满了。加一块 GPU 或一个副本。序列上限只会把等待转移到第一个 token 上。

在我们的 DGX Spark 上，vLLM 和 SGLang 在 32 和 64 个用户时输出相同。但 vLLM 的 P99 ITL 大约高出一倍，32 个用户时是 478 ms 对 220 ms。所以在为聊天选择引擎时，也要比较 P99 ITL。

```takeaways
- 对聊天，要盯住 P99 ITL 和第一个 token，而不只是吞吐量。
- 在我们的 L4 上，输出流在 16 到 32 个用户之间断开，而输出仍在上升。
- 序列上限会把等待转移到第一个 token 上，并损失输出。
- 小 KV 池会让请求排队，所以第一个 token 来得晚。
```

Sources: capture/gpu/summary/l4.json (load.vllm-b, load.vllm-seqs-16, load.vllm-lock-b, load.vllm-lock-small-pool), capture/gpu/summary/gb10.json (load.vllm, load.sglang), the vLLM source at v0.31.0 (vllm/engine/arg_utils.py, vllm/v1/core/sched/scheduler.py, vllm/v1/metrics/loggers.py), capture/gpu/out-l4/load-flushed-vs-unflushed.txt, capture/gpu/out-l4/admission-cap-64-users.txt.
