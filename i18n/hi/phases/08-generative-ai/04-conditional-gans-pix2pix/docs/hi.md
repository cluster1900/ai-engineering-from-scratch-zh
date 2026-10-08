# सशर्त जीएएन के साथ पिक्स2पिक्स

> 2014-2017 के पहले प्रमुख सफलता, जीएएन को नियंत्रित करना है। एक लेबल, एक छवि, या एक वाक्य जोड़ा गया है।

**Type:** 构建
**Languages:** Python
**Prerequisites:** Phase 8 · 03 (GANs), Phase 4 · 06 (U-Net), Phase 3 · 07 (CNNs)
**Time:** ~75 分钟

## 问题
无条件 GAN 会采样任意人脸──做演示 有用,进生产 没用──你想要的是:*把草图 映射成照片*、*把地图 映射成空图*、*把白天场景 映射成夜间*、*给灰色尺度图像 上色*── इन सभी कार्यों में, आपको एक इनपुट छवि मिलेगी`x`, और कुछ प्रकार की अर्थपूर्ण मेलजोल के साथ बाहर निकालना होगा `y` प्रत्येक `x`                                                                                                                                                                                                                                                              `y` औसत वर्ग त्रुटि उन्हें एक स्पष्ट परिणाम में दबाएगी प्रतिकूल हानि नहीं होगी, क्योंकि  लग रहा है वास्तविक है 

संदिग्ध GAN (Mirza & Osindero, 2014)`c`作为输入加入 `G`和 `D`◊Pix2Pix (Isola et al., 2017) इसके लिए विशेषीकरण किया गया हैःcondition is complete input image,generator is U-Net,discriminator is *patch-based* classifier (PatchGAN),Loss is adversarial + L1── यहां तक कि 2026 में भी, यह सेट छवि-से-छवि डोमेन के संकीर्ण क्षेत्र में बना हुआ है ऊपर अभी भी शून्य से प्रशिक्षित पाठ-से-छवि मॉडल से जीत हासिल कर रहा है, क्योंकि यह *paired data* पर प्रशिक्षित है ऊपर  आपके पास जो सही है वह आवश्यक संकेत है──

## 概念
![Pix2Pix: U-Net generator, PatchGAN discriminator](../assets/pix2pix.svg)

**Conditional G.** `G(x, z) → y` Pix2Pix में,`z` G 内部的 droppup (ग)  कोई इनपुट शोर नहीं  Isola 发现显式 शोर 会被忽略) 

**Conditional D.** `D(x, y) → [0, 1]`输入是 *pair*(condition, output) `y``x`एक致, और सिर्फ निर्णय नहीं `y`लग रहा है कि क्या यह सच है.

**U-Net generator.**带有跨瓶跳连接的编码-decoder──输入和输出共享低级结构的任务至关重要──没有这些跳转,高频细节会消失──

**PatchGAN discriminator.**D न आउटपुट एकल वास्तविक/नकली स्कोर, बल्कि आउटपुट एक `N×N`ग्रिड, जिनमें से प्रत्येक सेल  70 × 70 पिक्सल के बारे में 判断 रिसेप्टिव फ़ील्ड──然后取平均── यह एक मार्कोव यादृच्छिक फ़ील्ड 假设:真实感是局部的──训练快得多,参数更少,输出更利──

**Loss.**

```
loss_G = -log D(x, G(x)) + λ · ||y - G(x)||_1
loss_D = -log D(x, y) - log (1 - D(x, G(x)))
```

L1 项稳定训练,并推动 G 接近已知目标──L1  L2 产生更利的边缘 (उपयोगकर्ता नहीं, बल्कि साधन) ──`λ = 100`                                                                                                                                                                                                                                                              

## CycleGAN  जब आपके पास जोड़े नहीं हों

Pix2Pix 需要 जोड़ी `(x, y)`डेटा──साइकिलजीएएन (ज़ू एट अल., 2017) 通过额外的损失 放弃这个要求:*साइकिल की स्थिरता* हानि── दो जनरेटरः`G: X → Y`和 `F: Y → X` उन्हें प्रशिक्षित करें, ताकि `F(G(x)) ≈ x`且 `G(F(y)) ≈ y` यह आपको जोड़े के उदाहरणों के बिना, घोड़ों को जब्रे में बदल देता है  गर्मियों को सर्दियों में बदल देता है 

