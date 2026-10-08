# ControlNet, LoRA y acondicionamiento

> 仅靠文本是一种拙的控制信号――ControlNet 让你克隆一个预训练的扩散模型,并使用深度地图、pose skeleton、scribble或边形图像来引导它──LoRA 让你通过训练1000万参数来调整一个2B参数模型──二者结合,将稳定扩散从玩具变成2026年各机构都在交付图像管道──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 10 (LLMs from Scratch — LoRA 基础)
**Time:** ~75 minutes

##  problemas

 Como "una mujer en vestido rojo paseando un perro por una calle concurrida" Este tipo de solicitud, no dice el modelo perro está en * dónde*、 mujer es lo que * postura*, o de la calle * través de la relación*── el texto sólo puede fijarse aproximadamente un 10% de la información necesaria en una imagen── el resto es información visual, no puede utilizarse para describirla en letras de alta eficacia──

Para cada tipo de señal (positar, profundidad, capacidad, segmentación) desde el zero entrenar un nuevo modelo condicional, el costo es demasiado alto.

También quieres en caso de no volver a entrenar el modelo completo, iglesia modelo nuevo concepto ((tu rostro, tu producto, tu estilo) ・・・ necesitas un pequeño delta de 100x― esto es LoRA, es decir, para insertar adaptadores de bajo rango de pesos de atención existentes―

ControlNet + LoRA + texto = 2026 años de práctica. La mayoría de la producción de la línea de imágenes se encuentra en la base SDXL / SD3 / Flux.

## 概念

![ControlNet clones the encoder; LoRA adds low-rank deltas](../assets/controlnet-lora.svg)

### ControlNet (Zhang et al., 2023)

取一个预训练的SD──*克隆* U-Net的编码器 半边──结原始模型──训练这个克隆版本,让它接受额外的条件输入(边缘,深度,pose)──使用 *zero-convolution* skip connections(初始化为零的1×1 convs,一开始是无运,随后学习 delta) 把克隆版本连接回原始模型的解码器 半边──

```
SD U-Net decoder:   ... ← orig_enc_features + zero_conv(controlnet_enc(condition))
```

El principio de cero-conv significa que ControlNet primero comienza igual a identidad, incluso si el entrenamiento previo no causará daños.

Cada modalidad de ControlNet se utilizará como un pequeño modelo secundario 发布(SDXL 约360M,SD 1.5 约70M)  Puedes deducir 时组组合它们:

```
features += weight_a * control_a(depth) + weight_b * control_b(pose)
```

### Los Estados miembros pueden adoptar medidas de seguridad en el marco de la aplicación de la presente Directiva.

对于模型中任意线性层                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `W ∈ R^{d×d}`, 结 `W`Y añade un delta de bajo rango:

```
W' = W + ΔW,  ΔW = B @ A,  A ∈ R^{r×d},  B ∈ R^{d×r}
```

Entre ellos `r << d` En la atención, el rango 4-16 es el estándar de configuración; en la gravedad, el rango 64-128 es más habitual.`2 · d · r`, en lugar de`d²`  `d=640`La atención de SDXL,`r=16`时每一个适配器 只有 20k参数,而不是 410k,减少了20x──放到整个模型上,一个LoRA通常是20-200MB,而基础是5GB──

En la inferencia, puedes reducir la LORA:`W' = W + α · B @ A`¿Qué es eso?`α = 0.5-1.5`很常见──多个LoRA会加法方式叠加(generalmente se necesita tener en cuenta que se afectan mutuamente de manera no lineal)──

### Adaptador IP (Ye et al., 2023)

Un adaptador muy pequeño, acepta una imagen como condicionamiento, utiliza un codificador de imágenes CLIP para producir tokens de imágenes, y los inyecta con tokens de texto en una sola vez. Cada modelo base tiene aproximadamente 20MB.

##                                                                                                                                                                                                                                                               

| Tool | 它控制什么 | Size | 何时使用 |
|------|------------|------|----------|
| ControlNet | 空间结构（pose、depth、edges） | 70-360MB | 精确 layout、composition |
| LoRA | 风格、主体、概念 | 20-200MB | 个性化、风格 |
| IP-Adapter | 来自 reference image 的风格或主体 | 20MB | 文本无法描述外观 |
| Textual Inversion | 将单个概念作为新 token | 10KB | 旧方案，大多已被 LoRA 替代 |
| DreamBooth | 对主体做 full fine-tune | 2-5GB | 强身份一致性、高计算成本 |
| T2I-Adapter | 更轻量的 ControlNet 替代方案 | 70MB | Edge devices、inference budget |

ControlNet ≈ 空间──LoRA ≈ 语义──两者一起使用──


```figure
v4-controlnet-zero
```

## Construirlo

`code/main.py`En la 1D arriba se simula estos dos mecanismos:

1. **LoRA。**Una capa lineal preentrenada .`W`Entrenando a un de bajo rango.`B @ A`,使 `W + BA`匹配目标 capa lineal── muestra `r = 1`足以完美学习 una corrección de rango 1。

2. **ControlNet-lite。**Una predictor base congelada, así como una lectura extra señal de red lateral. La salida de la red lateral es controlada por una puerta de escala de aprendizaje inicialmente a cero.

### Paso 1: Matemáticas de la LORA

```python
def lora(W, A, B, x, alpha=1.0):
    # W is frozen; A, B are the trainable low-rank factors.
    return [W[i][j] * x[j] for i, j in ...] + alpha * (B @ (A @ x))
```

### 步骤 2: red lateral de cero-init

```python
side_out = control_net(x, condition)
gated = gate * side_out  # gate initialized to 0
h = base(x) + gated
```

En el paso 0, la salida es igual a la base.`gate`, no se producirá desastres.

## 常见坑

- **LoRA 过度缩放。** `α = 2`O `α = 3`Es una forma habitual de hacer que sea más fuerte, pero puede producir una excesiva formalización o una salida dañada.`α ≤ 1.5`¿Qué es eso?
- **ControlNet weight 冲突。**Con el mismo tiempo de uso peso 1.0 de Pose ControlNet y peso 1.0 de Depth ControlNet normalmente se superará.
- **LoRA 用在错误的 base 上。**SDXL LoRA en SD 1.5 上会静默 no-op, debido a que las dimensiones de atención no coinciden.
- **Textual Inversion 漂移。**En un puesto de control, las fichas de entrenamiento, cambiadas a otro puesto de control, se desplazan gravemente.
- **LoRA weight-merging 和存储。**Puedes poner LoRA a la base de los modelos de peso, para obtener una inferencia más rápida, pero perderá en el tiempo de ejecución  reducido `α`De capacidad... mantener dos versiones...

## Usalo

| Goal | 2026 pipeline |
|------|---------------|
| 复现某个品牌的艺术风格 | 在约 ~30 张精选图像上训练的 rank 32 LoRA |
| 把我的脸放进生成图像 | DreamBooth 或 LoRA + IP-Adapter-FaceID |
| 指定 pose + prompt | ControlNet-Openpose + SDXL + text |
| Depth-aware composition | ControlNet-Depth + SD3 |
| Reference + prompt | IP-Adapter + text |
| 精确 layout | ControlNet-Scribble 或 ControlNet-Canny |
| 替换背景 | ControlNet-Seg + Inpainting（Lesson 09） |
| 快速 1-step 风格 | SDXL-Turbo 上的 LCM-LoRA |

##  entregarlo

保存 `outputs/skill-sd-toolkit-composer.md`△ este habilidad 接收一个任务(activos de entrada:prompto、可选参考图片、可选姿、可选深度、可选拼写),并输出工具堆、重量 和可复现的种子协议──

##  ejercicios

1. **Easy。**En el`code/main.py`En el ranking de la LoRA`r`¿De 1 a 4? ¿Qué rango puede exactamente coincidir con el delta objetivo de rango 2?
2. **Medium。**En dos transformaciones de objetivo, entrenar dos LoRA independientes. ¿Los cargará juntos y mostrará su interacción adicional? ¿Cuándo esta interacción se romperá?
3. **Hard。**Uso de difusores 叠加:SDXL-base + Canny-ControlNet(peso 0.8) + 一个风格 LoRA(α 0.8) + IP-Adapter(peso 0.6)。Con el peso de la pila 变化, medir FID-vs-prompt-adhesión-compromisor。

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 它实际意味着什么 |
|------|------------|------------------|
| ControlNet | "Spatial control" | 克隆 encoder + zero-conv skips；读取一张 conditioning image。 |
| Zero convolution | "Starts as identity" | 初始化为零的 1×1 conv；ControlNet 一开始是 no-op。 |
| LoRA | "Low-rank adapter" | `W + B @ A`，`r << d`；比 full fine-tune 少 100x 参数。 |
| rank r | "The knob" | LoRA 压缩；典型值为 4-16，重度个性化使用 64+。 |
| α | "LoRA strength" | LoRA delta 的 runtime scaling。 |
| IP-Adapter | "Reference image" | 通过 CLIP-image tokens 实现的小型 image-conditioning adapter。 |
| DreamBooth | "Full subject fine-tune" | 在约 ~30 张主体图像上训练完整模型。 |
| Textual Inversion | "New token" | 只学习一个新的 word embedding；旧方案，大多已被替代。 |

## 生产说明:Swaps de LORA, ControlNet lanes, servicio para varios inquilinos

Un verdadero SaaS de texto a imagen se encuentra en el mismo punto de control de base, en el que se encuentran cientos de LORA y diez ControlNet.

- **Hot-swap LoRAs，不要 merge。**¿ Qué ?`W' = W + α·B·A`Se fusionan a la base, se puede hacer una inferencia por paso quizás ~ 3-5%, pero se concluye `α`Y base: 把 LoRA 作为级-r deltas 热加载在VRAM中; difusores 暴露了 `pipe.load_lora_weights()`¿ Qué es eso ?`pipe.set_adapters([...], adapter_weights=[...])`, se puede utilizar a pedido para activar.`2 · d · r · num_layers`Peso, es decir MB 级、亚秒级。
- **ControlNet 作为第二条 attention lane。**                                                                                                                                                                                                                                                              
- **Quantized LoRAs 也适用。**Si se mide la base (véase Lección 07, Flujo en 8GB), LoRA delta también puede hacerse a 8 bits o 4 bits.

Flux-específico: Niels de Flux-en-8GB portátil se basará quantificar a 4 bits; en la base cuantizada arriba superposición estilo LoRA(`pipe.load_lora_weights("user/style-lora")`),并使用 `weight_name="pytorch_lora_weights.safetensors"`, todavía puede trabajar. Esta es la receta de entrega de la mayoría de las agencias SaaS de 2026

## 延伸阅读

- [Zhang, Rao, Agrawala (2023). Adding Conditional Control to Text-to-Image Diffusion Models](https://arxiv.org/abs/2302.05543) ControlNet。
- [Hu et al. (2021). LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) LoRA( inicialmente se utiliza en LLM; posteriormente se transfiere a la difusión)
- [Ye et al. (2023). IP-Adapter: Text Compatible Image Prompt Adapter](https://arxiv.org/abs/2308.06721) Adaptador IP。
- [Mou et al. (2023). T2I-Adapter: Learning Adapters to Dig Out More Controllable Ability](https://arxiv.org/abs/2302.08453) Alternativa más ligera de ControlNet
- [Ruiz et al. (2023). DreamBooth: Fine Tuning Text-to-Image Diffusion Models for Subject-Driven Generation](https://arxiv.org/abs/2208.12242) DreamBooth。
- [HuggingFace Diffusers — ControlNet / LoRA / IP-Adapter docs](https://huggingface.co/docs/diffusers/training/controlnet) 参考管道──
