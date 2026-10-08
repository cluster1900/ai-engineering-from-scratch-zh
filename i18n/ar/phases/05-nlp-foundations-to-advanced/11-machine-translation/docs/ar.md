# ترجمة الآلة

> الترجمة هي مهمة لدراسة النفط النووي التي تمت على مدى ثلاثين عاماً، وما زالت مستمرة في المتابعة.

**Type:** Build
**Languages:** Python
**先修要求：**المرحلة 5 · 10 (التأمل) ، المرحلة 5 · 04 (الغلاف، النص السريع، الكلمة الفرعية)
**Time:** ~75 minutes

## 问题
نموذج 读取一种语言的句子,并生成另一种语言的句子──长度会变化──词序会变化──有些源语言词会映射到多个目标语言词,反之亦然──习语拒绝对一映射──英语里"أنا افتقدك" 在法语里是"أنت تفتقر إلي"  字面意思是"أنت تفتقر إلي"──没有任何词级排列 能在这种情况下保留下来──

ترجمة الآلة هي التي أجبرت النموذج النفسي على ابتكار مُرمزات المُرمزات والمعطيات والاهتمام والتحولات، وأدت في النهاية إلى تطوير المهام التي شكلتها نموذج الـ LLM بأكمله.

دراسة قصيرة عن التاريخ دراسة قصيرة عن خط الأنابيب المتاحة لعام 2026:مُتدربة على تشفيرات وموظفات متعددة اللغات (NLLB-200 أو mBART) ، وتكنولوجيا الكلمات الفرعية، بحث الأشعة، تقييم BLEU و chrF، وكذلك أساليب الفشل القليلة التي لا تزال لا تزال لا يُكتشفها على وشك الدخول إلى الإنتاج.

## 概念
![MT pipeline: tokenize → encode → decode with attention → detokenize](../assets/mt-pipeline.svg)

现代 MT 是在平行文本上训练的变化码器-decoder──encoder 读取按其语言代码化 处理后的源──decoder 通过跨重视(درس 10) استخدام خروجيات المُرمّد، مرة واحدة إنتاج كلمة فرعية──decoding استخدام البحث عن شعاع لتجنب حيل التشخيص البشعري──output 会被 detokenized、detrucased,并与参考 评分对比──

ثلاثة خيارات تشغيلية تحدد جودة MT في العالم الحقيقي

- **Tokenizer.**جملةBPE في مجموعة لغات مختلطة 上 тренинг。 عبر لغات المشتركة المفردات 正是NLLB 能实现零shot language pairs 的原因──
- **Model size.**NLLB-200 مستقطب 600M يمكن أن يكون على الكمبيوتر المحمول 上运行。NLLB-200 3.3B هي الإصدار المتباعد الإنتاج。54.5B هو السقف البحث。
- **Decoding.**通用内容使用梁宽 4-5──使用长度罚 避免输出 过短──在需要术语一致性 时使用限制解码──


```figure
seq2seq-alignment
```

## بناءها
### الخطوة 1: مكالمة MT متدربة

```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

model_id = "facebook/nllb-200-distilled-600M"
tok = AutoTokenizer.from_pretrained(model_id, src_lang="eng_Latn")
model = AutoModelForSeq2SeqLM.from_pretrained(model_id)

src = "The cats are running."
inputs = tok(src, return_tensors="pt")

out = model.generate(
    **inputs,
    forced_bos_token_id=tok.convert_tokens_to_ids("fra_Latn"),
    num_beams=5,
    length_penalty=1.0,
    max_new_tokens=64,
)
print(tok.batch_decode(out, skip_special_tokens=True)[0])
```

```text
Les chats courent.
```

هناك ثلاثة أشياء مهمة`src_lang`أخبر الـ Tokenizer تطبيق أي نوع من النصوص والشرائح`forced_bos_token_id`أخبر المُعَرِّف يجب أن يُنتج أيّة لغات؟

### الخطوة 2: BLEU و chrF

BLEU قياس الناتج بين n-غرام والتداخل بين الإشارة ‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

chrF قياس مستوى الشخصيات F-معدل.  بالنسبة إلى أشكال لغة غنية أكثر حساسية، لأن BLEU سوف تقلل تقديرات مطابقة.

