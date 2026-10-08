# जनरेटिव मॉडल  分类法与历史

> प्रत्येक छवि मॉडल, पाठ मॉडल, वीडियो मॉडल और 3 डी मॉडल पांच श्रेणियों में से एक में से एक है।

**类型:**学习
**语言:**पायथन
**先修要求:**चरण 2 (एमएल मूल बातें), चरण 3 (डीप लर्निंग कोर), चरण 7 · 14 (ट्रांसफॉर्मर)
**时间:**~ 45 मिनट

## 问题

जनरेटिव मॉडल एक बात करनाः किसी अज्ञात वितरण से निर्धारित करना`p_data(x)`️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

कठिनाई में है,`p_data` एक 512x512 RGB  छवि लगभग 786k 维 है), नमूना इस अंतरिक्ष के अंदर स्थित है एक बहुत ही पतला बहुवचन ऊपर, जबकि आप केवल 10M  नमूना हो सकता है।  हिंसा खोज घनत्व है कोई उम्मीद नहीं है। प्रत्येक जनरेटिव मॉडल एक कठिन समस्या को दूसरे में थोड़ा थोड़ा कम कठिन समस्या में बदल दिया है।

पिछले 12 वर्षों में पांच परिवारों ने जीवन बचाया है। प्रत्येक परिवार के लिए जो कुछ भी किया गया है, उसे समझना आपको बताएगा कि यह कुछ कार्यों में क्यों सफल रहा और अन्य कार्यों में क्यों गिर गया।

## 概念

![Generative models 的五个家族 — 按它们建模的对象分类](../assets/taxonomy.svg)

**1. Explicit density, tractable。**`log p(x)`写成一个你真的能计算的求和──Autoregressive मॉडल (पिक्सेलसीएनएन, वेवनेट, जीपीटी)`p(x) = ∏ p(x_i | x_<i)`因式分解── सामान्य प्रवाह (RealNVP, Glow)`p(x)`构建一个简单基础 分布的可逆变换――优点:精确概率,干净的训练 损失――缺点:自主退行 推理是顺序的(长序列会慢),流动 需要可逆架构(架构限制很强)。

**2. Explicit density, approximate。**नीचे से परिभाषित`log p(x)`(ELBO)并优化这个界限──VAEs (Kingma 2013) 使用带变化后的编码-解码器──diffusion models (DDPM, Ho 2020) 训练一个指标,它隐式优化加权 ELBO──diffusion 是 2026年图像、视频和3D 的主导脊柱──

**3. Implicit density。** पूर्ण रूप से घनत्व से अधिक कूद; सीखना एक नमूना उत्पन्न करने के लिए जनरेटर `G(z)`, और एक झूठा न्याय करने वाला भेदभाव करने वाला `D(x)`GANs (Goodfellow 2014) 推理很快(एक बार आगे पास), लेकिन प्रशिक्षण प्रक्रिया नाम की जगह नहीं बनी है।

**4. Score-based / continuous-time。**直接学习 लॉग-घनता का ग्रेडिएंट `∇_x log p(x)`(स्कोर) ――Song & Ermon (2019)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

**5. 基于 Token 的离散 codes 上的 autoregressive。**VQ-VAE या अवशिष्ट क्वांटाइज़र का उपयोग करके उच्च-विकास डेटा को एक छोटे से अलग-अलग टोकन अनुक्रम में संपीड़ित किया जाएगा, फिर ट्रांस्फॉर्मर का उपयोग टोकन अनुक्रम के लिए किया जाएगा।

## 简史

