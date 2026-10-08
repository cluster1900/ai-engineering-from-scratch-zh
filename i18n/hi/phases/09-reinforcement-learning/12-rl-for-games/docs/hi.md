# 面向游戏的RL  अल्फाज़ेरो、मुज़ेरो और LLM तर्क 时代

> 1992: टीडी-गैमन शुद्ध टीडी उपयोग में बैकगैमन में मानव विजेता को हराया──2016: अल्फागो ली सेडोल को हराया──2017: अल्फाज़ेरो से零 से शुरू होकर शतरंज, शोगी और गो को शासन करना शुरू किया──2024: डीपसेक-आर1 ने तर्क में एक ही संयोजन को साबित किया 上也有效, बस GRPO के साथ 代替 PPO── खेल इस चरण को हर बार तोड़ने का बेंचमार्क है।

**类型：**निर्माण
**语言：**पायथन
**先修要求：**चरण 9 · 05 (DQN) ‧चरण 9 · 08 (PPO) ‧चरण 9 · 09 (RLHF) ‧चरण 9 · 10 (MARL)
**时间：**≈ 120 मिनट

## 问题

游戏具备 RL 想要的一切──清晰的奖励(胜/负)──无限集★自动玩可以重置)──完美模拟版★游戏本身就是模拟器 (★离散或小规模连续行动空间──迫使对抗鲁棒性的多代理结构──

और खेल सही है प्रत्येक बार प्रमुख आरएल 突破的测试场──TD-Gammon(backgammon,1992)──Atari-DQN(2013)──AlphaGo(2016)──AlphaZero(2017)──OpenAI Five(Dota 2,2019)──AlphaStar(StarCraft II,2019)──MuZero(लर्नाल्ड मॉडल,2019)──AlphaTensor(मैट्रिक्स गुणन,2022)──AlphaDev(सोर्टिंग एल्गोरिदम,2023)──DeepSeek-R1(मैथमैथ तर्क,2025)

यह शिखर एक एकीकृत दृष्टिकोण से गुजरता हैः अल्फाज़ेरो, म्यूज़ेरो और जीआरपीओ**self-play + search + policy improvement** प्रत्येक प्रकार का पूर्व प्रकार का सर्वव्यापीकरण होता है; विशेष रूप से GRPO, यह एलएलएम तर्क में अल्फाज़ेरो के संयोजन को लागू करता है, जिसमें टोकन क्रिया है, गणित परीक्षण जीत संकेत है

## 概念

![AlphaZero ↔ MuZero ↔ GRPO：相同循环，不同环境](../assets/rl-games.svg)

**统一循环。**

```
while True:
    trajectory = self_play(current_policy, search)     # 和自己对局
    policy_target = search.improved_policy(trajectory) # search 改进原始 policy
    policy_net.update(policy_target, value_target)     # 在 search 输出上做 supervised 训练
```

**AlphaZero (2017)。**Silver et al. 给定一个规则已知的游戏(शतरंज、शोगी、Go):

- नीति-मूल्य नेटवर्क: एक塔 `f_θ(s) → (p, v)``p`यह कानूनी कदम है ऊपर की पूर्ववर्ती`v`खेल के परिणाम की अपेक्षा है।
- मोन्टे कार्लो वृक्ष खोज (MCTS): प्रत्येक चरण में, वृक्षों का उपयोग`(p, v)`作为前 + बूटस्ट्रैप──用 UCB (PUCT) 选择节点:`a* = argmax Q(s, a) + c · p(a|s) · √N(s) / (1 + N(s, a))`
- स्वयं-खेलः एजेंट बनाम एजेंट को खेल के लिए.`t`步,MCTS यात्रा वितरण `π_t`成为政策 训练目标──
- हानि:`L = (v - z)² - π · log p + c · ||θ||²``z` खेल का परिणाम+1 / 0 / -1)

零人类知识――零手工. एक एकल संयोजन, अपने स्वयं के खेल के बाद एक शतरंज, शोगी और गो को प्राप्त किया।

