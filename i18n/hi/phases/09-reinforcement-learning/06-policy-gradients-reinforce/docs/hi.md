# नीति ग्रेडिएंट  शून्य से REINFORCE को प्राप्त करने

> 停止估值值── सीधे नीति को पैरामीटर करें, अपेक्षित रिटर्न का ग्रेडिएंट गणना करें, फिर ऊपर की ओर बढ़कर दिशा अपडेट करें── विलियम्स (1992) ने एक प्रमेय के साथ इसे स्पष्ट किया।

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 03 (Backpropagation), Phase 9 · 03 (Monte Carlo), Phase 9 · 04 (TD Learning)
**Time:** ~75 分钟

## 问题

Q-learning 和 DQN parameterize 的是 *मूल्य* फ़ंक्शन──你通过 `argmax Q`选择行动―― यह विवश क्रिया 和 विवश अवस्था 没有问题――但是当 क्रिया 是持续时就会失效`argmax`?), या जब आप स्टोकास्टिक नीति चाहते हैं 时也会失效`argmax`按构造就是 निर्धारक) 

नीति ग्रेडिएंट 改为 पैरामीटर *नीति*。`π_θ(a | s)`यह एक तंत्रिका नेटवर्क है, आउटपुट एक्शन ऊपर का वितरण।`θ`                                                                                                                                                                                                                                                              `argmax` कोई बेलमैन पुनरावृत्ति  केवल `J(θ) = E_{π_θ}[G]`ग्रेडिएंट चढ़ाई करना

पुनर्जागरण प्रमेय (विलियम्स 1992)  बताओ यह ग्रेडिएंट है की गणना की जा सकती हैः`∇J(θ) = E_π[ G · ∇_θ log π_θ(a | s) ]`运行一个节目计算回归把每一步的 `∇ log π_θ(a | s)`乘以回归──取平均──做 ग्रेडिएंट-असेंट──完成──

2026 के प्रत्येक LLM-RL एल्गोरिथ्म:PPO、DPO、GRPO, सभी REINFORCE के परिष्करण हैं।

## 概念

![Policy gradient: softmax policy, log-π gradient, return-weighted update](../assets/policy-gradient.svg)

**Policy gradient theorem。**किसी भी प्रकार के लिए`θ`पैरामीटर की नीति `π_θ`:

`∇J(θ) = E_{τ ~ π_θ}[ Σ_{t=0}^{T} G_t · ∇_θ log π_θ(a_t | s_t) ]`

उनमें से `G_t = Σ_{k=t}^{T} γ^{k-t} r_{k+1}`            `t`开始的折扣回报──预期是从 `π_θ`नमूना की पूर्ण प्रक्षेपवक्र `τ`ऊपर प्राप्त किया गया है

**证明很短。**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `J(θ) = Σ_τ P(τ; θ) G(τ)`求导──使用 `∇P(τ; θ) = P(τ; θ) ∇ log P(τ; θ)`(लॉग-उत्पादक चाल) ◊分解 `log P(τ; θ) = Σ log π_θ(a_t | s_t) + environment terms that do not depend on θ` पर्यावरण शब्द  गायब  दो行代数  प्राप्त करने का सिद्धांत 

**Variance reduction 技巧。**वनिला REINFORCE का भिन्नता 非常高: रिटर्न है शोरदार,`∇ log π`यह शोर है, इनकी संख्या बहुत शोर है।

1. **Baseline subtraction。**किसी भी इच्छा पर निर्भर नहीं`a_t``b(s_t)`, `G_t`替换成 `G_t - b(s_t)` यह निष्पक्ष है, क्योंकि `E[b(s_t) · ∇ log π(a_t | s_t)] = 0`典型选择:由评论学到的 `b(s_t) = V̂(s_t)`→ अभिनेता-आलोचक (Lection 07)
2. **Reward-to-go。**`Σ_t G_t · ∇ log π_θ(a_t | s_t)`替换成 `Σ_t G_t^{from t} · ∇ log π_θ(a_t | s_t)` किसी दिए गए कार्य के लिए, केवल भविष्य में रिटर्न  संबंधित, अतीत के पुरस्कार केवल शून्य-मध्यम शोर में योगदान देंगे

组合起来 प्राप्त करेंः

`∇J ≈ (1/N) Σ_{i=1}^{N} Σ_{t=0}^{T_i} [ G_t^{(i)} - V̂(s_t^{(i)}) ] · ∇_θ log π_θ(a_t^{(i)} | s_t^{(i)})`

यही आधार रेखा के साथ पुनर्बल है, जो ए2सी के प्रत्यक्ष पूर्वज भी हैं।

**Softmax policy parameterization。**अलग-अलग कार्यों के लिए, मानक चयन हैः

`π_θ(a | s) = exp(f_θ(s, a)) / Σ_{a'} exp(f_θ(s, a'))`

उनमें से `f_θ`किसी भी क्रिया के लिए एक स्कोर आउटपुट की तंत्रिका नेटवर्क है।

`∇_θ log π_θ(a | s) = ∇_θ f_θ(s, a) - Σ_{a'} π_θ(a' | s) ∇_θ f_θ(s, a')`

यानि, कार्रवाई के लिए किए गए स्कोर को नीतिगत मूल्य से नीचे घटाकर।

**用于 continuous actions 的 Gaussian policy。** `π_θ(a | s) = N(μ_θ(s), σ_θ(s))``∇ log N(a; μ, σ)`यह सब सीएसी के चरण 9 · 07 की आवश्यकताओं का है।


```figure
policy-gradient-landscape
```

