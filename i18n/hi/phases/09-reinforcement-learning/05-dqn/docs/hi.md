# डीप क्यू-नेटवर्क (डीक्यूएन)

> 2013:Mnih ने सात अटारी गेम में सभी क्लासिक आरएल एजेंटों को हराकर Q-लर्निंग नेटवर्क को प्रशिक्षित किया। 2015: विस्तार से 49 गेम तक विस्तारित किया गया, Nature पर प्रकाशित हुआ, दीप-आरएल समय को आग लगा दिया।

**类型：**निर्माण
**语言：**पायथन
**前置要求：**चरण 3 · 03 (बैकप्रपॉगरेशन), चरण 9 · 04 (क्यू-लर्निंग, SARSA)
**时间：**~ 75 मिनट

## 问题

तालिकात्मक क्यू-लर्निंग  प्रत्येक (राज्य, क्रिया) के लिए एक एकल-संरक्षण के लिए एक क्यू-मूल्य── एक शतरंज बोर्ड लगभग 1043  states── एक  अटारी 画面 है 210×160×3 = 100,800 个 विशेषताएं── तालिकात्मक आरएल 几千个州 时就会失效,更不用说数十亿个州──

यह स्पष्ट है कि न्यूरल नेटवर्क के साथ।`Q(s, a; θ)`                                                                                                                                                                                                                                                              

1. **Experience replay**让转变 去相关──
2. **Target network**结 बूटस्ट्रैप लक्ष्य──
3. **Reward clipping**归一化 ग्रेडिएंट 幅度──

अत्तारी के ऊपर DQN पहली बार एकल संरचना और एकल हाइपरपैरामीटर 集合 का उपयोग करके, मूल पिक्सेल से  कुछ दर्जन नियंत्रण समस्याओं को हल किया गया है। इसके बाद सभी deep-RL  विधि, जिसमें DDQN, Rainbow, Dueling, Distribution, R2D2, Agent57 शामिल हैं, इस तीन तकनीक के आधार पर हैं।

## 概念

![DQN training loop: env, replay buffer, online net, target net, Bellman TD loss](../assets/dqn.svg)

**目标。**DQN में न्यूरल Q-कार्य 上 न्यूनतम एक चरण TD हानिः

`L(θ) = E_{(s,a,r,s')~D} [ (r + γ max_{a'} Q(s', a'; θ^-) - Q(s, a; θ))² ]`

`θ`= ऑनलाइन नेटवर्क, प्रत्येक चरण में ग्रेडिएंट ड्रेसेंट 更新──`θ^-`= लक्ष्य नेटवर्क, आवधिक से `θ`复制(約每 10,000 步一次)`D`= पिछले संक्रमणों का रिप्ले बफर。

**三个技巧，按重要性排序：**

**Experience replay。**एक समाहित `~10⁶`परिवर्तनों का रिंग बफर── प्रत्येक प्रशिक्षण चरण सभी एक मिनी बैच के रूप में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक ही समय में एक बार में एक ही समय में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में एक बार में

**Target network。**Bellman के रास्ते के दोनों पक्षों एक ही नेटवर्क का उपयोग करते हैं ।`Q(·; θ)`, लक्ष्य को प्रत्येक अद्यतन के दौरान स्थानांतरित करेगा, यानि अपने खुद के अंतराल को चलाने के लिए आगे बढ़ेगा।`Q(·; θ^-)`, इसके वजन 结──每隔 `C`步,复制 `θ → θ^-` यह हजारों चरणों में स्थिरता बनाए रखने के लिए गिरावट लक्ष्य को अनुमति देगा`θ^- ← τ θ + (1-τ) θ^-`(डीडीपीजी, एसएसी के लिए) अधिक सुचारू रूप से भिन्न होते हैं।

**Reward clipping。**अत्तारी का इनाम 幅度 1 से 1000+ तक                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                `{-1, 0, +1}`यह गलत है जब इनाम की मात्रा महत्वपूर्ण है; लेकिन अत्तारी के लिए यह संभव है, क्योंकि केवल प्रतीक महत्वपूर्ण हैं।

