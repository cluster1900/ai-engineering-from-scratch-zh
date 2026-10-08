# एमडीपी, राज्यों, कार्यों और पुरस्कार

> मार्कोव निर्णय प्रक्रिया में पांच चीजें शामिल हैंः राज्यों, कार्यों, संक्रमण, पुरस्कार, छूट, आरएल में सब कुछः क्यू-लर्निंग, पीपीओ, डीपीओ, जीआरपीओ, सभी इस रूप में अनुकूलित हैं।

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 1 · 06 (Probability & Distributions), Phase 2 · 01 (ML Taxonomy)
**Time:** ~45 minutes

## 问题

आप एक शतरंज बॉट लिख रहे हैं. या एक इन्वेंट्री प्लानर. या एक ट्रेडिंग एजेंट. या ट्रेनिंग रीजनिंग मॉडल के पीपीओ लूप. चार अलग-अलग क्षेत्रों में, लेकिन एक आश्चर्यजनक तथ्य हैः वे सभी एक ही गणितीय वस्तु के रूप में वर्गीकृत कर सकते हैं.

पर्यवेक्षित सीखने 给你 `(x, y)`जोड़े,并 आपको एक फ़ंक्शन को फिट करने की आवश्यकता है। प्रवर्धन सीखने आपको लेबल नहीं देता है, केवल आपको एक श्रृंखला देता है, आपके द्वारा किए गए कार्यों, साथ ही एक पैमाने का पुरस्कार। क्या इस कदम ने 棋 जीता है? क्या इस रिस्टॉक निर्णय ने  पैसे बचाए हैं? क्या यह व्यापार लाभदायक है? क्या LLM 刚刚生成的 टोकन ने न्यायाधीश से वहां से अधिक उच्च पुरस्कार लाया है?

प्रारूपण से पहले, आप इस धारा से नहीं सीख पाएँ। मैंने देखा कि मैंने क्या किया है, और आगे क्या हुआ है। यह बहुत अच्छा है कि प्रत्येक वस्तु को आपके द्वारा अनुमानित वस्तुओं में बदलना चाहिए। यह प्रारूपण मार्कोव निर्णय प्रक्रिया है। इस चरण में प्रत्येक आरएल एल्गोरिथ्म, जिसमें अंतिम आरएलएचएफ और जीआरपीओ लूप शामिल हैं, इस आकार पर अनुकूलित हैं।

## 概念

![Markov decision process: states, actions, transitions, rewards, discount](../assets/mdp.svg)

**五个对象。**

- **States** `S`एजेंट को निर्णय लेने की आवश्यकता है सब कुछ करना ️ GridWorld में, ️ है ️ Chess में, ️ है ️ Chess में, ️ है ️ LLM में, ️ संदर्भ विंडो है ️ किसी भी स्मृति के साथ ️
- **Actions** `A`△可选行为──上/下/左/右移动──下一步棋──输出一个代币──
- **Transitions** `P(s' | s, a)` एक निश्चित स्थिति `s`और कार्रवाई `a`,अगले राज्य का वितरण── शतरंज में निर्धारक, सूची में स्टोकास्टिक, एलएलएम में लगभग निर्धारक──
- **Rewards** `R(s, a, s')`◊标量信号──赢 = +1,输 = -1──收入减成本──GRPO 中的日志-概率比率 项──
- **Discount** `γ ∈ [0, 1)`── भावी पुरस्कार 🏻`γ = 0.99`买到大约100 कदम का क्षितिज;`γ = 0.9`买到约10:

**Markov property** `P(s_{t+1} | s_t, a_t) = P(s_{t+1} | s_0, a_0, …, s_t, a_t)`未来只依赖当前状态──如果不成立,说明国家代表不完整──这不是方法失败,而是国家失败──

