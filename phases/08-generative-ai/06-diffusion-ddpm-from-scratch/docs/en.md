# Diffusion Models — 从零实现 DDPM

> Ho, Jain, Abbeel (2020) 给这个领域提供了一个再也放不下的配方。用一千个小步骤的噪声破坏数据。训练一个 Neural Network 来预测噪声。在 inference 时反转这个过程。今天，每个主流的图像、视频、3D 和音乐模型都运行在这个循环上，可能还会在其上叠加 flow matching 或 consistency 技巧。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 8 · 02 (VAE)
**Time:** ~75 分钟

## 问题

你想要一个用于 `p_data(x)` 的 sampler。GANs 会进行一个经常发散的 minimax game。VAEs 会从 Gaussian decoder 生成模糊样本。你真正想要的是一个训练目标，它满足：(a) 一个单一且稳定的 Loss（没有 saddle point，没有 minimax），(b) `log p(x)` 的 lower bound（因此你拥有 likelihoods），以及 (c) 匹配 SOTA 质量的样本。

Sohl-Dickstein et al. (2015) 给出了一个理论答案：定义一个逐渐加入 Gaussian noise 的 Markov chain `q(x_t | x_{t-1})`，并训练一个 reverse chain `p_θ(x_{t-1} | x_t)` 来 denoise。Ho, Jain, Abbeel (2020) 展示了这个 Loss 可以简化为一行：预测噪声，并把数学整理干净。2020 年，这还是一个新奇想法。2021 年，它生成了 state-of-the-art 样本。2022 年，它成为 Stable Diffusion。2026 年，它就是底座。

## 概念

![DDPM: forward noise, reverse denoise](../assets/ddpm.svg)

**Forward process `q`。** 在 `T` 个小步骤中加入 Gaussian noise。闭式形式，也就是数学可处理的原因，是累计步骤仍然是 Gaussian：

```
q(x_t | x_0) = N( sqrt(α̅_t) · x_0,  (1 - α̅_t) · I )
```

其中 `α̅_t = ∏_{s=1..t} (1 - β_s)`，对应一个 `β_t` schedule。让 `β_t` 在 T=1000 步内从 1e-4 线性增长到 0.02，`x_T` 就近似为 `N(0, I)`。

**Reverse process `p_θ`。** 学习一个 Neural Network `ε_θ(x_t, t)`，用于预测被加入的噪声。给定 `x_t`，按如下方式 denoise：

```
x_{t-1} = (1 / sqrt(α_t)) · ( x_t - (β_t / sqrt(1 - α̅_t)) · ε_θ(x_t, t) )  +  σ_t · z
```

其中 `σ_t` 要么是 `sqrt(β_t)`，要么是 learned variance。这个表达式看起来丑，但它只是代数：给定 posterior `q(x_{t-1} | x_t, x_0)` 求解 `x_{t-1}`，并用通过噪声预测得到的估计替换 `x_0`。

**Training loss。**

```
L_simple = E_{x_0, t, ε} [ || ε - ε_θ( sqrt(α̅_t) · x_0 + sqrt(1 - α̅_t) · ε,  t ) ||² ]
```

从数据中采样 `x_0`，随机选择一个 `t`，采样 `ε ~ N(0, I)`，通过闭式形式一次性计算 noisy `x_t`，然后对噪声做 Regression。一个 Loss，没有 minimax，没有 KL，没有 reparameterization 技巧。

**Sampling。** 从 `x_T ~ N(0, I)` 开始。从 `t = T` 到 `1` 迭代 reverse step。完成。

## 为什么它有效

三个直觉：

1. **Denoising 容易，生成困难。** 在 `t=T` 时，数据是纯噪声，模型只需要解决一个平凡问题。在 `t=0` 时，模型只需要清理几个像素。在中间的 `t`，问题很难，但同一组权重会从每个噪声级别获得大量 Gradient。

2. **伪装成别的形式的 score matching。** Vincent (2011) 证明，预测噪声等价于估计 `∇_x log q(x_t | x_0)`，也就是 *score*。Reverse SDE 使用这个 score 沿着 density Gradient 上行，也就是一次被引导的随机游走，走向高概率区域。

3. **ELBO 会化简为简单的 MSE。** 完整的 variational lower bound 在每个 timestep 都有一个 KL 项。通过 DDPM 的 parameterization，这些 KL 项会简化为带特定系数的噪声预测 MSE；Ho 去掉了这些系数（称其为 "simple" loss），质量反而*提高了*。

