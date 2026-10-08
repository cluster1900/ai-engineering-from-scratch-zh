# نموذج المكافآت & RLHF

> الناس لا يستطيعون الحصول على رد فعل مساعد جيد كتابة وظيفة مكافأة، ولكن يمكنهم مقارنة اثنين من الردود، ومع ذلك لا تختار أفضل واحد.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 05 (Sentiment), Phase 9 · 08 (PPO)
**Time:** ~45 分钟

## 问题

أنت قد استخدمت هدف التنبؤ التالي لتدريب نموذج لغة. يمكن أن يكتب في لغة صحيحة.

كنت تريد مكافأة * * معينة، تعبر عن للاتصالات X، الاستجابة A مقارنة بالرد B 更好──手写

RLHF(Christiano et al. 2017; Ouyang et al. 2022)把偏好 转换成奖励模型,然后使用PPO 针对该奖励 优化LM──分三步:SFT → RM → PPO──这是 20232025年交付ChatGPT、Claude、Gemini以及其他所有一致-LLM配方──

بحلول عام 2026 ، سيتم استبدال PPO 步骤大多 بواسطة DPO ((مرحلة 10 · 08) ، لأنه أرخص ، وبالنسبة للتحديد التوجيهية لا يقل عن نفس الشيء. ولكن * نموذج الجوائز * 部分仍然支 على كل أفضل من نموذج N 、 كل RL-من-تحقق-جوائز أنابيب ، وكذلك نموذج التفكير لكل نموذج مكافأة عملية استخدام ✿ فهم RLHF ، فهمت كومة التوجيهية بأكملها ✿

## 概念

![Three-stage RLHF: SFT, RM training on pairwise prefs, PPO with KL penalty](../assets/rlhf.svg)

**Stage 1：Supervised Fine-Tuning（SFT）。**من النموذج الأساسي المسبق للتدريب 开始──在目标行为的人类编写示范 上细调(التدريس التابع للردود、الردود المفيدة وغيرها)`π_SFT`النموذج، فإنه * متجه نحو السلوك الجيد*، ولكن لا يزال هناك مساحة عمل غير محدودة.

**Stage 2：Reward Model training。**

- جمع على الإشارات`x`أزواج الاستجابة `(y_+, y_-)`, بواسطة البشر علامة على y_+ 优于 y_-。
- نموذج مكافأة التدريب`R_φ(x, y)`، دعها تعطيني`y_+`分配更高分数──
- الخسارة:**Bradley-Terry pairwise logistic**:

  `L(φ) = -E[ log σ(R_φ(x, y_+) - R_φ(x, y_-)) ]`

  σ هو sigmoid──reward 的差值隐含偏好 的日期odds──BT منذ 1952 سنة(برادلي-تيري) منذ كان دائماً هو الوسيلة القياسية، و هو أيضاً الوسيلة الرئيسية في RLHF الحديث──

- `R_φ`عادة ما يبدأ من نموذج SFT ، ويضيف رأس مقياسي على القمة.

**Stage 3：带 KL penalty、针对 RM 的 PPO。**

- من`π_SFT`سياسة التدريب الأولية`π_θ` ‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬`π_ref = π_SFT`.
- رد `y`结束时的奖励:

  `r_total(x, y) = R_φ(x, y) - β · KL(π_θ(·|x) || π_ref(·|x))`

  عقوبة KL 防止 `π_θ`أيّة أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية أية`π_SFT` إنه *مُتَنْظم*، وليس منطقة ثقة صعبة..`β`عادةً`0.01`-أجل`0.05`.
- استخدام هذه المكافأة 运行 PPO(درس 08)。 مزايا في مسار مستوى الرمز 上计算, ولكن RM فقط تعطى إجابة كاملة 打分。

**为什么需要 KL？**لا يوجد شيء، سيأتي مكتب الشرطة إلى هنا ليكشف عن استراتيجية القرصنة على المكافآت`π_θ`保持在RM 训练过的多元化 附近──它是RLHF最重要的单个旋──

**2026 状态：**

- **DPO**(رافائيلوف 2023): الجبر المغلق وضع المرحلة 2+3 لتثبيت في بيانات تفضيل  الخسارة المشرف عليها  لا RM، لا PPO‬  فقط تحتاج إلى جزء صغير من الحساب،  يمكن أن يكون في المقاييس التوجه  الوصول إلى نفس الجودة‬‬
- **GRPO**(DeepSeek 20242025): تغيرات الـPPO، باستخدام القاعدة النسبية للجماعة بدلاً من النقاد، الجائزة من *محقق*(جريات الرمز / تجاوب الرياضيات) ، بدلاً من RM.
- **Process reward models（PRMs）：**给部分解决方案 () 打分,用于RLHF 和 استدلال GRPO 变体──)
- **Constitutional AI / RLAIF：**استخدام التوازن LLM 生成 تفضيلات، بدلا من استخدام البشر.


