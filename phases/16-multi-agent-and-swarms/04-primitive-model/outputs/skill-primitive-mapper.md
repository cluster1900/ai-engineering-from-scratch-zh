---
name: primitive-mapper
description: 将任意 multi-agent framework 或 codebase 映射到四个 primitive 轴（agent、handoff、shared state、orchestrator）。
version: 1.0.0
phase: 16
lesson: 04
tags: [multi-agent, primitives, framework-comparison, architecture]
---

给定一个 multi-agent framework（或使用它的 codebase），产出 four-primitive mapping，让读者能用一段话理解该 framework。

产出：

1. **Agent definition.** Agent 是如何构造的？有哪些参数？它携带什么 state？写出精确的 class 或 factory 名称。
2. **Handoff mechanism.** 它使用三种 handoff pattern 中的哪一种 —— function return、graph edge，还是 speaker selection？如果是 hybrid，哪一种是主模式？展示触发一次 handoff 的最小代码。
3. **Shared state model.** 是 full message pool 还是 projected view？是 in-memory 还是 durable（checkpointed）？对 concurrent writers 是否 thread-safe？谁来调和冲突？
4. **Orchestrator type.** Static、LLM-selected、handoff-driven，还是 queue-driven？如果是 LLM-selected，默认使用哪个 model？如果是 static，graph 是 cyclic 还是 DAG？
5. **Cross-axis tradeoffs.** 分别用一句话说明：determinism、scalability ceiling、debuggability、typical failure mode。

硬性拒绝：

- 任何声称某个 abstraction 是“新的”mapping，但没有展示它不能归约到四个 primitives 之一。如果你无法归约它，要精确说明缺口，而不是发明第五个 primitive。
- 只引用 marketing docs 的 framework comparisons。始终引用来自该 framework repository 或 official cookbook 的具体 code example。
- 类似“Framework X is better for agents”的陈述，但没有说明该 framework 优化的是哪个 primitive。

拒绝规则：

- 如果 framework 是 closed-source，且 public docs 没有暴露 agent-handoff-state-orchestrator surface，则说明没有 internals 就无法 mapping。
- 如果用户提供的是 codebase 但没有 framework（hand-rolled agents），则 mapping 该 custom implementation，并标注哪个 primitive 设计不足。
- 如果 framework 早于 2024（original AutoGen v0.2、pre-Swarm）且不再维护，加入一行说明它的 successor 是否保留该 mapping。

输出：一页 framework brief。以单句 summary 开头（“Framework X fixes handoff as graph edge and exposes shared state via a reducer.”），然后给出上面的五个 sections，最后用一段收尾文字说明这个 framework 的 primitives 最适合哪类 production project。
