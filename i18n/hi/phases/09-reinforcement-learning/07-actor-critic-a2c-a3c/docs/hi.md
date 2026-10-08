# अभिनेता-आलोचक  ए 2 सी और ए 3 सी

> बल बल  जोरदार 🔥添加一个学习 `V̂(s)`आलोचक, रिटर्न से मध्य में घटाकर इसे, आपको एक अपेक्षा मिलती है समान लेकिन भिन्नता ढ़ेर कम लाभ  यह है अभिनेता-आलोचक  ए2सी 同步运行它; ए3सी 在线程间运行它── ये दोनों ही प्रत्येक आधुनिक गहरे आरएल पद्धति के मानसिक मॉडल 

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (TD Learning), Phase 9 · 06 (REINFORCE)
**Time:** ~75 分钟

## 问题

वनिला REINFORCE 能工作, लेकिन इसकी विविधता 很糟──蒙特卡洛 लौटता है `G_t`विभिन्न एपिसोडों के बीच 10 गुना अधिक मात्रा में उतार-चढ़ाव हो सकता है।`∇ log π`एक बार फिर से औसत पर, एक ग्रेडिएंट अनुमानक उत्पन्न होगा, जो कि दूरी तक पहुंचने के लिए बहुत कम डीक्यूएन अपडेट के साथ नीति को आगे बढ़ाने के लिए हजारों एपिसोड की आवश्यकता होगी।

कच्चे रिटर्न का उपयोग करके भिन्नता  यदि आप एक मूल रेखा को घटाते हैं `b(s_t)`: किसी भी स्थिति का कार्य, जिसमें सीखा गया मूल्य, अपेक्षा 保持不变, जबकि भिन्नता 会下降── सबसे अच्छा व्यवहार्य आधार रेखा है `V̂(s_t)`                                                                                                                                                                                                                                                              `∇ log π`️ मात्रा = ️ लाभ

`A(s, a) = G - V̂(s)`

यदि किसी क्रिया ने औसत से अधिक रिटर्न प्राप्त किया है, तो यह अच्छा है; यदि औसत से कम है, तो यह भिन्न है।

## 概念

![Actor-critic: policy net plus value net, TD residual as advantage](../assets/actor-critic.svg)

**两个 networks，一个 shared loss：**

- **Actor** `π_θ(a | s)`नीति  नमूना यह कार्रवाई करने के लिए  नीति ग्रेडिएंट  प्रशिक्षण 
- **Critic** `V_φ(s)`: राज्य से उत्पन्न होने की अपेक्षित वापसी का अनुमान `(V_φ(s) - target)²`प्रशिक्षण

**Advantage。**两种标准形式:

- *MC लाभ*`A_t = G_t - V_φ(s_t)` निष्पक्ष, विविधता 
- *टीडी लाभ*`A_t = r_{t+1} + γ V_φ(s_{t+1}) - V_φ(s_t)`△ पूर्वाग्रहयुक्त`V_φ`),वैरिएंस 低得多──也叫 *TD अवशिष्ट* `δ_t`

**n-step advantage。**इन दोनों के बीच में अंतरः

`A_t^{(n)} = r_{t+1} + γ r_{t+2} + … + γ^{n-1} r_{t+n} + γ^n V_φ(s_{t+n}) - V_φ(s_t)`

`n = 1`यह शुद्ध टीडी है।`n = ∞`हाँ MC── अधिकांश कार्यान्वयन `n = 5`, MuJoCo के पीपीओ ऊपर उपयोग `n = 2048`

**Generalized Advantage Estimation (GAE)。**Schulman et al. (2016)  सभी n-चरण लाभों के लिए प्रस्तावित करें

`A_t^{GAE} = Σ_{l=0}^{∞} (γλ)^l δ_{t+l}`

