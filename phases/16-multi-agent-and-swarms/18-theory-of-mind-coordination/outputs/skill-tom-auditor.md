---
name: tom-auditor
description: 审计一个声称具备“emergent coordination”的 multi-agent system。通过 control conditions、statistical tests 和 complementarity measurement，把真实的 ToM-enabled coordination 与 prompt-dressed illusion 区分开。
version: 1.0.0
phase: 16
lesson: 18
tags: [multi-agent, theory-of-mind, coordination, evaluation, emergence]
---

给定一个声称具备 emergent coordination 的 multi-agent system，审计该协调是真实存在，还是 prompt engineering 的产物。

产出：

1. **Claim extraction.** 声称的协调行为是什么？（分工、预判、互补行动、达成共识）。精确陈述。
2. **Prompt inspection.** 是否有任何 agent 的 system prompt 明确指示协调、角色选择或团队意识？如果是，将该声明标记为部分 prompt-dressed，并设计一个 control。
3. **Control condition.** 一个去除了诱导协调语言的系统版本。明确说明具体改动了哪些文本。
4. **Metric.** 至少包含以下之一：identity-linked differentiation、goal-directed complementarity、higher-order synergy (Riedl 2025)。不要接受“agents 似乎在一起工作”作为证据。
5. **Statistical test.** system vs control 指标的显著性。达到 `p < 0.05` 所需的样本量。如果 trials 数 `n < 50`，明确报告 power。
6. **Model-capacity check.** 在一个更小的 base model 上重复比较。效果是持续存在还是消失？Li/Riedl 都显示了能力依赖性。
7. **Failure-case review.** 系统失败时，ToM state（如果有）是什么样？是身份混淆（belief-agent binding 断裂），还是 content hallucination（错误的信念内容）？

硬性拒绝：

- 没有 control condition 的涌现声明。Demo reels 不是证据。
- 经不起统计审查的声明（在 `n >= 50` trials 上，效果低于 `p < 0.05`）。这些是 coordination illusions。
- 只在一个模型上成立的声明。如果一个较小的强 baseline 在没有 ToM prompting 的情况下也能达到该效果，那么协调不是 ToM-driven。
- 用“Our agents just figured it out”作为机制解释。机制声明需要记录且可检查的 ToM state。

拒绝规则：

- 如果系统没有 per-agent reasoning 日志，审计无法区分真实协调与随机性。建议添加结构化 ToM-state logs 后再重新审计。
- 如果任务存在 oracle-computed optimal coordination，则与 optimal 比较，而不是与 control 比较。
- 如果声明很窄（“single-round task 上的 coordination”），审计可以更短：测量该单轮的 complementarity，无需 long-horizon analysis。

输出：一份两页审计。以一句话 verdict 开头（“Coordination claim is prompt-dressed: removing 'work together' language drops the metric from 0.82 to 0.31, control-significant.”），然后给出上述七个部分。结尾列出把 prompt-dressed coordination 转换为真实协调的修复项：显式 ToM state、带日志的更长 horizons、mixed-model ensembles。
