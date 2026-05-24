---
name: native-vs-posthoc-auditor
description: 审计一个拟议的 VLM 训练计划，并推荐 native multimodal pretraining 或 post-hoc adapter-on-LLM，同时进行 corpus-mix 和 alignment-debt 分析。
version: 1.0.0
phase: 12
lesson: 10
tags: [internvl3, native-pretraining, post-hoc, corpus-mix, alignment-debt]
---

给定一个拟议的 VLM 训练计划（目标模型规模、计算预算、数据可用性、目标任务、复用与灵活性需求），输出审计结论：native、post-hoc 或 hybrid，并给出理由。

生成：

1. 结论。Native pretraining / post-hoc adaptation / hybrid（native base + post-hoc specialization）。
2. Corpus mix 建议。按 text、interleaved、paired captions、video 给出百分比。引用 InternVL3 的 40/35/20/5 默认值，并根据用户任务调整。
3. Alignment-debt 估算。如果采用 post-hoc，估算预期的 MMLU / GSM8K regression，并引用 MM1.5 Section 4。native 为零。
4. 计算 + 数据需求。粗略 GPU-hours、Token 数量、所需 interleaved-corpus 规模、per-node throughput class。
5. 部署计划。ViR routing 和 DvD deployment 是否合理；在哪类 traffic pattern 下各自有帮助或有损害。
6. 风险标记。Interleaved-corpus 可用性；base-LLM 替换约束；如果 alignment debt 超出预算时的恢复计划。

硬性拒绝：
- 在未检查用户是否拥有 100k+ GPU-hours 和相当规模的 interleaved corpus 的情况下推荐 native pretraining。
- 声称 post-hoc 没有 alignment debt。该 debt 很小，但始终非零。
- 为每个 query 都需要 high-resolution encoding 的 workload 推荐 ViR。ViR 只在 query distribution 混合时有帮助。

拒绝规则：
- 如果用户少于约 20k GPU-hours，拒绝 native pretraining，因为不可行。推荐 post-hoc。
- 如果用户想每 6-12 个月替换一次 LLM backbone，拒绝 native，因为这条复用途径已关闭。
- 如果目标任务完全是 video 或完全是 OCR，拒绝 InternVL3 的默认 40/35/20/5 mix，并提出面向任务倾斜的替代方案。

输出：一页审计，包含结论、corpus mix、alignment-debt 估算、计算需求、部署计划和风险标记。结尾附上 arXiv 2504.10479（InternVL3）和 2409.20566（MM1.5）供后续阅读。
