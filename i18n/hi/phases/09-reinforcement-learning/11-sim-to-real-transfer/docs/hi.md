# सिम-टू-रियल ट्रांसफर

> एक सिमुलेटर में प्रशिक्षण  लेकिन हार्डवेयर पर असफल नीति, मूल रूप से सिम्युलेटर को याद किया गया है  डोमेन रैंडमटाइजेशन  डोमेन अनुकूलन और सिस्टम पहचान,  सीखने नियंत्रकों  वास्तविकता के अंतर के तीन प्रकार के उपकरण 

**Type:** 学习
**Languages:** Python
**Prerequisites:** Phase 9 · 08 (PPO), Phase 2 · 10 (Bias/Variance)
**Time:** ~45 分钟

## 问题

 प्रशिक्षण वास्तविक रोबोट 很慢、危险且昂贵── एक बाइपेड 需要数百万训练集 才能学会走走;而真实 बाइपेड 哪怕摔倒一次,也可能损坏硬件──模拟 给你无限重设、确定性可复现、并行环境,并且不会造成物理损坏──

लेकिन सिम्युलेटर गलत हैं। कैमरे में लेंस विकृति है, जबकि सिम्युलेटर में नहीं है। मोटर में देरी है, बैकलैश और संतृप्ति, जबकि 99% सिम मॉडल इन पर कूदते हैं।**reality gap**, अर्थात् सिम वितरण और वास्तविक वितरण के बीच प्रणालीगत अंतर, रोबोटिक्स में तैनात आरएल का मूल प्रश्न है।

आपको *सिम-टू-रियल डिस्ट्रीब्यूशन शिफ्ट* के लिए एक मजबूत यौन नीति की आवश्यकता है।

## 概念

![Three sim-to-real regimes: domain randomization, adaptation, system identification](../assets/sim-to-real.svg)

**Domain Randomization (DR)。**2017,Peng et al. 2018── प्रशिक्षण के दौरान, प्रत्येक संभावित वास्तविक रोबोट पर विभिन्न सिम पैरामीटरों को यादृच्छिक बनाएंः मास, घर्षण गुणांक, मोटर पीडी लाभ, सेंसर शोर, कैमरा स्थिति, प्रकाश व्यवस्था, बनावट, संपर्क मॉडल── नीति सीखना एक बारे में आज किस सिम में स्थित है  के स्थितियों का वितरण, और पूरे दायरे में पानाकारिण करना── यदि वास्तविक रोबोट 落在训练包内, नीति 就能工作──

- **优点：**वास्तविक डेटा की आवश्यकता नहीं है।
- **缺点：** अत्यधिक यादृच्छिकता का अभ्यास एक सार्वभौमिकपर अति सावधानीपूर्वक नीति उत्पन्न करेगा बहुत अधिक शोर ≈  बहुत अधिक नियमितता

**System Identification (SI)。**प्रशिक्षण से पहले, वास्तविक दुनिया के डेटा का उपयोग करें 拟合模拟器的参数── यदि आप वास्तविक रोबोट पर हाथ-संयोजन घर्षण को माप सकते हैं, तो इसे सिम में भर दें── तब एक पूर्वानुमानित इन मूल्यों की नीति को प्रशिक्षित करें── इसे वास्तविक प्रणाली का उपयोग करने की आवश्यकता होती है, लेकिन वास्तविकता के अंतर को सीधे कम कर सकता है──

- **优点：**精确、低噪音 प्रशिक्षण लक्ष्य
- **缺点：**शेष मॉडल त्रुटि नीति के लिए अपरिहार्य; छोटे अज्ञात प्रभाव (जैसे मोटर मृत बैंड) अभी भी तैनाती को नुकसान पहुंचाएगा।

**Domain Adaptation。**में sim 中 प्रशिक्षण, पुनः उपयोग करें कम वास्तविक डेटा ठीक-ट्यूनिंग── दो प्रकार के रूपः

