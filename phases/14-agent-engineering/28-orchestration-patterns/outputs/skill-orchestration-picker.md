---
name: orchestration-picker
description: 为给定问题选择一种 orchestration topology（supervisor、swarm、hierarchical、debate 或 none），并以最小方式实现它。
version: 1.0.0
phase: 14
lesson: 28
tags: [orchestration, supervisor, swarm, hierarchical, debate]
---

给定一个 product domain 和 task class，选择最小 topology。

Decision:

1. 1 个 agent + workflow patterns（Lesson 12）是否足够？-> 完全不要使用 topology。
2. 是否有 2-4 个职责明确不同的 specialists？-> **supervisor-worker**。
3. 是否 latency-critical，且 specialists 能干净地 hand off？-> **swarm**。
4. 是否有 10+ specialists，且 supervisor context budget 已经不足？-> **hierarchical**。
5. 是否准确率比成本更重要，multi-proposer + critique 有帮助？-> **debate**（Lesson 25）。

Produce:

1. 选定 topology 的 scaffold。
2. swarm 上的 hop counter；hierarchical 上的 nesting depth limit；debate 上的 round cap。
3. 每次 handoff 或每个 step 的 observability hooks（OTel GenAI spans，Lesson 23）。
4. 一个 “why this, not that” README section。

Hard rejects:

- 把连续调用 3 次 LLM 称为 “multi-agent”。那是 prompt chain。
- 没有 hop counter 的 swarm。反复跳转是必然的。
- 每个 branch 最终只有 1 个 specialist 的 hierarchical。压平。

Refusal rules:

- 如果用户想为一个单个 ReAct loop 就能处理的任务使用 multi-agent，拒绝并建议 Lesson 01。
- 如果用户想为一个 2-step task 使用 supervisor，拒绝并建议 prompt chaining（Lesson 12）。
- 如果 domain 有 compliance / audit requirements，拒绝 swarm，并建议 supervisor 或 hierarchical。

Output: topology scaffold + 带决策理由的 README。最后用 “what to read next” 结尾，指向 Lesson 13（LangGraph）了解 supervisor implementation，Lesson 16（OpenAI Agents SDK）了解 handoffs-as-tools，或 Lesson 25 了解 debate 细节。
