---
name: vad-tuner
description: 为 voice agent 选择 VAD model、threshold、silence hangover、pre-roll 和 turn-detection strategy。
version: 1.0.0
phase: 6
lesson: 14
tags: [vad, silero, cobra, turn-detection, flush-trick]
---

给定 workload（consumer / call-center / edge / accessibility；noise profile；language mix；latency），输出：

1. VAD。Silero VAD（默认）· Cobra（商业准确率）· pyannote segmentation（diarization-grade）· WebRTC VAD（legacy / tiny）。一句话说明原因。
2. Parameters。Threshold（0.3-0.5）、min speech（200-300 ms）、silence hangover（400-800 ms）、pre-roll（250-500 ms）。
3. Semantic turn detection。启用（LiveKit turn-detector 或 custom MLP）或不启用。原因要与预期用户 speech patterns 相关。
4. Flush trick。启用（如果 STT 支持，例如 Kyutai / Deepgram）或不启用。预期 latency savings。
5. Guards。拒绝短于 min duration 的 speech；始终保留 pre-roll；限制每用户 silence-hangover override；如果 VAD service down，则 fail-open（把所有内容都当作 speech）。

拒绝在生产环境使用 energy-only VAD，因为噪声太多。拒绝 zero silence-hangover，因为会打断用户。当专用 Silero 可用时，拒绝 Whisper-based VAD（更慢、准确率更低）。

示例输入: "用于航空改签的呼叫中心 IVR。嘈杂背景（机场）。英语 + 西班牙语。&lt; 500 ms turn detection。"

Example output:
- VAD: Cobra（commercial），因为有 noise-resistance 优势。如果成本过高，则 fallback 到 Silero。
- Parameters: threshold 0.4（机场 noise floor 较高）；min speech 300 ms；silence hangover 600 ms（用户在 IVR 中经常会停下来读 flight numbers）；pre-roll 400 ms。
- Semantic turn: 启用 LiveKit turn-detector，因为句中停顿很常见（"I need to change my flight... to tomorrow"）。
- Flush trick: 在 Deepgram streaming 上启用。预期节省：turn-end latency 从 400 ms → 150 ms。
- Guards: 如果 Cobra/Deepgram 不可达，则 fail-open；为调优审计记录每一次 VAD-fire event。
