# المحول الكامل  مرموز + مرموز

> الاهتمام هو المخرج الرئيسي. كل شيء آخر. البقايا التطبيعية. التغذية إلى الأمام. الاهتمام المتقاطع.

**Type:** Build
**Languages:** Python
**先修要求:**المرحلة 7 · 02 (تأثير الذات) ، المرحلة 7 · 03 (تأثير الرأس المتعدد) ، المرحلة 7 · 04 (تشفير الموقف)
**Time:** ~75 minutes

## 问题
طبقة الانتباه الوحيدة هي جهاز التقطير، وليس نموذج. كل طبقة واحدة من المواد لا تكفي القدرة على اللغة. تحتاج إلى عمق، وإذا لم تكن هناك خط أنابيب صحيح، فإن العمق سوف يفشل.

في عام 2017 قام مقال Vaswani بفتح ست قرارات تصميم ، لتحول طبقة من الاهتمام إلى كتلة قابلة للتراكم. بعد ذلك ، كل محول معدل فقط (BERT) معدل فقط (GPT) معدل-معدل فقط (T5) متورث في نفس البنية. حتى عام 2026 ، تم تحسين هذه الكتل. معدل RMSNorm SwiGLU مقبل القاعدة ‬RoPE ، ولكن البنية هي نفسها تماما.

هذا الدرس يتحدث عن هذا الهيكل.

## 概念
![Encoder and decoder block internals, wired](../assets/full-transformer.svg)

### 六个组成部分

1. **Embedding + positional signal.**الوهم → المتجهات.
2. **Self-attention.**كل موقف يشارك في كل موقف آخر في المقاطع المختلفة
3. **Feed-forward network (FFN).**按位置 作用的两层 MLP:`W_2 · activation(W_1 · x)`نسبة التوسع المتبقي هي 4 ×
4. **Residual connection.** `x + sublayer(x)`بدونها، ستختفي الدرجات بعد ستة طبقات
5. **Layer normalization.** `LayerNorm`أو`RMSNorm`(现代) ―― استقرار التيار المتبقية
6. **Cross-attention (decoder only).**استفسارات من المفكّر، المفاتيح والقيم من خروج المفكّر

### كودر بلاك ((BERT、T5 كودر استخدام)

```
x → LN → MHA(self) → + → LN → FFN → + → out
                     ^              ^
                     |              |
                     └── residual ──┘
```

الرموز هي ذات اتجاهين. لا يوجد تغطية.

### كتل تشخيصات ((GPT、T5 تشخيصات استخدام)

```
x → LN → MHA(masked self) → + → LN → MHA(cross to encoder) → + → LN → FFN → + → out
```

المفكّر كلّ بلوك لديه ثلاث طبقات فرعية. في الوسط من ذلك.

### قبل القاعدة مقابل بعد القاعدة

المقالة:`x + sublayer(LN(x))`و`LN(x + sublayer(x))` بعد القاعدة في عام 2019 أو نحو ذلك فقدت  إذا لم يكن هناك تدفئة دقيقة، فإنه من الصعب تدريبها بعمق  قبل القاعدة  في الطبقة الفرعية * قبل * استخدام `LN`) هو 2026 سنة من الاختيار المُ默认:Llama、Qwen、GPT-3+、Mistral 都使用它──

### 2026 سنة بلوك التحديث

Vaswani 2017 استخدامها هي LayerNorm + ReLU。现代 كومة بدل اثنين。

| Component | 2017 | 2026 |
|-----------|------|------|
| Normalization | LayerNorm | RMSNorm |
| FFN activation | ReLU | SwiGLU |
| FFN expansion | 4× | 2.6×（SwiGLU 使用三个 matrices，总参数量匹配） |
| Position | Sinusoidal absolute | RoPE |
| Attention | Full MHA | GQA（或 MLA） |
| Bias terms | Yes | No |

RMSNorm يذهب بعيدا عن متوسط مركزية LayerNorm ((قل مرة واحدة من الخفض) ، وفر الحساب، و من تجربة على نظرة على الأقل نفس الاستقرار.`Swish(W1 x) ⊙ W3 x`) في مقال Llama、PaLM 和 Qwen 论文 中稳定优优于 ReLU/GELU FFN,ppl 约提升 0.5 个点──

### عدد المعايير

لـ واحد`d_model = d`و التوسع في نسبة FFN`r`من الحدود:

- (م.ه.إم):`4 · d²`(مقاطع Q، K، V، O)
- FFN (SwiGLU): `3 · d · (r · d)`- -`3rd²`
- القواعد: 可忽略

عندما`d = 4096, r = 2.6, layers = 32`(大致对应 لاما 3 8B)`32 · (4·4096² + 3·2.6·4096²) ≈ 32 · (16 + 32) M = ~1.5B parameters per layer × 32 ≈ 7B`(إضافة إضافية إلى إضافة الرأس)


观察 a vector 如何流过单个块: الاهتمام فى الموقع مختلط المعلومات، البقايا وضع الإشارة على المضي قدما، FFN القيام بتغيير، بينما القاعدة 让剩余流 保持稳定。

```figure
transformer-block
```

## بناءها
### الخطوة الأولى: قطع البناء

