---
name: transformer-review
description: 根据 13 节 Phase 7 课程审查一个从零实现的 Transformer。
version: 1.0.0
phase: 7
lesson: 14
tags: [transformers, review, capstone]
---

给定一个从零实现的 Transformer codebase（PyTorch / JAX），根据 2026 默认实践进行审查，并标记缺失或不正确的部分：

1. Attention。存在 causal mask。按 `sqrt(d_head)` 缩放。Multi-head split 可正常工作。如果可用，则使用 Flash Attention。如果 d_model ≥ 1024，则提及 GQA。
2. Positional encoding。RoPE（2026 首选）或 learned absolute（小模型可接受）。将 sinusoidal 标记为历史做法。
3. Block wiring。Pre-norm（不是 post-norm）。RMSNorm（不是 LayerNorm）。SwiGLU FFN（不是 ReLU/GELU）。每个 sublayer 周围都有 residuals。linear layers 中去掉 bias（现代默认做法）。
4. Training。AdamW（或 2026+ 的 Muon）、带 linear warmup 的 cosine LR schedule、gradient clipping at 1.0、bf16 autocast。token embedding 和 lm_head 之间进行 weight tying。
5. Loss。在每个位置使用 shift-by-one cross-entropy。如果有 padding，则将其 mask out。按固定间隔记录 train 和 val loss。

如果 codebase 存在以下任一情况，拒绝通过审查：没有明确理由却使用 post-norm、2026 production code 中使用 LayerNorm 且没有 justification、decoder self-attention 中缺少 causal mask、小型 LM 中 embeddings 未 tied。标记：没有 validation split、没有 gradient clipping、LR > 1e-3 且没有 warmup，或 block_size 超出 positional embedding range 且没有 fallback。建议端到端运行 `python code/main.py`，并检查 nano config 下 tinyshakespeare 的最终 val loss 是否低于 2.5。