**Double DQN。**Hasselt (2016) 修复了最大化偏见: ऑनलाइन नेट का उपयोग करें 来*选择* कार्रवाई, लक्ष्य नेट का उपयोग करें 来* मूल्यांकन* इसे。

`target = r + γ Q(s', argmax_{a'} Q(s', a'; θ); θ^-)`

यह एक ड्रॉप-इन प्रतिस्थापन है, प्रभाव बेहतर है।

**其他改进（Rainbow, 2017）：**प्राथमिकता पुनःप्ले(更多采样 उच्च टीडी-त्रुटि संक्रमण)`V(s)`और लाभ के सिर) ̳शोरिक नेटवर्क (शिक्षित अन्वेषण) ̳न-चरण रिटर्न ̳वितरण Q (C51/QR-DQN) ̳बहु-चरण बूटस्ट्रेपिंग ̳ प्रत्येक में कुछ सौ अंक का वृद्धि होगा;收益大致可叠加──


```figure
f3-dqn-stability
```

##  इसे निर्माण

यहाँ कोड केवल स्ट्डलिब है और नम्पी-मुक्त हैः हम एक बहुत ही छोटे निरंतर ग्रिडवर्ल्ड में हैंड-स्क्रिप्टेड एकल-छिपे हुए परत MLP का उपयोग करते हैं, इसलिए प्रत्येक प्रशिक्षण चरण माइक्रोसेकंड में अंदर चल सकता है।

### 步骤 1:पुनः बफर खेलें

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

अत्तारी ने 50,000 की क्षमता का इस्तेमाल किया, हमारे खिलौने के वातावरण ने 5,000 का इस्तेमाल किया।

### 步骤 2: एक बहुत ही छोटा Q-नेटवर्क(手写 MLP)

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

आगे की राहः रैखिक → रिलू → रैखिक── यही पूरे जाल का अर्थ है──

### 步骤 3:DQN अद्यतन

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

इसका आकार पाठ 04 में Q-Learning है, केवल दो बिंदुओं के बीच अंतरः`Q(·; θ)`(b) लक्ष्य उपयोग `Q(·; θ^-)`

### 步骤 4: बाहरी परत लूप

प्रत्येक एपिसोड के लिए, आधारित है`Q(·; θ)` निष्पादन ε-greedy,把 संक्रमण 放入缓冲,采样迷你批,执行一次渐进步,并周期性同步 `θ^- ← θ`模式如下:

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

हम इस 16 आयामी एक गर्म राज्य का उपयोग करते हैं के छोटे ग्रिडवर्ल्ड में, एजेंट बैठक में लगभग 500 एपिसोड अंदर सीखना करने के लिए निकटतम सबसे अच्छा नीति है।

## 常见陷

- **Deadly triad。**फ़ंक्शन अनुमान + ऑफ-पॉलिसी + बूटस्ट्रेपिंग 可能发散──DQN उपयोग लक्ष्य नेट + रिप्ले 缓解 इस समस्या; मत हटाओ किसी एक──
- **Exploration。**ε                                                                                                                                                                                                                                                               
- **Overestimation。**शोर करने वाले प्रश्न`max`                                                                                                                                                                                                                                                              
- **Reward scale。**剪剪或归归化奖励; ग्रेडिएंट 幅度与奖励大小 成正比──
- **Replay buffer coldstart。**बफर में  कुछ हजार संक्रमण  पहले अभ्यास न करें ∙ 20 के बारे में नमूने के आधार पर प्रारंभिक ग्रेडिएंट्स ∙
- **Target sync frequency。**太频繁 ≈ 没有目标网;太不频繁 ≈ लक्ष्य 过时――Atari DQN 使用 10,000 个 env कदम──体验规则:每约1/100 个训练视界 同步一次──
- **Observation preprocessing。**एटारी डीक्यूएन 堆叠 4 ,使状态 满足 Markov──任何包含速度信息的环境都需要框架-स्टैकिंग अथवा पुनरावर्ती स्थिति──

