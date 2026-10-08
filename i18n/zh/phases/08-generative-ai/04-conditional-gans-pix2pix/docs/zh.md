# 条件GAN与Pix2Pix

> 2014-2017年第一大突破是控制GAN 生成什么──附加一个标签、一张图像,或一个句子──Pix2Pix是图像版本,而且在狭窄的图像到图像任务上,它至今仍然胜过了每个通用的文本到图像模型──

**Type:** 构建
**Languages:** Python
**Prerequisites:** Phase 8 · 03 (GANs), Phase 4 · 06 (U-Net), Phase 3 · 07 (CNNs)
**Time:** ~75 分钟

## 问题
无条件 GAN 会采样任意人脸――做演示 有用,进生产 没用――你想要的就是:*把草图映射成照片*、*把地图映射成空中照片*、*把白天场景映射成夜间*、*给灰色图像 上色*。在所有这些任务中,你会得到一个输入图像`x`必须输出带有某种语义相应的`y`每个人都`x`都可能应对许多合理的`y`△平均平方错误会把它们压制成糊状结果──对抗的损失不会发生,因为看起来真实是尖的──

条件性GAN (Mirza & Osindero, 2014) 把条件`c`作为输入加入`G`和 `D`〔Pix2Pix (Isola et al., 2017) 对此做了专门化:条件是完整的输入图像,生成器是U-Net,歧视器是*基于补丁的*分类器 (PatchGAN),损失是对立的+L1──即使在2026年,这个配套在狭窄的图像到图像域上仍然胜过零训练的文本到图像模型,因为它训练在 *对数据*上 你拥有的正是所需的信号──

## 概念
![Pix2Pix: U-Net generator, PatchGAN discriminator](../assets/pix2pix.svg)

**Conditional G.** `G(x, z) → y`在Pix2Pix中,`z`是 G 内部的落 没有输入噪音  孤立发现显式噪音 会被忽略)

**Conditional D.** `D(x, y) → [0, 1]`△输入是 *对*(条件,输出) ・这是关键差异:D 必须判断`y`是否与`x`一致,而不仅仅是判断`y`看起来是真的吗?

**U-Net generator.**带有跨瓶跳连接的编码器-解码器――对于输入和输出共享低级结构的任务至关重要――没有这些跳转,高频细节会消失――

**PatchGAN discriminator.**没有输出单个真实/假分数,而是输出一个`N×N`网格,其中每个细胞 判断70×70像素的接收场――然后取平均――这是一个马科夫随机场――假设:真实感是局部的――训练快得多,参数更少,输出更利――

**Loss.**

```
loss_G = -log D(x, G(x)) + λ · ||y - G(x)||_1
loss_D = -log D(x, y) - log (1 - D(x, G(x)))
```

 稳定训练,并推动G 接近已知目标──L1比L2 产生更利的边缘 (而不是手段)──`λ = 100`是Pix2Pix默认值.

##  CycleGAN  当你没有双子

需要配对`(x, y)`通过额外的损失 放弃这个要求:*循环一致性*损失──两个发电机:`G: X → Y`和 `F: Y → X`训练它们,使它们`F(G(x)) ≈ x`且`G(F(y)) ≈ y`,这让你在没有双色球的例子中,把马变成斑马,夏天变成冬天.

在2026年,无对照图像大多通过扩散 (ControlNet、IP-Adapter) 完成,而不是CycleGAN,但循环一致性思想仍然存在几乎每一篇无对照域调整论文中.


```figure
gx-patchgan
```

