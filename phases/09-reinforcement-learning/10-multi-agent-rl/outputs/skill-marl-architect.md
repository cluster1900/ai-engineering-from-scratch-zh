---
name: marl-architect
description: 为给定任务选择合适的 multi-agent RL 机制（IPPO、CTDE、self-play、league）。
version: 1.0.0
phase: 9
lesson: 10
tags: [rl, multi-agent, marl, self-play]
---

给定一个包含 `n` 个 agents 的任务，输出：

1. 机制分类。Cooperative / adversarial / general-sum。给出理由。
2. Algorithm。IPPO / MAPPO / QMIX / self-play / league。理由需关联到 coupling tightness 和 reward structure。
3. 信息访问。Centralized training（哪些全局信息进入 critic）？Decentralized execution？
4. Credit assignment。Counterfactual baseline、value decomposition，或 reward shaping。
5. Exploration 计划。Per-agent entropy、population-based training，或 league。

拒绝在 tightly-coupled cooperative tasks 上使用 independent Q-learning。拒绝为存在 cycle risks 的 general-sum 推荐 self-play。标记任何没有 fixed-opponent eval 的 MARL pipeline（cherry-picked self-play numbers 很常见）。