## इसका उपयोग करें

2026 तक, डीक्यूएन ढ़ेर ही अत्याधुनिक है, लेकिन अभी भी संदर्भ नीतिगत एल्गोरिथ्म हैः

| Task | 首选 Method | 为什么不是 DQN？ |
|------|-------------|------------------|
| Discrete-action Atari-like | Rainbow DQN or Muesli | 同一框架，更多技巧。 |
| Continuous control | SAC / TD3 (Phase 9 · 07) | DQN 没有 policy network。 |
| On-policy / high-throughput | PPO (Phase 9 · 08) | 没有 replay buffer；更容易扩展。 |
| Offline RL | CQL / IQL / Decision Transformer | Conservative Q targets，没有 bootstrapping blowups。 |
| Large discrete action spaces (recommender) | DQN with action embedding, or IMPALA | 可以；细节装饰很重要。 |
| LLM RL | PPO / GRPO | Sequence-level，而不是 step-level；Loss 不同。 |

इन अनुभवों का उपयोग अभी भी किया जाता है। एसएसी, टीडी3, डीडीपीजी, एसएसी-एक्स, अल्फाज़ेरो के स्वयं-प्ले बफर के साथ-साथ प्रत्येक ऑफ़लाइन आरएल विधि में रिवार्ड क्लिपिंग और पीपीओ में लाभ सामान्यीकरण के रूप में जारी है। यह संरचना ब्लूटूथ है।

## 交付 यह

保存为 `outputs/skill-dqn-trainer.md`:

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

## अभ्यास

1. **Easy。**运行 `code/main.py`◊ प्रति एपिसोड रिटर्न वक्र का चित्रण करना― चल रही औसत ≈ -10  कितना एपिसोड चाहिए?
2. **Medium。**禁用目标网络 (Bellman Target) 两侧都使用网) 测量训练不稳定性: वापसी 会震荡还是发散?
3. **Hard。**添加 डबल डीक्यूएन:使用网 选择 `argmax a'`, उपयोग लक्ष्य नेट 评估── तुलना शोर-पुरस्कार GridWorld 上 प्रशिक्षण 1,000 个 एपिसोड 后,使用与不使用双DQN 时`Q(s_0, best_a)`सापेक्ष वास्तविकता`V*(s_0)`का पूर्वाग्रह

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

- [Mnih et al. (2013). Playing Atari with Deep Reinforcement Learning](https://arxiv.org/abs/1312.5602)  खोल दी गहरी आरएल का 2013 साल का न्यूरआईपीएस कार्यशाला पेपर。
- [Mnih et al. (2015). Human-level control through deep reinforcement learning](https://www.nature.com/articles/nature14236) प्रकृति 论文,49-खेल डीक्यूएन。
- [Hasselt, Guez, Silver (2016). Deep Reinforcement Learning with Double Q-learning](https://arxiv.org/abs/1509.06461) DDQN。
- [Wang et al. (2016). Dueling Network Architectures](https://arxiv.org/abs/1511.06581) ड्यूलिंग डीक्यूएन。
- [Hessel et al. (2018). Rainbow: Combining Improvements in Deep RL](https://arxiv.org/abs/1710.02298) 叠加技巧的论文──
- [OpenAI Spinning Up — DQN](https://spinningup.openai.com/en/latest/algorithms/dqn.html) 清晰的现代讲解──
- [Sutton & Barto (2018). Ch. 9 — On-policy Prediction with Approximation](http://incompleteideas.net/book/RLbook2020.pdf) 教科書中对 致命三三 (Function approximation + bootstrapping + off-policy) का निपटान;DQN का लक्ष्य नेटवर्क व रिप्ले बफर 正是为服服它而设计的──
- [CleanRL DQN implementation](https://docs.cleanrl.dev/rl-algorithms/dqn/) अपघटन अध्ययन के संदर्भ में एकल-फ़ाइल डीक्यूएन; इस वर्ग के साथ अनुकूलन
