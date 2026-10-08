# Transferencia de Sim a Real

> Una política que entraña en un simulador, pero falla en el hardware, es en esencia recordar el simulador. La aleatorización de dominios, la adaptación de dominios y la identificación del sistema, es permitir que los controladores aprendieran tres tipos de herramientas que cruzan la brecha de realidad.

**Type:** 学习
**Languages:** Python
**Prerequisites:** Phase 9 · 08 (PPO), Phase 2 · 10 (Bias/Variance)
**Time:** ~45 分钟

##  problemas

 entrenar un robot real 很慢、危险且昂贵── un biped 需要数百万训练集 才能学会走走;而真实 biped 哪怕摔倒一次,也可能损坏硬件──Simulación 给你无限重置、确定性可复现、平行环境,并且不会造成物理损坏──

Pero los simuladores son errores. Los rodamientos son más grandes que los modelos MuJoCo. Las cámaras tienen distorsión de lente, mientras que el simulador no contiene. Los motores tienen retrasos, retroacciones y saturación, mientras que el 99% de los modelos sim saltan por encima de estos.**reality gap**, es decir, la diferencia sistémica entre la distribución de sim y la distribución real, es el problema central de la RL desplegada en la robótica.

Usted necesita una política de distribución de *sim-to-real* 具有强烈性政策──三种历史方法:randomize simulator(dominio aleatorización)、用少量真实数据 适配政策(dominio adaptación / ajuste fino),或识别 real system's parameters并匹配它们 (identificación del sistema)──到2026年, la principal combinación pondrá a los tres en una simulación paralela a gran escala(Isaac Sim、Isaac LabMujoco MJX en GPU) 结合────

## 概念

![Three sim-to-real regimes: domain randomization, adaptation, system identification](../assets/sim-to-real.svg)

**Domain Randomization (DR)。**Tobin et al. 2017,Peng et al. 2018。 Durante el entrenamiento, aleatorizar cada uno de los posibles en el robot real en diferentes parámetros de sim:masas, coeficientes de fricción, ganancias de PD motoras, ruido de sensor, posición de la cámara, iluminación, texturas, modelos de contacto―política Aprender a una acerca de la distribución de las condiciones de sim  hoy en día en el robot real, y en todo el rango de generalización―.

- **优点：**No necesita datos reales. Una combinación, adecuada para muchos robots.
- **缺点：** El ejercicio de la excesivamente aleatoria genera una política universal pero demasiado cautelosa―  Demasiado ruido ≈  Demasiada regularización―

**System Identification (SI)。**En el entrenamiento, utiliza datos del mundo real para medir los parámetros del simulador. Si puedes medir la fricción entre los brazos y el brazo de un robot real, hazlo en un simulador. Luego entrenar una política de estos valores. Necesita acceder al sistema real, pero puede reducir directamente la brecha de realidad.

- **优点：**精确、低噪音的训练目标──
- **缺点：**El resto de errores de modelo en la política son invisibles; los efectos de poca identificación (por ejemplo, banda muerta de motor) todavía perjudican el despliegue.

**Domain Adaptation。**En sim training, reutilice poca cantidad de datos reales para ajustar los datos.

- **Real2Sim2Real：**Con el uso de implementaciones reales Aprende a un simulador residual`f(s, a, z) - f_sim(s, a)`, re-en la modificación de la simulación de entrenamiento después. No se necesita mucho datos reales para reducir la diferencia.
- **Observation adaptation：**训练一个政策, mediante extractor de características aprendidas (por ejemplo, GAN píxel-a-pixel) será un verdadero obs → sim-like obs──controller 仍然停留在sim中──

**Privileged learning / teacher-student。**Miki et al. 2022 (Animal quadruped) ――En la simulación entrañando una que pueda acceder a información privilegiada (Friction of Ground Truth, Height of Ground, Height of Ground, IMU drift) del *enseñador*──re-distillado una única observación de sensores reales del *estudiante*──estudiante 学会从历史中推断特特色,并在物理参数变下保持强──

**Massively parallel simulation。**20242026──Isaac Lab、Mujoco MJX、Brax 都能在单个GPU上运行数千个平行机器人──PPO 搭配 4,096 平行人形,可以在数小时内收集多年经验──随着训练分布变宽,现实差缩小;当这4,096 环境中每个都有不同的随机参数时,DR 几乎是免费的──

**2026 年真实世界配方（quadruped walking 示例）：**

1. Utiliza sim paralelo masivo,并对重力、摩擦、motor gains、payload hacer la aleatorización de dominio。
2. Utiliza información privilegiada (mapa del terreno, velocidad del cuerpo, verdad del suelo)
3. Sólo usar la propia percepción de los codores de las articulaciones de las piernas) del profesor destilar la política de los estudiantes.
4. 可选: a través de un autoencoder real de la UMI, hacer una adaptación de observación.
5. En 10+ entornos, en los que no hay nada. Si no, haz un ajuste real de PPO con restricciones de seguridad.


```figure
f3-reality-gap
```

## Construirlo

Este código es una muy pequeña demostración de dominio de aleatorización, el escenario es con * ruidosos * transiciones de GridWorld。 nosotros entrenamos una política, que lo permita experimentar probabilidades de deslizamiento aleatorias en sim y hacer una evaluación de nivel de deslizamiento nunca antes visto en real en sim. Este formato puede ser directamente mapeado a transferencia de MuJoCo a hardware。

### 步骤 1: Sim parámetrizado

