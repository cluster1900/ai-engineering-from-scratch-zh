# التهمس والعمارة والتنظيم

> فيسبر هو مُعدل مُعدل النوافذ المُعدل لـ 30 ثانية، تدرب على 680 ألف زوج من النص الصوتي والنصي المتعدد اللغات الضعيفة الإشراف عليها.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 5 · 10 (Attention), Phase 7 · 05 (Full Transformer)
**Time:** ~75 分钟

## المشكلة

ويشبر من قبل OpenAI في سبتمبر 2022 ، هو أول نموذج ASR في التسليم إلى السلع: ضغط الصوت ، الحصول على النص ، دعم 99 种语言 ، على الضجيج قوية ، يمكن استخدامها على الكمبيوتر المحمول. حتى عام 2024, OpenAI قد أصدرت إصدارات Large-v3 و Turbo. حتى عام 2026, ويشبر هو من ترجمة البودكاست إلى مساعدات الصوت وإلى قاعدة افتراضية للفضائل الفرعية على YouTube.

لكن النمسة ليست خط أنابيب يمكن استخدامها للأبد في الصندوق الأسود.

1. إنه بداخله
2. كيف يمكن أن يكون هذا الصوت طويل الأمد؟
3. كيف تتمكن من التأقلم؟

## المفهوم

![Whisper encoder-decoder, tasks, chunked inference, fine-tune](../assets/whisper.svg)

**Architecture。**标准 محول إكودر-إكودر

- المدخل 30 ثانية المخططات المرسومة، 80 ميل، 10 ms قفز → 3000 إطارها.
- رمز:conv-downsample (خطوة 2) + `N`كتلة تحويلات... على طبقات كبيرة...
- المُفكِّر:带 causal self-attn + إلى إنتاج المُفكِّر القيام بتحقيق التقاطع `N`كتلة تحويلات الكهرباء 
- الناتج: تغطي 51،865 رمزية الكلمات من رموز BPE.

الحجم الكبير من v3 لديه 1.55B المعلمات.

**Prompt format。**الهمس هو عرض من قبل المقرر وسط رموز خاصة  التحكم نموذج multitask:

```text
<|startoftranscript|><|en|><|transcribe|><|notimestamps|> Hello world.<|endoftext|>
```

