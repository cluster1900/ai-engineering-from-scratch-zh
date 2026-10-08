# Difusión latente y difusión estable

> Rombach et al. (2022) observan que para generar una imagen no se necesita toda la dimensión de 786k, se necesita suficiente para capturar la dimensión de la estructura de la lengua, así como un decodificador único para procesar el resto del espacio latente de VAE.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 02 (VAE), Phase 8 · 06 (DDPM), Phase 7 · 09 (ViT)
**Time:** ~75 minutes

##  problemas

5122 de la difusión de espacio-pixel significa que U-Net debe estar en forma`[B, 3, 512, 512]`Para una U-Net de 500M-param, cada paso de análisis es de aproximadamente 100 GFLOPS.

Estos FLOPs se gastan mucho en la transmisión de detalles no importantes a la red, es decir, aquellos que tienen VAE perdidos en el que se puede comprimir a la alta frecuencia de las estructuras. La idea de Rombach es: primero entrenar una vez VAE, primero entrenar una vez VAE, luego terminar, y luego ejecutar completamente en el espacio latente de 4 canales 64×64, luego ejecutar en el segundo nivel.

Esto es la difusión estable 配方──SD 1.x / 2.x Usar una 860M U-Net 处理 `64×64×4`Las redes de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de datos de la red de datos de datos de la red de datos de datos de la red de datos de datos de datos de la red de datos de datos de datos de la red de datos de datos de datos de datos de la red de datos de datos de datos de datos de la red de datos de datos de datos de datos de la red de datos de datos de datos de la red de datos de datos de datos de datos de datos de la red de datos de datos de datos de datos de datos de datos de la red de datos de datos de datos de datos de datos de datos de datos de la red de datos de datos de datos de datos de datos de datos de datos de datos de la red de datos de datos de datos de datos de datos de datos de datos de datos de la red de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de la red de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de la red de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de de de de datos de datos de de de datos de datos de datos de de de datos de datos de de de`128×128×4`,SD3 Utilizando el flujo de combinación de Transformador de Difusión (DiT)  sustituyó U-Net──Flux.1-dev (Black Forest Labs, 2024)  publicó un DiT-MMDiT de 12B-parámetro── todos funcionan en el mismo dos etapas de la base.

## 概念

![Latent diffusion: VAE compression + diffusion in latent space](../assets/latent-diffusion.svg)

**两个阶段，分别训练。**

1. **Stage 1 — VAE.**Encodificador`E(x) → z`, decodificador `D(z) → x` objetivo de compresión: cada espacio轴下采样 8×, reajuste canal, hacer el tamaño total latente 约为 pixel count 的 1/16──Loss = reconstrucción (L1 + LPIPS perceptual) + KL(权重很小,使 `z`No será forzado a hacer demasiado Gaussian, porque no necesitamos de él.`z`Hacer un ejemplo preciso) ∼ normalmente también se acompaña a la pérdida adversaria  entrenamiento, dejar decodificar  imágenes salientes  ∼

2. **Stage 2 — 在 `z` 上做 diffusion。**¿ Qué ?`z = E(x_real)`Cuando se le da información, entrenan a una U-Net o a una DiT para denunciar.`z_t`◊推理时: a través de la difusión 采样 `z_0`, entonces`x = D(z_0)`¿Qué es eso?

**文本 conditioning。**También hay dos componentes extra. Un encoder de texto de SD 1.x con CLIP-L, SD 2/XL con CLIP-L+OpenCLIP-G, SD3 y Flux con T5-XXL)`[Q = image features, K = V = text tokens]`Los tokens son la única forma de influir en el texto de las imágenes.

**Loss Function 与 Lesson 06 完全相同。**También es el ruido 上 hacer DDPM / flujo de coincidencia MSE.

## 架构变体 (difusión de la estructura)

