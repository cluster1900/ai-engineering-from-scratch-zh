---
name: topology-picker
description: 为给定任务选择 multi-agent debate topology（star / chain / tree / graph）、agent 数量 N、异质性配置和轮次上限。
version: 1.0.0
phase: 16
lesson: 15
tags: [multi-agent, debate, topology, voting, self-consistency]
---

给定一个任务描述，推荐 multi-agent topology 和规模。

生成：

1. **任务指纹。** Research（长周期、开放式）、fast-factual（封闭式答案）、stepwise-refinement（分阶段 pipeline）或 opinion（没有 ground truth）。选择一个；如果横跨两类，选择主导形态。
2. **Topology。** Star、chain、tree 或 graph。根据指纹给出理由：
   - research → graph（any-to-any critique）
   - fast-factual → star（hub 聚合）
   - stepwise-refinement → chain（如果是 divide-and-conquer，则用 tree）
   - opinion → 以上都不适用；推荐 single agent + human decision
3. **Agent 数量 N。** 3 是成本最低且有用的 ensemble；5 是常见的甜点位；7+ 属于专项配置。在 graph topology 上超过 5 个时，警告 coordination tax。
4. **异质性配置。** 如果 monoculture 很重要（research、reasoning），至少一个 agent 必须来自不同的 base model family。N=5 时优先使用 3 个不同的 base models。
5. **轮次上限。** 1 轮 = vote。2 轮 = 一次 refinement。3 轮 = conformity 占主导前的最大值。绝不允许无上限。
6. **聚合。** Plurality（低成本）、confidence-weighted（Lesson 14 的 CP-WBFT）、geometric median（DecentLLMs）或 judge-scored。默认使用 confidence-weighted，除非成本约束要求 plurality。
7. **升级。** 低于阈值的 consensus → 升级到哪里？Human、另一个使用不同 base models 的 ensemble，或 abstention？

硬性拒绝：

- 任何在 graph topology 上推荐 10+ agents 的方案。Coordination tax 会占主导；先测量。
- 面向开放 research questions 的 Star topology。Star 会失去 any-to-any critique 的收益。
- 任何把同一个 base model 运行 N 次并称为 multi-agent 的推荐。这其实是伪装后的 self-consistency；请正确标注。
- 无上限轮次。它会奖励 conformity；debate 运行越久，agents 越会因为压力而不是逻辑达成一致。

拒绝规则：

- 如果任务没有 ground truth（opinion、synthesis、creative），说明 voting 仅作 advisory。推荐 single agent + human decision。
- 如果用户无法访问多个 base models，标出 monoculture ceiling，并推荐使用 temperature variation 的 self-consistency 作为 fallback。
- 如果任务很简单（单次事实查找、reasoning 少于 100 tokens），推荐 single agent，并使用 self-consistency N=5。

输出：一页 brief。以单句推荐开头（“Graph topology，N=5 agents，来自 3 个不同 base models，2 轮，confidence-weighted aggregation，低于阈值时升级给 human。”），然后给出以上七个部分。最后给出预算估计：每次 query 的预期 tokens 和预期 latency（秒）。
