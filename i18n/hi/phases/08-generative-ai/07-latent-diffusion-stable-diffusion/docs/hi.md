# लातेंट विसारण तथा स्थिर विसारण

> 512×512 चित्र पर पिक्सेल-अंतरिक्ष विसारण करने के लिए, गणना में युद्ध अपराधों के रूप में। Rombach et al. (2022) ध्यान दें, एक छवि उत्पन्न करने के लिए कुल 786k आयाम की आवश्यकता नहीं है, आपको केवल भाषा संरचना के आयाम को पकड़ने के लिए पर्याप्त की आवश्यकता है, साथ ही शेष भागों को संभालने के लिए एक अलग डिकोडर की आवश्यकता है।

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 02 (VAE), Phase 8 · 06 (DDPM), Phase 7 · 09 (ViT)
**Time:** ~75 minutes

## 问题

5122 के पिक्सेल-स्पेस विसारण का अर्थ है यू-नेट को आकार में होना चाहिए`[B, 3, 512, 512]`एक 500M-परम के यू-नेट के लिए, प्रत्येक नमूना चरण लगभग 100 GFLOPS है।

इन फ्लोप्स को बहुत अधिक समय में नेटवर्क पर संचालित किया जाता है, यानी वे हैं जिनके साथ VAE को कम किया जा सकता है।

यही है स्थिर विसारण 配方──SD 1.x / 2.x एक 860M यू-नेट  संसाधित करें `64×64×4`लटेंट,SDXL उपयोग एक 2.6B यू-नेट  संसाधित `128×128×4`,SD3 उपयोग के साथ प्रवाह मिलान का विसारण ट्रांसफार्मर (DiT)  ने U-Net──Flux.1-dev (ब्लैक फॉरेस्ट लैब्स, 2024)  जारी किया एक 12B-पेरम DiT-MMDiT──वे सभी एक ही दो चरणों के आधार पर चल रहे हैं──

## 概念

![Latent diffusion: VAE compression + diffusion in latent space](../assets/latent-diffusion.svg)

**两个阶段，分别训练。**

1. **Stage 1 — VAE.**एन्कोडर `E(x) → z`,डिसीडर `D(z) → x` लक्ष्य संपीड़न दर: प्रत्येक अंतरिक्ष轴下采样 8×, पुनः调整 चैनल,使总潜尺寸 约为像素数的1/16──Loss = पुनर्निर्माण (L1 + LPIPS धारणा) + KL(权重很小,使 `z`हम बहुत ज्यादा गौशियन के लिए मजबूर नहीं किया जाएगा, क्योंकि हम से जरूरत नहीं है।`z`️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

2. **Stage 2 — 在 `z` 上做 diffusion。**`z = E(x_real)`जब हम डेटा को पढ़ते हैं, तो हम एक यू-नेट को धोखा देते हैं।`z_t`推理时: प्रसारण के माध्यम से 采样 `z_0`, फिर `x = D(z_0)`

**文本 conditioning。**दो अतिरिक्त घटक हैं। एक 结的文字 एन्कोडर है।`[Q = image features, K = V = text tokens]`और उन्हें मिश्रित करते हैं। टोकन केवल पाठ को प्रभावित करने का एक तरीका है।

**Loss Function 与 Lesson 06 完全相同。**इसी तरह शोर ऊपर DDPM / प्रवाह MSE मेल करने पर किया गया है. आप बस डेटा डोमेन को बदल दिया है.

## 架构变体

| Model | Year | Backbone | Latent shape | Text encoder | Params |
|-------|------|----------|--------------|--------------|--------|
| SD 1.5 | 2022 | U-Net | 64×64×4 | CLIP-L (77 tokens) | 860M |
| SD 2.1 | 2022 | U-Net | 64×64×4 | OpenCLIP-H | 865M |
| SDXL | 2023 | U-Net + refiner | 128×128×4 | CLIP-L + OpenCLIP-G | 2.6B + 6.6B |
| SDXL-Turbo | 2023 | Distilled | 128×128×4 | same | 1-4 step sampling |
| SD3 | 2024 | MMDiT (multimodal DiT) | 128×128×16 | T5-XXL + CLIP-L + CLIP-G | 2B / 8B |
| Flux.1-dev | 2024 | MMDiT | 128×128×16 | T5-XXL + CLIP-L | 12B |
| Flux.1-schnell | 2024 | MMDiT distilled | 128×128×16 | T5-XXL + CLIP-L | 12B, 1-4 step |

趋势是: DiT (DIT) के साथ लटके हुए पैचों के ट्रांसफार्मर पर प्रभाव डालता है) U-Net को प्रतिस्थापित करना, पाठ एन्कोडर का विस्तार करना, लटके हुए चैनल को बढ़ाना,


