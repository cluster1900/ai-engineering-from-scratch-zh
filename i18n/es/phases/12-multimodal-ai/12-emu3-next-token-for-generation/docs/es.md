# Emu3: para la generación de imágenes y vídeos de la predicción de los próximos tomos

> BAAI's Emu3(Wang et al., 2024 年 9 月) es el resultado de un desacuerdo de difusión y autoregresividad 之争的2024年本应终结 Diffusion与autoregressive之争的结果── un único Transformer decoder-only de estilo Llama, sólo en la predicción de los próximos tokens 目标上训练, abarcando texto + tokens de imagen VQ + 3D VQ de tokens de vídeo 统一词汇, en la generación de imágenes derrotar a SDXL, en la percepción derrotar a LLaVA-1.6── no hay pérdida de CLIP── no hay guía libre de clasificación en el programa de difusión── en la razonamiento se utiliza para mejorar la calidad, pero es el objetivo de la formación central que lleva a los maestros a forzar la predicción de los próximos tokens── publicado en Nature──本mu3's thesis, que es por qué un mejor token de la escala que usted puede obtener, leer todo lo que se puede hacer en comparación con el método de difusión.

**Type:** Learn
**语言：**Python(stdlib,3D de vídeo tokenizer matemática + esqueleto de muestreo autoregresivista)
**Prerequisites:** Phase 12 · 11（Chameleon）
**Time:** ~120 分钟

## El objetivo del aprendizaje
-  Explicar por qué la única pérdida de Emu3 de la siguiente señal  objetivo puede funcionar, a pesar de que desde hace mucho tiempo se ha supuesto que la calidad de imagen necesita difusión 
- 描述3D video tokenizer:spaceotemporal VQ codebook 是什么样子,为什么补丁 会跨越时间──
- Comparar Emu3 con la Difusión Estable XL en el cálculo de la formación  La diferencia en el límite de coste y calidad 
- Cuento con un modelo de Emu3 扮演的三个角色:Emu3-Gen(imagen gen) 、Emu3-Chat(percepción) 、Emu3-Stage2(video gen) 。

##  problemas
Hasta el año 2024 la opinión tradicional es: la generación de imágenes necesita difusión. Su conclusión es: los tokens de imagen discretos perderán demasiada información, no podrán reconstruir detalles, mientras que el muestreo autoregresivamente se realizará en miles de tokens.

Emu3 está enfrentando este argumento. Su principal objetivo es: mejor Tokenizer visual + 足够的规模 + siguiente token loss = en el mismo modelo también puede hacerse percepción, lograr la generación de imágenes de difusión.

Dos años después, la familia de generación unificada de Open Source (Emu3、Show-o、Janus-Pro、Transfusion) se ha convertido en un camino de investigación estándar; los modelos de producción de nivel fronterizo parecen también utilizar algún tipo de variación。

## 概念
### El tokenizador Emu3

关键成分是视觉Tokenizer──Emu3 训练一个定制 IBQ-class Tokenizer(Inverse Bottleneck Quantizer,SBER-MoVQGAN family), cada token hacer 8x8 resolución-reducción──一张 512x512 图像会变成64x64 = 4096 tokens, código de tamaño 为 32768──

Este comparado con Chameleon en K=8192 时每张 512x512 1024 tokens Más grandes, pero cada Token más barato(Más pequeños búsquedas de códigos, más sencillo de códigos)  Indicador clave: reconstruir PSNR en 30.5 dB, puede con el espacio latente continuo de 32 dB de difusión estable 竞争──

对于视频:3D VQ Tokenizer va a ser un parche espacio-tiempo(4x4x4 píxeles) codificado para un número completo。 un clip de 4s,8 FPS, tiene 32 cuadros; en 256x256、4x espacio y 4x reducción temporal 下,Token 数量为 (256/4) * (256/4) * (32/4) = 64 * 64 * 8 = 32,768 tokens。

El tokenizador 质量就是上限──Emu3 贡献部分在于我们训练一个非常好的 tokenizador──

### Formación de pérdida única

Emu3 utiliza un objetivo: en tokens de texto, tokens de imagen 2D y tokens de video 3D, el vocabulario compartido de los tokens de vídeo 3D, para hacer predicción de los próximos tokens, durante el entrenamiento, se calcularán los factores específicos de la modalidad para aumentar el peso y equilibrar la contribución, pero la función de pérdida es la misma.

entrenamiento de datos mezcla incluyen:
- Gen de imagen:`<text caption> <image> image_tokens </image>`
- Percepción de imagen:`<image> image_tokens </image> <question> text_tokens`
- Género de video:`<text caption> <video> video_tokens </video>`
- Percepción de vídeo: similar.
- Sólo texto: NTP estándar

模型会从数据分布中学习何时输出图像代币何时输出文本代币――generar capacidad de la modelo en `<image>`标签后预测 Tokens de imagen

### Orientación sin clasificador y temperatura

Autoregressiva 图像生成在推理时使用分类器免费指南(CFG) 会好很多──Emu3 使用它:生成两次,一次使用完整标题,一次使用空标题,然后使用指导权重 混合 logits(典型值 3.0-7.0)──这是 Diffusion 使用的同一个CFG 技巧,借用到了autoregressive 设置中──

Temperatura  muy importante: demasiado alto para producir falsas sombras; demasiado bajo para colapsar.

### Tres papeles, un modelo

Emu3 tiene tres funciones diferentes en las que se distribuyen API, pero la base es un conjunto de pesas:

