# 面向游戏的RL  AlphaZero、MuZero ve LLM Dönüşümserlik 时代

> 1992: TD-Gammon Pure TD ile İnsan Şampiyonasını Yüceltmek için Backgammon'da. 2016: AlphaGo Lee Sedol'u Yüceltmek için: AlphaZero Zero'dan Çeki, Shogi ve Go'yu yönetmeye başladı.

**类型：**Yapım
**语言：**Python
**先修要求：**9. Aşama · 05 (DQN)  9. Aşama · 08 (PPO)  9. Aşama · 09 (RLHF)  9. Aşama · 10 (MARL)
**时间：**120 dakika kadar .

## 问题

游戏具备 RL 想要的一切──清晰的回报(胜/负)──无限集(self-play 可以重置)──完美模拟(游戏本身就是模拟器)──离散或小规模连续行动空间──迫使对抗鲁棒性的多代理结构──

Ve oyun tam da her seferinde büyük bir RL 突破的测试场──TD-Gammon(backgammon,1992)──Atari-DQN(2013)──AlphaGo(2016)──AlphaZero(2017)──OpenAI Five(Dota 2,2019)──AlphaStar(StarCraft II,2019)──MuZero( Öğrenilmiş model,2019)──AlphaTensor(matrix çarpıtımı,2022)──AlphaDev(sortasyon algoritmaları,2023)──DeepSeek-R1(math reasoning,2025)

Bu temel taş, bir üyelik açısından üç farklı tarihi yapı ile geçecek: AlphaZero、MuZero 和 GRPO:**self-play + search + policy improvement**❖ Her türü bir önceki türün genelleşmesidir; özellikle GRPO, AlphaZero'nun birleştirmesini LLM mantıklarına uyguluyor, bunun içindeki Token ise eylemdir, matematik test ise kazanç sinyalidir.

## 概念

![AlphaZero ↔ MuZero ↔ GRPO：相同循环，不同环境](../assets/rl-games.svg)

**统一循环。**

```
while True:
    trajectory = self_play(current_policy, search)     # 和自己对局
    policy_target = search.improved_policy(trajectory) # search 改进原始 policy
    policy_net.update(policy_target, value_target)     # 在 search 输出上做 supervised 训练
```

**AlphaZero (2017)。**Silver et al. 给定一个规则已知的游戏(şah,shogi,Go):

- Politika-değer ağı:一个塔 `f_θ(s) → (p, v)`- Evet.`p`Yasal bir hareket.`v`Bu oyunun sonucu beklenir.
- Monte Carlo Ağaç Arama (MCTS): On each step,展开可能后续状态的树──使用 `(p, v)`作为前 + bootstrap──用 UCB (PUCT) 选择节点:`a* = argmax Q(s, a) + c · p(a|s) · √N(s) / (1 + N(s, a))`- Evet.
- Kendi oyununu oynayın: Ajan karşısına oynayın.`t`步,MCTS ziyaret dağıtımı `π_t`Politikaya başlamak için eğitim hedefleri.
- Kayıp:`L = (v - z)² - π · log p + c · ||θ||²`- Evet.`z`Evet, oyunun sonucu.

零人类知识――零手工 heuristik―― tek bir yapım, kendi milyonlarca oyunları kendi oyunları  sonra satranç, shogi 和 Go¬

**MuZero (2019)。**Schrittwieser et al. 移除了规则已知的要求──

- Hâlâ sabit bir ortam kullanmıyoruz, bir *latent dinamik modeli öğrenmek için*`(h, g, f)`- ...
  - `h(s)`:将观察 编码为潜伏状态――
  - `g(s_latent, a)`:预测下一个潜伏状态 + ödül。
  - `f(s_latent)`:预测 politika ön + değer
- MCTS içinde * öğrenilen gizli alanı* 中运行──同じ検索,同じトレーニングサイクル──
- 适用于Go、棋、shogi *以及* Atari  一个算法,不需要规则知识──

**Stochastic MuZero (2022)。**加入 stochastic dynamics 和 chance nodes; expand to backgammon 这类游戏──

**Muesli、Gumbel MuZero (2022-2024)。**Örnek verimliliği ve belirleyici arama üzerinde gelişmeler.

**GRPO (2024-2025)。**DeepSeek-R1 配方── aynı AlphaZero 形状循环, dil modeline uygulanır:

- 游戏: cevap matematik / kodlama / akıl yürütme sorunu。胜利= doğrulayıcı(test vaka 通過、数值答案匹配)返回 1。
- Politikası:LLM。Yapışmalar:Token。State:prompt + response-so far。
- 没有批评(PPO 风格的 V_φ) ;;相反,对每一个提示,从政策 采样 `G`个完成──计算每个完成的奖励──使用 **group-relative advantage** `A_i = (r_i - mean_r) / std_r`作为 REINFORCE 风格更新的信号──
- Referans politikasına ek KL cezası 以防漂移(RLHF'ye benzer)
- 完整 Loss:

  `L_GRPO(θ) = -E_{q, {o_i}} [ (1/G) Σ_i A_i · log π_θ(o_i | q) ] + β · KL(π_θ || π_ref)`

没有奖励模型,没有批评者,没有MCTS──grup-relative baseline 替换了三者──在推理基准上,使用少得多的计算 达到或超过PPO-RLHF 质量──

**完整的 R1 配方。**DeepSeek-R1 ((DeepSeek 2025) bir makalede iki model oluşturur:

- **R1-Zero。**DeepSeek-V3 temel modelindan 开始──没有 SFT──直接应用 GRPO, iki ödül bileşenini kullanıyor:* doğruluk ödül*(regerilere dayalı  最终答案是否能解析成正确数字 / 代码是否通过单位测试) 和 *format ödül*(完成 是否把链-of-thought 包在`<think>…</think>`标签内) ・经过数千步后, ortalama yanıt uzunluğu yaklaşık 100 增长到约 10,000 Token,数学基准 分数上升到接近 o1预览 水平。模型 从零开始学会推理──缺点:
- **R1。**Dört aşamalı boru hattı R1-Zero'nun okunma sorunu:
  1. **Cold-start SFT。**收集数千条格式清晰的长期CoT gösterisi──Basis model için yapılmış denetimli-finetune── bu da okuyabileceğiniz bir başlangıç noktası sağlar──
  2. **Reasoning-oriented GRPO。**Kullanıcı: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: Cüzdan: C
  3. **Rejection sampling + SFT 第 2 轮。**RL kontrol noktasından 采样约600K 条 推理轨迹, yalnızca kesin cevapları doğru ve CoT 可读的样本 olarak koruyun,并与约200K 条非推理 SFT örneği
  4. **Full-spectrum GRPO。**Yeniden bir RL turu yapın, düşünceyi kapsar (regular tabanlı ödül) ve genel bir uyum (faidelik/hassısızlık tercihlerine dayalı ödül)

结果在开权下于 AIME 和 MATH-500 上匹配 o1,并且足够小,可以蒸──同篇论文还发布了六种蒸的密集型模型(从Qwen-1.5B到Llama-70B),方式是R1的推理痕 上对学生做SFT  学生端没有RL──强RL的师的蒸 在学生规模上持续优于从零开始的RL──

**为什么 reasoning 用 GRPO 而不是 PPO。**DeepSeekMath 论文(2024年 2月) üç neden ortaya koyuyor: 1) ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒   ⇒ ⇒                                                                                                                                                                                          

**Search-free vs search-based。**Oyun alanı ayrılmıştır:

- *长视野的完美信息游戏*(Go、棋): hâlâ arama tabanlı。AlphaZero / MuZero 占主导。
- *LLM mantıklama*:生产中还没有 MCTS;对完整部署做GRPO,推理计算使用最好的N──进程奖励模型 (PRM) 暗示阶级搜索 正被重新加入──


```figure
f3-selfplay-ladder
```

## Yapım

`code/main.py`İç kod gerçekleşti.**微型 GRPO**  一带多组样本的强盗――算法与LLM上相同;只有政策和环境更简单――它讲清楚 *loss* 和 *group-relative advantage*,也就是2025年创新点――

### 步骤 1: bir mikrotip doğrulayıcı ortamı

```python
QUESTIONS = [
    {"prompt": "q1", "correct": 3},
    {"prompt": "q2", "correct": 1},
]

def verify(prompt_idx, answer_token):
    return 1.0 if answer_token == QUESTIONS[prompt_idx]["correct"] else 0.0
```

Gerçek GRPO'da, verifier birim testleri veya kontrol matematiksel eşdeğerliği yapar.

### 步骤 2: politika: her sorgu 上对 K 个回答 İşaret yapmak softmax

```python
def policy_probs(theta, p_idx):
    return softmax(theta[p_idx])
```

Önemli olan, LLM'nin son katmanının hızlı bir şekilde çıkışıdır.

### 步骤3: grup örneği ve grup-süre ilişkili avantaj

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

Grup-sarefli avantajı ise 2024 yıl DeepSeek'ın teknikleri, eleştirilere gerek yok, temel çizgi, grup ortalaması, normallaştırma, grup std, kullanımı,

### 步骤 4: REINFORCE baseline ile karşılaştır

Aynı ayar, aynı hesaplama, normal güçlendirme.

### 步骤 5: gözlem entropi 和 KL

RLHF ile benzer teşhisler: referans ortalaması KL、 politika entropi、 ödül-over-time── bir kez bunlar sabitleştikten sonra, eğitim tamamlanmıştır──

## 常见陷

- **通过操纵 verifier 进行 reward hacking。**GRPO RLHF'nin riskini üstlenmiştir: Eğer doğrulayıcı  yanlış veya kullanılabilirse, LLM'de bir sömürü bulacaktır.
- **Group size 太小。**Grup başlangıç çizgisine göre `1/√G`缩放――低于 缩放─`G = 4`时, avantaj sinyalleri  会很噪音; 标准选择是`G = 8`- Ne ?`64`- Evet.
- **Length bias。**Önemli bir süre boyunca, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir sürececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececece
- **纯 self-play 循环。**AlphaZero 风格训练可能在一般总数游戏中卡进统治循环──可通过多样化对手池联赛比赛,Lesson 10)缓解──
- **Search-policy mismatch。**AlphaZero trening policy 去模仿搜索结果──如果政策网太小,无法表示搜索的分布,训练会停滞──
- **Compute floor。**MuZero / AlphaZero  需要海量计算──一次的抽象──往往就是数百 GPU-hours──用于学习的微型演示 是存在的(例如连接四上的 AlphaZero)──
- **Verifier coverage。**Bu hata çözümü de geçebilir birim testleri de bu hatayı güçlendirecektir.