```figure
reward-model
```

## بناءها

هذا الدرس يستخدم الاختلافات الصغرى من الاختلافات و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردود و الردودود و الودودود و الودودود و الودود و الودود و الودود`code/main.py`.

### الخطوة الأولى: بيانات تفضيلات صناعية

```python
PROMPTS = ["help me", "answer me", "explain this"]
GOOD_WORDS = {"clear", "specific", "kind", "thorough"}
BAD_WORDS = {"vague", "rude", "wrong", "short"}

def make_pair(rng):
    x = rng.choice(PROMPTS)
    y_good = rng.choice(list(GOOD_WORDS)) + " " + rng.choice(list(GOOD_WORDS))
    y_bad = rng.choice(list(BAD_WORDS)) + " " + rng.choice(list(BAD_WORDS))
    return (x, y_good, y_bad)
```

في واقع RLHF، هذا سيتم تغييرها بواسطة المسمّيات البشرية.`(prompt, preferred_response, rejected_response)`تماماً نفسها

### الخطوة الثانية: نموذج مكافأة برادلي تيري

النتيجة الخطية:`R(x, y) = w · bag(y)`تدريب لتقليل خسارة التسجيلات المتعددة:

```python
def rm_train_step(w, x, y_pos, y_neg, lr):
    r_pos = dot(w, bag(y_pos))
    r_neg = dot(w, bag(y_neg))
    p = sigmoid(r_pos - r_neg)
    for tok, cnt in bag(y_pos).items():
        w[tok] += lr * (1 - p) * cnt
    for tok, cnt in bag(y_neg).items():
        w[tok] -= lr * (1 - p) * cnt
```

بعد مرور بضع مئات من التحديثات`w`سأعطيك رموز الكلمات الجيدة، ويمزق الوزن الصحيح، ويمزق الوزن السيء

### الخطوة الثالثة: سياسة تشبه منظمة التعاون في مجال التنمية

سياسة اللعب لدينا ستعمل من المفردات في إنتاج رمز.`log π_θ(token | prompt)`, أضيف عقوبة KL-إلى الإشارة,并应用 قصة PPO بديلة

```python
def rlhf_step(theta, ref, w, prompt, rng, eps=0.2, beta=0.1, lr=0.05):
    logits_theta = policy_logits(theta, prompt)
    probs = softmax(logits_theta)
    token = sample(probs, rng)
    logits_ref = policy_logits(ref, prompt)
    probs_ref = softmax(logits_ref)
    reward = dot(w, bag([token])) - beta * kl(probs, probs_ref)
    # 在 theta 上做 ppo-style update，把 reward 当作 return
    ...
```

### الخطوة الرابعة: مراقب KL

كل تحديث يتبع معنى`KL(π_θ || π_ref)`إذا كان يرتفع`~5-10`, السياسة 已漂离 `π_SFT`很远  أسفل `β`هل يرتفع أو تبدأ عملية القرصنة المكافأة؟

### الخطوة 5: استخدام وصفة إنتاج TRL

