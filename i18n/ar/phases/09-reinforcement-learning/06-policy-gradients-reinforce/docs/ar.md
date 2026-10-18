# سياسة تدريجية  من الصفر لتحقيق REINFORCE

> توقف تقييم القيمة. مباشرة تعريف السياسة، حساب المتوقع العائد من درجي، ثم على طول الطريق إلى تحديث.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 03 (Backpropagation), Phase 9 · 03 (Monte Carlo), Phase 9 · 04 (TD Learning)
**Time:** ~75 分钟

## 问题

Q-تعلم 和 DQN تخصيص العناصر`argmax Q`لا يوجد مشكلة في هذا الأمر، ولكن عندما تكون الإجراءات مستمرة، فستفشل`argmax`؟) ، أو عندما تريد سياسة استوكاستية)`argmax`按构造就是 ديترمينستية)

تغير نسبة السياسة لتحديد المعلمات * السياسة*。$\pi_\theta(a \mid s)$هو شبكة عصبية، إصدار عمل على التوزيع.$\theta$يُعدّتُ المُعدّات على طول الطريق.`argmax`لا يوجد استدعاء بيلمان$J(\theta) = \mathbb E_{\pi_\theta}[G]$قم بتصاعد الدرجة

نظرية التكثيف (ويليامز 1992)  أخبرك هذا الدرجة هي قابل للحساب:$\nabla J(\theta) = \mathbb E_\pi[ G \cdot \nabla_\theta \log \pi_\theta(a \mid s) ]$◊运行一个集――计算回来――把每一步的 $\nabla \log \pi_\theta(a \mid s)$乘以回归──取平均──做 ارتفاع درجة──完成──

كل خوارزمية LLM-RL لعام 2026:PPO、DPO、GRPO، هي تحسينات لل REINFORCE.

## 概念

![Policy gradient: softmax policy, log-π gradient, return-weighted update](../assets/policy-gradient.svg)

**Policy gradient theorem。**على أي حال$\theta$سياسة المعلمات $\pi_\theta$:

```math
\nabla J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}[ \sum_{t=0}^{T} G_t \cdot \nabla_\theta \log \pi_\theta(a_t \mid s_t) ]
```

من بينهم$G_t = \sum_{k=t}^{T} \gamma^{k-t} r_{k+1}$هو من الخطوة$t$開始的折扣回报──预期是从 $\pi_\theta$مسارات العينة كاملة$\tau$ما حصل

**证明很短。**في التوقعات$J(\theta) = \sum_\tau P(\tau; \theta) G(\tau)$求导──使用 $\nabla P(\tau; \theta) = P(\tau; \theta) \nabla \log P(\tau; \theta)$(حيلة المشتقات التخفيفية)$\log P(\tau; \theta) = \sum \log \pi_\theta(a_t \mid s_t) + \text{environment terms that do not depend on } \theta$تختفي مصطلحات البيئة

**Variance reduction 技巧。**تغيرات فانيلا REINFORCE 非常高: العائدات هي ضوضاء،$\nabla \log \pi$هو ضجيج, وكميةهم ضجيج جدا.

1. **Baseline subtraction。**على أيّة إعتماد$a_t$$b(s_t)$،把 $G_t$替换成 $G_t - b(s_t)$انها غير متحيزة, لأن$\mathbb{E}[b(s_t) \cdot \nabla \log \pi(a_t \mid s_t)] = 0$典型选择: بواسطة النقاد 学到的 $b(s_t) = \hat{V}(s_t)$→ الممثل-المنتقد
2. **Reward-to-go。**- لا .$\sum_t G_t \cdot \nabla \log \pi_\theta(a_t \mid s_t)$替换成 $\sum_t G_t^{\text{from } t} \cdot \nabla \log \pi_\theta(a_t \mid s_t)$على عمل محدد، فقط المستقبل يعود 相关، الثمن الماضي فقط سوف تساهم في ضجيج صفر المتوسط

-تجمعها

```math
\nabla J \approx (1/N) \sum_{i=1}^{N} \sum_{t=0}^{T_i} [ G_t^{(i)} - \hat{V}(s_t^{(i)}) ] \cdot \nabla_\theta \log \pi_\theta(a_t^{(i)} \mid s_t^{(i)})
```

هذا هو التأثير المباشر على القوة الأساسية، والتي تمثل أيضاً أسلاف A2C (دراسة 07) و PPO (دراسة 08)

**Softmax policy parameterization。**للقيام بعمل منفصل، فإن المعيار هو:

```math
\pi_\theta(a \mid s) = \exp(f_\theta(s, a)) / \sum_{a'} \exp(f_\theta(s, a'))
```

من بينهم$f_\theta$أي شيء لكل عمل  أخرج نقطة من شبكة عصبية ٬ الدرجة لديها نموذج صاف:

```math
\nabla_\theta \log \pi_\theta(a \mid s) = \nabla_\theta f_\theta(s, a) - \sum_{a'} \pi_\theta(a' \mid s) \nabla_\theta f_\theta(s, a')
```

ويعني أن النتيجة التي اتخذت إجراءات خفضت قيمتها المتوقعة في السياسة

**用于 continuous actions 的 Gaussian policy。** $\pi_\theta(a \mid s) = N(\mu_\theta(s), \sigma_\theta(s))$.$\nabla \log N(a; \mu, \sigma)$هناك شكل مغلق هذا كل ما يحتاجه SAC في المرحلة 9 · 07


