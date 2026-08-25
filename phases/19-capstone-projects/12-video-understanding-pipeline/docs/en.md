# Capstone 12 — 视频理解 Pipeline（场景、QA、搜索）

> Twelve Labs 将 Marengo + Pegasus 产品化。VideoDB 发布了 CRUD-for-video API。AI2 的 Molmo 2 发布了开放 VLM checkpoint。Gemini long-context 原生处理数小时视频。TimeLens-100K 定义了大规模 temporal grounding。2026 年的 pipeline 已经确定：scene segmentation、逐场景 caption + Embedding、transcript alignment、multi-vector index，以及返回 (start, end) timestamp 和 frame preview 的 query。本 Capstone 要 ingest 100 小时视频，达到公开 benchmark，并衡量 counting 和 action 问题上的 hallucination。

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (UI)
**Prerequisites:** Phase 4 (CV), Phase 6 (speech), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:** P4 · P6 · P7 · P11 · P12 · P17
**Time:** 30 小时

## 问题

Long-form video QA 是 2026 年规模下最消耗带宽的 Multimodal 问题。Gemini 2.5 Pro 可以原生读取 2 小时视频，但将 100 小时视频 ingest 到可 query 的 corpus 中，仍然需要 scene-level index。生产形态会结合 scene segmentation（TransNetV2 或 PySceneDetect）、使用 VLM 的逐场景 captioning（Gemini 2.5、Qwen3-VL-Max 或 Molmo 2）、transcript alignment（带 word timestamp 的 Whisper-v3-turbo），以及将 caption、frame Embedding 和 transcript 并排存储的 multi-vector index。Query pipeline 会返回带 frame preview 的 (start, end) timestamp。

Benchmark 是公开的（ActivityNet-QA、NeXT-GQA），再加上你自己的 100-query custom set。Counting 和 action-type 问题上的 hallucination 是已知的困难 failure class；本 Capstone 会明确衡量它。

## 概念

Ingest 时有三条 pipeline 并行运行。**Scene segmentation** 将视频切成场景。**VLM captioning** 为每个场景生成 caption，并从 keyframe 生成 frame Embedding。**ASR alignment** 产生 word-level timestamp。三条流通过 (scene_id, time range) join。每个场景在 multi-vector index（Qdrant）中获得三种 Vector 类型：caption Embedding、keyframe Embedding、transcript Embedding。

Query 时，自然语言问题会同时命中三种 Vector；结果用 RRF 合并；temporal-grounding adapter（TimeLens-style）会在 top scene 内细化 (start, end) window。VLM synthesizer（Gemini 2.5 Pro 或 Qwen3-VL-Max）接收 query + top scenes + cropped frames，并输出带引用 timestamp 和 frame preview 的回答。

Hallucination 测量很重要。Counting（"how many people enter the room?"）和 action-type（"does the chef pour before stirring?"）问题出了名地不可靠。请将这类问题的 accuracy 与 descriptive questions 分开报告。

## 架构
```
video file / URL
      |
      v
PySceneDetect / TransNetV2  (scene segmentation)
      |
      +--- per-scene keyframe --- VLM caption + frame embedding
      |                            (Gemini 2.5 Pro / Qwen3-VL-Max / Molmo 2)
      |
      +--- audio channel --- Whisper-v3-turbo ASR + word timestamps
      |
      v
multi-vector Qdrant: {caption_emb, keyframe_emb, transcript_emb}
      |
query:
  dense queries against all three -> RRF merge -> top-k scenes
      |
      v
TimeLens / VideoITG temporal grounding (refine start/end within scene)
      |
      v
VLM synth: query + top scenes + frame previews
      |
      v
answer + (start, end) timestamps + frame thumbs + citations
```

## 技术栈
- Scene segmentation: TransNetV2（2024-26 年 state-of-the-art）或 PySceneDetect
- ASR: 通过 faster-whisper 使用带 word timestamp 的 Whisper-v3-turbo
- VLM captioner + answerer: Gemini 2.5 Pro 或 Qwen3-VL-Max 或 Molmo 2
- Temporal grounding: 基于 TimeLens-100K 训练的 adapter 或 VideoITG
- Index: 支持 multi-vector 的 Qdrant（caption / frame / transcript）
- UI: Next.js 15，配 HTML5 video player 和 scene thumbnails
- Eval: ActivityNet-QA、NeXT-GQA、自定义 100-question hand-labeled set
- Hallucination benchmark: 带 hand labels 的 counting 和 action-type subsets

```figure
cf-scene-index
```

## 构建它
1. **Ingest walker.** 接受 YouTube URL 或本地 MP4。如有需要，downscale 到 720p。持久化 `{video_id, file_path}`。

2. **Scene segmentation.** 运行 TransNetV2 或 PySceneDetect，生成 `[{scene_id, start_ms, end_ms, keyframe_path}]`。目标 100 小时：约 6k-8k 个场景。

