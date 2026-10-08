# Transformadores de visión y parches original

> En cualquier proceso multimodal, las imágenes deben convertirse en un transformador que pueda procesar una secuencia de tokens. En 2020 ViT 论文 utilizó un parche de 16x16 像素补丁, lineal projection and position Embedding.

**Type:** Learn
**Languages:** Python (stdlib, patch tokenizer + geometry calculator)
**Prerequisites:** Phase 7 (Transformers), Phase 4 (Computer Vision)
**Time:** ~120 分钟

## El objetivo del aprendizaje
- HxWx3 图像转换为带有正确位置编码的补丁代码的代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码
- Para una determinada VT ((tamaño de parche, resolución, oscuridad oculta, profundidad) calcular la longitud de la secuencia, el número de parámetros y los FLOPs¬
- Explicar que ViT se desarrollará desde el año 2020 hasta el año 2026 en tres niveles de producción: pre-entrenamiento auto supervisado (DINO/MAE) ✓ tokens de registro, así como embalaje de resolución nativa
- Por lo tanto, el objetivo es que el sistema de registro de datos sea un conjunto de datos.

##  problemas
Transformer  procesado es Vector 序列。文本本本就是序列(bytes或 tokens)。图像是带有三个颜色通道的2D 像素网格,不是序列。 si se展平每一个像素,一张 224x224 RGB 图像将变成150,528 符号,而这个长度上的自我注意是完全不可行的(en relación con la longitud de la secuencia es una segunda complejidad)。

El método anterior a 2020 se aplicaría en el extremo anterior a un extractor de características de CNN: ResNet  generar un mapa de características de 7x7 compuestos por vectores de 2048 dimensiones, volver a colocar estos 49 Token 输入 Transformer── esto puede funcionar, pero heredará la posicionamiento de CNN [[equivalencia de traducción]], campos receptivos locales]], y debilitará la capacidad de adaptación del Transformer a la expansión de la escala──

Dosovitskiy et al. (2020) planteó un problema directo: si saltas CNN 会怎么?把图像切分成固定大小的补丁(比如16x16像素),将每一个补丁线性投影成一个矢量,加入位置嵌入,然后把序列输入到一个香变器──当时这属于异端做法 不用卷积做视觉──只要数据足够多(JFT-300M,之后是LAION),就在ImageNet上超越ResNet,并持续改进──

Para 2026, ViT original idioma ya es una base indiscutible. Cada torre de visión de VLM de peso abierto son de una especie de posterior generación. La cuestión ya no es si debemos usar parche.

## 概念
### Los parches como tokens

