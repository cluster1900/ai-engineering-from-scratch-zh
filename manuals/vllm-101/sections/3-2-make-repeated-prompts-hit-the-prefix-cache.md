# 让重复的 prompt 命中 prefix cache

> Prefix caching 默认开启，只有当 prompt 中共享的部分放在最前面时，它才有收益。

每个请求都重复同一段很长的 system prompt。读完本节后，你能调整 prompt 的顺序让 cache 命中，并用一个指标证明命中。

**我们的结果：** 在我们的 L4 上，cache 让第一个 token 在每种前缀长度下都保持在 400 ms 左右。没有它时，1,024 个共享 token 下第一个 token 要 1,213 ms。

## 看看 cache 节省了什么 {#s-make-repeated-prompts-hit-the-prefix-cache-see-what-the-cache-saves}

vLLM 0.31.0 默认开启 prefix caching。我们在 L4 上用 `Qwen/Qwen3-8B` 分别在开启和关闭它的情况下跑了同样的负载。每次运行在 8 个用户下发送 4 组、每组 16 个 prompt。同一组的 prompt 共享一段长度如表所示的 system prompt。每个 prompt 再加上一个 128 token 的问题，并要求返回 64 个 token。

| 共享 prompt token 数，L4 满频会话 | TTFT 中位数，cache 开 | TTFT 中位数，cache 关 | 输出 tok/s，开 / 关 |
|---|---|---|---|
| 无 | 408 ms | 392 ms | 113.8 / 113.6 |
| 256 | 488 ms | 753 ms | 111.5 / 99.1 |
| 1,024 | 396 ms | 1,213 ms | 106.0 / 70.9 |
| 2,048 | 410 ms | 2,550 ms | 100.2 / 46.6 |
| 4,096 | 375 ms | 13,353 ms | 86.8 / 19.6 |

开启 cache 时，每种前缀长度下第一个 token 都约为 400 ms。关闭 cache 时，第一个 token 随共享部分的长度增长，因为每个请求都要重新计算整个 prompt。

读最后两行时要小心：无缓存的运行降了频，时钟中位数在 2,048 token 时降到 1,035 MHz，在 4,096 token 时降到 675 MHz。最干净的比较是 1,024 token 这一行，两次运行都保持在 1,410 MHz 或以上。在那里，cache 把第一个 token 的时间缩短了约 3 倍，输出多了 50%。开启 cache 的运行在 2026-10-17 和 2026-10-18，关闭的在 2026-10-21。

服务器日志每隔几秒报告一次命中率：

```listing
title: the prefix cache in the middle of a shared-prefix run
source: capture/gpu/out-l4/server-h2h-prefix-vllm.log
lang: text
note: 87 percent of the prompt tokens came from the cache.
---
INFO 10-18 00:43:16 [loggers.py:320] Engine 000: Avg prompt throughput: 231.0 tokens/s, Avg generation throughput: 93.6 tokens/s, Running: 8 reqs, Waiting: 0 reqs, GPU KV cache usage: 77.2%, Prefix cache hit rate: 87.2%
```

```figure
id: fig-3-2b
kind: chart
title: the cache on and off
claim: With the prefix cache on, the first token stayed near 400 ms at every shared length on our L4.
caption: Read the log scale with care: each grid line is about three times the one below. Bands span three runs. From capture/gpu/summary/l4.json.
```

## 把共享部分放在最前面 {#s-make-repeated-prompts-hit-the-prefix-cache-put-the-shared-part-first}

cache 从 prompt 的第一个 token 开始匹配，每次一个 16-token block。它在第一个不同的 block 处停止。所以要命中 cache，prompt 开头需要有相同的 token，且顺序相同。

1. 先放永远不变的部分：system prompt、tool 定义和固定的指令。
2. 接着放很少变化的部分，例如一个会话的文档。
3. 最后放每个请求都会变的部分：用户问题、时间和请求 ID。

prompt 开头附近的时间戳或 ID 会改变第一个 block，之后的每个 block 都会未命中。也检查一下你的 chat template。有些 template 会把日期放进 system prompt。

vLLM 只缓存完整的 block。20 个 token 的共享部分只会得到一个 16 token 的缓存 block，最后 4 个 token 总是要计算。

```figure
id: fig-3-2
kind: structure
title: a prefix hit
claim: A new request reuses cached blocks from the start of its prompt and stops at the first block that differs.
caption: Read the top row first, then the bottom row. Dashed blocks are computed again. From the vLLM source at v0.31.0.
```

## 隔离租户 {#s-make-repeated-prompts-hit-the-prefix-cache-keep-tenants-apart}

两个 prompt 前缀相同的用户会共享缓存的 block。这节省了计算，但也会让一个用户通过时延推测出另一个用户发送了什么。要隔离租户，在每个请求中发送一个 `cache_salt` 字段。salt 不同的请求从不共享 block。LoRA adapter 也是 block key 的一部分，所以两个 adapter 从不共享 block。

## 证明命中 {#s-make-repeated-prompts-hit-the-prefix-cache-prove-the-hit}

从 `/metrics` 读取两个计数器：

```bash
curl -s localhost:8000/metrics | grep -E "^vllm:prefix_cache_(queries|hits)"
```

hits 除以 queries 就是你的命中率。对单个 prompt，把同一个长 prompt 发送两次，比较第二次和第一次到第一个 token 的时间。

如果命中率低，原因几乎总是 prompt 的顺序。其次是池满了，因为 cache 只会保留旧 block，直到某个运行中的请求需要这块显存。

```takeaways
- 在我们的 L4 上，默认的 prefix cache 让第一个 token 在每种前缀长度下都保持在 400 ms 左右。
- 把 prompt 中共享的部分放在前面，变化的部分放在最后。
- 用 cache_salt 隔离租户。
- 用 prefix cache 计数器证明命中，而不是靠猜。
```

Sources: capture/gpu/summary/l4.json (prefix.vllm, prefix.vllm-no-prefix-cache), capture/gpu/out-l4/server-h2h-prefix-vllm.log, capture/gpu/out-l4/server-h2h-prefix-vllm-no-cache.log, vLLM documentation at v0.31.0 (docs/design/prefix_caching.md), the vLLM source at v0.31.0 (vllm/v1/core/kv_cache_utils.py, vllm/config/cache.py).
