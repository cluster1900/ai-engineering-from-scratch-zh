# 从零开始的DDPM

> 霍··阿贝尔 (2020) 给了这个领域一个不可弃的配方――使用噪音 经过千个小步骤摧毁数据――训练一个神经网络来预测噪音――在推断时反转这个过程――今天,每个主流的图像,视频,3D和音乐模型都运行在这个循环上,可能还在上面叠加流量匹配或一致性技巧――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 8 · 02 (VAE)
**Time:** ~75 分钟

## 问题

你想要一个用于`p_data(x)`您真正想要的是一个训练目标,它具备:(a) 单一稳定损失(没有杆点,没有最小值),(b)`log p(x)`由于您有可能性),以及 (c) 匹配的SOTA质量样本.

索尔-迪克斯斯坦等人 (2015) 给出了理论答案:定义一个逐渐加入高斯噪音的马科夫链`q(x_t | x_{t-1})`并训练一个反向链`p_θ(x_{t-1} | x_t)`为了谴责──何、、阿贝尔(2020) 展示了损失可以简化为一行  预测噪音  并整理数学──2020年它还是个好奇──2021年它产生了最先进的样本──2022年它变成了稳定的分散──2026年它是底层基质──

## 概念

![DDPM: forward noise, reverse denoise](../assets/ddpm.svg)

**Forward process `q`.**在`T`个小步骤中加入高斯语噪音――封闭形式  数学可处理的原因  是累积步骤 仍然是高斯语:

```
q(x_t | x_0) = N( sqrt(α̅_t) · x_0,  (1 - α̅_t) · I )
```

其中`α̅_t = ∏_{s=1..t} (1 - β_s)`应对一个`β_t`时间表`β_t`在T=1000步骤内从1e-4到0.02 线性变化,`x_T`接近于`N(0, I)`,我知道.

**Reverse process `p_θ`.**学习一个神经网络`ε_θ(x_t, t)`预测被加入的噪音.`x_t`按下式表示:

```
x_{t-1} = (1 / sqrt(α_t)) · ( x_t - (β_t / sqrt(1 - α̅_t)) · ε_θ(x_t, t) )  +  σ_t · z
```

其中`σ_t`现在,我们要做什么?`sqrt(β_t)`这种表达很糟糕,但它只是一个代数.`q(x_{t-1} | x_t, x_0)`情况求解`x_{t-1}`并使用噪音预测估计 替换`x_0`,我知道.

**Training loss.**

```
L_simple = E_{x_0, t, ε} [ || ε - ε_θ( sqrt(α̅_t) · x_0 + sqrt(1 - α̅_t) · ε,  t ) ||² ]
```

从数据中样本`x_0`随时选择一个`t`样本`ε ~ N(0, I)`通过封闭形式, 一次性计算噪音`x_t`没有最小值,没有KL,没有重构技巧.

**Sampling.**从`x_T ~ N(0, I)`开始了.`t = T`到了`1`代反向步骤──完成──

## 为什么它能有效

现在,我知道.

1. **Denoising is easy; generating is hard.**在`t=T`网络需要解决一个微不足道的问题.`t=0`网只需要清理几个像素.`t`问题很难,但网会从每个噪音水平的相同组重量中获得许多梯度.

2. **Score matching in disguise.**威尼斯人 (Vincent) 证据,预测噪音等价格估计 `∇_x log q(x_t | x_0)`通过使用这个分数 沿着密度梯度上行  一次被引导的随机走路,向高概率区域.

3. **The ELBO reduces to simple MSE.**完整变量下限 在每个时间步骤都有一个KL术语――使用DDPM的参数化,这些KL术语将简化为带有特定系数的噪音预测MSE;何去掉系数(称其为简单损失),质量反而 *提高* 了――


```figure
diffusion-denoise
```

## 建立它

`code/main.py`实现一个1DDPM──数据是双模式混合物──网 是一个微型的MLP,接收`(x_t, t)`并输出预测噪音――训练是一行损失――采样 代逆链――

