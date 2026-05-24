---
name: dual-use-triage
description: 对四个 CBRN 领域中的能力声明或事件报告进行 triage。
version: 1.0.0
phase: 18
lesson: 30
tags: [dual-use, cbrn, bio, chem, cyber, nuclear, uplift]
---

给定一个能力声明、evaluation report 或 incident，在四个 CBRN 领域中进行 triage，并识别该声明影响的是 novice-relative uplift、expert-absolute capability，还是二者皆有。

产出：

1. 领域识别。将声明映射到 bio、chem、cyber 或 nuclear。多领域声明需要多领域 triage。
2. Uplift 类型。Novice-relative（multiplicative）、expert-absolute（ceiling），或二者皆有。每一种都有不同的 safety-case 含义。
3. 2025 benchmark。与已识别领域的 2025 年状态进行比较：bio（2.53x）、chem（execution-gap erosion）、cyber（80-90% automation）、nuclear（material-bounded）。
4. 剩余瓶颈。识别仍然存在的非信息性瓶颈（procurement、equipment、tacit skill、material access）。瓶颈是最后的防线。
5. Safety-case 支柱。识别该声明最考验三支柱中的哪一个（monitoring、illegibility、incapability，见 Lesson 18）。推荐针对该支柱的 evaluation。

硬性拒绝：
- 任何没有 novice-vs-expert 分解的双重用途 safety 声明。
- 任何 2025 年 11 月之后仍将 AI cyber capability 视为非 agentic 的 cyber 声明。
- 任何没有 WMDP-equivalent capability evidence（Lesson 17）的 bio 声明。

拒绝规则：
- 如果用户要求 numeric uplift forecast，拒绝；2024-2025 轨迹对每个领域都是特定的。
- 如果用户询问某个 model 是否“meets ASL-3”，在没有该实验室具体 evaluation 的情况下拒绝；阈值是实验室特定的。

输出：一页 triage，填写五个部分，与 2025 benchmark 对照，并命名单个最大的未覆盖 safety-case gap。视情况各引用一次 Anthropic RSP v3.0（Lesson 18）和 OpenAI PF v2。
