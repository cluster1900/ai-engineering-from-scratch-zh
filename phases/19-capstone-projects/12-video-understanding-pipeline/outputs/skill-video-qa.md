---
name: video-qa
description: 构建一个视频理解 pipeline，包含 scene segmentation、multi-vector indexing、temporal grounding 和 timestamped citations。
version: 1.0.0
phase: 19
lesson: 12
tags: [capstone, video, multimodal, gemini, qwen-vl, molmo, transnet, qdrant]
---

给定 100 小时视频，构建一个 ingestion pipeline 和 query system，能够用 `(start, end)` timestamps 加 frame previews 回答自然语言问题。

构建计划：

1. Ingest videos（YouTube URLs 或 MP4）；如有需要，downscale 到 720p。
2. 使用 TransNetV2 或 PySceneDetect 进行 scene segmentation；输出 `[{scene_id, start_ms, end_ms, keyframe_path}]`。
3. 使用 Whisper-v3-turbo（faster-whisper）进行 ASR，生成 word-level timestamps；按 scene 切分。
4. 使用 Gemini 2.5 Pro、Qwen3-VL-Max 或 Molmo 2 进行 VLM captioning；输出 caption + frame embedding。
5. Qdrant multi-vector index，每个 scene 有三个 named vectors（caption_emb, frame_emb, transcript_emb），payload 为 {video_id, scene_id, start_ms, end_ms, keyframe_url}。
6. Query：三个并行 dense queries；使用 reciprocal rank fusion 合并；top-k=5 scenes。
7. Temporal grounding（TimeLens adapter 或 VideoITG）在 top scene 内细化 `(start, end)`。
8. VLM synthesis（Gemini 2.5 Pro），输入 query + top-3 scene clips + transcript；要求提供 `(video_id, start_ms, end_ms)` citations。
9. 在 ActivityNet-QA、NeXT-GQA，以及一个含 100 个 query 的手工标注 custom set 上评估。报告总体 accuracy，并按 question class（descriptive、counting、action-type）分别报告。

评估 rubric：

| Weight | Criterion | Measurement |
|:-:|---|---|
| 25 | Temporal grounding IoU | 在 held-out grounding set 上的 IoU |
| 20 | QA accuracy | NeXT-GQA 和 100-query custom set |
| 20 | Ingest throughput | 每美元可 index 的视频小时数 |
| 20 | UI 和 citation UX | Timestamp links、thumbnail strip、jump-to-frame |
| 15 | Hallucination rate | 分别报告 counting 和 action-type accuracy |

硬性拒收：

- 每个 scene 只 pool 单个 Vector 的 pipelines。必须使用 multi-vector，才能呈现类别区分。
- 没有 `(start, end)` citations 的答案。
- 只报告一个总体 accuracy，而没有 counting/action subset breakdown。
- VLM synthesis 没有直接接收 scene frames（text-only inputs 会失去视觉 grounding）。

拒绝规则：

- 拒绝提供 license provenance 不清楚的视频；要求每个 video_id 都有 license tag。
- 当 ingest rates 高于实测 throughput 时，拒绝声称有 "real-time" response。
- 拒绝把 counting/action hallucination 数字隐藏在总体 accuracy figure 里。

输出：一个 repo，包含 scene segmentation + ASR + captioning pipeline、multi-vector Qdrant collection、temporal grounding adapter、带 timestamp deep-links 的 Next.js 15 viewer、三个 benchmark eval results（ActivityNet-QA、NeXT-GQA、custom），以及一份 write-up，说明你观察到的三个 counting 或 action-type failure classes，以及降低每类问题的 retrieval 或 synthesis change。
