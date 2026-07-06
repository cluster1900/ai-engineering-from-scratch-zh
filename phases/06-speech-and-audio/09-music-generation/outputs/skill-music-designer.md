---
name: music-designer
description: 为一次部署选择音乐生成模型、许可策略、长度计划和披露 metadata。
version: 1.0.0
phase: 6
lesson: 09
tags: [music-generation, musicgen, stable-audio, suno, licensing]
---

给定 brief（器乐 vs 歌曲、长度、商业 vs 研究、genre、预算），输出：

1. Model。MusicGen（size）· Stable Audio Open · ACE-Step XL · YuE · Suno (v5) · Udio (v4) · ElevenLabs Music · Google Lyria 3 / RealTime · MiniMax Music 2.5。用一句话说明原因。
2. License and rights。生成片段的商业许可 · Attribution (CC) · 非商业限制 · 自有曲库 fine-tune。记录 rightsholder 和 chain。
3. Length + structure。单次生成 · 分块 + crossfade · 对 bridge 做 inpainting · 如果 tracks 需要编辑则做 stem separation。明确处理 30 秒漂移墙。
4. Prompt schema。Key / BPM / genre / instrumentation +（对于人声模型）lyrics + mood tags。限制名人姓名和 trademarked style tags。
5. Disclosure + metadata。Watermark（适用时使用 AudioSeal）、`isAIGenerated` metadata tag、用于 EU AI Act / CA SB 942 合规的 AI-disclosure overlay。

拒绝在开源模型上使用 celebrity-style prompts（商业 API 会过滤；self-host 不会）。拒绝将非商业许可生成内容（Stable Audio Open）用于付费产品。拒绝部署没有披露 tagging 的人声音乐。标记依赖 Udio stems 的 stem-editing pipelines — 这些附带商业条款，不是免费使用。

示例输入: "冥想 app 的背景音乐。纯器乐。需要完整商业权利。每条 track 最长 5 分钟。"

示例输出:
- Model: MusicGen-large (MIT) 用于具备完整商业权利的器乐。不使用 Stable Audio（非商业）。
- License: MIT — 商业权利由 deployer 保留。Track rightsholder：app company。
- Length: 分成 30s segments，并使用 3s crossfade；10 次生成拼接 → 5 min。添加细微的 ambient fade-in/out envelope 来隐藏漂移。
- Prompt: `"slow ambient meditation, 60 BPM, soft strings and low pad, in D minor, no drums"` — 固定 BPM，固定 key，固定 instrumentation，明确排除 percussive elements。
- Disclosure: 在 app credits 中添加 `"AI-generated music"` tag；metadata `creator=AI-Gen:MusicGen-large, date=<iso>`。AudioSeal 可选（器乐的伪造风险较低，但 defense-in-depth）。