```figure
noise-schedule
```

##  इसे निर्माण

`code/main.py`एक खिलौना 1-डी VAE( पहचान एन्कोडर + डिकोडर, केवल प्रदर्शन के लिए; असली VAE 会是 conv net) पर रखा गया है पाठ 06 के DDPM 之上,并通过 वर्गीकरण मुक्त मार्गदर्शन 加入类条件化── यह एक ही विसारण हानि प्रदर्शित करता है चाहे मूल 1-डी मूल्य पर चल रहा हो, या फिर एन्कोडेड मानों पर चल रहा हो, यह है महत्वपूर्ण洞见──

### 步骤 1: एन्कोडर/डेकोडर

```python
def encode(x):    return x * 0.5          # toy "compression" to smaller scale
def decode(z):    return z * 2.0
```

वास्तविक वीएई में प्रशिक्षित होने का अधिकार है।`z`ऊपर ऑपरेशन, मूल डेटा स्पेस पर ध्यान न दें।

### 步骤 2: `z`- अंतरिक्ष में बनाने विसारण

सीजन 06 के समान डीडीपीएम।`z = E(x)`                                                                                                                                                                                                                                                              `z_0`后, उपयोग `D(z_0)`डिकोड करना

### 步骤 3: वर्गीकरणकर्ता मुक्त मार्गदर्शन

训练期间,10% का समय छोड़ दिया वर्ग लेबल(प्लास्टिक शून्य टोकन के लिए)`ε_cond`和 `ε_uncond`, फिरः

```python
eps_cfg = (1 + w) * eps_cond - w * eps_uncond
```

`w = 0`= 无指导(完全多样性),`w = 3`= 默认值,`w = 7+`= 和 / 过化──

### 步骤 4: 文本条件化 (概念,不是代码)

把 वर्ग लेबल 替换为结 पाठ एन्कोडर 的输出──通过跨注意 把文字嵌入 输入 U-Net:

```python
h = h + CrossAttention(Q=h, K=text_embed, V=text_embed)
```

यह वर्ग-सशर्त विसारण मॉडल और स्थिर विसारण के बीच एकमात्र भौतिक अंतर है।

## 陷

- **VAE-scale mismatch。**SD 1.x VAEs में एन्कोडिंग 后会应用一个缩放常数(`scaling_factor ≈ 0.18215`)― यह भूलना यू-नेट को गंभीर त्रुटि के बीच में लटके हुए स्थानों पर प्रशिक्षण देने में मदद करेगा। प्रत्येक चेकपॉइंट में यह मूल्य होता है।
- **Text encoder silently wrong。**SD3 需要带>=128 टोकन के T5-XXL,fallback तक केवल CLIP 会有损──始终检查 `use_t5=True`, अन्यथा शीघ्र निष्ठा 会崩――
- **混用 latent spaces。**SDXL、SD3、Flux सभी विभिन्न VAEs का उपयोग करते हैं। SDXL लटेंट्स में ऊपर प्रशिक्षण के लोरा का उपयोग SD3 में नहीं किया जा सकता है।
- **CFG too high。** `w > 10`                                                                                                                                                                                                                                                              `w = 3-7`
- **Negative prompts leaking。**शून्य नकारात्मक संकेत शून्य टोकन में बदल जाएगा; भरने नकारात्मक संकेत होगा`ε_uncond` ये दोनों एक जैसे नहीं हैं; कुछ पाइपलाइनें 

## इसका उपयोग करें

2026 साल का उत्पादन:

| Target | Recommended backbone |
|--------|----------------------|
| 窄领域、配对数据、从零训练模型 | SDXL fine-tune (LoRA / full) — 最快交付 |
| 开放域 text-to-image，开放权重 | Flux.1-dev (12B, Apache / non-commercial) 或 SD3.5-Large |
| 最快推理，开放权重 | Flux.1-schnell (1-4 step, Apache) 或 SDXL-Lightning |
| 最佳 prompt adherence，托管服务 | GPT-Image / DALL-E 3 (still), Midjourney v7, Imagen 4 |
| 编辑工作流 | Flux.1-Kontext (Dec 2024) — 原生接受 image + text |
| 研究、baseline | SD 1.5 — 古老但研究充分 |

## 交付 यह

保存 `outputs/skill-sd-prompter.md`◊Skill 接收一个文本提示 + 目标风格,并输出:model + checkpoint、CFG scale、sampler、negative prompt、resolution、可选的ControlNet/IP-Adapter 组合,以及一个逐步QA चेकलिस्ट──

## अभ्यास

