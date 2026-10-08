# समय का अंतर  Q-Learning और SARSA

> मोन्टे कार्लो 会一直等待到集 结束──TD 通过bootstrap 下一个价值估计,在每一步后更新──Q-learning is off-policy 且偏乐观;SARSA is on-policy 且偏谨慎──两者都只是一行代码──两者也支着本阶段中每种深度RL 方法──

**Type:** Build
**Languages:** Python
**前置要求:**चरण 9 · 01 (एमडीपी), चरण 9 · 02 (गतिशील प्रोग्रामिंग), चरण 9 · 03 (मोंटे कार्लो)
**Time:** ~75 minutes

## 问题

मोन्टे कार्लो संभव है, लेकिन इसकी दो उच्च लागत वाली आवश्यकताएं हैं। इसके लिए एपिसोड समाप्त होने की आवश्यकता होती है, और केवल अंतिम वापसी के बाद ही अपडेट किया जा सकता है। यदि आपके एपिसोड में 1,000 चरण हैं, तो एमसी को 1,000 चरणों का इंतजार करना होगा ताकि कुछ भी अपडेट किया जा सके।

गतिशील प्रोग्रामिंग 则相反:零方差的 बूटस्ट्रैप बैकअप, लेकिन ज्ञात मॉडल की आवश्यकता है──

समय अंतर (टीडी) सीखने में 折中了两者──根据单个过渡 `(s, a, r, s')`, एक कदम लक्ष्य का निर्माण `r + γ V(s')`,并把 `V(s)`朝它推近──不需要模型──不需要完整的剧集──由于在RHS上使用近似的`V`यह अंतर को बढ़ाएगा, लेकिन अंतर एमसी से बहुत कम होगा, और पहले चरण से ही ऑनलाइन अपडेट किया जा सकता है।

यह सभी आधुनिक आरएल ((डीक्यूएन、ए2सी、पीपीओ、एसएसी) पर निर्भरता के आधार पर है।

## 概念

![Q-learning vs SARSA: off-policy max vs on-policy Q(s', a')](../assets/td.svg)

**用于 V 的 TD(0) update：**

`V(s) ← V(s) + α [r + γ V(s') - V(s)]`

方括号中量是 TD त्रुटि `δ = r + γ V(s') - V(s)` यह एमसी में है `G_t - V(s_t)`                                                                                                                                                                                                                                                              `α`满足 रॉबिन्स-मोंरो`Σ α = ∞`,`Σ α² < ∞`), तथा सभी राज्यों को अनियंत्रित बार-बार दौरा किया जाता है।

**Q-learning。**नियंत्रण के लिए उपयोग की जाने वाली गैर-नीतिगत टीडी  पद्धतिः

`Q(s, a) ← Q(s, a) + α [r + γ max_{a'} Q(s', a') - Q(s, a)]`

`max`假设从 `s'`开始会遵循 *贪*政策,不管代理 实际采取了什么行动――这种解让Q-learning在代理 通过 ε-贪 探索时仍学习 `Q*`Mnih et al. (2015) इसे Atari 上 के गहरे Q-learning में बदल देगा

**SARSA。**एक प्रकार की नीतिगत टीडी विधिः

`Q(s, a) ← Q(s, a) + α [r + γ Q(s', a') - Q(s, a)]`

यह नाम टपल से आता है`(s, a, r, s', a')`◊SARSA प्रयोग एजेंट ∙ अगला कदम* वास्तविक* कार्रवाई `a'`और लोभी नहीं`argmax` यह प्राप्त होगा  वर्तमान में चलाने के लिए किसी भी ε- लोभी `π`प्रतिरोध`Q^π`; 极限 में`ε → 0`नीचे बदल जाएगा`Q*`

**cliff-walking 的差异。**क्लासिकल चट्टान पर चलने के 任务 में                                                                                                                                                                                                                                                         `ε → 0` जब दोनों ही सर्वोत्तम प्राप्त करेंगे  अभ्यास में यह महत्वपूर्ण हैः जब तैनाती की जाती है तो वास्तव में भी खोज की जा रही है, SARSA का व्यवहार अधिक संरक्षित होगा

**Expected SARSA。**उपयोग `π`निम्न अपेक्षित मूल्य प्रतिस्थापन `Q(s', a')`:

`Q(s, a) ← Q(s, a) + α [r + γ Σ_{a'} π(a'|s') Q(s', a') - Q(s, a)]`

方差低于SARSA(不对 `a'`采样), लक्ष्य भी नीति पर है। आधुनिक शिक्षा सामग्री में इसे आम तौर पर एक आदर्श विकल्प के रूप में माना जाता है।

**n-step TD 和 TD(λ)。**通过等待 `n`步再bootstrap,在 TD(0) और MC 之间插值──`n=1`TD,`n=∞`है MC---TD(λ) उपयोग几何权重 `(1-λ)λ^{n-1}`सभी के लिए`n`求平均── अधिकांश गहरे आरएल उपयोग 3 से 20 के बीच `n`


```figure
qlearning-gridworld
```

##  इसे निर्माण

### 步骤 1: 基于 ε-贪政策的 SARSA

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

八行── Q-Learning के साथ एकमात्र अंतर लक्ष्य है 那一行──

### 步骤 2: Q-लर्निंग

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

`max`️ लक्ष्य और व्यवहार ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ 

### 步骤 3: सीखने के वक्र

