# GAN condicionales con Pix2Pix

> El primer gran avance de 2014-2017 fue controlar GAN 生成什么──附加一个标签、一张图像,或一个句子──Pix2Pix hace una versión de imagen, y en la estrecha misión de imagen a imagen, hasta el día de hoy sigue superando a todos los modelos generales de texto a imagen──

**Type:** 构建
**Languages:** Python
**Prerequisites:** Phase 8 · 03 (GANs), Phase 4 · 06 (U-Net), Phase 3 · 07 (CNNs)
**Time:** ~75 分钟

##  problemas
无条件 GAN 会采样任意人脸──做演示 有用,进生产 没用──你想要的是:*把草图 映射成照片*、*把地图 映射成空照片*、*把白天场景 映射成夜间*、*给灰色图像 上色*──在所有这些任务中,你会得到一个输入图像`x`, y debe de salir con algún tipo de correspondencia semántica de `y` Cada uno `x`Todos pueden responder a muchas razones.`y`✿ El error cuadrado medio los pondrá en un resultado opaco✿ ✿ La pérdida adversaria no se produce, porque parece real  es de punta✿

GAN condicional (Mirza & Osindero, 2014) Coloque la condición `c`作为输入加入 `G`Y `D`Pix2Pix (Isola et al., 2017) ha hecho especial en esto:condición es imagen de entrada completa,generador es U-Net,discriminador es *patch-based* clasificador (PatchGAN),Poss es adversario + L1── incluso en 2026 años, este conjunto de diseños en un dominio de imagen a imagen estrecho arriba sigue ganando de la formación de texto a imagen modelo, porque se entrenan en *datas emparejadas* arriba Tu tienes es la señal necesaria─

## 概念
![Pix2Pix: U-Net generator, PatchGAN discriminator](../assets/pix2pix.svg)

**Conditional G.** `G(x, z) → y`En Pix2Pix,`z`Es un desfase interno (no hay ruido de entrada)

**Conditional D.** `D(x, y) → [0, 1]`△输入是 *pair*(condición, salida) ・・・这是关键差异:D 必须判断 `y`¿Cómo se puede`x`Un致, no sólo juzgar `y`Parece que es verdad.

**U-Net generator.**带有跨瓶跳连接的编码码器-decoder──对于输入和输出共享低级结构的任务至关重要──没有这些跳转,高频细节会消失──

**PatchGAN discriminator.**D no se produce un solo resultado real/falso, sino que se produce un solo resultado `N×N`Grid, cada una de las células  juzgar alrededor de 70×70 píxeles de campo receptivo ∞ luego tomar media ∞ es un campo aleatorio de Markov ∞ suposición: verdad感是局部的── entrenamiento rápido, los parámetros son menos, la salida más ∞ ∞

**Loss.**

```
loss_G = -log D(x, G(x)) + λ · ||y - G(x)||_1
loss_D = -log D(x, y) - log (1 - D(x, G(x)))
```

El desarrollo de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de la formación de`λ = 100`Es el valor de la imagen.

## CycleGAN  cuando no tienes pares

Pix2Pix 需要 párate `(x, y)`Datos―CycleGAN (Zhu et al., 2017) 通过额外的 Loss 放弃这个要求:*consistencia del ciclo* pérdida―dos generadores:`G: X → Y`Y `F: Y → X` Entrenarlos, hacer`F(G(x)) ≈ x`且 `G(F(y)) ≈ y` Esto te permite en caso de que no hay ejemplos pareados, transformar caballos en cebras, verano en invierno.

En 2026 años, la imagen-a-imagen sin pareja se completa a través de la difusión, y no CycleGAN, pero la consistencia del ciclo sigue existiendo en casi cada una de las adaptaciones de dominio sin pareja.


```figure
gx-patchgan
```

