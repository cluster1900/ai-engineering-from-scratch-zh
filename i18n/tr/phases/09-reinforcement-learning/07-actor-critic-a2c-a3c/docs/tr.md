# Aktör-Kritik  A2C ve A3C

> DİYİNİŞ  Çok gürültülü。添加一个学习 `V̂(s)`Bu, aktör-kritiklerin birbiriyle aynı ama farklılıkları olan daha az avantajı vardır. A2C aynı şekilde çalışır. A3C, birbiriyle aynı şekilde çalışır.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (TD Learning), Phase 9 · 06 (REINFORCE)
**Time:** ~75 分钟

## 问题

Vanilla REINFORCE 能工作, ama onun değişimi 很糟──Monte Carlo geri döner `G_t`Farklı bölümler arasında 10 kat daha fazla ses çıkartılabilir.`∇ log π`Yeniden ortalama olarak, bir Gradient tahmincisi üretilir. Politikayı daha az DQN güncellemeleri ile ilerletmek için binlerce bölüm gerekebilir.

Eğer bir temel değerini düşürürsen`b(s_t)`Bu, öğrenilen değer, beklenti 保持不变,而变化 会下降──最好的可处理的基线是 `V̂(s_t)`Şimdi de.`∇ log π`Bu miktarın önemi:

`A(s, a) = G - V̂(s)`

Eğer bir eylem  ortalama oranla yüksek bir getiri elde ederse, bu iyi olur; eğer ortalama oranla düşük ise, bu farklılıktan  öğrenilmiş eleştirmenlerin REINFORCE'si  *aktör eleştirmen*♦ eleştirmen  aktörlere düşük bir varyasyon öğretmeni  bu, 2015 yılından sonra her derin politika yöntemi  A2C、 A3C、 PPO、 SAC、 IMPALA) 

## 概念

![Actor-critic: policy net plus value net, TD residual as advantage](../assets/actor-critic.svg)

**两个 networks，一个 shared loss：**

- **Actor** `π_θ(a | s)`Politikası: Öz örneği, eylemlere katılacak Politik derecesi 
- **Critic** `V_φ(s)`: Devletten çıkış beklenen getiri tahminleri.`(V_φ(s) - target)²`訓練──

**Advantage。**两种标准形式:

- *MC avantajı:* `A_t = G_t - V_φ(s_t)`Tarafsızlık, değişim daha yüksek.
- *TD avantajı:* `A_t = r_{t+1} + γ V_φ(s_{t+1}) - V_φ(s_t)`△ tarafsız △ kullanımı`V_φ`),varians 低得多──也叫 *TD residual* `δ_t`- Evet.

**n-step advantage。**Arasındaki değer:

`A_t^{(n)} = r_{t+1} + γ r_{t+2} + … + γ^{n-1} r_{t+n} + γ^n V_φ(s_{t+n}) - V_φ(s_t)`

`n = 1`Tam bir TD.`n = ∞`MC. çoğu uygulama Atari 上使用`n = 5`, MuJoCo' nun PPO's üzerinde kullanımı `n = 2048`- Evet.

**Generalized Advantage Estimation (GAE)。**Schulman et al. (2016)  tüm n- adım avantajları için eksponansal olarak ağırlanan ortalama yapmayı önerdi:

`A_t^{GAE} = Σ_{l=0}^{∞} (γλ)^l δ_{t+l}`

İçlerinden `λ ∈ [0, 1]`- Evet.`λ = 0`Evet TD( düşük varyansa, yüksek önyargı)`λ = 1`Evet MC(yüksek farklılık, tarafsız)`λ = 0.95`Evet 2026 yılının öntanımlı değeri: devamlı düzenleme, tarafsızlık / değişkenlik diyalığı istediğiniz yere ulaşana kadar.

**A2C：synchronous advantage actor-critic。**- Evet .`N`个 paralel ortamlar 上收集 `T`adımlar──为每一步 计算优点──在组合批上更新演员 和评论──重复──这是A3C 更简单、更可扩展的兄弟姐妹──

**A3C：asynchronous advantage actor-critic。**Mnih et al. (2016)。启动 `N`个 worker threads,每个线程 运行一个环境――每个 worker 在自己的推出上本地计算梯度,然后异步 应用到共享参数服务器――不需要重复缓冲:workers 通过运行不同轨迹来去调解――A3C 证明了你可以在CPU上规模培训――到2026年,GPU-based A2C(batched parallel envs) 主导,因为GPUs 需要大批量――

**Combined loss。**

`L(θ, φ) = -E[ A_t · log π_θ(a_t | s_t) ]  +  c_v · E[(V_φ(s_t) - G_t)²]  -  c_e · E[H(π_θ(·|s_t))]`

