# मोन्टे कार्लो विधियाँ  पूर्ण एपिसोड से सीखें

> गतिशील प्रोग्रामिंग 需要模型──蒙特卡洛除了 एपिसोड 什么都不需要──运行政策,观察回报,取平均── यह आरएल में सबसे सरल विचार है, यह भी सभी के विचार का解锁后续──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs), Phase 9 · 02 (Dynamic Programming)
**Time:** ~75 minutes

## 问题

गतिशील प्रोग्रामिंग  बहुत ही सुरुचिपूर्ण है, लेकिन यह मानता है कि आप प्रत्येक राज्य और कार्रवाई के लिए पूछताछ कर सकते हैं `P(s' | s, a)`◊ वास्तविक दुनिया में लगभग कुछ भी इस तरह काम नहीं करता है ◊ रोबोट ∞ हल नहीं कर सकता ∞ संयुक्त टोक़ ∞ कैमरा पिक्सेल का वितरण ∞ मूल्य निर्धारण एल्गोरिथ्म ∞ हर संभावित ग्राहक प्रतिक्रिया ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞

आपको पर्यावरण से *नमूना* के तरीके पर निर्भर करने की आवश्यकता है।`s_0, a_0, r_1, s_1, a_1, r_2, …, s_T` इसका उपयोग मूल्य निर्धारण  यह Monte Carlo है

डीपी से एमसी के परिवर्तन में विचार से महत्वपूर्णः हम *ज्ञात मॉडल + सटीक बैकअप* से *पॉइंट्स पर नमूना लगाना + औसत रिटर्न* में बदलते हैं।

## 概念

![Monte Carlo: rollout, compute returns, average; first-visit vs every-visit](../assets/monte-carlo.svg)

**核心思想，一行表达：** `V^π(s) = E_π[G_t | s_t = s] ≈ (1/N) Σ_i G^{(i)}(s)`, उनमें से `G^{(i)}(s)`नीति में है`π`下访问 `s`之后观察到的回报──

**First-visit vs every-visit MC。**给定一个多次访问状态 `s`️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

**Incremental mean。**नहीं भंडारण सभी रिटर्न, बल्कि अद्यतन चल औसतः

`V_n(s) = V_{n-1}(s) + (1/n) [G_n - V_{n-1}(s)]`

重新整理:`V_new = V_old + α · (target - V_old)`, उनमें से `α = 1/n`把 `1/n`换成常态 step-size `α ∈ (0, 1)`, आप एक गैर-स्थिर एमसी अनुमानक मिलता है, यह ट्रैक करेगा ।`π`यह क्रिया प्रत्येक आधुनिक आरएल एल्गोरिथ्म की सभी कुंजी से एमसी से टीडी तक कूदकर फिर से कूदने की है।

**Exploration 现在成了问题。**डीपी द्वारा प्रत्येक राज्य को संबोधित किया गया है।`π`यह निर्धारक है, राज्य स्थान में पूरे क्षेत्र को कभी भी नमूना नहीं लिया जाएगा, उनके मूल्य अनुमानों को हमेशा शून्य में रुकना होगा।

1. **Exploring starts。**随机 (s, a) जोड़ी 开始每个节目──保证 覆盖;实践中不现实(你不能把机器人 重置到任意状态)──
2. **ε-greedy。**तुलना करें वर्तमान Q  लाचार कार्रवाई, लेकिन संभावना `ε`选择随机action── सभी राज्य-क्रिया जोड़े 逐渐近地 नमूना लिया गया──
3. **Off-policy MC。**व्यवहार नीति में `μ`निम्न डेटा संग्रह, महत्व के नमूने के माध्यम से लक्ष्य नीति सीखें `π`तरह उच्च है, लेकिन यह DQN आदि रिप्ले-बफर तरीकों की एक पुल है

**Monte Carlo Control。**मूल्यांकन → सुधार → मूल्यांकन, जैसे नीति पुनरावृत्ति, लेकिन मूल्यांकन नमूना आधारित हैः

1. 运行 `π`, एक एपिसोड प्राप्त करें.
2. 根据观察到的回报 更新 `Q(s, a)`
3. 让 `π`तुलना `Q`变成 ε-गामी──
4. पुनः पुनः

तापमान और परिस्थितियों में प्रत्येक जोड़ी असीमित बार दौरा किया गया,`α`满足罗宾斯-मोंरो), होगा के रूप में संभावना 1 收到 `Q*`和 `π*`

## 动手构建

### चरण 1: रोलआउट → (s, a, r) 列表

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

没有模型,只有 `env.reset()`和 `env.step(s, a)` इंटरफेस जिम के वातावरण के समान है, लेकिन बहुत ही सरल है

### चरण 2: 计算 लौटाता है(反向扫)

```python
def returns_from(trajectory, gamma):
    returns = []
    G = 0.0
    for _, _, r in reversed(trajectory):
        G = r + gamma * G
        returns.append(G)
    return list(reversed(returns))
```

