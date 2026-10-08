# الممثلين المنتقدين: A2C و A3C

> تعزيز الصوت`V̂(s)`من الناقد، من العودة في الحد من ذلك، أنت تحصل على توقعات مماثلة ولكن التباين ميزة أقل بكثير .

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (TD Learning), Phase 9 · 06 (REINFORCE)
**Time:** ~75 分钟

## 问题

فانيلا REINFORCE 能工作، ولكن تغيرها 很糟── مونتي كارلو يعود `G_t`بين الحلقات المختلفة يمكن أن يكون هناك تذبذب 10 مرات من حجم هذا الضجيج`∇ log π`مرة أخرى، سوف تنتج تقدير دراسي، تحتاج إلى آلاف الحلقات لتشجيع السياسة إلى استخدام تحديثات DQN أقل بكثير حتى تتمكن من الوصول إلى المسافة.

التباين من استخدام العائدات الخام... إذا خفضت خط الأساس`b(s_t)`: أي وظيفة من الحالة، بما في ذلك القيمة المتعلمة، التوقعات 保持不变، والانقسام 会下降── أفضل خط أساس قابلة للتعامل هو `V̂(s_t)`الآن يرتفع`∇ log π`كمية هي الميزة

`A(s, a) = G - V̂(s)`

إذا كان الإجراءات تُنتج عائدات أعلى من المتوسط، فهي جيدة؛ وإذا كانت أقل من المتوسط، فهي تُخلف.

## 概念

![Actor-critic: policy net plus value net, TD residual as advantage](../assets/actor-critic.svg)

**两个 networks，一个 shared loss：**

- **Actor** `π_θ(a | s)`: السياسة. عينة. إنها تتخذ إجراءات.
- **Critic** `V_φ(s)`: التقديرات من الولاية من المنتظرات المترتبة على العائد.`(V_φ(s) - target)²`تدريب

**Advantage。**两种标准形式:

- * ميزة المجلس المالي*:`A_t = G_t - V_φ(s_t)`غير متحيز، التنوع أعلى
- *فائدة التكنولوجيا*:`A_t = r_{t+1} + γ V_φ(s_{t+1}) - V_φ(s_t)`◊ تعصب`V_φ`),الفرق 低得多──也叫 *TD بقايا* `δ_t`.

**n-step advantage。**بينهما:

`A_t^{(n)} = r_{t+1} + γ r_{t+2} + … + γ^{n-1} r_{t+n} + γ^n V_φ(s_{t+n}) - V_φ(s_t)`

`n = 1`إنه طاهر`n = ∞`هو MC. معظم التنفيذات في Atari 上 استخدام`n = 5`, في استخدام PPO من MuJoCo `n = 2048`.

**Generalized Advantage Estimation (GAE)。**Schulman et al. (2016)  طرح على جميع المزايا n-خطوة القيام متوسط معدل:

`A_t^{GAE} = Σ_{l=0}^{∞} (γλ)^l δ_{t+l}`

