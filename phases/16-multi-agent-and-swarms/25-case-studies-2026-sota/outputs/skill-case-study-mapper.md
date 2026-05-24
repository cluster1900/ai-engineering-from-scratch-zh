---
name: case-study-mapper
description: 将拟议的 multi-agent system design 映射到最接近的 2026 生产参考（Anthropic Research、MetaGPT/ChatDev 或 OpenClaw/Moltbook）。呈现已知 trade-offs、推荐 framework，以及已在生产环境中测试过的具体设计决策。
version: 1.0.0
phase: 16
lesson: 25
tags: [multi-agent, case-studies, production, framework-selection, reference-architectures]
---

给定一个拟议的 multi-agent system design，选择最接近的 2026 规范 case study 并进行适配。

产出：

1. **设计指纹。** 任务类型（research / engineering / population / automation）、agent 数量、验证要求、运行时长、角色区分度、面向用户的网络暴露。
2. **最接近的 case study。**
   - **Anthropic Research**，如果：research 或 knowledge-retrieval 任务、必须验证、多小时运行、agent 主要因 context 和 scope 不同而区分（fresh-context subagents 胜出）。
   - **MetaGPT / ChatDev**，如果：engineering 或结构化 workflow，角色清晰可区分（planner / coder / reviewer / tester），handoff artifacts 类型明确。
   - **OpenClaw / Moltbook**，如果：population-scale、面向用户的 agent network、prompt-injection 是有意义的威胁、emergent economy 很重要。
3. **可复制的 patterns。** 来自所选 case study 且适用的具体设计决策：fresh-context subagents、rainbow deploy、communicative dehallucination、DAG routing、unwritable verifier、substrate-level security。
4. **Framework 推荐。** LangGraph、CrewAI、AG2、Microsoft Agent Framework、OpenAI Agents SDK、Google ADK、Anthropic Claude Agent SDK 或 custom。默认采用该 case study 的典型 framework；如果特定设计有更合适的选择，需要说明。
5. **来自该 case 的 anti-patterns。** 参考 case 发现不可行的做法。新设计中应避免。
6. **成本预测。** 预期 Token 倍数（Anthropic Research：~15x；MetaGPT：~5x；OpenClaw：取决于 network effects）。预期 wall-clock 和美元成本范围。
7. **评估方法。** 哪个 benchmark（MARBLE、SWE-bench Pro、internal）相关；相对于 case-study baseline，目标设定多大的 delta 是合理的。

硬性拒绝：

- 在任务有正确性要求时忽略验证的设计。每个 case study 都要支付验证成本。
- 声称有新的 substrate 却不承认 prompt-injection 是 attack surface 的设计。OpenClaw/Moltbook case 表明这是生产环境问题，不是假设。
- 无法映射到任何 case study 的“革命性”主张。Multi-agent 自 2024 年起已进入生产环境；新颖主张需要明确比较。
- 无正当理由跳过 MCP 或 A2A 采用的设计。Protocol 支持是基本要求。

拒绝规则：

- 如果设计没有明确的任务类型，先建议界定任务范围，再选择 case study。“Multi-agent for everything” 不是设计。
- 如果设计声称 production readiness 但没有 failure-mode audit，建议先进行 MAST-style audit（Lesson 23），再做 reference mapping。
- 如果设计纯属 experimental / research，说明在采用任何 case study 的 production patterns 之前，哪些方面需要 hardening。

输出：一份两页 brief。以一句话总结开头（“Closest case study: MetaGPT / ChatDev. Adopt role-SOP decomposition, communicative dehallucination, and structured handoff artifacts; use CrewAI or custom.”），然后给出上述七个部分。结尾给出 90 天适配计划：从参考中复制什么、定制什么，以及用哪些 benchmarks 验证。
