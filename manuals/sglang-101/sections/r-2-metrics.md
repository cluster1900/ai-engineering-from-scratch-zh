# 指标

> 本手册读取的那些 Prometheus 序列、每一项量什么，以及生产里每一项回答的问题。

`--enable-metrics` 打开 `/metrics`。没有旗标，端点不存在，默认是关。我们的默认服务器导出了 81 个带前缀 `sglang:` 的指标族（[指标捕获](manuals/sglang-101/capture/out/metrics.txt)）。[第 5.2 节](#s-the-metrics-endpoint) 解释该对哪些告警。本表收着手册用到的那些。

## 延迟 {#s-ref-metrics-latency}

| 序列 | 类型 | 度量 | 它回答的问题 |
|---|---|---|---|
| `sglang:time_to_first_token_seconds` | histogram | 从到达首个输出 token 的时间 | 用户是否在看到任何内容前就在等 |
| `sglang:inter_token_latency_seconds` | histogram | 两个输出 token 之间的时间 | 流是否卡顿 |
| `sglang:request_time_per_output_token_seconds` | histogram | 按请求，decode 时间除以首 token 之后的输出 token 数 | 每个用户的 decode 是否慢 |
| `sglang:e2e_request_latency_seconds` | histogram | 从到达最后一个 token 的时间 | 完整回答要多久 |
| `sglang:queue_time_seconds` | histogram | 请求在第一次 prefill 前等待的时间 | 调度器是否在压着请求 |

## 负载与内存 {#s-ref-metrics-load-and-memory}

| 序列 | 类型 | 度量 | 它回答的问题 |
|---|---|---|---|
| `sglang:num_running_reqs` | gauge | 运行中 batch 里的请求 | GPU 上现在有多少活 |
| `sglang:num_queue_reqs` | gauge | 等待队列里的请求 | 准入是否成了瓶颈 |
| `sglang:token_usage` | gauge | 池槽位占用比例 | 池离满还有多近 |
| `sglang:num_retracted_reqs` | gauge | 上一日志间隔里调度器退回队列的请求 | 准入预测刚才是否失败 |
| `sglang:num_retracted_requests_total` | counter | 启动以来调度器退回队列的请求 | 准入预测失败有多频繁 |
| `sglang:max_total_num_tokens` | gauge | 以 token 计的 KV 池大小 | 启动 sizing 决定了什么 |
| `sglang:kv_cache_memory_usage_gb` | gauge | KV 池占用的内存 | 缓存占多少内存 |
| `sglang:gen_throughput` | gauge | 上一间隔每秒输出 token | 服务器是否在产出 token |
| `sglang:scheduler_idle_seconds_total` | counter | 无可运行或排队工作的时间 | 服务器是否利用不足 |

## 缓存与 token {#s-ref-metrics-cache-and-tokens}

| 序列 | 类型 | 度量 | 它回答的问题 |
|---|---|---|---|
| `sglang:cache_hit_rate` | gauge | 前缀缓存命中率 | 提示是否在复用缓存 |
| `sglang:cached_tokens_total` | counter | 已缓存的提示 token，按来源：device、host 或 storage | 哪一层缓存提供了命中 |
| `sglang:prompt_tokens_total` | counter | 已处理的 prefill token | 来了多少提示工作 |
| `sglang:uncached_prompt_tokens_histogram` | histogram | 需要计算的提示 token | 有多少提示工作是新的 |
| `sglang:generation_tokens_total` | counter | 产出的输出 token | 做了多少 decode 工作 |
| `sglang:num_requests_total` | counter | 已完成的请求 | 服务了多少请求 |
| `sglang:num_paused_reqs` | gauge | 因权重更新而暂停的请求 | RL 训练器是否在暂停服务器 |

## 我们的运行记下了什么 {#s-ref-metrics-what-our-runs-recorded}

共享前缀基准之后，[默认服务器](manuals/sglang-101/capture/out/metrics.txt) 报告 `sglang:cache_hit_rate` 0.94。[带 `--disable-radix-cache` 的服务器](manuals/sglang-101/capture/out/no-radix-cache-metrics.txt) 对同一基准报告 0.0。这个 gauge 覆盖最近一个窗口。

计数器覆盖每台服务器的整个生命周期，两台服务器在抓取之前跑了不同的基准集。默认服务器计了 286,134 个 prompt token，流式 286,102 加 32。其中 182,079 来自缓存，终身比率 0.64。每个计数器按标签集出现一次，所以除之前先把行加起来。

Sources: python/sglang/srt/observability/ at v0.5.22; capture/out/metrics.txt, no-radix-cache-metrics.txt, small-pool-metrics.txt.
