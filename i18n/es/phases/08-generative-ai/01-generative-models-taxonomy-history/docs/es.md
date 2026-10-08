# Modelos generacionales  分类法与历史

> Cada modelo de imagen, modelo de texto, modelo de video y modelo 3D pertenecen a una de las cinco categorías.

**类型:**El aprendizaje
**语言:**Python
**先修要求:**Fase 2 (Fundamentos del aprendizaje en profundidad), Fase 3 (Centro de aprendizaje profundo), Fase 7 · 14 (Transformadores)
**时间:**- 45 minutos

##  problemas

Modelo generativo hacer una cosa: determinar de una distribución desconocida`p_data(x)`extracted training sample, output looks like from the same distribution new sample── personas faces、 sentencias、 MIDI 文件、 proteína estructura si lo miras con los ojos, son todos los mismos problemas

Es difícil de conseguir.`p_data`Existe en un espacio con millones de dimensiones. Un modelo RGB de 512x512 tiene aproximadamente 786k dimensiones. El modelo se encuentra en el interior del espacio con un pequeño variedad de elementos, y es posible que solo haya 10M de ellos. La densidad de la búsqueda de soluciones es imposible.

En los últimos 12 años, cinco familias han sobrevivido. Comprendiendo lo que cada familia hace, te dirá por qué ha triunfado en ciertas tareas y por qué se derrumbará en otras.

## 概念

![Generative models 的五个家族 — 按它们建模的对象分类](../assets/taxonomy.svg)

**1. Explicit density, tractable。**¿ Qué ?`log p(x)`写成一个你真的能计算的求和──Modelos autoregresivos (PixelCNN, WaveNet, GPT) se llevarán a cabo `p(x) = ∏ p(x_i | x_<i)`因式分解──Normalizaciones de flujos (NVP real, Glow)`p(x)`构成一个简单基础 分布的可逆变换――优点:精确概率,干净的训练 Loss──缺点:autoregressive 推理是顺序的(长序列会慢),流动 需要可逆架构(架构限制很强)。

**2. Explicit density, approximate。**Desde abajo`log p(x)`(ELBO)并优化这个界限──VAEs (Kingma 2013) 使用带变化后的编码-decoder──Diffusion models (DDPM, Ho 2020) 训练一个指标,它隐式优化加权 ELBO──Diffusion 是 2026 年图像、视频和 3D 的主导脊柱──

**3. Implicit density。** completamente saltar la densidad; aprender un generador de ejemplos de generación `G(z)`, y un juez de verdad falso discriminador .`D(x)`GANs (Goodfellow 2014) ・推理很快(once forward pass), pero el proceso de entrenamiento se ha destacado en el mundo de la modalidad.

**4. Score-based / continuous-time。**直接学习 registro-densidad de Gradiente `∇_x log p(x)`(score) ――Song & Ermon (2019)  indicaron que la coincidencia de puntajes  将推广为一个SDE──Flow matching (Lipman 2023) ⇒ es el punto de calor del año 2024-2026:无需模拟的训练、更直的路径、比 DDPM 快 4-10 倍的采样──Stable Diffusion 3、Flux、AudioCraft 2 都使用流量匹配──

**5. 基于 Token 的离散 codes 上的 autoregressive。**Utilice VQ-VAE o cuantificador residual para comprimir los datos en un segmento de tokens dispersos más cortos, y luego utilice el transformador para la secuencia de tokens 建模.

## 简史

| 年份 | 模型 | 为什么重要 |
|------|-------|-----------------|
| 2013 | VAE (Kingma) | 第一个拥有可用训练 Loss 的 deep generative model。 |
| 2014 | GAN (Goodfellow) | Implicit density，没有 likelihood，却能产生惊人锐利的样本。 |
| 2015 | DRAW, PixelCNN | 顺序图像生成。 |
| 2017 | Glow, RealNVP | 可逆 flows；通过 depth 获得精确 likelihood。 |
| 2017 | Progressive GAN | 第一个 megapixel 人脸。 |
| 2019 | StyleGAN / StyleGAN2 | 在人脸这个单一领域中，photorealistic faces 依然很难被击败。 |
| 2020 | DDPM (Ho) | Diffusion 变得实用。 |
| 2021 | CLIP, DALL-E 1, VQGAN | Text-to-image 进入主流。 |
| 2022 | Imagen, Stable Diffusion 1, DALL-E 2 | Latent diffusion + text conditioning = 商品化。 |
| 2022 | ControlNet, LoRA | 对 pretrained diffusion 进行精细控制。 |
| 2023 | SDXL, Midjourney v5, Flow matching | 规模 + 更好的训练动态。 |
| 2024 | Sora, Stable Diffusion 3, Flux.1 | Video diffusion；flow matching 胜出。 |
| 2025 | Veo 2, Kling 1.5, Runway Gen-3, Nano Banana | 生产级视频。 |
| 2026 | Consistency + Rectified Flow | 从 diffusion backbones 进行一步采样。 |

## 五问分诊

Cuando aparezca un nuevo modelo generativo, antes de responder a estas cinco preguntas,

1. **建模的是什么？**¿Pixels, latentes, tokens separados, Gaussians 3D, majas, formas de onda?
2. **Density 是 explicit 还是 implicit？**¿Eran los que escribieron?`log p(x)`¿ Qué ?
3. **Sampling：one-shot 还是 iterative？**Iterativo significa "tender más lento"; un tiro normalmente significa adversario o destilado.
4. **Conditioning：unconditional、class、text、image、pose？**Esto decide la pérdida y la construcción.
5. **Evaluation：FID、CLIP score、IS、human preference、task accuracy？**Cada uno tiene modos de fracaso conocidos.

