# MoE 服务：--moe-a2a-backend、DeepEP 与 EPLB

> 混合专家层把每个 token 送到持有其专家的 GPU，所以 MoE 服务主要是通信，最忙的那块 GPU 定下节奏。

像 DeepSeek-V3 这样的混合专家（MoE）模型，每个 token 从许多专家里激活少数几个。纸面上那是便宜的计算。在服务器里它是流量问题。每个 token 必须去到持有其选定专家的 GPU，每个结果必须回来，在每一步的每一个 MoE 层里都如此。然后一块过载的 GPU 会让所有其他 GPU 等待。

读完本节后，你能跟着一个 token 走过 SGLang 里的一个 MoE 层。你也能选择一个 all-to-all 后端与专家并行规模，并决定何时打开负载均衡与 batch overlap。

## 一个 MoE 层，五个阶段 {#s-moe-serving-deepep-and-eplb-one-moe-layer-five-stages}

**专家并行（EP）：** 每个 MoE 层的专家分到各 GPU，token 移向专家。`--ep-size` 设定多少块 GPU 共享这些专家。其默认是 1 {{code}}。

SGLang 把 MoE 前向切成各有一个所有者的阶段 {{docs}}。路由器为每个 token 挑选专家。分发器把 token 移到持有那些专家的 GPU。运行器用分组矩阵乘法计算全部本地专家。分发器再把结果移回并合并。

```figure
id: fig-6-2
kind: flow
title: one token through an MoE layer
claim: Dispatch and combine move every token across GPUs twice per MoE layer, and the grouped matrix multiply in between is the only expert compute.
caption: Read left to right. Indigo arrows are token traffic between GPUs. The labels name the SGLang stage and the flag that picks its implementation. From the MoE layer code and the expert parallelism docs at v0.5.22.
```

三个标志挑选实现 {{code}}：

| Flag | Default | Picks |
|---|---|---|
| `--moe-a2a-backend` | `none` | token 如何在 GPU 之间移动：`deepep`、`mooncake`、`nixl`、`mori`、`pplx`、`flashinfer` 以及其他 |
| `--moe-runner-backend` | `auto` | 哪个分组矩阵乘法内核跑这些专家 |
| `--deepep-mode` | `auto` | 对 prefill batch 用 `normal` 分发，对 decode batch 用 `low_latency` 分发 |

用 `none` 时，SGLang 用 all-reduce 或 all-gather 集合通信移动 token。那对任何布局都管用，规模大时带宽成本更高。all-to-all 后端只把每个 token 送到它必须去的地方。

## SGLang 强制的布局规则 {#s-moe-serving-deepep-and-eplb-the-layout-rules-that-sglang-enforces}

all-to-all 后端覆盖整个 TP 组。当你选了其中一个时，SGLang 把 `--ep-size` 设成等于 `--tp-size`，并在 info 级别记下改动 {{code}}。你不能跨八块里的四块跑 DeepEP。专家并行小于张量并行的混合布局只在 `none` 时管用 {{docs}}。

