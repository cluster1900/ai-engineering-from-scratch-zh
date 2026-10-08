# الفرق في الوقت الزمني  Q-Learning & SARSA

> مونت كارلو 会一直等到集 结束──TD 通过 bootstrap 下一个价值估计,在每一步后更新──Q-learning 是非政策 且偏乐观;SARSA 是在政策 且偏谨慎──两者都只是一行代码──两者也支着本阶段中每种深度RL 方法──

**Type:** Build
**Languages:** Python
**前置要求:**المرحلة 9 · 01 (MDPs) ، المرحلة 9 · 02 (برمجة ديناميكية) ، المرحلة 9 · 03 (مونتي كارلو)
**Time:** ~75 minutes

## 问题

مونت كارلو ممكن، ولكن لديها متطلبات مرتفعة الثمن. تحتاج إلى إيقاف الحلقات، ويمكن تحديثها فقط بعد العودة النهائية. إذا كان لديك حلقة 1000 خطوة، يجب أن تنتظر 1000 خطوة حتى تحديث أي شيء.

البرمجة الديناميكية 则相反:零方差的引导备份,但要求已知模型──

الفرق الزمني (TD) التعلم 折中了两者──根据单个过渡 `(s, a, r, s')`، بناء هدف خطوة واحدة`r + γ V(s')`,并把 `V(s)`朝它推近──不需要模型──不需要完整的集集──由于在RHS上使用近似的`V`سوف يُدخّل الاختلافات، لكن الاختلافات أقل بكثير من الموسيقى، ويمكن التّحديث على الإنترنت من الخطوة الأولى.