| 年份 | 模型 | 为什么重要 |
|------|-------|-----------------|
| 2013 | VAE (Kingma) | 第一个拥有可用训练 Loss 的 deep generative model。 |
| 2014 | GAN (Goodfellow) | Implicit density，没有 likelihood，却能产生惊人锐利的样本。 |
| 2015 | DRAW, PixelCNN | 顺序图像生成。 |
| 2017 | Glow, RealNVP | 可逆 flows；通过 depth 获得精确 likelihood。 |
| 2017 | Progressive GAN | 第一个 megapixel 人脸。 |
| 2019 | StyleGAN / StyleGAN2 | 在人脸这个单一领域中，photorealistic faces 依然很难被击败。 |
| 2020 | DDPM (Ho) | Diffusion 变得实用。 |
| 2021 | CLIP, DALL-E 1, VQGAN | Text-to-image 进入主流。 |
| 2022 | Imagen, Stable Diffusion 1, DALL-E 2 | Latent diffusion + text conditioning = 商品化。 |
| 2022 | ControlNet, LoRA | 对 pretrained diffusion 进行精细控制。 |
| 2023 | SDXL, Midjourney v5, Flow matching | 规模 + 更好的训练动态。 |
| 2024 | Sora, Stable Diffusion 3, Flux.1 | Video diffusion；flow matching 胜出。 |
| 2025 | Veo 2, Kling 1.5, Runway Gen-3, Nano Banana | 生产级视频。 |
| 2026 | Consistency + Rectified Flow | 从 diffusion backbones 进行一步采样。 |

## 五问分诊

जब एक नया जनरेटिव मॉडल 论文 सामने आएगा, तो पहले इन पांच सवालों का जवाब देना होगा।

1. **建模的是什么？**पिक्सेल, लातेंट, विघटन टोकन, 3 डी गौसीन, जाल, तरंगों?
2. **Density 是 explicit 还是 implicit？**क्या वे लिख रहे हैं?`log p(x)`?
3. **Sampling：one-shot 还是 iterative？**पुनरावृत्ति का अर्थ है धीमी; एक शॉट का अर्थ आमतौर पर प्रतिकूल या डिस्टिल किया गया है।
4. **Conditioning：unconditional、class、text、image、pose？**यह निर्णय लिया है हानि और संरचना के लिए.
5. **Evaluation：FID、CLIP score、IS、human preference、task accuracy？**प्रत्येक में विफलता के ज्ञात मोड होते हैं।

आप इस चरण के प्रत्येक पाठ में इन पांच प्रश्नों का उत्तर पुनः देंगे। अंततः वे आपकी स्थिति प्रतिबिंबित होंगे।


```figure
autoencoder-bottleneck
```

##  इसे निर्माण

इस वर्ग का कोड एक हल्के स्तर पर दृश्यमान हैः उपयोग तीन प्रकार के खिलौना विधि (कर्नल घनत्व, विखंडन हिस्टोग्राम, तथा निकटतम नमूना GAN-ish जनरेटर) से नमूना में एक 1-डी मिश्रण-गौसी के अनुरूप है, ताकि आप एक स्क्रीन पर प्रिंट करने योग्य प्रश्न पर स्पष्ट बनाम अप्रत्यक्ष घनत्व के अंतर को देख सकें।

运行 `code/main.py`यह एक दो-पंच गाउसियन मिश्रण से 2000  नमूने निकालता है, और फिर मुद्रित करता हैः

```
explicit density (histogram): p(x in [-0.5, 0.5]) ≈ 0.38
approximate density (KDE):     p(x in [-0.5, 0.5]) ≈ 0.41
implicit (nearest-sample gen): 20 new samples printed, no p(x)
```

ध्यान देंः पहले दो आपको यह प्रश्न पूछने की अनुमति देते हैं कि यह बिंदु क्या अधिक संभव है?

## इसका उपयोग करें

2026 में, कौन सा परिवार किस कार्य के लिए उपयुक्त होगा?

| 任务 | 最佳家族 | 原因 |
|------|-------------|-----|
| Photoreal faces，窄领域 | StyleGAN 2/3 | 仍然最锐利，推理最快。 |
| 通用 text-to-image | Latent diffusion + flow matching | SD3, Flux.1, DALL-E 3。 |
| 快速 text-to-image | Rectified flow + distillation | SDXL-Turbo, SD3-Turbo, LCM。 |
| Text-to-video | Diffusion Transformer + flow matching | Sora, Veo 2, Kling。 |
| Speech + music | Token-based AR (AudioLM, VALL-E, MusicGen) 或 flow matching (AudioCraft 2) | 离散 tokens 扩展成本低。 |
| 3D scenes | Gaussian Splatting fit, diffusion prior | 3D-GS 用于重建，diffusion 用于 novel-view。 |
| Density estimation（不采样） | Flows | 唯一拥有精确 `log p(x)` 的家族。 |
| Simulation / physics | Flow matching, score SDE | 直线路径，平滑 Vector fields。 |

