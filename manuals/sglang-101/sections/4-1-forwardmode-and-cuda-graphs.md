# ForwardMode 与 CUDA graphs

> 一步 decode 太小，喂不饱一块 GPU，所以 SGLang 把内核启动记成一份 CUDA graph，并在每一步回放那份记录。

你在一块 H100 上给一个用户服务小模型，看着 token 到来。GPU 很快，可剖析器却显示内核之间有空隙。Hazy Research 的现场报告 {{field Hazy Research 2025-09}} 量到，在批大小 1 的 Llama-1B 上，SGLang 和 vLLM 大约只用了 H100 内存带宽的一半。GPU 在等 CPU 告诉它下一步做什么。

读完本节后，你能点名任何一次前向的模式，并解释 CUDA graph 省了什么。你也能读出 SGLang 捕获的批大小，并把忙碌的 decode 留在 graph 里。

## 每次前向都有一个模式 {#s-forwardmode-and-cuda-graphs-every-forward-pass-has-a-mode}

**ForwardMode：** 一批上的标签，告诉模型运行器跑哪种前向。调度器设置它，模型运行器、attention 后端和 graph 运行器都读它。

| 模式 | 这一趟做什么 |
|---|---|
| `EXTEND` | Prefill。为许多新 token 写入 KV 条目。提示的一部分可能已在缓存里。 |
| `DECODE` | 每个运行中请求一个新 token。 |
| `MIXED` | 一块 prefill 与 decode token 同在一个 batch。默认关，除非传 `--enable-mixed-chunk`。 |
| `IDLE` | 无 token。没有活的数据并行注意力 rank 会跑它，好让集合调用仍然对齐。 |
| `TARGET_VERIFY` | 推测解码：目标模型给 draft token 打分。 |
| `DRAFT_EXTEND_V2` | 推测解码：draft 模型读取已接受的 token。 |
| `PREBUILT` | prefill-decode 分离里的 decode worker。KV 缓存来自另一台服务器。 |
| `SPLIT_PREFILL` | 一次只跑几层的 prefill，用于 prefill-decode 复用。 |

SGLang 把任何为每条请求写很多 KV 条目的前向叫 "extend"。这就是为什么代码里 `TARGET_VERIFY` 算作 extend。目标模型对每条请求的好几个 draft 位置跑一遍，像带树掩码的小 prefill。

## 代价：一步 decode 是一长串小启动 {#s-forwardmode-and-cuda-graphs-the-cost-one-decode-step-is-a-long-list-of-small-launches}

一个 transformer 层是一串内核：norm、QKV 投影、attention、输出投影、第二个 norm，以及 MLP。一个 28 层模型为产出一个 token 启动几百个内核。Prefill 时每个内核在几千个 token 上干活，所以启动时间相对计算时间很小。Decode 时每个内核只在每条请求的一个 token 上干活。

在批大小 1 时，GPU 常常在 Python 进程发出下一个之前就跑完一个内核。显而易见的修法是更快的启动路径，例如更少的 Python 调用。那有一点帮助，但每个内核仍需要自己的 CPU 启动，数量不变。

**CUDA graph：** 一份固定张量形状和地址的内核启动记录，GPU 可以用一次 CPU 调用回放。

```figure
id: fig-4-1
kind: comparison
title: one decode step, launched and replayed
claim: In eager mode the CPU launches each kernel of every layer, and in graph mode one replay call runs the whole recorded decode step.
caption: Read each column top to bottom. Kernel names are the ops of one Llama-style layer. The right column runs only when the batch fits a captured size. From the v0.5.22 decode CUDA graph runner.
```

这份记录有代价。每个捕获的形状都用 GPU 内存，一批必须精确匹配一个捕获的形状。SGLang 为 decode 付这个代价，并把每批垫到下一个捕获大小。

## SGLang 捕获什么，以及它何时放弃 {#s-forwardmode-and-cuda-graphs-what-sglang-captures-and-when-it-gives-up}

**Capture bucket：** SGLang 在启动时为它记录一份 decode graph 的一个批大小。没有 speculative decoding 时，v0.5.22 捕获 1、2、4、8 和 12，然后从 16 到 256 每隔八个大小。256 以上它捕获每隔十六个大小到 511，然后每隔三十二个大小直到最大。一批 13 条请求回放大小 16 的 graph，浪费三个槽。

最大桶 `max_bs` 取决于 GPU 内存和张量并行大小。你不设 `--cuda-graph-max-bs-decode` 时，启动代码选它。

