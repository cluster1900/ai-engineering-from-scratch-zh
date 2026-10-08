# Diferença temporal  Q-Learning & SARSA

> Monte Carlo 会一直等到集 结束──TD 通过bootstrap 下一个价值估计,在每一步后更新──Q-learning é off-policy 且偏乐观;SARSA é on-policy 且偏谨慎──两者都只是一行代码──两者也支着本阶段中的每种深度RL 方法──

**Type:** Build
**Languages:** Python
**前置要求:**Fase 9 · 01 (MDPs), Fase 9 · 02 (Dynamic Programming), Fase 9 · 03 (Monte Carlo)
**Time:** ~75 minutes

## 问题

Monte Carlo é possível, mas tem duas exigências muito altas. Ele precisa de terminar os episódios, e só pode ser atualizado após o retorno final. Se o seu episódio tiver 1.000 passos, o MC precisa esperar 1.000 passos para atualizar qualquer coisa. É alto, baixo, e na prática também é lento.

Programação dinâmica 则相反:零方差的 bootstrapped backups, mas exige um modelo já conhecido.

Diferença temporal (TD) aprendizagem 折中了两者──根据单个过渡 `(s, a, r, s')`, Construir um alvo de um passo .`r + γ V(s')`,并把 `V(s)`朝它推近──不需要模型──不需要完整的集──由于在RHS上使用近似的`V`A diferença é muito menor do que a MC e pode ser atualizada desde o primeiro passo.

É tudo o que a RL moderna (DQN, A2C, PPO, SAC) depende de.

## 概念

![Q-learning vs SARSA: off-policy max vs on-policy Q(s', a')](../assets/td.svg)

**用于 V 的 TD(0) update：**

`V(s) ← V(s) + α [r + γ V(s') - V(s)]`

方括号中量是 TD erro `δ = r + γ V(s') - V(s)`É o MC Central.`G_t - V(s_t)`O que é que é que é o que é que é que é?`α`满足 Robbins-Monro`Σ α = ∞`- Não .`Σ α² < ∞`), e todos os estados são visitados sem limites.

**Q-learning。**Uma forma de controlo de TD fora da política:

`Q(s, a) ← Q(s, a) + α [r + γ max_{a'} Q(s', a') - Q(s, a)]`

`max`假设从 `s'`開始會遵循 *貪的政策,不管代理 实际采取了什么行动──这种解让Q-learning 在代理 通过 ε-贪的探索时仍然学习`Q*`❖Mnih et al. (2015) 将将将它转换为Atari 上的深度Q-learning (Lesson 05) ❖

**SARSA。**Uma espécie de TD sobre política:

`Q(s, a) ← Q(s, a) + α [r + γ Q(s', a') - Q(s, a)]`

O nome vem de tuple .`(s, a, r, s', a')` SARSA Utilize agent                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `a'`, em vez de ganancioso .`argmax`◊ Ela vai receber até o momento de operar arbitrariamente ε-compassivo `π`Para o`Q^π`- Em limite .`ε → 0`Vai mudar .`Q*`- Não.

**cliff-walking 的差异。**Em tarefas clássicas de caminhada em penhascos, a aprendizagem Q-aprende a percorrer o melhor caminho ao longo da borda do penhasco, mas ocasionalmente come a punição durante a exploração. A SARSA vai aprender a percorrer um caminho mais seguro para um passo longe do penhasco, pois ele incorpora o ruído da exploração em seu próprio Q-valor.`ε → 0`O que é importante na prática é que, quando a implementação é realmente em curso, o comportamento da SARSA será mais conservado.

**Expected SARSA。**- Não .`π`O valor de espera substitui`Q(s', a')`- Não .

`Q(s, a) ← Q(s, a) + α [r + γ Σ_{a'} π(a'|s') Q(s', a') - Q(s, a)]`

方差低于 SARSA(不对 `a'`采样), o objetivo é igualmente na política.

**n-step TD 和 TD(λ)。**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `n`步再 bootstrap, em TD(0) e MC 之间插值──`n=1`É TD,`n=∞`É MC―TD (L) Us几何权重 `(1-λ)λ^{n-1}`Para tudo .`n`求平均──                                                                                                                                                                                                                                                             `n`- Não.


```figure
qlearning-gridworld
```

## Construí-lo

