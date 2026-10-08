# 视频生成

> 图像是一个2D光.视频是一个3D光.理论相同;计算难度高出10-100x.OpenAI的声音(2024年2月) 证明这是可行的.到2026年,Veo 2、Kling 1.5、跑道Gen-3、Pika 2.0 和 WAN 2.2 已经能够从文本生成1080p的生产级视频,而开放权重堆(CogVideoX、HunyuanVideo、Mochi-1、WAN 2.2)落后约12个月.

**Type:** Build
**Languages:** Python
**先修要求:**八期07 (暗散),七期09 (ViT),八期06 (DDPM)
**Time:** ~45 minutes

## 问题

一个10秒,1080p、24fps的视频包含240,每1920×1080×3像素──每个剪辑的原始数据约为1.5GB──像素空间扩散不可行──你需要:

1. **时空压缩。**一个VAE,把视频而不是单个编码为空间-时间补丁序列.
2. **时间一致性。**需要在几秒钟内分享内容,光照和对象身份.
3. **Compute budget。**在相同的模型尺寸下,视频训练比图像贵10-100倍.
4. **Conditioning。**文本、图像(第一)、音频或另一个视频──大多数生产模型都接受了这四种──

解决这个问题的架构是应用于空间及时间补丁的**Diffusion Transformer (DiT)**随着这些过程,我们开始学习,在巨大的速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速速

## 概念

![Video diffusion: patchify, DiT, decode](../assets/video-generation.svg)

### 缩

使用3D VAE(学习到的时空缩写)编码视频――latent的形状是`[T_latent, H_latent, W_latent, C_latent]`分成小小的`[t_p, h_p, w_p]`对于索拉风格的模型,`t_p = 1`片或片`t_p = 2`视频会缩小到约20万到100万个贴片.

### 时间空间

一个变压器 处理平化的补丁序列――每个补丁都有一个3D定位嵌入式(时间+y+x) ─注意力通常会被因素化:

- **Spatial attention**在每一个的补丁内进行.
- **Temporal attention**在同一空间位置跨进行.
- **Full 3D attention**价格高16-100倍;仅在低分辨率或研究中使用.

### 文本 调节

使用大型文本编码器 进行跨度注意(Sora 使用T5-XXL,CogVideoX-5B 使用T5-XXL) 长提示 很重要,Sora的训练集包含GPT 生成的密集重写,平均每个剪辑200个代币──

### 训练

在空间时间潜伏上使用标准扩散损失 (ε 或 v预测) 数据:网络视频+约100万个策划片段+合成文本标题――计算:即使是小型研究运行也需要10,000+GPU小时;Sora规模则是100,000+──

## 2026 年生产格局

| Model | Date | Max duration | Max res | Open weights? | Notable |
|-------|------|--------------|---------|---------------|---------|
| Sora (OpenAI) | 2024-02 | 60s | 1080p | No | 第一个在 scale 下展示 world simulator 属性的模型 |
| Sora Turbo | 2024-12 | 20s | 1080p | No | 推理快 5x 的生产版 Sora |
| Veo 2 (Google) | 2024-12 | 8s | 4K | No | 2025 年最高质量 + physics |
| Veo 3 | 2025 Q3 | 15s | 4K | No | 原生音频和更强的相机控制 |
| Kling 1.5 / 2.1 (Kuaishou) | 2024-2025 | 10s | 1080p | No | 2025 Q1 最好的人体运动 |
| Runway Gen-3 Alpha | 2024-06 | 10s | 768p | No | 在其之上的专业视频工具 |
| Pika 2.0 | 2024-10 | 5s | 1080p | No | 最强角色一致性 |
| CogVideoX (THUDM) | 2024 | 10s | 720p | Yes (2B, 5B) | 第一个开放的 5B-scale 视频模型 |
| HunyuanVideo (Tencent) | 2024-12 | 5s | 720p | Yes (13B) | 2024 年末开放 SOTA |
| Mochi-1 (Genmo) | 2024-10 | 5.4s | 480p | Yes (10B) | 许可证最宽松 |
| WAN 2.2 (Alibaba) | 2025-07 | 5s | 720p | Yes | 2025 年中最强开放模型 |

在视频领域,开放权重缩小差距速度比图像领域更快:到2026年中,HunyuanVideo + WAN 2.2 LoRA 已经驱动了大多数开源工作流程.


```figure
video-diffusion-denoise
```

## 构建它

`code/main.py`模拟核心的空间时间的DIT思路:patchify 一个小型合成视频,加入每补丁位置嵌入,并使用变压器式的注意力在补丁上对整个序列的指标――不用编号;纯 Python――我们展示了即使在1-D 中,当相邻的补丁 共享指标和位置嵌入时,也会出现时间一致性――

### 步骤1: 补丁一个合成1D视频

```python
def make_video(T_frames=8, rng=None):
    # a "video" is a sequence of 1-D values following a smooth trajectory
    base = rng.gauss(0, 1)
    return [base + 0.3 * t + rng.gauss(0, 0.1) for t in range(T_frames)]
```

### 步骤 2: 每个位置嵌入

```python
def pos_embed(t, dim):
    return sinusoidal(t, dim)
```

### 步骤3: 告示者 看到整个序列

我们的微型网络不是独立的指标 每一,而是拼写所有值+它们的位置嵌入,并联合预测所有噪音.

### 步骤 4: 时间一致性测试

训练后,样本 一个视频――测量框架到框架的三角形――如果模型学到了时间结构,三角形会比独立的样本 每一更小――

