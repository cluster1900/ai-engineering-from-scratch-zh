# नियंत्रणनेट, लोरा और कंडीशनिंग

> 仅靠文本是一种拙的控制信号――ControlNet 让你建立一个预训练的扩散模型,并使用深度地图、pose skeleton、scribble或边形图像来引导它──LoRA 让你通过训练1000万个参数来细节调整一个2B-参数模型──二者结合,把稳定扩散从玩具变成2026年各机构都在交付图像管道──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 10 (LLMs from Scratch — LoRA 基础)
**Time:** ~75 minutes

## 问题

 जैसे "लाल कपड़े में एक महिला एक व्यस्त सड़क पर कुत्ते को चलती है" इस तरह का संकेत, मॉडल कुत्ते में है * कहां*、 स्त्री क्या है * मुद्रा*, या सड़क के * माध्यम से संबंध*──文本 लगभग केवल आप तय कर सकते हैं एक छवि की आवश्यकता जानकारी का 10%── शेष भाग दृश्य जानकारी है, नहीं कर सकते हैं का उपयोग कर उच्च प्रभावशाली वर्णनात्मक──

प्रत्येक संकेत के लिए (पोज, गहराई, क्षमता, विभाजन) शून्य से प्रशिक्षण एक नया सशर्त मॉडल, लागत बहुत अधिक है।

आप भी चाहते हैं कि पूर्ण मॉडल को फिर से प्रशिक्षित न करने के मामले में, आपको एक छोटे से 100x के डेल्टा की आवश्यकता होगी।

ControlNet + LoRA + text = 2026 साल प्रैक्टिशनर के उपकरण बॉक्स。 अधिकांश उत्पादन श्रेणी छवि पाइपलाइन 会在SDXL / SD3 / प्रवाह आधार 之上叠加 2-5 个 LoRA、1-3 个 ControlNet,以及一个IP-Adapter。

## 概念

![ControlNet clones the encoder; LoRA adds low-rank deltas](../assets/controlnet-lora.svg)

### नियंत्रणनेट (जंग एट अल., 2023)

取一个预训练的SD──*克隆* U-Net 的编码器 半边──结原始模型──训练这个克隆版本,让它接受额外的条件输入(边缘,深度,位置)──使用 *零转* skip connections(初始化为零的1×1 convs,一开始是无运,随后学习多尔达) 把克隆版本连接回原始模型的解码器 半边──

```
SD U-Net decoder:   ... ← orig_enc_features + zero_conv(controlnet_enc(condition))
```

शून्य-संपर्क प्रारम्भिकता का अर्थ है नियंत्रण नेटवर्क एक आरंभ पहचान के बराबर है, भले ही प्रशिक्षण से पहले नुकसान नहीं होगा।

प्रत्येक प्रकार के नियंत्रण नेटवर्क को एक छोटे से साइड मॉडल के रूप में प्रकाशित किया जाएगा।

```
features += weight_a * control_a(depth) + weight_b * control_b(pose)
```

### लोरा (Hu et al., 2021)

对于模型中任意线性层 `W ∈ R^{d×d}`结 `W`एक निम्न श्रेणी के डेल्टा जोड़ा नहींः

```
W' = W + ΔW,  ΔW = B @ A,  A ∈ R^{r×d},  B ∈ R^{d×r}
```

उनमें से `r << d` ध्यान के लिए, 4-16 मानक विन्यास है; वजन के लिए ठीक-ठीक, 64-128 अधिक सामान्य है।`2 · d · r`, बजाय `d²` `d=640`के SDXL ध्यान,`r=16`时每一个适配器 只有 20k 参数,而不是 410k,减少了20x──放到整个模型上,一个LoRA通常是20-200MB,而基础是5GB──

निष्कर्ष में, आप लोरा को संक्षिप्त कर सकते हैंः`W' = W + α · B @ A``α = 0.5-1.5`很常见──多个LoRA会以加法方式叠加(通常需要注意它们会以非线性方式相互影响) 

### आईपी-एडाप्टर (Ye et al., 2023)

एक बहुत छोटा एडाप्टर, एक क्लिप छवि एन्कोडर का उपयोग करके छवि टोकन उत्पन्न करता है, और उन्हें पाठ टोकन के साथ एक साथ क्रॉस-अटेंशन में डाला जाता है। प्रत्येक आधार मॉडल के बारे में ~ 20MB। यह आपको LoRA की आवश्यकता नहीं है, यह भी एक छवि बनाने में सक्षम बनाता है।

##                                                                                                                                                                                                                                                               

