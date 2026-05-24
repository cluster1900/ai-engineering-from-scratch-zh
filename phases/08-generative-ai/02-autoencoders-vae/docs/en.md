# Autoencoders 与 Variational Autoencoders (VAE)

> 普通 Autoencoder 先压缩再重建。它会记忆。它不会生成。加一个技巧——强制 code 看起来像 Gaussian——你就得到一个 sampler。这个单一技巧，也就是 `z = μ + σ·ε` 的 reparameterization，正是为什么你在 2026 年使用的每个 latent-diffusion 和 flow-matching 图像模型，都会在输入端带一个 VAE。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 07 (CNNs), Phase 8 · 01 (Taxonomy)
**Time:** ~75 minutes

## 问题

把一个 784-pixel 的 MNIST 数字压缩成一个 16-number code，然后重建。普通 Autoencoder 会在 reconstruction MSE 上表现很好，但 code space 会是一团凹凸不平的混乱区域。在 code space 里随机选一个点，decode 它，你得到的是噪声。它没有 sampler。它只是披着外衣的 compression model。

你真正想要的是：(a) code space 是一个干净、平滑、可采样的 distribution，比如 isotropic Gaussian `N(0, I)`，(b) decode 任意 sample 都会产生一个合理的数字，(c) encoder 和 decoder 仍然能很好地压缩。三个目标，一个 architecture，一个 loss。

Kingma 的 2013 VAE 通过让 encoder 输出一个 *distribution* `q(z|x) = N(μ(x), σ(x)²)` 来解决这个问题，用 KL penalty 把该 distribution 拉向 prior `N(0, I)`，然后在 decode 前从 `q(z|x)` sample `z`。Inference 时，丢掉 encoder，sample `z ~ N(0, I)`，decode。KL penalty 正是强制 code space 具备结构的东西。

在 2026 年，VAE 很少作为 standalone 交付——它们在原始图像质量上已被 diffusion 超越——但它们是每个 latent-diffusion model 的首选 encoder（SD 1/2/XL/3, Flux, AudioCraft）。学会 VAE，你就学会了你所用每条图像 pipeline 中那层不可见的第一层。

## 概念

![Autoencoder vs VAE: the reparameterization trick](../assets/vae.svg)

**Autoencoder.** `z = encoder(x)`, `x̂ = decoder(z)`, loss = `||x - x̂||²`。Code space 没有结构。

**VAE encoder.** 输出两个 Vector：`μ(x)` 和 `log σ²(x)`。它们定义 `q(z|x) = N(μ, diag(σ²))`。

**Reparameterization trick.** 从 `q(z|x)` sampling 不可微。把 sample 改写为 `z = μ + σ·ε`，其中 `ε ~ N(0, I)`。现在 `z` 是 `(μ, σ)` 的 deterministic function，再加上一个 non-parameter noise——Gradient 会流过 `μ` 和 `σ`。

**Loss.** Evidence Lower BOund (ELBO)，两个项：

```
loss = reconstruction + β · KL[q(z|x) || N(0, I)]
     = ||x - x̂||²  + β · Σ_i ( σ_i² + μ_i² - log σ_i² - 1 ) / 2
```

Reconstruction 把 `x̂` 推向 `x`。KL 把 `q(z|x)` 推向 prior。它们相互权衡。小 β (<1) = sample 更锐利，code space 不那么 Gaussian。大 β (>1) = code space 更干净，sample 更模糊。β-VAE (Higgins 2017) 让这个旋钮出名，并启动了 disentanglement 研究。

**Sampling.** Inference 时：抽取 `z ~ N(0, I)`，通过 decoder forward。一次 forward pass——没有 diffusion 那样的 iterative sampling。

## 构建它

`code/main.py` 实现了一个不使用 numpy 或 torch 的微型 VAE。输入是从 8-D 中的 2-component Gaussian mixture 采样得到的 8-dimensional synthetic data。Encoder 和 decoder 都是 single hidden-layer MLP。我们实现 tanh activation、forward pass、loss，以及手写 backward pass。不是 production——是 pedagogy。

