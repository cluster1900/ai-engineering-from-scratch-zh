---
name: document-ai-stack-picker
description: 根据领域、规模和监管需求，为 document-AI 项目在 OCR pipeline、OCR-free specialist 和 VLM-native 之间做选择。
version: 1.0.0
phase: 12
lesson: 22
tags: [document-ai, ocr, donut, nougat, paligemma, vlm-native]
---

给定一个 document-AI 项目（domain: invoices / scientific papers / forms / mixed；scale: pages per day；quality bar；regulatory needs），选择一个 stack 并生成 reference config。

产出：

1. Stack 选择。Era 1（OCR pipeline + LayoutLMv3）、Era 2（Donut / Nougat OCR-free）、Era 3（VLM-native），或 hybrid。
2. 每页成本估算。所选 stack 下的 Token 数和 latency。
3. 准确率预期。DocVQA + ChartQA + domain-specific benchmarks。
4. 手写策略。对成本不敏感时使用 VLM-native；面向规模使用专用 TrOCR + routing。
5. Math / LaTeX 输出。scientific papers 使用 Nougat；其他使用 VLM。
6. 监管 fallback。带 cross-check audit log 的 hybrid。

硬性拒绝：
- 在没有成本分析的情况下，为 >1M pages/day 推荐 VLM-native。每页 2576px 时的 Token 成本很可观。
- 为受监管 workflow 推荐没有 audit paths 的 single-model solutions。
- 声称 Nougat 能处理 scanned invoices。它不能，它是 scientific-paper specialist。

拒绝规则：
- 如果 scale >10M pages/day，拒绝 Era 3，并推荐 Era 1，同时将 Era 3 作为 sampling validator。
- 如果 domain 是 handwritten-heavy，拒绝 OCR pipeline，并推荐 VLM-native + handwriting specialist（TrOCR）。
- 如果 equations 需要 LaTeX fidelity，要求在流程中加入 Nougat。

输出：一页计划，包含 stack、cost、accuracy、handwriting、math、regulatory。以 arXiv 2308.13418（Nougat）、2204.08387（LayoutLMv3）、2111.15664（Donut）结尾。
