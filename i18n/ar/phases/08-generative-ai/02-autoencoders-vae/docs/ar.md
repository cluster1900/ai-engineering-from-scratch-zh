# المُحَرِّفات الذاتية والمتغيرات المُحَرِّفات الذاتية (VAE)

> عادي المُصطدر السريع قبل الضغط إعادة بناءها. سوف تذكرها. لن تولد.`z = μ + σ·ε`إعادة تشكيل الصورة، هذا هو السبب في أن كل نموذج للتوزيع الخفيف والتي تطابق التدفق الذي ستستخدم في عام 2026

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 07 (CNNs), Phase 8 · 01 (Taxonomy)
**Time:** ~75 分钟

## المشكلة

وضع رقم من 784 بكسل من MNIST  ضغط إلى 16 رمز رقمي ، ثم إعادة بناءها.

ما تريد حقا هو: (أ) مساحة الرمز هو توزيع صاف ▌平滑 ▌يمكن من خلال العينة، مثل غوسيانية متنازلة `N(0, I)`،(ب) فك أي عينة قد تنتج رقم معقول ،(ج) رمز و رمز تعريف 仍然能很好地压缩──三目标,一个架构,一个损失──

Kingma's 2013 VAE                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `q(z|x) = N(μ(x), σ(x)²)`لتحل هذه المشكلة، مع عقوبة KL وضع هذا التوزيع 拉向前 `N(0, I)`ثم في فك قبل من`q(z|x)`العينة`z`في الاستنتاج، فقدت المُرمّدة، العينة`z ~ N(0, I)`العقوبة كيل هو إضافة مساحة الرموز إلى الهيكل

في عام 2026، VAE 很少单独交付  في جودة الصورة الأصلية  فوقها تمت توزيع 超越  ولكن أنها هي الرمز الأول للنموذج التوزيع الخفيف الخاص بـSD 1/2/XL/3、Flux、AudioCraft‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

## المفهوم

![Autoencoder vs VAE: the reparameterization trick](../assets/vae.svg)

**Autoencoder.** `z = encoder(x)`،`x̂ = decoder(z)`، الخسارة = `||x - x̂||²` مساحة الرمز 无结构。

**VAE encoder.**输出2 متجهات:`μ(x)`和 `log σ²(x)`لقد حددت`q(z|x) = N(μ, diag(σ²))`.

**Reparameterization trick.**من`q(z|x)`العينة لا يمكن أن تكون صغيرة`z = μ + σ·ε`، من بينهم`ε ~ N(0, I)`الآن`z`نعم`(μ, σ)`إضافة إلى الضجيج غير المعادلة وظيفة تحديدية  تراجعات يمكن أن تدفق `μ`和 `σ`.

**Loss.**دليل الرابط السفلي (ELBO) ، اثنين من المشاريع:

```
loss = reconstruction + β · KL[q(z|x) || N(0, I)]
     = ||x - x̂||²  + β · Σ_i ( σ_i² + μ_i² - log σ_i² - 1 ) / 2
```

إعادة الإعمار`x̂`推向 `x`-كلا، لا`q(z|x)`推向前──它们相互权衡──小 β (<1) = 更利的样本,代码空间 不那么 Gaussian──大 β (>1) = 更干净的代码空间,更模糊的样本──β-VAE(Higgins 2017) جعل هذا المدير معروف,并开启了解散研究──

**Sampling.**الإستثمار 时:抽取 `z ~ N(0, I)`,مضي قدما عبر المُعَطِّف . .مرة واحدة تمضي قدماً


```figure
vae-latent-grid
```

## بناءها

`code/main.py`实现一个不使用 numpy 或 torch 的微型 VAE──输入是从 8-D 中的2组件高斯混合 抽取的8维合成数据──编码和解码都是单个隐藏层 MLP──我们实现 tanh激活、前传、损失,以及手写后传──不是生产 是教学──

### الخطوة 1: المُشفّر إلى الأمام

