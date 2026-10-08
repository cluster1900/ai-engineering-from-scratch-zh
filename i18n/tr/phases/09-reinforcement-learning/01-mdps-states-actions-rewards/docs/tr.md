# MDPs,Devletler, Eylemler ve Ödüller

> Markov Karar Verimleri 5 şeyden oluşur: devletler, eylemler, geçişler, ödüller, indirimler.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 1 · 06 (Probability & Distributions), Phase 2 · 01 (ML Taxonomy)
**Time:** ~45 minutes

## 问题

Bir satranç botunu ya da bir stok planlayıcısını ya da bir ticaret ajansı ya da bir mantık modeli PPO döngüsünü yazıyorsun dört farklı alan, ama şaşırtıcı bir gerçek var: hepsi aynı matematik nesneye denk geliyor.

Gözetimli öğrenme 给你 `(x, y)`Çiftler,并要求你适合一个函数──Reinforcement Learning doesn't give you labels, only gives you a string of states── your actions, as well as a scale reward── bu hareket 赢得了吗?

Formasyon öncesi, bu akıştan öğrenemezsiniz. Bu aşamada, son RLHF ve GRPO döngüleri de dahil olmak üzere, Markov Karar Süreci'ndedir. Bu formasyon, bu şekil üzerinde optimize edilmektedir.

## 概念

![Markov decision process: states, actions, transitions, rewards, discount](../assets/mdp.svg)

**五个对象。**

- **States** `S`◊Agent karar vermek için gereken her şeyi yapar. ◊ GridWorld'de, ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊    ◊ ◊ ◊  ◊      ◊ ◊      ◊                        
- **Actions** `A`△可选行为──上/下/左/右移动──下一步棋──输出一个代币──
- **Transitions** `P(s' | s, a)`❖ belirlenmiş bir durum`s`Hüküm ve eylem`a`,sonraki devletin dağılımı── satrançta ortalama belirleyici, envanterde stohastı, LLM'de neredeyse belirleyici──
- **Rewards** `R(s, a, s')` 标量信号──赢 = +1,输 = -1── gelir azaltma maliyeti──GRPO'nun log- olasılık oranı 项──
- **Discount** `γ ∈ [0, 1)`Gelecek ödülü, mevcut ödülün ağırlığıyla karşılaştırıldığında.`γ = 0.99`买到约100 adım ufuk;`γ = 0.9`10'a kadar aldım.

**Markov property** `P(s_{t+1} | s_t, a_t) = P(s_{t+1} | s_0, a_0, …, s_t, a_t)`Gelecek sadece mevcut devlete bağlıdır. Eğer oluşmazsa, devlet temsilinin eksik olduğunu gösterir.

**Policies 与 returns。**Politikası `π(a | s)`映射到动作分布──返回 `G_t = r_t + γ r_{t+1} + γ² r_{t+2} + …`Evet, gelecek ödüllerin indirimli miktarı.`V^π(s) = E[G_t | s_t = s]`Politikada.`π`Aşağıdan`s`开始的预期回报──Q-value `Q^π(s, a) = E[G_t | s_t = s, a_t = a]`Bu iki işlemin birincil olarak gerçekleşmesi için RL algoritması bu iki işlemin birincil olarak gerçekleşmesi için birincil olarak değişmesi gerekir.`π`- Evet.

**Bellman equations。**Bu aşamada tüm içerikler sabit nokta denklemleri kullanılacak:

`V^π(s) = Σ_a π(a|s) Σ_{s', r} P(s', r | s, a) [r + γ V^π(s')]`
`Q^π(s, a) = Σ_{s', r} P(s', r | s, a) [r + γ Σ_{a'} π(a'|s') Q^π(s', a')]`

Bu aşamada beklenen getiriyi                                                                                                                                                                                                                                                            


```figure
discount-horizon
```

## Yapın

### Adım 1: Bir çok küçük belirleyici MDP

Bir 4×4 GridWorld──Agent sol üst köşeden başlıyor, terminal sağ alt köşeden, her adım ödülü -1, eylemler -`{up, down, left, right}`Görüyorum.`code/main.py`- Evet.

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

五行──这是完整环境──deterministik geçişler、恒定步骤惩罚、吸收终端状态──

### Adım 2: Bir politika oluştur

Politika, devletten eylem dağılımına kadar olan işlevi. En basit, bir düz rastlantıdır.

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

运行随机政策 1000次──这个4×4板的平均回报 大约是 -60到 -80──最佳回报是 -6(沿直线路径向下再向右)──缩小这个差距,就是9期的全部内容──

### Adım 3: Bellman denkleminden 精确计算 `V^π`

Küçük MDP'ler için, Bellman denklemi bir çizgidir.

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