### 步骤 1: 基于 ε-compromissa política de SARSA

```python
def sarsa(env, episodes, alpha=0.1, gamma=0.99, epsilon=0.1):
    Q = defaultdict(lambda: {a: 0.0 for a in ACTIONS})

    def choose(s):
        if random() < epsilon:
            return choice(ACTIONS)
        return max(Q[s], key=Q[s].get)

    for _ in range(episodes):
        s = env.reset()
        a = choose(s)
        while True:
            s_next, r, done = env.step(s, a)
            a_next = choose(s_next) if not done else None
            target = r + (gamma * Q[s_next][a_next] if not done else 0.0)
            Q[s][a] += alpha * (target - Q[s][a])
            if done:
                break
            s, a = s_next, a_next
    return Q
```

A única diferença entre o aprendizado Q e o objetivo é que o aprendizado Q é o que é.

### 步骤 2: Aprendizagem Q

```python
def q_learning(env, episodes, alpha=0.1, gamma=0.99, epsilon=0.1):
    Q = defaultdict(lambda: {a: 0.0 for a in ACTIONS})
    for _ in range(episodes):
        s = env.reset()
        while True:
            a = choose(s, Q, epsilon)
            s_next, r, done = env.step(s, a)
            target = r + (gamma * max(Q[s_next].values()) if not done else 0.0)
            Q[s][a] += alpha * (target - Q[s][a])
            if done:
                break
            s = s_next
    return Q
```

`max`Este símbolo é a diferença entre política e não política.

### 步骤 3: curvas de aprendizagem

Seguir por 100 episódios de retorno médio. Q-learning em simples determinação. GridWorld 上收更快; SARSA 在悬崖上更保守.`code/main.py`O 4x4 GridWorld está em um ambiente de grande qualidade.`α=0.1, ε=0.1`Há cerca de 2.000 episódios.

### 步骤 4: Comparar com DP

运行 valor Iteração ((Lessão 02) get `Q*` Inspecção`max_{s,a} |Q_learned(s,a) - Q*(s,a)|`❖ Um agente TD tabuleiro saudável em 4×4 GridWorld  Treinamento 10.000 episódios                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    `~0.5`É dentro.

## 陷

- **初始 Q values 很重要。**乐观初始化 负奖励 任务中                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 `Q = 0`O que é que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é.
- **α schedule。**常数 `α`Para o problema da estabilidade não é possível.`α_n = 1/n`Em teoria, pode ser recebido, mas na prática, é muito lento.`α`Fixa-se`[0.05, 0.3]`,并monitoring learning curve。
- **ε schedule。**Desde o alto da sua posição`ε=1.0`), decadência`ε=0.05`"GLI" (avididade no limite com exploração infinita)
- **Q-learning 中的 max bias。**- Não .`Q`Há ruído,`max`O operador 存在向上偏差──会导致高估;Hasselt's Double Q-learning(Lesson 05 中 DDQN 使用的做法) usando duas tabelas de Q 修复这个问题──
- **非终止 episodes。**TD pode ser aprendido em condições sem terminais, mas você precisa limitar o número de passos, ou em cima de limite de processar correctamente bootstrap.
- **State hashing。**Se os estados são tuples/tenseiros, use可 hash 的键(tuple, não lista; 四舍五入后的浮游 tuple, não são flotas cruas) 

## Use-o

Paisagem TD de 2026:

| Task | Method | Reason |
|------|--------|--------|
| 小型 tabular environments | Q-learning | 直接学习 optimal policy。 |
| On-policy safety-critical | SARSA / Expected SARSA | 探索期间更保守。 |
| High-dimensional state | DQN (Phase 9 · 05) | 带 replay 和 target net 的 Neural Network Q-function。 |
| Continuous actions | SAC / TD3 (Phase 9 · 07) | 在 Q-network 上做 TD update；policy net 发出 actions。 |
| LLM RL (reward-model-based) | PPO / GRPO (Phase 9 · 08, 12) | 使用通过 GAE 得到的 TD-style advantage 的 actor-critic。 |
| Offline RL | CQL / IQL (Phase 9 · 08) | 带 conservative regularization 的 Q-learning。 |

Você vai ler em 2026 no seu artigo, "RL", são uma espécie de expansão de Q-learning ou SARSA.

## Entrega-o

