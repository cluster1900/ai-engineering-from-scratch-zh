---
name: doc-qa
description: 在 10k 页规模上构建一个 vision-first Multimodal 文档 QA 系统，使用 late-interaction retrieval 和证据区域引用。
version: 1.0.0
phase: 19
lesson: 04
tags: [capstone, multimodal, rag, colpali, colqwen, late-interaction, pdf]
---

给定一个 PDF 语料库（10-K、科学论文、扫描文档），构建一个 pipeline，使用 ColPali 风格的 late interaction 将页面索引为图像，并通过页面级证据区域回答问题。

构建计划：

1. 使用 PyMuPDF 以 180 DPI 将每个 PDF 页面渲染为 1536x2048 PNG。
2. 使用 ColQwen2.5-v0.2 或 ColQwen3-omni 对每个页面进行 Embedding。将 multi-vector patch embeddings 存储到 Vespa、Qdrant multi-vector 或 AstraDB 中。
3. 应用 DocPruner 风格的 50% patch pruning。验证在 ViDoRe v3 上准确率下降保持在 0.5% 以下。
4. 查询时：对 query tokens 进行 Embedding；对每个页面的 patches 计算 MaxSim；排序 top-k。
5. 使用 Qwen3-VL-30B 或 Gemini 2.5 Pro 进行合成，传入查询和 top-5 页面图像。要求引用 `(doc_id, page, region)` 锚点。
6. 对于公式或表格密集的页面，可选运行 Nougat 或 dots.ocr 作为文本通道，并将其与图像一起输入。
7. 构建一个 Next.js 15 viewer，在源页面上以 bounding boxes 叠加显示证据区域。
8. 在 ViDoRe v3 和 M3DocVQA 上评估。产出一个内容类别 × 方法 Matrix，比较 vision-first 与 OCR-then-text 在纯文本、表格、图表、手写内容和公式上的表现。

评估 rubric：

| Weight | Criterion | Measurement |
|:-:|---|---|
| 25 | ViDoRe v3 / M3DocVQA 准确率 | 在匹配页面上与 OCR-then-text baseline 进行 Benchmark |
| 20 | 证据区域 grounding | 被引用区域中包含答案 span 的比例 |
| 20 | 存储与延迟工程 | DocPruner compression、index p95、answer p95 低于 2s |
| 20 | 多页推理 | 在手工标注的 100 个问题多页集合上的准确率 |
| 15 | 来源检查 UX | 叠加层保真度、对比工具、逐页 explorer |

硬性拒收：

- 将 OCR 文本改装进 single-vector Embedding，却声称是 “vision-first” 的 OCR-first pipelines。
- 任何丢弃 patch 级 bounding boxes、因此无法渲染证据叠加层的系统。
- 未记录 DocPruner settings 就报告存储数字。

拒绝规则：

- 在没有专门 redaction policy 的情况下，拒绝索引扫描版法律合同。ColQwen embeddings 会泄露内容。
- 拒绝服务针对用户未披露语料库的查询。受监管领域必须有 audit trail。
- 拒绝在未对同一语料库运行两条 pipelines 的情况下与 OCR-then-text 进行比较。

输出：一个 repo，包含 ingestion pipeline、Vespa（或 Qdrant multi-vector）config、100 个问题的多页 eval set、viewer UI，以及一份 write-up，其中包含内容类别 x 方法 Matrix，并对 2026 年哪些内容类别仍然更适合 OCR-then-text 给出具体建议。