2026 में, अनपेयर छवि-टू-इमेज (ControlNet、IP-Adapter) को पूरा किया गया, साइकिलगेन के बजाय, लेकिन चक्र-समरूपता का विचार अभी भी लगभग हर एक अनपेयर डोमेन अनुकूलन में मौजूद है।


```figure
gx-patchgan
```

##  इसे निर्माण
`code/main.py`1-डी डेटा में एक सूक्ष्म सशर्त GAN को लागू किया गया है।`c` वर्ग लेबल0 या 1)──任务:为给定类 生成一个来自条件分布的样本

### 步骤 1: स्थिति जोड़ना G और D के इनपुट

```python
def G(z, c, params):
    return mlp(concat([z, one_hot(c)]), params)

def D(x, c, params):
    return mlp(concat([x, one_hot(c)]), params)
```

एक-गर्म एन्कोडिंग सबसे सरल तरीका है। बड़े मॉडल सीखना एम्बेडिंग का उपयोग करेंगे।

### 步骤 2: ट्रेन सशर्त

```python
for step in range(steps):
    x, c = sample_real_conditional()
    noise = sample_noise()
    update_D(x_real=x, x_fake=G(noise, c), c=c)
    update_G(noise, c)
```

जनरेटर  को *मुक्तिबद्ध स्थिति  के वास्तविक वितरण से मेल लेना चाहिए, सिमान्त नहीं 

### 步骤 3: प्रत्येक वर्ग के आउटपुट का सत्यापन

```python
for c in [0, 1]:
    samples = [G(noise, c) for noise in batch]
    mean_c = mean(samples)
    assert_near(mean_c, real_mean_for_class_c)
```

## 陷
- **Condition 被忽略。**G 学会 हाशिए पर रहना,D 从不惩罚,因为 स्थिति संकेत 太弱──修复:更强地 स्थिति D(शुरुआती परत,而不只是迟), प्रोजेक्शन भेदभाव का उपयोग करना (Miyato & Koyama 2018)。
- **L1 weight 过低。**G 漂移到任意看起来真实输出,而不是忠实的输出──Pix2Pix-style 任务从 λ≈100 开始──
- **L1 weight 过高。**G                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
- **D 中 ground-truth leakage。**`(x, y)`concat 作为 D इनपुट,而不只是 `y`否则 D 无法检查一致性──
- **每个 class 的 mode collapse。**प्रत्येक वर्ग को स्वतंत्र रूप से ढहने की संभावना है।

## इसका उपयोग करें
2026 साल छवि-से-छवि 任务 स्थिति:

| Task | Best approach |
|------|---------------|
| Sketch → photo, same domain, paired data | Pix2Pix / Pix2PixHD（仍然快，仍然锐利） |
| Sketch → photo, unpaired | 带 Scribble conditioning model 的 ControlNet |
| Semantic seg → photo | SPADE / GauGAN2 或 SD + ControlNet-Seg |
| Style transfer | 带 IP-Adapter 或 LoRA 的 Diffusion；GAN methods 属于 legacy |
| Depth → photo | Stable Diffusion 上的 ControlNet-Depth |
| Super-resolution | Real-ESRGAN (GAN), ESRGAN-Plus, 或 SD-Upscale (diffusion) |
| Colorization | ColTran、diffusion-based colorizers，或 Pix2Pix-color |
| Daytime → nighttime, seasons, weather | CycleGAN 或 ControlNet-based |

जब (क) आपके पास हजारों जोड़े हुए उदाहरण हैं, (ख) 任务 संकीर्ण और दोहराया जा सकता है, और (ग)  त्वरित निष्कर्ष की आवश्यकता है, पिक्स्२पिक्स् 仍然是正确工具──在通用开放域 任务上,diffusion 胜出──

## 交付 यह
保存 `outputs/skill-img2img-chooser.md`◊ कौशल 接收 कार्य विवरण、 डेटा उपलब्धता(जोड़ी बनाम अनजोड़ी、एन नमूने) और विलंबता/गुणवत्ता बजट, फिर输出:approach(Pix2Pix、CycleGAN、ControlNet variant、SDXL + IP-Adapter) 、शिक्षा डेटा आवश्यकताएँ、इन्फरेंस लागत और मूल्यांकन प्रोटोकॉल(LPIPS、FID、कार्य-विशिष्ट) ⋅

