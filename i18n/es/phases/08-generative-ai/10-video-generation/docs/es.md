# 视频生成

> 图像是一个2D tensor──视频是一个3D tensor──理论相同;compute 难度高出 10-100x──OpenAI的 Sora(2024年 2月) demostró que es posible── hasta 2026年,Veo 2、Kling 1.5、Runway Gen-3、Pika 2.0 和 WAN 2.2 已能从文本生成 1080p的生产级视频,而开权重堆(CogVideoX、HunyuanVideo、Mochi-1、WAN 2.2)落后约12个月──

**Type:** Build
**Languages:** Python
**先修要求:**Fase 8 · 07 (difusión latente), Fase 7 · 09 (ViT), Fase 8 · 06 (DDPM)
**Time:** ~45 minutes

##  problemas

Un video de 10 segundos,1080p、24fps contiene 240 , cada  1920×1080×3 píxeles── los datos originales de cada clip son de aproximadamente 1.5 GB── difusión en el espacio de píxeles es imposible── necesitas:

1. **时空压缩。**Una VAE, en lugar de un video, codifica los parches espaciales y temporales en un proceso.
2. **时间一致性。**Hay que compartir contenido en segundos, iluminación y identidad de los objetos.
3. **Compute budget。**En el mismo tamaño del modelo, el video entraña más que la imagen 10-100 veces.
4. **Conditioning。**文本、图像(第一)、音频或另一个视频──la mayoría de los modelos de producción aceptan estas cuatro clases──

 resolver este problema                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          **Diffusion Transformer (DiT)**, en un enorme ️pronto capción video) DATAKET ️                                                                                                                                                                                                                                                   

## 概念

![Video diffusion: patchify, DiT, decode](../assets/video-generation.svg)

### Enlazar

Uso de 3D VAE( aprender hasta de tiempo y aire comprimido) codificación de vídeo―latente de forma es `[T_latent, H_latent, W_latent, C_latent]`                                                                                                                                                                                                                                                              `[t_p, h_p, w_p]`Para el modelo de Sora,`t_p = 1`(por parches) o`t_p = 2`(每两) ⋅ una 10 segundos 1080p 视频会压缩成约20,000-100,000 块贴子⋅

### DiT espacio-temporal

Una transformación 处理平化的 patch 序列── cada parche tiene una incorporación posicional 3D(tiempo + y + x)──Attención normalmente se factorizan:

- **Spatial attention**En cada uno de los parches se lleva a cabo en el interior.
- **Temporal attention**En el mismo espacio de la posición de transcurrimiento.
- **Full 3D attention**昂贵 16-100x; sólo en bajo resolución o en estudios.

### 文本 condicionamiento

Utiliza un codificador de texto grande  realizar Atención cruzada(Sora utiliza T5-XXL,CogVideoX-5B utiliza T5-XXL)  Prompts 很重要,Sora's training集包含 GPT 生成的密集重写,平均每片200 tokens──

###  entrenamiento

En latentes espaciotemporales 上使用标准扩散损失 (ε 或 v prediction)  datos: vídeo web + 约100M clips curados + capciones de texto sintéticas──computación: incluso en pequeñas investigaciones se necesitan más de 10.000 horas de GPU; en escala grande 则是100.000+──

## 2026 años de producción

| Model | Date | Max duration | Max res | Open weights? | Notable |
|-------|------|--------------|---------|---------------|---------|
| Sora (OpenAI) | 2024-02 | 60s | 1080p | No | 第一个在 scale 下展示 world simulator 属性的模型 |
| Sora Turbo | 2024-12 | 20s | 1080p | No | 推理快 5x 的生产版 Sora |
| Veo 2 (Google) | 2024-12 | 8s | 4K | No | 2025 年最高质量 + physics |
| Veo 3 | 2025 Q3 | 15s | 4K | No | 原生音频和更强的相机控制 |
| Kling 1.5 / 2.1 (Kuaishou) | 2024-2025 | 10s | 1080p | No | 2025 Q1 最好的人体运动 |
| Runway Gen-3 Alpha | 2024-06 | 10s | 768p | No | 在其之上的专业视频工具 |
| Pika 2.0 | 2024-10 | 5s | 1080p | No | 最强角色一致性 |
| CogVideoX (THUDM) | 2024 | 10s | 720p | Yes (2B, 5B) | 第一个开放的 5B-scale 视频模型 |
| HunyuanVideo (Tencent) | 2024-12 | 5s | 720p | Yes (13B) | 2024 年末开放 SOTA |
| Mochi-1 (Genmo) | 2024-10 | 5.4s | 480p | Yes (10B) | 许可证最宽松 |
| WAN 2.2 (Alibaba) | 2025-07 | 5s | 720p | Yes | 2025 年中最强开放模型 |