## 构建它

`code/main.py` 实现了一个 1-D DDPM。数据是一个 two-mode mixture。这个 "net" 是一个很小的 MLP，接受 `(x_t, t)` 并输出预测噪声。训练就是一行 Loss。Sampling 会迭代 reverse chain。

### 步骤 1： forward schedule（闭式形式）

```python
betas = [1e-4 + (0.02 - 1e-4) * t / (T - 1) for t in range(T)]
alphas = [1 - b for b in betas]
alpha_bars = []
cum = 1.0
for a in alphas:
    cum *= a
    alpha_bars.append(cum)
```

### 步骤 2： 一次性采样 `x_t`

```python
def forward_sample(x0, t, alpha_bars, rng):
    a_bar = alpha_bars[t]
    eps = rng.gauss(0, 1)
    x_t = math.sqrt(a_bar) * x0 + math.sqrt(1 - a_bar) * eps
    return x_t, eps
```

### 步骤 3： 一个训练步骤

```python
def train_step(x0, model, alpha_bars, rng):
    t = rng.randrange(T)
    x_t, eps = forward_sample(x0, t, alpha_bars, rng)
    eps_hat = model_forward(model, x_t, t)
    loss = (eps - eps_hat) ** 2
    return loss, gradient_step(model, ...)
```

### 步骤 4： reverse sampling

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

对于一个包含 40 个 timesteps 和 24-unit MLP 的 1-D 问题，它会在约 200 个 epochs 中学会这个 two-mode mixture。

## Time conditioning

模型需要知道自己正在 denoise 哪个 timestep。两个标准选项：

- **Sinusoidal embedding。** 类似 Transformer positional encoding。`embed(t) = [sin(t/ω_0), cos(t/ω_0), sin(t/ω_1), ...]`。通过一个 MLP，再 broadcast 到网络中。
- **Film / group-norm conditioning。** 在每个 block 中，将 Embedding 投影为每个 channel 的 scale/bias (FiLM)。

我们的 toy code 使用 sinusoidal → concat。Production U-Nets 使用 FiLM。

## 陷阱

- **Schedule 非常重要。** Linear `β` 是 DDPM 默认设置，但 cosine schedule (Nichol & Dhariwal, 2021) 在相同 compute 下能得到更好的 FID。如果质量进入平台期，就切换 schedule。
- **Timestep embedding 很脆弱。** 把原始 `t` 当作 float 传入，对 toy 1-D 有效，但对图像会失败；始终使用合适的 Embedding。
- **V-prediction vs ε-prediction。** 对于狭窄区间（非常小或非常大的 t），`ε` 的 signal-to-noise 很差。V-prediction (`v = α·ε - σ·x`) 更稳定；SDXL、SD3 和 Flux 都使用它。
- **Classifier-free guidance。** 在 inference 时，同时计算 conditional 和 unconditional `ε`，然后用 `ε_cfg = (1 + w) · ε_cond - w · ε_uncond`，其中 `w ≈ 3-7`。Lesson 08 会讲。
- **1000 步太多了。** Production 使用 DDIM（20-50 步）、DPM-Solver（10-20 步）或 distillation（1-4 步）。见 Lesson 12。

## 使用它

| Role | 2026 年的典型 stack |
|------|-----------------------|
| Image pixel-space diffusion（小型、toy） | DDPM + U-Net |
| Image latent diffusion | VAE encoder + U-Net or DiT (Lesson 07) |
| Video latent diffusion | Spatiotemporal DiT (Sora, Veo, WAN) |
| Audio latent diffusion | Encodec + diffusion transformer |
| Science（molecules、proteins、physics） | Equivariant diffusion (EDM, RFdiffusion, AlphaFold3) |

Diffusion 是通用的生成式底座。Flow matching（Lesson 13）是 2024-2026 的竞争者，通常在相同质量下赢在 inference speed。

## 交付它

保存 `outputs/skill-diffusion-trainer.md`。Skill 接收一个 dataset + compute budget，并输出：schedule（linear/cosine/sigmoid）、prediction target（ε/v/x）、steps 数量、guidance scale、sampler family，以及 eval protocol。

## 练习

