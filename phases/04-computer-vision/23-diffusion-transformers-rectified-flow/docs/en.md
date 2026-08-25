# Diffusion Transformers 与 Rectified Flow

> U-Net 并不是 Diffusion 的秘密。把它替换为 Transformer，把 noise schedule 换成直线路径的 flow，你就突然得到了 SD3、FLUX，以及每一个 2026 年的 text-to-image model。

**类型：** 学习 + 构建
**语言：** Python
**前置要求：** Phase 4 Lesson 10 (Diffusion DDPM), Phase 4 Lesson 14 (ViT), Phase 7 Lesson 02 (Self-Attention)
**时间：** 约 75 分钟

## 学习目标

- 追踪从 U-Net DDPM（Lesson 10）到 Diffusion Transformer (DiT)、MMDiT (SD3)，以及 single+double-stream DiT (FLUX) 的演进
- 解释 rectified flow：为什么 noise 与 data 之间的直线轨迹能让 model 用 20 步而不是 1000 步完成采样
- 实现一个 tiny DiT block 和一个 rectified-flow training loop，两者都控制在 100 行以内
- 按 architecture、parameter count 和 licensing 区分 model variants（SD3、FLUX.1-dev、FLUX.1-schnell、Z-Image、Qwen-Image）

## 问题

Lesson 10 用 U-Net denoiser 构建了一个 DDPM。这个配方主导了 2020-2023 年：U-Net + beta schedule + noise-prediction loss。它产生了 Stable Diffusion 1.5、2.1 和 DALL-E 2。

每一个 2026 年最先进的 text-to-image model 都已经越过了它。Stable Diffusion 3、FLUX、SD4、Z-Image、Qwen-Image、Hunyuan-Image——没有一个使用 U-Net。它们使用 Diffusion Transformers (DiT)。SD3 和 FLUX 还把 DDPM noise schedule 换成了 rectified flow，这会把从 noise 到 data 的路径拉直，并通过 consistency 或 distilled variants 支持 1-4 步 inference。

这个转变很重要，因为它正是 diffusion-based image generation 变得可控、prompt-accurate（SD3/SD4 解决了文本渲染）且足够快以投入生产的原因。理解 DiT + rectified flow，就是理解 2026 年的 generative-image stack。

## 核心概念

### 从 U-Net 到 Transformer

```mermaid
flowchart LR
    subgraph UNET["DDPM U-Net (2020)"]
        U1["Conv encoder"] --> U2["Conv bottleneck"] --> U3["Conv decoder"]
    end
    subgraph DIT["DiT (2023)"]
        D1["Patch embed"] --> D2["Transformer blocks"] --> D3["Unpatchify"]
    end
    subgraph MMDIT["MMDiT (SD3, 2024)"]
        M1["Text stream"] --> M3["Joint attention<br/>(separate weights per modality)"]
        M2["Image stream"] --> M3
    end
    subgraph FLUX["FLUX (2024)"]
        F1["Double-stream blocks<br/>(text + image separate)"] --> F2["Single-stream blocks<br/>(concat + shared weights)"]
    end

    style UNET fill:#e5e7eb,stroke:#6b7280
    style DIT fill:#dbeafe,stroke:#2563eb
    style MMDIT fill:#fef3c7,stroke:#d97706
    style FLUX fill:#dcfce7,stroke:#16a34a
```

- **DiT**（Peebles & Xie, 2023）——用一个类似 ViT 的 Transformer 替换 U-Net，在 latent patches 上运行。通过 adaptive layer norm (AdaLN) 进行 conditioning。
- **MMDiT**（SD3, Esser et al., 2024）——为 text tokens 和 image tokens 使用两个拥有独立 weights 的 streams，并共享一个 joint attention。
- **FLUX**（Black Forest Labs, 2024）——前 N 个 blocks 像 SD3 一样采用 double-stream，后续 blocks 将 tokens concatenate 并共享 weights（single-stream），以提高更深层结构的效率。
- **Z-Image**（2025）——一个 6B parameters 的高效 single-stream DiT，挑战了“不惜一切代价扩大规模”的思路。

