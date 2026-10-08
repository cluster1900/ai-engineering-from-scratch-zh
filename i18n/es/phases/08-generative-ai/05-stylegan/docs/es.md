# El estiloGAN

> La mayoría de los generadores lo harán.`z`Con el tiempo, en cada uno de los niveles.`z`映射到中间表示 `w`, y luego a través de AdaIN en cada nivel de resolución * inyección * `w` Este cambio ha abierto el espacio latente, y ha hecho que la realidad de las fotos se haya resuelto en los últimos siete años

**类型：**Construcción
**语言：**Python
**前置要求：**Fase 8 · 03 (GAN), Fase 4 · 08 (Normalización), Fase 3 · 07 (CNNs)
**时间：**- 45 minutos

##  problemas

DCGAN                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `z`映射成一张图像── el problema es:`z`Controlar todo, incluyendo el estado de ánimo, la luz, la identidad, el contexto, y todo está enlazado juntos.`z`De un eje de movimiento, estos cuatro se cambian. No puedes exigir el modelo de la misma persona, de diferentes posturas, porque este indicio no es así descompuesto.

Karras et al. (2019, NVIDIA)  propuesta:停止把 `z` directamente enviado a las capas de la caja `4×4×512`Tensor 作为网络输入──学习一个8层 MLP,把 `z ∈ Z → w ∈ W` a través de *adaptive instance normalization* (AdaIN) en cada resolución`w`Primero normaliza cada mapa de características de la conformación, y luego usa`w`Las proyecciones afines hacen escala y cambio.

El resultado es:`W`Para el estilo de alto nivel (姿态、身份) con el estilo de la pequeña dimensión (光照、颜色) hay un gran número de cambios en el eje.`w` Como estilo de nivel de baja resolución, 并使用图像B的 `w`Como estilo de alto nivel de resolución, así se intercambian estilos entre dos diagramas. Esto desbloquea la estilización editorial y transfronteriza, así como la reversión de la línea de estudio.

## 概念

![StyleGAN: mapping network + AdaIN + per-layer noise](../assets/stylegan.svg)

**Mapping network。** `f: Z → W`, una 8 niveles de MLP.`Z = N(0, I)^512`¿Qué es eso?`W`No se forzan Gaussian, sino que se aprenden a adaptarse a la forma de los datos.

**Synthesis network。**Desde una cantidad de aprendizaje hasta la cantidad de tiempo.`4×4×512`開始── cada bloque de resolución:`upsample → conv → AdaIN(w_i) → noise → conv → AdaIN(w_i) → noise`△ resolución multiplicada por 4, 8, 16, 32, 64, 128, 256, 512, 1024―

**AdaIN。**

```
AdaIN(x, y) = y_scale · (x - mean(x)) / std(x) + y_bias
```

Entre ellos `y_scale`Y `y_bias`Desde`w`Las proyecciones afines de los mapas de características se normalizan, luego se vuelven a aplicar el estilo.

**逐层 noise。**A cada mapa de características añadir un solo canal ruido gaussiano, y por ello aprender a reducir el factor de cada canal.

**Truncation trick。**Inferencia 时,采样 `z`, calcular `w = mapping(z)`, entonces`w' = ŵ + ψ·(w - ŵ)`, entre ellos `ŵ`Es un promedio de muchos ejemplos.`w`¿Qué es eso?`ψ < 1`Usó muchas formas de cambio de calidad.`ψ ≈ 0.7`¿Qué es eso?

## StyleGAN 1 → 2 → 3

| 版本 | 年份 | 创新 |
|---------|------|------------|
| StyleGAN | 2019 | Mapping network + AdaIN + noise + progressive growing。 |
| StyleGAN2 | 2020 | Weight demodulation 替代 AdaIN（修复 droplet artifacts）；skip/residual architecture；path-length regularization。 |
| StyleGAN3 | 2021 | Alias-free convolution + equivariant kernels；消除 texture 粘在 pixel grid 上的问题。 |
| StyleGAN-XL | 2022 | Class-conditional, 1024², ImageNet。 |
| R3GAN | 2024 | 以更强的 reg 重新包装；在 FFHQ-1024 上用少 20 倍的 params 缩小与 diffusion 的差距。 |