1. **Easy。** 在 `code/main.py` 中把 T 从 40 改为 10。样本质量（输出的可视化 histogram）如何下降？到哪个 T 时 two-mode structure 会崩塌？
2. **Medium。** 从 ε-prediction 切换到 v-prediction。重新推导 reverse step。比较最终样本质量。
3. **Hard。** 加入 classifier-free guidance。以 class label `c ∈ {0, 1}` 为条件，在训练时 10% 的时间丢弃它，并在 sampling 时使用 `ε = (1+w)·ε_cond - w·ε_uncond`。测量 `w = 0, 1, 3, 7` 时的 conditional-mode-hit rate。

## 关键术语
| Term | 人们的说法 | 它实际意味着什么 |
|------|-----------------|-----------------------|
| Forward process | "Adding noise" | 固定的 Markov chain `q(x_t | x_{t-1})`，用于破坏数据。 |
| Reverse process | "Denoising" | 学到的 chain `p_θ(x_{t-1} | x_t)`，用于重建数据。 |
| β schedule | "The noise ladder" | 每一步的 variance；linear、cosine 或 sigmoid。 |
| α̅ | "Alpha bar" | 累积乘积 `∏(1 - β)`；给出从 `x_0` 到 `x_t` 的闭式形式。 |
| Simple loss | "MSE on noise" | `||ε - ε_θ(x_t, t)||²`；所有 variational 推导都会坍缩到这里。 |
| ε-prediction | "Predict noise" | 输出是加入的噪声；标准 DDPM。 |
| V-prediction | "Predict velocity" | 输出是 `α·ε - σ·x`；跨 t 的 conditioning 更好。 |
| DDPM | "The paper" | Ho et al. 2020；linear β、1000 步、U-Net。 |
| DDIM | "Deterministic sampler" | Non-Markov sampler，20-50 步，相同训练目标。 |
| Classifier-free guidance | "CFG" | 混合 conditional 与 unconditional 噪声预测，以放大 conditioning。 |

## Production note: diffusion inference 是一个 step-count 问题

DDPM paper 运行 T=1000 个 reverse steps。没有人会在 production 中这样交付。每个真实的 inference stack 都会选择三种策略之一，并且每种策略都能清晰映射到 production 语境中的「latency 从哪里来」：

1. **更快的 sampler，相同的模型。** DDIM（20-50 步）、DPM-Solver++（10-20）、UniPC（8-16）。Reverse loop 的 drop-in replacement；训练好的 `ε_θ` 权重不变。将 latency 降低 20-50×。
2. **Distillation。** 训练 student，让它用更少步骤匹配 teacher：Progressive Distillation（2 → 1）、Consistency Models（任意 → 1-4）、LCM、SDXL-Turbo、SD3-Turbo。将 latency 再降低 5-10×，需要重新训练。
3. **Caching and compilation。** `torch.compile(unet, mode="reduce-overhead")`、TensorRT-LLM 的 diffusion backends、`xformers`/SDPA attention、bf16 weights。将每步 latency 降低约 2×。可与 (1) 和 (2) 叠加。

对于 production diffusion server，budget 讨论与 production literature 对 LLMs 的描述相同：latency 是 `num_steps × step_cost + VAE_decode`，throughput 是 `batch_size × (num_steps × step_cost)^-1`。TTFT 很小（一步）；TPOT-equivalent 是完整 response time，因为从用户视角看，图像生成是 "all-at-once"。

## 延伸阅读
- [Sohl-Dickstein et al. (2015). Deep Unsupervised Learning using Nonequilibrium Thermodynamics](https://arxiv.org/abs/1503.03585) — diffusion paper，超前于它的时代。
- [Ho, Jain, Abbeel (2020). Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) — DDPM。
- [Song, Meng, Ermon (2021). Denoising Diffusion Implicit Models](https://arxiv.org/abs/2010.02502) — DDIM，更少步骤。
- [Nichol & Dhariwal (2021). Improved DDPM](https://arxiv.org/abs/2102.09672) — cosine schedule，learned variance。
- [Dhariwal & Nichol (2021). Diffusion Models Beat GANs on Image Synthesis](https://arxiv.org/abs/2105.05233) — classifier guidance。
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598) — CFG。
- [Karras et al. (2022). Elucidating the Design Space of Diffusion-Based Generative Models (EDM)](https://arxiv.org/abs/2206.00364) — 统一 notation，最干净的配方。
