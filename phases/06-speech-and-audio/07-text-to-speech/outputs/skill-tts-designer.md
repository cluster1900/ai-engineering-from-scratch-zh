---
name: tts-designer
description: 为给定的语言、风格和 latency target 选择 TTS model、voice、text-normalization scope 和 evaluation plan。
version: 1.0.0
phase: 6
lesson: 07
tags: [audio, tts, speech-synthesis]
---

给定一个目标（language(s)、voice style、latency budget、CPU vs GPU、license constraints）和内容（domain、OOV density、punctuation richness），输出：

1. Model。Kokoro / XTTS v2 / F5-TTS / VITS / StyleTTS 2 / commercial API。一句话说明理由。
2. Text frontend。Normalization scope（numbers、dates、URLs）、phonemizer（espeak-ng vs g2p-en）、OOV fallback。
3. Voice。Preset name 或 reference clip spec（seconds、noise floor、accent match）。
4. Quality targets。Target UTMOS、CER via Whisper、cloning 时的 SECS。
5. Evaluation plan。20-utterance test set，覆盖 numbers、homographs、proper nouns、long sentences。

拒绝任何没有 text normalizer 的 production TTS。拒绝没有用户同意和 watermarking 的 voice cloning。标记任何被要求说 English 以外语言的 Kokoro deployment。
