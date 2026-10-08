# LLaVA con el ajuste de instrucciones visuales

> LLaVA(4 de enero de 2023) es la arquitectura multimodal más copiada de la Tierra. Se sustituye por un MLP de 2 capas a la Q-Former de BLIP-2, con una simple concatenation de tokens, sustituye la atención cruzada cerrada de Flamingo y se convierte en una instrucción visual de 158 mil instrucciones. Estos datos fueron elaborados por GPT-4 a partir de capciones de texto puro.

**类型：**Construcción
**语言：**Python(stdlib、proyector + constructor de instrucciones-tiplos)
**先修：**Fase 12 · 02(CLIP),Fase 11(LLM Ingeniería  ajuste de instrucciones)
**时间：**~ 180 minutos

## El objetivo del aprendizaje

- Construir un proyector MLP de 2 capas, va ViT parche Embedding(dim 1024)映射到 LLM 的 Embedding dim(dim 4096)。
- 走通 LLaVA receta de dos etapas:(1) en 558k pares de captura 上做 proyector alignment,(2) en 158k giros generados por GPT-4 上做 visual instrucción de sintonía。
- 构建一个LLaVA-format prompt,包含图像 Token placeholder、system prompt 和 user/assistant turns──
-  Explicar por qué la comunidad de Q-Former  transfirió a MLP, aunque Q-Former está en el presupuesto de tokens 

##  problemas

BLIP-2 de Q-Former(Lección 12.03) poner una imagen comprimida en 32 Token──干净、高效、基准表现好── pero tiene dos problemas──

Primera, Q-Former es entrenable, pero su pérdida no es una tarea final. Etapa 1  entrenamiento ITC+ITM+ITG. Etapa 2  entrenamiento LM pérdida.

Segundo, Q-Former tiene 188M parámetros, mientras que en la escala de 2023 de LLaVA, debes ponerlo y el objetivo LLM 一起协同设计――换 LLM, debes volver a entrenar Q-Former――换视野编码器, también volver a entrenar―― cada conjunto es un proyecto independiente de I + D ⋅

LLaVA's respuesta simple a embarazosa: Tome 576 Tokens de parche de ViT, haga que cada Token a través de una MLP de 2 capas`1024 → 4096 → 4096`), luego se colocan todos los 576 个都塞进LLM的输入序列──没有瓶──没有基于奇怪目标的阶段1预训──只是在直接的LM损失上训练MLP──

Se puede ver en el siguiente video: "El video de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de la película de

Resultado: una en 8 张 A100 上运行一天、 en MMMU 上击败 Flamingo、并发布社区可扩展的开放检查点的 VLM── para el final de 2023 año, ya ha producido 50+ garras──

## 概念

### 架构

LLaVA-1.5 en 13B:
- Encoder de visión: CLIP ViT-L/14 @ 336(fase 1 结,fase 2 可选解)
- Proyector: MLP de 2 capas de activación de GELU,`1024 → 4096 → 4096`¿Qué es eso?
- LLM: Vicina-13B (más tarde fue Llama-3.1-8B)

图像 + 文本 de paso adelante de la respuesta:

```
img -> ViT -> 576 patches of dim 1024
patches -> MLP -> 576 tokens of dim 4096
prompt: system + "<image>" placeholder + user question
replace <image> token with the 576 projected tokens
feed the full sequence to the LLM
decode response
```

En el contexto de LLM, esto es sólo un error.

### Etapa 1: Alineación del proyector

结 ViT──结 LLM──只训练 2-layer MLP──Dataset:558k par de imagen-capción(LAION-CC-SBU)──Loss:在 proyectado imagen Token 条件下,对 caption做语言建模──

En el lote 128  entrenamiento de una sola época,几小时就能完成──proyector 学会把 ViT-space 映射到LLM-space──no hay supervisión específica de tarea──

### Etapa 2:Aunificación de las instrucciones visuales

