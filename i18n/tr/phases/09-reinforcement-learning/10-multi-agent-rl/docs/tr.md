# Çoklu ajanlı RL

> Tek ajan RL 假设环境是静止的──把两个学习的代理 放进同一个世界,这个假设就会失效:每个代理都是另一个代理 环境的一部分,而且两者都在变化──多代理 RL 是一组让学习在马科夫假设中不复成立时仍能收取技巧──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (Q-learning), Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~45 minutes

## 问题

Bir robot öğrenmek bir oda içinde yolculuk, tek ajan RL  sorunları。 bir futbol takımı ∼∼ AlphaStar karşı savaş StarCraft karşı karşılaşma ∼ bir pazar ∼ Bici ajanları tarafından oluşturulmuş ∼ bir pazar ∼ ∼ iki araç da dört yönli otobanı geçiyor ∼ birçok gerçek sorunlar ∼ ∼

Her bir çok ajan ortamında, herhangi bir ajanın bakış açısından, diğer ajanlar *就是* çevrenin bir parçasıdır. Onlar öğrenirken ve kendi davranışlarını değiştirirken, çevre sabit olmaya başlar. Markov'un mülkiyeti next state only depends on current state 和我的 action will be violated, because the next state also depends on* other* agents  chose what, while their policies are constantly changing objectives──

Bu, tablolar birleştirme kanıtlarını bozacaktır. Bu da, akılsızca derin RL'yi bozacaktır.

2026 yılının uygulamaları arasında: robot sürüleri, trafik yönlendirme, otonom araç filosları, pazar simülatörleri, çoklu ajanlı LLM sistemleri (Fase 16) ve çok sayıda akıllı oyuncu olan oyunlar yer alır.

## 概念

![Four MARL regimes: indep, centralized critic, self-play, league](../assets/marl.svg)

**Formalism: Markov Game.**MDP'nin genelleşmesi: Devletler`S`、birlikte hareket`a = (a_1, …, a_n)`Değişiklik`P(s' | s, a)`, ve her ajanın ödülleri .`R_i(s, a, s')`❖ Her ajan `i`Kendi politikasındadır .`π_i`Eğer ödüller tamamen aynısa, bu da...**fully cooperative**Eğer sıfır toplam ise, bu da **adversarial** If mixed, 则是**general-sum**- Evet.

**核心挑战：**

- **Non-stationarity.**Ajanın yanında .`i`Bu bakış açısından,`P(s' | s, a_i)`取決于`π_{-i}`Ama değişmeye başladı.
- **Credit assignment.**Paylaşılan ödülde, hangi ajan buna yol açtı?
- **Exploration coordination.**Ajanlar aynı devleti tekrar araştırmak yerine karşılıklı bir strateji keşfetmeliler.
- **Scalability.**Ortak eylem alanı 会随 `n`İndeksi seviyesi büyüme
- **Partial observability.**Her ajan sadece kendi gözlemlerini görebilir; küresel durum gizli.

**四种主导范式：**

**1. Independent Q-learning / independent PPO (IQL, IPPO).**Her ajan kendi Q veya politikasını öğrenir, diğer ajanları bir çevrenin parçası yapar. 简单,有时有效,特别是经验重播 作为一种平滑的代理-model 技巧时) 理论收性:没有.

**2. Centralized training, decentralized execution (CTDE).**Her ajanın kendi politikası var.`π_i`Yerel gözlemle yapılıyor.`o_i`Bu, standartların merkezi olmayan yürütülmesidir.`Q(s, a_1, …, a_n)`Bu durumun bir bütün olarak gerçekleşmesi ve ortak eylemlerin koşulları:
- **MADDPG**(Lowe et al. 2017): 带有每个代理 一个集中批评的DDPG──
- **COMA**(Foerster et al. 2017): karşı gerçekli bir temel 问`a'`Benim ödülüm ne kadar olacak?
- **MAPPO**- Ne ?**IPPO**ortak eleştirmenle (Yu et al. 2022): 带有集中价值函数的 PPO──2026年合作社 MARL 中的主导方法──
- **QMIX**(Rashid et al. 2018): değer parçalanması`Q_tot(s, a) = f(Q_1(s, a_1), …, Q_n(s, a_n))`,并使用单调混合──

**3. Self-play.**Aynı ajanın iki kopyası birbirine karşı savaşmaktadır. Karşılıklı politika *就是*我过去某瞬间中的政策──AlphaGo / AlphaZero / MuZero──OpenAI Five── en uygun sıfır toplam oyunları; eğitim sinyali ise对称的──

**4. League play.**kendi oyunları genel toplam / rakip ortamların genişlemesi: bir grup geçmiş ve mevcut politikaları, ligden birtakım rakipleri, ve onlara yönelik eğitimleri;

**Communication.**允许 agents 相互发送学会的信息 `m_i` Kooperatif ortamlarda 中有效──Foerster et al. (2016) ⇒ Farklı ajanlar arası iletişimin sonuna kadar eğitim edilebileceğini göstermektedir── bugün LLM'nin çok ajanlı sistemlerine dayalı olan ""16 aşama"" aslında doğal dil iletişiminde kullanılmıştır──


```figure
f3-marl-orbit
```

## Yapın onu.

Bu ders, 6×6 GridWorld'ı kullanıyor, iki işbirliği ajanı içerir.`-1`İki tarafı da var .`+10`参见 `code/main.py`- Evet.

### 步骤 1: çoklu ajan ortamı

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

*Köşel* eylem alanı `|A|² = 16`❖ Küresel durum iki konumdadır.

### 步骤 2: bağımsız Q öğrenimi