### 用一段话解释 Rectified flow

DDPM 将 forward process 定义为一个 noisy SDE，其中 `x_t` 被逐步破坏。学习到的 reverse 是第二个 SDE，需要用 1000 个小步求解。

Rectified flow 定义了 clean data 与 pure noise 之间的**直线**插值：

```
x_t = (1 - t) * x_0 + t * epsilon,     t in [0, 1]
```

训练一个网络来预测 velocity `v_theta(x_t, t) = epsilon - x_0`——也就是沿着从 clean data 到 noise 的直线路径的 forward direction（`dx_t/dt`）。采样时，你向后积分这个 velocity，从 noise 逐步走向 data。得到的 ODE 更接近直线，因此采样所需的 integration steps 要少得多。

SD3 将其称为 **Rectified Flow Matching**。FLUX、Z-Image 和大多数 2026 年 model 使用相同的 objective。典型 inference：20-30 个 Euler steps（deterministic），相比旧 DDPM 体系中的 50+ DDIM steps。Distilled / turbo / schnell / LCM variants 可以把它降到 1-4 步。

### AdaLN conditioning

DiTs 通过 **adaptive layer norm** 在 timestep 和 class/text 上做 conditioning：从 conditioning Vector 中预测 `scale` 和 `shift`，并在 LayerNorm 之后应用它们。这比 U-Nets 中 FiLM-style modulation 更干净，也是每个现代 DiT 的默认做法。

```
cond -> MLP -> (scale, shift, gate)
norm(x) * (1 + scale) + shift, then residual add * gate
```

### SD3 和 FLUX 中的 text encoders

- **SD3** 使用三个 text encoders：两个 CLIP models + T5-XXL。Embeddings 被 concatenated 后作为 text conditioning 送入 image stream。
- **FLUX** 使用一个 CLIP-L + T5-XXL。
- **Qwen-Image / Z-Image** variants 使用与其 base LLMs 对齐的自研 text encoders。

Text encoder 是 SD3/FLUX 之所以比 SD1.5 更能理解 prompts 的重要原因。单独 T5-XXL 就有 4.7B params。

### Classifier-free guidance 仍然成立

Rectified flow 改变的是 sampler，而不是 conditioning。Classifier-free guidance（训练时以 10% 概率丢弃 text，inference 时混合 conditional 和 unconditional predictions）在 rectified flow 中同样适用。大多数 2026 年 model 使用 guidance scale 3.5-5——低于 SD1.5 的 7.5，因为 rectified-flow models 默认就更紧密地遵循 prompts。

### Consistency、Turbo、Schnell、LCM

四个名称指向同一个想法：把一个慢速 many-step model distil 成一个快速 few-step model。

- **LCM (Latent Consistency Model)**——训练一个 student，使其能从任意 intermediate `x_t` 一步预测最终的 `x_0`。
- **SDXL Turbo / FLUX schnell**——使用 adversarial diffusion distillation 训练的 1-4 步 models。
- **SD Turbo**——将 OpenAI-style Consistency Models 适配到 latent diffusion。

任何新 model 的生产服务通常都会同时发布一个“full quality” checkpoint 和一个“turbo / schnell” variant。Schnell（德语中的“fast”，Black Forest Labs 的命名惯例）在 1-4 步内运行，并适合 real-time pipelines。

### 2026 年的 Model landscape

| Model | Size | Architecture | License |
|-------|------|--------------|---------|
| Stable Diffusion 3 Medium | 2B | MMDiT | SAI Community |
| Stable Diffusion 3.5 Large | 8B | MMDiT | SAI Community |
| FLUX.1-dev | 12B | Double + Single Stream DiT | non-commercial |
| FLUX.1-schnell | 12B | same, distilled | Apache 2.0 |
| FLUX.2 | — | iterated FLUX.1 | mixed |
| Z-Image | 6B | S3-DiT (Scalable Single-Stream) | permissive |
| Qwen-Image | ~20B | DiT + Qwen text tower | Apache 2.0 |
| Hunyuan-Image-3.0 | ~80B | DiT | research |
| SD4 Turbo | 3B | DiT + distillation | SAI Commercial |