解 proyector ((still可训练) ――解 LLM (通常全量,有时使用LoRA) ―― en 158k vueltas de instrucción visual 上训──

Los datos de instrucción es un método de generación de las instrucciones.
1. 取一张 COCO 图像──
2. 提取文本描述(5 条 Capciones humanas + lista de la caja límite)。
3. Usar tres tipos de plantillas de envío a GPT-4:
   - Conversación:  generar un segmento de usuarios y asistentes  alrededor de esta imagen para volver a intercambiar conversaciones 
   - 详细描述:Dá una descripción rica y detallada de la imagen.
   - 复杂推理:  plantear una pregunta que necesita ser considerada según la imagen, y luego responderla―
4. Para resolver los problemas de la información, el sistema de información debe ser un sistema de información.

Todo el proceso no se dirigió directamente a la imagen  sólo se dirigió al texto descripción―GPT-4 会 halucina 合理的图像内容― hay algunos ruidos, pero funcionó: 158k vueltas 足以解锁对话能力―

### ¿Por qué la comunidad replicó este programa

- 无需调调的阶段-1 (en inglés: stage-1) pérdidas específicas.
- El proyector se entrena en horas, no en días.
- A través de sólo reentrenar proyector, podemos sustituir LLM                                                                                                                                                                                                                                                       
- El gasto de la re-generación de datos de instrucción visual es muy bajo en el uso de GPT-4.

### LLaVA-1.5 con LLaVA-NeXT

LaVA-1.5(2023 年 10 月)加入:
- La información de la tarea académica se puede utilizar para la formación de la formación.
- Mejor sistema rápido.
- 2048 → 32k contexto

LLaVA-NEXT(2024 年 1 月)
- AnyRes:把高分辨率图像切成2x2或1x3 网格的336x336 crops,再加一个全球低分辨率小图片──每种 crop 变成576 代币;每张图像总计约2880 代币──OCR和图表 任务大幅提升──
- Utiliza ShareGPT4V(高质量 GPT-4V captions) de mejor mezcla de datos de instrucciones.
- Más fuerte de base LLMs ((Mistral-7B、Yi-34B)

### LLaVA-OneVision

Lección 12.08 会深入讲 OneVision──简短版: Con el mismo proyector, pero con un currículo 训练, en un modelo, abarcar una sola imagen、multi-imagen 和 video,并共享视觉标志预算──

### Comparación con Q-Former

| | Q-Former（BLIP-2） | MLP（LLaVA） |
|---|---|---|
| 每张图像的 visual Token | 32 | 576（base）或 2880（AnyRes） |
| 可训练参数 | 188M + LM | 40M + LM |
| Stage 1 loss | ITC+ITM+ITG | 仅 LM |
| LLM drop-in | 需要重新训练 | 最小重新训练即可替换 |
| Multi-image | 别扭 | 自然（concat） |
| Video | 别扭 | 自然（per-frame concat） |
| Token budget | 小 | 大 |

MLP 赢在简单性和 Token 灵活性──Q-Anterior 赢在 Token presupuesto── hasta el final de 2023 año, el presupuesto de Token 已不再是约束瓶(contexto LLM 增长到32k-128k+),简单性占上风──

### Formatos de la cuenta

```
A chat between a curious human and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the human's questions. USER: <image> Describe this image in detail. ASSISTANT: The image shows ...
```

`<image>`Es un Token de lugar. Antes de la tokenización, se reemplazará por 576 Tokens visuales. Cualquier Reserva es de 2880 Token.

### 参数经济性 (parámetro económico)

LaVA-1.5-7B 分解:
- CLIP ViT-L/14 @ 336:303M(fase 1 结,fase 2 normalmente解)
- Proyector ((2x lineal): ~ 22M 可训练──
- Llama-7B:7B:
- 总计:7.3B parámetros。fase 2 期间可训练:完整 7B + 22M proyector。

El costo de entrenamiento de la etapa 2:8xA100 arriba aproximadamente 20 horas. Este es el número clave de un día.


```figure
mm-llava-projector
```

## Usalo

`code/main.py` realización:

1. 纯 Python 中的 2 capas de proyector MLP(escala de juguete 下 dim 16 → 32 → 32)。
2. Proyecto de construcción de proyectos: sistema de proyectos + 用 N 个 proyectado Token 替换 `<image>`+ turno de usuario + control de posición de generación asistente。
3. Un visualizador, para mostrar un bloque visual de 576 tokens en el contexto de LLM en el que se puede ver el contenido de 2k / 32k / 128k.

##  entregarlo

本课产 出  `outputs/skill-llava-vibes-eval.md` Dado un punto de control familiar de LLaVA, se ejecutará una suite de vibraciones de 10 pulsos  3 subtítulos  3 VQA  2 razonamientos  2 rechazos), y se reportará una tarjeta de puntuación humana.

##  ejercicios

1. 计算 `1024 → 4096 → 4096`¿Cuál es la proporción de LLaVA-13B en el proyector MLP de 2 capas?

2. Para un caso de rechazo, construye una llamada de LLaVA para crear imágenes que contengan personas privadas. Escriba una respuesta de asistente esperada. ¿Por qué debería la LLaVA rechazar esta petición? ¿Qué entrenamiento necesita para fortalecer la rechazo?

3. 阅读LLaVA-NeXT blog de AnyRes 部分──计算一张 1344x672 图像在 AnyRes 下的视觉代币计量──与 336x336 下的基础 576代币对比──

4. El proyector LLaVA etapa 1 Uso de capciones  entrenamiento                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               

5. LLaVA-Instruct-150k utiliza GPT-4 y COCO capciones 生成说明──对于一个新领域(medical X-rays、satellite imagery),描述生成域指示的四步数据管线──每一步可能出出什么问题?

## 关键术语: "El hombre es un hombre"

| 术语 | 人们的说法 | 它实际上的含义 |
|------|----------------|------------------------|
| Projector | “MLP bridge” | 带 GELU 的 2-layer MLP，将 ViT dim 映射到 LLM dim |
| Image Token | “<image> placeholder” | Prompt marker，在 inference 前被 N 个 projected visual Token 替换 |
| Visual instruction tuning | “LLaVA stage 2” | 在 GPT-4-generated（image, instruction, response）triplets 上训练 |
| Stage 1 alignment | “Projector pretraining” | 冻结 ViT 和 LLM，用 captions 上的 LM loss 训练 projector |
| AnyRes | “Multi-crop tiling” | 将高分辨率图像切分为 tile grid，并拼接每个 tile 的 visual Token |
| LLaVA-Instruct | “GPT-4-generated” | 从 COCO captions + GPT-4 合成的 158k instruction-response pairs |
| Vision encoder freeze | “Backbone locked” | CLIP weights 在 stage 1 不更新，有时在 stage 2 也不更新 |
| ShareGPT4V | “Better captions” | 由 GPT-4V 生成的 1M dense captions，用于更高质量 alignment |
| VQA | “Visual question answering” | 回答关于图像的自由形式问题的任务 |
| Prismatic VLMs | “Design-space paper” | Karamcheti 2024 ablation，系统测试 projector 和 data choices |

## 延伸阅读

- [Liu et al. — Visual Instruction Tuning (arXiv:2304.08485)](https://arxiv.org/abs/2304.08485) LaVA 论文。
- [Liu et al. — Improved Baselines with Visual Instruction Tuning (arXiv:2310.03744)](https://arxiv.org/abs/2310.03744) LLaVA-1.5。
- [Chen et al. — ShareGPT4V (arXiv:2311.12793)](https://arxiv.org/abs/2311.12793) encabezados densos 数据集──
- [Karamcheti et al. — Prismatic VLMs (arXiv:2402.07865)](https://arxiv.org/abs/2402.07865) Ablaciones de diseño y espacio。
- [Li et al. — LLaVA-OneVision (arXiv:2408.03326)](https://arxiv.org/abs/2408.03326) 统一的单图、多图、视频──