## 构建它
`code/main.py`在1D数据上实现了微型的条件GAN.`c`是类标签 ((0 或 1);;任务:为给定类 生成一个来自条件分布的样本.

### 步骤1: 将条件添加到 G 和 D 的输入

```python
def G(z, c, params):
    return mlp(concat([z, one_hot(c)]), params)

def D(x, c, params):
    return mlp(concat([x, one_hot(c)]), params)
```

单热编码是最简单的方法. 更大的模型会使用学习的嵌入式,或FiLM调节,或交叉注意力.

### 步骤2: 条件的火车

```python
for step in range(steps):
    x, c = sample_real_conditional()
    noise = sample_noise()
    update_D(x_real=x, x_fake=G(noise, c), c=c)
    update_G(noise, c)
```

发电机必须匹配下定条件的实际分布,而不是边缘分布.

### 步骤3:验证每个类的输出

```python
for c in [0, 1]:
    samples = [G(noise, c) for noise in batch]
    mean_c = mean(samples)
    assert_near(mean_c, real_mean_for_class_c)
```

## 陷
- **Condition 被忽略。**由于条件信号太弱──修复:更强地条件 D(早期层,而不只是迟到),使用投影歧视器 (Miyato & Koyama 2018)──
- **L1 weight 过低。**漂移到任意看起来真实输出,而不是忠实的.
- **L1 weight 过高。**产生模糊的输出,因为L1 仍然是L_p规范.
- **D 中 ground-truth leakage。**将`(x, y)`作为D输入,而不只是`y`否则 D 无法检查一致性
- **每个 class 的 mode collapse。**每个类都可能独立崩.

## 使用它
2026 年 任务状态:

| Task | Best approach |
|------|---------------|
| Sketch → photo, same domain, paired data | Pix2Pix / Pix2PixHD（仍然快，仍然锐利） |
| Sketch → photo, unpaired | 带 Scribble conditioning model 的 ControlNet |
| Semantic seg → photo | SPADE / GauGAN2 或 SD + ControlNet-Seg |
| Style transfer | 带 IP-Adapter 或 LoRA 的 Diffusion；GAN methods 属于 legacy |
| Depth → photo | Stable Diffusion 上的 ControlNet-Depth |
| Super-resolution | Real-ESRGAN (GAN), ESRGAN-Plus, 或 SD-Upscale (diffusion) |
| Colorization | ColTran、diffusion-based colorizers，或 Pix2Pix-color |
| Daytime → nighttime, seasons, weather | CycleGAN 或 ControlNet-based |

当 (a) 你有数千个对式例子, (b) 任务狭窄且可重复,并且 (c) 需要快速推断时,Pix2Pix 仍然是正确的工具.

## 交付它
保存`outputs/skill-img2img-chooser.md`△技能 接收任务描述、数据可用性(对与无对的、N样本) 和延迟/质量预算,然后输出:方法(Pix2Pix、CycleGAN、ControlNet变体、SDXL+IP-Adapter) 、培训数据要求、输入成本和评估协议(LPIPS、FID、任务特定) ⋅

## 练习
1. **Easy.**修改`code/main.py`加入第三类. 确认G 仍然将每个类的噪音映射到正确模式.
2. **Medium.**在1-D设置中使用感知式损失 替换L1(例如一个小的冷D作为特征提取器) ――它会改变条件分布的敏度吗?
3. **Hard.**在1D设置中草拟一个CycleGAN:两个分布,2个发电机,2个周期损失――展示它可以在没有对对数据的情况下学会在两者之间映射――

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Conditional GAN | “带 labels 的 GAN” | G(z, c), D(x, c)。两个 networks 都看到 condition。 |
| Pix2Pix | “Image-to-image GAN” | 带 U-Net G 和 PatchGAN D + L1 loss 的 paired cGAN。 |
| U-Net | “带 skips 的 encoder-decoder” | 对称 conv network；skips 保留 high-freq。 |
| PatchGAN | “Local-realism classifier” | D 输出 per-patch score，而不是 global score。 |
| CycleGAN | “Unpaired image translation” | 两个 G + cycle-consistency loss；没有 paired data。 |
| SPADE | “GauGAN” | 用 semantic map normalize intermediate activations；segmentation-to-image。 |
| FiLM | “Feature-wise linear modulation” | 来自 condition 的 per-feature affine transform；便宜的 conditioning。 |

## 生产说明:Pix2Pix 作为受延迟约束的基线

当你有对数据和狭窄任务时,Pix2Pix的一次性推断在延迟上比扩散快一个数量级――生产比较通常是:

| Path | Steps | Typical latency at 512² on a single L4 |
|------|-------|----------------------------------------|
| Pix2Pix (U-Net forward) | 1 | ~30 ms |
| SD-Inpaint or SD-Img2Img | 20 | ~1.2 s |
| SDXL-Turbo Img2Img | 1-4 | ~0.15-0.35 s |
| ControlNet + SDXL base | 20-30 | ~3-5 s |

现代的做法通常为狭窄任务交付Pix2Pix式蒸模型,并为尾入提供扩散倒退──

## 延伸阅读
- [Mirza & Osindero (2014). Conditional Generative Adversarial Nets](https://arxiv.org/abs/1411.1784) 论文──
- [Isola et al. (2017). Image-to-Image Translation with Conditional Adversarial Networks](https://arxiv.org/abs/1611.07004)    
- [Zhu et al. (2017). Unpaired Image-to-Image Translation using Cycle-Consistent Adversarial Networks](https://arxiv.org/abs/1703.10593)     
- [Wang et al. (2018). High-Resolution Image Synthesis with Conditional GANs](https://arxiv.org/abs/1711.11585)     
- [Park et al. (2019). Semantic Image Synthesis with Spatially-Adaptive Normalization](https://arxiv.org/abs/1903.07291) SPADE / GauGAN──
- [Miyato & Koyama (2018). cGANs with Projection Discriminator](https://arxiv.org/abs/1802.05637)投影 D。
