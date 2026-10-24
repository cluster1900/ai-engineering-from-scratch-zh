# 检查服务器是否健康

> 三个路由加一行日志，一分钟内就能告诉你服务器已经启动、加载了正确的模型，以及它能容纳多少。

服务器已经启动，你想在发送真实流量之前确认它能正常工作。读完本节后，你能检查健康路由、模型列表、指标和 KV cache 大小。

## 访问健康路由 {#s-check-that-the-server-is-healthy-ask-the-health-route}

运行这条命令：

```bash
curl -i http://localhost:8000/health
```

你会看到 `HTTP/1.1 200 OK` 和一个空的响应体。服务器日志里会显示同一个请求。

```listing
title: the first health check and model list, from a DGX Spark
source: capture/gpu/out-gb10/server-load-vllm.log
lang: text
note: Three lines from the end of startup.
---
INFO:     Application startup complete.
INFO:     127.0.0.1:35152 - "GET /health HTTP/1.1" 200 OK
INFO:     127.0.0.1:34616 - "GET /v1/models HTTP/1.1" 200 OK
```

引擎运行时，健康路由返回 200。它不生成 token，所以 200 并不能证明请求能完成。再发送一个短请求，就像[第一个请求](#s-install-vllm-and-serve-your-first-model)那样。

如果这个路由没有响应，说明服务器还在加载，或者已经停止。查看服务器日志的末尾。大模型的加载可能要好几分钟。

## 检查模型名 {#s-check-that-the-server-is-healthy-check-the-model-name}

运行这条命令：

```bash
curl http://localhost:8000/v1/models
```

回复中列出一个模型。它的 `id` 就是你的请求必须使用的名称。它的 `max_model_len` 是服务器接受的最长请求，单位是 token。

## 读取 KV cache 大小 {#s-check-that-the-server-is-healthy-read-the-kv-cache-size}

回到启动日志，找到以 `GPU KV cache size` 开头的那一行。在我们的 DGX Spark 上，它是：

```listing
title: the KV cache line, from a DGX Spark
source: capture/gpu/out-gb10/server-load-vllm.log
lang: text
note: One line from the startup log.
---
(EngineCore pid=143) INFO 10-21 10:59:46 [kv_cache_utils.py:2464] GPU KV cache size: 234,960 tokens, Maximum concurrency for 8,192 tokens per request: 28.68x
```

第一个数字是服务器能为所有用户合计保存的上下文 token 总数。第二个数字是能同时容纳多少个满最大长度的请求。较短的请求能容纳更多个。

如果第一个数字比你预期的小得多，说明有其他程序占用了 GPU 显存，或者显存比例设得太低。[显存页](#s-count-the-memory-before-you-pick-a-gpu)展示了如何在启动前预测这个数字。

## 读取指标 {#s-check-that-the-server-is-healthy-read-the-metrics}

运行这条命令：

```bash
curl -s http://localhost:8000/metrics | grep -E "^vllm:(num_requests_running|num_requests_waiting|kv_cache_usage_perc)\{"
```

你会看到三行。没有流量时，运行数和等待数都是 0，KV cache 使用率也是 0。在第二个终端里发送一个请求，再运行这条命令，就能看到计数变化。

三个指标能为大多数问题给出第一个答案：

| 指标 | 它告诉你什么 |
|---|---|
| `vllm:num_requests_running` | 引擎当前正在处理的请求 |
| `vllm:num_requests_waiting` | 因为 batch 或缓存已满而在队列中等待的请求 |
| `vllm:kv_cache_usage_perc` | KV cache 已使用的比例，从 0 到 1 |

等待数大于 0 且缓存使用率接近 1，说明缓存已满。[生产环境页](#s-watch-vllm-in-production)给出完整的告警列表。

```takeaways
- 用健康路由检查存活，用一个短请求检查就绪。
- 每次启动后都读 KV cache 大小那一行。
- 先关注等待数和缓存使用率。
```

Sources: vLLM documentation at v0.31.0 (docs/serving/online_serving/openai_compatible_server.md, docs/design/metrics.md), capture/gpu/out-gb10/server-load-vllm.log.
