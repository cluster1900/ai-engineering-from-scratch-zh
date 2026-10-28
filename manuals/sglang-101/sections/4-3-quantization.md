# --quantization 与 --kv-cache-dtype

> 量化先买内存、再买速度，SGLang 把权重、GEMM 内核和 KV cache 做成三个独立选择，好让你只买需要的。

Cloudflare 用 BF16 KV cache 服务 Kimi K2.6，并一步步抬并发。在 32 并发请求时服务器产出 1,558 tok/s。在 64 时内存不足。用 FP8 KV cache 时，同一服务在 64 请求处到了 2,192 tok/s，大约比最好的 BF16 结果高 41% {{field Cloudflare 2026-08}}。在两个版本都能跑的每个并发上，FP8 cache 每 token 更慢。它赢是因为装得下两倍请求。

读完本节后，你能分清权重量化与 KV cache 量化，并在不打断检测的情况下加载量化检查点。你也能在量速度之前先估内存收益，并决定更低精度该放哪里。

## 三个选择，三个旗标 {#s-quantization-three-choices-three-flags}

**Weight quantization：** 用更少比特存模型权重，例如 FP8、FP4 或 INT4。它缩小权重和每次 GEMM 的内存流量。`--quantization` 选方法。

**GEMM backend：** 乘量化权重的内核库。`--fp8-gemm-backend` 和 `--fp4-gemm-backend` 选它，两者默认都是 `auto`，按 GPU 代际选。

**KV cache dtype：** 缓存的 key 和 value 的格式。`--kv-cache-dtype` 选它，与权重分开。默认 `auto` 用模型 dtype。

一个模型可以跑 FP8 权重加 BF16 KV cache，或 BF16 权重加 FP8 KV cache。每个选择动不同的预算，所以把它们当成三个决定。

## 权重：优先离线 {#s-quantization-weights-offline-first}

在 v0.5.22，`--quantization` 接受 31 个方法名。多数描述别人已经量化好的检查点：AWQ、GPTQ、ModelOpt FP8 和 FP4、compressed-tensors、GGUF、Quark 等。少数在模型加载时量化 BF16 权重：`fp8`、`mxfp8`、`nvfp4_online`，以及 Apple silicon 上的 `mlx_q4` 或 `mlx_q8`。

**Offline quantization：** 检查点已经存低比特权重和它们的 scale。**Online quantization：** SGLang 在加载时转换全精度权重。

加载量化检查点时，不要传 `--quantization`。模型 config 检查从检查点读 `quantization_config.quant_method` 并用它。如果你传了不同的方法，检查只接受已知兼容对，例如 `modelopt` 检查点上的 `modelopt_fp4`。对重新量化它记下你应再核验准确率。其他每种不匹配都在启动时抛错。

```figure
id: fig-4-4
kind: flow
title: how SGLang decides the weight format
claim: The checkpoint names its own quantization method, and a --quantization flag only helps when it matches that method or a known upgrade.
caption: Read each row left to right. The rose arrow ends in a startup error. The last row is the CUDA path at v0.5.22. From _verify_quantization and the GPTQ Marlin override at v0.5.22.
```

旗标也可以挡住一次升级。不带旗标加载的 GPTQ 检查点被检测、在运行时转换，并由 Marlin 内核服务。升级代码只在你没传方法或传了 `gptq_marlin` 时接受那种转换。

PR #32114 在 2026-09-10 删掉了普通 GPTQ CUDA 内核，在 CUDA 构建上方法注册表没有 `gptq` 条目。旗标解析器仍接受 `--quantization gptq`。模型 config 检查于是跳过 Marlin 升级，并抛出 `Unknown quantization method: gptq`。我们在代码里读了这条路径，没有在 GPU 上跑它。

## KV cache：容量，带一个 scale {#s-quantization-the-kv-cache-capacity-with-a-scale}

