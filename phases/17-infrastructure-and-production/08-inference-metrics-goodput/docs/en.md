# Inference Metrics — TTFT、TPOT、ITL、Goodput、P99

> 四个指标决定一次 inference deployment 是否正常工作。TTFT 是 prefill 加 queue 加 network。TPOT（等价于 ITL）是每个 Token 的 memory-bound decode 成本。端到端 latency 是 TTFT 加上 TPOT 乘以输出长度。Throughput 是整个 fleet 聚合后的每秒 Token 数。但对产品真正重要的是 goodput：同时满足每个 SLO 的请求比例。在低 goodput 下的高 throughput 意味着你正在处理无法按时到达用户的 Token。2026 年 TRT-LLM 上 Llama-3.1-8B-Instruct 的参考数字：mean TTFT 162 ms，mean TPOT 7.33 ms，mean E2E 1,093 ms。始终报告 P50、P90、P99，绝不要只报告 mean。并且注意 measurement trap：GenAI-Perf 在 ITL 计算中排除 TTFT，LLMPerf 则包含它；两个工具会在同一次运行上给出不同的 TPOT。

**Type:** 学习
**Languages:** Python（stdlib，玩具版 percentile calculator 和 goodput reporter）
**Prerequisites:** Phase 17 · 04（vLLM Serving Internals）
**Time:** 约 60 分钟

## 学习目标
- 精确定义 TTFT、TPOT、ITL、E2E、throughput 和 goodput，并指出每个指标测量的组件。
- 解释为什么 mean 对 LLM serving 来说是错误的统计量，以及如何读取 P50/P90/P99。
- 构造一个 SLO multi-constraint（例如 TTFT<500 ms AND TPOT<15 ms AND E2E<2 s），并据此计算 goodput。
- 说出两个在同一次运行上对 TPOT 判断不一致的 benchmark tools，并解释原因。

## 问题
“我们的 throughput 是每秒 15,000 Token。”那又怎样？如果 40% 的请求端到端超过 2 秒，用户已经放弃了 session。仅凭 throughput 并不能告诉你产品是否正常工作。

Inference 有多个 latency 轴，每个轴的失败方式都不同。Prefill 是 compute-bound，并随 prompt length 扩展。Decode 是 memory-bound，并随 batch size 扩展。Queuing delay 是 operational problem。Network 是 physical-distance problem。你需要为每一项使用不同的指标，你需要 percentiles，并且你需要一个单一的 composite 来说明“用户是否得到了预期结果”，这就是 goodput。

## 概念
### TTFT — time to first token

`TTFT = queue_time + network_request + prefill_time`

当 prompts 很长时，prefill 占主导。在 H100 上运行的 Llama-3.3-70B FP8 中，一个 32k prompt 需要约 800 ms 的纯 prefill。Queue time 是负载下的 scheduler 行为。Network request 是包含 TLS 的 wire time。TTFT 是用户在任何内容 stream 返回之前看到的 latency。

### TPOT / ITL — inter-token latency

同一个量有很多名称。`TPOT`（time per output token）、`ITL`（inter-token latency）、`decode latency per token` 都是同一个东西。它是首个 Token 之后，连续 streamed Token 之间的时间。

`TPOT = (decode_forward_time + scheduler_overhead) / tokens_produced`

在同一个带 chunked prefill 的 Llama-3.3-70B H100 stack 上，TPOT mean 约为 7 ms。没有 chunked prefill 时，当相邻 sequence 正在执行长 prefill，TPOT 可能 spike 到 50 ms。关注 P99，而不是 mean。

### E2E latency

`E2E = TTFT + TPOT * output_tokens + network_response`

对于长输出（>500 Token），E2E 由 TPOT 主导。对于带长 prompts 的短输出，E2E 由 TTFT 主导。报告按输出长度分组的 E2E。

### Throughput

`throughput = total_output_tokens / elapsed_time`

聚合指标。告诉你 fleet efficiency。不能告诉你单个请求的健康状况。

### Goodput — 你真正关心的指标

`goodput = fraction of requests meeting (TTFT <= a) AND (TPOT <= b) AND (E2E <= c)`

SLO 是一个 multi-constraint。只有每个 constraint 都满足时，一个请求才是“good”。Goodput 就是这个占比。在 60% goodput 下的高 throughput 是失败。目标是在较低 throughput 下达到 99% goodput。

到 2026 年，goodput 已经成为 MLPerf Inference v6.0 submissions 以及 AI platform providers 内部 SLA tracking 中使用的指标。

### 为什么 mean 是错误的统计量

LLM latency distributions 是右偏的。一个 decode batch 中，如果有一个长 prefill 的相邻请求，可能有 500 个 Token 的 TPOT 约为 7 ms，而有 20 个 Token 的 TPOT 约为 60 ms。Mean TPOT 是 9 ms。P99 TPOT 是 65 ms。用户会经常撞到 P99，这就是他们离开的原因。

始终报告三元组（P50、P90、P99）。对于用户体验，P99 才是你要优化的指标。

