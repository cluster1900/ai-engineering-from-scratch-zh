# Autoencodadores e Autoencodadores Variáveis (VAE)

> Normal Autoencoder Pre-compressão Re-construção. É uma memória. Não gerará.`z = μ + σ·ε`A reparametrização, é por que cada modelo de difusão latente e de correspondência de fluxo de imagem que você usará em 2026 tem um VAE no extremo de entrada.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 07 (CNNs), Phase 8 · 01 (Taxonomy)
**Time:** ~75 分钟

## O problema

Colocar um número MNIST de 784 pixels  compacta em 16 números de código, então reconstruir. O autoencoder comum funciona bem na reconstrução do MSE, mas o espaço de código é uma mistura de confusão.

O que você realmente quer é: a) espaço de código é uma distribuição de uma amostra, por exemplo, Gaussian isotrópico`N(0, I)`,(b) decodificar qualquer amostra pode produzir um dígito razoável,(c) codificador e decodificador  ainda pode ser muito bem comprimido──────────────────────────────────────────────────────────────────────────────────────────────────────────

Kingma's 2013 VAE                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `q(z|x) = N(μ(x), σ(x)²)`Para resolver o problema, coloque a distribuição para o lado de fora.`N(0, I)`, e depois em decodificação`q(z|x)`amostra `z`Quando a inferência, perdemos o codificador, a amostra.`z ~ N(0, I)`A penalidade KL é um mecanismo de estruturação do espaço de código.

Em 2026, VAE 很少单独交付  在原始图像质量上它们已经被扩散超越  但它们是每个隐藏扩散模型的首选编码器 (SD 1/2/XL/3、Flux、AudioCraft)

## O conceito

![Autoencoder vs VAE: the reparameterization trick](../assets/vae.svg)

**Autoencoder.** `z = encoder(x)`- Não .`x̂ = decoder(z)`, perda = `||x - x̂||²`Espaço de código 无结构。

**VAE encoder.**输出 dois vetores:`μ(x)`和 `log σ²(x)` Eles definiram `q(z|x) = N(μ, diag(σ²))`- Não.

**Reparameterization trick.**De`q(z|x)`amostra indissoluível.`z = μ + σ·ε`, entre os `ε ~ N(0, I)`Agora.`z`Sim `(μ, σ)`Adição de função determinista de ruído sem parâmetros  gradientes podem fluir `μ`和 `σ`- Não.

**Loss.**Evidência Bando inferior (ELBO), dois elementos:

```
loss = reconstruction + β · KL[q(z|x) || N(0, I)]
     = ||x - x̂||²  + β · Σ_i ( σ_i² + μ_i² - log σ_i² - 1 ) / 2
```

Reconstrução`x̂`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `x`- Não, não.`q(z|x)`推向前──它们相互权衡──小 β (<1) = 更利的样本,代码空间 不那么 Gaussian──大 β (>1) = 更干净的代码空间,更模糊的样本──β-VAE(Higgins 2017) Deixe este giro se tornar famoso,并开启分解研究──

**Sampling.**Inferência 时:抽取 `z ~ N(0, I)`,para frente através do decodificador. Uma vez para frente passagem.


```figure
vae-latent-grid
```

## Construí-lo

`code/main.py`实现一个不使用 numpy或火的微型VAE──输入是从 8-D 中的2组件高斯混合 抽取的8维合成数据──编码和解码都是单隐层MLP──我们实现 tanh激活、前传、损失,以及手写后传──不是生产是教学──

### Passo 1: encode para a frente

```python
def encode(x, enc):
    h = tanh(add(matmul(enc["W1"], x), enc["b1"]))
    mu = add(matmul(enc["W_mu"], h), enc["b_mu"])
    log_sigma2 = add(matmul(enc["W_sig"], h), enc["b_sig"])
    return mu, log_sigma2
```

Utilização `log σ²`Não é?`σ`, assim a saída da rede não é limitada ((para σ fazer softplus é uma armadilha  在 σ ≈ 0 时梯会消失) 

### Passo 2: reparametrizar e decodificar

```python
def reparameterize(mu, log_sigma2, rng):
    eps = [rng.gauss(0, 1) for _ in mu]
    sigma = [math.exp(0.5 * lv) for lv in log_sigma2]
    return [m + s * e for m, s, e in zip(mu, sigma, eps)]

def decode(z, dec):
    h = tanh(add(matmul(dec["W1"], z), dec["b1"]))
    return add(matmul(dec["W_out"], h), dec["b_out"])
```

### Passo 3: ELBO

```python
def elbo(x, x_hat, mu, log_sigma2, beta=1.0):
    recon = sum((a - b) ** 2 for a, b in zip(x, x_hat))
    kl = 0.5 * sum(math.exp(lv) + m * m - lv - 1 for m, lv in zip(mu, log_sigma2))
    return recon + beta * kl, recon, kl
```

精确的闭式 KL,因为两个分布都是高西亚的──不要数值积分──2026年仍然有人交付带蒙特卡洛 KL估算的代码  无理由地慢 3x──

### Passo 4: gerar

```python
def sample(dec, z_dim, rng):
    z = [rng.gauss(0, 1) for _ in range(z_dim)]
    return decode(z, dec)
```

É o modelo gerativo.

## Encurralagens

- **Posterior collapse.**KL termo 过于激进地驱动 `q(z|x) → N(0, I)`, que conduz`z`Não tenho nada a ver com isso.`x`É possível que o número de bits seja de 1 bits livres ou em dimensões inativas.
- **Blurry samples.**A probabilidade de decodificador gaussiano significa reconstrução de MSE, ela é para L2 Bayes-optimal (média)  一组合理数字的意思是一个模糊数字──修复:discrete decoder (VQ-VAE、NVAE), ou apenas usar VAE como encodificador, e em latentes acima acumulação de difusão (Stable Diffusion就是這樣做) 
- **β too large, too early.**见后后崩──从 β≈0.01 开始并逐步走坡──
- **Latent dim too small.**16-D  Aplica-se para MNIST,256-D  Aplica-se para ImageNet 2562,2048-D  Aplica-se para ImageNet 10242。 VAE de Diffusão Estavel vai ser 512×512×3  Compressão para 64×64×4;; área espacial acima 32x fator de amostra descendente, canais acima 32x)。

