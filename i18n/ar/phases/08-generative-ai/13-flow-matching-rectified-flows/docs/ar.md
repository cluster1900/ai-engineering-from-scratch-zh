# التدفق يطابق التدفقات المصلحة

> نماذج التوزيع 需要 20-50 个采样步骤, لأنها سوف تتوافق على طول من الضوضاء إلى البيانات 曲路径行走.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 06 (DDPM), Phase 1 · Calculus
**Time:** ~45 minutes

## 问题

عملية DDPM للعودة إلى الاتجاهات`N(0, I)`للعودة إلى 1000 خطوة من توزيع البيانات. تمتدّد الـDDIM إلى 20 إلى 50 خطوة تحديد.

إذا كنت تستطيع تدريب النموذج، جعل طريق من الضجيج إلى البيانات هو خط مستقيم، ثم من`t=1`إلى`t=0`خطوة أويلر واحدة 就能工作──تطابق التدفق 直接构建这一点:定义从 `x_1 ∼ N(0, I)`إلى`x_0 ∼ data`                                                                                `v_θ(x, t)`أن تطابقها مع عدد الوقت المحدد، ونتخلص من

تدفق معدل ((Liu 2022): المزيد: باستخدام إجراء إعادة التدفق 代地拉直路径، توليد ODE تدريجياً أقرب إلى الخط.

## مفهوم الأساسي

![Flow matching: straight-line interpolation between noise and data](../assets/flow-matching.svg)

### تدفق مباشرة

定义:

```
x_t = t · x_1 + (1 - t) · x_0,   t ∈ [0, 1]
```

من بينهم`x_0 ~ data`،`x_1 ~ N(0, I)`  على طول هذا الخط المباشر هو عدد دائم:

```
dx_t / dt = x_1 - x_0
```

 تعريف حقل متجه عصبي `v_θ(x_t, t)`,并训练它匹配这个导数:

```
L = E_{x_0, x_1, t} || v_θ(x_t, t) - (x_1 - x_0) ||²
```

هذا هو**conditional flow matching**فقدان ((Lipman 2023)  تدريب لا يحتاج إلى محاكاة:`(x_0, x_1, t)`لم يعد هناك رجعة

### 采样

في الاستنتاج، على طول الوقت* عكس الاتجاه*积分学到 من المجال المتجه:

```
x_{t-Δt} = x_t - Δt · v_θ(x_t, t)
```

من`x_1 ~ N(0, I)`بدأت، مع خطوة (أولير)`t=0`.

### تدفق معدل (Liu 2022)

التدفق المستقيم يمكن أن يعمل، ولكن المسار الذي يتم تعلّمه* في الواقع ليس مستقيم*، لأنّه كثير`x_0`يمكن أن تظهر إلى نفس واحد `x_1`❖ خطوة إعادة التدفق المصحّحة:

1. استخدام مع معالجة تدريب نموذج تدفق v_1。
2. 通過將 v_1 من `x_1`积分到其落点 `x_0`, على سبيل المثال`(x_1, x_0)`.
3. في هذه المجموعات على نموذج التدريب v_2.. لأن هذه المجموعات الآن هي متطابقة مع ODE، والخط المباشر بينها حقا أكثر سطحية..
4. -أرجوك

في الممارسة، 2 مرات إعادة التدفق 代就能接近线性، بحيث تحقق استنتاج 2-4 خطوة──SDXL-توربو、SD3-توربو、LCM 都是来自流量匹配模型 蒸而来──

### لماذا فاز في مجال الصور في عام 2024

ثلاثة أسباب:

1. **Simulation-free training**: لا حاجة إلى ODE أثناء التدريب
2. **更好的 Loss geometry**: straight线路径具有一致ة إشارة إلى الضوضاء، بينما DDPM ε-خسارة في الجدول الزمني 边缘处 SNR 很差──
3. **更快的 inference**: في SDXL-Turbo 质量下需要 4-8 خطوات؛配合 التماسة التقطير 可达到 1 خطوة

## التطابق في التدفق مقابل DDPM:精确联系

带 غوسيان-شروط المسار تطابق تدفق 就是使用*特定噪声 schedule* 的 Diffusion──选择 `x_t = α(t) x_0 + σ(t) x_1`الموعد، التدفق مطابقة على استرداد التوزيع الإصلاحي ستراتونوفيتش، من بينها`v = α'·x_0 - σ'·x_1` بالنسبة لمسارات غوسيان، اثنين في العدد على نفس السعر‬

تزييد مطابقة التدفق هو: هدف من* وضوحية*(سرعة عادية)、更干净 من الخسارة، فضلا عن محاولة حرية من غير غوسيان المتداخلات。


```figure
normalizing-flow
```

## بناءها

`code/main.py`في قمة اثنين خليط غوسيا 上 تحقيق 1-D التدفق المقابلة── حقل الناقل `v_θ(x, t)`هو MLP صغير، باستخدام تدريب الهدف مباشرة. في الاستنتاج، تتميز مع 1、2、4 و 20 خطوة أوليتر.

### الخطوة 1: فقدان التدريب

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

### الخطوة الثانية: استنتاج متعدد الخطوات

```python
def sample(net, num_steps):
    x = rng.gauss(0, 1)
    for i in range(num_steps):
        t = 1.0 - i / num_steps
        dt = 1.0 / num_steps
        x -= dt * net_forward(x, t)
    return x
```

### 步骤 3: مقارنة عدد الخطوات

预期 4 خطوة العينات 已能匹配 20 خطوة 质量, this for latency 来说意义重大──

## -سيسهل الوقوف

- **Time parameterization。**تطابق التدفق 使用 `t ∈ [0, 1]`، من بينهم`t=0`نعم البيانات`t=1`هو ضجيجها`t ∈ [0, T]`، من بينهم`t=0`نعم البيانات`t=T`هو صوت. الاتجاه نفسه, الامتداد مختلف.
- **Schedule choice。**الخط المباشر للدفق المعادلة هو جدول مطابقة التدفق، ولكن يمكنك أيضا استخدام كوسين أو التقاط العينات الطبيعية (SD3) للحصول على مقياس أفضل.
- **Reflow cost。**لتحويل المعلومات إلى المجموعة المرتبطة بالبيانات تعادل كل نموذج يدير استنتاج كامل مرة واحدة فقط عندما تحتاج حقا إلى استنتاج خطوة 1-2 فقط عندما تقوم بإعادة التدفق
- **Classifier-free guidance 仍然适用。**فقط تحتاج إلى إعادة التأثير إلى v:`v_cfg = (1+w) v_cond - w v_uncond`.

## استخدمها

| Use case | 2026 stack |
|----------|-----------|
| Text-to-image，最佳质量 | Flow matching：SD3、Flux.1-dev |
| Text-to-image，1-4 步 | Distilled flow matching：Flux.1-schnell、SD3-Turbo、SDXL-Turbo |
| 实时 inference | 来自 flow-matched base 的 consistency distillation（LCM、PCM） |
| Audio generation | Flow matching：Stable Audio 2.5、AudioCraft 2 |
| Video generation | Flow matching 与 Diffusion 混合（Sora、Veo、Stable Video） |
| Science / physics（particle trajectories、molecules） | Flow matching + equivariant Vector field |

فقط إذا كان مقال عام 2025-2026 يقول  أسرع من التوزيع، فإنه تقريبا دائما مطابقة التدفق + التقطير‬

## 交付 it

保存 `outputs/skill-fm-tuner.md` هذه المهارة 接收一个 Diffusion-style model spec,并将其转换为流量匹配培训配置:خيار الجدول 时间采样分布(均 / 逻辑-正常) 优化器、reflow plan、目标步数、eval protocol。

## التدريب

1. **Easy。**运行 `code/main.py`, مقارنة 1 خطوة مع 20 خطوة MSE comparativة لتوزيع البيانات الحقيقية
2. **Medium。**من الزي`t`أخذ العينات 切换到logit-normal (→采样集中在中) ◊ نموذج 质量是否提升؟
3. **Hard。**实现一次回流 代: 通过积分第一个模型 生成对 (x_0, x_1), 在这些对上训练第二个模型,并比较1步样品质量──

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

## ملاحظة الإنتاج:Flux.1-schnell هو التطابق السريع في التدفق

إنتاج مطابقة التدفق 胜利案例是Flux.1-schnell: DiT متطابقة التدفق ، يتم تبخر إلى 1-4 个 مراحل الاستنتاج ، في الوقت نفسه الحفاظ على Flux-dev 级别的质量。Niels' Run Flux على جهاز 8GB المذكرة 是参考部署方案:T5 + CLIP encode,quantized MMDiT denoise(schnell 用 4 步,而 dev 用 50 步),VAE decode──核算如下:

| Variant | Steps | Latency at 1024² on L4 | Total FLOPs (relative) |
|---------|-------|------------------------|------------------------|
| Flux.1-dev (raw) | 50 | ~15 s | 1.0× |
| Flux.1-schnell | 4 | ~1.2 s | 0.08× (12× faster) |
| SDXL-base | 30 | ~4 s | 0.25× |
| SDXL-Lightning 2-step | 2 | ~0.3 s | 0.03× |

قواعد الإنتاج:**flow-matched base + distillation = 2026 年快速 text-to-image 的默认方案。**كل المنتجين الرئيسيون في إصدار هذا المجموعة:SD3-Turbo(SD3 + تدفق + نزيف)

## 延伸阅读
- [Liu, Gong, Liu (2022). Flow Straight and Fast: Learning to Generate and Transfer Data with Rectified Flow](https://arxiv.org/abs/2209.03003) تدفق معدل
- [Lipman et al. (2023). Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747) تناغم التدفق
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) SD3، تدفق معدل على نطاق واسع
- [Albergo, Vanden-Eijnden (2023). Stochastic Interpolants](https://arxiv.org/abs/2303.08797) 覆盖 FM + الإطار العام للتوزيع
- [Song et al. (2023). Consistency Models](https://arxiv.org/abs/2303.01469) عملية تصفية خطوة واحدة للتنشر / التدفق
- [Sauer et al. (2023). Adversarial Diffusion Distillation (SDXL-Turbo)](https://arxiv.org/abs/2311.17042) تغيرات توربو
- [Black Forest Labs (2024). Flux.1 models](https://blackforestlabs.ai/announcing-black-forest-labs/) تناغم تدفقات الإنتاج
