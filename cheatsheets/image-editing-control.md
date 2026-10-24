---
id: image-editing-control
title: ControlNet, Inpainting and Image Editing
code: CI
subtitle: 用 Diffusers 做文生图、img2img、inpainting、LoRA 和 ControlNet。旋钮、默认值与修复方法。
hue: 265
sources: phases/08-generative-ai/08-controlnet-lora-conditioning, phases/08-generative-ai/09-inpainting-outpainting-editing, phases/04-computer-vision/11-stable-diffusion
source_hash: a2512a00213a927e
---

## 进入 U-Net 的控制信号
type: architecture
from: phases/08-generative-ai/08-controlnet-lora-conditioning/docs/en.md, phases/04-computer-vision/11-stable-diffusion/docs/en.md

```arch
node | cond | 1,1 | Condition image | depth, pose, edges | client
node | cn | 2,1 | ControlNet | cloned encoder, trainable | model
node | zc | 3,1 | Zero conv | 1×1, starts at zero | process
node | txt | 1,2 | Prompt | | client
node | te | 2,2 | Text encoder | CLIP-L or T5 | model
node | unet | 3,2 | Frozen SD U-Net | cross-attention to text | gpu
node | ref | 1,3 | Reference image | | client
node | ip | 2,3 | IP-Adapter | CLIP image tokens | model
node | lora | 3,3 | LoRA | W + BA in attention | store
edge | cond | cn |
edge | cn | zc | features
edge | zc | unet | added to decoder
edge | txt | te |
edge | te | unet | text tokens
edge | ref | ip |
edge | ip | unet | image tokens
edge | lora | unet | low-rank delta
```

## 文生图
type: annotated-code
lang: python
from: phases/04-computer-vision/11-stable-diffusion/docs/en.md, phases/04-computer-vision/11-stable-diffusion/code/main.py

```python
pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16,            # halves VRAM
).to("cuda")
pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
image = pipe(
    prompt="<prompt>",
    guidance_scale=7.5,                   # CFG scale w, SD default
    num_inference_steps=25,               # matches 50 steps of DDIM
    generator=torch.Generator("cuda").manual_seed(42),
).images[0]
image.save("dog.png")
```

## Img2img、inpaint 与 LoRA
type: annotated-code
lang: python
from: phases/04-computer-vision/11-stable-diffusion/docs/en.md, phases/08-generative-ai/08-controlnet-lora-conditioning/docs/en.md

```python
out = img2img(prompt="<prompt>", image=init_image,
              strength=0.6, guidance_scale=7.5).images[0]     # 0.0 unchanged, 1.0 new
mask = Image.open("dog_mask.png").convert("L").resize((512, 512))
out = inpaint(prompt="<prompt>", image=image,
              mask_image=mask, guidance_scale=7.5).images[0]  # white pixels regenerate
pipe.load_lora_weights("<repo>", weight_name="<file>")
pipe.fuse_lora(lora_scale=0.8)                                # bakes in, no swap
pipe.unfuse_lora()                                            # before another adapter
pipe.set_adapters([...], adapter_weights=[...])               # per-request LoRA mix
```

## 代码中的任务
type: task-table
from: phases/04-computer-vision/11-stable-diffusion/docs/en.md, phases/04-computer-vision/11-stable-diffusion/code/main.py, phases/08-generative-ai/09-inpainting-outpainting-editing/docs/en.md

| 任务 | 代码 |
|---|---|
| 安装依赖栈 | `pip install diffusers transformers accelerate` |
| 图生图 | `StableDiffusionImg2ImgPipeline` |
| 用 SD inpaint | `StableDiffusionInpaintPipeline` |
| 用 Flux inpaint | `FluxFillPipeline` |
| 随机采样器 | `EulerAncestralDiscreteScheduler` |
| 编码为 latent | `pipe.image_processor.preprocess(img)` |
| 复用旧 latent | 传入 `latents=...`，省去一次 VAE 编码 |
| 缩放 VAE latent | `latent_dist.sample() * 0.18215` |

