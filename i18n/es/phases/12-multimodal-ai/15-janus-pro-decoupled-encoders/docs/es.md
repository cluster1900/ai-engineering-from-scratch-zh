# Janus-Pro: para usar en un único código multimodal

> 统一 Multimodal 模型存在一种不可避免的张力──理解需要语义特征,即SigLIP或DINOv2 输出矢量,富含概念级信息──生成需要有利于重建代码,即能够重新组合清晰像素的VQ Tokens── estos dos objetivos no se compatibilizan en un solo codificador──Janus(DeepSeek,2024年10月) y Janus-Pro(DeepSeek,2025年1月) consideran que el método de modificación es parar a hacerse funcionar 统一:解 强行统一:解 两个 codificadores ──任务共享 Transformer body, pero entienden a través de SigLIP 路由, generados a través de VQ Tokenizer 路由── en 7B 尺度, Janus-Pro envalue superior a DALL-E 3, en la línea de MMMUVA ──explicar qué se puede hacer en dos clases en un solo encoder en el lugar donde el codificador ──

**类型：**Construir
**语言：**Python(stdlib, enrutamiento de doble codificación + señal de cuerpo compartido)
**先修：**Fase 12 · 13(Transfusión),Fase 12 · 14(Mostrar)
**时间：** 120 minutos

## El objetivo del aprendizaje
- Explicar por qué un único codificador compartido se sacrificará en la comprensión de la calidad o la generación de la calidad.
- Descripción de la ruta de Janus-Pro: entender en el lado de entrada usando las características SigLIP, generado en los dos lados de entrada y salida usando Tokens VQ。
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
- Comparación de las estructuras de las redes de transporte y de transporte de vehículos y de las redes de transporte y de transporte de vehículos.

##  problemas
统一模型在理解和生成之间共享 Transformer body──此前的尝试(Chameleon、Show-o、Transfusion) todos en dos direcciones usan el mismo Tokenizer visual── este Tokenizer es un tipo de tortuga:

- Por otra parte, el valor de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen
- Por ejemplo, el nombre de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de la marca de marca de la marca de la marca de marca de la marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de marca de

Show-o y Transfusión por lo tanto, en una dirección pagó un precio de calidad visible.

## 概念
### 解视觉编码

La estructura de Janus-Pro se divide en dos codificadores:

- Comprender el camino. Entrar en imagen. Siglip-SO400m.
- 生成路径──输入图像(如果基于已有图像进行条件化)→ VQ Tokenizer → Token IDs → Transformer body──
- 输出生成──Transformer 预测的图像代币 → VQ decoder → píxeles──

El cuerpo transformador es compartido. Todo lo que pasa y pasa en el cuerpo es un trabajo específico.

输入通过快速格式 消除歧义:`<understand>`etiqueta                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `<generate>`通过VQ 路由──或路由也可以由任务隐式决定── también puede ser decidido por el VQ 路由── o por el enrutamiento.

### ¿Por qué es efectivo?

Comprender la pérdida de conocimiento  obtener características SigLIP, mientras que el preentrenamiento estilo CLIP  ya ha sido mejor adaptado a la similaridad de palabras  El punto de referencia de percepción del modelo  Es superior a la Show-o / Transfusión, ya que las características de entrada son más adecuadas a esta tarea 

生成 loss 获得 VQ Tokens, mientras que Tokenizer 已 sido mejorado para adaptarse a la reconstrucción.

El cuerpo del transformador verá dos tipos de entrada distribuida (SigLIP y VQ), y aprenderá a procesar simultáneamente los dos. Su argumento es: siempre que los datos sean suficientes, los parámetros sean suficientes, el cuerpo podrá absorber este cambio.

### Número de datos: Janus vs Janus-Pro

Janus ([[original version, arXiv 2410.13848) ]] introdujo información, pero la escala es menor ]] 1.3B parámetros, datos limitados ]]]]

- Los parámetros 7B (en comparación con 1.3B)
- etapa 1 (alignamiento) utilizando 90M pares de imágenes y texto,高于 72M。
- etapa 2 (unificada) uso de 72M,高于 26M。
- etapa 3  aumentar 200k muestras de instrucciones de generación de imágenes。

结论是:Janus-Pro-7B en MMMU 上匹配 LLaVA(60.3 vs ~58), y en GenEval 上超过 DALL-E 3(0.80 vs 0.67)。 un modelo abierto, en los dos extremos del conjunto de la matriz de la generación tiene competencia。

### JanusFlow: flujo rectificado 变体

JanusFlow(arXiv 2411.07975) ha sustituido el VQ con flujo rectificado 生成路径 (continuo) en cambio de VQ 生成路径 (continuo) ―― desmantelarse en SigLIP-para-entender + flujo rectificado-para-generación―质量上限进一步提高──架构仍然是脱结码器-共享-body──

