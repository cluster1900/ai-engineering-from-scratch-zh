# Redes Q Profundas (DQN)

> 2013: Mnih em pixels primitivos 上 trained a Q-learning network, em sete Atari games derrotou todos os agentes RL clássicos. 2015: expandido para 49 games, publicado em Nature 上,点燃了深度RL时代.

**类型：**Construir
**语言：**Python
**前置要求：**Fase 3 · 03 (Repropagação), Fase 9 · 04 (Q-learning, SARSA)
**时间：**- 75 minutos.

## 问题

Tabela Q-learning  necessita para cada (estado, ação) para guardar de forma individual um Q-valor。 uma tabela de xadrez ∼ aproximadamente 1043 estados。 uma  Atari 画面是210×160×3 = 100,800 个特色。 Tabula RL ∼ em alguns mil estados 时就会失效,更不用说数十亿州。

O que acontece é que o método de reparação é óbvio:`Q(s, a; θ)` substituir a tabela Q-, mas depois de esse tipo de eventos, obviamente, levou várias décadas para chegar até aqui                                                                                                                                                                                                                                                

1. **Experience replay**让过渡 去相关──
2. **Target network**- O alvo do bootstrap.
3. **Reward clipping**归一化 Gradiente 幅度。

O DQN do Atari é o primeiro a usar uma única estrutura e um único hiperparâmetro, de pixels originais  resolver vários problemas de controle .

## 概念

![DQN training loop: env, replay buffer, online net, target net, Bellman TD loss](../assets/dqn.svg)

**目标。**DQN em Neural Q-função 上 Minimizar perda TD de um passo:

`L(θ) = E_{(s,a,r,s')~D} [ (r + γ max_{a'} Q(s', a'; θ^-) - Q(s, a; θ))² ]`

`θ`= rede online, cada passo através do Descenso Gradiente 更新──`θ^-`= rede-alvo, periodicamente desde `θ`复制(约每10,000步一次)`D`= Buffer de repetição de transições passadas.

**三个技巧，按重要性排序：**

**Experience replay。**Um conteúdo`~10⁶`O sistema de transições é um sistema de transições de transições. Cada passo de treinamento é um sistema de transição de transições.

**Target network。**Em Bellman, ambos os lados usam a mesma rede.`Q(·; θ)`, vai deixar o alvo em cada atualização mover, ou seja, seguir seu próprio rabo de corrida.`Q(·; θ^-)`, seus pesos 结──每隔 `C`步,复制 `θ → θ^-`❖ Isso permitirá que o alvo de regressão em milhares de passos gradiais mantenha-se estável― Soft updates `θ^- ← τ θ + (1-τ) θ^-`(para DDPG, SAC) é uma variação mais suave.

**Reward clipping。**A amplitude de recompensa da Atari é de 1 a 1000+`{-1, 0, +1}`Pode impedir um determinado jogo, mas só o símbolo é importante.

**Double DQN。**Hasselt (2016) 修复了最大化偏见: usar a rede online 来*选择* ação, usar a rede alvo 来* avalia* é。

`target = r + γ Q(s', argmax_{a'} Q(s', a'; θ); θ^-)`

É um substituto, o efeito está melhor.

**其他改进（Rainbow, 2017）：**Reprodução prioritária (((更多采样高TD-error transitions) ]]`V(s)`O que é mais importante é que o sistema de informação seja um sistema de informação e de informação, que seja um sistema de informação e de informação.


```figure
f3-dqn-stability
```

## Construí-lo

O código aqui é apenas stdlib e numpy-free: estamos em uma GridWorld muito pequena contínua usando MLP de camada oculta escrita à mão, por isso cada passo de treinamento pode ser executado em microsecondas.

### 步骤 1: replay buffer

```python
class ReplayBuffer:
    def __init__(self, capacity):
        self.buf = []
        self.capacity = capacity
    def push(self, s, a, r, s_next, done):
        if len(self.buf) == self.capacity:
            self.buf.pop(0)
        self.buf.append((s, a, r, s_next, done))
    def sample(self, batch, rng):
        return rng.sample(self.buf, batch)
```

A Atari usa cerca de 50.000 unidades, o nosso ambiente de brinquedos usa 5.000 unidades.

### 步骤 2: uma pequena rede Q (MLP)

