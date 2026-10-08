# 3 डी पीढ़ी

> 3D 2D-to-3D 借力 सबसे मजबूत मोडलिटी है। 2023 का नया चरण 3D गैसियन स्प्लैटिंग है। 2024-2026 के वर्षों में निर्माण के प्रकार को आगे बढ़ाया गया है, जिसमें मल्टी-व्यू डिफ्यूजन + 3D पुनर्निर्माण, एकल प्रॉम्प्ट या फोटो से वस्तुओं और दृश्यों का उत्पादन किया गया है।

**Type:** Learn
**Languages:** Python
**先修要求:**चरण 4 (दृष्टि), चरण 8 · 07 (लैटिनेंट विसारण)
**Time:** ~45 minutes

## 问题

3D  सामग्री मुश्किल से संसाधित किया जाता हैः

- **表示。**जाल, बिंदु बादल, वॉक्सल ग्रिड, हस्ताक्षरित दूरी क्षेत्र (एसडीएफ) न्यूरल रेडिएंस क्षेत्र (एनईआरएफ) 3 डी गौसीयनों प्रत्येक प्रकार के लिए एक विकल्प है।
- **数据稀缺。**ImageNet में 14M 张图像──最大的干净 3D 数据集(Objaverse-XL, 2023) में लगभग 10M 个物体, जिनमें से अधिकांश की गुणवत्ता कम है──
- **内存。**एक 5123 वॉक्सल ग्रिड में 128M वॉक्सल हैं; एक उपलब्ध परिदृश्य NeRF 需要1M नमूने/रे──生成比重建更难──
- **监督。** 2D 图像 के लिए, आपके पास पिक्सेल हैं  3D के लिए, आप आमतौर पर केवल 2D दृश्यों की एक छोटी मात्रा है, और 3D तक उठाना होगा 

2026 साल का स्टैक इन दो समस्याओं को अलग-अलग करें। पहला कदम, Diffusion मॉडल का उपयोग करके *2D मल्टी-व्यू छवियों***** का उत्पादन करें। दूसरा कदम, इन छवियों को एक *3D प्रतिनिधित्व*** के रूप में संश्लेषित करने के लिए तैयार करें।

## 概念

![3D generation: multi-view diffusion + 3D reconstruction](../assets/3d-generation.svg)

### ३ डी गौशियन स्प्लैटिंग (केर्बल एट अल., २०२३)

इसे 1M 个 3D Gaussians 组成的云── प्रत्येक में 59 个参数:स्थिति (3) ‧covariance (6, या क्वाटरनियन 4 + पैमाने 3) ‧opacity (1) ‧spherical-harmonics color(डिग्री 3 时为 48,डिग्री 0 时为 3) ‖

रेन्डरिंग = प्रोजेक्शन + अल्फा-कंपोजिटिंग──快(4090 上 1080p 约 100 fps)──可微──通过 ग्रेडिएंट डाउनसेन्ट ग्राउंड-सचई तस्वीरों के लिए 拟合──一个场景可在消费级 GPU上使用 5-30分完成拟合──

इसके दो 2023-2024 创新:
- **Generative Gaussian splats。**LGM、LRM、InstantMesh आदि मॉडल सीधे एक या कई चित्रों से अनुमानित गौसीन बादल
- **4D Gaussian Splatting。**带有 प्रति फ्रेम ऑफसेट्स के गौसी, इस्तेमाल किया जाता है动态场景──

### बहुदृश्य प्रसार

एक पूर्व-प्रशिक्षित छवि विसारण मॉडल, जिससे यह पाठ शीघ्र या एक ही张图像 से एक ही वस्तु के अनेक一致视角 उत्पन्न कर सके। शून्य123 (लिउ एट अल., 2023) ✓ एमवीडीड्रीम (शि एट अल., 2023) ✓ एसवी3डी (स्थिरता, 2024) ✓ CAT3D (गूगल, 2024) ✓ आमतौर पर वस्तु के चारों ओर 4-16 ✓ दृश्यों का उत्पादन करता है, फिर से गैसियन स्प्लैटिंग या नेआरएफ लिफ्टिंग के माध्यम से 3D तक ✓

### पाठ-से-3डी पाइपलाइन

