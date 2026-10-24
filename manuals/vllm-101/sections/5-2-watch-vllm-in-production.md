# 在生产环境中监控 vLLM

> 五个指标能在用户报告之前暴露大多数问题。

你的服务器已经上线，你必须知道它什么时候出问题。读完本节后，你能选出要设置告警的指标。

## 抓取 endpoint {#s-watch-vllm-in-production-scrape-the-endpoint}

vLLM 在 API 所在的同一端口的 `/metrics` 导出 Prometheus 指标，不需要任何参数。在你的 Prometheus 配置的 `scrape_configs` 列表里加一个这样的 job，并把 target 改成你的服务器：

```yaml
scrape_configs:
  - job_name: vllm
    scrape_interval: 15s
    metrics_path: /metrics
    static_configs:
      - targets: ["vllm-host:8000"]
```

我们没有让 Prometheus 抓取我们的服务器。

## 对五个指标设置告警 {#s-watch-vllm-in-production-alert-on-five-metrics}

| 指标 | 何时告警 | 通常意味着什么 |
|---|---|---|
| `vllm:num_requests_waiting` | 超过 0 并持续一分钟以上 | 服务器无法接纳所有流量 |
| `vllm:kv_cache_usage_perc` | 超过 0.95 并持续一分钟以上 | 池满了，新请求只能等待或触发抢占 |
| `vllm:num_preemptions_total` | 速率大于 0 | 请求被停下并重新计算 |
| `vllm:time_to_first_token_seconds` | 第 99 百分位超过你的目标 | 用户在等第一个词 |
| `vllm:inter_token_latency_seconds` | 第 99 百分位超过你的目标 | 流式输出的 token 之间有长间隔 |

根据你的产品来设定延迟目标，而不是照搬仪表盘的默认值。我们的扫描用的是首 token 1,000 ms、每个输出 token 100 ms。

两个延迟指标是直方图，所以第 99 百分位要用 PromQL 查询得到。当过去五分钟首 token 时间的 P99 超过 1 秒时，下面这个表达式就大于 0：

```text
histogram_quantile(0.99, sum by (le) (rate(vllm:time_to_first_token_seconds_bucket[5m]))) > 1
```

对 token 间隔，用同样的写法，换成 `vllm:inter_token_latency_seconds_bucket`，目标设为 0.1。

## 把它们放在一起看 {#s-watch-vllm-in-production-read-them-together}

单看一个指标会误导你。要成对地看：

- **等待数大于 0，而 cache 使用率低于 0.9。** 池还有空间，但 batch 满了。是 `--max-num-seqs` 或 `--max-num-batched-tokens` 限制了接纳。
- **等待数大于 0，而 cache 使用率接近 1。** 是池限制了接纳。加内存，或在这块 GPU 上服务更少的用户。
- **首 token 很慢，却没有等待的请求。** prompt 很长，或者 API 服务器里的 tokenizer 很慢。把排队时间 `vllm:request_queue_time_seconds` 和首 token 时间比较一下。
- **长回答伴随抢占。** 运行中的请求不断增长，直到池用完。降低并发，或使用 FP8 KV cache。

## 关注 cache 和投机解码 {#s-watch-vllm-in-production-watch-the-cache-and-speculation}

另外两对计数器告诉你某个功能是否有收益：

- prefix cache 的命中数除以查询数就是命中率。如果你的应用发布新版本后命中率下降，通常意味着 prompt 开头有了改动。
- 使用投机解码时，被接受的 token 数除以 draft token 数就是接受率。接受率下降说明提议器在当前流量上猜得不好。

## 也要关注 GPU {#s-watch-vllm-in-production-watch-the-gpu-too}

vLLM 的指标不显示 GPU 时钟或温度。过热或共享的 GPU 会跑得更慢，所有延迟都会上升，而 vLLM 指标没有任何变化。在 vLLM 指标旁边导出 `nvidia-smi` 数据，或使用 NVIDIA DCGM exporter。

这一点没有在我们的硬件上测量。我们的扫描没有抓取 `/metrics`。我们那次小池运行让请求在队列里等待，但我们没有保存它的日志或指标。[聊天页](#s-tune-chat-for-many-users)展示了那次运行。

```takeaways
- 对等待数、cache 使用率、抢占，以及 TTFT 和 ITL 的第 99 百分位设置告警。
- 把等待数和 cache 使用率放在一起看，找出限制所在。
- 在 vLLM 指标旁边导出 GPU 时钟和温度。
```

Sources: vLLM documentation at v0.31.0 (docs/design/metrics.md), the vLLM source at v0.31.0 (vllm/v1/metrics/loggers.py), capture/gpu/summary/l4.json (slo).
