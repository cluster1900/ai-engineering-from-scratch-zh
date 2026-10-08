# बहु-एजेंट आरएल

> एकल एजेंट आरएल 假设环境是静止的──把两个学习的代理 放进同一个世界,这个假设就会失效: प्रत्येक एजेंट 其他代理 环境 का हिस्सा है,而且两者都在变化── बहु-代理 आरएल 是一个集团让学习在马尔科夫假设中不复成立时仍能收取技巧──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (Q-learning), Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~45 minutes

## 问题

एक रोबोट सीखता है कमरे में नेविगेट करना, एक एकल एजेंट आरएल  समस्या है ◊ एक फुटबॉल टीम नहीं है ◊ अल्फास्टार के लिए युद्ध स्टारक्राफ्ट के लिए हैं ◊ एक बोली लगाने वाले एजेंटों से बना बाजार नहीं है ◊ दो वाहनों पर चार ओर से पार्किंग मार्ग के माध्यम से चर्चा नहीं है ◊ कई वास्तविक मुद्दों के लिए हैं ◊

प्रत्येक बहु-एजेंट सेटिंग में, किसी भी एजेंट के दृष्टिकोण से, अन्य एजेंट * यही * पर्यावरण का हिस्सा हैं। उनके सीखने और अपने व्यवहार को बदलने के साथ, पर्यावरण गैर-स्थिर हो जाता है।

यह तालिकागत अभिसरण के प्रमाणों को नष्ट कर देगा (Q-learning का गारंटी माननीय है)  यह भी साफ़-साफ़ गहराई से आरएल को नष्ट कर देगा: एजेंटों को एक दूसरे के पीछे-पीछे चलने के लिए एक चक्र में बैठना, हमेशा स्थिर नीति प्राप्त करने में असमर्थ होना

2026 के वर्ष के अनुप्रयोगों में शामिल हैंः रोबोट झुंड, यातायात मार्गनिर्देशन, स्वायत्त वाहन बेड़े, बाजार सिम्युलेटर, बहु-एजेंट एलएलएम प्रणाली (Phase 16)), तथा किसी भी ऐसे खेल में जो कई बुद्धिमान खिलाड़ी हों।

## 概念

![Four MARL regimes: indep, centralized critic, self-play, league](../assets/marl.svg)

**Formalism: Markov Game.**एमडीपी का पानाकरणःराज्य `S`、 संयुक्त कार्य `a = (a_1, …, a_n)`、 संक्रमण `P(s' | s, a)`, तथा प्रत्येक एजेंट के पुरस्कार `R_i(s, a, s')` प्रत्येक एजेंट `i`अपनी नीति में`π_i`नीचे अपने प्रतिफल को अधिकतम करें। यदि पुरस्कार पूरी तरह से समान हैं, तो यह है।**fully cooperative** यदि यह शून्य-अमेरिका है, तो यह है **adversarial** यदि मिश्रित, तो है **general-sum**

**核心挑战：**

- **Non-stationarity.**एजेंट से`i`का दृष्टिकोण देखें,`P(s' | s, a_i)`取决于 `π_{-i}`, और यह बदल रहा है.
- **Credit assignment.**साझा पुरस्कार में, कौन सा एजेंट इसे करने के लिए नेतृत्व किया?
- **Exploration coordination.**एजेंटों को एक ही राज्य की दोहराने के बजाय एक-दूसरे की पूर्ति करने की रणनीति तलाशनी होगी।
- **Scalability.**संयुक्त कार्यक्षेत्र 会随 `n`वृद्धि दर
- **Partial observability.**प्रत्येक एजेंट केवल अपने स्वयं के अवलोकन को देख सकता है; वैश्विक राज्य छिपा हुआ है।

**四种主导范式：**

**1. Independent Q-learning / independent PPO (IQL, IPPO).**प्रत्येक एजेंट सीखें अपना स्वयं का प्रश्न या नीति, अन्य एजेंटों को अपने पर्यावरण का हिस्सा बनाएं सरल, कभी प्रभावी, विशेष रूप से अनुभव दोहराएं एक साधारण एजेंट-मॉडलिंग के रूप में।

