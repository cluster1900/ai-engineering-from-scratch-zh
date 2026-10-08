# Flamingo y la atención cruzada de los VLM de pocos disparos

> Flamingo de la Mente Profunda (DeepMind) (en inglés) ha completado dos cosas antes que otros. Prueba que un modelo individual puede procesar imágenes, videos y textos en cualquier secuencia de intercambio arbitrario. Prueba que los VLM pueden realizarse en contexto. Aprendizaje                                                                                                                                                                                                                                                                                                                                                                                                                                                       

**Type:** Learn
**Languages:** Python (stdlib, gated cross-attention + Perceiver resampler demo)
**Prerequisites:** Phase 12 · 03 (BLIP-2 Q-Former)
**Time:** ~120 minutes

## El objetivo del aprendizaje
- 解释 gated cross-attention 如何通过 tanh(gate) = 0 在初始化时保留结 LLM 的文本能力──
- 逐步讲解 Perceptor resampler:N 个图像补丁 → K 个固定latent查询,经跨注意 完成──
-  Describir Flamingo  Cómo utilizar el respeto de la posición de imágenes en la máscara causal  Tratar las secuencias de texto-imagen 
- 复现 pocos disparos Multimodal prompt 结构(3 个 imágenes-caption示例, luego una imagen de consulta)。

##  problemas
BLIP-2 va a introducir 32 tokens visuales 结 LLM entrada de capa. Cada instante una imagen cuando se puede trabajar. Pero si quieres introducir *多张* con imágenes de texto en error, por ejemplo,  aquí es la imagen A, para generar una captura; aquí es la imagen B, para generar una captura; ahora es la imagen C, para generar una captura  este?

La respuesta de Flamingo es: no cambie completamente el flujo de entrada de LLM. En los bloques de LLM existentes, se insertan capas de atención cruzada entre sí. Tokens de texto siguen siendo como siempre. Autoatención causal. Cada bloques de LLM, los tokens de texto también pasarán por una nueva capa cerrada a las características de la imagen.

