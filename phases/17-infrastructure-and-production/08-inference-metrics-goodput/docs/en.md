# Inference 指标——TTFT、TPOT、ITL、Goodput、P99

> 四项指标决定一个 Inference 部署是否正常工作。TTFT 是 prefill、排队和网络耗时之和。TPOT（等价于 ITL）是 memory-bound decode 每个 Token 的成本。端到端延迟等于 TTFT 加上 TPOT 乘以输出长度。吞吐量是整个集群每秒生成的 Token 总数。但对产品真正重要的是 goodput——同时满足所有 SLO 的请求比例。高吞吐量却只有低 goodput，意味着你正在处理无法及时送达用户的 Token。2026 年通过 TRT-LLM 运行 Llama-3.1-8B-Instruct 的参考数据为：平均 TTFT 162 ms、平均 TPOT 7.33 ms、平均 E2E 1,093 ms。始终报告 P50、P90、P99——绝不能只报告平均值。还要注意测量陷阱：GenAI-Perf 在计算 ITL 时排除 TTFT，而 LLMPerf 将其包括在内；两个 Tool 会对同一次运行给出不同的 TPOT。

**Type:** Learn
**Languages:** Python（stdlib，玩具版 percentile 计算器与 goodput 报告器）
**Prerequisites:** Phase 17 · 04（Serving Engine 内部机制）
**Time:** ~60 分钟

## 学习目标

- 准确定义 TTFT、TPOT、ITL、E2E、throughput 和 goodput，并说出每项指标测量的组件。
- 解释为什么平均值不适合用于 LLM serving，以及如何解读 P50/P90/P99。
- 构建一个包含多项约束的 SLO（例如 TTFT<500 ms AND TPOT<15 ms AND E2E<2 s），并据此计算 goodput。
- 说出两个会对同一次运行给出不同 TPOT 的 benchmark Tool，并解释原因。

## 问题

“我们的吞吐量是每秒 15,000 个 Token。”那又怎样？如果 40% 的请求端到端耗时超过 2 秒，用户就会放弃会话。仅凭吞吐量无法判断产品是否正常工作。

Inference 延迟包含多个维度，而每个维度的故障方式都不同。Prefill 是 compute-bound 的，并随 Prompt 长度增长。Decode 是 memory-bound 的，并随 Batch size 变化。排队延迟是运营问题。网络延迟是物理距离问题。你需要为每个维度设置独立指标，需要查看 percentile，还需要一个综合指标来回答“用户是否得到了预期结果”——这个指标就是 goodput。

## 概念

### TTFT——首个 Token 时间

`TTFT = queue_time + network_request + prefill_time`

当 Prompt 较长时，prefill 占据主要耗时。在 H100 上以 FP8 运行 Llama-3.3-70B 时，32k Prompt 的纯 prefill 耗时约为 800 ms。Queue time 反映 scheduler 在负载下的行为。Network request 是包括 TLS 在内的线路传输时间。TTFT 是任何内容开始流式返回前用户感知到的延迟。

### TPOT / ITL——Token 间延迟

同一个量有很多名称。`TPOT`（time per output token）、`ITL`（inter-token latency）、`decode latency per token`——它们表示相同的概念，即首个 Token 之后，连续两个流式 Token 之间的时间。

`TPOT = (decode_forward_time + scheduler_overhead) / tokens_produced`

在同一个使用 chunked prefill 的 Llama-3.3-70B H100 技术栈上，TPOT 平均约为 7 ms。如果不使用 chunked prefill，当相邻 sequence 正在执行长 prefill 时，TPOT 可能跃升至 50 ms。应关注 P99，而不是平均值。

### E2E 延迟

`E2E = TTFT + TPOT * output_tokens + network_response`

对于长输出（>500 个 Token），E2E 主要由 TPOT 决定。对于 Prompt 很长但输出较短的情况，E2E 主要由 TTFT 决定。报告 E2E 时，应按输出长度划分条件。

### Throughput

`throughput = total_output_tokens / elapsed_time`

这是一个聚合指标。它反映集群效率，却无法体现单个请求的健康状况。

### Goodput——你真正应该关注的指标

`goodput = fraction of requests meeting (TTFT <= a) AND (TPOT <= b) AND (E2E <= c)`

SLO 是一组多重约束。只有在所有约束都满足时，一个请求才算“良好”。Goodput 就是这类请求所占的比例。吞吐量很高但 goodput 只有 60%，依然意味着失败。目标应当是以较低吞吐量换取 99% goodput。

2026 年，goodput 是 MLPerf Inference v6.0 提交结果和 AI 平台提供商内部 SLA 跟踪所采用的指标。

### 为什么平均值是错误的统计量

LLM 延迟分布呈右偏。一个 decode Batch 可能与某个执行长 prefill 的 sequence 相邻，结果是 500 个 Token 的 TPOT 约为 7 ms，另有 20 个 Token 的 TPOT 约为 60 ms。平均 TPOT 是 9 ms，但 P99 TPOT 是 65 ms。用户会经常遭遇 P99——这就是他们离开的原因。

始终报告三项数据（P50、P90、P99）。对于用户体验，P99 才是你要优化的指标。

### 参考数据——TRT-LLM 上的 Llama-3.1-8B-Instruct，2026 年

