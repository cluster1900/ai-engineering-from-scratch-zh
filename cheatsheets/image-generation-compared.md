---
id: image-generation-compared
title: GANs, Diffusion and Flow Compared
code: GD
subtitle: GAN、DDPM、潜空间扩散、使用 rectified flow 的 DiT、flow matching 与 VAR。训练目标、步数、代码与修复。
hue: 315
sources: phases/04-computer-vision/09-image-generation-gans, phases/04-computer-vision/10-image-generation-diffusion, phases/04-computer-vision/11-stable-diffusion, phases/04-computer-vision/23-diffusion-transformers-rectified-flow, phases/08-generative-ai/13-flow-matching-rectified-flows, phases/08-generative-ai/19-visual-autoregressive-var
source_hash: 45fc3bd2c684c3f5
---

## 采样成本并列对比
type: comparison
from: phases/04-computer-vision/10-image-generation-diffusion/docs/en.md, phases/04-computer-vision/11-stable-diffusion/docs/en.md, phases/04-computer-vision/23-diffusion-transformers-rectified-flow/docs/en.md, phases/08-generative-ai/19-visual-autoregressive-var/docs/en.md

| 家族 | 前向次数 | 说明 |
|---|---|---|
| GAN | 一次前向 | 快。难训练 |
| DDPM | 1000 | 线性 beta 调度 |
| DDIM | 50 | 确定性。训练与 DDPM 相同 |
| DPM-Solver++ 2M Karras | 20-30 | SD 生产默认值 |
| Rectified flow (Euler) | 20-30 | SD3、FLUX、Z-Image |
| Schnell、Turbo、LCM | 1-4 | 从多步模型蒸馏而来 |
| VAR，K = 10 个尺度 | 10 次 | 在 256x256 下 DiT 需要 28-50 次 |

## 训练目标并列对比
type: comparison
from: phases/04-computer-vision/09-image-generation-gans/docs/en.md, phases/04-computer-vision/10-image-generation-diffusion/docs/en.md, phases/04-computer-vision/23-diffusion-transformers-rectified-flow/docs/en.md, phases/08-generative-ai/13-flow-matching-rectified-flows/docs/en.md, phases/08-generative-ai/19-visual-autoregressive-var/docs/en.md

| 家族 | 目标 | 损失 |
|---|---|---|
| GAN 判别器 | P(real) | 对真假样本的二元交叉熵 |
| GAN 生成器 | `D(G(z))` | 越高越好。非饱和形式 |
| DDPM | `epsilon_theta(x_t, t)` | 对真实噪声的 MSE |
| Rectified flow (4.23) | `epsilon - x0` | 对速度的 MSE |
| Flow matching (8.13) | `x1 - x0` | 这里 x1 是噪声，x0 是数据 |
| VAR | 交叉熵 | 作用于下一尺度的 VQ 码 |

## 何时选用
type: tips
from: phases/04-computer-vision/09-image-generation-gans/docs/en.md, phases/04-computer-vision/11-stable-diffusion/docs/en.md, phases/04-computer-vision/23-diffusion-transformers-rectified-flow/docs/en.md, phases/08-generative-ai/13-flow-matching-rectified-flows/docs/en.md, phases/08-generative-ai/19-visual-autoregressive-var/docs/en.md

- **GAN**：10 ms 以内的实时生成、风格迁移、Pix2Pix 或 CycleGAN 转换。
- **SD 1.5 潜空间扩散**：开源社区用 LoRA 微调。
- **DiT + rectified flow**：最先进的文生图。FLUX.1-schnell 是开源默认选择。
- **蒸馏 flow (LCM-LoRA, schnell)**：延迟低于 1s，1-4 步。
- **Flow matching**：除图像外还用于音频、视频和科学领域。
- **VAR**：类别条件的 ImageNet。前向次数更少，GPT 式扩展。

## Stable Diffusion 流水线
type: architecture
from: phases/04-computer-vision/11-stable-diffusion/docs/en.md

