# 指标

> 本手册读取的那些 Prometheus 序列、每一项量什么，以及生产里每一项回答的问题。

`--enable-metrics` 打开 `/metrics`。没有旗标，端点不存在，默认是关。我们的默认服务器导出了 81 个带前缀 `sglang:` 的指标族（[指标捕获](manuals/sglang-101/capture/out/metrics.txt)）。[第 5.2 节](#s-the-metrics-endpoint) 解释该对哪些告警。本表收着手册用到的那些。

## 延迟 {#s-ref-metrics-latency}

| Series | Type | Measures | The question it answers |
|---|---|---|---|
| `sglang:time_to_first_token_seconds` | histogram | the time from arrival to the first output token | are users waiting before they see anything |
| `sglang:inter_token_latency_seconds` | histogram | the time between two output tokens | does the stream stutter |
| `sglang:request_time_per_output_token_seconds` | histogram | per request, the decode time divided by the output tokens after the first | is decode slow for each user |
| `sglang:e2e_request_latency_seconds` | histogram | the time from arrival to the last token | how long does a full answer take |
| `sglang:queue_time_seconds` | histogram | the time a request waits before its first prefill | is the scheduler holding requests back |

## 负载与内存 {#s-ref-metrics-load-and-memory}

| Series | Type | Measures | The question it answers |
|---|---|---|---|
| `sglang:num_running_reqs` | gauge | requests in the running batch | how much work is on the GPU now |
| `sglang:num_queue_reqs` | gauge | requests in the waiting queue | is admission the bottleneck |
| `sglang:token_usage` | gauge | the fraction of pool slots in use | how close the pool is to full |
| `sglang:num_retracted_reqs` | gauge | requests the scheduler moved back to the queue in the last log interval | did the admission forecast fail just now |
| `sglang:num_retracted_requests_total` | counter | requests the scheduler moved back to the queue since start | how often does the admission forecast fail |
| `sglang:max_total_num_tokens` | gauge | the size of the KV pool in tokens | what did startup sizing decide |
| `sglang:kv_cache_memory_usage_gb` | gauge | memory used by the KV pools | how much memory the cache holds |
| `sglang:gen_throughput` | gauge | output tokens per second in the last interval | is the server producing tokens |
| `sglang:scheduler_idle_seconds_total` | counter | time with no runnable or queued work | is the server underused |

## 缓存与 token {#s-ref-metrics-cache-and-tokens}

| Series | Type | Measures | The question it answers |
|---|---|---|---|
| `sglang:cache_hit_rate` | gauge | the prefix cache hit rate | are prompts reusing the cache |
| `sglang:cached_tokens_total` | counter | cached prompt tokens, by source: device, host, or storage | which cache tier served the hits |
| `sglang:prompt_tokens_total` | counter | prefill tokens processed | how much prompt work arrived |
| `sglang:uncached_prompt_tokens_histogram` | histogram | prompt tokens that needed compute | how much prompt work was new |
| `sglang:generation_tokens_total` | counter | output tokens produced | how much decode work was done |
| `sglang:num_requests_total` | counter | finished requests | how many requests were served |
| `sglang:num_paused_reqs` | gauge | requests paused for a weight update | is an RL trainer pausing the server |

## 我们的运行记下了什么 {#s-ref-metrics-what-our-runs-recorded}

共享前缀基准之后，[默认服务器](manuals/sglang-101/capture/out/metrics.txt) 报告 `sglang:cache_hit_rate` 0.94。[带 `--disable-radix-cache` 的服务器](manuals/sglang-101/capture/out/no-radix-cache-metrics.txt) 对同一基准报告 0.0。这个 gauge 覆盖最近一个窗口。

计数器覆盖每台服务器的整个生命周期，两台服务器在抓取之前跑了不同的基准集。默认服务器计了 286,134 个 prompt token，流式 286,102 加 32。其中 182,079 来自缓存，终身比率 0.64。每个计数器按标签集出现一次，所以除之前先把行加起来。

Sources: python/sglang/srt/observability/ at v0.5.22; capture/out/metrics.txt, no-radix-cache-metrics.txt, small-pool-metrics.txt.
