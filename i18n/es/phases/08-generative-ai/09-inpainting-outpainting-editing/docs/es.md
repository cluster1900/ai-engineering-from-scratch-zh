# Pintura, Despeintura y Edición de imágenes

> Text-to-image 会创造新事物──Inpainting 会修复旧事物──En el entorno de producción, el 70% de las imágenes se cuestan editando: sustituir el contexto、 remover el logotipo、 ampliar el dibujo、 reproduzir una sola mano──Inpainting 正是传播 体现价值──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 8 · 08 (ControlNet & LoRA)
**Time:** ~75 minutes

##  problemas

客户发来一张完美产品照片,但背景有分散注意的标牌――你想抹去这个标牌,并让其他部分都保持像素级一致――你不能从头发运行文字-图像,因为结果会有不同的颜色,不同的光照,不同的产品角度――你想只重生被蒙面的区域,并且希望重生的内容尊重周围的下文――

Éste es el pintado. Sus variaciones incluyen:

- **Inpainting.**En la máscara, se vuelve a generar, se mantiene la imagen externa.
- **Outpainting.**Enmascarar en el exterior (reproducir) o extenderse a la pintura (extra), conservar en el interior (reservar).
- **Image editing.**Re-generar toda la imagen, pero mantener con la original de la imagen de la lenguaje o estructura coincidencia.

Cada línea de difusión de 2026 años 都带有涂料模式──Flux.1-Fill、Stable Diffusion Inpaint、SDXL-Inpaint、DALL-E 3 Edit──它们 se basan en el mismo principio──

## 概念

![Inpainting: mask-aware denoising with context-preserving reinjection](../assets/inpainting.svg)

### 朴素方法 (y por qué es incorrecto)

带着面具 运行标准文本到图像――En cada paso de muestreo, reemplaza el ruido latente de la región de la máscara en medio de la máscara por una imagen de limpieza difundida hacia adelante―― puede funcionar...... pero el efecto es muy pobre―― el artefacto de frontera 会出, porque el modelo no sabe qué debe tener la máscara en la región―

### Modelo de pintura exacto

Entrenando una U-Net modificada, deja que reciba 9 canales de entrada, en lugar de 4:

```
input = concat([ noisy_latent (4ch), encoded_image (4ch), mask (1ch) ], dim=channel)
```

 canales adicionales son una copia de la imagen fuente codificada por VAE, además de una máscara de canal único.                                                                                                                                                                                                                                                 

SD-Inpaint、SDXL-Inpaint、Flux-Fill todos usan este tipo de 9 canales(o similar)`StableDiffusionInpaintPipeline`¿Qué es esto?`FluxFillPipeline`¿Qué es eso?

### SDEdit (Meng et al., 2022)  免费编辑

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `t`, y luego usar un nuevo prompt de `t`Reverso hacia 0── no necesita reentrenamiento── comienza `t`La elección se pondrá entre la verdad y la libertad de creación:

- `t/T = 0.3`→                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
- `t/T = 0.6`→ Medio edit, conservando la estructura grosía
- `t/T = 0.9`→                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

### InstructPix2Pix (Brooks et al., 2023)

En el`(input_image, instruction, output_image)`Tres grupos de diseño de un modelo de difusión. También se puede utilizar una escala de imagen y texto.

### RePaint (Lugmayr et al., 2022)

Mantenga un modelo estándar de difusión incondicional. En cada paso inverso, realice un nuevo muestreo: ocasionalmente salta hacia atrás y vuelve a generar un estado de ruido. Así se puede evitar el artefacto de frontera.


```figure
inpaint-mask-reinject
```

## Construye el mismo

`code/main.py`En 5 dimensiones de datos se realiza una versión de juego de 1-D de pintura 方案── Nosotros en 5 dimensiones de datos mezcla  entrenar una DDPM, cada muestra es de dos grupos  uno de 5 flotantes── Cuando se sugiere, nosotros mask 2 de 5 dimensiones, en cada paso inyectado en la versión de 3 dimensiones de ruido hacia adelante  de la máscara sin,  sólo se re-genera la dimensión de la máscara──

### Paso 1: 5 D datos de la MDPD

```python
def sample_data(rng):
    cluster = rng.choice([0, 1])
    center = [-1.0] * 5 if cluster == 0 else [1.0] * 5
    return [c + rng.gauss(0, 0.2) for c in center], cluster
```

### Paso 2: En todos los 5 dimensiones entrenamiento denoiser

标准 DDPM──Net para la entrada de ruido 5D 输出 5D predicción del ruido―

### Paso 3: Usar el reverso de la máscara

```python
def inpaint_step(x_t, mask, clean_image, alpha_bars, t, rng):
    # replace unmasked dims with a freshly noised version of the clean source
    a_bar = alpha_bars[t]
    for i in range(len(x_t)):
        if not mask[i]:
            x_t[i] = math.sqrt(a_bar) * clean_image[i] + math.sqrt(1 - a_bar) * rng.gauss(0, 1)
    # ...then run the normal reverse step on x_t
```

Es un método simple, y es válido en el juego de datos 1-D.

### Paso 4: Despeño

La pintura es una pintura de la máscara. La pintura es una pintura de la máscara.

## 陷

- **Seams.**朴素方法会留下可见边界,因为 Gradient 信息不会跨口罩 流动──修复方式:把口罩 膨胀 8-16 个像素,或使用正确的涂料模型──
- **Mask leakage.**Si la imagen de la mascarilla no está condicionada                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
- **CFG interacts with mask size.**Pequeña máscara 上使用高CFG 会得到过和补丁──小编辑应降低CFG──
- **SDEdit fidelity cliff.**Desde`t/T = 0.5`¿ Qué ?`t/T = 0.6`Puede perder su identidad. Necesita barrido y punto de control.
- **Prompt mismatch.**Pronto 应该描述*整张*图,而不只是新内容──用 A cat sitting on a chair, instead of a cat──

