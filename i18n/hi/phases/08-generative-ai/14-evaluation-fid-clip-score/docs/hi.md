# 评估  FID、CLIP स्कोर、 मानवीय प्राथमिकता

> प्रत्येक उत्पन्न मॉडल रैंकिंग में एफआईडी, क्लिप स्कोर, साथ ही मानव-प्राधान्य वाले खेल के मैदान से जीत दर का उल्लेख किया गया है। प्रत्येक संख्या में एक प्रकार का विफलता मॉडल होता है जिसका उपयोग वैज्ञानिकों द्वारा किया जाता है। यदि आप इन विफलता मॉडल को नहीं समझते हैं, तो आप वास्तविक सुधार और सफलता को अलग नहीं कर सकते हैं।

**类型:**निर्माण
**语言:**पायथन
**先修:**चरण 8 · 01 (करगणित), चरण 2 · 04 (मूल्यांकन माप)
**时间:**~ 45 मिनट

## 问题

उत्पन्न मॉडल आमतौर पर * नमूना गुणवत्ता* और * शर्त अनुपालन* के आधार पर मूल्यांकन करते हैं। दोनों में कोई समापन माप नहीं है। आपके मॉडल को 10,000 छवियों का रंग देना चाहिए; उन्हें कुछ अलग करना चाहिए; आपको यह भी मानना चाहिए कि ये संख्याएं मॉडल परिवार के पार, पार-रिज़ॉल्यूशन, पार-संरचना के निर्माण में सक्षम हैंः

- **FID (Fréchet Inception Distance)。**आरंभिक नेटवर्क के लक्षण अंतरिक्ष में, वास्तविक वितरण और उत्पन्न वितरण के बीच की दूरी 越低越好
- **CLIP score。**生成图像的 CLIP-image एम्बेडिंग和快速的 CLIP-text एम्बेडिंग 之间共数相似性──越高越好──衡量快速 遵循度──
- **人类偏好。**एक ही समय में ऊपर दो मॉडल सही सामना करने के लिए, चलो मानव (या GPT-4 级模型) एक बेहतर चुनें, पुनः इलो स्कोर को फिर से इकट्ठा करें।

आप यह भी देखेंगेः IS(प्रारंभिक स्कोर, अनिवार्य रूप से समाप्त हो गया है) ✓ KID、CMMD、ImageReward、PickScore、HPSv2、MJHQ-30k── प्रत्येक ने पहले के एक संकेत के किसी न किसी त्रुटि बिंदु को संशोधित किया है──

## 概念

![FID, CLIP, and preference: three axes, different failure modes](../assets/evaluation.svg)

### FID  样本质量

Heusel et al. (2017)。步骤:

1. 为 N 张真实图像和 N 张生成图像提取 प्रारंभ-v3 विशेषताएं (2048-D)
2. प्रत्येक इंच के लिए एक गौशियन: गणना औसत`μ_r, μ_g`और सह-विवर्तन `Σ_r, Σ_g`
3. FID = `||μ_r - μ_g||² + Tr(Σ_r + Σ_g - 2 · (Σ_r · Σ_g)^0.5)`

解释: विशेषता अंतरिक्ष में दो多变量 गौशियन  के बीच फ्रेचेट दूरी──越低 = 分布越相似──

