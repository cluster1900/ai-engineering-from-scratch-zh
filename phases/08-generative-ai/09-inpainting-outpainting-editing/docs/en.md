# Inpainting, Outpainting 与 Image Editing

> Text-to-image 会生成新内容。Inpainting 会修复旧内容。在生产环境中，70% 可计费的图像工作都是编辑：替换背景、移除 logo、扩展画布、重新生成一只手。Inpainting 正是 Diffusion 体现价值的地方。

**Type:** Build
**Languages:** Python
**先修要求:** Phase 8 · 07 (Latent Diffusion), Phase 8 · 08 (ControlNet & LoRA)
**Time:** ~75 minutes

## 问题
客户发来一张完美的产品照片，但背景里有一个分散注意力的标志。你想擦除这个标志，同时让其他所有像素保持完全一致。你不能从零运行 text-to-image，因为结果会有不同的颜色、不同的光照、不同的产品角度。你想只重新生成被 mask 的区域，并且希望重新生成结果尊重周围上下文。

这就是 Inpainting。它的变体包括：

- **Inpainting.** 在 mask 内部重新生成，保留外部像素。
- **Outpainting.** 在 mask 外部重新生成（或扩展到画布之外），保留内部。
- **Image editing.** 重新生成整张图像，但保持与原图的语义或结构一致性（SDEdit, InstructPix2Pix）。

2026 年的每个 Diffusion pipeline 都会提供 inpainting mode。Flux.1-Fill、Stable Diffusion Inpaint、SDXL-Inpaint、DALL-E 3 Edit。它们基于同一个原则工作。

## 概念
![Inpainting: mask-aware denoising with context-preserving reinjection](../assets/inpainting.svg)

### 朴素方法（以及它为什么是错的）

带着 mask 运行标准 text-to-image。在每个 sampling step，把 noisy latent 的未 mask 区域替换为 clean image 经过 forward-diffused 后的版本。它能工作……但效果很差。边界伪影会渗出，因为模型不知道被 mask 区域里应该有什么。

### 合适的 inpainting 模型

训练一个修改过的 U-Net，输入通道数从 4 变成 9：

```
input = concat([ noisy_latent (4ch), encoded_image (4ch), mask (1ch) ], dim=channel)
```

额外通道是一份经过 VAE 编码的源图像副本，以及一个单通道 mask。训练时，你随机 mask 图像区域，并训练模型只对被 mask 区域 denoise，同时把未 mask 区域作为 clean conditioning signal 提供。推理时，模型可以“看到”被 mask 区域周围是什么，并生成连贯的补全结果。

SD-Inpaint、SDXL-Inpaint、Flux-Fill 都使用这种 9-channel（或类似）输入。Diffusers `StableDiffusionInpaintPipeline`, `FluxFillPipeline`.

### SDEdit (Meng et al., 2022) — 自由编辑

把噪声加到源图像，直到某个中间 `t`，然后用新的 prompt 从 `t` 反向运行到 0。无需重新训练。起始 `t` 的选择会在保真度和创作自由度之间取舍：

- `t/T = 0.3` → 几乎与源图相同，只有小的风格变化
- `t/T = 0.6` → 中等编辑，保留粗略结构
- `t/T = 0.9` → 接近从纯噪声生成，源图保留最少

### InstructPix2Pix (Brooks et al., 2023)

在 `(input_image, instruction, output_image)` 三元组上 fine-tune 一个 Diffusion model。推理时，同时基于输入图像和文本指令（"make it sunset", "add a dragon"）进行 conditioning。两个 CFG scales：image scale 和 text scale。

### RePaint (Lugmayr et al., 2022)

保留一个标准的 unconditional Diffusion model。在每个 reverse step 进行 resample：偶尔跳回到更 noisy 的状态并重新生成。这样可以避免边界伪影。在你没有训练好的 inpainting model 时使用。