**MuZero (2019)。**Schrittwieser et al. 移除规则已知的要求──

- न कि स्थिर वातावरण का उपयोग करना, बल्कि एक *लैटिन डायनामिक्स मॉडल* सीखना`(h, g, f)`:
  - `h(s)`:将观察 编码为潜伏状态──
  - `g(s_latent, a)`:预测下一个潜伏状态 + पुरस्कार──
  - `f(s_latent)`:预测 नीति पूर्व + मूल्य。
- MCTS में *लर्ना लटेंट स्पेस* 中运行──同一搜索,同一训练循环──
- 适用于Go、棋、shogi *以及* अत्तारी  一个算法,不需要规则知识──

**Stochastic MuZero (2022)。**加入 स्टोकैस्टिक डायनामिक्स 和 मौका नोड्स; विस्तारित करने के लिए बैकगैमोन 这类游戏──

**Muesli、Gumbel MuZero (2022-2024)。**️ नमूना दक्षता एवं निर्धारात्मक खोज में सुधार

**GRPO (2024-2025)。**डीप सीक-आर1 配方── समान अल्फाज़ेरो 形状循环, भाषा-मॉडल तर्क में लागूः

- 游戏: उत्तर गणित / कोडिंग / तर्क समस्या──胜利= सत्यापितकर्ता(परीक्षण मामला 通过、数值答案匹配) वापसी 1──
- नीतिःLLM。कार्य:टोकन──राज्यःप्रदर्शन + प्रतिक्रिया-अभी तक──
-  कोई आलोचना नहीं                                                                                                                                                                                                                                                             `G`个完成──计算每个完成的奖励──使用 **group-relative advantage** `A_i = (r_i - mean_r) / std_r`作为 REINFORCE 风格更新的信号──
- संदर्भ नीति के लिए KL दंड के साथ, RLHF के समान
- 完整 हानि:

  `L_GRPO(θ) = -E_{q, {o_i}} [ (1/G) Σ_i A_i · log π_θ(o_i | q) ] + β · KL(π_θ || π_ref)`

 कोई पुरस्कार मॉडल, कोई आलोचक, कोई एमसीटीएस नहीं  समूह-संबंधी आधार रेखा  तीनों को बदल दिया गया  तर्क मानदंड में, कम से अधिक गणना के साथ  पीपीओ-आरएलएचएफ 质量  तक पहुँचने या उससे अधिक 

**完整的 R1 配方。**डीपसीक-आर1 ((डीपसीक 2025) एक लेख में दो मॉडल हैंः

- **R1-Zero。**开始──没有 SFT──直接应用 GRPO, दो पुरस्कार घटक का उपयोग करें:* सटीकता पुरस्कार*(नियम आधारित  最终答案是否能解析成正确数字 / 代码是否通过单元测试) और * स्वरूप पुरस्कार*(पूर्ण हो या नहीं 包在`<think>…</think>`标签内) ・经过数千步后, औसत प्रतिक्रिया लंबाई लगभग 100 增长到约 10,000 टोकन,गणितीय बेंचमार्क 分数上升到接近 o1 पूर्वावलोकन 水平。模型 从零开始学会推理──缺点: इसकी सोच श्रृंखला 往往难以阅读、混用语言,并且缺少风格打磨──
- **R1。**प्रयोग चार चरण पाइपलाइन 修复 R1-Zero का पठनीयता समस्याः
  1. **Cold-start SFT。**️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️
  2. **Reasoning-oriented GRPO。**उपयोग सटीकता+फॉर्मेट इनाम,并加入 *भाषा-अनुपालन* इनाम कोड स्विचिंग को रोकने हेतु──
  3. **Rejection sampling + SFT 第 2 轮。**आरएल चेकपॉइंट से 采样约600K 条 तर्क प्रक्षेपवक्र, केवल अंतिम उत्तर सही और CoT पठनीय नमूना को बनाए रखें,并与约200K 条非 तर्क SFT उदाहरण(लेखण、QA、स्व-ज्ञान)组合──再次 बारीक-तुन आधार──
  4. **Full-spectrum GRPO。**पुनः एक दौर आरएल, कवर तर्क (नियम आधारित इनाम) और सामान्य संरेखण (उपयोगिता/हानिरहितता प्राथमिकता आधारित इनाम)

结果在开放权重下于 AIME 和 MATH-500 上匹配 o1,并且足够小,可以蒸化──同一篇论文还发布了六种蒸化密集型模型(从Qwen-1.5B到Llama-70B),方式是R1 के तर्क के निशान 上对学生做SFT  学生端没有RL──强RL的师的蒸化在学生规模上持续优于从零开始的RL──

**为什么 reasoning 用 GRPO 而不是 PPO。**डीप सीकमैथ 论文(2024 साल 2 月) तीन कारणों को बताता हैः 1) ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

