# 任意分辨率 Visión: parche-n'-Pack y NaFlex

> La respuesta de VLM es que el tamaño de todo el contenido en el VLM es un tamaño cuadrado fijo, pero no se ha logrado resolver el escenario de alta resolución. Google muestra que se pueden usar enmascaramientos de bloque y diagonal para realizar parches de resolución variable en un solo lote de transformadores.

**Type:** Build
**Languages:** Python (stdlib, patch packer + block-diagonal mask)
**Prerequisites:** Phase 12 · 01 (ViT patches), Phase 12 · 05 (LLaVA)
**Time:** ~120 minutes

## El objetivo del aprendizaje
- Se puede construir una serie de parches en una imagen de resolución variable en una secuencia, y construir una máscara de atención de bloque-diagonal.
- 针对给定任务,在 AnyRes tiling (LLaVA-NeXT) 、NaFlex (SigLIP 2) y M-RoPE (Qwen2-VL) 之间做做选择──
- En caso de no cambiar de tamaño, para OCR, gráficos y fotografías calcular los presupuestos de tokens.
- Expresar tres modos de fracaso de la talla cuadrada: el texto estrujado, el contenido cortado, el toque de la barra.

##  problemas
Los transformadores necesitan una secuencia. Un lote es una superposición de la misma secuencia. Si tu imagen es de 224x224, cada vez obtendrás 196 parches.

现实不配合──文档是版(8.5x11 英寸,约 2:3)──图表截图是横版(16:9)──收据又高又窄(1:3)──医学影像通常是2048x2048或更大──移动设备截图是1170x2532(0.46:1)──

Tres opciones antes del año 2024 y por qué todas fallarán:

1. Resiza hasta el cuadrado fijo ((224x224 o 336x336) ⋅ extrusión se torce texto y el rostro humano。
2. Crop to fixed aspect ratio. Usted perderá la mayor parte del contenido de la imagen, y elegir la ubicación de la cosecha es un problema de visión.
3. El pad hasta el extremo más largo. Se ha resuelto el error, pero para las imágenes, el 50% de los Tokens serán desperdiciados en el relleno.

Respuesta del año 2024-2025: Que el transformador 吃下图像原生分辨率的补丁,并弄清楚如何把不同构成批量 打包成一序列,同时避免浪费计算──

## 概念
### NaViT y el paquete de parches

NaViT(Dehghani et al., 2023) es la prueba de que este método puede ser escalado de trabajo.

1. Para cada imagen en el lote, según el tamaño del parche seleccionado (por ejemplo 14) calcular su cuadrícula de parches originales.
2. Los parches de cada imagen se aplanarán en su propia secuencia de longitud variable.
3. Se pondrán en una secuencia larga de los parches de todas las imágenes.
4. Construir una máscara de atención de bloque diagonal, hacer que los parches de la imagen A sólo estén presentes en la imagen A.
5. 携带每个补丁的位置信息(2D RoPE o embedidos de posición fraccionaria)。

Tres张图像组成的批次:336x336(576 Token)、224x224(256 Token) y 448x336(768 Token), se convertirá en una secuencia de 1600 Token, con una máscara de bloque-diagonal de 1600x1600── sin relleno── sin gasto de cálculo──Transformer puede procesar cualquier proporción de aspecto──

NaViT también introdujo en el entrenamiento la caída de parches fraccionadas en todo el lote en el que se pierden el 50% de parches. Esto ya puede regularse, también puede acelerar el entrenamiento. SigLIP 2 ha heredado este punto.

### En el caso de los productos de la industria de la industria de la industria de la producción, el valor de la producción de los productos de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la producción se calcula en el punto 1.

AnyRes de LLaVA-NeXT es un programa de sustitución de la imagen.

1. Desde el predefinición de conjunto, se puede elegir una distribución de cuadrícula (1x1) (1x2) (2x1) (1x3) (3x1) (2x2)  para que su relación de aspecto de la imagen sea más adecuada
2. Cortar toda la imagen en la cuadrícula; cada mosaico se convierte en un recorte de 336x336
3. También se genera una miniatura:整张图像大小到336x336, como Token de contexto global.
4. Cada mosaico será enviado a un código congelado de 336 codificadores.

对于一张 672x672 图像, use 2x2 grid加缩影:4 * 576 + 576 = 2880 个视觉代币――昂贵但有效LLM 同时看局部细节和全局上下文――

Cuando tu codificador está congelado y sólo apoya una resolución,AnyRes es la primera ruta de selección. Esto hará que la imagen de los Token number explode.

### El valor de la carga de carga de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la industria de la Unión

Qwen2-VL introdujo el Embedding de Posición Rotaria Multimodal. Diferente de las posiciones fraccionarias de NaViT o de la ficha y miniatura de AnyRes, cada parche lleva una posición 3D:

M-RoPE 原生提供动态分辨率,无需重新训练──Inference 时输入任意HxW 图像,patch embedder 生成H/14 x W/14 个代币, cada代币 获得自己的 (t=0, r=row, c=col) 位置,RoPE utiliza la frecuencia correcta de rotación Atención,完成──Qwen2.5-VL 和 Qwen3-VL 延续了这一点──V2PE de InternVL3 es el mismo pensamiento, sólo según la modalidad 使用可编码──

Diferente de AnyRes, M-RoPE en la resolución original es O(H x W / P^2) Token no tiene tiles 带来的乘法开销. Diferente de NaViT, todavía se espera que cada vez más sólo se procesen imágenes únicas.

### NaFlex (SigLIP 2)

NaFlex es el modelo nativo de control de SigLIP 2. 模式──单个模型在推理中支持多种序列长度──256、729、1024 Token)──内部在训练期间使用NaViT-style patch-n'-pack,并为每一个补丁使用绝对分数位置──卖点是:一个检查点,按任务在推理中选择 Token budget──

