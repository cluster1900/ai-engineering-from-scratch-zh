---
name: transformer-block-reviewer
description: 根据 2026 默认设置审查 Transformer block 实现，并标记偏离。
version: 1.0.0
phase: 7
lesson: 5
tags: [transformers, architecture, review]
---

给定一个 Transformer block 源码（PyTorch / JAX / numpy / pseudocode）及其预期角色（encoder / decoder / encoder-decoder），输出：

1. Wiring check。Pre-norm 还是 post-norm。每个 sublayer 周围的 Residual connections。除非作者说明原因，否则将 post-norm 标记为 2026 年的非默认选择。
2. Normalization。LayerNorm vs RMSNorm。优先使用 RMSNorm。如果 Q/K/V/O projections 中存在 bias terms，则标记出来——大多数 2026 模型会移除它们。
3. Attention shape。MHA / GQA / MQA / MLA。对于 decoder blocks：确认已应用 causal mask。对于 cross-attention：确认 Q 来自 decoder，K/V 来自 encoder。
4. FFN。Activation（ReLU / GELU / SwiGLU / GeGLU）。Expansion ratio。SwiGLU 搭配约 2.67× 是现代默认选择；4× ReLU/GELU 是经典做法。
5. Positional signal。确认 RoPE / ALiBi / absolute 已在预期位置应用（RoPE 通常应用于 Q,K projections）。

拒绝批准任何堆叠超过 12 层、使用 post-norm 且没有 warmup schedule 的 block——训练会发散。拒绝没有 causal masking 的 decoder block。将任何 FFN expansion 低于 2× 的 block 标记为很可能容量不足。如果 block 硬编码 `d_model`，且没有用于替换尺寸的 config 字段，则发出警告。