Flamingo 回答的第二个问题是: cómo procesar cada instante en el que se puede cambiar el número de imágenes ((0、1 或多张)?

## 概念
### El LLM congelado

Flamingo 从结的 Chinchilla 70B LLM 开始──全部 70B weights 保持不变──现有的文本 自注意 和 FFN 正常运行──

### Re-muestreo del receptor

对于快速中的每张图像,ViT 会生成 N 个补丁代币――感知器复制器有 K 个固定的可学习的隐藏(Flamingo 使用 K=64)──每个复制器块有两个步骤:

1. La atención cruzada: K 个 latences asisten hasta N 个 parches tokens ((Q de latences, K / V de parches) ⋅
2. Latentes 内部的 Autoatención + FFN。

Después de pasar por 6 bloques de muestra, la salida es K=64 个 dim 1024 de tokens visuales, independientemente de ViT 生成多少补丁;; 224x224 图像(196补丁) y 480x480 图像(900补丁)

对于视频,resampler 会按时间应用: cada uno de los parches se produce en 64 个 latences, mientras que la codificación posicional temporal 让模型区分 t=0 和 t=N── el video completo se convierte en T * 64 个视觉代币──

### La atención cruzada

En el final de LLM de cada M 层之间(Flamingo utiliza M=4) insertado en un nuevo bloque de atención cruzada cerrado:

```
x_after_llm_block = llm_block(x_before)
cross = cross_attn(x_after, resampler_output)
gated = tanh(alpha) * cross + x_after
x_before_next_block = gated
```

- `alpha`Es una escalable de aprendizaje inicial para cero.
- `tanh(0) = 0`, por lo que inicialmente cuando se cerró la rama  contribución para el zero.
- ¿ Qué pasa ?`alpha`远离零,cross-attention 贡献会平滑增长──
- La conexión residual significa que incluso la puerta está completamente abierta, no cubre el texto del LLM; simplemente añade información visual en ella.

Este es el diseño más importante de Flamingo: el acondicionamiento visual es aditivo, cerrado, y en el inicio para cero.

### Con la atención cruzada enmascarada de entradas entrelazadas

En el ejemplo de "<imagen A> subtítulo A <imagen B> subtítulo B <imagen C> ?" en el siguiente, cada token de texto  debería sólo ver en la secuencia que se encuentra en la imagen anterior.`t`El símbolo de texto sólo atender a la indicación de imágenes `i < i_t`Las imágenes de los tokens de muestra, entre ellos `i_t`Es la posición`t`之前最近的图像──只看最近的前置图像或看到所有的前置图像都是有效选择; Flamingo 选择了前者──

### Aprendizaje en pocos disparos en contexto

El mensaje de Flamingo parece:

```
<image1> A photo of a cat. <image2> A photo of a dog. <image3> A photo of a
```

模型看补全模式并输出 "bird" (en inglés) 或 image3 显示的任何内容) ──没有 Gradient steps──结 LLM's in-context learning 能力通过门禁横断注意保留下来 这是论文的 Punchline,也是它重要的原因──

### Datos de formación

Flamingo utiliza tres grupos de entrenamiento:

1. MultiModal MassiveWeb (M3W):43.3 millones de páginas web que contienen imágenes y textos en formato de texto, reconstruido.
2. Parejas de imagen y texto (ALIGN + LTIP): 44 mil millones de dólares
3. Video-Text Pairs (VTP): 27 millones de clips de video cortos

Obélicos (obélicos) 2023: son los modelos abiertos de los idiomas, idiomas, idiomas y la mayoría de los modelos abiertos de los idiomas flamingos.

### OpenFlamingo y Otter

OpenFlamingo(2023) is open复现──Arquitectura 相同(Re-sampler + 结 LLaMA o MPT 上的 gateed cross-attention)──Puntos de control 为3B、4B、9B──Debido a que la base LLM 更小且数据更少,质量落后于 Flamingo──

Otter(2023) basado en OpenFlamingo, y MIMIC-IT(((1 instrucciones multimodal 数据集) para realizar la sintonía de instrucciones, demostrando la atención cruzada cerrada también se aplica a la instrucción siguiente。

### Los descendientes

- Idefics / Idefics2 / Idefics3: Gated cross-attention lineage of Hugging Face,逐步简化(Idefics2  abandonar el modelo,改为使用带适应性聚合的直接补丁代币)
- Transición Flamingo-Chameleon: hasta 2024 años, muchos equipos se dirigen hacia la fusión temprana (Lección 12.11); en el ambiente de producción de la columna vertebral, la atención cruzada cerrada al estilo Flamingo  todavía existe.
- La entrada interleaved de Gemini: concepto heredó la flexibilidad interleaved-format de Flamingo, aunque el mecanismo es propietario.

### Comparación con BLIP-2

| | BLIP-2 | Flamingo |
|---|---|---|
| Visual bridge | 输入处一次性使用 Q-Former | 每 M 层使用 gated cross-attention |
| Visual tokens | 每张图像 32 个 | 每张图像每个 cross-attn layer 64 个 |
| Frozen LLM | Yes | Yes |
| Few-shot in-context | 弱 | 强 — 论文的核心 |
| Interleaved inputs | 无原生支持 | Yes，设计目标 |
| Training data | 130M pairs | 1.3B pairs + 43M interleaved pages |
| Parameter count | 188M trained | ~10B trained (cross-attn layers) |
| Compute | 8 个 A100 上数天 | 数千个 TPUv4 上数周 |

预算有限的单图 VQA 选择BLIP-2――需要交错输入、少数投注或多图推理时选择Flamingo/Idefics2――


```figure
cross-attention-fusion
```

## Usalo
`code/main.py`演示:

1. En 36 tokens de parches falsos, utiliza 8 latences de aprendizaje, puramente Python.
2. Un paso de atención cruzada cerrado, entre ellos.`alpha = 0`→ 输出等于输入 (LLM 不变), entonces `alpha = 2.0`→ 混入视觉贡献──
3. Un constructor de máscaras entrelazadas,为 "(imagen 1) (texto 1) (imagen 2) (texto 2)"序列生成 2D attention mask──

##  entregarlo
本课产 出  `outputs/skill-gated-bridge-diagnostic.md` Dado una configuración abierta de VLM (configurar un modelo Y/N ✓ de frecuencia de acceso a través ✓ de un sistema de puertas), se identificará los elementos del linaje flamenco y se explicará la estrategia de congelación  Aplicado para la modificación de un tono fino  Reducir el rendimiento del texto  Respuesta: puertas ✓ de apertura demasiado grande) 

##  ejercicios
1. 计算 Flamingo-9B's visual parameter count:9B LLM + 1.4B gated cross-attention layers + 64M resampler──¿Cuál es la proporción de los parámetros de entrenamiento en los parámetros de la formación?

2. En PyTorch se logra el residuo cerrado `y = tanh(alpha) * cross + x` A través de la demostración experimental`alpha=0`时, iniciación `y==x`精确成立── es una verdadera verdad.

3. 阅读OpenFlamingo Sección 3.2(arXiv:2308.01390), para entender cómo manejan la cantidad de imágenes de cada pedido en diferentes cantidades, describe la estrategia de relleno.

4. ¿Por qué la máscara de atención cruzada de Flamingo  deja que el token de texto asista a la imagen de la posición anterior, en lugar de todas las imágenes de la posición anterior?

5. En el contexto de pocos disparos: para una nueva variante de Flamingo construir una que contenga 4 个image → color ejemplos de los objetos principales  ejemplo de la respuesta  descripción  Cuando el número de ejemplos de 0 a 8  cambia, el patrón de precisión esperado  cómo cambia 

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Perceiver resampler | "Fixed-latent cross-attention" | 从可变数量的 input patches 中生成 K 个固定 tokens 的 module |
| Gated cross-attention | "Tanh-gated bridge" | residual layer `y = tanh(alpha)*cross + x`，learnable alpha，初始化为 0 |
| Interleaved input | "Mixed sequence" | 图像和文本按阅读顺序自由混合的 prompt format |
| Frozen LLM | "No LLM gradients" | 文本 LLM 的 weights 不更新；只训练 resampler + cross-attn layers |
| Few-shot | "In-context examples" | 在 prompt 中给出少量（image, answer）对；模型无需 finetuning 即可泛化 |
| OBELICS | "Interleaved web corpus" | 包含 141M 个网页的开放数据集，图像和文本按阅读顺序排列 |
| Chinchilla | "70B frozen base" | Flamingo 的冻结文本 LLM，来自 DeepMind 的 Chinchilla paper |
| Gate schedule | "How alpha moves" | 训练期间 cross-attention gate 打开的速率 |
| Cross-attn frequency | "Every M layers" | 插入 gated cross-attention block 的频率；Flamingo 使用 M=4 |
| OpenFlamingo | "Open reproduction" | MosaicML/LAION 的 3-9B 开放 checkpoint；architecture 与 Flamingo 相同 |

## 延伸阅读
- [Alayrac et al. — Flamingo (arXiv:2204.14198)](https://arxiv.org/abs/2204.14198) 原始论文──
- [Awadalla et al. — OpenFlamingo (arXiv:2308.01390)](https://arxiv.org/abs/2308.01390) 开放复现──
- [Laurençon et al. — OBELICS (arXiv:2306.16527)](https://arxiv.org/abs/2306.16527) 交错网页语料──
- [Jaegle et al. — Perceiver IO (arXiv:2107.14795)](https://arxiv.org/abs/2107.14795) 通用 Arquitectura de perceptores。
- [Li et al. — Otter (arXiv:2305.03726)](https://arxiv.org/abs/2305.03726) 经过 instrucciones-tuned 的 Flamingo 后续模型──
- [Laurençon et al. — Idefics2 (arXiv:2405.02246)](https://arxiv.org/abs/2405.02246) Modernidad del enfoque flamenco
