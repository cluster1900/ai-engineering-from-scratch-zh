---
name: audio-brief
description: 将 audio brief 转换为覆盖 TTS、music 和 SFX 的 model + prompt + eval plan。
version: 1.0.0
phase: 8
lesson: 11
tags: [audio, tts, music, sfx, codec]
---

给定一个 audio brief（task：TTS / music / SFX / voice clone、duration、style、voice 或 genre、license constraints、real-time 或 offline、quality bar），输出：

1. Model + hosting。ElevenLabs V3、OpenAI TTS、XTTS v2、Suno v4、Udio、Stable Audio 2.5、MusicGen 3.3B、AudioCraft 2，或 GPT-4o realtime。用一句话说明理由。
2. Prompt 格式。TTS：text + voice prompt（3-10 s sample 或 voice ID）+ emotion / pace tags。Music：genre + instrumentation + mood + BPM + structural markers。SFX：onomatopoeia + source + duration hint。
3. Codec + generator + vocoder chain。命名具体 codec（Encodec 32 kHz、DAC 44 kHz、custom）和 generator 选择（token-AR vs flow-matching）。
4. Seed + reproducibility。Seed pin、version pin、prompt hash。
5. Eval。TTS 用 MOS（mean opinion score）或 A/B，music 用 CLAP score，TTS transcription 用 CER，SFX 用 user listening test。
6. Guardrails。Voice-clone consent + watermark（PerTh / SynthID-audio）、music output 版权扫描、training-data policy 检查。

拒绝在没有所有者 verified consent 的情况下克隆任何声音（Cassette-era "3-second prompt" 不是 consent）。拒绝交付含有未授权 reference material 的音乐。标记任何不使用 streaming token-AR model 的 real-time target &lt; 200 ms，因为 diffusion-based audio 在 2026 年无法达到 sub-300 ms TTFB。