उनमें से `λ ∈ [0, 1]``λ = 0`                                                                                                                                                                                                                                                              `λ = 1` MC उच्च भिन्नता, निष्पक्ष) `λ = 0.95`है 2026 साल की डिफ़ॉल्ट मानः निरंतर विन्यास, जब तक आप चाहते हैं स्थान तक पहुँचने के लिए पूर्वाग्रह / भिन्नता डायल

**A2C：synchronous advantage actor-critic。**`N`个 समानांतर वातावरण 上收集 `T`कदमों हेतु प्रत्येक कदम  गणना लाभों हेतु  संयोजन बैच में 上更新 अभिनेता 和 आलोचक हेतु 重复── यह A3C 更简单、更可扩展的兄弟姐妹 हेतु 

**A3C：asynchronous advantage actor-critic。**Mnih et al. (2016)。启动 `N`个 worker threads, प्रत्येक thread 运行一个 env── प्रत्येक worker 在自己的推广上本地计算梯度,然后异步 应用到共享参数服务器──不需要重复缓冲:workers 通过运行不同轨迹来去分类──A3C 证明你能在CPU上规模培训──到2026年,GPU आधारित A2C(batched parallel envs)占主导,因为GPUs 需要大批量──

**Combined loss。**

`L(θ, φ) = -E[ A_t · log π_θ(a_t | s_t) ]  +  c_v · E[(V_φ(s_t) - G_t)²]  -  c_e · E[H(π_θ(·|s_t))]`

तीनःनीति-ग्रिडिएंट हानि, मूल्य प्रतिगमन, एंट्रोपी बोनस`c_v ~ 0.5``c_e ~ 0.01`यह एक कैनोनिक प्रारंभिक बिंदु है।


```figure
actor-critic
```

## इसे बनाओ

### चरण 1: आलोचक

रैखिक आलोचक `V_φ(s) = w · features(s)`MSE 更新:

```python
def critic_update(w, x, target, lr):
    v_hat = dot(w, x)
    err = target - v_hat
    for j in range(len(w)):
        w[j] += lr * err * x[j]
    return v_hat
```

तालिकात्मक वातावरण में, आलोचक बैठक में कुछ सौ एपिसोड में शामिल हुए.

### चरण 2: n-चरण लाभ

给定长度为 `T`के रोलआउट और बूटस्ट्रैप फाइनल `V(s_T)`:

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

`returns`यह महत्वपूर्ण लक्ष्य है।`advantages`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `∇ log π`की सामग्री

### चरण 3: संयुक्त अद्यतन

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

नीति पर, प्रत्येक अद्यतन एक रोलआउट, अभिनेता तथा आलोचक उपयोग करना

### चरण 4: समानांतर (A3C बनाम A2C)

- **A3C：** प्रारंभ `N`个线程── प्रत्येक线程 运行自己的环境和自己的前进通行──周期性地把 推送到共享的主人──主人 上不加锁:
- **A2C：**एकल प्रक्रिया में कामयाब`N`个 env उदाहरण,把 अवलोकन ढेर 成 `[N, obs_dim]`बैच, निष्पादन बैच फॉरवर्ड पास, बैच बैकवर्ड पास, GPU उपयोग, अधिक उच्च, निर्धारात्मक, अधिक आसान推理,

हमारे खिलौना कोड को स्पष्टता के लिए एक थ्रेड में बनाए रखने के लिए; बैच ए 2 सी में बदलना केवल तीन पंक्तियों की आवश्यकता है

## फंदे

