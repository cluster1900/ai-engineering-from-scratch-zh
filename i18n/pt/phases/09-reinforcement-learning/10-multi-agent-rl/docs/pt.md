# RL multi-agente

> O RL de um agente único  假设环境是静止的──把两个学习的代理 放进同一个世界,这个假设就会失效: cada agente é parte de outro agente 环境, e ambos estão em mudança──Multi-agent RL é um grupo de deixar aprender no pressuposto de Markov 没有再成立时仍能收取技巧──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (Q-learning), Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~45 minutes

## 问题

Um robô aprender a navegar em uma sala, é um único agente RL 问题── uma equipe de futebol não é── AlphaStar em combate StarCraft contra os outros não é── um mercado composto por agentes de licitação ▌ não é── dois veículos negociam através de quatro rotas de estacionamento nem são── muitos problemas reais contra muitos são não──

Em cada configuração de multi-agente, do ponto de vista de qualquer agente, outros agentes são parte do ambiente. À medida que aprendem a mudar seu comportamento, o ambiente se torna não-estacionário. A propriedade de Markov depende apenas do estado atual e a minha ação será violada, pois o próximo estado também depende do que outros agentes escolherem, enquanto as suas políticas são objetivos em constante mudança.

Isto prejudicará as provas de convergência tabuleira (Q-learning) (Q-learning's assurance hypothèse environment is stationary of) (It will also destroy naive deep RL:agents 会在循环中相互追逐,永远无法收获稳定政策──You need multi-agent 专用技术:centralized training / decentralized execution、counterfactual baselines、league play、self-play──).

As aplicações para 2026 incluem: enxames de robôs, roteamento de tráfego, frotas de veículos autônomos, simuladores de mercado, sistemas de LLM multi-agente (Fase 16), bem como qualquer jogo com vários jogadores inteligentes.

## 概念

![Four MARL regimes: indep, centralized critic, self-play, league](../assets/marl.svg)

**Formalism: Markov Game.**MDP                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `S`、ação conjunta `a = (a_1, …, a_n)`、 transição `P(s' | s, a)`, e as recompensas de cada agente .`R_i(s, a, s')`Todos os agentes.`i`Em sua própria política .`π_i`Se as recompensas forem totalmente iguais, é o mesmo.**fully cooperative**Se for a soma zero, é.**adversarial**Se misturado, então é.**general-sum**- Não.

**核心挑战：**

- **Non-stationarity.**De agente .`i`É um ponto de vista.`P(s' | s, a_i)`取决于 `π_{-i}`E está a mudar.
- **Credit assignment.**Em recompensa compartilhada, qual agente levou a isso?
- **Exploration coordination.**Os agentes devem explorar estratégias de complemento, em vez de explorar o mesmo estado.
- **Scalability.**Espaço de acção comum`n`Número de crescimento:
- **Partial observability.**Cada agente só pode ver a sua própria observação; o estado global é oculto.

**四种主导范式：**

**1. Independent Q-learning / independent PPO (IQL, IPPO).**Cada agente aprendiza sua própria política, coloca os outros agentes como parte do ambiente.

**2. Centralized training, decentralized execution (CTDE).**Todos os agentes têm a sua própria política.`π_i`, é com observação local .`o_i`Para a implementação, é necessário uma execução descentralizada.`Q(s, a_1, …, a_n)`Em condições de estado global completo e de acção conjunta:
- **MADDPG**(Lowe et al. 2017): 带有每个代理 一个集中批评的DDPG──
- **COMA**(Foerster et al. 2017): base contrafactual 问`a'`A minha recompensa será quanto?
- **MAPPO**- Não .**IPPO**com crítico compartilhado (Yu et al. 2022): 带有集中价值函数的 PPO──2026年合作社 MARL 中的主导方法──
- **QMIX**(Rashid et al. 2018): decomposição do valor`Q_tot(s, a) = f(Q_1(s, a_1), …, Q_n(s, a_n))`,并使用 monótono misturação。

**3. Self-play.**Com um agente, duas duplas se enfrentam. A política do outro é a política do outro.

**4. League play.**auto-jogo À expansão de ambientes de soma geral / adversários: manter um conjunto de políticas do passado e do presente, de oponentes da liga, e contra eles treinamento.

**Communication.**允许 agentes  entre enviar mensagens aprendidas `m_i` Em configurações cooperativas 中有效──Foerster et al. (2016) 表明,diferenciável comunicação entre agentes pode ser treinado de fim a fim──Hoje baseado em sistemas multi-agentes de LLM (Phase 16)


```figure
f3-marl-orbit
```

## Construí-lo

Esta aula usa um GridWorld 6×6, contendo dois agentes cooperativos. Eles começam a partir de um canto relativo, devem alcançar um objetivo compartilhado.`-1`- Não . - Não .`+10`参见 `code/main.py`- Não.

### 步骤 1: ambiente multi-agente

```python
class CoopGridWorld:
    def __init__(self):
        self.size = 6
        self.goal = (5, 5)

    def reset(self):
        return ((0, 0), (5, 0))  # 两个 agents

    def step(self, state, actions):
        a1, a2 = state
        new1 = move(a1, actions[0])
        new2 = move(a2, actions[1])
        done = (new1 == self.goal) and (new2 == self.goal)
        reward = 10.0 if done else -1.0
        return (new1, new2), reward, done
```

Espaço de acção conjunto é`|A|² = 16`O estado global é de duas posições.

### 步骤 2: aprendizagem Q independente

Cada agente 运行自己的Q-table,以共同状态 作为关键.

```python
def independent_q(env, episodes, alpha, gamma, epsilon):
    Q1, Q2 = defaultdict(default_q), defaultdict(default_q)
    for _ in range(episodes):
        s = env.reset()
        while not done:
            a1 = epsilon_greedy(Q1, s, epsilon)
            a2 = epsilon_greedy(Q2, s, epsilon)
            s_next, r, done = env.step(s, (a1, a2))
            target1 = r + gamma * max(Q1[s_next].values())
            target2 = r + gamma * max(Q2[s_next].values())
            Q1[s][a1] += alpha * (target1 - Q1[s][a1])
            Q2[s][a2] += alpha * (target2 - Q2[s][a2])
            s = s_next
```

É eficaz nesta missão, porque as recompensas são intensas e em conjunto. Em tarefas fortemente ligadas, o agente deve esperar a missão de outro.

### 步骤3:Q centralizado e valor decomposto atualização

Para acções conjuntas Use a Q:`Q(s, a_1, a_2)` Usar recompensas compartilhadas 更新──执行时通过边缘化 来分散化:`π_i(s) = argmax_{a_i} max_{a_{-i}} Q(s, a_1, a_2)`O espaço de acção comum de nível índice é usado para trocar uma visão global * verdadeira*

### 步骤 4: 简单 auto-jogo  adversário 2 agente)

Com um agente, dois papéis. Agente de treinamento A contra Agente B.`K`个 episódios,把 A's weights 复制到 B──对称训练,进展一致── AlphaZero recipe 的缩写版──

## 常见陷

- **Non-stationary replay.**Usar agentes independentes 时, Replay experiência em vez de um único agente pior, porque as antigas transições são agora já passadas por oponentes 生成的──修复:
- **Credit assignment ambiguity.**长 episode 后得到共享奖励;没有明确方式说明哪个代理做出贡献──修复:counterfactual baselines(COMA),或按代理做奖励塑造──
- **Policy drift / chasing.**A melhor resposta de cada agente é alterada com a atualização de outro agente.
- **Reward hacking via coordination.**Agentes 找到了设计者没有预期到的协调 exploits──Aventos de leilões 会收到报价零──修复:谨慎的奖励设计、行为限制──
- **Exploration redundancy.**两个代理 探索相同的状态-action pairs──修复: cada agente utiliza bônus de entropia, ou condição de papel──
- **League cycles.**純自遊可能卡在支配周期 中──修复:使用包含多样对手的联赛比赛──
- **Sample explosion.** `n`个 agentes × espaço de estado × ações conjuntas。用 função aproximação 近似; use factored action spaces(cada agente 一个政策输出头)。

## Use-o

2026  MARL  aplicativo

| Domain | Method | Notes |
|--------|--------|-------|
| Cooperative navigation / manipulation | MAPPO / QMIX | CTDE；shared critic + decentralized actors。 |
| Two-player games (chess, Go, poker) | Self-play with MCTS (AlphaZero) | Zero-sum；对称训练。 |
| Complex multiplayer (Dota, StarCraft) | League play + imitation pretraining | OpenAI Five, AlphaStar。 |
| Autonomous-vehicle fleets | CTDE MAPPO / PPO with attention | Partial obs；可变 team sizes。 |
| Auction markets | Game-theoretic equilibrium + RL | 当 `n` → ∞ 时使用 mean-field RL。 |
| LLM multi-agent systems (Phase 16) | Natural-language comm + role conditioning | RL loop 位于 agent-planning layer。 |

Em 2026, o maior crescimento da MARL será baseado no sistema de LLM: os agentes do modelo de linguagem, formados por grupos, conduzirão a consulta, debate, construção de software.

## Entrega-o

保存为 `outputs/skill-marl-architect.md`- Não .

```markdown
---
name: marl-architect
description: 为给定任务选择正确的 multi-agent RL regime（IPPO, CTDE, self-play, league）。
version: 1.0.0
phase: 9
lesson: 10
tags: [rl, multi-agent, marl, self-play]
---

给定一个包含 `n` 个 agents 的任务，输出：

1. Regime classification。Cooperative / adversarial / general-sum。说明理由。
2. Algorithm。IPPO / MAPPO / QMIX / self-play / league。理由要关联 coupling tightness 和 reward structure。
3. Information access。Centralized training（哪些 global info 会进入 critic）？Decentralized execution？
4. Credit assignment。Counterfactual baseline、value decomposition，或 reward shaping。
5. Exploration plan。Per-agent entropy、population-based training，或 league。

在 tightly-coupled cooperative tasks 上拒绝 independent Q-learning。拒绝为存在 cycle risks 的 general-sum 推荐 self-play。标记任何没有 fixed-opponent eval 的 MARL pipeline（cherry-picked self-play numbers 很常见）。
```

## 练习

1. **Easy.**Em cooperativa de dois agentes GridWorld 上训练独立Q-learning──需要多少集 才能让 mean return > 0?绘制联合学习曲线──
2. **Medium.**Adicionar uma tarefa de coordenação: só quando dois agentes no mesmo ciclo de trabalho atingirem o objetivo, é que o Q independente ainda pode receber?
3. **Hard.** Realizar um crítico centralizado de treinamento em estilo MAPPO, e coordinar tarefas de comparação com a velocidade de convergência do PPO independente.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Markov game | "Multi-agent MDP" | `(S, A_1, …, A_n, P, R_1, …, R_n)`；每个 agent 都有自己的 reward。 |
| CTDE | "Centralized training, decentralized execution" | Training time 使用 joint critic；每个 agent 的 policy 只使用 local obs。 |
| IPPO | "Independent PPO" | 每个 agent 单独运行 PPO。简单 baseline；经常被低估。 |
| MAPPO | "Multi-agent PPO" | 带有以 global state 为条件的 centralized value function 的 PPO。 |
| QMIX | "Monotonic value decomposition" | `Q_tot = f_monotone(Q_1, …, Q_n)` 允许 decentralized argmax。 |
| COMA | "Counterfactual multi-agent" | Advantage = 我的 Q 减去对我的 action 做 marginalizing 后的 expected Q。 |
| Self-play | "Agent vs past self" | 单个 agent，两个 roles；zero-sum games 的标准方法。 |
| League play | "Population training" | 缓存过去的 policies，从 pool 中采样 opponents；处理 strategy cycles。 |

## 延伸阅读

- [Lowe et al. (2017). Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments (MADDPG)](https://arxiv.org/abs/1706.02275) 带集中批判的CTDE──
- [Foerster et al. (2017). Counterfactual Multi-Agent Policy Gradients (COMA)](https://arxiv.org/abs/1705.08926) Utilizadas em função das linhas de base contrafactuais de atribuição de crédito。
- [Rashid et al. (2018). QMIX: Monotonic Value Function Factorisation](https://arxiv.org/abs/1803.11485) 带 monotonicity  带 monotonicity  带 monotonicity 带 monotonicity 带 monotonicity 带 monotonicity 带 monotonicity 带 monotonicity 带 monotonicity 带 monotonicity 带 monotonicity 带 monotonicity 带 monotonicity 带 monotonicity 带 monotonicity 带 monotonicity 带 monotonicity 带 monotonicity 带 monotonicity 带 monotonicity 带 monotonicity 带 monotonicity 带 monotonicity 带 monotonicity 带 monotonicity 带 monotonicity 带
- [Yu et al. (2022). The Surprising Effectiveness of PPO in Cooperative Multi-Agent Games (MAPPO)](https://arxiv.org/abs/2103.01955)O PPO contra o MARL, é um grande esforço.
- [Vinyals et al. (2019). Grandmaster level in StarCraft II using multi-agent reinforcement learning (AlphaStar)](https://www.nature.com/articles/s41586-019-1724-z) Grandes jogos de liga.
- [Silver et al. (2017). Mastering the game of Go without human knowledge (AlphaGo Zero)](https://www.nature.com/articles/nature24270)Jogos de soma zero.
- [Sutton & Barto (2018). Ch. 15 — Neuroscience & Ch. 17 — Frontiers](http://incompleteideas.net/book/RLbook2020.pdf)  contém material de ensino para configurações de multi-agentes e tratamento simplificado do problema de não estacionalidade, enquanto o CTDE está sendo projetado para resolver esse problema.
- [Zhang, Yang & Başar (2021). Multi-Agent Reinforcement Learning: A Selective Overview](https://arxiv.org/abs/1911.10635)  覆盖 кооператив¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
