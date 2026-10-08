# Transformadores de visión (ViT)

> Una imagen está compuesta por un parche 组成网格── una frase está compuesta por un token 组成网格──同一个变压器都能处理──

**Type:** Build
**Languages:** Python
**先修要求:**Fase 7 · 05 (Transformador completo), Fase 4 · 03 (CNNs), Fase 4 · 14 (Introducción de Transformadores de visión)
**Time:** ~45 minutes

##  problemas

Antes de 2020, la visión por ordenador significaba básicamente la convolución. ImageNet, COCO y el punto de referencia de detección.

Dosovitskiy et al. (2020) Una imagen vale 16x16 palabras  indican que se puede eliminar completamente la convolución。 cortar la imagen en parches fijas de tamaño grande, proyectar cada parche 线性到一个嵌入, volver a enviar este secuencia en un codificador transformador ordinario。 en una escala suficientemente grande bajo la Pre-entrenamiento de ImageNet-21k o más grande, ViT puede combinarse incluso más que el modelo basado en ResNet。

ViT es el comienzo de una tendencia más grande de 2026: una estructura, múltiples modalidades. ViT tokenizará el audio. ViT tokenizará las imágenes.

Para 2026, ViT  y sus sucesores ((DeiT、Swin、DINOv2、ViT-22B、SAM 3) ya han ocupado la mayor parte del campo de visión.

## 概念

![Image → patches → tokens → transformer](../assets/vit.svg)

### Paso 1  Aplicar

¿ Qué ?`H × W × C`图像拆成一个 `N × (P·P·C)`La configuración típica es:`224 × 224`Las imágenes,`16 × 16`parches → 196 parches, cada uno contiene 768 个值──

```
image (224, 224, 3) → 14 × 14 grid of 16x16x3 patches → 196 vectors of length 768
```

El tamaño del parche es un control clave. Parches más pequeños = más tokens, mejor resolución.

### Paso 2  incorporación lineal

Una matriz única y aprendida va a cada parche plano proyectado`d_model` esto es igual al tamaño del núcleo `P`¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡`P`En PyTorch esto es en realidad`nn.Conv2d(C, d_model, kernel_size=P, stride=P)`, sólo se necesita 2 pasos para lograr.

### 步骤 3  前置                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `[CLS]`token,添加 posiciones de incorporación

- En el principio añade una que se puede aprender.`[CLS]`token── su estado oculto final 会作为用于分类的图像表示──
- 添加可学习的位置嵌入式 (附加可学习的位置嵌入式) (ViT 原版) o sinusoidal 2D (后续变体) (后续变体) (后续变体) (后续变体)
- Después de 2024, RoPE se ampliará a la posición 2D, y no necesitará más incorporación evidente.

### 步骤 4  标准 Transformer codificador

堆叠 L 个 `LayerNorm → Self-Attention → + → LayerNorm → MLP → +`Bloques: ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞                               

### Paso 5  cabeza

对于 Clasificación:取 `[CLS]`estado oculto → lineal → suavemax── para DINOv2 o SAM, entonces se pierde `[CLS]`, directamente utilizar los embebidos de parches

### importantes cambios

| Model | Year | Change |
|-------|------|--------|
| ViT | 2020 | 原始版本。固定 patch size，完整 global attention。 |
| DeiT | 2021 | Distillation；只用 ImageNet-1k 就能训练。 |
| Swin | 2021 | 使用 shifted windows 的层级结构。固定的 sub-quadratic 成本。 |
| DINOv2 | 2023 | Self-supervised（无 labels）。最好的通用 vision features。 |
| ViT-22B | 2023 | 22B 参数；scaling laws 适用。 |
| SigLIP | 2023 | ViT + language pair，sigmoid contrastive loss。 |
| SAM 3 | 2025 | Segment anything；ViT-Large + promptable mask decoder。 |

### ¿Por qué tardó mucho en tener éxito?

ViT necesita una gran cantidad de datos para poder combinar las CNN, ya que no tiene sesgos inductivos de CNN (invarianza de traducción, localidad) ⋅ Si no hay más de 100M de imágenes etiquetadas o un fuerte autocontrol pre-entrenamiento, en el mismo cálculo las CNN siguen siendo más fuertes ⋅ Deit ha resuelto este punto en 2021 con técnicas de destilación ⋅ DINOv2 en 2023 con autocontrol ⋅ Soluciona este problema completamente ⋅


```figure
n5-patch-stream
```

## Construirlo

参见 `code/main.py` Patchfifi+linear embedding+sanity checks de puros stdlib. No se realizan entrenamientos, ya que cualquier ViT de tamaño real necesita PyTorch y un GPU de tiempo.

### Paso 1: Imagen falsa

Una imagen RGB 24 × 24 , us `(R, G, B)`tuples de la lista de ramas de indicios.

### Paso 2: parchear

```python
def patchify(image, P):
    H = len(image)
    W = len(image[0])
    patches = []
    for i in range(0, H, P):
        for j in range(0, W, P):
            patch = []
            for di in range(P):
                for dj in range(P):
                    patch.extend(image[i + di][j + dj])
            patches.append(patch)
    return patches
```

Orden de raster: según la línea principal de la red 顺序排列── todos los viT 都使用这种顺序──

### 步骤 3: incrustado lineal

Cada parche se multiplicará por un parche al azar.`(patch_flat_size, d_model)`matriz── añadir `[CLS]`后,验证输出形 为 `(N_patches + 1, d_model)`¿Qué es eso?

### Paso 4: 统计真实 ViT 的参数

打印 ViT-Base 的参数:12 capas、12 cabezas、d=768、patch=16──与ResNet-50(~25M) comparar。ViT-Base 大约是 ~86M──ViT-Large ~307M──ViT-Huge ~632M──

## Usalo

```python
from transformers import ViTImageProcessor, ViTModel
import torch
from PIL import Image

processor = ViTImageProcessor.from_pretrained("google/vit-base-patch16-224-in21k")
model = ViTModel.from_pretrained("google/vit-base-patch16-224-in21k")

img = Image.open("cat.jpg")
inputs = processor(img, return_tensors="pt")
out = model(**inputs).last_hidden_state   # (1, 197, 768): [CLS] + 196 patches
cls_emb = out[:, 0]                       # image representation
```

**DINOv2 embeddings 是 2026 年 image features 的默认选择。**结脊椎, entrenar una cabeza muy pequeña―¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡

**Patch-size 选择。**小模型使用 16×16(ViT-B/16)。 Previsión de la densidad(segmentación) utiliza 8×8 o 14×14(SAM、DINOv2)。超大模型使用 14×14。

##  entregarlo

参见 `outputs/skill-vit-configurator.md`◊ Esta habilidad se basará en el tamaño del conjunto de datos, resolución y presupuesto de cálculo, para una nueva tarea de visión  seleccionar una variante ViT y tamaño de parche ◊

##  ejercicios

1. **Easy.**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Verificación de parches`(H/P) * (W/P)`, 平 parche 维度等于 `P*P*C`¿Qué es eso?
2. **Medium.**实现 2D sinusoidal posiciones de embebidos, es decir, para cada parche `row`Y `col`Crear dos códigos sinusoidales independientes, y hacerlos en conjunto. Enviarlos a un pequeño PyTorch ViT, y comparar con la precisión de los embebidos posicionales aprendizables en CIFAR-10.
3. **Hard.**Construir un ViT de 3 capas (PyTorch), utilizar parches 4×4 en 1.000 张 MNIST 图像上训练――测试精度──然后在同样1000 张图像上加入 DINOv2预训练(简化版:只训练编码器 根据掩盖补丁 预测补丁嵌入) ――¿¿¿La precisión se ha mejorado?

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Patch | “vision-transformer token” | 图像中一个 `P × P × C` 区域的 pixel values 所组成的扁平 Vector。 |
| Patchify | “Chop + flatten” | 将图像切成不重叠的 patches，并将每个 patch flatten 成一个 Vector。 |
| `[CLS]` token | “图像摘要” | 添加在开头的可学习 token；它的最终 Embedding 是图像表示。 |
| Inductive bias | “模型预设的假设” | ViT 的 priors 比 CNNs 少；需要更多数据来弥补差距。 |
| DINOv2 | “Self-supervised ViT” | 使用 image augmentation + momentum teacher，在没有 labels 的情况下训练。2026 年最好的通用 image features。 |
| SigLIP | “CLIP 的继任者” | ViT + text encoder，使用 sigmoid contrastive loss 训练；在相同 compute 下优于 CLIP。 |
| Swin | “Windowed ViT” | 带有 local attention + shifted windows 的层级 ViT；sub-quadratic。 |
| Register tokens | “2023 trick” | 几个额外的可学习 tokens，用来吸收 attention sinks；可以改进 DINOv2 features。 |

## 延伸阅读

- [Dosovitskiy et al. (2020). An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale](https://arxiv.org/abs/2010.11929) ViT 论文。
- [Touvron et al. (2021). Training data-efficient image transformers & distillation through attention](https://arxiv.org/abs/2012.12877)¿Qué es esto?
- [Liu et al. (2021). Swin Transformer: Hierarchical Vision Transformer using Shifted Windows](https://arxiv.org/abs/2103.14030)¿Qué pasa?
- [Oquab et al. (2023). DINOv2: Learning Robust Visual Features without Supervision](https://arxiv.org/abs/2304.07193) DINOv2──
- [Darcet et al. (2023). Vision Transformers Need Registers](https://arxiv.org/abs/2309.16588) DINOv2 registro-token 修复方案。