## 陷

- **独立逐帧 sampling = flicker。**如果你对每分别运行图像传播,输见闪,因为每的噪音是独立的──视频传播通过关注或共享噪音──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
- **朴素 3D attention = OOM。**对于一个10秒的1080p隐藏的3D关注需要数十亿次操作.
- **数据 captioning 比规模更重要。**比以前的工作的主要升级是使用大约10倍的更详细的标题训练 (GPT-4 重新标注片段) .
- **First-frame conditioning。**大多数生产模型也接受一张图像作为第一──这是"图像到视频"模式;训练包含这个变体──
- **Physics drift。**长片段(>10s) 会积累细微不一致――滑动窗口生成+键盘结 会有帮助――

## 使用它

| Use case | 2026 pick |
|----------|-----------|
| 最高质量 text-to-video，hosted | Veo 3 or Sora |
| 可控相机的 cinematic | Runway Gen-3 with motion brushes |
| 跨 clips 的角色一致性 | Pika 2.0 or Kling 2.1 |
| Open weights，快速 fine-tune | WAN 2.2 + LoRA |
| Image-to-video | WAN 2.2-I2V, Kling 2.1 I2V, or Runway |
| Audio-to-video lip sync | Veo 3 (native audio) or a dedicated lip-sync model |
| 视频编辑 | Runway Act-Two, Kling Motion Brush, Flux-Kontext (still-frame) |

在质量相等的情况下,视频每秒成本在2024年至2026年间下降了20倍.

## 交付它

保存`outputs/skill-video-brief.md`△ 技能 接收一个视频简介 ((时间,面积比,风格,摄像头计划,主题一致性,音频),并输出:模型+托管,即时架构(摄像头语言、主题描述、运动描述符) ✓种子+可再生性协议以及框架级QA检查列表──

## 练习

1. **Easy.**在`code/main.py`中,比较 (a) 独立每样本和 (b) 联合序列样本的向的特集――报告特集的平均和变异――
2. **Medium.**添加一个第一框条件:将框0ピン到给定值并样本 其余部分――测量固定值 如何传播――
3. **Hard.**使用 HuggingFace 扩散器 在本地GPU 上运行 CogVideoX-2B──对 720p、6秒的剪辑 计时 20 个推断步骤──Profile 空间时的注意 以识别瓶──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Video VAE | "3-D VAE" | 将 `(T, H, W, C)` 压缩为 spatiotemporal latent 的 Encoder。 |
| Patches | "The tokens" | latent 的固定大小 3-D blocks；作为 DiT 的输入。 |
| Factorized attention | "Spatial + temporal" | 先在空间上运行 Attention，再在时间上运行；跳过 full 3-D attention。 |
| Image-to-video (I2V) | "Animate this photo" | 模型接收一张图像 + 文本，并输出从它开始的视频。 |
| Keyframe conditioning | "Anchor frames" | Pin 特定帧来控制视频的 arc。 |
| Motion brush | "Directional hint" | 用户在图像上绘制 motion vectors 的 UI 输入。 |
| Re-captioning | "Dense captions" | 使用 LLM 用详细 prompts 重新标注训练 clips。 |
| Flicker | "Temporal artifact" | Frame-to-frame 不一致；通过 coupled denoising 修复。 |

## 生产说明:视频隐藏是存储带宽问题

一个10秒 1080p、24fps的剪辑包含240个 × 1920 × 1080 × 3 ≈1.5GB原始像素──经过4×视频VAE压缩(`2 × spatial × 2 × temporal`)后,每次请求约为100MB──将它通过空间时间的节奏 运行30步、批量1,你每步都需要通过HBM 移动约3GB,瓶是内存带宽,而不是FLOPs──

三个生产,都直接来自生产推理文学推理章节:

- **跨 DiT 的 TP。**文字到视频模型通常≥10B参数──4个H100上TP=4是标准配置;405B类模型使用PP=2 ×TP=2──每步延迟 随TP大致线性下降,直到撞击全减墙──
- **Frame batching = continuous batching。**在生成时间,视频概念上是一批由注意 连接的框架――持续批量(在飞行安排)适用:如果模型架构允许滑动窗口生成,可以在框架`t-1`正在回归时开始染色框架`t+1`,我知道.
- **Clip-level prefill cache。**对于图像到视频来说,第一框调节类似于LLM的快速预填:计算一次,并在时间解码器通过 中复用――这实际上是视频的KV缓存――

## 延伸阅读
- [Brooks et al. (2024). Video generation models as world simulators](https://openai.com/index/video-generation-models-as-world-simulators/) 技术报告――
- [Yang et al. (2024). CogVideoX: Text-to-Video Diffusion Models with An Expert Transformer](https://arxiv.org/abs/2408.06072)       
- [Kong et al. (2024). HunyuanVideo: A Systematic Framework for Large Video Generative Models](https://arxiv.org/abs/2412.03603)           
- [Genmo (2024). Mochi-1 Technical Report](https://www.genmo.ai/blog/mochi)莫奇-1──
- [Alibaba (2025). WAN 2.2](https://wanvideo.io/) 2025年中开放 SOTA。
- [Ho, Salimans, Gritsenko et al. (2022). Video Diffusion Models](https://arxiv.org/abs/2204.03458) 开创性视频传播论文
- [Blattmann et al. (2023). Align your Latents (Video LDM)](https://arxiv.org/abs/2304.08818) 稳定视频传播的前身──
