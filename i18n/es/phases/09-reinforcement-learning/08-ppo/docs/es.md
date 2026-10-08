# Optimización de las políticas de proximidad (PPO)

> A2C en una actualización deja cada implementación. APPO utiliza una proporción de importancia reducida para incluir un gradiente de política, de modo que puede hacer más de 10 épocas en el mismo grupo de datos, sin dejar que la política explote. Schulman et al. (2017);; hasta 2026 años, sigue siendo un algoritmo de gradiente de política estándar.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~75 分钟

##  problemas

A2C(Ley 07) es sobre política de: Gradiente `E_{π_θ}[A · ∇ log π_θ]`需要从*当前* `π_θ`采样数据── hacer una actualización después,`π_θ`Ya ha cambiado; los datos que acabas de usar ahora están fuera de política.

En Atari, a través de 8 envs × 128 pasos, una vez se lanzan = 1024 transiciones, así como un tiempo ambiental de 10 segundos.

Optimización de la política de la región de confianza (TRPO, Schulman 2015) es el primer programa de modificación:约束每次更新,使旧政策和新政策  KL divergencia 保持在 `δ`En teoría, esto es bastante claro, pero cada vez que se actualiza se necesita una solución conjugada-gradiente.

PPO(Schulman et al. 2017) con un objetivo simple cortado  sustituyó la región de confianza de la dureza 约束──只多一行代码── cada vez que se lanzó 十个时代──不需要结合梯梯──理论保证足够好──九年后, sigue siendo el algoritmo de política-gradiente estándar de MuJoCo hasta RLHF──

## 概念

![PPO clipped surrogate objective: ratio clipping at 1 ± ε](../assets/ppo.svg)

**Importance ratio。**

`r_t(θ) = π_θ(a_t | s_t) / π_{θ_old}(a_t | s_t)`

Esta es la relación de probabilidad entre la nueva política y la política de recopilación de datos.`r_t = 1`Se muestra sin cambios.`r_t = 2`Indicar nueva política 选择 `a_t`La probabilidad es el doble de la antigua política.

**Clipped surrogate。**

`L^{CLIP}(θ) = E_t [ min( r_t(θ) A_t, clip(r_t(θ), 1-ε, 1+ε) A_t ) ]`

∆ Dos elementos:

- Si la ventaja `A_t > 0`, y la proporción 试图 crecer hasta superar `1 + ε`, clip se va a poner Gradiente                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     `+ε`Más allá de esto.
- Si la ventaja `A_t < 0`, y la proporción 试图 crecer hasta superar `1 - ε`(Significa una reducción en comparación con un recorte, vamos a hacer que una mala acción más posible ocurra),Clip se limitará Gradiente  No hay que poner una mala acción `-ε`¿Qué es eso?

`min`处理另一个方向: si la relación 已朝*有益*方向移动, tú todavía obtienes Gradient (no estarás en un lado desfavorable) 

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `ε = 0.2`◊把 objetivo 画成 `r_t`Función de pieza: una función lineal, en un lado bueno, en un lado malo, en un lado malo, en un lado malo, en un lado malo.

**完整的 PPO loss。**

`L(θ, φ) = L^{CLIP}(θ) - c_v · (V_φ(s_t) - V_t^{target})² + c_e · H(π_θ(·|s_t))`

Con A2C comparable actor-crítica estructura ⋅ tres系数, normalmente es `c_v = 0.5`¿Qué es esto?`c_e = 0.01`¿Qué es esto?`ε = 0.2`¿Qué es eso?

**训练循环。**

1. 跨 `N`个 paralelo envs, cada uno de ellos `T`pasos, recoger `N × T`个 transiciones。
2. 计算优势 (GAE),并把它们结为常量──
3. ¿ Qué ?`π_{θ_old}`结为当前 `π_θ`Una instantánea.
4. ¿ Qué ?`K`个 épocas, para cada uno `(s, a, A, V_target, log π_old(a|s))`De minibatch:
   - 计算 `r_t(θ) = exp(log π_θ(a|s) - log π_old(a|s))`¿Qué es eso?
   -  aplicación `L^{CLIP}`+ pérdida de valor + entropía。
   - Paso gradual.
5.  Abandonar el despliegue―  Volver al paso 1―

`K = 10`Y 64 de los minibatches es un grupo de hiperparámetros estándar.

