# कैपस्टोन 12  视频理解 पाइपलाइन (场景、QA、搜索)

> बारह प्रयोगशालाओं Marengo + Pegasus  उत्पादकरण करेगा। वीडियोडीबी ने CRUD-for-video API को जारी किया है। AI2 का Molmo 2 ने खुला VLM चेकपॉइंट जारी किया है।

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (UI)
**Prerequisites:** Phase 4 (CV), Phase 6 (speech), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:**P4 · P6 · P7 · P11 · P12 · P17
**Time:** 30 小时

## 问题

लंबी प्रारूप वीडियो QA है 2026 के पैमाने पर सबसे अधिक खपत带宽 के मल्टीमोडल 问题。Gemini 2.5 Pro 可以原生读取 2 小时视频, लेकिन 100 小时视频 ingest 到可查询的体内, अभी भी दृश्य स्तर के सूचकांक की आवश्यकता है。生产形态会结合场段划分(TransNetV2 या PySceneDetect) ✓ VLM का उपयोग करके प्रत्येक दृश्य कैप्शन(Gemini 2.5、Qwen3-VL-Max या Molmo 2) ✓ ट्रांसक्रिप्ट संरेखण(带语句时刻标签的Whisper-v3-turbo),以及将带语句时刻标签的嵌和和写字并存的多向量索引──Query会会带语句时刻标签的回归 (回开始,回归)

बेंचमार्क  सार्वजनिक ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

## 概念

इनजीस्ट 时有三条管道并行运行──**Scene segmentation**वीडियो को एक दृश्य में बदल देगा**VLM captioning**प्रत्येक दृश्य के लिए कैप्शन उत्पन्न करें,并从键盘frame 生成框架嵌入.**ASR alignment**产生 वर्ड-लेवल टाइमस्टैम्प──三条流通过 (scene_id, time range) join── प्रत्येक场景在多向量指数中获得三种向量 类型:caption Embedding、keyframe Embedding、transcript Embedding──

क्वेरी 时,自然语言问题会同时命中三种 वेक्टर; परिणाम RRF 合并; समय-भूमि अनुकूलक(TimeLens-style)会在顶场内细化 (शुरू, समाप्त) विंडो──VLM सिंथेसाइज़र(Gemini 2.5 Pro या Qwen3-VL-Max) प्राप्त क्वेरी + शीर्ष दृश्य + क्रॉप फ्रेम,并输出带引用时间和框架预览的回答──

हलुसिनाशन 测量很重要──Counting("कौन से लोग कमरे में प्रवेश करते हैं?")) और एक्शन-टाइप("क्या शेफ हलचल से पहले डालता है?") प्रश्न बाहर आया।

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
- दृश्य विभाजनः ट्रांसनेटवी 2(2024-26 साल अत्याधुनिक) या PySceneDetect
- ASR: 通过快速语使用带词时刻标签 的语 v3-turbo
- VLM कैप्टन + उत्तरकर्ता: Gemini 2.5 Pro या Qwen3-VL-Max या Molmo 2
- समय पर ग्राउंडिंगः टाइम लेंस-100K  ट्रेनिंग एडाप्टर या वीडियोआईटीजी पर आधारित
- सूचकांक: 支持多向的 Qdrant(शीर्षक / फ्रेम / प्रतिलेख)
- यूआईः Next.js 15, HTML5 वीडियो प्लेयर और दृश्य लघु चित्रों के साथ
- Eval: ActivityNet-QA、NeXT-GQA、स्वयं परिभाषित 100 प्रश्नों के हाथ लेबल सेट
- हलुसिनाशन बेंचमार्क: 带 हाथ लेबल का गिनती 和 क्रिया प्रकार के उप-सेट


```figure
cf-scene-index
```

##  इसे निर्माण
1. **Ingest walker.** YouTube URL या स्थानीय MP4 स्वीकार करें  यदि आवश्यक हो, 720p तक डाउनस्केल `{video_id, file_path}`