```python
def encode(x, enc):
    h = tanh(add(matmul(enc["W1"], x), enc["b1"]))
    mu = add(matmul(enc["W_mu"], h), enc["b_mu"])
    log_sigma2 = add(matmul(enc["W_sig"], h), enc["b_sig"])
    return mu, log_sigma2
```

استخدام `log σ²`بدلاً من ذلك`σ`، مثل إنتاج الشبكة غير مقيدة ((على σ جعل softplus هو في حبل  في σ ≈ 0 时 تراجعات سوف تختفي) 

### الخطوة الثانية: إعادة تشكيل وتحديد المعدلات

```python
def reparameterize(mu, log_sigma2, rng):
    eps = [rng.gauss(0, 1) for _ in mu]
    sigma = [math.exp(0.5 * lv) for lv in log_sigma2]
    return [m + s * e for m, s, e in zip(mu, sigma, eps)]

def decode(z, dec):
    h = tanh(add(matmul(dec["W1"], z), dec["b1"]))
    return add(matmul(dec["W_out"], h), dec["b_out"])
```

### الخطوة الثالثة: الـ ELBO

```python
def elbo(x, x_hat, mu, log_sigma2, beta=1.0):
    recon = sum((a - b) ** 2 for a, b in zip(x, x_hat))
    kl = 0.5 * sum(math.exp(lv) + m * m - lv - 1 for m, lv in zip(mu, log_sigma2))
    return recon + beta * kl, recon, kl
```

精确的封闭形式 KL,因为两个分布都是高西亚的──不要数值积分──2026年仍然有人交付带蒙特卡洛 KL估算的代码  无理由地慢3x──

### الخطوة الرابعة: توليد

```python
def sample(dec, z_dim, rng):
    z = [rng.gauss(0, 1) for _ in range(z_dim)]
    return decode(z, dec)
```

هذا هو النموذج التوليد.

## الفخاخ

- **Posterior collapse.**المفهوم ك.ل.`q(z|x) → N(0, I)`، يؤدي`z`لا تحمل حول`x`من البداية، ارتفع تدريجيا إلى 1) بيتات مجانية، أو قفزت فوق KL في الأبعاد غير النشطة
- **Blurry samples.**احتمالات المفكّر الغاوسي يعني إعادة بناء MSE، فإنه بالنسبة إلى L2 هو Bayes-أفضل (معنى)  مجموعة من الأرقام المنطقة من المعنى هو عدد غامض.
- **β too large, too early.**见 خلفية الانهيار.
- **Latent dim too small.**16-D  تطبيق على MNIST,256-D  تطبيق على ImageNet 2562,2048-D  تطبيق على ImageNet 10242── VAE من انتشار مستقرة سوف 512×512×3  ضغط إلى 64×64×4── مساحة فضائية أعلى 32x معدل النموذج، القنوات أعلى 32x)──

## استخدمها

2026 مجموعة VAE:

| Situation | Pick |
|-----------|------|
| Image-latent encoder for diffusion | Stable Diffusion VAE (`sd-vae-ft-ema`) or Flux VAE |
| Audio-latent encoder | Encodec (Meta), SoundStream, or DAC (Descript) |
| Video latents | Sora's spatiotemporal patches, Latte VAE, WAN VAE |
| Disentangled representation learning | β-VAE, FactorVAE, TCVAE |
| Discrete latents (for transformer modelling) | VQ-VAE, RVQ (ResidualVQ) |
| Continuous latents for generation | Plain VAE, then condition a flow/diffusion model in that latent space |

نموذج الانتشار المتخفي هو نموذج الانتشار المتخفي ، وسطها في نموذج الانتشار ، يقع بين مرموز وموظف .

## أرسله

保存 `outputs/skill-vae-trainer.md`.

مهارات 接收:ملف مجموعة البيانات + هدف الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن الامتناع عن عن عن`q(z|x)`和 `N(0, I)`间Fréchet المسافة)。

## التمارين