| Model | Input | Output | Time |
|-------|-------|--------|------|
| DreamFusion (2022) | text | NeRF via SDS | 每个 asset ~1 小时 |
| Magic3D | text | mesh + texture | ~40 分钟 |
| Shap-E (OpenAI, 2023) | text | implicit 3D | ~1 分钟 |
| SJC / ProlificDreamer | text | NeRF / mesh | ~30 分钟 |
| LRM (Meta, 2023) | image | triplane | ~5 秒 |
| InstantMesh (2024) | image | mesh | ~10 秒 |
| SV3D (Stability, 2024) | image | novel views | ~2 分钟 |
| CAT3D (Google, 2024) | 1-64 images | 3D NeRF | ~1 分钟 |
| TripoSR (2024) | image | mesh | ~1 秒 |
| Meshy 4 (2025) | text + image | PBR mesh | ~30 秒 |
| Rodin Gen-1.5 (2025) | text + image | PBR mesh | ~60 秒 |
| Tencent Hunyuan3D 2.0 (2025) | image | mesh | ~30 秒 |

2025-2026 方向: अनुकूलन खेल इंजनों के 、带 PBR सामग्री के प्रत्यक्ष पाठ-से-मेश मॉडल── आम वस्तुओं के लिए, मल्टी-व्यू फैलाव मध्य间步骤 अभी भी प्रदर्शन का सबसे अच्छा ढांचा है──

### NeRF(背景)

न्यूरल रेडिएंस फील्ड (मिलडेनहॉल एट अल, 2020) ◊ एक छोटा MLP 接收 `(x, y, z, view direction)`और आउटपुट `(color, density)`◊ रेस के साथ 积分 का प्रदर्शन किया जाता है। ◊ गुणवत्ता मेष आधारित उपन्यास-दृश्य संश्लेषण से बेहतर है, लेकिन  गति धीमी 100-1000  गुना है।


```figure
v4-3d-multiview
```

##  इसे निर्माण

`code/main.py`实现一个玩具版 2D गॉसियन स्प्लैटिंग 拟合:把一个合成目标图像(平滑梯度) का प्रतिनिधित्व करता है 2D गॉसियन स्प्लैट्स के和──通过 ग्रेडिएंट अवतरण 优化位置、颜色和覆盖性,以匹配目标──你会看到两个核心操作:前进 render(splat + अल्फा-复合) 和通过 ग्रेडिएंट अवतरण 拟合──

### 步骤 1: 2D गौशियन स्प्लैट

```python
def gaussian_at(x, y, gaussian):
    px, py = gaussian["pos"]
    sigma = gaussian["sigma"]
    d2 = (x - px) ** 2 + (y - py) ** 2
    return math.exp(-d2 / (2 * sigma * sigma))
```

### 步骤 2: 累加点 染

```python
def render(image_size, gaussians):
    img = [[0.0] * image_size for _ in range(image_size)]
    for g in gaussians:
        for y in range(image_size):
            for x in range(image_size):
                img[y][x] += g["color"] * gaussian_at(x, y, g)
    return img
```

वास्तविक 3 डी गौसीयन स्प्लैटिंग 会按深度对高西人 排序,并按顺序 अल्फा-संयोजन──

### 步骤 3: ग्रेडिएंट निशाना 拟合

```python
for step in range(steps):
    pred = render(size, gaussians)
    loss = mse(pred, target)
    gradients = compute_grads(pred, target, gaussians)
    update(gaussians, gradients, lr)
```

## 陷

- **View inconsistency。**यदि आप स्वतंत्र रूप से 4 दृश्य उत्पन्न करते हैं, तो वे वस्तु संरचना के लिए असंगत हैं,3D 拟合会变模糊──修复: उपयोग के साथ साझा ध्यान के बहु-दृश्य प्रसार──
- **Back-side hallucination。**单图像 → 3D 必须想象看不见的一侧――质量差异极大――
- **Gaussian splat explosion。**无约束训练会增长到10M प्लेस并过拟合──Densification + pruning heuristics(来自3D-GS 原论文) 是必要的──
- **Topology issues。**अप्रत्यक्ष क्षेत्र (एसडीएफ) के जाल में आमतौर पर छेद या स्वयं-संकेतन होते हैं।
- **训练数据许可。**Objaverse का लाइसेंस 混杂; वाणिज्यिक उपयोग因模型而异──

## इसका उपयोग करें

| Task | 2026 pick |
|------|-----------|
| 从照片进行场景重建 | Gaussian splatting (3DGS, Gsplat, Scaniverse) |
| 面向游戏的 Text-to-3D object | Meshy 4 or Rodin Gen-1.5 (PBR output) |
| Image-to-3D | Hunyuan3D 2.0, TripoSR, InstantMesh |
| 从少量图像进行 Novel-view synthesis | CAT3D, SV3D |
| 动态场景重建 | 4D Gaussian Splatting |
| Avatar / clothed human | Gaussian Avatar, HUGS |
| Research / SOTA | 上周刚发布的任何东西 |

对于在游戏或电子商务管道中发布生产级3D:Meshy 4或Rodin Gen-1.5 输出可直接进入Unity / Unreal के पीबीआर जालों में

