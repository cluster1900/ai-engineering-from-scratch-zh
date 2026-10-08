# 涂料,外涂料与图像编辑

> 在生产环境中,70%可计费的图像工作都是编辑:替换背景"",移除标志"",扩展画布"",重新生成一只手"",涂料正是传播体现价值的地方――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 8 · 08 (ControlNet & LoRA)
**Time:** ~75 minutes

## 问题

客户发送一个完美的产品照片,但背景有一个分散注意力的标志. 你想抹去标志,并让其他所有部分保持像素级一致. 你不能从头运行文到图像,因为结果将会有不同的颜色,不同的光照,不同的产品角度.

这就是涂料.

- **Inpainting.**在面具内重生,保留外部像素.
- **Outpainting.**在面具外重新生成 (或扩展到画布外),保留内部.
- **Image editing.**重新生成整张图,但保持与原图的语义或结构一致性.

2026年每条扩散管道都带有涂料模式――Flux.1-Fill、Stable Diffusion Inpaint、SDXL-Inpaint、DALL-E 3 Edit──它们基于同一个原理──

## 概念

![Inpainting: mask-aware denoising with context-preserving reinjection](../assets/inpainting.svg)

### 简单的方法,以及为什么它是错误的)

带着面具运行标准文本到图像――在每一步采样中,把噪音潜伏中未面具的区域替换为前进散布的干净图像――它能工作......但效果很差――边界文物会出,因为模型不知道面具在区域应该有什么――

### 正确的涂料模型

训练一个修改的U-Net,让它接收9个输入频道,而不是4个:

```
input = concat([ noisy_latent (4ch), encoded_image (4ch), mask (1ch) ], dim=channel)
```

额外的频道是VAE编码的源图像的副本,加上单个频道面具. 训练时,你随机面具 图像中的区域,并训练模型只对面具 区域表示,同时把未面具 区域作为干净的条件信号提供. 推理时,模型可以看到面具 区域周围的内容,并产生连贯补充.

通过此,我们可以使用这种9通道的输入和散器.`StableDiffusionInpaintPipeline`,我知道.`FluxFillPipeline`,我知道.

### 免费编辑:SDEdit (Meng et al., 2022)

给图像源增加噪音到某个中间`t`然后使用新的提示从`t`反向运行到0──不需要重新训练──起始`t`选择会在保真与创作自由之间权衡:

- `t/T = 0.3`→ 几乎与源图一致,只做小的风格变化
- `t/T = 0.6`→ 中等编辑,保留粗略结构
- `t/T = 0.9`接近噪音 生成,对源图保留最小

### 导读Pix2Pix (布鲁克斯等, 2023)

在`(input_image, instruction, output_image)`三元组上细调 一个扩散模型――推理时,同时基于输入图像和文本指令――使它日落、添加龙)进行调节――有两个CFG尺度:图像尺度和文本尺度――

### 复刻 (Lugmayr等, 2022)

保留一个标准无条件扩散模型──在每一步反向,进行再样本:偶尔跳回更的状态并重新生成──这样可以避免边界文物──当你没有训练好的涂料模型时使用──


```figure
inpaint-mask-reinject
```

## 建立它

`code/main.py`在5维数据上实现了一个玩具版1D涂料方案. 我们在5维混合数据上训练一个DDPM,其中每个样本都是来自两个集群中的5个浮游.

### 步骤1- 5D 关于DDPM数据

```python
def sample_data(rng):
    cluster = rng.choice([0, 1])
    center = [-1.0] * 5 if cluster == 0 else [1.0] * 5
    return [c + rng.gauss(0, 0.2) for c in center], cluster
```

### 步骤 2: 在所有 5 个维度上训练指标

标准 DDPM──网络对5D噪音输入输出5D噪音预测──

### 步骤3:推理时使用面具意识反向

```python
def inpaint_step(x_t, mask, clean_image, alpha_bars, t, rng):
    # replace unmasked dims with a freshly noised version of the clean source
    a_bar = alpha_bars[t]
    for i in range(len(x_t)):
        if not mask[i]:
            x_t[i] = math.sqrt(a_bar) * clean_image[i] + math.sqrt(1 - a_bar) * rng.gauss(0, 1)
    # ...then run the normal reverse step on x_t
```

这是简单的方法,而且它在玩具1-D 数据上有效.

### 步骤4:涂料

涂料就是把面具反转后的涂料:面具新的 (之前不存在的) 画布区域,用原图填满其余部分――训练目标完全相同――

## 陷

- **Seams.**朴素方法会留下可见边界,因为渐进式信息不会跨越面具流动――修复方式:把面具膨胀 8-16个像素,或使用正确的涂料模型――
- **Mask leakage.**如果空调图像的区域质量低或有噪音,它会污染面具的内生成.
- **CFG interacts with mask size.**小编辑应降低CFG──
- **SDEdit fidelity cliff.**从`t/T = 0.5`到了`t/T = 0.6`需要扫描和检查点.
- **Prompt mismatch.**快速描述整张图,而不只是新内容──用 猫坐在椅子上,而不是猫──

