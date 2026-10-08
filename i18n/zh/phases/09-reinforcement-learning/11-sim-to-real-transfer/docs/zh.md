# 转移到真实

> 系统识别,让学习控制器跨越现实差距的三种工具――

**Type:** 学习
**Languages:** Python
**Prerequisites:** Phase 9 · 08 (PPO), Phase 2 · 10 (Bias/Variance)
**Time:** ~45 分钟

## 问题

训练真实机器人 很慢,危险且昂贵. 一个双脚需要数百万次训练,才能学会走;而真实双脚也可能损坏硬件.

但是模拟器是错的. 轴承摩擦比MuJoCo模型中更大. 摄像机有镜头扭曲,而模拟器并没有包含. 发动机有延误,反射和和,而99%的Sim模型都会跳过这些.**reality gap**系统性差异与实物分布之间的系统性差异是机器人部署的RL的核心问题.

你需要对 *sim-to-real分布转移* 具有强大的性政策──三种历史方法:随机化模拟器 (域名随机化) 、使用少量真实数据 适应政策 (域名适应/细调),或识别真实系统的参数并匹配它们 (系统识别) ──到2026年,主流配方将把三者与大规模并行模拟器 (Iac Sim、Isaac LabMujoco MJX) 结合起来──

## 概念

![Three sim-to-real regimes: domain randomization, adaptation, system identification](../assets/sim-to-real.svg)

**Domain Randomization (DR)。**2017年,Peng et al. 2018年,随机对每一个可能在真实机器人上不同的Sim参数进行测试:质量,摩擦系数,发动机PD收益,传感器噪音,摄像头位置,照明,纹理,接触模型.

- **优点：**没有真正的数据.
- **缺点：**过度随机化训练会产生一个普遍的,但过于谨慎的政策.

**System Identification (SI)。**在训练前,使用现实数据 适合模拟器的参数.如果你能测量真实机器人上臂关节摩擦,就把它填写在模拟中.然后训练一个预期这些值的政策. 它需要访问真实系统,但可以直接缩小现实差距.

- **优点：**精确低噪音的训练目标
- **缺点：**剩余的模型错误对政策不可见;小的未识别效应 (例如电动死带) 仍然会破坏部署.

**Domain Adaptation。**在sim中训练中,再使用少量真实数据细调.

- **Real2Sim2Real：**通过实用部署学习一个残余模拟器`f(s, a, z) - f_sim(s, a)`没有太多的真实数据可以缩小差距.
- **Observation adaptation：**训练一个政策,通过学习的功能提取器 (例如GAN像素到像素) 将真正的obs → sim-like obs──控制器仍然停留在sim中──

**Privileged learning / teacher-student。**和其他学生在模拟中训练一个可以访问特权信息的 *老师*──再炼一个只看到真实传感器观测的 *学生*──学生 学会从历史中推断特权特征,并保持强的物理参数变化下──

**Massively parallel simulation。**20242026──伊萨克实验室、穆乔科MJX、Brax 都能在单个GPU上运行数千个平行机器人──PPO 搭配4,096个平行人形,可以在几小时内收集多年的经验──随着训练分布变宽,现实差距缩小;当这4,096个环境中每个都有不同的随机参数时,DR 几乎是免费的──

**2026 年真实世界配方（quadruped walking 示例）：**

1. 使用大量的平行模拟,并对重力、摩擦、动力增长、付费负载做域的随机化──
2. 使用特权信息 (地图),体速地图,实地实力
3. 只有使用自觉的脚编码器) 从教师来提取学生政策.
4. 可选:通过真实IMU 上的自动编码器做观察适应.
5. 如果失败,就用安全限制的PPO做几分钟的现实世界细节调整.


```figure
f3-reality-gap
```

## 构建它

本课代码是一个非常小的域间随机化演示,场景是带有 *噪音*的过渡的 GridWorld──我们训练一个政策,让它在sim中经历随机滑动概率,并在sim中使用一个训练中从未见过的滑动水平做评估──这种形态可以直接映射到MuJoCo到硬件转移──

### 步骤 1:参数化Sim

```python
def step(state, action, slip):
    if rng.random() < slip:
        action = random_perpendicular(action)
    ...
```

`slip`在真实机器人中,它可以是摩擦,质量,动力增长,也可以是任何发生在模拟和真实之间发生的变化.

### 步骤 2: 使用 DR 训练

在每一集中,`slip ~ Uniform[0.0, 0.4]`│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │

### 步骤3: 在 真滑板上做零射 评估

