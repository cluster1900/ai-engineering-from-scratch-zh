# Load Testing LLM APIs — 为什么 k6 和 Locust 会说谎

> 传统 load testers 并不是为 streaming responses、可变 output lengths、Token 级 metrics 或 GPU 饱和而设计的。大多数团队会被两个陷阱咬住。GIL 陷阱：Locust 的 Token 级测量在 Python GIL 下运行 tokenization，在高并发时会与 request generation 竞争；tokenization backlog 随后会抬高报告的 inter-token latency —— 瓶颈在你的 client，而不是 server。prompt-uniformity 陷阱：循环中的相同 prompts 只测试 Token distribution 上的一个点；真实流量有可变长度和多样的 prefix matches。LLMPerf 用 `--mean-input-tokens` + `--stddev-input-tokens` 修复这一点。2026 年工具映射：LLM 专用工具（GenAI-Perf、LLMPerf、LLM-Locust、guidellm）用于 Token 级准确性；**k6 v2026.1.0** + **k6 Operator 1.0 GA（2025 年 9 月）** —— streaming-aware、Kubernetes-native，通过 TestRun/PrivateLoadZone CRDs 做 distributed 测试，最适合 CI/CD gates；Vegeta 用于 Go constant-rate saturation；Locust 2.43.3 只有配合 LLM-Locust extension 才适用于 streaming。负载模式：steady-state、ramp、spike（autoscaling test）、soak（memory leaks）。

**Type:** Build
**Languages:** Python (stdlib, toy realistic-prompt generator + latency collector)
**前置要求：** Phase 17 · 08 (Inference Metrics), Phase 17 · 03 (GPU Autoscaling)
**Time:** ~75 minutes

## 学习目标
- 解释让通用 load testers 在 LLM APIs 上说谎的两个 anti-patterns（GIL 陷阱、prompt-uniformity 陷阱）。
- 针对给定目的选择工具：LLMPerf（benchmark run）、k6 + streaming extension（CI gate）、guidellm（large-scale synthetic）、GenAI-Perf（NVIDIA reference）。
- 设计四种负载模式（steady、ramp、spike、soak），并说出每种模式捕捉的 failure mode。
- 使用 input tokens 的 mean + stddev 构建真实的 prompt distribution，而不是固定长度。

## 问题
你用 k6 测试了 LLM endpoint，设置 500 个 concurrent users。它扛住了。你上线了。生产环境中只有 200 个实际用户时，服务却崩了 —— P99 TTFT 爆炸，GPUs 被打满。

发生了两件事。第一，k6 发送了 500 个相同的 prompts —— 你的 request-coalescing 和 prefix caching 让它看起来像是在处理 500 个 concurrent decodes，但实际上只是在处理一个。第二，k6 不会以人眼体验的方式跟踪 streaming responses 上的 inter-token latency；它看到的是一个 HTTP connection，而不是 500 个以不同间隔到达的 Tokens。

LLMs 的 load testing 是一门独立学问。

## 概念
### GIL 陷阱（Locust）

Locust 使用 Python，并在 client-side 于 GIL 下运行 tokenization。高并发时，Tokenizer 会排在 request generation 后面。报告的 inter-token latency 包含 client-side tokenization backlog。你以为 server 慢；其实是 test harness 慢。

修复：LLM-Locust extension 将 tokenization 移到独立进程，或者使用 compiled-language harness（k6、使用 tokenizers.rs 的 LLMPerf）。

### prompt-uniformity 陷阱

所有已知 load testers 都允许你配置一个 prompt。在 10,000 次迭代的循环测试中，每次都会发送完全相同的 prompt。Server 每次看到相同的 prefix —— prefix cache hits 接近 100%，throughput 看起来很好。

修复：从 prompt distribution 中采样。LLMPerf 使用 `--mean-input-tokens 500 --stddev-input-tokens 150` —— 长度多样、内容多样。

### 四种负载模式

1. **Steady-state** —— 以 constant RPS 运行 30-60 分钟。捕捉：baseline performance regressions。
2. **Ramp** —— 在 15 分钟内将 RPS 从 0 线性提高到目标值。捕捉：capacity breakpoint、warm-up anomalies。
3. **Spike** —— 突然提升到 3-10x RPS，持续 2 分钟后恢复。捕捉：autoscaling latency、queue saturation、cold-start impact。
4. **Soak** —— steady-state 运行 4-8 小时。捕捉：memory leaks、connection-pool drift、observability overflow。

### 2026 工具映射

**LLMPerf**（Anyscale）—— Python，但 tokenization 由 Rust 支持。Mean/stddev prompts。Streaming-aware。性能运行的最佳默认选择。

