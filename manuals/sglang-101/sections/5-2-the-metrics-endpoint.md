# /metrics 端点

> Gauge 报告一个瞬间，缓存命中率 gauge 报告一个日志间隔，所以你要在一段时间窗口上对计数器与直方图告警。

你的仪表盘说前缀缓存命中率是 94%。同一次运行里，服务器计算了 104,057 个提示 token，并从缓存取了 182,079 个，真实命中率是 64%。两个数字都来自我们捕获里对服务器的一次抓取。一个是记住它记录的最后一个 prefill batch 的 gauge。另一个是记住一切的一对计数器。

读完本节后，你能打开该端点，并分清 gauge、计数器与直方图。你能算出有意义的命中率，并为过了拐点的服务器写六条告警。

## 先打开它 {#s-the-metrics-endpoint-turn-it-on-first}

该端点默认关闭。字段 `enable_metrics` 在 v0.5.22 默认是 `False` {{code}}，没有 `--enable-metrics` 时服务器根本不挂载 `/metrics` 路径。我们的捕获服务器带着该标志启动，如[第 5.1 节](#s-sglang-benchmark-serving)所示。默认实验之后，它导出了 81 个以 `sglang:` 开头的度量族，共 603 条样本行。

**我们的立场：** 每台服务器都以 `--enable-metrics` 启动，包括你笔记本上的那台。我们没有测它的成本，并预期它相对一次 decode 步很小。没有历史的一次事故，代价是整次调查。

## 三种序列 {#s-the-metrics-endpoint-three-kinds-of-series}

**Gauge：** 调度器在每个日志间隔覆盖的值，例如运行中请求数。一次抓取只看到最新值。**Counter：** 只增不减的总量，例如已处理的提示 token 数。你在窗口上用速率读它。**Histogram：** 一组计数器，每个桶一个，统计有多少请求落在每个上限之下。你在窗口上用速率从中读百分位。

下面的快照是在服务器空闲时拍的，在所有默认实验之后。

```listing
title: gauges at idle
source: capture/out/metrics.txt
lang: text
note: Labels are cut. The full lines carry engine_type, model_name, and rank labels.
---
sglang:num_running_reqs{…} 0.0
sglang:num_queue_reqs{…} 0.0
sglang:gen_throughput{…} 0.0
sglang:token_usage{…} 0.0
sglang:cache_hit_rate{…} 0.9418739997090062
sglang:num_retracted_reqs{…} 0.0
```

五个 gauge 显示空闲服务器。有一个不是。缓存命中率仍持有最后一个跑过的 prefill batch 的值，也就是共享前缀基准。Gauge 回答“上一个间隔发生了什么”，而当什么都没发生时，有些 gauge 会衰减，有些保留上次的值。

## 缓存命中率，两种算法 {#s-the-metrics-endpoint-the-cache-hit-rate-two-ways}

调度器从一个日志间隔的 prefill token 计算该 gauge。值是命中 token 除以命中 token 加计算 token。下面的计数器从服务器启动起累加同样的两个量。

```listing
title: the counters behind the hit rate
source: capture/out/metrics.txt
lang: text
note: Labels are cut except mode. The HELP line is shown in full.
---
# HELP sglang:prefill_effective_tokens_total Effective prefill tokens with retracted-request re-counts excluded, updated on each log interval. mode: device_hit, host_hit, storage_hit, input. Windowed prefix cache hit rate = rate(sum of *_hit) / rate(sum of all modes); per-tier rate uses a single *_hit mode in the numerator.
sglang:prefill_effective_tokens_total{…mode="input"…} 104057.0
sglang:prefill_effective_tokens_total{…mode="device_hit"…} 182079.0
sglang:prefill_effective_tokens_total{…mode="host_hit"…} 0.0
sglang:prefill_effective_tokens_total{…mode="storage_hit"…} 0.0
```

HELP 文本说重新计数的 token 被排除。在代码里，这只对 `input` 模式为真。三种命中模式加上原始命中计数，所以回撤之后它们可以把同一批 token 计两次 {{code}}。我们的运行没有回撤，所以下面的数字是精确的。

从计数器看，整次运行的命中率是 182,079 除以 286,136，也就是 0.636。Gauge 说 0.942。两者都对，它们回答不同的问题。Gauge 描述运行末尾的共享前缀基准。计数器描述全部，包括什么都打不中的随机提示基准。

```figure
id: fig-5-2
kind: comparison
title: one server, two cache hit rates
claim: The gauge reported the last prefill interval at 0.942, while the counters over the whole run gave 0.636.
caption: Left, the gauge and the interval it remembers. Right, the two counters and their ratio. Green is cached tokens, plum is computed prefill tokens. From capture/out/metrics.txt after the default experiments.
```

计数器的 HELP 文本给出窗口速率公式。用 PromQL 读起来像这样：

```promql
sum(rate(sglang:prefill_effective_tokens_total{mode=~".*_hit"}[5m]))
  / sum(rate(sglang:prefill_effective_tokens_total[5m]))
```

带 `--disable-radix-cache` 的服务器在自己的快照里报告 gauge 为 0.0，所以当什么都打不中时 gauge 会到零。计数器给出的低值，就是[第 3.4 节](#s-prefix-friendly-prompts)教你要采取行动的信号。

## 对什么告警 {#s-the-metrics-endpoint-what-to-alert-on}

这六个序列覆盖了本手册里的失败。下面每一个名字都出现在我们的捕获里。

| 序列 | 类型 | 何时告警 | 原因 |
|---|---|---|---|
| `time_to_first_token_seconds` | histogram | 5 分钟上的 p99 高于你的目标 | 用户在别的事之前先等第一个 token |
| `inter_token_latency_seconds` | histogram | 5 分钟上的 p99 高于你的目标 | prefill batch 会卡住正在跑的 decode，如第 5.1 节里 1,948 ms 的缺口所示 |
| `num_queue_reqs` | gauge | 连续几分钟高于 0 | 服务器过了拐点，新请求只会等待 |
| `token_usage` | gauge | 连续几分钟接近 1.0 | KV 池满了，接下来就是回撤 |
| `num_retracted_requests_total` | counter | 速率大约每分钟超过 1 | 调度器丢掉请求并重新计算它们，见[第 2.3 节](#s-admission-and-retraction) |
| `prefill_effective_tokens_total` | counter | 部署后窗口命中率下降 | 提示改动打断了前缀，见第 3.4 节 |

直方图的 p99 来自它的桶：

```promql
histogram_quantile(0.99,
  sum by (le) (rate(sglang:time_to_first_token_seconds_bucket[5m])))
```

**我们测过**同一快照里的两个直方图。队列时间直方图在 266 个请求上总和 251.7 s，均值 0.95 s。流式 TTFT 直方图在 261 个请求上总和 612.7 s，均值 2.35 s。两个序列统计不同的请求，所以它们的比值是估计，不是测得的份额。它暗示排队是这台 Mac 上首 token 时间的很大一部分。要精确份额，比较同一批请求的队列时间与 TTFT。

```listing
title: queue time against first-token time
source: capture/out/metrics.txt
lang: text
note: Labels are cut except is_streaming.
---
sglang:queue_time_seconds_sum{…} 251.74525608913973
sglang:queue_time_seconds_count{…} 266.0
sglang:time_to_first_token_seconds_sum{…is_streaming="true"…} 612.7282021734864
sglang:time_to_first_token_seconds_count{…is_streaming="true"…} 261.0
```

## 我们的立场 {#s-the-metrics-endpoint-our-position}

用窗口上的直方图百分位与计数器速率，对延迟与活动告警。只用 gauge 对状态告警，且仅当条件持续时，例如 `num_queue_reqs` 高于 0 或 `token_usage` 接近 1.0 连续几分钟。单次 gauge 抓取描述的是最近几秒。当 gauge 与计数器不一致时，就像这里的缓存命中率，该信的是计数器。

在你基于它构建之前，先在 HELP 文本与代码里读每一个新度量。不是每个 gauge 都管用。

## 事故 {#s-the-metrics-endpoint-the-incidents}

**一个永不移动的 gauge。** v0.5.22 的调度器代码带着一条注释：`sglang:utilization` 自一次它链到 #22713 的回退以来一直为 0 {{code}}。我们的捕获同意：在让服务器忙了几分钟的运行之后，该 gauge 读数为 0.0。建在它上面的仪表盘面板会在故障期间显示空闲集群。

**堆积工作的健康探测。** [Issue #35884](https://github.com/sgl-project/sglang/issues/35884) 报告超时的 `/health` 调用没有在调度器里取消其请求 {{issue #35884}}。每次失败的探测都留下又一个孤儿请求，负载下这些探测加重了它们试图检测的负载。相关报告 [issue #22511](https://github.com/sgl-project/sglang/issues/22511) 显示大模型高负载下的消息 "health check failed" {{issue #22511}}。看队列与延迟序列，并把失败的探测当作又一种症状。

```takeaways
- 每台服务器都以 `--enable-metrics` 启动，因为该端点默认关闭。
- 对窗口上的直方图百分位与计数器速率告警，从不对单次 gauge 抓取告警。
- 从 `prefill_effective_tokens_total` 计算缓存命中率，而不是从 `cache_hit_rate` gauge。
- 对持续高于 0 的 `num_queue_reqs` 与接近 1.0 的 `token_usage` 呼叫值班。
- 在 v0.5.22 忽略 `sglang:utilization`，因为它一直为 0。
- 比较同一批请求的队列时间与 TTFT，看有多少延迟是在等待。
```

Sources: python/sglang/srt/arg_groups/fields/observability.py (enable_metrics), python/sglang/srt/managers/scheduler_components/metrics_reporter.py (cache hit rate and utilization), python/sglang/srt/observability/metrics_collector.py, all at v0.5.22 (baa9befa); capture/out/metrics.txt, capture/out/no-radix-cache-metrics.txt, capture/out/server-default.command.txt; issues #35884 and #22511.
