# التنمية المتعددة والدول والإجراءات والمكافآت

> عملية قرار ماركوف تتكون من خمسة أشياء: الدول، الإجراءات، الانتقالات، الجوائز، الخصمات. كل شيء في RL: Q-تعلم،PPO،DPO،GRPO، كلها على هذا الشكل تحسين.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 1 · 06 (Probability & Distributions), Phase 2 · 01 (ML Taxonomy)
**Time:** ~45 minutes

## 问题

أنت تكتب روبوت الشطرنج أو مخطط مخزون أو وكيل تجاري أو حلقة PPO لتدريب نموذج التفكير

التعلم المشرف 给你 `(x, y)`زوجين،并 تطلب منك أن تُعدل وظيفة واحدة. تعزيز التعلم لا يعطيك علامات، فقط يعطيك سلسلة من الحالات، والإجراءات التي تتخذها، فضلا عن مكافأة مقياسية. هل هذا الخطوة فاز في اللعبة؟ هل قررت إعادة التأمين؟ هل نجحت هذه التجارة؟ هل جلمت الوهم التي تم إنشاؤها حديثاً من القاضي؟ هل جلبت مكافأة أعلى؟

قبل التشكيل، لم تتمكن من تعلم من هذا التدفق.  رأيت ما فعلت، ما حدث بعد ذلك.  كان هناك الكثير من الجيد. كل شيء يجب أن يصبح كائنًا يمكنك التفكير فيه.

## 概念

![Markov decision process: states, actions, transitions, rewards, discount](../assets/mdp.svg)

**五个对象。**

- **States** `S`في شبكة العمال، هو كوكس. في الشطرنج، هو كوكس. في ماجستير في الأعمال، هو نافذة السياق، زائد أي ذاكرة.
- **Actions** `A` تصرفات قابلة للاختيار                                                                                                                                                                                                                                                          
- **Transitions** `P(s' | s, a)` وضع محدد`s`و العمل`a`,الوضع التالي: توزيع: في الشطرنج: ديترمينستيكا، في المخزون: ستوكاستيكا، في فك الشهادة: ديترمينستيكا تقريبا
- **Rewards** `R(s, a, s')` 标量信号──赢 = +1,输 = -1──收入减成本──GRPO 中的日志-概率比率 项──
- **Discount** `γ ∈ [0, 1)`── مكافأة مستقبلية 相對于`γ = 0.99`买到大约100 خطوة من الأفق ؛`γ = 0.9`بيع حتى حوالي 10

**Markov property** `P(s_{t+1} | s_t, a_t) = P(s_{t+1} | s_0, a_0, …, s_t, a_t)`♪ المستقبل يعتمد فقط على الحالة الحالية♪ إذا لم يكن موجودا، فهذا يعني أن تمثيل الدولة غير كامل♪

**Policies 与 returns。**السياسة`π(a | s)`ضع الحالات 映射 إلى التوزيعات الإجراء `G_t = r_t + γ r_{t+1} + γ² r_{t+2} + …`هو المبلغ المخصوم من المكافآت المستقبلية.`V^π(s) = E[G_t | s_t = s]`في السياسة`π`من`s`开始的预期回报──Q-值 `Q^π(s, a) = E[G_t | s_t = s, a_t = a]`هو في عمل محدد بدء العائد المتوقع ‬ كل خوارزمية RL ستقدر واحدة من هذين الاثنين ثم تتحسن ‬`π`.

**Bellman equations。**كل المحتوى في هذه المرحلة سوف تستخدم حتى معادلات نقطة ثابتة:

`V^π(s) = Σ_a π(a|s) Σ_{s', r} P(s', r | s, a) [r + γ V^π(s')]`
`Q^π(s, a) = Σ_{s', r} P(s', r | s, a) [r + γ Σ_{a'} π(a'|s') Q^π(s', a')]`

它们把预期回报 拆成                                                                                                                                                                                                                                                          


```figure
discount-horizon
```

## بناءها

### الخطوة الأولى: MDP تحديدية صغيرة جدا

واحد 4×4 شبكة العالم── العميل من اليسار على الزاوية البداية، المحطة في اليمين على الزاوية السفلى، كل خطوة مكافأة 为 -1,اعمال 为 `{up, down, left, right}`见 `code/main.py`.