Pesos abiertos en el campo de vídeo reducen la velocidad de la diferencia en el campo de imágenes más rápido: hasta 2026 años, HunyuanVideo + WAN 2.2 LoRAs  ya han impulsado la mayoría de los flujos de trabajo de código abierto.


```figure
video-diffusion-denoise
```

## Construirlo

`code/main.py`模拟核心的空间时代 DiT 思路:patchify 一个小型合成视频,加入每补丁位置嵌入,并用变压器式注意 在补丁上对整个序列代号――不用 numpy;纯 Python――我们展示了即使在1-D中,当相邻补丁 共享代号和位置嵌入时,也会出现时间一致性――

### Paso 1: parchear un video de 1D sintético

```python
def make_video(T_frames=8, rng=None):
    # a "video" is a sequence of 1-D values following a smooth trajectory
    base = rng.gauss(0, 1)
    return [base + 0.3 * t + rng.gauss(0, 0.1) for t in range(T_frames)]
```

### Paso 2: Embedado de cada posición

```python
def pos_embed(t, dim):
    return sinusoidal(t, dim)
```

### Paso 3: denoiser 看到整个序列

Nuestra red de micro-tipo no denota cada uno de ellos, sino que combina todos los valores + sus posiciones, y predice todos los ruidos.

### 步骤 4: 时间一致性测试

訓練後,サンプル 一个视频──测量frame-to-frame delta──如果模型学到了时间结构,deltas 会比独立样本 每一更小──

## 陷

- **独立逐帧 sampling = flicker。**Si se aplica a cada una de las diferentes aplicaciones de difusión de imágenes, se puede encontrar un parpadeo, porque el ruido de cada una es independiente.
- **朴素 3D attention = OOM。**Para un 10 segundos 1080p latente hacer la atención 3D completa necesita miles de millones de veces de operación.
- **数据 captioning 比规模更重要。**En comparación con el trabajo anterior, la principal actualización es con aproximadamente 10 veces más detallado de los títulos  entrenamiento  GPT-4 重新标注片) ⋅ OpenAI's技术报告对此说得很明确──
- **First-frame conditioning。**La mayoría de los modelos de producción también aceptan una imagen como la primera.
- **Physics drift。**长 clips(>10s) 会积累细微不一致──Sliding-window generation + keyframe anchoring 会有帮助──

## Usalo

| Use case | 2026 pick |
|----------|-----------|
| 最高质量 text-to-video，hosted | Veo 3 or Sora |
| 可控相机的 cinematic | Runway Gen-3 with motion brushes |
| 跨 clips 的角色一致性 | Pika 2.0 or Kling 2.1 |
| Open weights，快速 fine-tune | WAN 2.2 + LoRA |
| Image-to-video | WAN 2.2-I2V, Kling 2.1 I2V, or Runway |
| Audio-to-video lip sync | Veo 3 (native audio) or a dedicated lip-sync model |
| 视频编辑 | Runway Act-Two, Kling Motion Brush, Flux-Kontext (still-frame) |

En un caso de calidad equivalente, el costo por segundo de vídeo disminuyó 20 veces entre 2024 y 2026.

##  entregarlo

保存 `outputs/skill-video-brief.md`Habilidad de recibir un breve video ((duración, relación de aspecto, estilo, plan de cámara, consistencia del tema, audio),并输出:modelo + alojamiento, emplazamiento de la cámara, descripción del tema, descriptores de movimiento)

##  ejercicios

