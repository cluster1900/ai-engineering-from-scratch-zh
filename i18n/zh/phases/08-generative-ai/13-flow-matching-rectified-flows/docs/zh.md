# 流量与修改流量相匹配

> 扩散模型需要20-50个采样步骤,因为它们会沿着从噪音到数据的曲路径走走走.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 06 (DDPM), Phase 1 · Calculus
**Time:** ~45 minutes

## 问题

转向过程是一个从`N(0, I)`回到数据分布的1000步随机游走――DDIM将其缩小为20-50个确定性步骤――你想要更少的步骤,理想情况下只需一步――阻碍在寻求反向过程的ODE是硬的;路径是曲的――

如果你可以训练模型,使从噪音到数据的路径是直线,`t=1`到了`t=0`单个尤勒步骤 就能工作. 流量匹配 直接构建这一点:定义从 `x_1 ∼ N(0, I)`到了`x_0 ∼ data`的直线插值,训练向量场`v_θ(x, t)`时间导数和时间导数相匹配,并推断

通过二次回流后,2步样品可以匹配50步DDPM的质量──

## 核心概念

![Flow matching: straight-line interpolation between noise and data](../assets/flow-matching.svg)

### 直线流

定义:

```
x_t = t · x_1 + (1 - t) · x_0,   t ∈ [0, 1]
```

其中`x_0 ~ data`没有任何`x_1 ~ N(0, I)`△沿着直线的时间导数是常数:

```
dx_t / dt = x_1 - x_0
```

定义一个神经向量领域`v_θ(x_t, t)`并且训练它匹配这个导数:

```
L = E_{x_0, x_1, t} || v_θ(x_t, t) - (x_1 - x_0) ||²
```

这就是**conditional flow matching**,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,`(x_0, x_1, t)`并做回归.

### 采样

在推断时,沿时间*反向*积分学到的向量场:

```
x_{t-Δt} = x_t - Δt · v_θ(x_t, t)
```

从`x_1 ~ N(0, I)`开始,用艾勒的步骤 一路降到`t=0`,我知道.

### 调整流量 ( 2022)

直接流程可以工作,但学习的路径实际上不是直线,因为许多`x_0`可以映射到同一个`x_1`❖调整流量的反流步骤:

1. 用随机配对训练流量模型v_1──
2. 通过将 v_1 从 `x_1`积分到其落点`x_0`采样 N 对`(x_1, x_0)`,我知道.
3. 在这些配对样本上训练 v_2──因为这些配对现在是ODE-匹配的,它们之间的直线插值确实更平坦──
4. 复制

实践中,2次回流 代就能接近线性,从而实现 2-4 步推断──SDXL-Turbo、SD3-Turbo、LCM 都来自流量匹配模型蒸而来──

### 为什么它在2024年赢得了图像领域的胜利

三个原因:

1. **Simulation-free training**培训期间不需要ODE 展开,实现极其简单.
2. **更好的 Loss geometry**直线路径具有一致的信号-噪音,而DDPM ε-损失在时间表边处 SNR 很差.
3. **更快的 inference**需要4-8步;配合一致性蒸可达到1步.

## 流量匹配与DPM:精确联系

带高斯定条件路径的流量匹配 就是使用*特定噪音时间表* 的分布──选择 `x_t = α(t) x_0 + σ(t) x_1`时间表,流量匹配就会恢复斯特拉托尼维奇修改的扩散,其中`v = α'·x_0 - σ'·x_1`△对于高斯的路径,两者在代数上等价.

增加的流量匹配是:目标的*清晰性*(普通速度) 、更干净的损失,以及尝试非高斯的插件的自由度──


```figure
normalizing-flow
```

## 构建它

`code/main.py`在双峰高斯混合上实现1D流量匹配──矢量场`v_θ(x, t)`是一个小型的MLP,使用直线目标训练. 在推断时,分别使用1、2、4 和20个尤勒步骤.

### 步骤1:训练损失

```python
def train_step(x0, net, rng, lr):
    x1 = rng.gauss(0, 1)
    t = rng.random()
    x_t = t * x1 + (1 - t) * x0
    target = x1 - x0
    pred = net_forward(x_t, t)
    loss = (pred - target) ** 2
    # backprop + update
```

### 步骤2:多步骤推断

```python
def sample(net, num_steps):
    x = rng.gauss(0, 1)
    for i in range(num_steps):
        t = 1.0 - i / num_steps
        dt = 1.0 / num_steps
        x -= dt * net_forward(x, t)
    return x
```

### 步骤3:比较步骤数

预期4步样品已经能匹配20步质量,这对延迟来说很重要.

## 易踩坑

