# Capstone 12  视频理解 Pipeline (PIP)

> Doce laboratorios van a Marengo + Pegasus  productos化。VideoDB  lanzó CRUD-for-video API。AI2  Molmo 2  lanzó un control de VLM abierto。Gemini de largo contexto 原生处理数小时视频。TimeLens-100K  definió una gran escala de tierra temporal。2026 años de la tubería  ya está definido: segmentación de escena、 captura de cada escena + Embedding、alineación de transcripción、 índice multivéctor, así como retorno (inicio, final) de tiempo sello y de visualización de marco‖本 Capstone 需要 ingest 100 小时视频, alcanzar el punto de referencia,并衡量问题计算和行动 之 hallucination‖

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (UI)
**Prerequisites:** Phase 4 (CV), Phase 6 (speech), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:**P4 · P6 · P7 · P11 · P12 · P17
**Time:** 30 小时

##  problemas

El video de formato largo QA es el problema multimodal más consumido a escala de 2026 años. Gemini 2.5 Pro puede ser utilizado en el corpus de las preguntas, pero todavía necesita un índice de nivel de escena. Producción de formaciones y segmentación de escena.

El punto de referencia es un punto de referencia de la clase de problemas conocidos, el problema de la dificultad de la falla.

## 概念

Ingest 时有三条管道并行运行──**Scene segmentation**Voy a cortar el video en escena.**VLM captioning**Para cada escenario generar captura,并 de la estructura clave generar estructura Embedding.**ASR alignment**产生 word-level timestamp──三条流通过 (scene_id, time range) join──每个场景在多向量指数(Qdrant) 中获得三种向量 类型:caption Embedding、keyframe Embedding、transcript Embedding──

Encuesta 时,自然语言问题会同时命中三种 Vector; resultados con RRF 合并; adaptador de tierra temporal (tiempo-lente estilo) 会在顶场内细化 (inicio, final) ventana──VLM sintetizador(Gemini 2.5 Pro o Qwen3-VL-Max) 接收查询 +顶场景 +截截图框,并输出带引用时间 ?? 和框架预览的回答──

La alucinación 测量很重要──Counting("¿cuántas personas entran en la habitación?") y tipo de acción("¿vertiene el chef antes de agitar?")

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
- Segmentación de escenas: TransNetV2(2024-26 años de vanguardia) o PySceneDetect
- ASR: 通过快速语 使用带词时刻的语 v3-turbo
- VLM capricho + respuesta: Gemini 2.5 Pro o Qwen3-VL-Max o Molmo 2
- Terreno temporal:  basado en el adaptador de entrenamiento TimeLens-100K o VideoITG
- Indice: 支持多向的 Qdrant(capción / marco / transcripción)
- Interfaz de usuario: Next.js 15, con reproductor de video HTML5 y miniaturas de escena
- Eval: ActivityNet-QA、NeXT-GQA、self define el conjunto de 100 preguntas etiquetadas a mano
- Indicador de referencia de alucinación: 带 etiquetas de mano                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            


```figure
cf-scene-index
```

## Construirlo
1. **Ingest walker.** acepta la URL de YouTube o MP4 local  Si es necesario, escala baja hasta 720p  Perdurable `{video_id, file_path}`¿Qué es eso?

2. **Scene segmentation.**运行 TransNetV2 o PySceneDetect, generado `[{scene_id, start_ms, end_ms, keyframe_path}]`△ objetivo 100 小时: alrededor de 6k-8k 个场景──

3. **ASR pass.**En su versión de audio, el programa Whisper-v3-turbo se ejecuta en el formato de un timestamp de nivel de palabra.

4. **VLM captioning.**Para cada escenario, utiliza la plantilla de captura y la plantilla de captura y la plantilla de captura y la plantilla de captura y la plantilla de captura y la plantilla de captura y la plantilla de captura y la plantilla de captura y la plantilla de captura y la plantilla de captura y la plantilla de captura y la plantilla de captura y la plantilla de captura y la plantilla de captura y la plantilla de captura y la plantilla de captura y la plantilla de captura y la plantilla de captura y la plantilla de captura.

5. **Multi-vector index.**包含三个 vectores nombrados de la colección Qdrant──Carga de pago: `{video_id, scene_id, start_ms, end_ms, keyframe_url}`¿Qué es eso?

6. **Query.**Naturspracheproblem触发三路 dense queries; con la fusión de rango recíproco 合并;top-k=5 个场景。

7. **Temporal grounding.**En la escena superior 上运行 TimeLens-style adaptador, en la ventana de inicio y fin de escena.

8. **VLM synth.**Utiliza la consulta + los primeros 3 clips de escena(como imágenes o clips cortos) + transcripciones 调用 Gemini 2.5 Pro──要求 `(video_id, start_ms, end_ms)`Las citas

9. **Eval.**运行 ActivityNet-QA 和 NeXT-GQA──construir un conjunto personalizado de 100 consultas──rapport precisión total + 按类 拆分(conting、action、descriptive)──

## Usalo
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

##  entregarlo
`outputs/skill-video-qa.md`Es un objeto de entrega. Se le ha dado una URL de YouTube o un video, un tubo de comunicación, que se encuentra en el escenario, y se utiliza para establecer un índice con una cita con un sello de tiempo.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Temporal grounding IoU | 在 held-out grounding set 上的 intersection-over-union |
| 20 | QA accuracy | NeXT-GQA 和 custom 100-query |
| 20 | Ingest throughput | 每美元可处理的视频小时数 |
| 20 | UI and citation UX | Timestamp links、thumbnail strip、jump-to-frame |
| 15 | Hallucination rate | 分别统计 counting 和 action-type accuracy |
| **100** | | |

##  ejercicios
1. En el pase de subtítulos 中将 Gemini 2.5 Pro 替换为 Qwen3-VL-Max──在 el hombre calificado muestra de 50 escenas 上报告 subtítulos de calidad delta──

2. 将逐场景 frame Embedding de múltiples vectores 降为一个集成的向量―― medir la regresión de recuperación―

3. 构建一个"counting strict" mode:synthesizer 提取每一个被计数实例及其时间标签,用户点击验证――衡量用户验证 是否减少幻觉──

4. Costo de ingesta de referencia: comparar las horas de vídeo por dólar.

5. 添加扬声器日记转录:在音频上运行 pyannote speaker diarization,并 Embedding 每个扬声器的转录――演示 "¿qué dijo Alice sobre X?" preguntas──

## 关键术语: "El hombre es un hombre"
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
- [AI2 Molmo 2](https://allenai.org/blog/molmo2) 开放 puestos de control de VLM
- [TimeLens (CVPR 2026)](https://github.com/TencentARC/TimeLens) Grounding temporal de gran escala
- [Gemini Video long-context](https://deepmind.google/technologies/gemini) Referencia alojada
- [VideoDB](https://videodb.io) API CRUD para vídeo  referencia
- [Twelve Labs Marengo + Pegasus](https://www.twelvelabs.io) 商业参考  商业参考  商业参考
- [TransNetV2](https://github.com/soCzech/TransNetV2) Modelo de segmentación de escenas
- [PySceneDetect](https://github.com/Breakthrough/PySceneDetect) 经典开放替代方案
- [ActivityNet-QA](https://arxiv.org/abs/1906.02467) Valoración de referencia
