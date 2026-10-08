# Transfusión: en un transformador 中结合 Autoregressive Text + Diffusion Image

> Chameleon y Emu3 Colocar todo el dinero en el token de separación 上──它们能工作,但量化瓶很明显:图像质量会在低于连续空间扩散 模型的位置进入平台期.Transfusion(Meta,Zhou et al.,2024年8月) 押了相反的方向:保持图像连续,完全消除VQ-VAE,并用两个损失 训练一个变体.

**Type:** Build
**Languages:** Python（stdlib，MNIST-scale 玩具双 loss trainer）
**Prerequisites:** Phase 12 · 11（Chameleon），Phase 8（Generative AI）
**Time:** ~180 minutes

## El objetivo del aprendizaje
- 连接一个在同一脊柱上运行两个损失的变压器(文本 Token 上的 NTP,图像补丁 上的扩散 MSE) ⋅
- 解释为什么图像补丁 之间使用双向注意,同时文本代币 使用因果注意,是正确的面具 选择──
- En el cálculo, la calidad y la complejidad del código, en comparación con las imágenes de transfusión (confusión continua, pérdida de difusión) y las imágenes de camaleón (NTP).
- Cuentan con contribuciones de MMDiT: cada bloque utiliza pesos específicos de modalidad, en el flujo residual arriba se realiza la atención conjunta.

##  problemas
Los símbolos de la imagen se encuentran en el mapa de los símbolos de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen

Cameleon / Emu3 选择离散路线: una pérdida, una estructura, pero la imagen se mantiene segura bajo el Tokenizer 质量限制──

El modelo de difusión eligió una ruta continua: la calidad de la imagen es fuerte, pero es un modelo separado del LLM, el diseño de ajuste de ruido es complejo, y no tiene un método de integración limpia de la generación de texto.

La transfusión  planteó la pregunta es: ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿

## 概念
### 双 pérdida 架构

Un transformador solo para decodificador 处理 contiene la siguiente secuencia de contenido:

- 文本 Token ((离散, proviene del vocabulario BPE)
- 图像补丁(连续, 16x16 bloques de píxeles, a través de la incorporación lineal 投影到隐藏 dim, con la misma entrada de ViT codificador)
- `<image>`Y `</image>`标签, para marcar el parche en su lugar.

Pases de adelanto sólo se ejecutan una vez.

- Sobre el texto Token: в воcab-logits head 上使用标准交叉
- Para el parche de imagen: en el parche de continuidad, la pérdida de difusión se incrementa en el ruido de cada parche.

Gradiente de los cuerpos transformadores de la distribución de los flujos. Dos pérdidas.

### Máscara de atención:texto causal + imagen bidireccional

文本 Token 必須是因果的; no puede hacer que el texto Token asista hasta el texto futuro, de lo contrario el profesor forzando 会被破坏── pero el parche de imágenes muestra el mismo rápido照; deben estar en el mismo bloque de imágenes dentro de cada uno de los otros bidireccionales asistir──

máscara:

```
M[i, j] = 1 if:
  (i is text and j is text and j <= i)   # causal for text
  OR (i is image and j is image and same_image_block(i, j))   # bidirectional within image
  OR (i is text and j is image and j < i_image_end)   # text attends to previous images
  OR (i is image and j is text and j < i_image_start)   # image attends to preceding text
```

En el entrenamiento y la meditación se realiza para la máscara triangular de bloque.

### Perdida de difusión del transformador interno

Perdida de difusión es la forma estándar: darle parche de imagen加噪声,让模型预测噪声(或等价地预测 clean patch) ――Versión de la transfusión Uso de parche de flujo:预测 de ruido a campo de velocidad de limpieza。

Durante el entrenamiento:
1. Para cada parche de imagen x0, así como un paso de tiempo de forma automática t.
2. 采样噪声 ε,计算 xt = (1-t) * x0 + t * ε(flujo de coincidencia de la línea de inserción)
3. Transformer 预测 v_theta(xt, t); pérdida = MSE(v_theta(xt, t), ε - x0)。
4. Una pérdida de NTP en el mismo secuencia de texto.

推理时, generar el proceso es:
- 文本 Token: estándar muestreo autoregreso。
- 图像补丁:以此前文本 Token 为条件的扩散样本循环(usualmente 10-30 pasos) ⋅

### MMDiT: Diferencia estable 3 的变体

Estable Diffusion 3 (Esser et al., 2024) en el tiempo que se acerca a la Transfusión publicó MMDiT (Multimodal Diffusion Transformer)

Diferencias clave de MMDiT:

- Cada bloque utiliza pesos específicos de modalidad. Cada bloque de transformador para el texto Token y parche de imagen, separado por Q、K、V y MLP 权重.
- Entrenamiento de flujo rectificado, un tipo específico de flujo de combinación de variaciones, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, matemáticas, etc.
- △MMDiT es la columna vertebral de SD3 △2B 和 8B 参数变体) ・Transfusión 论文扩展到7B。

两者汇聚到同一个核心思想: un transformador para el texto de la operación NTP, para el seguimiento de imágenes de la operación de difusión.

