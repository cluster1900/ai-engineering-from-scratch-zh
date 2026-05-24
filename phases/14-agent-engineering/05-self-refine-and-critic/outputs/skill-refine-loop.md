---
name: refine-loop
description: 根据 task、verifier availability 和 iteration budget 配置 evaluator-optimizer（Self-Refine / CRITIC）loop。
version: 1.0.0
phase: 14
lesson: 05
tags: [self-refine, critic, evaluator-optimizer, guardrails, iteration]
---

给定一个 task、一个 iteration budget，以及可用的 verifier 类型（tool-grounded 或仅 self-eval），输出用于 evaluator-optimizer loop 的 prompts 和 stop policy。

生成：

1. Generator prompt。用于首次输出的确定性 producer。明确说明 task、output format 和 constraints。
2. Evaluator/verifier prompt。如果有可用工具（search、code run、tests、calculator、type check），说明如何调用它们，以及如何生成 structured critique（JSON 包含：pass/fail、violations[]、suggested_fixes[]）。如果只有 self-eval 可用，明确标注 Self-Refine 的 rubber-stamp 风险，并使用结构上不同的 prompt style（例如 adversarial “find at least one flaw”）。
3. Refiner prompt。必须引用先前 outputs 和 critiques（history）。声明 “do not repeat a failure mode flagged in prior iterations” 是强制要求。
4. Stop policy。合取条件：verifier 通过，或（self-eval 说 fine 且 iterations >= 2），或 iterations >= max_iterations。绝不能只有单一条件。
5. Observability hooks。按照 Lesson 23，将每次 iteration 记录为 OpenTelemetry GenAI span（evaluate、optimize），这样完整 refine trajectory 可审计。

硬性拒绝：

- generator 和 critic 使用相同 prompt。Rubber-stamp 风险：model 会同意自己。
- 没有 iteration cap。无限 refine loops 会消耗 Token；默认始终 cap at 4。
- verifier prompt 要求 freeform prose feedback。只能使用 structured JSON：pass/fail 加逐项 violations。
- 从 refiner prompt 中删除 history。paper 表明，没有 history 时质量会崩塌。

拒绝规则：

- 如果 task 没有 verifier，也没有方式构建 verifier，拒绝 CRITIC，并说明 Self-Refine 是可用但更弱的选项，同时提醒用户 rubber-stamp 风险。
- 如果 max_iterations >= 10，拒绝并建议重新架构 task。超过 3-4 次 pass 仍试图 refine-to-convergence，通常说明 generator prompt 是错的。
- 如果 verifier 调用破坏性工具（shell、git write），拒绝并要求 sandbox boundary（Lesson 09）。

Output：一个包含所有 prompts、stop policy 和 tool list 的单一 configuration block，外加一个 “what to read next” note，根据 deployment target 指向 Lesson 16（OpenAI Agents SDK guardrails）、Lesson 12（Anthropic evaluator-optimizer）或 Lesson 30（eval-driven agent development）。
