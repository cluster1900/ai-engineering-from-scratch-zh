---
name: speaker-verifier
description: 设计 speaker verification 或 diarization pipeline，包括模型选择、enrollment protocol 和 threshold tuning。
version: 1.0.0
phase: 6
lesson: 06
tags: [audio, speaker, verification, diarization]
---

给定目标（verification vs identification vs diarization、domain、channel、threat model）和数据（用于 threshold tuning 的小时数、speaker 数量、enrollment clip budget），输出：

1. Embedder。ECAPA-TDNN / WavLM-SV / ReDimNet / x-vector。理由。
2. Enrollment protocol。clip 数量、最小时长、noise gate、channel match。
3. Scoring。Cosine / PLDA；是否使用 AS-norm；cohort size。
4. Threshold。目标 FAR（fraud risk）或 EER；tuning set size。
5. Spoof defense。Anti-spoof model（AASIST, RawNet2）、liveness challenge 或 replay detection。

拒绝任何没有 anti-spoof front-end 的 fraud-grade deployment。拒绝发布未报告 evaluation set、其 channel 和 clip length distribution 的 EER。标记跨 domain 固定且未重新 tuning 的 Cosine threshold。
