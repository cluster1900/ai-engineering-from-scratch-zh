#  视频理解管道 (场景、QA、搜索)

> 12个实验室将将Marengo + Pegasus 产品化――VideoDB 发布CRUD-for-video API――AI2 的 Molmo 2 发布开放的VLM检查点――Gemini长文 原生处理数小时视频――TimeLens-100K 定义了大规模的时间接地――2026年的管道已确定:场景细分,场景标题+嵌入式"",转录配线"",多载体指数,以及返回 (开始,结束) 时间和框架预览查询――本 Capstone 需要摄入100小时视频,达到基准,并衡量问题计算和行动的解读――

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (UI)
**Prerequisites:** Phase 4 (CV), Phase 6 (speech), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:**子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子
**Time:** 30 小时

## 问题

长形式视频QA 是2026年规模下最耗费带宽的多模特问题. 双色球2.5 Pro 可以原生读取2小时视频,但将100小时视频摄入到可查询的体内,仍然需要场景级索引.

基准是公开的(ActivityNet-QA、NeXT-GQA),再加上你自己的100个查询定制集──计算和行动类型问题上的幻觉是已知的困难失败类;本Capstone会明确衡量它──

## 概念

入了三条管道并行运行.**Scene segmentation**视频将切成场景.**VLM captioning**为了每个场景生成标题,并从键盘中生成框架嵌入.**ASR alignment**产生字面级时间标签──三条流通过 (scene_id,时间范围) 加入──每个场景在多向量指数中获得三种向量类型:标题嵌入、键盘嵌入、转录嵌入──

时,自然语言问题会同时命中三种矢量;结果使用RRF 合并;时间定位适配器(TimeLens式) 会在顶部场景内细化 (开始,结束) 窗口──VLM合成器──Gemini 2.5 Pro 或 Qwen3-VL-Max) 接收查询+顶部场景+截片框架,并输出带引用时间和框架预览的回答──

幻觉测量很重要. 计算:"多少人进入房间?") 和动作类型:"厨师在之前倒了吗?") 问题出名地不可靠.

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
- 场景细分:TransNetV2(2024-26年最新) 或PySceneDetect
- 通过更快的语使用带字符时刻标签的语-v3-turbo
- 双子 2.5 级,或 Qwen3-VL-Max 或 Molmo 2
- 基于TimeLens-100K 训练的适配器或视频ITG
- 支持多向量的Qdrant(字幕 / 框架 / 转录)
- 接口:下一个.js 15,配 HTML5 视频播放器和场景缩影
- 标准:ActivityNet-QA、NeXT-GQA、自定义100个问题手动标记的集
- 带手标签的计算和行动类型子组


```figure
cf-scene-index
```

## 构建它
1. **Ingest walker.**接受YouTubeURL或本地MP4──如有需要,下调到720p──持久化`{video_id, file_path}`,我知道.

2. **Scene segmentation.**运行TransNetV2 或 PySceneDetect,生成`[{scene_id, start_ms, end_ms, keyframe_path}]`目标100小时:约6k-8k个场景

3. **ASR pass.**在音频上运行 Whisper-v3-turbo;导出字面级时刻标签;切分为场景转录片──

4. **VLM captioning.**对于每个场景,使用键盘和短标题模板调用双子 2.5 Pro (或 Qwen3-VL-Max) .

5. **Multi-vector index.**包含三个命名的向量的Qdrant集合──付费负载: `{video_id, scene_id, start_ms, end_ms, keyframe_url}`,我知道.

6. **Query.**自然语言问题触发三路密集查询;用相互级别融合合并;上-k=5个场景──

7. **Temporal grounding.**在上场上运行时光镜头式适配器,以细化场景内 (开始,结束) 窗口.

8. **VLM synth.**使用查询+前3场景片段(作为图像或短片) +转录调用双子 2.5 Pro──要求 `(video_id, start_ms, end_ms)`引用

9. **Eval.**运行 ActivityNet-QA 和 NeXT-GQA──构建一个100个查询的定制集──报告整体准确性+按类分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分

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
`outputs/skill-video-qa.md`是交付物品.给定一个YouTubeURL或上传的视频,管道会为场景建立索引,并使用带时间标签的引用回答问题.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Temporal grounding IoU | 在 held-out grounding set 上的 intersection-over-union |
| 20 | QA accuracy | NeXT-GQA 和 custom 100-query |
| 20 | Ingest throughput | 每美元可处理的视频小时数 |
| 20 | UI and citation UX | Timestamp links、thumbnail strip、jump-to-frame |
| 15 | Hallucination rate | 分别统计 counting 和 action-type accuracy |
| **100** | | |

## 练习
1. 在标题传递中将双子 2.5 Pro 替换为Qwen3-VL-Max. 在人类评级的50场景样本上报告标题质量德尔塔.

2. 将逐场景框架 嵌入从多向量 降至一个聚合向量 量度检索回归

3. 构建一个"严格计算"模式:合成器 提取每一个被计数的实例及其时间标签,用户点击验证――衡量用户验证 是否减少幻觉――

4. 基准摄入成本:比较三种VLM选择的视频每美元的小时――选择甜点――

5. 添加扬声器日记转录:在音频上运行 音符音符记者日记,并嵌入每个扬声器的转录.演示"爱丽丝对X说了什么?"问题.

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
- [AI2 Molmo 2](https://allenai.org/blog/molmo2) 开放VLM检查站
- [TimeLens (CVPR 2026)](https://github.com/TencentARC/TimeLens) 大规模的时间定位
- [Gemini Video long-context](https://deepmind.google/technologies/gemini) 托管的参考
- [VideoDB](https://videodb.io)CRUD-for-video API 参考
- [Twelve Labs Marengo + Pegasus](https://www.twelvelabs.io) 商业参考
- [TransNetV2](https://github.com/soCzech/TransNetV2)场景分区模型
- [PySceneDetect](https://github.com/Breakthrough/PySceneDetect) 经典开放替代方案
- [ActivityNet-QA](https://arxiv.org/abs/1906.02467)参考评价基准
