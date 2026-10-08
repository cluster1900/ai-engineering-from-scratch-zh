# Zaman Farkı  Q-Learning & SARSA

> Monte Carlo 会一直等到集 结束──TD 通过 bootstrap 下一个价值估计,在每一步后更新──Q-learning is off-policy 且偏乐观;SARSA is on-policy 且偏谨慎──两者都只是一行代码──两者也支着本阶段中的每种深度RL 方法──

**Type:** Build
**Languages:** Python
**前置要求:**9. · 01 aşaması (MDP), 9. · 02 aşaması (Dinamik Programlama), 9. · 03 aşaması (Monte Carlo)
**Time:** ~75 minutes

## 问题

Monte Carlo yapılabilir, ama iki yüksek fiyatlı talebi vardır. Son bölümleri bitirmelidir ve sadece son dönüşte ızdırabilir. Eğer bölümünüz 1000 adım varsa, MC'nin 1000 adım beklemesi gerekir.

Dinamik programlama 则相反:零方差的 bootstrapped backups,但要求已知模型──

Zaman farkı (TD) öğrenme 折中了两者──根据单个过渡 `(s, a, r, s')`Bir adımlı bir hedef oluştur .`r + γ V(s')`,并把 `V(s)`朝它推近──不需要模型──不需要完整的集──由于在RHS上使用近似的`V`Bu, bir fark oluşturur, ancak fark MC'den çok daha düşüktür ve ilk adımdan beri çevrimiçi olarak güncellenir.

Bu tüm modern RL ((DQN、A2C、PPO、SAC) bağımlılıklılıklı支点。Fase 9 余下的内容,都在你将在本课中写的一步TD更新 之上叠加函数近似和技巧──

## 概念

![Q-learning vs SARSA: off-policy max vs on-policy Q(s', a')](../assets/td.svg)

**用于 V 的 TD(0) update：**

`V(s) ← V(s) + α [r + γ V(s') - V(s)]`

方括号中量是 TD hatası `δ = r + γ V(s') - V(s)`MC'de.`G_t - V(s_t)`Bu yüzden, bu konuda bir şey yapmamalıyız.`α`Robbins-Monro'nun tatmin edilmesi için.`Σ α = ∞`- Evet .`Σ α² < ∞`), ve tüm eyaletler ∞

**Q-learning。**Bir çeşit kontrol için kullanılan politika dışı TD  yöntemi:

`Q(s, a) ← Q(s, a) + α [r + γ max_{a'} Q(s', a') - Q(s, a)]`

`max`假设从 `s'`開始會遵循 *貪的政策,不管代理 实际采取了什么行动──这种解让Q-learning在代理 通过 ε-贪的探索时仍然学习`Q*`❖Mnih et al. (2015) bunu Atari 上'nin derin Q öğrenimi olarak dönüştürecek.

**SARSA。**Bir çeşit politika içi TD 方法:

`Q(s, a) ← Q(s, a) + α [r + γ Q(s', a') - Q(s, a)]`