## 感知 mask 的反向循环
type: flow
from: phases/08-generative-ai/09-inpainting-outpainting-editing/code/main.py, phases/08-generative-ai/09-inpainting-outpainting-editing/docs/en.md

1. **开始**：每个维度都从 N(0, I) 抽取 `x`。
2. **重新注入**：把干净的源图加噪到第 t 步，写入每个未被 mask 的维度。
3. **预测**：去噪器在第 t 步为 `x` 给出 `eps_hat`。
4. **反向**：计算 DDPM 均值。t > 0 时加噪。
5. **重复**：从 t = T - 1 一直到 0。
6. **固定**：最后把干净值复制到未被 mask 的维度。
7. **Outpaint**：反转 mask。训练目标保持不变。

## 公式与数字
type: concepts
from: phases/04-computer-vision/11-stable-diffusion/docs/en.md, phases/08-generative-ai/08-controlnet-lora-conditioning/docs/en.md, phases/08-generative-ai/09-inpainting-outpainting-editing/docs/en.md

- **CFG**：$\epsilon = \epsilon_{\text{uncond}} + w \cdot (\epsilon_{\text{cond}} - \epsilon_{\text{uncond}})$
- **LoRA**：$W' = W + \alpha \cdot B A$，$r \ll d$。新参数量为 $2 \cdot d \cdot r$，而不是 $d^2$。
- **LoRA 大小**：$d=640$、$r=16$ 时为 20k 参数，而不是 410k。
- **ControlNet 混合**：`features += weight_a * control_a(depth) + weight_b * control_b(pose)`
- **Latent diffusion**：从 3x512x512 到 4x64x64，计算量减少 48x。
- **Inpaint U-Net**：9 个输入通道。噪声 latent 4 个，编码图像 4 个，mask 1 个。
- **SDEdit t/T**：0.3 几乎就是原图。0.6 保留粗结构。0.9 接近噪声。
- **Zero conv**：ControlNet 初始为恒等映射。训练前不会造成损害。

## 编辑方法对比
type: comparison
from: phases/08-generative-ai/09-inpainting-outpainting-editing/docs/en.md, phases/04-computer-vision/11-stable-diffusion/docs/en.md
span: 2

| 因素 | Inpaint 模型 | SDEdit 或 img2img | InstructPix2Pix | RePaint |
|---|---|---|---|---|
| 输入 | 图像、mask、prompt | 图像、噪声水平、prompt | 图像与指令 | 图像与 mask |
| 训练 | 9 通道 U-Net | 无 | 在三元组上微调 | 无，无条件模型 |
| 保留 | mask 外的像素 | 粗结构 | 输入的结构 | mask 外的像素 |
| 主要旋钮 | mask 与 CFG | `t/T` 或 `strength` | image scale 与 text scale | 重采样步数 |
| 用途 | 移除物体、替换天空 | 某个区域的风格 | "make it sunset" | 手头没有 inpaint 模型 |

## 条件控制工具对比
type: comparison
from: phases/08-generative-ai/08-controlnet-lora-conditioning/docs/en.md
span: 2

| 因素 | ControlNet | LoRA | IP-Adapter | DreamBooth |
|---|---|---|---|---|
| 控制 | 空间结构 | 风格、主体、概念 | 参考图的外观 | 单个主体 |
| 大小 | 70-360MB | 20-200MB | 20MB | 2-5GB |
| 机制 | 克隆编码器，zero-conv skip | 注意力上的低秩增量 | cross-attention 中的 CLIP 图像 token | 全量微调 |
| 适用场景 | 精确布局或构图 | 个性化或风格 | 外观无法用文字描述 | 强身份一致性，算力充足 |