## 交付 यह

保存为 `outputs/skill-model-chooser.md`

इस कौशल  प्राप्त एक कार्य विवरण并输出:(1) उपयोग करने के लिए कौन सा परिवार,(2) तीन खुला विकल्प और तीन होस्ट किए गए विकल्प के क्रम सूची,(3) आप पर ध्यान देना चाहिए संभावित विफलता मोड, तथा (4) 计算/ समय बजट

## अभ्यास

1. **Easy。**निम्नलिखित पांच उत्पादों के लिए, पहचान उसके परिवार और रीढ़ की हड्डी:ChatGPT छवि、Midjourney v7、Sora、Runway Gen-3、ElevenLabs。 साक्ष्य से प्राप्त होना चाहिए सार्वजनिक प्रौद्योगिकी रिपोर्ट。
2. **Medium。**आप कल पढ़ना चाहते हैं के बारे में लेख दावा करते हैं कि प्रक्षेपण से 快 100 倍 ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ 
3. **Hard。**选择一个你关心的领域 (例如蛋白质结构,CAD,分子,轨迹) . इस क्षेत्र के लिए वर्तमान SOTA 模型 उत्तर पाँच प्रश्न分诊,并勾勒一个更好的模型会改变什么──

## 关键术语

| 术语 | 人们怎么说 | 它实际是什么意思 |
|------|-----------------|-----------------------|
| Generative model | “它会生成新东西” | 学习 `p_data(x)` 的 sampler，可选地暴露 `log p(x)`。 |
| Explicit density | “你可以计算它” | 模型提供 closed-form 或 tractable 的 `log p(x)`。 |
| Implicit density | “GAN-style” | 只有 sampler——无法计算给定点的 `p(x)`。 |
| ELBO | “Evidence lower bound” | `log p(x)` 的一个 tractable 下界；VAEs 和 diffusion 会优化它。 |
| Score | “log-density 的 Gradient” | `∇_x log p(x)`；diffusion 和 SDE models 学习这个 field。 |
| Manifold hypothesis | “数据存在于一个表面上” | 高维数据集中在低维 manifold 上；这就是 dimensionality reduction 有效的原因。 |
| Autoregressive | “预测下一个片段” | 将 joint 因式分解为 conditionals 的乘积。 |
| Latent | “压缩 code” | 一种低维表示，decoder 可以从中重建输入。 |

## 生产备注: पाँच परिवार, पाँच प्रकार के अनुशंसित स्वरूप

प्रत्येक परिवार में विभिन्न निष्कर्ष-सेवरों पर मैगजीन किया जाएगा 成本曲线──制作-उत्पादन 文献将LLM 推理框定为预填 +解码; इसी प्रकार का分解 भी यहीं लागू होगाः

- **Autoregressive（类别 1 和 5）。**顺序 डिकोड 主导 विलंबता;KV-कैश、 निरंतर बैचिंग तथा अनुमानात्मक डिकोडिंग
- **VAE / diffusion / flow-matching（类别 2 和 4）。**इसमे कोई LLM ार्थ पर decode नही है।`num_steps × step_cost`, और `step_cost`                                                                                                                                                                                                                                                              
- **GAN（类别 3）。**एक बार आगे गुजरें── कोई कार्यक्रम नहीं, कोई KV-कैश नहीं──TTFT ≈ कुल विलंबता── यही कारण है कि StyleGAN में संकीर्ण क्षेत्र में UX ऊपर अभी भी जीतने की वजह है──

जब आप पेपर के अंश में फैलाव से तेज़ देखें, तो इसे कम चरणों में अनुवाद करें × समान चरणों की लागत × या समान चरणों की लागत × अधिक सस्ती चरणों की लागत── इसके अलावा सभी विपणन हैं──

## 延伸阅读

- [Goodfellow et al. (2014). Generative Adversarial Nets](https://arxiv.org/abs/1406.2661) GAN 论文──
- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) VAE 论文──
- [Ho, Jain, Abbeel (2020). Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) डीडीपीएम 论文。
- [Song et al. (2021). Score-Based Generative Modeling through SDEs](https://arxiv.org/abs/2011.13456) 作为 SDE का प्रसार──
- [Lipman et al. (2023). Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747) प्रवाह मिलान 论文。
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) स्थिर विसारण 3。
