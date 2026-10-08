# المواد المزروعة في المواد المزروعة

> رفيقي في عام 2014 كانت المهارات تتجاوز الكثافة تماما. شبكتين. واحدة تصنع مزيفات. واحدة تمسك بها.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 08 (Optimizers), Phase 8 · 02 (VAE)
**Time:** ~75 minutes

## 问题

ستنتج VAEs عينات مضحكة، لأن فقدان ميكروموترات MSE لهما هو أفضل بالنسبة لـ * متوسط القيمة * الصور، بينما متوسط عدد معقول كثير من الأرقام هو رقم مضحكة.

فكرة رفيقي الجيد: تدريب مصنف`D(x)`لتفرق بين الصور الحقيقية والمزيفة تدريب مولد`G(z)`ليتخدع`D`.`G`إشارة الخسارة هي`D`عندما يعتقدون أن شيء يبدو حقيقياً`G`تحسين، هذه الإشارة ستجدد أيضاً، تتبع هدف متحرك.`G`في أي وقت مضى`log p(x)`في حالة تعلمت توزيع البيانات

هذا هو التدريب المضاد.

```
min_G max_D  E_real[log D(x)] + E_fake[log(1 - D(G(z)))]
```

بحلول عام 2026 ، لم تعد GANs مصدر SOTA ((الانتشار والتطابق التدفقي 夺走王冠) ‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

## 概念

![GAN training: generator and discriminator in minimax](../assets/gan.svg)

**Generator `G(z)`。**ستقوم بضجيج متجه`z ~ N(0, I)`映射到样本 `x̂`△ △ 形状的网络 △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ 

**Discriminator `D(x)`。**سوف يتم تصوير العينة للاحتمالات المتعددة (أو النتيجة)

**Loss。**两个交替更新:

- **训练 `D`：** `loss_D = -[ log D(x) + log(1 - D(G(z))) ]`◊对真=1,假=0 جعل ثنائي الانتروبيا المتقاطعة‬
- **训练 `G`：** `loss_G = -log D(G(z))`هذا هو Goodfellow استخدامات غير مشبعة 形式(原始的 `log(1 - D(G(z)))`سأشبع و سأذهب`D`ثقة كبيرة في أنّه يقتل المرتفعات)

**Training loop。**واحد `D`, خطوة `G`✿重复✿

**为什么它能工作。**إذا`G`完美匹配 `p_data`، إذاً`D`لا يوجد شيء أفضل من التخمينات، و هناك 0.5`G`لا يُحصل على تراجع.

**为什么它会失效。**انهيار الوضع`G`找到 واحد `D`لا يمكن أن تفصل النظام، ثم دائماإصلاحه`D`تعلمت بسرعة كبيرة`log D`التدريب غير مستقرة

## 让 GANs قابل الاستخدام

| Year | Innovation | Fix |
|------|------------|-----|
| 2015 | DCGAN | Conv/deconv、batch norm、LeakyReLU —— 第一个稳定 architecture。 |
| 2017 | WGAN, WGAN-GP | 用 Wasserstein distance + gradient penalty 替换 BCE。修复 vanishing gradient。 |
| 2017 | Spectral normalization | 对 discriminator 做 Lipschitz-bound。2026 年的 discriminators 中仍在使用。 |
| 2018 | Progressive GAN | 先训练低分辨率，再添加 layers。首次达到 megapixel results。 |
| 2019 | StyleGAN / StyleGAN2 | Mapping network + adaptive instance norm。固定领域 photorealism 的 state of the art。 |
| 2021 | StyleGAN3 | Alias-free、translation-equivariant —— 2026 年仍然是 face gold standard。 |
| 2022 | StyleGAN-XL | Conditional、class-aware、更大 scale。 |
| 2024 | R3GAN | 以更强 regularization 重新包装；无需 tricks 即可在 1024² 上工作。 |


```figure
gan-minimax
```

## بناءها

`code/main.py`في بيانات 1-D 上训练一个小型GAN:两个高西亚的混合──生成器和歧视器 都是单层隐藏MLPs──我们手写实现前进、后退 和最小x循环──目标是看两个关键失败模式(模式崩 + 渐变消失) كيف يحدث──

### الخطوة الأولى: خسارة غير مشبعة

وفقدان فانيلا غودفيلو`log(1 - D(G(z)))`في الوقت الحالي ، فإن تراجعة G ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ ٌ`-log D(G(z))`مع عكس: عندما يكون D متيقنا جدا عندما ينفجر، أعط G إشارة قوية.

```python
def g_loss(d_fake):
    # maximize log D(G(z))  <=>  minimize -log D(G(z))
    return -sum(math.log(max(p, 1e-8)) for p in d_fake) / len(d_fake)
```

### الخطوة 2: كل خطوة مولد للخطوة التمييزية

```python
for step in range(steps):
    # train D
    real_batch = sample_real(batch_size)
    fake_batch = [G(z) for z in sample_noise(batch_size)]
    update_D(real_batch, fake_batch)

    # train G
    fake_batch = [G(z) for z in sample_noise(batch_size)]  # fresh fakes
    update_G(fake_batch)
```

إستخدم مزيفات جديدة وإلا ستنتهي المراجع

### 步骤 3:  مشاهدة وضع الانهيار

```python
if step % 200 == 0:
    samples = [G(z) for z in sample_noise(500)]
    mode_a = sum(1 for s in samples if s < 0)
    mode_b = 500 - mode_a
    if min(mode_a, mode_b) < 50:
        print("  [!] mode collapse: one mode is starved")
```

العلامات الكلاسيكية: في بين الحالتين الحقيقيتين، هناك واحدة توقف تم إنشاؤها.

## فخ

- **Discriminator 太强。**أن يقل معدل تعلم D من 2-5x، أو يضيف ضجيج مثالي/طبقة.
- **Generator 记住了一个 mode。**إعطاء مدخلات D + ضجيج، استخدام طبقة التمييز المكونة من المجموعات الصغيرة، أو التغيير إلى WGAN-GP。
- **Batch norm 泄漏 statistics。**الحزمة الحقيقية + الحزمة المزيفة 流经同一个BN layer 会混合它们的统计学──改用实例规范或光谱规范──
- **Inception-score gaming。**FID 和 IS في عدد العينات المنخفضة
- **对于 conditional tasks，one-shot sampling 是谎言。**لازلت بحاجة إلى مقياسات CFG، خدوش التخطي وإعادة العينات للحصول على نتائج قابلة للتطبيق

## استخدمها

كومة GAN لعام 2026:

| Situation | Pick |
|-----------|------|
| Photoreal human faces, fixed pose | StyleGAN3（最锐利、最小） |
| Anime / stylized faces | StyleGAN-XL 或 Stable Diffusion LoRA |
| Image-to-image translation | Pix2Pix / CycleGAN（Phase 8 · 04）或 ControlNet（Phase 8 · 08） |
| Fast 1-step text-to-image | diffusion 的 adversarial distillation（SDXL-Turbo, SD3-Turbo） |
| Perceptual loss inside a diffusion trainer | image crops 上的小型 GAN discriminator |
| Anything multi-modal, open-ended | 不要用 —— 使用 diffusion 或 flow matching |

GANs 利但狭窄──一旦你的域 打开,比如照片、任意 text prompt、视频,就切换到 diffusion──逆境技巧 作为组件继续存在(perceptual losses、distillation),而不是独立生成器──

## 交付 it

保存 `outputs/skill-gan-debugger.md`موهبة 接收一次失败的GAN run ((نقصان منحنى、نموذج الشبكة、حجم مجموعة البيانات) ،并输出 حسب احتمال ترتيب الأسباب、تحديدات خط واحد 和 إعادة تشغيل بروتوكول‬

## التدريب

1. **Easy。**استخدامات الاختيارات`code/main.py`‬ ‫ثمّ إعدادها‬`D_LR = 5 * G_LR`لم يعد يعمل. هل فقدان G قد ينهار بسرعة إلى العدد العادي؟
2. **Medium。**استخدام خسارة WGAN بدل خسارة Goodfellow BCE:`loss_D = E[D(fake)] - E[D(real)]`،`loss_G = -E[D(fake)]`، و سوف د الوزن المقطوعة إلى `[-0.01, 0.01]`◊ التدريب هل هو أكثر استقرارًا؟
3. **Hard。**لنشر نموذج 1-D إلى بيانات 2-D ((8 خليط غوسيان على الحلقة)  مولد التتبع في خطوات 1ك、5ك、10ك  نلتقط 8 أوضاع  نلتقط التمييز الحصري والقياس مجددًا‬

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Generator | "G" | noise-to-sample network，`G: z → x̂`。 |
| Discriminator | "D" | Classifier `D: x → [0, 1]`，real vs fake。 |
| Minimax | "The game" | joint objective 的 `min_G max_D`。 |
| Non-saturating loss | "The fix" | 对 G 使用 `-log D(G(z))`，而不是 `log(1 - D(G(z)))`。 |
| Mode collapse | "G memorized one thing" | 尽管 data 多样，Generator 只产生少量不同 outputs。 |
| WGAN | "Wasserstein" | 用 Earth-Mover distance + gradient penalty 替换 BCE；gradient 更平滑。 |
| Spectral norm | "Lipschitz trick" | 约束 D 的 weight norms 来 bound 它的 slope；稳定 training。 |
| StyleGAN | "The one that works" | Mapping network + AdaIN；faces 领域 best-in-class，2026 年仍然如此。 |

## ملاحظة إنتاج: استنتاج واحد هو GAN

في مجال النطاق المفتوح، لم تعد النتائج واضحة، ولكن لا تزال في التكلفة الاستنتاجية.

- **没有 prefill，没有 decode stages。**مرة واحدة`G(z)`المضي قدما ًTTFT ≈ التأخير الكلي ً
- **没有 KV-cache pressure。**الحالة الوحيدة هي الوزن. حجم الحزمة.
- **Trivial continuous batching。**نظراً لكل طلب تم استهلاك نفس المعدلات المثبتة، الخادم  المستهدف المبلغ المكثف تحت المجموعة ثابتة عادةً ما يكون أفضل.

هذا هو السبب في أن نزيف GAN ((SDXL-Turbo، SD3-Turbo، ADD، LCM) هو 2026 سنة سريعة النص إلى الصورة 的主导技术: فإنه يضع خط أنابيب التوزيع 20-50 خطوة  ضغط إلى 1-4 مرات على نمط GAN إلى الأمام، مع الحفاظ على توزيع قاعدة التوزيع── فقدان عكسية 作为训练时间扣 存活下来,用来把慢发电机 变成快发电机──

## 延伸阅读

- [Goodfellow et al. (2014). Generative Adversarial Nets](https://arxiv.org/abs/1406.2661) أوراق GAN الأصلية
- [Radford et al. (2015). Unsupervised Representation Learning with DCGAN](https://arxiv.org/abs/1511.06434) 第一个稳定架构──
- [Arjovsky, Chintala, Bottou (2017). Wasserstein GAN](https://arxiv.org/abs/1701.07875) WGAN。
- [Miyato et al. (2018). Spectral Normalization for GANs](https://arxiv.org/abs/1802.05957) SN‬
- [Karras et al. (2020). Analyzing and Improving the Image Quality of StyleGAN](https://arxiv.org/abs/1912.04958) StyleGAN2。
- [Karras et al. (2021). Alias-Free Generative Adversarial Networks](https://arxiv.org/abs/2106.12423) StyleGAN3。
- [Sauer et al. (2023). Adversarial Diffusion Distillation](https://arxiv.org/abs/2311.17042) SDXL-Turbo
