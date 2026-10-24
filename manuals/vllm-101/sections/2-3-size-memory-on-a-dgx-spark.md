# 在 DGX Spark 上规划显存

> 在统一内存上，GPU 和操作系统共用一个内存池，所以要从系统读取空闲内存，而不能只看 GPU。

你在 DGX Spark 或其他 CPU 与 GPU 共享内存的机器上运行 vLLM。读完本节后，你能选出一个给操作系统留足空间的显存比例，也会知道为什么第一次启动要花好几分钟。

**我们的结果：** 比例设为 0.75 时，在 121.69 GiB 内存中，权重占 56.93 GiB，KV cache 占 31.32 GiB。

## 了解这里的“GPU 显存”指什么 {#s-size-memory-on-a-dgx-spark-know-what-gpu-memory-means-here}

DGX Spark 里的 GB10 没有独立的 GPU 显存。CPU 和 GPU 使用同一块 LPDDR5x 内存，NVIDIA 按 128 GB 销售。在我们的机器上，启动日志报告的总量是 121.69 GiB。操作系统、页缓存和其他所有程序都使用这同一块内存。

vLLM 0.31.0 知道这一点。在集成 GPU 上，它从操作系统读取空闲内存，因为在这类机器上 GPU 驱动报告的空闲显存偏少。当整个系统的占用超过 80% 时，它还会释放自己缓存的 GPU 显存。所以 `--gpu-memory-utilization` 是整台机器的份额，而不是一块独立显卡的份额。

## 不要把比例当作硬上限 {#s-size-memory-on-a-dgx-spark-do-not-trust-the-fraction-as-a-hard-limit}

这个比例设定的是 vLLM 规划使用的份额。在统一内存上，它并不总能限制 vLLM 实际占用的量。其他用户的报告展示了两种情况，我们的运行中没有遇到：

- Issue 46307 报告了一台比例设为 0.70 的 GB10。它在启动 profile 期间用了约 112 GiB，而份额约为 83 GiB。机器停止了响应。该 issue 因长期无更新被关闭，没有修复。
- Issue 44740 报告在 GB10 上使用 MTP 投机解码时，CUDA graph 显存的估计值为负数。KV cache 分得过大，启动时显存耗尽。该 issue 仍未关闭。

在我们的运行中，各项数字与 0.75 的份额相符。这只是一次运行，而且没有使用投机解码。

要给 cache 一个固定大小，用 `--kv-cache-memory-bytes` 按字节设置，[显存不足页](#s-fix-out-of-memory-at-startup)对此有说明。检查权重、cache 加上 profile 所需的几 GiB 之后，仍给操作系统留有空间。

## 选出比例 {#s-size-memory-on-a-dgx-spark-pick-the-fraction}

把权重、你想要的 KV cache，以及启动 profile 和 CUDA graph 所需的几 GiB 加起来，再除以总内存。要给操作系统和页缓存留出空间，它们使用的是同一块内存。

我们用 BF16 运行 `Qwen/Qwen3-30B-A3B-Instruct-2507`，比例设为 0.75：

| 部分 | 大小 |
|---|---|
| vLLM 的份额，121.69 GiB 的 0.75 | 91.3 GiB |
| 权重 | 56.93 GiB |
| 留给 KV cache 的空闲内存 | 31.32 GiB |
| 其余部分，用于 profile 和 graph | 约 3 GiB |

按每 token 96 KiB 计算，31.32 GiB 约能容纳 342,000 个 token，足够 500 多个各占 640 token 的用户使用。我们的扫测用的是一个更小的[固定池](#s-count-the-memory-before-you-pick-a-gpu)。这个比例给操作系统和其他所有程序留下了约 30 GiB。

我们只运行了一个比例。按比例扫测 KV 池和 swap 活动的实验已在计划中，尚未运行。

```figure
id: fig-2-3
kind: layers
title: one pool on a DGX Spark
claim: With a fraction of 0.75, vLLM takes 91.3 of the 121.7 GiB that the CPU and the GPU share on a DGX Spark.
caption: The bar is the whole memory, drawn to scale. The blue rule marks the share of vLLM. From capture/gpu/out-gb10/server-load-vllm.log.
```

## 预期第一次启动会很慢 {#s-size-memory-on-a-dgx-spark-expect-a-slow-first-start}

第一次启动用了五分钟以上。日志显示了时间花在哪里：

```listing
title: the weight load on a GB10
source: capture/gpu/out-gb10/server-load-vllm.log
lang: text
note: 330 seconds to load 56.93 GiB of weights.
---
(EngineCore pid=143) INFO 10-21 10:58:45 [model_runner.py:407] Model loading took 56.93 GiB memory and 330.542793 seconds
```

加载过程把每个 tensor 从内存映射的 safetensors 文件复制到 GPU 分配的内存中，一次一个 tensor。在 GB10 上，从文件映射的页面复制很慢。一个尚未关闭的 vLLM issue 测得，从文件视图复制每个 tensor 约需 1.7 ms；先在主机内存中复制一份，则约需 0.2 ms。

0.31.0 版本加快了加载中的另一个环节：按索引查找 expert 名称，在 DGX Spark 上约节省 25 s。每个 tensor 复制的开销依然存在。

有两件事有帮助：

- 把权重放在本地 NVMe 盘上，而不是网络挂载上。
- 启动服务器一次后让它一直运行。每次重启都要再付出完整的加载时间。

## 检查比例 {#s-size-memory-on-a-dgx-spark-check-the-fraction}

启动后，读两行显存日志和系统内存：

```bash
grep -E "Model loading took|Available KV cache memory|GPU KV cache size" server.log
free -g
```

如果服务器空闲时 `free -g` 显示几乎没有可用内存，就把比例降低 0.05 后重新启动。如果 KV cache 那一行超出了你的份额允许的大小，改为按字节设置 cache 大小。

```takeaways
- 在统一内存上，显存比例是整台机器的份额。
- 给操作系统和页缓存留出空间，并用 `free -g` 检查。
- 第一次加载权重预计要几分钟，加载后让服务器一直运行。
```

Sources: the vLLM source at v0.31.0 (vllm/utils/mem_utils.py, vllm/platforms/cuda.py), the v0.31.0 release notes (weight loading on DGX Spark), vLLM issue 58726 (slow weight loading on GB10), vLLM pull request 58720 (indexed expert lookups in the weight load), capture/gpu/out-gb10/server-load-vllm.log, capture/gpu/summary/gb10.json, vLLM issue 44740 (negative CUDA graph memory estimate with MTP speculation on the GB10), vLLM issue 46307 (memory use above the share during the startup profile on the GB10), vLLM documentation at v0.31.0 (--kv-cache-memory-bytes).
