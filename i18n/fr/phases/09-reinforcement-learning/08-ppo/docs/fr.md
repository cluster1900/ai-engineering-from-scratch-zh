# Optimisation des politiques proximales (PPO)

> A2C, après une mise à jour, abandonne chaque déploiement. Utilisez un ratio d'importance réduit pour inclure un gradient de politique, de sorte que vous puissiez faire plus de 10 périodes sur le même volume de données, sans faire exploser la politique. Schulman et al. (2017);; Jusqu'en 2026, il reste un algorithme de gradation de politique par défaut.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~75 分钟

##  problématique

A2C(L'enseignement 07) est en politique`E_{π_θ}[A · ∇ log π_θ]`需要从*当前* `π_θ`Après avoir mis à jour une fois,`π_θ`Les données que vous utilisez sont désormais hors de la politique.

Le déploiement est très coûteux. Sur Atari, à travers 8 envs × 128 étapes, une déploiement = 1024 transitions, ainsi que 10 secondes de temps environnementaux.

Optimisation des politiques de la région de confiance (TRPO, Schulman 2015) est le premier programme de révision:约束每次更新, rendre la politique ancienne et la nouvelle politique divergent entre les pays de l'Asie centrale et orientale 保持在`δ`En théorie, il est très clair, mais chaque mise à jour nécessite une solution conjuguée-gradiente.

PPO(Schulman et coll. 2017) a remplacé la région de confiance de la rigidité 约束──只多一行代码── à chaque déploiement 十个时代──不需要结合梯度──理论保证足够好──九年后, elle est encore un algorithme de politique-gradient par défaut de MuJoCo à RLHF──

## 概念

![PPO clipped surrogate objective: ratio clipping at 1 ± ε](../assets/ppo.svg)

**Importance ratio。**

`r_t(θ) = π_θ(a_t | s_t) / π_{θ_old}(a_t | s_t)`

C'est le rapport de probabilité entre la nouvelle politique et la politique de collecte de données.`r_t = 1`Indique pas de changement.`r_t = 2`Indiquer une nouvelle politique 选择 `a_t`La probabilité est deux fois supérieure à l'ancienne politique.

**Clipped surrogate。**

`L^{CLIP}(θ) = E_t [ min( r_t(θ) A_t, clip(r_t(θ), 1-ε, 1+ε) A_t ) ]`

∆ Deux éléments:

- Si l' avantage `A_t > 0`, et le ratio 试图增长到超过 `1 + ε`, clip de la mise en place de la pression de la mise en place de la mise en place de la bonne action de la mise en place de la probabilité de la mise en place de la bonne action de la mise en place de la bonne action de la mise en place de la mise en place de la bonne action de la mise en place de la mise en place de la bonne action de la mise en place de la bonne action de la mise en place de la bonne action de la mise en place de la bonne action de la mise en place de la bonne action de la mise en place de la bonne`+ε`Je suis là.
- Si l' avantage `A_t < 0`, et le ratio 试图增长到超过 `1 - ε`(en termes de réduction par rapport à coup, nous allons faire une mauvaise action plus possible de se produire), clip sera limiter Gradient  Ne pas mettre une mauvaise action  pousser à bas de `-ε`Il y a une autre.

`min`处理另一个方向: si le ratio 已朝*有益*方向移动, vous obtenez toujours Gradient (will not be on your adverse side clipping) 

La valeur typique est `ε = 0.2`◊ ≠ ∞ ∞ ∞`r_t`La fonction de la pièce est une fonction linéaire, sur le bon côté, il y a une partie supérieure plate, sur le mauvais côté, il y a une partie inférieure plate.

**完整的 PPO loss。**

`L(θ, φ) = L^{CLIP}(θ) - c_v · (V_φ(s_t) - V_t^{target})² + c_e · H(π_θ(·|s_t))`

La structure acteur-critique comparable à A2C, trois facteurs, généralement:`c_v = 0.5`- Je suis là.`c_e = 0.01`- Je suis là.`ε = 0.2`Il y a une autre.

**训练循环。**

1. 跨 `N`个 environnements parallèles, chaque fonctionnement `T`Les étapes, la collecte `N × T`Les transitions.
2. 計算優勢 (GAE),并把它们结为常量──
3. Je ne sais pas .`π_{θ_old}`结为当前 `π_θ`Une photo de l'instant.
4. Pour le`K`个 époques, à chacun `(s, a, A, V_target, log π_old(a|s))`Le minibatch:
   - 计算 `r_t(θ) = exp(log π_θ(a|s) - log π_old(a|s))`Il y a une autre.
   -  appli `L^{CLIP}`+ perte de valeur + entropie。
   - Pas de grade.
5. J'ai abandonné le déploiement.

`K = 10`Et les mini-parties de 64 sont un groupe d'hyperparamètres standards.

**KL-penalty 变体。**Le premier article propose une alternative, en utilisant une pénalité KL adaptative:`L = L^{PG} - β · KL(π_θ || π_old)`, parmi lesquels `β`根据观察 KL 调整──Clipping 版本成为主流; KL 变体在RLHF保留下来((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((


```figure
ppo-clip
```

## - Je le construis.

### Étape 1: lors du déploiement`log π_old(a | s)`

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

L'instant-immédiat n'est obtenu qu'une fois lors du déploiement.

### Étape 2: calculer les avantages de l'AEG (leçon 07)

Avec A2C 相同──跨批 归一化──

### Étape 3: Mise à jour de substitution coupée

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

Clipped → Zero gradient  Mode est au cœur de la PPO. Si la nouvelle politique est déjà trop éloignée dans une direction bénéfique, la mise à jour s'arrêtera 

### Étape 4: valeur et entropie

给评论家目标 添加标准 MSE,并给演员 添加 entropie bonus,与A2C 相同──

### Étape 5: Diagnostics

Chaque nouvelle doit observer trois choses:

- **Mean KL** `E[log π_old - log π_θ]`Il faut rester là.`[0, 0.02]` Si plus `0.1`, détriment`K_EPOCHS`Ou `LR`Il y a une autre.
- **Clip fraction** ratio 落在 `[1-ε, 1+ε]`Les échantillons externes, par exemple, devraient être`~0.1-0.3`Si c'est le cas.`~0`, clip 从未触发 → 提高 `LR`Ou `K_EPOCHS`Si c'est le cas.`~0.5+`Tu fais trop de déploiement pour les réduire.
- **Explained variance** `1 - Var(V_target - V_pred) / Var(V_target)`◊ Critic 质量指标── Avec le critique apprenant, devrait augmenter à 1

## La trappe

- **Clip coefficient 调错。** `ε = 0.2`C'est le cas de la réputation.`0.1`La mise à jour sera trop conservée;`0.3+`Il y aura une instabilité.
- **Epochs 太多。** `K > 20`经常会让训练不稳定,因为政策 漂离 `π_old`Il est très difficile de limiter les périodes, en particulier pour les grands réseaux.
- **没有 reward normalization。**Les écailles de récompense seront utilisées pour la réalisation de la réalisation des objectifs de la récompense.
- **忘记 advantage normalization。**La normalisation par lot de zéro moyenne/unité est une pratique standard.
- **Learning rate 没有衰减。**L'OPP bénéficie de LR de ligne  déclin à zéro―.
- **Importance ratio 数学错误。**始终使用 `exp(log_new - log_old)`, au lieu de `new / old`Il y a une autre.
- **Gradient sign 错误。**Maximumisation de la substitution = * minimisation* `-L^{CLIP}`◊ 符号翻转是最常见的PPO bug──

## Utilisez-le

Le PPO est un algorithme de RL standard dans de nombreux domaines:

| Use case | PPO variant |
|----------|-------------|
| MuJoCo / robotics control | PPO with Gaussian policy, GAE(0.95) |
| Atari / discrete games | PPO with categorical policy, rolling 128-step rollouts |
| RLHF for LLMs | PPO with KL penalty to reference model, reward from RM at end of response |
| Large-scale game agents | IMPALA + PPO (AlphaStar, OpenAI Five) |
| Reasoning LLMs | GRPO (Lesson 12) — PPO variant without critic |
| Preference-only data | DPO — closed-form collapsing of PPO+KL, no online sampling |

La forme de perte de PPO  coupée surrogée + valeur + entropie  est DPO、GRPO ainsi que presque tous les RLHF pipeline 脚手架。

## Je le livre.

保存为 `outputs/skill-ppo-trainer.md`- Le numéro de la liste:

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

## 练习

1. **简单。**Dans le réseau 4×4 World 上运行 PPO, utiliser `ε=0.2, K=4`Dans le cas des étapes de l'environnement de correspondance, l'efficacité de l'échantillon par rapport à A2C (environ une époque) par déploiement
2. **中等。**- Le balayage .`K ∈ {1, 4, 10, 30}` Traiter les étapes retour vers l'env, et suivre chaque mise à jour de la moyenne KL── sur cette tâche,`K`À quelle heure KL va exploser ?
3. **困难。**Avec une pénalité KL adaptative , remplacer le remplaçant coupé , si`KL > 2·target`- Je suis désolé .`β`翻倍; si `KL < target/2`- Je suis désolé .`β`减半) ・ comparer le rendement final, la stabilité et la non-clip­

## 关键术语

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

- [Schulman et al. (2017). Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347) 论文。
- [Schulman et al. (2015). Trust Region Policy Optimization](https://arxiv.org/abs/1502.05477) TRPO, PPO 
- [Andrychowicz et al. (2021). What Matters In On-Policy RL? A Large-Scale Empirical Study](https://arxiv.org/abs/2006.05990) Faire une ablation pour chaque hyperparamètre PPO
- [Ouyang et al. (2022). Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) InstructGPT;PPO-in-RLHF 配方。
- [OpenAI Spinning Up — PPO](https://spinningup.openai.com/en/latest/algorithms/ppo.html) 使用 PyTorch 的清晰现代讲解──
- [CleanRL PPO implementation](https://github.com/vwxyzjn/cleanrl) 很多论文使用的参考单档PPO──
- [Hugging Face TRL — PPOTrainer](https://huggingface.co/docs/trl/main/en/ppo_trainer) Dans les modèles de langage 上使用PPO的生产配方;请和课09(RLHF)一起阅读──
- [Engstrom et al. (2020). Implementation Matters in Deep Policy Gradients](https://arxiv.org/abs/2005.12729) 37 Optimisations au niveau du code 论文; quelles sont les astuces de PPO qui sont à la hauteur de la structure, quelles sont simplement le folklore
