# 面向游戏的RL  ألفا زيرو、موزرو مع ماجستير في مجال التفكير 时代

> 1992: TD-Gammon 用纯 TD 在后游中击败人类冠军──2016: AlphaGo 击败 Lee Sedol──2017: AlphaZero 从零开始统治棋牌、shogi 和 Go──2024:DeepSeek-R1 证明了同一套配方在推理上也有效,只是使用GRPO 替代PPO──游戏是推动本阶段每次突破的基准──

**类型：**بناء
**语言：**بايثون
**先修要求：**المرحلة 9 · 05 (DQN) ‧المرحلة 9 · 08 (PPO) ‧المرحلة 9 · 09 (RLHF) ‧المرحلة 9 · 10 (MARL)
**时间：**حوالي 120 دقيقة

## 问题

游戏具备RL 想要的一切──清晰的回报(胜/负)──无限集片(自动玩可以重置)──完美模拟版(游戏本身就是模拟器)──离散或小规模连续行动空间──迫使对抗鲁棒性的多代理结构──

و اللعبة صحيحة في كل مرة كبيرة RL 突破的测试场──TD-Gammon(backgammon,1992)──Atari-DQN(2013)──AlphaGo(2016)──AlphaZero(2017)──OpenAI Five(Dota 2,2019)──AlphaStar(StarCraft II,2019)──MuZero(الموديل المتعلم,2019)──AlphaTensor(المثاثرة,2022)──AlphaDev(التصفية الخوارزميات,2023)──DeepSeek-R1(الاعتقاد الرياضي,2025)

هذا الحجر الأساسي سوف يمر عبر مركز واحد**self-play + search + policy improvement**كل نوع هو نوع من التعميم؛ وخاصة GRPO، فإنه يطبق التكوين من ألفا زيرو في التفكير LLM، والتي تعني العمل، والتحليل الرياضي هو إشارة النصر.

## 概念

![AlphaZero ↔ MuZero ↔ GRPO：相同循环，不同环境](../assets/rl-games.svg)

**统一循环。**

```
while True:
    trajectory = self_play(current_policy, search)     # 和自己对局
    policy_target = search.improved_policy(trajectory) # search 改进原始 policy
    policy_net.update(policy_target, value_target)     # 在 search 输出上做 supervised 训练
```

**AlphaZero (2017)。**سيلفر وغيره 给定一个规则已知的游戏(شطرنج shogi、Go):

- شبكة القيمة السياسية:一个塔 `f_θ(s) → (p, v)`.`p`هل هذا قانوني؟`v`هو نتائج اللعبة المتوقعة
- البحث عن شجرة مونت كارلو (MCTS): في كل خطوة،展开可能后续状态的树──使用 `(p, v)`作为前 + bootstrap──用 UCB (PUCT) 选择节点:`a* = argmax Q(s, a) + c · p(a|s) · √N(s) / (1 + N(s, a))`.
- لعبة الذاتية: جعل العميل ضد العميل على الموقع`t`步,توزيع زيارات المكتيريا `π_t`成为 السياسة 训练目标──
- الخسارة:`L = (v - z)² - π · log p + c · ||θ||²`.`z`نعم نتيجة اللعبة ((+1 / 0 / -1))).

零人类知识──零手工休ристиكا── واحد واحد، بعد اللعب الذاتي للاعبين الملايين من اللحظات 

**MuZero (2019)。**شريتويزر وزملاء 移除了规则已知的要求──

- لا تستخدم بيئة ثابتة، بل تعلم نموذج ديناميكي متخفي`(h, g, f)`:
  - `h(s)`:将观察 编码为潜状态──
  - `g(s_latent, a)`:预测下一个潜伏状态 + مكافأة
  - `f(s_latent)`:预测 سياسة سابقة + قيمة
- MCTS في *المجال الخاطئ المتعلم* 中运行── نفس البحث، نفس دورة التدريب──
- 适用于 Go、棋牌、shogi *以及* Atari  一个算法,不需要规则知识──

**Stochastic MuZero (2022)。**加入 ستوكاستيك ديناميكيا 和 عقدة الفرصة؛ توسع إلى الظهر

**Muesli、Gumbel MuZero (2022-2024)。**في كفاءة العينات وبحث التحديدات

**GRPO (2024-2025)。**DeepSeek-R1 配方── نفس الدورة الشكلية الفالفا زيرو، تطبيقها على التفكير نموذج اللغة:

- 游戏: جواب مشكلة الرياضيات / التشفير / التفكير‬‬‬胜利= مؤكد ‬‬التحقق من حالة الاختبار 通过、数值答案匹配) ‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
- السياسة:LLM。الأعمال:التوجهات‬:الوضع:السرعة +الرد-حتى الآن‬
- 没有批评(PPO 风格的 V_φ) ;;相反,对每一个提示,从政策 采样 `G`个完成──计算每个完成的奖励──使用 **group-relative advantage** `A_i = (r_i - mean_r) / std_r`作为 REINFORCE 风格更新的信号──
- على سياسة المرجعية + عقوبة KL 以防漂移(类似RLHF)
- الخسارة الكاملة:

  `L_GRPO(θ) = -E_{q, {o_i}} [ (1/G) Σ_i A_i · log π_θ(o_i | q) ] + β · KL(π_θ || π_ref)`

لا نموذج مكافأة، لا نقاد، لا MCTS──بداية النسبية المجموعة بدأت ثلاثة.

**完整的 R1 配方。**DeepSeek-R1 ((DeepSeek 2025) هو نموذج في مقال:

- **R1-Zero。**من النموذج الأساسي DeepSeek-V3 开始──没有 SFT──直接应用 GRPO, باستخدام عنصرين من المكافآت:* مكافأة الدقة*(قاعدة القواعد `<think>…</think>`标签内) ・经过数千步后, متوسط طول الاستجابة من حوالي 100 增长到约 10,000 Token,数学基准 分数上升到接近 o1预览 水平。模型 从零开始学会推理──缺点: سلسلة فكرتها 往往难以阅读、混用语言,并且缺少风格打磨──
- **R1。**استخدام خط الأنابيب في 4 مراحل 修复 R1-Zero
  1. **Cold-start SFT。**جمع آلاف النماذج من التظاهر الطويل-CoT على شكل واضح.
  2. **Reasoning-oriented GRPO。**استخدام مكافأة الدقة+صيغة،并加入 *لغة-متوافقة* مكافأة لمنع تغيير الرمز.
  3. **Rejection sampling + SFT 第 2 轮。**من نقطة التفتيش RL 采样约600K 条 منطقية المسار، فقط الحفاظ على الإجابة النهائية صحيحة و CoT قابلة للقراءة،并与约200K 条非 استدلال SFT مثال ((( الكتابة、QA、عرف الذات)组合── مرة أخرى تحسين قاعدة──
  4. **Full-spectrum GRPO。**إعادة إجراء جولة من المشاريع، تغطية التفكير (مكافأة قائمة على القواعد) والتنسيق العام (مكافأة قائمة على تفضيل المفيد/الغير الضار)

结果在开放权重下于 AIME 和 MATH-500 上匹配 o1,并且足够小,可以蒸蒸──同一篇论文还发布了六种蒸密集模型(从Qwen-1.5B到Llama-70B),方式是R1的推理痕迹 上对学生做SFT  学生端没有RL──强RL的蒸 在学生规模持续优于从零开始的RL──

**为什么 reasoning 用 GRPO 而不是 PPO。**DeepSeekMath 论文(2024 年 2 月) أعطى ثلاثة أسباب: 1) لا حاجة لتدريب شبكة القيمة، انخفاض النمو إلى النصف؛ 2) خط الأساس المجموعي 天然适配 التفكير المهمة ثمن نادرة نهاية المسار التي تحدث؛ 3) التطبيع على الفور 让不同难度问题之间的优势可比,而 PPO واحد ناقد做不到这一点.

**Search-free vs search-based。**游戏领域已分叉:

- *长视野的完美信息游戏*(Go、棋牌): مازال على أساس البحث。AlphaZero / MuZero 占主导。
- * التفكير في الـ LLM*:生产中还没有 MCTS;对完整 rollout做GRPO,推理计算 使用最好的N──模式奖励过程 (PRMs) 暗示阶段级搜索 正被重新加入──


```figure
f3-selfplay-ladder
```

## الإنشاء

`code/main.py`تم تنفيذ الكود**微型 GRPO**                                                                                                                                                                                                                                                              

### الخطوة 1: بيئة تحقيق صغيرة

```python
QUESTIONS = [
    {"prompt": "q1", "correct": 3},
    {"prompt": "q2", "correct": 1},
]

def verify(prompt_idx, answer_token):
    return 1.0 if answer_token == QUESTIONS[prompt_idx]["correct"] else 0.0
```

في GRPO الحقيقي، سوف يدير المؤكد اختبارات الوحدة أو يبحث عن التساوي الرياضي.

### الخطوة 2: السياسة: كل طلب 上对 K 个回答 رمز جعل softmax