| Model | Year | Backbone | Latent shape | Text encoder | Params |
|-------|------|----------|--------------|--------------|--------|
| SD 1.5 | 2022 | U-Net | 64×64×4 | CLIP-L (77 tokens) | 860M |
| SD 2.1 | 2022 | U-Net | 64×64×4 | OpenCLIP-H | 865M |
| SDXL | 2023 | U-Net + refiner | 128×128×4 | CLIP-L + OpenCLIP-G | 2.6B + 6.6B |
| SDXL-Turbo | 2023 | Distilled | 128×128×4 | same | 1-4 step sampling |
| SD3 | 2024 | MMDiT (multimodal DiT) | 128×128×16 | T5-XXL + CLIP-L + CLIP-G | 2B / 8B |
| Flux.1-dev | 2024 | MMDiT | 128×128×16 | T5-XXL + CLIP-L | 12B |
| Flux.1-schnell | 2024 | MMDiT distilled | 128×128×16 | T5-XXL + CLIP-L | 12B, 1-4 step |

趋势是: utilizar DiT(作用于变化器的潜伏补丁) sustituir U-Net, ampliar el codificador de texto(T5 在快速遵守上胜过CLIP), aumentar los canales latente(4 → 16 带来更多细节余量)


```figure
noise-schedule
```

## Construirlo

`code/main.py`Colocar un juguete 1-D VAE(encoder de identidad + decodificador, solo para la demostración; verdadero VAE 会是 conv net) superado en la DDPM de la Lección 06 , y a través de una guía sin clasificador 加入类条件化── muestra la misma pérdida de difusión 无论运行在原始 1-D 值上,还是运行在加密值上都有效,这就是关键洞见──

### 步骤 1: codificador/decodificador

```python
def encode(x):    return x * 0.5          # toy "compression" to smaller scale
def decode(z):    return z * 2.0
```

El verdadero VAE tiene el peso de la formación. Para el propósito de la enseñanza, esta línea de mapeo ya es suficiente para explicar la difusión puede estar en`z`Por lo tanto, no se preocupa por el espacio de datos original.

### Paso 2: en`z`-espacio en el medio de la difusión

Los datos de la red que se ven son similares a los datos de la lección 06`z = E(x)`◊ En el caso de la`z_0`后, usar `D(z_0)`Descifrado

### 步骤 3: Guía sin clasificador

Durante el entrenamiento, el 10% del tiempo se deshace de la etiqueta de clase (en sustitución de la etiqueta de la clase)`ε_cond`Y `ε_uncond`, y luego:

```python
eps_cfg = (1 + w) * eps_cond - w * eps_uncond
```

`w = 0`= 无指导(完全多样性),`w = 3`= 默认值,`w = 7+`= 和 / 过化。

### 步骤 4: 文本 condicionamiento(概念,不是代码)

Colocar etiqueta de clase 替换为结 text encoder 的输出──通过跨重点 把文本嵌入 输入 U-Net:

```python
h = h + CrossAttention(Q=h, K=text_embed, V=text_embed)
```

Esta es la única diferencia sustancial entre el modelo de difusión condicional de clase y la difusión estable.

## 陷

