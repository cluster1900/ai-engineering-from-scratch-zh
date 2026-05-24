# 综合项目 14 — Speculative-Decoding 推理服务器

> vLLM 0.7 中的 EAGLE-3 在真实流量上带来 2.5-3x 吞吐量。P-EAGLE (AWS 2026) 进一步推进了 parallel speculation。SGLang 的 SpecForge 大规模训练了 draft head。Red Hat 的 Speculators hub 为常见 open model 发布了 aligned draft。TensorRT-LLM 让 speculative decoding 在 NVIDIA 上成为 first-class 能力。2026 年的生产 serving stack 是 vLLM 或 SGLang，配合 EAGLE-family draft、FP8 或 INT4 quantization，并基于 queue-wait 做 HPA。这个 capstone 的目标是用完整的 tail-latency report，为两个 open model 提供达到 baseline 2.5x+ 吞吐量的服务。

**Type:** Capstone
**Languages:** Python (serving), C++ / CUDA (kernel inspection), YAML (configs)
**Prerequisites:** Phase 3 (Deep Learning), Phase 7 (Transformers), Phase 10 (LLMs from scratch), Phase 17 (infrastructure)
**Phases exercised:** P3 · P7 · P10 · P17
**Time:** 30 小时

## 问题
Speculative decoding 在 2026 年变成了 commodity。EAGLE-3 draft head 基于 target model 的 hidden state 训练，并预测未来 N 个 Token；target model 在单次 pass 中进行验证。60-80% 的接受率会转化为 2-3x 的端到端吞吐量。vLLM 0.7 原生集成了这一能力。SGLang + SpecForge 提供训练 pipeline。Red Hat 的 Speculators 为 Llama 3.3 70B、Qwen3-Coder-30B MoE、GPT-OSS-120B 发布 aligned draft。

关键技术不在 model，而在 serving operations。接受率会随流量分布漂移（ShareGPT vs code vs domain data）。发生 rejection 时的 tail latency 比不使用 speculation 更差，因此你必须报告多个 batch size 下的 p99，而不能只报告 steady-state tokens/sec。相对 Anthropic / OpenAI API 的每 1M Token 成本，是可信度的杠杆。

## 概念
Speculative decoding 有两层。**draft** model（EAGLE-3 head、ngram，或更小的 target-aligned model）在每一步提出 k 个候选 Token。**target** model 在一次 pass 中验证全部 k 个 Token；任何被接受的 prefix 都会替代 greedy path。接受率取决于 draft-target alignment 和输入分布。

EAGLE-3 在大多数流量上优于 ngram draft。P-EAGLE 为更深的 draft tree 运行 parallel speculation。取舍是：rejection 时的 P99 latency 更高，因为 verify pass 更大。serving config 必须报告按 batch size bucket 划分的 latency，以暴露这一点。

Deployment 使用 Kubernetes。vLLM 0.7 每个 GPU 或 tensor-parallel shard 运行一个 replica。HPA 基于 queue-wait 而不是 CPU 自动扩缩容。FP8 (Marlin) 和 INT4 (AWQ) quant 会让 GPU memory 保持在 H100 / H200 的范围内。端到端报告包括 throughput、接受率、batch 1/8/32 下的 p50/p99，以及 $/1M Token。

## 架构
```
request ingress
    |
    v
vLLM server (0.7) or SGLang (0.4)
    |
    +-- draft: EAGLE-3 heads | P-EAGLE parallel | ngram fallback
    +-- target: Llama 3.3 70B | Qwen3-Coder-30B | GPT-OSS-120B
    |     quantized FP8-Marlin or INT4-AWQ
    |
    v
verify pass: batch k draft tokens through target
    |
    v (accept prefix; resample for rejected suffix)
    v
token stream back to client
    |
    v
Prometheus metrics: throughput, acceptance rate, queue wait, latency p50/p99
    |
    v
HPA on queue-wait metric
```

## 技术栈
- Serving: vLLM 0.7 或 SGLang 0.4
- Speculative methods: EAGLE-3 draft heads、P-EAGLE parallel speculation、ngram fallback
- Draft training: SpecForge (SGLang) 或 Red Hat Speculators
- Target models: Llama 3.3 70B、Qwen3-Coder-30B MoE、GPT-OSS-120B
- Quantization: FP8 (Marlin)、INT4 AWQ
- Deployment: Kubernetes + NVIDIA device plugin；基于 queue-wait metric 的 HPA
- Eval: ShareGPT、MT-Bench-v2、GSM8K、HumanEval，用于衡量跨 domain 分布的接受率
- Reference: TensorRT-LLM speculative decoding，作为 vendor baseline

## 构建它
1. **Target model prep.** 选择 Llama 3.3 70B。通过 Marlin quantize 到 FP8。在 1xH100（或 2x tensor-parallel）上用 vLLM 0.7 部署。

2. **Draft source.** 从 Red Hat Speculators 拉取 aligned EAGLE-3 draft head（或通过 SpecForge 训练一个）。加载到 vLLM 的 speculative-decoding config 中。