```python
def policy_probs(theta, p_idx):
    return softmax(theta[p_idx])
```

وذلك في حال تم إعطاء المعلمين الجامعيين المختلفين

### الخطوة الثالثة: أخذ العينات من المجموعة والفائدة النسبية للجماعة

```python
def grpo_step(theta, p_idx, G=8, beta=0.01, lr=0.1, rng=None):
    probs = policy_probs(theta, p_idx)
    samples = [sample(probs, rng) for _ in range(G)]
    rewards = [verify(p_idx, s) for s in samples]
    mean_r = sum(rewards) / G
    std_r = stddev(rewards) + 1e-8
    advs = [(r - mean_r) / std_r for r in rewards]

    for a, A in zip(samples, advs):
        grad = onehot(a) - probs
        for i in range(len(probs)):
            theta[p_idx][i] += lr * A * grad[i]
    # KL penalty：把 theta 拉向 reference
    for i in range(len(probs)):
        theta[p_idx][i] -= beta * (theta[p_idx][i] - reference[p_idx][i])
```

الميزة النسبية للجماعة هي تكنولوجيا DeepSeek لعام 2024.

### الخطوة 4: مقارنة مع خطة أساسية REINFORCE

نفس المعدل نفس الحساب العادي قوة الإعادة

### الخطوة 5: مشاهدة الإنتروبي و KL

مع RLHF تشبيه التشخيص: إلى المرجعية متوسط KL ‧سياسة entropy ‧ مكافأة-على-وقت.

## 常见陷

- **通过操纵 verifier 进行 reward hacking。**تمتلك الـ GRPO خطورة RLHF: إذا كان المحقق خطأ أو يمكن استخدامه، فإن LLM سوف تجد استغلال.
- **Group size 太小。**الفرق في خط الأساس للمجموعة`1/√G`缩放──低于 `G = 4`时, إشارة الميزة 会很; 标准选择是`G = 8`إلى`64`.
- **Length bias。**مختلفة من طول إكمال ماجستير في العلوم الجامعية  مع احتمالات مختلفة للطبقات  حسب رمز عدد التأثير، أو استخدام مستوى التسلسل المدونات، أو قطع إلى أقصى طول 
- **纯 self-play 循环。**التدريب على الدرجة الأولى من المجموعة العامة يمكن أن يكون في اللعبات المجموعة العامة.
- **Search-policy mismatch。**ألفا زيرو التدريب السياسة 去模仿 نتائج البحث‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
- **Compute floor。**MuZero / AlphaZero 需要海量计算──一次的抽象往往就是数百 GPU-hours──用于学习的微型演示是存在的(例如 Connect Four 上的 AlphaZero)──
- **Verifier coverage。**لحل الحذاء ويمكن أن يمر اختبارات الوحدة سوف تعزز هذا الحذاء.

## استخدام

2026 版图, حسب النطاق 划分:

| Domain | 主导方法 |
|--------|-----------------|
| Two-player zero-sum board games（Go、chess、shogi） | AlphaZero / MuZero / KataGo |
| Imperfect info card games（poker） | CFR + deep learning（DeepStack、Libratus、Pluribus） |
| Atari / pixel games | Muesli / MuZero / IMPALA-PPO |
| Large multiplayer strategy（Dota、StarCraft） | PPO + self-play + league（OpenAI Five、AlphaStar） |
| LLM math/code reasoning | GRPO（DeepSeek-R1、Qwen-RL、open replications） |
| LLM alignment | DPO / RLHF-PPO（不是 GRPO；verifier 是 preference，不是 verifiable） |
| Robotics | PPO + DR（不是 game-RL，但使用相同的 policy-gradient tools） |
| Combinatorial problems | AlphaZero variants（AlphaTensor、AlphaDev） |

هذا * الصيغة*  اللعب الذاتي  التحسين المزدوج بالبحث  التقطير السياسي  横跨文本、像素和物理控制。GRPO هو أسهل مثال؛ المزيد من الحالات ستظهر أيضا ً

## 交付

保存为 `outputs/skill-game-rl-designer.md`:

```markdown
---
name: game-rl-designer
description: 为给定 domain 设计 game-RL 或 reasoning-RL training pipeline（AlphaZero / MuZero / GRPO）。
version: 1.0.0
phase: 9
lesson: 12
tags: [rl, alphazero, muzero, grpo, self-play]
---

给定一个目标（perfect-info game / imperfect-info / Atari / LLM reasoning / combinatorial），输出：

1. Environment fit。规则是否已知？Markov？Stochastic？Multi-agent？用于判断 AlphaZero vs MuZero vs GRPO。
2. Search strategy。MCTS（带 learned prior 的 PUCT）、Gumbel-sampled、best-of-N，或 none。
3. Self-play plan。Symmetric self-play / league / offline data / verifier-generated。
4. Target signal。Game outcome / verifier reward / preference / learned model。包含 robustness plan。
5. Diagnostics。相对 baseline 的 win rate、ELO curve、verifier pass rate、到 reference 的 KL。

对 imperfect-info games 拒绝使用 AlphaZero（转向 CFR）。没有可信 verifier 时拒绝 GRPO。没有固定 baseline opponent set 时拒绝任何 game-RL pipeline（否则 self-play ELO 未校准）。
```

## التدريب

1. **Easy。**في`code/main.py`中实现 GRPO bandit──在 2 个提示 × 每个 4 个答案 标记 上训练──使用 `G=8`في < 1000 مرة تحديث
2. **Medium。**接入 PPO(قطعة) و فانيلا REINFORCE。 في نفس اللص على مقارنة كفاءة العينة 和 التباين في الجائزة مع اختلافات GRPO。
3. **Hard。**扩展到长度为 2 的推理链:代理 发发两个代币,verifier对代币对代币 给奖励──测量GRPO 如何处理两步序列 上的信用分配──(提示:按 *全序列* 计算组优势,并传播到两个代币位置──)

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|-----------------|-----------------------|
| MCTS | “带 learned net 的 tree search” | Monte Carlo Tree Search；使用 learned `(p, v)` prior 的 UCB1/PUCT selection。 |
| AlphaZero | “Self-play + MCTS” | Policy-value net 被训练来匹配 MCTS visits 和 game outcome。 |
| MuZero | “Learned-model AlphaZero” | 相同循环，但通过 learned dynamics 在 latent space 中进行。 |
| GRPO | “Critic-free PPO” | Group Relative Policy Optimization；带 group-mean baseline + KL 的 REINFORCE。 |
| PUCT | “AlphaZero 的 UCB” | `Q + c · p · √N / (1 + N_a)` —— 平衡 value estimate 与 prior。 |
| Self-play | “Agent vs past self” | Zero-sum 的标准做法；提供对称训练信号。 |
| League play | “Population-based self-play” | 将 past + current + exploiters 采样为 opponents。 |
| Verifier reward | “Verifiable RL” | Reward 来自 deterministic checker（tests pass、answer matches）。 |
| Process reward | “PRM” | 为每个 reasoning step 打分，而不只是最终答案。 |

## 延伸阅读

- [Silver et al. (2017). Mastering the game of Go without human knowledge (AlphaGo Zero)](https://www.nature.com/articles/nature24270).
- [Silver et al. (2018). A general reinforcement learning algorithm that masters chess, shogi, and Go through self-play (AlphaZero)](https://www.science.org/doi/10.1126/science.aar6404).
- [Schrittwieser et al. (2020). Mastering Atari, Go, chess and shogi by planning with a learned model (MuZero)](https://www.nature.com/articles/s41586-020-03051-4).
- [Vinyals et al. (2019). Grandmaster level in StarCraft II (AlphaStar)](https://www.nature.com/articles/s41586-019-1724-z).
- [DeepSeek-AI (2024). DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models (GRPO)](https://arxiv.org/abs/2402.03300)  إدخال GRPO و مجموعة نسبية خط أساسية
- [DeepSeek-AI (2025). DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948) 完整的四阶段 R1 配方以及 R1-Zero ablation。
- [Brown et al. (2019). Superhuman AI for multiplayer poker (Pluribus)](https://www.science.org/doi/10.1126/science.aay2400) CFR على نطاق واسع + التعلم العميق
- [Tesauro (1995). Temporal Difference Learning and TD-Gammon](https://dl.acm.org/doi/10.1145/203330.203343)  افتتاح كل هذا مقال
- [Hugging Face TRL — GRPOTrainer](https://huggingface.co/docs/trl/main/en/grpo_trainer) استخدام وظائف مكافأة مخصصة 应用 GRPO 的生产参考──
- [Qwen Team (2024). Qwen2.5-Math — GRPO replication](https://github.com/QwenLM/Qwen2.5-Math) متعدد مقياسات على النسخة المفتوحة من R1 配方。
- [Sutton & Barto (2018). Ch. 17 — Frontiers of Reinforcement Learning](http://incompleteideas.net/book/RLbook2020.pdf) إطار تدريس للمكافآت المُصممة للاعب الذاتي  البحث و R1 على مستوى ماجستير في العلوم العليا 
