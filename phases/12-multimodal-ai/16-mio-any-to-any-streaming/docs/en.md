# MIO 与 Any-to-Any Streaming Multimodal Models

> GPT-4o 交付了一个大多数 open models 无法复现的产品：一个能实时听到语音、看到视频并开口回应的 agent。到 2024 年末，open-ecosystem 的答案是 MIO（Wang et al., September 2024）。MIO Tokenize 文本、图像、语音和音乐，在交错序列上训练一个 causal transformer，并能从任意 modality 生成到任意 modality。AnyGPT（Zhan et al., February 2024）是 proof of concept；MIO 是 scale-up；Unified-IO 2（Allen AI, December 2023）是带有 vision + action grounding 的近亲。本课阅读 any-to-any 模式 —— 四个 Tokenizer、一个 Transformer、streaming-friendly decode。

**Type:** Learn
**Languages:** Python (stdlib, four-modality token allocator + streaming decode loop)
**Prerequisites:** Phase 12 · 11 (Chameleon), Phase 6 (Speech and Audio)
**Time:** ~120 minutes

## 学习目标
- 设计一个共享 vocabulary，用于容纳文本、图像、语音和音乐 Token，且不会发生冲突。
- 从压缩 + 重建取舍角度比较 SEED-Tokenizer（图像）和 SpeechTokenizer residual-VQ（语音）。
- 解释构建 any-to-any 生成能力的四阶段 curriculum。
- 说出三个 open any-to-any recipes 及其主要取舍：MIO、AnyGPT、Unified-IO 2。

## 问题
一个 unified Multimodal model 很容易宣称，却很难规模化构建。直到 2024 年，大多数 "any-to-any" 系统都是 pipeline 化的：vision model → 文本表示 → speech model → 音频。每一跳都会损失信息、增加延迟，并让训练变复杂。GPT-4o 的 demo video 展示了一个具备亚秒级响应的 single-model 替代方案；open systems 落后了数月。

工程挑战：

- 每种 modality 都必须有 Tokenizer，压缩要足够接近无损以便重建，并以 Transformer 能消费的速率产生 Token。
- 单一 vocabulary 必须为文本（32k+）、图像（16k+）、语音（4k+）、音乐（8k+）分配空间。最低也需要四万多个条目。
- 训练数据必须覆盖每一种 input-output pair（text→image、image→speech、speech→image 等），或者模型必须能够组合。
- Inference 必须足够快地 streaming 输出 Token，以满足对话延迟（<500ms time-to-first-audio-byte）。

## 概念
### 四种 modality 的四个 Tokenizer

MIO 的 Tokenizer stack：

- Text：标准 BPE，vocab ~32000。
- Image：SEED-Tokenizer (2023) —— 带离散 codebook 的 quantized VAE，4096 个条目，每张图像 32x32 个 Token。
- Speech：SpeechTokenizer residual-VQ (2023) —— 将 16kHz waveform 编码为 8 个 hierarchical codebooks；第一层是粗粒度内容，后续层加入 prosody 和 speaker identity。
- Music：类似的 residual-VQ（Meta 的 MusicGen / Encodec family），4-8 个 codebooks。

每种 modality 都产生整数 Token。这些 Token 在共享 vocabulary 中获得互不重叠的 ID ranges：

```
text:   0..31999
image:  32000..36095  (4096 image tokens)
speech: 36096..40191  (4096 speech base tokens, plus residual layers)
music:  40192..48383  (8192 music tokens)
sep:    48384..48390  (<image>, <speech>, <music>, </...>, etc.)
```

总计：约 48k vocabulary。input Embedding 和 output projection 覆盖全部条目。

### Streaming decode

语音生成使用 residual-VQ。Transformer 预测 base（layer 0）speech Token；一个 parallel-decoded residual quantizer 预测后续层。每个 layer 0 Token 大约对应 16kHz 音频中的 50ms。

Streaming 模式：

1. 用户对着麦克风说话；real-time audio Tokenizer 每 50ms 发出 speech Token。
2. MIO 在 Token 到达时消费它们（prompt prefill + incremental forward）。
3. Output Token 随生成流式输出；parallel speech decoder 以约 50-150ms 延迟将其转换为 audio samples。
4. Time-to-first-audio-byte：MIO paper 中约 300-500ms，接近 GPT-4o 的约 250ms。

Mini-Omni（arXiv:2408.16725）、GLM-4-Voice（arXiv:2412.02612）和 Moshi（arXiv:2410.00037）是互补的 streaming speech-LLM designs。其中 Moshi 在单 GPU 上实现了 160ms round-trip。

### 四阶段 curriculum

MIO 的训练 curriculum：

1. Stage 1 — alignment。大规模 modality-pair corpora：text-image、text-speech、text-music。每个 pair 使用自己的 Token vocabulary segment。训练共享 vocabulary。
2. Stage 2 — interleaved。Multi-modality interleaved documents（带图像 + 视频的博客、带 transcripts 的 podcasts 等）。训练 cross-modality context。
3. Stage 3 — speech-enhanced。额外音频数据，用于提升语音质量且不损失文本能力。
4. Stage 4 — SFT。跨 modality 的 instruction tuning：VQA、captioning、narration、speech-to-speech dialogue。

