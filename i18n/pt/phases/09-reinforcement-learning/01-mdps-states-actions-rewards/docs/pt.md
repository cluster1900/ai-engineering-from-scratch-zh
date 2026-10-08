# MDPs, Estados, Ações e Recompensas

> O processo de decisão Markov é composto por cinco coisas: estados, ações, transições, recompensas, descontos.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 1 · 06 (Probability & Distributions), Phase 2 · 01 (ML Taxonomy)
**Time:** ~45 minutes

## 问题

Você está escrevendo um bot de xadrez... ou um planejador de inventário... ou um agente de negociação... ou um loop de PPO de um modelo de raciocínio... em quatro áreas diferentes, mas há um fato extraordinário: elas podem ser classificadas como um mesmo objeto matemático.

Aprendizagem supervisionada`(x, y)`pares,并 requer que você se adapte a uma função. Reforcement Learning não lhe dá rótulos, apenas lhe dá uma série de estados, suas ações, bem como uma recompensa de escala.

Antes da formalização, você não poderia aprender neste fluxo. Eu vi o que eu fiz, o que eu fiz, o que aconteceu depois. Tudo isso tem que ser transformado em um objeto que você pode pensar. Esta formalização é o processo de decisão de Markov.

## 概念

![Markov decision process: states, actions, transitions, rewards, discount](../assets/mdp.svg)

**五个对象。**

- **States** `S`Em GridWorld, é um jogo. Em xadrez, é um jogo. Em LLM, é uma janela de contexto, além de qualquer memória.
- **Actions** `A`△可选行为──上/下/左/右移动──下一步棋──输出一个 Token──
- **Transitions** `P(s' | s, a)` dado estado determinado `s`E ação`a`, distribuição do próximo estado. No xadrez, é determinista, no inventário, é estocástico, na decodificação LLM, é quase determinista.
- **Rewards** `R(s, a, s')` 标量信号──赢 = +1,输 = -1──收入减成本──GRPO 中的日志-概率比率 项──
- **Discount** `γ ∈ [0, 1)`── recompensa futura 相對當前的報酬的权重──`γ = 0.99`买到约100 steps of horizon;`γ = 0.9`Compre até cerca de 10...

**Markov property** `P(s_{t+1} | s_t, a_t) = P(s_{t+1} | s_0, a_0, …, s_t, a_t)`O futuro depende apenas do estado atual. Se não existir, a representação do estado não é completa.

**Policies 与 returns。**Política `π(a | s)`Colocar estados 映射到动作分布──Return `G_t = r_t + γ r_{t+1} + γ² r_{t+2} + …`É a soma de desconto das recompensas futuras.`V^π(s) = E[G_t | s_t = s]`É política.`π`A seguir:`s`开始的预期回报──Q-value `Q^π(s, a) = E[G_t | s_t = s, a_t = a]`É uma ação específica que começa com o retorno esperado. Cada algoritmo RL estimará um destes dois, e então deve melhorar.`π`- Não.

**Bellman equations。**Nesta fase, todos os conteúdos serão usados para equações de pontos fixos:

`V^π(s) = Σ_a π(a|s) Σ_{s', r} P(s', r | s, a) [r + γ V^π(s')]`
`Q^π(s, a) = Σ_{s', r} P(s', r | s, a) [r + γ Σ_{a'} π(a'|s') Q^π(s', a')]`

Eles dividem o retorno esperado para o resultado deste passo, adicionando o valor descontado do ponto de queda.


```figure
discount-horizon
```

## Construí-lo

### Passo 1: um MDP determinista muito pequeno

Um 4x4 GridWorld──Agente de esquerda para cima, termina em direita para baixo, recompensa por cada passo, ações por -1,`{up, down, left, right}`- Não.`code/main.py`- Não.