```python
import sacrebleu

hypotheses = ["Les chats courent."]
references = [["Les chats courent."]]

bleu = sacrebleu.corpus_bleu(hypotheses, references)
chrf = sacrebleu.corpus_chrf(hypotheses, references)
print(f"BLEU: {bleu.score:.1f}  chrF: {chrf.score:.1f}")
```

始终使用 `sacrebleu`. سوف تقييم الجهازات، فجعلت النسبة يمكن مقارنة بين الأوراق.

### ثلاثى مستوى التقييم (2026)

现代 MT تقييم استخدام ثلاث فئات مترية متكاملة.

- **Heuristic**(BLEU, chrF) ―― 快速、基于参考、可解释, ولكن لا حساسة لفصائل
- **Learned**(COMET، BLEURT، BERTScore)  في الحكم البشري 上训练的神经模型; مقارنة الترجمة مع التشابه الزمني للمصدر والإشارة‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
- **LLM-as-judge**(حرة من الإشارات)  تقتضي نموذج كبير على أساس السهولة والكفاءة والنغمة والمناسبة الثقافية لترجمات 打分── عندما يتم تصميم النص بشكل جيد، فإن معدل التكيف بين GPT-4 كقاضي مع الإنسان يتراوح بنحو 80%── للمحتوى المفتوح دون إشارة──

عملية 2026 كومة:用 `sacrebleu`计算 BLEU 和 chrF,用 `unbabel-comet`计算 COMET,并用提示 LLM 作为最终面向人类的信号──在信任任何指标 用生产数据 之前,先用50-100 个标签的人类的例子 进行校准──