## 交付 यह

保存 `outputs/skill-3d-pipeline.md`◊Skill 接收一个3D简介(इनपुटः पाठ / एक छवि / कुछ छवियां; आउटपुट: जाल / स्प्लैट / NeRF;उपयोगः रेंडर / गेम / वीआर),并输出: पाइपलाइन(बहु-दृश्य विसारण + फिट, या प्रत्यक्ष जाल मॉडल)

## अभ्यास

1. **Easy。**4 16 64 गौसी 运行 `code/main.py` रिपोर्ट फाइनल एमएसई बनाम लक्ष्य
2. **Medium。**扩展为 रंग गौशियन (RGB) 确认重建匹配 लक्ष्य रंग पैटर्न
3. **Hard。**प्रयोग gsplat अथवा Nerfstudio, से 50 फोटो कैप्चर 重建真实物体── रिपोर्ट फिट टाइम 和 होल्ड-आउट व्यू 上的最终 SSIM──

## 关键术语
| Term | 人们怎么说 | 它实际意味着什么 |
|------|------------|------------------|
| 3D Gaussian Splatting | "3DGS" | 把场景作为 3D Gaussians 的 cloud；可微的 alpha-composite render。 |
| NeRF | "Neural radiance field" | 在 3D point 输出 color + density 的 MLP；通过 ray integration render。 |
| Triplane | "Three 2-D planes" | 把 3D 分解成三个 2-D axis-aligned feature grids；比 volumetric 更便宜。 |
| SDS | "Score distillation sampling" | 使用 2D-diffusion score 作为 pseudo-Gradient 来训练 3D model。 |
| Multi-view diffusion | "Many views at once" | 输出一批一致 camera views 的 Diffusion model。 |
| PBR | "Physically-based rendering" | 具有 albedo、roughness、metallic、normal channels 的 material。 |
| Densification | "Grow splats" | 3DGS 训练 heuristic：在高 Gradient 区域 split / clone splats。 |

## 生产备注:3डी अभी तक कोई साझा सब्सट्रेट नहीं है

]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]>

- **NeRF / triplane。**इन्फेरेंस है रे-मार्चिंग + प्रत्येक नमूना एक बार एमएलपी आगे ∙ एक बार 5122 render 需要数百万次 MLP आगे ∙ सकारात्मक बैच रे नमूने;SDPA/xformers 适用──
- **Multi-view diffusion + LRM reconstruction。**两阶段管道── स्टेज 1(बहु-दृश्य DiT) 是和 Lesson 07 一样 Diffusion server── स्टेज 2(LRM ट्रांसफार्मर) 是对视图的一次性前进通过──整体延迟配置是diffusion + one-shot,因此按阶段选择服务原始的──
- **SDS / DreamFusion。**प्रति-संपत्ति अनुकूलन, निष्कर्ष नहीं है, नौकरियों का निर्माण, बल्कि अनुरोध प्रबन्धक हैं।

 अधिकांश 2026  उत्पादों के लिए, सही उत्तर है  अनुरोध पर बहु-दृश्य विसारण मॉडल चलाने, 3DGS तक पुनर्निर्माण के लिए,并服务 3DGS वास्तविक समय देखने के लिए उपयोग किया जाता है── यह काम का भार 清晰分分分到 GPU-इन्फरेंस सर्वर(快) और ऑफ़लाइन अनुकूलक(慢) के बीच में होगा──

## 延伸阅读
- [Mildenhall et al. (2020). NeRF: Representing Scenes as Neural Radiance Fields](https://arxiv.org/abs/2003.08934) NeRF。
- [Kerbl et al. (2023). 3D Gaussian Splatting for Real-Time Radiance Field Rendering](https://arxiv.org/abs/2308.04079) 3DGS。
- [Poole et al. (2022). DreamFusion: Text-to-3D using 2D Diffusion](https://arxiv.org/abs/2209.14988) एसडीएस。
- [Liu et al. (2023). Zero-1-to-3: Zero-shot One Image to 3D Object](https://arxiv.org/abs/2303.11328) शून्य123。
- [Shi et al. (2023). MVDream](https://arxiv.org/abs/2308.16512) बहु-दृश्य प्रसारण。
- [Hong et al. (2023). LRM: Large Reconstruction Model for Single Image to 3D](https://arxiv.org/abs/2311.04400) LRM。
- [Gao et al. (2024). CAT3D: Create Anything in 3D with Multi-View Diffusion Models](https://arxiv.org/abs/2405.10314) CAT3D──
- [Stability AI (2024). Stable Video 3D (SV3D)](https://stability.ai/research/sv3d) SV3D──
