# Monte Carlo Metodları  Tam Bölümlerden Öğrenmek

> Dinamik programlama  model gerektirir──Monte Carlo bölümler dışında 什么都不需要──运行政策,观察返回,取平均──这是RL'deki en basit fikir,也是解锁后续一切的想法──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs), Phase 9 · 02 (Dynamic Programming)
**Time:** ~75 minutes

## 问题

Dinamik programlama çok güzel ama her devlete ve eylem sorgularına göre yapabileceğini varsayır.`P(s' | s, a)`△ gerçek dünyada neredeyse hiçbir şey böyle bir şekilde çalışmıyor. △ Robotlar ∞ çözemiyor ∞ hesaplamak ∞ ortak tortu ∞ kamera piksellerinin dağılımını ∞ fiyatlama algoritması ∞ her olası müşteri tepkisine ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ 

Çevreye bağlı bir yöntem gerekir.`s_0, a_0, r_1, s_1, a_1, r_2, …, s_T`- Bu Monte Carlo'nun değeri.

DP'den MC'ye dönüşümün bir fikri çok önemlidir: * bilinmiş modelden + tam yedekleme* 'den * örnekleme başlatma + ortalama geri dönüş*'ye doğru yönlendiriyoruz.

## 概念

![Monte Carlo: rollout, compute returns, average; first-visit vs every-visit](../assets/monte-carlo.svg)

**核心思想，一行表达：** `V^π(s) = E_π[G_t | s_t = s] ≈ (1/N) Σ_i G^{(i)}(s)`, içinden `G^{(i)}(s)`Politikada.`π`Aşağı ziyaret`s`之后观察到的回报──

**First-visit vs every-visit MC。**给定一个多次访问状态 `s`İlk ziyaret MC sadece ilk ziyaret sonrası geri dönüş; her ziyaret MC 统计所有访问──二者在极限下都是公正──初訪問更容易分析(iid örnekleri)──Her ziyaret Her bölüm daha fazla veriden yararlanır, pratikte genellikle daha hızlı olarak gelir──

**Incremental mean。**Tüm kaydetme, ancak yenileme çalışkan ortalama:

`V_n(s) = V_{n-1}(s) + (1/n) [G_n - V_{n-1}(s)]`

Şimdiki düzenleme:`V_new = V_old + α · (target - V_old)`, içinden `α = 1/n`- Evet.`1/n`换成常量 step size `α ∈ (0, 1)`Bir sabit olmayan MC tahmincisi var, takip eder.`π`Bu hareket MC'den TD'ye atlamak, her modern RL algoritmasının tüm anahtarlarına atlamak.

**Exploration 现在成了问题。**DP 通過枚举触及各州──MC sadece politika görecektir ziyaret edilen eyaletler──如果`π`Bu, bir deterministik, devlet alanı, tüm bölge asla örneklenmeyecek, değer tahminleri, tarihsel sırayla, ebediyen sıfırda kalmayacaktır.

1. **Exploring starts。**⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒    ⇒ ⇒       ⇒             ⇒                                                                                                                                                                     
2. **ε-greedy。**Öte yandan, daha fazla riskli bir davranışta bulunmak için.`ε`选择随机action── tüm devlet eylem çiftleri 逐渐近地 নমুনা olarak alınmıştır──
3. **Off-policy MC。**Davranış politikasında`μ`Aşağıdaki verileri toplamak, önemlilik örneği almak öğrenmek hedef politika `π`❖ Yüksek değişkenlik, ama bu DQN ve diğer tekrarlama tampon yöntemlerinin bir köprü.

**Monte Carlo Control。**Değerlendirme → geliştirme → değerlendirme,就像政策反复 一样,但评估是基于样本测试:

1. 运行  İşlem`π`Bir bölüm aldım.
2. Gözlemlere göre , yenilemeler`Q(s, a)`- Evet.
3. 让  `π`                `Q`变成 ε-cinsel.
4. Tekrarlıyorum.

Her çiftin sınırsız ziyaretleri vardır.`α`Robbins-Monro ' yu karşılamak için , 1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  `Q*`和 `π*`- Evet.

## 动手构建

### Adım 1: Çıkarım → (s, a, r) 列表

