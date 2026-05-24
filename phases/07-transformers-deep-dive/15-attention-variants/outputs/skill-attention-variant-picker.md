---
name: attention-variant-picker
description: 根据 context length、retrieval 需求和 compute profile，为新模型选择 full / sliding-window / sparse / differential Attention 拓扑。
version: 1.0.0
phase: 7
lesson: 15
tags: [attention, transformer, long-context, inference, memory]
---

# Attention 变体选择器

帮助开发者为新的 Transformer，或为正在扩展到更长 context 的现有 Transformer，选择并论证一种 Attention 拓扑。

## 需要收集的输入

1. **目标 context length**，分别用于 training 和 inference（通常不同——许多模型以 16K 训练，并在 inference 时扩展）。
2. **Retrieval 需求**，按 1–5 评分：1 = 纯聊天，5 = needle-in-haystack / RAG / 具有长 repository context 的代码。
3. **Inference memory 预算**，即每个请求可接受的 KV cache（每 Token 每层的字节数是合适单位）。
4. **Training cost 容忍度**——从头训练 SWA 成本较低；将 differential Attention 改装到 pretrained model 中成本较高。
5. **Hardware target**——Hopper+ 具备完整 FlashAttention-3，Ada 具备 FA2，更旧的 GPU 受 mask 限制。

## 决策规则

- **Context ≤ 16K 且 retrieval ≤ 3**：使用带 FlashAttention 的 full Attention。不要过早优化。
- **Context 16–128K 且 retrieval ≤ 3**：使用 5:1 的 mixed SWA + global，window 1024（Gemma 3 形态）。在大幅压缩 KV 的同时保持 retrieval 可用。
- **Context > 128K**：使用 full SWA，每 4–6 层加入一个 global layer，并配合 position interpolation / YaRN scaling（Lesson 04）。
- **Retrieval = 5 且 training budget 允许**：仅在顶部 4 层考虑 differential Attention（KV 翻倍只承担一半，但获得大部分 sink-cancellation 收益）。
- **你正在发布 public API**：优先选择稳定模式（full、SWA、Gemma-3 mix）。除非你有 kernel engineers，否则跳过 native-sparse / DIFF。
- **你不能修改 base model**：SWA 可以通过 masking 在 inference 时改装；differential 和 sparse 不行。

## 始终标记

- 低于 7B 的 Pure-SWA 模型通常会在 reasoning benchmarks 上出现可测量的下降。建议避免。
- Window size < 512 几乎从来都不合适。应调大，或使用不同拓扑。
- differential Attention 论文中的报告基于小模型（3–7B）。截至 2026 年初，scale-up 证据仍然薄弱。
- 每种变体都会与 RoPE / YaRN scaling（Lesson 04）相互作用。必须明确说明 position scheme。

## 输出格式

返回：

1. **Recommendation**——一个单一命名拓扑（例如“Gemma-3 mix, W=1024, 5:1 SWA:global”）。
2. **Justification**——将每个输入映射到上述决策规则。
3. **KV cache estimate**——在目标 context 下，以每 Token 每层的字节数以及 batch 1 时的 GB 表示。
4. **Migration path**——如果 base model 已经训练好，说明如何改装。
5. **Known risks**——哪些 benchmarks / workloads 可能退化。
