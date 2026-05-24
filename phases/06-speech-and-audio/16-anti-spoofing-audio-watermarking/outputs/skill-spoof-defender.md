---
name: spoof-defender
description: 为 voice-generation / voice-auth 部署选择 detection model、watermark、provenance manifest 和 operational playbook。
version: 1.0.0
phase: 6
lesson: 16
tags: [anti-spoofing, watermark, audioseal, asvspoof, c2pa, voice-fraud]
---

给定 workload（voice-gen vs voice-auth、deploy scale、compliance region、adversary profile），输出：

1. Detection (CM)。AASIST · RawNet2 · NeXt-TDNN + WavLM · 商用（Pindrop, Validsoft）。Training data：ASVspoof 2019 / ASVspoof 5 / domain-specific。Target EER。
2. Watermarking（outbound gen）。AudioSeal 16-bit payload encoding `(model_id, user_id, generation_ts)` · WaveVerify（替代）· none（附理由）。Detector 在每个 output pre-ship 上于 CI 中运行。
3. Provenance。使用 deployer key 签名的 C2PA manifest · IPTC metadata · none（用于 non-consumer audio）。
4. Voice-auth guards（如适用）。Liveness challenge（random phrase TTS' + transcribe）、replay attack detection（AASIST + PA model）、按 channel 校准 biometric threshold。
5. 运营。Audit log retention、consent artifact retention（7+ years）、abuse-detection signals（sudden volume burst, named-entity prompts）、kill-switch procedure。

拒绝没有 AudioSeal（或等效 watermark）的 voice-gen 部署。拒绝没有 anti-spoofing detection 的 voice biometric 部署，因为 voice cloning 使仅靠 cosine 的 auth 极易绕过。拒绝仅依赖 provenance manifest 的部署（可被剥离）。拒绝将基于 ASVspoof 2019 训练的 detection thresholds 用于真实世界部署，除非进行了 channel-calibration sweep。

Example input: "Bank customer-service IVR. Voice biometric unlock + AI-generated voice agent. 10M calls/month. US + EU."

Example output:
- Detection：Pindrop commercial（preferred）或 NeXt-TDNN + WavLM open。使用 ASVspoof 5 + 100k bank-specific call samples 训练。Target EER &lt; 0.5% on in-domain data。
- Watermarking：每个 outbound TTS utterance 使用 AudioSeal 16-bit payload；payload 编码 bank_id + session_id + timestamp。Detector 在 transmit 前验证。
- Provenance：在 audio-export-to-customer workflows 上使用 C2PA manifest；internal-only calls 跳过。
- Voice-auth：每次 auth 都执行 liveness challenge（TTS random 4-digit phrase；user repeats + detector + transcriber）。Anti-spoofing 在每次 inbound auth attempt 上运行。Biometric threshold 设置为 FAR 0.1%，FRR 1%。
- Operational：在 region 内保留 consent + audit log 7 年（EU data EU-resident）。对 sudden clone-request volume &gt; 2σ 发出 alert；abuse detection 时触发 kill-switch。