保存为 `outputs/skill-td-agent.md`- Não .

```markdown
---
name: td-agent
description: Pick between Q-learning, SARSA, Expected SARSA for a tabular or small-feature RL task.
version: 1.0.0
phase: 9
lesson: 4
tags: [rl, td-learning, q-learning, sarsa]
---

Given a tabular or small-feature environment, output:

1. Algorithm. Q-learning / SARSA / Expected SARSA / n-step variant. One-sentence reason tied to on-policy vs off-policy and variance.
2. Hyperparameters. α, γ, ε, decay schedule.
3. Initialization. Q_0 value (optimistic vs zero) and justification.
4. Convergence diagnostic. Target learning curve, `|Q - Q*|` check if DP is possible.
5. Deployment caveat. How will exploration behave at inference? Is SARSA's conservatism needed?

Refuse to apply tabular TD to state spaces > 10⁶. Refuse to ship a Q-learning agent without a max-bias caveat. Flag any agent trained with ε held at 1.0 throughout (no exploitation phase).
```

## 练习

1. **Easy。**Em 4×4 GridWorld 上实现 Q-learning 和 SARSA── desenhar curvas de aprendizagem de 2.000 episódios( cada 100 episódios de retorno médio)──谁收更快?
2. **Medium。**Construir um ambiente de caminhada em penhascos ⋅ 4×12, última linha é penhasco, recompensa -100 e restabelecer até o ponto de partida ⋅ Compare políticas finais de Q-learning e SARSA ⋅ Cretagem mostrando os seus caminhos ⋅ Qual é o mais próximo do penhasco?
3. **Hard。**实现 Double Q-learning──在 noisy-reward GridWorld 上(给每步奖励 添加高斯音 σ=5), demonstrar Q-learning 会明显高估 `V*(0,0)`E o Double Q não vai acontecer.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| TD error | "The update signal" | `δ = r + γ V(s') - V(s)`，bootstrapped residual。 |
| TD(0) | "One-step TD" | 每次 transition 后只使用 next state's estimate 进行更新。 |
| Q-learning | "Off-policy RL 101" | 对 next-state actions 使用 `max` 的 TD update；无论 behavior policy 如何，都会学习 `Q*`。 |
| SARSA | "On-policy Q-learning" | 使用实际 next action 的 TD update；为当前 ε-greedy π 学习 `Q^π`。 |
| Expected SARSA | "The low-variance SARSA" | 用 π 下的期望替换采样得到的 `a'`。 |
| GLIE | "Correct exploration schedule" | Greedy in the Limit with Infinite Exploration；Q-learning 收敛所需。 |
| Bootstrapping | "Using current estimate in the target" | 区分 TD 和 MC 的关键。是偏差来源，但能大幅降低方差。 |
| Maximization bias | "Q-learning overestimates" | 对有噪声 estimates 取 `max` 会产生向上偏差；由 Double Q-learning 修复。 |

## 延伸阅读
- [Watkins & Dayan (1992). Q-learning](https://link.springer.com/article/10.1007/BF00992698) 原始论文和收证明──
- [Sutton & Barto (2018). Ch. 6 — Temporal-Difference Learning](http://incompleteideas.net/book/RLbook2020.pdf) TD(0) 、SARSA、Q-learning、Esperado SARSA。
- [Hasselt (2010). Double Q-learning](https://papers.nips.cc/paper_files/paper/2010/hash/091d584fced301b442654dd8c23b3fc9-Abstract.html) maximizar o viés de modificação.
- [Seijen, Hasselt, Whiteson, Wiering (2009). A Theoretical and Empirical Analysis of Expected SARSA](https://ieeexplore.ieee.org/document/4927542) esperado SARSA's movimentos:.
- [Rummery & Niranjan (1994). On-line Q-learning using connectionist systems](https://www.researchgate.net/publication/2500611_On-Line_Q-Learning_Using_Connectionist_Systems) 创造 SARSA 这个术语的论文(quando era chamado de "conexão modificada Q-learning")。
- [Sutton & Barto (2018). Ch. 7 — n-step Bootstrapping](http://incompleteideas.net/book/RLbook2020.pdf) 将 TD(0) 泛化到 TD(n), é o caminho que segue desde o aprendizado Q para os traços de elegibilidade, bem como depois para o GAE no PPO.