DeepEP 有两种分发模式。**Normal mode** 以高吞吐发送大的 prefill batch，且不能捕获进 CUDA graph。**Low-latency mode** 发送小的 decode batch，并能在 CUDA graph 里工作。默认 `auto` 在适合的地方用各自模式。如果你强制 `--deepep-mode normal`，SGLang 关掉 decode CUDA graph 并打印一行警告 {{code}}。[第 4.1 节](#s-forwardmode-and-cuda-graphs) 展示没有图的 decode 代价什么。

## 从你的 batch 选择专家并行规模 {#s-moe-serving-deepep-and-eplb-choose-the-expert-parallel-size-from-your-batch}

更宽的专家并行把专家摊得更薄，并在更慢的链路上移动更多流量。Ant Group 在带 DeepSeek-R1 decode 的 H20 GPU 上测过这一点 {{field Ant-Group 2025-09}}：

| Decode batch | EP16 | EP32 |
|---|---|---|
| 8 | 278 tokens/s | 293 tokens/s |
| 32 | 675 tokens/s | 585 tokens/s |

EP32 在小 batch 上赢了，在他们生产跑的 batch 上输了 13%。他们用流量解释结果：约一半的 MoE 流量在 EP16 留在 NVLink 上，对上 EP32 时大约四分之一。他们也选 EP16 来限制一块失败的 GPU 带走多少请求。他们的[帖子](https://www.lmsys.org/blog/2025-09-26-sglang-ant-group/)出现在 LMSYS 博客上，测量是他们的。

## 专家负载均衡 {#s-moe-serving-deepep-and-eplb-expert-load-balancing}

真实流量不会在专家上均匀铺开。有些专家拿到大多数 token，持有它们的 GPU 在每一步都变成最慢的 rank。

**EPLB：** 专家并行负载均衡器。它记录每一次前向用了哪些专家。每 `--eplb-rebalance-num-iterations` 次前向（默认 1000），它算出新的放置并移动专家权重 {{code}}。`--ep-num-redundant-experts` 为热门专家加额外副本，默认是 0。一个阈值标志在 GPU 利用率已经很高时跳过再平衡。其默认 1.0 意味着它从不跳过。

EPLB 默认关闭（`--enable-eplb` 为 false）。只在你的测量显示不平衡时打开它，不要更早。带着 `--expert-balancedness-report-mode prometheus` 跑，并看 `sglang:eplb_balancedness` {{code}}。SGLang 团队报告 EPLB 对 prefill 加速 1.49 倍、对 decode 加速 2.54 倍 {{team 2025-05}}。那些数字来自模拟的不平衡，所以在已经均衡的流量上预期更少。

## 让通信与计算重叠 {#s-moe-serving-deepep-and-eplb-overlapping-communication-with-compute}

**Two-batch overlap (TBO)：** 调度器把一个 batch 切成两个微 batch。一个微 batch 跑 attention，另一个在等 dispatch 或 combine。用 `--enable-two-batch-overlap` 打开它。默认关闭 {{code}}。

对 prefill，SGLang 按 token 数切分。如果没有切法能让每一侧至少拿到 48% 的 token，它就把一条序列切到两半。那就是 `--tbo-token-distribution-threshold`，默认 0.48。

SGLang 文档说 TBO 最多能给两倍吞吐 {{docs}}。文档链接的博客帖子在 96 块 H100 上测到 27% 到 35% {{team 2025-05}}。按测得的数字来规划。

Ant Group 在 H20 上把 TBO 调低了 {{field Ant-Group 2025-09}}。它只在 batch 大小 64 或 128 时有帮助，而在那些大小上他们的每输出 token 时间没达到目标。他们改用单 batch overlap，也就是 `--enable-single-batch-overlap`，让共享专家与 combine 步重叠。他们在 batch 20 到 56 测到 8% 到 10%。

## 一块 GPU，一个 MoE 模型：batch 会读更多专家 {#s-moe-serving-deepep-and-eplb-one-gpu-one-moe-model-the-batch-reads-more-experts}

在一块 GPU 上没有跨 GPU 的分发，所以 MoE 看起来便宜。我们在一块 NVIDIA GB10 上服务 Qwen3-30B-A3B，并把并发从 1 扫到 64。其配置有 48 层，每个 MoE 层 128 个专家，每个 token 激活 8 个专家。

| Concurrency | BF16 median TPOT | FP8 median TPOT |
|---|---|---|
| 1 | 32.52 ms | 18.41 ms |
| 8 | 102.21 ms | 54.96 ms |
| 64 | 254.06 ms | 131.78 ms |

**我们测过**这一点，每个点三个种子。从 1 到 64 个并发请求，每输出 token 时间在 BF16 下增长 7.8 倍，在 FP8 下增长 7.2 倍。在稠密模型里，一次 decode 步为整个 batch 把每个权重读一次。在 MoE 模型里，一步读到的权重大小随 batch 增长。我们没有在 GB10 上跑稠密对照。

```figure
id: fig-6-2c
kind: chart
title: time per output token against concurrency for an MoE model on a GB10
claim: The time per output token grew 7.8 times while the batch grew 64 times, and each extra request can read other experts.
caption: Read each line from left to right. Plum is BF16, green is FP8, and the band is the lowest and highest of three seeds. Qwen3-30B-A3B, 512 tokens in, 128 out. From capture/gpu/summary/gb10.json.
```

一个可能的原因是专家并集。在并发 1 时，每层在一次 decode 步读 8 个专家的权重。在 64 时，64 个 token 各自从 128 个专家里选 8 个。如果路由均匀，一步会在每层读到约 126 个专家中的 128 个。

那是算术，不是测量，真实路由更不均匀。每 token 时间从 32 到 64 个用户仍在上升，而那里并集大约只增长 13%。所以 sweep 里的 attention、KV 读，以及 prefill 步也随 batch 增长。名字说该模型每个 token 大约激活 3B 参数。64 的 batch 几乎读到全部 30B。

我们的提示也限制了这一结果。`random` 数据集发送 ShareGPT 文本，裁剪或重复到 512 token，每个答案跑到 128 token。

NVIDIA 研究者 2026 年的基准研究 SPEED-Bench，用随机 token id 测了一个 MoE 模型。在某些层里，20% 到 30% 的专家保持空闲。我们的提示是真实文本，仍不同于你的流量。我们没有测它们选了哪些专家。在你据此规划容量之前，用你自己提示的样本跑同样的 sweep。

**我们的立场：** 在单机上，按满 batch 读到的字节来规划 MoE 模型，而不是按其激活参数。先量化。带 FP8 KV 缓存的 FP8 检查点在我们测的每一个并发上，把每 token 时间切到 BF16 的 0.52 到 0.57。它量化了全部权重与 KV 缓存，所以我们不能把增益只归给专家。

## 我们的立场 {#s-moe-serving-deepep-and-eplb-our-position}

在同时做 prefill 与 decode 的服务器上，把 `--deepep-mode` 留在 `auto`。从满足你延迟目标的 batch 大小选择 `--ep-size`，而不是从最大的已发表运行。只在 `sglang:eplb_balancedness` 显示不平衡之后打开 EPLB。把 TBO 当作大 decode batch 的吞吐功能，并在保留它之前对照你的每输出 token 时间测量它。

## 两份全规模现场报告 {#s-moe-serving-deepep-and-eplb-two-field-reports-at-full-scale}

这部分有一个结果通过了外部审计。Crusoe 用 SGLang 0.5.15.post1 把 512 块 AMD MI355X 上的 DeepSeek-R1 提交给了 MLPerf Inference v6.1 {{field Crusoe 2026-09}}。每个节点跑 TP8，带 EP8 与八个注意力组。离线分数大约是每秒 290 万 token。在服务器场景里，p99 每输出 token 时间是 79.98 ms，上限是 80 ms。他们的[文章](https://www.crusoe.ai/resources/blog/serving-5-75-million-tokens-per-second-crusoes-mlperf-inference-v6-1-results-on-amd-mi355x)列出了标志。

SGLang 团队的 96-GPU 运行报告每个节点每秒 52.3k 输入与 22.3k 输出 token {{team 2025-05}}。它用了 12 个八块 H100 的节点，prefill 与 decode 在不同节点上。[第 6.3 节](#s-prefill-decode-disaggregation) 解释那种拆分。

## 一次真实事故：一块 GPU 内存不足 {#s-moe-serving-deepep-and-eplb-a-real-incident-one-gpu-runs-out-of-memory}

一个团队用四个 prefill 与六个 decode 服务器以及大的专家并行跑 DeepSeek V3（[issue #9787](https://github.com/sgl-project/sglang/issues/9787)）。负载下，一个 prefill rank 的 GPU 利用率掉到零，然后每个 prefill 进程崩溃。线程把它追溯到 DeepEP dispatch。不平衡路由给一块 GPU 送了太多 token，那块 GPU 内存不足。建议的修复是每个注意力组更小的分块 prefill、调好的初始专家放置，以及 EPLB。教训是通用的：在 MoE 服务里，最忙的 GPU 同时定下你的速度与内存上限。

```figure
id: fig-6-2b
kind: comparison
title: EP16 and EP32 at two batch sizes
claim: Wider expert parallelism won at batch 8 and lost 13 percent at batch 32, because less of its traffic stayed on NVLink.
caption: Read each column top to bottom. Numbers are decode tokens per second for DeepSeek-R1 on H20, from Ant Group on the LMSYS blog, 2025-09-26. This is their measurement.
```

```takeaways
- 除非你在调试一种分发模式，否则保持 --deepep-mode auto。
- 从满足你延迟目标的 batch 挑选 --ep-size。
- 只在 sglang:eplb_balancedness 显示不平衡之后启用 EPLB。
- 在保留 two-batch overlap 之前，对照每输出 token 时间测量它。
- 当一个 MoE rank 内存不足时，降低每个注意力组的分块 prefill。
- 按满 batch 读到的专家字节为单机 MoE 服务器定尺寸。
```

Sources: python/sglang/srt/arg_groups/fields/exec_.py, python/sglang/srt/arg_groups/overrides.py (_a2a_ep_size), python/sglang/srt/arg_groups/moe_hook.py, python/sglang/srt/eplb/eplb_manager.py, python/sglang/srt/batch_overlap/two_batch_overlap.py, python/sglang/srt/observability/metrics_collector.py, and docs/docs/advanced_features/expert_parallelism.mdx, all at v0.5.22. LMSYS, "Deploying DeepSeek with PD Disaggregation and Large-Scale Expert Parallelism on 96 H100 GPUs", 2025-05-05. Ant Group on the LMSYS blog, 2025-09-26. Crusoe, MLPerf Inference v6.1 results, 2026-09-16. Issue #9787. capture/gpu/summary/gb10.json, capture/gpu/sweep.py, and the config.json of Qwen/Qwen3-30B-A3B-Instruct-2507. python/sglang/benchmark/datasets/random.py (sample_random_requests) at v0.5.22. Abramovich and others, SPEED-Bench: A Unified and Diverse Benchmark for Speculative Decoding, arXiv 2604.09557 (2026-02, revised 2026-05).
