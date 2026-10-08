# شبكات Q العميقة (DQN)

> 2013: Mnih في الباكسلات الأصلية 上 تدريب شبكة Q-التعلم، فاز في سبعة Atari 游戏中 جميع وكيل RL الكلاسيكي.

**类型：**بناء
**语言：**بايثون
**前置要求：**المرحلة 3 · 03 (الترويج الخلفي) ، المرحلة 9 · 04 (تعلم القيود، SARSA)
**时间：**75 دقيقة

## 问题

المجلس التدريبي Q-تعلم  بحاجة للحد (الوضع، العمل) لتحفظ منفردة واحد Q-قيمة ∙ لوح شطرنج ∙ هناك حوالي 1043 ‬الوضع ∙ ∙ ‬الصور Atari ‬ هو 210 × 160 × 3 = 100,800 ‬الخصائص ∙ ‬المجلس التدريبي RL في عدة آلاف من الولايات ‬سيبدأ في التفطير، ‬لا حاجة إلى قول مليارات من الولايات ‬

في الواقع، الطريقة التي تعديلها واضحة جداً:`Q(s, a; θ)`بدل جدول Q- ولكن بعد هذه الحوادث، من الواضح استغرق عدة عقود حتى وصلنا إلى هنا‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

1. **Experience replay**让过渡 去相关──
2. **Target network**结 هدف إطلاق المفتاح
3. **Reward clipping**归一化 تراجع 幅度。

كان DQN في Atari على سبيل المثال لأول مرة باستخدام واحد من البكسلات وحدة المعلمات المفرطة المجموعة ، من البكسلات الأصلية  حلها عدة عشرات المشاكل التحكم. بعد ذلك تم بناء جميع عميق-RL الوسائل ، بما في ذلك DDQN ، Rainbow ، المواجهة ، التوزيع ، R2D2 ، وكيل 57 ، كلها على أساس هذه الممارسات الثلاث.

## 概念

![DQN training loop: env, replay buffer, online net, target net, Bellman TD loss](../assets/dqn.svg)

**目标。**DQN في وظيفة Q العصبية 上 تقليل الخسارة TD خطوة واحدة:

`L(θ) = E_{(s,a,r,s')~D} [ (r + γ max_{a'} Q(s', a'; θ^-) - Q(s, a; θ))² ]`

`θ`= شبكة الإنترنت، كل خطوة من خلال التراجع التدريجي 更新──`θ^-`= شبكة المستهدفة، من`θ`复制(تقريباً في كل 10,000 خطوة مرة واحدة)`D`= عازف إعادة تشغيل الانتقالات الماضية

**三个技巧，按重要性排序：**

**Experience replay。**واحد يتضمن`~10⁶`خفيفة حلقة الانتقالات. كل خطوة تدريبية ستكون متكاملة مع نموذج صغير. هذا سوف ينفجر الوقت.

**Target network。**في كل جانب من طريق بيلمان يستخدم نفس الشبكة`Q(·; θ)`،سوف يجعل الهدف يتحرك في كل تحديث ، أي  تتبعها في نفسها ──`Q(·; θ^-)`, وزنها 结──每隔 `C`步,复制 `θ → θ^-`هذا سيسمح لتحقيق الهدف الرجعي في آلاف الخطوات التدريجية في الحفاظ على الاستقرار.`θ^- ← τ θ + (1-τ) θ^-`(للاستخدام DDPG، SAC) هو أكثر تغيرات سلمية.

**Reward clipping。**حجم مكافأة Atari من 1 إلى 1000+ مختلفة`{-1, 0, +1}`يمكن أن تمنع أحد اللعبات المحددة. عندما تكون حجم الجائزة مهمة، فهذا خطأ. ولكن بالنسبة إلى Atari يمكن، لأن الرمز فقط مهم.

**Double DQN。**Hasselt (2016) 修复了最大化偏见: استخدام الشبكة على الانترنت 来*选择* العمل، استخدام الشبكة المستهدفة 来*评估*它。

`target = r + γ Q(s', argmax_{a'} Q(s', a'; θ); θ^-)`

هذا استبدال متساعد، والنتيجة أفضل.

