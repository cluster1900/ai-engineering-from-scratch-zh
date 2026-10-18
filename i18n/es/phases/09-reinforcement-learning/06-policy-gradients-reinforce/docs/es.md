# Políticas Gradiente  Desde el cero lograr REINFORCE

> 停止估值──直接参数化政策,计算预期回报的渐变,然后沿上坡方向更新──Williams (1992) utiliza un teorema 写清了它──这是PPO、GRPO以及每个LLM RL循环的存在原因──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 03 (Backpropagation), Phase 9 · 03 (Monte Carlo), Phase 9 · 04 (TD Learning)
**Time:** ~75 分钟

##  problemas

Q-aprendizaje y DQN parametrize de la es *valor* función──你通过 `argmax Q`选择行动――这对离散行动 和离散状态 没有问题――但是当行动是连续时就会失效`argmax`¿), o cuando quieras una política estocástica también fallará`argmax`按构造就是决定性)

Los gradientes de política 改为 parámetrizan *política*。$\pi_\theta(a \mid s)$Es una red neuronal, la distribución de la acción de salida y salida de la muestra para tomar acción.$\theta$La evolución de la evolución de la población en la actualidad es un fenómeno que se ha visto en la actualidad.`argmax`No hay recursión de Bellman. Sólo para.$J(\theta) = \mathbb E_{\pi_\theta}[G]$Hacer una ascensión gradual.

Teorema de la Refuerza (Williams 1992)  te dice este Gradiente es calculable:$\nabla J(\theta) = \mathbb E_\pi[ G \cdot \nabla_\theta \log \pi_\theta(a \mid s) ]$◊运行一个节目――计算回来――把每一步的 ◊$\nabla \log \pi_\theta(a \mid s)$乘以回归──取平均──做 Gradiente-ascenso──完成──

Cada algoritmo LLM-RL del año 2026:PPO、DPO、GRPO, son refinamientos de REINFORCE, es el siguiente contenido de la fase, así como el requisito previo de la fase 10 · 07 (implementación del RLHF) y la fase 10 · 08 (DPO).

## 概念

![Policy gradient: softmax policy, log-π gradient, return-weighted update](../assets/policy-gradient.svg)

**Policy gradient theorem。**Para cualquier$\theta$política de parámetros $\pi_\theta$¿Qué es esto ?

```math
\nabla J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}[ \sum_{t=0}^{T} G_t \cdot \nabla_\theta \log \pi_\theta(a_t \mid s_t) ]
```

Entre ellos $G_t = \sum_{k=t}^{T} \gamma^{k-t} r_{k+1}$Es un paso .$t$开始的折扣回报──预期是从 $\pi_\theta$la muestra de trayectorias completas $\tau$Lo que se ha conseguido.

**证明很短。**En la expectativa, abajo hacia abajo.$J(\theta) = \sum_\tau P(\tau; \theta) G(\tau)$求导──使用 $\nabla P(\tau; \theta) = P(\tau; \theta) \nabla \log P(\tau; \theta)$(truc de los derivados de registro)―分解 $\log P(\tau; \theta) = \sum \log \pi_\theta(a_t \mid s_t) + \text{environment terms that do not depend on } \theta$△ los términos ambientales desaparecen.

**Variance reduction 技巧。**La variación de la vanilla REINFORCE es muy alta: los retornos son ruidosos,$\nabla \log \pi$Es ruidoso, su multiplicidad es muy ruidosa.

1. **Baseline subtraction。**Dependiendo de cualquier otra opción$a_t$de la línea de base $b(s_t)$,把 $G_t$替换成   cambió$G_t - b(s_t)$Es imparcial, porque...$\mathbb{E}[b(s_t) \cdot \nabla \log \pi(a_t \mid s_t)] = 0$❖ típico: por el crítico 学到的 $b(s_t) = \hat{V}(s_t)$→ actor-crítico (LECCIÓN 07)
2. **Reward-to-go。**¿ Qué ?$\sum_t G_t \cdot \nabla \log \pi_\theta(a_t \mid s_t)$替换成   cambió$\sum_t G_t^{\text{from } t} \cdot \nabla \log \pi_\theta(a_t \mid s_t)$ Para una determinada acción, sólo el futuro retorna 相关, las recompensas pasadas sólo contribuirá a ruido cero-medio 

¿Cómo se puede hacer?

```math
\nabla J \approx (1/N) \sum_{i=1}^{N} \sum_{t=0}^{T_i} [ G_t^{(i)} - \hat{V}(s_t^{(i)}) ] \cdot \nabla_\theta \log \pi_\theta(a_t^{(i)} \mid s_t^{(i)})
```

Éste es el refuerzo de la línea de base, también el ancestro directo de A2C (lección 07) y PPO (lección 08).

**Softmax policy parameterization。**Para las acciones discretas, el estándar de selección es:

```math
\pi_\theta(a \mid s) = \exp(f_\theta(s, a)) / \sum_{a'} \exp(f_\theta(s, a'))
```