## 构建它
`code/main.py` 在 5 维数据上实现了一个玩具 1-D inpainting 方案。我们在 5-D mixture data 上训练一个 DDPM，其中每个样本都是来自两个 cluster 之一的 5 个浮点数。推理时，我们“mask”5 个维度中的 2 个，在每一步注入未 mask 的 3 个维度的 noisy-forward 版本，并且只重新生成被 mask 的维度。

### 步骤 1： 5-D DDPM data

```python
def sample_data(rng):
    cluster = rng.choice([0, 1])
    center = [-1.0] * 5 if cluster == 0 else [1.0] * 5
    return [c + rng.gauss(0, 0.2) for c in center], cluster
```

### 步骤 2： train denoiser over all 5 dims

标准 DDPM。Net 对 5-D noisy input 输出 5-D noise prediction。

### 步骤 3： at inference, mask-aware reverse

```python
def inpaint_step(x_t, mask, clean_image, alpha_bars, t, rng):
    # replace unmasked dims with a freshly noised version of the clean source
    a_bar = alpha_bars[t]
    for i in range(len(x_t)):
        if not mask[i]:
            x_t[i] = math.sqrt(a_bar) * clean_image[i] + math.sqrt(1 - a_bar) * rng.gauss(0, 1)
    # ...then run the normal reverse step on x_t
```

这是 naive approach，它在玩具 1-D 数据上能工作。真实图像 inpainting 会使用 9-channel 输入，因为纹理连贯性更重要。

### 步骤 4： outpainting

Outpainting 就是把 mask 反转后的 inpainting：mask 新的（之前不存在的）画布，用原图填充其余区域。训练目标完全相同。

## 陷阱
- **Seams.** naive approach 会留下可见边界，因为 Gradient 信息不会跨 mask 流动。修复方法：把 mask 膨胀 8-16 像素，或使用 proper inpainting model。
- **Mask leakage.** 如果 conditioning image 的未 mask 区域质量低或有噪声，它会污染 mask 内部的生成。先 denoise，或轻微 blur。
- **CFG interacts with mask size.** 小 mask 上使用高 CFG = 过饱和 patch。小编辑要降低 CFG。
- **SDEdit fidelity cliff.** 从 `t/T = 0.5` 到 `t/T = 0.6` 可能会丢失主体身份。做 sweep 并 checkpoint。
- **Prompt mismatch.** prompt 应该描述*整张*图像，而不仅是新内容。应该是 "A cat sitting on a chair"，不是 "a cat"。

## 使用它
| Task | Pipeline |
|------|----------|
| 移除物体，小 mask | SD-Inpaint 或 Flux-Fill，标准 prompt |
| 替换天空 | SD-Inpaint + "blue sky at sunset" |
| 扩展画布 | SDXL outpaint mode（8px feather）或带 outpaint mask 的 Flux-Fill |
| 重新生成手 / 脸 | SD-Inpaint，并用 prompt 重新描述主体 + ControlNet-Openpose |
| 改变某个区域的风格 | 在被 mask 区域上使用 `t/T=0.5` 的 SDEdit |
| "Make it sunset" | InstructPix2Pix 或 Flux-Kontext |
| 背景替换 | SAM mask → SD-Inpaint |
| 超高保真 | 最难场景使用 Flux-Fill 或 GPT-Image（hosted） |

SAM（Meta 的 Segment Anything, 2023）+ Diffusion inpaint 是 2026 年的背景移除 pipeline。SAM 2（2024）适用于视频。

## 交付它
保存 `outputs/skill-editing-pipeline.md`。Skill 接收原始图像 + 编辑描述 + 可选 mask（或 SAM prompt），并输出：mask-generation approach、base model、CFG scales（image + text）、SDEdit-t 或 inpainting mode，以及 QA checklist。

