# 机器和机器的变量

> 简单的自动编码器先压缩重构――它会记忆――它不会产生――加入一个技巧 强制代码看起来像高斯人你得到一个样本――这个单一技巧,也就是说`z = μ + σ·ε`对于 2026 年使用的每一个隐形扩散和流量相匹配图像模型,

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 07 (CNNs), Phase 8 · 01 (Taxonomy)
**Time:** ~75 分钟

## 问题

把784像素的MNIST数字压缩成16个数字代码,然后重构――普通的自动编码器会在重建MSE上表现得很好,但代码空间是一团凸不平的混乱――随便在代码空间中选择一个点,解码它,你得到的是噪音――它没有样本――它只是披上外衣的压缩模型――

你真正想要的是: (a) 代码空间是干净,平滑,可从中样本的分布,比如同质 Gaussian`N(0, I)`解码任何样本都能产生一个合理的数字,解码器和解码器仍然可以很好地压缩.

通过让编码器输出一个 * 分布*`q(z|x) = N(μ(x), σ(x)²)`为了解决这个问题,用KL罚款把这个分配拉向前`N(0, I)`然后在解码前从`q(z|x)`样本`z`在推断中,丢掉了编码器,样本`z ~ N(0, I)`解码.KL处罚 正是迫使代码空间结构化的机制.

在2026年,VAE 很少单独交付  在原始图像质量上它们已经被扩散过越来越多 ,但它们是每个隐形扩散模型的首选编码器.

## 概念

![Autoencoder vs VAE: the reparameterization trick](../assets/vae.svg)

**Autoencoder.** `z = encoder(x)`现在`x̂ = decoder(z)`损失 = `||x - x̂||²`△代码空间 无结构──

**VAE encoder.**输出两个向量:`μ(x)`和 `log σ²(x)`它们定义了`q(z|x) = N(μ, diag(σ²))`,我知道.

**Reparameterization trick.**从`q(z|x)`样本不可微量.`z = μ + σ·ε`在其中`ε ~ N(0, I)`现在`z`是 `(μ, σ)`加上非参数噪音的确定性函数 梯度可以流通`μ`和 `σ`,我知道.

**Loss.**证据下层结合 (ELBO),两个项:

```
loss = reconstruction + β · KL[q(z|x) || N(0, I)]
     = ||x - x̂||²  + β · Σ_i ( σ_i² + μ_i² - log σ_i² - 1 ) / 2
```

重建`x̂`推向`x`,我把它放在`q(z|x)`推向前面──它们相互权衡──小 β (<1) = 更利的样本,代码空间 不那么高斯人──大 β (>1) = 更干净的代码空间,更模糊的样本──β-VAE(希金斯 2017) 让这个旋转出名,并开启了解解研究──

**Sampling.**抽取 引入 抽取 `z ~ N(0, I)`通过解码器进行一次前进传输 不像扩散 那样需要反复采样.


```figure
vae-latent-grid
```

## 建立它

`code/main.py`实现一个不使用形或火的微型VAE──输入是从8D中部的2个组成部分的高斯混合物抽取的8维合成数据──编码和解码器都是单个隐藏层MLP──我们实现了的激活、前进通过、损失,以及手写后退通过──不是生产是教学──

### 步骤1:向前编码器

```python
def encode(x, enc):
    h = tanh(add(matmul(enc["W1"], x), enc["b1"]))
    mu = add(matmul(enc["W_mu"], h), enc["b_mu"])
    log_sigma2 = add(matmul(enc["W_sig"], h), enc["b_sig"])
    return mu, log_sigma2
```

使用 `log σ²`而不是`σ`由于网络输出不受约束,对 σ做软加是陷  在 σ ≈ 0 时梯度会消失)

### 步骤2:重组和解码

```python
def reparameterize(mu, log_sigma2, rng):
    eps = [rng.gauss(0, 1) for _ in mu]
    sigma = [math.exp(0.5 * lv) for lv in log_sigma2]
    return [m + s * e for m, s, e in zip(mu, sigma, eps)]

def decode(z, dec):
    h = tanh(add(matmul(dec["W1"], z), dec["b1"]))
    return add(matmul(dec["W_out"], h), dec["b_out"])
```

### 步骤3:ELBO

```python
def elbo(x, x_hat, mu, log_sigma2, beta=1.0):
    recon = sum((a - b) ** 2 for a, b in zip(x, x_hat))
    kl = 0.5 * sum(math.exp(lv) + m * m - lv - 1 for m, lv in zip(mu, log_sigma2))
    return recon + beta * kl, recon, kl
```

