# Modelos de difusión  DDPM desde cero

> Ho、Jain、Abbeel(2020) ha dado a este campo una forma de hacer que no se pueda abandonar── con el ruido 经过千个小步骤摧毁数据── entrenar una red neuronal para predecir el ruido── en inferencia 时反转这个过程── hoy en día, cada modelo de imagen, vídeo, 3D y música se ejecuta en este circuito, puede estar también sobre la misma.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 8 · 02 (VAE)
**Time:** ~75 分钟

## El problema

Quieres una para usar.`p_data(x)`Las muestras de los GANs 会玩一个经常发散的最小x游戏──VAEs 会从高斯解码器 产生模糊样本──你真正想要的是一个训练目标,它具备:(a) 单一稳定损失(没有车点,没有最小x),(b)`log p(x)`de la línea inferior de las probabilidades), así como (c) las muestras de calidad de SOTA correspondientes.

Sohl-Dickstein et al. (2015) dio una respuesta teórica: definir una cadena de Markov que se une gradualmente al ruido gaussiano.`q(x_t | x_{t-1})`,并训练一个逆链 `p_θ(x_{t-1} | x_t)`Para denunciar. Ho, Jain, Abel, 2020) mostró la pérdida puede simplificarse en una línea  预测 noise  并整理了数学.

## El concepto

![DDPM: forward noise, reverse denoise](../assets/ddpm.svg)

**Forward process `q`.**En el`T`个小步骤中加入 Gaussian noise──Closed form  数学可处理的原因  是累积步骤 仍然是 Gaussian:

```
q(x_t | x_0) = N( sqrt(α̅_t) · x_0,  (1 - α̅_t) · I )
```

Entre ellos `α̅_t = ∏_{s=1..t} (1 - β_s)`, a uno`β_t`horario.`β_t`En T=1000 pasos dentro de 1e-4 a 0.02 lineal variación,`x_T`Me acercó`N(0, I)`¿Qué es eso?

**Reverse process `p_θ`.**学习一个神经网络 `ε_θ(x_t, t)`,预测被加入的噪音──给定 `x_t`, según el término:

```
x_{t-1} = (1 / sqrt(α_t)) · ( x_t - (β_t / sqrt(1 - α̅_t)) · ε_θ(x_t, t) )  +  σ_t · z
```

Entre ellos `σ_t`¿ Qué es eso ?`sqrt(β_t)`, o es la variación aprendida. Esta expresión es muy mala, pero es sólo un número en un determinado posterior.`q(x_{t-1} | x_t, x_0)`En caso de que se resuelva`x_{t-1}`,并用 ruido estimado 替换 `x_0`¿Qué es eso?

**Training loss.**

```
L_simple = E_{x_0, t, ε} [ || ε - ε_θ( sqrt(α̅_t) · x_0 + sqrt(1 - α̅_t) · ε,  t ) ||² ]
```

De los datos de la muestra `x_0`, con el tiempo elegir uno .`t`, muestra `ε ~ N(0, I)`, a través de forma cerrada una vez de la naturaleza calcula ruido `x_t`,并对噪音做回归──一个损失,没有最小x,没有KL,没有重设设法──

**Sampling.**Desde`x_T ~ N(0, I)`¿Cómo es que estás?`t = T`¿ Qué ?`1`代 paso inverso──完成──

## Por qué funciona

Tres cosas directas:

1. **Denoising is easy; generating is hard.**En el`t=T`Los datos son ruido puro. La red debe resolver un problema trivial.`t=0`,net sólo necesita limpiar algunos píxeles... en el medio.`t`, problema difícil, pero la red se puede obtener muchos gradientes entre el mismo grupo de pesas de cada nivel de ruido.

2. **Score matching in disguise.**Vincent(2011) prueba, predicción ruido等价格估计 `∇_x log q(x_t | x_0)`,也就是 *score*──reverse SDE Usar este puntaje 沿密度梯度 上行  一次被引导的随机走,走向高概率地区──

3. **The ELBO reduces to simple MSE.** completa variación de la línea inferior en cada paso de tiempo tienen un término KL. Usar la parámetriz de DDPM, estos términos KL se simplificará para con coeficientes específicos de predicción de ruido MSE; ¿Cuál es el coeficiente de eliminación de los coeficientes?


```figure
diffusion-denoise
```

## Construye el mismo

`code/main.py`                                                                                                                                                                                                                                                              `(x_t, t)`No se produce ruido previsto. Entrenamiento es una línea de pérdida. Muestreo de la cadena inversa.