`--kv-cache-dtype` 接受 `auto`、`bf16`、`fp8_e4m3`、`fp8_e5m2`、`mxfp8`（仅 FA4）、`nvfp4` 和 `fp4_mx_block16`。FP8 把每 token 字节数减半，FP4 减到四分之一，所以同一份 pool 装得下两倍或四倍 token。[第 3.1 节](#s-kv-bytes-per-token-and-the-kv-pool) 展示如何为你的模型算每 token 字节数。

FP8 需要每个张量一个 scale。`--quantization-param-path` 的帮助文本说，KV cache dtype 是 FP8 时要提供 scales 文件。没有它，每个 scale 都是 1.0，准确率可能下降 {{code}}。每次改 KV cache dtype 都跑一次准确率检查。

vLLM 团队把 scale 1.0 当成准确率的最坏情况。他们在 2026 年测了未校准的 FP8 KV cache，多数模型在他们的测试里接近 BF16。他们点名 FlashMLA 后端上的 Kimi-K2.5 是需要校准 scale 的模型。我们自己没复现这些结果。

Cloudflare 公布了它的检查。在 Kimi K2.6 上，BF16 对 FP8 KV 在 GSM8K 上是 94.24 和 94.09，在 MMLU 上是 89.11 和 89.04，在 MMLU-Pro 上是 80.29 和 79.29 {{field Cloudflare 2026-08}}。那是他们模型上的数字，你的模型可以不同。

我们在 2026-10-23 在自己的 L4 上跑了检查：前 500 道 GSM8K 题，8-shot 且 greedy，用 `Qwen/Qwen3-8B` 和 `Qwen/Qwen3-8B-FP8`。两个检查点都没有 KV scales，所以 FP8 KV 运行用了 scale 1.0。

```listing
title: GSM8K accuracy, 500 questions, 8-shot, Qwen3-8B on SGLang 0.5.22
source: capture/gpu/out-l4/gsm8k-fp8-accuracy.txt
lang: text
note: The SGLang rows. The vLLM rows of the same file are cut.
---
engine   config                     correct   accuracy   Wilson 95% interval
SGLang   BF16                       458/500   91.6%      88.8 to 93.7
SGLang   FP8 weights                456/500   91.2%      88.4 to 93.4
SGLang   FP8 KV cache               458/500   91.6%      88.8 to 93.7
SGLang   FP8 weights + FP8 KV       460/500   92.0%      89.3 to 94.1
…
```

四个区间都重叠，所以这次运行没展示差别。有 500 道题，它排不掉丢几分的可能。那是一个模型和一个基准，所以它不取消你模型上的检查。

### 检查你的 scales 是否加载 {#s-quantization-check-that-your-scales-load}

只要你没传 `--quantization-param-path`，就会打印警告 `Using FP8 KV cache but no scaling factors provided` {{code}}。检查点也可以在权重文件里带着它的 scales。所以警告单独不能告诉你服务器用的是哪些 scales。

先在检查点里找 scales。在权重索引里搜以 `k_scale` 或 `v_scale` 结尾的张量名：

```bash
grep -oE '"[^"]*(k|v)_scale"' model.safetensors.index.json | sort -u
```

我们在 2026-10-22 对 `Qwen/Qwen3-30B-A3B-Instruct-2507-FP8` 的索引跑了这次搜索。它列出权重 scales，没有 KV scales，所以下面我们的 FP8 服务器用了 KV scale 1.0。

然后读加载日志。PR #35455 之前，SGLang 丢掉 compressed-tensors 检查点的 KV scales，日志报告每个 `k_scale` 参数未找到 {{issue #35455}}。修法在 v0.5.22 源码里 {{code}}。关于缺失 `k_scale` 或 `v_scale` 的警告仍表示加载器跳过了那些 scales。在 scales 接近 1.0 的检查点上，该 PR 量到丢掉 scales 时 GSM8K 是 0.960，加载 scales 时是 0.965。

最后，有 FP8 和没有 FP8 都跑你自己的 prompt，并在上线前比较答案。

## 量化是容量决定 {#s-quantization-quantization-is-a-capacity-decision}

```figure
id: fig-4-5
kind: comparison
title: BF16 against FP8 KV cache on Kimi K2.6
claim: The FP8 KV cache is a few percent slower at every load both caches can run, and keeps scaling after the BF16 cache runs out of memory.
caption: Output tokens per second by concurrency, as Cloudflare reported them on 2026-08-03. Dashed bars are BF16 and solid bars are FP8. Rose marks the out-of-memory run. No SGLang version was published.
```

Cloudflare 也在 GLM 5.2 上测了 INT4 权重 {{field Cloudflare 2026-08}}。Decode 变快了，并发 1 时 60 到 92 tok/s，64 时 1,672 到 1,933 tok/s。Prefill 变慢了，从 FP8 大约 10,160 tok/s 到 INT4 大约 8,660。

Decode 受内存流量限制，所以更小的权重有帮助。Prefill 受计算限制，反量化 INT4 花计算。Cloudflare 把两个阶段分到不同服务器，decode 跑 INT4，prefill 跑 FP8。[第 6.3 节](#s-prefill-decode-disaggregation) 解释这种拆分。

## 我们在 GB10 上测到的 {#s-quantization-what-we-measured-on-a-gb10}

我们在一块 NVIDIA GB10 上两次服务 `Qwen/Qwen3-30B-A3B-Instruct-2507`。第一台服务器加载 BF16 检查点。第二台加载 FP8 检查点 `Qwen/Qwen3-30B-A3B-Instruct-2507-FP8`，并带 `--kv-cache-dtype fp8_e4m3`。两者都用 `--mem-fraction-static 0.7`，我们没传 `--quantization` 旗标。

```listing
title: the FP8 server detects its checkpoint and sizes its pool
source: capture/gpu/out-gb10/server-fp8.log
lang: text
note: Four lines from the startup log. Timestamps are cut.
---
… Detected fp8 checkpoint.
… Using FP8 KV cache but no scaling factors provided. Defaulting to scaling factors of 1.0.
… Load weight end. elapsed=152.29 s, type=Qwen3MoeForCausalLM, quant=fp8, fmt=e4m3, avail mem=83.63 GB, mem usage=29.75 GB.
… KV Cache is allocated. dtype: torch.float8_e4m3fn, #tokens: 1083008, K size: 24.79 GB, V size: 24.79 GB
```

**我们测到** 两个选择买到了什么。权重从 57.75 GB 到 29.75 GB，加载时间从 323.61 s 到 152.29 s。pool 从 227,243 个 token 到 1,083,008 个 token，是 4.77 倍。

那个数字里两个效应相乘。更小的权重腾出 28.00 GB，pool 涨了 28.78 GB，从日志单位里的 20.80 GB 到 49.58 GB。然后每个 token 只花一半字节，48 层、4 个大小 128 的 KV head 是 49,152 对 98,304。

列表第二行是上一小节的警告。我们没给 scale 文件，所以每个 scale 都是 1.0。两台服务器对我们温度为 0 的第一条请求写了同样的 12 个 token。那是一条 prompt，不是准确率检查。

速度在每个负载上都变了。表来自扫描服务器，它们有 234,600 和 1,084,458 个 token 的 pool。扫描在每个并发上跑三个种子：

| 并发 | BF16 输出 tok/s | FP8 输出 tok/s | BF16 中位 TPOT | FP8 中位 TPOT |
|---|---|---|---|---|
| 1 | 29.14 | 51.50 | 32.52 ms | 18.41 ms |
| 8 | 74.11 | 137.00 | 102.21 ms | 54.96 ms |
| 32 | 150.66 | 283.19 | 201.91 ms | 104.12 ms |
| 64 | 235.38 | 440.86 | 254.06 ms | 131.78 ms |

```figure
id: fig-4-3b
kind: chart
title: FP8 moves the whole latency and throughput curve
claim: On the GB10, FP8 weights and FP8 KV gave more tokens per second and less time per token at every concurrency from 1 to 64.
caption: Each dot is one concurrency, from c1 to c64. The x axis is output tokens per second and the y axis is median TPOT. Plum is BF16 and green is FP8. From capture/gpu/summary/gb10.json.
```

这个结果不同于上面的 Cloudflare 结果。那里，FP8 cache 每 token 稍慢，靠容量赢。这里，权重也是 FP8。这台机器上的 decode 从带宽一般的内存读权重，所以一半字节几乎给了两倍速度。

## 同一测试在 24 GB L4 上 {#s-quantization-the-same-test-on-a-24-gb-l4}

GB10 有 121.7 GiB 内存，所以它的 BF16 pool 从不短缺。我们想看另一种情形，于是在一块 NVIDIA L4 上用 `Qwen/Qwen3-8B` 和 `Qwen/Qwen3-8B-FP8` 跑了同一对。两台服务器都用 `--mem-fraction-static 0.85`。扫描在每次运行前等卡凉到 72°C。

```listing
title: the BF16 server on the L4
source: capture/gpu/out-l4/server-load-default.log
lang: text
note: Two lines from the startup log. Timestamps are cut.
---
… Load weight end. elapsed=3.92 s, type=Qwen3ForCausalLM, avail mem=6.59 GB, mem usage=15.28 GB.
… KV Cache is allocated. dtype: torch.bfloat16, #tokens: 24094, K size: 1.65 GB, V size: 1.65 GB
```

```listing
title: the FP8 server on the L4
source: capture/gpu/out-l4/server-load-fp8.log
lang: text
note: Two lines from the startup log. Timestamps are cut.
---
… Load weight end. elapsed=2.54 s, type=Qwen3ForCausalLM, quant=fp8, fmt=e4m3, avail mem=13.06 GB, mem usage=8.81 GB.
… KV Cache is allocated. dtype: torch.float8_e4m3fn, #tokens: 142369, K size: 4.89 GB, V size: 4.89 GB
```

**我们测到** BF16 有 24,094 个 token 的 pool，FP8 有 142,369 个，是 5.91 倍。扫描里每条请求有 512 个输入 token 和 128 个输出 token。BF16 pool 大约装得下 37 条这样的请求。

| 并发 | BF16 输出 tok/s | FP8 输出 tok/s | BF16 中位 TTFT | FP8 中位 TTFT |
|---|---|---|---|---|
| 1 | 13.42 | 24.53 | 189.16 ms | 140.72 ms |
| 16 | 201.09 | 313.92 | 211.78 ms | 147.52 ms |
| 32 | 270.11 | 507.20 | 2,969.61 ms | 199.09 ms |
| 64 | 250.85 | 735.91 | 18,348.57 ms | 296.42 ms |

```figure
id: fig-4-3c
kind: chart
title: On a 24 GB card the BF16 pool fills
claim: On one L4, BF16 throughput stopped at 270 tokens per second at concurrency 32, and FP8 kept climbing to 736 at 64.
caption: Output throughput against max concurrency, three seeds per point. Plum is BF16 and green is FP8 weights with an FP8 KV cache. From capture/gpu/summary/l4.json.
```

扫描的调度器日志展示了并发 64 时的原因。BF16 服务器最多跑 38 条请求，token usage 在 0.99，队列里 26 条请求。FP8 服务器跑全部 64 条，token usage 0.29，队列空。BF16 吞吐从 32 到 64 下降，因为更多请求在等，每条等待的请求把它的等待加进 TTFT。

在并发 1 时 pool 大小无所谓，FP8 仍更快：每 token 39.66 ms 对 60.16 ms。那又是 GB10 效应。L4 上的 decode 为每个 token 读每个权重，FP8 权重是一半字节。

在这块卡上 goodput 结果很清楚。我们的目标是 TTFT 低于 1 s、TPOT 低于 100 ms。BF16 在并发 32 和 64 时每秒服务 0 条目标内请求。FP8 在 64 时每秒服务 2.87 条目标内请求。

### 当 pool 对前缀太小时 {#s-quantization-when-the-pool-is-too-small-for-the-prefixes}

上面的 L4 测试给了 BF16 一份满的 pool。然后我们给两个构建同一份更小的预算 `--mem-fraction-static 0.74`，并跑了 [第 3.3 节](#s-radixcache) 的共享前缀扫描。每次运行在 8 用户下按 4 组各 16 条发 64 条 prompt，共享 system prompt 从 0 到 4,096 个 token。四组在 4,096 个 token 时大约需要缓存里 16,000 个前缀 token。

```listing
title: two pools from one memory budget
source: capture/gpu/out-l4/server-small-pool-bf16-fp8.log
lang: text
note: The BF16 pool and the FP8 pool at the same memory fraction of 0.74.
---
[2026-10-18 19:35:26] KV Cache is allocated. dtype: torch.bfloat16, #tokens: 6559, K size: 0.45 GB, V size: 0.45 GB
[2026-10-18 22:02:58] KV Cache is allocated. dtype: torch.float8_e4m3fn, #tokens: 107299, K size: 3.68 GB, V size: 3.68 GB
```

| 共享提示 token | 输出 tok/s，BF16 / FP8 | 中位 TTFT，BF16 / FP8 |
|---|---|---|
| 0 | 113.5 / 180.1 | 354 / 255 ms |
| 1,024 | 95.0 / 164.1 | 470 / 349 ms |
| 2,048 | 25.9 / 155.1 | 12,576 / 380 ms |
| 4,096 | 10.9 / 134.8 | 40,126 / 372 ms |

**我们测到** BF16 有悬崖，FP8 没有。BF16 pool 持有 6,559 个 token，所以在 2,048 共享 token 时四段前缀不再装得下。它的中位首 token 从 470 ms 到 12.6 s。FP8 pool 持有 107,299 个 token，保留了每段前缀，每个长度的首 token 都低于 400 ms。在 2,048 共享 token 时，FP8 给出 BF16 输出的 6.0 倍。

一行附带属于最后一行。4,096 共享 token 的 BF16 运行在三次尝试后仍低于我们 1,000 MHz 的时钟地板，中位 390 MHz。把 2,048 那一行读成结果。它的 BF16 运行中位时钟 1,275 MHz，高于地板，但一半样本有热节流旗标。FP8 运行中位时钟 1,200 到 1,260 MHz。

[Inside an LLM Serving GPU](https://aiengineeringfromscratch.com/inside-an-llm-serving-gpu?workload=shared&shared=2048&frac=0.74) 机器在 L4 上跑小 pool 测试。这个链接打开分数 0.74、2,048 共享 token 的 BF16。四段前缀合起来装不进 6,559 个 token，所以树逐出前缀，请求再算一遍。把权重切到 FP8，在 107,299 个 token 里保留每段前缀。

## 我们的立场 {#s-quantization-our-position}

用离线量化的检查点，不要传 `--quantization` 旗标。SGLang 文档给了同样的建议 {{docs}}。在线量化加加载时间，并给你一份没人评估过的检查点。

按内存选 KV cache dtype，不要按速度。如果你的服务器因为 pool 满了而排队，FP8 是我们量到的最便宜的容量。我们的运行同时改了权重和 KV cache。对单独的 FP8 KV cache，证据是 [第 3.1 节](#s-kv-bytes-per-token-and-the-kv-pool) 的现场报告，并且你需要 scale 文件。如果 pool 有空间，保持模型 dtype。

在我们带 Qwen3-30B-A3B 的 GB10 上，FP8 权重加 FP8 KV cache 在每个并发上给出 1.73 到 1.88 倍吞吐。那块卡上的 decode 等内存，所以更小的权重更快。在服务它之前，在你自己的任务上检查准确率。

当你在分开的服务器上跑 prefill 和 decode 时，按阶段量化。更小的权重帮 decode，也可能拖慢 prefill。

## 事故 {#s-quantization-incidents}

**BF16 cache 在 64 请求时耗尽。** Cloudflare {{field Cloudflare 2026-08}} 报告 Kimi K2.6 带 BF16 KV cache 在并发 64 时内存不足。FP8 cache 持有大约 137 万 token，对大约 68.6 万，并服务了同一负载。

**一个容器跑不了 NVFP4。** joshua8.ai 的现场报告 {{field joshua8 2026-01}} 用了 RTX PRO 6000 Blackwell。NVFP4 在它的 SGLang 容器里跑不了，所以它拿 GPTQ-INT4 上的 SGLang 对 NVFP4 上的 vLLM。在同一权重格式上对比引擎，否则结果量的是格式。

**FP4 需要一代 GPU。** Pivot News 上的用户摘要 {{field Pivot News 2026-05}} 报告，RTX 4090 卡加入 Blackwell 流水线时 SGLang 崩溃。它的 FP4 路径要求计算能力 10.0，对更老的卡没有软件路径。这份报告经 Reddit 帖的二次摘要到我们手里。

```takeaways
- 加载量化检查点时不要带 --quantization，让 SGLang 读方法。
- 在 CUDA 构建上，用无旗标或 gptq_marlin 替换 --quantization gptq。
- 在服务 FP8 KV cache 之前，提供 KV scale 文件并跑准确率检查。
- 在检查点索引里搜 k_scale 和 v_scale，并读加载日志里未找到的 scales。
- 按队列长度和 pool 占用选 KV cache dtype，然后再量速度。
- 读 KV Cache is allocated 行，看每个选择买到的 pool 大小。
```

Sources: capture/gpu/out-gb10/server-default.log, server-fp8.log, server-fp8.command.txt, generate.txt, fp8-generate.txt, capture/gpu/summary/gb10.json, capture/gpu/summary/l4.json, capture/gpu/out-l4/server-load-default.log, server-load-fp8.log, python/sglang/srt/arg_groups/choices.py (QUANTIZATION_CHOICES), arg_groups/fields/model.py (kv_cache_dtype, quantization_param_path), configs/model_config.py (_verify_quantization), layers/quantization/__init__.py (get_quantization_config), layers/quantization/gptq/gptq.py (override_quantization_method), layers/quantization/fp8.py, and docs/docs/advanced_features/quantization.mdx at v0.5.22; model_executor/model_runner_components/load_model_utils.py (load_kv_cache_scales) and layers/quantization/compressed_tensors/compressed_tensors.py (kv_cache_scheme) at v0.5.22; PR #32114; PR #35455 (compressed-tensors KV scales, merged 2026-08-20); the model.safetensors.index.json of Qwen/Qwen3-30B-A3B-Instruct-2507-FP8 (read 2026-10-22); the vLLM team, The State of FP8 KV-Cache and Attention Quantization in vLLM (2026-04-22); field reports by Cloudflare (2026-08-03), joshua8.ai (2026-01-10), and Pivot News (2026-05-19); capture/gpu/out-l4/server-small-pool-bf16-fp8.log, capture/gpu/summary/l4.json (prefix.small-pool, prefix.fp8-small-pool), capture/gpu/out-l4/server-load-c64-scheduler.log, capture/gpu/out-l4/gsm8k-fp8-accuracy.txt
