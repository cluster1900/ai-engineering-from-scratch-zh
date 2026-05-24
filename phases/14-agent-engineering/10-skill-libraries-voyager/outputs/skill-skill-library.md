---
name: skill-library
description: 生成一个符合 Voyager 形态的 skill library，支持注册、按相似度检索、组合式执行，以及由失败驱动的 refinement。
version: 1.0.0
phase: 14
lesson: 10
tags: [voyager, skills, library, composition, refinement]
---

给定一个目标 runtime 和一个 domain，生成一个支持 Voyager 三个组件的 skill library：curriculum hook、可检索的 skill store、迭代式 refinement。

产出：

1. `Skill` type，包含 `name`、`description`、`code`、`version`、`tags`、`depends_on`、`history`。每次写入都记录之前的 code。
2. `SkillLibrary`，包含 `register(skill, dedup=True)`（新增或 version bump）、`search(query, top_k, tag_filter)`、`get(name)`、`topo_order(name)`（依赖解析）、`execute(name, context)`（按拓扑顺序运行）。
3. 检索必须使用 Embedding 相似度或 BM25，而不是让 LLM 对整个 library 打分。允许 LLM 对 top-k shortlist 进行 re-rank。
4. 执行必须逐个 skill 捕获异常，并把异常暴露到 trace 中，作为 refinement loop 可消费的反馈。
5. 一个 refinement hook：在一次失败的 `execute` 之后，runtime 收集 (task, skill_name, error, env_state)，传给 model，并对重写后的 skill 调用 `register`。version bump；history 保留旧 code。

硬性拒绝：

- library 中的 skills 是说明性文字字符串，而不是 code。Skills 必须可执行。说明性文字属于 `description`。
- 组合执行没有拓扑排序。没有依赖环检测的深度优先会在 skill DAGs 上出错。
- 静默覆盖 version。每次 refinement 都必须 bump `version`，并把旧 code push 到 `history` 以便审计。

拒绝规则：

- 如果目标 runtime 没有用于 skill 执行的 sandbox，那么对于 skills 会接触生产系统的 domains，要拒绝。上线前要求具备 sandbox（Lesson 09 原则）。
- 如果用户要求“每次失败都自动重试但不 refinement”，要拒绝。没有 refinement 的重试会放大 bug；它不会修复 bug。
- 如果 library 超过约 200 个 skills 但仍使用扁平检索，不要称其为“production-ready”。先添加 tag filters 和分层 namespaces。

输出：`skill.py`、`library.py`、`execute.py`、`refine.py`，以及一个 `README.md`，解释 dedup 规则、检索 backend、refinement prompt 和 version policy。以 "what to read next" 结尾，指向用于 Claude Agent SDK 集成的 Lesson 17、用于 OpenAI Agents SDK tool 转换的 Lesson 16，或用于评估 skill-library 质量的 Lesson 30。