## इसे बनाओ

### चरण 1: softmax नीति नेटवर्क

```python
def policy_logits(theta, state_features):
    return [dot(theta[a], state_features) for a in range(N_ACTIONS)]

def softmax(logits):
    m = max(logits)
    exps = [exp(l - m) for l in logits]
    Z = sum(exps)
    return [e / Z for e in exps]
```

तालिकात्मक वातावरण के लिए रैखिक नीति का उपयोग करें (प्रत्येक क्रिया एक भार वेक्टर)

### चरण 2: नमूनाकरण और लॉग-प्रभाव्यता

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

### चरण 3: लॉग-प्रोब्स कैप्चर के साथ रोलआउट

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

### चरण 4: REINFORCE अद्यतन

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

ग्रेडिएंट `∇ log π(a|s) = e_a - π(·|s)`(`a`                                                                                                                                                                                                                                                              

### चरण 5: आधार रेखाएँ

हाल के समय के एपिसोड के लिए `G`取 running mean,已经足够把4×4 GridWorld 跑起来; लगभग 500 एपिसोड 收──把基线 升级为学习 `V̂(s)`, हम अभिनेता-आलोचक प्राप्त किया गया है.

## फंदे

- **Exploding gradients。**रिटर्न हो सकता है बहुत बड़ा.`∇ log π`之前,始终在批发内把 `G`सामान्य करने के लिए`~N(0, 1)`
- **Entropy collapse。**नीति 过早收到近似决定性的行动,停止探索,然后卡住──修复方式:向目标 添加 Entropy बोनस `β · H(π(·|s))`
- **High variance。**वैनिला रिइंफोर्स 需要成千上万 एपिसोड──批判的基线──Lesson 07) 或 TRPO/PPO का विश्वास क्षेत्र──Lesson 08)
- **Sample inefficiency。**नीतिगत अर्थ प्रत्येक परिवर्तन में एक बार अपडेट होने के बाद ही त्याग दिया जाएगा।
- **Non-stationary gradients。**100 एपिसोड  पूर्व के एक ही ग्रेडिएंट उपयोग पुराने है `π` यही नीतिगत पद्धति है  प्रत्येक अलग-अलग रोलआउट के अपडेट के कारण 
- **Credit assignment。**没有奖励-to-go 时,过去奖励 会贡献噪声──始终使用奖励-to-go──

## इसका प्रयोग करें

2026 साल, REINFORCE  बहुत कम सीधे संचालित किया जाता है, लेकिन इसके ग्रेडिएंट 公式 मौजूद नहीं हैः

| Use case | Derived method |
|----------|---------------|
| Continuous control | PPO / SAC with Gaussian policy |
| LLM RLHF | PPO with KL penalty, running on token-level policy |
| LLM reasoning (DeepSeek) | GRPO — REINFORCE with group-relative baseline, no critic |
| Multi-agent | Centralized-critic REINFORCE (MADDPG, COMA) |
| Discrete action robotics | A2C, A3C, PPO |
| Preference-only settings | DPO — REINFORCE rewritten as a preference-likelihood loss, no sampling |

जब आप 2026 के प्रशिक्षण स्क्रिप्ट में देखेंगे `loss = -advantage * log_prob`,那就是带基线的 REINFORCE──整篇论文(DPO、GRPO、RLOO) सभी इस पंक्ति पर आधारित भिन्नता-बदलीकरण तकनीक हैं──

## इसे भेजें

保存为 `outputs/skill-policy-gradient-trainer.md`:

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

## व्यायाम

1. **Easy。**4×4 ग्रिडवर्ल्ड 上उपयोग रैखिक सॉफ्टमैक्स नीति 实现 REINFORCE──不使用基线,训练 1,000 个节目──绘制学习曲线;测量变异的回报的 std)──
2. **Medium。**⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒     ⇒            ⇒                                                                                                                                                                     
3. **Hard。**添加 एंट्रॉपी बोनस `β · H(π)`扫描 `β ∈ {0, 0.01, 0.1, 1.0}`◊ अंतिम रिटर्न और नीति entropy को चित्रित करना। इस कार्य के शीर्ष के मीठे स्थान कहाँ है?

## प्रमुख शर्तें

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

## आगे पढ़ना

- [Williams (1992). Simple Statistical Gradient-Following Algorithms for Connectionist Reinforcement Learning](https://link.springer.com/article/10.1007/BF00992696) मूल रिइन्फोर्स पेपर
- [Sutton et al. (2000). Policy Gradient Methods for Reinforcement Learning with Function Approximation](https://papers.nips.cc/paper_files/paper/1999/hash/464d828b85b0bed98e80ade0a5c43b0f-Abstract.html) 带 फ़ंक्शन अनुमान का आधुनिक नीति-ग्रिडिएंट प्रमेय。
- [Sutton & Barto (2018). Ch. 13 — Policy Gradient Methods](http://incompleteideas.net/book/RLbook2020.pdf) पाठ्यपुस्तक प्रस्तुति──
- [OpenAI Spinning Up — VPG / REINFORCE](https://spinningup.openai.com/en/latest/algorithms/vpg.html) 清晰的教学式讲解,包含 PyTorch कोड──
- [Peters & Schaal (2008). Reinforcement Learning of Motor Skills with Policy Gradients](https://homes.cs.washington.edu/~todorov/courses/amath579/reading/PolicyGradient.pdf) भिन्नता-संशोधन, तथा  REINFORCE connecting to trust-region family (TRPO, PPO) के प्राकृतिक-ग्रिडिएंट 视角──