- `<|en|>` علامة اللغة؛ إضطراب الترجمة مقابل النسخة 行为──
- `<|transcribe|>`أو`<|translate|>` من إدخال لغة إرادي 翻译为英语输出,或逐字转写。
- `<|notimestamps|>` 跳过 word-level timestamps (((更快) 💚

بسرعة 让一个模型能够完成很多任务──把 `<|en|>`改成 `<|fr|>`، سوف تُرجّع إلى الفرنسية

**30-second window。**كل شيء ثابت في 30 ثانية. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

**Log-mel normalization。** `(log_mel - mean) / std`، والحسابات من Whisper  التدريب الخاص بك كوربوس.`whisper.audio.log_mel_spectrogram`), بدلاً من `librosa.feature.melspectrogram`.

### الإختلافات في عام 2026

| Variant | Params | Latency (A100) | WER (LibriSpeech-clean) |
|---------|--------|----------------|------------------------|
| Tiny | 39M | 1× realtime | 5.4% |
| Base | 74M | 1× | 4.1% |
| Small | 244M | 1× | 3.0% |
| Medium | 769M | 1× | 2.7% |
| Large-v3 | 1.55B | 2× | 1.8% |
| Large-v3-turbo | 809M | 8× | 1.58% |
| Whisper-Streaming (2024) | 1.55B | streaming | 2.0% |

### التنسيق الدقيق

سير العمل القنوني لعام 2026:

1. جمع 10100 小时目标领域 الصوت،并配有排列 النصوص
2. استخدام `transformers.Seq2SeqTrainer`,带 `generate_with_loss`إعادة الاتصال
3. فعالية المعايير: في طبقات الاهتمام`q_proj`.`k_proj`.`v_proj`上使用LORA,可将GPU ذاكرة 降低4×,WER 代价 <0.3──
4. إذا كنت فقط <10 小时, تجمد المُشفّر.
5. استخدام فيسبر  Tokenizer الخاص و أسلوب الإرسال؛ لا حاجة إلى استبدال tokenizer‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

社区结果: في 20 ساعات الطبية إملاء على المزيفة العالية المتوسطة، سوف تحلل المفردات الطبية العليا من WER من 12% 降低 إلى 4.5%  في 4 ساعات الإيسلاندية Turbo العليا المزيفة، سوف تحلل WER من 18% 降低 إلى 6% 


```figure
sp-asr-attention
```

## بناءها

### الخطوة الأولى: 直接运行 همس

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe(
    "clip.wav",
    language="en",
    task="transcribe",
    temperature=0.0,
    condition_on_previous_text=False,  # prevents runaway repetition
)
print(result["text"])
for seg in result["segments"]:
    print(f"[{seg['start']:.2f}–{seg['end']:.2f}] {seg['text']}")
```

يجب أن تغطي دائماً الإعدادات الرئيسية:`temperature=0.0`(المعينة 默认是 0.0 → 0.2 → 0.4 ... سلسلة الرد الخلفي)`condition_on_previous_text=False`(منع مشكلة الهلوسة في حالة طفرة) ، و`no_speech_threshold=0.6`(اكتشاف الصمت)

### الخطوة الثانية: شكل طويل

```python
# whisperx is the 2026 reference for long-form with word-level timestamps
import whisperx
model = whisperx.load_model("large-v3-turbo", device="cuda", compute_type="float16")
segments = model.transcribe("1hour.mp3", batch_size=16, chunk_size=30)
```

ويشبر إكس 添加了 (1) سيلرو VAD غاتين،(2) 通过 wav2vec 2.0`pyannote.audio`القيام بتجريدات اليومية. إنها حصان عمل لإنتاج النسخة عام 2026.

### الخطوة الثالثة: استخدام LoRA

```python
from transformers import WhisperForConditionalGeneration, WhisperProcessor
from peft import LoraConfig, get_peft_model

model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-large-v3-turbo")
lora = LoraConfig(
    r=16, lora_alpha=32, target_modules=["q_proj", "v_proj"],
    lora_dropout=0.1, bias="none", task_type="SEQ_2_SEQ_LM",
)
model = get_peft_model(model, lora)
# model.print_trainable_parameters()  -> ~3M trainable / 809M total
```

ثم استخدام الحلقة المعيارية التدريبية.

### الخطوة الرابعة: تحقق كل طبقة تعلمت ما

```python
# Grab cross-attention weights during decode to see what the decoder attends to.
with torch.inference_mode():
    out = model.generate(
        input_features=features,
        return_dict_in_generate=True,
        output_attentions=True,
    )
# out.cross_attentions: layer × head × step × src_len
```

باستخدام خريطة الحرارة 可视化، سترى خطوات المُعبرة 扫过码器框架 时形成横向对齐── This diagonal 就是 Whisper على فهم العلامات الزمنية الكلمة──

## استخدمها

2026 كومة:

| Situation | Pick |
|-----------|------|
| 通用 English，offline | 通过 `whisperx` 使用 Large-v3-turbo |
| Mobile / edge | Whisper-Tiny quantized (int8) 或 Moonshine |
| Multilingual long-form | Large-v3 via `whisperx` + diarization |
| Low-resource language | 用 LoRA fine-tune Medium 或 Turbo |
| Streaming（2 s latency） | Whisper-Streaming 或 Parakeet-TDT |
| Word-level timestamps | WhisperX（通过 wav2vec 2.0 forced alignment） |

`faster-whisper`(CTranslate2 backend) هو أسرع وقت تشغيل CPU + GPU في عام 2026 ، مقارنة بالفانيليا 快 4× ، نفس المخرج

## الفخاخ التي لا تزال تشغل في عام 2026

- **Hallucinated text on silence。*** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
- **`condition_on_previous_text` cascade。**الهلوسة ستغمر النوافذ بعد ذلك إلا إذا كنت بحاجة إلى تدفق عبر قطع، وإلا ستضع`False`.
- **Short-clip padding。**إملع مقطع لمدة 2 ثوان بعد 30 ثانية، ربما تسهل في الصوت الصوت الصامت في نهاية القصة`pad=False`أو بوابة الفاد
- **Wrong mel stats。**استخدام المكتبات من الملفات وليس من الملفات التهمسية، سوف تحدث تقريباً في أي وقت.`whisper.audio.log_mel_spectrogram`.

## أرسله

保存为 `outputs/skill-whisper-tuner.md`◊ لسلطات محددة  تصميم تصميمات تصفير أو استنتاجات

## التمارين

1. **Easy.**运行 `code/main.py`.إنها سوف تُرمز إلى عرض فيسبر، حساب ميزانيات الشكل المفكّرة،并印ت جدول المقاطع لمدة 10 دقائق‬
2. **Medium.**إعداد`faster-whisper`,转写一个10分钟播客,并与人类转录比较WER――尝试 `language="auto"`مع الإجبار`language="en"`.
3. **Hard.**استخدام HF `datasets`, اختيار نوع من لغة "سوسر" (مثلاً الاردو) ، في 2 ساعات من البيانات على استخدام "لورا" (LoRA)

## الشروط الرئيسية

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| 30-sec window | Whisper 的限制 | 硬性 input cap；对更长 audio 做 chunk。 |
| SOT | Start-of-transcript | `<\|startoftranscript\|>` 启动 decoder prompt。 |
| Timestamps token | Temporal alignment | 每个 0.02 s offset 都是 51k vocab 中的 special token。 |
| Turbo | 快速 variant | 4-decoder layers，快 8×，<1% WER regression。 |
| WhisperX | long-form wrapper | VAD + Whisper + wav2vec alignment + diarization。 |
| LoRA fine-tune | Efficient tuning | 向 attention 添加 low-rank adapters；训练约 0.3% 的 params。 |
| Hallucination | 静音 failure | Whisper 从 noise/silence 中产生流畅 English。 |

## المزيد من القراءة

- [Radford et al. (2022). Whisper paper](https://arxiv.org/abs/2212.04356) معمارة أولى و وصفة تدريبية
- [OpenAI (2024). Whisper Large-v3-turbo release](https://github.com/openai/whisper/discussions/2363) مُشفّر 4 طبقات، 8× تسريع
- [Bain et al. (2023). WhisperX](https://arxiv.org/abs/2303.00747) شكل طويل ‬مُحَسَّنَة بالكلمات ‬مُتَأَلَّفَة
- [Systran — faster-whisper repo](https://github.com/SYSTRAN/faster-whisper) CTranslate2 مدعومة، 快 4×。
- [HuggingFace — Whisper fine-tune tutorial](https://huggingface.co/blog/fine-tune-whisper) القنوني لورا / كامل-FT المشي عبرها。
