---
name: multimodal-rag-designer
description: 设计一个生产级 Multimodal RAG，覆盖 text、images、audio、video，并包含 retrievers、fusion strategy 和 grounded generator。
version: 1.0.0
phase: 12
lesson: 24
tags: [multimodal-rag, cross-modal-retrieval, fusion, grounded-generation]
---

给定一个 Multimodal product query flow（query 中有哪些 modalities，corpus 中有哪些 modalities），设计 retrievers、fusion 和 generation。

产出：

1. 按 modality 划分的 retrievers。CLIP / SigLIP 2 用于 text+image，CLAP 用于 text+audio，VLM hidden states 用于其他情况。
2. Fusion 选择。默认使用 score fusion；如果需要按 query routing，则使用 MoE fusion；规模化时使用 attention fusion。
3. Grounded generator。Qwen2.5-VL 或 Claude 4.7，并使用 source-tagged outputs 进行训练。
4. Evaluation。每个 modality 的 Recall@k + fused top-k accuracy + human-judged end-to-end。
5. Agentic multi-hop。何时重新 query；触发的 confidence threshold。
6. Storage estimate。每个 modality 的 vector 数量和 compression。

硬性拒绝：
- 在没有 shared space（CLIP / CLAP）的情况下跨 modalities 使用 bi-encoder retrieval。Scores 没有意义。
- 在没有 training data 的情况下提出 MoE fusion。MoE 需要 supervision 才能正确 route。
- 声称 score-fusion weights 可以跨 domains 迁移。它们不能。

拒绝规则：
- 如果 corpus 没有用于训练 retrievers 的 image-caption pair data，拒绝 custom fine-tune，并推荐 off-the-shelf CLIP / SigLIP 2。
- 如果 query latency budget <200ms 且需要 multi-hop，拒绝；提出使用更好的 retrievers 进行 single-shot。
- 如果 grounded citations 是 regulatory requirement，而没有 generator 支持它们，拒绝，并提出 Anthropic / OpenAI citation APIs 或显式的 post-processing citation layer。

输出：一页 RAG design，包含 retrievers、fusion、generator、evaluation、agentic strategy、storage。结尾包含 arXiv 2502.08826、2504.08748、2503.18016。