```python
def step(state, action, slip):
    if rng.random() < slip:
        action = random_perpendicular(action)
    ...
```

`slip`Es un parámetro de exposición en el simulador. En la robótica real, puede ser fricción, masa, ganancia motora, o cualquier cambio que ocurra entre el simulador y el real.

### Paso 2: Utiliza DR  entrenamiento

En cada episodio, comienza, toma.`slip ~ Uniform[0.0, 0.4]`◊ entrenamiento PPO / Q-aprendizaje / 任意方法──重复很多集──

### Paso 3: En los pasillos reales, hacer un tiro cero, evaluar

En el`slip ∈ {0.0, 0.1, 0.2, 0.3, 0.5, 0.7}`上评估──前四个在培训支持内;`0.5`Y `0.7`En el exterior, la política de formación en DR debe mantenerse en el interior, y en el exterior, mantenerse en el extremo, y en el exterior, mantenerse en el extremo.

### Paso 4: En comparación con la formación estrecha

 entrenar la segunda política, sólo usar `slip = 0.0`                                                                                                                                                                                                                                                              `slip`barr up evaluar. Usted debería ver, una vez que el verdadero deslizamiento > 0, retorno en la catástrofe baja.

## 陷

- **过多 randomization。**En el`slip ∈ [0, 0.9]`En el entrenamiento, tu política se volverá extremadamente aversas al riesgo, hasta que no intentes un camino óptimo.
- **过少 randomization。**En un muy pequeño ámbito de entrenamiento, la política completamente imposible de generalizar  utilizar un currículo adaptativo  Automatic Domain Randomization), con la política 改进逐步拓宽分布
- **误判 parameter space。**Rando  err err err err errores de cosas ((( verdadero hueco es retraso motor, pero al azar rando hueco de cámara), DR no va a tener ayuda.
- **Privileged info leakage。**Si el profesor utiliza el estado global para hacer acciones, no sólo observaciones, es posible que el estudiante pueda obtener resultados que no puedan ser seguidos.
- **Sim-to-sim transfer failure。**Si tu política para la variante sim más difícil no es robusta, tampoco será robusta para el mundo real.
- **没有 real-world safety envelope。**Una política válida en el sim y válida en el real, si no hay un escudo de seguridad de bajo nivel, todavía puede romper el hardware.

## Usalo

2026 años de simulación real:

| Domain | Stack |
|--------|-------|
| Legged locomotion (ANYmal, Spot, humanoid) | Isaac Lab + DR + privileged teacher / student |
| Manipulation (dexterous hands, pick-and-place) | Isaac Lab + DR + DR-GAN for vision |
| Autonomous driving | CARLA / NVIDIA DRIVE Sim + DR + real fine-tune |
| Drone racing | RotorS / Flightmare + DR + online adaptation |
| Finger/in-hand manipulation | OpenAI Dactyl (DR at unprecedented scale) |
| Industrial arms | MuJoCo-Warp + SI + small real fine-tune |

Para todos los controles, el flujo de trabajo es un solo: hacer todo lo posible para adaptarse a la simulación, aleatorizar las partes que no se adaptan, entrenar grandes políticas, destilar, y luego llevar un escudo de seguridad desplegado.

##  Publicarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-sim2real-planner.md`¿Qué es esto ?

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

##  ejercicios

1. **Easy。**En el mundo de la rejilla fija, el sistema de redes de redes de redes de redes de redes de redes de redes de redes de redes de redes de redes fijas (slip=0.0) se está entrenando un agente de aprendizaje Q.
2. **Medium。**Entrenamiento de un agente de aprendizaje DR Q, 采样 `slip ~ Uniform[0, 0.3]` evaluar el mismo grupo de barrido  en deslizamiento = 0,5  fuera de distribución) ¿Cuántos beneficios trajo DR?
3. **Hard。** Implementar un plan de estudios: desde el sli=0.0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

## 关键术语: "El hombre es un hombre"

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

##  más阅读

- [Tobin et al. (2017). Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World](https://arxiv.org/abs/1703.06907) Original DR papel  visión robótica)
- [Peng et al. (2018). Sim-to-Real Transfer of Robotic Control with Dynamics Randomization](https://arxiv.org/abs/1710.06537) dinámica de DR, movimiento cuadruplicado
- [OpenAI et al. (2019). Solving Rubik's Cube with a Robot Hand](https://arxiv.org/abs/1910.07113) Dactyl, ADR de gran tamaño
- [Miki et al. (2022). Learning robust perceptive locomotion for quadrupedal robots in the wild](https://www.science.org/doi/10.1126/scirobotics.abk2822) Animales de maestro-estudiante。
- [Makoviychuk et al. (2021). Isaac Gym: High Performance GPU Based Physics Simulation for Robot Learning](https://arxiv.org/abs/2108.10470) 驱动 20252026 despliegues masivamente paralelos sim¬¬
- [Akkaya et al. (2019). Automatic Domain Randomization](https://arxiv.org/abs/1910.07113) Método de programación de estudios de la RDA:
- [Sutton & Barto (2018). Ch. 8 — Planning and Learning with Tabular Methods](http://incompleteideas.net/book/RLbook2020.pdf) Enmarcado Dyna(Utilizar modelo hacer planificación + implementaciones),支现代 sim-to-real pipelines。
- [Zhao, Queralta & Westerlund (2020). Sim-to-Real Transfer in Deep Reinforcement Learning for Robotics: a Survey](https://arxiv.org/abs/2009.13303) Taxonomía de los métodos sim-to-real,并包含 resultados de referencia。