- Emu3-Gen──图像生成──输入文本,输出图像代币──
- Emu3-Chat──VQA 和 subtítulos──输入图像(tokens),输出文本──
- Emu3-Etapia2──videoproducción y video VQA──输入文本或视频,输出文本或视频──

No hay cabezas específicas de tareas  sólo diferentes plantillas de preguntas  el mismo punto de control

### Indicadores de referencia

Fueron de Emu3 paper(2024 年 9 月):

- 图像生成: 在 MJHQ-30K FID(5.4 vs 5.6)、GenEval en general(0.54 vs 0.55,统计上打平) y Compuesto de Deep-Eval arriba alcanza un nivel equivalente o mejor, supera SDXL。
- 图像感知: en VQAv2(75.1 vs 72.4) superior a LLaVA-1.6, en MMMU superior a la gran concentración.
- 视频生成:4-second-clip 质量在 FVD 上与 Sora-era Modelos con referencia pública 具有竞争力──

Estos números no siempre son ganadores, Emú3 会在这里多一分,那里少一分, pero la predicción de los siguientes tokens es todo lo que necesitas.

### Costo de cálculo

Emu3 utiliza un modelo de parámetro 7B, en unos 300 mil millones de tokens multimodal 上练──GPU-hora 大致相当于Llama-2-7B pre-training(A100-class silicon 上 2k-4k GPU-years)──Stable Diffusion 3 这样 Diffusion models 训练预算类似,但需要独立的文本编码和更复杂的管道──

推理时,Emu3 Cada张图像比SDXL 慢:4096 tokens de imagen, con 30 tok/s 计算, aproximadamente cada张 512x512 图像 2 分钟, mientras que SDXL es de 2-5 秒── 推理时,Emu3 Cada张图像比SDXL 慢:4096 image tokens, con 30 tok/s 计算, aproximadamente cada张 512x512 图像 2 分钟, mientras que SDXL es de 2-5 秒── 推算解码 和 KV-cache 优化 会缩小差距,但无法消除差距── Autoregressive image gen 计算量很大; es la cantidad de imágenes 计算很大; es la tasa de cálculo fija de la actualidad──

### Por qué importa

La contribución de Emu3 es conceptual. Si la predicción de los siguientes tokens puede extenderse a la generación de imágenes y a la correspondencia de la difusión, entonces el modelo unificado es posible. El modelo futuro no necesita codificadores de texto independientes.

Show-o、Janus-Pro 和 InternVL-U fueron construidos sobre este argumento, o para proponerle un reto.


```figure
l5-emu3-next-token
```

## Usalo
`code/main.py`Construir dos piezas de juguete:

- Un Tokenizer VQ 2D vs 3D 数量计算器:给定: 解析度,补丁,Clip_length,FPS), calcular imágenes y vídeos de Token 数量.
- Una guía libre de clasificador y muestra de imagen autoregressiva de temperatura.

CFG 实现 con Emu3 配方一致, es decir, con peso de orientación 混合 condicional 和 incondicional logits──

##  entregarlo
本课产 出  `outputs/skill-token-gen-cost-analyzer.md` Determinar una especificación de producto de producción (图像或视频、目标分辨率、质量层、延迟预算), calculará el número de tokens、concernir el costo, y hará una selección entre la familia Emu3 y la difusión 

##  ejercicios
1. Emu3 en 8x8 reducción abajo, por张 512x512 图像产生 4096 tokens──计算 1024x1024和 2048x2048 的等价数──推理延迟会发生什么?

2. 阅读Emu3 Sección 3.3 En el contenido de video tokenizer.

3. Peso de orientación libre de clasificadores 5.0 vs 3.0: ¿Qué cambios hay en el efecto visual?`code/main.py`Proceso matemático medio:

4.  calcular Emu3-7B en 300B tokens 下的训练 FLOPs,并与稳定扩散3比较──¿cuál es el costo de entrenamiento más alto?

5. Emu3 en FID arriba supera SDXL, pero en VQAv2 arriba no como en VLMs especializados.

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Next-token prediction | "NTP" | 标准 autoregressive loss：给定 token[0..i] 预测 token[i+1]；tokenized 后适用于每种 modality |
| IBQ tokenizer | "Inverse bottleneck quantizer" | 一类 VQ-VAE，codebooks 更大（32768+），重建效果优于 Chameleon 的 Tokenizer |
| 3D VQ | "Spatiotemporal quantizer" | 由（time、row、col）索引的 codebook；一个 Token 覆盖一个 4x4x4 pixel cube |
| Classifier-free guidance | "CFG" | 用 weight gamma 混合 conditional 和 unconditional logits；在推理时提升图像质量 |
| Unified vocabulary | "Shared tokens" | Text + image + video 都来自同一个 integer space；模型预测接下来出现的任何 modality |
| MJHQ-30K | "Image gen benchmark" | 含 30k prompts 的 Midjourney-quality benchmark；Emu3 在这里报告 FID |

## 延伸阅读
- [Wang et al. — Emu3: Next-Token Prediction is All You Need (arXiv:2409.18869)](https://arxiv.org/abs/2409.18869)
- [Sun et al. — Emu: Generative Pretraining in Multimodality (arXiv:2307.05222)](https://arxiv.org/abs/2307.05222)
- [Liu et al. — LWM (arXiv:2402.08268)](https://arxiv.org/abs/2402.08268)
- [Yu et al. — MAGVIT-v2 (arXiv:2310.05737)](https://arxiv.org/abs/2310.05737)
- [Tian et al. — VAR (arXiv:2404.02905)](https://arxiv.org/abs/2404.02905)
