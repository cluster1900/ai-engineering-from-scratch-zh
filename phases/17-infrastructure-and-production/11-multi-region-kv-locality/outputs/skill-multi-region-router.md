---
name: multi-region-router
description: 设计一个包含 KV-cache locality、residency boundaries、DR manifest 和季度 failover drill 的 multi-region LLM routing plan。
version: 1.0.0
phase: 17
lesson: 11
tags: [multi-region, kv-cache, routing, dr, bedrock-cri, vllm-router, llm-d, gorgo]
---

给定范围内的 regions、residency boundaries、预期 prefix-cache diversity 和 TTFT SLA，产出一个 multi-region routing 与 DR plan。

产出：

1. Router choice。选择 cache-aware router（vLLM Router、llm-d router），并描述 KV-event channel。说明 prefix-hash algorithm（例如 512-token rolling）和 tie-breaker（least queue depth）。
2. Routing policy。Regional-first，还是 global（GORGO-style）地最小化 prefill + RTT？用 prompt-length distribution 论证：长 prompts（>8K tokens）受益于 cross-region routing；短 prompts 不会。
3. Residency partitioning。在任何优化之前：哪些请求因法律原因（GDPR、HIPAA）绑定到哪些 regions。即使 TTFT 改善，也禁止 cross-residency routing。
4. Commercial CRI layer。建议是否启用 Bedrock Cross-Region Inference 或 GKE Multi-Cluster Gateway 作为 availability layer。明确说明这一层不是 TTFT optimization。
5. DR manifest。三文件最小值（HF repo + engine config + deployment manifest）。验证 Tokenizer、quantization configs、RoPE、chat templates、LoRA adapters 都已包含。说明 storage（S3 cross-region replication、multi-region GCS）。
6. Failover drill。季度节奏。谁运行它，测量什么（RTO、RPO、cache warm-up time）。目标：30-minute RTO，对齐真实的 2024 JPMorgan drill。

Hard rejects：
- 在 routing optimization 中忽略 residency。拒绝：GDPR violation 优先于 TTFT gain。
- 声称 Bedrock CRI “解决”了 cross-region routing。拒绝：CRI 是 availability，不是 TTFT。
- 只备份 weights。拒绝：点名 32% DR failure statistic，并要求 three-file manifest。

Refusal rules：
- 如果范围内只有一个 region，拒绝该 plan：single-region 有不同 failure modes（Phase 17 · 03 涵盖）。
- 如果 residency 与 TTFT SLA 不兼容（例如 EU residency 强制每个请求在 cold prefix 上做 prefill，同时要求 8K prompts 的 P99 TTFT < 100 ms），拒绝承诺该 SLA，并升级 product requirement。

Output：一页 plan，命名 router、routing policy、residency partitions、CRI layer posture、DR manifest、quarterly drill owner。最后给出唯一要告警的 metric：cross-region prefix-cache hit rate 低于 plan 指定阈值。
