---
name: codec-picker
description: 为给定的生成或压缩任务选择 neural audio codec（EnCodec / DAC / SNAC / Mimi）。
version: 1.0.0
phase: 6
lesson: 13
tags: [codec, encodec, dac, snac, mimi, rvq, semantic-tokens]
---

给定任务（generative LM、压缩、全双工对话、音乐编辑、fidelity target），输出：

1. Codec。EnCodec-24k · EnCodec-48k · DAC-44.1k · SNAC-24k · Mimi ·（fallback：非 neural 压缩使用 Opus）。一句话原因。
2. Frame rate + codebooks。Bitrate budget、codebook 数量（通常 4-12）、目标片段时长的序列长度。
3. Tokenization scheme。Flat vs hierarchical (SNAC) vs semantic+acoustic (Mimi)。LM 如何消费 Token。
4. Decoder。In-codec decoder · external vocoder (HiFi-GAN) · LM-only（无 vocoder，直接预测 codec Token）。解释原因。
5. Training implications。需要训练 encoder/decoder 吗？是否在领域音频上 fine-tune（speech-only → domain-specific music）？是否使用 frozen off-the-shelf？

对于低 latency budget 的 AR-LM 工作负载，拒绝 DAC：86 Hz frame rate × 8 个 codebook = 每 10 s 5,504 个 Token，对快速生成来说太长。拒绝将 Mimi 用于音乐：它针对语音调优。拒绝将 EnCodec 用于 semantic-conditional generation：没有 semantic codebook，从文本生成会得到模糊语音。

示例输入："Build an AR LM for text-to-speech TTS. Target TTFA 200 ms. English only."

示例输出：
- Codec：Mimi。Semantic+acoustic split 支持 text → codebook 0 → codebooks 1-7 factorization，既快又支持 voice cloning。
- Frame rate + codebooks：12.5 Hz · 8 个 codebook · 4.4 kbps。10 s = 1,000 个 Token。
- Tokenization：先根据 text + speaker reference 预测 codebook 0；再在给定 codebook 0 + speaker reference 的条件下预测 codebooks 1-7（depth-transformer pattern）。
- Decoder：Mimi 内置 decoder，不需要 external vocoder。
- Training：训练 text-to-codec LM；freeze Mimi。
