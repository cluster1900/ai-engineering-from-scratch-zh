---
name: audio-loader
description: 根据 target model 的期望验证 raw audio file，并安全地 resample。
version: 1.0.0
phase: 6
lesson: 01
tags: [audio, speech, preprocessing]
---

给定一个 audio file（path、channels、sample rate、bit depth、codec）和一个 target model（ASR / TTS / classifier，带有必需的 sample rate 和 channel count），输出：

1. 不匹配项。列出 file 与 target 不匹配的每个维度（sr、channels、duration floor、clipping check）。
2. Resample plan。Source sr、target sr、resampling library（`torchaudio.transforms.Resample` 或 `librosa.resample`）、anti-aliasing filter type。
3. Channel plan。Mono fold strategy（mean vs left-only），或当 model 支持时采用 multichannel pass-through。
4. Normalization。Peak vs RMS normalization、dBFS target、clipping guard。
5. Validation snippet。加载 file、运行 transforms，并断言最终 array 匹配 `(target_sr, dtype, channel_count, range)` 的 Python 代码。

拒绝在没有 anti-aliasing filter 的情况下 downsample。拒绝在没有 reconstruction filter 的情况下 upsample 超过 2x。标记任何 clipping peaks 超过 ±0.999 或 DC offset 高于 ±0.01 的 input file。