3. **ASR pass.** 在音频上运行 Whisper-v3-turbo；导出 word-level timestamp；切分为逐场景 transcript slices。

4. **VLM captioning.** 对每个场景，使用 keyframe 和短 caption template 调用 Gemini 2.5 Pro（或 Qwen3-VL-Max）。产生 caption + frame Embedding。

5. **Multi-vector index.** 包含三个 named vectors 的 Qdrant collection。Payload: `{video_id, scene_id, start_ms, end_ms, keyframe_url}`。

6. **Query.** 自然语言问题触发三路 dense queries；用 reciprocal rank fusion 合并；top-k=5 个场景。

7. **Temporal grounding.** 在 top scene 上运行 TimeLens-style adapter，以细化场景内的 (start, end) window。

8. **VLM synth.** 使用 query + top-3 scene clips（作为 images 或 short clips）+ transcripts 调用 Gemini 2.5 Pro。要求 `(video_id, start_ms, end_ms)` citations。

9. **Eval.** 运行 ActivityNet-QA 和 NeXT-GQA。构建一个 100-query custom set。报告整体 accuracy + 按 class 拆分（counting、action、descriptive）。

## 使用它
```
$ video-qa ask --url=https://youtube.com/watch?v=X "how many cars pass the intersection in the first minute?"
[scene]    23 scenes detected
[asr]      transcript complete, 4m12s
[index]    69 vectors written (23 scenes x 3)
[query]    top scene: scene 3 [01:32-01:54], confidence 0.84
[ground]   refined window: [00:12-00:58]
[synth]    gemini 2.5 pro, 1.4s
answer:    5 cars pass the intersection between 00:12 and 00:58.
citations: [scene 3: 00:12-00:58]
          [frame preview at 00:14, 00:27, 00:44, 00:51, 00:57]
```

## 交付它
`outputs/skill-video-qa.md` 是交付物。给定一个 YouTube URL 或上传的视频，pipeline 会为场景建立 index，并用带 timestamp 的 citation 回答问题。

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Temporal grounding IoU | 在 held-out grounding set 上的 intersection-over-union |
| 20 | QA accuracy | NeXT-GQA 和 custom 100-query |
| 20 | Ingest throughput | 每美元可处理的视频小时数 |
| 20 | UI and citation UX | Timestamp links、thumbnail strip、jump-to-frame |
| 15 | Hallucination rate | 分别统计 counting 和 action-type accuracy |
| **100** | | |

## 练习
1. 在 captioning pass 中将 Gemini 2.5 Pro 替换为 Qwen3-VL-Max。在 human-rated 50-scene sample 上报告 caption quality delta。

2. 将逐场景 frame Embedding 从 multi-vector 降为一个 pooled Vector。衡量 retrieval regression。

3. 构建一个 "counting strict" mode：synthesizer 提取每一个被计数实例及其 timestamp，用户点击验证。衡量 user-verification 是否减少 hallucination。

4. Benchmark ingest cost：比较三种 VLM choice 的 hours-of-video-per-dollar。选出 sweet spot。

5. 添加 speaker-diarized transcript：在音频上运行 pyannote speaker diarization，并 Embedding 每个 speaker 的 transcript。演示 "what did Alice say about X?" queries。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Scene segmentation | "Shot detection" | 在 shot boundary 处将视频切成场景 |
| Multi-vector index | "Caption + frame + transcript" | 每种 representation 使用 named vectors 的 Qdrant collection |
| Temporal grounding | "When exactly did it happen" | 为 query answer 细化 (start, end) window |
| Frame embedding | "Visual representation" | keyframe 的 Vector Embedding；用于 scene-visual similarity |
| RRF fusion | "Reciprocal rank fusion" | 跨多个 ranked lists 的合并策略；经典 hybrid-retrieval 技巧 |
| Counting hallucination | "Miscount" | VLMs 在 "how many X" 问题上的已知 failure mode |
| ActivityNet-QA | "Video-QA benchmark" | Long-form video QA accuracy benchmark |

## 延伸阅读
- [AI2 Molmo 2](https://allenai.org/blog/molmo2) — 开放 VLM checkpoints
- [TimeLens (CVPR 2026)](https://github.com/TencentARC/TimeLens) — 大规模 temporal grounding
- [Gemini Video long-context](https://deepmind.google/technologies/gemini) — hosted reference
- [VideoDB](https://videodb.io) — CRUD-for-video API 参考
- [Twelve Labs Marengo + Pegasus](https://www.twelvelabs.io) — 商业参考
- [TransNetV2](https://github.com/soCzech/TransNetV2) — scene segmentation model
- [PySceneDetect](https://github.com/Breakthrough/PySceneDetect) — 经典开放替代方案
- [ActivityNet-QA](https://arxiv.org/abs/1906.02467) — reference eval benchmark
