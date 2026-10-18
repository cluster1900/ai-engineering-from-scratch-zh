# Otimizar as políticas próximas (PPO)

> A2C em uma atualização em seguida, é abandonado cada lançamento. O PPO usa o índice de importância reduzida para incluir o gradiente de política, de modo que você pode fazer mais de 10 épocas no mesmo volume de dados, sem deixar a política explodir. Schulman et al. (2017);; até 2026, continua a ser um algoritmo de graduação de política padrão.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~75 分钟

## 问题

A2C ((Lessão 07) é sobre política $\mathbb E_{\pi_\theta}[A \cdot \nabla \log \pi_\theta]$需要从*当前* $\pi_\theta$Depois de uma nova actualização,$\pi_\theta$Já mudou; os dados que usaste agora estão fora da política.

Rollout 很昂贵──在Atari上,跨 8 个 envs × 128 步骤的一次 rollout = 1024 步骤的转变,以及十几秒的环境时间──一次渐进步步 后就把它丢掉很浪费──

Otimizar as políticas da região de confiança (TRPO, Schulman 2015) é o primeiro programa de revisão:约束每次更新,使旧政策和新政策  KL divergência 保持在 $\delta$A teoria é muito clara, mas cada vez que a actualização é feita, é necessário uma solução conjugada-gradiente.

PPO(Schulman et al. 2017) substituiu a região de confiança de hardware 约束──只多一行代码──每次推出十个时代──不需要结合梯度──理论保证足够好──九年后,它仍然是从 MuJoCo到RLHF的默认政策-gradient 算法──

## 概念

![PPO clipped surrogate objective: ratio clipping at 1 ± ε](../assets/ppo.svg)

**Importance ratio。**

```math
r_t(\theta) = \frac{\pi_\theta(a_t \mid s_t)}{\pi_{\theta_{\text{old}}}(a_t \mid s_t)}
```

Esta é a relação de probabilidade entre a nova política e a política de recolha de dados.$r_t = 1$Não há mudança.$r_t = 2$Indicar nova política 选择 $a_t$A probabilidade é duas vezes maior que a política anterior.

**Clipped surrogate。**

```math
L^{\text{CLIP}}(\theta) = \mathbb{E}_t \left[ \min\left( r_t(\theta) A_t, \mathop{\mathrm{clip}}(r_t(\theta), 1-\epsilon, 1+\epsilon) A_t \right) \right]
```

∆ Dois elementos:

- Se vantagem $A_t > 0$, e a taxa 试图 crescer para exceder $1 + \epsilon$Não se preocupe com uma boa ação , não se preocupe com uma probabilidade maior do que a anterior .$+\epsilon$- Não.
- Se vantagem $A_t < 0$, e a taxa 试图 crescer para exceder $1 - \epsilon$(Significa redução em comparação com cortado, vamos fazer uma ação ruim mais possível acontecer), clip irá limitar Gradiente  Não colocar uma ação ruim  puxar para baixo $-\epsilon$- Não.

`min`处理另一个方向: se a relação 已朝*有益*方向移动, você ainda obtém Gradient ( não está em um lado desfavorável para você) 

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             $\epsilon = 0.2$- O objetivo é o que se passa.$r_t$Função: uma função linear de pedaço, em um lado bom, em outro lado plano, em outro lado ruim, em outro lado plano.

**完整的 PPO loss。**

```math
L(\theta, \phi) = L^{\text{CLIP}}(\theta) - c_v \cdot (V_\phi(s_t) - V_t^{\text{target}})^2 + c_e \cdot H(\pi_\theta(\cdot \mid s_t))
```

Comparado com A2C, a estrutura actor-crítica é de três fatores, normalmente são$c_v = 0.5$- Não.$c_e = 0.01$- Não.$\epsilon = 0.2$- Não.

**训练循环。**

1. 跨 $N$个 paralelo envs, cada运行 $T$Passo, recolha.$N \times T$个 transições。
2. 計算優勢 (GAE),并把它们结为常量──
3. - Não .$\pi_{\theta_{\text{old}}}$结为当前 $\pi_\theta$- É uma foto.
4. Para o$K$个 épocas, para cada um `(s, a, A, V_target, log π_old(a|s))`O minibatch:
   - 计算 $r_t(\theta) = \exp(\log \pi_\theta(a \mid s) - \log \pi_{\text{old}}(a \mid s))$- Não.
   -  aplicativo $L^{\text{CLIP}}$+ perda de valor + entropia。
   - Passo gradual.
5. Deixe o lançamento. Volte ao passo 1.

$K = 10$E 64 de mini-batches é um conjunto de hiperparâmetros padrão.

**KL-penalty 变体。**O artigo original propôs um esquema alternativo, usando a penalidade KL adaptativa:$L = L^{\text{PG}} - \beta \cdot \mathrm{KL}(\pi_\theta \Vert \pi_{\text{old}})$, entre os $\beta$De acordo com a observação KL 调整──Clipping 版本成为主流; KL 变体在RLHF保留下来((在那里,到参考政策的 KL 本来就是一个你始终想要的独立约束)


```figure
ppo-clip
```

## Construí-lo

### Passo 1: Captura durante o lançamento`log π_old(a | s)`

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

Imagem apenas na implementação, obtenção de uma vez. Não vai mudar durante as épocas de atualização.

### Passo 2: calcular as vantagens do GAE (Lessão 07)

Com A2C 相同── 跨批 归一化──

### Passo 3: Atualização de substituição cortada

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

Clipped → zero gradient  模式 é o núcleo da PPO.

### Passo 4: Valor e entropia

给评论员 添加标准 MSE,并给演员 添加 entropia bonus,与A2C 相同──

### Passo 5: Diagnóstico

Cada vez que eu faço uma nova coisa, tenho que ver três coisas:

- **Mean KL** $\mathbb{E}[\log \pi_{\text{old}} - \log \pi_\theta]$❖ Deve ficar em `[0, 0.02]`Se exceder`0.1`, reduzir`K_EPOCHS`Ou `LR`- Não.
- **Clip fraction** ratio 落在 $[1-\epsilon, 1+\epsilon]$- Existem amostras de fora, por exemplo.`~0.1-0.3`Se é assim.`~0`,Clip 从未触发 → 提高 `LR`Ou `K_EPOCHS`Se é assim.`~0.5+`Estás a passar-te a esta exposição →  reduzi-las 
- **Explained variance** $1 - \text{Var}(V_{\text{target}} - V_{\text{pred}}) / \text{Var}(V_{\text{target}})$❖ Critical 质量指标── com o aprendizado crítico, deve subir para 1 ⋅

## 陷

- **Clip coefficient 调错。** $\epsilon = 0.2$É um facto.`0.1`会让更新过保守;`0.3+`Vai haver uma incerteza.
- **Epochs 太多。** $K > 20$ frequentemente fazer o treino inestabilizar, porque a política 漂离 $\pi_{\text{old}}$                                                                                                                                                                                                                                                              
- **没有 reward normalization。**Mas, a maior parte das vezes, os resultados são de uma forma diferente.
- **忘记 advantage normalization。**A normalização de média zero/unidade-std por lote é uma prática padrão.
- **Learning rate 没有衰减。**PPO 受益于线性 LR 衰减到零──Constant LR 往往更差──
- **Importance ratio 数学错误。**始终使用                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `exp(log_new - log_old)`- Não .`new / old`- Não.
- **Gradient sign 错误。**Maximization surrogate = * minimization* $-L^{\text{CLIP}}$◊ 符号翻转是最常见的PPO bug──

## Use-o

O PPO é um algoritmo de RL em 2026 em áreas consideráveis:

| Use case | PPO variant |
|----------|-------------|
| MuJoCo / robotics control | PPO with Gaussian policy, GAE(0.95) |
| Atari / discrete games | PPO with categorical policy, rolling 128-step rollouts |
| RLHF for LLMs | PPO with KL penalty to reference model, reward from RM at end of response |
| Large-scale game agents | IMPALA + PPO (AlphaStar, OpenAI Five) |
| Reasoning LLMs | GRPO (Lesson 12) — PPO variant without critic |
| Preference-only data | DPO — closed-form collapsing of PPO+KL, no online sampling |

A forma de perda do PPO é o substituto de valor + entropia, é o DPO, o GRPO e quase todos os RLHF.

## Entrega-o

保存为 `outputs/skill-ppo-trainer.md`- Não .

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

1. **简单。**Em 4×4 GridWorld 上运行 PPO, usar $\epsilon=0.2, K=4$◊ Em caso de medidas de ambiente de correspondência, a eficiência da amostra em relação ao A2C (a) por implantação de uma época (a)
2. **中等。**Esvaziar$K \in \lbrace 1, 4, 10, 30 \rbrace$ desenhar os passos de retorno versus env,并跟踪 cada vez actualizar o meio KL──$K$Até quando o KL explodirá?
3. **困难。**Usar a penalidade adaptativa KL  substituir o substituto cortado $\mathrm{KL} > 2 \cdot \text{target}$- Não .$\beta$翻倍; se $\mathrm{KL} < \text{target}/2$- Não .$\beta$减半) ・Compare retorno final, estabilidade, e não-clip-free­ness.

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| Importance ratio | "r_t(θ)" | $\pi_\theta(a \mid s) / \pi_{\text{old}}(a \mid s)$；相对于采集数据的 policy 的偏离程度。 |
| Clipped surrogate | "PPO's main trick" | $\min(r \cdot A, \mathop{\mathrm{clip}}(r, 1-\epsilon, 1+\epsilon) \cdot A)$；在有益侧超过 clip 后 Gradient 变平。 |
| Trust region | "TRPO / PPO intent" | 限制每次更新的 KL，以保证 monotone improvement。 |
| KL penalty | "Soft trust region" | 替代 PPO：$L - \beta \cdot \mathrm{KL}(\pi_\theta \Vert \pi_{\text{old}})$。Adaptive $\beta$。 |
| Clip fraction | "How often clipping triggers" | Diagnostic —— 应该是 0.1-0.3；超出范围表示调参错误。 |
| Multi-epoch training | "Data reuse" | 每次 rollout 上跑 K 个 epochs；用 variance cost 换 sample efficiency。 |
| On-policy-ish | "Mostly on-policy" | PPO 名义上是 on-policy，但 K>1 个 epochs 会安全地使用 slightly-off-policy data。 |
| PPO-KL | "The other PPO" | KL-penalty 变体；用于 RLHF，因为 KL-to-reference 已经是一个约束。 |

## 延伸阅读

- [Schulman et al. (2017). Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347) 论文──
- [Schulman et al. (2015). Trust Region Policy Optimization](https://arxiv.org/abs/1502.05477) TRPO,PPO's前身──
- [Andrychowicz et al. (2021). What Matters In On-Policy RL? A Large-Scale Empirical Study](https://arxiv.org/abs/2006.05990) Para cada hiperparâmetro PPO fazer ablação
- [Ouyang et al. (2022). Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) InstruçãoGPT;PPO-in-RLHF 配方。
- [OpenAI Spinning Up — PPO](https://spinningup.openai.com/en/latest/algorithms/ppo.html) 使用 PyTorch 的清晰现代讲解──
- [CleanRL PPO implementation](https://github.com/vwxyzjn/cleanrl) 很多论文使用的参考单档PPO──
- [Hugging Face TRL — PPOTrainer](https://huggingface.co/docs/trl/main/en/ppo_trainer) Em modelos de linguagem 上使用PPO的生产配方;请和课09(RLHF)一起阅读──
- [Engstrom et al. (2020). Implementation Matters in Deep Policy Gradients](https://arxiv.org/abs/2005.12729) 37 Optimização de nível de código 论文; quais os truques de PPO são suportados, quais são apenas folclore