```figure
policy-gradient-landscape
```

## بناءها

### الخطوة الأولى: شبكة سياسة softmax

```python
def policy_logits(theta, state_features):
    return [dot(theta[a], state_features) for a in range(N_ACTIONS)]

def softmax(logits):
    m = max(logits)
    exps = [exp(l - m) for l in logits]
    Z = sum(exps)
    return [e / Z for e in exps]
```

على الجدوليات الموضعية استخدام سياسة خطية ((كل عمل واحد وزنه متجه)。 على Atari, تغيير إلى CNN,并保留 softmax head。

### الخطوة الثانية: أخذ العينات وإمكانية تسجيل السجلات

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

### الخطوة الثالثة: الإرسال مع التقاط المراقبة السجلية

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

### الخطوة الرابعة: تحديث REINFORCE

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

التدريجية$\nabla \log \pi(a \mid s) = e_a - \pi(\cdot \mid s)$($a$من الاحتمالات المحددة للحد من الحرارة) هو جوهر تراجعات السياسة softmax.

### الخطوة 5: خطوط أساسية

على الحلقات الأخيرة$G$取 running mean، already enough to put 4×4 GridWorld run up; تقريباً تحتاج إلى 500 حلقة 收──把基线 升级为学习 $\hat{V}(s)$، لقد حصلت على الممثل-النقاد

## الفخاخ

- **Exploding gradients。**العائدات قد تكون كبيرة جدا$\nabla \log \pi$قبل ذلك، دائماً في المجموعة$G$التطبيع إلى`~N(0, 1)`.
- **Entropy collapse。**السياسة 过早收到近似决定性的行动,停止探索,然后卡住──修复方式:向目标 添加$\beta \cdot H(\pi(\cdot \mid s))$.
- **High variance。**فانيلا REINFORCE  بحاجة إلى مئات الملايين من الحلقات.
- **Sample inefficiency。**على السياسة يعني كل انتقال في تحديث واحد  بعد ذلك سوف يتم التخلي عنها‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
- **Non-stationary gradients。**100 حلقة من قبل نفس الدرجة التي تستخدمها القديمة$\pi$هذا هو سبب تحديث كل إطلاق مختلف
- **Credit assignment。**没有奖励-to-go 时,过去奖励 会贡献 noise──始终使用奖励-to-go──

## استخدمها

2026 سنة، رينفورس   很少被直接运行, ولكن لها Gradient 公式无处不在:

| Use case | Derived method |
|----------|---------------|
| Continuous control | PPO / SAC with Gaussian policy |
| LLM RLHF | PPO with KL penalty, running on token-level policy |
| LLM reasoning (DeepSeek) | GRPO — REINFORCE with group-relative baseline, no critic |
| Multi-agent | Centralized-critic REINFORCE (MADDPG, COMA) |
| Discrete action robotics | A2C, A3C, PPO |
| Preference-only settings | DPO — REINFORCE rewritten as a preference-likelihood loss, no sampling |

عندما ترى في نص التدريب في عام 2026`loss = -advantage * log_prob`,that's带基线的 REINFORCE──整篇论文(DPO、GRPO、RLOO) كلها مبنية على هذه الخطوة تخفيض التباينات 技巧──

## أرسله

保存为 `outputs/skill-policy-gradient-trainer.md`:

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

## التمارين

1. **Easy。**في 4×4 GridWorld 上استعمل سياسة softmax خطية 实现 REINFORCE──不使用基线,训练 1,000 个集── رسم منحنى التعلم؛ قياس المتغيرات(عائدات std)──
2. **Medium。**إضافة متوسط الجري في المرحلة الأساسية. مرة أخرى التدريب. إضافة كفاءة العينة و التباين مع الجري في الفانيليا مقابل المرحلة الأساسية.
3. **Hard。**إضافة إضافة إضافية$\beta \cdot H(\pi)$◊ مسح$\beta \in \lbrace 0, 0.01, 0.1, 1.0 \rbrace$◊ رسم العائد النهائي وتربية السياسة.

## الشروط الرئيسية

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

## المزيد من القراءة

- [Williams (1992). Simple Statistical Gradient-Following Algorithms for Connectionist Reinforcement Learning](https://link.springer.com/article/10.1007/BF00992696)ورقة تعزيز الأساسية
- [Sutton et al. (2000). Policy Gradient Methods for Reinforcement Learning with Function Approximation](https://papers.nips.cc/paper_files/paper/1999/hash/464d828b85b0bed98e80ade0a5c43b0f-Abstract.html) 带 مقربة الوظيفة ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬
- [Sutton & Barto (2018). Ch. 13 — Policy Gradient Methods](http://incompleteideas.net/book/RLbook2020.pdf) عرض الكتب المدرسية
- [OpenAI Spinning Up — VPG / REINFORCE](https://spinningup.openai.com/en/latest/algorithms/vpg.html) 清晰的教学式讲解,包含 PyTorch code──
- [Peters & Schaal (2008). Reinforcement Learning of Motor Skills with Policy Gradients](https://homes.cs.washington.edu/~todorov/courses/amath579/reading/PolicyGradient.pdf) تقليل التباين، فضلا عن إعادة التأثير                                                                                                                                                                                                                                                       