- 平均 TTFT：162 ms
- 平均 TPOT：7.33 ms
- 平均 E2E：1,093 ms
- P99 TPOT：根据 chunked-prefill 配置不同，在 10-25 ms 之间变化。

这些是 NVIDIA 发布的参考点。它们会随 Model 大小（70B 会增加 3-5 倍）、硬件（H100 与 B200 相差约 3 倍）和负载而变化。

### 测量陷阱

2026 年使用最广泛的两个 benchmark Tool，会对同一次运行给出不同的 TPOT：

- **NVIDIA GenAI-Perf**：计算 ITL 时排除 TTFT。ITL 从第 2 个 Token 开始。
- **LLMPerf**：包括 TTFT。ITL 从第 1 个 Token 开始。

对于一个 TTFT 为 500 ms、总 decode 时间为 700 ms、输出 100 个 Token 的请求，GenAI-Perf 报告 `ITL = 700/99 = 7.07 ms`，LLMPerf 则报告 `ITL = 1200/100 = 12.00 ms`。Tool 的选择会改变结果。

始终说明使用了哪个 Tool。始终公布具体定义。

### 构建 SLO

对于 2026 年面向消费者的 70B chat Model，一组合理的 SLO 是：

- TTFT P99 <= 800 ms。
- TPOT P99 <= 25 ms。
- 对于少于 300 个 Token 的输出，E2E P99 <= 3 s。
- Goodput 目标 >= 99%。

企业 SLO 通常会收紧 TTFT（200-400 ms）并放宽 E2E。关键是把它们明确写下来，测量所有三项指标，并将 goodput 作为单一综合指标进行跟踪。

### 如何测量

- 使用真实流量或贴近现实的合成流量（LLMPerf 搭配 `--mean-input-tokens 800 --stddev-input-tokens 300 --mean-output-tokens 150`）。
- Benchmark 运行时，以峰值 concurrency 的 2 倍为目标。
- 运行 30-50 次迭代，对合并后的样本计算 percentile。
- 发布结果时注明 Tool 名称、Tool 版本、Model、硬件、concurrency 和 Prompt 分布。

```figure
throughput-latency
```

## 使用它

`code/main.py` 是一个玩具版 goodput 计算器。生成合成延迟分布，应用一组 SLO，然后计算 goodput。它还会展示同一条 trace 上 GenAI-Perf 与 LLMPerf 的 TPOT 差异。

## 交付它

本课会生成 `outputs/skill-slo-goodput-gate.md`。给定工作负载和 SLO，它会生成一套可直接用于 CI/CD 的 benchmark 方案，根据 goodput 而非吞吐量决定是否允许部署。

## 练习

1. 运行 `code/main.py`。生成一个包含 1% 尾部尖峰的分布。将 P99 TPOT 从 30 ms 收紧至 15 ms 时，goodput 会如何变化？
2. 某供应商声称“Llama 3.3 70B H100 可达 15,000 tok/s”。在相信该结果之前，应提出哪三个问题？
3. 为什么 chunked prefill 能够保护 P99 TPOT，却不能保护平均 TPOT？
4. 为语音助手构建一组消费者 SLO（首个 Token 是听到的，而不是读到的）。哪项指标对用户最明显？
5. 阅读 LLMPerf README 和 GenAI-Perf 文档。找出三个这两个 Tool 定义不一致的其他指标。

## 关键术语

| 术语 | 人们怎么说 | 它实际表示什么 |
|------|----------------|------------------------|
| TTFT | “time to first token” | Queue + network + prefill；Prompt 较长时主要由 prefill 决定 |
| TPOT | “time per output token” | 首个 Token 之后，每个 Token 的 memory-bound decode 成本 |
| ITL | “inter-token latency” | 在多数 Tool 中与 TPOT 相同（并非全部——参见 GenAI-Perf） |
| E2E | “end to end” | TTFT + TPOT * output_len；再加上响应侧网络耗时 |
| Throughput | “tok/s” | 集群效率；缺少延迟 percentile 时没有意义 |
| Goodput | “SLO-met rate” | 同时满足所有 SLO 约束的请求比例 |
| P99 | “tail” | 每 100 个请求中最差情况的延迟；用户体验指标 |
| SLO multi-constraint | “the joint” | 三项延迟上限之间的 AND；违反任意一项，请求即失败 |
| GenAI-Perf vs LLMPerf | “the tool trap” | 两个 Tool 对 ITL 是否包括 TTFT 的定义不一致 |

## 延伸阅读

- [NVIDIA NIM——LLM Benchmarking 指标](https://docs.nvidia.com/nim/benchmarking/llm/latest/metrics.html)——TTFT、ITL、TPOT 的规范定义。
- [Anyscale——LLM Serving Benchmarking 指标](https://docs.anyscale.com/llm/serving/benchmarking/metrics)——其他定义与测量方案。
- [BentoML——LLM Inference 指标](https://bentoml.com/llm/inference-optimization/llm-inference-metrics)——在真实部署中应用测量。
- [LLMPerf](https://github.com/ray-project/llmperf)——基于 Ray 的开源 benchmark。
- [GenAI-Perf](https://github.com/triton-inference-server/perf_analyzer/blob/main/genai-perf/README.md)——NVIDIA 的 benchmark Tool。
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/)——行业认可的、基于 goodput 的 benchmark。