استخدام الدروس 03 中的小型 `Matrix`طبقة ((من أجل الاستقلال قد نسخ إلى هذا الملف):

- `layer_norm(x, eps=1e-5)` 减去 mean,除以 std。
- `rms_norm(x, eps=1e-6)` إضافة إلى RMS──不减去 mean──
- `gelu(x)`和 `silu(x) * W3 x`(سويجلي)
- `ffn_swiglu(x, W1, W2, W3)`.
- `encoder_block(x, params)`和 `decoder_block(x, enc_out, params)`.

التسلك الكامل`code/main.py`.

### الخطوة 2: الأسلاك إيكودر 2 طبقة و إيكودر 2 طبقة

وضعها على كومبيل فوق. سوف إصدار المُشفّر 传入 كلّ مُشفّر انتباه متقاطع.

```python
def encode(tokens, params):
    x = embed(tokens, params.emb) + sinusoidal(len(tokens), params.d)
    for block in params.encoder_blocks:
        x = encoder_block(x, block)
    return x

def decode(target_tokens, encoder_out, params):
    x = embed(target_tokens, params.emb) + sinusoidal(len(target_tokens), params.d)
    for block in params.decoder_blocks:
        x = decoder_block(x, encoder_out, block)
    return x
```

### الخطوة الثالثة: في مثال لعبة 上运行 前进

输入一个6 رموز مصدر 和一个5 رموز هدف──验证输出形 是 `(5, vocab)` عدم التدريب  تركز على الهندسة المعمارية، وليس الخسارة‬

### 步骤 4: 换成 RMSNorm + SwiGLU

استخدام RMSNorm 和 SwiGLU بدل الطبقةNorm 和 ReLU-FFN。 تأكيد الأشكال 仍然匹配── هذا هو تحديث 2026 سنة، تحتاج فقط مرة واحدة وظيفة بدل──

## استخدمها
تنفيذات مرجعية PyTorch/TF:`nn.TransformerEncoderLayer`.`nn.TransformerDecoderLayer`ولكن معظم كود الإنتاج في عام 2026 سوف يتحقق نفسه، لأن:

- الانتباه الفلاش هو في الانتباه الداخلي المستخدم ، وليس من خلال`nn.MultiheadAttention`.
- GQA / MLA 不在 stdlib الإشارة 中──
- روبي رمس نورم سويغلو ليس طابق أساسي بيتورش

HF `transformers`هناك كتلة مرجعية واضحة، تستحق القراءة:`modeling_llama.py`هو 2026 سنة كانونيكال ديكودر فقط كتلة.

**Encoder vs decoder vs encoder-decoder — 什么时候选择：**

| Need | Pick | Example |
|------|------|---------|
| Classification、embeddings、基于文本的 QA | Encoder-only | BERT, DeBERTa, ModernBERT |
| Text generation、chat、code、reasoning | Decoder-only | GPT, Llama, Claude, Qwen |
| Structured input → structured output（translation、summarization） | Encoder-decoder | T5, BART, Whisper |

إنّ المُفصل فقط في مهام اللغة يفوز، لأنه يسهل القيام بذلك على نطاقٍ واضح، ويعمل على نفس الوقت على فهم وتوليدها.

## 交付 it
见 `outputs/skill-transformer-block-reviewer.md` هذه المهارة سوف تتخذ على أساس مراجعة التكوين المتبكر لعام 2026 تنفيذ كتلة محول جديدة،并标记缺失部分 ((مسبق القاعدة、روبي、رمصنرم、جكا٬فن نسبة التوسع)

## التدريب
1. **Easy.**统计你的 encoder_block 在 `d_model=512, n_heads=8, ffn_expansion=4, swiglu=True`时的参数──通过实现该块并使用 `sum(p.numel() for p in block.parameters())`验证‬
2. **Medium.**من بعد المعيار 切换到前 المعيار 初始化两者,并在随机输入 上测量堆叠 12层后的激活规范 应会爆炸;预规活动 应保持有界――
3. **Hard.**في مهمة نسخة اللعبة`x`) على تحقيق مُشفّر-مُشفّر 4 طبقات. تدريب 100 خطوة. تقرير الخسارة.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Block | “一个 transformer layer” | norm + attention + norm + FFN 的 stack，并包在 residual connections 中。 |
| Residual | “Skip connection” | `x + f(x)` output；让 gradients 能够流过 deep stacks。 |
| Pre-norm | “先 normalize，不是之后” | 现代形式：`x + sublayer(LN(x))`。无需 warmup 技巧也能训练得更深。 |
| RMSNorm | “没有 mean 的 LayerNorm” | 除以 RMS；少一个 op，经验稳定性相同。 |
| SwiGLU | “大家都切换过去的 FFN” | `Swish(W1 x) ⊙ W3 x → W2`。在 LM ppl 上优于 ReLU/GELU。 |
| Cross-attention | “decoder 如何看到 encoder” | Q 来自 decoder、K/V 来自 encoder outputs 的 MHA。 |
| FFN expansion | “中间 MLP 有多宽” | hidden-size 与 d_model 的比率，通常为 4（LayerNorm）或 2.6（SwiGLU）。 |
| Bias-free | “去掉 +b 项” | 现代 stacks 在线性层中省略 biases；ppl 略有提升，model 更小。 |

## 延伸阅读
- [Vaswani et al. (2017). Attention Is All You Need](https://arxiv.org/abs/1706.03762) المحدد الأول للجكل
- [Xiong et al. (2020). On Layer Normalization in the Transformer Architecture](https://arxiv.org/abs/2002.04745)لماذا قبل القاعدة في المستوى العميق أفضل من بعد القاعدة
- [Zhang, Sennrich (2019). Root Mean Square Layer Normalization](https://arxiv.org/abs/1910.07467) RMSNorm
- [Shazeer (2020). GLU Variants Improve Transformer](https://arxiv.org/abs/2002.05202) SwiGLU 论文。
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py) قوانين 2026 كتل فقط