1. **Easy.**En el`code/main.py`En el caso de los modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de modelos de tipo de tipo de tipo de tipo
2. **Medium.**Añadir una condición de primer marco:将 frame 0 pin 到给定值并 sample 其余部分──测量固定值 如何传播──
3. **Hard.**Utiliza los difusores HuggingFace en la GPU local de la plataforma CogVideoX-2B── en 720p、6 segundos 计时 20 个推理步骤──Profile espacio-temporal atención 以识别瓶──

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Video VAE | "3-D VAE" | 将 `(T, H, W, C)` 压缩为 spatiotemporal latent 的 Encoder。 |
| Patches | "The tokens" | latent 的固定大小 3-D blocks；作为 DiT 的输入。 |
| Factorized attention | "Spatial + temporal" | 先在空间上运行 Attention，再在时间上运行；跳过 full 3-D attention。 |
| Image-to-video (I2V) | "Animate this photo" | 模型接收一张图像 + 文本，并输出从它开始的视频。 |
| Keyframe conditioning | "Anchor frames" | Pin 特定帧来控制视频的 arc。 |
| Motion brush | "Directional hint" | 用户在图像上绘制 motion vectors 的 UI 输入。 |
| Re-captioning | "Dense captions" | 使用 LLM 用详细 prompts 重新标注训练 clips。 |
| Flicker | "Temporal artifact" | Frame-to-frame 不一致；通过 coupled denoising 修复。 |

## 生产说明:latencias de vídeo es memoria-ancho de banda  problema

Un clip de 10 segundos 1080p、24 fps  contiene 240 cuadros × 1920 × 1080 × 3 ≈ 1.5 GB de píxeles originales── atravesado por 4× compresión de vídeo VAE(`2 × spatial × 2 × temporal`) después, latente Cada solicitud es de aproximadamente 100 MB. Lo pasará a través de espacio-temporal DiT  correr 30 pasos  batch 1, cada paso tiene que pasar por HBM  mover alrededor de 3 GB, botellas  es ancho de banda de memoria, en lugar de FLOPs 

Tres botones de producción, todos directamente de la literatura de inferencia de la producción-inferencia capítulo de inferencia:

- **跨 DiT 的 TP。**Modelos de texto a video suelen tener ≥10B parámetros──4 个 H100 上 TP=4 es la configuración estándar; 405B-modelos de clase Utiliza PP=2 × TP=2── cada paso de latencia 随 TP 大致线性下降, hasta que choque sobre todo reducción de la pared──
- **Frame batching = continuous batching。**En el tiempo de generación, el concepto de vídeo es un conjunto de marcos Attención 连接的框架──Continuous batching(en vuelo programación)适用:`t-1`Estoy en el regreso y empiezo a rotear el marco.`t+1`¿Qué es eso?
- **Clip-level prefill cache。**Para la imagen-a-video para decir, el condicionamiento de primer marco  similar a LLM de preempleo de inmediato: calcular una vez, y en el decodificador temporal pasa 中复用── esto en realidad es el video KV-cache──

## 延伸阅读
- [Brooks et al. (2024). Video generation models as world simulators](https://openai.com/index/video-generation-models-as-world-simulators/) Sora 技术报告──
- [Yang et al. (2024). CogVideoX: Text-to-Video Diffusion Models with An Expert Transformer](https://arxiv.org/abs/2408.06072) CogVideoX。
- [Kong et al. (2024). HunyuanVideo: A Systematic Framework for Large Video Generative Models](https://arxiv.org/abs/2412.03603) HunyuanVideo。
- [Genmo (2024). Mochi-1 Technical Report](https://www.genmo.ai/blog/mochi) Mochi-1。
- [Alibaba (2025). WAN 2.2](https://wanvideo.io/) 2025 años 中开放 SOTA。
- [Ho, Salimans, Gritsenko et al. (2022). Video Diffusion Models](https://arxiv.org/abs/2204.03458) 开创性 video difusión 论文──
- [Blattmann et al. (2023). Align your Latents (Video LDM)](https://arxiv.org/abs/2304.08818) Precedente de la difusión de vídeo estable
