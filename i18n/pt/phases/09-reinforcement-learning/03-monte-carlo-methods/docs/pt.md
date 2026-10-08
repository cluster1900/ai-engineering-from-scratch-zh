# Métodos de Monte Carlo  Aprender com Episódios Completos

> A programação dinâmica  necessita de um modelo. Além dos episódios 什么都不需要── operação política, observação retornos,取平均── é a ideia mais simples da RL, também é a ideia de resolver o que está acontecendo.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs), Phase 9 · 02 (Dynamic Programming)
**Time:** ~75 minutes

## 问题

Programação dinâmica é muito bonita, mas supõe que você pode fazer perguntas para cada estado e ação.`P(s' | s, a)`◊ Na realidade, quase nada funciona assim. ◊ Robô ⋅ não pode resolver ⋅ calcular ⋅ aplicar torque conjunto ⋅ distribuição de pixels da câmera ⋅ algoritmo de preços ⋅ não pode lidar com todas as reações possíveis do cliente ⋅ L ⋅ não pode exibir qualquer token ⋅ todas as possíveis continuações ⋅

Você precisa de um método que depende apenas do ambiente.`s_0, a_0, r_1, s_1, a_1, r_2, …, s_T`Usá-lo para avaliar os valores.

A mudança do DP para o MC é importante em termos de raciocínio: nós passamos de *modelo conhecido + backup exato*                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

## 概念

![Monte Carlo: rollout, compute returns, average; first-visit vs every-visit](../assets/monte-carlo.svg)

**核心思想，一行表达：** `V^π(s) = E_π[G_t | s_t = s] ≈ (1/N) Σ_i G^{(i)}(s)`, entre os `G^{(i)}(s)`É política.`π`下访问 `s`后观察到的回报──

**First-visit vs every-visit MC。**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `s`O primeiro MC só tem a primeira visita após o retorno; cada visita MC 统计所有访问──二者在极限下都是无偏见── Primeiro MC é mais fácil de analisar.

**Incremental mean。**Não armazenar todos os retornos, mas atualizar a média corrente:

`V_n(s) = V_{n-1}(s) + (1/n) [G_n - V_{n-1}(s)]`

重新整理:`V_new = V_old + α · (target - V_old)`, entre os `α = 1/n`- Não.`1/n`换成 constante de tamanho de passo `α ∈ (0, 1)`E depois, tens um estimador de MC não estacionário, que vai seguir.`π`O movimento é de MC 跳到TD, re-jumping para todos os algoritmos RL modernos.

**Exploration 现在成了问题。**DP 通過枚举触及各州──MC 只有看政策 会访问各州──如果`π`É determinista, o espaço de estado, toda a região, nunca será amostrada, suas estimativas de valor, permanecerão eternamente em zero.

1. **Exploring starts。**Desde随机 (s, a) par 开始每个集──保证 覆盖;实践中不现实(你不能把机器人 重置到任意状态)──
2. **ε-greedy。**Comparado com o actual Q                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `ε`选择随机action── todos os pares de ações estatais são gradualmente amostragados──
3. **Off-policy MC。**Em política de comportamento`μ`Recolher dados, através de amostragem de importância, aprender política-alvo `π`❖ Variação alta, mas é um ponto de partida para o DQN e outros métodos de replay-buffer.

**Monte Carlo Control。**Avaliação → melhoria → avaliação, assim como a iteração da política, assim, mas a avaliação é baseada em amostragem:

1. 运行 `π`- Não, não.
2. De acordo com os resultados observados`Q(s, a)`- Não.
3. - Não .`π`Comparado com`Q`Tornar-se e-avidas.
4. - Não, não.

Em condições de temperatura, cada par é visitado sem limites.`α`满足 Robbins-Monro), vai receber até `Q*`和 `π*`- Não.

## 动手构建

### Passo 1: lançamento → (s, a, r) 列表

```python
def rollout(env, policy, max_steps=200):
    trajectory = []
    s = env.reset()
    for _ in range(max_steps):
        a = policy(s)
        s_next, r, done = env.step(s, a)
        trajectory.append((s, a, r))
        s = s_next
        if done:
            break
    return trajectory
```

