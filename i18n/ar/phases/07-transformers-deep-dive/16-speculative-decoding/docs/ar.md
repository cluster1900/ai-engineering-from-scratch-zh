# التشخيص المضارب  مسودة  التحقق ‬تكرار

> التشفير السريع هو سلسلة. كل رمز يجب أن ينتظر قبل Token. التشفير المضاربة ينفصل هذا السلسلة: نموذج رخيص أولا مشروع N 个 رمز، نموذج مكلف في مرسلة واحدة إلى الأمام للتحقق من كل N 个 رمز.

**Type:** Build
**Languages:** Python
**先修要求:**المرحلة 7 · 07 (GPT LM سببية) ، المرحلة 7 · 12 (KV مخزن و انتباه الفلاش)
**Time:** ~60 minutes

## 问题

واحد 70B LLM في H100 上采采样一个代币 需要大约30ms──一个3B草案模型 需要大约3ms──如果让3B草案 提前生成5代币,然后让70B *只运行一次*来验证这5代币,总耗时就是`5×3 + 30 = 45 ms`، أقصى عدد ممكن من 5 رموز ؛ ومدة إنتاج مباشرة مطلوبة`5×30 = 150 ms`هذا هو نقطة البيع الكاملة للتشخيص المضارب: باستخدام كمية قليلة من ذاكرة GPU إضافية (موديل مشروع) في مقابل 24× أقل تأخير لتشخيصها‬

关键在必须保留分布──Leviathan et al. (2023) و Chen et al. 同期提出的投机性采样保证输出序列与大模型单独生成时的分布**完全相同**ليس هناك أي نوع من الاختراقات

بحلول عام 2026، أربعة فئة من المحققين المخططين