Her ajan kendi Q-tablosunu yürütür, ortak bir devlet olarak anahtar olarak kullanır.

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

Bu görevde etkili, çünkü ödüller yoğun ve hazırdır. Yakından ilişkili görevlerde başarısız olur. Örneğin, bir ajanın diğer ajanın görevini beklemesi gerekir.

### 步骤3: merkezi Q ile parçalanmış değer güncelleme

Birlikte yapılan eylemlere bir Q kullanın:`Q(s, a_1, a_2)` Paylaşılan ödüllerle 更新──执行时通过边缘化来分散化:`π_i(s) = argmax_{a_i} max_{a_{-i}} Q(s, a_1, a_2)`️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️  ️  ️   ️                                                        

### 步骤 4: 简单 kendi oyun

Aynı ajan, iki rol. Eğitim ajanı A.`K`个集,把 A'nın ağırlıkları 复制到 B──对称训练,进展一致──AlphaZero reçetesinin küçültülmüş versiyonu──

## 常见陷

- **Non-stationary replay.**Özgür ajanlar kullanırken, Tek ajanlardan daha kötü deneyime sahip olmak daha da kötüdür, çünkü eski geçişler artık geçmişte olan rakipler tarafından yapılır.
- **Credit assignment ambiguity.**长 后得到共享奖励;没有明确方式说明哪个代理做出贡献──修复:counterfactual baselines(COMA),或按代理做奖励塑造──
- **Policy drift / chasing.**Her ajanın en iyi tepkisi, diğer ajanın güncelleşmesi ve değişimiyle değişir.
- **Reward hacking via coordination.**Ajanlar 找到了设计者没有预期到的协调的exploits──拍卖代理会收到报价零──修复:谨慎的奖励设计、行为限制──
- **Exploration redundancy.**两个代理 探索相同的状态-action pairs──修复: Her bir ajan Entropy bonusu kullan,或角色条件──
- **League cycles.**純自遊可能卡在支配周期 中──修复:使用包含多样对手的联赛比赛──
- **Sample explosion.** `n`个 agent × devlet alanı × ortak eylemler。用函数近似;使用因数化行动空间(每个 agent 一个政策输出头)。

## Kullan

2026 yıl MARL 应用图谱:

| Domain | Method | Notes |
|--------|--------|-------|
| Cooperative navigation / manipulation | MAPPO / QMIX | CTDE；shared critic + decentralized actors。 |
| Two-player games (chess, Go, poker) | Self-play with MCTS (AlphaZero) | Zero-sum；对称训练。 |
| Complex multiplayer (Dota, StarCraft) | League play + imitation pretraining | OpenAI Five, AlphaStar。 |
| Autonomous-vehicle fleets | CTDE MAPPO / PPO with attention | Partial obs；可变 team sizes。 |
| Auction markets | Game-theoretic equilibrium + RL | 当 `n` → ∞ 时使用 mean-field RL。 |
| LLM multi-agent systems (Phase 16) | Natural-language comm + role conditioning | RL loop 位于 agent-planning layer。 |

2026 yılında, MARL'in en büyük büyüme alanı LLM'nin sistemine dayanmaktadır: Dil modelleri temsilcileri tarafından oluşturulan gruplar tarafından müzakere edilmektedir, tartışmalar yapılır ve yazılım inşa edilir.

## - Söyle.

保存为 `outputs/skill-marl-architect.md`- ...

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

## 练习

1. **Easy.**İki ajanlı kooperatif GridWorld 上 eğitim bağımsız Q-öğrenme.
2. **Medium.**Kordinasyon  Görev: Sadece iki ajan aynı dönemde hedeflerine ulaştığında, Kütle Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü Köçü
3. **Hard.**MAPPO tarzı eğitiminin merkezi bir eleştirisini gerçekleştirmek ve koordinasyon görevini üst düzey bağımsız PPO ile karşılaştırarak dönüşüm hızı oluşturmak.

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

- [Lowe et al. (2017). Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments (MADDPG)](https://arxiv.org/abs/1706.02275) 带集中批判的CTDE──
- [Foerster et al. (2017). Counterfactual Multi-Agent Policy Gradients (COMA)](https://arxiv.org/abs/1705.08926) kredi tahsisinin karşı gerçekli baz hatları kullanılmıştır。
- [Rashid et al. (2018). QMIX: Monotonic Value Function Factorisation](https://arxiv.org/abs/1803.11485) 带 monotonity'nin değer dağılımı。
- [Yu et al. (2022). The Surprising Effectiveness of PPO in Cooperative Multi-Agent Games (MAPPO)](https://arxiv.org/abs/2103.01955) PPO Marl için insan istekleri için güçlü.
- [Vinyals et al. (2019). Grandmaster level in StarCraft II using multi-agent reinforcement learning (AlphaStar)](https://www.nature.com/articles/s41586-019-1724-z)Büyük bir lig oyunu.
- [Silver et al. (2017). Mastering the game of Go without human knowledge (AlphaGo Zero)](https://www.nature.com/articles/nature24270) sıfır toplam oyunları 中的纯自动游戏──
- [Sutton & Barto (2018). Ch. 15 — Neuroscience & Ch. 17 — Frontiers](http://incompleteideas.net/book/RLbook2020.pdf)  包含教材对多代理设置和非站立性问题的简短处理, CTDE ise bu sorunu çözmek için tasarlanmıştır.
- [Zhang, Yang & Başar (2021). Multi-Agent Reinforcement Learning: A Selective Overview](https://arxiv.org/abs/1911.10635) 覆盖合作,竞争和混合 MARL ve dönüşüm sonuçlarının genel tarifi
