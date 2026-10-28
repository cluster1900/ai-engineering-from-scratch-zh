# KV pool 与每 token 字节数

> SGLang 把每条正在跑的请求的每个 token 存在一个固定大小槽位的 pool 里，所以模型的每 token 字节数决定一块 GPU 能服务多少用户。

你租了一块 80 GB 内存的 GPU，跑一个 80 亿参数的模型。权重大约占 16 GB，所以多数人预期还能装很多用户。然后服务器在几十条并发对话处就开始排队，GPU 却还显示算力空闲。填满内存的不是权重，而是每个 token 的 key 和 value。

读完本节后，你能从模型 config 算出 KV 代价。你能在启动日志里找到同一个数字，并解释为什么 SGLang 用 token 计容量。

## 缓存为什么存在 {#s-kv-bytes-per-token-and-the-kv-pool-why-the-cache-exists}

**KV cache：** 为每一层保存的、更早每个 token 的 key 和 value，好让 decode 不用再算一遍。一步 decode 产出一个新 token。那个 token 要 attend 到它前面所有 token 的 key 和 value。没有缓存，每个新 token 都会把整段对话的 prefill 再做一遍。

所以缓存随两样东西增长：每段对话的长度，以及同时跑的对话数。在权重之后，它是服务引擎里最大的内存用户。[第 2 部分](#p-2) 里每一个调度决定，都是关于这块内存的决定。

## 公式，以及我们测到的第一个数 {#s-kv-bytes-per-token-and-the-kv-pool-the-formula-and-our-first-measured-number}

对普通 multi-head 或 grouped-query attention 的模型，一个 token 要花这么多字节：

`2 × layers × KV heads × head dim × bytes per value`

那个 2 计的是 key 和 value。**Grouped-query attention：** 几个 query head 共享一个 key 和 value head，所以现代模型的 KV head 远少于 attention head。SGLang 启动时就算这个数 {{code}}。在我们的 Mac 上，MLX 后端把它打在日志的前几行。

```listing
title: the KV pool, sized at startup
source: capture/out/server-default.log
lang: text
note: Two lines from the startup log of the default kit configuration.
---
[2026-10-16 13:58:03] Auto-sized attention KV pool: sys_available=48.49 GB, mlx_limit=51.8 GB, mlx_used=0.31 GB, kv_budget=19.39 GB, bytes_per_slot=114688, pool_size=181574
…
[2026-10-16 13:58:08] MlxAttentionKVPool: 181575 slots x 28 layers x 8 heads x 128 dim, dtype=mlx.core.bfloat16, ~19859.8 MB
```

我们为 Qwen3-0.6B 测到 `bytes_per_slot=114688`。第二行给出每一项：28 层、8 个 KV head、head 维度 128，以及 bfloat16（2 字节）。所以代价是 2 × 28 × 8 × 128 × 2，也就是 114,688 字节，或每 token 112 KiB。公式和日志逐字节一致。

对公开模型 config 做同样的算术，得到这些代价：

| 模型 | 注意力 | 每 token 字节，bf16 | 每 GPU |
|---|---|---|---|
| Qwen3-0.6B（我们的捕获） | GQA, 28 layers, 8 KV heads | 112 KiB | 一块 GPU 上 112 KiB |
| Llama-3.1-8B | GQA, 32 layers, 8 KV heads | 128 KiB | 一块 GPU 上 128 KiB |
| Llama-3.1-70B | GQA, 80 layers, 8 KV heads | 320 KiB | 8 路张量并行时 40 KiB |
| DeepSeek-V3 | MLA，61 层，latent 512 加 64 | 68.6 KiB | 每块 GPU 上 68.6 KiB |

有两个结果让多数人吃惊。0.6B 模型每个 token 的代价几乎和 8B 模型一样。决定代价的是层数和 KV head，不是参数量。在 Llama-3.1-8B 上，一段 100,000 token 的对话会占 12.2 GiB 的 KV，接近权重的大小。

**Multi-head latent attention (MLA)：** DeepSeek 的 attention，每个 token 存一份压缩 latent，而不是每个 head 分开存 key 和 value。MLA 每个 token 很小，但每个 tensor-parallel rank 都存完整的 latent {{code}}。用 tensor parallelism 加 GPU，并不会加 token。[第 6.1 节](#s-tp-size-dp-size-and-attn-dp-size) 展示 data-parallel attention 如何回答那个问题。

```figure
id: fig-3-1
kind: structure
title: what one token costs in Qwen3-0.6B
claim: One token of Qwen3-0.6B costs 114,688 bytes, the product of five numbers from the model config.
caption: Read left to right. Each box is one factor of the bytes_per_slot value in the startup log. From capture/out/server-default.log.
```

## 两张表，一个 pool {#s-kv-bytes-per-token-and-the-kv-pool-two-tables-one-pool}

SGLang 把 KV cache 放在固定大小槽位的 pool 里，每个 token 一个槽。前面有两张表，回答不同的问题 {{code}}。

**ReqToTokenPool：** 一张表，每条正在跑的请求一行，每个 token 位置一列。每个格子里是 KV pool 里一个槽的下标。第 0 行是 padding，好让 padded batch 条目写到无害的地方。

**TokenToKVPoolAllocator：** KV 槽的空闲列表。请求需要空间时它给出槽下标，请求结束时收回。槽 0 因同样的 padding 原因被保留。所以我们的日志对 181,574 的 pool 显示 181,575 个槽的缓冲区。

物理 pool 装着张量。Attention kernel 通过请求在 `ReqToTokenPool` 里的那一行读 key 和 value。这个设计有一个大影响。两条共享前缀的请求可以把各自的行指到同一批槽，所以共享 token 在内存里只存在一份。[第 3.3 节](#s-radixcache) 展示找到那些共享槽的 radix tree。

```figure
id: fig-3-1b
kind: structure
title: request rows point into one slot pool
claim: Two requests that share a system prompt point their first rows at the same KV slots, so the prefix exists once in memory.
caption: Read top to bottom. Each row is a ReqToTokenPool entry, and the strip below is the KV pool. Mechanism from the v0.5.22 code, sizes illustrative.
```

## 缓存就是 pool {#s-kv-bytes-per-token-and-the-kv-pool-the-cache-is-the-pool}

SGLang 没有单独的缓存大小设置。SGLang 论文把这当成设计选择：缓存的 token 和正在跑的请求用同一个内存 pool {{paper}}。一段缓存的前缀，是此刻没有正在跑的请求锁住的 KV。新请求需要空间时，SGLang 从同一个 pool 里逐出没有请求锁住的前缀。

这就是为什么启动日志只报告一个数字 `max_total_num_tokens`，而不是两个。在我们的 Mac 上用 `--mem-fraction-static 0.4`，那个数字是 181,574 个 token。模型允许的上下文是 40,960 个 token。所以 pool 能装四段满长对话，或大约 180 段各 1,000 token 的对话。正在跑的请求和缓存的前缀争用同一批槽。

## 我们的立场：用 token 计数，不要用 GB {#s-kv-bytes-per-token-and-the-kv-pool-our-position-count-tokens-not-gigabytes}

用 `max_total_num_tokens` 给部署定规模，不要用空闲内存。把你典型的上下文长度乘以你需要的并发，再和那个数字比。如果乘积更大，调度器会收回或排队请求，[第 2.3 节](#s-admission-and-retraction) 展示那要付的代价。

改变这个数字的两个杠杆是 [第 3.2 节](#s-mem-fraction-static-and-startup-sizing) 里的内存比例，以及 KV 数据类型。`--kv-cache-dtype` 默认是 `auto`，会保持模型数据类型，除非 checkpoint 要求 FP8 {{code}}。FP8 把每 token 字节数减半。

一份现场报告展示了那个杠杆有多大。Cloudflare 报告说，FP8 KV 把 Kimi K2.6 能装进内存的上下文从大约 686,000 抬到大约 137 万个 token {{field Cloudflare 2026-08}}。同一份报告在低并发下测到每请求吞吐少了几个百分点。在并发 64 时，BF16 配置内存不足，FP8 配置达到每秒 2,192 个 token。在那份报告里，FP8 KV 用每个 token 稍慢一点，换来两倍的用户。

我们自己的 FP8 运行同时改了权重和 KV cache，并且每个用户更快。在 L4 上，1 个用户时是每秒 24.5 对 13.4 个 token，如 [第 4.3 节](#s-quantization) 所示。复制这个改动之前，先读 [Cloudflare 的帖子](https://blog.cloudflare.com/smaller-faster-safer-models/) 里的准确率检查。

[Inside an LLM Serving GPU](https://aiengineeringfromscratch.com/inside-an-llm-serving-gpu?users=64) 这台机器把 KV pool 画成 L4 六个 GDDR6 封装上的格子。这个链接打开 64 用户的 BF16 运行：24,094 token 的 pool 装着 37 条各 640 token 的请求，另外 27 条在等。把权重和 KV cache 都切到 FP8，会看到 pool 长到 142,369 个 token。

## 要测什么 {#s-kv-bytes-per-token-and-the-kv-pool-what-to-measure}

- 读 `bytes_per_slot` 或自己算，并检查两者一致。
- 读启动日志里的 `max_total_num_tokens`，并除以你典型的上下文长度。
- 盯着调度器日志里的 `token usage`。它是正在跑的请求和缓存前缀占着的 pool 比例。

[推理优化](phases/10-llms-from-scratch/12-inference-optimization) 那一课会从零建一个 KV cache，如果你想看 SGLang 下面的机制。

```takeaways
- 从层数、KV head、head 维度和数据类型算出每 token 字节数。
- 用启动日志里的 bytes_per_slot 核对算出的数字。
- 用 max_total_num_tokens 按 token 规划容量，不要按 GB。
- 预期 MLA KV 在每个 tensor-parallel rank 上都有，所以更多 rank 不加 token。
- 买更多 GPU 之前先试 FP8 KV，并在你自己的数据上检查准确率。
```

Sources: python/sglang/srt/model_executor/pool_configurator.py (_compute_cell_size, calculate_pool_sizes), python/sglang/srt/mem_cache/memory_pool.py (ReqToTokenPool), python/sglang/srt/mem_cache/allocator/token.py (TokenToKVPoolAllocator), python/sglang/srt/hardware_backend/mlx/model_runner.py (_compute_pool_size), python/sglang/srt/arg_groups/fields/model.py (kv_cache_dtype) at v0.5.22, capture/out/server-default.log, the SGLang paper (arXiv 2312.07104), the Cloudflare report of 2026-08-03, capture/gpu/out-l4/server-load-default.log and capture/gpu/out-l4/server-load-fp8.log for the L4 pools.
