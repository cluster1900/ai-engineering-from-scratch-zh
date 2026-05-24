---
name: llava-vibes-eval
description: 在 LLaVA-family VLM 上运行 10 个 prompt 的 vibes-eval，并生成一份人类可读的评分卡。
version: 1.0.0
phase: 12
lesson: 05
tags: [llava, vlm, vibes-eval, instruction-tuning]
---

给定一个 LLaVA-family VLM（LLaVA-1.5、LLaVA-NeXT、LLaVA-OneVision，或社区 fork）和一组测试图像，运行一个包含 10 个 prompt 的 smoke test，覆盖 captioning、VQA、reasoning、refusal 和格式合规性。生成一份评分卡，用于确认 projector 和 LLM 是否正确连接。

生成：

1. 十个 prompt 及其预期行为描述：
   - 三个 captioning（简短、详细、创意）。
   - 三个 VQA（计数、颜色、物体是否存在）。
   - 两个 reasoning（比较两个区域、因果关系）。
   - 两个 refusal（私人个体、PII 识别）。
2. 每个 prompt 的评分。Pass / partial / fail，并附一行理由。
3. 整体模式诊断。如果 captioning 通过但 VQA 失败，怀疑 stage-2 数据混合有问题。如果详细 captioning 出现 hallucination，怀疑 ShareGPT4V-style 数据不足。如果 refusals 失败，标记 safety-data 缺口。
4. 分辨率检查。运行一个需要 OCR 的 prompt，先用 336x336 base，再用 AnyRes；记录差异。低分辨率失败是预期现象；高分辨率失败意味着 AnyRes 配置错误。
5. 建议后续行动。如果特定类别失败，给出调用方可以运行的三项具体训练数据补充。

硬性拒绝：
- 只用 benchmark 分数给 VLM 评分，而不同时运行 vibes suite。Benchmarks 可以被刷分；vibes 揭示真实部署就绪度。
- 将 hallucination 与风格化冗长混为一谈。明确标出哪些物体是被编造出来的，而哪些只是描述得更详细。
- 在 reasoning prompts 上只检查最终答案、不检查 reasoning chain，却声称通过。

Refusal 规则：
- 如果调用方要求对 proprietary VLM（Gemini、Claude、GPT-5V）做 vibes-eval 但没有 API access，拒绝——该测试需要真实 inference。
- 如果目标用例是医疗诊断或法律建议，拒绝——vibes-eval 不是认证，不能用于高风险领域。
- 如果没有提供图像，拒绝——该测试按定义是基于图像的。

输出：一份包含 10 行的评分卡（prompt、image、expected、actual、pass/partial/fail）、一个整体模式诊断，以及一个三项后续行动列表。最后用一个 "what to read next" 段落结尾：对于分辨率相关失败，指向 Lesson 12.06（AnyRes）；对于数据混合调优，指向 Lesson 12.07（ablations）。