| GPU 内存 | 示例 GPU | TP 低于 4 时的 decode `max_bs` | TP 为 4 或更高时 | `chunked_prefill_size` |
|---|---|---|---|---|
| 低于 20 GB | T4, RTX 4080 | 8 | 8 | 2048 |
| 20 to 35 GB | A10, RTX 4090, RTX 5090 | 48 | 160 | 4096 |
| 35 to 60 GB | A100 40 GB, L40 | 32 | 160 | 4096 |
| 60 to 90 GB | H100, A100 80 GB | 256 | 512 | 8192 |
| 90 to 160 GB | H200 | 256 | 512 | 8192 |
| 160 GB 及以上 | B200, MI300X | 512 | 512 | 16384 |

当一批 decode 大于 `max_bs` 时，graph 运行器无法回放。那一步用 eager 跑，每个内核一次启动。什么都不失败，也没有警告。那批的调度器日志行说 `cuda graph: False`，每 token 延迟上升。

```figure
id: fig-4-2
kind: decision
title: which decode batches replay a graph
claim: A decode batch replays the next captured graph when it fits under max_bs, and runs eager with one launch per kernel when it does not.
caption: Read left to right. The bucket list is the v0.5.22 default without speculative decoding on an 80 GB GPU at TP 1. A batch of 300 runs eager.
```

代码不会用同样的方式改你的 prefill 形状。自 PR #29458（2026-07-01）起，CUDA 构建对 prefill 用可打断的 graph。**Breakable graph：** 一份在每个标成 eager 跑的算子处结束一段、eager 跑那个算子、再开始下一段的捕获。一个带有 graph 装不下的算子的模型，仍为其他每个算子得到 graphs。在其他平台上 prefill graphs 是关的，我们的 Mac 捕获记下了这两点。

```listing
title: graph status in the startup log and the first batches
source: capture/out/server-default.log
lang: text
note: Two lines from the default server log. Timestamps and the end of the batch line are cut.
---
… Disable prefill CUDA graph because cuda_graph_config resolved prefill.backend='disabled' (e.g. via --cuda-graph-backend-prefill=disabled or auto-disable rules).
… Prefill batch, #new-seq: 1, #new-token: 6, #cached-token: 0, token usage: 0.00, #running-req: 0, #queue-req: 0, #pending-token: 0, cuda graph: False, …
```

每条调度器批行都以 `cuda graph:` 结尾。在 CUDA 服务器上，留意你 decode 批上的那个字段。

更老的、给 prefill graphs 用的 torch.compile 路径正在 PR #42285 到 #42287 里被删掉。说 "piecewise CUDA graphs 用 torch.compile" 的博客帖描述的是那条更老的路径。

## 现场报告里的悬崖 {#s-forwardmode-and-cuda-graphs-the-cliff-in-field-reports}

Jarvislabs 的现场报告 {{field Jarvislabs 2026-05}} 用默认 SGLang 旗标在一块 H100 上跑 Qwen2.5-7B。在并发 300 时，平均逐 token 延迟是 17.72 ms，对 vLLM 的 12.28 ms。没有并发上限时是 100.92 ms 对 28.84 ms。帖子没有记下 SGLang 版本或服务器日志。

我们的读法是一个假设，并标成假设。那块 GPU 上默认 decode `max_bs` 是 256，延迟断裂正好在它上面。维护者在更小的卡上看到了同样的形状。20 到 35 GB 档的代码注释解释了原因。旧上限让每批 32 或更多的 decode 都跑 eager，高并发下吞吐远远落后 vLLM {{code}}。PR #37898 在 2026-09-04 把那个上限从 24 抬到 48。

## 我们在 GB10 上测到的 {#s-forwardmode-and-cuda-graphs-what-we-measured-on-a-gb10}

上面的代价假设一块快 GPU 和一个小模型。我们测了不同的情形：`Qwen/Qwen3-30B-A3B-Instruct-2507`，一个混合专家模型，在一块 NVIDIA GB10 上。GB10 的 CPU 和 GPU 共用一块内存，带宽低于数据中心 GPU 的 HBM。

**我们测到** 两台服务器在从 1 到 64 的每个并发上各三个种子。默认服务器在每批 decode 上回放 decode graph，日志说 `cuda graph: True`。两个 graph 后端都设成 `disabled` 的服务器记下 `cuda graph: False`。结果几乎一样：

| 并发 | 带 graph 的中位 TPOT | 不带 graph 的中位 TPOT | 带 graph 的输出 tok/s | 不带 graph 的输出 tok/s |
|---|---|---|---|---|
| 1 | 32.52 ms | 33.09 ms | 29.14 | 28.72 |
| 8 | 102.21 ms | 104.77 ms | 74.11 | 73.46 |
| 64 | 254.06 ms | 253.77 ms | 235.38 | 235.79 |