2. **Scene segmentation.**运行 TransNetV2 या PySceneDetect, generated `[{scene_id, start_ms, end_ms, keyframe_path}]`❖ लक्ष्य 100 小时: लगभग 6k-8k 个场景──

3. **ASR pass.**在音频上运行 Whisper-v3-turbo;导出 शब्द स्तर का समय टिकट;切分为逐场景抄录片──

4. **VLM captioning.**प्रत्येक परिदृश्य के लिए, Keyframe और Short caption टेम्पलेट का उपयोग करें 调用 Gemini 2.5 Pro (या Qwen3-VL-Max) 

5. **Multi-vector index.**包含三个 नामित वेक्टर का Qdrant संग्रह──Payload: `{video_id, scene_id, start_ms, end_ms, keyframe_url}`

6. **Query.**प्राकृतिक भाषा समस्या触发三路 घने प्रश्न; परस्पर रैंक संलयन के साथ 合并; शीर्ष-क=5 个场景──

7. **Temporal grounding.**शीर्ष दृश्य में ऊपर चल रहा है TimeLens शैली एडाप्टर, को细化场景内 (शुरू, समाप्त) विंडो में

8. **VLM synth.**प्रयोग क्वेरी + शीर्ष 3 दृश्य क्लिप(क्योंकि चित्र या लघु क्लिप) + प्रतिलेखन 调用 Gemini 2.5 Pro──要求 `(video_id, start_ms, end_ms)`उद्धरणों

9. **Eval.**运行 ActivityNet-QA 和 NeXT-GQA── एक 100 क्वेरी कस्टम सेट का निर्माण करना── रिपोर्ट समग्र सटीकता + 按类 拆分(गणना、क्रिया、 वर्णनात्मक)──

## इसका उपयोग करें
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

## 交付 यह
`outputs/skill-video-qa.md`                                                                                                                                                                                                                                                              

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Temporal grounding IoU | 在 held-out grounding set 上的 intersection-over-union |
| 20 | QA accuracy | NeXT-GQA 和 custom 100-query |
| 20 | Ingest throughput | 每美元可处理的视频小时数 |
| 20 | UI and citation UX | Timestamp links、thumbnail strip、jump-to-frame |
| 15 | Hallucination rate | 分别统计 counting 和 action-type accuracy |
| **100** | | |

## अभ्यास
1. में कैप्शन पास 中将 Gemini 2.5 Pro 替换为 Qwen3-VL-Max──在人为评级的50场景样本上报告标题质量德尔塔──

2.  प्रति दृश्य फ्रेम एम्बेडिंग मल्टी-वेक्टर से 降低为一个聚合向量――衡量检索回归――

3. 构建一个"计数严格"模式:合成器 提取每一个被计数实例及其时间标签,用户点击验证――衡量用户验证 是否减少幻觉――

4. बेंचमार्क सेवन लागत: तुलना करें VLM विकल्प के घंटे-प्रति डॉलर वीडियो-चालना

5. 添加扬声器日记转录:在音频上运行 音符音符音符日记转录,并嵌入每一个扬声器的转录――演示 "एलिस ने एक्स के बारे में क्या कहा था?

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
- [AI2 Molmo 2](https://allenai.org/blog/molmo2) 开放 वीएलएम चेकपोस्ट
- [TimeLens (CVPR 2026)](https://github.com/TencentARC/TimeLens) बड़े पैमाने पर समय पर जमीनीकरण
- [Gemini Video long-context](https://deepmind.google/technologies/gemini) होस्ट किए गए संदर्भ
- [VideoDB](https://videodb.io) CRUD-for-video API 参考
- [Twelve Labs Marengo + Pegasus](https://www.twelvelabs.io) 商业参考
- [TransNetV2](https://github.com/soCzech/TransNetV2) दृश्य विभाजन मॉडल
- [PySceneDetect](https://github.com/Breakthrough/PySceneDetect) 经典开放替代方案
- [ActivityNet-QA](https://arxiv.org/abs/1906.02467) संदर्भ मूल्यांकन बेंचमार्क
