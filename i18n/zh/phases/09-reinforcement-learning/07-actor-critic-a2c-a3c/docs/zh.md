# 演员评论家  A2C 和 A3C

> 强化 很声.`V̂(s)`评论家,从回报中减去它,你就得到了一个预期相似但差异 较低的优势――这就是演员-评论家――A2C 同步运行它;A3C 在线间运行它――两者都是每个现代的深度-RL方法的心理模型――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (TD Learning), Phase 9 · 06 (REINFORCE)
**Time:** ~75 分钟

## 问题

尼拉强力能工作,但它的变化很糟糕.`G_t`间隔间可能发生10倍的波动.`∇ log π`需要数以千计的节目才能推动政策,

根据原始回报的差异,如果减去一个基线`b(s_t)`任何状态的函数,包括学习值,期望保持不变,而变化会下降.`V̂(s_t)`现在乘以`∇ log π`,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,

`A(s, a) = G - V̂(s)`

如果一个行动产生高于平均的回报,它就是好的;如果低于平均,就是差的;;带着学会的批评者 REINFORCE 就是 *演员批评*;;批评给演员一个低差异的老师;;这是2015年之后的每一个深度政策方法;;A2C、A3C、PPO、SAC、IMPALA);;

## 概念

![Actor-critic: policy net plus value net, TD residual as advantage](../assets/actor-critic.svg)

**两个 networks，一个 shared loss：**

- **Actor** `π_θ(a | s)`政策. 样本. 它采取行动.
- **Critic** `V_φ(s)`预期的回报量: 通过最小化`(V_φ(s) - target)²`训练.

**Advantage。**两种标准形式:

- 果公司的优势`A_t = G_t - V_φ(s_t)`,不偏见,变化更高.
- 果的优势`A_t = r_{t+1} + γ V_φ(s_{t+1}) - V_φ(s_t)`△偏见的使用`V_φ`),变量 低得多──也叫 *TD残留* `δ_t`,我知道.

**n-step advantage。**在两者之间插值:

`A_t^{(n)} = r_{t+1} + γ r_{t+2} + … + γ^{n-1} r_{t+n} + γ^n V_φ(s_{t+n}) - V_φ(s_t)`

`n = 1`是纯粹的TD.`n = ∞`是MC──大多数实现在Atari上使用`n = 5`在 MuJoCo的 PPO 上使用`n = 2048`,我知道.

**Generalized Advantage Estimation (GAE)。**施尔曼等人 (2016) 提出对所有 n 步骤的优势做出指数权重平均:

`A_t^{GAE} = Σ_{l=0}^{∞} (γλ)^l δ_{t+l}`

其中`λ ∈ [0, 1]`,我知道.`λ = 0`是 TD(低差异,高偏差) ⋅`λ = 1`是MC(高差异性,无偏见)`λ = 0.95`是2026年默认值:持续调节,直到偏差/变量拨号到达你想要的位置.

**A2C：synchronous advantage actor-critic。**在`N`个平行环境上收集`T`对于每个步骤,计算优势. 在组合中,上更新演员和评论家. 重复.

**A3C：asynchronous advantage actor-critic。**其他研究人员`N`个工人线程,每个线程 运行一个环境――每个工人在自己的推出上本地计算梯度,然后异步应用到共享参数服务器――不需要重复缓冲:工人通过运行不同的轨迹来去解调――A3C 证明你可以在CPU上进行规模培训――到2026年,基于GPU的A2C (批量并行环境) 占主导地位,因为GPU需要大量批量――

**Combined loss。**

`L(θ, φ) = -E[ A_t · log π_θ(a_t | s_t) ]  +  c_v · E[(V_φ(s_t) - G_t)²]  -  c_e · E[H(π_θ(·|s_t))]`

三项:政策渐进性损失,价值回归,缩奖金`c_v ~ 0.5`,我知道.`c_e ~ 0.01`是神圣的起点.


```figure
actor-critic
```

## 建立它

### 步骤1:一个批评者

线性评论家`V_φ(s) = w · features(s)`使用MSE 更新:

```python
def critic_update(w, x, target, lr):
    v_hat = dot(w, x)
    err = target - v_hat
    for j in range(len(w)):
        w[j] += lr * err * x[j]
    return v_hat
```

在图表环境上,评论员会在几百个集内收──在亚太里上,把线性评论员 换为共享的CNN库 +值头──

### 步骤2:n-步骤优势

给定长度为`T`推出和启动的最后`V(s_T)`其他:

```python
def compute_advantages(rewards, values, gamma=0.99, lam=0.95, last_value=0.0):
    advantages = [0.0] * len(rewards)
    gae = 0.0
    for t in reversed(range(len(rewards))):
        next_v = values[t + 1] if t + 1 < len(values) else last_value
        delta = rewards[t] + gamma * next_v - values[t]
        gae = delta + gamma * lam * gae
        advantages[t] = gae
    returns = [a + v for a, v in zip(advantages, values)]
    return advantages, returns
```

`returns`是一个批评目标.`advantages`是乘以`∇ log π`内容:

### 步骤3: 综合更新

```python
for step_i, (x, a, _r, probs) in enumerate(traj):
    adv = advantages[step_i]
    target_v = returns[step_i]

    # critic
    critic_update(w, x, target_v, lr_v)

    # actor
    for i in range(N_ACTIONS):
        grad_logpi = (1.0 if i == a else 0.0) - probs[i]
        for j in range(N_FEAT):
            theta[i][j] += lr_a * adv * grad_logpi * x[j]
```

政策,每次更新,一个推出,演员和评论家使用分开的学习率.

