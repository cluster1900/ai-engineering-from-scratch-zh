# Flujo de la misma manera que los flujos rectificados

> Los modelos de difusión necesitan de 20 a 50 pasos de la toma, ya que se basan en el camino de los datos desde el ruido hasta el ruido.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 06 (DDPM), Phase 1 · Calculus
**Time:** ~45 minutes

##  problemas

El proceso de reversación del DDPM es un proceso de`N(0, I)`Volver a los 1000 pasos de distribución de datos. DDIM se comprime a 20-50 pasos de determinación.

Si puedes entrenar un modelo, hacer que el camino del ruido a los datos sea una línea directa, entonces desde`t=1`¿ Qué ?`t=0`de un solo paso de Euler 就能工作──Flow matching 直接构建这一点:定义从 `x_1 ∼ N(0, I)`¿ Qué ?`x_0 ∼ data`de línea directa, entrenar el campo vectorial `v_θ(x, t)`Para hacer una comparación con el tiempo de la dirección, y para inferir

Flujo rectificado (Liu 2022): más adelante: con el procedimiento de reflujo 代地拉直路径, generar un ODE gradualmente más cercano a la línea.

## 核心概念 核心概念 核心概念 核心概念

![Flow matching: straight-line interpolation between noise and data](../assets/flow-matching.svg)

### Flujo directo

 definición:

```
x_t = t · x_1 + (1 - t) · x_0,   t ∈ [0, 1]
```

Entre ellos `x_0 ~ data`¿ Qué ?`x_1 ~ N(0, I)`  El número de direcciones de tiempo de esta línea recta es constante:

```
dx_t / dt = x_1 - x_0
```

 definir un campo de vector neuronal `v_θ(x_t, t)`,并训练它匹配这个导数:

```
L = E_{x_0, x_1, t} || v_θ(x_t, t) - (x_1 - x_0) ||²
```

Eso es todo .**conditional flow matching**Perdida (Lipman 2023)  Entrenamiento no necesita simulación:`(x_0, x_1, t)`Y no hace Regresión.

### 采样

En la inferencia, en el campo vectorial del tiempo* contra-directo*积分学到:

```
x_{t-Δt} = x_t - Δt · v_θ(x_t, t)
```

Desde`x_1 ~ N(0, I)`Comienza, con el paso de Euler.`t=0`¿Qué es eso?

### Flujo rectificado (Liu 2022)

El flujo directo puede funcionar, pero el camino de aprendizaje* en realidad no es directo*, porque muchos `x_0`Se puede proyectar a la misma.`x_1`❖ Paso de reflujo del flujo rectificado:

1. Usas el modelo de flujo de entrenamiento v_1──
2. 通过将 v_1 从 `x_1`积分到其落点 `x_0`, por ejemplo ,`(x_1, x_0)`¿Qué es eso?
3. En estos ejemplos de parámetros, los parámetros son más simples, ya que los parámetros son más simples.
4. ¿Qué es eso?

En la práctica, el reflujo de 2 veces se puede aproximar a la línea, para lograr la inferencia de 2-4 pasos.

### ¿Por qué ganó en el área de imágenes en 2024?

Tres razones:

1. **Simulation-free training**En el curso de entrenamiento no se necesita ODE 展开,实现极其简单──
2. **更好的 Loss geometry**El DDPM tiene una pérdida de señal de ruido uniforme, mientras que el DDPM tiene una pérdida de señal de ruido en el horario de SNR.
3. **更快的 inference**En el SDXL-Turbo 质量下 se necesitan 4-8 pasos; la destilación de la consistencia se puede alcanzar en 1 paso.

## Aplicación de flujo vs DDPM:精确联系

带 Gaussian-conditional path ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ `x_t = α(t) x_0 + σ(t) x_1`horario, flujo de coincidencia, recuperar la difusión reformulada de Stratonovich, entre ellos `v = α'·x_0 - σ'·x_1`◊ Para los caminos gaussianos, ambos están en el precio igual en el número.

El flujo de coincidencia  aumenta es: objetivo de la velocidad ordinaria 、更干净的 Loss, así como la libertad de intentar interpolantes no gaussianos 、


```figure
normalizing-flow
```

## Construirlo

`code/main.py`En la mezcla Gaussian de dos cimas, se logra el flujo de coincidencia en 1D.`v_θ(x, t)`Es un pequeño MLP, usando entrenamiento de objetivos directos. En la inferencia, se dividen entre 1、2、4 y 20 pasos de Euler.

### Paso 1: Perdida de entrenamiento

```python
def train_step(x0, net, rng, lr):
    x1 = rng.gauss(0, 1)
    t = rng.random()
    x_t = t * x1 + (1 - t) * x0
    target = x1 - x0
    pred = net_forward(x_t, t)
    loss = (pred - target) ** 2
    # backprop + update
```

### 步骤 2: Inferencia de múltiples pasos

```python
def sample(net, num_steps):
    x = rng.gauss(0, 1)
    for i in range(num_steps):
        t = 1.0 - i / num_steps
        dt = 1.0 / num_steps
        x -= dt * net_forward(x, t)
    return x
```

### Paso 3: Comparar el número de pasos

预期 4 pasos muestreo 已能匹配 20 pasos 质量, esto para la latencia 来说意义重大──

##  fácil de coger

