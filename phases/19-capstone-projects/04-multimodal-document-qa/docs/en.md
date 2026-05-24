# Capstone 04 — Multimodal Document QA（Vision-First PDF、表格、图表）

> 2026 年的 document-QA 前沿已经从 OCR-then-text 转向 vision-first late interaction。ColPali、ColQwen2.5 和 ColQwen3-omni 将每个 PDF 页面视为图像，用 multi-vector late interaction 对其进行 Embedding，并让 query 直接 attend 到 patches。对于财务 10-K、科学论文和手写笔记，这种模式大幅优于 OCR-first。请在 10k 页面上端到端构建 pipeline，并发布与 OCR-then-text 的并排对比。

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (viewer UI)
**Prerequisites:** Phase 4 (computer vision), Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:** P4 · P5 · P7 · P11 · P12 · P17
**Time:** 30 小时

## 问题
企业拥有大量会被 OCR pipeline 搞乱的 PDF：带旋转表格的扫描版 10-K、充满公式的科学论文、只有作为图像才有意义的图表、手写批注。把这些内容按 text-first 处理，意味着丢失一半信号。2026 年的答案是在原始页面图像上做 late-interaction multi-vector retrieval。ColPali (Illuin Tech) 引入了这种方法；ColQwen2.5-v0.2 和 ColQwen3-omni 推高了准确率。在 ViDoRe v3 上，vision-first retrieval 的得分以有意义的幅度高于 OCR-then-text，并且在图表、表格和手写内容上差距会扩大。

代价是存储和延迟。ColQwen Embedding 每页约有 2048 个 patch Vector，而不是单个 1024-dim Vector。原始存储会膨胀。DocPruner (2026) 可在无可测准确率损失的情况下带来 50% pruning。你将索引 10k 页面，测量 ViDoRe v3 nDCG@5，在 2s 内提供答案，并与 OCR-then-text baseline 直接比较。

## 概念
Late interaction 意味着每个 query Token 都会与每个 patch Token 打分，然后对每个 query Token 取最大分并求和。这样无需单个 pooled Vector，也能获得细粒度匹配。multi-vector index（Vespa、Qdrant multi-vector 或 AstraDB）存储 per-patch Embeddings，并在 retrieval 时运行 MaxSim。

answerer 是一个 vision-language model，它接收 query 和 top-k 检索页面图像，并输出带 evidence regions（bounding boxes 或 page references）的答案。Qwen3-VL-30B、Gemini 2.5 Pro 和 InternVL3 是 2026 年的前沿选择。对于公式和科学记号，会把 OCR fallback（Nougat、dots.ocr）作为可选文本通道拼接进来。

评估是一个二维 Matrix。一个轴是内容类型（纯文本段落、密集表格、柱状/折线图、手写笔记、公式）。另一个轴是 retrieval approach（vision-first late interaction vs OCR-then-text vs hybrid）。每个单元格得到 nDCG@5 和 answer accuracy。报告就是交付物。

## 架构
```
PDFs -> page renderer (PyMuPDF, 180 DPI)
           |
           v
  ColQwen2.5-v0.2 embed (multi-vector per page, ~2048 patches)
           |
           +------> DocPruner 50% compression
           |
           v
   multi-vector index (Vespa or Qdrant multi-vector)
           |
query ----+----> retrieve top-k pages (MaxSim)
           |
           v
  VLM answerer: Qwen3-VL-30B | Gemini 2.5 Pro | InternVL3
    inputs: query + top-k page images + optional OCR text
           |
           v
  answer with cited page numbers + evidence regions
           |
           v
  Streamlit / Next.js viewer: highlighted boxes on source page
```

## 技术栈
- 页面渲染: PyMuPDF (fitz)，180 DPI，portrait-normalized
- Late-interaction model: ColQwen2.5-v0.2 或 ColQwen3-omni（Hugging Face 上的 vidore team）
- Index: 带 multi-vector field 的 Vespa，或 Qdrant multi-vector，或带 MaxSim 的 AstraDB
- Pruning: DocPruner 2026 policy（保留 high-variance patches，50% compression 且 accuracy loss < 0.5%）
- OCR fallback（公式 / 密集表格）：dots.ocr 或 Nougat
- VLM answerer: self-hosted Qwen3-VL-30B 或 hosted Gemini 2.5 Pro；InternVL3 作为 fallback
- Evaluation: ViDoRe v3 benchmark，M3DocVQA 用于 multi-page reasoning
- Viewer UI: Next.js 15，使用 canvas overlay 显示 evidence regions

## 构建它
1. **Ingest.** 遍历一个包含 10k PDF 页面的语料库，覆盖 10-K、科学论文和扫描文档。将每页渲染为 1536x2048 PNG。持久化 `{doc_id, page_num, image_path}`。

2. **Embed.** 在每个页面图像上运行 ColQwen2.5-v0.2。输出形状约为 2048 个 dim 128 的 patch Embeddings。应用 DocPruner 保留信号最强的一半。写入 Vespa multi-vector field 或 Qdrant multi-vector。

3. **Query.** 对每个传入 query，使用 query tower 进行 Embedding（token-level embeddings）。对 index 运行 MaxSim：对每个 query Token，在 page patch Embeddings 上取最大 dot-product 并求和。返回 top-k 页面。