给定一个形状为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `(H, W, 3)`De imágenes `x`和 tamaño del parche `P`, te cortarías la imagen en una .`(H/P) x (W/P)`网格── cada parche es un parche`P x P x 3`de cuadros de cuadros.`3 P^2`Vector: Aplicación de una forma para`(3 P^2, D)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `W_E`, poner cada parche  mapeado a la dimensión oculta del modelo `D`¿Qué es eso?

 Para ViT-B/16 esta configuración clásica:
- Resolución 224, tamaño de parche 16 → cuadrícula 14x14 → 196 个 parche tokens。
- Cada parche es`16 x 16 x 3 = 768`个像素值, proyección hasta `D = 768`¿Qué es eso?
- 加入一个可学习的                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `[CLS]`token → longitud de secuencia 197。

proyección de parches en matemáticas es igual al tamaño del núcleo por`P`¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡`P`、Exportación y transporte`D`La conversión 2D.                                                                                                                                                                                                                                                            `nn.Conv2d(3, D, kernel_size=P, stride=P)`

### Embedings de posición

El parche 没有内在顺序  Transformer 看到的是一个集合──早期 ViT 加入可学习的 1D 位置 嵌入式((cada posición un vector de 768 dimensiones, en total 197 个) ── esto puede funcionar, pero se ataría el modelo a la resolución de entrenamiento: si se propone cambiar la cuadrícula, se debe insertar el valor de la posición──

La columna vertebral moderna de visión utiliza 2D-RoPE(Qwen2-VL de M-RoPE、SigLIP 2 de acuerdo con el modelo de la posición de la columna, así que el modelo puede deducir en un ángulo de rotación en relación con la posición de la posición de la columna.

### Token CLS ‧ salida combinada y tokens de registro

¿Qué es el tipo de imagen?

1. `[CLS]`token──把一个可学习向量 前置到补丁序列──经过所有变压器块 后,CLS token's hidden state 就是图像表示──继承自BERT──原始 ViT、CLIP 使用这种方式──
2. Polaridad media── para los tokens de parches de salida estados ocultos 取平均──SigLIP、DINOv2 和大多数现代VLM使用这种方式──
3. Registro de tokens。Darcet et al. (2023)  observado, no hay un token de sumidero evidente  entrenamiento de ViT 会产生高范数的artifact patches,并劫持自我注意──加入 416 个可学习的登录的代币 可以吸收这个部分负载,并提升密集预测质量(segmentación、深度)──DINOv2 和 SigLIP 2 都随模型提供登录──

Esta opción afectará a la siguiente tarea. CLS                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  

### Pre-entrenamiento: 监督式、对比式、masked、自蒸

El año 2020 de ViT utiliza JFT-300M 上 上 上 de la clasificación supervisada  realizar preentrenamiento。

- CLIP (2021): hacer imágenes-texto contrastantes en 400M para el dato de la ilustración.
- MAE (2021, He et al.): máscara de 75% de parches, reconstrucción de imágenes, auto-supervisión, adecuada para imágenes puras,
- DINO (2021) / DINOv2 (2023): uso de estudiantes-maestros hacer autodistilación, sin etiquetas, sin capciones.
- SigLIP / SigLIP 2 (2023, 2025):带 sigmoid loss 和 NaFlex 原生宽高比支持的 CLIP──2026年开放VLMs(Qwen、Idefics2、LLaVA-OneVision) 中的主流视觉塔──

Usted seleccionó el preentrenamiento decide la columna vertebral 擅长什么:CLIP/SigLIP 擅长与文本做语义匹配,DINOv2 擅长密集的视觉特征,MAE 适合作为下游细节调的起点──

### Leyes de escala

La escalación de ViT (Zhai et al. 2022) indica que la calidad de ViT en el tamaño del modelo, el tamaño de los datos y el cálculo sigue las reglas de predicción.
- Más grandes modelos + más datos → mejor calidad.
- El tamaño del parche es la longitud de la secuencia y la fidelidad  entre la regla 杆──Parche 14(DINOv2/SigLIP SO400m de configuración típica) En comparación con parche 16 会为每张图像产生更多代币; más adecuado para OCR y tareas densas, pero la velocidad más lenta──
- La resolución es otro gran puente. De 224 a 384 y de nuevo a 512 casi siempre es útil, pero los FLOP se producen en segundo lugar.

ViT-g/14(1B params、patch 14、resolución 224 → 256 tokens) y SigLIP SO400m/14(400M params、patch 14) son dos codificadores principales de VLM abiertos de 2026 años。

### El número de parámetros para un ViT

完整计算位于 `code/main.py`❖ Para el 224 abajo ViT-B/16:

```
patch_embed = 3 * 16 * 16 * 768 + 768  =  591k
cls + pos    = 768 + 197 * 768          =  152k
block        = 4 * 768^2 (QKVO) + 2 * 4 * 768^2 (MLP) + 2 * 2*768 (LN)
             = 12 * 768^2 + 3k          =  7.1M
