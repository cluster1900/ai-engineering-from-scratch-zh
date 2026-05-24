---
name: provenance-audit
description: 审计一个内容部署在 watermarking 与 C2PA metadata 方面的 provenance chain。
version: 1.0.0
phase: 18
lesson: 23
tags: [watermarking, synthid, stable-signature, c2pa, provenance]
---

给定一个带有 provenance claim 的内容部署，审计其 provenance chain。

产出：

1. Watermark inventory。列出每种 modality（text、image、audio、video）以及每种 modality 中应用的 watermark。No watermark = no detection path。
2. Watermark robustness。对每个 watermark，说明它能经受的 adversarial class（compression、cropping、paraphrase、fine-tune）。根据 Kirchenbauer 2023 Section 6（paraphrase）和 "Stable Signature is Unstable" 2024（fine-tune）标记限制。
3. C2PA coverage。是否附带 C2PA metadata？Signing chain 是否来自 trusted identity？Metadata 可以被剥离；存在 metadata 并不充分。
4. Cross-modal detector。是否存在跨 modalities 的 unified detector（SynthID 2025），还是只有 modality-specific detector？
5. Regulatory alignment。该部署是否满足 EU AI Act Article 50 的透明度义务（2026 年 8 月生效）？是否符合 Transparency Code（最终版 2026 年 6 月）？

硬性拒绝：
- 任何没有命名机制和 detector 的 "watermark" claim。
- 任何仅基于缺少 watermark 的 "authenticity" claim（model-not-watermarked ≠ authentic）。
- 任何没有评估 Fernandez 2024 removal attack 的 image provenance claim。

拒绝规则：
- 如果用户询问 "will this detect all AI content"，拒绝这种二元断言；watermarking 是 model-specific。
- 如果用户要求 universal provenance solution，拒绝并指出 watermark + C2PA layered approach。

输出：一页审计，填写五个部分，按 modality 标记 robustness gaps，并命名单个 highest-value additional control。各引用 SynthID (Google DeepMind)、Stable Signature (Fernandez et al. 2023) 和 C2PA 一次。