## 默认值
type: defaults
from: phases/04-computer-vision/11-stable-diffusion/docs/en.md, phases/04-computer-vision/11-stable-diffusion/code/main.py, phases/08-generative-ai/08-controlnet-lora-conditioning/docs/en.md, phases/08-generative-ai/09-inpainting-outpainting-editing/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `guidance_scale` | 7.5 | SD 默认 CFG 强度 |
| `num_inference_steps` | 25 | 配合 DPM-Solver++ |
| img2img `strength` | 0.6 | 风格迁移用 0.5-0.7 |
| CFG 训练中丢弃 prompt 的比例 | 10% | 提供无条件分支 |
| VAE 缩放因子 | 0.18215 | SDXL 用 0.13025 |
| LoRA rank `r` | 4-16 | 重度微调用 64-128 |
| ControlNet 权重之和 | 1.0 | 安全的默认值 |
| Mask 膨胀像素数 | 8-16 | 隐藏接缝 |

## 故障排查
type: troubleshooting
from: phases/08-generative-ai/08-controlnet-lora-conditioning/docs/en.md, phases/08-generative-ai/09-inpainting-outpainting-editing/docs/en.md, phases/04-computer-vision/11-stable-diffusion/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 输出过度风格化或崩坏 | LoRA α 为 2 或 3 | α 保持在 1.5 或以下 |
| 姿态加深度过冲 | 两个 ControlNet 权重都是 1.0 | 让权重之和为 1.0 |
| LoRA 没有效果 | 在 SD 1.5 上用了 SDXL LoRA | 匹配基础模型 |
| 无法加载另一个 LoRA | `fuse_lora` 把它烘焙进去了 | 先调用 `pipe.unfuse_lora()` |
| mask 处有明显接缝 | 朴素重新注入 | 膨胀 mask 或使用 9 通道模型 |
| 色块过饱和 | 小 mask 上 CFG 过高 | 小编辑降低 CFG |
| 主体失去身份特征 | SDEdit `t/T` 从 0.5 到 0.6 | 扫描参数并保存 checkpoint |
| 填充内容无视场景 | Prompt 只描述了新内容 | 描述整张图像 |

## 何时用哪个
type: tips
from: phases/08-generative-ai/08-controlnet-lora-conditioning/docs/en.md, phases/08-generative-ai/09-inpainting-outpainting-editing/docs/en.md, phases/04-computer-vision/11-stable-diffusion/docs/en.md

- **ControlNet-Openpose + SDXL + 文本**：带 prompt 的特定姿态。
- **ControlNet-Scribble 或 ControlNet-Canny**：精确布局。
- **在 ~30 张精选图像上训练 rank 32 的 LoRA**：品牌艺术风格。
- **SD-Inpaint 或 Flux-Fill**：在小 mask 下移除物体。
- **先用 SAM 生成 mask，再用 SD-Inpaint**：背景替换。
- **InstructPix2Pix 或 Flux-Kontext**：无需 mask 的指令编辑。
- **LCM-LoRA**：延迟低于 1s。

## 问答
type: qa
from: phases/08-generative-ai/08-controlnet-lora-conditioning/docs/en.md, phases/08-generative-ai/09-inpainting-outpainting-editing/docs/en.md, phases/04-computer-vision/11-stable-diffusion/docs/en.md

- **为什么 ControlNet 的门控初始化为零？** 第 0 步时输出与基础模型完全相同。
- **合并 LoRA 还是热切换？** 热切换。合并快 3-5%，但会冻结 α 和基础模型。
- **为什么 strength 1.0 会无视输入？** 它加入完整噪声，结果是完全重新生成。
- **为什么用 9 通道模型而不是重新注入？** 模型能看到 mask 周围的上下文。
- **训练后能更换调度器吗？** 能。调度器状态与 U-Net 权重解耦。
- **多一个 ControlNet 的代价？** 每个启用的 ControlNet 约按 1.5× 步耗时预算。
