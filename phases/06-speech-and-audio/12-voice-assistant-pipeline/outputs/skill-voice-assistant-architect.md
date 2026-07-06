---
name: voice-assistant-architect
description: 为给定 workload 产出 full-stack 语音助手 spec，包括 components、latency budget、observability、compliance。
version: 1.0.0
phase: 6
lesson: 12
tags: [voice-assistant, architecture, livekit, pipecat, compliance]
---

给定 use case（consumer / customer-support / accessibility / edge）、预期 scale（concurrent sessions、minutes/month）、language、latency targets、compliance（HIPAA, PCI, EU AI Act, CA SB 942），输出：

1. Components（7 layers）。Mic + chunking · VAD · streaming STT · LLM + tools · streaming TTS · playback · interruption handler。为每一层指定确切 provider/model。
2. Latency budget。每个 stage 的 P50 / P95 / P99 targets，并汇总到 end-to-end target。标出哪些 stages 是 independent，哪些是 sequential。
3. Tool-call schema。每个 tool 的 JSON spec + error handling + fallback text。始终包含一个 "can't help" path，LLM 在失败两次后必须采用该路径。
4. Safety。Prompt injection guard、voice-cloning lockout（如果 TTS 支持 cloning）、wake-word gate（用于 always-on）、logs 中的 PII redaction、30-day retention。
5. Observability。每个 stage 的 P50/P95/P99 · false-interruption rate · tool-call success rate · 每 100 calls 的 WER · cost per minute · abandon rate。
6. Compliance。披露音频（"This is an AI assistant"）、region-pinning（EU data in EU）、audit log retention、opt-out pathway。

拒绝没有 wake word 的 always-on deployments。拒绝不支持 streaming 的 TTS（会增加 utterance-length latency）。拒绝没有 P95 的平均 latency — tail 才是用户流失发生的地方。拒绝在没有 legal review 的情况下保留 raw-audio &gt; 30 days。

示例输入: "面向低视力用户的无障碍 assistant：通过纯语音界面操作消费者 email app。英语。P95 &lt; 600 ms。~10k 并发用户。"

示例输出:
- 组件: sounddevice (WebRTC via LiveKit Agents) · Silero VAD · Deepgram Nova-3 (English) · GPT-4o with email tools (read_message, compose_reply, mark_read) · Cartesia Sonic 2 streaming · WebRTC out · VAD 触发时 interrupt=cancel-LLM-and-TTS。
- Budget: capture 120 ms + VAD 40 + STT 150 + LLM TTFT 100 + TTS TTFA 150 = 560 ms P95。
- Tools: read_message({id}), compose_reply({message_id, body}), mark_read({id}), search({query}). 全部返回 JSON；LLM 对每个 tool 最多 retry 2 次，然后 fallback "I couldn't do that — try rephrasing".
- Safety: prompt-injection guard（检测 `ignore previous instructions`）；wake word "Hey Mail"；无 voice cloning（固定 Cartesia voice）；在 logs 中 redact email bodies。
- Observability: Hamming AI production monitoring；per-stage Prometheus histograms；当 false-interrupt &gt; 5% 或 p95 &gt; 800 ms 时 alert。
- Compliance: 首次使用时进行 AI disclosure；仅对 medical messages 提供 HIPAA opt-in；EU users 访问 EU-hosted Cartesia + GPT-4o Ireland。
