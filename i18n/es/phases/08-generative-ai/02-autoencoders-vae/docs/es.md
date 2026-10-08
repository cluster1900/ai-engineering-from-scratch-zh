# Autoencodadores y autoencodadores variativos (VAE)

> Normal Autoencoder pre-comprimido re-construir. Se recuerda. No se genera.`z = μ + σ·ε`La reparameterización, es por qué cada modelo de difusión latente y de flujo de imagen que se utilice en 2026 tiene un VAE en el extremo de entrada.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 07 (CNNs), Phase 8 · 01 (Taxonomy)
**Time:** ~75 分钟

## El problema

Colocar un dígito MNIST de 784 píxeles  comprimir en 16 dígitos de código, luego volver a construir── ordinario Autoencoder se encuentra en la reconstrucción MSE en el alto de un buen rendimiento, pero el espacio de código es un conjunto de 凸不平的混乱──

Lo que realmente quieres es: a) el espacio de código es una distribución de la muestra, por ejemplo, Gaussian isotrópico`N(0, I)`,(b) decodificar cualquier muestra puede generar un dígito razonable,(c) codificador y decodificador  todavía puede muy bien comprimirse──三个 objetivos, una arquitectura, una pérdida──

Kingma de 2013 VAE                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `q(z|x) = N(μ(x), σ(x)²)`Para resolver este problema, con la pena KL poner esta distribución hacia adelante`N(0, I)`, y luego en el decodificación`q(z|x)`muestra `z`En la inferencia 时, perder el codificador, muestra `z ~ N(0, I)`,decode.KL penalización 正是迫使代码空间 结构化机制──

En 2026 años, VAE 很少单独交付  En la calidad de imagen original 上它们 ya han sido difusiones 超越  , pero son el primer codificador de cada modelo de difusión latente SD 1/2/XL/3、Flux、AudioCraft) 学会 VAE,你就学会了你使用的每条图像管道 中那个看不见的第一层──

## El concepto

![Autoencoder vs VAE: the reparameterization trick](../assets/vae.svg)

**Autoencoder.** `z = encoder(x)`¿ Qué ?`x̂ = decoder(z)`, pérdida = `||x - x̂||²`◊ Espacio de código 无结构──

**VAE encoder.**输出 dos vectores:`μ(x)`Y `log σ²(x)` Ellos definen `q(z|x) = N(μ, diag(σ²))`¿Qué es eso?

**Reparameterization trick.**Desde`q(z|x)`muestra indispensable.`z = μ + σ·ε`, entre ellos `ε ~ N(0, I)`Ahora mismo.`z`Sí `(μ, σ)`Además de la función determinista de ruido sin parámetros  gradientes pueden fluir `μ`Y `σ`¿Qué es eso?

**Loss.**Evidencia Bando inferior (ELBO), dos elementos:

```
loss = reconstruction + β · KL[q(z|x) || N(0, I)]
     = ||x - x̂||²  + β · Σ_i ( σ_i² + μ_i² - log σ_i² - 1 ) / 2
```

La reconstrucción`x̂`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `x`¿Qué es eso?`q(z|x)`推向前──它们相互权衡──小 β (<1) = 更利的样本,代码空间 不那么 Gaussian──大 β (>1) = 更干净的代码空间,更模糊的样本──β-VAE(Higgins 2017)

**Sampling.**Inferencia 时:抽取 `z ~ N(0, I)`, adelante a través del decodificador. Una vez adelante pasar.


```figure
vae-latent-grid
```

## Construye el mismo

`code/main.py`实现 un no utilizar numpy o torch de micro tipo de VAE──输入 es de 8-D de la mezcla Gaussian de 2 componentes 抽取的 8-dimensional datos sintéticos──Encoder y decoder son un solo MLP de capa oculta──实现 tanh activación、forward pass、loss,以及手写后回pass──不是生产是教学──

### Paso 1: codificador hacia adelante

```python
def encode(x, enc):
    h = tanh(add(matmul(enc["W1"], x), enc["b1"]))
    mu = add(matmul(enc["W_mu"], h), enc["b_mu"])
    log_sigma2 = add(matmul(enc["W_sig"], h), enc["b_sig"])
    return mu, log_sigma2
```

