# Dinamik Programlama  Politika İterasyonu & Değer İterasyonu

> Dinamik programlama RL'nin bir parçası. Sen geçiş ve ödül fonksiyonlarını biliyorsun.`V`Ya da`π`Sürekli değişim. Her örnekleme tabanlı yöntemin temeline yaklaşmaya çalışması.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs)
**Time:** ~75 minutes

## 问题

Bilinen bir modeliniz var . Herhangi bir devlet eylem çiftini sorabilirsiniz .`P(s' | s, a)`和 `R(s, a, s')`△ stok yöneticisi ihtiyaç dağılımını bilir △棋盘 oyunları kesin geçişler vardır △ GridWorld sadece dört satır Python gerekir △ bir *model* vardır △

Modelsiz RL ((Q-öğrenme、PPO、REINFORCE) modelsiz bir durum için ortaya çıkarılmıştır, yani sadece ortamdan örnek alabilirsiniz. Ancak modeliniz olduğunda, daha hızlı ve daha iyi bir yöntem vardır: dinamik programlama. Bellman 1957 yılında bu yöntemleri tasarladı.

2026 yılında yine de ihtiyaç duyarsınız, çünkü üç nokta vardır. İlk olarak, RL araştırmasında her tablo ortamında (GridWorld, FrozenLake, CliffWalking) altın standart politikaları oluşturmak için DP'yi kullanmak için çözümler bulmaya çalışılır.`V*(s_0)`%30 oranında fark var. Q öğrenme konusunda hata var.

## 概念

![Policy iteration and value iteration, side by side](../assets/dp.svg)

**两个算法，都是 Bellman 上的 fixed-point iteration。**

**Policy iteration。**Politikası değişene kadar iki adım yerine getirmek.

1. *Değerlendirme:* 给定 politikası `π`,反复应用 `V(s) ← Σ_a π(a|s) Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`, hadi kabul edelim, böylece hesap edelim.`V^π`- Evet.
2. *Yenileştirme:* 给定 `V^π`,让 `π`                `V^π`变为 açgözlülük:`π(s) ← argmax_a Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`- Evet.

- Bu garantili bir şey. Çünkü her gelişme adımını tutmak zorundasın.`π`Değişmez, ya da ciddi bir şekilde bazı devletlerin yükseltmesi `V^π`,(b) Deterministik politikaların alanı sınırlıdır. Büyük devlet alanlarında bile genellikle yaklaşık 520 kez dış iterasyonlarda gerçekleşir.

**Value iteration。**Bu değerlendirme ve geliştirme bir kez süpürülmüştür. Bellman *optimallık* denklemini uygula:

`V(s) ← max_a Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`

Tekrar tekrar `max_s |V_{new}(s) - V(s)| < ε`❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖  ❖ ❖    ❖ ❖          ❖ ❖                                                                                                 

**Generalized policy iteration (GPI)。**统一视角──Değer fonksiyonu 和 politikası iki yönlü bir geliştirme döngüsünde kilitlenir; herhangi bir zamanda iki yönlü birbirine uyumlu bir yöntem geliştirir.

**为什么 `γ < 1` 很重要。**Bellman operatörü, "Sup-Norma"nın altında.`γ`-Küçükleşme:`||T V - T V'||_∞ ≤ γ ||V - V'||_∞`◊Kontaksiyon tek sabit noktayı ifade eder 和几何收──`γ < 1`, sen zaten güvence kaybetti, sınırlı ufuk veya emekleme terminal durumu gerekir.

## 动手构建

### Adım 1: GridWorld MDP modeli oluştur

Uygulayacağız aynı 4×4 GridWorld'ı.`0.1`                                                                                                                                                                                                                                                              

```python
SLIP = 0.1

def transitions(state, action):
    if state == TERMINAL:
        return [(state, 0.0, 1.0)]
    outcomes = []
    for direction, prob in action_probs(action):
        outcomes.append((apply_move(state, direction), -1.0, prob))
    return outcomes
```

`transitions(s, a)`Geri dön .`(s', r, p)`Bu, tüm model.

### Adım 2: Politika değerlendirme

给定政策 `π(s) = {action: prob}`Bellman denklemini,`V`İçeğişmez:

```python
def policy_evaluation(policy, gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in states()}
    while True:
        delta = 0.0
        for s in states():
            v = sum(pi_a * sum(p * (r + gamma * V[s_prime])
                              for s_prime, r, p in transitions(s, a))
                   for a, pi_a in policy(s).items())
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            return V
```

### Adım 3: Politikayı iyileştirmek

Üz karşı karşı`V`Açgözlülük politikası                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `π` `π`Değişiklik yok, geri dön, çünkü en iyisine ulaştık.

```python
def policy_improvement(V, gamma=0.99):
    new_policy = {}
    for s in states():
        best_a = max(
            ACTIONS,
            key=lambda a: sum(p * (r + gamma * V[s_prime])
                              for s_prime, r, p in transitions(s, a)),
        )
        new_policy[s] = best_a
    return new_policy
```

### Dördüncü adım:

```python
def policy_iteration(gamma=0.99):
    policy = {s: "up" for s in states()}   # arbitrary start
    for _ in range(100):
        V = policy_evaluation(lambda s: {policy[s]: 1.0}, gamma)
        new_policy = policy_improvement(V, gamma)
        if new_policy == policy:
            return V, policy
        policy = new_policy
```

4×4 上典型会在 46次外回复内收──输出 `V*(0,0) ≈ -6`Bu, bir sonraki yıllarda da gerçekleşecek.

### Adım 5: değer iteraasyonu(单 loop 版本)

```python
def value_iteration(gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in states()}
    while True:
        delta = 0.0
        for s in states():
            v = max(sum(p * (r + gamma * V[s_prime])
                       for s_prime, r, p in transitions(s, a))
                   for a in ACTIONS)
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            break
    policy = policy_improvement(V, gamma)
    return V, policy
```

Aynı sabit nokta, daha az kod sayısı.

## 常见陷

- **忘记处理 terminals。**Eğer Bellman'ı uygulayacaksanız, en iyi hareketini değiştirmeyecek bir şey elde edecektir.`if s == terminal: V[s] = 0`防护。
- **Sup-norm vs L2 convergence。**Kullanım`max |V_new - V|`, ortalama değeri kullanmayın. Teorik güvence sup-norm üstedir.
- **In-place vs synchronous updates。**Yenilemeler`V[s]`(Gauss-Seidel)`V_new`Dict(Jacobi)收更快──Prodüksiyon kodu
- **Policy ties。**Eğer iki eylem aynı Q değeri varsa,`argmax`Bu, politikayı sabitleştirmek için bir düzenleme yapılması için kullanılır.
- **State-space explosion。**DP her seferinde süpürürür.`O(|S| · |A|)`◊ en fazla 107 eyalette kullanılabilir. ◊ bu ölçekten fazla, fonksiyon yaklaşımına ihtiyacınız var.


```figure
value-iteration-gamma
```

## Kullan

2026 yılında, DP doğru bir temel oluşturur ve planlamacıların da iç döngüsüdür:

| Use case | Method |
|----------|--------|
| 精确求解小型 tabular MDP | Value iteration（更简单）或 policy iteration（outer steps 更少） |
| 验证 Q-learning / PPO 实现 | 在 toy environment 上与 DP-optimal V* 对比 |
| Model-based RL（Phase 9 · 10） | 在 learned transition model 上做 Bellman backup |
| AlphaZero / MuZero 中的 Planning | Monte Carlo Tree Search = async Bellman backup |
| Offline RL（CQL、IQL） | Conservative Q-iteration，即带有 OOD actions penalty 的 DP |

Herkesin söylediği en iyi değer fonksiyonu, DP sabit noktasını ifade ediyor.`V*`Ya da`Q*`Bu döngüyü düşünün.

## - Söyle.

保存为 `outputs/skill-dp-solver.md`- ...

```markdown
---
name: dp-solver
description: 通过 policy iteration 或 value iteration 精确求解小型 tabular MDP。报告收敛行为。
version: 1.0.0
phase: 9
lesson: 2
tags: [rl, dynamic-programming, bellman]
---

给定一个已知 model 的 MDP，输出：

1. 选择。Policy iteration vs value iteration。理由需关联 |S|、|A|、γ。
2. 初始化。V_0、starting policy。Convergence sensitivity。
3. 停止条件。Sup-norm tolerance ε。预期 sweeps 数。
4. 验证。精确计算的 V*(s_0)。提取出的 Greedy policy。
5. 使用方式。这个 baseline 将如何用于 debug/evaluate sampling-based methods。

拒绝在 state spaces > 10⁷ 上运行 DP。没有 sup-norm check 时，拒绝声称收敛。将 infinite-horizon task 上任何 γ ≥ 1 标记为 guarantee violation。
```

## 练习

1. **Easy.**4×4 GridWorld'de kullanılıyor.`γ ∈ {0.9, 0.99}`运行 değer iteraasyonu──直到 `max |ΔV| < 1e-6`Ne kadar süpürme gerekiyor?`V*`4×4 şebekesi için basıldı.
2. **Medium.***Stochastic* GridWorld'de *Slip olasılığı`0.1`) 上比较政策 반복 和 değer iteration──统计:sweeps、壁-saat zamanı、最终 `V*(0,0)`Hangi sürümler daha hızlı?
3. **Hard.**构建修改政策反复:在评估阶段 中,只运行 `k`Bir sonraki tarama, yerine bir sonraki tarama.`k ∈ {1, 2, 5, 10, 50}`Çizim`V*(0,0)`hata vs `k`Bu eğri size değerlendirme/iyileştirme anlaşmasının ne olduğunu söyler mi?

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Policy iteration | “DP algorithm” | 交替进行 evaluation（`V^π`）和 improvement（相对于 `V^π` 的 greedy `π`），直到 policy 不再变化。 |
| Value iteration | “Faster DP” | Bellman optimality backup 在一次 sweep 中应用；几何收敛到 `V*`。 |
| Bellman operator | “The recursion” | `(T V)(s) = max_a Σ P (r + γ V(s'))`；sup-norm 下的 `γ`-contraction。 |
| Contraction | “Why DP converges” | 任何满足 `\|\|T x - T y\|\| ≤ γ \|\|x - y\|\|` 的 operator `T` 都有唯一 fixed point。 |
| GPI | “Everything is DP” | Generalized Policy Iteration：任何推动 `V` 和 `π` 达到相互一致的方法。 |
| Synchronous update | “Jacobi-style” | 在一次 sweep 中始终使用旧的 `V`；便于清晰分析，但更慢。 |
| In-place update | “Gauss-Seidel-style” | 使用正在被更新的 `V`；实践中收敛更快。 |

## 延伸阅读

- [Sutton & Barto (2018). Ch. 4 — Dynamic Programming](http://incompleteideas.net/book/RLbook2020.pdf) politika iterasyonu 和 değer iterasyonu klasik sunumu
- [Bertsekas (2019). Reinforcement Learning and Optimal Control](http://www.athenasc.com/rlbook.html) 论证对缩绘的严谨处理──
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887) modifi politikayı tekrarlama  ve onun yakınlaştırma analizi¬si¬n¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- [Howard (1960). Dynamic Programming and Markov Processes](https://mitpress.mit.edu/9780262582300/dynamic-programming-and-markov-processes/) 原始的政策回复文件──
- [Bertsekas & Tsitsiklis (1996). Neuro-Dynamic Programming](http://www.athenasc.com/ndpbook.html) DP'den yaklaşık DP/ derin RL'nin köprülerine kadar, sonraki her bölümde ders kullanılır.
