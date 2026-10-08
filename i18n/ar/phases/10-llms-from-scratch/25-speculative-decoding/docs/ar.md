# التشخيص المضارب و الـ " إيغل "

> الحدود LLM 生成 Token 需要进行一次完整ة التسلل إلى الأمام على مليارات العناصر. إن تخصيص هذا التسلل إلى الأمام هو أبعد من الحاجة الفعلية: في معظم الأحيان، يمكن لنموذج صغير أكثر من ذلك أن يقدر بشكل صحيح على التحقق من التسلل التالي 3-5 ، بينما يتطلب النموذج الكبير فقط * التحقق* من هذا التوقع.

**Type:** Build
**Languages:** Python (with numpy)
**Prerequisites:** Phase 10 Lesson 12 (Inference Optimization), Phase 10 Lesson 04 (Pre-training Mini-GPT)
**Time:** ~75 minutes

## 问题

نموذج 70B  درجة تعريف النموذج في H100 فوق عادة ما تكون 40-80 رموز / ثانية. كل رموز تحتاج مرة واحدة كاملة إلى الأمام، من HBM  قراءة جميع أوزان النموذج.

الجيل السريع يبدو طبيعياً`x_{t+1} = sample(p(· | x_{1:t}))`ولكن هناك فرصة هنا إذا كان لديك متنبؤ رخيص يقول  التالي 4 رموز 很可能是 [a، b، c، d]، يمكنك أن تكون في**大 model 的单次 forward pass**في التحقق من كل 5 مواقع،并接受最长匹配前──

ليفياثان، كالاي، ماتيا ((2023،استعمال إيجاز سريع من المحولين عبر التشخيص المضارب) من خلال قبول / رفض 规则精确实现 هذا النقطة،该规则保留 نموذج الهدف التوزيع العينات‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

## 概念

### 双 النموذج  إعداد

- **Target model** `M_p`: تَريدي حقاً أنْ تَتَحَدَّثَ مِنْ نموذجٍ كبيرٍ ٬缓慢、高质量模型──توزيع:`p(x)`.
- **Draft model** `M_q`:小型、快速、質量较低的模型──توزيع:`q(x)`✿小 5-30x✿

كل خطوة:

1. مشروع النموذج بالتراجع 提议 `K`رموز:`x_1, x_2, ..., x_K ~ q`.
2. النموذج المستهدف للجميع`K+1`个位置并行运行一次前行,为每提议代币 生成 `p(x_k)`.
3. 按下面修改后的拒绝-样本规则从左到右接受/拒绝 每个代币──接受最长匹配前──
4. إذا تم رفض أي رمز، فإن التوزيع من بعد التعديل في الاختلاف لا يتوقف.`p(· | x_1...x_K)`采样一个奖金代币──

إذا كان المسودة تتطابق تماما مع الهدف، يمكنك الحصول على كل هدف من قبل K + 1 رموز.

### 精确性规则

تشفير المضاربة**在 distribution 上可证明等价于从 p 采样** الرفض 规则:

```
For each drafted token x_t:
    r ~ Uniform(0, 1)
    if r < p(x_t) / q(x_t):
        accept x_t
    else:
        sample replacement from residual: (p - q)+ / ||(p - q)+||_1
        stop
```

من بينهم`(p - q)+`تعبر عن الفاصل بين النقاط.`p ≈ q`) , عندما يقترب قبول 1 . عندما تكون غير متطابقة , سيتم تشكيل التوزيع المتبقية , بحيث يتم تحديد نموذج الكامل`p`.

**Greedy 情况。**لامتثال لعدد الحرارة = 0، فقط يجب أن يتم فحصها`argmax(p) == x_t`إذا كان، فاقبل، إذا لم يكن، فانخراج`argmax(p)`و توقف

### 期望 تسريع

إذا كان معدل قبول مشروع النموذج من الـ Token 级 هو `α`, إذا كل مرسلة هدفية إلى الأمام 生成的期望令牌 数为:

