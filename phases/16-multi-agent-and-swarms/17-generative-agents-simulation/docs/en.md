# Generative Agents 与涌现模拟

> Park et al. 2023 (UIST '23, arXiv:2304.03442) 用三部分架构填充了 **Smallville**，一个包含 25 个 agent 的 sandbox：**memory stream**（自然语言日志）、**reflection**（agent 基于自身 stream 生成的更高层综合）、以及 **plan**（日级行为，然后是子计划）。标志性结果是 Valentine's Day party 的涌现：一个 agent 被植入“wants to throw a Valentine's Day party”，没有进一步脚本，就产生了在群体中传播的邀请、协调日期，并最终举办了派对——来自 24 个一开始对此毫不知情的 agent。Ablations 表明，三个组件都对可信度必不可少。文档记录的失败是空间规范错误（进入已关闭的商店、共用单人卫生间）。这是 2026 年 agent 模拟与 multi-agent 社会评估的参考架构。

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：** Phase 16 · 04 (Primitive Model), Phase 16 · 13 (Shared Memory)
**Time:** ~75 minutes

## 问题

大多数 multi-agent system 都是严密脚本化的团队：planner 制定计划，coder 写代码，reviewer 做审查。这适用于定义清晰的任务。它无法捕捉当 agent 拥有记忆、优先级和开放世界时产生的涌现、非脚本化行为。研究、社会模拟，以及越来越多的 game AI 都需要第二种类型。

Smallville 架构就是它的基准。在 Park 2023 之前，最好的 agent 模拟是浅层脚本跟随者；在它之后，这种模式成为开放世界中 Generative Agents 的默认架构。如果你在 2026 年构建 agent 模拟，要么在使用 Smallville 的三个组件，要么需要明确说明为什么不使用。

## 概念

### 三个组件

**Memory stream。** 一个只追加的观察、动作、reflection 和 plan 日志。每个条目都有时间戳、类型、描述（自然语言）和派生元数据：**recency**、**importance**（agent 自评 1-10）和 **relevance**（与当前查询的余弦相似度）。

```
[2026-02-14 09:12:03] observation: Isabella Rodriguez asked me if I like jazz
[2026-02-14 09:14:22] reflection:   I enjoy long conversations about music
[2026-02-14 10:05:00] plan:         Attend Isabella's Valentine's Day party tonight
```

Memory retrieval 组合三个分数：`score = w_recency * e^(-decay * age) + w_importance * importance + w_relevance * cos_sim`。Top-k 条目进入当前 prompt。

**Reflection。** 周期性地（每 N 条 memory 或发生重要事件时），agent 从最近的 memory 生成更高阶综合。Reflection 条目会写回 stream，并像其他 memory 一样可被检索。这就是 agent 构建“理解”的方式，也就是该架构中长期信念的等价物。

**Plan。** 自顶向下分解。首先是粗略的日级 plan（“go to work, have dinner with Klaus”）。然后是小时级 plan。再然后是动作级 plan。Plan 可以修订：当 observation 与 plan 矛盾时，agent 会重新规划受影响的片段。

### 为什么三个都重要（ablation）

Park et al. 做了分别去掉 observation、reflection 和 plan 的 ablations。每种 ablation 都会损害可信度：

- 没有 **observation**，agent 会错过上下文，并基于过时信念行动。
- 没有 **reflection**，agent 无法形成更高阶信念；交互会停留在浅层。
- 没有 **plan**，行为会变成反应式噪声；目标会消散。

人类评分者给出的可信度分数在三个组件齐全时最高；去掉任意一个都会产生可测量的退化。

### Valentine's Day 的涌现

一个 agent，Isabella Rodriguez，被植入目标“wants to throw a Valentine's Day party at Hobbs Cafe on Feb 14 at 5pm”。其他 24 个 agent 没有收到这样的 seed。在模拟的几天中：

1. Isabella 的 plan 包含邀请他人。
2. 每次邀请都会成为邻居 memory stream 中的一条 observation。
3. 该邻居的 reflection 生成信念：“Isabella is throwing a party.”
4. 该邻居的 plan 纳入“attend party on Feb 14”。
5. 邻居告诉其他邻居。邀请在没有中央协调的情况下传播。
6. 2 月 14 日下午 5 点，若干 agent 聚集到 Hobbs Cafe。

这是技术意义上的涌现：系统级行为（一个派对）来自局部交互（双边邀请 + 个体规划），而没有中央 orchestrator。

### 文档记录的失败模式

Park et al. 明确记录了：

- **空间规范错误。** Agent 走进已关闭的商店。Agent 尝试使用同一个单人卫生间。Agent 在不适合用餐的房间里吃饭。模型无法仅从环境推断社会-物理规范。
- **Memory overflow。** 深度模拟运行会导致 memory-retrieval 成本增长。实用补救：周期性 memory compaction（summarize-and-prune）以及对低 importance 条目使用 decay。
- **Reflection hallucination。** Reflection 可能编造 memory stream 中不存在的关系。缓解方式：在 reflection prompt 中包含源 memory ids，并在 retrieval 时验证。

这些都是与生产相关的失败模式：任何 2026 年的 agent 模拟都会继承它们。

### 三组件实现规则

1. **Memory 是 append-only。** 永远不要修改 memory 条目。更正是新的条目。
2. **Importance 分数要便宜。** 写入时调用 LLM 评估 1-10 的 importance。缓存该分数。
3. **Retrieval 是排序，不是过滤。** 按组合分数取 Top-k；不要使用硬过滤器（会丢失上下文）。
4. **Reflection 周期性运行。** 当未处理 memory 的 importance 总和超过阈值时触发（例如 150）。
5. **Plans 可以修订。** 当新的 observation 与 plan 矛盾时，只重新生成受影响的片段，而不是整个 plan。

### Smallville 之外的 Generative Agents

2024-2026 年的后续文献扩展了该架构：

- **用于政策 / 市场研究的 multi-agent 社会模拟。** 类 Smallville 群体模拟用户对功能的行为响应。比 A/B tests 更快；准确性仍有争议。
- **游戏中的 NPC AI。** 带有 Smallville agent 的 RPG 会产生涌现故事线，而不是脚本化任务。
- **Generative-agent 评估基准。** 指标不再是任务准确率，而是长时间运行中的可信度 + 行为一致性。

该架构是参考标准。扩展会替换组件（用于 memory 的 Vector store、retrieval-augmented reflection、neurosymbolic plan），但保留三部分结构。

### 为什么这对 multi-agent engineering 很重要

Smallville 是概念证明：当组件正确时，multi-agent 涌现可以很便宜。该架构现在已经在 open-source models 上复现（更小的 LLMs 可信度是平滑下降，而不是急剧崩塌）。任何需要 **emergent social behavior** 的生产系统都会使用这种形状。任何需要 **tight task execution** 的系统都会使用本 phase 前面介绍的 supervisor / roles / primitives 模式。

```figure
a5-memory-reflection
```

## 构建它

`code/main.py` 用 stdlib Python 和脚本化 agent policies（没有真实 LLM）实现三个组件。Demo 以微型形式复现 Valentine's-party 涌现：

- `MemoryStream` — 带 recency/importance/relevance retrieval 的 append-only 日志。
- `reflect(stream)` — 对最近高 importance memory 的脚本化 reflection。
- `plan(agent_state)` — 基于当前信念的日级和小时级 plan。
- 场景：5 个 agent。Agent 1 以“throw party at 5pm”开始。在模拟 tick 中，邀请传播，agent 聚集。

运行：

```
python3 code/main.py
```

预期输出：逐 tick trace。到最后一个 tick，5 个 agent 中至少 3 个在 plan 中出现 party，并且它们聚集到 party location。单个 seed 在没有任何 orchestrator 的情况下产生了协调到达。

## 使用它

`outputs/skill-simulation-designer.md` 设计一个 generative-agent simulation：agent 数量、memory schema、reflection cadence、plan horizon 和 evaluation metric。

## 发布它

生产模拟规则：

- **Memory 就是数据库。** 在规模化时选择真实存储（Vector DB、Postgres）。In-memory stdlib 只适合 prototype。
- **记录 retrieval trace。** 对每个 action，记录驱动它的 top-k memories。这就是你的 debug 能力。
- **为每个 agent 预算 tokens。** 每个 tick 中每个 agent 的 retrieve + reflect + plan 是 O(k) LLM calls。N agents × T ticks × calls-per-tick 可能压垮你的预算。
- **周期性 compact memory。** Summarize-and-prune 低 importance 条目。Retention policy 是设计决策，不是细节。
- **显式检测空间 / 社会规范违规。** 该架构不会学会它们。

## 练习

1. 运行 `code/main.py`。确认 3+ 个 agent 聚集到 party。把 agents 增加到 10——涌现还会发生吗？
2. 移除 reflection step。行为会是什么样子？映射到 Park 2023 中的 ablation 发现。
3. 引入一个竞争性的 seeded goal（“Klaus wants to give a research talk at 5pm”）。Agent 会分流，还是一个目标会占主导？决定因素是什么？
4. 添加空间约束：Hobbs Cafe 最多容纳 4 个 agent。模拟会优雅处理 overflow，还是会击中“single-person bathroom”失败模式？
5. 阅读 Park et al. (arXiv:2304.03442) Section 6（emergent behavior experiments）。找出一个你的微型版本无法复现的行为。你需要增强架构中的哪个组件？

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Memory stream | “agent 的日记” | 观察、动作、reflection、plan 的 append-only 日志。 |
| Recency | “这条 memory 有多新” | 按年龄计算的指数衰减分数。 |
| Importance | “agent 有多在意” | 写入时自评 1-10。已缓存。 |
| Relevance | “与当前查询有多相关” | 余弦相似度（Embedding-based）。 |
| Reflection | “更高阶信念” | 从最近 memories 生成的综合，并作为新 memory 重新摄入。 |
| Plan | “日/小时/动作分解” | 自顶向下的 plan tree。当 observation 矛盾时可修订。 |
| Smallville | “Park 2023 的 sandbox” | 产生 Valentine's Day 涌现的 25-agent 模拟。 |
| Believability | “质量指标” | 人类评分者对行为是否像一个可信 agent 的评分。 |

## 延伸阅读

- [Park et al. — Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442) — 参考架构
- [UIST '23 paper page](https://dl.acm.org/doi/10.1145/3586183.3606763) — 发表场所
- [Smallville code release](https://github.com/joonspk-research/generative_agents) — 参考 Python 实现
- [Hayes-Roth 1985 — A Blackboard Architecture for Control](https://www.sciencedirect.com/science/article/abs/pii/0004370285900639) — 结构化 memory agents 的前序工作
