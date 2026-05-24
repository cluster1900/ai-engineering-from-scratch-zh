---
name: failure-detector
description: 为 agent traces 生成 failure-mode detectors，连接到 trace store，标注五种行业反复出现的模式以及 domain-specific signatures。
version: 1.0.0
phase: 14
lesson: 26
tags: [failure-modes, masft, detection, observability]
---

给定一个 product domain 和一个 trace store，为 agent failure modes 生成 detectors。

产出：

1. 每种模式一个 detector：`hallucinated_action`、`scope_creep`、`cascading_errors`、`context_loss`、`tool_misuse`、`success_hallucination`。
2. Domain-specific detectors（例如，对 dev tool 来说是“created a PR without linking an issue”，对 marketing tool 来说是“sent an email to > 5 recipients without confirmation”）。
3. Tagger，将所有 detectors 应用于每条 trace，并输出 distribution。
4. Threshold-based alerting：如果今天 >=5% 的 traces 被标注为某种模式，则 page 或 open a ticket。
5. Sample retention：对每条被标注的 trace，保留 inputs + outputs + state snapshots，供 operator review。

Hard rejects：

- 生产环境中每条 trace 都需要 LLM calls 的 detectors。使用 pattern-based detectors；将 LLM-judge 保留给 sampled review。
- 只在 crash 时 tagging。大多数 failures 会产生看起来有效的 output。必须对 content + state 做 signature checks。
- 在没有 PII redaction 的情况下存储 tagged traces。Failure samples 会携带最糟糕的内容；存储前要 scrub。

Refusal rules：

- 如果用户想要“all traces stored forever”，出于成本 + compliance 原因拒绝。按 tag + rate 进行采样。
- 如果产品没有 “known good” baseline，拒绝 drift alerts。Drift 需要 reference。
- 如果 detectors 没有 versioned，拒绝。Detector regressions 会在没有提醒的情况下破坏你的 signal。

输出：`detectors.py`、`tagger.py`、`alerts.py`、`retention.py`、`README.md`，解释 thresholds、retention policy、alert routing。最后以“接下来读什么”结尾，指向 Lesson 24（observability backends）或 Lesson 27（prompt injection）以了解 adversarial failure modes。
