# ColPali 与 Vision-Native Document RAG

> 传统 RAG 会把 PDFs 解析成文本，切成 chunks，Embedding chunks，并存储 Vectors。每一步都会丢失信号：OCR 会丢掉 chart data，chunking 会打断 table rows，text embeddings 会忽略 figures。ColPali（Faysse et al., July 2024）提出了一个更简单的问题：为什么一定要提取文本？直接通过 PaliGemma 对 page image 做 Embedding，使用 ColBERT-style late interaction 做 retrieval，并保留文档携带的所有 layout、figures、fonts 和 formatting signal。已发布 benchmarks 显示：在 visually-rich documents 上，end-to-end accuracy 比 text-RAG 高 20-40%。ColQwen2、ColSmol 和 VisRAG 扩展了这一模式。本课会阅读 vision-native RAG thesis，并构建一个微型 ColPali-like indexer。

**Type:** Build
**Languages:** Python (stdlib, multi-vector indexer + MaxSim scorer)
**先修要求：** Phase 11 (LLM Engineering — RAG 基础), Phase 12 · 05 (LLaVA)
**Time:** ~180 minutes

## 学习目标

- 解释 bi-encoder retrieval（每个 document 一个 Vector）和 late-interaction retrieval（每个 document 多个 Vectors）的区别。
- 描述 ColBERT 的 MaxSim operation，以及 ColPali 如何将它从 text tokens 泛化到 image patches。
- 构建一个微型 ColPali-like indexer：page → patch embeddings → query-term embeddings 上的 MaxSim → top-k pages。
- 比较 invoices / financial reports use case 中的 ColPali + Qwen2.5-VL generator 与 text-RAG + GPT-4。

## 问题

PDFs 上的 text-RAG 会丢掉文档的大部分信息。financial report 的 Q3 revenue growth 通常在 chart 里；medical report 的 findings 在 annotated images 里；legal contract 的 signature block 是 layout fact，而不是 text fact。

text-RAG pipeline：

1. PDF → text via OCR / pdftotext。
2. Text → 300-500 Token chunks。
3. Chunk → bi-encoder Embedding（一个 Vector）。
4. User query → Embedding → cosine similarity → top-k chunks。
5. Chunks + query → LLM。

五个有损步骤。Charts 捕获不到。Tables 被 chunks 打断。Multi-column layout 被展平。Figure annotations 消失。

ColPali 的修复方式：跳过 OCR，直接对 page image 做 Embedding。使用 ColBERT-style late interaction 做 retrieval，让模型在 query time 关注细粒度 patches。

## 概念

### ColBERT (2020)

ColBERT（Khattab & Zaharia, arXiv:2004.12832）是一种 text retrieval 方法。它不是为每个 document 生成一个 Vector，而是为每个 Token 生成一个 Vector。在 query time：

- Query tokens 获得各自的 Embeddings（N_q Vectors）。
- Document tokens 获得 Embeddings（N_d Vectors，通常会 cached）。
- Score = 对 query tokens 求和，每个 query token 取所有 document tokens 中 cosine similarity 的最大值：Σ_i max_j cos(q_i, d_j)。

这就是 MaxSim operation。每个 query token 会“选择”最匹配的 document token。最终 score 是这些值的总和。

优点：recall 强，能处理 term-level semantics。缺点：每个 document 需要 N_d Vectors，storage 昂贵。

### ColPali

ColPali（Faysse et al., arXiv:2407.01449）将 ColBERT pattern 应用到 images。

- 每一页由 PaliGemma（ViT + language）编码为 patch embeddings：每页 N_p Vectors。
- 每个 user query（text）被编码为 query-token embeddings：N_q Vectors。
- Score = Σ_i max_j cos(q_i, p_j)，也就是在 query-text-tokens 和 page-image-patches 上做 MaxSim。
- 通过 total score retrieval top-k pages。

在 document-ingestion time：用 PaliGemma 对每一页做 Embedding，存储所有 patch embeddings。在 query time：对 query tokens 做 Embedding，对所有已存储的 page embeddings 计算 MaxSim，返回 top-k pages。

优点：在 visually rich documents 上，end-to-end 比 text-RAG 高 20-40%。每个 patch-vector 捕获局部 layout 和 content。

缺点：每页 N_p patches × 4-byte floats × D-dim Vectors = storage 增长很快。可通过 PQ / OPQ quantization 缓解。

### ColQwen2 和 ColSmol

ColQwen2（illuin-tech, 2024-2025）将 PaliGemma 替换为 Qwen2-VL。base encoder 更好，retrieval 更好。

ColSmol 是用于 local / edge use 的 smaller-scale variant。约 1B params 的 ColSmol retriever 可在 consumer GPU 上运行。

### VisRAG

VisRAG（Yu et al., arXiv:2410.10594）是另一种 variant：不是在 patches 上做 MaxSim，而是用 VLM 将每页 pool 成一个 Vector，然后做 bi-encoder retrieve。Indexing 更快，storage 更小，但 recall 更弱。

