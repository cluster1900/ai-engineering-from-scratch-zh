# सुधारित प्रवाह से प्रवाह मेल खाता है

> विसारण मॉडल को 20-50 个采样步骤 की आवश्यकता होती है, क्योंकि वे शोर से डेटा तक के 曲路径走走走走── प्रवाह मिलान (Lipman et al., 2023) और सुधारित प्रवाह (Liu et al., 2022) के साथ चलेंगे।

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 06 (DDPM), Phase 1 · Calculus
**Time:** ~45 minutes

## 问题

डीडीपीएम की उलट向 प्रक्रिया एक से है`N(0, I)`डेटा वितरण के 1000 चरणों में वापस जाओ। डीडीआईएम इसे 20-50 个确定性步骤 में संकुचित करेगा। आप कम कदम चाहते हैं, आदर्श रूप से केवल एक कदम।

यदि आप एक मॉडल को प्रशिक्षित कर सकते हैं, तो शोर से डेटा तक का मार्ग एक * सीधी रेखा* है, तो फिर से `t=1`तक `t=0`                                                                                                                                                                                                                                                              `x_1 ∼ N(0, I)`तक `x_0 ∼ data`                                                                                                                                                                                                                                                              `v_θ(x, t)`इसे समय के साथ मिलाकर, और निष्कर्ष निकाला

सुधारित प्रवाह (Reflow) Liu 2022) और आगेः रिफ्लो प्रक्रिया के साथ 代地拉直路径, एक क्रमिक रूप से अधिक निकटता वाले रैखिक ओडीई का उत्पादन करें।

## 核心概念

![Flow matching: straight-line interpolation between noise and data](../assets/flow-matching.svg)

### सीधा प्रवाह

定义:

```
x_t = t · x_1 + (1 - t) · x_0,   t ∈ [0, 1]
```

उनमें से `x_0 ~ data`,`x_1 ~ N(0, I)` इस रेखा के साथ समय निर्देशांक सामान्य संख्या हैः

```
dx_t / dt = x_1 - x_0
```

 परिभाषित एक तंत्रिका वेक्टर क्षेत्र `v_θ(x_t, t)`,并训练它匹配这个导数:

```
L = E_{x_0, x_1, t} || v_θ(x_t, t) - (x_1 - x_0) ||²
```

यही है**conditional flow matching**Loss(Lipman 2023)  प्रशिक्षण नहीं चाहिए सिमुलेशन:`(x_0, x_1, t)`और फिर से नहीं किया।

### 采样

时, along time*反向*积分学到的矢量 फ़ील्ड:

```
x_{t-Δt} = x_t - Δt · v_θ(x_t, t)
```

से `x_1 ~ N(0, I)`开始,用Euler कदम 一路降到 `t=0`

### सुधारित प्रवाह (Liu 2022)

सीधी धारा काम कर सकती है, लेकिन सीखने का मार्ग* वास्तव में सीधी नहीं है*, क्योंकि कई `x_0`एक ही में चित्रित किया जा सकता है `x_1`❖ सुधारित प्रवाह का पुनः प्रवाह चरण:

1. प्रयोग के साथ प्रशिक्षण प्रवाह मॉडल v_1──
2. 通过将 v_1 से `x_1`积分到其落点 `x_0`, के लिए`(x_1, x_0)`
3. इन जोड़ों के नमूने पर अभ्यास v_2── क्योंकि ये जोड़ें वर्तमान में ODE-समान हैं, उनके बीच की सीधी रेखा वास्तव में अधिक समतल है
4. पुनः पुनः

प्रैक्टिस में, 2 बार रिफ्लो 代就能接近线性, इस प्रकार 2-4 चरणों में निष्कर्ष निकालने हेतु SDXL-Turbo、SD3-Turbo、LCM 蒸而来──

### यह 2024 में छवि क्षेत्र में क्यों जीतता है?

तीन कारणः

1. **Simulation-free training**प्रशिक्षण के दौरान ODE 展开,实现极其简单的
2. **更好的 Loss geometry**: प्रत्यक्ष मार्ग में एक समान संकेत-गिरफ्तार है, जबकि डीडीपीएम में समय सीमा पर एसएनआर बहुत कम है।
3. **更快的 inference**: में SDXL-Turbo 质量下 4-8 कदम की आवश्यकता; संयोजन स्थिरता डिस्टिलिशन 1 कदम तक पहुँच सकता है

## प्रवाह मिलान बनाम डीडीपीएम:精确联系

带 गौशियन-सशर्त पथ का प्रवाह मिलान 就是使用* विशिष्ट शोर अनुसूची* का विसारण──选择 `x_t = α(t) x_0 + σ(t) x_1`कार्यक्रम, प्रवाह मेल खाने पर Stratonovich-संशोधित विसारण को पुनर्प्राप्त करने के लिए, उनमें से `v = α'·x_0 - σ'·x_1`️गौसियन पथों के लिए, दोनों में 代数上等价

प्रवाह मिलान  बढ़ाना हैः लक्ष्य का* स्पष्टता*(सामान्य गति) 、更干净 का हानि, तथा प्रयास गैर-गॉसियन इंटरपोलेंट्स की स्वतंत्रता──


```figure
normalizing-flow
```

##  इसे निर्माण

`code/main.py`द्विपंक गॉसियन मिश्रण में 1D प्रवाह मिलान को प्राप्त करना`v_θ(x, t)`️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

### 步骤 1:प्रशिक्षण हानि

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

### 步骤 2: बहु-चरण निष्कर्ष

```python
def sample(net, num_steps):
    x = rng.gauss(0, 1)
    for i in range(num_steps):
        t = 1.0 - i / num_steps
        dt = 1.0 / num_steps
        x -= dt * net_forward(x, t)
    return x
```

