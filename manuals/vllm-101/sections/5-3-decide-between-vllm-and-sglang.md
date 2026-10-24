# 在 vLLM 和 SGLang 之间做选择

> 在固定用户数下，两个引擎在我们机器上的吞吐打平，而流量的形状决定了延迟。

你在选一个推理引擎，想要的是测量结果，而不是口碑。读完本节后，你能把你的流量对应到我们的某一组并排运行上，并说清这个结果能推广到多远。

**我们的结果：** 在我们的 L4 上，32 个用户以内吞吐相差不超过 3%。在我们的 DGX Spark 上，从 32 个用户起，vLLM 最差的 token 间隔约为 SGLang 的两倍。

## 了解我们比较了什么 {#s-decide-between-vllm-and-sglang-know-what-we-compared}

我们在两台机器上用默认设置运行了 vLLM 0.31.0 和 SGLang 0.5.22：

- 一块 NVIDIA L4，在[满频会话](#l4-sessions)中运行 BF16 的 `Qwen/Qwen3-8B`。两个池都约有 24,100 token。负载运行在 2026-10-17，速率和波次运行在 2026-10-18。
- 一台 DGX Spark，运行 BF16 的 `Qwen/Qwen3-30B-A3B-Instruct-2507`。vLLM 的池有 234,960 token，SGLang 的池在 233,303 到 251,910 token 之间。每次 SGLang 运行都和对应的 vLLM 运行在同一天，即 2026-10-21。

每个点都是三个种子的中位数，两个引擎都用[同一个基准测试客户端](#s-benchmark-your-server-in-15-minutes)。这是两块卡上的两个模型。请把结果看作该测量什么的指南，而不是规律。

## 按你的流量读结果 {#s-decide-between-vllm-and-sglang-read-the-result-for-your-traffic}

| 你的流量 | 我们测得的结果 | 选择 |
|---|---|---|
| 同时有很多用户，接近池的上限 | 在 L4 上，32 个用户以内吞吐相差不超过 3%。vLLM 的首 token 更快，SGLang 的流式输出更平稳。 | 看重首 token 选 vLLM，看重流式输出选 SGLang |
| 固定请求速率，超过 GPU 能承受的水平 | 在每秒 4 个请求时，vLLM 在 L4 上的输出多 11% | vLLM |
| 长度混合的 prompt，同时 16 个用户 | 两台机器上都是 vLLM 的 P99 ITL 更低 | 默认选 vLLM |
| 长度相同的 prompt，同时 16 个用户 | 两台机器上都是 SGLang 的 P99 ITL 更低 | SGLang |
| 固定速率下长度混合的长 prompt，DGX Spark | 每秒 0.5 个请求时 vLLM 的 P99 ITL 更低，每秒 2 个时 SGLang 更低 | 按你的速率测量 |
| 能放进池里的重复前缀 | 两者的 cache 给出的首 token 时间相差约 100 ms 以内 | 都可以 |
| DGX Spark 上的 mixture-of-experts 模型，很多用户 | 吞吐打平。从 32 个用户起，vLLM 的 P99 ITL 约为 SGLang 的两倍。 | 看重流式输出选 SGLang |

## 看每一行背后的数字 {#s-decide-between-vllm-and-sglang-see-the-numbers-behind-each-row}

**同时很多用户，L4。** 在 32 个用户时，vLLM 与 SGLang 分别给出 273.9 和 271.3 tok/s。中位首字时间分别是 1,813 和 2,871 ms，P99 ITL 分别是 619 和 102 ms。在 64 个用户时，输出相差 6%。vLLM 那次运行的中位时钟更低，1,013 对 1,215 MHz，所以我们不计这个差距。

这些运行没有重置 prefix cache。2026-10-23 我们在 900 MHz 下重置后又跑了一遍，方向不变。在 32 个用户时，vLLM 与 SGLang 的中位首字时间分别是 2.0 到 2.1 s 和 3.2 s，P99 ITL 分别是 668 到 964 ms 和 105 到 106 ms。在 16 个用户时是 522 对 82 ms。

**固定速率，L4。** 在每秒 4 个请求时，vLLM 给出 286.6 tok/s，SGLang 给出 257.5。种子范围不重叠。在每秒 8 个请求时范围重叠。每秒 16 个请求的运行低于我们的时钟下限，也就是我们接受一次运行的最低时钟，所以我们把它们排除了。

**混合长度与相同长度，两台机器。** 我们的波次负载以 16 个用户发送 64 个 prompt，用一个长度比例设定输入和输出长度的变化幅度。[实验笔记](#s-ref-lab-notes)给出了它的定义。在 L4 上长度混合时，vLLM 与 SGLang 的 P99 ITL 分别是 191 和 363 ms。长度相同时分别是 502 和 81 ms。DGX Spark 显示了同样的方向：长度混合时 188 对 198 ms，长度相同时 394 对 159 ms。

**混合专家，DGX Spark。** 在 64 个用户时，vLLM 与 SGLang 分别给出 239.3 和 245.1 tok/s，落在种子差距之内。P99 ITL 分别是 528 和 271 ms，32 个用户时是 478 对 220 ms。种子范围不重叠。从 2 个用户起，每种负载下 vLLM 的中位首字时间也都更长。

**低速率下的长 prompt，DGX Spark。** prompt 约 1,000 到 4,000 token、每秒 0.5 个请求时，vLLM 的 P99 ITL 更低，571 对 922 ms。在每秒 1 个和 2 个请求时，SGLang 更低。这次扫描中 SGLang 的池比 vLLM 的大 7%，所以读这一行时要小心。

```figure
id: fig-5-3
kind: chart
title: throughput on the L4
claim: On our L4 with Qwen3-8B, vLLM and SGLang wrote the same output within 3 percent up to 32 users.
caption: Both servers had the same KV pool. Bands span three runs. From capture/gpu/summary/l4.json.
```

```figure
id: fig-5-3b
kind: chart
title: the worst token gap on the GB10
claim: On our DGX Spark, the 99th percentile token gap of vLLM was more than twice that of SGLang at 32 users.
caption: A higher line is a choppier stream. Bands span three runs. From capture/gpu/summary/gb10.json.
```

## 做出决定 {#s-decide-between-vllm-and-sglang-decide}

先根据那些调优改变不了的因素来选：

1. **模型支持。** 检查你的模型及其量化方式能在你锁定的引擎和版本上运行。
2. **启动时间。** 在我们的 DGX Spark 上，vLLM 加载 57 GiB 的权重花了 330 秒。
3. **你的硬件。** L4 或 GB10 上的结果，不经测试不能推广到数据中心 GPU。

然后用两个引擎在你自己的流量上跑[扫描](#s-benchmark-your-server-in-15-minutes)。用同一个基准测试客户端和相同大小的池。

```takeaways
- 在固定用户数下，两个引擎在两台机器上的吞吐相差都在几个百分点以内。在超过容量的固定速率下，vLLM 在 L4 上多出 11%。
- prompt 长度混合时 vLLM 的流式输出更平稳，长度相同时 SGLang 更平稳。
- 在 DGX Spark 上运行 mixture-of-experts 模型时，SGLang 在高负载下的流式输出更平稳。
- 先根据模型支持、启动时间和硬件来选，再测量你自己的流量。
```

Sources: capture/gpu/summary/l4.json (load, rate, waves, and prefix for vllm and sglang), capture/gpu/summary/gb10.json (load, mixed, and waves for vllm and sglang), capture/gpu/out-l4/server-h2h-vllm.log, capture/gpu/out-gb10/server-load-vllm.log, capture/gpu/out-l4/load-flushed-vs-unflushed.txt.
