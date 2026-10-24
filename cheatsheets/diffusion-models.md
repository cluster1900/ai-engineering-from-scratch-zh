---
id: diffusion-models
title: Diffusion and Generative Models
code: DG
subtitle: 训练并采样 VAE、GAN、DDPM、潜空间扩散和 flow matching，再对它们进行度量。来自课程的玩具 Python 代码。
hue: 300
sources: phases/08-generative-ai/02-autoencoders-vae, phases/08-generative-ai/03-gans-generator-discriminator, phases/08-generative-ai/06-diffusion-ddpm-from-scratch, phases/08-generative-ai/07-latent-diffusion-stable-diffusion, phases/08-generative-ai/08-controlnet-lora-conditioning, phases/08-generative-ai/13-flow-matching-rectified-flows, phases/08-generative-ai/14-evaluation-fid-clip-score
source_hash: fa31bd8433c7b343
---

## 带 CFG 的潜空间扩散
type: architecture
from: phases/08-generative-ai/07-latent-diffusion-stable-diffusion/docs/en.md, phases/08-generative-ai/02-autoencoders-vae/docs/en.md

```arch
node | text | 1,1 | Text encoder | frozen, CLIP or T5
node | noise | 2,1 | Noisy latent | starts as N(0, I)
node | den | 3,1 | Denoiser | U-Net or DiT
node | cfg | 4,1 | CFG mix | cond and uncond
node | lat | 4,2 | Clean latent | 64 x 64 x 4
node | dec | 3,2 | VAE decoder | latent to pixels
node | img | 2,2 | Image | 512 x 512 x 3
node | enc | 1,2 | VAE encoder | training and img2img
edge | text | den | cross attn
edge | noise | den |
edge | den | cfg | two eps
edge | cfg | lat | T steps
edge | lat | dec |
edge | dec | img |
edge | img | enc | train
edge | enc | noise | add noise
```

## DDPM 的训练与采样
type: flow
from: phases/08-generative-ai/06-diffusion-ddpm-from-scratch/docs/en.md, phases/08-generative-ai/06-diffusion-ddpm-from-scratch/code/main.py

1. **调度**：$\beta_t$ 在 $T$ 步内从 1e-4 线性增至 0.02，再算出 $\bar\alpha_t$。
2. **抽样**：从数据中取 $x_0$，随机取 $t$，$\epsilon \sim \mathcal{N}(0, I)$。
3. **加噪**：用闭式解一步算出 $x_t$。
4. **预测**：网络接收 $x_t$ 和 $t$ 的正弦嵌入，输出 $\hat\epsilon$。
5. **损失**：$\epsilon$ 与 $\hat\epsilon$ 之间的平方误差，然后做一次梯度更新。
6. **开始采样**：抽取 $x_T \sim \mathcal{N}(0, I)$。
7. **反向**：从 $t = T$ 到 1 依次应用反向步。除最后一步外，每一步都加噪声。

## 关键公式
type: concepts
from: phases/08-generative-ai/06-diffusion-ddpm-from-scratch/docs/en.md, phases/08-generative-ai/02-autoencoders-vae/docs/en.md, phases/08-generative-ai/03-gans-generator-discriminator/docs/en.md, phases/08-generative-ai/07-latent-diffusion-stable-diffusion/docs/en.md, phases/08-generative-ai/13-flow-matching-rectified-flows/docs/en.md

- **前向**：$q(x_t \mid x_0) = \mathcal{N}\left( \sqrt{\bar\alpha_t} \, x_0, (1 - \bar\alpha_t) I \right)$
- **Alpha bar**：$\bar\alpha_t = \prod_{s=1}^{t} (1 - \beta_s)$
- **简化损失**：$L_{\text{simple}} = \lVert \epsilon - \epsilon_\theta(x_t, t) \rVert^2$
- **反向步**：$x_{t-1} = \frac{1}{\sqrt{\alpha_t}} \left( x_t - \frac{\beta_t}{\sqrt{1 - \bar\alpha_t}} \epsilon_\theta(x_t, t) \right) + \sigma_t z$
- **VAE 损失**：$\lVert x - \hat{x} \rVert^2 + \beta \sum_i \frac{\sigma_i^2 + \mu_i^2 - \log \sigma_i^2 - 1}{2}$
- **GAN 博弈**：$\min_G \max_D \, \mathbb{E}[\log D(x)] + \mathbb{E}[\log(1 - D(G(z)))]$
- **CFG**：$\epsilon_{\text{cfg}} = (1 + w) \epsilon_{\text{cond}} - w \epsilon_{\text{uncond}}$
- **Flow matching**：$x_t = t x_1 + (1 - t) x_0$，$L = \lVert v_\theta(x_t, t) - (x_1 - x_0) \rVert^2$

