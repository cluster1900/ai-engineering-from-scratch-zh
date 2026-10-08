# 深度Q网络 (DQN)

> 2013年:Mnih 在原始像素上训练了一个Q学习网络,在七个Atari游戏中击败了所有经典RL代理──2015年:扩展到49个游戏,发表在Nature上,点燃了深度RL时代──DQN就是Q学习加上三个让函数接近的技巧──

**类型：**建立
**语言：**字符串
**前置要求：**阶段3 · 03 (反传播),阶段9 · 04 (Q-学习,SARSA)
**时间：**七十五分钟

## 问题

图表 Q-学习 需要为每一个 (状态,行动) 单独保存一个 Q-值. 一个棋牌板大约有1043个状态.

后看,修复方式很明显:用神经网络`Q(s, a; θ)`换Q表.但这种事后显然花了几十年才走到这里. 简单的函数近似与Q学习会在致命三元下发散:函数近似+启动+非政策学习.

1. **Experience replay**让转型 去相关.
2. **Target network**结起步目标.
3. **Reward clipping**归一化 渐进幅度

亚太里上的DQN是第一次使用单一架构和单一超参数集合,从原始像素中解决了几十个控制问题.

## 概念

![DQN training loop: env, replay buffer, online net, target net, Bellman TD loss](../assets/dqn.svg)

**目标。**通过测试,我们可以将其进行在线.

`L(θ) = E_{(s,a,r,s')~D} [ (r + γ max_{a'} Q(s', a'; θ^-) - Q(s, a; θ))² ]`

`θ`通过"渐进下降"的每一步更新.`θ^-`周期性地从`θ`复制 约每1万步一次)`D`= 过去的转变的重播缓冲.

**三个技巧，按重要性排序：**

**Experience replay。**一个包含`~10⁶`通过网络的网络,可以从罕见的有益转型中反复学习,并让连续 更新到相关的.没有它,使用神经网络的在线政策TD 在 Atari 上会发散.

**Target network。**在贝尔曼方程的两侧都使用相同的网络.`Q(·; θ)`让目标在每次更新时都移动,也就是追随自己的尾巴运行.`Q(·; θ^-)`结――每隔`C`步,复制`θ → θ^-`,这将使反向目标在数千个渐进步骤内保持稳定.`θ^- ← τ θ + (1-τ) θ^-`变体更平滑.

**Reward clipping。**亚太里的奖励幅度从1到1000+ 不等.`{-1, 0, +1}`对于Atari来说,只能因为符号而重要.

**Double DQN。**哈塞尔特 (2016) 修复了最大化偏见:使用在线网 来*选择*行动,使用目标网 来*评估*它。

`target = r + γ Q(s', argmax_{a'} Q(s', a'; θ); θ^-)`

这是一个替代品,效果更好.