Üç bölüm:Politika-gradyen kaybı,değer gerileme,entropik bonus`c_v ~ 0.5`- Evet.`c_e ~ 0.01`Bu kanonik başlangıç noktası.


```figure
actor-critic
```

## Yapın

### Adım 1: eleştirmen

Düzsel eleştirmen`V_φ(s) = w · features(s)`MSE 更新:

```python
def critic_update(w, x, target, lr):
    v_hat = dot(w, x)
    err = target - v_hat
    for j in range(len(w)):
        w[j] += lr * err * x[j]
    return v_hat
```

Tablo ortamında, eleştirmenler birkaç yüz bölümde oturdu. Atari'de, liner eleştirmenleri paylaşılmış CNN'in çekirdek + değer başlığına değiştirdi.

### Adım 2: N-adım avantajı

给定长度为 `T`Çıkış ve açılış finalı`V(s_T)`- ...

```python
def compute_advantages(rewards, values, gamma=0.99, lam=0.95, last_value=0.0):
    advantages = [0.0] * len(rewards)
    gae = 0.0
    for t in reversed(range(len(rewards))):
        next_v = values[t + 1] if t + 1 < len(values) else last_value
        delta = rewards[t] + gamma * next_v - values[t]
        gae = delta + gamma * lam * gae
        advantages[t] = gae
    returns = [a + v for a, v in zip(advantages, values)]
    return advantages, returns
```

`returns`Bu kritik hedef.`advantages`Evet.`∇ log π`İçeriği:

### Adım 3: birleşik güncelleme

```python
for step_i, (x, a, _r, probs) in enumerate(traj):
    adv = advantages[step_i]
    target_v = returns[step_i]

    # critic
    critic_update(w, x, target_v, lr_v)

    # actor
    for i in range(N_ACTIONS):
        grad_logpi = (1.0 if i == a else 0.0) - probs[i]
        for j in range(N_FEAT):
            theta[i][j] += lr_a * adv * grad_logpi * x[j]
```

Politikada, her güncelleme, bir rol, aktör ve eleştirmen,

### Adım 4: paralellik (A3C vs. A2C)

- **A3C：**Başlatma`N`个线程──每个线程──运行自己的env和自己的前进通行──周期性地把 Gradient updates 推送到共享 master──master 上不加锁:races 没关系,它们只是增加噪声──
- **A2C：**Tek bir süreçte çalışın.`N`个 env örnekleri, 把 gözlemler yığın 成 `[N, obs_dim]`Batch, Execute batched forward pass,batched backward pass,GPU utilization, 更高,deterministic,更容易推理,──2026年的默认选择,──

Oyuncak kodumuz, tek ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli bir ipli ipli bir ipli ipli bir ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ipli ip

## Tuzaklar

- **Critic bias before actor gradient。**Eğer eleştirmen rastgele ise, temel çizgisi bilgi miktarı olmamasıdır, ama sen saf gürültüdeyken eğitimli olursun. Önce eleştirmeni  birkaç yüz adım ısın, politika gradiyenti yeniden aç, ya da daha yavaş aktör öğrenme oranını kullan.
- **Advantage normalization。**Bu nedenle, bu programın en iyi yönleri, en iyi yönleri ve en iyi yönleri, en iyi yönleri ve en iyi yönleri ile, en iyi yönleri ve en iyi yönleri ile, en iyi yönleri ve en iyi yönleri ile, en iyi yönleri ile, en iyi yönleri ve en iyi yönleri ile, en iyi yönleri ile, en iyi yönleri ile, en iyi yönleri ile, en iyi yönleri ile, en iyi yönleri ile, en iyi yönleri ile, en iyi yönleri ile, en iyi yönleri ile, en iyi yönleri ile, en iyi yönleri ile, en iyi yönleri ile, en iyi yönleri ile, en iyi yönleri ile, en iyi yönleri ile, en iyi yönleri ile, en iyi yönleri ile, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde, en iyi şekilde,
- **Shared trunk。**Resim girişleri için, aktör ve eleştirmen için paylaşılan özellik çıkarıcı kullanın. Paylaşılan özellikler aynı anda iki kayıptan yararlanabilir.
- **On-policy contract。**A2C'nin veriyi doğrulamak için bir güncelleme kullanmak gerekir.
- **Entropy collapse。**Hiç .`c_e > 0`Politikası birkaç yüz kez güncelledi.
- **Reward scale。**Avantaj büyüklükleri ödül ölçeğine bağlıdır.Örn. ödülleri normalleştirmek için farklı görevler arasında uyumlu bir şekilde çalışmak için.

## Kullan

A2C/A3C 2026 yılında az sayıda son seçimdir, ancak tüm sonraki yapısal gelişmelerin temelidir:

| Method | Relation to A2C |
|--------|----------------|
| PPO | A2C + clipped importance ratio for multi-epoch updates |
| IMPALA | A3C + V-trace off-policy correction |
| SAC (Phase 9 · 07) | Off-policy A2C with a soft-value critic (next lesson) |
| GRPO (Phase 9 · 12) | A2C without the critic — group-relative advantage |
| DPO | A2C collapsed into a preference-ranking loss, no sampling |
| AlphaStar / OpenAI Five | A2C with league training + imitation pre-training |

2026'da bir kağıtın içinde avantaj görürsen, oyunculuğu eleştiren düşün.

## Gönder

保存为 `outputs/skill-actor-critic-trainer.md`- ...

```markdown
---
name: actor-critic-trainer
description: 为给定 environment 生成 A2C / A3C / GAE configuration，并指定 advantage estimation 和 loss weights。
version: 1.0.0
phase: 9
lesson: 7
tags: [rl, actor-critic, gae]
---

给定一个 environment 和 compute budget，输出：

1. Parallelism。A2C（GPU batched）vs A3C（CPU async）以及 workers 数量。
2. Rollout length T。每个 env 每次 update 的 steps。
3. Advantage estimator。n-step 或 GAE(λ)；指定 λ。
4. Loss weights。`c_v`（value）、`c_e`（entropy）、gradient clip。
5. Learning rates。Actor 和 critic（如果使用则分开）。

拒绝在 horizon > 1000 的 environments 上使用 single-worker A2C（太 on-policy，太慢）。拒绝在没有 advantage normalization 的情况下交付。把任何 `c_e = 0` 且 observed entropy < 0.1 的 run 标记为 entropy-collapsed。
```

## Egzersizler

1. **Easy。**4×4 GridWorld'de MC avantajı kullanın`G_t - V(s_t)`) eğitim aktör-kritik──与 06 中 Ders REINFORCE-with-running-mean-baseline'nin örnek verimliliği karşılaştırma─
2. **Medium。**切换到 TD-residual advantage (TD-residual advantage)`r + γ V(s') - V(s)`)― ölçüm avantajı seri varyasyonı― ne kadar düştü?
3. **Hard。**实现 GAE(λ)。扫描 `λ ∈ {0, 0.5, 0.9, 0.95, 1.0}`◊ Son dönüşü vs örnek verimliliği çizmek ◊ bu görev ◊ bu görevin önyargısı / değişkenlik tatlı noktası nerede?

## Anahtar Terimler

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Actor | “Policy net” | `π_θ(a\|s)`，由 policy gradient 更新。 |
| Critic | “Value net” | `V_φ(s)`，通过对 returns / TD targets 做 MSE regression 更新。 |
| Advantage | “比平均好多少” | `A(s, a) = Q(s, a) - V(s)` 或它的 estimators。`∇ log π` 的 multiplier。 |
| TD residual | “δ” | `δ_t = r + γ V(s') - V(s)`；one-step advantage estimate。 |
| GAE | “插值旋钮” | n-step advantages 的 exponentially weighted sum，由 `λ` parameterized。 |
| A2C | “Synchronous actor-critic” | 跨 envs batching；每个 rollout 做一次 Gradient step。 |
| A3C | “Async actor-critic” | Worker threads 把 gradients 推送到 shared param server。Original paper；2026 年较少见。 |
| Bootstrap | “在 horizon 使用 V” | 截断 rollout，添加 `γ^n V(s_{t+n})` 来闭合求和。 |

## Daha Fazla Okumak

- [Mnih et al. (2016). Asynchronous Methods for Deep Reinforcement Learning](https://arxiv.org/abs/1602.01783)A3C, ilk asynk aktör-kritik kağıdı.
- [Schulman et al. (2016). High-Dimensional Continuous Control Using Generalized Advantage Estimation](https://arxiv.org/abs/1506.02438) GAE。
- [Sutton & Barto (2018). Ch. 13 — Actor-Critic Methods](http://incompleteideas.net/book/RLbook2020.pdf) temeller; eleştirmen olarak Nöral Ağ 时, onu ve 9. bölümün işlevi yaklaşım 配套阅读。
- [Espeholt et al. (2018). IMPALA](https://arxiv.org/abs/1802.01561) V- izleme politika dışı düzeltme ile ölçeklenebilir dağıtılı aktör eleştirmenleri。
- [OpenAI Baselines / Stable-Baselines3](https://stable-baselines3.readthedocs.io/) 值得阅读的生产 A2C/PPO uygulamaları。
- [Konda & Tsitsiklis (2000). Actor-Critic Algorithms](https://papers.nips.cc/paper/1786-actor-critic-algorithms) iki katlı aktör-kritik parçalanmanın temel bir yakınlaşma sonucu──
