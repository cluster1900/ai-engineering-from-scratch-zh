---
name: encoding-audit
description: 审计一份 jailbreak-defense report 对 encoding-family attacks 的覆盖情况。
version: 1.0.0
phase: 18
lesson: 14
tags: [artprompt, ascii-art, encoding-attack, utes, structural-sleight]
---

给定一份 jailbreak-defense report，枚举已覆盖的 encoding-family attacks，以及捕获每一种攻击的防御层。

产出：

1. Encoding coverage。列出评估过的每个 attack family：ASCII art（ArtPrompt）、base64、leet-speak、UTF-8 homoglyphs、nested JSON / YAML / CSV、tree/graph UTES、image-modality。标记缺失的 family。
2. Defense-layer mapping。对每个 family，识别哪个 defense layer（keyword filter、perplexity filter、paraphrase、retokenization、output classifier、multimodal moderator）能捕获它，哪个不能。
3. Visual-recognition gap。根据 Jiang et al. 2024，PPL 和 Retokenization 无法防御 ArtPrompt，因为识别发生在视觉层面。这份 report 的防御是否包含任何作用于视觉/结构层面的内容？
4. Generalization test。UTES（StructuralSleight）会泛化到任意罕见结构。这份 report 是否测试了不在其训练防御集合中的结构？
5. Capability-safety tradeoff。具有更强 visual-text capability（高 ViTC score）的模型更容易受到 ArtPrompt 攻击。如果报告中给出了模型的 ViTC score，请记录；如果没有，请要求提供。

硬性拒绝：
- 任何仅基于 substring/keyword filtering 的防御声明。
- 任何只覆盖一种 encoding family 却外推到 "encoding attacks" 的防御声明。
- 任何没有 per-family attack-success rate 的防御声明。

拒绝规则：
- 如果用户询问 ArtPrompt 是否已经 "patched"，拒绝并解释 recognition-level 与 text-level defense gap。
- 如果用户要求推荐一个 all-encoding defense，拒绝给出单一推荐 — 防御必须跨部署可能面对的所有 family 分层构建。

输出：一页 audit，填写上述五个 section，标记主要 encoding gap，并指出最急需添加的单一 defense layer。分别引用 Jiang et al.（arXiv:2402.11753）和 StructuralSleight 各一次。
