# StyleGAN

> A maioria dos geradores vai fazer isso.`z`Sim, dentro de cada camada.`z`映射到中间表示 `w`Depois, através da AdaIN, em cada nível de resolução, injectam-se.`w` Esta mudança abriu espaço latente, e fez com que a foto de um rosto de pessoa real em 7 anos continuas fosse um problema resolvido

**类型：**Construção
**语言：**Python
**前置要求：**Fase 8 · 03 (GANs), Fase 4 · 08 (Normalização), Fase 3 · 07 (CNNs)
**时间：**- 45 minutos.

## 问题

DCGAN                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `z`映射成一张图像── o problema é:`z`Controlar tudo, incluindo a postura, a luz, a identidade, o contexto, e tudo isso está em torno de si.`z`De um eixo de movimento, estes quatro todos mudarão. Você não pode exigir um modelo da mesma pessoa, de uma postura diferente.

Karras et al. (2019, NVIDIA)  proposta:停止把 `z`Directamente enviado para as camadas de convecção.`4×4×512`tensor 作为网络输入──学习一个8层 MLP,把 `z ∈ Z → w ∈ W` através da *adaptive instance normalization* (AdaIN) em cada resolução`w`Primeiro normalizar cada mapa de características de con, e depois usar `w`As projeções afínas fazer escala 和 shift──为随机细节(皮毛孔、发丝)

O resultado é:`W`Para o estilo de alta dimensão (gestão, status) e o estilo de pequena dimensão (luz, luz, cores) você pode usar a imagem A.`w`Como estilo de nível de baixa resolução, e usando imagem B de `w`Como estilo de nível de alta resolução, assim os estilos de troca entre os dois quadros foram desbloqueados.

## 概念

![StyleGAN: mapping network + AdaIN + per-layer noise](../assets/stylegan.svg)

**Mapping network。** `f: Z → W`, um MLP de 8 níveis.`Z = N(0, I)^512`- Não.`W`Não é forçado a fazer Gaussian, mas aprende a adaptar-se à forma dos dados.

**Synthesis network。**De uma aprendizagem para uma constante.`4×4×512`開始── cada bloco de resolução:`upsample → conv → AdaIN(w_i) → noise → conv → AdaIN(w_i) → noise`△分辨率翻倍:4, 8, 16, 32, 64, 128, 256, 512, 1024──

**AdaIN。**

```
AdaIN(x, y) = y_scale · (x - mean(x)) / std(x) + y_bias
```

Entre eles `y_scale`和 `y_bias`- Não .`w`As projeções afinas do mapa de características se normalizam, então se reimpõe o estilo.

**逐层 noise。**Para cada mapa de características adicionar um único caminho ruído gaussiano, e por isso aprender a fazer um envelhecimento de cada caminho fator.

**Truncation trick。**Inferência 时,采样 `z`, calcular `w = mapping(z)`, então`w' = ŵ + ψ·(w - ŵ)`, entre os `ŵ`É uma média de muitas amostras.`w`- Não.`ψ < 1`Usando diferentes tipos de qualidade.`ψ ≈ 0.7`- Não.

## StyleGAN 1 → 2 → 3

| 版本 | 年份 | 创新 |
|---------|------|------------|
| StyleGAN | 2019 | Mapping network + AdaIN + noise + progressive growing。 |
| StyleGAN2 | 2020 | Weight demodulation 替代 AdaIN（修复 droplet artifacts）；skip/residual architecture；path-length regularization。 |
| StyleGAN3 | 2021 | Alias-free convolution + equivariant kernels；消除 texture 粘在 pixel grid 上的问题。 |
| StyleGAN-XL | 2022 | Class-conditional, 1024², ImageNet。 |
| R3GAN | 2024 | 以更强的 reg 重新包装；在 FFHQ-1024 上用少 20 倍的 params 缩小与 diffusion 的差距。 |

Até 2026, o StyleGAN3 continua a ser um exemplo de uma das seguintes situações: a) gerar imagens em áreas estreitas de alto FPS, b) adaptar em poucos tiros o domínio, c) criar imagens em novos dados, c) criar imagens baseadas em inversiones, e c) criar imagens reais.`w`, Reeditar este .`w`O texto-à-imagem não é um instrumento adequado para a difusão.


```figure
gx-stylegan-mapping
```

## Construí-lo

`code/main.py`实现 a 1D de jogo style-GAN lite: um mapeamento MLP, uma função de síntese, recebe学到的常量矢量,并用从 `w`A escala/bias dos transmitidos são moduladas, há também um nível de ruído.`w`, pode atingir ou exceder `z`拼接进生成器输入方式──

### 步骤 1: rede de mapeamento

```python
def mapping(z, M):
    h = z
    for i in range(num_layers):
        h = leaky_relu(add(matmul(M[f"W{i}"], h), M[f"b{i}"]))
    return h
```

### 步骤 2: Normalização de instância adaptativa

