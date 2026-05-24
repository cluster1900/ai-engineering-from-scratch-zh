---
name: skill-pipeline-budget-planner
description: 给定目标延迟和吞吐量，为每个 pipeline 阶段分配时间预算，并标记哪个阶段会最先超出预算
version: 1.0.0
phase: 4
lesson: 16
tags: [vision, pipeline, performance, deployment]
---

# Pipeline 预算规划器

把延迟/吞吐量目标转换为逐阶段预算，让每位团队成员都知道自己要工程实现到哪个数字。

## 何时使用

- 在构建新的 vision service 之前，用于设定每个阶段的预期。
- 在第一次 benchmark 之后，用于查看哪个阶段距离预算最远。
- 当 SLA 变化且需要重新协商预算时。

## 输入
- `p95_latency_target_ms`: 单请求预算。
- `target_qps`: 每个 replica 的吞吐量。
- `stages`: `{ name: str, current_ms: float }` 列表。

## 分配规则

如果没有提供当前测量值，七个标准阶段的默认分配如下：

| Stage | Share |
|-------|-------|
| decode + preprocess | 15% |
| detector forward | 55% |
| postprocess detections (NMS, clamp) | 5% |
| crop + resize for classifier | 5% |
| classifier forward | 15% |
| schema validation | <1% |
| response serialisation | 4% |

在 GPU-bound pipelines（cloud）上，detector 占比通常会上升到 70%。在 CPU 上，preprocessing 和 classifier batching 会消耗更多时间。

## 报告
```
[budget plan]
  p95 target:  <ms>
  throughput:  <qps per replica>

| stage               | target_ms | current_ms | headroom | gate |
|---------------------|-----------|------------|----------|------|
| decode+preprocess   | ...       | ...        | ...      | ok|X |
| detector            | ...       | ...        | ...      | ok|X |
| ...                 | ...       | ...        | ...      |      |

[bottleneck]
  stage:  <name>
  miss:   <ms over budget>
  lever:  <specific action>

[levers]
  decode+preprocess:   Pillow-SIMD, libjpeg-turbo, decode on GPU via NVJPEG
  detector:            smaller backbone, lower input resolution, INT8, TensorRT
  postprocess:         GPU-side NMS (torchvision.ops), fused masks
  crop+resize:         GPU crop with grid_sample, batched interpolate
  classifier:          smaller backbone, INT8, warm cache, batch
  schema:              skip validation in hot path, validate at boundaries only
  response:            orjson, stream protobuf
```

## 规则

- 永远不要建议从生产路径中移除 schema validation；应建议把它移动到边界处。
- 如果 preprocessing 超出预算，始终先尝试 Pillow-SIMD 或 NVJPEG，再考虑更换 model。
- 如果 detector 超出的时间超过目标的 30%，应切换 models，而不是优化当前 model。
- 当 current_ms > 1.1 * target_ms 时，将 gate 标记为 `X`；如果在预算 10% 以内，则标记为 `ok`。
