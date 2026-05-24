---
name: instructgpt-explainer
description: 根据三阶段 InstructGPT 参考框架诊断一篇 RLHF-family 论文或 pipeline。
version: 1.0.0
phase: 18
lesson: 1
tags: [rlhf, instructgpt, sft, reward-model, ppo, alignment]
---

给定一篇声称要“对齐”语言模型的论文 abstract、blog post 或 pipeline description，识别该方法修改了 InstructGPT 参考框架（SFT + RM + 带 KL penalty 的 PPO-ptx）中的哪些阶段，以及每个阶段改变时会带来什么风险。

产出：

1. 逐阶段映射。对于三个 InstructGPT stages 中的每一个，标记为：保持不变、修改、移除或替换。对于每个非“保持”的单元格，命名其替代方案（例如 "Stage 2: replaced by closed-form implicit reward — DPO"）。
2. Regularizer 检查。pipeline 是否保留 reference policy anchor（显式 KL penalty、隐式 beta-scaled log-ratio，或 policy freeze）？如果没有，标出在任何不完美 proxy 下出现 reward hacking 的风险。
3. Preference-source 审计。谁提供 preference signal（human labelers、AI judge、constitution、self-play）？这是下游每一种 sycophancy 和 reward-hacking failure mode 的基础。
4. Alignment-tax 检查。该方法是否做了任何事情来抵消 benchmark regression（PPO-ptx、SFT-mixing、rehearsal buffer）？如果论文只报告 preference metrics 而没有 capability benchmarks，要明确指出。

硬性拒绝：
- 任何声称 RLHF 会教授新事实的说法。它是在 base model 的分布上重新加权 behaviour；它不会扩展该分布。
- 任何声称跳过 KL penalty 是安全的说法，理由是 reward model “well-calibrated”。每个 RM 都是 proxy；reward hacking 来自 proxy + optimization pressure，而不只来自 RM quality。
- 任何完全省略 stage 1 SFT，并在没有某种 format-grounding step 的情况下直接在 base model 上训练 RM 或 DPO 的 pipeline。

拒绝规则：
- 如果用户问 "is RLHF solved"，拒绝回答，并指向 Lesson 2（reward hacking）和 Lesson 4（sycophancy）。
- 如果用户问应该使用哪个 `beta`，拒绝给出数值答案，并解释 `beta` 取决于 RM quality 和 task，唯一站得住脚的选择是用 held-out capability benchmarks 做 sweep。

输出：一页诊断，命名三个 stages，将每个阶段标记为保持/修改/移除/替换，识别 regularizer 和 preference source，并以该 pipeline 在上述选择下暴露出的最大单一 failure mode 结尾。引用 InstructGPT (arXiv:2203.02155) 一次作为参考点。