En cada clase de esta fase, responderás de nuevo a estas cinco preguntas. Al final, se convertirán en tu condición de reflejo.


```figure
autoencoder-bottleneck
```

## Construirlo

El código de este curso es de una forma de visualización de la clase de ligero: utilizar tres tipos de métodos de juego: la densidad del núcleo, el histograma de separación, y el generador de GAN-ish de la muestra más cercana) para adaptarse a una mezcla de Gaussíes en 1D de la muestra, de modo que pueda ver la diferencia entre la densidad explícita e implícita en un problema de una pantalla impresora.

运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`Se extrae de una mezcla gaussiana de dos picos en 2000 muestras, y luego se imprime:

```
explicit density (histogram): p(x in [-0.5, 0.5]) ≈ 0.38
approximate density (KDE):     p(x in [-0.5, 0.5]) ≈ 0.41
implicit (nearest-sample gen): 20 new samples printed, no p(x)
```

Nota: los dos primeros te permiten preguntar ¿hay más posibilidades de esto?

## Usalo

2026 años, ¿qué familia se adapte a qué tarea?

| 任务 | 最佳家族 | 原因 |
|------|-------------|-----|
| Photoreal faces，窄领域 | StyleGAN 2/3 | 仍然最锐利，推理最快。 |
| 通用 text-to-image | Latent diffusion + flow matching | SD3, Flux.1, DALL-E 3。 |
| 快速 text-to-image | Rectified flow + distillation | SDXL-Turbo, SD3-Turbo, LCM。 |
| Text-to-video | Diffusion Transformer + flow matching | Sora, Veo 2, Kling。 |
| Speech + music | Token-based AR (AudioLM, VALL-E, MusicGen) 或 flow matching (AudioCraft 2) | 离散 tokens 扩展成本低。 |
| 3D scenes | Gaussian Splatting fit, diffusion prior | 3D-GS 用于重建，diffusion 用于 novel-view。 |
| Density estimation（不采样） | Flows | 唯一拥有精确 `log p(x)` 的家族。 |
| Simulation / physics | Flow matching, score SDE | 直线路径，平滑 Vector fields。 |

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-model-chooser.md`¿Qué es eso?

Esta habilidad  recibir una tarea descripción并输出:(1) Para usar ¿cuál es la familia,(2) Tres opciones abiertas y tres hosted 选项排列表,(3) Usted debe estar preocupado por el posible modo de fracaso, y (4) 计算/时间预算──

##  ejercicios

1. **Easy。**Para los siguientes cinco productos, identificando su familia y la columna vertebral:Imagen ChatGPT, Midjourney v7 ̊Sora, Runway Gen-3 ̊ElevenLabs‬, evidencia debe provenir de un informe de tecnología pública‬
2. **Medium。**Tu mañana debes leer el artículo que afirma que el uso de la difusión es 快 100 倍──写下三个问题, para examinar esta aceleración en el acondicionamiento y la alta resolución 下是否仍然存在──
3. **Hard。**选择一个你关心的领域 (例如蛋白质结构,CAD,分子轨迹) ⋅ para este campo actual SOTA 模型 responder a cinco preguntas,并勾勒一个更好的模型会改变什么──

## 关键术语: "El hombre es un hombre"

| 术语 | 人们怎么说 | 它实际是什么意思 |
|------|-----------------|-----------------------|
| Generative model | “它会生成新东西” | 学习 `p_data(x)` 的 sampler，可选地暴露 `log p(x)`。 |
| Explicit density | “你可以计算它” | 模型提供 closed-form 或 tractable 的 `log p(x)`。 |
| Implicit density | “GAN-style” | 只有 sampler——无法计算给定点的 `p(x)`。 |
| ELBO | “Evidence lower bound” | `log p(x)` 的一个 tractable 下界；VAEs 和 diffusion 会优化它。 |
| Score | “log-density 的 Gradient” | `∇_x log p(x)`；diffusion 和 SDE models 学习这个 field。 |
| Manifold hypothesis | “数据存在于一个表面上” | 高维数据集中在低维 manifold 上；这就是 dimensionality reduction 有效的原因。 |
| Autoregressive | “预测下一个片段” | 将 joint 因式分解为 conditionals 的乘积。 |
| Latent | “压缩 code” | 一种低维表示，decoder 可以从中重建输入。 |

## Productos de la industria de la producción: 5 familias, 5 tipos de formulación

Cada familia se proyecta en un servidor de inferencias diferente.

- **Autoregressive（类别 1 和 5）。**顺序 decode 主导 latencia;KV-cache、continuous batching 和 speculative decoding 都可以直接应用──
- **VAE / diffusion / flow-matching（类别 2 和 4）。**Aquí no hay decodificación en el sentido de LLM.`num_steps × step_cost`, y`step_cost`Es en resolución latente completa. Un transformador o U-Net hacia adelante.
- **GAN（类别 3）。**Una vez más, no hay cronograma, no hay caché de KV, no hay tiempo de espera total, es por eso que StyleGAN sigue ganando en el campo de la UX.

Cuando veas en el resumen de un artículo más rápido que la difusión, traducelo en menos pasos × costo de los mismos pasos × costo de los mismos pasos × costo de los pasos más barato.

## 延伸阅读

- [Goodfellow et al. (2014). Generative Adversarial Nets](https://arxiv.org/abs/1406.2661) GAN 论文。
- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) VAE 论文。
- [Ho, Jain, Abbeel (2020). Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) DDPM 论文──
- [Song et al. (2021). Score-Based Generative Modeling through SDEs](https://arxiv.org/abs/2011.13456) 作为 SDE de difusión。
- [Lipman et al. (2023). Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747) flujo de coincidencia 论文。
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) Difusión estable 3。
