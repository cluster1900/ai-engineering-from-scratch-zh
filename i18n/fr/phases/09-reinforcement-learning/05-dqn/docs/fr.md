# Réseaux Q profonds (DQN)

> 2013: Mnih dans les premiers pixels 上 entraîne un réseau de Q-learning, dans sept Atari game a battu tous les agents classiques RL. 2015: étendu à 49 游戏, publié sur Nature 上,点燃了深度RL 时代.

**类型：**Construire
**语言：**Python
**前置要求：**La phase 3 · 03 (répartition), la phase 9 · 04 (apprentissage Q, SARSA)
**时间：**- 75 minutes

##  problématique

L'apprentissage de Q-tabulaire  nécessite une mise en œuvre unique de la valeur Q-tabulaire  sur un tableau d'échecs  sur lequel il y a environ 1043 états  sur Atari 画面是 210×160×3 = 100 800 个特色── sur des milliers d'états  sur des milliards d'états  sur des milliards d'états 

Le rétablissement est évident: avec le réseau neuronal.`Q(s, a; θ)` remplacement du tableau Q── mais après ces événements, il a apparemment fallu plusieurs décennies pour arriver ici── simple approximation des fonctions 搭配 Q-learning 会在 deadly triad 下发散: approximation des fonctions + démarrage + apprentissage hors politique──Mnih et al. (2013, 2015) 找出三个能稳定学习过程的工程技巧:

1. **Experience replay**让转变 去相关──
2. **Target network**结 but de démarrage。
3. **Reward clipping**归一化 Gradient 幅度。

La DQN d'Atari est la première fois à utiliser un seul architecture et un seul hyperparamètre, à partir de pixels originaux, pour résoudre plusieurs dizaines de problèmes de contrôle.

## 概念

![DQN training loop: env, replay buffer, online net, target net, Bellman TD loss](../assets/dqn.svg)

**目标。**DQN dans la fonction Q-neural 上 minimiser la perte de TD en une étape:

`L(θ) = E_{(s,a,r,s')~D} [ (r + γ max_{a'} Q(s', a'; θ^-) - Q(s, a; θ))² ]`

`θ`= réseau en ligne, chaque étape à travers la descente graduelle 更新──`θ^-`= réseau cible, périodique`θ`Il y a une fois environ 10 000 pas.`D`= tampon de répétition des transitions passées

**三个技巧，按重要性排序：**

**Experience replay。**Une contenue`~10⁶`Chaque étape de formation est un petit jeu de données. Cela brise le temps de la relation. Les cadres de formation sont presque identiques.

**Target network。**Dans Bellman, les deux côtés utilisent le même réseau.`Q(·; θ)`, permettra au but de se déplacer à chaque mise à jour, c'est-à-dire de suivre son propre train de course.`Q(·; θ^-)`, ses poids 结──每隔 `C`步,复制 `θ → θ^-` Cela permettra de maintenir la régression dans des milliers de étapes de degré `θ^- ← τ θ + (1-τ) θ^-`(pour le DDPG, SAC) est un type de variation plus simple.

**Reward clipping。**La gamme de récompenses d'Atari est de 1 à 1000+`{-1, 0, +1}`On peut empêcher un seul jeu de domination Gradient. Quand la grandeur de la récompense est importante, c'est faux. Mais pour Atari, on peut, car seuls les symboles sont importants.

**Double DQN。**Hasselt (2016) 修复了最大化偏见: utiliser le net en ligne 来*选择* action, utiliser le net cible 来* évaluer* l'action.

`target = r + γ Q(s', argmax_{a'} Q(s', a'; θ); θ^-)`

C'est un remplacement, l'effet est meilleur.

**其他改进（Rainbow, 2017）：**Retour prioritaire(更多采样 transitions à forte déficience TD)`V(s)`Avec des réseaux bruyants, des résultats en n étapes, des démarches de distribution en plusieurs étapes, chaque élément entraîne une augmentation de plusieurs centaines de points, des bénéfices de plus en plus élevés.


```figure
f3-dqn-stability
```

## - Je le construis.

Le code ici est stdlib-only et numpy-free: nous sommes dans un très petit réseau continu GridWorld 上 utilise manuellement écrit MLP de couche cachée unique, donc chaque étape de formation peut être effectuée en microsecondes.

### 步骤 1: réplique le tampon

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

Atari utilise environ 50 000 de capacité; notre environnement de jouets utilise 5 000 de capacité suffisante.

### 步骤 2: un très petit réseau Q (MLP)

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

Passage vers l'avant: linéaire → RELU → linéaire―, c'est tout le réseau―.

### 步骤 3: Mise à jour du DQN

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

Il a la forme de Q-learning dans le cours 04 et il y a seulement deux différences:`Q(·; θ)`Faire une répartition de l'indice, et non une table de référence;`Q(·; θ^-)`Il y a une autre.

### 步骤 4: boucle de niveau extérieur

