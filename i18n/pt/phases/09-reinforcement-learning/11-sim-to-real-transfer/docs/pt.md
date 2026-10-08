# Transferência Sim-Real

> Uma política de treinamento no simulador, mas que falhou no hardware, é essencialmente lembrar do simulador.

**Type:** 学习
**Languages:** Python
**Prerequisites:** Phase 9 · 08 (PPO), Phase 2 · 10 (Bias/Variance)
**Time:** ~45 分钟

## 问题

 treinar um robô real 很慢、危险且昂贵── um biped 需要数百万训练集 才能学会走走;而真实 biped 哪怕摔倒一次,也可能损坏硬件── A simulação 给你无限重置、确定性可复现、parallel environments,并且不会造成物理损坏──

Mas os simuladores são errados. Os movimentos de atraso dos rodamentos são maiores do que os modelos MuJoCo. As câmeras têm distorção de lente, enquanto o simulador não contém. Os motores têm atrasos, retro-reflexões e saturação, enquanto 99% dos modelos sim saltam sobre estes.**reality gap**A diferença sistêmica entre a distribuição de sim e a distribuição real é o problema central da RL implantada na robótica.

Você precisa de uma política de distribuição *sim-to-real* 具有强烈性政策──三种历史方法:randomize simulator(dominio randomization)、用少量真实数据 适配政策(dominio adaptation / fine-tuning),或识别真实系统的参数并匹配它们 (identificação do sistema)──到2026年,主流配方将把三者与大规模平行模拟──Isaac Sim、Isaac LabMujoco MJX on GPU) 结合──────

## 概念

![Three sim-to-real regimes: domain randomization, adaptation, system identification](../assets/sim-to-real.svg)

**Domain Randomization (DR)。**Tobin et al. 2017,Peng et al. 2018。 Durante o treinamento, aleatorize cada um de seus possíveis sims em um robô real.

- **优点：**Não precisa de dados reais. Uma combinação, adequada a muitos robôs.
- **缺点：**O exercício da randomization excessiva produz uma política universal mas demasiado cautelosa.

**System Identification (SI)。**Em treinamento, use os parâmetros do simulador de dados do mundo real. Se puder medir a fricção do braço-junto do robô real, encha-o em sim.

- **优点：**精确、低噪音的训练目标――
- **缺点：**O restante erro do modelo para a política é invisível; pequenos efeitos não identificados (por exemplo, banda morta do motor) ainda prejudicam a implantação.

**Domain Adaptation。**Em simulação, reutilize uma pequena quantidade de dados reais de sintonia.

- **Real2Sim2Real：**Usar as instalações reais, aprender um simulador residual.`f(s, a, z) - f_sim(s, a)`Não é preciso muito dados reais para reduzir a diferença.
- **Observation adaptation：**訓練一個政策, através do extractor de recursos aprendido (por exemplo, GAN pixel-to-pixel) vai ser real obs → sim-like obs──controller 仍然停留在sim中──

**Privileged learning / teacher-student。**Miki et al. 2022(Animal quadruped) ・・・ em simulação entraînamentone one can access privileged information(ground truth friction、terrain height、IMU drift) of *teacher*。再 distill 一个只看到真正传感器观测的 *student*。student 学会从历史中推断特特色,并在物理参数变下保持强──

**Massively parallel simulation。**20242026──Isaac Lab、Mujoco MJX、Brax 都能在单个GPU上运行数千个平行机器人──PPO 搭配 4,096 平行人体,可以在数小时内收集多年经验──随着训练分布变宽,现实差缩小;当这些4,096 环境中每个都有不同的随机参数时,DR 几乎是免费的──

**2026 年真实世界配方（quadruped walking 示例）：**

1. Utilize sim massively paralelo,并对重力、摩擦、motor gains、payload 做域随机化──
2. Utilize informações privilegiadas (mapa de terreno, velocidade do corpo, verdade do solo)
3. Apenas usar a própria percepção (códigos das pernas) para destilar a política dos alunos.
4. 可选: através de um autoencoder real da IMU 上 fazer uma adaptação de observação.
5. Deploy── em 10+ ambientes 上零射── Se não conseguir, use PPO com restrições de segurança para fazer alguns minutos de ajuste real.


```figure
f3-reality-gap
```

## Construí-lo

O código do curso é uma pequena área de randomizamento de domínio. O cenário é com * ruído * transições do GridWorld.

### 步骤 1: sim parametrizado

```python
def step(state, action, slip):
    if rng.random() < slip:
        action = random_perpendicular(action)
    ...
```

`slip`Simulador é um parâmetro de exposição. Na robótica real, pode ser fricção, massa, ganho motor, ou qualquer coisa que ocorra entre sim e real.

### 步骤 2: Utilize DR 训练

