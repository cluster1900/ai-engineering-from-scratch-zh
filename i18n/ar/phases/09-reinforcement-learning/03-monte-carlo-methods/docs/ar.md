# أساليب مونت كارلو  تعلم من الحلقات الكاملة

> البرمجة الديناميكية 需要模型── مونت كارلو ما عدا الحلقات 什么都不需要──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs), Phase 9 · 02 (Dynamic Programming)
**Time:** ~75 minutes

## 问题

البرمجة الديناميكية جميلة جدا، ولكن يفترض يمكنك على كل حالة و العمل استفسار`P(s' | s, a)` في العالم الحقيقي لا يوجد تقريبا شيء يعمل بهذه الطريقة.  الروبوتات لا يمكنها تحليلها وتحساب إضافة اللحظة المشتركة إلى الوصول إلى الكاميرا بعد تصفيح الكاميرا.

تحتاج إلى طريقة تعتمد فقط على البيئة من *مثال* من طريقة  سياسة التنفيذ  الحصول على مسار:`s_0, a_0, r_1, s_1, a_1, r_2, …, s_T`يستخدمها لتقييم القيم هذا هو مونت كارلو

من DP إلى MC تحول مهم في الفكر: نحن من * النموذج المعروف + الاحتفاظ الدقيق * 转向 * نموذج الاطلاع + متوسط العائد *。 سيتم زيادة التغيرات ، ولكن التطبيقات سوف تتوسع بشكل متفجرات。 بعد هذا الدراسة كل خوارزمية RL ، TD、Q-تعلم、REINFORCE、PPO、GRPO ، في جوهرها هي مقياس مونتكارلو ، في بعض الأحيان تتضمن على ذلك bootstrapping。

## 概念

![Monte Carlo: rollout, compute returns, average; first-visit vs every-visit](../assets/monte-carlo.svg)

**核心思想，一行表达：** `V^π(s) = E_π[G_t | s_t = s] ≈ (1/N) Σ_i G^{(i)}(s)`، من بينهم`G^{(i)}(s)`في السياسة`π`下访问 `s`بعد مشاهدة العائدات

**First-visit vs every-visit MC。**عطينا حالة زيارة أكثر`s`في الحلقة الأولى، يُرجع الموسيقي فقط في الحلقة الأولى، وكل مرة يُرجع فيها الموسيقي في الحلقة الثانية، وكل مرة يُرجع فيها الموسيقي في الحلقة الثانية، وكل مرة يُرجع فيها الموسيقي في الحلقة الثانية، وكل مرة يُرجع فيها الموسيقي في الحلقة الثانية، وكل مرة يُرجع فيها الموسيقي في الحلقة الثانية، وكل مرة يُرجع فيها الموسيقي في الحلقة الثانية، وكل مرة يُرجع فيها الموسيقي في الحلقة الثانية، وكل مرة يُرجع فيها الموسيقي في الحلقة الثانية، وكل مرة يُرجع فيها الموسيقي في الحلقة الثانية، وكل مرة يُرجع فيها الموسيقي في الحلقة الثانية، وكل مرة يُرجع فيها الموسيقي.

**Incremental mean。**لا تخزين جميع العائدات، بل تحديث المتوسط الجاري:

`V_n(s) = V_{n-1}(s) + (1/n) [G_n - V_{n-1}(s)]`

重新整理:`V_new = V_old + α · (target - V_old)`، من بينهم`α = 1/n`把 `1/n`换成 ثابتة حجم الخطوة `α ∈ (0, 1)`،حسناً، لقد حصلت على مقياس MC غير ثابت، وسوف تتبع`π`هذا الحركة هي من MC 跳到 TD,再跳到每个现代 RL خوارزمية كل المفاتيح

**Exploration 现在成了问题。**وذلك من خلال تصريحات المجلس التنفيذي للدولة.`π`هو تحديد،المساحة الحكومية 中整片区域永远不会被样本,估值估值将永远停留在零.

1. **Exploring starts。**随机 (s, a) زوج 开始每个集──保证 تغطية;实践中不现实(你不能把机器人 重置到任意状态)
2. **ε-greedy。**مقارنة مع Q السابقة ، قم بعمل طموح ، ولكن على الأرجح`ε`选择随机行动── جميع أزواج العمل الحكومي مدينة تدريجياً يتم أخذ العينات‬
3. **Off-policy MC。**في سياسة السلوك`μ` جمع البيانات من خلال أخذ العينات من الأهمية  تعلم السياسة المستهدفة `π` التغيرات عالية، ولكن هذا هو طريق إلى DQN وغيرها من أساليب إعادة تشغيل البفر

**Monte Carlo Control。**تقييم → تحسين → تقييم، مثل تكرار السياسة، ولكن التقييم يعتمد على العينات:

1. 运行 `π`، حصلت على حلقة
2. وفقاً للملاحظات`Q(s, a)`.
3. 让 `π`مقارنة`Q`أصبح طمعاً
4. -أرجوك

