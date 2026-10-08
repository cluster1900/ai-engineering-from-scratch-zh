# GANs  Generador vs Discriminador

> Goodfellow en 2014 las técnicas de la década de 2014 fueron completamente saltadas de densidad. Dos redes. Una fabricación de falsos. Una captura de ellos. Ellos se oponen entre sí, hasta que los falsos y el verdadero ejemplar no pueden distinguirse.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 08 (Optimizers), Phase 8 · 02 (VAE)
**Time:** ~75 minutes

##  problemas

Los VAEs producen muestras confusas, ya que su pérdida de decodificador MSE  para las imágenes es la mejor de Bayes, mientras que la media de muchos números razonables es un número confuso.

La idea de un buen amigo: entrenar un clasificador`D(x)`Para distinguir entre imágenes reales y falsas. Entrenar un generador.`G(z)`Para engañar .`D`¿Qué es eso?`G`La señal de pérdida es`D`Cuando creí que algo parecía real, se basó en esto.`G`改进, esta señal también se actualizará, perseguir un objetivo móvil...`G`Es como si nunca hubiera escrito.`log p(x)`En el caso de las empresas, las empresas tienen que tener una gran capacidad de producción.

Éste es el entrenamiento adversario.

```
min_G max_D  E_real[log D(x)] + E_fake[log(1 - D(G(z)))]
```

Para 2026, los GANs ya no son generadores de SOTA (difusión y flujo de coincidencia) pero StyleGAN 2/3 sigue siendo el modelo de cara más rentable publicado, los discriminadores de GAN se utilizan para el entrenamiento de difusión en medio de las pérdidas perceptivas, mientras que el entrenamiento adversario se apoya en destilizaciones rápidas en 1 paso (SDXL-Turbo, SD3-Turbo, LCM), que te permitan entregar difusión en tiempo real).

## 概念

![GAN training: generator and discriminator in minimax](../assets/gan.svg)

**Generator `G(z)`。**Vector de ruido`z ~ N(0, I)`映射到 muestra `x̂`△ Un decodificador 形状的网络(dense 或 transposed conv) ⋅

**Discriminator `D(x)`。**La muestra se proyectará para la probabilidad escalar (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s)

**Loss。**两个交替更新:

- **训练 `D`：** `loss_D = -[ log D(x) + log(1 - D(G(z))) ]`◊对 real=1, fake=0 hacer entropía cruzada binaria
- **训练 `G`：** `loss_G = -log D(G(z))`这是好友 使用的 *non-saturating* 形式(原始的 `log(1 - D(G(z)))`Me saturé y me he ido.`D`很自信时杀死梯度) ⋅

**Training loop。**Un paso`D`, paso a paso `G`¿Qué es eso?

**为什么它能工作。**Si es que`G`完美匹配 `p_data`Entonces ...`D`Hacer no hasta que mejor que con la conjetura, y en el punto de salida 0.5;`G`No se puede obtener un gradiente.

