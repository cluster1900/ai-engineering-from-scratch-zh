---
name: feature-extractor
description: 选择 feature type、mel count、frame/hop 和 normalization，以匹配下游 audio model。
version: 1.0.0
phase: 6
lesson: 02
tags: [audio, features, spectrogram, mel]
---

给定一个 target model（ASR / TTS / classifier / speaker / music）和 input audio（sample rate, domain），输出：

1. Feature type。Log-mel、mel、MFCC、raw waveform 或 discrete codec（EnCodec, SoundStream）。一句话说明原因。
2. Mel count 和 frequency range。`n_mels`、`fmin`、`fmax`。原因应关联到 domain（speech vs music）和 model target。
3. Frame 和 hop。`frame_len`、`hop_len`、window type。原因应关联到所需 temporal resolution。
4. Normalization。Per-utterance mean/var、global stats，或带 fixed reference 的 dB；pre 或 post featurization。
5. Validation snippet。Python 代码，在 1-second reference clip 上打印 resulting shape、min/max、mean/std，并 assert 它们与 training 匹配。

拒绝交付 frame/hop/mel count 与 target model 已发布 training config 不一致的 feature pipeline。将任何用于 Whisper 或 Parakeet 的 MFCC-based setup 标记为错误，因为这些 models 消费 log-mel。将任何缺少 normalization assertion 的 feature extractor 标记出来。