Hasta 2026, StyleGAN3  sigue siendo la opción preferida de los siguientes escenarios: a) la producción real de fotos en un área estrecha de alto FPS, b) la adaptación de dominio de pocos disparos, con 100 imágenes en un nuevo conjunto de datos, 结映射, c) la edición basada en la inversión, encontrar la reconstrucción de fotos reales.`w`, Reeditar este `w`En el ámbito de la difusión, el texto a la imagen no es un instrumento adecuado.


```figure
gx-stylegan-mapping
```

## Construirlo

`code/main.py`实现 una versión de juguete de 1D style-GAN lite: una MLP de mapeo, una función de síntesis, que recibe学到的常量矢量,并用从 `w`派生的尺度/bias 进行调制,还有层次噪音──它显示通过 affine-modulation 注入 `w`, puede alcanzar o superar`z`拼接进生成器输入的方式──

### 步骤 1: red de mapeo

```python
def mapping(z, M):
    h = z
    for i in range(num_layers):
        h = leaky_relu(add(matmul(M[f"W{i}"], h), M[f"b{i}"]))
    return h
```

### Paso 2: Normalización de instancia adaptativa

```python
def adain(x, w_scale, w_bias):
    mu = mean(x)
    sd = std(x)
    x_norm = [(xi - mu) / (sd + 1e-8) for xi in x]
    return [w_scale * xi + w_bias for xi in x_norm]
```

Cada mapa de características de la escala y el sesgo se realiza a través de la proyección lineal desde `w`Lo tengo.

### 步骤 3: ruido por capa

```python
def add_noise(x, sigma, rng):
    return [xi + sigma * rng.gauss(0, 1) for xi in x]
```

Sigma de cada camino es algo que se puede aprender.

## 陷

- **Droplet artifacts。**StyleGAN 1 se produce en los mapas de características una gota de forma de bloco, ya que AdaIN pone el significado de 归零了――Democulación de peso de StyleGAN 2 通过缩放卷重来修复它──
- **Texture sticking。**Las texturas de StyleGAN 1 y 2 siguen las coordenadas de píxel, en lugar de las coordenadas de objetos (en interpolación)
- **Mode coverage。**Truncado `ψ < 0.7`Parece limpio, pero sólo se utiliza desde una zona muy estrecha; si se necesita diversidad, usar `ψ = 1.0`¿Qué es eso?
- **Inversion 有损。**Dejar la foto real invertir en`W`Normalmente a través de la optimización o codificación (e4e, ReStyle, HyperStyle) se realiza.

## Usalo

| 使用场景 | 方法 |
|----------|----------|
| 照片级真实人脸（anime、product、窄领域） | StyleGAN3 FFHQ / custom fine-tune |
| 从照片进行人脸编辑 | e4e inversion + StyleSpace / InterFaceGAN directions |
| Face swap / reenactment | StyleGAN + encoder + blending |
| Avatar pipelines | StyleGAN3 w/ ADA for low-data fine-tune |
| 从少量图像做 domain adaptation | 冻结 mapping network，fine-tune synthesis |
| Multimodal 或 text-conditioned generation | 不要用它，使用 diffusion |

Para la respuesta es  un producto de la foto de la cara de una persona  de la demostración de nivel, StyleGAN en la inferencia costo( un solo paso adelante, en 4090 arriba <10ms) y la misma calidad por debajo de la nitidez  de la difusión 

##  entregarlo