FLUX.1-schnell 是 2026 年的 open-source 默认选择。Z-Image 是效率领先者。FLUX.2 和 SD4 是当前质量最靠前的 model。

### 为什么这个阶段性转变很重要

DDPM + U-Net 能工作。DiT + rectified flow 工作得**更好、更快，并且扩展得更干净**。这个转变类似 NLP 中从 RNNs 到 transformers 的转变：两种 architectures 解决的是同一个问题，但 transformers 更能扩展，并且现在占据主导地位。每一篇 2026 年关于 image、video 或 3D generation 的论文都使用 DiT-shaped denoiser，并且通常使用 rectified flow objective。U-Net DDPM 现在主要用于教学（Lesson 10）。

```figure
cv3-rectified-flow
```

## 构建它

### 步骤 1：带 AdaLN 的 DiT block

```python
import torch
import torch.nn as nn


class AdaLNZero(nn.Module):
    """
    Adaptive LayerNorm with a gate. Predicts (scale, shift, gate) from the conditioning.
    Init such that the whole block starts as identity ("zero init").
    """

    def __init__(self, dim, cond_dim):
        super().__init__()
        self.norm = nn.LayerNorm(dim, elementwise_affine=False)
        self.mlp = nn.Linear(cond_dim, dim * 3)
        nn.init.zeros_(self.mlp.weight)
        nn.init.zeros_(self.mlp.bias)

    def forward(self, x, cond):
        scale, shift, gate = self.mlp(cond).chunk(3, dim=-1)
        h = self.norm(x) * (1 + scale.unsqueeze(1)) + shift.unsqueeze(1)
        return h, gate.unsqueeze(1)


class DiTBlock(nn.Module):
    def __init__(self, dim=192, heads=3, mlp_ratio=4, cond_dim=192):
        super().__init__()
        self.adaln1 = AdaLNZero(dim, cond_dim)
        self.attn = nn.MultiheadAttention(dim, heads, batch_first=True)
        self.adaln2 = AdaLNZero(dim, cond_dim)
        self.mlp = nn.Sequential(
            nn.Linear(dim, dim * mlp_ratio),
            nn.GELU(),
            nn.Linear(dim * mlp_ratio, dim),
        )

    def forward(self, x, cond):
        h, gate1 = self.adaln1(x, cond)
        a, _ = self.attn(h, h, h, need_weights=False)
        x = x + gate1 * a
        h, gate2 = self.adaln2(x, cond)
        x = x + gate2 * self.mlp(h)
        return x
```

`AdaLNZero` 一开始是一个 identity mapping，因为它的 MLP weights 被初始化为零。训练会把 block 从 identity 逐渐推开；这会显著稳定深层 transformer diffusion models。

### 步骤 2：一个 tiny DiT