## Usalo

| Task | Pipeline |
|------|----------|
| 移除物体，小 mask | SD-Inpaint 或 Flux-Fill，标准 prompt |
| 替换天空 | SD-Inpaint + "blue sky at sunset" |
| 扩展画布 | SDXL outpaint mode（8px feather）或带 outpaint mask 的 Flux-Fill |
| 重新生成手 / 脸 | SD-Inpaint，prompt 重新描述主体 + ControlNet-Openpose |
| 改变某个区域的风格 | 在 mask 区域上使用 `t/T=0.5` 的 SDEdit |
| "Make it sunset" | InstructPix2Pix 或 Flux-Kontext |
| 背景替换 | SAM mask → SD-Inpaint |
| 超高保真 | 最难场景使用 Flux-Fill 或 GPT-Image（hosted） |

SAM(Meta de Segmento Cualquier cosa,2023) + pintura de difusión es 2026 años de retorno de la tubería de movimiento.

## Envío

保存 `outputs/skill-editing-pipeline.md` Conocimiento 接收一张原图 + 编辑描述 + 可选面具(或 SAM prompt),并输出: máscara 生成方法、base model、CFG scales(imagen + texto)、SDEdit-t 或 inpainting mode, así como lista de verificación QA──

##  ejercicios

1. **Easy.**En el`code/main.py`En el medio, ¿La proporción de dimensiones de la máscara se cambia de 0,2 a 0,8?
2. **Medium.**实现 RePaint: cada hasta la 10 个 个反转步骤,跳回 5 步(加噪)并重新指责──测量它是否降低面具 边缘的边界残留──
3. **Hard.**Utiliza Embracing Face diffusers comparación:SD 1.5 Inpaint + ControlNet-Openpose 与 Flux.1-Fill, en 20 个 任务上测试──分别评分 poseen adhesión 和 conservación de la identidad──

## 关键术语: "El hombre es un hombre"

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| Inpainting | “填洞” | 在 mask 内重新生成；保留外部像素。 |
| Outpainting | “扩展画布” | 在画布外重新生成；保留内部。 |
| 9-channel U-Net | “正确的 inpainting model” | 输入为 `noisy \| encoded-source \| mask` 的 U-Net。 |
| SDEdit | “带 noise level 的 img2img” | 加噪到时间 `t`，用新 prompt denoise。 |
| InstructPix2Pix | “纯文本编辑” | 在 (image, instruction, output) 三元组上 fine-tuned 的 diffusion。 |
| RePaint | “无需重新训练” | 在 reverse 过程中周期性 re-noise，以减少 seams。 |
| SAM | “Segment Anything” | 通过点击或框生成 mask；与 inpaint 配合使用。 |
| Flux-Kontext | “带上下文编辑” | 接收 reference image + instruction 进行编辑的 Flux 变体。 |

## 生产提示:editar las tuberías muy sensible al retraso

En el L4 de arriba, 10242 de 30 pasos SDXL-Inpaint  necesita 3-4 segundos, volver a añadir a la generación de máscaras SAM (aproximadamente 200 ms) y VAE codificar/decodificar (aproximadamente 500 ms) ⋅ Desde el punto de vista de producción, esto es limitado por TTFT, en lugar de ser limitado por la tracción:batch 1 ̊

- **SAM-H 是慢的那个。**10242 下 SAM-H 约200 ms; SAM-ViT-B 约40 ms,质量损失很小──SAM 2(vídeo) aumentará el tiempo dimensionar la distribución; no lo uses en edición de gráficos únicos──
- **能跳过 encode 就跳过。** `pipe.image_processor.preprocess(img)`Se puede codificar hasta los latences. Si tienes los latences generados una vez más, puedes hacerlo directamente.`latents=...`传入, saltó una vez VAE codificar.
- **Mask dilation 也影响吞吐。**La mayor parte del cálculo del paso hacia adelante de U-Net se desperdicia.`diffusers`de la `StableDiffusionInpaintPipeline`无论如何都会运行完整 U-Net; sólo un diseño de 9 canales puede utilizarse en la computación enmascarada.
- **Flux-Kontext 是 2025 年的答案。**¿ Qué ?`(source_image, instruction)`Hacer un solo pase hacia adelante: no hay máscara única, no hay barrido de ruido SDEdit. En H100 arriba aproximadamente 1,5 segundos completar una edición.

## 延伸阅读

- [Lugmayr et al. (2022). RePaint: Inpainting using Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2201.09865) 无需训练的涂料──
- [Meng et al. (2022). SDEdit: Guided Image Synthesis and Editing with Stochastic Differential Equations](https://arxiv.org/abs/2108.01073) SDEdit。
- [Brooks, Holynski, Efros (2023). InstructPix2Pix](https://arxiv.org/abs/2211.09800) 文本指令编辑。
- [Kirillov et al. (2023). Segment Anything](https://arxiv.org/abs/2304.02643)SAM, máscara.
- [Ravi et al. (2024). SAM 2: Segment Anything in Images and Videos](https://arxiv.org/abs/2408.00714) video SAM。
- [Hertz et al. (2022). Prompt-to-Prompt Image Editing with Cross-Attention Control](https://arxiv.org/abs/2208.01626) Atención 层级编辑。
- [Black Forest Labs (2024). Flux.1-Fill and Flux.1-Kontext](https://blackforestlabs.ai/flux-1-tools/) 2024 herramientas