## kullanımı

2026 yıl oyun-RL 版图,按域 划分:

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

Bu * biçim*  kendi kendine oynamak, arama artışı geliştirmek, politika destilasyonu  横跨文本、像素和物理控制。GRPO en genç örnek; daha fazla örnek ortaya çıkacaktır。

## 交付

保存为 `outputs/skill-game-rl-designer.md`- ...

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

## 练习

1. **Easy。**- Evet .`code/main.py`Orta GRPO banditı gerçekleştirmek için. 2 个提示 × 每个 4 个回答 标签 上训练。使用`G=8`1000 kez güncelleme yapın.
2. **Medium。**接入 PPO(cliped) 和瓦尼莉 REINFORCE──在同一个强盗上比较样本效率和奖励差与GRPO的差──
3. **Hard。**扩展到长度为 2 的推理链:agent 发发发两个代币,verifier对代币对对发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发

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

- [Silver et al. (2017). Mastering the game of Go without human knowledge (AlphaGo Zero)](https://www.nature.com/articles/nature24270)- Evet.
- [Silver et al. (2018). A general reinforcement learning algorithm that masters chess, shogi, and Go through self-play (AlphaZero)](https://www.science.org/doi/10.1126/science.aar6404)- Evet.
- [Schrittwieser et al. (2020). Mastering Atari, Go, chess and shogi by planning with a learned model (MuZero)](https://www.nature.com/articles/s41586-020-03051-4)- Evet.
- [Vinyals et al. (2019). Grandmaster level in StarCraft II (AlphaStar)](https://www.nature.com/articles/s41586-019-1724-z)- Evet.
- [DeepSeek-AI (2024). DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models (GRPO)](https://arxiv.org/abs/2402.03300) 引入 GRPO 和 grup-relatör baseline 的论文──
- [DeepSeek-AI (2025). DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948) 完整的四阶段 R1 配方以及 R1-Zero ablation──
- [Brown et al. (2019). Superhuman AI for multiplayer poker (Pluribus)](https://www.science.org/doi/10.1126/science.aay2400) Büyük çaplı CFR + derin öğrenme
- [Tesauro (1995). Temporal Difference Learning and TD-Gammon](https://dl.acm.org/doi/10.1145/203330.203343)Bu işin başından beri yazılıdır.
- [Hugging Face TRL — GRPOTrainer](https://huggingface.co/docs/trl/main/en/grpo_trainer) Kullanılır ödül fonksiyonları 应用 GRPO 的生产参考──
- [Qwen Team (2024). Qwen2.5-Math — GRPO replication](https://github.com/QwenLM/Qwen2.5-Math) R1 配方 için açıktı bir kopyalanma için çok sayıda ölçekle 
- [Sutton & Barto (2018). Ch. 17 — Frontiers of Reinforcement Learning](http://incompleteideas.net/book/RLbook2020.pdf)Öz oyun, araştırma ve R1 LLM ölçeğinde örneklenmiş önemlendirilmiş ödül  öğretim sınıfı çerçevesidir.
