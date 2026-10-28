# 读别人的 SGLang 基准

> 一份已发布的 SGLang 结果取决于其版本、工作负载、内存预算、graph 上限与内核，所以你先读那五项，再读那个数字。

网上重复最多的 SGLang 数字是「比 vLLM 快 29%」：每秒 16,215 个 token，对上 12,553。它来自分析公司 AIMultiple 的一次离线测试，更新于 2026-01-25 {{field AIMultiple 2026-01}}。那一页把 SGLang 列成 "v0.2.3"，旁边是 vLLM 0.11.0，大约差了两年的发布。至少五篇后来的帖子重复了这一对，有些挂着别的公司的名字。没有一篇重新跑过测试。

读完本节后，你能把一份已发布的 SGLang 基准拆成它的五个输入。你能决定它是否适用于你，并点名背后的机制。你也能说出独立测试在哪里达成一致，那份名单比标题暗示的更短。

## 每一个结果背后的五个输入 {#s-reading-other-peoples-benchmarks-the-five-inputs-behind-every-result}

一个基准结果是五个输入的函数。已发布报告之间的多数分歧，都能追溯到其中一项。

1. **工作负载形状。** 输入长度、输出长度、并发，以及提示里重复的那一份。只有前缀重复时 radix 缓存才有帮助。长输入压 prefill。高并发压调度器与 KV 池。
2. **内存预算。** 你不设时，SGLang 从 GPU 计算 `--mem-fraction-static`。vLLM 用 `--gpu-memory-utilization 0.9`。只设其中一个的测试，比较的是两个不同的 KV 池。
3. **CUDA graph 上限。** Decode 步只在达到某个 batch 大小上限之前重放已捕获的 CUDA graph。超过它，decode 就 eager 跑，一次启动一个内核。[第 4.1 节](#s-forwardmode-and-cuda-graphs) 解释了机制。
4. **内核路径。** 注意力后端、MoE 内核与量化格式。下面几份报告是由某个 GPU 上存在或不存在的内核决定的。
5. **版本与日期。** 一位分析师在同一块 AMD GPU 上测同一模型，先是每块 GPU 每秒 20.4 个 token，26 天后再是 2,256。

**代码**在启动时从 GPU 内存设定第三个输入。拿一块 80 GB 的 H100、张量并行大小低于 4。默认 decode graph 上限是 256，分块 prefill 大小是 8,192。在 32 GB 卡上上限是 48，于 2026-09-04 从 24 抬高。那次改动上的代码注释说，旧上限让高并发下的吞吐远远落在 vLLM 后面 {{code}}。

## 在信任一个数字之前的六个问题 {#s-reading-other-peoples-benchmarks-six-questions-before-you-trust-a-number}

```figure
id: fig-5-3
kind: decision
title: six questions to ask a published SGLang benchmark
claim: A result that fails the version or workload question tells you nothing about your server, however large its number is.
caption: Read top to bottom. Each question either passes to the next or ends in what the result can still tell you, in rose. From the field reports cited in this section.
```

1. **SGLang 版本写明了吗？** 没有的话，结果描述的是未知构建。
2. **工作负载匹配你的吗？** 独特提示对带长共享系统提示的聊天服务器什么也说不了。
3. **各引擎的内存预算匹配了吗？**
4. **并发越过了 decode graph 上限吗？** 如果是，测试测的是 eager decode。
5. **标志映射正确吗？** 同一个想法在每个引擎里有不同的标志名。
6. **谁为测试买单？** GPU 云、硬件厂商、竞争对手，或 SGLang 团队，各自有理由喜欢某一个答案。

## 独立测试在哪里达成一致 {#s-reading-other-peoples-benchmarks-where-independent-tests-agree}

这些报告来自 SGLang 团队之外的人。每一行点名解释它的、前面章节里的机制。

| Finding | Field reports | Mechanism |
|---|---|---|
| 独特提示的稠密模型：平局 | Spheron，SGLang 0.5.9，Llama 3.3 70B FP8 在一块 H100 上：50 个用户时 1,920 对上 1,850 tok/s。Modal：8 块 H100 上两者都大约每秒 17 次查询。Varad More：A10G 上 7B 到 9B 模型相差在 3% 以内 | 两个引擎现在用同一类内核族、分页 KV 与连续批处理 |
| 重复前缀：SGLang 赢，幅度小于坊间说法 | Steve Rawlinson，SGLang 0.5.6 在 2 块 H100 上：一个用户时第一个 token 583 ms 对上 2,141 ms。RunPod：已缓存的 7k 上下文上每个流 35.0 对上 32.8 tok/s。Varad More：SGLang 在 16 个模型里的 10 个上领先 20 到 40 ms | radix 缓存，见[第 3.3 节](#s-radixcache) |
| 长提示：第一个 token 更慢，之后的 token 更快 | Jarvislabs，一块 H100 上 16k token 提示、60 个用户：第一个 token 10,802 ms 对上 1,874 ms，每个 token 时间 63 到 81 ms 对上 97 到 120 ms | 8,192 token 的分块 prefill 拆开长提示并保护在跑的 decode |
| 默认下的极高负载：decode 延迟崩塌 | Jarvislabs，没有并发上限：平均 ITL 100.92 ms 对上 28.84 ms | 很可能 decode 越过了 256 的 graph 上限。这是我们的假设，不是他们的 |
| 许多 GPU 上的 DeepSeek 级 MoE：SGLang 是参考 | SemiAnalysis InferenceMAX 选 SGLang 作为 DeepSeek R1 的默认引擎。Crusoe 经审计的 MLPerf v6.1 结果在 512 块 MI355X 上用了 SGLang 0.5.15.post1 | 注意力数据并行与专家并行，见[第 6.2 节](#s-moe-serving-deepep-and-eplb) |
| 推测解码：帮大 GPU，伤小 GPU | InferenceX，B200 上 GLM-5 配 MTP、4 个用户：每个 token 时间从 18.43 ms 降到 9.92 ms。Varad More 在 A10G 上：慢 7% 到 28% | draft 代价对上接受率，见[第 4.4 节](#s-speculative-decoding) |

链接：[Spheron](https://www.spheron.network/blog/vllm-vs-tensorrt-llm-vs-sglang-benchmarks/) {{field Spheron 2026}}、[Modal](https://modal.com/llm-almanac/summary) {{field Modal 2025-06}}、[Varad More](https://github.com/varad-more/inference-engine-benchmark-system) {{field Varad-More 2026-04}}、[Steve Rawlinson](https://rawlinson.ca/articles/vllm-vs-sglang-performance-benchmark-h100) {{field Rawlinson 2025-12}}、[RunPod](https://runpod.ghost.io/when-to-choose-sglang-over-vllm-multi-turn-conversations-and-kv-cache-reuse/) {{field RunPod 2025-06}}、[Jarvislabs](https://jarvislabs.ai/blog/vllm-sglang-trtllm-comparison) {{field Jarvislabs 2026-05}}、[SemiAnalysis](https://newsletter.semianalysis.com/p/inferencemax-open-source-inference) {{field SemiAnalysis 2025-10}}、[Crusoe](https://www.crusoe.ai/resources/blog/serving-5-75-million-tokens-per-second-crusoes-mlperf-inference-v6-1-results-on-amd-mi355x) {{field Crusoe 2026-09}}，以及 [InferenceX](https://inferencex.semianalysis.com/blog/mi355x-glm5-fp8-sglang-40-cheaper-than-b200) {{field InferenceX 2026-05}}。

把保留意见与数字一起读。Rawlinson 把 SGLang 内存留在默认、vLLM 留在 0.9，所以两个 KV 池不同。Jarvislabs 没有记下任何一个引擎版本。Spheron、RunPod、Modal 与 Jarvislabs 卖 GPU 时间，那是跑测试的理由，不是偏爱某一个引擎的理由。Crusoe 的结果是这里唯一通过外部审计的。它的 p99 每个 token 时间是 79.98 ms，对上限 80。

```figure
id: fig-5-3b
kind: structure
title: six findings and the mechanism behind each
claim: Every independent result in this section traces to one mechanism you can test on your own server.
caption: Read each row left to right, from the workload to the reported result to the SGLang mechanism. Olive is the client side, violet the kernels, green the cache. From the field reports cited in this section.
```

## 在新硬件上很脆弱 {#s-reading-other-peoples-benchmarks-fragile-on-new-hardware}

同样的报告还展示多一个模式。据 [joshua8.ai](https://joshua8.ai/llm-inference-benchmark/) {{field joshua8 2026-01}}，一块 Blackwell 工作站卡只在带 `--disable-cuda-graph` 时跑起了 SGLang。一个混杂集群在较旧的卡加入时崩溃，因为 FP4 路径要求 compute capability 10.0。[Pivot News](https://pivotnews.ai/build/benchmarking-vllm-vs-sglang-vs-llama-cpp-on-a-mixed-blackwel) 总结了那篇社区帖 {{field Pivot-News 2026-05}}。快速路径是按 GPU 代写的，其他 GPU 的路径更少。在新硬件上，预期第一次 SGLang 发布会慢或坏，并每周重新测。

## 我们自己的机器展示了什么 {#s-reading-other-peoples-benchmarks-what-our-own-machines-showed}

现场报告告诉你该测哪种机制。我们在带 GB10 的 DGX Spark 上，以及一台带两块 24 GB L4 的机器上测了它们。下面每一行链到带有 listing、种子与图表的那一节。

| Where | What we ran | Result | Mechanism |
|---|---|---|---|
| L4 | 4,096 token 的共享提示，缓存开与关 | 中位 TTFT 479 ms 对上 14,706 ms，吞吐 4.3 倍，关缓存那次跑在 930 MHz、低于我们的时钟下限，[第 3.3 节](#s-radixcache) | radix 缓存 |
| L4 | FP8 权重与 KV 对上 BF16，64 个用户 | 736 对上 251 tok/s，池是 142,369 个 token 对上 24,094，[第 4.3 节](#s-quantization) | 每 GB 更多 KV |
| GB10 | Qwen3-30B-A3B 上的 EAGLE-3 | 每个 token 时间短 1.56 到 1.89 倍，在 16 到 64 个用户时最大，[第 4.4 节](#s-speculative-decoding) | MoE verify 复用它读过的专家权重 |
| L4 | 稠密 Qwen3-8B 上的 EAGLE-3 | 一个用户时吞吐 2.37 倍，默认跑时钟低 19%，32 个用户时是 1.00，[第 4.4 节](#s-speculative-decoding) | draft 占了池的 59% |
| L4 一对 | `--dp-size 2` 带一块共享卡 | 64 个用户时 42 对上 251 tok/s，那一对在 675 MHz、低于我们的时钟下限，[第 6.1 节](#s-tp-size-dp-size-and-attn-dp-size) | round robin 喂给了只有八分之一池的那份副本 |
| L4 | SGLang 0.5.22 对上 vLLM 0.31.0，同样的池，64 个用户 | 257 对上 241 tok/s，P99 ITL 114 对上 1,363 ms，中位 TTFT 18,356 对上 10,953 ms，[下文](#s-reading-other-peoples-benchmarks) | 满池时两种不同的接纳选择 |
| L4 | 同一对在 4,096 token 的共享提示上 | 88.4 对上 86.8 tok/s，中位 TTFT 474 对上 375 ms，[下文](#s-reading-other-peoples-benchmarks) | 两个前缀缓存都命中 |
| L4 | 同一对在每秒 4 个请求、泊松到达时 | 257.5 对上 286.6 tok/s，P99 TPOT 127 对上 187 ms，[下文](#s-reading-other-peoples-benchmarks) | 固定速率下同样的接纳选择 |
| L4 | 同一对在 16 个用户、混合提示长度时 | 159.6 对上 169.6 tok/s，P99 ITL 363 对上 191 ms，[下文](#s-reading-other-peoples-benchmarks) | 每个引擎如何把 prefill 混进流 |
| L4 一对 | `--tp-size 2` 带一块共享卡 | 启动时拒绝，[第 6.1 节](#s-tp-size-dp-size-and-attn-dp-size) | 内存均衡检查 |
| L4 一对 | 经 TCP 拆开的 prefill 与 decode | 第三分钟之后每一个请求都带着 HTTP 200 空着回来，[第 6.3 节](#s-prefill-decode-disaggregation) | 传输会话失败且没有恢复 |

多数行遵循一个模式。当一种机制去掉重复工作时，它在任一引擎里都以大倍数取胜。例子是共享提示的 prefill，以及每个已缓存 token 的字节。当一项功能花掉 batch 需要的内存，或部署的两部分大小不等时，它就输。运行时的损失里没有一个打印出仪表盘会显示的错误。其中两个在基准摘要里看起来像成功。

## 同一块 L4 上 SGLang 对上 vLLM {#s-reading-other-peoples-benchmarks-sglang-against-vllm-on-the-same-l4}

上面每一份现场报告都比较别人配置的两个引擎。我们在一块 L4 上用 `Qwen/Qwen3-8B` 与[第 5.1 节](#s-sglang-benchmark-serving) 的闭环 sweep 跑了自己的一对。我们做了三个选择，好让只有引擎不同。

- **同样的 KV 池。** vLLM 服务器得到 `--num-gpu-blocks-override 1506`，也就是 1,506 个各 16 token 的块。SGLang 在同一块卡上为自己定出 24,094 个 token。
- **同样的卡状态。** 两个引擎在一块 GPU 上的同一次会话里跑，每一次跑都从 72 C 或以下开始。中位 SM 时钟低于 1,000 MHz 的跑被搁置并重做，最多三次。
- **没有意外的不利条件。** vLLM 服务器得到 `--max-model-len 8192`，每一条请求都装得下，以及 `VLLM_USE_FLASHINFER_SAMPLER=0`，因为它的 FlashInfer 采样器在我们的安装里没有编译。基准是贪心的，所以采样器不改输出。

```listing
title: two pools of the same size
source: capture/gpu/out-l4/server-h2h-sglang.log
lang: text
note: The SGLang pool at startup, and one decode line at a cap of 64.
---
[2026-10-17 18:27:40] KV Cache is allocated. dtype: torch.bfloat16, #tokens: 24094, K size: 1.65 GB, V size: 1.65 GB
[2026-10-17 20:12:04] Decode batch, #running-req: 37, #token: 22162, token usage: 0.92, cuda graph: True, gen throughput (token/s): 432.55, #queue-req: 27
```

```listing
title: the vLLM pool, and vLLM at a cap of 64
source: capture/gpu/out-l4/server-h2h-vllm.log
lang: text
note: The vLLM pool at startup, and one stats line at a cap of 64.
---
INFO 10-17 20:13:17 [kv_cache_utils.py:2464] GPU KV cache size: 24,096 tokens, Maximum concurrency for 8,192 tokens per request: 2.94x
INFO 10-17 22:35:43 [loggers.py:320] Engine 000: Avg prompt throughput: 460.3 tokens/s, Avg generation throughput: 323.6 tokens/s, Running: 40 reqs, Waiting: 11 reqs, GPU KV cache usage: 99.5%, Prefix cache hit rate: 8.7%
```

| Concurrency | Output tok/s, SGLang / vLLM | Median TTFT, SGLang / vLLM | P99 ITL, SGLang / vLLM | Median SM clock, SGLang / vLLM |
|---|---|---|---|---|
| 1 | 13.84 / 13.51 | 185 / 192 ms | 104 / 105 ms | 1,290 / 1,290 MHz |
| 8 | 112.46 / 112.79 | 170 / 253 ms | 71 / 68 ms | 1,485 / 1,470 MHz |
| 16 | 201.13 / 200.90 | 212 / 289 ms | 81 / 80 ms | 1,470 / 1,425 MHz |
| 32 | 271.28 / 273.93 | 2,871 / 1,813 ms | 102 / 619 ms | 1,320 / 1,275 MHz |
| 64 | 256.62 / 241.39 | 18,356 / 10,953 ms | 114 / 1,363 ms | 1,215 / 1,013 MHz |

```figure
id: fig-5-3c
kind: chart
title: Same throughput, two different choices at a full pool
claim: At 64 users on the L4, vLLM gave the first token 1.7 times sooner and SGLang kept the P99 inter-token latency 12 times lower.
caption: Solid lines are median TTFT and dashed lines are P99 inter-token latency, three seeds per point, on a log scale. Blue is SGLang and amber is vLLM. From capture/gpu/summary/l4.json.
```

**我们测到**吞吐上是平局。到 32 个用户，两个引擎彼此相差在 3% 以内，每个 token 时间相差在 6% 以内。在 64 个用户时中位每个 token 时间在 SGLang 上是 106 ms，在 vLLM 上是 129 ms。在池填满那一点之下，SGLang 更早给出第一个 token，8 个用户时是 170 对上 253 ms。

过了那一点，引擎做了不同选择，统计行两边都显示。SGLang 跑 37 条请求并让 27 条等待，池 92% 满。vLLM 服务器跑 40 条请求并让 11 条等待。它一边以每秒 460 个 token 做新提示的 prefill，一边填满了池的 99.5%。

vLLM 服务器启动了更多请求，所以它们的第一个 token 更早到来。每一个新的 prefill 随后与在跑的 decode 共享那一步，所以流卡住了。在 64 个用户时，P99 token 间间隙在 vLLM 上是 1,363 ms，在 SGLang 上是 114 ms。

时钟保留意见属于最后一行。即便试了三次，64 个用户时 vLLM 跑的中位时钟仍是 1,013 MHz，对上 SGLang 的 1,215 MHz。所以 64 时吞吐差距的一部分可能是卡。Token 间延迟 12 倍的差距，对 17% 的时钟差来说太大了。

### 同一对在共享提示上 {#s-reading-other-peoples-benchmarks-the-same-pair-on-shared-prompts}

然后我们在同一对上跑了[第 3.3 节](#s-radixcache) 的前缀 sweep，用同样的池与同样的冷却规则。每一次跑在 8 个用户时送出 4 组各 16 条、共 64 条提示。一组里的提示共享 0 到 4,096 个 token 的系统提示，然后有 128 token 的问题与 64 个输出 token。SGLang 用它的 radix 缓存。vLLM 服务器用它的前缀缓存，在 0.31.0 默认是开的。

```listing
title: both caches hit
source: capture/gpu/out-l4/server-h2h-prefix-vllm.log
lang: text
note: The vLLM pool at startup, and one stats line at 4,096 shared tokens.
---
INFO 10-17 23:37:11 [kv_cache_utils.py:2464] GPU KV cache size: 24,096 tokens, Maximum concurrency for 8,192 tokens per request: 2.94x
INFO 10-18 00:43:16 [loggers.py:320] Engine 000: Avg prompt throughput: 231.0 tokens/s, Avg generation throughput: 93.6 tokens/s, Running: 8 reqs, Waiting: 0 reqs, GPU KV cache usage: 77.2%, Prefix cache hit rate: 87.2%
```

SGLang 日志用它自己的话展示同样的事。在一次 4,096 个共享 token 的 prefill batch 里，12,952 个 token 来自缓存，406 个是新的。

| Shared prompt tokens | Output tok/s, SGLang / vLLM | Median TTFT, SGLang / vLLM | P99 TTFT, SGLang / vLLM |
|---|---|---|---|
| 0 | 113.5 / 113.8 | 354 / 408 ms | 483 / 485 ms |
| 256 | 110.9 / 111.5 | 470 / 488 ms | 856 / 616 ms |
| 1,024 | 105.7 / 106.0 | 466 / 396 ms | 1,887 / 1,303 ms |
| 2,048 | 100.4 / 100.2 | 441 / 410 ms | 2,317 / 1,767 ms |
| 4,096 | 88.4 / 86.8 | 474 / 375 ms | 4,275 / 4,019 ms |

```figure
id: fig-5-3d
kind: chart
title: Two prefix caches, one result
claim: On the L4, both prefix caches kept the median TTFT under 500 ms at every shared length, and the cache-off run reached 14,706 ms.
caption: Median TTFT against shared prompt length at 8 users, three seeds per point, on a log scale. Blue is SGLang with the radix cache, and amber is vLLM with prefix caching. Dashed rose is SGLang with the cache off, from the earlier run in section 3.3. From capture/gpu/summary/l4.json.
```

**我们测到**吞吐上是平局，每一个共享长度相差在 2% 以内。两个引擎的中位 TTFT 都停在 354 与 488 ms 之间。在 0 与 256 个共享 token 时，SGLang 更早给出第一个 token，超出种子散布：354 对上 408 ms，以及 470 对上 488 ms。从 1,024 个 token 起，种子范围重叠。

vLLM 在尾部略领先。从 256 个共享 token 起它的 P99 TTFT 更低，1,024 时是 1,303 对上 1,887 ms。SGLang 在 4,096 时有更短的每个 token 时间，75.6 对上 80.8 ms。每一次跑的中位 SM 时钟都是 1,395 MHz 或更高。

结果的大小在第三行。关着缓存时，一次单独的 SGLang 跑在 4,096 个共享 token 时中位第一个 token 需要 14,706 ms。那块卡跑在我们的时钟下限之下。两次带缓存的跑都停在 500 ms 以下。两个缓存之间的差大约是 100 ms。

然后我们用 `--no-enable-prefix-caching` 跑了 vLLM 服务器，用同样的池与同样的 sweep。它的日志显示缓存关着，每一个提示 token 都重新做了 prefill。

```listing
title: vLLM with prefix caching off
source: capture/gpu/out-l4/server-h2h-prefix-vllm-no-cache.log
lang: text
note: The pool at startup, and one stats line at 4,096 shared tokens. The prompt throughput is high because nothing is reused.
---
INFO 10-21 06:20:24 [kv_cache_utils.py:2464] GPU KV cache size: 24,096 tokens, Maximum concurrency for 8,192 tokens per request: 2.94x
INFO 10-21 08:07:49 [loggers.py:320] Engine 000: Avg prompt throughput: 1607.0 tokens/s, Avg generation throughput: 6.4 tokens/s, Running: 8 reqs, Waiting: 0 reqs, GPU KV cache usage: 76.7%
```

| Shared prompt tokens | Median TTFT, cache on / off, SGLang | Median TTFT, cache on / off, vLLM | Output tok/s, cache off, SGLang / vLLM |
|---|---|---|---|
| 256 | 470 / 985 ms | 488 / 753 ms | 99.4 / 99.1 |
| 1,024 | 466 / 2,202 ms | 396 / 1,213 ms | 70.2 / 70.9 |
| 4,096 | 474 / 14,706 ms | 375 / 13,353 ms | 20.8 / 19.6 |

**我们测到**两个引擎里增益的大小一样。在 4,096 个共享 token 时，缓存把中位第一个 token 在 SGLang 上大约砍到 1/31，在 vLLM 上大约砍到 1/36。它在 SGLang 上给出 4.2 倍输出，在 vLLM 上给出 4.4 倍。没有缓存时，两个引擎在吞吐上相差在 7% 以内打平。

没有缓存时，vLLM 服务器在 256 到 2,048 个共享 token 时更早给出第一个 token。它的 SGLang 对应跑在另一天。关缓存的 vLLM 跑在 2026-10-21，比开缓存的 vLLM 跑晚四天。4,096 个共享 token 的跑在试了三次之后仍低于我们的时钟下限，在 930 与 675 MHz。为那一行的大小读它，不要为精确值读它。

### 同一对在固定到达速率下 {#s-reading-other-peoples-benchmarks-the-same-pair-at-a-fixed-arrival-rate}

闭环只有在一条回来时才发新请求，所以引擎设定节奏。生产流量不等引擎。我们在同一对上跑了[第 5.1 节](#s-sglang-benchmark-serving) 的速率 sweep，用同样的池与同样的热量与时钟规则。请求以每秒 0.5 到 16 的泊松速率到达，带 512 个输入与 128 个输出 token。每一次跑至少送出 32 条提示，或 30 秒的到达。

```listing
title: the same admission choice under a fixed rate
source: capture/gpu/out-l4/server-h2h-rate-sglang.log
lang: text
note: The SGLang pool at startup, and one decode line with requests waiting.
---
[2026-10-18 00:43:57] KV Cache is allocated. dtype: torch.bfloat16, #tokens: 24094, K size: 1.65 GB, V size: 1.65 GB
[2026-10-18 03:13:55] Decode batch, #running-req: 37, #token: 22424, token usage: 0.93, cuda graph: True, gen throughput (token/s): 370.33, #queue-req: 71
```

```listing
title: vLLM admits more at the same rate
source: capture/gpu/out-l4/server-h2h-rate-vllm.log
lang: text
note: The vLLM pool at startup, and one stats line with requests waiting.
---
INFO 10-18 03:15:35 [kv_cache_utils.py:2464] GPU KV cache size: 24,096 tokens, Maximum concurrency for 8,192 tokens per request: 2.94x
INFO 10-18 06:10:22 [loggers.py:320] Engine 000: Avg prompt throughput: 1326.7 tokens/s, Avg generation throughput: 158.4 tokens/s, Running: 43 reqs, Waiting: 30 reqs, GPU KV cache usage: 99.7%, Prefix cache hit rate: 0.6%
```

| Requests per second | Output tok/s, SGLang / vLLM | Median TTFT, SGLang / vLLM | Median TPOT, SGLang / vLLM | P99 TPOT, SGLang / vLLM | Median SM clock, SGLang / vLLM |
|---|---|---|---|---|---|
| 0.5 | 70.6 / 70.6 | 284 / 317 ms | 74.7 / 72.7 ms | 81 / 78 ms | 1,485 / 1,485 MHz |
| 1 | 123.3 / 123.6 | 166 / 180 ms | 74.0 / 68.2 ms | 76 / 69 ms | 1,500 / 1,485 MHz |
| 2 | 226.3 / 227.8 | 221 / 233 ms | 99.9 / 88.7 ms | 120 / 109 ms | 1,433 / 1,418 MHz |
| 4 | 257.5 / 286.6 | 9,575 / 8,304 ms | 115.1 / 126.9 ms | 127 / 187 ms | 1,350 / 1,245 MHz |
| 8 | 253.9 / 261.8 | 37,211 / 27,510 ms | 105.2 / 126.0 ms | 151 / 248 ms | 1,215 / 1,035 MHz |
| 16 | 218.2 / 205.8 | 97,542 / 94,322 ms | 115.2 / 185.2 ms | 189 / 322 ms | 600 / 450 MHz |

```figure
id: fig-5-3e
kind: chart
title: The same choice at a fixed arrival rate
claim: At 4 requests per second on the L4, vLLM gave 11 percent more output and SGLang kept the P99 time per token 32 percent lower.
caption: Solid lines are median TTFT and dashed lines are P99 time per output token, three seeds per point, on a log scale. Blue is SGLang and amber is vLLM. From capture/gpu/summary/l4.json.
```

**我们测到**到每秒 2 个请求是平局。两个引擎都跟上到达，所以吞吐相差在 1% 以内。SGLang 在每秒 0.5 与 1 时更早给出第一个 token，超出种子散布。中位是 284 对上 317 ms，以及 166 对上 180 ms。vLLM 有更短的每个 token 时间。每秒 1 时是 68 对上 74 ms，超出散布，每秒 2 时是 89 对上 100 ms。

Goodput 展示那对目标意味着什么。我们把目标设成到第一个 token 1 秒、每个 token 100 ms。在每秒 2 个请求时，vLLM 在目标内中位服务每秒 1.36 个请求，SGLang 是 0.88。种子范围重叠，1.09 到 1.44 对上 0.54 到 1.18。SGLang 的中位每个 token 时间是 99.9 ms，压在目标线上。

从每秒 4 个请求起，两个引擎都落后于到达，没有一条请求达到目标。统计行展示与闭环同样的接纳选择。SGLang 跑 37 条请求，池 93% 满。vLLM 服务器跑 43 条请求并填满了池的 99.7%。

在每秒 4 时，vLLM 给出 286.6 对上 257.5 tok/s，多 11% 且超出种子散布。它的中位第一个 token 在 8.3 对上 9.6 秒到来，但那些种子范围重叠。代价是流：它的 P99 每个 token 时间是 187 对上 127 ms，超出散布。

时钟解释不了每秒 4 时的差距。vLLM 跑有更低的中位时钟，1,245 对上 1,350 MHz。在每秒 8 时吞吐范围重叠。在每秒 16 时，两个引擎的每一次跑在试了三次之后都停在 1,000 MHz 以下，所以我们不比较那一行。

### 同一对在波浪上 {#s-reading-other-peoples-benchmarks-the-same-pair-on-waves}

最后一个工作负载是[第 5.1 节](#s-sglang-benchmark-serving) 里让请求成波浪到达的那个。每一次跑在上限 16 个用户时送出 64 条各 512 token 的提示、128 个输出 token。只有 `--random-range-ratio` 变了。在 1.0 时每一条提示长度相同，所以请求一起结束、它们的替换一起到达。在 0.5 与 0.0 时长度是混合的，所以请求一个接一个到达。

```listing
title: vLLM in the middle of a wave
source: capture/gpu/out-l4/server-h2h-waves-vllm.log
lang: text
note: The vLLM pool at startup, and one stats line with 16 requests running.
---
INFO 10-18 18:38:07 [kv_cache_utils.py:2464] GPU KV cache size: 24,096 tokens, Maximum concurrency for 8,192 tokens per request: 2.94x
INFO 10-18 19:14:22 [loggers.py:320] Engine 000: Avg prompt throughput: 960.0 tokens/s, Avg generation throughput: 187.3 tokens/s, Running: 16 reqs, Waiting: 0 reqs, GPU KV cache usage: 22.6%, Prefix cache hit rate: 8.5%
```

| Length ratio | Output tok/s, SGLang / vLLM | Median TTFT, SGLang / vLLM | Median TPOT, SGLang / vLLM | P99 ITL, SGLang / vLLM |
|---|---|---|---|---|
| 1.0, fixed lengths | 182.3 / 181.7 | 1,775 / 1,499 ms | 74.7 / 76.8 ms | 81 / 502 ms |
| 0.5, mixed | 159.6 / 169.6 | 325 / 353 ms | 87.8 / 81.4 ms | 363 / 191 ms |
| 0.0, mixed | 158.2 / 174.4 | 283 / 284 ms | 86.7 / 75.0 ms | 302 / 202 ms |

**我们测到**每一种流量形状有不同的赢家。固定长度时，两个引擎在吞吐上打平。它们做了与满池时同样的权衡。vLLM 服务器更早给出第一个 token，1,499 对上 1,775 ms，超出种子散布。SGLang 让流保持平滑，P99 ITL 是 81 对上 502 ms。

混合长度时，vLLM 领先。在比率 0.5 时它给出 169.6 对上 159.6 tok/s，多 6% 且超出种子散布。它的中位每个 token 时间是 81.4 对上 87.8 ms，P99 ITL 是 191 对上 363 ms。在 0.0 时吞吐范围重叠，vLLM 仍有更低的每个 token 时间与更低的 P99 ITL。每一个中位时钟都是 1,410 MHz 或更高。

我们的解读：当新提示一个接一个到达时，每一次 prefill 都与在跑的 decode 共享一步。vLLM 服务器把那份工作拆开，好让流卡住得更少。

为了测那种解读，我们在 2026-10-21 用 `--enable-mixed-chunk` 又跑了 SGLang，用同样的 sweep 与同样的池。这个标志把在跑的 decode 放进 prefill batch，所以一条新提示不会停下那条流。日志展示一次 514 个 token 的 prefill，同一 batch 里有 15 条在跑的请求。

```listing
title: SGLang with the mixed chunk in the middle of a wave
source: capture/gpu/out-l4/server-waves-mixed-chunk.log
lang: text
note: The pool at startup, one decode step with 16 users, and one prefill that ran together with 15 decodes.
---
[2026-10-21 08:34:19] KV Cache is allocated. dtype: torch.bfloat16, #tokens: 24094, K size: 1.65 GB, V size: 1.65 GB
[2026-10-21 08:39:51] Decode batch, #running-req: 16, #token: 8889, token usage: 0.37, cuda graph: True, gen throughput (token/s): 231.46, #queue-req: 0
[2026-10-21 08:40:22] Prefill batch, #new-seq: 1, #new-token: 514, #cached-token: 0, token usage: 0.34, #running-req: 15, #queue-req: 0, #pending-token: 0, cuda graph: True, input throughput (token/s): 2569.89
```

| Length ratio | Output tok/s, SGLang mixed chunk / vLLM | Median TPOT, SGLang mixed chunk / vLLM | P99 ITL, SGLang default / mixed chunk / vLLM |
|---|---|---|---|
| 1.0, fixed lengths | 182.3 / 181.7 | 73.1 / 76.8 ms | 81 / 203 / 502 ms |
| 0.5, mixed | 171.8 / 169.6 | 80.8 / 81.4 ms | 363 / 193 / 191 ms |
| 0.0, mixed | 171.9 / 174.4 | 76.8 / 75.0 ms | 302 / 196 / 202 ms |

**我们测到** mixed chunk 合上了差距。混合长度时，SGLang 现在在吞吐、每个 token 时间与 P99 ITL 上与 vLLM 打平，每一个种子范围都重叠。相对没有该标志的 SGLang，P99 ITL 在 0.5 时从 363 降到 193 ms，在 0.0 时从 302 降到 196 ms。输出大约升了 8%。

该标志在固定长度时有代价。中位 P99 ITL 从 81 升到 203 ms，三个种子从 83 散布到 349 ms。当一整波一起到达时，prefill 现在与 decode 共享步，所以流丢掉了之前干净的间隙。vLLM 服务器在那里仍更差，是 502 ms。

GB10 配 Qwen3-30B-A3B，对上同一天的一次默认跑，朝同一方向动，但每一次改动都在种子散布之内。混合长度时，中位 P99 ITL 在 0.5 时从 198 到 164 ms，在 0.0 时从 214 到 202 ms。固定长度时，它从 159 到 210 ms。该标志也把 0.0 时的中位 TTFT 从 324 抬到 442 ms，超出散布。把 GB10 读成一个弱的第二信号，而不是第二份证明。

有一条保留意见适用。L4 上的 SGLang 默认跑来自 2026-10-18，比 mixed-chunk 跑早三天。带标志时中位时钟是 1,425 到 1,508 MHz，不带时是 1,440 到 1,485 MHz。时钟解释不了差距。

这是一个模型、一块 GPU 与四种工作负载。它在主要一点上与现场报告一致。在独特提示的稠密模型上，闭环到 32 个用户时引擎在吞吐上相差在 3% 以内。在负载下它们最多相差 11%。

Sweep 补上了吞吐图藏起来的那一部分。当池满时，你在快速的第一个 token 与平滑的流之间选择，两个引擎默认选得不同。混合提示长度时，vLLM 默认在吞吐与流平滑度上领先。SGLang 仍在同样时间或更早给出第一个 token。一个 SGLang 标志 `--enable-mixed-chunk` 去掉了那个领先。

要看为什么一块 GPU 的数字与另一块不同，跑 [Inside an LLM Serving GPU](https://aiengineeringfromscratch.com/inside-an-llm-serving-gpu) 那台机器。它从与本节相同的摘要里读它的池大小、步时间与吞吐，覆盖 L4 与 GB10。它会说某个设置何时没有测过。

## 我们的立场 {#s-reading-other-peoples-benchmarks-our-position}

在我们的 L4 上配 Qwen3-8B 与独特提示时，引擎选择多半不是吞吐决策。它是延迟决策，而流量形状选出赢家。当请求一起到达时，在满池或波浪里，SGLang 保护流，vLLM 保护第一个 token。当混合长度的提示一个接一个到达时，vLLM 默认在吞吐与流平滑度上领先。开着 mixed chunk 时，SGLang 与它打平。

在每秒 4 个请求、过了满池时，vLLM 在我们的 L4 上也给出多 11% 的输出。在每秒 8 时种子范围重叠。按模型支持、启动时间与你有的硬件决定，然后测你自己的长度混合。

对重复前缀，先检查前缀缓存是开的，再测。在我们的 L4 上，前缀装得进池时，两个缓存在 500 ms 以下打平。关着缓存时，SGLang 花 14,706 ms，vLLM 花 13,353 ms。结果是缓存，不是引擎。对许多 GPU 上的 DeepSeek 级 MoE 模型，从 SGLang 开始，因为现场是在那里跑它们的。

最重要的是，不要导入一个结果。在你自己的工作负载上跑[第 5.1 节](#s-sglang-benchmark-serving) 的 sweep。一个已发布的数字告诉你该测哪种机制，别的什么都不告诉你。

## 事故 {#s-reading-other-peoples-benchmarks-the-incidents}

**一次其实是标志错误的内存结果。** 在 [vLLM discussion #17221](https://github.com/vllm-project/vllm/discussions/17221) 里，一个用户先看到 SGLang 在一块 A10 上用 7 GB，对上 vLLM 的 21 GB {{field vLLM-discussion 2025-04}}。然后用户发现匹配 vLLM `--max-model-len` 的标志是 `--context-length`，不是 `--max-total-tokens`。用对标志之后，内存使用大约一样。

**已经解析不了的建议。** 2026 年的现场报告建议用 `--cuda-graph-max-bs` 抬高 decode graph 上限。在 v0.5.22 那个标志拆成 `--cuda-graph-max-bs-decode` 与 `--cuda-graph-max-bs-prefill`。**代码**拒绝旧拼法。`sglang serve` 的参数解析器以 `ambiguous option: --cuda-graph-max-bs could match --cuda-graph-max-bs-decode, --cuda-graph-max-bs-prefill` 停下。一份调优配方与其版本绑得像一份基准一样紧。

**被回收的数字。** 本节开头那对 29% 在 2026-08-04 被 DeepInfra 批评其版本差距 {{field DeepInfra 2026-08}}。作者在 2026-10-14 回答说结果带不到长上下文 {{field AIMultiple 2026-10}}。SGLang 团队在 2024 做了更大的声称：Llama-70B 上吞吐最多 3.1 倍 {{team 2024-07}}。本次研究里找到的独立报告，没有一份在独特提示的稠密模型上复现过那么大的差距。

```takeaways
- 在匹配的 KV 池与匹配的 GPU 时钟上比较引擎，否则就别比。
- 把 P99 ITL 与 TTFT 并排读，因为满池用一个换另一个。
- 在读任何数字之前先找到 SGLang 版本与日期。
- 把工作负载形状匹配到你的，包括重复前缀的份额。
- 在重复提示上比较之前，先检查两个引擎的前缀缓存都是开的。
- 也测一次固定到达速率，因为闭环永远不会落后。
- 检查两个引擎是否以匹配的内存预算与上下文标志跑。
- 把测试并发与那块 GPU 的 decode graph 上限比较。
- 在混合提示长度上比较之前，先在 SGLang 打开 --enable-mixed-chunk，也测固定长度。
- 把每一个来源标成独立、GPU 云、厂商、竞争对手或 SGLang 团队。
- 在 v0.5.22 用 `--cuda-graph-max-bs-decode`，因为旧标志有歧义。
```

Sources: python/sglang/srt/arg_groups/memory_hook.py (GPU memory tiers), python/sglang/srt/arg_groups/fields/exec_.py (cuda_graph_max_bs_decode), python/sglang/srt/arg_groups/fields/schedule.py, all at v0.5.22 (baa9befa); the field reports linked in the text, fetched 2026-10-16; aimultiple.com/inference-engines; deepinfra.com/blog/vllm-vs-sglang; lmsys.org/blog/2024-07-25-sglang-llama3; inferencex.semianalysis.com/blog/mi355x-deepseek-v4-pro-sglang-110x-in-26-days. capture/gpu/out-l4/server-h2h-sglang.log, capture/gpu/out-l4/server-h2h-vllm.log, capture/gpu/out-l4/server-h2h-prefix-sglang.log, capture/gpu/out-l4/server-h2h-prefix-vllm.log, capture/gpu/out-l4/server-h2h-rate-sglang.log, capture/gpu/out-l4/server-h2h-rate-vllm.log, capture/gpu/out-l4/server-h2h-waves-vllm.log, capture/gpu/summary/l4.json, capture/gpu/sweep.py (vllm and sglang-h2h configs), capture/gpu/incidents/l4-vllm-flashinfer-jit.txt; capture/gpu/out-l4/server-h2h-prefix-vllm-no-cache.log, capture/gpu/summary/l4.json (prefix.vllm-no-prefix-cache); capture/gpu/out-l4/server-waves-mixed-chunk.log, capture/gpu/summary/l4.json (waves.mixed-chunk), capture/gpu/summary/gb10.json (waves.mixed-chunk, waves.graphs-on-b).