Pour chaque épisode, sur la base`Q(·; θ)`执行 ε-greedy,把 transitions 放入缓冲,采样minibatch,执行一次 Gradient step,并周期性同步 `θ^- ← θ`模式如下:

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

Dans ce jeu de 16 dimensions, l'agent se retrouve dans environ 500 épisodes, et il apprend à se rapprocher de la meilleure politique possible.

## 常见陷

- **Deadly triad。**Approximation de fonction + hors politique + démarrage 可能发散──DQN Utilisez le réseau cible + répétition 缓解这个问题; don't remove any one──
- **Exploration。**ε  doit diminuer, habituellement à la phase de 10% de la formation préalable, de 1,0  diminuer à 0,01 ⋅ si l'exploration précoce n'est pas suffisante, Q-net sera recevoir jusqu'à la base locale ⋅
- **Overestimation。**Pour le bruit`max`Il est également utilisé dans la production de produits de haute qualité.
- **Reward scale。**裁剪或归归化奖励; Gradient 幅度与奖励大小 成正比──
- **Replay buffer coldstart。**Dans le buffer  avoir plusieurs milliers de transitions  avant ne pas entraîner ⋅ sur la base d'environ 20 échantillons de Gradients précoces ⋅
- **Target sync frequency。**太频繁 ≈ 没有目标网;太不频繁 ≈目标 过时――Atari DQN Utilisez 10 000 étapes env― 经验规则: 每约1/100 个训练视野 同步一次―
- **Observation preprocessing。**Atari DQN 堆叠 4 , faire état 满足 Markov──任何包含速度信息的环境都需要框架-stacking或复发状态──

## Utilisez-le

D'ici 2026, DQN est déjà très peu à la pointe de la technologie, mais reste un algorithme de référence hors politique:

| Task | 首选 Method | 为什么不是 DQN？ |
|------|-------------|------------------|
| Discrete-action Atari-like | Rainbow DQN or Muesli | 同一框架，更多技巧。 |
| Continuous control | SAC / TD3 (Phase 9 · 07) | DQN 没有 policy network。 |
| On-policy / high-throughput | PPO (Phase 9 · 08) | 没有 replay buffer；更容易扩展。 |
| Offline RL | CQL / IQL / Decision Transformer | Conservative Q targets，没有 bootstrapping blowups。 |
| Large discrete action spaces (recommender) | DQN with action embedding, or IMPALA | 可以；细节装饰很重要。 |
| LLM RL | PPO / GRPO | Sequence-level，而不是 step-level；Loss 不同。 |

Ces expériences sont toujours en vigueur. Les réseaux cibles sont actuellement en jeu avec SAC, TD3, DDPG, SAC-X, AlphaZero, ainsi que chaque méthode de RL hors ligne.

## Je le livre.

保存为 `outputs/skill-dqn-trainer.md`- Le numéro de la liste:

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

1. **Easy。**运行  référencement`code/main.py`◊ dessiner une courbe de retour par épisode―courir moyenne 超过 -10 需要多少个节目?
2. **Medium。**禁用目标网络 (WEB 双边都使用网络)  Mètre entraînement instabilité: retour 会震荡还是发散?
3. **Hard。**添加 Double DQN: utiliser le net en ligne 选择 `argmax a'`, utiliser le réseau cible 评估── comparer GridWorld 上训练 1,000 个集 后,使用与不使用双DQN 时`Q(s_0, best_a)`À la réalité`V*(s_0)`Le parti pris.

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

- [Mnih et al. (2013). Playing Atari with Deep Reinforcement Learning](https://arxiv.org/abs/1312.5602)                                                                                                                                                                                                                                                              
- [Mnih et al. (2015). Human-level control through deep reinforcement learning](https://www.nature.com/articles/nature14236) Nature 论文, 49-jeux DQN。
- [Hasselt, Guez, Silver (2016). Deep Reinforcement Learning with Double Q-learning](https://arxiv.org/abs/1509.06461) DDQN
- [Wang et al. (2016). Dueling Network Architectures](https://arxiv.org/abs/1511.06581)- Je suis en train de faire duel.
- [Hessel et al. (2018). Rainbow: Combining Improvements in Deep RL](https://arxiv.org/abs/1710.02298) 叠加技巧的论文──
- [OpenAI Spinning Up — DQN](https://spinningup.openai.com/en/latest/algorithms/dqn.html) 清晰的现代讲解──
- [Sutton & Barto (2018). Ch. 9 — On-policy Prediction with Approximation](http://incompleteideas.net/book/RLbook2020.pdf) 教科書中对 致命三三的处理;DQN's target network 和 replay buffer 正是为服它而设计的──
- [CleanRL DQN implementation](https://docs.cleanrl.dev/rl-algorithms/dqn/) Utilisation de la référence DQN à fichier unique pour les études d'ablation; adapté à la version originale de ce cours 阅读一起.
