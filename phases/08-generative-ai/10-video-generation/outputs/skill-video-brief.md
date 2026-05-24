---
name: video-brief
description: 将 video brief 转换为适用于 2026 video generator 的 model + prompt + shot plan。
version: 1.0.0
phase: 8
lesson: 10
tags: [video, diffusion, sora, veo, kling]
---

给定一个 video brief（duration、aspect ratio、style、subject、camera plan、audio needs、fidelity bar、budget），输出：

1. Model + hosting。Sora、Veo 3、Kling 2.1、Runway Gen-3、Pika 2.0、CogVideoX、HunyuanVideo、WAN 2.2 或 Mochi-1。用一句话说明与 duration / quality / license 相关的理由。
2. Prompt scaffolding。(a) camera language（establishing、tracking、dolly、crane、handheld），(b) subject + action，(c) lighting + style，(d) negative prompt 或 style toggles。Sora 目标为 50-150 tokens，Runway 目标为 20-60。
3. Shot plan。Single-clip vs stitched multi-shot、keyframe 或 first-frame anchors、每个 shot 的 I2V vs T2V。
4. Seed + reproducibility。Per-shot seed、version pin、tooling repo。
5. QA checklist。逐帧检查 flicker、identity consistency、physics violations、watermark compliance。
6. Audio。Veo 3 原生支持，否则使用 bolt-on（ElevenLabs、Suno，或 licensed stems + lip-sync pass）。

拒绝承诺在 free tier 上生成 &gt; 10s 的 1080p 连续运动（Pika / Kling / Runway 上限为 10s；更长的运行需要 stitched）。拒绝在没有 release 的情况下生成真实人物 likeness。标记任何暗示 2026 年可进行实时 4K generation 的 brief，当前最佳水平是在 hosted endpoint 上约 30s 生成一个 6s、1080p clip。
