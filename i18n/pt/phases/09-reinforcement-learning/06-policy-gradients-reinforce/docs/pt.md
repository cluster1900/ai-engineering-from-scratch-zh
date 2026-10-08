# Política Gradiente  Desde zero realçar REINFORCE

> 停止估值──直接参数化政策,计算预期回归的渐进,然后沿上坡方向更新──Williams (1992) usa um teorema 写清了它──这是PPO、GRPO以及每个LLM RL loop 存在的原因──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 03 (Backpropagation), Phase 9 · 03 (Monte Carlo), Phase 9 · 04 (TD Learning)
**Time:** ~75 分钟

## 问题

Q-learning 和 DQN parameterize 的是 *value* função──你通过 `argmax Q`选择行动――这对离散行动 和离散状态 没有问题――但当行动是连续时就会失效`argmax`?), ou quando você quer política estocástica também vai falhar`argmax`按构造就是决定性)

Os gradientes de política 改为 parâmetros *policies*。`π_θ(a | s)`É uma rede neural, saída de ação, distribuição.`θ`O Gradiente.`argmax`Não há recursão de Bellman.`J(θ) = E_{π_θ}[G]`Faça a ascensão gradiente.

Teorema de reforço (Williams 1992)  diz-te este gradiente é calculado:`∇J(θ) = E_π[ G · ∇_θ log π_θ(a | s) ]`◊运行一个集――计算回来――把每一步的 ◊`∇ log π_θ(a | s)`乘以回归──取平均──做 Gradiente-ascensão──完成──

Cada algoritmo LLM-RL de 2026:PPO、DPO、GRPO, são refinamentos da REINFORCE, são requisitos pré-requisitos da fase 10 · 07 (implementação do RLHF) e da fase 10 · 08 (DPO).

## 概念

![Policy gradient: softmax policy, log-π gradient, return-weighted update](../assets/policy-gradient.svg)

**Policy gradient theorem。**Para qualquer um`θ`Política de parametrização `π_θ`- Não .

`∇J(θ) = E_{τ ~ π_θ}[ Σ_{t=0}^{T} G_t · ∇_θ log π_θ(a_t | s_t) ]`

Entre eles `G_t = Σ_{k=t}^{T} γ^{k-t} r_{k+1}`É do passo.`t`開始の割引返還──o esperado é de `π_θ`trajetórias completas da amostra `τ`O que conseguimos.

**证明很短。**Em expectativa, baixar.`J(θ) = Σ_τ P(τ; θ) G(τ)`求导──使用 `∇P(τ; θ) = P(τ; θ) ∇ log P(τ; θ)`(tructo de log-derivativos)`log P(τ; θ) = Σ log π_θ(a_t | s_t) + environment terms that do not depend on θ`Os termos ambientais desaparecem.

**Variance reduction 技巧。**A variância de Vanilla REINFORCE é muito alta: os retornos são ruidosos,`∇ log π`É ruidoso, multiplicando-se muito ruidoso.

1. **Baseline subtraction。**Não depende de qualquer coisa.`a_t`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `b(s_t)`,把 `G_t`替换成 `G_t - b(s_t)`É imparcial, porque...`E[b(s_t) · ∇ log π(a_t | s_t)] = 0`典型选择:由评论学到的 `b(s_t) = V̂(s_t)`→ ator-crítico (Lessão 07)
2. **Reward-to-go。**- Não .`Σ_t G_t · ∇ log π_θ(a_t | s_t)`替换成 `Σ_t G_t^{from t} · ∇ log π_θ(a_t | s_t)` Para uma determinada ação, apenas retornos futuros 相关, recompensas passadas  contribuirá apenas ruído zero-médio 

- Não, não.

`∇J ≈ (1/N) Σ_{i=1}^{N} Σ_{t=0}^{T_i} [ G_t^{(i)} - V̂(s_t^{(i)}) ] · ∇_θ log π_θ(a_t^{(i)} | s_t^{(i)})`

É o que significa que a reabilitação é a base da reabilitação, que é também a ancestralidade direta da A2C (Lessão 07) e da PPO (Lessão 08).

**Softmax policy parameterization。**Para ações discretas, o padrão de escolha é:

`π_θ(a | s) = exp(f_θ(s, a)) / Σ_{a'} exp(f_θ(s, a'))`

Entre eles `f_θ`É qualquer coisa para cada ação                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

`∇_θ log π_θ(a | s) = ∇_θ f_θ(s, a) - Σ_{a'} π_θ(a' | s) ∇_θ f_θ(s, a')`

É o resultado da acção tomada, em redução do valor esperado da política.

**用于 continuous actions 的 Gaussian policy。** `π_θ(a | s) = N(μ_θ(s), σ_θ(s))`- Não.`∇ log N(a; μ, σ)`Há uma forma fechada. É tudo o que é necessário para a Fase 9 · 07 do SAC.


```figure
policy-gradient-landscape
```

## Construí-lo

### Passo 1: rede de políticas softmax

```python
def policy_logits(theta, state_features):
    return [dot(theta[a], state_features) for a in range(N_ACTIONS)]

def softmax(logits):
    m = max(logits)
    exps = [exp(l - m) for l in logits]
    Z = sum(exps)
    return [e / Z for e in exps]
```

Para o envio tabuleiro Use linear policy (~) para cada ação, um vetor de peso (~) para o Atari, mudado para CNN,并保留softmax head (~) para o Atari, mudado para CNN,

