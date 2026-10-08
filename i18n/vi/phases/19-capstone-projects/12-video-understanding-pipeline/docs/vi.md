# Capstone 12  视频理解 Pipeline (đường tượng, hình ảnh, kỹ thuật, tìm kiếm)

> Twelve Labs sẽ Marengo + Pegasus  sản phẩm hóa. VideoDB  phát hành CRUD-for-video API. AI2  Molmo 2  phát hành mở VLM kiểm soát điểm. Gemini long-context.

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (UI)
**Prerequisites:** Phase 4 (CV), Phase 6 (speech), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:**P4 · P6 · P7 · P11 · P12 · P17
**Time:** 30 小时

## 问题

Video dài hình thức QA là vấn đề đa phương tiện tiêu thụ nhất quy mô 2026  Gemini 2.5 Pro có thể có sẵn 2 giờ video, nhưng sẽ 100 giờ video được thu nhập đến khoang truy vấn, vẫn cần chỉ số cấp cảnh.

Benchmark là công khai của ((ActivityNet-QA、NeXT-GQA), thêm vào bộ tùy chỉnh 100 câu hỏi của riêng bạn。Bí đếm và hành động-típ  vấn đề ảo giác là đã biết về các lớp thất bại khó khăn; 本 Capstone 会明确衡量它。

## 概念

Ngâm 时 có 3 đường ống và chạy.**Scene segmentation**Sẽ cắt đoạn phim thành cảnh tượng.**VLM captioning**Đối với mỗi cảnh tạo caption,并 từ keyframe 生成 frame Embedding.**ASR alignment**产生词级时间 stamp──三条流通过 (scene_id, time range) join──每个场景在多向量指数(Qdrant) 中获得三种向量 类型:caption Embedding、keyframe Embedding、transcript Embedding──

Query 时,自然语言问题会同时命中三种 Vector; kết quả sử dụng RRF 合并; thời gian-grounding adapter(TimeLens-style) sẽ ở trên cùng một cảnh 内细化 (bắt đầu, kết thúc) cửa sổ。VLM synthesizer(Gemini 2.5 Pro hoặc Qwen3-VL-Max) tiếp nhận truy vấn + cảnh trên cùng + khung hình cắt,并输出带引用时间和 khung hình xem trước câu trả lời。

Sự ảo giác  đo lường rất quan trọng. Việc đếm: "Có bao nhiêu người vào phòng?") và loại hành động: "nước đầu bếp đổ trước khi xích?")

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
- Phân khu vực cảnh: TransNetV2(2024-26 年 state-of-the-art) hoặc PySceneDetect
- ASR: 通过快速语 使用带字时刻的语-v3-turbo
- VLM captioner + answerer: Gemini 2.5 Pro hoặc Qwen3-VL-Max hoặc Molmo 2
- Tiêu chuẩn thời gian: dựa trên TimeLens-100K  huấn luyện bộ chuyển đổi hoặc VideoITG
- Chỉ số: 支持多向的 Qdrant(tít / khung / bản sao)
- UI: Next.js 15, phụ kiện trình phát video HTML5 và hình ảnh nhỏ cảnh
- Eval: ActivityNet-QA、NeXT-GQA、自定义 100 câu hỏi được dán nhãn bằng tay
- Định nghĩa tham chiếu ảo giác: 带 tay nhãn của đếm và các bộ phận loại hành động


```figure
cf-scene-index
```

##  xây dựng nó
1. **Ingest walker.** chấp nhận URL YouTube hoặc MP4 địa phương  Nếu cần, quy mô xuống đến 720p `{video_id, file_path}`

2. **Scene segmentation.**运行 TransNetV2 hoặc PySceneDetect, tạo `[{scene_id, start_ms, end_ms, keyframe_path}]`❖ mục tiêu 100 小时: khoảng 6k-8k 个场景──

3. **ASR pass.**Trong âm thanh trên运行 Whisper-v3-turbo;导出 từ cấp thời gian;切分为逐场景 transcript slices。

4. **VLM captioning.**Đối với mỗi trường hợp, sử dụng keyframe 和短 caption template 调用 Gemini 2.5 Pro (hoặc Qwen3-VL-Max)  tạo caption + frame Embedding。

5. **Multi-vector index.**包含三个 tên gọi vector của Qdrant bộ sưu tập.`{video_id, scene_id, start_ms, end_ms, keyframe_url}`

6. **Query.**Naturelanguageproblem触发三路 密集 truy vấn; dùng tương ứng cấp độ hợp nhất 合并;top-k=5 个场景。

7. **Temporal grounding.**Trong cảnh trên trên 上运行 TimeLens-style adapter,以细化场景内 (bắt đầu, kết thúc) cửa sổ.

8. **VLM synth.**使用 truy vấn + top 3 clip cảnh(作为图像或短片) + bản ghi âm 调用 Gemini 2.5 Pro──要求 `(video_id, start_ms, end_ms)`Các trích dẫn:

9. **Eval.**运行 ActivityNet-QA 和 NeXT-GQA。 xây dựng một bộ tùy chỉnh 100 truy vấn。 báo cáo độ chính xác toàn bộ + 按类 拆分(counting、action、descriptive)。

## Sử dụng nó
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

## 交付 nó
`outputs/skill-video-qa.md`là giao hàng. Đưa ra một URL YouTube hoặc trên truyền hình, đường ống sẽ xây dựng chỉ mục cho các trường hợp, và sử dụng trích dẫn bằng dấu thời gian.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Temporal grounding IoU | 在 held-out grounding set 上的 intersection-over-union |
| 20 | QA accuracy | NeXT-GQA 和 custom 100-query |
| 20 | Ingest throughput | 每美元可处理的视频小时数 |
| 20 | UI and citation UX | Timestamp links、thumbnail strip、jump-to-frame |
| 15 | Hallucination rate | 分别统计 counting 和 action-type accuracy |
| **100** | | |

## 练习
1. Trong bài đăng đăng trên Twitter, người dùng sẽ nhận được một số thông tin về các bản ghi chú của mình.

2. 将逐场景 frame 嵌入从多向量 降至一个聚向量――衡量检索回归――

3. 构建一个"counting strict" mode:synthesizer 提取每一个被计数实例及其时间标签,用户点击验证――衡量用户验证 是否减少幻觉――

4. Giá trị tiêu chuẩn:Bước 3: Tương tự:

5. 添加音频上运行 pyannote speaker diarization,并 Embedding 每个讲者的转录──演示 "Alice nói gì về X?" câu hỏi──

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
- [AI2 Molmo 2](https://allenai.org/blog/molmo2) 开放 VLM kiểm soát
- [TimeLens (CVPR 2026)](https://github.com/TencentARC/TimeLens) Giới hạn thời gian quy mô lớn
- [Gemini Video long-context](https://deepmind.google/technologies/gemini) tham chiếu được lưu trữ
- [VideoDB](https://videodb.io) CRUD-for-video API 参考
- [Twelve Labs Marengo + Pegasus](https://www.twelvelabs.io) 商业参考
- [TransNetV2](https://github.com/soCzech/TransNetV2) Mô hình phân đoạn cảnh
- [PySceneDetect](https://github.com/Breakthrough/PySceneDetect) 经典开放替代方案
- [ActivityNet-QA](https://arxiv.org/abs/1906.02467) Định nghĩa đánh giá tham chiếu