1. **Easy.**उपयोग मार्गदर्शन `w ∈ {0, 1, 3, 7, 15}`运行 `code/main.py` प्रत्येक वर्ग के औसत नमूना को रिकॉर्ड करें`w`नीचे, वर्ग का मतलब वास्तविक डेटा औसत से अलग होगा?
2. **Medium.**इसे खेल के लिए लाइनर एन्कोडर के रूप में बदल दें, पुनः निर्माण हानि में शामिल हों।
3. **Hard.**उपयोग डिफ्यूज़र                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `sdxl-base`, CFG=7 के साथ 30  Euler कदम चलाएँ,并计时――然后切换到 `sdxl-turbo`, 4 चरणों में 和 CFG=0── एक ही विषय, अलग गुणवत्ता, वर्णन क्या परिवर्तन हुआ और कारणों──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| First stage | “The VAE” | 训练好的 encoder/decoder 对；把 512² 压缩到 64²。 |
| Second stage | “The U-Net” | latent space 上的 diffusion model。 |
| CFG | “Guidance scale” | `(1+w)·ε_cond - w·ε_uncond`；调节 conditioning strength。 |
| Null token | “Empty prompt embed” | 用于 `ε_uncond` 的 unconditional embed。 |
| Cross-attention | “How text gets in” | 每个 U-Net block 都以 text tokens 作为 K 和 V 进行 attention。 |
| DiT | “Diffusion Transformer” | 用作用于 latent patches 的 transformer 替换 U-Net；扩展性更好。 |
| MMDiT | “Multi-modal DiT” | SD3 的架构：带 joint attention 的文本与图像流。 |
| VAE scaling factor | “Magic number” | 将 latents 除以约 5.4，使 diffusion 在 unit-variance 空间中运行。 |

## उत्पादन विवरणः 8GB 消费级 GPU पर चल रहा है प्रवाह-12B

参考流流集是经典的我有一张消费级GPU,能交付吗?配方──技巧就是把生产推理文献列出的同一个三旋配方应用到扩散DIT:

1. **Staggered loading。**प्रवाह के तीन आवश्यक नहीं हैं VRAM में एक साथ मौजूद नेटवर्क:T5-XXL पाठ एन्कोडर(fp32 下约 10 GB) 、CLIP-L(小)、12B MMDiT, तथा VAE──先 एन्कोड करें शीघ्र,*हटाएँ* एन्कोडर,लोड करें DiT,denoise,*हटाएँ* DiT,लोड करें VAE,डेकोड──消费级 8GB GPUs 一次只能容纳一个阶段──
2. **通过 bitsandbytes 做 4-bit quantization。**T5 एन्कोडर में और DiT ऊपर उपयोग `BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.bfloat16)`内存 घटकर 8×, Aritra के बेंचमार्क के अनुसार, नोटबुक में लिंक हैं), पाठ-चित्र की गुणवत्ता में लगभग अवलोकन योग्य गिरावट
3. **CPU offload。** `pipe.enable_model_cpu_offload()`प्रत्येक चरण में आगे की ओर जाने पर पूर्ववर्ती समय स्वचालित रूप से CPU और GPU के बीच विनिमय मॉड्यूलों में वृद्धि करता है। 10-20% देरी, लेकिन पाइपलाइन को चलाने में सक्षम बनाता है।

मेनू मेंः`10 GB T5 / 8 = 1.25 GB`क्वांटिज़्ड,`12 B params × 0.5 bytes = ~6 GB`क्वांटिफाइड डीटी, पुनः जोड़ पर सक्रियणों──उपयोग stas00 का कहना है, यह TP=1 निष्कर्ष की चरम स्थिति हैः कोई मॉडल समानांतरता, अधिकतम क्वांटिफाइडिंग── उत्पादन वातावरण में आप H100s में 上跑 TP=2 या TP=4; के लिए एकल台 विकास笔记本, यह है配方──

## 延伸阅读

- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) स्थिर विसारण。
- [Podell et al. (2023). SDXL: Improving Latent Diffusion Models for High-Resolution Image Synthesis](https://arxiv.org/abs/2307.01952) SDXL。
- [Peebles & Xie (2023). Scalable Diffusion Models with Transformers (DiT)](https://arxiv.org/abs/2212.09748) DiT。
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) SD3, MMDiT──
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598) CFG。
- [Labs (2024). Flux.1 — Black Forest Labs announcement](https://blackforestlabs.ai/announcing-black-forest-labs/) प्रवाह 1 系列──
- [Hugging Face Diffusers docs](https://huggingface.co/docs/diffusers/index) उपर्युक्त प्रत्येक चेकपॉइंट के संदर्भ में प्राप्ति 