```python
def timestep_embedding(t, dim):
    import math
    half = dim // 2
    freqs = torch.exp(-math.log(10000) * torch.arange(half, device=t.device) / half)
    args = t[:, None].float() * freqs[None]
    return torch.cat([args.sin(), args.cos()], dim=-1)


class TinyDiT(nn.Module):
    def __init__(self, image_size=16, patch_size=2, in_channels=3, dim=96, depth=4, heads=3):
        super().__init__()
        self.patch_size = patch_size
        self.num_patches = (image_size // patch_size) ** 2
        self.patch = nn.Conv2d(in_channels, dim, kernel_size=patch_size, stride=patch_size)
        self.pos = nn.Parameter(torch.zeros(1, self.num_patches, dim))
        self.time_mlp = nn.Sequential(
            nn.Linear(dim, dim * 2),
            nn.SiLU(),
            nn.Linear(dim * 2, dim),
        )
        self.blocks = nn.ModuleList([DiTBlock(dim, heads, cond_dim=dim) for _ in range(depth)])
        self.norm_out = nn.LayerNorm(dim, elementwise_affine=False)
        self.head = nn.Linear(dim, patch_size * patch_size * in_channels)

    def forward(self, x, t):
        n = x.size(0)
        x = self.patch(x)
        x = x.flatten(2).transpose(1, 2) + self.pos
        t_emb = self.time_mlp(timestep_embedding(t, self.pos.size(-1)))
        for blk in self.blocks:
            x = blk(x, t_emb)
        x = self.norm_out(x)
        x = self.head(x)
        return self._unpatchify(x, n)

    def _unpatchify(self, x, n):
        p = self.patch_size
        h = w = int(self.num_patches ** 0.5)
        x = x.view(n, h, w, p, p, -1).permute(0, 5, 1, 3, 2, 4).reshape(n, -1, h * p, w * p)
        return x
```

### 步骤 3：Rectified flow training

```python
import torch.nn.functional as F

def rectified_flow_train_step(model, x0, optimizer, device):
    model.train()
    x0 = x0.to(device)
    n = x0.size(0)
    t = torch.rand(n, device=device)
    epsilon = torch.randn_like(x0)
    x_t = (1 - t[:, None, None, None]) * x0 + t[:, None, None, None] * epsilon

    target_velocity = epsilon - x0
    pred_velocity = model(x_t, t)

    loss = F.mse_loss(pred_velocity, target_velocity)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    return loss.item()
```

与 DDPM 的 noise-prediction loss（Lesson 10）相比：结构相同，目标不同。我们不再预测 noise `epsilon`，而是预测 **velocity** `epsilon - x_0`，它沿着直线插值方向从 data 指向 noise。

### 步骤 4：Euler sampler

Rectified flow 是一个 ODE。Euler's method 是最简单的方法，并且对于一个训练良好的 rectified-flow model，在 20+ steps 时几乎和 higher-order solvers 一样准确。

```python
@torch.no_grad()
def rectified_flow_sample(model, shape, steps=20, device="cpu"):
    model.eval()
    x = torch.randn(shape, device=device)
    dt = 1.0 / steps
    t = torch.ones(shape[0], device=device)
    for _ in range(steps):
        v = model(x, t)
        x = x - dt * v
        t = t - dt
    return x
```

20 步。在一个训练好的 model 上，这会产生可与 1000-step DDPM 相比的 samples。

### 步骤 5：端到端 smoke test

```python
import numpy as np

def synthetic_blobs(num=200, size=16, seed=0):
    rng = np.random.default_rng(seed)
    out = np.zeros((num, 3, size, size), dtype=np.float32)
    yy, xx = np.meshgrid(np.arange(size), np.arange(size), indexing="ij")
    for i in range(num):
        cx, cy = rng.uniform(4, size - 4, size=2)
        r = rng.uniform(2, 4)
        mask = (xx - cx) ** 2 + (yy - cy) ** 2 < r ** 2
        colour = rng.uniform(-1, 1, size=3)
        for c in range(3):
            out[i, c][mask] = colour[c]
    return torch.from_numpy(out)
```

用 rectified flow 在这个数据集上训练一个 `TinyDiT`。500 steps 后，sampled outputs 应该看起来像淡淡的彩色 blobs。

## 使用它

对于使用 FLUX / SD3 / Z-Image 的真实 image generation，`diffusers` 为每一个 model 提供统一 API：

```python
from diffusers import FluxPipeline, StableDiffusion3Pipeline
import torch

pipe = FluxPipeline.from_pretrained(
    "black-forest-labs/FLUX.1-schnell",
    torch_dtype=torch.bfloat16,
).to("cuda")

out = pipe(
    prompt="a golden retriever surfing a tsunami, hyperrealistic, studio lighting",
    guidance_scale=0.0,           # schnell was trained without CFG
    num_inference_steps=4,
    max_sequence_length=256,
).images[0]
out.save("surf.png")
```

