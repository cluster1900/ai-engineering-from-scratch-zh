# مزيج من الخبراء (ميزة)

> واحد كثيفة 70B محول سوف تتمثل في كل رمز  تنشيط جميع العناصر ‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

**Type:** Build
**Languages:** Python
**先修要求:**المرحلة 7 · 05 (المحول الكامل) ، المرحلة 7 · 07 (GPT)
**Time:** ~45 minutes

## 问题

معدل التغيرات الكثيفة في الاستنتاجات  فلوفات                                                                                                                                                                                                                                                      

مزيج من الخبراء 打破了这种关联──把每一个FFN 替换成`E`خبراء مستقلين + واحد لكل رمز`k`个专家的路由器──总参数 = `E × FFN_size` عدد فعال لكل رمز = `k × FFN_size` تكوين عام 2026:`E=256`،`k=8`الاحتفاظ`E`扩展,计算随 `k`扩展‬

حدود 2026 سنة  تقريبا كاملة هي MoE:DeepSeek-V3(671B إجمالي / 37B نشط) 、مختل 8×22B、Qwen2.5-MoE、Llama 4、Kimi K2、gpt-oss。

## 概念

![MoE layer: router selects k of E experts per token](../assets/moe.svg)

### FFN 替换

كتلة محول كثيفة:

```
h = x + attn(norm(x))
h = h + FFN(norm(h))
```

حظر المياه

```
h = x + attn(norm(x))
scores = router(norm(h))              # (N_tokens, E)
top_k = argmax_k(scores)              # pick k of E per token
h = h + sum_{e in top_k}(
        gate(scores[e]) * Expert_e(norm(h))
    )
```