```
E[tokens] = (1 - α^{K+1}) / (1 - α)        # K = draft length, α in [0, 1]
```

عندما`α = 0.8, K = 4`:`(1 - 0.8^5)/(1 - 0.8) = 3.36`个代币 每次前进──一次目标前进的成本大约是 `cost_q * K + cost_p`(ك 个 مسودة خطوة إضافة مرة واحدة التحقق من الهدف)`cost_p >> cost_q * K`, نسبة تسريع الإنتاج هي`3.36× / 1 = 3.36×`.

العنصر الحقيقي الوحيد هو`α`، يعتمد تماما على التوجه المخطط-الهدف المخطط جيد المخطط هو كل شيء

### 训练 مسودة: التطهير

随机的小模型会成为很差的草案――المركز المعتاد هو من المستهدف:

1. 选择一个小建筑(70B هدف على التكامل حوالي 1B,7B هدف على التكامل حوالي 500M)
2. في حجم الكبير من النموذج المستهدف على متن المواد؛ تخزين توزيعات الوهم التالية لها.
3. استخدام KL التباين  تدريب مشروع، جعل توازنها لتوزيع الهدف

النتيجة هي:`α`في التشفير العادي 0.6-0.8، في الدردشة لغة الطبيعة 0.7-0.85، وتسريع الإنتاج هو 2-3x.

### النسر: صياغة الأشجار + إعادة استخدام الميزات

Li、Wei、Zhang、Zhang(2024،EAGLE: الاختبار المضاربي يتطلب إعادة التفكير في الميزة عدم اليقين) لاحظ القياسية للكشف المضاربي وسط نقطتين منخفضة النتائج:

1. مسودة تنفيذ خطوة K 个串行, كل واحد منهم كاملة. ولكن يمكن استخدام مسودة مرة أخرى للتحقق من آخر مرة في ميزات الهدف (الولايات الخفية) ، لأن الهدف قد حسب تمثيلات غنية، والمسودة في طريقها إلى إعادة توجيهها.
2. مشروع 输出一条线性链──如果 مشروع 能输出一个候选人 *tree*(每个节点有多个猜测),الهدف واحد مرة إلى الأمام المرور على المرور من خلال قناع الاهتمام الشجرة 并行验证多条候选人路径,并选择最长接受分支──

