# स्टाइलगान

> अधिकांश जनरेटर `z`उसी समय प्रत्येक परत में प्रवेश करें।`z`映射到中间表示 `w`, और फिर प्रत्येक संकल्प स्तर पर AdaIN के माध्यम से * इंजेक्शन * `w` यह परिवर्तन लटके हुए स्थान को खोलता है, और तस्वीरों में वास्तविक व्यक्ति के चेहरे को लगातार सात वर्षों में हल किया गया मुद्दा बना देता है

**类型：**构建
**语言：**पायथन
**前置要求：**चरण 8 · 03 (GANs), चरण 4 · 08 (नियमितकरण), चरण 3 · 07 (CNNs)
**时间：**~ 45 मिनट

## 问题

DCGAN                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `z`映射成一张图像── प्रश्न है:`z` सभी को नियंत्रित करें, जिसमें स्थिति, प्रकाश प्रकाश, पहचान, पृष्ठभूमि शामिल हैं, और वे सभी एक साथ जुड़े हुए हैं।`z`एक अक्ष के आंदोलन में, ये चार लोग बदलते हैं। आप एक ही व्यक्ति से अलग-अलग पोटोजीशन के मॉडल की मांग नहीं कर सकते हैं, क्योंकि यह अभिव्यक्ति उस तरह से विघटित नहीं है।

Karras et al. (2019, NVIDIA)  प्रस्तावित:停止把 `z`直接 कन्व परतों में भेज दिया गया `4×4×512`संज्ञा 作为网络输入──学习一个8层 MLP,把 `z ∈ Z → w ∈ W`️ *अनुकूलन उदाहरण सामान्यीकरण* (AdaIN) के माध्यम से प्रत्येक संकल्प में डाला जाता है `w`: पहले सामान्य प्रत्येक अनुभाग सुविधा नक्शा, फिर उपयोग `w`                                                                                                                                                                                                                                                              

परिणाम यह हैः`W` उच्च स्तरीय शैली姿态、身份) 细粒度 शैली光照、颜色) 大致正交的轴──你可以使用图像A的 `w` निम्न संकल्प स्तर की शैली के रूप में,  चित्र B का उपयोग करें `w` उच्च रिज़ॉल्यूशन स्तर की शैली के रूप में, इस प्रकार दो चित्रों के बीच आदान-प्रदान शैलियों में से एक है।

## 概念

![StyleGAN: mapping network + AdaIN + per-layer noise](../assets/stylegan.svg)

**Mapping network。** `f: Z → W`, एक 8 स्तर MLP`Z = N(0, I)^512``W`Gaussian के रूप में मजबूर नहीं किया गया, बल्कि डेटा के आकार को अनुकूलित करने के लिए सीख लिया गया।

**Synthesis network。**एक से एक सीखने के लिए नियमित मात्रा `4×4×512`开始── प्रत्येक संकल्प ब्लॉक:`upsample → conv → AdaIN(w_i) → noise → conv → AdaIN(w_i) → noise`分辨率翻倍:4, 8, 16, 32, 64, 128, 256, 512, 1024

**AdaIN。**

```
AdaIN(x, y) = y_scale · (x - mean(x)) / std(x) + y_bias
```

उनमें से `y_scale`和 `y_bias`से`w`शैली यहाँ शैली संदर्भित है शैली के प्रथम चरण और द्वितीय चरण के आंकड़े

**逐层 noise。**प्रत्येक सुविधा मानचित्र में एक मार्ग जोड़ने के बाद, गौशियन शोर को संकुचित करना सीख जाता है।

**Truncation trick。**निष्कर्ष 时,采样 `z`, गणना `w = mapping(z)`, फिर `w' = ŵ + ψ·(w - ŵ)`, उनमें से `ŵ`                                                                                                                                                                                                                                                              `w``ψ < 1`प्रयोग करें विभिन्न प्रकार के परिवर्तन गुणवत्ता--- लगभग हर StyleGAN डेमो उपयोग किया जाता है`ψ ≈ 0.7`

## StyleGAN 1 → 2 → 3

| 版本 | 年份 | 创新 |
|---------|------|------------|
| StyleGAN | 2019 | Mapping network + AdaIN + noise + progressive growing。 |
| StyleGAN2 | 2020 | Weight demodulation 替代 AdaIN（修复 droplet artifacts）；skip/residual architecture；path-length regularization。 |
| StyleGAN3 | 2021 | Alias-free convolution + equivariant kernels；消除 texture 粘在 pixel grid 上的问题。 |
| StyleGAN-XL | 2022 | Class-conditional, 1024², ImageNet。 |
| R3GAN | 2024 | 以更强的 reg 重新包装；在 FFHQ-1024 上用少 20 倍的 params 缩小与 diffusion 的差距。 |