## अभ्यास
1. **Easy.**修改 `code/main.py`, तीसरी कक्षा में शामिल हों. . . पुष्टि करें कि G   हर वर्ग की शोर को सही मोड में मैपिंग करता है.
2. **Medium.**1-डी सेटिंग में मध्यउपयोग करने के लिए धारणा शैली हानि  बदलना L1(उदाहरण के लिए एक छोटे से जमे हुए D फ़ंक्शन एक्सट्रैक्टर के रूप में)  यह सशर्त वितरण की तीक्ष्णता  बदल जाएगा?
3. **Hard.**1-डी सेटिंग में 中草拟一个CycleGAN: दो वितरण, दो जनरेटर, चक्र हानि, दिखावे यह जोड़ी डेटा के बिना स्थिति में कर सकते हैं, दोनों के बीच में नक्शा

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Conditional GAN | “带 labels 的 GAN” | G(z, c), D(x, c)。两个 networks 都看到 condition。 |
| Pix2Pix | “Image-to-image GAN” | 带 U-Net G 和 PatchGAN D + L1 loss 的 paired cGAN。 |
| U-Net | “带 skips 的 encoder-decoder” | 对称 conv network；skips 保留 high-freq。 |
| PatchGAN | “Local-realism classifier” | D 输出 per-patch score，而不是 global score。 |
| CycleGAN | “Unpaired image translation” | 两个 G + cycle-consistency loss；没有 paired data。 |
| SPADE | “GauGAN” | 用 semantic map normalize intermediate activations；segmentation-to-image。 |
| FiLM | “Feature-wise linear modulation” | 来自 condition 的 per-feature affine transform；便宜的 conditioning。 |

## 生产说明: Pix2Pix 作为受延迟约束的基线

जब आपके पास जोड़ी डेटा है 和 संकीर्ण कार्य(स्केच → रेंडर、सैमंतिक नक्शा → फोटो、दिन ँ → रात) समय,Pix2Pix का एक शॉट निष्कर्ष 在 विलंबता 上比 विसारण 快一个数量级──उत्पादन तुलना आमतौर पर हैः

| Path | Steps | Typical latency at 512² on a single L4 |
|------|-------|----------------------------------------|
| Pix2Pix (U-Net forward) | 1 | ~30 ms |
| SD-Inpaint or SD-Img2Img | 20 | ~1.2 s |
| SDXL-Turbo Img2Img | 1-4 | ~0.15-0.35 s |
| ControlNet + SDXL base | 20-30 | ~3-5 s |

Pix2Pix में स्थैतिक बैचों के आउटपुट 上胜出(प्रत्येक अनुरोध 都是相同的FLOPs)。विभाजन 在质量 和一般化上胜出。आधुनिक प्रथा आमतौर पर Pix2Pix शैली में डिस्टिल्ड मॉडल के लिए संकीर्ण कार्य वितरण के लिए होती है,并为尾输入 提供扩散倒退──

## 延伸阅读
- [Mirza & Osindero (2014). Conditional Generative Adversarial Nets](https://arxiv.org/abs/1411.1784) cGAN 论文──
- [Isola et al. (2017). Image-to-Image Translation with Conditional Adversarial Networks](https://arxiv.org/abs/1611.07004) पिक्स्२पिक्स्──
- [Zhu et al. (2017). Unpaired Image-to-Image Translation using Cycle-Consistent Adversarial Networks](https://arxiv.org/abs/1703.10593) साइकिलगाँण。
- [Wang et al. (2018). High-Resolution Image Synthesis with Conditional GANs](https://arxiv.org/abs/1711.11585) पिक्स्२पिक्स्एचडी
- [Park et al. (2019). Semantic Image Synthesis with Spatially-Adaptive Normalization](https://arxiv.org/abs/1903.07291) SPADE / गॉगन。
- [Miyato & Koyama (2018). cGANs with Projection Discriminator](https://arxiv.org/abs/1802.05637) प्रक्षेपण D。