```python
GRID = 4
TERMINAL = (3, 3)
ACTIONS = {"up": (-1, 0), "down": (1, 0), "left": (0, -1), "right": (0, 1)}

def step(state, action):
    if state == TERMINAL:
        return state, 0.0, True
    dr, dc = ACTIONS[action]
    r, c = state
    nr = min(max(r + dr, 0), GRID - 1)
    nc = min(max(c + dc, 0), GRID - 1)
    return (nr, nc), -1.0, (nr, nc) == TERMINAL
```

五行──这是完整环境──deterministic transitions、恒定步罚、absorvendo estado terminal──

### Passo 2: elaborar uma política

A política é a função da distribuição de ação do estado. A função mais simples é o aleatório uniforme.

```python
def uniform_policy(state):
    return {a: 0.25 for a in ACTIONS}

def rollout(policy, max_steps=200):
    s, total, steps = (0, 0), 0.0, 0
    for _ in range(max_steps):
        a = sample(policy(s))
        s, r, done = step(s, a)
        total += r
        steps += 1
        if done:
            break
    return total, steps
```

运行随机政策 1000 次──这个4×4板的平均回报 大约是 -60到 -80──最佳回报是 -6──沿直线路径向下再向右)──缩小这个差距,就是9阶段的全部内容──

### Passo 3: através da equação Bellman 精确计算 `V^π`

Para os MDPs pequenos, a equação de Bellman é um sistema linear.

```python
def policy_evaluation(policy, gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in all_states()}
    while True:
        delta = 0.0
        for s in all_states():
            if s == TERMINAL:
                continue
            v = 0.0
            for a, pi_a in policy(s).items():
                s_next, r, _ = step(s, a)
                v += pi_a * (r + gamma * V[s_next])
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            return V
```

É a avaliação iterativa de políticas. É o primeiro algoritmo de Sutton & Barto, e também a base teórica de cada método RL posterior.

### Passo 4:`γ`É um hiperparâmetro com significado físico

O horizonte é eficaz .`1 / (1 - γ)`- Não.`γ = 0.9`→ 10 passos.`γ = 0.99`→ 100 passos.`γ = 0.999`→ 1000 passos.

太低时,代理会目光短浅──太高时,信用分配会变噪,因为 muitas etapas iniciais 城市将共同承担远未来奖励的责任──LLM RLHF normalmente usa `γ = 1`,因为 episódios 短且有界──Control tasks 使用 `0.95–0.99`❖ Jogos de estratégia de longo horizonte `0.999`- Não.

## 陷

- **Non-Markovian state.**Se você precisar de três observações recentes 才能决策, então state 不只是当前观察──修复:stack frames(DQN 在 Atari 上堆叠 4 ) 或使用复制状态(在观测上使用 LSTM/GRU)──
- **Sparse rewards.**Apenas em vitória, dá recompensa, vai fazer grande espaço de estado em que aprender é quase impossível.
- **Reward hacking.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
- **Discount mis-spec.**Na tarefa de horizonte infinito 上使用 `γ = 1`Vai fazer cada valor tornar-se infinito.`γ < 1`Para a limitação.
- **Reward scale.**Os resultados de {+100, -100} e {+1, -1} darão as mesmas políticas ótimas, mas a magnitude do gradiente será muito diferente.`[-1, 1]`- Não.

## Usá-lo

Antes de 2026 a pilha de CODE CONTACT, reduzir cada linha de RL para um MDP:

| Situation | State | Action | Reward | γ |
|-----------|-------|--------|--------|---|
| Control（locomotion, manipulation） | Joint angles + velocities | Continuous torques | Task-specific shaped | 0.99 |
| Games（chess, Go, poker） | Board + history | Legal move | Win=+1 / loss=-1 | 1.0（finite） |
| Inventory / pricing | Stock + demand | Order qty | Revenue - cost | 0.95 |
| RLHF for LLMs | Context tokens | Next token | Reward-model score at end | 1.0（episode ~200 tokens） |
| GRPO for reasoning | Prompt + partial response | Next token | Verifier 0/1 at end | 1.0 |

