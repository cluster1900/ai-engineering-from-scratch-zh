---
name: skill-rectified-flow-trainer
description: 编写一个包含 AdaLN DiT 和 Euler sampling 的完整 rectified-flow training loop
version: 1.0.0
phase: 4
lesson: 23
tags: [diffusion, rectified-flow, DiT, training]
---

# Rectified Flow Trainer

生成一个干净、最小的 training loop，可以在任意图像 Tensor 数据集上成功训练一个使用 rectified flow 的小型 DiT。

## 使用时机

- 在小规模上复现 SD3 / FLUX training objective。
- 在同一数据上 benchmark rectified flow 与 DDPM。
- 为非标准领域（medical、satellite）构建自定义 rectified-flow 模型。

## 输入

- `model`: 一个 `nn.Module`，接收 `(x, t)` 并返回预测 velocity。
- `dataset`: 模型领域中 clean images 的 iterable。
- `optimizer`: AdamW，使用 `lr=1e-4`、`weight_decay=0.01`、`betas=(0.9, 0.99)`。
- `scheduler`: 带 warmup 的 cosine，默认 1000 warmup steps。

## Training step

```python
def rectified_flow_train_step(model, x0, optimizer, device):
    model.train()
    x0 = x0.to(device)
    n = x0.size(0)
    t = torch.rand(n, device=device)                     # uniform in [0, 1]
    epsilon = torch.randn_like(x0)
    x_t = (1 - t[:, None, None, None]) * x0 + t[:, None, None, None] * epsilon
    target_v = epsilon - x0                              # velocity target
    pred_v = model(x_t, t)
    loss = F.mse_loss(pred_v, target_v)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    return loss.item()
```

## Sampling (Euler)

```python
@torch.no_grad()
def sample(model, shape, steps=20, device="cpu"):
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

## 提示

- 使用 `torch.rand` uniform `t`；对 `t` 使用 logit-normal 或 Sd3-style weighted sampling 会略有帮助，但入门时不是必需的。
- model weights 的 EMA 是标准实践；维护一个 decay 为 0.9999 的 `ema_model`。
- 条件模型的 Classifier-free guidance：训练时以 10% 概率将 conditioning 替换为空 / null Embedding；inference 时用 `v_uncond + w * (v_cond - v_uncond)` 混合，其中 `w` 约为 3-5。
- 对于 LDM-style training（FLUX、SD3），整个 loop 运行在 VAE latent space 中；上面的 clean `x0` 实际上是 `VAE.encode(image)`。
- 在 32x32 toy dataset 上的典型收敛：2000-5000 steps。在真实 latent SD3 training 中：数十万 steps。

## 报告

```
[rectified flow training]
  steps:        <int>
  final loss:   <float>
  ema decay:    <float>
  vae?:         yes | no
  cfg dropout:  <fraction>

[sampling]
  default steps: 20
  schnell / turbo target: 4
  full quality reference: 50+ (for comparison only)
```

## 规则

- 绝不要在 RGB `uint8` 数据上用 image-space velocity target 训练 rectified flow；先 normalise 到零均值、单位方差。
- 始终按 timestep-bucket 记录 training loss；如果早期 timesteps（接近 0）的 loss 高于晚期 timesteps（接近 1），velocity parameterisation 很可能接错了。
- 不要在同一个 training loop 中混用 rectified-flow velocity target 和 DDPM noise target；二选一。
- 在 Ampere+ GPUs 上使用 bfloat16 training；float16 有时会因为 velocity magnitude 在 rectified flow 中产生 NaN grads。