**KL-penalty 变体。**El original artículo propuso un esquema alternativo, utilizando una penalidad KL adaptativa:`L = L^{PG} - β · KL(π_θ || π_old)`, entre ellos `β`Según lo observado KL 调整──Clipping 版本成为主流; KL 变体在RLHF保留下来(((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((


```figure
ppo-clip
```

## Construirlo

### Paso 1: En el despliegue  capturar `log π_old(a | s)`

```python
for step in range(T):
    probs = softmax(logits(theta, state_features(s)))
    a = sample(probs, rng)
    s_next, r, done = env.step(s, a)
    buffer.append({
        "s": s, "a": a, "r": r, "done": done,
        "v_old": value(w, state_features(s)),
        "log_pi_old": log(probs[a] + 1e-12),
    })
    s = s_next
```

Imágenes sólo se obtienen en el rollout una vez. No cambiará durante las épocas de actualización.

### Paso 2: calcular las ventajas de la GAE (lección 07)

Con A2C 相同──跨批 归一化──

### Paso 3: actualización de sustituta eliminada

```python
for _ in range(K_EPOCHS):
    for mb in minibatches(buffer, size=64):
        for rec in mb:
            x = state_features(rec["s"])
            probs = softmax(logits(theta, x))
            logp = log(probs[rec["a"]] + 1e-12)
            ratio = exp(logp - rec["log_pi_old"])
            adv = rec["advantage"]
            surrogate = min(
                ratio * adv,
                clamp(ratio, 1 - EPS, 1 + EPS) * adv,
            )
            # backprop -surrogate, 添加 value loss, 减去 entropy
            grad_logpi = onehot(rec["a"]) - probs
            if (adv > 0 and ratio >= 1 + EPS) or (adv < 0 and ratio <= 1 - EPS):
                pg_grad = 0.0  # clipped
            else:
                pg_grad = ratio * adv
            for i in range(N_ACTIONS):
                for j in range(N_FEAT):
                    theta[i][j] += LR * pg_grad * grad_logpi[i] * x[j]
```

Clipped → Zero gradient  模式 es el núcleo de PPO.  Si la nueva política  ya se ha movido demasiado lejos en una dirección beneficiosa, la actualización se detendrá

### Paso 4: Valor y entropía

给评论目标 添加标准 MSE,并给演员 添加 entropies bonuses,与A2C 相同──

### Paso 5: Diagnóstico

Cada vez que se actualiza hay tres cosas que ver:

- **Mean KL** `E[log π_old - log π_θ]`❖ Debería mantenerse en `[0, 0.02]`Si excede`0.1`, bajar`K_EPOCHS`O `LR`¿Qué es eso?
- **Clip fraction** ratio 落在 `[1-ε, 1+ε]` Exteriores muestras por ejemplo― debería ser `~0.1-0.3`Si es así.`~0`, clip 从未触发 → 提高 `LR`O `K_EPOCHS`Si es así.`~0.5+`, estás sobre-ajustando este despliegue → reducirlos.
- **Explained variance** `1 - Var(V_target - V_pred) / Var(V_target)`◊ Critical 质量指标── Con el tiempo que el crítico aprende, debería subir a 1.

## 陷

- **Clip coefficient 调错。** `ε = 0.2`Es un hecho.`0.1`¿Qué se puede hacer con la actualización?`0.3+`La situación se ha vuelto inestable.
- **Epochs 太多。** `K > 20`经常会让训练不稳定,因为 la política 漂离 `π_old`太远──限制时代, especialmente para las redes de gran tamaño.
- **没有 reward normalization。**Las escalas de recompensa de la serie de clipes serán absorbidas en el cálculo de las ventajas de la serie de recompensas.
- **忘记 advantage normalization。**La normalización de la media cero/unidad-std por lote es una práctica estándar.
- **Learning rate 没有衰减。**PPO recibe el beneficio de LR lineal  disminución a zero。 LR constante 往往更差。
- **Importance ratio 数学错误。**为了数值稳定,始终使用 `exp(log_new - log_old)`, en lugar de`new / old`¿Qué es eso?
- **Gradient sign 错误。**Maximization surrogate = * minimization* `-L^{CLIP}`◊ 符号翻转是最常见的PPO bug──

## Usalo

PPO es un algoritmo de RL de 2026 en un gran número de áreas:

| Use case | PPO variant |
|----------|-------------|
| MuJoCo / robotics control | PPO with Gaussian policy, GAE(0.95) |
| Atari / discrete games | PPO with categorical policy, rolling 128-step rollouts |
| RLHF for LLMs | PPO with KL penalty to reference model, reward from RM at end of response |
| Large-scale game agents | IMPALA + PPO (AlphaStar, OpenAI Five) |
| Reasoning LLMs | GRPO (Lesson 12) — PPO variant without critic |
| Preference-only data | DPO — closed-form collapsing of PPO+KL, no online sampling |

La forma de pérdida de PPO  Cliped surrogate + value + entropy  es DPO、GRPO y casi todos los RLHF pipeline 脚手架。

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-ppo-trainer.md`¿Qué es esto ?

```markdown
---
name: ppo-trainer
description: 为给定环境生成 PPO training config 和 diagnostic plan。
version: 1.0.0
phase: 9
lesson: 8
tags: [rl, ppo, policy-gradient]
---

给定一个 environment 和 training budget，输出：

1. Rollout size。`N` envs × `T` steps。
2. Update schedule。`K` epochs、minibatch size、LR schedule。
3. Surrogate params。`ε`（clip）、`c_v`、`c_e`，开启 advantage normalization。
4. Advantage。GAE(`λ`)，显式给出 `γ` 和 `λ`。
5. Diagnostics plan。KL、clip fraction、explained variance thresholds 与 alerts。

拒绝 `K > 30` 或 `ε > 0.3`（unsafe trust region）。拒绝任何没有 advantage normalization 或 KL/clip monitoring 的 PPO run。把 clip fraction 持续高于 0.4 标记为 drift。
```

##  ejercicios

1. **简单。**En 4×4 GridWorld 上运行 PPO, usar `ε=0.2, K=4`◊ en el caso de los pasos de env de la adaptación, la eficiencia de la muestra en comparación con A2C (en una época de implementación)
2. **中等。**Especialización`K ∈ {1, 4, 10, 30}` Trazar los pasos de retorno vs env,并跟踪 cada actualización de la media KL── en esta tarea,`K`¿Cuánto tiempo falta para que explode KL?
3. **困难。**Usó una penalidad adaptativa KL  sustituyendo a un sustituto recortado `KL > 2·target`¿ Qué ?`β`翻倍; si `KL < target/2`¿ Qué ?`β`减半) ・Compare el rendimiento final, estabilidad y libre de clipes

## 关键术语: "El hombre es un hombre"

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| Importance ratio | "r_t(θ)" | `π_θ(a\|s) / π_old(a\|s)`；相对于采集数据的 policy 的偏离程度。 |
| Clipped surrogate | "PPO's main trick" | `min(r·A, clip(r, 1-ε, 1+ε)·A)`；在有益侧超过 clip 后 Gradient 变平。 |
| Trust region | "TRPO / PPO intent" | 限制每次更新的 KL，以保证 monotone improvement。 |
| KL penalty | "Soft trust region" | 替代 PPO：`L - β · KL(π_θ \|\| π_old)`。Adaptive `β`。 |
| Clip fraction | "How often clipping triggers" | Diagnostic —— 应该是 0.1-0.3；超出范围表示调参错误。 |
| Multi-epoch training | "Data reuse" | 每次 rollout 上跑 K 个 epochs；用 variance cost 换 sample efficiency。 |
| On-policy-ish | "Mostly on-policy" | PPO 名义上是 on-policy，但 K>1 个 epochs 会安全地使用 slightly-off-policy data。 |
| PPO-KL | "The other PPO" | KL-penalty 变体；用于 RLHF，因为 KL-to-reference 已经是一个约束。 |

## 延伸阅读

- [Schulman et al. (2017). Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347) 论文──
- [Schulman et al. (2015). Trust Region Policy Optimization](https://arxiv.org/abs/1502.05477) TRPO, PPO de la anterior persona
- [Andrychowicz et al. (2021). What Matters In On-Policy RL? A Large-Scale Empirical Study](https://arxiv.org/abs/2006.05990) Hacer ablación para cada hiperparámetro PPO
- [Ouyang et al. (2022). Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) InstrucciónGPT;PPO en el RLHF 配方。
- [OpenAI Spinning Up — PPO](https://spinningup.openai.com/en/latest/algorithms/ppo.html) 使用 PyTorch 的清晰现代讲解──
- [CleanRL PPO implementation](https://github.com/vwxyzjn/cleanrl) 很多论文使用的 referencia de un solo archivo PPO──
- [Hugging Face TRL — PPOTrainer](https://huggingface.co/docs/trl/main/en/ppo_trainer) En modelos de lenguaje 上使用PPO的生产配方;请和课09(RLHF)一起阅读──
- [Engstrom et al. (2020). Implementation Matters in Deep Policy Gradients](https://arxiv.org/abs/2005.12729) 37 optimizaciones de nivel de código 论文; ¿qué trucos de PPO es soportar la estructura, qué son simplemente folclore