من بينهم`λ ∈ [0, 1]`.`λ = 0`نعم تـد ((تغيرات منخفضة، تحيزات عالية)`λ = 1`(إنه (إم سي) ، تغير كبير، غير متحيز)`λ = 0.95`هو 2026 سنة: مستمرة التنظيم، حتى تحيز / تغير الرقم المتحرك إلى الموقع الذي تريده.

**A2C：synchronous advantage actor-critic。**في`N`بيئات متوازية`T`الخطوات.  للخطوة  الحساب المزايا.  في المجموعة المشتركة  العاملة العليا والنقاد.  الرد على المعلومات.

**A3C：asynchronous advantage actor-critic。**Mnih et al. (2016)。启动 `N`个工人线程,每个线程 运行一个环境――每个工人在自己的推广上本地计算梯度,然后无机性 应用到共享参数服务器――不需要重播缓冲:工人通过运行不同轨迹来去解调――A3C 证明你可以在CPU上规模培训――到2026年,GPU-based A2C(批量并行环境)占主导地位,因为GPUs 需要批量大――

**Combined loss。**

`L(θ, φ) = -E[ A_t · log π_θ(a_t | s_t) ]  +  c_v · E[(V_φ(s_t) - G_t)²]  -  c_e · E[H(π_θ(·|s_t))]`

ثلاثة:خسارة سياسة-مستدرجة  تراجع القيمة  مكافأة الاندروبي`c_v ~ 0.5`.`c_e ~ 0.01`إنها نقطة بداية طائفية


```figure
actor-critic
```

## بناءها

### الخطوة الأولى: نقدي

النقاد الخطى`V_φ(s) = w · features(s)`استخدام MSE 更新:

```python
def critic_update(w, x, target, lr):
    v_hat = dot(w, x)
    err = target - v_hat
    for j in range(len(w)):
        w[j] += lr * err * x[j]
    return v_hat
```

في الملفات الجدولية، النقاد جلسوا في مئات الحلقات. في Atari، قم بتبديل النقاد الخطية إلى قاعدة CNN المشتركة + رأس القيمة.

### الخطوة الثانية: فائدة الخطوة

给定长度为 `T`الإطلاق والانطلاق النهائي`V(s_T)`:

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

`returns`إنه هدف نقدي`advantages`هو ضرب `∇ log π`محتوياتها

### الخطوة الثالثة: تحديث مشترك

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

في السياسة، كل تحديث، تنفيذ، الممثل والنقيب استخدام معدلات التعلم المفتوحة.

### الخطوة الرابعة: التوازي (A3C مقابل A2C)

- **A3C：** إطلاق `N`个线程──每个线程 运行自己的环境和自己的前进通行──周期性地把 推送到共享主──主 上不加锁:
- **A2C：**في عملية واحدة`N`个 env مثالات،把 مشاهدات كومة 成 `[N, obs_dim]`المجموعة، تنفيذ المجموعة المقدمة المجموعة المقدمة المجموعة المقدمة المجموعة المقدمة المعدة الخلفية المستخدمة في المجموعة.

لدينا رمز لعبة 为了 أن تبقى واضحة خيط واحد ؛ تحويل إلى مجموعة A2C فقط تحتاج إلى ثلاث صفوف من النوم

## الفخاخ

- **Critic bias before actor gradient。**إذا كان النقيب عشوائي، فإن خطة أساسية له لا توجد كمية معلومات، وأنت في ضجيج نقي فوق التدريب. أولاً، دافئ النقيب.
- **Advantage normalization。**في كل مجموعة من المزايا في التطبيع إلى الصفر المتوسط / الوحدة-std.
- **Shared trunk。**للمدخولات الصورة، للعميل والنقاش استخدام مخرج الميزات المشتركة.
- **On-policy contract。**A2C على البيانات تحديدًا مرة واحدة تحديثها.
- **Entropy collapse。**لا يوجد`c_e > 0`عندما، سياسة سوف في عدة مئات من التحديثات في تصبح تقريبية تحديدية ووقف البحث.
- **Reward scale。**مقاييس الميزة تعتمد على مقياس المكافآت. تعاديل المكافآت، على سبيل المثال، فاقداً عن التدريب، حتى يتمكنوا من الاحتفاظ بمقاييس درادية متوافقة بين المهام المختلفة.

## استخدمها

A2C / A3C في عام 2026 هو القليل من الخيار النهائي، ولكن هم أساس جميع التكريرات الهيكلية اللاحقة:

| Method | Relation to A2C |
|--------|----------------|
| PPO | A2C + clipped importance ratio for multi-epoch updates |
| IMPALA | A3C + V-trace off-policy correction |
| SAC (Phase 9 · 07) | Off-policy A2C with a soft-value critic (next lesson) |
| GRPO (Phase 9 · 12) | A2C without the critic — group-relative advantage |
| DPO | A2C collapsed into a preference-ranking loss, no sampling |
| AlphaStar / OpenAI Five | A2C with league training + imitation pre-training |

إذا رأيت في ورقة عام 2026 ميزة فكر في النقاد الممثلين

## أرسله

保存为 `outputs/skill-actor-critic-trainer.md`:

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

## التمارين

1. **Easy。**في 4×4 GridWorld 上 استخدام ميزة MC(`G_t - V(s_t)`) تدريب الممثلين-النقاد.
2. **Medium。**切换到 TD-بقية ميزة`r + γ V(s') - V(s)`.‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
3. **Hard。**实现 GAE(λ)。扫描 `λ ∈ {0, 0.5, 0.9, 0.95, 1.0}`◊ رسم العائد النهائي مقابل كفاءة العينة.

## الشروط الرئيسية

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

## المزيد من القراءة

- [Mnih et al. (2016). Asynchronous Methods for Deep Reinforcement Learning](https://arxiv.org/abs/1602.01783) A3C، الأوراق المنتقدة للممثلين غير المتوافقين
- [Schulman et al. (2016). High-Dimensional Continuous Control Using Generalized Advantage Estimation](https://arxiv.org/abs/1506.02438) GAE。
- [Sutton & Barto (2018). Ch. 13 — Actor-Critic Methods](http://incompleteideas.net/book/RLbook2020.pdf) الأساسات؛ عندما ينتقد هو شبكة عصبية 时،把它和 Ch. 9
- [Espeholt et al. (2018). IMPALA](https://arxiv.org/abs/1802.01561) تنقيدي المتميز الموزع للمحاربين-النقاد مع تصحيح خارج السياسة في-ترايس
- [OpenAI Baselines / Stable-Baselines3](https://stable-baselines3.readthedocs.io/) 值得阅读的生产 A2C/PPO تنفيذات
- [Konda & Tsitsiklis (2000). Actor-Critic Algorithms](https://papers.nips.cc/paper/1786-actor-critic-algorithms) نتيجة التقارب الأساسي للفساد الممثل-النقاد على مقياسين