تغيرات في إيغل-1:
- مسودة المدخل = الهدف في حالة مخفية نهائية من موقع t، وليس رموز خامة.
- المخططات الهندسة المعمارية = 1 个 محولات القيادة الطبقة ((不是独立的小模型) ⋅
- المخرج = كل عمق لديه K = 4-8 مرشحات

إيجل-2(2024) إضافة إلى التطبيقات التشريعية للشجرة: في مشروع غير محدد، الشجرة 变宽; في مشروع مكانة الذات، الشجرة 保持较窄── في عدم زيادة التحقق من تكلفة تحسين `α_effective`.

EAGLE-3(Li et al. 2025,EAGLE-3: تحسين التسارع الإيجابي لنماذج اللغة الكبيرة عبر اختبار التدريب-الوقت) إزالة اعتماد ميزة الطبقة العليا الثابتة،并使用新的اختبار-وقت محاكاة الخسارة 訓練 مسودة،也就是让在匹配 標籤/verify 3.0 提升到4.5 

### التحقق من الاهتمام بالأشجار

عندما يُصوّر مشروع 输出树 时,target model 使用 **tree attention mask**في مرور واحد إلى الأمام تحقق ذلك. أقناع الاهتمام الشجرة هي قناع سببي، فإنه يحدد أوضاع الأشجار، وليس مجرد هيكل خطي. كل رمز فقط يشارك إلى أسلافها في الشجرة.

```
        root
       /    \
      a      b
     / \    / \
    c  d   e   f
```

إذا`a, b`هم أول مرشحين في المباراة`c, d, e, f`إذا كان المرشحين الثانيين من الرمز، فإن جميع المواقع ستة قادرة على التحقق من خلال مرور واحد إلى الأمام.

### ماذا يحدث؟ ماذا يحدث؟

**有效：**
- دردشة / إكمال, و文本可预测(رمز、常见 الإنجليزية、إخراج منظم)`α`高♪
- فك 阶段有未使用GPU compute 的设置(مرحلة مقيدة بالذاكرة) ――صياغة الأشجار 使用可用 FLOPs──

**无效 / 没有收益：**
- 高随机性输出 ((توقيت عالي من الدرجة الحرارة))`α`-أجل`1/|vocab|`أسفل
- التناغم عال جداً من خدمة اللحظة، اللحظة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة، المجموعة.
- نماذج هدف صغيرة جداً، في هذه اللحظة لم يكن هناك الكثير من النماذج الصغيرة

فريق الإنتاج عادة ما يبلغ عن الدردشة، هناك تسريع الساعة الجدارية 2-3x، وتوليد الرمز، هناك 3-5x، بينما الكتابة الإبداعية،


```figure
speculative-decoding
```

## بناءها

`code/main.py`:

- إشارة إلى تحقيق`speculative_decode(target, draft, prompt, K, temperature)`، فإنه يحقق الرفض المحدد 规则,并验证它保留 target's distribution (( KL تجربي < 0.01 مقابل عينة هدف عادية) 👇
- مصمم شجرة على طراز النسر، باستخدام أعلى أسطوانات
- من صنع قناع الاهتمام على الأشجار، وذلك من أجل التحقق من أنماط السببية الصحيحة
- واحد من خطط معدل قبول، في LM صغيرة 上运行两者(من GPT-2-متوسط الهدف تصفيح واحد GPT-2-صغير)

```python
def speculative_step(p_target, q_draft, K, temperature=1.0):
    """One round of speculative decoding. Returns list of accepted tokens."""
    # 1. Draft K tokens
    draft_tokens = []
    q_probs = []
    state = draft_state_init()
    for _ in range(K):
        probs = softmax(q_draft(state) / temperature)
        t = np.random.choice(len(probs), p=probs)
        draft_tokens.append(t)
        q_probs.append(probs[t])
        state = draft_step(state, t)

    # 2. Target computes p at every drafted position + 1 extra
    p_probs_all = target_forward_batched(p_target, draft_tokens, temperature)

    # 3. Accept/reject left-to-right
    accepted = []
    for k, tok in enumerate(draft_tokens):
        r = np.random.uniform()
        if r < p_probs_all[k][tok] / q_probs[k]:
            accepted.append(tok)
        else:
            residual = np.maximum(p_probs_all[k] - q_probs[k], 0)
            residual /= residual.sum()
            accepted.append(np.random.choice(len(residual), p=residual))
            return accepted
    # 4. All K accepted → sample bonus token from target
    accepted.append(np.random.choice(len(p_probs_all[-1]), p=p_probs_all[-1]))
    return accepted
```

## استخدمها

- **vLLM**和 **SGLang**提供一等 تشفير المضاربة 支持──علمات:`--speculative_model`.`--num_speculative_tokens`◊إيغل-2/3      `--spec_decoding_algorithm eagle`العلم 支持。
- **NVIDIA TensorRT-LLM**أصل الحياة تدعم مدوسة و أشجار النسر
- **Reference draft models**:`Qwen/Qwen3-0.6B-spec`(للاستخدام في مسودات Qwen3-32B)`meta-llama/Llama-3.2-1B-Instruct-spec`(للاستخدام في مسودات 70B)
- **Medusa heads**(Cai et al. 2024,Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads): لا تستخدم نموذج مشروع، بل في هدف 自身 添加 K 个并行 التنبؤ رؤوسها──部署更简单, قبول 略低于EAGLE──

## 交付 it

本课会产出 `outputs/skill-speculative-tuning.md`, هي مهارة، تستخدم لتحليل عبء العمل من النموذج المستهدف،并选择:مودل مسودة、K(طول مسودة)、 عرض الشجرة、حرارة،以及何時 fallback إلى فك الرمز البسيط‬

## التدريب

1. 实现精确拒绝 规则并进行实证验证──通过 `speculative_decode`ويعدّ نموذج الهدف العادي 分別运行 10K عينات؛ حساب التوزيعين الخارجيين  بين المسافة التلفزيونية──应小于0.01──

2. 计算加速 公式──给定固定 `α`和 `K`, رسم كل مرة الهدف-مضي قدما من توقعات الارقام .

3. 訓練一 draft صغير── خذ هدف 124M GPT-2، ووضع 100M رموز 上 استخدام KL خسارة نزيل واحد 30M GPT-2 draft── قياس النص المحتمل 上 of `α` توقعات: 0.6-0.7

4. 实现 EAGLE-style tree drawing──不要使用链,而是让草稿 在每个深度 输出前3分支──构建树注意面具──验证目标 接受最长正确分支──

5. 测量 failure modes──在 temperature=1.5(高随机性) 下运行 تخمينات التشخيص── عرض α 崩塌, ونتيجة للدفع الجوي، هذا الخوارزمية مقارنة بتشخيصات بسيطة 更慢──

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|-----------------|------------------------|
| Target model | “大 model” | 你想从中采样的缓慢、高质量 model（p distribution） |
| Draft model | “speculator” | 小型、快速 predictor（q distribution）；小 5-30x |
| K / draft length | “Look-ahead” | 每次 verify pass 推测的 Token 数 |
| α / acceptance rate | “Hit rate” | draft 提议被接受的每 Token 概率 |
| Exact rejection rule | “accept test” | 保留 target distribution 的 r < p/q 比较 |
| Residual distribution | “修正后的 p-q” | (p - q)+ / ||(p - q)+||_1，rejection 时要从中采样的 distribution |
| Tree drafting | “Branching speculation” | Draft 输出候选 tree，并用 tree-structured attention mask 在一次 pass 中 verify |
| Tree attention mask | “Topological mask” | 编码 tree topology 的 causal mask，使每个 node 只 attend 到它的 ancestors |
| Medusa heads | “Parallel heads” | target 自身上的 K 个额外 prediction heads；没有独立 draft model |
| EAGLE feature reuse | “Hidden-state draft” | Draft input 是 target 的最后 hidden state，而不是 raw tokens，从而缩小 draft |
| Test-time simulation loss | “EAGLE-3 training” | 在匹配 target test-time distribution 的输出上训练 draft，而不是 teacher forcing |

## 延伸阅读

- [Leviathan, Kalai, Matias, 2023 — "Fast Inference from Transformers via Speculative Decoding"](https://arxiv.org/abs/2211.17192) 精确 رفض 规则和理论加速 分析
- [Chen, Borgeaud, Irving et al., 2023 — "Accelerating Large Language Model Decoding with Speculative Sampling"](https://arxiv.org/abs/2302.01318) DeepMind  مقال متزامن
- [Cai, Li, Geng, Wang, Wang, Zhu, Dao, 2024 — "Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads"](https://arxiv.org/abs/2401.10774) مشروع نموذج  替代方案
- [Li, Wei, Zhang, Zhang, 2024 — "EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty"](https://arxiv.org/abs/2401.15077) إعادة استخدام الميزات و رسم الأشجار
- [Li et al., 2024 — "EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees"](https://arxiv.org/abs/2406.16858) 动态 أرضية الأشجار
- [Li et al., 2025 — "EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test"](https://arxiv.org/abs/2503.01840) توازن الوقت الاختبار في الوقت المتعلق بالقطار
- [Fu, Haotian, Peng et al., 2024 — "Break the Sequential Dependency of LLM Inference Using Lookahead Decoding"](https://arxiv.org/abs/2402.02057) تشفير جاكوبي/لوكا هيد، نوع لا يحتاج المضارب
