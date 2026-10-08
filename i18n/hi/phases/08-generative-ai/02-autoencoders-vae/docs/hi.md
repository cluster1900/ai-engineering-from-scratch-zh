# ऑटोकोडर और वैरिएशनल ऑटोकोडर (VAE)

> सामान्य ऑटोकोडर पहले संपीड़ित पुनःसंरचना करें। यह याद करेगा। यह उत्पन्न नहीं करेगा। एक तकनीक जोड़ें।`z = μ + σ·ε`2026 में उपयोग किए जाने वाले प्रत्येक लटेंट-विभाजन तथा प्रवाह-अनुरूप छवि मॉडल के लिए एक VAE है।

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 07 (CNNs), Phase 8 · 01 (Taxonomy)
**Time:** ~75 分钟

## समस्या

एक 784 पिक्सेल के MNIST अंक को 16 अंकों के कोड में संकुचित करें, फिर इसे पुनः बनाएं। साधारण ऑटोएन्कोडर MSE पर पुनर्निर्माण में अच्छा प्रदर्शन करता है, लेकिन कोड स्पेस एक गुच्छा है।

आप वास्तव में क्या चाहते हैंः (अ) कोड अंतरिक्ष एक स्वच्छ,平滑, नमूना के बीच से वितरण है, उदाहरण के लिए आइसोट्रोपिक गौशियन`N(0, I)`,((ब) किसी भी नमूना को डिकोड करना एक उचित अंक उत्पन्न कर सकता है,(c) एन्कोडर और डिकोडर अभी भी बहुत अच्छी तरह से संपीड़ित हो सकता है── तीन लक्ष्य, एक वास्तुकला, एक हानि──

किंगमा का 2013 VAE 通过让编码 输出一个 *分布* `q(z|x) = N(μ(x), σ(x)²)`इस समस्या को हल करने के लिए, KL दंड के साथ इस वितरण को आगे खींचें`N(0, I)`, फिर पहले से decode में`q(z|x)`नमूना `z`                                                                                                                                                                                                                                                              `z ~ N(0, I)`,डेकोड.कल दंड. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

2026 में, VAE 很少单独交付                                                                                                                                                                                                                                                         

## अवधारणा

![Autoencoder vs VAE: the reparameterization trick](../assets/vae.svg)

**Autoencoder.** `z = encoder(x)`,`x̂ = decoder(z)`, हानि = `||x - x̂||²`कोड स्थान 无结构──

**VAE encoder.**输出 दो वेक्टरः`μ(x)`和 `log σ²(x)` वे परिभाषित `q(z|x) = N(μ, diag(σ²))`

**Reparameterization trick.**से `q(z|x)`नमूना अपरिहार्य          `z = μ + σ·ε`, उनमें से `ε ~ N(0, I)`  `z``(μ, σ)`अतिरिक्त गैर-पेरेंटल शोर के निर्धारक फ़ंक्शन  ग्रेडिएंट्स प्रवाह `μ`和 `σ`

**Loss.**साक्ष्य निचला बंधन (ELBO), दो अंकः

```
loss = reconstruction + β · KL[q(z|x) || N(0, I)]
     = ||x - x̂||²  + β · Σ_i ( σ_i² + μ_i² - log σ_i² - 1 ) / 2
```

पुनर्निर्माण`x̂`推向 `x`✿KL ✿`q(z|x)`推向前──它们相互权衡──小 β (<1) = 更利的样本, कोड स्पेस 不那么高斯的──大 β (>1) = 更干净的代码空间,更模糊的样本──β-VAE(Higgins 2017) इस चक्र को प्रसिद्ध बनाने के लिए,并开启了分解研究──

**Sampling.**इन्फरेंस 时:抽取 `z ~ N(0, I)`,एक बार आगे की तरह फैलाव, फिर दोहराव नमूनाकरण की आवश्यकता है।


```figure
vae-latent-grid
```

## इसे बनाओ

`code/main.py`实现一个不使用 numpy或火的微型VAE──输入是从 8-D 中的2 घटक गौशियन मिश्रण 抽取的8 आयामी सिंथेटिक डेटा──编码和解码都是单个隐藏层MLP──我们实现 tanh सक्रियण、前进通过、损失,以及手写后进通过──不是生产是教学──

### चरण 1: आगे एन्कोडर

```python
def encode(x, enc):
    h = tanh(add(matmul(enc["W1"], x), enc["b1"]))
    mu = add(matmul(enc["W_mu"], h), enc["b_mu"])
    log_sigma2 = add(matmul(enc["W_sig"], h), enc["b_sig"])
    return mu, log_sigma2
```

उपयोग `log σ²`नहीं `σ`, इस प्रकार नेटवर्क आउटपुट अनियंत्रित है ((से σ करने के लिए सॉफ्ट प्लस है फंस  में σ ≈ 0 时 ग्रेडिएंट्स会消失) 

### चरण 2: पुनः परिमाण और डिकोड

```python
def reparameterize(mu, log_sigma2, rng):
    eps = [rng.gauss(0, 1) for _ in mu]
    sigma = [math.exp(0.5 * lv) for lv in log_sigma2]
    return [m + s * e for m, s, e in zip(mu, sigma, eps)]

def decode(z, dec):
    h = tanh(add(matmul(dec["W1"], z), dec["b1"]))
    return add(matmul(dec["W_out"], h), dec["b_out"])
```

### चरण 3: ELBO

```python
def elbo(x, x_hat, mu, log_sigma2, beta=1.0):
    recon = sum((a - b) ** 2 for a, b in zip(x, x_hat))
    kl = 0.5 * sum(math.exp(lv) + m * m - lv - 1 for m, lv in zip(mu, log_sigma2))
    return recon + beta * kl, recon, kl
```

精确的闭式KL,因为两个分布都是高西亚的──不要数值积分──2026年仍有人交付带蒙特卡洛-KL估算的代码  无理由地慢3x──

### चरण 4: उत्पन्न करें

```python
def sample(dec, z_dim, rng):
    z = [rng.gauss(0, 1) for _ in range(z_dim)]
    return decode(z, dec)
```

यही जनरेटिव मॉडल है।

## फंदे

- **Posterior collapse.**केएल शब्द 过于激进地驱动 `q(z|x) → N(0, I)`, कारण`z`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `x`∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙    ∙ ∙     ∙     ∙      ∙                                                         ∙                                                                              
- **Blurry samples.**गौसीयन डिकोडर संभावना का अर्थ है एमएसई पुनर्निर्माण, यह L2 के लिए है बेय-उत्तम (बेय-ओप्टीमल) का अर्थ है एक समूह तर्कसंगत अंकों का अर्थ है एक模糊 अंक है।
- **β too large, too early.**见后后崩──从 β≈0.01 开始并逐步──
- **Latent dim too small.**16-डी  एमएनआईएसटी के लिए उपयुक्त,256-डी  इमेजनेट 2562,2048-डी  इमेजनेट 10242 के लिए उपयुक्त

## इसका प्रयोग करें

2026 VAE स्टैकः

| Situation | Pick |
|-----------|------|
| Image-latent encoder for diffusion | Stable Diffusion VAE (`sd-vae-ft-ema`) or Flux VAE |
| Audio-latent encoder | Encodec (Meta), SoundStream, or DAC (Descript) |
| Video latents | Sora's spatiotemporal patches, Latte VAE, WAN VAE |
| Disentangled representation learning | β-VAE, FactorVAE, TCVAE |
| Discrete latents (for transformer modelling) | VQ-VAE, RVQ (ResidualVQ) |
| Continuous latents for generation | Plain VAE, then condition a flow/diffusion model in that latent space |

लटेंट-प्रसारण मॉडल एक वीएई है, मध्यस्थ में एक प्रसारण मॉडल स्थित है, एन्कोडर और डिकोडर के बीच में 😇VAE बनाना कड़ा संपीड़न, प्रसारण मॉडल 负责重活;; वीडियो(VAE + वीडियो-प्रसारण डीटी) और ऑडियो(Encodec + MusicGen ट्रांसफार्मर) भी उसी मॉडल का पालन करते हैं。

## इसे भेजें

保存 `outputs/skill-vae-trainer.md`

कौशल 接收: डेटासेट प्रोफ़ाइल + लातेंट-डिम लक्ष्य + डाउनस्ट्रीम उपयोग(पुनर्निर्माण、 नमूनाकरण या लातेंट-विसारण इनपुट),并输出:आर्किटेक्चर विकल्प(प्लेन/β/VQ/RVQ)`q(z|x)`和 `N(0, I)`之间 Fréchet दूरी)

## व्यायाम

1. **Easy.**`code/main.py`मध्य `β`改为 `0.01``0.1``1.0``5.0`记录最终重建 MSE 和 KL── आपके सिंथेटिक डेटा के लिए, कौन सा β है Pareto-best?
2. **Medium.**उपयोग करें Bernoulli संभावना ((क्रॉस-एंट्रोपी हानि) का प्रतिस्थापन Gaussian डिकोडर संभावना── में एक ही सिंथेटिक डेटा के द्विआधारी संस्करण ऊपर तुलना नमूना गुणवत्ता──
3. **Hard.**`code/main.py`扩展成一个迷你VQ-VAE:用 K=32 प्रविष्टियाँ का कोडबुक 中的近邻查找 替换连续 `z`◊ तुलनात्मक पुनर्निर्माण एमएसई,并 रिपोर्ट में कोडबुक प्रविष्टियों का उपयोग किया गया है

## प्रमुख शर्तें

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

## 生产提示:VAE है प्रसारण सर्वर मध्य सर्वाधिक गरम मार्ग

Stable Diffusion / Flux / SD3 पाइपलाइन में,VAE प्रत्येक अनुरोध को बुलाया जाता है दो बार  एक बार एन्कोडिंग के लिए उपयोग किया जाता है (((यदि इमेज2 इमेज / पेंटिंग) किया जाता है), एक बार डिकोडिंग के लिए उपयोग किया जाता है।`128×128×16`लटेंट upsample 回 `1024×1024×3` दो वास्तविक परिणाम:

- **对 decode 做 slicing 或 tiling。** `diffusers`暴露 `pipe.vae.enable_slicing()`和 `pipe.vae.enable_tiling()`                                                                                                                                                                                                                                                              `O(tile²)`स्मृति, बजाय `O(H·W)` उपभोक्ता जीपीयू के लिए 10242+ 至关重要
- **bf16 decoder，最终 resize 使用 fp32 numerics。**SD 1.x VAE 以 fp32 发布, और में 10242+ में fp16 时会 तक डाला गया *चुपचाप उत्पन्न NaNs*──SDXL 提供 `madebyollin/sdxl-vae-fp16-fix` 总是优先使用fp16-fix variant, अथवा bf16──

## आगे पढ़ना

- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) वीएई पेपर。
- [Higgins et al. (2017). β-VAE: Learning Basic Visual Concepts with a Constrained Variational Framework](https://openreview.net/forum?id=Sy2fzU9gl) विघटित β-VAE。
- [van den Oord et al. (2017). Neural Discrete Representation Learning](https://arxiv.org/abs/1711.00937) VQ-VAE。
- [Vahdat & Kautz (2021). NVAE: A Deep Hierarchical Variational Autoencoder](https://arxiv.org/abs/2007.03898) अत्याधुनिक छवि VAE。
- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) स्थिर विसारण;एवीई को एन्कोडर के रूप में
- [Défossez et al. (2022). High Fidelity Neural Audio Compression](https://arxiv.org/abs/2210.13438) एन्कोडिक, ऑडियो वीएई मानक