| Tool | 它控制什么 | Size | 何时使用 |
|------|------------|------|----------|
| ControlNet | 空间结构（pose、depth、edges） | 70-360MB | 精确 layout、composition |
| LoRA | 风格、主体、概念 | 20-200MB | 个性化、风格 |
| IP-Adapter | 来自 reference image 的风格或主体 | 20MB | 文本无法描述外观 |
| Textual Inversion | 将单个概念作为新 token | 10KB | 旧方案，大多已被 LoRA 替代 |
| DreamBooth | 对主体做 full fine-tune | 2-5GB | 强身份一致性、高计算成本 |
| T2I-Adapter | 更轻量的 ControlNet 替代方案 | 70MB | Edge devices、inference budget |

नियंत्रण नेटवर्क ≈ 空间──LoRA ≈ 语义──两者一起使用──


```figure
v4-controlnet-zero
```

##  इसे निर्माण

`code/main.py`इन दो तंत्रों को 1-डी ऊपर से अनुकरण करेंः

1. **LoRA。**एक पूर्व प्रशिक्षित रैखिक परत `W`结它──训练一个低级的`B @ A`,使 `W + BA`匹配目标 रैखिक परत── प्रदर्शन `r = 1`足以完美学习 एक रैंक-1 सुधार。

2. **ControlNet-lite。**एक फ्रीज़ बेस प्रेडिक्टर, तथा एक पढ़ें अतिरिक्त संकेत साइड नेटवर्क──साइड नेटवर्क का आउटपुट एक आरंभिक  के लिए सीखने योग्य मात्रा गेट  नियंत्रण  हमारे शून्य-conv  संस्करण)  प्रशिक्षण并观察 गेट 逐步升高──

### 步骤 1: लोरा गणित

```python
def lora(W, A, B, x, alpha=1.0):
    # W is frozen; A, B are the trainable low-rank factors.
    return [W[i][j] * x[j] for i, j in ...] + alpha * (B @ (A @ x))
```

### 步骤 2: शून्य-निट साइड नेटवर्क

```python
side_out = control_net(x, condition)
gated = gate * side_out  # gate initialized to 0
h = base(x) + gated
```

चरण 0 में, आउटपुट और आधार  पूर्ण रूप से समान  प्रशिक्षण प्रारंभिक  धीमी अपडेट `gate`, आपदाएं नहीं होने देंगी।

## 常见坑

- **LoRA 过度缩放。** `α = 2`या `α = 3`यह एक सामान्य प्रकार है, जो इसे अधिक मजबूत बनाता है, लेकिन अत्यधिक अनुकूलन या खराब आउटपुट उत्पन्न करता है।`α ≤ 1.5`
- **ControlNet weight 冲突。**साथ ही उपयोग वजन 1.0 का पोज़ कंट्रोलनेट और वजन 1.0 का गहराई कंट्रोलनेट आमतौर पर ओवर冲──权重总和 ≈ 1.0 सुरक्षा डिफ़ॉल्ट मान──
- **LoRA 用在错误的 base 上。**SDXL LoRA में SD 1.5 ऊपर बैठता है चुप नहीं-अप, क्योंकि ध्यान आयामों असंगत है;. डिफ्यूज़र में 0.30+ होगा जारी चेतावनी:.
- **Textual Inversion 漂移。**एक चेकपॉइंट पर प्रशिक्षण के टोकन, दूसरे चेकपॉइंट पर बदल जाएगा गंभीर रूप से भटक जाएगा।
- **LoRA weight-merging 和存储。**आप लोरा बेक को बेस मॉडल के वजन में डाल सकते हैं, अधिक तेजी से निष्कर्ष प्राप्त करने के लिए, रनटाइम की कोई अतिरिक्त नहीं है, लेकिन रनटाइम में खो जाएगा  संकुचित `α` क्षमता दो संस्करणों को बनाए रखना

## इसका उपयोग करें

| Goal | 2026 pipeline |
|------|---------------|
| 复现某个品牌的艺术风格 | 在约 ~30 张精选图像上训练的 rank 32 LoRA |
| 把我的脸放进生成图像 | DreamBooth 或 LoRA + IP-Adapter-FaceID |
| 指定 pose + prompt | ControlNet-Openpose + SDXL + text |
| Depth-aware composition | ControlNet-Depth + SD3 |
| Reference + prompt | IP-Adapter + text |
| 精确 layout | ControlNet-Scribble 或 ControlNet-Canny |
| 替换背景 | ControlNet-Seg + Inpainting（Lesson 09） |
| 快速 1-step 风格 | SDXL-Turbo 上的 LCM-LoRA |

## 交付 यह

保存 `outputs/skill-sd-toolkit-composer.md`◊ इस कौशल 接收一个任务( इनपुट संपत्ति: शीघ्र、可选参考图像、可选姿、可选深度、可选 scribble),并输出工具堆、重量 和可复现的种子协议──