Não há modelo, só há.`env.reset()`和 `env.step(s, a)`                                                                                                                                                                                                                                                              

### Passo 2: 计算 retorna(反向扫)

```python
def returns_from(trajectory, gamma):
    returns = []
    G = 0.0
    for _, _, r in reversed(trajectory):
        G = r + gamma * G
        returns.append(G)
    return list(reversed(returns))
```

Uma vez,`O(T)` Contra a recorrência`G_t = r_{t+1} + γ G_{t+1}`避免了重复求和──

### Passo 3: Avaliação do MC na primeira visita

```python
def mc_policy_evaluation(env, policy, episodes, gamma=0.99):
    V = defaultdict(float)
    counts = defaultdict(int)
    for _ in range(episodes):
        trajectory = rollout(env, policy)
        returns = returns_from(trajectory, gamma)
        seen = set()
        for t, ((s, _, _), G) in enumerate(zip(trajectory, returns)):
            if s in seen:
                continue
            seen.add(s)
            counts[s] += 1
            V[s] += (G - V[s]) / counts[s]
    return V
```

É a primeira vez que visitas o estado de marcas, visto, aumentado o número, atualizado o valor de execução.

### Passo 4: controlo do MC ganancioso (na política)

```python
def mc_control(env, episodes, gamma=0.99, epsilon=0.1):
    Q = defaultdict(lambda: {a: 0.0 for a in ACTIONS})
    counts = defaultdict(lambda: {a: 0 for a in ACTIONS})

    def policy(s):
        if random() < epsilon:
            return choice(ACTIONS)
        return max(Q[s], key=Q[s].get)

    for _ in range(episodes):
        trajectory = rollout(env, policy)
        returns = returns_from(trajectory, gamma)
        seen = set()
        for (s, a, _), G in zip(trajectory, returns):
            if (s, a) in seen:
                continue
            seen.add((s, a))
            counts[s][a] += 1
            Q[s][a] += (G - Q[s][a]) / counts[s][a]
    return Q, policy
```

### Passo 5: Comparado com o padrão de ouro DP

Quando episódios → ∞ 时, você é contra `V^π`A estimativa do MC  deveria comparar com o resultado do DP na Lesson 02                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `~0.1`No âmbito da sua acção.

## 常见陷

- **Infinite episodes。**MC                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `max_steps`A política de GridWorld é regularmente interrompida, é normal, desde que se certifique de que a sua contabilidade é correta.
- **Variance。**MC utiliza retornos completos. Em episódios longos, variação é grande, a recompensa final será igual.`V(s_0)` Métodos de TD (Lessão 04) através do bootstrapping  降低这一点──
- **State coverage。**Em novo Q 上做贪 MC, se aparecerem laços, apenas vai continuar tentando uma ação.
- **Non-stationary policies。**Se `π`发生变化(如 MC control 中那样), old returns from different policy──Constant-α MC pode tratar este ponto; sample-average MC 不行──
- **Off-policy importance sampling。**权重 `π(a|s)/μ(a|s)`A variação irá aumentar a velocidade de rotação de uma rotação de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de um fluxo de velocidade de um fluxo de velocidade de um fluxo de um fluxo de velocidade de um fluxo de velocidade de um fluxo de um fluxo de velocidade de um fluxo de velocidade de um fluxo de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de um fluxo de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de velocidade de


```figure
epsilon-greedy
```

## Use-o

Métodos de Monte Carlo em 2026

| Use case | Why MC |
|----------|--------|
| Short-horizon games（blackjack、poker） | Episodes 自然 terminate；returns 清晰。 |
| Logged policy 的 offline evaluation | 对 stored trajectories 的 discounted returns 求平均。 |
| Monte Carlo Tree Search（AlphaZero） | 从 tree leaves 发起的 MC rollouts 指导 selection。 |
| LLM RL evaluation | 为给定 policy 计算 sampled completions 的 average reward。 |
| PPO 中的 baseline estimation | Advantage target `A_t = G_t - V(s_t)` 使用 MC `G_t`。 |
| RL 教学 | 最简单且真正有效的 algorithm；去掉 bootstrapping 就能看到核心。 |