3. **Baseline numbers.** 在 speculation 之前：batch 1/8/32 下的 tokens/s、p50/p99 latency、GPU utilization。发布结果。

4. **Enable EAGLE-3.** 切换 config；重新运行同一 benchmark。报告 speedup、接受率、p99 tail-latency delta。

5. **P-EAGLE.** 启用 parallel speculation；测量更深 draft tree 与 serial EAGLE-3 的差异。报告 P-EAGLE 从有帮助转为有害的拐点。

6. **Domain traffic.** 将 ShareGPT、HumanEval 和 domain-specific traffic 通过同一 Server 运行。按分布测量接受率。识别 draft 发生 drift 的条件。

7. **Second target model.** 在 Qwen3-Coder-30B MoE 上运行同一 pipeline。Draft 更棘手（MoE routing noise）。报告结果。

8. **K8s HPA.** 在 K8s 下部署，并让 HPA 跟踪 `queue_wait_ms`。展示负载变为三倍时的 scale-out。

9. **Cost comparison.** 在同一 eval 上计算 $/1M Token，并与 Anthropic Claude Sonnet 4.7 和 OpenAI GPT-5.4 比较。发布结果。

## 使用它
```
$ curl https://infer.example.com/v1/chat/completions -d '{"messages":[...]}'
[serve]     vLLM 0.7, Llama 3.3 70B FP8, EAGLE-3 active
[decode]    bs=8, accepted_tokens_per_step=3.2, acceptance_rate=0.76
[latency]   first-token 42ms, full-response 980ms (620 tokens)
[cost]      $0.34 per 1M output tokens at sustained throughput
```

## 交付它
`outputs/skill-inference-server.md` 描述 deliverable。一个经过测量的、带 speculative decoding 的 serving stack，一份完整的 benchmark report，以及一个 K8s deployment。

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 相对 baseline 的实测 speedup | 在两个 model 上以匹配质量达到 2.5x+ throughput |
| 20 | 真实流量上的接受率 | 按分布划分的 acceptance-rate report |
| 20 | P99 tail-latency 纪律 | 使用和不使用 speculation 时，batch 1/8/32 下的 p99 |
| 20 | Ops | K8s deploy、基于 queue-wait 的 HPA、rollout smooth |
| 15 | Write-up 和 methodology | 清晰说明改变了什么以及为什么 |
| **100** | | |

## 练习
1. 当 draft 比 target 落后一个版本时（例如 Llama 3.3 -> 3.4 drift），测量 acceptance-rate degradation。构建一个 monitoring alert。

2. 实现 ngram-fallback：如果 EAGLE-3 接受率低于某个 threshold，则切换到 ngram draft。报告 reliability improvement。

3. 运行一个受控 MoE experiment：同一个 Qwen3-Coder-30B，在注入 routing noise 与不注入 routing noise 两种情况下对比。测量 draft acceptance sensitivity。

4. 扩展到 H200 (141 GB)。报告每个 replica 获得的 model-size headroom，以及是否可以 serve 一个未 quantize 的 Llama 3.3 70B。

5. 在同一 H100 hardware 上 benchmark TensorRT-LLM speculative decoding。报告它相对 vLLM 胜出的场景。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Draft model | "Speculator" | 为 target 提出 N 个 Token 以供验证的小 model |
| EAGLE-3 | "2026 draft architecture" | 基于 target hidden state 训练的 draft head；约 75% 接受率 |
| P-EAGLE | "Parallel speculation" | 在一个 target pass 中验证的 draft branch tree |
| Acceptance rate | "Hit rate" | 无需 resampling 即被接受的 drafted Token 比例 |
| Quantization | "FP8 / INT4" | 更低精度的 weights，用于在 GPU memory 中容纳更多 model |
| Queue wait | "HPA metric" | request 在 inference 开始前于 pending queue 中等待的时间 |
| Speculators hub | "Aligned drafts" | Red Hat Neural Magic 为常见 open model 提供的 EAGLE draft hub |

## 延伸阅读
- [vLLM EAGLE and P-EAGLE documentation](https://docs.vllm.ai) — reference serving stack
- [P-EAGLE (AWS 2026)](https://aws.amazon.com/blogs/machine-learning/p-eagle-faster-llm-inference-with-parallel-speculative-decoding-in-vllm/) — parallel speculative decoding paper + integration
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge) — draft-head training pipeline
- [Red Hat Speculators](https://github.com/neuralmagic/speculators) — aligned draft hub
- [TensorRT-LLM speculative decoding](https://nvidia.github.io/TensorRT-LLM/) — vendor alternative
- [Fireworks.ai serving architecture](https://fireworks.ai/blog) — commercial reference
- [EAGLE-3 paper (arXiv:2503.01840)](https://arxiv.org/abs/2503.01840) — method paper
- [vLLM repository](https://github.com/vllm-project/vllm) — code and benchmarks
