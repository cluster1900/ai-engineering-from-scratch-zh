---
name: mast-auditor
description: 对 multi-agent system 运行 MAST-style failure-mode audit。将 execution-trace failures 分类为 Specification / Coordination / Verification 以及 Groupthink families；按预期 failure reduction 对 mitigations 排名。
version: 1.0.0
phase: 16
lesson: 23
tags: [multi-agent, failure-modes, MAST, groupthink, circuit-breaker, audit]
---

给定一个 multi-agent system 和抽样的 execution traces，运行一次 failure-mode audit。

产出：

1. **Sample construction。** 至少 200 条来自生产的 traces，按 task types 和 time windows 均匀抽样。记录 sampling method 和 bias risks。
2. **Classification pass。** 对每条 trace，标记 `success | failure`。对于 failures，分配一个 MAST category（spec / coord / verify），并在适用时分配一个或多个 Groupthink family tags（monoculture / conformity / tom / mixed-motive / cascade）。
3. **Distribution table。** 按 MAST category 和 Groupthink tag 统计 counts 与 percentages。与 Cemri 2025 的 reference distribution（41.77 / 36.94 / 21.30）比较。与 reference 严重偏离的系统通常存在特定的薄弱 layer。
4. **Top failure patterns。** 识别 3 个最常见的具体 patterns（例如，“two agents both review”）。记录 reproduction steps。
5. **Mitigation ranking。** 对每个 top pattern，从 standard library 中提出一个 mitigation：explicit role contracts、versioned shared state、independent verifier、circuit breaker、detection-diagnosis-validation（STRATUS）trio。根据该 pattern 的 frequency，按预期 failure reduction 排名。
6. **Risk of silent failures。** 有多少 failures 产生 plausible-but-wrong outputs，而不是 loud errors？Silent rate 决定 verification-layer investment。
7. **Slow-failure proxies。** 推荐 2-3 个 live metrics，用于在 drift 变成 loud error 前暴露它：agreement rate、retry-rate、output-length distribution、inter-agent edit distance。

Hard rejects：

- 没有 random 或 stratified sample 的 audits。Hand-picked failures 会过度代表戏剧性 cases，并漏掉 slow-failure drift。
- 没有 baseline measurement 的 mitigation recommendations。“Add a verifier”没有意义，除非已知当前 failure rate。
- 忽略 MAST-unknown incidents。如果某条 trace 不适合任何 category，说明 taxonomy 不完整；应提出 extension，而不是强行归类。
- 声称 quarterly audit 足够，却没有 operational slow-failure monitoring。季度 audit 会漏掉 audits 之间的 drift。

Refusal rules：

- 如果 traces 缺少 per-agent attribution（谁写了什么，谁读了什么），audit 无法区分 coordination failures 和 role conflicts。建议添加 structured per-agent logging 后再重新 audit。
- 如果系统总共少于 50 条 failed traces，sample 太小，无法生成 distribution estimates。建议延长 observation window。
- 如果 traces 包含 PII，分析前先 mask。

Output：一份三页报告。以一句话摘要开头（“41% spec failures, 12% coordination, 39% verification gaps, 8% unknown; top pattern is dual-reviewer conflict; highest-ROI mitigation is explicit role contracts.”），然后给出上面的七个 sections。以 prioritized action list 结尾：三个 mitigations，包含 estimated implementation cost 和 expected failure-rate reduction。
