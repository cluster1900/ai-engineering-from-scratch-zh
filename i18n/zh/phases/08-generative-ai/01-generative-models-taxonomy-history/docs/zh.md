# 创建模式 类法与历史

> 每个图像模型,文本模型,视频模型和3D模型都属于五类之一.

**类型:**学习 课程
**语言:**字符串
**先修要求:**阶段2 (ML基础),阶段3 (深度学习核心),阶段7 · 14 (变革者)
**时间:**时间45分钟

## 问题

产生型模型做一个事情:从某个未知分布中确定`p_data(x)`抽取的训练样本,输出看起来像来自相同分布的新样本──人脸,句子,MIDI文件,蛋白质结构如果你眼看,它们都是同一个问题──

难点在于,`p_data`存在于拥有数百万维度的空间中 ((一个512x512 RGB 图像大约有786k维),样本位于该空间内部的一个很薄的多样性上,而你可能只有10M个样本――暴力求解密度是没有希望的――每个生成模型都在把一个难题换成另一个不那么难题――

过去12年里有五个家庭生存下来. 了解每个家庭所做的一切,会告诉你为什么它在某些任务上胜利,

## 概念

![Generative models 的五个家族 — 按它们建模的对象分类](../assets/taxonomy.svg)

**1. Explicit density, tractable。**将`log p(x)`写成一个你真的能计算的求和――自动降低模型 (PixelCNN,WaveNet,GPT) 将 `p(x) = ∏ p(x_i | x_<i)`因式分解──正常化流量 (RealNVP,Glow) 将`p(x)`构建一个简单的基础 分布的可逆变换――优点:精确的概率,干净的训练 损失――缺点:自行降低的推理是顺序的(长序列会慢),流动需要可逆的架构(架构限制很强) ――

**2. Explicit density, approximate。**从下界定`log p(x)`化模型 (DDPM, Ho 2020) 训练一个指标,它隐式优化加权 ELBO──化是2026年图像、视频和3D的主导脊柱──

**3. Implicit density。**完全跳过密度;学习一个生成样本的发电机`G(z)`并且是一个判断真实假的歧视者.`D(x)`◎GANs (Goodfellow 2014) ・推理很快(一次进步通过),但训练过程出名地不稳定──即使在2026年,StyleGAN 1/2/3 在固定领域的摄影主义 (人脸、卧室) 上仍然是最先进的――

**4. Score-based / continuous-time。**直接学习日志密度的梯度`∇_x log p(x)`(score) ――Song & Ermon (2019) 表明分数匹配将扩散推广为SDE――流量匹配 (Lipman 2023) 是2024-2026年热点:无需模拟的训练、更直的路径、比DDPM快4-10倍的采样──稳定扩散3、Flux、AudioCraft 2 都使用流量匹配──

**5. 基于 Token 的离散 codes 上的 autoregressive。**使用VQ-VAE或残余量化器将高维数据压缩成一个较短的离散代币序列,然后使用变压器对代币序列进行构建.

## 简史

| 年份 | 模型 | 为什么重要 |
|------|-------|-----------------|
| 2013 | VAE (Kingma) | 第一个拥有可用训练 Loss 的 deep generative model。 |
| 2014 | GAN (Goodfellow) | Implicit density，没有 likelihood，却能产生惊人锐利的样本。 |
| 2015 | DRAW, PixelCNN | 顺序图像生成。 |
| 2017 | Glow, RealNVP | 可逆 flows；通过 depth 获得精确 likelihood。 |
| 2017 | Progressive GAN | 第一个 megapixel 人脸。 |
| 2019 | StyleGAN / StyleGAN2 | 在人脸这个单一领域中，photorealistic faces 依然很难被击败。 |
| 2020 | DDPM (Ho) | Diffusion 变得实用。 |
| 2021 | CLIP, DALL-E 1, VQGAN | Text-to-image 进入主流。 |
| 2022 | Imagen, Stable Diffusion 1, DALL-E 2 | Latent diffusion + text conditioning = 商品化。 |
| 2022 | ControlNet, LoRA | 对 pretrained diffusion 进行精细控制。 |
| 2023 | SDXL, Midjourney v5, Flow matching | 规模 + 更好的训练动态。 |
| 2024 | Sora, Stable Diffusion 3, Flux.1 | Video diffusion；flow matching 胜出。 |
| 2025 | Veo 2, Kling 1.5, Runway Gen-3, Nano Banana | 生产级视频。 |
| 2026 | Consistency + Rectified Flow | 从 diffusion backbones 进行一步采样。 |

## 五问分诊

当一个新的生成模型论文出现时,在阅读方法部分之前,首先回答这五个问题.

1. **建模的是什么？**像素,隐形,离散标志,3D高西人,网格,波形?
2. **Density 是 explicit 还是 implicit？**他们写了吗?`log p(x)`现在,我们要去.
3. **Sampling：one-shot 还是 iterative？**复制式意味着推理更慢;一枪通常意味着对抗或蒸.
4. **Conditioning：unconditional、class、text、image、pose？**这决定了损失和构建.
5. **Evaluation：FID、CLIP score、IS、human preference、task accuracy？**它们都具有已知失败模式.

你将在这个阶段的每一个课程中重新回答这些五个问题.


```figure
autoencoder-bottleneck
```

## 构建它

本课程的代码是一个轻量级可视化:使用三种玩具方法 (核密度、离散 histogram,以及最近的样本GAN-ish生成器) 从样本中适合一个1D的Gaussians混合物,这样你可以在一个能打印到一个屏幕里的问题上看到明确与隐含密度的区别.

运行`code/main.py`,它从一个双峰的高斯混合物中抽取2000个样本,然后打印:

```
explicit density (histogram): p(x in [-0.5, 0.5]) ≈ 0.38
approximate density (KDE):     p(x in [-0.5, 0.5]) ≈ 0.41
implicit (nearest-sample gen): 20 new samples printed, no p(x)
```

注意:前两个允许你问这个点有多可能?第三个不行.

## 使用它

2026年,哪个家庭适合哪个任务?

| 任务 | 最佳家族 | 原因 |
|------|-------------|-----|
| Photoreal faces，窄领域 | StyleGAN 2/3 | 仍然最锐利，推理最快。 |
| 通用 text-to-image | Latent diffusion + flow matching | SD3, Flux.1, DALL-E 3。 |
| 快速 text-to-image | Rectified flow + distillation | SDXL-Turbo, SD3-Turbo, LCM。 |
| Text-to-video | Diffusion Transformer + flow matching | Sora, Veo 2, Kling。 |
| Speech + music | Token-based AR (AudioLM, VALL-E, MusicGen) 或 flow matching (AudioCraft 2) | 离散 tokens 扩展成本低。 |
| 3D scenes | Gaussian Splatting fit, diffusion prior | 3D-GS 用于重建，diffusion 用于 novel-view。 |
| Density estimation（不采样） | Flows | 唯一拥有精确 `log p(x)` 的家族。 |
| Simulation / physics | Flow matching, score SDE | 直线路径，平滑 Vector fields。 |

## 交付它

保存为`outputs/skill-model-chooser.md`,我知道.

这个技能 接收一个任务描述并输出:(1) 要使用哪个家族,(2) 三个开放选项和三个托管的选项排列列表,(3) 你应该关注可能失败模式,以及 (4) 计算/时间预算.

## 练习

1. **Easy。**对于以下五个产品,识别其家族和脊椎:ChatGPT图片、Midjourney v7、Sora、Runway Gen-3、ElevenLabs──证据应来自公开技术报告──
2. **Medium。**你明天要读的论文声称采样比扩散快100倍――写下三个问题,用来检查这种加速在条件化和高分辨率下是否仍然存在――
3. **Hard。**选择一个你关心的领域 (例如蛋白质结构,CAD,分子轨迹) 为了这个领域当前的SOTA模型回答五个分诊,并勾勒出一个更好的模型会改变什么――

## 关键术语

| 术语 | 人们怎么说 | 它实际是什么意思 |
|------|-----------------|-----------------------|
| Generative model | “它会生成新东西” | 学习 `p_data(x)` 的 sampler，可选地暴露 `log p(x)`。 |
| Explicit density | “你可以计算它” | 模型提供 closed-form 或 tractable 的 `log p(x)`。 |
| Implicit density | “GAN-style” | 只有 sampler——无法计算给定点的 `p(x)`。 |
| ELBO | “Evidence lower bound” | `log p(x)` 的一个 tractable 下界；VAEs 和 diffusion 会优化它。 |
| Score | “log-density 的 Gradient” | `∇_x log p(x)`；diffusion 和 SDE models 学习这个 field。 |
| Manifold hypothesis | “数据存在于一个表面上” | 高维数据集中在低维 manifold 上；这就是 dimensionality reduction 有效的原因。 |
| Autoregressive | “预测下一个片段” | 将 joint 因式分解为 conditionals 的乘积。 |
| Latent | “压缩 code” | 一种低维表示，decoder 可以从中重建输入。 |

## 生产备注:五个家族,五种推理形态

每个家庭都会映射到不同的推理服务器 成本曲线――生产推理文献将LLM推理框定为预填 +解码;同样的分解也适用于这里:

- **Autoregressive（类别 1 和 5）。**顺序解码 主导延迟;KV缓存、连续批量和投机解码都可以直接应用──
- **VAE / diffusion / flow-matching（类别 2 和 4）。**这里没有LLM的意思.`num_steps × step_cost`现在,`step_cost`是在完整的隐形分辨率上一个次变压器或U-Net前进――生产旋是步骤计数(DDIM / DPM-溶剂 /蒸)、批量大小和精度(bf16 / fp8 / int4)。
- **GAN（类别 3）。**一次前进传递――没有时间表,没有KV缓存――TTFT ≈总延迟――这就是为什么StayGAN在狭窄领域的UX上仍然胜出的原因――

当你在论文摘要中看到比传播更快时,把它翻译成更少的步骤 × 相同的步骤成本 × 更便宜的步骤成本.

## 延伸阅读

- [Goodfellow et al. (2014). Generative Adversarial Nets](https://arxiv.org/abs/1406.2661) 论文──
- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) 论文──
- [Ho, Jain, Abbeel (2020). Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) 论文:
- [Song et al. (2021). Score-Based Generative Modeling through SDEs](https://arxiv.org/abs/2011.13456) 作为SDE的传播──
- [Lipman et al. (2023). Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747)流量匹配论文──
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206)稳定扩散3。