### 步骤 1： encoder forward

```python
def encode(x, enc):
    h = tanh(add(matmul(enc["W1"], x), enc["b1"]))
    mu = add(matmul(enc["W_mu"], h), enc["b_mu"])
    log_sigma2 = add(matmul(enc["W_sig"], h), enc["b_sig"])
    return mu, log_sigma2
```

使用 `log σ²` 而不是 `σ`，这样 network output 不受约束（对 σ 使用 softplus 是陷阱——在 σ ≈ 0 时 Gradient 会消失）。

### 步骤 2： reparameterize and decode

```python
def reparameterize(mu, log_sigma2, rng):
    eps = [rng.gauss(0, 1) for _ in mu]
    sigma = [math.exp(0.5 * lv) for lv in log_sigma2]
    return [m + s * e for m, s, e in zip(mu, sigma, eps)]

def decode(z, dec):
    h = tanh(add(matmul(dec["W1"], z), dec["b1"]))
    return add(matmul(dec["W_out"], h), dec["b_out"])
```

### 步骤 3： the ELBO

```python
def elbo(x, x_hat, mu, log_sigma2, beta=1.0):
    recon = sum((a - b) ** 2 for a, b in zip(x, x_hat))
    kl = 0.5 * sum(math.exp(lv) + m * m - lv - 1 for m, lv in zip(mu, log_sigma2))
    return recon + beta * kl, recon, kl
```

精确的 closed-form KL，因为两个 distribution 都是 Gaussian。不要数值积分。到 2026 年仍有人交付带 monte-carlo KL estimates 的代码——它无故慢了 3 倍。

### 步骤 4： generate

```python
def sample(dec, z_dim, rng):
    z = [rng.gauss(0, 1) for _ in range(z_dim)]
    return decode(z, dec)
```

这就是 generative model。五行。

## 陷阱

- **Posterior collapse.** KL term 过于激进地驱动 `q(z|x) → N(0, I)`，导致 `z` 不携带关于 `x` 的信息。修复：β-annealing（从 β=0 开始，ramp 到 1）、free bits，或者在 inactive dimensions 上跳过 KL。
- **Blurry samples.** Gaussian decoder likelihood 意味着 MSE reconstruction，而它对 L2 是 Bayes-optimal（均值）——一组合理数字的均值就是一个模糊数字。修复：discrete decoder（VQ-VAE, NVAE），或者只把 VAE 当作 encoder，并在 latent 上堆叠 diffusion（这就是 Stable Diffusion 的做法）。
- **β too large, too early.** 见 posterior collapse。从 β≈0.01 开始并 ramp。
- **Latent dim too small.** 16-D 适用于 MNIST，256-D 适用于 ImageNet 256²，2048-D 适用于 ImageNet 1024²。Stable Diffusion 的 VAE 将 512×512×3 压缩为 64×64×4（spatial area 上 32x downsample factor，channels 上 32x）。

## 使用它

2026 年的 VAE stack：

| Situation | Pick |
|-----------|------|
| diffusion 的 image-latent encoder | Stable Diffusion VAE (`sd-vae-ft-ema`) 或 Flux VAE |
| Audio-latent encoder | Encodec (Meta), SoundStream, 或 DAC (Descript) |
| Video latents | Sora 的 spatiotemporal patches, Latte VAE, WAN VAE |
| Disentangled representation learning | β-VAE, FactorVAE, TCVAE |
| Discrete latents（用于 transformer modelling） | VQ-VAE, RVQ (ResidualVQ) |
| generation 的 continuous latents | Plain VAE，然后在该 latent space 中 condition 一个 flow/diffusion model |

Latent-diffusion model 就是一个 VAE，中间夹着一个 diffusion model，位于 encoder 和 decoder 之间。VAE 做 coarse compression，diffusion model 做重活。Video（VAE + video-diffusion DiT）和 audio（Encodec + MusicGen transformer）也是同样模式。

## 交付它

保存 `outputs/skill-vae-trainer.md`。

