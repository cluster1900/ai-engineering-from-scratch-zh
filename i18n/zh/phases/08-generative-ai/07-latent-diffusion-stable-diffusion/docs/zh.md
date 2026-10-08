# 隐形扩散与稳定的扩散

> 在512×512图像上做像素空间扩散,在计算上堪称战争罪.罗姆巴赫等 (2022) 指出,生成一个图像不需要全部786k维度,你需要足够的东西来捕捉语义结构的维度,以及一个单独的解码器来处理其余部分.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 02 (VAE), Phase 8 · 06 (DDPM), Phase 7 · 09 (ViT)
**Time:** ~75 minutes

## 问题

五122个像素空间的扩散意味着U-Net必须在形状中`[B, 3, 512, 512]`对于一个500M-param的U-Net,每个采样步骤约为100GFLOPS──五十步就是每张图5 TFLOPS──在一个亿张图上训练时,计算账单会变得荒谬──

这些FLOP大多花在把感知上不重要细节推过网络上,也就是那些有损 VAE 本可以缩减的高频纹理.Rombach的想法是:先训练一次 VAE(*第一阶段*),结结它,然后完全在4道64×64隐形空间(*第二阶段*) 中运行传播.

这就是稳定扩散配方.SD 1.x / 2.x 使用一个860M U-Net 处理.`64×64×4`其他数据,SDXL 使用一个2.6B U-Net 处理 `128×128×4`SD3 用带流量匹配的扩散变压器 (DiT) 替换了U-Net──Flux.1-dev (黑森林实验室,2024) 发布了一个12B参数的DiT-MMDiT──它们都运行在同一个两阶段底座上──

## 概念

![Latent diffusion: VAE compression + diffusion in latent space](../assets/latent-diffusion.svg)

**两个阶段，分别训练。**