```python
def rollout(env, policy, max_steps=200):
    trajectory = []
    s = env.reset()
    for _ in range(max_steps):
        a = policy(s)
        s_next, r, done = env.step(s, a)
        trajectory.append((s, a, r))
        s = s_next
        if done:
            break
    return trajectory
```

- Modelle yok, sadece.`env.reset()`和 `env.step(s, a)`                                                                                                                                                                                                                                                              

### Adım 2: 计算 geri gönderir(反向扫)

```python
def returns_from(trajectory, gamma):
    returns = []
    G = 0.0
    for _, _, r in reversed(trajectory):
        G = r + gamma * G
        returns.append(G)
    return list(reversed(returns))
```

Bir kere geçiyor,`O(T)`❖ Geri dönüşe karşı`G_t = r_{t+1} + γ G_{t+1}`避免了重复求和──

### Adım 3: İlk ziyaret MC değerlendirme

```python
def mc_policy_evaluation(env, policy, episodes, gamma=0.99):
    V = defaultdict(float)
    counts = defaultdict(int)
    for _ in range(episodes):
        trajectory = rollout(env, policy)
        returns = returns_from(trajectory, gamma)
        seen = set()
        for t, ((s, _, _), G) in enumerate(zip(trajectory, returns)):
            if s in seen:
                continue
            seen.add(s)
            counts[s] += 1
            V[s] += (G - V[s]) / counts[s]
    return V
```

Gerçek çalışmaların sayısı üççe: İlk ziyaret sırasında işaret durumı

### Dördüncü adım: E-cinsel MC kontrol (politics)

```python
def mc_control(env, episodes, gamma=0.99, epsilon=0.1):
    Q = defaultdict(lambda: {a: 0.0 for a in ACTIONS})
    counts = defaultdict(lambda: {a: 0 for a in ACTIONS})

    def policy(s):
        if random() < epsilon:
            return choice(ACTIONS)
        return max(Q[s], key=Q[s].get)

    for _ in range(episodes):
        trajectory = rollout(env, policy)
        returns = returns_from(trajectory, gamma)
        seen = set()
        for (s, a, _), G in zip(trajectory, returns):
            if (s, a) in seen:
                continue
            seen.add((s, a))
            counts[s][a] += 1
            Q[s][a] += (G - Q[s][a]) / counts[s][a]
    return Q, policy
```

### Adım 5: DP Altın Standartı ile karşılaştırma

Bu arada, sen de...`V^π`MC'nin tahminleri  devrait avec DP sonuçları Lection 02 中 一致── pratikte: 4×4 GridWorld 上运行 50,000 bölüm, DP 答案相差差 `~0.1`- Evet.

## 常见陷

- **Infinite episodes。**MC'nin istekleri bölümleri, eğer politikası sonsuza dek kalırsa, ayarlayın.`max_steps`Yukarı sınır, gizli başarısızlıklara ulaştı.
- **Variance。**MC kullanın tam geri dönüşleri. Uzun bölümlerde, değişim  Büyük, son bir kez                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `V(s_0)`TD yöntemleri (Desin 04) ⇒Bootstrapping 降低这一点──
- **State coverage。**Yeni bir MC yapma. Eğer bağlar ortaya çıkarsa, sadece bir eylem yapmaya çalışırım.
- **Non-stationary policies。**Eğer `π`发生变化(如 MC kontrol 中那样), eski gelenler farklı politikalardan.
- **Off-policy importance sampling。**权重 `π(a|s)/μ(a|s)`连乘──Variance 会随地平线 爆炸──用 per-decision weighted IS 截断,或切换到 TD──


```figure
epsilon-greedy
```

## Kullan

Monte Carlo yöntemleri 2026 yılında rol:

| Use case | Why MC |
|----------|--------|
| Short-horizon games（blackjack、poker） | Episodes 自然 terminate；returns 清晰。 |
| Logged policy 的 offline evaluation | 对 stored trajectories 的 discounted returns 求平均。 |
| Monte Carlo Tree Search（AlphaZero） | 从 tree leaves 发起的 MC rollouts 指导 selection。 |
| LLM RL evaluation | 为给定 policy 计算 sampled completions 的 average reward。 |
| PPO 中的 baseline estimation | Advantage target `A_t = G_t - V(s_t)` 使用 MC `G_t`。 |
| RL 教学 | 最简单且真正有效的 algorithm；去掉 bootstrapping 就能看到核心。 |

