# पेंटिंग, आउटपेंटिंग तथा चित्र संपादन

> टेक्स्ट-टू-इमेज नई चीज़ें बनाएगी। इंपेंटिंग पुरानी चीज़ों को पुनर्स्थापित करेगी। उत्पादन वातावरण में, 70% की लागत वाली छवि कार्य संपादक हैं।

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 8 · 08 (ControlNet & LoRA)
**Time:** ~75 minutes

## 问题

客户发来一张完美产品照片,但背景中有分散注意的标牌――你想擦除标牌,并让其他部分都保持像素级一致――你不能从头运行文字到图像,因为结果会有不同的颜色,不同的光照,不同的产品角度――你想只重生被掩盖的区域,并且希望重生的内容尊重周围的下文――

यह चित्रकला है। इसके विभिन्न प्रकार हैंः

- **Inpainting.**में मास्क में पुनर्जनन, बाहरी छवि को बनाए रखना
- **Outpainting.**में मास्क बाहरी पुनः उत्पन्न (या चित्र के बाहर तक विस्तारित) , अंदर में बरकरार रखा गया।
- **Image editing.**पुनःपूरा चित्र उत्पन्न करें, लेकिन मूल चित्र के साथ भाषाई या संरचनात्मक अनुरूपता बनाए रखें।

2026 के प्रत्येक वर्ष के प्रसार पाइपलाइन 模式──Flux.1-Fill、Stable Diffusion Inpaint、SDXL-Inpaint、DALL-E 3 Edit──ये एक ही सिद्धांत पर आधारित हैं──

## 概念

![Inpainting: mask-aware denoising with context-preserving reinjection](../assets/inpainting.svg)

### 朴素方法 (और यह गलत क्यों है)

带着面具 运行标准文字-to-image── प्रत्येक नमूना चरण में, शोरमय लटके हुए मध्य未面具 के क्षेत्र को आगे-प्रसारित का干净图像── इसके लिए प्रतिस्थापित करें। यह काम कर सकता है...... लेकिन प्रभाव बहुत खराब है── सीमा का कलाकृतियाँ 会出, क्योंकि मॉडल नहीं जानता है कि मास्क 区域里应该有什么──

### सही पेंटिंग मॉडल

प्रशिक्षण एक संशोधित यू-नेट, इसे प्राप्त करने के लिए 9 इनपुट चैनल, बजाय 4 के बजायः

```
input = concat([ noisy_latent (4ch), encoded_image (4ch), mask (1ch) ], dim=channel)
```

 अतिरिक्त चैनल VAE-encoded source image का प्रतिकृति है, एक एकल चैनल मास्क को जोड़कर। प्रशिक्षण के दौरान, आप随机 मास्क 图像中的区域,并训练模型 केवल मास्क 区域 को परिभाषित करते हैं, जबकि बिना मास्क 区域 को शुद्ध कंडीशनिंग सिग्नल के रूप में प्रदान करते हैं।

SD-Inpaint、SDXL-Inpaint、Flux-Fill  इस तरह के 9-चैनल  या इसी तरह के)输入──diffusers `StableDiffusionInpaintPipeline``FluxFillPipeline`

### SDEdit (Meng et al., 2022)  免费编辑

 स्रोत छवि किसी मध्य तक शोर बढ़ाएँ `t`, और फिर एक नया संकेत का उपयोग करें `t`0 तक चलना नहीं है।`t`का चयन सत्यता और सृजन स्वतंत्रता के बीच में होगा:

- `t/T = 0.3`→  लगभग                                                                                                                                                                                                                                                             
- `t/T = 0.6`→ मध्यवर्ती संपादक, रक्षक
- `t/T = 0.9`→ 接近于噪音 生成,对源图保留最小

### InstructPix2Pix (ब्रुक्स एट अल, 2023)

`(input_image, instruction, output_image)`三元组上精细调 一个扩散模型──推理时,同时基于输入图像和文本指令(使它日落、添加一个龙) 进行调节──有两个CFG पैमाने:图像规模和文本规模──

### रिपेन्ट (Lugmayr et al., 2022)