Entre ellos $f_\theta$Es cualquier acción que haga un resultado en la red neuronal.

```math
\nabla_\theta \log \pi_\theta(a \mid s) = \nabla_\theta f_\theta(s, a) - \sum_{a'} \pi_\theta(a' \mid s) \nabla_\theta f_\theta(s, a')
```

También es que el resultado de la acción ha sido tomado desdecubierto de su valor esperado en la política .

**用于 continuous actions 的 Gaussian policy。** $\pi_\theta(a \mid s) = N(\mu_\theta(s), \sigma_\theta(s))$¿Qué es eso?$\nabla \log N(a; \mu, \sigma)$Hay forma cerrada. Esto es todo lo que necesita el SAC de la Fase 9 · 07


```figure
policy-gradient-landscape
```

## Construye el mismo

### Paso 1: red de políticas softmax

```python
def policy_logits(theta, state_features):
    return [dot(theta[a], state_features) for a in range(N_ACTIONS)]

def softmax(logits):
    m = max(logits)
    exps = [exp(l - m) for l in logits]
    Z = sum(exps)
    return [e / Z for e in exps]
```

Para el env tablar Use linear policy (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en)

### Paso 2: muestreo y probabilidad de registro

```python
def sample_action(probs, rng):
    x = rng.random()
    cum = 0
    for a, p in enumerate(probs):
        cum += p
        if x <= cum:
            return a
    return len(probs) - 1

def log_prob(probs, a):
    return log(probs[a] + 1e-12)
```

### Paso 3: despliegue con log-probes capturados

```python
def rollout(theta, env, rng, gamma):
    trajectory = []
    s = env.reset()
    while not done:
        logits = policy_logits(theta, s)
        probs = softmax(logits)
        a = sample_action(probs, rng)
        s_next, r, done = env.step(s, a)
        trajectory.append((s, a, r, probs))
        s = s_next
    return trajectory
```

### Paso 4: actualización de la REINFORCE

```python
def reinforce_step(theta, trajectory, gamma, lr, baseline=0.0):
    returns = compute_returns(trajectory, gamma)
    for (s, a, _, probs), G in zip(trajectory, returns):
        advantage = G - baseline
        grad_log_pi_a = [-p for p in probs]
        grad_log_pi_a[a] += 1.0
        for i in range(N_ACTIONS):
            for j in range(len(s)):
                theta[i][j] += lr * advantage * grad_log_pi_a[i] * s[j]
```

Gradiente $\nabla \log \pi(a \mid s) = e_a - \pi(\cdot \mid s)$(El artículo$a$La unehot reducción de probabilidades) es el núcleo de los gradientes de política de softmax.

### Paso 5: líneas de base

Los episodios recientes de$G$取 running mean, ya suficiente para hacer 4×4 GridWorld  run up; aproximadamente necesita 500 episodios 收──把 baseline 升级为学习 $\hat{V}(s)$, ya tengo actor-crítica.

## Las trampas

- **Exploding gradients。**Las devoluciones pueden ser muy grandes.$\nabla \log \pi$之前,始终在批内把 $G$normaliza hasta`~N(0, 1)`¿Qué es eso?
- **Entropy collapse。**Política 过早收到近似决定性的行动,停止探索,然后卡住──修复方式: hacia el objetivo 添加 entropies bonus $\beta \cdot H(\pi(\cdot \mid s))$¿Qué es eso?
- **High variance。**La serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de televisión de la serie de la serie de televisión de la serie de televisión de la serie de la serie de televisión de la serie de la serie de televisión de la serie de la serie de televisión de la serie de la serie de televisión de la serie de la serie de televisión de la serie de la serie de televisión de la serie de la serie de televisión de la serie de la serie de televisión de la serie de la serie de televisión de la serie de la serie de televisión de la serie de la serie de televisión de la serie de la serie de televisión de la serie de la serie de televisión de la serie de la serie de televisión de la serie de la serie de televisión de la serie de la serie de la serie de televisión de la serie de la serie de la serie de televisión de la serie de la serie de televisión de la serie de televisión de la serie de la serie de televisión de la serie de televisión de la serie de la serie de la serie de la serie de televisión de la serie de la serie de la serie de la serie de la serie de televisión de la serie de la serie de televisión de la serie de la serie de la serie de la serie de la serie de la serie de televisión de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de
- **Sample inefficiency。**En política significa que cada transición en una actualización  después  será abandonada                                                                                                                                                                                                                                                     
- **Non-stationary gradients。**100 episodios de la misma serie anterior que Gradient usando lo viejo.$\pi$Es por eso que se han puesto en marcha varias nuevas políticas.
- **Credit assignment。**没有 recompensa-to-go 时,过去 rewards 会贡献噪声──始终使用奖励-to-go──

## Usalo

En 2026 años, la fuerza de fuerza                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