现代 derin-RL algoritmaları PPO、SAC) 通過`n`-step return veya GAE, in pure MC(full returns) ve pure TD(one-step bootstrap) arasında插值──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

## - Söyle.

保存为 `outputs/skill-mc-evaluator.md`- ...

```markdown
---
name: mc-evaluator
description: 通过 Monte Carlo rollouts 评估 policy，并在可用时生成带有 DP-comparison 的 convergence report。
version: 1.0.0
phase: 9
lesson: 3
tags: [rl, monte-carlo, evaluation]
---

给定一个 environment（episodic，带 reset+step API）和一个 policy，输出：

1. 方法。First-visit vs every-visit MC。理由。
2. Episode budget。目标数量、variance diagnostic、预期 standard error。
3. Exploration plan。ε schedule（如需要）或 exploring starts。
4. Gold-standard comparison。如果是 tabular，则给出 DP-optimal V*；否则给出来自 Q-learning / PPO baseline 的 bound。
5. Termination check。Max-step cap、timeouts、non-terminating trajectories 的处理。

没有 finite horizon cap 时，拒绝在 non-episodic tasks 上运行 MC。对于 tabular tasks，如果每个 state 少于 100 个 episodes，拒绝报告 V^π estimates。将任何具有 zero-variance actions 的 policy 标记为 exploration risk。
```

## 练习

1. **Easy.**4×4 GridWorld 上 üniform-random politika ilk ziyaret MC değerlendirme gerçekleştirmek──运行 10,000 bölümleri──将 `V(0,0)` Bölüm sayısına göre  değişim eğilimi ve DP 答案对照绘制──
2. **Medium.**Kullan .`ε ∈ {0.01, 0.1, 0.3}`实现 ε-greedy MC control──比较20,000 bölüm 后的平均回报──曲線看起来是什么样?
3. **Hard.**Önemlilik örneklemesi 实现 *off-policy* MC:在统一随机政策 `μ`Aşağıda veriler toplamak, belirleyici en iyi politika tahminleri`π``V^π`◊Compared plain IS、per-decision IS 和 weighted IS── hangi varyansa en düşük?

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Monte Carlo | “Random sampling” | 通过对来自分布的 iid samples 求平均来估计 expectations。 |
| Return `G_t` | “Future reward” | 从 step `t` 到 episode 结束的 discounted rewards 总和：`Σ_{k≥0} γ^k r_{t+k+1}`。 |
| First-visit MC | “Count each state once” | 一个 episode 中只有第一次访问会贡献到 value estimate。 |
| Every-visit MC | “Use all visits” | 每次访问都会贡献；略有 biased，但 sample-efficient 更高。 |
| ε-greedy | “Exploration noise” | 以概率 `1-ε` 选择 greedy action；以概率 `ε` 选择 random action。 |
| Importance sampling | “Correcting for sampling from the wrong distribution” | 通过 `π(a\|s)/μ(a\|s)` 乘积对 returns 重新加权，从 `μ` 数据估计 `V^π`。 |
| On-policy | “Learn from my own data” | Target policy = behavior policy。Vanilla MC、PPO、SARSA。 |
| Off-policy | “Learn from someone else's data” | Target policy ≠ behavior policy。Importance-sampled MC、Q-learning、DQN。 |

## 延伸阅读

- [Sutton & Barto (2018). Ch. 5 — Monte Carlo Methods](http://incompleteideas.net/book/RLbook2020.pdf) 经典处理──
- [Singh & Sutton (1996). Reinforcement Learning with Replacing Eligibility Traces](https://link.springer.com/article/10.1007/BF00114726) İlk ziyaret karşı her ziyaret analizleri。
- [Precup, Sutton, Singh (2000). Eligibility Traces for Off-Policy Policy Evaluation](http://incompleteideas.net/papers/PSS-00.pdf) politika dışı MC 和 varyansa kontrolü
- [Mahmood et al. (2014). Weighted Importance Sampling for Off-Policy Learning](https://arxiv.org/abs/1404.6362) 现代 düşük değişkenlik IS tahmincileri。
- [Tesauro (1995). TD-Gammon, A Self-Teaching Backgammon Program](https://dl.acm.org/doi/10.1145/203330.203343)MC/TD kendi oyunları 收到超人游戏的首个大规模实证展示; ayrıca bu aşamada 后半部分每节课的概念先驱──