**Policies 与 returns。**नीति `π(a | s)`映射到行动分布──返回 `G_t = r_t + γ r_{t+1} + γ² r_{t+2} + …`️भविष्य पुरस्कारों की छूट राशि―मूल्य `V^π(s) = E[G_t | s_t = s]`नीति में है`π`नीचे से `s`开始的预期回报──Q-मूल्य `Q^π(s, a) = E[G_t | s_t = s, a_t = a]`प्रत्येक आरएल एल्गोरिथ्म इन दोनों में से एक का अनुमान लगाता है, फिर इसके अनुसार सुधार करना चाहिए।`π`

**Bellman equations。**इस चरण में सभी सामग्री का उपयोग किया जाएगा के फिक्स्ड-पॉइंट समीकरणोंः

`V^π(s) = Σ_a π(a|s) Σ_{s', r} P(s', r | s, a) [r + γ V^π(s')]`
`Q^π(s, a) = Σ_{s', r} P(s', r | s, a) [r + γ Σ_{a'} π(a'|s') Q^π(s', a')]`

它们把预期回报 拆成 इस चरण के लिए 加上落点的折扣值──递归──本 9 चरण के प्रत्येक एल्गोरिथम, या तो इस समीकरण को 代到收(dynamic programming), या फिर से采采采 (Monte Carlo), या फिर एक चरण के साथ बूटस्ट्रैप (समय अंतर) ──


```figure
discount-horizon
```

## इसे बनाओ

### चरण 1: एक बहुत छोटा निर्धारात्मक एमडीपी

एक 4×4 ग्रिडवर्ल्ड──एजेंट से बाईं ओर शुरू, टर्मिनल में सही नीचे कोण, प्रत्येक चरण पुरस्कार के लिए -1, क्रियाओं के लिए `{up, down, left, right}`见 `code/main.py`

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

五行──这是完整环境──确定性过渡、恒定步骤惩罚、吸收终端状态──

### चरण 2: एक नीति को लागू करें

नीति है राज्य से क्रिया वितरण के फ़ंक्शन तक। सबसे सरल है समान यादृच्छिक।

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

运行随机政策 1000 次── इस 4×4 बोर्ड का औसत रिटर्न 大约是 -60到 -80── इष्टतम रिटर्न है -6(沿直线路径向下再向右)──缩小这个差距,就是9期的全部内容──

### चरण 3: बेलमैन समीकरण के माध्यम से 精确计算 `V^π`

 लघु एमडीपी के लिए, बेलमैन समीकरण एक रैखिक प्रणाली है️ राज्यों, अनुप्रयोग अपेक्षाओं,️ मूल्य के परिवर्तन के लिए️

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

यह पुनरावर्ती नीति मूल्यांकन है। यह Sutton & Barto के पहले एल्गोरिथ्म है, और प्रत्येक RL विधि का सिद्धांत आधार है।

### चरण 4:`γ`है भौतिक अर्थ वाला हाइपरपरमैटर

प्रभावी क्षितिज लगभग है`1 / (1 - γ)``γ = 0.9`→ 10 कदमों`γ = 0.99`→ 100 कदमों`γ = 0.999`→ 1000 कदमों。

太低时,代理会目光短浅──太高时,क्रेडिट असाइनमेंट会变噪, चूंकि कई प्रारंभिक चरणों में शहर मिलकर दूर भविष्य के पुरस्कार की जिम्मेदारी ले लेंगे──LLM RLHF आमतौर पर उपयोग किया जाता है `γ = 1`,因为 एपिसोड 短且有界──नियंत्रण कार्य 使用 `0.95–0.99`❖ लंबी दूरी की रणनीति खेलें`0.999`

## 陷