**Search-free vs search-based。**खेल क्षेत्र में पहले से ही विभाजित हैः

- *长视野的完美信息游戏*(Go、棋): अभी भी खोज आधारित है──AlphaZero / MuZero 占主导──
- *LLM तर्क*: उत्पादन中还没有 MCTS;对完整部署做GRPO,推理计算使用最好的N――प्रक्रिया पुरस्कार मॉडल (PRMs) 暗示 चरण-स्तरीय खोज 正被重新加入──


```figure
f3-selfplay-ladder
```

## 构建

`code/main.py`मध्य कोड को पूरा किया गया **微型 GRPO** एक साथ कई समूहों के नमूना के साथ एक ही एल्गोरिथ्म LLM के साथ; केवल नीति और पर्यावरण और अधिक सरल।

### 步骤 1: एक माइक्रोटाइप सत्यापन वातावरण

```python
QUESTIONS = [
    {"prompt": "q1", "correct": 3},
    {"prompt": "q2", "correct": 1},
]

def verify(prompt_idx, answer_token):
    return 1.0 if answer_token == QUESTIONS[prompt_idx]["correct"] else 0.0
```

वास्तविक जीआरपीओ में, सत्यापितकर्ता इकाई परीक्षण या गणितीय सममूल्य की जाँच करेगा।

### 步骤 2:नीतिः प्रत्येक संकेत ऊपर के लिए 个 उत्तर टोकन बनाने softmax

```python
def policy_probs(theta, p_idx):
    return softmax(theta[p_idx])
```

इसी प्रकार तत्काल रूप से शर्त के रूप में LLM अंतिम-स्तर आउटपुट

### 步骤 3: समूह नमूनाकरण एवं समूह-संबंधी लाभ

```python
def grpo_step(theta, p_idx, G=8, beta=0.01, lr=0.1, rng=None):
    probs = policy_probs(theta, p_idx)
    samples = [sample(probs, rng) for _ in range(G)]
    rewards = [verify(p_idx, s) for s in samples]
    mean_r = sum(rewards) / G
    std_r = stddev(rewards) + 1e-8
    advs = [(r - mean_r) / std_r for r in rewards]

    for a, A in zip(samples, advs):
        grad = onehot(a) - probs
        for i in range(len(probs)):
            theta[p_idx][i] += lr * A * grad[i]
    # KL penalty：把 theta 拉向 reference
    for i in range(len(probs)):
        theta[p_idx][i] -= beta * (theta[p_idx][i] - reference[p_idx][i])
```

समूह-संबंधी लाभ है 2024 साल डीपसेक के技巧──不需要批评──基线是群中,正常化 使用群 std──

### 步骤 4: REINFORCE मूल रेखा से (मूल्य मुक्त) तुलना

समान सेटिंग, समान गणना, सामान्य पुनर्जागरण, ग्रेपो, अधिक तेजी से, अधिक स्थिर,

### 步骤 5: एंट्रॉपी और KL का निरीक्षण करें

RLHF के समान निदानः संदर्भ के लिए औसत KL、नीति एंट्रोपी、उपलब्धता-समय पर── एक बार ये स्थिर हो जाने पर प्रशिक्षण पूरा हो जाता है──