### 步骤4:并行 (A3C与A2C)

- **A3C：**启动`N`个线程──每个线程 运行自己的环境和自己的前进通行──周期性地把渐进更新推送到共享的主人──主人 上不加锁:种族 没关系,它们只是增加噪音──
- **A2C：**在单个过程中运行`N`个环境实例,把观察堆成`[N, obs_dim]`批量执行批量前进通行,批量后退通行.

我们的玩具代码 为了保持清晰度, 改写成批量A2C只需要三行编辑.

## 陷

- **Critic bias before actor gradient。**如果批评是随机的,它的基线就没有信息量,而你是在纯噪音上训练――先加热批评者 几百步,重新打开政策梯度,或者使用较慢的演员学习率――
- **Advantage normalization。**在每批中,优势正常化到零平均/单位-std.
- **Shared trunk。**对于影像输入,为演员和评论家使用共享功能提取器.
- **On-policy contract。**更多次会让渐进偏见的数据进行调整.
- **Entropy collapse。**没有`c_e > 0`时,政策会在几百次更新内变得接近决定性并停止探索.
- **Reward scale。**优势大小取决于奖励规模――将奖励正常化 (例如除以运行-std),以便在不同任务之间保持一致的渐进大小――

## 用它

A2C/A3C 在2026年很少是最终选择,但它们是后续所有架构改进的基础:

| Method | Relation to A2C |
|--------|----------------|
| PPO | A2C + clipped importance ratio for multi-epoch updates |
| IMPALA | A3C + V-trace off-policy correction |
| SAC (Phase 9 · 07) | Off-policy A2C with a soft-value critic (next lesson) |
| GRPO (Phase 9 · 12) | A2C without the critic — group-relative advantage |
| DPO | A2C collapsed into a preference-ranking loss, no sampling |
| AlphaStar / OpenAI Five | A2C with league training + imitation pre-training |

如果在2026年报纸中看到"优势",就想起演员评论家.

## 运送它

保存为`outputs/skill-actor-critic-trainer.md`其他:

```markdown
---
name: actor-critic-trainer
description: 为给定 environment 生成 A2C / A3C / GAE configuration，并指定 advantage estimation 和 loss weights。
version: 1.0.0
phase: 9
lesson: 7
tags: [rl, actor-critic, gae]
---

给定一个 environment 和 compute budget，输出：

1. Parallelism。A2C（GPU batched）vs A3C（CPU async）以及 workers 数量。
2. Rollout length T。每个 env 每次 update 的 steps。
3. Advantage estimator。n-step 或 GAE(λ)；指定 λ。
4. Loss weights。`c_v`（value）、`c_e`（entropy）、gradient clip。
5. Learning rates。Actor 和 critic（如果使用则分开）。

拒绝在 horizon > 1000 的 environments 上使用 single-worker A2C（太 on-policy，太慢）。拒绝在没有 advantage normalization 的情况下交付。把任何 `c_e = 0` 且 observed entropy < 0.1 的 run 标记为 entropy-collapsed。
```

## 运动

1. **Easy。**在4×4格林世界上使用MC优势(`G_t - V(s_t)`) 训练演员-批评者──与课06 中 运行平均基线的反复强化效率对比──
2. **Medium。**切换到 TD残余优势`r + γ V(s') - V(s)`测量优势批次的变化.
3. **Hard。**实现GAE(λ)。扫描`λ ∈ {0, 0.5, 0.9, 0.95, 1.0}`△绘制最终回报与样本效率――这个任务的偏差/变异甜点在哪里?

## 关键词

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Actor | “Policy net” | `π_θ(a\|s)`，由 policy gradient 更新。 |
| Critic | “Value net” | `V_φ(s)`，通过对 returns / TD targets 做 MSE regression 更新。 |
| Advantage | “比平均好多少” | `A(s, a) = Q(s, a) - V(s)` 或它的 estimators。`∇ log π` 的 multiplier。 |
| TD residual | “δ” | `δ_t = r + γ V(s') - V(s)`；one-step advantage estimate。 |
| GAE | “插值旋钮” | n-step advantages 的 exponentially weighted sum，由 `λ` parameterized。 |
| A2C | “Synchronous actor-critic” | 跨 envs batching；每个 rollout 做一次 Gradient step。 |
| A3C | “Async actor-critic” | Worker threads 把 gradients 推送到 shared param server。Original paper；2026 年较少见。 |
| Bootstrap | “在 horizon 使用 V” | 截断 rollout，添加 `γ^n V(s_{t+n})` 来闭合求和。 |

## 进一步阅读

- [Mnih et al. (2016). Asynchronous Methods for Deep Reinforcement Learning](https://arxiv.org/abs/1602.01783)A3C,最初的无同步演员评论论文
- [Schulman et al. (2016). High-Dimensional Continuous Control Using Generalized Advantage Estimation](https://arxiv.org/abs/1506.02438)  
- [Sutton & Barto (2018). Ch. 13 — Actor-Critic Methods](http://incompleteideas.net/book/RLbook2020.pdf)基础;当批评是神经网络时,把它和第9章的函数近似
- [Espeholt et al. (2018). IMPALA](https://arxiv.org/abs/1802.01561)可扩展的分布式演员批评,
- [OpenAI Baselines / Stable-Baselines3](https://stable-baselines3.readthedocs.io/) 值得阅读的生产A2C/PPO实施──
- [Konda & Tsitsiklis (2000). Actor-Critic Algorithms](https://papers.nips.cc/paper/1786-actor-critic-algorithms)两次度的演员-批评分解的基本融合结果――