- **Real2Sim2Real：**असली रोलआउट का उपयोग करें एक अवशिष्ट सिम्युलेटर सीखना `f(s, a, z) - f_sim(s, a)`, फिर से संशोधित के बाद के सिम में प्रशिक्षण. . . बहुत अधिक वास्तविक डेटा की आवश्यकता नहीं है ताकि अंतर को छोटा किया जा सके.
- **Observation adaptation：**训练一个政策, सीखना सुविधाओं निकालने के माध्यम से (उदाहरण के लिए GAN पिक्सेल-टू-पिक्सेल) होगा वास्तविक obs → सिम-जैसा obs──नियंत्रक 仍然停留在sim中──

**Privileged learning / teacher-student。**Miki et al. 2022 ((वर्षीय चतुर्भुज) ◊ प्रशिक्षण में प्रशिक्षण एक सक्षम पहुँच योग्य सुविधाजनक जानकारी ((भूमि सत्य घर्षण、भूमि ऊंचाई、IMU बहाव) के *शिक्षक*♦ पुनः डिस्टिल एक एकल वास्तविक-सेन्सर अवलोकनों को देखने के *छात्र*♦छात्र 学会 से इतिहास का अनुमान लगाने के लिए विशेषाधिकार विशेषताएं, और भौतिक मापदंडों 变化下保持强──

**Massively parallel simulation。**20242026──Isaac Lab、Mujoco MJX、Brax एक GPU पर हजारों समानांतर रोबोटों को चलाने में सक्षम है──PPO  4,096 समानांतर मानवॉइड्स के साथ, कुछ ही घंटों में कई वर्षों का अनुभव एकत्र किया जा सकता है── प्रशिक्षण वितरण 变宽, 现实差 缩小; जब इन 4,096  envs में से प्रत्येक में अलग-अलग यादृच्छिक पैरामीटर होते हैं 时,DR 几乎是免费的──

**2026 年真实世界配方（quadruped walking 示例）：**

1. बड़े पैमाने पर समानांतर सिम का उपयोग करें, गुरुत्वाकर्षण, घर्षण, मोटर लाभ, पेलोड, डोमेन यादृच्छिककरण
2. प्रयोग विशेषाधिकार प्राप्त जानकारी ((भूमि नक्शा、शरीर की गति जमीन सत्य) प्रशिक्षण शिक्षक नीति。
3. केवल प्रयोग करें proprioception (पैर जोड़ों को कोड करने वाले) शिक्षक से छात्र नीति को डिस्टिल करें
4. 可选: वास्तविक IMU 上的 ऑटोकोडर के माध्यम से निरीक्षण अनुकूलन करें
5. 10+ वातावरण में तैनात करें ऊपर शून्य-शॉट करें यदि विफल हो जाए, तो सुरक्षा-प्रतिबंधित पीपीओ का उपयोग करें कुछ मिनट वास्तविक दुनिया में ठीक-ठीक ट्यूनिंग करें।


```figure
f3-reality-gap
```

##  इसे निर्माण

इस कोर्स कोड एक बहुत ही छोटे डोमेन यादृच्छिकता  प्रदर्शन, परिदृश्य है के साथ * शोर * संक्रमण के ग्रिडवर्ल्ड. . . हम प्रशिक्षण एक नीति, इसे sim में यादृच्छिक स्लिप संभावनाओं का अनुभव करने, और real में एक प्रशिक्षण के साथ कभी नहीं देखा स्लिप स्तर का मूल्यांकन करने के लिए प्रयोग करते हैं. . . इस रूप को सीधे MuJoCo-to-हार्डवेयर हस्तांतरण में मैगरेट किया जा सकता है.

### 步骤 1: पैरामीटरित सिम

```python
def step(state, action, slip):
    if rng.random() < slip:
        action = random_perpendicular(action)
    ...
```

`slip`वास्तविक रोबोटिक्स में, यह घर्षण, द्रव्यमान, मोटर लाभ हो सकता है, या यह किसी भी चीज़ का हो सकता है जो सिम और वास्तविक के बीच होने वाली बदलावों में हो।

### 步骤 2: DR प्रयोग 训练

प्रत्येक एपिसोड में  शुरू करते समय, `slip ~ Uniform[0.0, 0.4]` प्रशिक्षण पीपीओ / क्यू-लर्निंग / 任意方法──重复许多集──

### 步骤 3: real स्लिप्स 上做零射 评估

`slip ∈ {0.0, 0.1, 0.2, 0.3, 0.5, 0.7}`上评估──前四个在培训支持内;`0.5`和 `0.7`                                                                                                                                                                                                                                                              

### 步骤 4: संकीर्ण प्रशिक्षण के मुकाबले

 प्रशिक्षण दूसरी नीति, केवल उपयोग `slip = 0.0`                                                                                                                                                                                                                                                              `slip`ऊपर मूल्यांकन. आप देखना चाहिए, एक बार वास्तविक स्लिप > 0, वापसी तब आपदा घट जाएगी.

## 陷

- **过多 randomization。**`slip ∈ [0, 0.9]`ऊपर प्रशिक्षण, आपकी नीति अत्यधिक जोखिम-विरोधी हो जाएगी, यहाँ तक कि आप सही तरीके से प्रयास नहीं करेंगे।
- **过少 randomization。**प्रशिक्षण, नीति 完全无法泛化── अनुकूलन पाठ्यक्रम का उपयोग करना (ऑटोमेटिक डोमेन रैंडोमाइजेशन), नीति के साथ 改进逐步拓宽分布──
- **误判 parameter space。**रैंडोमाइज़ 错误的东西(真实差是机器延迟,但随机化摄像头色),DR 不会有帮助──先配置 真实机器人──
- **Privileged info leakage。**यदि शिक्षक वैश्विक स्थिति का उपयोग करके केवल अवलोकन के बजाय कार्य करता है, तो छात्र के परिणामों का पालन करने में असमर्थ हो सकता है।
- **Sim-to-sim transfer failure。**यदि आपकी नीति अधिक कठिन सिम संस्करण के लिए मजबूत नहीं है, तो यह वास्तविक दुनिया के लिए भी मजबूत नहीं होगा।
- **没有 real-world safety envelope。**एक sim में प्रभावी और वास्तविक में प्रभावी नीति, यदि कम स्तर की सुरक्षा ढाल नहीं है, तो भी खराब हो सकता है हार्डवेयर।

## इसका उपयोग करें

2026 साल सिम-टू-रियल स्टैकः

| Domain | Stack |
|--------|-------|
| Legged locomotion (ANYmal, Spot, humanoid) | Isaac Lab + DR + privileged teacher / student |
| Manipulation (dexterous hands, pick-and-place) | Isaac Lab + DR + DR-GAN for vision |
| Autonomous driving | CARLA / NVIDIA DRIVE Sim + DR + real fine-tune |
| Drone racing | RotorS / Flightmare + DR + online adaptation |
| Finger/in-hand manipulation | OpenAI Dactyl (DR at unprecedented scale) |
| Industrial arms | MuJoCo-Warp + SI + small real fine-tune |

सभी मापों के नियंत्रण के लिए, कार्यप्रवाह एक समान हैंः यथासंभव अनुकूलित सिम, यादृच्छिक आप नहीं अनुकूलित भाग, प्रशिक्षण विशाल नीतियों, डिस्टिल, और फिर सुरक्षा ढाल के साथ तैनात.

##  इसे जारी करें

保存为 `outputs/skill-sim2real-planner.md`:

```markdown
---
name: sim2real-planner
description: 为给定 robot + task 规划 sim-to-real transfer pipeline，覆盖 DR、SI 和 safety。
version: 1.0.0
phase: 9
lesson: 11
tags: [rl, sim2real, robotics, domain-randomization]
---

给定一个 robot platform、一个 task，以及可访问真实硬件的时间，输出：

1. Reality gap 清单。按预期影响排序的可疑来源（contact、sensing、actuation delay、vision）。
2. DR parameters。精确列表、范围、distribution。针对 real measurements 论证每个范围。
3. SI steps。要测量哪些参数；测量方法。
4. Teacher/student 拆分。teacher 使用哪些 privileged info；student 使用哪些 obs。
5. Safety envelope。Low-level limits、emergency stops、backup controller。

拒绝在没有 (a) zero-shot sim-variant test，(b) safety shield，(c) rollback plan 的情况下 deploy。标记任何超过 measured real variability 3× 的 DR range，因为它很可能 over-randomized。
```

## अभ्यास

1. **Easy。**∈ {0.0, 0.1, 0.3, 0.5} ⇒ मूल्यांकन──                                                                                                                                                                                                                                                        
2. **Medium。** प्रशिक्षण एक DR Q-शिक्षा एजेंट, 采样`slip ~ Uniform[0, 0.3]`◊ मूल्यांकन एक ही समूह स्वीप── में स्लिप=0.5 ((बाहर-वितरण) के दौरान, DR  ने कितना लाभ लाया?
3. **Hard。** एक पाठ्यक्रम को लागू करना: स्लिप=0.0 से शुरू होकर, प्रत्येक नीति  जब 90%  का इष्टतम स्तर तक पहुंचती है, तो DR रेंज का विस्तार किया जाता है

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Reality gap | “Sim-to-real difference” | training 与 deployment 的 physics/sensing 之间的 distribution shift。 |
| Domain randomization (DR) | “Train across random sims” | 训练期间 randomize sim parameters，让 policy 泛化。 |
| System identification (SI) | “Measure real and fit sim” | 估计真实物理参数；设置 sim 来匹配。 |
| Domain adaptation | “Fine-tune on real data” | sim training 后进行少量 real-world fine-tune；可能适配 obs 或 dynamics。 |
| Privileged info | “Ground truth for teacher” | 只有 sim 拥有的信息；student 必须从 obs history 中推断它。 |
| Teacher/student | “Distill privileged -> observable” | teacher 使用捷径训练；student 学会在没有这些捷径的情况下模仿。 |
| ADR | “Automatic Domain Randomization” | 随着 policy 改进而拓宽 DR ranges 的 curriculum。 |
| Real2Sim | “Close the gap with real data” | 学习一个 residual，让 sim 模仿 real rollouts。 |

##  आगे पढ़ें

- [Tobin et al. (2017). Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World](https://arxiv.org/abs/1703.06907) 原始 DR पेपर (रोबोटिक दृष्टि)
- [Peng et al. (2018). Sim-to-Real Transfer of Robotic Control with Dynamics Randomization](https://arxiv.org/abs/1710.06537) गतिशीलता का DR, चौगुना गति
- [OpenAI et al. (2019). Solving Rubik's Cube with a Robot Hand](https://arxiv.org/abs/1910.07113) डैक्टिल, बड़े पैमाने पर एडीआर
- [Miki et al. (2022). Learning robust perceptive locomotion for quadrupedal robots in the wild](https://www.science.org/doi/10.1126/scirobotics.abk2822) पशु का शिक्षक-छात्रा──
- [Makoviychuk et al. (2021). Isaac Gym: High Performance GPU Based Physics Simulation for Robot Learning](https://arxiv.org/abs/2108.10470) 驱动 20252026 तैनाती के बड़े पैमाने पर समानांतर सिम
- [Akkaya et al. (2019). Automatic Domain Randomization](https://arxiv.org/abs/1910.07113) एडीआर पाठ्यक्रम विधि。
- [Sutton & Barto (2018). Ch. 8 — Planning and Learning with Tabular Methods](http://incompleteideas.net/book/RLbook2020.pdf) डायना फ्रेमिंग(使用模型做规划 + रोलआउट),支现代 सिम-टू-रियल पाइपलाइनों。
- [Zhao, Queralta & Westerlund (2020). Sim-to-Real Transfer in Deep Reinforcement Learning for Robotics: a Survey](https://arxiv.org/abs/2009.13303) सिम-टू-रियल तरीकों का वर्गीकरण,并包含 बेंचमार्क परिणामों──
