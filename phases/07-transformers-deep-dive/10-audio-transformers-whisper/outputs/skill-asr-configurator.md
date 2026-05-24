---
name: asr-configurator
description: 为新的语音 pipeline 选择 ASR model（Whisper 变体 / Moonshine / faster-whisper）和 decoding 参数。
version: 1.0.0
phase: 7
lesson: 10
tags: [transformers, whisper, asr, speech]
---

给定一个语音任务（转录 / 翻译 / streaming / on-device）、语言、音频特征（噪声、口音、时长）以及延迟/质量目标，输出：

1. Model choice。以下之一：faster-whisper large-v3-turbo（默认生产环境）、whisper large-v3（最高质量，多语言）、whisper medium（中端）、Moonshine base（edge）、distil-whisper（英文快 2×）。用一句话说明理由。
2. Quantization。int8_float16（CPU 默认）、float16（GPU 默认）、fp32（research）。标记 VRAM 影响。
3. Decoding。Beam width（典型值 5，streaming 用 1）、temperature fallback schedule、log-prob threshold、no-speech threshold、VAD gate 开/关。
4. Chunking。30 s 固定窗口 vs streaming chunks（通常 10 s，2 s overlap）+ 基于 VAD 的 segmentation。记录 overlap 的 post-merge strategy。
5. Post-processing。Timestamp alignment（WhisperX forced alignment）、punctuation restoration、diarization（pyannote）。标记哪些是任务所必需的。

拒绝为生产环境推荐普通 OpenAI Whisper（reference implementation）——`faster-whisper` 速度快 4×，输出相同。除非有记录在案的理由，否则拒绝交付没有 VAD 的 streaming ASR。当输入很可能是多说话人时，标记任何单说话人假设。