缺少某个阶段会削弱特定能力：跳过 stage 2，模型会失去 cross-modality context；跳过 stage 3，语音会很差。

### Chain-of-visual-thought

MIO 引入 chain-of-visual-thought：模型发出中间图像 Token 作为 reasoning step。对于 "is the cat climbing a tree?"，模型会：

1. 发出 `<image>` Token 来渲染场景（来自输入图像或草图）。
2. 发出文本分析该草图。
3. 发出最终答案。

渲染出的中间图像作为 scratchpad。在 spatial-reasoning tasks 上，benchmarks 有提升。这个想法类似文本 reasoning 中的 chain-of-thought。

### Any-to-any 的竞争者

- AnyGPT（arXiv:2402.12226）：4 种 modalities（text、image、speech、music），设计相似。
- Unified-IO 2（arXiv:2312.17172）：增加 vision action outputs、depth、normals。任务多样性更高，规模更小。
- NExT-GPT（arXiv:2309.05519）：LLM + modality-specific diffusion decoders。不是 single-model 方法。
- CoDi（arXiv:2305.11846）：composable diffusion；通过 shared latent 实现 any-to-any。

MIO 最接近 pure-token any-to-any。AnyGPT 是它的概念前身。

### Latency budget

对于一个对话产品，每个组件的延迟都很重要：

- Mic 到 audio Token：~50ms。
- Prefill（audio Token + history）：8B model 上 ~100ms。
- 第一个 output Token：~50ms。
- Parallel residual-VQ + speech decoder：~100-150ms。

总 time-to-first-audio-byte：最低约 ~300ms。GPT-4o 声称 ~250ms。Moshi 声称 160ms。根据公开 benchmarks，MIO/AnyGPT 位于 400-600ms 范围。

### 为什么 any-to-any 仍然困难

即使在 2026 年，open any-to-any models 在两个轴上仍落后于 closed ones：

- 语音质量。residual-VQ Tokenizer 是有损的；与 ElevenLabs-class voices 相比，对话语音听起来更机械。
- Cross-modality reasoning。让模型 "sing about what you see" 仍然比纯 vision tasks 更容易失败。

这些是 open research problems。Qwen3-Omni（Lesson 12.20）是 2025 年最先进的 open attempt。

```figure
any-to-any-stream
```

## 使用它
`code/main.py`：

- 定义 four-modality vocabulary allocation 并打印它。
- 将一个 Multimodal inputs 列表（text、image、audio-clip、music）通过 Tokenizer router 路由。
- 模拟 text-to-speech response 的 streaming decode，并统计 latency。
- 在给定 encoder、prefill 和 decoder latencies 的情况下计算预期 time-to-first-audio-byte。

## 交付它
本课产出 `outputs/skill-any-to-any-pipeline-auditor.md`。给定一个 conversational product spec（modalities in、modalities out、latency target），它会审计 MIO-family design choices 并计算 latency budget。

## 练习
1. 你的产品接受 speech input 并返回 speech output。端到端 latency budget target 是多少？列出会消耗时间的组件。

2. SpeechTokenizer residual-VQ 使用 8 个 codebooks。说明为什么 parallel-decoding residual levels 是必要的（相对于 sequential），以及它带来什么延迟节省。

3. 你的 vocabulary 有 32k text + 4k image + 4k speech。加入 8k music 和约 10 个 separators。在 hidden dim 4096 时，Embedding Matrix 的参数成本是多少？

4. Chain-of-visual-thought 会发出中间图像。哪些类型的问题会受益？哪些类型会被额外 Token 伤害？

5. 阅读 Moshi（arXiv:2410.00037）。描述它的 "inner monologue" 技术，并与 MIO 的 chain-of-visual-thought 比较。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Any-to-any | "Multimodal in/out" | 一个单一模型，能够在任意方向接受并发出 text、image、speech 和 music |
| Residual-VQ | "Speech tokenizer stack" | Multi-codebook Tokenization，每一层都添加信息；base layer 是内容，后续层是 prosody |
| SEED-Tokenizer | "Image codes" | MIO 使用的离散 image Tokenizer，带 4096-entry codebook |
| Chain-of-visual-thought | "Visual scratchpad" | 模型在最终答案前生成一张中间图像作为 reasoning step |
| Time-to-first-audio-byte | "TTFAB" | 从用户语音到第一个 audio output 的延迟；<500ms 才有对话感 |
| Four-stage curriculum | "Training recipe" | Alignment -> interleaved -> speech-enhanced -> SFT，按此顺序 |

## 延伸阅读
- [Wang et al. — MIO (arXiv:2409.17692)](https://arxiv.org/abs/2409.17692)
- [Zhan et al. — AnyGPT (arXiv:2402.12226)](https://arxiv.org/abs/2402.12226)
- [Lu et al. — Unified-IO 2 (arXiv:2312.17172)](https://arxiv.org/abs/2312.17172)
- [Wu et al. — NExT-GPT (arXiv:2309.05519)](https://arxiv.org/abs/2309.05519)
- [Tang et al. — CoDi (arXiv:2305.11846)](https://arxiv.org/abs/2305.11846)
