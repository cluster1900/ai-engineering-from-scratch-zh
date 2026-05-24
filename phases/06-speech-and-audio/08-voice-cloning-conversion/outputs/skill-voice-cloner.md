---
name: voice-cloner
description: 为 voice-cloning deployment 选择 cloning approach（zero-shot / conversion / adaptation）、consent artifact、watermark 和 safety filters。
version: 1.0.0
phase: 6
lesson: 08
tags: [voice-cloning, voice-conversion, watermark, consent, safety]
---

给定任务（language、可用 reference length、adaptation budget、license constraints、consent status、deployment scale），输出：

1. 方法。Zero-shot clone (F5-TTS / VibeVoice / Orpheus / OpenVoice V2) · voice conversion (kNN-VC / OpenVoice V2 tone-color) · speaker adaptation (XTTS v2 + LoRA / VITS full fine-tune)。
2. Reference prep。所需长度、SNR (≥ 20 dB)、mono 16 kHz+、silence trim、`ref_text`（对于 F5-TTS 必须完全匹配）。拒绝带 music-bed 的 references。
3. Consent artifact。来自声音所有者的明确录制 consent。模板：name + date + purpose + scope + revocation procedure。保存 7 年以上。
4. Watermark。每个输出都使用 AudioSeal-embedded 16-bit payload。配置 CI 中的 detector，在发布音频前验证其存在。
5. Safety filters。Named-entity（celebrity / politician / minor）prompt-rejection；按用户每小时 rate-limit；每次 clone generation 的 audit log；kill-switch。

没有 watermarking strategy 就拒绝交付 cloning。无论 consent claims 如何，都拒绝 clone named celebrities / politicians / minors。拒绝 3 s 以下或 SNR &lt; 20 dB 的 references。拒绝将 F5-TTS 用于商业 deployments（CC-BY-NC）。没有明确标注 accent-transfer gap 时，拒绝 cross-lingual clone。

示例输入: "无障碍应用：让 ALS 患者在仍能说话时存储自己的声音，然后在失声后通过 TTS 说话。英语，美国。"

Example output:
- Approach: OpenVoice V2（MIT，zero-shot，6 s reference）。无障碍 use case 具有内在 consent；患者是 voice owner。
- Reference prep: 在 studio-quality 条件下录制 5 × 6 s clips（安静房间、USB mic、24 kHz）。保存 raw + transcripts。构建 centroid reference 以提升稳定性。
- Consent: digital signature + video affirmation，证明 purpose（"post-diagnosis voice reuse"），存储在 encrypted volume 中，retention 为 10 年。Revocation hotline。
- Watermark: AudioSeal 16-bit payload，编码 `patient_id` + `clip_id`；detector 在 CI 中对每次 generation 运行。
- Safety: hard-filter named-entity prompts；记录每次 generation；ROI-limited 到患者已登录的 app instance。无 API exposure。