في ظروف حرارة و ظروف الحرارة كل زوج تم زيارته مرة أخرى`α`(تلبية (روبينز-مونرو) ، سوف تصل إلى`Q*`和 `π*`.

## 动手构建

### الخطوة الأولى: التنفيذ → (s, a, r) 列表

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

لا نموذج، فقط`env.reset()`和 `env.step(s, a)`تواصل مع بيئة رياضية نفسها، ولكن تمت إسهالها

### الخطوة 2: 计算 يعود(反向扫)

```python
def returns_from(trajectory, gamma):
    returns = []
    G = 0.0
    for _, _, r in reversed(trajectory):
        G = r + gamma * G
        returns.append(G)
    return list(reversed(returns))
```

مرّة واحدة،`O(T)` ضد التكرار`G_t = r_{t+1} + γ G_{t+1}`避免了重复求和──

### الخطوة الثالثة: تقييم المملكة العربية المتحدة في الزيارة الأولى

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

حقيقة العمل هي ثلاثية: أول زيارة في حالة علامة

### الخطوة الرابعة: إضفاء السيطرة على السياسة

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

### الخطوة 5: مقارنة مع معايير الذهب

عندما تكون في حلقة → ∞ 时,你对 `V^π`تقدير الممثلين المختصين في المرحلة الثانية من الدراسة، يجب أن يصل إلى 50،000 حلقة في 4×4 GridWorld، يمكن أن يصل إلى ما يقارب الاختلافات مع نتائج الدراسة الثانية.`~0.1`في حدودها

## 常见陷

- **Infinite episodes。**الموسيقى  مطلوب الحلقات  يجب أن *إنهاء*.`max_steps`"الحد الأعلى، لم يصل إلى الحد الأعلى" "إلى الفشل الخفي" "بسياسة الاختيار المنتظمة" "في "جريد وورلد" "منتظمة في الوقت المناسب" "هذا أمر طبيعي، طالما تأكد من أن حسابك صحيح"
- **Variance。**MC استخدام كامل العائدات... في الحلقات الطويلة، التباين كبير، في النهاية مرة واحدة في الارتفاع الثمن سوف تكون نفس الكمية تحرك`V(s_0)` أساليب التدريب (درس 04) من خلال إطلاق الجهاز
- **State coverage。**في ق ق جديدة 上做 لالية MC، إذا ظهرت العلاقات، فقط سوف تستمر في محاولة عمل.
- **Non-stationary policies。**إذا`π`تغيرات تحدث مثل التحكم في MC، العودة القديمة من سياسات مختلفة.
- **Off-policy importance sampling。**权重 `π(a|s)/μ(a|s)`会沿轨迹 连乘──Variance 会随地视界 爆炸──用每决权重 IS 截断,或切换到 TD──


```figure
epsilon-greedy
```

## استخدمها

أساليب مونت كارلو في عام 2026:

| Use case | Why MC |
|----------|--------|
| Short-horizon games（blackjack、poker） | Episodes 自然 terminate；returns 清晰。 |
| Logged policy 的 offline evaluation | 对 stored trajectories 的 discounted returns 求平均。 |
| Monte Carlo Tree Search（AlphaZero） | 从 tree leaves 发起的 MC rollouts 指导 selection。 |
| LLM RL evaluation | 为给定 policy 计算 sampled completions 的 average reward。 |
| PPO 中的 baseline estimation | Advantage target `A_t = G_t - V(s_t)` 使用 MC `G_t`。 |
| RL 教学 | 最简单且真正有效的 algorithm；去掉 bootstrapping 就能看到核心。 |

الـ "هودينغ" العميقة "الـ "ألغوريتم" (PPO、SAC) سيتمّ تمريرها`n`-المستويات الخطوة أو GAE، في المعدل MC (مستويات كاملة) وال TD (مستويات خطوة واحدة) بين القيمة.

## 交付 it

保存为 `outputs/skill-mc-evaluator.md`:

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

## التدريب

1. **Easy.**实现 4×4 GridWorld 上 制服- عشوائية السياسة                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `V(0,0)`随剧情数 变化的曲线与 DP 答案对照绘制──
2. **Medium.**استخدام`ε ∈ {0.01, 0.1, 0.3}`实现 ε-greedy MC control──比较20,000 حلقة 后的平均回报──曲线看起来是什么样子?
3. **Hard.**استخدام العينات المهمة 实现 *off-policy* MC:在统一随机政策 `μ` جمع البيانات، تقديرات تحديدية السياسة المثلى `π``V^π`◊ مقارنة IS 、 لكل قرار IS 和 الموزن IS ◊ أي اختلاف أدنى؟

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

- [Sutton & Barto (2018). Ch. 5 — Monte Carlo Methods](http://incompleteideas.net/book/RLbook2020.pdf) 经典处理。
- [Singh & Sutton (1996). Reinforcement Learning with Replacing Eligibility Traces](https://link.springer.com/article/10.1007/BF00114726) أول زيارة مقابل كل زيارة التحليل
- [Precup, Sutton, Singh (2000). Eligibility Traces for Off-Policy Policy Evaluation](http://incompleteideas.net/papers/PSS-00.pdf) خارج السياسة MC 和 مراقبة التباين
- [Mahmood et al. (2014). Weighted Importance Sampling for Off-Policy Learning](https://arxiv.org/abs/1404.6362) 现代 مقياسات IS ذات التغيرات المنخفضة
- [Tesauro (1995). TD-Gammon, A Self-Teaching Backgammon Program](https://dl.acm.org/doi/10.1145/203330.203343) MC / TD لعب الذاتي 收到超人玩的首个大规模实证展示; أيضاً في هذه المرحلة 后半部分每节课的概念先驱──