**其他改进（Rainbow, 2017）：**更多采样高TD错误过渡) 双重架构(分离 `V(s)`它们的使用率也会增加,因此,它们的使用率也会增加.


```figure
f3-dqn-stability
```

## 构建它

这里的代码是仅仅是模块化,而且是无的:我们在一个很小的连续的 GridWorld 上使用手写的单层隐藏的MLP,因此每个训练步骤都能在微秒内运行.

### 步骤1:重播缓冲

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

我们的玩具环境使用5000就足够了.

### 步骤2:一个很小的Q网络 (手写MLP)

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

通过前进:线 → ReLU →线性――这就是整个网――

### 步骤3:DQN更新

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

它们的形状是第04课中Q学习的,只有两个区别:`Q(·; θ)`向后传播而不是索引表;`Q(·; θ^-)`,我知道.

### 步骤 4:外层循环

根据每一集`Q(·; θ)`执行 ε-贪,把转变 放入缓冲,采样微批,执行一次 渐进步骤,并周期性同步 `θ^- ← θ`◎ 模式如下:

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

在我们使用16维一级热状态的小网球中,代理会在约500集内学到接近最佳政策. 在亚太里上,将其扩展到200万个框架,并添加CNN特色提取器.

## 常见陷

- **Deadly triad。**运行近似+非政策+启动可能发散──DQN 使用目标网+重播 缓解这个问题;不要移除任何一个──
- **Exploration。**必须衰退,通常在训练前的10%阶段从1.0 衰退到0.01 ⋅如果早期的探索不够,Q-net 会收到局部盆地――
- **Overestimation。**对杂的Q 取`max`产生上偏差――生产中始终使用双DQN――
- **Reward scale。**裁剪或归纳奖励;渐进幅度与奖励大小 成正比.
- **Replay buffer coldstart。**在缓冲器中,有几千次过渡,不要训练.
- **Target sync frequency。**太频繁 ≈ 没有目标网;太不频繁 ≈目标 过时――阿塔利 DQN 使用10,000个 env步骤――经验规则:每约1/100个训练视野 同步一次――
- **Observation preprocessing。**设置在线电脑系统中,可实现速度的速度.

## 使用它

到2026年,DQN已经很少是最先进的,但仍然是参考的非政策算法:

| Task | 首选 Method | 为什么不是 DQN？ |
|------|-------------|------------------|
| Discrete-action Atari-like | Rainbow DQN or Muesli | 同一框架，更多技巧。 |
| Continuous control | SAC / TD3 (Phase 9 · 07) | DQN 没有 policy network。 |
| On-policy / high-throughput | PPO (Phase 9 · 08) | 没有 replay buffer；更容易扩展。 |
| Offline RL | CQL / IQL / Decision Transformer | Conservative Q targets，没有 bootstrapping blowups。 |
| Large discrete action spaces (recommender) | DQN with action embedding, or IMPALA | 可以；细节装饰很重要。 |
| LLM RL | PPO / GRPO | Sequence-level，而不是 step-level；Loss 不同。 |

这些经验仍然通用. 复制和目标网络现在出现在SAC,TD3,DDPG,SAC-X,AlphaZero的自动播放缓冲器,以及每种离线RL方法中.

## 交付它

保存为`outputs/skill-dqn-trainer.md`其他:

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

1. **Easy。**运行`code/main.py`△每集的回报曲线绘制――运行平均 超过 -10 需要多少集?
2. **Medium。**禁用目标网络在贝尔曼目标 两侧都使用网络) ・测量训练不稳定性:回报会震荡还是发散?
3. **Hard。**添加双DQN:使用网上网 选择 `argmax a'`使用目标网 评估──比较噪音奖励 GridWorld 上训练 1,000 个集 后,使用与不使用双DQN 时`Q(s_0, best_a)`相对真实`V*(s_0)`偏见的.

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

- [Mnih et al. (2013). Playing Atari with Deep Reinforcement Learning](https://arxiv.org/abs/1312.5602) 开启深度RL的2013年NeurIPS研讨会论文──
- [Mnih et al. (2015). Human-level control through deep reinforcement learning](https://www.nature.com/articles/nature14236)自然论文,49场比赛的DQN──
- [Hasselt, Guez, Silver (2016). Deep Reinforcement Learning with Double Q-learning](https://arxiv.org/abs/1509.06461) DDQN──
- [Wang et al. (2016). Dueling Network Architectures](https://arxiv.org/abs/1511.06581)决斗的DQN──
- [Hessel et al. (2018). Rainbow: Combining Improvements in Deep RL](https://arxiv.org/abs/1710.02298) 叠加技巧的论文──
- [OpenAI Spinning Up — DQN](https://spinningup.openai.com/en/latest/algorithms/dqn.html)清晰的现代讲解――
- [Sutton & Barto (2018). Ch. 9 — On-policy Prediction with Approximation](http://incompleteideas.net/book/RLbook2020.pdf) 教科书中对致命三元的处理;DQN的目标网络和重播缓冲 正是为服它而设计的.
- [CleanRL DQN implementation](https://docs.cleanrl.dev/rl-algorithms/dqn/) 用于抽象研究的参考单档DQN;适合本课的从头开始版本一起阅读.