三行。`FLUX.1-schnell` 四步完成。把 model id 换成 `black-forest-labs/FLUX.1-dev`，即可在带 CFG 的 20-30 steps 下获得更高质量。

对于 SD3：

```python
pipe = StableDiffusion3Pipeline.from_pretrained(
    "stabilityai/stable-diffusion-3.5-large",
    torch_dtype=torch.bfloat16,
).to("cuda")
out = pipe(prompt, guidance_scale=3.5, num_inference_steps=28).images[0]
```

## 交付它

本课会产出：

- `outputs/prompt-dit-model-picker.md`——在给定质量、延迟和 license 约束时，在 SD3、FLUX.1-dev、FLUX.1-schnell、Z-Image、SD4 Turbo 之间做选择。
- `outputs/skill-rectified-flow-trainer.md`——编写一个完整的 rectified flow training loop，包含 AdaLN DiT 和 Euler sampling。

## 练习

1. **（简单）** 在 synthetic blob dataset 上训练上面的 TinyDiT 500 steps。比较使用 10、20 和 50 个 Euler steps 产生的 samples。
2. **（中等）** 通过把一个 learned class Embedding 拼接到 time Embedding 上，加入 text conditioning（按颜色划分的 10 个 blob “classes”）。分别用 class 0、5 和 9 采样，并验证颜色匹配。
3. **（困难）** 计算在同样大小的网络、同样数据、同样训练步数下，rectified-flow 与 DDPM 版本生成 samples 之间的 Fréchet distance（FID proxy）。报告哪一个收敛更快。

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|----------------------|
| DiT | “Diffusion transformer” | 替代 U-Net 作为 diffusion denoiser 的 Transformer；在 patchified latents 上运行 |
| AdaLN | “Adaptive layer norm” | 通过学习到的 scale、shift、gate 进行 timestep/text conditioning，并在 LayerNorm 之后应用；每个现代 DiT 的标准做法 |
| MMDiT | “Multi-modal DiT (SD3)” | 为 text tokens 和 image tokens 使用独立 weight streams，并共享一个 joint self-attention |
| Single-stream / double-stream | “FLUX trick” | 前 N 个 blocks 为 double-stream（每种 modality 使用独立 weights），后续 blocks 为 single-stream（concat + shared weights），以提升效率 |
| Rectified flow | “Straight-line noise-to-data” | data 与 noise 之间的线性插值；网络预测 velocity；inference 所需 ODE steps 更少 |
| Velocity target | “epsilon - x_0” | rectified flow 中的 Regression target；从 clean data 指向 noise |
| CFG guidance | “classifier-free guidance” | 混合 conditional 与 unconditional predictions；rectified-flow models 中仍然使用 |
| Schnell / turbo / LCM | “1-4 step distillation” | 从 full-quality models distill 得到的小步数 variants；用于生产实时场景 |

## 延伸阅读

- [Scalable Diffusion Models with Transformers (Peebles & Xie, 2023)](https://arxiv.org/abs/2212.09748)——DiT 论文
- [Scaling Rectified Flow Transformers (Esser et al., SD3 paper)](https://arxiv.org/abs/2403.03206)——大规模 MMDiT 和 rectified-flow
- [FLUX.1 model card and technical report (Black Forest Labs)](https://huggingface.co/black-forest-labs/FLUX.1-dev)——double + single-stream 细节
- [Z-Image: Efficient Image Generation Foundation Model (2025)](https://arxiv.org/html/2511.22699v1)——6B single-stream DiT
- [Elucidating the Design Space of Diffusion (Karras et al., 2022)](https://arxiv.org/abs/2206.00364)——每一个 diffusion 设计 trade-off 的参考
- [Latent Consistency Models (Luo et al., 2023)](https://arxiv.org/abs/2310.04378)——LCM-LoRA 如何实现 4-step inference