एक बार पास,`O(T)`                                                                                                                                                                                                                                                              `G_t = r_{t+1} + γ G_{t+1}`避免了重复求和──

### चरण 3: पहली यात्रा के लिए एमसी मूल्यांकन

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

真正工作的就是三行: पहली बार दौरा करते समय अंकित स्थिति 为见,增加计数,更新运行平均――

### चरण 4: ई-लाभिचारी एमसी नियंत्रण (नीति पर)

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

### चरण 5: डीपी के साथ तुलना

जब एपिसोड → ∞ 时,你对 `V^π`एमसी का अनुमान 应该与02 पाठ में DP परिणाम 致──实践中: 4×4 GridWorld 上运行50,000 एपिसोड, DP 答案相差约 `~0.1`के दायरे में

## 常见陷

- **Infinite episodes。**MC                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `max_steps`अपग्रेड,并把达到上限视作隐式失败──带随机政策的格里德世界 经常时时,这是正常的,只要确保你正确计数──
- **Variance。**MC उपयोग पूर्ण रिटर्न. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .`V(s_0)`TD विधि पाठ 04) बूटस्ट्रेपिंग 降低这一点
- **State coverage。**                                                                                                                                                                                                                                                              
- **Non-stationary policies。**यदि `π`发生变化(如 MC नियंत्रण 中那样), पुराने रिटर्न विभिन्न नीतियों से आते हैं── konstante-α MC इस बिंदु को संभाल सकता है; नमूना-औसत MC 不行──
- **Off-policy importance sampling。**权重 `π(a|s)/μ(a|s)`连乘──Variance 会随地平线 爆炸──用 प्रति निर्णय भारित IS 截断,或切换到 TD──


```figure
epsilon-greedy
```

## इसका उपयोग करें

मोन्टे कार्लो विधियाँ में 2026 साल के भूमिकाः

| Use case | Why MC |
|----------|--------|
| Short-horizon games（blackjack、poker） | Episodes 自然 terminate；returns 清晰。 |
| Logged policy 的 offline evaluation | 对 stored trajectories 的 discounted returns 求平均。 |
| Monte Carlo Tree Search（AlphaZero） | 从 tree leaves 发起的 MC rollouts 指导 selection。 |
| LLM RL evaluation | 为给定 policy 计算 sampled completions 的 average reward。 |
| PPO 中的 baseline estimation | Advantage target `A_t = G_t - V(s_t)` 使用 MC `G_t`。 |
| RL 教学 | 最简单且真正有效的 algorithm；去掉 bootstrapping 就能看到核心。 |

现代 गहरे आरएल एल्गोरिदम ((PPO、SAC) पारित होगा `n`-step returns या GAE, in pure MC(full returns) और pure TD(one-step bootstrap) के बीच插值──दो अंत बिंदु एक ही प्रकार के अनुमानक के उदाहरण हैं──

## 交付 यह

保存为 `outputs/skill-mc-evaluator.md`:

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

## अभ्यास

1. **Easy.**实现 4×4 GridWorld 上 वर्दी-संदिग्ध नीति की पहली यात्रा MC मूल्यांकन──运行 10,000 एपिसोड──将 `V(0,0)`剧情数 变化的曲线与 DP 答案对照绘制
2. **Medium.**उपयोग `ε ∈ {0.01, 0.1, 0.3}`实现 ε-Greedy MC नियंत्रण──比较20,000 एपिसोड 后的平均回报──曲线看起来是什么样?偏差差异交易体现在哪里?
3. **Hard.**उपयोग महत्व नमूनाकरण 实现 *off-policy* MC:在均随机政策 `μ`निम्न डेटा संग्रह, अनुमानित निर्धारणात्मक अनुकूलन नीति `π``V^π`◊ तुलना सादा IS ̊ प्रति निर्णय IS 和 भारित IS ̊ कौन सा भिन्नता न्यूनतम है?

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
- [Singh & Sutton (1996). Reinforcement Learning with Replacing Eligibility Traces](https://link.springer.com/article/10.1007/BF00114726) पहली यात्रा बनाम हर यात्रा विश्लेषण
- [Precup, Sutton, Singh (2000). Eligibility Traces for Off-Policy Policy Evaluation](http://incompleteideas.net/papers/PSS-00.pdf) नीतिगत MC 和 भिन्नता नियंत्रण
- [Mahmood et al. (2014). Weighted Importance Sampling for Off-Policy Learning](https://arxiv.org/abs/1404.6362) 现代 कम-वियरिएंसी आईएस अनुमानक。
- [Tesauro (1995). TD-Gammon, A Self-Teaching Backgammon Program](https://dl.acm.org/doi/10.1145/203330.203343) MC/TD स्व-खेल 收到超人玩的首个大规模实证展示; यह भी इस चरण के 后半部分每节课的概念先驱──
