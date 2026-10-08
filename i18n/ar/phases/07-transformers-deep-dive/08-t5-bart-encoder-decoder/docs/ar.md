# T5، BART  نماذج تشفير-تشفير

> رمز التشفير  مسؤول عن فهمها. رمز التشفير  مسؤول عن توليدها. إعادة تجميعها معاً، نحصل على نموذج خاص للمدخول → الخروج.

**Type:** Learn
**Languages:** Python
**先修要求:**المرحلة 7 · 05 (المحول الكامل) ، المرحلة 7 · 06 (BERT) ، المرحلة 7 · 07 (GPT)
**Time:** ~45 minutes

## 问题

تم تصفيف GPT وحدها وBERT وحدها وذلك بغرض تحقيق أهداف مختلفة في بناء عام 2017، ولكن العديد من المهام هي الإدخال والخروج الطبيعي:

- ترجمة: الإنجليزية → الفرنسية.
- التلخص: 5000-توكن 文章 → 200-توكن 摘要。
- التعرف على الكلام: 音频 Token → 文本 Token。
- 结构化抽取: 散文 → JSON。

对于这些任务,encoder-decoder是最贴合的形式──encoder 生成源内容的密集表示──decoder 生成输出,并对该表示执行交叉注意──训练是在输出侧进行转换一对一──Loss 与GPT相似,只是以编码 输出为条件──

两篇论文定义了现代做法:

1. **T5**(رافل وزملاء 2019). "تحول النص إلى النص". سوف تعيد تعبير كل مهمة من المهام النسائية النسائية على النص، والنص إلى الخارج.
2. **BART**(لويس وزملاء 2019). "متحول ثنائي الاتجاه والتحويل السريع. " 去噪音 autoencoder:以多种方式破坏输入(shuffle、mask、delete、rotate),让 decoder 重建原始内容──

بحلول عام 2026، لا يزال نمط إعادة التشفير والتشفير موجوداً في البنية المضافة حيث هو مهم جداً:

- * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
- ترجمة جوجل
- بعضها لديه سياق واضح وتحرير 结构的代码-Completetion / repair 模型──
- يستخدم التفكير المهيكلي  مهمة Flan-T5   وتغيراتها

المُعَمّلُ للكشف فقط فاز بضوءٍ ضوئيّ، لكن المُعَمّلُ للكشف لم يُزولُ أبداً

## 概念

![Encoder-decoder with cross-attention](../assets/encoder-decoder.svg)

### التأرجح

```
source tokens ─▶ encoder ─▶ (N_src, d_model)  ──┐
                                                 │
target tokens ─▶ decoder block                   │
                 ├─▶ masked self-attention       │
                 ├─▶ cross-attention ◀───────────┘
                 └─▶ FFN
                ↓
              next-token logits
```

关键在于, 编码器对每输入只运行一次. 编码器以自动降低方式运行,但每一步都交叉到同一编码器 输出. 缓存编码器 输出,对长输入来说是免费的加速.

### T5 预训练  فترة الفساد

随机选择输入中的跨度(平均长度 3 个 Token,总计 15%) ―― باستخدام الحارس الوحيد 替换每个跨度:`<extra_id_0>`.`<extra_id_1>`...الجهاز المُفصّل فقط يخرج من فترة التدمير، و يُضيف على المراقب

```
source: The quick <extra_id_0> fox jumps <extra_id_1> dog
target: <extra_id_0> brown <extra_id_1> over the lazy
```

مقارنة مع التنبؤ على المجموعة بأكملها، فهذا هو إشارة أكثر تكلفة. في إزالة مقال T5 ، فإنه يتنافس مع MLM (BERT) و prefix-LM (UniLM).

### BART 预训练  التخفيض المتعدد الضوضاء

BART 尝试了五种噪音功能:

1. -تخفيض الوسائل
2. إزالة الرمز
3. إضافة النص ((قناع، فترة، المعدل المعدل
4. تحويل الجملة
5. -دورة الوثائق

أحدث مجموعة من إضافة النص + تحويل الجملة أفضل نتائج.

### 推理

مع GPT مشابهة للجيل السريعة. العينة الحمقاء / الشعاع / أعلى الصفحة تم استخدامها. البحث الشعاعي ((الرياضة 45) هو الممارسة القياسية لترجمة ومصطلحات، لأن الإنتاج من التوزيع على المحادثة هو أصغر.

### 2026 سنة何時 اختيار كل التغيرات

| Task | Encoder-decoder? | Why |
|------|------------------|-----|
| Translation | 是，通常如此 | 明确的源序列；固定的输出分布；beam search 有效 |
| Speech-to-text | 是 (Whisper) | 输入 modality 与输出不同；encoder 塑造音频特征 |
| Chat / reasoning | 否，decoder-only | 没有持久的“input”——对话本身就是序列 |
| Code completion | 通常否 | decoder-only 搭配长上下文更强；像 Qwen 2.5 Coder 这样的代码模型是 decoder-only |
| Summarization | 两者皆可 | BART、PEGASUS 超过了早期 decoder-only baseline；现代 decoder-only LLMs 已经能与它们匹配 |
| Structured extraction | 两者皆可 | T5 很干净，因为“text → text”可以吸收任何输出格式 |

منذ عام 2022 ، كان الاتجاه: المُصطلحات المُصطلحة فقط تمت إدارةها من قبل المُصطلحات المُصطلحة فقط ، لأن (أ) المُصطلحات المُصطلحة فقط للكشف يمكن أن تُحسَن من خلال التأثير على أي مهمة ، (ب) التركيب الواحد أكثر سهولة من اثنين من المُصطلحات ، (ج) التركيب المُصطلح للاستخدام المُصطلحات المُصطلحة.


```figure
encoder-decoder
```

## بناءها

见 `code/main.py`نحن نستخدمها في جسم اللعب لتحقيق الفساد في فترة التدريب. هذا هو الجزء الوحيد الأكثر فائدة من هذا الدراسة، لأنه ظهر بعد ذلك في كل جهاز تشفير و تشفير.

### الخطوة 1: الفساد في المدى

```python
def corrupt_spans(tokens, mask_rate=0.15, mean_span=3.0, rng=None):
    """Pick spans summing to ~mask_rate of tokens. Return (corrupted_input, target)."""
    n = len(tokens)
    n_mask = max(1, int(n * mask_rate))
    n_spans = max(1, int(round(n_mask / mean_span)))
    ...
```

الهدف 格式遵循 T5 约定:`<sent0> span0 <sent1> span1 ...` المدخل الفاسد 会把未改变的令牌与跨度位置上的哨兵令牌 交错排列──

### الخطوة 2: التحقق من رحلة ذهاب وإياب

给定腐败输入 和目标,重建原始句子──如果你的腐败是可逆的,那么前进通过就是良定义的──这是一个理智检查真实训练从不这样做,但这个测试成本很低,并且能够捕捉到跨度账本中的偏差.

### 步骤 3: ضجيج BART

五个函数:`token_mask`.`token_delete`.`text_infill`.`sentence_permute`.`document_rotate`◊组合其中两个并展示结果──

## استخدمها

"تقبيل" 参考:

```python
from transformers import T5ForConditionalGeneration, T5Tokenizer
tok = T5Tokenizer.from_pretrained("google/flan-t5-base")
model = T5ForConditionalGeneration.from_pretrained("google/flan-t5-base")

inputs = tok("translate English to French: Attention is all you need.", return_tensors="pt")
out = model.generate(**inputs, max_new_tokens=32)
print(tok.decode(out[0], skip_special_tokens=True))
```

تيكنس T5: اسم المهمة يدخل إلى النص المنزلي. يمكن أن يقوم نفس النموذج بمعالجة عشرات المهام، لأن كل مهمة هي نصية وإخراج نصية. حتى عام 2026، تم تعزيز هذا النموذج بشكل عام على النموذج المعدل بإرشادات المعدل فقط، ولكن T5 سوف يحدد أولها.

## 交付 it

见 `outputs/skill-seq2seq-picker.md` هذه المهارة سوف تقوم بناء على المدخل والمخرج 结构、延迟和质量目标، لقيام باختيار بين مهمة جديدة في مرموزة مرموزة و مرموزة مرموزة فقط

## التدريب

1. **Easy.**运行 `code/main.py`، على 30 رمزية 句子应用跨度فساد،验证将非哨源代币与解码目标跨度 拼接后可以复现原始句子──
2. **Medium.**实现 BART `text_infill`الضجيج:`<mask>`الـ "توكين" يغير على أساس المدة، يجب على المُعَدِّد أن يحدد المدة الصحيحة 长度和内容── يظهر مثالا ً
3. **Hard.**في إنجليزية صغيرة جداً في اللاتينية الخنزرية`flan-t5-small` في مجموعة 50 زوجة تمت إحتفاظها `Llama-3.2-1B`نتائج مقارنة:

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Encoder-decoder | “Seq2seq transformer” | 两个 stack：用于输入的 bidirectional encoder，以及带 cross-attention、用于输出的 causal decoder。 |
| Cross-attention | “源内容与目标内容对话的地方” | decoder 的 Q × encoder 的 K/V。这是 encoder 信息进入 decoder 的唯一位置。 |
| Span corruption | “T5 的预训练技巧” | 用 sentinel Token 替换随机 span；decoder 输出这些 span。 |
| Denoising objective | “BART 的游戏” | 对输入应用 noise function，训练 decoder 重建 clean sequence。 |
| Sentinel token | “`<extra_id_N>` 占位符” | 特殊 Token，用于在 source 中标记被破坏的 span，并在 target 中重新标记它们。 |
| Flan | “Instruction-tuned T5” | 在超过 1,800 个任务上 fine-tuned 的 T5；让 encoder-decoder 在 instruction-following 上具备竞争力。 |
| Beam search | “Decoding strategy” | 在每一步保留 top-k 个 partial sequence；是翻译/摘要的标准做法。 |
| Teacher forcing | “Training-time input” | 训练期间，把真实的前一个输出 Token 喂给 decoder，而不是采样出来的 Token。 |

## 延伸阅读

- [Raffel et al. (2019). Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer](https://arxiv.org/abs/1910.10683) T5。
- [Lewis et al. (2019). BART: Denoising Sequence-to-Sequence Pre-training for Natural Language Generation, Translation, and Comprehension](https://arxiv.org/abs/1910.13461)بارت
- [Chung et al. (2022). Scaling Instruction-Finetuned Language Models](https://arxiv.org/abs/2210.11416) طائرة T5。
- [Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) فيسبر,2026 سنة الكانونيكي رمزية-مصطلحات تعريفية
- [HuggingFace `modeling_t5.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/t5/modeling_t5.py) 参考实现。