保存 `outputs/skill-stylegan-inversion.md`◊Habilidad 接收一张真实照片并输出:método de inversión (e4e / ReStyle / HyperStyle) 、预期 latente loss、editing budget(在出现文物 之前你能在`W`En el caso de los medios de comunicación, el número de usuarios de Internet que pueden acceder a Internet es de aproximadamente un millón de personas.

##  ejercicios

1. **简单。**Por lo demás .`adain_on=True`Y `adain_on=False`运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊ Comparar la latencia fija con la latencia perturbadora
2. **中等。**实现 regularisation de la mezcla: para un lote de formación, calcular `w_a`¿Qué es esto?`w_b`, y en la primera mitad de la síntesis de aplicación `w_a`, última mitad de la aplicación`w_b`¿¿¿El decodificador ¿no ha aprendido a desentrañar estilos?
3. **困难。**取一个预训练的 StyleGAN3 FFHQ modelo(ffhq-1024.pkl) ⋅通过在带标签样本上训练 SVM,找到控制 smile 的 `w`Dirección; el informe en la identidad de desplazamiento puede impulsar más lejos.

## 关键术语: "El hombre es un hombre"

| 术语 | 人们怎么说 | 它实际意味着什么 |
|------|-----------------|-----------------------|
| Mapping network | “那个 MLP” | `f: Z → W`，8 层，把 latent geometry 与数据统计解耦。 |
| W space | “Style space” | Mapping network 的输出；大致 disentangled。 |
| AdaIN | “Adaptive instance norm” | Normalize feature map，然后由 `w`-projection 做 scale + shift。 |
| Truncation trick | “Psi” | `w = mean + ψ·(w - mean)`，ψ<1 用多样性换质量。 |
| Path-length regularization | “PL reg” | 惩罚 `w` 中单位变化导致的图像大幅变化；让 `W` 更平滑。 |
| Weight demodulation | “StyleGAN2 的修复” | Normalize conv weights 而不是 activations；消除 droplet artifacts。 |
| Alias-free | “StyleGAN3 的技巧” | Windowed sinc filters；消除 texture 粘在 pixel grid 上的问题。 |
| Inversion | “为真实图像找到 w” | Optimize 或 encode `x → w`，使 `G(w) ≈ x`。 |

## Producción: Por qué StyleGAN en 2026 año todavía puede estar en línea

4090 StyleGAN3 能在 10 ms内生成一张 10242 FFHQ 人脸:`num_steps = 1`, sin decodificación de VAE, sin paso de atención cruzada. Usar el término producción dice, es cualquier generador de imágenes de la retraso de abajo límite.**300× 差距**, para productos de estrecho ámbito, servicios de avatares, tuberías de documentos de identificación, generación de caras de stock), se encuentra en TCO 上胜出.

两个运维后果:

- **没有 scheduler，没有 batcher。**El objetivo de ocupación hacer lote estático es el mejor.
- **Truncation `ψ` 是安全旋钮。** `ψ < 0.7`Desde la red de mapeo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `ψ`, para los usuarios premium mejorarlo.

## 延伸阅读

- [Karras et al. (2019). A Style-Based Generator Architecture for GANs](https://arxiv.org/abs/1812.04948) StyleGAN。
- [Karras et al. (2020). Analyzing and Improving the Image Quality of StyleGAN](https://arxiv.org/abs/1912.04958) StyleGAN2。
- [Karras et al. (2021). Alias-Free Generative Adversarial Networks](https://arxiv.org/abs/2106.12423) StyleGAN3──
- [Tov et al. (2021). Designing an Encoder for StyleGAN Image Manipulation](https://arxiv.org/abs/2102.02766) inversión e4e。
- [Sauer et al. (2022). StyleGAN-XL: Scaling StyleGAN to Large Diverse Datasets](https://arxiv.org/abs/2202.00273) StyleGAN-XL。
- [Huang et al. (2024). R3GAN: The GAN is dead; long live the GAN!](https://arxiv.org/abs/2501.05441) 现代最小化 GAN receta。
