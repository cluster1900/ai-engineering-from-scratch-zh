# برت  نموذج لغة مخفية

> GPT 预测下一个词――BERT 预测缺失的词――只差一句话,却带来了半十年的各种嵌入式形态――

**类型:**الإنشاء
**语言:**بايثون
**先修:**المرحلة 7 · 05 (المحول الكامل) ، المرحلة 5 · 02 (文本表示)
**时间:**45 دقيقة

## 问题

في عام 2018، كل مهمة من مهمات النمط النووي  تحليل العاطفة  NER、QA、entailment都将在自己的标记数据上从头训练自己的模型──当时还没有可以细调的预训练 理解英语检查点──ELMo (2018) 证明可以使用双向LSTM预训文本文本嵌入;它有帮助,但泛化能力不够──

برت (ديفلين وزملاء 2018) طرحوا مشكلة: إذا حصلنا على مُرمّع ترنسفورمير، قمنا بتدريبها على كل جملة على الإنترنت، و قمنا بتجبرها على أن تستند إلى الكلمات المفقودة على الجانبين، ماذا سيحدث؟ ثم تحتاج فقط إلى ضبط رأس واحد على المهمة التالية.

النتيجة هي: خلال 18 个月, بيرت 及其变体 (روبرت, ألبرت, إلكترا) 统治ت في ذلك الوقت جميع قائمة النفط النووية.

بحلول عام 2026، ما يزال النموذج المُصنف فقط هو تصنيف، والتحقيق وتركيب استخراج الأدوات الصحيحة تسرعية تشغيل كل رمز من المُصف 快 510×، بينما تُشكل إدراجاتها هي بنية كل كومة استرداد حديثة‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

## مفهوم الأساسي

![Masked language modeling: pick tokens, mask them, predict originals](../assets/bert-mlm.svg)

### 訓練信号

خذ جملة:`the quick brown fox jumps over the lazy dog`.

随机面具 15% 的 رموز:

```
input:  the [MASK] brown fox jumps [MASK] the lazy dog
target: the  quick brown fox jumps  over  the lazy dog
```

訓練模型在被面具的位置预测原始 Token──因为 رمز التشفير هو دوي الاتجاه,所以在位置 1 预测 `[MASK]`时, يمكن استخدام موقع 2+ `brown fox jumps`هذا هو الشيء الذي لم ينجح به (جبت)

### قواعد قناع BERT

في 15% من الـ "أعلامات الـ" التي يتم اختيارهم

- 80% تم استبدالها`[MASK]`.
- 10% تم استبدالها بـ "أزواج"
- 10% 保持不变──

لماذا لا تستخدم دائما`[MASK]`لأن`[MASK]`في التفكير لن يظهر أبداً... إذا كان نموذج التدريب في موقع مخفي 100%`[MASK]`، ففي الوقت الذي يتواجد فيه التدريبات المسبقة والتحسينات النظيفة، يحدث تغير في التوزيع.

### التنبؤ بالجملة التالية و لماذا تم إزالتها

تم تدريب برت أيضاً على النظام النووي: أعطيت جملتين A و B، التنبؤ B هو إما إذا كان يتبع في A  后面── روبرتا (2019) أجرى تجربة استنزاف للتمويل عليه، يثبت أن النظام النووي له ضرر لا فائدة── الرموز الحديث سوف يقفز فوقه──

### 2026 سنة تغير:ModernBERT

تم إعادة بناء الكتلة باستخدام المكونات الأساسية لعام 2026:

| Component | Original BERT (2018) | ModernBERT (2024) |
|-----------|----------------------|-------------------|
| Positional | Learned absolute | RoPE |
| Activation | GELU | GeGLU |
| Normalization | LayerNorm | Pre-norm RMSNorm |
| Attention | Full dense | Alternating local (128) + global |
| Context length | 512 | 8192 |
| Tokenizer | WordPiece | BPE |

وبالعكس من كومة 2018، فإنه يدعم فلاش-تأمل في الأصل. في طول التسلسل 8K، وتحديد السرعة من DeBERTa-v3 快 23×، في الوقت نفسه GLUE أفضل.

### 2026 سنة لا تزال تختار مرموزات

| Task | 为什么 encoder 胜过 decoder |
|------|------------------------------|
| Retrieval / semantic search embeddings | Bidirectional context = 每个 Token 更好的 Embedding 质量 |
| Classification (sentiment, intent, toxicity) | 一次 forward pass；没有生成开销 |
| NER / token labeling | 逐位置输出，天然 bidirectional |
| Zero-shot entailment (NLI) | encoder 顶部的 classifier head |
| Reranker for RAG | Cross-encoder scoring，比 LLM rerankers 快 10x |


```figure
transformer-residual
```

## بناءها

### الخطوة 1: منطق التخفيض

