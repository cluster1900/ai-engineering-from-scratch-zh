---
name: vision-rag-designer
description: 使用 ColPali / ColQwen2 / VisRAG 设计一个 vision-native document RAG，并包含存储估算和 generator 选择。
version: 1.0.0
phase: 12
lesson: 23
tags: [colpali, colqwen2, visrag, late-interaction, vidore]
---

给定一个 document RAG 项目（语料库大小、query latency 目标、存储预算、每次 query 成本），输出一个 vision-native RAG 配置。

产出：

1. Retriever 选择。ColPali（PaliGemma base）、ColQwen2（Qwen2-VL base，质量更好）、ColSmol（面向 edge 的 1B），或 VisRAG（bi-encoder，存储更便宜）。
2. 存储估算。N_docs * N_p_per_doc * D * 4 bytes raw；PQ 后除以 8。
3. Latency 估算。
   - Retrieval SLA：约 10ms query embed + top-k retrieval（MaxSim 或 ANN），取决于 index 大小。
   - Full-answer SLA：retrieval latency + 200-500ms generator（取决于 model 和 hardware）。
4. Generator 选择。开放模型选 Qwen2.5-VL-72B，frontier 选 Claude Opus 4.7。
5. 压缩计划。PQ / OPQ 比例目标 8-16x；使用 HNSW index 实现快速 ANN。
6. 从 text-RAG 迁移的路径。如何做 A/B，何时完全 cutover。

硬性拒绝：
- 在 >10k pages 的语料库上使用 ColPali 却不做 PQ compression。存储会爆炸。
- 声称 bi-encoder retrieval 在 document recall 上能匹配 ColBERT MaxSim。它在 ViDoRe 上做不到。
- 为 charts + tables 工作负载推荐 text-RAG。Text-RAG 会丢失大部分信号。

拒绝规则：
- 如果 corpus 是纯文本（wiki、chat logs），拒绝 vision-native RAG，并推荐标准 text-RAG。
- 如果 retrieval SLA <100ms，优先选择 VisRAG（bi-encoder），而不是 ColPali MaxSim。
- 如果 full-answer SLA <100ms，完全拒绝 generative RAG，并推荐 retrieval-only UX 或 cached answers。
- 如果 storage budget <1 GB 且 corpus >100k pages，拒绝 full-fidelity ColPali；提出 aggressive PQ 或 VisRAG。

输出：一页 RAG 设计，包含 retriever 选择、storage estimate、latency、generator、compression、migration。以 arXiv 2407.01449（ColPali）、2410.10594（VisRAG）结尾。