## 代码中的任务
type: task-table
from: phases/08-generative-ai/06-diffusion-ddpm-from-scratch/code/main.py, phases/08-generative-ai/02-autoencoders-vae/docs/en.md, phases/08-generative-ai/03-gans-generator-discriminator/docs/en.md, phases/08-generative-ai/07-latent-diffusion-stable-diffusion/docs/en.md, phases/08-generative-ai/07-latent-diffusion-stable-diffusion/code/main.py, phases/08-generative-ai/13-flow-matching-rectified-flows/docs/en.md

| 任务 | 代码 |
|---|---|
| 把 $x_0$ 加噪到第 $t$ 步 | `x_t = math.sqrt(a_bar) * x0 + math.sqrt(1 - a_bar) * eps` |
| VAE 重参数化 | `[m + s * e for m, s, e in zip(mu, sigma, eps)]` |
| 非饱和 G 损失 | `-sum(math.log(max(p, 1e-8)) for p in d_fake) / len(d_fake)` |
| 为 CFG 丢弃标签 | `use_c = NULL_CLASS if rng.random() < 0.1 else c` |
| 用 CFG 混合 | `eps_cfg = (1 + w) * eps_cond - w * eps_uncond` |
| Flow matching 目标 | `target = x1 - x0` |
| Euler 步，flow | `x -= dt * net_forward(x, t)` |
| 分块做 VAE 解码 | `pipe.vae.enable_tiling()` |

## DDPM 调度、加噪与反向循环
type: annotated-code
lang: python
from: phases/08-generative-ai/06-diffusion-ddpm-from-scratch/code/main.py

```python
betas = [1e-4 + (0.02 - 1e-4) * t / (T - 1) for t in range(T)]  # linear
alphas = [1 - b for b in betas]
alpha_bars, cum = [], 1.0
for a in alphas:
    cum *= a
    alpha_bars.append(cum)                      # cumulative product
eps = rng.gauss(0, 1)                           # training noise
x_t = math.sqrt(a_bar) * x0 + math.sqrt(1 - a_bar) * eps  # one shot
x = rng.gauss(0, 1)                             # sampling starts at noise
for t in range(T - 1, -1, -1):                  # T-1 down to 0
    eps_hat, _ = forward([x], t_emb, net)       # predicted noise
    mean = (x - beta_t / math.sqrt(1 - alpha_bars[t]) * eps_hat[0]) / math.sqrt(alphas[t])
    x = mean + math.sqrt(beta_t) * rng.gauss(0, 1)  # only when t > 0
```

## 采样器与步数
type: command-table
from: phases/08-generative-ai/06-diffusion-ddpm-from-scratch/docs/en.md, phases/08-generative-ai/13-flow-matching-rectified-flows/docs/en.md, phases/08-generative-ai/02-autoencoders-vae/docs/en.md, phases/08-generative-ai/03-gans-generator-discriminator/docs/en.md

| 采样器 | 步数 |
|---|---|
| DDPM | 论文中为 1000 个反向步 |
| DDIM | 20 到 50，训练目标相同 |
| DPM-Solver++ | 10 到 20 |
| UniPC | 8 到 16 |
| Flow matching，Euler | 直线路径上 4 到 8 |
| Rectified flow，2 次 reflow | 2 到 4 |
| 蒸馏、consistency | 1 到 4，需要重新训练 |
| VAE 或 GAN | 一次前向传播 |

## 默认值与数字
type: defaults
from: phases/08-generative-ai/06-diffusion-ddpm-from-scratch/docs/en.md, phases/08-generative-ai/06-diffusion-ddpm-from-scratch/code/main.py, phases/08-generative-ai/07-latent-diffusion-stable-diffusion/docs/en.md, phases/08-generative-ai/08-controlnet-lora-conditioning/docs/en.md, phases/08-generative-ai/14-evaluation-fid-clip-score/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| $\beta$ 起始值 | 1e-4 | 线性调度 |
| $\beta$ 终止值 | 0.02 | $x_T$ 接近 $\mathcal{N}(0, I)$ |
| 步数 $T$ | 1000 | 玩具代码使用 40 |
| CFG 强度 $w$ | 3 | 3 到 7 是最佳区间 |
| CFG 标签丢弃率 | 10% | 训练时使用空 token |
| SD 1.x VAE 缩放系数 | 0.18215 | 编码后应用 |
| LoRA 秩 $r$ | 4-16 | 注意力层；重度微调用 64 到 128 |
| FID 样本数 | 10k | N 太小会得到虚低的 FID |