### 步骤1:前进时间表 (封闭表格)

```python
betas = [1e-4 + (0.02 - 1e-4) * t / (T - 1) for t in range(T)]
alphas = [1 - b for b in betas]
alpha_bars = []
cum = 1.0
for a in alphas:
    cum *= a
    alpha_bars.append(cum)
```

### 步骤2: 样本`x_t`在一个射击中

```python
def forward_sample(x0, t, alpha_bars, rng):
    a_bar = alpha_bars[t]
    eps = rng.gauss(0, 1)
    x_t = math.sqrt(a_bar) * x0 + math.sqrt(1 - a_bar) * eps
    return x_t, eps
```

### 步骤3:一个训练步骤

```python
def train_step(x0, model, alpha_bars, rng):
    t = rng.randrange(T)
    x_t, eps = forward_sample(x0, t, alpha_bars, rng)
    eps_hat = model_forward(model, x_t, t)
    loss = (eps - eps_hat) ** 2
    return loss, gradient_step(model, ...)
```

### 步骤4:反向采样

```python
def sample(model, alpha_bars, T, rng):
    x = rng.gauss(0, 1)
    for t in range(T - 1, -1, -1):
        eps_hat = model_forward(model, x, t)
        beta_t = 1 - alphas[t]
        x = (x - beta_t / math.sqrt(1 - alpha_bars[t]) * eps_hat) / math.sqrt(alphas[t])
        if t > 0:
            x += math.sqrt(beta_t) * rng.gauss(0, 1)
    return x
```

对于40个时间步骤和24个单元MLP的1D问题,它大约200个时代就能学会两种模式混合物.

## 时间定制

需要知道它正在指明哪个时间步骤.

- **Sinusoidal embedding.**类似变压器位置编码──`embed(t) = [sin(t/ω_0), cos(t/ω_0), sin(t/ω_1), ...]`传入MLP,播出到网络中.
- **Film / group-norm conditioning.**在每个区块中将嵌入项目为每道尺度/偏差 (FiLM) 

我们的玩具代码 使用突状 → 缩影――生产U-网 使用 FiLM――

## 陷