Algoritmos modernos de RL profundos (PPO、SAC) passam`n`-step returns ou GAE, em puro MC (full returns) e puro TD (one-step bootstrap) entre inserção de valor.

## Entrega-o

保存为 `outputs/skill-mc-evaluator.md`- Não .

```markdown
---
name: mc-evaluator
description: 通过 Monte Carlo rollouts 评估 policy，并在可用时生成带有 DP-comparison 的 convergence report。
version: 1.0.0
phase: 9
lesson: 3
tags: [rl, monte-carlo, evaluation]
---

给定一个 environment（episodic，带 reset+step API）和一个 policy，输出：

1. 方法。First-visit vs every-visit MC。理由。
2. Episode budget。目标数量、variance diagnostic、预期 standard error。
3. Exploration plan。ε schedule（如需要）或 exploring starts。
4. Gold-standard comparison。如果是 tabular，则给出 DP-optimal V*；否则给出来自 Q-learning / PPO baseline 的 bound。
5. Termination check。Max-step cap、timeouts、non-terminating trajectories 的处理。

没有 finite horizon cap 时，拒绝在 non-episodic tasks 上运行 MC。对于 tabular tasks，如果每个 state 少于 100 个 episodes，拒绝报告 V^π estimates。将任何具有 zero-variance actions 的 policy 标记为 exploration risk。
```

## 练习

1. **Easy.**实现 4×4 GridWorld 上 uniform-random policy 首次访问 MC 评价──运行 10,000 episódios──将 `V(0,0)`随剧数 变化的曲线与 DP 答案对照绘制──
2. **Medium.**- Não .`ε ∈ {0.01, 0.1, 0.3}`实现 ε-greedy MC control──比较20.000 episódios 后的平均回归──曲线看起来是什么样?
3. **Hard.**Utilizando a amostragem de importância                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   `μ`                                                                                                                                                                                                                                                              `π`de `V^π`◊ Comparar simples IS 、 por decisão IS 和 ponderado IS ⋅ Qual a variação mais baixa?

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Monte Carlo | “Random sampling” | 通过对来自分布的 iid samples 求平均来估计 expectations。 |
| Return `G_t` | “Future reward” | 从 step `t` 到 episode 结束的 discounted rewards 总和：`Σ_{k≥0} γ^k r_{t+k+1}`。 |
| First-visit MC | “Count each state once” | 一个 episode 中只有第一次访问会贡献到 value estimate。 |
| Every-visit MC | “Use all visits” | 每次访问都会贡献；略有 biased，但 sample-efficient 更高。 |
| ε-greedy | “Exploration noise” | 以概率 `1-ε` 选择 greedy action；以概率 `ε` 选择 random action。 |
| Importance sampling | “Correcting for sampling from the wrong distribution” | 通过 `π(a\|s)/μ(a\|s)` 乘积对 returns 重新加权，从 `μ` 数据估计 `V^π`。 |
| On-policy | “Learn from my own data” | Target policy = behavior policy。Vanilla MC、PPO、SARSA。 |
| Off-policy | “Learn from someone else's data” | Target policy ≠ behavior policy。Importance-sampled MC、Q-learning、DQN。 |

## 延伸阅读

- [Sutton & Barto (2018). Ch. 5 — Monte Carlo Methods](http://incompleteideas.net/book/RLbook2020.pdf) 经典处理──
- [Singh & Sutton (1996). Reinforcement Learning with Replacing Eligibility Traces](https://link.springer.com/article/10.1007/BF00114726) Análise de primeira visita versus cada visita
- [Precup, Sutton, Singh (2000). Eligibility Traces for Off-Policy Policy Evaluation](http://incompleteideas.net/papers/PSS-00.pdf) não-política MC 和 controlo de variação
- [Mahmood et al. (2014). Weighted Importance Sampling for Off-Policy Learning](https://arxiv.org/abs/1404.6362) 现代 estimadores IS de baixa variação。
- [Tesauro (1995). TD-Gammon, A Self-Teaching Backgammon Program](https://dl.acm.org/doi/10.1145/203330.203343) MC/TD auto-jogo 收到超人戏的首个大规模实证展示; também é o pioneiro do conceito de cada parte da aula na segunda metade da fase.