## 常见陷

- **通过操纵 verifier 进行 reward hacking。**GRPO ने RLHF का जोखिम उठाया हैः यदि सत्यापक  गलती या उपयोग किया जा सकता है, तो LLM शोषण करेगा।
- **Group size 太小。**समूह मूल के आधार पर`1/√G`缩放――低于 `G = 4`时,अतिरिक्त संकेत 会很噪音;标准选择是 `G = 8`तक `64`
- **Length bias。**अलग-अलग लंबाई के LLM पूरा होने के विभिन्न लॉग-संभाव्यताएँ हैं।
- **纯 self-play 循环。**अल्फाज़ेरो 风格训练可能在一般数量游戏中卡进 प्रभुत्व लूप──可通过多样化对手池 लीग खेल,पढ़ें 10)缓解──
- **Search-policy mismatch。**अल्फाज़ेर  प्रशिक्षण नीति 去模仿搜索结果── यदि नीति नेट 太小, खोज का वितरण प्रदर्शित नहीं कर सकता है, तो प्रशिक्षण रुक जाएगा──
- **Compute floor。**MuZero / AlphaZero 需要海量计算──一次的抽象 往往就是数百GPU-hours──用于学习的微型演示是存在的(例如连接四上的 AlphaZero) 
- **Verifier coverage。**बग समाधान के लिए भी पारित इकाई परीक्षणों को मजबूत करेगा इस बग को।

## उपयोग

2026 साल खेल-RL 版图,按域 划分:

| Domain | 主导方法 |
|--------|-----------------|
| Two-player zero-sum board games（Go、chess、shogi） | AlphaZero / MuZero / KataGo |
| Imperfect info card games（poker） | CFR + deep learning（DeepStack、Libratus、Pluribus） |
| Atari / pixel games | Muesli / MuZero / IMPALA-PPO |
| Large multiplayer strategy（Dota、StarCraft） | PPO + self-play + league（OpenAI Five、AlphaStar） |
| LLM math/code reasoning | GRPO（DeepSeek-R1、Qwen-RL、open replications） |
| LLM alignment | DPO / RLHF-PPO（不是 GRPO；verifier 是 preference，不是 verifiable） |
| Robotics | PPO + DR（不是 game-RL，但使用相同的 policy-gradient tools） |
| Combinatorial problems | AlphaZero variants（AlphaTensor、AlphaDev） |

यह * सूत्र*  स्व-खेल  खोज-वृद्धि सुधार  नीति विघटन  横跨文本、像素和物理控制──GRPO सबसे छोटा उदाहरण है; अधिक उदाहरण भी सामने आएंगे──

## 交付

保存为 `outputs/skill-game-rl-designer.md`:

```markdown
---
name: game-rl-designer
description: 为给定 domain 设计 game-RL 或 reasoning-RL training pipeline（AlphaZero / MuZero / GRPO）。
version: 1.0.0
phase: 9
lesson: 12
tags: [rl, alphazero, muzero, grpo, self-play]
---

给定一个目标（perfect-info game / imperfect-info / Atari / LLM reasoning / combinatorial），输出：

1. Environment fit。规则是否已知？Markov？Stochastic？Multi-agent？用于判断 AlphaZero vs MuZero vs GRPO。
2. Search strategy。MCTS（带 learned prior 的 PUCT）、Gumbel-sampled、best-of-N，或 none。
3. Self-play plan。Symmetric self-play / league / offline data / verifier-generated。
4. Target signal。Game outcome / verifier reward / preference / learned model。包含 robustness plan。
5. Diagnostics。相对 baseline 的 win rate、ELO curve、verifier pass rate、到 reference 的 KL。

对 imperfect-info games 拒绝使用 AlphaZero（转向 CFR）。没有可信 verifier 时拒绝 GRPO。没有固定 baseline opponent set 时拒绝任何 game-RL pipeline（否则 self-play ELO 未校准）。
```

