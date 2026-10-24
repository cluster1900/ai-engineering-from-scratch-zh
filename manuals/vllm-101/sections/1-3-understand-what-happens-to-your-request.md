# 理解你的请求经历了什么

> 一个请求先用一个较短的阶段读取 prompt，再用一个较长的阶段写出答案，四个数字衡量这两个阶段。

你发出一个请求，答案返回了，一开始很慢，然后一个 token 接一个 token 地出现。读完本节后，你能说出请求的两个阶段，以及本手册中每个 benchmark 都会报告的四个数字。

**我们的结果：** 在我们的 DGX Spark 上，64 个用户得到的总输出是 1 个用户的八倍。每个用户等待每个 token 的时间大约长了 7.5 倍。

## 两个阶段 {#s-understand-what-happens-to-your-request-two-phases}

**Prefill：** 一次性读取整个 prompt，并把它的 key 和 value 写入 KV cache 的步骤。一个 prefill 步骤处理很多 prompt token，所以 GPU 忙于计算。

**Decode：** 写出答案的步骤，每个请求每步一个 token。每一步都要读取全部模型权重，为每个运行中的请求生成一个 token。GPU 等待显存的时间多于等待计算的时间。

vLLM 不会把这两个阶段作为分开的环节来运行。每个调度步骤只有一个 token 预算。运行中的请求先拿到它们下一个 decode token。然后调度器把剩余预算按块分给 prompt token。一个长 prompt 可能要花好几步。[第 8 部分](#s-why-one-token-budget-replaces-a-prefill-phase)解释 vLLM 为什么这样工作。

```figure
id: fig-1-3
kind: flow
title: one request through three processes
claim: A request crosses three processes: the API server tokenizes it, the engine core schedules it, and a GPU worker runs the model.
caption: Solid arrows carry the request forward, dashed arrows carry token ids back, and the dotted arrow is the text stream. From the vLLM source at v0.31.0.
```

## 四个数字 {#s-understand-what-happens-to-your-request-four-numbers}

| 数字 | 它衡量什么 | 谁能感受到 |
|---|---|---|
| TTFT，首 token 时间 | 从发出请求到第一个 token 的等待，主要是排队时间和 prefill | 等待答案开始出现的用户 |
| TPOT，每个输出 token 的时间 | 第一个 token 之后，相邻 token 之间的平均时间 | 阅读长答案的用户 |
| ITL，token 间延迟 | 每两个 token 之间的间隔，它的第 99 百分位反映最严重的卡顿 | 看到流式输出时停时续的用户 |
| 吞吐量 | 所有用户合计每秒输出的 token 数 | 为 GPU 付费的人 |

## 同一台服务器，两种负载 {#s-understand-what-happens-to-your-request-one-server-two-loads}

随着用户增加，这些数字此消彼长。下面是我们的 DGX Spark 用 vLLM 0.31.0 部署 Qwen3-30B-A3B，从 1 个用户到同时 64 个用户的结果。

| 同时在线用户 | TTFT 中位数 | TPOT 中位数 | 每秒输出 token 数 |
|---|---|---|---|
| 1 | 257 ms | 32.3 ms | 29.5 |
| 64 | 965 ms | 243.8 ms | 239.3 |

有 64 个用户时，服务器每秒写出的 token 大约是原来的八倍。每个用户等待第一个 token 的时间长了将近四倍，每个 token 的耗时长了七倍多。繁忙的服务器每个 token 更便宜，但对每个用户更慢。

本手册中的每个调优页都会改变这四个数字之一。每一页都会说明它改善哪个数字，代价是哪个数字。

```figure
id: fig-1-3b
kind: chart
title: one server, two loads
claim: On our DGX Spark, 64 users got eight times the total output of one user, and each user waited about 7.5 times longer for every token.
caption: Read the left chart for the server and the right chart for one user. Bands span the lowest and highest of three runs. From capture/gpu/summary/gb10.json.
```

```takeaways
- 同时报告 TTFT、TPOT、P99 ITL 和吞吐量。
- 调优之前，先选定你的用户能感受到的那个数字。
```

Sources: vLLM documentation at v0.31.0 (docs/design/metrics.md, docs/configuration/optimization.md), capture/gpu/summary/gb10.json (load.vllm), capture/gpu/out-gb10/server-load-vllm.log.
