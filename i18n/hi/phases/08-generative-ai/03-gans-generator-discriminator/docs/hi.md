# जीएएन  जनरेटर बनाम भेदभावकर्ता

> 2014 में, अच्छे साथी की तकनीक पूरी तरह से घनत्व से अधिक है। दो नेटवर्क हैं। एक बनावट बनावट है। एक उन्हें पकड़ता है। वे एक दूसरे के खिलाफ तब तक लड़ते हैं जब तक कि नकली वास्तविक नमूने से अलग नहीं हो जाते। यह काम नहीं करना चाहिए। यह अक्सर काम नहीं करता है। लेकिन एक बार जब यह काम करता है, तो संकीर्ण क्षेत्र के लिए, यह उत्पन्न नमूने अभी भी साहित्य में सबसे लाभदायक हैं।

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 08 (Optimizers), Phase 8 · 02 (VAE)
**Time:** ~75 minutes

## 问题

VAEs अस्पष्ट नमूने उत्पन्न करेंगे, क्योंकि उनके MSE डिकोडर का नुकसान  के लिए औसत मूल्य* छवियों बेयज़ सबसे अच्छा है, जबकि कई तर्कसंगत संख्याओं का औसत मूल्य एक अस्पष्ट संख्या है आप एक पुरस्कार* तर्कसंगतता* का नुकसान चाहते हैं, बजाय पुरस्कार के साथ किसी लक्ष्य के पिक्सेल-बुद्धिमान स्तर के करीब तर्कसंगतता कोई बंद-रूप नहीं आप सीखना चाहिए

Goodfellow का विचार: एक वर्गीकरण को प्रशिक्षित करें `D(x)`वास्तविक चित्र और नकली में अंतर करने के लिए एक जनरेटर को प्रशिक्षित करें`G(z)`धोखा देने के लिए`D``G`का नुकसान संकेत है`D`जब पहले लगता है कि कुछ वास्तविकता के आधार पर लगता है।`G`改进, यह संकेत भी अपडेट होगा, एक मोबाइल लक्ष्य का पीछा करेगा.`G`बस में कभी नहीं लिखा है`log p(x)`के मामले में, डेटा वितरण किया गया है।

यही है, प्रतिद्वंद्वी प्रशिक्षण। गणित में यह एक न्यूनतम खेल हैः

```
min_G max_D  E_real[log D(x)] + E_fake[log(1 - D(G(z)))]
```

2026 तक,GANs 已不再是SOTA जनरेटर(प्रसारण और प्रवाह मिलान 夺走王冠) . लेकिन StyleGAN 2/3  अभी भी प्रकाशित किए गए सबसे लाभकारी चेहरे के मॉडल हैं,GAN भेदभावकर्ताओं का उपयोग प्रसारण प्रशिक्षण के बीच किया जाता है *धारणात्मक नुकसान*, जबकि विरोधी प्रशिक्षण 支着快速1 चरण डिस्टिलिएशन(SDXL-Turbo, SD3-Turbo, LCM),让你能交付实时扩散──

## 概念

![GAN training: generator and discriminator in minimax](../assets/gan.svg)

**Generator `G(z)`。** शोर वेक्टर `z ~ N(0, I)`映射到样品 `x̂` एगो डिकोडर 形状的网络(घन या ट्रांसपोस्टेड conv) 

**Discriminator `D(x)`。**映射为 skalar probability (या स्कोर) ∼真实 → 1,fake → 0──

**Loss。**两个交替更新:

- **训练 `D`：** `loss_D = -[ log D(x) + log(1 - D(G(z))) ]`对真=1,假=0 做二进制交叉
- **训练 `G`：** `loss_G = -log D(G(z))` यह गुडफ़ेलो का प्रयोग है * गैर-संतोषजनक * 形式(原始的 `log(1 - D(G(z)))`मी संतोषित, और वह`D`很自信时杀死梯度) 

**Training loop。**एक कदम `D`, कदम `G`重复

**为什么它能工作。**यदि `G`完美匹配 `p_data`, तो फिर `D`करने के लिए नहीं है करने के लिए बेहतर अनुमान है, और वहाँ है आउटपुट 0.5;`G` पुनः प्राप्ति ग्रेडिएंट संतुलन प्राप्ति

**为什么它会失效。**मोड कोलप`G`找到一个 `D`无法分类的模式, फिर हमेशा造它) 、消失的梯度(`D`बहुत जल्दी सीखना,`log D`संतोष) ̳शिक्षा अस्थिरता ̳शिक्षा दर ̳बैच आकार ̳कुछ भी हो) ̳

## 让 GANs 可用变体

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

##  इसे निर्माण

`code/main.py`1-डी डेटा में 上训练一个小型GAN:两个高西亚的混合物──生成器和分辨器 都是单层隐藏MLPs──我们手写实现前进、后退和最小x循环──目标是看到两个关键失败模式(模式崩 +消失梯度)

### 步骤 1: गैर-स saturating हानि

वैनिला गुडफेलो हानि `log(1 - D(G(z)))`सभा में डी पर उच्च विश्वास से G का फर्जी वर्गीकरण करें 时趋近 0―― इस समय G का ग्रेडिएंट 基本为零,G 无法改进――非和形式 `-log D(G(z))`具有相反的表达: जब डी 很自信时它会爆增,给G一个强信号──

```python
def g_loss(d_fake):
    # maximize log D(G(z))  <=>  minimize -log D(G(z))
    return -sum(math.log(max(p, 1e-8)) for p in d_fake) / len(d_fake)
```

### 步骤 2: प्रत्येक जनरेटर कदम एक भेदभावपूर्ण कदम के लिए

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