```arch
node | txt | 1,1 | Text prompt | | client
node | te | 2,1 | Text encoder | CLIP-L or T5 | model
node | noise | 1,2 | Noise | 4x64x64 | store
node | unet | 3,1 | UNet | cross-attention to text | gpu
node | sched | 3,2 | Scheduler | DPM-Solver++, Euler | process
node | lat | 2,2 | Clean latent | 4x64x64 | store
node | vae | 2,3 | VAE decoder | | model
node | img | 3,3 | Image | 512x512 RGB | client
edge | txt | te |
edge | te | unet | embedding
edge | noise | unet |
edge | unet | sched |
edge | sched | lat |
edge | lat | vae |
edge | vae | img |
```

## 代码中的任务
type: task-table
from: phases/04-computer-vision/09-image-generation-gans/docs/en.md, phases/04-computer-vision/10-image-generation-diffusion/code/main.py, phases/04-computer-vision/23-diffusion-transformers-rectified-flow/code/main.py, phases/08-generative-ai/19-visual-autoregressive-var/code/main.py

| 任务 | 代码 |
|---|---|
| 带谱归一化的 GAN | `build_sn_discriminator()` |
| 线性 beta 调度 | `linear_beta_schedule(T=1000)` |
| DDPM 采样 | `sample_ddpm(model, schedule, shape)` |
| DDIM 采样 | `sample_ddim(..., steps=50, eta=0.0)` |
| Rectified flow 一步 | `rectified_flow_train_step(model, x0, ...)` |
| Euler 采样 | `rectified_flow_sample(model, shape, steps=20)` |
| 多尺度 VQ token | `tokenize_multiscale(img, codebooks)` |

## diffusers 调用
type: task-table
from: phases/04-computer-vision/11-stable-diffusion/docs/en.md, phases/04-computer-vision/23-diffusion-transformers-rectified-flow/docs/en.md

| 任务 | 代码 |
|---|---|
| SD 文生图 | `guidance_scale=7.5, num_inference_steps=25` |
| 更换调度器 | `DPMSolverMultistepScheduler.from_config(...)` |
| 图生图 | `img2img(..., image=init_image, strength=0.6)` |
| 修补白色区域 | `inpaint(..., mask_image=mask)` |
| 融合 LoRA | `pipe.fuse_lora(lora_scale=0.8)` |
| FLUX.1-schnell | `guidance_scale=0.0, num_inference_steps=4` |
| SD 3.5 Large | `guidance_scale=3.5, num_inference_steps=28` |

## DDPM 与 rectified flow 对比
type: annotated-code
lang: python
from: phases/04-computer-vision/10-image-generation-diffusion/code/main.py, phases/04-computer-vision/23-diffusion-transformers-rectified-flow/code/main.py

```python
t = torch.randint(0, T, (bs,), device=device)   # DDPM: integer step
x_t = q_sample(x0, t, noise, schedule)          # closed-form jump
loss = F.mse_loss(pred, noise)                  # predict the noise
t = torch.rand(n, device=device)                # RF: t in [0, 1]
x_t = (1 - t[:, None, None, None]) * x0 + t[:, None, None, None] * epsilon
target_v = epsilon - x0                         # velocity, data to noise
loss = F.mse_loss(pred_v, target_v)
dt = 1.0 / steps                                # Euler, steps=20
for _ in range(steps):
    v = model(x, t)
    x = x - dt * v                              # walk from noise to data
    t = t - dt
```

## 一次 GAN 训练步
type: annotated-code
lang: python
from: phases/04-computer-vision/09-image-generation-gans/code/main.py, phases/04-computer-vision/09-image-generation-gans/docs/en.md

```python
opt_d.zero_grad()
d_real = D(real)
d_fake = D(G(z).detach())                    # no gradient into G
loss_d = (F.binary_cross_entropy_with_logits(d_real, torch.ones_like(d_real))
          + F.binary_cross_entropy_with_logits(d_fake, torch.zeros_like(d_fake)))
loss_d.backward()
opt_d.step()
opt_g.zero_grad()
d_fake = D(G(z))
loss_g = F.binary_cross_entropy_with_logits(d_fake, torch.ones_like(d_fake))  # non-saturating
loss_g.backward()
opt_g.step()
opt_g = torch.optim.Adam(G.parameters(), lr=2e-4, betas=(0.5, 0.999))  # DCGAN default
```