2026 तक,StyleGAN3  अभी भी निम्नलिखित परिदृश्यों का एक आदर्श विकल्प हैः (a) उच्च एफपीएस के संकीर्ण क्षेत्र में फोटो श्रेणी वास्तविक उत्पादन, (b) कुछ शॉट डोमेन अनुकूलन, (c) रिवर्स पर आधारित संपादन, (c) वास्तविक फोटो का पुनर्निर्माण करने का प्रयास।`w`, पुनः संपादित यह `w`)― खुले क्षेत्र में पाठ-चित्र के लिए यह उपयुक्त उपकरण नहीं है, प्रसारण 才是―


```figure
gx-stylegan-mapping
```

##  इसे निर्माण

`code/main.py`实现 एक 1-डी का खिलौना संस्करण style-GAN lite: एक मानचित्रण MLP, एक संश्लेषण समारोह, यह प्राप्त करने के लिए सीखना के लिए नियमित मात्रा वेक्टर,并用从 `w`派生的尺度/bias 进行调制,还有层次噪音──它通过 affine-modulation注入`w`, या उससे अधिक हो सकता है ।`z`拼接进生成器输入方式──

### 步骤 1: मानचित्रण नेटवर्क

```python
def mapping(z, M):
    h = z
    for i in range(num_layers):
        h = leaky_relu(add(matmul(M[f"W{i}"], h), M[f"b{i}"]))
    return h
```

### 步骤 2: अनुकूलन उदाहरण सामान्यीकरण

```python
def adain(x, w_scale, w_bias):
    mu = mean(x)
    sd = std(x)
    x_norm = [(xi - mu) / (sd + 1e-8) for xi in x]
    return [w_scale * xi + w_bias for xi in x_norm]
```

प्रत्येक विशेषता नक्शा के पैमाने और पूर्वाग्रह के माध्यम से रैखिक प्रक्षेपण से `w` प्राप्त करें

### 步骤 3: प्रति परत शोर

```python
def add_noise(x, sigma, rng):
    return [xi + sigma * rng.gauss(0, 1) for xi in x]
```

प्रत्येक मार्ग का सिग्मा सीखने योग्य है।

## 陷

- **Droplet artifacts。**StyleGAN 1 में सुविधा मानचित्रों में एक ब्लॉक आकार का बूंद उत्पन्न होता है, क्योंकि AdaIN 归零了――StyleGAN 2 के वजन का डिमोड्यूलेशन 通过缩放卷积重量来修复它──
- **Texture sticking。**StyleGAN 1 और 2 के बनावट पिक्सेल निर्देशांक के साथ, ऑब्जेक्ट निर्देशांक के बजाय चलती हैं।
- **Mode coverage。**काटना `ψ < 0.7`यह साफ दिखता है, लेकिन यह केवल एक बहुत ही संकीर्ण आकार क्षेत्र से है; यदि विविधता की आवश्यकता है, उपयोग `ψ = 1.0`
- **Inversion 有损。**वास्तविक तस्वीर को उलटा करने के लिए `W`आमतौर पर अनुकूलन या एन्कोडर (e4e, ReStyle, HyperStyle) के माध्यम से पूरा किया जाता है।

## इसका उपयोग करें

| 使用场景 | 方法 |
|----------|----------|
| 照片级真实人脸（anime、product、窄领域） | StyleGAN3 FFHQ / custom fine-tune |
| 从照片进行人脸编辑 | e4e inversion + StyleSpace / InterFaceGAN directions |
| Face swap / reenactment | StyleGAN + encoder + blending |
| Avatar pipelines | StyleGAN3 w/ ADA for low-data fine-tune |
| 从少量图像做 domain adaptation | 冻结 mapping network，fine-tune synthesis |
| Multimodal 或 text-conditioned generation | 不要用它，使用 diffusion |

对于答案是一个人的脸部照片的产品级演示,StyleGAN在推断成本一个次前进通过,在4090上 <10ms) 和相同质量门下敏度上胜过传播

## 交付 यह