在`slip ∈ {0.0, 0.1, 0.2, 0.3, 0.5, 0.7}`上评估──前四个在培训支持内;`0.5`和 `0.7`在外面,DR训练的政策 应该在支持内保持接近优势,并在支持外平滑退化.

### 步骤4:与狭窄的训练相比

训练第二个政策,只使用`slip = 0.0`在同一组中`slip`扫上评估――你应该看到,一旦真正的滑动 > 0,返回就会降低灾难性――

## 陷

- **过多 randomization。**在`slip ∈ [0, 0.9]`您的政策将变得极其不愿意冒险,直到从未尝试最佳的方法――匹配*预期的*现实世界分布,而不是任何事情都可能发生──
- **过少 randomization。**在很薄的范围上训练,政策 完全无法泛化――使用适应性课程 (自动域名随机化),随着政策 改进逐步拓宽分布――
- **误判 parameter space。**随机化 错误的东西(真实差距是机器延迟,但随机化摄像头色调),DR 不会有帮助.
- **Privileged info leakage。**如果老师用全球状态做行动,而不是仅仅观察,就可能产生学生无法追踪结果.
- **Sim-to-sim transfer failure。**如果你的对更难的Sim变体的政策不强大,它也不会对真实世界强大.
- **没有 real-world safety envelope。**一个在sim中有效且在真实中有效的政策,如果没有低级安全屏蔽,仍然可能损坏硬件――加入速率限制、扭矩限制、联合限制,并放置在未学习的控制器中――

## 使用它

现在,我们在线观看

| Domain | Stack |
|--------|-------|
| Legged locomotion (ANYmal, Spot, humanoid) | Isaac Lab + DR + privileged teacher / student |
| Manipulation (dexterous hands, pick-and-place) | Isaac Lab + DR + DR-GAN for vision |
| Autonomous driving | CARLA / NVIDIA DRIVE Sim + DR + real fine-tune |
| Drone racing | RotorS / Flightmare + DR + online adaptation |
| Finger/in-hand manipulation | OpenAI Dactyl (DR at unprecedented scale) |
| Industrial arms | MuJoCo-Warp + SI + small real fine-tune |

对于所有尺寸的控制,工作流程都是一致:尽量适应,随机化你不适应的部分,训练巨大的政策,

## 发布它

保存为`outputs/skill-sim2real-planner.md`其他:

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

## 练习

1. **Easy。**在固定滑格格里德世界 (在固定滑格格里德世界) 滑=0.0) 上训练一个Q学习代理──在滑格中 ∈ {0.0, 0.1, 0.3, 0.5} 上评估──绘制回归与滑格──
2. **Medium。**训练一个博士的Q学习代理,采样`slip ~ Uniform[0, 0.3]`评估同组扫描 在滑走=0.5 ((出发) 时,DR 带来了多少收益?
3. **Hard。**实现课程:从滑 = 0.0 开始,每当政策达到最佳的90% 时,扩大DR范围――测量达到滑 = 0.3 零射所需的总环境步骤,并与固定DR基线相比――

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

## 进一步阅读

- [Tobin et al. (2017). Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World](https://arxiv.org/abs/1703.06907) 原始 DR 论文 ((机器人视觉)
- [Peng et al. (2018). Sim-to-Real Transfer of Robotic Control with Dynamics Randomization](https://arxiv.org/abs/1710.06537)动力的DR,四旋翼的移动――
- [OpenAI et al. (2019). Solving Rubik's Cube with a Robot Hand](https://arxiv.org/abs/1910.07113) 大,大规模的ADR──
- [Miki et al. (2022). Learning robust perceptive locomotion for quadrupedal robots in the wild](https://www.science.org/doi/10.1126/scirobotics.abk2822)动物的教师-学生──
- [Makoviychuk et al. (2021). Isaac Gym: High Performance GPU Based Physics Simulation for Robot Learning](https://arxiv.org/abs/2108.10470)驱动20252026部署的巨大平行模拟
- [Akkaya et al. (2019). Automatic Domain Randomization](https://arxiv.org/abs/1910.07113)ADR课程方法──
- [Sutton & Barto (2018). Ch. 8 — Planning and Learning with Tabular Methods](http://incompleteideas.net/book/RLbook2020.pdf) Dyna 框架使用模型做规划+推广),支现代的真实化管道──
- [Zhao, Queralta & Westerlund (2020). Sim-to-Real Transfer in Deep Reinforcement Learning for Robotics: a Survey](https://arxiv.org/abs/2009.13303) 模拟到真实方法的分类,并包含基准结果.
