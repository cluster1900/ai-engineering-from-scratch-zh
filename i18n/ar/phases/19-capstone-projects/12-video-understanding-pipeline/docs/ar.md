# كابستون 12  视频理解 خط الأنابيب

> 12 مختبرات سوف مارينغو + بيغاسوس  منتجاتها. VideDB  نشر CRUD-for-video API. AI2  Molmo 2  نشر مفتوحة VLM نقطة التفتيش. جيمينين طويلة السياق.

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (UI)
**Prerequisites:** Phase 4 (CV), Phase 6 (speech), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:**P4 · P6 · P7 · P11 · P12 · P17
**Time:** 30 小时

## 问题

الفيديو طويل الأجل QA هو 2026 حجم أقل استهلاك بضعة أجزاء من التشغيل المتعدد 问题. جيمين 2.5 Pro يمكن أن يكون أصلاً قراءة 2 ساعات فيديو، ولكن سوف 100 ساعات فيديو استهلك حتى في جسم المقصود، لا يزال بحاجة إلى مؤشر على مستوى المشهد.

مقياس هو مفتوحة ((ActivityNet-QA、Next-GQA) ، إضافة مرة أخرى إلى مجموعة المطلوبات المخصصة الخاصة بك المئة.

## 概念

إحتمالات النبوب و التنقل**Scene segmentation**سأقطع الفيديو إلى المشهد**VLM captioning**لكل حالة، تم إنشاء عنوان،并 من الإطار الرئيسي**ASR alignment**产生 كلمات المستوى العلامة الزمنية──三条流通过 (scene_id، وقت المدى) join── كل场景在多 متجهة مؤشر(Qdrant) 中获得三种 متجه 类型:caption Embedding、keyframe Embedding、transcript Embedding──

استفسار 时,自然语言问题会同时命中三种矢量;结果使用RRF 合并;时间基调适配器(TimeLens-style)会在顶场内细化 (start, end) window──VLM synthesizer(Gemini 2.5 Pro 或 Qwen3-VL-Max) 接收 استفسار +顶场景 +截图框架,并输出带引用时间盖和框架预览的回答──

الهلوسة  قياس مهم للغاية. العد ((كم عدد الأشخاص الذين يدخلون الغرفة؟)) و نوع العمل (("هل يقوم الطاهي بالسكب قبل أن يخلط؟"))

## المكونات
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
- قسم المشهد: TransNetV2(2024-26 سنوات أحدث) أو PySceneDetect
- ASR: 通過 أسرع-تهمس استخدام مع كلمة timestamp of Whisper-v3-turbo
- فالمستقلات: جيمين 2.5 برو أو كوان3-فيل ماكس أو مولمو 2
- التأريخ الزمني: على أساس TimeLens-100K  التدريبات المعدل أو VideoITG
- المؤشر: 支持多向的 Qdrant(الردود / الإطار / النص)
- واجهة الوصول: Next.js 15 ، مع لاعب فيديو HTML5 و صور صغيرة للمشهد
- Eval: ActivityNet-QA、NeXT-GQA、自定义 100 سؤال مجموعة مع علامة يدوية
- مقياس الهلوسة: 带 اللقب اليدين  ‬ حساب ويعد نوع العمل


```figure
cf-scene-index
```

## بناءها
1. **Ingest walker.**قبل عنوان يوتيوب أو MP4 محلي ‬ إذا كان هناك حاجة، تراجع إلى 720p‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬`{video_id, file_path}`.

2. **Scene segmentation.**运行 TransNetV2 أو PySceneDetect,生成 `[{scene_id, start_ms, end_ms, keyframe_path}]`△ هدف 100 小时: حوالي 6K-8K 个场景──

3. **ASR pass.**في الصوت على النظام Whisper-v3-turbo;导出 كلمة مستوى العلامة الزمنية;切分为逐场景 نقل شريحة.

4. **VLM captioning.**لكل حالة، استخدام قالب الرموز وملف القصص 调用 Gemini 2.5 Pro((أو Qwen3-VL-Max)  توليد عنوان + إطار إدراجها‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

5. **Multi-vector index.**包含三个 متجهات مسموح بها مجموعة Qdrant.`{video_id, scene_id, start_ms, end_ms, keyframe_url}`.

6. **Query.**مشكلة اللغة الطبيعية 触发三路 كثافة الأسئلة 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合并 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合 合

7. **Temporal grounding.**في المشهد العلوي 上运行 TimeLens-style adapter،以细化场景内 (بدء، نهاية) نافذة

8. **VLM synth.**استخدام استفسار + أفضل 3 مقاطع المشهد(كالصور أو المقاطع القصيرة) + النصوص 调用 Gemini 2.5 Pro──要求 `(video_id, start_ms, end_ms)`الإقتباسات

9. **Eval.**运行 ActivityNet-QA 和 NeXT-GQA── بناء مجموعة مخصصة من 100 استفسار‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

## استخدمها
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

## 交付 it
`outputs/skill-video-qa.md`هو تسليم الأشياء. أعطيت عنوان YouTube أو على التسجيل الفيديو، النبوب سوف يكون للمشهد إقامة مؤشر، ومع استخدام مع علامة زمنية الإقتباسات.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Temporal grounding IoU | 在 held-out grounding set 上的 intersection-over-union |
| 20 | QA accuracy | NeXT-GQA 和 custom 100-query |
| 20 | Ingest throughput | 每美元可处理的视频小时数 |
| 20 | UI and citation UX | Timestamp links、thumbnail strip、jump-to-frame |
| 15 | Hallucination rate | 分别统计 counting 和 action-type accuracy |
| **100** | | |

## التدريب
1. في عرض الترجمة 中将 Gemini 2.5 Pro 替换为 Qwen3-VL-Max──在人类评级的50场景样本上报告标题质量德尔塔──

2. 将逐场景框架 إدراج من المتعدد المتجه 降为一个集结的 المتجه 

3. 构建一个"counting strict"模式:synthesizer 提取每一个被计数实例及其时间标签,用户点击验证――衡量用户验证 是否减少幻觉──

4. تكلفة استهلاك المقاييس: تقارن ثلاث أنواع اختيار VLM ساعات الفيديو لكل دولار

5. 添加音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频上运行 音频 音频上运行 音频 音频 音频 音频 音频 音频 音频 音频 音频 音频 音频 音频 音频 音频 音频 音频 音频 音频 音频 音频 音频 音频 音频 音 音频 音频 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音 音

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
- [AI2 Molmo 2](https://allenai.org/blog/molmo2)نقاط تفتيش في إف.إم.إم
- [TimeLens (CVPR 2026)](https://github.com/TencentARC/TimeLens) التأرجح الزمني على نطاق واسع
- [Gemini Video long-context](https://deepmind.google/technologies/gemini) إشارة مضيفة
- [VideoDB](https://videodb.io) CRUD-for-video API 参考
- [Twelve Labs Marengo + Pegasus](https://www.twelvelabs.io) 商业参考
- [TransNetV2](https://github.com/soCzech/TransNetV2) نموذج قسم المشهد
- [PySceneDetect](https://github.com/Breakthrough/PySceneDetect) 经典开放替代方案
- [ActivityNet-QA](https://arxiv.org/abs/1906.02467) مقياس تقييم مرجعي