Bu isim Tuple ' den geliyor .`(s, a, r, s', a')`◊SARSA Uygulama ajanı 下一步*实际* action `a'`Açgözlülükten ziyade .`argmax`                                                                                                                                                                                                                                                              `π`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `Q^π`Öte yandan .`ε → 0`Aşağıya döner.`Q*`- Evet.

**cliff-walking 的差异。**Klasik uçurum yürüyüşleri sırasında , (( düşmek uçurum = ödül -100), Q-öğrenme uçurum kenarında en iyi yolu öğrenir, ancak keşif sırasında bazen cezalandırılır.`ε → 0`Bu, uygulamada çok önemli bir şeydir: İşlem sırasında gerçekten de araştırmalar yapılıyor, SARSA'nın davranışları daha iyi korunmaktadır.

**Expected SARSA。**Kullan .`π`Aşağıdaki beklenmedik değer değişimi`Q(s', a')`- ...

`Q(s, a) ← Q(s, a) + α [r + γ Σ_{a'} π(a'|s') Q(s', a') - Q(s, a)]`

方差低于 SARSA(不对 `a'`采样), hedef aynı zamanda politika üzerinde.

**n-step TD 和 TD(λ)。**Bekleyip bekle.`n`步再 bootstrap,在 TD(0) 和 MC 之间插值──`n=1`Evet TD,`n=∞`Evet, çok önemli.`(1-λ)λ^{n-1}`Her şeye .`n`求平均── çoğu derin-RL kullanımı 3 ila 20   `n`- Evet.


```figure
qlearning-gridworld
```

## Yapın onu.

### 步骤 1: 基于 ε-cinsel politika 的 SARSA

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

八行── Q-öğrenme ile tek farkın hedefi olan o 八行──

### 步骤 2: Q öğrenme

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

`max`Bu bir işaret politikada ve politikadan uzakta olanların farkıdır.

### 步骤 3: Öğrenme eğri

Sonraki 100 bölümden ortalama dönüşü. Q-öğrenme.`code/main.py`4×4 GridWorld 中,两者在 `α=0.1, ε=0.1`Aşağıda, yaklaşık 2.000 bölüm var.

### 步骤 4: DP ile gerçek değer karşılaştır

运行 değer iterasyon(Dene 02) get `Q*`❖ Kontrol`max_{s,a} |Q_learned(s,a) - Q*(s,a)|`❖ Sağlıklı bir tablolar TD ajanı 4×4 GridWorld'da 10 bin bölümden sonra, 应落在`~0.5`İçinde.

## 陷

- **初始 Q values 很重要。**乐观初始化 负 任务中  负  ödül`Q = 0`Bu yüzden, bu, bir çok insanın hayatını değiştirmek için bir fırsat.
- **α schedule。**常数 `α`Düzsel olmayan sorunlar için de geçerlidir.`α_n = 1/n`Teorik olarak kabul edilebilir ama pratikte çok yavaş.`α`Düzgün`[0.05, 0.3]`,并监控 learning curve──
- **ε schedule。**# Başlamak için yüksek değeri #`ε=1.0`), düşüşe kadar `ε=0.05`"GELİ" (sırıncılık)
- **Q-learning 中的 max bias。**- Evet .`Q`Bir gürültü var.`max`Operatör 存在上偏差──会导致高估;Hasselt'in Double Q-learning(DQN Kullanım Praktiği Ders 05 中 DDQN 使用的做法) iki Q tabloyla 修复这个问题──
- **非终止 episodes。**TD, terminalsiz bir durumda öğrenebilir, ancak adım sayısını sınırlamak veya yukarıdaki sınırda doğru bir şekilde çalıştırmak gerekir.
- **State hashing。**Eğer durumlar tuples/tenzorlar ise kullanılabilir hash anahtarı ((tuple, list değil;四舍五入后的浮游图ple,不原浮游)

## Kullan

2026 yılındaki TD manzarası:

| Task | Method | Reason |
|------|--------|--------|
| 小型 tabular environments | Q-learning | 直接学习 optimal policy。 |
| On-policy safety-critical | SARSA / Expected SARSA | 探索期间更保守。 |
| High-dimensional state | DQN (Phase 9 · 05) | 带 replay 和 target net 的 Neural Network Q-function。 |
| Continuous actions | SAC / TD3 (Phase 9 · 07) | 在 Q-network 上做 TD update；policy net 发出 actions。 |
| LLM RL (reward-model-based) | PPO / GRPO (Phase 9 · 08, 12) | 使用通过 GAE 得到的 TD-style advantage 的 actor-critic。 |
| Offline RL | CQL / IQL (Phase 9 · 08) | 带 conservative regularization 的 Q-learning。 |

2026 yılında okuduklarınızda "RL" olarak bilinen dokuz kısım, Q-öğrenme veya SARSA'nın bir çeşit genişlemesidir.

## - Söyle.

保存为 `outputs/skill-td-agent.md`- ...

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

## 练习

1. **Easy。**4×4 GridWorld'da Q-öğrenmeyi ve SARSA'yı gerçekleştirmek için 2.000 bölüm öğrenme eğri çizmek için, her 100 bölümden ortalama geri dönüşü yapan kişi daha hızlı mı?
2. **Medium。**4×12, final line is cliff, reward -100 and reset to start point)  Compare Q-learning and SARSA's final policies──截图 show their respective traveled pathways── which one is closer to cliff?
3. **Hard。**实现双Q-学习──在噪音-reward GridWorld 上(给每步奖励 添加高斯噪音 σ=5),展示 Q-学习 会明显高估 `V*(0,0)`İki kez öğrenmek de olmaz.

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
- [Sutton & Barto (2018). Ch. 6 — Temporal-Difference Learning](http://incompleteideas.net/book/RLbook2020.pdf) TD(0) 、SARSA、Q-öğrenme、Beklenmiş SARSA。
- [Hasselt (2010). Double Q-learning](https://papers.nips.cc/paper_files/paper/2010/hash/091d584fced301b442654dd8c23b3fc9-Abstract.html) maksimizecilik önyargısı 
- [Seijen, Hasselt, Whiteson, Wiering (2009). A Theoretical and Empirical Analysis of Expected SARSA](https://ieeexplore.ieee.org/document/4927542) SARSA'nın beklenen hareketleri
- [Rummery & Niranjan (1994). On-line Q-learning using connectionist systems](https://www.researchgate.net/publication/2500611_On-Line_Q-Learning_Using_Connectionist_Systems) 创造 SARSA 这个术语的论文(O zamanlar "değiştirilmiş bağlantılı Q-öğrenme" olarak adlandırıldı)
- [Sutton & Barto (2018). Ch. 7 — n-step Bootstrapping](http://incompleteideas.net/book/RLbook2020.pdf) 将 TD(0) 泛化到 TD(n), bu, Q-öğrenme 走向资格的痕迹,以及后来 PPO 中 GAE 的路径──