- **Time parameterization。**Aplicación del flujo`t ∈ [0, 1]`, entre ellos `t=0`Es un dato,`t=1`Es un ruido.`t ∈ [0, T]`, entre ellos `t=0`Es un dato,`t=T`Es el mismo ruido, la misma dirección, la misma medida, la misma medida.
- **Schedule choice。**La línea recta del flujo rectificado es el calendario de coincidencia de flujo, pero también puedes usar el cosino o el muestreo de t-normal lógico (SD3) para obtener una mejor cobertura de la escala.
- **Reflow cost。**Para reflow generar un conjunto de datos de parentesco es equivalente a cada muestra que ejecuta una inferencia completa. Solo cuando realmente necesitas una inferencia de 1-2 pasos, entonces puedes hacer reflow.
- **Classifier-free guidance 仍然适用。**Sólo necesito en línea en el grupo de la pieza:`v_cfg = (1+w) v_cond - w v_uncond`¿Qué es eso?

## Usalo

| Use case | 2026 stack |
|----------|-----------|
| Text-to-image，最佳质量 | Flow matching：SD3、Flux.1-dev |
| Text-to-image，1-4 步 | Distilled flow matching：Flux.1-schnell、SD3-Turbo、SDXL-Turbo |
| 实时 inference | 来自 flow-matched base 的 consistency distillation（LCM、PCM） |
| Audio generation | Flow matching：Stable Audio 2.5、AudioCraft 2 |
| Video generation | Flow matching 与 Diffusion 混合（Sora、Veo、Stable Video） |
| Science / physics（particle trajectories、molecules） | Flow matching + equivariant Vector field |

Sólo si un artículo del artículo de 2025-2026 años dice que es más rápido que la difusión, casi siempre es el flujo de coincidencia + destilación.

##  entregarlo

保存 `outputs/skill-fm-tuner.md` esta habilidad 接收一个Difusion-style model spec,并将其转换为流量匹配训练配置:时间表选择,时间样本分布,统一/logit-normal), 优化器,反流计划,目标步数,标准协议,

##  ejercicios

1. **Easy。**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`, comparar la presentación de la distribución de datos reales en 1 paso con la de 20 pasos MSE
2. **Medium。**Desde el uniforme`t`• ¿Se puede aumentar la calidad del modelo?
3. **Hard。**实现一次反流 代: 通过积分第一个模型 生成对 (x_0, x_1), 在这些对上训练第二个模型,并比较1步样品质量──

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Flow matching | “Straight-line diffusion” | 训练 `v_θ(x, t)`，使其沿 interpolant 匹配 `x_1 - x_0`。 |
| Rectified flow | “Reflow” | 拉直已学习 flows 的迭代过程。 |
| Velocity field | “v_θ” | model 的输出，即移动 `x_t` 的方向。 |
| Straight-line interpolant | “The path” | `x_t = (1-t)·x_0 + t·x_1`；目标导数很简单。 |
| Euler sampler | “1st order ODE solver” | 最简单的 integrator；当路径较直时效果很好。 |
| Logit-normal t | “SD3 sampling” | 将 `t` sampling 集中到 gradients 最强的中间值附近。 |
| Consistency distillation | “1-step sampler” | 训练 student 将任意 `x_t` 直接映射到 `x_0`。 |
| CFG with velocity | “v-CFG” | `v_cfg = (1+w) v_cond - w v_uncond`；同样技巧，新的变量。 |

## Nota de producción:Flux.1-schnell es el mejor formato de coincidencia de flujo

Run Flux en una computadora de 8GB  notebook  是参考部署方案:T5 + CLIP code,quantized MMDiT denoise(schnell utiliza 4 pasos, mientras que dev utiliza 50 pasos),VAE decode──cost核算如下:

| Variant | Steps | Latency at 1024² on L4 | Total FLOPs (relative) |
|---------|-------|------------------------|------------------------|
| Flux.1-dev (raw) | 50 | ~15 s | 1.0× |
| Flux.1-schnell | 4 | ~1.2 s | 0.08× (12× faster) |
| SDXL-base | 30 | ~4 s | 0.25× |
| SDXL-Lightning 2-step | 2 | ~0.3 s | 0.03× |

Reglas de producción:**flow-matched base + distillation = 2026 年快速 text-to-image 的默认方案。**Cada uno de los principales fabricantes está publicando este conjunto:SD3-Turbo(SD3 + flujo + destilación) ✓ Flujo-schnell(Flux-dev + rectificado-flujo de enderezamiento) ✓ CogView-4-Flash── pura base de difusión Sólo existe en los puntos de control heredados en el medio──

## 延伸阅读
- [Liu, Gong, Liu (2022). Flow Straight and Fast: Learning to Generate and Transfer Data with Rectified Flow](https://arxiv.org/abs/2209.03003) flujo rectificado。
- [Lipman et al. (2023). Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747) flujo de coincidencia。
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) SD3, flujo rectificado a gran escala¬¬
- [Albergo, Vanden-Eijnden (2023). Stochastic Interpolants](https://arxiv.org/abs/2303.08797) 覆盖 FM + Diffusion 的通用框架──
- [Song et al. (2023). Consistency Models](https://arxiv.org/abs/2303.01469) Destilación en 1 paso de difusión/flujo.
- [Sauer et al. (2023). Adversarial Diffusion Distillation (SDXL-Turbo)](https://arxiv.org/abs/2311.17042) Variante turbo。
- [Black Forest Labs (2024). Flux.1 models](https://blackforestlabs.ai/announcing-black-forest-labs/) Producción de flujo en el medio de la producción
