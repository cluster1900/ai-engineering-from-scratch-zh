---
name: audio-evaluator
description: 为任意音频 model 发布选择指标、benchmark、规范化规则和报告格式。
version: 1.0.0
phase: 6
lesson: 17
tags: [evaluation, wer, mos, utmos, eer, der, fad, mmau, leaderboard]
---

给定任务（ASR / TTS / cloning / speaker-verif / diarization / classification / music / LALM / streaming S2S），输出：

1. Primary metric。WER · MOS · UTMOS · SECS · EER · DER · mAP · FAD · MMAU-Pro accuracy · latency P95。选择一个。
2. Secondary metrics。1-3 个额外维度（speed、diversity、robustness）及原因。
3. Normalization rule。转小写、去标点、数字展开、空白折叠。使用 Whisper-normalizer 或自定义规则，并将其记录下来。
4. Public benchmark。要对照报告的标准排行榜（Open ASR、TTS Arena、MMAU-Pro、VoxCeleb1-O、AudioSet、LongAudioBench 等）。
5. In-house set。包含 N 个样本的 held-out 领域数据；按 demographic / acoustic slice 拆分。
6. Reporting format。分布（latency 用 P50/P95/P99；classification 用 per-class recall；MMAU 用 per-category）。Release notes 模板。

拒绝对 latency 做单一数字评估（报告 percentile）。拒绝 classification 只报告 aggregate（报告 per-class）。拒绝不同时包含 MOS/UTMOS 和 SECS 的 TTS 发布（当涉及 cloning 时）。拒绝没有 WER 规范化说明的 ASR 发布。拒绝只使用 FAD 的音乐发布，始终配合人工 MOS panel。

示例输入: "发布新的英西会话式 TTS。需要说服团队它优于现有的 Cartesia-Sonic baseline。"

Example output:
- Primary: UTMOS（每种语言 50 个 prompt 的成对音频样本）+ human-panel MOS（每种语言 20 个听众，blind A/B vs baseline）。
- Secondary: TTFA median & P95（必须匹配 baseline）；相对固定 voice reference 的 SECS &gt; 0.80（无 speaker regression）；round-trip ASR（Whisper-large-v3-turbo）上的 CER &lt; 2%。
- Normalization: 用于 round-trip WER 的 Whisper-normalizer English + Hugging Face multilingual-normalizer Spanish。
- Public benchmark: TTS Arena（English）和 Artificial Analysis Speech，用于相对 ELO 定位。目标：距离最接近竞争者不超过 50 ELO。
- In-house: 200 个 held-out prompt（每种语言 100 个），覆盖金额、日期、产品名、2 句叙述、情绪化朗读、code-switched。10 个 demographic voice。
- Reporting: release note，包含 headline（UTMOS + MOS）、P50/P95 TTFA histogram、SECS CDF、CER per-category breakdown、failure-mode callouts（code-switched prompt 在 X% 处失败）。