### Passo 2: amostragem e probabilidade de registro

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

### Passo 3: lançamento com log-probes capturados

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

### Passo 4: Atualização da REINFORCE

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

Gradiente `∇ log π(a|s) = e_a - π(·|s)`(`a`O que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é.

### Passo 5: Linhas de base

Para episódios recentes`G`取 running mean, já já basta fazer 4×4 GridWorld  run up; cerca de 500 episódios 收──把 baseline 升级为学习 `V̂(s)`- Não, não.

## Encurralagens

- **Exploding gradients。**Os retornos podem ser muito grandes.`∇ log π`之前,始终在批内把 `G`Normalizar até`~N(0, 1)`- Não.
- **Entropy collapse。**Política 过早收到近似决定性的行动,停止探索,然后卡住──修复方式:向目标 添加 Entropy bonus `β · H(π(·|s))`- Não.
- **High variance。**Vanilla REINFORCE 需要成千上万集──kritical baseline──Lessão 07)
- **Sample inefficiency。**Na política significa que cada transição em uma atualização  depois  será abandonada através de amostragem de importância fazer correções fora da política pode trazer os dados de volta, preço é variação
- **Non-stationary gradients。**100 episódios  anterior o mesmo Gradient usando o antigo `π`É por isso que as políticas são aplicadas a cada lançamento.
- **Credit assignment。**没有奖励-to-go 时,过去奖励 会贡献噪声──始终使用奖励-to-go──

## Usá-lo

2026 anos, REINFORCE                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

| Use case | Derived method |
|----------|---------------|
| Continuous control | PPO / SAC with Gaussian policy |
| LLM RLHF | PPO with KL penalty, running on token-level policy |
| LLM reasoning (DeepSeek) | GRPO — REINFORCE with group-relative baseline, no critic |
| Multi-agent | Centralized-critic REINFORCE (MADDPG, COMA) |
| Discrete action robotics | A2C, A3C, PPO |
| Preference-only settings | DPO — REINFORCE rewritten as a preference-likelihood loss, no sampling |

Quando você ver no roteiro de treinamento de 2026`loss = -advantage * log_prob`, é o que significa "reforço da linha de base".

## Envia-o

保存为 `outputs/skill-policy-gradient-trainer.md`- Não .

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

## Exercícios

1. **Easy。**Em 4×4 GridWorld 上用线性软max政策 实现 REINFORCE──不使用基线,训练1000 个集──绘制学习曲线;测量变量(returns 的 std)──
2. **Medium。**Adicionar a média de corrida de base. O novo treino. A eficiência da amostra e a variação com a corrida de baunilha em relação à linha de base.
3. **Hard。**添加 bonus de entropia `β · H(π)`Esboço`β ∈ {0, 0.01, 0.1, 1.0}`O que é que se passa com o trabalho de desenhar o retorno final e a entropia política?

## Termos-chave

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Policy gradient | “直接训练 policy” | `∇J(θ) = E[G · ∇ log π_θ(a\|s)]`；由 log-derivative trick 推导而来。 |
| REINFORCE | “最初的 PG algorithm” | Williams (1992)；Monte Carlo returns 乘以 log-policy Gradient。 |
| Log-derivative trick | “Score function estimator” | `∇P(τ;θ) = P(τ;θ) · ∇ log P(τ;θ)`；让 expectations 的 gradients 变得 tractable。 |
| Baseline | “Variance reduction” | 从 `G` 中减去的任意 `b(s)`；是 unbiased 的，因为 `E[b · ∇ log π] = 0`。 |
| Reward-to-go | “只计算未来 returns” | 使用 `G_t^{from t}` 而不是完整的 `G_0`；正确且 variance 更低。 |
| Entropy bonus | “鼓励探索” | `+β · H(π(·\|s))` 项防止 policy collapse。 |
| On-policy | “用你刚看到的数据训练” | Gradient expectation 是相对于当前 policy 的，不能直接复用旧数据。 |
| Advantage | “比平均好多少” | `A(s, a) = G(s, a) - V(s)`；带 baseline 的 REINFORCE 所乘的带符号 quantity。 |

## Mais leitura

- [Williams (1992). Simple Statistical Gradient-Following Algorithms for Connectionist Reinforcement Learning](https://link.springer.com/article/10.1007/BF00992696)O papel inicial de reforço.
- [Sutton et al. (2000). Policy Gradient Methods for Reinforcement Learning with Function Approximation](https://papers.nips.cc/paper_files/paper/1999/hash/464d828b85b0bed98e80ade0a5c43b0f-Abstract.html) 带 função aproximação  带 função aproximação  带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带                                                                                                                                                                                                                                                                                                                                                                
- [Sutton & Barto (2018). Ch. 13 — Policy Gradient Methods](http://incompleteideas.net/book/RLbook2020.pdf) apresentação de livros didáticos。
- [OpenAI Spinning Up — VPG / REINFORCE](https://spinningup.openai.com/en/latest/algorithms/vpg.html) 清晰的教学式讲解, contém código PyTorch.
- [Peters & Schaal (2008). Reinforcement Learning of Motor Skills with Policy Gradients](https://homes.cs.washington.edu/~todorov/courses/amath579/reading/PolicyGradient.pdf) redução de variância, bem como a reini­formação                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
