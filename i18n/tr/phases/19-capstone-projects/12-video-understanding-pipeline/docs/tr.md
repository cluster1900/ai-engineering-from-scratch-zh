# Kapstone 12  视频理解 Pipeline (Pipeline)

> 12 Laboratuvar Marengo + Pegasus  ürünleşimi yayınladı. VideoDB CRUD-for-video API yayınladı. AI2'nin Molmo 2 açık VLM kontrol noktasını yayınladı. Gemini uzun bağlamlı.

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (UI)
**Prerequisites:** Phase 4 (CV), Phase 6 (speech), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:**P4 · P6 · P7 · P11 · P12 · P17
**Time:** 30 小时

## 问题

Uzun format video QA 2026 yılındaki en fazla tüketimli带宽 问题. Gemini 2.5 Pro 2 saatlik videoları, ancak 100 saatlik videoları sorgulama yapılabilir korpusuna kadar alıyor. Hala sahne seviyesinde bir indeks gerektirir.

Benchmark is open of ((ActivityNet-QA、NeXT-GQA), yeniden kendi 100 sorgu özel seti ekleyin。 Sayım ve eylem tipi  sorulardaki halüsinasyon bilinen güçlük başarısızlık sınıfıdır; 本 Capstone 会明确衡量它──

## 概念

İçeri girdiğinde üç tane boru hattı var ve işlevleri devam ediyor.**Scene segmentation**Videoyu bir sahneye dönüştüreceğim.**VLM captioning**Her bir sahne için yazı oluşturmak, tıklama çerçevesinden oluşturmak İçeri gömmek.**ASR alignment**产生 word-level timestamp──三条流通过 (scene_id, time range) join──每个场景在多向量索引中获得三种向量 类型:caption Embedding、keyframe Embedding、transcript Embedding──

Sorgu 时,自然语言问题会同时命中三种 Vector; sonuç RRF 合并;zamanlı yerleşim adaptörü(TimeLens tarzı) 会在顶场内细化 (başlangıç, son) penceresi。VLM sentezörü(Gemini 2.5 Pro veya Qwen3-VL-Max) 接收查询 +顶场景 +截截图框,并输出带引用时间盖和框架预览的回答。

Halüsinasyon  ölçüm çok önemlidir. ◊ Saymak: "Hangiz kişi odaya girer?") ve eylem tipi: "Sofya karıştırmadan önce döküyor mu?") soru çıkıyor.

## Yapılandırma
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
- Sahne segmentasyonu: TransNetV2(2024-26 yıl) veya PySceneDetect
- ASR: 通過快速的使用带字时刻印的的的v3-turbo
- VLM Kapsiyoner + Cevaplayıcı: Gemini 2.5 Pro veya Qwen3-VL-Max veya Molmo 2
- Zamanlı yerleştirme: TimeLens-100K  eğitimli adaptör veya VideoITG tabanlı
- Endeks: 支持多向的 Qdrant(caption / frame / transcript)
- UI: Next.js 15, HTML5 video oynatıcısı ve sahne miniatürleri
- Eval: ActivityNet-QA、NeXT-GQA、自定义 100-soru el etiketleme seti
- Halüsinasyon referansı: 带 el etiketleri 带 el etiketleri 带 el etiketleri 带 el etiketleri 带 el etiketleri 带 el etiketleri 带 el etiketleri 带 el etiketleri 带 el etiketleri 带 el etiketleri 带 el etiketleri 带 action type subset


```figure
cf-scene-index
```

## Yapın onu.
1. **Ingest walker.**YouTube URL'lerini veya yerel MP4'leri kabul edin. İhtiyaç varsa, 720p'e kadar indir.`{video_id, file_path}`- Evet.

2. **Scene segmentation.**运行 TransNetV2 veya PySceneDetect, generated `[{scene_id, start_ms, end_ms, keyframe_path}]`❖ hedef 100 小时: Yaklaşık 6k-8k 个场景──

3. **ASR pass.**Whisper-v3-turbo;导出 kelime seviyesindeki zaman damgası;切分为逐场景抄录片──

4. **VLM captioning.**Her bir sahne için, anahtar çerçeve ve kısa başlık şablonunu kullanın.

5. **Multi-vector index.**包含三个命名的向量的Qdrant collection──Payload: `{video_id, scene_id, start_ms, end_ms, keyframe_url}`- Evet.

6. **Query.**Doğal dil sorusu 触发三路 密集查询; 合并; top-k=5 个场景──

7. **Temporal grounding.**Yukarı sahne 上运行 TimeLens tarzı adaptör,以细化场景内 (başlangıç, son) penceresi

8. **VLM synth.**使用 query + top-3 sahne klipleri(作为图像或短片) + transkripts 调用 Gemini 2.5 Pro──要求 `(video_id, start_ms, end_ms)`İpuçlar

9. **Eval.**运行 ActivityNet-QA 和 NeXT-GQA。 100 sorgu özel bir set oluşturun。 rapor tüm doğruluk + 按类 拆分(counting、action、descriptive)。

## Kullan
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

## - Söyle.
`outputs/skill-video-qa.md`Yapılan açıklamalar, YouTube'un bir URL'i veya video, bir video ve bir video bağlantısı ile yapılan açıklamalar ve bir zaman damgası ile yapılan açıklamalar ile yapılmış.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Temporal grounding IoU | 在 held-out grounding set 上的 intersection-over-union |
| 20 | QA accuracy | NeXT-GQA 和 custom 100-query |
| 20 | Ingest throughput | 每美元可处理的视频小时数 |
| 20 | UI and citation UX | Timestamp links、thumbnail strip、jump-to-frame |
| 15 | Hallucination rate | 分别统计 counting 和 action-type accuracy |
| **100** | | |

## 练习
1. Üzerinde yazılı resimler var. Üzerinde yazılı resimler var.

2. Bu durumda, bir dizi vektörden bir toplam vektör olarak düşebilir.

3. 构建一个"计数严格"模式:synthesizer 提取每一个被计数实例及其时间标签,用户点击验证――衡量用户验证 是否减少幻觉──

4. Benchmark inlet maliyeti:BİRİN VLM seçeneği

5. 添加扬声器日记转录:在音频上运行 音符音符音符音符日记转录,并 Embedding 每个扬声器的转录――演示 "Alice X hakkında ne dedi?" sorular──

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
- [AI2 Molmo 2](https://allenai.org/blog/molmo2) 开放 VLM kontrol noktaları
- [TimeLens (CVPR 2026)](https://github.com/TencentARC/TimeLens) Büyük çaplı zamanlı yerleşim
- [Gemini Video long-context](https://deepmind.google/technologies/gemini) Ev sahipliği yapılmış referans
- [VideoDB](https://videodb.io) CRUD-for-video API 参考
- [Twelve Labs Marengo + Pegasus](https://www.twelvelabs.io) 商业参考
- [TransNetV2](https://github.com/soCzech/TransNetV2) Sahne segmentasyonu modeli
- [PySceneDetect](https://github.com/Breakthrough/PySceneDetect) 经典开放替代方案
- [ActivityNet-QA](https://arxiv.org/abs/1906.02467) Referans değerlendirme referans değerlendirme
