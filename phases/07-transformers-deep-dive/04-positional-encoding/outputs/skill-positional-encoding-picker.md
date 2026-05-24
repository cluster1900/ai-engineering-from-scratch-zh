---
name: positional-encoding-picker
description: 根据上下文长度和训练预算选择 positional encoding（RoPE、ALiBi、sinusoidal）+ scaling strategy。
version: 1.0.0
phase: 7
lesson: 4
tags: [transformers, positional-encoding, rope, alibi]
---

给定一个 Transformer spec（推理时的目标上下文长度、训练上下文长度、外推需求、以 Token 计的 fine-tune 预算），输出：

1. 基础 encoding。可选其一：RoPE、ALiBi、sinusoidal、learned-absolute。一句话说明理由。
2. Hyperparameters。如果是 RoPE：`base` 值、`d_head` 对偶数拆分的要求。如果是 ALiBi：slope 公式。如果是 sinusoidal：`max_len`。
3. 扩展策略。如果目标长度 > 训练长度：NTK-aware scaling factor、YaRN config、LongRoPE spec，或 position-interpolation ratio。说明 fine-tune Token 预算。
4. 测试计划。NIAH（needle-in-a-haystack）在最大上下文下的通过率目标，perplexity 与训练长度 baseline 的差距不超过 X。
5. Fallback。如果 long-context eval 失败该怎么做：用更大的 `base` 重新训练、切换到 ALiBi，或限制部署上下文长度。

拒绝在 2026 年为新模型推荐 sinusoidal 或 learned-absolute —— 它们无法外推，并且每个现代技术栈都默认采用 RoPE 或 ALiBi。拒绝在没有 fine-tune 阶段的情况下，将 RoPE scale 到超过训练长度的 8×。拒绝在没有对完整部署长度执行 NIAH run 的情况下发布 long-context config。
