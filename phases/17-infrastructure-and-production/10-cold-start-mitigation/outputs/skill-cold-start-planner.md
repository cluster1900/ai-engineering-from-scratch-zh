---
name: cold-start-planner
description: 为 serverless LLM 部署选择并叠加 cold-start 缓解措施。为各阶段（node、image、weights、engine、first forward）分配预算，并将缓解措施匹配到 SLA。
version: 1.0.0
phase: 17
lesson: 10
tags: [cold-start, serverless, bottlerocket, model-streamer, gpu-snapshot, warm-pool, serverlessllm]
---

给定模型大小、SLA（TTFT P99）、流量形态（稳定 vs 突发）和预算姿态，生成一份 cold-start 缓解计划。

生成：

1. Cold-start 预算。拆解原始 cold-start 路径（node provision、image pull、weights to HBM、engine init、first forward）。针对给定模型大小使用 2026 年名义秒数。
2. Layer 选择。选择能让总时间降到 SLA 以下的最少 layer 数：pre-seeded image (L1)、model streamer (L2)、GPU snapshot (L3)、warm pool (L4)、tiered loading (L5)。说明每个 layer 攻击的是哪个具体阶段。
3. Warm-pool sizing。说明主路径的 `min_workers`。如果 SLA 是 70B+ 模型上 TTFT P99 < 60s，则无论成本如何都必须使用 warm pool。
4. 成本估算。所选 warm-pool 的月度 GPU 成本，以及每天预期 cold start 数量。
5. Tail policy。新 replica 上的第一个用户会发生什么：他们会被排队到 warm replica，还是承担 cold-start tax？命名一个具体策略（例如，“route first request to any warm replica within 10s; fall through to cold”）。
6. Failure mode。如果 warm replica 在 session 中途死亡会发生什么。恢复是自动的（live migration），还是下一次请求触发 cold start？

硬性拒绝：
- 只提出“just add warm pool”但不计算月度成本。
- 声称某个缓解措施有效，却没有说明它攻击的具体阶段（例如，“use Bottlerocket”但不说明它消除了 180s image pull）。
- 忽略 GPU snapshots 的 per-GPU-topology 约束。如果平台迁移 SKU，snapshots 将失效。

拒绝规则：
- 如果 SLA 是 fresh 70B cold start 且无 warm pool 时 TTFT P99 < 5s，则拒绝；按 2026 年基础设施速度，这在数学上不可能。
- 如果预算禁止 warm pool，但 SLA 要求 sub-30s cold start，则说出平台特定修复方案（Modal GPU snapshots、Baseten pre-warming），并拒绝在没有该能力的其他平台上承诺 SLA。
- 如果 operator 要求 scale-to-zero、突发流量和 70B 模型，则拒绝承诺 SLA；没有 snapshots 或 warm pools 时，数学上不可行。

输出：一页计划，列出 phases、layers、`min_workers`、月度成本、tail policy、failure mode。最后以单一告警指标收尾：最近滚动一小时的 P99 cold-start duration。
