# Modelos de lenguaje de vídeo: Tokens temporales y Grounding

> Video no es una superposición de fotografía. Un clip de 5 segundos tiene una secuencia de efectos, movimientos y eventos, estos son modelos de imagen 无法表示的. Video-LLaMA, Zhang et al., junio 2023) publicó el primer video abierto con fundamento audiovisual LLM. VideoChat y Video-LLaVA ampliaron este modelo. Hasta el año 2025, el TMRoPE de Qwen2.5-VL se redujo a la diferencia con los modelos propietarios fronterizos. Cada sistema se resuelve de diferentes maneras a los tokens temporales: Q-former por clip, Concat-pool por frame, TMRoPE por token.

**Type:** Build
**Languages:** Python (stdlib, frame sampler + temporal-grounding evaluator)
**Prerequisites:** Phase 12 · 08 (LLaVA-OneVision)
**Time:** ~180 minutes

## El objetivo del aprendizaje
-  Explicar por qué el codificación posicional temporal 会独立于视觉编码器 改变视频VLM性能──
- Comparar el muestreo de marcos de forma uniforme, dinámica-FPS y impulsado por eventos en tokens por segundo con la precisión de aterrizaje.
- 描述 Q-ex-per-clip(Video-LLaMA)、pooled-per-frame(Video-LLaVA) y M-RoPE-per-token(Qwen2.5-VL) diseño。
- Cuatro puntos de referencia de vídeo: VideoMME, TempCompass, EgoSchema, Video-MMMU,

##  problemas
Un video de 1 minuto、30 FPS tiene 1800 cuadros―por cada cuadro 196 tokens visuales ViT-B en 224) calcula, éstas son 352k tokens, más que cualquier contexto LLM de la era 2024―

Hay tres estrategias de compresión:

1. En el caso de los modelos de cuadros de la muestra, el contenido de los mismos se basa en los datos de la muestra.
2. Para cada marco de tokens de parches  realizar fuerte pooling(3x3 o 4x4 bilinear pool)
3. 通过 Q-former 压缩:输入一个16frame clip,输出64 tokens──

Cada tipo de cambio es diferente. La submuestreo pierde detalles temporales. La piscina pierde detalles espaciales.

La codificación de posición temporal es otra dimensión: modelo ¿cómo saber cuadro 5 发生在图6 之前?

## 概念
### Video-LLaMA: cada clip un ex-Q + rama de audio

Video-LLaMA(2023) es el primer video-LLM.