Uso `log σ²`En vez de`σ`, así la salida de red no se ve restringida (¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡

### Paso 2: reparametrizar y decodificar

```python
def reparameterize(mu, log_sigma2, rng):
    eps = [rng.gauss(0, 1) for _ in mu]
    sigma = [math.exp(0.5 * lv) for lv in log_sigma2]
    return [m + s * e for m, s, e in zip(mu, sigma, eps)]

def decode(z, dec):
    h = tanh(add(matmul(dec["W1"], z), dec["b1"]))
    return add(matmul(dec["W_out"], h), dec["b_out"])
```

### Paso 3: El ELBO

```python
def elbo(x, x_hat, mu, log_sigma2, beta=1.0):
    recon = sum((a - b) ** 2 for a, b in zip(x, x_hat))
    kl = 0.5 * sum(math.exp(lv) + m * m - lv - 1 for m, lv in zip(mu, log_sigma2))
    return recon + beta * kl, recon, kl
```

精确的闭式KL,因为两个分布都是高西亚的──不要数值积分──2026年仍有人交付带蒙特卡洛KL估算的代码  无理由地慢3x──

### Paso 4: generar

```python
def sample(dec, z_dim, rng):
    z = [rng.gauss(0, 1) for _ in range(z_dim)]
    return decode(z, dec)
```

Éste es el modelo generativo.

## Las trampas

- **Posterior collapse.**El término KL 过于激进地驱动 `q(z|x) → N(0, I)`, que conduce`z`No llevo acerca de`x`La información es que el número de bits en el sistema de datos es de 0, pero no es de la misma forma que el número de bits en el sistema de datos.
- **Blurry samples.**La probabilidad del decodificador gaussiano significa reconstrucción de MSE, se refiere a L2 es Bayes-optimal (significado)  一组合理数字的意思是一个模糊数字──修复:discrete decoder (VQ-VAE、NVAE), o simplemente usar VAE como codificador, y en latentes arriba acumulación difusión (Stable Diffusion就是這樣做) 
- **β too large, too early.**见 posterior colapso― desde β≈0.01 开始并逐步坡──
- **Latent dim too small.**16-D  Aplicable para MNIST,256-D  Aplicable para ImageNet 2562,2048-D  Aplicable para ImageNet 10242。 VAE de difusión estable va a ser 512×512×3                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

## Usalo

2026 pila de VAE:

| Situation | Pick |
|-----------|------|
| Image-latent encoder for diffusion | Stable Diffusion VAE (`sd-vae-ft-ema`) or Flux VAE |
| Audio-latent encoder | Encodec (Meta), SoundStream, or DAC (Descript) |
| Video latents | Sora's spatiotemporal patches, Latte VAE, WAN VAE |
| Disentangled representation learning | β-VAE, FactorVAE, TCVAE |
| Discrete latents (for transformer modelling) | VQ-VAE, RVQ (ResidualVQ) |
| Continuous latents for generation | Plain VAE, then condition a flow/diffusion model in that latent space |

Modelo de difusión latente es un modelo de difusión entre los sistemas de codificación y decodificación.

## Envío

保存 `outputs/skill-vae-trainer.md`¿Qué es eso?

Habilidad 接收:profil de conjunto de datos + objetivo latente-dim + uso en aguas subyacentes(reconstrucción, muestreo o entrada de difusión latente),并输出:elección de arquitectura(plain/β/VQ/RVQ)`q(z|x)`Y `N(0, I)`Distancia entre Fréchet y la otra

## Los ejercicios

1. **Easy.**¿ Qué ?`code/main.py`En el centro`β`改为     cambió por`0.01`¿Qué es esto?`0.1`¿Qué es esto?`1.0`¿Qué es esto?`5.0` Recordar la reconstrucción final de MSE y KL♦ Para tus datos sintéticos, ¿cuál β es el mejor Pareto?
2. **Medium.**Utiliza la probabilidad de Bernoulli (cross-entropy loss) para reemplazar la probabilidad del decodificador gaussiano (Gaussian decoder probability)).
3. **Hard.**¿ Qué ?`code/main.py`扩展成一个 mini VQ-VAE:用 K=32 entradas del código de libro de medio de búsqueda de vecino más cercano 替换连续 `z`❖ Comparar la reconstrucción MSE,并 reportar cuantas entradas de códigolibro están en uso ((el colapso del códigolibro es real) ⋅

## Términos clave

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Autoencoder | Encode-decode network | `x → z → x̂`，学习 MSE。不是 generative。 |
| VAE | 带 sampler 的 AE | Encoder 输出一个 distribution，KL penalty 塑造 code space。 |
| ELBO | Evidence lower bound | `log p(x) ≥ recon - KL[q(z\|x) \|\| p(z)]`；当 `q = p(z\|x)` 时 tight。 |
| Reparameterization | `z = μ + σ·ε` | 将 stochastic node 重写为 deterministic + pure noise。使 sampling 可参与 backprop。 |
| Prior | `p(z)` | latent 的目标 distribution，通常是 `N(0, I)`。 |
| Posterior collapse | “KL term wins” | Encoder 忽略 `x`，输出 prior；decoder 必须 hallucinate。 |
| β-VAE | 可调 KL weight | `loss = recon + β·KL`。更高 β = 更 disentangled 但更模糊。 |
| VQ-VAE | Discrete latent | 用 nearest codebook vector 替换 continuous `z`；支持 transformer modelling。 |

## 生产提示:VAE es el servidor de difusión

En el flujo de flujo / flujo / SD3 de la línea de conducción, cada solicitud de VAE se utiliza dos veces  Una vez se utiliza para codificar, una vez se utiliza para decodificar. En el 10242 时, el decodificador pasa 往往是整条 de la línea de conducción, el máximo máximo de memoria de activación de un solo usuario, ya que se reduce a un máximo de 10242 时.`128×128×16`latencia muestra`1024×1024×3`Dos resultados reales:

- **对 decode 做 slicing 或 tiling。** `diffusers` exposición `pipe.vae.enable_slicing()`Y `pipe.vae.enable_tiling()`❖ Tiling Using少量 costura artefacto 换取 `O(tile²)`memoria, en lugar de `O(H·W)`◊ Para las GPUs de consumo  上的 10242+ 至关重要──
- **bf16 decoder，最终 resize 使用 fp32 numerics。**SD 1.x VAE desde fp32                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     `madebyollin/sdxl-vae-fp16-fix` 总是优先使用fp16-fix variant,或使用bf16──

## Leer más

- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) Papel de la AEV。
- [Higgins et al. (2017). β-VAE: Learning Basic Visual Concepts with a Constrained Variational Framework](https://openreview.net/forum?id=Sy2fzU9gl) desentrañada β-VAE。
- [van den Oord et al. (2017). Neural Discrete Representation Learning](https://arxiv.org/abs/1711.00937) VQ-VAE。
- [Vahdat & Kautz (2021). NVAE: A Deep Hierarchical Variational Autoencoder](https://arxiv.org/abs/2007.03898) imagen de última generación VAE。
- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) Difusión estable;VAE como codificador。
- [Défossez et al. (2022). High Fidelity Neural Audio Compression](https://arxiv.org/abs/2210.13438) Encodec, estándar de audio VAE
