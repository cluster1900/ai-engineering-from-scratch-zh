# Politika Gradienti  REINFORCE'yi sıfırdan gerçekleştirmek

> 停止估值──直接 parameterizate policy, calculate expected return of Gradient, then along up坡方向更新── Williams (1992) bir teoremle 写清了它──这是PPO、GRPO以及每个LLM RL循环的存在的原因──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 03 (Backpropagation), Phase 9 · 03 (Monte Carlo), Phase 9 · 04 (TD Learning)
**Time:** ~75 分钟

## 问题

Q-öğrenme 和 DQN parametreze 的是 *value* function──你通过 `argmax Q`選択行動──これは diskret eylemlere 和 diskret eyaletlere 問題なし──しかし当アクションは連続です 时就会失效(10 boyutlu bir topeye 如何做`argmax`?), ya da eğer isteksiz politika istiyorsan 时也会失效`argmax`按构造就是确定性)

Politika gradiyenti 改为 parametreze *politics*。$\pi_\theta(a \mid s)$Bu, bir sinir ağı, bir çıkış işleminin dağıtımıdır.$\theta$Gradient. Yolda yukarı yön yeniliyor.`argmax`Bellman'ın geri dönüşü yok.$J(\theta) = \mathbb E_{\pi_\theta}[G]$Gradyent yükseliş yapın.

ReINFORCE teoremi (Williams 1992)  size söyleyin bu Gradient is calculable:$\nabla J(\theta) = \mathbb E_\pi[ G \cdot \nabla_\theta \log \pi_\theta(a \mid s) ]$Bir bölümün devamı hesaplanıp geri döner.$\nabla \log \pi_\theta(a \mid s)$乘以回归──取平均──做 Gradient-ascent──完成──

2026 yılında her LLM-RL algoritması:PPO、DPO、GRPO, hepsi REINFORCE'nin gelişimi, bu aşamada devam eden süreçlerin yanı sıra 10 · 07 (RLHF uygulaması) ve 10 · 08 (DPO) aşamasının ön şartlarıdır.

## 概念

![Policy gradient: softmax policy, log-π gradient, return-weighted update](../assets/policy-gradient.svg)

**Policy gradient theorem。**Herhangi bir şekilde$\theta$parametreleşmiş politika $\pi_\theta$- ...

```math
\nabla J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}[ \sum_{t=0}^{T} G_t \cdot \nabla_\theta \log \pi_\theta(a_t \mid s_t) ]
```

İçlerinden $G_t = \sum_{k=t}^{T} \gamma^{k-t} r_{k+1}$- Evet .$t$开始的折扣回报──预期是从 $\pi_\theta$Örnekin tam yolları $\tau$Başarılı olan...

**证明很短。**Beklemeyi bekle .$J(\theta) = \sum_\tau P(\tau; \theta) G(\tau)$求导──使用 $\nabla P(\tau; \theta) = P(\tau; \theta) \nabla \log P(\tau; \theta)$(log-derivative hilesi) 。分解 $\log P(\tau; \theta) = \sum \log \pi_\theta(a_t \mid s_t) + \text{environment terms that do not depend on } \theta$△ çevre terimleri ∞ yok ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞

**Variance reduction 技巧。**Vanilla REINFORCE'nin değişimi çok yüksek: dönüşler gürültülü,$\nabla \log \pi$Bu sesli bir yer.