- Clip de 16 cuadros a 2 FPS ((即 8 秒) ⋅
- Las funciones de ViT por fotograma -> Video Q-former,对全部16 frames做交叉服务 -> 32 consultas aprendidas -> LLM。
- Y行 audio branch:waveform -> ImageBind audio encoder -> Audio Q-former -> 32 consultas -> LLM。

优势: razonamiento conjunto audiovisual―弱点: longitud fija del clip, incapaz de manejar la tierra de tiempo arbitraria―

### VideoChat y Video-LLaVA

VideoChat guardó el camino de Video-LLaMA, pero eliminó el audio y simplificó.

Dos de ellos no pueden procesar videos largos. Dos de ellos son sistemas de 8-16 cuadros.

### Qwen2.5-VL y TMRoPE

Qwen2.5-VL  introdujo TMRoPE, es decir, Embedding de posición rotaria temporal-modalidad。 cada token de parche 携带一个 (t, h, w) 位置, entre los cuales t es el sello de tiempo real(no el índice de marco)。

Diferencias clave entre el simple tiempo de incorporación:

- 绝对时间, no index. El modelo que vemos es en 4.2 segundos, no en el marco 15.
- Rotation por token, no por clip. Cada token visual tiene su propio tiempo de giro.
- 兼容动态FPS──如果这里以2 FPS采样,那里以4 FPS采样,TMRoPE puede ser originario de este tipo de diferencias de espacio.

TMRoPE 支持猫在第几秒跳起? 这类查询──模型可以输出在 4.2 segundos──视频-LLaMA 只有可以说在片段──

### Estrategias de muestreo de marco

Uniforme: durante toda la duración dentro de los cuadros N, pero perderá picos de movimiento.

FPS dinámico: según la intensidad del movimiento 自适应采样──Optico flujo o diferenciación de marco 会在高动作段 选择更密集的采样──Qwen2.5-VL 会这样训练──

Event-driven:运行一个轻量探测器,在行动发生处采样更多──VideoAgent 使用这种方式──

Cuadro clave + contexto: en los límites de la toma + en los cuadros adyacentes 采样── para el contenido cinematográfico──

### Reunión por marco

En 1 FPS y 576 tokens por fotograma, un clip de 5 minutos es de 172.800 tokens.

3x3 bilinear pool reducirá cada fotograma a 64 tokens -> 5 minutos para 19.200 tokens― para la mayoría de las tareas es un punto dulce―

Para los flujos de trabajo de los agentes se puede activar mejor el pooling ((6x6 -> cada marco 16 tokens), porque el detalle espacial 没那么重要――

### Los cuatro puntos de referencia de vídeo

- VideoMME: comprensión integral de vídeo, incluye corto + medio + largo.
- TempCompass:细粒度 razonamiento temporal, contiene preguntas "antes" / "después"
- EgoSchema:长时程第一人称视频──
- Video-MMMU:Multimodal 多学科视频问题──

完整视频-VLM evaluation 会覆盖全部四个──它们强调不同维度:TempCompass 关注订单,EgoSchema 关注3+ minutos de razonamiento,VideoMME 覆盖多种持续时间──

### Formatos de salida de tierra

El tiempo de tierra de la salida de forma:

- Texto libre:"El gato salta alrededor de la marca de 4 segundos".
- JSON estructurado:`{"event": "jump", "start": 4.1, "end": 4.3}`❖ Qwen2.5VL 会训练这种形式──
- Basado en tokens: especial `<time>4.1</time>`Los tokens se encuentran en el formato interno de Qwen2.5-VL.

El formato de salida JSON de Qwen2.5VL puede ser resuelto directamente.

### 2026 mejores prácticas

Las mejores prácticas de VLMs para 2026:

- Código:带 M-RoPE o TMRoPE de SigLIP 2(Qwen2.5-VL)。
- Muestreo de cuadros: FPS dinámico (en función del movimiento)
- El conjunto por fotograma: 3x3 bilinear.
- Producción: contenía tiempo + evento 字段的结构化 JSON。
- Indicadores:VideoMME + TempCompass Usado para el general;EgoSchema Usado para el largo horizonte。


```figure
video-temporal-patches
```

## Usalo
`code/main.py`包含:

- Muestrador de marco uniforme y dinámico FPS.
- Un evaluador de tiempo de base de juguete: dado tiempo T 处 "verdad fundamental" evento 和 modelo de salida, en tolerancia dentro de la evaluación de la precisión.
- Video-LLaMA(16 marcos,Q-ex)、Video-LLaVA(8 marcos,MLP)、Qwen2.5-VL(FPS dinámico + TMRoPE) entre la comparación

##  entregarlo
本课会产出                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `outputs/skill-video-vlm-frame-planner.md` Determinar una tarea de vídeo:  monitoreo, reconocimiento de acción, tierra temporal, resumen, seleccionará el modelo de marco, factor de agrupación, formato de salida y nivel de precisión esperado.

##  ejercicios
1. Para una demostración de cocina de 3 minutos, elegir uniforme y FPS dinámico.

2. TMRoPE  concretamente añadió ¿qué, es una simple tabla de incorporación temporal hacer no hasta?

3. 写一个VLM可学习输出时间接地 JSON schema──包含错误案例──

4. 阅读 Video-LLaVA Sección 3 中的 "Alignment Before Projection"―¿Por qué esto es mejor que entrenar en códigos independientes de imágenes y videos?

5.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Temporal grounding | "Time-localized answers" | VLM 会为事件发生时间输出具体 timestamp range |
| TMRoPE | "Time-Multimodal RoPE" | 带绝对 timestamps 的 3D rotary position，由 Qwen2.5-VL 使用 |
| Dynamic FPS | "Motion-aware sampling" | 在 high-motion segments 采样更多 frames，在 static segments 采样更少 |
| Frame pooling | "Spatial compress per frame" | 在进入 LLM 前用 bilinear interpolation 减少每个 frame 的 patches |
| Video Q-former | "Clip compressor" | 将 N frames 映射到 K learned queries 的 cross-attention bottleneck |
| VideoMME | "Video bench" | 综合 short/medium/long video benchmark，2500+ samples |

## 延伸阅读
- [Zhang et al. — Video-LLaMA (arXiv:2306.02858)](https://arxiv.org/abs/2306.02858)
- [Li et al. — VideoChat (arXiv:2305.06355)](https://arxiv.org/abs/2305.06355)
- [Lin et al. — Video-LLaVA (arXiv:2311.10122)](https://arxiv.org/abs/2311.10122)
- [Qwen Team — Qwen2.5-VL (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
- [Lin et al. — VILA-1.5 (arXiv:2312.07533)](https://arxiv.org/abs/2312.07533)