## 练习
1. **Easy.** 在 `code/main.py` 中，把被 mask 维度的比例从 0.2 变化到 0.8。在哪个比例下，inpaint quality（masked dims 中的 residual）等于 unconditional generation？
2. **Medium.** 实现 RePaint：每第 10 个 reverse step，跳回 5 步（添加噪声）并重新 denoise。衡量它是否降低 mask 边缘处的 boundary residual。
3. **Hard.** 使用 Hugging Face diffusers 比较：SD 1.5 Inpaint + ControlNet-Openpose vs Flux.1-Fill，在 20 个 face-regeneration task 上测试。分别评分 pose adherence 和 identity preservation。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Inpainting | "Fill the hole" | 在 mask 内部重新生成；保留外部像素。 |
| Outpainting | "Extend the canvas" | 在画布外部重新生成；保留内部。 |
| 9-channel U-Net | "Proper inpainting model" | 以 `noisy | encoded-source | mask` 作为输入的 U-Net。 |
| SDEdit | "Img2img with noise level" | 加噪到时间 `t`，再用新 prompt denoise。 |
| InstructPix2Pix | "Text-only edits" | 在 (image, instruction, output) 三元组上 fine-tuned 的 Diffusion。 |
| RePaint | "No retraining" | 在 reverse 过程中周期性 re-noise，以减少 seams。 |
| SAM | "Segment Anything" | 通过点击或框生成 mask 的工具；与 inpaint 搭配使用。 |
| Flux-Kontext | "Edit with context" | 接收 reference image + instruction 进行编辑的 Flux 变体。 |

## Production note：edit pipelines 对 latency 敏感

用户编辑图像时期待低于 5 秒的往返时间。1024² 下 30-step SDXL-Inpaint 在 L4 上需要 3-4 s，另外还有 SAM mask generation（~200 ms）和 VAE encode/decode（合计 ~500 ms）。从生产环境视角看，这受 TTFT 限制，而不是受 throughput 限制：batch 1、低并发、尽量减少每个阶段的耗时：

- **SAM-H is the slow one.** 1024² 下 SAM-H 约为 ~200 ms；SAM-ViT-B 约为 ~40 ms，只有轻微质量损失。SAM 2（video）会增加时间维度开销；不要用于单图编辑。
- **Skip the encode when possible.** `pipe.image_processor.preprocess(img)` 会编码到 latents。如果你已经有上一轮生成的 latents（迭代式编辑 UI 中很常见），直接通过 `latents=...` 传入，跳过一次 VAE encode。
- **Mask dilation matters for throughput too.** 小 mask 意味着大部分 U-Net forward pass 都被浪费（未 mask 像素反正会被 clamp）。`diffusers` 的 `StableDiffusionInpaintPipeline` 无论如何都会运行完整 U-Net；只有 9-channel proper-inpaint 变体会利用 masked compute。
- **Flux-Kontext is the 2025 answer.** 对 `(source_image, instruction)` 进行单次 forward pass：没有单独 mask，没有 SDEdit noise sweep。在 H100 上约 ~1.5 s 就能交付一次编辑。架构层面的经验是：合并阶段。

## 延伸阅读
- [Lugmayr et al. (2022). RePaint: Inpainting using Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2201.09865) — 无需训练的 inpainting。
- [Meng et al. (2022). SDEdit: Guided Image Synthesis and Editing with Stochastic Differential Equations](https://arxiv.org/abs/2108.01073) — SDEdit。
- [Brooks, Holynski, Efros (2023). InstructPix2Pix](https://arxiv.org/abs/2211.09800) — 文本指令编辑。
- [Kirillov et al. (2023). Segment Anything](https://arxiv.org/abs/2304.02643) — SAM，mask 来源。
- [Ravi et al. (2024). SAM 2: Segment Anything in Images and Videos](https://arxiv.org/abs/2408.00714) — video SAM。
- [Hertz et al. (2022). Prompt-to-Prompt Image Editing with Cross-Attention Control](https://arxiv.org/abs/2208.01626) — Attention-level editing。
- [Black Forest Labs (2024). Flux.1-Fill and Flux.1-Kontext](https://blackforestlabs.ai/flux-1-tools/) — 2024 工具链。