| Use case | Derived method |
|----------|---------------|
| Continuous control | PPO / SAC with Gaussian policy |
| LLM RLHF | PPO with KL penalty, running on token-level policy |
| LLM reasoning (DeepSeek) | GRPO — REINFORCE with group-relative baseline, no critic |
| Multi-agent | Centralized-critic REINFORCE (MADDPG, COMA) |
| Discrete action robotics | A2C, A3C, PPO |
| Preference-only settings | DPO — REINFORCE rewritten as a preference-likelihood loss, no sampling |

Cuando veas en el guión de entrenamiento de 2026`loss = -advantage * log_prob`,that's带基线的 REINFORCE──整篇论文(DPO、GRPO、RLOO) son todas las técnicas de reducción de variaciones basadas en esta línea.

## Envío

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-policy-gradient-trainer.md`¿Qué es esto ?

```markdown
---
name: policy-gradient-trainer
description: 为给定 task 生成 REINFORCE / actor-critic / PPO training config，并诊断 variance 问题。
version: 1.0.0
phase: 9
lesson: 6
tags: [rl, policy-gradient, reinforce]
---

给定一个 environment（discrete / continuous actions、horizon、reward stats），输出：

1. Policy head。Softmax（discrete）或 Gaussian（continuous），并包含 parameter counts。
2. Baseline。None（vanilla）、running mean、learned `V̂(s)`，或 A2C critic。
3. Variance controls。默认启用 reward-to-go、return normalization、gradient clip value。
4. Entropy bonus。Coefficient β 和 decay schedule。
5. Batch size。每次 update 的 episodes 数；on-policy data freshness contract。

拒绝在 horizons > 500 steps 上使用 REINFORCE-no-baseline。拒绝为 continuous-action control 使用 softmax head。把任何 `β = 0` 且 observed policy entropy < 0.1 的 run 标记为 entropy-collapsed。
```

## Los ejercicios

1. **Easy。**En 4×4 GridWorld 上 utiliza política de softmax lineal 实现 REINFORCE── no utiliza línea de base, entrenar 1.000 个 episodios── dibujar curva de aprendizaje; medir la variación(retorno de std)──
2. **Medium。**添加运行平均基线――再训练――把样本效率和差与香运比――基线 让收所需步骤 降低了多少?
3. **Hard。**添加 bonificación de entropía $\beta \cdot H(\pi)$◊ Especialización$\beta \in \lbrace 0, 0.01, 0.1, 1.0 \rbrace$¿Pintando el retorno final y la entropía política? ¿Dónde está el punto dulce?

## Términos clave

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Policy gradient | “直接训练 policy” | $\nabla J(\theta) = \mathbb{E}[G \cdot \nabla \log \pi_\theta(a \mid s)]$；由 log-derivative trick 推导而来。 |
| REINFORCE | “最初的 PG algorithm” | Williams (1992)；Monte Carlo returns 乘以 log-policy Gradient。 |
| Log-derivative trick | “Score function estimator” | $\nabla P(\tau;\theta) = P(\tau;\theta) \cdot \nabla \log P(\tau;\theta)$；让 expectations 的 gradients 变得 tractable。 |
| Baseline | “Variance reduction” | 从 $G$ 中减去的任意 $b(s)$；是 unbiased 的，因为 $\mathbb{E}[b \cdot \nabla \log \pi] = 0$。 |
| Reward-to-go | “只计算未来 returns” | 使用 $G_t^{\text{from } t}$ 而不是完整的 $G_0$；正确且 variance 更低。 |
| Entropy bonus | “鼓励探索” | $+\beta \cdot H(\pi(\cdot \mid s))$ 项防止 policy collapse。 |
| On-policy | “用你刚看到的数据训练” | Gradient expectation 是相对于当前 policy 的，不能直接复用旧数据。 |
| Advantage | “比平均好多少” | $A(s, a) = G(s, a) - V(s)$；带 baseline 的 REINFORCE 所乘的带符号 quantity。 |

## Leer más

- [Williams (1992). Simple Statistical Gradient-Following Algorithms for Connectionist Reinforcement Learning](https://link.springer.com/article/10.1007/BF00992696) El papel de refuerzo original 
- [Sutton et al. (2000). Policy Gradient Methods for Reinforcement Learning with Function Approximation](https://papers.nips.cc/paper_files/paper/1999/hash/464d828b85b0bed98e80ade0a5c43b0f-Abstract.html) 带 función aproximación de la teoría moderna de la política-gradiente。
- [Sutton & Barto (2018). Ch. 13 — Policy Gradient Methods](http://incompleteideas.net/book/RLbook2020.pdf) Presentación de libros de texto。
- [OpenAI Spinning Up — VPG / REINFORCE](https://spinningup.openai.com/en/latest/algorithms/vpg.html) 清晰的教学式讲解, contiene código PyTorch.
- [Peters & Schaal (2008). Reinforcement Learning of Motor Skills with Policy Gradients](https://homes.cs.washington.edu/~todorov/courses/amath579/reading/PolicyGradient.pdf) reducción de la varianza, así como la REINFORCE 连接到信托区域家族 (TRPO, PPO) 视角