### Paso 1: el calendario anticipado (formulario cerrado)

```python
betas = [1e-4 + (0.02 - 1e-4) * t / (T - 1) for t in range(T)]
alphas = [1 - b for b in betas]
alpha_bars = []
cum = 1.0
for a in alphas:
    cum *= a
    alpha_bars.append(cum)
```

### Paso 2: muestra `x_t`en un solo disparo

```python
def forward_sample(x0, t, alpha_bars, rng):
    a_bar = alpha_bars[t]
    eps = rng.gauss(0, 1)
    x_t = math.sqrt(a_bar) * x0 + math.sqrt(1 - a_bar) * eps
    return x_t, eps
```

### Paso 3: un paso de entrenamiento

```python
def train_step(x0, model, alpha_bars, rng):
    t = rng.randrange(T)
    x_t, eps = forward_sample(x0, t, alpha_bars, rng)
    eps_hat = model_forward(model, x_t, t)
    loss = (eps - eps_hat) ** 2
    return loss, gradient_step(model, ...)
```

### Paso 4: muestreo inverso

```python
def sample(model, alpha_bars, T, rng):
    x = rng.gauss(0, 1)
    for t in range(T - 1, -1, -1):
        eps_hat = model_forward(model, x, t)
        beta_t = 1 - alphas[t]
        x = (x - beta_t / math.sqrt(1 - alpha_bars[t]) * eps_hat) / math.sqrt(alphas[t])
        if t > 0:
            x += math.sqrt(beta_t) * rng.gauss(0, 1)
    return x
```

对于一个40 tiempos pasos y 24 unidades de MLP problema 1-D, es aproximadamente 200 épocas 就能学会双模式混合──

## Condicionamiento del tiempo

La red necesita saber qué es lo que está denonizando.

- **Sinusoidal embedding.**类似 Transformer codificación posicional。`embed(t) = [sin(t/ω_0), cos(t/ω_0), sin(t/ω_1), ...]`❖ Transmitir en MLP, transmisión a la red en medio.
- **Film / group-norm conditioning.**En cada bloque, el proyecto de incorporación se realiza por escala/bias de cada canal.

Nosotros tenemos un código de juguete Usamos un código sinusoidal → concat.

## Las trampas

- **Schedule matters a lot.**Lineal `β`Es el DDPM por defecto, pero el calendario cosino (Nichol & Dhariwal, 2021) en el mismo cálculo, abajo da un mejor FID.
- **Timestep embedding is fragile.**¡ ¡ ¡ Qué cruda !`t`作为浮游 传入对玩具 1-D 可行,但对图像会失败;始终使用适当嵌入──
- **V-prediction vs ε-prediction.**a un régimen estrecho (t) muy pequeño o muy grande,`ε`La predicción de la señal al ruido es muy diferente.`v = α·ε - σ·x`) más estable;SDXL、SD3 y Flux todos lo usan.
- **Classifier-free guidance.**Inferencia 时, simultáneamente calculación condicional 和 incondicional `ε`, entonces`ε_cfg = (1 + w) · ε_cond - w · ε_uncond`, entre ellos `w ≈ 3-7`❖Ley 08 会覆盖──
- **1000 steps is a lot.**Producción utilizando DDIM (de 20 a 50 pasos) 、DPM-Solver (de 10 a 20 pasos) o destilación (de 1 a 4 pasos) ∼see Lección 12―

## Usalo

| Role | Typical stack in 2026 |
|------|-----------------------|
| Image pixel-space diffusion (small, toy) | DDPM + U-Net |
| Image latent diffusion | VAE encoder + U-Net or DiT (Lesson 07) |
| Video latent diffusion | Spatiotemporal DiT (Sora, Veo, WAN) |
| Audio latent diffusion | Encodec + diffusion transformer |
| Science (molecules, proteins, physics) | Equivariant diffusion (EDM, RFdiffusion, AlphaFold3) |

La difusión es la columna vertebral generativa general. La coincidencia de flujo (lección 13) es el competidor de 2024-2026, en la misma calidad, y normalmente gana a la velocidad de inferencia.

## Envío

保存 `outputs/skill-diffusion-trainer.md`Habilidad 接收数据集 + computación presupuesto,并输出:horario(linear/cosin/sigmoid)  objetivo de predicción(ε/v/x)  número de pasos、escala de orientación、familia de muestras 和 protocolo de evaluación。

## Los ejercicios