```python
GRID = 4
TERMINAL = (3, 3)
ACTIONS = {"up": (-1, 0), "down": (1, 0), "left": (0, -1), "right": (0, 1)}

def step(state, action):
    if state == TERMINAL:
        return state, 0.0, True
    dr, dc = ACTIONS[action]
    r, c = state
    nr = min(max(r + dr, 0), GRID - 1)
    nc = min(max(c + dc, 0), GRID - 1)
    return (nr, nc), -1.0, (nr, nc) == TERMINAL
```

五行──هذا هو كامل البيئة──تحولات تحديدية٬ حكم خطوة ثابتة٬الوضع النهائي الممتص

### الخطوة الثانية: وضع سياسة

السياسة هي من الحالة إلى وظيفة توزيع العمل.

```python
def uniform_policy(state):
    return {a: 0.25 for a in ACTIONS}

def rollout(policy, max_steps=200):
    s, total, steps = (0, 0), 0.0, 0
    for _ in range(max_steps):
        a = sample(policy(s))
        s, r, done = step(s, a)
        total += r
        steps += 1
        if done:
            break
    return total, steps
```

运行随机政策 1000 次── 运行随机政策 1000 次── 运行随机政策 1000 次── 运行随机政策 1000 次── 运行随机政策 1000 次── 运行随机政策 1000 次── 运行随机政策 1000 次── 运行随机政策 1000 次── 运行随机政策 1000 次── 运行随机政策 1000 次── 运行随机政策 1000 次── 运行随机政策 1000 次── 运行随机政策 1000 次── 运行随机政策 1000 次── 运行随机政策 1000 次── 运行随机政策 1000 次── 运行随机政策 1000 次── 运行随机政策 1000 次── 运行随机政策 1000 次── 运行随机政策 1000 次── 运行随机政策 运行随机政策 运行随机政策 运行随机政策 运行随机政策 运行随机政策 运行随机政策 运行随机政策 运行随机政策 运行随机政策 运行 运行随机率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率率

### الخطوة الثالثة: من خلال معادلة بيلمان 精确计算 `V^π`

بالنسبة للمعدلات الصغيرة، تعادل بيلمان هو نظام خطي.

```python
def policy_evaluation(policy, gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in all_states()}
    while True:
        delta = 0.0
        for s in all_states():
            if s == TERMINAL:
                continue
            v = 0.0
            for a, pi_a in policy(s).items():
                s_next, r, _ = step(s, a)
                v += pi_a * (r + gamma * V[s_next])
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            return V
```

هذا هو تقييم السياسة المتكرر. إنه أول خوارزمية في ستون و بارتو، وهو أيضاً أساس نظري لكل طريقة RL لاحقة.

### الخطوة الرابعة:`γ`هو مفاتيح فائقة ذات معنى فيزيائي

الأفق الفعال تقريباً`1 / (1 - γ)`.`γ = 0.9`→ 10 خطوات`γ = 0.99`100 خطوة`γ = 0.999`1000 خطوة

太低时,代理 会目光短浅──太高时, 信用分配会变噪, لأن العديد من الخطوات المبكرة مدينة سوف تتحمل معا المسؤولية عن مكافأة في المستقبل بعيد──LLM RLHF عادة استخدام `γ = 1`,因为 الحلقات 短且有界──تحكم في المهام 使用 `0.95–0.99`ألعاب استراتيجية طويلة الأجل`0.999`.

## فخ

- **Non-Markovian state.**إذا كنت بحاجة إلى ثلاثة مشاهدات قريبا 才能决策، ثم state ليس فقط حاليا مشاهدة‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
- **Sparse rewards.**فقط في فوزك في المكافأة، سوف تجعل التعلم في الفضاء الكبير من المستحيل تقريبا.
- **Reward hacking.**优化代理奖励 经常产生病态行为──OpenAI's boat-racing agent 一直原地转圈收集 powerups,而不是完成比赛──始终从目标结果定义奖励,而不是从代理 定义──
- **Discount mis-spec.**في مهمة الأفق المحدود 上 استخدام `γ = 1`سأجعلها كل قيمة تصبح لا نهاية لها`γ < 1`الحد من ذلك
- **Reward scale.**{+100، -100} مع {+1, -1} مكافآت سوف تعطى نفس السياسات المثلى، ولكن حجم درجة 会 مختلف جدا.`[-1, 1]`.

## استخدمها

قبل أن يتم تعيين كل خط أنابيب RL في عام 2026 إلى MDP:

| Situation | State | Action | Reward | γ |
|-----------|-------|--------|--------|---|
| Control（locomotion, manipulation） | Joint angles + velocities | Continuous torques | Task-specific shaped | 0.99 |
| Games（chess, Go, poker） | Board + history | Legal move | Win=+1 / loss=-1 | 1.0（finite） |
| Inventory / pricing | Stock + demand | Order qty | Revenue - cost | 0.95 |
| RLHF for LLMs | Context tokens | Next token | Reward-model score at end | 1.0（episode ~200 tokens） |
| GRPO for reasoning | Prompt + partial response | Next token | Verifier 0/1 at end | 1.0 |

قبل كتابة أي حلقة تدريبية، اكتب أولاً هذا الخمسة مجموعة.

## أرسله

保存为 `outputs/skill-mdp-modeler.md`:

```markdown
---
name: mdp-modeler
description: 给定一个 task description，在训练前产出 Markov Decision Process spec 并标记 formulation risks。
version: 1.0.0
phase: 9
lesson: 1
tags: [rl, mdp, modeling]
---

给定一个 task（control / game / recommendation / LLM fine-tuning），输出：

1. State。精确的 feature vector 或 tensor spec。解释 Markov property。
2. Action。Discrete set 或 continuous range。Dimensionality。
3. Transition。Deterministic、stochastic-with-known-model，或 sample-only。
4. Reward。Function 与 source。Sparse vs shaped。Terminal vs per-step。
5. Discount。Value 与 horizon justification。

拒绝交付任何 state 为 non-Markovian、且未明确提到 frame-stacking 或 recurrent state 的 MDP。拒绝任何不是根据 target outcome 定义的 reward。标记 infinite-horizon task 上的任何 `γ ≥ 1.0`。标记任何 reward range 超过 typical step reward 100x 的情况，因为这很可能是 gradient-explosion source。
```

## التدريب

1. **Easy.**في`code/main.py`中实现 4×4 GridWorld 和 random-policy rollout──运行 10,000 个集──报告 return 的 mean 和 std──与最佳回报(-6)比较──
2. **Medium.**للسياسة الموحدة العشوائية, استخدام `γ ∈ {0.5, 0.9, 0.99}`运行 `policy_evaluation`把每个 `V`طباعة على شبكة 4×4 ‬ شرح لماذا المحطة  القريبة قيم الحالة 会随之大`γ`更快增长.
3. **Hard.**أن نغير شبكة العالم إلى مستوائية: كل عمل على احتمال`p = 0.1`滑向相邻方向── إعادة تقييم السياسة الموحدة──`V[start]`هل ستصبح أفضل أم سيء؟

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| MDP | “Reinforcement Learning setup” | 满足 Markov property 的元组 `(S, A, P, R, γ)`。 |
| State | “Agent 看到的东西” | 在所选 policy class 下，future dynamics 的 sufficient statistic。 |
| Policy | “Agent 的行为” | Conditional distribution `π(a \| s)` 或 deterministic map `s → a`。 |
| Return | “Total reward” | 从当前 step 开始的 discounted sum `Σ γ^t r_t`。 |
| Value | “一个 state 有多好” | 在 `π` 下从 `s` 开始的 expected return。 |
| Q-value | “一个 action 有多好” | 在 `π` 下从 `s` 开始并以第一个 action `a` 开始的 expected return。 |
| Bellman equation | “Dynamic programming recursion” | 把 value / Q 分解为 one-step reward 加 discounted successor value 的 fixed-point。 |
| Discount `γ` | “未来 vs 现在” | 远未来 reward 的 geometric weight；effective horizon 为 `~1/(1-γ)`。 |

## 延伸阅读

- [Sutton & Barto (2018). Reinforcement Learning: An Introduction, 2nd ed.](http://incompleteideas.net/book/RLbook2020.pdf) 教科书。第 3 章介绍 MDPs 和 بيلمان معادلات;第 1 章 طرح فرضية مكافأة, it支后续每一课──
- [Bellman (1957). Dynamic Programming](https://press.princeton.edu/books/paperback/9780691146683/dynamic-programming) مصدر معادلة بيلمان
- [OpenAI Spinning Up — Part 1: Key Concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html) من زاوية عميقة من الرال 写的简洁 MDP primer──
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887)  حول MDPs وطرق الحل الدقيق عمليات البحث 参考書。
- [Littman (1996). Algorithms for Sequential Decision Making (PhD thesis)](https://www.cs.rutgers.edu/~mlittman/papers/thesis-main.pdf) وضع MDPs  كمرشد للتبرمجة الديناميكية