## 关键公式
type: concepts
from: phases/04-computer-vision/09-image-generation-gans/docs/en.md, phases/04-computer-vision/10-image-generation-diffusion/docs/en.md, phases/04-computer-vision/11-stable-diffusion/docs/en.md, phases/04-computer-vision/23-diffusion-transformers-rectified-flow/docs/en.md, phases/08-generative-ai/13-flow-matching-rectified-flows/docs/en.md

- **GAN 博弈**：$\min_G \max_D \; \mathbb{E}_x[\log D(x)] + \mathbb{E}_z[\log(1 - D(G(z)))]$
- **DDPM 跳步**：$x_t = \sqrt{\bar{\alpha}_t} \, x_0 + \sqrt{1 - \bar{\alpha}_t} \, \epsilon$，其中 $\bar{\alpha}_t = \prod_{s=1}^{t} \alpha_s$
- **CFG**：$\epsilon = \epsilon_{\text{uncond}} + w \cdot (\epsilon_{\text{cond}} - \epsilon_{\text{uncond}})$
- **Rectified flow**：$x_t = (1 - t) \, x_0 + t \, \epsilon$，$t \in [0, 1]$
- **速度形式的 CFG**：$v_{\text{cfg}} = (1+w) v_{\text{cond}} - w v_{\text{uncond}}$
- **潜空间节省**：(3*512*512)/(4*64*64) = 计算量少 48x。

## VAR 下一尺度生成
type: flow
from: phases/08-generative-ai/19-visual-autoregressive-var/docs/en.md, phases/08-generative-ai/19-visual-autoregressive-var/code/main.py

1. **Tokenizer**：多尺度残差 VQ。训练一次后冻结。
2. **尺度 1**：采样 z_1，共 1 个 token。
3. **尺度 2**：在给定 z_1 的条件下并行采样 4 个 token。
4. **尺度 3**：在给定 z_1 和 z_2 的条件下并行采样 16 个 token。
5. **解码**：把所有尺度上采样后的嵌入相加。VAE 解码器生成图像。
6. **玩具运行**：`SCALES = (1, 2, 4, 8)`，`CODEBOOK = 16`。共 4 次前向。

## 故障排查
type: troubleshooting
from: phases/04-computer-vision/09-image-generation-gans/docs/en.md, phases/04-computer-vision/11-stable-diffusion/docs/en.md, phases/04-computer-vision/11-stable-diffusion/code/main.py, phases/04-computer-vision/23-diffusion-transformers-rectified-flow/docs/en.md, phases/08-generative-ai/13-flow-matching-rectified-flows/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 样本多样性下降 | 模式崩溃 | 谱归一化或标签条件 |
| D 准确率 ~100% | D 获胜，G 的梯度消失 | 更小的 D，更低的 D 学习率 |
| 两个损失来回摆动，没有趋势 | G 与 D 轮流获胜 | TTUR：D 学得快 2-4x |
| 样本依赖于 batch | BN 使用 batch 统计量 | 采样前调用 `G.eval()` |
| 严重伪影 | guidance scale 过高 | SD 7.5。Rectified flow 3.5-5 |

## 问答
type: qa
from: phases/04-computer-vision/10-image-generation-diffusion/docs/en.md, phases/04-computer-vision/11-stable-diffusion/docs/en.md, phases/04-computer-vision/23-diffusion-transformers-rectified-flow/docs/en.md, phases/08-generative-ai/13-flow-matching-rectified-flows/docs/en.md, phases/08-generative-ai/19-visual-autoregressive-var/docs/en.md

- **为什么扩散模型容易训练？** 损失是 MSE，没有对抗博弈。
- **为什么 rectified flow 需要的步数更少？** 路径接近直线。
- **为什么 VAR 快？** 一次前向生成一个尺度的全部 token。长度随尺度呈对数增长。
- **为什么 FLUX.1-schnell 用 guidance 0.0？** 它训练时没有使用 CFG。
