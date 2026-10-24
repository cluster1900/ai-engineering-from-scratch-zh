# 指标

> 本页列出本手册用到的 vLLM 指标，以及使用每个指标的页面。

用本页查找某一节提到的指标。

vLLM 在 `/metrics` 以 Prometheus 格式导出指标。每个名称都以 `vllm:` 开头。

每个 counter 在 `/metrics` 上都带有 `_total` 后缀，与这些表格中列出的一致。

## 负载与内存 {#s-ref-metrics-load-and-memory}

| 指标 | 类型 | 统计什么 | 页面 |
|---|---|---|---|
| `vllm:num_requests_running` | gauge | 引擎当前正在处理的请求 | [健康检查](#s-check-that-the-server-is-healthy) |
| `vllm:num_requests_waiting` | gauge | 队列中的请求 | [健康检查](#s-check-that-the-server-is-healthy) |
| `vllm:kv_cache_usage_perc` | gauge | KV cache 的使用比例，从 0 到 1 | [健康检查](#s-check-that-the-server-is-healthy) |
| `vllm:num_preemptions_total` | counter | 为释放 block 而被停下的请求 | [故障排查](#s-troubleshoot-by-symptom) |

## 延迟 {#s-ref-metrics-latency}

| 指标 | 类型 | 统计什么 |
|---|---|---|
| `vllm:time_to_first_token_seconds` | histogram | 从请求到达到第一个 token 的时间 |
| `vllm:inter_token_latency_seconds` | histogram | 同一请求两个 token 之间的时间 |
| `vllm:request_time_per_output_token_seconds` | histogram | 一个请求每个输出 token 的平均时间 |
| `vllm:request_queue_time_seconds` | histogram | 请求在运行前等待的时间 |

## Cache 与 token {#s-ref-metrics-cache-and-tokens}

| 指标 | 类型 | 统计什么 | 页面 |
|---|---|---|---|
| `vllm:prefix_cache_queries_total` | counter | 在 prefix cache 中查找的 prompt token | [故障排查](#s-troubleshoot-by-symptom) |
| `vllm:prefix_cache_hits_total` | counter | 在 prefix cache 中找到的 prompt token | [故障排查](#s-troubleshoot-by-symptom) |
| `vllm:prompt_tokens_total` | counter | 已处理的 prompt token | |
| `vllm:generation_tokens_total` | counter | 已生成的输出 token | |

## 投机解码 {#s-ref-metrics-speculative-decoding}

| 指标 | 类型 | 统计什么 | 页面 |
|---|---|---|---|
| `vllm:spec_decode_num_draft_tokens_total` | counter | 提议器猜测的 token | [投机解码](#s-how-speculative-decoding-checks-drafts) |
| `vllm:spec_decode_num_accepted_tokens_total` | counter | 目标模型保留的猜测 token | [投机解码](#s-how-speculative-decoding-checks-drafts) |

## 我们的运行记录了什么 {#s-ref-metrics-what-our-runs-recorded}

我们的基准测试客户端为每个请求记录了 TTFT、TPOT、ITL 和吞吐。一个采样器每秒记录一次 GPU 时钟和温度。扫描期间我们没有抓取 `/metrics`。

Sources: vLLM documentation at v0.31.0 (docs/design/metrics.md), the vLLM source at v0.31.0 (vllm/v1/metrics/loggers.py).
