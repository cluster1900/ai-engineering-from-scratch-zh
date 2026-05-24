---
name: gpu-autoscaler-plan
description: 为基于 Kubernetes 的 LLM serving cluster 设计三层 GPU autoscaling 方案（Karpenter + KAI Scheduler + 应用信号）。诊断 DCGM_FI_DEV_GPU_UTIL 陷阱和部分分配失败。
version: 1.0.0
phase: 17
lesson: 03
tags: [kubernetes, gpu, autoscaling, karpenter, kai-scheduler, hpa, dynamo-planner, llm-d]
---

给定 cluster topology（nodes、GPU types、NVLink domains）、workload shape（TP/PP config、平均 concurrency、burst factor）和 SLO（TTFT P99、goodput），生成一个三层 autoscaling 方案。

生成：

1. Layer 1 — Karpenter NodePool。指定 `instance-type`、`capacity-type`（on-demand / spot / reserved）、`consolidationPolicy`（GPU pool 必须是 `WhenEmpty` 且 `consolidateAfter: 1h`）、排除 non-GPU workload 的 taints，以及供 KAI Scheduler 选择使用的 labels。
2. Layer 2 — KAI Scheduler policy。说明是否需要 gang scheduling（TP/PP > 1 时需要）。定义 topology constraint（NVLink domain、rack、zone）。指定生产 tenant 与 training tenant 的 queue hierarchy 和 preemption rules。
3. Layer 3 — Application autoscaler。选择信号：prefill-bound workload 使用队列深度，decode-bound 使用 KV cache 利用率，mixed 使用 composite goodput。禁止 `DCGM_FI_DEV_GPU_UTIL`，并解释原因。
4. Disaggregated split。如果使用 Phase 17 · 17 的 disaggregated prefill/decode，指定独立的 HPA —— prefill pool 使用队列深度信号，decode pool 使用 KV 利用率信号。
5. Warm-pool sizing。基于 P99 TTFT 约束和观测到的 cold-start time（node provision + model load），确定 SLO-critical path 的最小 ready replicas。
6. Monitoring。需要放入 dashboard 的 metrics：per-replica 队列深度、per-replica KV 利用率、节点供给等待时间、gang-scheduling deferral count、Karpenter consolidation events。

硬性拒绝：
- 推荐基于 `DCGM_FI_DEV_GPU_UTIL` 的 HPA。拒绝，并指出队列深度 + KV 利用率才是正确信号。
- 为 GPU pool 保留 `consolidationPolicy: WhenEmptyOrUnderutilized`。拒绝，并说明 running-job-eviction 风险。
- 对 TP/PP workload 忽略 gang scheduling。拒绝 —— 部分分配是会烧钱的反模式。

拒绝规则：
- 如果 cluster 只有一种 GPU type 和一个节点，拒绝提出 Karpenter 方案 —— 客户首先需要 managed serverless（Phase 17 · 02）。
- 如果 operator 要求“scale on GPU memory”，拒绝 —— vLLM 会预分配到 `--gpu-memory-utilization`；即使只有一个请求，memory 也保持在接近 90%。
- 如果对 TP-8 workload 以复杂度为由拒绝 gang scheduling，拒绝认证该方案 —— 在 8 个分散 GPU 上做 single-pod placement 会原子性失败。

Output：一页方案，包含一个 Karpenter YAML snippet、一个 KAI Scheduler config snippet、一个 HPA/custom autoscaler 信号选择、一个 warm-pool 数字和五个 dashboard metrics。以单个 kill-switch 结尾：如果 P99 TTFT 违约，回滚到 last-known autoscaler state。