- **Schedule matters a lot.**线性`β`虽然是DDPM默认,但可西因时间表 ((尼乔尔和达里瓦尔,2021) 在同一个计算下给出更好的FID──如果质量高原,就切换时间表──
- **Timestep embedding is fragile.**把原始`t`作为浮动 传入对玩具1-D 可行,但对图像会失败;始终使用适当的嵌入式──
- **V-prediction vs ε-prediction.**对狭窄的制度 ((非常小或非常大),`ε`的信号到噪音 很差──V预测`v = α·ε - σ·x`更多稳定;SDXL、SD3 和流动都使用它.
- **Classifier-free guidance.**推理时,同时计算条件和无条件`ε`然后`ε_cfg = (1 + w) · ε_cond - w · ε_uncond`在其中`w ≈ 3-7`◎ 第八课 会覆盖──
- **1000 steps is a lot.**生产使用DDIM(20-50步骤)、DPM-Solver(10-20步骤) 或蒸(1-4步骤)──见12课──

## 用它

| Role | Typical stack in 2026 |
|------|-----------------------|
| Image pixel-space diffusion (small, toy) | DDPM + U-Net |
| Image latent diffusion | VAE encoder + U-Net or DiT (Lesson 07) |
| Video latent diffusion | Spatiotemporal DiT (Sora, Veo, WAN) |
| Audio latent diffusion | Encodec + diffusion transformer |
| Science (molecules, proteins, physics) | Equivariant diffusion (EDM, RFdiffusion, AlphaFold3) |

扩散是通用生成脊柱. 流量匹配 (课3) 是2024-2026年竞争对手,在相同的质量下通常在推断速度中获胜.

## 运送它

保存`outputs/skill-diffusion-trainer.md`△技能 接收数据集 +计算预算,并输出:时间表(线性/可西因/西格莫ид) 预测目标(ε/v/x) 步骤数量、指导尺度、样本家族 和评估协议――

## 运动

1. **Easy.**在`code/main.py`中把 T从40 改为10 △样本质量(输出的视觉历史图) 如何退化?在什么 T 上的两模式结构崩?
2. **Medium.**从 ε-预测 切换到 v-预测――重新推导反向步骤――比较最终的样本质量――
3. **Hard.**添加无类别指导.`c ∈ {0, 1}`作为条件,在训练时10%的时间下降,并在采样时使用`ε = (1+w)·ε_cond - w·ε_uncond`测量`w = 0, 1, 3, 7`时的条件模式打击率

## 关键词

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Forward process | “Adding noise” | 固定 Markov chain `q(x_t \| x_{t-1})`，用于摧毁 data。 |
| Reverse process | “Denoising” | Learned chain `p_θ(x_{t-1} \| x_t)`，用于重构 data。 |
| β schedule | “The noise ladder” | Per-step variance；linear、cosine 或 sigmoid。 |
| α̅ | “Alpha bar” | Cumulative product `∏(1 - β)`；给出从 `x_0` 得到 `x_t` 的 closed-form。 |
| Simple loss | “MSE on noise” | `\|\|ε - ε_θ(x_t, t)\|\|²`；所有 variational derivations 都 collapse 到这里。 |
| ε-prediction | “Predict noise” | 输出是被加入的 noise；standard DDPM。 |
| V-prediction | “Predict velocity” | 输出是 `α·ε - σ·x`；在整个 t 上有更好的 conditioning。 |
| DDPM | “The paper” | Ho et al. 2020；linear β、1000 steps、U-Net。 |
| DDIM | “Deterministic sampler” | Non-Markov sampler，20-50 steps，同一个 training objective。 |
| Classifier-free guidance | “CFG” | 混合 conditional 和 unconditional noise predictions 来放大 conditioning。 |

## 产品注:扩散推断是一个步数问题

运行T=1000反向步骤――没有人把它用于生产交付――每个真实推断堆都会选择三种策略之一 并且每个种都能清晰映射到生产框架:

1. **Faster sampler, same model.**通过"反向循环"的转换,已训练的`ε_θ`变化.将延迟降低20-50×.
2. **Distillation.**训练学生 以更少的步骤 匹配教师:进步蒸(2 → 1) 、一致性模型(任意 → 1-4)、LCM、SDXL-Turbo、SD3-Turbo──进一步降低延迟 5-10×,需要重新训练──
3. **Caching and compilation.** `torch.compile(unet, mode="reduce-overhead")`ensorRT-LLM的扩散后台`xformers`按步骤延迟将降低约2×──可与 (1) 和 (2) 叠加──

对于生产传播服务器,预算对话和生产文献,对于LLM的描述相同:延迟是`num_steps × step_cost + VAE_decode`通过是`batch_size × (num_steps × step_cost)^-1`△TTFT 很小(一个步骤);TPOT相当于是完整的响应时间,因为从用户视角看,图像生成是一次性──

## 进一步阅读

- [Sohl-Dickstein et al. (2015). Deep Unsupervised Learning using Nonequilibrium Thermodynamics](https://arxiv.org/abs/1503.03585) 传播纸,超前于时代――
- [Ho, Jain, Abbeel (2020). Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239)    
- [Song, Meng, Ermon (2021). Denoising Diffusion Implicit Models](https://arxiv.org/abs/2010.02502) DDIM,更少的步骤.
- [Nichol & Dhariwal (2021). Improved DDPM](https://arxiv.org/abs/2102.09672)代数时间表,学习变异.
- [Dhariwal & Nichol (2021). Diffusion Models Beat GANs on Image Synthesis](https://arxiv.org/abs/2105.05233)分类指导
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598)    
- [Karras et al. (2022). Elucidating the Design Space of Diffusion-Based Generative Models (EDM)](https://arxiv.org/abs/2206.00364)统一的标记,最清晰的食谱――
