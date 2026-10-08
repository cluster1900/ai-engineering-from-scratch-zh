# نقل من سم إلى حقيقة

> سياسة التدريب في المحاكاة ، ولكن الفشل في الأجهزة ، في الأساس هو حفظ المحاكاة.

**Type:** 学习
**Languages:** Python
**Prerequisites:** Phase 9 · 08 (PPO), Phase 2 · 10 (Bias/Variance)
**Time:** ~45 分钟

## 问题

訓練真人機器人 很慢、危险且昂贵──                                                                                                                                                                                                                                                       

ولكن المحاكاة هي خطأ. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .**reality gap**، أي الاختلافات النظامية بين توزيع السيم والتوزيع الحقيقي ، هي مشكلة أساسية لـ RL المنشورة في الروبوتات.

تحتاج إلى تحريك لتوزيع * سم إلى الواقع* 具有强大的性政策──三种历史方法:randomize simulator(دوماين عشوائية)、with a small amount of real data 适配 policy(دوماين التكيف / ضبط دقيقة) ، أو تحديد العناصر الحقيقية للنظام并匹配它们 (تعرف النظام)── بحلول عام 2026، ستقوم الصيغة الرئيسية بتحديد ثلاثة مع محاكاة متوازية واسعة النطاقات ((إيساك سيم、إيساك لاب ميوجوكو MJX على GPU) 结合────

## 概念

![Three sim-to-real regimes: domain randomization, adaptation, system identification](../assets/sim-to-real.svg)

**Domain Randomization (DR)。**توبن وزملاء 2017، بينغ وزملاء 2018، خلال التدريب، عشوائية كل شخص ممكن في الروبوت الحقيقي على مختلف معايير الروبوت: الجماهير ومعدلات الاحتكاك المتحرك PD مكاسب الضوضاء الاستشعار وضع الكاميرا الإضاءة والنسيج النماذج الاتصال.

- **优点：**لا تحتاج إلى بيانات حقيقية.
- **缺点：**التدريبات على الاختيار المفرط تخلق سياسة عالمية ولكن حذرة جدا.

**System Identification (SI)。**في التدريب قبل، باستخدام بيانات العالم الحقيقي 拟合模拟器的参数── إذا كنت تستطيع قياس الروبوت الحقيقي فوق العراك المشترك الذراع، فلتقوم بملئها في sim── ثم تدريب سياسة توقعات هذه القيم── تحتاج إلى زيارة النظام الحقيقي، ولكن يمكن أن تقلل مباشرة الفجوة الواقعية──

- **优点：**精确、低噪音 訓練 هدف
- **缺点：**ما تبقى من أخطاء النموذج على السياسة لا يمكن رؤيتها؛ لا يزال التأثيرات غير المعروفة الصغيرة (مثل الشبكة الميتة للسيارات) ستضر من التنفيذ.

**Domain Adaptation。**في دراستك التدريبية، إعادة استخدام كمية صغيرة من البيانات الحقيقية

- **Real2Sim2Real：**باستخدام عمليات التشغيل الحقيقية تعلم محاكاة بقايا`f(s, a, z) - f_sim(s, a)`لا تحتاج إلى الكثير من البيانات الحقيقية لتقليل الفجوة
- **Observation adaptation：**訓練一個政策,通過 تعلم استخراج الميزات ((على سبيل المثال GAN بيكسل إلى بيكسل) سوف يكون حقيقية obs → sim مثل obs──controller 仍然停留在sim 中──

**Privileged learning / teacher-student。**ميكي وزملاء 2022 ((الأنسان أرباع) ・・・ في المحاكاة تدريب واحد يمكن الوصول إلى المعلومات الممتازة ((التضارب الحقيقي الأرضية、ارتفاع الأرض、انحراف IMU) من *المعلم*。 مرة أخرى تصفيح واحد فقط رؤية مشاهدات الحواسيب الحقيقية

**Massively parallel simulation。**20242026──I Isaac Lab、Mujoco MJX、Brax 都能在单个GPU上运行数千个平行机器人──PPO 搭配 4,096 个平行人形,可以在数小时内收集多年经验──随着培训分布变宽,现实差缩小;当这4,096 个环境中每个都有不同的随机参数时,DR 几乎是免费的──

**2026 年真实世界配方（quadruped walking 示例）：**

1. استخدام التشغيل المتوازي بشكل كبير،并对重力、摩ط٬ تحرك مكاسب、حملة دفع
2. استخدم معلومات ممتازة خريطة الأرض
3. فقط باستخدام التصور الخاص (مخترفات مفصل الساق) من المعلمين تحليل سياسة الطلاب
4. 可选: من خلال IMU الحقيقي 上的自动编码做观察适应──
5. تعزيز في بيئات 10+ فوق الصفر الصور. إذا فشلت، فاستخدم PPO المقيود بالأمن لتقوم بعمل بعض الدقائق في العالم الحقيقي.


```figure
f3-reality-gap
```

## بناءها

هذا المجال هو عرض عرض من خلال النطاقات المُتصدّمة الصغيرة جداً، والمنظور مع * صاخبة * الانتقالات من GridWorld.

### 步骤 1: سم المعلم

```python
def step(state, action, slip):
    if rng.random() < slip:
        action = random_perpendicular(action)
    ...
```

`slip`في الروبوتات الحقيقية، يمكن أن يكون الاحتكاك، الجماعة، الربح المحرك، أو يمكن أن يكون أي شيء يحدث في التحول بين الجهاز والواقع.

### 步骤 2: استخدام DR 训练

في كل حلقة  بدأ `slip ~ Uniform[0.0, 0.4]`◊ تدريب PPO / Q-تعلم / 任意方法──重复许多集──

### الخطوة الثالثة: في real سليب 上做零 shot 评估

في`slip ∈ {0.0, 0.1, 0.2, 0.3, 0.5, 0.7}`上评估──前四个在培训支持内;`0.5`和 `0.7`في الخارج. السياسة المدربة في الدولة يجب أن تكون في الداعم.

### الخطوة الرابعة: مقارنة بالتدريب الضيق

التدريب السياسة الثانية، فقط استخدام`slip = 0.0`في نفس المجموعة`slip`تُجري التقييم العلوي. يجب أن ترى، عندما يُرجع المرجع الحقيقي إلى "معدل"

## فخ

- **过多 randomization。**في`slip ∈ [0, 0.9]`على التدريب، سياساتك سوف تصبح خطرة للغاية، حتى لا تحاول طريق مثالي.
- **过少 randomization。**في فترة قصيرة من التدريب، لا يمكن التعميم الكامل للسياسة.
- **误判 parameter space。**تُشكل الفجوة الحقيقية تأخير محرك، ولكن تُشكل اللون الكاميرا بشكل عشوائي، وDR لن يكون مساعدة.
- **Privileged info leakage。**إذا كان المعلم يستخدم الحالة العالمية للقيام بأفعال، وليس مجرد ملاحظات، فيمكن أن ينتج الطالب نتائج لا يمكن تتبعها.
- **Sim-to-sim transfer failure。**إذا كانت سياسةك تجاه الإصدارات الأصعب من الـ Sim ليست قوية، فإنها لن تكون قوية في العالم الحقيقي.
- **没有 real-world safety envelope。**سياسة فعالة في sim وفعالة في real، إذا لم يكن هناك درع السلامة منخفضة المستوى، لا يزال يمكن أن تفسد الأجهزة.

## استخدمها

2026 سنة محاكمة من التمثيل إلى الواقع:

| Domain | Stack |
|--------|-------|
| Legged locomotion (ANYmal, Spot, humanoid) | Isaac Lab + DR + privileged teacher / student |
| Manipulation (dexterous hands, pick-and-place) | Isaac Lab + DR + DR-GAN for vision |
| Autonomous driving | CARLA / NVIDIA DRIVE Sim + DR + real fine-tune |
| Drone racing | RotorS / Flightmare + DR + online adaptation |
| Finger/in-hand manipulation | OpenAI Dactyl (DR at unprecedented scale) |
| Industrial arms | MuJoCo-Warp + SI + small real fine-tune |

بالنسبة لجميع الحجم، تدفق العمل متوافق:

## أصدرها

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

## التدريب

1. **Easy。**في شبكة التزلج الثابتة ((التزلج=0.0) على تدريب وكيل Q-التعلم── في التزلج ∈ {0.0, 0.1, 0.3, 0.5} 上评估── رسم العودة مقابل التزلج──
2. **Medium。**تدريب وكيل دراسة دكتوراه كيو،采样 `slip ~ Uniform[0, 0.3]` تقييم نفس المجموعة  في خفض = 0.5  خارج التوزيع) عندما، DR                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
3. **Hard。**تطبيق منهج: من خفّة = 0.0 بدءاً، كلما وصلت السياسة إلى 90% من المثالي، توسّع نطاق DR، وتحقيق خفّة = 0.3 صفر-طلق، وتحقيق إجمالي خطوات البيئة المطلوبة، ومقارنة مع خطة أساسية DR الثابتة.

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

##  المزيد阅读

- [Tobin et al. (2017). Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World](https://arxiv.org/abs/1703.06907) 始 DR ورقة ((رؤية الروبوتات) 。
- [Peng et al. (2018). Sim-to-Real Transfer of Robotic Control with Dynamics Randomization](https://arxiv.org/abs/1710.06537) ديناميكيات DR، محركات أرباعي
- [OpenAI et al. (2019). Solving Rubik's Cube with a Robot Hand](https://arxiv.org/abs/1910.07113) دكتيل، ADR على نطاق واسع
- [Miki et al. (2022). Learning robust perceptive locomotion for quadrupedal robots in the wild](https://www.science.org/doi/10.1126/scirobotics.abk2822) المعلم الطالب الحيوانية
- [Makoviychuk et al. (2021). Isaac Gym: High Performance GPU Based Physics Simulation for Robot Learning](https://arxiv.org/abs/2108.10470) 驱动 20252026 نشرات الموازية بشكل كبير
- [Akkaya et al. (2019). Automatic Domain Randomization](https://arxiv.org/abs/1910.07113) طريقة المناهج الدراسية للـ ADR
- [Sutton & Barto (2018). Ch. 8 — Planning and Learning with Tabular Methods](http://incompleteideas.net/book/RLbook2020.pdf) إطار دينا ((استخدام النموذج صنع التخطيط + التنفيذ) ،支现代 سيم- إلى-الحقيقي خطوط الأنابيب
- [Zhao, Queralta & Westerlund (2020). Sim-to-Real Transfer in Deep Reinforcement Learning for Robotics: a Survey](https://arxiv.org/abs/2009.13303) تصنيف الأساليب المنسخة إلى الواقعية،并包含 نتائج مقياس الموازنة.
