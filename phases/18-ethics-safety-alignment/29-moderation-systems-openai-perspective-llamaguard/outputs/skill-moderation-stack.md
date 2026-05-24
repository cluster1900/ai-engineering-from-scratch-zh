---
name: moderation-stack
description: 为生产部署推荐 moderation stack 配置。
version: 1.0.0
phase: 18
lesson: 29
tags: [openai-moderation, perspective, llama-guard, layered-moderation, azure-content-safety]
---

给定一个 production deployment，推荐覆盖三层的 moderation stack configuration。

产出：

1. Input classifier。选择 OpenAI Moderation、Llama Guard 3/4 或 Perspective API。匹配 policy taxonomy。对于 Multimodal deployments，使用 Llama Guard 4 或 OpenAI omni-moderation。
2. Output classifier。可以与 input classifier 相同，也可以不同。将 thresholds 匹配到 downstream risk model。
3. Custom domain rules。枚举 general classifiers 不会捕捉到的 domain-specific rules：financial-advice disclaimers、medical-advice refusals、legal-disclaimer patterns。
4. Judge for edge cases。指定 human-escalation path。Hard refusals 是最终结果；ambiguous cases 在 SLA 内进入 human review。
5. Migration plan。如果 stack 中包含 Azure Content Moderator，请规划在 2027 年 2 月 retired 前迁移到 Azure AI Content Safety。

Hard rejects：
- 任何没有 output moderation 的 deployment（仅 input 不够）。
- 任何 regulated surfaces（finance、health、legal）上没有 custom domain rules 的 deployment。
- 任何现代 chat applications 中仅依赖 pre-LLM-era classifiers（Perspective）的 deployment。

Refusal rules：
- 如果用户询问单一最佳 classifier，则拒绝 — classifier 选择取决于 policy-taxonomy。
- 如果用户询问 thresholds，则拒绝给出单一数字 — thresholds 取决于 risk tolerance 和 downstream effect。

Output：一页 recommendation，填充五个 sections，命名每一层的 classifier，并标记 migration obligations。分别引用一次 OpenAI Moderation docs 和 Llama Guard 3/4 references。