Bu, Sutton & Barto'nun ilk algoritmasıdır ve her RL yöntemi'nin teorik temelidir.

### Dördüncü adım:`γ`Fiziksel anlamı olan bir hiperparametre

Etkili ufuk yaklaşık olarak `1 / (1 - γ)`- Evet.`γ = 0.9`→ 10 adım.`γ = 0.99`→ 100 adım.`γ = 0.999`→ 1000 adım.

太低时,代理会目光短浅──太高时,kredit atanımı 会变噪, çünkü birçok erken adım şehirler birlikte uzak gelecek ödül sorumluluğunu üstlenecektir──LLM RLHF genellikle kullanılır `γ = 1`,因为 episodes 短且有界──Control tasks 使用 `0.95–0.99`❖ Uzun vadede strateji oyunları`0.999`- Evet.

## 陷

- **Non-Markovian state.**Eğer son üç gözlem gereksinim varsa 才能决策, state 不只是当前观察──修复:stack frames (DQN 在 Atari 上堆叠 4 ) 或使用复制状态 (→ tekrarlayıcı durum)
- **Sparse rewards.**Sadece kazançlı bir ödül verirseniz, büyük devlet alanlarında öğrenmek neredeyse imkansız olacaktır.
- **Reward hacking.**优化代理奖励 经常产生病态行为──OpenAI'nin tekne yarış ajanı 一直原地转圈收集 powerups,而不是完成比赛──始终从目标结果定义奖励,而不是从代理定义──
- **Discount mis-spec.**Enfine ufuk görevi 上使用 `γ = 1`Her değerin sonsuz olmasına izin ver.`γ < 1`Sınırlama.
- **Reward scale.**{+100, -100} ile {+1, -1} ödülleri aynı optimal politikalar verecektir, ama Gradient büyüklüğü 会 çok farklı olacaktır.`[-1, 1]`- Evet.

## Kullan

2026 yılının yığınları bir MDP'ye dönüştürülmeden önce, her RL borusunu bir MDP'ye dönüştürün:

| Situation | State | Action | Reward | γ |
|-----------|-------|--------|--------|---|
| Control（locomotion, manipulation） | Joint angles + velocities | Continuous torques | Task-specific shaped | 0.99 |
| Games（chess, Go, poker） | Board + history | Legal move | Win=+1 / loss=-1 | 1.0（finite） |
| Inventory / pricing | Stock + demand | Order qty | Revenue - cost | 0.95 |
| RLHF for LLMs | Context tokens | Next token | Reward-model score at end | 1.0（episode ~200 tokens） |
| GRPO for reasoning | Prompt + partial response | Next token | Verifier 0/1 at end | 1.0 |

Bu yüzden, bu yazıyı yazmadan önce, bu 5 bin gruptan önce yazın.

## Gönder

保存为 `outputs/skill-mdp-modeler.md`- ...

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

## 练习

1. **Easy.**- Evet .`code/main.py`Ortalama 4×4 GridWorld ve rastgele politika dağıtımını gerçekleştirmek, 10 bin bölümden oluşmak, rapor geri dönüşünün ortalaması ve en iyi geri dönüşü ile karşılaştırmak.
2. **Medium.**Üniformal rastgele politika, kullanımı`γ ∈ {0.5, 0.9, 0.99}`运行  İşlem`policy_evaluation`- Her birini.`V`4×4 şebekesi için basın. Terminal'in değerleri giderek daha büyük olur.`γ`Daha hızlı büyümüştür.
3. **Hard.**GridWorld'ı stokastik olarak değiştirmek: her eylem için olasılık`p = 0.1`滑向相邻方向── yeniden değerlendirme`V[start]`- İyi mi yoksa kötü mi olacak?

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

- [Sutton & Barto (2018). Reinforcement Learning: An Introduction, 2nd ed.](http://incompleteideas.net/book/RLbook2020.pdf) 教科書。第 3 章介绍 MDPs 和 Bellman denklemleri;第 1 章 Ödül hipotezi önerir, it支后续每一课──
- [Bellman (1957). Dynamic Programming](https://press.princeton.edu/books/paperback/9780691146683/dynamic-programming) Bellman denkleminin kaynağı:
- [OpenAI Spinning Up — Part 1: Key Concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html) Deep-RL 角度写的简洁 MDP primer──
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887)  MDP ve tam çözüm yöntemleri hakkında operasyon-kaliplik 参考書。
- [Littman (1996). Algorithms for Sequential Decision Making (PhD thesis)](https://www.cs.rutgers.edu/~mlittman/papers/thesis-main.pdf) MDP'leri  dinamik programlama özellikleri olarak tanımlamak 