एक मानक असीमित विसारण मॉडल रखें। प्रत्येक उलट चरण में, पुनः नमूना लेंः कभी-कभी अधिक शोर की स्थिति में कूदकर पुनः उत्पन्न करें।


```figure
inpaint-mask-reinject
```

## इसे बनाओ

`code/main.py`5 आयाम डेटा पर एक खिलौना संस्करण 1 डी पेंटिंग 方案 को लागू किया गया। हम 5 आयाम मिश्रण डेटा पर एक डीडीपीएम को प्रशिक्षित करते हैं, जिसमें से प्रत्येक नमूना दो समूहों में से एक से 5 फ्लोट है।

### चरण 1- 5 डी डीपीएम डेटा

```python
def sample_data(rng):
    cluster = rng.choice([0, 1])
    center = [-1.0] * 5 if cluster == 0 else [1.0] * 5
    return [c + rng.gauss(0, 0.2) for c in center], cluster
```

### चरण 2: सभी 5 个维度 पर प्रशिक्षण denoiser

标准 DDPM──नेट 5 डी शोर इनपुट 输出 5 डी शोर भविष्यवाणी──

### चरण 3:推理时使用 मुखौटा-जागरूक उल्टा

```python
def inpaint_step(x_t, mask, clean_image, alpha_bars, t, rng):
    # replace unmasked dims with a freshly noised version of the clean source
    a_bar = alpha_bars[t]
    for i in range(len(x_t)):
        if not mask[i]:
            x_t[i] = math.sqrt(a_bar) * clean_image[i] + math.sqrt(1 - a_bar) * rng.gauss(0, 1)
    # ...then run the normal reverse step on x_t
```

यह एक सरल विधि है, और यह खेल में 1-डी डेटा पर प्रभावी है।

### चरण 4: चित्रकला

पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंटिंग = पेंट = पेंट = पेंटिंग = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट = पेंट

## 陷

- **Seams.**朴素方法会留下可见边界,因为 ग्रेडिएंट 信息不会跨面具 流动──修复方式:把面具 膨胀 8-16 个像素,或使用正确的涂料模型──
- **Mask leakage.**यदि कंडीशनिंग छवि का बिना मास्क 区域质量 कम या शोर है, तो यह प्रदूषण मास्क 内部 में उत्पन्न होगा।
- **CFG interacts with mask size.**छोटे मुखौटे 上使用高CFG 会得到过和补丁──小编辑应降低CFG──
- **SDEdit fidelity cliff.**से `t/T = 0.5`तक `t/T = 0.6`शायद उसका पहचान खो जाए. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
- **Prompt mismatch.** शीघ्र 应该描述*整张*图,而不只是新内容──用 एक बिल्ली कुर्सी पर बैठी, बजाय एक बिल्ली──

## इसका प्रयोग करें

| Task | Pipeline |
|------|----------|
| 移除物体，小 mask | SD-Inpaint 或 Flux-Fill，标准 prompt |
| 替换天空 | SD-Inpaint + "blue sky at sunset" |
| 扩展画布 | SDXL outpaint mode（8px feather）或带 outpaint mask 的 Flux-Fill |
| 重新生成手 / 脸 | SD-Inpaint，prompt 重新描述主体 + ControlNet-Openpose |
| 改变某个区域的风格 | 在 mask 区域上使用 `t/T=0.5` 的 SDEdit |
| "Make it sunset" | InstructPix2Pix 或 Flux-Kontext |
| 背景替换 | SAM mask → SD-Inpaint |
| 超高保真 | 最难场景使用 Flux-Fill 或 GPT-Image（hosted） |

SAM(Meta का Segment Anything,2023) + diffusion inpaint is 2026 साल की पृष्ठभूमि स्थानांतरण पाइपलाइन。SAM 2(2024)

## इसे भेजें

保存 `outputs/skill-editing-pipeline.md`◊Skill 接收一张原图 + 编辑描述 + 可选面膜( या SAM prompt),并输出: मुखौटा 生成方法、बेस मॉडल、CFG स्केल(छवि + पाठ)、SDEdit-t या इनपेंटिंग मोड, तथा QA चेकलिस्ट──

## अभ्यास

