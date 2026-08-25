# 综合项目 14 — Speculative-Decoding Inference Server

> Speculative decoding——由低成本的 draft 提出 Token，再由 target Model 一次性验证——如今已成为可用于生产的优化方案，而不再是一种研究技巧。vLLM 0.7 中的 EAGLE-3 在真实流量上实现了 2.5-3 倍吞吐量。P-EAGLE（AWS 2026）进一步推进了 parallel speculation。SGLang 的 SpecForge 能够大规模 Training draft head。Red Hat 的 Speculators hub 为常见的开放 Model 发布了对齐的 draft。TensorRT-LLM 让 speculative decoding 成为 NVIDIA 上的一等能力。2026 年的生产 serving stack 是搭配 EAGLE 系列 draft、FP8 或 INT4 Quantization，并根据 queue-wait 进行 HPA 的 vLLM 或 SGLang。本综合项目要求使用两个开放 Model，以基线吞吐量的 2.5 倍以上提供服务，并给出完整的 tail-latency 报告。

**Type:** 综合项目
**Languages:** Python（serving）、C++ / CUDA（kernel 检查）、YAML（配置）
**Prerequisites:** Phase 3（Deep Learning）、Phase 7（Transformer）、Phase 10（从零构建 LLM）、Phase 17（基础设施）
**Phases exercised:** P3 · P7 · P10 · P17
**Time:** 30 小时

## 问题

Speculative decoding 在 2026 年已经成为一种通用能力。EAGLE-3 draft head 基于 target Model 的 hidden state 进行 Training，并提前预测 N 个 Token；target Model 则在一次 pass 中完成验证。60-80% 的接受率可转化为 2-3 倍的端到端吞吐量。vLLM 0.7 原生集成了这项能力。SGLang + SpecForge 提供 Training pipeline。Red Hat 的 Speculators 为 Llama 3.3 70B、Qwen3-Coder-30B MoE、GPT-OSS-120B 发布了对齐的 draft。

真正考验技术功力的是 serving operations，而不是 Model。接受率会随着流量分布（ShareGPT、代码或领域数据）发生漂移。发生拒绝时的 tail latency 会比不使用 speculation 更差——你必须报告多种 Batch size 下的 p99，而不能只报告 steady-state tokens/sec。与 Anthropic / OpenAI API 相比的每 100 万 Token 成本，是建立可信度的关键。

## 概念

Speculative decoding 分为两层。一个 **draft** Model（EAGLE-3 head、ngram 或与 target 对齐的较小 Model）在每一步提出 k 个候选 Token。**target** Model 在一次 pass 中验证全部 k 个 Token；任何被接受的前缀都会替代 greedy path。接受率取决于 draft-target 对齐程度和输入分布。

在大多数流量上，EAGLE-3 的表现优于 ngram draft。P-EAGLE 使用 parallel speculation 构建更深的 draft tree。其权衡在于：发生拒绝时的 P99 latency 更高，因为 verify pass 更大。serving config 必须按 Batch size 分桶报告 latency，才能暴露这一问题。

部署环境为 Kubernetes。vLLM 0.7 在每块 GPU 或每个 tensor-parallel shard 上运行一个 replica。HPA 根据 queue-wait 而不是 CPU 自动扩缩容。FP8（Marlin）和 INT4（AWQ）Quantization 可将 GPU memory 控制在 H100 / H200 的容量范围内。端到端报告需要包含吞吐量、接受率、Batch 1/8/32 下的 p50/p99，以及每 100 万 Token 的成本。

## 架构

```
请求入口
    |
    v
vLLM server (0.7) 或 SGLang (0.4)
    |
    +-- draft：EAGLE-3 head | P-EAGLE parallel | ngram fallback
    +-- target：Llama 3.3 70B | Qwen3-Coder-30B | GPT-OSS-120B
    |     使用 FP8-Marlin 或 INT4-AWQ Quantization
    |
    v
verify pass：通过 target 批量处理 k 个 draft Token
    |
    v（接受前缀；为被拒绝的后缀重新采样）
    v
将 Token stream 返回 client
    |
    v
Prometheus metrics：吞吐量、接受率、queue wait、latency p50/p99
    |
    v
基于 queue-wait metric 的 HPA
```

## 技术栈

- Serving：vLLM 0.7 或 SGLang 0.4
- Speculative 方法：EAGLE-3 draft head、P-EAGLE parallel speculation、ngram fallback
- Draft Training：SpecForge（SGLang）或 Red Hat Speculators
- Target Model：Llama 3.3 70B、Qwen3-Coder-30B MoE、GPT-OSS-120B
- Quantization：FP8（Marlin）、INT4 AWQ
- 部署：Kubernetes + NVIDIA device plugin；基于 queue-wait metric 的 HPA
- Evaluation：ShareGPT、MT-Bench-v2、GSM8K、HumanEval，用于衡量不同领域分布下的接受率
- 参考：将 TensorRT-LLM speculative decoding 作为供应商基线

```figure
cf-spec-decode
```

## 动手构建

1. **准备 target Model。** 选择 Llama 3.3 70B。通过 Marlin Quantization 为 FP8。使用 vLLM 0.7 部署到 1xH100（或 2 路 tensor-parallel）上。