```python
class QNet:
    def __init__(self, n_in, n_hidden, n_actions, rng):
        self.W1 = [[rng.gauss(0, 0.3) for _ in range(n_in)] for _ in range(n_hidden)]
        self.b1 = [0.0] * n_hidden
        self.W2 = [[rng.gauss(0, 0.3) for _ in range(n_hidden)] for _ in range(n_actions)]
        self.b2 = [0.0] * n_actions
    def forward(self, x):
        h = [max(0.0, sum(w * xi for w, xi in zip(row, x)) + b) for row, b in zip(self.W1, self.b1)]
        q = [sum(w * hi for w, hi in zip(row, h)) + b for row, b in zip(self.W2, self.b2)]
        return q, h
```

Passagem para a frente: linear → ReLU → linear― é a rede inteira―

### 步骤 3: atualização DQN

```python
def train_step(online, target, batch, gamma, lr):
    grads = zeros_like(online)
    for s, a, r, s_next, done in batch:
        q, h = online.forward(s)
        if done:
            y = r
        else:
            q_next, _ = target.forward(s_next)
            y = r + gamma * max(q_next)
        td_error = q[a] - y
        accumulate_grads(grads, online, s, h, a, td_error)
    apply_sgd(online, grads, lr / len(batch))
```

A forma dele é a de Q-learning na lição 04 , só há duas diferenças:`Q(·; θ)`Fazer a propagação de volta, em vez de uma tabela de indicação;`Q(·; θ^-)`- Não.

### 步骤 4: Loop de nível externo

Para cada episódio, baseado em`Q(·; θ)` Execução de transições                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `θ^- ← θ`模式如下:

```python
for episode in range(N):
    s = env.reset()
    while not done:
        a = epsilon_greedy(online, s, epsilon)
        s_next, r, done = env.step(s, a)
        buffer.push(s, a, r, s_next, done)
        if len(buffer) >= batch:
            train_step(online, target, buffer.sample(batch), gamma, lr)
        if steps % sync_every == 0:
            target = copy(online)
        s = s_next
```

Em nosso uso de um estado de 16 dimensões de um único estado quente em um pequeno GridWorld, o agente vai estar em cerca de 500 episódios dentro de um programa de política mais adequada.

## 常见陷

- **Deadly triad。**Função aproximada + off-policy + bootstrapping 可能发散──DQN Utilize target net + replay 缓解这个问题;不要移除任何一个──
- **Exploration。**ε                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
- **Overestimation。**Para Q 取 ruidosos`max`会产生向上偏差──生产中始终使用双DQN──
- **Reward scale。**剪剪或归归化奖励; Gradiente 幅度与奖励大小 成正比──
- **Replay buffer coldstart。**Em buffer  possuir várias milhas de transições  antes não treinar ⋅ Baseado em cerca de 20 amostras de Gradientes iniciais ⋅
- **Target sync frequency。**太频繁 ≈ 没有目标网;太不频繁 ≈目标 过时――Atari DQN 使用 10,000 个 env steps──经验规则:每约1/100 个训练视界 同步一次──
- **Observation preprocessing。**Atari DQN 堆叠 4 , fazer estado 满足 Markov── qualquer que contenha informações de velocidade de ambiente  都 需要框架-stacking或 recurrent state──

## Use-o

Até 2026, o DQN já é muito pouco de última geração, mas ainda é um algoritmo de referência fora da política:

| Task | 首选 Method | 为什么不是 DQN？ |
|------|-------------|------------------|
| Discrete-action Atari-like | Rainbow DQN or Muesli | 同一框架，更多技巧。 |
| Continuous control | SAC / TD3 (Phase 9 · 07) | DQN 没有 policy network。 |
| On-policy / high-throughput | PPO (Phase 9 · 08) | 没有 replay buffer；更容易扩展。 |
| Offline RL | CQL / IQL / Decision Transformer | Conservative Q targets，没有 bootstrapping blowups。 |
| Large discrete action spaces (recommender) | DQN with action embedding, or IMPALA | 可以；细节装饰很重要。 |
| LLM RL | PPO / GRPO | Sequence-level，而不是 step-level；Loss 不同。 |

Estas experiências ainda são comuns. Reprodução e redes alvo aparecem agora em buffer de auto- jogação de SAC, TD3, DDPG, SAC-X, AlphaZero, bem como em cada método offline de RL.

## Entrega-o

保存为 `outputs/skill-dqn-trainer.md`- Não .

