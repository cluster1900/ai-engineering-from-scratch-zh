# Multimodal RAG 与 Cross-Modal Retrieval

> Vision-native document RAG 只是其中一个切片。生产级 Multimodal RAG 的范围更广：在 text、images、audio、video 之间 retrieval，用于 trip planning（“帮我找一家安静、有自然光的 vegan brunch”）、medical triage（“什么 injury 匹配这张照片 + 这些 notes”）、e-commerce（“找和这张 selfie 类似、且符合我尺码的 outfits”）以及 field service（“根据这个 engine sound 加上零件照片来诊断问题”）等 workflow。三篇 2025 年 survey，Abootorabi et al.、Mei et al.、Zhao et al.，把子问题归纳为：cross-modal retrieval、retrieval fusion、generation grounding、multimodal evaluation。本课阅读这些 survey，并设计一个生产级 pipeline。

**Type:** Build
**语言:** Python (stdlib，带 fusion + grounded generator 的 cross-modal retriever)
**先修要求：** Phase 12 · 23 (ColPali), Phase 11 (RAG basics)
**Time:** ~180 分钟

## 学习目标
- 设计 cross-modal retrieval：text → image、image → text、audio → video 等。
- 比较三种 fusion strategy：score fusion、attention-based fusion、MoE fusion。
- 解释 generation grounding：当 source 是多种 modality 的混合时，“cite your sources”应该是什么样。
- 说出 2025 年三篇 canonical Multimodal RAG survey，以及它们的子问题 taxonomy。

## 问题
Single-modality RAG 是一个已经成熟的模式：embed query、embed chunks、retrieve、塞进 LLM。Multimodal RAG 需要：

1. 多个 retrieval head（每种 modality 都需要在兼容空间中的 Embedding）。
2. 跨 modality 融合 retrieval results。
3. Generation grounding，需要引用跨 modality 的 source。
4. 覆盖 cross-modal signal 的 evaluation metrics。

这些 2025 年 survey 最终都给出了相同的 taxonomy。

## 概念
### Cross-modal retrieval

给定 modality A 的 query，retrieve modality B 的 documents。三种模式：

1. Shared embedding space。CLIP 和 CLAP 在共享空间中生成 text + image / text + audio Embedding。跨 modality 的 cosine similarity 可以直接使用。受限于 CLIP 训练过的配对。

2. Per-modality encoder + translation。Text encoder + image encoder + 一个小型 translator module，用于在不同空间之间 mapping。Gupta et al. 的 Sen2Sen 以及其他 2024 年设计属于这一类。灵活，但增加复杂度。

3. VLM as encoder。使用 VLM 的 hidden states 作为 retrieval representation。VLM 支持的任何 modality 都可用。质量更高，成本也更高。

选择：text+image 用 CLIP / SigLIP 2；text+audio 用 CLAP；frontier 质量的 cross-modal 用 VLM-hidden-states。

### Fusion strategies

你 retrieved 10 个结果：5 张 images、3 段 text passages、2 个 audio clips。如何合并？

Score fusion（最便宜）。每种 modality 都有自己的 retriever，每个 retriever 返回 scores。先在 modality 内 normalize scores，再求和。简单，通常有效。

Attention-based fusion。拼接所有 retrieved items，让一个小型 attention network 给它们加权。需要训练。

MoE fusion。Gating network 路由到 modality-specific experts。不同 query 类型走不同路由，例如 visual question 会给 images 更高权重。

生产默认方案：score fusion，并稍微偏向 query 的 dominant modality。如果 A/B 显示在你的 domain 上有明显收益，再升级到 MoE。

### Generation grounding

LLM 应该引用是哪个 retrieved item 支撑了每个 claim。对于 multi-modal：

- Text source：标准 citation `[1]`。
- Image source：`[img 3]`，带一个短 caption。
- Audio：`[audio 2 at 0:34]`。

用 grounding-aware data 训练 generator：training target 中的每个 claim 都标注 source index。Inference 时，model 会自然输出 citations。

### The 2025 surveys

Abootorabi et al.（arXiv:2502.08826，“Ask in Any Modality”）：Multimodal RAG 的 taxonomy。覆盖 retrieval、fusion、generation。覆盖面最广。

Mei et al.（arXiv:2504.08748，“A Survey of Multimodal RAG”）：重点关注 sub-task benchmarks 和 failure modes。对 evaluation design 很有用。

Zhao et al.（arXiv:2503.18016）：偏 vision 的 survey。对 ColPali-family work 的梳理很强。

读完这三篇，你就能掌握截至 2025 年春季的 state of the art。大多数子问题仍然开放。

