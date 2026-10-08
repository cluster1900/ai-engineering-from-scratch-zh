# विसारण मॉडल  स्क्रैच से डीडीपीएम

> हो, जेन, एबेल (2020) ने इस क्षेत्र में एक अपूरणीय संयोजन दिया है। शोर के साथ डेटा को नष्ट करने के लिए एक हजार छोटे कदम उठाए गए हैं। एक तंत्रिका नेटवर्क को प्रशिक्षित किया गया है।

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 8 · 02 (VAE)
**Time:** ~75 分钟

## समस्या

आप एक के लिए उपयोग करना चाहते हैं `p_data(x)`️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️`log p(x)`(c) सोटा गुणवत्ता के नमूने मिलते हैं,

सोहल-डिक्सटाइन और अन्य (2015) ने एक सिद्धांतात्मक उत्तर दियाः एक को परिभाषित करें जो धीरे-धीरे गाउसियन शोर की मार्कोव श्रृंखला में शामिल हो जाता है ।`q(x_t | x_{t-1})`,并 प्रशिक्षण एक रिवर्स श्रृंखला `p_θ(x_{t-1} | x_t)`                                                                                                                                                                                                                                                              

## अवधारणा

![DDPM: forward noise, reverse denoise](../assets/ddpm.svg)

**Forward process `q`.**`T`个小步骤中加入高斯音──闭式  数学可处理的原因  是累积步骤 仍然是高斯音:

```
q(x_t | x_0) = N( sqrt(α̅_t) · x_0,  (1 - α̅_t) · I )
```

उनमें से `α̅_t = ∏_{s=1..t} (1 - β_s)`, एक के लिए `β_t`समय सारिणी`β_t`में T=1000 चरणों में 1e-4 से 0.02 线性变化,`x_T` 会近似为`N(0, I)`

**Reverse process `p_θ`.**सीखने के लिए एक तंत्रिका नेटवर्क `ε_θ(x_t, t)`,预测被加入的噪音──给定 `x_t`,按下式 संज्ञाः

```
x_{t-1} = (1 / sqrt(α_t)) · ( x_t - (β_t / sqrt(1 - α̅_t)) · ε_θ(x_t, t) )  +  σ_t · z
```

उनमें से `σ_t`या तो `sqrt(β_t)`यह अभिव्यक्ति बहुत बुरा है, लेकिन यह सिर्फ एक संख्या है`q(x_{t-1} | x_t, x_0)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `x_{t-1}`,并用 शोर-पूर्वानुमान अनुमान 替换 `x_0`

**Training loss.**

```
L_simple = E_{x_0, t, ε} [ || ε - ε_θ( sqrt(α̅_t) · x_0 + sqrt(1 - α̅_t) · ε,  t ) ||² ]
```

डेटा से नमूना `x_0`, किसी को चुनें`t`, नमूना `ε ~ N(0, I)`, बंद रूप के माध्यम से एक बार में शोर का गणना `x_t`,并对噪音做回归──一个损失,没有最小x,没有KL,没有重构技巧──

**Sampling.**से `x_T ~ N(0, I)`开始──从 `t = T`तक `1`代 उल्टा कदम──完成──

## यह काम क्यों करता है

तीन सीधाः

1. **Denoising is easy; generating is hard.**`t=T`, डेटा शुद्ध शोर है  नेट  हल करना एक मामूली समस्या है `t=0`,नेट केवल कुछ पिक्सेल को साफ करने की जरूरत है बीच में`t`, समस्या कठिन है, लेकिन नेट प्रत्येक शोर स्तर के समान समूह के वजन के बीच कई ग्रेडिएंट प्राप्त करेगा।

2. **Score matching in disguise.**विंसेंट ((2011) प्रमाण, पूर्वानुमान शोर等价格估计 `∇_x log q(x_t | x_0)`,也就是 *स्कोर*── रिवर्स एसडीई इस स्कोर का उपयोग करें ढ़ंगता ग्रेडिएंट ऊपर行  एक बार निर्देशित यादृच्छिक चलने, उच्च संभावना क्षेत्रों की ओर बढ़े──

3. **The ELBO reduces to simple MSE.**पूर्ण भिन्नता निचली सीमा प्रत्येक समय चरण में एक KL शब्द है ∙ डीडीपीएम के पैरामीटर का उपयोग करके, ये KL शब्द MSE के विशिष्ट गुणांक के साथ शोर भविष्यवाणी के लिए सरल होगा ∙


```figure
diffusion-denoise
```

## इसे बनाओ

`code/main.py` एक 1-डी डीपीएम को प्राप्त करना  डेटा दो मोड मिश्रण नेट  एक माइक्रोटाइप एमएलपी है, प्राप्त `(x_t, t)`并输出预测噪音──训练是一行损失──样本 代逆链──

### चरण 1: आगे की योजना (बंद फॉर्म)

```python
betas = [1e-4 + (0.02 - 1e-4) * t / (T - 1) for t in range(T)]
alphas = [1 - b for b in betas]
alpha_bars = []
cum = 1.0
for a in alphas:
    cum *= a
    alpha_bars.append(cum)
