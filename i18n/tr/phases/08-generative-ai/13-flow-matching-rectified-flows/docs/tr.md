# Akış Düzeltilmiş Akışlarla Eşleşir

> Yayınlama modelleri 20-50 个采样步骤 gerektirir, çünkü bunlar gürültüden veriye 曲路径走走走走──Flow eşleşmesi (Lipman et al., 2023) ve düzeltilmiş akış (Liu et al., 2022) ile birlikte çalışır.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 06 (DDPM), Phase 1 · Calculus
**Time:** ~45 minutes

## 问题

DDPM'nin ters yönlü süreçleri bir`N(0, I)`DİM, verilerin dağıtımının 1000 adımını 20-50 belirleyici adımlara kısaltır. İdeal olarak daha az adım isteseydin, adımlar daha az olurdu.

Eğer bir model eğitimi yaparsanız, gürültüden veriye giden yol bir düz çizgiyle, o zaman `t=1`- Ne ?`t=0`Bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde, bu yönde,`x_1 ∼ N(0, I)`- Ne ?`x_0 ∼ data`Yönlü vektör alanı `v_θ(x, t)`Zamanı ile uyumlu hale getirip sonuçlandırmak için.

Düzeltilmiş akış (Liu 2022) daha da ileri: reflow prosedürü ile 代地拉直路径, gittikçe daha yakın 线性 ODE üretmek için.

## 核心概念

![Flow matching: straight-line interpolation between noise and data](../assets/flow-matching.svg)

### Doğal akış

定义:

```
x_t = t · x_1 + (1 - t) · x_0,   t ∈ [0, 1]
```

İçlerinden `x_0 ~ data`- Evet .`x_1 ~ N(0, I)` Bu düz çizginin boyunca zaman yönü bir adetdir:

```
dx_t / dt = x_1 - x_0
```

 define a Neural Vector alanı `v_θ(x_t, t)`,并训练它匹配这个导数:

```
L = E_{x_0, x_1, t} || v_θ(x_t, t) - (x_1 - x_0) ||²
```