保存 `outputs/skill-stylegan-inversion.md`◊Skill 接收一张真实照片并输出:inversion method (इंवर्शन विधि) ◊e4e / ReStyle / HyperStyle) ◊预期潜伏损失、 संपादन बजट ◊在出现文物 之前你能在`W`中移动多远), तथा ज्ञात प्रभावी संपादन दिशाओं की सूची ([[年龄、表情、姿态]])

## अभ्यास

1. **简单。**अलग उपयोग`adain_on=True`和 `adain_on=False`运行 `code/main.py`                                                                                                                                                                                                                                                              
2. **中等。**实现 मिश्रण नियमितकरण: एका प्रशिक्षण बैचसाठी, गणना `w_a``w_b`, और संश्लेषण के पहले भाग में आवेदन`w_a`, अंतिम भाग आवेदन`w_b`❖ डिकोडर 是否学到了 विघटित शैलियों?
3. **困难。**取一个预训练的StyleGAN3 FFHQ मॉडल(ffhq-1024.pkl) ⋅通过在带标签样本上训练 SVM,找到控制 微笑 的 `w`दिशा; रिपोर्ट में身份漂移前可以推动多远──

## 关键术语

| 术语 | 人们怎么说 | 它实际意味着什么 |
|------|-----------------|-----------------------|
| Mapping network | “那个 MLP” | `f: Z → W`，8 层，把 latent geometry 与数据统计解耦。 |
| W space | “Style space” | Mapping network 的输出；大致 disentangled。 |
| AdaIN | “Adaptive instance norm” | Normalize feature map，然后由 `w`-projection 做 scale + shift。 |
| Truncation trick | “Psi” | `w = mean + ψ·(w - mean)`，ψ<1 用多样性换质量。 |
| Path-length regularization | “PL reg” | 惩罚 `w` 中单位变化导致的图像大幅变化；让 `W` 更平滑。 |
| Weight demodulation | “StyleGAN2 的修复” | Normalize conv weights 而不是 activations；消除 droplet artifacts。 |
| Alias-free | “StyleGAN3 的技巧” | Windowed sinc filters；消除 texture 粘在 pixel grid 上的问题。 |
| Inversion | “为真实图像找到 w” | Optimize 或 encode `x → w`，使 `G(w) ≈ x`。 |

## उत्पादन विवरणः क्यों StyleGAN में 2026 साल अभी भी ऑनलाइन हो सकता है

4090 能在 10 ms内生成一张 10242 FFHQ 人脸:`num_steps = 1`, कोई VAE डिकोड नहीं, कोई क्रॉस-अटेंशन पास नहीं है। उत्पादन शब्द का उपयोग करके, यह किसी भी छवि जनरेटर की देरी की सीमा है।**300× 差距**, लघु क्षेत्र के उत्पादों के लिए, यह TCO 上胜出──

两个运维后果:

- **没有 scheduler，没有 batcher。**इस प्रकार, एक स्थिर बैच बनाने का लक्ष्य सबसे अच्छा है। निरंतर बैचिंग (LLM और विसारण के लिए अनिवार्य) कोई लाभ नहीं है, क्योंकि प्रत्येक अनुरोध एक ही FLOP का उपभोग करता है।
- **Truncation `ψ` 是安全旋钮。** `ψ < 0.7`मानचित्रण नेटवर्क के दायरे में एक संकीर्ण आकार क्षेत्र का नमूना  यह नमूना भिन्नता  के लिए सेवा परत  है  एकमात्र 杆  शिखर मूल्य लोड समय घट `ψ`, प्रीमियम उपयोगकर्ताओं के लिए  इसे सुधार 

## 延伸阅读

- [Karras et al. (2019). A Style-Based Generator Architecture for GANs](https://arxiv.org/abs/1812.04948) StyleGAN。
- [Karras et al. (2020). Analyzing and Improving the Image Quality of StyleGAN](https://arxiv.org/abs/1912.04958) StyleGAN2──
- [Karras et al. (2021). Alias-Free Generative Adversarial Networks](https://arxiv.org/abs/2106.12423) StyleGAN3──
- [Tov et al. (2021). Designing an Encoder for StyleGAN Image Manipulation](https://arxiv.org/abs/2102.02766) ई4ई उल्टा──
- [Sauer et al. (2022). StyleGAN-XL: Scaling StyleGAN to Large Diverse Datasets](https://arxiv.org/abs/2202.00273) StyleGAN-XL。
- [Huang et al. (2024). R3GAN: The GAN is dead; long live the GAN!](https://arxiv.org/abs/2501.05441) 现代最小化 GAN नुस्खा。