1. **Easy.**En el`code/main.py`En el caso de los modelos de producción, ¿cómo se puede deteriorar? ¿Cómo se puede deteriorar?
2. **Medium.**Desde la predicción ε 切换到 v-prediction──重新推导 reversible step──比较最终样本质量──
3. **Hard.**添加 instrucciones libres de clasificadores ∙以 etiqueta de clase `c ∈ {0, 1}`Como condición, en el entrenamiento 10% del tiempo de caída, y se utiliza en muestreo.`ε = (1+w)·ε_cond - w·ε_uncond`◊ la medida `w = 0, 1, 3, 7`时的 condicional-modo de la tasa de golpear

## Términos clave

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Forward process | “Adding noise” | 固定 Markov chain `q(x_t \| x_{t-1})`，用于摧毁 data。 |
| Reverse process | “Denoising” | Learned chain `p_θ(x_{t-1} \| x_t)`，用于重构 data。 |
| β schedule | “The noise ladder” | Per-step variance；linear、cosine 或 sigmoid。 |
| α̅ | “Alpha bar” | Cumulative product `∏(1 - β)`；给出从 `x_0` 得到 `x_t` 的 closed-form。 |
| Simple loss | “MSE on noise” | `\|\|ε - ε_θ(x_t, t)\|\|²`；所有 variational derivations 都 collapse 到这里。 |
| ε-prediction | “Predict noise” | 输出是被加入的 noise；standard DDPM。 |
| V-prediction | “Predict velocity” | 输出是 `α·ε - σ·x`；在整个 t 上有更好的 conditioning。 |
| DDPM | “The paper” | Ho et al. 2020；linear β、1000 steps、U-Net。 |
| DDIM | “Deterministic sampler” | Non-Markov sampler，20-50 steps，同一个 training objective。 |
| Classifier-free guidance | “CFG” | 混合 conditional 和 unconditional noise predictions 来放大 conditioning。 |

## Nota de producción: la inferencia de difusión es un problema de recuento de pasos

Papel DDPM 运行 T=1000 pasos invertidos。 nadie lo utiliza para la producción 交付。 Cada verdadera pila de inferencias 城市会选择三种策略之一  并且每种都能清晰映射到生产框架:延迟 来源:

1. **Faster sampler, same model.**DDIM(20-50 pasos)、DPM-Solver++(10-20)、UniPC(8-16)。Solución de la bucle inversa; ya entrenado `ε_θ`Los pesos 不变──将延迟 降低 20-50×──
2. **Distillation.**訓練 student 以更少步骤 匹配 teacher:Progressive Distillation(2 → 1)、Modelos de consistencia(arbitrario → 1-4)、LCM、SDXL-Turbo、SD3-Turbo──para reducir aún más la latencia 5-10×, se necesita reentrenamiento──
3. **Caching and compilation.** `torch.compile(unet, mode="reduce-overhead")`、TensorRT-LLM de difusión de los retrospectivos`xformers`/SDPA atención、bf16 pesos。 va a disminuir la latencia por paso ≈ 2×──可与 (1) 和 (2) 叠加──

 para el servidor de difusión de producción, conversación presupuestaria y literatura de producción  para los LLM: la misma descripción:`num_steps × step_cost + VAE_decode`, el rendimiento es `batch_size × (num_steps × step_cost)^-1`TTFT 很小(un paso);TPOT-equivalente es el tiempo de respuesta completo, ya que desde el punto de vista del usuario, la generación de imágenes es all-at-one──

## Leer más

- [Sohl-Dickstein et al. (2015). Deep Unsupervised Learning using Nonequilibrium Thermodynamics](https://arxiv.org/abs/1503.03585) papel de difusión,超前于时代。
- [Ho, Jain, Abbeel (2020). Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) DDPM。
- [Song, Meng, Ermon (2021). Denoising Diffusion Implicit Models](https://arxiv.org/abs/2010.02502) DDIM, más pasos.
- [Nichol & Dhariwal (2021). Improved DDPM](https://arxiv.org/abs/2102.09672) calendario cosino,varianza aprendida 
- [Dhariwal & Nichol (2021). Diffusion Models Beat GANs on Image Synthesis](https://arxiv.org/abs/2105.05233) orientación para el clasificador。
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598) CFG。
- [Karras et al. (2022). Elucidating the Design Space of Diffusion-Based Generative Models (EDM)](https://arxiv.org/abs/2206.00364) notación unificada, mejor claro de la receta―