见 `code/main.py`◊ 函数`create_mlm_batch`接收一个代币 ID 列表、大小语音 和面具概率──返回输入 IDs(已应用面具) 和标签(只在面具位置有值,其他位置为 -100这是PyTorch's ignore index 约定) 

```python
def create_mlm_batch(tokens, vocab_size, mask_prob=0.15, rng=None):
    input_ids = list(tokens)
    labels = [-100] * len(tokens)
    for i, t in enumerate(tokens):
        if rng.random() < mask_prob:
            labels[i] = t
            r = rng.random()
            if r < 0.8:
                input_ids[i] = MASK_ID
            elif r < 0.9:
                input_ids[i] = rng.randrange(vocab_size)
            # else: keep original
    return input_ids, labels
```

### الخطوة 2: في مجموعة صغيرة من النوعين

في يحتوي على 20 كلمة من المفردات ∙ 200 جملة على تدريب رمز 2 طبقات + رأس MLM ∙ بدون درجة  نحن فقط نفعل التحقق من الصواب المسبق ∙

### الخطوة الثالثة: مقارنة قناع

展示三路规则 كيف جعل النموذج في غياب `[MASK]`في حالة لا تزال قابلة للتطبيق. في جملة غير مقبوضة وعبارات مقبوضة على حدة التنبؤ. يجب أن يكون هناك توكين مناسب لتوزيعها، لأن النموذج قد شهد في التدريب أنماطاً اثنتين.

### 步骤 4: رأس التنسيق

في مجموعة بيانات عاطفة اللعبة، باستخدام رأس التصنيف بدل رأس التنمية التجارية ‬ فقط رأس التدريب ‬

## استخدمها

```python
from transformers import AutoModel, AutoTokenizer

tok = AutoTokenizer.from_pretrained("answerdotai/ModernBERT-base")
model = AutoModel.from_pretrained("answerdotai/ModernBERT-base")

text = "Attention is all you need."
inputs = tok(text, return_tensors="pt")
out = model(**inputs).last_hidden_state   # (1, N, 768)
```

**Embedding models 是 fine-tuned BERT。** `sentence-transformers`في الصورة`all-MiniLM-L6-v2`مثل هذا النموذج، هو مع الخسارة المقابلة ‬التدريب BERT‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

**Cross-encoder rerankers 也是 fine-tuned BERT。**في`[CLS] query [SEP] doc [SEP]`上做 زوج تصنيفها──البحث 和 الاهتمام المزدوج بين الوثائق،正是 الترميز المتقاطع بالمقارنة مع الترميز المزدوج 具有质量优势的原因──

**2026 年什么时候不该选 BERT。**任何生成式任务──编码器 没有合理方式 autoregressively 生成 Token──另外: أي 1B المعلمات 以下、其中小型 decoder 能以更高灵活性达到相同质量的任务 (Phi-3-Mini, Qwen2-1.5B)──

## 交付 it

见 `outputs/skill-bert-finetuner.md`◊ هذه المهارة سوف تكون من أجل تصنيف جديد أو استخراج  تحديد المهام BERT حدة التنسيق

## التدريب

1. **Easy.**运行 `code/main.py`, وطبعت 10 آلاف رمز على قناع تمت توزيعها . تأكيد حوالي 15٪ تم اختيارهم , ومن بينهم حوالي 80٪ أصبحوا`[MASK]`.
2. **Medium.**实现全词掩饰: إذا تم قطع كلمة واحدة من Tokenizer 切成 فرعية الكلمات، فإنما مع ذلك نقش جميع الفقرات، أو全部不掩饰──衡量这是否能在500 جملة corpus 上提升MLM دقة──
3. **Hard.**في مجموعة بيانات عامة من 10,000 个句子 على تدريب صغير (2-طبقة، d=64) BERT──`[CLS]`الـ "Token" ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| MLM | "Masked language modeling" | 训练信号：随机将 15% 的 Token 替换为 `[MASK]`，预测原始 Token。 |
| Bidirectional | "双向看" | Encoder Attention 没有 causal mask——每个位置都能看到其他所有位置。 |
| `[CLS]` | "The pooler token" | 一个添加到每个 sequence 开头的特殊 Token；它的最终 Embedding 用作句子级表示。 |
| `[SEP]` | "Segment separator" | 分隔成对的 sequence（例如 query/doc、sentence A/B）。 |
| NSP | "Next sentence prediction" | BERT 的第二个 pretraining 任务；在 RoBERTa 中被证明无用，2019 年后被移除。 |
| Fine-tuning | "适配一个任务" | 基本保持 encoder 冻结；在其上训练一个小 head 来完成下游任务。 |
| Cross-encoder | "一个 reranker" | 一个同时接收 query 和 doc 作为输入，并输出相关性分数的 BERT。 |
| ModernBERT | "2024 refresh" | 用 RoPE、RMSNorm、GeGLU、交替 local/global attention、8K context 重建的 encoder。 |

## 延伸阅读

- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805) 原始论文──
- [Liu et al. (2019). RoBERTa: A Robustly Optimized BERT Pretraining Approach](https://arxiv.org/abs/1907.11692) 如何正确训练 BERT;移除NSP──
- [Clark et al. (2020). ELECTRA: Pre-training Text Encoders as Discriminators Rather Than Generators](https://arxiv.org/abs/2003.10555)في نفس الحساب أسفل، استبدال الاكتشاف الوهمية
- [Warner et al. (2024). Smarter, Better, Faster, Longer: A Modern Bidirectional Encoder](https://arxiv.org/abs/2412.13663) ModernBERT 论文。
- [HuggingFace `modeling_bert.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/bert/modeling_bert.py) 标准 encoder 参考。