```python
def adain(x, w_scale, w_bias):
    mu = mean(x)
    sd = std(x)
    x_norm = [(xi - mu) / (sd + 1e-8) for xi in x]
    return [w_scale * xi + w_bias for xi in x_norm]
```

Cada mapa de características da escala e de viés são projetados linearmente a partir de`w`- Não.

### 步骤 3: ruído por camada

```python
def add_noise(x, sigma, rng):
    return [xi + sigma * rng.gauss(0, 1) for xi in x]
```

Cada caminho é um sigma que se pode aprender.

## 陷

- **Droplet artifacts。**StyleGAN 1 会在特色地图中产生块状滴,因为 AdaIN 把 mean 归零了──StyleGAN 2 通过缩缩卷重量来修复它──
- **Texture sticking。**As texturas do StyleGAN 1 e 2 seguem as coordenadas de píxeles, em vez de as coordenadas de objetos.
- **Mode coverage。**Truncation `ψ < 0.7`Parece limpo, mas só é de uma área muito estreita; se precisar de diversidade, use `ψ = 1.0`- Não.
- **Inversion 有损。**Transformar a foto real para o`W`Normalmente através da otimização ou codificação (e4e, ReStyle, HyperStyle) completado.

## Use-o

| 使用场景 | 方法 |
|----------|----------|
| 照片级真实人脸（anime、product、窄领域） | StyleGAN3 FFHQ / custom fine-tune |
| 从照片进行人脸编辑 | e4e inversion + StyleSpace / InterFaceGAN directions |
| Face swap / reenactment | StyleGAN + encoder + blending |
| Avatar pipelines | StyleGAN3 w/ ADA for low-data fine-tune |
| 从少量图像做 domain adaptation | 冻结 mapping network，fine-tune synthesis |
| Multimodal 或 text-conditioned generation | 不要用它，使用 diffusion |

Para a resposta é: "Demo de nível de produto de uma foto de um rosto", StyleGAN em dedução custo, passagem de uma única vez para frente, em 4090 acima <10ms) e a mesma qualidade por baixo da ponta de ponta acima da difusão.

## Entrega-o

保存 `outputs/skill-stylegan-inversion.md`◊Skill 接收一张真实照片并输出:inversion method (e4e / ReStyle / HyperStyle) 、预期 latente loss、editing budget (preventar perda latente、editing budget) `W`中移动多远), bem como uma lista de direções de edição já conhecidas ([[Âge]], " '-

## 练习

1. **简单。**- Não .`adain_on=True`和 `adain_on=False`运行 `code/main.py`◊ Comparar latente fixa com latente perturbador
2. **中等。**实现 regularizar a mistura: para um lote de formação, calcular `w_a`- Não.`w_b`, e aplicada na primeira metade da síntese.`w_a`, última metade da aplicação`w_b`Decoder ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
3. **困难。**取一个预训练的StyleGAN3 FFHQ模型(ffhq-1024.pkl) ⋅通过在带标签样本上训练 SVM,找到控制 smile 的 `w`Direcção; relatório em status漂移前 pode promover mais longe.

## 关键术语

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

## O que é o StyleGAN em 2026 ainda pode estar em linha

4090 StyleGAN3 能在 10 ms内生成一张 10242 FFHQ 人脸:`num_steps = 1`Não há decodificação de VAE, não há passagem de atenção cruzada. Usando o termo produção, diz que é um retardo de qualquer gerador de imagem.**300× 差距**, para produtos de um sector restrito, serviços de avatares, canais de documentos de identificação, geração de rostos de estoque, é o TCO 上胜出.

两个运维后果:

- **没有 scheduler，没有 batcher。**Em relação aos LLM e à difusão, não há nenhum benefício, pois cada pedido consome os mesmos FLOPs.
- **Truncation `ψ` 是安全旋钮。** `ψ < 0.7`A partir da rede de mapeamento                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `ψ`, para os usuários premium  melhorar-o.

## 延伸阅读

- [Karras et al. (2019). A Style-Based Generator Architecture for GANs](https://arxiv.org/abs/1812.04948)- É o que é?
- [Karras et al. (2020). Analyzing and Improving the Image Quality of StyleGAN](https://arxiv.org/abs/1912.04958) StyleGAN2──
- [Karras et al. (2021). Alias-Free Generative Adversarial Networks](https://arxiv.org/abs/2106.12423)- É o que é?
- [Tov et al. (2021). Designing an Encoder for StyleGAN Image Manipulation](https://arxiv.org/abs/2102.02766) inversação e4e。
- [Sauer et al. (2022). StyleGAN-XL: Scaling StyleGAN to Large Diverse Datasets](https://arxiv.org/abs/2202.00273) StyleGAN-XL。
- [Huang et al. (2024). R3GAN: The GAN is dead; long live the GAN!](https://arxiv.org/abs/2501.05441) 现代最小化 GAN receita。
