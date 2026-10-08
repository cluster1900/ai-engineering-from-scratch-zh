# الـ RL متعددة الوكلاء

> الوكيل الواحد RL 假设环境是静止的──把两个正在学习的代理 放进同一个世界,这个假设就会失效: كل وكيل هو جزء من الوكيل الآخر 环境,而且都在变化──多 وكيل RL 是一组让学习在马科夫假设不再成立时仍能收取技巧──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (Q-learning), Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~45 minutes

## 问题

روبوت يتعلم السير في غرفة ، هو عامل واحد رل  مشكلة. فريق كرة قدم ليس. النجوم على الفا ستاركرافت على الأيدي ليس. سوق من قبل وكلاء العرض. ليس.

في كل إعداد متعدد الوكلاء ، من وجهة نظر أي وكيل ، فإن العاملين الآخرين * هم * جزء من البيئة. مع تعلمهم وتغيير سلوكهم ، يصبح البيئة غير ثابتة.

هذا سيقضي برهانات التقويم الجدري (((التعلم القياسي من ضمان افتراض أن البيئة ثابتة))

تطبيقات عام 2026 تشمل: حشود الروبوتات، توجيه المرور، أسطولات المركبات المستقلة، محاكاة السوق، أنظمة LLM متعددة الوكلاء (مرحلة 16) ، وكذلك أي لعبة لديها العديد من اللاعبين الذكاء.

## 概念

![Four MARL regimes: indep, centralized critic, self-play, league](../assets/marl.svg)

**Formalism: Markov Game.**التعميم العام للمدينة: الدول`S`العمل المشترك`a = (a_1, …, a_n)`الانتقال`P(s' | s, a)`، و مكافآت كل عميل`R_i(s, a, s')`كل عميل`i`في سياسة خاصة بك`π_i`أساعدك على تحقيق العائد**fully cooperative**إذا كان صفر-جمع، فإنه هو**adversarial**إذا اختلط، إذا هو**general-sum**.

**核心挑战：**

- **Non-stationarity.**من العميل`i`من وجهة نظر،`P(s' | s, a_i)`取决于`π_{-i}`و هو يتغير
- **Credit assignment.**في المكافأة المشتركة، أي وكيل أدى إليها؟
- **Exploration coordination.**يجب على العملاء استكشاف استراتيجيات التكامل، وليس إعادة استكشاف نفس الدولة.
- **Scalability.**مساحة العمل المشتركة`n`. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
- **Partial observability.**كل عميل يستطيع رؤية ملاحظاته الخاصة، الحالة العالمية مخفية

**四种主导范式：**

**1. Independent Q-learning / independent PPO (IQL, IPPO).**كل عميل تعلم Q أو سياسة خاصة به، وجعل العملاء الآخرين جزء من بيئة العمل.

**2. Centralized training, decentralized execution (CTDE).**كل عميل لديه سياسة خاصة به`π_i`، إنه بمراقبة محلية`o_i`و في ظل تطبيقها، كان هناك تنفيذ مركزي للقيام به.`Q(s, a_1, …, a_n)`في حالة عالمية كاملة و العمل المشترك كشرط:
- **MADDPG**(لو وآخرون 2017): 带有每个 وكيل واحد مركزية النقاد من DDPG。
- **COMA**(فوارستر وزملاء 2017): نقطة أساسية مضادة للواقع`a'`, مكافأتي ستكون كم؟
- **MAPPO**- لا ، لا**IPPO**مع النقاد المشترك (Yu et al. 2022): 带有 مركزية وظيفة القيمة PPO──2026 سنة التعاونية MARL 中的主导方法──
- **QMIX**(Rashid et al. 2018): تدهور القيمة`Q_tot(s, a) = f(Q_1(s, a_1), …, Q_n(s, a_n))`,并使用 اختلاط واحد

**3. Self-play.**نفس العميل اثنين نسخة من بعضها البعض على مقاتل. سياسة المقابل *就是*我过去某快照 中的政策── ألفاغو / ألفا زيرو / MuZero──OpenAI Five──最适合零sum游戏;训练信号是对称的──

**4. League play.**التوسع في البيئات العامة / المضادة: الحفاظ على مجموعة من السياسات السابقة والحاضرة ، من الدوري من الصين استنتاج خصم ، ومستهدفها تدريب.

**Communication.**允许 العملاء  إرسال رسائل تعلمت لبعضهم البعض `m_i`في إعدادات التعاونية 中有效──Foerster et al. (2016) 表明,مُتَمَيِّزُ التواصلُ بين الوكلاءِ يمكنُ التَدريبُ من نهايةٍ إلى آخر── اليومُ على أساس أنظمةُ متعددة الوكلاءِ في ماجستيرِ في العلوم التدريبية (Phase 16) في الأساسُ تُستخدمُ في التواصلِ باللغة الطبيعية──


```figure
f3-marl-orbit
```

## بناءها

هذا الدراسة تستخدم 6 × 6 شبكة عالمية، تتضمن اثنين من العملاء التعاونيين.`-1`؛ دوتدو حتى الوقت`+10`参见 `code/main.py`.

### الخطوة الأولى: بيئة متعددة الوكلاء

```python
class CoopGridWorld:
    def __init__(self):
        self.size = 6
        self.goal = (5, 5)

    def reset(self):
        return ((0, 0), (5, 0))  # 两个 agents

    def step(self, state, actions):
        a1, a2 = state
        new1 = move(a1, actions[0])
        new2 = move(a2, actions[1])
        done = (new1 == self.goal) and (new2 == self.goal)
        reward = 10.0 if done else -1.0
        return (new1, new2), reward, done
```

*المجال المشترك* للعمل هو `|A|² = 16`الدولة العالمية هي مكانان

### 步骤 2: تعلم Q المستقل

كل عميل 运行 الخاص بك Q-جداول،以 سوية حالة 作为关键.

```python
def independent_q(env, episodes, alpha, gamma, epsilon):
    Q1, Q2 = defaultdict(default_q), defaultdict(default_q)
    for _ in range(episodes):
        s = env.reset()
        while not done:
            a1 = epsilon_greedy(Q1, s, epsilon)
            a2 = epsilon_greedy(Q2, s, epsilon)
            s_next, r, done = env.step(s, (a1, a2))
            target1 = r + gamma * max(Q1[s_next].values())
            target2 = r + gamma * max(Q2[s_next].values())
            Q1[s][a1] += alpha * (target1 - Q1[s][a1])
            Q2[s][a2] += alpha * (target2 - Q2[s][a2])
            s = s_next
```

إنها فعالة في هذه المهمة، لأن المكافآت كثيفة ومكافحة. في المهام المرتبطة بشكل وثيق، سوف تفشل.

### الخطوة 3: Q المركزية مع تحديث القيمة المتدهورة

للعمل المشترك استخدم Q:`Q(s, a_1, a_2)` باستخدام مكافأة مشتركة 更新──执行时通过 هامشية 来 لامركزية:`π_i(s) = argmax_{a_i} max_{a_{-i}} Q(s, a_1, a_2)` استعملت مساحة العمل المشتركة من مستوى المؤشر بدلاً من وجهة نظر عالمية صحيحة

### 步骤 4: 简单 لعبة شخصية

وكيل واحد، دوران. وكيل تدريب A ضد وكيل B.`K`个集,把 A 的重量 复制到 B。对称训练,进展一致── AlphaZero 配方 的缩写版──

## 常见陷

- **Non-stationary replay.**استخدام الوكلاء المستقلين 时, تجربة إعادة اللعب أكثر من الوكيل الواحد وأسوأ, لأن الانتقالات القديمة هي من قبل المعارضين الذين انتهوا من الوقت الآن 生成的──修复: حسب الأخيرة 重新标注或加权──
- **Credit assignment ambiguity.**长 后得到共享奖励;没有明确方式说明哪个代理做出贡献──修复:
- **Policy drift / chasing.**أفضل استجابة لكل وكيل تتغير مع تحديث وكيل آخر.
- **Reward hacking via coordination.**العاملون 找到了 المصممون لا يتوقعون أن يتم تنسيق الاستغلالات.
- **Exploration redundancy.**两个 وكيل 探索相同的状态-action زوجات──修复: كل وكيل استخدام مكافآت الانتروبيا، أو تكوين الدور──
- **League cycles.**純自玩可能卡在支配周期 中──修复:使用包含多样对手的联赛比赛──
- **Sample explosion.** `n`个 عوامل × مساحة الحالة × إجراءات مشتركة。用 وظيفة مقربة 近似; استخدام مساحات العمل المفصلة(كل عامل واحد رأس الخروج السياسة)。

## استخدمها

2026 سنة MARL 应用图谱:

| Domain | Method | Notes |
|--------|--------|-------|
| Cooperative navigation / manipulation | MAPPO / QMIX | CTDE；shared critic + decentralized actors。 |
| Two-player games (chess, Go, poker) | Self-play with MCTS (AlphaZero) | Zero-sum；对称训练。 |
| Complex multiplayer (Dota, StarCraft) | League play + imitation pretraining | OpenAI Five, AlphaStar。 |
| Autonomous-vehicle fleets | CTDE MAPPO / PPO with attention | Partial obs；可变 team sizes。 |
| Auction markets | Game-theoretic equilibrium + RL | 当 `n` → ∞ 时使用 mean-field RL。 |
| LLM multi-agent systems (Phase 16) | Natural-language comm + role conditioning | RL loop 位于 agent-planning layer。 |

في عام 2026، يستند مجال النمو الأكبر في مارل إلى نظام LLM: يتم إجراء مشاورات، من خلال مجموعة من وكلاء نموذج اللغة، والتي تتكون من المشاركين في المناقشات، والنقاشات، والبناء في البرامج.

## 交付 it

保存为 `outputs/skill-marl-architect.md`:

```markdown
---
name: marl-architect
description: 为给定任务选择正确的 multi-agent RL regime（IPPO, CTDE, self-play, league）。
version: 1.0.0
phase: 9
lesson: 10
tags: [rl, multi-agent, marl, self-play]
---

给定一个包含 `n` 个 agents 的任务，输出：

1. Regime classification。Cooperative / adversarial / general-sum。说明理由。
2. Algorithm。IPPO / MAPPO / QMIX / self-play / league。理由要关联 coupling tightness 和 reward structure。
3. Information access。Centralized training（哪些 global info 会进入 critic）？Decentralized execution？
4. Credit assignment。Counterfactual baseline、value decomposition，或 reward shaping。
5. Exploration plan。Per-agent entropy、population-based training，或 league。

在 tightly-coupled cooperative tasks 上拒绝 independent Q-learning。拒绝为存在 cycle risks 的 general-sum 推荐 self-play。标记任何没有 fixed-opponent eval 的 MARL pipeline（cherry-picked self-play numbers 很常见）。
```

## التدريب

1. **Easy.**في تعاونية الوكيلين GridWorld 上 تدريب مستقل Q-تعلم‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
2. **Medium.**إضافة مهمة التنسيق: فقط عندما يقوم عملاء اثنان في نفس الحلقة على الهدف، يكون العدد قد وصل إلى الهدف.
3. **Hard.**‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Markov game | "Multi-agent MDP" | `(S, A_1, …, A_n, P, R_1, …, R_n)`；每个 agent 都有自己的 reward。 |
| CTDE | "Centralized training, decentralized execution" | Training time 使用 joint critic；每个 agent 的 policy 只使用 local obs。 |
| IPPO | "Independent PPO" | 每个 agent 单独运行 PPO。简单 baseline；经常被低估。 |
| MAPPO | "Multi-agent PPO" | 带有以 global state 为条件的 centralized value function 的 PPO。 |
| QMIX | "Monotonic value decomposition" | `Q_tot = f_monotone(Q_1, …, Q_n)` 允许 decentralized argmax。 |
| COMA | "Counterfactual multi-agent" | Advantage = 我的 Q 减去对我的 action 做 marginalizing 后的 expected Q。 |
| Self-play | "Agent vs past self" | 单个 agent，两个 roles；zero-sum games 的标准方法。 |
| League play | "Population training" | 缓存过去的 policies，从 pool 中采样 opponents；处理 strategy cycles。 |

## 延伸阅读

- [Lowe et al. (2017). Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments (MADDPG)](https://arxiv.org/abs/1706.02275) 带 مركزية للمنتقدين
- [Foerster et al. (2017). Counterfactual Multi-Agent Policy Gradients (COMA)](https://arxiv.org/abs/1705.08926) باستخدام خطوط أساسية معادلة لتخصيص الائتمان
- [Rashid et al. (2018). QMIX: Monotonic Value Function Factorisation](https://arxiv.org/abs/1803.11485) 带 带 monotonicity قيمة التفكك
- [Yu et al. (2022). The Surprising Effectiveness of PPO in Cooperative Multi-Agent Games (MAPPO)](https://arxiv.org/abs/2103.01955)"الـ"بـ" لـ"مارل"
- [Vinyals et al. (2019). Grandmaster level in StarCraft II using multi-agent reinforcement learning (AlphaStar)](https://www.nature.com/articles/s41586-019-1724-z)لعبة الدوري الكبيرة
- [Silver et al. (2017). Mastering the game of Go without human knowledge (AlphaGo Zero)](https://www.nature.com/articles/nature24270)ألعاب الصفر المجموعة وسط لعبة ذاتية
- [Sutton & Barto (2018). Ch. 15 — Neuroscience & Ch. 17 — Frontiers](http://incompleteideas.net/book/RLbook2020.pdf)  يحتوي على تعليميات لتعديلات متعددة الوكلاء ومشكلة عدم الثبات، بينما تم تصميم CTDE لحل هذه المشكلة.
- [Zhang, Yang & Başar (2021). Multi-Agent Reinforcement Learning: A Selective Overview](https://arxiv.org/abs/1911.10635) تغطية التعاونيات والمنافسية ومختلطة الممارسات والمنتجات التقاربية