**2. Centralized training, decentralized execution (CTDE).**आधुनिक शैली में सबसे आम है. प्रत्येक एजेंट की अपनी नीति है.`π_i`, यह स्थानीय अवलोकन पर आधारित है ।`o_i` तैनाती के लिए मानक विकेन्द्रीकृत निष्पादन है।`Q(s, a_1, …, a_n)`इस पर एक पूर्ण वैश्विक स्थिति तथा संयुक्त कार्य के लिए शर्तें:
- **MADDPG**(लो और सहयोगियों 2017): 带有每个代理 一个集中批评的DDPG──
- **COMA**(Foerster et al. 2017): विरोधाभासी आधार  प्रश्न यदि मैं उस समय कार्रवाई करता `a'`, मेरा पुरस्कार होगा यह कितना है?
- **MAPPO**/**IPPO**साझा आलोचक (यू और सहयोगियों 2022) के साथः 带有集中价值功能的PPO──2026年合作社 MARL 中的主导方法──
- **QMIX**(Rashid et al. 2018): मूल्य विघटन`Q_tot(s, a) = f(Q_1(s, a_1), …, Q_n(s, a_n))`,并使用单调混合──

**3. Self-play.**एक ही एजेंट के दो प्रतिकृतियाँ एक दूसरे के खिलाफ युद्ध करते हैं।

**4. League play.**स्व-खेल आम-समुदाय / विरोधी वातावरण का विस्तारः लीग से लेग में प्रतिद्वंद्वी के लिए एक समूह को बनाए रखना, और उनके खिलाफ प्रशिक्षण देना। शोषकों में शामिल होना।

**Communication.**允许 agents 相互发送学到的信息 `m_i`在合作环境中有效──Foerster et al. (2016) 表明,विभिन्न एजेंटों के बीच संचार को समाप्ति तक प्रशिक्षित किया जा सकता है── आज एलएलएम के बहु-एजेंट प्रणालियों पर आधारित है


```figure
f3-marl-orbit
```

##  इसे निर्माण

इस वर्ग में एक 6×6 ग्रिडवर्ल्ड का उपयोग किया गया है, जिसमें दो सहकारी एजेंट शामिल हैं।`-1`; दु者都到达时 `+10`参见 `code/main.py`

### 步骤 1: बहु-एजेंट वातावरण

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

*संयुक्त* कार्यक्षेत्र है `|A|² = 16`वैश्विक स्थिति  दो स्थान 

### 步骤 2: स्वतंत्र Q-लर्निंग

प्रत्येक एजेंट 运行自己的Q-table,以共同状态 作为关键──每一步:两者都选择 ε-贪行动,收集联合过渡,并各自用共享奖励 更新自己的Q──

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

यह इस कार्य में प्रभावी है, क्योंकि पुरस्कार घन और समकक्ष हैं।

### 步骤3: केंद्रीकृत Q और विघटित-मूल्य अद्यतन

संयुक्त कार्यों के लिए एक प्रश्न का उपयोग करेंः`Q(s, a_1, a_2)` साझा पुरस्कार 更新──执行时通过边缘化来分散化:`π_i(s) = argmax_{a_i} max_{a_{-i}} Q(s, a_1, a_2)`यह सूचकांक स्तर के संयुक्त कार्य क्षेत्र का उपयोग करके एक* सही* वैश्विक दृष्टिकोण को बदल देता है

### 步骤 4: 简单 स्व-प्ले

एक एजेंट, दो भूमिकाएँ. प्रशिक्षण एजेंट ए.`K`个节目,把 A के वजन 复制到 B──对称训练, प्रगति一致── अल्फाझेरो नुस्खा का लघु संस्करण──

## 常见陷

- **Non-stationary replay.**प्रयोग स्वतंत्र एजेंट 时, अनुभव दोहराव एकल एजेंट से बदतर, क्योंकि पुराने संक्रमणों के लिए वर्तमान में पहले से ही पुराने प्रतिद्वंद्वियों द्वारा हैं 生成的──修复:
- **Credit assignment ambiguity.**长 एपिसोड 后得到共享奖励;没有明确方式说明哪个代理做出贡献──修复:counterfactual baselines(COMA),或按代理做奖励塑造──
- **Policy drift / chasing.**प्रत्येक एजेंट की सबसे अच्छी प्रतिक्रिया दूसरे एजेंट के अपडेट के साथ बदलती है।
- **Reward hacking via coordination.**एजेंटों 找到了 डिजाइनरों ने नहीं किया उम्मीदों का समन्वयित उपयोगों को प्राप्त करना।
- **Exploration redundancy.**两个代理 探索相同的状态-action pairs──修复: प्रत्येक एजेंट प्रयोग एंट्रॉपी बोनस, या भूमिका-परिवर्तन──
- **League cycles.**純自主遊戲可能卡在支配周期 中──修复:使用包含多样的对手的联赛遊戲──
- **Sample explosion.** `n`个 agents × state space × joint actions──用 फ़ंक्शन approximation 近似; उपयोग फ़ैक्टर किए गए एक्शन स्पेस(प्रत्येक agent एक नीति आउटपुट हेड)。

## इसका उपयोग करें

2026 साल MARL 应用图谱:

| Domain | Method | Notes |
|--------|--------|-------|
| Cooperative navigation / manipulation | MAPPO / QMIX | CTDE；shared critic + decentralized actors。 |
| Two-player games (chess, Go, poker) | Self-play with MCTS (AlphaZero) | Zero-sum；对称训练。 |
| Complex multiplayer (Dota, StarCraft) | League play + imitation pretraining | OpenAI Five, AlphaStar。 |
| Autonomous-vehicle fleets | CTDE MAPPO / PPO with attention | Partial obs；可变 team sizes。 |
| Auction markets | Game-theoretic equilibrium + RL | 当 `n` → ∞ 时使用 mean-field RL。 |
| LLM multi-agent systems (Phase 16) | Natural-language comm + role conditioning | RL loop 位于 agent-planning layer。 |

2026 में, मार्ल का सबसे बड़ा विकास क्षेत्र एलएलएम के सिस्टम पर आधारित हैः भाषा-मॉडल एजेंटों द्वारा गठित समूहों द्वारा परामर्श, बहस, निर्माण सॉफ्टवेयर। आरएल अब टोकन स्तर पर नहीं, बल्कि *ट्रैक्टरी-स्तरीय* आउटपुट के लिए प्राथमिकता अनुकूलन पर काम कर रहा है।

## 交付 यह

保存为 `outputs/skill-marl-architect.md`:

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

## अभ्यास

1. **Easy.**2-एजेंट सहकारी ग्रिडवर्ल्ड 上 प्रशिक्षण स्वतंत्र Q-लर्निंग── आवश्यक कितने एपिसोड 才能让 mean return > 0? संयुक्त सीखने वक्र को रेखांकित करना──
2. **Medium.** समन्वय  कार्य जोड़ें: केवल तभी जब दो एजेंट एक ही चक्र में लक्ष्य पर चढ़ते हैं, तब ही लक्ष्य तक पहुंचने का अनुमान लगाया जाता है।
3. **Hard.** एक केंद्रीकृत आलोचक को प्राप्त करना जो MAPPO शैली के प्रशिक्षण के लिए उपयोग किया जाता है, और समन्वय कार्य को ऊपर करने के लिए स्वतंत्र PPO की तुलना में अभिसरण गति 

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

- [Lowe et al. (2017). Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments (MADDPG)](https://arxiv.org/abs/1706.02275) 带集中 आलोचक का CTDE。
- [Foerster et al. (2017). Counterfactual Multi-Agent Policy Gradients (COMA)](https://arxiv.org/abs/1705.08926) क्रेडिट असाइनमेंट की विपरीत आधार रेखाओं के साथ उपयोग किया जाता है。
- [Rashid et al. (2018). QMIX: Monotonic Value Function Factorisation](https://arxiv.org/abs/1803.11485) 带 एकादशी का मूल्य विघटन──
- [Yu et al. (2022). The Surprising Effectiveness of PPO in Cooperative Multi-Agent Games (MAPPO)](https://arxiv.org/abs/2103.01955) पीपीओ मार्ल के लिए मानव इरादे के लिए मजबूत
- [Vinyals et al. (2019). Grandmaster level in StarCraft II using multi-agent reinforcement learning (AlphaStar)](https://www.nature.com/articles/s41586-019-1724-z) बड़े पैमाने पर लीग खेलना。
- [Silver et al. (2017). Mastering the game of Go without human knowledge (AlphaGo Zero)](https://www.nature.com/articles/nature24270) शून्य-संख्यक खेलों 中的纯粹自动玩
- [Sutton & Barto (2018). Ch. 15 — Neuroscience & Ch. 17 — Frontiers](http://incompleteideas.net/book/RLbook2020.pdf)  बहु-एजेंट सेटिंग्स और गैर-स्थिरता समस्या के लिए संक्षिप्त उपचार में सामग्री शामिल है, जबकि CTDE इस समस्या को हल करने के लिए डिज़ाइन किया गया है।
- [Zhang, Yang & Başar (2021). Multi-Agent Reinforcement Learning: A Selective Overview](https://arxiv.org/abs/1911.10635)                                                                                                                                                                                                                                                              
