# التشفير الموضعي  الحاجز الشقري، ROPE، ALiBi

> الانتباه إلى排列不敏感── بدون إشارة موضعية 时, القط جلس على المفتاح و مع القط على المفتاح  سيجري إنتاج نفس المخرج──三种算法修复它

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 03 (Multi-Head Attention)
**Time:** ~45 分钟

## المشكلة

توجه النقطة المنتج على نطاق واسع إلى ترتيب غير حساس`softmax(Q K^T / √d) V`بواسطة شبيهات زوجية 计算得到──打乱 `X`يُزعجُ أيضاً بالطريقة نفسها.

هذا ليس خطأ في نموذج كيس الكلمات ولكن بالنسبة للغة والرمز والصوت والفيديو، وكل شيء من أجل تحمل معنى، هذا أمر مميت

طريقة إصلاح هي بطريقة ما وضع الموقف داخل التوابل.

1. **Absolute sinusoidal**(Vaswani 2017)。将位置的 `sin/cos`لا حاجة إلى تعلم العناصر، ولكن الاستخراج خارج طول التدريب 
2. **RoPE — Rotary Position Embeddings**(Su 2021) ・ حسب الموقف 成 النسبة من زاوية تحويل Q و K المتجهات── مباشرة في منتج نقطة编码 *رهيبة* الموقف──2026 سنة的主流选择──
3. **ALiBi — Attention with Linear Biases**(طباعة 2022): تماما قفز من التوابل؛ وفقا لمسافة عطاء نقاط الاهتمام 加上 لعبة جريمة خطية لكل رأس.

截至 2026 年، تقريبا جميع النماذج المفتوحة الحدود 都 تستخدم RoPE:Llama 2/3/4、Qwen 2/3、Mistral、Mixtral、DeepSeek-V3、Kimi。 عدد قليل من النماذج ذات السياق الطويل استخدام ALiBi أو其现代变体。الامتلاك السينوسيدال 已成为历史方案。

## المفهوم

![Sinusoidal absolute vs RoPE rotations vs ALiBi distance bias](../assets/positional-encoding.svg)

### الحجرة الحجرية المطلقة

预先计算一个形 为 `(max_len, d_model)`المصفوفة الثابتة`PE`:

```
PE[pos, 2i]   = sin(pos / 10000^(2i / d_model))
PE[pos, 2i+1] = cos(pos / 10000^(2i / d_model))
```

ثم في الاهتمام قبل تنفيذ`X' = X + PE[:N]`كل بعد هو سينهوسيد ذات تردد مختلف.`max_len`بعد الفشل: عندما رأى النموذج فقط المواقف 02047 时, لا شيء يخبرها الموقف 2048 会发生什么.

### (ROPE)