1. **Baseline subtraction。**İsteyecekleri$a_t$$b(s_t)$, $G_t$替换成 $G_t - b(s_t)$- Bu tarafsızlık.$\mathbb{E}[b(s_t) \cdot \nabla \log \pi(a_t \mid s_t)] = 0$❖ tipik seçim: ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒   ⇒ ⇒    ⇒  ⇒    ⇒    ⇒      ⇒      ⇒                                                                                                                                                                                                                                                                           $b(s_t) = \hat{V}(s_t)$→ aktör-kritik ((07 ders)
2. **Reward-to-go。**- Ne ?$\sum_t G_t \cdot \nabla \log \pi_\theta(a_t \mid s_t)$替换成 $\sum_t G_t^{\text{from } t} \cdot \nabla \log \pi_\theta(a_t \mid s_t)$❖ Bir belirli eylem için, sadece gelecekte geri dönüşler 関連, geçmiş ödüller sadece sıfır ortalama gürültü katkıda bulunacaktır。

Toplanıp al:

```math
\nabla J \approx (1/N) \sum_{i=1}^{N} \sum_{t=0}^{T_i} [ G_t^{(i)} - \hat{V}(s_t^{(i)}) ] \cdot \nabla_\theta \log \pi_\theta(a_t^{(i)} \mid s_t^{(i)})
```

İşte bu, A2C'nin (Desin 07) ve PPO'nun (Desin 08) doğrudan ataları olan temel güçlenme.

**Softmax policy parameterization。**Ayrılıklı eylemler için standart seçim:

```math
\pi_\theta(a \mid s) = \exp(f_\theta(s, a)) / \sum_{a'} \exp(f_\theta(s, a'))
```

İçlerinden $f_\theta$Bu işlem için herhangi bir ışığa çıkış  Neural Network  Gradient ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ışığa çıkış ış ışığa çıkış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış ış  ış ış   ış ış ış  ış ış ış  ış ış    ış ış   ış 

```math
\nabla_\theta \log \pi_\theta(a \mid s) = \nabla_\theta f_\theta(s, a) - \sum_{a'} \pi_\theta(a' \mid s) \nabla_\theta f_\theta(s, a')
```

Yani, harekete geçirilmiş bir işlemin puanı politikada beklenen değerden aşağı düşmüştür.

**用于 continuous actions 的 Gaussian policy。** $\pi_\theta(a \mid s) = N(\mu_\theta(s), \sigma_\theta(s))$- Evet.$\nabla \log N(a; \mu, \sigma)$Kapalı bir form var. Bu SAC'ın 9. fazının tüm ihtiyaçları.


```figure
policy-gradient-landscape
```

## Yapın

### Adım 1: softmax politika ağı

```python
def policy_logits(theta, state_features):
    return [dot(theta[a], state_features) for a in range(N_ACTIONS)]

def softmax(logits):
    m = max(logits)
    exps = [exp(l - m) for l in logits]
    Z = sum(exps)
    return [e / Z for e in exps]
```

Tablolar ortamı için kullanın çizgi politikalar için her eylem için bir ağırlık vektörü için kullanın.

### Adım 2: Örnek alma ve kayıt olasılıkları

```python
def sample_action(probs, rng):
    x = rng.random()
    cum = 0
    for a, p in enumerate(probs):
        cum += p
        if x <= cum:
            return a
    return len(probs) - 1

def log_prob(probs, a):
    return log(probs[a] + 1e-12)
```

### Adım 3: Kayıtları yakalayarak devreye girme

```python
def rollout(theta, env, rng, gamma):
    trajectory = []
    s = env.reset()
    while not done:
        logits = policy_logits(theta, s)
        probs = softmax(logits)
        a = sample_action(probs, rng)
        s_next, r, done = env.step(s, a)
        trajectory.append((s, a, r, probs))
        s = s_next
    return trajectory
```

### 4. Adım: REINFORCE güncelleme

```python
def reinforce_step(theta, trajectory, gamma, lr, baseline=0.0):
    returns = compute_returns(trajectory, gamma)
    for (s, a, _, probs), G in zip(trajectory, returns):
        advantage = G - baseline
        grad_log_pi_a = [-p for p in probs]
        grad_log_pi_a[a] += 1.0
        for i in range(N_ACTIONS):
            for j in range(len(s)):
                theta[i][j] += lr * advantage * grad_log_pi_a[i] * s[j]
```

- Gelişmiş .$\nabla \log \pi(a \mid s) = e_a - \pi(\cdot \mid s)$($a$Bu, "sıkı" ve "sıkı" olan bir şey değildir.

### Adım 5: Temel çizgiler

Son dönemlerde olan olaylara karşı$G$取 running mean, já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já$\hat{V}(s)$- Evet, oyunculuğu eleştirenler.

## Tuzaklar

- **Exploding gradients。**Geri dönüşleri çok büyük olabilir.$\nabla \log \pi$之前,始终在批内把 $G$Normalleşmek için`~N(0, 1)`- Evet.
- **Entropy collapse。**Politikası 过早收到近似决定性的行动,停止探索,然后卡住──修复方式:向目标 添加 entropi bonusu $\beta \cdot H(\pi(\cdot \mid s))$- Evet.
- **High variance。**Vanilla REINFORCE 需要成千上万集──批判的基线──Lesson 07) 或 TRPO/PPO'nun güven bölgesinde──Lesson 08) is standard修复──
- **Sample inefficiency。**Politika üzerindeki her geçiş bir güncelleştirme sonrasında terk edilir. Önemlilik örneği yaparak, politika dışı düzeltmeler yaparak verileri geri getirebilirsiniz.
- **Non-stationary gradients。**100 bölüm  önceki aynı Gradient kullanmak eski $\pi$Bu politikalardaki yöntemler.
- **Credit assignment。**没有奖励-to-go 时,过去奖励 会贡献噪声──始终使用奖励-to-go──

## Kullan

2026 yılında, REINFORCE  çok az doğrudan çalıştırılır, ama onun Gradient 公式 bulunmuyor:

| Use case | Derived method |
|----------|---------------|
| Continuous control | PPO / SAC with Gaussian policy |
| LLM RLHF | PPO with KL penalty, running on token-level policy |
| LLM reasoning (DeepSeek) | GRPO — REINFORCE with group-relative baseline, no critic |
| Multi-agent | Centralized-critic REINFORCE (MADDPG, COMA) |
| Discrete action robotics | A2C, A3C, PPO |
| Preference-only settings | DPO — REINFORCE rewritten as a preference-likelihood loss, no sampling |

2026 yılında eğitim senaryolarında gördüğünüzde`loss = -advantage * log_prob`,那就是带基线的 REINFORCE──整篇论文(DPO、GRPO、RLOO) bu çizginin üzerinde varyansa azaltma tekniklerini oluşturur.

## Gönder

保存为 `outputs/skill-policy-gradient-trainer.md`- ...

```markdown
---
name: policy-gradient-trainer
description: 为给定 task 生成 REINFORCE / actor-critic / PPO training config，并诊断 variance 问题。
version: 1.0.0
phase: 9
lesson: 6
tags: [rl, policy-gradient, reinforce]
---

给定一个 environment（discrete / continuous actions、horizon、reward stats），输出：

1. Policy head。Softmax（discrete）或 Gaussian（continuous），并包含 parameter counts。
2. Baseline。None（vanilla）、running mean、learned `V̂(s)`，或 A2C critic。
3. Variance controls。默认启用 reward-to-go、return normalization、gradient clip value。
4. Entropy bonus。Coefficient β 和 decay schedule。
5. Batch size。每次 update 的 episodes 数；on-policy data freshness contract。

拒绝在 horizons > 500 steps 上使用 REINFORCE-no-baseline。拒绝为 continuous-action control 使用 softmax head。把任何 `β = 0` 且 observed policy entropy < 0.1 的 run 标记为 entropy-collapsed。
```

## Egzersizler

1. **Easy。**4×4 GridWorld 上用线性软max politikası 实现 REINFORCE──不使用基线,训练 1,000 个集──绘制学习曲线;测量变异(return 的 std)──
2. **Medium。**添加运行平均基线――再训――把样本效率 和差与香运行对比――基线 让收所需步骤 降低了多少?
3. **Hard。**添加 entropi bonusu $\beta \cdot H(\pi)$❖ Çanak$\beta \in \lbrace 0, 0.01, 0.1, 1.0 \rbrace$Son dönüşü ve politika entropiyi çizmek. Bu görev en iyi noktayı nerede?

## Anahtar Terimler

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Policy gradient | “直接训练 policy” | $\nabla J(\theta) = \mathbb{E}[G \cdot \nabla \log \pi_\theta(a \mid s)]$；由 log-derivative trick 推导而来。 |
| REINFORCE | “最初的 PG algorithm” | Williams (1992)；Monte Carlo returns 乘以 log-policy Gradient。 |
| Log-derivative trick | “Score function estimator” | $\nabla P(\tau;\theta) = P(\tau;\theta) \cdot \nabla \log P(\tau;\theta)$；让 expectations 的 gradients 变得 tractable。 |
| Baseline | “Variance reduction” | 从 $G$ 中减去的任意 $b(s)$；是 unbiased 的，因为 $\mathbb{E}[b \cdot \nabla \log \pi] = 0$。 |
| Reward-to-go | “只计算未来 returns” | 使用 $G_t^{\text{from } t}$ 而不是完整的 $G_0$；正确且 variance 更低。 |
| Entropy bonus | “鼓励探索” | $+\beta \cdot H(\pi(\cdot \mid s))$ 项防止 policy collapse。 |
| On-policy | “用你刚看到的数据训练” | Gradient expectation 是相对于当前 policy 的，不能直接复用旧数据。 |
| Advantage | “比平均好多少” | $A(s, a) = G(s, a) - V(s)$；带 baseline 的 REINFORCE 所乘的带符号 quantity。 |

## Daha Fazla Okumak

- [Williams (1992). Simple Statistical Gradient-Following Algorithms for Connectionist Reinforcement Learning](https://link.springer.com/article/10.1007/BF00992696) İlk REINFORCE kağıdı
- [Sutton et al. (2000). Policy Gradient Methods for Reinforcement Learning with Function Approximation](https://papers.nips.cc/paper_files/paper/1999/hash/464d828b85b0bed98e80ade0a5c43b0f-Abstract.html) 带 fonksiyon yakınımanın  带 fonksiyon yakınımanın 带 modern policy-gradient teoremi
- [Sutton & Barto (2018). Ch. 13 — Policy Gradient Methods](http://incompleteideas.net/book/RLbook2020.pdf) Ders kitabı sunumı。
- [OpenAI Spinning Up — VPG / REINFORCE](https://spinningup.openai.com/en/latest/algorithms/vpg.html) 清晰的教学式讲解,包含 PyTorch kodu──
- [Peters & Schaal (2008). Reinforcement Learning of Motor Skills with Policy Gradients](https://homes.cs.washington.edu/~todorov/courses/amath579/reading/PolicyGradient.pdf) Varians-reduction,以及把 REINFORCE 连接到信托区域家族 (TRPO, PPO) 视角