精确的闭式KL,因为两个分布都是高斯的──不要数值积分──2026年仍然有人交付带蒙特卡洛KL估计的代码 无理由地慢3x──

### 步骤4:生成

```python
def sample(dec, z_dim, rng):
    z = [rng.gauss(0, 1) for _ in range(z_dim)]
    return decode(z, dec)
```

这就是生成模型.

## 陷

- **Posterior collapse.**过于激进地驱动`q(z|x) → N(0, I)`导致`z`没有关于`x`信息──修复:β-annealing(从β=0开始,逐步升至1) 无限位,或者在不活跃的维度上跳 KL──
- **Blurry samples.**对于L2来说是贝尔最佳的意思 (Bays-optimal) 意思 (一组合理数字的意思是模糊的数字)
- **β too large, too early.**见后部崩. 从 β≈0.01 开始并逐步坡.
- **Latent dim too small.**16D 适用于MNIST,256-D 适用于ImageNet 2562,2048-D 适用于ImageNet 10242──稳定传播的VAE将512×512×3 压缩为64×64×4──空间面积上32x下样数,道上32x)──

## 用它

2026 年的VAE堆:

| Situation | Pick |
|-----------|------|
| Image-latent encoder for diffusion | Stable Diffusion VAE (`sd-vae-ft-ema`) or Flux VAE |
| Audio-latent encoder | Encodec (Meta), SoundStream, or DAC (Descript) |
| Video latents | Sora's spatiotemporal patches, Latte VAE, WAN VAE |
| Disentangled representation learning | β-VAE, FactorVAE, TCVAE |
| Discrete latents (for transformer modelling) | VQ-VAE, RVQ (ResidualVQ) |
| Continuous latents for generation | Plain VAE, then condition a flow/diffusion model in that latent space |

隐藏式传播模型是一个VAE,中间住着一个扩散模型,位于编码器和解码器之间.

## 运送它

保存`outputs/skill-vae-trainer.md`,我知道.

接收技能:数据集配置文件 + 隐形模拟目标 + 下游使用(重建、采样或隐形传播输入),并输出:建筑选择(平面/β/VQ/RVQ) 、β时间表、隐形模拟,解码器概率(高斯与类型),以及评估计划(每模拟的MSE、KL识别`q(z|x)`和 `N(0, I)`之间的弗雷切距离) 』

## 运动

1. **Easy.**让我`code/main.py`中中 `β`改为`0.01`,我知道.`0.1`,我知道.`1.0`,我知道.`5.0`记录最终重建的MSE 和 KL.对于你的合成数据,哪个 β 是最好的?
2. **Medium.**用伯诺利概率 (cross-entropy loss) 替换高斯解码器概率――在同一合成数据的二进制版本上比较样本质量――
3. **Hard.**将`code/main.py`扩展成一个小型VQ-VAE:用K=32条的代码簿 中的近邻查找 替换连续 `z`〔比较重建MSE,并报告有多少代码书的入口被使用.

## 关键词

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

## 生产提示:VAE 是扩散服务器 中最热的路径

在稳定扩散/流动/SD3管道中,VAE 每个请求会被调用两次  一次用于编码(如果做图像2图像 /涂料),一次用于解码──在10242 时,解码器通过往往是整条管道中单个最大的激活记忆峰值,因为它把`128×128×16`隐藏的样本 回 `1024×1024×3`△两个实际后果:

- **对 decode 做 slicing 或 tiling。** `diffusers`暴露`pipe.vae.enable_slicing()`和 `pipe.vae.enable_tiling()`  用少量件 换取`O(tile²)`记忆,而不是`O(H·W)`对于消费者GPU上述10242+至关重要.
- **bf16 decoder，最终 resize 使用 fp32 numerics。**SD 1.x VAE 以fp32 发布,并在10242+被抛到fp16 时会 *静默产生NaNs*──SDXL 提供 `madebyollin/sdxl-vae-fp16-fix`总是优先使用fp16-fix变体,或者使用bf16──

## 进一步阅读

- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114)        
- [Higgins et al. (2017). β-VAE: Learning Basic Visual Concepts with a Constrained Variational Framework](https://openreview.net/forum?id=Sy2fzU9gl)脱的β-VAE──
- [van den Oord et al. (2017). Neural Discrete Representation Learning](https://arxiv.org/abs/1711.00937) VQ-VAE。
- [Vahdat & Kautz (2021). NVAE: A Deep Hierarchical Variational Autoencoder](https://arxiv.org/abs/2007.03898)最先进的图像 VAE──
- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752)稳定扩散;VAE作为编码器──
- [Défossez et al. (2022). High Fidelity Neural Audio Compression](https://arxiv.org/abs/2210.13438) 编码,音频VAE标准