quality-vs-cost trade-off：质量优先用 ColPali，规模优先用 VisRAG。

### M3DocRAG

M3DocRAG（Cho et al., arXiv:2411.04952）将 multi-modal retrieval 扩展到 multi-page multi-document reasoning。它跨 documents retrieval pages，并为 VLM 组合 multi-page context。

### ViDoRe — benchmark

ColPali 的 companion benchmark。Visual Document Retrieval Evaluation。任务包括 financial reports、scientific papers、administrative documents、medical records、manuals。Metric：nDCG@5。

ColPali-v1 在 ViDoRe 上约为 80% nDCG@5；同一批 documents 上的 text-RAG 约为 50-60%。

### End-to-end RAG pipeline

对于 vision-native RAG：

1. 摄取：PDF → 页面图像 → PaliGemma encoding → 存储所有 patch embeddings。
2. 查询：用户文本 → query-token embeddings → 对所有已索引页面执行 MaxSim → top-k 页面。
3. 生成：top-k 页面图像 + query → VLM（Qwen2.5-VL or Claude）→ 答案。

全程没有 OCR。Figures、charts、fonts、layout 全部流入 answer。

### Storage math

一份 50-page financial report，每页 729 patches，128-dim embeddings：

- ColPali：50 * 729 * 128 * 4 bytes = ~18 MB raw，PQ 后 ~4 MB。
- Text-RAG：50 chunks * 768-dim * 4 bytes = ~150 kB。

ColPali 每个 document 的 storage 约多 30x。在规模化场景中，OPQ / PQ 可将其降到约 5-10x，通常可以接受。

### Text-RAG 仍然胜出的场景

- 没有 layout signal 的纯文本 documents（wiki articles、chat logs）。Text-RAG 更简单，storage 更便宜。
- 存储主导成本的 multi-million-page archives。
- 严格监管要求在 retrieval 旁边保留 extractable OCR text。

对于 2026 年的其他场景，即 financial reports、scientific papers、legal contracts、medical records、UX documentation，vision-native RAG 胜出。

```figure
mm-maxsim
```

## 使用它

`code/main.py`：

- Toy patch encoder：将一个 "page"（小型 feature vectors 网格）映射为 patch embeddings array。
- MaxSim scorer：计算 query token embedding set 和 page patch set 之间的 ColBERT-style score。
- Indexes 5 toy pages，运行 3 queries，并返回带 scores 的 top-k。

## 交付它

本课会产出 `outputs/skill-vision-rag-designer.md`。给定一个 document-RAG 项目，选择 ColPali / ColQwen2 / VisRAG / text-RAG，并估算 storage。

## 练习

1. 一份 200-page annual report，每页 729 patches，128-dim emb，4-byte floats。计算 raw storage 和 PQ-compressed（8x）storage。

2. MaxSim 是 Σ_i max_j cos(q_i, p_j)。这个求和捕获了哪些 simple mean similarity 捕获不到的信息？

3. ColPali 将 pages 索引为 patch sets。如果改为按 word level 建索引（如 ColBERT），会发生什么变化？有哪些 trade-offs？

4. 为一个 1M-page corpus 设计 end-to-end pipeline，query latency budget 为 500ms。选择 ColQwen2 / VisRAG 并说明理由。

5. 阅读 M3DocRAG（arXiv:2411.04952）。描述 multi-page attention pattern，以及它与 single-page ColPali retrieval 的区别。

## 关键术语

| Term | 人们常说 | 它的实际含义 |
|------|-----------------|------------------------|
| Late interaction | "ColBERT-style" | 使用 per-token 或 per-patch embeddings + MaxSim 做 retrieval，而不是 single doc Vector |
| MaxSim | "Max-over-patches" | 对每个 query token，选择 similarity 最高的 document token；跨 query 求和 |
| Bi-encoder | "Single-vector" | 每个 document 一个 Vector；更快，但会丢失粒度 |
| Multi-vector | "Many-vectors-per-doc" | 每个 document / page 存储 N_p Vectors；storage cost 增长，但 recall 提升 |
| Patch embedding | "Page feature" | 来自 VLM encoder 的每个 image patch 的一个 Vector，按页 cached |
| ViDoRe | "Vision doc bench" | ColPali 用于 visual document retrieval 的 benchmark suite |
| PQ quantization | "Product quantization" | 在缩小 storage 约 8x 的同时保持 Vector similarity 的压缩方法 |

## 延伸阅读

- [Faysse et al. — ColPali (arXiv:2407.01449)](https://arxiv.org/abs/2407.01449)
- [Khattab & Zaharia — ColBERT (arXiv:2004.12832)](https://arxiv.org/abs/2004.12832)
- [Yu et al. — VisRAG (arXiv:2410.10594)](https://arxiv.org/abs/2410.10594)
- [Cho et al. — M3DocRAG (arXiv:2411.04952)](https://arxiv.org/abs/2411.04952)
- [illuin-tech/colpali GitHub](https://github.com/illuin-tech/colpali)
