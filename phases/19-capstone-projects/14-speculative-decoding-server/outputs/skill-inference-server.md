---
name: inference-server
description: 交付一个采用 EAGLE-3 或 P-EAGLE draft、K8s autoscaling，并包含完整 throughput/latency/cost report 的 speculative-decoding inference server。
version: 1.0.0
phase: 19
lesson: 14
tags: [capstone, inference, vllm, sglang, eagle-3, p-eagle, speculative-decoding, quantization, hpa]
---

给定两个开放 target models（Llama 3.3 70B 和 Qwen3-Coder-30B MoE 或 GPT-OSS-120B），交付一个生产级 serving stack，包含 speculative decoding、quantization 和 Kubernetes autoscaling。发布实测 speedups 和 tail-latency 数据。

构建计划：

1. 使用 vLLM 0.7（或 SGLang 0.4）和 FP8 Marlin quantization 部署 target models。
2. 从 Red Hat Speculators 加载对齐的 EAGLE-3 draft（或通过 SpecForge 训练一个）。
3. Baseline 数据：在不使用 speculation 的情况下，batch 1/8/32 的 tokens/s 和 p50/p99 latency。
4. 启用 EAGLE-3。重新运行相同 benchmark。报告 speedup、acceptance rate、p99 tail-latency delta。
5. 启用 P-EAGLE parallel speculation；报告更深的 trees 何时带来收益、何时造成损害的拐点。
6. 跨 distributions 运行 benchmarks：ShareGPT、HumanEval、domain data。发布 acceptance-rate drift。
7. 在第二个 target model（MoE）上重复；识别 draft acceptance 对 routing-noise 的敏感性。
8. 在 Kubernetes 上部署，并让 HPA 跟踪 `queue_wait_ms`。演示 load 增至三倍时的 scale-out。
9. 在 matched evals 上比较 $/1M tokens 与 Anthropic Claude Sonnet 4.7 和 OpenAI GPT-5.4。

评估量表：

| Weight | Criterion | Measurement |
|:-:|---|---|
| 25 | 相比 baseline 的实测 speedup | 两个 models 上 matched quality 下 throughput 达到 2.5x+ |
| 20 | 真实流量上的 acceptance rate | 按 distribution 分列的 acceptance-rate report |
| 20 | P99 tail-latency 纪律 | batch 1/8/32 下有无 speculation 的 p99 |
| 20 | Ops | K8s deploy、基于 queue-wait 的 HPA、平滑 rollout、drain-first upgrade |
| 15 | Write-up 和 methodology | 清晰推导 metrics、matched baselines |

硬性拒收：

- 只报告 steady-state throughput，而没有 tail latency。
- HPA 基于 CPU 而不是 queue-wait。在 GPU saturation 下会 thrash。
- 忽略 draft-target version alignment。发生 drift 的 drafts 比不使用 speculation 成本更高。
- Cost comparisons 省略 hosted APIs 的 prompt-caching discounts。

拒绝规则：

- 没有 rollout drain 就拒绝 serve。请求仍在进行时 in-place upgrade 会被判不合格。
- 拒绝报告跨 distributions 聚合后的 acceptance rate。必须按 distribution 报告。
- 没有 matched non-speculative number 时，拒绝声称 speculative-decoding 在 bs=32 获胜。

输出：一个 repo，包含 vLLM / SGLang configs、EAGLE-3 draft download script、K8s deployment manifests、基于 queue-wait 的 HPA config、面向 ShareGPT / HumanEval / domain data 的 benchmark harness、$/1M tokens comparison table，以及一份 write-up，点名 speculative decoding 引入的三个 tail-latency regressions，并说明修复每个问题的 mitigation（batch gating、ngram fallback、quantization tweak）。