## अभ्यास

1. **Easy。**`code/main.py`中,将 LoRA रैंक `r`1 से 4 तक परिवर्तन किया गया है। लोरा किस रैंक में है?
2. **Medium。**दो लक्ष्य परिवर्तनों में ऊपर दो स्वतंत्र लोरा को प्रशिक्षित करें। उन्हें एक साथ लोड करें, और उनके अतिरिक्त परस्पर क्रिया का प्रदर्शन करें। यह परस्पर क्रिया कब टूट जाएगी?
3. **Hard。**उपयोग डिफ्यूज़र 叠加:SDXL-बेस + Canny-ControlNet(वेट 0.8) + एक शैली LoRA(α 0.8) + आईपी-एडाप्टर(वेट 0.6)。

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|------------|------------------|
| ControlNet | "Spatial control" | 克隆 encoder + zero-conv skips；读取一张 conditioning image。 |
| Zero convolution | "Starts as identity" | 初始化为零的 1×1 conv；ControlNet 一开始是 no-op。 |
| LoRA | "Low-rank adapter" | `W + B @ A`，`r << d`；比 full fine-tune 少 100x 参数。 |
| rank r | "The knob" | LoRA 压缩；典型值为 4-16，重度个性化使用 64+。 |
| α | "LoRA strength" | LoRA delta 的 runtime scaling。 |
| IP-Adapter | "Reference image" | 通过 CLIP-image tokens 实现的小型 image-conditioning adapter。 |
| DreamBooth | "Full subject fine-tune" | 在约 ~30 张主体图像上训练完整模型。 |
| Textual Inversion | "New token" | 只学习一个新的 word embedding；旧方案，大多已被替代。 |

## 生产说明:लोरा स्वैप ControlNet लेन बहु-आवासीय सेवा

एक वास्तविक पाठ-से-छवि सास एक ही आधार चेकपॉइंट में आयोजित किया गया है 上服务数百 LoRA 和十几个 ControlNet──सेवा करना 问题很像LLM बहु- किराया

- **Hot-swap LoRAs，不要 merge。**`W' = W + α·B·A`आधार में मिल, हम हर कदम अनुमान कर सकते हैं 快约~3-5%, लेकिन会结 `α`और आधार                                                                                                                                                                                                                                                              `pipe.load_lora_weights()`+ `pipe.set_adapters([...], adapter_weights=[...])`, अनुरोध पर सक्रियण हेतु उपयोग किया जा सकता है--- स्वैप 成本是 `2 · d · r · num_layers`भार, अर्थात् एमबी 级、亚秒级。
- **ControlNet 作为第二条 attention lane。**                                                                                                                                                                                                                                                              
- **Quantized LoRAs 也适用。**यदि आप आधार को मापते हैं ((देखें पाठ 07, 8GB पर प्रवाह), लोरा डेल्टा भी 8-बिट या 4-बिट तक मापने में सक्षम होगा।

प्रवाह-विशिष्टःनील्स के प्रवाह-पर-8GB नोटबुक आधार  मात्राबद्ध करने के लिए 4 बिट; इस क्वांटिफाइड आधार में ऊपर ओवरले शैली LoRA(`pipe.load_lora_weights("user/style-lora")`),并使用 `weight_name="pytorch_lora_weights.safetensors"`, अभी भी काम कर सकता है। यह 2026 के अधिकांश सास संगठनों द्वारा वितरित की जाने वाली नुस्खा है।

## 延伸阅读

- [Zhang, Rao, Agrawala (2023). Adding Conditional Control to Text-to-Image Diffusion Models](https://arxiv.org/abs/2302.05543) नियंत्रण नेटवर्क。
- [Hu et al. (2021). LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) लोरा (LRA)  शुरू में LLM में प्रयोग किया जाता है; बाद में प्रसारण में स्थानांतरित किया जाता है) 
- [Ye et al. (2023). IP-Adapter: Text Compatible Image Prompt Adapter](https://arxiv.org/abs/2308.06721) आईपी-एडाप्टर。
- [Mou et al. (2023). T2I-Adapter: Learning Adapters to Dig Out More Controllable Ability](https://arxiv.org/abs/2302.08453) नियंत्रणनेट का अधिक हल्का विकल्प
- [Ruiz et al. (2023). DreamBooth: Fine Tuning Text-to-Image Diffusion Models for Subject-Driven Generation](https://arxiv.org/abs/2208.12242) ड्रीमबथ。
- [HuggingFace Diffusers — ControlNet / LoRA / IP-Adapter docs](https://huggingface.co/docs/diffusers/training/controlnet) 参考 पाइपलाइनों。
