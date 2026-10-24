# 选 GPU 之前先算显存

> 决定能容纳多少用户的是 KV cache，而不是权重；你可以用模型配置里的四个数字把它算出来。

你选了一块 GPU，服务器能容纳的用户却比计划的少。读完本节后，你能针对一个模型和一个上下文长度，预测 KV 池的大小和能容纳的用户数。

**我们的结果：** 在我们的 L4 上运行 Qwen3-8B，24,096 token 的池容纳了 37 个各占 640 token 的用户，尽管启动日志那一行打印的是 2.94。

## 计算一个 token 的字节数 {#s-count-the-memory-before-you-pick-a-gpu-count-the-bytes-for-one-token}

运行中请求的每个 token 都会把它的 key 和 value 保存在 GPU 显存里，直到请求结束。模型配置里的四个数字决定了它的大小：

```text
KV bytes per token = layers x KV heads x head size x 2 x bytes per value
```

因子 2 对应 key 和 value。前三个数字从 `config.json` 里读取，分别是 `num_hidden_layers`、`num_key_value_heads` 和 `head_dim`。在 BF16 下，一个值占 2 字节；使用 FP8 KV cache 时，占 1 字节。

| 模型 | 层数 | KV 头数 | 头大小 | BF16 下每 token 的 KV |
|---|---|---|---|---|
| `Qwen/Qwen3-8B` | 36 | 8 | 128 | 144 KiB |
| `Qwen/Qwen3-30B-A3B-Instruct-2507` | 48 | 4 | 128 | 96 KiB |

这个混合专家模型的权重几乎是稠密模型的四倍，但它为每个 token 保存的字节更少。决定这个数字的是 KV 头数，而不是参数量。

```figure
id: fig-2-1
kind: structure
title: the bytes for one token
claim: Qwen3-8B holds 144 KiB of KV cache for every token, and Qwen3-30B-A3B holds 96 KiB, because it has fewer KV heads.
caption: Multiply the five numbers in each row. The last factor is two bytes for BF16. From the model configs on the Hugging Face Hub.
```

## 把字节换算成用户数 {#s-count-the-memory-before-you-pick-a-gpu-turn-bytes-into-users}

vLLM 把权重和启动 profile 之后剩下的显存分给 KV cache。用这部分显存除以每 token 的字节数，得到以 token 计的池大小。再用池大小除以一个用户占用的上下文：

```text
users that fit = KV pool in tokens / (prompt tokens + output tokens per user)
```

需要的 block 多于空闲 block 的请求会在队列里等待。如果一个运行中的请求需要新 block 而没有空闲的，vLLM 会停下它，稍后重新计算。

## 用启动日志核对计算结果 {#s-count-the-memory-before-you-pick-a-gpu-check-the-count-against-the-startup-log}

每次启动后读两行日志。在我们的 DGX Spark 上，使用 `Qwen/Qwen3-30B-A3B-Instruct-2507` 和 `--gpu-memory-utilization 0.75`，日志显示：

```listing
title: the memory lines from a GB10 start
source: capture/gpu/out-gb10/server-load-vllm.log
lang: text
note: The weights took 56.93 GiB, and 31.32 GiB was left for the KV cache.
---
(EngineCore pid=143) INFO 10-21 10:58:45 [model_runner.py:407] Model loading took 56.93 GiB memory and 330.542793 seconds
(EngineCore pid=143) INFO 10-21 10:59:46 [gpu_worker.py:692] Available KV cache memory: 31.32 GiB
```

按每 token 96 KiB 计算，31.32 GiB 约能容纳 342,000 个 token。

**固定池：** 在我们的扫测中，我们用 `--num-gpu-blocks-override` 手动设置池大小，它设置的是 16-token block 的数量。我们给 vLLM 的池与同一台机器上的 SGLang 服务器相同，让两个引擎有同样的空间。在 DGX Spark 上，池是 234,960 token；在 L4 上，是 24,096 token。你的服务器会根据空闲显存确定池大小，所以会用满全部数量。

下一行给出以 token 计的池大小，以及在满上下文长度下能容纳的用户数：

```listing
title: the pool line from the L4 comparison run
source: capture/gpu/out-l4/server-h2h-vllm.log
lang: text
note: 24,096 tokens at 144 KiB each is 3.31 GiB of KV cache.
---
INFO 10-17 20:13:17 [kv_cache_utils.py:2464] GPU KV cache size: 24,096 tokens, Maximum concurrency for 8,192 tokens per request: 2.94x
```

`Maximum concurrency` 这个数字假设每个用户都占满整个 `--max-model-len`。真实用户占用得更少，所以能容纳更多人。按 512 个 prompt token 和 128 个输出 token 计算，24,096 token 的池在用户占满各自长度时能容纳 37 个用户。在我们的负载扫测中，日志显示有 40 个运行中的请求，cache 已满 99.5%，因为刚开始作答的用户占用的 token 更少。

```figure
id: fig-2-1b
kind: comparison
title: the pool decides the users
claim: The same 24,096-token pool fits 2.94 users at the full context length, but 37 users who each hold 640 tokens.
caption: Each blue block is one user. The dashed part is pool that no full-length user fills. From capture/gpu/out-l4/server-h2h-vllm.log.
```

## 决定要改什么 {#s-count-the-memory-before-you-pick-a-gpu-decide-what-to-change}

如果算出来的数字对你的流量来说太小，你有四个选择，按代价从低到高排列：

1. 把 `--max-model-len` 降到你的用户实际发送的最长上下文。池的大小不变，但一个长请求再也不能把它全部占满。
2. 使用 FP8 KV cache。它把每 token 的字节数减半。[FP8 KV 页](#s-fit-more-users-with-an-fp8-kv-cache)展示了它的代价。
3. 使用 FP8 权重。它们为 cache 腾出显存。[FP8 权重页](#s-fit-a-bigger-model-with-fp8-weights)说明了什么时候值得这么做。
4. 使用显存更大的 GPU，或者把模型拆到多块 GPU 上。[并行页](#s-choose-tensor-pipeline-or-data-parallelism)讲的就是这个。

```takeaways
- 在购买或租用 GPU 之前，先用四个配置数字算出每 token 的 KV 字节数。
- 用 KV 池除以每个用户的上下文，而不是除以最大模型长度。
- 每次启动后，把你的计算结果与显存行和池大小行进行对照。
```

Sources: vLLM documentation at v0.31.0 (docs/configuration/optimization.md, docs/design/prefix_caching.md), the model configs of Qwen/Qwen3-8B and Qwen/Qwen3-30B-A3B-Instruct-2507, capture/gpu/out-gb10/server-load-vllm.log, capture/gpu/out-l4/server-h2h-vllm.log, capture/gpu/summary/l4.json, capture/gpu/summary/gb10.json.
