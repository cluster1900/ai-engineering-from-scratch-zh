# Modelado autoregreso visual (VAR):Predección a escala siguiente

> La difusión  modelo en el tiempo 代采样 (代采样) ︎ VAR 代采样 (代采样) ︎ en la escala, es decir, primero predecir un token 1x1, luego 2x2, luego 4x4, hasta la resolución final, cada medida está condicionada a la medida anterior.

**Type:** Build
**Languages:** Python (with PyTorch)
**Prerequisites:** Phase 7 Lesson 03 (Multi-Head Attention), Phase 8 Lesson 06 (DDPM)
**Time:** ~90 minutes

##  problemas

Autoregressive 生成之所以主导语言建模,是因为它能预测地扩展:更多计算、更多参数、更低困难、更好的输出──2024 años antes, la generación de imágenes tenía dos tipos de AR 尝试:PixelRNN/PixelCNN(逐像素) y DALL-E 1 / Parti / MuseGAN(en los códigos VQ-VAE 上逐 Token) ⋅

两者都困难在生成顺序问题──像素和代币 排列在2D 网格中, pero los modelos AR deben usar el orden raster 1D 访问它们── los primeros cantos de la imagen no saben qué se convertirá en la imagen final── la expansión de la calidad de la producción es diferente a la de la GPT en el texto, y nunca ha alcanzado la calidad del modelo en el cálculo de la correspondencia──

VAR 通过改变生成对象来解决生成顺序问题──VAR no se encuentra en el espacio en cada uno de los pronósticos de imágenes Token, sino en un continuo aumento de la resolución de pronósticos de imágenes整张──步骤 1: pronósticos de un 1x1 Token(整体图像摘要)──步骤 2: pronósticos de un 2x2 Token 网格(更粗的特征)──步骤 3: pronósticos de un 4x4 网格──步骤 K: pronósticos finales (H/8) x(W/8) 网格──

Cada medida se dirige a todas las medidas anteriores (en la secuencia de la medida se produce la causa), y se corre a la misma medida.

## 概念

### El tokenizador de múltiples escalas VQ-VAE

VAR  necesita uno **multi-scale discrete Tokenizer** Para la imagen x, generará una serie de Token 网格 que mejoran gradualmente la resolución:

```
x -> encoder -> latent f
f -> tokenize at 1x1: token grid z_1 of shape (1, 1)
f -> tokenize at 2x2: token grid z_2 of shape (2, 2)
...
f -> tokenize at (H/p)x(W/p): token grid z_K of shape (H/p, W/p)
```

Cada z_k utiliza el mismo código de código (tipo: 4096-16384)  Tokenization en cada escala no es independiente entre sí, sino que se ha entrenado para hacer que las necesidades y los residuos de cada escala puedan reconstruirse:

```
f ≈ upsample(embed(z_1), target_size) + ... + upsample(embed(z_K), target_size)
```

Esto es un**residual VQ**变体──尺度 k 捕获尺度 1..k-1 遗漏的内容──decoder 接收所有尺度 嵌入的和并生成图像──

VQ Tokenizer de múltiples escalas sólo entrenar una vez, así como VQGAN, luego todo el trabajo generado es realizado por su Autoregressive 模型完成──

### Una predicción de la siguiente escala

El modelo de producción es un transformador, que ve todos los Tokens de la medida anterior, y predice la siguiente medida de la medida.

Estructura de la secuencia de entrada:
```
[START, z_1 tokens, z_2 tokens, z_3 tokens, ..., z_K tokens]
```

Posición de inserción 同时编码尺度索引和尺度内的空间位置──Attención en la secuencia de la medida es causal de: medida k、 posición (i, j) de los Tokens se puede Atención a la medida 1..k de todos los Tokens, también se puede Atención a la medida k de los Tokens que se utilizan en la secuencia de la escala  序中更早出现的VARs usando la atención posicional fija, sin causalidad intraescala, es decir, una escala en todas las posiciones y hacer un pronóstico)──

训练 Loss: en cada medida k, dado determinado todo pre-medida de Token,预测 Token z_k。对离散 VQ codes 使用交叉 Entropy Loss──结构与GPT相似,只是在这里序列变成了尺度结构化的序列──

### El desarrollo

推理时:
```
generate z_1 = sample from p(z_1)                    # 1 token
generate z_2 = sample from p(z_2 | z_1)              # 4 tokens in parallel
generate z_3 = sample from p(z_3 | z_1, z_2)         # 16 tokens in parallel
...
decode: f = sum of embed-and-upsample scales 1..K
image = VAE_decoder(f)
```

Cuando K = 10 个尺寸时, generar necesita 10 veces Transformer forward pass. Cada paso produce toda la medida, en lugar de regresar en la medida por token. Para 256x256 imágenes, esto es aproximadamente 10 veces, mientras que DiT es 28-50 veces.

### ¿Por qué la siguiente escala  gana más que la siguiente token

Tres ventajas estructurales:
1. **从粗到细符合自然图像统计规律。**La percepción visual y el conjunto de datos de imágenes de personas presentan reglas relacionadas con la medida: estructura de baja frecuencia estable y predecible; detalles de alta frecuencia condicionados a contenido de baja frecuencia.
2. **尺度内并行生成。**Diferente de GPT 风格的 Token AR, VAR un paso genera una cierta medida de los Token──有效生成长度是对数尺度,而不是线性尺度──
3. **没有生成顺序偏置。**El Token de la dimensión k puede ver toda la dimensión k-1; no existe una desviación del lado izquierdo o del lado superior, no obliga a los Token tempranos a hacer compromisos antes de que estén disponibles en la última fase.

