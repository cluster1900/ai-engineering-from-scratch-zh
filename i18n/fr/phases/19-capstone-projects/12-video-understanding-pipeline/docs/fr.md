# Capstone 12  视频理解 Pipeline (en anglais seulement)

> Twelve Labs va mettre en place Marengo + Pegasus  productalisation。VideoDB  a publié CRUD-for-video API。AI2  Molmo 2  a publié un point de contrôle VLM ouvert。Gemini long-context 原生处理数小时视频。TimeLens-100K  définit une large gamme de temps de repérage。2026 ans pipeline 已确定:scene segmentation、场景逐场 caption + Embedding、transcript alignment、multi-vector index, ainsi que retour (start, end) timestamp 和 frame preview queries。本 Capstone 需要摄入 100 小时视频,达到开标,并衡量问题计算和行动 之上的幻灯片。

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (UI)
**Prerequisites:** Phase 4 (CV), Phase 6 (speech), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:**P4 · P6 · P7 · P11 · P12 · P17
**Time:** 30 小时

##  problématique

La vidéo de format long est la plus consommée de bande passante de la gamme Multimodal 问题。Gemini 2.5 Pro se peut lire 2 小时视频, mais va 100 小时视频 ingest jusqu'à la corpus de requêtes, il faut encore un index de niveau scène。生产形态会结合场景分区(TransNetV2或 PySceneDetect)、使用VLM的逐场字幕写 ((Gemini 2.5、Qwen3-VL-Max或 Molmo 2)、转录配线(带字时标语的Whisper-v3-turbo), ainsi que l'embedding 和转录并存的多向量索引──Query会会带字段管返回的 (回启动,回归) 时间标签──

Le point de référence est ouvert de ((ActivityNet-QA、NeXT-GQA), réajoutez votre propre ensemble personnalisé de 100 requêtes。Counting 和 action-type  problèmes d'hallucination est une classe de difficulté de défaillance déjà connue;本 Capstone 会明确衡量它。

## 概念

Il y a trois lignes de pipeline et des trains.**Scene segmentation**Je vais faire une vidéo.**VLM captioning**Pour chaque scène générer des sous-titres,并从键盘 生成框架嵌入式.**ASR alignment**产生 word-level timestamp──三条流通过 (scene_id, time range) join──每个场景在多向量索引中获得三种向量 类型:caption Embedding、keyframe Embedding、transcript Embedding──

Question 时, natur语言问题会同时命中三种 Vector; résultats avec RRF 合并; adaptateur de rétention temporelle (temporal grounding adapter) TimeLens style) 会在顶场内细化 (start, end) window──VLM synthesizer(Gemini 2.5 Pro 或 Qwen3-VL-Max) 接收查询 + top scenes + cropped frames,并输出带引用时间 ?? 和 frame preview 的答案──

La mesure des hallucinations est importante. Comptez-vous "combien de personnes entrent dans la pièce?") et type d'action "le chef verse-t-il avant de bouger?")

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

## 技术
- Segmentation de scène: TransNetV2(2024-26 ans de pointe) ou PySceneDetect
- ASR: 通过快速语 使用带词时刻的语 v3-turbo
- VLM caption + réponse: Gémeaux 2.5 Pro ou Qwen3-VL-Max ou Molmo 2
- Le temps de mise à terre:  basé sur l'adaptateur de formation TimeLens-100K ou VideoITG
- Index: 支持多向的 Qdrant(titre / cadre / transcription)
- UI: Next.js 15, avec le lecteur vidéo HTML5 et les thumbnails de scène
- Eval: ActivityNet-QA、NeXT-GQA、self-definition de 100 questions étiquetées à la main
- Indice de référence des hallucinations: 带 labels de main                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              


```figure
cf-scene-index
```

## - Je le construis.
1. **Ingest walker.** Accepter l'URL YouTube ou MP4 local  si nécessaire, réduire à 720p `{video_id, file_path}`Il y a une autre.

2. **Scene segmentation.**运行 TransNetV2 ou PySceneDetect, généré `[{scene_id, start_ms, end_ms, keyframe_path}]`△ objectif 100 小时: environ 6k-8k 个场景──

3. **ASR pass.**Dans le cas d'un film, le film est en cours de production.

4. **VLM captioning.**Pour chaque scène, utilisez le modèle de sous-titres et de sous-titres de base 调用 Gemini 2.5 Pro () 或 Qwen3-VL-Max () .

5. **Multi-vector index.**包含三个 vecteurs nommés de la collection Qdrant。Payload: `{video_id, scene_id, start_ms, end_ms, keyframe_url}`Il y a une autre.

6. **Query.**Naturelanguageproblème触发三路密集查询;Use réciproque rang fusion 合并;top-k=5 个场景。

7. **Temporal grounding.**Dans la scène supérieure, l'adaptateur TimeLens est utilisé pour le démarrage et la fin de la fenêtre.

8. **VLM synth.**Utilisation de requêtes + clips de scènes 3 principales(en tant qu'images ou clips courts) + transcriptions 调用 Gemini 2.5 Pro──要求 `(video_id, start_ms, end_ms)`Les citations

9. **Eval.**运行 ActivityNet-QA 和 NeXT-GQA。construire un ensemble personnalisé de 100 requêtes。rapport accuracy total + 按 class 拆分(counting、action、descriptive)。

## Utilisez-le
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

## Je le livre.
`outputs/skill-video-qa.md`Il est livré à la main-d'œuvre. Il a été donné une URL YouTube ou une vidéo, un pipeline pour créer un index de scénario, et a été utilisé avec une citation avec un timestamp.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Temporal grounding IoU | 在 held-out grounding set 上的 intersection-over-union |
| 20 | QA accuracy | NeXT-GQA 和 custom 100-query |
| 20 | Ingest throughput | 每美元可处理的视频小时数 |
| 20 | UI and citation UX | Timestamp links、thumbnail strip、jump-to-frame |
| 15 | Hallucination rate | 分别统计 counting 和 action-type accuracy |
| **100** | | |

## 练习
1. Dans le passe de sous-titres, le Gemini 2.5 Pro est remplacé par Qwen3-VL-Max.

2. Pour chaque cadre de scénario Embedding de multi-vecteur 降为一个聚向矢量──衡量检索回归──

3. 构建一个"counting strict" mode:synthesizer 提取每一个被计数实例及其时间标签,用户点击验证――

4. Coût d'ingestion de référence: comparer les heures de vidéo par dollar.

5. 添加扬声器日记转录:在音频上运行 pyannote speaker diarization,并 Embedding 每个扬声器的转录──演示 "Que dit Alice sur X?" questions──

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
- [AI2 Molmo 2](https://allenai.org/blog/molmo2) 开放 Les postes de contrôle du VLM
- [TimeLens (CVPR 2026)](https://github.com/TencentARC/TimeLens) Grounding temporelle à grande échelle
- [Gemini Video long-context](https://deepmind.google/technologies/gemini) référence hébergée
- [VideoDB](https://videodb.io) API CRUD-pour-vidéo  référence
- [Twelve Labs Marengo + Pegasus](https://www.twelvelabs.io) 商业参考
- [TransNetV2](https://github.com/soCzech/TransNetV2) modèle de segmentation de scène
- [PySceneDetect](https://github.com/Breakthrough/PySceneDetect) 经典开放替代方案
- [ActivityNet-QA](https://arxiv.org/abs/1906.02467) référence de référence d'évaluation