```

### चरण 2: नमूना `x_t`एक शॉट में

```python
def forward_sample(x0, t, alpha_bars, rng):
    a_bar = alpha_bars[t]
    eps = rng.gauss(0, 1)
    x_t = math.sqrt(a_bar) * x0 + math.sqrt(1 - a_bar) * eps
    return x_t, eps
```

### चरण 3: एक प्रशिक्षण चरण

```python
def train_step(x0, model, alpha_bars, rng):
    t = rng.randrange(T)
    x_t, eps = forward_sample(x0, t, alpha_bars, rng)
    eps_hat = model_forward(model, x_t, t)
    loss = (eps - eps_hat) ** 2
    return loss, gradient_step(model, ...)
```

### चरण 4: उल्टा नमूनाकरण

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

 40 समय चरणों और 24 इकाई MLP की 1-डी समस्या के लिए, यह लगभग 200 युगों पर निर्भर करता है 

## समय की स्थिति

यह जानना आवश्यक है कि यह किस समय की गति को रेखांकित कर रहा है।

- **Sinusoidal embedding.**类似 ट्रांसफार्मर स्थिति एन्कोडिंग──`embed(t) = [sin(t/ω_0), cos(t/ω_0), sin(t/ω_1), ...]` MLP में प्रसारण, नेट पर प्रसारण
- **Film / group-norm conditioning.**प्रत्येक ब्लॉक में इंबेंडिंग प्रोजेक्ट के लिए प्रति चैनल पैमाने/bias (FiLM)

हमारे खेल का कोड प्रयोग सिनोसाइडल → कॉन्टैक्ट――उत्पादन यू-नेट्स प्रयोग फिल्म――

## फंदे

- **Schedule matters a lot.**रैखिक `β`यह डीडीपीएम डिफ़ॉल्ट है, लेकिन कॉसिन शेड्यूल ((नीचॉल एंड धारिवाल, 2021)) उसी गणना में नीचे बेहतर एफआईडी दिया गया है।
- **Timestep embedding is fragile.**इसे कच्चा डालें`t`作为浮游 传入对玩具 1-D 可行,但对图像会失败;始终使用适当嵌入──
- **V-prediction vs ε-prediction.**संकीर्ण शासन के लिए (बहुत छोटा या बहुत बड़ा)`ε`很差──V- पूर्वानुमान`v = α·ε - σ·x`) अधिक स्थिर;SDXL、SD3 和 फ्लक्स सभी इसका उपयोग करते हैं
- **Classifier-free guidance.**इन्फरेंस 时,同时计算 सशर्त 和 अशर्त `ε`, फिर `ε_cfg = (1 + w) · ε_cond - w · ε_uncond`, उनमें से `w ≈ 3-7`08 का पाठ होगा
- **1000 steps is a lot.**उत्पादन प्रयोग डीडीआईएम ((20-50 कदम) 、डीपीएम-सोल्वर ((10-20 कदम) या डिस्टिलिशन ((1-4 कदम) 👇见12 पाठ。

## इसका प्रयोग करें

| Role | Typical stack in 2026 |
|------|-----------------------|
| Image pixel-space diffusion (small, toy) | DDPM + U-Net |
| Image latent diffusion | VAE encoder + U-Net or DiT (Lesson 07) |
| Video latent diffusion | Spatiotemporal DiT (Sora, Veo, WAN) |
| Audio latent diffusion | Encodec + diffusion transformer |
| Science (molecules, proteins, physics) | Equivariant diffusion (EDM, RFdiffusion, AlphaFold3) |

प्रसार आम जनरेटिव रीढ़ है। प्रवाह मिलान (Lection 13) 2024-2026 के प्रतियोगी हैं, समान गुणवत्ता में नीचे आम तौर पर निष्कर्ष की गति में जीतते हैं।

## इसे भेजें

保存 `outputs/skill-diffusion-trainer.md`◊ कौशल 接收数据集 + गणना बजट,并输出:अनुसूची(रेखीय/कोसिन/सिग्मोइड)  भविष्यवाणी लक्ष्य(ε/v/x)  चरणों की संख्या、निर्देशन पैमाने、 नमूना परिवार 和 मूल्यांकन प्रोटोकॉल──

## व्यायाम

1. **Easy.**`code/main.py`中把 T 40 改为 10 ⋅ नमूना गुणवत्ता (उत्पादों का दृश्य हिस्टोग्राम) कैसे गिरावट?
2. **Medium.**से ε- भविष्यवाणी 切换到v- भविष्यवाणी── पुनः推导 उलट चरण──比较最终样品质──
3. **Hard.**添加 वर्गीकरणकर्ता मुक्त मार्गदर्शन──以 वर्ग लेबल `c ∈ {0, 1}`इसके लिए, प्रशिक्षण के दौरान 10% समय गिरता है, और नमूना लेने के दौरान उपयोग किया जाता है।`ε = (1+w)·ε_cond - w·ε_uncond`️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️`w = 0, 1, 3, 7`时的条件模式-hit rate──

## प्रमुख शर्तें

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

## उत्पादन नोटः विसारण अनुमान एक चरण गणना समस्या है

डीडीपीएम पेपर 运行 T=1000 रिवर्स स्टेप्स。 कोई इसे उत्पादन 交付 हेतु नहीं लगाता。 प्रत्येक वास्तविक निष्कर्ष स्टैक                                                                                                                                                                                                                                               

1. **Faster sampler, same model.**DDIM(20-50 कदम)、DPM-Solver++(10-20)、UniPC(8-16)。 रिवर्स लूप के ड्रॉप-इन प्रतिस्थापन;已训练的 `ε_θ`वजन 不变──将延迟 降低 20-50×──
2. **Distillation.**訓練 छात्र 以更少步骤 匹配 शिक्षक:प्रगतिशील डिस्टिलाशन(2 → 1)、अनुपालन मॉडल(स्वतंत्र → 1-4)、LCM、SDXL-Turbo、SD3-Turbo── आगे 5-10× विलंबता को कम करना, पुनर्व्यवस्थापना की आवश्यकता है──
3. **Caching and compilation.** `torch.compile(unet, mode="reduce-overhead")`、TensorRT-LLM के प्रसार बैकेंड्स`xformers`/SDPA ध्यान、bf16 वजन── प्रति चरण विलंबता  घटाएगी लगभग 2×──可与 (1) 和 (2) 叠加──

 उत्पादन प्रसारण सर्वर, बजट वार्ता तथा उत्पादन साहित्य के लिए LLM का वर्णन समान हैः देरी`num_steps × step_cost + VAE_decode`,प्रभाव है`batch_size × (num_steps × step_cost)^-1`△TTFT 很小(एक कदम);TPOT-बराबर है पूर्ण प्रतिक्रिया समय, चूंकि उपयोगकर्ता के दृष्टिकोण से, छवि उत्पादन है एक बार में──

## आगे पढ़ना

- [Sohl-Dickstein et al. (2015). Deep Unsupervised Learning using Nonequilibrium Thermodynamics](https://arxiv.org/abs/1503.03585) विसारक कागज,超前于时代。
- [Ho, Jain, Abbeel (2020). Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) डीडीपीएम。
- [Song, Meng, Ermon (2021). Denoising Diffusion Implicit Models](https://arxiv.org/abs/2010.02502) डीडीआईएम, 更少步骤──
- [Nichol & Dhariwal (2021). Improved DDPM](https://arxiv.org/abs/2102.09672) कॉसिन अनुसूची, सीखे हुए भिन्नता
- [Dhariwal & Nichol (2021). Diffusion Models Beat GANs on Image Synthesis](https://arxiv.org/abs/2105.05233) वर्गीकरण निर्देशों
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598) CFG。
- [Karras et al. (2022). Elucidating the Design Space of Diffusion-Based Generative Models (EDM)](https://arxiv.org/abs/2206.00364) एकजुट संकेतन, सबसे स्पष्ट 
