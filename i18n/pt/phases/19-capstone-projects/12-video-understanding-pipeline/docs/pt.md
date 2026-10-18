# Capstone 12  视频理解 Pipeline (PIP)

> Doze Laboratórios vão Marengo + Pegasus  produtos化。VideoDB  Publicou CRUD-for-video API。AI2  Molmo 2  Publicou aberto VLM checkpoint。Gemini long-context 原生处理数小时视频。TimeLens-100K  definiu uma grande escala de aterragem temporal。2026 ano pipeline 已确定:scenas segmentação、 cada cenário captura + Embedding、transcript alignment、multi-vector index, bem como retornar (começo, fim) tempo e quadro de previsão de consulta。本 Capstone 需要摄入 100 小时视频,达到公开标志,并衡问题计算和行动 之上的幻灯片──

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (UI)
**Prerequisites:** Phase 4 (CV), Phase 6 (speech), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:**P4 · P6 · P7 · P11 · P12 · P17
**Time:** 30 小时

## 问题

O vídeo de longa duração QA é o problema multimodal mais consumido do nível de 2026: Gemini 2.5 Pro pode ser ingerido em 2 horas de vídeo, mas vai ter 100 horas de vídeo ingerido até o corpus de consulta, ainda precisa de um índice de nível de cena.

Benchmark é aberto de ((ActivityNet-QA、NeXT-GQA), reajustar seu próprio conjunto personalizado de 100 perguntas。Counting 和 action-type  problem hallucinação é conhecida dificuldade de falha classe; 本 Capstone 会明确衡量它──

## 概念

Ingest 时有三条管道并行运行──**Scene segmentation**Vai cortar o vídeo para o cenário.**VLM captioning**Para cada cenário gerar captura,并 from keyframe 生成 frame Embedding。**ASR alignment**产生 word-level timestamp──三条流通过 (scene_id, time range) join──每个场景在多向量索引中获得三种向量 类型:caption Embedding、keyframe Embedding、transcript Embedding──

Query 时,自然语言问题会同时命中三种 Vector; resultados usando RRF 合并; adaptador de fixação temporal (TimeLens-style) 会在顶场内细化 (start, end) window──VLM sintetizador(Gemini 2.5 Pro 或 Qwen3-VL-Max) 接收查询 +顶场 +截截图,并输出带引用时间 ?? 和框架预览的回答──

A alucinação  medida é importante. Contando "quantas pessoas entram na sala?") e tipo de ação "o chef derrama antes de agitar?")

## Arquitetura
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
- Segmentação de cenas: TransNetV2(2024-26 anos de última geração) ou PySceneDetect
- ASR: 通過快速聲 使用带字时刻的聲-v3-turbo
- VLM caption + answerer: Gemini 2.5 Pro ou Qwen3-VL-Max ou Molmo 2
- Terra temporária: baseado em TimeLens-100K  training's adapter ou VideoITG
- Índice: 支持多向的 Qdrant(caption / frame / transcript)
- UI: Next.js 15, com reproductor de vídeo HTML5 e miniaturas de cenas
- Eval: ActivityNet-QA、NeXT-GQA、self define conjunto de 100 perguntas rotulado à mão
- Referência de alucinação: 带 hand labels 的 counting 和 action type subset


```figure
cf-scene-index
```

## Construí-lo
1. **Ingest walker.** aceitar URL do YouTube ou MP4 local `{video_id, file_path}`- Não.

2. **Scene segmentation.**运行 TransNetV2 ou PySceneDetect, gerado `[{scene_id, start_ms, end_ms, keyframe_path}]`△ objectivo 100 小时: cerca de 6k-8k 个场景──

3. **ASR pass.**Em Whisper-v3-turbo;导出 字段级时刻;切分为场景转录片──

4. **VLM captioning.**Para cada cenário, use o modelo de tela de texto e de texto em formato curto 调用 Gemini 2.5 Pro () 或 Qwen3-VL-Max () 产生 caption + frame Embedding

5. **Multi-vector index.**包含三个命名的向量的 Qdrant Collection──Payload: `{video_id, scene_id, start_ms, end_ms, keyframe_url}`- Não.

6. **Query.**Naturspracheproblem触发三路 dense queries; usando a fusão de rango recíproco 合并;top-k=5 个场景。

7. **Temporal grounding.**Na cena superior 上运行 TimeLens-style adapter,以细化场景内 (começo, fim) janela

8. **VLM synth.**Utilize query + top-3 clips de cenas(como imagens ou clips curtos) + transcrições 调用 Gemini 2.5 Pro──要求 `(video_id, start_ms, end_ms)`citações.

9. **Eval.**运行 ActivityNet-QA 和 NeXT-GQA──construir um conjunto personalizado de 100 consultas── relatório de precisão total + 按类 拆分(counting、action、descriptive)──

## Use-o
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

## Entrega-o
`outputs/skill-video-qa.md`É um item de entrega. Foi dado um URL do YouTube ou um vídeo, um pipeline irá construir um índice para o cenário, e foi citado com timestamp  responder a pergunta.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Temporal grounding IoU | 在 held-out grounding set 上的 intersection-over-union |
| 20 | QA accuracy | NeXT-GQA 和 custom 100-query |
| 20 | Ingest throughput | 每美元可处理的视频小时数 |
| 20 | UI and citation UX | Timestamp links、thumbnail strip、jump-to-frame |
| 15 | Hallucination rate | 分别统计 counting 和 action-type accuracy |
| **100** | | |

## 练习
1. Em passagens de legendas 中将 Gemini 2.5 Pro 替换为 Qwen3-VL-Max──在人类评级的50场样本上报告标题质量德尔塔──

2. Empregar de um vetor múltiplos 降为一个聚向量―― medir a regressão de recuperação―

3. Construir um modo "contando estritamente": sintetizador 提取每一个被计数的实例及其时间标签,用户点击验证――Meter user-verification 是否减少幻觉──

4. Custo de ingestão de referência: comparar três tipos de escolha de VLM de horas de vídeo por dólar.

5. 添加扬声器日记转录:在音频上运行 pyannote speaker diarization,并 Embedding Cada transcrição de um orador.

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
- [AI2 Molmo 2](https://allenai.org/blog/molmo2)Pontos de controlo VLM abertos
- [TimeLens (CVPR 2026)](https://github.com/TencentARC/TimeLens) Grounding temporal em grande escala
- [Gemini Video long-context](https://deepmind.google/technologies/gemini) Referência hospedada
- [VideoDB](https://videodb.io) CRUD-for-video API  referência
- [Twelve Labs Marengo + Pegasus](https://www.twelvelabs.io) 商业参考
- [TransNetV2](https://github.com/soCzech/TransNetV2) Modelo de segmentação de cenas
- [PySceneDetect](https://github.com/Breakthrough/PySceneDetect) 经典开放替代方案
- [ActivityNet-QA](https://arxiv.org/abs/1906.02467) Valor de referência de avaliação