语义任务(clasificación、recuperar) con 256 Token。OCR 或图表理解 con 1024 Token。无需重新训练。

### La máscara de empaque

La máscara de bloque diagonal es la mayoría de los lugares donde se realiza fácilmente.`N_total`de la secuencia de paquetes, cubre la imagen `i=0..B-1`, su duración`n_i`, forma `(N_total, N_total)`de la máscara`M`En dos índices que se colocan en el mismo bloque de la imagen 时为1,否为0―― puedes construirlo desde la lista de longitud acumulada:

```
offsets = [0, n_0, n_0+n_1, ..., N_total]
M[i, j] = 1 iff there exists b where offsets[b] <= i < offsets[b+1] and offsets[b] <= j < offsets[b+1]
```

En PyTorch, esto puede ser usado.`torch.block_diag`O claramente reunir 一行实现──FlashAttention de longitud variable de la ruta`cu_seqlens`) completamente saltó máscara, directamente con tensor de longitud acumulada en secuencias  internas de asistencia  para el lote típico, comparado con máscara densa 快约10x──

### Presupuestos de tokens

按任务选择策略:

- OCR / documentos:1024-4096 Token。SigLIP 2 NaFlex en 1024, o AnyRes 3x3 + miniatura。
- Gráficos y UI:384-448 原生分辨率下 729-1024 Token。使用带max pixels cap 的 Qwen2.5VL dinámica resolución。
- Fotos naturales: 256-576 Token 就夠了──下游 LLM 能看到足夠信息──把 Token 花在内容密度高的地方──
- Video: Espacio de unidad 后每 64-128 Token,2-8 FPS──Lección 12.17 会讲这个──

Reglas de producción de 2026: seleccionar una tapa de pixel máximo por tarea, según la relación de aspecto original 编码到该帽,打包批量,并跳过填充──Qwen2.5VL 暴露了`min_pixels`Y `max_pixels`, es para este giro.


```figure
mm-patch-n-pack
```

## Usalo
`code/main.py`Para un conjunto de imágenes de diseño de imagen de un conjunto de imágenes de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño de diseño