هذا هو كل RL الحديث ((DQN、A2C、PPO、SAC) الاعتماد على التوالي.

## 概念

![Q-learning vs SARSA: off-policy max vs on-policy Q(s', a')](../assets/td.svg)

**用于 V 的 TD(0) update：**

`V(s) ← V(s) + α [r + γ V(s') - V(s)]`

方括号中量是 TD خطأ `δ = r + γ V(s') - V(s)`انها في مركز الموسيقى`G_t - V(s_t)` الإستجابة`α`满足 روبنز-مونرو`Σ α = ∞`،`Σ α² < ∞`وكل الدول تتم زيارتها بلا حدود

**Q-learning。**طريقة للتدريب غير السياسية للسيطرة:

`Q(s, a) ← Q(s, a) + α [r + γ max_{a'} Q(s', a') - Q(s, a)]`

`max`假设从 `s'`開始會遵循 *貪* السياسة،不管 وكيل 实际采取了什么行动──这种解让Q-learning 在代理 通过 ε-贪 探索时仍然学习`Q*`Mnih et al. (2015) 将将它转换为Atari 上的深度Q-学习(درس 05) 

**SARSA。**طريقة التدريب على السياسة:

`Q(s, a) ← Q(s, a) + α [r + γ Q(s', a') - Q(s, a)]`

هذا الاسم يأتي من توبل`(s, a, r, s', a')` SARSA استخدام الوكيل                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `a'`، وليس طمعياً`argmax` سوف تتلقى إلى حالياً`π`على`Q^π`في الحد الأقصى`ε → 0`سوف تتحول`Q*`.

**cliff-walking 的差异。**في المهام الكلاسيكية للمشي على الصخره ((انخفض الصخره = مكافأة -100) ، تعلم Q-التعلم تعلم أفضل الطرق على حافة الصخره ، ولكن في بعض الأحيان في فترة التنقيب سوف تناول العقاب.`ε → 0`في الممارسة، هذا مهم: عندما يتم نشر بالفعل في البحث، سيقوم سلوك السارسا بشكل أكثر حفاظا.

**Expected SARSA。**استخدام`π`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `Q(s', a')`:

`Q(s, a) ← Q(s, a) + α [r + γ Σ_{a'} π(a'|s') Q(s', a') - Q(s, a)]`

方差低于 SARSA(不对 `a'`采样) ، الهدف هو نفس الشيء على السياسة.

**n-step TD 和 TD(λ)。**通過 الانتظار `n`步再 bootstrap,在 TD(0) و MC 之间插值──`n=1`نعم ،`n=∞`هو MC---TD(λ)`(1-λ)λ^{n-1}`على كل شيء`n`求平均── معظم العميقة-RL استخدام بين 3 إلى 20  `n`.


```figure
qlearning-gridworld
```

## بناءها

### الخطوة الأولى: SARSA على أساس سياسة البطش

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

الاختلاف الوحيد بين التعلم القياسي والهدف هو ذلك الجهد

### الخطوة الثانية: تعلم القواعد

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

`max`هذا هو التمييز بين السياسة والسياسة الخارجيّة

### 步骤 3: منحنى التعلم

المتابعة كل 100 حلقة من متوسط العودة. Q-التعلم في التأكد البسيط. GridWorld 上收更快.SARSA 在悬崖行走 上更保守.`code/main.py`4×4 شبكة العالم وسط، اثنين في `α=0.1, ε=0.1`أسفل، حوالي 2000 حلقة 后都接近最优──

### الخطوة 4: مقارنة مع قيمة DP الحقيقية

运行 التكرار القيمة ((درس 02) الحصول على `Q*` التفتيش`max_{s,a} |Q_learned(s,a) - Q*(s,a)|` عميل TD صحي في 4×4 GridWorld  تدريب 10،000 حلقة  بعد ذلك، يجب أن تسقط `~0.5`فى الداخل

## فخ

- **初始 Q values 很重要。**乐观初始化 负奖励 任务中 `Q = 0`. سوف تشجع البحث. . .
- **α schedule。**常数 `α`على مشاكل عدم الاستقرار يمكن أن تُعدل`α_n = 1/n`في النظرية يمكن الحصول على، ولكن في الممارسة البدنية جدا.`α`ثبثت`[0.05, 0.3]`,并监控 منحنى التعلم
- **ε schedule。**از高值开始`ε=1.0`), انخفاض إلى `ε=0.05`"جلي" ((طموح في الحد مع استكشاف لا نهائي)
- **Q-learning 中的 max bias。**عندما`Q`عندما يكون هناك ضجيج`max`المستخدم وجوداً فوق التمييزات. سوف يؤدي إلى ارتفاع التقدير. تعلم هاسلت المزدوج Q.
- **非终止 episodes。**TD يمكن أن تتعلم في حالة عدم وجود محطات ، ولكن تحتاج إلى الحد من الخطوات ، أو في الحد الأقصى بشكل صحيح معالجة bootstrap.
- **State hashing。**إذا كانت الحالات هي توبلات/مضغوطات، استخدام قابل للتشغيل مفتاحات

## استخدمها

منظمة التنمية الوطنية لعام 2026:

| Task | Method | Reason |
|------|--------|--------|
| 小型 tabular environments | Q-learning | 直接学习 optimal policy。 |
| On-policy safety-critical | SARSA / Expected SARSA | 探索期间更保守。 |
| High-dimensional state | DQN (Phase 9 · 05) | 带 replay 和 target net 的 Neural Network Q-function。 |
| Continuous actions | SAC / TD3 (Phase 9 · 07) | 在 Q-network 上做 TD update；policy net 发出 actions。 |
| LLM RL (reward-model-based) | PPO / GRPO (Phase 9 · 08, 12) | 使用通过 GAE 得到的 TD-style advantage 的 actor-critic。 |
| Offline RL | CQL / IQL (Phase 9 · 08) | 带 conservative regularization 的 Q-learning。 |

ستقوم بالتحديث المذكور في مقال عام 2026، ويعتبر هذا التعلم من نوع ما أو SARSA.

## 交付 it

保存为 `outputs/skill-td-agent.md`:

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

## التدريب

1. **Easy。**في 4×4 GridWorld 上实现 Q-learning 和 SARSA── رسم 2,000 个剧情的学习曲线(每 100 个剧情的平均回报)──谁收更快?
2. **Medium。**构建一个悬崖行走环境(4×12,最后一行是悬崖,奖励 -100 并重置到起点)  مقارنة Q-learning 和 SARSA  السياسات النهائية 截图展示它们各自走过的路径──哪个更接近悬崖?
3. **Hard。**实现 Double Q-learning──在噪音-reward GridWorld 上(给每步奖励 添加高斯音 σ=5),展示 Q-learning 会明显高估 `V*(0,0)`و "التعلم المزدوج للق" لا يُمكنك

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
- [Watkins & Dayan (1992). Q-learning](https://link.springer.com/article/10.1007/BF00992698) 原始论文和收证明。
- [Sutton & Barto (2018). Ch. 6 — Temporal-Difference Learning](http://incompleteideas.net/book/RLbook2020.pdf) TD(0) 、SARSA、Q-تعلم、توقعات SARSA‬
- [Hasselt (2010). Double Q-learning](https://papers.nips.cc/paper_files/paper/2010/hash/091d584fced301b442654dd8c23b3fc9-Abstract.html) تعصب القياسية
- [Seijen, Hasselt, Whiteson, Wiering (2009). A Theoretical and Empirical Analysis of Expected SARSA](https://ieeexplore.ieee.org/document/4927542) توقعات SARSA ‬
- [Rummery & Niranjan (1994). On-line Q-learning using connectionist systems](https://www.researchgate.net/publication/2500611_On-Line_Q-Learning_Using_Connectionist_Systems) 创造 SARSA 这个术语的论文 (((كان يطلق عليه "التعلم المعدل للاتصال القي)))).
- [Sutton & Barto (2018). Ch. 7 — n-step Bootstrapping](http://incompleteideas.net/book/RLbook2020.pdf) 将 TD(0) 泛化到 TD(n) ، وهذا هو من Q-تعلم 走向 آثار التأهل، وكذلك بعد ذلك في PPO طريق GAE.