1. **Easy.**`code/main.py`मध्य,把被面具的维度比例从0.2 变到0.8──在哪个比例下,涂料质量(面具维度中的残留) बिना शर्त पीढ़ी के बराबर है?
2. **Medium.**实现RePaint: प्रत्येक तक 10 个 逆步,跳回 5 步(加噪)并重新指责──测量它是否降低面具 边缘的边界残留──
3. **Hard.**प्रयोग Hugging Face diffusers तुलना करें:SD 1.5 Inpaint + ControlNet-Openpose 与 Flux.1-Fill,在 20 个脸再生任务上测试──分别评分 Pose adhesion 和身份保存──

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| Inpainting | “填洞” | 在 mask 内重新生成；保留外部像素。 |
| Outpainting | “扩展画布” | 在画布外重新生成；保留内部。 |
| 9-channel U-Net | “正确的 inpainting model” | 输入为 `noisy \| encoded-source \| mask` 的 U-Net。 |
| SDEdit | “带 noise level 的 img2img” | 加噪到时间 `t`，用新 prompt denoise。 |
| InstructPix2Pix | “纯文本编辑” | 在 (image, instruction, output) 三元组上 fine-tuned 的 diffusion。 |
| RePaint | “无需重新训练” | 在 reverse 过程中周期性 re-noise，以减少 seams。 |
| SAM | “Segment Anything” | 通过点击或框生成 mask；与 inpaint 配合使用。 |
| Flux-Kontext | “带上下文编辑” | 接收 reference image + instruction 进行编辑的 Flux 变体。 |

## 生产提示: देरी के प्रति संवेदनशील पाइपलाइन संपादित करें

उपयोगकर्ता संपादन छवि समय, अपेक्षाएँ वापस लौटना 5 सेकेण्ड से कम है। L4 पर 10242 के 30 चरण SDXL-Inpaint  जरूरत है 3-4 सेकंड, फिर से SAM मास्क पीढ़ी पर जोड़ें(लगभग 200 ms) और VAE एन्कोड/डेकोड(लगभग 500 ms) 

- **SAM-H 是慢的那个。**10242 下 SAM-H 约200ms;SAM-ViT-B 约40ms,质量损失很小──SAM 2(video) will increase time dimension开销; इसे एकल图编辑 हेतु मत लगाओ──
- **能跳过 encode 就跳过。** `pipe.image_processor.preprocess(img)`代式编辑 UI 中很常见), सीधे माध्यम से `latents=...`传入,跳过一次 VAE कोड
- **Mask dilation 也影响吞吐。**छोटा मास्क मतलब यू-नेट फॉरवर्ड पास का अधिकांश गणना बर्बाद हो गई है`diffusers``StableDiffusionInpaintPipeline`无论如何都会运行完整的U-Net; केवल 9 चैनल का सही इनपेंट 变体能利用掩盖计算──
- **Flux-Kontext 是 2025 年的答案。**`(source_image, instruction)`एक बार आगे की ओर जाने का तरीकाः कोई अलग मास्क नहीं, कोई एसडीईटी शोर स्वीप नहीं।

## 延伸阅读

- [Lugmayr et al. (2022). RePaint: Inpainting using Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2201.09865) 无需训练的涂料──
- [Meng et al. (2022). SDEdit: Guided Image Synthesis and Editing with Stochastic Differential Equations](https://arxiv.org/abs/2108.01073) SDEdit。
- [Brooks, Holynski, Efros (2023). InstructPix2Pix](https://arxiv.org/abs/2211.09800) 文本指令编辑──
- [Kirillov et al. (2023). Segment Anything](https://arxiv.org/abs/2304.02643) SAM, मुखौटा स्रोत
- [Ravi et al. (2024). SAM 2: Segment Anything in Images and Videos](https://arxiv.org/abs/2408.00714) वीडियो SAM。
- [Hertz et al. (2022). Prompt-to-Prompt Image Editing with Cross-Attention Control](https://arxiv.org/abs/2208.01626) ध्यान 层级编辑──
- [Black Forest Labs (2024). Flux.1-Fill and Flux.1-Kontext](https://blackforestlabs.ai/flux-1-tools/) 2024 उपकरण
