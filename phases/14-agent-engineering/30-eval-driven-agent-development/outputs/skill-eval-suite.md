---
name: eval-suite
description: 构建一个三层 eval suite（static benchmarks、custom offline、online production），包含 evaluator-optimizer loop 和 CI gates。
version: 1.0.0
phase: 14
lesson: 30
tags: [evaluation, ci, regression, benchmarks, llm-judge]
---

给定一个 agent product，构建一个接入 CI 的三层 eval suite。

产出：

1. **Static benchmark layer** — 至少一个相关 benchmark（用于代码的 SWE-bench Verified、用于 tool use 的 BFCL V4、用于 web 的 WebArena、用于 desktop 的 OSWorld、用于 generalist 的 GAIA）。始终同时报告 +-audited score。
2. **Custom offline layer** — 至少一个 LLM-judge rubric，按 domain-specific dimensions（factual、tone、scope、refusal quality）评分。至少一个 execution-based case，在 agent 运行后探测实际 state。至少一个 trajectory-based case，带 gold path。
3. **Online eval layer** — session replays、guardrail-triggered alerts、通过 OTel GenAI spans（Lesson 23）进行 per-step cost/latency tracking。
4. **Evaluator-optimizer runner** — 将 agent 包装进 propose / judge / refine，并设置 round cap。
5. **CI gate** — 相对 baseline 出现 >=5% regression 时让 build 失败。随时间跟踪 baseline。
6. **Case mapping** — Phase 14 lessons 中的每个 guardrail 和每条学到的规则都至少有一个 case。

Hard rejects：

- 没有 baseline 的 Eval suite。没有 reference 就无法检测 regression。
- 在 factual tasks 上没有 external grounding 的 LLM-judge。必须使用 CRITIC pattern（Lesson 05）。
- 没有 pinned seeds 或 snapshot state 的 flaky cases。False alarms 会侵蚀团队对 evals 的信任。

Refusal rules：

- 如果用户只想要“just the happy path”，拒绝。每种 failure mode（Lesson 26）都应该有一个 case。
- 如果用户想要“no CI gate”，并且产品面向 paying users，拒绝。否则 eval drift 是不可见的。
- 如果用户想要“all LLM-judges”，在 factual 和 compliance tasks 上拒绝。那里需要 execution-based 或 programmatic evaluators。

输出：`cases/benchmarks/`、`cases/custom/`、`cases/online/`、`runner.py`、`ci_gate.py`、`README.md`，解释 rubrics、baselines，以及 Phase 14 mapping table。最后用 “what to read next” 指向 Lesson 24（observability）、Lesson 26（failure modes）或 Lesson 23（OTel）作为 substrate。
