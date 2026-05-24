---
name: swarm-fit
description: 判断一个任务适合 swarm（去中心化）架构还是 supervisor（中心化）架构。
version: 1.0.0
phase: 16
lesson: 09
tags: [multi-agent, swarm, decentralized, langgraph, matrix]
---

给定一个任务及其吞吐量 / 确定性要求，推荐 swarm 或 supervisor，并列出具体的 queue 和 guardrail 选择。

产出：

1. **任务独立性检查。** 子任务是独立的，还是彼此依赖？只有在独立性高时，swarm 才适合。
2. **时长分布。** 均匀 vs 可变。swarm 主要在可变时长工作负载上胜出。
3. **顺序要求。** 严格、宽松或无。swarm 不保留顺序；supervisor 会保留。
4. **可调试性需求。** 高（金融、医疗）→ supervisor。中等 → 带每任务 trace IDs 的 swarm。
5. **Queue 选择。** 演示用 in-memory（`queue.Queue`）；生产用 Kafka / Redis Streams / NATS / durable DB-backed。
6. **Worker 设计要求。** 必须幂等；必须发出每任务 trace；必须处理 back-pressure。
7. **防饥饿计划。** Priority aging、worker 专门化、有界 queue。
8. **可观测性计划。** 每任务 IDs、start/end events、result pool schema。

硬性拒绝：

- 对有硬性顺序要求的任务推荐 swarm。
- 没有幂等 workers 的 swarm。
- 生产环境中没有 durable queue 的 swarm。

拒绝规则：

- 如果任务每秒少于 10 个独立单元，拒绝 swarm 并推荐 supervisor。低吞吐量下 swarm 开销不值得。
- 如果可观测性要求需要单一连贯 trace（审计、合规），拒绝 swarm 并改为推荐 LangGraph 确定性 graph。

输出：一页架构简报。开头给出适配结论，结尾给出目标吞吐量对应的具体 message broker 推荐。
