# InternVL3: Pretraño Multimodal Nativo

> El programa de aprendizaje de la lengua inglesa (LLM) se desarrolla en el contexto de la formación de los estudiantes de la lengua inglesa (LDL) y de la lengua inglesa (LDL) en el contexto de la formación de los estudiantes de la lengua inglesa (LDL).

**Type:** Learn
**Languages:** Python (stdlib, training-corpus mixer)
**Prerequisites:** Phase 12 · 05, Phase 12 · 07 (recipes)
**Time:** ~120 minutes

## El objetivo del aprendizaje
- 解释为什么后期VLM培训 会累积调整债务,并引用三个可测量症状(lubocatófico,drifío de respuesta,incoherencia visual-texto)
- 描述 InternVL3's native pre-training corpus mix, así como el texto: interleaved:
- Comparación entre V2PE (codificación de posición visual variable) y M-RoPE de Qwen2-VL.
- Cuentan con un Router de Resolución Visual (ViR) y un lenguaje de visión descoplado (DvD).

##  problemas
El entrenamiento post-hoc de VLM es una práctica de la mayoría de los estudiantes. Los estudiantes tendrán que incorporarse a la formación de LLM (Llama, Vicuna, Qwen, Mistral) y a la formación de la visión.

1. LLM congelado + codificador de visión congelada + proyector entrenable, en pares de captura
2. Descongelar el LLM, en los datos de instrucción
3. Selección de ajustes específicos de tareas.

Debida de alineación 会表现出三个 síntomas:

- El desgaste de los datos de los datos de los usuarios es un fenómeno que afecta a los usuarios de los datos de los usuarios.
- La respuesta deriva. La variación de la misma pregunta visual se obtiene en diferentes respuestas. El codificador de visión es más débil en relación con el LLM.
- Incoherencia visual-textual. VLM puede describir correctamente una imagen, y luego responder a un problema de contradicción con su propia descripción.

Los síntomas de la enfermedad se registran en la sección 4.5.4 de la MM1.5 se han calificado.

## 概念
### Preentrenamiento multimodales nativos

InternVL3 desde el principio comenzó a entrenar en un cuerpo de multimodal original.

