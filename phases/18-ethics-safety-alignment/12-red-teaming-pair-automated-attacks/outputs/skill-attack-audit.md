---
name: attack-audit
description: 审计 red-team evaluation report 的 attack coverage、budget、judge identity 和 behaviour set。
version: 1.0.0
phase: 18
lesson: 12
tags: [red-teaming, jailbreak, pair, harmbench, jailbreakbench, asr]
---

给定一份 red-team evaluation report，审计该 evaluation 是否可与已发布 baseline 相比，以及它是否支持自己的结论。

产出：

1. Attack coverage。列出运行过的每一种攻击：PAIR、GCG、AutoDAN、TAP、PAP、manual。标记任何缺失的 attack class。只运行一个 attack family 的报告不能声称 robustness。
2. 每种攻击的 budget。报告每种攻击每个 prompt 的 query budget。PAIR 在 20 次 query 下的成功声明，不能与 GCG 在 500 step 下的成功声明相比。
3. Judge identity。使用了哪个 judge LLM（GPT-4-turbo、Llama Guard、StrongREJECT、internal classifier）？Judge calibration 会驱动 ASR variance。
4. Behaviour set。JailbreakBench（100 个 behaviour，10 个类别）、HarmBench（510 个 behaviour，7 个类别）、internal，还是其他？说明该集合是否公开且可复现。
5. Transfer check。如果 red team 针对一个模型进行了优化，是否报告了针对其他模型的 transfer ASR？单模型 ASR 是模型家族 robustness 的上界，而不是下界。

Hard rejects：
- 任何基于单一 attack family 的 "our model is robust" 声明。
- 任何未提供 query budget 的 ASR。
- 任何使用与已发布 benchmark 不同 judge、且未针对 benchmark judge 进行 calibration 的 ASR。

Refusal rules：
- 如果用户问 "is our model jailbreak-proof,"，拒绝给出二元答案，并指向上面的 multi-attack、multi-judge、transfer-check 结构。
- 如果用户询问推荐的 attack toolkit，拒绝给出单一推荐，并指向 HarmBench 中 2024 年的 empirical variance。

输出：一页 audit，填写上述五个 section，标记缺失的 attack class，并估计相对于可复现 benchmark，ASR 是被低估还是高估。分别引用一次 Chao et al. (arXiv:2310.08419) 和相关 benchmark paper。