المقاييس الخالية من المراجع ((COMET-QE، BLEURT-QE، LLM-as-judge) تسمح لك بتقييم الترجمات في حالة عدم وجود مرجع، وهذا بالنسبة لمعدل وجود مترجمات مرجعية لزوج اللغة الطويلة 很重要.

### الخطوة الثالثة: إنتاج وسط سيئة في أي مكان

النظام الأعلى للعمل في 80% من الحالات سوف تتدفق، في حين في 20% المتبقية سوف تفشل.

- **Hallucination.**النموذج 发明源 中不存在的内容──常见于不熟悉的域词典──症状:output 很流,但声称源 没有陈述的事实──调解:对域术语使用限制解码,对受管制内容使用人文审查,并监控输出 是否比输入 长很多──
- **Off-target generation.**النموذج 翻译成错误语言──NLLB في أزواج اللغات النادرة 上尤其容易出现这个问题──Mitiation:验证 `forced_bos_token_id`,并始终使用语言-ID 检查输出模型检查
- **Terminology drift.**"الوقوع" في doc 1 中 تحول إلى "الوقوع" في doc 2 中 تحول إلى "الإنشاء على حساب"。 بالنسبة إلى نص UI وسلسلة مواجهة المستخدم، التوافق مقارنة بالجودة الخام 更重要──
- **Formality mismatch.**法语 "ت" مقابل "أنت"،日语 مهذبية المستويات.
- **Length explosion on short input.**很短的输入句子 经常产生过长的翻译,因为在低于大约5代码源代码 时长处罚 会突然失效──: 缓解: 使用与源长 成比例的硬最大长 cap──:

### الخطوة 4: لسلطة واحدة

النماذج المتدربة هي عامة. القانونية والطبية أو ترجمة الحوار اللعبية سوف تستفيد بشكل واضح من إضافة البيانات المتوازية إلى المجال.

```python
from transformers import Trainer, TrainingArguments
from datasets import Dataset

pairs = [
    {"src": "The defendant pleaded guilty.", "tgt": "L'accusé a plaidé coupable."},
]

ds = Dataset.from_list(pairs)


def preprocess(ex):
    return tok(
        ex["src"],
        text_target=ex["tgt"],
        truncation=True,
        max_length=128,
        padding="max_length",
    )


ds = ds.map(preprocess, remove_columns=["src", "tgt"])

args = TrainingArguments(output_dir="out", per_device_train_batch_size=4, num_train_epochs=3, learning_rate=3e-5)
Trainer(model=model, args=args, train_dataset=ds).train()
```

几千个高质量平行例子 胜过几十万个有噪音的网页剪辑例子──培训数据质量是生产中最大的单一杆──

## استخدمها
نطاق إنتاج المياه المئوية لعام 2026:

| Use case | Recommended starting point |
|---------|---------------------------|
| Any-to-any, 200 languages | `facebook/nllb-200-distilled-600M`（laptop）或 `nllb-200-3.3B`（production） |
| English-centric, high quality, 50 languages | `facebook/mbart-large-50-many-to-many-mmt` |
| Short runs, cheap inference, English-French/German/Spanish | Helsinki-NLP / Marian models |
| Latency-critical browser-side | ONNX-quantized Marian（~50 MB） |
| Maximum quality, willing to pay | GPT-4 / Claude / Gemini with translation prompts |

截至 2026 سنة، تمت تجاوز LLM في عدة أزواج اللغات 上 قد تجاوزت النماذج المتخصصة MT، وخاصة في المحتوى الزمني و السياق الطويل 上。取舍是 تكلفة لكل رمز و تأخر.

## 交付 it
保存为 `outputs/skill-mt-evaluator.md`:

```markdown
---
name: mt-evaluator
description: Evaluate a machine translation output for shipping.
version: 1.0.0
phase: 5
lesson: 11
tags: [nlp, translation, evaluation]
---

给定 source text 和 candidate translation，输出：

1. Automatic score estimate。你预期的 BLEU 和 chrF ranges。说明是否有 reference。
2. 五点 human-verifiable check list：(a) content preservation（无 hallucinations），(b) correct language，(c) register / formality match，(d) terminology consistency with glossary if provided，(e) 无 truncation 或 length explosion。
3. 一个需要探查的 domain-specific issue。例如 legal：named entities 和 statute citations。medical：drug names 和 dosages。UI：placeholder variables `{name}`。
4. Confidence flag。"Ship" / "Ship with review" / "Do not ship"。将它与 step 2 中发现的问题 severity 绑定。

如果 output 没有 language-ID check，拒绝 ship translation。除非 user 明确选择 reference-free scoring（COMET-QE, BLEURT-QE），否则拒绝在没有 reference 的情况下 evaluate。标记任何超过 1000 tokens 的内容，因为它很可能需要 chunked translation。
```

## التدريب
1. **Easy.**استخدام `nllb-200-distilled-600M`将一个 5 句英文段落翻译成法语,再翻译回英语──衡量回回回旅行与原始的接近程度──你应该看到语义保存,同时伴随词选择漂移──
2. **Medium.**استخدام `fasttext lid.176`أو`langdetect`لإنتاجات الترجمة 实现 language-ID check──将其集集成到MT call 中,让非目标世代 在返回前被捕──
3. **Hard.**في اختيارك 5000 زوج من الدومينات الجسم على المزج`nllb-200-distilled-600M` في التنسيق الدقيق  بعد ذلك، باستخدام مجموعة متواصلة  قياس BLEU‬  تقرير أي أنواع الجمل  تحسن، أي ظهور التراجع‬

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| BLEU | Translation score | 带 brevity penalty 的 N-gram precision。[0, 100]。 |
| chrF | Character F-score | Character-level F-score。对形态丰富的语言更敏感。 |
| NMT | Neural MT | 在 parallel text 上训练的 Transformer encoder-decoder。2017+ default。 |
| NLLB | No Language Left Behind | Meta 的 200-language MT model family。 |
| Constrained decoding | Controlled output | 强制特定 tokens 或 n-grams 在 output 中出现 / 不出现。 |
| Hallucination | Invented content | source 不支持的 model output。 |

## 延伸阅读
- [Costa-jussà et al. (2022). No Language Left Behind: Scaling Human-Centered Machine Translation](https://arxiv.org/abs/2207.04672)ورقة الجامعة الوطنية للدراسات العليا
- [Post (2018). A Call for Clarity in Reporting BLEU Scores](https://aclanthology.org/W18-6319/)لماذا ؟`sacrebleu`هو الطريقة الصحيحة الوحيدة لتقرير BLEU
- [Popović (2015). chrF: character n-gram F-score for automatic MT evaluation](https://aclanthology.org/W15-3049/)ورق كرومونيوم
- [Hugging Face MT guide](https://huggingface.co/docs/transformers/tasks/translation) 實用 fine-tuning walkthrough──