1. **Stage 1 — VAE.**编码器`E(x) → z`解码器`D(z) → x`△目标压缩率:每个空间轴下采样 8×,再调整频道,使总潜伏尺寸约为像素数量的1/16──损失 =重建 (L1 + LPIPS感知) + KL(权重很小,使`z`我们不需要被强迫推进太高斯,因为我们不需要从`z`常常会配合对手的损失训练,让解码出来的图像更利.

2. **Stage 2 — 在 `z` 上做 diffusion。**让我`z = E(x_real)`当作数据――训练一个U-Net(或DIT) 去谴责`z_t`推理时:通过传播 采样`z_0`然后`x = D(z_0)`,我知道.

**文本 conditioning。**还有两个额外组件――一个结结尾的文本编码器(SD 1.x 用CLIP-L,SD 2/XL 用CLIP-L+OpenCLIP-G,SD3 和流动用T5-XXL) ─一个跨度注意 注入:每个U-Net块接收`[Q = image features, K = V = text tokens]`图像是文字影响图像的唯一方式.

**Loss Function 与 Lesson 06 完全相同。**您只是换了一个数据域.

## 架构变体

| Model | Year | Backbone | Latent shape | Text encoder | Params |
|-------|------|----------|--------------|--------------|--------|
| SD 1.5 | 2022 | U-Net | 64×64×4 | CLIP-L (77 tokens) | 860M |
| SD 2.1 | 2022 | U-Net | 64×64×4 | OpenCLIP-H | 865M |
| SDXL | 2023 | U-Net + refiner | 128×128×4 | CLIP-L + OpenCLIP-G | 2.6B + 6.6B |
| SDXL-Turbo | 2023 | Distilled | 128×128×4 | same | 1-4 step sampling |
| SD3 | 2024 | MMDiT (multimodal DiT) | 128×128×16 | T5-XXL + CLIP-L + CLIP-G | 2B / 8B |
| Flux.1-dev | 2024 | MMDiT | 128×128×16 | T5-XXL + CLIP-L | 12B |
| Flux.1-schnell | 2024 | MMDiT distilled | 128×128×16 | T5-XXL + CLIP-L | 12B, 1-4 step |

趋势是:使用DiT (作用于潜伏补丁的变压器) 替换U-Net,扩大文本编码器 (T5 在快速遵守上胜过CLIP),增加潜伏频道 ((4 → 16 带来更多细节余量) ⋅


```figure
noise-schedule
```

## 构建它

`code/main.py`把一个玩具放在1-D VAE(身份编码器 + 解码器,仅用于演示;真正的VAE 会是 conv网) 叠在06课的DDPM之上,并通过无分类指导 加入类条件化――它显示了同一个扩散损失 无论运行在原始1D值上,还是运行在编码的值上都有效,这就是关键洞见――

### 步骤1:编码/解码器

```python
def encode(x):    return x * 0.5          # toy "compression" to smaller scale
def decode(z):    return z * 2.0
```

为了教学目的,这个线性映射已经足以说明传播可以在`z`上操作,不关心原始数据空间.

### 步骤2: 在`z`- 空间中做扩散

与第六课相似的DDPM.`z = E(x)`采样出`z_0`后,用`D(z_0)`解码

### 步骤3:无分类器的指导

训练期间,10% 的时间丢弃了类标签(替换为零代币)`ε_cond`和 `ε_uncond`然后:

```python
eps_cfg = (1 + w) * eps_cond - w * eps_uncond
```

`w = 0`没有指导,`w = 3`默认值`w = 7+`和 / 过化──

### 步骤 4: 文本条件化 (概念,不是代码)

把类标签 替换为结文本编码器的输出――通过跨重视 把文本嵌入 输入 U-Net:

```python
h = h + CrossAttention(Q=h, K=text_embed, V=text_embed)
```

这是与稳定分散的唯一实质性区别.

## 陷

- **VAE-scale mismatch。**SD 1.x VAEs 在编码后会应用一个缩放常数`scaling_factor ≈ 0.18215`记住这一点将使U-Net在差异严重的错误中训练上.
- **Text encoder silently wrong。**需要带来128个代币的T5-XXL,倒退到CLIP会有损.`use_t5=True`否则会迅速崩.
- **混用 latent spaces。**在SDXL潜伏中,LoRA不能用于SD3──Hugging Face扩散器0.30+ 会拒绝加载不匹配的检查点──
- **CFG too high。** `w > 10`为了牺牲多样性, 图像的生成量过于适合.`w = 3-7`,我知道.
- **Negative prompts leaking。**空的负面提示会变成零代币;填充的负面提示会变成`ε_uncond`两者不同;有些管道会静默默使用 null──

## 使用它

2026 年的生产:

| Target | Recommended backbone |
|--------|----------------------|
| 窄领域、配对数据、从零训练模型 | SDXL fine-tune (LoRA / full) — 最快交付 |
| 开放域 text-to-image，开放权重 | Flux.1-dev (12B, Apache / non-commercial) 或 SD3.5-Large |
| 最快推理，开放权重 | Flux.1-schnell (1-4 step, Apache) 或 SDXL-Lightning |
| 最佳 prompt adherence，托管服务 | GPT-Image / DALL-E 3 (still), Midjourney v7, Imagen 4 |
| 编辑工作流 | Flux.1-Kontext (Dec 2024) — 原生接受 image + text |
| 研究、baseline | SD 1.5 — 古老但研究充分 |

## 交付它

保存`outputs/skill-sd-prompter.md`△ 能力 接收文本提示 + 目标风格,并输出:模型 + 检查点,CFG尺度,样本,负面提示,分辨率,可选的控制网/IP-适配器组合以及一个逐步的QA检查列表.

## 练习

1. **Easy.**使用指南`w ∈ {0, 1, 3, 7, 15}`运行`code/main.py`记录每个类的平均样本.`w`下,类型意味着会偏离真实数据平均值?
2. **Medium.**换成tanh-MLP编码器/解码器对,并加入重建损失.
3. **Hard.**使用扩散器 建立一个真正的稳定扩散 推理:加载`sdxl-base`运行30个艾勒步骤,并计时――然后切换到`sdxl-turbo`通过4步和CFG=0──相同的主体,不同质量,描述发生了什么变化以及原因──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| First stage | “The VAE” | 训练好的 encoder/decoder 对；把 512² 压缩到 64²。 |
| Second stage | “The U-Net” | latent space 上的 diffusion model。 |
| CFG | “Guidance scale” | `(1+w)·ε_cond - w·ε_uncond`；调节 conditioning strength。 |
| Null token | “Empty prompt embed” | 用于 `ε_uncond` 的 unconditional embed。 |
| Cross-attention | “How text gets in” | 每个 U-Net block 都以 text tokens 作为 K 和 V 进行 attention。 |
| DiT | “Diffusion Transformer” | 用作用于 latent patches 的 transformer 替换 U-Net；扩展性更好。 |
| MMDiT | “Multi-modal DiT” | SD3 的架构：带 joint attention 的文本与图像流。 |
| VAE scaling factor | “Magic number” | 将 latents 除以约 5.4，使 diffusion 在 unit-variance 空间中运行。 |

## 生产说明:在8GB消费级GPU上运行Flux-12B

参考流量集成是经典的我有一个消费级GPU,能交付吗?配方――技巧就是把生产推理文献列出的同一个三旋配方应用到扩散的T:

1. **Staggered loading。**流有三个不需要同时存在 VRAM 中的网络:T5-XXL文本编码器(fp32 下约10GB)、CLIP-L(小)、12B MMDiT,以及VAE──先编码提示,*删除*编码器,加载DiT,登录,*删除*DiT,加载VAE,解码──消费级8GB的GPU 一次只能容纳一个阶段──
2. **通过 bitsandbytes 做 4-bit quantization。**在T5编码器和DiT 上都使用`BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.bfloat16)`◎内存减少8倍,根据Aritra的基准,文本到图像的质量下降几乎是不可见的.
3. **CPU offload。** `pipe.enable_model_cpu_offload()`通过前进时,将自动交换 CPU 和 GPU 模块.

记忆里是:`10 GB T5 / 8 = 1.25 GB`量化`12 B params × 0.5 bytes = ~6 GB`通过使用stas00的说法,这是TP=1推理的极端情况:没有模型平行性,最大化量化.

## 延伸阅读

- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752)稳定扩散――
- [Podell et al. (2023). SDXL: Improving Latent Diffusion Models for High-Resolution Image Synthesis](https://arxiv.org/abs/2307.01952) SDXL──
- [Peebles & Xie (2023). Scalable Diffusion Models with Transformers (DiT)](https://arxiv.org/abs/2212.09748)  
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) SD3,MMDiT──
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598)    
- [Labs (2024). Flux.1 — Black Forest Labs announcement](https://blackforestlabs.ai/announcing-black-forest-labs/)流动1.系列
- [Hugging Face Diffusers docs](https://huggingface.co/docs/diffusers/index) 上述每一个检查点的参考实现.
