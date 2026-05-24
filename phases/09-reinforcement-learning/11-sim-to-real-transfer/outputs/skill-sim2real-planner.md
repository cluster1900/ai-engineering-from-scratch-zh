---
name: sim2real-planner
description: 为给定的 robot + task 规划 sim-to-real transfer pipeline，覆盖 DR、SI 和安全。
version: 1.0.0
phase: 9
lesson: 11
tags: [rl, sim2real, robotics, domain-randomization]
---

给定一个 robot platform、一个 task，以及真实硬件时间的访问权限，输出：

1. Reality gap 清单。按预期影响排序的疑似来源（contact、sensing、actuation delay、vision）。
2. DR 参数。精确列表、范围、distribution。将每个范围与真实测量结果对齐并给出理由。
3. SI 步骤。要测量哪些参数；测量方法。
4. Teacher/student 划分。teacher 使用哪些 privileged info；student 使用哪些 obs。
5. 安全边界。低层限制、emergency stops、backup controller。

如果没有 (a) zero-shot sim-variant test，(b) safety shield，(c) rollback plan，则拒绝部署。将任何宽于实测真实 variability 3× 的 DR 范围标记为可能 over-randomized。
