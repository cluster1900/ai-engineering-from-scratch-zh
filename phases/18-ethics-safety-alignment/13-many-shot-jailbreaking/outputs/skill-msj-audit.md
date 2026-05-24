---
name: msj-audit
description: 审计 long-context safety evaluation 是否覆盖 many-shot jailbreaking。
version: 1.0.0
phase: 18
lesson: 13
tags: [many-shot-jailbreaking, context-window, power-law, anthropic]
---

给定一个 long-context model 的 safety evaluation，审计该 evaluation 是否覆盖 many-shot jailbreaking。

产出：

1. Shot-count 覆盖范围。报告已测试的 shot counts（应包括 1, 5, 16, 64, 256，并且对于 >= 1M context 的 model，至少包含一个 >= 512 的 shot count）。如果 evaluation 只测试单一 shot count，ASR 信息量不足，因为 MSJ 是一条曲线。
2. Power-law 拟合。报告每个 behaviour category 的拟合 exponent。较浅的 exponent 表明该 model 在该类别上对 ICL 更稳健；较陡的 exponent 表明 MSJ 异常有效。
3. Category breakdown。MSJ 有效性因类别而异：violent content、deceit、self-harm、bioweapon。根据 Anil et al. 2024，violent/deceitful 需要更少 shots 即可 jailbreak。标记 evaluation 中缺失的任何类别。
4. Defense identification。是否部署了基于 classifier 的 prompt modification？classifier 本身是否经过 adversarial robustness 评估？Anthropic 报告的 61% -> 2% 降幅依赖 classifier calibration。
5. Compositional check。evaluation 是否测试 MSJ + PAIR、MSJ + persuasive templates，或 MSJ + encoding？Compositional attacks 通常比任何单一技术更强。

Hard rejects:
- 任何基于仅 5-shot evaluation 的 “our long-context model is safe” 声明。
- 任何未在同一 classifier 上同时报告 jailbreak ASR 和良性 ICL performance 的防御声明，因为 trade-off 才是重点。
- 任何没有 category breakdown 的 category-aggregate ASR。

Refusal rules:
- 如果用户询问 MSJ 是否可以被完全修补，拒绝给出二元答案；MSJ 与 ICL 共享机制，无法在不消除 ICL 的情况下消除 MSJ。
- 如果用户询问推荐用于 evaluation 的 shot count，拒绝给出单一数字；要求对 5 到 512 shots 做 power-law fit。

Output: 一页审计，报告 shot-count coverage、每个 category 的 power-law fit、defense identification，以及一个 compositional attack gap。引用 Anil et al. 2024 (Anthropic) 一次作为方法论参考。