- **Non-Markovian state.**यदि आपको हालिया तीन बार अवलोकन की आवश्यकता है 才能决策, तो state不只是当前 अवलोकन──修复:स्टैक फ्रेम(DQN 在 Atari 上堆叠 4 ) या उपयोग करें पुनरावर्ती राज्य(在 अवलोकन上使用 LSTM/GRU) 
- **Sparse rewards.**केवल जीत के समय इनाम देने के लिए, बड़े राज्य स्थानों में सीखने का लगभग असंभव होगा।
- **Reward hacking.**优化代理奖励 经常产生病态行为──OpenAI के नाव-दौड़ एजेंट 一直原地转圈收集powerups, बजाय खत्म प्रतियोगिता──始终从目标结果定义奖励, बजाय प्रॉक्सी 定义──
- **Discount mis-spec.**में अनंत क्षितिज कार्य 上使用 `γ = 1`हर मूल्य को अनंत बना देगा. हमेशा एक अंतहीन क्षितिज या उपयोग कर।`γ < 1`सीमाएँ
- **Reward scale.**{+100, -100} के साथ {+1, -1} के पुरस्कार एक ही अनुकूलन नीति देंगे, लेकिन ग्रेडिएंट परिमाण 会 बहुत अलग है`[-1, 1]`

## इसका प्रयोग करें

2026 के स्टैक में प्रत्येक आरएल पाइपलाइन को एक एमडीपी में विभाजित किया जाएगा।

| Situation | State | Action | Reward | γ |
|-----------|-------|--------|--------|---|
| Control（locomotion, manipulation） | Joint angles + velocities | Continuous torques | Task-specific shaped | 0.99 |
| Games（chess, Go, poker） | Board + history | Legal move | Win=+1 / loss=-1 | 1.0（finite） |
| Inventory / pricing | Stock + demand | Order qty | Revenue - cost | 0.95 |
| RLHF for LLMs | Context tokens | Next token | Reward-model score at end | 1.0（episode ~200 tokens） |
| GRPO for reasoning | Prompt + partial response | Next token | Verifier 0/1 at end | 1.0 |

किसी भी प्रशिक्षण लूप को लिखने से पहले, पहले इस 5 तत्वों को लिखें। अधिकांश RL काम नहीं करते हैं, जो अंततः कागज पर पहले से ही खराब MDP सूत्रों को वापस ले सकते हैं।

## इसे भेजें

保存为 `outputs/skill-mdp-modeler.md`:

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

## अभ्यास

1. **Easy.**`code/main.py`中实现 4×4 GridWorld 和 यादृच्छिक-नीति रोलआउट──运行 10,000 个节目──报告返点的平均和 std──与最佳返点──-6)比较──
2. **Medium.**एक समान-संदिग्ध नीति के लिए, उपयोग`γ ∈ {0.5, 0.9, 0.99}`运行 `policy_evaluation`                                                                                                                                                                                                                                                              `V`印为4×4网──解释为什么终端 附近状态值会随着变大 `γ`और तेजी से बढ़े।
3. **Hard.**GridWorld को स्टोकास्टिक में बदलनाः प्रत्येक कार्रवाई को अनुमानित करने के लिए`p = 0.1`滑向相邻方向── एक समान नीति का पुनः मूल्यांकन──`V[start]`अच्छा या बुरा होगा?

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

- [Sutton & Barto (2018). Reinforcement Learning: An Introduction, 2nd ed.](http://incompleteideas.net/book/RLbook2020.pdf) 教科书──第3 章介绍 MDPs 和 बेलमैन समीकरण;第1 章 प्रस्तावित पुरस्कार परिकल्पना, यह支后续每一课──
- [Bellman (1957). Dynamic Programming](https://press.princeton.edu/books/paperback/9780691146683/dynamic-programming) बेलमैन समीकरण का स्रोत
- [OpenAI Spinning Up — Part 1: Key Concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html) गहरे आरएल कोण से 写的简洁 MDP प्राइमर──
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887)  MDPs तथा सटीक समाधान विधियों के संचालन-अनुसंधान के बारे में 
- [Littman (1996). Algorithms for Sequential Decision Making (PhD thesis)](https://www.cs.rutgers.edu/~mlittman/papers/thesis-main.pdf) एमडीपी को गतिशील-प्रोग्रामिंग विशेष उदाहरण के रूप में 