两条线在 [图 5.1c](#fig-5-1c) 里叠在一起。graphs 仍花启动时间和内存。Decode 捕获花了 4.61 s 和 1.73 GB，prefill 捕获花了 35.06 s 和 2.14 GB。

我们对这个结果的读法：这个模型一步 decode 在批大小 1 时大约要 32 ms。graph 去掉的启动时间相对那一步很小。每一步读它的 token 选中的那些专家的权重，内存带宽定了时间。

## 我们在 L4 上测到的 {#s-forwardmode-and-cuda-graphs-what-we-measured-on-an-l4}

我们在 L4 上对稠密 `Qwen/Qwen3-8B` 的第一次扫描是错的。卡跑在 87 C，有热节流，SM 时钟是 2,040 里的 360 MHz。被节流的 GPU 每一步都慢，所以启动节省消失在噪声里。我们删掉了那些数字。每次基准都记 GPU 时钟和温度，像 [第 5.1 节](#s-sglang-benchmark-serving) 展示的那样。

然后我们在冷却的 L4 上跑了同一对。同一天那一对的每次运行都从 72 C 或以下开始。中位 SM 时钟低于 1,000 MHz 的运行最多重跑三次。第一对跑在两天，2026-10-16 和 2026-10-18。我们在 2026-10-21 又把两台服务器一前一后跑了一遍，同一份 24,094 token 的 pool。表展示同一天那一对。

```listing
title: the same batch, with and without a graph
source: capture/gpu/out-l4/server-load-graphs-on-off.log
lang: text
note: One decode line from each server of the first pair, on two days, at 33 running requests. The first replayed a graph, the second ran eager.
---
[2026-10-16 20:32:22] Decode batch, #running-req: 33, #token: 19597, token usage: 0.81, cuda graph: True, gen throughput (token/s): 319.70, #queue-req: 0
[2026-10-18 18:01:00] Decode batch, #running-req: 33, #token: 20422, token usage: 0.85, cuda graph: False, gen throughput (token/s): 350.78, #queue-req: 0
```

| 并发 | 中位 TPOT，带 graph / 不带 | 输出 tok/s，带 / 不带 | P99 ITL，带 / 不带 |
|---|---|---|---|
| 1 | 60.15 / 60.64 ms | 13.93 / 14.67 | 104 / 104 ms |
| 8 | 66.01 / 66.60 ms | 112.60 / 111.67 | 70 / 68 ms |
| 16 | 70.08 / 70.59 ms | 201.21 / 200.16 | 80 / 73 ms |
| 32 | 95.65 / 94.12 ms | 270.61 / 270.81 | 103 / 87 ms |
| 64，见下方说明 | 103.39 / 103.12 ms | 264.10 / 265.30 | 109 / 90 ms |

L4 服务器只捕获最多 48 条正在跑请求的 decode graphs。在 64 用户时，大于 48 的批在两台服务器上都跑 eager，所以最后一行不量 graphs。

**我们测到** 在 L4 上也是小差别。到 16 用户，graphs 从 60 到 70 ms 的一步里省了 0.5 到 0.7 ms，大约 1%。从 2 用户起吞吐在 1.2% 以内，1 用户时差 5%。

在 16 和 32 用户时，没有 graphs 的服务器有更低的 P99 ITL，没有种子重叠。是 73 对 80 ms，以及 87 对 103 ms。两台服务器在那些批大小上都回放了 graphs。我们还没有这个差距的机制，所以报告它，不解释它。

GB10 在同一天没有这种差距。有 graphs 和没有 graphs 的 P99 ITL 在每个并发下都在 7% 以内，中位 TPOT 在 2% 以内。

我们的读法：一个 8B 模型在批大小 1 时一步大约从内存读 16 GB 权重。graph 去掉的启动时间相对那次读取很小。

[Inside an LLM Serving GPU](https://aiengineeringfromscratch.com/inside-an-llm-serving-gpu?graphs=off&users=1) 机器展示 L4 上一步 decode 作为一次权重读取和它之后的活。这个链接打开没有 graphs、一个用户的运行。启动命令为每个内核穿过 PCIe，在我们的第一对里那一步涨了 0.47 ms 到 60.63 ms。

## 我们的立场 {#s-forwardmode-and-cuda-graphs-our-position}

保持 CUDA graphs 开着，并按你的流量给它们定大小。默认 `max_bs` 适合中等并发。如果你的基准或生产峰值跑的请求比那多，在量之前把 `--cuda-graph-max-bs-decode` 和 `--max-running-requests` 设到你的目标。SemiAnalysis InferenceX 配方 {{field InferenceX 2026-05}} 从它们测试的并发推出这两个值。

不要指望 graphs 在每台机器上都把慢 decode 变快。在 GB10 上，混合专家模型一步 decode 要几十毫秒，graphs 把它改了 3% 或更少。在 L4 上，稠密 8B 模型大约省 1%。最差的 token 差距在 16 和 32 用户时没有它们更短。在怪启动路径之前，有 graphs 和没有 graphs 都量中位和尾部。

不要为修内存而关掉 graphs。如果捕获内存不足，降低 `--cuda-graph-max-bs-decode` 或 `--mem-fraction-static`。没有 decode graphs 的服务器为每个用户的每个 token 付启动时间。

两个旗标名在 v0.5.22 变了，旧配方会在它们上面坏掉。`--disable-cuda-graph` 仍可用，帮助文本标它为已弃用。

```listing
title: the deprecated graph flag in sglang serve --help
source: capture/out/serve-help.txt
lang: text
note: Two lines from the deprecated flags at the end of the help text.
---
  --disable-cuda-graph  Deprecated. Use --cuda-graph-
                        backend-{decode,prefill}=disabled instead.
```
 旗标 `--cuda-graph-max-bs` 不再存在。我们把它传给 v0.5.22 参数解析器，它以 `ambiguous option: --cuda-graph-max-bs could match --cuda-graph-max-bs-decode, --cuda-graph-max-bs-prefill` 退出。

## 事故 {#s-forwardmode-and-cuda-graphs-incidents}

**带数据并行 attention 时捕获内存不足。** Issue #23769（2026-04-26）：DeepSeek-V4-Pro-FP8 在两台各八块 H200 的节点上在 graph 捕获期间退出。有数据并行 attention 时，graph 批大小按 rank 计，所以捕获的 graphs 比流量需要的更大。修法是更小的 graph 批大小或更低的 `--mem-fraction-static`。

**重命名的字段打断了 Python API。** Issue #36478（2026-08-26）：`sgl.Engine(..., disable_piecewise_cuda_graph=True)` 抛出 `TypeError`，而命令行旗标仍可用。PR #23906 把该字段折进按阶段的 graph 配置，只保留命令行别名。修法是 `cuda_graph_backend_prefill="disabled"`。

**一块新 GPU 需要 eager 模式。** joshua8.ai 的现场报告 {{field joshua8 2026-01}} 在一块 RTX PRO 6000 Blackwell（SM120）上跑 SGLang。它需要 `--disable-cuda-graph` 才能跑起来。在新架构上，在对比引擎之前先检查捕获能工作。

```takeaways
- 对你在乎的每批 decode，读调度器日志字段 cuda graph。
- 在基准之前，把 --cuda-graph-max-bs-decode 和 --max-running-requests 设到你的峰值并发。
- 用更小的 graph 批大小修捕获内存，并保持 graphs 开着。
- 在调它们之前，在你的 GPU 和模型上有 graphs 和没有 graphs 都量 decode。
- 用 v0.5.22 的按阶段旗标替换旧配方里的 --cuda-graph-max-bs 和 --disable-cuda-graph。
```

Sources: capture/out/server-default.log, capture/out/serve-help.txt, capture/gpu/out-gb10/server-default.log, capture/gpu/out-gb10/server-no-cuda-graph.log, capture/gpu/summary/gb10.json, capture/gpu/incidents/l4-thermal-throttle.txt, capture/gpu/out-l4/server-load-graphs-on-off.log, capture/gpu/summary/l4.json (load.default, load.no-cuda-graph, load.graphs-on-b, load.graphs-off-b), python/sglang/srt/model_executor/forward_batch_info.py (ForwardMode), model_executor/model_runner.py (_forward_raw), model_executor/cuda_graph_config.py (default_prefill_backend), model_executor/runner/decode_cuda_graph_runner.py (can_run_graph), arg_groups/memory_hook.py (_handle_gpu_memory_settings), arg_groups/cuda_graph_hook.py (generate_decode_cuda_graph_batch_sizes), and server_args.py (deprecated flags) at v0.5.22; the argument parser of the installed v0.5.22 package; PRs #23906, #29458, #37898, #42285; issues #23769 and #36478; field reports by Hazy Research (2025-09-28), Jarvislabs (2026-05-18), joshua8.ai (2026-01-10), and SemiAnalysis InferenceX (2026-05-26), capture/gpu/out-l4/graphs-sameday-starts.log, capture/gpu/out-gb10/cuda-graph-max-bs-ambiguous.txt