给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 G 给 给                                                                                                                                                                                                                                                                                                              

### 步骤 3: 观察 मोड कोल

```python
if step % 200 == 0:
    samples = [G(z) for z in sample_noise(500)]
    mode_a = sum(1 for s in samples if s < 0)
    mode_b = 500 - mode_a
    if min(mode_a, mode_b) < 50:
        print("  [!] mode collapse: one mode is starved")
```

经典症状: दो वास्तविक मोड में से एक में एक रोक है ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

## 陷

- **Discriminator 太强。**डी की सीखने की दर 2-5 गुना कम हो जाती है या इंस्टेंस/लेयर शोर जोड़ती है।
- **Generator 记住了一个 mode。**D इनपुट दें, शोर जोड़ें, मिनी बैच-विभेदक परत का उपयोग करें, या WGAN-GP में स्विच करें
- **Batch norm 泄漏 statistics。**वास्तविक बैच + नकली बैच 流经同一个BN परत 会混合它们的统计――改用实例规范或光谱规范――
- **Inception-score gaming。**FID 和 IS में निम्न नमूना गिनती नीचे शोर बहुत बड़ा है।
- **对于 conditional tasks，one-shot sampling 是谎言。**आप अभी भी CFG स्केल, ट्रंकिंग ट्रिक्स और पुनः नमूना प्राप्त करने की जरूरत है

## इसका उपयोग करें

2026 के लिए GAN स्टैकः

| Situation | Pick |
|-----------|------|
| Photoreal human faces, fixed pose | StyleGAN3（最锐利、最小） |
| Anime / stylized faces | StyleGAN-XL 或 Stable Diffusion LoRA |
| Image-to-image translation | Pix2Pix / CycleGAN（Phase 8 · 04）或 ControlNet（Phase 8 · 08） |
| Fast 1-step text-to-image | diffusion 的 adversarial distillation（SDXL-Turbo, SD3-Turbo） |
| Perceptual loss inside a diffusion trainer | image crops 上的小型 GAN discriminator |
| Anything multi-modal, open-ended | 不要用 —— 使用 diffusion 或 flow matching |

GANs 利但狭窄──一旦你的域 打开,例如照片、任意文字提示、视频,就切换到传播──逆境技巧──作为组件继续存在(感觉损失、蒸化),而不是独立发电机──

## 交付 यह

保存 `outputs/skill-gan-debugger.md`◊ कौशल 接收一次失败的GAN run(लॉस वक्र、 नमूना ग्रिड、डेटासेट आकार),并输出根据可能性排序的原因、一线修正和重复协议──

## अभ्यास

1. **Easy。**उपयोग默认设置运行 `code/main.py` तब सेटअप `D_LR = 5 * G_LR`और फिर से चलना शुरू किया गया. G का नुकसान.
2. **Medium。**उपयोग WGAN हानि  बदली Goodfellow BCE हानिः`loss_D = E[D(fake)] - E[D(real)]`,`loss_G = -E[D(fake)]`, और D के वजन क्लिप करने के लिए `[-0.01, 0.01]` प्रशिक्षण क्या अधिक स्थिर है?
3. **Hard。**1-डी नमूना 2-डी डेटा तक विस्तारित करना ([[घंटे पर 8  गौसीन मिश्रण)  अनुवर्ती जनरेटर 1k、5k、10k चरणों में 8  मोड में से कितने को पकड़ लिया गया  मिनी बैच भेदभाव को प्राप्त किया गया और पुनः माप किया गया

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

## उत्पादन नोटः एक शॉट निष्कर्ष है GAN का स्थायी लाभ

GANs में ओपन-डोमेन पीढ़ी के नमूना गुणवत्ता 上不再获胜, लेकिन वे अभी भी में अनुमान लागत 上获胜.

- **没有 prefill，没有 decode stages。**एक बार `G(z)`आगे की पास──TTFT ≈ कुल विलंबता──
- **没有 KV-cache pressure。**唯一 स्थिति है वजन── बैच आकार 受 सक्रियण स्मृति 限制, बजाय कैश──
- **Trivial continuous batching。**由于 प्रत्येक अनुरोध में समान फिक्स्ड फ्लोप का उपभोग होता है, सर्वर  लक्ष्य अधिग्रहण दर के तहत स्थिर बैच आमतौर पर सबसे अच्छा होता है── उड़ान में अनुसूचक की आवश्यकता नहीं होती──

यही कारण है कि GAN डिस्टिलिशन (SDXL-Turbo, SD3-Turbo, ADD, LCM) 2026 साल की तेजी से पाठ-छवि है।

## 延伸阅读

- [Goodfellow et al. (2014). Generative Adversarial Nets](https://arxiv.org/abs/1406.2661) 原始 GAN कागज
- [Radford et al. (2015). Unsupervised Representation Learning with DCGAN](https://arxiv.org/abs/1511.06434) 第一个稳定 वास्तुकला
- [Arjovsky, Chintala, Bottou (2017). Wasserstein GAN](https://arxiv.org/abs/1701.07875) WGAN。
- [Miyato et al. (2018). Spectral Normalization for GANs](https://arxiv.org/abs/1802.05957) SN。
- [Karras et al. (2020). Analyzing and Improving the Image Quality of StyleGAN](https://arxiv.org/abs/1912.04958) StyleGAN2──
- [Karras et al. (2021). Alias-Free Generative Adversarial Networks](https://arxiv.org/abs/2106.12423) StyleGAN3──
- [Sauer et al. (2023). Adversarial Diffusion Distillation](https://arxiv.org/abs/2311.17042) SDXL-Turbo──