**NVIDIA GenAI-Perf** —— NVIDIA 的 reference。使用 Triton client；metric 覆盖全面。注意它的 ITL 不包含 TTFT；LLMPerf 的包含。同一 server 上两个工具会产生不同的 TPOT。

**LLM-Locust**（TrueFoundry）—— 修复 GIL 陷阱的 Locust extension。熟悉的 Locust DSL + streaming metrics。

**guidellm** —— 大规模合成 benchmark。

**k6 v2026.1.0** + **k6 Operator 1.0 GA（2025 年 9 月）**：
- k6 本身（Go，compiled，无 GIL）新增了 streaming-aware metrics。
- k6 Operator 使用 TestRun / PrivateLoadZone CRDs 进行 Kubernetes-native distributed testing。
- 最适合 CI/CD gates 和 SLA testing。

**Vegeta** —— Go，比 k6 更简单。Constant-rate HTTP saturation。不具备 LLM-aware 能力，但适合 gateway / rate-limit testing。

**Locust 2.43.3 stock** —— 对 LLM 有 GIL 陷阱。只能配合 LLM-Locust extension 使用。

### CI 中的 SLA gate

在 PR 上运行 k6，并使用：

- 在 baseline RPS 下各 30-50 次 iterations。
- Gate：P50/P95 TTFT、5xx < 5%、TPOT 低于阈值。
- 违规时让 build 失败。

### 真实的 prompt distribution

从真实流量样本构建（如果有），或者从公开 distributions 构建（例如用于 chat 的 ShareGPT prompts、用于 code 的 HumanEval）。将 mean + stddev 输入 LLMPerf。无论如何都要避免 loop-with-one-prompt。

### 你应该记住的数字

- k6 Operator 1.0 GA：2025 年 9 月。
- k6 v2026.1.0：streaming-aware metrics。
- 典型 LLMPerf run：在 concurrency X 下 100-1000 requests。
- 典型 CI gate：每个 PR 30-50 iterations。
- 四种模式：steady、ramp、spike、soak。

## 使用它
`code/main.py` 模拟带有真实 prompt distribution 的 load test，测量 effective TPOT，并演示 uniform-prompt 陷阱。

## 交付它
本课生成 `outputs/skill-load-test-plan.md`。给定 workload 和 SLA 后，选择工具并设计四种负载模式。

## 练习
1. 运行 `code/main.py`。比较 uniform 和 realistic distribution —— 差距在哪里？
2. 为 CI gate 编写 k6 script：在 100 concurrent 下 TTFT P95 < 800 ms，runtime 5 分钟。
3. 你的 soak test 显示 memory 每小时增长 50 MB。说出三个原因，以及用于区分它们的 instrumentation。
4. Spike test 从 10 RPS 到 100 RPS。如果 Karpenter + vLLM production-stack 已就位（Phase 17 · 03 + 18），预期 recovery time 是多少？
5. GenAI-Perf 在同一 server 上报告 TPOT=6ms；LLMPerf 报告 TPOT=11ms。解释原因。

## 关键术语
| Term | 人们的说法 | 它实际意味着什么 |
|------|----------------|------------------------|
| LLMPerf | "LLM harness" | Anyscale benchmark tool，streaming-aware |
| GenAI-Perf | "NVIDIA tool" | NVIDIA reference harness |
| LLM-Locust | "Locust for LLMs" | 修复 GIL 陷阱的 Locust extension |
| guidellm | "synthetic benchmark" | Large-scale synthetic tool |
| k6 Operator | "K8s k6" | 基于 CRD 的 distributed k6 |
| GIL trap | "Python client overhead" | Tokenization backlog 抬高报告的 latency |
| Prompt-uniformity trap | "single-prompt lie" | 使用相同 prompt 循环命中 cache，抬高 throughput |
| Steady-state | "constant load" | 持续 N 分钟的平坦 RPS |
| Ramp | "linear up" | 在 duration 内从 0 到目标值 |
| Spike | "burst test" | 突然倍增，然后恢复 |
| Soak | "long test" | 用数小时检测 leak |

## 延伸阅读
- [TianPan — Load Testing LLM Applications](https://tianpan.co/blog/2026-03-19-load-testing-llm-applications)
- [PremAI — Load Testing LLMs 2026](https://blog.premai.io/load-testing-llms-tools-metrics-realistic-traffic-simulation-2026/)
- [NVIDIA NIM — Introduction to LLM Inference Benchmarking](https://docs.nvidia.com/nim/large-language-models/1.0.0/benchmarking.html)
- [TrueFoundry — LLM-Locust](https://www.truefoundry.com/blog/llm-locust-a-tool-for-benchmarking-llm-performance)
- [LLMPerf](https://github.com/ray-project/llmperf)
- [k6 Operator](https://github.com/grafana/k6-operator)