- **Time parameterization。**流量匹配 使用 `t ∈ [0, 1]`在其中`t=0`是数据,`t=1`是噪音──DDPM 使用 `t ∈ [0, T]`在其中`t=0`是数据,`t=T`是噪音.方向相同,尺度不同.
- **Schedule choice。**调整流的直线是流量匹配时间表,但你也可以使用共数或逻辑正常t样本 (SD3) 获得更好的尺度覆盖.
- **Reflow cost。**为了回流产生配对数据集相当于每样本都运行一次完整的推断――只有当你真的需要1-2步推断时才做回流――
- **Classifier-free guidance 仍然适用。**只有在线性组合中把 ε 换成 v:`v_cfg = (1+w) v_cond - w v_uncond`,我知道.

## 使用它

| Use case | 2026 stack |
|----------|-----------|
| Text-to-image，最佳质量 | Flow matching：SD3、Flux.1-dev |
| Text-to-image，1-4 步 | Distilled flow matching：Flux.1-schnell、SD3-Turbo、SDXL-Turbo |
| 实时 inference | 来自 flow-matched base 的 consistency distillation（LCM、PCM） |
| Audio generation | Flow matching：Stable Audio 2.5、AudioCraft 2 |
| Video generation | Flow matching 与 Diffusion 混合（Sora、Veo、Stable Video） |
| Science / physics（particle trajectories、molecules） | Flow matching + equivariant Vector field |

只有一个篇:2025-2026年论文说 比扩散快,它几乎总是流量匹配 +蒸.

## 交付它

保存`outputs/skill-fm-tuner.md`△该技能 接收一个流程式模型规范,并将其转换为流量匹配训练配置:时间表选择,时间样本分布,统一/逻辑正常) ‧优化器,反流计划,目标步骤计数,标准协议――

## 练习

1. **Easy。**运行`code/main.py`对于真实数据分布的表现,比较1步与20步的MSE.
2. **Medium。**穿着制服`t`采样将集中在中期.
3. **Hard。**实现一次回流 代:通过积分第一个模型 生成对 (x_0, x_1),在这些对上训练第二个模型,并比较1步样品质量──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Flow matching | “Straight-line diffusion” | 训练 `v_θ(x, t)`，使其沿 interpolant 匹配 `x_1 - x_0`。 |
| Rectified flow | “Reflow” | 拉直已学习 flows 的迭代过程。 |
| Velocity field | “v_θ” | model 的输出，即移动 `x_t` 的方向。 |
| Straight-line interpolant | “The path” | `x_t = (1-t)·x_0 + t·x_1`；目标导数很简单。 |
| Euler sampler | “1st order ODE solver” | 最简单的 integrator；当路径较直时效果很好。 |
| Logit-normal t | “SD3 sampling” | 将 `t` sampling 集中到 gradients 最强的中间值附近。 |
| Consistency distillation | “1-step sampler” | 训练 student 将任意 `x_t` 直接映射到 `x_0`。 |
| CFG with velocity | “v-CFG” | `v_cfg = (1+w) v_cond - w v_uncond`；同样技巧，新的变量。 |

## 产品注释:Flux.1-schnell 是最快形态的流量匹配

流量匹配的生产 胜利案例是Flux.1-schnell:一个流量匹配的DiT,被蒸到1-4个推断步骤,同时保持Flux-dev 级别质量。尼尔斯的Run流量在一个8GB机笔记本本册 是参考部署方案:T5 + CLIP编码,量化MMDiT表示(schnell 用4步,而 dev 用50步),VAE解码──核成本计算如下:

| Variant | Steps | Latency at 1024² on L4 | Total FLOPs (relative) |
|---------|-------|------------------------|------------------------|
| Flux.1-dev (raw) | 50 | ~15 s | 1.0× |
| Flux.1-schnell | 4 | ~1.2 s | 0.08× (12× faster) |
| SDXL-base | 30 | ~4 s | 0.25× |
| SDXL-Lightning 2-step | 2 | ~0.3 s | 0.03× |

生产规则:**flow-matched base + distillation = 2026 年快速 text-to-image 的默认方案。**每个主要厂商都在发布这个组合:SD3-Turbo(SD3 +流量 +蒸) √Flux-schnell(Flux-dev +直流直线) √CogView-4-Flash──纯散基只存在于传统检查点中──

## 延伸阅读
- [Liu, Gong, Liu (2022). Flow Straight and Fast: Learning to Generate and Transfer Data with Rectified Flow](https://arxiv.org/abs/2209.03003)直流量――
- [Lipman et al. (2023). Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747)流量匹配──
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) SD3,大规模的调整流量――
- [Albergo, Vanden-Eijnden (2023). Stochastic Interpolants](https://arxiv.org/abs/2303.08797) 覆盖FM+传播的通用框架
- [Song et al. (2023). Consistency Models](https://arxiv.org/abs/2303.01469)                        
- [Sauer et al. (2023). Adversarial Diffusion Distillation (SDXL-Turbo)](https://arxiv.org/abs/2311.17042)轮机变体――
- [Black Forest Labs (2024). Flux.1 models](https://blackforestlabs.ai/announcing-black-forest-labs/)生产中流量匹配──
