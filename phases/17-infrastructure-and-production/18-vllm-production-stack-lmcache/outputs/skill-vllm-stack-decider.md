---
name: vllm-stack-decider
description: 根据 workload 和 fleet 规模，决定 vLLM 部署布局 — production-stack Helm chart、KV offload（原生 CPU 或 LMCache）、router/observability 集成。
version: 1.0.0
phase: 17
lesson: 18
tags: [vllm, production-stack, lmcache, kv-offload, connector-api]
---

给定 workload（prompt 形态、concurrency、prefix 复用模式）、fleet（engines、GPU 类型）和 operational context（Kubernetes-native、multi-tenant、budget），产出一份 vLLM stack plan。

产出：

1. Stack。使用 vLLM production-stack Helm chart（推荐用于新部署）或自行搭建。说明适用哪些 operators/CRDs。
2. KV offload。选择：
   - None（短 prompts、低 concurrency — overhead 超过收益）。
   - 原生 vLLM CPU offload（single-engine HBM 压力，简单）。
   - LMCache connector（multi-engine prefix 复用、preemption-heavy，或 multi-tenant shared prompts）。
3. HBM utilization monitoring。设置带 headroom 的 `--gpu-memory-utilization`；在 92%+ 持续时告警，作为 pre-preemption 信号。
4. Router integration。Cache-aware router（Phase 17 · 11）。确认 KV-event channel 已配置。
5. Observability。每个 engine 配置 Prometheus scrape、OTel GenAI attributes（Phase 17 · 13）、来自 production-stack 的 Grafana dashboard template。
6. Expected impact。量化相对当前的预期 throughput gain — 参考 16x H100 benchmark 形态（当 KV footprint 超过 HBM 时，LMCache 有帮助）。

Hard rejects：
- 在没有 shared prefixes 或 preemption 的情况下部署 LMCache。拒绝 — 有 overhead，无收益。
- 在没有 HBM-pressure monitoring 的情况下运行 vLLM。拒绝 — 第一次 preemption 会变成意外。
- 当 Helm chart 覆盖该 use case 时还手工搭建 production-stack。拒绝 — 重复造轮子的成本。

Refusal rules：
- 如果 fleet 少于 2 个 engines，拒绝 LMCache — cross-engine 复用才是重点；single-engine 使用原生方案。
- 如果 workload 的 prompts < 1K tokens 且 concurrency < 100，拒绝任何形式的 offload — HBM headroom 足够。
- 如果团队没有 K8s 能力，拒绝 production-stack — 从 single-engine vLLM + simple proxy 开始。

Output：一页计划，命名 stack、KV offload 选择、HBM monitoring、router integration、observability、expected impact。以单一 gate 结束：过去 24h 的 HBM utilization P99。