失效模式:
- **小 N 时有偏。**FID = विशेषता वितरण के लिए औसत-वर्ग 计算,小 N 会低估共差,给出虚假的低 FID──始终使用 N ≥ 10,000──
- **依赖 Inception。**प्रारंभ-v3  प्रशिक्षण में ImageNet── दूर से ImageNet के क्षेत्र में ([[人脸、艺术、文字图像) उत्पन्न होगा अर्थहीन FID── उपयोग विशिष्ट क्षेत्र में सुविधाओं निष्कर्षक──
- **刷分。**过拟 启动前可在没有视觉质量提升的情况下得到低FID── CMMD见下文) 来对抗它──

### CLIP स्कोर  शीघ्र  अनुसरण度

Radford et al. (2021)──对于一张生成图像 + prompt:

```
clip_score = cos_sim( CLIP_image(x_gen), CLIP_text(prompt) )
```

30k 张 उत्पन्न छवि औसत →  प्राप्त करने के लिए एक मॉडल के बीच तुलना योग्य मात्रा

失效模式:
- **CLIP 自身的盲点。**CLIP का组合推理较弱("एक नीली गोले पर एक लाल घन" 经常失败) ――模型可以在 CLIP स्कोर上排名很好,但并没有真正遵循复杂提示──
- **短 prompt 偏差。**短 prompt 在野外有更多 CLIP-image 匹配──长 prompt का CLIP स्कोर 会机械性降低──
- **prompt 刷分。**"उच्च गुणवत्ता, 4K, उत्कृष्ट कृति" में शामिल होने के तुरंत बाद, CLIP स्कोर बढ़ेगा, लेकिन चित्रण में सुधार नहीं करेगा।

CMMD (Jayasumana et al., 2024) ने इनमें से कुछ समस्याओं को ठीक कियाः शुरुआत के बजाय CLIP सुविधाओं का उपयोग करना, अधिकतम-औसत विसंगति का उपयोग करना, बल्कि फ्रेचेट नहीं करना।

###  मूल सत्य

选择一组 prompt──用模型 A 和模型 B 生成──把成对结果展示给人类 (或强 LLM judge)──将胜负聚合成 Elo 或布拉德利-तेरी स्कोर── बेंचमार्क:

- **PartiPrompts (Google)**:1,600 个多样化 शीघ्र,12 个类别──
- **HPSv2**:107k 个人类标注, व्यापक रूप से इस्तेमाल किया जाता है
- **ImageReward**37k 个快速图像 偏好对,MIT-licensed──
- **PickScore**: पिक-ए-पिक 2.6M वरीयताओं पर आधारित  प्रशिक्षण
- **Chatbot-Arena-style image arenas**:https://imagearena.ai/और अन्य प्लेटफार्मों

失效模式:
- **judge 方差。**गैर-विशेषज्ञ और विशेषज्ञों की प्राथमिकताएं भिन्न होती हैं।
- **prompt 分布。**精挑细选的快速会偏向某一家──始终记录清楚──
- **LLM-judge reward hacking。**जीपीटी-4-जज को भव्य रूप से देखा जाएगा लेकिन गलत तरीके से धोखा दिया गया है।

## 组合使用

उत्पादन स्तर मूल्यांकन रिपोर्ट 应包含:

1. 10-30k 个样本上,针对持久的计算 FID (样本质量)
2. उसी बैच में नमूने और उसके शीघ्र ऊपर गणना CLIP स्कोर / CMMD( अनुवर्ती)
3. ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️
4. 失效模式分析:随机抽取 50 输出,标记已知问题(手部结构、文字染、对象数量一致性)

任何单一指标都是谎言──三互印证的指标 + 定性评审 才是主张──


```figure
gx-fid-distributions
```

## 动手构建

`code/main.py`संश्लेषित में "विशेषता वेक्टर" पर FID 类 CLIP-स्कोर 和 Elo 聚合 (आप देखेंगेः

- 小 N 和 大 N 上的 FID 计算, यानि偏差──
- 池 के बीच कॉसिन समानता को "CLIP स्कोर" के रूप में विशेषता 池
- से synthesis preferences प्रवाह के Elo अद्यतन नियम

### 步骤 1: FID को प्राप्त करने के लिए चार

```python
def fid(real_features, gen_features):
    mu_r, cov_r = mean_and_cov(real_features)
    mu_g, cov_g = mean_and_cov(gen_features)
    mean_diff = sum((a - b) ** 2 for a, b in zip(mu_r, mu_g))
    trace_term = trace(cov_r) + trace(cov_g) - 2 * sqrt_cov_product(cov_r, cov_g)
    return mean_diff + trace_term
```

### 步骤 2: CLIP 风格 के कॉसिन-समानता

```python
def clip_like(image_feat, text_feat):
    dot = sum(a * b for a, b in zip(image_feat, text_feat))
    norm = math.sqrt(dot_self(image_feat) * dot_self(text_feat))
    return dot / max(norm, 1e-8)
```

### 步骤 3: एलो 聚合

```python
def elo_update(r_a, r_b, winner, k=32):
    expected_a = 1 / (1 + 10 ** ((r_b - r_a) / 400))
    actual_a = 1.0 if winner == "a" else 0.0
    r_a_new = r_a + k * (actual_a - expected_a)
    r_b_new = r_b - k * (actual_a - expected_a)
    return r_a_new, r_b_new
```

## 常见陷

- **N=1000 时的 FID。**N=10k निम्न, यह प्रारंभ अपरिहार्य है।
- **跨分辨率比较 FID。**प्रारंभ की 299×299 आकार बदलने में परिवर्तन होगा विशेषता वितरण 
- **只报告一个 seed。**कम से कम तीन बीज का संचालन करें।
- **通过 negative prompts 抬高 CLIP score。**कुछ पाइपलाइनों को अनुपालन के लिए शीघ्रता से किया जाएगा।
- **prompt 重叠导致 Elo 偏差。**यदि दो मॉडल प्रशिक्षण में सभी ने बेंचमार्क प्रॉम्प्ट देखा हो तो इसका कोई मतलब नहीं है।
- **人类 eval 的付费众包偏斜。**प्रजननशील mTurk 标注者偏年轻 / 技术友好──与招募的艺术/设计专家混合使用──

## इसका उपयोग करें

2026 के उत्पादन मूल्यांकन प्रोटोकॉलः

| 支柱 | 最低要求 | 推荐 |
|--------|---------|-------------|
| 样本质量 | 10k 上相对 held-out real 计算 FID | + 5k 上 CMMD + 按类别子集计算 FID |
| prompt 遵循度 | 30k 上计算 CLIP score | + HPSv2 + ImageReward + VQA-style question answering |
| 偏好 | 200 个相对 baseline 的盲测成对样本 | + 2000 paired human + LLM-judge + Chatbot Arena |
| 失效分析 | 50 个手动标记 | 500 个手动标记 + automated safety classifier |

चार स्तंभों में एक ही रिपोर्ट = 主张──任何单独一个 = 营销──

## 交付

保存 `outputs/skill-eval-report.md`◊ कौशल नए मॉडल चेकपॉइंट + बेसलाइन प्राप्त करना,并输出完整 eval plan:样本量、指标、失效模式探针、签核标准──

## अभ्यास

1. **Easy.**运行 `code/main.py` समान संश्लेषित वितरण पर N=100 के साथ N=1000 के दौरान FID  की तुलना में 
2. **Medium.** सिंथेटिक CLIP-शैली की सुविधाओं पर आधारित  CMMD को लागू करना 公式见 Jayasumana et al., 2024)  इसे गुणवत्ता अंतर की संवेदनशीलता से FID से तुलना करें
3. **Hard.**复现 HPSv2 设置: Pick-a-Pic के एक子集中取 1000 个图像-prompt जोड़े, पर आधारित प्राथमिकता ठीक-ट्यून एक छोटे से CLIP आधारित स्कोरर,并测量它与持久的集合的一致性──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| FID | "Fréchet Inception Distance" | 对真实与生成 Inception features 拟合 Gaussian 后的 Fréchet distance。 |
| CLIP score | "Text-image similarity" | CLIP image 与 text Embeddings 之间的 cosine similarity。 |
| CMMD | "FID's replacement" | CLIP-feature MMD；偏差更小，无 Gaussian assumption。 |
| IS | "Inception score" | Exp KL(p(y|x) || p(y))；在现代模型上相关性差，已退役。 |
| HPSv2 / ImageReward / PickScore | "Learned preference proxies" | 在人类偏好上训练的小模型；用作自动 judge。 |
| Elo | "Chess rating" | 成对胜负的 Bradley-Terry 聚合。 |
| PartiPrompts | "The benchmark prompt set" | Google 策划的 1,600 个 prompt，覆盖 12 个类别。 |
| FD-DINO | "Self-sup replacement" | 使用 DINOv2 features 的 FD；更适合 ImageNet 之外的领域。 |

## 生产注记:मूल्यांकन व यह भी निष्कर्ष कार्यभार

10k नमूना पर चलाने FID का अर्थ है 10k 张图像的生成. एकल张 L4 上 10242 के लिए 50 चरण SDXL आधार के लिए, यह लगभग 11 घंटे का एकल अनुरोध निष्कर्ष है। मूल्यांकन बजट वास्तविक है, और यह ढांचा वास्तव में ऑफ़लाइन-इन्फरेंस 场景 है।

- **尽力 batch，忘掉 latency。**ऑफ़लाइन eval = 80GB H100 上使用 `num_images_per_prompt=8`调用 `pipe(...).images`, दीवार घड़ी से अधिक एकल अनुरोध 快 4-6 × 
- **缓存真实 features。**वास्तविक संदर्भ集执行的 Inception (FID) या CLIP (CLIP-score, CMMD) सुविधा निष्कर्षण केवल运行*一次*,并存储为`.npz`️ हर बार मूल्यांकन न करें 

对于CI / प्रत्यावर्तन गेट: प्रत्येक PR 在 500-样本 子集上运行 FID + CLIP स्कोर(~30 मिनट); प्रति रात्रि运行完整 10k FID + HPSv2 + Elo。

## 延伸阅读

- [Heusel et al. (2017). GANs Trained by a Two Time-Scale Update Rule Converge to a Local Nash Equilibrium (FID)](https://arxiv.org/abs/1706.08500) FID 论文──
- [Jayasumana et al. (2024). Rethinking FID: Towards a Better Evaluation Metric for Image Generation (CMMD)](https://arxiv.org/abs/2401.09603) CMMD。
- [Radford et al. (2021). Learning Transferable Visual Models from Natural Language Supervision (CLIP)](https://arxiv.org/abs/2103.00020) क्लिप。
- [Wu et al. (2023). HPSv2: A Comprehensive Human Preference Score](https://arxiv.org/abs/2306.09341) HPSv2──
- [Xu et al. (2023). ImageReward: Learning and Evaluating Human Preferences for Text-to-Image Generation](https://arxiv.org/abs/2304.05977) इमेज रिवार्ड。
- [Yu et al. (2023). Scaling Autoregressive Models for Content-Rich Text-to-Image Generation (Parti + PartiPrompts)](https://arxiv.org/abs/2206.10789) पार्टिप्रॉम्प्ट्स。
- [Stein et al. (2023). Exposing flaws of generative model evaluation metrics](https://arxiv.org/abs/2306.04675) विफलता मोड सर्वेक्षण。