## 故障排查
type: troubleshooting
from: phases/08-generative-ai/02-autoencoders-vae/docs/en.md, phases/08-generative-ai/03-gans-generator-discriminator/docs/en.md, phases/08-generative-ai/07-latent-diffusion-stable-diffusion/docs/en.md, phases/08-generative-ai/08-controlnet-lora-conditioning/docs/en.md, phases/08-generative-ai/14-evaluation-fid-clip-score/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| $z$ 不携带任何关于 $x$ 的信息 | 后验坍塌，KL 占上风 | 把 $\beta$ 从 0 退火到 1，或用 free bits |
| GAN 只生成一种模式 | 模式坍塌 | 给 D 的输入加噪声、minibatch discrimination 或 WGAN-GP |
| G 不再进步，D 准确率超过 95% | D 太强 | 把 D 的学习率降低 2-5x |
| 图像过饱和、油腻 | CFG 太高 | 把 $w$ 保持在 3 到 7 |
| 去噪器在错误的潜变量方差上训练 | 缺少 VAE 缩放系数 | 应用检查点的缩放系数 |
| SD 1.x VAE 在 1024² 下出现 NaN | fp16 转换 | 使用 fp16-fix VAE 或 bf16 |
| LoRA 没有效果 | 在另一个基座上训练的 | 使用匹配的基座模型 |
| FID 好得不真实 | N 不足 10k | 使用 10k 或更多样本，3 个随机种子 |

## 缩写
type: glossary
from: phases/08-generative-ai/02-autoencoders-vae/docs/en.md, phases/08-generative-ai/03-gans-generator-discriminator/docs/en.md, phases/08-generative-ai/06-diffusion-ddpm-from-scratch/docs/en.md, phases/08-generative-ai/07-latent-diffusion-stable-diffusion/docs/en.md, phases/08-generative-ai/08-controlnet-lora-conditioning/docs/en.md, phases/08-generative-ai/14-evaluation-fid-clip-score/docs/en.md

- **VAE**：变分自编码器。编码器输出一个分布，KL 项塑造编码空间。
- **ELBO**：证据下界。重建项减去 KL，是 $\log p(x)$ 的下界。
- **GAN**：生成器 $G(z)$ 与判别器 $D(x)$ 进行极小极大博弈。
- **DDPM**：Ho et al. 2020。线性 $\beta$，1000 步，U-Net。
- **DDIM**：非马尔可夫采样器。20 到 50 步，训练目标相同。
- **CFG**：无分类器引导。混合条件预测与无条件预测。
- **DiT**：Diffusion Transformer。用作用在潜空间 patch 上的 Transformer 取代 U-Net。
- **FID**：Fréchet Inception Distance。对真实特征与生成特征分别拟合高斯后的距离。

## 问答
type: qa
from: phases/08-generative-ai/02-autoencoders-vae/docs/en.md, phases/08-generative-ai/07-latent-diffusion-stable-diffusion/docs/en.md, phases/08-generative-ai/13-flow-matching-rectified-flows/docs/en.md, phases/08-generative-ai/14-evaluation-fid-clip-score/docs/en.md, phases/08-generative-ai/03-gans-generator-discriminator/docs/en.md

- **为什么输出 log σ² 而不是 σ？** 输出保持无约束。用 softplus 时，σ 接近 0 处梯度会消失。
- **为什么 VAE 的样本模糊？** MSE 重建得到的是所有合理输出的均值。
- **为什么在潜空间中扩散？** 64×64×4 的潜变量在质量相当时所需 FLOPs 约少 64x。
- **Flow matching 和 DDPM 不同吗？** 对高斯路径而言，二者在代数上等价。
- **FID 怎么计算？** 在 Inception-v3 特征上计算 $\lVert \mu_r - \mu_g \rVert^2 + \mathop{\mathrm{Tr}}(\Sigma_r + \Sigma_g - 2 (\Sigma_r \Sigma_g)^{0.5})$。越低越好。

## 提示
type: tips
from: phases/08-generative-ai/02-autoencoders-vae/docs/en.md, phases/08-generative-ai/03-gans-generator-discriminator/docs/en.md, phases/08-generative-ai/06-diffusion-ddpm-from-scratch/docs/en.md, phases/08-generative-ai/08-controlnet-lora-conditioning/docs/en.md, phases/08-generative-ai/14-evaluation-fid-clip-score/docs/en.md

- 使用闭式 KL。蒙特卡洛 KL 要慢 3x。
- 每一步都给 G 新生成的假样本，否则它的梯度是过时的。
- 图像任务要用合适的时间嵌入。直接用原始 $t$ 会失败。
- 质量停滞时试试余弦调度。
- ControlNet 权重之和保持在 1.0 左右。LoRA 的 $\alpha \le 1.5$。
- 同时报告 FID、CLIP score 和人类偏好。
