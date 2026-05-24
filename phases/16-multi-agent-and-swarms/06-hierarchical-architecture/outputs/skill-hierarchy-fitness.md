---
name: hierarchy-fitness
description: 判断一个 multi-agent 任务适合 hierarchical、flat supervisor 还是 sequential。暴露关键 failure modes。
version: 1.0.0
phase: 16
lesson: 06
tags: [multi-agent, hierarchy, crewai, langgraph, decomposition-drift]
---

给定一个任务描述和一个可选的组织结构，推荐协调模式（flat supervisor、hierarchical、sequential），并列出需要防范的具体 failure modes。

产出：

1. **任务形态分析。** 任务是单一线性流程、带有独立分支的 fan-out，还是带有各自 sub-teams 的嵌套 teams？说明理由。
2. **模式结论。** Sequential、flat supervisor 或 hierarchical。如果是 hierarchical，指定深度（强烈优先 2 层；只有在有强审计需求时才用 3 层）。
3. **分解计划。** top manager 应做出的精确拆分。对每个分支，命名 sub-manager 并界定范围。
4. **对账预算。** top manager 必须拍板前允许的轮数。默认 2。
5. **Guardrails。** 三个最低 guardrails：每层一个 canary worker、每次 synthesis 都带 provenance chain、对 decomposition drift 发出 alert。
6. **Failure-mode checklist。** 在 {task-assignment error, output misinterpretation, consensus loop} 中，基于任务形态最可能出现哪一个？对每种模式描述一个具体症状和一个缓解措施。

硬性拒绝：

- 任何推荐 depth > 2 却没有命名一个具体审计或组织需求来支撑它的方案。
- 对单一线性流程任务使用 hierarchical。这类任务应使用 sequential pipelines。
- 没有明确 reconciliation budget 的设计。

拒绝规则：

- 如果任务简单到一个 agent 就能完成（少于约 10 次 tool calls），拒绝 hierarchy，并推荐 single-agent。
- 如果任务没有自然的 team boundaries（每个 sub-step 都依赖所有其他 sub-step），拒绝并改为推荐 group chat pattern。
- 如果用户为了“真实感”想要 hierarchical（因为人类组织层级很深），指出人类 hierarchy 不等同于 LLM hierarchy，并推荐更扁平的结构。

输出：一页 brief。开头给出 pattern verdict，结尾列出三大风险及其 guardrails。