अनुगमन प्रत्येक 100 एपिसोड का औसत वापसी──Q-learning में सरल निश्चितता ग्रिडवर्ल्ड 上收更快;SARSA में चट्टानों पर चलने में 上更保守── में `code/main.py`का 4×4 ग्रिडवर्ल्ड 中,两者在 `α=0.1, ε=0.1`नीचे, लगभग 2,000 एपिसोड  बाद में सब कुछ सबसे अच्छा के करीब 

### 步骤 4: डीपी के साथ वास्तविक मूल्य की तुलना करें

运行 मूल्य पुनरावृत्ति(पढ़ें 02) प्राप्त `Q*` जाँच `max_{s,a} |Q_learned(s,a) - Q*(s,a)|`एक स्वस्थ तालिकाबद्ध टीडी एजेंट 4×4 ग्रिडवर्ल्ड में प्रशिक्षण 10,000 एपिसोड  के बाद, आप पर गिरना चाहिए `~0.5`में

## 陷

- **初始 Q values 很重要。**乐观初始化 负 報酬 任务中 `Q = 0`) शोषण को प्रोत्साहित करेगा―悲观初始化可能永远困住贪政策──
- **α schedule。**常数 `α`असमानता के मुद्दे पर यह संभव है।`α_n = 1/n`सिद्धांत रूप में प्राप्त कर सकते हैं, लेकिन अभ्यास में बहुत धीमा;`α`固定在 `[0.05, 0.3]`,并 निगरानी सीखने वक्र。
- **ε schedule。**से高值开始`ε=1.0`), घटकर `ε=0.05`"GLIE"असीम अन्वेषण के साथ सीमा में लालची)
- **Q-learning 中的 max bias。**`Q`जब कोई शोर होता है,`max` उपरोक्त में  उपरोक्त में  भिन्नताएँ हैं।  उच्चतम अनुमानों का कारण बनेंगी।
- **非终止 episodes。**TD बिना टर्मिनल के स्थिति में सीख सकते हैं, लेकिन आपको चरण संख्या को सीमित करने की आवश्यकता है, या ऊपरी सीमा में सही ढंग से बूटस्ट्रैप को संसाधित करने की आवश्यकता है।
- **State hashing。**यदि राज्यों में टूपल्स/टेंसर हैं, तो उपयोग可哈ッシュ की कुंजी है।

## इसका उपयोग करें

2026 के TD परिदृश्यः

| Task | Method | Reason |
|------|--------|--------|
| 小型 tabular environments | Q-learning | 直接学习 optimal policy。 |
| On-policy safety-critical | SARSA / Expected SARSA | 探索期间更保守。 |
| High-dimensional state | DQN (Phase 9 · 05) | 带 replay 和 target net 的 Neural Network Q-function。 |
| Continuous actions | SAC / TD3 (Phase 9 · 07) | 在 Q-network 上做 TD update；policy net 发出 actions。 |
| LLM RL (reward-model-based) | PPO / GRPO (Phase 9 · 08, 12) | 使用通过 GAE 得到的 TD-style advantage 的 actor-critic。 |
| Offline RL | CQL / IQL (Phase 9 · 08) | 带 conservative regularization 的 Q-learning。 |

आप 2026 के वर्ष के निबंध में पढ़े जाने वाले नौवें "RL" में से सभी Q-learning या SARSA का विस्तार हैं।

## 交付 यह

保存为 `outputs/skill-td-agent.md`:

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

## अभ्यास

1. **Easy。**4×4 ग्रिडवर्ल्ड में Q-लर्निंग और SARSA को प्राप्त करने के लिए, 2,000 एपिसोड के सीखने के वक्रों को तैयार करना, प्रत्येक 100 एपिसोड के औसत रिटर्न को आकर्षित करना।
2. **Medium。** एक चट्टान-चढ़ने वाले वातावरण का निर्माण करना 4×12, अंतिम पंक्ति चट्टान है, पुरस्कार -100 और आरंभ बिंदु तक रीसेट करें)  तुलना Q-लर्निंग और SARSA की अंतिम नीतियां कूटचित्र दिखाएं कि वे अपने-अपने रास्ते से गुजरते हैं कौन सा चट्टान के करीब है?
3. **Hard。**实现双Q-学习──在噪音-奖励 GridWorld 上(给每步奖励 添加高斯音 σ=5), प्रदर्शन Q-学习 会明显高估 `V*(0,0)`, और डबल क्यू-लर्निंग नहीं होगा.

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
- [Sutton & Barto (2018). Ch. 6 — Temporal-Difference Learning](http://incompleteideas.net/book/RLbook2020.pdf) TD(0) 、SARSA、Q-learning、 अपेक्षित SARSA──
- [Hasselt (2010). Double Q-learning](https://papers.nips.cc/paper_files/paper/2010/hash/091d584fced301b442654dd8c23b3fc9-Abstract.html) अधिकतम पूर्वाग्रह का सुधार विधि。
- [Seijen, Hasselt, Whiteson, Wiering (2009). A Theoretical and Empirical Analysis of Expected SARSA](https://ieeexplore.ieee.org/document/4927542) अपेक्षित SARSA का आंदोलन
- [Rummery & Niranjan (1994). On-line Q-learning using connectionist systems](https://www.researchgate.net/publication/2500611_On-Line_Q-Learning_Using_Connectionist_Systems) 创建SARSA 这个术语的论文(当时被称为"修改连接主义 Q-学习")
- [Sutton & Barto (2018). Ch. 7 — n-step Bootstrapping](http://incompleteideas.net/book/RLbook2020.pdf) 将 TD(0) 泛化到 TD(n), यह Q-learning से 走向 पात्रता के निशान, तथा बाद में PPO में GAE के मार्गों में से है।