### ¿Por qué ganó al estilo del camaleón?

 Continuous diffusion y NTP separados en la generación de imágenes es de gran tamaño.

- En la escala de 7B, el FID es de tamaño similar al estilo camaleón.
- No necesita entrenar Tokenizer: codificador de imágenes más simple (Linear projection to hidden, en la misma forma que la capa de entrada de ViT)
- 图像补丁 去噪音可以并行化推理,不像自动降低图像代币──

缺点:Transfusión es doble pérdida 模型, entrenamiento动态更难――peso de pérdida 需要调参――NTP y difusión 时间表不一致可能导致某头占主导――

### Sector de la ciudad

Janus-Pro (lección 12.15) a través de la solución para entender y generar un codificador de visión para mejorar la idea de la Transfusión: uno usando SigLIP, otro usando VQ, compartiendo el cuerpo del transformador.

En 2026 los VLM de producción de imágenes, como Gemini 3 Pro, GPT-5, Claude Opus 4.7 y el camino de producción de imágenes, casi definitivamente utilizaron una especie de posterior generación de esta familia.


```figure
cfg-guidance-scale
```

## Usalo
`code/main.py`En un pequeño problema similar a MNIST, construye un juego Transfusión:

- 文本 caption es la descripción de números (0-9) de la serie de números cortos.
- La imagen es 4x4 字节网格──
- Una para compartir el derecho de peso de proyecciones lineales 充当变压器 替代;文本上使用NTP loss,噪音补丁上使用MSE loss。
- Entrenamiento ciclo de cambio usando dos pérdidas, la máscara de atención es evidente.
- 生成在一次前进传中产生文本标题 和 4x4 图像──

Este transformador es un tipo de juguete.

##  entregarlo
本课产 出  `outputs/skill-two-loss-trainer-designer.md`△ se fija una nueva tarea de entrenamiento multimodal (文本 + 图像、文本 + 音频、文本 + 视频), se diseña un doble calendario de pérdida (减重量,面具形,共享对模式特定块), y se marca la realización de los riesgos (风险, 减重量, 减重量, 减重量, 减重量, 减重量, 减重量, 减重量, 减重量, 减重量, 减重量, 减重量, 减重量, 减重量, 减重量, 减重量, 减重量, 减重量, 减重量, 减重量, 减重量, 减重量, 减重量, 减重量, 减重量, 减重量, etc.).

##  ejercicios
1. Un entrenamiento de tipo transfusión  modelo cuando contiene 70% 文本 Token 和 30% 图像补丁── 图像扩散损失的数量级为文本NTP损失的10x── ¿Qué tipo de pérdidas pueden ser equilibradas?

2. Para este proceso lograr la máscara triangular de bloque:`[T, T, <image>, P, P, P, P, </image>, T]` Cada uno de los objetivos será 0 o 1.

3. MMDiT tiene un QKV 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权重 权) 权重 权重 权重 权重 权重 权重 权重 权重 权 权重 权 权重 权重 权 权重 权重 权 权 权重 权 权 权 权 权 权 权 权 权 权 权 权 权 权 权 权 权 权 权 权 权 权 权 权 权 权 权 权 权 权 权 权 权

4. 生成: Give a definite a text prompt, modelo primero ejecutar NTP 生成 50 tokens, luego encontrar `<image>`, luego en 256 parches, arriba y abajo, 20 pasos para denotar la difusión. ¿Cuántas veces necesitas pasar?

5. 阅读SD3论文 sección 3── describir el flujo rectificado, y por qué utiliza menos pasos de cálculo que el DDPM en términos de recepción.

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Two-loss training | "NTP + diffusion" | 一个 transformer 在同一个 gradient step 中，同时优化文本 Token 上的 cross-entropy 和连续图像 patch 上的 MSE |
| Flow matching | "Rectified flow" | 一种 diffusion 变体，预测从噪声到 clean data 的 velocity field；数学上比 DDPM 更简单 |
| MMDiT | "Multimodal DiT" | Stable Diffusion 3 的架构：joint attention、modality-specific MLPs 和 norms |
| Block-triangular mask | "Causal text + bidirectional image" | 一种 attention mask：跨文本是 causal 的，但在图像区域内是 bidirectional 的 |
| Continuous image representation | "No VQ" | 图像 patch 作为实值 Vector，而不是整数 codebook indices |
| Velocity prediction | "v-parameterization" | 网络输出是噪声与数据之间的 velocity field，而不是噪声本身 |

## 延伸阅读
- [Zhou et al. — Transfusion (arXiv:2408.11039)](https://arxiv.org/abs/2408.11039)
- [Esser et al. — Stable Diffusion 3 / MMDiT (arXiv:2403.03206)](https://arxiv.org/abs/2403.03206)
- [Peebles & Xie — DiT (arXiv:2212.09748)](https://arxiv.org/abs/2212.09748)
- [Zhao et al. — MonoFormer (arXiv:2409.16280)](https://arxiv.org/abs/2409.16280)
- [Xie et al. — Show-o (arXiv:2408.12528)](https://arxiv.org/abs/2408.12528)