**其他改进（Rainbow, 2017）：**إعادة تعديل الأولوية ((更多采样 مرتفع التخطيط التخطيط)`V(s)`وذلك في ظل أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيد أنّه من المُفيدين.


```figure
f3-dqn-stability
```

## بناءها

هذا الكود هو فقط stdlib و free of numpy: نحن في شبكة صغيرة جدا المستمرة GridWorld 上 استخدام اليد كتابة واحدة مخفية الطبقة MLP، لذلك كل تدريب خطوة يمكن أن تكون في ميكروثانية داخل النشاط.

### الخطوة 1: إعادة تشغيل العازلة

```python
class ReplayBuffer:
    def __init__(self, capacity):
        self.buf = []
        self.capacity = capacity
    def push(self, s, a, r, s_next, done):
        if len(self.buf) == self.capacity:
            self.buf.pop(0)
        self.buf.append((s, a, r, s_next, done))
    def sample(self, batch, rng):
        return rng.sample(self.buf, batch)
```

أتاري تستخدم حوالي 50 ألف، أما بيئتنا البديلة تستخدم 5000، فهذا يكفي.

### الخطوة الثانية: شبكة ق صغيرة جدا

```python
class QNet:
    def __init__(self, n_in, n_hidden, n_actions, rng):
        self.W1 = [[rng.gauss(0, 0.3) for _ in range(n_in)] for _ in range(n_hidden)]
        self.b1 = [0.0] * n_hidden
        self.W2 = [[rng.gauss(0, 0.3) for _ in range(n_hidden)] for _ in range(n_actions)]
        self.b2 = [0.0] * n_actions
    def forward(self, x):
        h = [max(0.0, sum(w * xi for w, xi in zip(row, x)) + b) for row, b in zip(self.W1, self.b1)]
        q = [sum(w * hi for w, hi in zip(row, h)) + b for row, b in zip(self.W2, self.b2)]
        return q, h
```

المضي قدما: خطي → ريلو → خطي..

### 步骤 3: تحديث DQN

```python
def train_step(online, target, batch, gamma, lr):
    grads = zeros_like(online)
    for s, a, r, s_next, done in batch:
        q, h = online.forward(s)
        if done:
            y = r
        else:
            q_next, _ = target.forward(s_next)
            y = r + gamma * max(q_next)
        td_error = q[a] - y
        accumulate_grads(grads, online, s, h, a, td_error)
    apply_sgd(online, grads, lr / len(batch))
```

شكله هو تعلم القي في الدروس 04، هناك فقط فرقين:`Q(·; θ)`عمل التوسع العكسي، وليس جدول الإشارات.`Q(·; θ^-)`.

### الخطوة 4: حلقة خارجية

لكل حلقة، على أساس`Q(·; θ)`执行 ε-greedy,把 transitions 放入缓冲,采样迷你批量,执行一次 `θ^- ← θ` النموذج:

```python
for episode in range(N):
    s = env.reset()
    while not done:
        a = epsilon_greedy(online, s, epsilon)
        s_next, r, done = env.step(s, a)
        buffer.push(s, a, r, s_next, done)
        if len(buffer) >= batch:
            train_step(online, target, buffer.sample(batch), gamma, lr)
        if steps % sync_every == 0:
            target = copy(online)
        s = s_next
```

في هذا المجال، يستخدم الـ16 غطاء واحد الحار في شبكة الإنترنت، وكيل سوف يشاهد 500 حلقة من خلال التعلم إلى أقرب إلى أفضل سياسة.

## 常见陷

- **Deadly triad。**تقريب الوظيفة + خارج السياسة + إزالة التشغيل 可能发散──DQN استخدام شبكة الهدف + إعادة تشغيل 缓解 هذا المشكلة؛ لا تحريك أي واحد──
- **Exploration。**ε 必須衰退, عادة في مرحلة قبل التدريب حوالي 10% من 1.0 衰退 إلى 0.01 ⋅ إذا كان الاستكشاف المبكر غير كاف، Q-net 会收到局部盆──
- **Overestimation。**لمُتَصَدّق`max`سوف تظهر التفاوتات الصاعدة.
- **Reward scale。**قطع أو تحديد المكافآت                                                                                                                                                                                                                                                           
- **Replay buffer coldstart。**في المضخة  امتلاك عدة آلاف من الانتقالات  قبل لا تدريب ‬ بناء على حوالي 20 عينة من الدرجات المبكرة ‬ سوف تكون مناسبة‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
- **Target sync frequency。**太频繁 ≈ 没有目标网;太不频繁 ≈目标 过时――Atari DQN 使用 10,000 个 env 步骤──经验规则:每约1/100 个训练视界 同步一次──
- **Observation preprocessing。**Atari DQN 堆叠 4 ، جعل الحالة 满足 Markov── أي تحتوي على معلومات السرعة من البيئة 都需要 الإطار-مكتبة أو الحالة المتكررة──

## استخدمها

بحلول عام 2026، كان DQN قليلًا من أحدث التكنولوجيا، لكنه لا يزال خوارزمية مرجعية خارج السياسة:

| Task | 首选 Method | 为什么不是 DQN？ |
|------|-------------|------------------|
| Discrete-action Atari-like | Rainbow DQN or Muesli | 同一框架，更多技巧。 |
| Continuous control | SAC / TD3 (Phase 9 · 07) | DQN 没有 policy network。 |
| On-policy / high-throughput | PPO (Phase 9 · 08) | 没有 replay buffer；更容易扩展。 |
| Offline RL | CQL / IQL / Decision Transformer | Conservative Q targets，没有 bootstrapping blowups。 |
| Large discrete action spaces (recommender) | DQN with action embedding, or IMPALA | 可以；细节装饰很重要。 |
| LLM RL | PPO / GRPO | Sequence-level，而不是 step-level；Loss 不同。 |

هذه التجارب لا تزال عامة. تمثل شبكات Replay و Target في SAC، TD3, DDPG، SAC-X، AlphaZero، وكذلك كل طريقة RL غير متصلة. تمتد الحصص على المكافآت على شكل تطبيع ميزة في PPO.

## 交付 it

保存为 `outputs/skill-dqn-trainer.md`:

```markdown
---
name: dqn-trainer
description: 为 discrete-action RL task 生成 DQN training config（buffer、target sync、ε schedule、reward clipping）。
version: 1.0.0
phase: 9
lesson: 5
tags: [rl, dqn, deep-rl]
---

给定一个 discrete-action environment（observation shape、action count、horizon、reward scale），输出：

1. Network。Architecture（MLP / CNN / Transformer）、feature dim、depth。
2. Replay buffer。Capacity、minibatch size、warmup size。
3. Target network。Sync strategy（hard every C steps 或 soft τ）。
4. Exploration。ε start / end / schedule length。
5. Loss。Huber vs MSE、gradient clip value、reward clipping rule。
6. Double DQN。默认启用，除非有明确理由禁用。

拒绝交付没有 target network、没有 replay buffer，或 ε 固定为 1 的 DQN。拒绝 continuous-action tasks（路由到 SAC / TD3）。标记任何 reward range > 10× per-step mean 的情况，说明需要 clipping 或 scale normalization。
```

## التدريب

1. **Easy。**运行 `code/main.py`◊ رسم منحنى العودة لكل حلقة── متوسط المشي 超过 -10 需要多少集?
2. **Medium。**禁用 هدف الشبكة 禁用 هدف بيلمان 两侧都使用网)
3. **Hard。**添加 DQN المزدوج: استخدام شبكة الإنترنت 选择 `argmax a'`, استخدام شبكة الهدف 评估── مقارنة غرابة مكافأة GridWorld 上 тренинг 1,000 个集 后,使用与不使用双DQN 时`Q(s_0, best_a)`相对真相`V*(s_0)`التحيز