- **Critic bias before actor gradient。**यदि आलोचक आकस्मिक है, तो इसकी मूल रेखा में जानकारी की मात्रा नहीं है, जबकि आप शुद्ध शोर पर प्रशिक्षण कर रहे हैं।
- **Advantage normalization。**प्रत्येक बैच में इन-आउट लाभ सामान्यीकरण से शून्य-औसत/इकाई-स्टडी तक लगभग शून्य लागत, लेकिन काफी स्थिर प्रशिक्षण कर सकता है।
- **Shared trunk。**छवि इनपुट के लिए, अभिनेता व आलोचक के लिए साझा सुविधा निष्कर्षक का उपयोग करें।
- **On-policy contract。**A2C डेटा के लिए सटीकता पुनः एक बार अपडेट करना है।
- **Entropy collapse。** नहीं `c_e > 0`时,政策会在几百次更新内变近似决定性并停止探索
- **Reward scale。**लाभ परिमाण पुरस्कार पैमाने पर निर्भर करते हैं। उदाहरण के लिए, विभिन्न कार्यों के बीच एक समान ग्रेडिएंट परिमाणों को बनाए रखने के लिए पुरस्कारों को सामान्य बनाना।

## इसका प्रयोग करें

A2C/A3C 2026 में बहुत कम अंतिम विकल्प हैं, लेकिन वे सभी बाद के वास्तुकला परिष्करणों का आधार हैंः

| Method | Relation to A2C |
|--------|----------------|
| PPO | A2C + clipped importance ratio for multi-epoch updates |
| IMPALA | A3C + V-trace off-policy correction |
| SAC (Phase 9 · 07) | Off-policy A2C with a soft-value critic (next lesson) |
| GRPO (Phase 9 · 12) | A2C without the critic — group-relative advantage |
| DPO | A2C collapsed into a preference-ranking loss, no sampling |
| AlphaStar / OpenAI Five | A2C with league training + imitation pre-training |

यदि आप 2026 के पेपर में अवधि  देखते हैं, तो अभिनेता-आलोचक  के बारे में सोचें।

## इसे भेजें

保存为 `outputs/skill-actor-critic-trainer.md`:

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

## व्यायाम

1. **Easy。**में 4×4 ग्रिडवर्ल्ड ऊपर MC लाभ का उपयोग करना`G_t - V(s_t)`) प्रशिक्षण अभिनेता-आलोचक── से पाठ 06 中 REINFORCE-with-running-mean-baseline के लिए नमूना दक्षता के लिए तुलना──
2. **Medium。**切换到 TD-अवशिष्ट लाभ`r + γ V(s') - V(s)`)― माप लाभ बैचों के भिन्नता― यह कितना नीचे चला गया है?
3. **Hard。**                                                                                                                                                                                                                                                              `λ ∈ {0, 0.5, 0.9, 0.95, 1.0}`◊ अंतिम रिटर्न बनाम नमूना दक्षता का चित्रण करना ◊ इस कार्य का पूर्वाग्रह/वियरेंस स्वीट स्पॉट 在哪里?

## प्रमुख शर्तें

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

## आगे पढ़ना

- [Mnih et al. (2016). Asynchronous Methods for Deep Reinforcement Learning](https://arxiv.org/abs/1602.01783) A3C, मूल असिनक्रॉन अभिनेता-आलोचक पेपर
- [Schulman et al. (2016). High-Dimensional Continuous Control Using Generalized Advantage Estimation](https://arxiv.org/abs/1506.02438) GAE。
- [Sutton & Barto (2018). Ch. 13 — Actor-Critic Methods](http://incompleteideas.net/book/RLbook2020.pdf) नींव; जब आलोचक है तंत्रिका नेटवर्क 时,把它和 Ch. 9 के कार्य अनुमान 配套阅读。
- [Espeholt et al. (2018). IMPALA](https://arxiv.org/abs/1802.01561) V-ट्रेस नीति से बाहर सुधार के साथ स्केलेबल वितरित अभिनेता-आलोचक
- [OpenAI Baselines / Stable-Baselines3](https://stable-baselines3.readthedocs.io/)  वाचनीय उत्पादन ए2सी/पीपीओ कार्यान्वयन──
- [Konda & Tsitsiklis (2000). Actor-Critic Algorithms](https://papers.nips.cc/paper/1786-actor-critic-algorithms) दो-गुणाकार अभिनेता-आलोचक विघटन का मौलिक अभिसरण परिणाम―