Em cada episódio, começa.`slip ~ Uniform[0.0, 0.4]`◊ treinamento PPO / Q-learning / 任意方法──重复许多集──

### Passo 3: Em real  slips 上 fazer zero-shot  avaliação

Em`slip ∈ {0.0, 0.1, 0.2, 0.3, 0.5, 0.7}`上评估──前四个在培训支持内;`0.5`和 `0.7`Em geral, a política de formação em DR deve ser de apoio e manter-se próxima ao melhor, e apoiar a política de formação em Slip Fixed, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip Training, em Slip, em Slip, Slip, Slip, Slip, Slip, Slip, S.

### 步骤 4: Comparado com o treinamento estreito

                                                                                                                                                                                                                                                              `slip = 0.0`                                                                                                                                                                                                                                                              `slip`Varre-se, você deve ver, quando o real deslize > 0, retorno é em baixa.

## 陷

- **过多 randomization。**Em`slip ∈ [0, 0.9]`Na prática, sua política vai se tornar extremamente aversas ao risco, até que não tente um caminho ideal.
- **过少 randomization。**Em um pequeno espaço de tempo, a política completamente impossível de ser generalizada.
- **误判 parameter space。**Randomize 错误的东西(真实差是机器延迟,但随机定制摄像机色),DR 不会有帮助──先配置 真实机器人──
- **Privileged info leakage。**Se o professor usa o estado global para fazer ações, não apenas observações, é possível produzir resultados que os alunos não conseguem seguir.
- **Sim-to-sim transfer failure。**Se a sua política para a variante sim mais difícil não for robusta, não será robusta para o mundo real.
- **没有 real-world safety envelope。**Uma política válida e válida em sim em real em sim, se não houver um escudo de segurança de baixo nível, ainda pode danificar os hardware.

## Use-o

2026 ano Sim-to-Real stack:

| Domain | Stack |
|--------|-------|
| Legged locomotion (ANYmal, Spot, humanoid) | Isaac Lab + DR + privileged teacher / student |
| Manipulation (dexterous hands, pick-and-place) | Isaac Lab + DR + DR-GAN for vision |
| Autonomous driving | CARLA / NVIDIA DRIVE Sim + DR + real fine-tune |
| Drone racing | RotorS / Flightmare + DR + online adaptation |
| Finger/in-hand manipulation | OpenAI Dactyl (DR at unprecedented scale) |
| Industrial arms | MuJoCo-Warp + SI + small real fine-tune |

Para todos os controles, o fluxo de trabalho é um: tentar adaptar-se ao sim, randomizar as partes que não se encaixam, treinar grandes políticas, destilar, e depois usar o escudo de segurança.

##  Publicá-lo

保存为 `outputs/skill-sim2real-planner.md`- Não .

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

1. **Easy。**Em Slip-Fixed GridWorld(slip=0.0)                                                                                                                                                                                                                                                       
2. **Medium。**Treinar um agente de aprendizagem DR Q, 采样 `slip ~ Uniform[0, 0.3]` avaliar o mesmo grupo de varredura  em queda = 0,5  fora de distribuição)
3. **Hard。** Realizar um currículo: a partir de sli=0.0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               

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

##  weiterlesen

- [Tobin et al. (2017). Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World](https://arxiv.org/abs/1703.06907) Origins DR paper (Visão robótica)
- [Peng et al. (2018). Sim-to-Real Transfer of Robotic Control with Dynamics Randomization](https://arxiv.org/abs/1710.06537) dinâmica de DR, locomoção quadruplação。
- [OpenAI et al. (2019). Solving Rubik's Cube with a Robot Hand](https://arxiv.org/abs/1910.07113)Dactyl, ADR em grande escala.
- [Miki et al. (2022). Learning robust perceptive locomotion for quadrupedal robots in the wild](https://www.science.org/doi/10.1126/scirobotics.abk2822) Animais de professor-aluno。
- [Makoviychuk et al. (2021). Isaac Gym: High Performance GPU Based Physics Simulation for Robot Learning](https://arxiv.org/abs/2108.10470) 驱动 20252026 deployments massively parallel sim。
- [Akkaya et al. (2019). Automatic Domain Randomization](https://arxiv.org/abs/1910.07113) Método do currículo ADR。
- [Sutton & Barto (2018). Ch. 8 — Planning and Learning with Tabular Methods](http://incompleteideas.net/book/RLbook2020.pdf) Dyna framing(使用模型做规划 + rollouts),支现代 sim-to-real pipelines──
- [Zhao, Queralta & Westerlund (2020). Sim-to-Real Transfer in Deep Reinforcement Learning for Robotics: a Survey](https://arxiv.org/abs/2009.13303) Taxonomia dos métodos sim-to-real,并包含 benchmark results──
