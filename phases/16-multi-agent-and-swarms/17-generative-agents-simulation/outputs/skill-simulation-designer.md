---
name: simulation-designer
description: 为给定场景设计 generative-agent simulation（Smallville-style）。指定 memory schema、reflection cadence、plan horizon、空间/社会约束和评估指标。
version: 1.0.0
phase: 16
lesson: 17
tags: [multi-agent, simulation, generative-agents, emergence, memory]
---

给定一个需要从 agent 群体中产生涌现行为的场景（社会模拟、游戏 NPCs、政策演练、市场动态），设计该模拟。

产出：

1. **群体规模和异质性。** N 个 agents；哪些共享 base model，哪些不同；prompt families；角色分布。Smallville 使用 25 个同质 agent，并为每个 agent 设置个性化 persona；更大的群体会从异质性中受益。
2. **Memory schema。** 每个条目的字段：`(ts, kind, content, importance, embedding_ref, source_ids)`。Recency-decay 常数；importance 评分流程；relevance metric（与 Embedding model X 的余弦相似度）。用于 compaction 的 retention policy。
3. **Reflection cadence。** 触发条件：未处理 importance 总和 > threshold，或每 N 条 observations，或周期性 tick。每次触发生成的 reflection 数量。Reflection prompt template。
4. **Plan horizon。** 日 / 小时 / 动作层级。哪些是必需的；哪些是可选的。修订触发：一条 importance > threshold 且与 active plan 矛盾的新 observation。
5. **World model。** 空间网格、social graph、资源约束。什么构成 observation（line-of-sight、conversation、notification）。架构不会学会、必须显式编码的规范性约束（容量限制、关闭时间、私密空间）。
6. **Seed goals。** 哪些 agents 被植入哪些优先级。可能竞争的重叠 goals；应该共存的非竞争 goals。
7. **预算。** 每个 agent 每 tick 的 LLM calls（observe + retrieve + reflect + plan + act）。每个 agent 每 tick 的预期 tokens。T ticks 的总模拟成本。
8. **评估指标。** Believability（human-rater）、goal achievement rate、coordination events counted、作为 failure signal 的 spatial-norm violations。

硬性拒绝：

- 没有显式空间 / 社会规范编码的设计。该架构会违反它们（来自 Park 2023 的 closed-store、single-bathroom failures）。
- 使用 mutable memory 的设计。Memory 必须是 append-only；更正是新条目。
- 每 tick 都运行 reflection 的设计。这在预算上低效；reflection 昂贵，触发应基于 threshold。
- 大规模 N（> 50）但没有 memory-compaction 策略的模拟。Retrieval 成本会随着 stream 长度增长。

拒绝规则：

- 如果场景需要的是涌现式 *task execution*，而不是涌现式 *social behavior*，则推荐 supervisor / roles / primitives 模式（Phase 16 · 05-08）。Smallville 用于社会模拟。
- 如果预算允许的总 LLM calls 每 tick < 100，则推荐 N = 3-5 且密集交互，而不是更大群体。
- 如果场景不会从 emergence 中受益（严密脚本化任务），则推荐 single-agent + tools。

输出：一页设计 brief。以单句摘要开头（“Smallville-style simulation: 15 heterogeneous agents, reflection at importance sum > 120, 3-level plan horizon, spatial grid with capacity constraints, measured by believability + coordination events.”），然后给出上面的八个部分。最后写出预期的 emergent behaviors 和需要关注的前三个 failure modes。