### Ley de escala

Tian et al.  demostraron que VAR en ImageNet FID sigue la curva de escala de la ley de poder, al igual que la perplejidad de GPT, una misma manera.

### Relación con la difusión

VAR y Diffusion compartiendo una misma historia de compresión de datos: ambos han dividido el problema de generación en una serie de problemas más fáciles.

- Difusión: gradualmente se incorpora el ruido, se aprende a retirar el paso.
- VAR: Gradualmente aumenta la resolución, aprender a predecir la siguiente medida.

它们 se transforman en diferentes líneas de los mismos problemas. Ambas producen una distribución de condiciones que se pueden tratar.


```figure
gx-var-next-scale
```

## Construirlo

En el`code/main.py`En medio, tú estarás:
1. En sintesis image数据(2D anillos de Gaussian) construye un pequeño **multi-scale VQ Tokenizer**¿Qué es eso?
2. Entrenamiento uno**VAR-style Transformer**Para el siguiente token de predicción a escala.
3. 通过调用 Transformer 4 次(4 个尺度)并解码来采样──
4. 验证按尺度顺序训练会让生成在尺度内并行──

Este es un juego de implementación. El objetivo es ver la estructuración de la medida.

##  entregarlo

本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-var-tokenizer-designer.md`, es una habilidad para diseñar Tokenizer a múltiples escalas: cantidad de dimensiones, proporción de dimensiones, tamaño de código, compartimiento residual, arquitectura de decodificadores.

##  ejercicios

1. **尺度数量消融。**Usar 4、6、8、10 个尺度训练 VAR──衡重建质量与Autoregressive pass 数量关系──更多尺度 = 更细残量 = 更好质量,但通过更多──

2. **Codebook size。**训练代码书尺寸 为 512、4096、16384的Tokenizer──更大的代码书带来更好的重建,但预测更难──找到拐点──

3. **尺度内并行检查。**En la medida k dentro, el modelo ¿Será la atención a la escala transversal  posición pero no la atención a la escala intra?

4. **VAR vs DiT scaling。**Para la misma tarea condicional de clase de ImageNet, en el presupuesto de los parámetros de emparejamiento entrenar VAR y DiT (por ejemplo, 33M,130M、458M)  dibujar FID vs computación──VAR  debería liderar DiT en cada tamaño, en pequeña escala 

5. **Text conditioning。** ampliar VAR, hacer que pase por adaLN  recepción de texto Embedding(CLIP combinado) como entrada de condicionamiento extra―.

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| VAR | "Visual AutoRegressive" | 通过在 VQ Token 网格金字塔上进行 next-scale prediction 来生成图像 |
| Next-scale prediction | "Predict coarser, then finer" | 模型以不断增加的分辨率尺度预测 Token，并以所有之前尺度为条件 |
| Multi-scale VQ tokenizer | "Residual VQ" | 生成 K 个分辨率递增 Token 网格的 VQ-VAE，decoder 会对所有尺度求和 |
| Scale k | "Pyramid level k" | K 个分辨率层级之一，从 k=1 的 1x1 到 k=K 的 (H/p)x(W/p) |
| Parallel-within-scale | "One forward per scale" | 尺度 k 的所有 Token 在一次 Transformer pass 中预测，而不是自回归预测 |
| Causal-across-scales | "Scale-ordered attention" | 尺度 k 的 Token 可以 Attention 到尺度 1..k 的全部内容，但不能 Attention 到尺度 k+1..K |
| Residual VQ | "Additive tokenization" | 每个尺度的 Token 编码较低尺度留下的 residual；decoder 对所有尺度 Embedding 求和 |
| VAR scaling law | "Image GPT scaling" | FID 随 compute 遵循可预测的 power law，类似语言模型的 perplexity |
| HART | "Hybrid VAR + text" | Text-conditional VAR 变体，将 MaskGIT-style iterative decoding 与 VAR 的尺度结构结合 |
| Scale position embedding | "(scale, row, col) triple" | Positional encoding 同时携带尺度索引和尺度内空间坐标 |

## 延伸阅读
- [Tian et al., 2024 — "Visual Autoregressive Modeling: Scalable Image Generation via Next-Scale Prediction"](https://arxiv.org/abs/2404.02905) VAR 论文, estándar referencia
- [Peebles and Xie, 2022 — "Scalable Diffusion Models with Transformers"](https://arxiv.org/abs/2212.09748) DiT, Difusión en relación con el nivel de referencia
- [Esser et al., 2021 — "Taming Transformers for High-Resolution Image Synthesis"](https://arxiv.org/abs/2012.09841) VQGAN,VAR de Tokenizer a gran escala
- [van den Oord et al., 2017 — "Neural Discrete Representation Learning"](https://arxiv.org/abs/1711.00937) VQ-VAE, base de la tokenización de imágenes
- [Tang et al., 2024 — "HART: Efficient Visual Generation with Hybrid Autoregressive Transformer"](https://arxiv.org/abs/2410.10812) VAR con texto condicional
