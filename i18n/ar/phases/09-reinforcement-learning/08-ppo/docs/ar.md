# تحسين السياسة القريبة (PPO)

> A2C في إحدى التطورات بعد التخلص من كل عملية تنفيذ.PPO باستخدام نسبة أهمية قصيرة الحفاظ على تراجيع السياسة، بحيث يمكنك القيام بـ 10+ فترات على نفس البيانات، دون أن تسبب في انفجار السياسة.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~75 分钟

## 问题

A2C ((المدرسة 07) هو على السياسة`E_{π_θ}[A · ∇ log π_θ]`需要从*当前* `π_θ`بعد تحديث مرة واحدة،`π_θ`لقد تغيرت، والبيانات التي استخدمتها الآن غير قانونية.

التنفيذ 很昂贵── في Atari 上,跨 8 个 envs × 128 خطوة التنفيذ مرة واحدة = 1024 انتقال, فضلا عن عشرة ثواني من الوقت المحيط── مرة واحدة خطوة تدريجية 后就把它丢了很浪费──

تحسين سياسة منطقة الثقة ((TRPO، Schulman 2015)) هو أول إصلاح للبرنامج:约束每次更新، جعل السياسة القديمة و السياسة الجديدة`δ`وفي النظرية، هذا أمر جيد، ولكن كل تحديث يحتاج إلى حل متجانس.

PPO(Schulman et al. 2017) باستخدام هدف بسيط قصير استبدل منطقة الثقة الصلبة 约束──只多一行代码── في كل مرة يتم تنفيذها 十个时代──不需要结合梯度──理论保证足够好──九年后,它仍然是从MuJoCo到RLHF默认政策-gradient 算法──

## 概念

![PPO clipped surrogate objective: ratio clipping at 1 ± ε](../assets/ppo.svg)

**Importance ratio。**

`r_t(θ) = π_θ(a_t | s_t) / π_{θ_old}(a_t | s_t)`

هذا هو نسبة احتمالية بين السياسة الجديدة وسياسة جمع البيانات.`r_t = 1`لا تغير`r_t = 2`表示新政策 选择 `a_t`احتمالية هذه السياسة القديمة مرتين

**Clipped surrogate。**

`L^{CLIP}(θ) = E_t [ min( r_t(θ) A_t, clip(r_t(θ), 1-ε, 1+ε) A_t ) ]`

دو المشاريع:

- إذا كان الميزة`A_t > 0`، و النسبة 试图增长到超过 `1 + ε`لا تنفذ خطوة جيدة ، لا تنفذ خطوة جيدة`+ε`هذا ما يفعله
- إذا كان الميزة`A_t < 0`، و النسبة 试图增长到超过 `1 - ε`(يعني تقليل مقارنة، سوف نسمح لفعالة سيئة أكثر من المحتملة أن تحدث) ، كليب سوف تحد من التدريجية  لا تضع عمل سيء  دفع إلى أقل من `-ε`.

`min`处理另一个方向: إذا كان النسبة 已朝*有益*方向移动, you still get Gradient ((لن يكون في جانب غير مواتيك) 

                 `ε = 0.2` ضع هدف 画成 `r_t`وظيفة: وظيفة خطية قطعة ، في الجزء العلوي من الجانب المميز ، في الجزء السفلي من الجانب السيئ.

**完整的 PPO loss。**

`L(θ, φ) = L^{CLIP}(θ) - c_v · (V_φ(s_t) - V_t^{target})² + c_e · H(π_θ(·|s_t))`

مع A2C مشابهة للعملاء-النقاد 結構──三系数, عادةً`c_v = 0.5`.`c_e = 0.01`.`ε = 0.2`.

**训练循环。**

1. 跨 `N`个 متوازية بيئة، كل运行 `T`خطوات، جمع`N × T`个过渡――
2. المزايا الحسابية (GAE) ،并把它们结为常量──
3. - لا .`π_{θ_old}`结为当前 `π_θ`صورة سريعة
4. على`K`أوقات، لكل واحد`(s, a, A, V_target, log π_old(a|s))`من المجموعة الصغيرة:
   - 计算 `r_t(θ) = exp(log π_θ(a|s) - log π_old(a|s))`.
   -  تطبيق `L^{CLIP}`+ فقدان القيمة + إنتروبية
   - خطوة تدريجية
5. ترك التنفيذ ‬ ‫عود إلى الخطوة 1‬

`K = 10`و 64 من المجموعات الصغيرة هي مجموعة من المعايير المختلفة.

**KL-penalty 变体。**مقال أساسي يقدم خطة بديلة، باستخدام عقوبة KL التكيفية:`L = L^{PG} - β · KL(π_θ || π_old)`، من بينهم`β`根据观察 KL 调整──Clipping 版本成为主流;KL 变体在RLHF保留下来(((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((


```figure
ppo-clip
```

## بناءها

### الخطوة الأولى: في الإطلاق`log π_old(a | s)`

```python
for step in range(T):
    probs = softmax(logits(theta, state_features(s)))
    a = sample(probs, rng)
    s_next, r, done = env.step(s, a)
    buffer.append({
        "s": s, "a": a, "r": r, "done": done,
        "v_old": value(w, state_features(s)),
        "log_pi_old": log(probs[a] + 1e-12),
    })
    s = s_next
```

الصورة المقطعة فقط في التنفيذ للحصول على مرة واحدة.

### الخطوة الثانية: حساب فوائد GAE

مع A2C 相同── عبر اللحظة 归一化──

### الخطوة الثالثة: تحديث بديل تم إزالة

```python
for _ in range(K_EPOCHS):
    for mb in minibatches(buffer, size=64):
        for rec in mb:
            x = state_features(rec["s"])
            probs = softmax(logits(theta, x))
            logp = log(probs[rec["a"]] + 1e-12)
            ratio = exp(logp - rec["log_pi_old"])
            adv = rec["advantage"]
            surrogate = min(
                ratio * adv,
                clamp(ratio, 1 - EPS, 1 + EPS) * adv,
            )
            # backprop -surrogate, 添加 value loss, 减去 entropy
            grad_logpi = onehot(rec["a"]) - probs
            if (adv > 0 and ratio >= 1 + EPS) or (adv < 0 and ratio <= 1 - EPS):
                pg_grad = 0.0  # clipped
            else:
                pg_grad = ratio * adv
            for i in range(N_ACTIONS):
                for j in range(N_FEAT):
                    theta[i][j] += LR * pg_grad * grad_logpi[i] * x[j]
```

خفض مدرج الصفر  النموذج هو جوهر PPO  إذا كانت السياسة الجديدة متقدمة في اتجاه مفيد جدا، التحديث سوف يتوقف‬

### الخطوة 4: القيمة و الإنتروبي

给评论目标 添加标准 MSE,并给演员 添加体积奖金,与A2C相同──

### الخطوة 5: التشخيص

كل مرة يجب أن نلاحظ ثلاثة أشياء:

- **Mean KL** `E[log π_old - log π_θ]`يجب أن تبقى هنا`[0, 0.02]`إذا تجاوزت `0.1`,降低 `K_EPOCHS`أو`LR`.
- **Clip fraction** نسبة 落在 `[1-ε, 1+ε]`عينة خارجية على سبيل المثال`~0.1-0.3`إذا كان`~0`, المقطع 从未触发 → 提高 `LR`أو`K_EPOCHS`إذا كان`~0.5+`أنتِ تتجاوزين الإعدادات
- **Explained variance** `1 - Var(V_target - V_pred) / Var(V_target)`✿ مؤشر الجودة النقدي‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

## فخ

- **Clip coefficient 调错。** `ε = 0.2`هو حقيقة المعايير.`0.1`سوف يجعل التحديث أكثر من الحفاظ عليه`0.3+`سأدخل في حالة عدم الاستقرار
- **Epochs 太多。** `K > 20`经常会让训练不稳定,因为政策 漂离 `π_old`                                                                                                                                                                                                                                                              
- **没有 reward normalization。**مقياس مكافأة كبيرة 会侵蚀 كليب المدى.
- **忘记 advantage normalization。**تعاديل المعدل الصفر للشحنة / الوحدة-std هو الممارسة القياسية.
- **Learning rate 没有衰减。**PPO受益于线性 LR 衰减到零──恒定 LR 往往更差──
- **Importance ratio 数学错误。**للاستقرار الرقمي،始终使用 `exp(log_new - log_old)`بدلاً من ذلك`new / old`.
- **Gradient sign 错误。**أقصى تعويض = * أقصى تعويض* `-L^{CLIP}`◊ 符号翻转是最常见的PPO bug──

## استخدمها

PPO هو 2026 سنة في مجال متكافئ الاحتفاظ بالعمل المثالي:

| Use case | PPO variant |
|----------|-------------|
| MuJoCo / robotics control | PPO with Gaussian policy, GAE(0.95) |
| Atari / discrete games | PPO with categorical policy, rolling 128-step rollouts |
| RLHF for LLMs | PPO with KL penalty to reference model, reward from RM at end of response |
| Large-scale game agents | IMPALA + PPO (AlphaStar, OpenAI Five) |
| Reasoning LLMs | GRPO (Lesson 12) — PPO variant without critic |
| Preference-only data | DPO — closed-form collapsing of PPO+KL, no online sampling |

* شكل الخسارة* PPO  قطع بديل + قيمة + إنتروبي  هو DPO、GRPO وبالنسبة إلى جميع أنابيب RLHF.

## 交付 it

保存为 `outputs/skill-ppo-trainer.md`:

```markdown
---
name: ppo-trainer
description: 为给定环境生成 PPO training config 和 diagnostic plan。
version: 1.0.0
phase: 9
lesson: 8
tags: [rl, ppo, policy-gradient]
---

给定一个 environment 和 training budget，输出：

1. Rollout size。`N` envs × `T` steps。
2. Update schedule。`K` epochs、minibatch size、LR schedule。
3. Surrogate params。`ε`（clip）、`c_v`、`c_e`，开启 advantage normalization。
4. Advantage。GAE(`λ`)，显式给出 `γ` 和 `λ`。
5. Diagnostics plan。KL、clip fraction、explained variance thresholds 与 alerts。

拒绝 `K > 30` 或 `ε > 0.3`（unsafe trust region）。拒绝任何没有 advantage normalization 或 KL/clip monitoring 的 PPO run。把 clip fraction 持续高于 0.4 标记为 drift。
```

## التدريب

1. **简单。**في 4×4 GridWorld 上运行 PPO, استخدام `ε=0.2, K=4`في حالة تكييف الخطوات البيئية، مع A2C ((مرة واحدة في كل عملية تنفيذ)
2. **中等。**تفتيش`K ∈ {1, 4, 10, 30}` رسم الخطوات العودة مقابل التجاوزات،并跟踪 كل مرة تحديث متوسط KL── في هذه المهمة،`K`كم من الوقت ستفجر (كيل) ؟
3. **困难。**استخدام عقوبة KL التكيفية بدل المنتقلة المبدلة (إذا `KL > 2·target`،`β`翻倍؛ إذا `KL < target/2`،`β`减半) ・比较 العائد النهائي 稳定 和 بدون كليب

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| Importance ratio | "r_t(θ)" | `π_θ(a\|s) / π_old(a\|s)`；相对于采集数据的 policy 的偏离程度。 |
| Clipped surrogate | "PPO's main trick" | `min(r·A, clip(r, 1-ε, 1+ε)·A)`；在有益侧超过 clip 后 Gradient 变平。 |
| Trust region | "TRPO / PPO intent" | 限制每次更新的 KL，以保证 monotone improvement。 |
| KL penalty | "Soft trust region" | 替代 PPO：`L - β · KL(π_θ \|\| π_old)`。Adaptive `β`。 |
| Clip fraction | "How often clipping triggers" | Diagnostic —— 应该是 0.1-0.3；超出范围表示调参错误。 |
| Multi-epoch training | "Data reuse" | 每次 rollout 上跑 K 个 epochs；用 variance cost 换 sample efficiency。 |
| On-policy-ish | "Mostly on-policy" | PPO 名义上是 on-policy，但 K>1 个 epochs 会安全地使用 slightly-off-policy data。 |
| PPO-KL | "The other PPO" | KL-penalty 变体；用于 RLHF，因为 KL-to-reference 已经是一个约束。 |

## 延伸阅读

- [Schulman et al. (2017). Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347) 论文。
- [Schulman et al. (2015). Trust Region Policy Optimization](https://arxiv.org/abs/1502.05477) TRPO,PPO 的前身──
- [Andrychowicz et al. (2021). What Matters In On-Policy RL? A Large-Scale Empirical Study](https://arxiv.org/abs/2006.05990) قم بإجراء إزالة لكل مفارقة فائقة من PPO
- [Ouyang et al. (2022). Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) تعليمات جبت؛PPO-in-RLHF 配方。
- [OpenAI Spinning Up — PPO](https://spinningup.openai.com/en/latest/algorithms/ppo.html)استخدام PyTorch 清晰现代讲解。
- [CleanRL PPO implementation](https://github.com/vwxyzjn/cleanrl) 很多论文使用的参考单档PPO──
- [Hugging Face TRL — PPOTrainer](https://huggingface.co/docs/trl/main/en/ppo_trainer) في نماذج اللغة 上 استخدام PPO 配配;请和课堂 09(RLHF)一起阅读──
- [Engstrom et al. (2020). Implementation Matters in Deep Policy Gradients](https://arxiv.org/abs/2005.12729) 37 تحسينات مستوى الرمز 论文; أي خدوش PPO هي تحمل التركيبات، أي مجرد شعبية.