### Reference numbers — TRT-LLM 上的 Llama-3.1-8B-Instruct，2026

- mean TTFT: 162 ms
- mean TPOT: 7.33 ms
- mean E2E: 1,093 ms
- P99 TPOT: 取决于 chunked-prefill configuration，通常在 10-25 ms 之间变化。

这些是 NVIDIA 发布的参考点。它们会随 model size（70B 会显示 3-5x）、hardware（H100 vs B200 约 3x）和 load 而变化。

### The measurement trap

2026 年最常用的两个 benchmark tools 会在同一次运行上对 TPOT 给出不同结果：

- **NVIDIA GenAI-Perf**：在 ITL 计算中排除 TTFT。ITL 从 Token 2 开始。
- **LLMPerf**：包含 TTFT。ITL 从 Token 1 开始。

对于一个 TTFT 为 500 ms、100 个 output tokens、总 decode 为 700 ms 的请求，GenAI-Perf 报告 `ITL = 700/99 = 7.07 ms`，LLMPerf 报告 `ITL = 1200/100 = 12.00 ms`。工具选择会改变数字。

始终说明使用了哪个工具。始终发布定义。

### Constructing an SLO

2026 年面向消费者的 70B chat model 的合理 SLO：

- TTFT P99 <= 800 ms。
- TPOT P99 <= 25 ms。
- 对 <300-Token 输出，E2E P99 <= 3 s。
- Goodput target >= 99%。

Enterprise SLOs 会收紧 TTFT（200-400 ms）并放宽 E2E。关键是把它们写下来，测量三者，并把 goodput 作为单个 composite 进行跟踪。

### How to measure

- 运行真实流量或逼真的 synthetic（LLMPerf 使用 `--mean-input-tokens 800 --stddev-input-tokens 300 --mean-output-tokens 150`）。
- benchmark run 的目标是 2x peak concurrency。
- 运行 30-50 次 iteration，对合并样本取 percentiles。
- 发布时包含 tool name、tool version、model、hardware、concurrency、prompt distribution。


```figure
throughput-latency
```

## 使用它
`code/main.py` 是一个玩具版 goodput calculator。生成 synthetic latency distribution，应用 SLO，并计算 goodput。还会展示同一 trace 上 GenAI-Perf 与 LLMPerf 的 TPOT 差异。

## 交付它
本课会生成 `outputs/skill-slo-goodput-gate.md`。给定一个 workload 和 SLO，它会生成一份可用于 CI/CD 的 benchmark recipe，用 goodput 而不是 throughput 来 gate deploys。

## 练习
1. 运行 `code/main.py`。生成带有 1% tail spike 的 distribution。当你把 P99 TPOT 从 30 ms 收紧到 15 ms 时，goodput 如何变化？
2. 某 vendor 引用“Llama 3.3 70B H100 上 15,000 tok/s”。在相信它之前，应提出哪三个问题？
3. 为什么 chunked prefill 能保护 P99 TPOT，但不能保护 mean TPOT？
4. 为 voice assistant 构造一个 consumer SLO（first token 是被听到，而不是被读到）。哪个指标对用户最可见？
5. 阅读 LLMPerf README 和 GenAI-Perf docs。找出另外三个这些工具定义不一致的指标。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| TTFT | “time to first token” | Queue + network + prefill；在长 prompts 下由 prefill 主导 |
| TPOT | “time per output token” | 首个 Token 之后每个 Token 的 memory-bound decode 成本 |
| ITL | “inter-token latency” | 在大多数工具中与 TPOT 相同（不是全部，见 GenAI-Perf） |
| E2E | “end to end” | TTFT + TPOT * output_len；再加上 response-side network |
| Throughput | “tok/s” | Fleet efficiency；没有 latency percentiles 时没有意义 |
| Goodput | “SLO-met rate” | 同时满足每个 SLO constraint 的请求比例 |
| P99 | “tail” | 百分之一最差情形 latency；用户体验指标 |
| SLO multi-constraint | “the joint” | 三个 latency bounds 的 AND；只要违反任意一个，请求就失败 |
| GenAI-Perf vs LLMPerf | “the tool trap” | 工具对 ITL 是否包含 TTFT 的定义不一致 |

## 延伸阅读
- [NVIDIA NIM — LLM Benchmarking Metrics](https://docs.nvidia.com/nim/benchmarking/llm/latest/metrics.html) — TTFT、ITL、TPOT 的权威定义。
- [Anyscale — LLM Serving Benchmarking Metrics](https://docs.anyscale.com/llm/serving/benchmarking/metrics) — 替代定义与 measurement recipe。
- [BentoML — LLM Inference Metrics](https://bentoml.com/llm/inference-optimization/llm-inference-metrics) — 真实 deployments 上的 applied measurement。
- [LLMPerf](https://github.com/ray-project/llmperf) — 基于 Ray 的 open-source benchmark。
- [GenAI-Perf](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/client/src/c++/perf_analyzer/genai-perf/README.html) — NVIDIA 的 benchmark tool。
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/) — industry-accepted、基于 goodput 的 benchmark。