### MuRAG — foundational paper

MuRAG（Chen et al., 2022）是第一篇 Multimodal RAG。它从 Multimodal KB 中 retrieve image + text，并生成答案。在 VLM 浪潮之前证明了可行性。现代系统（REACT、VisRAG、M3DocRAG）都建立在它之上。

### 一个生产级 trip-planner 示例

Query：“帮我找一家安静、有自然光的 vegan brunch。”

Pipeline：

1. 分解 query。“quiet” → audio/review keyword；“vegan brunch” → menu item；“natural light” → image feature。
2. 按 modality retrieve：
   - 对 reviews 做 text retrieval：“vegan brunch, quiet ambiance.”
   - 对 restaurant photos 做 image retrieval：“natural light, airy.”
   - 对 ambient-sound clips 做 audio retrieval：“low decibel, no music.”
3. 融合 scores。每家 restaurant 都有一个 composite score。
4. Top-k restaurants → VLM generator，携带所有 evidence → 带 citations 输出答案。

这已经远远超出 text-RAG。每种 modality 都加入了 text alone 会遗漏的信号。

### Agentic multimodal RAG

Multi-hop：如果第一次 retrieval 没有返回高置信度答案，LLM 会 reformulate 并再次 retrieve。Phase 14 的 Agentic RAG 模式适用于这里。示例：

- Retrieve initial top-10 → LLM 询问“too noisy, filter for <40 dB” → re-retrieve。
- Retrieve images → LLM 发现其中一张有 menu → retrieve menu text → answer。

这会增加复杂度，但能处理 single-shot retrieval 无法解决的 query。

### Evaluation

Cross-modal evaluation 仍不成熟。常见 proxy：

- 每种 modality 的 Recall@k。
- Fused top-k accuracy。
- 人工评判的端到端满意度。
- Task-specific（完成 bookings、完成 purchases）。

没有覆盖所有 modality 的标准 benchmark。大多数 paper 都在 domain-specific tasks 上 evaluation。

## 使用它
`code/main.py`：

- 三个 mock retrievers（text、image、audio），运行在一个共享的 restaurant corpus 上。
- Score fusion，使用可配置 weights 组合 modality scores。
- 一个 generator stub，输出带 citations 的 final answer。
- 一个简单的 agentic loop，当 confidence 较低时 reformulate query。

## 交付它
本课产出 `outputs/skill-multimodal-rag-designer.md`。给定一个带 Multimodal query flow 的 product spec，设计 retrievers、fusion、generator 和 evaluation。

## 练习
1. 提出一个 medical-triage Multimodal RAG：query = injury photo + text symptoms。哪些 modality 从哪个 KB retrieve？

2. Score fusion 是简单的 weighted sum。它有什么 failure mode 是 MoE fusion 可以避免的？

3. 阅读 Abootorabi et al. 的 taxonomy（Section 3）。三个 canonical sub-problems 是什么？它们如何映射到你选择的 product？

4. 为 trip-planner Multimodal RAG 设计一个 eval spec。哪些 metrics 覆盖 image recall、audio recall 和 composite correctness？

5. Agentic multi-hop RAG 每一轮 round-trip 都有 latency tax。query 难到什么程度时，accuracy gain 才能 justify latency？

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Cross-modal retrieval | “Query 一个 modality，retrieve 另一个” | Text query retrieve images；image query retrieve text；需要 shared space 或 translator |
| Score fusion | “组合 scores” | 对每种 modality 的 retrieval scores 做 weighted sum；最简单的 fusion |
| MoE fusion | “Modality-routed experts” | Gating network 按 query 选择信任哪种 modality 的 scores |
| Grounded generation | “Cite your sources” | 答案中的每个 claim 都标注 source index |
| MuRAG | “第一个 Multimodal RAG” | 2022 年 paper，建立了 Multimodal RAG 模式 |
| Agentic multi-hop | “Reformulate and retry” | 当 first-pass confidence 较低时，LLM 重新 query retrievers |

## 延伸阅读
- [Abootorabi et al. — Ask in Any Modality (arXiv:2502.08826)](https://arxiv.org/abs/2502.08826)
- [Mei et al. — A Survey of Multimodal RAG (arXiv:2504.08748)](https://arxiv.org/abs/2504.08748)
- [Zhao et al. — Vision RAG Survey (arXiv:2503.18016)](https://arxiv.org/abs/2503.18016)
- [Chen et al. — MuRAG (arXiv:2210.02928)](https://arxiv.org/abs/2210.02928)
- [Liu et al. — REACT (arXiv:2301.10382)](https://arxiv.org/abs/2301.10382)