## 用它

| Task | Pipeline |
|------|----------|
| 移除物体，小 mask | SD-Inpaint 或 Flux-Fill，标准 prompt |
| 替换天空 | SD-Inpaint + "blue sky at sunset" |
| 扩展画布 | SDXL outpaint mode（8px feather）或带 outpaint mask 的 Flux-Fill |
| 重新生成手 / 脸 | SD-Inpaint，prompt 重新描述主体 + ControlNet-Openpose |
| 改变某个区域的风格 | 在 mask 区域上使用 `t/T=0.5` 的 SDEdit |
| "Make it sunset" | InstructPix2Pix 或 Flux-Kontext |
| 背景替换 | SAM mask → SD-Inpaint |
| 超高保真 | 最难场景使用 Flux-Fill 或 GPT-Image（hosted） |

随时使用的信息,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看,在线观看.

## 运送它

保存`outputs/skill-editing-pipeline.md`〔技能 接收一张原图 + 编辑描述 + 可选面具(或 SAM提示),并输出:面具 生成方法、基模型、CFG尺度(图片 + 文字)、SDEdit-t 或涂料模式,以及QA检查列表──

## 练习

1. **Easy.**在`code/main.py`中,把被面具的维度比例从0.2 变到0.8 ⋅在哪个比例下,涂料质量 (面具维度中的残余) 等于无条件生成?
2. **Medium.**实现重绘:每到第十个反向步骤,跳回5步,并重新指标――测量它是否降低了面具边缘的边界残留――
3. **Hard.**使用 Hugging Face diffusers 比较:SD 1.5 涂料+控制网-开放用 与 Flux.1-填充,在 20 个脸再生任务上测试──分别评分 占据依赖和身份保护──

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| Inpainting | “填洞” | 在 mask 内重新生成；保留外部像素。 |
| Outpainting | “扩展画布” | 在画布外重新生成；保留内部。 |
| 9-channel U-Net | “正确的 inpainting model” | 输入为 `noisy \| encoded-source \| mask` 的 U-Net。 |
| SDEdit | “带 noise level 的 img2img” | 加噪到时间 `t`，用新 prompt denoise。 |
| InstructPix2Pix | “纯文本编辑” | 在 (image, instruction, output) 三元组上 fine-tuned 的 diffusion。 |
| RePaint | “无需重新训练” | 在 reverse 过程中周期性 re-noise，以减少 seams。 |
| SAM | “Segment Anything” | 通过点击或框生成 mask；与 inpaint 配合使用。 |
| Flux-Kontext | “带上下文编辑” | 接收 reference image + instruction 进行编辑的 Flux 变体。 |

## 生产提示:对延迟非常敏感的管道编辑

用户编辑图像时,期望往返低于5秒. 在L4上,10242的30步SDXL-Inpaint需要3-4秒,再加上SAM面具生成(约200ms) 和VAE编码/解码(合计约500ms) .从生产角度看,这受到了TTFT限制,而不是吞吐限制:批量1、低并发、尽量压缩每个阶段:

- **SAM-H 是慢的那个。**视频量量增加,不要把它用于单图编辑.
- **能跳过 encode 就跳过。** `pipe.image_processor.preprocess(img)`如果有上一次生成的潜伏函数,`latents=...`传入,跳过一次的VAE编码.
- **Mask dilation 也影响吞吐。**小面具意味着U-Net前进传输的大部分计算被浪费了.`diffusers`的`StableDiffusionInpaintPipeline`无论如何都会运行完整的U-Net;只有9通道的正确涂料变体能利用隐蔽计算.
- **Flux-Kontext 是 2025 年的答案。**对于`(source_image, instruction)`完成一次编辑在H100上约1.5秒.

## 延伸阅读

- [Lugmayr et al. (2022). RePaint: Inpainting using Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2201.09865) 无需训练的涂料.
- [Meng et al. (2022). SDEdit: Guided Image Synthesis and Editing with Stochastic Differential Equations](https://arxiv.org/abs/2108.01073) 死亡
- [Brooks, Holynski, Efros (2023). InstructPix2Pix](https://arxiv.org/abs/2211.09800)文本指令编辑
- [Kirillov et al. (2023). Segment Anything](https://arxiv.org/abs/2304.02643) SAM,面具 来源:
- [Ravi et al. (2024). SAM 2: Segment Anything in Images and Videos](https://arxiv.org/abs/2408.00714)视频 SAM。
- [Hertz et al. (2022). Prompt-to-Prompt Image Editing with Cross-Attention Control](https://arxiv.org/abs/2208.01626) 注意 层级编辑──
- [Black Forest Labs (2024). Flux.1-Fill and Flux.1-Kontext](https://blackforestlabs.ai/flux-1-tools/) 2024 工具