Skill 接收：dataset profile + latent-dim target + downstream use（reconstruction、sampling，或 latent-diffusion input），并输出：architecture choice（plain/β/VQ/RVQ）、β schedule、latent dim、decoder likelihood（Gaussian vs categorical），以及 evaluation plan（recon MSE、KL per dim、`q(z|x)` 与 `N(0, I)` 之间的 Fréchet distance）。

## 练习

1. **Easy.** 将 `code/main.py` 中的 `β` 改为 `0.01`、`0.1`、`1.0`、`5.0`。记录最终的 reconstruction MSE 和 KL。哪个 β 对你的 synthetic data 是 Pareto-best？
2. **Medium.** 用 Bernoulli likelihood（cross-entropy loss）替换 Gaussian decoder likelihood。在同一 synthetic data 的 binarized version 上比较 sample quality。
3. **Hard.** 将 `code/main.py` 扩展成一个 mini VQ-VAE：用 K=32 entries 的 codebook 中的 nearest-neighbour lookup 替换 continuous `z`。比较 reconstruction MSE，并报告有多少 codebook entries 被使用（codebook collapse 真实存在）。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Autoencoder | Encode-decode network | `x → z → x̂`，学习 MSE。不是 generative。 |
| VAE | 带 sampler 的 AE | Encoder 输出一个 distribution，KL penalty 塑造 code space。 |
| ELBO | Evidence lower bound | `log p(x) ≥ recon - KL[q(z|x) \|\| p(z)]`；当 `q = p(z|x)` 时 tight。 |
| Reparameterization | `z = μ + σ·ε` | 将 stochastic node 重写为 deterministic + pure noise。允许通过 sampling 进行 backprop。 |
| Prior | `p(z)` | latent 的目标 distribution，通常是 `N(0, I)`。 |
| Posterior collapse | “KL term wins” | Encoder 忽略 `x`，输出 prior；decoder 必须 hallucinate。 |
| β-VAE | 可调 KL weight | `loss = recon + β·KL`。更高 β = 更 disentangled 但更模糊。 |
| VQ-VAE | Discrete latent | 用 nearest codebook Vector 替换 continuous `z`；支持 transformer modelling。 |

## Production note: VAE 是 diffusion server 中最热的路径

在 Stable Diffusion / Flux / SD3 pipeline 中，VAE 每个 request 会被调用两次——一次用于 encode（如果做 img2img / inpainting），一次用于 decode。在 1024² 时，decoder pass 通常是整个 pipeline 中最大的 activation-memory peak，因为它把 `128×128×16` latents upsample 回 `1024×1024×3`。两个实际后果：

- **Slice or tile the decode.** `diffusers` 暴露了 `pipe.vae.enable_slicing()` 和 `pipe.vae.enable_tiling()`。Tiling 用一个小的 seam artifact 换取 `O(tile²)` memory，而不是 `O(H·W)`。这对消费级 GPUs 上的 1024²+ 至关重要。
- **bf16 decoder, fp32 numerics for the final resize.** SD 1.x VAE 以 fp32 发布，并且在 1024²+ 转为 fp16 时会*静默产生 NaNs*。SDXL 提供 `madebyollin/sdxl-vae-fp16-fix`——始终优先使用 fp16-fix variant，或使用 bf16。

## 延伸阅读
- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) — VAE 论文。
- [Higgins et al. (2017). β-VAE: Learning Basic Visual Concepts with a Constrained Variational Framework](https://openreview.net/forum?id=Sy2fzU9gl) — disentangled β-VAE。
- [van den Oord et al. (2017). Neural Discrete Representation Learning](https://arxiv.org/abs/1711.00937) — VQ-VAE。
- [Vahdat & Kautz (2021). NVAE: A Deep Hierarchical Variational Autoencoder](https://arxiv.org/abs/2007.03898) — 最先进的图像 VAE。
- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) — Stable Diffusion；VAE 作为 encoder。
- [Défossez et al. (2022). High Fidelity Neural Audio Compression](https://arxiv.org/abs/2210.13438) — Encodec，音频 VAE 标准。