## 关键术语
| Term | 人们怎么说 | 它实际是什么意思 |
|------|------------|------------------|
| DQN | “Deep Q-learning” | 带有 Neural Q-function、replay buffer 和 target network 的 Q-learning。 |
| Experience replay | “Shuffled transitions” | 每个 Gradient step 都均匀采样的 ring buffer；让数据去相关。 |
| Target network | “Frozen bootstrap” | 用于 Bellman target 的 Q 的周期性副本；稳定训练。 |
| Deadly triad | “为什么 RL 会发散” | Function approximation + bootstrapping + off-policy = 没有收敛保证。 |
| Double DQN | “修复 maximization bias” | Online net 选择 action，target net 评估它。 |
| Dueling DQN | “V and A heads” | 分解 Q = V + A - mean(A)；输出相同，Gradient flow 更好。 |
| Rainbow | “所有技巧” | DDQN + PER + dueling + n-step + noisy + distributional 合在一起。 |
| PER | “Prioritized Replay” | 按 TD-error magnitude 成比例采样 transitions。 |

## 延伸阅读

- [Mnih et al. (2013). Playing Atari with Deep Reinforcement Learning](https://arxiv.org/abs/1312.5602) 开启 Deep RL  ورقة ورشة عمل NeurIPS لعام 2013
- [Mnih et al. (2015). Human-level control through deep reinforcement learning](https://www.nature.com/articles/nature14236)الطبيعة، 49 لعبة DQN
- [Hasselt, Guez, Silver (2016). Deep Reinforcement Learning with Double Q-learning](https://arxiv.org/abs/1509.06461) DDQN
- [Wang et al. (2016). Dueling Network Architectures](https://arxiv.org/abs/1511.06581) مباراة DQN。
- [Hessel et al. (2018). Rainbow: Combining Improvements in Deep RL](https://arxiv.org/abs/1710.02298) 叠加技巧的论文──
- [OpenAI Spinning Up — DQN](https://spinningup.openai.com/en/latest/algorithms/dqn.html) 清晰的现代讲解。
- [Sutton & Barto (2018). Ch. 9 — On-policy Prediction with Approximation](http://incompleteideas.net/book/RLbook2020.pdf) 教科書中对 致命三三(تقريب الوظيفة + إطلاق + خارج السياسة) ؛
- [CleanRL DQN implementation](https://docs.cleanrl.dev/rl-algorithms/dqn/) باستخدام إشارة لدراسات التجاوزات DQN ملف واحد ؛ مناسبة مع هذا الدراسة من الصفر 阅读一起──