1. **Vanilla speculative (Leviathan 2023)。**独立 مسودة النموذج ((مثل Llama 3 1B) + مؤكدة ((مثل Llama 3 70B) 
2. **Medusa (Cai 2024)。**في المحقق 上 إضافة العديد من الرأس فك التشفير،并行预测位置 `t+1..t+k` لا حاجة إلى نموذج مشروع مستقل
3. **EAGLE family (Li 2024, 2025)。**复用验证器 hidden states 的轻量草案;接受率比香更接近;典型为34×。
4. **Lookahead decoding (Fu 2024)。**التكرار جاكوبي؛ تماما لا حاجة إلى نموذج مشروع.

كل مستوى الإنتاج من 2026 عام تم إعطاء التشخيص المضاربة.

## مفهوم الأساسي

### 核心算法

أعطني مؤكدة`M_q`و مشروع أرخص`M_p`:

1. جعل`x_1..x_k`为已解码的前──
2. **Draft**: استخدام `M_p`التقدم السريع 提议 `d_{k+1}, d_{k+2}, ..., d_{k+N}`, للتعامل مع مشروع الاحتمالات`p_1..p_N`.
3. **并行 verify**: في `x_1..x_k, d_{k+1}, ..., d_{k+N}`上运行 مرة واحدة`M_q`، الحصول على موقع`k+1..k+N+1`احتمالات المؤكد `q_1..q_{N+1}`.
4. **从左到右 accept/reject 每个 draft token**: لكل واحد`i`، على نحو محتمل`min(1, q_i(d_i) / p_i(d_i))`اقبل
5. في الموقع`j`الرفض الأول: التوزيع "البقية" من بعد التوطين`(q_j - p_j)_+` 中采样 `t_j`.`j`بعد ذلك تم التخلي عن جميع المخططات
6. إذا كل شيء`N`个都被接受: من`q_{N+1}`采样一个额外 Token `t_{N+1}`(مفتوحة إعلانات مكافأة)

التوزيع المتبقية هذه المنهجية هي جعل الناتج وتوزيع مع`M_q`من النموذج المتماثل تماماً

### ما الذي يُقرر السرعة

جعل`α`= معدل قبول المتوقع لكل مشروع رمز`c`= نسبة تكلفة المسودة للمحقق:

- جيل ساذج كل رمز يحتاج لمكالمة نموذجية كبيرة
- عندما`α`很高时, المضاربة كل `(1 - α^{N+1}) / (1 - α) ≈ 1/(1-α)`个代币 需要1次大型号电话──

في`α = 0.75`و`N = 5`时,典型经验法则是: دعوة النموذج الكبير 减少 3×──草案成本是 5×便宜──总体墙钟 约下降 2.5×──

**α 取决于：**

- درجة التقارب مع المحقق في مشروع المعلومات العائلية / التدريبية ستتحقق من ارتفاع كبير
- استراتيجية فك التشفير. مسودة طموحة.
- نوع المهام──رمز ومخرجات مهيكلة 接受更多(更可预测);自由形式创意写作接受更少──

### مدوسة  没有 مسودة نموذج

ميدوزا تستخدم المؤكد 上的额外输出头 替代草案模型──在位置 `t`:

```
shared trunk → hidden h_t
    ├── head_0: predict token at t+1  (standard LM head)
    ├── head_1: predict token at t+2
    ├── head_2: predict token at t+3
    ├── head_3: predict token at t+4
```

كل رأس خرج منطقاته إيجابية ، أنت من كل رأس ‬مثل الحصول على الترتيبات المرشحة، ثم باستخدام مرور واحد إلى الأمام 和 خطة الاهتمام الشجرة 同时考虑所有候选继续来验证‬

优点:没有第二个模型──缺点: زيادة المعايير القابلة للتدريب؛ تحتاج إلى مرحلة تحسينات رقابة 阶段(约1B Token);

### النسر  通過复用隱藏狀態  الحصول على مسودة أفضل

EAGLE-1/2/3 (Li et al., 20242025) سوف يضع النموذج المسودة المصممة لمحول صغير جداً (عادة 1 طبقة) ، حيث يمكن للمؤكد أن يظهر المكونات المخبأة للشخصية، حيث أن التوقعات والتوزيع المنتج للمؤكد يتصلون بقدرة عالية على تقسيمها.

إيغل-3 (2025)  إضافة إلى بحث شجرة لمواصلة المرشحين vLLM 和 SGLang 将Eagle-2/3 作为Llama 3/4 和 Qwen 3 的默认规范路径

### رقص كيو كيو

التحقق من ذلك`N`个草案代币 在一次前进通 中给验证器──这将把验证器的KV缓存 扩展 `N`项── إذا تم رفض بعض المسودات، يجب عليك وضع الاحتفاظ بالخزنة مرة أخرى إلى طول المقبلات المقبلة──

生产实现(vLLM 的 `--speculative-model`、TensorRT-LLM's LookaheadDecoder) من خلال خدش كيف بوفرز 处理 this thing──先写入,接受时再 commit──概念上不难,但细节很繁──


```figure
draft-verify-tokens
```

## بناءها

见 `code/main.py` نحن نستخدم المكونات التالية لتحقيق التركيز المضاربي-معينة 算法 (خطوة الرفض + التوزيع المتبقية):

- "نموذج كبير" ، وهو في التوزيع المكتوب يدوياً تحديدية-رقيقة
- "موديل مسودة" ، إنه النموذج الكبير
- حلقة قبول / رفض، وتوليد التوزيع الهامشية المماثلة مع العينات المباشرة.

### الخطوة الأولى: خطوة الرفض

```python
def accept_or_reject(q_prob, p_prob, draft_token, u):
    ratio = q_prob / p_prob if p_prob > 0 else float("inf")
    return u < min(1.0, ratio)
```

`u`هو رقم عشوائي متساوي`q_prob`هو مؤكد على احتمالية إعداد الرمز`p_prob`يذكر نظرية ليفياثان أن قرار برنولي بالإضافة إلى رفضه من النموذج المتبقية يمكن الاحتفاظ بدقة بتوزيع المؤكد.

### 步骤 2: توزيع البقايا

```python
def residual_dist(q, p):
    raw = [max(0.0, qi - pi) for qi, pi in zip(q, p)]
    s = sum(raw)
    return [r / s for r in raw]
```

كل عنصر`q`中减去`p`، سوف يضع القيمة السلبية إلى الصفر ثم يعيد التأليف

### الخطوة الثالثة: خطوة تكهنة

```python
def spec_step(prefix, q_model, p_model, N, rng):
    drafts = []
    p_probs = []
    ctx = list(prefix)
    for _ in range(N):
        p_dist = p_model(ctx)
        d = sample(p_dist, rng)
        drafts.append(d)
        p_probs.append(p_dist[d])
        ctx.append(d)

    q_dists = [q_model(prefix + drafts[:i]) for i in range(N + 1)]

    for i, d in enumerate(drafts):
        u = rng.random()
        q_prob = q_dists[i][d]
        p_prob = p_probs[i]
        if u < min(1.0, q_prob / p_prob if p_prob > 0 else float("inf")):
            prefix = prefix + [d]
        else:
            res = residual_dist(q_dists[i], p_model(prefix))
            prefix = prefix + [sample(res, rng)]
            return prefix
    prefix = prefix + [sample(q_dists[N], rng)]
    return prefix
```

接受五个 → 一个奖金 → 一次验证通 生成六个代币──

### الخطوة 4: قياس معدل قبول

في مختلف مسودة الجودة 水平下运行 10,000 个投机步骤── رسم معدل قبول مع مسودة 和 مؤكد تقسيم بين KL الاختلافات── يجب أن ترى صراحة علاقة واحدة‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

### الخطوة 5: التحقق من توزيع الأسعار المتكافئة

تجربة التجربة:حلقة المضاربة 生成 Token 直方图 يجب أن يتناسب مباشرة من المحقق 采样得到的直方图── هذا هو نظرية ليفياثان في الممارسة── اختبار تشي-سكوار 会确认差异在样本错误 范围内──

## استخدمها

الإنتاج:

```bash
# vLLM with EAGLE
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --speculative-model /models/llama-3.1-eagle-70b \
    --speculative-draft-tensor-parallel-size 1 \
    --num-speculative-tokens 5

# vLLM with vanilla draft model
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --speculative-model meta-llama/Llama-3.2-1B-Instruct \
    --num-speculative-tokens 5
```

截至 2026年中,TensorRT-LLM 拥有最快的梅杜萨路径──`faster-whisper`"تصفيقات" "تصفيقات"

**选择 draft：**

| Strategy | 何时选择 | Speedup |
|----------|--------------|---------|
| Vanilla draft (1B/3B Llama family) | 快速 prototype，无需 training | 1.8–2.3× |
| Medusa heads | 你可以 fine-tune verifier | 2–3× |
| EAGLE-2 / 3 | Production，最高速度 | 3–4× |
| Lookahead | 无 draft、无 training、无额外 params | 1.3–1.6× |

**什么时候不要 spec-decode：**

- فقط توليد 15 个 Token من التسلسلة الواحدة جيل.
- 极具创意 / عينة درجة حرارة عالية ((α 会下降)
- النشاطات المحدودة في الذاكرة (موديل مشروع 会增加 VRAM)

## 交付 it

见 `outputs/skill-spec-decode-picker.md` هذه المهارة 会为新 الاستنتاج عبء العمل 选择一种 استراتيجية التشخيص المضاربة (فانيلا / ميدوسا / إيغل / لوك هيد) وكذلك معايير ضبط (N、درجة حرارة المسودة) 

## التدريب

1. **Easy。**运行 `code/main.py` تأكيد في 50،000 个 Token 上، التوزيع التكهنوي للتوكين مطابقة لتوزيع العينات المباشرة للمؤكد، و p = 0.05 
2. **Medium。**على`α = 0.5, 0.7, 0.85`, رسم السرعة ((( كل مرة نموذج كبير إلى الأمام`N`تغيرات.`N`◊(توصيل: في كل مرة للتحقق من الدعوة`(1 - α^{N+1}) / (1 - α)`(
3. **Hard。**实现 a tiny Medusa:取 Lesson 14 的顶石 GPT,添加 3 个额外 LM头,分别预测位置 t+2、t+3、t+4──在小摇钱树上用联合多头损失 训练──与通过截断同一个模型得到的香草草比较接受率──
4. **Hard。**实现 rollback: من مخطط KV cache 10 رموز 开始,进入 5 رموز مشروع,模拟在位置 3 رفض.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| Draft model | “便宜的那个” | 一个更小的模型，用于提出候选 Token；通常比 verifier 便宜 10–50×。 |
| Verifier | “大的那个” | 我们要保留其分布的目标模型；每个 speculative step 运行一次。 |
| Acceptance rate (α) | “draft 有多常对” | verifier 接受 draft 的 per-token probability。典型为 0.7–0.9。 |
| Residual distribution | “rejection fallback” | 归一化后的 `(q - p)_+`；rejection 时从这里采样可保留 verifier 的分布。 |
| Bonus token | “免费的那个” | 当全部 N 个 draft 被接受时，从 verifier 的 next-step distribution 再采样一个。 |
| Medusa | “Draft-less speculative” | verifier 上的多个 LM heads 并行预测位置 t+1..t+k。 |
| EAGLE | “Hidden-state draft” | 以 verifier last-layer hidden states 为条件的 tiny transformer draft。 |
| Lookahead decoding | “Jacobi iteration” | 使用 fixed-point iteration 的 self-speculation；没有 draft model。 |
| Tree attention | “一次 verify 多个候选” | 同时考虑多个 draft continuations 的 branching verification。 |
| KV rollback | “撤销 rejected drafts” | Scratch KV buffer；接受时 commit，reject 时 discard。 |

## 延伸阅读

- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) 核心算法与等式定理。
- [Chen et al. (2023). Accelerating Large Language Model Decoding with Speculative Sampling](https://arxiv.org/abs/2302.01318) 同期提出;清晰的伯努利-رفض 证明──
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) ميدوسا 论文; شجرة الاهتمام 验证。
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) إيغل-1؛ على أساس مخططات حالة مخفية
- [Li et al. (2024). EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees](https://arxiv.org/abs/2406.16858) النسر-2؛عمق شجرة ديناميكي
- [Li et al. (2025). EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test](https://arxiv.org/abs/2503.01840) النسر-3。
- [Fu et al. (2024). Break the Sequential Dependency of LLM Inference Using Lookahead Decoding](https://arxiv.org/abs/2402.02057)انظروا إلى الأمام، لا مسودة
- [vLLM docs — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode.html)                               
- [SafeAILab / EAGLE reference implementation](https://github.com/SafeAILab/EAGLE) إيجل-1/2/3 