### 步骤 3: तुलना करें 步骤 संख्या

预期 4 चरण नमूना 已经能匹配 20 चरण 质量, यह विलंब से आया मायने रखता है महत्वपूर्ण

##                                                                                                                                                                                                                                                               

- **Time parameterization。**प्रवाह मिलान 使用 `t ∈ [0, 1]`, उनमें से `t=0`डेटा है,`t=1`                                                                                                                                                                                                                                                              `t ∈ [0, T]`, उनमें से `t=0`डेटा है,`t=T`यह एक ही दिशा है, आकार अलग है।
- **Schedule choice。**सुधारित प्रवाह की सीधा लाइन  प्रवाह-अनुरूपता अनुसूची है, लेकिन आप भी बेहतर पैमाने पर कवर प्राप्त करने के लिए कॉसिन या लॉजिट-सामान्य t-सैम्पिंग का उपयोग कर सकते हैं।
- **Reflow cost。**रिफ्लो के लिए उत्पन्न करने के लिए एक डेटा सेट प्रत्येक नमूना के बराबर है एक बार पूरा निष्कर्ष चलाएँ।
- **Classifier-free guidance 仍然适用。**केवल ऑनलाइन संरचना में इसे v में बदलने की आवश्यकता हैः`v_cfg = (1+w) v_cond - w v_uncond`

## इसका उपयोग करें

| Use case | 2026 stack |
|----------|-----------|
| Text-to-image，最佳质量 | Flow matching：SD3、Flux.1-dev |
| Text-to-image，1-4 步 | Distilled flow matching：Flux.1-schnell、SD3-Turbo、SDXL-Turbo |
| 实时 inference | 来自 flow-matched base 的 consistency distillation（LCM、PCM） |
| Audio generation | Flow matching：Stable Audio 2.5、AudioCraft 2 |
| Video generation | Flow matching 与 Diffusion 混合（Sora、Veo、Stable Video） |
| Science / physics（particle trajectories、molecules） | Flow matching + equivariant Vector field |

केवल एक लेख 2025-2026 साल के शोध में कहा गया है कि यह विसारण से अधिक तेजी से होता है, यह लगभग हमेशा प्रवाह के मिलान + डिस्टिलशन है।

## 交付 यह

保存 `outputs/skill-fm-tuner.md`◊ इस कौशल 接收一个 Diffusion-style मॉडल स्पेसिफिकेशन,并将其转换为流量匹配培训配置:अनुसूची चयन, समय नमूना वितरण, (uniform/logit-normal) 优化器,reflow plan, लक्ष्य चरण गणना,

## अभ्यास

1. **Easy。**运行 `code/main.py`, 1-चरण की तुलना 20-चरण एमएसई के तुलना में वास्तविक डेटा वितरण के प्रदर्शन
2. **Medium。**वर्दी से`t`नमूनाकरण 切换到logit-normal (लॉजिट-नॉर्मल) 将采样集中在中 t) ◊ नमूना 质量是否提升?
3. **Hard。**实现一次回流 代:通过积分第一个模型 生成对 (x_0, x_1), इन जोड़ों में 上训练第二个模型,并比较1-चरण नमूना गुणवत्ता──

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

## उत्पादन नोटःFlux.1-schnell सबसे तेजी से आकार का प्रवाह मिलान है

प्रवाह मिलान का उत्पादन 胜利案例是Flux.1-schnell: एक प्रवाह-मिलान DiT, 1-4 个推理步骤,同时保持Flux-dev 级别的质量。Niels का Run Flowx पर एक 8GB मशीन नोटबुक पर 是参考部署方案:T5 + CLIP कोड, क्वांटिज़्ड MMDiT denoise(schnell 4 步用,而 dev 用 50 步),VAE डिकोड──核算如下:

| Variant | Steps | Latency at 1024² on L4 | Total FLOPs (relative) |
|---------|-------|------------------------|------------------------|
| Flux.1-dev (raw) | 50 | ~15 s | 1.0× |
| Flux.1-schnell | 4 | ~1.2 s | 0.08× (12× faster) |
| SDXL-base | 30 | ~4 s | 0.25× |
| SDXL-Lightning 2-step | 2 | ~0.3 s | 0.03× |

उत्पादन नियम:**flow-matched base + distillation = 2026 年快速 text-to-image 的默认方案。**प्रत्येक प्रमुख निर्माता इस संयोजन को जारी कर रहे हैंःSD3-Turbo(SD3 + प्रवाह + डिस्टिलिशन) ✓Flux-schnell(Flux-dev + सुधारित-प्रवाह सीधा) ✓CogView-4-Flash── शुद्ध विसारक आधार केवल विरासत चेकपोइंट्स में मौजूद है──

## 延伸阅读
- [Liu, Gong, Liu (2022). Flow Straight and Fast: Learning to Generate and Transfer Data with Rectified Flow](https://arxiv.org/abs/2209.03003) सुधारित प्रवाह
- [Lipman et al. (2023). Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747) प्रवाह मिलान 
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) SD3, बड़े पैमाने पर सुधारित प्रवाह
- [Albergo, Vanden-Eijnden (2023). Stochastic Interpolants](https://arxiv.org/abs/2303.08797) 覆盖 FM + Diffusion के सामान्य ढांचे──
- [Song et al. (2023). Consistency Models](https://arxiv.org/abs/2303.01469) विसारण/प्रवाह का 1-चरण डिस्टिलिशन。
- [Sauer et al. (2023). Adversarial Diffusion Distillation (SDXL-Turbo)](https://arxiv.org/abs/2311.17042) टर्बो वेरिएंट。
- [Black Forest Labs (2024). Flux.1 models](https://blackforestlabs.ai/announcing-black-forest-labs/) उत्पादन के बीच प्रवाह मेल-जोल
