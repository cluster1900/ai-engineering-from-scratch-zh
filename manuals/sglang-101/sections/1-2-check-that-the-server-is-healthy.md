# 确认服务器健康

> 发流量之前，确认服务器能应答、能产出 token，并且选了你预期的内存大小。

日志里的 ready 行说明服务器启动了。它不说明服务器能服务你的流量。Pool 太小，或者服务器产不出 token，仍然会打印同一行。

读完本节后，你能为脚本或探针选出合适的健康端点。你也能读懂划定服务器规模的三行启动日志，把它暖起来，并读出它的第一批指标。

## 等到 /health 返回 200 {#s-check-that-the-server-is-healthy-wait-until-health-returns-200}

要在脚本里等服务器，就反复问 `/health`，直到它返回 200：

```bash
until curl -sf -o /dev/null http://127.0.0.1:30000/health; do sleep 2; done
```

我们的 capture kit 也这么做，每 2 秒一次。服务器日志显示答案从 503 变成 200：

```listing
title: /health during the start of our L4 server
source: capture/gpu/out-l4/server-default.log
lang: text
note: Lines 36 to 43 of the log. The /model_info request and the first two prefill lines are cut.
---
[2026-10-17 14:43:37] INFO:     127.0.0.1:58250 - "GET /health HTTP/1.1" 503 Service Unavailable
…
[2026-10-17 14:43:38] INFO:     127.0.0.1:58272 - "POST /generate HTTP/1.1" 200 OK
[2026-10-17 14:43:38] INFO:     127.0.0.1:58288 - "POST /freeze_gc HTTP/1.1" 200 OK
[2026-10-17 14:43:38] The server is fired up and ready to roll!
[2026-10-17 14:43:40] Prefill batch, #new-seq: 1, #new-token: 1, #cached-token: 0, token usage: 0.00, #running-req: 0, #queue-req: 0, #pending-token: 0, cuda graph: False, input throughput (token/s): 0.58
[2026-10-17 14:43:40] INFO:     127.0.0.1:58298 - "GET /health HTTP/1.1" 200 OK
```

看 200 前面那一行。调度器为健康检查跑了一次单 token 的 prefill。默认下，`/health` 不只是应答。它会向模型发一条单 token 请求，并等待结果。

## 按任务选端点 {#s-check-that-the-server-is-healthy-choose-the-endpoint-for-the-job}

SGLang 有三个健康端点 {{code}}。按你问的问题选一个：

- **服务器起来了、在收请求吗？** 用 `/ready`。Tokenizer manager 就绪时它返回 200，并且不向模型发请求。
- **服务器现在能产出 token 吗？** 用 `/health_generate`。它发一条单 token 请求，20 s 内没有输出就返回 503。
- **`/health`** 与 `/health_generate` 共用处理函数。默认设置下，它也会生成一个 token。