### Responsabilidades del organismo compartido

El cuerpo transformador 处理统一序列, pero face face to two kinds of input distribution. Su deber es:

- Para entender: consumo SigLIP características + texto Tokens → 自回归地输出文本。
- 对生成:消费文本代币 +(可选图像VQ代币)→ 自回归地输出图像VQ代币──

En cada bloque no hay pesos específicos de modalidad. Es como si vieras un transformador de estilo de texto en Qwen o Llama.

Es decir, esto significa que el cuerpo de Janus-Pro puede ser iniciado con un LLM pre-entrenado.

### En comparación con el InternVL-U

La lección 12.10) es una segunda etapa del año 2026:

- Preentrenamiento Multimodal nativo (internVL3)
- Enrutamiento de codificador descoplado (sigLIP en, VQ + difusión se dirige hacia fuera)
- 统一理解 + 生成 + 编辑。

InternVL-U va a absorber la arquitectura de Janus-Pro en un marco más amplio.

### Línguas

El codificador aumentará la complejidad de la estructura. Necesita entrenar dos tokenizers, mantener dos vías de entrada, procesar dos grupos de modos de falla.

对于不需要理解的产品,Janus-Pro 能力过剩,选择稳定扩散3 /流动模型即可──

Para los productos que necesitan ambos, Janus-Pro ahora es una referencia abierta.


```figure
l5-janus-decouple
```

## Usalo
`code/main.py`模拟 Janus-Pro enrutamiento:

- 两个 codificadores simulados:SigLIP-like (produce 256-dimensional 语义 vectores) y VQ-like (produce códigos enteros) ⋅
- Un router rápido, según la etiqueta de tarea 选择 Encoder。
- Un cuerpo compartido (stand-in), independientemente de los Tokens 序列 产生,都进行处理──
- Desde la etapa 1 (alignamiento) hasta la etapa 3 (tuna de instrucción) del calendario de muestras ponderadas 切换──

打印 3 个示例的路由路径:imagen QA、T2I、图像编辑──

##  entregarlo
本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-decoupled-encoder-picker.md` Dado que se espera obtener un producto de calidad y comprensión de la vida en la frontera, se escogerá Janus-Pro、JanusFlow o InternVL-U, y dará una sugerencia específica de tamaño de datos.

##  ejercicios
1. Janus-Pro-7B en GenEval 上 上超过 DALL-E 3。 Explicar por qué un modelo 7B abierto 模型能在生成上匹配边界 专有模型,但在理解上不能──

2. 实现 una función de enrutador:给定提示文本,将其分类为 `understand`O `generate`¿Cómo manejas las instrucciones de "describir y luego dibujar"?

3. JanusFlow con flujo rectificado sustituir VQ ruta... cuerpo transformador ahora lo que se produce? ¿Qué cambios ocurrirán?

4. proponer Janus-Pro 架构 通过再增加一个解编码 来处理的第四种任务──示例:segmentación de imágenes (DINO-style) 深度 (MiDaS-style) 

5. 阅读 Janus-Pro Sección 4.2 sobre el contenido de la expansión de datos. ¿Cuál es la etapa de datos que más contribuye a mejorar la calidad de T2I de Janus?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Decoupled encoding | "两个 visual encoders" | 每个方向使用单独的 Tokenizer 或 Encoder：理解使用语义向，生成使用重建向 |
| Shared body | "一个 Transformer" | 单个 Transformer 处理任一 Encoder 的输出；没有 modality-specific weights |
| SigLIP for understanding | "语义 features" | CLIP-family vision tower，提供丰富的概念 features，但重建较差 |
| VQ for generation | "重建 codes" | Vector-quantized Tokens，可以干净地 decode 回 pixels |
| JanusFlow | "Rectified-flow variant" | 使用 continuous flow-matching generation head 替代 VQ 的 Janus-Pro |
| Routing tag | "Task tag" | Prompt marker（`<understand>` / `<generate>`），用于选择输入 Encoder |

## 延伸阅读
- [Wu et al. — Janus (arXiv:2410.13848)](https://arxiv.org/abs/2410.13848)
- [Chen et al. — Janus-Pro (arXiv:2501.17811)](https://arxiv.org/abs/2501.17811)
- [Ma et al. — JanusFlow (arXiv:2411.07975)](https://arxiv.org/abs/2411.07975)
- [InternVL-U (arXiv:2603.09877)](https://arxiv.org/abs/2603.09877)
- [Dong et al. — DreamLLM (arXiv:2309.11499)](https://arxiv.org/abs/2309.11499)
