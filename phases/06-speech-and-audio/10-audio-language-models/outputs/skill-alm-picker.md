---
name: alm-picker
description: 为音频理解任务选择 audio-language model、benchmark subset、output modality（text vs speech）和 guardrails。
version: 1.0.0
phase: 6
lesson: 10
tags: [alm, lalm, qwen-omni, audio-flamingo, gemini-audio, mmau]
---

给定任务（speech / sound / music / multi-audio / long-audio、output modality、latency、license），输出：

1. Model. Qwen2.5-Omni-7B · Qwen3-Omni · SALMONN · Audio Flamingo 3 · AF-Next · LTU · GAMA · Gemini 2.5 Pro (API) · GPT-4o Audio (API)。一句话说明理由。
2. 用于验证的 benchmark subset。MMAU-Pro speech / sound / music / multi-audio · LongAudioBench · AudioCaps · ClothoAQA。选择与用户任务匹配的轴。
3. Output modality. Text-only · text + speech（Qwen-Omni, GPT-4o Audio）。如有需要，为额外的 speech decoder 预留预算。
4. Guardrails. 当你的模型 multi-audio 得分 &lt; 30%（接近随机）时，拒绝需要 multi-audio 比较的 prompts。对于 &gt; 10 分钟输入，在 LALM 前先做 diarization。
5. Escalation. 什么时候这个任务应该回退到 specialized model——Whisper 用于转写，BEATs 用于 Classification，pyannote 用于 diarization。LALM 并不是每个子任务上的最佳选择。

在未验证你的模型在 MMAU-Pro multi-audio 子集上得分 &gt; 40% 前，拒绝交付 multi-audio 比较任务。没有上游 diarization 时，拒绝 long-audio（&gt; 10 min）。标记任何使用 vendor-reported numbers 且没有独立重新验证的部署。

Example input: "合规审计：转写 10 分钟银行通话录音 + 检测坐席是否朗读了强制披露说明。"

Example output:
- Model: Whisper-large-v3-turbo 用于转写 + Gemini 2.5 Pro（via API）用于在 transcript 上做 disclosure-check QA。直接在 raw audio 上用 LALM 很诱人，但 long-audio LALM accuracy 在超过 10 min 后会下降。
- Benchmark subset: MMAU-Pro speech subset（Gemini 2.5 Pro = 73.4%）——覆盖 speech-reasoning 轴。也要在你自己的 50-call gold set 上 spot-check。
- Output modality: text-only。审计报告不需要 speech output。
- Guardrails: 先用 pyannote 3.1 做 diarize；分别发送 per-speaker segments；记录每通电话的 confidence score。
- Escalation: 如果某通电话未通过 disclosure check，路由给 human reviewer，而不是自动标记。
