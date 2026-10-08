# التخطيط الديناميكي  تعديل السياسات وتعديل القيمة

> البرمجة الديناميكية هي معركة لتحقيقات الاختلافات. أنت تعرف بالفعل وظائف الانتقال والمكافأة.`V`أو`π`لا يعد تغيراً. إنها طريقة تستند إلى العينات التي تحاول تقترب من المبدأ.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs)
**Time:** ~75 minutes

## 问题

لديك نموذج معروف من MDP: يمكنك على أي زوج العمل الحكومي استفسار `P(s' | s, a)`和 `R(s, a, s')` إدارة المخزونات تعرف الاحتياجات التوزيع‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

النموذج الحر RL ((Q-تعلم、PPO、REINFORCE) هو حالة من عدم وجود نموذج، وذلك يعني أنك فقط يمكن أن نأخذ منها نموذج من البيئة. ولكن عندما يكون لديك نموذج، هناك طريقة أسرع وأفضل: البرمجة الديناميكية. بيلمان صمم هذه الطرق في عام 1957.

ستظل تحتاج إليها في عام 2026، هناك ثلاثة نقاط. أولاً، كل البحث في كل بيئة جدولية (GridWorld、FrozenLake、CliffWalking) سوف تستخدم DP 求解، لإنشاء سياسة معيار الذهب.`V*(s_0)`التقديرات مع DP 答案相差 30٪، فإن Q-تعلمك على وجود حذاء.

## 概念

![Policy iteration and value iteration, side by side](../assets/dp.svg)

**两个算法，都是 Bellman 上的 fixed-point iteration。**

**Policy iteration。**交替执行两步,直到 السياسة لا تتغير ثانية.

1. *التقييم:* 给定 السياسة `π`,反复 تطبيق`V(s) ← Σ_a π(a|s) Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`حتى تصل، حتى تُحسب`V^π`.
2. *تحسين:* 给定 `V^π`،让 `π`مقارنة`V^π`变为 لالية:`π(s) ← argmax_a Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`.

وكل خطوة تحسين يجب أن تبقى`π`لا يتغير، يجب أن تحسن بشكل صارم بعض الولايات`V^π`، ((ب) مساحة السياسات الحتمية محدودة. حتى في المساحات الحكومية الكبيرة، عادة ما تكون في حوالي 520 مرة التكرارات الخارجية داخل收──

**Value iteration。**ستقوم بتقييم وتحسين 合并成一次扫扫―― تطبيق معادلة بيلمان *المناسبة*:

`V(s) ← max_a Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`

重复 حتى `max_s |V_{new}(s) - V(s)| < ε`◊ أخيرًا من خلال اختيار الإجراء الجشع 提取 السياسة‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬

**Generalized policy iteration (GPI)。**统一视角──عمل القيمة 和 السياسة محجوزة في حلقة تحسين متجهة إلى جانبين؛ أي في الوقت نفسه دفع الثاني إلى الاتجاه المتوافق من الطرق:

**为什么 `γ < 1` 很重要。**عامل بيلمان في ظل القاعدة`γ`-التقلص:`||T V - T V'||_∞ ≤ γ ||V - V'||_∞`تعني الانقباض نقطة ثابتة وحيدة ويعني انقطاع`γ < 1`،أنت فقدت ضمانة، تحتاج إلى أفق محدود أو امتصاص الحالة النهائية

## 动手构建

### الخطوة الأولى: 构建 GridWorld MDP

استخدام دراسة 01 في نفس 4×4 شبكة العالم.`0.1`احتمالات التدفق في اتجاه مستقيم

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

`transitions(s, a)`عودتي`(s', r, p)`列表──هذا هو النموذج بأكمله──

### الخطوة الثانية: تقييم السياسات

给定政策 `π(s) = {action: prob}`، 代 معادلة بيلمان، حتى `V`غير متغير:

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

### الخطوة الثالثة: تحسين السياسات

مع مقابل`V`سياسة طمعية`π`إذا`π`لا تغير، نحن عائدين لأننا وصلنا إلى المثالي

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

### الخطوة الرابعة:

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

في 4×4 上典型会在 46 مرات التكرارات الخارجية 内收──输出 `V*(0,0) ≈ -6`و سياسة تقليل عدد الخطوات

### الخطوة 5: التكرار القيمة

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

نفس النقطة الثابتة، أقل من عدد أدوات الكود

## 常见陷

- **忘记处理 terminals。**إذا كنت تطبق حالة امتصاص بيلمان، فإنه لا يزال يحصل على شيء لا يتغير من أفضل عمل`if s == terminal: V[s] = 0`الوقاية
- **Sup-norm vs L2 convergence。**استخدام `max |V_new - V|`لا تستخدم متوسط القيمة.
- **In-place vs synchronous updates。**أحدث`V[s]`(غاوس-سايدل) مقارنة باستخدام منفصل`V_new`dict(Jacob)收更快──مدونة الإنتاج استخدام في المكان──
- **Policy ties。**إذا كانت الإجراءات الثلاث نفس القيمة Q،`argmax`ربما كل مرة تكرار باستخدام طريقة مختلفة لتحطيم المواقف، مما يؤدي إلى استقرار السياسة  检查振荡── استخدام استقرار التماسك- وقف (((الفعال الأول في الترتيب الثابت)。
- **State-space explosion。**كل مرة يُسحفُونها`O(|S| · |A|)`◊ الأكثر قابلية للاستخدام في حوالي 107 州── فوق هذا الحجم، تحتاج إلى تقارب الوظيفة ((مرحلة 9 · 05 وما بعدها) 


```figure
value-iteration-gamma
```

## استخدمها

في عام 2026، دبي هو صحيحة، أيضا الخطة الداخلية:

| Use case | Method |
|----------|--------|
| 精确求解小型 tabular MDP | Value iteration（更简单）或 policy iteration（outer steps 更少） |
| 验证 Q-learning / PPO 实现 | 在 toy environment 上与 DP-optimal V* 对比 |
| Model-based RL（Phase 9 · 10） | 在 learned transition model 上做 Bellman backup |
| AlphaZero / MuZero 中的 Planning | Monte Carlo Tree Search = async Bellman backup |
| Offline RL（CQL、IQL） | Conservative Q-iteration，即带有 OOD actions penalty 的 DP |

عندما يقول شخص ما أن "القدر المثالي للعمل" هو "القطة الثابتة"`V*`أو`Q*`时, رجاءً تخيل هذه الحلقة

## 交付 it

保存为 `outputs/skill-dp-solver.md`:

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

## التدريب

1. **Easy.**في 4×4 GridWorld 上使用 `γ ∈ {0.9, 0.99}`运行 التكرار القيمة`max |ΔV| < 1e-6`كم مرة تحتاج إلى مسح؟`V*`طباعة لـ 4 × 4 شبكة
2. **Medium.**في *استوكاستيك* GridWorld ((احتمالات التزلج `0.1`) على مقارنة التكرار السياسة 和 التكرار القيمة`V*(0,0)`أي من التكرارات أعلى استقبلية أسرع؟ أي من ساعات الجدار أعلى أسرع؟
3. **Hard.**构建修改政策 وتكرار: في مرحلة التقييم 中, فقط运行 `k`بعد ذلك، ثمّة عملية، بدلاً من أنّها تُمْرَكُ إلى المُستقبل.`k ∈ {1, 2, 5, 10, 50}`رسم`V*(0,0)`خطأ vs`k`                                                                                                                                                                                                                                                              

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

- [Sutton & Barto (2018). Ch. 4 — Dynamic Programming](http://incompleteideas.net/book/RLbook2020.pdf) التكرار السياسة و التكرار القيم
- [Bertsekas (2019). Reinforcement Learning and Optimal Control](http://www.athenasc.com/rlbook.html) على خريطة التقلص 论证的严谨处理──
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887) تكرار السياسات المعدل  وتحليل التقارب لها
- [Howard (1960). Dynamic Programming and Markov Processes](https://mitpress.mit.edu/9780262582300/dynamic-programming-and-markov-processes/) الورقة الإنتقالية للسياسة الأصلية
- [Bertsekas & Tsitsiklis (1996). Neuro-Dynamic Programming](http://www.athenasc.com/ndpbook.html) من DP إلى تقريب-DP / عميق RL من جسر، بعد كل فصل من الدروس سوف تستخدم حتى