4. **Synthesize.** 用 query 和 top-5 页面图像调用 Qwen3-VL-30B。Prompt: "Answer using only the supplied pages. Cite each claim by (doc_id, page) and name the region (figure, table, paragraph)."

5. **Evidence regions.** 对答案进行 post-process，提取被引用的 regions。如果 VLM 输出 bounding boxes（Qwen3-VL 会这样做），就在 viewer 中把它们渲染为 overlays。

6. **OCR fallback.** 对被识别为公式密集的页面（基于图像方差的 heuristic），运行 Nougat 或 dots.ocr，并将 OCR text 作为额外通道与图像一起传入。

7. **Eval.** 运行 ViDoRe v3（retrieval nDCG@5）和 M3DocVQA（multi-page QA accuracy）。还要在相同语料库上使用相同 synthesizer 运行 OCR-then-text pipeline。产出一个 content-type × approach Matrix。

8. **UI.** 先做 Streamlit prototype；再做 Next.js 15 production viewer，支持逐页 evidence-region overlay。

## 使用它
```
$ doc-qa ask "what was the 2024 operating margin change for segment EMEA?"
[retrieve]   top-5 pages in 320ms (ColQwen2.5, MaxSim, Vespa)
[synth]      qwen3-vl-30b, 1.4s, cited (form-10k-2024, p. 88) + (..., p. 92)
answer:
  EMEA operating margin moved from 18.2% to 16.8%, a 140bp decline.
  cited: 10-K-2024.pdf p.88 (Table 4, Segment Operating Margin)
         10-K-2024.pdf p.92 (MD&A, Operating Performance)
[viewer]     open with highlighted bounding boxes overlaid on p.88 Table 4
```

## 交付它
`outputs/skill-doc-qa.md` 描述交付物：一个 vision-first multimodal document QA system，针对特定语料库调优，并在 ViDoRe v3 上与 OCR-then-text baseline 进行评估。

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | ViDoRe v3 / M3DocVQA accuracy | Benchmark numbers vs OCR-text baseline and published leaderboard |
| 20 | Evidence-region grounding | 被引用 regions 中实际包含 answer span 的比例 |
| 20 | Storage and latency engineering | DocPruner compression ratio、index p95、answer p95 |
| 20 | Multi-page reasoning | 在手工标注的 100-question multi-page set 上的 accuracy |
| 15 | Source-inspection UX | Viewer clarity、overlay fidelity、side-by-side comparison tools |
| **100** | | |

## 练习
1. 在同一语料库上测量 ColQwen2.5-v0.2 vs ColQwen3-omni。哪些页面一个能答对而另一个会漏掉？向 index 添加一个 "content class" tag，用于按类型 route。

2. 激进地 prune Embeddings（75%、90%）。找到 compression cliff：ViDoRe nDCG@5 下降到 OCR baseline 以下的点。

3. 构建 hybrid：并行运行 OCR-then-text 和 ColQwen，用 RRF 融合，再用 cross-encoder rerank。hybrid 是否优于单独任一方法？它在哪些地方帮助最大？

4. 将 Qwen3-VL-30B 替换为更小的 VLM（Qwen2.5-VL-7B）。测量 accuracy-per-dollar 曲线。

5. 添加 handwritten-note support。渲染 handwriting corpus，用 ColQwen 进行 Embedding，测量 retrieval。与 handwriting OCR pipeline 对比。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Late interaction | "ColPali-style retrieval" | Query tokens 独立地与页面 patches 打分；MaxSim 聚合 |
| Multi-vector | "Per-patch embedding" | 每个文档有多个 Vector，而不是一个 pooled Vector |
| MaxSim | "Late-interaction scoring" | 对每个 query Token，在 document vectors 上取最大相似度；求和 |
| DocPruner | "Patch compression" | 2026 年的 pruning 方法，保留 50% patches 且 accuracy loss 可忽略 |
| ViDoRe v3 | "Document-retrieval benchmark" | 2026 年衡量 visual-document retrieval 的标准 |
| Evidence region | "Cited bounding box" | source page 上定位 answer span 的 bbox |
| OCR fallback | "Equation channel" | 与 vision 一起用于公式密集或表格密集页面的 text pipeline |

## 延伸阅读
- [ColPali (Illuin Tech) repository](https://github.com/illuin-tech/colpali) — late-interaction 文档检索参考
- [ColPali paper (arXiv:2407.01449)](https://arxiv.org/abs/2407.01449) — 基础方法论文
- [ColQwen family on Hugging Face](https://huggingface.co/vidore) — production-ready checkpoints
- [M3DocRAG (Adobe)](https://arxiv.org/abs/2411.04952) — multi-page multimodal RAG baseline
- [Vespa multi-vector tutorial](https://docs.vespa.ai/en/colpali.html) — reference serving stack
- [Qdrant multi-vector support](https://qdrant.tech/documentation/concepts/vectors/#multivectors) — alternate index
- [AstraDB multi-vector](https://docs.datastax.com/en/astra-db-serverless/databases/vector-search.html) — alternate managed index
- [Nougat OCR](https://github.com/facebookresearch/nougat) — equation-capable OCR fallback