等启动的脚本用三个都行。Kubernetes 探针在负载下选择很重要。会生成的探针跟用户排同一条队列。[第 7.1 节](#s-operating-sglang) 给出我们推荐的探针设置以及背后的事故。

## 读三行启动日志 {#s-check-that-the-server-is-healthy-read-the-three-startup-lines}

启动日志里有三行告诉你服务器能装多少。每次启动都读它们，因为是 SGLang 替你算的：

```listing
title: the sizing lines of our L4 server
source: capture/gpu/out-l4/server-default.log
lang: text
note: Three lines from the startup log. The lines between them are cut.
---
[2026-10-17 14:42:45] KV Cache is allocated. dtype: torch.bfloat16, #tokens: 22939, K size: 1.58 GB, V size: 1.58 GB
…
[2026-10-17 14:43:36] max_total_num_tokens=22939, chunked_prefill_size=4096, max_prefill_tokens=16384, max_running_requests=2048, context_len=40960, available_gpu_mem=1.31 GB
…
[2026-10-17 14:43:36] Tree cache initialized: source=default impl=UnifiedRadixCache hybrid_swa=False hybrid_ssm=False hicache_attached=False
```

**KV pool：** 保存服务器留下的每个 token 的 key 和 value 的那块 GPU 内存，所有请求合在一起。我们的 pool 能装 22,939 个 token。

把 pool 和 `context_len=40960` 比一下。一条请求可以比整个 pool 还长，所以一条长请求就能把它填满。二十三个各带 1,000 token 的用户也能填满。

`max_running_requests=2048` 是调度器同时跑的最多请求数。这个值是服务器算的，我们没设。早在 2,048 条请求之前，真正的上限就是 pool。

最后一行点名服务器用的前缀缓存。`UnifiedRadixCache` 是默认的 radix cache，`hicache_attached=False` 说明 HiCache 关着。[第 3.5 节](#s-eviction-policies-and-hicache) 解释何时打开它。

如果 pool 小于你的流量需要，去 [第 3.1 节](#s-kv-bytes-per-token-and-the-kv-pool) 算内存，去 [第 3.2 节](#s-mem-fraction-static-and-startup-sizing) 改大小。

## 测量之前先暖服务器 {#s-check-that-the-server-is-healthy-warm-up-the-server-before-you-measure}

本节第一部分的 listing 在 ready 行之前显示了一次 `POST /generate` 和一次 `POST /freeze_gc`。服务器给自己发了一条请求。然后冻结了 Python 垃圾回收器，好让启动时的对象不再被扫描。

这次 freeze 有一段历史。LinkedIn 的一份现场报告在小型排序模型上发现每隔几秒就有 100 到 300 ms 的垃圾回收停顿 {{field LinkedIn 2026-02}}。修法就是这次 warm-up 加上冻结的回收器，合并为 pull request 9241。

Warm-up 并不能让每台机器上的第一条请求都快。在我们的 L4 上，启动后第一条请求 68 ms 就到首 token。在我们的 Mac 上，同一种第一条请求要 889 ms。测量任何东西之前，先自己发几条请求。

## 检查第一批指标 {#s-check-that-the-server-is-healthy-check-the-first-metrics}

我们用 `--enable-metrics` 启动的服务器在 `/metrics` 上提供 Prometheus 指标。现在读四个，并把命令留着以后用：

```bash
curl -s http://127.0.0.1:30000/metrics | grep -E '^sglang:(num_running_reqs|num_queue_reqs|token_usage|cache_hit_rate)\{'
```

```listing
title: four metrics after our L4 runs
source: capture/gpu/out-l4/metrics.txt
lang: text
note: Four lines from /metrics, read after the benchmark runs of the default server.
---
sglang:num_running_reqs{engine_type="unified",model_name="Qwen/Qwen3-8B",moe_ep_rank="0",pp_rank="0",tp_rank="0"} 0.0
sglang:num_queue_reqs{engine_type="unified",model_name="Qwen/Qwen3-8B",moe_ep_rank="0",pp_rank="0",tp_rank="0"} 0.0
sglang:cache_hit_rate{engine_type="unified",model_name="Qwen/Qwen3-8B",moe_ep_rank="0",pp_rank="0",tp_rank="0"} 0.956268221574344
sglang:token_usage{engine_type="unified",model_name="Qwen/Qwen3-8B",moe_ep_rank="0",pp_rank="0",tp_rank="0"} 0.0
```

- `num_running_reqs` 和 `num_queue_reqs` 分别计正在跑的请求和正在等的请求。
- `token_usage` 是正在使用的 KV pool 占比，从 0 到 1。
- `cache_hit_rate` 是前缀缓存命中的 prompt token 占比。

我们的命中率是 0.956，因为基准发了很多带共享前缀的 prompt。空闲服务器上，四个值都接近 0。

端点默认关闭。如果命令什么都不打印，用 `--enable-metrics` 再启一次服务器。[第 5.2 节](#s-the-metrics-endpoint) 列出该告警的指标。

```takeaways
- 用 /ready 等启动，用 /health_generate 证明模型能应答。
- 每次启动都读 KV pool、max_running_requests 和 tree cache 行。
- 测量任何东西之前先发 warm-up 请求。
- 把慢答案怪到模型头上之前，先读 num_queue_reqs 和 token_usage。
```

Sources: capture/gpu/out-l4/server-default.log, capture/gpu/out-l4/metrics.txt, capture/gpu/out-l4/generate.txt, capture/gpu/run.py, capture/out/generate.txt, python/sglang/srt/entrypoints/http_server.py (health, health_generate, ready, _execute_server_warmup, _freeze_gc_after_server_warmup) at v0.5.22, LinkedIn Engineering, "Scaling LLM-based ranking systems with SGLang at LinkedIn" (https://www.linkedin.com/blog/engineering/ai/scaling-llm-based-ranking-systems-with-sglang-at-linkedin, 2026-02-20), pull request 9241 (https://github.com/sgl-project/sglang/pull/9241).