## Usá-lo

2026 pilha de AAE:

| Situation | Pick |
|-----------|------|
| Image-latent encoder for diffusion | Stable Diffusion VAE (`sd-vae-ft-ema`) or Flux VAE |
| Audio-latent encoder | Encodec (Meta), SoundStream, or DAC (Descript) |
| Video latents | Sora's spatiotemporal patches, Latte VAE, WAN VAE |
| Disentangled representation learning | β-VAE, FactorVAE, TCVAE |
| Discrete latents (for transformer modelling) | VQ-VAE, RVQ (ResidualVQ) |
| Continuous latents for generation | Plain VAE, then condition a flow/diffusion model in that latent space |

O modelo de difusão latente é um modelo de difusão, situado entre o codificador e o decodificador.

## Envia-o

保存 `outputs/skill-vae-trainer.md`- Não.

Competência 接收:profil do conjunto de dados + meta latente-dim + uso a jusante(reconstrução, amostragem ou entrada de difusão latente),并输出: escolha de arquitetura(plain/β/VQ/RVQ)、β cronograma、 latente dim、decoder probabilidade(Gaussian vs categorical), bem como plano de avaliação(reconhecimento MSE、KL por dim、`q(z|x)`和 `N(0, I)`Distância entre os dois (Fréchet distance)

## Exercícios

1. **Easy.**- Não .`code/main.py`Em meio`β`改为 `0.01`- Não.`0.1`- Não.`1.0`- Não.`5.0` Record final reconstrução MSE 和 KL♦ Para os seus dados sintéticos, qual β é o melhor Pareto?
2. **Medium.**Use Bernoulli probabilidade (cross-entropy loss) substituir Gaussian decoder probabilidade (GD)
3. **Hard.**- Não .`code/main.py`扩展成一个 mini VQ-VAE:用 K=32 entradas  中的近邻搜索 替换连续 `z`❖ Comparar a reconstrução MSE,并 report há quantas entradas de código-boco são usadas ((o colapso do código-boco é real) ⋅

## Termos-chave

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

## 生产提示:VAE é um servidor de difusão

Em Stable Diffusion / Flux / SD3 pipeline,VAE Cada solicitação será utilizada duas vezes  Uma vez para codificar (((se fazer img2img / inpainting), uma vez para decodificar;; em 10242 时, o decodificador passa 往往是整条 pipeline 中单个最大激活-memória pico, pois é`128×128×16`latentes upsample 回 `1024×1024×3`❖ Duas consequências reais:

- **对 decode 做 slicing 或 tiling。** `diffusers` exposição `pipe.vae.enable_slicing()`和 `pipe.vae.enable_tiling()`❖ Tiling 用少量 sew artefact 换取 `O(tile²)`Memória, em vez de `O(H·W)`◊ Para GPUs de consumo  上的 10242+ 至关重要──
- **bf16 decoder，最终 resize 使用 fp32 numerics。**SD 1.x VAE 以 fp32 发布,并在10242+ 被 cast到fp16 时会 *静默产生NaNs*──SDXL 提供 `madebyollin/sdxl-vae-fp16-fix` 总是优先使用fp16-fix variant,或使用bf16──

## Mais leitura

- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114)Papel de VAE
- [Higgins et al. (2017). β-VAE: Learning Basic Visual Concepts with a Constrained Variational Framework](https://openreview.net/forum?id=Sy2fzU9gl) dissociado β-VAE。
- [van den Oord et al. (2017). Neural Discrete Representation Learning](https://arxiv.org/abs/1711.00937) VQ-VAE。
- [Vahdat & Kautz (2021). NVAE: A Deep Hierarchical Variational Autoencoder](https://arxiv.org/abs/2007.03898) imagem de última geração VAE。
- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) Difusão estável;VAE como codificador。
- [Défossez et al. (2022). High Fidelity Neural Audio Compression](https://arxiv.org/abs/2210.13438) Encodec, áudio VAE padrão