2. **获取 draft。** 从 Red Hat Speculators 获取一个对齐的 EAGLE-3 draft head（或通过 SpecForge Training 一个）。将其加载到 vLLM 的 speculative-decoding config 中。

3. **测量基线数据。** 在启用 speculation 之前，测量 Batch 1/8/32 下的 tokens/s、p50/p99 latency 和 GPU utilization。发布结果。

4. **启用 EAGLE-3。** 切换配置；重新运行同一项 benchmark。报告加速比、接受率和 p99 tail-latency 变化量。

5. **P-EAGLE。** 启用 parallel speculation；比较更深的 draft tree 与串行 EAGLE-3。报告 P-EAGLE 从有益转为有害的拐点。

6. **领域流量。** 让 ShareGPT、HumanEval 和领域特定流量通过同一 server。测量每种分布的接受率。识别 draft 发生漂移的时机。

7. **第二个 target Model。** 在 Qwen3-Coder-30B MoE 上运行相同 pipeline。它的 draft 更难处理（存在 MoE routing noise）。报告结果。

8. **K8s HPA。** 部署到 K8s，并使用 HPA 跟踪 `queue_wait_ms`。演示负载增长到三倍时的横向扩容。

9. **成本比较。** 在相同 Evaluation 上，计算与 Anthropic Claude Sonnet 4.7 和 OpenAI GPT-5.4 相比的每 100 万 Token 成本。发布结果。

## 实际使用

```
$ curl https://infer.example.com/v1/chat/completions -d '{"messages":[...]}'
[serve]     vLLM 0.7、Llama 3.3 70B FP8，EAGLE-3 已启用
[decode]    bs=8, accepted_tokens_per_step=3.2, acceptance_rate=0.76
[latency]   first-token 42ms, full-response 980ms（620 个 Token）
[cost]      在持续吞吐量下，每 100 万个输出 Token 的成本为 $0.34
```

## 交付成果

`outputs/skill-inference-server.md` 描述了交付物：一个经过测量的 speculative decoding serving stack、一份完整的 benchmark 报告，以及一套 K8s 部署。

| 权重 | 标准 | 衡量方式 |
|:-:|---|---|
| 25 | 相对基线的实测加速 | 在两个 Model 上，以相同质量实现 2.5 倍以上吞吐量 |
| 20 | 真实流量上的接受率 | 按分布提供接受率报告 |
| 20 | P99 tail-latency 规范 | 提供启用与未启用 speculation 时 Batch 1/8/32 下的 p99 |
| 20 | 运维 | K8s 部署、基于 queue-wait 的 HPA、平滑 rollout |
| 15 | 报告与方法 | 清晰说明发生了哪些变化及其原因 |
| **100** | | |

## 练习

1. 测量 draft 比 target 落后一个版本时的接受率下降情况（例如 Llama 3.3 -> 3.4 漂移）。构建 monitoring alert。

2. 实现 ngram-fallback：如果 EAGLE-3 的接受率降至阈值以下，则切换到 ngram draft。报告可靠性提升情况。

3. 运行受控的 MoE 实验：对同一个 Qwen3-Coder-30B，分别注入和不注入 routing noise。测量 draft 接受率的敏感度。

4. 扩展到 H200（141 GB）。报告每个 replica 可容纳的 Model size 余量，以及能否提供未经 Quantization 的 Llama 3.3 70B。

5. 在相同的 H100 硬件上对 TensorRT-LLM speculative decoding 进行 benchmark。报告它在哪些方面优于 vLLM。

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|-----------------|------------------------|
| Draft Model | “Speculator” | 提出 N 个 Token 供 target 验证的小型 Model |
| EAGLE-3 | “2026 draft architecture” | 基于 target hidden state 进行 Training 的 draft head；接受率约为 75% |
| P-EAGLE | “Parallel speculation” | 在一次 target pass 中验证的 draft branch tree |
| Acceptance rate | “Hit rate” | 无需重新采样即可接受的 draft Token 比例 |
| Quantization | “FP8 / INT4” | 使用较低精度的权重，让 GPU memory 能够容纳更多 Model 内容 |
| Queue wait | “HPA metric” | 请求在 Inference 开始前，于 pending queue 中等待的时间 |
| Speculators hub | “Aligned drafts” | Red Hat Neural Magic 为常见开放 Model 提供的 EAGLE draft hub |

## 延伸阅读

- [vLLM EAGLE 和 P-EAGLE 文档](https://docs.vllm.ai)——参考 serving stack
- [P-EAGLE（AWS 2026）](https://aws.amazon.com/blogs/machine-learning/p-eagle-faster-llm-inference-with-parallel-speculative-decoding-in-vllm/)——parallel speculative decoding 论文与集成
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge)——draft-head Training pipeline
- [Red Hat Speculators](https://github.com/neuralmagic/speculators)——对齐的 draft hub
- [TensorRT-LLM speculative decoding](https://nvidia.github.io/TensorRT-LLM/)——供应商替代方案
- [Fireworks.ai serving architecture](https://fireworks.ai/blog)——商业参考
- [EAGLE-3 论文（arXiv:2503.01840）](https://arxiv.org/abs/2503.01840)——方法论文
- [vLLM repository](https://github.com/vllm-project/vllm)——代码与 benchmark