- **VAE-scale mismatch。**SD 1.x VAEs en codificación 后会应用一个缩放常数(`scaling_factor ≈ 0.18215`(..) olvidar que U-Net en el área de diferencia grave de errores latente en el entrenamiento.
- **Text encoder silently wrong。**SD3 需要带 >=128 tokens of T5-XXL,fallback till only CLIP 会有损──始终检查 `use_t5=True`, de lo contrario, la fidelidad se desmorona.
- **混用 latent spaces。**SDXL、SD3、Flux usan diferentes VAEs― en los latentes SDXL  上训练的LoRA 不能用于SD3―Hugging Face difusores 0.30+ 会拒加载不匹配的检查点―
- **CFG too high。** `w > 10`Se generaron imágenes de la variedad y se adaptaron rápidamente a la variedad.`w = 3-7`¿Qué es eso?
- **Negative prompts leaking。**El mensaje negativo va a ser nulo; el mensaje negativo llenado va a ser`ε_uncond` Estas dos no son iguales; algunas tuberías 会静默默认使用 null──

## Usalo

Producción de 2026 años:

| Target | Recommended backbone |
|--------|----------------------|
| 窄领域、配对数据、从零训练模型 | SDXL fine-tune (LoRA / full) — 最快交付 |
| 开放域 text-to-image，开放权重 | Flux.1-dev (12B, Apache / non-commercial) 或 SD3.5-Large |
| 最快推理，开放权重 | Flux.1-schnell (1-4 step, Apache) 或 SDXL-Lightning |
| 最佳 prompt adherence，托管服务 | GPT-Image / DALL-E 3 (still), Midjourney v7, Imagen 4 |
| 编辑工作流 | Flux.1-Kontext (Dec 2024) — 原生接受 image + text |
| 研究、baseline | SD 1.5 — 古老但研究充分 |

##  entregarlo

保存 `outputs/skill-sd-prompter.md` Habilidad de recibir un texto de control + 目标风格,并输出:modelo + punto de control, escala CFG, muestreo, respuesta negativa, resolución, combinación de control de red/IP-adapter, así como una lista de verificación de calidad a pasos.

##  ejercicios

1. **Easy.**Uso de la guía `w ∈ {0, 1, 3, 7, 15}`运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` registrar la muestra media de cada clase  en qué `w`¿La clase significa que se alejará del valor medio de los datos reales?
2. **Medium.**¿Cuál es la calidad de la muestra? ¿Cuál es la calidad de la muestra?
3. **Hard.**Utiliza los difusores  Construye una verdadera difusión estable                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               `sdxl-base`, con CFG=7 运行 30 个 Euler pasos,并计时――然后切换到 `sdxl-turbo`, con 4 pasos 和 CFG=0── el mismo objeto, diferente calidad, describe qué cambios ocurrieron y las causas──

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| First stage | “The VAE” | 训练好的 encoder/decoder 对；把 512² 压缩到 64²。 |
| Second stage | “The U-Net” | latent space 上的 diffusion model。 |
| CFG | “Guidance scale” | `(1+w)·ε_cond - w·ε_uncond`；调节 conditioning strength。 |
| Null token | “Empty prompt embed” | 用于 `ε_uncond` 的 unconditional embed。 |
| Cross-attention | “How text gets in” | 每个 U-Net block 都以 text tokens 作为 K 和 V 进行 attention。 |
| DiT | “Diffusion Transformer” | 用作用于 latent patches 的 transformer 替换 U-Net；扩展性更好。 |
| MMDiT | “Multi-modal DiT” | SD3 的架构：带 joint attention 的文本与图像流。 |
| VAE scaling factor | “Magic number” | 将 latents 除以约 5.4，使 diffusion 在 unit-variance 空间中运行。 |

## Nombre de producción: en 8GB  consumo de GPU de arriba de la operación Flux-12B

参考流集是经典的我有一张消费级GPU,能交付吗?配方──技巧就是把生产推理文献列出的同一个三旋配方应用到扩散 DiT:

1. **Staggered loading。**Flux tiene tres no necesita simultáneamente en la red de VRAM:T5-XXL codificador de texto ((fp32 下约 10 GB) 、CLIP-L(小) 、12B MMDiT, así como VAE。 primero codificar rápido,* borrar* codificadores, carga DiT, denoise,* borrar* DiT, carga VAE, decodificar。 consumo grado 8GB GPUs 一次只能容纳一个阶段。
2. **通过 bitsandbytes 做 4-bit quantization。**En T5 codificador y DiT 上都使用 `BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.bfloat16)` la memoria se redujo 8 veces, según los puntos de referencia de Aritra, la calidad del texto a la imagen se redujo casi de forma inalcanzable.
3. **CPU offload。** `pipe.enable_model_cpu_offload()`Se puede pasar por cada paso hacia adelante en el proceso de entrada automático entre los módulos de intercambio entre CPU y GPU.

El registro es:`10 GB T5 / 8 = 1.25 GB`cuantificado,`12 B params × 0.5 bytes = ~6 GB`Cuantificado DiT, recarga activaciones, utiliza la frase de stas00, esto es la extrema situación de la inferencia TP=1: no hay paralelismo de modelo, la cuantificación máxima.

## 延伸阅读

- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) Difusión estable。
- [Podell et al. (2023). SDXL: Improving Latent Diffusion Models for High-Resolution Image Synthesis](https://arxiv.org/abs/2307.01952) SDXL。
- [Peebles & Xie (2023). Scalable Diffusion Models with Transformers (DiT)](https://arxiv.org/abs/2212.09748)¿Qué es esto?
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) SD3, MMDiT──
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598) CFG。
- [Labs (2024). Flux.1 — Black Forest Labs announcement](https://blackforestlabs.ai/announcing-black-forest-labs/) Flux.1 系列──
- [Hugging Face Diffusers docs](https://huggingface.co/docs/diffusers/index)                                                                                                                                                                                                                                                              