```markdown
---
name: dqn-trainer
description: 为 discrete-action RL task 生成 DQN training config（buffer、target sync、ε schedule、reward clipping）。
version: 1.0.0
phase: 9
lesson: 5
tags: [rl, dqn, deep-rl]
---

给定一个 discrete-action environment（observation shape、action count、horizon、reward scale），输出：

1. Network。Architecture（MLP / CNN / Transformer）、feature dim、depth。
2. Replay buffer。Capacity、minibatch size、warmup size。
3. Target network。Sync strategy（hard every C steps 或 soft τ）。
4. Exploration。ε start / end / schedule length。
5. Loss。Huber vs MSE、gradient clip value、reward clipping rule。
6. Double DQN。默认启用，除非有明确理由禁用。

拒绝交付没有 target network、没有 replay buffer，或 ε 固定为 1 的 DQN。拒绝 continuous-action tasks（路由到 SAC / TD3）。标记任何 reward range > 10× per-step mean 的情况，说明需要 clipping 或 scale normalization。
```

## 练习

1. **Easy。**运行 `code/main.py`◊ desenhar uma curva de retorno por episódio―uma média de execução 超過 -10 需要多少話?
2. **Medium。**禁用目标网络 (禁用目标网络) 在Bellman target 两侧都使用网) 测量训练不稳定性:回归 会震荡还是发散?
3. **Hard。**添加 Double DQN: usar net online 选择 `argmax a'`, usar a rede-alvo  avaliação── comparar gridworld  treinamento 1.000 个集 后,使用与不使用双DQN 时`Q(s_0, best_a)`Comparado à realidade`V*(s_0)`De preconceito.

## 关键术语
| Term | 人们怎么说 | 它实际是什么意思 |
|------|------------|------------------|
| DQN | “Deep Q-learning” | 带有 Neural Q-function、replay buffer 和 target network 的 Q-learning。 |
| Experience replay | “Shuffled transitions” | 每个 Gradient step 都均匀采样的 ring buffer；让数据去相关。 |
| Target network | “Frozen bootstrap” | 用于 Bellman target 的 Q 的周期性副本；稳定训练。 |
| Deadly triad | “为什么 RL 会发散” | Function approximation + bootstrapping + off-policy = 没有收敛保证。 |
| Double DQN | “修复 maximization bias” | Online net 选择 action，target net 评估它。 |
| Dueling DQN | “V and A heads” | 分解 Q = V + A - mean(A)；输出相同，Gradient flow 更好。 |
| Rainbow | “所有技巧” | DDQN + PER + dueling + n-step + noisy + distributional 合在一起。 |
| PER | “Prioritized Replay” | 按 TD-error magnitude 成比例采样 transitions。 |

## 延伸阅读

- [Mnih et al. (2013). Playing Atari with Deep Reinforcement Learning](https://arxiv.org/abs/1312.5602) 开启 Deep RL 的 2013 年 NeurIPS 研修文献──
- [Mnih et al. (2015). Human-level control through deep reinforcement learning](https://www.nature.com/articles/nature14236)Natureza, 49 jogos DQN
- [Hasselt, Guez, Silver (2016). Deep Reinforcement Learning with Double Q-learning](https://arxiv.org/abs/1509.06461) DDQN。
- [Wang et al. (2016). Dueling Network Architectures](https://arxiv.org/abs/1511.06581)Duelo de DQN
- [Hessel et al. (2018). Rainbow: Combining Improvements in Deep RL](https://arxiv.org/abs/1710.02298) 叠加技巧的论文──
- [OpenAI Spinning Up — DQN](https://spinningup.openai.com/en/latest/algorithms/dqn.html) 清晰的现代讲解──
- [Sutton & Barto (2018). Ch. 9 — On-policy Prediction with Approximation](http://incompleteideas.net/book/RLbook2020.pdf) 教科書中对 致命三三 (死三三)  (死三三)  (死三三)  (死三三)  (死三三)  (死三三)  (死三)  (死三)  (死三)  (死三)  (死三)  (死三)  (死三)  (死三)  (死三)  (死三)  (死三)  (死三)  (死三三)  (死三)  (死三)  (死三)  (死三)  (死三)  (死三) )  (死三) )  (死三) )  (死三)  (死三) )  (                                                                                                                          
- [CleanRL DQN implementation](https://docs.cleanrl.dev/rl-algorithms/dqn/) Utilizado para estudos de ablação de referência DQN de um único arquivo; adaptado com a versão inicial de esta aula 阅读一起──