- 40% de datos sólo de texto ((FineWeb、Proof-Pile-2 etc)
- 35% de datos de texto-imagen interconectados (el estilo OBELICS、MMC4)
- 20% de datos de captura de imagen emparejados
- 5% de datos de texto de vídeo

Los tokens de visión, los tokens de texto y las interacciones entre los modos, todos desde el primer paso de gradiente, comienzan a participar en la misma pérdida.

El entrenamiento del modelo base es un solo paso. La instrucción se realiza después, pero el modelo base ya ha puesto en práctica los tokens visuales.

### V2PE (codificación de posición visual variable)

Qwen2-VL utiliza M-RoPE,并 adopta una asignación de eje fija。InternVL3  introduce V2PE: codificación de posición 会按 modality type((text、image、video) cambios,并带有可学习扩展──实践中:

- Tokens de texto  obtener posición 1D (index de texto)
- Parches de imagen  obtener posición 2D ((rúa, columna) 』
- Los cuadros de vídeo  obtener posición 3D ((tiempo, fila, col) ⋅

Los participantes comparten la misma base de frecuencia RoPE, pero la asignación oculta de cada banda es un parámetro de aprendizaje, en lugar de un reparto fijo. Esto permite que durante el preentrenamiento se pueda libremente evaluar la resolución temporal y espacial de la frecuencia.

En el mismo cálculo, los índices de referencia de vídeo por encima de M-RoPE, de 1-2 分── no son cambios revolucionarios, pero más purificados──

### Router de resolución visual (ViR)

Optimización de despliegue――并非所有图像都需要全分辨率编码――一张只有一个低细节物体的照片,如果按1280px native编码,会浪费代币――ViR是一个小分类器,会在编码之前预测回答问题所需的最低分辨率――

En el tráfico de producción, el 60% de las consultas utiliza bajo o medio 就足夠.

### Desarrollo de lenguaje de visión descoplado (DvD)

Cuando se sirve un VLM de gran tamaño, el codificador de visión Cada imagen se ejecuta una vez, pero LLM se ejecuta para cada token de salida se vuelve a funcionar. Dos componentes de la caja de carga son diferentes.

对于一个8B + 400M encoder model,DvD相比相比共处大约能让每节点吞吐量 翻倍──

### Calidad de una sola etapa frente a una de varias

InternVL3  principal referencia de reclamo: en 78B params 下匹配 Gemini 2.5 Pro 的 MMMU-Pro──在 38B 下匹配 GPT-4o──在 8B 下领先开-8B leaderboard──全部基于单阶段预训+指令调节配方──

La hipótesis de alineación-deuda es viable: en comparación con la ganancia de la referencia de visión, InternVL3-8B en los puntos de referencia de texto (MMLU、GSM8K) pierde la cantidad de puntos, en comparación con Qwen2.5-VL-7B 更少── este modelo es más como un generalista, porque el entrenamiento es un cuerpo, en lugar de dos fragmentos de composición──

### El procedimiento de evaluación de las medidas de seguridad

InternVL3.5 ((agosto 2025) amplió esta receta― el mismo enfoque pre-treino nativo, más datos, más parámetros― la mejoría de MMMU es incrementada―.

InternVL-U(2026) para participar en la generación unificada, es decir, en la misma espina dorsal 顶部 通过MMDiT heads 输出图像──在这里 "U" 代表" Comprensión + generación", seguir los modelos unificados de estilo Transfusión(Leyón 12.13)──La misma espina dorsal nativa-pretrain 同时支持理解和 generación cabezas──

### Pre-entrenamiento nativo

El entrenamiento previo nativo no es gratis:

- Computación. Desde el principio de entrenamiento de un nuevo VLM y el costo de entrenamiento de un LLM de texto.
- Datos―en gran escala intercalados corpora de imágenes y texto 很稀缺──OBELICS Hay 141M documentos;MMC4 Hay 571M──en puro texto puede alcanzar 15T tokens──Multimodal pre-training de la escasez de datos es un duro约束──
- Uso de la base de LLM. Pre-entrenamiento nativo  abandonado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

La deuda de la línea de trabajo es mayor que la pérdida de reutilización, peor.


```figure
l5-native-pretrain
```

## Usalo
`code/main.py`Es un mezclador de entrenamiento y un simulador de router ViR.

- 接收一个目标 corpus mix(%text、%interleaved、%caption、%video),并计算每种方式的预期步骤──
- En una serie de consultas 上模拟 ViR routing(distribución:50% de bajo detalle、30% de medio、20% de alto detalle),并报告平均令牌数量──
- basado en el codificador vs LLM FLOPs  reportar estimaciones de rendimiento de DVD¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- Y排印后期高考 vs native pretraining 在 params、computación、data, así como los síntomas de alineación-deuda esperados  上的对比──

##  entregarlo
本课会产出                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `outputs/skill-native-vs-posthoc-auditor.md` Dado un plan de formación de VLM propuesto, que revisará debería elegir nativo o post hoc, marcar el riesgo de alineación-deuda,并推 corpus mix.

##  ejercicios
1. Estimación del delta de cálculo entre InternVL3-8B (pre-treino nativo) y LLaVA-OneVision-7B (post hoc) ⋅ GPU-hora de la proporción aproximadamente es ¿cuál? ¿Qué explica esta diferencia?

2. InternVL3  Report proporción es 40% texto / 35% entrelazado / 20% leyenda / 5% video。 Si tu objetivo es el video-pesado, por favor proponga una nueva proporción,并论证为什么

3. 阅读MM1.5 Sección 4 del libro sobre el olvido.  Expresar el punto de referencia de la mayor regresión en el entrenamiento post hoc.  ¿Cuánto ha perdido esta regresión?

4. ViR va a enviar el 60% del tráfico 路由到低解析度编码──它会误路由哪类查询──在需要高分辨率时发送到低分辨率时? propone tres modos de falla del router──

5. ¿En qué patrón de tráfico abajo, DVD podría dañar el rendimiento y no aumentar el rendimiento?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Native multimodal pretraining | "From scratch together" | Text + image + video tokens 从第 1 步开始参与 Loss，而不是之后再接上 |
| Alignment debt | "Post-hoc penalty" | 由把 vision 接到 frozen LLM 上导致的 text skills 和 answer consistency 可测量退化 |
| V2PE | "Variable visual pos encoding" | 每个 modality 的可学习 position encoding allocation；InternVL3 的 M-RoPE 后继方案 |
| ViR | "Resolution router" | 小 classifier，在 encoding 前按 query 选择所需最低 resolution，从而节省 inference tokens |
| DvD | "Decoupled deployment" | Vision encoder 在一个 GPU 上，LLM 在另一个 GPU 上，并通过 stream handoff；可让大型 VLMs 的 throughput 翻倍 |
| InternVL-U | "Unified understanding + generation" | 2026 年后续版本，为 native-pretrain backbone 加入 image-generation heads |
| Interleaved corpus | "OBELICS / MMC4" | 文本和图像按自然阅读顺序排列的 documents；native pretraining 的原材料 |

## 延伸阅读
- [Chen et al. — InternVL 1 (arXiv:2312.14238)](https://arxiv.org/abs/2312.14238)
- [Zhu et al. — InternVL3 (arXiv:2504.10479)](https://arxiv.org/abs/2504.10479)
- [InternVL3.5 (arXiv:2508.18265)](https://arxiv.org/abs/2508.18265)
- [InternVL-U (arXiv:2603.09877)](https://arxiv.org/abs/2603.09877)
- [Zhang et al. — MM1.5 (arXiv:2409.20566)](https://arxiv.org/abs/2409.20566)