## Construirlo
`code/main.py`En los datos 1-D, se realiza una condición de GAN de tipo micro.`c`Es la etiqueta de clase ((0 o 1);; tarea: para una clase determinada 生成一个来自条件分布的样本──

### Paso 1: Añadir la condición a G y D de entrada

```python
def G(z, c, params):
    return mlp(concat([z, one_hot(c)]), params)

def D(x, c, params):
    return mlp(concat([x, one_hot(c)]), params)
```

El codificación de un solo modo es la forma más simple. Los modelos más grandes utilizarán los embeddings aprendidos.

### 步骤 2: tren condicional

```python
for step in range(steps):
    x, c = sample_real_conditional()
    noise = sample_noise()
    update_D(x_real=x, x_fake=G(noise, c), c=c)
    update_G(noise, c)
```

El generador 必须匹配 *给定条件下* de la distribución real, y no marginales──

### Paso 3: Verificar la salida de cada clase

```python
for c in [0, 1]:
    samples = [G(noise, c) for noise in batch]
    mean_c = mean(samples)
    assert_near(mean_c, real_mean_for_class_c)
```

## 陷
- **Condition 被忽略。**G 学会 marginar, D 从不惩罚,因为 condición señal 太弱──修复:更强地 condición D(pierna capa,而不只是 tardío), utilizar el discriminador de proyección (Miyato & Koyama 2018)──
- **L1 weight 过低。**G 漂移到任意看起来真实输出,而不是 lo fiel ones──Pix2Pix-style 任务从 λ≈100 开始──
- **L1 weight 过高。**G    producir resultados confusos, ya que L1   sigue siendo la norma L_p ∙                                                                                                                                                                                                                                                   
- **D 中 ground-truth leakage。**¿ Qué ?`(x, y)`Concat como entrada D,而不只是 `y`◊否则 D 无法检查一致性──
- **每个 class 的 mode collapse。**Cada clase puede colapsar independientemente.

## Usalo
2026 年 imagen a imagen 任务状态:

| Task | Best approach |
|------|---------------|
| Sketch → photo, same domain, paired data | Pix2Pix / Pix2PixHD（仍然快，仍然锐利） |
| Sketch → photo, unpaired | 带 Scribble conditioning model 的 ControlNet |
| Semantic seg → photo | SPADE / GauGAN2 或 SD + ControlNet-Seg |
| Style transfer | 带 IP-Adapter 或 LoRA 的 Diffusion；GAN methods 属于 legacy |
| Depth → photo | Stable Diffusion 上的 ControlNet-Depth |
| Super-resolution | Real-ESRGAN (GAN), ESRGAN-Plus, 或 SD-Upscale (diffusion) |
| Colorization | ColTran、diffusion-based colorizers，或 Pix2Pix-color |
| Daytime → nighttime, seasons, weather | CycleGAN 或 ControlNet-based |

Cuando (a) tienes miles de ejemplos en pareja, (b) las tareas son estrechas y repetibles, y (c) se necesita una rápida inferencia, Pix2Pix sigue siendo un instrumento correcto.

##  entregarlo
保存 `outputs/skill-img2img-chooser.md`Habilidad 接收任务描述、数据可用性(paired vs unpaired、N samples) y el presupuesto de latencia/calidad, y luego输出:approach(Pix2Pix、CycleGAN、ControlNet variant、SDXL + IP-Adapter) ‧requisitos de formación de datos、costos de inferencia y protocolo de evaluación(LPIPS、FID、específico de tarea) 

##  ejercicios
1. **Easy.**修改                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`, ¡Junto a la tercera clase ! ¡ Confirme que G   todavía está haciendo el ruido de cada clase                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
2. **Medium.**En el entorno 1-D, el medio utiliza pérdida de estilo perceptual para reemplazar L1 (por ejemplo, un pequeño D congelado como extractor de características) ¿Cambiará la nitidez de la distribución condicional?
3. **Hard.**En el entorno 1-D 中草拟一个CycleGAN: dos distribuciones, dos generadores, pérdida de ciclo, muestra que puede ser mapeado entre ambos en caso de no tener datos emparejados.

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Conditional GAN | “带 labels 的 GAN” | G(z, c), D(x, c)。两个 networks 都看到 condition。 |
| Pix2Pix | “Image-to-image GAN” | 带 U-Net G 和 PatchGAN D + L1 loss 的 paired cGAN。 |
| U-Net | “带 skips 的 encoder-decoder” | 对称 conv network；skips 保留 high-freq。 |
| PatchGAN | “Local-realism classifier” | D 输出 per-patch score，而不是 global score。 |
| CycleGAN | “Unpaired image translation” | 两个 G + cycle-consistency loss；没有 paired data。 |
| SPADE | “GauGAN” | 用 semantic map normalize intermediate activations；segmentation-to-image。 |
| FiLM | “Feature-wise linear modulation” | 来自 condition 的 per-feature affine transform；便宜的 conditioning。 |

## Producción de la información: Pix2Pix  como línea de base de la retención de la fecha de entrega

Cuando tienes datos emparejados y tareas estrechas, esbozo → renderización, mapa semántico → foto, día → noche)

| Path | Steps | Typical latency at 512² on a single L4 |
|------|-------|----------------------------------------|
| Pix2Pix (U-Net forward) | 1 | ~30 ms |
| SD-Inpaint or SD-Img2Img | 20 | ~1.2 s |
| SDXL-Turbo Img2Img | 1-4 | ~0.15-0.35 s |
| ControlNet + SDXL base | 20-30 | ~3-5 s |

Pix2Pix en los lotes estáticos de rendimiento 上胜出(cada solicitud 都是相同的 FLOPs) ――Diffusion 在质量 和通用化 上胜出。 la práctica moderna es generalmente para la entrega de tareas estrechas modelo destilado estilo Pix2Pix,并为尾输入 提供扩散倒退──

## 延伸阅读
- [Mirza & Osindero (2014). Conditional Generative Adversarial Nets](https://arxiv.org/abs/1411.1784) cGAN 论文。
- [Isola et al. (2017). Image-to-Image Translation with Conditional Adversarial Networks](https://arxiv.org/abs/1611.07004) Pix2Pix。
- [Zhu et al. (2017). Unpaired Image-to-Image Translation using Cycle-Consistent Adversarial Networks](https://arxiv.org/abs/1703.10593) CycleGAN。
- [Wang et al. (2018). High-Resolution Image Synthesis with Conditional GANs](https://arxiv.org/abs/1711.11585) Pix2PixHD♪
- [Park et al. (2019). Semantic Image Synthesis with Spatially-Adaptive Normalization](https://arxiv.org/abs/1903.07291) SPADE / GauGAN。
- [Miyato & Koyama (2018). cGANs with Projection Discriminator](https://arxiv.org/abs/1802.05637) proyección D。