## अभ्यास

1. **Easy。**`code/main.py`中实现 GRPO bandiit──在 2 个提示 × प्रत्येक 4 个答案 टोकन 上训练──使用 `G=8`में < 1,000 बार अद्यतन में प्राप्त
2. **Medium。**接入 PPO(क्लिप) और वैनिला REINFORCE──在同一个强盗上比较样本效率和奖励差与GRPO的差──
3. **Hard。**扩展到长度为 2 的推理链:agent 发发发两个 टोकन,verifier 对两个 टोकन对对 给予奖励──测量GRPO 如何处理两步序列 上的信用分配──(提示:按 *पूर्ण क्रम* 计算组优势,并传播到两个 टोकन位置──)

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|-----------------|-----------------------|
| MCTS | “带 learned net 的 tree search” | Monte Carlo Tree Search；使用 learned `(p, v)` prior 的 UCB1/PUCT selection。 |
| AlphaZero | “Self-play + MCTS” | Policy-value net 被训练来匹配 MCTS visits 和 game outcome。 |
| MuZero | “Learned-model AlphaZero” | 相同循环，但通过 learned dynamics 在 latent space 中进行。 |
| GRPO | “Critic-free PPO” | Group Relative Policy Optimization；带 group-mean baseline + KL 的 REINFORCE。 |
| PUCT | “AlphaZero 的 UCB” | `Q + c · p · √N / (1 + N_a)` —— 平衡 value estimate 与 prior。 |
| Self-play | “Agent vs past self” | Zero-sum 的标准做法；提供对称训练信号。 |
| League play | “Population-based self-play” | 将 past + current + exploiters 采样为 opponents。 |
| Verifier reward | “Verifiable RL” | Reward 来自 deterministic checker（tests pass、answer matches）。 |
| Process reward | “PRM” | 为每个 reasoning step 打分，而不只是最终答案。 |

## 延伸阅读

- [Silver et al. (2017). Mastering the game of Go without human knowledge (AlphaGo Zero)](https://www.nature.com/articles/nature24270)
- [Silver et al. (2018). A general reinforcement learning algorithm that masters chess, shogi, and Go through self-play (AlphaZero)](https://www.science.org/doi/10.1126/science.aar6404)
- [Schrittwieser et al. (2020). Mastering Atari, Go, chess and shogi by planning with a learned model (MuZero)](https://www.nature.com/articles/s41586-020-03051-4)
- [Vinyals et al. (2019). Grandmaster level in StarCraft II (AlphaStar)](https://www.nature.com/articles/s41586-019-1724-z)
- [DeepSeek-AI (2024). DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models (GRPO)](https://arxiv.org/abs/2402.03300)  GRPO एवं समूह-संबंधी आधार रेखा का परिचय
- [DeepSeek-AI (2025). DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948) 完整的四阶段 R1 配方以及 R1-Zero ablation──
- [Brown et al. (2019). Superhuman AI for multiplayer poker (Pluribus)](https://www.science.org/doi/10.1126/science.aay2400) बड़े पैमाने पर सीएफआर + गहन शिक्षा
- [Tesauro (1995). Temporal Difference Learning and TD-Gammon](https://dl.acm.org/doi/10.1145/203330.203343)                                                                                                                                                                                                                                                              
- [Hugging Face TRL — GRPOTrainer](https://huggingface.co/docs/trl/main/en/grpo_trainer) कस्टम इनाम फ़ंक्शन  अनुप्रयोग GRPO का उत्पादन संदर्भ 
- [Qwen Team (2024). Qwen2.5-Math — GRPO replication](https://github.com/QwenLM/Qwen2.5-Math)                                                          
- [Sutton & Barto (2018). Ch. 17 — Frontiers of Reinforcement Learning](http://incompleteideas.net/book/RLbook2020.pdf) स्व-खेल  खोज तथा R1 LLM पैमाने पर उपरोक्त उदाहरणीकरण  डिजाइन पुरस्कार  के शिक्षण स्तरीय ढांचे