İşte bu.**conditional flow matching**Loss ((Lipman 2023);; Training does not need simulation:`(x_0, x_1, t)`Geri dönüş yapmadı.

### 采样

时, along time*反向*积分学到的矢量 Alanı:

```
x_{t-Δt} = x_t - Δt · v_θ(x_t, t)
```

- Evet .`x_1 ~ N(0, I)`Başlayın, Euler'ın adımını kullanın.`t=0`- Evet.

### Düzeltilmiş akış (Liu 2022)

Doğrudan akış çalışabilir, ama öğrenme yolları aslında düz değildir, çünkü birçok `x_0`Aynı birinden görüntülenebilir.`x_1`❖ Düzeltilmiş akışın yeniden akış adımları:

1. UZ随机配对训练流模型 v_1──
2. 通過将 v_1 `x_1`积分到其落点 `x_0`, Tıpkı N için`(x_1, x_0)`- Evet.
3. Bu çiftler arasında düz bir bağlantı var ve bu çiftler arasında daha düz bir bağlantı var.
4. Tekrarlıyorum.

实践中,2次回流 代就能接近线性,从而实现 2-4 adım sonucu──SDXL-Turbo、SD3-Turbo、LCM 都是来自流相对应模型 蒸而来──

### Neden 2024 yılında resim alanında kazandı ?

Üç neden:

1. **Simulation-free training**Eğitim sırasında ODE'ye ihtiyaç yok, gerçekleştirmek çok basit.
2. **更好的 Loss geometry**DDPM ε-kayıpları ise programın kenarında SNR  çok farklıdır.
3. **更快的 inference**SDXL-Turbo 质量下 4-8 adım gerektirir; 1 adım kadar düzeltilme yapılır.

## Akış eşleşimi vs DDPM:精确联系

带 Gaussian-kondisyonlu yolu ın akış eşleşmesi  就是使用*特定噪声 schedule* 的 Diffusion──选择 `x_t = α(t) x_0 + σ(t) x_1`Program, akış eşleşmesi, Stratonovich'in dönüştürdüğü yayılma yeniden başlatılması.`v = α'·x_0 - σ'·x_1` Gaussian yolları için, ikisi de 代数上等价

Akış eşleşimi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         


```figure
normalizing-flow
```

## Yapın onu.

`code/main.py`İki peşe Gaussian karışımı 上 1-D akış eşleşmesi gerçekleştirmek── vektör alanı `v_θ(x, t)`Bu, küçük bir MLP, doğrudan hedef eğitimi kullanıyor.

### 步骤1:Eğitim kaybı

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

### 步骤 2: Çok adımlı sonuç

```python
def sample(net, num_steps):
    x = rng.gauss(0, 1)
    for i in range(num_steps):
        t = 1.0 - i / num_steps
        dt = 1.0 / num_steps
        x -= dt * net_forward(x, t)
    return x
```

### 步骤 3: 步骤 sayısını karşılaştır

4 adımlı örnekleme cihazı 20 adımlı kaliteye uygun hale geldi. Bu gecikme için önemli bir anlam taşıyor.

## Kapatmak kolay

- **Time parameterization。**Akış eşleşimi 使用 `t ∈ [0, 1]`, içinden `t=0`Evet, veriler.`t=1`Evet, bu sesli.`t ∈ [0, T]`, içinden `t=0`Evet, veriler.`t=T`Bu sesli bir yazı.
- **Schedule choice。**Düzeltilmiş akışın düz çizgisi  akış eşleşme çizgisi, ama daha iyi bir ölçek kapsamı elde etmek için cosine veya logit-normal t-sampling kullanılabilir.
- **Reflow cost。**Refluj için, her örnek tam bir sonuca ulaşır. Sadece 1-2 adım sonuca ulaşmak için bir sonuca ulaşmak gerekir.
- **Classifier-free guidance 仍然适用。**Sadece online 组合中把 ε 换成 v:`v_cfg = (1+w) v_cond - w v_uncond`- Evet.

## Kullan

| Use case | 2026 stack |
|----------|-----------|
| Text-to-image，最佳质量 | Flow matching：SD3、Flux.1-dev |
| Text-to-image，1-4 步 | Distilled flow matching：Flux.1-schnell、SD3-Turbo、SDXL-Turbo |
| 实时 inference | 来自 flow-matched base 的 consistency distillation（LCM、PCM） |
| Audio generation | Flow matching：Stable Audio 2.5、AudioCraft 2 |
| Video generation | Flow matching 与 Diffusion 混合（Sora、Veo、Stable Video） |
| Science / physics（particle trajectories、molecules） | Flow matching + equivariant Vector field |

Sadece bir makale 2025-2026 yılları için difüzyon den hızlı, neredeyse her zaman akış eşleşme + destillasyon 

## - Söyle.

保存 `outputs/skill-fm-tuner.md`△ bu beceri 接收一个Difusion-style model spec,并将其转换为流匹配训练配置:时间表选择、时间样本分布(均/logit-normal) Optimize­rer、reflow plan、目标步骤计数、eval protokol。

## 练习

1. **Easy。**运行  İşlem`code/main.py`, 1-Hatırlama ile 20-Hatırlama MSE karşılaştırın Gerçek Veri dağıtımının göstergesi
2. **Medium。**Üniforma'dan.`t`Örnekleme 切换到logit-normal (d) 将采样集中在 t)  model 质量是否提升?
3. **Hard。**实现一次反流 代:通过积分第一个模型 生成对 (x_0, x_1),在这些对上训练第二个模型,并比较1步样品质──

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

## Üretim Notı:Flux.1-schnell en hızlı biçimdeki akış eşleşmesi

Flow eşleşme üretim 胜利案例是Flux.1-schnell: bir akış eşleşen DiT, 1-4 个推理步骤蒸到,同时保持Flux-dev 级别质量。Niels'in Run Flow on an 8GB makina notebook 是参考部署方案:T5 + CLIP code,quantized MMDiT denoise(schnell 用4 步,而 dev 用50 步),VAE decode──成本核算如下:

| Variant | Steps | Latency at 1024² on L4 | Total FLOPs (relative) |
|---------|-------|------------------------|------------------------|
| Flux.1-dev (raw) | 50 | ~15 s | 1.0× |
| Flux.1-schnell | 4 | ~1.2 s | 0.08× (12× faster) |
| SDXL-base | 30 | ~4 s | 0.25× |
| SDXL-Lightning 2-step | 2 | ~0.3 s | 0.03× |

Üretim kuralları:**flow-matched base + distillation = 2026 年快速 text-to-image 的默认方案。**Her ana üreticisi bu kitleyi yayımlıyor:SD3-Turbo(SD3 + akış + destillasyon)、Flux-schnell(Flux-dev + düzeltilmiş akış düzeltmesi)、CogView-4-Flash。

## 延伸阅读
- [Liu, Gong, Liu (2022). Flow Straight and Fast: Learning to Generate and Transfer Data with Rectified Flow](https://arxiv.org/abs/2209.03003) düzeltilmiş akışı。
- [Lipman et al. (2023). Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747) akış eşleşimi。
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) SD3, büyük çapta düzeltilmiş akış
- [Albergo, Vanden-Eijnden (2023). Stochastic Interpolants](https://arxiv.org/abs/2303.08797)FM + Diffusion'ın genel çerçevesini kapsar.
- [Song et al. (2023). Consistency Models](https://arxiv.org/abs/2303.01469) Diffüzyon / akışın 1 adımlı destilasyonu。
- [Sauer et al. (2023). Adversarial Diffusion Distillation (SDXL-Turbo)](https://arxiv.org/abs/2311.17042)Turbo varianti.
- [Black Forest Labs (2024). Flux.1 models](https://blackforestlabs.ai/announcing-black-forest-labs/) üretim arasında akış eşleşimi