**为什么它会失效。**El modo se derrumba`G` encontrar una `D`无法分类的模式, entonces siempre造它) 、 desapareciendo gradiente(`D`Aprendiste muy rápido,`log D`Se trata de un programa de formación de formación que se desarrolla en el ámbito de la formación.

## 让 GANs Variantes disponibles

| Year | Innovation | Fix |
|------|------------|-----|
| 2015 | DCGAN | Conv/deconv、batch norm、LeakyReLU —— 第一个稳定 architecture。 |
| 2017 | WGAN, WGAN-GP | 用 Wasserstein distance + gradient penalty 替换 BCE。修复 vanishing gradient。 |
| 2017 | Spectral normalization | 对 discriminator 做 Lipschitz-bound。2026 年的 discriminators 中仍在使用。 |
| 2018 | Progressive GAN | 先训练低分辨率，再添加 layers。首次达到 megapixel results。 |
| 2019 | StyleGAN / StyleGAN2 | Mapping network + adaptive instance norm。固定领域 photorealism 的 state of the art。 |
| 2021 | StyleGAN3 | Alias-free、translation-equivariant —— 2026 年仍然是 face gold standard。 |
| 2022 | StyleGAN-XL | Conditional、class-aware、更大 scale。 |
| 2024 | R3GAN | 以更强 regularization 重新包装；无需 tricks 即可在 1024² 上工作。 |


```figure
gan-minimax
```

## Construirlo

`code/main.py`En los datos 1-D 上训练一个小型GAN:两个 Gaussians的混合──生成器和分辨器 都是单个隐藏层MLPs──我们手写实现前进、后退 和最小x loop──目标是看两个关键失败模式(模式崩 +渐变消失) ¿cómo ocurre──

### 步骤 1: pérdida no saturante

pérdida de Vanilla Goodfellow .`log(1 - D(G(z)))`En este momento, el gradiente de G es esencialmente cero, G no puede ser mejorado, no saturado.`-log D(G(z))`具有相反的字符: Cuando D 很自信时它会爆增, da a G una fuerte señal―

```python
def g_loss(d_fake):
    # maximize log D(G(z))  <=>  minimize -log D(G(z))
    return -sum(math.log(max(p, 1e-8)) for p in d_fake) / len(d_fake)
```

### Paso 2: Cada paso generador se enfrenta a un paso discriminador

```python
for step in range(steps):
    # train D
    real_batch = sample_real(batch_size)
    fake_batch = [G(z) for z in sample_noise(batch_size)]
    update_D(real_batch, fake_batch)

    # train G
    fake_batch = [G(z) for z in sample_noise(batch_size)]  # fresh fakes
    update_G(fake_batch)
```

给 G 使用新假,否则梯度 会过期──

### 步骤 3:  Observar el colapso del modo

```python
if step % 200 == 0:
    samples = [G(z) for z in sample_noise(500)]
    mode_a = sum(1 for s in samples if s < 0)
    mode_b = 500 - mode_a
    if min(mode_a, mode_b) < 50:
        print("  [!] mode collapse: one mode is starved")
```

经典症状: entre dos modos verdaderos, uno se detiene de generarse. Discriminador no lo corrige más, porque nunca ha sido considerado falso.

## 陷

- **Discriminator 太强。**La tasa de aprendizaje de D se reduce 2-5 veces, o se añade ruido de instancia/camada. Si D alcanza una precisión del 95%, G se muere.
- **Generator 记住了一个 mode。**给 D inputs加噪声, utilizar la capa de minibatch-discriminator, o cambiar a WGAN-GP。
- **Batch norm 泄漏 statistics。**Batch real + batch falso 流经同一个BN layer 会混合它们的统计――改用实例规范或光谱规范――
- **Inception-score gaming。**FID 和 IS en recuentos de muestras bajos.
- **对于 conditional tasks，one-shot sampling 是谎言。**Aún necesitas escalas CFG, trucos de truncado y re-muestreo para obtener resultados disponibles.

## Usalo

La pila de GAN para 2026:

| Situation | Pick |
|-----------|------|
| Photoreal human faces, fixed pose | StyleGAN3（最锐利、最小） |
| Anime / stylized faces | StyleGAN-XL 或 Stable Diffusion LoRA |
| Image-to-image translation | Pix2Pix / CycleGAN（Phase 8 · 04）或 ControlNet（Phase 8 · 08） |
| Fast 1-step text-to-image | diffusion 的 adversarial distillation（SDXL-Turbo, SD3-Turbo） |
| Perceptual loss inside a diffusion trainer | image crops 上的小型 GAN discriminator |
| Anything multi-modal, open-ended | 不要用 —— 使用 diffusion 或 flow matching |

GANs 利但狭窄──一旦你的域名 打开,比如照片、任意文字提示、视频,就切换到传播──反逆的技巧──作为组件继续存在(perceptual losos、distillación),而不是 independiente generator──

##  entregarlo

保存 `outputs/skill-gan-debugger.md`Habilidad de recibir una vez una ejecución GAN fallida (cuentas de pérdida, cuadros de muestra, tamaño del conjunto de datos), y de emitir según la probabilidad de la secuencia de causas, correcciones de una línea y protocolo de repetición.

##  ejercicios

1. **Easy。**Utilización de configuración de operación `code/main.py`。 Entonces se establece `D_LR = 5 * G_LR`¿La pérdida de G se derrumbe rápidamente hasta el número habitual?
2. **Medium。**Utilizando pérdida WGAN  sustituyendo pérdida de Goodfellow BCE:`loss_D = E[D(fake)] - E[D(real)]`¿ Qué ?`loss_G = -E[D(fake)]`, y el clip de los pesos de D hasta `[-0.01, 0.01]`◊¿El entrenamiento es más estable?
3. **Hard。**Para extender el ejemplo 1-D a los datos 2-D, se han realizado 8 combinaciones de Gauss en el anillo.

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Generator | "G" | noise-to-sample network，`G: z → x̂`。 |
| Discriminator | "D" | Classifier `D: x → [0, 1]`，real vs fake。 |
| Minimax | "The game" | joint objective 的 `min_G max_D`。 |
| Non-saturating loss | "The fix" | 对 G 使用 `-log D(G(z))`，而不是 `log(1 - D(G(z)))`。 |
| Mode collapse | "G memorized one thing" | 尽管 data 多样，Generator 只产生少量不同 outputs。 |
| WGAN | "Wasserstein" | 用 Earth-Mover distance + gradient penalty 替换 BCE；gradient 更平滑。 |
| Spectral norm | "Lipschitz trick" | 约束 D 的 weight norms 来 bound 它的 slope；稳定 training。 |
| StyleGAN | "The one that works" | Mapping network + AdaIN；faces 领域 best-in-class，2026 年仍然如此。 |

## Nota de producción: la inferencia de un solo disparo es el beneficio de GAN

Las GAN en la generación de muestras de dominio abierto 上不再获胜, pero siguen en el costo de inferencia 上获胜;; en la producción-inferencia 文献词汇中, una GAN 具有:

- **没有 prefill，没有 decode stages。**Una vez`G(z)`Pasado hacia adelante.
- **没有 KV-cache pressure。**El único estado es los pesos. El tamaño del lote recibe la memoria de activación.
- **Trivial continuous batching。**由于 cada solicitud consume los mismos FLOPs fijos, el servidor  objetivo  porcentaje de ocupación estático por lo general es el mejor ⋅ no necesita programador en vuelo ⋅

Éste es el motivo por el que la destilación de GAN (SDXL-Turbo, SD3-Turbo, ADD, LCM) es un proceso de texto a imagen rápido de 2026 años 的主导技术: se reduce a 20 a 50 pasos de la difusión de la tubería 压缩成1-4 veces de GAN-style forward passes, al tiempo que se mantiene la distribución de la base de difusión―perdida adversa 作为训练时间扣存活下来,用于把慢发电机 转变快发电机―.

## 延伸阅读

- [Goodfellow et al. (2014). Generative Adversarial Nets](https://arxiv.org/abs/1406.2661) papel GAN original
- [Radford et al. (2015). Unsupervised Representation Learning with DCGAN](https://arxiv.org/abs/1511.06434) 第一个稳定建筑──
- [Arjovsky, Chintala, Bottou (2017). Wasserstein GAN](https://arxiv.org/abs/1701.07875) WGAN。
- [Miyato et al. (2018). Spectral Normalization for GANs](https://arxiv.org/abs/1802.05957) SN。
- [Karras et al. (2020). Analyzing and Improving the Image Quality of StyleGAN](https://arxiv.org/abs/1912.04958) StyleGAN2。
- [Karras et al. (2021). Alias-Free Generative Adversarial Networks](https://arxiv.org/abs/2106.12423) StyleGAN3──
- [Sauer et al. (2023). Adversarial Diffusion Distillation](https://arxiv.org/abs/2311.17042) SDXL-Turbo。
