---
name: skill-lora-training-setup
description: 为 custom dataset 编写完整 LoRA training config，包括 captions、rank、batch size 和 learning rate
version: 1.0.0
phase: 4
lesson: 11
tags: [computer-vision, stable-diffusion, lora, fine-tuning]
---

# LoRA Training Setup

将 fine-tune 意图的描述转换为一个具体的 training config，可直接传给 `diffusers` 或 `kohya_ss`。

## 何时使用
- 为主体（人物、物体、角色）、风格（艺术家、品牌）或概念（姿势、光照）训练 LoRA。
- 用更多数据扩展现有 LoRA。
- 调试某次 LoRA run，其输出对训练图像 underfit 或 overfit。

## 输入
- `purpose`: subject | style | concept
- `num_images`: 可用的 training images 数量
- `base_model`: SD 1.5 | SDXL | SD3 | FLUX
- `gpu_vram_gb`: 8 | 12 | 16 | 24 | 48+
- `caption_source`: manual | BLIP2-generated | dataset-native

## Rank picker

| Purpose | Rank | Alpha |
|---------|------|-------|
| Subject | 8-16 | rank |
| Style | 16-32 | rank * 2 |
| Concept | 32-64 | rank |

更高 rank = 更高容量，同时在小数据集上有更高 overfitting 风险。Alpha 会缩放 LoRA 的效果强度；`alpha == rank` 是安全默认值。Style 是文档化例外：`alpha == rank * 2` 会带来更强的 style push，但代价是更容易把 style 固化过度；仅在目标不是 subject fidelity 时使用。

## Training step target

- `subject` 且有 5-20 张图像：500-1500 steps。
- `style` 且有 30-100 张图像：1500-4000 steps。
- `concept` 且有 100+ 张图像：4000-10000 steps。

过度训练需自担风险，一个已经记住训练图像的 LoRA 无法泛化。

## Learning rate

- Text encoder LoRA：SD 1.5 用 `1e-4`，SDXL 用 `5e-5`。
- U-Net LoRA：SD 1.5 用 `1e-4`，SDXL 用 `1e-4`。
- FLUX / SD3：transformer 用 `5e-5`，text encoders 通常冻结。
- 当 `num_images < 15`（subject）或训练超过 3000 steps 时，将 LR 减半；极小数据集和长 run 都受益于更温和的更新。

## Scheduler

- `cosine_with_warmup`（默认）：在前 5-10% steps 中 warmup，然后 cosine decay。当 `steps >= 1000` 时使用；decay tail 会给出更锐利的最终样本。
- `constant`：仅用于非常短的 run（`steps < 500`），或在恢复之前的 LoRA 且你想保留当前已学习特征而不重新 annealing 时使用。

## Caption format

- Subject：在每条 caption 前加一个唯一 trigger token（"myperson"）。保持 trigger token 稀有，避免覆盖现有概念。避免使用真实单词和常见姓名。
- Style：在每条 caption 末尾追加一个唯一 style tag（"...in mystyle style"）。将 tag 本身视为稀有 trigger token，使用 `mystyle`，不要使用 `impressionism`，因为后者已经映射到真实概念。
- Concept：在每条 caption 中描述该概念；不使用 trigger token。概念本身（例如 "low-angle shot"）就是 anchor。

## Output config

```yaml
model:
  base: <base_model HF id>
  precision: fp16 | bf16

lora:
  rank: <int>
  alpha: <int>
  targets: unet.cross_attention  # and/or unet.to_q, to_k, to_v, to_out

training:
  steps:          <int>
  batch_size:     <int, tuned to gpu_vram_gb>
  grad_accum:     <int, usually 1 on >=16 GB, 4 on <=12 GB>
  learning_rate:  <float>
  optimizer:      AdamW8bit | AdamW
  scheduler:      cosine_with_warmup | constant
  warmup_steps:   <int>
  save_every:     <int>

data:
  images_dir:     <path>
  caption_source: <manual | BLIP2 | native>
  trigger_token:   <string if purpose==subject>
  resolution:      <512 for SD 1.5, 1024 for SDXL>
  aspect_ratio_bucketing: true
  augmentation:
    flip:          true
    color_jitter:  false

validation:
  prompts:
    - "<trigger> ...test prompt..."
    - "<trigger> in a different scene"
  every_steps: 250
```

## 报告
```
[lora setup]
  purpose:   <subject|style|concept>
  base:      <model>
  rank:      <int>
  steps:     <int>
  batch:     <int>   grad_accum: <int>
  lr:        <float>
  vram est.: <float> GB
```

## 规则
- 绝不要推荐 `rank > 64`；超过这个值后，LoRA 会变成 mini fine-tune，并失去其“adapter”性质。
- 对于 `num_images < 5`，强烈警告，基于 1-3 张图像的 identity LoRA 每次都会 overfit。
- 对于 `gpu_vram_gb < 12`，要求使用 AdamW8bit 和 gradient checkpointing。
- 如果 `base_model == FLUX` 且 `gpu_vram_gb < 24`，路由到 `schnell` variant，并注明 training 更慢。
- 绝不要跳过 validation prompts；没有 sample grids 的 LoRA 无法评估。