1. **Easy.**- لا .`code/main.py`وسط`β`改为 `0.01`.`0.1`.`1.0`.`5.0` التسجيل الإعادة التأهيل النهائي MSE 和 KL‬ بالنسبة لبياناتك الاصطناعية، أي β هو أفضل؟
2. **Medium.**استخدام احتمال برنولي ((خسارة الانتروبيا المتقاطعة) استبدال احتمالات المفكّر غوسسي。 في الإصدار الثنائي من نفس البيانات الاصطناعية 上比较样本质量。
3. **Hard.**ستعمل`code/main.py`扩展成一个小型 VQ-VAE:用 K=32 إدخالات  中的近邻搜索 替换连续 `z` مقارنة إعادة الإعمار MSE,并 report عدد إدخالات كتاب الكود المستخدمة

## الشروط الرئيسية

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Autoencoder | Encode-decode network | `x → z → x̂`，学习 MSE。不是 generative。 |
| VAE | 带 sampler 的 AE | Encoder 输出一个 distribution，KL penalty 塑造 code space。 |
| ELBO | Evidence lower bound | `log p(x) ≥ recon - KL[q(z\|x) \|\| p(z)]`；当 `q = p(z\|x)` 时 tight。 |
| Reparameterization | `z = μ + σ·ε` | 将 stochastic node 重写为 deterministic + pure noise。使 sampling 可参与 backprop。 |
| Prior | `p(z)` | latent 的目标 distribution，通常是 `N(0, I)`。 |
| Posterior collapse | “KL term wins” | Encoder 忽略 `x`，输出 prior；decoder 必须 hallucinate。 |
| β-VAE | 可调 KL weight | `loss = recon + β·KL`。更高 β = 更 disentangled 但更模糊。 |
| VQ-VAE | Discrete latent | 用 nearest codebook vector 替换 continuous `z`；支持 transformer modelling。 |

## 生产提示:VAE هو خادم التوزيع 中最热的路径

في خط الأنابيب المتواصلة للتنشر / التدفق / SD3 ، سيتم استخدام كل طلب في VAE مرتين  مرة واحدة لتنسيق النسخة (إذا تم القيام بإصدار الصور / التلوين) ، مرة واحدة لتنسيق النسخة. في 10242 时 ، تمرير المُعزل 往往是整条 خط الأنابيب 中单个最大的激活- ذاكرة ذروة ، لأنه يضع`128×128×16`الاختفاء العرض 回 `1024×1024×3`: اثنين من النتائج العملية:

- **对 decode 做 slicing 或 tiling。** `diffusers` التعرض `pipe.vae.enable_slicing()`和 `pipe.vae.enable_tiling()`❖ التيلغ 用少量 خياطة القطع الأثرية 换取 `O(tile²)`الذاكرة، بدلا من ذلك `O(H·W)`◊ على المستهلكات GPUs 上的 10242+ 至关重要‬
- **bf16 decoder，最终 resize 使用 fp32 numerics。**SD 1.x VAE 以 fp32 发布, و في 10242+ تم إلقاء إلى fp16 时会 * صامتة توليد NaNs *。SDXL 提供 `madebyollin/sdxl-vae-fp16-fix` 总是优先使用fp16-fix variant,或使用bf16──

## المزيد من القراءة

- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114)ورقة في اي اي
- [Higgins et al. (2017). β-VAE: Learning Basic Visual Concepts with a Constrained Variational Framework](https://openreview.net/forum?id=Sy2fzU9gl) التفريق بين β-VAE。
- [van den Oord et al. (2017). Neural Discrete Representation Learning](https://arxiv.org/abs/1711.00937) VQ-VAE。
- [Vahdat & Kautz (2021). NVAE: A Deep Hierarchical Variational Autoencoder](https://arxiv.org/abs/2007.03898) صورة حديثة VAE。
- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) انتشار مستقيم؛ VAE كمُخترج
- [Défossez et al. (2022). High Fidelity Neural Audio Compression](https://arxiv.org/abs/2210.13438) إينكودك، معيار الصوت في إيه اي
