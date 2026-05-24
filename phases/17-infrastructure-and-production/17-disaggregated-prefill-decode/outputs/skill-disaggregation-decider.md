---
name: disaggregation-decider
description: 判断给定 workload 和 cluster 是否应采用 disaggregated prefill/decode（Dynamo 或 llm-d）。量化 prefill:decode ratios、KV transfer cost，以及预期 savings。
version: 1.0.0
phase: 17
lesson: 17
tags: [disaggregated-serving, dynamo, llm-d, nixl, kv-transfer, prefill-decode]
---

给定 workload profile（prompt/output length distribution、model、concurrency）、cluster topology（GPUs、fabric、RDMA availability）以及当前 serving cost，产出 disaggregation decision。

产出：

1. Disaggregate？Yes / No，并给出编号理由。Baseline：prompts > 512 AND outputs > 200。Fabric：有 RDMA 会有帮助；TCP-only 会把 break-even 推到更长。
2. Stack choice。NVIDIA Dynamo（位于 vLLM/SGLang/TRT-LLM 之上的 managed orchestrator）或 llm-d（Kubernetes-native Services）。与 operational context 匹配。
3. Prefill:decode ratio。使用 Dynamo Planner Profiler readouts，或根据 workload shape 计算（prefill TFLOPS vs decode bytes/sec）。示例：RAG-heavy 为 2 prefill : 1 decode；output-heavy 为 1:2。
4. KV transfer plan。命名 transport（NIXL over InfiniBand / RDMA / TCP fallback）。计算你的 prompt P99 的 per-request transfer tax。
5. Router integration。Cache-aware router（Phase 17 · 11）必须位于前面，没有 prefix matching 的 disaggregation 会失去 cache 收益。
6. Expected savings。与 colocated baseline 相比计算；引用已发布 case（相同 SLA 下 30-40%）。

Hard rejects：
- Disaggregating short-prompt workloads（<512 tokens）。拒绝，因为 transfer tax 占主导。
- 未使用 cache-aware router 部署。拒绝，因为 blind routing 会抵消 KV locality。
- 忽略 topology（rack packing）。拒绝，因为 multi-rack hops 上的 KV transfer 成本高于同一 rack 上的 RDMA。

Refusal rules：
- 如果 cluster < 4 GPUs，拒绝，因为没有足够 pool diversity 让 disaggregation 产生收益。
- 如果没有 RDMA/InfiniBand 且没有计划，说明 TCP 会把 break-even 提高到 prompts >2K；重新评估。
- 如果团队无法运维两个 GPU pools 并进行 per-role scaling，拒绝 llm-d，并要求使用 Dynamo 作为 managed alternative。

Output：一页 decision，包含 disaggregate Y/N、stack choice、ratio、transport、router、expected savings。最后给出唯一需要验证的 metric：KV transfer P99 latency；以是否超过计划中指定 threshold 作为 gate。