旋转 Q 和 K المتجهات ((ليس منشغلات) 。对一对维度 `(2i, 2i+1)`:

```
[q'_2i    ]   [ cos(pos·θ_i)  -sin(pos·θ_i) ] [q_2i   ]
[q'_2i+1  ] = [ sin(pos·θ_i)   cos(pos·θ_i) ] [q_2i+1 ]

θ_i = base^(-2i / d_head),  base = 10000 by default
```

للموقف`pos_k`أساسيات  تطبيق نفس التحول`q'_m · k'_n`سوف تصبح متعلقة فقط`(m - n)`من المفترض أن تكون**attention score 只依赖 relative distance**على الرغم من أن المديرين يستخدمون المواقع المطلقة

扩展 روبي: يمكن أن يتم توطيدها `base`(NTK-وعي、YaRN、LongRoPE) ، حتى يتم استنتاجها إلى سياق أطول في حالة عدم إعادة التدريب.

### (أليبي)

跳过嵌入 技巧──直接给注意分加偏见:

```
attn_score[i, j] = (q_i · k_j) / √d  -  m_h · |i - j|
```

من بينهم`m_h`هو منحدر محدد للرأس`1 / 2^(8·h/H)`■ ■ تُعزز الوهم القريبة؛ • تُعاقب الوهم البعيدة. ■ لا توجد تكاليف التدريب. ■ دراسة تُظهر أن استنتاج الطول أفضل من التدريب السينوسيد، ويتمّ التدريب الأصلي على طول الوهم البعيد.

### 2026 سنة يجب أن تختار ماذا

| Variant | Extrapolation | Training cost | Used by |
|---------|---------------|---------------|---------|
| Absolute sinusoidal | 差 | 免费 | original transformer, early BERT |
| Learned absolute | 无 | 很小 | GPT-2, GPT-3 |
| RoPE | 配合 scaling 时很好 | 免费 | Llama 2/3/4, Qwen 2/3, Mistral, DeepSeek-V3, Kimi |
| RoPE + YaRN | 极佳 | fine-tune stage | Qwen2-1M, Llama 3.1 128K |
| ALiBi | 极佳 | 免费 | BLOOM, MPT, Baichuan |

RoPE 胜出، لأنه يمكن أن يضيف مباشرة الاهتمام و لا تغير الهندسة المعمارية، يمكن أن يكتب الموقف النسبي، و`base`المعلم المضاد لتحسين السياق الطويل


```figure
rope-explorer
```

## بناءها

### الخطوة الأولى: تشفير السينوسويدي

见 `code/main.py` 4 行计算:

```python
def sinusoidal(N, d):
    pe = [[0.0] * d for _ in range(N)]
    for pos in range(N):
        for i in range(d // 2):
            theta = pos / (10000 ** (2 * i / d))
            pe[pos][2 * i]     = math.sin(theta)
            pe[pos][2 * i + 1] = math.cos(theta)
    return pe
```

في الطبقة الأولى من الاهتمام قبل، سوف تضيفها إلى تعريف المصفوفة فوق.

### الخطوة الثانية: 应用于 Q、K's RoPE

روبي 会在 Q 和 K 上原地操作──对对对对对:

```python
def apply_rope(x, pos, base=10000):
    d = len(x)
    out = list(x)
    for i in range(d // 2):
        theta = pos / (base ** (2 * i / d))
        c, s = math.cos(theta), math.sin(theta)
        a, b = x[2 * i], x[2 * i + 1]
        out[2 * i]     = a * c - b * s
        out[2 * i + 1] = a * s + b * c
    return out
```

关键: على الموقف `m`من Q ووضع `n`من K  تطبيق نفس الوظيفة. منتج نقاطها سوف يكون في كل زوج من المواصفات`cos((m-n)·θ_i)`因子──Attention 免费学到相对位置──

### الخطوة الثالثة: تراجع ALiBi 和 التحيز

```python
def alibi_bias(n_heads, seq_len):
    # slope_h = 2 ** (-8 * h / n_heads) for h = 1..n_heads
    slopes = [2 ** (-8 * (h + 1) / n_heads) for h in range(n_heads)]
    bias = []
    for m in slopes:
        row = [[-m * abs(i - j) for j in range(seq_len)] for i in range(seq_len)]
        bias.append(row)
    return bias  # add to attention scores before softmax
```

ستعمل`bias[h]`إضافة إلى الرأس`h``(seq_len, seq_len)`المصفوفة الاهتمام أعلى ثم ثنائي

### الخطوة 4: 验证 خاصية RoPE للبعيد النسبي

选两个 متجهات عشوائية `a, b`أولاً`(pos_a, pos_b)`旋转──再按 `(pos_a + k, pos_b + k)`旋轉── دو نقطة المنتجات 必須在浮点错误内相等── هذا النوع هو كل المعنى من روبي

## استخدمها

بيتورش 2.5+`torch.nn.functional`中提供 RoPE مرافقها── معظم إنتاج كود استخدام `flash_attn`أو`xformers`،روبي سوف تكون في النواة الاهتمام  داخل تطبيقها

```python
from transformers import AutoModel
model = AutoModel.from_pretrained("meta-llama/Llama-3.2-3B")
# model.config.rope_scaling → {"type": "yarn", "factor": 32.0, "original_max_position_embeddings": 8192}
```

**2026 年的 Long-context 技巧：**

- **NTK-aware interpolation。**من 4K  توسيع إلى 16K + 时,将 `base`重新缩放为 `base * (scale_factor)^(d/(d-2))`.
- **YaRN。**أكثر ذكاء من التقاطع، يمكن في السياقات الطويلة بالاحتفاظ الانتروبيا الاهتمام.
- **LongRoPE。**مايكروسوفت 2024 年方法, استخدام البحث التطوري 为每一个维度 选择规模因素──Phi-3-Long 使用它──
- **Position interpolation + fine-tuning。**فقط تحتاج إلى معدل التوسع  تقليل المواقع،并 تحسين 15B رموز

## أرسله

见 `outputs/skill-positional-encoding-picker.md` هذه المهارة ستعمل على إعداد استراتيجية تشفير جديدة، وذلك بناء على طول السياق المستهدف، والحاجات الاستقطابية، وميزانية التدريب.

## التمارين

1. **Easy。**ستعمل`max_len=512, d=128`من السينوسيدال `PE`المصفوفة رسمها لخريطة الحرارة، تأكيدها مع مؤشر الأبعاد، تزداد، الشريطات تغير عرضها.
2. **Medium。**实现 NTK-awareness RoPE scaling──在长度 256 序列 上训练小LM,然后在长度 1024 上分别测试有规模和无规模的情况──测量困难──
3. **Hard。**في نفس الوحدة الاهتمام تنفيذ ALiBi و RoPE. في تسلسل 512 طول.

## الشروط الرئيسية

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Positional encoding | “告诉 attention 顺序” | 添加到 embeddings 或 attention 中、用于编码 position 的任意 signal。 |
| Sinusoidal | “最初那个” | 以 geometric frequencies 加到 embeddings 上的 `sin/cos`；不能 extrapolate。 |
| RoPE | “Rotary embeddings” | 按 position-dependent angle 旋转 Q、K；dot product 编码 relative distance。 |
| ALiBi | “Linear bias trick” | 将 `-m·\|i-j\|` 加到 attention scores；不需要 embedding，extrapolation 很强。 |
| base | “RoPE 的旋钮” | RoPE 中的 frequency scaler；增大它可在 inference 时扩展 context。 |
| NTK-aware | “一种 RoPE scaling trick” | 重新缩放 `base`，让 context 扩展时 high-frequency dims 不会被挤压。 |
| YaRN | “高级那个” | 保留 attention entropy 的 per-dimension interpolation+extrapolation。 |
| Extrapolation | “能在训练长度之外工作” | position scheme 能否在训练时见过的 `max_len` 之外给出正确输出？ |

## المزيد من القراءة

- [Vaswani et al. (2017). Attention Is All You Need §3.5](https://arxiv.org/abs/1706.03762) أصليّة الحاجز الحمينيّة
- [Su et al. (2021). RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864)ورق روبي
- [Press, Smith, Lewis (2021). Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation](https://arxiv.org/abs/2108.12409) ALiBi。
- [Peng et al. (2023). YaRN: Efficient Context Window Extension of Large Language Models](https://arxiv.org/abs/2309.00071) حالة الفن RoPE مقياسها
- [Chen et al. (2023). Extending Context Window of Large Language Models via Positional Interpolation](https://arxiv.org/abs/2306.15595) ورقة "إلاما 2" المترتبة على السياق الطويل
- [Ding et al. (2024). LongRoPE: Extending LLM Context Window Beyond 2 Million Tokens](https://arxiv.org/abs/2402.13753) مايكروسوفت 方法,被 Phi-3-Long 使用,并在使用它 部分引用──
- [HuggingFace Transformers — `modeling_rope_utils.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/modeling_rope_utils.py) تنفيذات مختلفة من خطط قياس روبي (التي يتم تحديدها بشكل افتراضي 、خطوي 、ديناميكي 、YaRN、LongRoPE、Llama-3)
