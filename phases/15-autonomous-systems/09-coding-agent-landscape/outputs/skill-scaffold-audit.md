---
name: coding-scaffold-audit
description: 在采用 proposed coding-agent scaffold 用于生产代码修改之前，对它进行 audit（retrieval、verifier loop、sandbox、benchmark fit）。
version: 1.0.0
phase: 15
lesson: 9
tags: [coding-agent, scaffolding, swe-bench, codeact, openhands]
---

给定一个 proposed coding-agent scaffold（SWE-agent、OpenHands、Aider、Cline、Devin、Claude Code，或内部构建），从四个维度打分，并标出 benchmark 数字会在哪些地方夸大生产质量。

产出：

1. **Retrieval。** 描述 scaffold 如何选择 agent 在行动前读取哪些 files。Repo map、embedding search、显式 file list，或 agent-driven `grep` calls。retrieval 的质量是沉默但主导性的可靠性因素。
2. **Verifier loop。** scaffold 是否运行 tests、读取 stack trace，并把 failure 反馈到下一个 turn？如果没有 verifier loop，标记为缺失 —— 这通常会在 SWE-bench-like tasks 上造成 10+ 分的绝对差距。
3. **Sandbox and blast radius。** actions 在哪里执行？Local file system、ephemeral container、managed VM。对于 CodeAct-style scaffolds，确认 sandbox 已 hardened（无 egress、无 host mounts、有 time limit）。对于 JSON tool-call scaffolds，确认 tool validators 会拒绝每一种非预期 side effect。
4. **Benchmark fit。** 报告的数字（例如 “80.9% on SWE-bench Verified”）实际覆盖什么分布？统计 benchmark 中 1–2 行任务所占比例；将报告分数与同一模型在 SWE-bench Pro（10+ 行任务）上的分数对比。headline number 由 easy tail 驱动的 scaffold 不是生产信号。

硬性拒绝：
- 任何没有 verifier loop、却用于 trivial complexity 以上任务的 scaffold。
- 没有 sandbox isolation（无 Docker、无 rootless container、无 VM）且指向真实 repositories 的 CodeAct scaffolds。
- 不披露分布的 benchmark claims（easy-tail fraction、Pro-equivalent score）。
- 单个 tool 能在没有 validator 的情况下触碰任意 paths 的 tool-call scaffolds（例如暴露给模型的 raw `shell_exec` tool）。

拒绝规则：
- 如果用户无法给出 scaffold 在代表性 internal distribution 上的 test-suite pass-rate，拒绝，并要求先做 small-sample measurement。Public benchmarks 预测的是 rank-order，不是 absolute quality。
- 如果 proposed scaffold 会在没有 staging dry-run 的情况下运行在 production repository 上，拒绝，并要求先 staging。Coding agents 会重写 files；retrieval 糟糕的 coding agents 会重写错误的 files。
- 如果用户计划仅使用 benchmark scores（没有自己的 evals）来做 go/no-go decision，拒绝，并要求 internal eval data。

输出格式：

返回一份打分 memo，包含：
- **Retrieval score**（0–5，并描述 mechanism）
- **Verifier loop score**（0–5，并描述 feedback format）
- **Sandbox score**（0–5，并描述 isolation mechanism）
- **Benchmark fit score**（0–5，并描述 internal distribution delta）
- **部署建议**（production / staging / research only）
- **One-line risk summary**（最可能出现的第一个生产 failure）
