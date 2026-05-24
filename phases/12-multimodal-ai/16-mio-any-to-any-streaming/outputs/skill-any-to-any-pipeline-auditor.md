---
name: any-to-any-pipeline-auditor
description: 审计一个对话式 any-to-any 设计，并计算 MIO / AnyGPT / Moshi-family stack 的延迟预算。
version: 1.0.0
phase: 12
lesson: 16
tags: [mio, anygpt, moshi, any-to-any, streaming, ttfab]
---

给定一个对话式产品（speech in / speech out，可选 vision，可选 music）、模型大小和目标延迟，审计 any-to-any 设计并产出一个可行配置。

产出：

1. Modality mix。哪些 modality 作为输入，哪些作为输出。选择 family：MIO / AnyGPT（离散 tokens，4 种 modality）、Moshi（聚焦 speech+text，inner monologue）、Unified-IO 2（vision-rich）。
2. Shared vocabulary plan。text + image + speech + music + separators 的 ID ranges。总大小通常为 40-50k。
3. Tokenizer stack。BPE + SEED + SpeechTokenizer-RVQ + Encodec。指出哪些仍是瓶颈（通常是 speech quality）。
4. Training curriculum。四阶段 MIO recipe，或面向 speech-focused Moshi 的两阶段方案。
5. TTFAB latency budget。Mic encoder + prefill + first token + residual decode + speech decoder。与约 500ms 的对话门槛比较。
6. Quality-vs-latency pareto。小模型用于低延迟，大模型用于更高质量；给出 A100/H100 上的粗略数字。

Hard rejects:
- 当需求是对话流畅性时，提出每种 modality 单独使用一个模型。Pipeline 延迟会叠加，体验更差。
- 使用只有 1 个 codebook layer 的 speech tokenizer。任何 production voice 的质量都会偏机械。
- 声称 MIO 的 TTFAB 匹配 GPT-4o。它还没有做到；Moshi 160ms 是最接近的开放数字。

Refusal rules:
- 如果目标 TTFAB <200ms，拒绝 MIO-scale（8B+），并推荐 Moshi-class（7B，针对 speech 调优）或更小的 speech-specialized model。
- 如果用户想要 studio-quality voice output，拒绝 open residual-VQ，并推荐 ElevenLabs / chained-TTS，直到开放质量追上（Qwen3-Omni / Moshi2）。
- 如果用户想在语音通话中进行 image generation，拒绝 streaming-speech-first，并提出带 mode-switching 的 split pipeline。

Output: 一页审计，包含 modality mix、vocab plan、tokenizer stack、curriculum、TTFAB latency、quality-latency pareto。结尾附 arXiv 2409.17692 (MIO), 2410.00037 (Moshi), 2402.12226 (AnyGPT)。
