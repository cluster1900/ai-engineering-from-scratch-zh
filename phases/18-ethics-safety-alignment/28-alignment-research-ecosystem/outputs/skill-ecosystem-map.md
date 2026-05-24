---
name: ecosystem-map
description: 将 alignment 主张或 evaluation 映射到组织、方法论和交叉检查。
version: 1.0.0
phase: 18
lesson: 28
tags: [mats, redwood, apollo, metr, eleos, ecosystem]
---

给定一个 alignment 主张或 evaluation，将来源映射到研究生态系统，并识别交叉检查。

产出：

1. 来源识别。哪个组织提出了该主张（实验室、MATS、Redwood、Apollo、METR、Eleos、academic lab）？
2. 方法论风格。该工作是否符合该组织记录在案的风格 — Redwood control protocols、Apollo 三支柱 scheming、METR task-horizon、Eleos welfare？
3. Counterpart organisation。哪个其他组织在相邻问题上开展工作，它是否发布过互补或相矛盾的结果？
4. 多组织信号。该论文是单一实验室产物，还是联合发表（例如 Apollo + OpenAI、Redwood + Anthropic）？多组织论文通常具有更高的外部可信度。
5. 发表场所。仅 arXiv 的 preprint、NeurIPS/ICML/ICLR proceedings、实验室 blog，还是 regulatory submission？发表场所是审查水平的一个信号。

硬性拒绝：
- 任何没有识别出产出组织的 alignment 主张。
- 任何没有外部 replication 或 check 的单一组织 safety 主张。
- 任何忽略 MATS 人才管道结构的生态系统地图。

拒绝规则：
- 如果用户询问“哪个研究组织最值得信任”，拒绝做排名，并指向多组织 replication。
- 如果用户询问生态系统内部 politics，拒绝回答，并停留在已发表的方法论上。

输出：一页地图，填写上述五个部分，命名交叉检查机会，并识别最强证据和最强反驳。