12 blocks    = 85M
final LN    = 1.5k
total       ≈ 86M
```

Antes de cargar el puesto de control, primero se utiliza este método para calcular el tamaño de cada VT.

### Configuración de producción 2026

La mayoría de los VLM abiertos de 2026 años 随模型 proporcionado el codificador es original Resolución (NaFlex) bajo SigLIP 2 SO400m/14── tiene:
- Parámetros de 400M.
- Tamaño de parche 14, resolución 384 → Cada张图像 729 个 parche tokens。
- 图像级任务使用平均池;VQA en todos los 729 补丁都流入 LLM。
- 4 tokens de registro, en entrega del LLM
- Utiliza 2D-RoPE,并带有面向本地面积比例的图像水平扩展──

Cada decisión en esta configuración se puede remontar a un artículo que puedes leer.


```figure
image-patch-tokens
```

## Usalo
`code/main.py`Es un tokenizer de parches y calculador de geometría.

- Parchear la forma de la cuadrícula y la longitud de la secuencia.
- Una imagen de juguete de 8x8 像素 像素 图像的代币序列(逐步走过平坦 + proyecto 路径) ⋅
- 按补丁嵌入,位置嵌入,变压器块 和头 拆分的参数数数──
- objet Resolución 下单次前进传的FLOPs──
- ViT-B/16 @ 224、ViT-L/14 @ 336、DINOv2 ViT-g/14 @ 224、SigLIP SO400m/14 @ 384 的对比表──

运行它──把参数数和已发布数字对齐──调整补丁尺寸和分辨率,感受代币数量成本──

##  entregarlo
本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-patch-geometry-reader.md` Dado una configuración ViT ((tamaño de parche, resolución, oscuridad oculta, profundidad), se generará con razones de explicación de recuento de tokens, parámetros y estimación de VRAM.

##  ejercicios
1. 计算 Qwen2.5 VL 在原生 1280x720 输入、补丁尺寸 14 下的补丁-代码序列长度──它和只使用CLS的表示相比如何?

2. ¿Cuántos tokens tienen un total de tokens visuales? ¿cuál es el costo de reducción más efectivo: pooling, muestreo de fotogramas, o fusión de tokens?

3. Utiliza pure Python  implementar tokens de parches                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  `forward`返回的结果一致──

4. 阅读"Vision Transformers Need Registers" (ArXiv:2309.16588) 阅读"Vision Transformers Need Registers" (ArXiv:2309.16588) 阅读"ArXiv:2309.16588) 阅读"ArXiv:2309.16588) 阅读"ArXiv:2309.16588) 阅读"ArXiv:2309.16588) 阅读"ArXiv:2309.16588) 阅读"ArXiv:2309.16588) 阅读"ArXiv:2309.16588" 阅读"ArXiv:2309.16588" 阅读"ArXiv:2309.16588" 阅读"ArXiv:2309.16568" 阅读"ArXiv:2309.16568" 阅读"ArXiv:2309.16568" 阅读"ArXiv:2309.16550" 阅读"ArXiv:0505 阅读"

5. 修改                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`以支持 patch-n'-pack:给定一组不同分辨率的图像, generar una secuencia empaquetada 和 bloque-diagonal de la máscara de atención──到达教学12.06 时再进行验──

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Patch | “16x16 像素方块” | 输入图像中固定大小、非重叠的区域；会变成一个 Token |
| Patch embedding | “Linear projection” | 一个共享的学习 Matrix（或 stride=P 的 Conv2d），将展平后的 patch 像素映射到 D-dim Vector |
| CLS token | “Class token” | 前置的可学习 Vector，其最终 hidden state 表示整张图像；在 2026 年是可选项 |
| Register token | “Sink token” | 额外的可学习 Token，用于吸收 ViT 在 pretraining 期间产生的高范数 Attention artifacts |
| Position embedding | “Positional info” | 每个位置的 Vector 或旋转，使序列具备顺序感知；2D-RoPE 是现代默认方案 |
| Grid | “Patch grid” | 对于给定 resolution 和 patch size，patch 形成的 (H/P) x (W/P) 2D 数组 |
| NaFlex | “Native flexible resolution” | SigLIP 2 特性：单个模型无需重新训练即可服务多种 aspect ratios 和 resolutions |
| Backbone | “Vision tower” | 预训练 image encoder，其 patch-token 输出会在 VLM 中输入 LLM |
| Pooling | “Image-level summary” | 将 patch tokens 转换为一个 Vector 的策略：CLS、mean、attention pool 或 register-based |
| Patch 14 vs 16 | “Finer vs coarser grid” | Patch 14 每张图像产生更多 Token，对 OCR 有更好 fidelity，但更慢；patch 16 是经典默认值 |

## 延伸阅读
- [Dosovitskiy et al. — An Image is Worth 16x16 Words (arXiv:2010.11929)](https://arxiv.org/abs/2010.11929) 原始 ViT。
- [He et al. — Masked Autoencoders Are Scalable Vision Learners (arXiv:2111.06377)](https://arxiv.org/abs/2111.06377) MAE, auto-supervisión de la preparación.
- [Oquab et al. — DINOv2 (arXiv:2304.07193)](https://arxiv.org/abs/2304.07193) Auto-distillación a gran escala, sin etiquetas。
- [Darcet et al. — Vision Transformers Need Registers (arXiv:2309.16588)](https://arxiv.org/abs/2309.16588) registros de tokens 和 artefacto 分析。
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786) 2026 años默认 visión torre♪
- [Zhai et al. — Scaling Vision Transformers (arXiv:2106.04560)](https://arxiv.org/abs/2106.04560) 经验性 escalar leyes。