كل خبير مدينة مستقلة FFN ((عادة ما تكون SwiGLU)  راوتر هو طبقة واحدة  كل رمز  اختيار الخاص بك `k`الخبراء، ومحصولهم على الخليط المفتوح

### توازن الحمل 问题

إذا كان الجهاز الجهاز يسمح لـ 90% من الوهمات أن تمر من قبل الخبير 3 ، الخبراء الآخرون سوف يموتون من الجوع.

1. **Auxiliary load-balancing loss**(تحول المتحول  مختلط)  إضافة مع الخبير استخدام معدل التفاوت إلى مقارنة مع العقوبة
2. **Expert capacity + token dropping**(مبدل مبكر) ✿ كل خبير 最多处理 `C × N/E`个 टोकن;溢出的 Token 跳过该层──会损害质量──
3. **Auxiliary-loss-free balancing**(DeepSeek-V3)── إضافة تحيز يمكن تعلمه لكل خبير، لتحويل أفضل اختيارات الجهاز التوجيهي── التحيز في فقدان التدريب 部更新──不对主目标添加惩罚──这是突破重要2024年──

ممارسة DeepSeek-V3: بعد كل خطوة تدريبية، تحقق مع كل خبير أن معدل استخدامها مرتفع أو أقل من الهدف.`±γ`微调偏选择时使用 `scores + bias` استخدام احتمالات الخبراء في البوابات  لا يزال يستخدم غير المعدل`scores`هذا سيقوم بتوجيه مع تعبير

### خبراء مشتركون

DeepSeek-V2/V3 أيضاً تحوي الخبراء إلى *مشتركة* و *مُتوجّه*♦ كل رمز تمر عبر جميع الخبراء المشتركين♦ الخبراء المُتوجّهين 通過 top-k 选择♦ الخبراء المُتوجّهين 捕获通用知识; الخبراء المُتوجّهين 负责专门化♦ V3 运行 1 خبيراً مُتوجّهًا، بالإضافة إلى 256 خبيراً مُتوجّهًا من بين أفضل 8♦

### خبراء في الحيوانات

كل خبير وكل FFN`E`较小(8-64) ،`k`较小(1-2)。

现代 حبة صغيرة من الحبة (DeepSeek-V3、Qwen-MoE): كل خبير 更窄(1/8 حجم FFN)`E`很大(256+) ،`k`更大(8+)。总参数相同, ولكن مجموعة عدد توسع 快得多。`C(256, 8) = 400 trillion`种可能的每代币 专家──质量提升,延迟 保持不变──

### 成本图片

كل رمز

| Config | Active params / token | Total params |
|--------|-----------------------|--------------|
| Mixtral 8×22B | ~39B | 141B |
| Llama 3 70B (dense) | 70B | 70B |
| DeepSeek-V3 | 37B | 671B |
| Kimi K2 (MoE) | ~32B | 1T |

DeepSeek-V3 في كل المقاييس تقريباً 上都胜过 Llama 3 70B ((مكتظة) ، في الوقت نفسه**每个 Token 使用更少的活跃 FLOPs**△更多参数 = 更多知识──更多活跃 FLOPs = كل رمز 更多计算──MOE 将它们解──

### 代价:ذاكرة

无论哪些专家被触发,所有专家都必须驻留在GPU 上――一个671B 模型需要约1.3TB VRAM来存储fp16权重――边界MoE部署 需要专家并行:把专家分分到多个GPU 上,通过网络路线代币――延迟 主要由所有人交流 主导,而不是 ماتمول――


```figure
expert-routing
```

## بناءها

参见 `code/main.py`                                                                                                                                                                                                                                                              

- `n_experts=8`个近似 SwiGLU 的专家(为了说明, كل واحد فقط خطي)
- التوجيه العلوي k=2
- أوزان المفاتيح المعتادة لـ softmax
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

### 步骤1: الجهاز التوجيهي

```python
def route(hidden, W_router, top_k, bias):
    scores = [sum(h * w for h, w in zip(hidden, W_router[e])) for e in range(len(W_router))]
    biased = [s + b for s, b in zip(scores, bias)]
    top_idx = sorted(range(len(biased)), key=lambda i: -biased[i])[:top_k]
    # softmax over ORIGINAL scores of the chosen experts
    chosen = [scores[i] for i in top_idx]
    m = max(chosen)
    exps = [math.exp(c - m) for c in chosen]
    s = sum(exps)
    gates = [e / s for e in exps]
    return top_idx, gates
```

التحيز  تأثير اختيار، لا تؤثر على وزن البوابة  هذه هي مهارات DeepSeek-V3: التحيز في حالة عدم تحديد النموذج التوقعي لتصحيح عدم توازن الحمل 

### الخطوة 2: جعل 100 个 رمز 通过 راوتر

تتبع أي خبراء يتم تلقيحهم ومعظم التلقيحات.`-γ`, استخدام غير كاف`+γ`) بعد ذلك، فإن معدل الاستخدام سيكون منتقلاً متوسطاً خلال عدة أجيال.

### الخطوة 3: العوامل مقابل النسبة

打印一个 MoE config 的 density equivalent──DeepSeek-V3 形状:256 توجيه + 1 مشاركة,8 نشطة,d_model=7168──总参数非常惊人──活跃参数只有 كثافة Llama 3 70B 的七分之一──

## استخدمها

"تقبيل الوجه"

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained("mistralai/Mixtral-8x22B-v0.1")
```

إستنتاجات الإنتاج لعام 2026: vLLM 原生支持 MoE توجيهات.SGLang 拥有最快的专家-并行路径.

**何时选择 MoE：**
- كنت ترغب في الحصول على جودة الحدود في تكلفة استنتاج هر رموز أقل
- لديك بنية تحتية متوازية لـ (VRAM)
- تحميل العمل الخاص بك هو رمزية ثقيلة (( دردشة、 رمز) ، وليس سياق ثقيل ((طويل وثائق) 👇

**何时不要选择 MoE：**
- نشر الحافة: ستدفع تكاليف التخزين الكاملة لأي FLOP نشط
- خدمة المستخدم الواحد الحرجة للثوان: توجيه الخبراء 会增加 Overhead。
- 小模型(<7B): يظهر مؤشر MOE فقط في ما يزيد عن عتبة حسابية ((حوالي 6B المعلمات النشطة) بعد ذلك

## 交付 it

参见 `outputs/skill-moe-configurator.md` هذه المهارة ستعمل على أساس الميزانية المحددة، وتعليمات التدريب، والهدف المطلوب لتنفيذها، وذلك من أجل تعيين جديد لـ MoE 选择 E、k 和 مشاركة التخطيط الخبير‬

## التدريب

1. **Easy.**运行 `code/main.py`◊ مشاهدة التحديثات التحديدية الخالية من الخسائر المساعدة 如何在50 次中拉平专家使用──
2. **Medium.**استخدام الجهاز التوجيهي القائم على الهاش (التأكد 无需学习) استبدال الجهاز التوجيهي المتعلم.
3. **Hard.**实现 GRPO-style rollout-matched routing(DeepSeek-V3.2 技巧): سجل الاستنتاج 期间 哪些专家被触发,在 Gradient 计算期间强制使用相同路由──在一个玩具政策-gradient设置 上测量效果──

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| Expert | “众多 FFN 中的一个” | 一个独立 feed-forward network；参数专用于 FFN 计算中的一个稀疏切片。 |
| Router | “gate” | 一个很小的 linear layer，用来为每个 Token 对每个 expert 打分；执行 top-k selection。 |
| Top-k routing | “每个 Token 有 k 个 active experts” | 每个 Token 的 FFN 计算恰好经过 k 个 experts，并由 gate 加权。 |
| Auxiliary loss | “Load-balance penalty” | 一个额外 Loss term，用来惩罚偏斜的 expert usage。 |
| Auxiliary-loss-free | “DeepSeek-V3 的技巧” | 只在 router 的 selection 上通过 per-expert bias 实现 balance；没有额外 Gradient。 |
| Shared expert | “Always on” | 每个 Token 都会经过的额外 expert；捕获通用知识。 |
| Expert parallelism | “按 expert 分片” | 将不同 experts 分配到不同 GPUs；通过网络 route tokens。 |
| Sparsity | “active params < total params” | 比率 `k × expert_size / (E × expert_size)`；DeepSeek-V3 为 37/671 ≈ 5.5%。 |

## 延伸阅读

- [Shazeer et al. (2017). Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer](https://arxiv.org/abs/1701.06538) مصدر هذه الفكرة
- [Fedus, Zoph, Shazeer (2022). Switch Transformer: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity](https://arxiv.org/abs/2101.03961) التبديل، كلاسيكي موي
- [Jiang et al. (2024). Mixtral of Experts](https://arxiv.org/abs/2401.04088) مخلوط 8 × 7B。
- [DeepSeek-AI (2024). DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437) MLA + مويه بدون خسائر مساعدة + MTP。
- [Wang et al. (2024). Auxiliary-Loss-Free Load Balancing Strategy for Mixture-of-Experts](https://arxiv.org/abs/2408.15664)  基于偏见的平衡论文──
- [Dai et al. (2024). DeepSeekMoE: Towards Ultimate Expert Specialization in Mixture-of-Experts Language Models](https://arxiv.org/abs/2401.06066) 本课路由器 使用的细粒+分享专家分化──
- [Kim et al. (2022). DeepSpeed-MoE: Advancing Mixture-of-Experts Inference and Training](https://arxiv.org/abs/2201.05596) 最早的共享专家论文──