Antes de escrever qualquer ciclo de treinamento, primeiro escreva este grupo de cinco. A maioria dos relatórios de bugs de RL não funciona, eventualmente podem ser traçados para a formulação de MDP que já está quebrada no papel.

## Envia-o

保存为 `outputs/skill-mdp-modeler.md`- Não .

```markdown
---
name: mdp-modeler
description: 给定一个 task description，在训练前产出 Markov Decision Process spec 并标记 formulation risks。
version: 1.0.0
phase: 9
lesson: 1
tags: [rl, mdp, modeling]
---

给定一个 task（control / game / recommendation / LLM fine-tuning），输出：

1. State。精确的 feature vector 或 tensor spec。解释 Markov property。
2. Action。Discrete set 或 continuous range。Dimensionality。
3. Transition。Deterministic、stochastic-with-known-model，或 sample-only。
4. Reward。Function 与 source。Sparse vs shaped。Terminal vs per-step。
5. Discount。Value 与 horizon justification。

拒绝交付任何 state 为 non-Markovian、且未明确提到 frame-stacking 或 recurrent state 的 MDP。拒绝任何不是根据 target outcome 定义的 reward。标记 infinite-horizon task 上的任何 `γ ≥ 1.0`。标记任何 reward range 超过 typical step reward 100x 的情况，因为这很可能是 gradient-explosion source。
```

## 练习

1. **Easy.**Em`code/main.py`中实现 4×4 GridWorld 和 random-policy rollout──运行 10,000 个集──报告 return 的 mean 和 std──与最佳回报(-6)
2. **Medium.**Política uniforme aleatória, uso `γ ∈ {0.5, 0.9, 0.99}`运行 `policy_evaluation`- Não.`V`Impressão para 4×4 grid,.. Explica por que o terminal  Valores de estado próximos 会随之大`γ`Mais rápido crescimento.
3. **Hard.**Transformar o GridWorld em estocástico: cada ação em probabilidade`p = 0.1`滑向相邻方向── reavaliação da política uniforme──`V[start]`Vai mudar melhor ou pior?

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| MDP | “Reinforcement Learning setup” | 满足 Markov property 的元组 `(S, A, P, R, γ)`。 |
| State | “Agent 看到的东西” | 在所选 policy class 下，future dynamics 的 sufficient statistic。 |
| Policy | “Agent 的行为” | Conditional distribution `π(a \| s)` 或 deterministic map `s → a`。 |
| Return | “Total reward” | 从当前 step 开始的 discounted sum `Σ γ^t r_t`。 |
| Value | “一个 state 有多好” | 在 `π` 下从 `s` 开始的 expected return。 |
| Q-value | “一个 action 有多好” | 在 `π` 下从 `s` 开始并以第一个 action `a` 开始的 expected return。 |
| Bellman equation | “Dynamic programming recursion” | 把 value / Q 分解为 one-step reward 加 discounted successor value 的 fixed-point。 |
| Discount `γ` | “未来 vs 现在” | 远未来 reward 的 geometric weight；effective horizon 为 `~1/(1-γ)`。 |

## 延伸阅读

- [Sutton & Barto (2018). Reinforcement Learning: An Introduction, 2nd ed.](http://incompleteideas.net/book/RLbook2020.pdf) 教科書。第3 章介绍 MDPs 和 Bellman equações;第1 章提出奖励假设,它支后续每一课──
- [Bellman (1957). Dynamic Programming](https://press.princeton.edu/books/paperback/9780691146683/dynamic-programming) Origem da equação de Bellman:
- [OpenAI Spinning Up — Part 1: Key Concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html) Desde o ângulo profundo do RL 写的简洁 MDP primer──
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887)                                                                                                                                                                                                                                                              
- [Littman (1996). Algorithms for Sequential Decision Making (PhD thesis)](https://www.cs.rutgers.edu/~mlittman/papers/thesis-main.pdf) Ter MDPs  como a mais clara orientação de programação dinâmica 