فهم خط أنابيب الألعاب 后,下面是同一个循环作为真实图书馆用户的写法──Hugging Face 的 [TRL](https://huggingface.co/docs/trl)إنجاز المرجعية  المرحلة 2 用 `RewardTrainer`المرحلة الثالثة`PPOTrainer`(内置 KL-إلى المرجح)

```python
# Stage 2：来自 pairwise preferences 的 reward model
from trl import RewardTrainer, RewardConfig
from transformers import AutoModelForSequenceClassification, AutoTokenizer

tok = AutoTokenizer.from_pretrained("meta-llama/Llama-3.1-8B-Instruct")
rm = AutoModelForSequenceClassification.from_pretrained(
    "meta-llama/Llama-3.1-8B-Instruct", num_labels=1
)

# dataset rows: {"prompt", "chosen", "rejected"} — Bradley-Terry format
trainer = RewardTrainer(
    model=rm,
    tokenizer=tok,
    train_dataset=preference_data,
    args=RewardConfig(output_dir="./rm", num_train_epochs=1, learning_rate=1e-5),
)
trainer.train()
```

```python
# Stage 3：针对 RM 的 PPO，并对 SFT reference 加 KL penalty
from trl import PPOTrainer, PPOConfig, AutoModelForCausalLMWithValueHead

policy = AutoModelForCausalLMWithValueHead.from_pretrained("./sft-checkpoint")
ref    = AutoModelForCausalLMWithValueHead.from_pretrained("./sft-checkpoint")  # frozen

ppo = PPOTrainer(
    config=PPOConfig(learning_rate=1.41e-5, batch_size=64, init_kl_coef=0.05,
                     target_kl=6.0, adap_kl_ctrl=True),
    model=policy, ref_model=ref, tokenizer=tok,
)

for batch in dataloader:
    responses = ppo.generate(batch["query_ids"], max_new_tokens=128)
    rewards   = rm(torch.cat([batch["query_ids"], responses], dim=-1)).logits[:, 0]
    stats     = ppo.step(batch["query_ids"], responses, rewards)
    # stats 包含：mean_kl、clip_frac、value_loss — 三个 PPO diagnostics
```

مكتبة ستعمل تفعل ثلاثة أشياء`adap_kl_ctrl=True`实现 adaptive-β schedule: إذا تم ملاحظة KL 超过 `target_kl`,β 翻倍; إذا كان أقل من نصف,β 减半.`policy`معايير مشاركة. رأس القيمة مع السياسة`AutoModelForCausalLMWithValueHead`إضافة رأس MLP واسع النطاق) ، وهذا هو السبب في TRL 会分别报告 `policy/kl`和 `value/loss`.

## فخ

- **Over-optimization / reward hacking。**RM ليست كاملة`π_θ`سوف تجد النتيجة عالية ولكن الجودة أقل من الانتهاءات المتضاربة.`β`、拓宽 بيانات التدريب في مجال الـ RM
- **Length hacking。**في ردود الفعل المفيدة 上训练的RMs 往往隐式奖励长度──Politics 学会填充回复──补救:الدرجة المعادلة للدرجة، أو استخدام RLAIF RMs الدرجة الوعية──
- **RM 太小。**RM على الأقل تحتاج إلى السياسة مثل الكبير.
- **KL tuning。**β 太低 → drift 和 reward hacking──β 太高 → السياسة 几乎不变──标准技巧是使用一个以固定每步 KL 为目标的 *适应* β──
- **Preference-data noise。**حوالي 30% من اللبنانات البشرية لديها ضجيج أو غرابة. تمرّب من خلال البيانات المصفاة بالاتفاقية.
- **Off-policy problems。**بيانات PPO في العصر الأول 后会略略 خارج السياسة 像 درسي 08 那样监控 clip fraction 

## استخدمها

فترة الـ 2026 من المرحلة الـ RLHF هي:

| Layer | Target | Method |
|-------|--------|--------|
| Instruction following, helpfulness, harmlessness | Alignment | DPO（Phase 10 · 08）优于 RLHF-PPO。 |
| Reasoning correctness（math, code） | Capability | 使用 verifier reward 的 GRPO（Phase 9 · 12）。 |
| Long-horizon multi-step tasks | Agentic | 在 steps 上使用 process reward models 的 PPO / GRPO。 |
| Safety / refusal behavior | Safety | RLHF-PPO with separate safety RM，或 Constitutional AI。 |
| Best-of-N at inference | Fast alignment | 在 decode time 使用 RM；不需要 policy training。 |
| Reward distillation | Inference compute | 在 frozen LM 顶部训练一个小的 “reward head”。 |

RLHF هو 20222024 سنة من*ذلك* طريقة. حتى 2026 سنة، إنتاج خطوط أنابيب التوجه باستخدام DPO-أول من أهمية، وPPO فقط تستخدم RM-كثيفة أو خطوات حرجة للسلامة.

## 交付 it

保存为 `outputs/skill-rlhf-architect.md`:

```markdown
---
name: rlhf-architect
description: 为 language model 设计 RLHF / DPO / GRPO alignment pipeline，包括 RM、KL 和 data strategy。
version: 1.0.0
phase: 9
lesson: 9
tags: [rl, rlhf, alignment, llm]
---

给定一个 base LM、一个目标行为（alignment / reasoning / refusal / agent），以及 preference 或 verifier budget，输出：

1. Stage。SFT？RM？DPO？GRPO？并给出理由。
2. Preference or verifier source。Humans、AI feedback、rule-based、unit-test-pass 或 reward distillation。
3. KL strategy。Fixed β、adaptive β 或 DPO（implicit KL）。
4. Diagnostics。Mean KL、reward stability、over-optimization guard（holdout human eval）。
5. Safety gate。Red-team set、refusal rate、与 helpfulness RM 分开的 safety RM。

拒绝在没有 KL monitor 的情况下交付 RLHF-PPO。拒绝使用小于 target policy 的 RM。拒绝 length-only rewards。把任何没有留出 blind human-eval set 的 pipeline 标记为缺少 over-optimization protection。
```

## التدريب

1. **简单。**في`code/main.py`中用500 合成偏好对 训练布拉德利-تيري مكافأة نموذج──在 hold-out 的100 个对 上测量对式精度──应超过90%──
2. **中等。**استخدام `β ∈ {0.0, 0.1, 1.0}`运行 لعبة PPO-RLHF حلقة  مقابل كل قيمة، رسم درجة RM مقابل KL-إلى مرجع على التحديثات  أي ركوب  يحدث مكافأة-هاك؟
3. **困难。**في نفس البيانات المفضلة 上实现 DPO ((مختلفة-شكل المفضلة-محتملة الخسارة) ،并与RLHF-PPO管道 在使用的计算和达到最终 RM score 上对比──

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| RLHF | "Alignment RL" | 三阶段 SFT + RM + PPO pipeline（Christiano 2017, Ouyang 2022）。 |
| Reward Model (RM) | "The scoring net" | 通过 Bradley-Terry 拟合 pairwise preferences 学到的 scalar function。 |
| Bradley-Terry | "Pairwise logistic loss" | `P(y_+ ≻ y_-) = σ(R(y_+) - R(y_-))`；标准 RM objective。 |
| KL penalty | "Stay near the reference" | reward 中的 `β · KL(π_θ \|\| π_ref)`；anti-reward-hacking regularizer。 |
| Reward hacking | "Goodhart's law" | Policy 利用 RM 缺陷；症状：reward 上升，human eval 持平。 |
| RLAIF | "AI-labeled preferences" | 标签来自另一个 LM 而非人类的 RLHF。 |
| PRM | "Process Reward Model" | 给 partial reasoning steps 打分；用于 reasoning pipelines。 |
| Constitutional AI | "Anthropic's method" | 由显式规则引导的 AI-generated preferences。 |

## 延伸阅读

- [Christiano et al. (2017). Deep Reinforcement Learning from Human Preferences](https://arxiv.org/abs/1706.03741) 开创RLHF 的论文──
- [Ouyang et al. (2022). InstructGPT — Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) ChatGPT 背后配方──
- [Stiennon et al. (2020). Learning to summarize with human feedback](https://arxiv.org/abs/2009.01325) 更早用于 خلاصة RLHF。
- [Rafailov et al. (2023). Direct Preference Optimization](https://arxiv.org/abs/2305.18290) دبي؛2026 سنة بعد RLHF
- [Bai et al. (2022). Constitutional AI: Harmlessness from AI Feedback](https://arxiv.org/abs/2212.08073) RLAIF 和 حلقة النقد الذاتي
- [Anthropic RLHF paper (Bai et al. 2022). Training a Helpful and Harmless Assistant](https://arxiv.org/abs/2204.05862) HH 论文。
- [Hugging Face TRL library](https://huggingface.co/docs/trl) 生产级 `RewardTrainer`和 `PPOTrainer`❖阅读مدرب المصدر, فهم التكيفية-KL 和 القيمة رأس 细节──
- [Hugging Face — Illustrating Reinforcement Learning from Human Feedback](https://huggingface.co/blog/rlhf)من قبل لامبرت، كاستريكاتو، فون وررا، هافريلا  带图解的三阶段管道 经典 walkthrough。
- [von Werra et al. (2020). TRL: Transformer Reinforcement Learning](https://github.com/huggingface/trl)المكتبة`examples/`هناك وجه نحو المخطوطات الـ "لاما" و "ميسرال" و "كوين"
- [Sutton & Barto (2018). Ch. 17.4 — Designing Reward Signals](http://incompleteideas.net/book/RLbook2020.pdf) فرضية مكافأة 视角;思考 reward hacking 的必要前置知识──