- 接收一个 (H, W) 图像尺寸列表──
- 按补丁尺寸 14 计算每张图像的补丁序列长度──
- Los empaque en una longitud total.`sum(n_i)`La secuencia de la
- 构建块-diagonal atención máscara(为了清晰起见,使用密集)
- Comparar el coste de los paquetes con el tamaño cuadrado y el revestimiento de cualquier tipo.
- Para un lote mixto ((recibo, gráfico, captura de pantalla, foto) Imprimir tabla de presupuesto de los tokens.

运行它――输出数字解释为什么 cada VLM abierto de 2026 años utiliza parches-n'-pack―

##  entregarlo
本课生成                       `outputs/skill-resolution-budget-planner.md`△ dado una proporción de aspecto mixta 工作负载(OCR、chartes、fotografías、frame de vídeo) y el presupuesto total de tokens, que elegirá correctamente estrategia(NaFlex、AnyRes、M-RoPE o cuadrado fijo), y saque por configuración de solicitud― Cuando usted hace el tamaño de VLM en el producto 时使用这个技能它能避免静默的10x Token 膨胀,否则会杀杀延迟预算―

##  ejercicios
1. Una ganancia de 600x1500(1:2.5)。 tamaño de parche para 14 时, ¿cuántos tokens de resolución nativa? cuadrados-size hasta 336 后有多少? ¿En la práctica cuál de ellos perderá más precisión OCR?

2. Para un lote que contiene cuatro imágenes, construye una máscara de bloque diagonal, su longitud se diferencia entre 256,576,729,1024.`256^2 + 576^2 + 729^2 + 1024^2`个非零条目──

3. Sobre una imagen, parche 14, comparación: a) tamaño cuadrado hasta 336 后编码, b) Cualquier Res 2x1 + miniatura, c) M-RoPE en nativo── ¿cuál es el tipo de token que utiliza menos? ¿cuál es el tipo de token que conserva más detalles?

4. 实现 fractional patch dropping: given determining a packed sequence, uniformly at random 丢弃 50% 的Token,并相应更新块-diagonal mask──测量 mask 的稀缺性 变化──

5. 阅读 Qwen2-VL 论文(arXiv:2409.12191) de la sección 3.2──用两句话描述 `min_pixels`Y `max_pixels`Control, y por qué las dos fronteras son importantes.

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Patch-n'-pack | "NaViT-style packing" | 将来自不同图像的可变长度 patch sequences concatenate 到一个 batch dimension 中 |
| Block-diagonal mask | "Packing mask" | Attention mask，将每张图像的 patches 限制为只 attend 自己，而不是 pack 中的相邻图像 |
| AnyRes | "LLaVA-NeXT tiling" | 将高分辨率图像切成固定大小 tiles 的 grid，并加一个全局 thumbnail；用固定 encoder 编码每个 tile |
| NaFlex | "SigLIP 2 native-flex" | 单个 SigLIP 2 checkpoint，可在 inference 时服务 256/729/1024-Token budgets，无需重新训练 |
| M-RoPE | "Multimodal RoPE" | 3D rotary position encoding（time、row、column），无需 position tables 即可处理任意 H、W、T |
| cu_seqlens | "FlashAttention packing" | FlashAttention varlen path 使用的 cumulative-length tensor，用来替代 dense block-diagonal mask |
| min_pixels / max_pixels | "Resolution bounds" | Qwen2.5-VL 的 per-request knobs，用于限制非常小或非常大输入上的 Token count |
| Visual token budget | "How many tokens per image" | 每张图像发出的 patch Token 粗略数量；决定 LLM 的 prompt budget 和 Attention cost |

## 延伸阅读
- [Dehghani et al. — Patch n' Pack: NaViT (arXiv:2307.06304)](https://arxiv.org/abs/2307.06304)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
- [Laurençon et al. — What matters when building vision-language models? (Idefics2, arXiv:2405.02246)](https://arxiv.org/abs/2405.02246)
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786)
- [Qwen Team — Qwen2.5-VL Technical Report (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
